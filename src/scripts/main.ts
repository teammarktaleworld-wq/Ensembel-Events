import { createLenis } from './lenis';
import { app, initCategoryButtons, palette } from './state';
import { autoplayAll } from './video';
import { initUI } from './ui';
import { initLightbox } from './lightbox';
import { initWall } from './wall';
import { initGallery } from './gallery';
import { initPanels, initShowreel } from './sections';
import { initAnimations } from './animations';
import { initWeddings } from './wedding';

declare global { interface Window { __eeReady?: boolean } }

export function initApp() {
  window.__eeReady = true;
  const root = document.documentElement;
  // A slow first load can trip the no-motion safety net in Base.astro; once the app runs, motion is safe again.
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) root.classList.add('js-motion');
  app.motion = root.classList.contains('js-motion');
  app.lenis = app.motion ? createLenis() : null;

  initLightbox();
  initWall();
  initGallery();
  initPanels();
  initShowreel();
  initCategoryButtons();
  initUI();
  autoplayAll();
  if (app.motion) initAnimations();
  initWeddings();

  // The WebGL thread loads after first paint; the static SVG curves stay as the fallback.
  const canvas = document.getElementById('thread-canvas') as HTMLCanvasElement | null;
  if (!canvas || !app.motion) return;
  const start = () => import('./shader').then((m) => m.initThread(canvas, palette)).catch(() => {});
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 2000 }) : setTimeout(start, 600));
  document.readyState === 'complete' ? idle() : window.addEventListener('load', idle, { once: true });
}
