import {combatInteger,multiplyCombat} from '../contracts/combat_amount.js';
import {freezeWire,requireContract as check} from '../contracts/wire.js';

export const ELITE_AFFIX_CATALOG_D12_4_VERSION='elite-affix-catalog-d12.4-v1';
export const VITALITY_WEAVER_AFFIX_ID='vitality_weaver';
export const SWIFT_COMMANDER_AFFIX_ID='swift_commander';
export const GLACIAL_WARDEN_AFFIX_ID='glacial_warden';
export const TOXIC_DECAY_AFFIX_ID='toxic_decay';
export const IRON_CITADEL_AFFIX_ID='iron_citadel';
export const BLOOD_BERSERKER_AFFIX_ID='blood_berserker';
export const NULLIFIER_AFFIX_ID='nullifier';
export const WEB_WEAVER_AFFIX_ID='web_weaver';
export const SLAG_SHAPER_AFFIX_ID='slag_shaper';

// All ratios are exact integer fractions. Published actor stats and healing use
// World's existing round-half-up combatInteger endpoint exactly once.
export const VITALITY_WEAVER_D12_4=freezeWire({
 version:ELITE_AFFIX_CATALOG_D12_4_VERSION,
 affixId:VITALITY_WEAVER_AFFIX_ID,
 tier:'elite',
 label:'VITALITY WEAVER',
 statMultipliers:{maxHp:{numerator:3,denominator:2},attackDamage:{numerator:5,denominator:4}},
 pulse:{cadenceTicks:90,radius:120,maximumTargets:3,ordinaryHeal:{numerator:6,denominator:100},reservedBossHeal:{numerator:15,denominator:1000}},
 presentation:{scale:1.25,accent:'#39d27d',accentDark:'#123e31',accentLight:'#c5f28c'}
});

export const SWIFT_COMMANDER_D12_4D=freezeWire({
 version:ELITE_AFFIX_CATALOG_D12_4_VERSION,
 affixId:SWIFT_COMMANDER_AFFIX_ID,
 tier:'elite',
 label:'SWIFT COMMANDER',
 statMultipliers:{maxHp:{numerator:3,denominator:2},attackDamage:{numerator:5,denominator:4}},
 pulse:{cadenceTicks:90,radius:140,maxStacks:3,perStackSpeedPercent:15,lingerTicks:300,decayTicks:150},
 presentation:{scale:1.25,accent:'#00d2ff',accentDark:'#123a50',accentLight:'#b9f4ff',commandGold:'#f0c95a'}
});

export const GLACIAL_WARDEN_D12_4E=freezeWire({
 version:ELITE_AFFIX_CATALOG_D12_4_VERSION,
 affixId:GLACIAL_WARDEN_AFFIX_ID,
 tier:'elite',
 label:'GLACIAL WARDEN',
 statMultipliers:{maxHp:{numerator:3,denominator:2},attackDamage:{numerator:5,denominator:4}},
 pulse:{cadenceTicks:120,radius:110,statusId:'glacial_warden_snare',durationTicks:60,movementMultiplier:{numerator:2,denominator:5}},
 presentation:{scale:1.25,accent:'#38bdf8',accentDark:'#153756',accentLight:'#d9f7ff',iceBlue:'#79d7ff'}
});

export const TOXIC_DECAY_D12_4F=freezeWire({
 version:ELITE_AFFIX_CATALOG_D12_4_VERSION,
 affixId:TOXIC_DECAY_AFFIX_ID,
 tier:'elite',
 label:'TOXIC DECAY',
 statMultipliers:{maxHp:{numerator:3,denominator:2},attackDamage:{numerator:5,denominator:4}},
 pulse:{cadenceTicks:120,statusId:'toxic_decay_poison',durationTicks:240,tickTicks:60,maxStacks:3,damageMaxHp:{numerator:12,denominator:1000}},
 presentation:{scale:1.25,accent:'#69e09b',accentDark:'#241735',accentLight:'#c7ff9a',sludge:'#70408f'}
});

export const IRON_CITADEL_D12_4G=freezeWire({
 version:ELITE_AFFIX_CATALOG_D12_4_VERSION,
 affixId:IRON_CITADEL_AFFIX_ID,
 tier:'elite',
 label:'IRON CITADEL',
 statMultipliers:{maxHp:{numerator:3,denominator:2},attackDamage:{numerator:5,denominator:4}},
 pulse:{cadenceTicks:90,radius:100,maxStacks:3,perStackMitigationPercent:15,lingerTicks:300,decayTicks:150},
 presentation:{scale:1.25,accent:'#7196b5',accentDark:'#182a38',accentLight:'#d2e2eb',steel:'#45657d'}
});

