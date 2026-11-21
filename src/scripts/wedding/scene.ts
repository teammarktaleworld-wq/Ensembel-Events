import {
  Color, DirectionalLight, Fog, HemisphereLight, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, NeutralToneMapping,
  PCFShadowMap, PerspectiveCamera, PlaneGeometry, PMREMGenerator, Quaternion, Scene, Shape, ShapeGeometry, SpotLight,
  SRGBColorSpace, Vector3, WebGLRenderer, type Object3D, type Texture,
} from 'three';
import { carpet, flame, glow, marbleTiles, rangoli, sandstone } from './textures';
import { createMaterials, FlowerBatch, GlowPoints, palette } from './builders';
import { buildMandap, PLATFORM_TOP } from './mandap';
import { buildVenue } from './venue';
import { buildCouple, entryZ, type CouplePose } from './couple3d';
import { buildBeams, buildFire, buildPetals, buildSky, buildStars } from './effects';
import { buildFireworks, buildFountains, buildPowder } from './fx';
import { CHAPTER_AT, createThemeState, mixTheme } from './themes';
import { chapterLocal } from './chapters';

export type Label = { key: string; x: number; y: number; on: boolean };
export type FrameInfo = { progress: number; chapter: number; phera: number; labels: Label[] };
export type WeddingScene = {
  setTarget(p: number): void;
  jumpTo(p: number): void;
  setPointer(x: number, y: number): void;
  resize(): void;
  start(): void;
  stop(): void;
  renderOnce(): void;
  dispose(): void;
};

// Camera shots: angle (deg) around the mandap, distance, height, look-at height and field of view.
// Each function arrives from a close or high angle, settles on its hero shot, then zooms in towards the next page.
type Pose = { a: number; r: number; h: number; ty: number; fov: number };
const P = (a: number, r: number, h: number, ty: number, fov = 40): Pose => ({ a, r, h, ty, fov });
const SHOTS: { enter: Pose; hero: Pose; exit: Pose }[] = [
  { enter: P(0, 36, 14, 3.4), hero: P(24, 15, 4.4, 3.2), exit: P(30, 6.8, 3.9, 3.6, 30) },
  { enter: P(-66, 6.5, 2.4, 3.2, 32), hero: P(-50, 10.5, 2.4, 3.6), exit: P(-34, 5.2, 2.8, 3.9, 30) },
  { enter: P(20, 38, 20, 1.5), hero: P(12, 18, 7.5, 2.6), exit: P(6, 8.5, 4.5, 1.8, 32) },
  { enter: P(-20, 2.6, 1.4, 0.9, 34), hero: P(-14, 9, 3.4, 1.0), exit: P(-8, 4.6, 1.9, 1.2, 30) },
  { enter: P(0, 30, 3.2, 1.8), hero: P(0, 11.5, 2.4, 2.4), exit: P(0, 34, 12, 9, 46) },
];

// Cold-pyro fountains either side of the aisle, set off as the couple walks past.
const FOUNTAINS = [13.5, 10.5, 7.5].flatMap((z) => [new Vector3(-1.55, 0.02, z), new Vector3(1.55, 0.02, z)]);

const ease = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const band = (e0: number, e1: number, x: number) => ease(clamp01((x - e0) / (e1 - e0)));

type Options = {
  quality: 'high' | 'low';
  onFrame?: (f: FrameInfo) => void;
  // First frame actually drawn, and the GPU dropping the context.
  onReady?: () => void;
  onLost?: () => void;
};

