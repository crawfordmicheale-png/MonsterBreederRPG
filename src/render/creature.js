// Procedural Kinbeast art.
//
// Nothing here is hand-drawn per individual. Every creature is assembled from
// its phenotype — size, colours, pattern and the structural features it
// expresses — so two siblings genuinely look like siblings, and a recessive
// gene surfacing four generations later is something you can see.

import { colorToCss } from '../genetics/genome.js';

/** Stable per-creature noise so spots don't crawl around between frames. */
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandoms(seed, count) {
  let s = seed || 1;
  const out = [];
  for (let i = 0; i < count; i++) {
    s = (Math.imul(s ^ (s >>> 15), s | 1) + 0x6d2b79f5) >>> 0;
    out.push(((s ^ (s >>> 14)) >>> 0) / 4294967296);
  }
  return out;
}

function shade(color, dl) {
  return colorToCss(color, dl);
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Draw a Kinbeast into a 2D context.
 * The context is expected to be sized in CSS pixels already (see fitCanvas).
 */
export function drawKinbeast(ctx, beast, opts = {}) {
  const { width, height } = opts;
  const t = opts.t ?? 0;
  const p = beast.phenotype;
  const seed = hashString(beast.id ?? beast.name ?? 'kin');

  const c = {
    primary: p.colors.primary.value,
    secondary: p.colors.secondary.value,
    accent: p.colors.accent.value,
    eye: p.colors.eye.value,
    primaryCo: p.colors.primary.co,
  };

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Ground shadow anchors the creature so it doesn't float.
  if (opts.shadow !== false) {
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#2c2118';
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.88, width * 0.3 * p.sizeFactor, height * 0.045, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Normalise to a 100x100 stage, then apply the creature's build.
  const stage = Math.min(width, height);
  const scale = (stage / 100) * (opts.fill ?? 0.92);
  ctx.translate(width / 2, height * 0.86);
  ctx.scale(scale * p.sizeFactor, scale * p.sizeFactor);

  // Gentle idle breathing.
  const breathe = 1 + Math.sin(t / 900) * 0.014;
  ctx.scale(1, breathe);

  const painter = PAINTERS[p.species.silhouette] ?? PAINTERS.bun;
  painter(ctx, { p, c, seed, t, randoms: seededRandoms(seed, 64) });

  ctx.restore();
}

/** Size a canvas for the device pixel ratio and return its 2D context. */
export function fitCanvas(canvas, cssWidth, cssHeight) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

// ---------------------------------------------------------------------------
// Shared parts
// ---------------------------------------------------------------------------

function blob(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.closePath();
}

function fillBlob(ctx, x, y, rx, ry, color, rot = 0) {
  blob(ctx, x, y, rx, ry, rot);
  ctx.fillStyle = color;
  ctx.fill();
}

function outline(ctx, color, w = 1.4) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.stroke();
}

/** Eyes with the inherited eye colour, plus a highlight so they read as alive. */
function drawEyes(ctx, x, y, spread, r, eyeColor, opts = {}) {
  const blink = opts.blink ?? false;
  for (const dir of [-1, 1]) {
    const ex = x + dir * spread;
    if (blink) {
      ctx.beginPath();
      ctx.moveTo(ex - r, y);
      ctx.lineTo(ex + r, y);
      outline(ctx, '#2a211a', r * 0.5);
      continue;
    }
    fillBlob(ctx, ex, y, r * 1.12, r * 1.25, shade(eyeColor, -6));
    fillBlob(ctx, ex, y + r * 0.1, r * 0.55, r * 0.8, '#211a15');
    fillBlob(ctx, ex - r * 0.35, y - r * 0.42, r * 0.3, r * 0.3, 'rgba(255,255,255,0.85)');
  }
}

/**
 * Pattern overlay. Clipped to whatever path the caller has already traced,
 * so each species keeps its own body outline.
 */
function paintPattern(ctx, { p, c, randoms }, bounds) {
  const key = p.pattern;
  if (key === 'none') return;
  const [x0, y0, x1, y1] = bounds;
  const w = x1 - x0;
  const h = y1 - y0;
  const markColor = p.patternCo ? shade(c.secondary, -14) : shade(c.accent, 0);

  ctx.save();
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = markColor;
  ctx.strokeStyle = markColor;

  switch (key) {
    case 'spots': {
      for (let i = 0; i < 9; i++) {
        const r = 1.6 + randoms[i] * 2.4;
        fillBlob(ctx, x0 + randoms[i + 10] * w, y0 + randoms[i + 20] * h, r, r * 0.9, markColor);
      }
      break;
    }
    case 'stripes': {
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 6; i++) {
        const sx = x0 + (w / 6) * i + randoms[i] * 2;
        ctx.beginPath();
        ctx.moveTo(sx, y0);
        ctx.quadraticCurveTo(sx + 3, y0 + h / 2, sx - 1, y1);
        ctx.stroke();
      }
      break;
    }
    case 'bands': {
      for (let i = 0; i < 4; i++) {
        const by = y0 + (h / 4) * i + 1;
        ctx.fillRect(x0, by, w, 2.6);
      }
      break;
    }
    case 'mottle': {
      ctx.globalAlpha = 0.45;
      for (let i = 0; i < 12; i++) {
        const r = 2 + randoms[i + 5] * 4;
        fillBlob(ctx, x0 + randoms[i + 15] * w, y0 + randoms[i + 25] * h, r, r * 0.7, markColor, randoms[i] * 3);
      }
      break;
    }
    case 'mask': {
      ctx.globalAlpha = 0.6;
      fillBlob(ctx, (x0 + x1) / 2, y0 + h * 0.22, w * 0.34, h * 0.18, markColor);
      break;
    }
    case 'veining': {
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 7; i++) {
        const sx = x0 + randoms[i + 30] * w;
        const sy = y0 + randoms[i + 40] * h;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + (randoms[i] - 0.5) * 10, sy + (randoms[i + 1] - 0.5) * 10);
        ctx.lineTo(sx + (randoms[i + 2] - 0.5) * 16, sy + (randoms[i + 3] - 0.5) * 14);
        ctx.stroke();
      }
      break;
    }
    case 'luminous': {
      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = markColor;
      for (let i = 0; i < 8; i++) {
        fillBlob(ctx, x0 + randoms[i + 12] * w, y0 + randoms[i + 22] * h, 1.5, 1.5, markColor);
      }
      ctx.restore();
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

/** Codominant primary colour shows as a second wash across half the body. */
function paintCodominant(ctx, { p, c }, bounds) {
  if (!c.primaryCo) return;
  const [x0, y0, x1, y1] = bounds;
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = colorToCss(c.primaryCo);
  ctx.beginPath();
  ctx.moveTo((x0 + x1) / 2, y0 - 4);
  ctx.lineTo(x1 + 4, y0 - 4);
  ctx.lineTo(x1 + 4, y1 + 4);
  ctx.lineTo((x0 + x1) / 2 - 3, y1 + 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// --- feature parts -------------------------------------------------------

function drawEars(ctx, kind, { c }, x, y, spread, scaleY = 1) {
  const inner = shade(c.secondary, 6);
  const outer = shade(c.primary, -6);
  for (const dir of [-1, 1]) {
    const ex = x + dir * spread;
    ctx.save();
    ctx.translate(ex, y);
    ctx.rotate(dir * 0.22);
    switch (kind) {
      case 'ears_leaf':
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(dir * 5, -13 * scaleY, 0, -19 * scaleY);
        ctx.quadraticCurveTo(-dir * 5, -13 * scaleY, 0, 0);
        ctx.fillStyle = outer;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.lineTo(0, -16 * scaleY);
        outline(ctx, inner, 1);
        break;
      case 'ears_long':
        fillBlob(ctx, 0, -12 * scaleY, 3.1, 13 * scaleY, outer, dir * 0.12);
        fillBlob(ctx, 0, -12 * scaleY, 1.4, 9 * scaleY, inner, dir * 0.12);
        break;
      case 'ears_tuft':
        ctx.beginPath();
        ctx.moveTo(-3.4, 1);
        ctx.lineTo(0, -11 * scaleY);
        ctx.lineTo(3.4, 1);
        ctx.closePath();
        ctx.fillStyle = outer;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-1.7, 0.5);
        ctx.lineTo(0, -7 * scaleY);
        ctx.lineTo(1.7, 0.5);
        ctx.closePath();
        ctx.fillStyle = inner;
        ctx.fill();
        break;
      case 'ears_fin':
        ctx.beginPath();
        ctx.moveTo(-3, 1);
        ctx.quadraticCurveTo(dir * 8, -8 * scaleY, 4, -6 * scaleY);
        ctx.quadraticCurveTo(1, -1, -3, 1);
        ctx.fillStyle = outer;
        ctx.fill();
        break;
      case 'ears_round':
      default:
        fillBlob(ctx, 0, -5 * scaleY, 4.2, 4.6 * scaleY, outer);
        fillBlob(ctx, 0, -5 * scaleY, 2.2, 2.5 * scaleY, inner);
        break;
    }
    ctx.restore();
  }
}

function drawTail(ctx, kind, { c, p, t }, x, y, dir = 1) {
  const sway = Math.sin(t / 620) * 0.16;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(sway * dir);
  switch (kind) {
    case 'tail_ember': {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(dir * 14, -6, dir * 17, -20);
      ctx.quadraticCurveTo(dir * 8, -10, 0, 5);
      ctx.fillStyle = shade(c.primary, -4);
      ctx.fill();
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = colorToCss(c.accent, 12);
      fillBlob(ctx, dir * 16, -20, 4.2, 5, colorToCss(c.accent, 16));
      ctx.restore();
      break;
    }
    case 'tail_bush':
      fillBlob(ctx, dir * 11, -3, 8.5, 6, shade(c.primary, -5), dir * 0.5);
      fillBlob(ctx, dir * 15, -7, 4.5, 3.6, shade(c.secondary, 4), dir * 0.5);
      break;
    case 'tail_paddle':
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(dir * 12, 2, dir * 19, -6);
      ctx.quadraticCurveTo(dir * 12, 6, 0, 4);
      ctx.fillStyle = shade(c.accent, 8);
      ctx.fill();
      break;
    case 'tail_plume':
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(dir * 10, -4 + i * 4, dir * 20, -10 + i * 8);
        outline(ctx, i === 0 ? shade(c.accent, 4) : shade(c.secondary, -2), 3.4);
      }
      break;
    case 'tail_stub':
    default:
      fillBlob(ctx, dir * 7, -1, 4, 3.6, shade(c.secondary, 2));
      break;
  }
  ctx.restore();
}

function drawCrest(ctx, kind, { c, t }, x, y) {
  const flutter = Math.sin(t / 500) * 0.1;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(flutter);
  switch (kind) {
    case 'crest_fan':
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(i * 2.4, -9, i * 4.6, -15);
        outline(ctx, i === 0 ? shade(c.accent, 6) : shade(c.secondary, -4), 2.6);
      }
      break;
    case 'crest_sweep':
      ctx.beginPath();
      ctx.moveTo(-2, 0);
      ctx.quadraticCurveTo(4, -12, 14, -14);
      ctx.quadraticCurveTo(4, -6, 2, 0);
      ctx.fillStyle = shade(c.accent, 4);
      ctx.fill();
      break;
    case 'crest_moss':
      for (let i = -1; i <= 1; i++) {
        fillBlob(ctx, i * 4, -4 - Math.abs(i), 3.4, 2.6, shade(c.accent, i === 0 ? 6 : -2));
      }
      break;
    default:
      break;
  }
  ctx.restore();
}

