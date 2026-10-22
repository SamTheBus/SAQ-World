// Minimal DOM contract regression: the loader is cosmetic and progress is strictly milestone based.
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=readFileSync(new URL('../src/client/startup_loading_v1.js',import.meta.url),'utf8');
const fake=()=>{
  let ms=0,interval=null,cleared=false;
  const els=new Map();
  for(const name of ['saq-startup-scene','saq-startup-stage','saq-startup-detail','saq-startup-steps','saq-startup-elapsed','saq-startup-progress','saq-startup-activity','saq-startup-copy'])els.set(name,{
    hidden:false,value:0,dataset:{},textContent:'',attributes:{},setAttribute(k,v){this.attributes[k]=v},addEventListener(name,cb){this.callback=cb}
  });
  const window={},document={documentElement:{dataset:{worldRelease:'wilderness-v3-starter-20261022'}},getElementById:id=>els.get(id)},
    env={document,window,performance:{now:()=>ms},setInterval:fn=>{interval=fn;return 23},clearInterval:id=>{assert.equal(id,23);cleared=true},navigator:{clipboard:{writeText:async()=>{}}},console:{info:()=>{}}};
  vm.runInNewContext(source,env,{filename:'startup_loading_v1.js'});
  return {loader:window.__SAQ_STARTUP_LOADING_V1__,els,window,advance:n=>{ms+=n;interval?.()},isStopped:()=>cleared};
};
{
 const {loader,els,window,advance,isStopped}=fake();
 assert(loader);assert.equal(els.get('saq-startup-progress').value,0);
 advance(1600);loader.stage(1,'Reading the world map');assert.equal(els.get('saq-startup-progress').value,1);
 loader.stage(0,'Invalid regression');assert.equal(els.get('saq-startup-progress').value,1);
 advance(2000);loader.stage(3,'Opening your world');loader.note('Generating terrain');
 assert.equal(els.get('saq-startup-stage').textContent,'Generating terrain');
 assert.equal(els.get('saq-startup-progress').value,3);
 loader.stage(4,'Checking assets');loader.stage(5,'Drawing first frame');
 assert.equal(els.get('saq-startup-scene').hidden,false);
 advance(1000);loader.finish();
 assert.equal(els.get('saq-startup-scene').hidden,true);
 assert.equal(els.get('saq-startup-progress').value,6);assert.equal(isStopped(),true);
 assert(window.__SAQ_WORLD_STARTUP_TIMINGS__.totalMs>=4600);
 loader.stage(2,'Should not resurrect');assert.equal(els.get('saq-startup-progress').value,6);
}
{
 const {loader,els,isStopped}=fake();loader.stage(3,'Restoring');loader.fail();
 assert.equal(els.get('saq-startup-scene').hidden,true);
 assert.equal(isStopped(),true);
 assert.equal(els.get('saq-startup-progress').value,3);
 loader.finish();assert.equal(els.get('saq-startup-progress').value,3);
}
console.log('PASS startup loading controller: real stage progression, elapsed, finish/fail, no false 100%');