export function createWeddingScene(canvas: HTMLCanvasElement, opts: Options): WeddingScene {
  const high = opts.quality === 'high';
  // Kept deliberately light: no post-processing buffers, capped resolution, small shadow map.
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  const basePR = Math.min(window.devicePixelRatio || 1, high ? 1.5 : 1.25);
  renderer.setPixelRatio(basePR);
  // Shader error checks make the browser wait for every shader compile (a stall); not needed in production.
  renderer.debug.checkShaderErrors = import.meta.env.DEV;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.shadowMap.enabled = high;
  renderer.shadowMap.type = PCFShadowMap;

  let lost = false;
  let ready = false;
  // True until every shader has been compiled in the background (see the warm-up below).
  let warming = true;
  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
    opts.onLost?.();
  };
  canvas.addEventListener('webglcontextlost', onLost);

  const scene = new Scene();
  const fog = new Fog('#f4e6cf', 60, 190);
  scene.fog = fog;
  const camera = new PerspectiveCamera(40, 1, 0.1, 1000);

  const glowTex = glow();
  const mats = createMaterials({ sandstone: sandstone() });
  const flowers = new FlowerBatch();
  const flames = new GlowPoints();
  const halos = new GlowPoints();
  const fairy = new GlowPoints();
  const leaves: { p: Vector3; dir: Vector3; s: number }[] = [];

  const mandap = buildMandap({ mats, flowers, flames, leaves, rangoli: rangoli() });
  const venue = buildVenue({ mats, flowers, flames, halos, fairy, marble: marbleTiles(160), carpet: carpet(10), quality: opts.quality });
  scene.add(venue.group, mandap.group);
  scene.add(flowers.build(high ? 1 : 0));

  const leafShape = new Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.05, 0.07, 0, 0.18);
  leafShape.quadraticCurveTo(-0.05, 0.07, 0, 0);
  const leafMesh = new InstancedMesh(new ShapeGeometry(leafShape, 4), mats.leaf, leaves.length);
  const m4 = new Matrix4();
  const q = new Quaternion();
  const UP = new Vector3(0, 1, 0);
  leaves.forEach((l, i) => {
    q.setFromUnitVectors(UP, l.dir.clone().normalize());
    leafMesh.setMatrixAt(i, m4.compose(l.p, q, new Vector3(l.s, l.s, l.s)));
  });
  scene.add(leafMesh);

  const flameTex = flame();
  scene.add(flames.build(flameTex, '#ffd08a', 0.35, 11, true));
  scene.add(halos.build(glowTex, '#ffb766', 0.08, 3, false, [1.5, 5]));
  scene.add(fairy.build(glowTex, '#ffd9a0', 0.55, 2.2, false, [2.5, 9]));
  const chandGlow = new GlowPoints();
  chandGlow.add(mandap.anchors.chandelier.clone().setY(mandap.anchors.chandelier.y + 0.35), 2.6);
  scene.add(chandGlow.build(glowTex, '#ffe2a8', 0.06, 2, false, [0.5, 2]));

  const sky = buildSky();
  scene.add(sky.mesh);
  const stars = buildStars(glowTex);
  scene.add(stars.points);
  const fire = buildFire(new Vector3(0, PLATFORM_TOP + 0.36, 0), glowTex);
  scene.add(fire.group, fire.light);
  const petals = buildPetals(high ? 520 : 220, high ? 320 : 150);
  scene.add(petals.falling, petals.rest);
  const beams = buildBeams();
  scene.add(beams.group);
  const couple = buildCouple(mats, PLATFORM_TOP);
  scene.add(couple.group);
  const powder = buildPowder(glowTex, high ? 190 : 90);
  const fountains = buildFountains(glowTex, FOUNTAINS, high ? 60 : 32);
  const fireworks = buildFireworks(glowTex, 7, high ? 110 : 60);
  scene.add(powder.points, fountains.points, fireworks.points);

  // Lights
  const hemi = new HemisphereLight('#dcecff', '#d8c39c', 1.2);
  const sun = new DirectionalLight('#fff0d2', 3);
  sun.castShadow = high;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 120 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  const spotA = new SpotLight('#ffd7a6', 0, 50, 0.42, 0.75, 1.5);
  spotA.position.set(7, 11, 14);
  const spotB = new SpotLight('#ffc6dc', 0, 50, 0.45, 0.75, 1.5);
  spotB.position.set(-9, 10, -13);
  scene.add(hemi, sun, sun.target, spotA, spotA.target, spotB, spotB.target);
  spotA.target.position.set(0, 1.6, 0);
  spotB.target.position.set(0, 1.6, 0);

  // Reflections: one environment per function, rendered from its sky (plus warm panels for the gold) the first time it is needed.
  const pmrem = new PMREMGenerator(renderer);
  const envScene = new Scene();
  envScene.add(new Mesh(sky.mesh.geometry, sky.material));
  for (const [x, y, z] of [[18, 14, 10], [-16, 10, -14], [0, 22, 0]]) {
    const panel = new Mesh(new PlaneGeometry(14, 8), new MeshBasicMaterial({ color: new Color(2.6, 2.2, 1.7) }));
    panel.position.set(x, y, z);
    panel.lookAt(0, 0, 0);
    envScene.add(panel);
  }
  const envMaps: (Texture | null)[] = CHAPTER_AT.map(() => null);
  const envFor = (i: number) => {
    if (!envMaps[i]) {
      applySky(createThemeState(), CHAPTER_AT[i]);
      envMaps[i] = pmrem.fromScene(envScene, 0.02, 0.1, 1000).texture;
    }
    return envMaps[i]!;
  };

  const theme = createThemeState();
  const anchors: Record<string, Vector3> = { ...mandap.anchors, ...venue.anchors };
  const labelKeys = Object.keys(anchors);
  const labels: Label[] = labelKeys.map((key) => ({ key, x: 0, y: 0, on: false }));
  const proj = new Vector3();
  const sunDir = new Vector3();
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let width = 1;
  let height = 1;
  let portrait = false;
  let target = 0;
  let progress = 0;
  let time = 0;
  let last = performance.now();
  let raf = 0;
  let running = false;
  let frameNo = 0;

  function applySky(state: ReturnType<typeof createThemeState>, p: number) {
    mixTheme(state, p);
    const { c, n } = state;
    sky.material.uniforms.uTop.value.copy(c.skyTop);
    sky.material.uniforms.uMid.value.copy(c.skyMid);
    sky.material.uniforms.uHorizon.value.copy(c.skyHorizon);
    sky.material.uniforms.uGround.value.copy(c.fog);
    sky.material.uniforms.uSun.value.copy(c.sun);
    const az = (n.sunAzimuth * Math.PI) / 180;
    const el = (n.sunElevation * Math.PI) / 180;
    sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();
    sky.material.uniforms.uSunDir.value.copy(sunDir);
    sky.material.uniforms.uSunStrength.value = Math.min(1, n.sunIntensity / 2);
    return { az, el };
  }

  function applyTheme(p: number) {
    const blend = mixTheme(theme, p);
    const env = envFor(blend.t < 0.5 ? blend.a : blend.b);
    const { az, el } = applySky(theme, p);
    const { c, n } = theme;
    scene.environment = env;
    fog.color.copy(c.fog);
    fog.near = n.fogNear;
    fog.far = n.fogFar;
    renderer.toneMappingExposure = n.exposure;

    const lightEl = Math.max(el, 0.12);
    sun.position.set(Math.sin(az) * Math.cos(lightEl), Math.sin(lightEl), Math.cos(az) * Math.cos(lightEl)).multiplyScalar(40);
    sun.color.copy(c.sun);
    sun.intensity = n.sunIntensity;
    hemi.color.copy(c.hemiSky);
    hemi.groundColor.copy(c.hemiGround);
    hemi.intensity = n.hemiIntensity;
    scene.environmentIntensity = 0.2 + n.hemiIntensity * 0.35;
    spotA.color.copy(c.decorA);
    spotB.color.copy(c.decorB);
    spotA.intensity = n.decor * 190;
    spotB.intensity = n.decor * 150;

    mandap.drapeMat.color.copy(c.drape);
    mandap.drapeAltMat.color.copy(c.drapeAlt);
    mandap.valanceMat.color.copy(c.valance);
    palette.uC0.value.copy(c.flower0);
    palette.uC1.value.copy(c.flower1);
    palette.uC2.value.copy(c.flower2);

    fairy.material.uniforms.uOpacity.value = n.fairy;
    fairy.material.uniforms.uColor.value.copy(c.fairyColor);
    chandGlow.material.uniforms.uOpacity.value = n.chandelier * 0.7;
    flames.material.uniforms.uOpacity.value = Math.min(1, 0.15 + n.lanterns);
    halos.material.uniforms.uOpacity.value = n.lanterns * 0.75;
    venue.lanternMat.emissiveIntensity = 0.1 + n.lanterns * 2.2;
    venue.windowMat.emissiveIntensity = n.windows * 1.5;
    venue.hillMat.color.copy(c.fog).multiplyScalar(0.85);
    mandap.crystalMat.emissiveIntensity = 0.2 + n.chandelier * 1.1;
    mandap.chandLight.intensity = n.chandelier * 14;
    stars.material.uniforms.uOpacity.value = n.stars;
    return n;
  }

  function placeCamera(p: number) {
    const { ch, L } = chapterLocal(p);
    const shot = SHOTS[ch];
    const [from, to, t] = L < 0 ? [shot.enter, shot.hero, ease(L + 1)] : [shot.hero, shot.exit, ease(L)];
    const mix = (k: keyof Pose) => from[k] + (to[k] - from[k]) * t;
    const a = (mix('a') * Math.PI) / 180;
    const r = mix('r') * (portrait ? 1.42 : 1);
    const h = mix('h') * (portrait ? 1.12 : 1);
    // On phones the card covers the lower half, so wide shots aim lower and lift the mandap up the frame
    const ty = mix('ty') - (portrait ? 1.3 * clamp01(r / 15) : 0);
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    camera.position.set(Math.sin(a) * r + Math.cos(a) * pointer.x * 0.9, h + pointer.y * 0.5, Math.cos(a) * r - Math.sin(a) * pointer.x * 0.9);
    camera.lookAt(0, ty, 0);
    const fov = mix('fov') + (portrait ? 10 : 0);
    if (Math.abs(camera.fov - fov) > 0.001) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
      updateScales();
    }
  }

  // Each function's own scroll-driven moment, measured by L: -1 as it opens, 0 at its centre, 1 as it hands over.
  function update(dt: number) {
    const n = applyTheme(progress);
    const { ch, L } = chapterLocal(progress);
    placeCamera(progress);

    if (high || frameNo % 2 === 0) flowers.sway(time);
    mandap.curtains.forEach((c, i) => { c.rotation.x = Math.sin(time * 0.7 + i * 1.3) * 0.03; });
    for (const g of [flames, halos, fairy, chandGlow]) g.material.uniforms.uTime.value = time;
    stars.material.uniforms.uTime.value = time;

    // Haldi: turmeric clouds burst up and drift away
    powder.update(ch === 0 ? clamp01((L + 0.75) / 1.5) : 0, ch === 0 ? 1 : 0, time);
    // Sangeet: fairy lights switch on string by string, stage beams sweep with the scroll
    fairy.material.uniforms.uReveal.value = ch < 2 ? 0 : ch === 2 ? clamp01((L + 0.75) / 0.8) : 1;
    beams.update(time, n.beams, ch === 2 ? L : 0);
    // Pheras: the fire swells as the rounds begin, then petals shower down after the seventh
    fire.update(time, dt, n.fire * (ch === 3 ? 0.5 + 0.5 * clamp01((L + 0.7) / 0.7) : 1));
    petals.update(time, dt, [0.55, 0.55, 0.35, 0.35 + 0.65 * band(0.45, 0.85, L), 0.6][ch]);

    const pose: CouplePose =
      ch < 2 ? { show: 0, mode: 'dance', t: 0, turn: 0, time }
      : ch === 2 ? { show: band(-0.8, -0.55, L), mode: 'dance', t: clamp01((L + 0.6) / 1.5), turn: 0, time }
      : ch === 3 ? { show: 1, mode: 'pheras', t: pheraPhase(L), turn: 0, time }
      : { show: 1, mode: 'entry', t: clamp01((L + 0.85) / 0.65), turn: clamp01((L + 0.2) / 0.25), time };
    couple.update(pose);

    // Reception: fountains erupt as the couple passes, the chandelier comes up, then fireworks for the finale
    const zc = ch === 4 ? entryZ(pose.t) : 99;
    fountains.update(time, FOUNTAINS.map((f) => band(f.z + 1.8, f.z - 0.2, zc)));
    fireworks.update(time, ch === 4 ? band(0.15, 0.45, L) : 0);
    if (ch === 4) {
      const k = 0.35 + 0.65 * clamp01((L + 0.25) / 0.4);
      mandap.crystalMat.emissiveIntensity *= k;
      mandap.chandLight.intensity *= k;
      chandGlow.material.uniforms.uOpacity.value *= k;
    }
  }

  const pheraPhase = (L: number) => clamp01((L + 0.6) / 1.2);

  function render() {
    if (lost || warming) return;
    renderer.render(scene, camera);
    if (!ready && !renderer.getContext().isContextLost()) {
      ready = true;
      opts.onReady?.();
    }
  }

  function emit() {
    if (!opts.onFrame) return;
    for (let i = 0; i < labelKeys.length; i++) {
      proj.copy(anchors[labelKeys[i]]).project(camera);
      const l = labels[i];
      l.on = proj.z < 1 && Math.abs(proj.x) < 0.92 && Math.abs(proj.y) < 0.9;
      l.x = (proj.x * 0.5 + 0.5) * width;
      l.y = (-proj.y * 0.5 + 0.5) * height;
    }
    const { ch, L } = chapterLocal(progress);
    const phera = ch < 3 ? 1 : ch > 3 ? 7 : Math.min(7, Math.floor(pheraPhase(L) * 7) + 1);
    opts.onFrame({ progress, chapter: ch, phera, labels });
  }

  // Adaptive resolution: if the device cannot keep up (slow frames for about a second), render fewer pixels,
  // down to 75%; step back up when there is headroom. Fast devices never leave full resolution.
  let frameAvg = 16;
  let prScale = 1;
  let sinceAdjust = 0;
  function adapt(ms: number) {
    frameAvg += (Math.min(ms, 100) - frameAvg) * 0.05;
    if (++sinceAdjust < 60) return;
    let next = prScale;
    if (frameAvg > 22 && prScale > 0.75) next = Math.max(0.75, prScale - 0.1);
    else if (frameAvg < 14 && prScale < 1) next = Math.min(1, prScale + 0.05);
    if (next !== prScale) {
      prScale = next;
      renderer.setPixelRatio(basePR * prScale);
      resize();
      sinceAdjust = 0;
    }
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    adapt(now - last);
    last = now;
    time += dt;
    frameNo++;
    progress += (target - progress) * (1 - Math.exp(-dt * 3.4));
    if (Math.abs(target - progress) < 0.00005) progress = target;
    update(dt);
    render();
    emit();
  }

  function resize() {
    width = canvas.clientWidth || 1;
    height = canvas.clientHeight || 1;
    portrait = width / height < 0.85;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    updateScales();
  }

  // Sprite sizes are in metres, so their pixel scale follows the viewport height and the zoom (field of view).
  function updateScales() {
    const scale = (height * renderer.getPixelRatio()) / (2 * Math.tan((camera.fov * Math.PI) / 360));
    const maxSize = 30 * renderer.getPixelRatio();
    for (const g of [flames, halos, fairy, chandGlow]) {
      g.material.uniforms.uScale.value = scale;
      g.material.uniforms.uMaxSize.value = maxSize;
    }
    stars.material.uniforms.uScale.value = scale;
    for (const m of [powder.material, fountains.material, fireworks.material]) {
      m.uniforms.uScale.value = scale;
      m.uniforms.uMaxSize.value = 120 * renderer.getPixelRatio();
    }
    fire.group.traverse((o) => {
      const mat = (o as Mesh).material as { uniforms?: Record<string, { value: unknown }> } | undefined;
      if (mat?.uniforms?.uScale) mat.uniforms.uScale.value = scale;
    });
  }

  resize();
  update(0);

  // Warm-up, before the visitor reaches the section: compile every shader of every function now, including
  // objects that only appear later (the couple, fireworks, beams), in parallel where the browser supports it.
  // Without this, shaders compiled mid-scroll and froze the page for seconds. The poster shows until it is done.
  // Shaders are queued in small batches, one batch per idle moment, and nothing waits on the driver in between:
  // queuing them all at once (compileAsync) made the page wait ~2 s for the whole queue in one go.
  const idle = (fn: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(() => fn(), { timeout: 300 }) : setTimeout(fn, 32));
  const drawables: Object3D[] = [];
  scene.traverse((o) => { if ((o as Mesh).material) drawables.push(o); });
  const BATCH = 6;
  let at = 0;
  const finish = () => {
    // Build the other functions' reflection maps one at a time, then allow drawing.
    let i = 1;
    const nextEnv = () => {
      if (lost) return;
      if (i < CHAPTER_AT.length) { envFor(i++); idle(nextEnv); return; }
      warming = false;
      if (!running) { update(0); render(); emit(); }
    };
    idle(nextEnv);
  };
  const compileNext = () => {
    if (lost) return;
    if (at >= drawables.length) { idle(finish); return; }
    const batch = drawables.slice(at, at += BATCH);
    // compile() only needs traverse/traverseVisible from the object it compiles; lights, fog and the
    // environment come from the real scene (third argument), so the programs match what render() will use.
    const part = { traverse: (cb: (o: Object3D) => void) => batch.forEach(cb), traverseVisible: () => {} } as unknown as Object3D;
    try { renderer.compile(part, camera, scene); } catch { /* compiled on first draw instead */ }
    idle(compileNext);
  };
  idle(compileNext);

  return {
    setTarget(p) { target = clamp01(p); },
    jumpTo(p) { target = progress = clamp01(p); },
    setPointer(x, y) { pointer.tx = x; pointer.ty = y; },
    resize() { resize(); if (!running) { update(0); render(); emit(); } },
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    renderOnce() {
      progress = target;
      update(0.016);
      render();
      emit();
    },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      canvas.removeEventListener('webglcontextlost', onLost);
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
