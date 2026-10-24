// Adapter for the EXACT Marcus and Gilded Canvas rendering code recovered
// from the user's original playable HTML arenas. The simulation owns all hits,
// collision, player wallets, timers and encounter decisions.
import {drawMarcusTheOutlaw,drawMarcusGround,marcusDepthItems} from './boss_presentation_marcus_the_outlaw_v1.js';
import {drawGildedVaultKeeper,drawGildedGround,gildedDepthItems} from './boss_presentation_gilded_vault_keeper_v1.js';
import {gildedGoldFallTargets} from '../shared/content/original_gilded_gold_fall_v1.js';
import {originalMarcusDashNodes} from '../shared/content/original_marcus_gold_rush_v1.js';

const marcus=id=>id==='marcus';
const gilded=id=>id==='gilded_vault_keeper';
export const hasTreasuryBossPainter=id=>marcus(id)||gilded(id);
const translated=(id,ability)=>{
 if(marcus(id))return ({coin_barrage:'barrage',gold_rush:'gold_rush_dash',gilded_lasso:'lasso',molten_shield:'molten_shield',inversion:'inversion'})[ability]??ability;
 return ability;
};
const point=p=>({x:p.x,y:p.y});
const copyAction=(id,action,actor)=>action?{
 ...action,ability:translated(id,action.ability),originPosition:action.originPosition??point(actor.position),
 position:action.position??action.targetPosition??point(actor.position),
 sequence:action.sequence??actor.boss?.abilitySequence??0,
 ...(marcus(id)&&action.ability==='gold_rush'?{
  dashNodes:action.dashNodes??originalMarcusDashNodes(action.originPosition??actor.position,action.targetPosition??actor.position),
  targets:action.dashNodes??originalMarcusDashNodes(action.originPosition??actor.position,action.targetPosition??actor.position)
 }:{})
}:null;
const referencePoint=a=>a.boss?.pendingAction?.targetPosition??a.boss?.lastAction?.targetPosition??{x:a.position.x+1,y:a.position.y};
function channel(actor,tick){
 const b=actor.boss??{},id=b.bossDefinitionId;
 if(!b.shieldActive||Number(b.shieldHp??0)<=0)return null;
 const action=b.pendingAction?.ability===(marcus(id)?'molten_shield':'taxation')?b.pendingAction:null;
 const last=b.lastAction?.ability===(marcus(id)?'molten_shield':'taxation')?b.lastAction:null;
 const start=action?.startedTick??last?.resolvedTick??tick-20;
 return {id:b.bossId+':ward',bossId:b.bossId,sourceEntityId:actor.entityId,
  outcome:'channeling',startedTick:Math.min(start,tick),resolvesTick:action?.resolvesTick??tick+1,resolvedTick:null,
  position:point(actor.position),originPosition:point(actor.position),currentPosition:point(actor.position),
  targetPosition:referencePoint(actor),sequence:b.abilitySequence??0,
  shieldUnits:b.shieldHp, maxShieldUnits:b.shieldMaxHp,
  // There is no siphon of real player gold; visuals cannot invent a theft.
  lastSiphon:null,lastShieldHit:null};
}
function originalActor(actor,tick){
 const id=actor.boss?.bossDefinitionId;
 if(!hasTreasuryBossPainter(id))return actor;
 const aim=referencePoint(actor),b=actor.boss;
 const ward=channel(actor,tick);
 return {...actor,boss:{...b,bossDefinitionId:marcus(id)?'marcus_the_outlaw':'gilded_vault_keeper',
  pendingAction:copyAction(id,b.pendingAction??(marcus(id)&&b.goldRush?{
   ability:'gold_rush',startedTick:b.goldRush.startedTick,resolvesTick:b.goldRush.endsTick,
   targetPosition:b.goldRush.targetPosition,originPosition:b.goldRush.originPosition,dashNodes:b.goldRush.nodes
  }:null),actor),lastAction:copyAction(id,b.lastAction,actor),
  facingAngle:Math.atan2(aim.y-actor.position.y,aim.x-actor.position.x),
  ...(marcus(id)?{moltenShield:ward}:{taxation:ward}),
  dazeStartedTick:b.shieldBrokenTick??null,dazeEndsTick:b.dazedUntilTick??null,
 }};
}
let memoModel=null,memoTick=null,memoArt=null;
function project(model,tick){
 if(model===memoModel&&tick===memoTick)return memoArt;
 memoModel=model;memoTick=tick;
 const entities=Object.entries(model.entitiesById??{}).map(([entityId,actor])=>({...actor,entityId})),bosses=entities.filter(a=>a.alive&&hasTreasuryBossPainter(a.boss?.bossDefinitionId));
 if(!bosses.length)return memoArt=null;
 const artActors=Object.fromEntries(entities.map(a=>[a.entityId,originalActor(a,tick)]));
 const h=model.bossHazards??{},tele=h.recoveredTelegraphs??[],pools=h.recoveredPools??[];
 const hazards={...h,
  marcusSlagPools:pools.filter(p=>marcus(p.bossDefinitionId)&&p.kind==='molten'),
  marcusTelegraphs:[],marcusImpacts:[],marcusProjectiles:[],marcusSnares:[],marcusInversions:[],marcusMoltenShields:[],marcusGoldDrops:[],
  gildedTelegraphs:[],gildedImpacts:[],gildedTaxations:[],gildedGoldDrops:[]};
 for(const actor of bosses){
  const id=actor.boss.bossDefinitionId,b=actor.boss,art=artActors[actor.entityId];
  const act=art.boss.pendingAction,last=art.boss.lastAction;
  for(const row of tele.filter(q=>q.bossId===b.bossId)){
   const original=copyAction(id,row,actor),rad=marcus(id)?original.ability==='inversion'?120:original.ability==='lasso'?48:42:
     original.ability==='gold_fall'?24:64;
   const target=point(original.targetPosition??row.position),base={...original,
    bossId:b.bossId,sourceEntityId:actor.entityId,position:target,radius:rad,
    startedTick:row.startedTick,resolvesTick:row.resolvesTick,
    originPosition:point(row.originPosition??actor.position),sequence:row.sequence};
   if(gilded(id)&&original.ability==='gold_fall'){
    base.targets=gildedGoldFallTargets(row.selectionSeed??b.selectionSeed??0,row.sequence,target);
   }
   if(marcus(id))hazards.marcusTelegraphs.push(base);else hazards.gildedTelegraphs.push(base);
  }
  if(marcus(id)&&b.goldRush){
   const dash=b.goldRush;
   hazards.marcusTelegraphs.push({id:b.bossId+':rush:'+dash.startedTick,bossId:b.bossId,sourceEntityId:actor.entityId,
    ability:'gold_rush_dash',startedTick:dash.startedTick,resolvesTick:dash.endsTick,
    position:point(dash.targetPosition),targetPosition:point(dash.targetPosition),originPosition:point(dash.originPosition),
    dashNodes:dash.nodes.map(point)});
  }
  if(last&&tick-last.resolvedTick>=0&&tick-last.resolvedTick<40){
   const base={...last,bossId:b.bossId,sourceEntityId:actor.entityId,position:last.position??last.targetPosition,
    sequence:b.abilitySequence??0,resolvedTick:last.resolvedTick,originPosition:point(actor.position)};
   if(gilded(id)&&last.ability==='gold_fall'){
    const t=last.targetPosition;base.targets=gildedGoldFallTargets(b.selectionSeed??0,b.abilitySequence??0,t);
   }
   if(marcus(id))hazards.marcusImpacts.push(base);else hazards.gildedImpacts.push(base);
  }
  if(marcus(id)){
   for(const shot of b.coinShots??[])hazards.marcusProjectiles.push({
    id:shot.id,index:shot.ordinal,position:point(shot.position),
    previousPosition:{x:shot.position.x-shot.velocity.x,y:shot.position.y-shot.velocity.y},
    velocity:point(shot.velocity),radius:4.5,createdTick:shot.firedTick,expiresTick:shot.expiresTick,lastBounce:null});
   for(const a of entities){
    const status=a.timedStatuses??{};
    for(const [type,dest]of[['lasso','marcusSnares'],['control_glitch','marcusInversions']]){
     const row=status[type];if(!row||row.sourceBossId!==b.bossId)continue;
     hazards[dest].push({targetEntityId:a.entityId,position:point(a.position),appliedTick:row.applicationTick,expiresTick:row.expirationTick});
    }
   }
   const shield=art.boss.moltenShield;if(shield)hazards.marcusMoltenShields.push(shield);
  }else{
   const shield=art.boss.taxation;if(shield)hazards.gildedTaxations.push(shield);
  }
 }
 return memoArt={...model,entitiesById:artActors,bossHazards:hazards};
}
export function drawTreasuryBossV2(c,actor,tick,flash=false){
 if(!hasTreasuryBossPainter(actor.boss?.bossDefinitionId))return false;
 const a=originalActor(actor,tick);
 return marcus(actor.boss.bossDefinitionId)?drawMarcusTheOutlaw(c,a,tick,flash):drawGildedVaultKeeper(c,a,tick,flash);
}
export function drawTreasuryBossGroundV2(c,model,tick){
 const a=project(model,tick);if(!a)return;
 drawMarcusGround(c,a,tick);drawGildedGround(c,a,tick);
}
export function treasuryBossDepthItems(model,tick,viewport){
 const a=project(model,tick);if(!a)return [];
 return [...marcusDepthItems(a,tick,viewport),...gildedDepthItems(a,tick,viewport)];
}
export function drawTreasuryBossHudV2(c,canvas,model){
 const art=project(model,model.tick);if(!art)return false;
 const boss=Object.values(model.entitiesById??{}).find(a=>a.alive&&hasTreasuryBossPainter(a.boss?.bossDefinitionId)&&a.boss?.shieldActive);
 if(!boss)return false;
 const b=boss.boss,width=Math.min(430,canvas.width-28),x=(canvas.width-width)/2,y=53;
 const hp=Math.max(0,Number(b.shieldHp??0)),max=Math.max(1,Number(b.shieldMaxHp??0));
 c.save();c.fillStyle='#12111acc';c.fillRect(x,y,width,10);
 c.fillStyle='#dfb354';c.fillRect(x+2,y+2,(width-4)*Math.min(1,hp/max),6);
 c.strokeStyle='#efd392';c.strokeRect(x+.5,y+.5,width-1,9);
 c.restore();return true;
}