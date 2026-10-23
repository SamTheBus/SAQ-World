// Read-only Wilderness V3.6 ecology inspection. No actor, reward or save mutation.
import {ALPHA_POPULATION_SELECTIONS} from '../shared/content/alpha_site_population_v1.js';
import {WILDERNESS_SITE_SELECTIONS} from '../shared/content/wilderness_v2.js';
import {WILDERNESS_ECOLOGY_BIOMES,WILDERNESS_ECOLOGY_SITE_FAMILIES,WILDERNESS_ECOLOGY_V3_MATRIX,WILDERNESS_V3_STARTER_POOLS} from '../shared/content/wilderness_ecology_v3.js';
import {wildernessSiteEcologyV3_5,wildernessSurfaceEcologyV3_5} from '../shared/content/wilderness_ecology_runtime_v3_5.js';
import {ORDINARY_ENEMIES} from '../shared/content/ordinary_enemies.js';

export const WILDERNESS_ECOLOGY_ATLAS_VERSION='wilderness-v3-6-ecology-inspection-1';
export const WILDERNESS_ATLAS_CONCEPTS=Object.freeze({
 desert:[{name:'Dune Strider',place:'Surface · Caves',description:'Segmented sandstone scorpion with a charged tail strike'},
         {name:'Sunbound Warden',place:'Forts · Ruins',description:'Ancient sandstone guardian with a curved blade'},
         {name:'Tomb Scarab',place:'Crypts · Ruins',description:'Obsidian beetle with luminous funerary markings'}],
 grassland:[{name:'Banner Outrider',place:'Forts',description:'Nomad lancer defending hillside encampments'},
            {name:'Hollow Spearman',place:'Ruins · Crypts',description:'Restless warrior of an abandoned battlefield'}],
 tropical:[{name:'Vinebound Guardian',place:'Ruins · Forts',description:'Temple sentinel overgrown with living vines'},
           {name:'Jungle Lantern',place:'Crypts',description:'Luminous spirit of drowned chambers'}]
});
const unique=values=>[...new Set(values)];
const names=Object.fromEntries(ORDINARY_ENEMIES.map(a=>[a.family,a.name]));
export const wildernessCreatureNameV3_6=id=>names[id]??id.replaceAll('_',' ');
export function buildWildernessEcologyAtlasV3_6(){
 const selections=[...ALPHA_POPULATION_SELECTIONS,...WILDERNESS_SITE_SELECTIONS];
 const sites=selections.map(row=>{
  const family=row.familyId.split(':').at(-1),starter=WILDERNESS_V3_STARTER_POOLS[row.id],
   site={familyId:row.familyId,sizeTier:row.tier,socket:{region:{biome:row.biome},provenance:{reservationId:row.id}},floors:[{index:0}]},
   spec=starter?null:wildernessSiteEcologyV3_5(site,0);
  if(!starter&&!spec)throw Error('Unrecognized committed site '+row.id);
  const v1=starter?{ranged:[],melee:starter.melee}:spec.v1,v2=starter?{families:[]}:spec.v2;
  const ranged=[...v1.ranged],melee=[...v1.melee],extra=[...v2.families],all=unique([...ranged,...melee,...extra]);
  return {id:row.id,biome:row.biome,family,tier:row.tier,band:row.band,
    starter:Boolean(starter),status:starter?'starter':all.length?'covered':'gap',
    ranged,melee,extra,all,labels:all.map(wildernessCreatureNameV3_6),
    rareEligible:!starter&&['ruin','crypt'].includes(family)&&all.length>0};
 });
 const biomes=WILDERNESS_ECOLOGY_BIOMES.map(id=>{
  const rows=sites.filter(s=>s.biome===id),surface=wildernessSurfaceEcologyV3_5(id);
  if(!surface)throw Error('Missing active biome '+id);
  const surfaceFamilies=unique([...surface.v1.ranged,...surface.v1.melee,...surface.v2.families]);
  const roles=Object.fromEntries(WILDERNESS_ECOLOGY_SITE_FAMILIES.map(family=>{
   const records=rows.filter(s=>s.family===family);
   return [family,{total:records.length,gaps:records.filter(s=>s.status==='gap').length}];
  }));
  return {id,total:rows.length,covered:rows.filter(s=>s.status!=='gap').length,
    gaps:rows.filter(s=>s.status==='gap').length,roles,surfaceFamilies,
    surfaceLabels:surfaceFamilies.map(wildernessCreatureNameV3_6)};
 });
 const totals={sites:sites.length,covered:sites.filter(s=>s.status!=='gap').length,
  gaps:sites.filter(s=>s.status==='gap').length,starters:sites.filter(s=>s.starter).length};
 if(totals.sites!==108||totals.covered!==74||totals.gaps!==34||totals.starters!==3)
  throw Error('Approved ecology changed; audit needs revision');
 return {version:WILDERNESS_ECOLOGY_ATLAS_VERSION,totals,sites,biomes,
  priorities:biomes.filter(b=>b.gaps>0).sort((a,b)=>b.gaps-a.gaps).map(b=>b.id),
  proposed:WILDERNESS_ATLAS_CONCEPTS,prototypesLive:false};
}
