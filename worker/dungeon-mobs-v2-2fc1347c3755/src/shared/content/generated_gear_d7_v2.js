import {generateGear as legacyGenerateGear} from './generated_gear_v1.js';
import {rewardProgression,validateRewardProgression} from './reward_progression.js';
import {selectBaseTomeElement,tomeProfile} from './tome_profiles.js';
import {dungeonItemBases} from './dungeon_item_bases.js';
import {rollEquipmentRarity,EQUIPMENT_RARITY_SOURCES} from './dungeon_rarity.js';
import {createRngState,nextUint32} from '../contracts/rng.js';
import {canonicalStringify,copyWire,freezeWire,requireContract,safeInteger} from '../contracts/wire.js';
export const GEAR_VERSION='dungeon-gear-d7-v2';
export const RARITY_NAMES=Object.freeze(['Common','Rare','Magic','Epic','Legendary','Mythic']);
export const RARITY_COLORS=Object.freeze(['#ffffff','#3498db','#9b59b6','#e67e22','#f1c40f','#e74c3c']);
export const SALVAGE_MATERIALS=Object.freeze(['Monster Soul','Rare Scrap','Magic Scrap','Epic Scrap','Legendary Scrap','Mythic Scrap']);
export const GEAR_FAMILIES=Object.freeze(['weapon','subweapon','helmet','chest','leggings','overall','boots','ring']);
export const GEAR_NOUNS=Object.freeze({weapon:['Greatsword','Longsword','Halberd','Warhammer','Battleaxe','Broadsword','Flanged Mace','Claymore'],shield:['Kite Shield','Tower Shield','Buckler','Aegis','Heater Shield'],dagger:['Kris','Stiletto','Baselard','Dirk','Main-Gauche'],tome:['Grimoire','Spellbook','Codex','Lexicon','Chronicle'],helmet:['Greathelm','Armet','Visor'],chest:['Hauberk','Cuirass','Brigandine','Plate Mail','Chain Mail','Doublet'],leggings:['Greaves','Legplates','Chausses','Cuisses'],boots:['Sabatons','Sollerets','Steel Boots','Treads'],overall:['Exosuit','Inquisitor Robes','Full Plate Armor','Trenchcoat'],ring:['Signet Ring','Loop Ring','Band Ring','Seal Ring']});
export const AFFIX_POOLS=Object.freeze({weapon:['critChance','critDamage','activeSpd'],chest:['maxHp','def','str','dex','int'],overall:['maxHp','def','str','dex','int'],helmet:['critChance','activeSpd'],leggings:['maxHp','def','str','dex','int'],boots:['moveSpeed','activeSpd'],ring:['atk','maxHp','def','str','dex','int','critChance','moveSpeed'],shield:['block','moveSpeed'],dagger:['parry','critChance','moveSpeed'],tome:['critDamage','activeSpd','critChance']});
export function gearHash(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h;}
export function rewardStream(key){let state=copyWire(createRngState(Array.from({length:4},(_,i)=>gearHash(`${key}/${i}`))));return {random(){const r=nextUint32(state);state=copyWire(r.state);return r.value/4294967296;},state:()=>copyWire(state)};}
export const gearSeed=(state,p,source)=>`dungeon-gear-d7-v1/${state.campaign.seed.seedHex}/${p.playerId}/${source}`;
const round4=n=>Number(n.toFixed(4));
export function salvagePayload(seed,tier){safeInteger(tier,0,5);const r=rewardStream(`salvage-v1/${seed}`),out={[SALVAGE_MATERIALS[tier]]:1+Math.floor(r.random()*3)};for(let t=tier-1;t>=0;t--)if(r.random()<.6)out[SALVAGE_MATERIALS[t]]=1+Math.floor(r.random()*2);return freezeWire(out);}
export function generateGear(seed,input,{tier=null,family=null,subType=null,noun=null}={}){
 const progression=typeof input==='number'?rewardProgression(input,seed):validateRewardProgression(input),depth=progression.sourceDepth; safeInteger(depth,1,10000);const rng=rewardStream(seed),random=()=>rng.random(),pick=a=>a[Math.floor(random()*a.length)],power=Math.floor(depth/4)+1;
 const rarityTier=tier??rollEquipmentRarity({progressionStage:depth,resolvedQuality:progression.quality,source:EQUIPMENT_RARITY_SOURCES.ORDINARY_MONSTER,random});safeInteger(rarityTier,0,5);
 const type=family??pick(GEAR_FAMILIES),sub=type==='subweapon'?(subType??pick(['shield','dagger','tome'])):null,n=noun??pick(GEAR_NOUNS[sub??type]);requireContract(GEAR_FAMILIES.includes(type)&&GEAR_NOUNS[sub??type]?.includes(n),'Unknown generated family/noun');
 const band=Math.ceil(power/4)*4,effective=band<=100?band:100+Math.pow(band-100,.7)*1.5,E=Math.pow(1.012,effective)*(1+.015*effective),R=1+.07*rarityTier,P=(1+.15*rarityTier)*(type==='overall'?1.8:1),flatR=R*(type==='overall'?1.8:1),f=(a,b)=>a+(b-a)*random(),int=(a,b)=>a+Math.floor(random()*(b-a+1));
 const raw={type,subType:sub,statsRolled:rarityTier,noun:n,baseAtk:0,baseDef:0,baseMaxHp:0,baseStr:0,baseDex:0,baseInt:0,baseMoveSpeed:0,baseCritChance:0,baseCritDamage:0,baseBlock:0,baseParry:0};
 if(type==='ring'){const roll=random();raw.implicitType=roll<.33?'atk':roll<.66?'maxHp':'def';raw.implicitPctType=pick(['atkPct','maxHpPct','defPct','strPct','dexPct','intPct']);}
 // Resolve allowed identity before any numeric contribution; no late cosmetic hook.
 if(sub==='tome')raw.spellType=selectBaseTomeElement(power,random,progression.tomeEligibility);dungeonItemBases(raw,power);
 const affixes=[],pool=[...AFFIX_POOLS[sub??type]],bonus={};
 for(let i=0;i<rarityTier&&pool.length;i++){const key=pool.splice(Math.floor(random()*pool.length),1)[0];let value;
 if(key==='atk'||key==='def')value=Math.ceil(f(.04,.08)*E*flatR);
 else if(key==='maxHp')value=Math.ceil(f(.12,.24)*E*flatR);
 else if(key==='moveSpeed')value=Math.ceil(int(1,2)*power*P);
 else if(key==='critChance')value=round4(Math.min(.2,f(.015,.04)*Math.sqrt(power)*P));
 else if(key==='critDamage')value=round4(f(.03,.06)*Math.sqrt(power)*P);
 else if(key==='block'||key==='parry')value=round4(Math.min(.15,f(.005,.015)*Math.sqrt(power)*P));
 else if(key==='activeSpd')value=round4(f(.01,.03)*Math.pow(power,.3)*(1+.08*rarityTier));
 else {value=Math.ceil(f(.4,.8)*(3+Math.pow(power,.75))*(1+.25*rarityTier));if(value>Math.round(2+power*.75))value=Math.max(1,Math.round(power*.45));}
 bonus[key]=value;affixes.push({key,value});}
 const adj={atk:'Fierce',maxHp:'Grizzled',def:'Hardened',moveSpeed:'Fleet',critChance:'Precise',critDamage:'Savage',block:'Stalwart',parry:'Nimble',str:'Heavy',dex:'Swift',int:'Erudite',activeSpd:'Hasty'};
 const dominant=Object.keys(adj).reduce((a,k)=>(bonus[k]??0)>(bonus[a]??0)?k:a,'');
 const definition={definitionId:`d7-${type}-${sub??'ordinary'}`,name:`${dominant?adj[dominant]:'Standard'} ${n} (Lv. ${power})`,slot:type,subType:sub,spellType:raw.spellType??null,noun:n,rarityTier,itemPower:power,bonuses:{attack:raw.baseAtk+(bonus.atk??0),maxHp:raw.baseMaxHp+(bonus.maxHp??0),defense:raw.baseDef+(bonus.def??0)},attributes:{str:raw.baseStr+(bonus.str??0),dex:raw.baseDex+(bonus.dex??0),int:raw.baseInt+(bonus.int??0)},effects:{moveSpeed:raw.baseMoveSpeed+(bonus.moveSpeed??0),critChance:raw.baseCritChance+(bonus.critChance??0),critDamage:raw.baseCritDamage+(bonus.critDamage??0),block:raw.baseBlock+(bonus.block??0),parry:raw.baseParry+(bonus.parry??0),activeSpeed:bonus.activeSpd??0,...Object.fromEntries(['atkPct','maxHpPct','defPct','moveSpeedPct','strPct','dexPct','intPct'].map(k=>[k,raw[k]??0]))},family:{...Object.fromEntries(['subArchetype','blockCapBonus','reflectDamage','bashAtkBonus','parryCapBonus','parryMitigation','riposteDamage','bleedChance','offhandChance','offhandDmg'].map(k=>[k,raw[k]??null])),fireChanceNumerator:50+3*rarityTier,fireChanceDenominator:150,firePowerNumerator:18+2*rarityTier},weaponVisual:type==='weapon'?'iron':null};
 if(sub==='tome'&&raw.spellType!=='fire'){delete definition.family.fireChanceNumerator;delete definition.family.fireChanceDenominator;delete definition.family.firePowerNumerator;Object.assign(definition.family,{tomeProfile:tomeProfile(raw.spellType,rarityTier)});}
 return freezeWire({version:GEAR_VERSION,progression,seed,contentDepth:depth,itemPower:power,rarityTier,definition,affixes,rng:rng.state(),salvage:salvagePayload(seed,rarityTier)});
}
export function validateGeneratedGear(g,seed,input){const depth=typeof input==='number'?input:input.sourceDepth;const expected=g.version==='dungeon-gear-d7-v1'?legacyGenerateGear(seed,depth):generateGear(seed,typeof input==='number'?g.progression:input);requireContract(canonicalStringify(g)===canonicalStringify(expected),'Generated gear differs from reward provenance');return g;}
