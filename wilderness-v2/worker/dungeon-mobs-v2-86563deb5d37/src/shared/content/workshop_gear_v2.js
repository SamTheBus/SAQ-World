import {generateGear,AFFIX_POOLS,affixRollRange,gearHash} from './generated_gear.js';
import {copyWire,freezeWire,canonicalStringify,requireContract as check} from '../contracts/wire.js';
import {exactDecimal,decimalWire} from './gear_numbers_d9.js';
import {addCombat,subtractCombat,multiplyCombat,roundCombat} from '../contracts/combat_amount.js';
import {progressionBigInt,progressionWire} from '../contracts/progression_integer.js';
// The source gear never changes. This bounded, deterministic overlay is shared
// by combat, tooltips, ownership pages and service previews.
export const WORKSHOP_VERSION='settlement-workshop-v2';
export const MAX_WORKSHOP_ITEMS=64,MAX_WORKSHOP_STEPS=32;
// Dungeon constants.js SET_DEFINITIONS: threshold bonuses are cumulative.
// Idle-expedition lines remain inactive, as they are in Dungeon's active play.
export const RESONANCE_SETS=freezeWire({Vanguard:{two:{atkPct:.05},three:{atkPct:.15}},Colossus:{two:{maxHpPct:.08},three:{maxHpPct:.22}},Bastion:{two:{defPct:.05},three:{defPct:.18}},Windrunner:{two:{moveSpeedPct:.05},three:{moveSpeedPct:.15}},Wraith:{two:{critChance:.03},three:{critChance:.08,critDamage:.15}},Reaver:{two:{critDamage:.15},three:{critDamage:.35,critChance:.02}},Dreadnought:{two:{block:.03},three:{block:.08,defPct:.06}},Duellist:{two:{parry:.02},three:{parry:.06,activeSpeed:.1}},Scholar:{two:{intPct:.05},three:{intPct:.15,activeSpeed:.1}},Berserker:{two:{strPct:.05},three:{strPct:.15}},Scout:{two:{dexPct:.05},three:{dexPct:.15,moveSpeedPct:.08}}});
const paths={atk:['bonuses','attack'],def:['bonuses','defense'],maxHp:['bonuses','maxHp'],str:['attributes','str'],dex:['attributes','dex'],int:['attributes','int'],activeSpd:['effects','activeSpeed'],moveSpeed:['effects','moveSpeed'],critChance:['effects','critChance'],critDamage:['effects','critDamage'],block:['effects','block'],parry:['effects','parry'],bonusAreaRadius:['effects','bonusAreaRadius']};
const integer=new Set(['atk','def','maxHp','str','dex','int','moveSpeed']);
const decimalResult=(q,numeric=false)=>{if(q.d==='1')return progressionWire(BigInt(q.n));const units=BigInt(roundCombat(multiplyCombat(q,10000)).n),value=decimalWire(units,4);return numeric?Number(value):value;};
const sum=(a,b,sign=1)=>decimalResult(sign===1?addCombat(exactDecimal(a),exactDecimal(b)):subtractCombat(exactDecimal(a),exactDecimal(b)),typeof a==='number'&&typeof b==='number');
const scale=(a,n,d,ceil=false)=>{const q=multiplyCombat(exactDecimal(a),n,d);return decimalResult(ceil?roundCombat(q,'ceil'):q,typeof a==='number');};
function adjust(def,key,old,value){const [group,field]=paths[key];def[group][field]=sum(sum(def[group][field]??0,old,-1),value);}
const cache=new Map();
export function workshopResult(item){
 const g=item.generated,steps=item.workshop?.steps??[];if(!steps.length)return {definition:g?.definition,tier:g?.rarityTier??0,affixes:g?.affixes??[],enchants:0,lockedLine:null,set:null};
 check(g&&item.workshop.version===WORKSHOP_VERSION&&steps.length<=MAX_WORKSHOP_STEPS,'Invalid workshop overlay');
 const key=canonicalStringify([g,steps]);if(cache.has(key))return cache.get(key);
 let definition=copyWire(g.definition),tier=g.rarityTier,affixes=copyWire(g.affixes),enchants=0,lockedLine=null,set=null,unenchanted=null;
 for(let ordinal=0;ordinal<steps.length;ordinal++){
  const step=steps[ordinal],random=label=>gearHash(WORKSHOP_VERSION+'/'+g.seed+'/'+ordinal+'/'+step.kind+'/'+label)/4294967296;
  if(step.kind==='awaken'){
   check(tier<5&&!enchants,'Purge before awakening; maximum five stars');const next=generateGear(g.seed,g.progression??g.contentDepth,{tier:tier+1,family:g.definition.slot,subType:g.definition.subType??null,noun:g.definition.noun});
   definition=copyWire(next.definition);for(const a of next.affixes)adjust(definition,a.key,a.value,0);
   affixes=affixes.map(a=>({key:a.key,value:scale(a.value,100+15*(tier+1),100+15*tier,integer.has(a.key))}));
   for(const a of affixes)adjust(definition,a.key,0,a.value);
   const additions=next.affixes.filter(a=>!affixes.some(old=>old.key===a.key));
   if(additions.length){const a=copyWire(additions[Math.floor(random('new-affix')*additions.length)]);affixes.push(a);adjust(definition,a.key,0,a.value);}tier++;
  }else if(step.kind==='reforge'){
   check(!enchants&&Number.isInteger(step.line)&&step.line>=0&&step.line<affixes.length&&(lockedLine===null||lockedLine===step.line),'Invalid locked reforge line');lockedLine=step.line;
   const old=affixes[step.line],pool=AFFIX_POOLS[g.definition.subType??g.definition.slot].filter(k=>!affixes.some((a,i)=>i!==step.line&&a.key===k)),name=pool[Math.floor(random('key')*pool.length)],range=affixRollRange({...g,rarityTier:tier,definition},name);
   let value;if(integer.has(name)&&(typeof range.minimum==='string'||typeof range.maximum==='string'||range.minimum?.chunks)){const lo=progressionBigInt(range.minimum),hi=progressionBigInt(range.maximum);value=progressionWire(lo+(hi-lo)*BigInt(Math.floor(random('value')*1000000))/1000000n);}else value=integer.has(name)?Math.floor(range.minimum+random('value')*(range.maximum-range.minimum+1)):Number((Number(range.minimum)+random('value')*(Number(range.maximum)-Number(range.minimum))).toFixed(4));
   adjust(definition,old.key,old.value,0);adjust(definition,name,0,value);affixes[step.line]={key:name,value};
  }else if(step.kind==='enchant'){
   check(tier>=2&&enchants<tier-1,'Enchant capacity exceeded');unenchanted??=copyWire(definition);
   const available=Object.keys(paths).filter(k=>k!=='bonusAreaRadius'&&Number(definition[paths[k][0]][paths[k][1]])>0),name=available[Math.floor(random('stat')*available.length)],[group,field]=paths[name];definition[group][field]=scale(definition[group][field],125,100,integer.has(name));enchants++;
  }else if(step.kind==='purge'){check(enchants>0&&unenchanted,'Nothing to purge');definition=unenchanted;unenchanted=null;enchants=0;
  }else if(step.kind==='resonance'){const sets=Object.keys(RESONANCE_SETS).filter(k=>k!==set);set=sets[Math.floor(random('set')*sets.length)];
  }else check(false,'Unknown gear modification');
 }
 definition.name=(set?set+' ':'')+definition.name;definition.rarityTier=tier;
 const result=freezeWire({definition,tier,affixes,enchants,lockedLine,set});if(cache.size>=256)cache.delete(cache.keys().next().value);cache.set(key,result);return result;
}
export const unmodifiedItem=item=>{const value={...item};delete value.workshop;return value;};
export function workshopExtension(a,b){return canonicalStringify(unmodifiedItem(a))===canonicalStringify(unmodifiedItem(b))&&canonicalStringify((b.workshop?.steps??[]).slice(0,a.workshop?.steps.length??0))===canonicalStringify(a.workshop?.steps??[]);}
export function resonanceEffects(inv){const counts={};for(const id of Object.values(inv.equipped)){const i=inv.itemsById[id],set=i?.workshop&&workshopResult(i).set;if(set)counts[set]=(counts[set]??0)+1;}const effects={};for(const [set,n] of Object.entries(counts))if(n>=2)for(const values of [RESONANCE_SETS[set].two,...(n>=3?[RESONANCE_SETS[set].three]:[])])for(const [k,v] of Object.entries(values))effects[k]=Number(((effects[k]??0)+v).toFixed(4));return effects;}
