import {uprightAttackFrame} from './upright_attack_frame.js';

// The enemy is the sword. Keep its entire forged silhouette rigid while it
// aims; the orbiting wisps are atmosphere, not extra weapons or hit shapes.
const SCALE=.78,LINE=1.26/SCALE,INK='#11151a',TAU=Math.PI*2,TIP=23;
const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
const color=(flash,hex)=>flash?'#fff':hex;
export function cursedBladeMeleePoseV4(actor,tick){
 const phase=actor.meleePhase,g=actor.meleeGeometry;
 if(actor.enemyFamily!=='cursed_blade'||!actor.alive||!g||!phase||phase.phase==='idle')return null;
 const dx=g.targetPosition?g.targetPosition.x-actor.position.x:actor.presentationFacingX??1,dy=g.targetPosition?g.targetPosition.y-actor.position.y:0,d=Math.hypot(dx,dy);
 const direction=d>.001?{x:dx/d,y:dy/d}:{x:1,y:0},sourceRadius=g.sourceRadius,targetRadius=g.targetRadius;
 const centerLimit=g.mode==='clearHullGap'?g.reach+sourceRadius+targetRadius:g.reach,weaponReach=Math.max(sourceRadius,centerLimit-targetRadius),contactReach=Math.max(sourceRadius,Math.min(weaponReach,d-targetRadius));
 const p=clamp((tick-phase.phaseStartedTick)/Math.max(1,phase.phaseEndsTick-phase.phaseStartedTick)),size=actor.elite?.scale??1;
 const frame=uprightAttackFrame({front:TIP*SCALE*size,recoil:5,lift:-2,lean:0,hitLean:0,squeezeX:1,squeezeY:1,hitX:1,hitY:1},phase.phase,p,direction,contactReach);
 return {family:'cursed_blade',phase:phase.phase,progress:p,direction,sourceRadius,targetRadius,centerLimit,weaponReach,contactReach,...frame,
  upright:true,bodyPivot:{x:0,y:(-12.5*SCALE-1)*size},idleFacingX:actor.presentationFacingX===-1?-1:1,disableFacingFlip:false};
}
export function cursedBladeMotionV4(m,time,seed){
 const action=m.familyAttack,weight=action?.artWeight??0,strike=action?.strikeBlend??0,walk=m.motionBlend??0,step=m.stepPhase??0;
 const x=m.x+m.w/2+Math.sin(step)*walk*1.5*(1-weight),y=m.y+m.h/2+(Math.sin(time/130+(seed%13))*2.7-Math.abs(Math.sin(step))*walk)*(1-weight);
 const idleAngle=-.42+Math.sin(time/420+(seed%17))*.1;
 // Forward-facing aim uses one angle branch. Do not shortest-angle-wrap the
 // interpolation: that can reverse the sweep as a target moves downward.
 const goal=action?Math.atan2(action.direction.y,action.direction.x*action.idleFacingX)+Math.PI/2:idleAngle;
 const angle=mix(idleAngle,mix(idleAngle-.6,goal,strike),weight);
 const wisps=Array.from({length:3},(_,i)=>{
  const phase=time/330+(seed%97)*.031+i*TAU/3,radius=10+i*1.8;
  return {index:i,x:x+Math.cos(phase)*radius,y:y+Math.sin(phase)*radius*.72,radius:2-i*.2,front:Math.sin(phase)>=0,alpha:.34-i*.055};
 });
 const transform=(px,py)=>({x:x+Math.cos(angle)*px-Math.sin(angle)*py,y:y+Math.sin(angle)*px+Math.cos(angle)*py});
 return {x,y,angle,weight,strike,wisps,tip:transform(0,-TIP),guard:transform(0,14),pommel:transform(0,28),transform};
}
function polygon(c,points,fill,outline=true){
 c.fillStyle=fill;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fill();
 if(outline){c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();}
}
function wisp(c,w){
 c.save();c.globalAlpha*=w.alpha;c.fillStyle='#b28cda';c.beginPath();c.arc(w.x,w.y,w.radius,0,TAU);c.fill();c.restore();
}
export function cursedBladeAuraV4(time,seed){
 return {color:'#b46be7',alpha:.42*(.94+Math.sin(time/340+(seed%11))*.06),width:6,blur:10};
}
function aura(c,time,seed){
 const glow=cursedBladeAuraV4(time,seed);
 // A species-specific supernatural aura, behind the opaque sword and ink.
 // One soft silhouette stroke restores the curse without blurring its edges.
 c.save();c.globalAlpha*=glow.alpha;c.strokeStyle=glow.color;c.shadowColor=glow.color;c.shadowBlur=glow.blur;c.lineWidth=glow.width;
 c.beginPath();c.moveTo(0,-23);c.lineTo(5,-14);c.lineTo(4,10.7);c.lineTo(6,10);c.lineTo(9,12);c.lineTo(7,16);c.lineTo(2.5,16);c.lineTo(2.5,26);c.lineTo(-2.5,26);c.lineTo(-2.5,16);c.lineTo(-7,16);c.lineTo(-9,12);c.lineTo(-6,10);c.lineTo(-4,10.7);c.lineTo(-4,-15);c.closePath();
 c.moveTo(3,28);c.arc(0,28,3,0,TAU);c.stroke();c.restore();
}
export function drawCursedBladeV4(c,m,time,seed){
 const motion=cursedBladeMotionV4(m,time,seed),flash=m.flashTimer>0;
 c.save();c.lineJoin='round';c.lineCap='round';
 if(!flash)for(const w of motion.wisps.filter(w=>!w.front))wisp(c,w);
 c.save();c.translate(motion.x,motion.y);c.rotate(motion.angle);
 if(!flash)aura(c,time,seed);
 // Original blade, fuller and bevel: three restrained, form-following planes.
 polygon(c,[[-4,-15],[0,-23],[5,-14],[4,12],[-4,12]],color(flash,'#79618f'));
 if(!flash){
  polygon(c,[[0,-19],[3,-13],[2.5,10],[0,8]],'#ccb4e0',false);
  polygon(c,[[-2,-13],[0,-18],[0,8],[-2,10]],'#392743',false);
  c.strokeStyle='#e2b8ff';c.lineWidth=1.1;c.beginPath();c.moveTo(-1,-7);c.lineTo(2,-3);c.lineTo(-1,3);c.lineTo(1,6);c.stroke();
 }
 polygon(c,[[-9,12],[-6,10],[0,12],[6,10],[9,12],[7,16],[-7,16]],color(flash,'#d69b36'));
 if(!flash){
  polygon(c,[[-7,12],[-5.8,11.2],[0,13],[5.8,11.2],[7,12],[0,14]],'#ffe1a0',false);
  polygon(c,[[1,14],[7.6,12.8],[6.6,15],[1,15]],'#87536d',false);
 }
 c.fillStyle=color(flash,'#654534');c.fillRect(-2.5,16,5,10);c.strokeStyle=INK;c.lineWidth=LINE;c.strokeRect(-2.5,16,5,10);
 if(!flash){c.strokeStyle='#b68751';c.lineWidth=.8;c.beginPath();for(let y=18;y<26;y+=3){c.moveTo(-2,y);c.lineTo(2,y+1.5);}c.stroke();}
 c.fillStyle=color(flash,'#a677da');c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.arc(0,28,3,0,TAU);c.fill();c.stroke();
 if(!flash){polygon(c,[[-1.6,27.5],[0,26.1],[1.2,27.5],[0,28.5]],'#dac5ff',false);}
 c.restore();
 if(!flash)for(const w of motion.wisps.filter(w=>w.front))wisp(c,w);
 c.restore();
}