function drawGlow(ctx, kind, { c, t }, x, y, r) {
  if (kind === 'glow_none' || !kind) return;
  const pulse = 0.65 + Math.sin(t / 700) * 0.25;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.shadowBlur = 18;
  ctx.shadowColor = colorToCss(c.accent, 18);
  if (kind === 'glow_lantern') {
    fillBlob(ctx, x, y, r, r * 0.85, colorToCss(c.accent, 20));
  } else {
    for (let i = 0; i < 5; i++) {
      fillBlob(ctx, x + (i - 2) * r * 0.5, y + Math.sin(i) * r * 0.3, r * 0.22, r * 0.22, colorToCss(c.accent, 22));
    }
  }
  ctx.restore();
}

function drawWings(ctx, kind, { c, t }, x, y) {
  const flap = Math.sin(t / 420) * 0.18;
  const long = kind === 'wing_broad' ? 1 : 0.72;
  for (const dir of [-1, 1]) {
    ctx.save();
    ctx.translate(x + dir * 6, y);
    ctx.rotate(dir * (0.35 + flap));
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(dir * 16 * long, -10, dir * 24 * long, 4);
    ctx.quadraticCurveTo(dir * 12 * long, 6, 0, 6);
    ctx.closePath();
    ctx.fillStyle = shade(c.secondary, -6);
    ctx.fill();
    outline(ctx, shade(c.primary, -14), 0.9);
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Species painters — each returns a body outline for pattern clipping
// ---------------------------------------------------------------------------

const PAINTERS = {
  // Mossbun: round hare, sits low, leaf ears.
  bun(ctx, s) {
    const { p, c, t } = s;
    const bodyY = -20;
    drawTail(ctx, p.features.tail ?? 'tail_stub', s, -18, -12, -1);

    blob(ctx, 0, bodyY, 22, 19);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = colorToCss(c.primary);
    ctx.fillRect(-40, -60, 80, 80);
    paintCodominant(ctx, s, [-22, bodyY - 19, 22, bodyY + 19]);
    paintPattern(ctx, s, [-20, bodyY - 16, 20, bodyY + 14]);
    ctx.restore();
    fillBlob(ctx, 0, bodyY + 8, 13, 9, shade(c.secondary, 6));

    drawEars(ctx, p.features.ears ?? 'ears_leaf', s, 0, bodyY - 15, 7);
    drawCrest(ctx, p.features.crest ?? 'crest_none', s, 0, bodyY - 17);

    fillBlob(ctx, 0, bodyY - 3, 13, 11, colorToCss(c.primary, 4));
    drawEyes(ctx, 0, bodyY - 4, 5.4, 2.1, c.eye);
    fillBlob(ctx, 0, bodyY + 1.5, 1.5, 1.1, shade(c.accent, -10));
    // Feet.
    for (const dir of [-1, 1]) fillBlob(ctx, dir * 10, -2.5, 5.5, 3, shade(c.secondary, -4));
    drawGlow(ctx, p.features.glow, s, 0, bodyY + 6, 4);
  },

  // Cinderkit: lean fox on four legs, long ember tail.
  fox(ctx, s) {
    const { p, c, t } = s;
    const bodyY = -22;
    drawTail(ctx, p.features.tail ?? 'tail_ember', s, -16, -16, -1);

    // Legs.
    for (const dx of [-12, -5, 6, 13]) {
      ctx.fillStyle = shade(c.accent, -6);
      ctx.fillRect(dx - 1.8, bodyY + 10, 3.6, 14);
    }

    blob(ctx, 0, bodyY, 23, 13.5, -0.06);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = colorToCss(c.primary);
    ctx.fillRect(-40, -60, 80, 80);
    paintCodominant(ctx, s, [-23, bodyY - 13, 23, bodyY + 13]);
    paintPattern(ctx, s, [-20, bodyY - 11, 20, bodyY + 10]);
    ctx.restore();
    fillBlob(ctx, 2, bodyY + 6, 15, 6, shade(c.secondary, 6));

    // Head, forward and slightly high.
    const hx = 17, hy = bodyY - 9;
    fillBlob(ctx, hx, hy, 10.5, 9, colorToCss(c.primary, 3));
    ctx.beginPath();
    ctx.moveTo(hx + 6, hy + 1);
    ctx.lineTo(hx + 16, hy + 4);
    ctx.lineTo(hx + 5, hy + 6);
    ctx.closePath();
    ctx.fillStyle = shade(c.secondary, 2);
    ctx.fill();
    fillBlob(ctx, hx + 15.5, hy + 4, 1.4, 1.1, shade(c.accent, -14));
    drawEars(ctx, p.features.ears ?? 'ears_tuft', s, hx, hy - 6, 5);
    drawEyes(ctx, hx + 2, hy - 0.5, 4.2, 1.8, c.eye);
    drawGlow(ctx, p.features.glow, s, 0, bodyY, 4);
  },

  // Brookfin: otter, upright-ish, paddle tail.
  otter(ctx, s) {
    const { p, c } = s;
    const bodyY = -24;
    drawTail(ctx, p.features.tail ?? 'tail_paddle', s, -16, -8, -1);

    blob(ctx, 0, bodyY, 16, 21, 0.05);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = colorToCss(c.primary);
    ctx.fillRect(-40, -60, 80, 80);
    paintCodominant(ctx, s, [-16, bodyY - 21, 16, bodyY + 21]);
    paintPattern(ctx, s, [-14, bodyY - 16, 14, bodyY + 16]);
    ctx.restore();
    fillBlob(ctx, 0, bodyY + 6, 10, 13, shade(c.secondary, 8));

    // Webbed paws.
    for (const dir of [-1, 1]) {
      fillBlob(ctx, dir * 13, bodyY + 4, 4.6, 3.2, shade(c.accent, 4), dir * 0.4);
      fillBlob(ctx, dir * 7, -3, 5.4, 3.2, shade(c.accent, -2));
    }

    const hy = bodyY - 18;
    fillBlob(ctx, 0, hy, 11, 9.5, colorToCss(c.primary, 4));
    fillBlob(ctx, 0, hy + 4, 6, 4.4, shade(c.secondary, 8));
    drawEars(ctx, p.features.ears ?? 'ears_fin', s, 0, hy - 6, 7.5);
    drawEyes(ctx, 0, hy - 1.5, 4.4, 1.9, c.eye);
    fillBlob(ctx, 0, hy + 3, 1.6, 1.2, shade(c.accent, -16));
    drawGlow(ctx, p.features.glow, s, 0, bodyY + 4, 3.4);
  },

  // Pebbleback: low, wide, heavy shell.
  armadillo(ctx, s) {
    const { p, c, randoms } = s;
    const bodyY = -16;
    drawTail(ctx, p.features.tail ?? 'tail_stub', s, -20, -8, -1);

    // Soft under-body.
    fillBlob(ctx, 0, bodyY + 6, 24, 10, shade(c.secondary, 2));
    for (const dx of [-15, -6, 6, 15]) fillBlob(ctx, dx, -3, 4.4, 3.4, shade(c.accent, -8));

    // Shell.
    const shellKind = p.features.shell ?? 'shell_plate';
    blob(ctx, 0, bodyY, 26, 17);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = colorToCss(c.primary);
    ctx.fillRect(-40, -60, 80, 80);
    paintCodominant(ctx, s, [-26, bodyY - 17, 26, bodyY + 17]);
    if (shellKind === 'shell_plate') {
      ctx.strokeStyle = shade(c.accent, -8);
      ctx.lineWidth = 1.6;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc(i * 9, bodyY + 16, 17, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      }
    } else if (shellKind === 'shell_ridge') {
      ctx.fillStyle = shade(c.accent, -6);
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 7, bodyY + 12);
        ctx.lineTo(i * 7 + 3, bodyY - 14);
        ctx.lineTo(i * 7 - 3, bodyY - 14);
        ctx.closePath();
        ctx.fill();
      }
    }
    paintPattern(ctx, s, [-22, bodyY - 14, 22, bodyY + 10]);
    ctx.restore();
    blob(ctx, 0, bodyY, 26, 17);
    outline(ctx, shade(c.accent, -18), 1.6);

    const hx = 22, hy = bodyY + 4;
    fillBlob(ctx, hx, hy, 9, 7.5, colorToCss(c.secondary, -2));
    fillBlob(ctx, hx + 6, hy + 2, 4.6, 3.4, shade(c.secondary, -6));
    drawEars(ctx, p.features.ears ?? 'ears_round', s, hx - 2, hy - 6, 4, 0.8);
    drawEyes(ctx, hx + 1, hy - 1, 3.6, 1.6, c.eye);
    drawGlow(ctx, p.features.glow, s, 0, bodyY, 4);
  },

  // Galecrest: long-legged bird.
  bird(ctx, s) {
    const { p, c, t } = s;
    const bodyY = -30;

    // Legs.
    ctx.strokeStyle = shade(c.accent, -4);
    ctx.lineWidth = 2.4;
    for (const dx of [-5, 5]) {
      ctx.beginPath();
      ctx.moveTo(dx, bodyY + 12);
      ctx.lineTo(dx + Math.sin(t / 900 + dx) * 1.5, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(dx - 3, 0);
      ctx.lineTo(dx + 4, 0);
      ctx.stroke();
    }

    drawTail(ctx, p.features.tail ?? 'tail_plume', s, -12, bodyY + 6, -1);

    blob(ctx, 0, bodyY, 15, 17, 0.1);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = colorToCss(c.primary);
    ctx.fillRect(-40, -70, 80, 90);
    paintCodominant(ctx, s, [-15, bodyY - 17, 15, bodyY + 17]);
    paintPattern(ctx, s, [-13, bodyY - 13, 13, bodyY + 13]);
    ctx.restore();
    fillBlob(ctx, 1, bodyY + 6, 9, 9, shade(c.secondary, 8));

    drawWings(ctx, p.features.wing ?? 'wing_narrow', s, 0, bodyY - 2);

    // Neck and head.
    ctx.strokeStyle = colorToCss(c.primary, 2);
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(2, bodyY - 10);
    ctx.quadraticCurveTo(8, bodyY - 22, 5, bodyY - 30);
    ctx.stroke();
    ctx.lineCap = 'butt';

    const hx = 5, hy = bodyY - 32;
    fillBlob(ctx, hx, hy, 8, 7, colorToCss(c.primary, 4));
    ctx.beginPath();
    ctx.moveTo(hx + 5, hy);
    ctx.lineTo(hx + 15, hy + 2.5);
    ctx.lineTo(hx + 5, hy + 4.5);
    ctx.closePath();
    ctx.fillStyle = shade(c.accent, 8);
    ctx.fill();
    drawCrest(ctx, p.features.crest ?? 'crest_fan', s, hx - 1, hy - 6);
    drawEyes(ctx, hx + 1, hy - 0.5, 3.4, 1.6, c.eye);
    drawGlow(ctx, p.features.glow, s, 0, bodyY, 3.6);
  },

  // Glowgrub: segmented larva with a lantern abdomen.
  grub(ctx, s) {
    const { p, c, t } = s;
    const bodyY = -16;
    const segments = 5;

    for (let i = segments - 1; i >= 0; i--) {
      const x = -18 + i * 8.5;
      const r = 11 - Math.abs(i - 2) * 1.1;
      const bob = Math.sin(t / 700 + i * 0.7) * 0.8;
      fillBlob(ctx, x, bodyY + bob, r * 0.72, r, shade(c.primary, i % 2 ? -4 : 0));
    }

    blob(ctx, -4, bodyY, 22, 12, 0);
    ctx.save();
    ctx.clip();
    paintCodominant(ctx, s, [-26, bodyY - 12, 18, bodyY + 12]);
    paintPattern(ctx, s, [-24, bodyY - 9, 16, bodyY + 9]);
    ctx.restore();

    // Lantern abdomen at the rear.
    drawGlow(ctx, p.features.glow ?? 'glow_lantern', s, -19, bodyY, 8);

    const hx = 17, hy = bodyY - 1;
    fillBlob(ctx, hx, hy, 10, 9.5, colorToCss(c.secondary, 2));
    drawCrest(ctx, p.features.crest ?? 'crest_none', s, hx, hy - 8);
    // Antennae.
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(hx + 2, hy - 7);
      ctx.quadraticCurveTo(hx + 6, hy - 15 + dir * 2, hx + 11, hy - 13 + dir * 5);
      outline(ctx, shade(c.accent, -6), 1.3);
    }
    drawEyes(ctx, hx + 1, hy - 1, 4, 2, c.eye);
    fillBlob(ctx, hx + 6, hy + 4, 3.4, 2.2, shade(c.accent, -8));
  },
};

export const SILHOUETTES = Object.keys(PAINTERS);
