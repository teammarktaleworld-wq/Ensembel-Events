import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function createLenis(): Lenis {
  const lenis = new Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // In-page links scroll through Lenis; the skip link keeps native focus behaviour.
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    const id = a.getAttribute('href') || '';
    if (id.length < 2 || id === '#main') return;
    a.addEventListener('click', (e) => {
      const target = document.querySelector<HTMLElement>(id);
      if (!target) return;
      e.preventDefault();
      // Deferred so the mobile menu can close and restart Lenis first.
      requestAnimationFrame(() => lenis.scrollTo(target, { force: true }));
    });
  });

  return lenis;
}
