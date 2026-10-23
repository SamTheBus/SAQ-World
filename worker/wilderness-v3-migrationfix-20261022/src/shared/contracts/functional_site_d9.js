import {hasWorldCombat,WORLD_COMBAT_VERSION} from '../content/world_combat_v1.js';
import {adoptOrdinaryRosters} from './ordinary_roster_v1.js?v=wilderness-v3-5-ecology-20261022';
import {adoptOrdinaryRostersV2} from './ordinary_roster_v2.js?v=wilderness-v3-5-ecology-20261022';
import {MULTIROOM_VERSION,MULTIROOM_POLICY,usesMultiroom} from '../content/multiroom_policy_v1.js';import {validateMultiroomFloor} from './multiroom_v1.js';
import {CRYPT_POPULATION_VERSION,CRYPT_POPULATION_PACKAGE} from '../content/crypt_population_v3.js';
import {cryptPackageForVersion} from '../content/planned_crypt_policy_v2.js';
import {isCryptFamily,PLANNED_CRYPT_SOCKET,CRYPT_PACKAGE} from '../content/planned_crypt_policy_v1.js';
import {validateCryptFamily,validateCryptRuntime} from './planned_crypt_v1.js';
import {ruinPackageForVersion} from '../content/planned_ruin_policy_v2.js';
import {isRuinFamily,PLANNED_RUIN_SOCKET,RUIN_FAMILY_PACKAGE} from '../content/planned_ruin_policy_v1.js';
import {validateRuinFamily,validateRuinRuntimeV1} from './planned_ruin_v1.js';
import {fortPackageForVersion} from '../content/planned_fort_policy_v2.js';
import {isFortFamily,PLANNED_FORT_SOCKET,FORT_FAMILY_PACKAGE} from '../content/planned_fort_policy_v1.js';
import {validateFortFamily,validateFortRuntimeV1} from './planned_fort_v1.js';
import {closedRecord,canonicalStringify,copyWire,requireContract as check,safeInteger} from './wire.js';
import {validateSiteSocketD9,packageEligibleD9,D9_SITE_CONTENT_CATALOG} from './site_content_d9.js';
import {WOODLAND_RUIN_PACKAGE,WOODLAND_RUIN_TEMPLATE,WOODLAND_RUIN_PACKAGE_ID,WOODLAND_RUIN_VERSION,WOODLAND_RUIN_CONTENT_HASH} from '../content/woodland_ruin_d9.js';
import {WOODLAND_FORT_PACKAGE,WOODLAND_FORT_TEMPLATE,WOODLAND_FORT_PACKAGE_ID,WOODLAND_FORT_VERSION,WOODLAND_FORT_CONTENT_HASH} from '../content/woodland_fort_d10.js';
import {functionalSiteDefinitionD10} from '../content/functional_site_registry_d10.js';
import {projectToLocalFrameD9} from './local_world_frames_d9.js';
import {floorDiv,normalizeWorldPosition} from './world_address.js';
import {collidesWithTiles} from '../rules/world_geometry.js';
import {FUNCTIONAL_SITE_FAMILY_D12} from '../content/site_family_runtime_d12.js';
import {FUNCTIONAL_SITE_FAMILY_D12_1} from '../content/site_family_runtime_d12_1.js';
import {FUNCTIONAL_SITE_FAMILY_D12_2} from '../content/site_family_runtime_d12_2.js';
import {WOODLAND_CAVE_FAMILY_ID} from '../content/site_families_d12.js';
import {installEliteRecordsD12_4} from './elite_combat_d12_4.js';
import {installBossRecordsD12_5A} from './boss_combat_d12_5.js';
import {projectArachnidTreantExtractionD12_5C} from './boss_extraction_d12_5c.js';
import {projectLargeCaveFinaleExtractionD13D_G,projectSmallCaveFinaleExtractionD13D_C,projectStandardCaveBossExtractionD13D_E} from './site_finale_completion_d13d.js';
import {installSiteRunEpisodesD13B,resolveSiteRunEpisodeD13B,siteSupportsResetD13C} from './site_run_episode_d13b.js';
import {installSiteFinaleReservationsD13D_A} from './site_finale_d13d.js';

