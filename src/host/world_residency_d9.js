import {hasWorldCombat} from '../shared/content/world_combat_v1.js';
import {woodlandPilotEventAlreadyAdmitted} from '../shared/generation/woodland_event_pilot_v3_7.js';
import {hasFerries} from '../shared/content/ferry_plan_v1.js';
import {PLANNED_CAVE_PARCEL} from '../shared/content/planned_cave_policy_v1.js';
import {collidesWithTiles} from '../shared/rules/world_geometry.js';
import {tavernSpaceIds} from '../shared/contracts/campaign_tavern_v1.js';
import {D9_RUNTIME_POLICY as B} from '../shared/content/world_runtime_policy_d9.js';
import {planLocalFramesD9} from '../shared/contracts/local_world_frames_d9.js';
import {rebaseWorldRuntimeD9} from '../shared/contracts/world_runtime_d9.js';
import {installGroundOccupancyD9} from '../shared/contracts/world_ground_occupancy_d9.js';
import {acknowledgeNavigationD9} from '../shared/contracts/world_navigation_d9.js';
import {D9_PROFILE as P} from '../shared/content/world_profile_d9.js';
import {participantWindowsD9,chunkAddressKey,localFramePositionD9,projectToLocalFrameD9} from '../shared/contracts/local_world_frames_d9.js';
import {regionAddress,floorDiv} from '../shared/contracts/world_address.js';
import {proceduralGroupDetachmentHomeD9} from '../shared/contracts/world_chunk_delta_d9.js';
import {applyWorldTransferPatchD9} from '../shared/contracts/world_patch_d9.js';
import {copyWire,requireContract as check} from '../shared/contracts/wire.js';
import {captureWorldStreamStateD9} from '../shared/contracts/world_stream_capture_d9.js';
import {overlayFunctionalSiteBootstrapD9} from '../shared/generation/site_discovery_d9.js';
import {overlayWoodlandFortParcelD10} from '../shared/generation/woodland_fort_placement_d10.js';
import {overlayWoodlandCaveParcelD10} from '../shared/generation/woodland_cave_placement_d10.js';
import {overlayWoodlandCaveFamilyParcelsD12} from '../shared/generation/woodland_cave_family_placement_d12.js';
import {overlayWoodlandCaveFamilyParcelsD12_1,WOODLAND_CAVE_FAMILY_PARCEL_D12_1} from '../shared/generation/woodland_cave_family_placement_d12_1.js';
import {overlayWoodlandCaveFamilyParcelsD12_2,WOODLAND_CAVE_FAMILY_PARCEL_D12_2} from '../shared/generation/woodland_cave_region_placement_d12_2.js';
import {WOODLAND_CAVE_FAMILY_PACKAGE_ID} from '../shared/content/site_families_d12.js';
import {functionalSiteForSpaceD12} from '../shared/contracts/functional_site_d9.js';
import {overlayWoodlandRuinExteriorD11_3_2} from '../shared/generation/woodland_ruin_exterior_d11_3_2.js';
import {firstInvalidActorGeometryD9} from '../shared/contracts/actor_geometry_d9.js';
// Legacy diagnosis marker: authority.readState()

export function actorFootprintPinsD9(s){
 const w=s.d9World,homes=new Map(w.runtime.groups.map(g=>[g.groupId,proceduralGroupDetachmentHomeD9(s,g.groupId)])),pinned=new Set(w.runtime.groups.filter(g=>!homes.get(g.groupId)).flatMap(g=>{const e=w.episodes[g.groupId];return e?[chunkAddressKey(e.geography.chunkX,e.geography.chunkY)]:[];}));
 // Only non-origin episodes are captured and detached with their home page.
 // Historical actors remain canonical even when standing wholly within it.
 const groupByActor=new Map(w.runtime.groups.flatMap(g=>g.members.map(m=>[m.entityId,g.groupId]))),homeOrigins=new Map([...homes].map(([id,h])=>[id,h?projectToLocalFrameD9({...h,localX:0,localY:0},w.runtime.frames):null]));
 for(const a of Object.values(s.entitiesById))if(a.residency.spaceInstanceId===s.overworldInstanceId){
  const home=homes.get(groupByActor.get(a.entityId)),pageableHome=home?chunkAddressKey(home.chunkX,home.chunkY):null,r=a.hullRadius,homeOrigin=homeOrigins.get(groupByActor.get(a.entityId));
  if(homeOrigin&&a.position.x-homeOrigin.x>=r&&a.position.x-homeOrigin.x<P.chunkWidth-r&&a.position.y-homeOrigin.y>=r&&a.position.y-homeOrigin.y<P.chunkHeight-r)continue;
  const center=localFramePositionD9(a.position,w.runtime.frames);
  if(pageableHome&&chunkAddressKey(center.chunkX,center.chunkY)===pageableHome&&center.localX>=r&&center.localX<P.chunkWidth-r&&center.localY>=r&&center.localY<P.chunkHeight-r)continue;
  for(const x of [a.position.x-r,a.position.x+r])for(const y of [a.position.y-r,a.position.y+r]){const q=localFramePositionD9({x,y},w.runtime.frames),key=chunkAddressKey(q.chunkX,q.chunkY),historical=BigInt(q.chunkX)>=0n&&BigInt(q.chunkY)>=0n&&BigInt(q.chunkX)<BigInt(w.origin.width/P.chunkWidth)&&BigInt(q.chunkY)<BigInt(w.origin.height/P.chunkHeight);if(key!==pageableHome&&!historical)pinned.add(key);}
 }
 // In-flight hostile geometry belongs to the authority window as well as its
 // source actor; it cannot cross into a page that residency just discarded.
 for(const b of Object.values(s.hostileCombat?.projectiles??{}))if(b.spaceInstanceId===s.overworldInstanceId){
  for(const x of [b.position.x-b.radius,b.position.x+b.radius])for(const y of [b.position.y-b.radius,b.position.y+b.radius]){const q=localFramePositionD9({x,y},w.runtime.frames),historical=BigInt(q.chunkX)>=0n&&BigInt(q.chunkY)>=0n&&BigInt(q.chunkX)<BigInt(w.origin.width/P.chunkWidth)&&BigInt(q.chunkY)<BigInt(w.origin.height/P.chunkHeight);if(!historical)pinned.add(chunkAddressKey(q.chunkX,q.chunkY));}
 }
 return pinned;
}

