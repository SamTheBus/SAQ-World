import {numericExtension,INTEGER_MAX_DIGITS,integerWire} from './integer_domain.js';
import {progressionBigInt} from './progression_integer.js';
import {requireContract as check} from './wire.js';
// Outward-rounded nonnegative fixed-point intervals. Cold progression work only.
// Every exported endpoint is accepted only when both bounds round identically.
const ceilDiv=(n,d)=>(n+d-1n)/d;
export function numericContext(precision=48){
 check(Number.isSafeInteger(precision)&&precision>=16&&precision<=8192,'Invalid proof precision');
 const S=10n**BigInt(precision);let work=0;
 const budget=()=>{if(++work>20000)numericExtension('D9 numeric proof work');};
 const pair=(lo,hi=lo)=>{check(lo>=0n&&hi>=lo,'Invalid numeric interval');if(hi.toString().length>INTEGER_MAX_DIGITS+precision+4)numericExtension('D9 numeric magnitude');return {lo,hi};};
 const q=(n,d=1n)=>{n=progressionBigInt(n);d=progressionBigInt(d);check(d>0n,'Zero denominator');return pair(n*S/d,ceilDiv(n*S,d));};
 const add=(a,b)=>pair(a.lo+b.lo,a.hi+b.hi);
 const sub=(a,b)=>{check(a.lo>=b.hi,'Unproven positive subtraction');return pair(a.lo-b.hi,a.hi-b.lo);};
 const mul=(a,b)=>{budget();return pair(a.lo*b.lo/S,ceilDiv(a.hi*b.hi,S));};
 const div=(a,b)=>{budget();check(b.lo>0n,'Unproven divisor');return pair(a.lo*S/b.hi,ceilDiv(a.hi*S,b.lo));};
 const power=(a,n)=>{let out=q(1),base=a;while(n){budget();if(n&1n)out=mul(out,base);n>>=1n;if(n)base=mul(base,base);}return out;};
 function rootInteger(n,k){if(n<2n)return n;let x=1n<<BigInt(Math.ceil(n.toString(2).length/k));for(;;){budget();const y=(BigInt(k-1)*x+n/(x**BigInt(k-1)))/BigInt(k);if(y>=x)return x;x=y;}}
 const root=(a,k)=>{check(Number.isSafeInteger(k)&&k>=1&&k<=100,'Invalid root degree');const factor=S**BigInt(k-1),lo=rootInteger(a.lo*factor,k),hi=rootInteger(a.hi*factor,k);return pair(lo,hi**BigInt(k)===a.hi*factor?hi:hi+1n);};
 const frac=(a,p,d)=>root(power(a,BigInt(p)),d);
 function lnReduced(a){
  // a in [1,2]; ln(a)=2*(z+z^3/3+...), z=(a-1)/(a+1).
  check(a.lo>=S&&a.hi<=2n*S,'Log reduction required');const z=div(sub(a,q(1)),add(a,q(1))),z2=mul(z,z);
  let term=z,sum=pair(0n),i=1n;
  for(;;){budget();sum=add(sum,div(term,q(i)));term=mul(term,z2);i+=2n;
   const tail=div(div(term,q(i)),sub(q(1),z2));
   if(tail.hi<=2n)return pair(2n*sum.lo,2n*(sum.hi+tail.hi));
  }
 }
 const ln2=()=>lnReduced(q(2));
 function log2Integer(n){n=progressionBigInt(n);check(n>=1n,'Log requires positive integer');const exponent=n.toString(2).length-1,den=1n<<BigInt(exponent);if(n===den)return q(exponent);return add(q(exponent),div(lnReduced(q(n,den)),ln2()));}
 function exp(a){
  // The magnitude envelope is a technical preflight, not a returned saturation.
  if(a.hi>150000n*S)numericExtension('D9 exponential output admission');
  let x=a,k=0;while(x.hi>S/8n){x=pair(x.lo/2n,ceilDiv(x.hi,2n));k++;}
  let term=q(1),sum=q(1),i=0;
  for(;;){budget();i++;term=div(mul(term,x),q(i));sum=add(sum,term);
   const next=div(mul(term,x),q(i+1)),ratio=div(x,q(i+2)),tail=div(next,sub(q(1),ratio));
   if(tail.hi<=2n){sum=pair(sum.lo,sum.hi+tail.hi);break;}
  }
  for(let j=0;j<k;j++)sum=mul(sum,sum);return sum;
 }
 const dungeonScale=powerValue=>{const p=progressionBigInt(powerValue),band=((p+3n)/4n)*4n;
  const effective=band<=100n?q(band):add(q(100),mul(q(3,2),frac(q(band-100n),7,10)));
  const E=mul(exp(mul(effective,lnReduced(q(253,250)))),add(q(1),mul(q(3,200),effective)));return {effective,E};
 };
 function endpoint(a,mode='round',places=0){const scale=10n**BigInt(places),f=n=>mode==='ceil'?ceilDiv(n*scale,S):mode==='floor'?n*scale/S:(2n*n*scale+S)/(2n*S),lo=f(a.lo),hi=f(a.hi);if(lo!==hi){const e=new RangeError('Numeric proof requires refinement');e.code='NUMERIC_PROOF_REFINE';throw e;}return integerWire(lo);}
 return {q,add,sub,mul,div,power,root,frac,log2Integer,exp,dungeonScale,endpoint,scale:S};
}
export function certifyNumeric(evaluate){for(const p of [32,64,128,256,512,1024,2048,4096,8192]){try{return evaluate(numericContext(p));}catch(e){if(e.code!=='NUMERIC_PROOF_REFINE')throw e;}}numericExtension('D9 endpoint proof precision');}
