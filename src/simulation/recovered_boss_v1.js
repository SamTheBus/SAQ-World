import {combatInteger,compareCombat,multiplyCombat,addCombat,minCombat,subtractCombat} from '../shared/contracts/combat_amount.js';
import {copyWire} from '../shared/contracts/wire.js';
import {integerBigInt} from '../shared/contracts/integer_domain.js';
import {recoveredBossRecord} from '../shared/contracts/recovered_boss_v1.js';
import {recoveredBossForId} from '../shared/content/recovered_boss_catalog_v1.js';
import {archivedCombatProfile} from '../shared/content/archived_boss_fight_profiles_v1.js';
import {createArchivedBossFightRuntime} from './archived_boss_runtime_v1.js';
import {originalFireCone,onOriginalRing} from './archived_boss_attack_geometry_v1.js';
import {collidesWithTiles} from '../shared/rules/world_geometry.js';
import {moveAegisAffectedActor} from './aegis_goliath_v1.js';

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const direction=(a,b)=>{const d=dist(a,b)||1;return {x:(b.x-a.x)/d,y:(b.y-a.y)/d};};
const roll=(seed,seq,salt=0)=>{let v=(seed^Math.imul(seq+1,0x9e3779b1)^salt)>>>0;v=Math.imul(v^(v>>>16),0x85ebca6b)>>>0;v=Math.imul(v^(v>>>13),0xc2b2ae35)>>>0;return ((v^(v>>>16))>>>0)/4294967296;};
const clear=b=>{b.activeAbility=null;b.targetEntityId=null;b.targetPosition=null;b.telegraphStartedTick=null;b.resolvesTick=null;};
const stage=(row,a,state)=>{if(row.stage!=='defeated'&&!a?.alive){row.stage='defeated';row.defeatedTick=state.tick;}};
const collisionFree=(c,p,r=15)=>!collidesWithTiles(c,p.x,p.y,r);
const lineFree=(c,p,q)=>{const d=dist(p,q),n=Math.max(1,Math.ceil(d/7));for(let i=0;i<=n;i++){const t=i/n;if(!collisionFree(c,{x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t},2))return false;}return true;};
const centerDamage=(ability)=>({eye_lance:16,singularity:20,corrosive_slam:18,spore_storm:11,acid_spill:10,
 chronos_slam:18,prism_collapse:17,control_glitch:9,prism_slam:18,vault_crush:20,gold_fall:14,
 coin_barrage:14,gold_rush:16,gilded_lasso:12,inversion:0,scarlet_fire:17,hooked_tail:20,arena_collapse:16,
 fire_charge:19,landing_fire:16})[ability]??12;
const attackRadius=(ability)=>({eye_lance:24,singularity:95,corrosive_slam:72,spore_storm:105,acid_spill:65,
 chronos_slam:65,prism_collapse:120,control_glitch:180,prism_slam:68,vault_crush:70,gold_fall:75,
 coin_barrage:220,gold_rush:130,gilded_lasso:75,inversion:185,scarlet_fire:115,hooked_tail:75,arena_collapse:200,
 fire_charge:110,landing_fire:90})[ability]??75;

