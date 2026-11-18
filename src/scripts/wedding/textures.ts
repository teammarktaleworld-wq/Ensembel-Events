import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

// Every texture is painted on a canvas at load time, so the scene ships no image files.

export function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = seeded(2008);

function canvas(w: number, h = w) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
}

function finish(c: HTMLCanvasElement, repeat?: [number, number], srgb = true) {
  const t = new CanvasTexture(c);
  if (srgb) t.colorSpace = SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  t.anisotropy = 8;
  return t;
}

function veins(g: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number, n: number, alpha: number) {
  for (let i = 0; i < n; i++) {
    g.strokeStyle = `rgba(140,128,112,${alpha * (0.4 + rand() * 0.6)})`;
    g.lineWidth = 0.5 + rand() * 1.2;
    g.beginPath();
    let x = x0 + rand() * w;
    let y = y0 + rand() * h;
    g.moveTo(x, y);
    for (let k = 0; k < 4; k++) {
      const nx = x + (rand() - 0.5) * w * 0.45;
      const ny = y + (rand() - 0.5) * h * 0.45;
      g.quadraticCurveTo(x + (rand() - 0.5) * w * 0.3, y + (rand() - 0.5) * h * 0.3, nx, ny);
      x = nx;
      y = ny;
    }
    g.stroke();
  }
}

// Courtyard floor: 2 × 2 ivory marble tiles with veining, grout and small gold inlays.
export function marbleTiles(repeat: number) {
  const s = 512;
  const [c, g] = canvas(s);
  const half = s / 2;
  for (let ty = 0; ty < 2; ty++) {
    for (let tx = 0; tx < 2; tx++) {
      const tone = 236 + Math.round(rand() * 8);
      g.fillStyle = `rgb(${tone},${tone - 6},${tone - 16})`;
      g.fillRect(tx * half, ty * half, half, half);
      veins(g, tx * half, ty * half, half, half, 7, 0.22);
    }
  }
  g.strokeStyle = '#cdbfa8';
  g.lineWidth = 3;
  for (let i = 0; i <= 2; i++) {
    g.beginPath(); g.moveTo(i * half, 0); g.lineTo(i * half, s); g.stroke();
    g.beginPath(); g.moveTo(0, i * half); g.lineTo(s, i * half); g.stroke();
  }
  // Inlaid diamond where four tiles meet
  g.fillStyle = '#c99a45';
  g.beginPath(); g.moveTo(half, half - 18); g.lineTo(half + 18, half); g.lineTo(half, half + 18); g.lineTo(half - 18, half); g.closePath(); g.fill();
  g.fillStyle = '#7a2230';
  g.beginPath(); g.arc(half, half, 6, 0, Math.PI * 2); g.fill();
  return finish(c, [repeat, repeat]);
}

