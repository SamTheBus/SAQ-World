import {createPageTransaction,pageDigest} from '../storage/paged_world_store.js';
import {SITE_BINDING_D9,SITE_BINDING_POLICY_D9,D9_SITE_CONTENT_CATALOG,validateSiteSocketD9,validateSiteCatalogD9,validateSiteContentRootD9,validateSiteBindingD9,packageEligibleD9} from '../shared/contracts/site_content_d9.js';
import {copyWire,freezeWire,canonicalStringify,requireContract as check,safeInteger} from '../shared/contracts/wire.js';
import {progressionBigInt,progressionWire} from '../shared/contracts/progression_integer.js';
import {projectToLocalFrameD9} from '../shared/contracts/local_world_frames_d9.js';
import {collidesWithTiles} from '../shared/rules/world_geometry.js';
import {SITE_INTERACTION_RADIUS} from '../shared/contracts/site_interiors.js';
import {WOODLAND_FORT_D11_PACKAGE as WOODLAND_FORT_PACKAGE,WOODLAND_CAVE_D11_PACKAGE as WOODLAND_CAVE_PACKAGE} from '../shared/content/woodland_sites_d11.js';
import {WOODLAND_CAVE_FAMILY_PACKAGE_D12} from '../shared/content/site_families_d12.js';
import {WOODLAND_CAVE_FAMILY_PACKAGE_D12_1} from '../shared/content/site_families_d12_1.js';

const keyFor=(domain,id,sha256)=>pageDigest({version:'site-content-index-d9-v1',domain,id},sha256);

// Called only by the authoritative entry/activation path of an installed
// content package. D9 has no procedural interior package or client bind command.
function activationState(state,site,playerId,kind){
 check(['entry','content-activation'].includes(kind),'Geography/discovery cannot bind content');
 const player=state.playersById[playerId],actor=state.entitiesById[player?.entityId],point=projectToLocalFrameD9(site.entrance,state.d9World.runtime.frames);
 check(actor?.alive&&actor.residency.spaceInstanceId===state.overworldInstanceId&&point,'Site binding requires a living local participant');
 const distance=Math.hypot(actor.position.x-point.x,actor.position.y-point.y);check(distance<=SITE_INTERACTION_RADIUS,'Site activation out of reach');
 const collision=state.spacesByInstanceId[state.overworldInstanceId].collision,steps=Math.max(1,Math.ceil(distance/4));
 for(let i=0;i<=steps;i++){const f=i/steps;check(!collidesWithTiles(collision,actor.position.x+(point.x-actor.position.x)*f,actor.position.y+(point.y-actor.position.y)*f,actor.hullRadius),'Site activation blocked');}
 return canonicalStringify({tick:state.tick,playerId,actor});
}

export async function readSiteBindingD9(content,siteId,{readPage,sha256}){
 validateSiteContentRootD9(content);const old=content.historical.find(b=>b.siteId===siteId);if(old)return freezeWire(old);
 const index=createPageTransaction({root:content.index,readPage,sha256}),b=await index.get(await keyFor('binding',siteId,sha256));
 if(b)validateSiteBindingD9(b);return b?freezeWire(b):null;
}