// One bounded preparation at a time. Chunk generation is pure cold work; the
// only live-state mutation is the guarded, synchronous authority handoff.
export function createWorldResidencyD9({authority,worker,pageBuffer,siteBootstrap=null,ruinSocket=null,fortParcel=null,caveParcel=null,caveParcels=[],record=()=>{},measure=(_name,fn)=>fn(),now=()=>Date.now()}){
 // Admit or release one chunk per live handoff. Preparing the transfer remains
 // asynchronous; this bound keeps the synchronous authority refresh below one
 // chunk of work instead of pairing an eviction with an admission in one frame.
 const LIVE_HANDOFF_CHUNKS=2,LIVE_EVICT_CHUNKS=2,parcelKeys=fortParcel?.pages.map(p=>chunkAddressKey(p.chunkX,p.chunkY))??[];
 const prepared=new Map(),evaluatedCaveRegions=new Set(caveParcels.filter(p=>p.version===WOODLAND_CAVE_FAMILY_PARCEL_D12_2).map(p=>p.regionKey));let reservationsDirty=false,busy=false,closed=false,error=null,generated=0,discarded=0,retries=0,running=null,destinationTarget=null,lastEncounterKey=null,encounterPendingKey=null,encounterPendingSinceTick=null,encounterOffers=0,encounterCompletions=0,encounterRetries=0,encounterLastLatencyTicks=0,encounterMaxLatencyTicks=0,urgentEncounterStreak=0,lastDeadlineTick=-60,lastGroundKey=null,lastCollectTick=-600,lastNavigationTick=-30,navigationPreparing=null,navigationOffers=0,navigationCompletions=0,navigationCoalesced=0,navigationRetries=0,navigationRowsPrepared=0,lastNavigationError=null,wantedAdmissions=0,lastWantedAdmissionTick=null,lastWantedAdmissionAt=null,wantedMissingSinceTick=null,progressState='idle',progressDetail=null;
 const borrow=fn=>authority.withAuthority(a=>a.withAuthorityState(fn));
 const staleWorkerGeometry=error=>{if(error?.code!=='WORLD_ACTOR_GEOMETRY_INVALID'&&!/Invalid canonical actor geometry/.test(error?.message??''))return false;const live=borrow(s=>firstInvalidActorGeometryD9(s,{mutation:'stale worker result live-state probe',phase:'residency integration'}));if(live)return false;retries++;progressState='retrying';progressDetail='stale-worker-geometry';record('world.residencyRetry',{reason:'stale-worker-geometry'});return true;};
 const capture=kind=>authority.captureStreamState?authority.captureStreamState(kind):measure('streamCapture',()=>borrow(s=>captureWorldStreamStateD9(s,kind)));
 function view(){return borrow(s=>{
   const w=s.d9World,origin={originWidthChunks:w.origin.width/P.chunkWidth,originHeightChunks:w.origin.height/P.chunkHeight,egress:copyWire(w.origin.egress)},players=Object.values(s.playersById).map(p=>({playerId:p.playerId,actor:s.entitiesById[p.entityId]})).flatMap(p=>{const site=functionalSiteForSpaceD12(s,p.actor.residency.spaceInstanceId),townInside=tavernSpaceIds(s).includes(p.actor.residency.spaceInstanceId),frontage=s.d9World.settlementInterior?.binding.frontage;return p.actor.residency.spaceInstanceId===s.overworldInstanceId?[{playerId:p.playerId,position:localFramePositionD9(p.actor.position,w.runtime.frames),intent:copyWire(p.actor.movementIntent)}]:townInside?[{playerId:p.playerId,position:{chunkX:String(1024+Math.floor(frontage.x/32)),chunkY:String(1024+Math.floor(frontage.y/26)),localX:(frontage.x%32+.5)*32,localY:(frontage.y%26+.5)*32},intent:{x:0,y:0}}]:site?[{playerId:p.playerId,position:copyWire(site.socket.entrance),intent:{x:0,y:0}}]:[];}),residencyPlayers=players.filter(p=>p.playerId!==destinationTarget?.departingPlayerId);if(destinationTarget)players.push({playerId:'destination-preparation',position:copyWire(destinationTarget.position),intent:{x:0,y:0}});
  const historical=a=>BigInt(a.chunkX)>=0n&&BigInt(a.chunkY)>=0n&&BigInt(a.chunkX)<BigInt(origin.originWidthChunks)&&BigInt(a.chunkY)<BigInt(origin.originHeightChunks),filter=rows=>new Map([...rows].filter(([,a])=>!historical(a)));
  const resident=new Map(w.runtime.chunks.map(c=>[chunkAddressKey(c.chunkX,c.chunkY),{chunkX:c.chunkX,chunkY:c.chunkY,id:c.identity.id}]));
  const pinned=actorFootprintPinsD9(s);if(parcelKeys.some(k=>pinned.has(k)))for(const k of parcelKeys)pinned.add(k);
  const approach=w.runtime.chunks.some(c=>c.anchors.some(anchor=>{const id='ordinary:'+anchor.id.split(':').at(-1);if(woodlandPilotEventAlreadyAdmitted(anchor,w.episodes[id]))return false;if(s.groupsById[id]&&!w.episodes[id]?.renewalEligible)return false;const q=projectToLocalFrameD9({chunkX:c.chunkX,chunkY:c.chunkY,localX:anchor.position.x,localY:anchor.position.y},w.runtime.frames);return q&&Object.values(s.playersById).some(p=>{const a=s.entitiesById[p.entityId];return a.alive&&a.residency.spaceInstanceId===s.overworldInstanceId&&Math.hypot(a.position.x-q.x,a.position.y-q.y)<=P.prepareRadius;});}));
  const encounterKey=w.runtime.revision+'/'+players.filter(p=>s.playersById[p.playerId]).map(p=>p.playerId+':'+p.position.chunkX+','+p.position.chunkY+','+Math.floor(p.position.localX/64)+','+Math.floor(p.position.localY/64)+','+s.playersById[p.playerId].inventory.revision).join('|');
  const ground=Boolean(w.groundIndex)||Object.values(s.playersById).some(p=>Object.keys(p.inventory.renewal.groundBySourceId).length),groundKey=w.groundIndex+'/'+Object.values(s.playersById).map(p=>{const a=s.entitiesById[p.entityId];return p.playerId+'/'+a.residency.spaceInstanceId+'/'+Math.floor(a.position.x/128)+','+Math.floor(a.position.y/128)+'/'+p.inventory.revision;}).join('|');
  const wanted=filter(participantWindowsD9(residencyPlayers)),preload=filter(participantWindowsD9(residencyPlayers,P.preloadRadiusChunks));if(destinationTarget)for(const address of destinationTarget.requiredChunks){if(historical(address))continue;const key=chunkAddressKey(address.chunkX,address.chunkY),row={chunkX:address.chunkX,chunkY:address.chunkY,distance:0};wanted.set(key,row);preload.set(key,row);}const reservations=w.plannedWorld?[]:Object.values(w.siteReservationsById??{}),familyParcels=reservations.filter(r=>r.packageId===WOODLAND_CAVE_FAMILY_PACKAGE_ID).map(r=>r.parcel),regionKeys=new Set((w.plannedWorld?[]:[...wanted.values()]).map(a=>{const r=regionAddress(a.chunkX,a.chunkY);return r.regionX+','+r.regionY;})),existingParcels=reservations.flatMap(r=>r.parcel?.tileX!==undefined?[copyWire(r.parcel)]:r.socket?[{tileX:String(BigInt(r.socket.entrance.chunkX)*32n+BigInt(Math.floor(r.socket.entrance.localX/32))-6n),tileY:String(BigInt(r.socket.entrance.chunkY)*26n+BigInt(Math.floor(r.socket.entrance.localY/32))-5n),width:12,height:10}]:[]);
  for(const window of [wanted,preload])if(parcelKeys.some(k=>window.has(k))){const distance=Math.min(...parcelKeys.map(k=>window.get(k)?.distance??Infinity));for(const p of fortParcel.pages){const k=chunkAddressKey(p.chunkX,p.chunkY);if(!window.has(k))window.set(k,{chunkX:p.chunkX,chunkY:p.chunkY,distance});}}
  return {plannedWorld:w.plannedWorld??null,navigation:w.navigation.pending.length,tick:s.tick,deadlines:w.deadlineIndex,ground,groundKey,seed:s.campaign.seed.seedHex,origin,players,resident,pinned,approach,encounterKey,wanted,preload,regionKeys,familyParcels,existingParcels,reviewPreparing:Boolean(destinationTarget)};
 });}
 const priority=(address,v)=>{let score=address.distance;for(const p of v.players){const dx=Number(BigInt(address.chunkX)-BigInt(p.position.chunkX))*P.chunkWidth+P.chunkWidth/2-p.position.localX,dy=Number(BigInt(address.chunkY)-BigInt(p.position.chunkY))*P.chunkHeight+P.chunkHeight/2-p.position.localY,length=Math.hypot(dx,dy),intent=Math.hypot(p.intent.x,p.intent.y);if(length&&intent)score=Math.min(score,address.distance-.45*Math.max(0,(dx*p.intent.x+dy*p.intent.y)/(length*intent)));}return score;};
 const observedView=()=>measure('residencyQuery',view);
 function cleanCache(v){for(const key of prepared.keys())if(!v.preload.has(key)||v.resident.has(key)){prepared.delete(key);discarded++;}}
 async function generate(address,v){const key=chunkAddressKey(address.chunkX,address.chunkY);if(prepared.has(key)||v.resident.has(key))return;
   const generatedChunk=await worker.generate({seed:v.seed,chunkX:address.chunkX,chunkY:address.chunkY,profile:P.version,origin:v.origin,...(v.plannedWorld?{plannedWorld:v.plannedWorld}:{})}),historical=overlayWoodlandCaveParcelD10(overlayWoodlandFortParcelD10(overlayWoodlandRuinExteriorD11_3_2(overlayFunctionalSiteBootstrapD9(generatedChunk,siteBootstrap),ruinSocket??siteBootstrap),fortParcel),caveParcel),legacy=overlayWoodlandCaveFamilyParcelsD12(historical,v.familyParcels.filter(parcel=>![WOODLAND_CAVE_FAMILY_PARCEL_D12_1,WOODLAND_CAVE_FAMILY_PARCEL_D12_2,PLANNED_CAVE_PARCEL].includes(parcel.version))),modern=overlayWoodlandCaveFamilyParcelsD12_1(legacy,v.familyParcels.filter(parcel=>parcel.version===WOODLAND_CAVE_FAMILY_PARCEL_D12_1)),chunk=overlayWoodlandCaveFamilyParcelsD12_2(modern,v.familyParcels.filter(parcel=>parcel.version===WOODLAND_CAVE_FAMILY_PARCEL_D12_2));generated++;
  const current=observedView();if(closed||!current.preload.has(key)||current.resident.has(key)){discarded++;return;}
  check(prepared.size<B.preparedChunks,'World prepared terrain bound');prepared.set(key,chunk);
 }
 async function prepareLocalEncounters(v){
  const requestedKey=v.encounterKey;if(encounterPendingKey!==requestedKey){encounterPendingKey=requestedKey;encounterPendingSinceTick=v.tick;}encounterOffers++;
  const result=await worker.prepareEncounters({state:capture('encounters')});if(closed)return false;
  try{authority.withReadyAuthority(a=>{a.withAuthorityState(s=>{applyWorldTransferPatchD9(s,result.patch);if(result.coverage)installGroundOccupancyD9(s,result.coverage);});if(result.patch.changes.length)a.refreshWorldResidency();});lastEncounterKey=requestedKey;encounterCompletions++;const finished=observedView().tick;encounterLastLatencyTicks=Math.max(0,finished-(encounterPendingSinceTick??finished));encounterMaxLatencyTicks=Math.max(encounterMaxLatencyTicks,encounterLastLatencyTicks);encounterPendingKey=null;encounterPendingSinceTick=null;return true;}
  catch(e){if(/changed|parent disappeared/.test(e.message)){retries++;encounterRetries++;return false;}throw e;}
 }
 async function run(){
  if(closed||busy||error||authority.getStatus().phase!=='ready')return false;busy=true;
  try{
   authority.withReadyAuthority(a=>{let changed=false;a.withAuthorityState(s=>{
     const w=s.d9World,players=Object.values(s.playersById).flatMap(p=>{const a=s.entitiesById[p.entityId],site=functionalSiteForSpaceD12(s,a.residency.spaceInstanceId),townInside=tavernSpaceIds(s).includes(a.residency.spaceInstanceId),frontage=w.settlementInterior?.binding.frontage;return a.residency.spaceInstanceId===s.overworldInstanceId?[{playerId:p.playerId,position:localFramePositionD9(a.position,w.runtime.frames)}]:townInside?[{playerId:p.playerId,position:{chunkX:String(1024+Math.floor(frontage.x/32)),chunkY:String(1024+Math.floor(frontage.y/26)),localX:(frontage.x%32+.5)*32,localY:(frontage.y%26+.5)*32},intent:{x:0,y:0}}]:site?[{playerId:p.playerId,position:copyWire(site.socket.entrance)}]:[];});if(destinationTarget)players.push({playerId:'destination-preparation',position:copyWire(destinationTarget.position)});const planned=copyWire(planLocalFramesD9(destinationTarget&&!hasFerries(w.plannedWorld)?[...new Map(players.map(p=>[p.position.chunkX+','+p.position.chunkY,p])).values()]:players,{keepOrigin:true,preparationAnchor:Boolean(destinationTarget&&hasFerries(w.plannedWorld))}));
    planned[0].originBounds={width:w.origin.width/P.chunkWidth,height:w.origin.height/P.chunkHeight};
    for(let i=1;i<planned.length;i++){const n=planned[i],old=w.runtime.frames.find(f=>f.id===n.id&&JSON.stringify(f.playerIds)===JSON.stringify(n.playerIds));if(old&&players.filter(p=>n.playerIds.includes(p.playerId)).every(p=>{const dx=BigInt(p.position.chunkX)-BigInt(old.chunkX),dy=BigInt(p.position.chunkY)-BigInt(old.chunkY);return dx>=-8n&&dx<=8n&&dy>=-8n&&dy<=8n;})){n.chunkX=old.chunkX;n.chunkY=old.chunkY;}}
    if(JSON.stringify(planned)!==JSON.stringify(w.runtime.frames)){
     // A departed participant's old frame may still hold evictable receipts or
     // a pinned projectile. Drain those normally before dropping that frame.
     try{rebaseWorldRuntimeD9(s,planned);changed=true;}catch(e){if(e.message!=='Live geometry outside new admitted frame')throw e;}
    }
   });if(changed)a.refreshWorldResidency();});
   let v=observedView();cleanCache(v);for(const p of v.familyParcels)if(p.version===WOODLAND_CAVE_FAMILY_PARCEL_D12_2)evaluatedCaveRegions.add(p.regionKey);
    const regional=!v.plannedWorld&&!v.reviewPreparing&&[...v.regionKeys].sort().find(k=>!evaluatedCaveRegions.has(k));if(regional&&worker.siteRegionReservations){const [regionX,regionY]=regional.split(','),plan=await worker.siteRegionReservations({seed:v.seed,origin:v.origin,regionX,regionY,existingParcels:v.existingParcels,guarantee:false});if(closed)return false;evaluatedCaveRegions.add(regional);if(plan.parcels.length){authority.withReadyAuthority(a=>{let changed=false;a.withAuthorityState(s=>{for(const parcel of plan.parcels){const prior=s.d9World.siteReservationsById[parcel.siteId];if(prior){check(JSON.stringify(prior.parcel)===JSON.stringify(parcel),'Regional Cave reservation identity drift');continue;}s.d9World.siteReservationsById[parcel.siteId]={version:'site-reservation-d12-2-v1',siteId:parcel.siteId,packageId:WOODLAND_CAVE_FAMILY_PACKAGE_ID,socket:copyWire(parcel.socket),parcel:copyWire(parcel)};changed=true;}if(changed)s.d9World.runtime.revision++;});if(changed)a.refreshWorldResidency();});reservationsDirty=true;prepared.clear();progressState='region-reserved';progressDetail=regional;record('world.caveRegionReserved',{regionKey:regional,count:plan.parcels.length});return false;}}
   // Geometry at the live movement window wins one bounded turn over map and
   // cold maintenance work. Unknown pages are intentionally solid, so letting
    // those auxiliary jobs run first exposed a temporary, visible world edge.
    const urgentWanted=[...v.wanted].some(([key])=>!v.resident.has(key));
    if(urgentWanted){if(wantedMissingSinceTick===null)wantedMissingSinceTick=v.tick;progressState='wanted';progressDetail='preparing';}
    else{wantedMissingSinceTick=null;urgentEncounterStreak=0;if(progressState==='wanted'||progressState==='admitted')progressState='ready';}
    // Save pressure pauses auxiliary page-producing work, but it must never
    // prevent pure generation or an admission that does not evict live state.
    if(!urgentWanted&&pageBuffer.resources().dirtyPages>B.flushPages){progressState='awaiting-save';progressDetail='dirty-page-pressure';return false;}
    // Encounter anchors considered here are already in live resident chunks.
    // Service their bounded Worker handoff before cold generation, eviction,
    // ground projection, navigation, or deadline maintenance. Continuous
    // travel can therefore delay none of the nearby participants indefinitely.
    if(v.approach&&v.encounterKey!==lastEncounterKey&&worker.prepareEncounters&&(!urgentWanted||urgentEncounterStreak<2)){await prepareLocalEncounters(v);if(urgentWanted)urgentEncounterStreak++;return false;}
    if(urgentWanted)urgentEncounterStreak=0;
    if(!v.approach){encounterPendingKey=null;encounterPendingSinceTick=null;}
    if(!urgentWanted&&v.navigation&&v.tick-lastNavigationTick>=30&&worker.prepareNavigation){await syncNavigation();lastNavigationTick=v.tick;v=observedView();if(pageBuffer.resources().dirtyPages>B.flushPages)return false;}
   if(!urgentWanted&&v.deadlines&&v.tick-lastDeadlineTick>=60&&worker.prepareDeadlines){
    const stagedPages=pageBuffer.capture(),result=await worker.prepareDeadlines({state:capture('deadlines'),stagedPages});if(closed)return false;const installPages=pageBuffer.prepareStageDelta(result.pages,stagedPages);
    try{authority.withReadyAuthority(a=>{a.withAuthorityState(s=>{applyWorldTransferPatchD9(s,result.patch);if(result.coverage)installGroundOccupancyD9(s,result.coverage);});installPages();if(result.patch.changes.length)a.refreshWorldResidency();});lastDeadlineTick=result.more?v.tick-60:v.tick;}
    catch(e){if(/changed|parent disappeared/.test(e.message)){retries++;return false;}throw e;}return false;
   }
   const missing=[...v.wanted].filter(([key])=>!v.resident.has(key)&&!prepared.has(key)).map(([,a])=>a).sort((a,b)=>priority(a,v)-priority(b,v)||a.distance-b.distance).slice(0,B.generationBatch);
   if(missing.length)await Promise.all(missing.map(a=>generate(a,v)));
   if(closed)return false;v=observedView();cleanCache(v);
   const candidates=[...v.wanted].filter(([key])=>!v.resident.has(key)&&prepared.has(key)).sort((a,b)=>priority(a[1],v)-priority(b[1],v)||a[1].distance-b[1].distance),free=Math.max(0,B.residentChunks-v.resident.size),evictable=[...v.resident].filter(([key])=>!v.wanted.has(key)&&!v.pinned.has(key)),parcelWanted=parcelKeys.some(k=>v.wanted.has(k)),parcelResident=parcelKeys.filter(k=>v.resident.has(k)),parcelMissing=parcelKeys.filter(k=>!v.resident.has(k));
   let release=[],admit=[];
   if(parcelWanted&&parcelMissing.length){
    // A compound is one admission. Until every page is prepared, the unknown
    // collision edge remains solid; no partial wall can become visible.
    if(parcelMissing.every(k=>prepared.has(k))){
     const need=Math.max(0,parcelMissing.length-free),other=evictable.filter(([k])=>!parcelKeys.includes(k));
     release=other.slice(0,need).map(([,c])=>c.id);
     if(release.length===need)admit=parcelMissing.map(k=>prepared.get(k));else release=[];
    }
   }else{
    const ordinaryCandidates=candidates.filter(([k])=>!parcelKeys.includes(k)),need=Math.max(0,Math.min(ordinaryCandidates.length,LIVE_HANDOFF_CHUNKS)-free),other=evictable.filter(([k])=>!parcelKeys.includes(k));
    release=other.slice(0,Math.min(B.evictChunks,LIVE_EVICT_CHUNKS,ordinaryCandidates.length?need:pageBuffer.resources().dirtyPages>B.flushPages?0:LIVE_EVICT_CHUNKS)).map(([,c])=>c.id);
    if(!release.length&&parcelResident.length===parcelKeys.length&&parcelKeys.every(k=>evictable.some(([id])=>id===k))&&(need>0||!ordinaryCandidates.length&&pageBuffer.resources().dirtyPages<=B.flushPages))release=parcelKeys.map(k=>v.resident.get(k).id);
    // Keep the normal one/two-page handoff cadence outside a Fort parcel.
    admit=ordinaryCandidates.slice(0,Math.min(free+release.length,B.handoffChunks-release.length,LIVE_HANDOFF_CHUNKS)).map(([k])=>prepared.get(k));
   }
   if(release.length||admit.length){
    // Flush well before the hard handoff bound. A failed save never authorizes
    // forgetting dirty pages or replacing the last confirmed campaign root.
    if(pageBuffer.resources().dirtyPages>B.flushPages&&release.length){progressState='awaiting-save';progressDetail='eviction-requires-durable-cut';return false;}
    const snapshot=capture('residency'),stagedPages=pageBuffer.capture(),result=await worker.prepareResidency({state:snapshot,release,admit,stagedPages});
    if(closed)return false;const current=observedView();
    if(release.some(id=>[...current.resident].some(([key,c])=>c.id===id&&(current.wanted.has(key)||current.pinned.has(key))))||admit.some(c=>!current.wanted.has(chunkAddressKey(c.chunkX,c.chunkY)))){retries++;return false;}
    const installPages=pageBuffer.prepareStageDelta(result.pages,stagedPages);
    try{measure('residencyIntegration',()=>authority.withReadyAuthority(a=>{
     measure('residencyPatchApply',()=>a.withAuthorityState(s=>{applyWorldTransferPatchD9(s,result.patch);if(result.coverage)installGroundOccupancyD9(s,result.coverage);}));
     measure('residencyPageInstall',()=>installPages());
     measure('residencyAuthorityRefresh',()=>a.refreshWorldResidency());
    }));}
    catch(e){if(e.code==='WORLD_TRANSFER_STALE'||/changed|pins a prepared eviction|parent disappeared/.test(e.message)){retries++;return false;}if(staleWorkerGeometry(e))return false;throw e;}
    for(const c of admit)prepared.delete(chunkAddressKey(c.chunkX,c.chunkY));if(admit.length){wantedAdmissions+=admit.length;lastWantedAdmissionTick=observedView().tick;lastWantedAdmissionAt=now();progressState='admitted';progressDetail=admit.map(c=>chunkAddressKey(c.chunkX,c.chunkY)).join('|');}record('world.residencyApplied',{admitted:admit.length,released:release.length});
   }else if(v.ground&&v.groundKey!==lastGroundKey&&worker.prepareGround&&pageBuffer.resources().dirtyPages<=B.flushPages){
    const stagedPages=pageBuffer.capture(),result=await worker.prepareGround({state:capture('ground'),stagedPages});if(closed)return false;const installPages=pageBuffer.prepareStageDelta(result.pages,stagedPages);
    try{authority.withReadyAuthority(a=>{a.withAuthorityState(s=>{applyWorldTransferPatchD9(s,result.patch);if(result.coverage)installGroundOccupancyD9(s,result.coverage);});installPages();if(result.patch.changes.length)a.refreshWorldResidency();});lastGroundKey=result.more?null:v.groundKey;}
    catch(e){if(/changed|parent disappeared/.test(e.message)){retries++;return false;}throw e;}
   }else{
    const ahead=pageBuffer.resources().dirtyPages>B.flushPages?[]:[...v.preload].filter(([key])=>!v.resident.has(key)&&!prepared.has(key)).map(([,a])=>a).sort((a,b)=>priority(a,v)-priority(b,v)||a.distance-b.distance).slice(0,B.generationBatch);
    if(ahead.length)await Promise.all(ahead.map(a=>generate(a,v)));
    else if(worker.collect&&v.tick-lastCollectTick>=600){try{await worker.collect();}catch(e){record('world.maintenanceError',{message:e.message});}lastCollectTick=v.tick;}
   }
   v=observedView();const ready=[...v.wanted.keys()].every(key=>v.resident.has(key));if(ready){wantedMissingSinceTick=null;progressState='ready';progressDetail=null;}return ready;
   }catch(e){if(/pending page buffer needs a save/.test(e.message)){progressState='awaiting-save';progressDetail='hard-page-capacity';return false;}if(staleWorkerGeometry(e))return false;error=e;record('world.residencyError',{message:e.message,code:e.code??null});return false;}finally{busy=false;}
 }
 function pump(){if(running)return running;running=run().finally(()=>{running=null;});return running;}
 async function syncNavigation(){
  const request=borrow(s=>({root:s.d9World.discoveryIndex,navigation:copyWire(s.d9World.navigation),stagedPages:pageBuffer.capture()})),key=String(request.root)+'/'+request.navigation.revision+'/'+request.navigation.pending.length;
  if(navigationPreparing?.key===key){navigationCoalesced++;return navigationPreparing.promise;}
  navigationOffers++;const promise=(async()=>{try{const result=await worker.prepareNavigation(request);if(closed)return false;const install=pageBuffer.prepareStage(result.pages);authority.withReadyAuthority(a=>a.withAuthorityState(s=>{acknowledgeNavigationD9(s,result);install();}));navigationCompletions++;navigationRowsPrepared+=result.rows.length;lastNavigationError=null;return true;}catch(e){navigationRetries++;lastNavigationError=e.message;if(/changed|pending page buffer/.test(e.message))return false;throw e;}finally{if(navigationPreparing?.key===key)navigationPreparing=null;}})();navigationPreparing={key,promise};return promise;
 }
 async function warmGround(){
  if(!worker.prepareGround)return;const stagedPages=pageBuffer.capture(),result=await worker.prepareGround({state:capture('ground'),stagedPages}),install=pageBuffer.prepareStageDelta(result.pages,stagedPages);
  authority.withReadyAuthority(a=>{a.withAuthorityState(s=>{applyWorldTransferPatchD9(s,result.patch);installGroundOccupancyD9(s,result.coverage);});install();if(result.patch.changes.length)a.refreshWorldResidency();});
 }
 async function syncPages(){
  if(running)await running;check(!closed&&!error&&authority.getStatus().phase==='ready','World residency cannot prepare a save');busy=true;
  try{
   // The pending observations are retained in the immutable cut. Above the
   // soft flush threshold, commit the existing pages first so navigation
   // preparation cannot fill the remaining hard-cap headroom.
   if(worker.prepareNavigation&&view().navigation&&pageBuffer.resources().dirtyPages<=B.flushPages&&!await syncNavigation())return false;
   const flushFirst=pageBuffer.resources().dirtyPages>B.flushPages&&borrow(s=>Object.values(s.playersById).every(p=>s.d9World.paging.indexedRevisions[p.playerId]===p.inventory.revision));
   if(flushFirst)return true;
   const stagedPages=pageBuffer.capture(),result=await worker.prepareResidency({state:capture('residency'),stagedPages}),installPages=pageBuffer.prepareStageDelta(result.pages,stagedPages);
   try{authority.withReadyAuthority(a=>{a.withAuthorityState(s=>{applyWorldTransferPatchD9(s,result.patch);if(result.coverage)installGroundOccupancyD9(s,result.coverage);});installPages();if(result.patch.changes.length)a.refreshWorldResidency();});return true;}
   catch(e){if(/changed|parent disappeared/.test(e.message)){retries++;return false;}if(staleWorkerGeometry(e))return false;throw e;}
   }catch(e){if(staleWorkerGeometry(e))return false;throw e;}finally{busy=false;}
  }
 async function prime(){for(let attempt=0;attempt<B.preparedChunks&&!closed&&!error;attempt++){await pump();const v=observedView();if(!error&&[...v.wanted.keys()].every(key=>v.resident.has(key))&&(!v.approach||hasWorldCombat(v.plannedWorld)))return true;}return false;}
 async function prepareWorldPosition(position){check(!closed&&!error&&!destinationTarget,'World destination preparation unavailable');const ready=borrow(s=>{const p=projectToLocalFrameD9(position,s.d9World.runtime.frames),collision=s.spacesByInstanceId[s.overworldInstanceId].collision;return p&&Object.values(s.playersById).every(v=>!collidesWithTiles(collision,p.x,p.y,s.entitiesById[v.entityId].hullRadius));});if(ready)return true;return prepareDestinationPosition(position);}
 async function prepareDestinationPosition(position,requiredChunks=[{chunkX:position.chunkX,chunkY:position.chunkY}],departingPlayerId=null){check(!closed&&!error&&!destinationTarget&&requiredChunks.length>0,'Destination residency preparation already active');check(departingPlayerId===null||borrow(s=>hasFerries(s.d9World.plannedWorld)&&s.playersById[departingPlayerId]),'Unknown departing participant');destinationTarget={position:copyWire(position),requiredChunks:copyWire(requiredChunks),departingPlayerId};for(let attempt=0;attempt<B.preparedChunks;attempt++){await pump();const v=observedView(),historical=address=>BigInt(address.chunkX)>=0n&&BigInt(address.chunkY)>=0n&&BigInt(address.chunkX)<BigInt(v.origin.originWidthChunks)&&BigInt(address.chunkY)<BigInt(v.origin.originHeightChunks);if(destinationTarget.requiredChunks.every(address=>historical(address)||v.resident.has(chunkAddressKey(address.chunkX,address.chunkY))))return true;}destinationTarget=null;throw new Error('Destination residency could not become ready within the deterministic preparation budget');}
 function finishDestinationPosition(){destinationTarget=null;}
 return Object.freeze({pump,prime,prepareTravelPosition:prepareDestinationPosition,finishTravelPosition:finishDestinationPosition,prepareWorldPosition,prepareReviewPosition:prepareDestinationPosition,finishReviewPosition:finishDestinationPosition,syncPages,warmGround,acknowledgeSave(){reservationsDirty=false;},resume(){if(error&&staleWorkerGeometry(error))error=null;progressState='resume';progressDetail='wanted-window-recheck';return pump();},mapWindow:request=>{const snapshot=borrow(s=>({root:s.d9World.discoveryIndex,stagedPages:pageBuffer.capture()}));return worker.mapWindow({...request,...snapshot});},settled:()=>running??Promise.resolve(),failure:()=>error,inspect:()=>{const v=observedView(),wantedMissing=[...v.wanted.keys()].filter(k=>!v.resident.has(k)),page=pageBuffer.resources(),at=now();return {busy,closed,error:error?.message??null,errorCode:error?.code??null,errorStack:error?.stack??null,generated,discarded,retries,prepared:prepared.size,preparedKeys:[...prepared.keys()],wantedKeys:[...v.wanted.keys()],wantedMissing,wantedReady:wantedMissing.length===0,wantedMissingSinceTick,wantedAdmissions,lastWantedAdmissionTick,timeSinceWantedAdmissionMs:lastWantedAdmissionAt===null?null:Math.max(0,at-lastWantedAdmissionAt),progressState,progressDetail,reviewPreparing:v.reviewPreparing,interactionReady:!v.approach||hasWorldCombat(v.plannedWorld),navigationPreparation:{pendingRows:v.navigation,inFlight:Boolean(navigationPreparing),offers:navigationOffers,completions:navigationCompletions,coalesced:navigationCoalesced,retries:navigationRetries,rowsPrepared:navigationRowsPrepared,lastError:lastNavigationError},encounterPreparation:{approachPending:v.approach,blocksInitialReadiness:v.approach&&!hasWorldCombat(v.plannedWorld),pending:Boolean(v.approach&&v.encounterKey!==lastEncounterKey),offers:encounterOffers,completions:encounterCompletions,retries:encounterRetries,lastLatencyTicks:encounterLastLatencyTicks,maxLatencyTicks:encounterMaxLatencyTicks,pendingSinceTick:encounterPendingSinceTick},needsSave:reservationsDirty||page.dirtyPages>B.flushPages,regionalReservations:{evaluated:evaluatedCaveRegions.size,dirty:reservationsDirty},pagePressure:{dirtyPages:page.dirtyPages,flushPages:B.flushPages,capacity:page.capacity,oldestDirtyPageAgeMs:page.oldestDirtyPageAgeMs},resident:v.resident.size,residentKeys:[...v.resident.keys()]};},close(){closed=true;destinationTarget=null;prepared.clear();}});
}
