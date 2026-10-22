import { freezeWire, requireContract, closedRecord, safeInteger } from './wire.js';
import { bytesToHex, frameUtf8, hashBytes } from './hashing.js';
import { createId, validateId } from './identities.js';
import { deriveScopedStream, nextBoundedInteger } from './rng.js';
import { ORDINARY_ENEMIES, ORDINARY_CATALOG_VERSION, resolveOrdinaryProfile } from '../content/ordinary_enemies.js';
import { THREAT_TIERS, BASELINE_PROGRESSION_POWER } from '../contracts/threat_power.js';
import { collidesWithTiles } from '../rules/world_geometry.js';
export const POPULATION_VERSION='semantic-wilderness-population-v1';
export const POPULATION_POLICY=freezeWire({maximumGroupsPerRegion:6,membersPerGroup:2,groupSpacing:400,settlementMargin:64,startProtection:480,seamInset:96});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function populationRegionAt(m,p){const c=m.chunks.find(c=>p.x>=c.origin.x&&p.y>=c.origin.y&&p.x<c.origin.x+c.dimensions.width&&p.y<c.origin.y+c.dimensions.height);return c?m.regions.find(r=>r.chunkIds.includes(c.chunkId)):null;}
export function populationPointAllowed(m,c,p){const q=POPULATION_POLICY;
  if((c&&collidesWithTiles(c,p.x,p.y,10))||distance(p,m.start.position)<q.startProtection)return false;
  if(m.safeRegions.some(r=>p.x+q.settlementMargin>r.x&&p.x-q.settlementMargin<r.x+r.width&&p.y+q.settlementMargin>r.y&&p.y-q.settlementMargin<r.y+r.height))return false;
  const chunk=m.chunks.find(c=>p.x>=c.origin.x&&p.y>=c.origin.y&&p.x<c.origin.x+c.dimensions.width&&p.y<c.origin.y+c.dimensions.height);
  return Boolean(chunk&&p.x-chunk.origin.x>=q.seamInset&&p.y-chunk.origin.y>=q.seamInset&&chunk.origin.x+chunk.dimensions.width-p.x>=q.seamInset&&chunk.origin.y+chunk.dimensions.height-p.y>=q.seamInset);
}
export async function generateOrdinaryPopulation(m,collision,sha256){
  const stream=await deriveScopedStream(m.generation,{domain:'ordinary-population',keys:[{kind:'recipe',value:POPULATION_VERSION},{kind:'recipe',value:ORDINARY_CATALOG_VERSION}]},{sha256});let rng=stream.initialState;
  const take=n=>{const r=nextBoundedInteger(rng,n);rng=r.state;return r.value;};
  const token=async key=>bytesToHex((await hashBytes(frameUtf8([POPULATION_VERSION,ORDINARY_CATALOG_VERSION,m.generation.seedHex,m.generation.generatorVersion,m.generation.contentCatalogHash,key]),sha256)).slice(0,16));
  const home=m.regions.find(r=>r.chunkIds.includes(m.start.chunkId)),groups=[],chosen=[];
  for(const region of m.regions){region.threatTier=region===home?['C','B'][take(2)]:['A','S'][take(2)];
    const familyOffset=take(3),candidates=[];
    for(let y=48;y<collision.height*32;y+=96)for(let x=48;x<collision.width*32;x+=96){const p={x,y};
      if(populationRegionAt(m,p)?.regionId===region.regionId&&populationPointAllowed(m,collision,p)&&populationPointAllowed(m,collision,{x:x+32,y}))candidates.push(p);}
    for(let i=candidates.length-1;i>0;i--){const j=take(i+1);[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
    // First home group is near the safe frontier; the remainder use seeded spatial sampling.
    if(region===home)candidates.sort((a,b)=>distance(a,m.start.position)-distance(b,m.start.position));
    for(let i=0;i<POPULATION_POLICY.maximumGroupsPerRegion;i++){
      const index=candidates.findIndex(p=>chosen.every(q=>distance(p,q)>=POPULATION_POLICY.groupSpacing));if(index<0)break;
      const [anchor]=candidates.splice(index,1);chosen.push(anchor);
      if(region===home&&i===0)for(let k=candidates.length-1;k>0;k--){const j=take(k+1);[candidates[k],candidates[j]]=[candidates[j],candidates[k]];}
      const groupId='ordinary:'+await token(region.regionId+':'+i),members=[];
      for(let n=0;n<2;n++){const enemy=ORDINARY_ENEMIES[(i+n+familyOffset)%3],profile=resolveOrdinaryProfile(enemy,region.threatTier);
        members.push({entityId:createId('entityId',await token(groupId+':'+n)),enemyDefinitionId:enemy.enemyDefinitionId,profileId:profile.contentDefinitionId,position:{x:anchor.x+n*32,y:anchor.y}});}
      groups.push({groupId,regionId:region.regionId,anchor,members});
    }
  }
  return freezeWire({policyVersion:POPULATION_VERSION,catalogVersion:ORDINARY_CATALOG_VERSION,progressionPower:BASELINE_PROGRESSION_POWER,groups});
}
export function validateOrdinaryPopulation(m,collision=null){
  const p=m.population;closedRecord(p,['policyVersion','catalogVersion','progressionPower','groups']);
  requireContract(p.policyVersion===POPULATION_VERSION&&p.catalogVersion===ORDINARY_CATALOG_VERSION&&p.progressionPower===BASELINE_PROGRESSION_POWER,'Unknown population binding');
  requireContract(Array.isArray(p.groups)&&p.groups.length>=6&&p.groups.length<=m.regions.length*POPULATION_POLICY.maximumGroupsPerRegion&&p.groups.length<=16,'Population group budget');
  const home=m.regions.find(r=>r.chunkIds.includes(m.start.chunkId));requireContract(['C','B'].includes(home.threatTier),'Unsafe home threat tier');
  for(const r of m.regions)requireContract(THREAT_TIERS.includes(r.threatTier),'Invalid region threat');
  const ids=new Set(),anchors=[],counts=new Map();
  for(const g of p.groups){closedRecord(g,['groupId','regionId','anchor','members']);requireContract(/^ordinary:[0-9a-f]{32}$/.test(g.groupId)&&!ids.has(g.groupId),'Invalid ordinary group identity');ids.add(g.groupId);
    const region=m.regions.find(r=>r.regionId===g.regionId);requireContract(region&&g.members.length===2,'Ordinary region/member count');counts.set(g.regionId,(counts.get(g.regionId)||0)+1);
    closedRecord(g.anchor,['x','y']);safeInteger(g.anchor.x);safeInteger(g.anchor.y);requireContract(anchors.every(q=>distance(q,g.anchor)>=POPULATION_POLICY.groupSpacing),'Ordinary groups too close');anchors.push(g.anchor);
    g.members.forEach((a,i)=>{closedRecord(a,['entityId','enemyDefinitionId','profileId','position']);validateId('entityId',a.entityId);requireContract(!ids.has(a.entityId),'Duplicate generated actor');ids.add(a.entityId);
      const enemy=ORDINARY_ENEMIES.find(d=>d.enemyDefinitionId===a.enemyDefinitionId);requireContract(enemy&&a.profileId===resolveOrdinaryProfile(enemy,region.threatTier).contentDefinitionId,'Ordinary family/tier drift');
      closedRecord(a.position,['x','y']);requireContract(a.position.x===g.anchor.x+i*32&&a.position.y===g.anchor.y&&populationRegionAt(m,a.position)?.regionId===g.regionId,'Ordinary semantic placement mismatch');
      requireContract(populationPointAllowed(m,collision,a.position),'Invalid ordinary placement');});
  }
  requireContract(m.regions.every(r=>(counts.get(r.regionId)||0)>=2&&(counts.get(r.regionId)||0)<=POPULATION_POLICY.maximumGroupsPerRegion),'Missing semantic population');return p;
}
