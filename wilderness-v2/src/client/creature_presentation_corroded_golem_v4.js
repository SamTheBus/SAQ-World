import {uprightAttackFrame} from './upright_attack_frame.js';
const SCALE=.7,LINE=1.26/SCALE,INK='#11151a',TAU=Math.PI*2,FRONT=7.2;
const clamp=v=>Math.max(0,Math.min(1,v)),mix=(a,b,t)=>a+(b-a)*t;
const color=(flash,hex)=>flash?'#fff':hex;
export function corrodedGolemMeleePoseV4(actor,tick){
 const phase=actor.meleePhase,g=actor.meleeGeometry;
 if(actor.enemyFamily!=='corroded_golem'||!actor.alive||!g||!phase||phase.phase==='idle')return null;
 const dx=g.targetPosition?g.targetPosition.x-actor.position.x:actor.presentationFacingX??1,dy=g.targetPosition?g.targetPosition.y-actor.position.y:0,d=Math.hypot(dx,dy);
 const direction=d>.001?{x:dx/d,y:dy/d}:{x:1,y:0},sourceRadius=g.sourceRadius,targetRadius=g.targetRadius;
 const centerLimit=g.mode==='clearHullGap'?g.reach+sourceRadius+targetRadius:g.reach,weaponReach=Math.max(sourceRadius,centerLimit-targetRadius),contactReach=Math.max(sourceRadius,Math.min(weaponReach,d-targetRadius));
 const p=clamp((tick-phase.phaseStartedTick)/Math.max(1,phase.phaseEndsTick-phase.phaseStartedTick)),size=actor.elite?.scale??1;
 const frame=uprightAttackFrame({front:Math.max(6*size,contactReach-4),recoil:2,lift:-1,lean:-.08,hitLean:.06,squeezeX:1,squeezeY:1,hitX:1,hitY:1},phase.phase,p,direction,contactReach);
 return {family:'corroded_golem',phase:phase.phase,progress:p,direction,sourceRadius,targetRadius,centerLimit,weaponReach,contactReach,...frame,
  upright:true,bodyPivot:{x:0,y:-9*size},drawFacingX:actor.presentationFacingX===-1?-1:1,corrodedScale:size};
}
function bodyLocalPoint(a,point){
 const b=a.body,p=a.bodyPivot,co=Math.cos(b.rotation),si=Math.sin(b.rotation),dx=point.x-b.x-p.x,dy=point.y-b.y-p.y,size=a.corrodedScale;
 return {x:((co*dx+si*dy)/b.scaleX+p.x)*a.drawFacingX/(SCALE*size),y:((-si*dx+co*dy)/b.scaleY+p.y)/(SCALE*size)};
}
export function corrodedGolemMotionV4(m,time,seed=0){
 const a=m.familyAttack,weight=a?.artWeight??0,strike=a?.strikeBlend??0,x=m.x+m.w/2,y=m.y+m.h/2+Math.sin(time/130)*2*(1-weight);
 const hands=[-1,1].map(side=>{
  const rest={x:x+side*23,y:y+13+Math.sin(time/210+side)*.7*(1-weight)},idleAngle=side*.1;
  if(!a)return {...rest,side,angle:idleAngle};
  const d=a.direction,n={x:-d.y,y:d.x},size=a.corrodedScale;
  const brace={x:d.x*(-2*size)+n.x*side*9*size,y:d.y*(-2*size)+n.y*side*9*size-10*size};
  const near=a.contactReach-FRONT*SCALE*size,hit={x:d.x*near+n.x*side*5*size,y:d.y*near+n.y*side*5*size-8};
  const goal=bodyLocalPoint(a,{x:mix(brace.x,hit.x,strike),y:mix(brace.y,hit.y,strike)});
  const co=Math.cos(a.body.rotation),si=Math.sin(a.body.rotation),u={x:(co*d.x+si*d.y)*a.drawFacingX,y:-si*d.x+co*d.y};
  const targetAngle=Math.atan2(u.y,u.x),delta=Math.atan2(Math.sin(targetAngle-idleAngle),Math.cos(targetAngle-idleAngle));
  return {x:mix(rest.x,goal.x,weight),y:mix(rest.y,goal.y,weight),side,angle:idleAngle+delta*weight};
 });
 return {x,y,hands,weight,strike,pulse:.85+Math.sin(time/220+(seed%11))*.15};
}
function polygon(c,points,fill,outline=true){
 c.fillStyle=fill;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fill();
 if(outline){c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();}
}
function joint(c,q,h,flash){
 const x=q.x+h.side*17,y=q.y-5;
 c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+h.side*6,h.y-2,h.x,h.y);
 c.strokeStyle=INK;c.lineWidth=3.6;c.stroke();
 c.strokeStyle=color(flash,'#6de99a');c.lineWidth=1.55;c.stroke();
 if(!flash){c.fillStyle='#b4ffbc';c.beginPath();c.arc(x,y,1.8,0,TAU);c.fill();}
}
function gauntlet(c,h,flash){
 c.save();c.translate(h.x,h.y);c.rotate(h.angle);
 polygon(c,[[-7.2,-4.5],[-4.6,-6.7],[5.5,-6.7],[7.2,-4.5],[7.2,4.5],[4.8,6.4],[-6,6.4],[-7.2,3.6]],color(flash,h.side<0?'#4d7062':'#5e7d6b'));
 if(!flash){
  polygon(c,[[-5.5,-4.1],[-3.6,-5.3],[3.4,-5.3],[2.5,-2],[-5.5,-1.1]],'#94aa8b',false);
  polygon(c,[[3,-5.5],[6,-4.2],[6,4.7],[3,5.5]],'#2b4841',false);
  polygon(c,[[-6.2,1.4],[-3.2,.2],[-2,2.3],[.4,2.1],[1.5,5],[-5.2,5]],'#b96f45',false);
  c.strokeStyle=INK;c.lineWidth=.8;c.beginPath();c.moveTo(3.8,-2);c.lineTo(6,-2);c.moveTo(3.8,1.8);c.lineTo(6,1.8);c.stroke();
  c.strokeStyle='#7cf0a1';c.lineWidth=1.1;c.beginPath();c.moveTo(-4,-2);c.lineTo(-1.3,.6);c.lineTo(.2,-.7);c.stroke();
 }
 c.restore();
}
function shoulder(c,x,y,side,flash){
 c.save();c.translate(x,y);c.scale(side,1);
 polygon(c,[[11,-11],[18,-13],[24,-9],[24,-2],[19,2],[12,-1]],color(flash,'#557969'));
 if(!flash){
  polygon(c,[[12,-10],[17,-11],[21,-8],[18,-6],[12,-7]],'#8ba38a',false);
  polygon(c,[[20,-5],[23,-7],[23,-2],[19,1],[16,-1]],'#b36c45',false);
 }
 c.restore();
}
export function drawCorrodedGolemV4(c,m,time,seed){
 const q=corrodedGolemMotionV4(m,time,seed),{x,y}=q,flash=m.flashTimer>0;
 c.save();c.lineJoin='round';c.lineCap='round';
 for(const h of q.hands)joint(c,q,h,flash);
 shoulder(c,x,y,-1,flash);shoulder(c,x,y,1,flash);
 // A broad chipped chassis retains the green lightning-shaped chest seam.
 polygon(c,[[x-15,y-12],[x+12,y-12],[x+16,y-8],[x+14,y+6],[x+9,y+10],[x-10,y+9],[x-16,y+4],[x-17,y-6]],color(flash,'#496b5d'));
 if(!flash){
  polygon(c,[[x-14,y-10],[x-4,y-10],[x-5,y+4],[x-10,y+7],[x-14,y+2]],'#7d9a7f',false);
  polygon(c,[[x+4,y-10],[x+12,y-9],[x+13,y+4],[x+8,y+8],[x+1,y+7]],'#29473e',false);
  polygon(c,[[x-13,y+1],[x-8,y-1],[x-6,y+2],[x-2,y+2],[x-3,y+7],[x-10,y+7],[x-14,y+4]],'#af6941',false);
  c.strokeStyle=INK;c.lineWidth=3.4;c.beginPath();c.moveTo(x-8,y-5);c.lineTo(x-2,y+1);c.lineTo(x+6,y-7);c.stroke();
  c.strokeStyle='#71ed93';c.lineWidth=1.6;c.stroke();
 }
 const hy=y-20;
 polygon(c,[[x-9,hy-6],[x-5,hy-8],[x+6,hy-8],[x+9,hy-5],[x+8,hy+6],[x-7,hy+6],[x-10,hy+2]],color(flash,'#5b796b'));
 if(!flash){
  polygon(c,[[x-7.5,hy-5],[x-4,hy-6.3],[x+5,hy-6.3],[x+5.5,hy-4],[x-6.8,hy-2.7]],'#9bac93',false);
  polygon(c,[[x+5,hy-3],[x+7,hy-4],[x+6.7,hy+4.7],[x+4.6,hy+4.7]],'#2a443c',false);
  polygon(c,[[x-8.2,hy+.4],[x-5.5,hy+1.2],[x-4.3,hy+4.8],[x-6.8,hy+4.8]],'#b56a42',false);
  c.fillStyle=INK;c.beginPath();c.roundRect(x-6.4,hy-1.5,12.8,4.2,[1]);c.fill();
  c.save();c.fillStyle='#74f599';c.shadowColor='#64ec87';c.shadowBlur=4*q.pulse;c.fillRect(x-5.4,hy-.6,10.8,2.1);c.restore();
 }
 for(const h of q.hands)gauntlet(c,h,flash);
 c.restore();
}
