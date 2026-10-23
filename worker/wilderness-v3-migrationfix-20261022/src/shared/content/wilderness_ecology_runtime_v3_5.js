// Wilderness V3.5: biome population adapter. Uses committed V3 matrix
// without rewriting actors, terrain, levels, rewards, or prior roster history.
import {WILDERNESS_ECOLOGY_V3_MATRIX,WILDERNESS_ECOLOGY_RARE_SITE_THEMES,isWildernessStarterSiteV3} from './wilderness_ecology_v3.js';
import {WILDERNESS_SITE_SELECTIONS} from './wilderness_v2.js';
import {ALPHA_POPULATION_SELECTIONS} from './alpha_site_population_v1.js';
import {DUNGEON_RANGED_FAMILIES_V1} from './dungeon_mobs_v1.js';
import {DUNGEON_MOB_FAMILIES_V2} from './dungeon_mobs_v2.js';
import {hashReward} from './economy_rewards.js';
export const WILDERNESS_ECOLOGY_RUNTIME_V3_5_VERSION='wilderness-v3-5-biome-rosters-1';
export const WILDERNESS_ECOLOGY_RUNTIME_V3_5_PREFIX='wilderness-v3-5-ecology';
const approved=new Map([...ALPHA_POPULATION_SELECTIONS,...WILDERNESS_SITE_SELECTIONS].map(row=>[row.id,row]));
const ranged=new Set(DUNGEON_RANGED_FAMILIES_V1),batch2=new Set(DUNGEON_MOB_FAMILIES_V2);
export const isWildernessEcologyRosterV3_5=key=>typeof key==='string'&&key.startsWith(WILDERNESS_ECOLOGY_RUNTIME_V3_5_PREFIX+':');
function habitat(biome,role,key,seed,anomaly=null){
 const raw=WILDERNESS_ECOLOGY_V3_MATRIX[biome]?.[role];if(!raw)return null;
 const offset=raw.length?hashReward(WILDERNESS_ECOLOGY_RUNTIME_V3_5_VERSION+'/'+seed)%raw.length:0;
 const ordered=raw.map((_,i)=>raw[(i+offset)%raw.length]),first=ordered.filter(f=>!batch2.has(f));
 const second=anomaly?[...WILDERNESS_ECOLOGY_RARE_SITE_THEMES[anomaly]]:ordered.filter(f=>batch2.has(f));
 return {key,biome,role,coverage:raw.length?'native-family':'needs-new-biome-family',
   v1:{key,ranged:first.filter(f=>ranged.has(f)),melee:first.filter(f=>!ranged.has(f))},
   v2:{key,families:second,rareAnomaly:anomaly}};
}
export function wildernessSurfaceEcologyV3_5(biome){
 if(!Object.hasOwn(WILDERNESS_ECOLOGY_V3_MATRIX,biome))return null;
 return habitat(biome,'surface',WILDERNESS_ECOLOGY_RUNTIME_V3_5_PREFIX+':surface:'+biome,biome);
}
export function wildernessSiteEcologyV3_5(site,floorIndex=0){
 const id=site?.socket?.provenance?.reservationId,row=approved.get(id);
 if(!row||!Array.isArray(site?.floors)||!Number.isSafeInteger(floorIndex)||floorIndex<0||floorIndex>=site.floors.length||isWildernessStarterSiteV3(site))return null;
 const family=site.familyId?.split(':').at(-1)??site.siteKind?.replace('procedural-','');
 if(row.biome!==site.socket?.region?.biome||row.familyId!=='site-family:'+family||row.tier!==site.sizeTier)return null;
 const pool=WILDERNESS_ECOLOGY_V3_MATRIX[row.biome]?.[family];if(!pool)return null;
 const rare=pool.length>0&&floorIndex>0&&['ruin','crypt'].includes(family)&&hashReward(id+'/floor/'+floorIndex+'/rare')%11===0;
 const anomaly=rare?(family==='crypt'?'void':'arcane'):null;
 return habitat(row.biome,family,WILDERNESS_ECOLOGY_RUNTIME_V3_5_PREFIX+':site:'+id+':floor:'+floorIndex+(anomaly?':'+anomaly:''),id+'/'+floorIndex,anomaly);
}
export const WILDERNESS_ECOLOGY_V3_5_COVERAGE=Object.freeze([...approved.values()].reduce((a,x)=>{
 a.total++;if(WILDERNESS_ECOLOGY_V3_MATRIX[x.biome]?.[x.familyId.split(':').at(-1)]?.length)a.covered++;else a.gaps++;return a;
},{total:0,covered:0,gaps:0}));
