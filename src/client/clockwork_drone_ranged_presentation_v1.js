// Disposable cannon pose. Aim, phases, launch and collision belong to the host.
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const p=clamp(x);return p*p*(3-2*p);};
const TAU=Math.PI*2;
export function clockworkDroneRangedPose(actor,tick){
 const r=actor.ranged;
 if(!actor.alive||!r||r.phase==='idle')return null;
 const aim=r.aim??{x:actor.presentationFacingX??1,y:0},d=Math.hypot(aim.x,aim.y),direction=d>.001?{x:aim.x/d,y:aim.y/d}:{x:1,y:0};
 const p=clamp((tick-r.phaseStartedTick)/Math.max(1,r.phaseEndsTick-r.phaseStartedTick));
 const charge=r.phase==='windup'?smooth(p):0,hold=r.phase==='windup'?charge:1-smooth(p);
 const release=r.phase==='recovery'?clamp(1-(tick-r.phaseStartedTick)/3):0;
 const kick=r.phase==='recovery'?Math.sin(Math.PI*clamp((tick-r.phaseStartedTick)/6)):0;
 return {family:'clockwork_drone',ranged:true,upright:true,preserveFacingFlip:true,
  bodyPivot:{x:0,y:-9.6},phase:r.phase,progress:p,charge,release,recovery:r.phase==='recovery'?1-p:0,direction,
  body:{x:-direction.x*(hold+kick*1.5),y:-direction.y*(hold+kick*1.5),rotation:direction.x*(-.035*hold+.025*kick),scaleX:1-.025*hold,scaleY:1+.025*hold},
  limb:{extension:0,sweep:0,open:charge}};
}
export function drawClockworkDroneCannon(c,pose,flash=false){
 if(pose?.family!=='clockwork_drone'||!pose.ranged)return false;
 const q=pose.charge,k=pose.release,hold=pose.phase==='windup'?q:1-smooth(pose.progress),tip=14+2*hold-k;
 c.save();c.translate(0,-8);c.rotate(Math.atan2(pose.direction.y,pose.direction.x));
 c.lineJoin='round';c.lineCap='round';c.strokeStyle='#11151a';c.lineWidth=1.26;
 c.fillStyle=flash?'#fff':'#397b70';c.beginPath();c.arc(4,0,3.8,0,TAU);c.fill();c.stroke();
 c.fillStyle=flash?'#fff':'#edb344';c.beginPath();c.roundRect(5,-2.8,tip-5,5.6,[1]);c.fill();c.stroke();
 c.fillStyle=flash?'#fff':'#ffe4a4';c.fillRect(6,-1.9,Math.max(1,tip-8),1.2);
 c.fillStyle=flash?'#fff':'#214b46';c.beginPath();c.roundRect(tip-2,-3.5,3,7,[1]);c.fill();c.stroke();
 c.fillStyle=flash?'#fff':k?'#c5fff0':'#60d9bc';c.fillRect(tip-.8,-2.2,1.1,4.4);
 if(q>.15||k>0){c.strokeStyle=k?'#ffe4a4':'#60d9bc';c.lineWidth=1.1;c.beginPath();c.arc(tip+.8,0,1.5+q*2+k,-1.05,1.05);c.stroke();}
 c.restore();return true;
}
