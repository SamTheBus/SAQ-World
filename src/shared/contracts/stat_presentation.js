import {integerBigInt,integerWire} from './integer_domain.js';
import {formatLarge} from './large_number.js';
export const isIntegerStat=v=>typeof v==='string'||Boolean(v?.chunks);
const fraction=v=>{if(v?.n!==undefined)return [BigInt(v.n),BigInt(v.d)];if(v?.chunks)return [integerBigInt(v),1n];if(typeof v==='bigint')return [v,1n];let s=String(v??0);if(/[eE]/.test(s))s=Number(v).toFixed(12);const negative=s[0]==='-';if(negative)s=s.slice(1);const [w,f='']=s.split('.');return [(negative?-1n:1n)*BigInt(w+f),10n**BigInt(f.length)];};
// Bounded fractional DISPLAY precision only. Large whole parts never pass through
// Number, so previews and affix ranges remain readable beyond floating-point range.
export function statValue(v){const [n,d]=fraction(v),negative=n<0n,q=(negative?-n:n)*1000000000000n/d,s=q.toString().padStart(13,'0'),raw=(negative?'-':'')+(s.slice(0,-12)+'.'+s.slice(-12)).replace(/\.?0+$/,'');const text=raw===''||raw==='-'?'0':raw;return Math.abs(Number(text))<=Number.MAX_SAFE_INTEGER&&(Number(text)===0||Math.abs(Number(text))>=.000001)?Number(text):text;}
export function statDifference(a,b){const [an,ad]=fraction(a),[bn,bd]=fraction(b);return statValue({n:String(an*bd-bn*ad),d:String(ad*bd)});}
export function statScale(v,n,d=1){const [a,b]=fraction(v);return statValue({n:String(a*BigInt(n)),d:String(b*BigInt(d))});}
export function statText(v,detail=false){const text=String(statValue(v)),negative=text[0]==='-';return (negative?'-':'')+formatLarge(negative?text.slice(1):text,{significant:detail?6:4});}
