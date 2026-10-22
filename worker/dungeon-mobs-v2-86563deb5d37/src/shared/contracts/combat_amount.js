import {closedRecord,freezeWire,requireContract} from './wire.js';
import {integerWire,integerBigInt,validateInteger,INTEGER_MAX_DIGITS,numericExtension} from './integer_domain.js';
import {boundedCombatInteger} from './combat_integer.js';
// Formula-local exact rational. Published D8 numeric combat uses integer-domain wire.
// Legacy rational saves are validated only on the explicit migration path.
// No Number conversion participates in authoritative arithmetic or comparison.
const DIGITS=INTEGER_MAX_DIGITS*2+32;
const gcd=(a,b)=>{while(b){const r=a%b;a=b;b=r;}return a;};
export function combatAmount(n,d=1n){n=BigInt(n);d=BigInt(d);requireContract(n>=0n&&d>0n,'Invalid combat fraction');const g=gcd(n,d);n/=g;d/=g;if(String(n).length>DIGITS||String(d).length>DIGITS)numericExtension('formula work');return Object.freeze(Object.assign(Object.create(null),{n:String(n),d:String(d)}));}
export function validateCombatAmount(a){closedRecord(a,['n','d']);requireContract(typeof a.n==='string'&&typeof a.d==='string'&&a.n.length<=DIGITS&&a.d.length<=DIGITS&&/^(0|[1-9][0-9]*)$/.test(a.n)&&/^[1-9][0-9]*$/.test(a.d),'Invalid formula fraction');const n=BigInt(a.n),d=BigInt(a.d);requireContract(gcd(n,d)===1n,'Noncanonical formula fraction');return a;}
export function asCombatAmount(a){if(typeof a==='string'||a?.chunks)return combatAmount(integerBigInt(a));if(typeof a==='number'){requireContract(Number.isSafeInteger(a),'Combat amount number must be integer');return combatAmount(a);}if(a?.n!==undefined)return validateCombatAmount(a);return combatAmount(boundedCombatInteger(a));}
export const compareCombat=(a,b)=>{a=asCombatAmount(a);b=asCombatAmount(b);const x=BigInt(a.n)*BigInt(b.d),y=BigInt(b.n)*BigInt(a.d);return x<y?-1:x>y?1:0;};
export const addCombat=(a,b)=>{a=asCombatAmount(a);b=asCombatAmount(b);return combatAmount(BigInt(a.n)*BigInt(b.d)+BigInt(b.n)*BigInt(a.d),BigInt(a.d)*BigInt(b.d));};
export const subtractCombat=(a,b)=>{a=asCombatAmount(a);b=asCombatAmount(b);const n=BigInt(a.n)*BigInt(b.d)-BigInt(b.n)*BigInt(a.d);requireContract(n>=0n,'Negative combat subtraction');return combatAmount(n,BigInt(a.d)*BigInt(b.d));};
export const multiplyCombat=(a,n,d=1)=>{a=asCombatAmount(a);return combatAmount(BigInt(a.n)*BigInt(n),BigInt(a.d)*BigInt(d));};
export const minCombat=(a,b)=>compareCombat(a,b)<=0?asCombatAmount(a):asCombatAmount(b);
export const maxCombat=(a,b)=>compareCombat(a,b)>=0?asCombatAmount(a):asCombatAmount(b);
export function roundCombat(a,mode='round'){requireContract(['round','floor','ceil'].includes(mode),'Unknown rounding endpoint');a=asCombatAmount(a);const n=BigInt(a.n),d=BigInt(a.d);return combatAmount(mode==='ceil'?(n+d-1n)/d:mode==='floor'?n/d:(n*2n+d)/(2n*d));}
// Presentation only: never use this approximation to save, compare, or resolve HP.
export function presentCombat(a){const q=asCombatAmount(a),n=q.n,d=q.d;return Number(n.slice(0,15))/Number(d.slice(0,15))*10**((n.length-Math.min(15,n.length))-(d.length-Math.min(15,d.length)));}
export const combatInteger=(a,mode='round')=>integerWire(roundCombat(a,mode).n);
export const outgoingCombat=a=>combatInteger(compareCombat(a,0)>0?maxCombat(1,roundCombat(a)):a);
export function resolveCombatDamage(hp,requested){validateInteger(hp);validateInteger(requested);hp=asCombatAmount(hp);requested=asCombatAmount(requested);const damage=minCombat(hp,requested),resultingHp=subtractCombat(hp,damage);return {damage:combatInteger(damage),resultingHp:combatInteger(resultingHp),targetAlive:compareCombat(resultingHp,0)>0};}
