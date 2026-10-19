// Browser pacing only. Authority remains a fixed 60 Hz sequence of complete
// ticks. A 30 Hz browser callback may therefore admit two ordered ticks, while
// short foreground delays use a tightly bounded catch-up batch. Long stalls
// reset elapsed debt instead of replaying suspension time into gameplay.
export const AUTHORITY_CLOCK_PERIOD_MS=1000/60;
export const AUTHORITY_CLOCK_MAX_STEPS_PER_CALLBACK=4;
export const AUTHORITY_CLOCK_STALL_RESET_MS=250;

export function createAuthorityClock({now,step,ready,observe=null,maxStepsPerCallback=AUTHORITY_CLOCK_MAX_STEPS_PER_CALLBACK,stallResetMs=AUTHORITY_CLOCK_STALL_RESET_MS}) {
  const period=AUTHORITY_CLOCK_PERIOD_MS,epsilon=period*1e-7;
  const openedAt=now();let deadline=openedAt+period,lastCallbackAt=openedAt,maxDebt=0,maxSteps=0,maxCallbackGapMs=0,resetDebtTicks=0,overflowDiscardedDebtTicks=0,resetCount=0,lastResetReason=null;
  const dueAt=at=>at+epsilon<deadline?0:Math.floor((at-deadline+epsilon)/period)+1;
  function reset(reason='manual'){
    const at=now(),dropped=dueAt(at);resetDebtTicks+=dropped;resetCount++;lastResetReason=reason;deadline=at+period;lastCallbackAt=at;return dropped;
  }
  function run(){const start=now(),callbackGapMs=Math.max(0,start-lastCallbackAt),due=dueAt(start),debt=Math.max(0,due-1);let steps=0,resetThisRun=0,overflowDiscardedThisRun=0;
    lastCallbackAt=start;maxCallbackGapMs=Math.max(maxCallbackGapMs,callbackGapMs);
    maxDebt=Math.max(maxDebt,debt);
    if(!ready())resetThisRun=reset('not-ready');
    else if(callbackGapMs+epsilon>=stallResetMs)resetThisRun=reset('stall');
    else {
      const admitted=Math.min(due,maxStepsPerCallback);
      for(;steps<admitted&&ready();steps++){step();deadline+=period;}
      // A sustained 15-60 Hz cadence naturally requires no more than four
      // ticks. More due work means this callback followed an abnormal gap.
      // Admit one bounded catch-up batch, then discard its excess immediately
      // so the next callback cannot become another four-tick burst.
      if(due>steps){overflowDiscardedThisRun=due-steps;overflowDiscardedDebtTicks+=overflowDiscardedThisRun;resetDebtTicks+=overflowDiscardedThisRun;resetCount++;lastResetReason='catch-up-overflow';deadline=start+period;}
    }
    maxSteps=Math.max(maxSteps,steps);
    const sample={due,debt,maxDebt,steps,maxSteps,callbackGapMs,maxCallbackGapMs,carriedDebtTicks:Math.max(0,due-steps-overflowDiscardedThisRun-resetThisRun),discardedDebtTicks:resetDebtTicks,overflowDiscardedDebtTicks,overflowDiscardedThisRun,resetThisRun,resetCount,lastResetReason};
    observe?.(sample);
    return Math.max(0,Math.ceil(deadline-now()));
  }
  return Object.freeze({run,reset,inspect:()=>Object.freeze({deadline,maxDebt,maxSteps,maxCallbackGapMs,discardedDebtTicks:resetDebtTicks,overflowDiscardedDebtTicks,resetCount,lastResetReason})});
}
