import { createLenis } from './lenis';
import { app, initCategoryButtons, palette } from './state';
import { autoplayAll } from './video';
import { initUI } from './ui';
import { initLightbox } from './lightbox';
import { initWall } from './wall';
import { initGallery } from './gallery';
import { initPanels, initShowreel } from './sections';
import { initAnimations } from './animations';

declare global { interface Window { __eeReady?: boolean } }

export function initApp() {
  window.__eeReady = true;
  app.motion = document.documentElement.classList.contains('js-motion');
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

  // The WebGL thread loads after first paint; the static SVG curves stay as the fallback.
  const canvas = document.getElementById('thread-canvas') as HTMLCanvasElement | null;
  if (!canvas || !app.motion) return;
  const start = () => import('./shader').then((m) => m.initThread(canvas, palette)).catch(() => {});
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 2000 }) : setTimeout(start, 600));
  document.readyState === 'complete' ? idle() : window.addEventListener('load', idle, { once: true });
}
