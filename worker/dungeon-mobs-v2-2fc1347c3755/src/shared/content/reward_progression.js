import {validateRewardModifiers} from './reward_modifiers.js';
export {validateRewardModifiers} from './reward_modifiers.js';
import {validateRewardProgressionD9} from './reward_progression_d9.js';
import {closedRecord,freezeWire,requireContract,safeInteger} from '../contracts/wire.js';
export const PROTOTYPE_PROGRESSION_POLICY='prototype-rank-depth-v1';
const CURRENT_DEPTH=Object.freeze({C:1,B:3,A:5,S:7});
// Compatibility only. Future episode authority supplies this input, never pickup/UI level.
export function prototypeRewardProgression(rank,sourceId){requireContract(Object.hasOwn(CURRENT_DEPTH,rank),'Unknown prototype rank');return rewardProgression(CURRENT_DEPTH[rank],sourceId,PROTOTYPE_PROGRESSION_POLICY);}
export function rewardProgression(sourceDepth,sourceId,policy='explicit-content-depth-v1'){const value={version:'reward-progression-v1',policy,sourceDepth,quality:1,sourceId,tomeEligibility:'base-single-d7-v1'};validateRewardProgression(value);return freezeWire(value);}
export function validateRewardProgression(v){if(v?.version==='reward-progression-d9-v1')return validateRewardProgressionD9(v);closedRecord(v,['version','policy','sourceDepth','quality','sourceId','tomeEligibility'],['modifiers']);requireContract(v.version==='reward-progression-v1'&&[PROTOTYPE_PROGRESSION_POLICY,'explicit-content-depth-v1'].includes(v.policy),'Unknown progression policy');safeInteger(v.sourceDepth,1,10000);requireContract((v.modifiers?v.quality===1+v.modifiers.qualityHundredths/100:v.quality===1)&&typeof v.sourceId==='string'&&v.sourceId.length>0&&(v.modifiers?v.tomeEligibility==='personal-tome-d8-v1':v.tomeEligibility==='base-single-d7-v1'),'Invalid reward progression/eligibility');if(v.modifiers)validateRewardModifiers(v.modifiers);return v;}
