import { Renderer, Camera, Transform, Polyline, Vec3, Color } from 'ogl';

// Gold threads that braid around one flowing 3D curve. The curve drifts with
// scroll, bends towards the pointer and loosens briefly when scrolling fast.

const fragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float along = smoothstep(0.0, 0.22, vUv.y) * smoothstep(1.0, 0.78, vUv.y);
    float edge = smoothstep(0.0, 0.55, 1.0 - abs(vUv.x * 2.0 - 1.0));
    float a = uOpacity * along * edge;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

type Strand = { line: Polyline; pts: Vec3[]; angle: number; radius: number; speed: number; tone: number; ink: boolean; color: Color };

// tone > 0 lightens the accent towards white, < 0 darkens it; ink strands stay neutral.
const STRANDS = [
  { tone: 0.45, opacity: 0.1, thickness: 90, radius: 0 },
  { tone: 0, opacity: 0.9, thickness: 2.4, radius: 0.05 },
  { tone: 0.4, opacity: 0.85, thickness: 1.8, radius: 0.32 },
  { tone: -0.3, opacity: 0.6, thickness: 1.5, radius: 0.48 },
  { tone: 0, opacity: 0.65, thickness: 1.3, radius: 0.62 },
  { ink: true, tone: 0, opacity: 0.18, thickness: 1.1, radius: 0.4 },
  { tone: 0.4, opacity: 0.7, thickness: 1.6, radius: 0.75 },
  { tone: -0.3, opacity: 0.45, thickness: 1.1, radius: 0.9 },
  { ink: true, tone: 0, opacity: 0.1, thickness: 1, radius: 1.05 },
];

const toRGB = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

export function initThread(canvas: HTMLCanvasElement, palette: Record<string, string>): () => void {
  const nav = navigator as Navigator & { deviceMemory?: number };
  if ((nav.hardwareConcurrency || 8) < 4 || (nav.deviceMemory || 8) < 4) return () => {};

  let renderer: Renderer;
  try {
    renderer = new Renderer({ canvas, dpr: Math.min(window.devicePixelRatio || 1, 1.5), alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
    if (!renderer.gl) return () => {};
  } catch {
    return () => {};
  }
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);

  const small = innerWidth < 768;
  const count = small ? 90 : 150;
  const camera = new Camera(gl, { fov: 35, near: 0.1, far: 100 });
  camera.position.set(0, 0, 12);
  const scene = new Transform();
  const group = new Transform();
  group.setParent(scene);

  const strands: Strand[] = (small ? STRANDS.slice(0, 6) : STRANDS).map((s, i) => {
    const pts = Array.from({ length: count }, () => new Vec3());
    const color = new Color(s.ink ? '#141416' : palette.all);
    const line = new Polyline(gl, {
      points: pts,
      fragment,
      uniforms: { uColor: { value: color }, uOpacity: { value: s.opacity }, uThickness: { value: small ? s.thickness * 0.8 : s.thickness } },
    });
    const p = line.program;
    p.transparent = true;
    p.depthTest = false;
    p.depthWrite = false;
    p.cullFace = null as unknown as number;
    p.setBlendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    line.mesh.setParent(group);
    return { line, pts, angle: (i / STRANDS.length) * Math.PI * 2, radius: s.radius, speed: 0.25 + (i % 3) * 0.08, tone: s.tone, ink: !!s.ink, color };
  });

  let viewH = 1;
  let viewW = 1;
  const resize = () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.perspective({ aspect: innerWidth / innerHeight });
    viewH = 2 * Math.tan((35 * Math.PI) / 360) * camera.position.z;
    viewW = viewH * (innerWidth / innerHeight);
    strands.forEach((s) => s.line.resize());
  };
  let resizeT = 0;
  const onResize = () => { clearTimeout(resizeT); resizeT = window.setTimeout(resize, 120); };
  resize();

  const pointer = { tx: 0, ty: 0, x: 0, y: 0, power: 0, target: 0 };
  const onPointer = (e: PointerEvent) => {
    pointer.tx = (e.clientX / innerWidth - 0.5) * viewW;
    pointer.ty = -(e.clientY / innerHeight - 0.5) * viewH;
    pointer.target = 1;
  };
  const onLeave = () => { pointer.target = 0; };

  // Accent follows the chosen event category, easing between palettes.
  const accent = toRGB(palette[document.documentElement.dataset.cat || 'all'] || palette.all);
  let target = accent.slice();
  const onCat = (e: Event) => { target = toRGB(palette[(e as CustomEvent<string>).detail] || palette.all); };
  window.addEventListener('ee:cat', onCat);

  let lastScroll = scrollY;
  let velocity = 0;
  let progress = 0;
  let raf = 0;
  let last = performance.now();
  let time = 0;
  let shown = false;

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    time += dt;

    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const target = scrollY / max;
    progress += (target - progress) * 0.08;
    velocity += (Math.min(Math.abs(scrollY - lastScroll) / 60, 1) - velocity) * 0.06;
    lastScroll = scrollY;
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    pointer.power += (pointer.target - pointer.power) * 0.04;

    const phase = progress * 9;
    const baseY = viewH * (-0.12 + 0.2 * Math.sin(progress * Math.PI * 3 + 0.4));
    const amp = viewH * 0.13;
    const sigma = viewW * 0.16;

    group.rotation.z = -0.16 + Math.sin(progress * Math.PI * 2) * 0.2;
    group.rotation.x = Math.sin(progress * Math.PI * 1.5) * 0.35;
    group.rotation.y = Math.sin(progress * Math.PI) * 0.45 + (pointer.x / viewW) * 0.15 * pointer.power;

    for (let k = 0; k < 3; k++) accent[k] += (target[k] - accent[k]) * 0.05;

    for (const s of strands) {
      if (!s.ink) {
        const t = s.tone;
        s.color.set(...(accent.map((c) => (t >= 0 ? c + (1 - c) * t : c * (1 + t))) as [number, number, number]));
      }
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        const x = (t - 0.5) * viewW * 1.3;
        const nx = x / viewW;
        let y = baseY + amp * (Math.sin(nx * 3.2 + time * 0.3 + phase) * 0.7 + Math.sin(nx * 6.3 - time * 0.2 + phase * 0.6) * 0.3);
        let z = Math.sin(nx * 2.4 + time * 0.22 + phase * 0.8) * 1.4;

        const dx = x - pointer.x;
        y += (pointer.y - y) * Math.exp(-(dx * dx) / (sigma * sigma)) * 0.5 * pointer.power;

        const spread = s.radius * (0.2 + 0.8 * Math.sin(Math.PI * t)) * (1 + velocity * 1.4);
        const ang = s.angle + nx * 5 + time * s.speed + phase * 0.5;
        y += Math.cos(ang) * spread;
        z += Math.sin(ang) * spread;
        s.pts[i].set(x, y, z);
      }
      s.line.updateGeometry();
    }

    renderer.render({ scene, camera });
    if (!shown) { shown = true; document.documentElement.classList.add('thread-on'); }
  };

  const onVisibility = () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); }
  };

  window.addEventListener('resize', onResize);
  window.addEventListener('pointermove', onPointer, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  document.addEventListener('visibilitychange', onVisibility);
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('ee:cat', onCat);
    window.removeEventListener('pointermove', onPointer);
    document.documentElement.removeEventListener('pointerleave', onLeave);
    document.removeEventListener('visibilitychange', onVisibility);
    document.documentElement.classList.remove('thread-on');
  };
}
