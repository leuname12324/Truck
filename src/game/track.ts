import { RAW_POINTS, TRACK_HALF_WIDTH, TRACK_LENGTH } from "./interlagos-points";

export { TRACK_HALF_WIDTH, TRACK_LENGTH };

export type Sample = {
  x: number;
  y: number;
  z: number;
  tx: number;
  ty: number;
  tz: number;
  nx: number;
  nz: number;
  t: number;
  s: number;
};

const ELEV: { t: number; y: number }[] = [
  { t: 0.0, y: 12 },
  { t: 0.06, y: 6 },
  { t: 0.1, y: 4 },
  { t: 0.18, y: 5 },
  { t: 0.3, y: 6 },
  { t: 0.36, y: 2 },
  { t: 0.45, y: 4 },
  { t: 0.52, y: 6 },
  { t: 0.58, y: 5 },
  { t: 0.64, y: 3 },
  { t: 0.72, y: 4 },
  { t: 0.82, y: 8 },
  { t: 0.92, y: 11 },
  { t: 1.0, y: 12 },
];

function elevAt(t: number): number {
  const u = ((t % 1) + 1) % 1;
  for (let i = 0; i < ELEV.length - 1; i++) {
    const a = ELEV[i];
    const b = ELEV[i + 1];
    if (u >= a.t && u <= b.t) {
      const k = (u - a.t) / (b.t - a.t);
      const s = k * k * (3 - 2 * k);
      return a.y + (b.y - a.y) * s;
    }
  }
  return ELEV[0].y;
}

const N = 480;
export const SAMPLES: Sample[] = [];

function buildSamples() {
  const nPts = RAW_POINTS.length;
  const steps = N;
  const pts: { x: number; z: number }[] = [];

  const lerp = (
    A: { x: number; z: number },
    B: { x: number; z: number },
    ta: number,
    tb: number,
    tc: number,
  ) => {
    const d = tb - ta || 1e-4;
    const a = (tb - tc) / d;
    const b = (tc - ta) / d;
    return { x: A.x * a + B.x * b, z: A.z * a + B.z * b };
  };

  for (let i = 0; i < steps; i++) {
    const f = (i / steps) * nPts;
    const i1 = Math.floor(f) % nPts;
    const local = f - Math.floor(f);
    const i0 = (i1 - 1 + nPts) % nPts;
    const i2 = (i1 + 1) % nPts;
    const i3 = (i1 + 2) % nPts;
    const P = [RAW_POINTS[i0], RAW_POINTS[i1], RAW_POINTS[i2], RAW_POINTS[i3]];
    const knot = (a: { x: number; z: number }, b: { x: number; z: number }) =>
      Math.max(1e-4, Math.hypot(b.x - a.x, b.z - a.z) ** 0.5);
    const t0 = 0;
    const t1 = knot(P[0], P[1]);
    const t2 = t1 + knot(P[1], P[2]);
    const t3 = t2 + knot(P[2], P[3]);
    const t = t1 + (t2 - t1) * local;
    const A1 = lerp(P[0], P[1], t0, t1, t);
    const A2 = lerp(P[1], P[2], t1, t2, t);
    const A3 = lerp(P[2], P[3], t2, t3, t);
    const B1 = lerp(A1, A2, t0, t2, t);
    const B2 = lerp(A2, A3, t1, t3, t);
    pts.push(lerp(B1, B2, t1, t2, t));
  }

  // Keep two passes of the circuit from melting into one ribbon.
  const minGap = TRACK_HALF_WIDTH * 2 + 6;
  const separate = (passes: number) => {
    for (let pass = 0; pass < passes; pass++) {
      for (let i = 0; i < steps; i++) {
        for (let j = i + 18; j < steps; j++) {
          const gap = Math.min(j - i, steps - (j - i));
          if (gap < 18) continue;
          const dx = pts[j].x - pts[i].x;
          const dz = pts[j].z - pts[i].z;
          const d = Math.hypot(dx, dz);
          if (d >= minGap || d < 1e-3) continue;
          const push = (minGap - d) * 0.35;
          const nx = dx / d;
          const nz = dz / d;
          pts[i].x -= nx * push;
          pts[i].z -= nz * push;
          pts[j].x += nx * push;
          pts[j].z += nz * push;
        }
      }
    }
  };
  separate(5);
  const copy = pts.map((p) => ({ x: p.x, z: p.z }));
  for (let i = 0; i < steps; i++) {
    const a = copy[(i - 1 + steps) % steps];
    const b = copy[i];
    const c = copy[(i + 1) % steps];
    pts[i].x = a.x * 0.18 + b.x * 0.64 + c.x * 0.18;
    pts[i].z = a.z * 0.18 + b.z * 0.64 + c.z * 0.18;
  }
  separate(4);

  let sAcc = 0;
  const dists: number[] = [];
  for (let i = 0; i < steps; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % steps];
    const d = Math.hypot(b.x - a.x, b.z - a.z);
    dists.push(d);
    sAcc += d;
  }
  const scaleS = TRACK_LENGTH / sAcc;

  let s = 0;
  for (let i = 0; i < steps; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % steps];
    let tx = b.x - a.x;
    let tz = b.z - a.z;
    const len = Math.hypot(tx, tz) || 1;
    tx /= len;
    tz /= len;
    const t = s / TRACK_LENGTH;
    const y = elevAt(t);
    const y2 = elevAt((s + dists[i] * scaleS) / TRACK_LENGTH);
    const horiz = dists[i] * scaleS;
    const ty = (y2 - y) / (horiz || 1);
    const nlen = Math.hypot(1, ty);
    SAMPLES.push({
      x: a.x,
      y,
      z: a.z,
      tx,
      ty: ty / nlen,
      tz,
      nx: -tz,
      nz: tx,
      t,
      s,
    });
    s += horiz;
  }
}

