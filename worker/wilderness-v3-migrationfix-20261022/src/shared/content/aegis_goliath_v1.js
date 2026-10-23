import {freezeWire} from '../contracts/wire.js';
import {usesWildernessFairnessV3_2} from './wilderness_fairness_v3_2.js';
import {ARACHNID_TREANT_PROFILE} from './bosses_d12_5.js';

export const AEGIS_GOLIATH_ID='aegis_goliath';
// Reuse the accepted physical boss chassis. Identity, abilities and visuals are
// independently owned by the Aegis record; existing content fingerprints stay valid.
export const AEGIS_PHYSICAL_PROFILE=ARACHNID_TREANT_PROFILE;
export const AEGIS_GOLIATH=freezeWire({
 label:'AEGIS GOLIATH',range:220,turnSpeed:.038,abilityRecoveryTicks:110,
 magnetic_pull:{telegraphTicks:90,radius:70,pullSpeed:2.2,damageNumerator:16},
 boomerang_shield:{telegraphTicks:60,speed:4.5,acceleration:.24,maxSpeed:5.5,radius:8,lifeTicks:180,damageNumerator:9},
 shield_bash:{telegraphTicks:75,radius:64,halfAngle:.5,damageNumerator:17,dazeTicks:210},
 blockHalfAngle:.6,
});
export const AEGIS_DEEP_UPLAND_FORT_SITE_V3_6='repeatable-slot:fort:upland:deep:01';
// Keep existing Standard Fort Aegis encounters. Only this exact Deep Upland
// reservation gains a live Aegis in a committed Wilderness World Combat run.
export const aegisFortFloor=(site,index,state=null)=>site?.familyId==='site-family:fort'&&index===site.floorCount-1&&(
  site.sizeTier==='standard'||
  site.sizeTier==='deep'&&usesWildernessFairnessV3_2(state)&&
  site.socket?.provenance?.reservationId===AEGIS_DEEP_UPLAND_FORT_SITE_V3_6&&
  site.socket?.region?.biome==='upland'
);
