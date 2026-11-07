import type Lenis from 'lenis';
import type { Category } from '../data/media';

// Shared app state: smooth-scroll instance and the active event category.
export const app = { lenis: null as Lenis | null, motion: false, cat: 'all' as Category };

export const palette: Record<Category, string> = { all: '#e3a81c', conf: '#3b7bf0', awards: '#e5484d', launch: '#12a57f', live: '#8f63f5' };

export function setCat(cat: Category) {
  if (cat === app.cat) return;
  app.cat = cat;
  document.documentElement.dataset.cat = cat;
  document.querySelectorAll<HTMLButtonElement>('[data-cat-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === cat)));
  window.dispatchEvent(new CustomEvent('ee:cat', { detail: cat }));
}

export function lockScroll(lock: boolean) {
  if (app.lenis) lock ? app.lenis.stop() : app.lenis.start();
  else document.documentElement.style.overflow = lock ? 'hidden' : '';
}

export function initCategoryButtons() {
  document.querySelectorAll<HTMLButtonElement>('[data-cat-btn]').forEach((b) => b.addEventListener('click', () => setCat(b.dataset.cat as Category)));
}
