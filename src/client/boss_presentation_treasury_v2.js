// Original October 2026 Marcus / Gilded Vault Keeper visual reconstruction.
// Faithful to the preserved v2 GIFs, not the older Dungeon painter or a concept image.
// Presentation observes World-authoritative combat; it never selects damage or targets.
const TAU=Math.PI*2,INK='#0b0911',GOLD='#f7ba38',LIT='#ffdd69',LIGHT='#fff0ad',BRASS='#996019';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const mix=(a,b,t)=>a+(b-a)*t;
const smallHash=str=>{let k=2166136261;for(let i=0;i<String(str).length;i++)k=Math.imul(k^String(str).charCodeAt(i),16777619);return k>>>0;};
const seeded=(seed,n)=>{let v=(seed^Math.imul(n+1,0x9e3779b1))>>>0;v=Math.imul(v^(v>>>16),0x85ebca6b)>>>0;v=Math.imul(v^(v>>>13),0xc2b2ae35)>>>0;return((v^(v>>>16))>>>0)/4294967296;};
function circle(c,x,y,r,fill,stroke=null,lineWidth=1){c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.lineWidth=lineWidth;c.strokeStyle=stroke;c.stroke();}}
function ellipse(c,x,y,rx,ry,fill,stroke=null,lineWidth=1){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.lineWidth=lineWidth;c.strokeStyle=stroke;c.stroke();}}
function path(c,pts,fill,stroke=INK,width=2){c.beginPath();for(let i=0;i<pts.length;i++){if(i===0)c.moveTo(...pts[i]);else c.lineTo(...pts[i]);}c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.stroke();}}
function lines(c,pts,color,width=2){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
function arc(c,x,y,rad,start,end,color,width=2){c.beginPath();c.arc(x,y,rad,start,end);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function coin(c,x,y,scale=1,rotation=0,brightness=1){
 c.save();c.translate(x,y);c.rotate(rotation);c.scale(scale,scale);
 ellipse(c,0,1.4,7.9,5.1,'#56310e','#100b12',2.2);
 ellipse(c,-.3,-.2,7.7,4.9,brightness>=1?'#f0b637':'#b48127','#23121a',1.8);
 ellipse(c,-.5,-1.0,5.3,2.8,brightness>=1?'#ffe08a':'#c3a15e','#a36a19',.9);
 ellipse(c,-1.3,-2.0,3.4,.9,'#fff4b5');
 lines(c,[[-4,1],[-1,2.3],[4,1.5]],'#9d681d',.9);
 c.restore();
}
function coinStack(c,x,y,scale=1){coin(c,x,y,scale);coin(c,x-1,y-2.8*scale,scale);}
const marquee = boss=>boss?.bossDefinitionId==='marcus'||boss?.bossDefinitionId==='gilded_vault_keeper';
export const hasTreasuryBossPainter=id=>id==='marcus'||id==='gilded_vault_keeper';

function orbitPoints(actor,tick){
 const boss=actor.boss??{},r=smallHash(boss.bossId??'marcus')%1024,spin=tick*.0195+r*.0001;
 return Array.from({length:8},(_,i)=>{
  const theta=spin+i*TAU/8,depth=Math.sin(theta),x=Math.cos(theta)*84,y=-8+depth*22;
  return {i,x,y,theta,depth,brightness:depth>0?1:.82};
 });
}
function cloakedMarcus(c,t,flash){
 const bob=Math.sin(t*.055)*1.8;
 c.save();c.translate(0,bob);
 // Cross-legged shadow and violet robe: preserve the *hooded mage* silhouette.
 ellipse(c,0,10,45,11,'#0e0e17bd');
 path(c,[[-35,-10],[-49,5],[-34,9],[-15,8],[0,10],[18,8],[43,8],[52,4],[36,-15],[17,-25],[-24,-22]],'#2c183c','#090815',3.4);
 path(c,[[-47,4],[-25,-6],[-9,6],[-37,8]],'#50325e','#1a102b',1.8);
 path(c,[[47,4],[19,-6],[6,6],[37,8]],'#301b41','#160e26',2);
 // Left sleeve sways independently from right-side dark torso.
 const sway=Math.sin(t*.045)*1.7;
 path(c,[[-20,-52],[-29,-48],[-36,-16+sway],[-42,-2+sway],[-30,7],[-5,-4],[-8,-51]],'#52305f','#0c0818',2.6);
 path(c,[[8,-52],[26,-45],[34,-12],[25,5],[2,5],[-1,-35]],'#180f26','#080710',2.6);
 path(c,[[-17,-47],[-7,-30],[-5,8],[-12,5],[-19,-26]],'#6b4371',null);
 lines(c,[[-30,-22],[-36,-12],[-32,-7]],'#221332',1.5);
 lines(c,[[16,-35],[21,-13],[13,-4]],'#2c173c',1.5);
 // Hood ring: no halo above head (latest v2 decision).
 ellipse(c,0,-65,24,30,flash?'#fdf8e5':'#352044','#0c0714',3.2);
 path(c,[[-21,-66],[-17,-87],[-4,-96],[6,-94],[19,-78],[23,-63],[17,-44],[8,-38],[-15,-45]],flash?'#ffffff':'#40274d','#0d0917',2.4);
 ellipse(c,0,-65,14,20,'#09080f','#201327',1.6);
 ellipse(c,-5.8,-65,3.5,3.1,'#f36d51');ellipse(c,5.8,-65,3.5,3.1,'#f36d51');
 circle(c,-5.4,-65,1.5,'#ffb18e');circle(c,6,-65,1.5,'#ffb18e');
 // A single gold clasp under the face.
 circle(c,0,-41,5.1,'#f5b93f','#42280f',1.8);circle(c,-1,-43,2.1,'#fff4a2');
 c.restore();
}
function shield(c,x,y,t,r=54){
 c.save();c.translate(x,y);c.rotate(t*.006);
 for(let i=0;i<10;i++){
  const a=i*TAU/10,b=(i+.77)*TAU/10;
  c.strokeStyle=i%2?'#ffb42f':'#f5c45d';c.lineWidth=5.4;c.lineCap='butt';c.beginPath();c.arc(0,0,r,a,b);c.stroke();
  c.strokeStyle='#7f491e';c.lineWidth=1.15;c.beginPath();c.arc(0,0,r+4,a,b);c.stroke();
 }
 c.restore();
}
function ornateMarcShield(c,t,b){
 const active=Number(b?.shieldHp??0)>0;
 if(!active)return;
 c.save();ellipse(c,0,-31,53,53,'#f2a52a0c');shield(c,0,-31,t,55);
 for(let i=0;i<4;i++){const a=t*.027+i*TAU/4;circle(c,Math.cos(a)*53,-31+Math.sin(a)*53,1.7,'#ffe9ae');}
 c.restore();
}
function drawMarcusBody(c,actor,tick,flash){
 const boss=actor.boss??{},orbits=orbitPoints(actor,tick),shots=boss.coinShots??boss.coinsInFlight??[];
 c.save();c.translate(actor.position.x,actor.position.y);
 // Floating coins use full back/front depth, not a decorative flat ring or halo.
 const currentlyFired=Array.isArray(shots)?shots.length:0;
 for(const co of orbits.filter(x=>x.depth<0).slice(0,Math.max(0,8-currentlyFired)))coin(c,co.x,co.y,1.04,co.theta*.2,co.brightness);
 cloakedMarcus(c,tick,flash);
 for(const co of orbits.filter(x=>x.depth>=0).slice(0,Math.max(0,8-currentlyFired)))coin(c,co.x,co.y,1.04,co.theta*.2,co.brightness);
 ornateMarcShield(c,tick,boss);
 const a=boss.pendingAction;
 if(a?.ability==='coin_barrage'){
  const p=smooth((tick-a.startedTick)/(a.resolvesTick-a.startedTick));
  for(let i=0;i<8;i++){
   const angle=i*TAU/8+tick*.022;
   const r=84*(1-p)+17*p;
   coin(c,Math.cos(angle)*r,-8+Math.sin(angle)*22*(1-p),.78+p*.2,angle,.95);
  }
  c.strokeStyle='#f8bc44';c.lineWidth=1.4;c.globalAlpha=p*.85;
  for(let i=0;i<8;i++){let a=i*TAU/8;lines(c,[[Math.cos(a)*18,-8+Math.sin(a)*14],[Math.cos(a)*24,-8+Math.sin(a)*20]],'#efc05e',1.5);}
 }
 c.restore();return true;
}

function drawVaultBody(c,actor,tick,flash){
 const b=actor.boss??{},sway=Math.sin(tick*.04)*1.5;
 c.save();c.translate(actor.position.x,actor.position.y);
 ellipse(c,0,8,66,10,'#0b0b14b0');
 // Outline eight separated bars, thicker on the lit lower rim.
 const frame=[[0,-145],[57,-145],[86,-124],[88,-19],[54,8],[-53,8],[-89,-19],[-86,-124],[-57,-145]];
 c.lineWidth=9;c.strokeStyle='#0d101b';c.beginPath();frame.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.stroke();
 c.lineWidth=5;c.strokeStyle='#d89a30';c.beginPath();frame.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.stroke();
 for(const [x,y]of[[-86,-91],[86,-91],[-64,-142],[65,-142],[0,-145],[-83,-22],[83,-22]])circle(c,x,y,3,'#ffe6a2','#4a300d',1);
 // Crown floats above the lid with ruby crest.
 path(c,[[-28,-146],[-14,-134],[0,-160],[13,-136],[31,-146],[26,-124],[-23,-122]],flash?'#fffbe4':'#e5a637','#36211d',3);
 path(c,[[-24,-144],[-12,-137],[0,-156],[11,-136],[26,-144],[22,-131],[-21,-131]],'#ffde62',null);
 path(c,[[-5,-146],[2,-140],[5,-132],[-2,-129],[-9,-137]],'#e44e72','#57223b',1.7);
 // Wings: four bevelled triangles animate by one/two pixels, no feathery wings.
 const wing=Math.sin(tick*.055)*2;
 for(const side of[-1,1]){
  c.save();c.scale(side,1);
  path(c,[[41,-99],[54,-131-wing],[70,-72],[103,-64],[64,-52]],flash?'#fffbd7':'#dda33c','#201723',3.4);
  path(c,[[55,-123-wing],[69,-76],[88,-68],[62,-67]],'#f8cf65',null);
  path(c,[[68,-76],[101,-65],[72,-57]],'#ba7b25',null);
  c.restore();
 }
 // Claw arms and gold-bar fingers are separate animated hinges.
 for(const side of[-1,1]){
  c.save();c.scale(side,1);
  lines(c,[[38,-68],[53,-65],[60,-48],[57,-28]],'#271a22',13);
  lines(c,[[38,-68],[53,-65],[60,-48],[57,-28]],'#bc812e',8);
  circle(c,53,-64,8,'#e2b654','#2a1824',2.5);circle(c,55,-67,3,'#fdec9b');
  path(c,[[50,-35],[63,-35],[61,-18],[55,-11],[51,-24]],'#f2c052','#2a2225',2.8);
  path(c,[[58,-23],[68,-22],[65,-7],[59,-3]],'#d9a048','#2a2028',2.2);
  c.restore();
 }
 // Chest base: brown wood in 3 layers with metal bevels.
 path(c,[[-49,-80],[48,-81],[46,-20],[-48,-22]],flash?'#fff6ce':'#7e4b2e','#100c14',4);
 path(c,[[-47,-53],[46,-55],[45,-24],[-46,-25]],'#895c37','#261b21',2);
 path(c,[[-43,-51],[43,-52],[42,-44],[-42,-43]],'#af7b3e',null);
 lines(c,[[-43,-36],[40,-36]],'#442c27',2);
 // Mouth holds ruby, not simply a red diamond painted onto wood.
 path(c,[[-43,-101],[44,-108],[39,-54],[-40,-53]],'#1b0b18','#110b13',4);
 const glow=c.createRadialGradient(0,-78,2,0,-78,33);glow.addColorStop(0,'#a8365d');glow.addColorStop(.4,'#601329');glow.addColorStop(1,'#170913');
 path(c,[[-39,-96],[39,-101],[35,-56],[-36,-57]],glow,null);
 for(let i=0;i<5;i++){const x=-34+i*16;path(c,[[x,-97],[x+8,-97],[x+4,-84]],'#e9c566','#1a0f16',1.1);path(c,[[x,-57],[x+8,-57],[x+3,-67]],'#f3c26a','#170d17',1.1);}
 // Ruby is a multi-facet suspended gem with its own glow.
 const gemGlow=6+Math.sin(tick*.11)*2;
 circle(c,0,-78,gemGlow+8,'#e52f6859');
 path(c,[[0,-94],[8,-84],[8,-72],[0,-62],[-8,-72],[-8,-84]],'#c72e63','#641b3b',2.2);
 path(c,[[-6,-84],[0,-91],[4,-82],[0,-75]],'#ff78a2',null);
 path(c,[[0,-75],[7,-75],[0,-64]],'#efb656',null);
 // Hinged lid rises at right and slants just like the recovered GIF.
 c.save();c.translate(0,sway*.7);
 path(c,[[-50,-122],[32,-138],[51,-109],[42,-90],[-43,-88]],flash?'#fff8d9':'#9b623a','#170f19',4);
 path(c,[[-47,-117],[34,-130],[37,-115],[-42,-102]],'#a77547',null);
 path(c,[[-46,-104],[-38,-106],[-38,-87],[-48,-85]],'#f2c15f','#2d1b1e',1.9);
 path(c,[[36,-130],[45,-124],[45,-94],[38,-92]],'#ffcf69','#29202a',2);
 path(c,[[-8,-101],[10,-103],[8,-85],[-5,-84]],'#f8bd43','#28202b',2.7);circle(c,2,-93,3.2,'#24202b');
 c.restore();
 // Overflow coins: individually raised piles under the keeper, no generic loot icon.
 const fixed=[[0,4],[-22,1],[23,1],[-47,2],[47,3],[-8,-4],[10,-5],[-35,-4],[35,-5],[-53,8],[53,9],[0,11],[-20,13],[19,12],[-39,11],[39,12]];
 for(const [i,[x,y]]of fixed.entries())coin(c,x,y,(i%3===0?.98:.85),Math.sin(i*4.1)*.08,i%4===0?.9:1);
 if(Number(b.shieldHp??0)>0){shield(c,0,-76,tick,86);}
 // The pupil of the chest ruby brightens during Taxation.
 if(b.pendingAction?.ability==='taxation'){
  const p=smooth((tick-b.pendingAction.startedTick)/(b.pendingAction.resolvesTick-b.pendingAction.startedTick));
  circle(c,0,-80,6+p*10,'#f83d8780');
 }
 c.restore();return true;
}
export function drawTreasuryBossV2(c,actor,tick,flash=false){
 if(actor?.boss?.bossDefinitionId==='marcus')return drawMarcusBody(c,actor,tick,flash);
 if(actor?.boss?.bossDefinitionId==='gilded_vault_keeper')return drawVaultBody(c,actor,tick,flash);
 return false;
}

const projectiles=model=>Object.values(model?.entitiesById??{}).filter(a=>a.alive&&a.boss?.bossDefinitionId==='marcus').flatMap(a=>(a.boss.coinShots??[]).map(p=>({...p,bossId:a.boss.bossId})));
function ring(c,p,r,kind,tick,alpha=1){
 c.save();c.translate(p.x,p.y);c.globalAlpha=alpha;c.strokeStyle=kind==='violet'?'#aa70c9':'#f0b841';c.lineWidth=2.2;
 c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();
 for(let i=0;i<4;i++){const a=i*TAU/4+tick*.005;lines(c,[[Math.cos(a)*(r-7),Math.sin(a)*(r-7)],[Math.cos(a)*(r+1),Math.sin(a)*(r+1)]],kind==='violet'?'#c99ce2':'#f9d768',1.3);}
 c.restore();
}
function aim(a,b){let x=b.x-a.x,y=b.y-a.y,d=Math.hypot(x,y)||1;return {x:x/d,y:y/d,angle:Math.atan2(y,x)};}
export function drawTreasuryBossGroundV2(c,model,tick){
 const h=model.bossHazards??{};
 const all=Object.values(model.entitiesById??{});
 const actors=all.filter(a=>a.alive&&hasTreasuryBossPainter(a.boss?.bossDefinitionId));
 for(const boss of actors){
  const record=boss.boss;
  if(record.bossDefinitionId==='marcus'&&Number(record.shieldHp??0)>0)ellipse(c,boss.position.x,boss.position.y,61,22,'#d28b2213');
  if(record.bossDefinitionId==='gilded_vault_keeper'&&Number(record.shieldHp??0)>0)ellipse(c,boss.position.x,boss.position.y,94,32,'#ffc85413');
  const last=record.lastAction;
  if(record.bossDefinitionId==='marcus'&&last?.ability==='gold_rush'&&tick-last.resolvedTick<30){
   const a=aim(boss.position,last.targetPosition);c.save();c.globalAlpha=1-(tick-last.resolvedTick)/30;
   for(let i=0;i<3;i++){const p={x:boss.position.x+a.x*i*34,y:boss.position.y+a.y*i*34};ring(c,p,33,'gold',tick,.3+.2*i);}c.restore();
  }
 }
 for(const q of h.recoveredTelegraphs??[]){
  if(!hasTreasuryBossPainter(q.bossDefinitionId))continue;
  const live=actors.find(a=>a.boss.bossId===q.bossId);
  if(!live)continue;
  const duration=Math.max(1,q.resolvesTick-q.startedTick),p=smooth((tick-q.startedTick)/duration),target=q.position;
  if(q.ability==='gilded_lasso'){
   ring(c,target,37+(1-p)*9,'gold',tick,.55+p*.42);
   c.save();c.globalAlpha=p;const a=aim(live.position,target);
   lines(c,[[live.position.x,live.position.y-30],[target.x-a.x*14,target.y-a.y*14]],'#d7a545',2);c.restore();
  }else if(q.ability==='coin_barrage'){
   ring(c,live.position,27,'gold',tick,p*.6);
  }else if(q.ability==='gold_rush'){
   const a=aim(live.position,target);
   for(let i=1;i<=3;i++)ring(c,{x:live.position.x+a.x*i*55,y:live.position.y+a.y*i*55},42,'gold',tick,.2+.6*p);
  }else if(q.ability==='inversion'){
   ring(c,live.position,115+p*70,'violet',tick,.25+.62*p);
   c.save();c.globalAlpha=.35+p*.4;c.fillStyle='#7c46971a';c.beginPath();c.arc(live.position.x,live.position.y,115+p*70,0,TAU);c.fill();c.restore();
  }else if(q.ability==='vault_crush'){
   ring(c,target,72,'gold',tick,.4+p*.6);
   c.save();c.globalAlpha=p*.8;ellipse(c,target.x,target.y,73,73,'#e3ba4c18');c.restore();
  }else if(q.ability==='gold_fall'){
   for(let i=0;i<3;i++){let th=i*TAU/3,point={x:target.x+Math.cos(th)*62,y:target.y+Math.sin(th)*62};ring(c,point,23,'gold',tick,.4+p*.55);}
  }else if(q.ability==='taxation'){
   ring(c,live.position,87,'gold',tick,.3+p*.65);
   const a=aim(target,live.position);c.save();c.globalAlpha=p*.65;
   for(let i=0;i<4;i++){const dist=50+i*31;
    coin(c,target.x+a.x*dist,target.y+a.y*dist,0.6+i*.08,tick*.03+i*.6);
   }c.restore();
  }
 }
 // Existing authorized floor hazards. We only embellish; simulation owns damage.
 for(const p of h.recoveredPools??[]){
  if(!hasTreasuryBossPainter(p.bossDefinitionId))continue;
  const life=clamp(Math.min((tick-p.createdTick)/16,(p.expiresTick-tick)/25)),col=p.kind==='molten'?'#ff874d':'#eeb84a';
  if(life<=0)continue;
  c.save();c.globalAlpha=.85*life;
  ring(c,p.position,p.radius,'gold',tick,.55);
  if(p.kind==='molten'){
   ellipse(c,p.position.x,p.position.y,p.radius*.65,p.radius*.33,'#d7633759');
   for(let j=0;j<8;j++){const a=j*TAU/8+tick*.025;circle(c,p.position.x+Math.cos(a)*p.radius*.7,p.position.y+Math.sin(a)*p.radius*.36,2+j%2,'#ffa157');}
  }else if(p.kind==='gold')for(let j=0;j<4;j++)coin(c,p.position.x+Math.cos(j*TAU/4)*14,p.position.y+Math.sin(j*TAU/4)*8,.6);
  c.restore();
 }
}
export function treasuryBossDepthItems(model,tick,viewport=null){
 const actors=Object.values(model.entitiesById??{}).filter(a=>a.alive&&hasTreasuryBossPainter(a.boss?.bossDefinitionId));
 const out=[];
 for(const b of actors){
  if(b.boss.bossDefinitionId==='marcus'){
   for(const shot of b.boss.coinShots??[]){
    if(!shot?.position)continue;
    const p=shot.position;
    if(viewport&&(p.x<viewport.x-40||p.x>viewport.x+viewport.width+40||p.y<viewport.y-40||p.y>viewport.y+viewport.height+40))continue;
    out.push({id:'marcus-coin/'+shot.id,anchorX:p.x,anchorY:p.y,draw:ctx=>{
     ctx.save();ctx.globalAlpha=.45;
     lines(ctx,[[p.x-shot.velocity.x*3,p.y-shot.velocity.y*3],[p.x,p.y]],'#ffe9a5',3.4);
     ctx.globalAlpha=1;coin(ctx,p.x,p.y,1.05,Math.atan2(shot.velocity.y,shot.velocity.x));ctx.restore();
    }});
   }
  }
  if(b.boss.bossDefinitionId==='gilded_vault_keeper'){
   // Gold fallout remains anchored to projected confirmed encounters (not local timers).
   const last=b.boss.lastAction,age=tick-(last?.resolvedTick??-1e6);
   if(last?.ability==='gold_fall'&&age>=0&&age<30){
    for(let i=0;i<3;i++){
     const a=i*TAU/3,p={x:last.targetPosition.x+Math.cos(a)*62,y:last.targetPosition.y+Math.sin(a)*62};
     out.push({id:'goldfall/'+b.boss.bossId+'/'+i,anchorX:p.x,anchorY:p.y,draw:c=>{
      c.save();c.globalAlpha=1-age/30;
      for(let j=0;j<4;j++)coin(c,p.x+(j-1.5)*7,p.y-(30-age)*2+j*4,.55);
      c.restore();}});
    }
   }
  }
 }
 return out;
}
export function drawTreasuryBossHudV2(c,canvas,model){
 const b=Object.values(model.entitiesById??{}).find(a=>a.alive&&hasTreasuryBossPainter(a.boss?.bossDefinitionId));if(!b)return false;
 const shieldHp=Math.max(0,Number(b.boss.shieldHp??0)),shieldMax=Math.max(1,Number(b.boss.shieldMaxHp??0)),width=Math.min(430,canvas.width-28);
 c.save();let y=53;
 if(shieldHp>0){const x=(canvas.width-width)/2; c.fillStyle='#12111acc';c.fillRect(x,y,width,9);c.fillStyle='#e5a841';c.fillRect(x+2,y+2,(width-4)*clamp(shieldHp/shieldMax),5);c.strokeStyle='#e6c373';c.strokeRect(x+.5,y+.5,width-1,8);y+=13;}
 if(Number(b.boss.stolenGold??0)>0){c.font='bold 10px system-ui';c.textAlign='center';c.fillStyle='#f3d579';c.fillText('STOLEN GOLD  '+b.boss.stolenGold,canvas.width/2,y+10);}
 c.restore();return true;
}