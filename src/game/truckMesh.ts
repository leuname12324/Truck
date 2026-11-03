import * as THREE from "three";
import type { Livery } from "./liveries";

function mat(color: string, extras: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.18, ...extras });
}

function liveryTexture(livery: Livery): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = livery.body;
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1400; i++) {
    const a = 0.03 + Math.random() * 0.05;
    g.fillStyle = Math.random() > 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a * 0.6})`;
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
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function grillTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 64;
  const g = c.getContext("2d")!;
  g.fillStyle = "#141414";
  g.fillRect(0, 0, 128, 64);
  g.fillStyle = "#3c3c3c";
  for (let y = 6; y < 64; y += 10) g.fillRect(4, y, 120, 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function numberTexture(num: string, livery: Livery): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = livery.accent;
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = livery.stripe;
  g.fillRect(12, 12, 232, 232);
  g.fillStyle = livery.body;
  g.font = "bold 140px Teko, Arial Black, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(num, 128, 142);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export type TruckVisual = {
  group: THREE.Group;
  wheels: THREE.Object3D[];
  frontWheels: THREE.Object3D[];
  body: THREE.Group;
  wing: THREE.Object3D;
};

export function createTruck(livery: Livery): TruckVisual {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);

  const paint = liveryTexture(livery);
  const bodyM = mat("#ffffff", { map: paint, roughness: 0.46, metalness: 0.22 });
  const cabM = bodyM;
  const stripeM = mat(livery.stripe);
  const accentM = mat(livery.accent);
  const wingM = mat(livery.wing, { metalness: 0.4, roughness: 0.3 });
  const darkM = mat("#121212", { roughness: 0.6 });
  const glassM = mat("#0b1520", { roughness: 0.08, metalness: 0.7, transparent: true, opacity: 0.72 });
  const rubberM = mat("#1a1a1a", { roughness: 0.92, metalness: 0.05 });
  const rimM = mat(livery.rim, { metalness: 0.65, roughness: 0.28 });
  const lightM = mat("#f2f0d8", { emissive: "#f2e8b0", emissiveIntensity: 0.55, roughness: 0.3 });
  const brakeM = mat("#5a0c0c", { emissive: "#c23b2e", emissiveIntensity: 0.35 });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.38, 5.3), darkM);
  chassis.position.y = 0.62;
  chassis.castShadow = true;
  body.add(chassis);

  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.42, 1.55, 2.15), cabM);
  cab.position.set(0, 1.48, 1.42);
  cab.castShadow = true;
  body.add(cab);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.46, 0.12, 2.2), stripeM);
  roof.position.set(0, 2.28, 1.42);
  body.add(roof);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.95, 0.08), glassM);
  windshield.position.set(0, 1.62, 2.48);
  windshield.rotation.x = -0.18;
  body.add(windshield);

  const sideGlassL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 1.4), glassM);
  sideGlassL.position.set(1.22, 1.7, 1.4);
  const sideGlassR = sideGlassL.clone();
  sideGlassR.position.x = -1.22;
  body.add(sideGlassL, sideGlassR);

  const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.28, 0.55), accentM);
  bumper.position.set(0, 0.55, 2.72);
  bumper.castShadow = true;
  body.add(bumper);

  const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.08, 0.7), wingM);
  splitter.position.set(0, 0.38, 2.85);
  body.add(splitter);

  const grill = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.7, 0.12),
    new THREE.MeshStandardMaterial({ map: grillTexture(), roughness: 0.55, metalness: 0.4 }),
  );
  grill.position.set(0, 1.05, 2.52);
  body.add(grill);

  const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.1), lightM);
  hl1.position.set(0.78, 0.92, 2.56);
  const hl2 = hl1.clone();
  hl2.position.x = -0.78;
  body.add(hl1, hl2);

  const skirtL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.35, 4.4), stripeM);
  skirtL.position.set(1.22, 0.62, 0.1);
  const skirtR = skirtL.clone();
  skirtR.position.x = -1.22;
  body.add(skirtL, skirtR);

  const fenderFL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 1.15), bodyM);
  fenderFL.position.set(1.28, 0.78, 1.55);
  const fenderFR = fenderFL.clone();
  fenderFR.position.x = -1.28;
  const fenderRL = fenderFL.clone();
  fenderRL.position.set(1.28, 0.78, -1.55);
  const fenderRR = fenderFL.clone();
  fenderRR.position.set(-1.28, 0.78, -1.55);
  body.add(fenderFL, fenderFR, fenderRL, fenderRR);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 2.6), darkM);
  deck.position.set(0, 0.95, -1.2);
  body.add(deck);

  const stallL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.35, 0.12), wingM);
  stallL.position.set(1.05, 1.55, -2.35);
  const stallR = stallL.clone();
  stallR.position.x = -1.05;
  body.add(stallL, stallR);

  const wing = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.1, 0.55), wingM);
  wing.position.set(0, 2.28, -2.38);
  wing.rotation.x = 0.12;
  wing.castShadow = true;
  body.add(wing);

  const endL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.62), stripeM);
  endL.position.set(1.42, 2.28, -2.38);
  endL.name = "wingEnd";
  const endR = endL.clone();
  endR.position.x = -1.42;
  endR.name = "wingEnd";
  body.add(endL, endR);

  const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.08), brakeM);
  tailL.position.set(0.85, 0.92, -2.66);
  const tailR = tailL.clone();
  tailR.position.x = -0.85;
  body.add(tailL, tailR);

  const numTex = numberTexture(livery.number, livery);
  const numM = new THREE.MeshStandardMaterial({ map: numTex, roughness: 0.45 });
  const numL = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), numM);
  numL.position.set(1.24, 1.35, 0.15);
  numL.rotation.y = Math.PI / 2;
  const numR = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), numM);
  numR.position.set(-1.24, 1.35, 0.15);
  numR.rotation.y = -Math.PI / 2;
  body.add(numL, numR);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.14, 4.8), stripeM);
  stripe.position.set(0, 0.92, 0.05);
  body.add(stripe);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.1, 0.38), darkM);
  visor.position.set(0, 2.22, 2.22);
  body.add(visor);

  function mirror(x: number) {
    const m = new THREE.Group();
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.06), darkM);
    arm.position.x = x > 0 ? 0.14 : -0.14;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.08), darkM);
    head.position.x = x > 0 ? 0.32 : -0.32;
    m.add(arm, head);
    m.position.set(x, 1.85, 2.05);
    return m;
  }
  body.add(mirror(1.2), mirror(-1.2));

  const stackL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.15, 8), darkM);
  stackL.position.set(0.7, 1.7, 0.15);
  const stackR = stackL.clone();
  stackR.position.x = -0.7;
  body.add(stackL, stackR);

  const bannerC = document.createElement("canvas");
  bannerC.width = 512;
  bannerC.height = 96;
  const bg = bannerC.getContext("2d")!;
  bg.fillStyle = livery.stripe;
  bg.fillRect(0, 0, 512, 96);
  bg.fillStyle = livery.cab;
  bg.font = "700 58px Teko, sans-serif";
  bg.textAlign = "center";
  bg.textBaseline = "middle";
  bg.fillText("COPA TRUCK", 256, 54);
  const bannerTex = new THREE.CanvasTexture(bannerC);
  bannerTex.colorSpace = THREE.SRGBColorSpace;
  const bannerM = new THREE.MeshStandardMaterial({ map: bannerTex, roughness: 0.5 });
  const bannerL = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.42), bannerM);
  bannerL.position.set(1.23, 1.05, -0.35);
  bannerL.rotation.y = Math.PI / 2;
  const bannerR = bannerL.clone();
  bannerR.position.x = -1.23;
  bannerR.rotation.y = -Math.PI / 2;
  body.add(bannerL, bannerR);

  const wheels: THREE.Object3D[] = [];
  const frontWheels: THREE.Object3D[] = [];

  function makeWheel(): THREE.Group {
    const w = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.38, 18), rubberM);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.4, 16), rimM);
    rim.rotation.z = Math.PI / 2;
    w.add(tire, rim);
    return w;
  }

  const fl = makeWheel();
  fl.position.set(1.05, 0.52, 1.55);
  const fr = makeWheel();
  fr.position.set(-1.05, 0.52, 1.55);
  body.add(fl, fr);
  wheels.push(fl, fr);
  frontWheels.push(fl, fr);

  const rl1 = makeWheel();
  rl1.position.set(1.05, 0.52, -1.35);
  const rl2 = makeWheel();
  rl2.position.set(1.05, 0.52, -1.85);
  const rr1 = makeWheel();
  rr1.position.set(-1.05, 0.52, -1.35);
  const rr2 = makeWheel();
  rr2.position.set(-1.05, 0.52, -1.85);
  body.add(rl1, rl2, rr1, rr2);
  wheels.push(rl1, rl2, rr1, rr2);

  group.userData.livery = livery.id;
  return { group, wheels, frontWheels, body, wing };
}
