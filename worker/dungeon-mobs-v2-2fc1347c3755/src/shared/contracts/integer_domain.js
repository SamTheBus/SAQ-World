import {closedRecord,requireContract,freezeWire,validateWire} from './wire.js';
export const INTEGER_DOMAIN='integer-domain-64k-v1';
export const COMBAT_INTEGER_VERSION='combat-integer-v2';
export const INTEGER_CHUNK_DIGITS=4096, INTEGER_MAX_DIGITS=65536;
export function numericExtension(message='integer domain'){const e=new RangeError('Numeric-domain extension required: '+message);e.code='NUMERIC_DOMAIN_EXTENSION_REQUIRED';throw e;}
export function integerDigits(value){
 if(typeof value==='string'){requireContract(value.length<=4096&&/^(0|[1-9][0-9]*)$/.test(value),'Noncanonical integer string');return value;}
 validateWire(value);closedRecord(value,['version','chunks']);requireContract(value.version===INTEGER_DOMAIN&&Array.isArray(value.chunks)&&value.chunks.length>=2&&value.chunks.length<=16,'Invalid integer chunks');
 const [first,...rest]=value.chunks;requireContract(typeof first==='string'&&first.length>=1&&first.length<=4096&&/^[1-9][0-9]*$/.test(first)&&rest.every(s=>typeof s==='string'&&s.length===4096&&/^[0-9]+$/.test(s)),'Noncanonical integer chunks');return value.chunks.join('');
}
export const validateInteger=value=>{integerDigits(value);return value;};
export const integerBigInt=value=>BigInt(integerDigits(value));
export function integerWire(value){
 let digits;if(typeof value==='bigint'){requireContract(value>=0n,'Negative integer');digits=String(value);}else if(typeof value==='string'){if(value.length>INTEGER_MAX_DIGITS)numericExtension();requireContract(/^(0|[1-9][0-9]*)$/.test(value),'Noncanonical integer');digits=value;}else if(typeof value==='number'){requireContract(Number.isSafeInteger(value)&&value>=0,'Unsafe integer input');digits=String(value);}else digits=integerDigits(value);
 if(digits.length>INTEGER_MAX_DIGITS)numericExtension();if(digits.length<=4096)return digits;
 const chunks=[],first=digits.length%4096||4096;chunks.push(digits.slice(0,first));for(let i=first;i<digits.length;i+=4096)chunks.push(digits.slice(i,i+4096));return freezeWire({version:INTEGER_DOMAIN,chunks});
}
export const compareInteger=(a,b)=>{a=integerDigits(a);b=integerDigits(b);return a.length!==b.length?(a.length<b.length?-1:1):a===b?0:a<b?-1:1;};
export const addInteger=(a,b)=>integerWire(integerBigInt(a)+integerBigInt(b));
export const subtractInteger=(a,b)=>integerWire(integerBigInt(a)-integerBigInt(b));
export const multiplyInteger=(a,b)=>{if(integerDigits(a).length+integerDigits(b).length-1>INTEGER_MAX_DIGITS)numericExtension();return integerWire(integerBigInt(a)*integerBigInt(b));};
