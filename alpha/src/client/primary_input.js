import { spaceKey } from "./presentation_state.js";

// Input edges only. There is no client repeat clock, queue or attack scheduler.
export function createPrimaryInput({button,environment,adapter,readModel,reportError,isBlocked=()=>false,restoreGameplayFocus=()=>{}}) {
  const listeners=[],owners=new Set();let key=spaceKey(readModel()),needsCancel=false;
  function listen(target,type,handler){target.addEventListener(type,handler);listeners.push(()=>target.removeEventListener(type,handler));}
  function send(pressed,cancelQueued=false,model=readModel()) {
    if(isBlocked()||!model.primary||model.persistence.phase!=="encounter"||!model.entitiesById[model.playersById[model.localPlayerId].entityId].alive)return;
    try {adapter.issue("combat.primaryIntent",{pressed,aim:model.primary.actorsById[model.playersById[model.localPlayerId].entityId].facing,...(cancelQueued?{cancelQueued:true}:{})},model);needsCancel=false;}
    catch(error){needsCancel=!pressed;reportError(error.message);}
  }
  function down(owner){const m=readModel();if(m.subweapon?.guard?.requested)return;if(isBlocked()||m.persistence.phase!=="encounter"||!m.entitiesById[m.playersById[m.localPlayerId].entityId].alive||owners.has(owner))return;const first=owners.size===0;owners.add(owner);if(first)send(true,false,m);}
  function up(owner,cancel=false){if(!owners.delete(owner))return;if(owners.size===0)send(false,cancel);}
  function clear(release=true){const previous=[...owners];owners.clear();if(release){needsCancel=true;send(false,true);}else needsCancel=false;
    for(const owner of previous)if(typeof owner==="number")try{button.releasePointerCapture(owner);}catch{/* Capture already released. */}}
  listen(button,"pointerdown",event=>{if(event.button!==0)return;event.preventDefault();down(event.pointerId);try{button.setPointerCapture(event.pointerId);}catch{/* No capture support. */}});
  listen(button,"pointerup",event=>{event.preventDefault();up(event.pointerId);});
  for(const type of ["pointercancel","lostpointercapture"])listen(button,type,event=>up(event.pointerId,true));
  listen(button,"click",event=>{event.preventDefault();restoreGameplayFocus();}); // Compatibility click never becomes another tap.
  listen(environment,"keydown",event=>{if(event.code!=="Space"||event.repeat||["INPUT","SELECT","TEXTAREA"].includes(event.target?.tagName)||event.target?.tagName==='BUTTON'&&event.target!==button)return;event.preventDefault();down("keyboard");});
  listen(environment,"keyup",event=>{if(event.code==="Space"){if(event.target?.tagName!=="BUTTON")event.preventDefault();up("keyboard");}});
  listen(environment,"blur",()=>clear());
  listen(environment.document,"visibilitychange",()=>{if(environment.document.hidden)clear();});
  function refresh(model=readModel()){if(key!==spaceKey(model)){clear(false);key=spaceKey(model);}
    if(isBlocked()||!model.entitiesById[model.playersById[model.localPlayerId].entityId].alive||!["encounter"].includes(model.persistence.phase)){if(owners.size||needsCancel)clear(false);}else if(needsCancel)send(false,true,model);
    const hidden=!model.primary,disabled=isBlocked()||model.persistence.phase!=="encounter"||!model.entitiesById[model.playersById[model.localPlayerId].entityId].alive;
    if(button.hidden!==hidden)button.hidden=hidden;if(button.disabled!==disabled)button.disabled=disabled;
    const a=model.primary?.actorsById[model.playersById[model.localPlayerId].entityId];
    const held=String(Boolean(a?.held)),step=String(a?.current?.comboStep??a?.nextComboStep??1),pressed=String(owners.size>0);
    if(button.dataset.held!==held)button.dataset.held=held;if(button.dataset.step!==step)button.dataset.step=step;
    if(button.getAttribute?.("aria-pressed")!==pressed)button.setAttribute("aria-pressed",pressed);
  }
  return Object.freeze({refresh,clear,read:()=>({owners:[...owners]}),destroy:()=>{clear();listeners.forEach(fn=>fn());}});
}
