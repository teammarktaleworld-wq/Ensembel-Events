import gsap from 'gsap';
import { media, byId, type MediaItem, type Category } from '../data/media';
import { wall } from '../data/site';
import { app } from './state';
import { autoplay, isPaused } from './video';
import { openLightbox } from './lightbox';

const sizes = '(min-width: 1024px) 34vw, (min-width: 768px) 33vw, 50vw';
const play = '<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1l7 4-7 4z" fill="currentColor"/></svg>';

function mediaEl(m: MediaItem) {
  if (m.type === 'video') {
    const v = document.createElement('video');
    Object.assign(v, { muted: true, loop: true, playsInline: true, preload: 'none', poster: m.thumb });
    v.className = 'media-fit';
    v.dataset.src = m.src;
    v.setAttribute('aria-hidden', 'true');
    autoplay(v);
    return v;
  }
  const img = new Image(m.w, m.h);
  img.className = 'media-fit';
  img.alt = '';
  img.decoding = 'async';
  img.srcset = `${m.thumb} 640w, ${m.src} 1280w`;
  img.sizes = sizes;
  img.src = m.thumb;
  return img;
}

let tiles: HTMLButtonElement[] = [];
let order: number[] = [];

export function initWall() {
  const root = document.getElementById('wall');
  if (!root) return;
  tiles = Array.from(root.querySelectorAll<HTMLButtonElement>('.tile'));
  const current = tiles.map((t) => t.dataset.id!);

  // Stagger from the centre of the wall outwards.
  const textBox = root.querySelector('.tile-text')!.getBoundingClientRect();
  const cx = textBox.left + textBox.width / 2;
  const cy = textBox.top + textBox.height / 2;
  const dist = tiles.map((t) => { const r = t.getBoundingClientRect(); return Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy); });
  order = dist.map((d) => dist.filter((x) => x < d).length);

  const swap = (tile: HTMLButtonElement, m: MediaItem, delay: number) => {
    const inner = tile.querySelector<HTMLElement>('.tile-inner')!;
    const flash = tile.querySelector('.tile-flash');
    const apply = () => {
      inner.querySelector('video')?.pause();
      inner.replaceChildren(mediaEl(m));
      tile.dataset.id = m.id;
      tile.setAttribute('aria-label', `View: ${m.caption}`);
      tile.querySelector('.tile-cap')!.textContent = m.caption;
      tile.querySelector<HTMLElement>('.tile-badge')!.hidden = m.type !== 'video';
    };
    if (!app.motion) return apply();
    gsap.timeline({ delay })
      .to(inner, { rotationX: -88, opacity: 0.4, duration: 0.3, ease: 'power2.in' })
      .add(apply)
      .fromTo(inner, { rotationX: 88, opacity: 0.4 }, { rotationX: 0, opacity: 1, duration: 0.6, ease: 'power3.out' })
      .fromTo(flash, { opacity: 0.6 }, { opacity: 0, duration: 0.7, ease: 'power2.out' }, '<');
  };

  window.addEventListener('ee:cat', (e) => {
    const ids = wall[(e as CustomEvent<Category>).detail];
    tiles.forEach((t, i) => {
      if (current[i] === ids[i]) return;
      current[i] = ids[i];
      swap(t, byId[ids[i]], order[i] * 0.07);
    });
  });

  tiles.forEach((t, i) => t.addEventListener('click', () => openLightbox(current.map((id) => byId[id]), i, t)));

  // Idle: every few seconds one visible photo tile changes, like a live LED wall.
  let inView = true;
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(root);
  if (app.motion) {
    setInterval(() => {
      if (!inView || document.hidden || isPaused()) return;
      const cat = app.cat;
      const pool = media.filter((m) => m.type === 'image' && (cat === 'all' || m.cats.includes(cat)) && !current.includes(m.id));
      const slots = tiles.map((t, i) => i).filter((i) => byId[current[i]].type === 'image' && tiles[i].offsetParent !== null);
      if (!pool.length || !slots.length) return;
      const i = slots[Math.floor(Math.random() * slots.length)];
      const m = pool[Math.floor(Math.random() * pool.length)];
      current[i] = m.id;
      swap(tiles[i], m, 0);
    }, 3200);
  }
}

// Power-on sequence for the wall: tiles light up from the centre outwards.
export function bootWall(tl: gsap.core.Timeline, at: number) {
  if (!tiles.length) return;
  tiles.forEach((t, i) => {
    const d = at + order[i] * 0.07;
    tl.fromTo(t, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.9, ease: 'expo.out' }, d);
    tl.fromTo(t.querySelector('.tile-flash'), { opacity: 0.85 }, { opacity: 0, duration: 0.9, ease: 'power2.out' }, d + 0.05);
  });
  tl.fromTo('.tile-text', { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.9, ease: 'expo.out' }, at);
}
