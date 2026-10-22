import {SETTLEMENT_LIFE_POLICY as P} from '../shared/content/settlement_life_v1.js';
import {itemDefinition} from '../shared/content/equipment.js';
import {saleQuote,supplyCount} from '../shared/contracts/settlement_services_v1.js';
export function createSettlementServicesMenu({document:doc,adapter,readModel,clearInput,restoreFocus,reportError}){
 const panel=doc.createElement('dialog');panel.id='settlement-services';panel.style.cssText='box-sizing:border-box;width:540px;max-width:calc(100vw - 24px);max-height:85vh;overflow:auto;background:#211d29;color:#f3e8ca;border:2px solid #bda163;border-radius:12px;padding:22px;font:16px system-ui';doc.body.append(panel);
 let npcId=null,lastKey=null,busy=false,notice='',confirmation=null;
 const supplyButton=doc.createElement('button');supplyButton.id='carried-rations';supplyButton.style.cssText='position:absolute;left:78px;top:12px;z-index:8;padding:10px;background:#282033;color:#f2db9d;border:1px solid #ad9359;border-radius:6px';doc.getElementById('world-bag').after(supplyButton);supplyButton.setAttribute('data-gameplay-hud','');
 const close=()=>{if(busy)return;panel.close();confirmation=null;restoreFocus();};
 function el(tag,text){const e=doc.createElement(tag);if(text!==undefined)e.textContent=text;return e;}
 function button(text,fn,key){const b=el('button',text);if(key)b.dataset.serviceAction=key;b.style.cssText='padding:12px;margin:6px 0;display:block;width:100%;text-align:left';b.disabled=busy;b.onclick=fn;return b;}
 async function issue(kind,payload){if(busy)return;clearInput();busy=true;notice='Saving transaction…';lastKey=null;refresh(readModel());try{const result=await adapter.issue(kind,{...payload,inventoryRevision:readModel().inventory.revision});if(!['admitted','alreadyApplied'].includes(result?.status))throw Error('Transaction was not accepted. No further purchase was queued.');notice='Transaction saved.';}catch(e){notice=e.message;reportError(e.message);}finally{busy=false;confirmation=null;lastKey=null;refresh(readModel());}}
 function draw(m){panel.replaceChildren();const p={playerId:m.localPlayerId,inventory:m.inventory},npc=m.serviceNpcs?.find(n=>n.id===npcId),a=m.entitiesById[m.playersById[m.localPlayerId].entityId];
  panel.append(el('h2',npc?npc.name+' · '+npc.roleLabel:'Carried supplies'),el('p','Gold: '+m.inventory.gold));
  if(notice){const status=el('p',notice);status.setAttribute('role','status');panel.append(status);}
  if(npcId&&(!npc||!npc.available)){panel.append(el('p','Approach this civilian to trade or rest.'));}
  else if(npc){panel.append(el('p',npc.role==='innkeeper'?P.rest.effect:'Ordinary personal stock · local Band '+npc.band+'. Equipment offers do not reroll on revisits.'));
   for(const q of npc.stock){const b=button((q.purchased?'Purchased · ':q.label+' · ')+q.price+' gold',()=>issue('service.buy',{npcId,offerId:q.id}),'buy:'+q.id);b.disabled=busy||q.purchased;panel.append(b);}
   if(npc.role==='general'){panel.append(button('Buy field ration · '+P.supply.price+' gold · restores '+P.supply.recoveryPercent+'% max HP',()=>issue('service.buy',{npcId,offerId:P.supply.id}),'buy:field-ration'));}
   if(npc.role==='innkeeper'){panel.append(button('Rest · '+P.rest.price+' gold · recover all missing HP',()=>issue('service.rest',{npcId}),'rest'));}
   if(npc.role==='general'||npc.role==='smith'){
    panel.append(el('h3','Sell carried equipment'));let count=0;
    for(const item of Object.values(m.inventory.itemsById)){const quote=saleQuote(p,item);if(quote===null)continue;count++;const d=itemDefinition(item);panel.append(button((confirmation===item.itemId?'Confirm sale: ':'')+d.name+' · receive '+quote+' gold',()=>{if(confirmation===item.itemId)void issue('service.sell',{npcId,itemId:item.itemId});else {confirmation=item.itemId;lastKey=null;refresh(readModel());}},'sell:'+item.itemId));}
    if(!count)panel.append(el('p','No eligible ordinary loot. Equipped gear, starter gear, provisions, Unique/protected items cannot be sold.'));
   }
  }
  panel.append(el('h3','Field rations: '+supplyCount(p)+' / '+P.supply.maximum));panel.append(button('Use one ration · recover '+P.supply.recoveryPercent+'% max HP · no time skip',()=>issue('supply.use',{}),'use-ration'));
  panel.append(button('Close',close,'close'));
 }
 function refresh(m){const enabled=Boolean(m.inventory?.services);supplyButton.hidden=!enabled;if(!enabled)return;const p={inventory:m.inventory};supplyButton.textContent='Rations · '+supplyCount(p);const key=m.localPlayerId+'/'+m.inventory.revision+'/'+busy+'/'+notice+'/'+confirmation+'/'+(m.serviceNpcs?.find(n=>n.id===npcId)?.available??false);if(panel.open&&key!==lastKey){lastKey=key;draw(m);}}
 supplyButton.onclick=()=>{clearInput();npcId=null;notice='';lastKey=null;panel.showModal();refresh(readModel());};
 panel.addEventListener('cancel',e=>{e.preventDefault();close();});
 return {isOpen:()=>panel.open,open(n){clearInput();npcId=n.serviceNpcId;confirmation=null;notice='';lastKey=null;panel.showModal();refresh(readModel());},refresh,destroy(){panel.remove();supplyButton.remove();}};
}
