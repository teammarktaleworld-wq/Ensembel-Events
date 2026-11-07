import gsap from 'gsap';
import type { MediaItem } from '../data/media';
import { app, lockScroll } from './state';
import { suspend } from './video';

const root = () => document.getElementById('lightbox');
let items: MediaItem[] = [];
let index = 0;
let origin: HTMLElement | null = null;
let returnFocus: HTMLElement | null = null;

function render(dir = 0) {
  const lb = root()!;
  const box = lb.querySelector<HTMLElement>('.lb-media')!;
  const cap = lb.querySelector<HTMLElement>('.lb-cap')!;
  const count = lb.querySelector<HTMLElement>('.lb-count')!;
  const m = items[index];
  let el: HTMLImageElement | HTMLVideoElement;
  if (m.type === 'video') {
    const v = document.createElement('video');
    v.src = m.full || m.src;
    v.poster = m.thumb;
    v.controls = true;
    v.autoplay = true;
    v.playsInline = true;
    v.setAttribute('aria-label', m.alt);
    el = v;
  } else {
    const img = new Image(m.w, m.h);
    img.alt = m.alt;
    img.src = m.thumb;
    const full = new Image();
    full.onload = () => { if (img.isConnected) img.src = m.src; };
    full.src = m.src;
    el = img;
  }
  box.replaceChildren(el);
  cap.textContent = m.caption;
  count.textContent = `${index + 1} / ${items.length}`;
  const multi = items.length > 1;
  lb.querySelectorAll<HTMLElement>('.lb-prev, .lb-next').forEach((b) => (b.hidden = !multi));
  if (dir && app.motion) gsap.fromTo(box, { x: dir * 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
}

function go(step: number) {
  if (items.length < 2) return;
  index = (index + step + items.length) % items.length;
  render(step);
}

export function openLightbox(list: MediaItem[], start: number, from?: HTMLElement) {
  const lb = root();
  if (!lb || !list.length) return;
  items = list;
  index = start;
  origin = from || null;
  returnFocus = (document.activeElement as HTMLElement) || null;
  lb.hidden = false;
  lockScroll(true);
  suspend(true);
  render();
  lb.querySelector<HTMLElement>('.lb-close')?.focus();

  if (!app.motion) return;
  gsap.fromTo(lb.querySelector('.lb-scrim'), { opacity: 0 }, { opacity: 1, duration: 0.4 });
  gsap.fromTo(lb.querySelectorAll('.lb-btn, .lb-count, .lb-cap'), { opacity: 0 }, { opacity: 1, duration: 0.4, delay: 0.25 });
  const fig = lb.querySelector<HTMLElement>('.lb-media')!;
  if (origin) {
    // Grow the media out of the clicked thumbnail.
    const a = origin.getBoundingClientRect();
    const b = fig.getBoundingClientRect();
    gsap.fromTo(fig,
      { x: a.left + a.width / 2 - (b.left + b.width / 2), y: a.top + a.height / 2 - (b.top + b.height / 2), scale: Math.max(0.15, a.width / Math.max(b.width, 1)), opacity: 0.6 },
      { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.7, ease: 'expo.out' });
  } else {
    gsap.fromTo(fig, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out' });
  }
}

export function closeLightbox() {
  const lb = root();
  if (!lb || lb.hidden) return;
  const done = () => {
    lb.hidden = true;
    lb.querySelector('.lb-media')!.replaceChildren();
    lockScroll(false);
    suspend(false);
    returnFocus?.focus({ preventScroll: true });
  };
  lb.querySelector('video')?.pause();
  if (!app.motion) return done();
  gsap.to(lb.querySelector('.lb-media'), { scale: 0.94, opacity: 0, duration: 0.3, ease: 'power2.in' });
  gsap.to(lb.querySelectorAll('.lb-scrim, .lb-btn, .lb-count, .lb-cap'), { opacity: 0, duration: 0.3, onComplete: done });
}

export function initLightbox() {
  const lb = root();
  if (!lb) return;
  lb.querySelectorAll('[data-lb-close], .lb-close').forEach((b) => b.addEventListener('click', closeLightbox));
  lb.querySelector('.lb-prev')?.addEventListener('click', () => go(-1));
  lb.querySelector('.lb-next')?.addEventListener('click', () => go(1));

  window.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'Tab') {
      const f = Array.from(lb.querySelectorAll<HTMLElement>('button:not([hidden]), video[controls]'));
      const i = f.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1]?.focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0]?.focus(); }
    }
  });

  let startX = 0;
  lb.addEventListener('pointerdown', (e) => { startX = e.clientX; });
  lb.addEventListener('pointerup', (e) => {
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 60 && e.pointerType !== 'mouse') go(dx < 0 ? 1 : -1);
  });
}
