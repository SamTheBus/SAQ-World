import * as fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const root = path.resolve('dist');
async function walk(dir) {
  const files = [];
  for (const f of await fs.readdir(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, f.name);
    if (f.isDirectory()) files.push(...await walk(absolute));
    else if (f.isFile()) files.push(path.relative(root, absolute).split(path.sep).join('/'));
  }
  return files.sort();
}
const files = await walk(root);
assert(files.length < 55, 'More than 54 production files: ' + files.length);
assert(files.every(f => !f.startsWith('src/') && !f.startsWith('worker/') && !f.startsWith('checks/')),
  'Dev source or redundant worker leaked into production');
for (const f of ['index.html', 'game.js', 'save-worker.js', 'world.css',
  'startup-loading.js', 'startup-combat-preview.js',
  'runtime-manifest.json', 'manifest.webmanifest']) {
  assert(files.includes(f), 'Missing production file ' + f);
}
const html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
assert(!html.includes('type="importmap"'), 'Old import map survived bundling');
assert(!html.includes('src/'), 'HTML still requests source files');
assert(html.includes('src="./game.js?'), 'Game bundle not loaded');
assert(html.includes('data-world-save-worker="save-worker.js"'), 'Worker URL changed unexpectedly');
assert(html.includes('src="./startup-loading.js?'), 'Loading scene JS unavailable');
assert(html.includes('src="./startup-combat-preview.js?'), 'Loading preview JS unavailable');
const worker = await fs.readFile(path.join(root, 'save-worker.js'), 'utf8');
assert(!worker.includes("import('./src/"), 'Save worker still imports deleted source');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'runtime-manifest.json'), 'utf8'));
const summary = [];
for (const f of manifest.files) {
  assert(files.includes(f.path), 'Manifest references absent file ' + f.path);
  const bytes = await fs.readFile(path.join(root, f.path));
  assert.equal(f.bytes, bytes.length, 'Manifest byte mismatch ' + f.path);
  assert.equal(f.sha256, crypto.createHash('sha256').update(bytes).digest('hex'),
    'Manifest hash mismatch ' + f.path);
  summary.push(f.path);
}
assert.equal(new Set(summary).size, files.length - 1, 'Manifest inventory mismatch');
const digest = crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');
assert.equal(manifest.runtimeSha256, digest);
assert.equal(manifest.runtimeId, digest.slice(0, 16));
console.log('Production validation PASS: ' + files.length + ' files, no source dependencies, verified runtime manifest.');