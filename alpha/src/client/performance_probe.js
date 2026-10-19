// Opt-in browser diagnostics. Disabled play has no timers, serialization or
// global state; the probe is composed only by the browser entrypoint.
export function createBrowserPerformanceProbe({ now, enabled, initiallyRecording=true }) {
  if (!enabled) return null;
  let startedAt = now(),recording=Boolean(initiallyRecording),stoppedAt=recording?null:startedAt;const metrics = new Map(), samples = new Map(), gauges = Object.create(null), WINDOW = 600;
  let lastFrameTime = null;

  const percentile=(values,ratio)=>{
    if(!values.length)return 0;
    const sorted=[...values].sort((a,b)=>a-b);
    return sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*ratio))];
  };
  const push=(values,value)=>{values.push(value);if(values.length>WINDOW)values.shift();};

  function record(name, duration) {
    if(!recording)return;
    const at=now(),metric = metrics.get(name) ?? { count: 0, totalMs: 0, maxMs: 0, totalOver33Ms:0,totalOver50Ms:0,totalOver100Ms:0,recent:[], intervals:[], lastAt:null };
    if(metric.lastAt!==null)push(metric.intervals,at-metric.lastAt);
    metric.lastAt=at;push(metric.recent,duration);
    metric.count++; metric.totalMs += duration; metric.maxMs = Math.max(metric.maxMs, duration);metric.totalOver33Ms+=Number(duration>33);metric.totalOver50Ms+=Number(duration>50);metric.totalOver100Ms+=Number(duration>100);
    metrics.set(name, metric);
  }
  function measure(name, operation) {
    if(!recording)return operation();
    const start = now();
    try { return operation(); }
    finally { record(name, now() - start); }
  }
  function frame(time) {
    if(!recording)return;
    if (lastFrameTime !== null) {
      const interval = time - lastFrameTime;
      record("frameInterval", interval);
    }
    lastFrameTime = time;
  }
  function setGauge(name, value) { if(recording)gauges[name] = value; }
  function sample(name,value){if(!recording)return;const values=samples.get(name)??[];push(values,value);samples.set(name,values);}
  function start({reset=true}={}){const at=now();if(reset){metrics.clear();samples.clear();for(const key of Object.keys(gauges))delete gauges[key];lastFrameTime=null;startedAt=at;}else if(!recording)startedAt+=at-stoppedAt;stoppedAt=null;recording=true;return recording;}
  function stop(){if(recording)stoppedAt=now();recording=false;lastFrameTime=null;return recording;}
  function snapshot() {
    const elapsedSeconds = Math.max(((recording?now():stoppedAt) - startedAt) / 1000, 0.001), measured = {};
    for (const [name, metric] of metrics){const recent=metric.recent,intervals=metric.intervals;measured[name] = Object.freeze({
      count: metric.count, totalMs: metric.totalMs, averageMs: metric.totalMs / metric.count,
      maxMs: metric.maxMs, callsPerSecond: metric.count / elapsedSeconds,recentCallsPerSecond:intervals.length?1000/(intervals.reduce((a,b)=>a+b,0)/intervals.length):0,
      p50Ms:percentile(recent,.5),p95Ms:percentile(recent,.95),p99Ms:percentile(recent,.99),recentMaxMs:recent.length?Math.max(...recent):0,
      over33Ms:recent.filter(v=>v>33).length,over50Ms:recent.filter(v=>v>50).length,over100Ms:recent.filter(v=>v>100).length,totalOver33Ms:metric.totalOver33Ms,totalOver50Ms:metric.totalOver50Ms,totalOver100Ms:metric.totalOver100Ms,
    });}
    const frames=measured.frameInterval??null,sampled={};
    for(const [name,values] of samples)sampled[name]=Object.freeze({count:values.length,average:values.reduce((a,b)=>a+b,0)/values.length,p50:percentile(values,.5),p95:percentile(values,.95),p99:percentile(values,.99),max:Math.max(...values)});
    return Object.freeze({ recording,elapsedSeconds, longFrameCount:frames?.totalOver50Ms??0,frameStats:frames?Object.freeze({fps:frames.averageMs?1000/frames.averageMs:0,recentFps:frames.p50Ms?1000/frames.p50Ms:0,p50Ms:frames.p50Ms,p95Ms:frames.p95Ms,p99Ms:frames.p99Ms,worstMs:frames.recentMaxMs,lifetimeWorstMs:frames.maxMs,over33Ms:frames.over33Ms,over50Ms:frames.over50Ms,over100Ms:frames.over100Ms,totalOver33Ms:frames.totalOver33Ms,totalOver50Ms:frames.totalOver50Ms,totalOver100Ms:frames.totalOver100Ms}):null,metrics: Object.freeze(measured),
      samples:Object.freeze(sampled),gauges: Object.freeze({ ...gauges }) });
  }
  return Object.freeze({ measure, record, frame, sample, setGauge, start,stop,isRecording:()=>recording,snapshot });
}
