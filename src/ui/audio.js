// Lightweight procedural sanctuary bed — no asset files.
// Soft woodwind-ish pads over a low drone; respects reduced-motion / mute.

let ctx = null;
let master = null;
let nodes = [];
let running = false;
let muted = false;
let recovery = 0;

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  return ctx;
}

function tone(freq, type = 'sine') {
  const c = ensureCtx();
  if (!c) return null;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = 0;
  osc.connect(gain);
  gain.connect(master);
  osc.start();
  return { osc, gain };
}

function fadeMaster(to, seconds = 1.4) {
  if (!master || !ctx) return;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  master.gain.linearRampToValueAtTime(to, now + seconds);
}

/** Start (or resume) the sanctuary bed. Safe to call repeatedly. */
export function startSanctuaryBed(level = 0) {
  if (muted) return;
  try {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
  } catch {
    /* ignore */
  }
  const c = ensureCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  recovery = level;
  if (!running) {
    nodes = [
      tone(98, 'sine'),       // low drone
      tone(146.8, 'triangle'), // soft fifth
      tone(220, 'sine'),      // gentle A
      tone(329.6, 'triangle'), // airy E
    ].filter(Boolean);
    running = true;
    for (const n of nodes) {
      const now = c.currentTime;
      n.gain.gain.setValueAtTime(0, now);
      n.gain.gain.linearRampToValueAtTime(0.012, now + 2.2);
    }
    // Slow breathing on the upper partials.
    if (nodes[2] && nodes[3]) {
      const lfo = c.createOscillator();
      const lfoGain = c.createGain();
      lfo.frequency.value = 0.08;
      lfoGain.gain.value = 0.006;
      lfo.connect(lfoGain);
      lfoGain.connect(nodes[2].gain.gain);
      lfoGain.connect(nodes[3].gain.gain);
      lfo.start();
      nodes.push({ osc: lfo, gain: lfoGain });
    }
  }
  setRecoveryLevel(level);
  fadeMaster(muted ? 0 : 0.55, 1.8);
}

export function setRecoveryLevel(level) {
  recovery = level;
  if (!ctx || !nodes.length) return;
  // As Briarhold recovers, the bed brightens slightly.
  const bright = 0.01 + level * 0.004;
  const now = ctx.currentTime;
  if (nodes[2]) {
    nodes[2].gain.gain.cancelScheduledValues(now);
    nodes[2].gain.gain.linearRampToValueAtTime(bright, now + 1.5);
  }
  if (nodes[3]) {
    nodes[3].gain.gain.cancelScheduledValues(now);
    nodes[3].gain.gain.linearRampToValueAtTime(bright * 0.7, now + 1.5);
  }
}

export function hushBed(seconds = 0.8) {
  fadeMaster(0.18, seconds);
}

export function restoreBed(seconds = 1.2) {
  if (!muted) fadeMaster(0.55, seconds);
}

export function stopSanctuaryBed() {
  fadeMaster(0, 0.6);
  setTimeout(() => {
    for (const n of nodes) {
      try { n.osc.stop(); } catch { /* already stopped */ }
    }
    nodes = [];
    running = false;
  }, 700);
}

export function toggleMute() {
  muted = !muted;
  if (muted) fadeMaster(0, 0.4);
  else {
    startSanctuaryBed(recovery);
    fadeMaster(0.55, 0.8);
  }
  return muted;
}

export function isMuted() {
  return muted;
}

/** Tiny chime for hatch / bond ceremonies. */
export function playChime(kind = 'hatch') {
  const c = ensureCtx();
  if (!c || muted) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  const freqs = kind === 'bond' ? [392, 523.25] : [261.63, 329.63, 392];
  const now = c.currentTime;
  freqs.forEach((f, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.04 + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9 + i * 0.1);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now + i * 0.08);
    osc.stop(now + 1.2 + i * 0.1);
  });
}