export function createRecoveredBossCombatV1(state,{applyDirectDamage,eligible=()=>true,lineClear=()=>true}={}){
 const observed=new Map(),stats={casts:0,hits:0,summons:0,phaseTwos:0,interrupts:0,poolHits:0,coinsSpawned:0,coinHits:0,coinRicochets:0};
 const root=()=>state.bossCombat;
 const records=()=>Object.values(root()?.bossesByEntityId??{}).filter(recoveredBossRecord).sort((a,b)=>a.bossId.localeCompare(b.bossId));
 const record=id=>{const b=root()?.bossesByEntityId?.[id];return recoveredBossRecord(b)?b:null;};
 const summon=id=>{const row=root()?.summonsByEntityId?.[id];return row?.version==='recovered-boss-summon-v1'?row:null;};
 const players=a=>Object.values(state.playersById).filter(p=>p.connectionStatus==='connected').map(p=>state.entitiesById[p.entityId]).filter(t=>t?.alive&&t.residency.spaceInstanceId===a.residency.spaceInstanceId&&eligible(a,t)).sort((x,y)=>x.entityId.localeCompare(y.entityId));
 const bossesForPlayer=id=>records().filter(b=>b.statusesByEntityId[id]?.expiresTick>state.tick);
 function pool(b,position,kind,radius,lifetime){
  if(b.pools.length>=(b.bossDefinitionId==='cinderhart'?64:b.archive&&b.bossDefinitionId==='corrosive_abomination'?96:20))b.pools.shift();
  let sequence=b.pools.filter(p=>p.createdTick===state.tick).length;
  let id=b.bossId+':pool:'+state.tick+':'+sequence+':'+b.abilitySequence;
  while(b.pools.some(p=>p.id===id)){sequence++;id=b.bossId+':pool:'+state.tick+':'+sequence+':'+b.abilitySequence;}
  b.pools.push({id,kind,position:copyWire(position),radius,createdTick:state.tick,expiresTick:state.tick+lifetime,nextDamageTick:state.tick+45});
 }
 function effect(b,target,kind,duration,multiplier=1){
  const previous=b.statusesByEntityId[target.entityId];
  b.statusesByEntityId[target.entityId]={kind,startedTick:state.tick,
   expiresTick:Math.max(previous?.kind===kind?previous.expiresTick:0,state.tick+duration),movementMultiplier:multiplier};
 }
 function hit(a,t,b,ability,scale=10){
  const damage=combatInteger(multiplyCombat(a.attackDamage,scale,10),'round');
  const applied=applyDirectDamage(a,t,damage,'recovered_'+ability,{sourceActionSequence:b.abilitySequence});
  if(applied!==false&&applied!==undefined){stats.hits++;return true;}
  return false;
 }
 function awaken(b,count=1){
  let awakened=0;
  for(const id of b.summonEntityIds){
   if(awakened>=count)break;
   const s=summon(id),a=state.entitiesById[id];
   if(s?.stage!=='dormant'||!a?.alive)continue;
   s.stage='hatched';s.activatedTick=state.tick;s.hatchTick=state.tick;
   if(b.bossDefinitionId==='corrosive_abomination'&&b.phase===2&&b.chunkStep%3===0&&b.summonEntityIds.filter(id=>summon(id)?.kind==='slag').length<2)s.kind='slag';
   a.attackTimer=0;
   awakened++;stats.summons++;
  }
  return awakened;
 }
 const archived=createArchivedBossFightRuntime(state,{pool,damage:applyDirectDamage,hit,clear,awaken,effect});
 function sync(b,a){
  if(!a?.alive||a.residency.spaceInstanceId!==b.spaceInstanceId||a.residency.residencyRevision!==b.sourceResidencyRevision){
   if(b.actionState!=='defeated'){clear(b);b.actionState='defeated';}
   b.pools=[];b.coinShots=[];b.statusesByEntityId={};if(b.archive){b.archive.charge=null;b.archive.sporesById={};b.archive.poisonByEntityId={};}
   for(const id of b.summonEntityIds){
    const s=summon(id),m=state.entitiesById[id];if(!s||!m)continue;
    if(s.stage==='dormant'&&m.alive){m.alive=false;m.hp=combatInteger(0);s.stage='defeated';s.activatedTick=state.tick;s.hatchTick=state.tick;s.defeatedTick=state.tick;}
   }
   return false;
  }
  for(const id of b.summonEntityIds)stage(summon(id),state.entitiesById[id],state);
  if(b.actionState==='dazed'&&state.tick>=b.dazedUntilTick){b.actionState='idle';b.dazedUntilTick=null;}
  return true;
 }
 function enterPhaseTwo(b,a){
  if(b.archive&&b.bossDefinitionId==='void_overseer')return;
  const cutoff=b.bossDefinitionId==='chronos_arbitrator'?4:5;
  if(b.phase!==1||compareCombat(a.hp,multiplyCombat(a.maxHp,cutoff,10))>0)return;
  b.phase=2;b.phase2Triggered=true;stats.phaseTwos++;
  if(b.bossDefinitionId==='nexus_overseer')awaken(b,2);
  if(b.bossDefinitionId==='cinderhart')awaken(b,2);
  if(b.bossDefinitionId==='chronos_arbitrator'){
   b.nextActionTick=state.tick;
   if(b.archive){
    // Original Chronos rewinds on phase threshold rather than waiting for a
    // random follow-up choice. Move to the chamber's collision-safe center.
    const c=state.spacesByInstanceId[b.spaceInstanceId]?.collision;
    if(c){const center={x:Math.floor(c.width/2)*c.tileSize,y:Math.floor(c.height/2)*c.tileSize};
     if(!collidesWithTiles(c,center.x,center.y,a.hullRadius))a.position=center;}
    const t=players(a)[0];
    if(t)beginAbility(b,a,t,'chronos_rewind');
   }
  }
 }
 function choose(b,a,target){
  const id=b.bossDefinitionId,n=b.abilitySequence+1,r=roll(b.selectionSeed,n,0x51ed270b);
  if(id==='corrosive_abomination'){
   if(b.archive){const seq=b.abilitySequence,choice=b.phase===2&&roll(b.selectionSeed,seq,0xa24baed5)>=.5?'spore_storm':'corrosive_slam';return dist(a.position,target.position)<64&&roll(b.selectionSeed,seq,0x51ed270b)<.8?'corrosive_slam':choice;}
   return b.phase===2&&r<.5?'spore_storm':r<.82?'corrosive_slam':'acid_spill';
  }
  if(id==='void_overseer')return r<.48?'eye_lance':'singularity';
  if(id==='chronos_arbitrator')return b.phase===2&&b.chunkStep===0?'chronos_rewind':r<.5?'chronos_slam':'time_field';
  if(id==='nexus_overseer')return r<.35?'control_glitch':r<.74?'prism_collapse':'prism_slam';
  if(id==='gilded_vault_keeper')return b.phase===2&&r<.32?'taxation':r<.64?'vault_crush':'gold_fall';
  if(id==='marcus')return b.phase===2&&r<.23?'molten_shield':r<.48?'coin_barrage':r<.71?'gold_rush':r<.86?'inversion':'gilded_lasso';
  if(id==='hooktail'){
   if(b.archive){const pool=b.phase===2?['hooked_tail','scarlet_fire','arena_collapse']:['hooked_tail','scarlet_fire'];const chosen=pool[Math.floor(roll(b.selectionSeed,b.abilitySequence,568840981)*pool.length)];return dist(a.position,target.position)<64&&roll(b.selectionSeed,b.abilitySequence,3366196011)<.8?'hooked_tail':chosen;}
   return b.phase===2&&r<.4?'arena_collapse':r<.75?'scarlet_fire':'hooked_tail';
  }
  if(id==='cinderhart')return b.summonEntityIds.some(id=>summon(id)?.stage==='dormant')&&(!b.archive||state.tick>=b.archive.nextWarrenTick)?'warren_call':'fire_charge';
  return null;
 }
 function beginAbility(b,a,target,ability){
  const cfg=b.archive?archivedCombatProfile(b.bossDefinitionId).attack:recoveredBossForId(b.bossDefinitionId).attacks;
  b.actionState='telegraphing';b.abilitySequence++;b.activeAbility=ability;b.targetEntityId=target.entityId;
  b.targetPosition=copyWire(target.position);b.telegraphStartedTick=state.tick;b.resolvesTick=state.tick+cfg[ability];
  a.movementIntent={x:0,y:0};stats.casts++;
  if(ability==='chronos_rewind'){b.chunkStep=1;b.shieldMaxHp=String((integerBigInt(a.maxHp)*15n+99n)/100n);b.shieldHp=b.shieldMaxHp;}
  if(['taxation','molten_shield'].includes(ability)){
   b.shieldMaxHp=String((integerBigInt(a.maxHp)*BigInt(ability==='taxation'?15:20)+99n)/100n);b.shieldHp=b.shieldMaxHp;
  }
 }
 function fireCoinVolley(b,a){
  b.coinShots??=[];
  // One authoritative projectile per orbiting coin. The volley is radial,
  // so kiting or using walls is an actual defense rather than instant AoE.
  const angle=Math.atan2(b.targetPosition.y-a.position.y,b.targetPosition.x-a.position.x);
  for(let i=0;i<8;i++){
   const theta=angle+i*Math.PI/4;
   const shot={id:b.bossId+':coin:'+b.abilitySequence+':'+i,sequence:b.abilitySequence,ordinal:i,
    position:{x:a.position.x+Math.cos(theta)*20,y:a.position.y+Math.sin(theta)*20},
    velocity:{x:Math.cos(theta)*7,y:Math.sin(theta)*7},firedTick:state.tick,expiresTick:state.tick+120,bounces:0};
   b.coinShots.push(shot);
   stats.coinsSpawned++;
  }
  if(b.coinShots.length>16)b.coinShots=b.coinShots.slice(-16);
 }
 function advanceCoinShots(b,a,targets,c){
  if(b.bossDefinitionId!=='marcus'||!b.coinShots?.length)return;
  for(const p of b.coinShots){
   if(state.tick<=p.firedTick)continue;
   if(state.tick>=p.expiresTick){p.expired=true;continue;}
   let next={x:p.position.x+p.velocity.x,y:p.position.y+p.velocity.y};
   if(!collisionFree(c,next,7)){
    const collideX=!collisionFree(c,{x:p.position.x+p.velocity.x,y:p.position.y},7);
    const collideY=!collisionFree(c,{x:p.position.x,y:p.position.y+p.velocity.y},7);
    if(collideX||!collideY)p.velocity.x*=-1;
    if(collideY||!collideX)p.velocity.y*=-1;
    p.bounces++;stats.coinRicochets++;
    if(p.bounces>1){p.expired=true;continue;}
    next={x:p.position.x+p.velocity.x,y:p.position.y+p.velocity.y};
    if(!collisionFree(c,next,7)){p.expired=true;continue;}
   }
   // A real swept segment contact prevents a coin teleporting past a hero.
   let struck=null,best=2;
   const vx=next.x-p.position.x,vy=next.y-p.position.y,vv=vx*vx+vy*vy||1;
   for(const t of targets){
    if(!t?.alive)continue;
    const u=clamp(((t.position.x-p.position.x)*vx+(t.position.y-p.position.y)*vy)/vv);
    const x=p.position.x+u*vx,y=p.position.y+u*vy,r=7+(t.combatRadius??t.hullRadius??10);
    if((t.position.x-x)**2+(t.position.y-y)**2<=r*r&&u<best){struck=t;best=u;}
   }
   if(struck){
    const damage=combatInteger(multiplyCombat(a.attackDamage,14,10),'round');
    const result=applyDirectDamage(a,struck,damage,'marcus_ricochet_coin',{sourceActionSequence:p.sequence,
     directEnemyAttack:'ranged',projectileImpact:true,projectileDirection:{x:p.velocity.x/7,y:p.velocity.y/7}});
    if(result!==undefined&&result!==false)stats.coinHits++;
    p.expired=true;continue;
   }
   p.position=next;
  }
  b.coinShots=b.coinShots.filter(p=>!p.expired&&state.tick<p.expiresTick);
 }
 function daze(b,ticks=210){
  clear(b);b.shieldHp='0';b.actionState='dazed';b.dazedUntilTick=state.tick+ticks;
  b.shieldBrokenTick=state.tick;b.nextActionTick=b.dazedUntilTick;stats.interrupts++;
 }
 function resolve(b,a,targets){
  const ability=b.activeAbility,pos=copyWire(b.targetPosition),collision=state.spacesByInstanceId[b.spaceInstanceId].collision;
  const hits=[],dmg=centerDamage(ability),radius=attackRadius(ability);
  if(archived.resolveOriginal(b,a,targets,ability,pos,collision))return;
  if(ability==='warren_call'){
   awaken(b,b.phase===2?5:3);
   if(b.archive)b.archive.nextWarrenTick=state.tick+480;
  }else if(ability==='chronos_rewind'){
   const restore=combatInteger(multiplyCombat(a.maxHp,2,10),'round');
   a.hp=combatInteger(minCombat(a.maxHp,addCombat(a.hp,restore)),'round');
  } else if(ability==='coin_barrage'){
   fireCoinVolley(b,a);
  } else if(ability==='taxation'){
   a.hp=combatInteger(minCombat(a.maxHp,addCombat(a.hp,multiplyCombat(a.maxHp,8,100))),'round');
   // Cosmetic vault magic only. Never deduct or escrow player gold.
  } else if(ability==='molten_shield'){
   pool(b,a.position,'molten',55,240);
  } else if(ability==='gold_rush'){
   const directionTo=direction(a.position,pos);
   for(let i=0;i<3;i++){
    moveAegisAffectedActor(collision,a,{x:directionTo.x*56,y:directionTo.y*56});
    pool(b,a.position,'molten',43,180);
    for(const t of targets)if(dist(a.position,t.position)<44&&lineFree(collision,a.position,t.position)&&hit(a,t,b,ability,14))hits.push(t.entityId);
   }
  } else {
   for(const t of targets){
    const d=dist(t.position,ability==='corrosive_slam'||ability==='chronos_slam'||ability==='prism_slam'||ability==='hooked_tail'||ability==='inversion'?a.position:pos);
    let inside=d<=radius;
    if(ability==='eye_lance') {
     const v=direction(a.position,pos),p={x:t.position.x-a.position.x,y:t.position.y-a.position.y};
     const along=p.x*v.x+p.y*v.y,lateral=Math.abs(p.x*v.y-p.y*v.x);inside=along>=0&&along<=260&&lateral<22;
    }
    if(ability==='gold_fall')inside=[0,1,2].some(i=>{const v=i*Math.PI*2/3;return dist(t.position,{x:pos.x+Math.cos(v)*62,y:pos.y+Math.sin(v)*62})<=26;});
    if(ability==='arena_collapse')inside=Math.abs(dist(t.position,b.homePosition)-(205-b.collapseStep*26))<=23;
    if(!inside||!lineFree(collision,a.position,t.position)||!lineClear(a,t))continue;
    if(ability==='inversion'){if(t.alive){effect(b,t,'control_glitch',180,.94);hits.push(t.entityId);}continue;}
    if(hit(a,t,b,ability,dmg))hits.push(t.entityId);
    if(['control_glitch','inversion'].includes(ability)&&t.alive)effect(b,t,'control_glitch',180,.94);
    if(ability==='gilded_lasso'&&t.alive)effect(b,t,'lasso',90,.5);
   }
  }
  if(ability==='spore_storm')for(let i=0;i<3;i++){
   const angle=i*2*Math.PI/3+roll(b.selectionSeed,b.abilitySequence,i)*.35;
   pool(b,{x:pos.x+Math.cos(angle)*43,y:pos.y+Math.sin(angle)*43},'acid',27,240);
  }
  if(ability==='acid_spill')pool(b,pos,'acid',54,480);
  if(ability==='time_field')pool(b,pos,'time',105,420);
  if(ability==='singularity')pool(b,pos,'void',93,90);
  if(ability==='gold_fall')for(let i=0;i<3;i++)pool(b,{x:pos.x+Math.cos(i*2*Math.PI/3)*62,y:pos.y+Math.sin(i*2*Math.PI/3)*62},'gold',22,180);
  if(ability==='prism_collapse')pool(b,pos,'prism',120,180);
  
  if(ability==='scarlet_fire')for(let i=0;i<3;i++){const v=direction(a.position,pos);pool(b,{x:a.position.x+v.x*(40+i*32),y:a.position.y+v.y*(40+i*32)},'fire',28,180);}
  if(ability==='arena_collapse'){b.collapseStep=Math.min(7,b.collapseStep+1);pool(b,b.homePosition,'collapse',205-b.collapseStep*26,600);}
  if(ability==='fire_charge'){
   // Swept collision-checked charge: connected fire patches last 180 ticks.
   const v=direction(a.position,pos);
   for(let i=0;i<13;i++){
    const prior=copyWire(a.position);
    moveAegisAffectedActor(collision,a,{x:v.x*17,y:v.y*17});
    if(dist(a.position,prior)<1)break;
    pool(b,copyWire(a.position),'fire',19,180);
   }
  }
  b.lastAction={ability,resolvedTick:state.tick,targetPosition:pos,hitEntityIds:hits};clear(b);
  // Keep Treasury shields active until broken; their defenses are not merely a telegraph.
  if(!['marcus','gilded_vault_keeper'].includes(b.bossDefinitionId)){b.shieldHp='0';b.shieldMaxHp='0';}
  b.actionState='idle';b.nextActionTick=state.tick+(b.phase===2?90:120);
 }
 function updatePools(b,a,targets,c){
  b.pools=b.pools.filter(p=>p.expiresTick>state.tick);
  for(const p of b.pools){
   if(p.kind==='time')for(const t of targets)if(dist(t.position,p.position)<p.radius&&lineFree(c,p.position,t.position)){
    const prior=b.statusesByEntityId[t.entityId];
    b.statusesByEntityId[t.entityId]={kind:'time_slow',startedTick:prior?.kind==='time_slow'?prior.startedTick:state.tick,expiresTick:state.tick+6,movementMultiplier:.6};
   }
   if(state.tick<p.nextDamageTick)continue;
   p.nextDamageTick=Math.min(p.expiresTick,state.tick+45);
   if(p.kind==='time'||p.kind==='gold_spill'||b.archive&&b.bossDefinitionId==='corrosive_abomination'&&['acid','slag'].includes(p.kind)||b.archive&&b.bossDefinitionId==='hooktail'&&p.kind==='collapse')continue;
   const effectiveRadius=p.kind==='prism'?p.radius*(1-.64*Math.min(1,(state.tick-p.createdTick)/(p.expiresTick-p.createdTick))):p.radius;
   for(const t of targets){
    const d=dist(t.position,p.position);
    const inside=p.kind==='collapse'||p.kind==='prism'?Math.abs(d-effectiveRadius)<20:d<effectiveRadius+t.hullRadius*.3;
    if(inside&&lineFree(c,p.position,t.position)){if(hit(a,t,b,p.kind,4))stats.poolHits++;}
   }
  }
 }
 function advanceBunnies(b,c){
  for(const id of b.summonEntityIds){
   const s=summon(id),a=state.entitiesById[id];
   if(s?.kind!=='bunny'||s.stage!=='hatched'||!a?.alive)continue;
   const age=state.tick-s.activatedTick,period=b.phase===2?36:46,flight=b.phase===2?24:28;
   if(age<=0)continue;
   const cycle=Math.floor(age/period),time=age%period,theta=roll(b.selectionSeed,cycle+11+s.ordinal*131,0xc1dece55)*Math.PI*2;
   const stride=55+roll(b.selectionSeed,cycle+11+s.ordinal*131,0xc1dece56)*20;
   if(time<flight){moveAegisAffectedActor(c,a,{x:Math.cos(theta)*stride/flight,y:Math.sin(theta)*stride/flight});}
   else if(time===flight)pool(b,copyWire(a.position),'fire',18,300);
  }
 }
 function advanceHolograms(b,targets,c){
  for(const id of b.summonEntityIds){
   const s=summon(id),a=state.entitiesById[id];
   if(s?.kind!=='hologram'||s.stage!=='hatched'||!a?.alive||state.tick%90!==s.ordinal*17)continue;
   const target=[...targets].sort((x,y)=>dist(x.position,a.position)-dist(y.position,a.position)||x.entityId.localeCompare(y.entityId))[0];
   if(target&&dist(target.position,a.position)<260&&lineFree(c,a.position,target.position))hit(a,target,b,'hologram_shot',6);
  }
 }
 function advance(){
  for(const b of records()){
   const a=state.entitiesById[b.entityId];if(!sync(b,a))continue;
   const c=state.spacesByInstanceId[b.spaceInstanceId]?.collision;if(!c)continue;
   const targets=players(a);updatePools(b,a,targets,c);advanceCoinShots(b,a,targets,c);
   for(const[id,s]of Object.entries(b.statusesByEntityId))if(state.tick>=s.expiresTick||!state.entitiesById[id]?.alive)delete b.statusesByEntityId[id];
   enterPhaseTwo(b,a);
   // Rabbits hop independently even while their stag is rushing.
   if(b.bossDefinitionId==='cinderhart')advanceBunnies(b,c);
   if(archived.tick(b,a,targets,c))continue;
   if(b.bossDefinitionId==='nexus_overseer'&&!b.archive)advanceHolograms(b,targets,c);
   if(b.bossDefinitionId==='corrosive_abomination'){
    for(let step=b.chunkStep+1;step<=12;step++){
     if(compareCombat(a.hp,multiplyCombat(a.maxHp,100-step*8,100))>0)break;
     b.chunkStep=step;awaken(b,1);
     if(!b.archive)pool(b,a.position,step%3===0?'slag':'acid',step%3===0?28:20,step%3===0?240:180);
    }
    if(!b.archive&&state.tick%24===0&&dist(a.position,b.lastTrailPosition)>12){pool(b,a.position,'acid',19,480);b.lastTrailPosition=copyWire(a.position);}
   }
   if(b.actionState==='dazed')continue;
   if(b.actionState==='telegraphing'){
    if(b.activeAbility==='singularity')for(const t of targets){
     const d=dist(t.position,a.position);if(d>10&&lineFree(c,t.position,a.position)){
      const v=direction(t.position,a.position),force=Math.min(4.8,4500/(d*d+400));moveAegisAffectedActor(c,t,{x:v.x*force,y:v.y*force});
     }
    }
    if(state.tick>=b.resolvesTick)resolve(b,a,targets);
    continue;
   }
   if(state.tick<b.nextActionTick)continue;
   const preferred=targets.find(t=>t.entityId===observed.get(a.entityId));
   const target=preferred??targets.filter(t=>lineClear(a,t)).sort((x,y)=>dist(a.position,x.position)-dist(a.position,y.position)||x.entityId.localeCompare(y.entityId))[0];
   if(!target||dist(a.position,target.position)>(b.archive&&b.bossDefinitionId==='cinderhart'?520:280)||!lineClear(a,target))continue;
   const ability=choose(b,a,target);if(ability)beginAbility(b,a,target,ability);
  }
  observed.clear();
 }
 function beginTick(){for(const b of records()){
  b.pools=b.pools.filter(p=>p.expiresTick>state.tick);
  b.coinShots=(b.coinShots??[]).filter(p=>p.expiresTick>state.tick);
  if(b.archive)for(const[id,p]of Object.entries(b.archive.sporesById))if(state.tick>=p.expiresTick)delete b.archive.sporesById[id];
  for(const[id,s] of Object.entries(b.statusesByEntityId))if(s.expiresTick<=state.tick||!state.entitiesById[id]?.alive)delete b.statusesByEntityId[id];
 }}
 function reconcile(){for(const b of records())sync(b,state.entitiesById[b.entityId]);beginTick();}
 function frozen(id){const s=summon(id);if(s)return s.stage==='dormant'||s.kind==='bunny'||s.kind==='hologram';const b=record(id);return Boolean(b&&['telegraphing','rushing','dazed','defeated'].includes(b.actionState));}
 function movementMultiplier(id){
  const b=record(id);if(b)return b.actionState==='dazed'||b.actionState==='rushing'?0:b.phase===2?1.2:.8;
  const s=summon(id);if(s&&(s.stage==='dormant'||s.kind==='bunny'||s.kind==='hologram'))return 0;
  let value=1;
  for(const boss of bossesForPlayer(id))value=Math.min(value,boss.statusesByEntityId[id].movementMultiplier);
  return value;
 }
 function mitigateIncoming(target,damage,source,attribution){
  const b=record(target.entityId);if(!b)return null;
  if(b.bossDefinitionId==='nexus_overseer'&&b.phase===2&&b.summonEntityIds.some(id=>state.entitiesById[id]?.alive&&summon(id)?.stage==='hatched'))return {damage:combatInteger(0),shielded:true};
  if(BigInt(b.shieldHp)>0n){
   const left=BigInt(b.shieldHp)-integerBigInt(combatInteger(damage));
   if(left<=0n){daze(b,b.bossDefinitionId==='gilded_vault_keeper'?210:210);return {damage:combatInteger(0),shielded:true};}
   b.shieldHp=String(left);return {damage:combatInteger(0),shielded:true};
  }
  return {damage,shielded:false};
 }
 function primaryReady(entityId){
  const hero=state.entitiesById[entityId];
  if(!hero?.alive||!state.primary?.completedById)return true;
  const slowed=records().some(b=>b.bossDefinitionId==='chronos_arbitrator'&&b.archive&&b.spaceInstanceId===hero.residency.spaceInstanceId&&
   b.pools.some(p=>p.kind==='time'&&p.createdTick<state.tick&&p.expiresTick>state.tick&&
    dist(hero.position,p.position)<=p.radius+(hero.hullRadius??9)));
  if(!slowed)return true;
  // Original time dilation delays the NEXT swing. The current active sword
  // animation is allowed to finish unchanged; then ~1.67x attack interval.
  const last=Object.values(state.primary.completedById).filter(a=>a.sourceEntityId===entityId&&a.completedTick!==null).sort((a,b)=>b.completedTick-a.completedTick)[0];
  if(!last)return true;
  const elapsed=Math.max(1,last.completedTick-last.startedTick);
  const additional=Math.max(1,Math.round(elapsed*2/3));
  return state.tick>=last.completedTick+additional;
 }
 return Object.freeze({advance,beginTick,reconcile,owns:id=>Boolean(record(id)||summon(id)),frozen,primaryReady,
  observeTarget:(a,t)=>{if(record(a.entityId))observed.set(a.entityId,t?.entityId);},
  movementMultiplier,mitigateIncoming,inspect:()=>({...stats,bossCount:records().length})});
}
