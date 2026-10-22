// Premium Stage 1 loading art: game-authored visuals, untouched persistent campaign contracts.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../world.css',import.meta.url),'utf8');
const loader=fs.readFileSync(new URL('../src/client/startup_loading_v1.js',import.meta.url),'utf8');
assert(html.includes('data-world-release="wilderness-v3-starter-20261022"'));
assert(html.includes('data-world-save-worker="save-worker.wilderness-v3-migrationfix-20261022.js"'));
assert(html.includes('world.css?v=stage1-premium-v3'),'CSS is explicitly cache-busted');
assert(html.includes('data-runtime-manifest="runtime-manifest.json?v=stage1-premium-v3"'),'runtime manifest URL should not serve a stale hash');
assert(html.includes('src/client/startup_loading_v1.js?v=startup-art-v1'),'Original stateful loading controller unchanged');
assert(html.includes('Stage 1 environment is adapted from SamTheBus/IdleSAQ entities.js'));
assert(html.includes('class="saq-load-stage1-art"'));
assert(html.includes('fill="#271b3e"'),'Canonical Tier 0 violet mountain fill');
assert(html.includes('stop-color="#4a154b"'),'Canonical Tier 0 sky palette');
assert(html.includes('fill="#0c1f13"'),'Canonical Tier 0 pine-forest silhouette');
assert(html.includes('fill="url(#saq-stage1-ground)"'),'Stage 1 forest floor');
for(const id of ['saq-startup-scene','saq-startup-stage','saq-startup-detail','saq-startup-steps','saq-startup-elapsed','saq-startup-progress','saq-startup-activity','saq-startup-copy']) {
 const count=html.split(`id="${id}"`).length-1;
 assert.equal(count,1,`Expected one #${id}, got ${count}`);
}
assert(/<progress id="saq-startup-progress" max="6" value="0"/.test(html));
assert(!/saq-load-(?:hero|sword|monster|impact|damage)/.test(html),'Do not display invented character artwork');
assert(!/saq-load-(?:hero|sword|monster|impact|damage)/.test(css),'Do not retain unused cartoon animation');
assert(!/<(?:img|video)\b/i.test(html.slice(html.indexOf('<!-- Stage 1 environment'),html.indexOf('<script src="./src/client/startup_loading_v1.js'))),'Loading art must not depend on a late image download');
assert(css.includes('@media(prefers-reduced-motion:reduce)'));
assert(css.includes('.saq-startup[hidden]'));
assert(css.includes('.saq-load-spacer'));
assert(css.includes('woodland pewter'),'Muted woodland loading palette should be present');
assert(css.includes('#a2b8a9'),'Progress fill should use subtle sage, not gold or purple');
assert(html.includes('class="saq-load-heading">The Wilderness</h1>'));
assert(!html.includes('The journey begins beyond the road.'));
assert(loader.includes('stepIndex = 6;complete = true'));
console.log('PASS premium Stage 1 loading scene: authentic source landscape, restrained charcoal/sage UI, no impostor sprite, intact campaign');
