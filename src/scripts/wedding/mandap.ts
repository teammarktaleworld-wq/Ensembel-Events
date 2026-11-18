import {
  BufferAttribute, BufferGeometry, DoubleSide, Group, InstancedMesh, Matrix4, Mesh, MeshPhysicalMaterial, MeshStandardMaterial,
  OctahedronGeometry, PointLight, Shape, ShapeGeometry, SphereGeometry, TorusGeometry, Vector3, CylinderGeometry,
  PlaneGeometry, type Texture,
} from 'three';
import { box, lathe, sagCurve, spaced, type FlowerBatch, type GlowPoints, type Materials } from './builders';

export const PLATFORM_TOP = 0.6;
const P = PLATFORM_TOP;
const HALF = 3.0; // pillar centres at ±HALF
const BEAM_Y = P + 3.72 + 0.15;
const TOP_Y = BEAM_Y + 0.15;
const CORNERS: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

type Ctx = { mats: Materials; flowers: FlowerBatch; flames: GlowPoints; leaves: { p: Vector3; dir: Vector3; s: number }[]; rangoli: Texture };

const PILLAR = [
  [0, 0], [0.42, 0], [0.42, 0.22], [0.36, 0.26], [0.36, 0.34], [0.3, 0.42], [0.27, 0.55], [0.33, 0.72], [0.36, 0.86], [0.33, 1.0],
  [0.24, 1.12], [0.2, 1.2], [0.19, 2.9], [0.23, 2.95], [0.23, 3.02], [0.19, 3.06], [0.19, 3.3], [0.26, 3.42], [0.34, 3.5],
  [0.4, 3.62], [0.42, 3.72], [0, 3.72],
];

function domeProfile(radius: number, height: number, drum: number) {
  const pts: number[][] = [[0, 0], [radius * 1.04, 0], [radius * 1.04, drum * 0.4], [radius * 0.98, drum * 0.5], [radius, drum]];
  for (let i = 1; i <= 18; i++) {
    const t = i / 18;
    const bulge = 1 + 0.12 * Math.sin(Math.PI * Math.min(1, t * 1.4));
    const r = radius * bulge * Math.cos((t * Math.PI) / 2) ** 0.9;
    pts.push([Math.max(r, radius * 0.08), drum + height * Math.sin((t * Math.PI) / 2) ** 1.15]);
  }
  return pts;
}

function finialProfile(s: number) {
  return [[0, 0], [0.14 * s, 0], [0.22 * s, 0.08 * s], [0.26 * s, 0.24 * s], [0.18 * s, 0.4 * s], [0.08 * s, 0.46 * s], [0.12 * s, 0.52 * s],
    [0.1 * s, 0.62 * s], [0.05 * s, 0.68 * s], [0.08 * s, 0.76 * s], [0.03 * s, 0.86 * s], [0, 1.2 * s]];
}

export function chhatri(mats: Materials, size: number, roof: MeshStandardMaterial | MeshPhysicalMaterial = mats.ivory) {
  const g = new Group();
  const d = size * 0.42;
  for (const [sx, sz] of CORNERS) {
    const post = new Mesh(new CylinderGeometry(size * 0.05, size * 0.06, size * 0.9, 10), mats.ivory);
    post.position.set(sx * d, size * 0.45, sz * d);
    g.add(post);
  }
  g.add(box(size * 1.05, size * 0.08, size * 1.05, mats.ivory, 0, size * 0.92, 0));
  const dome = lathe(domeProfile(size * 0.48, size * 0.55, size * 0.06), roof, 20);
  dome.position.y = size * 0.96;
  g.add(dome);
  const fin = lathe(finialProfile(size * 0.35), mats.gold, 12);
  fin.position.y = size * 1.55;
  g.add(fin);
  return g;
}

