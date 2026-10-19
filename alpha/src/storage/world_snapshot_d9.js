import {tavernSpaceIds} from '../shared/contracts/campaign_tavern_v1.js';
import {copyWire,freezeWire,closedRecord,canonicalStringify,requireContract as check,safeInteger} from '../shared/contracts/wire.js';
import {validateActivityState} from '../shared/contracts/activity_state.js';
import {verifyContentFingerprint} from '../shared/content/index.js';
import {D9_PROFILE} from '../shared/content/world_profile_d9.js';
import {generateChunkD9} from '../shared/generation/endless_world_d9.js';
import {planFunctionalSiteBootstrapD9,overlayFunctionalSiteBootstrapD9} from '../shared/generation/site_discovery_d9.js';
import {overlayWoodlandFortParcelD10} from '../shared/generation/woodland_fort_placement_d10.js';
import {overlayWoodlandCaveParcelD10} from '../shared/generation/woodland_cave_placement_d10.js';
import {overlayWoodlandCaveFamilyParcelsD12} from '../shared/generation/woodland_cave_family_placement_d12.js';
import {overlayWoodlandCaveFamilyParcelsD12_1,WOODLAND_CAVE_FAMILY_PARCEL_D12_1} from '../shared/generation/woodland_cave_family_placement_d12_1.js';
import {overlayWoodlandCaveFamilyParcelsD12_2,WOODLAND_CAVE_FAMILY_PARCEL_D12_2} from '../shared/generation/woodland_cave_region_placement_d12_2.js';
import {WOODLAND_CAVE_FAMILY_PACKAGE_ID} from '../shared/content/site_families_d12.js';
import {overlayWoodlandRuinExteriorD11_3_2} from '../shared/generation/woodland_ruin_exterior_d11_3_2.js';
import {worldDocument,validateWorldPublication,WORLD_PUBLICATION_VERSION} from './world_page_publication_d9.js';
import {pageDigest} from './paged_world_store.js';
import {validateId} from '../shared/contracts/identities.js';
import {verifyRemoteGearKnowledgeD9} from './world_gear_knowledge_d9.js';
import {readSiteBindingD9} from '../host/site_content_binding_d9.js';
import {migrateLegacyFunctionalSitesD10,functionalSitesD10,functionalSiteSpaceIdsD12} from '../shared/contracts/functional_site_d9.js';
const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);

// The immutable origin and each participant have separate content-addressed
// documents. Unchanged procedural terrain is regenerated from addresses rather
// than serialized again into every save.
export async function prepareWorldSnapshotD9(state,{sha256,previous=null,checkpointId,stagedPages=[]}){
 validateActivityState(state);check(state.d9World,'D9 state required');validateId('checkpointId',checkpointId);
 const revision=safeInteger((previous?.root.revision??0)+1,1),saveRevision=safeInteger(state.campaign.saveRevision+1,1);
 check(!previous||previous.root.campaignId===state.campaign.campaignId&&previous.root.profile===D9_PROFILE.version,'World save campaign/profile changed');
 check(saveRevision===state.d9World.migration.sourceSaveRevision+revision,'World/campaign save revisions differ');
 const pages=new Map(stagedPages.map(p=>[p.id,p]));
 const add=async value=>{const id=await pageDigest(value,sha256);pages.set(id,{id,value});return id;};
 const functionalIds=new Set([...functionalSitesD10(state).flatMap(functionalSiteSpaceIdsD12),...tavernSpaceIds(state)]),origin=worldDocument('origin',{version:'world-origin-static-d9-v1',content:copyWire(state.content),origin:copyWire(state.d9World.origin),collisions:Object.fromEntries(Object.entries(state.spacesByInstanceId).filter(([id])=>!functionalIds.has(id)).map(([id,s])=>[id,copyWire(id===state.overworldInstanceId?s.collision.origin:s.collision)]))});
 const originPage=await add(origin);check(!previous||previous.root.originPage===originPage,'Immutable historical origin changed');
 const participantPages={};for(const [id,p] of Object.entries(state.playersById))participantPages[id]=await add(worldDocument('participant',{version:'world-participant-cut-d9-v1',player:copyWire(p)}));
 const geometry=[];for(const c of state.d9World.runtime.chunks)geometry.push({chunkX:c.chunkX,chunkY:c.chunkY,digest:c.identity.digest,contentHash:await pageDigest(c,sha256)});
 const lean=copyWire({...state,content:null,playersById:null,spacesByInstanceId:Object.fromEntries(Object.entries(state.spacesByInstanceId).map(([id,s])=>[id,{...s,collision:id===state.overworldInstanceId?{...s.collision,origin:null,pages:[]}:functionalIds.has(id)?s.collision:null}])),d9World:{...state.d9World,origin:null,runtime:{...state.d9World.runtime,chunks:[]}}});
 Object.assign(lean.campaign,{saveRevision,checkpointId});
 const external=[state.d9World.regionIndex,state.d9World.discoveryIndex,state.d9World.deadlineIndex,state.d9World.content.index,state.d9World.ownershipIndex,state.d9World.groundIndex].filter(Boolean);
 const runtimePage=await add(worldDocument('runtime',{version:'world-runtime-cut-d9-v1',state:lean,participantPages,geometry},[originPage,...Object.values(participantPages),...external]));
 const root={version:WORLD_PUBLICATION_VERSION,campaignId:state.campaign.campaignId,revision,tick:state.tick,profile:D9_PROFILE.version,originPage,runtimePage,regions:state.d9World.regionIndex,knowledge:state.d9World.discoveryIndex,deadlines:state.d9World.deadlineIndex,content:state.d9World.content.index,ownership:state.d9World.ownershipIndex,ground:state.d9World.groundIndex,previous:previous?.id??null};
 validateWorldPublication(root);return {root,pages:[...pages.values()],expectedRoot:previous?.id??null};
}

