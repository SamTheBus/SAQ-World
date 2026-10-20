import { freezeWire, canonicalStringify, requireContract } from '../contracts/wire.js';
import { combatIntegerWire } from '../contracts/combat_integer.js';
import { resolveThreatPower, THREAT_TIERS, BASELINE_PROGRESSION_POWER } from '../contracts/threat_power.js';
import {DUNGEON_MOBS_V1_ENEMIES} from './dungeon_mobs_v1.js';
export {DUNGEON_MOBS_V1_ENEMIES} from './dungeon_mobs_v1.js';
export const ORDINARY_CATALOG_VERSION='d11-world-creatures-v1';
// Dungeon's source threshold remains part of the immutable content catalog.
// World applies a modest runtime acquisition adaptation without changing that
// persisted content provenance or any attack/activation distance.
export const DUNGEON_ORDINARY_ACQUIRE_RANGE=260;
export const ORDINARY_ACQUIRE_RANGE=320;
export const ORDINARY_ACQUIRE_RANGES=Object.freeze([DUNGEON_ORDINARY_ACQUIRE_RANGE,ORDINARY_ACQUIRE_RANGE]);
export const LEGACY_ORDINARY_ENEMIES=freezeWire([
  {enemyDefinitionId:'def:d4100000000000000000000000000001',kind:'ordinaryEnemyDefinition',family:'sprout',name:'Eldritch Sprout',
    body:{width:24,height:24,hullRadius:10,combatRadius:10.8},visual:'h4a-sprout',behavior:'standard-melee',moveSpeed:1.35,
    attack:{reach:20,delayTicks:60,awareness:260,stopDistance:14},budget:{hp:45,damage:6},sourceVersion:'H4A',source:'bestiary_data.js / lifecycle.js / mob_combat.js'},
  {enemyDefinitionId:'def:d4100000000000000000000000000002',kind:'ordinaryEnemyDefinition',family:'golem',name:'Stone Golem',
    body:{width:24,height:24,hullRadius:10,combatRadius:10.8},visual:'h4a-golem',behavior:'relentless-melee',moveSpeed:1.8,
    attack:{reach:20,delayTicks:60,awareness:260,stopDistance:14},budget:{hp:60,damage:8},sourceVersion:'H4A',source:'bestiary_data.js / lifecycle.js / mob_combat.js'}
,
  {enemyDefinitionId:'def:d4100000000000000000000000000003',kind:'ordinaryEnemyDefinition',family:'slime',name:'Green Slime',
    body:{width:24,height:24,hullRadius:10,combatRadius:10.8},visual:'h4a-slime',behavior:'standard-melee',moveSpeed:1.35,
    attack:{reach:20,delayTicks:60,awareness:260,stopDistance:14},budget:{hp:45,damage:6},sourceVersion:'H4A',source:'bestiary_data.js / lifecycle.js / mob_combat.js'}
,
  {enemyDefinitionId:'def:d4100000000000000000000000000004',kind:'ordinaryEnemyDefinition',family:'gargoyle',name:'Gargoyle Warden',
    body:{width:24,height:24,hullRadius:10,combatRadius:10.8},visual:'d11-gargoyle-warden',behavior:'standard-melee',moveSpeed:1.45,
    attack:{reach:20,delayTicks:60,awareness:260,stopDistance:14},budget:{hp:55,damage:7},sourceVersion:'SAQ-Dungeon-main (4)',source:'bestiary_data.js / mob_renderer.js; World D11 deterministic melee adaptation'},
  {enemyDefinitionId:'def:d4100000000000000000000000000005',kind:'ordinaryEnemyDefinition',family:'rust_nibbler',name:'Rust Nibbler',
    body:{width:24,height:24,hullRadius:10,combatRadius:10.8},visual:'d11-rust-nibbler',behavior:'standard-melee',moveSpeed:1.6,
    attack:{reach:20,delayTicks:54,awareness:260,stopDistance:14},budget:{hp:42,damage:6},sourceVersion:'SAQ-Dungeon-main (4)',source:'bestiary_data.js / mob_renderer.js; World D11 deterministic melee adaptation'},
  {enemyDefinitionId:'def:d4100000000000000000000000000006',kind:'ordinaryEnemyDefinition',family:'animated_armor',name:'Animated Armor',
    body:{width:24,height:24,hullRadius:10,combatRadius:10.8},visual:'d11-animated-armor',behavior:'relentless-melee',moveSpeed:1.25,
    attack:{reach:20,delayTicks:66,awareness:260,stopDistance:14},budget:{hp:60,damage:7},sourceVersion:'SAQ-Dungeon-main (4)',source:'bestiary_data.js / mob_renderer.js; World D11 deterministic melee adaptation'},
  {enemyDefinitionId:'def:d4100000000000000000000000000007',kind:'ordinaryEnemyDefinition',family:'cursed_blade',name:'Cursed Blade',
    body:{width:24,height:24,hullRadius:10,combatRadius:10.8},visual:'d11-cursed-blade',behavior:'standard-melee',moveSpeed:1.55,
    attack:{reach:20,delayTicks:54,awareness:260,stopDistance:14},budget:{hp:48,damage:7},sourceVersion:'SAQ-Dungeon-main (4)',source:'bestiary_data.js / mob_renderer.js; World D11 ancient-haunted deterministic melee adaptation'}
].map(d=>({...d,contentDefinitionId:d.enemyDefinitionId})));
// Catalog extension is append-only: historical indices own their exact profile
// IDs. Migration can validate the legacy arrays without changing old records.
export const ORDINARY_ENEMIES=Object.freeze([...LEGACY_ORDINARY_ENEMIES,...DUNGEON_MOBS_V1_ENEMIES]);
export function resolveOrdinaryProfile(enemy,tier,progressionPower=BASELINE_PROGRESSION_POWER){
  requireContract(ORDINARY_ENEMIES.includes(enemy),'Unknown ordinary definition');const i=ORDINARY_ENEMIES.indexOf(enemy),rank=THREAT_TIERS.indexOf(tier),power=resolveThreatPower(progressionPower,tier);
  return freezeWire({contentDefinitionId:'def:d420'+(i*4+rank+1).toString(16).padStart(28,'0'),kind:'actorProfile',profileKey:`ordinary-${enemy.family.replaceAll('_','-')}-${tier.toLowerCase()}`,
    team:'hostile',maxHp:combatIntegerWire(Math.round(enemy.budget.hp*power.hpMultiplier)),attackDamage:combatIntegerWire(Math.round(enemy.budget.damage*power.damageMultiplier)),
    moveSpeed:enemy.moveSpeed,hullRadius:enemy.body.hullRadius,combatRadius:enemy.body.combatRadius,attackReach:enemy.attack.reach,attackReachMode:'center',attackDelayTicks:enemy.attack.delayTicks,aiKind:'simpleMelee'});
}
export const ORDINARY_PROFILES=freezeWire(ORDINARY_ENEMIES.flatMap(d=>THREAT_TIERS.map(tier=>resolveOrdinaryProfile(d,tier))));
export const LEGACY_ORDINARY_PROFILES=Object.freeze(ORDINARY_PROFILES.slice(0,LEGACY_ORDINARY_ENEMIES.length*THREAT_TIERS.length));
export const DUNGEON_MOBS_V1_PROFILES=Object.freeze(ORDINARY_PROFILES.slice(LEGACY_ORDINARY_PROFILES.length));
// Immutable catalog lookup: horde AI/presentation call this for every active actor.
const enemyByProfile=new Map(ORDINARY_PROFILES.map(p=>[p.contentDefinitionId,ORDINARY_ENEMIES.find(d=>p.profileKey.startsWith(`ordinary-${d.family.replaceAll('_','-')}-`))]));
export function ordinaryEnemyForProfile(id){return enemyByProfile.get(id)??null;}
export function validateOrdinaryDefinition(d){requireContract(ORDINARY_ENEMIES.some(e=>canonicalStringify(e)===canonicalStringify(d)),'Ordinary definition drift');}
