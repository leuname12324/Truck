import {
  CHECKPOINTS,
  TRACK_HALF_WIDTH,
  TRACK_LENGTH,
  cornerAt,
  nearestOnTrack,
  lateralRoom,
  progressDelta,
  sampleLerp,
  yawFromTangent,
} from "./track";
import { LIVERIES, type Livery } from "./liveries";
import { TOTAL_LAPS_CONST } from "./store";
import type { Actions } from "./input";
import { getBrakePower } from "./tuning";

export type TruckSim = {
  x: number;
  y: number;
  z: number;
  yaw: number;
  speed: number;
  vx: number;
  vz: number;
  steerVis: number;
  slide: number;
  t: number;
  lap: number;
  nextCp: number;
  lapTime: number;
  lastLap: number;
  bestLap: number;
  finished: boolean;
  raceTime: number;
  livery: Livery;
  isPlayer: boolean;
  name: string;
  skill: number;
  boost: number;
  charge: number;
  drifting: boolean;
  wings: boolean;
  prevWings: boolean;
  susp: number;
};

const KMH = 1 / 3.6;
const TOP_SPEED = 230 * KMH;   // ~230 km/h com asa fechada
const WING_BONUS = 35 * KMH;   // ~265 km/h com asa aberta (230 + 35)
const BOOST_BONUS = 10 * KMH;
const ABS_CAP = 280 * KMH;
const ACCEL = 42;
const BRAKE = 46;
const DRAG = ACCEL / TOP_SPEED;
const TURN = 1.62;
const GRIP = 9.5;
const DRIFT_GRIP = 2.6;

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function spawnTruck(index: number, isPlayer: boolean, pace = 0.5, liveryIndex = index): TruckSim {
  const row = Math.floor(index / 2);
  const pole = index % 2 === 0;
  // Left of travel is the inside of the Senna S — pole sits there, just behind the line.
  const col = pole ? 2.8 : -2.8;
  const back = 7 + row * 11 + (pole ? 0 : 4.2);
  const s0 = sampleLerp(-back / TRACK_LENGTH);
  const x = s0.x + s0.nx * col;
  const z = s0.z + s0.nz * col;
  const liv = LIVERIES[liveryIndex] ?? LIVERIES[LIVERIES.length - 1];
  return {
    x,
    y: s0.y,
    z,
    yaw: yawFromTangent(s0.tx, s0.tz),
    speed: 0,
    vx: 0,
    vz: 0,
    steerVis: 0,
    slide: 0,
    t: s0.t,
    lap: 1,
    nextCp: 1,
    lapTime: 0,
    lastLap: 0,
    bestLap: 0,
    finished: false,
    raceTime: 0,
    livery: liv,
    isPlayer,
    name: isPlayer ? "Você" : liv.name,
    skill: isPlayer ? 1 : 0.79 + pace * 0.1,
    boost: 0,
    charge: 0,
    drifting: false,
    wings: false,
    prevWings: false,
    susp: 0,
  };
}

export function createField(): TruckSim[] {
  const n = LIVERIES.length;
  // The player lines up at the back of the grid so the chase camera never
  // starts inside a truck that is sitting behind the old pole slot.
  const field: TruckSim[] = [];
  for (let i = 0; i < n; i++) {
    field.push(i === 0 ? spawnTruck(n - 1, true, 0.5, 0) : spawnTruck(i - 1, false, (i - 1) / (n - 2), i));
  }
  return field;
}

