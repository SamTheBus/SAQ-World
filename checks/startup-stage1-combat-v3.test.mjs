// Verify loading uses actual World hero, default sword and Woodland Rust Nibbler.
// These are direct game-authored rendering routines, not unrelated generated sprites.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const get=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=get('index.html'),css=get('world.css'),duel=get('src/client/startup_combat_preview_v1.js');
const hero=get('src/client/hero_presentation.js'),enemy=get('src/client/creature_presentation_d11.js'),gear=get('src/client/equipment_art.js');
const exactHero=hero.slice(hero.indexOf('export function primaryPose('),hero.indexOf('export function drawProofSlime(')).replaceAll('export function ','function ');
const exactNibbler=enemy.slice(enemy.indexOf('const attackPose=m=>'),enemy.indexOf('export function animatedArmorPoseD11_2('));
assert(duel.includes(exactHero),'The loading hero painter must exactly match World source');
assert(duel.includes(exactNibbler),'The loading enemy painter must exactly match World source');
assert(duel.includes('id="saq-startup-duel"')===false,'Renderer belongs in JS, not an HTML template');
assert(html.includes('id="saq-startup-duel"'));
assert(html.includes('startup_combat_preview_v1.js?v=stage1-combat-v3'));
assert(!html.includes('class="saq-load-heading">The Wilderness'));
assert(duel.includes('drawWorldHero(ctx,player,1,elapsed,primary,pseudoTick,false,equipmentArt)'));
assert(duel.includes('draw_rust_nibbler(ctx,frame,elapsed,7)'));
assert(duel.includes('drawWorldHero/primaryPose geometry'));
assert(duel.includes('equip')||duel.includes('worn-sword'));
for(const fragment of ['M16 3 L19 8 L18 21 L14 21 L13 8 Z','#95a5a6','#c0392b']) {
  assert(gear.includes(fragment)||hero.includes(fragment),'Source is missing expected worn sword / hero art '+fragment);
  assert(duel.includes(fragment),'Worn sword / hero geometry mismatch '+fragment);
}
assert(duel.includes('reduced?.matches'),'Reduced motion must render still frame');
assert(duel.includes('stamp-lastDraw>=65'),'Keep load renderer to ~15 fps max');
assert(!duel.includes('fetch(') && !duel.includes('localStorage') && !duel.includes('indexedDB'),'Loading animation must not touch saves or assets over network');
assert(css.includes('.saq-load-duel')&&css.includes('z-index:0'));
assert(html.includes('data-world-release="wilderness-v3-starter-20261022"'));
assert(html.includes('data-world-save-worker="save-worker.wilderness-v3-migrationfix-20261022.js"'));
console.log('PASS Stage 1 combat loading: exact SAQ World hero + Rust Nibbler + default sword, no The Wilderness title, no save/state changes');
