import {
  BoxGeometry, CylinderGeometry, DoubleSide, ExtrudeGeometry, Group, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, Path,
  PlaneGeometry, Shape, Vector3, type Texture,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { box, lathe, rng, sagCurve, spaced, type FlowerBatch, type GlowPoints, type Materials } from './builders';
import { chhatri } from './mandap';
import { jaali } from './textures';

type Ctx = {
  mats: Materials; flowers: FlowerBatch; flames: GlowPoints; halos: GlowPoints; fairy: GlowPoints;
  marble: Texture; carpet: Texture; quality: 'high' | 'low';
};

type Row = { count: number; w: number; h: number; bottom: number };

const PALACE_Z = -24;
const GATE_Z = 36;
const SIDE_X = 17;

// Pointed (Mughal) arch outline.
function archPath(cx: number, y0: number, w: number, h: number) {
  const p = new Path();
  const hw = w / 2;
  const spring = y0 + h - hw * 1.15;
  p.moveTo(cx - hw, y0);
  p.lineTo(cx + hw, y0);
  p.lineTo(cx + hw, spring);
  p.quadraticCurveTo(cx + hw, spring + hw * 0.95, cx, y0 + h);
  p.quadraticCurveTo(cx - hw, spring + hw * 0.95, cx - hw, spring);
  p.lineTo(cx - hw, y0);
  return p;
}

// A wall with rows of arched openings; each opening has a glowing interior behind it.
function arcade(width: number, height: number, depth: number, rows: Row[], wall: MeshStandardMaterial, glow: MeshStandardMaterial) {
  const g = new Group();
  const shape = new Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(width / 2, height);
  shape.lineTo(-width / 2, height);
  shape.lineTo(-width / 2, 0);
  const backs = [];
  for (const r of rows) {
    const step = width / r.count;
    for (let i = 0; i < r.count; i++) {
      const cx = -width / 2 + step * (i + 0.5);
      shape.holes.push(archPath(cx, r.bottom, r.w, r.h));
      const back = new PlaneGeometry(r.w + 0.2, r.h + 0.2);
      back.translate(cx, r.bottom + r.h / 2, depth * 0.25);
      backs.push(back);
    }
  }
  const wallMesh = new Mesh(new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 6 }), wall);
  wallMesh.castShadow = true;
  wallMesh.receiveShadow = true;
  g.add(wallMesh);
  if (backs.length) g.add(new Mesh(mergeGeometries(backs), glow));
  // Gold-ish string course along the top and a shadow line at the base
  g.add(box(width + 0.3, 0.25, depth + 0.3, wall, 0, height + 0.125, depth / 2));
  return g;
}

function parapet(width: number, y: number, z: number, mat: MeshStandardMaterial, every = 0.9) {
  const n = Math.floor(width / every);
  const merlons = new InstancedMesh(new BoxGeometry(0.42, 0.62, 0.36), mat, n);
  const m = new Matrix4();
  for (let i = 0; i < n; i++) merlons.setMatrixAt(i, m.makeTranslation(-width / 2 + every * (i + 0.5), y + 0.31, z));
  merlons.castShadow = true;
  return merlons;
}

