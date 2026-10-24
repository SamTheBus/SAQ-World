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
  // Every following image is another native dungeon activation + native
  // final-floor boss, using the actual World combat renderer and HUD.
  await page.close();
  // Each boss gets its own clean, fully authoritative World campaign, browser
  // storage context and character. Otherwise a high-level boss can kill the
  // previous hero and prevent the next site's developer navigator from running.
  const otherBosses=[
   ['NEXUS-OVERSEER','repeatable-slot:ruin:tropical:standard:037','nexus_overseer'],
   ['CORROSIVE-ABOMINATION','repeatable-slot:ruin:wetland:standard:033','corrosive_abomination'],
   ['CHRONOS-ARBITRATOR','repeatable-slot:ruin:upland:standard:049','chronos_arbitrator'],
   ['HOOKTAIL','repeatable-slot:ruin:desert:standard:056','hooktail'],
   ['CINDERHART','repeatable-slot:ruin:woodland:standard:054','cinderhart'],
   ['MARCUS-THE-OUTLAW','repeatable-slot:fort:grassland:standard:040','marcus'],
   ['GILDED-VAULT-KEEPER','repeatable-slot:crypt:upland:standard:01','gilded_vault_keeper']
  ];
  const captureResults=[{boss:'void_overseer',result:'captured',siteId:chosen.siteId}];
  for(const [label,reservation,bossId]of otherBosses){
   const isolated=await browser.newPage({viewport:{width:1440,height:980},deviceScaleFactor:1});
   isolated.setDefaultTimeout(110000);
   try{
    console.log('BOSS_CAPTURE_NEW_WORLD_START',bossId);
    await isolated.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
    await isolated.waitForFunction(()=>{
     const loading=document.getElementById('saq-startup-scene'),recovery=document.getElementById('startup-recovery'),attack=document.getElementById('primary-attack');
     return window.__SAQ_CAPTURE__&&loading?.hidden===true&&recovery?.hidden===true&&attack&&!attack.hidden;
    },null,{timeout:180000});
    await isolated.waitForTimeout(450);
    const site=await isolated.evaluate(reservation=>{
     const s=window.__SAQ_CAPTURE__.session;
     return s.authority.withAuthority(a=>a.withAuthorityState(state=>{
      const row=Object.values(state.d9World.siteReservationsById??{}).find(r=>r.socket?.provenance?.reservationId===reservation);
      return row?{siteId:row.siteId,reservationId:row.socket.provenance.reservationId}:null;
     }));
    },reservation);
    if(!site)throw Error('Original boss reservation not present in new world '+reservation);
    console.log('BOSS_NATIVE_SITE_FOUND',bossId,site.siteId);
    const moved=await isolated.evaluate(async id=>window.__SAQ_CAPTURE__.session.clientPort.siteNavigator({action:'teleport',siteId:id}),site.siteId);
    if(moved?.status!=='relocated')throw Error('Navigator failed '+JSON.stringify(moved));
    await isolated.waitForTimeout(200);
    const door=await isolated.evaluate(id=>window.__SAQ_CAPTURE__.toDoor(id),site.siteId);
    if(door?.status!=='relocated')throw Error('Native approach failed '+JSON.stringify(door));
    await isolated.waitForTimeout(100);
    const entered=await isolated.evaluate(async id=>await window.__SAQ_CAPTURE__.enter(id),site.siteId);
    if(entered?.status!=='admitted'&&entered?.status!=='alreadyApplied')throw Error('Native dungeon entry not admitted '+JSON.stringify(entered));
    await isolated.waitForTimeout(350);
    const destination=await isolated.evaluate(id=>window.__SAQ_CAPTURE__.finalBoss(id),site.siteId);
    if(destination.bossLabel!==bossId)throw Error('Wrong real boss: '+destination.bossLabel);
    await isolated.waitForFunction(id=>{
     const model=window.__SAQ_CAPTURE__?.session.clientPort.getReadModel(),gate=document.getElementById('world-space-loading');
     return gate?.hidden===true&&gate.style.display==='none'&&
      document.documentElement.dataset.spacePreparing==='false'&&
      Object.values(model?.entitiesById??{}).some(a=>a.boss?.bossDefinitionId===id);
    },bossId,{timeout:90000});
    await isolated.waitForTimeout(400);
    const evidence=await isolated.evaluate(()=>{
     const model=window.__SAQ_CAPTURE__.session.clientPort.getReadModel();
     return {tick:model.tick,space:model.space?.label,spaceInstanceId:model.context?.spaceInstanceId,
      bosses:Object.values(model.entitiesById??{}).filter(a=>a.boss?.bossDefinitionId)
       .map(a=>({id:a.boss.bossDefinitionId,position:a.position,phase:a.boss.phase,alive:a.alive})),
      renderReady:document.getElementById('world-space-loading')?.hidden===true};
    });
    if(!evidence.bosses.some(a=>a.id===bossId&&a.alive))throw Error('Target boss absent/dead in rendered native game');
    const filename=label+'-ACTUAL-WORLD-GAME.png';
    await isolated.locator('#world-view').screenshot({path:path.join(output,filename)});
    await fs.writeFile(path.join(output,label+'-evidence.json'),JSON.stringify({evidence,destination,site},null,2));
    console.log('BOSS_ACTUAL_IN_GAME_SCREENSHOT',bossId,filename,JSON.stringify(evidence));
    captureResults.push({boss:bossId,result:'captured',siteId:site.siteId,filename});
   }catch(error){
    console.log('BOSS_CAPTURE_WARNING',bossId,String(error.stack??error).slice(0,1500));
    await fs.writeFile(path.join(output,label+'-error.txt'),String(error.stack??error));
    captureResults.push({boss:bossId,result:'failed',error:String(error.message??error)});
   }finally{await isolated.close();}
  }
  await fs.writeFile(path.join(output,'boss-capture-index.json'),JSON.stringify(captureResults,null,2));
  console.log('BOSS_CAPTURE_FINAL_ROSTER',JSON.stringify(captureResults.map(x=>({boss:x.boss,result:x.result}))));

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
