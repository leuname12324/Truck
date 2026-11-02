import * as THREE from "three";
import { bindInput, edges, hasInjectedKeys, readActions, setInjectedKeys, setInjectedSteer, unbindInput } from "./input";
import { beep, resumeAudio, setEngine, unlockAudio } from "./audio";
import { buildWorld } from "./world";
import { createTruck, type TruckVisual } from "./truckMesh";
import { createField, raceDistance, respawn, stepField, type TruckSim } from "./sim";
import { cornerAt, nearestOnTrack } from "./track";
import { useGameStore, type Phase } from "./store";

const FIXED = 1 / 60;

export type GameHandle = {
  dispose: () => void;
  startRace: () => void;
  pause: () => void;
  resume: () => void;
  retry: () => void;
  toMenu: () => void;
};

function loadBest(): number {
  try {
    const v = localStorage.getItem("ct-interlagos-best");
    return v ? Number(v) || 0 : 0;
  } catch {
    return 0;
  }
}

function saveBest(t: number) {
  try {
    localStorage.setItem("ct-interlagos-best", String(t));
  } catch {
    /* ignore */
  }
}

export function createGame(canvas: HTMLCanvasElement): GameHandle {
  bindInput();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, 1, 0.2, 1200);
  const disposeWorld = buildWorld(scene);

  let field = createField();
  field[0].bestLap = loadBest();
  const visuals: TruckVisual[] = field.map((tr) => {
    const vis = createTruck(tr.livery);
    scene.add(vis.group);
    return vis;
  });

  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const desired = new THREE.Vector3();
  const lookAt = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  let phase: Phase = "menu";
  let countdown = 3;
  let acc = 0;
  let running = true;
  let hudAcc = 0;
  let trauma = 0;
  const storedBest = loadBest();
  useGameStore.getState().patch({ bestLap: storedBest, phase: "menu" });

  const sun = scene.children.find((c) => c instanceof THREE.DirectionalLight) as THREE.DirectionalLight | undefined;

  // Narrow screens need a wider lens or the truck fills the whole frame.
  function baseFov() {
    const a = camera.aspect || 1;
    if (a < 0.8) return 78;
    if (a < 1.15) return 70;
    if (a < 1.6) return 62;
    return 58;
  }

  function layout() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.fov = baseFov();
    camera.updateProjectionMatrix();
  }
  layout();
  const ro = new ResizeObserver(layout);
  ro.observe(canvas);

  function syncVisual(tr: TruckSim, vis: TruckVisual, dt: number) {
    vis.group.position.set(tr.x, tr.y + 0.08, tr.z);
    vis.group.rotation.order = "YXZ";
    vis.group.rotation.y = tr.yaw + Math.PI;
    vis.group.rotation.z = tr.steerVis * 0.12;
    vis.group.rotation.x = 0;
    const open = tr.wings ? -0.62 : 0.12;
    const wk = 1 - Math.exp(-10 * dt);
    vis.wing.rotation.x += (open - vis.wing.rotation.x) * wk;
    const spin = (tr.speed / 0.52) * dt;
    for (const w of vis.wheels) w.rotation.x += spin;
    for (const w of vis.frontWheels) w.rotation.y = tr.steerVis * 0.4;
  }

  function liftCamera(x: number, z: number, y: number, hint: number) {
    const under = nearestOnTrack(x, z, hint);
    return Math.max(y, Math.max(0, under.sample.y) + 3.2);
  }

  function placeCamera(tr: TruckSim, dt: number, cinematic: boolean) {
    const fx = -Math.sin(tr.yaw);
    const fz = -Math.cos(tr.yaw);
    const speedK = Math.abs(tr.speed);
    const target = baseFov() + Math.min(8, speedK * 0.09);
    camera.fov += (target - camera.fov) * (1 - Math.exp(-4 * dt));
    camera.updateProjectionMatrix();

    if (cinematic) {
      const t = performance.now() * 0.00018;
      desired.set(tr.x + Math.cos(t) * 14, tr.y + 8.5, tr.z + Math.sin(t) * 14);
      lookAt.set(tr.x, tr.y + 1.4, tr.z);
    } else {
      // A taller, further chase camera keeps the whole truck (and the road
      // ahead) in frame at 250 km/h on a phone.
      const dist = 15.5 + Math.min(2.4, speedK * 0.025);
      const height = 6.6;
      desired.set(tr.x - fx * dist, tr.y + height, tr.z - fz * dist);
      lookAt.set(tr.x + fx * 10, tr.y + 2.2, tr.z + fz * 10);
    }

    desired.y = liftCamera(desired.x, desired.z, desired.y, tr.t);
    const mx = (tr.x + desired.x) * 0.5;
    const mz = (tr.z + desired.z) * 0.5;
    desired.y = liftCamera(mx, mz, desired.y, tr.t);

    const k = cinematic ? 2.2 : 6.5;
    camPos.lerp(desired, 1 - Math.exp(-k * dt));
    camLook.lerp(lookAt, 1 - Math.exp(-8 * dt));
    camPos.y = liftCamera(camPos.x, camPos.z, camPos.y, tr.t);

    const shake = trauma * trauma;
    if (shake > 0.001) {
      camPos.x += (Math.random() - 0.5) * shake * 0.45;
      camPos.y += (Math.random() - 0.5) * shake * 0.25;
    }
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    camera.up.copy(up);

    if (sun) {
      sun.position.set(tr.x - 80, tr.y + 90, tr.z + 40);
      sun.target.position.set(tr.x, tr.y, tr.z);
      sun.target.updateMatrixWorld();
      if (!sun.target.parent) scene.add(sun.target);
    }
  }

  function publishHud(extra: Partial<ReturnType<typeof useGameStore.getState>> = {}) {
    const p = field[0];
    const ranked = [...field].sort((a, b) => raceDistance(b) - raceDistance(a));
    const pos = ranked.findIndex((t) => t.isPlayer) + 1;
    useGameStore.getState().patch({
      ...extra,
      phase,
      speed: Math.abs(p.speed) * 3.6,
      lap: p.lap,
      lapTime: p.lapTime,
      lastLap: p.lastLap,
      bestLap: p.bestLap || storedBest,
      totalTime: p.raceTime,
      position: pos,
      field: field.length,
      driftBoost: Math.max(p.boost, p.charge),
      wings: p.wings,
      x: p.x,
      z: p.z,
      yaw: p.yaw,
      corner: extra.corner ?? cornerAt(p.t),
    });
  }

  function startRace() {
    unlockAudio();
    field = createField();
    field[0].bestLap = loadBest();
    for (let i = 0; i < field.length; i++) {
      syncVisual(field[i], visuals[i], 0);
    }
    phase = "countdown";
    countdown = 3;
    cdBeep = 3;
    trauma = 0;
    acc = 0;
    last = performance.now();
    const me = field[0];
    const fx = -Math.sin(me.yaw);
    const fz = -Math.cos(me.yaw);
    camPos.set(me.x - fx * 21, me.y + 7.8, me.z - fz * 21);
    camLook.set(me.x + fx * 12, me.y + 2, me.z + fz * 12);
    beep(440, 0.12, 0.16);
    publishHud({ phase, countdown: 3, corner: "Reta Principal", wrongWay: false, results: [] });
  }

  function finishRace() {
    phase = "finish";
    const ranked = [...field].sort((a, b) => raceDistance(b) - raceDistance(a));
    const results = ranked.map((t) => ({
      name: t.name,
      time: t.finished ? t.raceTime : 0,
      isPlayer: t.isPlayer,
    }));
    const p = field[0];
    const stored = loadBest();
    if (p.bestLap > 0 && (stored === 0 || p.bestLap < stored)) saveBest(p.bestLap);
    beep(523, 0.2, 0.2);
    beep(784, 0.35, 0.16);
    publishHud({ phase, results });
  }

  const onVis = () => resumeAudio();
  document.addEventListener("visibilitychange", onVis);

  let last = performance.now();
  let cdBeep = 3;

  function tick() {
    if (!running) return;
    requestAnimationFrame(tick);
    const now = performance.now();
    let dt = (now - last) / 1000;
    last = now;
    dt = Math.min(dt, 0.1);
    acc += dt;
    trauma = Math.max(0, trauma - dt * 1.8);

    const actions = readActions();
    if (edges.pause && (phase === "racing" || phase === "paused")) {
      phase = phase === "paused" ? "racing" : "paused";
      publishHud({ phase });
    }
    if (edges.reset && phase === "racing") {
      respawn(field[0]);
      trauma = 0.4;
    }

    while (acc >= FIXED) {
      if (phase === "countdown") {
        countdown -= FIXED;
        const n = Math.ceil(countdown);
        if (n !== cdBeep && n >= 1 && n <= 3) {
          cdBeep = n;
          beep(n === 1 ? 660 : 440, 0.1, 0.16);
        }
        if (countdown <= 0) {
          phase = "racing";
          beep(880, 0.22, 0.22);
          publishHud({ phase, countdown: 0 });
        } else {
          useGameStore.getState().patch({ countdown, phase });
        }
        stepField(field, actions, FIXED, hasInjectedKeys());
      } else if (phase === "racing") {
        const info = stepField(field, actions, FIXED, true);
        if (Math.abs(info.player.slide) > 4) trauma = Math.min(1, trauma + 0.02);
        if (info.player.finished) finishRace();
      } else if (phase === "menu") {
        stepField(field, actions, FIXED, false);
      }
      acc -= FIXED;
    }

    const renderDt = dt;
    for (let i = 0; i < field.length; i++) syncVisual(field[i], visuals[i], renderDt);

    const player = field[0];
    placeCamera(player, renderDt, phase === "menu" || phase === "finish");

    const near = nearestOnTrack(player.x, player.z, player.t);
    setEngine(player.speed, actions.throttle, !near.onTrack, Math.abs(player.slide) / 8);

    hudAcc += dt;
    if (hudAcc > 0.1) {
      hudAcc = 0;
      const ranked = [...field].sort((a, b) => raceDistance(b) - raceDistance(a));
      publishHud({
        wrongWay: phase === "racing" && player.speed > 5 && progressWrong(player),
        position: ranked.findIndex((t) => t.isPlayer) + 1,
      });
    }

    renderer.render(scene, camera);
  }

  function progressWrong(tr: TruckSim): boolean {
    const n = nearestOnTrack(tr.x, tr.z, tr.t);
    const fx = -Math.sin(tr.yaw);
    const fz = -Math.cos(tr.yaw);
    return fx * n.sample.tx + fz * n.sample.tz < -0.25;
  }

  function installProbe() {
    window.__controlsTest = {
      getYaw: () => field[0].yaw,
      getSpeed: () => field[0].speed,
      setKeys: (codes: string[]) => {
        setInjectedKeys(codes);
        if (codes.length && phase !== "racing") {
          phase = "racing";
          publishHud({ phase });
        }
      },
      setSteer: (v: number) => setInjectedSteer(v),
    };
  }
  installProbe();

  requestAnimationFrame(tick);

  return {
    dispose() {
      running = false;
      ro.disconnect();
      unbindInput();
      document.removeEventListener("visibilitychange", onVis);
      disposeWorld();
      renderer.dispose();
      delete window.__controlsTest;
    },
    startRace,
    pause() {
      if (phase === "racing") {
        phase = "paused";
        publishHud({ phase });
      }
    },
    resume() {
      if (phase === "paused") {
        phase = "racing";
        publishHud({ phase });
      }
    },
    retry() {
      startRace();
    },
    toMenu() {
      field = createField();
      field[0].bestLap = loadBest();
      phase = "menu";
      publishHud({ phase, results: [] });
    },
  };
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setSteer?: (v: number) => void;
      setKeys?: (codes: string[]) => void;
    };
  }
}
