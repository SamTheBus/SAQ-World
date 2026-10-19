import {MASTERY_CAUSES} from '../shared/contracts/mastery_causality.js';
import {settleMasteryXp,triggerScaledMasteryXp,finiteNodeRank,MASTERY_FAMILIES} from '../shared/contracts/participant_progression.js';
import {integerRoot} from '../shared/contracts/endless_formula.js';
import {safeInteger,requireContract} from '../shared/contracts/wire.js';
import {progressionBigInt as big} from '../shared/contracts/progression_integer.js';

// One high-water mark per entity and causal category, not an ever-growing
// reward history. Combat/Primary sequence numbers never reset on renewal.
export function createMasteryAwards(state){
 const players=new Map(Object.values(state.playersById).map(p=>[p.entityId,p]));
 const groups=new Map(Object.values(state.groupsById).flatMap(g=>g.entityIds.map(id=>[id,g])));
 const depth=target=>{const group=groups.get(target?.entityId);return group?state.encounterEconomy.groups[group.groupId].contentDepth:null;};
 function award(p,family,kind,sourceId,sequence,raw,contentDepth){if(!p?.d8||!MASTERY_FAMILIES.includes(family)||!contentDepth)return null;requireContract(MASTERY_CAUSES.includes(kind)&&state.entitiesById[sourceId],'Unknown mastery cause');safeInteger(sequence,1);const row=p.d8.causalXp[sourceId]??{};if(sequence<=(row[kind]??0))return null;const result=settleMasteryXp(p.d8,family,String(raw),contentDepth);result.progression.causalXp[sourceId]={...row,[kind]:sequence};p.d8=result.progression;return result;}
 function incoming(target,source,outcome,sequence){const p=players.get(target.entityId),d=depth(source);if(!p?.d8||!d)return;if(outcome.absorbed!=='0')award(p,'tome','barrier',source.entityId,sequence,10,d);if(outcome.defense==='block')award(p,'shield','block',source.entityId,sequence,16,d);if(outcome.defense==='parry')award(p,'dagger','parry',source.entityId,sequence,10,d);}
 function defeat(source,target,family){const p=players.get(source.entityId),g=groups.get(target.entityId),d=depth(target);if(!g||!d)return;const D=big(d),def=state.content.definitionsById[target.contentDefinitionId]??{},base=def.isBoss?50n+5n*D:def.isMiniboss?20n+2n*D:def.isElite?8n+D*2n/5n:4n,mult=integerRoot(D**7n,10);return award(p,family,'defeat',target.entityId,state.encounterEconomy.groups[g.groupId].episode+1,base*(mult>1n?mult:1n),d);}
 function primary(source,target,kind){const p=players.get(source.entityId),d=depth(target),action=state.primary.actorsById[source.entityId]?.current;if(!p?.d8||!action||!d)return;const r=id=>finiteNodeRank(p.d8,id),base=kind==='proc'?3+(r('tome_keystone_triad')?15:2+r('tome_empowered_catalysts'))+(r('tome_arcane_syphon')?15:0):1;return award(p,kind==='proc'?'tome':'dagger',kind,source.entityId,action.sourceSequence,triggerScaledMasteryXp(String(base),d),d);}
 function activation(source,target,family,kind,sequence,base,scaled=true){const d=depth(target);if(!d)return;return award(players.get(source.entityId),family,kind,source.entityId,sequence,scaled?triggerScaledMasteryXp(String(base),d):base,d);}
 function defensiveActivation(target,source,family,kind,sequence,base){const d=depth(source);if(d)return award(players.get(target.entityId),family,kind,source.entityId,sequence,triggerScaledMasteryXp(String(base),d),d);}
 return {incoming,defeat,primary,activation,defensiveActivation,depth,refreshGroups(){groups.clear();for(const g of Object.values(state.groupsById))for(const id of g.entityIds)groups.set(id,g);}};
}
