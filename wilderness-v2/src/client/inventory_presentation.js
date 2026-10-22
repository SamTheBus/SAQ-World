import {combatPlayer} from '../shared/content/world_combat_v1.js';
import {createProgressionPresentation} from './progression_presentation.js';
import {inventoryIntakeCapacity} from '../shared/contracts/participant_progression.js';
import {statDifference,statText,statValue,statScale} from './stat_number.js';
import {progressionBigInt} from '../shared/contracts/progression_integer.js';
import {salvageQuote} from '../shared/contracts/gear_salvage.js';
import {RARITY_NAMES,RARITY_COLORS,affixRollRange} from '../shared/content/generated_gear.js';
import {SALVAGE_MATERIAL_ART} from './salvage_material_art.js';
import {itemArtKey} from './equipment_art.js';
import {itemDefinition,equipmentRequiredLevel,equipmentLevelAllowed} from '../shared/content/equipment.js';
import {SUBWEAPONS} from '../shared/content/subweapons.js';
import {createForgePresentation} from './forge_presentation.js';
import {effectiveEquipmentBonuses as ordinaryEquipmentBonuses} from '../shared/content/forge.js';
import {formatAmount} from '../shared/contracts/economy_amount.js';
import { EQUIPMENT, equipmentSlots, equipmentAfter } from '../shared/content/equipment.js';
import { resolvePlayerStats as resolveExactPlayerStats } from '../shared/contracts/player_stats.js';
import {presentCombat} from '../shared/contracts/combat_amount.js';
import {createContextActionInput} from './context_action_input.js';
const resolvePlayerStats=p=>{const stats=resolveExactPlayerStats(p);return Object.fromEntries(Object.entries({...stats,...stats.attributes}).map(([k,v])=>[k,v?.n!==undefined?statValue(v):v]));};
import { progressionAtXp } from '../shared/contracts/player_progression.js';
import { EQUIPMENT_ART, EQUIPMENT_STAT_ART } from './equipment_art.js';
// Display only; Offhand uses the exact 1% contribution, without the old ordinary-preview ceil.
export const displayedEquipmentBonuses=(d,slot,level=0,combat=false)=>slot==='subweapon'||d.rarityTier!==undefined?Object.fromEntries(Object.entries(d.bonuses).map(([k,v])=>[k,statDifference(statScale(v,100+level,100),-(slot==='weapon'&&k==='attack'?level*(combat?2:15):['chest','leggings','overall'].includes(slot)?k==='maxHp'?level*(combat?8:50):k==='defense'?level*(combat?2:10):0:['ring1','ring2'].includes(slot)?k==='attack'?level*(combat?2:10):k==='maxHp'?level*(combat?6:30):0:0))])):ordinaryEquipmentBonuses(d,slot,level,combat);
const effectiveEquipmentBonuses=displayedEquipmentBonuses;
const label=s=>({ring1:'Ring 1',ring2:'Ring 2',subweapon:'Offhand'})[s]??s[0].toUpperCase()+s.slice(1),statLabel={maxHp:'Max HP',attack:'Attack',defense:'Defense',moveSpeed:'Movement speed',critChance:'Critical chance',critMultiplier:'Critical damage',activeHaste:'Active Speed',str:'STR',dex:'DEX',int:'INT'};
// Preview uses the same slot operation and final stat resolver as an accepted equip.
// Progression comes from the local projection; no preview writes to live state.
export function equipmentComparison(inv,itemId,slot,totalXp=0,d8=undefined){
 const equipped=equipmentAfter(inv,itemId,slot);if(!equipped)return null;
 const progression=progressionAtXp(totalXp,d8),before=resolvePlayerStats({progression,d8,inventory:inv}),after=resolvePlayerStats({progression,d8,inventory:{...inv,equipped}});
 return {equipped,before,after,displaced:Object.values(inv.equipped).filter(id=>id&&!Object.values(equipped).includes(id)),difference:Object.fromEntries(Object.keys(statLabel).map(k=>[k,statDifference(after[k],before[k])]))};
}
export function contextActionForModel(model){
 const drop=model.loot?.find(entry=>entry.canPickUp);if(drop)return {kind:'loot.pickup',payload:{sourceEntityId:drop.sourceEntityId}};
 const resource=model.resources?.find(entry=>entry.canUse);if(resource)return {kind:'resource.interact',payload:{groupId:resource.groupId,episode:resource.episode,ordinal:resource.ordinal}};
 return null;
}
export function contextActionLabelForModel(model,action=contextActionForModel(model)){
 if(!action)return null;
 if(action.kind==='loot.pickup'){const drop=model.loot?.find(entry=>entry.sourceEntityId===action.payload.sourceEntityId);return drop?`Pick up: ${itemDefinition(drop).name}`:null;}
 const resource=model.resources?.find(entry=>entry.groupId===action.payload.groupId&&entry.episode===action.payload.episode&&entry.ordinal===action.payload.ordinal);if(!resource)return null;
 return resource.kind==='chest'?(model.space?.site?.siteKind==='woodland-cave'?'Open Chest':'Open chest'):resource.art==='barrel'?'Break barrel':resource.art==='urn'?'Break urn':'Break pot';
}
export function createInventoryPresentation({document,environment,readModel,adapter,clearInput,restoreGameplayFocus=()=>{}}){
 const panel=document.getElementById('world-inventory'),openButton=document.getElementById('world-bag'),pickup=document.getElementById('world-pickup');
 if(!panel||!openButton||!pickup)return {refresh(){},isOpen:()=>false,destroy(){}};
 const closeButton=document.getElementById('world-bag-close'),list=document.getElementById('world-items'),slots=document.getElementById('world-equipment'),status=document.getElementById('world-inventory-status'),comparison=document.getElementById('world-comparison');
 let forgeSession=false,salvagePending=null;
 const rarity=d=>`${RARITY_NAMES[d.rarityTier??0]} · ${d.rarityTier??0}★`;
 const tint=(e,d)=>{e.style.setProperty('--rarity',RARITY_COLORS[d.rarityTier??0]);e.classList.add('rarity-item');};
 let open=false,key=null,error='',observed=null,toastUntil=0,selected=null,gridKey=null,inspect=false,selectionOrigin=null,selectionRect=null,section="equipment",ringSlot="ring1";
 const progressionView=createProgressionPresentation({document,readModel,issue});
 const progressionButton=button('PROGRESSION',()=>{forgeSession=false;section='progression';inspect=false;key=null;refresh(readModel());});progressionButton.id='world-progression-tab';panel.querySelector('.bag-section-tabs').append(progressionButton);
 const forge=createForgePresentation({document,issue,invalidate:()=>{key=null;refresh(readModel());}});
 const gearSwitch=button('Carried gear',()=>{section=section==='forge'?'bag':'forge';inspect=false;key=null;refresh(readModel());});gearSwitch.id='world-forge-gear';gearSwitch.hidden=true;closeButton.before(gearSwitch);
 const alive=m=>m.entitiesById[m.playersById[m.localPlayerId].entityId].alive;
 function element(tag,value,cls=''){const e=document.createElement(tag);e.textContent=value;e.className=cls;return e;}
 function icon(key,empty=false){const img=document.createElement('img');img.src=EQUIPMENT_ART[key].url;img.alt='';img.className='equipment-icon'+(empty?' empty-icon':'');img.width=48;img.height=48;return img;}
 function button(caption,action,disabled=false){const b=element('button',caption);b.type='button';b.disabled=disabled;b.addEventListener('click',action);return b;}
 function attunementContribution(d,slot,level){const combat=combatPlayer({inventory:readModel().inventory});const base=effectiveEquipmentBonuses(d,slot,0,combat),at=effectiveEquipmentBonuses(d,slot,level,combat);return Object.fromEntries(Object.keys(base).map(k=>[k,statDifference(at[k],base[k])]));}
 function attunementPanel(d,slot,level,{destination=false}={}){const panel=element('section','',destination?'slot-attunement destination-attunement':'slot-attunement');panel.append(element('small',destination?'DESTINATION SLOT':`${label(slot).toUpperCase()} SLOT ATTUNEMENT`,'slot-label'),element('strong',`Lv. ${level} / 100`));const progress=document.createElement('progress');progress.max=100;progress.value=level;progress.setAttribute('aria-label',`${label(slot)} slot attunement level ${level} of 100`);panel.append(progress,element('p',destination?'This slot bonus applies while the item is equipped.':'This bonus remains with the slot when gear is replaced.','tt-muted'));if(d){const current=attunementContribution(d,slot,level),next=level<100?attunementContribution(d,slot,level+1):current,rows=element('div','','attunement-contribution');for(const [k,name] of [['attack','Attack'],['defense','Defense'],['maxHp','Max HP']])if(current[k]||next[k])rows.append(element('span',`${name} ${current[k]>=0?'+':''}${statText(current[k],true)}${level<100?` → ${next[k]>=0?'+':''}${statText(next[k],true)}`:''}`));if(rows.childElementCount)panel.append(rows);}return panel;}
 function close(){salvagePending=null;forgeSession=false;open=false;inspect=false;panel.hidden=true;key=null;restoreGameplayFocus();}
 function openForge(){const m=readModel();if(!m.forgeAccess)return;clearInput();forgeSession=true;section="forge";open=true;inspect=false;error="";key=null;refresh(readModel());closeButton.focus();}
 function toggle(){if(open)return close();forgeSession=false;if(section==="forge")section="equipment";const m=readModel();if(!m.inventory||!alive(m))return;clearInput();open=true;error='';inspect=false;refresh(readModel());closeButton.focus();}
 function issue(kind,payload){const m=readModel();if(!m.inventory||!alive(m)||m.persistence.phase!=='encounter')return;error='';try{adapter.issue(kind,{...payload,inventoryRevision:payload.inventoryRevision??m.inventory.revision},m);}catch(e){error=e.message;}key=null;refresh(readModel());}
 function collect(){if(open)return;const action=contextActionForModel(readModel());if(action){issue(action.kind,action.payload);restoreGameplayFocus();}}
 const contextInput=createContextActionInput({button:pickup,activate:collect});

 function refresh(m,time=environment.performance.now()){
  openButton.hidden=!m.inventory;pickup.hidden=true;if(!m.inventory)return;
  if(open&&(!alive(m)||forgeSession&&!m.forgeAccess)){open=false;panel.hidden=true;key=null;}openButton.disabled=!alive(m);
  const caption=`Bag`;if(openButton.textContent!==caption)openButton.replaceChildren(document.createTextNode(caption));
  if(salvagePending&&salvagePending.inventoryRevision!==m.inventory.revision){salvagePending=null;error='Inventory changed. Review the item again.';}const inv=m.inventory,local=m.playersById[m.localPlayerId],ready=m.persistence.phase==='encounter'&&alive(m),primary=m.primary?.actorsById[local.entityId],canEquip=ready&&!primary?.current&&!primary?.held&&!primary?.queued;
  const action=contextActionForModel(m),actionLabel=contextActionLabelForModel(m,action);if(action&&actionLabel&&!open&&ready){pickup.hidden=false;pickup.textContent=actionLabel;pickup.setAttribute('aria-label',action.kind==='loot.pickup'?actionLabel.replace('Pick up:','Pick up'):actionLabel);}
  const identity=`${m.context.campaignId}/${m.localPlayerId}`;
  if(observed?.identity===identity){const added=Object.values(inv.itemsById).find(i=>!observed.ids.has(i.itemId));if(added){document.getElementById('world-loot-notice').replaceChildren(icon(itemArtKey(added)),element('span',itemDefinition(added).name));toastUntil=time+1800;}}
  else if(observed?.identity!==identity){toastUntil=0;selected=null;}
  if(observed?.identity===identity&&observed.revision!==inv.revision){const gained=(inv.economy?.materials['Monster Soul']??0)-(observed.souls??0);if(gained>0){document.getElementById('world-loot-notice').replaceChildren(element('span',`+${gained} Monster Soul${gained===1?'':'s'}`));toastUntil=time+1600;}}
  if(observed?.identity!==identity||observed.revision!==inv.revision)observed={identity,revision:inv.revision,gold:inv.gold,souls:inv.economy?.materials['Monster Soul']??0,ids:new Set(Object.keys(inv.itemsById))};document.getElementById('world-loot-notice').hidden=open||!alive(m)||time>=toastUntil;
  progressionView.refresh(m,open&&section==='progression');progressionButton.setAttribute('aria-pressed',String(section==='progression'));
  panel.hidden=!open;gearSwitch.hidden=!open||!forgeSession;gearSwitch.textContent=section==='forge'?'Carried gear':'Attunement';if(!open)return;if(section==='progression'){panel.dataset.section='progression';panel.classList.remove('is-inspecting');comparison.hidden=true;document.getElementById('world-bag-title').textContent='PROGRESSION';for(const id of ['equipment','bag','materials'])document.getElementById(`world-${id}-tab`).setAttribute('aria-pressed','false');status.textContent=error||'Select a node to review. Purchase explicitly.';return;}if(!inv.itemsById[selected])selected=inv.equipped.weapon;
  const owner={...local,inventory:inv},nextGridKey=`${identity}/${inv.revision}/${local.progression.level}/${local.d8?.revision??0}/${JSON.stringify(local.stats)}`;
  if(gridKey!==nextGridKey){
   gridKey=nextGridKey;slots.replaceChildren();list.replaceChildren();
   const equippedIds=new Set(Object.values(inv.equipped));
   for(const slot of equipmentSlots(inv)){
    const id=inv.equipped[slot],d=itemDefinition(inv.itemsById[id]),row=element('article','','paperdoll-slot');row.dataset.slot=slot;if(d)tint(row,d);
    if(!d){const copy=element('div','','item-info');copy.append(element('small',label(slot).toUpperCase(),'slot-label'),element('span',inv.equipped.overall&&['chest','leggings'].includes(slot)?'[COVERED BY OVERALL]':'[EMPTY SLOT]','empty-slot'));row.append(copy);}
    else {const inspectButton=button('',()=>select(id,inspectButton));inspectButton.className='inspect-item';inspectButton.dataset.itemId=id;inspectButton.setAttribute('aria-label',`Inspect ${d.name}, ${label(slot)}`);const copy=element('div','','item-info');copy.append(element('strong',d.name,'item-title'),element('small',`${label(slot).toUpperCase()} · ${rarity(d)}`,'item-sub'),element('span',`Attune Lv. ${inv.economy?.slotLevels[slot]??0}`,'attune-badge'));inspectButton.append(icon(itemArtKey(inv.itemsById[id])),copy);row.append(inspectButton);
     if(slot!=='weapon'){const unequip=button('UNEQUIP',()=>issue('equipment.unequip',{slot}));unequip.className='row-action';unequip.dataset.equipmentAction='';unequip.setAttribute('aria-label',`Unequip ${label(slot)}`);row.append(unequip);}}
    slots.append(row);
   }
   for(const item of Object.values(inv.itemsById)){
    const d=itemDefinition(item);if(equippedIds.has(item.itemId))continue;
    const row=element('article','','stash-card');tint(row,d);const inspectButton=button('',()=>select(item.itemId,inspectButton));inspectButton.className='inspect-item';inspectButton.dataset.itemId=item.itemId;inspectButton.setAttribute('aria-label',`Inspect ${d.name}`);
    const copy=element('div','','item-info');copy.append(element('strong',d.name,'item-title'),element('small',`${label(d.slot).toUpperCase()} · ${rarity(d)}`,'item-sub'),element('span',Object.entries(d.bonuses).filter(([,v])=>v).map(([k,v])=>`${{attack:'ATK',defense:'DEF',maxHp:'HP'}[k]} +${statText(v)}`).join(' | ')||'No stat bonus','item-sub gear-bonuses'));inspectButton.append(icon(itemArtKey(item)),copy);row.append(inspectButton);
    const target=d.slot==='ring'?'ring1':d.slot,preview=equipmentComparison(inv,item.itemId,target,local.progression.totalXp,local.d8),allowed=equipmentLevelAllowed(owner,item),required=equipmentRequiredLevel(owner,item),action=button(!allowed?`REQUIRES LV. ${required}`:d.slot==='ring'?'EQUIP \u2026':preview.displaced.length?'SWAP':'EQUIP',()=>{if(d.slot==='ring')select(item.itemId,inspectButton);else issue('equipment.equip',{itemId:item.itemId,slot:target});},!allowed);action.className='row-action action-equip';action.dataset.equipmentAction='';action.dataset.equipItemId=item.itemId;action.setAttribute('aria-label',!allowed?`${d.name} requires hero level ${required}`:`${d.slot==='ring'?'Choose ring slot for':'Equip'} ${d.name}`);row.append(action);list.append(row);
   }
   if(inv.subweapons){const provisions=element('section','','base-provisions');provisions.append(element('h3','BASE SUBWEAPON PROVISIONS'));for(const [type,d] of Object.entries(SUBWEAPONS)){const claimed=Boolean(inv.subweapons.claims[type]),b=button(claimed?`${d.name} — claimed`:`${d.provision}: ${d.name}`,()=>issue('subweapon.claim',{subType:type}),claimed||progressionBigInt(local.progression.level)<2n||Object.keys(inv.itemsById).length>=(local.d8?inventoryIntakeCapacity(local.d8):64));b.prepend(icon(d.definitionId));provisions.append(b);}provisions.append(element('small',progressionBigInt(local.progression.level)<2n?'Unlocks at Level 2.':'Claim each base subweapon once.','tt-muted'));list.append(provisions);}
   if(!list.childElementCount)list.append(element('p','Your gear is equipped. New finds will appear here.','bag-empty'));
   document.getElementById('world-bag-tab').textContent='CARRIED GEAR';
   document.getElementById('world-carried-count').textContent=`${Object.keys(inv.itemsById).length-[...equippedIds].filter(Boolean).length} items`;
   const goldArt=document.querySelector('#world-wallet svg')?.cloneNode(true)??icon('gold');
   document.getElementById('world-bag-summary').replaceChildren(goldArt,element('strong',`${formatAmount(inv.gold)} gold`),element('span',`${Object.keys(inv.itemsById).length} / ${local.d8?inventoryIntakeCapacity(local.d8):64} owned`));
  }
  const nextKey=`${nextGridKey}/${local.progression.level}/${canEquip}/${m.persistence.phase}/${selected}/${inspect}/${salvagePending?.fingerprint??''}/${error}/${section}/${ringSlot}/${m.forgeAccess}`;if(key===nextKey)return;key=nextKey;
  document.getElementById('world-bag-stats').textContent=`Attack ${statText(local.stats.attack)}  \u00b7  Defense ${statText(local.stats.defense)}  \u00b7  Max HP ${statText(local.stats.maxHp)}`;
  document.getElementById('world-bag-title').textContent=section==='forge'?'BLACKSMITH FORGE':'INVENTORY';
  forge.render(m,section);
  status.textContent=error||(section==='forge'?'Attunement is permanent. Each press applies one level.':!canEquip?'Finish your swing before changing equipment.':combatPlayer(owner)?'Higher-level enemies resist attacks. Large level gaps reduce XP. The world keeps moving.':'The world keeps moving while your Bag is open.');
  for(const action of panel.querySelectorAll('[data-equipment-action]'))action.disabled=!canEquip||Boolean(action.dataset.equipItemId&&!equipmentLevelAllowed(owner,inv.itemsById[action.dataset.equipItemId]));
  for(const card of panel.querySelectorAll('[data-item-id]'))card.setAttribute('aria-pressed',String(inspect&&card.dataset.itemId===selected));
  panel.classList.toggle('is-inspecting',inspect);panel.dataset.section=section;
  document.getElementById('world-equipment-tab').setAttribute('aria-pressed',String(section==='equipment'));document.getElementById('world-bag-tab').setAttribute('aria-pressed',String(section==='bag'));for(const name of ['materials'])document.getElementById(`world-${name}-tab`).setAttribute('aria-pressed',String(section===name));

  const previousAction=comparison.contains(document.activeElement)?document.activeElement.dataset.action:null;
  comparison.replaceChildren();
  comparison.hidden=!inspect;if(!inspect)return;
  const item=inv.itemsById[selected],d=itemDefinition(item),equippedSlot=Object.keys(inv.equipped).find(slot=>inv.equipped[slot]===item.itemId);
  const dismiss=button('\u00d7',()=>dismissTooltip());dismiss.className='tooltip-close';dismiss.setAttribute('aria-label','Close item tooltip');dismiss.dataset.action='dismiss';comparison.append(dismiss);
  const scroll=element('div','','item-detail-scroll'),cards=element('div','','tooltip-flex-container');
  if(equippedSlot){
   const equippedCard=itemCard({...d,generated:item.generated},true,'world-item-title');
   if(inv.economy)equippedCard.append(attunementPanel(d,equippedSlot,inv.economy.slotLevels[equippedSlot]));
   cards.append(equippedCard);
   // Already equipped: exactly one compact item card, no disabled action/explanation.
  }else{
   const target=d.slot==='ring'?ringSlot:d.slot,preview=equipmentComparison(inv,item.itemId,target,local.progression.totalXp,local.d8);
   if(d.slot==='ring'){const choice=element('div','','ring-destination');for(const slot of ['ring1','ring2']){const b=button(label(slot),()=>{ringSlot=slot;key=null;refresh(readModel());});b.setAttribute('aria-pressed',String(slot===ringSlot));b.dataset.action='choose-'+slot;choice.append(b);}scroll.append(choice);}
   const current=element('div','','tooltip-card current-card');current.append(element('span','EQUIPPED','equipped-ribbon'));
   const replaced=preview.displaced.length?preview.displaced:inv.equipped[target]?[inv.equipped[target]]:[];
   if(replaced.length){
    if(replaced.length>1){
     const without={...inv.equipped};for(const slot of Object.keys(without))if(replaced.includes(without[slot]))without[slot]=null;
     const rest=resolvePlayerStats({progression:progressionAtXp(local.progression.totalXp,local.d8),d8:local.d8,inventory:{...inv,equipped:without}}),combined={name:'Equipped Chest + Leggings',slot:'overall',bonuses:Object.fromEntries(Object.keys(statLabel).map(k=>[k,statDifference(preview.before[k],rest[k])]))};
     const part=itemCard(combined);part.classList.add('current-part');current.append(part,element('small',replaced.map(id=>itemDefinition(inv.itemsById[id]).name).join(' + '),'combined-label'));
    }else {const oldItem=inv.itemsById[replaced[0]],old=itemDefinition(oldItem),oldSlot=Object.keys(inv.equipped).find(k=>inv.equipped[k]===replaced[0]),part=itemCard({...old,generated:oldItem.generated});part.classList.add('current-part');current.append(part,attunementPanel(old,oldSlot,inv.economy?.slotLevels[oldSlot]??0));}

   }else {current.append(element('h4',label(target),'tt-title'),element('p','[EMPTY SLOT]','tt-subtitle'));}
   const candidate=itemCard({...d,generated:item.generated},false,'world-item-title');candidate.classList.add('candidate-card');candidate.dataset.destination=target;if(inv.economy)candidate.append(attunementPanel(d,target,inv.economy.slotLevels[target],{destination:true}));
   const delta=element('div','','net-change');delta.append(element('h4','Net Change:'));
   for(const [stat,value] of Object.entries(preview.difference))if(value){const row=element('div','',value>0?'stat-gain':'stat-loss');row.dataset.stat=stat;row.append(statIcon(stat),element('span',`${statLabel[stat]}: ${value>0?'+':''}${statText(value,true)}`));delta.append(row);}
   if(delta.childElementCount===1)delta.append(element('p','No net difference.','tt-muted'));candidate.append(delta);
   const allowed=equipmentLevelAllowed(owner,item),required=equipmentRequiredLevel(owner,item),action=button(!allowed?`Requires hero level ${required}`:`${preview.displaced.length?'Swap':'Equip'}${d.slot==='ring'?` to ${label(target)}`:''}`,()=>issue('equipment.equip',{itemId:item.itemId,slot:target}),!canEquip||!allowed);action.className='equip-action';action.dataset.action=target;candidate.append(action);if(item.sourceEntityId!==null){const drop=button('Drop',()=>{issue('gear.drop',{itemId:item.itemId});inspect=false;salvagePending=null;key=null;refresh(readModel());},!canEquip);drop.dataset.action='drop';drop.className='row-action';candidate.append(drop,element('small','Drop keeps the item on your personal ground.','tt-muted'));
    const protectedItem=Object.values(inv.subweapons?.claims??{}).some(c=>c.sourceEntityId===item.sourceEntityId);
    if(!protectedItem){const salvage=button('Salvage',()=>{salvagePending={...salvageQuote(local,item),itemId:item.itemId,inventoryRevision:inv.revision};key=null;refresh(readModel());},!canEquip);salvage.dataset.action='salvage';salvage.className='row-action action-salvage';candidate.append(salvage);
     if(salvagePending?.itemId===item.itemId){const box=element('section','','salvage-confirmation');box.setAttribute('role','alertdialog');box.setAttribute('aria-label','Confirm permanent salvage');box.append(element('h4','SALVAGE THIS ITEM?'),element('p',`${d.name} will be permanently destroyed.`));const outputs=element('div','','salvage-outputs');for(const [name,quantity] of Object.entries(salvagePending.materials)){const row=element('div','','salvage-output'),img=document.createElement('img');img.src=SALVAGE_MATERIAL_ART[name];img.width=28;img.height=28;img.alt='';row.append(img,element('span',`${quantity} ${name}`));outputs.append(row);}box.append(outputs);const confirm=button('Confirm salvage',()=>{const q=salvagePending;if(!q)return;issue('gear.salvage',{itemId:q.itemId,fingerprint:q.fingerprint,inventoryRevision:q.inventoryRevision});salvagePending=null;inspect=false;key=null;refresh(readModel());},!canEquip);confirm.className='action-salvage';confirm.dataset.action='confirm-salvage';box.append(confirm,button('Cancel',()=>{salvagePending=null;key=null;refresh(readModel());}));candidate.append(box);}
    }else candidate.append(element('small','Base provision · protected from salvage.','tt-muted'));}cards.append(current,candidate);
  }
  if(salvagePending){const confirm=cards.querySelector('.salvage-confirmation');if(confirm){const heading=element('div','','salvage-item-heading');heading.append(icon(itemArtKey(item)),element('strong',d.name),element('small',rarity(d)));tint(heading,d);cards.replaceChildren(heading,confirm);cards.classList.add('salvage-only');}}scroll.append(cards);comparison.append(scroll);positionTooltip();
  if(previousAction){const target=[...comparison.querySelectorAll('button')].find(b=>b.dataset.action===previousAction&&!b.disabled);(target??document.getElementById('world-item-title')??comparison.querySelector('button')??closeButton).focus({preventScroll:true});}
 }
 function statIcon(key){if(!EQUIPMENT_STAT_ART[key])return element('span','');const img=document.createElement('img');img.src=EQUIPMENT_STAT_ART[key];img.alt='';img.width=16;img.height=16;return img;}
 function itemCard(d,equipped=false,id=null){
  const card=element('div','','tooltip-card');tint(card,d);if(equipped)card.append(element('span','EQUIPPED','equipped-ribbon'));
  if(d.subType==='tome'&&d.spellType)card.append(element('p',({fire:'Infernal Fireball · single-target Burn',lightning:'Chain Lightning · one additional target',frost:'Glacial Frost · Chill builds to Freeze'})[d.spellType],'tt-subtitle'));
  const title=element('h4',d.name,'tt-title');if(id){title.id=id;title.tabIndex=-1;}if(d.subType&&!d.effects){card.append(element('p',d.description,'tt-subtitle'),element('p',Object.entries(d.attributes).filter(([,v])=>v).map(([k,v])=>`${k.toUpperCase()} +${statText(v)}`).join(' · '),'stat-gain'));}
  card.append(title,element('p',`${rarity(d)} · ${label(d.slot).toUpperCase()}${d.slot==='overall'?' \u00b7 Chest + leggings':''}`,'tt-subtitle'));
  const generated=d.generated,required=equipmentRequiredLevel({inventory:readModel().inventory},{generated});if(required!==null)card.append(element('p',`Requires hero level ${required}`,'tt-subtitle'));const rolled=Object.fromEntries((generated?.affixes??[]).map(a=>[a.key,a.value])),effectKey=k=>k==='activeSpd'?'activeSpeed':k;
  const names={attack:'Attack',defense:'Defense',maxHp:'Max HP',moveSpeed:'Movement speed',critChance:'Critical chance',critDamage:'Critical damage',block:'Block',parry:'Parry',activeSpeed:'Active Speed',bonusAreaRadius:'Area Radius',atkPct:'Attack',maxHpPct:'Max HP',defPct:'Defense',moveSpeedPct:'Movement speed',strPct:'STR',dexPct:'DEX',intPct:'INT',str:'STR',dex:'DEX',int:'INT'};
  const pctKeys=new Set(['activeSpd','activeSpeed','critChance','critDamage','block','parry','bonusAreaRadius','atkPct','maxHpPct','defPct','moveSpeedPct','strPct','dexPct','intPct']),display=(key,value)=>`${names[key]??key} +${statText(statScale(value,pctKeys.has(key)?100:1),true)}${pctKeys.has(key)||key==='moveSpeed'?'%':''}`;
  if(generated){const base=element('section','','item-layer base-layer');base.append(element('strong','BASE STATS'));const flatAffix={attack:'atk',defense:'def',maxHp:'maxHp'},baseRows=[];for(const [key,total] of Object.entries(d.bonuses??{})){const value=statDifference(total,rolled[flatAffix[key]]??0);if(value||key==='attack'&&d.slot==='weapon')baseRows.push([key,value]);}for(const [key,total] of Object.entries(d.attributes??{})){const value=statDifference(total,rolled[key]??0);if(value)baseRows.push([key,value]);}const grid=element('div','','base-stats-grid');for(const [key,value] of baseRows){const cell=element('div','','base-stat'),valueRow=element('div','');valueRow.append(statIcon(key),element('strong',statText(value,true)));cell.append(element('small',names[key]??key),valueRow);grid.append(cell);}base.append(grid);card.append(base);
   const inherent=element('section','','item-layer inherent-layer');inherent.append(element('strong','INHERENT TRAITS'));let traits=0;for(const [key,total] of Object.entries(d.effects??{})){const affix=Object.entries(rolled).find(([k])=>effectKey(k)===key)?.[1]??0,value=statDifference(total,affix);if(!value)continue;inherent.append(element('p',display(key,value)));traits++;}if(d.subType==='tome'){const q=d.family?.tomeProfile?.chance,chance=q?Number(q.n)/Number(q.d):(d.family?.fireChanceNumerator&&d.family.fireChanceDenominator?d.family.fireChanceNumerator/d.family.fireChanceDenominator:0);if(chance){inherent.append(element('p',`Spell proc chance ${Number((chance*100).toFixed(1))}%`));traits++;}}if(!traits)inherent.append(element('p','None','tt-muted'));card.append(inherent);
   const affixes=element('section','','item-layer affix-layer'),list=generated.affixes??[];affixes.append(element('strong',`AFFIXES — ${list.length}`));if(!list.length)affixes.append(element('p','None','tt-muted'));for(const a of list){affixes.append(element('p',display(a.key,a.value)));const range=affixRollRange(generated,a.key),from=display(a.key,range.minimum).replace(/^.*? \+/,''),to=display(a.key,range.maximum).replace(/^.*? \+/,'');affixes.append(element('small',`Possible roll: ${from}–${to}`,'affix-range'));}card.append(affixes);
  }else {const stats=element('div','','base-stats-grid');for(const [stat,value] of Object.entries(d.bonuses??{}))if(value||stat==='attack'&&d.slot==='weapon'){const cell=element('div','','base-stat'),valueRow=element('div','');valueRow.append(statIcon(stat),element('strong',statText(value,true)));cell.append(element('small',stat==='attack'?'Attack bonus':statLabel[stat]),valueRow);stats.append(cell);}card.append(stats);if(d.effects){const effects=element('div','','gear-effects');for(const [k,v] of Object.entries(d.attributes??{}))if(v)effects.append(element('p',`${k.toUpperCase()} +${statText(v)}`));for(const [k,v] of Object.entries(d.effects))if(v)effects.append(element('p',display(k,v)));card.append(effects);}}
  return card;
 }

 function select(id,origin){if(!id)return;salvagePending=null;selected=id;selectionOrigin=origin;selectionRect=origin.getBoundingClientRect();inspect=true;key=null;refresh(readModel());document.getElementById('world-item-title')?.focus({preventScroll:true});}

 const sectionButtons=['equipment','bag','materials'].map(name=>{const button=document.getElementById(`world-${name}-tab`),listener=()=>{section=name;inspect=false;key=null;refresh(readModel());document.getElementById('world-bag-browse').scrollTop=0;};button.addEventListener('click',listener);return {button,listener};});
 function dismissTooltip(restore=true){salvagePending=null;inspect=false;key=null;refresh(readModel());if(restore)(selectionOrigin?.isConnected?selectionOrigin:closeButton).focus({preventScroll:true});}
 function positionTooltip(){
  if(!inspect)return;
  const bounds=panel.getBoundingClientRect(),anchor=selectionRect??bounds,minTop=panel.querySelector('.bag-heading').getBoundingClientRect().bottom+8,width=Math.min(comparison.querySelector('.candidate-card')&&environment.innerWidth>699?520:300,bounds.width-16);
  comparison.style.width=`${width}px`;comparison.style.maxHeight=`${Math.min(environment.innerHeight*.76,bounds.bottom-minTop-8)}px`;
  const height=comparison.getBoundingClientRect().height;
  // Float beside the tapped row when possible. Keep the Bag close control clear.
  let left=anchor.right+10,top=anchor.top;
  if(left+width>bounds.right-8){left=anchor.left-width-10;if(left<bounds.left+8){left=bounds.left+(bounds.width-width)/2;top=anchor.bottom+8;if(top+height>bounds.bottom-8)top=anchor.top-height-8;}}
  comparison.style.left=`${Math.max(bounds.left+8,Math.min(left,bounds.right-width-8))}px`;
  comparison.style.top=`${Math.max(minTop,Math.min(top,bounds.bottom-height-8))}px`;

 }
 const outside=e=>{if(open&&inspect&&!comparison.contains(e.target)&&!e.target.closest?.('[data-item-id]'))dismissTooltip(false);};
 panel.addEventListener('pointerdown',outside);
 const resized=()=>{key=null;if(open)refresh(readModel());};
 environment.addEventListener('resize',resized);
 const keyboard=e=>{if(e.repeat||['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName))return;if(e.code==='KeyI'){e.preventDefault();toggle();}else if(e.code==='KeyE'&&!open){e.preventDefault();collect();}else if(e.code==='Escape'&&open){e.preventDefault();close();}else if(e.code==='Tab'&&open){const buttons=[...panel.querySelectorAll('button:not(:disabled)')].filter(b=>b.getClientRects().length&& !b.closest('[inert]')),first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
 openButton.addEventListener('click',toggle);closeButton.addEventListener('click',close);environment.addEventListener('keydown',keyboard);
 return Object.freeze({refresh,openForge,isOpen:()=>open,destroy(){contextInput.destroy();progressionView.destroy();progressionButton.remove();for(const {button,listener} of sectionButtons)button.removeEventListener('click',listener);panel.removeEventListener('pointerdown',outside);environment.removeEventListener('resize',resized);openButton.removeEventListener('click',toggle);closeButton.removeEventListener('click',close);environment.removeEventListener('keydown',keyboard);}});
}
