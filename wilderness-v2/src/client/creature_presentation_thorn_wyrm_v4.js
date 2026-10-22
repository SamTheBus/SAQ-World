// Client-only green, five-segment Thorn Wyrm. Its short mouth aims the existing
// thorn shot while the body stays upright. World still owns the shot and hit.
const SCALE=.82,LINE=1.26/SCALE,INK='#11151a',TAU=Math.PI*2;
const NECK=5,HEAD=6.8,FRONT=(NECK+HEAD)*SCALE;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const p=clamp(x);return p*p*(3-2*p);};
const turn=x=>Math.atan2(Math.sin(x),Math.cos(x));
const color=(flash,hex)=>flash?'#fff':hex;

export function thornWyrmRangedPoseV4(actor,tick){
 const r=actor.ranged;if(!actor.alive||!r||r.phase==='idle')return null;
 const aim=r.aim??(r.targetPosition?{x:r.targetPosition.x-actor.position.x,y:r.targetPosition.y-actor.position.y}:{x:actor.presentationFacingX??1,y:0});
 const length=Math.hypot(aim.x,aim.y),direction=length>.001?{x:aim.x/length,y:aim.y/length}:{x:1,y:0};
 const p=clamp((tick-r.phaseStartedTick)/Math.max(1,r.phaseEndsTick-r.phaseStartedTick));
 const weight=r.phase==='windup'?smooth(p):1-smooth(p),size=actor.elite?.scale??1;
 // Match the unchanged hull + shot radius + one-pixel launch offset. A short,
 // smooth body motion supplies the reach; the mouth never stretches out.
 const muzzle=(actor.hullRadius??10)+6+1;
 const kick=r.phase==='recovery'?Math.sin(Math.PI*clamp((tick-r.phaseStartedTick)/4)):0;
 const travel=(muzzle-FRONT*size)*weight-3*Math.sin(Math.PI*weight)-2*kick;
 return {family:'thorn_wyrm',ranged:true,upright:true,preserveFacingFlip:true,
  phase:r.phase,progress:p,direction,artWeight:weight,charge:r.phase==='windup'?weight:0,
  release:r.phase==='recovery'?Math.max(0,1-(tick-r.phaseStartedTick)/3):0,recovery:r.phase==='recovery'?1-p:0,
  drawFacingX:actor.presentationFacingX===-1?1:-1,bodyPivot:{x:0,y:-10*SCALE*size},
  body:{x:direction.x*travel,y:direction.y*travel+(10*SCALE*size-8)*weight,rotation:0,scaleX:1,scaleY:1},
  limb:{extension:0,sweep:0,open:weight}};
}

export function thornWyrmMotionV4(m,time){
 const x=m.x+m.w/2,y=m.y+m.h/2+2,t=time/130;
 const a=m.rangedPose,weight=a?.artWeight??0,walk=m.motionBlend??0,step=m.stepPhase??0;
 const wave=i=>Math.sin(t-i*.8)*3*(1-weight*(i===0?1:.25))+Math.sin(step-i*.65)*walk*.6*(1-weight);
 const segments=Array.from({length:5},(_,i)=>({index:i,x:x+i*5.5,y:y+wave(i),radius:6.2-i*.7}));
 const root={x,y:y+wave(0)},target=a?Math.atan2(a.direction.y,a.direction.x*a.drawFacingX):Math.PI;
 const angle=Math.PI+turn(target-Math.PI)*weight,u={x:Math.cos(angle),y:Math.sin(angle)};
 const head={x:root.x+u.x*NECK,y:root.y+u.y*NECK,radius:HEAD,aim:u,angle,gape:weight};
 const muzzle={x:head.x+u.x*HEAD,y:head.y+u.y*HEAD};
 const legs=segments.map(s=>{
  const stride=Math.sin(t*2+s.index)*(1+walk*.65)*(1-weight*.65);
  return {root:{x:s.x,y:s.y+s.radius-1},knee:{x:s.x-2+stride*.3,y:s.y+6},foot:{x:s.x-3+stride,y:s.y+8+Math.cos(t*2+s.index)*.6}};
 });
 return {segments,root,head,muzzle,legs,weight};
}