function applyDrive(
  tr: TruckSim,
  throttle: number,
  brake: number,
  steer: number,
  drift: boolean,
  wings: boolean,
  dt: number,
) {
  const near = nearestOnTrack(tr.x, tr.z, tr.t);
  const absLat = Math.abs(near.lateral);
  // `HW` is the asphalt edge; the kerb runs a little further out, so the speed
  // penalty only starts once half the truck is past the kerb.
  const onSlow = absLat > TRACK_HALF_WIDTH + 1.2;
  const offTrack = absLat > TRACK_HALF_WIDTH + 0.9;
  tr.wings = wings && tr.speed > 2;
  // Boost imediato ao abrir a asa (efeito DRS-like): sobe a velocidade logo
  // ao acionar o Shift, não apenas ao longo do tempo.
  if (tr.wings && !tr.prevWings && tr.speed > 5) {
    tr.speed = Math.min(tr.speed + 18 * KMH, ABS_CAP);
  }
  tr.prevWings = tr.wings;

  const speedFactor = clamp(Math.abs(tr.speed) / 9, 0, 1) * (1 - 0.22 * clamp(Math.abs(tr.speed) / TOP_SPEED, 0, 1));
  const reverse = tr.speed >= 0 ? 1 : -1;
  const brakeTurn = 1 + brake * 0.28;
  tr.yaw += steer * TURN * speedFactor * brakeTurn * reverse * dt;
  tr.steerVis += (steer - tr.steerVis) * (1 - Math.exp(-12 * dt));

  if (throttle > 0) tr.speed += throttle * ACCEL * dt;
  if (tr.wings) tr.speed += DRAG * WING_BONUS * dt;
  if (brake > 0) {
    const force = BRAKE * getBrakePower();
    if (tr.speed > 0.4) tr.speed -= brake * force * dt;
    else tr.speed -= brake * ACCEL * 0.45 * dt;
  }

  tr.speed *= 1 - (DRAG + (throttle < 0.1 && brake < 0.1 ? 0.35 : 0)) * dt;
  if (tr.boost > 0) {
    tr.speed += 14 * dt;
    tr.boost = Math.max(0, tr.boost - dt);
  }
  let max = Math.min(ABS_CAP, TOP_SPEED + (tr.wings ? WING_BONUS : 0) + (tr.boost > 0 ? BOOST_BONUS : 0));
  if (onSlow) max *= 0.9;
  if (tr.speed > max) tr.speed += (max - tr.speed) * Math.min(1, 6 * dt);
  tr.speed = clamp(tr.speed, -12 * (onSlow ? 0.9 : 1), max + 0.4);

  const wasDrifting = tr.drifting;
  tr.drifting = drift && Math.abs(steer) > 0.2 && Math.abs(tr.speed) > 10;
  if (tr.drifting) {
    tr.charge = Math.min(1, tr.charge + dt * 0.75);
  } else if (wasDrifting && tr.charge > 0.28) {
    tr.boost = Math.max(tr.boost, 0.4 + tr.charge * 0.85);
    tr.charge = 0;
  } else {
    tr.charge = Math.max(0, tr.charge - dt * 0.4);
  }

  const fx = -Math.sin(tr.yaw);
  const fz = -Math.cos(tr.yaw);
  const rx = Math.cos(tr.yaw);
  const rz = -Math.sin(tr.yaw);

  tr.vx = fx * tr.speed;
  tr.vz = fz * tr.speed;

  const grip = tr.drifting ? DRIFT_GRIP : GRIP;
  // lateral slide as extra velocity
  const lat = tr.slide;
  tr.slide += -steer * Math.abs(tr.speed) * (tr.drifting ? 1.6 : 0.35) * dt;
  tr.slide *= Math.exp(-grip * dt);

  tr.x += (tr.vx + rx * lat) * dt;
  tr.z += (tr.vz + rz * lat) * dt;

  const n2 = nearestOnTrack(tr.x, tr.z, tr.t);
  // Suspensão sensível ao relevo: o caminhão sobe e desce com a elevação da
  // pista, reagindo até a pequenas mudanças de altura (relevo). O amortecimento
  // é baixo para sentir os ondulados do asfalto.
  const targetY = n2.sample.y + 0.72;
  tr.susp += (targetY - tr.susp) * (1 - Math.exp(-6 * dt));
  tr.y = tr.susp;
  const side = Math.sign(n2.lateral) || 1;
  const room = lateralRoom(n2.index, side);
  const wall = Math.min(TRACK_HALF_WIDTH + 8.2, Math.max(TRACK_HALF_WIDTH + 1.2, room - 0.8));
  if (Math.abs(n2.lateral) > wall) {
    const push = (Math.abs(n2.lateral) - wall) * Math.sign(n2.lateral);
    tr.x -= n2.sample.nx * push;
    tr.z -= n2.sample.nz * push;
    // Only the part of the velocity that drives into the barrier costs speed:
    // scraping along the wall should not glue the truck to a standstill.
    const outward = (tr.vx * n2.sample.nx + tr.vz * n2.sample.nz) * Math.sign(n2.lateral);
    if (outward > 0.5) {
      tr.speed *= 0.9;
      tr.slide *= 0.4;
    } else {
      tr.speed *= 0.997;
      tr.slide *= 0.92;
    }
  }

  const dProg = progressDelta(tr.t, n2.t);
  tr.t = n2.t;

  if (!tr.finished && dProg > 0) {
    const cpT = CHECKPOINTS[tr.nextCp];
    if (crossed(cpT, tr.t, dProg)) {
      if (tr.nextCp === 0) {
        tr.lastLap = tr.lapTime;
        if (tr.bestLap === 0 || tr.lapTime < tr.bestLap) tr.bestLap = tr.lapTime;
        if (tr.lap >= TOTAL_LAPS_CONST) {
          tr.finished = true;
          tr.speed *= 0.4;
        } else {
          tr.lap += 1;
          tr.lapTime = 0;
        }
      }
      tr.nextCp = (tr.nextCp + 1) % CHECKPOINTS.length;
    }
  }

  return { offTrack, near: n2, dProg };
}

