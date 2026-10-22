// Bounded diagnostic bookkeeping. It never owns simulation ticks or retries.
export const BROWSER_LOOP_HEALTH_VERSION='browser-loop-health-ruin-freeze-v1';
export function createBrowserLoopHealth({now,visibility,runtimeId}){
 const counters={paintAttempts:0,paintCompleted:0,authorityCallbacks:0,authorityTicksAdvanced:0},events=[];let fatal=null,lastPaintAt=null,lastAuthorityAt=null,lastGate=null;
 function record(kind,detail={}){events.push({kind,at:now(),...visibility(),...detail});if(events.length>64)events.shift();}
 return Object.freeze({paintBegin(){counters.paintAttempts++;},paintEnd(){counters.paintCompleted++;lastPaintAt=now();},authorityBegin(){counters.authorityCallbacks++;lastAuthorityAt=now();},advanced(){counters.authorityTicksAdvanced++;},
  gate(value){if(value!==lastGate){lastGate=value;record('gate',{value});}},record,
  fail(phase,error,context){if(fatal)return false;fatal=Object.freeze({version:BROWSER_LOOP_HEALTH_VERSION,runtimeId,phase,at:now(),...visibility(),message:error?.message??String(error),stack:error?.stack??null,counters:{...counters},context});record('fatal',{phase,message:fatal.message});return true;},failed:()=>fatal!==null,
  inspect:()=>({version:BROWSER_LOOP_HEALTH_VERSION,counters:{...counters},lastPaintAt,lastAuthorityAt,lastGate,fatal,events:events.map(e=>({...e}))})});
}
