import gsap from 'gsap';
import { app, lockScroll } from './state';
import { isPaused, setPaused } from './video';

const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

export function initUI() {
  const header = document.getElementById('site-header');
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');
  let menuOpen = false;

  // Header: solid after the top, hides on scroll down, returns on scroll up.
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    header?.classList.toggle('is-solid', y > 24);
    if (!menuOpen) header?.classList.toggle('is-hidden', y > lastY && y > 480);
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  header?.addEventListener('focusin', () => header.classList.remove('is-hidden'));
  onScroll();

  const setMenu = (open: boolean) => {
    if (!menu || !toggle || open === menuOpen) return;
    menuOpen = open;
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    header?.classList.remove('is-hidden');
    menu.hidden = !open;
    lockScroll(open);
    if (open && app.motion) gsap.fromTo(menu.querySelectorAll('.mm-link'), { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.05 });
  };
  toggle?.addEventListener('click', () => setMenu(!menuOpen));
  menu?.querySelectorAll('a, button').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) { setMenu(false); toggle?.focus(); } });
  matchMedia('(min-width: 1024px)').addEventListener('change', (e) => e.matches && setMenu(false));

  if (app.motion && finePointer()) {
    document.querySelectorAll<HTMLElement>('.magnetic').forEach((btn) => {
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.22);
        yTo((e.clientY - r.top - r.height / 2) * 0.3);
      });
      btn.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  // Background videos: visitor can pause them all; reduced motion starts paused.
  setPaused(!app.motion);
  document.querySelectorAll('.pause-btn').forEach((b) => b.addEventListener('click', () => setPaused(!isPaused())));

  initDrawer();
  initForm();

  const fab = document.querySelector<HTMLElement>('.wa-fab');
  if (fab) {
    const covering = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => (en.isIntersecting ? covering.add(en.target) : covering.delete(en.target)));
      fab.classList.toggle('is-obscured', covering.size > 0);
    }, { rootMargin: '0px 0px -20% 0px' });
    document.querySelectorAll('#contact, footer').forEach((el) => io.observe(el));
  }
}

// Enquiry form opens as a drawer from any [data-open-enquiry] button.
function initDrawer() {
  const drawer = document.getElementById('enquiry');
  if (!drawer) return;
  const panel = drawer.querySelector<HTMLElement>('.drawer-panel')!;
  const scrim = drawer.querySelector<HTMLElement>('.drawer-scrim')!;
  const type = drawer.querySelector<HTMLSelectElement>('#f-type');
  let returnFocus: HTMLElement | null = null;
  const desktop = () => matchMedia('(min-width: 640px)').matches;

  const open = (trigger: HTMLElement) => {
    returnFocus = trigger;
    if (type && trigger.dataset.type) type.value = trigger.dataset.type;
    drawer.hidden = false;
    lockScroll(true);
    if (app.motion) {
      gsap.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.4 });
      gsap.fromTo(panel, desktop() ? { xPercent: 100 } : { yPercent: 100 }, { xPercent: 0, yPercent: 0, duration: 0.7, ease: 'expo.out' });
    }
    setTimeout(() => drawer.querySelector<HTMLElement>('#f-name')?.focus({ preventScroll: true }), app.motion ? 350 : 0);
  };
  const close = () => {
    if (drawer.hidden) return;
    const done = () => { drawer.hidden = true; lockScroll(false); returnFocus?.focus({ preventScroll: true }); };
    if (!app.motion) return done();
    gsap.to(scrim, { opacity: 0, duration: 0.35 });
    gsap.to(panel, { ...(desktop() ? { xPercent: 100 } : { yPercent: 100 }), duration: 0.45, ease: 'power3.in', onComplete: done });
  };

  document.querySelectorAll<HTMLElement>('[data-open-enquiry]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); open(b); }));
  drawer.querySelectorAll('[data-drawer-close]').forEach((b) => b.addEventListener('click', close));
  window.addEventListener('keydown', (e) => {
    if (drawer.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      const f = Array.from(panel.querySelectorAll<HTMLElement>('button, input:not([tabindex="-1"]), select, textarea')).filter((el) => el.offsetParent !== null);
      const i = f.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1]?.focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0]?.focus(); }
    }
  });
}

function initForm() {
  const form = document.querySelector<HTMLFormElement>('#enquiry-form');
  const success = document.getElementById('enquiry-success');
  if (!form || !success) return;

  const rules: Record<string, (v: string) => boolean> = {
    name: (v) => v.trim().length >= 2,
    phone: (v) => { const d = v.replace(/\D/g, ''); return d.length >= 10 && d.length <= 13; },
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  };
  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement;
  const check = (name: string) => {
    const ok = rules[name](field(name).value);
    field(name).setAttribute('aria-invalid', String(!ok));
    const err = document.getElementById(`err-${name}`);
    if (err) err.hidden = ok;
    return ok;
  };
  Object.keys(rules).forEach((name) => {
    const el = field(name);
    el.addEventListener('blur', () => { if (el.value || el.getAttribute('aria-invalid') === 'true') check(name); });
    el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') check(name); });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if ((form.elements.namedItem('website') as HTMLInputElement).value) return;
    const invalid = Object.keys(rules).filter((n) => !check(n));
    if (invalid.length) { field(invalid[0]).focus(); return; }

    // PHP endpoint will connect here, e.g. fetch('/enquiry.php', { method: 'POST', body: new FormData(form) }).
    const done = () => {
      form.hidden = true;
      success.hidden = false;
      success.focus();
      if (app.motion) gsap.from(success, { opacity: 0, y: 16, duration: 0.6, ease: 'power3.out' });
    };
    app.motion ? gsap.to(form, { opacity: 0, y: -12, duration: 0.35, ease: 'power2.in', onComplete: done }) : done();
  });
}
