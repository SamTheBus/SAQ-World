import {createShieldGuardInput} from './shield_guard_input.js';
import {barrierSvg,DUNGEON_COMBAT_ICONS} from './dungeon_combat_icons.js';
// Source HUD language: GUARD / BASH READY, purple DASH charge, purple Barrier.
// Input owns its own pointer; it never clears the movement or Primary owner.
export function createSubweaponHud({document,environment,readModel,adapter,isBlocked,clearPrimary=()=>{},reportError}){
 const guardButton=document.createElement('button');guardButton.type='button';guardButton.className='shield-guard';guardButton.dataset.gameplayHud='';document.getElementById('world-bag').parentElement.append(guardButton);const guard=createShieldGuardInput({button:guardButton,environment,readModel,adapter,isBlocked,clearPrimary,reportError});
 const panel=document.createElement('div'),dash=document.createElement('button');panel.className='subweapon-hud';panel.dataset.gameplayHud='';dash.className='shadow-dash';dash.dataset.gameplayHud='';dash.type='button';dash.setAttribute('aria-label','Shadow Dash — Shift');
 document.getElementById('world-bag').parentElement.append(panel,dash);const listeners=[],owners=new Set();
 const listen=(el,type,fn)=>{el.addEventListener(type,fn);listeners.push(()=>el.removeEventListener(type,fn));};
 function activate(){const m=readModel(),id=m.playersById[m.localPlayerId].entityId;if(isBlocked()||m.subweapon?.suppressed||!m.entitiesById[id].alive||m.playersById[m.localPlayerId].stats.subType!=='dagger'||m.subweapon.dash.cooldown||m.persistence.phase!=='encounter')return;
  try{adapter.issue('combat.shadowDash',{aim:m.primary.actorsById[id].facing},m);}catch(e){reportError(e.message);}
 }
 listen(dash,'pointerdown',e=>{e.preventDefault();e.stopPropagation();if(e.button!==0||owners.has(e.pointerId))return;owners.add(e.pointerId);try{dash.setPointerCapture(e.pointerId);}catch{}activate();});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(dash,type,e=>{owners.delete(e.pointerId);});
 listen(dash,'click',e=>e.preventDefault());listen(environment,'keydown',e=>{if(!['ShiftLeft','ShiftRight'].includes(e.code)||e.repeat||['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName))return;e.preventDefault();activate();});
 listen(environment,'blur',()=>owners.clear());let text='',lastPressure=0;
 function refresh(m){guard.refresh(m);const local=m.playersById[m.localPlayerId],c=m.subweapon,type=local.stats.subType;panel.hidden=!['shield','tome'].includes(type)||isBlocked()||c?.suppressed;dash.hidden=type!=='dagger'||isBlocked()||c?.suppressed;if(!c)return;panel.dataset.ready=String(type==='shield'&&c.pressure===3);if(type==='shield'&&c.pressure>lastPressure){panel.animate?.([{transform:'scale(1.07)',color:'#ffffff'},{transform:'scale(1)',color:'#f1c40f'}],{duration:220});}lastPressure=c.pressure;
  const chance=local.stats.familyProperties?.tomeChance??local.stats.familyProperties?.fireChance,firePercent=chance?Math.round(Number(chance.n)/Number(chance.d)*100):33;
  const next=type==='shield'?`GUARD ${'●'.repeat(c.pressure)}${'○'.repeat(3-c.pressure)}${c.pressure===3?' · BASH READY':''}`:type==='tome'?`${(local.stats.spellType??'fire').toUpperCase()} ${firePercent}% · Barrier ${c.barrierLabel} / ${c.maxBarrierLabel} · ${m.tomeTarget??'NO TARGET'}${c.delivery&&m.tick-c.delivery.tick<60&&c.delivery.status!=='idle'?' · '+c.delivery.status.toUpperCase():''}`:'';
  if(next!==text){if(type==='tome'){
    const fire=document.createElement('span'),barrier=document.createElement('span'),target=document.createElement('span');fire.textContent=`${(local.stats.spellType??'fire').toUpperCase()} ${firePercent}%`;fire.style.color=local.stats.spellType==='lightning'?'#c7b5ff':local.stats.spellType==='frost'?'#ced8ff':'#e67e22';barrier.innerHTML=barrierSvg();barrier.append(document.createTextNode(` BARRIER ${c.barrierLabel} / ${c.maxBarrierLabel}`));barrier.style.cssText='color:#9b59b6;display:inline-flex;align-items:center;gap:3px';target.textContent=`${m.tomeTarget??'NO TARGET'}${c.delivery&&m.tick-c.delivery.tick<60&&c.delivery.status!=='idle'?' · '+c.delivery.status.toUpperCase():''}`;target.style.color='#e5dce9';panel.replaceChildren(fire,document.createTextNode(' · '),barrier,document.createTextNode(' · '),target);
   }else if(type==='shield'){
    const icon=document.createElement('span'),label=document.createElement('span'),pips=document.createElement('span');icon.innerHTML=`<svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="#34475b" stroke="#f1c40f" stroke-width="2"><path d="${DUNGEON_COMBAT_ICONS.block.path}"/></svg>`;label.textContent='PRESSURE';pips.className='guard-pressure-pips';pips.setAttribute('aria-label',`${c.pressure} of 3 Guard Pressure`);for(let i=0;i<3;i++){const pip=document.createElement('i');pip.dataset.filled=String(i<c.pressure);pips.append(pip);}const ready=document.createElement('span');ready.textContent=c.pressure===3?'BASH READY':'';panel.replaceChildren(icon,label,pips,ready);
   }else panel.textContent=next;text=next;}panel.dataset.family=type??'';
  const ready=c.dash.cooldown===0,value=ready?'DASH · 1/1\nShift':`DASH\n${(c.dash.cooldown/60).toFixed(1)}s`;
  if(dash.dataset.label!==value){const label=document.createElement('span');label.textContent=value;dash.innerHTML='<svg aria-hidden="true" viewBox="-25 -11 34 22" width="30" height="20"><path d="M-22 -7L5 0L-22 7" fill="none" stroke="#c9afff" stroke-width="3"/></svg>';dash.append(label);dash.dataset.label=value;}dash.disabled=!ready||!m.entitiesById[local.entityId].alive;
 }
 return {refresh,clear:guard.clear,destroy(){guard.destroy();listeners.forEach(f=>f());panel.remove();dash.remove();}};
}
