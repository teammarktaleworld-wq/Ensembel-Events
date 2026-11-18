import {
  AdditiveBlending, BoxGeometry, BufferAttribute, BufferGeometry, Color, DoubleSide, Euler, IcosahedronGeometry, InstancedBufferAttribute,
  InstancedMesh, LatheGeometry, Matrix4, Mesh, MeshStandardMaterial, Points, Quaternion, ShaderMaterial, Vector2, Vector3,
  type Material, type Texture,
} from 'three';
import { seeded } from './textures';

export const rng = seeded(1987);

export function createMaterials(maps: { sandstone: Texture }) {
  return {
    ivory: new MeshStandardMaterial({ color: '#ebdfca', roughness: 0.55 }),
    marble: new MeshStandardMaterial({ color: '#eee7db', roughness: 0.32 }),
    gold: new MeshStandardMaterial({ color: '#dcaa4c', metalness: 1, roughness: 0.28 }),
    brass: new MeshStandardMaterial({ color: '#b98a35', metalness: 1, roughness: 0.36 }),
    bronze: new MeshStandardMaterial({ color: '#4a3622', metalness: 0.7, roughness: 0.45 }),
    clay: new MeshStandardMaterial({ color: '#a4542c', roughness: 0.85 }),
    sandstone: new MeshStandardMaterial({ color: '#ead3b2', map: maps.sandstone, roughness: 0.88 }),
    leaf: new MeshStandardMaterial({ color: '#2f7d32', roughness: 0.6, side: DoubleSide }),
    coconut: new MeshStandardMaterial({ color: '#6b4426', roughness: 0.9 }),
  };
}
export type Materials = ReturnType<typeof createMaterials>;

export function lathe(profile: number[][], material: Material, segments = 24, phiStart = 0, phiLength = Math.PI * 2) {
  const g = new LatheGeometry(profile.map(([r, y]) => new Vector2(r, y)), segments, phiStart, phiLength);
  return new Mesh(g, material);
}

export function box(w: number, h: number, d: number, material: Material, x = 0, y = 0, z = 0) {
  const m = new Mesh(new BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  return m;
}

// Points along a hanging string between a and b (parabolic sag).
export function sagCurve(a: Vector3, b: Vector3, sag: number, n: number) {
  const pts: Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = a.clone().lerp(b, t);
    p.y -= sag * 4 * t * (1 - t);
    pts.push(p);
  }
  return pts;
}

export function spaced(points: Vector3[], step: number) {
  const out: Vector3[] = [];
  let carry = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const len = a.distanceTo(b);
    let d = carry;
    while (d <= len) {
      out.push(a.clone().lerp(b, d / len));
      d += step;
    }
    carry = d - len;
  }
  return out;
}

// Shared tint uniforms: every flower and petal in the scene takes the current theme's palette.
export const palette = {
  uC0: { value: new Color('#ff8a00') },
  uC1: { value: new Color('#ffc61a') },
  uC2: { value: new Color('#fff4d8') },
};

export function paletteMaterial(params: ConstructorParameters<typeof MeshStandardMaterial>[0]) {
  const m = new MeshStandardMaterial(params);
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, palette);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aSlot;\nattribute float aShade;\nuniform vec3 uC0;\nuniform vec3 uC1;\nuniform vec3 uC2;\nvarying vec3 vTint;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTint = (aSlot < 0.5 ? uC0 : (aSlot < 1.5 ? uC1 : uC2)) * aShade;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTint;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vTint;');
  };
  return m;
}

type Lari = { start: number; count: number; top: Vector3; axis: Vector3; step: number; phase: number; amp: number };

const _m = new Matrix4();
const _q = new Quaternion();
const _qs = new Quaternion();
const _s = new Vector3();
const _p = new Vector3();
const _e = new Euler();

// All flowers (strings, garlands, urns, floating blooms) in one instanced draw call.
export class FlowerBatch {
  private pos: number[] = [];
  private size: number[] = [];
  private slot: number[] = [];
  private shade: number[] = [];
  private spin: number[] = [];
  private laris: Lari[] = [];
  mesh!: InstancedMesh;

  add(p: Vector3, size: number, slot: number) {
    this.pos.push(p.x, p.y, p.z);
    this.size.push(size * (0.85 + rng() * 0.3));
    this.slot.push(slot);
    this.shade.push(0.82 + rng() * 0.3);
    this.spin.push(rng() * 6.28, rng() * 6.28, rng() * 6.28);
  }

  // Pattern like '001002' picks palette slots in sequence.
  addAlong(points: Vector3[], size: number, pattern: string) {
    points.forEach((p, i) => this.add(p, size, Number(pattern[i % pattern.length])));
  }

