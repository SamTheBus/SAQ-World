import {freezeWire} from '../contracts/wire.js';
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
export const aegisFortFloor=(site,index)=>site.familyId==='site-family:fort'&&site.sizeTier==='standard'&&index===site.floorCount-1;
