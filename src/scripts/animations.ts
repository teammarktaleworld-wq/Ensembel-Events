import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { bootWall } from './wall';

gsap.registerPlugin(ScrollTrigger, SplitText);

function intro() {
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  bootWall(tl, 0);
  tl.fromTo('.hero-line', { yPercent: 110, y: 0 }, { yPercent: 0, duration: 1.1, stagger: 0.12 }, 0.25)
    .fromTo('.hero-fade', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out' }, 0.5);
}

// Desktop: as the hero leaves, the wall drifts apart in depth.
function heroDepth() {
  const tl = gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } });
  const push: Record<string, gsap.TweenVars> = {
    s0: { x: -40, y: -90, rotationY: 10 }, s1: { y: -120 }, s2: { x: 40, y: -90, rotationY: -10 },
    s3: { x: -80, rotationY: 14 }, s4: { x: 80, rotationY: -14 },
    s5: { x: -40, y: 60, rotationY: 10 }, s6: { y: 80 }, s7: { x: 40, y: 60, rotationY: -10 },
  };
  Object.entries(push).forEach(([k, v]) => tl.to(`.tile.${k}`, { ...v, transformPerspective: 1200, ease: 'none' }, 0));
  tl.to('.tile-text', { scale: 0.94, opacity: 0.4, ease: 'none' }, 0);
}

function reveals() {
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit(self) {
        gsap.set(el, { visibility: 'visible' });
        return gsap.from(self.lines, { yPercent: 105, duration: 1, ease: 'power4.out', stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      },
    });
  });

  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%', once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, overwrite: true }),
  });

  document.querySelectorAll<HTMLElement>('.count').forEach((el) => {
    const target = Number(el.dataset.count || 0);
    const o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 92%', once: true,
      onEnter: () => gsap.fromTo(o, { v: 0 }, { v: target, duration: 1.4, ease: 'power2.out', onUpdate: () => { el.textContent = String(Math.round(o.v)); } }),
    });
  });

  ScrollTrigger.batch('.g-item', {
    start: 'top 94%', once: true,
    onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.05 }),
  });

  // Showreel screen opens up from a narrower frame as it scrolls in.
  gsap.fromTo('.screen', { clipPath: 'inset(0% 9% 0% 9% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 24px)', ease: 'none', scrollTrigger: { trigger: '.screen', start: 'top 95%', end: 'top 35%', scrub: true } });

  gsap.fromTo('.process-line', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 80%', end: 'bottom 55%', scrub: true } });
  gsap.utils.toArray<HTMLElement>('.process-step').forEach((step, i) => {
    ScrollTrigger.create({
      trigger: '.steps', start: `top+=${i * 14} 78%`,
      onEnter: () => step.classList.add('is-active'),
      onLeaveBack: () => step.classList.remove('is-active'),
    });
  });

  gsap.fromTo('.fm-letter', { yPercent: 105, y: 0 }, { yPercent: 0, duration: 1, ease: 'power4.out', stagger: 0.04, scrollTrigger: { trigger: '.footer-mark', start: 'top 96%', once: true } });
}

export function initAnimations() {
  intro();
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  fonts.then(() => {
    gsap.matchMedia().add('(min-width: 1024px)', () => { heroDepth(); });
    reveals();
    ScrollTrigger.refresh();
    let t = 0;
    const refresh = () => { clearTimeout(t); t = window.setTimeout(() => ScrollTrigger.refresh(), 200); };
    window.addEventListener('resize', refresh);
    window.addEventListener('ee:layout', refresh);
  });
}