export async function prepareSiteBindingD9({state,site,playerId,kind,catalog,readPage,sha256}){
 validateSiteSocketD9(site);validateSiteCatalogD9(catalog);const root=state.d9World.content;validateSiteContentRootD9(root);
 const reservation=Object.keys(state.d9World.siteReservationsById??{}).length?state.d9World.siteReservationsById[site.siteId]:null;if(Object.keys(state.d9World.siteReservationsById??{}).length)check(reservation,'Socket has no campaign reservation');
 // Socket must be a regenerated, currently admitted authoritative geography fact,
 // never a caller-created location/biome/minimum-level claim.
 const admitted=state.d9World.runtime.chunks.flatMap(c=>c.sites??[]).find(s=>s.siteId===site.siteId);
 check(admitted&&canonicalStringify(admitted)===canonicalStringify(site),'Unknown authoritative site socket');
 const activation=activationState(state,site,playerId,kind),expected=canonicalStringify(root),index=createPageTransaction({root:root.index,readPage,sha256});
 const bindingKey=await keyFor('binding',site.siteId,sha256),previous=await index.get(bindingKey);
 if(previous){validateSiteBindingD9(previous);check(!reservation||previous.packageId===reservation.packageId,'Reserved binding/package mismatch');return freezeWire({expected,activation,site,playerId,kind,binding:previous,nextRoot:root,pages:[],replay:true});}
 const candidates=[];
 for(const [priority,p] of catalog.packages.entries()){
  const representationKey=await keyFor('representation',p.packageId,sha256),r=await index.get(representationKey),historical=root.historical.filter(b=>b.packageId===p.packageId).length;
  if(r){check(r.version==='content-representation-d9-v1'&&r.packageId===p.packageId,'Invalid representation record');check(progressionBigInt(r.count)>0n,'Invalid representation count');}
  const count=r?progressionBigInt(r.count):BigInt(historical);
  if((!reservation||p.packageId===reservation.packageId)&&packageEligibleD9(site,p,count>0n))candidates.push({p,representationKey,count,priority,tie:await pageDigest({policy:SITE_BINDING_POLICY_D9,siteSeed:site.siteSeed,packageId:p.packageId},sha256)});
 }
 // No package is a valid UNBOUND result. Do not create a placeholder interior,
 // reserve a package, or mark a campaign representation merely on approach.
 if(!candidates.length)return null;
 candidates.sort((a,b)=>Number(a.count>0n)-Number(b.count>0n)||a.priority-b.priority||(a.tie<b.tie?-1:a.tie>b.tie?1:0));const chosen=candidates[0];
 const binding={version:SITE_BINDING_D9,siteId:site.siteId,status:'bound',packageId:chosen.p.packageId,packageVersion:chosen.p.packageVersion,contentHash:chosen.p.contentHash,catalogVersion:catalog.catalogVersion,policyVersion:SITE_BINDING_POLICY_D9,boundTick:state.tick,causedByPlayerId:playerId};
 validateSiteBindingD9(binding);const count=progressionWire(chosen.count+1n);
 await index.set(bindingKey,binding);await index.set(chosen.representationKey,{version:'content-representation-d9-v1',packageId:chosen.p.packageId,count,lastSiteId:site.siteId});
 return freezeWire({expected,activation,site,playerId,kind,binding,nextRoot:{...root,catalogVersion:catalog.catalogVersion,index:index.root()},pages:index.pages(),replay:false});
}

export function commitSiteBindingD9(state,plan){
 // Synchronous authority compare-and-swap. A second participant must retry and
 // receive the existing binding; different unique sites also share this lock.
 check(canonicalStringify(state.d9World.content)===plan.expected,'Stale site binding plan');
 check(activationState(state,plan.site,plan.playerId,plan.kind)===plan.activation,'Site activation changed while binding');
 safeInteger(state.tick);state.d9World.content=copyWire(plan.nextRoot);
 // Caller stages these immutable pages in the SAME exact world-root save as
 // this content index and any interior activation state. Never publish separately.
 return {binding:copyWire(plan.binding),pages:copyWire(plan.pages),replay:plan.replay};
}

