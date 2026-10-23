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
assert(html.includes('browser_boot.js?v=v3-2-fairness-20261022'));
assert(html.includes('startup_loading_v1.js?v=startup-art-v1'));
assert(html.includes('id="saq-startup-progress"'));
assert(html.includes('id="saq-startup-scene"'));
assert(html.includes('world.css?v=stage1-combat-v3'));
assert(html.includes('data-runtime-manifest="runtime-manifest.json?v=v3-3-crowd-cleave-20261022"'),'runtime manifest URL should not serve a stale hash');
assert(html.includes('saq-load-stage1-art'));
assert(html.includes('id="saq-startup-duel"'));
assert(html.includes('startup_combat_preview_v1.js?v=stage1-combat-v3'));
assert(!html.includes('class="saq-load-heading">The Wilderness')); // no unnecessary giant title

assert(html.includes('save-worker.wilderness-v3-migrationfix-20261022-crowd-v3-3.js'));
assert(html.includes('data-world-release="wilderness-v3-starter-20261022"')); // saved campaigns retain their original namespace
for (const file of ['activity_save_bridge.js','world_worker_bridge_d9.js'])assert(Object.values(map.imports).some(url => url.includes(file+'?v=v3-migrationfix-20261022')), `Missing stable ${file}`);
assert(map.imports['./src/entrypoints/playable_browser.js'].includes('v=startup-art-v1'));
assert(map.imports['./src/host/local_endless_session_d9.js'].includes('v=startup-art-v1'));
const entry = await import('../src/entrypoints/playable_browser.js');
assert.equal(typeof entry.startWorldClient, 'function');
const boot = fs.readFileSync(new URL('../src/entrypoints/browser_boot.js', import.meta.url), 'utf8');
assert(boot.includes('SAQ_STARTUP_LOADING_V1__?.stage(1'));
assert(boot.includes('SAQ_STARTUP_LOADING_V1__?.fail()'));
const client = fs.readFileSync(new URL('../src/entrypoints/playable_browser.js', import.meta.url), 'utf8');
assert(client.includes('startupLoading?.finish()'));
assert(client.includes('client.resources().spacePreparation.ready'));
assert(client.includes('startupLoading?.stage(4'));
assert(client.includes('startupLoading?.stage(5'));
const world=fs.readFileSync(new URL('../src/host/local_endless_session_d9.js',import.meta.url),'utf8');
assert(world.includes('onStartupProgress'));
const css=fs.readFileSync(new URL('../world.css',import.meta.url),'utf8');
assert(css.includes('.saq-startup[hidden]'));
assert(css.includes('prefers-reduced-motion'));
console.log(`PASS startup graph: ${count} browser modules parse; game entry imports; cache-busted repair is present`);

assert.equal(map.imports['./src/simulation/activity_simulation.js'],'./src/simulation/activity_simulation.js?v=v3-3-crowd-cleave-20261022');
assert.equal(map.imports['./src/shared/content/wilderness_fairness_v3_2.js'],'./src/shared/content/wilderness_fairness_v3_2.js?v=v3-2-fairness-20261022');

assert.equal(map.imports['./src/shared/contracts/activity_state.js'],'./src/shared/contracts/activity_state.js?v=v3-3-crowd-cleave-20261022');
assert.equal(map.imports['./src/shared/content/wilderness_combat_tuning_v3_3.js'],'./src/shared/content/wilderness_combat_tuning_v3_3.js?v=v3-3-crowd-cleave-20261022');
