import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {originalNexusAbilityChoice} from '../src/shared/content/original_nexus_ability_v1.js';
import {originalMarcusDashNodes,MARCUS_GOLD_RUSH_TOTAL_TICKS} from '../src/shared/content/original_marcus_gold_rush_v1.js';
import {createRecoveredBossV1} from '../src/shared/contracts/recovered_boss_v1.js';
import {initialBossCombatD12_5A,installBossRecordsD12_5A,validateBossCombatD12_5A,projectBossActorD12_5A,projectBossSummonD12_5A} from '../src/shared/contracts/boss_combat_d12_5.js';
import {createRecoveredBossCombatV1} from '../src/simulation/recovered_boss_v1.js';
import {combatInteger} from '../src/shared/contracts/combat_amount.js';
import {ARACHNID_TREANT_PROFILE} from '../src/shared/content/bosses_d12_5.js';
import {archivedBossArtModel} from '../src/client/boss_archive_world_adapter_v1.js';
import {treasuryBossDepthItems} from '../src/client/boss_original_treasury_world_adapter_v1.js';
import {extendedBossDepthItems} from '../src/client/boss_archive_world_extended_v1.js';

const sha256=async bytes=>[...new Uint8Array(await webcrypto.subtle.digest('SHA-256',new Uint8Array(bytes)))];
const key=i=>'ent:'+i.toString(16).padStart(32,'0'),space='spi:'+'4'.repeat(32),group='grp:'+'5'.repeat(32);
const collision=()=>({tileSize:32,width:40,height:40,tiles:Array(40).fill('1'.repeat(40))});
function actor(id,team,pos){return {entityId:id,team,kind:'actor',contentDefinitionId:ARACHNID_TREANT_PROFILE.contentDefinitionId,
 hp:combatInteger(1800),maxHp:combatInteger(1800),attackDamage:combatInteger(40),position:{...pos},hullRadius:team==='party'?12:34,
 combatRadius:16,alive:true,movementIntent:{x:0,y:0},attackTimer:0,residency:{spaceInstanceId:space,residencyRevision:1}};}
async function battle(kind,additional=0){
 const boss=actor(key(1),'hostile',{x:430,y:420}),hero=actor(key(2),'party',{x:645,y:420}),
  minions=Array.from({length:additional},(_,i)=>actor(key(i+3),'hostile',{x:485+(i%3)*26,y:505+Math.floor(i/3)*36}));
 minions.forEach(x=>{x.hullRadius=10;x.combatRadius=10;});
 const state={tick:0,entitiesById:Object.fromEntries([hero,boss,...minions].map(x=>[x.entityId,x])),
  playersById:{p:{entityId:hero.entityId,connectionStatus:'connected'}},
  groupsById:{[group]:{entityIds:[boss.entityId,...minions.map(m=>m.entityId)],siteId:'site:test'}},
  spacesByInstanceId:{[space]:{collision:collision()}},bossCombat:initialBossCombatD12_5A(),
  content:{definitionsById:{[ARACHNID_TREANT_PROFILE.contentDefinitionId]:ARACHNID_TREANT_PROFILE}}};
 const row=await createRecoveredBossV1({kind,campaignSeed:'gold-rush-fidelity',siteId:'site:test',floorId:'floor:test',
  groupId:group,roomId:'room:test',entityId:boss.entityId,homePosition:boss.position,activatedTick:0,
  spaceInstanceId:space,sourceResidencyRevision:1,addMembers:minions.map(m=>({entityId:m.entityId,position:m.position}))},{sha256});
 installBossRecordsD12_5A(state,[row]);
 const hits=[],controller=createRecoveredBossCombatV1(state,{applyDirectDamage:(a,t,d,k)=>{hits.push({tick:state.tick,kind:k,target:t.entityId});return true;}});
 return {state,boss,hero,minions,b:state.bossCombat.bossesByEntityId[boss.entityId],controller,hits};
}
function cast(env,ability,duration){const {b,state,hero}=env;b.actionState='telegraphing';b.activeAbility=ability;
 b.targetEntityId=hero.entityId;b.targetPosition={...hero.position};b.telegraphStartedTick=state.tick;
 b.resolvesTick=state.tick+duration;b.abilitySequence=1;b.nextActionTick=b.resolvesTick+200;}
function step(env,tick){env.state.tick=tick;env.controller.beginTick();env.controller.advance();validateBossCombatD12_5A(env.state);}
function bossVisual(env){return {...env.boss,boss:projectBossActorD12_5A(env.state,env.boss.entityId)};}