export function buildVenue(ctx: Ctx) {
  const { mats, flowers, flames, halos, fairy } = ctx;
  const g = new Group();

  const windowMat = new MeshStandardMaterial({ map: jaali(false), emissiveMap: jaali(true), emissive: '#ffb257', emissiveIntensity: 0, roughness: 0.85 });
  const lanternMat = new MeshStandardMaterial({ color: '#f7e4bc', emissive: '#ffbf5e', emissiveIntensity: 0.1, roughness: 0.3, transparent: true, opacity: 0.92 });
  const waterMat = new MeshStandardMaterial({ color: '#1d5c68', metalness: 0.35, roughness: 0.06, transparent: true, opacity: 0.94 });

  // Courtyard floor and aisle runner
  const ground = new Mesh(new PlaneGeometry(320, 320), new MeshStandardMaterial({ map: ctx.marble, roughness: 0.42 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  g.add(ground);
  const aisleLen = GATE_Z - 5.6;
  const aisle = new Mesh(new PlaneGeometry(2.4, aisleLen), new MeshStandardMaterial({ map: ctx.carpet, roughness: 0.9 }));
  aisle.rotation.x = -Math.PI / 2;
  aisle.position.set(0, 0.012, 5.6 + aisleLen / 2);
  aisle.receiveShadow = true;
  g.add(aisle);

  // Mughal water channels either side of the aisle, with floating blooms and diyas
  const diyaSpots: Vector3[] = [];
  for (const sx of [-1, 1]) {
    const x = sx * 4.6;
    const len = 25;
    const cz = 8 + len / 2;
    const edge = mats.marble;
    g.add(box(1.9, 0.28, 0.2, edge, x, 0.14, cz - len / 2), box(1.9, 0.28, 0.2, edge, x, 0.14, cz + len / 2));
    g.add(box(0.2, 0.28, len, edge, x - 0.85, 0.14, cz), box(0.2, 0.28, len, edge, x + 0.85, 0.14, cz));
    const water = new Mesh(new PlaneGeometry(1.5, len - 0.2), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(x, 0.2, cz);
    g.add(water);
    for (let i = 0; i < 26; i++) flowers.add(new Vector3(x + (rng() - 0.5) * 1.2, 0.22, cz + (rng() - 0.5) * (len - 1)), 0.06, rng() > 0.5 ? 0 : 1);
    for (let z = 9.5; z < cz + len / 2 - 1; z += 2.4) diyaSpots.push(new Vector3(x + (rng() - 0.5) * 0.6, 0.21, z + (rng() - 0.5) * 0.8));
  }
  const diyaGeo = lathe([[0, 0], [0.06, 0], [0.08, 0.03], [0.075, 0.045], [0, 0.035]], mats.clay, 10).geometry;
  const floating = new InstancedMesh(diyaGeo, mats.clay, diyaSpots.length);
  const m4 = new Matrix4();
  diyaSpots.forEach((p, i) => {
    floating.setMatrixAt(i, m4.makeTranslation(p.x, p.y, p.z));
    flames.add(p.clone().setY(0.33), 0.13);
  });
  g.add(floating);

  // Lanterns and flower urns lining the aisle
  const lanternSpots: Vector3[] = [];
  for (const sx of [-1, 1]) for (let z = 9; z <= 33; z += 4) lanternSpots.push(new Vector3(sx * 6.3, 0, z));
  const post = new InstancedMesh(lathe([[0, 0], [0.18, 0], [0.16, 0.08], [0.05, 0.16], [0.04, 1.55], [0.09, 1.6], [0, 1.6]], mats.bronze, 12).geometry, mats.bronze, lanternSpots.length);
  const glass = new InstancedMesh(lathe([[0, 0], [0.12, 0.02], [0.16, 0.16], [0.15, 0.3], [0.1, 0.38], [0, 0.4]], lanternMat, 8).geometry, lanternMat, lanternSpots.length);
  const cap = new InstancedMesh(lathe([[0, 0], [0.18, 0], [0.12, 0.08], [0.03, 0.2], [0.02, 0.3], [0, 0.3]], mats.gold, 8).geometry, mats.gold, lanternSpots.length);
  lanternSpots.forEach((p, i) => {
    post.setMatrixAt(i, m4.makeTranslation(p.x, 0, p.z));
    glass.setMatrixAt(i, m4.makeTranslation(p.x, 1.6, p.z));
    cap.setMatrixAt(i, m4.makeTranslation(p.x, 1.98, p.z));
    halos.add(new Vector3(p.x, 1.8, p.z), 1.1);
  });
  post.castShadow = true;
  g.add(post, glass, cap);

  const urnSpots: Vector3[] = [];
  for (const sx of [-1, 1]) for (let z = 8; z <= 32; z += 6) urnSpots.push(new Vector3(sx * 2.15, 0, z));
  const urns = new InstancedMesh(lathe([[0, 0], [0.2, 0], [0.12, 0.08], [0.1, 0.25], [0.24, 0.45], [0.28, 0.62], [0.22, 0.72], [0.26, 0.76], [0, 0.76]], mats.marble, 16).geometry, mats.marble, urnSpots.length);
  urnSpots.forEach((p, i) => {
    urns.setMatrixAt(i, m4.makeTranslation(p.x, 0, p.z));
    for (let k = 0; k < 34; k++) {
      const u = rng() * Math.PI * 2;
      const v = Math.acos(rng() * 0.95);
      flowers.add(new Vector3(p.x + Math.sin(v) * Math.cos(u) * 0.3, 0.8 + Math.cos(v) * 0.26, p.z + Math.sin(v) * Math.sin(u) * 0.3), 0.075, k % 4 === 0 ? 2 : k % 2);
    }
  });
  urns.castShadow = true;
  g.add(urns);

  // Palace backdrop
  const wall = mats.sandstone;
  const palace = new Group();
  palace.position.z = PALACE_Z - 1.4;
  const main = arcade(46, 12, 1.4, [{ count: 11, w: 2.4, h: 4.6, bottom: 0.6 }, { count: 15, w: 1.4, h: 2.7, bottom: 6.6 }], wall, windowMat);
  palace.add(main);
  palace.add(parapet(46, 12.25, 0.7, wall));
  const centre = arcade(14, 16, 2.2, [{ count: 1, w: 4.4, h: 8.4, bottom: 0.6 }, { count: 3, w: 1.6, h: 3.0, bottom: 10.6 }], wall, windowMat);
  centre.position.z = 0.8;
  palace.add(centre);
  palace.add(parapet(14, 16.25, 1.9, wall));
  const bigDome = lathe([[0, 0], [3.3, 0], [3.3, 0.6], [3.1, 0.7], ...Array.from({ length: 16 }, (_, i) => {
    const t = (i + 1) / 16;
    return [Math.max(0.25, 3.25 * (1 + 0.12 * Math.sin(Math.PI * Math.min(1, t * 1.4))) * Math.cos((t * Math.PI) / 2) ** 0.85), 0.7 + 4.2 * Math.sin((t * Math.PI) / 2) ** 1.1];
  })], new MeshStandardMaterial({ color: '#f6ead6', roughness: 0.55 }), 40);
  bigDome.position.set(0, 16.25, 1.9);
  bigDome.castShadow = true;
  palace.add(bigDome);
  const spire = lathe([[0, 0], [0.3, 0], [0.42, 0.3], [0.2, 0.7], [0.28, 0.9], [0.06, 1.4], [0, 2.2]], mats.gold, 14);
  spire.position.set(0, 21.1, 1.9);
  palace.add(spire);
  for (const x of [-18, -12.5, 12.5, 18]) {
    const c = chhatri(mats, 2.2);
    c.position.set(x, 12.25, 0.7);
    palace.add(c);
  }
  for (const x of [-6, 6]) {
    const c = chhatri(mats, 1.6);
    c.position.set(x, 16.25, 1.9);
    palace.add(c);
  }
  // Jharokha balconies on the upper floor
  const step = 46 / 15;
  for (let i = 1; i < 15; i += 3) {
    const x = -23 + step * (i + 0.5);
    if (Math.abs(x) < 7.5) continue;
    palace.add(box(2.1, 0.25, 1.0, wall, x, 6.45, 1.9));
    const roof = lathe([[0, 0], [1.05, 0], [0.9, 0.2], [0.45, 0.62], [0.1, 0.8], [0, 0.95]], wall, 16, 0, Math.PI * 2);
    roof.scale.set(1, 1, 0.55);
    roof.position.set(x, 9.55, 1.9);
    palace.add(roof);
  }
  // Corner towers
  for (const sx of [-1, 1]) {
    const tower = new Mesh(new CylinderGeometry(2.1, 2.4, 15, 24), wall);
    tower.position.set(sx * 24.5, 7.5, 0.7);
    tower.castShadow = true;
    palace.add(tower);
    const cap = chhatri(mats, 3.0);
    cap.position.set(sx * 24.5, 15, 0.7);
    palace.add(cap);
  }
  g.add(palace);

  // Side colonnades and the entrance gateway enclose the courtyard
  for (const sx of [-1, 1]) {
    const len = GATE_Z - PALACE_Z + 2;
    const side = new Group();
    side.add(arcade(len, 7, 0.9, [{ count: 18, w: 2.2, h: 4.9, bottom: 0.3 }], wall, windowMat));
    side.add(parapet(len, 7.25, 0.45, wall));
    side.position.set(sx * SIDE_X, 0, PALACE_Z + len / 2 - 1);
    side.rotation.y = sx < 0 ? Math.PI / 2 : -Math.PI / 2;
    side.position.x += sx * 0.45;
    g.add(side);
  }
  const gate = new Group();
  gate.add(arcade(SIDE_X * 2 + 1, 8.4, 1.4, [{ count: 1, w: 5.2, h: 7.3, bottom: 0.08 }], wall, windowMat));
  gate.add(parapet(SIDE_X * 2 + 1, 8.65, 0.7, wall));
  for (const x of [-4.2, 4.2]) {
    const c = chhatri(mats, 1.9);
    c.position.set(x, 8.65, 0.7);
    gate.add(c);
  }
  gate.position.z = GATE_Z + 1.4;
  gate.rotation.y = Math.PI;
  g.add(gate);
  // Floral toran across the gateway arch
  flowers.addAlong(spaced(sagCurve(new Vector3(-2.7, 7.1, GATE_Z - 0.15), new Vector3(2.7, 7.1, GATE_Z - 0.15), 0.9, 40), 0.12), 0.11, '0012');

  // Distant Aravalli ridge: one rolling skyline ring, softened by fog
  const hillMat = new MeshStandardMaterial({ color: '#8a8aa0', roughness: 1, side: DoubleSide });
  const ridge = new CylinderGeometry(175, 175, 1, 320, 1, true);
  const rp = ridge.attributes.position;
  for (let i = 0; i < rp.count; i++) {
    if (rp.getY(i) < 0) { rp.setY(i, -2); continue; }
    const a = Math.atan2(rp.getZ(i), rp.getX(i));
    const h = 14 + 9 * Math.sin(a * 3 + 0.6) + 6 * Math.sin(a * 7 + 1.9) + 3.5 * Math.sin(a * 17 + 0.3) + 1.5 * Math.sin(a * 41);
    rp.setY(i, Math.max(5, h));
  }
  ridge.computeVertexNormals();
  g.add(new Mesh(ridge, hillMat));

  // Fairy lights: a canopy of strings from the mandap finial to the walls, and curtains down the palace
  const crown = new Vector3(0, 8.1, 0);
  const anchors: Vector3[] = [];
  for (let x = -20; x <= 20; x += 5) anchors.push(new Vector3(x, 12.4, PALACE_Z + 0.2));
  for (const sx of [-1, 1]) for (let z = -16; z <= 30; z += 6.5) anchors.push(new Vector3(sx * (SIDE_X - 0.3), 7.3, z));
  for (let x = -14; x <= 14; x += 7) anchors.push(new Vector3(x, 8.7, GATE_Z - 0.2));
  const bulbStep = ctx.quality === 'high' ? 0.55 : 0.85;
  for (const a of anchors) {
    const len = crown.distanceTo(a);
    for (const p of spaced(sagCurve(crown, a, len * 0.09, 40), bulbStep)) fairy.add(p, 0.16);
  }
  for (let x = -21.5; x <= 21.5; x += 1.25) {
    if (Math.abs(x) < 7.4) continue;
    for (let y = 11.9; y > 6.9; y -= 0.38) fairy.add(new Vector3(x + (rng() - 0.5) * 0.08, y, PALACE_Z + 0.25), 0.12);
  }

  return {
    group: g, windowMat, lanternMat, waterMat, hillMat,
    anchors: { fairy: new Vector3(-2.8, 7.6, 2.2) },
  };
}
