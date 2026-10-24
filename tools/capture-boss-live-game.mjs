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
const url='http://127.0.0.1:'+server.address().port+'/?bossCapture=1&profile=1&evidence=1&devTools=1&activityNew=1&activityCase=F';
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

 // Follow actual persistent site reservations to their real runtime encounters.
 const bossSiteMap=await page.evaluate(()=>{
  const a=window.__SAQ_CAPTURE__.session.authority;
  const reservations=a.withAuthority(x=>x.withAuthorityState(s=>Object.entries(s.d9World.siteReservationsById).map(([siteId,r])=>({
   siteId,reservationId:r.socket?.provenance?.reservationId??null,siteLabel:r.socket?.label??null,packageId:r.packageId,tier:r.parcel?.tier??null
  }))));
  const ids=['repeatable-slot:ruin:wetland:standard:033','repeatable-slot:ruin:frostland:deep:01',
   'repeatable-slot:ruin:upland:standard:049','repeatable-slot:ruin:tropical:standard:037',
   'repeatable-slot:crypt:upland:standard:01','repeatable-slot:fort:grassland:standard:040',
   'repeatable-slot:ruin:desert:standard:056','repeatable-slot:ruin:woodland:standard:054'];
  return reservations.filter(r=>ids.includes(r.reservationId));
 });
 console.log('BOSS_REAL_SITE_MAP',JSON.stringify(bossSiteMap));
 await fs.writeFile(path.join(output,'boss-site-map.json'),JSON.stringify(bossSiteMap,null,2));
 // Void uses an existing Deep Frostland Ruin, provisioned by the real world
 // streaming system; do not fabricate the arena or draw an illustrative mock.
 const chosen=bossSiteMap.find(x=>x.reservationId==='repeatable-slot:ruin:frostland:deep:01')??bossSiteMap[0];
 if(chosen){
  console.log('TRAVEL_TO_BOSS',JSON.stringify(chosen));
  const moved=await page.evaluate(async id=>{
   const p=window.__SAQ_CAPTURE__.session.clientPort;
   return await p.siteNavigator({action:'teleport',siteId:id});
  },chosen.siteId);
  console.log('REAL_GAME_SITE_TRAVEL',JSON.stringify(moved));
  await page.waitForTimeout(2000);
  await page.locator('#world-view').screenshot({path:path.join(output,'real-game-boss-entrance.png')});
  const state=await page.evaluate(siteId=>{
   const {session}=window.__SAQ_CAPTURE__;
   return session.authority.withAuthority(a=>a.withAuthorityState(s=>{
    const p=Object.values(s.playersById)[0],hero=s.entitiesById[p.entityId];
    const site=s.d9World?.functionalSitesById?.[siteId];
    return {tick:s.tick,hero:{entityId:hero.entityId,position:hero.position,residency:hero.residency},
     siteExists:Boolean(site),site:site?{siteId:site.siteId,floors:site.floors?.map(f=>({
       index:f.index,spaceInstanceId:f.spaceInstanceId,groupId:f.groupId,entrance:f.entrance,enemyIds:f.enemyIds?.slice(0,8),
       transitions:f.transitions,rooms:f.graph?.rooms?.slice(0,6)}))}:null,
     activeBosses:Object.values(s.bossCombat?.bossesByEntityId??{}).map(b=>({id:b.bossDefinitionId,entityId:b.entityId,spaceInstanceId:b.spaceInstanceId,siteId:b.siteId,position:s.entitiesById[b.entityId]?.position})).slice(0,20),
     reservation:s.d9World.siteReservationsById[siteId]?{entrance:s.d9World.siteReservationsById[siteId].socket?.entrance,
       packageId:s.d9World.siteReservationsById[siteId].packageId}:null
    };
   }));
  },chosen.siteId);
  console.log('REAL_SITE_AFTER_TRAVEL',JSON.stringify(state).slice(0,18000));
  await fs.writeFile(path.join(output,'real-site-after-travel.json'),JSON.stringify(state,null,2));
  const door=await page.evaluate(id=>window.__SAQ_CAPTURE__.toDoor(id),chosen.siteId);
  console.log('WORLD_BOSS_DOOR',JSON.stringify(door));
  await page.waitForTimeout(600);
  const entranceResult=await page.evaluate(async id=>await window.__SAQ_CAPTURE__.enter(id),chosen.siteId);
  console.log('WORLD_BOSS_NATIVE_ENTER',JSON.stringify(entranceResult));
  await page.waitForTimeout(900);
  const final=await page.evaluate(id=>window.__SAQ_CAPTURE__.finalBoss(id),chosen.siteId);
  console.log('WORLD_BOSS_REAL_FINAL_CHAMBER',JSON.stringify(final));
  // The native host waits for interior ground preparation after a test-only
  // floor relocation. Screenshot only once the game's own loading overlay is
  // gone and its actual final-floor frame has had time to be painted.
  await page.waitForFunction(()=>{
    const gate=document.getElementById('world-space-loading');
    const capture=window.__SAQ_CAPTURE__;
    const model=capture?.session.clientPort.getReadModel();
    return gate?.hidden===true&&gate?.style.display==='none'&&
      document.documentElement.dataset.spacePreparing==='false'&&
      model?.space?.label?.includes('Floor 4/4');
  },null,{timeout:90000});
  await page.waitForTimeout(750);
  const witness=await page.evaluate(()=>{
    const {session}=window.__SAQ_CAPTURE__,m=session.clientPort.getReadModel(),
      actors=Object.values(m.entitiesById??{}).filter(a=>a.boss?.bossDefinitionId);
    return {tick:m.tick,space:m.space?.label,spaceInstanceId:m.context?.spaceInstanceId,
     bosses:actors.map(a=>({id:a.boss.bossDefinitionId,x:a.position.x,y:a.position.y,hp:a.hp,phase:a.boss.phase})),
     hero:m.entitiesById?.[m.playersById?.[m.localPlayerId]?.entityId]?.position,
     canvasShown:document.getElementById('world-view')?.getBoundingClientRect().toJSON(),
     readyGate:{hidden:document.getElementById('world-space-loading')?.hidden,
       style:document.getElementById('world-space-loading')?.style.display,
       dataset:document.documentElement.dataset.spacePreparing,
       gameText:document.getElementById('world-status')?.textContent}};
  });
  if(!witness.bosses?.length)throw Error('No actual boss actor in rendered world projection');
  console.log('WORLD_BOSS_REAL_IN_GAME_CAPTURE',JSON.stringify(witness));
  await fs.writeFile(path.join(output,'boss-void-live-evidence.json'),JSON.stringify({...witness,final},null,2));
  await page.locator('#world-view').screenshot({path:path.join(output,'VOID-OVERSEER-ACTUAL-WORLD-GAME.png')});
  console.log('WORLD_BOSS_SCREENSHOT',path.join(output,'VOID-OVERSEER-ACTUAL-WORLD-GAME.png'));
 }
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