const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),digest=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
export const FUNCTIONAL_SITE_D9='functional-site-d9-v1';
const SITE_INTERACTION_RADIUS=64;
export const isGeneratedCaveFamilyD12=site=>[FUNCTIONAL_SITE_FAMILY_D12,FUNCTIONAL_SITE_FAMILY_D12_1,FUNCTIONAL_SITE_FAMILY_D12_2].includes(site?.version);
export const functionalSitesD10=state=>Object.values(state.d9World?.functionalSitesById??{});
export const isGeneratedInteriorFamily=site=>isGeneratedCaveFamilyD12(site)||isFortFamily(site)||isRuinFamily(site)||isCryptFamily(site);
export const functionalSiteFloorsD12=site=>isGeneratedInteriorFamily(site)?site.floors:site?[{floorId:null,index:0,spaceInstanceId:site.spaceInstanceId,logicalSpaceId:site.interior.logicalSpaceId,collision:site.interior.collision,visual:site.interior.visual,entrance:site.interior.entrance,groupId:site.interior.groupId,transitions:{up:null,down:null},rewardId:null}]:[];
export const functionalSiteSpaceIdsD12=site=>functionalSiteFloorsD12(site).map(f=>f.spaceInstanceId);
export const functionalSiteGroupsD12=site=>functionalSiteFloorsD12(site).map(f=>f.groupId);
export const functionalSiteForSpaceD12=(state,spaceId)=>functionalSitesD10(state).find(site=>functionalSiteSpaceIdsD12(site).includes(spaceId))??null;
export const functionalSiteFloorForSpaceD12=(site,spaceId)=>functionalSiteFloorsD12(site).find(f=>f.spaceInstanceId===spaceId)??null;
export const fortDoorWorldD10=site=>{const x=BigInt(site.compound.tileX),y=BigInt(site.compound.tileY),cx=floorDiv(x,32n),cy=floorDiv(y,26n);return normalizeWorldPosition({chunkX:String(cx),chunkY:String(cy),localX:Number(x-cx*32n)*32+WOODLAND_FORT_TEMPLATE.keepDoor.x,localY:Number(y-cy*26n)*32+WOODLAND_FORT_TEMPLATE.keepDoor.y});};

// Old D9 runtime cuts contain exactly one procedural site. Normalize before
// validation or publication, preserving the complete authored site record.
export function migrateLegacyFunctionalSitesD10(world){
 const sites=world.functionalSitesById??{};
 if(Object.hasOwn(world,'functionalSite')){
  const legacy=world.functionalSite;
  if(legacy){const prior=sites[legacy.siteId];check(!prior||same(prior,legacy),'Conflicting legacy functional site');sites[legacy.siteId]=copyWire(legacy);}
  delete world.functionalSite;
 }
 world.functionalSitesById=sites;world.siteReservationsById??={};return world;
}

