import {freezeWire,requireContract as check} from '../contracts/wire.js';
import {ORDINARY_ENEMIES,ordinaryEnemyForProfile} from './ordinary_enemies.js';
import {CREATURE_PRESENTATION_D11_1_VERSION,creaturePresentationD11_1} from './creature_presentation_d11_1.js';

export const CREATURE_BATCH_D11_VERSION='world-creature-foundation-d11-v1';

const old={
 sprout:{visualKey:'h4a-sprout',sourceProvenance:'SAQ Dungeon H4A World baseline',eligibility:{biomes:['woodland'],sites:['world','woodland-ruin','woodland-cave','woodland-fort']},threatCategory:'ordinary-light',rewardCategory:'ordinary-gear'},
 golem:{visualKey:'h4a-golem',sourceProvenance:'SAQ Dungeon H4A World baseline',eligibility:{biomes:['woodland'],sites:['world','woodland-cave','woodland-fort']},threatCategory:'ordinary-heavy',rewardCategory:'ordinary-gear'},
 slime:{visualKey:'h4a-slime',sourceProvenance:'SAQ Dungeon H4A World baseline',eligibility:{biomes:['woodland'],sites:['world','woodland-ruin','woodland-cave','woodland-fort']},threatCategory:'ordinary-light',rewardCategory:'ordinary-gear'}
};
const added={
 gargoyle:{visualKey:'d11-gargoyle-warden',sourceProvenance:'SAQ-Dungeon-main (4): bestiary_data.js + mob_renderer.js gargoyle; World melee authority',eligibility:{biomes:['woodland'],sites:['woodland-ruin']},threatCategory:'site-warden',rewardCategory:'ordinary-gear'},
 rust_nibbler:{visualKey:'d11-rust-nibbler',sourceProvenance:'SAQ-Dungeon-main (4): bestiary_data.js + mob_renderer.js rust_nibbler; World melee authority',eligibility:{biomes:['woodland'],sites:['woodland-cave']},threatCategory:'site-skirmisher',rewardCategory:'ordinary-gear'},
 animated_armor:{visualKey:'d11-animated-armor',sourceProvenance:'SAQ-Dungeon-main (4): bestiary_data.js + mob_renderer.js animated_armor; World melee authority',eligibility:{biomes:['woodland'],sites:['woodland-fort']},threatCategory:'site-guard',rewardCategory:'ordinary-gear'},
 cursed_blade:{visualKey:'d11-cursed-blade',sourceProvenance:'SAQ-Dungeon-main (4): bestiary_data.js + mob_renderer.js cursed_blade; ancient-haunted World presentation + World melee authority',eligibility:{biomes:['woodland'],sites:['woodland-ruin']},threatCategory:'site-skirmisher',rewardCategory:'ordinary-gear'}
};

export const WORLD_CREATURES_D11=freezeWire(ORDINARY_ENEMIES.map(enemy=>{
 const meta=old[enemy.family]??added[enemy.family];check(meta&&meta.visualKey===enemy.visual,'Creature visual key mismatch');
 const presentation=creaturePresentationD11_1(enemy.family);check(presentation,'Missing creature presentation');
 return {version:CREATURE_BATCH_D11_VERSION,presentationVersion:CREATURE_PRESENTATION_D11_1_VERSION,enemyDefinitionId:enemy.enemyDefinitionId,family:enemy.family,visualKey:meta.visualKey,name:enemy.name,
  sourceProvenance:meta.sourceProvenance,body:{width:enemy.body.width,height:enemy.body.height,groundAnchorY:presentation.groundAnchor.y},
  collisionHull:enemy.body.hullRadius,combatHull:enemy.body.combatRadius,movement:{authority:'simpleMelee',speed:enemy.moveSpeed},
  attackTiming:{reach:enemy.attack.reach,delayTicks:enemy.attack.delayTicks,awareness:enemy.attack.awareness,stopDistance:enemy.attack.stopDistance},
  eligibility:meta.eligibility,threatCategory:meta.threatCategory,rewardCategory:meta.rewardCategory,
  presentation,
  provenance:{spawn:'site-member-index + stable siteId hash',encounter:'immutable package roster + encounter groupId'}};
}));

export const creatureDefinitionForFamily=family=>WORLD_CREATURES_D11.find(row=>row.family===family)??null;
export function creatureDefinitionForProfile(profileId){const enemy=ordinaryEnemyForProfile(profileId);return enemy?creatureDefinitionForFamily(enemy.family):null;}

export function deterministicCreatureVisualSeed(entityId){
 let h=2166136261;for(let i=0;i<entityId.length;i++){h^=entityId.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;
}
