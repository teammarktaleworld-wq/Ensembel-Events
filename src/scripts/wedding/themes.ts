import { Color } from 'three';
import { chapterBlend } from './chapters';

export { CHAPTER_AT, chapterAt } from './chapters';

// One mandap, re-dressed for each function.
const COLOR_KEYS = [
  'skyTop', 'skyMid', 'skyHorizon', 'fog', 'sun', 'hemiSky', 'hemiGround', 'drape', 'drapeAlt', 'valance',
  'flower0', 'flower1', 'flower2', 'decorA', 'decorB', 'fairyColor',
] as const;
const NUM_KEYS = ['sunIntensity', 'sunElevation', 'sunAzimuth', 'hemiIntensity', 'fairy', 'lanterns', 'fire', 'chandelier', 'windows', 'beams', 'stars', 'exposure', 'fogNear', 'fogFar', 'decor'] as const;

type ColorKey = (typeof COLOR_KEYS)[number];
type NumKey = (typeof NUM_KEYS)[number];
type ThemeDef = Record<ColorKey, string> & Record<NumKey, number>;

export const THEMES: ThemeDef[] = [
  // Haldi: golden morning, turmeric and marigold
  {
    skyTop: '#3f8fdc', skyMid: '#8cc9ef', skyHorizon: '#ffe39a', fog: '#f7dfa0',
    sun: '#ffe9b8', sunIntensity: 2.2, sunElevation: 38, sunAzimuth: 35,
    hemiSky: '#cfe6ff', hemiGround: '#e3c27a', hemiIntensity: 0.8,
    drape: '#ffc400', drapeAlt: '#ff8a00', valance: '#ff6a00',
    flower0: '#ff7a00', flower1: '#ffc400', flower2: '#fff1c2',
    decorA: '#ffd36b', decorB: '#ff9f43', fairyColor: '#ffd9a0',
    fairy: 0, lanterns: 0.05, fire: 0, chandelier: 0.1, windows: 0, beams: 0, stars: 0,
    exposure: 0.9, fogNear: 60, fogFar: 190, decor: 0.15,
  },
  // Mehendi: lush afternoon, parrot green and rani pink
  {
    skyTop: '#3fa0d6', skyMid: '#9fe0d8', skyHorizon: '#ffc7dd', fog: '#f6cfe0',
    sun: '#ffe1c4', sunIntensity: 2.0, sunElevation: 24, sunAzimuth: 70,
    hemiSky: '#d9f2ff', hemiGround: '#b9d48a', hemiIntensity: 0.8,
    drape: '#2fb34a', drapeAlt: '#ff2f86', valance: '#ff1f74',
    flower0: '#ff3d8b', flower1: '#ffd000', flower2: '#9be15d',
    decorA: '#ff7ab6', decorB: '#7be08a', fairyColor: '#ffd3e6',
    fairy: 0.2, lanterns: 0.15, fire: 0, chandelier: 0.15, windows: 0.05, beams: 0, stars: 0,
    exposure: 0.92, fogNear: 55, fogFar: 180, decor: 0.25,
  },
  // Sangeet: neon dusk, magenta and violet under stage beams
  {
    skyTop: '#24145e', skyMid: '#8a2ca8', skyHorizon: '#ff7a5c', fog: '#7a4c9a',
    sun: '#ff8a5c', sunIntensity: 1.0, sunElevation: 4, sunAzimuth: 115,
    hemiSky: '#b4a6ff', hemiGround: '#4a2a3a', hemiIntensity: 0.6,
    drape: '#e8158d', drapeAlt: '#6f2bdc', valance: '#ff36b0',
    flower0: '#ff4fb4', flower1: '#ffffff', flower2: '#a66bff',
    decorA: '#ffb347', decorB: '#7b5cff', fairyColor: '#ffc4ec',
    fairy: 1, lanterns: 0.9, fire: 0, chandelier: 0.55, windows: 0.9, beams: 1, stars: 0.3,
    exposure: 1.0, fogNear: 45, fogFar: 160, decor: 0.9,
  },
  // Pheras: fiery twilight, deep red and saffron gold around the sacred fire
  {
    skyTop: '#2a0f45', skyMid: '#9e2450', skyHorizon: '#ff8a3d', fog: '#8c3a44',
    sun: '#ff7a45', sunIntensity: 0.45, sunElevation: -1, sunAzimuth: 140,
    hemiSky: '#8a5cc8', hemiGround: '#4a1f1f', hemiIntensity: 0.5,
    drape: '#d0121f', drapeAlt: '#ffb000', valance: '#9c0018',
    flower0: '#e0102e', flower1: '#ff8c00', flower2: '#ffe08a',
    decorA: '#ff8a3d', decorB: '#ff4d6d', fairyColor: '#ffc27a',
    fairy: 0.9, lanterns: 1, fire: 1, chandelier: 0.45, windows: 1, beams: 0, stars: 0.7,
    exposure: 1.02, fogNear: 40, fogFar: 150, decor: 0.95,
  },
  // Reception: royal night with a blush horizon, ivory and champagne gold
  {
    skyTop: '#121650', skyMid: '#3a2d8a', skyHorizon: '#d97fb0', fog: '#4a3a7e',
    sun: '#c8d4ff', sunIntensity: 0.4, sunElevation: 32, sunAzimuth: 205,
    hemiSky: '#9a8cff', hemiGround: '#3a2a4a', hemiIntensity: 0.5,
    drape: '#fff3e2', drapeAlt: '#f3c46b', valance: '#e0a23c',
    flower0: '#fffaf2', flower1: '#ff9fbf', flower2: '#ffd36b',
    decorA: '#ffd38a', decorB: '#ff8fc8', fairyColor: '#ffe7b8',
    fairy: 1, lanterns: 1, fire: 0, chandelier: 1, windows: 1, beams: 0.35, stars: 1,
    exposure: 1.05, fogNear: 40, fogFar: 150, decor: 1,
  },
];

export type ThemeState = { c: Record<ColorKey, Color>; n: Record<NumKey, number> };

const prepared = THEMES.map((t) => ({
  c: Object.fromEntries(COLOR_KEYS.map((k) => [k, new Color(t[k])])) as Record<ColorKey, Color>,
  n: Object.fromEntries(NUM_KEYS.map((k) => [k, t[k]])) as Record<NumKey, number>,
}));

export function createThemeState(): ThemeState {
  return {
    c: Object.fromEntries(COLOR_KEYS.map((k) => [k, prepared[0].c[k].clone()])) as Record<ColorKey, Color>,
    n: { ...prepared[0].n },
  };
}

export function mixTheme(out: ThemeState, p: number) {
  const blend = chapterBlend(p);
  const A = prepared[blend.a];
  const B = prepared[blend.b];
  for (const k of COLOR_KEYS) out.c[k].copy(A.c[k]).lerp(B.c[k], blend.t);
  for (const k of NUM_KEYS) out.n[k] = A.n[k] + (B.n[k] - A.n[k]) * blend.t;
  return blend;
}