export function validateFunctionalSiteD9(site){
 if(site===null)return null;
 if(isCryptFamily(site))return validateCryptFamily(site);
 if(isRuinFamily(site))return validateRuinFamily(site);
 if(isFortFamily(site))return validateFortFamily(site);
 if(isGeneratedCaveFamilyD12(site)){
  const multi=site.generatorVersion===MULTIROOM_VERSION,modern=[FUNCTIONAL_SITE_FAMILY_D12_1,FUNCTIONAL_SITE_FAMILY_D12_2].includes(site.version),natural=site.version===FUNCTIONAL_SITE_FAMILY_D12_2;closedRecord(site,natural?['version','siteId','packageId','packageVersion','contentHash','label','siteKind','familyId','familyVersion','generatorVersion','moduleCatalogVersion','siteSeed','layoutSeed','regionName','geographicQualifier','spawnProvenance','layoutProvenance','sizeTier','floorCount','floorIds','layoutHash','encounterProvenance','rewardProvenance','socket','spaceInstanceId','interior','floors','conqueredTick','discoveredByPlayerIds','instanceHash']:modern?['version','siteId','packageId','packageVersion','contentHash','label','siteKind','familyId','familyVersion','generatorVersion','moduleCatalogVersion','siteSeed','layoutSeed','geographicQualifier','spawnProvenance','layoutProvenance','sizeTier','floorCount','floorIds','layoutHash','encounterProvenance','rewardProvenance','socket','spaceInstanceId','interior','floors','conqueredTick','discoveredByPlayerIds','instanceHash']:['version','siteId','packageId','packageVersion','contentHash','label','siteKind','familyId','familyVersion','generatorVersion','moduleCatalogVersion','siteSeed','spawnProvenance','sizeTier','floorCount','floorIds','layoutHash','encounterProvenance','rewardProvenance','socket','spaceInstanceId','interior','floors','conqueredTick','discoveredByPlayerIds','instanceHash']);
  const definition=functionalSiteDefinitionD10(site.packageId,site.packageVersion);check(definition?.placement==='generated-interior-family'&&site.familyId===WOODLAND_CAVE_FAMILY_ID&&site.siteId===site.socket.siteId&&site.floorCount===site.floors.length&&site.floorCount>=1&&site.floorCount<=4&&site.spaceInstanceId===site.floors[0].spaceInstanceId&&same(site.floorIds,site.floors.map(f=>f.floorId))&&digest(site.siteSeed)&&digest(site.layoutHash)&&digest(site.instanceHash),'Invalid generated cave family identity');validateSiteSocketD9(site.socket);
  const spaces=new Set(),groups=new Set(),enemies=new Set(),rewards=new Set();for(const [i,f] of site.floors.entries()){
   closedRecord(f,['version','floorId','index','floorSeed','graph','collision','visual','entrance','transitions','encounter','reward','decorationIds','logicalSpaceId','spaceInstanceId','groupId','enemyIds','rewardId']);check(f.version===(multi?MULTIROOM_VERSION:natural?'generated-site-floor-d12-2-v1':modern?'generated-site-floor-d12-1-v1':'generated-site-floor-d12-v1')&&f.index===i&&f.floorId===site.floorIds[i]&&digest(f.floorSeed)&&/^spi:[a-f0-9]{32}$/.test(f.spaceInstanceId)&&/^spc:[a-f0-9]{32}$/.test(f.logicalSpaceId)&&!spaces.has(f.spaceInstanceId)&&!groups.has(f.groupId),'Invalid generated cave floor identity');spaces.add(f.spaceInstanceId);groups.add(f.groupId);
   check(f.collision.tileSize===32&&f.collision.width>=20&&f.collision.width<=(natural?180:modern?64:48)&&f.collision.height>=20&&f.collision.height<=(natural?150:modern?52:32)&&f.collision.tiles.length===f.collision.height&&f.collision.tiles.every(r=>r.length===f.collision.width&&/^[01]+$/.test(r))&&same(f.visual.terrain,f.collision.tiles),'Generated cave collision/visual drift');
   check(f.enemyIds.length===f.encounter.members.length&&f.enemyIds.length>=1&&f.enemyIds.length<=(f.encounter.combatVersion?40:5)&&f.enemyIds.every(id=>/^ent:[a-f0-9]{32}$/.test(id)&&!enemies.has(id)),'Generated cave encounter identity');for(const id of f.enemyIds)enemies.add(id);
   check((f.reward===null)===(f.rewardId===null)&&(!f.rewardId||!rewards.has(f.rewardId)),'Generated cave reward identity');if(f.rewardId)rewards.add(f.rewardId);
   check((i===0)===(f.transitions.up===null)&&(i===site.floors.length-1)===(f.transitions.down===null),'Generated cave transition topology');if(f.transitions.up)check(f.transitions.up.floorId===site.floors[i-1].floorId&&f.transitions.up.spaceInstanceId===site.floors[i-1].spaceInstanceId,'Generated cave upward target drift');if(f.transitions.down)check(f.transitions.down.floorId===site.floors[i+1].floorId&&f.transitions.down.spaceInstanceId===site.floors[i+1].spaceInstanceId,'Generated cave downward target drift');
  }
  if(multi){check(site.floorCount===MULTIROOM_POLICY.floors[site.sizeTier],'Multiroom Cave floor count');for(const f of site.floors)validateMultiroomFloor(f,site.layoutSeed,'cave',site.sizeTier,f.index);}
  check(site.interior.groupId===site.floors[0].groupId&&site.interior.logicalSpaceId===site.floors[0].logicalSpaceId&&same(site.interior.collision,site.floors[0].collision),'Generated cave compatibility view drift');if(site.conqueredTick!==null)safeInteger(site.conqueredTick);return site;
 }
 if(site.version==='functional-site-d10-compound-v1'){
  closedRecord(site,['version','siteId','packageId','packageVersion','contentHash','label','siteKind','socket','spaceInstanceId','interior','compound','initial','conqueredTick','instanceHash']);
  const definition=functionalSiteDefinitionD10(site.packageId,site.packageVersion);check(definition?.placement==='overworld-compound','Unknown Fort compound package');
  check(site.siteId===site.socket.siteId&&site.compound.siteId===site.siteId&&site.packageId===definition.package.packageId&&site.packageVersion===definition.package.packageVersion&&site.contentHash===definition.package.contentHash&&site.label===definition.template.label&&site.siteKind==='woodland-fort'&&digest(site.instanceHash),'Invalid Fort compound identity');
  validateSiteSocketD9(site.socket);check(site.compound.version===WOODLAND_FORT_VERSION&&site.compound.pages.length===4&&new Set(site.compound.pages.map(p=>p.chunkX+','+p.chunkY)).size===4,'Fort parcel inventory');
  const d=site.interior;closedRecord(d,['recipeVersion','siteId','logicalSpaceId','contentHash','collision','entrance','rooms','decorations','groupId','visual']);
  check(d.siteId===site.siteId&&d.recipeVersion===definition.package.packageVersion&&d.contentHash===site.contentHash&&same(d.collision,definition.template.keep.collision)&&same(d.entrance,definition.template.keep.entrance)&&same(d.visual,definition.template.keep.visual),'Fort keep drift');
  check(site.initial.group.groupId===d.groupId&&site.initial.group.spaceInstanceId!==site.spaceInstanceId&&site.initial.actors.length===definition.template.encounter.members.length&&site.initial.group.entityIds.length===site.initial.actors.length&&site.initial.resource.groupId===d.groupId,'Fort encounter definition drift');
  if(site.conqueredTick!==null)safeInteger(site.conqueredTick);return site;
 }
 closedRecord(site,['version','siteId','packageId','packageVersion','contentHash','label','siteKind','socket','spaceInstanceId','interior','conqueredTick','instanceHash']);
 check(site.version===FUNCTIONAL_SITE_D9&&site.siteId===site.socket.siteId&&/^spi:[a-f0-9]{32}$/.test(site.spaceInstanceId)&&digest(site.instanceHash),'Invalid functional Woodland site');
 validateSiteSocketD9(site.socket);check(site.socket.region.biome==='woodland','Woodland site bound outside Woodland');
 const definition=functionalSiteDefinitionD10(site.packageId,site.packageVersion),fort=definition?.placement==='overworld-compound';check(definition,'Unknown functional site package');
 check(site.packageId===definition.package.packageId&&site.packageVersion===definition.package.packageVersion&&site.contentHash===definition.package.contentHash&&site.label===definition.template.label&&site.siteKind===definition.template.siteKind,'Invalid functional Woodland site');
 const d=site.interior,visual=Boolean(definition.template.visual);closedRecord(d,['recipeVersion','siteId','logicalSpaceId','contentHash','collision','entrance','rooms','decorations','groupId'],visual?['visual']:[]);
 const interiorError=site.packageId===WOODLAND_RUIN_PACKAGE_ID?'Corrupt Woodland ruin interior':'Corrupt functional Woodland interior';
 check(d.recipeVersion===definition.package.packageVersion&&d.siteId===site.siteId&&d.contentHash===site.contentHash&&/^spc:[a-f0-9]{32}$/.test(d.logicalSpaceId)&&d.groupId==='site:'+site.siteId+':'+definition.groupSuffix&&same(d.collision,definition.template.collision)&&same(d.entrance,definition.template.entrance)&&same(d.rooms,definition.template.rooms)&&same(d.decorations,definition.template.decorations)&&(!visual||same(d.visual,definition.template.visual)),interiorError);
 if(site.conqueredTick!==null)safeInteger(site.conqueredTick);return site;
}

