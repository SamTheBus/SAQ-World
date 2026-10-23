// Deterministic three-ingot spread extracted from Gilded Vault Keeper's
// uploaded October 2026 playable source (src/shared/content/gilded_vault_keeper_v1.js).
const roll=(seed,sequence,salt)=>{
 let v=(seed^Math.imul(sequence+1,2654435761)^salt)>>>0;
 v=Math.imul(v^(v>>>16),2246822507)>>>0;
 v=Math.imul(v^(v>>>13),3266489909)>>>0;
 return ((v^(v>>>16))>>>0)/4294967296;
};
export function gildedGoldFallTargets(seed,sequence,target){
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff||!Number.isSafeInteger(sequence)||sequence<0||
  !Number.isFinite(target?.x)||!Number.isFinite(target?.y))throw new TypeError('Invalid Gilded targeting');
 return Array.from({length:3},(_,i)=>{
  const theta=roll(seed,sequence,(1779033703^Math.imul(i+1,2654435761))>>>0)*Math.PI*2;
  const radius=30+roll(seed,sequence,(3144134277^Math.imul(i+1,2246822507))>>>0)*45;
  return {x:target.x+Math.cos(theta)*radius,y:target.y+Math.sin(theta)*radius};
 });
}
