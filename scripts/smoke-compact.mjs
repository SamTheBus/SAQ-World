import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1170, height: 780 } });
const exceptions = [], missing = [];
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
  await page.waitForTimeout(8000);
  const state = await page.evaluate(() => ({
    stage: document.getElementById('world-status')?.textContent,
    recovery: document.getElementById('startup-recovery-title')?.textContent,
    loading: document.getElementById('saq-startup-scene')?.hidden,
    canvas: !!document.getElementById('world-view')
  }));
  assert(!/World could not start|Unable to start/i.test(state.recovery ?? ''), 'Startup recovery: ' + JSON.stringify(state));
  assert(!/Unable to start/i.test(state.stage ?? ''), 'Startup failure: ' + JSON.stringify(state));
  assert.deepEqual(missing, [], 'Missing production resources');
  assert.deepEqual(exceptions, [], 'Uncaught browser errors');
  console.log('BROWSER SMOKE PASS ' + JSON.stringify({ workerReady, state, missing, exceptions }));
} finally {
  await browser.close();
}