// Run: node --test checks/wilderness-v3-4-2-global-pack-pacing.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {WORLD_COMBAT_VERSION,WORLD_COMBAT_HASH} from '../src/shared/content/world_combat_v1.js';
import {WILDERNESS_VERSION,WILDERNESS_HASH} from '../src/shared/content/wilderness_v2.js';
import {WILDERNESS_GLOBAL_PACK_PACING_V3_4_2,wildernessGlobalPursuerCap,selectWildernessGlobalPursuers} from '../src/shared/content/wilderness_pack_pacing_v3_4.js';
import {createEncounterContainmentD11_2} from '../src/simulation/encounter_containment_d11_2.js';
const binding={combatVersion:WORLD_COMBAT_VERSION,combatHash:WORLD_COMBAT_HASH,wildernessVersion:WILDERNESS_VERSION,wildernessHash:WILDERNESS_HASH};
function setup({level=1,floor=1,players=1,wilderness=true}={}){
 const playersById={},entitiesById={},groupsById={},episodes={},tile='1'.repeat(80);
 for(let i=0;i<players;i++){const id='hero'+i;playersById['p'+i]={playerId:'p'+i,entityId:id,connectionStatus:'connected',progression:{level}};entitiesById[id]={entityId:id,alive:true,team:'party',position:{x:200+i*20,y:220},combatRadius:10,residency:{spaceInstanceId:'world'}};}
 for(let n=0;n<2;n++){
  const groupId='group'+n,entityIds=[],memberHomesById={};
  for(let i=0;i<6;i++){
   const id='mob'+n+'-'+i,position={x:320+n*8+i*12,y:220+(i%2)*4};
   entityIds.push(id);memberHomesById[id]=position;
   entitiesById[id]={entityId:id,team:'hostile',kind:'actor',alive:true,hp:'100',maxHp:'100',position,combatRadius:10,attackReach:32,residency:{spaceInstanceId:'world'},ai:{melee:{phase:'idle'}}};
  }
  groupsById[groupId]={groupId,siteId:null,spaceInstanceId:'world',entityIds,cleared:false,containment:{mode:'guard',homeAnchor:{x:320+n*8,y:220},memberHomesById,acquireRadius:320,pursuitRadius:800,disengageTicks:120,homeTolerance:12,approachRadius:20,modeStartedTick:0,outsideTicks:0}};
  episodes[groupId]={geography:{minimumLevel:String(floor)}};
 }
 return {state:{tick:100,overworldInstanceId:'world',d9World:{plannedWorld:wilderness?binding:{combatVersion:WORLD_COMBAT_VERSION,combatHash:WORLD_COMBAT_HASH},episodes,runtime:{frames:[]}},playersById,entitiesById,groupsById,spacesByInstanceId:{world:{collision:{tileSize:32,width:80,height:80,tiles:Array(80).fill(tile)}}}},groupsById,ids:Object.keys(entitiesById).filter(x=>x.startsWith('mob'))};
}
const engaged=({state,ids})=>{const c=createEncounterContainmentD11_2(state);c.beginTick(ids);return {c,ids:ids.filter(id=>c.targetFor(state.entitiesById[id],()=>true))};};
test('two full six-mob novice packs stage three total; mobs not removed',()=>{
 const f=setup(),r=engaged(f);
 assert.equal(r.ids.length,3);
 assert.equal(r.c.inspect().globalStarterPursuers,3);
 assert.equal(f.ids.filter(id=>f.state.entitiesById[id].alive).length,12);
});
test('provoking pack A releases full retaliation without uncapping pack B',()=>{
 const f=setup();f.state.entitiesById[f.groupsById.group0.entityIds[5]].hp='99';
 const got=engaged(f).ids;
 assert.equal(got.filter(x=>x.startsWith('mob0-')).length,6);
 assert.ok(got.filter(x=>x.startsWith('mob1-')).length<=3);
});
test('high-level region far away, veteran players and legacy bindings keep prior aggro',()=>{
 for(const [options,expected] of [[{floor:11},6],[{level:8},12],[{wilderness:false},12]]){
  const f=setup(options);
  assert.equal(engaged(f).ids.length,expected);
 }
});
test('per-player budgets and provoked/boss exemptions are independent',()=>{
 const f=setup({players:2}),r=engaged(f);
 assert.ok(r.ids.length<=6);assert.equal(r.c.inspect().globalStarterPlayers,2);
 const p=f.state.entitiesById.hero0;
 assert.equal(wildernessGlobalPursuerCap(f.state,f.groupsById.group0,p),3);
 assert.ok(r.c.inspect().globalStarterPursuers<=6);
});
test('deterministic ties, zero duplicate slots and full provocation exception',()=>{
 const entries=[{entityId:'b',distance:8},{entityId:'a',distance:8},{entityId:'c',distance:7},{entityId:'c',distance:7}];
 assert.deepEqual(selectWildernessGlobalPursuers(entries),['c','a','b']);
 assert.deepEqual(selectWildernessGlobalPursuers([...entries].reverse()),['c','a','b']);
 const f=setup(),group=f.groupsById.group0,hero=f.state.entitiesById.hero0;
 assert.equal(wildernessGlobalPursuerCap(f.state,group,hero),3);
 f.state.entitiesById[group.entityIds[0]].alive=false;
 assert.equal(wildernessGlobalPursuerCap(f.state,group,hero),null);
 assert.equal(WILDERNESS_GLOBAL_PACK_PACING_V3_4_2.maximumUnprovokedPursuers,3);
});
