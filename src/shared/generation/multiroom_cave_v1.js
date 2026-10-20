import {hasWorldCombat} from '../content/world_combat_v1.js';
import {MULTIROOM_VERSION as V,MULTIROOM_HASH,MULTIROOM_POLICY as P} from '../content/multiroom_policy_v1.js';
import {multiroomRecipe} from './multiroom_v1.js';
import {deriveWoodlandCaveIdentityD12_2,GENERATED_SITE_D12_2} from './woodland_cave_family_d12_2.js';
import {WOODLAND_CAVE_FAMILY_D12_2 as F,WOODLAND_CAVE_FAMILY_VERSION_D12_2} from '../content/site_families_d12_2.js';
import {WOODLAND_CAVE_FAMILY_ID} from '../content/site_families_d12.js';
import {bytesToHex,hashBytes,utf8} from '../contracts/hashing.js';
import {canonicalStringify,copyWire,freezeWire,requireContract as check} from '../contracts/wire.js';
export async function generateMultiroomCave({campaignSeed,site,reservation,combat=false,spawnOrdinal=0},{sha256}){
 const d=await deriveWoodlandCaveIdentityD12_2({campaignSeed,site,label:reservation.label,regionName:reservation.regionName,geographicQualifier:reservation.geographicQualifier},{sha256});check(d.layoutSeed===reservation.layoutSeed&&d.siteSeed===reservation.siteSeed,'Multiroom Cave identity drift');
 const count=P.floors[d.tier],floors=[];
 for(let i=0;i<count;i++){const r=multiroomRecipe(d.layoutSeed,'cave',d.tier,i,combat),id=`floor:${site.siteId}:${i}`,reward=i===count-1?{rewardId:`reward:${site.siteId}:${i}:0`,...copyWire(F.rewardPolicy),position:copyWire(r.reward.position)}:null;
  floors.push({version:V,floorId:id,index:i,floorSeed:bytesToHex(await hashBytes(utf8(V+'/'+d.layoutSeed+'/'+i),sha256)),graph:copyWire(r.graph),collision:copyWire(r.collision),visual:copyWire(r.visual),entrance:copyWire(r.entrance),transitions:{up:i?{transitionId:`transition:${site.siteId}:${i}:up`,floorId:`floor:${site.siteId}:${i-1}`,anchor:copyWire(r.stairAnchors.up)}:null,down:i<count-1?{transitionId:`transition:${site.siteId}:${i}:down`,floorId:`floor:${site.siteId}:${i+1}`,anchor:copyWire(r.stairAnchors.down)}:null},encounter:copyWire(r.encounter),reward,decorationIds:[]});
 }
 return freezeWire({version:GENERATED_SITE_D12_2,familyId:WOODLAND_CAVE_FAMILY_ID,familyVersion:WOODLAND_CAVE_FAMILY_VERSION_D12_2,generatorVersion:V,moduleCatalogVersion:V,siteId:site.siteId,siteSeed:d.siteSeed,layoutSeed:d.layoutSeed,sizeTier:d.tier,regionName:d.regionName,geographicQualifier:d.geographicQualifier,label:d.label,floorCount:count,floorIds:floors.map(f=>f.floorId),layoutHash:bytesToHex(await hashBytes(utf8(canonicalStringify(floors)),sha256)),spawnProvenance:{kind:'existing-planned-reservation',ordinal:spawnOrdinal,region:copyWire(site.region),socket:copyWire(site)},layoutProvenance:{layoutSeed:d.layoutSeed,moduleCatalogVersion:V,policyHash:MULTIROOM_HASH},encounterProvenance:{policy:copyWire(F.encounterPolicy),floorMemberKeys:Object.fromEntries(floors.map(f=>[f.floorId,f.encounter.members.map(m=>m.memberKey)]))},rewardProvenance:{policy:copyWire(F.rewardPolicy),rewardIds:floors.flatMap(f=>f.reward?[f.reward.rewardId]:[])},floors});
}
