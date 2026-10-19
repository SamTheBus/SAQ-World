// This panel observes authoritative liveness. Its only mutation is a stamped command.
import {formatLarge} from '../shared/contracts/large_number.js';
import {integerWire} from '../shared/contracts/integer_domain.js';
const xpText=v=>formatLarge(integerWire(v));
export function createDeathPresentation({document,readModel,adapter,clearInput,restoreGameplayFocus=()=>{}}) {
  const panel=document.getElementById('world-death'),button=document.getElementById('world-respawn');
  if(!panel||!button)return {refresh(){},destroy(){}};
  const set=(id,text)=>{const el=document.getElementById(id);if(el.textContent!==text)el.textContent=text;};
  let showing=false,error='';
  const respawn=()=>{
    const model=readModel();if(!model.recovery?.canRespawn||model.persistence.phase!=='encounter')return;
    clearInput();error='';
    try {adapter.issue('player.respawn',{},model);} catch(e) {error=e.message;}
    refresh(readModel());
  };
  button.addEventListener('click',respawn);
  function refresh(model) {
    const participant=model.playersById[model.localPlayerId],hero=model.entitiesById[participant.entityId];
    const dead=Boolean(model.recovery)&&!hero.alive;
    const wasShowing=showing;
    if(dead&&!showing){clearInput();error='';}
    if(panel.hidden===dead)panel.hidden=!dead;showing=dead;
    if(!dead){if(wasShowing)restoreGameplayFocus();error='';return;}
    if(!wasShowing)button.focus?.({preventScroll:true});
    const xp=participant.progression;
    set('world-death-level',`Level ${xpText(xp.level)}`);
    set('world-death-xp',xp.capped?`XP ${xpText(xp.totalXp)} · Maximum level`:`XP ${xpText(xp.totalXp)} total · ${xpText(xp.current)}/${xpText(xp.required)} to next level`);
    set('world-death-anchor',`Return to ${model.recovery.anchorLabel}`);
    const disabled=!model.recovery.canRespawn||model.persistence.phase!=='encounter';if(button.disabled!==disabled)button.disabled=disabled;
    set('world-death-status',error||(button.disabled?'Resolve the save status above to respawn.':''));
  }
  return Object.freeze({refresh,destroy:()=>button.removeEventListener('click',respawn)});
}
