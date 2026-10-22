import {combatInteger,multiplyCombat} from '../shared/contracts/combat_amount.js';
import {copyWire} from '../shared/contracts/wire.js';
import {BRIMSTONE_ID,BRIMSTONE as C,brimstoneLineClear,brimstoneVentArms,brimstoneVentContains} from '../shared/content/brimstone_colossus_v1.js';
import {collidesWithTiles} from '../shared/rules/world_geometry.js';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),aim=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
const delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const roll=(seed,n,salt)=>{let v=(seed^Math.imul(n+1,0x9e3779b1)^salt)>>>0;v=Math.imul(v^(v>>>16),0x85ebca6b)>>>0;v=Math.imul(v^(v>>>13),0xc2b2ae35)>>>0;return((v^(v>>>16))>>>0)/0x100000000;};
export function createBrimstoneCombat(state,{applyDirectDamage,eligible=()=>true,lineClear}={}){
 const observed=new Map(),stats={strikes:0,slams:0,ventCasts:0,ventsErupted:0,slamHits:0,ventHits:0};
 const record=id=>{const b=state.bossCombat?.bossesByEntityId?.[id];return b?.bossDefinitionId===BRIMSTONE_ID?b:null;};
 const records=()=>Object.values(state.bossCombat?.bossesByEntityId??{}).filter(b=>record(b.entityId)).sort((a,z)=>a.bossId.localeCompare(z.bossId));
 const players=a=>Object.values(state.playersById).filter(p=>p.connectionStatus==='connected').map(p=>state.entitiesById[p.entityId]).filter(t=>t?.alive&&t.residency.spaceInstanceId===a.residency.spaceInstanceId&&eligible(a,t)).sort((a,z)=>a.entityId.localeCompare(z.entityId));
 const clear=b=>{b.activeAbility=null;b.targetEntityId=null;b.targetPosition=null;b.telegraphStartedTick=null;b.resolvesTick=null;b.ventTargets=[];};
 function sync(b,a){if(!a?.alive||a.residency.spaceInstanceId!==b.spaceInstanceId||a.residency.residencyRevision!==b.sourceResidencyRevision){clear(b);b.actionState='defeated';b.ventsById={};return false;}return true;}
 function ventPositions(b,a,t,c){
  const points=[];for(let i=0;i<2;i++){
   const angle=roll(b.selectionSeed,b.abilitySequence,i+0x4481)*Math.PI*2,length=40+roll(b.selectionSeed,b.abilitySequence,i+0xf34)*40,desired={x:t.position.x+Math.cos(angle)*length,y:t.position.y+Math.sin(angle)*length},candidates=[desired];
   const tile=c.tileSize,cx=Math.floor(t.position.x/tile),cy=Math.floor(t.position.y/tile);
   for(let y=cy-3;y<=cy+3;y++)for(let x=cx-3;x<=cx+3;x++)candidates.push({x:(x+.5)*tile,y:(y+.5)*tile});
   const p=candidates.filter(p=>dist(p,t.position)<=96&&!collidesWithTiles(c,p.x,p.y,12)&&brimstoneLineClear(c,a.position,p)&&points.every(q=>dist(q,p)>=40)).sort((x,y)=>dist(x,desired)-dist(y,desired)||x.y-y.y||x.x-y.x)[0];
   if(!p)return [];points.push(p);
  }return points;
 }
 function damage(a,t,n,mechanic,sequence){
  return applyDirectDamage(a,t,combatInteger(multiplyCombat(a.attackDamage,n,10),'round'),mechanic,{sourceActionSequence:sequence});
 }
 function resolve(b,a,targets,c){
  const ability=b.activeAbility,p=copyWire(b.targetPosition),hits=[];
  if(ability==='magma_vents'){
   for(const[position,ordinal]of b.ventTargets.map((p,i)=>[p,i])){
    if(Object.keys(b.ventsById).length>=C.magma_vents.maxActive)break;
    const id=b.bossId+':vent:'+b.abilitySequence+':'+ordinal;
    b.ventsById[id]={id,position:copyWire(position),createdTick:state.tick,detonatesTick:state.tick+270,expiresTick:state.tick+288,sequence:b.abilitySequence,ordinal,arms:brimstoneVentArms(c,position),stage:'boiling',hitEntityIds:[]};
   }
  }else for(const t of targets){
   const center=ability==='strike'?a.position:p,cfg=C[ability];
   if(dist(center,t.position)>cfg.radius||!brimstoneLineClear(c,center,t.position)||ability==='strike'&&Math.abs(delta(aim(a.position,t.position),b.facingAngle))>cfg.halfAngle)continue;
   const result=damage(a,t,cfg.damageNumerator,'brimstone_'+ability,b.abilitySequence);
   if(result!==undefined&&result!==false){hits.push(t.entityId);if(ability==='slam')stats.slamHits++;}
  }
  b.lastAction={ability,resolvedTick:state.tick,targetPosition:ability==='strike'?copyWire(a.position):p,hitEntityIds:hits};
  clear(b);b.actionState='idle';b.nextActionTick=state.tick+(ability==='strike'?50:120);
 }
 function advance(){
  for(const b of records()){
   const a=state.entitiesById[b.entityId];if(!sync(b,a))continue;
   const targets=players(a),c=state.spacesByInstanceId[b.spaceInstanceId].collision;
   if(!targets.length){b.ventsById={};if(b.actionState==='telegraphing'){clear(b);b.actionState='idle';b.nextActionTick=state.tick+60;}continue;}
   for(const[id,v]of Object.entries(b.ventsById).sort(([a],[z])=>a.localeCompare(z))){
    if(state.tick>=v.expiresTick){delete b.ventsById[id];continue;}
    if(v.stage==='boiling'&&state.tick>=v.detonatesTick){
     v.stage='erupting';stats.ventsErupted++;
     for(const t of targets)if(brimstoneVentContains(v,t.position)&&brimstoneLineClear(c,v.position,t.position)){
      const result=damage(a,t,13,'brimstone_vent',v.sequence);if(result!==undefined&&result!==false){v.hitEntityIds.push(t.entityId);stats.ventHits++;}
     }
    }
   }
   if(b.actionState==='telegraphing'){if(state.tick>=b.resolvesTick)resolve(b,a,players(a),c);continue;}
   const preferred=targets.find(t=>t.entityId===observed.get(a.entityId)),t=preferred??targets.filter(t=>lineClear(a,t)).sort((x,y)=>dist(a.position,x.position)-dist(a.position,y.position)||x.entityId.localeCompare(y.entityId))[0];
   if(!t||dist(a.position,t.position)>C.range||!lineClear(a,t))continue;
   b.facingAngle=aim(a.position,t.position);if(state.tick<b.nextActionTick)continue;
   const d=dist(a.position,t.position);let ability=d<=40?'strike':d<64&&roll(b.selectionSeed,b.abilitySequence,0x51ed270b)<.8?'slam':roll(b.selectionSeed,b.abilitySequence,0xa24baed5)<.5?'slam':'magma_vents';
   let vents=ability==='magma_vents'?ventPositions(b,a,t,c):[];
   if(ability==='magma_vents'&&(vents.length!==2||Object.keys(b.ventsById).length+2>C.magma_vents.maxActive)){ability='slam';vents=[];}
   b.abilitySequence++;b.actionState='telegraphing';b.activeAbility=ability;b.targetEntityId=t.entityId;b.targetPosition=copyWire(t.position);b.ventTargets=vents;b.telegraphStartedTick=state.tick;b.resolvesTick=state.tick+C[ability].telegraphTicks;a.movementIntent={x:0,y:0};
   if(ability==='strike')stats.strikes++;else if(ability==='slam')stats.slams++;else stats.ventCasts++;
  }observed.clear();
 }
 return Object.freeze({advance,reconcile:()=>{for(const b of records())sync(b,state.entitiesById[b.entityId]);},owns:id=>Boolean(record(id)),frozen:id=>Boolean(record(id)&&record(id).actionState!=='idle'),observeTarget:(a,t)=>{if(record(a.entityId))observed.set(a.entityId,t?.entityId);},movementMultiplier:id=>record(id)?((state.tick-record(id).activatedTick)%30<15?1.35/1.3:0):1,inspect:()=>({...stats})});
}
