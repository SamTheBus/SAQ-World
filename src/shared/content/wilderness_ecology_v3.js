// Wilderness V3 enemy ecology policy (planning-only, not yet actor spawn authority).
// All IDs are existing World actor families. A coverage gap is not secretly
// filled by a universal Void/Cyber enemy or an unimplemented placeholder.
import {creatureDefinitionForFamily} from './creatures_d11.js';
import {freezeWire} from '../contracts/wire.js';

export const WILDERNESS_ECOLOGY_V3_VERSION='wilderness-ecology-v3-planning-1';
export const WILDERNESS_ECOLOGY_BIOMES=Object.freeze(['woodland','grassland','wetland','upland','desert','frostland','tropical','volcanic']);
export const WILDERNESS_ECOLOGY_SITE_FAMILIES=Object.freeze(['cave','ruin','fort','crypt']);
export const WILDERNESS_ECOLOGY_TIERS=Object.freeze(['small','standard','large','deep']);

// Site distinctions are deliberate: no standard biome-universal spawn pool.
// These are proposed occupants, not authority-approved actor placements.
export const WILDERNESS_ECOLOGY_V3_MATRIX=freezeWire({
 woodland:{surface:['sprout','slime','thorn_wyrm'],cave:['rust_nibbler','slime','golem'],ruin:['cursed_blade','gargoyle','sprout'],fort:['animated_armor','golem'],crypt:['cursed_blade','gargoyle']},
 grassland:{surface:['thorn_wyrm'],cave:['thorn_wyrm'],ruin:[],fort:[],crypt:[]},
 wetland:{surface:['toxic_fly','marsh_ghost'],cave:['swamp_basilisk','corroded_golem'],ruin:['marsh_ghost'],fort:['corroded_golem'],crypt:['marsh_ghost']},
 upland:{surface:['wyrmling','gilded_scuttler'],cave:['gilded_scuttler','wyrmling'],ruin:['mimic_shield','gilded_scuttler'],fort:['mimic_shield','gilded_scuttler'],crypt:['mimic_shield']},
 desert:{surface:[],cave:[],ruin:[],fort:[],crypt:[]},
 frostland:{surface:['wyrmling','gilded_scuttler'],cave:['wyrmling','gilded_scuttler'],ruin:['mimic_shield'],fort:['mimic_shield','gilded_scuttler'],crypt:['mimic_shield']},
 tropical:{surface:['thorn_wyrm'],cave:['thorn_wyrm'],ruin:[],fort:[],crypt:[]},
 volcanic:{surface:['hell_bat','lava_serpent'],cave:['slag_slime','hell_bat'],ruin:['magma_elemental','slag_slime'],fort:['magma_elemental','lava_serpent'],crypt:[]}
});

// Review-only boss targets. Confirm native arena floor, identity, geometry,
// persistence and progression before any runtime binding. Arachnid Treant
// currently lacks a suitably large/deep Woodland reservation.
export const WILDERNESS_ECOLOGY_BOSS_CANDIDATES=freezeWire({
 'repeatable-slot:fort:upland:deep:01':{bossId:'aegis_goliath',support:['mimic_shield'],status:'needs-native-arena-validation'},
 'repeatable-slot:ruin:volcanic:large:01':{bossId:'brimstone_colossus',support:['magma_elemental','slag_slime'],status:'needs-native-arena-validation'}
});

export const WILDERNESS_ECOLOGY_STARTER_SITES=freezeWire({
 'repeatable-slot:cave:woodland:small:089':{role:'starter-cave',enemyTheme:'rust-nibblers-and-slimes'},
 'repeatable-slot:fort:woodland:standard:01':{role:'starter-elite-fort',enemyTheme:'animated-armour-and-golems'},
 'repeatable-slot:ruin:woodland:standard:054':{role:'advanced-ruin',enemyTheme:'gargoyle-and-cursed-blades'}
});

