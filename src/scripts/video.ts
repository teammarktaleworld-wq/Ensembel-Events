// Muted background videos play only while visible and not paused by the visitor.
const vids = new Set<HTMLVideoElement>();
let paused = false;
let suspended = false;

const sync = (v: HTMLVideoElement) => {
  if (!v.isConnected) { vids.delete(v); io.unobserve(v); return; }
  if (v.dataset.visible === '1' && !paused && !suspended && !document.hidden) {
    if (!v.getAttribute('src') && v.dataset.src) v.src = v.dataset.src;
    v.play().catch(() => {});
  } else if (!v.paused) v.pause();
};

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    const v = e.target as HTMLVideoElement;
    v.dataset.visible = e.isIntersecting ? '1' : '';
    sync(v);
  });
}, { threshold: 0.15 });

document.addEventListener('visibilitychange', () => vids.forEach(sync));

export function autoplay(v: HTMLVideoElement) {
  vids.add(v);
  io.observe(v);
}

export function autoplayAll(root: ParentNode = document) {
  root.querySelectorAll<HTMLVideoElement>('video[data-autoplay]').forEach(autoplay);
}

export const isPaused = () => paused;

export function setPaused(p: boolean) {
  paused = p;
  vids.forEach(sync);
  document.querySelectorAll<HTMLButtonElement>('.pause-btn').forEach((b) => {
    b.setAttribute('aria-pressed', String(p));
    const label = b.querySelector('.pause-label');
    if (label) label.textContent = p ? 'Play videos' : 'Pause videos';
  });
}

// Temporarily silence background loops (e.g. while the lightbox plays a video).
export function suspend(s: boolean) {
  suspended = s;
  vids.forEach(sync);
}
