import {freezeWire} from '../contracts/wire.js';

export const DUNGEON_MOBS_V2_VERSION='world-dungeon-mob-batch-v2';
export const DUNGEON_MOBS_V2_SOURCE_COMMIT='387c78bfaf9f492fe7b6ff4539b956c12c2a7cdc';
export const DUNGEON_MOB_FAMILIES_V2=Object.freeze(['gilded_scuttler','mimic_shield','void_crawler','void_spectre','void_wraith','rift_drifter','clockwork_scarab','star_weaver','coin_elemental','temporal_watcher','clockwork_drone','neon_spider','wireframe_orb','cyber_wraith']);

// All fourteen source species use the generic ordinary contact path: speed
// 1.35, reach 20, stop distance 14 and a 60-tick attack cooldown. None belongs
// to lifecycle.js's five ranged types or its two relentless types. Their names
// and art do not grant projectiles, card passives, boss powers or rare rewards.
// HP/attack budgets and distinct telegraphs below are explicit World choices
// inside the existing ordinary-mob envelope, without changing earlier mobs.
const source='SAQ Dungeon '+DUNGEON_MOBS_V2_SOURCE_COMMIT+': bestiary_data.js names; lifecycle.js ordinary classification; mob_combat.js generic contact behavior; World deterministic adaptation';
const specs=[
 ['gilded_scuttler','Gilded Scuttler',42,6],
 ['mimic_shield','Mimic Shield',60,7],
 ['void_crawler','Void Crawler',48,7],
 ['void_spectre','Void Spectre',45,6],
 ['void_wraith','Void Wraith',48,7],
 ['rift_drifter','Rift Drifter',45,7],
 ['clockwork_scarab','Clockwork Scarab',50,6],
 ['star_weaver','Star Weaver',48,7],
 ['coin_elemental','Coin Elemental',55,7],
 ['temporal_watcher','Temporal Watcher',55,8],
 ['clockwork_drone','Clockwork Drone',45,6],
 ['neon_spider','Neon Spider',42,6],
 ['wireframe_orb','Wireframe Orb',45,6],
 ['cyber_wraith','Cyber Wraith',48,7]
];

export const DUNGEON_MOBS_V2_ENEMIES=freezeWire(specs.map(([family,name,hp,damage],index)=>{
 const enemyDefinitionId='def:d410'+(index+19).toString(16).padStart(28,'0');
 return {enemyDefinitionId,contentDefinitionId:enemyDefinitionId,kind:'ordinaryEnemyDefinition',family,name,
  body:{width:24,height:24,hullRadius:10,combatRadius:10.8},visual:'dungeon-mobs-v2-'+family.replaceAll('_','-'),
  behavior:'standard-melee',moveSpeed:1.35,
  attack:{reach:20,delayTicks:60,awareness:260,stopDistance:14},budget:{hp,damage},
  sourceVersion:'SAQ-Dungeon-main@'+DUNGEON_MOBS_V2_SOURCE_COMMIT,source};
}));

// Dungeon's Mountain Peaks, Void Singularity, Temporal Sanctorum and Cyberspace
// Nexus are sector themes rather than World biome identities. World places the
// mountain pair in upland/frostland and the later themes through retained site
// roster overlays. These eligibility rows never alter loot or combat mechanics.
const sites=['world','woodland-ruin','woodland-cave','woodland-fort','procedural-fort','procedural-ruin','procedural-crypt'];
const allBiomes=['woodland','grassland','wetland','upland','desert','frostland','tropical','volcanic'];
const meta=(biomes,threatCategory)=>({eligibility:{biomes,sites:[...sites]},threatCategory,rewardCategory:'ordinary-gear'});
export const DUNGEON_MOBS_V2_METADATA=freezeWire({
 gilded_scuttler:meta(['upland','frostland'],'ordinary-skirmisher'),
 mimic_shield:meta(['upland','frostland'],'ordinary-heavy'),
 void_crawler:meta([...allBiomes],'ordinary-skirmisher'),
 void_spectre:meta([...allBiomes],'ordinary-skirmisher'),
 void_wraith:meta([...allBiomes],'ordinary-skirmisher'),
 rift_drifter:meta([...allBiomes],'ordinary-skirmisher'),
 clockwork_scarab:meta([...allBiomes],'ordinary-light'),
 star_weaver:meta([...allBiomes],'ordinary-skirmisher'),
 coin_elemental:meta([...allBiomes],'ordinary-heavy'),
 temporal_watcher:meta([...allBiomes],'ordinary-heavy'),
 clockwork_drone:meta([...allBiomes],'ordinary-light'),
 neon_spider:meta([...allBiomes],'ordinary-skirmisher'),
 wireframe_orb:meta([...allBiomes],'ordinary-light'),
 cyber_wraith:meta([...allBiomes],'ordinary-skirmisher')
});

export const DUNGEON_MOBS_V2_MELEE_MOTION=freezeWire({
 gilded_scuttler:{windupTicks:6,impactTicks:2,recoveryTicks:6},
 mimic_shield:{windupTicks:18,impactTicks:3,recoveryTicks:13},
 void_crawler:{windupTicks:8,impactTicks:3,recoveryTicks:8},
 void_spectre:{windupTicks:10,impactTicks:3,recoveryTicks:9},
 void_wraith:{windupTicks:14,impactTicks:3,recoveryTicks:10},
 rift_drifter:{windupTicks:12,impactTicks:3,recoveryTicks:9},
 clockwork_scarab:{windupTicks:9,impactTicks:2,recoveryTicks:7},
 star_weaver:{windupTicks:17,impactTicks:3,recoveryTicks:11},
 coin_elemental:{windupTicks:16,impactTicks:3,recoveryTicks:12},
 temporal_watcher:{windupTicks:20,impactTicks:3,recoveryTicks:13},
 clockwork_drone:{windupTicks:11,impactTicks:2,recoveryTicks:8},
 neon_spider:{windupTicks:7,impactTicks:2,recoveryTicks:7},
 wireframe_orb:{windupTicks:15,impactTicks:3,recoveryTicks:10},
 cyber_wraith:{windupTicks:13,impactTicks:3,recoveryTicks:11}
});
