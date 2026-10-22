import {drawArachnidTreantGroundD12_5A} from './boss_presentation_d12_5.js';

// Disposable presentation records preserve an observed impact when authority's
// single lastAction slot advances to a quick follow-up. They are never saved.
const TAU=Math.PI*2,INK='#11151a',CYAN='#65e6ec',PALE='#d2fff3',AMBER='#ffc77b';
const BARK='#71503a',LIGHT_BARK='#a8784d',DARK_BARK='#433025',LEAF='#8ab75c',GREEN='#a0ed75';
const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
const lerp=(a,b,p)=>a+(b-a)*p;
const bossTypes=new Set(['aegis_goliath','arachnid_treant']);
const impactTypes=new Set(['magnetic_pull','shield_bash','slam','root_snare']);
const actors=model=>Object.entries(model.entitiesById??{}).filter(([,a])=>a.alive!==false&&bossTypes.has(a.boss?.bossDefinitionId)).slice(0,4);
const identity=(id,a)=>a.boss.bossId??a.entityId??id;
function currentImpacts(model,tick){
 const rows=[];
 for(const[id,a]of actors(model)){
  const b=a.boss,last=b.lastAction,age=tick-(last?.resolvedTick??-999);
  if(!last||!impactTypes.has(last.ability)||age<0||age>=42)continue;
  rows.push({id:identity(id,a)+'/'+last.ability+'/'+last.resolvedTick,bossId:identity(id,a),bossDefinitionId:b.bossDefinitionId,ability:last.ability,resolvedTick:last.resolvedTick,position:{...last.targetPosition},angle:b.shieldAngle??Math.PI/2});
 }
 return rows;
}
export function createBossPolishPresentation(){
 const retained=new Map(),warnings=new Map();let context=null,lastTick=-1;
 const clear=()=>{retained.clear();warnings.clear();context=null;lastTick=-1;};
 function update(model){
  const tick=model.tick,key=[model.context?.campaignId,model.context?.sessionId,model.context?.spaceInstanceId??model.space?.spaceId,model.context?.spaceRevision,model.context?.residencyRevision].join('/');
  if(context!==key||tick<lastTick){retained.clear();warnings.clear();}context=key;lastTick=tick;
  const live=new Set(actors(model).map(([id,a])=>identity(id,a)));
  for(const row of model.bossHazards?.aegisTelegraphs??[])if(live.has(row.bossId))warnings.set(row.bossId,{ability:row.ability,angle:row.angle,resolvesTick:row.resolvesTick});
  for(const row of currentImpacts(model,tick)){
   if(retained.has(row.id))continue;
   const warning=warnings.get(row.bossId);
   if(warning?.ability===row.ability&&warning.resolvesTick===row.resolvedTick)row.angle=warning.angle;
   retained.set(row.id,Object.freeze({...row,position:Object.freeze(row.position)}));
  }
  for(const[id,row]of retained)if(!live.has(row.bossId)||tick-row.resolvedTick>=42||tick<row.resolvedTick)retained.delete(id);
  for(const[id,row]of warnings)if(!live.has(id)||tick-row.resolvesTick>=42)warnings.delete(id);
  const counts=new Map();
  for(const[id,row]of [...retained].sort(([,a],[,b])=>b.resolvedTick-a.resolvedTick||a.id.localeCompare(b.id))){const count=counts.get(row.bossId)??0;if(count>=2)retained.delete(id);else counts.set(row.bossId,count+1);}
  return Object.freeze({...model,bossHazards:Object.freeze({...model.bossHazards,polishImpacts:Object.freeze([...retained.values()])})});
 }
 return Object.freeze({update,clear,inspect:()=>({retained:retained.size,warnings:warnings.size,lastTick})});
}
function impacts(model,tick){return model.bossHazards?.polishImpacts??currentImpacts(model,tick);}
function poly(c,p,fill,edge=INK,width=1.26){c.beginPath();c.moveTo(...p[0]);for(const v of p.slice(1))c.lineTo(...v);c.closePath();c.fillStyle=fill;c.fill();if(edge){c.strokeStyle=edge;c.lineWidth=width;c.lineJoin='round';c.stroke();}}
function stroke(c,pts,color,width){c.beginPath();c.moveTo(...pts[0]);for(const p of pts.slice(1))c.lineTo(...p);c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke();}
function circle(c,p,r,color,width=1.3){c.beginPath();c.arc(p.x,p.y,r,0,TAU);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function circleClip(c,r){c.beginPath();c.arc(0,0,r,0,TAU);c.clip();}
function brokenRim(c,r,color,width=1.7){
 c.strokeStyle=color;c.lineWidth=width;
 for(let i=0;i<7;i++){const a=i*TAU/7+.035;c.beginPath();c.arc(0,0,r,a,a+TAU/7-.15-(i%2)*.05);c.stroke();}
}
function aegisWarning(c,h,tick){
 const q=clamp((tick-h.startedTick)/Math.max(1,h.resolvesTick-h.startedTick));
 c.save();c.translate(h.position.x,h.position.y);
 if(h.ability==='magnetic_pull'){
  // Only the inner rim marks damage. Cyan particles farther out show suction.
  c.fillStyle='#339bab14';c.beginPath();c.arc(0,0,70,0,TAU);c.fill();
  brokenRim(c,70,INK,3.7);brokenRim(c,70,q>.86?'#ffe6a5':AMBER,1.7);
  for(let i=0;i<8;i++){
   const a=i*TAU/8+.15,flow=((tick-h.startedTick+i*7)%48)/48,r=212-flow*142;
   c.save();c.rotate(a);c.globalAlpha=(.15+.5*q)*Math.sin(flow*Math.PI);
   c.beginPath();c.moveTo(r+8,-4);c.quadraticCurveTo(r-10,-5,r-19,0);c.quadraticCurveTo(r-6,5,r+8,4);c.lineTo(r,0);c.closePath();c.fillStyle=CYAN;c.fill();
   c.globalAlpha=.3+q*.55;poly(c,[[63,-2],[68,-4],[71,0],[68,4],[63,2],[66,0]],i/8<q?PALE:CYAN,INK,.9);c.restore();
  }
  // Two short curved flux lines curl into the core instead of a large UI dial.
  for(let i=0;i<3;i++){
   const a=i*TAU/3+tick*.025;c.save();c.rotate(a);c.globalAlpha=.25+q*.4;c.strokeStyle=CYAN;c.lineWidth=1.5;
   c.beginPath();c.moveTo(10,-5);c.bezierCurveTo(28,-20,52,-15,57,0);c.stroke();c.restore();
  }
 }else if(h.ability==='shield_bash'){
  c.rotate(h.angle);c.beginPath();c.moveTo(0,0);c.arc(0,0,64,-.5,.5);c.closePath();c.fillStyle='#f7b96624';c.fill();c.strokeStyle=AMBER;c.lineWidth=1.5;c.stroke();
  for(let i=0;i<3;i++){const r=27+i*12;c.globalAlpha=.3+q*.6;stroke(c,[[r-5,-8],[r+4,0],[r-5,8]],i/3<q?PALE:CYAN,2.3);}
  c.globalAlpha=.4+q*.6;c.beginPath();c.arc(0,0,64,-.5,.5);c.strokeStyle=AMBER;c.lineWidth=3;c.stroke();
 }else{
  // The two launch glyphs agree with the actual projectile bearings.
  for(const offset of[-.25,.25]){
   c.save();c.rotate(h.angle+offset);const x=43+q*7;
   poly(c,[[x-5,-5],[x+4,-5],[x+8,0],[x+4,5],[x-5,5],[x-7,0]],'#234455',CYAN);
   stroke(c,[[x-2,-3],[x+3,0],[x-2,3]],PALE,1.3);c.restore();
  }
 }c.restore();
}
function groundRoots(c,r,growth,light){
 for(let i=0;i<7;i++){
  const a=i*TAU/7+.13,s=i%2?1:-1;c.save();c.rotate(a);
  const end=(r-8)*growth;
  const p=[[5,0],[end*.4,s*4],[end*.72,-s*3],[end,0]];
  stroke(c,p,DARK_BARK,4.5);stroke(c,p,light,1.35);
  if(growth>.35){const d=end*.64;stroke(c,[[d,-s*2],[d+5,s*8],[d+14,s*12]],DARK_BARK,2.5);stroke(c,[[d,-s*2],[d+5,s*8],[d+14,s*12]],light,.8);}
  c.restore();
 }
}
function treantWarning(c,row,tick){
 const q=clamp((tick-row.startedTick)/Math.max(1,row.resolvesTick-row.startedTick)),snare=row.ability==='root_snare',r=row.radius??(snare?75:64);
 c.save();c.translate(row.position.x,row.position.y);
 c.fillStyle=snare?'#568c3826':'#bd80351f';c.beginPath();c.arc(0,0,r,0,TAU);c.fill();
 c.save();circleClip(c,r-2);groundRoots(c,r,ease(q),snare?'#9cd77c':'#d9a266');
 // Root tips push up within the footprint as the plant gathers its strike.
 for(let i=0;i<5;i++){
  const a=i*TAU/5+.4,d=19+26*q,x=Math.cos(a)*d,y=Math.sin(a)*d;
  c.globalAlpha=.25+q*.55;poly(c,[[x-5,y+1],[x-3,y-3*q],[x+1,y-5*q],[x+5,y],[x+1,y+3]],DARK_BARK,null);
  stroke(c,[[x-3,y],[x,y-3*q],[x+3,y]],snare?GREEN:AMBER,1);
 }
 c.restore();brokenRim(c,r,INK,3.4);brokenRim(c,r,snare?(q>.85?'#d6ffb5':GREEN):(q>.85?'#ffe0a3':AMBER),1.7+q*.45);
 // A small seed-shaped pulse makes the center read as a growing plant.
 const p=ease(q);poly(c,[[-4,-2],[-2,-6-2*p],[2,-4],[5,0],[2,4],[-2,3]],snare?GREEN:AMBER,INK,.9);
 c.restore();
}
function rootVine(c,row,angle,amount,growth){
 const rx=row.geometry.radiusX,ry=row.geometry.radiusY;
 c.save();c.translate(row.position.x,row.position.y);c.globalAlpha*=amount;
 const points=[];for(let i=0;i<=8;i++){const q=i/8*growth;points.push([Math.cos(angle)*rx*q+Math.sin(q*Math.PI*3+angle)*3*q,Math.sin(angle)*ry*q]);}
 stroke(c,points,DARK_BARK,4);stroke(c,points,LIGHT_BARK,1.6);
 if(growth>.4)for(let i=3;i<8;i+=3){const p=points[i],side=i%2?1:-1;poly(c,[[p[0],p[1]],[p[0]+side*6,p[1]-3],[p[0]+side*8,p[1]+1],[p[0]+side*3,p[1]+3]],LEAF,INK,.8);}
 c.restore();
}
function impactGround(c,row,tick){
 const age=tick-row.resolvedTick;if(age<0||age>=42)return;
 const magnetic=row.ability==='magnetic_pull',bash=row.ability==='shield_bash',snare=row.ability==='root_snare',r=magnetic?70:snare?75:64;
 const fade=1-ease((age-12)/30),growth=ease(age/8);
 c.save();c.translate(row.position.x,row.position.y);c.globalAlpha*=fade;
 if(bash){
  c.rotate(row.angle);c.beginPath();c.moveTo(0,0);c.arc(0,0,64,-.5,.5);c.closePath();c.clip();
  c.globalAlpha*=1-ease(age/20);stroke(c,[[21,0],[39,-3],[61,0]],'#d4ece54a',12);stroke(c,[[21,0],[39,-3],[61,0]],CYAN,2.4);c.restore();return;
 }
 circleClip(c,r);
 c.fillStyle=magnetic?'#2559692b':snare?'#578d3d2c':'#51352445';c.beginPath();c.arc(0,0,r-4,0,TAU);c.fill();
 if(magnetic){
  for(let i=0;i<8;i++){
   const a=i*TAU/8+.1;c.save();c.rotate(a);stroke(c,[[6,0],[25,-4],[42,2],[62,-1]],'#263b46',4.5);stroke(c,[[6,0],[25,-4],[42,2],[62,-1]],'#75cbd9',1.2);c.restore();
  }
 }else groundRoots(c,r,growth,snare?GREEN:'#ba956a');
 // An impact pressure wave expands once and fades quickly. The aftermath stays.
 const wave=clamp(age/15);c.globalAlpha*=1-ease(age/23);circle(c,{x:0,y:0},8+(r-8)*ease(wave),magnetic?PALE:snare?'#ceffa1':'#d3ac77',3.2*(1-wave)+1);
 c.restore();
}
export function drawBossPolishGround(c,model,tick){
 c.save();
 for(const h of (model.bossHazards?.aegisTelegraphs??[]).slice(0,4))aegisWarning(c,h,tick);
 for(const h of (model.bossHazards?.telegraphs??[]).slice(0,4))treantWarning(c,h,tick);
 // Keep the existing silk web exactly; only its botanical roots are new.
 drawArachnidTreantGroundD12_5A(c,{...model,bossHazards:{...model.bossHazards,telegraphs:[]}},tick);
 for(const web of (model.bossHazards?.webs??[]).slice(0,8)){
  const growth=ease(web.ageTicks/18),fade=Math.min(1,web.remainingTicks/24);
  c.save();c.beginPath();c.ellipse(web.position.x,web.position.y,web.geometry.radiusX,web.geometry.radiusY,0,0,TAU);c.clip();
  for(let i=0;i<5;i++)rootVine(c,web,i*TAU/5,.75*fade*growth,growth);c.restore();
 }
 for(const row of impacts(model,tick).slice(0,8))impactGround(c,row,tick);
 c.restore();
}
function rootSpear(c,p,height,lean,opacity){
 if(height<.3||opacity<=0)return;
 c.save();c.translate(p.x,p.y);c.globalAlpha*=opacity;
 // Curved, asymmetrical bark with a broad light facet and a forked root tip.
 c.beginPath();c.moveTo(-7,1);c.bezierCurveTo(-10,-height*.24,lean-9,-height*.64,lean,-height);
 c.quadraticCurveTo(lean-1,-height*.73,lean+2,-height*.65);c.lineTo(lean+7,-height*.76);
 c.quadraticCurveTo(lean+2,-height*.42,8,0);c.closePath();c.fillStyle=BARK;c.fill();c.strokeStyle=INK;c.lineWidth=1.26;c.lineJoin='round';c.stroke();
 poly(c,[[-7,0],[-5,-height*.29],[lean,-height],[lean-2,-height*.48],[0,0]],LIGHT_BARK,null);
 poly(c,[[1,-height*.36],[6,-height*.25],[8,0],[1,0]],DARK_BARK,null);
 if(height>13){poly(c,[[lean*.5,-height*.53],[lean*.5-8,-height*.61],[lean*.5-11,-height*.51],[lean*.5-3,-height*.44]],LEAF,INK,.85);stroke(c,[[lean*.5-2,-height*.5],[lean*.5-7,-height*.54]],'#d2e494',.8);}
 c.restore();
}
function flyingLeaf(c,contact,lift,index,age,life){
 const q=clamp(age/life);c.save();c.translate(contact.x,contact.y-lift);c.rotate(index*2.4+q*3.1);c.globalAlpha*=Math.min(1,age/3)*(1-ease((age-life*.65)/(life*.35)));
 poly(c,[[-5,0],[-1,-3],[6,0],[2,4]],index%2?LEAF:'#c6d57c',INK,.85);stroke(c,[[-3,0],[3,0]],'#53723c',.8);c.restore();
}
function chip(c,contact,lift,angle,size,color,light,fade){
 c.save();c.translate(contact.x,contact.y-lift);c.rotate(angle);c.globalAlpha*=fade;
 poly(c,[[-size,-size*.35],[-size*.2,-size],[size,-size*.3],[size*.65,size],[-size*.7,size*.75]],color,INK,1);
 poly(c,[[-size,-size*.35],[-size*.2,-size],[size,-size*.3],[-size*.1,0]],light,null);c.restore();
}
export function bossPolishDepthItems(model,tick,viewport=null){
 const items=[];
 const visible=p=>!viewport||(p.x>=viewport.x-60&&p.x<=viewport.x+viewport.width+60&&p.y>=viewport.y-40&&p.y<=viewport.y+viewport.height+100);
 const add=(id,p,draw)=>{if(visible(p))items.push(Object.freeze({id:'boss-polish/'+id,anchorX:p.x,anchorY:p.y+3,draw}));};
 for(const row of impacts(model,tick).slice(0,8)){
  const age=tick-row.resolvedTick;if(age<0||age>=42)continue;
  const center=row.position,magnetic=row.ability==='magnetic_pull',bash=row.ability==='shield_bash',snare=row.ability==='root_snare';
  if(bash){
   if(age>=19)continue;
   const angle=row.angle,p={x:center.x+Math.cos(angle)*51,y:center.y+Math.sin(angle)*51};
   add(row.id+'/bash',p,c=>{
    const q=clamp(age/19),rise=ease(age/3);c.save();c.translate(p.x,p.y-18);c.rotate(angle);c.globalAlpha*=rise*(1-ease((age-4)/15));
    c.beginPath();c.moveTo(-7,-23);c.quadraticCurveTo(18,0,-7,23);c.lineTo(1,9);c.quadraticCurveTo(8,0,1,-9);c.closePath();c.fillStyle=CYAN;c.fill();c.strokeStyle=INK;c.lineWidth=1.26;c.stroke();stroke(c,[[-1,-15],[7,0],[-1,15]],PALE,2);c.restore();
   });
   for(let i=0;i<3;i++){
    const a=angle+(i-1)*.28,q=age/19,p={x:center.x+Math.cos(a)*(42+q*20),y:center.y+Math.sin(a)*(42+q*20)};
    add(row.id+'/bash-spark/'+i,p,c=>{c.save();c.translate(p.x,p.y-15-Math.sin(q*Math.PI)*7);c.rotate(a);c.globalAlpha*=1-ease(q);poly(c,[[-4,0],[0,-2],[7,0],[0,2]],i%2?AMBER:PALE,null);c.restore();});
   }
   continue;
  }
  if(!magnetic){
   const reach=snare?48:40;
   for(let i=0;i<6;i++){
    const a=i*TAU/6+.25,delay=i%3*1.1,local=age-delay,rise=ease(local/6),fade=1-ease((local-17)/23),contact={x:center.x+Math.cos(a)*reach,y:center.y+Math.sin(a)*reach};
    if(local<0)continue;
    add(row.id+'/root/'+i,contact,c=>rootSpear(c,contact,((snare?32:24)+i%3*6)*rise*fade,Math.cos(a)*9,fade));
   }
  }
  // Distinct weight: Aegis throws faceted stone charged with cyan flux;
  // Treant throws soil and bark, followed by slower, lighter falling leaves.
  const life=magnetic?33:31;
  if(age<life)for(let i=0;i<7;i++){
   const q=age/life,a=i*TAU/7+.2,r=(magnetic?28:8)+q*(magnetic?27+i%3*6:35+i%3*8),contact={x:center.x+Math.cos(a)*r,y:center.y+Math.sin(a)*r},lift=Math.sin(q*Math.PI)*((magnetic?29:21)+i%3*5);
   add(row.id+'/debris/'+i,contact,c=>chip(c,contact,lift,a+q*(i%2?2.7:-2.7),3+i%3*.8,magnetic?'#38566a':DARK_BARK,magnetic?(i%3?CYAN:'#728998'):LIGHT_BARK,Math.min(1,age/2)*(1-ease((age-life*.6)/(life*.4)))));
  }
  if(!magnetic)for(let i=0;i<6;i++){
   const q=age/42,a=i*2.4,contact={x:center.x+Math.cos(a)*(8+q*43),y:center.y+Math.sin(a)*(8+q*32)},lift=Math.sin(q*Math.PI)*(19+i%3*8);
   add(row.id+'/leaf/'+i,contact,c=>flyingLeaf(c,contact,lift,i,age,42));
  }
 }
 for(const[id,a]of Object.entries(model.entitiesById??{}).filter(([,a])=>a.alive&&a.aegisMimic?.stage==='recalling').slice(0,12)){
  const m=a.aegisMimic;if(!m.bossPosition)continue;
  const from={x:a.position.x,y:a.position.y-24},to={x:m.bossPosition.x,y:m.bossPosition.y-34};
  for(let i=0;i<3;i++){
   const q=((tick-(m.stageStartedTick??0)+i*13)%39)/39,p={x:lerp(from.x,to.x,q),y:lerp(from.y,to.y,q)-7*Math.sin(q*Math.PI)};
   add('recall/'+(a.entityId??id)+'/'+i,{x:p.x,y:p.y+24},c=>{c.save();c.translate(p.x,p.y);c.globalAlpha*=Math.sin(q*Math.PI);poly(c,[[-2.6,0],[0,-4],[2.6,0],[0,4]],i%2?AMBER:PALE,null);c.restore();});
  }
 }
 return Object.freeze(items);
}
export function drawAegisProjectileTrails(c,model,tick){
 c.save();for(const p of (model.bossHazards?.aegisProjectiles??[]).slice(0,16)){
  const speed=Math.hypot(p.velocity.x,p.velocity.y);if(!Number.isFinite(speed)||speed<.001)continue;
  const dx=p.velocity.x/speed,dy=p.velocity.y/speed,nx=-dy,ny=dx,tip={x:p.position.x,y:p.position.y-18},length=14+Math.min(speed,5.5)*3;
  const tail={x:tip.x-dx*length,y:tip.y-dy*length};
  poly(c,[[tip.x+nx*5,tip.y+ny*5],[tail.x+nx,tail.y+ny],[tail.x-dx*5,tail.y-dy*5],[tip.x-nx*5,tip.y-ny*5]],'#51cad34d',null);
  stroke(c,[[tail.x,tail.y],[tip.x,tip.y]],'#62e4e7a3',2);
  for(let i=0;i<2;i++){const q=((tick-(p.firedTick??0)+i*7)%16)/16,x=tip.x-dx*length*q+nx*(i?4:-4),y=tip.y-dy*length*q+ny*(i?4:-4);c.save();c.globalAlpha*=1-q;poly(c,[[x-1,y],[x,y-2],[x+1,y],[x,y+2]],PALE,null);c.restore();}
 }c.restore();
}