// Mandap floor: a flower rangoli on white marble.
export function rangoli() {
  const s = 1024;
  const [c, g] = canvas(s);
  const cx = s / 2;
  g.fillStyle = '#f5f0e7';
  g.fillRect(0, 0, s, s);
  veins(g, 0, 0, s, s, 18, 0.16);

  const petalRing = (r: number, n: number, len: number, wid: number, color: string, offset = 0) => {
    g.fillStyle = color;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + offset;
      g.save();
      g.translate(cx + Math.cos(a) * r, cx + Math.sin(a) * r);
      g.rotate(a);
      g.beginPath();
      g.ellipse(0, 0, len, wid, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
  };
  const dots = (r: number, n: number, size: number, color: string) => {
    g.fillStyle = color;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      g.beginPath(); g.arc(cx + Math.cos(a) * r, cx + Math.sin(a) * r, size, 0, Math.PI * 2); g.fill();
    }
  };
  const disc = (r: number, color: string) => { g.fillStyle = color; g.beginPath(); g.arc(cx, cx, r, 0, Math.PI * 2); g.fill(); };
  const ring = (r: number, w: number, color: string) => { g.strokeStyle = color; g.lineWidth = w; g.beginPath(); g.arc(cx, cx, r, 0, Math.PI * 2); g.stroke(); };

  // Square gold border with corner lotus dots
  g.strokeStyle = '#c99a45'; g.lineWidth = 10; g.strokeRect(26, 26, s - 52, s - 52);
  g.strokeStyle = '#b3122e'; g.lineWidth = 4; g.strokeRect(46, 46, s - 92, s - 92);
  for (const [x, y] of [[90, 90], [s - 90, 90], [90, s - 90], [s - 90, s - 90]]) {
    g.fillStyle = '#f28c13'; g.beginPath(); g.arc(x, y, 30, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffc93c'; g.beginPath(); g.arc(x, y, 18, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#b3122e'; g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill();
  }

  disc(462, '#fdf6ea');
  petalRing(440, 56, 34, 15, '#f28c13');
  petalRing(440, 56, 18, 7, '#ffc93c', Math.PI / 56);
  ring(400, 14, '#d6246e');
  petalRing(368, 36, 30, 11, '#3f8f3a');
  dots(338, 72, 5, '#ffffff');
  petalRing(300, 24, 46, 22, '#ffffff');
  petalRing(300, 24, 22, 9, '#ffd9e6');
  disc(250, '#b3122e');
  petalRing(222, 18, 30, 15, '#ff6fa1');
  dots(186, 36, 6, '#ffc93c');
  disc(160, '#ffc93c');
  petalRing(132, 12, 28, 14, '#f28c13');
  disc(92, '#fff6e6');
  petalRing(70, 8, 22, 10, '#d6246e');
  disc(36, '#b3122e');
  disc(16, '#ffc93c');
  return finish(c);
}

// Red aisle runner with gold borders and motifs; repeats along its length.
export function carpet(repeatY: number) {
  const [c, g] = canvas(256, 512);
  g.fillStyle = '#8f0f22';
  g.fillRect(0, 0, 256, 512);
  for (let x = 0; x < 256; x += 8) {
    g.fillStyle = `rgba(0,0,0,${0.03 + rand() * 0.05})`;
    g.fillRect(x, 0, 4, 512);
  }
  g.fillStyle = '#d4a03c';
  g.fillRect(0, 0, 22, 512); g.fillRect(234, 0, 22, 512);
  g.fillStyle = '#6b0a18';
  g.fillRect(22, 0, 6, 512); g.fillRect(228, 0, 6, 512);
  g.fillStyle = '#e6b95a';
  for (let y = 64; y < 512; y += 128) {
    g.beginPath(); g.moveTo(128, y - 30); g.lineTo(150, y); g.lineTo(128, y + 30); g.lineTo(106, y); g.closePath(); g.fill();
    g.fillStyle = '#8f0f22'; g.beginPath(); g.arc(128, y, 8, 0, Math.PI * 2); g.fill(); g.fillStyle = '#e6b95a';
  }
  return finish(c, [1, repeatY]);
}

// Sandstone courses for the palace walls (UVs are in metres).
export function sandstone() {
  const s = 256;
  const [c, g] = canvas(s);
  g.fillStyle = '#efdcc0';
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(${rand() > 0.5 ? '255,250,240' : '170,140,105'},${0.05 + rand() * 0.08})`;
    g.fillRect(rand() * s, rand() * s, 1 + rand() * 3, 1 + rand() * 3);
  }
  g.strokeStyle = 'rgba(150,118,84,0.18)';
  g.lineWidth = 1.5;
  for (let y = 0; y <= s; y += 64) {
    g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke();
    const off = (y / 64) % 2 ? 64 : 0;
    for (let x = off; x <= s; x += 128) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 64); g.stroke(); }
  }
  return finish(c, [0.25, 0.25]);
}

// Carved jaali lattice for the arches. The inverse version lights only the gaps at night.
export function jaali(inverse: boolean) {
  const w = 256;
  const h = 384;
  const [c, g] = canvas(w, h);
  g.fillStyle = inverse ? '#ffffff' : '#3d2819';
  g.fillRect(0, 0, w, h);
  g.strokeStyle = inverse ? '#000000' : '#e6d0ac';
  g.fillStyle = g.strokeStyle;
  g.lineWidth = 7;
  const s = 42;
  for (let k = -h; k < w + h; k += s) {
    g.beginPath(); g.moveTo(k, 0); g.lineTo(k + h, h); g.stroke();
    g.beginPath(); g.moveTo(k, 0); g.lineTo(k - h, h); g.stroke();
  }
  g.lineWidth = 4;
  for (let y = 0; y <= h + s; y += s) {
    for (let x = 0; x <= w + s; x += s) {
      for (const [ox, oy] of [[0, 0], [s / 2, s / 2]]) {
        g.beginPath(); g.arc(x + ox, y + oy, 9, 0, Math.PI * 2); g.stroke();
      }
    }
  }
  g.lineWidth = 16;
  g.strokeRect(0, 0, w, h);
  return finish(c, undefined, !inverse);
}

// Soft round glow for fairy lights and lamp halos.
export function glow() {
  const s = 128;
  const [c, g] = canvas(s);
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.18, 'rgba(255,255,255,0.85)');
  grad.addColorStop(0.42, 'rgba(255,255,255,0.22)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  return finish(c, undefined, false);
}

// Teardrop flame for diyas and lamps.
export function flame() {
  const [c, g] = canvas(64, 128);
  const grad = g.createRadialGradient(32, 92, 2, 32, 80, 60);
  grad.addColorStop(0, 'rgba(255,255,235,1)');
  grad.addColorStop(0.25, 'rgba(255,214,120,0.95)');
  grad.addColorStop(0.6, 'rgba(255,128,40,0.55)');
  grad.addColorStop(1, 'rgba(255,90,20,0)');
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(32, 4);
  g.bezierCurveTo(46, 40, 60, 70, 56, 96);
  g.bezierCurveTo(52, 122, 12, 122, 8, 96);
  g.bezierCurveTo(4, 70, 18, 40, 32, 4);
  g.fill();
  return finish(c, undefined, false);
}