/**
 * Did the step that ended at `now` pass the checkpoint at `toT`?
 *
 * The old test ignored any step with `dProg <= 0.0005` — that is 1.1 m per
 * fixed frame, so above ~65 km/h no checkpoint was ever counted and a race
 * could not finish. This works in unwrapped coordinates instead.
 */
function crossed(toT: number, now: number, dProg: number): boolean {
  if (dProg <= 0) return false;
  const start = now - dProg;
  let cp = toT;
  while (cp < start) cp += 1;
  return cp <= start + dProg;
}

function aiDrive(tr: TruckSim, dt: number): { throttle: number; brake: number; steer: number; drift: boolean; wings: boolean } {
  const sp = Math.abs(tr.speed);
  // Pure pursuit: a look-ahead measured in metres, not in "percent of the
  // lap". The old 0.045–0.09 lap target pointed 100–190 m ahead, so the AI cut
  // every hairpin and parked itself on the barrier.
  const look = (16 + sp * 0.55) / TRACK_LENGTH;
  const target = sampleLerp(tr.t + look);
  const toX = target.x - tr.x;
  const toZ = target.z - tr.z;
  const wantYaw = Math.atan2(-toX, -toZ);
  let err = wantYaw - tr.yaw;
  while (err > Math.PI) err -= Math.PI * 2;
  while (err < -Math.PI) err += Math.PI * 2;
  // Player-visible: +steer = left = +yaw
  const steer = clamp(err * 2.1, -1, 1);

  // Sharpest heading change over the next ~120 m sets the corner speed. The
  // AI uses the same yaw-rate limit as the player, minus a safety margin, so
  // it neither crawls nor drives through the barrier.
  let curv = 0;
  for (let k = 1; k <= 4; k++) {
    const a = sampleLerp(tr.t + (k * 24) / TRACK_LENGTH);
    const b = sampleLerp(tr.t + ((k + 1) * 24) / TRACK_LENGTH);
    let turn = Math.atan2(a.tx, a.tz) - Math.atan2(b.tx, b.tz);
    while (turn > Math.PI) turn -= Math.PI * 2;
    while (turn < -Math.PI) turn += Math.PI * 2;
    curv = Math.max(curv, Math.abs(turn));
  }
  const radius = (24 / Math.max(0.03, curv));
  const yawLimit = (TURN * radius) / (1 + 0.00513 * radius);
  const vMax = Math.min(TOP_SPEED * 0.98, yawLimit) * (0.88 + tr.skill * 0.08);
  let throttle = 1;
  let brake = 0;
  if (sp > vMax + 3) {
    brake = clamp((sp - vMax) / 10, 0.3, 1);
    throttle = 0;
  } else if (sp > vMax) {
    throttle = 0.25;
  }

  void dt;
  return { throttle, brake, steer, drift: false, wings: curv < 0.05 && sp > 30 };
}

