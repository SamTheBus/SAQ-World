import {freezeWire} from '../contracts/wire.js';

export const DUNGEON_MOBS_V1_VERSION='world-dungeon-mob-batch-v1';
export const DUNGEON_MOBS_V1_SOURCE_COMMIT='387c78bfaf9f492fe7b6ff4539b956c12c2a7cdc';
export const DUNGEON_MOB_FAMILIES_V1=Object.freeze(['thorn_wyrm','wyrmling','magma_elemental','lava_serpent','hell_bat','slag_slime','swamp_basilisk','toxic_fly','marsh_ghost','corroded_golem','void_orb']);
export const DUNGEON_RANGED_FAMILIES_V1=Object.freeze(['thorn_wyrm','wyrmling','magma_elemental','toxic_fly','void_orb']);

// Source: lifecycle.js ordinary rangedTypes/projectile mapping and mob_combat.js
// ordinary movement, 220px fire range, 140/60px distance keeping and 4.2px shot.
// World bounds each shot to 80 ticks/336px instead of Dungeon's 180/756; the
// source 90-150 tick random cooldown becomes a deterministic 120 tick cadence.
// Species HP/attack budgets and telegraphs below are explicit World adaptations
// within the established ordinary-mob envelope, not imported card/boss effects.
const ranged=(projectileType,windupTicks)=>({projectileType,speed:4.2,radius:6,lifeTicks:80,travelRange:336,range:220,preferredRange:140,minimumRange:60,cooldownTicks:120,windupTicks,recoveryTicks:12});
const source='SAQ Dungeon '+DUNGEON_MOBS_V1_SOURCE_COMMIT+': bestiary_data.js names; lifecycle.js ordinary classification; mob_combat.js ordinary behavior; World deterministic adaptation';
const specs=[
 ['thorn_wyrm','Thorn Wyrm',45,6,ranged('thorn',18)],
 ['wyrmling','Frost Wyrmling',48,6,ranged('frost',22)],
 ['magma_elemental','Magma Elemental',50,7,ranged('fireball',24)],
 ['lava_serpent','Lava Serpent',48,7,null],
 ['hell_bat','Hell Bat',42,6,null],
 ['slag_slime','Slag Slime',50,7,null],
 ['swamp_basilisk','Swamp Basilisk',55,7,null],
 ['toxic_fly','Toxic Fly',42,6,ranged('maelstrom',16)],
 ['marsh_ghost','Marsh Ghost',45,6,null],
 ['corroded_golem','Corroded Golem',60,8,null],
 ['void_orb','Void Orb',45,7,ranged('void',22)]
];

export const DUNGEON_MOBS_V1_ENEMIES=freezeWire(specs.map(([family,name,hp,damage,shot],index)=>{
 const enemyDefinitionId='def:d410'+(index+8).toString(16).padStart(28,'0'),relentless=family==='corroded_golem';
 return {enemyDefinitionId,contentDefinitionId:enemyDefinitionId,kind:'ordinaryEnemyDefinition',family,name,
  body:{width:24,height:24,hullRadius:10,combatRadius:10.8},visual:'dungeon-mobs-v1-'+family.replaceAll('_','-'),
  behavior:shot?'ranged-skirmisher':relentless?'relentless-melee':'standard-melee',moveSpeed:relentless?1.8:1.35,
  attack:{reach:20,delayTicks:shot?shot.cooldownTicks:60,awareness:260,stopDistance:14},budget:{hp,damage},
  ...(shot?{ranged:shot}:{}),sourceVersion:'SAQ-Dungeon-main@'+DUNGEON_MOBS_V1_SOURCE_COMMIT,source};
}));

const sites=['world','woodland-ruin','woodland-cave','woodland-fort','procedural-fort','procedural-ruin','procedural-crypt'];
const meta=(biomes,threatCategory)=>({eligibility:{biomes,sites:[...sites]},threatCategory,rewardCategory:'ordinary-gear'});
export const DUNGEON_MOBS_V1_METADATA=freezeWire({
 thorn_wyrm:meta(['woodland','grassland','tropical'],'ordinary-ranged'),
 wyrmling:meta(['upland','frostland'],'ordinary-ranged'),
 magma_elemental:meta(['volcanic'],'ordinary-ranged'),
 lava_serpent:meta(['volcanic'],'ordinary-skirmisher'),
 hell_bat:meta(['volcanic'],'ordinary-skirmisher'),
 slag_slime:meta(['volcanic'],'ordinary-heavy'),
 swamp_basilisk:meta(['wetland'],'ordinary-heavy'),
 toxic_fly:meta(['wetland'],'ordinary-ranged'),
 marsh_ghost:meta(['wetland'],'ordinary-skirmisher'),
 corroded_golem:meta(['wetland'],'ordinary-heavy'),
 void_orb:meta(['woodland','grassland','wetland','upland','desert','frostland','tropical','volcanic'],'ordinary-ranged')
});

export const DUNGEON_MOBS_V1_MELEE_MOTION=freezeWire({
 lava_serpent:{windupTicks:10,impactTicks:3,recoveryTicks:8},
 hell_bat:{windupTicks:6,impactTicks:2,recoveryTicks:6},
 slag_slime:{windupTicks:13,impactTicks:3,recoveryTicks:11},
 swamp_basilisk:{windupTicks:12,impactTicks:3,recoveryTicks:10},
 marsh_ghost:{windupTicks:9,impactTicks:3,recoveryTicks:9},
 corroded_golem:{windupTicks:16,impactTicks:3,recoveryTicks:13}
});
