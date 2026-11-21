import gsap from 'gsap';
import { media, byId, type MediaItem, type Category } from '../data/media';
import { wall } from '../data/site';
import { app } from './state';
import { autoplay, isPaused } from './video';
import { openLightbox } from './lightbox';

const sizes = '(min-width: 1024px) 24vw, 50vw';

// Only photos at least 1000px wide go on the wall, so no card looks soft.
const sharp = (m: MediaItem) => m.type === 'video' || m.w >= 1000;

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

export function initWall() {
  const root = document.getElementById('wall');
  if (!root) return;
  tiles = Array.from(root.querySelectorAll<HTMLButtonElement>('.tile'));
  const current = tiles.map((t) => t.dataset.id!);
  // Category slots, in grid order. Wedding cards are fixed and never swapped.
  const catSlots = tiles.map((_, i) => i).filter((i) => !('fixed' in tiles[i].dataset));

  // Hide the page's background threads while the first screen is in view.
  const hero = document.getElementById('top');
  const html = document.documentElement;
  if (hero) {
    // Root = lower 45% of the screen: threads return once the hero's bottom edge rises above it.
    new IntersectionObserver(([e]) => html.classList.toggle('past-hero', !e.isIntersecting), { rootMargin: '-55% 0px 0px 0px' }).observe(hero);
  } else {
    html.classList.add('past-hero');
  }

  const swap = (tile: HTMLButtonElement, m: MediaItem, delay: number) => {
    const inner = tile.querySelector<HTMLElement>('.tile-inner')!;
    const old = Array.from(inner.children) as HTMLElement[];
    const el = mediaEl(m);
    const label = () => {
      tile.dataset.id = m.id;
      tile.setAttribute('aria-label', `View: ${m.caption}`);
      tile.querySelector('.tile-cap')!.textContent = m.caption;
      tile.querySelector<HTMLElement>('.tile-badge')!.hidden = m.type !== 'video';
    };
    const done = () => { old.forEach((o) => { (o as HTMLVideoElement).pause?.(); o.remove(); }); };
    if (!app.motion) { inner.replaceChildren(el); return label(); }
    // Crossfade: the new photo settles in over the old one.
    inner.append(el);
    gsap.timeline({ delay })
      .add(label, 0.2)
      .fromTo(el, { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 1, ease: 'power2.out', clearProps: 'transform', onComplete: done }, 0);
  };

  window.addEventListener('ee:cat', (e) => {
    const ids = wall[(e as CustomEvent<Category>).detail];
    catSlots.forEach((slot, k) => {
      if (!ids[k] || current[slot] === ids[k]) return;
      current[slot] = ids[k];
      swap(tiles[slot], byId[ids[k]], k * 0.06);
    });
  });

  tiles.forEach((t, i) => t.addEventListener('click', () => openLightbox(current.map((id) => byId[id]), i, t)));

  // Idle: every few seconds one visible category photo changes.
  let inView = true;
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(root);
  if (app.motion) {
    setInterval(() => {
      if (!inView || document.hidden || isPaused()) return;
      const cat = app.cat;
      const pool = media.filter((m) => m.type === 'image' && sharp(m) && (cat === 'all' || m.cats.includes(cat)) && !current.includes(m.id));
      const slots = catSlots.filter((i) => byId[current[i]].type === 'image' && tiles[i].offsetParent !== null);
      if (!pool.length || !slots.length) return;
      const i = slots[Math.floor(Math.random() * slots.length)];
      const m = pool[Math.floor(Math.random() * pool.length)];
      current[i] = m.id;
      swap(tiles[i], m, 0);
    }, 3600);
  }
}

// Intro: the centre card appears first, then the photos open outwards from it.
export function bootWall(tl: gsap.core.Timeline, at: number) {
  if (!tiles.length) return;
  const card = document.querySelector('.hero-card');
  if (card) tl.fromTo(card, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', clearProps: 'transform' }, at);
  const c = card?.getBoundingClientRect();
  const dist = tiles.map((t) => {
    if (!c) return 0;
    const r = t.getBoundingClientRect();
    return Math.hypot(r.left + r.width / 2 - (c.left + c.width / 2), r.top + r.height / 2 - (c.top + c.height / 2));
  });
  const rank = dist.map((d) => dist.filter((x) => x < d).length);
  tiles.forEach((t, i) => {
    const d = at + 0.3 + rank[i] * 0.05;
    tl.fromTo(t, { opacity: 0, y: 24, clipPath: 'inset(18% 0% 0% 0% round 14px)' },
      { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 1.1, ease: 'expo.out', clearProps: 'clipPath,transform' }, d);
    const media = t.querySelector('.media-fit');
    if (media) tl.fromTo(media, { scale: 1.12 }, { scale: 1, duration: 1.4, ease: 'expo.out', clearProps: 'transform' }, d);
  });
}
