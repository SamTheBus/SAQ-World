// Display-only convergence. Never passed back to commands, stats or persistence.
import {progressionBigInt as big,progressionWire as wire} from '../shared/contracts/progression_integer.js';
import {integerRatio} from '../shared/contracts/large_number.js';
import {integerWire} from '../shared/contracts/integer_domain.js';
export function createXpDisplay(){
 let target=null,shown=null,phase='idle',since=0,deadline=0,start=0,previousTime=null;
 const ratio=p=>p.capped?100:100*integerRatio(integerWire(p.current),integerWire(p.required));
 const current=(required,value)=>wire((big(required)*BigInt(Math.round(value*1000000))+50000000n)/100000000n);
 function snap(p,time){target={...p};shown={...p,value:ratio(p)};phase='idle';previousTime=time;return {...shown};}
 function update(p,time,{pending=false,reset=false}={}){
  if(!p)return null;
  if(!shown||reset||previousTime!==null&&(time-previousTime>1000||time<previousTime)||big(p.totalXp)<big(target.totalXp))return snap(p,time);
  previousTime=time;
  if(big(p.totalXp)!==big(target.totalXp)){target={...p};if(phase==='idle'){phase='hold';deadline=time+1600;}else if(phase==='fill'){start=shown.value;since=time;phase=pending?'hold':big(target.level)>big(shown.level)?'threshold':'fill';}}
  if(phase!=='idle'&&time>=deadline+400)return snap(target,time);
  if(phase==='wrap'){shown={...target,value:0,current:0};phase='fill';since=time;start=0;}
  if(phase==='hold'&&(!pending||time>=deadline)){phase=big(target.level)>big(shown.level)?'threshold':'fill';since=time;start=shown.value;}
  if(phase==='threshold'){const t=Math.min(1,(time-since)/180);shown.value=start+(100-start)*t;shown.current=current(shown.required,shown.value);
   if(t===1){phase='wrap';}}
  if(phase==='fill'){const t=Math.min(1,(time-since)/220);shown.value=start+(ratio(target)-start)*(1-(1-t)**2);shown.current=current(target.required,shown.value);if(t===1){shown={...target,value:ratio(target)};phase='idle';}}
  return {...shown};
 }
 return Object.freeze({update,read:()=>shown?{...shown}:null});
}
