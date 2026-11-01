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
};

const KMH = 1 / 3.6;
const TOP_SPEED = 250 * KMH;
const WING_BONUS = 20 * KMH;
const BOOST_BONUS = 10 * KMH;
const ABS_CAP = 280 * KMH;
const ACCEL = 38;
const BRAKE = 46;
const DRAG = ACCEL / TOP_SPEED;
const TURN = 1.62;
const GRIP = 9.5;
const DRIFT_GRIP = 2.6;

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function spawnTruck(index: number, isPlayer: boolean): TruckSim {
  const row = Math.floor(index / 2);
  const pole = index % 2 === 0;
  // Left of travel is the inside of the Senna S — pole sits there, just behind the line.
  const col = pole ? 2.8 : -2.8;
  const back = 7 + row * 11 + (pole ? 0 : 4.2);
  const s0 = sampleLerp(-back / TRACK_LENGTH);
  const x = s0.x + s0.nx * col;
  const z = s0.z + s0.nz * col;
  const liv = LIVERIES[index] ?? LIVERIES[LIVERIES.length - 1];
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
    skill: isPlayer ? 1 : 0.78 + index * 0.04,
    boost: 0,
    charge: 0,
    drifting: false,
    wings: false,
  };
}

export function createField(): TruckSim[] {
  return LIVERIES.map((liv, i) => spawnTruck(i, i === 0));
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
  const onSlow = absLat > TRACK_HALF_WIDTH - 1.35;
  const offTrack = onSlow;
  tr.wings = wings && tr.speed > 2;

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
  tr.y = n2.sample.y;
  const side = Math.sign(n2.lateral) || 1;
  const room = lateralRoom(n2.index, side);
  const wall = Math.min(TRACK_HALF_WIDTH + 8.2, room - 0.55);
  if (Math.abs(n2.lateral) > wall) {
    const push = (Math.abs(n2.lateral) - wall) * Math.sign(n2.lateral);
    tr.x -= n2.sample.nx * push;
    tr.z -= n2.sample.nz * push;
    tr.speed *= 0.72;
    tr.slide *= 0.4;
  }

  const dProg = progressDelta(tr.t, n2.t);
  tr.t = n2.t;

  if (!tr.finished && dProg > -0.2) {
    const cp = CHECKPOINTS[tr.nextCp];
    const prev = CHECKPOINTS[(tr.nextCp - 1 + CHECKPOINTS.length) % CHECKPOINTS.length];
    if (crossed(prev, cp, tr.t, dProg)) {
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

function crossed(fromT: number, toT: number, now: number, dProg: number): boolean {
  if (dProg <= 0.0005) return false;
  if (toT > fromT) return now >= toT && now - dProg < toT;
  // wrap around 0
  return now >= toT && now < 0.2;
}

function aiDrive(tr: TruckSim, dt: number): { throttle: number; brake: number; steer: number; drift: boolean; wings: boolean } {
  const look = 0.045 + tr.speed / 900;
  const target = sampleLerp(tr.t + look * tr.skill);
  const fx = -Math.sin(tr.yaw);
  const fz = -Math.cos(tr.yaw);
  const toX = target.x - tr.x;
  const toZ = target.z - tr.z;
  const wantYaw = Math.atan2(-toX, -toZ);
  let err = wantYaw - tr.yaw;
  while (err > Math.PI) err -= Math.PI * 2;
  while (err < -Math.PI) err += Math.PI * 2;
  // Player-visible: +steer = left = +yaw
  let steer = clamp(err * 1.6, -1, 1);

  const ahead = sampleLerp(tr.t + 0.03);
  const ahead2 = sampleLerp(tr.t + 0.07);
  const curv = Math.abs(
    Math.atan2(ahead2.tx, ahead2.tz) - Math.atan2(ahead.tx, ahead.tz),
  );
  let throttle = 0.92 + tr.skill * 0.08;
  let brake = 0;
  let wings = curv < 0.04 && tr.speed > 28;
  if (curv > 0.1 && tr.speed > 26) {
    throttle = 0.05;
    brake = clamp((tr.speed - 22) / 22, 0.4, 1);
    wings = false;
  } else if (curv > 0.05 && tr.speed > 38) {
    throttle = 0.3;
    brake = 0.4;
    wings = false;
  }
  const drift = curv > 0.1 && tr.speed > 18 && Math.abs(steer) > 0.4;
  void dt;
  void fx;
  void fz;
  return { throttle, brake, steer, drift, wings };
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
        tr.speed *= Math.exp(-2 * dt);
        applyDrive(tr, 0, 0.15, 0, false, false, dt);
        continue;
      }
      const a = aiDrive(tr, dt);
      applyDrive(tr, a.throttle, a.brake, a.steer, a.drift, a.wings, dt);
      tr.lapTime += dt;
      tr.raceTime += dt;
    }
  }

  // Simple truck-truck push
  for (let i = 0; i < field.length; i++) {
    for (let j = i + 1; j < field.length; j++) {
      const a = field[i];
      const b = field[j];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const d = Math.hypot(dx, dz);
      const min = 3.4;
      if (d < min && d > 0.01) {
        const nrm = (min - d) * 0.5;
        const nx = dx / d;
        const nz = dz / d;
        a.x -= nx * nrm;
        a.z -= nz * nrm;
        b.x += nx * nrm;
        b.z += nz * nrm;
        a.speed *= 0.96;
        b.speed *= 0.96;
      }
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
