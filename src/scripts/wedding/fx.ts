import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, NormalBlending, Points, ShaderMaterial, Vector3, type Texture,
} from 'three';
import { rng } from './builders';

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeOut = (t: number) => 1 - (1 - t) ** 3;

// Point sprites with their own colour, alpha and size, written on the CPU each frame. Size is in metres.
function sprites(count: number, tex: Texture, additive: boolean) {
  const geometry = new BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const alpha = new Float32Array(count);
  const size = new Float32Array(count);
  geometry.setAttribute('position', new BufferAttribute(pos, 3));
  geometry.setAttribute('aColor', new BufferAttribute(col, 3));
  geometry.setAttribute('aAlpha', new BufferAttribute(alpha, 1));
  geometry.setAttribute('aSize', new BufferAttribute(size, 1));
  const material = new ShaderMaterial({
    uniforms: { uTex: { value: tex }, uScale: { value: 500 }, uMaxSize: { value: 96 } },
    vertexShader: /* glsl */ `
      attribute vec3 aColor;
      attribute float aAlpha;
      attribute float aSize;
      uniform float uScale;
      uniform float uMaxSize;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vColor = aColor;
        vAlpha = aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(aSize * uScale / -mv.z, 1.0, uMaxSize);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uTex;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float a = texture2D(uTex, gl_PointCoord).a * vAlpha;
        if (a < 0.004) discard;
        gl_FragColor = ${additive ? 'vec4(vColor * a, 1.0)' : 'vec4(vColor, a)'};
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true,
    depthWrite: false,
    blending: additive ? AdditiveBlending : NormalBlending,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  points.visible = false;
  const commit = () => {
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aAlpha.needsUpdate = true;
    geometry.attributes.aSize.needsUpdate = true;
  };
  return { points, material, pos, col, alpha, size, commit };
}

// Haldi: clouds of turmeric powder burst up around the mandap as the visitor scrolls through the function.
export function buildPowder(tex: Texture, count: number) {
  const s = sprites(count, tex, false);
  const origin: Vector3[] = [];
  const dir: Vector3[] = [];
  const delay = new Float32Array(count);
  const reach = new Float32Array(count);
  const base = new Float32Array(count);
  const tones = ['#ffd23f', '#ffbf1f', '#ff9f1c', '#ffe27a'].map((h) => new Color(h));
  for (let i = 0; i < count; i++) {
    const a = rng() * Math.PI * 2;
    const r = 2.6 + rng() * 2.8;
    origin.push(new Vector3(Math.cos(a) * r, 0.4 + rng() * 1.2, Math.sin(a) * r));
    dir.push(new Vector3(Math.cos(a) * (0.6 + rng() * 0.6), 0.6 + rng() * 0.9, Math.sin(a) * (0.6 + rng() * 0.6)));
    delay[i] = rng() * 0.45;
    reach[i] = 2 + rng() * 3;
    base[i] = 1.4 + rng() * 2.2;
    tones[i % tones.length].toArray(s.col, i * 3);
  }
  s.points.geometry.attributes.aColor.needsUpdate = true;

  function update(phase: number, fade: number, time: number) {
    s.points.visible = fade > 0.01 && phase > 0;
    if (!s.points.visible) return;
    for (let i = 0; i < count; i++) {
      const k = clamp01((phase - delay[i]) / 0.55);
      const e = easeOut(k);
      const o = origin[i];
      const d = dir[i];
      s.pos[i * 3] = o.x + d.x * e * reach[i] + Math.sin(time * 0.6 + i) * 0.15 * k;
      s.pos[i * 3 + 1] = o.y + d.y * e * reach[i] * 0.8;
      s.pos[i * 3 + 2] = o.z + d.z * e * reach[i] + Math.cos(time * 0.5 + i) * 0.15 * k;
      s.alpha[i] = Math.sin(Math.PI * k) ** 1.3 * 0.55 * fade;
      s.size[i] = base[i] * (0.5 + 0.9 * e);
    }
    s.commit();
  }
  return { points: s.points, material: s.material, update };
}

// Reception: cold-pyro fountains along the aisle, each erupting as the couple walks past it.
export function buildFountains(tex: Texture, spots: Vector3[], perFountain: number) {
  const n = spots.length * perFountain;
  const s = sprites(n, tex, true);
  const phase = new Float32Array(n);
  const vel = new Float32Array(n * 3);
  const hot = new Color('#fff4cc');
  const warm = new Color('#ffbf5e');
  const c = new Color();
  for (let i = 0; i < n; i++) {
    phase[i] = rng();
    vel[i * 3] = (rng() - 0.5) * 0.7;
    vel[i * 3 + 1] = 3.4 + rng() * 1.2;
    vel[i * 3 + 2] = (rng() - 0.5) * 0.7;
    c.copy(hot).lerp(warm, rng() * 0.7).multiplyScalar(1.6).toArray(s.col, i * 3);
  }
  s.points.geometry.attributes.aColor.needsUpdate = true;
  const LIFE = 1.15;
  const G = -5.5;

  function update(time: number, levels: number[]) {
    s.points.visible = levels.some((l) => l > 0.01);
    if (!s.points.visible) return;
    for (let f = 0; f < spots.length; f++) {
      const b = spots[f];
      for (let j = 0; j < perFountain; j++) {
        const i = f * perFountain + j;
        const age = ((time * 0.9 + phase[i]) % 1) * LIFE;
        s.pos[i * 3] = b.x + vel[i * 3] * age;
        s.pos[i * 3 + 1] = b.y + vel[i * 3 + 1] * age + 0.5 * G * age * age;
        s.pos[i * 3 + 2] = b.z + vel[i * 3 + 2] * age;
        s.alpha[i] = levels[f] * (1 - age / LIFE) ** 1.2;
        s.size[i] = 0.17 * (1 - 0.5 * age / LIFE);
      }
    }
    s.commit();
  }
  return { points: s.points, material: s.material, update };
}

// Reception finale: shells rise and burst over the palace while the camera pulls out.
export function buildFireworks(tex: Texture, bursts: number, per: number) {
  const n = bursts * per;
  const s = sprites(n, tex, true);
  const dirs = new Float32Array(n * 3);
  const centers: Vector3[] = [];
  const offsets = new Float32Array(bursts);
  const palette = ['#ffd36b', '#ff5fa2', '#7fd6ff', '#b98bff', '#ff8a3d', '#ffffff', '#9bff8a'].map((h) => new Color(h));
  const white = new Color('#ffffff');
  const PERIOD = 2.8;
  for (let b = 0; b < bursts; b++) {
    centers.push(new Vector3(-24 + rng() * 48, 19 + rng() * 12, -44 + rng() * 18));
    offsets[b] = (b / bursts) * PERIOD + rng() * 0.3;
    const tone = palette[b % palette.length];
    for (let j = 0; j < per; j++) {
      const i = b * per + j;
      const u = rng() * 2 - 1;
      const t = rng() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      const speed = 0.75 + rng() * 0.35;
      dirs[i * 3] = r * Math.cos(t) * speed;
      dirs[i * 3 + 1] = u * speed;
      dirs[i * 3 + 2] = r * Math.sin(t) * speed;
      (rng() < 0.15 ? white : tone).clone().multiplyScalar(1.8).toArray(s.col, i * 3);
    }
  }
  s.points.geometry.attributes.aColor.needsUpdate = true;

  function update(time: number, level: number) {
    s.points.visible = level > 0.01;
    if (!s.points.visible) return;
    for (let b = 0; b < bursts; b++) {
      const q = ((time + offsets[b]) % PERIOD) / PERIOD;
      const c = centers[b];
      for (let j = 0; j < per; j++) {
        const i = b * per + j;
        if (q < 0.16) {
          // The shell climbing towards its burst point
          const k = q / 0.16;
          s.pos[i * 3] = c.x + (j % 3) * 0.05;
          s.pos[i * 3 + 1] = c.y - 14 * (1 - k);
          s.pos[i * 3 + 2] = c.z;
          s.alpha[i] = j < 3 ? level * 0.9 : 0;
          s.size[i] = 0.4;
        } else {
          const qe = (q - 0.16) / 0.84;
          const e = easeOut(qe) * 9;
          s.pos[i * 3] = c.x + dirs[i * 3] * e;
          s.pos[i * 3 + 1] = c.y + dirs[i * 3 + 1] * e - 3.2 * qe * qe;
          s.pos[i * 3 + 2] = c.z + dirs[i * 3 + 2] * e;
          s.alpha[i] = level * (1 - qe) ** 1.6;
          s.size[i] = 0.6 * (1 - 0.4 * qe);
        }
      }
    }
    s.commit();
  }
  return { points: s.points, material: s.material, update };
}
