import {projectAegisMimic} from '../shared/content/aegis_mimics_v2.js';
import {projectAegisCompletionChest,projectBrimstoneCompletionChest} from '../shared/contracts/site_finale_completion_d13d.js';
import {ordinaryRangedProfile} from '../shared/content/ordinary_ranged_profiles_v2.js';
import {hasWorldCombat} from '../shared/content/world_combat_v1.js';
import {projectedServiceNpcs} from '../shared/contracts/settlement_services_v1.js';
import {hasSettlementLife} from '../shared/content/settlement_life_v1.js';
import {ferryExits} from '../shared/contracts/ferry_travel_v1.js';
import {statValue} from '../shared/contracts/stat_presentation.js';

import {revealRadiusD9} from '../shared/contracts/world_navigation_contract_d9.js';

import {localFramePositionD9,projectToLocalFrameD9} from '../shared/contracts/local_world_frames_d9.js';

import {copyWire} from '../shared/contracts/wire.js';

import {campaignTavernExits,campaignTavernBinding} from '../shared/contracts/campaign_tavern_v1.js';

import {floorForSpace} from '../shared/contracts/settlement_interiors.js';

import {projectWorldTerrainD9} from './world_terrain_projection_d9.js';

import {integerRatio,formatLarge} from '../shared/contracts/large_number.js';

import {integerWire} from '../shared/contracts/integer_domain.js';

import {projectCombatPresentation} from './combat_presentation_projection.js';

import {clearHullGap,subweaponLineClear} from '../simulation/subweapon_rules.js';

import {presentCombat} from '../shared/contracts/combat_amount.js';

import {groundGear} from '../shared/contracts/renewable_inventory.js';

import {economicResources,canUseResource} from '../shared/contracts/encounter_economy.js';

import {nearbyForge,FORGE_INTERACTION_RADIUS} from '../shared/contracts/forge_stations.js';

import {forgeAccess} from '../shared/contracts/forge_economy.js';

import { inventoryReadModel, equippedWeaponVisual, canPickUp } from '../shared/contracts/player_inventory.js';

import { playerXpProgress } from '../shared/contracts/player_progression.js';

import { resolvePlayerStats } from '../shared/contracts/player_stats.js';

import { siteTransitionTarget, SITE_INTERACTION_RADIUS } from '../shared/contracts/site_interiors.js';

import { ordinaryEnemyForProfile, populationRegionAt } from '../shared/contracts/activity_state.js';

import {creatureDefinitionForProfile,deterministicCreatureVisualSeed} from '../shared/content/creatures_d11.js';

import { freezeWire, requireContract } from '../shared/contracts/wire.js';

import { actorContext } from '../shared/contracts/activity_state.js';

import { manifestForState, semanticPlaceAtWorldPosition, isWorldPointSafe, areaAtWorldPosition, technicalChunkId } from '../shared/contracts/overworld.js';

import { compileBoundOverworld } from '../shared/contracts/activity_state.js';

import {projectEliteAttackD12_4H_A,projectEliteCombatD12_4,projectEliteGuardD12_4G,projectEliteHasteD12_4D,projectHostileHazardsD12_4J,projectTimedActorStatusesD12_4E,subweaponSuppressedD12_4I} from '../shared/contracts/elite_combat_d12_4.js';

import {bossActorTargetableD12_5A,projectArachnidTreantCompletionChestD12_5B,projectBossActorD12_5A,projectBossHazardsD12_5A,projectBossStatusesD12_5A,projectBossSummonD12_5A} from '../shared/contracts/boss_combat_d12_5.js';

import {projectArachnidTreantExtractionD12_5C} from '../shared/contracts/boss_extraction_d12_5c.js';

import {projectLargeCaveFinaleCompletionChestD13D_G,projectLargeCaveFinaleExtractionD13D_G,projectSmallCaveFinaleCompletionChestD13D_C,projectSmallCaveFinaleExtractionD13D_C,projectStandardCaveBossCompletionChestD13D_E,projectStandardCaveBossExtractionD13D_E} from '../shared/contracts/site_finale_completion_d13d.js';

import {functionalSiteTransitionTargetD9,functionalSitesD10,functionalSiteForSpaceD12,functionalSiteFloorForSpaceD12,isGeneratedInteriorFamily} from '../shared/contracts/functional_site_d9.js';

import {resolveSiteTruthD12_4C} from '../shared/contracts/site_truth_d12_4c.js';
import {createSiteTruthPresentationCache} from './site_truth_presentation_cache.js';

// Only locally constructed projection DTOs pass here. External commands, snapshots,

// saves and mutable authority remain behind their existing validation boundaries.