// Seed-selected Fort geography is committed before any of its pages stream.
// The cause is the pinned parcel reservation, never a participant's arrival.
export async function prepareFortReservationBindingD10(state,parcel,{readPage,sha256}){
 const site=parcel.socket;validateSiteSocketD9(site);check(parcel.siteId===site.siteId&&packageEligibleD9(site,WOODLAND_FORT_PACKAGE,false),'Fort reservation eligibility');
 const root=state.d9World.content,index=createPageTransaction({root:root.index,readPage,sha256}),expected=canonicalStringify(root),bindingKey=await keyFor('binding',site.siteId,sha256),representationKey=await keyFor('representation',WOODLAND_FORT_PACKAGE.packageId,sha256);
 check(!await index.get(bindingKey)&&!await index.get(representationKey),'Fort already bound or represented');
 const binding={version:SITE_BINDING_D9,siteId:site.siteId,status:'bound',packageId:WOODLAND_FORT_PACKAGE.packageId,packageVersion:WOODLAND_FORT_PACKAGE.packageVersion,contentHash:WOODLAND_FORT_PACKAGE.contentHash,catalogVersion:D9_SITE_CONTENT_CATALOG.catalogVersion,policyVersion:'seed-reserved-fort-d10-v1',boundTick:state.tick,causedByPlayerId:null};
 validateSiteBindingD9(binding);await index.set(bindingKey,binding);await index.set(representationKey,{version:'content-representation-d9-v1',packageId:WOODLAND_FORT_PACKAGE.packageId,count:'1',lastSiteId:site.siteId});
 return freezeWire({expected,binding,nextRoot:{...root,catalogVersion:D9_SITE_CONTENT_CATALOG.catalogVersion,index:index.root()},pages:index.pages()});
}
export function commitFortReservationBindingD10(state,plan){check(canonicalStringify(state.d9World.content)===plan.expected,'Fort reservation changed before admission');state.d9World.content=copyWire(plan.nextRoot);return copyWire(plan.binding);}

async function prepareReservedBindingD10(state,parcel,pkg,policy,{readPage,sha256}){
 const site=parcel.socket;validateSiteSocketD9(site);check(parcel.siteId===site.siteId&&packageEligibleD9(site,pkg,false),'Reserved site eligibility');
 check(state.d9World.siteReservationsById?.[site.siteId]?.packageId===pkg.packageId,'Reserved site/package mismatch');
 const root=state.d9World.content,index=createPageTransaction({root:root.index,readPage,sha256}),expected=canonicalStringify(root),bindingKey=await keyFor('binding',site.siteId,sha256),representationKey=await keyFor('representation',pkg.packageId,sha256);
 check(!await index.get(bindingKey)&&!await index.get(representationKey),'Reserved site already bound or represented');
 const binding={version:SITE_BINDING_D9,siteId:site.siteId,status:'bound',packageId:pkg.packageId,packageVersion:pkg.packageVersion,contentHash:pkg.contentHash,catalogVersion:D9_SITE_CONTENT_CATALOG.catalogVersion,policyVersion:policy,boundTick:state.tick,causedByPlayerId:null};
 validateSiteBindingD9(binding);await index.set(bindingKey,binding);await index.set(representationKey,{version:'content-representation-d9-v1',packageId:pkg.packageId,count:'1',lastSiteId:site.siteId});
 return freezeWire({expected,binding,nextRoot:{...root,catalogVersion:D9_SITE_CONTENT_CATALOG.catalogVersion,index:index.root()},pages:index.pages()});
}

export const prepareCaveReservationBindingD10=(state,parcel,options)=>prepareReservedBindingD10(state,parcel,WOODLAND_CAVE_PACKAGE,'seed-reserved-site-d10-v1',options);
export function commitCaveReservationBindingD10(state,plan){check(canonicalStringify(state.d9World.content)===plan.expected,'Cave reservation changed before admission');state.d9World.content=copyWire(plan.nextRoot);return copyWire(plan.binding);}

