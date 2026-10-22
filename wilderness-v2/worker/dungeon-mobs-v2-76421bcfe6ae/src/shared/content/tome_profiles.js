import {combatAmount as Q} from '../contracts/combat_amount.js';
import {requireContract,safeInteger} from '../contracts/wire.js';
export const BASE_TOME_ELEMENTS=Object.freeze(['fire','lightning','frost']);
// Future participant eligibility is captured at award, not an equip restriction.
export function selectBaseTomeElement(power,random,eligibility='base-single-d7-v1'){requireContract(eligibility==='base-single-d7-v1','Unsupported Tome eligibility');return power<13?'fire':BASE_TOME_ELEMENTS[Math.floor(random()*3)];}
export function tomeProfile(element='fire',stars=0){safeInteger(stars,0,5);requireContract(TOME_ELEMENTS.includes(element),'Unsupported Tome');if(!BASE_TOME_ELEMENTS.includes(element))return {chance:Q(Math.min(50,33+2*stars),100),power:Q((150+18*stars)*(element==='tri'?8:9),1000),barrier:Q(1,4)};return element==='fire'?{chance:Q(50+3*stars,150),power:Q(18+2*stars,10),barrier:Q(1,5)}:element==='lightning'?{chance:Q(38+3*stars,100),power:Q(120+15*stars,100),barrier:Q(15,100)}:{chance:Q(300+25*stars,1000),power:Q(145+15*stars,100),barrier:Q(3,10)};}

export const TOME_ELEMENTS=Object.freeze([...BASE_TOME_ELEMENTS,'dual_fire_lightning','dual_fire_frost','dual_lightning_frost','tri']);
export function tomeElements(identity){requireContract(TOME_ELEMENTS.includes(identity),'Invalid Tome identity');return identity==='tri'?[...BASE_TOME_ELEMENTS]:identity.startsWith('dual_')?identity.slice(5).split('_'):[identity];}
export function selectD8TomeElement(power,stars,random,witness){if(power<13)return 'fire';const single=()=>BASE_TOME_ELEMENTS[Math.floor(random()*3)],duals=['dual_fire_lightning','dual_fire_frost','dual_lightning_frost'];if(stars<2)return single();const roll=random();if(stars<4)return roll<.3&&witness.dualEligible?duals[Math.floor(random()*3)]:single();if(roll<.2)return witness.triEligible?'tri':single();if(roll<.6)return witness.dualEligible?duals[Math.floor(random()*3)]:single();return single();}
