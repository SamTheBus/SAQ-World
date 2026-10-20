import {dungeonItemBasesD9} from './dungeon_item_bases_d9.js';
import {worldGearRarity} from './world_combat_v1.js';
import {rewardProgressionD9,validateRewardProgressionD9} from './reward_progression_d9.js';
import {selectBaseTomeElement,selectD8TomeElement,tomeProfile} from './tome_profiles.js';
import {createRngState,nextUint32} from '../contracts/rng.js';
import {copyWire,freezeWire,requireContract,safeInteger} from '../contracts/wire.js';
import {compareCombat} from '../contracts/combat_amount.js';
import {progressionBigInt as big,progressionWire as wire,positiveProgression} from '../contracts/progression_integer.js';
import {certifyNumeric} from '../contracts/d9_numeric_expression.js';
import {exactDecimal,decimalWire,sumGear,rollRarityD9} from './gear_numbers_d9.js';
export const GEAR_VERSION='dungeon-gear-d9-v1';
export const RARITY_NAMES=Object.freeze(['Common','Rare','Magic','Epic','Legendary','Mythic']);
export const RARITY_COLORS=Object.freeze(['#ffffff','#3498db','#9b59b6','#e67e22','#f1c40f','#e74c3c']);
export const SALVAGE_MATERIALS=Object.freeze(['Monster Soul','Rare Scrap','Magic Scrap','Epic Scrap','Legendary Scrap','Mythic Scrap']);
export const GEAR_FAMILIES=Object.freeze(['weapon','subweapon','helmet','chest','leggings','overall','boots','ring']);
export const GEAR_NOUNS=Object.freeze({weapon:['Greatsword','Longsword','Halberd','Warhammer','Battleaxe','Broadsword','Flanged Mace','Claymore'],shield:['Kite Shield','Tower Shield','Buckler','Aegis','Heater Shield'],dagger:['Kris','Stiletto','Baselard','Dirk','Main-Gauche'],tome:['Grimoire','Spellbook','Codex','Lexicon','Chronicle'],helmet:['Greathelm','Armet','Visor'],chest:['Hauberk','Cuirass','Brigandine','Plate Mail','Chain Mail','Doublet'],leggings:['Greaves','Legplates','Chausses','Cuisses'],boots:['Sabatons','Sollerets','Steel Boots','Treads'],overall:['Exosuit','Inquisitor Robes','Full Plate Armor','Trenchcoat'],ring:['Signet Ring','Loop Ring','Band Ring','Seal Ring']});
export const AFFIX_POOLS=Object.freeze({weapon:['critChance','critDamage','activeSpd'],chest:['maxHp','def','str','dex','int'],overall:['maxHp','def','str','dex','int'],helmet:['critChance','activeSpd','bonusAreaRadius'],leggings:['maxHp','def','str','dex','int'],boots:['moveSpeed','activeSpd'],ring:['atk','maxHp','def','str','dex','int','critChance','moveSpeed','bonusAreaRadius'],shield:['block','moveSpeed','bonusAreaRadius'],dagger:['parry','critChance','moveSpeed','bonusAreaRadius'],tome:['critDamage','activeSpd','critChance','bonusAreaRadius']});
export function gearHash(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h;}
export function rewardStream(key){let state=copyWire(createRngState(Array.from({length:4},(_,i)=>gearHash(`${key}/${i}`))));return {random(){const r=nextUint32(state);state=copyWire(r.state);return r.value/4294967296;},state:()=>copyWire(state)};}
export const gearSeed=(state,p,source)=>`dungeon-gear-d7-v1/${state.campaign.seed.seedHex}/${p.playerId}/${source}`;
const round4=n=>Number(n.toFixed(4));
export function salvagePayload(seed,tier){safeInteger(tier,0,5);const r=rewardStream(`salvage-v1/${seed}`),out={[SALVAGE_MATERIALS[tier]]:1+Math.floor(r.random()*3)};for(let t=tier-1;t>=0;t--)if(r.random()<.6)out[SALVAGE_MATERIALS[t]]=1+Math.floor(r.random()*2);return freezeWire(out);}
export function generateGearD9(seed,input,options={}){return certifyNumeric(c=>generateAtPrecision(c,seed,input,options));}
function generateAtPrecision(c,seed,input,{tier=null,family=null,subType=null,noun=null}={}){
 const progression=typeof input==='number'||typeof input==='string'?rewardProgressionD9(input,seed):validateRewardProgressionD9(input),depth=progression.sourceDepth; positiveProgression(depth);const rng=rewardStream(seed),random=()=>rng.random(),pick=a=>a[Math.floor(random()*a.length)],power=progression.combatHash?depth:wire(big(depth)/4n+1n);
 const rarityRandom=progression.combatHash?random():null,rarityTier=tier??(progression.combatHash?worldGearRarity(depth,progression.combatQuality,rarityRandom,progression.modifiers?.qualityHundredths??0):rollRarityD9(depth,progression.quality,random));safeInteger(rarityTier,0,5);
 const type=family??pick(GEAR_FAMILIES),sub=type==='subweapon'?(subType??pick(['shield','dagger','tome'])):null,n=noun??pick(GEAR_NOUNS[sub??type]);requireContract(GEAR_FAMILIES.includes(type)&&GEAR_NOUNS[sub??type]?.includes(n),'Unknown generated family/noun');
 const E=c.dungeonScale(power).E,R=c.q(100+7*rarityTier,100),P=c.q((100+15*rarityTier)*(type==='overall'?18:10),1000),flatR=c.mul(R,c.q(type==='overall'?18:10,10));
 const I=v=>{if(v&&typeof v==='object'&&'lo' in v)return v;const q=exactDecimal(v);return c.q(q.n,q.d);},times=(...v)=>v.reduce((a,b)=>c.mul(a,I(b)),c.q(1)),f=(a,b)=>{const roll=BigInt(Math.floor(random()*4294967296));return c.add(I(a),c.mul(c.sub(I(b),I(a)),c.q(roll,4294967296)));},ceil=v=>wire(c.endpoint(v,'ceil')),round4=v=>decimalWire(c.endpoint(v,'round',4),4);

 const capped=(a,b)=>({lo:a.lo<b.lo?a.lo:b.lo,hi:a.hi<b.hi?a.hi:b.hi});
 const raw={type,subType:sub,statsRolled:rarityTier,noun:n,baseAtk:0,baseDef:0,baseMaxHp:0,baseStr:0,baseDex:0,baseInt:0,baseMoveSpeed:0,baseCritChance:0,baseCritDamage:0,baseBlock:0,baseParry:0};
 if(type==='ring'){const roll=random();raw.implicitType=roll<.33?'atk':roll<.66?'maxHp':'def';raw.implicitPctType=pick(['atkPct','maxHpPct','defPct','strPct','dexPct','intPct']);}
 // Resolve allowed identity before any numeric contribution; no late cosmetic hook.
 if(sub==='tome')raw.spellType=progression.modifiers?selectD8TomeElement(big(power)>=13n?13:1,rarityTier,random,progression.modifiers):selectBaseTomeElement(big(power)>=13n?13:1,random,progression.tomeEligibility);dungeonItemBasesD9(raw,power,c);if(progression.combatHash){const l=big(power),rar=BigInt(100+15*rarityTier),v=n=>wire((n*rar+99n)/100n);if(type==='weapon')raw.baseAtk=v(6n+2n*l);if(['chest','overall','helmet','leggings','boots'].includes(type)){const factor=type==='overall'?2n:1n;raw.baseDef=v((2n+l)*factor);raw.baseMaxHp=v((10n+4n*l)*factor);}if(type==='ring'){raw.baseAtk=v(1n+l/3n);raw.baseDef=v(1n+l/4n);raw.baseMaxHp=v(5n+l);}}
 const affixes=[],pool=[...AFFIX_POOLS[sub??type]],bonus={};
 for(let i=0;i<rarityTier&&pool.length;i++){const key=pool.splice(Math.floor(random()*pool.length),1)[0];let value;
 if(key==='atk'||key==='def')value=ceil(times(f('.04','.08'),E,flatR));
 else if(key==='maxHp')value=ceil(times(f('.12','.24'),E,flatR));
 else if(key==='moveSpeed')value=ceil(times(1+Math.floor(random()*2),power,P));
 else if(key==='critChance')value=round4(capped(times(f('.015','.04'),c.root(I(power),2),P),I('.2')));
 else if(key==='critDamage')value=round4(times(f('.03','.06'),c.root(I(power),2),P));
 else if(key==='block'||key==='parry')value=round4(capped(times(f('.005','.015'),c.root(I(power),2),P),I('.15')));
 else if(key==='bonusAreaRadius')value=round4(times(f('.04','.10'),P));
 else if(key==='activeSpd')value=round4(times(f('.01','.03'),c.frac(I(power),3,10),I((100+8*rarityTier)/100)));
 else {value=ceil(times(f('.4','.8'),c.add(I(3),c.frac(I(power),3,4)),c.q(100+25*rarityTier,100)));const limit=big(c.endpoint(c.add(I(2),times(power,'.75')))),fallback=big(c.endpoint(times(power,'.45')));if(big(value)>limit)value=wire(fallback<1n?1n:fallback);}

 bonus[key]=value;affixes.push({key,value});}
 const adj={atk:'Fierce',maxHp:'Grizzled',def:'Hardened',moveSpeed:'Fleet',critChance:'Precise',critDamage:'Savage',block:'Stalwart',parry:'Nimble',str:'Heavy',dex:'Swift',int:'Erudite',activeSpd:'Hasty'};
 const dominant=Object.keys(adj).reduce((a,k)=>compareCombat(exactDecimal(bonus[k]??0),exactDecimal(bonus[a]??0))>0?k:a,'');
 const definition={numericVersion:'generated-numeric-d9-v1',definitionId:`d7-${type}-${sub??'ordinary'}`,name:`${dominant?adj[dominant]:'Standard'} ${n} (Lv. ${power})`,slot:type,subType:sub,spellType:raw.spellType??null,noun:n,rarityTier,itemPower:power,bonuses:{attack:sumGear(raw.baseAtk,bonus.atk??0),maxHp:sumGear(raw.baseMaxHp,bonus.maxHp??0),defense:sumGear(raw.baseDef,bonus.def??0)},attributes:{str:sumGear(raw.baseStr,bonus.str??0),dex:sumGear(raw.baseDex,bonus.dex??0),int:sumGear(raw.baseInt,bonus.int??0)},effects:{moveSpeed:sumGear(raw.baseMoveSpeed,bonus.moveSpeed??0),critChance:sumGear(raw.baseCritChance,bonus.critChance??0),critDamage:sumGear(raw.baseCritDamage,bonus.critDamage??0),block:sumGear(raw.baseBlock,bonus.block??0),parry:sumGear(raw.baseParry,bonus.parry??0),activeSpeed:bonus.activeSpd??0,bonusAreaRadius:bonus.bonusAreaRadius??0,...Object.fromEntries(['atkPct','maxHpPct','defPct','moveSpeedPct','strPct','dexPct','intPct'].map(k=>[k,raw[k]??0]))},family:{...Object.fromEntries(['subArchetype','blockCapBonus','reflectDamage','bashAtkBonus','parryCapBonus','parryMitigation','riposteDamage','bleedChance','offhandChance','offhandDmg'].map(k=>[k,raw[k]??null])),fireChanceNumerator:50+3*rarityTier,fireChanceDenominator:150,firePowerNumerator:18+2*rarityTier},weaponVisual:type==='weapon'?'iron':null};
 if(sub==='tome'&&raw.spellType!=='fire'){delete definition.family.fireChanceNumerator;delete definition.family.fireChanceDenominator;delete definition.family.firePowerNumerator;Object.assign(definition.family,{tomeProfile:tomeProfile(raw.spellType,rarityTier)});}
 return freezeWire({version:GEAR_VERSION,progression,seed,contentDepth:depth,itemPower:power,rarityTier,definition,affixes,rng:rng.state(),salvage:salvagePayload(seed,rarityTier)});
}
