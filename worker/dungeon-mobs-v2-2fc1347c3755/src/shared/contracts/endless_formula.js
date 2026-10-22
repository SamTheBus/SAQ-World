import {combatAmount} from './combat_amount.js';
import {integerWire,integerBigInt,numericExtension,INTEGER_MAX_DIGITS} from './integer_domain.js';
import {requireContract} from './wire.js';
// Cold formula jobs only. Each result is proven by exact integer arithmetic.
const WORK=2000000;
function pow(base,exponent,budget){let result=1n;while(exponent){if(--budget.left<0)numericExtension('formula work');if(exponent&1n)result*=base;exponent>>=1n;if(exponent)base*=base;if(result.toString().length>INTEGER_MAX_DIGITS*2+32||base.toString().length>INTEGER_MAX_DIGITS*2+32)numericExtension('formula intermediate');}return result;}
export function integerRoot(value,degree){requireContract(typeof value==='bigint'&&value>=0n&&Number.isSafeInteger(degree)&&degree>=1&&degree<=100,'Invalid root');if(value<2n||degree===1)return value;const budget={left:WORK};let lo=0n,hi=1n<<BigInt(Math.ceil(value.toString(2).length/degree));while(lo+1n<hi){const mid=(lo+hi)>>1n;if(pow(mid,BigInt(degree),budget)<=value)lo=mid;else hi=mid;}return pow(hi,BigInt(degree),budget)<=value?hi:lo;}
const halfUp=(n,d)=>(2n*n+d)/(2n*d);
// Rational integer powers: exact small jobs, outward fixed-point intervals for
// large exponents. An ambiguous endpoint is refined, never guessed.
export function roundedRationalPower(n,d,rank){n=BigInt(n);d=BigInt(d);const r=integerBigInt(rank);requireContract(n>=0n&&d>0n,'Invalid power');if(r===0n)return '1';if(n===d)return '1';if(n===0n)return '0';
 const budget={left:WORK};if(r<=10000n)return integerWire(halfUp(pow(n,r,budget),pow(d,r,budget)));
 if(r.toString(2).length>64)numericExtension('cold power work');
 for(let precision=32;precision<=INTEGER_MAX_DIGITS;precision*=2){const scale=10n**BigInt(precision);let low=scale,high=scale,bl=n*scale/d,bh=(n*scale+d-1n)/d,e=r;
  const bound=v=>{if(v.toString().length>INTEGER_MAX_DIGITS+precision+1)numericExtension('result magnitude');return v;};
  while(e){if(--budget.left<0)numericExtension('cold power work');if(e&1n){low=bound(low*bl/scale);high=bound((high*bh+scale-1n)/scale);}e>>=1n;if(e){bl=bound(bl*bl/scale);bh=bound((bh*bh+scale-1n)/scale);}}
  const a=halfUp(low,scale),b=halfUp(high,scale);if(a===b)return integerWire(a);
 }
 numericExtension('rounding proof precision');
}
// x^(p/q), approved non-rational modifier endpoint: exactly 12 decimal places.
// Compare the midpoint in the powered domain, avoiding libm and rounded roots.
export function fractionalModifier12(n,d,p,q){n=BigInt(n);d=BigInt(d);requireContract(n>=0n&&d>0n&&Number.isSafeInteger(p)&&p>=0&&p<=100&&Number.isSafeInteger(q)&&q>=1&&q<=100,'Invalid fractional power');const budget={left:WORK},scale=10n**12n,A=pow(n,BigInt(p),budget)*pow(scale,BigInt(q),budget),B=pow(d,BigInt(p),budget);let root=integerRoot(A/B,q);if(pow(2n*root+1n,BigInt(q),budget)*B<=A*pow(2n,BigInt(q),budget))root++;return combatAmount(root,scale);}
