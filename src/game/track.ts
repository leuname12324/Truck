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

const N = 1440; // 3x mais amostras = pista 3x mais longa

/**
 * Resample a closed polyline at `steps` points evenly spaced by arc length.
 * The Catmull-Rom pass is uniform in *parameter*, but the raw points are not
 * evenly spaced in metres — some samples ended up ~15 m apart and others ~1 m,
 * which both faceted the mesh and made a fraction of the lap mean a different
 * distance in different corners.
 */
function resampleInto(pts: { x: number; z: number }[], steps: number) {
  const cum: number[] = [0];
  for (let i = 0; i < steps; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % steps];
    cum.push(cum[i] + Math.hypot(b.x - a.x, b.z - a.z));
  }
  const total = cum[steps] || 1;
  const stepLen = total / steps;
  const out: { x: number; z: number }[] = [];
  let seg = 0;
  for (let k = 0; k < steps; k++) {
    const target = k * stepLen;
    while (seg < steps - 1 && cum[seg + 1] < target) seg++;
    const a = pts[seg];
    const b = pts[(seg + 1) % steps];
    const span = cum[seg + 1] - cum[seg];
    const f = span > 1e-9 ? (target - cum[seg]) / span : 0;
    out.push({ x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f });
  }
  for (let i = 0; i < steps; i++) {
    pts[i].x = out[i].x;
    pts[i].z = out[i].z;
  }
  return stepLen;
}

export const SAMPLES: Sample[] = [];

function buildSamples() {
  const nPts = RAW_POINTS.length;
  const steps = N;
  // Para ter uma pista 3x mais longa, repetimos o traçado original 3 vezes
  // como se fosse um circuito contínuo estendido. Assim o carro percorre
  // 3x a distância antes de completar uma "volta".
  const extended: { x: number; z: number }[] = [];
  for (let rep = 0; rep < 3; rep++) {
    for (let i = 0; i < nPts; i++) {
      extended.push({ x: RAW_POINTS[i].x, z: RAW_POINTS[i].z });
    }
  }
  const extLen = extended.length;
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

  // Gerar pontos intermediários via Catmull-Rom sobre o traçado estendido (3x)
  for (let i = 0; i < steps; i++) {
    const f = (i / steps) * extLen;
    const i1 = Math.floor(f) % extLen;
    const local = f - Math.floor(f);
    const i0 = (i1 - 1 + extLen) % extLen;
    const i2 = (i1 + 1) % extLen;
    const i3 = (i1 + 2) % extLen;
    const P = [extended[i0], extended[i1], extended[i2], extended[i3]];
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

  // One sample per equal distance from here on.
  resampleInto(pts, steps);

  // Keep the two parts of the lap that really run side by side from melting
  // into one ribbon. Only sections that are far apart *along the lap* count:
  // a hairpin's two straights are close in space on purpose, and pushing those
  // apart was flattening the corners.
  const minGap = TRACK_HALF_WIDTH * 2 + 6;
  const SEPARATE_M = 400;
  const stepLen = TRACK_LENGTH / steps;
  const separate = (passes: number) => {
    for (let pass = 0; pass < passes; pass++) {
      for (let i = 0; i < steps; i++) {
        for (let j = i + 1; j < steps; j++) {
          const gapM = Math.min(j - i, steps - (j - i)) * stepLen;
          if (gapM < SEPARATE_M) continue;
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
  // Separing smooths the spacing; restore one sample per equal distance.
  resampleInto(pts, steps);

  for (let i = 0; i < steps; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % steps];
    let tx = b.x - a.x;
    let tz = b.z - a.z;
    const len = Math.hypot(tx, tz) || 1;
    tx /= len;
    tz /= len;
    // `t` is now both the sample index fraction and the distance fraction.
    const t = i / steps;
    const y = elevAt(t);
    const y2 = elevAt((i + 1) / steps);
    const ty = (y2 - y) / (stepLen || 1);
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
      s: i * stepLen,
    });
  }
}

buildSamples();

// Free lateral space on each side of the centreline, in metres.
//
// The old version intersected a small circle with every other sample, including
// the samples a few dozen metres ahead on the *same* corner, so the room
// collapsed to zero on tight turns and `clampOffset()` squashed the road (and
// the kerbs, runoff and wall) into the corner. Here we only look at parts of
// the lap that are far away along the track and use half the real distance to
// the nearest of those: symmetric walls never cross each other.
const CLEARANCE_M = 400; // metres along the lap — same stretch of track
const CLEARANCE_MAX = 60; // metres

const roomPos = new Float32Array(N);
const roomNeg = new Float32Array(N);
{
  for (let i = 0; i < N; i++) {
    const s = SAMPLES[i];
    let pos = CLEARANCE_MAX;
    let neg = CLEARANCE_MAX;
    for (let j = 0; j < N; j++) {
      let ds = Math.abs(SAMPLES[j].s - s.s);
      if (TRACK_LENGTH - ds < ds) ds = TRACK_LENGTH - ds;
      if (ds < CLEARANCE_M) continue;
      const a = SAMPLES[j];
      const b = SAMPLES[(j + 1) % N];
      const ex = b.x - a.x;
      const ez = b.z - a.z;
      const el = ex * ex + ez * ez || 1;
      let k = ((s.x - a.x) * ex + (s.z - a.z) * ez) / el;
      k = k < 0 ? 0 : k > 1 ? 1 : k;
      const dx = a.x + ex * k - s.x;
      const dz = a.z + ez * k - s.z;
      const d = Math.hypot(dx, dz);
      if (d < 1e-3) continue;
      const room = d * 0.5;
      if (dx * s.nx + dz * s.nz >= 0) pos = Math.min(pos, room);
      else neg = Math.min(neg, room);
    }
    roomPos[i] = Math.min(CLEARANCE_MAX, pos);
    roomNeg[i] = Math.min(CLEARANCE_MAX, neg);
  }
}

export function lateralRoom(index: number, side: number) {
  const i = ((index % N) + N) % N;
  return side >= 0 ? roomPos[i] : roomNeg[i];
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
  const prev = SAMPLES[(best - 1 + N) % N];
  const next = SAMPLES[(best + 1) % N];
  const dx = x - p.x;
  const dz = z - p.z;
  // Project the point onto the closest segment of the centreline. Using the
  // raw sample was quantising the truck height (`sample.y`) into 4.5 m steps,
  // which read as a jittery / bumpy ride.
  const forward = dx * p.tx + dz * p.tz;
  const a = forward >= 0 ? p : prev;
  const b = forward >= 0 ? next : p;
  const ex = b.x - a.x;
  const ez = b.z - a.z;
  const el = ex * ex + ez * ez || 1;
  let k = ((x - a.x) * ex + (z - a.z) * ez) / el;
  k = k < 0 ? 0 : k > 1 ? 1 : k;
  const px = a.x + ex * k;
  const pz = a.z + ez * k;
  const py = a.y + (b.y - a.y) * k;
  let nx = a.nx + (b.nx - a.nx) * k;
  let nz = a.nz + (b.nz - a.nz) * k;
  const nl = Math.hypot(nx, nz) || 1;
  nx /= nl;
  nz /= nl;
  const lateral = (x - px) * nx + (z - pz) * nz;
  const absLat = Math.abs(lateral);
  const t = wrap01(a.t + progressDelta(a.t, b.t) * k);
  return {
    t,
    s: a.s + (b.s - a.s) * k,
    lateral,
    onTrack: absLat < TRACK_HALF_WIDTH,
    sample: { ...p, x: px, y: py, z: pz, nx, nz, t },
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
