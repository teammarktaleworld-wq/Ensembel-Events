import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { byId, type Category } from '../data/media';
import { app } from './state';
import { openLightbox } from './lightbox';

gsap.registerPlugin(Flip);

export function initGallery() {
  const grid = document.querySelector<HTMLElement>('.gallery');
  if (!grid) return;
  const items = Array.from(grid.querySelectorAll<HTMLLIElement>('.g-item'));
  const more = document.querySelector<HTMLButtonElement>('.g-more');
  let expanded = false;

  const visible = () => items.filter((li) => li.offsetParent !== null);

  const apply = (cat: Category, animate: boolean) => {
    const state = animate ? Flip.getState(items) : null;
    items.forEach((li) => li.classList.toggle('is-hidden', cat !== 'all' && !li.dataset.cats!.split(' ').includes(cat)));
    grid.classList.toggle('show-all', expanded || cat !== 'all');
    if (more) more.hidden = expanded || cat !== 'all';
    if (state) {
      Flip.from(state, {
        duration: 0.7, ease: 'power3.inOut', absolute: true, scale: true,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.4 }),
        onComplete: () => window.dispatchEvent(new Event('ee:layout')),
      });
    } else window.dispatchEvent(new Event('ee:layout'));
  };

  window.addEventListener('ee:cat', (e) => {
    const inView = grid.getBoundingClientRect().top < innerHeight && grid.getBoundingClientRect().bottom > 0;
    apply((e as CustomEvent<Category>).detail, app.motion && inView);
  });

  more?.addEventListener('click', () => {
    expanded = true;
    apply(app.cat, app.motion);
    (visible()[12]?.querySelector('button') as HTMLElement | null)?.focus({ preventScroll: true });
  });

  items.forEach((li) => {
    li.querySelector('button')!.addEventListener('click', (ev) => {
      const list = visible();
      openLightbox(list.map((x) => byId[x.dataset.id!]), list.indexOf(li), ev.currentTarget as HTMLElement);
    });
  });
}
