import {statDifference,statText,statValue} from './stat_number.js';
import {SALVAGE_MATERIAL_ART} from './salvage_material_art.js';
import {itemArtKey} from './equipment_art.js';
import {itemDefinition} from '../shared/content/equipment.js';
import {attunementCost} from '../shared/content/forge.js';
import {EQUIPMENT,equipmentSlots} from '../shared/content/equipment.js';
import {compareAmount,formatAmount} from '../shared/contracts/economy_amount.js';
import {resolvePlayerStats as resolveExactPlayerStats} from '../shared/contracts/player_stats.js';
import {presentCombat} from '../shared/contracts/combat_amount.js';
const resolvePlayerStats=p=>Object.fromEntries(Object.entries(resolveExactPlayerStats(p)).map(([k,v])=>[k,v?.n!==undefined?statValue(v):v]));
import {progressionAtXp} from '../shared/contracts/player_progression.js';
import {EQUIPMENT_ART,SLOT_ART_KEYS,EQUIPMENT_STAT_ART} from './equipment_art.js';
import {MONSTER_SOUL_ART} from './forge_art.js';
const label=k=>({ring1:'Ring 1',ring2:'Ring 2',subweapon:'Offhand'})[k]??k[0].toUpperCase()+k.slice(1);
// Dungeon assets.js uiIcons.moveSpeed, unchanged path/color.
const speedUrl='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3498db" stroke-width="2.5" stroke-linejoin="round"><path d="M6 5h5v6l8 4c2 1 2 4-1 4H6V5zm3 2h2M9 9h2" /></svg>');
const soulUrl='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(MONSTER_SOUL_ART);
export function createForgePresentation({document,issue,invalidate}){
 const root=document.getElementById('world-forge-view'),materials=document.getElementById('world-materials-view');let selected='weapon';
 const icon=url=>{const img=document.createElement('img');img.src=url;img.alt='';img.width=24;img.height=24;return img;};
 const el=(tag,text,cls='')=>{const e=document.createElement(tag);e.textContent=text;e.className=cls;return e;};
 function render(m,section){if(!m.inventory?.economy)return;const inv=m.inventory,e=inv.economy,review=e.origin==='forge-review-v1';
  if(section==='materials'){materials.replaceChildren(el('h3','MATERIALS & SOULS'));for(const [name,url] of Object.entries(SALVAGE_MATERIAL_ART)){const quantity=e.materials[name]??0;if(!quantity&&name!=='Monster Soul')continue;const row=el('article','','material-card'),img=icon(url),info=el('div','','item-info');info.append(el('strong',name),el('small','Forge material','item-sub'));row.append(img,info,el('strong',String(quantity)));materials.append(row);}materials.append(el('p','Materials are held separately from carried gear.','tt-muted'));if(review)materials.append(el('p','FUNDED FORGE REVIEW — separate test campaign','forge-review-label'));return;}
  if(section!=='forge')return;
  const focus=document.activeElement?.dataset.forgeAction;root.replaceChildren();
  const latest=Object.values(e.lastAttunementsBySlot).sort((a,b)=>b.authorityOrder-a.authorityOrder)[0];if(latest){const notice=el('p',`Attuned ${label(latest.command.payload.slot)} to Lv. ${e.slotLevels[latest.command.payload.slot]}!`,'stat-gain');notice.setAttribute('role','status');root.append(notice);}
  if(review)root.append(el('p','FUNDED FORGE REVIEW — starting funds are for testing only.','forge-review-label'));
  if(!m.forgeAccess)root.append(el('p','Approach the Forge to attune.','forge-access'));
  const layout=el('div','','forge-layout'),list=el('div','','forge-slots'),details=el('div','','forge-details');
  for(const slot of equipmentSlots(inv)){const item=inv.itemsById[inv.equipped[slot]],d=itemDefinition(item),b=el('button','','forge-slot-card');b.type='button';b.dataset.forgeAction=slot;b.setAttribute('aria-pressed',String(slot===selected));b.setAttribute('aria-label',`${label(slot)} slot, level ${e.slotLevels[slot]}`);{const img=document.createElement('img');img.src=EQUIPMENT_ART[itemArtKey(item)??SLOT_ART_KEYS[slot]].url;img.alt='';img.width=36;img.height=36;b.append(img);}const info=el('span','','item-info');info.append(el('strong',label(slot)),el('small',d?.name??'[EMPTY SLOT]','item-sub'));b.append(info,el('span',`${e.slotLevels[slot]}/100`,'forge-rank'));b.onclick=()=>{selected=slot;invalidate();};list.append(b);}
  const level=e.slotLevels[selected],item=inv.itemsById[inv.equipped[selected]],d=itemDefinition(item);details.append(el('h4',label(selected).toUpperCase()+' SLOT ATTUNEMENT'),el('p',`Lv. ${level} / 100`));const progress=document.createElement('progress');progress.max=100;progress.value=level;progress.setAttribute('aria-label','Slot attunement');details.append(progress,el('p','This bonus remains with the slot when gear is replaced.','tt-muted'));
  if(level===100)details.append(el('p','MAXIMUM ATTUNEMENT REACHED','stat-gain'));
  else {const cost=attunementCost(level,{inventory:inv}),affordGold=compareAmount(inv.gold,cost.gold)>=0,affordMaterials=Object.entries(cost.materials).every(([k,v])=>(e.materials[k]??0)>=v),box=el('div','','forge-requirements');box.append(el('h4','ATTUNEMENT REQUIREMENTS'));
   const gold=el('p',`${formatAmount(cost.gold)} Gold`,affordGold?'stat-gain':'stat-loss');gold.title=cost.gold+' gold exactly';gold.prepend(icon(EQUIPMENT_ART.gold.url));box.append(gold,el('small',`Owned: ${formatAmount(inv.gold)}`));
   for(const [k,v] of Object.entries(cost.materials)){const row=el('p',`${v.toLocaleString()} ${k}`,(e.materials[k]??0)>=v?'stat-gain':'stat-loss');if(SALVAGE_MATERIAL_ART[k])row.prepend(icon(SALVAGE_MATERIAL_ART[k]));box.append(row,el('small',`Owned: ${(e.materials[k]??0).toLocaleString()}`));}details.append(box);
   if(Object.keys(cost.materials).some(k=>!['Monster Soul','Rare Scrap'].includes(k)))details.append(el('p','This tier requires materials whose normal-play sources are not available yet.','forge-deferred'));
   if(d){const p={d8:m.playersById[m.localPlayerId].d8,progression:progressionAtXp(m.playersById[m.localPlayerId].progression.totalXp,m.playersById[m.localPlayerId].d8),inventory:inv},zero=resolvePlayerStats({...p,inventory:{...inv,economy:{...e,slotLevels:{...e.slotLevels,[selected]:0}}}}),before=resolvePlayerStats(p),after=resolvePlayerStats({...p,inventory:{...inv,economy:{...e,slotLevels:{...e.slotLevels,[selected]:level+1}}}}),preview=el('div','','forge-preview');preview.append(el('h4',`Equipped item · ${d.name}`),el('small','Current attunement contribution → next level contribution'));for(const [k,name] of [['attack','Attack'],['defense','Defense'],['maxHp','Max HP'],['moveSpeed','Speed']]){const a=statDifference(before[k],zero[k]),b=statDifference(after[k],zero[k]);if(!a&&!b)continue;const row=el('p','',statDifference(b,a)?'stat-gain':'tt-muted');row.append(icon(k==='moveSpeed'?speedUrl:EQUIPMENT_STAT_ART[k]),el('span',name),el('strong',`+${statText(a,true)} → +${statText(b,true)}`));preview.append(row);}details.append(preview);}
   else details.append(el('p','Empty slot · bonuses apply when equipped.','tt-muted'));
   const b=el('button',`ATTUNE · ${level} → ${level+1}`,'forge-anvil-button');b.type='button';b.dataset.forgeAction='attune';b.disabled=!m.forgeAccess||m.persistence.phase!=='encounter'||!affordGold||!affordMaterials;b.onclick=()=>issue('forge.attune',{slot:selected,expectedLevel:level});details.append(b);
  }
  layout.append(list,details);root.append(layout);if(focus)root.querySelector(`[data-forge-action="${focus}"]`)?.focus({preventScroll:true});
 }
 return {render};
}
