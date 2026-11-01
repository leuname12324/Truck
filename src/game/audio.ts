let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfx: GainNode | null = null;
let engineGain: GainNode | null = null;
let engineOsc: OscillatorNode | null = null;
let engineOsc2: OscillatorNode | null = null;
let noiseSrc: AudioBufferSourceNode | null = null;
let noiseGain: GainNode | null = null;
let skidGain: GainNode | null = null;
let started = false;
let muted = false;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    sfx = ctx.createGain();
    sfx.gain.value = 0.7;
    master.gain.value = muted ? 0 : 0.85;
    sfx.connect(master);
    master.connect(ctx.destination);
  }
  return ctx;
}

export function unlockAudio() {
  const c = ensure();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  startEngineGraph();
}

function makeNoise(c: AudioContext): AudioBuffer {
  const len = c.sampleRate * 1.5;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function startEngineGraph() {
  const c = ensure();
  if (!c || !sfx || started) return;
  started = true;

  engineGain = c.createGain();
  engineGain.gain.value = 0.0001;
  engineOsc = c.createOscillator();
  engineOsc.type = "sawtooth";
  engineOsc.frequency.value = 48;
  engineOsc2 = c.createOscillator();
  engineOsc2.type = "square";
  engineOsc2.frequency.value = 24;
  const osc2g = c.createGain();
  osc2g.gain.value = 0.18;
  engineOsc.connect(engineGain);
  engineOsc2.connect(osc2g);
  osc2g.connect(engineGain);

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 420;
  engineGain.connect(filter);
  filter.connect(sfx);

  noiseGain = c.createGain();
  noiseGain.gain.value = 0.0001;
  const nFilter = c.createBiquadFilter();
  nFilter.type = "bandpass";
  nFilter.frequency.value = 180;
  nFilter.Q.value = 0.7;
  noiseSrc = c.createBufferSource();
  noiseSrc.buffer = makeNoise(c);
  noiseSrc.loop = true;
  noiseSrc.connect(nFilter);
  nFilter.connect(noiseGain);
  noiseGain.connect(sfx);

  skidGain = c.createGain();
  skidGain.gain.value = 0.0001;
  const skidF = c.createBiquadFilter();
  skidF.type = "bandpass";
  skidF.frequency.value = 1400;
  skidF.Q.value = 4;
  const skidSrc = c.createBufferSource();
  skidSrc.buffer = makeNoise(c);
  skidSrc.loop = true;
  skidSrc.connect(skidF);
  skidF.connect(skidGain);
  skidGain.connect(sfx);

  engineOsc.start();
  engineOsc2.start();
  noiseSrc.start();
  skidSrc.start();
}

export function setEngine(speed: number, throttle: number, offTrack: boolean, sliding: number) {
  if (!ctx || !engineOsc || !engineOsc2 || !engineGain || !noiseGain || !skidGain) return;
  const t = ctx.currentTime;
  const rpm = 0.25 + Math.abs(speed) / 58 + throttle * 0.15;
  engineOsc.frequency.setTargetAtTime(42 + rpm * 90, t, 0.05);
  engineOsc2.frequency.setTargetAtTime(21 + rpm * 38, t, 0.05);
  const vol = 0.04 + Math.min(0.22, Math.abs(speed) / 80) + throttle * 0.06;
  engineGain.gain.setTargetAtTime(muted ? 0 : vol, t, 0.05);
  noiseGain.gain.setTargetAtTime(muted ? 0 : (offTrack ? 0.05 : 0.012 + throttle * 0.02), t, 0.08);
  skidGain.gain.setTargetAtTime(muted ? 0 : Math.min(0.12, sliding * 0.16), t, 0.04);
}

export function beep(freq: number, dur = 0.12, vol = 0.18) {
  const c = ensure();
  if (!c || !sfx) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "square";
  o.frequency.value = freq;
  g.gain.value = vol;
  g.gain.setTargetAtTime(0.0001, c.currentTime + dur, 0.04);
  o.connect(g);
  g.connect(sfx);
  o.start();
  o.stop(c.currentTime + dur + 0.15);
}

export function horn() {
  beep(196, 0.28, 0.14);
  beep(247, 0.28, 0.1);
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 0.85, ctx.currentTime, 0.02);
  return muted;
}

export function resumeAudio() {
  if (ctx && ctx.state === "suspended") void ctx.resume();
}
