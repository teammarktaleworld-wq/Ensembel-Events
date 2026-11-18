// Scroll progress (0–1 through the wedding journey) where each function is centred.
export const CHAPTER_AT = [0.1, 0.3, 0.5, 0.7, 0.9];

// Page colours for each function: accent, text ink, card tint, and the poster's sky, drapes, flowers and floor.
export const PALETTE: Record<string, string>[] = [
  { tint: '#ffb300', ink: '#8f4f00', soft: '#fff3cc', sky1: '#4f9fe6', sky2: '#ffe39a', drape: '#ffc400', drape2: '#ff8a00', flower: '#ff7a00', ground: '#f6e3b6' },
  { tint: '#ff2f86', ink: '#1d7a3a', soft: '#ffe3ef', sky1: '#45a9da', sky2: '#ffc7dd', drape: '#2fb34a', drape2: '#ff2f86', flower: '#ff3d8b', ground: '#f4dde6' },
  { tint: '#d0168f', ink: '#8a0f66', soft: '#f9dcf1', sky1: '#2c1a6e', sky2: '#ff7a5c', drape: '#e8158d', drape2: '#6f2bdc', flower: '#a66bff', ground: '#d9b6d4' },
  { tint: '#e0301e', ink: '#9b0d1c', soft: '#ffe0d6', sky1: '#3a1248', sky2: '#ff8a3d', drape: '#d0121f', drape2: '#ffb000', flower: '#ff8c00', ground: '#e7c3b6' },
  { tint: '#d4a03c', ink: '#7a4f0e', soft: '#fbefd8', sky1: '#1a1d5c', sky2: '#d97fb0', drape: '#fff3e2', drape2: '#f3c46b', flower: '#ffd36b', ground: '#d8cde0' },
];

// Midpoints between functions: where one function's page turns into the next.
export const MIDS = CHAPTER_AT.slice(1).map((c, i) => (CHAPTER_AT[i] + c) / 2);

export function chapterAt(p: number) {
  let best = 0;
  for (let i = 1; i < CHAPTER_AT.length; i++) if (p >= (CHAPTER_AT[i - 1] + CHAPTER_AT[i]) / 2) best = i;
  return best;
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

// Which function the scroll is in, and how far through it: -1 as it opens, 0 at its centre, 1 as it hands over.
export function chapterLocal(p: number) {
  const ch = chapterAt(p);
  return { ch, L: Math.min(1, Math.max(-1, (p - CHAPTER_AT[ch]) / 0.1)) };
}

// Each function's look holds around its centre and swaps to the next right at the midpoint,
// while the page-turn covers the screen.
export function chapterBlend(p: number) {
  if (p <= CHAPTER_AT[0]) return { a: 0, b: 0, t: 0 };
  for (let i = 0; i < CHAPTER_AT.length - 1; i++) {
    if (p < CHAPTER_AT[i + 1]) {
      const local = (p - CHAPTER_AT[i]) / (CHAPTER_AT[i + 1] - CHAPTER_AT[i]);
      return { a: i, b: i + 1, t: smooth(0.44, 0.56, local) };
    }
  }
  const last = CHAPTER_AT.length - 1;
  return { a: last, b: last, t: 0 };
}
