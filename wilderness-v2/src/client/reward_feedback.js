import {createWalletDisplay} from './wallet_display.js';
import {addAmount,wholeAmount,formatAmount} from '../shared/contracts/economy_amount.js';
import {EQUIPMENT_STAT_ART} from './equipment_art.js';
import {MONSTER_SOUL_ART} from './forge_art.js';
import {createXpDisplay} from './xp_display.js';
import {spaceKey,selectedActor} from './presentation_state.js';

export const REWARD_FEEDBACK=Object.freeze({maxParticles:24,scatterMs:240,lifeMs:1400,coins:3,orbs:2,burstIntervalMs:180});
// Disposable local feedback. This module has no command port, save handle or award API.
export function createRewardFeedback(canvas){
 const doc=canvas.ownerDocument,overlay=doc.getElementById('reward-effects'),ctx=overlay?.getContext('2d');
 let domain=null,revision=-1,seen=new Set(),particles=[],lastTime=null,geometry=null,peak=0,lastBurst=-Infinity;
 const xpDisplay=createXpDisplay(),wallet=createWalletDisplay();
 const gain=doc.getElementById('world-gold-gain'),gainText=doc.getElementById('world-gold-gain-amount');
 let goldFlight=null,gainAmount='0',gainUntil=-Infinity;
 function clearGain(){goldFlight=null;gainAmount='0';gainUntil=-Infinity;if(gain)gain.hidden=true;}
 function arrived(value,time){gainAmount=addAmount(time<gainUntil?gainAmount:'0',value);gainUntil=time+1300;
  if(gainText)gainText.textContent='+'+formatAmount(gainAmount);if(gain){gain.hidden=false;gain.title='+'+formatAmount(gainAmount);}
  wallet.settle(time);pulse('gold');
  doc.querySelector?.('#world-wallet > svg')?.animate?.([{transform:'scale(1)'},{transform:'scale(1.16)',offset:.25},{transform:'scale(.98)',offset:.7},{transform:'scale(1)'}],{duration:340});
  doc.getElementById('world-gold')?.animate?.([{color:'#fff4ac',filter:'brightness(1.35)'},{color:'#ffd43c',filter:'brightness(1)'}],{duration:420});
 }
 // Keep a single receipt-bearing gold flight when bursts merge. Decorative particles may
 // be evicted, but cannot discard or duplicate its presentation amount.
 function pushParticle(p){if(particles.length>=REWARD_FEEDBACK.maxParticles){const i=particles.findIndex(v=>v!==goldFlight);particles.splice(i,1);}particles.push(p);}

 const stamps={},lastPulse={gold:-Infinity,xp:-Infinity};
 // Cached SAQ currency tokens and faceted XP rune crystals.
 if(ctx)for(const kind of ['gold','xp']){const tile=doc.createElement('canvas');tile.width=16;tile.height=16;const c=tile.getContext('2d');c.translate(8,8);c.strokeStyle='#170e23';c.lineWidth=1.2;
  if(kind==='gold'){// Dungeon assets.js uiIcons.gold: circle and double-bar currency glyph.
   c.fillStyle='#a96913';c.beginPath();c.arc(0,0,5.5,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#ffd43c';c.beginPath();c.arc(-.5,-.7,4.2,0,Math.PI*2);c.fill();c.strokeStyle='#71420d';c.lineWidth=1.1;c.beginPath();c.moveTo(0,-2.7);c.lineTo(0,3);c.moveTo(-2,-1.3);c.lineTo(2,-1.3);c.moveTo(-2,1.1);c.lineTo(2,1.1);c.stroke();c.fillStyle='#fff3ae';c.fillRect(-3.3,-3.6,2.4,1.1);}
  else{// Dungeon violet/cyan palette and assets.js xpRate chevrons, set inside a faceted crystal.
   c.fillStyle='#6032a0';c.beginPath();c.moveTo(0,-6);c.lineTo(4,-2);c.lineTo(3.5,3);c.lineTo(0,6);c.lineTo(-3.5,3);c.lineTo(-4,-2);c.closePath();c.fill();c.stroke();c.fillStyle='#b86cff';c.beginPath();c.moveTo(0,-5);c.lineTo(0,4);c.lineTo(-3,2);c.lineTo(-3,-2);c.closePath();c.fill();c.fillStyle='#ead3ff';c.beginPath();c.moveTo(0,-5);c.lineTo(3,-2);c.lineTo(0,-1);c.lineTo(-3,-2);c.closePath();c.fill();c.strokeStyle='#9bf3ff';c.lineWidth=1;c.beginPath();c.moveTo(-1.5,0);c.lineTo(0,-1.5);c.lineTo(1.5,0);c.moveTo(-1.5,2.3);c.lineTo(0,.8);c.lineTo(1.5,2.3);c.stroke();}
  stamps[kind]=tile;
 }

 if(ctx){const img=doc.createElement('img');img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(MONSTER_SOUL_ART);stamps.soul=img;const heart=doc.createElement('img');heart.src=EQUIPMENT_STAT_ART.maxHp;stamps.heal=heart;}
 function resize(){if(!overlay)return;const a=doc.getElementById('world-app').getBoundingClientRect(),b=canvas.getBoundingClientRect(),x=doc.getElementById('world-xp-bar').getBoundingClientRect();
  overlay.width=Math.round(a.width);overlay.height=Math.round(a.height);geometry={left:b.left-a.left,top:b.top-a.top,xp:{x:x.left-a.left+x.width*.65,y:x.top-a.top+x.height/2}};
 }
 function pulse(kind){if(kind==='soul'||kind==='heal')return;if(lastTime-lastPulse[kind]<250)return;lastPulse[kind]=lastTime;const el=doc.getElementById(kind==='xp'?'world-progression':'world-wallet');el?.animate?.([{filter:kind==='gold'?'brightness(1.18)':'brightness(1.8)',transform:kind==='gold'?'scale(1.012)':'scale(1.035)'},{filter:'brightness(1)',transform:'scale(1)'}],{duration:240});}
 function render(model,time,cam){if(!ctx)return;if(!geometry)resize();ctx.clearRect(0,0,overlay.width,overlay.height);
  const key=spaceKey(model)+'/'+model.localPlayerId,inv=model.inventory;
  const reset=domain!==key||lastTime!==null&&(time-lastTime>1000||time<lastTime)||doc.hidden;
  if(domain!==key||lastTime!==null&&(time-lastTime>1000||time<lastTime)||doc.hidden){domain=key;particles=[];clearGain();seen=new Set(Object.keys(inv?.rewardsByEntityId??{}));revision=inv?.revision;}
  const dt=Math.min(40,Math.max(0,time-(lastTime??time)))/1000;lastTime=time;
  const project=p=>({x:(p.x-cam.x)*cam.zoom+geometry.left,y:(p.y-cam.y)*cam.zoom+geometry.top});
  if(inv&&revision!==inv.revision){resize();for(const [id,r] of Object.entries(inv.rewardsByEntityId)){if(seen.has(id))continue;seen.add(id);if(r.spaceInstanceId!==model.context.spaceInstanceId)continue;
    const souls=inv.economy?.soulAwardsByEntityId[id]??0;
    for(let i=0;i<souls;i++){pushParticle({kind:'soul',born:time,x:r.position.x+(i*2-souls+1)*7,y:r.position.y-8,originY:r.position.y-8,vx:0,vy:0,screen:false,speed:120});}
    if(r.healing){pushParticle({kind:'heal',born:time,x:r.position.x,y:r.position.y-8,ground:r.position.y-4,vx:0,vy:-70,screen:false,speed:170});}
    const ownKill=model.primary?.events?.some(e=>e.kind==='combat.actorDefeated'&&e.subject.entityId===(r.spawnEntityId??id)&&e.source.playerId===model.localPlayerId);
    const environmental=r.episodeSource&&r.episodeSource.kind!=='enemy';
    const awarded=inv.goldAwardsByEntityId?.[id]?.amount;
    if(awarded!==undefined&&awarded!==null&&awarded!==0&&awarded!=='0'){
     const value=typeof awarded==='number'?wholeAmount(awarded):awarded;
     if(goldFlight)goldFlight.amount=addAmount(goldFlight.amount,value);
     else for(let i=0;i<REWARD_FEEDBACK.coins;i++){
      const seed=(r.ordinal*17+i*29)%97,angle=-Math.PI*.9+seed/97*Math.PI*.8;
      const p={kind:'gold',born:time,x:r.position.x,y:r.position.y-8,ground:r.position.y-4,vx:Math.cos(angle)*(65+seed),vy:Math.sin(angle)*(90+seed),screen:false,speed:170};
      if(i===0){goldFlight=p;p.amount=value;}pushParticle(p);
     }
    }
    if((!ownKill&&!environmental)||time-lastBurst<REWARD_FEEDBACK.burstIntervalMs){if(!environmental)pulse('xp');continue;}lastBurst=time;
    if(!environmental)for(let i=0;i<REWARD_FEEDBACK.orbs;i++){
     const seed=(r.ordinal*17+i*29+11)%97,angle=-Math.PI*.9+seed/97*Math.PI*.8;
     pushParticle({kind:'xp',born:time,x:r.position.x,y:r.position.y-8,ground:r.position.y-4,vx:Math.cos(angle)*(65+seed),vy:Math.sin(angle)*(90+seed),screen:false,speed:170,bounced:false});
    }}seen=new Set(Object.keys(inv.rewardsByEntityId));revision=inv.revision;peak=Math.max(peak,particles.length);}
  wallet.observe(typeof inv?.gold==='number'?wholeAmount(inv.gold):(inv?.gold??'0'),time,{reset,pending:goldFlight!==null});
  const targetPlayer=project({...selectedActor(model).position,y:selectedActor(model).position.y-10});
  particles=particles.filter(p=>{const age=time-p.born;if(p.kind!=='gold'&&age>REWARD_FEEDBACK.lifeMs)return false;
   if(p.kind==='soul'&&age<560){p.y=p.originY-16*Math.sin(Math.min(1,age/350)*Math.PI/2)+Math.sin(age/90)*1.2;}
   else if(age<(p.kind==='gold'?450:REWARD_FEEDBACK.scatterMs)){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=540*dt;p.vx*=Math.exp(-3*dt);if(p.kind==='gold'&&p.y>p.ground){p.y=p.ground;p.vy=-Math.abs(p.vy)*.45;}}
   else{if(!p.screen){Object.assign(p,project(p));p.screen=true;}const target=p.kind==='xp'?geometry.xp:targetPlayer,dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy);p.speed=Math.min(1100,p.speed+1800*dt);
    if(d<Math.max(9,p.speed*dt)){if(p===goldFlight){arrived(p.amount,time);goldFlight=null;}else if(p.kind!=='gold')pulse(p.kind);return false;}p.x+=dx/d*p.speed*dt;p.y+=dy/d*p.speed*dt;}
   const pos=p.screen?p:project(p);ctx.globalAlpha=p.kind==='gold'?1:Math.min(1,(REWARD_FEEDBACK.lifeMs-age)/150);if(p.kind==='xp'){ctx.fillStyle='#a76aff22';ctx.beginPath();ctx.arc(pos.x,pos.y,7,0,Math.PI*2);ctx.fill();}if(!['soul','heal'].includes(p.kind)||stamps[p.kind].complete&&stamps[p.kind].naturalWidth){const size=p.kind==='soul'?21:16;ctx.drawImage(stamps[p.kind],pos.x-size/2,pos.y-size/2,size,size);}return true;
  });ctx.globalAlpha=1;
  if(gain){gain.hidden=time>=gainUntil;if(gain.style)gain.style.opacity=String(Math.max(0,Math.min(1,(gainUntil-time)/400)));}
  xpDisplay.update(model.playersById[model.localPlayerId].progression,time,{pending:particles.some(p=>p.kind==='xp'),reset});
 }
 return Object.freeze({rebase(project){for(const p of particles)if(!p.screen){const q=project(p),dy=q.y-p.y;if(p.ground!==undefined)p.ground+=dy;if(p.originY!==undefined)p.originY+=dy;Object.assign(p,q);}},render,resize,wallet:()=>wallet.read(lastTime??0),xp:xpDisplay.read,resources:()=>({soulParticles:particles.filter(p=>p.kind==='soul').length,rewardParticles:particles.length,peakRewardParticles:peak}),clear:()=>{particles=[];clearGain();}});
}
