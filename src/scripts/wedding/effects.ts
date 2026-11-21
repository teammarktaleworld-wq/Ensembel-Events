import {
  AdditiveBlending, BackSide, Color, ConeGeometry, DoubleSide, Group, InstancedBufferAttribute, InstancedMesh, Matrix4, Mesh,
  PlaneGeometry, PointLight, Quaternion, ShaderMaterial, SphereGeometry, Vector3, Euler, type Texture,
} from 'three';
import { GlowPoints, paletteMaterial, rng } from './builders';

export function buildSky() {
  const material = new ShaderMaterial({
    uniforms: {
      uTop: { value: new Color() }, uMid: { value: new Color() }, uHorizon: { value: new Color() }, uGround: { value: new Color() },
      uSun: { value: new Color() }, uSunDir: { value: new Vector3(0, 1, 0) }, uSunStrength: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop;
      uniform vec3 uMid;
      uniform vec3 uHorizon;
      uniform vec3 uGround;
      uniform vec3 uSun;
      uniform vec3 uSunDir;
      uniform float uSunStrength;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.2, h));
        col = mix(col, uTop, smoothstep(0.16, 0.7, h));
        col = mix(col, uGround, smoothstep(0.0, -0.1, h));
        float s = max(dot(d, uSunDir), 0.0);
        col += uSun * (pow(s, 1400.0) * 8.0 + pow(s, 10.0) * 0.35 + pow(s, 3.0) * 0.08) * uSunStrength;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side: BackSide,
    depthWrite: false,
    fog: false,
  });
  const mesh = new Mesh(new SphereGeometry(450, 48, 24), material);
  mesh.renderOrder = -1;
  return { mesh, material };
}

export function buildStars(glowTex: Texture) {
  const stars = new GlowPoints();
  for (let i = 0; i < 700; i++) {
    const u = rng() * Math.PI * 2;
    const v = Math.acos(0.12 + rng() * 0.88);
    stars.add(new Vector3(Math.sin(v) * Math.cos(u), Math.cos(v), Math.sin(v) * Math.sin(u)).multiplyScalar(420), 0.9 + rng() * 1.6);
  }
  const points = stars.build(glowTex, '#e8eeff', 0.5, 1.4);
  return { points, material: stars.material };
}

const flameVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const flameFragment = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uSeed;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  void main() {
    vec2 uv = vUv;
    float t = uTime + uSeed;
    float n = noise(vec2(uv.x * 4.0, uv.y * 3.0 - t * 2.4)) * 0.6 + noise(vec2(uv.x * 9.0, uv.y * 7.0 - t * 3.6)) * 0.4;
    float x = abs(uv.x - 0.5) * 2.0 + (n - 0.5) * 0.7 * uv.y;
    float width = (1.0 - uv.y) * 0.85 + 0.06;
    float body = 1.0 - smoothstep(width * 0.55, width, x);
    body *= smoothstep(1.0, 0.3, uv.y + n * 0.35) * smoothstep(0.0, 0.1, uv.y);
    vec3 col = mix(vec3(1.0, 0.28, 0.04), vec3(1.0, 0.72, 0.25), body);
    col = mix(col, vec3(1.0, 0.9, 0.62), smoothstep(0.75, 1.0, body) * (1.0 - uv.y) * 0.6);
    gl_FragColor = vec4(col * body * uIntensity * 1.45, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

export function buildFire(at: Vector3, glowTex: Texture) {
  const group = new Group();
  group.position.copy(at);
  const mats: ShaderMaterial[] = [];
  const planes: Mesh[] = [];
  [[0.62, 0.95, 0], [0.42, 0.72, 1.7]].forEach(([w, h, seed], i) => {
    const m = new ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uIntensity: { value: 0 }, uSeed: { value: seed } },
      vertexShader: flameVertex, fragmentShader: flameFragment,
      transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide,
    });
    mats.push(m);
    for (let k = 0; k < 2; k++) {
      const p = new Mesh(new PlaneGeometry(w, h), m);
      p.position.y = h / 2 - 0.04;
      p.rotation.y = k * (Math.PI / 2) + i * 0.6;
      planes.push(p);
      group.add(p);
    }
  });

  // The light lives outside `group` and is never hidden, only dimmed to 0. Hiding a light changes the scene's
  // light count, which makes three.js recompile every material mid-scroll (a multi-second freeze).
  const light = new PointLight('#ff8a3d', 0, 0, 2);
  light.position.copy(at).add(new Vector3(0, 0.9, 0));

  const halo = new GlowPoints();
  halo.add(new Vector3(0, 0.4, 0), 2.6);
  const haloPoints = halo.build(glowTex, '#ff8c3a', 0.15, 9);
  group.add(haloPoints);

  const embers = new GlowPoints();
  const N = 46;
  const life = new Float32Array(N);
  const seeds = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    embers.add(new Vector3(), 0.05 + rng() * 0.04);
    life[i] = rng();
    seeds[i] = rng() * 10;
  }
  const emberPoints = embers.build(glowTex, '#ffb347', 0.6, 14);
  group.add(emberPoints);
  const emberPos = emberPoints.geometry.attributes.position;

  function update(time: number, dt: number, intensity: number) {
    group.visible = intensity > 0.01;
    if (!group.visible) { light.intensity = 0; return; }
    const flicker = 0.85 + 0.15 * Math.sin(time * 17) * Math.sin(time * 7.3 + 1.2);
    mats.forEach((m) => { m.uniforms.uTime.value = time; m.uniforms.uIntensity.value = intensity; });
    light.intensity = intensity * 3.2 * flicker;
    halo.material.uniforms.uOpacity.value = intensity * 0.55;
    halo.material.uniforms.uTime.value = time;
    embers.material.uniforms.uOpacity.value = intensity;
    embers.material.uniforms.uTime.value = time;
    for (let i = 0; i < N; i++) {
      life[i] += dt * (0.35 + (seeds[i] % 1) * 0.3);
      if (life[i] > 1) life[i] -= 1;
      const l = life[i];
      const s = seeds[i];
      emberPos.setXYZ(i, Math.sin(s + time * 1.3) * 0.18 * (0.3 + l), 0.15 + l * 2.1, Math.cos(s * 1.7 + time) * 0.18 * (0.3 + l));
    }
    emberPos.needsUpdate = true;
  }

  return { group, light, update };
}

