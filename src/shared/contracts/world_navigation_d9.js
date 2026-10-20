import {FERRY_NETWORK,hasFerries} from '../content/ferry_plan_v1.js';
import {D9_RUNTIME_POLICY as B} from '../content/world_runtime_policy_d9.js';
import {revealRadiusD9,navigationIdentityD9} from './world_navigation_contract_d9.js';
export {NAVIGATION_D9,emptyNavigationD9,revealRadiusD9,navigationIdentityD9,validateNavigationD9} from './world_navigation_contract_d9.js';
import {localFramePositionD9} from './local_world_frames_d9.js';
import {floorDiv,addressWire,validateWorldPosition} from './world_address.js';
import {compileBoundOverworld} from './activity_state.js';
import {originManifestForState} from './overworld.js';
import {resolvePlayerStats} from './player_stats.js';
import {progressionBigInt} from './progression_integer.js';
import {copyWire,closedRecord,requireContract as check,safeInteger} from './wire.js';
import {WOODLAND_FORT_PACKAGE_ID} from '../content/woodland_fort_d10.js';
import {resolveSiteTruthD12_4C} from './site_truth_d12_4c.js';

const observations=new WeakMap(),known=new WeakMap(),radii=new WeakMap(),compiledOrigins=new WeakMap();
function originGeometry(state,manifest){let c=compiledOrigins.get(manifest);if(!c){c=compileBoundOverworld(state);compiledOrigins.set(manifest,c);}return c;}
function participantRadius(p){const key=(p.inventory?.revision??0)+'/'+(p.d8?.revision??0);let prior=radii.get(p);if(prior?.key!==key){prior={key,value:revealRadiusD9(resolvePlayerStats(p).attributes?.int??5)};radii.set(p,prior);}return prior.value;}