export const BLOOD_BERSERKER_D12_4H_A=freezeWire({
 version:ELITE_AFFIX_CATALOG_D12_4_VERSION,
 affixId:BLOOD_BERSERKER_AFFIX_ID,
 tier:'elite',
 label:'BERSERKER',
 statMultipliers:{maxHp:{numerator:3,denominator:2},attackDamage:{numerator:5,denominator:4}},
 pulse:{cadenceTicks:90,radius:110,maxStacks:3,perStackAttackPercent:15,lingerTicks:300,decayTicks:150,statusId:'blood_berserker_attack'},
 presentation:{scale:1.25,accent:'#c83f4f',accentDark:'#35131c',accentLight:'#ffb067',bloodGold:'#e2b85a'}
});

export const NULLIFIER_D12_4I=freezeWire({
 version:ELITE_AFFIX_CATALOG_D12_4_VERSION,
 affixId:NULLIFIER_AFFIX_ID,
 tier:'elite',
 label:'NULLIFIER',
 statMultipliers:{maxHp:{numerator:3,denominator:2},attackDamage:{numerator:5,denominator:4}},
 pulse:{cadenceTicks:300,chargeTicks:60,radius:90,statusId:'nullified',durationTicks:120,resistanceTicks:90},
 presentation:{scale:1.25,accent:'#9b5de5',accentDark:'#251339',accentLight:'#e4c7ff',fracture:'#c98cff'}
});

export const WEB_WEAVER_D12_4J=freezeWire({
 version:ELITE_AFFIX_CATALOG_D12_4_VERSION,
 affixId:WEB_WEAVER_AFFIX_ID,
 tier:'elite',
 label:'WEB WEAVER',
 statMultipliers:{maxHp:{numerator:3,denominator:2},attackDamage:{numerator:5,denominator:4}},
 pulse:{cadenceTicks:210,radius:220,windupTicks:45,hazardKind:'web_weaver_web',durationTicks:240,statusId:'webbed',geometry:{kind:'ellipse',radiusX:75,radiusY:33.75},movementMultiplier:{numerator:2,denominator:5},maxActivePerSource:2},
 presentation:{scale:1.25,accent:'#a9f3ff',accentDark:'#241b4b',accentLight:'#f1fdff',thread:'#c7e9ef'}
});

export const SLAG_SHAPER_D12_4K=freezeWire({
 version:ELITE_AFFIX_CATALOG_D12_4_VERSION,
 affixId:SLAG_SHAPER_AFFIX_ID,
 tier:'elite',
 label:'SLAG SHAPER',
 statMultipliers:{maxHp:{numerator:3,denominator:2},attackDamage:{numerator:5,denominator:4}},
 pulse:{cadenceTicks:180,windupTicks:30,hazardKind:'slag_shaper_pool',durationTicks:300,statusId:'slag_burn',geometry:{kind:'ellipse',radiusX:12,radiusY:6},damageMaxHp:{numerator:15,denominator:1000},damageIntervalTicks:45,nonlethal:false,maxActivePerSource:2},
 presentation:{scale:1.25,accent:'#f97316',accentDark:'#25130f',accentLight:'#fff0a8',crust:'#211a19'}
});

export const ELITE_AFFIX_CATALOG_D12_4=freezeWire({
 version:ELITE_AFFIX_CATALOG_D12_4_VERSION,
 definitionsById:{[VITALITY_WEAVER_AFFIX_ID]:VITALITY_WEAVER_D12_4,[SWIFT_COMMANDER_AFFIX_ID]:SWIFT_COMMANDER_D12_4D,[GLACIAL_WARDEN_AFFIX_ID]:GLACIAL_WARDEN_D12_4E,[TOXIC_DECAY_AFFIX_ID]:TOXIC_DECAY_D12_4F,[IRON_CITADEL_AFFIX_ID]:IRON_CITADEL_D12_4G,[BLOOD_BERSERKER_AFFIX_ID]:BLOOD_BERSERKER_D12_4H_A,[NULLIFIER_AFFIX_ID]:NULLIFIER_D12_4I,[WEB_WEAVER_AFFIX_ID]:WEB_WEAVER_D12_4J,[SLAG_SHAPER_AFFIX_ID]:SLAG_SHAPER_D12_4K}
});

export function eliteAffixDefinitionD12_4(affixId){return ELITE_AFFIX_CATALOG_D12_4.definitionsById[affixId]??null;}

export function applyEliteActorStatsD12_4(profile,elite){
 if(!elite)return profile;
 check(elite.tier==='elite'&&elite.affixIds.length===1,'Unsupported D12.4 elite loadout');
 const definition=eliteAffixDefinitionD12_4(elite.affixIds[0]);check(definition,'Unsupported D12.4 elite loadout');const d=definition.statMultipliers;
 return {...profile,
  maxHp:combatInteger(multiplyCombat(profile.maxHp,d.maxHp.numerator,d.maxHp.denominator),'round'),
  attackDamage:combatInteger(multiplyCombat(profile.attackDamage,d.attackDamage.numerator,d.attackDamage.denominator),'round')};
}
