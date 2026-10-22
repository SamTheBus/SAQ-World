import {integerDigits} from './integer_domain.js';
// Decimal adapter is presentation only; economy authority retains its own codec.
export function magnitudeSuffix(bucket){if(bucket<5)return ['', 'K','M','B','T'][bucket];let n=bucket+22,s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}return s;}
export function formatLarge(value,{significant=4}={}){
 if(significant!==4&&significant!==6)throw new RangeError('Display precision');
 const raw=typeof value==='string'?value:integerDigits(value);if(!/^(0|[1-9][0-9]*)(\.[0-9]+)?$/.test(raw))throw new TypeError('Invalid exact display amount');
 const [whole,fraction='']=raw.split('.');let all=(whole+fraction).replace(/^0+/,'');if(!all)return '0';
 let exponent=whole==='0'?-(fraction.search(/[1-9]/)+1):whole.length-1,bucket=Math.max(0,Math.floor(exponent/3));
 let lead=all.slice(0,significant).padEnd(significant,'0');if((all[significant]??'0')>='5')lead=String(BigInt(lead)+1n);
 if(lead.length>significant){exponent++;lead=lead.slice(0,significant);bucket=Math.max(0,Math.floor(exponent/3));}
 const point=exponent-bucket*3+1;let coefficient=point<=0?'0.'+'0'.repeat(-point)+lead:point>=lead.length?lead+'0'.repeat(point-lead.length):lead.slice(0,point)+'.'+lead.slice(point);
 if(coefficient.includes('.'))coefficient=coefficient.replace(/0+$/,'').replace(/\.$/,'');return coefficient+magnitudeSuffix(bucket);
}
// Bounded ratio for bars; no Number(huge)/Number(huge).
export function integerRatio(a,b){a=BigInt(integerDigits(a));b=BigInt(integerDigits(b));return b===0n?0:Number((a>b?b:a)*1000000n/b)/1000000;}
