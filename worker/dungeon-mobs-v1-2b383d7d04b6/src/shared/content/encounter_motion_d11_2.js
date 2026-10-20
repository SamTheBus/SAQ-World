import {freezeWire} from '../contracts/wire.js';
import {DUNGEON_MOBS_V1_MELEE_MOTION} from './dungeon_mobs_v1.js';

export const ENCOUNTER_CONTAINMENT_D11_2_VERSION='encounter-containment-d11.2-v1';
export const HOSTILE_MOTION_D11_2_VERSION='hostile-motion-d11.2-v1';

export const SITE_CONTAINMENT_D11_2=freezeWire({
 woodlandRuin:{acquireRadius:260,pursuitRadius:420,disengageTicks:24,homeTolerance:3,approachRadius:17},
 woodlandFort:{acquireRadius:360,pursuitRadius:520,disengageTicks:30,homeTolerance:3,approachRadius:17},
 woodlandCave:{acquireRadius:260,pursuitRadius:390,disengageTicks:24,homeTolerance:3,approachRadius:17}
});

// The established Sprout, Golem and Slime keep their existing mechanics. The
// original four D11 timings remain exact when the new ordinary batch is added.
export const LEGACY_HOSTILE_MELEE_MOTION_D11_2=freezeWire({
 gargoyle:{windupTicks:11,impactTicks:3,recoveryTicks:9},
 rust_nibbler:{windupTicks:7,impactTicks:2,recoveryTicks:7},
 animated_armor:{windupTicks:14,impactTicks:3,recoveryTicks:12},
 cursed_blade:{windupTicks:9,impactTicks:3,recoveryTicks:8}
});
export const HOSTILE_MELEE_MOTION_D11_2=freezeWire({...LEGACY_HOSTILE_MELEE_MOTION_D11_2,...DUNGEON_MOBS_V1_MELEE_MOTION});

export const hostileMeleeMotionD11_2=family=>HOSTILE_MELEE_MOTION_D11_2[family]??null;

