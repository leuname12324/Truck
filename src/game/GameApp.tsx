import { Gauge, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { GameHandle } from "@/game/engine";
import { touch } from "@/game/input";
import { toggleMute, unlockAudio } from "@/game/audio";
import { MINIMAP } from "@/game/track";
import { brakeLabel, getBrakePower, setBrakePower } from "@/game/tuning";
import { useGameStore } from "@/game/store";
import { cn } from "@/lib/utils";

function fmt(t: number) {
  if (t <= 0) return "—";
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(2).padStart(5, "0")}`;
}

function Minimap() {
  const x = useGameStore((s) => s.x);
  const z = useGameStore((s) => s.z);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const w = c.width;
    const h = c.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(12,13,12,0.72)";
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 10);
    ctx.fill();
    let minX = Infinity,
      maxX = -Infinity,
      minZ = Infinity,
      maxZ = -Infinity;
    for (const p of MINIMAP) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    }
    const sx = (w - 28) / (maxX - minX);
    const sz = (h - 28) / (maxZ - minZ);
    const sc = Math.min(sx, sz);
    const ox = (w - (maxX - minX) * sc) / 2;
    const oz = (h - (maxZ - minZ) * sc) / 2;
    const px = (vx: number) => ox + (vx - minX) * sc;
    const pz = (vz: number) => oz + (vz - minZ) * sc;
    ctx.strokeStyle = "#8d9488";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    MINIMAP.forEach((p, i) => {
      if (i === 0) ctx.moveTo(px(p.x), pz(p.z));
      else ctx.lineTo(px(p.x), pz(p.z));
    });
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = "#2f9e4a";
    ctx.beginPath();
    ctx.arc(px(x), pz(z), 4, 0, Math.PI * 2);
    ctx.fill();
  }, [x, z]);

  return <canvas ref={canvasRef} width={148} height={148} className="h-[92px] w-[92px] md:h-[132px] md:w-[132px]" />;
}

function BrakeTune() {
  const [power, setPower] = useState(getBrakePower());
  return (
    <label className="pointer-events-auto mt-3 block max-w-xs">
      <span className="flex items-center justify-between text-xs text-subtle">
        Freio
        <span className="text-fg">{brakeLabel(power)}</span>
      </span>
      <input
        type="range"
        min={0.7}
        max={2}
        step={0.05}
        value={power}
        aria-label="Potência do freio"
        onChange={(e) => {
          const v = Number(e.target.value);
          setBrakePower(v);
          setPower(v);
        }}
        className="mt-2 h-1.5 w-full cursor-pointer accent-[#2f9e4a]"
      />
      <span className="mt-1 block text-[11px] text-subtle">Mais forte entra melhor nas curvas.</span>
    </label>
  );
}

function StartScreen({ onStart }: { onStart: () => void }) {
  const totalLaps = useGameStore((s) => s.totalLaps);
  const setTotalLaps = useGameStore((s) => s.setTotalLaps);
  const steeringSensitivity = useGameStore((s) => s.steeringSensitivity);
  const setSteeringSensitivity = useGameStore((s) => s.setSteeringSensitivity);
  const [laps, setLaps] = useState(totalLaps);
  const [sens, setSens] = useState(steeringSensitivity);
  useEffect(() => {
    setTotalLaps(laps);
    setSteeringSensitivity(sens);
  }, [laps, sens, setTotalLaps, setSteeringSensitivity]);
  return (
    <div className="absolute inset-0 z-20 overflow-y-auto bg-[linear-gradient(180deg,transparent_0%,rgba(12,13,12,0.18)_40%,rgba(12,13,12,0.92)_100%)]">
      <div className="flex min-h-full flex-col justify-end gap-5 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-20 md:px-12 md:pb-12">
        <p className="text-xs font-medium tracking-[0.28em] text-muted uppercase">Autódromo José Carlos Pace</p>
        <h1 className="font-display text-5xl leading-[0.9] tracking-tight text-fg text-balance md:text-7xl">
          Copa Truck
          <span className="block text-accent">Interlagos</span>
        </h1>
        <p className="max-w-md text-pretty text-sm leading-relaxed text-muted md:text-base">
          Corrida no traçado clássico de São Paulo. Caminhão de 1.200 cv, S do Senna, Descida do Lago e a subida
          até as arquibancadas.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-subtle uppercase tracking-wider">Voltas</label>
          <select
            value={laps}
            onChange={(e) => setLaps(Number(e.target.value))}
            className="bg-bg/40 border border-border rounded px-3 py-1.5 text-sm text-fg focus:outline-none focus:border-accent"
          >
            <option value={3}>3</option>
            <option value={5}>5</option>
            <option value={7}>7</option>
          </select>
          <p className="text-xs text-subtle">{laps === 1 ? 'volta completa' : laps + ' voltas completas'}</p>
          <label className="text-xs text-subtle uppercase tracking-wider">Sensibilidade da direção</label>
          <input
            type="range"
            min="0.3"
            max="2.0"
            step="0.1"
            value={sens}
            onChange={(e) => setSens(parseFloat(e.target.value))}
            className="w-[120px] accent-accent bg-bg/30 rounded-lg cursor-pointer"
          />
          <span className="text-xs text-subtle">{sens.toFixed(1)}x</span>
          <Button size="xl" onClick={onStart} className="min-w-44 font-display text-2xl tracking-wide">
            Largar
          </Button>
        </div>
        <dl className="mt-2 hidden grid-cols-3 gap-6 text-xs text-muted md:grid md:max-w-lg">
          <div>
            <dt className="text-subtle">Teclado</dt>
            <dd className="mt-1 text-fg">WASD dirigir · Shift asa · Espaço drift</dd>
          </div>
          <div>
            <dt className="text-subtle">Toque</dt>
            <dd className="mt-1 text-fg">Stick esquerdo · pedais à direita</dd>
          </div>
          <div>
            <dt className="text-subtle">Pista</dt>
            <dd className="mt-1 text-fg">Anti-horário · {laps} voltas</dd>
          </div>
        </dl>
        <BrakeTune />
      </div>
    </div>
  );
}

function Hud() {
  const speed = useGameStore((s) => s.speed);
  const lap = useGameStore((s) => s.lap);
  const totalLaps = useGameStore((s) => s.totalLaps);
  const lapTime = useGameStore((s) => s.lapTime);
  const bestLap = useGameStore((s) => s.bestLap);
  const position = useGameStore((s) => s.position);
  const field = useGameStore((s) => s.field);
  const corner = useGameStore((s) => s.corner);
  const wrongWay = useGameStore((s) => s.wrongWay);
  const countdown = useGameStore((s) => s.countdown);
  const phase = useGameStore((s) => s.phase);
  const driftBoost = useGameStore((s) => s.driftBoost);
  const wings = useGameStore((s) => s.wings);
  const gear = useGameStore((s) => s.gear);
  const rpm = useGameStore((s) => s.rpm);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-40 md:p-6 md:pb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-[20px] border border-border bg-bg/70 px-4 py-3 backdrop-blur-sm">
          <p className="font-display text-3xl leading-none tracking-tight text-fg tabular-nums">
            P{position}
            <span className="text-lg text-muted">/{field}</span>
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-subtle">Volta {lap}/{totalLaps}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden rounded-[16px] border border-border bg-bg/70 px-3 py-2 text-right backdrop-blur-sm sm:block">
            <p className="text-[10px] uppercase tracking-widest text-subtle">{corner}</p>
            <p className="font-mono text-sm tabular-nums text-fg">{fmt(lapTime)}</p>
          </div>
          <Minimap />
        </div>
      </div>

      {phase === "countdown" && countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-display text-8xl text-fg tabular-nums">{Math.ceil(countdown)}</p>
        </div>
      )}

      {wrongWay && (
        <div className="absolute left-1/2 top-24 -translate-x-1/2 rounded-full bg-danger px-4 py-1.5 text-xs font-medium tracking-wide text-fg">
          Sentido contrário
        </div>
      )}

      <div className="flex items-end justify-between gap-3">
        <div className="rounded-[20px] border border-border bg-bg/70 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-end gap-4">
            <div>
              <p className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-subtle">
                <Gauge className="size-3.5" />
                km/h
              </p>
              <p className="font-display text-5xl leading-none tabular-nums text-fg">{Math.round(speed)}</p>
            </div>
            <div className="pb-0.5">
              <div className="flex items-end gap-1">
                {[1, 2, 3, 4, 5, 6].map((g) => (
                  <span
                    key={g}
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-[5px] border text-[10px] font-semibold tabular-nums transition-colors",
                      gear >= g
                        ? "border-accent bg-accent text-accent-fg"
                        : "border-border bg-surface-2 text-subtle",
                    )}
                  >
                    {g}
                  </span>
                ))}
              </div>
              <div className="mt-1.5 h-1.5 w-[8.5rem] overflow-hidden rounded-full bg-surface-2">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width,background-color] duration-75",
                    rpm > 0.85 ? "bg-danger" : rpm > 0.6 ? "bg-accent" : "bg-accent/55",
                  )}
                  style={{ width: `${Math.max(3, Math.min(100, Math.round(rpm * 100)))}%` }}
                />
              </div>
              <p className="mt-1 text-right font-mono text-[10px] uppercase tracking-widest text-subtle">
                {gear}ª marcha · {Math.round(rpm * 100)}%
              </p>
            </div>
          </div>
          {wings && (
            <p className="mt-1 text-[11px] font-medium tracking-[0.18em] text-accent uppercase">Asa aberta</p>
          )}
          <p className="mt-1 font-mono text-[11px] text-muted">
            Melhor {fmt(bestLap)}
          </p>
          <div className="mt-2 h-1 w-28 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full bg-accent" style={{ width: `${Math.min(100, driftBoost * 100)}%` }} />
          </div>
        </div>
        <p className="hidden max-w-[14rem] text-right text-[11px] text-subtle md:block">Shift abre a asa · Espaço drift · S freio</p>
      </div>
    </div>
  );
}

function TouchPad({ onPause }: { onPause: () => void }) {
  const steerRef = useRef<HTMLDivElement>(null);

  function onSteer(e: PointerEvent) {
    const el = steerRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    // left side of pad = A = +steer
    touch.steer = Math.max(-1, Math.min(1, (0.5 - x) * 2));
  }
  function endSteer(e: PointerEvent) {
    touch.steer = 0;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  const btn = "pointer-events-auto h-11 w-11 rounded-full border border-border bg-bg/70 text-fg backdrop-blur-sm active:bg-accent active:text-accent-fg";

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <div
        ref={steerRef}
        className="pointer-events-auto h-24 w-[26vw] min-w-[76px] max-w-[112px] shrink-0 rounded-[22px] border border-border bg-bg/55 backdrop-blur-sm"
        onPointerDown={onSteer}
        onPointerMove={(e) => e.buttons && onSteer(e)}
        onPointerUp={endSteer}
        onPointerCancel={endSteer}
      />
      <div className="flex shrink-0 items-center gap-1.5">
        <button type="button" className={cn(btn, "h-10 w-10")} onClick={onPause} aria-label="Pausa">
          <Pause className="mx-auto size-4" />
        </button>
        <button
          type="button"
          className={btn}
          onPointerDown={() => {
            touch.wings = true;
          }}
          onPointerUp={() => {
            touch.wings = false;
          }}
          onPointerCancel={() => {
            touch.wings = false;
          }}
        >
          <span className="text-[10px] font-medium">Asa</span>
        </button>
        <button
          type="button"
          className={btn}
          onPointerDown={() => {
            touch.drift = true;
          }}
          onPointerUp={() => {
            touch.drift = false;
          }}
          onPointerCancel={() => {
            touch.drift = false;
          }}
        >
          <span className="text-[10px] font-medium">Drift</span>
        </button>
        <button
          type="button"
          className={btn}
          onPointerDown={() => {
            touch.brake = 1;
          }}
          onPointerUp={() => {
            touch.brake = 0;
          }}
          onPointerCancel={() => {
            touch.brake = 0;
          }}
        >
          <span className="text-[10px] font-medium">Freio</span>
        </button>
        <button
          type="button"
          className={cn(btn, "h-14 w-14 bg-accent text-accent-fg")}
          onPointerDown={() => {
            touch.throttle = 1;
          }}
          onPointerUp={() => {
            touch.throttle = 0;
          }}
          onPointerCancel={() => {
            touch.throttle = 0;
          }}
        >
          <span className="text-[10px] leading-tight font-medium">Acelera</span>
        </button>
      </div>
    </div>
  );
}

function OverlayCard({
  title,
  children,
  actions,
}: {
  title: string;
  children: ReactNode;
  actions: ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg/60 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-[28px] border border-border bg-surface p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
        <h2 className="font-display text-4xl tracking-tight text-fg">{title}</h2>
        <div className="mt-4 text-sm text-muted">{children}</div>
        <div className="mt-6 flex flex-col gap-2">{actions}</div>
      </div>
    </div>
  );
}

export function GameApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handle = useRef<GameHandle | null>(null);
  const phase = useGameStore((s) => s.phase);
  const results = useGameStore((s) => s.results);
  const totalTime = useGameStore((s) => s.totalTime);
  const position = useGameStore((s) => s.position);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let handleLocal: GameHandle | null = null;
    void import("@/game/engine").then(({ createGame }) => {
      if (disposed || !canvasRef.current) return;
      handleLocal = createGame(canvasRef.current);
      handle.current = handleLocal;
    });
    return () => {
      disposed = true;
      handleLocal?.dispose();
      handle.current = null;
    };
  }, []);

  const start = () => {
    unlockAudio();
    handle.current?.startRace();
  };

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg" style={{ touchAction: "none" }}>
      <canvas ref={canvasRef} className="block h-full w-full" />

      {phase !== "menu" && <Hud />}
      {phase === "menu" && <StartScreen onStart={start} />}
      {(phase === "racing" || phase === "countdown") && (
        <TouchPad onPause={() => handle.current?.pause()} />
      )}

      {phase === "paused" && (
        <OverlayCard
          title="Pausa"
          actions={
            <>
              <Button size="lg" onClick={() => handle.current?.resume()}>
                Continuar
              </Button>
              <Button size="lg" variant="secondary" onClick={() => handle.current?.retry()}>
                Relargar
              </Button>
              <Button size="lg" variant="ghost" onClick={() => handle.current?.toMenu()}>
                Menu
              </Button>
            </>
          }
        >
          <p>O grid espera em Interlagos.</p>
          <BrakeTune />
        </OverlayCard>
      )}

      {phase === "finish" && (
        <OverlayCard
          title={position === 1 ? "Vitória" : `${position}º lugar`}
          actions={
            <>
              <Button size="lg" onClick={() => handle.current?.retry()}>
                <RotateCcw className="size-4" />
                Nova corrida
              </Button>
              <Button size="lg" variant="secondary" onClick={() => handle.current?.toMenu()}>
                Menu
              </Button>
            </>
          }
        >
          <p className="mb-3 font-mono text-fg tabular-nums">Tempo {fmt(totalTime)}</p>
          <ol className="space-y-1">
            {results.map((r, i) => (
              <li
                key={r.name}
                className={cn(
                  "flex justify-between rounded-[10px] px-3 py-2",
                  r.isPlayer ? "bg-accent/15 text-fg" : "text-muted",
                )}
              >
                <span>
                  {i + 1}. {r.name}
                </span>
                <span className="font-mono tabular-nums">{r.time > 0 ? fmt(r.time) : "em pista"}</span>
              </li>
            ))}
          </ol>
        </OverlayCard>
      )}

      <button
        type="button"
        className="absolute left-4 top-[max(7.5rem,calc(env(safe-area-inset-top)+6.5rem))] z-40 flex size-11 items-center justify-center rounded-full border border-border bg-bg/70 text-fg backdrop-blur-sm"
        onClick={() => setMuted(toggleMute())}
        aria-label={muted ? "Som" : "Mudo"}
      >
        {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </button>

      {phase === "racing" && (
        <button
          type="button"
          className="absolute left-[4.25rem] top-[max(7.5rem,calc(env(safe-area-inset-top)+6.5rem))] z-40 hidden size-11 items-center justify-center rounded-full border border-border bg-bg/70 text-fg backdrop-blur-sm md:flex"
          onClick={() => handle.current?.pause()}
          aria-label="Pausa"
        >
          <Pause className="size-4" />
        </button>
      )}
    </main>
  );
}
