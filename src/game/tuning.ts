const KEY = "copa-truck-brake";

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

let power = 1.35;

function readStored() {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(KEY);
  const n = raw ? Number(raw) : NaN;
  if (Number.isFinite(n)) power = clamp(n, 0.7, 2);
}

readStored();

export function getBrakePower() {
  return power;
}

export function setBrakePower(v: number) {
  power = clamp(v, 0.7, 2);
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, String(power));
}

export function brakeLabel(v = power) {
  if (v < 1.05) return "suave";
  if (v < 1.5) return "médio";
  return "forte";
}
