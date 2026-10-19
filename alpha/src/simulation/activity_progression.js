import {integerBigInt} from '../shared/contracts/integer_domain.js';
import {copyWire as copyValue} from '../shared/contracts/wire.js';
import {progressionBigInt as big,progressionWire as progressionWire} from '../shared/contracts/progression_integer.js';
import {D9_HERO_VERSION} from '../shared/contracts/hero_progression_d9.js';
import {D9_THREAT_VERSION,ordinaryTier} from '../shared/contracts/encounter_progression.js';
import {admitContentNumericD9} from '../shared/contracts/content_numeric_admission_d9.js';
import {multiplyCombat} from '../shared/contracts/combat_amount.js';
import {updateHighestHeroLevel} from '../shared/contracts/participant_progression.js';
import {combatInteger,asCombatAmount,compareCombat,minCombat,maxCombat,addCombat,subtractCombat} from '../shared/contracts/combat_amount.js';
import {episodeSource,markEarning} from '../shared/contracts/encounter_economy.js';
import {awardEpisodeReward,prepareEpisodeReward,applyEpisodeReward} from '../shared/contracts/renewable_inventory.js';
import {awardForgeDefeat} from '../shared/contracts/forge_economy.js';
import { defeatReward, MAX_GOLD, PLAYER_INVENTORY_VERSION } from '../shared/contracts/player_inventory.js';
import { canActivityTargetActor } from './activity_combat_legality.js';
import { awardPlayerXp,MAX_PLAYER_XP } from '../shared/contracts/player_progression.js';
import { resolvePlayerStats, mitigatePlayerDamage } from '../shared/contracts/player_stats.js';
import { boundedCombatInteger, combatIntegerWire } from '../shared/contracts/combat_integer.js';
import { eligibleNearbyParticipants, ENCOUNTER_PROGRESSION_VERSION, encounterActorProfile, ordinaryKillXp } from '../shared/contracts/encounter_progression.js';