export function eligibleWoodlandSocketD9(state,socket){
 validateSiteSocketD9(socket);const represented=functionalSitesD10(state).some(site=>site.packageId===WOODLAND_RUIN_PACKAGE_ID);
 return packageEligibleD9(socket,WOODLAND_RUIN_PACKAGE,represented);
}

export function eligibleFunctionalSocketD10(state,socket){
 validateSiteSocketD9(socket);
 if(state.d9World.functionalSitesById[socket.siteId])return true;
 if(Object.keys(state.d9World.siteReservationsById??{}).length&&!state.d9World.siteReservationsById[socket.siteId])return false;
 if(socket.version===PLANNED_CRYPT_SOCKET)return packageEligibleD9(socket,(socket.provenance.placementVersion===CRYPT_POPULATION_VERSION?CRYPT_POPULATION_PACKAGE:cryptPackageForVersion(socket.provenance.placementVersion)),false);
 if(socket.version===PLANNED_RUIN_SOCKET)return packageEligibleD9(socket,ruinPackageForVersion(socket.provenance.placementVersion),false);
 if(socket.version===PLANNED_FORT_SOCKET)return packageEligibleD9(socket,fortPackageForVersion(socket.provenance.placementVersion),false);
 return D9_SITE_CONTENT_CATALOG.packages.some(p=>packageEligibleD9(socket,p,functionalSitesD10(state).some(site=>site.packageId===p.packageId)));
}

