import {progressionBigInt as big,progressionWire as wire} from '../contracts/progression_integer.js';
import {requireContract} from '../contracts/wire.js';
import {combatAmount,asCombatAmount,addCombat} from '../contracts/combat_amount.js';
export function exactDecimal(v){if(v?.n!==undefined)return asCombatAmount(v);if(v?.chunks)return asCombatAmount(v);if(typeof v==='number')requireContract(Number.isFinite(v)&&Math.abs(v)<=Number.MAX_SAFE_INTEGER,'Unsafe numeric coefficient');
 let s=String(v);if(s.startsWith('.'))s='0'+s;if(/[eE]/.test(s)){requireContract(typeof v==='number','Noncanonical decimal');s=v.toFixed(12);}requireContract(/^(0|[1-9][0-9]*)(\.[0-9]+)?$/.test(s),'Invalid decimal coefficient');const [a,b='']=s.split('.');return combatAmount(BigInt(a+b),10n**BigInt(b.length));
}
export function decimalWire(n,places=0){n=BigInt(n);if(!places)return wire(n);let s=n.toString().padStart(places+1,'0');return (s.slice(0,-places)+'.'+s.slice(-places)).replace(/0+$/,'').replace(/\.$/,'');}
export function sumGear(a,b){const v=addCombat(exactDecimal(a),exactDecimal(b));if(v.d==='1')return wire(BigInt(v.n));let d=BigInt(v.d),places=0;while(d>1n&&d%2n===0n){d/=2n;places++;}let fives=0;while(d>1n&&d%5n===0n){d/=5n;fives++;}requireContract(d===1n,'Nondecimal item contribution');places=Math.max(places,fives);return decimalWire(BigInt(v.n)*10n**BigInt(places)/BigInt(v.d),places);}
export function rollRarityD9(depth,quality,random){
 const d=big(depth),max=(a,b)=>a>b?a:b,min=(a,b)=>a<b?a:b;
 const weights=[max(50n,1000n-3n*d),max(100n,300n+4n*min(d,100n)-max(0n,d-100n)),d>=26n?6n*(d-25n):0n,d>=101n?5n*(d-100n):0n,d>=251n?4n*(d-250n):0n,d>=501n?3n*(d-500n):0n];
 const bonus=BigInt(Math.round((quality-1)*100)),slopes=[0n,10n,20n,30n,45n,60n],adjusted=weights.map((w,i)=>w*(10000n+bonus*slopes[i])),total=adjusted.reduce((a,b)=>a+b,0n),roll=BigInt(Math.floor(random()*4294967296))*total;let cumulative=0n;
 for(let i=5;i>=0;i--){cumulative+=adjusted[i];if(roll<cumulative*4294967296n)return i;}return 0;
}
