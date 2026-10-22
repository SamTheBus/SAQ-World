import {addCombat,combatInteger,compareCombat,maxCombat,minCombat,multiplyCombat,subtractCombat} from '../shared/contracts/combat_amount.js';
import {BLOOD_BERSERKER_AFFIX_ID,BLOOD_BERSERKER_D12_4H_A,GLACIAL_WARDEN_AFFIX_ID,GLACIAL_WARDEN_D12_4E,IRON_CITADEL_AFFIX_ID,IRON_CITADEL_D12_4G,NULLIFIER_AFFIX_ID,NULLIFIER_D12_4I,SLAG_SHAPER_AFFIX_ID,SLAG_SHAPER_D12_4K,SWIFT_COMMANDER_AFFIX_ID,SWIFT_COMMANDER_D12_4D,TOXIC_DECAY_AFFIX_ID,TOXIC_DECAY_D12_4F,VITALITY_WEAVER_AFFIX_ID,VITALITY_WEAVER_D12_4,WEB_WEAVER_AFFIX_ID,WEB_WEAVER_D12_4J} from '../shared/content/elite_affixes_d12_4.js';
import {ELITE_ATTACK_AURA_D12_4H_A_VERSION,ELITE_GUARD_D12_4G_VERSION,ELITE_HASTE_D12_4D_VERSION,HOSTILE_FLOOR_HAZARD_D12_4J_VERSION,hostileHazardIdD12_4J,NULLIFICATION_RESISTANCE_D12_4I_VERSION,PENDING_HOSTILE_HAZARD_D12_4J_VERSION,SLAG_BURN_STATUS_D12_4K_VERSION,TIMED_ACTOR_STATUS_D12_4E_VERSION,TIMED_NULLIFIED_D12_4I_VERSION,TIMED_PLAYER_POISON_D12_4F_VERSION,WEBBED_STATUS_D12_4J_VERSION} from '../shared/contracts/elite_combat_d12_4.js';
import {copyWire,requireContract as check} from '../shared/contracts/wire.js';

const ratioOrder=(a,b)=>compareCombat(multiplyCombat(a.hp,b.maxHp),multiplyCombat(b.hp,a.maxHp))||a.entityId.localeCompare(b.entityId);

export function selectVitalityWeaverTargetsD12_4(state,e,{lineClear}){
 const source=state.entitiesById[e.entityId],group=state.groupsById[e.groupId],site=state.d9World?.functionalSitesById?.[e.siteId],floor=site?.floors?.find(row=>row.floorId===e.floorId),rooms=new Map((floor?.enemyIds??[]).map((id,index)=>[id,floor.encounter.members[index]?.roomId]));
 check(source&&group?.entityIds.includes(source.entityId)&&rooms.get(source.entityId)===e.roomId,'Vitality Weaver encounter ownership changed');
 return group.entityIds.map(id=>state.entitiesById[id]).filter(target=>target&&target.entityId!==source.entityId&&target.alive&&target.residency.spaceInstanceId===source.residency.spaceInstanceId&&rooms.get(target.entityId)===e.roomId&&compareCombat(target.hp,target.maxHp)<0&&Math.hypot(target.position.x-source.position.x,target.position.y-source.position.y)<=VITALITY_WEAVER_D12_4.pulse.radius&&lineClear(source,target)).sort(ratioOrder).slice(0,VITALITY_WEAVER_D12_4.pulse.maximumTargets);
}

export function selectSwiftCommanderTargetsD12_4D(state,e){
 const source=state.entitiesById[e.entityId];check(source?.team==='hostile','Swift Commander source missing');
 return Object.values(state.entitiesById).filter(target=>target.entityId!==source.entityId&&target.team==='hostile'&&target.alive&&target.residency.spaceInstanceId===source.residency.spaceInstanceId&&Math.hypot(target.position.x-source.position.x,target.position.y-source.position.y)<=SWIFT_COMMANDER_D12_4D.pulse.radius).sort((a,b)=>a.entityId.localeCompare(b.entityId));
}

export function selectGlacialWardenTargetsD12_4E(state,e){
 const source=state.entitiesById[e.entityId];check(source?.team==='hostile','Glacial Warden source missing');
 return Object.values(state.playersById).map(player=>state.entitiesById[player.entityId]).filter(target=>target?.team==='party'&&target.alive&&target.residency.spaceInstanceId===source.residency.spaceInstanceId&&Math.hypot(target.position.x-source.position.x,target.position.y-source.position.y)<=GLACIAL_WARDEN_D12_4E.pulse.radius).sort((a,b)=>a.entityId.localeCompare(b.entityId));
}

export function selectIronCitadelTargetsD12_4G(state,e){
 const source=state.entitiesById[e.entityId];check(source?.team==='hostile','Iron Citadel source missing');
 return Object.values(state.entitiesById).filter(target=>target.entityId!==source.entityId&&target.team==='hostile'&&target.alive&&target.residency.spaceInstanceId===source.residency.spaceInstanceId&&Math.hypot(target.position.x-source.position.x,target.position.y-source.position.y)<=IRON_CITADEL_D12_4G.pulse.radius).sort((a,b)=>a.entityId.localeCompare(b.entityId));
}

export function selectBloodBerserkerTargetsD12_4H_A(state,e){
 const source=state.entitiesById[e.entityId],group=state.groupsById[e.groupId];check(source?.team==='hostile'&&group?.entityIds.includes(source.entityId),'Berserker source missing');
 return group.entityIds.map(id=>state.entitiesById[id]).filter(target=>target&&target.entityId!==source.entityId&&target.team==='hostile'&&target.alive&&target.residency.spaceInstanceId===source.residency.spaceInstanceId&&Math.hypot(target.position.x-source.position.x,target.position.y-source.position.y)<=BLOOD_BERSERKER_D12_4H_A.pulse.radius).sort((a,b)=>a.entityId.localeCompare(b.entityId));
}

export function selectNullifierTargetsD12_4I(state,e,{lineClear}){
 const source=state.entitiesById[e.entityId];check(source?.team==='hostile','Nullifier source missing');
 return Object.values(state.playersById).map(player=>state.entitiesById[player.entityId]).filter(target=>target?.team==='party'&&target.alive&&target.residency.spaceInstanceId===source.residency.spaceInstanceId&&Math.hypot(target.position.x-source.position.x,target.position.y-source.position.y)<=NULLIFIER_D12_4I.pulse.radius&&lineClear(source,target)).sort((a,b)=>a.entityId.localeCompare(b.entityId));
}

