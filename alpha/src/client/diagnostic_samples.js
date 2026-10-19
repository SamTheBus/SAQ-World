import {integerBigInt,integerWire} from '../shared/contracts/integer_domain.js';
import {combatInteger} from '../shared/contracts/combat_amount.js';
import {formatLarge} from '../shared/contracts/large_number.js';
export const formatDungeonDps=value=>formatLarge(typeof value==='number'?String(value):value);
export function createDpsSamples(){
 const amounts=Array(3001).fill(0n),stamps=new Float64Array(3001);stamps.fill(-Infinity);let domain=null,cursor=0;
 function reset(){amounts.fill(0n);stamps.fill(-Infinity);domain=null;cursor=0;}
 function observe(model,time){const key=model.context.campaignId+'/'+model.context.sessionId+'/'+model.localPlayerId,events=model.primary?.events??[];
  if(domain!==key){reset();domain=key;cursor=events.at(-1)?.eventSequence??0;return;}
  const ms=Math.floor(time),bucket=ms%3001;
  for(const e of events){if(e.eventSequence<=cursor)continue;cursor=e.eventSequence;
   if(e.kind!=='combat.damageApplied'||e.source.playerId!==model.localPlayerId)continue;
   const amount=integerBigInt(combatInteger(e.payload.damage));if(amount===0n)continue;
   if(stamps[bucket]!==ms){stamps[bucket]=ms;amounts[bucket]=0n;}amounts[bucket]+=amount;
  }
 }
 function value(time){let total=0n;for(let i=0;i<3001;i++)if(time-stamps[i]<=3000)total+=amounts[i];const tenths=(total*10n+1n)/3n;return (tenths/10n).toString()+'.'+(tenths%10n);}
 return {observe,value,reset};
}
export function createFrameSamples(){
 const times=new Float64Array(2048),durations=new Float64Array(2048);let index=0,count=0,last=null;
 function reset(){index=0;count=0;last=null;}
 function observe(time){if(last!==null&&time>last){times[index]=time;durations[index]=time-last;index=(index+1)%2048;count=Math.min(2048,count+1);}last=time;}
 function read(time){let sum=0,n=0,worst=0;for(let j=0;j<count;j++){const i=(index-1-j+2048)%2048,age=time-times[i];if(age>5000)break;worst=Math.max(worst,durations[i]);if(age<=1000){sum+=durations[i];n++;}}return {fps:sum?1000*n/sum:0,frameMs:count?durations[(index+2047)%2048]:0,worstMs:worst};}
 return {observe,read,reset};
}
