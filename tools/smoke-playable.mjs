import {createServer} from 'node:http';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
const root=path.resolve('dist');
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.webmanifest':'application/manifest+json','.png':'image/png'};
const server=createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const resolved=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!resolved.startsWith(root+path.sep)&&resolved!==root){res.writeHead(403);res.end();return;}
    const body=await fs.readFile(resolved);
    res.writeHead(200,{'content-type':mime[path.extname(resolved)]||'application/octet-stream','cache-control':'no-store'});
    res.end(body);
  } catch {res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+'/';
let browser;
const errors=[];
try {
  browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CI?{channel:'chrome'}:{})});
  const page=await browser.newPage({viewport:{width:1200,height:780}});
  page.on('pageerror',error=>errors.push('Page: '+error.message));
  page.on('console',msg=>{if(msg.type()==='error')errors.push('Console: '+msg.text());});
  page.on('response',response=>{if(response.status()>=400)errors.push('HTTP '+response.status()+' '+response.url())});
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await Promise.race([page.waitForFunction(()=>{
    const loading=document.getElementById('saq-startup-scene');
    const recovery=document.getElementById('startup-recovery');
    const attack=document.getElementById('primary-attack');
    return loading?.hidden && recovery?.hidden && attack && !attack.hidden && document.getElementById('world-view');
  },null,{timeout:180000}),page.waitForFunction(()=>{
    const recovery=document.getElementById('startup-recovery');
    return recovery&&!recovery.hidden&&document.getElementById('startup-recovery-title')?.textContent==='World could not start';
  },null,{timeout:180000}).then(()=>{throw Error('Game opened recovery screen instead of running');})]);
  await page.waitForTimeout(1000);
  if(errors.length)throw Error('Browser errors: '+errors.join(' | ').slice(0,3000));
  console.log('Playable browser smoke passed: game loaded and combat control is visible');
} catch(error){
  if(browser){
    const pages=browser.contexts().flatMap(c=>c.pages());
    for(const page of pages){
      const state=await page.evaluate(()=>({
        status:document.getElementById('world-status')?.textContent,
        detail:document.getElementById('startup-recovery-detail')?.textContent,
        recoveryVisible:!document.getElementById('startup-recovery')?.hidden,
        loadingVisible:!document.getElementById('saq-startup-scene')?.hidden
      })).catch(e=>({error:e.message}));
      console.error('Startup state:',state);
    }
  }
  console.error('Captured browser errors:',errors.slice(0,25));
  throw error;
} finally {
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