buildSamples();

const latPos = new Float32Array(N);
const latNeg = new Float32Array(N);
{
  const R = TRACK_HALF_WIDTH + 0.9;
  const R2 = R * R;
  for (let i = 0; i < N; i++) {
    let pos = 42;
    let neg = 42;
    const s = SAMPLES[i];
    for (let j = 0; j < N; j += 2) {
      const gap = Math.min(Math.abs(j - i), N - Math.abs(j - i));
      if (gap < 8) continue;
      const o = SAMPLES[j];
      const dx = s.x - o.x;
      const dz = s.z - o.z;
      const b = 2 * (dx * s.nx + dz * s.nz);
      const c = dx * dx + dz * dz - R2;
      const disc = b * b - 4 * c;
      if (disc <= 0) continue;
      const root = Math.sqrt(disc);
      const r1 = (-b - root) / 2;
      const r2 = (-b + root) / 2;
      if (c >= 0 && r1 > 0) pos = Math.min(pos, r1);
      else if (c < 0) pos = 0;
      if (c >= 0 && r2 < 0) neg = Math.min(neg, -r2);
      else if (c < 0) neg = 0;
    }
    latPos[i] = pos;
    latNeg[i] = neg;
  }
}

export function lateralRoom(index: number, side: number) {
  const i = ((index % N) + N) % N;
  return side >= 0 ? latPos[i] : latNeg[i];
}

export function wrap01(t: number): number {
  return ((t % 1) + 1) % 1;
}

export function sampleAtT(t: number): Sample {
  const u = wrap01(t) * N;
  const i = Math.floor(u) % N;
  return SAMPLES[i];
}

export function sampleLerp(t: number): Sample {
  const u = wrap01(t) * N;
  const i = Math.floor(u) % N;
  const j = (i + 1) % N;
  const k = u - Math.floor(u);
  const a = SAMPLES[i];
  const b = SAMPLES[j];
  return {
    x: a.x + (b.x - a.x) * k,
    y: a.y + (b.y - a.y) * k,
    z: a.z + (b.z - a.z) * k,
    tx: a.tx + (b.tx - a.tx) * k,
    ty: a.ty + (b.ty - a.ty) * k,
    tz: a.tz + (b.tz - a.tz) * k,
    nx: a.nx + (b.nx - a.nx) * k,
    nz: a.nz + (b.nz - a.nz) * k,
    t: wrap01(t),
    s: a.s,
  };
}

export type Nearest = {
  t: number;
  s: number;
  lateral: number;
  onTrack: boolean;
  sample: Sample;
  dist: number;
  index: number;
};

export function nearestOnTrack(x: number, z: number, hint?: number): Nearest {
  const score = (i: number) => {
    const p = SAMPLES[i];
    return (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
  };

  let best = 0;
  let bestD = Infinity;

  if (hint !== undefined) {
    const i0 = Math.floor(wrap01(hint) * N);
    const win = 36;
    for (let k = -win; k <= win; k++) {
      const i = (i0 + k + N) % N;
      const d = score(i);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    // Only trust the local window if the truck is still near that part of the lap.
    if (bestD > 28 * 28) {
      best = 0;
      bestD = Infinity;
    }
  }

  if (bestD === Infinity) {
    const stride = 8;
    for (let i = 0; i < N; i += stride) {
      const d = score(i);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    const start = best - stride;
    for (let k = 0; k <= stride * 2; k++) {
      const i = (start + k + N) % N;
      const d = score(i);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
  }

  const p = SAMPLES[best];
  const dx = x - p.x;
  const dz = z - p.z;
  const lateral = dx * p.nx + dz * p.nz;
  const absLat = Math.abs(lateral);
  return {
    t: p.t,
    s: p.s,
    lateral,
    onTrack: absLat < TRACK_HALF_WIDTH,
    sample: p,
    dist: Math.sqrt(bestD),
    index: best,
  };
}

export const CORNERS: { t: number; name: string }[] = [
  { t: 0.0, name: "Reta Principal" },
  { t: 0.07, name: "S do Senna" },
  { t: 0.14, name: "Curva do Sol" },
  { t: 0.22, name: "Reta Oposta" },
  { t: 0.33, name: "Descida do Lago" },
  { t: 0.47, name: "Ferradura" },
  { t: 0.53, name: "Laranjinha" },
  { t: 0.56, name: "Pinheirinho" },
  { t: 0.6, name: "Bico de Pato" },
  { t: 0.64, name: "Mergulho" },
  { t: 0.68, name: "Junção" },
  { t: 0.78, name: "Subida dos Boxes" },
  { t: 0.9, name: "Arquibancadas" },
];

export function cornerAt(t: number): string {
  const u = wrap01(t);
  let name = CORNERS[0].name;
  for (const c of CORNERS) {
    if (u + 0.012 >= c.t) name = c.name;
  }
  return name;
}

export const CHECKPOINTS: number[] = [0.0, 0.08, 0.16, 0.28, 0.4, 0.5, 0.6, 0.7, 0.82, 0.92];

export function progressDelta(from: number, to: number): number {
  let d = to - from;
  if (d > 0.5) d -= 1;
  if (d < -0.5) d += 1;
  return d;
}

export function yawFromTangent(tx: number, tz: number): number {
  return Math.atan2(-tx, -tz);
}

export const MINIMAP: { x: number; z: number }[] = SAMPLES.filter((_, i) => i % 4 === 0).map((s) => ({
  x: s.x,
  z: s.z,
}));
