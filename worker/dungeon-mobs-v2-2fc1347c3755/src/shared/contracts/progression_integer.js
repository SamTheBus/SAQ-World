import {integerBigInt,integerWire,numericExtension} from './integer_domain.js';
import {requireContract as check} from './wire.js';
// Small Number wire values preserve historical DTO ergonomics; large quantities
// use the existing exact integer codec. Neither branch admits unsafe Numbers.
export function progressionBigInt(value){if(typeof value==='bigint'){integerWire(value);return value;}if(typeof value==='number'){check(Number.isSafeInteger(value)&&value>=0,'Invalid progression integer');return BigInt(value);}return integerBigInt(value);}
export function progressionWire(value){const n=typeof value==='bigint'?value:progressionBigInt(value);check(n>=0n,'Negative progression integer');return n<=BigInt(Number.MAX_SAFE_INTEGER)?Number(n):integerWire(n);}
export function positiveProgression(value){check(progressionBigInt(value)>=1n,'Progression level must be positive');return value;}
export function progressionCompare(a,b){a=progressionBigInt(a);b=progressionBigInt(b);return a<b?-1:a>b?1:0;}
export function boundedProgressionNumber(value,max=Number.MAX_SAFE_INTEGER){const n=progressionBigInt(value);if(n>BigInt(max))numericExtension('bounded progression consumer');return Number(n);}