function freezeProjection(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const child of Object.values(value))freezeProjection(child);Object.freeze(value);}return value;}

const mapSiteLabel=(state,id,label)=>{const tier=state.d9World?.siteReservationsById?.[id]?.parcel?.tier;if(!tier||label.toLowerCase().startsWith(tier+' '))return label;return label+' / '+tier[0].toUpperCase()+tier.slice(1);};
export function rustNibblerFacingD11_2({position,previousPosition=null,movementIntentX=0,attackTargetPosition=null,meleePhase='idle',lastFacing=1,alive=true}){

  let facing=lastFacing===-1?-1:1;if(!alive)return facing;

  if(meleePhase!=='idle'&&attackTargetPosition){const dx=attackTargetPosition.x-position.x;if(Math.abs(dx)>=.25)return dx<0?-1:1;return facing;}

  if(Math.abs(movementIntentX)>=.05)return movementIntentX<0?-1:1;

  if(previousPosition){const dx=position.x-previousPosition.x,dy=position.y-previousPosition.y;if(Math.abs(dx)>=.15&&Math.abs(dx)>=Math.abs(dy)*.4)facing=dx<0?-1:1;}

  return facing;

}

export function createActivityClientPort({authority,localPlayerId,measure=(_n,fn)=>fn()}){

  const presentationSiteTruth=createSiteTruthPresentationCache(state=>resolveSiteTruthD12_4C(state,{includeFinaleDiagnostics:false}));

  let cachedKey=null,cachedModel=null,page=null,pageKey=null,compiled=null,inventoryKey=null,inventory=null;

  let safeRegions=null;const playerViews=new Map(),creatureFacingViews=new Map();let eventKey=null,eventView=null;

  function getReadModel(){return authority.withAuthority(engine=>engine.withAuthorityState(state=>{

    const status=authority.getStatus(),version=engine.version(),key=`${version}/${status.phase}/${status.confirmedSaveRevision}`;

    if(key===cachedKey)return cachedModel;

    return measure('interestProjection',()=>{

      const player=state.playersById[localPlayerId];requireContract(player,'Missing local controller');const local=state.entitiesById[player.entityId],ctx=actorContext(state,local.entityId),space=state.spacesByInstanceId[ctx.spaceInstanceId],m=manifestForState(state);

      const serviceNpcs=projectedServiceNpcs(state,player);const tavernBinding=campaignTavernBinding(state),tavernFloor=tavernBinding?floorForSpace(tavernBinding,ctx.spaceInstanceId):null;

      const functional=functionalSiteForSpaceD12(state,ctx.spaceInstanceId),inFunctional=Boolean(functional),functionalFloor=functional?functionalSiteFloorForSpaceD12(functional,ctx.spaceInstanceId):null,inOverworld=ctx.spaceInstanceId===state.overworldInstanceId,c=space.collision,interior=inFunctional?(isGeneratedInteriorFamily(functional)?{siteId:functional.siteId,contentHash:functional.instanceHash+'/'+functionalFloor.floorId,visual:functionalFloor.visual,decorations:functionalFloor.visual.decorations,entrance:functionalFloor.entrance,groupId:functionalFloor.groupId}:functional.interior):m.siteInteriors?.find(d=>state.campaign.sitesById[d.siteId].spaceInstanceId===ctx.spaceInstanceId),site=inFunctional?functional:m.sites.find(s=>s.locationId===interior?.siteId);

      if(!compiled){compiled=compileBoundOverworld(state);safeRegions=m.safeRegions.map(r=>freezeWire(r));}

      const size=8,px=Math.floor(local.position.x/c.tileSize/size)*size,py=Math.floor(local.position.y/c.tileSize/size)*size;

      const visualWindowKey=state.d9World&&inOverworld?(()=>{const left=px-40,top=py-40,right=left+88,bottom=top+88,frames=state.d9World.runtime.frames.map(f=>`${f.id}:${f.chunkX},${f.chunkY}:${f.offsetX},${f.offsetY}`).join('|'),chunks=state.d9World.runtime.chunks.flatMap(chunk=>{const p=projectToLocalFrameD9({chunkX:chunk.chunkX,chunkY:chunk.chunkY,localX:0,localY:0},state.d9World.runtime.frames);return p&&p.x/c.tileSize+32>left&&p.y/c.tileSize+26>top&&p.x/c.tileSize<right&&p.y/c.tileSize<bottom?[chunk.identity.id]:[];}).sort().join('|');return `${frames}/${chunks}`;})():state.d9World?.runtime.revision??0;

      const pk=`${ctx.spaceInstanceId}/${ctx.spaceRevision}/${visualWindowKey}/${interior?interior.contentHash:px+"/"+py}`;

      // Include the viewport tile halo plus one prefetch ring at the desktop zoom.

      // This is static presentation data only; actor interest/acquisition is unchanged.

      if(pk!==pageKey&&inOverworld&&state.d9World){page=freezeProjection(projectWorldTerrainD9(state,compiled,{x:px-40,y:py-40}));pageKey=pk;}

      if(pk!==pageKey){const radius=40,x=Math.max(0,px-radius),y=Math.max(0,py-radius),right=Math.min(c.width,px+size+radius),bottom=Math.min(c.height,py+size+radius);

        const visual=inOverworld?compiled.visual:interior?{terrain:c.tiles,blockers:[]}:{terrain:c.tiles.map(row=>row.replace(/1/g,'g').replace(/0/g,'w')),blockers:[]};

        page=interior?freezeWire(interior.visual??{originTile:{x:0,y:0},terrain:c.tiles,blockers:[],decorations:interior.decorations}):freezeWire({originTile:{x,y},terrain:visual.terrain.slice(y,bottom).map(row=>row.slice(x,right)),blockers:visual.blockers.filter(b=>b.x+b.width>=x&&b.y+b.height>=y&&b.x<right&&b.y<bottom)});pageKey=pk;}

      const playersById={},entitiesById={},primaryActors={},party=[];

      for(const [id,p] of Object.entries(state.playersById)){const playerKey=`${JSON.stringify(p.progression.level)}/${JSON.stringify(p.progression.totalXp)}/${p.inventory?.revision}/${p.d8?.revision}/${p.d8?.transient.fortitudeStacks}/${JSON.stringify(p.d8?.transient.colossusAttack)}/${p.d8?.transient.shadowStepTicks>0}/${p.d8?.transient.syphonStacks}/${p.d8?.transient.weavingStacks}`;let view=playerViews.get(id);if(view?.key!==playerKey){view={key:playerKey,value:freezeProjection({entityId:p.entityId,d8:p.d8?copyWire(p.d8):null,progression:playerXpProgress(p.progression),stats:Object.fromEntries(Object.entries(resolvePlayerStats(p)).map(([k,v])=>[k,v?.n!==undefined?statValue(v):v]))})};playerViews.set(id,view);}playersById[id]=view.value;const a=state.entitiesById[p.entityId];party.push({playerId:id,entityId:p.entityId,spaceInstanceId:a.residency.spaceInstanceId,position:{...a.position},alive:a.alive,connectionStatus:p.connectionStatus});}

      const invKey=`${state.campaign.campaignId}/${localPlayerId}/${player.inventory?.revision}/${state.d9World?.runtime.revision??0}`;if(invKey!==inventoryKey){inventory=player.inventory?inventoryReadModel(player):null;inventoryKey=invKey;}

      const loot=groundGear(player).filter(r=>r.definitionId&&!r.claimed&&r.spaceInstanceId===ctx.spaceInstanceId&&Math.hypot(r.position.x-local.position.x,r.position.y-local.position.y)<=900).map(r=>({sourceEntityId:r.sourceEntityId,itemId:`item:${player.playerId}:${r.sourceEntityId}`,position:{...r.position},definitionId:r.definitionId,...(r.generated?{generated:r.generated}:{}),...(r.workshop?{workshop:r.workshop}:{}),canPickUp:canPickUp(state,player,r.sourceEntityId,playersById[localPlayerId].stats.pickupRadius)})).sort((a,b)=>Math.hypot(a.position.x-local.position.x,a.position.y-local.position.y)-Math.hypot(b.position.x-local.position.x,b.position.y-local.position.y)||a.sourceEntityId.localeCompare(b.sourceEntityId));

      const resources=economicResources(state,m,localPlayerId,ctx.spaceInstanceId).filter(r=>r.spaceInstanceId===ctx.spaceInstanceId&&Math.hypot(r.position.x-local.position.x,r.position.y-local.position.y)<=900).flatMap(r=>{const bossCompletion=projectBrimstoneCompletionChest(state,r)??projectAegisCompletionChest(state,r)??projectArachnidTreantCompletionChestD12_5B(state,r)??projectStandardCaveBossCompletionChestD13D_E(state,r),finaleCompletion=projectSmallCaveFinaleCompletionChestD13D_C(state,r)??projectLargeCaveFinaleCompletionChestD13D_G(state,r),completion=bossCompletion??finaleCompletion;if(completion&&!completion.visible)return [];return [{...r,...(bossCompletion?{bossCompletion}:{}),...(finaleCompletion?{finaleCompletion}:{}),canUse:canUseResource(state,m,player,{groupId:r.groupId,episode:r.episode,ordinal:r.ordinal,inventoryRevision:player.inventory.revision})}];});

      const hostileHazards=projectHostileHazardsD12_4J(state,ctx.spaceInstanceId),bossHazards=projectBossHazardsD12_5A(state,ctx.spaceInstanceId);

      const visible=engine.nearby(local,900).filter(a=>bossActorTargetableD12_5A(state,a.entityId));for(const defeated of Object.values(state.entitiesById))if(!defeated.alive&&defeated.ai?.defeatedTick!==undefined&&state.tick-defeated.ai.defeatedTick<=36&&defeated.residency.spaceInstanceId===ctx.spaceInstanceId&&Math.hypot(defeated.position.x-local.position.x,defeated.position.y-local.position.y)<=900&&!visible.some(a=>a.entityId===defeated.entityId))visible.push(defeated);if(!visible.some(a=>a.entityId===local.entityId))visible.push(local);

      for(const a of visible){const creature=creatureDefinitionForProfile(a.contentDefinitionId),family=creature?.family??ordinaryEnemyForProfile(a.contentDefinitionId)?.family??null,group=Object.values(state.groupsById).find(g=>g.entityIds.includes(a.entityId)),prior=creatureFacingViews.get(a.entityId),attackTarget=a.ai?.melee?.targetEntityId?state.entitiesById[a.ai.melee.targetEntityId]:null,presentationFacingX=a.team==='hostile'&&family?rustNibblerFacingD11_2({position:a.position,previousPosition:prior?.position??null,movementIntentX:a.movementIntent?.x??0,attackTargetPosition:attackTarget?.position??null,meleePhase:a.ai?.melee?.phase??'idle',lastFacing:prior?.facingX??1,alive:a.alive}):1;creatureFacingViews.set(a.entityId,{position:{...a.position},facingX:presentationFacingX});entitiesById[a.entityId]={position:{...a.position},hp:{m:integerRatio(a.hp,a.maxHp),e:0},maxHp:{m:1,e:0},hpExact:integerWire(a.hp),maxHpExact:integerWire(a.maxHp),shieldRiposteTick:a.team==='party'?engine.events().findLast(e=>e.kind==='combat.damageApplied'&&e.source.entityId===a.entityId&&e.payload.mechanic==='bash'&&e.payload.trigger==='reactive')?.tick??-100:-100,shieldBlockTick:a.team==='party'?engine.events().findLast(e=>['combat.damageApplied','combat.defenseResolved'].includes(e.kind)&&e.subject.entityId===a.entityId&&e.payload.defenseKind==='block')?.tick??-100:-100,equipmentAppearance:a.team==='party'?(()=>{const p=Object.values(state.playersById).find(p=>p.entityId===a.entityId);return Object.fromEntries(['weapon','subweapon'].map(slot=>[slot,p.inventory.itemsById[p.inventory.equipped[slot]]??null]));})():null,guard:state.subweaponCombat.actors[a.entityId]?.guard?{...state.subweaponCombat.actors[a.entityId].guard,direction:{...state.subweaponCombat.actors[a.entityId].guard.direction}}:null,subType:a.team==='party'?playersById[Object.values(state.playersById).find(p=>p.entityId===a.entityId).playerId].stats.subType:null,alive:a.alive,deathAge:a.ai?.defeatedTick===undefined?null:state.tick-a.ai.defeatedTick,hullRadius:a.hullRadius,movedLastTick:a.movedLastTick,motion:a.ai?.motion?{startedTick:a.ai.motion.startedTick,lastMovedTick:a.ai.motion.lastMovedTick}:null,meleePhase:a.ai?.melee?{phase:a.ai.melee.phase,phaseStartedTick:a.ai.melee.phaseStartedTick,phaseEndsTick:a.ai.melee.phaseEndsTick,targetEntityId:a.ai.melee.targetEntityId,actionSequence:a.ai.melee.actionSequence}:null,meleeAction:a.team==='hostile'&&(a.ai?.melee?a.ai.melee.phase!=='idle':a.attackTimer<Math.min(10,a.attackDelayTicks)),meleeGeometry:hasWorldCombat(state)&&family?{reach:a.attackReach,mode:a.attackReachMode,sourceRadius:a.combatRadius,targetRadius:attackTarget?.combatRadius??9,targetPosition:attackTarget?{...attackTarget.position}:null}:null,encounterMode:group?.containment?.mode??null,team:a.team,levelLabel:a.team==='hostile'&&state.d9World?.episodes[group?.groupId]?.snapshot?'Lv. '+formatLarge(statValue(state.d9World.episodes[group.groupId].snapshot.effectiveLevel).toString()):null,enemyFamily:family,presentationFacingX,visualKey:creature?.visualKey??null,visualSeed:deterministicCreatureVisualSeed(a.entityId),groundAnchorY:creature?.presentation.groundAnchor.y??creature?.body.groundAnchorY??a.hullRadius*.45,weaponVisual:a.team==='party'?equippedWeaponVisual(Object.values(state.playersById).find(p=>p.entityId===a.entityId)):null};

        const rangedAction=state.hostileCombat?.actionsByEntityId[a.entityId];if(ordinaryRangedProfile(a)){const aim=rangedAction?.aim??null;entitiesById[a.entityId].ranged=rangedAction?{...copyWire(rangedAction),targetPosition:aim?{x:a.position.x+aim.x*140,y:a.position.y+aim.y*140}:null}:{phase:'idle',phaseStartedTick:state.tick,phaseEndsTick:state.tick,targetEntityId:null,aim:null,actionSequence:0,targetPosition:null};if(!ordinaryRangedProfile(a).meleeFallback){entitiesById[a.entityId].meleeAction=false;entitiesById[a.entityId].meleePhase=null;}}

        const mimicView=projectAegisMimic(state,a.entityId);if(mimicView)entitiesById[a.entityId].aegisMimic=mimicView;entitiesById[a.entityId].elite=mimicView&&mimicView.stage!=='detached'?null:projectEliteCombatD12_4(state,a.entityId);entitiesById[a.entityId].eliteHaste=projectEliteHasteD12_4D(state,a.entityId);entitiesById[a.entityId].eliteGuard=projectEliteGuardD12_4G(state,a.entityId);entitiesById[a.entityId].eliteAttack=projectEliteAttackD12_4H_A(state,a.entityId);entitiesById[a.entityId].boss=projectBossActorD12_5A(state,a.entityId);entitiesById[a.entityId].bossSummon=projectBossSummonD12_5A(state,a.entityId);const eliteStatuses=projectTimedActorStatusesD12_4E(state,a.entityId),bossStatuses=projectBossStatusesD12_5A(state,a.entityId);entitiesById[a.entityId].timedStatuses=eliteStatuses&&bossStatuses?freezeProjection({...eliteStatuses,...bossStatuses}):eliteStatuses??bossStatuses;const p=state.primary.actorsById[a.entityId];if(p)primaryActors[a.entityId]={facing:{...p.facing},current:p.current?{comboStep:p.current.comboStep,phase:p.current.phase,phaseStartedTick:p.current.phaseStartedTick,phaseEndsTick:p.current.phaseEndsTick,aim:{...p.current.aim},primaryActionId:p.current.primaryActionId}:null,held:p.heldCommandId!==null,queued:p.queuedCommandId!==null,nextComboStep:p.nextComboStep,comboDeadline:p.comboDeadline};}

      for(const id of creatureFacingViews.keys())if(!entitiesById[id])creatureFacingViews.delete(id);const history=engine.events(),nextEventKey=`${ctx.spaceInstanceId}/${history.at(-1)?.eventId}/${Object.keys(entitiesById).join('|')}`;if(eventKey!==nextEventKey){eventView=freezeWire(history.filter(e=>e.spaceInstanceId===ctx.spaceInstanceId&&(entitiesById[e.source.entityId]||entitiesById[e.subject.entityId])));eventKey=nextEventKey;}const events=eventView;

      const place=inOverworld?semanticPlaceAtWorldPosition(m,local.position):null,area=inOverworld?areaAtWorldPosition(m,local.position):null,d=state.campaign.overworld.discovery,siteTruth=state.d9World?presentationSiteTruth(state):null;

      const exits=(m.siteInteriors??[]).filter(d=>inOverworld||d===interior).map(d=>{

        const semantic=m.sites.find(s=>s.locationId===d.siteId),direction=inOverworld?'enter':'exit',anchor=inOverworld?semantic.position:d.entrance,payload={siteId:d.siteId,direction};

        return {exitId:`site-${direction}:${d.siteId}`,siteAction:payload,x:anchor.x,y:anchor.y,radius:SITE_INTERACTION_RADIUS,

          available:Boolean(siteTransitionTarget(state,m,local,payload)),label:inOverworld?`Enter ${semantic.properName??semantic.label}`:`Leave ${semantic.properName??semantic.label}`};

      });

      if(state.d9World){

       if(inFunctional){if(isGeneratedInteriorFamily(functional)){if(functionalFloor.index===0){const payload={siteId:functional.siteId,direction:'exit'},anchor=functionalFloor.entrance;exits.push({exitId:`site-exit:${functional.siteId}`,siteAction:payload,siteKind:functional.siteKind,x:anchor.x,y:anchor.y,radius:SITE_INTERACTION_RADIUS,available:Boolean(functionalSiteTransitionTargetD9(state,local,payload)),label:functional.siteKind==='procedural-fort'?'Leave Fort':functional.siteKind==='procedural-ruin'?'Leave Ruin':functional.siteKind==='procedural-crypt'?'Leave Crypt':`Leave Cave`});}for(const direction of ['up','down']){const transition=functionalFloor.transitions[direction];if(!transition)continue;const payload={siteId:functional.siteId,direction,transitionId:transition.transitionId},anchor=transition.anchor;exits.push({exitId:`site-${direction}:${transition.transitionId}`,siteAction:payload,siteKind:functional.siteKind,...(functionalFloor.graph?.navigation?.arrivalFacing!==undefined?{stairFacing:functionalFloor.graph.navigation[direction==='up'?'arrivalFacing':'onwardFacing']} :{}),x:anchor.x,y:anchor.y,radius:SITE_INTERACTION_RADIUS,available:Boolean(functionalSiteTransitionTargetD9(state,local,payload)),label:transition.label??(direction==='down'?'Descend':'Ascend')});}const extraction=projectSmallCaveFinaleExtractionD13D_C(state,functional,functionalFloor)??projectStandardCaveBossExtractionD13D_E(state,functional,functionalFloor)??projectLargeCaveFinaleExtractionD13D_G(state,functional,functionalFloor)??projectArachnidTreantExtractionD12_5C(state,functional,functionalFloor);if(extraction?.visible){const payload={siteId:functional.siteId,direction:'extract',extractionId:extraction.portalId},anchor=extraction.position;exits.push({exitId:extraction.portalId,siteAction:payload,siteKind:'cave-extraction',extractionPortal:extraction,x:anchor.x,y:anchor.y,radius:SITE_INTERACTION_RADIUS,available:Boolean(functionalSiteTransitionTargetD9(state,local,payload)),label:'Return to Cave Mouth'});}}

        else {const payload={siteId:functional.siteId,direction:'exit'},anchor=functional.interior.entrance;exits.push({exitId:`site-exit:${functional.siteId}`,siteAction:payload,siteKind:functional.siteKind,x:anchor.x,y:anchor.y,radius:SITE_INTERACTION_RADIUS,available:Boolean(functionalSiteTransitionTargetD9(state,local,payload)),label:functional.siteKind==='woodland-fort'?'Leave Keep':`Leave ${functional.label}`});}}

       else if(inOverworld){for(const truth of siteTruth.sites.filter(row=>!row.historical&&row.navigable&&row.eligible)){const bound=state.d9World.functionalSitesById[truth.siteId],keep=bound?.siteKind==='woodland-fort'||truth.packageId==='procedural-fort-family',anchor=projectToLocalFrameD9(truth.interactionAnchor,state.d9World.runtime.frames);if(!anchor||Math.hypot(anchor.x-local.position.x,anchor.y-local.position.y)>900)continue;const payload={siteId:truth.siteId,direction:'enter'},available=bound?Boolean(functionalSiteTransitionTargetD9(state,local,payload)):local.alive&&!state.primary.actorsById[local.entityId].current&&Math.hypot(anchor.x-local.position.x,anchor.y-local.position.y)<=SITE_INTERACTION_RADIUS;exits.push({exitId:`site-enter:${truth.siteId}`,siteAction:payload,siteKind:keep?'woodland-fort-keep':truth.packageId==='procedural-ruin-family'?'procedural-ruin':truth.siteType,...(truth.packageId==='procedural-fort-family'?{proceduralFort:true}:{}),...(['procedural-ruin-family','procedural-crypt-family'].includes(truth.packageId)?{proceduralRuin:true}:{}),x:anchor.x,y:anchor.y,radius:SITE_INTERACTION_RADIUS,available,label:bound?.siteKind==='woodland-fort'?'Enter Keep':bound?`Enter ${truth.label}`:`Enter ${truth.label}`});}}

      }

      const station=nearbyForge(state,player);

      exits.push(...campaignTavernExits(state,local),...ferryExits(state,local));

      if(inOverworld)for(const s of state.campaign.forgeStations?.stations??[])exits.push({exitId:s.stationId,forgeAction:true,x:s.interaction.x,y:s.interaction.y,radius:FORGE_INTERACTION_RADIUS,available:s.stationId===station?.stationId,label:'Use Forge'});

      const nearest=visible.filter(a=>a.alive&&a.team==='hostile').sort((a,b)=>clearHullGap(local,a)-clearHullGap(local,b))[0],tomeTarget=!nearest?'NO TARGET':clearHullGap(local,nearest)>128?'OUT OF RANGE':visible.some(a=>a.alive&&a.team==='hostile'&&clearHullGap(local,a)<=128&&subweaponLineClear(c,local,a))?'READY':'LOS BLOCKED';

      const plannedPosition=state.d9World?.plannedWorld&&inOverworld?localFramePositionD9(local.position,state.d9World.runtime.frames):null,plannedRegion=plannedPosition?state.d9World.runtime.chunks.find(c=>c.chunkX===plannedPosition.chunkX&&c.chunkY===plannedPosition.chunkY)?.region:null;

      for(const n of [...serviceNpcs].reverse())exits.unshift({exitId:n.id,serviceNpcId:n.id,x:n.position.x,y:n.position.y,radius:72,available:n.available,label:'Talk to '+n.name+' · '+n.roleLabel});
      cachedModel=Object.freeze({serviceNpcs:freezeProjection(serviceNpcs),navigation:state.d9World?freezeProjection({frames:copyWire(state.d9World.runtime.frames),position:inOverworld?localFramePositionD9(local.position,state.d9World.runtime.frames):null,revision:state.d9World.navigation.revision,root:state.d9World.discoveryIndex,boundSitesById:Object.fromEntries(functionalSitesD10(state).map(site=>[site.siteId,{siteId:site.siteId,label:mapSiteLabel(state,site.siteId,site.label),state:site.conqueredTick===null?'active':'completed'}])),navigableSitesById:Object.fromEntries(siteTruth.sites.map(site=>[site.siteId,{siteId:site.siteId,label:mapSiteLabel(state,site.siteId,site.label),state:site.completed?'completed':site.bound?'active':'unidentified'}])),pending:copyWire(state.d9World.navigation.pending.filter(r=>r.playerId===localPlayerId)),pips:inOverworld?visible.filter(a=>a.alive&&a.entityId!==local.entityId&&Math.hypot(a.position.x-local.position.x,a.position.y-local.position.y)<=revealRadiusD9(playersById[localPlayerId].stats.attributes.int)*32).map(a=>({position:localFramePositionD9(a.position,state.d9World.runtime.frames),kind:a.team==='party'?'ally':'hostile'})):[]}):null,combatPresentation:freezeProjection(projectCombatPresentation(state,Object.keys(entitiesById))),tomeTarget,subweapon:freezeProjection({suppressed:subweaponSuppressedD12_4I(state,local.entityId),guard:{...state.subweaponCombat.actors[local.entityId].guard,integrity:presentCombat(state.subweaponCombat.actors[local.entityId].guard.integrity),direction:{...state.subweaponCombat.actors[local.entityId].guard.direction}},delivery:{...state.subweaponCombat.actors[local.entityId].delivery},pressure:state.subweaponCombat.actors[local.entityId].pressure,dash:{...state.subweaponCombat.actors[local.entityId].dash},barrier:presentCombat(state.subweaponCombat.actors[local.entityId].barrier),maxBarrier:playersById[localPlayerId].stats.maxBarrier,barrierRatio:integerRatio(state.subweaponCombat.actors[local.entityId].barrier,playersById[localPlayerId].stats.maxBarrier),barrierLabel:formatLarge(state.subweaponCombat.actors[local.entityId].barrier),maxBarrierLabel:formatLarge(playersById[localPlayerId].stats.maxBarrier)}),hostileProjectiles:freezeProjection(Object.values(state.hostileCombat?.projectiles??{}).filter(b=>b.spaceInstanceId===ctx.spaceInstanceId&&Math.hypot(b.position.x-local.position.x,b.position.y-local.position.y)<=1000).map(b=>({id:b.id,sourceId:b.sourceId,sourceFamily:ordinaryEnemyForProfile(state.entitiesById[b.sourceId]?.contentDefinitionId)?.family??null,style:b.type,position:{...b.position},direction:{...b.direction},radius:b.radius,firedTick:b.firedTick}))),bolts:freezeProjection(Object.values(state.subweaponCombat.projectiles).filter(b=>b.spaceInstanceId===ctx.spaceInstanceId).map(b=>({id:b.id,sourceId:b.sourceId,frames:b.frames,delivery:b.delivery,position:{...b.position},direction:{...b.direction}}))),tick:state.tick,localPlayerId,inventory,forgeAccess:forgeAccess(state,player,m),loot:freezeProjection(loot),resources:freezeProjection(resources),playersById:freezeProjection(playersById),entitiesById:freezeProjection(entitiesById),party:freezeProjection(party),

        hostileHazards,bossHazards,context:freezeProjection({protocolVersion:1,campaignId:state.campaign.campaignId,sessionId:state.session.sessionId,expectedSaveRevision:state.campaign.saveRevision,...ctx,nextClientSequence:engine.nextClientSequence(localPlayerId)}),

        primary:freezeProjection({actorsById:primaryActors,events}),encounter:null,

        recovery:Object.freeze({canRespawn:!local.alive,anchorLabel:state.d9World?.plannedWorld?.townPrototype==='planned-town-start-art-candidate-v2'?'town street':m.settlements.find(s=>s.settlementId===m.start.settlementId).label}),

        space:Object.freeze({...(inOverworld&&hasSettlementLife(state.d9World?.plannedWorld)?{plannedVillage:projectToLocalFrameD9({chunkX:'1164',chunkY:'1316',localX:0,localY:0},state.d9World.runtime.frames)}:{}),...(tavernFloor?{settlementInterior:{recipeVersion:tavernBinding.recipeVersion,floorId:tavernFloor,bindingId:tavernBinding.identity}}:{}),...(inOverworld&&tavernBinding?{plannedTown:projectToLocalFrameD9({chunkX:'1206',chunkY:'1244',localX:0,localY:0},state.d9World.runtime.frames)}:{}),forgeStations:inOverworld?state.campaign.forgeStations?.stations??[]:[],spaceId:space.spaceId,label:tavernFloor?'Tavern - '+tavernFloor:plannedRegion?.name??site?.properName??(functionalFloor?`${site?.label} · Floor ${functionalFloor.index+1}/${functional.floorCount}`:site?.label)??(area?.minimumLevel?area.label+' · Minimum Lv. '+formatLarge(typeof area.minimumLevel==='number'?String(area.minimumLevel):area.minimumLevel):place?.label??area?.label??'Unexplored territory'),collision:Object.freeze({tileSize:c.tileSize,width:c.width,height:c.height,endless:Boolean(state.d9World&&inOverworld)}),visual:page,exits:freezeProjection(exits),functionalSite:inFunctional&&functional.siteKind==='woodland-fort'?freezeProjection({siteId:functional.siteId,label:functional.label,siteKind:functional.siteKind,siteTier:null,contentHash:functional.instanceHash,conqueredTick:functional.conqueredTick}):null,site:interior&&functional?.siteKind!=='woodland-fort'?freezeProjection(inFunctional?{siteId:functional.siteId,label:functional.label,siteKind:functional.siteKind,siteTier:functional.sizeTier??null,floorIndex:functionalFloor?.index??0,floorCount:functional.floorCount??1,contentHash:interior.contentHash,conqueredTick:functional.conqueredTick}:{siteId:site.locationId,label:site.properName??site.label,siteKind:site.siteKind,siteTier:site.siteTier,contentHash:interior.contentHash,conqueredTick:state.campaign.sitesById[site.locationId].conqueredTick}):null,settlementSafe:inOverworld&&isWorldPointSafe(m,local.position),visitedCount:d.discoveredRegionIds.length+d.discoveredSettlementIds.length+d.discoveredSiteIds.length,visitedTotal:m.regions.length+m.settlements.length+m.sites.length,

          overworld:Object.freeze({manifestId:m.manifestId,manifestHash:m.manifestHash,manifestVersion:2,regionThreatTier:inOverworld?populationRegionAt(m,local.position)?.threatTier??null:null,populationGroups:m.population?.groups.length??0,safeRegions:freezeProjection(inOverworld?safeRegions.filter(r=>local.position.x>=r.x&&local.position.x<r.x+r.width&&local.position.y>=r.y&&local.position.y<r.y+r.height):[]),egresses:freezeProjection(inOverworld&&state.d9World?state.d9World.origin.egress.openings.map(opening=>{const p=opening.cells[Math.floor(opening.cells.length/2)];return {side:opening.side,x:(p.x+.5)*32,y:(p.y+.5)*32,label:'Frontier trail'};}):[]),seedHex:m.generation.seedHex,generatorVersion:m.generation.generatorVersion,currentAreaId:inOverworld&&area?technicalChunkId(area):null,currentPlaceId:place?.placeId??null})}),

        persistence:freezeProjection({phase:status.phase==='ready'?'encounter':status.phase,saving:Boolean(status.saving),confirmedSaveRevision:status.confirmedSaveRevision}),travel:null});cachedKey=key;return cachedModel;

    });

  }));}

  return Object.freeze({getReadModel,send:c=>measure('commandAdmission',()=>{const r=authority.createControllerPort(localPlayerId).send(c);authority.drainCommands();cachedKey=null;return r;}),reconcile:()=>authority.reconcile(),resources:()=>({cachedModels:cachedModel?1:0,terrainPages:page?1:0,projectedTiles:page?page.terrain.length*page.terrain[0].length:0})});

}