// This component is owned by the activity authority. No client can invoke an award.
export function createActivityProgression(state, manifest, measure) {
  const wire=v=>state.subweaponCombat?combatInteger(v):combatIntegerWire(v);
  const playersByEntity=new Map(Object.values(state.playersById).map(p=>[p.entityId,p]));
  const groupsByEntity=new Map(Object.values(state.groupsById).flatMap(g=>g.entityIds.map(id=>[id,g])));
  const homes=new Map((manifest.population?.groups??[]).flatMap(g=>g.members.map(m=>[m.entityId,m.position])));
  function refreshGroups(){groupsByEntity.clear();for(const g of Object.values(state.groupsById))for(const id of g.entityIds)groupsByEntity.set(id,g);homes.clear();for(const g of manifest.population?.groups??[])for(const m of g.members)homes.set(m.entityId,m.position);}
  const stats=new Map([...playersByEntity].map(([id,p])=>[id,resolvePlayerStats(p)]));
  const transientKeys=new Map();
  const transientKey=p=>{const t=p.d8?.transient;return t?[t.fortitudeStacks,t.colossusAttack,t.shadowStepTicks>0,t.syphonStacks,t.weavingStacks]:[];};
  for(const [id,p] of playersByEntity)transientKeys.set(id,transientKey(p));
  const counters={awards:0,recipients:0,levelUps:0,statRefreshes:stats.size,threatSnapshots:0};
  function freezeGroup(group,radius,trigger='activation',points=null) {
    if(!group.threatReady||group.cleared)return;
    const live=group.entityIds.map(id=>state.entitiesById[id]).filter(a=>a.alive);
    const eligible=eligibleNearbyParticipants(state,group.spaceInstanceId,points??live.map(a=>a.position),radius);
    if(!eligible.length)return;
    measure('threatSnapshot',()=>{
      const episode=state.d9World?.episodes[group.groupId];let level=state.d9World?progressionWire(eligible.reduce((n,p)=>big(p.progression.level)>n?big(p.progression.level):n,big(episode?.geography.minimumLevel??1))):Math.max(...eligible.map(p=>p.progression.level));
      if(episode?.snapshot)level=episode.snapshot.effectiveLevel;
      if(episode)admitContentNumericD9(level,episode.geography.rank);
      const levelsByEntityId=Object.fromEntries(group.entityIds.map(id=>[id,copyValue(state.entitiesById[id].alive?level:group.threatSnapshot?.levelsByEntityId[id]??1)]));
      const snapshot={version:state.d9World?D9_THREAT_VERSION:ENCOUNTER_PROGRESSION_VERSION,activatedTick:state.tick,levelsByEntityId};
      const profiles=live.map(actor=>[actor,encounterActorProfile(state,{...group,threatSnapshot:snapshot},actor)]);
      if(episode&&!episode.snapshot){episode.snapshot={version:'episode-progression-d9-v1',snapshotId:episode.anchorId+'/episode/'+String(episode.episode),activatedTick:state.tick,trigger,minimumLevel:copyValue(episode.geography.minimumLevel),effectiveLevel:copyValue(level),sourceDepth:copyValue(level),mappingVersion:'effective-level-depth-d9-v1',rank:episode.geography.rank,participants:eligible.map(p=>({playerId:p.playerId,heroLevel:copyValue(p.progression.level)}))};state.encounterEconomy.groups[group.groupId].contentDepth=copyValue(level);}
      group.threatSnapshot=snapshot;group.threatReady=false;
      for(const [actor,profile] of profiles){const oldMax=state.subweaponCombat?asCombatAmount(actor.maxHp):boundedCombatInteger(actor.maxHp),newMax=state.subweaponCombat?asCombatAmount(profile.maxHp):boundedCombatInteger(profile.maxHp);
        // First activation changes capacity by its delta. A partial state never full-heals here.
        actor.hp=state.subweaponCombat?combatInteger(minCombat(newMax,maxCombat(1,compareCombat(newMax,oldMax)>=0?addCombat(actor.hp,subtractCombat(newMax,oldMax)):subtractCombat(maxCombat(actor.hp,subtractCombat(oldMax,newMax)),subtractCombat(oldMax,newMax))))):structuredClone(combatIntegerWire(Math.min(newMax,Math.max(1,boundedCombatInteger(actor.hp)+newMax-oldMax))));
        actor.maxHp=structuredClone((state.subweaponCombat?combatInteger(profile.maxHp):profile.maxHp));actor.attackDamage=structuredClone((state.subweaponCombat?combatInteger(profile.attackDamage):profile.attackDamage));}
      counters.threatSnapshots++;
    });
  }
  function resetGroup(group) {
    if(state.d9World?.episodes[group.groupId]?.snapshot)return;
    if(group.siteId!==null||group.cleared)return;
    const live=group.entityIds.map(id=>state.entitiesById[id]).filter(a=>a.alive);
    if(live.some(a=>eligibleNearbyParticipants(state,group.spaceInstanceId,[a.position],a.ai?.acquireRange??0).some(p=>canActivityTargetActor(state,manifest,a,state.entitiesById[p.entityId]))))return;
    if(live.length&&live.every(a=>{const h=homes.get(a.entityId);return h&&Math.hypot(a.position.x-h.x,a.position.y-h.y)<=1e-7&&compareCombat(a.hp,a.maxHp)===0;}))group.threatReady=true;
  }
  function prepareDefeat(target,radius){
    if(!state.d9World)return null;const group=groupsByEntity.get(target.entityId);if(!group||target.team!=='hostile')return [];
    const reward=ordinaryKillXp(target,group);if(!reward)return [];
    const rows=eligibleNearbyParticipants(state,target.residency.spaceInstanceId,[target.position],radius).map(player=>{
      const inventoryPlan=prepareEpisodeReward(state,player,episodeSource(state,group,'enemy',group.entityIds.indexOf(target.entityId)),target.position,target.residency.spaceInstanceId),rate=stats.get(player.entityId).heroXpRate;
      const next=awardPlayerXp(player.progression,combatInteger(multiplyCombat(reward,rate?.n??1,rate?.d??1))),d8=player.d8?updateHighestHeroLevel(player.d8,next.level):null,leveled=big(next.level)>big(player.progression.level);
      const resolved=leveled?resolvePlayerStats({...player,progression:next,...(d8?{d8}:{})}):null;
      return {player,inventoryPlan,next,d8,resolved,levels:big(next.level)-big(player.progression.level)};
    });
    progressionWire(rows.reduce((sum,row)=>sum+row.levels,big(counters.levelUps)));return rows;
  }
  function awardDefeat(target,radius,prepared=null) {
    const group=groupsByEntity.get(target.entityId);
    if(!group||target.team!=='hostile')return;
    if(state.d9World){
      const rows=prepared??prepareDefeat(target,radius);counters.awards++;
      for(const row of rows){const {player,next,d8,resolved}=row;applyEpisodeReward(state,player,row.inventoryPlan);markEarning(state,manifest,player);player.progression=copyValue(next);if(d8)player.d8=d8;counters.recipients++;
        if(resolved){const actor=state.entitiesById[player.entityId];actor.hp=wire(resolved.maxHp);actor.maxHp=copyValue(actor.hp);actor.attackDamage=wire(resolved.attack);actor.moveSpeed=resolved.moveSpeed;stats.set(actor.entityId,resolved);counters.statRefreshes++;counters.levelUps=progressionWire(big(counters.levelUps)+row.levels);}
      }return;
    }
    measure('progressionAward',()=>{
      const reward=ordinaryKillXp(target,group);if(!reward)return;
      const eligible=eligibleNearbyParticipants(state,target.residency.spaceInstanceId,[target.position],radius);
      counters.awards++;
      for(const player of eligible){
        const inventory=player.inventory;if(inventory?.renewal){awardEpisodeReward(state,player,episodeSource(state,group,'enemy',group.entityIds.indexOf(target.entityId)),target.position,target.residency.spaceInstanceId);markEarning(state,manifest,player);}else if(inventory&&!inventory.rewardsByEntityId[target.entityId]){const ordinal=Object.keys(inventory.rewardsByEntityId).length+1,reward=defeatReward(state,player,target,ordinal);if(reward){inventory.rewardsByEntityId[target.entityId]={sourceEntityId:target.entityId,ordinal,defeatedTick:state.tick,spaceInstanceId:target.residency.spaceInstanceId,position:{...target.position},definitionId:reward.definitionId,claimed:false,pickup:null,rewardVersion:PLAYER_INVENTORY_VERSION};inventory.goldAwardsByEntityId[target.entityId]={amount:reward.gold,defeatedTick:state.tick};awardForgeDefeat(state,player,target.entityId,reward.gold);inventory.revision++;}}
        const before=player.progression,amount=multiplyCombat(reward,stats.get(player.entityId).heroXpRate?.n??1,stats.get(player.entityId).heroXpRate?.d??1),next=awardPlayerXp(before,before.version===D9_HERO_VERSION?combatInteger(amount):Number(integerBigInt(combatInteger(minCombat(MAX_PLAYER_XP,amount)))));player.progression={...next};if(player.d8)player.d8=updateHighestHeroLevel(player.d8,next.level);counters.recipients++;
        if(big(next.level)===big(before.level))continue;
        measure('playerStatResolution',()=>{
          const actor=state.entitiesById[player.entityId],resolved=resolvePlayerStats(player);
          // D3-R player feedback: a real level increase restores full resolved HP.
          actor.hp=structuredClone(wire(resolved.maxHp));
          actor.maxHp=structuredClone(wire(resolved.maxHp));actor.attackDamage=structuredClone(wire(resolved.attack));actor.moveSpeed=resolved.moveSpeed;
          stats.set(actor.entityId,resolved);counters.statRefreshes++;counters.levelUps=progressionWire(big(counters.levelUps)+big(next.level)-big(before.level));
        });
      }
    });
  }
  function equipmentChanged(player){const actor=state.entitiesById[player.entityId],resolved=resolvePlayerStats(player);actor.hp=state.subweaponCombat?combatInteger(minCombat(actor.hp,resolved.maxHp)):structuredClone(combatIntegerWire(Math.min(boundedCombatInteger(actor.hp),resolved.maxHp)));actor.maxHp=structuredClone(wire(resolved.maxHp));actor.attackDamage=structuredClone(wire(resolved.attack));actor.moveSpeed=resolved.moveSpeed;stats.set(actor.entityId,resolved);counters.statRefreshes++;transientKeys.set(player.entityId,transientKey(player));}
  function resolvedStats(id){const p=playersByEntity.get(id);if(!p)return undefined;const key=transientKey(p),old=transientKeys.get(id);if(key.some((v,i)=>v!==old?.[i]))equipmentChanged(p);return stats.get(id);}
  return Object.freeze({resolvedStats,freezeGroup,resetGroup,awardDefeat,prepareDefeat,refreshGroups,
    equipmentChanged,

    prepareCombat(actor,radius){const group=groupsByEntity.get(actor.entityId);if(group)freezeGroup(group,radius,'combat');},
    prepareResource(group,point){freezeGroup(group,768,'resource',[point]);},
    onHomeReset(actor){const group=groupsByEntity.get(actor.entityId);if(group)resetGroup(group);},
    requestedDamage(source,target){const raw=stats.get(source.entityId)?.attack??boundedCombatInteger(source.attackDamage),defense=stats.get(target.entityId)?.defense;return defense===undefined?raw:mitigatePlayerDamage(raw,defense);},
    inspect:()=>({...counters,cachedPlayers:stats.size}),
  });
}
