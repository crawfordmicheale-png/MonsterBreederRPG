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
    case 'tail_barb':
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(dir * 9, -2, dir * 15, -7);
      outline(ctx, shade(c.primary, -6), 3);
      ctx.beginPath();
      ctx.moveTo(dir * 13, -5);
      ctx.lineTo(dir * 20, -10);
      ctx.lineTo(dir * 13, -9);
      ctx.closePath();
      ctx.fillStyle = shade(c.accent, 6);
      ctx.fill();
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
    case 'crest_frill':
      ctx.beginPath();
      ctx.moveTo(-6, 1);
      for (let i = -2; i <= 2; i++) {
        ctx.quadraticCurveTo(i * 3, -9, i * 3 + 1.5, -1);
      }
      ctx.lineTo(6, 1);
      ctx.closePath();
      ctx.fillStyle = shade(c.secondary, 4);
      ctx.fill();
      outline(ctx, shade(c.accent, -4), 0.8);
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
  const gauze = kind === 'wing_gauze' || kind === 'wing_veined';
  const flap = Math.sin(t / (gauze ? 130 : 420)) * (gauze ? 0.3 : 0.18);
  const long = kind === 'wing_broad' ? 1 : gauze ? 1.1 : 0.72;
  for (const dir of [-1, 1]) {
    // Gauze wings come in pairs, the way a dragonfly's do.
    for (const pair of gauze ? [0, 1] : [0]) {
      ctx.save();
      ctx.translate(x + dir * 6 - pair * dir * 3, y + pair * 4);
      ctx.rotate(dir * (0.35 + flap - pair * 0.4));
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(dir * 16 * long, -10, dir * 24 * long, 4);
      ctx.quadraticCurveTo(dir * 12 * long, 6, 0, 6);
      ctx.closePath();
      if (gauze) {
        ctx.globalAlpha = kind === 'wing_veined' ? 0.58 : 0.42;
        ctx.fillStyle = colorToCss(c.secondary, 16);
        ctx.fill();
        ctx.globalAlpha = 0.8;
        outline(ctx, shade(c.accent, 6), 0.7);
      } else {
        ctx.fillStyle = shade(c.secondary, -6);
        ctx.fill();
        outline(ctx, shade(c.primary, -14), 0.9);
      }
      ctx.restore();
    }
  }
}