export async function openWorldSnapshotD9(publication,{sha256,readPage,generatePlannedChunk=null}){
 const {root}=publication;validateWorldPublication(root);check(await pageDigest(root,sha256)===publication.id,'World root commitment mismatch');
 const read=async id=>{const v=await readPage(id);check(await pageDigest(v,sha256)===id,'World document commitment mismatch');return v;};
 const [origin,runtime]=await Promise.all([read(root.originPage),read(root.runtimePage)]);
 check(origin.kind==='origin'&&runtime.kind==='runtime'&&origin.payload.version==='world-origin-static-d9-v1'&&runtime.payload.version==='world-runtime-cut-d9-v1','World document kind/version mismatch');
 closedRecord(origin.payload,['version','content','origin','collisions']);closedRecord(runtime.payload,['version','state','participantPages','geometry']);
 const state=copyWire(runtime.payload.state);migrateLegacyFunctionalSitesD10(state.d9World);check(state.content===null&&state.playersById===null&&state.d9World.origin===null&&state.d9World.runtime.chunks.length===0,'Ambiguous packed state');
 check(state.tick===root.tick&&state.campaign.campaignId===root.campaignId&&state.campaign.saveRevision===state.d9World.migration.sourceSaveRevision+root.revision,'World root/cut identity mismatch');
 check(state.d9World.regionIndex===root.regions&&state.d9World.discoveryIndex===root.knowledge&&state.d9World.deadlineIndex===root.deadlines&&state.d9World.content.index===root.content&&state.d9World.ownershipIndex===root.ownership&&state.d9World.groundIndex===root.ground,'World page roots differ from exact cut');
 state.content=copyWire(origin.payload.content);state.d9World.origin=copyWire(origin.payload.origin);state.playersById={};
 check(same(Object.keys(runtime.payload.participantPages).sort(),state.session.playerIds),'Participant page inventory mismatch');
 for(const [id,ref] of Object.entries(runtime.payload.participantPages)){const page=await read(ref);check(page.kind==='participant'&&page.payload.version==='world-participant-cut-d9-v1'&&page.payload.player.playerId===id,'Participant page owner mismatch');state.playersById[id]=copyWire(page.payload.player);}
 const functionalIds=new Set([...functionalSitesD10(state).flatMap(functionalSiteSpaceIdsD12),...tavernSpaceIds(state)]);for(const [id,s] of Object.entries(state.spacesByInstanceId)){if(functionalIds.has(id)){check(s.collision&&origin.payload.collisions[id]===undefined,'Functional site collision must belong to runtime cut');continue;}check(origin.payload.collisions[id],'Missing historical collision');if(id===state.overworldInstanceId){check(s.collision.origin===null&&s.collision.pages.length===0,'Ambiguous collision pages');s.collision.origin=copyWire(origin.payload.collisions[id]);}else{check(s.collision===null,'Ambiguous interior collision');s.collision=copyWire(origin.payload.collisions[id]);}}
 const geometry=runtime.payload.geometry;check(Array.isArray(geometry)&&geometry.length<=100,'Hot geography page bound');const seen=new Set(),binding={originWidthChunks:state.d9World.origin.width/D9_PROFILE.chunkWidth,originHeightChunks:state.d9World.origin.height/D9_PROFILE.chunkHeight,egress:state.d9World.origin.egress};let bootstrapPlan=null;
 const reservations=Object.values(state.d9World.siteReservationsById??{}),ruin=reservations.find(r=>r.packageId==='woodland-overgrown-ruin'),fort=reservations.find(r=>r.packageId==='woodland-fort')?.parcel??null,cave=reservations.find(r=>r.packageId==='woodland-cave')?.parcel??null,caves=reservations.filter(r=>r.packageId===WOODLAND_CAVE_FAMILY_PACKAGE_ID).map(r=>r.parcel).sort((a,b)=>(a.regionKey??'').localeCompare(b.regionKey??'')||a.spawnOrdinal-b.spawnOrdinal);
  for(let i=0;i<geometry.length;i+=2){const batch=await Promise.all(geometry.slice(i,i+2).map(async g=>{closedRecord(g,['chunkX','chunkY','digest','contentHash']);const key=g.chunkX+','+g.chunkY;check(!seen.has(key),'Duplicate resident geography');seen.add(key);const generate=state.d9World.plannedWorld?(request=>{check(generatePlannedChunk,'Pinned planned generator unavailable');return generatePlannedChunk({...request,plannedWorld:state.d9World.plannedWorld});}):request=>generateChunkD9(request,sha256);const base=await generate({seed:state.campaign.seed.seedHex,chunkX:g.chunkX,chunkY:g.chunkY,origin:binding});check(base.identity.digest===g.digest,'Regenerated chunk identity/content mismatch');let chunk=base;if(await pageDigest(chunk,sha256)!==g.contentHash){check(!state.d9World.plannedWorld,'Pinned planned chunk content mismatch');bootstrapPlan??=ruin?Promise.resolve({bootstrap:ruin.socket.version==='site-socket-d9-bootstrap-v1'?ruin.socket:null}):planFunctionalSiteBootstrapD9({seed:state.campaign.seed.seedHex,origin:binding,maxRouteTiles:160},sha256);const bootstrap=await bootstrapPlan,historical=overlayWoodlandCaveParcelD10(overlayWoodlandFortParcelD10(overlayWoodlandRuinExteriorD11_3_2(overlayFunctionalSiteBootstrapD9(base,bootstrap),ruin?.socket??bootstrap),fort),cave),legacy=overlayWoodlandCaveFamilyParcelsD12(historical,caves.filter(parcel=>![WOODLAND_CAVE_FAMILY_PARCEL_D12_1,WOODLAND_CAVE_FAMILY_PARCEL_D12_2].includes(parcel.version))),modern=overlayWoodlandCaveFamilyParcelsD12_1(legacy,caves.filter(parcel=>parcel.version===WOODLAND_CAVE_FAMILY_PARCEL_D12_1));chunk=overlayWoodlandCaveFamilyParcelsD12_2(modern,caves.filter(parcel=>parcel.version===WOODLAND_CAVE_FAMILY_PARCEL_D12_2));}check(await pageDigest(chunk,sha256)===g.contentHash,'Regenerated chunk identity/content mismatch');return chunk;}));state.d9World.runtime.chunks.push(...batch.map(copyWire));}
 state.spacesByInstanceId[state.overworldInstanceId].collision.pages=state.d9World.runtime.chunks.map(c=>({chunkX:c.chunkX,chunkY:c.chunkY,tiles:[...c.collision.tiles]}));
 await verifyContentFingerprint(state.content,{sha256});validateActivityState(state);for(const site of functionalSitesD10(state)){const binding=await readSiteBindingD9(state.d9World.content,site.siteId,{sha256,readPage});check(binding&&binding.packageId===site.packageId&&binding.packageVersion===site.packageVersion&&binding.contentHash===site.contentHash,'Functional site binding/package mismatch');}await verifyRemoteGearKnowledgeD9(state,{sha256,readPage});return freezeWire(state);
}

