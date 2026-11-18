import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { app } from '../state';
import { wedding } from '../../data/site';
import { CHAPTER_AT, chapterAt, chapterBlend, chapterLocal, MIDS, PALETTE } from './chapters';
import { initCouple } from './couple';
import type { FrameInfo, WeddingScene } from './scene';

gsap.registerPlugin(ScrollTrigger);

const hexRGB = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const RGB = PALETTE.map((p) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, hexRGB(v)])) as Record<string, number[]>);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

// Page turn between functions: a disc in the next function's colours grows over the scene (cover),
// then opens from the centre onto the re-dressed scene (reveal). The journey also opens this way into Haldi.
const PORTAL = 0.065;
function portalAt(p: number) {
  if (p < PORTAL) return { page: 0, cover: 1, reveal: smooth(0.12, 1, p / PORTAL) };
  for (let j = 0; j < MIDS.length; j++) {
    const u = (p - MIDS[j]) / PORTAL;
    if (u > -1 && u < 1) return { page: j + 1, cover: smooth(-1, -0.25, u), reveal: smooth(0.25, 1, u) };
  }
  return null;
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function pickQuality(): 'high' | 'low' {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const small = Math.min(innerWidth, innerHeight) < 700 || matchMedia('(pointer: coarse)').matches;
  return !small && (nav.hardwareConcurrency || 8) >= 6 && (nav.deviceMemory || 8) >= 6 ? 'high' : 'low';
}

export function initWeddings() {
  const root = document.getElementById('weddings');
  if (!root) return;
  const journey = root.querySelector<HTMLElement>('.wd-journey')!;
  const stage = root.querySelector<HTMLElement>('.wd-stage')!;
  const view = root.querySelector<HTMLElement>('.wd-view')!;
  let canvas = root.querySelector<HTMLCanvasElement>('.wd-canvas')!;
  const cards = Array.from(root.querySelectorAll<HTMLElement>('.wd-card'));
  const steps = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-goto]'));
  const rail = root.querySelector<HTMLElement>('.wd-rail');
  const labels = Array.from(root.querySelectorAll<HTMLElement>('.wd-label'));
  const wash = root.querySelector<HTMLElement>('.wd-wash');
  const portal = root.querySelector<HTMLElement>('.wd-portal');
  const pages = Array.from(root.querySelectorAll<HTMLElement>('.wd-portal-page'));
  const mandala = root.querySelector<SVGElement>('.wd-portal-mandala');
  const henna = root.querySelector<HTMLElement>('.wd-henna');
  const dots = Array.from(root.querySelectorAll<HTMLElement>('.wd-phera-dots i'));
  const fill = root.querySelector<HTMLElement>('.wd-progress span');
  const pheraEl = root.querySelector<HTMLElement>('[data-phera]');
  const vowEl = root.querySelector<HTMLElement>('[data-vow]');
  const motion = app.motion;
  if (motion) initCouple();

  let scene: WeddingScene | null = null;
  let chapter = -1;
  let phera = 1;

  const setChapter = (i: number) => {
    if (i === chapter) return;
    chapter = i;
    cards.forEach((c, k) => c.classList.toggle('is-active', k === i));
    steps.forEach((b, k) => b.setAttribute('aria-current', k === i ? 'step' : 'false'));
    root.dataset.chapter = String(i);
    // Keep the active function in view when the rail scrolls sideways on phones
    const list = steps[i]?.closest('ol');
    if (list && list.scrollWidth > list.clientWidth) {
      list.scrollTo({ left: steps[i].offsetLeft - (list.clientWidth - steps[i].offsetWidth) / 2, behavior: motion ? 'smooth' : 'auto' });
    }
  };

  // Colours follow the scroll: each function's palette cross-fades into the next.
  let lastPaint = -1;
  const paint = (p: number) => {
    if (Math.abs(p - lastPaint) < 0.0004) return;
    lastPaint = p;
    const { a, b, t } = chapterBlend(p);
    for (const key of Object.keys(RGB[0])) {
      const c = RGB[a][key].map((v, k) => Math.round(v + (RGB[b][key][k] - v) * t));
      root.style.setProperty(`--wd-${key}`, `rgb(${c.join(' ')})`);
    }
    if (fill) fill.style.transform = `scaleX(${p.toFixed(4)})`;
    root.classList.toggle('wd-started', p > 0.02);
    if (!motion) return;
    const nearest = Math.min(...CHAPTER_AT.map((c) => Math.abs(p - c))) / 0.1;
    if (wash) wash.style.opacity = (0.12 + 0.42 * clamp01(nearest) ** 1.4).toFixed(3);
    turnPage(p);
    // Mehendi: henna vines draw themselves in the corners
    const { ch, L } = chapterLocal(p);
    const draw = ch === 1 ? clamp01((L + 0.72) / 0.8) : 0;
    if (henna) {
      henna.style.setProperty('--henna', draw.toFixed(3));
      henna.style.visibility = draw > 0.001 ? 'visible' : 'hidden';
    }
  };

  let portalPage = -1;
  let portalOn = false;
  const turnPage = (p: number) => {
    const st = portalAt(p);
    let ui = 1;
    if (!st || !portal) {
      if (portalOn && portal) portal.style.visibility = 'hidden';
      portalOn = false;
    } else {
      if (!portalOn) portal.style.visibility = 'visible';
      portalOn = true;
      if (st.page !== portalPage) {
        portalPage = st.page;
        for (const [k, v] of Object.entries(PALETTE[st.page])) portal.style.setProperty(`--pt-${k}`, v);
        pages.forEach((el, i) => el.classList.toggle('is-on', i === st.page));
      }
      portal.style.setProperty('--disc', st.cover.toFixed(4));
      portal.style.setProperty('--hole', (st.reveal ** 1.6 * 74).toFixed(2));
      const opening = st.reveal > 0;
      const zoom = opening ? 1 + 0.9 * st.reveal ** 1.5 : 0.72 + 0.28 * easeOut(st.cover);
      const fade = opening ? 1 - smooth(0, 0.7, st.reveal) : smooth(0.45, 0.95, st.cover);
      const page = pages[st.page];
      if (page) {
        page.style.transform = `translate(-50%, -50%) scale(${zoom.toFixed(3)})`;
        page.style.opacity = fade.toFixed(3);
      }
      if (mandala) mandala.style.transform = `translate(-50%, -50%) rotate(${(p * 900).toFixed(1)}deg) scale(${(0.7 + 0.3 * st.cover + 0.7 * st.reveal).toFixed(3)})`;
      // The card, menu and labels step aside while the page turns
      ui = opening ? smooth(0.45, 1, st.reveal) : 1 - smooth(0.25, 0.85, st.cover);
    }
    stage.style.setProperty('--wd-ui', ui.toFixed(3));
  };

  const setPhera = (n: number) => {
    if (n === phera || !pheraEl || !vowEl) return;
    phera = n;
    pheraEl.textContent = `Phera ${n} of 7`;
    vowEl.textContent = wedding.vows[n - 1];
    dots.forEach((d, k) => d.classList.toggle('is-on', k < n));
  };

  const labelIndex = new Map<string, number>();
  const onFrame = (f: FrameInfo) => {
    setChapter(f.chapter);
    paint(f.progress);
    setPhera(f.phera);
    if (!labelIndex.size) f.labels.forEach((l, i) => labelIndex.set(l.key, i));
    const settled = Math.abs(f.progress - CHAPTER_AT[f.chapter]) < 0.045 || !motion;
    // Labels give way to the chapter card and the rail rather than sliding under them.
    const vr = view.getBoundingClientRect();
    const blockers = [cards[f.chapter], rail].map((el) => el?.getBoundingClientRect()).filter((r): r is DOMRect => !!r && r.width > 0);
    const blocked = (x: number, y: number) => blockers.some((r) => x > r.left - 190 && x < r.right + 12 && y > r.top - 28 && y < r.bottom + 28);
    for (const el of labels) {
      const l = f.labels[labelIndex.get(el.dataset.anchor || '') ?? -1];
      const fits = !!l && l.x > 8 && l.x < vr.width - 190;
      const on = !!l && l.on && fits && settled && Number(el.dataset.chapter) === f.chapter && !blocked(vr.left + l.x, vr.top + l.y);
      el.classList.toggle('is-on', on);
      if (l) el.style.transform = `translate3d(${l.x.toFixed(1)}px, ${l.y.toFixed(1)}px, 0)`;
    }
  };

  // Scroll drives the journey, even before (or without) the 3D scene.
  let journeyST: ScrollTrigger | null = null;
  if (motion) {
    journeyST = ScrollTrigger.create({
      trigger: journey, start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => {
        if (scene) scene.setTarget(self.progress);
        else {
          setChapter(chapterAt(self.progress));
          paint(self.progress);
        }
      },
    });
    gsap.fromTo(view, { scale: 0.9, borderRadius: 28 }, {
      scale: 1, borderRadius: 0, ease: 'none',
      scrollTrigger: { trigger: journey, start: 'top 85%', end: 'top top', scrub: true },
    });
    paint(0);
  } else {
    setChapter(3);
    paint(CHAPTER_AT[3]);
  }

  steps.forEach((b, i) => b.addEventListener('click', () => {
    if (!motion) {
      setChapter(i);
      paint(CHAPTER_AT[i]);
      if (scene) { scene.jumpTo(CHAPTER_AT[i]); scene.renderOnce(); }
      return;
    }
    const top = journey.getBoundingClientRect().top + window.scrollY;
    const y = top + CHAPTER_AT[i] * (journey.offsetHeight - window.innerHeight);
    if (app.lenis) app.lenis.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  }));

  if (!webglAvailable()) {
    root.classList.add('wd-nogl');
    return;
  }

  let visible = false;
  let attempts = 0;
  const sync = () => {
    if (!scene || !motion) return;
    if (visible && !document.hidden) scene.start();
    else scene.stop();
  };
  const giveUp = () => {
    stage.classList.remove('is-ready');
    root.classList.add('wd-nogl');
  };

  // If the GPU drops the context (low memory, driver reset), retry once with the light renderer on a fresh canvas.
  const recover = () => {
    stage.classList.remove('is-ready');
    const old = scene;
    scene = null;
    old?.dispose();
    if (attempts >= 2) return giveUp();
    const fresh = canvas.cloneNode(false) as HTMLCanvasElement;
    canvas.replaceWith(fresh);
    canvas = fresh;
    setTimeout(() => create('low'), 400);
  };

  const create = async (quality: 'high' | 'low') => {
    attempts++;
    try {
      const { createWeddingScene } = await import('./scene');
      scene = createWeddingScene(canvas, {
        quality, onFrame,
        onReady: () => stage.classList.add('is-ready'),
        onLost: () => { console.warn('Wedding scene: WebGL context lost'); recover(); },
      });
    } catch (err) {
      console.warn('Wedding scene unavailable', err);
      return giveUp();
    }
    if (motion) {
      scene.jumpTo(journeyST?.progress ?? 0);
      sync();
    } else {
      scene.jumpTo(CHAPTER_AT[chapter]);
      scene.renderOnce();
    }
  };

  if (motion) {
    new IntersectionObserver(([e]) => {
      // Coming back into view: start where the scroll is rather than replaying every function
      if (e.isIntersecting && !visible) scene?.jumpTo(journeyST?.progress ?? 0);
      visible = e.isIntersecting;
      sync();
    }, { rootMargin: '10% 0px' }).observe(view);
    document.addEventListener('visibilitychange', sync);
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      view.addEventListener('pointermove', (e) => {
        const r = view.getBoundingClientRect();
        scene?.setPointer(((e.clientX - r.left) / r.width - 0.5) * 2, -((e.clientY - r.top) / r.height - 0.5) * 2);
      });
      view.addEventListener('pointerleave', () => scene?.setPointer(0, 0));
    }
  }
  new ResizeObserver(() => scene?.resize()).observe(view);

  // Load three.js only as the section approaches.
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    create(pickQuality());
  }, { rootMargin: '150% 0px' });
  io.observe(journey);
}
