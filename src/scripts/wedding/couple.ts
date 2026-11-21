import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Scroll-driven varmala: the couple walk in, exchange garlands, then the gathbandhan is tied.
export function initCouple() {
  const root = document.querySelector<HTMLElement>('.wd-couple');
  const art = root?.querySelector<HTMLElement>('.wd-couple-art');
  if (!root || !art) return;
  // The decorative loops (petals, mandala, lamps) run only while the illustration is on screen. Left running
  // off screen, they made the browser repaint the whole drawing every frame and slowed the rest of the page.
  new IntersectionObserver(([e]) => root.classList.toggle('is-live', e.isIntersecting), { rootMargin: '10% 0px' }).observe(art);
  const steps = Array.from(root.querySelectorAll<HTMLElement>('.wd-step span'));
  let step = 0;
  const setStep = (i: number) => {
    if (i === step) return;
    step = i;
    steps.forEach((s, k) => s.classList.toggle('is-on', k === i));
  };
  const $ = (s: string) => art.querySelectorAll(s);

  gsap.matchMedia().add({ desktop: '(min-width: 1024px)', mobile: '(max-width: 1023px)' }, (ctx) => {
    const desktop = !!ctx.conditions?.desktop;
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: desktop
        ? { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.8 }
        : { trigger: art, start: 'top 85%', end: 'bottom 40%', scrub: 0.8 },
      onUpdate() {
        const p = tl.progress();
        setStep(p < 0.56 ? 0 : p < 0.74 ? 1 : 2);
      },
    });

    tl.fromTo($('.wd-groom'), { x: -150, opacity: 0 }, { x: 0, opacity: 1, duration: 0.16, ease: 'power2.out' }, 0)
      .fromTo($('.g-held'), { x: -150, opacity: 0 }, { x: 0, opacity: 1, duration: 0.16, ease: 'power2.out' }, 0)
      .fromTo($('.wd-bride'), { x: 150, opacity: 0 }, { x: 0, opacity: 1, duration: 0.16, ease: 'power2.out' }, 0)
      .fromTo($('.b-held'), { x: 150, opacity: 0 }, { x: 0, opacity: 1, duration: 0.16, ease: 'power2.out' }, 0)
      .fromTo($('.wd-arch-flower'), { scale: 0 }, { scale: 1, duration: 0.1, stagger: { amount: 0.14, from: 'edges' }, ease: 'back.out(2)' }, 0.02)

      // The bride garlands the groom first
      .to($('.b-arm-front'), { rotation: 22, svgOrigin: '678 380', duration: 0.08, ease: 'power2.inOut' }, 0.2)
      .to($('.b-arm-back'), { rotation: 14, svgOrigin: '772 380', duration: 0.08, ease: 'power2.inOut' }, 0.2)
      .to($('.b-held'), { keyframes: { x: [0, -90, -168], y: [0, -236, -170], scale: [1, 1.08, 1] }, duration: 0.09, ease: 'power1.inOut' }, 0.2)
      .to($('.b-held'), { opacity: 0, duration: 0.02 }, 0.29)
      .fromTo($('.g-worn'), { opacity: 0, scale: 0.86 }, { opacity: 1, scale: 1, transformOrigin: '50% 0%', duration: 0.03, ease: 'back.out(2)' }, 0.285)
      .fromTo($('.wd-burst-g'), { opacity: 1, scale: 0.2, transformOrigin: '50% 50%' }, { opacity: 0, scale: 1.6, duration: 0.07, ease: 'power2.out' }, 0.285)
      .to($('.b-arm'), { rotation: 0, duration: 0.07, ease: 'power2.inOut' }, 0.31)

      // Then the groom garlands the bride
      .to($('.g-arm-front'), { rotation: -20, svgOrigin: '540 345', duration: 0.08, ease: 'power2.inOut' }, 0.4)
      .to($('.g-arm-back'), { rotation: -14, svgOrigin: '420 345', duration: 0.08, ease: 'power2.inOut' }, 0.4)
      .to($('.g-held'), { keyframes: { x: [0, 84, 165], y: [0, -228, -134], scale: [1, 1.08, 1] }, duration: 0.09, ease: 'power1.inOut' }, 0.4)
      .to($('.g-held'), { opacity: 0, duration: 0.02 }, 0.49)
      .fromTo($('.b-worn'), { opacity: 0, scale: 0.86 }, { opacity: 1, scale: 1, transformOrigin: '50% 0%', duration: 0.03, ease: 'back.out(2)' }, 0.485)
      .fromTo($('.wd-burst-b'), { opacity: 1, scale: 0.2, transformOrigin: '50% 50%' }, { opacity: 0, scale: 1.6, duration: 0.07, ease: 'power2.out' }, 0.485)
      .to($('.g-arm'), { rotation: 0, duration: 0.07, ease: 'power2.inOut' }, 0.51)

      // Gathbandhan
      .to($('.wd-knot'), { strokeDashoffset: 0, duration: 0.1, ease: 'power1.inOut' }, 0.6)
      .fromTo($('.wd-knot-dot'), { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.04, ease: 'back.out(3)' }, 0.68)
      .fromTo($('.wd-glow'), { opacity: 0.75 }, { opacity: 1, duration: 0.12 }, 0.6)
      .to({}, { duration: 0.18 }, 0.82);

    return () => setStep(0);
  });
}
