// Presentation readiness only. No persisted state, clock, RNG, or transition
// authority lives here. The host continues servicing residency/durability.
export function createSpacePreparationGate(initialSpace) {
 let space=initialSpace,phase='ready',painted=false;
 function observe(next,pending=false){
  if(pending){space=next;phase='waiting';painted=false;}
  else if(next!==space||phase==='waiting'){space=next;phase='loading';painted=false;}
  return phase==='ready';
 }
 return Object.freeze({observe,ready:()=>phase==='ready',
  frame(){if(phase==='waiting')return 'show-loading';if(phase==='loading'){if(!painted){painted=true;return 'show-loading';}return 'prepare';}return 'render';},
  prepared(){if(phase==='loading')phase='awaiting-presentation';},
  presented(){if(phase==='awaiting-presentation')phase='ready';},
  inspect:()=>Object.freeze({space,phase,ready:phase==='ready'})});
}
