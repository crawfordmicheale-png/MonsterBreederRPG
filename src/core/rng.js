// Deterministic, serialisable RNG.
// A save file stores the stream state so a reloaded game continues the same
// sequence — important because an egg's genome is fixed the moment it is laid.

export class RNG {
  constructor(seed = Date.now() >>> 0) {
    this.state = seed >>> 0 || 1;
  }

  /** mulberry32 — small, fast, good enough for gameplay randomness. */
  next() {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Float in [min, max). */
  range(min, max) {
    return min + this.next() * (max - min);
  }

  /** Integer in [min, max] inclusive. */
  int(min, max) {
    return Math.floor(this.range(min, max + 1));
  }

  /** True with probability p. */
  chance(p) {
    return this.next() < p;
  }

  pick(arr) {
    if (!arr.length) return undefined;
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Pick `n` distinct items (or fewer if the array is short). */
  sample(arr, n) {
    const pool = [...arr];
    const out = [];
    while (out.length < n && pool.length) {
      out.push(pool.splice(Math.floor(this.next() * pool.length), 1)[0]);
    }
    return out;
  }

  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Weighted pick. `weights` maps in parallel to `items`. */
  weighted(items, weights) {
    const total = weights.reduce((s, w) => s + w, 0);
    if (total <= 0) return this.pick(items);
    let roll = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  /** Roughly normal, clamped to [-1, 1]. */
  bell() {
    return (this.next() + this.next() + this.next() - 1.5) / 1.5;
  }

  toJSON() {
    return this.state;
  }

  static fromJSON(state) {
    return new RNG(typeof state === 'number' ? state : Date.now() >>> 0);
  }
}

/** A shared stream for cosmetic, non-persisted randomness (idle animations). */
export const cosmeticRng = new RNG(0x51ed);
