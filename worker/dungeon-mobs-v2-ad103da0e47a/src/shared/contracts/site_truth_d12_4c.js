import {functionalSiteDefinitionD10} from '../content/functional_site_registry_d10.js';
import {D9_PROFILE as P} from '../content/world_profile_d9.js';
import {eligibleFunctionalSocketD10,fortDoorWorldD10} from './functional_site_d9.js';
import {manifestForState} from './overworld.js';
import {floorDiv,legacyWorldPosition,normalizeWorldPosition} from './world_address.js';
import {copyWire,freezeWire} from './wire.js';
import {resolveAuthoritativeSiteDefinitionsD13A} from './site_definition_d13a.js';
import {siteFinaleDiagnosticD13D_B} from './site_finale_d13d.js';

export const SITE_TRUTH_D12_4C='site-truth-d12-4c.1-v1';

const chunkKey=position=>position.chunkX+','+position.chunkY;
const tileAnchor=anchor=>{
 const tileX=BigInt(anchor.tileX),tileY=BigInt(anchor.tileY),cx=floorDiv(tileX,32n),cy=floorDiv(tileY,26n);
 return normalizeWorldPosition({chunkX:String(cx),chunkY:String(cy),localX:Number(tileX-cx*32n)*P.tileSize+P.tileSize/2,localY:Number(tileY-cy*26n)*P.tileSize+P.tileSize/2});
};
const functionalLabel=(site,reservation,definition)=>site?.label??reservation?.parcel?.label??definition?.template?.label??(reservation?.packageId==='woodland-cave-family'?'Woodland Cave':'Functional Site');
const functionalKind=(site,reservation,definition)=>site?.siteKind??definition?.template?.siteKind??(reservation?.packageId?.includes('fort')?'woodland-fort':reservation?.packageId?.includes('ruin')?'woodland-ruin':reservation?.packageId?.includes('cave')?'woodland-cave':reservation?.packageId==='procedural-crypt-family'?'procedural-crypt':'functional-site');
const approachFor=(site,reservation,socket)=>{
 const parcel=reservation?.parcel;
 if(parcel?.roadAnchor?.tileX!==undefined&&parcel?.roadAnchor?.tileY!==undefined)return tileAnchor(parcel.roadAnchor);
 if(site?.siteKind==='woodland-fort'||reservation?.packageId==='woodland-fort')return copyWire(socket.entrance);
 // The deterministic landing search may move this point farther away. This
 // bounded fallback merely expresses the ordinary exterior approach side.
 return normalizeWorldPosition({...socket.entrance,localY:socket.entrance.localY+3*P.tileSize});
};
const requiredChunks=(site,reservation,socket)=>{
 const pages=site?.compound?.pages??reservation?.parcel?.pages??[];
 const rows=pages.length?pages.map(p=>({chunkX:p.chunkX,chunkY:p.chunkY})): [{chunkX:socket.entrance.chunkX,chunkY:socket.entrance.chunkY}];
 return [...new Map(rows.map(p=>[p.chunkX+','+p.chunkY,p])).values()].sort((a,b)=>BigInt(a.chunkY)<BigInt(b.chunkY)?-1:BigInt(a.chunkY)>BigInt(b.chunkY)?1:BigInt(a.chunkX)<BigInt(b.chunkX)?-1:BigInt(a.chunkX)>BigInt(b.chunkX)?1:0);
};

