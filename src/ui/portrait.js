// Portrait component — a canvas that draws a Kinbeast from its phenotype and
// keeps a single shared animation loop for every visible portrait.

import { div, span } from './dom.js';
import { drawKinbeast, fitCanvas } from '../render/creature.js';
import { STAGE_INFO } from '../core/kinbeast.js';

const live = new Set();
let running = false;
let reduceMotion = false;

try {
  reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
} catch {
  reduceMotion = false;
}

function tick(now) {
  for (const entry of [...live]) {
    if (!entry.canvas.isConnected) {
      live.delete(entry);
      continue;
    }
    drawKinbeast(entry.ctx, entry.beast, {
      width: entry.w,
      height: entry.h,
      t: reduceMotion ? 0 : now,
      fill: entry.fill,
      shadow: entry.shadow,
    });
  }
  if (live.size) requestAnimationFrame(tick);
  else running = false;
}

function start() {
  if (running) return;
  running = true;
  requestAnimationFrame(tick);
}

/**
 * @param {object} beast
 * @param {number} size CSS pixels (square)
 * @param {object} opts { stage: boolean, fill: number, shadow: boolean }
 */
export function portrait(beast, size = 62, opts = {}) {
  const canvas = document.createElement('canvas');
  const ctx = fitCanvas(canvas, size, size);
  const host = div(
    { class: 'portrait', style: { width: `${size}px`, height: `${size}px` } },
    canvas,
    opts.stage !== false && beast.stage !== 'adult'
      ? span({ class: 'stage-pip' }, STAGE_INFO[beast.stage]?.name ?? beast.stage)
      : null
  );

  const entry = { canvas, ctx, beast, w: size, h: size, fill: opts.fill ?? 0.92, shadow: opts.shadow !== false };
  live.add(entry);
  // Draw once immediately so a portrait is never blank for a frame.
  drawKinbeast(ctx, beast, { width: size, height: size, t: 0, fill: entry.fill, shadow: entry.shadow });
  if (!reduceMotion) start();
  return host;
}

/** A static egg illustration — no genome is revealed until it hatches. */
export function eggPortrait(egg, size = 58) {
  const canvas = document.createElement('canvas');
  const ctx = fitCanvas(canvas, size, size);
  const pct = Math.min(1, egg.progress / egg.needed);
  const cx = size / 2;
  const cy = size / 2 + size * 0.04;
  const r = size * 0.3;

  ctx.clearRect(0, 0, size, size);
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#2c2118';
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 1.15, r * 0.85, r * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 0.78, r * 1.05, 0, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${38 + pct * 40} 34% ${78 - pct * 8}%)`;
  ctx.fill();
  ctx.strokeStyle = 'rgba(90,70,45,0.35)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Speckles, and a hairline crack once it is nearly ready.
  ctx.fillStyle = 'rgba(120,95,60,0.35)';
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.6;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r * 0.4, cy + Math.sin(a) * r * 0.55, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  if (pct > 0.75) {
    ctx.strokeStyle = 'rgba(70,50,30,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.4, cy - r * 0.2);
    ctx.lineTo(cx - r * 0.1, cy + r * 0.05);
    ctx.lineTo(cx - r * 0.3, cy + r * 0.3);
    ctx.stroke();
  }

  return div({ class: 'portrait', style: { width: `${size}px`, height: `${size}px` } }, canvas);
}
