import {compareAmount} from '../shared/contracts/economy_amount.js';
// Disposable presentation. Currency digits remain exact; only elapsed-time easing uses Number.
export function createWalletDisplay(){
 let value='0',authority='0',from='0',target='0',started=0,running=false,initialized=false;
 function snap(a){value=authority=from=target=a;running=false;initialized=true;}
 function read(time){if(!running)return value;const t=Math.max(0,Math.min(1,(time-started)/420));
  if(t===1){value=target;running=false;return value;}
  const scale=Math.max((from.split('.')[1]??'').length,(target.split('.')[1]??'').length);
  const units=a=>{const [w,f='']=a.split('.');return BigInt(w+f.padEnd(scale,'0'));};
  const a=units(from),b=units(target),ease=BigInt(Math.floor((1-(1-t)**3)*1000000));
  let digits=(a+(b-a)*ease/1000000n).toString().padStart(scale+1,'0');
  if(scale)digits=(digits.slice(0,-scale)+'.'+digits.slice(-scale)).replace(/0+$/,'').replace(/\.$/,'');
  value=digits;return value;
 }
 return Object.freeze({read,observe(a,time,{reset=false,pending=false}={}){
  if(!initialized||reset||compareAmount(a,authority)<0){snap(a);return;}
  read(time);if(a!==authority&&!pending)snap(a);else authority=a;
 },settle(time){read(time);from=value;target=authority;started=time;running=value!==target;}});
}