export function findRuntimeSiteSocketD9(state,siteId){return state.d9World.runtime.chunks.flatMap(c=>c.sites??[]).find(s=>s.siteId===siteId)??null;}

export function functionalSiteTransitionTargetD9(state,actor,payload){
 const f=state.d9World?.functionalSitesById?.[payload.siteId];if(!f||!actor.alive||state.primary.actorsById[actor.entityId]?.current)return null;
 if(isGeneratedInteriorFamily(f)){if(isCryptFamily(f))validateCryptRuntime(state,f);
  let source,anchor,destination,targetSpace;if(payload.direction==='enter'){source=state.overworldInstanceId;anchor=projectToLocalFrameD9(f.socket.entrance,state.d9World.runtime.frames);destination=f.floors[0].entrance;targetSpace=f.floors[0].spaceInstanceId;}
  else {const floor=functionalSiteFloorForSpaceD12(f,actor.residency.spaceInstanceId);if(!floor)return null;if(payload.direction==='exit'){if(floor.index!==0)return null;source=floor.spaceInstanceId;anchor=floor.entrance;destination=projectToLocalFrameD9(f.socket.entrance,state.d9World.runtime.frames);targetSpace=state.overworldInstanceId;}
   else if(payload.direction==='extract'){const portal=projectSmallCaveFinaleExtractionD13D_C(state,f,floor)??projectStandardCaveBossExtractionD13D_E(state,f,floor)??projectLargeCaveFinaleExtractionD13D_G(state,f,floor)??projectArachnidTreantExtractionD12_5C(state,f,floor);if(!portal?.visible||portal.portalId!==payload.extractionId)return null;source=floor.spaceInstanceId;anchor=portal.position;destination=portal.destination??projectToLocalFrameD9(f.socket.entrance,state.d9World.runtime.frames);targetSpace=state.overworldInstanceId;}
   else {const transition=floor.transitions[payload.direction];if(!transition||transition.transitionId!==payload.transitionId)return null;source=floor.spaceInstanceId;anchor=transition.anchor;destination=transition.targetAnchor;targetSpace=transition.spaceInstanceId;}}
  if(actor.residency.spaceInstanceId!==source||!anchor||!destination||Math.hypot(actor.position.x-anchor.x,actor.position.y-anchor.y)>SITE_INTERACTION_RADIUS)return null;const c=state.spacesByInstanceId[source].collision,steps=Math.max(1,Math.ceil(Math.hypot(actor.position.x-anchor.x,actor.position.y-anchor.y)/4));for(let n=0;n<=steps;n++){const q=n/steps;if(collidesWithTiles(c,actor.position.x+(anchor.x-actor.position.x)*q,actor.position.y+(anchor.y-actor.position.y)*q,actor.hullRadius))return null;}return {spaceInstanceId:targetSpace,position:{x:destination.x,y:destination.y}};
 }
 if(payload.direction==='extract')return null;
 const entering=payload.direction==='enter',source=entering?state.overworldInstanceId:f.spaceInstanceId;
 if(actor.residency.spaceInstanceId!==source)return null;
 const doorway=f.siteKind==='woodland-fort'?fortDoorWorldD10(f):f.socket.entrance;
 const anchor=entering?projectToLocalFrameD9(doorway,state.d9World.runtime.frames):f.interior.entrance;
 const destination=entering?f.interior.entrance:projectToLocalFrameD9(doorway,state.d9World.runtime.frames);
 if(!anchor||!destination||Math.hypot(actor.position.x-anchor.x,actor.position.y-anchor.y)>SITE_INTERACTION_RADIUS)return null;
 const c=state.spacesByInstanceId[source].collision,steps=Math.max(1,Math.ceil(Math.hypot(actor.position.x-anchor.x,actor.position.y-anchor.y)/4));
 for(let n=0;n<=steps;n++){const q=n/steps;if(collidesWithTiles(c,actor.position.x+(anchor.x-actor.position.x)*q,actor.position.y+(anchor.y-actor.position.y)*q,actor.hullRadius))return null;}
 return {spaceInstanceId:entering?f.spaceInstanceId:state.overworldInstanceId,position:{x:destination.x,y:destination.y}};
}