function thorn(c,s,flash){
 const {x,y,radius:r}=s;
 c.beginPath();c.moveTo(x-1.5,y-r+.6);
 c.quadraticCurveTo(x-2.5,y-r-2.2,x+.4,y-r-5);
 c.quadraticCurveTo(x+3.4,y-r-3.2,x+1.6,y-r+.8);c.closePath();
 c.fillStyle=color(flash,'#1e8449');c.fill();
 if(!flash){
  c.fillStyle='#9cd46c';c.beginPath();c.moveTo(x+.4,y-r-5);
  c.quadraticCurveTo(x-1.6,y-r-2,x-.7,y-r+.5);c.lineTo(x+.3,y-r+.5);c.closePath();c.fill();
 }
 c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.moveTo(x-1.5,y-r+.6);
 c.quadraticCurveTo(x-2.5,y-r-2.2,x+.4,y-r-5);
 c.quadraticCurveTo(x+3.4,y-r-3.2,x+1.6,y-r+.8);c.closePath();c.stroke();
}
function segment(c,s,flash){
 const {x,y,radius:r}=s;c.fillStyle=color(flash,'#27ae60');
 c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
 if(!flash){
  c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();
  c.fillStyle='#167647';c.beginPath();c.moveTo(x+r*.45,y-r*.9);
  c.quadraticCurveTo(x+r*1.3,y+r*.7,x-r*.4,y+r*1.1);
  c.lineTo(x-r*.8,y+r*.4);c.quadraticCurveTo(x+r*.8,y+r*.6,x+r*.45,y-r*.9);c.closePath();c.fill();
  c.fillStyle='#63d982';c.beginPath();c.moveTo(x-r*.9,y-r*.05);
  c.quadraticCurveTo(x-r*.9,y-r*.95,x+r*.25,y-r*.9);
  c.lineTo(x+r*.1,y-r*.45);c.quadraticCurveTo(x-r*.5,y-r*.55,x-r*.9,y-r*.05);c.closePath();c.fill();c.restore();
 }
 c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();
}
function head(c,h,flash){
 const {x,y,aim:u}=h;
 c.beginPath();c.arc(x,y,HEAD,0,TAU);c.fillStyle=color(flash,'#2ecc71');c.fill();
 if(!flash){
  c.save();c.beginPath();c.arc(x,y,HEAD,0,TAU);c.clip();
  c.fillStyle='#188847';c.beginPath();c.moveTo(x+4,y-6);c.quadraticCurveTo(x+10,y+7,x-3,y+8);
  c.lineTo(x-5,y+3.8);c.quadraticCurveTo(x+5,y+5,x+4,y-6);c.closePath();c.fill();
  c.fillStyle='#7ae58c';c.beginPath();c.moveTo(x-6,y-1);c.quadraticCurveTo(x-5,y-7,x+1.5,y-6.5);
  c.lineTo(x,y-3.8);c.quadraticCurveTo(x-3,y-4.8,x-6,y-1);c.closePath();c.fill();c.restore();
 }
 c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.arc(x,y,HEAD,0,TAU);c.stroke();
 // The source leaf horn stays on top of the head through every aim direction.
 c.fillStyle=color(flash,'#2ecc71');c.beginPath();c.moveTo(x-2,y-5);
 c.quadraticCurveTo(x-7,y-10,x-9,y-9);c.quadraticCurveTo(x-6,y-3.5,x-1,y-4);
 c.closePath();c.fill();c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();
 if(flash)return;
 const eye={x:x+u.x*2.2,y:y-1.6+u.y*.25};
 c.fillStyle=INK;c.beginPath();c.ellipse(eye.x,eye.y,1.1,1.4,0,0,TAU);c.fill();
 c.fillStyle='#fff7df';c.beginPath();c.arc(eye.x-.25,eye.y-.45,.34,0,TAU);c.fill();
 c.save();c.translate(x+u.x*5.65,y+u.y*5.65);c.rotate(h.angle);
 c.fillStyle='#123b21';c.beginPath();c.ellipse(0,0,1.15,.45+h.gape*1.85,0,0,TAU);c.fill();
 c.strokeStyle=INK;c.lineWidth=.75;c.stroke();
 c.globalAlpha*=h.gape;c.fillStyle='#b9dc83';c.beginPath();c.moveTo(.9,0);c.lineTo(-.65,-.8);c.lineTo(-.65,.8);c.closePath();c.fill();c.restore();
}

export function drawThornWyrmV4(c,m,time,seed){
 const q=thornWyrmMotionV4(m,time),flash=m.flashTimer>0;
 c.save();c.lineCap='round';c.lineJoin='round';
 for(const leg of q.legs){
  c.beginPath();c.moveTo(leg.root.x,leg.root.y);c.lineTo(leg.knee.x,leg.knee.y);c.lineTo(leg.foot.x,leg.foot.y);
  c.strokeStyle=INK;c.lineWidth=LINE+1;c.stroke();c.strokeStyle=color(flash,'#426b37');c.lineWidth=1;c.stroke();
 }
 for(const s of q.segments.slice().reverse()){thorn(c,s,flash);segment(c,s,flash);}
 // A short green neck keeps the turning head physically joined to segment one.
 c.beginPath();c.moveTo(q.root.x,q.root.y);c.lineTo(q.head.x,q.head.y);
 c.strokeStyle=INK;c.lineWidth=8.4+LINE;c.stroke();c.strokeStyle=color(flash,'#27ae60');c.lineWidth=8.4;c.stroke();
 head(c,q.head,flash);c.restore();
}
