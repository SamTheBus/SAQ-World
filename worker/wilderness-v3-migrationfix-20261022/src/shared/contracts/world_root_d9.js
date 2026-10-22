import {D9_RUNTIME_POLICY} from '../content/world_runtime_policy_d9.js';
import {emptyNavigationD9,validateNavigationD9} from './world_navigation_contract_d9.js';
import {D9_PROFILE} from '../content/world_profile_d9.js';
import {validateActivityState,compileBoundOverworld} from './activity_state.js';
import {manifestForState} from './overworld.js';
import {copyWire,canonicalStringify,freezeWire,requireContract as check,closedRecord} from './wire.js';
import {hashBytes,utf8,bytesToHex} from './hashing.js';
import {originEgress,applyOriginEgress} from './origin_egress_d9.js';
import {legacyWorldPosition} from './world_address.js';
import {d9ProgressionAtXp} from './hero_progression_d9.js';
import {migrateD9Participant} from './participant_progression_d9.js';
import {economicResources} from './encounter_economy.js';
import {D9_COLLISION_VERSION} from './paged_collision_d9.js';
import {validateWorldPosition} from './world_address.js';
import {historicalSiteContentD9,validateSiteContentRootD9} from './site_content_d9.js';
import {installSiteRunEpisodesD13B} from './site_run_episode_d13b.js';
import {emptyWorldPagingD9,validateWorldPagingD9} from './world_paging_d9.js';
import {D9_ROOT_VERSION} from './world_root_contract_d9.js';
export {D9_ROOT_VERSION,validateD9Root} from './world_root_contract_d9.js';
export async function prepareD9OriginMigration(state,{sha256}){
 validateActivityState(state);check(!state.d9World,'World already migrated');const m=manifestForState(state),collision=compileBoundOverworld(state).collision,hash=bytesToHex(await hashBytes(utf8(canonicalStringify(m)),sha256)),overlay=originEgress(m,collision,economicResources(state,m));
 const positions={};for(const a of Object.values(state.entitiesById))if(a.residency.spaceInstanceId===state.overworldInstanceId)positions[a.entityId]=legacyWorldPosition(a.position);
 const next=copyWire(state);for(const p of Object.values(next.playersById)){p.progression=copyWire(d9ProgressionAtXp(p.progression.totalXp));p.d8=migrateD9Participant(p.d8);}
 const aliases={};for(const ch of m.chunks){const id=ch.chunkId??ch.areaId;check(id,'Missing legacy chunk identity');aliases[id]={chunkX:String(ch.origin.x/D9_PROFILE.chunkWidth),chunkY:String(ch.origin.y/D9_PROFILE.chunkHeight)};}
 const frames=[{id:0,chunkX:'0',chunkY:'0',offsetX:0,offsetY:0,playerIds:[],originBounds:{width:m.dimensions.width/D9_PROFILE.chunkWidth,height:m.dimensions.height/D9_PROFILE.chunkHeight}}];
 next.d9World={version:D9_ROOT_VERSION,profile:copyWire(D9_PROFILE),origin:{manifestHash:hash,width:m.dimensions.width,height:m.dimensions.height,chunkAliases:aliases,egress:copyWire(overlay),resources:copyWire(economicResources(state,m))},positions,frame:{chunkX:'0',chunkY:'0'},regionIndex:null,discoveryIndex:null,deadlineIndex:null,migration:{version:'origin-migration-d9-v1',tick:state.tick,sourceSaveRevision:state.campaign.saveRevision},runtime:{revision:0,frames:copyWire(frames),chunks:[],groups:[],resources:[]},episodes:{},functionalSitesById:{},siteReservationsById:{}};
 next.spacesByInstanceId[next.overworldInstanceId].collision={version:D9_COLLISION_VERSION,tileSize:32,width:20480,height:3328,origin:copyWire(applyOriginEgress(collision,overlay)),frames:copyWire(frames),pages:[]};
 next.d9World.runtimePolicy=D9_RUNTIME_POLICY.version;
 next.d9World.navigation=emptyNavigationD9();
 // D8 knowledge was campaign-shared. Preserve already-known labels for each
 // migrated participant, without inventing explored terrain around them.
 const discovery=state.campaign.overworld.discovery,marks=m.sites.filter(s=>discovery.discoveredSiteIds?.includes(s.locationId)).map(s=>({id:s.locationId,label:s.properName??s.label,kind:'site',position:s.position}));
 for(const s of m.settlements)if(discovery.discoveredSettlementIds?.includes(s.discoveryId)&&s.home)marks.push({id:s.settlementId,label:s.label,kind:'settlement',position:m.start.position});
 for(const playerId of next.session.playerIds){const rows=new Map();for(const mark of marks){const a=legacyWorldPosition(mark.position),key=a.chunkX+','+a.chunkY;let row=rows.get(key);if(!row){row={playerId,spaceInstanceId:next.overworldInstanceId,chunkX:a.chunkX,chunkY:a.chunkY,tiles:'?'.repeat(832),region:null,markers:[]};rows.set(key,row);}row.markers.push({id:mark.id,label:mark.label,kind:mark.kind,x:a.localX,y:a.localY});}next.d9World.navigation.pending.push(...rows.values());}
 next.d9World.content=historicalSiteContentD9(m,hash);
 next.d9World.paging=emptyWorldPagingD9(next.session.playerIds);next.d9World.ownershipIndex=null;next.d9World.groundIndex=null;installSiteRunEpisodesD13B(next,{inferHistory:true});
 return {state:next,originManifest:freezeWire(m),modifiedBorderCells:overlay.openings.flatMap(o=>o.cells.map(c=>({side:o.side,...c})))};
}