export type StepInfo = {
  player: TruckSim;
  field: TruckSim[];
  offTrack: boolean;
  wrongWay: boolean;
  corner: string;
};

export function stepField(field: TruckSim[], playerActions: Actions, dt: number, racing: boolean): StepInfo {
  const player = field[0];

  let offTrack = false;
  let dProg = 0;

  if (racing && !player.finished) {
    const r = applyDrive(
      player,
      playerActions.throttle,
      playerActions.brake,
      playerActions.steer,
      playerActions.drift,
      playerActions.wings,
      dt,
    );
    player.lapTime += dt;
    player.raceTime += dt;
    offTrack = r.offTrack;
    dProg = r.dProg;
  } else {
    const n = nearestOnTrack(player.x, player.z, player.t);
    player.y = n.sample.y;
    offTrack = !n.onTrack;
    dProg = 0;
    player.speed *= Math.exp(-3 * dt);
  }

  if (racing) {
    for (let i = 1; i < field.length; i++) {
      const tr = field[i];
      if (tr.finished) {
        // Coast to a stop without the reverse creep the brake model produces
        // at zero speed.
        applyDrive(tr, 0, 0, 0, false, false, dt);
        continue;
      }
      const a = aiDrive(tr, dt);
      applyDrive(tr, a.throttle, a.brake, a.steer, a.drift, a.wings, dt);
      tr.lapTime += dt;
      tr.raceTime += dt;
    }
  }

  // Oriented truck-vs-truck separation: two 2.4 × 5.3 m boxes, not two 3.4 m
  // circles (which overlapped nose-to-tail and shoved side-by-side pairs).
  const HALF_LEN = 4.3;
  const HALF_WID = 2.2;
  for (let i = 0; i < field.length; i++) {
    for (let j = i + 1; j < field.length; j++) {
      const a = field[i];
      const b = field[j];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const fx = -Math.sin(a.yaw);
      const fz = -Math.cos(a.yaw);
      const rx = Math.cos(a.yaw);
      const rz = -Math.sin(a.yaw);
      const along = dx * fx + dz * fz;
      const across = dx * rx + dz * rz;
      const penL = HALF_LEN - Math.abs(along);
      const penW = HALF_WID - Math.abs(across);
      if (penL <= 0 || penW <= 0) continue;
      const half = Math.min(penL, penW) * 0.5;
      if (penW < penL) {
        const s = across >= 0 ? 1 : -1;
        a.x -= rx * s * half;
        a.z -= rz * s * half;
        b.x += rx * s * half;
        b.z += rz * s * half;
      } else {
        const s = along >= 0 ? 1 : -1;
        a.x -= fx * s * half;
        a.z -= fz * s * half;
        b.x += fx * s * half;
        b.z += fz * s * half;
      }
      a.speed *= 0.985;
      b.speed *= 0.985;
    }
  }

  return {
    player,
    field,
    offTrack,
    wrongWay: racing && dProg < -0.002 && player.speed > 4,
    corner: cornerAt(player.t),
  };
}

export function respawn(tr: TruckSim) {
  const cpT = CHECKPOINTS[(tr.nextCp - 1 + CHECKPOINTS.length) % CHECKPOINTS.length];
  const s = sampleLerp(cpT);
  tr.x = s.x;
  tr.z = s.z;
  tr.y = s.y;
  tr.yaw = yawFromTangent(s.tx, s.tz);
  tr.speed = 8;
  tr.slide = 0;
  tr.t = s.t;
}

export function raceDistance(tr: TruckSim): number {
  let along = tr.t * TRACK_LENGTH;
  if (tr.lap === 1 && tr.t > 0.5) along -= TRACK_LENGTH;
  return (tr.lap - 1) * TRACK_LENGTH + along;
}