// Finding the Ruin grants only that participant a durable Fort trail marker.
// It reveals the reserved destination, not intervening terrain or other sites.
export function revealReservedFortGuidanceD10(state,playerId){
 const player=state.playersById[playerId],fort=Object.values(state.d9World.siteReservationsById??{}).find(r=>r.packageId===WOODLAND_FORT_PACKAGE_ID);
 if(!player||!fort)return false;const a=fort.socket.entrance,row={playerId,spaceInstanceId:state.overworldInstanceId,chunkX:a.chunkX,chunkY:a.chunkY,tiles:'?'.repeat(832),region:null,markers:[{id:fort.siteId,label:'Woodland Fort trail',kind:'site',x:a.localX,y:a.localY}]},id=navigationIdentityD9(row),old=state.d9World.navigation.pending.find(r=>navigationIdentityD9(r)===id);
 if(old?.markers.some(m=>m.id===fort.siteId))return false;
 if(old)old.markers.push(row.markers[0]);else state.d9World.navigation.pending.push(row);
 check(state.d9World.navigation.pending.length<=B.navigationPendingPages,'Fort guidance requires navigation preparation');state.d9World.navigation.revision++;return true;
}
// Source: Dungeon dungeon_map.js:741. Circular 12..18 tile reveal, no LOS.
// Only physically admitted geometry is observed; neither maps nor generators call this.
export function revealNavigationD9(state){
 const w=state.d9World;if(!w)return false;const nav=w.navigation,prior=observations.get(state)??new Map(),nextKeys=new Map(),participants=[];
 for(const p of Object.values(state.playersById)){
  const a=state.entitiesById[p.entityId];if(!a.alive||a.residency.spaceInstanceId!==state.overworldInstanceId)continue;
  const center=localFramePositionD9(a.position,w.runtime.frames),radius=participantRadius(p),tx=BigInt(center.chunkX)*32n+BigInt(Math.floor(center.localX/32)),ty=BigInt(center.chunkY)*26n+BigInt(Math.floor(center.localY/32)),key=JSON.stringify([tx.toString(),ty.toString(),radius,w.runtime.revision]);nextKeys.set(p.playerId,key);participants.push({p,tx,ty,radius,key});
 }
 if(participants.every(({p,key})=>prior.get(p.playerId)===key)&&prior.size===nextKeys.size)return false;
 const manifest=originManifestForState(state),origin=originGeometry(state,manifest),siteTruth=resolveSiteTruthD12_4C(state,{includeFinaleDiagnostics:false}),pending=new Map(nav.pending.map(r=>[navigationIdentityD9(r),r]));let changed=false;
 const chunks=new Map(w.runtime.chunks.map(c=>[c.chunkX+','+c.chunkY,c])),originChunks=new Set(manifest.chunks.map(c=>(c.origin.x/1024)+','+(c.origin.y/832))),markCache=new Map(),remembered=known.get(state)??new Map();known.set(state,remembered);
 for(const {p,tx,ty,radius,key} of participants){
  if(prior.get(p.playerId)===key)continue;
  const edits=new Map();
  for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
   if(dx*dx+dy*dy>radius*radius)continue;const x=tx+BigInt(dx),y=ty+BigInt(dy),cx=floorDiv(x,32n),cy=floorDiv(y,26n),lx=Number(x-cx*32n),ly=Number(y-cy*26n),chunkX=addressWire(cx),chunkY=addressWire(cy);
   const chunk=chunks.get(chunkX+','+chunkY);let tile,biome='o',region=null;
   if(chunk){tile=chunk.visual.terrain[ly][lx];biome=chunk.visual.biomes?.[ly]?.[lx]??{woodland:'w','rocky-uplands':'r',marsh:'m'}[chunk.region.biome];region=chunk.region;}
   else if(originChunks.has(chunkX+','+chunkY)&&x>=0n&&y>=0n&&x<BigInt(origin.visual.terrain[0].length)&&y<BigInt(origin.visual.terrain.length)){tile=origin.visual.terrain[Number(y)][Number(x)];if(tile==='v')continue;}
   else continue;
   const id=JSON.stringify([p.playerId,state.overworldInstanceId,chunkX,chunkY]);if(remembered.get(id)?.has(ly*32+lx))continue;let seen=remembered.get(id);if(!seen){seen=new Set();remembered.set(id,seen);}seen.add(ly*32+lx);
   let row=edits.get(id);if(!row){const old=pending.get(id);row=old?{...old,tiles:old.tiles.split(''),markers:[...old.markers]}:{playerId:p.playerId,spaceInstanceId:state.overworldInstanceId,chunkX,chunkY,tiles:Array(832).fill('?'),region:copyWire(region),markers:[]};edits.set(id,row);}
   row.tiles[ly*32+lx]=['planned-world-shoreline-v2','planned-world-water-v3'].includes(w.plannedWorld?.version)&&chunk?.visual.route?.mapFeatures?.[ly]?.[lx]!=='?'&&chunk?.visual.route?.mapFeatures?.[ly]?.[lx]?chunk.visual.route.mapFeatures[ly][lx]:!['planned-world-shoreline-v2','planned-world-water-v3'].includes(w.plannedWorld?.version)&&['p','r','H','V'].includes(tile)?'p':w.plannedWorld&&['O','W','L'].includes(tile)?tile:biome;
   const chunkKey=chunkX+','+chunkY;let nearby=markCache.get(chunkKey);if(!nearby){nearby=chunk?chunk.sites.flatMap(s=>{const truth=siteTruth.byId[s.siteId];return truth?.navigable?[{id:s.siteId,label:truth.bound?truth.label:'Unidentified Woodland Site',kind:'site',x:s.entrance.localX,y:s.entrance.localY}]:[];}):manifest.sites.flatMap(s=>siteTruth.byId[s.locationId]?.navigable?[{id:s.locationId,label:s.properName??s.label,kind:'site',x:s.position.x-Number(cx)*1024,y:s.position.y-Number(cy)*832}]:[]).concat(manifest.settlements.flatMap(s=>siteTruth.byId[s.settlementId]?.navigable?[{id:s.settlementId,label:s.label,kind:'settlement',x:manifest.start.position.x-Number(cx)*1024,y:manifest.start.position.y-Number(cy)*832}]:[]));if(hasFerries(w.plannedWorld))nearby=nearby.concat(FERRY_NETWORK.landings.filter(l=>String(1024+Math.floor(l.tile.x/32))===chunkX&&String(1024+Math.floor(l.tile.y/26))===chunkY).map(l=>({id:l.id,label:l.name+' · Ferry',kind:'ferry',x:(l.tile.x%32+.5)*32,y:(l.tile.y%26+.5)*32})));markCache.set(chunkKey,nearby);}
   for(const mark of nearby)if(Math.floor(mark.x/32)===lx&&Math.floor(mark.y/32)===ly&&!row.markers.some(m=>m.id===mark.id))row.markers.push({...mark});
  }
  for(const [id,r] of edits){r.tiles=r.tiles.join('');if(pending.get(id)?.tiles!==r.tiles||pending.get(id)?.markers.length!==r.markers.length){pending.set(id,r);changed=true;}}
 }
 while(remembered.size>B.preparedChunks*4)remembered.delete(remembered.keys().next().value);
 check(pending.size<=B.navigationPendingPages,'Navigation page preparation required before further exploration');if(changed){nav.pending=[...pending.values()];nav.revision++;}observations.set(state,nextKeys);return changed;
}

export function acknowledgeNavigationD9(state,{expectedRoot,root,rows}){
 const w=state.d9World;check(w.discoveryIndex===expectedRoot,'Navigation root changed during preparation');const acknowledged=new Map(rows.map(r=>[navigationIdentityD9(r),r]));
 // New observations made while the Worker ran are retained; only cells actually
 // included in the prepared immutable pages leave the pending journal.
 w.navigation.pending=w.navigation.pending.flatMap(r=>{const a=acknowledged.get(navigationIdentityD9(r));if(!a)return [r];const tiles=[...r.tiles].map((v,i)=>a.tiles[i]===v?'?':v).join(''),markers=r.markers.filter(m=>!a.markers.some(x=>x.id===m.id));return (w.plannedWorld?/[^?]/.test(tiles):tiles.includes('w')||tiles.includes('r')||tiles.includes('m')||tiles.includes('o')||tiles.includes('p'))||markers.length?[{...r,tiles,markers}]:[];});w.discoveryIndex=root;w.navigation.revision++;
}
