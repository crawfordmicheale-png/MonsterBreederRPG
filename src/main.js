// Entry point.

import { App } from './ui/app.js';

const host = document.getElementById('app');
const app = new App(host);

// Expose for debugging from a mobile console; harmless in production.
window.broodkeeper = app;

app.boot();

// Save on the way out — mobile browsers kill backgrounded tabs without warning.
for (const event of ['pagehide', 'visibilitychange']) {
  window.addEventListener(event, () => {
    if (document.visibilityState === 'hidden' || event === 'pagehide') app.game?.save();
  });
}

// Stop iOS Safari's double-tap zoom from eating rapid taps in battle.
let lastTouch = 0;
document.addEventListener(
  'touchend',
  (e) => {
    const now = Date.now();
    if (now - lastTouch < 320) e.preventDefault();
    lastTouch = now;
  },
  { passive: false }
);
