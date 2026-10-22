import {formatLarge} from './large_number.js';
import {requireContract, safeInteger} from './wire.js';
// Exact finite decimals. Wire strings are canonical; BigInt is private arithmetic only.
// 512 digits covers every authored 0–100 Forge cost without a currency balance cap.
export function amount(value){requireContract(typeof value==='string'&&value.length<=512&&/^(0|[1-9][0-9]*)(\.[0-9]*[1-9])?$/.test(value),'Invalid economy amount');return value;}
const parts=value=>{const [whole,fraction='']=amount(value).split('.');return [BigInt(whole+fraction),fraction.length];};
function wire(n,scale){requireContract(n>=0n,'Insufficient economy amount');let digits=n.toString().padStart(scale+1,'0');if(scale)digits=digits.slice(0,-scale)+'.'+digits.slice(-scale);if(digits.includes('.'))digits=digits.replace(/0+$/,'').replace(/\.$/,'');return amount(digits);}
function aligned(a,b){const [x,s]=parts(a),[y,t]=parts(b),scale=Math.max(s,t);return [x*10n**BigInt(scale-s),y*10n**BigInt(scale-t),scale];}
export function addAmount(a,b){const [x,y,s]=aligned(a,b);return wire(x+y,s);}
export function subtractAmount(a,b){const [x,y,s]=aligned(a,b);return wire(x-y,s);}
export function compareAmount(a,b){const [x,y]=aligned(a,b);return x<y?-1:x>y?1:0;}
export function multiplyAmount(a,b){const [x,s]=parts(a),[y,t]=parts(b);return wire(x*y,s+t);}
export function powerAmount(a,n){safeInteger(n,0,100);const [x,s]=parts(a);return wire(x**BigInt(n),s*n);}
export function floorAmount(a){const [x,s]=parts(a);return (x/10n**BigInt(s)).toString();}
export function wholeAmount(n){safeInteger(n);return amount(String(n));}
export function formatAmount(a){return formatLarge(amount(typeof a==='number'?wholeAmount(a):a));}

export const rewardAmount=value=>typeof value==='number'?wholeAmount(value):amount(value);
