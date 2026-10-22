import {uprightAttackFrame} from './upright_attack_frame.js';

// Drawing only: the empty sallet, floating plates and original sword stay
// together through the action. No changes to attack authority or collision.
const SCALE=.76,LINE=1.26/SCALE,INK='#11151a',TAU=Math.PI*2;
const ARM=7,BLADE_REACH=30,STRIKE_GRIP=Object.freeze({x:8,y:-1});
const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
const color=(flash,hex)=>flash?'#fff':hex;
const rotate=(x,y,a)=>({x:Math.cos(a)*x-Math.sin(a)*y,y:Math.sin(a)*x+Math.cos(a)*y});
function localDirection(direction,rotation,facing){
 const co=Math.cos(rotation),si=Math.sin(rotation);
 return {x:(co*direction.x+si*direction.y)*facing,y:-si*direction.x+co*direction.y};
}
function swordRay(u){
 const dot=STRIKE_GRIP.x*u.x+STRIKE_GRIP.y*u.y,perp2=STRIKE_GRIP.x**2+STRIKE_GRIP.y**2-dot*dot;
 return dot+Math.sqrt(Math.max(0,BLADE_REACH**2-perp2));
}
export function armorSwordFrontV4(direction,rotation,facing=1,size=1){
 return swordRay(localDirection(direction,rotation,facing))*SCALE*size;
}
export function animatedArmorMeleePoseV4(actor,tick){
 const phase=actor.meleePhase,g=actor.meleeGeometry;
 if(actor.enemyFamily!=='animated_armor'||!actor.alive||!g||!phase||phase.phase==='idle')return null;
 const dx=g.targetPosition?g.targetPosition.x-actor.position.x:actor.presentationFacingX??1,dy=g.targetPosition?g.targetPosition.y-actor.position.y:0,d=Math.hypot(dx,dy);
 const direction=d>.001?{x:dx/d,y:dy/d}:{x:1,y:0},sourceRadius=g.sourceRadius,targetRadius=g.targetRadius;
 const centerLimit=g.mode==='clearHullGap'?g.reach+sourceRadius+targetRadius:g.reach,weaponReach=Math.max(sourceRadius,centerLimit-targetRadius),contactReach=Math.max(sourceRadius,Math.min(weaponReach,d-targetRadius));
 const p=clamp((tick-phase.phaseStartedTick)/Math.max(1,phase.phaseEndsTick-phase.phaseStartedTick)),facing=actor.presentationFacingX===-1?-1:1,size=actor.elite?.scale??1;
 const frame=uprightAttackFrame({front:armorSwordFrontV4(direction,.08*direction.x,facing,size),recoil:2,lift:1,lean:-.1,hitLean:.08,squeezeX:1,squeezeY:1,hitX:1,hitY:1},phase.phase,p,direction,contactReach);
 return {family:'animated_armor',phase:phase.phase,progress:p,direction,sourceRadius,targetRadius,centerLimit,weaponReach,contactReach,...frame,
  upright:true,bodyPivot:{x:0,y:-16*SCALE*size},idleFacingX:facing,disableFacingFlip:false};
}
export function armorSwordGeometryV4(action=null,step=0,death=0,separate=0){
 const weight=action?.artWeight??0,strike=action?.strikeBlend??0,facing=action?.idleFacingX??1;
 const shoulder={x:14+separate,y:-3+death*5},idleAngle=.3-step*.035+death*.8;
 // Preserve the carried blade's idle position, but place the grip behind its
 // guard rather than over the blade. The hand now really holds the hilt.
 const arm=rotate(1,12,idleAngle-.1),hilt=rotate(0,-4,idleAngle);
 const idleGrip={x:shoulder.x+arm.x+hilt.x,y:shoulder.y+arm.y+hilt.y};
 const u=action?localDirection(action.direction,action.body.rotation,facing):{x:1,y:0},distance=swordRay(u);
 const goal=Math.atan2(u.y*distance-STRIKE_GRIP.y,u.x*distance-STRIKE_GRIP.x)-Math.PI/2;
 const grip={x:mix(idleGrip.x,mix(10,STRIKE_GRIP.x,strike),weight),y:mix(idleGrip.y,mix(-8,STRIKE_GRIP.y,strike),weight)};
 const angle=mix(idleAngle,mix(-2.8,goal,strike),weight);
 const dx=grip.x-shoulder.x,dy=grip.y-shoulder.y,d=Math.hypot(dx,dy)||1,height=Math.sqrt(Math.max(0,ARM**2-d*d/4));
 const elbow={x:shoulder.x+dx/2+dy/d*height,y:shoulder.y+dy/2-dx/d*height};
 const blade=rotate(0,BLADE_REACH,angle);
 return {shoulder,elbow,grip,angle,tip:{x:grip.x+blade.x,y:grip.y+blade.y},upperLength:ARM,lowerLength:ARM};
}
export function animatedArmorMotionV4(m,time,seed){
 const action=m.familyAttack,weight=action?.artWeight??0,strike=action?.strikeBlend??0,walk=(m.motionBlend??0)*(1-weight),cycle=m.stepPhase??0,death=m.deathProgress??0;
 const step=Math.sin(cycle)*3.2*walk,shift=Math.sin(cycle)*1.1*walk;
 return {weight,strike,walk,cycle,death,step,shift,leftLift:Math.max(0,Math.sin(cycle))*2.8*walk*(1-death),rightLift:Math.max(0,-Math.sin(cycle))*2.8*walk*(1-death),
  bob:Math.abs(Math.sin(cycle))*.6*walk,helmetFollow:-shift*.35+Math.sin(time/260+(seed%9))*.35*(1-walk)*(1-weight)};
}
function polygon(c,points,fill,outline=true){
 c.fillStyle=fill;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fill();
 if(outline){c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();}
}
function plateLimb(c,a,b,flash){
 const length=Math.hypot(b.x-a.x,b.y-a.y);
 c.save();c.translate(a.x,a.y);c.rotate(Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2);
 c.fillStyle=color(flash,'#647b8d');c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.roundRect(-2.8,-1.2,5.6,length+2.4,[1.8]);c.fill();c.stroke();
 if(!flash){polygon(c,[[-1.9,0],[0,0],[0,length],[-1.9,length-.5]],'#a6becb',false);}c.restore();
}
function weapon(c,m,motion,cx,cy,separate,flash){
 const g=armorSwordGeometryV4(m.familyAttack,motion.step,motion.death,separate);
 c.save();c.translate(cx,cy);
 plateLimb(c,g.shoulder,g.elbow,flash);plateLimb(c,g.elbow,g.grip,flash);
 c.fillStyle=color(flash,'#364654');c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.ellipse(g.shoulder.x,g.shoulder.y-3,7,5,.25,0,TAU);c.fill();c.stroke();
 if(!flash){polygon(c,[[g.shoulder.x-5,g.shoulder.y-4],[g.shoulder.x-1,g.shoulder.y-6.5],[g.shoulder.x+4,g.shoulder.y-4],[g.shoulder.x,g.shoulder.y-3]],'#a6becb',false);}
 c.save();c.translate(g.grip.x,g.grip.y);c.rotate(g.angle);
 // One rigid, original-profile sword, pivoted at its actual gauntlet.
 polygon(c,[[-2,4],[0,30],[3,24],[2,4]],color(flash,'#a6becb'));
 if(!flash){polygon(c,[[.2,5],[1.5,5],[1.8,23],[0,28]],'#647b8d',false);}
 c.fillStyle=color(flash,'#364654');c.fillRect(-1.8,-4,3.6,7);c.strokeStyle=INK;c.lineWidth=LINE;c.strokeRect(-1.8,-4,3.6,7);
 polygon(c,[[-6,2],[6,2],[6,5],[-6,5]],color(flash,'#98603a'));
 c.fillStyle=color(flash,'#647b8d');c.beginPath();c.roundRect(-3,-3,6,5.5,[1.4]);c.fill();c.stroke();
 if(!flash){c.fillStyle='#a6becb';c.fillRect(-1.7,-2,2,3);}c.restore();c.restore();
}
export function drawAnimatedArmorV4(c,m,time,seed){
 const art=animatedArmorMotionV4(m,time,seed),{weight,strike,walk,cycle,death,step,shift,leftLift,rightLift}=art;
 const cx=m.x+m.w/2,base=m.y+m.h-1,torsoX=cx+shift+death*8,torsoY=base-15-art.bob+death*13,flash=m.flashTimer>0,separate=(flash?2.2:0)+death*2;
 const iron=color(flash,'#647b8d'),light=color(flash,'#a6becb'),dark=color(flash,'#364654'),spirit='#9de8bd';
 c.save();c.lineJoin='round';c.lineCap='round';c.strokeStyle=INK;c.lineWidth=LINE;
 // The original alternating greaves and death disassembly are retained.
 const leg=(side,x,lift)=>{
  c.save();c.translate(x+side*separate+side*death*4,base-lift);c.rotate(side*step*.018+side*death*.7);
  polygon(c,[[-4,-13],[4,-13],[3,-3],[5,0],[-5,0],[-3,-3]],iron);
  if(!flash){polygon(c,[[1,-11],[3,-11],[2,-3],[4,-1],[1,-1]],dark,false);polygon(c,[[-3,-11],[0,-12],[0,-3],[-3,-3]],light,false);}c.restore();
 };
 leg(-1,cx-6-step,leftLift);leg(1,cx+6+step,rightLift);
 if(!flash){c.save();c.globalAlpha=.48*(1-death);c.strokeStyle=spirit;c.lineWidth=1.2;c.beginPath();c.moveTo(cx-6-step,base-leftLift-13);c.quadraticCurveTo(torsoX-5,torsoY+8,torsoX-8,torsoY-3);c.moveTo(cx+6+step,base-rightLift-13);c.quadraticCurveTo(torsoX+5,torsoY+8,torsoX+8,torsoY-3);c.stroke();c.restore();}
 c.save();c.translate(torsoX,torsoY);c.rotate(-shift*.012+death*.85);
 polygon(c,[[-11,-10],[11,-10],[9,8],[0,13],[-9,8]],iron);
 if(!flash){polygon(c,[[-9,-8],[-1,-9],[-2,8],[-7,6]],light,false);polygon(c,[[2,-8],[9,-8],[7,6],[2,9]],dark,false);
  c.strokeStyle='#98603a';c.lineWidth=.9;c.beginPath();c.moveTo(-7,-2);c.lineTo(-4,0);c.moveTo(5,4);c.lineTo(8,2);c.stroke();}c.restore();
 // Unarmed side stays a closed gauntlet; no substitute attack appendage.
 c.save();c.translate(torsoX-15-separate,torsoY-2);c.rotate(.12+step*.025-.28*weight);
 c.fillStyle=iron;c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.roundRect(-4,-2,7,11,[2.3]);c.fill();c.stroke();
 if(!flash){c.fillStyle=light;c.fillRect(-2.6,-.5,2,7);}
 c.fillStyle=dark;c.beginPath();c.roundRect(-4,8,7,5,[1.8]);c.fill();c.stroke();c.restore();
 c.fillStyle=dark;c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.ellipse(torsoX-14-separate,torsoY-6-step*.02,7,5,-.25,0,TAU);c.fill();c.stroke();
 if(!flash){polygon(c,[[torsoX-19-separate,torsoY-7],[torsoX-14-separate,torsoY-10],[torsoX-10-separate,torsoY-8],[torsoX-14-separate,torsoY-6]],light,false);}
 weapon(c,m,art,torsoX,torsoY,separate,flash);
 // Empty sallet, ink-dark visor and a restrained spectral slit, not a face.
 c.save();c.translate(torsoX+art.helmetFollow+separate*.2-death*15,torsoY-16-separate+death*19);c.rotate(-shift*.008+.06*strike*weight-death*.95);
 c.fillStyle=iron;c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.moveTo(-8,-2);c.quadraticCurveTo(0,-10,8,-2);c.lineTo(7,6);c.lineTo(4,9);c.lineTo(-6,8);c.lineTo(-8,4);c.closePath();c.fill();c.stroke();
 if(!flash){c.fillStyle=light;c.beginPath();c.moveTo(-6,-2);c.quadraticCurveTo(-2,-7,0,-6);c.lineTo(-1,5);c.lineTo(-5,5);c.closePath();c.fill();
  polygon(c,[[2,-6],[6,-2],[5,6],[2,7]],dark,false);polygon(c,[[-6,2],[6,1],[5,5],[-5,5]],INK,false);
  c.fillStyle=spirit;c.globalAlpha=.78*(1-death);c.fillRect(1,2.2,3,1.4);}c.restore();c.restore();
}
