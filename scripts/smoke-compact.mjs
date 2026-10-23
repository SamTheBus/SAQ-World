import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1170, height: 780 } });
const exceptions = [], missing = [], consoleErrors = [];
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', err => exceptions.push(err.message));
page.on('response', response => {
  if (response.status() >= 400 && new URL(response.url()).origin === 'http://127.0.0.1:8989') {
    missing.push(response.status() + ' ' + response.url());
  }
});
try {
  await page.goto('http://127.0.0.1:8989/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  assert(await page.locator('#world-view').count() === 1, 'Game canvas missing');
  const workerReady = await page.evaluate(() => new Promise(resolve => {
    const task = new Worker('./save-worker.js?v=smoke');
    const timer = setTimeout(() => { task.terminate(); resolve('timeout'); }, 20000);
    task.onmessage = e => {
      if (e.data && e.data.ready) {
        clearTimeout(timer);
        task.terminate();
        resolve('ready');
      }
    };
    task.onerror = e => { clearTimeout(timer); task.terminate(); resolve('error: ' + e.message); };
  }));
  assert.equal(workerReady, 'ready', 'Worker bootstrap failed: ' + workerReady);
  await page.waitForFunction(() => window.__SAQ_STARTUP_LOADING_V1__?.events().some(e => e.step >= 2), { timeout: 45000 });
  // Prove that the world reached its first real playable frame, not just a loading screen.
  try {
    await page.waitForFunction(() => window.__SAQ_WORLD_STARTUP_TIMINGS__ ||
      (!document.getElementById('startup-recovery')?.hidden &&
       /World could not start|Unable to start/i.test(document.getElementById('startup-recovery-title')?.textContent ?? '')),
      null, { timeout: 160000, polling: 1000 });
  } catch (error) {
    console.log('Startup timed out: ' + JSON.stringify(await page.evaluate(() =>
      window.__SAQ_STARTUP_LOADING_V1__?.events().slice(-10))));
    throw error;
  }
  const state = await page.evaluate(() => ({
    stage: document.getElementById('world-status')?.textContent,
    recoveryTitle: document.getElementById('startup-recovery-title')?.textContent,
    recoveryDetail: document.getElementById('startup-recovery-detail')?.textContent,
    recoveryVisible: !document.getElementById('startup-recovery')?.hidden,
    loadingHidden: document.getElementById('saq-startup-scene')?.hidden,
    setupEvents: window.__SAQ_STARTUP_LOADING_V1__?.events().slice(-6),
    completed: window.__SAQ_WORLD_STARTUP_TIMINGS__?.failed !== true && !!window.__SAQ_WORLD_STARTUP_TIMINGS__,
    canvas: !!document.getElementById('world-view')
  }));
  console.log('Startup observation ' + JSON.stringify({ state, exceptions, missing, consoleErrors }));
  assert(!(state.recoveryVisible && /World could not start|Unable to start/i.test(state.recoveryTitle ?? '')), 'Visible startup recovery: ' + JSON.stringify(state));
  assert(!/Unable to start/i.test(state.stage ?? ''), 'Startup failure: ' + JSON.stringify(state));
  assert(state.completed && state.loadingHidden === true, 'No playable frame: ' + JSON.stringify(state));
  assert.deepEqual(missing, [], 'Missing production resources');
  assert.deepEqual(exceptions, [], 'Uncaught browser errors');
  console.log('BROWSER SMOKE PASS ' + JSON.stringify({ workerReady, state, missing, exceptions, consoleErrors }));
} finally {
  await browser.close();
}