// One authority-derived definition of a destination. Normal discovery consumes
// only navigable records; developer diagnostics may additionally inspect the
// rejected rows. Raw generator sockets never become destinations here.
export function resolveSiteTruthD12_4C(state,{includeRejected=false,includeFinaleDiagnostics=true}={}){
 const world=state.d9World,manifest=manifestForState(state),siteDefinitions=new Map(resolveAuthoritativeSiteDefinitionsD13A(state).map(row=>[row.siteId,row])),resident=new Set(world?.runtime?.chunks?.map(c=>c.chunkX+','+c.chunkY)??[]),records=[];
 for(const settlement of manifest.settlements??[]){
  const worldPosition=legacyWorldPosition(manifest.start.position),required=[{chunkX:worldPosition.chunkX,chunkY:worldPosition.chunkY}];
  records.push({version:SITE_TRUTH_D12_4C,siteId:settlement.settlementId,label:settlement.label,siteType:'settlement',packageId:'historical-settlement',familyId:'historical',bound:true,reserved:true,eligible:true,completed:false,navigable:true,historical:true,worldPosition:copyWire(worldPosition),entrance:copyWire(worldPosition),approachAnchor:copyWire(worldPosition),interactionAnchor:copyWire(worldPosition),tier:null,floorCount:null,requiredChunks:required,resident:true,rejectionReason:null});
 }
 for(const site of manifest.sites??[]){
  const worldPosition=legacyWorldPosition(site.position),required=[{chunkX:worldPosition.chunkX,chunkY:worldPosition.chunkY}],progress=state.campaign.sitesById?.[site.locationId],interior=manifest.siteInteriors?.find(row=>row.siteId===site.locationId)??null;
  // Historical ledger rows describe proof metadata as well as implemented
  // places. A destination exists only when an explicit physical path is
  // installed. Future historical exteriors/interactions can join this test
  // through a registered capability instead of relying on ledger presence.
  const implemented=Boolean(interior);
  const universal=siteDefinitions.get(site.locationId)??null;
  records.push({version:SITE_TRUTH_D12_4C,siteId:site.locationId,label:site.properName??site.label,siteType:site.siteKind??'historical-site',packageId:site.locationDefinitionId,familyId:universal?.familyId??'historical',namedVariantId:universal?.namedVariantId??null,bound:implemented,reserved:true,eligible:implemented,completed:implemented&&progress?.conqueredTick!==null&&progress?.conqueredTick!==undefined,navigable:implemented,historical:true,worldPosition:copyWire(worldPosition),entrance:implemented?copyWire(worldPosition):null,approachAnchor:implemented?copyWire(worldPosition):null,interactionAnchor:implemented?copyWire(worldPosition):null,tier:site.siteTier??null,floorCount:interior?1:null,requiredChunks:required,resident:implemented,rejectionReason:implemented?null:'legacy-unimplemented-placeholder'});
 }
 if(world){
  const bound=world.functionalSitesById??{},reservations=world.siteReservationsById??{},ids=new Set([...Object.keys(bound),...Object.keys(reservations)]);
  for(const siteId of [...ids].sort()){
   const site=bound[siteId]??null,reservation=reservations[siteId]??null,socket=site?.socket??reservation?.socket,definition=functionalSiteDefinitionD10(site?.packageId??reservation?.packageId,site?.packageVersion??null),installed=Boolean(definition),reserved=Boolean(reservation),isBound=Boolean(site),eligible=Boolean(isBound||reserved&&installed&&eligibleFunctionalSocketD10(state,socket)),navigable=Boolean(isBound||reserved&&installed&&eligible),rejectionReason=navigable?null:!reserved?'unreserved':!installed?'package-not-installed':'activation-ineligible';
   const universal=siteDefinitions.get(siteId)??null;
   if(!socket){if(includeRejected)records.push({version:SITE_TRUTH_D12_4C,siteId,label:functionalLabel(site,reservation,definition),siteType:functionalKind(site,reservation,definition),packageId:site?.packageId??reservation?.packageId??null,familyId:universal?.familyId??site?.familyId??reservation?.parcel?.familyId??null,namedVariantId:universal?.namedVariantId??null,bound:isBound,reserved,eligible:false,completed:false,navigable:false,historical:false,worldPosition:null,entrance:null,approachAnchor:null,interactionAnchor:null,tier:null,floorCount:null,requiredChunks:[],resident:false,rejectionReason:'missing-socket'});continue;}
   const entrance=copyWire(socket.entrance),approachAnchor=approachFor(site,reservation,socket),interactionAnchor=site?.siteKind==='woodland-fort'?copyWire(fortDoorWorldD10(site)):entrance,required=requiredChunks(site,reservation,socket),finale=includeFinaleDiagnostics?siteFinaleDiagnosticD13D_B(state,siteId):null;
   const reviewEncounter=['F','G','H','I','J','K','L','M','N','O'].includes(state.proofCase)&&reservation?.parcel?.placementProvenance?.guaranteed===true&&reservation.parcel.placementProvenance.ordinal===0?({F:'Vitality Weaver',G:'Swift Commander',H:'Glacial Warden',I:'Toxic Decay',J:'Iron Citadel',K:'Berserker',L:'Nullifier',M:'Web Weaver',N:'Slag Shaper',O:'Arachnid Treant'}[state.proofCase]):null;
   records.push({version:SITE_TRUTH_D12_4C,siteId,label:functionalLabel(site,reservation,definition),siteType:functionalKind(site,reservation,definition),packageId:site?.packageId??reservation.packageId,familyId:universal?.familyId??site?.familyId??reservation?.parcel?.familyId??null,namedVariantId:universal?.namedVariantId??null,bound:isBound,reserved,eligible,completed:Boolean(site?.conqueredTick!==null&&site?.conqueredTick!==undefined),navigable,historical:false,worldPosition:copyWire(entrance),entrance:copyWire(entrance),approachAnchor:copyWire(approachAnchor),interactionAnchor:copyWire(interactionAnchor),tier:site?.sizeTier??reservation?.parcel?.tier??null,floorCount:site?.floorCount??(definition?.placement==='generated-interior-family'?null:1),...(finale?{finale:copyWire(finale)}:{}),reviewEncounter,reviewFloor:reviewEncounter?1:null,requiredChunks:required,resident:required.every(p=>resident.has(p.chunkX+','+p.chunkY)),rejectionReason});
  }
  if(includeRejected){
   for(const socket of world.runtime.chunks.flatMap(chunk=>chunk.sites??[]).sort((a,b)=>a.siteId.localeCompare(b.siteId))){
    if(ids.has(socket.siteId))continue;const entrance=copyWire(socket.entrance),required=[{chunkX:entrance.chunkX,chunkY:entrance.chunkY}];records.push({version:SITE_TRUTH_D12_4C,siteId:socket.siteId,label:'Raw candidate socket',siteType:'candidate',packageId:null,familyId:null,bound:false,reserved:false,eligible:false,completed:false,navigable:false,historical:false,worldPosition:copyWire(entrance),entrance:copyWire(entrance),approachAnchor:null,interactionAnchor:null,tier:null,floorCount:null,requiredChunks:required,resident:required.every(p=>resident.has(p.chunkX+','+p.chunkY)),rejectionReason:'unreserved-candidate'});
   }
  }
 }
 const ordered=records.filter(r=>includeRejected||r.navigable).sort((a,b)=>a.label.localeCompare(b.label)||a.siteId.localeCompare(b.siteId)),rejected=ordered.filter(r=>!r.navigable),rejectedByReason={};for(const row of rejected)rejectedByReason[row.rejectionReason]=(rejectedByReason[row.rejectionReason]??0)+1;
 return freezeWire({version:SITE_TRUTH_D12_4C,sites:ordered,byId:Object.fromEntries(ordered.map(row=>[row.siteId,copyWire(row)])),diagnostics:{rawCandidates:world?.runtime?.chunks?.reduce((n,c)=>n+(c.sites?.length??0),0)??0,reserved:ordered.filter(r=>!r.historical&&r.reserved).length,eligible:ordered.filter(r=>!r.historical&&r.eligible).length,bound:ordered.filter(r=>!r.historical&&r.bound).length,rejectedByReason}});
}

export function navigableSiteTruthD12_4C(state){return resolveSiteTruthD12_4C(state).sites;}
export function siteTruthRecordD12_4C(state,siteId){return resolveSiteTruthD12_4C(state).byId[siteId]??null;}
