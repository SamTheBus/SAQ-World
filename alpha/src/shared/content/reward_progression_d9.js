import {D9_PROFILE} from './world_profile_d9.js';
import {closedRecord,freezeWire,requireContract as check} from '../contracts/wire.js';
import {positiveProgression,progressionWire,progressionBigInt} from '../contracts/progression_integer.js';
import {validateRewardModifiers} from './reward_modifiers.js';
export const D9_REWARD_PROGRESSION='reward-progression-d9-v1';
export function rewardProgressionD9(depth,sourceId){return freezeWire(validateRewardProgressionD9({version:D9_REWARD_PROGRESSION,policy:D9_PROFILE.progressionPolicy,sourceDepth:progressionWire(progressionBigInt(depth)),quality:1,sourceId,tomeEligibility:'base-single-d7-v1'}));}
export function validateRewardProgressionD9(v){closedRecord(v,['version','policy','sourceDepth','quality','sourceId','tomeEligibility'],['modifiers','episodeSnapshotId']);check(v.version===D9_REWARD_PROGRESSION&&v.policy===D9_PROFILE.progressionPolicy,'D9 reward progression version');positiveProgression(v.sourceDepth);check(typeof v.sourceId==='string'&&v.sourceId.length>0&&v.sourceId.length<=240,'Invalid reward source');if(v.modifiers)validateRewardModifiers(v.modifiers);check(v.quality===(v.modifiers?1+v.modifiers.qualityHundredths/100:1)&&v.tomeEligibility===(v.modifiers?'personal-tome-d8-v1':'base-single-d7-v1'),'D9 reward modifier witness');return v;}