export function selectWebWeaverTargetD12_4J(state,e,{lineClear}){
 const source=state.entitiesById[e.entityId];check(source?.team==='hostile','Web Weaver source missing');
 return Object.values(state.playersById).map(player=>state.entitiesById[player.entityId]).filter(target=>target?.team==='party'&&target.alive&&target.residency.spaceInstanceId===source.residency.spaceInstanceId&&Math.hypot(target.position.x-source.position.x,target.position.y-source.position.y)<=WEB_WEAVER_D12_4J.pulse.radius&&lineClear(source,target)).sort((a,b)=>Math.hypot(a.position.x-source.position.x,a.position.y-source.position.y)-Math.hypot(b.position.x-source.position.x,b.position.y-source.position.y)||a.entityId.localeCompare(b.entityId))[0]??null;
}

export function hostileEllipseHazardContainsActorD12_4K(hazard,actor){const dx=actor.position.x-hazard.position.x,dy=actor.position.y-hazard.position.y,rx=hazard.geometry.radiusX+actor.hullRadius,ry=hazard.geometry.radiusY+actor.hullRadius;return dx*dx/(rx*rx)+dy*dy/(ry*ry)<=1;}
export function webHazardContainsActorD12_4J(hazard,actor){return hostileEllipseHazardContainsActorD12_4K(hazard,actor);}

const multiplierFor=stacks=>(100+stacks*SWIFT_COMMANDER_D12_4D.pulse.perStackSpeedPercent)/100;