export async function prepareCaveFamilyReservationBindingD12(state,parcel,{readPage,sha256}){
 const pkg=WOODLAND_CAVE_FAMILY_PACKAGE_D12,site=parcel.socket;validateSiteSocketD9(site);check(parcel.siteId===site.siteId&&packageEligibleD9(site,pkg,false),'D12 Cave reservation eligibility');
 check(state.d9World.siteReservationsById?.[site.siteId]?.packageId===pkg.packageId,'D12 reserved site/package mismatch');
 const root=state.d9World.content,index=createPageTransaction({root:root.index,readPage,sha256}),expected=canonicalStringify(root),bindingKey=await keyFor('binding',site.siteId,sha256),representationKey=await keyFor('representation',pkg.packageId,sha256),prior=await index.get(representationKey);check(!await index.get(bindingKey),'D12 cave already bound');
 if(prior){check(prior.version==='content-representation-d9-v1'&&prior.packageId===pkg.packageId,'Invalid D12 family representation');}
 const binding={version:SITE_BINDING_D9,siteId:site.siteId,status:'bound',packageId:pkg.packageId,packageVersion:pkg.packageVersion,contentHash:pkg.contentHash,catalogVersion:D9_SITE_CONTENT_CATALOG.catalogVersion,policyVersion:'seed-reserved-cave-family-d12-v1',boundTick:state.tick,causedByPlayerId:null};validateSiteBindingD9(binding);
 await index.set(bindingKey,binding);await index.set(representationKey,{version:'content-representation-d9-v1',packageId:pkg.packageId,count:progressionWire((prior?progressionBigInt(prior.count):0n)+1n),lastSiteId:site.siteId});
 return freezeWire({expected,binding,nextRoot:{...root,catalogVersion:D9_SITE_CONTENT_CATALOG.catalogVersion,index:index.root()},pages:index.pages()});
}
export function commitCaveFamilyReservationBindingD12(state,plan){check(canonicalStringify(state.d9World.content)===plan.expected,'D12 cave reservation changed before admission');state.d9World.content=copyWire(plan.nextRoot);return copyWire(plan.binding);}

export async function prepareCaveFamilyReservationBindingD12_1(state,parcel,{readPage,sha256}){
 const pkg=WOODLAND_CAVE_FAMILY_PACKAGE_D12_1,site=parcel.socket;validateSiteSocketD9(site);check(parcel.siteId===site.siteId&&packageEligibleD9(site,pkg,false),'D12.1 Cave reservation eligibility');check(state.d9World.siteReservationsById?.[site.siteId]?.packageId===pkg.packageId,'D12.1 reserved site/package mismatch');
 const root=state.d9World.content,index=createPageTransaction({root:root.index,readPage,sha256}),expected=canonicalStringify(root),bindingKey=await keyFor('binding',site.siteId,sha256),representationKey=await keyFor('representation',pkg.packageId,sha256),prior=await index.get(representationKey);check(!await index.get(bindingKey),'D12.1 Cave already bound');if(prior)check(prior.version==='content-representation-d9-v1'&&prior.packageId===pkg.packageId,'Invalid D12.1 family representation');
 const binding={version:SITE_BINDING_D9,siteId:site.siteId,status:'bound',packageId:pkg.packageId,packageVersion:pkg.packageVersion,contentHash:pkg.contentHash,catalogVersion:D9_SITE_CONTENT_CATALOG.catalogVersion,policyVersion:'seed-regional-cave-family-d12-1-v1',boundTick:state.tick,causedByPlayerId:null};validateSiteBindingD9(binding);await index.set(bindingKey,binding);await index.set(representationKey,{version:'content-representation-d9-v1',packageId:pkg.packageId,count:progressionWire((prior?progressionBigInt(prior.count):0n)+1n),lastSiteId:site.siteId});return freezeWire({expected,binding,nextRoot:{...root,catalogVersion:D9_SITE_CONTENT_CATALOG.catalogVersion,index:index.root()},pages:index.pages()});
}
export function commitCaveFamilyReservationBindingD12_1(state,plan){check(canonicalStringify(state.d9World.content)===plan.expected,'D12.1 Cave reservation changed before admission');state.d9World.content=copyWire(plan.nextRoot);return copyWire(plan.binding);}
