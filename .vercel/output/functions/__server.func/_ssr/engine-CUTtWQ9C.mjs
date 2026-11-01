import { _ as hasInjectedKeys, a as cornerAt, b as setInjectedSteer, c as sampleLerp, d as beep, f as resumeAudio, g as edges, h as bindInput, i as SAMPLES, l as yawFromTangent, m as unlockAudio, n as useGameStore, o as nearestOnTrack, p as setEngine, r as CHECKPOINTS, s as progressDelta, u as TRACK_LENGTH, v as readActions, x as unbindInput, y as setInjectedKeys } from "./routes-OcMYRvLw.mjs";
import { C as Scene, S as SRGBColorSpace, _ as Object3D, a as CircleGeometry, b as RepeatWrapping, c as CylinderGeometry, d as Fog, f as Group, g as MeshStandardMaterial, h as Mesh, i as CanvasTexture, l as DirectionalLight, m as InstancedMesh, n as BoxGeometry, o as Color, p as HemisphereLight, r as BufferGeometry, s as ConeGeometry, t as WebGLRenderer, u as Float32BufferAttribute, v as PerspectiveCamera, w as Vector3, x as RingGeometry, y as PlaneGeometry } from "../_libs/three.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/engine-CUTtWQ9C.js
function canvasTex(draw, size = 256) {
	const c = document.createElement("canvas");
	c.width = size;
	c.height = size;
	draw(c.getContext("2d"), size);
	const t = new CanvasTexture(c);
	t.colorSpace = SRGBColorSpace;
	t.wrapS = t.wrapT = RepeatWrapping;
	t.anisotropy = 8;
	return t;
}
function asphaltTex() {
	return canvasTex((g, s) => {
		g.fillStyle = "#2b2c2e";
		g.fillRect(0, 0, s, s);
		for (let i = 0; i < 1800; i++) {
			g.fillStyle = `rgba(0,0,0,${.08 + Math.random() * .12})`;
			g.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1);
		}
		g.fillStyle = "rgba(255,255,255,0.14)";
		g.fillRect(s * .48, 0, 3, s);
	}, 256);
}
function grassTex() {
	return canvasTex((g, s) => {
		g.fillStyle = "#2f5a32";
		g.fillRect(0, 0, s, s);
		for (let i = 0; i < 1200; i++) {
			g.fillStyle = Math.random() > .5 ? "#3a6b38" : "#264a2c";
			g.fillRect(Math.random() * s, Math.random() * s, 2, 2);
		}
	}, 128);
}
function kerbTex() {
	return canvasTex((g, s) => {
		const stripe = s / 8;
		for (let i = 0; i < 8; i++) {
			g.fillStyle = i % 2 === 0 ? "#c23b2e" : "#f4f6f1";
			g.fillRect(0, i * stripe, s, stripe);
		}
	}, 64);
}
function roadGeometry() {
	const segs = SAMPLES.length;
	const hw = 11;
	const positions = [];
	const uvs = [];
	const indices = [];
	for (let i = 0; i < segs; i++) {
		const s = SAMPLES[i];
		const along = s.s / 4;
		const l = hw;
		positions.push(s.x + s.nx * l, s.y + .04, s.z + s.nz * l);
		positions.push(s.x - s.nx * l, s.y + .04, s.z - s.nz * l);
		uvs.push(0, along, 1, along);
	}
	for (let i = 0; i < segs; i++) {
		const a = i * 2;
		const b = a + 1;
		const c = (i + 1) % segs * 2;
		const d = c + 1;
		indices.push(a, c, b, b, c, d);
	}
	const geo = new BufferGeometry();
	geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
	geo.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
	geo.setIndex(indices);
	geo.computeVertexNormals();
	return geo;
}
function stripGeometry(offset, width, yOff = .05) {
	const segs = SAMPLES.length;
	const positions = [];
	const uvs = [];
	const indices = [];
	for (let i = 0; i < segs; i++) {
		const s = SAMPLES[i];
		const a = offset;
		const b = offset + width;
		positions.push(s.x + s.nx * a, s.y + yOff, s.z + s.nz * a);
		positions.push(s.x + s.nx * b, s.y + yOff, s.z + s.nz * b);
		uvs.push(0, s.s / 2.2, 1, s.s / 2.2);
	}
	for (let i = 0; i < segs; i++) {
		const p = i * 2;
		const q = (i + 1) % segs * 2;
		indices.push(p, q, p + 1, p + 1, q, q + 1);
	}
	const geo = new BufferGeometry();
	geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
	geo.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
	geo.setIndex(indices);
	geo.computeVertexNormals();
	return geo;
}
function embankmentGeometry(side) {
	const segs = SAMPLES.length;
	const inner = 21.2 * side;
	const outer = 37 * side;
	const positions = [];
	const uvs = [];
	const indices = [];
	for (let i = 0; i < segs; i++) {
		const s = SAMPLES[i];
		positions.push(s.x + s.nx * inner, s.y + .02, s.z + s.nz * inner);
		positions.push(s.x + s.nx * outer, .02, s.z + s.nz * outer);
		uvs.push(0, s.s / 8, 1, s.s / 8);
	}
	for (let i = 0; i < segs; i++) {
		const p = i * 2;
		const q = (i + 1) % segs * 2;
		if (side > 0) indices.push(p, q, p + 1, p + 1, q, q + 1);
		else indices.push(p, p + 1, q, p + 1, q + 1, q);
	}
	const geo = new BufferGeometry();
	geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
	geo.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
	geo.setIndex(indices);
	geo.computeVertexNormals();
	return geo;
}
function wallGeometry(side) {
	const segs = SAMPLES.length;
	const hw = 20.6;
	const h = 1.15;
	const positions = [];
	const indices = [];
	for (let i = 0; i < segs; i++) {
		const s = SAMPLES[i];
		const x = s.x + s.nx * hw * side;
		const z = s.z + s.nz * hw * side;
		positions.push(x, s.y, z, x, s.y + h, z);
	}
	for (let i = 0; i < segs; i++) {
		const a = i * 2;
		const b = (i + 1) % segs * 2;
		if (side > 0) indices.push(a, b, a + 1, a + 1, b, b + 1);
		else indices.push(a, a + 1, b, a + 1, b + 1, b);
	}
	const geo = new BufferGeometry();
	geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
	geo.setIndex(indices);
	geo.computeVertexNormals();
	return geo;
}
function buildWorld(scene) {
	const asphalt = asphaltTex();
	asphalt.repeat.set(1, TRACK_LENGTH / 18);
	const grass = grassTex();
	grass.repeat.set(90, 90);
	const kerb = kerbTex();
	const roadM = new MeshStandardMaterial({
		map: asphalt,
		roughness: .82,
		metalness: .05
	});
	const grassM = new MeshStandardMaterial({
		map: grass,
		roughness: .95
	});
	const kerbM = new MeshStandardMaterial({
		map: kerb,
		roughness: .55
	});
	const wallM = new MeshStandardMaterial({
		color: "#cfc8bb",
		roughness: .5,
		metalness: .15
	});
	const runoffM = new MeshStandardMaterial({
		color: "#3f6a3c",
		roughness: .95
	});
	const road = new Mesh(roadGeometry(), roadM);
	road.receiveShadow = true;
	scene.add(road);
	const kerbL = new Mesh(stripGeometry(9.65, 2.35), kerbM);
	const kerbR = new Mesh(stripGeometry(-9.65, -2.35), kerbM);
	scene.add(kerbL, kerbR);
	const runL = new Mesh(stripGeometry(12.1, 8.6, 0), runoffM);
	const runR = new Mesh(stripGeometry(-12.1, -8.6, 0), runoffM);
	runL.receiveShadow = true;
	runR.receiveShadow = true;
	scene.add(runL, runR);
	const wallL = new Mesh(wallGeometry(1), wallM);
	const wallR = new Mesh(wallGeometry(-1), wallM);
	scene.add(wallL, wallR);
	const ground = new Mesh(new PlaneGeometry(1800, 1800), grassM);
	ground.rotation.x = -Math.PI / 2;
	ground.position.y = 0;
	ground.receiveShadow = true;
	scene.add(ground);
	const bankL = new Mesh(embankmentGeometry(1), grassM);
	const bankR = new Mesh(embankmentGeometry(-1), grassM);
	bankL.receiveShadow = true;
	bankR.receiveShadow = true;
	scene.add(bankL, bankR);
	const lakeS = SAMPLES[Math.floor(.38 * SAMPLES.length)];
	const lakeM = new MeshStandardMaterial({
		color: "#1a4a5c",
		roughness: .18,
		metalness: .35
	});
	const lake = new Mesh(new CircleGeometry(36, 28), lakeM);
	lake.rotation.x = -Math.PI / 2;
	lake.position.set(lakeS.x + lakeS.nx * 48, .2, lakeS.z + lakeS.nz * 48);
	scene.add(lake);
	const lakeEdge = new Mesh(new RingGeometry(36, 44, 28), new MeshStandardMaterial({
		color: "#6b5a3e",
		roughness: 1
	}));
	lakeEdge.rotation.x = -Math.PI / 2;
	lakeEdge.position.set(lake.position.x, .18, lake.position.z);
	scene.add(lakeEdge);
	const sf = SAMPLES[0];
	const lineM = new MeshStandardMaterial({ color: "#f4f6f1" });
	const sfLine = new Mesh(new BoxGeometry(22, .06, .9), lineM);
	sfLine.position.set(sf.x, sf.y + .08, sf.z);
	sfLine.rotation.y = Math.atan2(sf.tx, sf.tz);
	scene.add(sfLine);
	const gantry = new Group();
	const postM = new MeshStandardMaterial({
		color: "#d9d4c8",
		roughness: .45
	});
	const spanM = new MeshStandardMaterial({
		color: "#1c3d8a",
		roughness: .4
	});
	const postGeo = new BoxGeometry(.55, 9, .55);
	const postL = new Mesh(postGeo, postM);
	postL.position.set(13.4, 4.5, 6);
	const postR = postL.clone();
	postR.position.x = -13.4;
	const span = new Mesh(new BoxGeometry(28, .85, 1.1), spanM);
	span.position.set(0, 9.1, 6);
	const signC = document.createElement("canvas");
	signC.width = 512;
	signC.height = 96;
	const sg = signC.getContext("2d");
	sg.fillStyle = "#1c3d8a";
	sg.fillRect(0, 0, 512, 96);
	sg.fillStyle = "#f4f6f1";
	sg.font = "700 54px Teko, sans-serif";
	sg.textAlign = "center";
	sg.textBaseline = "middle";
	sg.fillText("INTERLAGOS", 256, 52);
	const signTex = new CanvasTexture(signC);
	signTex.colorSpace = SRGBColorSpace;
	const sign = new Mesh(new PlaneGeometry(10, 1.6), new MeshStandardMaterial({
		map: signTex,
		side: 2
	}));
	sign.position.set(0, 9.1, 5.45);
	sign.rotation.y = Math.PI;
	gantry.add(postL, postR, span, sign);
	gantry.position.set(sf.x, sf.y, sf.z);
	gantry.rotation.y = Math.atan2(sf.tx, sf.tz);
	scene.add(gantry);
	const standM = new MeshStandardMaterial({
		color: "#8a9094",
		roughness: .7
	});
	const seatM = new MeshStandardMaterial({
		color: "#c23b2e",
		roughness: .6
	});
	for (let k = 0; k < 7; k++) {
		const sm = SAMPLES[(SAMPLES.length - 18 + k * 6) % SAMPLES.length];
		const stand = new Group();
		const base = new Mesh(new BoxGeometry(18, 8, 7), standM);
		base.position.y = 4;
		base.castShadow = true;
		const seats = new Mesh(new BoxGeometry(17.2, 5.2, .4), seatM);
		seats.position.set(0, 4.2, 2.8);
		stand.add(base, seats);
		const outside = 1;
		stand.position.set(sm.x + sm.nx * 27 * outside, sm.y, sm.z + sm.nz * 27 * outside);
		stand.lookAt(sm.x, sm.y + 4, sm.z);
		scene.add(stand);
	}
	const pit = new Group();
	const pitM = new MeshStandardMaterial({
		color: "#d9d4c8",
		roughness: .55
	});
	const box = new Mesh(new BoxGeometry(48, 6, 10), pitM);
	box.position.y = 3;
	box.castShadow = true;
	const roof = new Mesh(new BoxGeometry(50, .4, 14), new MeshStandardMaterial({ color: "#2f9e4a" }));
	roof.position.y = 6.3;
	pit.add(box, roof);
	const pitS = SAMPLES[8];
	pit.position.set(pitS.x - pitS.nx * 31, pitS.y, pitS.z - pitS.nz * 31);
	pit.lookAt(pitS.x, pitS.y + 3, pitS.z);
	scene.add(pit);
	const trunkG = new CylinderGeometry(.28, .4, 3.2, 5);
	const crownG = new ConeGeometry(2.1, 4.4, 6);
	const trunkM = new MeshStandardMaterial({ color: "#4a3424" });
	const crownM = new MeshStandardMaterial({ color: "#1f4d28" });
	const trunks = new InstancedMesh(trunkG, trunkM, 70);
	const crowns = new InstancedMesh(crownG, crownM, 70);
	const dummy = new Object3D();
	let placed = 0;
	const rng = (n) => {
		const x = Math.sin(n * 127.1) * 43758.5453;
		return x - Math.floor(x);
	};
	const clearOfTrack = (x, z) => {
		let best = Infinity;
		for (let k = 0; k < SAMPLES.length; k += 2) {
			const s = SAMPLES[k];
			const d = (s.x - x) * (s.x - x) + (s.z - z) * (s.z - z);
			if (d < best) best = d;
		}
		return Math.sqrt(best) > 25;
	};
	for (let i = 0; i < 240 && placed < 48; i++) {
		const sm = SAMPLES[Math.floor(rng(i + 3) * SAMPLES.length)];
		const side = rng(i + 9) > .5 ? 1 : -1;
		const dist = 29 + rng(i + 17) * 42;
		const x = sm.x + sm.nx * side * dist;
		const z = sm.z + sm.nz * side * dist;
		if (!clearOfTrack(x, z)) continue;
		dummy.position.set(x, sm.y + 1.6, z);
		dummy.rotation.set(0, rng(i) * Math.PI * 2, 0);
		dummy.scale.set(1, 1, 1);
		dummy.updateMatrix();
		trunks.setMatrixAt(placed, dummy.matrix);
		dummy.position.y += 3.4;
		dummy.updateMatrix();
		crowns.setMatrixAt(placed, dummy.matrix);
		placed++;
	}
	trunks.count = placed;
	crowns.count = placed;
	trunks.instanceMatrix.needsUpdate = true;
	crowns.instanceMatrix.needsUpdate = true;
	scene.add(trunks, crowns);
	const bM = new MeshStandardMaterial({
		color: "#6d7380",
		roughness: .85
	});
	for (let i = 0; i < 18; i++) {
		const h = 18 + rng(i + 40) * 55;
		const b = new Mesh(new BoxGeometry(10 + rng(i) * 16, h, 10 + rng(i + 2) * 12), bM);
		const ang = -.2 + i * .16;
		const rad = 520 + rng(i + 7) * 80;
		b.position.set(Math.sin(ang) * rad, h / 2 - 2, -Math.cos(ang) * rad - 80);
		scene.add(b);
	}
	const poleM = new MeshStandardMaterial({ color: "#c9c4b8" });
	function flag(x, y, z) {
		const pole = new Mesh(new CylinderGeometry(.08, .08, 9, 6), poleM);
		pole.position.set(x, y + 4.5, z);
		const canvas = document.createElement("canvas");
		canvas.width = 128;
		canvas.height = 84;
		const g = canvas.getContext("2d");
		g.fillStyle = "#1f8a3c";
		g.fillRect(0, 0, 128, 84);
		g.fillStyle = "#e8c547";
		g.beginPath();
		g.moveTo(64, 8);
		g.lineTo(118, 42);
		g.lineTo(64, 76);
		g.lineTo(10, 42);
		g.closePath();
		g.fill();
		g.fillStyle = "#1c3d8a";
		g.beginPath();
		g.arc(64, 42, 16, 0, Math.PI * 2);
		g.fill();
		const tex = new CanvasTexture(canvas);
		tex.colorSpace = SRGBColorSpace;
		const fl = new Mesh(new PlaneGeometry(3.2, 2.1), new MeshStandardMaterial({
			map: tex,
			side: 2
		}));
		fl.position.set(x + 1.6, y + 8.2, z);
		scene.add(pole, fl);
	}
	flag(sf.x + sf.nx * 19, sf.y, sf.z + sf.nz * 19);
	flag(sf.x - sf.nx * 19, sf.y, sf.z - sf.nz * 19);
	const boardC = document.createElement("canvas");
	boardC.width = 512;
	boardC.height = 128;
	const bg = boardC.getContext("2d");
	bg.fillStyle = "#1f8a3c";
	bg.fillRect(0, 0, 512, 128);
	bg.fillStyle = "#e8c547";
	bg.fillRect(0, 96, 512, 32);
	bg.fillStyle = "#071109";
	bg.font = "700 64px Teko, sans-serif";
	bg.textAlign = "center";
	bg.textBaseline = "middle";
	bg.fillText("COPA TRUCK", 256, 58);
	const boardTex = new CanvasTexture(boardC);
	boardTex.colorSpace = SRGBColorSpace;
	const board = new Mesh(new BoxGeometry(16, 3.4, .35), new MeshStandardMaterial({
		map: boardTex,
		color: "#ffffff"
	}));
	const bs = SAMPLES[20];
	board.position.set(bs.x + bs.nx * 27, bs.y + 6, bs.z + bs.nz * 27);
	board.lookAt(bs.x, bs.y + 6, bs.z);
	scene.add(board);
	scene.background = new Color("#7ea3b8");
	scene.fog = new Fog("#8eacb8", 180, 780);
	const hemi = new HemisphereLight("#d7e6ef", "#3d5c32", .7);
	scene.add(hemi);
	const sun = new DirectionalLight("#fff3d6", 1.55);
	sun.position.set(-120, 90, 40);
	sun.castShadow = true;
	sun.shadow.mapSize.set(2048, 2048);
	sun.shadow.camera.near = 10;
	sun.shadow.camera.far = 420;
	sun.shadow.camera.left = -80;
	sun.shadow.camera.right = 80;
	sun.shadow.camera.top = 80;
	sun.shadow.camera.bottom = -80;
	sun.shadow.bias = -2e-4;
	scene.add(sun);
	const fill = new DirectionalLight("#9bb8c9", .25);
	fill.position.set(40, 30, -60);
	scene.add(fill);
	return () => {
		road.geometry.dispose();
		kerbL.geometry.dispose();
		kerbR.geometry.dispose();
		asphalt.dispose();
		grass.dispose();
		kerb.dispose();
	};
}
function mat(color, extras = {}) {
	return new MeshStandardMaterial({
		color,
		roughness: .42,
		metalness: .18,
		...extras
	});
}
function liveryTexture(livery) {
	const c = document.createElement("canvas");
	c.width = 512;
	c.height = 512;
	const g = c.getContext("2d");
	g.fillStyle = livery.body;
	g.fillRect(0, 0, 512, 512);
	for (let i = 0; i < 1400; i++) {
		const a = .03 + Math.random() * .05;
		g.fillStyle = Math.random() > .5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a * .6})`;
		g.fillRect(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 2, 1);
	}
	g.strokeStyle = "rgba(0,0,0,0.35)";
	g.lineWidth = 3;
	for (let y = 36; y < 512; y += 52) {
		g.beginPath();
		g.moveTo(0, y);
		g.lineTo(512, y);
		g.stroke();
	}
	for (let x = 64; x < 512; x += 128) {
		g.beginPath();
		g.moveTo(x, 0);
		g.lineTo(x, 512);
		g.stroke();
	}
	g.fillStyle = livery.stripe;
	g.fillRect(0, 292, 512, 78);
	g.fillStyle = livery.accent;
	g.fillRect(0, 370, 512, 18);
	g.beginPath();
	g.moveTo(0, 48);
	g.lineTo(210, 48);
	g.lineTo(300, 168);
	g.lineTo(70, 168);
	g.closePath();
	g.fill();
	g.fillStyle = livery.stripe;
	g.font = "700 54px Teko, Arial Black, sans-serif";
	g.textAlign = "left";
	g.textBaseline = "middle";
	g.fillText(livery.number, 24, 118);
	const t = new CanvasTexture(c);
	t.colorSpace = SRGBColorSpace;
	t.anisotropy = 8;
	return t;
}
function grillTexture() {
	const c = document.createElement("canvas");
	c.width = 128;
	c.height = 64;
	const g = c.getContext("2d");
	g.fillStyle = "#141414";
	g.fillRect(0, 0, 128, 64);
	g.fillStyle = "#3c3c3c";
	for (let y = 6; y < 64; y += 10) g.fillRect(4, y, 120, 4);
	const t = new CanvasTexture(c);
	t.colorSpace = SRGBColorSpace;
	return t;
}
function numberTexture(num, livery) {
	const c = document.createElement("canvas");
	c.width = 256;
	c.height = 256;
	const g = c.getContext("2d");
	g.fillStyle = livery.accent;
	g.fillRect(0, 0, 256, 256);
	g.fillStyle = livery.stripe;
	g.fillRect(12, 12, 232, 232);
	g.fillStyle = livery.body;
	g.font = "bold 140px Teko, Arial Black, sans-serif";
	g.textAlign = "center";
	g.textBaseline = "middle";
	g.fillText(num, 128, 142);
	const t = new CanvasTexture(c);
	t.colorSpace = SRGBColorSpace;
	t.anisotropy = 8;
	return t;
}
function createTruck(livery) {
	const group = new Group();
	const body = new Group();
	group.add(body);
	const bodyM = mat("#ffffff", {
		map: liveryTexture(livery),
		roughness: .46,
		metalness: .22
	});
	const cabM = bodyM;
	const stripeM = mat(livery.stripe);
	const accentM = mat(livery.accent);
	const wingM = mat(livery.wing, {
		metalness: .4,
		roughness: .3
	});
	const darkM = mat("#121212", { roughness: .6 });
	const glassM = mat("#0b1520", {
		roughness: .08,
		metalness: .7,
		transparent: true,
		opacity: .72
	});
	const rubberM = mat("#1a1a1a", {
		roughness: .92,
		metalness: .05
	});
	const rimM = mat(livery.rim, {
		metalness: .65,
		roughness: .28
	});
	const lightM = mat("#f2f0d8", {
		emissive: "#f2e8b0",
		emissiveIntensity: .55,
		roughness: .3
	});
	const brakeM = mat("#5a0c0c", {
		emissive: "#c23b2e",
		emissiveIntensity: .35
	});
	const chassis = new Mesh(new BoxGeometry(2.35, .38, 5.3), darkM);
	chassis.position.y = .62;
	chassis.castShadow = true;
	body.add(chassis);
	const cab = new Mesh(new BoxGeometry(2.42, 1.55, 2.15), cabM);
	cab.position.set(0, 1.48, 1.42);
	cab.castShadow = true;
	body.add(cab);
	const roof = new Mesh(new BoxGeometry(2.46, .12, 2.2), stripeM);
	roof.position.set(0, 2.28, 1.42);
	body.add(roof);
	const windshield = new Mesh(new BoxGeometry(2.1, .95, .08), glassM);
	windshield.position.set(0, 1.62, 2.48);
	windshield.rotation.x = -.18;
	body.add(windshield);
	const sideGlassL = new Mesh(new BoxGeometry(.06, .7, 1.4), glassM);
	sideGlassL.position.set(1.22, 1.7, 1.4);
	const sideGlassR = sideGlassL.clone();
	sideGlassR.position.x = -1.22;
	body.add(sideGlassL, sideGlassR);
	const bumper = new Mesh(new BoxGeometry(2.55, .28, .55), accentM);
	bumper.position.set(0, .55, 2.72);
	bumper.castShadow = true;
	body.add(bumper);
	const splitter = new Mesh(new BoxGeometry(2.7, .08, .7), wingM);
	splitter.position.set(0, .38, 2.85);
	body.add(splitter);
	const grill = new Mesh(new BoxGeometry(1.4, .7, .12), new MeshStandardMaterial({
		map: grillTexture(),
		roughness: .55,
		metalness: .4
	}));
	grill.position.set(0, 1.05, 2.52);
	body.add(grill);
	const hl1 = new Mesh(new BoxGeometry(.42, .18, .1), lightM);
	hl1.position.set(.78, .92, 2.56);
	const hl2 = hl1.clone();
	hl2.position.x = -.78;
	body.add(hl1, hl2);
	const skirtL = new Mesh(new BoxGeometry(.16, .35, 4.4), stripeM);
	skirtL.position.set(1.22, .62, .1);
	const skirtR = skirtL.clone();
	skirtR.position.x = -1.22;
	body.add(skirtL, skirtR);
	const fenderFL = new Mesh(new BoxGeometry(.42, .55, 1.15), bodyM);
	fenderFL.position.set(1.28, .78, 1.55);
	const fenderFR = fenderFL.clone();
	fenderFR.position.x = -1.28;
	const fenderRL = fenderFL.clone();
	fenderRL.position.set(1.28, .78, -1.55);
	const fenderRR = fenderFL.clone();
	fenderRR.position.set(-1.28, .78, -1.55);
	body.add(fenderFL, fenderFR, fenderRL, fenderRR);
	const deck = new Mesh(new BoxGeometry(2.2, .12, 2.6), darkM);
	deck.position.set(0, .95, -1.2);
	body.add(deck);
	const stallL = new Mesh(new BoxGeometry(.08, 1.35, .12), wingM);
	stallL.position.set(1.05, 1.55, -2.35);
	const stallR = stallL.clone();
	stallR.position.x = -1.05;
	body.add(stallL, stallR);
	const wing = new Mesh(new BoxGeometry(2.85, .1, .55), wingM);
	wing.position.set(0, 2.28, -2.38);
	wing.rotation.x = .12;
	wing.castShadow = true;
	body.add(wing);
	const endL = new Mesh(new BoxGeometry(.08, .42, .62), stripeM);
	endL.position.set(1.42, 2.28, -2.38);
	const endR = endL.clone();
	endR.position.x = -1.42;
	body.add(endL, endR);
	const tailL = new Mesh(new BoxGeometry(.35, .12, .08), brakeM);
	tailL.position.set(.85, .92, -2.66);
	const tailR = tailL.clone();
	tailR.position.x = -.85;
	body.add(tailL, tailR);
	const numTex = numberTexture(livery.number, livery);
	const numM = new MeshStandardMaterial({
		map: numTex,
		roughness: .45
	});
	const numL = new Mesh(new PlaneGeometry(.7, .7), numM);
	numL.position.set(1.24, 1.35, .15);
	numL.rotation.y = Math.PI / 2;
	const numR = new Mesh(new PlaneGeometry(.7, .7), numM);
	numR.position.set(-1.24, 1.35, .15);
	numR.rotation.y = -Math.PI / 2;
	body.add(numL, numR);
	const stripe = new Mesh(new BoxGeometry(2.44, .14, 4.8), stripeM);
	stripe.position.set(0, .92, .05);
	body.add(stripe);
	const visor = new Mesh(new BoxGeometry(2.3, .1, .38), darkM);
	visor.position.set(0, 2.22, 2.22);
	body.add(visor);
	function mirror(x) {
		const m = new Group();
		const arm = new Mesh(new BoxGeometry(.28, .06, .06), darkM);
		arm.position.x = x > 0 ? .14 : -.14;
		const head = new Mesh(new BoxGeometry(.16, .22, .08), darkM);
		head.position.x = x > 0 ? .32 : -.32;
		m.add(arm, head);
		m.position.set(x, 1.85, 2.05);
		return m;
	}
	body.add(mirror(1.2), mirror(-1.2));
	const stackL = new Mesh(new CylinderGeometry(.08, .08, 1.15, 8), darkM);
	stackL.position.set(.7, 1.7, .15);
	const stackR = stackL.clone();
	stackR.position.x = -.7;
	body.add(stackL, stackR);
	const bannerC = document.createElement("canvas");
	bannerC.width = 512;
	bannerC.height = 96;
	const bg = bannerC.getContext("2d");
	bg.fillStyle = livery.stripe;
	bg.fillRect(0, 0, 512, 96);
	bg.fillStyle = livery.cab;
	bg.font = "700 58px Teko, sans-serif";
	bg.textAlign = "center";
	bg.textBaseline = "middle";
	bg.fillText("COPA TRUCK", 256, 54);
	const bannerTex = new CanvasTexture(bannerC);
	bannerTex.colorSpace = SRGBColorSpace;
	const bannerM = new MeshStandardMaterial({
		map: bannerTex,
		roughness: .5
	});
	const bannerL = new Mesh(new PlaneGeometry(2.2, .42), bannerM);
	bannerL.position.set(1.23, 1.05, -.35);
	bannerL.rotation.y = Math.PI / 2;
	const bannerR = bannerL.clone();
	bannerR.position.x = -1.23;
	bannerR.rotation.y = -Math.PI / 2;
	body.add(bannerL, bannerR);
	const wheels = [];
	const frontWheels = [];
	function makeWheel() {
		const w = new Group();
		const tire = new Mesh(new CylinderGeometry(.52, .52, .38, 18), rubberM);
		tire.rotation.z = Math.PI / 2;
		tire.castShadow = true;
		const rim = new Mesh(new CylinderGeometry(.28, .28, .4, 16), rimM);
		rim.rotation.z = Math.PI / 2;
		w.add(tire, rim);
		return w;
	}
	const fl = makeWheel();
	fl.position.set(1.05, .52, 1.55);
	const fr = makeWheel();
	fr.position.set(-1.05, .52, 1.55);
	body.add(fl, fr);
	wheels.push(fl, fr);
	frontWheels.push(fl, fr);
	const rl1 = makeWheel();
	rl1.position.set(1.05, .52, -1.35);
	const rl2 = makeWheel();
	rl2.position.set(1.05, .52, -1.85);
	const rr1 = makeWheel();
	rr1.position.set(-1.05, .52, -1.35);
	const rr2 = makeWheel();
	rr2.position.set(-1.05, .52, -1.85);
	body.add(rl1, rl2, rr1, rr2);
	wheels.push(rl1, rl2, rr1, rr2);
	group.userData.livery = livery.id;
	return {
		group,
		wheels,
		frontWheels,
		body
	};
}
var LIVERIES = [
	{
		id: "player",
		name: "Bandeira",
		number: "07",
		body: "#1f8a3c",
		cab: "#1f8a3c",
		stripe: "#e8c547",
		accent: "#1c3d8a",
		wing: "#0e0f0e",
		rim: "#d8d4c8"
	},
	{
		id: "ai1",
		name: "Paulista",
		number: "11",
		body: "#b42318",
		cab: "#b42318",
		stripe: "#f4f6f1",
		accent: "#1a1a1a",
		wing: "#1a1a1a",
		rim: "#c9c4b8"
	},
	{
		id: "ai2",
		name: "Atlântica",
		number: "22",
		body: "#1d4e89",
		cab: "#1d4e89",
		stripe: "#e8eef6",
		accent: "#c23b2e",
		wing: "#101418",
		rim: "#c9c4b8"
	},
	{
		id: "ai3",
		name: "Sol",
		number: "44",
		body: "#c45c12",
		cab: "#c45c12",
		stripe: "#1a1a1a",
		accent: "#f0efe8",
		wing: "#1a1a1a",
		rim: "#c9c4b8"
	},
	{
		id: "ai4",
		name: "Noite",
		number: "88",
		body: "#1a1d1a",
		cab: "#1a1d1a",
		stripe: "#2f9e4a",
		accent: "#e8eee4",
		wing: "#0c0d0c",
		rim: "#8a8a84"
	}
];
var MAX_SPEED = 54;
var ACCEL = 24;
var BRAKE = 36;
var DRAG = .42;
var TURN = 1.55;
var GRIP = 9.5;
var DRIFT_GRIP = 2.6;
function clamp(v, a, b) {
	return Math.max(a, Math.min(b, v));
}
function spawnTruck(index, isPlayer) {
	const row = Math.floor(index / 2);
	const col = index % 2 === 0 ? -1.8 : 1.8;
	const dist = 40 - row * 7.6;
	const s0 = sampleLerp(dist / TRACK_LENGTH);
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
		skill: isPlayer ? 1 : .78 + index * .04,
		boost: 0,
		charge: 0,
		drifting: false
	};
}
function createField() {
	return LIVERIES.map((liv, i) => spawnTruck(i, i === 0));
}
function applyDrive(tr, throttle, brake, steer, drift, dt) {
	const near = nearestOnTrack(tr.x, tr.z, tr.t);
	const onSlow = Math.abs(near.lateral) > 9.65;
	const offTrack = onSlow;
	const speedFactor = clamp(Math.abs(tr.speed) / 9, 0, 1) * (1 - .38 * clamp(Math.abs(tr.speed) / MAX_SPEED, 0, 1));
	const reverse = tr.speed >= 0 ? 1 : -1;
	tr.yaw += steer * TURN * speedFactor * reverse * dt;
	tr.steerVis += (steer - tr.steerVis) * (1 - Math.exp(-12 * dt));
	if (throttle > 0) tr.speed += throttle * ACCEL * dt;
	if (brake > 0) {
		if (tr.speed > .4) tr.speed -= brake * BRAKE * dt;
		else tr.speed -= brake * ACCEL * .45 * dt;
	}
	tr.speed *= 1 - (DRAG + (throttle < .1 && brake < .1 ? .35 : 0)) * dt;
	if (tr.boost > 0) {
		tr.speed += 18 * dt;
		tr.boost = Math.max(0, tr.boost - dt);
	}
	const max = (MAX_SPEED + (tr.boost > 0 ? 10 : 0)) * (onSlow ? .9 : 1);
	if (tr.speed > max) tr.speed += (max - tr.speed) * Math.min(1, 6 * dt);
	tr.speed = clamp(tr.speed, -12 * (onSlow ? .9 : 1), max + .4);
	const wasDrifting = tr.drifting;
	tr.drifting = drift && Math.abs(steer) > .2 && Math.abs(tr.speed) > 10;
	if (tr.drifting) tr.charge = Math.min(1, tr.charge + dt * .75);
	else if (wasDrifting && tr.charge > .28) {
		tr.boost = Math.max(tr.boost, .4 + tr.charge * .85);
		tr.charge = 0;
	} else tr.charge = Math.max(0, tr.charge - dt * .4);
	const fx = -Math.sin(tr.yaw);
	const fz = -Math.cos(tr.yaw);
	const rx = Math.cos(tr.yaw);
	const rz = -Math.sin(tr.yaw);
	tr.vx = fx * tr.speed;
	tr.vz = fz * tr.speed;
	const grip = tr.drifting ? DRIFT_GRIP : GRIP;
	const lat = tr.slide;
	tr.slide += -steer * Math.abs(tr.speed) * (tr.drifting ? 1.6 : .35) * dt;
	tr.slide *= Math.exp(-grip * dt);
	tr.x += (tr.vx + rx * lat) * dt;
	tr.z += (tr.vz + rz * lat) * dt;
	const n2 = nearestOnTrack(tr.x, tr.z, tr.t);
	tr.y = n2.sample.y;
	const wall = 20.2;
	if (Math.abs(n2.lateral) > wall) {
		const push = (Math.abs(n2.lateral) - wall) * Math.sign(n2.lateral);
		tr.x -= n2.sample.nx * push;
		tr.z -= n2.sample.nz * push;
		tr.speed *= .72;
		tr.slide *= .4;
	}
	const dProg = progressDelta(tr.t, n2.t);
	tr.t = n2.t;
	if (!tr.finished && dProg > -.2) {
		const cp = CHECKPOINTS[tr.nextCp];
		const prev = CHECKPOINTS[(tr.nextCp - 1 + CHECKPOINTS.length) % CHECKPOINTS.length];
		if (crossed(prev, cp, tr.t, dProg)) {
			if (tr.nextCp === 0) {
				tr.lastLap = tr.lapTime;
				if (tr.bestLap === 0 || tr.lapTime < tr.bestLap) tr.bestLap = tr.lapTime;
				if (tr.lap >= 3) {
					tr.finished = true;
					tr.speed *= .4;
				} else {
					tr.lap += 1;
					tr.lapTime = 0;
				}
			}
			tr.nextCp = (tr.nextCp + 1) % CHECKPOINTS.length;
		}
	}
	return {
		offTrack,
		near: n2,
		dProg
	};
}
function crossed(fromT, toT, now, dProg) {
	if (dProg <= 5e-4) return false;
	if (toT > fromT) return now >= toT && now - dProg < toT;
	return now >= toT && now < .2;
}
function aiDrive(tr, dt) {
	const look = .045 + tr.speed / 900;
	const target = sampleLerp(tr.t + look * tr.skill);
	-Math.sin(tr.yaw);
	-Math.cos(tr.yaw);
	const toX = target.x - tr.x;
	const toZ = target.z - tr.z;
	let err = Math.atan2(-toX, -toZ) - tr.yaw;
	while (err > Math.PI) err -= Math.PI * 2;
	while (err < -Math.PI) err += Math.PI * 2;
	let steer = clamp(err * 1.6, -1, 1);
	const ahead = sampleLerp(tr.t + .03);
	const ahead2 = sampleLerp(tr.t + .07);
	const curv = Math.abs(Math.atan2(ahead2.tx, ahead2.tz) - Math.atan2(ahead.tx, ahead.tz));
	let throttle = tr.skill;
	let brake = 0;
	if (curv > .12 && tr.speed > 22) {
		throttle = .15;
		brake = clamp((tr.speed - 20) / 30, 0, .85);
	} else if (curv > .06 && tr.speed > 32) {
		throttle = .45;
		brake = .2;
	}
	const drift = curv > .1 && tr.speed > 18 && Math.abs(steer) > .4;
	return {
		throttle,
		brake,
		steer,
		drift
	};
}
function stepField(field, playerActions, dt, racing) {
	const player = field[0];
	let offTrack = false;
	let dProg = 0;
	if (racing && !player.finished) {
		const r = applyDrive(player, playerActions.throttle, playerActions.brake, playerActions.steer, playerActions.drift, dt);
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
	if (racing) for (let i = 1; i < field.length; i++) {
		const tr = field[i];
		if (tr.finished) {
			tr.speed *= Math.exp(-2 * dt);
			applyDrive(tr, 0, .15, 0, false, dt);
			continue;
		}
		const a = aiDrive(tr, dt);
		applyDrive(tr, a.throttle, a.brake, a.steer, a.drift, dt);
		tr.lapTime += dt;
		tr.raceTime += dt;
	}
	for (let i = 0; i < field.length; i++) for (let j = i + 1; j < field.length; j++) {
		const a = field[i];
		const b = field[j];
		const dx = b.x - a.x;
		const dz = b.z - a.z;
		const d = Math.hypot(dx, dz);
		const min = 3.4;
		if (d < min && d > .01) {
			const nrm = (min - d) * .5;
			const nx = dx / d;
			const nz = dz / d;
			a.x -= nx * nrm;
			a.z -= nz * nrm;
			b.x += nx * nrm;
			b.z += nz * nrm;
			a.speed *= .96;
			b.speed *= .96;
		}
	}
	return {
		player,
		field,
		offTrack,
		wrongWay: racing && dProg < -.002 && player.speed > 4,
		corner: cornerAt(player.t)
	};
}
function respawn(tr) {
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
function raceDistance(tr) {
	return (tr.lap - 1) * TRACK_LENGTH + tr.t * TRACK_LENGTH;
}
var FIXED = 1 / 60;
function loadBest() {
	try {
		const v = localStorage.getItem("ct-interlagos-best");
		return v ? Number(v) || 0 : 0;
	} catch {
		return 0;
	}
}
function saveBest(t) {
	try {
		localStorage.setItem("ct-interlagos-best", String(t));
	} catch {}
}
function createGame(canvas) {
	bindInput();
	const renderer = new WebGLRenderer({
		canvas,
		antialias: true,
		powerPreference: "high-performance"
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
	renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, false);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = 2;
	renderer.outputColorSpace = SRGBColorSpace;
	renderer.toneMapping = 4;
	renderer.toneMappingExposure = 1.05;
	const scene = new Scene();
	const camera = new PerspectiveCamera(62, 1, .2, 1200);
	const disposeWorld = buildWorld(scene);
	let field = createField();
	field[0].bestLap = loadBest();
	const visuals = field.map((tr) => {
		const vis = createTruck(tr.livery);
		scene.add(vis.group);
		return vis;
	});
	const camPos = new Vector3();
	const camLook = new Vector3();
	const desired = new Vector3();
	const lookAt = new Vector3();
	const up = new Vector3(0, 1, 0);
	let phase = "menu";
	let countdown = 3;
	let acc = 0;
	let running = true;
	let hudAcc = 0;
	let trauma = 0;
	const storedBest = loadBest();
	useGameStore.getState().patch({
		bestLap: storedBest,
		phase: "menu"
	});
	const sun = scene.children.find((c) => c instanceof DirectionalLight);
	function layout() {
		const w = canvas.clientWidth || window.innerWidth;
		const h = canvas.clientHeight || window.innerHeight;
		renderer.setSize(w, h, false);
		camera.aspect = w / Math.max(1, h);
		camera.updateProjectionMatrix();
	}
	layout();
	const ro = new ResizeObserver(layout);
	ro.observe(canvas);
	function syncVisual(tr, vis, dt) {
		vis.group.position.set(tr.x, tr.y + .08, tr.z);
		vis.group.rotation.order = "YXZ";
		vis.group.rotation.y = tr.yaw + Math.PI;
		vis.group.rotation.z = tr.steerVis * .12;
		vis.group.rotation.x = 0;
		const spin = tr.speed / .52 * dt;
		for (const w of vis.wheels) w.rotation.x += spin;
		for (const w of vis.frontWheels) w.rotation.y = tr.steerVis * .4;
	}
	function placeCamera(tr, dt, cinematic) {
		const fx = -Math.sin(tr.yaw);
		const fz = -Math.cos(tr.yaw);
		const speedK = Math.abs(tr.speed);
		camera.fov += (62 + Math.min(14, speedK * .22) - camera.fov) * (1 - Math.exp(-4 * dt));
		camera.updateProjectionMatrix();
		if (cinematic) {
			const t = performance.now() * 18e-5;
			desired.set(tr.x + Math.cos(t) * 18, tr.y + 7.5, tr.z + Math.sin(t) * 18);
			lookAt.set(tr.x, tr.y + 1.4, tr.z);
		} else {
			const dist = 11.5 + speedK * .04;
			desired.set(tr.x + fx * -dist, tr.y + 4.4, tr.z + fz * -dist);
			lookAt.set(tr.x + fx * 6, tr.y + 1.6, tr.z + fz * 6);
		}
		const k = cinematic ? 2.2 : 6.5;
		camPos.lerp(desired, 1 - Math.exp(-k * dt));
		camLook.lerp(lookAt, 1 - Math.exp(-8 * dt));
		const shake = trauma * trauma;
		if (shake > .001) {
			camPos.x += (Math.random() - .5) * shake * .45;
			camPos.y += (Math.random() - .5) * shake * .25;
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
	function publishHud(extra = {}) {
		const p = field[0];
		const pos = [...field].sort((a, b) => raceDistance(b) - raceDistance(a)).findIndex((t) => t.isPlayer) + 1;
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
			x: p.x,
			z: p.z,
			yaw: p.yaw,
			corner: extra.corner ?? cornerAt(p.t)
		});
	}
	function startRace() {
		unlockAudio();
		field = createField();
		field[0].bestLap = loadBest();
		for (let i = 0; i < field.length; i++) syncVisual(field[i], visuals[i], 0);
		phase = "countdown";
		countdown = 3;
		beep(440, .12, .16);
		publishHud({
			phase,
			countdown: 3,
			corner: "Reta Principal",
			wrongWay: false,
			results: []
		});
	}
	function finishRace() {
		phase = "finish";
		const results = [...field].sort((a, b) => raceDistance(b) - raceDistance(a)).map((t) => ({
			name: t.name,
			time: t.finished ? t.raceTime : 0,
			isPlayer: t.isPlayer
		}));
		const p = field[0];
		const stored = loadBest();
		if (p.bestLap > 0 && (stored === 0 || p.bestLap < stored)) saveBest(p.bestLap);
		beep(523, .2, .2);
		beep(784, .35, .16);
		publishHud({
			phase,
			results
		});
	}
	const onVis = () => resumeAudio();
	document.addEventListener("visibilitychange", onVis);
	let last = performance.now();
	let cdBeep = 3;
	function tick() {
		if (!running) return;
		requestAnimationFrame(tick);
		const now = performance.now();
		let dt = (now - last) / 1e3;
		last = now;
		dt = Math.min(dt, .1);
		acc += dt;
		trauma = Math.max(0, trauma - dt * 1.8);
		const actions = readActions();
		if (edges.pause && (phase === "racing" || phase === "paused")) {
			phase = phase === "paused" ? "racing" : "paused";
			publishHud({ phase });
		}
		if (edges.reset && phase === "racing") {
			respawn(field[0]);
			trauma = .4;
		}
		while (acc >= FIXED) {
			if (phase === "countdown") {
				countdown -= FIXED;
				const n = Math.ceil(countdown);
				if (n !== cdBeep && n >= 1 && n <= 3) {
					cdBeep = n;
					beep(n === 1 ? 660 : 440, .1, .16);
				}
				if (countdown <= 0) {
					phase = "racing";
					beep(880, .22, .22);
					publishHud({
						phase,
						countdown: 0
					});
				} else useGameStore.getState().patch({
					countdown,
					phase
				});
				stepField(field, actions, FIXED, hasInjectedKeys());
			} else if (phase === "racing") {
				const info = stepField(field, actions, FIXED, true);
				if (Math.abs(info.player.slide) > 4) trauma = Math.min(1, trauma + .02);
				if (info.player.finished) finishRace();
			} else if (phase === "menu") stepField(field, actions, FIXED, false);
			acc -= FIXED;
		}
		const renderDt = dt;
		for (let i = 0; i < field.length; i++) syncVisual(field[i], visuals[i], renderDt);
		const player = field[0];
		placeCamera(player, renderDt, phase === "menu" || phase === "finish");
		const near = nearestOnTrack(player.x, player.z, player.t);
		setEngine(player.speed, actions.throttle, !near.onTrack, Math.abs(player.slide) / 8);
		hudAcc += dt;
		if (hudAcc > .1) {
			hudAcc = 0;
			const ranked = [...field].sort((a, b) => raceDistance(b) - raceDistance(a));
			publishHud({
				wrongWay: phase === "racing" && player.speed > 5 && progressWrong(player),
				position: ranked.findIndex((t) => t.isPlayer) + 1
			});
		}
		renderer.render(scene, camera);
	}
	function progressWrong(tr) {
		const n = nearestOnTrack(tr.x, tr.z, tr.t);
		const fx = -Math.sin(tr.yaw);
		const fz = -Math.cos(tr.yaw);
		return fx * n.sample.tx + fz * n.sample.tz < -.25;
	}
	function installProbe() {
		window.__controlsTest = {
			getYaw: () => field[0].yaw,
			getSpeed: () => field[0].speed,
			setKeys: (codes) => {
				setInjectedKeys(codes);
				if (codes.length && phase !== "racing") {
					phase = "racing";
					publishHud({ phase });
				}
			},
			setSteer: (v) => setInjectedSteer(v)
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
			publishHud({
				phase,
				results: []
			});
		}
	};
}
//#endregion
export { createGame };
