// Exact attack choice from the recovered Nexus Overseer playable arena.
// The original fight chooses the 75-tick Prism Collapse or 60-tick
// Control Glitch; legacy prism_slam stays readable for existing saves.
const roll=(seed,sequence,salt)=>{
 let value=(seed^Math.imul(sequence+1,2654435761)^salt)>>>0;
 value=Math.imul(value^(value>>>16),2246822507)>>>0;
 value=Math.imul(value^(value>>>13),3266489909)>>>0;
 return ((value^(value>>>16))>>>0)/4294967296;
};
export function originalNexusAbilityChoice(seed,sequence,distance){
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff||!Number.isSafeInteger(sequence)||sequence<0||!Number.isFinite(distance)||distance<0)
  throw new TypeError('Invalid Nexus ability seed, sequence or distance');
 const choice=roll(seed,sequence,2722868949)<.5?'prism_collapse':'control_glitch';
 return distance<64&&roll(seed,sequence,1374496523)<.8?'prism_collapse':choice;
}
