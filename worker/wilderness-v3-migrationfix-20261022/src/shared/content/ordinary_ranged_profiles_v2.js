import {ordinaryEnemyForProfile} from './ordinary_enemies.js';

// Runtime behavior adaptation: preserve immutable catalog IDs, budgets, saved
// actor profiles and roster provenance. Existing five caster profiles are exact.
export const CLOCKWORK_DRONE_RANGED=Object.freeze({
 projectileType:'clockwork',speed:4.2,radius:6,lifeTicks:80,travelRange:336,
 range:220,preferredRange:140,minimumRange:60,windupTicks:24,recoveryTicks:12,
 meleeFallback:true
});
export const LAVA_SERPENT_RANGED=Object.freeze({
 projectileType:'fireball',speed:3.2,radius:6,lifeTicks:80,travelRange:256,
 range:210,preferredRange:0,minimumRange:84,windupTicks:32,recoveryTicks:14,
 cooldownTicks:150,muzzleOffset:14.2,meleeFallback:true
});
export function ordinaryRangedProfile(actor){
 const enemy=ordinaryEnemyForProfile(actor?.contentDefinitionId);
 return enemy?.family==='clockwork_drone'?CLOCKWORK_DRONE_RANGED:enemy?.family==='lava_serpent'?LAVA_SERPENT_RANGED:enemy?.ranged??null;
}