function drawHorns(ctx, kind, { c }, x, y, spread) {
  if (!kind || kind === 'horn_none') return;
  const horn = shade(c.accent, 10);
  for (const dir of [-1, 1]) {
    ctx.save();
    ctx.translate(x + dir * spread, y);
    ctx.scale(dir, 1);
    switch (kind) {
      case 'horn_tusk':
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(4, -3, 4.5, -10);
        ctx.quadraticCurveTo(2.4, -4, 0, 1.6);
        ctx.fillStyle = horn;
        ctx.fill();
        break;
      case 'horn_curl':
        ctx.beginPath();
        ctx.arc(2.5, -4, 4.2, Math.PI * 0.9, Math.PI * 2.1);
        outline(ctx, horn, 2.6);
        break;
      case 'horn_spike':
        ctx.beginPath();
        ctx.moveTo(-1.6, 0);
        ctx.lineTo(1.4, -9);
        ctx.lineTo(2.2, 0);
        ctx.closePath();
        ctx.fillStyle = horn;
        ctx.fill();
        break;
      case 'horn_branch':
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(2, -8);
        ctx.moveTo(1.2, -5);
        ctx.lineTo(5, -7.5);
        ctx.moveTo(1.8, -7);
        ctx.lineTo(-1.5, -10);
        outline(ctx, horn, 1.5);
        break;
      default:
        break;
    }
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

  // Brambletusk: heavy boar, low head, tusks.
  boar(ctx, s) {
    const { p, c } = s;
    const bodyY = -22;
    drawTail(ctx, p.features.tail ?? 'tail_stub', s, -22, -14, -1);

    for (const dx of [-14, -7, 8, 15]) {
      ctx.fillStyle = shade(c.accent, -8);
      ctx.fillRect(dx - 2.2, bodyY + 11, 4.4, 13);
    }

    blob(ctx, -2, bodyY, 25, 16, -0.08);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = colorToCss(c.primary);
    ctx.fillRect(-40, -60, 80, 80);
    paintCodominant(ctx, s, [-27, bodyY - 16, 23, bodyY + 16]);
    paintPattern(ctx, s, [-24, bodyY - 13, 20, bodyY + 12]);
    ctx.restore();

    // Bark shoulders — the identifying feature.
    ctx.fillStyle = shade(c.secondary, -10);
    for (let i = 0; i < 4; i++) {
      fillBlob(ctx, -12 + i * 5, bodyY - 11 + Math.abs(i - 1.5) * 1.4, 4, 2.6, shade(c.secondary, -8 + i));
    }

    const hx = 19, hy = bodyY + 3;
    fillBlob(ctx, hx, hy, 11, 9, colorToCss(c.primary, 3));
    ctx.beginPath();
    ctx.moveTo(hx + 5, hy - 1);
    ctx.lineTo(hx + 14, hy + 3);
    ctx.lineTo(hx + 5, hy + 6);
    ctx.closePath();
    ctx.fillStyle = shade(c.secondary, 4);
    ctx.fill();
    drawHorns(ctx, p.features.horn ?? 'horn_tusk', s, hx + 10, hy + 4, 2.6);
    drawEars(ctx, p.features.ears ?? 'ears_round', s, hx - 2, hy - 7, 5, 0.85);
    drawCrest(ctx, p.features.crest ?? 'crest_none', s, hx - 6, hy - 10);
    drawEyes(ctx, hx + 1, hy - 2, 4, 1.6, c.eye);
  },

  // Mudsprig: squat amphibian, sprout on the head.
  frog(ctx, s) {
    const { p, c, t } = s;
    const bodyY = -14;
    drawTail(ctx, p.features.tail ?? 'tail_paddle', s, -16, -6, -1);

    // Splayed legs.
    for (const dir of [-1, 1]) {
      fillBlob(ctx, dir * 17, -4, 6.5, 3.6, shade(c.accent, -2), dir * 0.5);
      fillBlob(ctx, dir * 12, -2, 5, 3, shade(c.secondary, -6));
    }

    blob(ctx, 0, bodyY, 19, 13);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = colorToCss(c.primary);
    ctx.fillRect(-40, -60, 80, 80);
    paintCodominant(ctx, s, [-19, bodyY - 13, 19, bodyY + 13]);
    paintPattern(ctx, s, [-17, bodyY - 10, 17, bodyY + 10]);
    ctx.restore();
    fillBlob(ctx, 0, bodyY + 6, 12, 6, shade(c.secondary, 8));

    const hy = bodyY - 10;
    fillBlob(ctx, 0, hy, 13, 8.5, colorToCss(c.primary, 4));
    // Wide amphibian mouth.
    ctx.beginPath();
    ctx.arc(0, hy + 2, 7, 0.18 * Math.PI, 0.82 * Math.PI);
    outline(ctx, shade(c.accent, -14), 1.2);
    // Eyes sit high and proud of the skull.
    for (const dir of [-1, 1]) fillBlob(ctx, dir * 6, hy - 6, 4, 4, colorToCss(c.primary, 8));
    drawEyes(ctx, 0, hy - 6.5, 6, 2.2, c.eye);
    drawCrest(ctx, p.features.crest ?? 'crest_moss', s, 0, hy - 11 + Math.sin(t / 800) * 0.6);
    drawGlow(ctx, p.features.glow, s, 0, bodyY + 3, 3.6);
  },

  // Sparkmidge: long segmented abdomen, four gauze wings.
  dragonfly(ctx, s) {
    const { p, c, t } = s;
    const bodyY = -30;
    const hover = Math.sin(t / 260) * 1.6;
    ctx.translate(0, hover);

    // Abdomen trailing behind.
    for (let i = 0; i < 6; i++) {
      const x = -6 - i * 5.5;
      fillBlob(ctx, x, bodyY + i * 0.7, 3.2 - i * 0.18, 2.8 - i * 0.2, shade(c.primary, i % 2 ? -6 : 0));
    }
    drawGlow(ctx, p.features.glow ?? 'glow_speckle', s, -20, bodyY + 2, 4.5);

    drawWings(ctx, p.features.wing ?? 'wing_gauze', s, 0, bodyY - 3);

    blob(ctx, 0, bodyY, 9, 7);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = colorToCss(c.primary);
    ctx.fillRect(-40, -60, 80, 80);
    paintPattern(ctx, s, [-9, bodyY - 7, 9, bodyY + 7]);
    ctx.restore();

    // Legs tucked under, the way a hovering insect holds them.
    ctx.strokeStyle = shade(c.accent, -10);
    ctx.lineWidth = 1.2;
    for (const dx of [-3, 0, 3]) {
      ctx.beginPath();
      ctx.moveTo(dx, bodyY + 5);
      ctx.quadraticCurveTo(dx + 2, bodyY + 11, dx - 1, bodyY + 14);
      ctx.stroke();
    }

    const hx = 11, hy = bodyY - 2;
    fillBlob(ctx, hx, hy, 7.5, 7, colorToCss(c.secondary, 2));
    // Compound eyes take up most of the head.
    for (const dir of [-1, 1]) fillBlob(ctx, hx + 2, hy + dir * 3.4, 4.4, 3.6, shade(c.eye, dir * 4));
    fillBlob(ctx, hx + 3.5, hy - 3.6, 1.4, 1.2, 'rgba(255,255,255,0.8)');
  },

  // Duskmew: low feline, edges deliberately soft.
  cat(ctx, s) {
    const { p, c, t } = s;
    const bodyY = -24;

    // A faint smoke halo — the blurred-edge fur from the description.
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.filter = 'blur(3px)';
    fillBlob(ctx, 0, bodyY, 26, 16, colorToCss(c.accent, 10));
    ctx.restore();

    drawTail(ctx, p.features.tail ?? 'tail_bush', s, -17, -18, -1);

    for (const dx of [-11, -4, 7, 14]) {
      ctx.fillStyle = shade(c.accent, -8);
      ctx.fillRect(dx - 1.6, bodyY + 9, 3.2, 15);
    }

    blob(ctx, 0, bodyY, 21, 11, -0.05);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = colorToCss(c.primary);
    ctx.fillRect(-40, -60, 80, 80);
    paintCodominant(ctx, s, [-21, bodyY - 11, 21, bodyY + 11]);
    paintPattern(ctx, s, [-19, bodyY - 9, 19, bodyY + 9]);
    ctx.restore();
    fillBlob(ctx, 1, bodyY + 5, 13, 5, shade(c.secondary, 6));

    const hx = 16, hy = bodyY - 8;
    fillBlob(ctx, hx, hy, 9.5, 8.5, colorToCss(c.primary, 4));
    fillBlob(ctx, hx + 4, hy + 3, 5, 3.6, shade(c.secondary, 4));
    drawEars(ctx, p.features.ears ?? 'ears_tuft', s, hx, hy - 6, 5.2);
    // Crescent pupils.
    for (const dir of [-1, 1]) {
      const ex = hx + 1 + dir * 4.2;
      fillBlob(ctx, ex, hy - 1, 2.4, 2.6, shade(c.eye, -4));
      ctx.beginPath();
      ctx.arc(ex + 0.7, hy - 1, 1.7, Math.PI * 0.55, Math.PI * 1.45);
      outline(ctx, '#1d1720', 1.1);
    }
    fillBlob(ctx, hx + 5.4, hy + 2, 1.2, 0.9, shade(c.accent, -12));
    drawGlow(ctx, p.features.glow, s, 0, bodyY, 3.4);
  },

  // Shellip: wide scalloped shell, paddle feet.
  turtle(ctx, s) {
    const { p, c } = s;
    const bodyY = -15;
    drawTail(ctx, p.features.tail ?? 'tail_paddle', s, -21, -7, -1);

    // Paddle limbs.
    for (const dir of [-1, 1]) {
      fillBlob(ctx, dir * 19, -4, 7, 3.8, shade(c.accent, 6), dir * 0.45);
      fillBlob(ctx, dir * 11, -3, 5.4, 3.2, shade(c.accent, 2));
    }
    fillBlob(ctx, 0, bodyY + 8, 21, 7, shade(c.secondary, 4));

    const shellKind = p.features.shell ?? 'shell_ridge';
    blob(ctx, 0, bodyY, 24, 15);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = colorToCss(c.primary);
    ctx.fillRect(-40, -60, 80, 80);
    paintCodominant(ctx, s, [-24, bodyY - 15, 24, bodyY + 15]);
    if (shellKind === 'shell_ridge') {
      ctx.strokeStyle = shade(c.accent, -6);
      ctx.lineWidth = 1.5;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 8, bodyY - 14);
        ctx.quadraticCurveTo(i * 9.5, bodyY, i * 8, bodyY + 13);
        ctx.stroke();
      }
    } else if (shellKind === 'shell_plate') {
      ctx.strokeStyle = shade(c.accent, -8);
      ctx.lineWidth = 1.5;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.ellipse(i * 11, bodyY, 7, 10, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    paintPattern(ctx, s, [-21, bodyY - 12, 21, bodyY + 10]);
    ctx.restore();

    // Scalloped rim.
    ctx.strokeStyle = shade(c.accent, -16);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = -5; i <= 5; i++) ctx.arc(i * 4.6, bodyY + 13, 2.4, Math.PI, 0);
    ctx.stroke();
    blob(ctx, 0, bodyY, 24, 15);
    outline(ctx, shade(c.accent, -18), 1.5);

    const hx = 21, hy = bodyY + 5;
    fillBlob(ctx, hx, hy, 8.5, 7, colorToCss(c.secondary, -2));
    fillBlob(ctx, hx + 5, hy + 2, 4.4, 3.2, shade(c.secondary, -6));
    drawEars(ctx, p.features.ears ?? 'ears_fin', s, hx - 2, hy - 5, 4, 0.8);
    drawEyes(ctx, hx + 1, hy - 1.5, 3.4, 1.6, c.eye);
  },

  // Embermole: bulk at the front, furnace lines under the fur.
  mole(ctx, s) {
    const { p, c, t } = s;
    const bodyY = -20;
    drawTail(ctx, p.features.tail ?? 'tail_stub', s, -21, -12, -1);

    blob(ctx, -1, bodyY, 24, 15, -0.04);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = colorToCss(c.primary);
    ctx.fillRect(-40, -60, 80, 80);
    paintCodominant(ctx, s, [-25, bodyY - 15, 23, bodyY + 15]);

    // Furnace lines: the identifying feature, glowing through the coat.
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = colorToCss(c.accent, 14);
    ctx.strokeStyle = colorToCss(c.accent, 10);
    ctx.lineWidth = 1.8;
    const pulse = 0.55 + Math.sin(t / 620) * 0.25;
    ctx.globalAlpha = pulse;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 8 - 3, bodyY - 12);
      ctx.quadraticCurveTo(i * 8 + 2, bodyY, i * 8 - 2, bodyY + 11);
      ctx.stroke();
    }
    ctx.restore();
    paintPattern(ctx, s, [-22, bodyY - 12, 20, bodyY + 11]);
    ctx.restore();
    fillBlob(ctx, -2, bodyY + 7, 15, 6, shade(c.secondary, 2));

    // Digging claws.
    for (const dir of [-1, 1]) {
      const cx = 8 + dir * 5;
      fillBlob(ctx, cx, -3, 5.6, 3.6, shade(c.secondary, -8));
      ctx.strokeStyle = shade(c.accent, 14);
      ctx.lineWidth = 1.4;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + 3, -4 + i * 1.8);
        ctx.lineTo(cx + 8, -5 + i * 2.4);
        ctx.stroke();
      }
    }

    const hx = 18, hy = bodyY - 1;
    fillBlob(ctx, hx, hy, 10, 8.5, colorToCss(c.primary, 4));
    // Blunt snout.
    ctx.beginPath();
    ctx.moveTo(hx + 5, hy - 2);
    ctx.lineTo(hx + 13, hy + 1);
    ctx.lineTo(hx + 5, hy + 5);
    ctx.closePath();
    ctx.fillStyle = shade(c.secondary, -4);
    ctx.fill();
    fillBlob(ctx, hx + 12, hy + 1, 2, 1.6, shade(c.accent, -6));
    drawHorns(ctx, p.features.horn ?? 'horn_none', s, hx, hy - 7, 3.5);
    drawEars(ctx, p.features.ears ?? 'ears_round', s, hx - 3, hy - 6, 4.4, 0.75);
    // Mole eyes are small and mostly closed.
    drawEyes(ctx, hx, hy - 1, 4, 1.2, c.eye, { blink: true });
    drawGlow(ctx, p.features.glow, s, -12, bodyY, 4.5);
  },

  // Echoryx: small adaptive quadruped — oversized ears, luminous markings,
  // soft unimpressive body that holds whatever glow it has borrowed.
  echo(ctx, s) {
    const { p, c, t, randoms } = s;
    const bodyY = -18;
    const sway = Math.sin((t ?? 0) / 700) * 1.2;

    drawTail(ctx, p.features.tail ?? 'tail_stub', s, -14, -10, -1);

    // Soft underglow — the adaptive tell.
    ctx.save();
    ctx.globalAlpha = 0.22 + Math.sin((t ?? 0) / 500) * 0.06;
    fillBlob(ctx, 0, bodyY + 4, 26, 14, shade(c.accent, 8));
    ctx.restore();

    blob(ctx, 0, bodyY, 18, 15);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = colorToCss(c.primary);
    ctx.fillRect(-40, -60, 80, 80);
    paintCodominant(ctx, s, [-18, bodyY - 15, 18, bodyY + 15]);
    paintPattern(ctx, s, [-16, bodyY - 12, 16, bodyY + 12]);
    // Drifted markings — little borrowed flecks.
    ctx.fillStyle = shade(c.accent, 4);
    for (let i = 0; i < 7; i++) {
      const rx = (randoms[i] - 0.5) * 28;
      const ry = bodyY - 8 + randoms[i + 7] * 18;
      fillBlob(ctx, rx, ry, 1.6 + randoms[i + 14] * 1.8, 1.2, shade(c.accent, 10));
    }
    ctx.restore();

    fillBlob(ctx, 0, bodyY + 6, 11, 7, shade(c.secondary, 6));

    // Oversized adaptive ears — the silhouette cue.
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.translate(dir * 7, bodyY - 14 + sway * dir * 0.3);
      ctx.rotate(dir * 0.18);
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.quadraticCurveTo(dir * 8, -18, dir * 2, -26);
      ctx.quadraticCurveTo(dir * -1, -10, 0, 4);
      ctx.closePath();
      ctx.fillStyle = colorToCss(c.primary, 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.quadraticCurveTo(dir * 4, -14, dir * 1, -20);
      ctx.quadraticCurveTo(dir * -0.5, -8, 0, 2);
      ctx.closePath();
      ctx.fillStyle = shade(c.accent, 6);
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.restore();
    }

    drawCrest(ctx, p.features.crest ?? 'crest_none', s, 0, bodyY - 14);

    fillBlob(ctx, 0, bodyY - 4, 11, 9.5, colorToCss(c.primary, 4));
    drawEyes(ctx, 0, bodyY - 5, 4.8, 2.0, c.eye);
    fillBlob(ctx, 0, bodyY - 0.5, 1.4, 1.0, shade(c.accent, -8));

    for (const dir of [-1, 1]) fillBlob(ctx, dir * 8, -2, 4.8, 2.8, shade(c.secondary, -4));
    drawGlow(ctx, p.features.glow ?? 'glow_speckle', s, 0, bodyY + 4, 5);
  },
};

export const SILHOUETTES = Object.keys(PAINTERS);
