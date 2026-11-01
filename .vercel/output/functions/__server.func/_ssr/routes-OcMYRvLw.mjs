import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { W as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as create } from "../_libs/zustand.mjs";
import { a as Pause, i as RotateCcw, n as Volume2, o as Gauge, t as VolumeX } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-OcMYRvLw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var keys = /* @__PURE__ */ new Set();
var injected = null;
var injectedSteer = null;
var touch = {
	steer: 0,
	throttle: 0,
	brake: 0,
	drift: false
};
var GAME_CODES = /* @__PURE__ */ new Set([
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
	"KeyP"
]);
var bound = false;
function onKeyDown(e) {
	if (GAME_CODES.has(e.code)) e.preventDefault();
	keys.add(e.code);
}
function onKeyUp(e) {
	keys.delete(e.code);
}
function clearKeys() {
	keys.clear();
}
function bindInput() {
	if (bound || typeof window === "undefined") return;
	bound = true;
	window.addEventListener("keydown", onKeyDown);
	window.addEventListener("keyup", onKeyUp);
	window.addEventListener("blur", clearKeys);
	document.addEventListener("visibilitychange", () => {
		if (document.hidden) clearKeys();
	});
}
function unbindInput() {
	if (!bound) return;
	bound = false;
	window.removeEventListener("keydown", onKeyDown);
	window.removeEventListener("keyup", onKeyUp);
	window.removeEventListener("blur", clearKeys);
}
function held(code) {
	if (injected) return injected.includes(code);
	return keys.has(code);
}
function radialDeadzone(x, y, dz = .18) {
	const m = Math.hypot(x, y);
	if (m < dz) return {
		x: 0,
		y: 0
	};
	const scale = (m - dz) / (1 - dz) / m;
	return {
		x: x * scale,
		y: y * scale
	};
}
function readGamepad(actions) {
	const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() : null;
	if (!pads) return;
	for (const pad of pads) {
		if (!pad || pad.mapping !== "standard") continue;
		const stick = radialDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
		actions.steer += -stick.x;
		const thr = pad.buttons[7]?.value ?? 0;
		const brk = pad.buttons[6]?.value ?? 0;
		actions.throttle = Math.max(actions.throttle, thr, stick.y < 0 ? -stick.y : 0);
		actions.brake = Math.max(actions.brake, brk, stick.y > 0 ? stick.y : 0);
		if (pad.buttons[0]?.pressed || pad.buttons[2]?.pressed) actions.drift = true;
		if (pad.buttons[9]?.pressed) actions.pause = true;
		if (pad.buttons[1]?.pressed) actions.reset = true;
		if (pad.buttons[14]?.pressed) actions.steer += 1;
		if (pad.buttons[15]?.pressed) actions.steer -= 1;
		if (pad.buttons[12]?.pressed) actions.throttle = Math.max(actions.throttle, 1);
		if (pad.buttons[13]?.pressed) actions.brake = Math.max(actions.brake, 1);
	}
}
var prevPause = { v: false };
var prevReset = { v: false };
var edges = {
	pause: false,
	reset: false
};
function readActions() {
	const actions = {
		throttle: 0,
		brake: 0,
		steer: 0,
		drift: false,
		pause: false,
		reset: false
	};
	if (held("KeyW") || held("ArrowUp")) actions.throttle = 1;
	if (held("KeyS") || held("ArrowDown")) actions.brake = 1;
	if (held("KeyA") || held("ArrowLeft")) actions.steer += 1;
	if (held("KeyD") || held("ArrowRight")) actions.steer -= 1;
	if (held("ShiftLeft") || held("ShiftRight") || held("Space")) actions.drift = true;
	if (held("Escape") || held("KeyP")) actions.pause = true;
	if (held("KeyR")) actions.reset = true;
	actions.steer += touch.steer;
	actions.throttle = Math.max(actions.throttle, touch.throttle);
	actions.brake = Math.max(actions.brake, touch.brake);
	if (touch.drift) actions.drift = true;
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
function setInjectedKeys(codes) {
	injected = codes.length ? codes.slice() : null;
	if (!codes.length) injectedSteer = null;
}
function setInjectedSteer(v) {
	injectedSteer = v;
}
function hasInjectedKeys() {
	return injected !== null && injected.length > 0;
}
var ctx = null;
var master = null;
var sfx = null;
var engineGain = null;
var engineOsc = null;
var engineOsc2 = null;
var noiseSrc = null;
var noiseGain = null;
var skidGain = null;
var started = false;
var muted = false;
function ensure() {
	if (typeof window === "undefined") return null;
	if (!ctx) {
		ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive" });
		master = ctx.createGain();
		sfx = ctx.createGain();
		sfx.gain.value = .7;
		master.gain.value = muted ? 0 : .85;
		sfx.connect(master);
		master.connect(ctx.destination);
	}
	return ctx;
}
function unlockAudio() {
	const c = ensure();
	if (!c) return;
	if (c.state === "suspended") c.resume();
	startEngineGraph();
}
function makeNoise(c) {
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
	engineGain.gain.value = 1e-4;
	engineOsc = c.createOscillator();
	engineOsc.type = "sawtooth";
	engineOsc.frequency.value = 48;
	engineOsc2 = c.createOscillator();
	engineOsc2.type = "square";
	engineOsc2.frequency.value = 24;
	const osc2g = c.createGain();
	osc2g.gain.value = .18;
	engineOsc.connect(engineGain);
	engineOsc2.connect(osc2g);
	osc2g.connect(engineGain);
	const filter = c.createBiquadFilter();
	filter.type = "lowpass";
	filter.frequency.value = 420;
	engineGain.connect(filter);
	filter.connect(sfx);
	noiseGain = c.createGain();
	noiseGain.gain.value = 1e-4;
	const nFilter = c.createBiquadFilter();
	nFilter.type = "bandpass";
	nFilter.frequency.value = 180;
	nFilter.Q.value = .7;
	noiseSrc = c.createBufferSource();
	noiseSrc.buffer = makeNoise(c);
	noiseSrc.loop = true;
	noiseSrc.connect(nFilter);
	nFilter.connect(noiseGain);
	noiseGain.connect(sfx);
	skidGain = c.createGain();
	skidGain.gain.value = 1e-4;
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
function setEngine(speed, throttle, offTrack, sliding) {
	if (!ctx || !engineOsc || !engineOsc2 || !engineGain || !noiseGain || !skidGain) return;
	const t = ctx.currentTime;
	const rpm = .25 + Math.abs(speed) / 58 + throttle * .15;
	engineOsc.frequency.setTargetAtTime(42 + rpm * 90, t, .05);
	engineOsc2.frequency.setTargetAtTime(21 + rpm * 38, t, .05);
	const vol = .04 + Math.min(.22, Math.abs(speed) / 80) + throttle * .06;
	engineGain.gain.setTargetAtTime(muted ? 0 : vol, t, .05);
	noiseGain.gain.setTargetAtTime(muted ? 0 : offTrack ? .05 : .012 + throttle * .02, t, .08);
	skidGain.gain.setTargetAtTime(muted ? 0 : Math.min(.12, sliding * .16), t, .04);
}
function beep(freq, dur = .12, vol = .18) {
	const c = ensure();
	if (!c || !sfx) return;
	const o = c.createOscillator();
	const g = c.createGain();
	o.type = "square";
	o.frequency.value = freq;
	g.gain.value = vol;
	g.gain.setTargetAtTime(1e-4, c.currentTime + dur, .04);
	o.connect(g);
	g.connect(sfx);
	o.start();
	o.stop(c.currentTime + dur + .15);
}
function toggleMute() {
	muted = !muted;
	if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : .85, ctx.currentTime, .02);
	return muted;
}
function resumeAudio() {
	if (ctx && ctx.state === "suspended") ctx.resume();
}
var TRACK_LENGTH = 2151.24;
var RAW_POINTS = [
	{
		"x": -133.56,
		"z": 114.27
	},
	{
		"x": -104.2,
		"z": 227.87
	},
	{
		"x": -101.09,
		"z": 239.84
	},
	{
		"x": -97.98,
		"z": 246.74
	},
	{
		"x": -90.94,
		"z": 257.2
	},
	{
		"x": -87.33,
		"z": 260.15
	},
	{
		"x": -82.13,
		"z": 262.27
	},
	{
		"x": -76.98,
		"z": 262.32
	},
	{
		"x": -71.33,
		"z": 261.15
	},
	{
		"x": -68.37,
		"z": 259.6
	},
	{
		"x": -59.2,
		"z": 251.14
	},
	{
		"x": -50.27,
		"z": 241.23
	},
	{
		"x": -46.76,
		"z": 238.62
	},
	{
		"x": -42.17,
		"z": 237
	},
	{
		"x": -37.53,
		"z": 236.72
	},
	{
		"x": -30.81,
		"z": 238.9
	},
	{
		"x": -16.54,
		"z": 247.63
	},
	{
		"x": -5.22,
		"z": 252.31
	},
	{
		"x": 3.19,
		"z": 254.48
	},
	{
		"x": 10.88,
		"z": 255.48
	},
	{
		"x": 17.91,
		"z": 255.87
	},
	{
		"x": 28.26,
		"z": 254.65
	},
	{
		"x": 36.16,
		"z": 252.92
	},
	{
		"x": 45.9,
		"z": 249.41
	},
	{
		"x": 55.02,
		"z": 244.13
	},
	{
		"x": 64.04,
		"z": 237.06
	},
	{
		"x": 71.33,
		"z": 229.38
	},
	{
		"x": 77.08,
		"z": 221.19
	},
	{
		"x": 81.36,
		"z": 213.51
	},
	{
		"x": 84.94,
		"z": 204.88
	},
	{
		"x": 98.9,
		"z": 158.74
	},
	{
		"x": 104.81,
		"z": 135.59
	},
	{
		"x": 114.9,
		"z": 96.29
	},
	{
		"x": 127.23,
		"z": 46.09
	},
	{
		"x": 148.9,
		"z": -36.18
	},
	{
		"x": 156.69,
		"z": -65.84
	},
	{
		"x": 162.19,
		"z": -86.67
	},
	{
		"x": 164.75,
		"z": -96.34
	},
	{
		"x": 165.72,
		"z": -102.47
	},
	{
		"x": 165.1,
		"z": -108.2
	},
	{
		"x": 163.68,
		"z": -112.1
	},
	{
		"x": 160.56,
		"z": -116.72
	},
	{
		"x": 154.96,
		"z": -120.61
	},
	{
		"x": 148.44,
		"z": -123.34
	},
	{
		"x": 139,
		"z": -125.29
	},
	{
		"x": 110.83,
		"z": -130.85
	},
	{
		"x": 99.81,
		"z": -132.08
	},
	{
		"x": 92.98,
		"z": -131.58
	},
	{
		"x": 84.63,
		"z": -130.41
	},
	{
		"x": 76.73,
		"z": -128.07
	},
	{
		"x": 69.75,
		"z": -123.95
	},
	{
		"x": 63.12,
		"z": -120.06
	},
	{
		"x": 56.49,
		"z": -114.61
	},
	{
		"x": 50.13,
		"z": -107.53
	},
	{
		"x": 41.41,
		"z": -96.46
	},
	{
		"x": 12.77,
		"z": -57.77
	},
	{
		"x": -4.05,
		"z": -33.95
	},
	{
		"x": -18.38,
		"z": -13.58
	},
	{
		"x": -34.07,
		"z": 7.01
	},
	{
		"x": -42.33,
		"z": 18.48
	},
	{
		"x": -48.7,
		"z": 27.11
	},
	{
		"x": -53.13,
		"z": 32.01
	},
	{
		"x": -58.08,
		"z": 35.06
	},
	{
		"x": -65.11,
		"z": 37.57
	},
	{
		"x": -72.86,
		"z": 38.57
	},
	{
		"x": -84.47,
		"z": 38.3
	},
	{
		"x": -92.22,
		"z": 37.02
	},
	{
		"x": -98.39,
		"z": 35.06
	},
	{
		"x": -103.89,
		"z": 32.56
	},
	{
		"x": -113.32,
		"z": 27.44
	},
	{
		"x": -118.01,
		"z": 23.27
	},
	{
		"x": -121.12,
		"z": 19.14
	},
	{
		"x": -124.13,
		"z": 13.19
	},
	{
		"x": -126.42,
		"z": 5.12
	},
	{
		"x": -129.28,
		"z": -6.79
	},
	{
		"x": -131.62,
		"z": -17.7
	},
	{
		"x": -134.78,
		"z": -37.73
	},
	{
		"x": -135.39,
		"z": -46.03
	},
	{
		"x": -135.24,
		"z": -54.44
	},
	{
		"x": -133.25,
		"z": -60.84
	},
	{
		"x": -130.04,
		"z": -64.06
	},
	{
		"x": -127.8,
		"z": -65.23
	},
	{
		"x": -124.99,
		"z": -66.18
	},
	{
		"x": -121.17,
		"z": -66.63
	},
	{
		"x": -117.14,
		"z": -65.63
	},
	{
		"x": -112.92,
		"z": -63.95
	},
	{
		"x": -101.5,
		"z": -55.27
	},
	{
		"x": -96.91,
		"z": -52.55
	},
	{
		"x": -93.34,
		"z": -51.04
	},
	{
		"x": -86,
		"z": -49.98
	},
	{
		"x": -82.13,
		"z": -50.48
	},
	{
		"x": -76.83,
		"z": -52.43
	},
	{
		"x": -70.56,
		"z": -57.61
	},
	{
		"x": -67.05,
		"z": -62.84
	},
	{
		"x": -65.16,
		"z": -68.58
	},
	{
		"x": -64.86,
		"z": -73.47
	},
	{
		"x": -65.62,
		"z": -79.15
	},
	{
		"x": -67.76,
		"z": -83.6
	},
	{
		"x": -72.65,
		"z": -90.78
	},
	{
		"x": -77.08,
		"z": -95.23
	},
	{
		"x": -92.73,
		"z": -110.54
	},
	{
		"x": -100.78,
		"z": -119.78
	},
	{
		"x": -106.34,
		"z": -128.02
	},
	{
		"x": -110.36,
		"z": -139.04
	},
	{
		"x": -113.47,
		"z": -152.73
	},
	{
		"x": -114.9,
		"z": -161.03
	},
	{
		"x": -115.67,
		"z": -168.49
	},
	{
		"x": -115.16,
		"z": -174.6
	},
	{
		"x": -112.76,
		"z": -178.78
	},
	{
		"x": -110.78,
		"z": -181.28
	},
	{
		"x": -107.56,
		"z": -182.34
	},
	{
		"x": -104.91,
		"z": -183.01
	},
	{
		"x": -101.5,
		"z": -182.46
	},
	{
		"x": -97.52,
		"z": -180.84
	},
	{
		"x": -78.41,
		"z": -159.07
	},
	{
		"x": -61.9,
		"z": -140.82
	},
	{
		"x": -59.05,
		"z": -138.48
	},
	{
		"x": -52.88,
		"z": -134.19
	},
	{
		"x": -47.22,
		"z": -131.69
	},
	{
		"x": -42.53,
		"z": -130.3
	},
	{
		"x": -36.77,
		"z": -129.35
	},
	{
		"x": -31.42,
		"z": -128.74
	},
	{
		"x": -25.25,
		"z": -128.69
	},
	{
		"x": -15.57,
		"z": -130.07
	},
	{
		"x": -8.18,
		"z": -132.47
	},
	{
		"x": -.33,
		"z": -136.98
	},
	{
		"x": 7.62,
		"z": -143.44
	},
	{
		"x": 12.05,
		"z": -149.28
	},
	{
		"x": 16.8,
		"z": -155.85
	},
	{
		"x": 29.48,
		"z": -175.83
	},
	{
		"x": 43.5,
		"z": -199.32
	},
	{
		"x": 59.35,
		"z": -224.98
	},
	{
		"x": 60.37,
		"z": -227.99
	},
	{
		"x": 60.63,
		"z": -231.54
	},
	{
		"x": 59.66,
		"z": -235.05
	},
	{
		"x": 57.82,
		"z": -238.84
	},
	{
		"x": 54.3,
		"z": -242.12
	},
	{
		"x": 45.99,
		"z": -246.46
	},
	{
		"x": 33.91,
		"z": -250.86
	},
	{
		"x": 9.4,
		"z": -260.1
	},
	{
		"x": 4.61,
		"z": -261.38
	},
	{
		"x": -1.5,
		"z": -262.32
	},
	{
		"x": -13.84,
		"z": -260.99
	},
	{
		"x": -24.64,
		"z": -259.15
	},
	{
		"x": -48.29,
		"z": -254.09
	},
	{
		"x": -56.14,
		"z": -251.41
	},
	{
		"x": -71.73,
		"z": -244.91
	},
	{
		"x": -79.43,
		"z": -241.51
	},
	{
		"x": -97.78,
		"z": -231.6
	},
	{
		"x": -105.06,
		"z": -226.65
	},
	{
		"x": -111.28,
		"z": -221.08
	},
	{
		"x": -117.6,
		"z": -215.24
	},
	{
		"x": -122.75,
		"z": -209.17
	},
	{
		"x": -127.33,
		"z": -202.04
	},
	{
		"x": -131.51,
		"z": -192.97
	},
	{
		"x": -134.88,
		"z": -183.29
	},
	{
		"x": -140.18,
		"z": -163.53
	},
	{
		"x": -145.94,
		"z": -138.65
	},
	{
		"x": -149.76,
		"z": -115.22
	},
	{
		"x": -156.34,
		"z": -90.22
	},
	{
		"x": -160.56,
		"z": -71.41
	},
	{
		"x": -164.24,
		"z": -58.38
	},
	{
		"x": -165.46,
		"z": -48.92
	},
	{
		"x": -165.72,
		"z": -36.07
	},
	{
		"x": -165,
		"z": -20.82
	},
	{
		"x": -163.32,
		"z": -9.4
	},
	{
		"x": -160.47,
		"z": 3.9
	},
	{
		"x": -155.52,
		"z": 23.05
	},
	{
		"x": -141.09,
		"z": 83.72
	}
];
var ELEV = [
	{
		t: 0,
		y: 12
	},
	{
		t: .06,
		y: 6
	},
	{
		t: .1,
		y: 4
	},
	{
		t: .18,
		y: 5
	},
	{
		t: .3,
		y: 6
	},
	{
		t: .36,
		y: 2
	},
	{
		t: .45,
		y: 4
	},
	{
		t: .52,
		y: 6
	},
	{
		t: .58,
		y: 5
	},
	{
		t: .64,
		y: 3
	},
	{
		t: .72,
		y: 4
	},
	{
		t: .82,
		y: 8
	},
	{
		t: .92,
		y: 11
	},
	{
		t: 1,
		y: 12
	}
];
function elevAt(t) {
	const u = (t % 1 + 1) % 1;
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
var N = 480;
var SAMPLES = [];
function buildSamples() {
	const nPts = RAW_POINTS.length;
	const steps = N;
	const pts = [];
	const lerp = (A, B, ta, tb, tc) => {
		const d = tb - ta || 1e-4;
		const a = (tb - tc) / d;
		const b = (tc - ta) / d;
		return {
			x: A.x * a + B.x * b,
			z: A.z * a + B.z * b
		};
	};
	for (let i = 0; i < steps; i++) {
		const f = i / steps * nPts;
		const i1 = Math.floor(f) % nPts;
		const local = f - Math.floor(f);
		const i0 = (i1 - 1 + nPts) % nPts;
		const i2 = (i1 + 1) % nPts;
		const i3 = (i1 + 2) % nPts;
		const P = [
			RAW_POINTS[i0],
			RAW_POINTS[i1],
			RAW_POINTS[i2],
			RAW_POINTS[i3]
		];
		const knot = (a, b) => Math.max(1e-4, Math.hypot(b.x - a.x, b.z - a.z) ** .5);
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
	const minGap = 28;
	const separate = (passes) => {
		for (let pass = 0; pass < passes; pass++) for (let i = 0; i < steps; i++) for (let j = i + 48; j < steps; j++) {
			if (Math.min(j - i, steps - (j - i)) < 48) continue;
			const dx = pts[j].x - pts[i].x;
			const dz = pts[j].z - pts[i].z;
			const d = Math.hypot(dx, dz);
			if (d >= minGap || d < .001) continue;
			const push = (minGap - d) * .35;
			const nx = dx / d;
			const nz = dz / d;
			pts[i].x -= nx * push;
			pts[i].z -= nz * push;
			pts[j].x += nx * push;
			pts[j].z += nz * push;
		}
	};
	separate(5);
	const copy = pts.map((p) => ({
		x: p.x,
		z: p.z
	}));
	for (let i = 0; i < steps; i++) {
		const a = copy[(i - 1 + steps) % steps];
		const b = copy[i];
		const c = copy[(i + 1) % steps];
		pts[i].x = a.x * .18 + b.x * .64 + c.x * .18;
		pts[i].z = a.z * .18 + b.z * .64 + c.z * .18;
	}
	separate(4);
	let sAcc = 0;
	const dists = [];
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
			s
		});
		s += horiz;
	}
}
buildSamples();
function wrap01(t) {
	return (t % 1 + 1) % 1;
}
function sampleLerp(t) {
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
		s: a.s
	};
}
function nearestOnTrack(x, z, hint) {
	const score = (i) => {
		const p = SAMPLES[i];
		return (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
	};
	let best = 0;
	let bestD = Infinity;
	if (hint !== void 0) {
		const i0 = Math.floor(wrap01(hint) * N);
		const win = 36;
		for (let k = -36; k <= win; k++) {
			const i = (i0 + k + N) % N;
			const d = score(i);
			if (d < bestD) {
				bestD = d;
				best = i;
			}
		}
		if (bestD > 784) {
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
		for (let k = 0; k <= 16; k++) {
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
		onTrack: absLat < 11,
		sample: p,
		dist: Math.sqrt(bestD)
	};
}
var CORNERS = [
	{
		t: 0,
		name: "Reta Principal"
	},
	{
		t: .07,
		name: "S do Senna"
	},
	{
		t: .14,
		name: "Curva do Sol"
	},
	{
		t: .22,
		name: "Reta Oposta"
	},
	{
		t: .33,
		name: "Descida do Lago"
	},
	{
		t: .47,
		name: "Ferradura"
	},
	{
		t: .53,
		name: "Laranjinha"
	},
	{
		t: .56,
		name: "Pinheirinho"
	},
	{
		t: .6,
		name: "Bico de Pato"
	},
	{
		t: .64,
		name: "Mergulho"
	},
	{
		t: .68,
		name: "Junção"
	},
	{
		t: .78,
		name: "Subida dos Boxes"
	},
	{
		t: .9,
		name: "Arquibancadas"
	}
];
function cornerAt(t) {
	const u = wrap01(t);
	let name = CORNERS[0].name;
	for (const c of CORNERS) if (u + .012 >= c.t) name = c.name;
	return name;
}
var CHECKPOINTS = [
	0,
	.08,
	.16,
	.28,
	.4,
	.5,
	.6,
	.7,
	.82,
	.92
];
function progressDelta(from, to) {
	let d = to - from;
	if (d > .5) d -= 1;
	if (d < -.5) d += 1;
	return d;
}
function yawFromTangent(tx, tz) {
	return Math.atan2(-tx, -tz);
}
var MINIMAP = SAMPLES.filter((_, i) => i % 4 === 0).map((s) => ({
	x: s.x,
	z: s.z
}));
var initial = {
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
	x: 0,
	z: 0,
	yaw: 0,
	results: []
};
var useGameStore = create((set) => ({
	...initial,
	patch: (p) => set(p),
	resetHud: () => set({
		...initial,
		bestLap: useGameStore.getState().bestLap
	})
}));
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-opacity duration-[var(--motion-quick)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 disabled:pointer-events-none disabled:opacity-40", {
	variants: {
		variant: {
			primary: "bg-accent text-accent-fg hover:opacity-90 active:scale-[0.98]",
			secondary: "border border-border bg-surface-2 text-fg hover:bg-surface",
			ghost: "text-fg hover:bg-surface-2"
		},
		size: {
			md: "h-11 rounded-[var(--radius-sm)] px-5 text-sm",
			lg: "h-12 rounded-[var(--radius-md)] px-7 text-base",
			xl: "h-14 rounded-[var(--radius-md)] px-8 text-lg"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		ref,
		...props
	});
});
Button.displayName = "Button";
function fmt(t) {
	if (t <= 0) return "—";
	const m = Math.floor(t / 60);
	return `${m}:${(t - m * 60).toFixed(2).padStart(5, "0")}`;
}
function Minimap() {
	const x = useGameStore((s) => s.x);
	const z = useGameStore((s) => s.z);
	const canvasRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
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
		let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
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
		const px = (vx) => ox + (vx - minX) * sc;
		const pz = (vz) => oz + (vz - minZ) * sc;
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref: canvasRef,
		width: 148,
		height: 148,
		className: "h-[92px] w-[92px] md:h-[132px] md:w-[132px]"
	});
}
function StartScreen({ onStart }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-20 flex flex-col justify-end bg-[linear-gradient(180deg,transparent_0%,rgba(12,13,12,0.18)_40%,rgba(12,13,12,0.92)_100%)]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-5 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-10 md:px-12 md:pb-12",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium tracking-[0.28em] text-muted uppercase",
					children: "Autódromo José Carlos Pace"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "font-display text-5xl leading-[0.9] tracking-tight text-fg text-balance md:text-7xl",
					children: ["Copa Truck", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-accent",
						children: "Interlagos"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "max-w-md text-pretty text-sm leading-relaxed text-muted md:text-base",
					children: "Três voltas no traçado clássico de São Paulo. Caminhão de 1.200 cv, S do Senna, Descida do Lago e a subida até as arquibancadas."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "xl",
						onClick: onStart,
						className: "min-w-44 font-display text-2xl tracking-wide",
						children: "Largar"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-subtle",
						children: "Largada · 3 voltas"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "mt-2 hidden grid-cols-3 gap-6 text-xs text-muted md:grid md:max-w-lg",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-subtle",
							children: "Teclado"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "mt-1 text-fg",
							children: "WASD dirigir · Shift drift · R reset"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-subtle",
							children: "Toque"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "mt-1 text-fg",
							children: "Stick esquerdo · pedais à direita"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-subtle",
							children: "Pista"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "mt-1 text-fg",
							children: "Anti-horário · 3 voltas"
						})] })
					]
				})
			]
		})
	});
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-40 md:p-6 md:pb-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-[20px] border border-border bg-bg/70 px-4 py-3 backdrop-blur-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-display text-3xl leading-none tracking-tight text-fg tabular-nums",
						children: [
							"P",
							position,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-lg text-muted",
								children: ["/", field]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-[11px] uppercase tracking-widest text-subtle",
						children: [
							"Volta ",
							lap,
							"/",
							totalLaps
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hidden rounded-[16px] border border-border bg-bg/70 px-3 py-2 text-right backdrop-blur-sm sm:block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] uppercase tracking-widest text-subtle",
							children: corner
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-sm tabular-nums text-fg",
							children: fmt(lapTime)
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minimap, {})]
				})]
			}),
			phase === "countdown" && countdown > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 flex items-center justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-8xl text-fg tabular-nums",
					children: Math.ceil(countdown)
				})
			}),
			wrongWay && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute left-1/2 top-24 -translate-x-1/2 rounded-full bg-danger px-4 py-1.5 text-xs font-medium tracking-wide text-fg",
				children: "Sentido contrário"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-[20px] border border-border bg-bg/70 px-4 py-3 backdrop-blur-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "flex items-center gap-2 text-[10px] uppercase tracking-widest text-subtle",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, { className: "size-3.5" }), "km/h"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-5xl leading-none tabular-nums text-fg",
							children: Math.round(speed)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 font-mono text-[11px] text-muted",
							children: ["Melhor ", fmt(bestLap)]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 h-1 w-28 overflow-hidden rounded-full bg-surface-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full bg-accent",
								style: { width: `${Math.min(100, driftBoost * 100)}%` }
							})
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "hidden max-w-[12rem] text-right text-[11px] text-subtle md:block",
					children: "Esc pausa · Shift drift"
				})]
			})
		]
	});
}
function TouchPad({ onPause }) {
	const steerRef = (0, import_react.useRef)(null);
	function onSteer(e) {
		const el = steerRef.current;
		if (!el) return;
		el.setPointerCapture(e.pointerId);
		const r = el.getBoundingClientRect();
		const x = (e.clientX - r.left) / r.width;
		touch.steer = Math.max(-1, Math.min(1, (.5 - x) * 2));
	}
	function endSteer(e) {
		touch.steer = 0;
		try {
			e.currentTarget.releasePointerCapture(e.pointerId);
		} catch {}
	}
	const btn = "pointer-events-auto h-14 w-14 rounded-full border border-border bg-bg/70 text-fg backdrop-blur-sm active:bg-accent active:text-accent-fg";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: steerRef,
			className: "pointer-events-auto h-28 w-36 rounded-[24px] border border-border bg-bg/55 backdrop-blur-sm",
			onPointerDown: onSteer,
			onPointerMove: (e) => e.buttons && onSteer(e),
			onPointerUp: endSteer,
			onPointerCancel: endSteer
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: cn(btn, "h-11 w-11"),
					onClick: onPause,
					"aria-label": "Pausa",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "mx-auto size-4" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: btn,
					onPointerDown: () => {
						touch.drift = true;
					},
					onPointerUp: () => {
						touch.drift = false;
					},
					onPointerCancel: () => {
						touch.drift = false;
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-medium",
						children: "Drift"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: btn,
					onPointerDown: () => {
						touch.brake = 1;
					},
					onPointerUp: () => {
						touch.brake = 0;
					},
					onPointerCancel: () => {
						touch.brake = 0;
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-medium",
						children: "Freio"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: cn(btn, "h-16 w-16 bg-accent text-accent-fg"),
					onPointerDown: () => {
						touch.throttle = 1;
					},
					onPointerUp: () => {
						touch.throttle = 0;
					},
					onPointerCancel: () => {
						touch.throttle = 0;
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs font-medium",
						children: "Acelera"
					})
				})
			]
		})]
	});
}
function OverlayCard({ title, children, actions }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-30 flex items-center justify-center bg-bg/60 p-4 backdrop-blur-[2px]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md rounded-[28px] border border-border bg-surface p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-4xl tracking-tight text-fg",
					children: title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 text-sm text-muted",
					children
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 flex flex-col gap-2",
					children: actions
				})
			]
		})
	});
}
function GameApp() {
	const canvasRef = (0, import_react.useRef)(null);
	const handle = (0, import_react.useRef)(null);
	const phase = useGameStore((s) => s.phase);
	const results = useGameStore((s) => s.results);
	const totalTime = useGameStore((s) => s.totalTime);
	const position = useGameStore((s) => s.position);
	const [muted, setMuted] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!canvasRef.current) return;
		let disposed = false;
		let handleLocal = null;
		import("./engine-CUTtWQ9C.mjs").then(({ createGame }) => {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative h-dvh w-full overflow-hidden bg-bg text-fg",
		style: { touchAction: "none" },
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className: "block h-full w-full"
			}),
			phase !== "menu" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hud, {}),
			phase === "menu" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StartScreen, { onStart: start }),
			(phase === "racing" || phase === "countdown") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchPad, { onPause: () => handle.current?.pause() }),
			phase === "paused" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverlayCard, {
				title: "Pausa",
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "lg",
						onClick: () => handle.current?.resume(),
						children: "Continuar"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "lg",
						variant: "secondary",
						onClick: () => handle.current?.retry(),
						children: "Relargar"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "lg",
						variant: "ghost",
						onClick: () => handle.current?.toMenu(),
						children: "Menu"
					})
				] }),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "O grid espera em Interlagos." })
			}),
			phase === "finish" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OverlayCard, {
				title: position === 1 ? "Vitória" : `${position}º lugar`,
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "lg",
					onClick: () => handle.current?.retry(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" }), "Nova corrida"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "lg",
					variant: "secondary",
					onClick: () => handle.current?.toMenu(),
					children: "Menu"
				})] }),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mb-3 font-mono text-fg tabular-nums",
					children: ["Tempo ", fmt(totalTime)]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "space-y-1",
					children: results.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: cn("flex justify-between rounded-[10px] px-3 py-2", r.isPlayer ? "bg-accent/15 text-fg" : "text-muted"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							i + 1,
							". ",
							r.name
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono tabular-nums",
							children: r.time > 0 ? fmt(r.time) : "em pista"
						})]
					}, r.name))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "absolute left-4 top-[max(7.5rem,calc(env(safe-area-inset-top)+6.5rem))] z-40 flex size-11 items-center justify-center rounded-full border border-border bg-bg/70 text-fg backdrop-blur-sm",
				onClick: () => setMuted(toggleMute()),
				"aria-label": muted ? "Som" : "Mudo",
				children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-4" })
			}),
			phase === "racing" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "absolute left-[4.25rem] top-[max(7.5rem,calc(env(safe-area-inset-top)+6.5rem))] z-40 hidden size-11 items-center justify-center rounded-full border border-border bg-bg/70 text-fg backdrop-blur-sm md:flex",
				onClick: () => handle.current?.pause(),
				"aria-label": "Pausa",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" })
			})
		]
	});
}
var routes_exports = /* @__PURE__ */ __exportAll({ component: () => Home });
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameApp, {});
}
//#endregion
export { hasInjectedKeys as _, cornerAt as a, setInjectedSteer as b, sampleLerp as c, beep as d, resumeAudio as f, edges as g, bindInput as h, SAMPLES as i, yawFromTangent as l, unlockAudio as m, useGameStore as n, nearestOnTrack as o, setEngine as p, CHECKPOINTS as r, progressDelta as s, routes_exports as t, TRACK_LENGTH as u, readActions as v, unbindInput as x, setInjectedKeys as y };