export function admitFunctionalSiteD9(state,plan){
  if(isGeneratedInteriorFamily(plan.functionalSite)){check(!state.d9World.functionalSitesById[plan.functionalSite.siteId],'Generated cave already admitted');state.d9World.functionalSitesById[plan.functionalSite.siteId]=copyWire(plan.functionalSite);for(const space of plan.spaces){check(!state.spacesByInstanceId[space.spaceInstanceId],'Generated cave space collision');state.spacesByInstanceId[space.spaceInstanceId]=copyWire(space);}for(const actor of plan.actors){check(!state.entitiesById[actor.entityId],'Generated cave actor collision');state.entitiesById[actor.entityId]=copyWire(actor);}for(let i=0;i<plan.groups.length;i++){const group=plan.groups[i];check(!state.groupsById[group.groupId],'Generated cave group collision');state.groupsById[group.groupId]=copyWire(group);state.encounterEconomy.groups[group.groupId]=copyWire(plan.economies[i]);state.d9World.episodes[group.groupId]=copyWire(plan.episodes[i]);}installEliteRecordsD12_4(state,plan.elites??[]);installBossRecordsD12_5A(state,plan.bosses??[]);state.d9World.runtime.resources.push(...plan.resources.map(copyWire));state.d9World.runtime.revision++;installSiteRunEpisodesD13B(state);installSiteFinaleReservationsD13D_A(state);adoptOrdinaryRosters(state,{groupIds:plan.groups.map(g=>g.groupId)});adoptOrdinaryRostersV2(state,{groupIds:plan.groups.map(g=>g.groupId)});return state.d9World.functionalSitesById[plan.functionalSite.siteId];}
 check(plan.functionalSite&&!state.d9World.functionalSitesById[plan.functionalSite.siteId]&&!state.spacesByInstanceId[plan.space.spaceInstanceId],'Functional site already admitted');
 state.d9World.functionalSitesById[plan.functionalSite.siteId]=copyWire(plan.functionalSite);state.spacesByInstanceId[plan.space.spaceInstanceId]=copyWire(plan.space);
 if(functionalSiteDefinitionD10(plan.functionalSite.packageId,plan.functionalSite.packageVersion)?.placement==='overworld-compound'){installSiteRunEpisodesD13B(state);return state.d9World.functionalSitesById[plan.functionalSite.siteId];}
 check(plan.group&&!state.groupsById[plan.group.groupId],'Functional site encounter already admitted');
 for(const actor of plan.actors){check(!state.entitiesById[actor.entityId],'Functional site actor collision');state.entitiesById[actor.entityId]=copyWire(actor);}
 state.groupsById[plan.group.groupId]=copyWire(plan.group);state.encounterEconomy.groups[plan.group.groupId]=copyWire(plan.economy);state.d9World.episodes[plan.group.groupId]=copyWire(plan.episode);state.d9World.runtime.resources.push(copyWire(plan.resource));state.d9World.runtime.revision++;installSiteRunEpisodesD13B(state);adoptOrdinaryRosters(state,{groupIds:[plan.group.groupId]});adoptOrdinaryRostersV2(state,{groupIds:[plan.group.groupId]});
 return state.d9World.functionalSitesById[plan.functionalSite.siteId];
}

