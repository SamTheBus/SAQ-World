import {drawStarWeaverV4,drawStarWeaverAttackV4,starWeaverWalkingLegsV4} from './creature_presentation_starweaver_v4.js';
import {drawNeonSpiderV4,drawNeonSpiderAttackV4,neonSpiderWalkingLegsV4} from './creature_presentation_neon_spider_v4.js';
// Public painter entry points retain their existing names and presentation API.
export function arthropodWalkingLegsV3(family,time,seed,walk=0){
 return family==='star_weaver'?starWeaverWalkingLegsV4(time,seed,walk):neonSpiderWalkingLegsV4(time,seed,walk);
}
export const drawStarWeaverV3=(c,m,time,seed)=>drawStarWeaverV4(c,m,time,seed);
export const drawNeonSpiderV3=(c,m,time,seed)=>drawNeonSpiderV4(c,m,time,seed);
export function drawArthropodAttackV3(c,pose,flash=false){
 return drawStarWeaverAttackV4(c,pose,flash)||drawNeonSpiderAttackV4(c,pose,flash);
}
