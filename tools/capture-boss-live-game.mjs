import {createServer} from 'node:http';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const root=path.resolve('dist');
const output=path.resolve('boss-capture-artifacts');
await fs.mkdir(output,{recursive:true});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.webmanifest':'application/manifest+json','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const resolved=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!resolved.startsWith(root+path.sep)&&resolved!==root){res.writeHead(403);res.end();return;}
  const body=await fs.readFile(resolved);res.writeHead(200,{'content-type':mime[path.extname(resolved)]??'application/octet-stream','cache-control':'no-store'});res.end(body);
 }catch(error){res.writeHead(404);res.end(String(error));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+'/?bossCapture=1&profile=1&evidence=1&devTools=1&activityNew=1';
const errors=[];let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:980},deviceScaleFactor:1});
 page.on('pageerror',err=>errors.push('pageerror:'+err.message));
 page.on('console',msg=>{if(msg.type()==='error')errors.push('console:'+msg.text());});
 page.on('response',resp=>{if(resp.status()>=400)errors.push('HTTP '+resp.status()+' '+resp.url())});
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>window.__SAQ_CAPTURE__!==undefined||document.getElementById('startup-recovery')?.hidden===false,null,{timeout:180000});
 await page.waitForFunction(()=>document.getElementById('saq-startup-scene')?.hidden===true
   &&document.getElementById('startup-recovery')?.hidden===true
   &&document.getElementById('primary-attack')?.hidden===false,null,{timeout:180000});
 await page.waitForTimeout(1700);
 const data=await page.evaluate(()=>{
  const h=window.__SAQ_CAPTURE__;
  const m=h.read(), nav=m.developer?.siteNavigator;
  const authority=h.session.authority;
  const live=authority?.withAuthority?.(a=>a.withAuthorityState(s=>({
   tick:s.tick,proofCase:s.proofCase,siteKeys:Object.keys(s.d9World?.functionalSitesById??{}).slice(0,30),
   reservedCount:Object.keys(s.d9World?.siteReservationsById??{}).length,
   sampleReservations:Object.keys(s.d9World?.siteReservationsById??{}).slice(0,12),
   spaceCount:Object.keys(s.spacesByInstanceId??{}).length,
   siteMeta:Object.values(s.d9World?.functionalSitesById??{}).slice(0,4).map(x=>({id:x.siteId,name:x.label,floors:x.floors?.length}))
  })));
  return {tick:m.tick,space:m.space?.label,context:m.context?.spaceInstanceId,player:m.localPlayerId,
   siteNavigatorAvailable:typeof h.session.clientPort.siteNavigator==='function',
   nav:{count:nav?.sites?.length??0,siteKeys:nav?.sites?.slice(0,3).map(s=>Object.keys(s)),
     sites:nav?.sites?.map(s=>({siteId:s.siteId,label:s.label,distance:s.distance,siteType:s.siteType,tier:s.tier,reviewEncounter:s.reviewEncounter,approachAnchor:s.approachAnchor,entrance:s.entrance})).slice(0,150),
     diagnostics:nav?.diagnostics},
   live,canvas:document.getElementById('world-view')?.getBoundingClientRect().toJSON(),
   status:document.getElementById('world-status')?.textContent};
 });
 console.log('ACTUAL_WORLD_PROJECTION',JSON.stringify(data).slice(0,29000));
 await fs.writeFile(path.join(output,'world-diagnostics.json'),JSON.stringify({...data,errors},null,2));
 await page.locator('#world-view').screenshot({path:path.join(output,'real-game-initial-world.png')});
 console.log('REAL_GAME_SCREENSHOT',path.join(output,'real-game-initial-world.png'));
 if(data.nav.sites?.length) {
  const targets=data.nav.sites.filter(s=>/boss|ruin|fort|crypt/i.test(s.label+' '+s.siteType));
  console.log('SITE_NAV_TARGETS',JSON.stringify(targets.slice(0,25)).slice(0,7000));
 }
 if(errors.length)console.log('BROWSER_DIAGNOSTIC_ERRORS',JSON.stringify(errors).slice(0,4000));
} catch(error){
 console.error('BOSS_CAPTURE_FAILED',error.stack);
 await fs.writeFile(path.join(output,'error.txt'),error.stack);
 throw error;
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
