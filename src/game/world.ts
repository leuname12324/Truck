import * as THREE from "three";
import { SAMPLES, TRACK_HALF_WIDTH, TRACK_LENGTH, lateralRoom } from "./track";

function canvasTex(draw: (ctx: CanvasRenderingContext2D, size: number) => void, size = 256): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  draw(c.getContext("2d")!, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

function asphaltTex() {
  return canvasTex((g, s) => {
    g.fillStyle = "#2b2c2e";
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 1800; i++) {
      g.fillStyle = `rgba(0,0,0,${0.08 + Math.random() * 0.12})`;
      g.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1);
    }
    g.fillStyle = "rgba(255,255,255,0.14)";
    g.fillRect(s * 0.48, 0, 3, s);
  }, 256);
}

function grassTex() {
  return canvasTex((g, s) => {
    g.fillStyle = "#2f5a32";
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 1200; i++) {
      g.fillStyle = Math.random() > 0.5 ? "#3a6b38" : "#264a2c";
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

function clampOffset(i: number, signed: number) {
  const room = lateralRoom(i, Math.sign(signed) || 1);
  if (signed >= 0) return Math.min(signed, room);
  return -Math.min(-signed, room);
}

function roadGeometry(): THREE.BufferGeometry {
  const segs = SAMPLES.length;
  // The racing surface is always full width, exactly like the physics model.
  const hw = TRACK_HALF_WIDTH;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < segs; i++) {
    const s = SAMPLES[i];
    const along = s.s / 4;
    positions.push(s.x + s.nx * hw, s.y + 0.06, s.z + s.nz * hw);
    positions.push(s.x - s.nx * hw, s.y + 0.06, s.z - s.nz * hw);
    uvs.push(0, along, 1, along);
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = ((i + 1) % segs) * 2;
    const d = c + 1;
    indices.push(a, c, b, b, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function stripGeometry(offset: number, width: number, yOff = 0.05): THREE.BufferGeometry {
  const segs = SAMPLES.length;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < segs; i++) {
    const s = SAMPLES[i];
    const a = clampOffset(i, offset);
    const b = clampOffset(i, offset + width);
    positions.push(s.x + s.nx * a, s.y + yOff, s.z + s.nz * a);
    positions.push(s.x + s.nx * b, s.y + yOff, s.z + s.nz * b);
    uvs.push(0, s.s / 2.2, 1, s.s / 2.2);
  }
  for (let i = 0; i < segs; i++) {
    const p = i * 2;
    const q = ((i + 1) % segs) * 2;
    indices.push(p, q, p + 1, p + 1, q, q + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function embankmentGeometry(side: number): THREE.BufferGeometry {
  const segs = SAMPLES.length;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < segs; i++) {
    const s = SAMPLES[i];
    const room = lateralRoom(i, side);
    const inner = (TRACK_HALF_WIDTH + 2.2) * side;
    const outer = side * Math.max(TRACK_HALF_WIDTH + 1.5, Math.min(TRACK_HALF_WIDTH + 16, room));
    const span = Math.abs(outer - inner);
    const outerY = span < 1.2 ? s.y + 0.02 : 0.02;
    positions.push(s.x + s.nx * inner, s.y + 0.02, s.z + s.nz * inner);
    positions.push(s.x + s.nx * outer, outerY, s.z + s.nz * outer);
    uvs.push(0, s.s / 8, 1, s.s / 8);
  }
  for (let i = 0; i < segs; i++) {
    const p = i * 2;
    const q = ((i + 1) % segs) * 2;
    if (side > 0) indices.push(p, q, p + 1, p + 1, q, q + 1);
    else indices.push(p, p + 1, q, p + 1, q + 1, q);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function wallGeometry(side: number): THREE.BufferGeometry {
  const segs = SAMPLES.length;
  const h = 1.15;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < segs; i++) {
    const s = SAMPLES[i];
    const room = lateralRoom(i, side);
    // Never let the barrier collapse onto the racing line; where another part
    // of the circuit is close, park it halfway between the two centrelines.
    const d = side * Math.min(TRACK_HALF_WIDTH + 8.4, Math.max(TRACK_HALF_WIDTH + 1.3, room - 0.45));
    const x = s.x + s.nx * d;
    const z = s.z + s.nz * d;
    positions.push(x, s.y, z, x, s.y + h, z);
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 2;
    const b = ((i + 1) % segs) * 2;
    if (side > 0) indices.push(a, b, a + 1, a + 1, b, b + 1);
    else indices.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function buildWorld(scene: THREE.Scene): () => void {
  const asphalt = asphaltTex();
  asphalt.repeat.set(1, TRACK_LENGTH / 18);
  const grass = grassTex();
  grass.repeat.set(90, 90);
  const kerb = kerbTex();

  const roadM = new THREE.MeshStandardMaterial({ map: asphalt, roughness: 0.82, metalness: 0.05 });
  const grassM = new THREE.MeshStandardMaterial({ map: grass, roughness: 0.95 });
  const kerbM = new THREE.MeshStandardMaterial({ map: kerb, roughness: 0.55 });
  const wallM = new THREE.MeshStandardMaterial({ color: "#cfc8bb", roughness: 0.5, metalness: 0.15 });
  const runoffM = new THREE.MeshStandardMaterial({ color: "#3f6a3c", roughness: 0.95 });

  const road = new THREE.Mesh(roadGeometry(), roadM);
  road.receiveShadow = true;
  scene.add(road);

  const kerbL = new THREE.Mesh(stripGeometry(TRACK_HALF_WIDTH - 1.35, 2.35), kerbM);
  const kerbR = new THREE.Mesh(stripGeometry(-(TRACK_HALF_WIDTH - 1.35), -2.35), kerbM);
  scene.add(kerbL, kerbR);

  const runL = new THREE.Mesh(stripGeometry(TRACK_HALF_WIDTH + 1.1, 8.6, 0.0), runoffM);
  const runR = new THREE.Mesh(stripGeometry(-(TRACK_HALF_WIDTH + 1.1), -8.6, 0.0), runoffM);
  runL.receiveShadow = true;
  runR.receiveShadow = true;
  scene.add(runL, runR);

  const wallL = new THREE.Mesh(wallGeometry(1), wallM);
  const wallR = new THREE.Mesh(wallGeometry(-1), wallM);
  scene.add(wallL, wallR);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1800), grassM);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  const bankL = new THREE.Mesh(embankmentGeometry(1), grassM);
  const bankR = new THREE.Mesh(embankmentGeometry(-1), grassM);
  bankL.receiveShadow = true;
  bankR.receiveShadow = true;
  scene.add(bankL, bankR);

  // Lago no miolo, ao lado da Descida do Lago
  const lakeIdx = Math.floor(0.38 * SAMPLES.length);
  const lakeS = SAMPLES[lakeIdx];
  const lakeSide = lateralRoom(lakeIdx, -1) > lateralRoom(lakeIdx, 1) ? -1 : 1;
  const lakeRoom = lateralRoom(lakeIdx, lakeSide);
  if (lakeRoom > TRACK_HALF_WIDTH + 44) {
    const lakeDist = Math.min(56, lakeRoom - 4);
    const lakeM = new THREE.MeshStandardMaterial({
      color: "#1a4a5c",
      roughness: 0.18,
      metalness: 0.35,
    });
    const lake = new THREE.Mesh(new THREE.CircleGeometry(36, 28), lakeM);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(lakeS.x + lakeS.nx * lakeSide * lakeDist, 0.2, lakeS.z + lakeS.nz * lakeSide * lakeDist);
    scene.add(lake);
    const lakeEdge = new THREE.Mesh(
      new THREE.RingGeometry(36, 44, 28),
      new THREE.MeshStandardMaterial({ color: "#6b5a3e", roughness: 1 }),
    );
    lakeEdge.rotation.x = -Math.PI / 2;
    lakeEdge.position.set(lake.position.x, 0.18, lake.position.z);
    scene.add(lakeEdge);
  }

  // Start/finish markings
  const sf = SAMPLES[0];
  const lineM = new THREE.MeshStandardMaterial({ color: "#f4f6f1" });
  const sfLine = new THREE.Mesh(new THREE.BoxGeometry(TRACK_HALF_WIDTH * 2, 0.06, 0.9), lineM);
  sfLine.position.set(sf.x, sf.y + 0.08, sf.z);
  sfLine.rotation.y = Math.atan2(sf.tx, sf.tz);
  scene.add(sfLine);

  const gantry = new THREE.Group();
  const postM = new THREE.MeshStandardMaterial({ color: "#d9d4c8", roughness: 0.45 });
  const spanM = new THREE.MeshStandardMaterial({ color: "#1c3d8a", roughness: 0.4 });
  const postGeo = new THREE.BoxGeometry(0.55, 9, 0.55);
  const postL = new THREE.Mesh(postGeo, postM);
  postL.position.set(TRACK_HALF_WIDTH + 2.4, 4.5, 6);
  const postR = postL.clone();
  postR.position.x = -(TRACK_HALF_WIDTH + 2.4);
  const span = new THREE.Mesh(new THREE.BoxGeometry(TRACK_HALF_WIDTH * 2 + 6, 0.85, 1.1), spanM);
  span.position.set(0, 9.1, 6);
  const signC = document.createElement("canvas");
  signC.width = 512;
  signC.height = 96;
  const sg = signC.getContext("2d")!;
  sg.fillStyle = "#1c3d8a";
  sg.fillRect(0, 0, 512, 96);
  sg.fillStyle = "#f4f6f1";
  sg.font = "700 54px Teko, sans-serif";
  sg.textAlign = "center";
  sg.textBaseline = "middle";
  sg.fillText("INTERLAGOS", 256, 52);
  const signTex = new THREE.CanvasTexture(signC);
  signTex.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 1.6),
    new THREE.MeshStandardMaterial({ map: signTex, side: THREE.DoubleSide }),
  );
  sign.position.set(0, 9.1, 5.45);
  sign.rotation.y = Math.PI;
  gantry.add(postL, postR, span, sign);
  gantry.position.set(sf.x, sf.y, sf.z);
  gantry.rotation.y = Math.atan2(sf.tx, sf.tz);
  scene.add(gantry);

  // Grandstands wherever there is clear space off the circuit, upright.
  const standM = new THREE.MeshStandardMaterial({ color: "#8a9094", roughness: 0.7 });
  const seatM = new THREE.MeshStandardMaterial({ color: "#c23b2e", roughness: 0.6 });
  let stands = 0;
  for (let k = 0; k < SAMPLES.length && stands < 14; k += 10) {
    const sm = SAMPLES[k];
    const side = lateralRoom(k, 1) > lateralRoom(k, -1) ? 1 : -1;
    const room = lateralRoom(k, side);
    if (room < TRACK_HALF_WIDTH + 14) continue;
    const stand = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(16, 6.5, 6), standM);
    base.position.y = 3.25;
    base.castShadow = true;
    const seats = new THREE.Mesh(new THREE.BoxGeometry(15.2, 4.2, 0.35), seatM);
    seats.position.set(0, 3.4, 2.7);
    stand.add(base, seats);
    const dist = TRACK_HALF_WIDTH + 11;
    stand.position.set(sm.x + sm.nx * side * dist, sm.y, sm.z + sm.nz * side * dist);
    const faceX = -sm.nx * side;
    const faceZ = -sm.nz * side;
    stand.rotation.y = Math.atan2(faceX, faceZ);
    scene.add(stand);
    stands++;
  }

  // Pit building, only if the inside of the straight is clear
  const pitRoom = lateralRoom(8, -1);
  if (pitRoom > TRACK_HALF_WIDTH + 16) {
    const pit = new THREE.Group();
    const pitM = new THREE.MeshStandardMaterial({ color: "#d9d4c8", roughness: 0.55 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(28, 5.5, 8), pitM);
    box.position.y = 2.75;
    box.castShadow = true;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(30, 0.35, 10), new THREE.MeshStandardMaterial({ color: "#2f9e4a" }));
    roof.position.y = 5.6;
    pit.add(box, roof);
    const pitS = SAMPLES[8];
    const dist = TRACK_HALF_WIDTH + 12;
    pit.position.set(pitS.x - pitS.nx * dist, pitS.y, pitS.z - pitS.nz * dist);
    pit.rotation.y = Math.atan2(pitS.nx, pitS.nz);
    scene.add(pit);
  }

  // Trees instanced
  const trunkG = new THREE.CylinderGeometry(0.28, 0.4, 3.2, 5);
  const crownG = new THREE.ConeGeometry(2.1, 4.4, 6);
  const trunkM = new THREE.MeshStandardMaterial({ color: "#4a3424" });
  const crownM = new THREE.MeshStandardMaterial({ color: "#1f4d28" });
  const trunks = new THREE.InstancedMesh(trunkG, trunkM, 70);
  const crowns = new THREE.InstancedMesh(crownG, crownM, 70);
  const dummy = new THREE.Object3D();
  let placed = 0;
  const rng = (n: number) => {
    const x = Math.sin(n * 127.1) * 43758.5453;
    return x - Math.floor(x);
  };
  const clearOfTrack = (x: number, z: number) => {
    let best = Infinity;
    for (let k = 0; k < SAMPLES.length; k += 2) {
      const s = SAMPLES[k];
      const d = (s.x - x) * (s.x - x) + (s.z - z) * (s.z - z);
      if (d < best) best = d;
    }
    return Math.sqrt(best) > TRACK_HALF_WIDTH + 14;
  };
  for (let i = 0; i < 240 && placed < 48; i++) {
    const sm = SAMPLES[Math.floor(rng(i + 3) * SAMPLES.length)];
    const side = rng(i + 9) > 0.5 ? 1 : -1;
    const dist = TRACK_HALF_WIDTH + 18 + rng(i + 17) * 42;
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

  // Distant São Paulo blocks
  const bM = new THREE.MeshStandardMaterial({ color: "#6d7380", roughness: 0.85 });
  for (let i = 0; i < 18; i++) {
    const h = 18 + rng(i + 40) * 55;
    const b = new THREE.Mesh(new THREE.BoxGeometry(10 + rng(i) * 16, h, 10 + rng(i + 2) * 12), bM);
    const ang = -0.2 + i * 0.16;
    const rad = 520 + rng(i + 7) * 80;
    b.position.set(Math.sin(ang) * rad, h / 2 - 2, -Math.cos(ang) * rad - 80);
    scene.add(b);
  }

  // Brazilian flags at SF
  const poleM = new THREE.MeshStandardMaterial({ color: "#c9c4b8" });
  function flag(x: number, y: number, z: number) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 9, 6), poleM);
    pole.position.set(x, y + 4.5, z);
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 84;
    const g = canvas.getContext("2d")!;
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
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const fl = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 2.1),
      new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide }),
    );
    fl.position.set(x + 1.6, y + 8.2, z);
    scene.add(pole, fl);
  }
  flag(sf.x + sf.nx * (TRACK_HALF_WIDTH + 8), sf.y, sf.z + sf.nz * (TRACK_HALF_WIDTH + 8));
  flag(sf.x - sf.nx * (TRACK_HALF_WIDTH + 8), sf.y, sf.z - sf.nz * (TRACK_HALF_WIDTH + 8));

  // Billboard
  const boardC = document.createElement("canvas");
  boardC.width = 512;
  boardC.height = 128;
  const bg = boardC.getContext("2d")!;
  bg.fillStyle = "#1f8a3c";
  bg.fillRect(0, 0, 512, 128);
  bg.fillStyle = "#e8c547";
  bg.fillRect(0, 96, 512, 32);
  bg.fillStyle = "#071109";
  bg.font = "700 64px Teko, sans-serif";
  bg.textAlign = "center";
  bg.textBaseline = "middle";
  bg.fillText("COPA TRUCK", 256, 58);
  const boardTex = new THREE.CanvasTexture(boardC);
  boardTex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(16, 3.4, 0.35),
    new THREE.MeshStandardMaterial({ map: boardTex, color: "#ffffff" }),
  );
  const bs = SAMPLES[20];
  const boardSide = lateralRoom(20, 1) >= lateralRoom(20, -1) ? 1 : -1;
  const boardDist = Math.min(TRACK_HALF_WIDTH + 14, lateralRoom(20, boardSide) - 2);
  board.position.set(bs.x + bs.nx * boardSide * boardDist, bs.y + 6, bs.z + bs.nz * boardSide * boardDist);
  board.rotation.y = Math.atan2(-bs.nx * boardSide, -bs.nz * boardSide);
  scene.add(board);

  scene.background = new THREE.Color("#7ea3b8");
  scene.fog = new THREE.Fog("#8eacb8", 180, 780);

  const hemi = new THREE.HemisphereLight("#d7e6ef", "#3d5c32", 0.7);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#fff3d6", 1.55);
  sun.position.set(-120, 90, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 420;
  sun.shadow.camera.left = -80;
  sun.shadow.camera.right = 80;
  sun.shadow.camera.top = 80;
  sun.shadow.camera.bottom = -80;
  sun.shadow.bias = -0.0002;
  scene.add(sun);
  const fill = new THREE.DirectionalLight("#9bb8c9", 0.25);
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
