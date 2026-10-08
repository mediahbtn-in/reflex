import * as THREE from "three";

// Procedural canvas textures — zero network weight, crisp at any DPR.

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  return { c, ctx };
}

// Deterministic PRNG so the building looks identical on every load.
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function finish(c: HTMLCanvasElement, srgb = true, repeat = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/** Oak — planks with long grain. 1 texture repeat ≈ 1 m. */
export function woodTexture(seed = 3, base = "#a8784c", vertical = false) {
  const { c, ctx } = canvas(512, 512);
  const r = rng(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);
  const planks = 4;
  for (let p = 0; p < planks; p++) {
    const y0 = (p * 512) / planks;
    const tone = (r() - 0.5) * 26;
    ctx.fillStyle = `rgba(${tone > 0 ? 255 : 40},${tone > 0 ? 220 : 24},${tone > 0 ? 170 : 10},${Math.abs(tone) / 160})`;
    ctx.fillRect(0, y0, 512, 512 / planks);
    for (let g = 0; g < 26; g++) {
      ctx.strokeStyle = `rgba(70,40,18,${0.05 + r() * 0.12})`;
      ctx.lineWidth = 0.6 + r() * 1.6;
      ctx.beginPath();
      const yy = y0 + r() * (512 / planks);
      ctx.moveTo(0, yy);
      for (let x = 0; x <= 512; x += 32) ctx.lineTo(x, yy + Math.sin(x * 0.012 + g) * 3 * r());
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(40,22,10,0.35)";
    ctx.fillRect(0, y0, 512, 1.5);
  }
  if (vertical) {
    const { c: c2, ctx: x2 } = canvas(512, 512);
    x2.translate(256, 256);
    x2.rotate(Math.PI / 2);
    x2.drawImage(c, -256, -256);
    return finish(c2);
  }
  return finish(c);
}

/** Vertical timber slat cladding (dark gaps between slats). */
export function slatTexture() {
  const { c, ctx } = canvas(512, 512);
  const r = rng(11);
  ctx.fillStyle = "#3b2516";
  ctx.fillRect(0, 0, 512, 512);
  const n = 8;
  for (let i = 0; i < n; i++) {
    const x = (i * 512) / n;
    const w = 512 / n - 12;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    const b = 150 + r() * 25;
    g.addColorStop(0, `rgb(${b * 0.9},${b * 0.6},${b * 0.36})`);
    g.addColorStop(0.5, `rgb(${b},${b * 0.68},${b * 0.42})`);
    g.addColorStop(1, `rgb(${b * 0.8},${b * 0.52},${b * 0.3})`);
    ctx.fillStyle = g;
    ctx.fillRect(x + 6, 0, w, 512);
    for (let k = 0; k < 10; k++) {
      ctx.strokeStyle = `rgba(80,45,20,${0.08 + r() * 0.1})`;
      ctx.beginPath();
      const xx = x + 6 + r() * w;
      ctx.moveTo(xx, 0);
      ctx.lineTo(xx + (r() - 0.5) * 6, 512);
      ctx.stroke();
    }
  }
  return finish(c);
}

/** Calacatta-style marble with soft veins. */
export function marbleTexture() {
  const { c, ctx } = canvas(1024, 1024);
  const r = rng(7);
  ctx.fillStyle = "#f1eee8";
  ctx.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = `rgba(200,195,186,${r() * 0.05})`;
    ctx.beginPath();
    ctx.arc(r() * 1024, r() * 1024, 20 + r() * 90, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let v = 0; v < 14; v++) {
    let x = r() * 1024;
    let y = -20;
    ctx.strokeStyle = v < 3 ? "rgba(150,128,96,0.55)" : `rgba(120,118,115,${0.12 + r() * 0.25})`;
    ctx.lineWidth = v < 3 ? 2.2 : 0.6 + r() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    while (y < 1050) {
      x += (r() - 0.45) * 40;
      y += 10 + r() * 30;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  return finish(c);
}

/** Ledger stone — stacked horizontal stone strips. */
export function stoneTexture() {
  const { c, ctx } = canvas(512, 512);
  const r = rng(5);
  ctx.fillStyle = "#6f665c";
  ctx.fillRect(0, 0, 512, 512);
  let y = 0;
  while (y < 512) {
    const h = 14 + r() * 26;
    let x = -r() * 60;
    while (x < 512) {
      const w = 50 + r() * 140;
      const l = 120 + r() * 70;
      ctx.fillStyle = `rgb(${l},${l * 0.94},${l * 0.86})`;
      ctx.fillRect(x + 1.5, y + 1.5, w - 3, h - 3);
      ctx.fillStyle = `rgba(255,255,255,${r() * 0.08})`;
      ctx.fillRect(x + 1.5, y + 1.5, w - 3, 2);
      x += w;
    }
    y += h;
  }
  return finish(c);
}

/** Board-formed concrete / blockwork for the raw construction phase. */
export function concreteTexture(blocks = false) {
  const { c, ctx } = canvas(512, 512);
  const r = rng(blocks ? 21 : 9);
  ctx.fillStyle = "#b7b9ba";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2500; i++) {
    const l = 150 + r() * 60;
    ctx.fillStyle = `rgba(${l},${l},${l + 2},${r() * 0.18})`;
    ctx.fillRect(r() * 512, r() * 512, 1 + r() * 3, 1 + r() * 3);
  }
  ctx.strokeStyle = "rgba(90,92,95,0.45)";
  ctx.lineWidth = 2;
  if (blocks) {
    const bh = 512 / 5;
    for (let row = 0; row < 5; row++) {
      ctx.beginPath();
      ctx.moveTo(0, row * bh);
      ctx.lineTo(512, row * bh);
      ctx.stroke();
      const off = row % 2 ? 128 : 0;
      for (let x = off; x <= 512; x += 256) {
        ctx.beginPath();
        ctx.moveTo(x, row * bh);
        ctx.lineTo(x, row * bh + bh);
        ctx.stroke();
      }
    }
  } else {
    for (let y = 0; y < 512; y += 64) {
      ctx.strokeStyle = "rgba(110,112,115,0.18)";
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
  }
  return finish(c);
}

/** Large-format stone pavers for driveway / terrace. */
export function paverTexture(tone = 168) {
  const { c, ctx } = canvas(512, 512);
  const r = rng(tone);
  ctx.fillStyle = "#4a4743";
  ctx.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 128)
    for (let x = 0; x < 512; x += 256) {
      const l = tone + (r() - 0.5) * 14;
      ctx.fillStyle = `rgb(${l},${l * 0.97},${l * 0.92})`;
      ctx.fillRect(x + 2, y + 2, 252, 124);
    }
  return finish(c);
}

/** Lawn with gentle mowing stripes. */
export function lawnTexture() {
  const { c, ctx } = canvas(512, 512);
  const r = rng(13);
  ctx.fillStyle = "#6f7d4a";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 6000; i++) {
    const g = 100 + r() * 50;
    ctx.fillStyle = `rgba(${g * 0.7},${g},${g * 0.45},0.25)`;
    ctx.fillRect(r() * 512, r() * 512, 1, 2 + r() * 3);
  }
  for (let x = 0; x < 512; x += 128) {
    ctx.fillStyle = "rgba(255,255,230,0.035)";
    ctx.fillRect(x, 0, 64, 512);
  }
  return finish(c);
}

/** Wool rug with a fine border. */
export function rugTexture() {
  const { c, ctx } = canvas(512, 512);
  const r = rng(17);
  ctx.fillStyle = "#d9cfc0";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    const l = 190 + r() * 40;
    ctx.fillStyle = `rgba(${l},${l * 0.95},${l * 0.86},0.35)`;
    ctx.fillRect(r() * 512, r() * 512, 1, 1);
  }
  ctx.strokeStyle = "#a79a86";
  ctx.lineWidth = 6;
  ctx.strokeRect(26, 26, 460, 460);
  return finish(c, true, false);
}

/** Water caustics for the pool. */
export function waterTexture() {
  const { c, ctx } = canvas(512, 512);
  const r = rng(29);
  const g = ctx.createLinearGradient(0, 0, 512, 512);
  g.addColorStop(0, "#3f9fb4");
  g.addColorStop(1, "#2a7d97");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = "rgba(220,250,255,0.18)";
  for (let i = 0; i < 90; i++) {
    ctx.lineWidth = 1 + r() * 2;
    ctx.beginPath();
    const x = r() * 512;
    const y = r() * 512;
    ctx.ellipse(x, y, 12 + r() * 30, 6 + r() * 14, r() * Math.PI, 0, Math.PI * 1.4);
    ctx.stroke();
  }
  return finish(c);
}
