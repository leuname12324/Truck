import { create } from "zustand";

export type Phase = "menu" | "countdown" | "racing" | "paused" | "finish";

export type HudState = {
  phase: Phase;
  speed: number;
  lap: number;
  totalLaps: number;
  lapTime: number;
  lastLap: number;
  bestLap: number;
  totalTime: number;
  position: number;
  field: number;
  corner: string;
  countdown: number;
  wrongWay: boolean;
  driftBoost: number;
  wings: boolean;
  x: number;
  z: number;
  yaw: number;
  results: { name: string; time: number; isPlayer: boolean }[];
};

type GameStore = HudState & {
  patch: (p: Partial<HudState>) => void;
  resetHud: () => void;
  setTotalLaps: (n: number) => void;
};

const initial: HudState = {
  phase: "menu",
  speed: 0,
  lap: 1,
  totalLaps: 3,
  lapTime: 0,
  lastLap: 0,
  bestLap: 0,
  totalTime: 0,
  position: 1,
  field: 5,
  corner: "Reta Principal",
  countdown: 3,
  wrongWay: false,
  driftBoost: 0,
  wings: false,
  x: 0,
  z: 0,
  yaw: 0,
  results: [],
};

export const useGameStore = create<GameStore>((set) => ({
  ...initial,
  patch: (p) => set(p),
  resetHud: () => set({ ...initial, bestLap: useGameStore.getState().bestLap }),
  setTotalLaps: (n) => set({ totalLaps: n }),
}));

export const TOTAL_LAPS_CONST = 3;
