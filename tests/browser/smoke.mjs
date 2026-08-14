// Browser smoke test — boots the game in a phone-sized Chromium, plays through
// the opening, and fails on any console error, unhandled rejection or layout
// overflow. Run with:  npm run test:browser
//
// Requires a local Chromium (Playwright). It is deliberately kept out of the
// default `npm test` glob so the unit suite stays dependency-free.

import { chromium, devices } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};

function serve() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const rel = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
      const path = join(ROOT, rel === '/' ? 'index.html' : rel);
      const body = await readFile(path);
      res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

const failures = [];
const checks = [];

function check(name, condition, detail = '') {
  checks.push({ name, ok: Boolean(condition) });
  if (!condition) failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
}

const server = await serve();
const port = server.address().port;
const base = `http://127.0.0.1:${port}/`;

// CHROMIUM_PATH lets CI point at whatever Chromium it has; the default is the
// pre-installed browser in this container image.
const executablePath = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const browser = await chromium
  .launch({ executablePath, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  .catch(() => chromium.launch({ args: ['--no-sandbox'] }));
const context = await browser.newContext({ ...devices['Pixel 7'] });
const page = await context.newPage();

const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

await page.goto(base, { waitUntil: 'networkidle' });

// --- title screen ---
check('title screen renders', await page.getByRole('heading', { level: 1 }).first().isVisible());
check(
  'aptitudes are offered',
  (await page.locator('.aptitude-card').count()) === 3,
  `found ${await page.locator('.aptitude-card').count()}`
);

await page.locator('.aptitude-card').nth(1).click(); // Breeder
await page.getByRole('button', { name: 'Return to Briarhold' }).click();

// --- opening scene ---
await page.waitForSelector('.scene-overlay');
check('opening scene appears', await page.locator('.scene-overlay').isVisible());
for (let i = 0; i < 12; i++) {
  const skip = page.getByRole('button', { name: 'Skip ahead' });
  if (await skip.count()) {
    await skip.click();
    break;
  }
}
await page.getByRole('button', { name: 'Close' }).click();
await page.waitForSelector('.scene-overlay', { state: 'detached' });

// --- sanctuary + first project ---
await page.waitForSelector('main');
check('objective card is shown', (await page.locator('.objective').count()) > 0);
check('bottom navigation present', (await page.locator('.nav button').count()) === 5);

const clearButton = page.locator('.card', { hasText: 'Clear the Nursery' }).getByRole('button', { name: 'Build' });
check('the first project is offered', (await clearButton.count()) > 0);
await clearButton.click();

// Echoryx hatches as a scene.
await page.waitForSelector('.scene-overlay');
const skipAll = async () => {
  for (let i = 0; i < 20; i++) {
    const skip = page.getByRole('button', { name: 'Skip ahead' });
    if (await skip.count()) {
      await skip.click();
      continue;
    }
    const close = page.getByRole('button', { name: 'Close' });
    if (await close.count()) {
      await close.click();
      await page.waitForSelector('.scene-overlay', { state: 'detached' }).catch(() => {});
      return;
    }
    await page.waitForTimeout(120);
  }
};
await skipAll();
// The Veyra scene follows immediately.
await page.waitForSelector('.scene-overlay').catch(() => {});
await skipAll();

const echoryxCount = await page.evaluate(() => window.broodkeeper.game.roster.length);
check('Echoryx joined the roster', echoryxCount === 1, `roster is ${echoryxCount}`);

// --- portraits actually draw pixels ---
await page.locator('.nav button', { hasText: 'Roster' }).click();
await page.waitForSelector('.beast-row canvas');
const drewSomething = await page.evaluate(() => {
  const canvas = document.querySelector('.beast-row canvas');
  const ctx = canvas.getContext('2d');
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let opaque = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 12) opaque++;
  return opaque;
});
check('creature art renders to canvas', drewSomething > 400, `${drewSomething} opaque pixels`);

// --- exploration and an encounter ---
await page.locator('.nav button', { hasText: 'Explore' }).click();
await page.waitForSelector('.card');
const setOut = page.getByRole('button', { name: 'Set out' }).first();
check('expedition sites are available', (await setOut.count()) > 0);
await setOut.click();
await page.waitForSelector('.sheet-inner');
check('expedition report opens', await page.locator('.sheet-inner').isVisible());
await page.getByRole('button', { name: 'Approach it' }).click();
await page.waitForSelector('.move-btn');
check('bonding approaches are offered', (await page.locator('.move-btn').count()) >= 3);

// Push trust up until the Concord is offered or the creature leaves.
for (let i = 0; i < 8; i++) {
  const concord = page.getByRole('button', { name: 'Offer the Concord Mark' });
  if (await concord.count()) {
    await concord.click();
    break;
  }
  const options = page.locator('.move-btn:not([disabled])');
  if (!(await options.count())) break;
  await options.first().click();
  await page.waitForTimeout(80);
}
const done = page.getByRole('button', { name: 'Head home' });
if (await done.count()) await done.click();

// --- every tab renders without throwing ---
for (const label of ['Sanctuary', 'Explore', 'Roster', 'Nursery', 'Journal']) {
  await page.locator('.nav button', { hasText: label }).click();
  await page.waitForTimeout(140);
  check(`${label} tab renders`, (await page.locator('main').count()) === 1);
}

// --- profile sheet ---
await page.locator('.nav button', { hasText: 'Roster' }).click();
await page.locator('.beast-row').first().click();
await page.waitForSelector('.sheet-inner');
check('profile sheet opens', (await page.locator('.sheet-inner h2').count()) > 0);
check('pedigree section present', (await page.getByText('Pedigree').count()) > 0);
await page.locator('.sheet').click({ position: { x: 10, y: 10 } });

// --- persistence ---
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('main');
const afterReload = await page.evaluate(() => ({
  roster: window.broodkeeper.game.roster.length,
  chapter: window.broodkeeper.game.chapterIndex,
  title: document.querySelector('.title-screen') !== null,
}));
check('save survives a reload', !afterReload.title && afterReload.roster >= 1, JSON.stringify(afterReload));

// --- layout: nothing may scroll sideways on a phone ---
const overflow = await page.evaluate(() => {
  const doc = document.documentElement;
  return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth };
});
check(
  'no horizontal overflow',
  overflow.scrollWidth <= overflow.clientWidth + 1,
  `${overflow.scrollWidth} > ${overflow.clientWidth}`
);

// --- touch targets ---
const smallTargets = await page.evaluate(() =>
  [...document.querySelectorAll('.nav button, .btn')]
    .map((n) => ({ text: n.textContent.trim().slice(0, 24), h: n.getBoundingClientRect().height }))
    .filter((n) => n.h > 0 && n.h < 40)
);
check('touch targets are at least 40px tall', smallTargets.length === 0, JSON.stringify(smallTargets));

check('no console errors', consoleErrors.length === 0, consoleErrors.join(' | '));

await browser.close();
server.close();

for (const c of checks) console.log(`${c.ok ? 'ok  ' : 'FAIL'}  ${c.name}`);
if (failures.length) {
  console.error(`\n${failures.length} failure(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} browser checks passed.`);
