// Run: node --experimental-vm-modules checks/startup-module-graph.test.mjs
// Mandatory release gate: previously an invalid dev-review ternary prevented ALL UI from booting.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
let count = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (file.endsWith('.js')) {
      new vm.SourceTextModule(fs.readFileSync(file, 'utf8'), {identifier:file});
      count++;
    }
  }
}
walk(new URL('../src/', import.meta.url).pathname);
assert(count > 450, `Unexpectedly small game module graph: ${count}`);
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const map = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)?.[1] ?? '{}');
assert(map.imports['./src/dev/planned_world_review_v1.js']?.includes('v3-bootfix-20261022'));
assert(html.includes('browser_boot.js?v=v3-migrationfix-20261022'));
assert(html.includes('save-worker.wilderness-v3-migrationfix-20261022.js'));
assert(html.includes('data-world-release="wilderness-v3-starter-20261022"')); // saved campaigns retain their original namespace
for (const file of ['playable_browser.js','activity_save_bridge.js','world_worker_bridge_d9.js'])assert(Object.values(map.imports).some(url => url.includes(file+'?v=v3-migrationfix-20261022')), `Missing fresh ${file}`);
const entry = await import('../src/entrypoints/playable_browser.js');
assert.equal(typeof entry.startWorldClient, 'function');
console.log(`PASS startup graph: ${count} browser modules parse; game entry imports; cache-busted repair is present`);