  addLari(top: Vector3, length: number, axis: Vector3, size: number, pattern: string) {
    const step = size * 1.55;
    const count = Math.max(2, Math.round(length / step));
    const start = this.pos.length / 3;
    for (let i = 0; i < count; i++) this.add(new Vector3(top.x, top.y - i * step, top.z), size, Number(pattern[i % pattern.length]));
    this.laris.push({ start, count, top: top.clone(), axis: axis.clone().normalize(), step, phase: rng() * 6.28, amp: 0.035 + rng() * 0.03 });
  }

  build(detail: number) {
    const n = this.pos.length / 3;
    const geo = new IcosahedronGeometry(1, detail);
    geo.scale(1, 0.82, 1);
    geo.setAttribute('aSlot', new InstancedBufferAttribute(new Float32Array(this.slot), 1));
    geo.setAttribute('aShade', new InstancedBufferAttribute(new Float32Array(this.shade), 1));
    const mat = paletteMaterial({ color: '#ffffff', roughness: 0.78, flatShading: true });
    this.mesh = new InstancedMesh(geo, mat, n);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = true;
    for (let i = 0; i < n; i++) this.write(i, this.pos[i * 3], this.pos[i * 3 + 1], this.pos[i * 3 + 2]);
    this.mesh.instanceMatrix.needsUpdate = true;
    return this.mesh;
  }

  private write(i: number, x: number, y: number, z: number) {
    _e.set(this.spin[i * 3], this.spin[i * 3 + 1], this.spin[i * 3 + 2]);
    _q.setFromEuler(_e);
    _s.setScalar(this.size[i]);
    _p.set(x, y, z);
    this.mesh.setMatrixAt(i, _m.compose(_p, _q, _s));
  }

  // Strings sway gently from their top knot.
  sway(time: number) {
    for (const l of this.laris) {
      const a = l.amp * Math.sin(time * 1.15 + l.phase) + l.amp * 0.4 * Math.sin(time * 2.3 + l.phase * 1.7);
      _qs.setFromAxisAngle(l.axis, a);
      for (let k = 0; k < l.count; k++) {
        _p.set(0, -k * l.step, 0).applyQuaternion(_qs).add(l.top);
        this.write(l.start + k, _p.x, _p.y, _p.z);
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

// Additive sprites for lamp flames, fairy lights and stars. Size is in metres.
export class GlowPoints {
  private pos: number[] = [];
  private sizes: number[] = [];
  private phase: number[] = [];
  points!: Points;
  material!: ShaderMaterial;

  add(p: Vector3, size: number) {
    this.pos.push(p.x, p.y, p.z);
    this.sizes.push(size);
    this.phase.push(rng());
  }

  get count() { return this.pos.length / 3; }

  build(texture: Texture, color: string, flicker: number, speed: number, flipY = false, fade: [number, number] = [0.2, 0.6]) {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(this.pos), 3));
    g.setAttribute('aSize', new BufferAttribute(new Float32Array(this.sizes), 1));
    g.setAttribute('aPhase', new BufferAttribute(new Float32Array(this.phase), 1));
    this.material = new ShaderMaterial({
      uniforms: {
        uTex: { value: texture }, uColor: { value: new Color(color) }, uOpacity: { value: 1 },
        uTime: { value: 0 }, uScale: { value: 500 }, uFlicker: { value: flicker }, uSpeed: { value: speed }, uMaxSize: { value: 64 }, uFade: { value: new Vector2(fade[0], fade[1]) }, uReveal: { value: 1 },
      },
      vertexShader: /* glsl */ `
        attribute float aSize;
        attribute float aPhase;
        uniform float uTime;
        uniform float uScale;
        uniform float uFlicker;
        uniform float uSpeed;
        uniform float uMaxSize;
        uniform vec2 uFade;
        varying float vTw;
        varying float vNear;
        varying float vPhase;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vNear = smoothstep(uFade.x, uFade.y, -mv.z);
          vPhase = aPhase;
          float tw = 1.0 + uFlicker * (0.5 * sin(uTime * uSpeed + aPhase * 6.2831) + 0.3 * sin(uTime * uSpeed * 2.3 + aPhase * 19.0));
          vTw = tw;
          gl_PointSize = clamp(aSize * uScale * tw / -mv.z, 1.0, uMaxSize);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uTex;
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uReveal;
        varying float vTw;
        varying float vNear;
        varying float vPhase;
        void main() {
          vec2 uv = vec2(gl_PointCoord.x, ${flipY ? '1.0 - gl_PointCoord.y' : 'gl_PointCoord.y'});
          vec4 t = texture2D(uTex, uv);
          // uReveal below 1 switches the lights on one by one
          float a = t.a * uOpacity * clamp(vTw, 0.2, 1.4) * vNear * smoothstep(vPhase - 0.06, vPhase, uReveal);
          gl_FragColor = vec4(uColor * t.rgb * a, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    this.points = new Points(g, this.material);
    this.points.frustumCulled = false;
    return this.points;
  }
}