// Radial fabric swags under the canopy, sagging between seams; odd/even panels take two colours.
function ceilingSwags(parity: number, n = 12, half = HALF - 0.05, y = BEAM_Y - 0.05, sag = 0.5) {
  const U = 12;
  const V = 8;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = parity; i < n; i += 2) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    const base = pos.length / 3;
    for (let v = 0; v <= V; v++) {
      const a = a0 + ((a1 - a0) * v) / V;
      const edge = half / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
      const across = Math.sin((Math.PI * v) / V);
      for (let u = 0; u <= U; u++) {
        const t = u / U;
        const r = edge * t;
        pos.push(Math.cos(a) * r, y - 0.18 * (1 - t) - sag * Math.sin(Math.PI * t) * (0.35 + 0.65 * across), Math.sin(a) * r);
      }
    }
    for (let v = 0; v < V; v++) for (let u = 0; u < U; u++) {
      const a = base + v * (U + 1) + u;
      const b = a + U + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// A curtain hanging from the beam, gathered and tied at tieAt, with folds.
function curtainGeometry(H: number, wTop: number, wTie: number, wBottom: number, tieAt: number) {
  const cols = 16;
  const rows = 28;
  const pos: number[] = [];
  const idx: number[] = [];
  const ease = (x: number) => x * x * (3 - 2 * x);
  for (let r = 0; r <= rows; r++) {
    const t = r / rows;
    const w = t < tieAt ? wTop + (wTie - wTop) * ease(t / tieAt) : wTie + (wBottom - wTie) * ease((t - tieAt) / (1 - tieAt));
    const amp = 0.05 + 0.07 * (w / wTop);
    for (let c = 0; c <= cols; c++) {
      const s = c / cols;
      pos.push(s * w, -t * H, amp * Math.sin(s * Math.PI * 7 + t * 0.6) * (0.4 + 0.6 * s));
    }
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const a = r * (cols + 1) + c;
    const b = a + cols + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function valanceGeometry(width: number, height: number, scallops: number) {
  const s = new Shape();
  const hw = width / 2;
  s.moveTo(-hw, 0);
  s.lineTo(hw, 0);
  s.lineTo(hw, -height * 0.55);
  const step = width / scallops;
  for (let i = 0; i < scallops; i++) {
    const x0 = hw - i * step;
    s.quadraticCurveTo(x0 - step / 2, -height * 1.25, x0 - step, -height * 0.55);
  }
  s.lineTo(-hw, 0);
  return new ShapeGeometry(s, 6);
}

export function buildMandap(ctx: Ctx) {
  const { mats, flowers, flames, leaves } = ctx;
  const g = new Group();

  const fabric = (color: string) => new MeshPhysicalMaterial({ color, roughness: 0.62, sheen: 1, sheenRoughness: 0.45, sheenColor: '#ffffff', side: DoubleSide });
  const drapeMat = fabric('#ffcf33');
  const drapeAltMat = fabric('#ff9a1a');
  const valanceMat = new MeshPhysicalMaterial({ color: '#f0a01c', roughness: 0.55, sheen: 1, sheenColor: '#fff2c0', side: DoubleSide });
  const domeMat = new MeshStandardMaterial({ color: '#f5ecdd', roughness: 0.5 });

  // Platform: two marble tiers with gold edges and a rangoli floor
  const lower = box(9.6, 0.3, 9.6, mats.marble, 0, 0.15, 0);
  const upper = box(7.8, 0.3, 7.8, mats.marble, 0, 0.45, 0);
  lower.receiveShadow = upper.receiveShadow = true;
  lower.castShadow = upper.castShadow = true;
  g.add(lower, upper);
  for (const [size, y] of [[9.62, 0.3], [7.82, 0.6]]) {
    for (const [w, d, x, z] of [[size, 0.06, 0, size / 2], [size, 0.06, 0, -size / 2], [0.06, size, size / 2, 0], [0.06, size, -size / 2, 0]]) {
      g.add(box(w, 0.05, d, mats.gold, x, y - 0.02, z));
    }
  }
  const floor = new Mesh(new PlaneGeometry(7.5, 7.5), new MeshStandardMaterial({ map: ctx.rangoli, roughness: 0.4 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = P + 0.005;
  floor.receiveShadow = true;
  g.add(floor);
  for (let i = 0; i < 2; i++) g.add(box(2.6, 0.15, 0.5, mats.marble, 0, 0.075 + i * 0.15, 4.8 + 0.5 - i * 0.25 + 0.25));

  // Pillars with gold rings and a marigold spiral
  const pillarParts: Mesh[] = [];
  for (const [sx, sz] of CORNERS) {
    const x = sx * HALF;
    const z = sz * HALF;
    const plinth = box(0.95, 0.24, 0.95, mats.marble, x, P + 0.12, z);
    const col = lathe(PILLAR, mats.ivory, 28);
    col.position.set(x, P + 0.2, z);
    pillarParts.push(plinth, col);
    for (const [y, r] of [[0.32, 0.37], [1.13, 0.24], [2.98, 0.235], [3.44, 0.29]]) {
      const ring = new Mesh(new TorusGeometry(r, 0.035, 8, 28), mats.gold);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, P + 0.2 + y, z);
      pillarParts.push(ring);
    }
    const helix: Vector3[] = [];
    for (let i = 0; i <= 260; i++) {
      const t = i / 260;
      const a = t * Math.PI * 2 * 4.5 + (sx + sz) * 0.7;
      helix.push(new Vector3(x + Math.cos(a) * 0.27, P + 1.45 + t * 1.6, z + Math.sin(a) * 0.27));
    }
    flowers.addAlong(spaced(helix, 0.1), 0.065, '0010012');
  }
  pillarParts.forEach((m) => { m.castShadow = true; m.receiveShadow = true; g.add(m); });

  // Beams, cornice and valances
  for (const [w, d, x, z] of [[6.7, 0.32, 0, HALF], [6.7, 0.32, 0, -HALF], [0.32, 6.7, HALF, 0], [0.32, 6.7, -HALF, 0]]) {
    const beam = box(w, 0.3, d, mats.gold, x, BEAM_Y, z);
    beam.castShadow = true;
    g.add(beam);
  }
  const cornice = box(7.1, 0.16, 7.1, mats.ivory, 0, TOP_Y + 0.08, 0);
  cornice.castShadow = true;
  g.add(cornice);
  const valGeo = valanceGeometry(6.5, 0.5, 9);
  for (let i = 0; i < 4; i++) {
    const v = new Mesh(valGeo, valanceMat);
    const a = (i * Math.PI) / 2;
    v.position.set(Math.sin(a) * (HALF + 0.2), TOP_Y + 0.02, Math.cos(a) * (HALF + 0.2));
    v.rotation.y = a;
    v.castShadow = true;
    g.add(v);
  }

  // Dome with drum and kalash finial, plus a chhatri over each pillar
  const dome = lathe(domeProfile(2.35, 2.2, 0.35), domeMat, 40);
  dome.position.y = TOP_Y + 0.16;
  dome.castShadow = true;
  g.add(dome);
  const finial = lathe(finialProfile(0.9), mats.gold, 16);
  finial.position.y = TOP_Y + 0.16 + 2.5;
  g.add(finial);
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2;
    flowers.add(new Vector3(Math.cos(a) * 2.48, TOP_Y + 0.4, Math.sin(a) * 2.48), 0.08, i % 3 === 0 ? 2 : 0);
  }
  for (const [sx, sz] of CORNERS) {
    const c = chhatri(mats, 0.95, domeMat);
    c.position.set(sx * HALF, TOP_Y + 0.16, sz * HALF);
    g.add(c);
  }

  // Draped ceiling
  const swagA = new Mesh(ceilingSwags(0), drapeMat);
  const swagB = new Mesh(ceilingSwags(1), drapeAltMat);
  g.add(swagA, swagB);

  // Side curtains, tied to each pillar
  const curtainGeo = curtainGeometry(BEAM_Y - 0.15 - P, 1.45, 0.16, 0.6, 0.55);
  const curtains: Mesh[] = [];
  for (const [sx, sz] of CORNERS) {
    const a = new Mesh(curtainGeo, drapeMat);
    a.position.set(sx * HALF, BEAM_Y - 0.15, sz * (HALF + 0.46));
    a.rotation.y = sx > 0 ? Math.PI : 0;
    const b = new Mesh(curtainGeo, drapeMat);
    b.position.set(sx * (HALF + 0.46), BEAM_Y - 0.15, sz * HALF);
    b.rotation.y = sz > 0 ? Math.PI / 2 : -Math.PI / 2;
    a.rotation.order = b.rotation.order = 'YXZ';
    curtains.push(a, b);
  }
  curtains.forEach((c) => { c.castShadow = true; g.add(c); });
  // Gold tie-backs
  for (const [sx, sz] of CORNERS) {
    const tie = new Mesh(new TorusGeometry(0.16, 0.03, 8, 20), mats.gold);
    tie.position.set(sx * (HALF + 0.3), P + 1.7, sz * (HALF + 0.3));
    tie.rotation.set(Math.PI / 2, 0, Math.PI / 4);
    g.add(tie);
  }

  // Flower strings (laris) and double garland swags on all four sides
  for (let side = 0; side < 4; side++) {
    const a = (side * Math.PI) / 2;
    const out = new Vector3(Math.sin(a), 0, Math.cos(a));
    const along = new Vector3(Math.cos(a), 0, -Math.sin(a));
    for (let s = -2.55; s <= 2.56; s += 0.34) {
      const len = 0.35 + 1.55 * Math.pow(Math.abs(s) / 2.55, 1.6);
      const top = out.clone().multiplyScalar(HALF + 0.3).addScaledVector(along, s);
      top.y = TOP_Y - 0.28;
      flowers.addLari(top, len, along, 0.06, s > 0 ? '0010012' : '1001002');
    }
    for (const [off, sag, pat] of [[0.42, 0.8, '00200'], [0.48, 0.66, '11011']] as const) {
      const p0 = out.clone().multiplyScalar(HALF + off).addScaledVector(along, -HALF);
      const p1 = out.clone().multiplyScalar(HALF + off).addScaledVector(along, HALF);
      p0.y = p1.y = TOP_Y - 0.1;
      flowers.addAlong(spaced(sagCurve(p0, p1, sag, 40), 0.1), 0.075, pat);
    }
  }

  // Mango-leaf toran across the front
  for (let s = -2.6; s <= 2.61; s += 0.2) {
    const p = new Vector3(s, TOP_Y - 0.32 - 0.06 * Math.cos((s / 2.6) * Math.PI), HALF + 0.56);
    leaves.push({ p, dir: new Vector3(0, -1, 0.15), s: 1 });
    flowers.add(p.clone().add(new Vector3(0.1, 0.05, 0.02)), 0.055, 0);
  }

  // Chandelier
  const chand = new Group();
  const crystalMat = new MeshStandardMaterial({ color: '#fff8ea', emissive: '#ffe2a8', emissiveIntensity: 0.3, metalness: 0.2, roughness: 0.15 });
  chand.add(new Mesh(new CylinderGeometry(0.015, 0.015, 0.55, 6), mats.gold));
  chand.children[0].position.y = 0.27;
  const crystalGeo = new OctahedronGeometry(0.032);
  const rings = [[0.56, -0.32, 26], [0.4, -0.12, 18], [0.24, 0.06, 12]] as const;
  let total = 0;
  rings.forEach(([, , n]) => (total += n * 2));
  const crystals = new InstancedMesh(crystalGeo, crystalMat, total + 1);
  const m4 = new Matrix4();
  let ci = 0;
  for (const [r, y, n] of rings) {
    const ring = new Mesh(new TorusGeometry(r, 0.018, 6, 40), mats.gold);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    chand.add(ring);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      for (let k = 0; k < 2; k++) {
        m4.makeScale(1, 1.6, 1).setPosition(Math.cos(a) * r, y - 0.07 - k * 0.09, Math.sin(a) * r);
        crystals.setMatrixAt(ci++, m4);
      }
    }
  }
  m4.makeScale(2.4, 3.4, 2.4).setPosition(0, -0.62, 0);
  crystals.setMatrixAt(ci, m4);
  chand.add(crystals);
  chand.position.y = BEAM_Y - 0.55;
  g.add(chand);
  const chandLight = new PointLight('#ffd49a', 0, 0, 2);
  chandLight.position.set(0, BEAM_Y - 1.0, 0);
  g.add(chandLight);

  // Agni kund: stepped brass vessel
  [[1.0, 0], [0.8, 0.12], [0.62, 0.24]].forEach(([s, y]) => {
    const step = box(s, 0.12, s, mats.brass, 0, P + 0.06 + y, 0);
    step.castShadow = true;
    g.add(step);
  });
  g.add(box(0.5, 0.02, 0.5, new MeshStandardMaterial({ color: '#2a1a12', roughness: 1 }), 0, P + 0.37, 0));

  // Kalash pots with coconut and mango leaves at the inner corners
  for (const [sx, sz] of CORNERS) {
    const x = sx * 3.55;
    const z = sz * 3.55;
    const pot = lathe([[0, 0], [0.1, 0], [0.16, 0.06], [0.2, 0.16], [0.18, 0.26], [0.09, 0.32], [0.1, 0.36], [0.13, 0.38], [0, 0.38]], mats.brass, 20);
    pot.position.set(x, P, z);
    pot.castShadow = true;
    const nut = new Mesh(new SphereGeometry(0.1, 14, 10), mats.coconut);
    nut.scale.set(1, 1.2, 1);
    nut.position.set(x, P + 0.46, z);
    g.add(pot, nut);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      leaves.push({ p: new Vector3(x + Math.cos(a) * 0.1, P + 0.39, z + Math.sin(a) * 0.1), dir: new Vector3(Math.cos(a), 0.25, Math.sin(a)), s: 1.15 });
    }
  }

  // Tall brass samai lamps on the lower tier, five flames each
  for (const [sx, sz] of CORNERS) {
    const x = sx * 4.45;
    const z = sz * 4.45;
    const lamp = lathe([[0, 0], [0.22, 0], [0.2, 0.05], [0.06, 0.1], [0.04, 0.3], [0.07, 0.36], [0.03, 0.42], [0.03, 1.15], [0.06, 1.2], [0.2, 1.26], [0.22, 1.3], [0, 1.3]], mats.brass, 18);
    lamp.position.set(x, 0.3, z);
    lamp.castShadow = true;
    g.add(lamp);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      flames.add(new Vector3(x + Math.cos(a) * 0.15, 0.3 + 1.4, z + Math.sin(a) * 0.15), 0.16);
    }
  }

  // Clay diyas along the platform edge
  const diyaGeo = lathe([[0, 0], [0.05, 0], [0.07, 0.025], [0.065, 0.04], [0, 0.03]], mats.clay, 10).geometry;
  const diyaSpots: Vector3[] = [];
  for (let side = 0; side < 4; side++) {
    const a = (side * Math.PI) / 2;
    for (let s = -2.4; s <= 2.41; s += 0.6) {
      if (side === 0 && Math.abs(s) < 1.4) continue; // keep the steps clear
      diyaSpots.push(new Vector3(Math.sin(a) * 3.72 + Math.cos(a) * s, P, Math.cos(a) * 3.72 - Math.sin(a) * s));
    }
  }
  const diyas = new InstancedMesh(diyaGeo, mats.clay, diyaSpots.length);
  diyaSpots.forEach((p, i) => {
    diyas.setMatrixAt(i, m4.makeTranslation(p.x, p.y, p.z));
    flames.add(p.clone().setY(P + 0.1), 0.11);
  });
  g.add(diyas);

  const anchors = {
    pillar: new Vector3(HALF + 0.3, P + 2.3, HALF + 0.3),
    lari: new Vector3(-1.9, TOP_Y - 1.2, HALF + 0.35),
    canopy: new Vector3(0, BEAM_Y - 0.3, 0),
    kalash: new Vector3(3.55, P + 0.5, 3.55),
    agni: new Vector3(0, P + 0.55, 0),
    chandelier: new Vector3(0, BEAM_Y - 1.0, 0),
    rangoli: new Vector3(2.2, P, 2.4),
    dome: new Vector3(0, TOP_Y + 1.6, 0),
    samai: new Vector3(4.45, 1.72, 4.45),
    pillarFront: new Vector3(-3.25, P + 2.1, 3.25),
  };

  return { group: g, drapeMat, drapeAltMat, valanceMat, crystalMat, chandLight, curtains, anchors };
}
