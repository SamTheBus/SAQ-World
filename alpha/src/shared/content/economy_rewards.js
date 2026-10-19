import {multiplyAmount,wholeAmount,rewardAmount} from '../contracts/economy_amount.js';
import {D9_REWARD_PROGRESSION,validateRewardProgressionD9} from './reward_progression_d9.js';
import {progressionBigInt} from '../contracts/progression_integer.js';
import {numericExtension} from '../contracts/integer_domain.js';
import {validateRewardModifiers} from './reward_progression.js';
import {prototypeRewardProgression} from './reward_progression.js';
import {REWARD_POOLS} from './equipment.js';
import {requireContract,safeInteger,canonicalStringify} from '../contracts/wire.js';
// Authorized World content -> Dungeon depth adaptation. Never reads player level.
export const CONTENT_REWARD_VERSION='world-content-depth-d5-eco-v1';
export const BOSS_COMPLETION_REWARD_CLASS='boss-completion';
export const SITE_FINALE_ELITE_PACK_COMPLETION_REWARD_CLASS='site-finale-elite-pack-completion';
// Provisional D13D-G content deliberately reuses the existing completion
// bundle. The distinct class prevents this placeholder from becoming the
// permanent Large Cave loot policy.
export const SITE_FINALE_PROVISIONAL_COMPLETION_REWARD_CLASS='site-finale-provisional-completion';
export const CONTENT_DEPTH=Object.freeze(Object.fromEntries(['C','B','A','S'].map(rank=>[rank,prototypeRewardProgression(rank,'compatibility').sourceDepth])));
export const MATERIAL_DEPTH_BANDS=Object.freeze([
 {minimumDepth:1,material:'Monster Soul'}, {minimumDepth:11,material:'Rare Scrap'},
 {minimumDepth:21,material:'Magic Scrap'}, {minimumDepth:31,material:'Epic Scrap'},
 {minimumDepth:41,material:'Legendary Scrap'}, {minimumDepth:51,material:'Mythic Scrap'},
]);
export function hashReward(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h;}
export function rewardProfile(rank){const depth=CONTENT_DEPTH[rank];requireContract(depth!==undefined,'Unauthored content reward rank');const chestEquivalent=Math.floor(depth/4)+1;return {version:CONTENT_REWARD_VERSION,rank,depth,chestEquivalent,enemyGold:Number((30n+15n*BigInt(depth))/2n),breakableGold:15+6*depth,chestGold:60+45*chestEquivalent,ordinaryMaterial:'Monster Soul',ordinaryMaterialChance:45,depthScrap:MATERIAL_DEPTH_BANDS.filter(b=>b.minimumDepth<=depth).at(-1).material,higherSourcesEnabled:false};}
// Keep public entity/item ID wire format; the persisted group/episode/ordinal tuple
// is the reward identity, while manifest entity IDs remain stable spawn slots.
export function episodeRewardId(groupId,episode,kind,ordinal){safeInteger(episode);safeInteger(ordinal);return 'ent:'+Array.from({length:4},(_,n)=>hashReward(`${n}/d5-eco/${groupId}/${episode}/${kind}/${ordinal}`).toString(16).padStart(8,'0')).join('');}
export function rewardProfileD9(progression,rank){validateRewardProgressionD9(progression);requireContract(CONTENT_DEPTH[rank]!==undefined,'Unauthored content reward rank');const depth=progressionBigInt(progression.sourceDepth),gold=n=>{const v=n.toString();if(v.length>512)numericExtension('D9 reward currency capacity');return v;};return {rank,depth:progression.sourceDepth,enemyGold:gold((30n+15n*depth)/2n),breakableGold:gold(15n+6n*depth),chestGold:gold(60n+45n*(depth/4n+1n))};}
export function rollContentReward(state,player,{sourceEntityId,rank,kind,ordinal,modifiers=null,progression=null,rewardClass=null}){
 if(rewardClass!==null)requireContract([BOSS_COMPLETION_REWARD_CLASS,SITE_FINALE_ELITE_PACK_COMPLETION_REWARD_CLASS,SITE_FINALE_PROVISIONAL_COMPLETION_REWARD_CLASS].includes(rewardClass)&&kind==='chest','Unknown economic reward classification');
 if(modifiers)validateRewardModifiers(modifiers);const occurrence=(hash,chance,key)=>{if(!modifiers||modifiers.occurrenceHundredths===100)return hash%100<chance;const threshold=chance*modifiers.occurrenceHundredths,whole=Math.floor(threshold/100);return hash%100<whole||hash%100===whole&&hashReward(key+'/d8-occurrence-fraction')%100<threshold%100;};const gold=n=>!modifiers||modifiers.goldHundredths===100?n:multiplyAmount(rewardAmount(n),`${Math.floor(modifiers.goldHundredths/100)}.${String(modifiers.goldHundredths%100).padStart(2,'0')}`.replace(/0+$/,'').replace(/\.$/,''));
 const profile=progression?.version===D9_REWARD_PROGRESSION?rewardProfileD9(progression,rank):rewardProfile(rank),key=`d5-eco-v1/${state.campaign.seed.seedHex}/${player.playerId}/${sourceEntityId}`,roll=hashReward(key+'/branch')%100,pool=REWARD_POOLS[Math.min(2,['C','B','A','S'].indexOf(rank))];
 if(kind==='enemy'){
  // Preserve D4 fixed-catalog onboarding and 35% subsequent gear chance.
  const gearRoll=hashReward(`${canonicalStringify(state.campaign.seed)}/${player.playerId}/${sourceEntityId}/player-inventory-d4r-v1`);
  const definitionId=ordinal<=8?pool[ordinal===8?2:ordinal-1]:occurrence(gearRoll,35,key+'/gear')?pool[(gearRoll>>>8)%7]:null;
  const soulKey=`d5-monster-soul-v1/${state.campaign.seed.seedHex}/${player.playerId}/${sourceEntityId}`;
  return {gold:gold(profile.enemyGold),souls:occurrence(hashReward(soulKey+'/eligible'),45,soulKey)?1+hashReward(soulKey+'/quantity')%2:0,definitionId,healing:false};
 }
 if(kind==='chest'){const definitionId=pool[hashReward(key+'/gear')%pool.length];return [BOSS_COMPLETION_REWARD_CLASS,SITE_FINALE_ELITE_PACK_COMPLETION_REWARD_CLASS,SITE_FINALE_PROVISIONAL_COMPLETION_REWARD_CLASS].includes(rewardClass)?{gold:gold(profile.chestGold),souls:0,definitionId,healing:false}:{gold:gold(roll<40?profile.chestGold:0),souls:0,definitionId:roll<40?null:definitionId,healing:false};}
 requireContract(kind==='breakable','Unknown economic source');
 return {gold:gold(roll<60?profile.breakableGold:0),souls:roll>=60&&roll<80?1+hashReward(key+'/quantity')%2:0,definitionId:null,healing:roll>=80&&roll<90};
}