// Rare imported anomaly themes are NOT in the surface pools. Later activation
// must be explicitly gated by site theme, not broad legacy metadata.
export const WILDERNESS_ECOLOGY_RARE_SITE_THEMES=freezeWire({
 void:['void_crawler','void_spectre','void_wraith','void_orb','rift_drifter'],
 clockwork:['clockwork_scarab','clockwork_drone','temporal_watcher','star_weaver'],
 arcane:['neon_spider','wireframe_orb','cyber_wraith','coin_elemental']
});

const hash=value=>{let n=2166136261;for(const ch of String(value))n=Math.imul(n^ch.charCodeAt(0),16777619)>>>0;return n;};
for(const [biome,roles] of Object.entries(WILDERNESS_ECOLOGY_V3_MATRIX)){
 if(!WILDERNESS_ECOLOGY_BIOMES.includes(biome))throw Error('Invalid V3 biome '+biome);
 for(const [role,families] of Object.entries(roles)){
  if(role!=='surface'&&!WILDERNESS_ECOLOGY_SITE_FAMILIES.includes(role))throw Error('Invalid V3 role');
  if(new Set(families).size!==families.length)throw Error('Duplicate V3 family');
  for(const family of families)if(!creatureDefinitionForFamily(family))throw Error('Unknown existing V3 creature '+family);
 }
}
for(const f of Object.values(WILDERNESS_ECOLOGY_RARE_SITE_THEMES).flat())if(!creatureDefinitionForFamily(f))throw Error('Unknown exotic creature '+f);

export function planWildernessSiteEcologyV3(selection){
 const siteId=selection?.id,biome=selection?.biome,tier=selection?.tier,
 family=selection?.familyId?.split(':')[1];
 if(typeof siteId!=='string'||!WILDERNESS_ECOLOGY_BIOMES.includes(biome)||!WILDERNESS_ECOLOGY_SITE_FAMILIES.includes(family)||!WILDERNESS_ECOLOGY_TIERS.includes(tier))throw Error('Invalid wilderness ecology selection');
 const pool=WILDERNESS_ECOLOGY_V3_MATRIX[biome][family],offset=pool.length?hash(siteId)%pool.length:0;
 const occupants=pool.length?pool.map((_,i)=>pool[(i+offset)%pool.length]):[];
 const reviewBoss=WILDERNESS_ECOLOGY_BOSS_CANDIDATES[siteId]??null;
 if(reviewBoss&&!['large','deep'].includes(tier))throw Error('V3 boss candidate has undersized tier');
 const primaryRole=reviewBoss?'boss-candidate':tier==='small'?'ordinary':tier==='standard'?'elite-candidate':'hard-elite-candidate';
 return freezeWire({version:WILDERNESS_ECOLOGY_V3_VERSION,siteId,biome,family,tier,
  occupants,coverage:occupants.length?'existing-families':'needs-new-biome-family',primaryRole,
  boss:reviewBoss,starter:WILDERNESS_ECOLOGY_STARTER_SITES[siteId]??null,
  rareAnomalyEligible:family==='ruin'||family==='crypt',
  // Nothing here creates actors, loot, rewards, identities or persisted records.
  activation:'planning-only'});
}

export function auditWildernessEcologyV3(selections){
 if(!Array.isArray(selections))throw Error('Expected selections');
 const seen=new Set(),entries=selections.map(s=>{
  const x=planWildernessSiteEcologyV3(s);
  if(seen.has(x.siteId))throw Error('Duplicate site');seen.add(x.siteId);return x;
 });
 const byBiome=Object.fromEntries(WILDERNESS_ECOLOGY_BIOMES.map(biome=>[biome,{sites:0,coverageGaps:0}]));
 for(const item of entries){byBiome[item.biome].sites++;if(item.coverage==='needs-new-biome-family')byBiome[item.biome].coverageGaps++;}
 return freezeWire({version:WILDERNESS_ECOLOGY_V3_VERSION,siteCount:entries.length,bossCandidates:entries.filter(e=>e.boss).map(e=>({siteId:e.siteId,bossId:e.boss.bossId})),byBiome,entries});
}