export function validateFunctionalSiteStateD9(state){for(const s of Object.values(state.d9World?.functionalSitesById??{})){const multi=s.floors?.[0]?.version===MULTIROOM_VERSION;if(multi){check(usesMultiroom(state.d9World.plannedWorld),'Uncommitted multiroom authority');for(const f of s.floors)check((f.encounter.combatVersion??null)===(hasWorldCombat(state)?WORLD_COMBAT_VERSION:null),'Uncommitted combat roster');}}
 for(const f of functionalSitesD10(state)){
  validateFunctionalSiteD9(f);
  if(isGeneratedInteriorFamily(f)){if(isCryptFamily(f))validateCryptRuntime(state,f);if(isFortFamily(f))validateFortRuntimeV1(state,f);if(isRuinFamily(f))validateRuinRuntimeV1(state,f);let cleared=true;for(const floor of f.floors){const space=state.spacesByInstanceId[floor.spaceInstanceId],group=state.groupsById[floor.groupId],episode=state.d9World.episodes[floor.groupId],economy=state.encounterEconomy.groups[floor.groupId];check(space?.spaceId===floor.logicalSpaceId&&same(space.collision,floor.collision)&&group?.siteId===f.siteId&&group.spaceInstanceId===floor.spaceInstanceId&&same(group.entityIds,floor.enemyIds)&&episode&&economy,'Generated cave floor runtime drift');check(group.cleared===group.entityIds.every(id=>!state.entitiesById[id].alive),'Generated cave floor clear/liveness mismatch');cleared&&=group.cleared;const resources=state.d9World.runtime.resources.filter(r=>r.groupId===floor.groupId);check(resources.length===(floor.reward?1:0)&&resources.every(r=>r.spaceInstanceId===floor.spaceInstanceId),'Generated cave floor reward drift');}if(siteSupportsResetD13C(state,f.siteId)){const run=resolveSiteRunEpisodeD13B(state,f.siteId),retired=(run?.historyArchive?.archivedEpisodes??0)+(run?.completionHistory?.length??0);check(Boolean(run)&&(run.status==='cleared')===cleared&&(f.conqueredTick!==null)===(retired>0||run.status==='cleared'),'Resettable Cave completion drift');}else check((f.conqueredTick!==null)===cleared,'Generated cave completion drift');continue;}
  if(f.version==='functional-site-d10-compound-v1'){
   const keep=state.spacesByInstanceId[f.spaceInstanceId],group=state.groupsById[f.interior.groupId],resident=f.compound.pages.filter(p=>state.d9World.runtime.chunks.some(c=>c.chunkX===p.chunkX&&c.chunkY===p.chunkY)).length;
   check(keep?.spaceId===f.interior.logicalSpaceId&&same(keep.collision,f.interior.collision)&&(resident===0||resident===4),'Fort keep/parcel residency drift');
   if(resident){const definition=functionalSiteDefinitionD10(f.packageId,f.packageVersion),economy=state.encounterEconomy.groups[f.interior.groupId],resources=state.d9World.runtime.resources.filter(r=>r.groupId===f.interior.groupId);check(group?.siteId===f.siteId&&group.spaceInstanceId===state.overworldInstanceId&&group.entityIds.length===definition.template.encounter.members.length&&economy&&resources.length===1&&resources[0].spaceInstanceId===state.overworldInstanceId,'Fort courtyard residency drift');check(group.cleared===group.entityIds.every(id=>!state.entitiesById[id].alive)&&((f.conqueredTick!==null)===group.cleared),'Fort clear state drift');}
   else check(!group,'Cold Fort courtyard remained live');
   continue;
  }
 const space=state.spacesByInstanceId[f.spaceInstanceId],group=state.groupsById[f.interior.groupId],episode=state.d9World.episodes[f.interior.groupId],economy=state.encounterEconomy.groups[f.interior.groupId];
 check(space?.spaceId===f.interior.logicalSpaceId&&same(space.collision,f.interior.collision),'Functional site space drift');
 const size=functionalSiteDefinitionD10(f.packageId,f.packageVersion).template.encounter.members.length;
 check(group?.siteId===f.siteId&&group.spaceInstanceId===f.spaceInstanceId&&group.entityIds.length===size&&episode&&economy,'Functional site encounter drift');
 check(group.cleared===group.entityIds.every(id=>!state.entitiesById[id].alive),'Functional site clear/liveness mismatch');
 check((f.conqueredTick!==null)===group.cleared&&(!group.cleared||f.conqueredTick>=economy.clearedTick),'Functional site completion drift');
 const resources=state.d9World.runtime.resources.filter(r=>r.groupId===group.groupId);check(resources.length===1&&resources[0].kind==='chest'&&resources[0].completion===true&&resources[0].spaceInstanceId===f.spaceInstanceId,'Functional site reward drift');
 }
}
