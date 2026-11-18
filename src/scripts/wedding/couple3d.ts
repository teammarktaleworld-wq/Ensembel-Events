import {
  CapsuleGeometry, CatmullRomCurve3, ConeGeometry, CylinderGeometry, DoubleSide, Group, LatheGeometry, Mesh, MeshPhysicalMaterial,
  MeshStandardMaterial, SphereGeometry, TorusGeometry, TubeGeometry, Vector2, Vector3, type Material,
} from 'three';
import type { Materials } from './builders';

const lathe = (profile: number[][], mat: Material, seg = 32, phiStart = 0, phiLength = Math.PI * 2) =>
  new Mesh(new LatheGeometry(profile.map(([r, y]) => new Vector2(r, y)), seg, phiStart, phiLength), mat);

const ball = (r: number, mat: Material, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => {
  const m = new Mesh(new SphereGeometry(r, 20, 14), mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
};

function shadows(g: Group) {
  g.traverse((o) => { if ((o as Mesh).isMesh) (o as Mesh).castShadow = true; });
  return g;
}

function buildGroom(mats: Materials) {
  const g = new Group();
  const ivory = new MeshPhysicalMaterial({ color: '#f6edd9', roughness: 0.5, sheen: 0.6, sheenColor: '#ffffff', side: DoubleSide });
  const skin = new MeshStandardMaterial({ color: '#c68a5e', roughness: 0.6 });
  const hair = new MeshStandardMaterial({ color: '#1d1512', roughness: 0.7 });
  const saffron = new MeshPhysicalMaterial({ color: '#f29a1d', roughness: 0.55, sheen: 1, sheenColor: '#ffd27a' });
  const marigold = new MeshPhysicalMaterial({ color: '#e8541e', roughness: 0.55, sheen: 1, sheenColor: '#ffb27a' });
  const maroon = new MeshPhysicalMaterial({ color: '#7d1428', roughness: 0.6, sheen: 1, sheenColor: '#ff9aa8', side: DoubleSide });
  const pearl = new MeshStandardMaterial({ color: '#fbf6ec', roughness: 0.25 });

  const legs: Group[] = [];
  for (const sx of [-1, 1]) {
    const pivot = new Group();
    pivot.position.set(sx * 0.085, 0.64, 0);
    const leg = new Mesh(new CylinderGeometry(0.075, 0.048, 0.58, 12), ivory);
    leg.position.y = -0.29;
    const shoe = ball(0.05, mats.gold, 0, -0.6, 0.035, 1, 0.65, 2.1);
    pivot.add(leg, shoe);
    g.add(pivot);
    legs.push(pivot);
  }

  const coat = lathe([[0.265, 0.5], [0.25, 0.62], [0.218, 0.8], [0.188, 0.98], [0.2, 1.12], [0.215, 1.26], [0.205, 1.36], [0.17, 1.42], [0.075, 1.47], [0.066, 1.5]], ivory, 36);
  coat.scale.z = 0.74;
  const hem = lathe([[0.268, 0.5], [0.256, 0.58]], mats.gold, 36);
  hem.scale.z = 0.74;
  const collar = lathe([[0.075, 1.45], [0.07, 1.54]], mats.gold, 20);
  collar.scale.z = 0.85;
  const placket = new Mesh(new CylinderGeometry(0.018, 0.018, 0.95, 6), mats.gold);
  placket.position.set(0, 0.98, 0.168);
  placket.rotation.x = -0.05;
  g.add(coat, hem, collar, placket);
  for (let i = 0; i < 5; i++) g.add(ball(0.012, mats.gold, 0, 1.38 - i * 0.09, 0.158 + i * 0.002));

  const stole = new Mesh(new TorusGeometry(0.205, 0.032, 8, 40), maroon);
  stole.scale.set(1, 0.74, 1);
  stole.rotation.set(Math.PI / 2, 0.62, 0);
  stole.position.set(0, 1.12, 0);
  const tail = new Mesh(new CylinderGeometry(0.05, 0.06, 0.95, 8, 1, true), maroon);
  tail.scale.z = 0.3;
  tail.position.set(0.15, 0.95, -0.1);
  g.add(stole, tail);

  const arms: Group[] = [];
  for (const sx of [-1, 1]) {
    const pivot = new Group();
    pivot.position.set(sx * 0.205, 1.38, 0);
    pivot.rotation.z = sx * 0.1;
    const sleeve = new Mesh(new CapsuleGeometry(0.055, 0.5, 6, 12), ivory);
    sleeve.position.y = -0.3;
    const cuff = new Mesh(new TorusGeometry(0.05, 0.012, 6, 16), mats.gold);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.y = -0.56;
    const hand = ball(0.042, skin, 0, -0.62, 0);
    pivot.add(sleeve, cuff, hand);
    g.add(pivot);
    arms.push(pivot);
  }

  g.add(new Mesh(new CylinderGeometry(0.05, 0.055, 0.12, 12), skin).translateY(1.53));
  const head = new Group();
  head.position.y = 1.66;
  head.add(ball(0.104, skin, 0, 0, 0, 0.92, 1.08, 0.98));
  head.add(ball(0.106, hair, 0, -0.005, -0.018, 0.94, 1.0, 0.98));
  head.add(ball(0.022, skin, -0.096, -0.005, 0), ball(0.022, skin, 0.096, -0.005, 0));
  // Safa: wrapped turban with kalgi and a tail down the back
  const safa = ball(0.13, saffron, 0, 0.1, -0.005, 1.06, 0.8, 1.08);
  const wraps = [
    new Mesh(new TorusGeometry(0.118, 0.03, 8, 30), marigold),
    new Mesh(new TorusGeometry(0.125, 0.028, 8, 30), saffron),
    new Mesh(new TorusGeometry(0.11, 0.026, 8, 30), marigold),
  ];
  wraps[0].rotation.set(Math.PI / 2 + 0.28, 0, 0);
  wraps[0].position.y = 0.07;
  wraps[1].rotation.set(Math.PI / 2 - 0.22, 0, 0.1);
  wraps[1].position.y = 0.11;
  wraps[2].rotation.set(Math.PI / 2 + 0.12, 0, -0.12);
  wraps[2].position.y = 0.16;
  const brooch = ball(0.026, mats.gold, 0, 0.12, 0.13, 1, 1, 0.5);
  const stone = ball(0.012, new MeshStandardMaterial({ color: '#b3122e', roughness: 0.2, metalness: 0.2 }), 0, 0.12, 0.142);
  const plume = new Mesh(new ConeGeometry(0.014, 0.19, 8), pearl);
  plume.position.set(0, 0.24, 0.1);
  plume.rotation.x = -0.45;
  const turra = new Mesh(new CylinderGeometry(0.035, 0.06, 0.48, 8, 1, true), saffron);
  turra.scale.z = 0.35;
  turra.position.set(0, -0.12, -0.12);
  turra.rotation.x = 0.12;
  head.add(safa, ...wraps, brooch, stone, plume, turra);
  g.add(head);

  const mala = new Mesh(new TorusGeometry(0.115, 0.011, 6, 36), pearl);
  mala.rotation.x = 1.15;
  mala.position.set(0, 1.36, 0.06);
  g.add(mala);

  return { g: shadows(g), legs, arms, head, sashAnchor: new Vector3(0.16, 0.95, -0.12) };
}

function buildBride(mats: Materials) {
  const g = new Group();
  const red = new MeshPhysicalMaterial({ color: '#a3102b', roughness: 0.55, sheen: 1, sheenColor: '#ff8fa3', side: DoubleSide });
  const zari = new MeshStandardMaterial({ color: '#d9a64a', metalness: 0.85, roughness: 0.35, side: DoubleSide });
  const skin = new MeshStandardMaterial({ color: '#cf9a70', roughness: 0.6 });
  const hair = new MeshStandardMaterial({ color: '#1a1210', roughness: 0.6 });
  const veil = new MeshPhysicalMaterial({ color: '#d4204a', roughness: 0.5, sheen: 1, sheenColor: '#ffc2cf', transparent: true, opacity: 0.72, side: DoubleSide, depthWrite: false });
  const ivoryBangle = new MeshStandardMaterial({ color: '#f3e7d2', roughness: 0.3 });

  // Lehenga with pleats that deepen towards the hem
  const skirt = lathe([[0.5, 0], [0.52, 0.02], [0.5, 0.06], [0.44, 0.2], [0.36, 0.38], [0.27, 0.58], [0.19, 0.76], [0.145, 0.9], [0.13, 0.96]], red, 72);
  const pos = skirt.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const k = 1 + 0.03 * Math.sin(Math.atan2(z, x) * 18) * (1 - y / 0.96);
    pos.setXYZ(i, x * k, y, z * k);
  }
  skirt.geometry.computeVertexNormals();
  const border = lathe([[0.508, 0.02], [0.47, 0.17]], zari, 72);
  const band = lathe([[0.405, 0.27], [0.39, 0.31]], zari, 60);
  g.add(skirt, border, band);
  g.add(new Mesh(new CylinderGeometry(0.12, 0.13, 0.06, 20), skin).translateY(0.99));
  const choli = lathe([[0.13, 1.0], [0.15, 1.08], [0.165, 1.18], [0.158, 1.26], [0.138, 1.32], [0.062, 1.37]], red, 32);
  choli.scale.z = 0.8;
  const choliHem = lathe([[0.134, 1.0], [0.142, 1.04]], zari, 32);
  choliHem.scale.z = 0.8;
  g.add(choli, choliHem);

  const arms: Group[] = [];
  for (const sx of [-1, 1]) {
    const pivot = new Group();
    pivot.position.set(sx * 0.17, 1.29, 0);
    pivot.rotation.z = sx * 0.12;
    const sleeve = new Mesh(new CapsuleGeometry(0.05, 0.1, 6, 12), red);
    sleeve.position.y = -0.07;
    const forearm = new Mesh(new CapsuleGeometry(0.038, 0.36, 6, 12), skin);
    forearm.position.y = -0.33;
    pivot.add(sleeve, forearm);
    for (let i = 0; i < 6; i++) {
      const b = new Mesh(new TorusGeometry(0.042, 0.009, 6, 16), i % 3 === 1 ? ivoryBangle : red);
      b.rotation.x = Math.PI / 2;
      b.position.y = -0.3 - i * 0.022;
      pivot.add(b);
    }
    for (let i = 0; i < 3; i++) {
      const k = new Mesh(new ConeGeometry(0.018, 0.07, 8), mats.gold);
      k.position.set(Math.cos(i * 2.1) * 0.045, -0.47, Math.sin(i * 2.1) * 0.045);
      k.rotation.x = Math.PI;
      pivot.add(k);
    }
    pivot.add(ball(0.036, skin, 0, -0.55, 0));
    g.add(pivot);
    arms.push(pivot);
  }

  g.add(new Mesh(new CylinderGeometry(0.04, 0.046, 0.1, 12), skin).translateY(1.41));
  const necklace = new Mesh(new TorusGeometry(0.09, 0.016, 6, 36), mats.gold);
  necklace.rotation.x = 1.2;
  necklace.position.set(0, 1.34, 0.04);
  g.add(necklace);

  const head = new Group();
  head.position.y = 1.53;
  head.add(ball(0.094, skin, 0, 0, 0, 0.9, 1.08, 0.97));
  head.add(ball(0.097, hair, 0, 0.01, -0.016, 0.94, 1.03, 0.98));
  head.add(ball(0.055, hair, 0, -0.02, -0.11));
  head.add(ball(0.012, mats.gold, 0, 0.075, 0.074));
  head.add(ball(0.009, mats.gold, -0.085, -0.04, 0.01), ball(0.009, mats.gold, 0.085, -0.04, 0.01));
  g.add(head);

  // Veil from the crown down the back, open at the face, with a zari hem
  const phiStart = Math.PI * 0.3;
  const phiLength = Math.PI * 1.4;
  const dupatta = lathe([[0.0, 0.14], [0.07, 0.135], [0.112, 0.1], [0.13, 0.01], [0.15, -0.11], [0.23, -0.33], [0.31, -0.63], [0.39, -0.98], [0.45, -1.32]], veil, 40, phiStart, phiLength);
  dupatta.position.y = 1.53;
  const dupattaHem = lathe([[0.452, -1.33], [0.44, -1.25]], zari, 40, phiStart, phiLength);
  dupattaHem.position.y = 1.53;
  g.add(dupatta, dupattaHem);

  return { g: shadows(g), arms, head, sashAnchor: new Vector3(0.12, 1.0, 0.1) };
}

export type CouplePose = {
  show: number;
  // dance: Sangeet; pheras: the seven rounds; entry: the reception walk down the aisle
  mode: 'dance' | 'pheras' | 'entry';
  t: number;
  turn: number;
  time: number;
};

const ENTRY_FROM = 15.5;
const ENTRY_TO = 1.75;
const smoothstep = (t: number) => t * t * (3 - 2 * t);

// Where the couple is on the aisle for a given entry progress (also used to set off the fountains).
export const entryZ = (t: number) => ENTRY_FROM + (ENTRY_TO - ENTRY_FROM) * smoothstep(Math.min(1, Math.max(0, t)));

export function buildCouple(mats: Materials, platformTop: number) {
  const group = new Group();
  const groom = buildGroom(mats);
  const bride = buildBride(mats);
  group.add(groom.g, bride.g);

  const sashMat = new MeshPhysicalMaterial({ color: '#e8b04a', roughness: 0.5, sheen: 1, sheenColor: '#fff0c0' });
  const sash = new Mesh(new TubeGeometry(new CatmullRomCurve3([new Vector3(), new Vector3(0, 0, 1)]), 2, 0.012, 4), sashMat);
  sash.castShadow = true;
  group.add(sash);

  const R = 1.4;
  const TURN = Math.PI * 2 * 7;
  const a0 = Math.PI * 0.15;
  const DANCE_Z = 2.2;
  const tmpA = new Vector3();
  const tmpB = new Vector3();
  let frame = 0;

  const angLerp = (p: number, q: number, r: number) => {
    let d = q - p;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    return p + d * r;
  };
  // Ground, the two front steps, then up onto the mandap platform
  const floorAt = (z: number) => {
    if (z > 5.55) return 0;
    if (z > 4.8) return (0.3 * (5.55 - z)) / 0.75;
    if (z > 3.9) return 0.3 + (0.3 * (4.8 - z)) / 0.9;
    return platformTop;
  };

  function place(char: { g: Group }, x: number, y: number, z: number, rotY: number) {
    char.g.position.set(x, y, z);
    char.g.rotation.y = rotY;
  }

  function rest() {
    groom.arms.forEach((a, i) => a.rotation.set(0, 0, (i ? 1 : -1) * 0.1));
    bride.arms.forEach((a, i) => a.rotation.set(0, 0, (i ? 1 : -1) * 0.12));
    groom.legs.forEach((l) => l.rotation.set(0, 0, 0));
  }

  function update(m: CouplePose) {
    group.visible = m.show > 0.001;
    if (!group.visible) return;
    const s = Math.max(0.0001, m.show);
    group.scale.setScalar(s * (1 + 0.06 * Math.sin(Math.PI * Math.min(1, s)) * (1 - s)));
    const breath = Math.sin(m.time * 1.6) * 0.004;
    rest();

    if (m.mode === 'dance') {
      // Sangeet: circling each other in front of the mandap, bhangra arms for him, raised hands for her
      const ang = m.t * Math.PI * 2 * 1.25 + m.time * 0.35;
      const gx = Math.sin(ang) * 0.62;
      const gz = Math.cos(ang) * 0.62;
      const beat = m.time * 4.2;
      place(groom, gx, platformTop + Math.abs(Math.sin(beat)) * 0.05, DANCE_Z + gz, Math.atan2(-gx, -gz));
      place(bride, -gx, platformTop + Math.abs(Math.sin(beat + 1.2)) * 0.035, DANCE_Z - gz, Math.atan2(gx, gz));
      groom.arms[0].rotation.set(-0.2, 0, -2.3 + Math.sin(beat) * 0.25);
      groom.arms[1].rotation.set(-0.2, 0, 2.3 - Math.sin(beat) * 0.25);
      bride.arms[0].rotation.set(-0.5, 0, -1.2 + Math.sin(beat * 0.5) * 0.2);
      bride.arms[1].rotation.set(-0.5, 0, 1.2 - Math.sin(beat * 0.5 + 1) * 0.2);
      const kick = Math.sin(beat * 2) * 0.25;
      groom.legs[0].rotation.x = kick;
      groom.legs[1].rotation.x = -kick;
      groom.head.rotation.y = Math.sin(beat * 0.5) * 0.15;
      bride.head.rotation.y = Math.sin(beat * 0.5 + 1) * 0.15;
    } else if (m.mode === 'pheras') {
      // Clockwise around the fire, which stays on their right
      const a = a0 - m.t * TURN;
      const ab = a + 0.62;
      const dist = m.t * TURN * R;
      const walking = m.t > 0 && m.t < 1 ? 1 : 0;
      const stride = Math.sin((dist / 0.34) * Math.PI) * walking;
      const face = (ang: number) => Math.atan2(-Math.cos(ang), Math.sin(ang));
      place(groom, Math.sin(a) * R, platformTop + Math.abs(stride) * 0.018 + breath, Math.cos(a) * R, face(a));
      place(bride, Math.sin(ab) * R, platformTop + Math.abs(Math.sin((dist / 0.3) * Math.PI)) * 0.012 * walking + breath, Math.cos(ab) * R, face(ab));
      groom.legs[0].rotation.x = stride * 0.38;
      groom.legs[1].rotation.x = -stride * 0.38;
      groom.arms[0].rotation.x = -stride * 0.15;
      groom.arms[1].rotation.x = stride * 0.15;
      bride.arms[0].rotation.x = -0.25;
      bride.arms[1].rotation.x = -0.15 + Math.sin(m.time * 1.2) * 0.03;
      groom.head.rotation.y = Math.sin(m.time * 0.6) * 0.04;
      bride.head.rotation.y = Math.sin(m.time * 0.7 + 1) * 0.05;
    } else {
      // Reception: the grand entry down the aisle, then they turn to face the guests
      const z = entryZ(m.t);
      const walking = m.t > 0.001 && m.t < 0.999 ? 1 : 0;
      const stride = Math.sin(((ENTRY_FROM - z) / 0.34) * Math.PI) * walking;
      const rot = angLerp(Math.PI, 0, m.turn);
      const y = floorAt(z) + breath;
      place(groom, -0.42, y + Math.abs(stride) * 0.018, z, rot + 0.18 * m.turn);
      place(bride, 0.42, y + Math.abs(stride) * 0.012, z, rot - 0.18 * m.turn);
      groom.legs[0].rotation.x = stride * 0.38;
      groom.legs[1].rotation.x = -stride * 0.38;
      groom.arms[0].rotation.x = -stride * 0.15;
      groom.arms[1].rotation.x = stride * 0.15 - 0.35 * m.turn;
      bride.arms[0].rotation.x = -0.25 - 0.2 * m.turn;
      bride.arms[1].rotation.x = -0.15 + Math.sin(m.time * 1.2) * 0.03;
      groom.head.rotation.y = 0.12 * m.turn + Math.sin(m.time * 0.6) * 0.04;
      bride.head.rotation.y = -0.14 * m.turn + Math.sin(m.time * 0.7 + 1) * 0.05;
    }

    // Gathbandhan: the knot tying his stole to her veil, worn for the pheras
    sash.visible = m.mode === 'pheras';
    if (sash.visible && frame++ % 2 === 0) {
      groom.g.updateMatrixWorld();
      bride.g.updateMatrixWorld();
      tmpA.copy(groom.sashAnchor).applyMatrix4(groom.g.matrixWorld);
      tmpB.copy(bride.sashAnchor).applyMatrix4(bride.g.matrixWorld);
      group.worldToLocal(tmpA);
      group.worldToLocal(tmpB);
      const mid = tmpA.clone().lerp(tmpB, 0.5);
      mid.y -= 0.22 + tmpA.distanceTo(tmpB) * 0.08;
      sash.geometry.dispose();
      sash.geometry = new TubeGeometry(new CatmullRomCurve3([tmpA.clone(), mid, tmpB.clone()]), 20, 0.014, 5);
    }
  }

  return { group, update };
}