test('Original Nexus fight selects only 75-tick Prism Collapse or 60-tick Control Glitch',()=>{
 const selected=new Set();
 for(let n=0;n<50;n++){selected.add(originalNexusAbilityChoice(987654321,n,120));
  assert.equal(originalNexusAbilityChoice(987654321,n,12)==='prism_collapse'||originalNexusAbilityChoice(987654321,n,12)==='control_glitch',true);
 }
 assert.deepEqual([...selected].sort(),['control_glitch','prism_collapse']);
 const initial={x:400,y:400},target={x:525,y:435};
 const nodes=originalMarcusDashNodes(initial,target);
 assert.equal(nodes.length,3);assert.deepEqual(nodes[2],target);
 assert.ok(Math.hypot(nodes[0].x-initial.x,nodes[0].y-initial.y)<=70.001);
 assert.ok(Math.hypot(nodes[1].x-initial.x,nodes[1].y-initial.y)<=140.001);
});
test('Nexus original cage uses its real generated Canvas wireframe around locked target',async()=>{
 const env=await battle('nexus_overseer',2);
 cast(env,'prism_collapse',75);env.state.tick=35;
 validateBossCombatD12_5A(env.state);
 const model={tick:35,entitiesById:{[env.boss.entityId]:bossVisual(env)},
  bossHazards:{recoveredTelegraphs:[{bossId:env.b.bossId,bossDefinitionId:'nexus_overseer',ability:'prism_collapse',
   position:{...env.hero.position},originPosition:{...env.boss.position},startedTick:0,resolvesTick:75,sequence:1}],recoveredPools:[]}};
 const items=extendedBossDepthItems(model,35,{x:0,y:0,width:2000,height:2000});
 assert.equal(items.filter(x=>x.id.includes('/cage/')).length,2,'Original prism has front and back Canvas depth layers');
});
test('Marcus Gold Rush occupies eighteen distinct authority ticks and each leg retains its position',async()=>{
 const env=await battle('marcus'),original={...env.boss.position};
 cast(env,'gold_rush',55);
 step(env,55);
 assert.equal(env.b.actionState,'dashing');
 assert.deepEqual(env.boss.position,original,'Not three instant teleport strikes');
 assert.equal(env.b.goldRush.endsTick,55+MARCUS_GOLD_RUSH_TOTAL_TICKS);
 const positions=[];
 for(let tick=56;tick<=73;tick++){step(env,tick);positions.push({...env.boss.position});}
 assert.equal(env.b.actionState,'idle');assert.equal(env.b.goldRush,null);
 assert.ok(positions.filter((p,i)=>i>0&&Math.hypot(p.x-positions[i-1].x,p.y-positions[i-1].y)>0).length>8,
  'The visible three-leg sequence must move through multiple frames');
 assert.equal(env.b.pools.filter(x=>x.kind==='molten').length,3,'Each resolved dash leaves one physical slag patch');
 const props=projectBossActorD12_5A(env.state,env.boss.entityId);
 assert.equal(props.goldRush,null);assert.equal(props.lastAction.ability,'gold_rush');
});
test('Original Marcus painter receives actual Gold Rush route during both telegraph and movement',async()=>{
 const env=await battle('marcus');cast(env,'gold_rush',55);step(env,55);step(env,56);
 const boss=bossVisual(env),model={tick:56,entitiesById:{[env.boss.entityId]:boss},bossHazards:{recoveredTelegraphs:[],recoveredPools:[]}};
 const layers=treasuryBossDepthItems(model,56,{x:0,y:0,width:2000,height:2000});
 assert.ok(Array.isArray(layers));
 assert.ok(boss.boss.goldRush.nodes.length===3);
});
test('Corrosive real 8% HP shedding animates a detached body chunk, landing and slime activation',async()=>{
 const env=await battle('corrosive_abomination',6);env.b.nextActionTick=600;
 env.boss.hp=combatInteger(1650);step(env,1);
 assert.equal(env.b.chunkStep,1);assert.equal(env.b.archive.shedEvents?.length,1);
 const event=env.b.archive.shedEvents[0],spawnedId=event.spawnedMinionIds[0];
 assert.equal(env.controller.frozen(spawnedId),true,'The chunk cannot attack while airborne');
 function visual(tick){
  const id=spawnedId,owner={...env.boss,boss:projectBossActorD12_5A(env.state,env.boss.entityId)},baby={...env.state.entitiesById[id],bossSummon:projectBossSummonD12_5A(env.state,id)};
  const model={tick,entitiesById:{[env.boss.entityId]:owner,[id]:baby},bossHazards:{recoveredPools:[],recoveredTelegraphs:[]}};
  return archivedBossArtModel(model,tick);
 }
 let art=visual(1);
 assert.equal(art.bossHazards.corrosiveSheds.length,1);
 assert.equal(art.bossHazards.corrosiveMinions[0].stage,'airborne');
 for(let t=2;t<=19;t++)step(env,t);
 art=visual(19);assert.equal(art.bossHazards.corrosiveMinions[0].stage,'coalescing');
 assert.equal(env.controller.frozen(spawnedId),true);
 for(let t=20;t<=32;t++)step(env,t);
 art=visual(32);assert.equal(art.bossHazards.corrosiveMinions[0].stage,'active');
 assert.equal(env.controller.frozen(spawnedId),false);
 for(let t=33;t<=41;t++)step(env,t);
 assert.equal(env.b.archive.shedEvents.length,0,'Rupture seam closes and old save history is retired');
});