export function createEliteCombatD12_4(state,{lineClear,applyPeriodicDamage=()=>null,activeElite=()=>true}){
 const counters={scheduledPulses:0,healingPulses:0,recipients:0,hastePulses:0,hasteStackGrants:0,hasteDecays:0,guardPulses:0,guardStackGrants:0,guardDecays:0,guardMitigations:0,guardDamagePrevented:combatInteger(0),attackAuraPulses:0,attackAuraStackGrants:0,attackAuraDecays:0,attackAuraDirectHits:0,glacialPulses:0,snaresApplied:0,snaresExpired:0,toxicApplications:0,toxicStacksAdded:0,toxicTicks:0,toxicDamage:combatInteger(0),toxicDeaths:0,nullifierPulses:0,nullifiedApplied:0,nullifiedExpired:0,nullificationResistanceExpired:0,webCadences:0,webCasts:0,websFormed:0,websExpired:0,webCastsCancelled:0,slagCadences:0,slagCasts:0,slagPoolsFormed:0,slagPoolsExpired:0,slagCastsCancelled:0,slagDamageOpportunities:0,slagDamageEvents:0,slagDamage:combatInteger(0)};
 const contactQueue=new Map();
 const swiftTargets=e=>activeElite(e.entityId)?selectSwiftCommanderTargetsD12_4D(state,e):[];
 const eliteRoot=()=>{const root=state.eliteCombat;if(root){root.hasteByEntityId??={};root.timedStatusesByEntityId??={};root.guardByEntityId??={};root.attackAuraByEntityId??={};root.nullificationResistanceByEntityId??={};root.pendingHazardsBySourceEliteId??={};root.hazardsById??={};root.webbedByEntityId??={};root.slagBurnByEntityId??={};}return root;};
 function refreshHasteSources(root,commanders){
  const sourcesByTarget=new Map();
  for(const e of commanders){for(const target of swiftTargets(e)){const rows=sourcesByTarget.get(target.entityId)??[];rows.push(e.eliteId);sourcesByTarget.set(target.entityId,rows);}}
  for(const [entityId,sources] of sourcesByTarget){
   sources.sort();const h=root.hasteByEntityId[entityId]??={version:ELITE_HASTE_D12_4D_VERSION,entityId,stacks:0,sourceEliteIds:[],lastRefreshTick:state.tick,lingerExpiresTick:state.tick+SWIFT_COMMANDER_D12_4D.pulse.lingerTicks,nextDecayTick:null,lastStackTick:null,lastDecayTick:null};
   h.sourceEliteIds=sources;h.lastRefreshTick=state.tick;h.lingerExpiresTick=state.tick+SWIFT_COMMANDER_D12_4D.pulse.lingerTicks;h.nextDecayTick=h.lingerExpiresTick;
  }
  for(const [entityId,h] of Object.entries(root.hasteByEntityId))if(!sourcesByTarget.has(entityId))h.sourceEliteIds=[];
  return sourcesByTarget;
 }
 function advanceSwift(root,commanders,sourcesByTarget){
  for(const e of commanders){if(state.tick<e.nextPulseTick)continue;check(state.tick===e.nextPulseTick,'Swift Commander pulse schedule skipped');e.pulseSequence++;e.nextPulseTick+=SWIFT_COMMANDER_D12_4D.pulse.cadenceTicks;counters.scheduledPulses++;counters.hastePulses++;
   const recipients=[];for(const target of swiftTargets(e)){const h=root.hasteByEntityId[target.entityId];check(h&&sourcesByTarget.get(target.entityId)?.includes(e.eliteId),'Swift Commander source refresh missing');const previousStacks=h.stacks;h.stacks=Math.min(SWIFT_COMMANDER_D12_4D.pulse.maxStacks,h.stacks+1);h.lastStackTick=state.tick;recipients.push({entityId:target.entityId,previousStacks,stacks:h.stacks});if(h.stacks>previousStacks)counters.hasteStackGrants++;}
   e.lastPulse={tick:state.tick,sequence:e.pulseSequence,recipients};counters.recipients+=recipients.length;
  }
 }
 function decayHaste(root,sourcesByTarget){
  for(const [entityId,h] of Object.entries(root.hasteByEntityId)){
   if(sourcesByTarget.has(entityId))continue;
   if(h.stacks===0){delete root.hasteByEntityId[entityId];continue;}
   if(state.tick<h.nextDecayTick)continue;check(state.tick===h.nextDecayTick,'Swift Commander decay schedule skipped');h.stacks--;h.lastDecayTick=state.tick;counters.hasteDecays++;h.nextDecayTick=h.stacks?state.tick+SWIFT_COMMANDER_D12_4D.pulse.decayTicks:null;
  }
 }
 function cleanupGuard(root){
  for(const [entityId,g] of Object.entries(root.guardByEntityId)){const actor=state.entitiesById[entityId];if(!actor?.alive||actor.team!=='hostile'||actor.residency.spaceInstanceId!==g.spaceInstanceId)delete root.guardByEntityId[entityId];}
 }
 function refreshGuardSources(root,citadels){
  cleanupGuard(root);const sourcesByTarget=new Map();
  for(const e of citadels){for(const target of selectIronCitadelTargetsD12_4G(state,e)){const rows=sourcesByTarget.get(target.entityId)??[];rows.push(e.eliteId);sourcesByTarget.set(target.entityId,rows);}}
  for(const [entityId,sources] of sourcesByTarget){
   sources.sort();const actor=state.entitiesById[entityId],g=root.guardByEntityId[entityId]??={version:ELITE_GUARD_D12_4G_VERSION,entityId,spaceInstanceId:actor.residency.spaceInstanceId,stacks:0,sourceEliteIds:[],lastRefreshTick:state.tick,lingerExpiresTick:state.tick+IRON_CITADEL_D12_4G.pulse.lingerTicks,nextDecayTick:state.tick+IRON_CITADEL_D12_4G.pulse.lingerTicks,lastStackTick:null,lastDecayTick:null,lastImpact:null};
   g.sourceEliteIds=sources;g.spaceInstanceId=actor.residency.spaceInstanceId;g.lastRefreshTick=state.tick;g.lingerExpiresTick=state.tick+IRON_CITADEL_D12_4G.pulse.lingerTicks;g.nextDecayTick=g.lingerExpiresTick;g.lastDecayTick=null;
  }
  for(const [entityId,g] of Object.entries(root.guardByEntityId))if(!sourcesByTarget.has(entityId))g.sourceEliteIds=[];
  return sourcesByTarget;
 }
 function advanceIronCitadel(root,citadels,sourcesByTarget){
  for(const e of citadels){if(state.tick<e.nextPulseTick)continue;check(state.tick===e.nextPulseTick,'Iron Citadel pulse schedule skipped');e.pulseSequence++;e.nextPulseTick+=IRON_CITADEL_D12_4G.pulse.cadenceTicks;counters.scheduledPulses++;counters.guardPulses++;
   const recipients=[];for(const target of selectIronCitadelTargetsD12_4G(state,e)){const g=root.guardByEntityId[target.entityId];check(g&&sourcesByTarget.get(target.entityId)?.includes(e.eliteId),'Iron Citadel source refresh missing');const previousStacks=g.stacks;g.stacks=Math.min(IRON_CITADEL_D12_4G.pulse.maxStacks,g.stacks+1);g.lastStackTick=state.tick;recipients.push({entityId:target.entityId,previousStacks,stacks:g.stacks});if(g.stacks>previousStacks)counters.guardStackGrants++;}
   e.lastPulse={tick:state.tick,sequence:e.pulseSequence,recipients};counters.recipients+=recipients.length;
  }
 }
 function decayGuard(root,sourcesByTarget){
  for(const [entityId,g] of Object.entries(root.guardByEntityId)){
   if(sourcesByTarget.has(entityId))continue;if(g.stacks===0){delete root.guardByEntityId[entityId];continue;}if(state.tick<g.nextDecayTick)continue;check(state.tick===g.nextDecayTick,'Iron Citadel Guard decay schedule skipped');g.stacks--;g.lastDecayTick=state.tick;counters.guardDecays++;if(g.stacks)g.nextDecayTick=state.tick+IRON_CITADEL_D12_4G.pulse.decayTicks;else delete root.guardByEntityId[entityId];
  }
 }
 function clearGuard(entityId){const root=eliteRoot();if(!root?.guardByEntityId[entityId])return false;delete root.guardByEntityId[entityId];return true;}
 function clearGuardForGroup(groupId){const root=eliteRoot(),group=state.groupsById[groupId];if(!root||!group)return 0;let count=0;for(const entityId of group.entityIds)if(clearGuard(entityId))count++;return count;}
 function mitigateDirectDamage(source,target,raw,{periodic=false,trigger=null,scripted=false}={}){
  const root=eliteRoot(),g=root?.guardByEntityId?.[target?.entityId];if(periodic||trigger==='periodic'||scripted||source?.team!=='party'||target?.team!=='hostile'||!target.alive||!g?.stacks||compareCombat(raw,0)<=0)return {damage:raw,guard:null};
  const percent=g.stacks*IRON_CITADEL_D12_4G.pulse.perStackMitigationPercent,damage=combatInteger(maxCombat(1,combatInteger(multiplyCombat(raw,100-percent,100),'round')),'round'),mitigated=combatInteger(subtractCombat(raw,damage),'round');g.lastImpact={tick:state.tick,sourceEntityId:source.entityId,damageBefore:copyWire(raw),damageAfter:copyWire(damage),mitigated:copyWire(mitigated),stacks:g.stacks};counters.guardMitigations++;counters.guardDamagePrevented=combatInteger(addCombat(counters.guardDamagePrevented,mitigated),'round');return {damage,guard:copyWire(g.lastImpact)};
 }
 function cleanupAttackAura(root){
  for(const [entityId,aura] of Object.entries(root.attackAuraByEntityId)){const actor=state.entitiesById[entityId],group=state.groupsById[aura.groupId];if(!actor?.alive||actor.team!=='hostile'||!group?.entityIds.includes(entityId)||actor.residency.spaceInstanceId!==aura.spaceInstanceId)delete root.attackAuraByEntityId[entityId];}
 }
 function refreshAttackAuraSources(root,berserkers){
  cleanupAttackAura(root);const sourcesByTarget=new Map();
  for(const e of berserkers){for(const target of selectBloodBerserkerTargetsD12_4H_A(state,e)){const rows=sourcesByTarget.get(target.entityId)??[];rows.push(e.eliteId);sourcesByTarget.set(target.entityId,rows);}}
  for(const [entityId,sources] of sourcesByTarget){sources.sort();const actor=state.entitiesById[entityId],group=state.groupsById[berserkers.find(e=>sources.includes(e.eliteId)).groupId],aura=root.attackAuraByEntityId[entityId]??={version:ELITE_ATTACK_AURA_D12_4H_A_VERSION,entityId,groupId:group.groupId,spaceInstanceId:actor.residency.spaceInstanceId,stacks:0,sourceEliteIds:[],lastRefreshTick:state.tick,lingerExpiresTick:state.tick+BLOOD_BERSERKER_D12_4H_A.pulse.lingerTicks,nextDecayTick:state.tick+BLOOD_BERSERKER_D12_4H_A.pulse.lingerTicks,lastStackTick:null,lastDecayTick:null};
   aura.sourceEliteIds=sources;aura.groupId=group.groupId;aura.spaceInstanceId=actor.residency.spaceInstanceId;aura.lastRefreshTick=state.tick;aura.lingerExpiresTick=state.tick+BLOOD_BERSERKER_D12_4H_A.pulse.lingerTicks;aura.nextDecayTick=aura.lingerExpiresTick;aura.lastDecayTick=null;}
  for(const [entityId,aura] of Object.entries(root.attackAuraByEntityId))if(!sourcesByTarget.has(entityId))aura.sourceEliteIds=[];return sourcesByTarget;
 }
 function advanceBloodBerserker(root,berserkers,sourcesByTarget){
  for(const e of berserkers){if(state.tick<e.nextPulseTick)continue;check(state.tick===e.nextPulseTick,'Berserker pulse schedule skipped');e.pulseSequence++;e.nextPulseTick+=BLOOD_BERSERKER_D12_4H_A.pulse.cadenceTicks;counters.scheduledPulses++;counters.attackAuraPulses++;
   const recipients=[];for(const target of selectBloodBerserkerTargetsD12_4H_A(state,e)){const aura=root.attackAuraByEntityId[target.entityId];check(aura&&sourcesByTarget.get(target.entityId)?.includes(e.eliteId),'Berserker source refresh missing');const previousStacks=aura.stacks;aura.stacks=Math.min(BLOOD_BERSERKER_D12_4H_A.pulse.maxStacks,aura.stacks+1);aura.lastStackTick=state.tick;recipients.push({entityId:target.entityId,previousStacks,stacks:aura.stacks});if(aura.stacks>previousStacks)counters.attackAuraStackGrants++;}
   e.lastPulse={tick:state.tick,sequence:e.pulseSequence,recipients};counters.recipients+=recipients.length;}
 }
 function decayAttackAura(root,sourcesByTarget){for(const [entityId,aura] of Object.entries(root.attackAuraByEntityId)){if(sourcesByTarget.has(entityId))continue;if(aura.stacks===0){delete root.attackAuraByEntityId[entityId];continue;}if(state.tick<aura.nextDecayTick)continue;check(state.tick===aura.nextDecayTick,'Berserker attack-aura decay schedule skipped');aura.stacks--;aura.lastDecayTick=state.tick;counters.attackAuraDecays++;if(aura.stacks)aura.nextDecayTick=state.tick+BLOOD_BERSERKER_D12_4H_A.pulse.decayTicks;else delete root.attackAuraByEntityId[entityId];}}
 function clearAttackAura(entityId){const root=eliteRoot();if(!root?.attackAuraByEntityId[entityId])return false;delete root.attackAuraByEntityId[entityId];return true;}
 function clearWebbed(entityId){const root=eliteRoot();if(!root?.webbedByEntityId[entityId])return false;delete root.webbedByEntityId[entityId];return true;}
 function clearSlagBurn(entityId){const root=eliteRoot();if(!root?.slagBurnByEntityId[entityId])return false;delete root.slagBurnByEntityId[entityId];return true;}
 function clearAttackAuraForGroup(groupId){const root=eliteRoot(),group=state.groupsById[groupId];if(!root||!group)return 0;let count=0;for(const entityId of group.entityIds)if(clearAttackAura(entityId))count++;return count;}
 function empowerDirectAttack(source,target,raw,{delivery=null,periodic=false,trigger=null,scripted=false}={}){
  const aura=eliteRoot()?.attackAuraByEntityId?.[source?.entityId],direct=delivery==='melee'||delivery==='ranged';if(!direct||periodic||trigger==='periodic'||scripted||source?.team!=='hostile'||target?.team!=='party'||!source.alive||!target.alive||!aura?.stacks||compareCombat(raw,0)<=0)return {damage:raw,attackAura:null};
  const percent=100+aura.stacks*BLOOD_BERSERKER_D12_4H_A.pulse.perStackAttackPercent,damage=combatInteger(multiplyCombat(raw,percent,100),'round');counters.attackAuraDirectHits++;return {damage,attackAura:{statusId:BLOOD_BERSERKER_D12_4H_A.pulse.statusId,stacks:aura.stacks,multiplier:percent/100,delivery}};
 }
 function expireTimedStatuses(root){
  for(const [entityId,statuses] of Object.entries(root.timedStatusesByEntityId)){
   for(const [statusId,status] of Object.entries(statuses))if(statusId===GLACIAL_WARDEN_D12_4E.pulse.statusId&&state.tick>=status.expirationTick){delete statuses[statusId];counters.snaresExpired++;}
   if(!Object.keys(statuses).length)delete root.timedStatusesByEntityId[entityId];
  }
 }
 function advanceNullificationWindows(root){
  const statusId=NULLIFIER_D12_4I.pulse.statusId;
  for(const [entityId,resistance] of Object.entries(root.nullificationResistanceByEntityId)){const actor=state.entitiesById[entityId];if(!actor?.alive||state.tick>=resistance.expirationTick){delete root.nullificationResistanceByEntityId[entityId];if(actor?.alive)counters.nullificationResistanceExpired++;}}
  for(const [entityId,statuses] of Object.entries(root.timedStatusesByEntityId)){const status=statuses[statusId];if(!status)continue;const actor=state.entitiesById[entityId];if(!actor?.alive){delete statuses[statusId];if(!Object.keys(statuses).length)delete root.timedStatusesByEntityId[entityId];continue;}if(state.tick<status.expirationTick)continue;check(state.tick===status.expirationTick,'Nullified expiration schedule skipped');delete statuses[statusId];if(!Object.keys(statuses).length)delete root.timedStatusesByEntityId[entityId];root.nullificationResistanceByEntityId[entityId]={version:NULLIFICATION_RESISTANCE_D12_4I_VERSION,entityId,statusId,sourceEliteId:status.sourceEliteId,startedTick:state.tick,expirationTick:state.tick+NULLIFIER_D12_4I.pulse.resistanceTicks};counters.nullifiedExpired++;}
 }
 function clearNullification(entityId){const root=eliteRoot();if(!root)return false;const statuses=root.timedStatusesByEntityId[entityId],removed=Boolean(statuses?.[NULLIFIER_D12_4I.pulse.statusId]||root.nullificationResistanceByEntityId[entityId]);if(statuses){delete statuses[NULLIFIER_D12_4I.pulse.statusId];if(!Object.keys(statuses).length)delete root.timedStatusesByEntityId[entityId];}delete root.nullificationResistanceByEntityId[entityId];return removed;}
 function clearHostilePoison(entityId){const root=eliteRoot(),statuses=root?.timedStatusesByEntityId?.[entityId];if(!statuses)return false;const removed=Boolean(statuses[TOXIC_DECAY_D12_4F.pulse.statusId]);delete statuses[TOXIC_DECAY_D12_4F.pulse.statusId];if(!Object.keys(statuses).length)delete root.timedStatusesByEntityId[entityId];return removed;}
 function beginTick(){const root=eliteRoot();if(!root)return;maintainHostileHazards(root);advanceNullificationWindows(root);
  for(const [entityId,statuses] of Object.entries(root.timedStatusesByEntityId).sort(([a],[b])=>a.localeCompare(b))){const status=statuses[TOXIC_DECAY_D12_4F.pulse.statusId];if(!status)continue;const target=state.entitiesById[entityId];if(!target?.alive){clearHostilePoison(entityId);continue;}if(state.tick>=status.nextTickAt&&status.nextTickAt<=status.expirationTick){check(state.tick===status.nextTickAt,'Toxic Decay tick schedule skipped');const damage=combatInteger(multiplyCombat(status.damagePerStack,status.stacks),'round'),source=Object.values(root.elitesByEntityId).find(row=>row.eliteId===status.sourceEliteId),result=applyPeriodicDamage({sourceEntityId:source.entityId,targetEntityId:entityId,damage,stacks:status.stacks,statusId:status.statusId,sourceEliteId:status.sourceEliteId});counters.toxicTicks++;counters.toxicDamage=combatInteger(addCombat(counters.toxicDamage,result.damage),'round');status.lastTick={tick:state.tick,damage:copyWire(result.damage),stacks:status.stacks,sourceEliteId:status.sourceEliteId,targetAlive:result.targetAlive};status.nextTickAt+=status.tickIntervalTicks;if(!result.targetAlive){counters.toxicDeaths++;clearHostilePoison(entityId);continue;}}
   if(state.tick>=status.expirationTick&&status.nextTickAt>status.expirationTick)clearHostilePoison(entityId);
  }
 }
 function queueContactMelee(source,target){const e=state.eliteCombat?.elitesByEntityId?.[source.entityId],player=Object.values(state.playersById).find(row=>row.entityId===target.entityId);if(e?.affixIds[0]!==TOXIC_DECAY_AFFIX_ID||!target.alive||!player)return false;contactQueue.set(source.entityId+'/'+target.entityId,{sourceEntityId:source.entityId,targetEntityId:target.entityId});return true;}
 function resolveContactMelee(){const root=eliteRoot();if(!root){contactQueue.clear();return;}const rows=[...contactQueue.values()].sort((a,b)=>a.sourceEntityId.localeCompare(b.sourceEntityId)||a.targetEntityId.localeCompare(b.targetEntityId));contactQueue.clear();
  for(const row of rows){const e=root.elitesByEntityId[row.sourceEntityId],target=state.entitiesById[row.targetEntityId];if(e?.affixIds[0]!==TOXIC_DECAY_AFFIX_ID||!target?.alive||state.tick<e.nextPulseTick)continue;const definition=TOXIC_DECAY_D12_4F,byStatus=root.timedStatusesByEntityId[target.entityId]??={},prior=byStatus[definition.pulse.statusId],previousStacks=prior?.stacks??0,stacks=Math.min(definition.pulse.maxStacks,previousStacks+1),sourceEliteId=prior?.lastApplicationTick===state.tick?[prior.sourceEliteId,e.eliteId].sort()[0]:e.eliteId,damagePerStack=combatInteger(maxCombat(1,combatInteger(multiplyCombat(target.maxHp,definition.pulse.damageMaxHp.numerator,definition.pulse.damageMaxHp.denominator),'round')),'round');
   const status={version:TIMED_PLAYER_POISON_D12_4F_VERSION,entityId:target.entityId,statusId:definition.pulse.statusId,sourceEliteId,applicationTick:prior?.applicationTick??state.tick,lastApplicationTick:state.tick,lastApplicationAdded:stacks>previousStacks,expirationTick:state.tick+definition.pulse.durationTicks,nextTickAt:prior?.nextTickAt??state.tick+definition.pulse.tickTicks,tickIntervalTicks:definition.pulse.tickTicks,stacks,damagePerStack,lastTick:prior?.lastTick??null};byStatus[definition.pulse.statusId]=status;root.timedStatusesByEntityId[target.entityId]=byStatus;e.pulseSequence++;e.nextPulseTick=state.tick+definition.pulse.cadenceTicks;e.lastPulse={tick:state.tick,sequence:e.pulseSequence,recipients:[{entityId:target.entityId,statusId:status.statusId,previousStacks,stacks,stackAdded:stacks>previousStacks,expiresTick:status.expirationTick,nextTickAt:status.nextTickAt}]};counters.toxicApplications++;if(stacks>previousStacks)counters.toxicStacksAdded++;
  }
 }
 function applyGlacialSnare(root,e,target){
  const definition=GLACIAL_WARDEN_D12_4E,byStatus=root.timedStatusesByEntityId[target.entityId]??={},prior=byStatus[definition.pulse.statusId],sourceEliteId=prior?.applicationTick===state.tick?[prior.sourceEliteId,e.eliteId].sort()[0]:e.eliteId;
  byStatus[definition.pulse.statusId]={version:TIMED_ACTOR_STATUS_D12_4E_VERSION,entityId:target.entityId,statusId:definition.pulse.statusId,sourceEliteId,applicationTick:state.tick,expirationTick:state.tick+definition.pulse.durationTicks,magnitude:{movementMultiplier:definition.pulse.movementMultiplier.numerator/definition.pulse.movementMultiplier.denominator}};
  root.timedStatusesByEntityId[target.entityId]=byStatus;counters.snaresApplied++;
  return byStatus[definition.pulse.statusId];
 }
 function advanceGlacial(root,ordered){
  for(const e of ordered){if(e.affixIds[0]!==GLACIAL_WARDEN_AFFIX_ID)continue;const source=state.entitiesById[e.entityId];if(!source?.alive||state.tick<e.nextPulseTick)continue;check(state.tick===e.nextPulseTick,'Glacial Warden pulse schedule skipped');e.pulseSequence++;e.nextPulseTick+=GLACIAL_WARDEN_D12_4E.pulse.cadenceTicks;counters.scheduledPulses++;counters.glacialPulses++;
   const recipients=selectGlacialWardenTargetsD12_4E(state,e).map(target=>{const status=applyGlacialSnare(root,e,target);return {entityId:target.entityId,statusId:status.statusId,expiresTick:status.expirationTick,movementMultiplier:status.magnitude.movementMultiplier};});e.lastPulse={tick:state.tick,sequence:e.pulseSequence,recipients};counters.recipients+=recipients.length;
  }
 }
 function advanceNullifier(root,ordered){
  const definition=NULLIFIER_D12_4I,statusId=definition.pulse.statusId;
  for(const e of ordered){if(e.affixIds[0]!==NULLIFIER_AFFIX_ID)continue;const source=state.entitiesById[e.entityId];if(!source?.alive||state.tick<e.nextPulseTick)continue;check(state.tick===e.nextPulseTick,'Nullifier pulse schedule skipped');e.pulseSequence++;e.nextPulseTick+=definition.pulse.cadenceTicks;counters.scheduledPulses++;counters.nullifierPulses++;
   const recipients=[];for(const target of selectNullifierTargetsD12_4I(state,e,{lineClear})){if(root.timedStatusesByEntityId[target.entityId]?.[statusId]||root.nullificationResistanceByEntityId[target.entityId])continue;const status={version:TIMED_NULLIFIED_D12_4I_VERSION,entityId:target.entityId,statusId,sourceEliteId:e.eliteId,applicationTick:state.tick,expirationTick:state.tick+definition.pulse.durationTicks};(root.timedStatusesByEntityId[target.entityId]??={})[statusId]=status;recipients.push({entityId:target.entityId,statusId,expiresTick:status.expirationTick,resistanceUntil:status.expirationTick+definition.pulse.resistanceTicks});counters.nullifiedApplied++;}
   e.lastPulse={tick:state.tick,sequence:e.pulseSequence,recipients};counters.recipients+=recipients.length;
  }
 }
 function webShape(){const pulse=WEB_WEAVER_D12_4J.pulse;return {kind:pulse.hazardKind,geometry:copyWire(pulse.geometry),effect:{statusId:pulse.statusId,movementMultiplier:pulse.movementMultiplier.numerator/pulse.movementMultiplier.denominator}};}
 function slagShape(){const pulse=SLAG_SHAPER_D12_4K.pulse;return {kind:pulse.hazardKind,geometry:copyWire(pulse.geometry),effect:{statusId:pulse.statusId,damageFraction:copyWire(pulse.damageMaxHp),damageIntervalTicks:pulse.damageIntervalTicks,nonlethal:pulse.nonlethal}};}
 function hazardLineClear(hazard,target){return lineClear({position:hazard.position,hullRadius:0,residency:{spaceInstanceId:hazard.spaceInstanceId}},target);}
 function refreshWebbed(root){
  const active=Object.values(root.hazardsById).filter(row=>row.kind===WEB_WEAVER_D12_4J.pulse.hazardKind).sort((a,b)=>a.hazardId.localeCompare(b.hazardId)),next={};
  for(const player of Object.values(state.playersById).sort((a,b)=>a.entityId.localeCompare(b.entityId))){const actor=state.entitiesById[player.entityId];if(!actor?.alive)continue;const hazardIds=active.filter(hazard=>hazard.spaceInstanceId===actor.residency.spaceInstanceId&&webHazardContainsActorD12_4J(hazard,actor)&&hazardLineClear(hazard,actor)).map(hazard=>hazard.hazardId);if(!hazardIds.length)continue;const prior=root.webbedByEntityId[actor.entityId];next[actor.entityId]={version:WEBBED_STATUS_D12_4J_VERSION,entityId:actor.entityId,statusId:WEB_WEAVER_D12_4J.pulse.statusId,spaceInstanceId:actor.residency.spaceInstanceId,hazardIds,startedTick:prior?.startedTick??state.tick,lastEvaluatedTick:state.tick,movementMultiplier:WEB_WEAVER_D12_4J.pulse.movementMultiplier.numerator/WEB_WEAVER_D12_4J.pulse.movementMultiplier.denominator};}
  root.webbedByEntityId=next;
 }
 function refreshSlagBurn(root){
  const active=Object.values(root.hazardsById).filter(row=>row.kind===SLAG_SHAPER_D12_4K.pulse.hazardKind).sort((a,b)=>a.hazardId.localeCompare(b.hazardId)),next={};for(const hazard of active)hazard.affectedEntityIds=[];
  for(const player of Object.values(state.playersById).sort((a,b)=>a.entityId.localeCompare(b.entityId))){const actor=state.entitiesById[player.entityId];if(!actor?.alive)continue;const hazards=active.filter(hazard=>hazard.spaceInstanceId===actor.residency.spaceInstanceId&&hostileEllipseHazardContainsActorD12_4K(hazard,actor)&&hazardLineClear(hazard,actor));if(!hazards.length)continue;for(const hazard of hazards)hazard.affectedEntityIds.push(actor.entityId);const prior=root.slagBurnByEntityId[actor.entityId];next[actor.entityId]={version:SLAG_BURN_STATUS_D12_4K_VERSION,entityId:actor.entityId,statusId:SLAG_SHAPER_D12_4K.pulse.statusId,spaceInstanceId:actor.residency.spaceInstanceId,hazardIds:hazards.map(row=>row.hazardId),startedTick:prior?.startedTick??state.tick,lastEvaluatedTick:state.tick};}
  root.slagBurnByEntityId=next;
 }
 function processSlagDamage(root){
  const definition=SLAG_SHAPER_D12_4K.pulse;for(const hazard of Object.values(root.hazardsById).filter(row=>row.kind===definition.hazardKind).sort((a,b)=>a.hazardId.localeCompare(b.hazardId))){if(state.tick<hazard.nextDamageTick)continue;check(state.tick===hazard.nextDamageTick&&state.tick<hazard.expirationTick,'Slag damage schedule skipped');counters.slagDamageOpportunities++;const events=[];for(const entityId of hazard.affectedEntityIds){const target=state.entitiesById[entityId];if(!target?.alive)continue;const attempted=combatInteger(maxCombat(1,combatInteger(multiplyCombat(target.maxHp,definition.damageMaxHp.numerator,definition.damageMaxHp.denominator),'round')),'round'),before=copyWire(target.hp),result=applyPeriodicDamage({sourceEntityId:hazard.sourceEntityId,targetEntityId:entityId,damage:attempted,statusId:definition.statusId,sourceEliteId:hazard.sourceEliteId,hazardId:hazard.hazardId,mechanic:'slag',nonlethal:false});if(result===null){target.hp=combatInteger(maxCombat(0,subtractCombat(target.hp,attempted)),'round');target.alive=compareCombat(target.hp,0)>0;}const actual=combatInteger(subtractCombat(before,target.hp),'round');events.push({hazardId:hazard.hazardId,sourceEliteId:hazard.sourceEliteId,sourceEntityId:hazard.sourceEntityId,targetEntityId:entityId,scheduledTick:state.tick,attemptedDamage:copyWire(attempted),actualDamage:copyWire(actual),resultingHp:copyWire(target.hp)});counters.slagDamageEvents++;counters.slagDamage=combatInteger(addCombat(counters.slagDamage,actual),'round');if(!target.alive)clearSlagBurn(entityId);}hazard.affectedEntityIds=hazard.affectedEntityIds.filter(id=>state.entitiesById[id]?.alive);hazard.lastDamageEvents=events;hazard.nextDamageTick+=definition.damageIntervalTicks;}
 }
 function maintainHostileHazards(root){
  for(const [hazardId,hazard] of Object.entries(root.hazardsById).sort(([a],[b])=>a.localeCompare(b))){if(state.tick<hazard.expirationTick)continue;check(state.tick===hazard.expirationTick,'Hostile hazard expiration schedule skipped');delete root.hazardsById[hazardId];if(hazard.kind===WEB_WEAVER_D12_4J.pulse.hazardKind)counters.websExpired++;else counters.slagPoolsExpired++;}
  for(const [sourceEliteId,pending] of Object.entries(root.pendingHazardsBySourceEliteId).sort(([a],[b])=>a.localeCompare(b))){const source=state.entitiesById[pending.sourceEntityId],web=pending.kind===WEB_WEAVER_D12_4J.pulse.hazardKind,definition=web?WEB_WEAVER_D12_4J:SLAG_SHAPER_D12_4K;if(!source?.alive||source.residency.spaceInstanceId!==pending.spaceInstanceId){delete root.pendingHazardsBySourceEliteId[sourceEliteId];if(web)counters.webCastsCancelled++;else counters.slagCastsCancelled++;continue;}if(state.tick<pending.resolvesTick)continue;check(state.tick===pending.resolvesTick,'Hostile hazard windup schedule skipped');const active=Object.values(root.hazardsById).filter(row=>row.sourceEliteId===sourceEliteId&&row.kind===pending.kind).sort((a,b)=>a.creationTick-b.creationTick||a.hazardId.localeCompare(b.hazardId));if(active.length>=definition.pulse.maxActivePerSource)delete root.hazardsById[active[0].hazardId];root.hazardsById[pending.hazardId]=web?{version:HOSTILE_FLOOR_HAZARD_D12_4J_VERSION,hazardId:pending.hazardId,...webShape(),sourceEliteId,sourceEntityId:pending.sourceEntityId,spaceInstanceId:pending.spaceInstanceId,position:copyWire(pending.position),creationTick:state.tick,expirationTick:state.tick+definition.pulse.durationTicks}:{version:HOSTILE_FLOOR_HAZARD_D12_4J_VERSION,hazardId:pending.hazardId,...slagShape(),sourceEliteId,sourceEntityId:pending.sourceEntityId,spaceInstanceId:pending.spaceInstanceId,position:copyWire(pending.position),creationTick:state.tick,expirationTick:state.tick+definition.pulse.durationTicks,nextDamageTick:state.tick+definition.pulse.damageIntervalTicks,affectedEntityIds:[],lastDamageEvents:[]};delete root.pendingHazardsBySourceEliteId[sourceEliteId];if(web)counters.websFormed++;else counters.slagPoolsFormed++;}
  refreshWebbed(root);refreshSlagBurn(root);processSlagDamage(root);
 }
 function advanceWebWeaver(root,ordered){
  const definition=WEB_WEAVER_D12_4J;
  for(const e of ordered){if(e.affixIds[0]!==WEB_WEAVER_AFFIX_ID)continue;const source=state.entitiesById[e.entityId];if(!source?.alive||state.tick<e.nextPulseTick)continue;check(state.tick===e.nextPulseTick,'Web Weaver cadence skipped');e.pulseSequence++;e.nextPulseTick+=definition.pulse.cadenceTicks;counters.scheduledPulses++;counters.webCadences++;const group=state.groupsById[e.groupId],nav=source.ai?.interiorNavigation,engaged=group?.containment?.mode==='engaged'||Boolean(nav?.targetEntityId)||source.ai?.melee?.phase!=='idle';let recipients=[];if(engaged){const target=selectWebWeaverTargetD12_4J(state,e,{lineClear});if(target){const hazardId=hostileHazardIdD12_4J(e.eliteId,e.pulseSequence),shape=webShape(),pending={version:PENDING_HOSTILE_HAZARD_D12_4J_VERSION,hazardId,...shape,sourceEliteId:e.eliteId,sourceEntityId:e.entityId,targetEntityId:target.entityId,spaceInstanceId:source.residency.spaceInstanceId,position:copyWire(target.position),startedTick:state.tick,resolvesTick:state.tick+definition.pulse.windupTicks};root.pendingHazardsBySourceEliteId[e.eliteId]=pending;recipients=[{entityId:target.entityId,hazardId,resolvesTick:pending.resolvesTick,position:copyWire(target.position)}];counters.webCasts++;}}
   e.lastPulse={tick:state.tick,sequence:e.pulseSequence,recipients};counters.recipients+=recipients.length;
  }
 }
 function advanceSlagShaper(root,ordered){
  const definition=SLAG_SHAPER_D12_4K;
  for(const e of ordered){if(e.affixIds[0]!==SLAG_SHAPER_AFFIX_ID)continue;const source=state.entitiesById[e.entityId];if(!source?.alive||state.tick<e.nextPulseTick)continue;check(state.tick===e.nextPulseTick,'Slag Shaper cadence skipped');e.pulseSequence++;e.nextPulseTick+=definition.pulse.cadenceTicks;counters.scheduledPulses++;counters.slagCadences++;const group=state.groupsById[e.groupId],nav=source.ai?.interiorNavigation,melee=source.ai?.melee,engaged=group?.containment?.mode==='engaged'||Boolean(nav?.targetEntityId)||Boolean(melee&&melee.phase!=='idle');let recipients=[];if(engaged){const hazardId=hostileHazardIdD12_4J(e.eliteId,e.pulseSequence),shape=slagShape(),pending={version:PENDING_HOSTILE_HAZARD_D12_4J_VERSION,hazardId,...shape,sourceEliteId:e.eliteId,sourceEntityId:e.entityId,spaceInstanceId:source.residency.spaceInstanceId,position:copyWire(source.position),startedTick:state.tick,resolvesTick:state.tick+definition.pulse.windupTicks};root.pendingHazardsBySourceEliteId[e.eliteId]=pending;recipients=[{hazardId,resolvesTick:pending.resolvesTick,position:copyWire(source.position)}];counters.slagCasts++;}e.lastPulse={tick:state.tick,sequence:e.pulseSequence,recipients};
  }
 }
 function advance(){
  const root=eliteRoot();if(!root)return;
   expireTimedStatuses(root);
  const ordered=Object.values(root.elitesByEntityId).sort((a,b)=>a.eliteId.localeCompare(b.eliteId)),commanders=ordered.filter(e=>e.affixIds[0]===SWIFT_COMMANDER_AFFIX_ID&&state.entitiesById[e.entityId]?.alive),sourcesByTarget=refreshHasteSources(root,commanders),citadels=ordered.filter(e=>e.affixIds[0]===IRON_CITADEL_AFFIX_ID&&state.entitiesById[e.entityId]?.alive).sort((a,b)=>a.entityId.localeCompare(b.entityId)),guardSourcesByTarget=refreshGuardSources(root,citadels),berserkers=ordered.filter(e=>e.affixIds[0]===BLOOD_BERSERKER_AFFIX_ID&&state.entitiesById[e.entityId]?.alive),attackSourcesByTarget=refreshAttackAuraSources(root,berserkers);
  for(const e of ordered){
   if(e.affixIds[0]!==VITALITY_WEAVER_AFFIX_ID)continue;const source=state.entitiesById[e.entityId];if(!source?.alive||state.tick<e.nextPulseTick)continue;
   check(state.tick===e.nextPulseTick,'Vitality Weaver pulse schedule skipped');e.pulseSequence++;e.nextPulseTick+=VITALITY_WEAVER_D12_4.pulse.cadenceTicks;counters.scheduledPulses++;
   const candidates=selectVitalityWeaverTargetsD12_4(state,e,{lineClear});if(!candidates.length)continue;
   const recipients=[];for(const target of candidates){const heal=combatInteger(multiplyCombat(target.maxHp,VITALITY_WEAVER_D12_4.pulse.ordinaryHeal.numerator,VITALITY_WEAVER_D12_4.pulse.ordinaryHeal.denominator),'round'),before=copyWire(target.hp);target.hp=combatInteger(minCombat(target.maxHp,addCombat(target.hp,heal)),'round');recipients.push({entityId:target.entityId,amount:combatInteger(subtractCombat(target.hp,before),'round')});}
   e.lastPulse={tick:state.tick,sequence:e.pulseSequence,recipients};counters.healingPulses++;counters.recipients+=recipients.length;
  }
    advanceSwift(root,commanders,sourcesByTarget);decayHaste(root,sourcesByTarget);advanceIronCitadel(root,citadels,guardSourcesByTarget);decayGuard(root,guardSourcesByTarget);advanceBloodBerserker(root,berserkers,attackSourcesByTarget);decayAttackAura(root,attackSourcesByTarget);advanceGlacial(root,ordered);advanceNullifier(root,ordered);advanceWebWeaver(root,ordered);advanceSlagShaper(root,ordered);maintainHostileHazards(root);
 }
 function movementMultiplier(entityId){
  const actor=state.entitiesById[entityId];if(actor?.team==='hostile')return multiplierFor(state.eliteCombat?.hasteByEntityId?.[entityId]?.stacks??0);
  const statuses=Object.values(state.eliteCombat?.timedStatusesByEntityId?.[entityId]??{}).filter(status=>state.tick<status.expirationTick&&Number.isFinite(status.magnitude?.movementMultiplier)),webbed=state.eliteCombat?.webbedByEntityId?.[entityId];return statuses.reduce((value,status)=>Math.min(value,status.magnitude.movementMultiplier),webbed?.movementMultiplier??1);
 }
 return Object.freeze({beginTick,advance,queueContactMelee,resolveContactMelee,clearHostilePoison,clearNullification,clearWebbed,clearSlagBurn,clearGuard,clearGuardForGroup,clearAttackAura,clearAttackAuraForGroup,mitigateDirectDamage,empowerDirectAttack,movementMultiplier,inspect:()=>({...counters,eliteCount:Object.keys(state.eliteCombat?.elitesByEntityId??{}).length,hasteRecipientCount:Object.keys(state.eliteCombat?.hasteByEntityId??{}).length,guardRecipientCount:Object.keys(state.eliteCombat?.guardByEntityId??{}).length,attackAuraRecipientCount:Object.keys(state.eliteCombat?.attackAuraByEntityId??{}).length,timedStatusActorCount:Object.keys(state.eliteCombat?.timedStatusesByEntityId??{}).length,nullificationResistanceCount:Object.keys(state.eliteCombat?.nullificationResistanceByEntityId??{}).length,pendingHazardCount:Object.keys(state.eliteCombat?.pendingHazardsBySourceEliteId??{}).length,hostileFloorHazardCount:Object.keys(state.eliteCombat?.hazardsById??{}).length,webbedActorCount:Object.keys(state.eliteCombat?.webbedByEntityId??{}).length,slagBurnActorCount:Object.keys(state.eliteCombat?.slagBurnByEntityId??{}).length,pendingToxicContacts:contactQueue.size})});
}
