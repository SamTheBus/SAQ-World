import {freezeWire} from '../contracts/wire.js';
export const SUBWEAPON_TYPES=Object.freeze(['shield','dagger','tome']);
// Neutral stage-one factory profiles: items.js:4684–4785. No rarity roll.
export const SUBWEAPONS=freezeWire(Object.fromEntries([
 ['shield','Vanguard Provision','Block attacks and build Guard Pressure.'],
 ['dagger','Shadow Blade Provision','Shadow Dash, parry, offhand strikes and bleed.'],
 ['tome','Codex Apprentice Provision','Fire Tome: arcane bolts, Infernal Fireball and Arcane Barrier.'],
].map(([type,provision,description])=>[type,{definitionId:`starter-${type}`,name:{shield:'Vanguard Shield',dagger:'Flurry Dagger',tome:'Fire Tome'}[type],slot:'subweapon',subType:type,subArchetype:{shield:'vanguard',dagger:'flurry',tome:'fire'}[type],spellType:type==='tome'?'fire':null,provision,description,attributes:{str:type==='shield'?2:0,dex:type==='dagger'?2:0,int:type==='tome'?2:0},bonuses:{attack:type==='shield'?0:1,maxHp:0,defense:type==='shield'?2:0},weaponVisual:null}])));
