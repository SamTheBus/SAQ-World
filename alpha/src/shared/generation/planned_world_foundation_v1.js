import {MULTIROOM_VERSION,MULTIROOM_HASH} from '../content/multiroom_policy_v1.js';
import {ALPHA_POPULATION_VERSION,ALPHA_POPULATION_HASH,ALPHA_POPULATION_BASE_HASH} from '../content/alpha_site_population_v1.js';
import {PLANNED_CRYPT_V2} from '../content/planned_crypt_policy_v2.js';
const LARGE_CRYPT_FIXTURE_ASSET_HASH='e67a50da6187bdfeb8c91060f47e522c238cefc0530d56c46af312dcae838e1f';
import {PLANNED_CRYPT_VERSION} from '../content/planned_crypt_policy_v1.js';
import {PLANNED_RUIN_V2,DEEP_RUIN_FIXTURE_ASSET_HASH} from '../content/planned_ruin_policy_v2.js';
import {PLANNED_RUIN_VERSION} from '../content/planned_ruin_policy_v1.js';
import {PLANNED_FORT_V2,DEEP_FORT_FIXTURE_ASSET_HASH} from '../content/planned_fort_policy_v2.js';
import {PLANNED_FORT_VERSION} from '../content/planned_fort_policy_v1.js';
import {PLANNED_CAVE_POPULATION_VERSION} from '../content/planned_cave_population_v2.js';
import {PLANNED_CAVE_VERSION} from '../content/planned_cave_policy_v1.js';
import {PLANNED_TOWN_VERSION,PLANNED_TOWN_START_VERSION,PLANNED_TOWN_ASSET_HASH} from './planned_town_v1.js';
import {createLocalWaterGeometry,LOCAL_WATER_VERSION} from './local_water_geometry_v3.js';
import {createLocalShoreline,LOCAL_SHORELINE_VERSION} from './local_shoreline_v2.js';
// Shared, pure projection. No browser, save, clock, or mutable campaign RNG.
export const PLANNED_WORLD_VERSION='planned-world-runtime-foundation-v1';
export const PLANNED_SHORELINE_VERSION='planned-world-shoreline-v2';
export const PLANNED_WATER_VERSION='planned-world-water-v3';
export const plannedAssetDirectory=b=>b.version===PLANNED_WATER_VERSION?'assets/planned-world-water-v3':b.version===PLANNED_SHORELINE_VERSION?'assets/planned-world-shore-v2':'assets/planned-world-v1';
export const PLANNED_ROUTE_VERSION='planned-world-routes-v1';
export const PLANNED_SCALE=Object.freeze({tilePixels:32,chunkTilesX:32,chunkTilesY:26,macroTilesX:64,macroTilesY:52});
export const PLANNED_ADDRESS_OFFSET=Object.freeze({chunkX:1024,chunkY:1024});
export const BIOME_CODES=Object.freeze({woodland:'w',grassland:'a',wetland:'m',upland:'r',desert:'d',frostland:'s',tropical:'t',volcanic:'l'});
export const BIOME_PRESENTATION_COVERAGE=Object.freeze({woodland:'existing ground, leaf litter, trees; partial coast kit',wetland:'existing marsh ground/reeds; partial water kit',upland:'existing rocky ground and rocks; partial cliff kit',grassland:'adapted ground palette; temporary meadow detail',desert:'temporary sand palette and stones; no complete desert kit',frostland:'temporary snow palette and stones; no complete frost kit',tropical:'temporary jungle palette and existing foliage; no complete tropical kit',volcanic:'temporary basalt palette and rocks; no complete volcanic kit'});
export function requirePlan(condition,message){if(!condition)throw new TypeError(message);}
export function freezePlan(value){if(value&&typeof value==='object'){for(const child of Object.values(value))freezePlan(child);Object.freeze(value);}return value;}
export function canonicalPlan(value){requirePlan(value!==undefined,'Undefined planned field');if(value===null||typeof value!=='object')return JSON.stringify(value);return Array.isArray(value)?'['+value.map(canonicalPlan).join(',')+']':'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonicalPlan(value[k])).join(',')+'}';}
export const mixPlan=text=>{let n=2166136261;for(let i=0;i<text.length;i++){n^=text.charCodeAt(i);n=Math.imul(n,16777619);}return n>>>0;};
export const tileAddress=(x,y)=>({chunkX:String(PLANNED_ADDRESS_OFFSET.chunkX+Math.floor(x/32)),chunkY:String(PLANNED_ADDRESS_OFFSET.chunkY+Math.floor(y/26)),localX:(x%32+.5)*32,localY:(y%26+.5)*32});
export function validatePlannedBinding(b){requirePlan([PLANNED_WORLD_VERSION,PLANNED_SHORELINE_VERSION,PLANNED_WATER_VERSION].includes(b?.version)&&/^(alpha|bravo|charlie|fort-deep-fixture|ruin-deep-fixture|crypt-large-fixture|scan-0(0[1-9]|1[0-6]))$/.test(b.assetId),'Unknown planned world binding');for(const k of ['assetHash','planHash','routeHash','planningHash','physicalHash'])requirePlan(/^[a-f0-9]{64}$/.test(b[k]),'Invalid planned world commitment');const {townPrototype,cavePrototype,fortPrototype,ruinPrototype,cryptPrototype,sitePopulation,sitePopulationHash,interiorGeneration,interiorGenerationHash,...base}=b;requirePlan(Object.keys(base).sort().join(',')==='assetHash,assetId,physicalHash,planHash,planningHash,routeHash,version','Unknown planned binding field');if(interiorGeneration!==undefined||interiorGenerationHash!==undefined)requirePlan(interiorGeneration===MULTIROOM_VERSION&&interiorGenerationHash===MULTIROOM_HASH&&sitePopulation===ALPHA_POPULATION_VERSION&&sitePopulationHash===ALPHA_POPULATION_HASH,'Invalid multiroom generation commitment');if(sitePopulation!==undefined||sitePopulationHash!==undefined)requirePlan(sitePopulation===ALPHA_POPULATION_VERSION&&sitePopulationHash===ALPHA_POPULATION_HASH&&b.assetId==='alpha'&&b.assetHash===ALPHA_POPULATION_BASE_HASH&&cryptPrototype===PLANNED_CRYPT_V2,'Invalid Alpha population commitment');if(townPrototype!==undefined)requirePlan([PLANNED_TOWN_VERSION,PLANNED_TOWN_START_VERSION].includes(townPrototype)&&b.assetId==='alpha'&&b.assetHash===PLANNED_TOWN_ASSET_HASH,'Invalid town prototype commitment');if(cavePrototype!==undefined)requirePlan([PLANNED_CAVE_VERSION,PLANNED_CAVE_POPULATION_VERSION].includes(cavePrototype)&&townPrototype===PLANNED_TOWN_START_VERSION&&b.assetId==='alpha','Invalid Cave prototype commitment');if(fortPrototype!==undefined)requirePlan(([PLANNED_FORT_VERSION,PLANNED_FORT_V2].includes(fortPrototype)&&cavePrototype===PLANNED_CAVE_POPULATION_VERSION&&b.assetId==='alpha'||fortPrototype===PLANNED_FORT_V2&&b.assetId==='fort-deep-fixture'&&townPrototype===undefined&&cavePrototype===undefined),'Invalid Fort prototype commitment');if(ruinPrototype!==undefined)requirePlan(([PLANNED_RUIN_VERSION,PLANNED_RUIN_V2].includes(ruinPrototype)&&b.assetId==='alpha'&&fortPrototype===PLANNED_FORT_V2&&cavePrototype===PLANNED_CAVE_POPULATION_VERSION||ruinPrototype===PLANNED_RUIN_V2&&b.assetId==='ruin-deep-fixture'&&!townPrototype&&!fortPrototype&&!cavePrototype),'Invalid Ruin prototype commitment');if(b.assetId==='fort-deep-fixture')requirePlan(b.fortPrototype===PLANNED_FORT_V2&&b.assetHash===DEEP_FORT_FIXTURE_ASSET_HASH,'Isolated Fort fixture requires its explicit binding');if(b.assetId==='ruin-deep-fixture')requirePlan(b.ruinPrototype===PLANNED_RUIN_V2&&b.assetHash===DEEP_RUIN_FIXTURE_ASSET_HASH,'Isolated Ruin fixture requires its explicit binding');if(cryptPrototype!==undefined)requirePlan(([PLANNED_CRYPT_VERSION,PLANNED_CRYPT_V2].includes(cryptPrototype)&&b.assetId==='alpha'&&ruinPrototype===PLANNED_RUIN_V2||cryptPrototype===PLANNED_CRYPT_V2&&b.assetId==='crypt-large-fixture'&&!townPrototype&&!cavePrototype&&!fortPrototype&&!ruinPrototype),'Invalid Crypt binding');if(b.assetId==='crypt-large-fixture')requirePlan(cryptPrototype===PLANNED_CRYPT_V2&&b.assetHash===LARGE_CRYPT_FIXTURE_ASSET_HASH,'Isolated Crypt fixture requires its explicit binding');return b;}
export function validateRuntimePlan(p){
 requirePlan([PLANNED_WORLD_VERSION,PLANNED_SHORELINE_VERSION,PLANNED_WATER_VERSION].includes(p?.version)&&p.exactLandCells===8000,'Planned runtime version/land budget');
 if([PLANNED_SHORELINE_VERSION,PLANNED_WATER_VERSION].includes(p.version)){const s=p.shoreline;requirePlan(s?.version===LOCAL_SHORELINE_VERSION&&s.minimumBandTiles===2&&s.maximumBandTiles===22&&s.coordinateOverlay===false,'Invalid local shoreline policy');for(const k of ['predecessorAssetHash','sourcePolicyHash','realizationHash'])requirePlan(/^[a-f0-9]{64}$/.test(s[k]),'Invalid shoreline commitment');}
 if(p.version===PLANNED_WATER_VERSION){const w=p.waterGeometry;requirePlan(w?.version===LOCAL_WATER_VERSION&&w.receiverDirectionsAvailable===false&&Array.isArray(w.bridgeGuards)&&w.bridgeGuards.length<=64,'Invalid local water policy');for(const k of ['predecessorAssetHash','realizationHash'])requirePlan(/^[a-f0-9]{64}$/.test(w[k]),'Invalid water commitment');for(const b of w.bridgeGuards)requirePlan(Object.keys(b).sort().join(',')==='x1,x2,y1,y2'&&Object.values(b).every(Number.isSafeInteger)&&b.x1<=b.x2&&b.y1<=b.y2&&b.x2-b.x1<=20&&b.y2-b.y1<=20,'Invalid immutable bridge guard');}
 requirePlan(p.scale.tilePixels===32&&p.scale.chunkTilesX===32&&p.scale.chunkTilesY===26&&p.scale.macroTilesX===64&&p.scale.macroTilesY===52,'Planned spatial scale');
 requirePlan(p.settlements.length===20&&p.sites.length===(p.populationOverlay?51:48)&&p.futureIslands.length===6&&p.factions.length===3&&p.stonewatch.candidateCount>0,'Incomplete planned reservations');
 if(p.populationOverlay)requirePlan(p.populationOverlay.version===ALPHA_POPULATION_VERSION&&p.populationOverlay.hash===ALPHA_POPULATION_HASH&&p.populationOverlay.parentAssetHash===ALPHA_POPULATION_BASE_HASH&&p.assetId==='alpha','Uncommitted population overlay');const seen=new Set();let count=0;for(const row of p.cellRows)for(const c of row.cells){const key=c[0]+','+row.y;requirePlan(!seen.has(key)&&c.length===11&&c[1]>=0&&c[1]<p.landmasses.length&&c[2]>=1&&c[2]<=8&&c[3]>=1&&c[3]<=5,'Invalid/overlapping planned cell');seen.add(key);count++;}requirePlan(count===8000,'Missing planned cell');
 for(const list of [p.settlements,p.sites,p.futureIslands,p.factions])requirePlan(new Set(list.map(r=>r.id)).size===list.length,'Duplicate planned destination');
 return p;
}
// Terrain sampling always uses global plan tiles. A chunk edge gets exactly the
// same hydrology/coast/reservation context as any tile inside its neighbor.
export function createPlannedTerrain(p){
 validateRuntimePlan(p);const width=p.domain.width,height=p.domain.height,cells=new Array(width*height).fill(null),landmass=p.landmasses;
 for(const row of p.cellRows)for(const c of row.cells)cells[row.y*width+c[0]]=c;
 const macro=(x,y)=>x>=0&&y>=0&&x<width&&y<height?cells[y*width+x]:null;
 const shoreline=[PLANNED_SHORELINE_VERSION,PLANNED_WATER_VERSION].includes(p.version)?createLocalShoreline(p,macro):null;
 const riverSegments=new Map(),add=(x,y,a,b,w)=>{const k=x+','+y;if(!riverSegments.has(k))riverSegments.set(k,[]);riverSegments.get(k).push([a,b,w]);};
 for(const row of p.cellRows)for(const c of row.cells)if(c[5]>0&&!c[4]){
  const x=c[0],y=row.y,center={x:x*64+32,y:y*52+26},dx=c[6],dy=c[7],radius=c[5]>=3?3:c[5]===2?2:1;
  if(dx||dy){const to={x:center.x+dx*64,y:center.y+dy*52};add(x,y,center,to,radius);add(x+dx,y+dy,center,to,radius);}
  else {
   // The accepted L1A hydrology has channel classifications but zero receiver
   // directions. Join only cardinal classified channel neighbors, on the same
   // landmass; do not fabricate downstream flow or new macro river territory.
   let links=0;for(const [a,b] of [[0,-1],[1,0],[0,1],[-1,0]]){const neighbor=macro(x+a,y+b);if(neighbor&&neighbor[1]===c[1]&&neighbor[5]>0&&!neighbor[4]){add(x,y,center,{x:center.x+a*32,y:center.y+b*26},radius);links++;}}
   if(!links)add(x,y,{x:center.x-8,y:center.y},{x:center.x+8,y:center.y},radius);
   const sides=[[0,-1],[1,0],[0,1],[-1,0]].filter(([a,b])=>!macro(x+a,y+b));if(sides.length){const [a,b]=sides[mixPlan(p.seedDigest+'/outlet/'+x+'/'+y)%sides.length];add(x,y,center,{x:center.x+a*32,y:center.y+b*26},radius);}}
 }
 const waterGeometry=p.version===PLANNED_WATER_VERSION?createLocalWaterGeometry(p,macro,shoreline,riverSegments):null;
 const segmentDistance=(x,y,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,u=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a.x-u*dx,y-a.y-u*dy);};
 function base(x,y){const mx=Math.floor(x/64),my=Math.floor(y/52),c=macro(mx,my);if(!c)return {walkable:false,kind:'ocean',biome:'o',landmassId:null,band:0};const coast=waterGeometry?waterGeometry.coast(x,y):shoreline?.tile(x,y);if(coast?.water)return {walkable:false,kind:'ocean',biome:'o',landmassId:null,band:0};const biome=p.biomeIds[c[2]-1].replace('biome:',''),code=BIOME_CODES[biome],inland=waterGeometry?.inland(x,y);if(inland?.water)return {walkable:false,kind:inland.kind,biome:code,landmassId:landmass[c[1]].id,band:c[3]};if(!waterGeometry&&c[4])return {walkable:false,kind:'lake',biome:code,landmassId:landmass[c[1]].id,band:c[3]};
  for(const [a,b,w] of (!waterGeometry?riverSegments.get(mx+','+my):null)??[])if(segmentDistance(x+.5,y+.5,a,b)<=w)return {walkable:false,kind:'river',biome:code,landmassId:landmass[c[1]].id,band:c[3]};
  const lx=x-mx*64,ly=y-my*52,oldCoastal=(!macro(mx-1,my)&&lx<3)||(!macro(mx+1,my)&&lx>=61)||(!macro(mx,my-1)&&ly<3)||(!macro(mx,my+1)&&ly>=49);
  return {walkable:true,bank:inland?.bank??false,kind:(shoreline?coast?.shore:oldCoastal)?'shore':'land',shoreClassId:coast?.classId??null,biome:code,biomeId:'biome:'+biome,landmassId:landmass[c[1]].id,band:c[3],slope:c[8],geology:c[9],elevation:c[10]};
 }
 return Object.freeze({base,macro,widthTiles:width*64,heightTiles:height*52,riverSegments,shoreline,waterGeometry});
}
