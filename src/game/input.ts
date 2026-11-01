export type Actions = {
  throttle: number;
  brake: number;
  steer: number;
  drift: boolean;
  wings: boolean;
  pause: boolean;
  reset: boolean;
};

const keys = new Set<string>();
let injected: string[] | null = null;
let injectedSteer: number | null = null;

export const touch = {
  steer: 0,
  throttle: 0,
  brake: 0,
  drift: false,
  wings: false,
};

const GAME_CODES = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ShiftLeft",
  "ShiftRight",
  "Space",
  "KeyR",
  "Escape",
  "KeyP",
]);

let bound = false;

function onKeyDown(e: KeyboardEvent) {
  if (GAME_CODES.has(e.code)) e.preventDefault();
  keys.add(e.code);
}

function onKeyUp(e: KeyboardEvent) {
  keys.delete(e.code);
}

function clearKeys() {
  keys.clear();
}

export function bindInput() {
  if (bound || typeof window === "undefined") return;
  bound = true;
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", clearKeys);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearKeys();
  });
}

export function unbindInput() {
  if (!bound) return;
  bound = false;
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("keyup", onKeyUp);
  window.removeEventListener("blur", clearKeys);
}

function held(code: string): boolean {
  if (injected) return injected.includes(code);
  return keys.has(code);
}

function radialDeadzone(x: number, y: number, dz = 0.18): { x: number; y: number } {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0 };
  const scale = (m - dz) / (1 - dz) / m;
  return { x: x * scale, y: y * scale };
}

function readGamepad(actions: Actions) {
  const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() : null;
  if (!pads) return;
  for (const pad of pads) {
    if (!pad || pad.mapping !== "standard") continue;
    const stick = radialDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
    // A / left stick left = player-visible left = +steer
    actions.steer += -stick.x;
    const thr = pad.buttons[7]?.value ?? 0;
    const brk = pad.buttons[6]?.value ?? 0;
    actions.throttle = Math.max(actions.throttle, thr, stick.y < 0 ? -stick.y : 0);
    actions.brake = Math.max(actions.brake, brk, stick.y > 0 ? stick.y : 0);
    if (pad.buttons[0]?.pressed || pad.buttons[2]?.pressed) actions.drift = true;
    if (pad.buttons[5]?.pressed) actions.wings = true;
    if (pad.buttons[9]?.pressed) actions.pause = true;
    if (pad.buttons[1]?.pressed) actions.reset = true;
    if (pad.buttons[14]?.pressed) actions.steer += 1;
    if (pad.buttons[15]?.pressed) actions.steer -= 1;
    if (pad.buttons[12]?.pressed) actions.throttle = Math.max(actions.throttle, 1);
    if (pad.buttons[13]?.pressed) actions.brake = Math.max(actions.brake, 1);
  }
}

const prevPause = { v: false };
const prevReset = { v: false };
export const edges = { pause: false, reset: false };

export function readActions(): Actions {
  const actions: Actions = {
    throttle: 0,
    brake: 0,
    steer: 0,
    drift: false,
    wings: false,
    pause: false,
    reset: false,
  };

  if (held("KeyW") || held("ArrowUp")) actions.throttle = 1;
  if (held("KeyS") || held("ArrowDown")) actions.brake = 1;
  // KeyA → +steer → +yaw → nose left on chase cam
  if (held("KeyA") || held("ArrowLeft")) actions.steer += 1;
  if (held("KeyD") || held("ArrowRight")) actions.steer -= 1;
  if (held("ShiftLeft") || held("ShiftRight")) actions.wings = true;
  if (held("Space")) actions.drift = true;
  if (held("Escape") || held("KeyP")) actions.pause = true;
  if (held("KeyR")) actions.reset = true;

  actions.steer += touch.steer;
  actions.throttle = Math.max(actions.throttle, touch.throttle);
  actions.brake = Math.max(actions.brake, touch.brake);
  if (touch.drift) actions.drift = true;
  if (touch.wings) actions.wings = true;

  if (!injected) readGamepad(actions);

  if (injectedSteer !== null) actions.steer = injectedSteer;

  actions.steer = Math.max(-1, Math.min(1, actions.steer));
  actions.throttle = Math.max(0, Math.min(1, actions.throttle));
  actions.brake = Math.max(0, Math.min(1, actions.brake));

  edges.pause = actions.pause && !prevPause.v;
  edges.reset = actions.reset && !prevReset.v;
  prevPause.v = actions.pause;
  prevReset.v = actions.reset;

  return actions;
}

export function setInjectedKeys(codes: string[]) {
  injected = codes.length ? codes.slice() : null;
  if (!codes.length) injectedSteer = null;
}

export function setInjectedSteer(v: number | null) {
  injectedSteer = v;
}

export function hasInjectedKeys() {
  return injected !== null && injected.length > 0;
}
