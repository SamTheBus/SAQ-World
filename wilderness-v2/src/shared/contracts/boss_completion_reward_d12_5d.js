import {BOSS_COMPLETION_REWARD_CLASS} from '../content/economy_rewards.js';
import {requireContract} from './wire.js';
import {rewardClassForEconomicResourceD13D_C,validateSiteFinaleCompletionRewardSourceD13D_C} from './site_finale_completion_d13d.js';

function arachnidTreantForGroup(state,groupId){return Object.values(state.bossCombat?.bossesByEntityId??{}).find(row=>row.groupId===groupId)??null;}

// Classification is derived from the authored Case O boss group. It does not
// alter the resource identity, episode, ordinal, or canonical claim record.
export function rewardClassForEconomicResourceD12_5D(state,resource){
 if(state.proofCase!=='O'||resource.kind!=='chest'||resource.completion!==true||resource.ordinal!==0)return null;
 return arachnidTreantForGroup(state,resource.groupId)?BOSS_COMPLETION_REWARD_CLASS:null;
}

export function validateBossCompletionRewardSourceD12_5D(state,source){
 requireContract(source.rewardClass===BOSS_COMPLETION_REWARD_CLASS&&state.proofCase==='O'&&source.kind==='chest'&&source.ordinal===0&&Boolean(arachnidTreantForGroup(state,source.groupId)),'Invalid boss completion reward source');
 return source;
}

export function rewardClassForCompletionResourceD13D_C(state,resource){return rewardClassForEconomicResourceD13D_C(state,resource)??rewardClassForEconomicResourceD12_5D(state,resource);}
export function validateCompletionRewardSourceD13D_C(state,source){if(source.rewardClass!==BOSS_COMPLETION_REWARD_CLASS)return validateSiteFinaleCompletionRewardSourceD13D_C(state,source);const production=rewardClassForEconomicResourceD13D_C(state,{...source,completion:true});return production===BOSS_COMPLETION_REWARD_CLASS?validateSiteFinaleCompletionRewardSourceD13D_C(state,source):validateBossCompletionRewardSourceD12_5D(state,source);}
