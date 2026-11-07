import gsap from 'gsap';
import { byId, type Category } from '../data/media';
import { app, setCat } from './state';
import { autoplay } from './video';
import { openLightbox } from './lightbox';

// Services: four panels, one open at a time; opening one re-tints the page.
export function initPanels() {
  const panels = Array.from(document.querySelectorAll<HTMLElement>('.panel'));
  const open = (p: HTMLElement) => {
    panels.forEach((x) => {
      const on = x === p;
      x.classList.toggle('is-open', on);
      x.querySelector('.panel-hit')!.setAttribute('aria-expanded', String(on));
    });
    window.dispatchEvent(new Event('ee:layout'));
  };
  panels.forEach((p) => p.querySelector('.panel-hit')!.addEventListener('click', () => {
    open(p);
    setCat(p.dataset.cat as Category);
  }));
  window.addEventListener('ee:cat', (e) => {
    const p = panels.find((x) => x.dataset.cat === (e as CustomEvent<Category>).detail);
    if (p && !p.classList.contains('is-open')) open(p);
  });
}

// Showreel: tabs swap the screen with a circular wipe from the clicked tab.
export function initShowreel() {
  const screen = document.querySelector<HTMLElement>('.screen');
  if (!screen) return;
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.reel-tab'));
  const caption = document.querySelector<HTMLElement>('.reel-caption')!;
  let currentId = tabs[0]?.dataset.id || '';

  const show = (tab: HTMLButtonElement) => {
    const id = tab.dataset.id!;
    if (id === currentId) return;
    currentId = id;
    const m = byId[id];
    tabs.forEach((t) => t.setAttribute('aria-pressed', String(t === tab)));
    caption.textContent = tab.querySelector('span:last-child')!.textContent;

    const layer = document.createElement('div');
    layer.className = 'screen-layer absolute inset-0';
    const v = document.createElement('video');
    Object.assign(v, { muted: true, loop: true, playsInline: true, preload: 'none', poster: m.thumb });
    v.className = 'media-fit';
    v.dataset.src = m.src;
    v.setAttribute('aria-hidden', 'true');
    layer.append(v);
    const layers = screen.querySelectorAll('.screen-layer');
    layers[layers.length - 1].after(layer);
    autoplay(v);

    const cleanup = () => layers.forEach((l) => { l.querySelector('video')?.pause(); l.remove(); });
    if (!app.motion) return cleanup();
    const s = screen.getBoundingClientRect();
    const t = tab.getBoundingClientRect();
    const x = ((t.left + t.width / 2 - s.left) / s.width) * 100;
    gsap.fromTo(layer, { clipPath: `circle(0% at ${x}% 100%)` }, { clipPath: `circle(150% at ${x}% 100%)`, duration: 1.1, ease: 'power3.inOut', onComplete: cleanup });
    gsap.fromTo(caption, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 0.2 });
  };

  tabs.forEach((t) => t.addEventListener('click', () => { show(t); setCat(t.dataset.cat as Category); }));
  window.addEventListener('ee:cat', (e) => {
    const t = tabs.find((x) => x.dataset.cat === (e as CustomEvent<Category>).detail);
    if (t) show(t);
  });

  document.querySelector('.reel-play')?.addEventListener('click', (e) => {
    const list = tabs.map((t) => byId[t.dataset.id!]);
    openLightbox(list, tabs.findIndex((t) => t.dataset.id === currentId), e.currentTarget as HTMLElement);
  });
}
