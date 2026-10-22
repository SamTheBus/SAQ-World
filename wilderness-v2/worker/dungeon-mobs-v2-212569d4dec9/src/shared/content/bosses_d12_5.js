import {combatIntegerWire} from '../contracts/combat_integer.js';
import {freezeWire} from '../contracts/wire.js';

export const ARACHNID_TREANT_BOSS_ID='arachnid_treant';
export const ARACHNID_TREANT_PROFILE=freezeWire({
  contentDefinitionId:'def:d4500000000000000000000000000001',kind:'actorProfile',profileKey:'boss-arachnid-treant',
  team:'hostile',maxHp:combatIntegerWire(960),attackDamage:combatIntegerWire(18),moveSpeed:1.3,
  hullRadius:34,combatRadius:36,attackReach:32,attackReachMode:'center',attackDelayTicks:50,aiKind:'simpleMelee',isBoss:true,
});

// Timings and geometry are the Dungeon Arachnid Treant contract expressed in
// World authority ticks. The legacy random ability choice is replaced by a
// stable identity-derived selector in the boss simulation.
export const ARACHNID_TREANT_D12_5A=freezeWire({
  bossId:ARACHNID_TREANT_BOSS_ID,label:'ARACHNID TREANT',phaseTwoHealth:{numerator:1,denominator:2},
  pursuitRange:220,closeStrikeRange:32,closeStrikeCooldownTicks:50,abilityRecoveryTicks:120,
  telegraphTicks:75,slam:{radius:64,damage:{numerator:18,denominator:10}},
  rootSnare:{impactRadius:75,damage:{numerator:13,denominator:10},durationTicks:132,movementMultiplier:{numerator:2,denominator:5},hazardDurationTicks:300,hazardRadiusX:75,hazardRadiusY:33.75,statusId:'treant_root_snare'},
  barkShield:{damageMultiplier:{numerator:1,denominator:10},summonCount:3,cocoonRadius:54,hatchTicks:240,breakRecoveryTicks:60},
});
