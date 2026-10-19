// Held edges only. Movement and Primary retain their independent pointer owners.
export function createShieldGuardInput({button,environment,readModel,adapter,isBlocked,clearPrimary,reportError}){
 const owners=new Set(),listeners=[];let context=null;
 const listen=(el,type,fn)=>{el.addEventListener(type,fn);listeners.push(()=>el.removeEventListener(type,fn));};
 function send(pressed){const m=readModel(),p=m.playersById[m.localPlayerId];if(!m.entitiesById[p.entityId].alive||m.persistence.phase!=='encounter')return;try{adapter.issue('combat.guardIntent',{pressed},m);}catch(e){reportError(e.message);}}
 function down(owner){const m=readModel();if(isBlocked()||m.subweapon?.suppressed||m.playersById[m.localPlayerId].stats.subType!=='shield'||owners.has(owner)||m.subweapon.guard?.mustRelease||m.subweapon.guard?.integrity<8)return;const first=!owners.size;owners.add(owner);if(first){clearPrimary();send(true);}}
 function up(owner){if(owners.delete(owner)&&!owners.size)send(false);}
 function clear(){const m=readModel(),g=m.subweapon?.guard,had=owners.size;owners.clear();if(had||g?.requested||g?.raised||g?.mustRelease)send(false);}
 listen(button,'pointerdown',e=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();down(e.pointerId);try{button.setPointerCapture(e.pointerId);}catch{}});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(button,type,e=>up(e.pointerId));
 listen(button,'click',e=>e.preventDefault());
 listen(environment,'keydown',e=>{if(!['ShiftLeft','ShiftRight'].includes(e.code)||e.repeat||['INPUT','TEXTAREA','SELECT','BUTTON'].includes(e.target?.tagName))return;if(readModel().playersById[readModel().localPlayerId].stats.subType==='shield'){e.preventDefault();down(e.code);}});
 listen(environment,'keyup',e=>{if(['ShiftLeft','ShiftRight'].includes(e.code))up(e.code);});
 listen(environment,'blur',clear);listen(environment.document,'visibilitychange',()=>{if(environment.document.hidden)clear();});
 function refresh(m){const p=m.playersById[m.localPlayerId],g=m.subweapon?.guard,k=m.context.sessionId+'/'+m.context.spaceInstanceId+'/'+p.stats.subType;if(context!==k){clear();context=k;}if(isBlocked()||m.subweapon?.suppressed||!m.entitiesById[p.entityId].alive)clear();button.hidden=p.stats.subType!=='shield'||isBlocked()||m.subweapon?.suppressed;if(button.hidden)return;
  button.disabled=!m.entitiesById[p.entityId].alive;button.setAttribute('aria-pressed',String(Boolean(g?.raised)));button.setAttribute('aria-label',`Raise Shield — hold Shift or touch. Guard Integrity ${Math.floor(g?.integrity??0)} of 32`);button.style.setProperty('--guard-fill',`${100*(g?.integrity??0)/32}%`);button.dataset.raised=String(Boolean(g?.raised));button.dataset.empty=String((g?.integrity??0)<8);const text=`${g?.raised?'RAISED':g?.mustRelease?'RELEASE':g?.requested?'RAISING…':'GUARD'}
INTEGRITY
${(g?.integrity??0).toFixed(1)} / 32`;if(button.innerText!==text)button.innerText=text;
 }
 return {refresh,clear,read:()=>({owners:[...owners]}),destroy(){clear();listeners.forEach(f=>f());button.remove();}};
}