// Falling petals, plus petals resting on the aisle and the mandap steps.
export function buildPetals(count: number, resting: number) {
  const geo = new PlaneGeometry(0.07, 0.045, 2, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.abs(pos.getX(i)) * 0.25);
  geo.computeVertexNormals();
  const attach = (g: PlaneGeometry, n: number) => {
    const slot = new Float32Array(n);
    const shade = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      slot[i] = rng() < 0.6 ? 0 : 1;
      shade[i] = 0.8 + rng() * 0.35;
    }
    g.setAttribute('aSlot', new InstancedBufferAttribute(slot, 1));
    g.setAttribute('aShade', new InstancedBufferAttribute(shade, 1));
    return g;
  };
  const mat = paletteMaterial({ color: '#ffffff', roughness: 0.7, side: DoubleSide });

  const fallingGeo = attach(geo.clone(), count);
  const falling = new InstancedMesh(fallingGeo, mat, count);
  falling.frustumCulled = false;
  const p = new Float32Array(count * 3);
  const v = new Float32Array(count * 3);
  const spin = new Float32Array(count * 3);
  const reset = (i: number, top: boolean) => {
    const a = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * 9;
    p[i * 3] = Math.cos(a) * r;
    p[i * 3 + 1] = top ? 9 + rng() * 4 : rng() * 12;
    p[i * 3 + 2] = Math.sin(a) * r + 2;
    v[i * 3] = (rng() - 0.5) * 0.3;
    v[i * 3 + 1] = -(0.35 + rng() * 0.35);
    v[i * 3 + 2] = (rng() - 0.5) * 0.3;
    spin[i * 3] = rng() * 6.28;
    spin[i * 3 + 1] = rng() * 6.28;
    spin[i * 3 + 2] = 0.8 + rng() * 2.2;
  };
  for (let i = 0; i < count; i++) reset(i, false);

  const restGeo = attach(geo.clone(), resting);
  const rest = new InstancedMesh(restGeo, mat, resting);
  const m = new Matrix4();
  const q = new Quaternion();
  const e = new Euler();
  const sc = new Vector3(1, 1, 1);
  const tmp = new Vector3();
  for (let i = 0; i < resting; i++) {
    const onAisle = i < resting * 0.8;
    const x = onAisle ? (rng() - 0.5) * 2.2 : (rng() - 0.5) * 2.6;
    const z = onAisle ? 5.8 + rng() * 29 : 4.9 + rng() * 0.8;
    e.set(-Math.PI / 2 + (rng() - 0.5) * 0.3, rng() * 6.28, 0, 'YXZ');
    q.setFromEuler(e);
    rest.setMatrixAt(i, m.compose(tmp.set(x, onAisle ? 0.02 : 0.31, z), q, sc));
  }

  function update(time: number, dt: number, density: number) {
    const n = Math.floor(count * Math.min(1, density));
    falling.count = n;
    for (let i = 0; i < n; i++) {
      const k = i * 3;
      p[k] += (v[k] + Math.sin(time * 0.9 + spin[k]) * 0.25) * dt;
      p[k + 1] += v[k + 1] * dt;
      p[k + 2] += (v[k + 2] + Math.cos(time * 0.7 + spin[k + 1]) * 0.2) * dt;
      if (p[k + 1] < 0.03) reset(i, true);
      e.set(spin[k] + time * spin[k + 2], spin[k + 1] + time * spin[k + 2] * 0.6, time * 0.5, 'XYZ');
      q.setFromEuler(e);
      falling.setMatrixAt(i, m.compose(tmp.set(p[k], p[k + 1], p[k + 2]), q, sc));
    }
    falling.instanceMatrix.needsUpdate = true;
  }

  return { falling, rest, update };
}

// Sangeet stage beams sweeping from the palace roof.
export function buildBeams() {
  const group = new Group();
  const geo = new ConeGeometry(4.2, 34, 32, 1, true);
  geo.translate(0, -17, 0);
  geo.rotateX(-Math.PI / 2);
  const colors = ['#ff4fb0', '#9b5cff', '#ffb347', '#57c7ff'];
  const beams = colors.map((c, i) => {
    const mat = new ShaderMaterial({
      uniforms: { uColor: { value: new Color(c) }, uOpacity: { value: 0 } },
      vertexShader: /* glsl */ `
        varying float vV;
        varying vec3 vN;
        varying vec3 vView;
        void main() {
          vV = uv.y;
          vN = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vV;
        varying vec3 vN;
        varying vec3 vView;
        void main() {
          float edge = pow(abs(dot(normalize(vN), normalize(vView))), 1.6);
          float a = edge * pow(vV, 1.3) * uOpacity * 0.32;
          gl_FragColor = vec4(uColor * a, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide,
    });
    const mesh = new Mesh(geo, mat);
    mesh.position.set(-12 + i * 8, 9.6, 34.6);
    group.add(mesh);
    return { mesh, mat, seed: i * 1.9 };
  });
  const target = new Vector3();
  // Sweep follows the scroll (plus a slow drift), so the lights move as the visitor moves.
  function update(time: number, opacity: number, sweep = 0) {
    group.visible = opacity > 0.01;
    if (!group.visible) return;
    for (const b of beams) {
      b.mat.uniforms.uOpacity.value = opacity;
      target.set(Math.sin(time * 0.3 + b.seed + sweep * 3.2) * 6, 0, Math.cos(time * 0.25 + b.seed + sweep * 2.4) * 5 + 3);
      b.mesh.lookAt(target);
    }
  }
  return { group, update };
}
