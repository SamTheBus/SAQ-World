import {watcherEyePose} from './temporal_watcher_eye_v1.js';
// Retain the clockwork drawings with their individually reviewed palettes and ink.
// The supplied presentation clock drives every articulated detail.
const TAU=Math.PI*2;
const ink=(m,color)=>m.flashTimer?'#fff':color;
const center=m=>({x:m.x+m.w/2,y:m.y+m.h/2});
const disk=(c,x,y,r,fill)=>{c.fillStyle=fill;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.stroke();};
const SCARAB_INK='#11151a';
const WATCHER_INK='#11151a';
// Match the golem's 1.8px contour at .7 visual scale (1.26 world pixels).
// The Watcher is drawn at .9 scale, so its local contour is 1.4px.
const WATCHER_LINE=1.4;
const DRONE_INK='#11151a';
// At .8 visual scale, match the golem's 1.26 world-pixel main contour.
const DRONE_LINE=1.575;
export function temporalWatcherClockworkPose(time,seed=0){
 const seconds=time/1000,phase=(seed%12)*TAU/12;
 return {gearAngle:phase-seconds*TAU/20,minuteAngle:phase+seconds*TAU/4.8,hourAngle:phase*.3+seconds*TAU/14.4,pendulumAngle:Math.sin(seconds*TAU/2.4)*.2};
}
function scarabHead(c,x,y,scale,open,flash){
 c.save();c.translate(x,y);c.scale(scale,scale);c.strokeStyle=SCARAB_INK;c.lineWidth=2;
 c.fillStyle=flash?'#fff':'#397b70';c.beginPath();c.moveTo(-4,-5);c.lineTo(3,-4);c.lineTo(6,0);c.lineTo(3,4);c.lineTo(-4,5);c.closePath();c.fill();c.stroke();
 c.fillStyle=flash?'#fff':'#7ab79a';c.beginPath();c.moveTo(-3,-4);c.lineTo(2,-3);c.lineTo(4,-1);c.lineTo(-3,-1);c.closePath();c.fill();
 c.fillStyle=flash?'#fff':'#24564f';c.beginPath();c.moveTo(-3,1);c.lineTo(4,1);c.lineTo(2,3);c.lineTo(-3,4);c.closePath();c.fill();
 c.fillStyle=flash?'#fff':'#c5fff0';for(const side of [-1,1]){c.beginPath();c.ellipse(2,side*2.2,1.4,.9,0,0,TAU);c.fill();}
 c.restore();
}
export function drawClockworkScarabV3(c,m,time,seed){
 const p=center(m),cy=p.y+Math.sin(time/180)*.6,a=m.familyAttack,walk=m.motionBlend??0;
 c.save();c.lineJoin='round';c.lineCap='round';c.strokeStyle=SCARAB_INK;c.lineWidth=2;
 // Six jointed copper legs remain under the plated shell during a bite.
 for(const side of [-1,1])for(let row=0;row<3;row++){
  const x=p.x-8+row*7,fan=[-9,-3,9][row],step=Math.sin(time/95+row*1.7+side)*walk*2.5;
  c.strokeStyle=SCARAB_INK;c.lineWidth=3.4;c.beginPath();c.moveTo(x,cy+side*5);c.lineTo(x+fan*.5+step,cy+side*11);c.lineTo(x+fan+step,cy+side*15);c.stroke();
  c.strokeStyle=ink(m,'#d79b39');c.lineWidth=1.3;c.beginPath();c.moveTo(x,cy+side*5);c.lineTo(x+fan*.5+step,cy+side*11);c.lineTo(x+fan+step,cy+side*15);c.stroke();
  c.strokeStyle=SCARAB_INK;c.lineWidth=1.2;disk(c,x+fan*.5+step,cy+side*11,1.7,ink(m,'#d79b39'));
 }
 c.strokeStyle=SCARAB_INK;c.lineWidth=2;c.fillStyle=ink(m,'#397b70');c.beginPath();c.ellipse(p.x-1,cy,14,10,0,0,TAU);c.fill();c.stroke();
 const lift=(a?.artWeight??0)*(1-(a?.strikeBlend??0))*1.2;
 for(const side of [-1,1]){
  c.strokeStyle=SCARAB_INK;c.lineWidth=2;c.fillStyle=ink(m,side<0?'#edb344':'#b87a26');c.beginPath();c.moveTo(p.x-13,cy+side*1.3);c.quadraticCurveTo(p.x-11,cy+side*(12+lift),p.x+6,cy+side*(8+lift));c.lineTo(p.x+9,cy+side*2);c.lineTo(p.x-13,cy+side*1.3);c.fill();c.stroke();
  c.fillStyle=ink(m,side<0?'#ffe4a4':'#df9d37');c.beginPath();c.moveTo(p.x-10,cy+side*3);c.lineTo(p.x-5,cy+side*7);c.lineTo(p.x+4,cy+side*6);c.lineTo(p.x+6,cy+side*3);c.closePath();c.fill();
  c.strokeStyle=ink(m,'#ffe2a0');c.lineWidth=1;c.beginPath();c.moveTo(p.x-10,cy+side*3);c.quadraticCurveTo(p.x-5,cy+side*8,p.x+4,cy+side*6);c.stroke();c.strokeStyle=SCARAB_INK;
  for(const x of [-7,2])disk(c,p.x+x,cy+side*6.5,1,ink(m,'#5a381b'));
 }
 c.strokeStyle=SCARAB_INK;c.lineWidth=2;c.fillStyle=ink(m,'#214b46');c.beginPath();c.roundRect(p.x-9,cy-2,15,4,[2]);c.fill();c.stroke();
 c.fillStyle=ink(m,'#60d9bc');c.fillRect(p.x-6,cy-.7,9,1.4);
 if(!a){scarabHead(c,p.x+10,cy,1,.2,m.flashTimer);for(const side of [-1,1]){c.strokeStyle=SCARAB_INK;c.lineWidth=3.4;c.beginPath();c.moveTo(p.x+13,cy+side*2);c.quadraticCurveTo(p.x+20,cy+side*5,p.x+19,cy+side);c.stroke();c.strokeStyle=ink(m,'#ffe4a4');c.lineWidth=2;c.stroke();}}
 c.restore();
}
function gearCase(c,x,y,m,angle){
 c.save();c.translate(x,y);c.strokeStyle=WATCHER_INK;c.lineWidth=WATCHER_LINE;
 c.save();c.rotate(angle);
 c.fillStyle=ink(m,'#b87a26');c.beginPath();for(let n=0;n<48;n++){const a=n*TAU/48,r=n%4<2?15.5:13.4,px=Math.cos(a)*r,py=Math.sin(a)*r;n?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.fill();c.stroke();
 c.restore();
 disk(c,0,0,12.4,ink(m,'#edb344'));
 c.fillStyle=ink(m,'#ffe4a4');c.beginPath();c.arc(0,0,11.6,Math.PI,TAU);c.closePath();c.fill();
 c.fillStyle=ink(m,'#b87a26');c.beginPath();c.arc(0,0,11.6,0,Math.PI);c.closePath();c.fill();
 disk(c,0,0,10.7,ink(m,'#214b46'));
 c.fillStyle=ink(m,'#397b70');c.beginPath();c.arc(0,0,9.9,Math.PI,TAU);c.closePath();c.fill();
 c.strokeStyle=ink(m,'#ffe2a0');c.lineWidth=1.2;for(let n=0;n<12;n++){const a=n*TAU/12;c.beginPath();c.moveTo(Math.cos(a)*8.8,Math.sin(a)*8.8);c.lineTo(Math.cos(a)*(n%3?10:10.3),Math.sin(a)*(n%3?10:10.3));c.stroke();}
 c.restore();
}
function weight(c,x,y,flash,scale=1){
 c.save();c.translate(x,y);c.scale(scale,scale);c.strokeStyle=WATCHER_INK;c.lineWidth=WATCHER_LINE;c.fillStyle=flash?'#fff':'#edb344';c.beginPath();c.moveTo(0,-5);c.lineTo(4.5,-2);c.lineTo(4.5,3);c.lineTo(0,5);c.lineTo(-4.5,3);c.lineTo(-4.5,-2);c.closePath();c.fill();c.stroke();
 c.fillStyle=flash?'#fff':'#ffe4a4';c.beginPath();c.moveTo(0,-4);c.lineTo(3.5,-1.5);c.lineTo(-3.5,-1.5);c.closePath();c.fill();
 c.fillStyle=flash?'#fff':'#b87a26';c.beginPath();c.moveTo(-3.5,1);c.lineTo(3.5,1);c.lineTo(3.5,2.5);c.lineTo(0,4);c.lineTo(-3.5,2.5);c.closePath();c.fill();
 c.fillStyle=flash?'#fff':'#60d9bc';c.fillRect(-1.4,-1.7,2.8,3.4);c.restore();
}
export function drawTemporalWatcherV3(c,m,time,seed){
 const p=center(m),cy=p.y+Math.sin(time/230)*1.4,a=m.familyAttack,q=a?.limb.open??0,motion=temporalWatcherClockworkPose(time,seed);
 c.save();c.lineJoin='round';c.lineCap='round';
 // A faceted arcane lens occupies the upper face. Clock hands remain below
 // its tracking slit, and a flat shutter closes across the lens to blink.
 for(const side of [-1,1]){c.strokeStyle=WATCHER_INK;c.lineWidth=WATCHER_LINE;c.fillStyle=ink(m,'#d79b39');c.beginPath();c.moveTo(p.x+side*10,cy-8);c.lineTo(p.x+side*19,cy-4);c.lineTo(p.x+side*15,cy+1);c.lineTo(p.x+side*10,cy+3);c.closePath();c.fill();c.stroke();}
 gearCase(c,p.x,cy,m,motion.gearAngle);c.strokeStyle=WATCHER_INK;c.lineWidth=WATCHER_LINE;
 const eyeY=cy-3.9,eyeHeight=Math.max(2.8,3.4-q*.35),eye=watcherEyePose(time*60/1000,seed,m.lookDirection,a?.phase??'idle',Boolean(m.flashTimer)),opening=eyeHeight*eye.openness;
 if(opening>.22){
  c.fillStyle=ink(m,'#35b9a5');c.beginPath();c.moveTo(p.x-6.4,eyeY);c.lineTo(p.x-4.8,eyeY-opening);c.lineTo(p.x+4.8,eyeY-opening);c.lineTo(p.x+6.4,eyeY);c.lineTo(p.x+4.8,eyeY+opening);c.lineTo(p.x-4.8,eyeY+opening);c.closePath();c.fill();c.stroke();
  c.save();c.clip();
  c.fillStyle=ink(m,'#86e8d1');c.fillRect(p.x-7,eyeY-opening,14,opening);
  c.fillStyle=ink(m,'#267c77');c.beginPath();c.ellipse(p.x+eye.gazeX,eyeY+eye.gazeY,2.55,Math.min(2.45,eyeHeight-.7),0,0,TAU);c.fill();
  c.fillStyle=ink(m,'#11151a');c.beginPath();c.ellipse(p.x+eye.gazeX,eyeY+eye.gazeY,.7,2.1,0,0,TAU);c.fill();
  if(!m.flashTimer){c.fillStyle='#d0fff1';c.fillRect(p.x-3.9,eyeY-opening*.65,2.2,.45);}c.restore();
 }else{c.beginPath();c.moveTo(p.x-6.4,eyeY);c.lineTo(p.x+6.4,eyeY);c.stroke();}
 if(!a){
  c.save();c.translate(p.x,cy+9);c.rotate(motion.pendulumAngle*(m.drawFacingX??1));
  c.strokeStyle=WATCHER_INK;c.lineWidth=3.2;c.beginPath();c.moveTo(0,0);c.lineTo(0,12);c.stroke();c.strokeStyle=ink(m,'#ffe4a4');c.lineWidth=1.4;c.stroke();weight(c,0,12,m.flashTimer);c.restore();
 }
 // Distinct pointed hands keep their gold fill visible at gameplay size.
 const handY=cy+5.8;
 for(const [angle,length] of [[motion.hourAngle,3.2],[motion.minuteAngle,4.5]]){
  c.save();c.translate(p.x,handY);c.rotate(angle);c.strokeStyle=WATCHER_INK;c.lineWidth=.8;c.fillStyle=ink(m,'#ffe4a4');
  c.beginPath();c.moveTo(-.5,-.65);c.lineTo(length-1,-.65);c.lineTo(length,0);c.lineTo(length-1,.65);c.lineTo(-.5,.65);c.closePath();c.fill();c.stroke();c.restore();
 }
 c.strokeStyle=WATCHER_INK;c.lineWidth=.8;disk(c,p.x,handY,1,ink(m,'#edb344'));
 c.restore();
}
export function drawClockworkDroneV3(c,m,time,seed){
 const p=center(m),cy=p.y+Math.sin(time/190)*1.5,a=m.familyAttack;
 c.save();c.lineJoin='round';c.lineCap='round';c.strokeStyle=DRONE_INK;c.lineWidth=DRONE_LINE;
 // Twin ducted rotors and shoulder struts support a compact armored hull.
 c.strokeStyle=DRONE_INK;c.lineWidth=3.8;c.beginPath();c.moveTo(p.x-7,cy);c.lineTo(p.x-16,cy-9);c.moveTo(p.x+6,cy);c.lineTo(p.x+17,cy-9);c.stroke();c.strokeStyle=ink(m,'#edb344');c.lineWidth=1.3;c.stroke();
 for(const side of [-1,1]){const x=p.x+side*16,y=cy-10;c.strokeStyle=DRONE_INK;c.lineWidth=DRONE_LINE;c.fillStyle=ink(m,'#edb344');c.beginPath();c.ellipse(x,y,8,4.5,0,0,TAU);c.fill();c.stroke();c.fillStyle=ink(m,'#214b46');c.beginPath();c.ellipse(x,y,5.5,2.6,0,0,TAU);c.fill();
  c.strokeStyle=ink(m,'#ffe4a4');c.lineWidth=1.2;const angle=time/55+side;c.beginPath();c.moveTo(x-Math.cos(angle)*5,y-Math.sin(angle)*2);c.lineTo(x+Math.cos(angle)*5,y+Math.sin(angle)*2);c.moveTo(x+Math.sin(angle)*4,y-Math.cos(angle)*2);c.lineTo(x-Math.sin(angle)*4,y+Math.cos(angle)*2);c.stroke();}
 c.strokeStyle=DRONE_INK;c.lineWidth=DRONE_LINE;c.fillStyle=ink(m,'#edb344');c.beginPath();c.moveTo(p.x-12,cy-5);c.lineTo(p.x-6,cy-10);c.lineTo(p.x+9,cy-7);c.lineTo(p.x+14,cy-1);c.lineTo(p.x+10,cy+8);c.lineTo(p.x-9,cy+9);c.lineTo(p.x-14,cy+3);c.closePath();c.fill();c.stroke();
 c.fillStyle=ink(m,'#b87a26');c.beginPath();c.moveTo(p.x-12,cy+3);c.lineTo(p.x+12,cy+2);c.lineTo(p.x+9,cy+7);c.lineTo(p.x-8,cy+8);c.closePath();c.fill();
 c.fillStyle=ink(m,'#ffe4a4');c.beginPath();c.moveTo(p.x-9,cy-5);c.lineTo(p.x-4,cy-8);c.lineTo(p.x+7,cy-5);c.lineTo(p.x+5,cy-1);c.lineTo(p.x-10,cy);c.closePath();c.fill();
 c.fillStyle=ink(m,'#214b46');c.beginPath();c.roundRect(p.x-7,cy,12,6,[2]);c.fill();c.stroke();c.strokeStyle=ink(m,'#7ab79a');c.lineWidth=.8;for(let i=0;i<3;i++){c.beginPath();c.moveTo(p.x-5+i*3,cy+1);c.lineTo(p.x-5+i*3,cy+4.5);c.stroke();}
 c.strokeStyle=DRONE_INK;c.lineWidth=DRONE_LINE;disk(c,p.x+9,cy-.5,5.1,ink(m,'#397b70'));c.lineWidth=.9;disk(c,p.x+9,cy-.5,2.8,ink(m,'#60d9bc'));
 c.fillStyle=ink(m,'#c5fff0');c.beginPath();c.arc(p.x+9.8,cy-1.3,.9,0,TAU);c.fill();
 c.strokeStyle=DRONE_INK;c.lineWidth=3;for(const side of [-1,1]){c.beginPath();c.moveTo(p.x+side*6,cy+8);c.lineTo(p.x+side*8,cy+13);c.lineTo(p.x+side*4,cy+13);c.stroke();c.strokeStyle=ink(m,'#edb344');c.lineWidth=1.1;c.stroke();c.strokeStyle=DRONE_INK;c.lineWidth=3;}
 if(!a){c.strokeStyle=DRONE_INK;c.lineWidth=DRONE_LINE;c.fillStyle=ink(m,'#ffe4a4');c.beginPath();c.roundRect(p.x+11,cy+3,7,5,[1.5]);c.fill();c.stroke();}
 c.restore();
}
const clockwork=new Set(['clockwork_scarab','temporal_watcher','clockwork_drone']);
export function drawClockworkAttackV3(c,pose,flash=false){
 if(!pose||!clockwork.has(pose.family))return false;
 const {family,limb,lunge,bodyPivot,direction:d}=pose,time=(pose.presentationTick??0)*1000/60;
 const bob=family==='clockwork_scarab'?Math.sin(time/180)*.6*.9:family==='temporal_watcher'?Math.sin(time/230)*1.4*.9:Math.sin(time/190)*1.5*.8;
 c.save();c.translate(lunge.x+bodyPivot.x,lunge.y+bodyPivot.y+bob);c.lineJoin='round';c.lineCap='round';
 if(family==='temporal_watcher'){
  const aim=Math.atan2(d.y,d.x),turn=a=>Math.atan2(Math.sin(a),Math.cos(a)),w=pose.artWeight,s=pose.strikeBlend;
  const brace=aim+2.3,committed=brace+turn(aim-brace)*s,sway=temporalWatcherClockworkPose(time).pendulumAngle,angle=Math.PI/2+turn(committed-Math.PI/2)*w+sway*(1-w);
  const rootY=8.1*(1-s),length=10.8+(limb.extension-4.5-10.8)*w,x=Math.cos(angle)*length,y=rootY+Math.sin(angle)*length;
  c.strokeStyle=WATCHER_INK;c.lineWidth=3.4;c.beginPath();c.moveTo(0,rootY);c.lineTo(x,y);c.stroke();c.strokeStyle=flash?'#fff':'#ffe4a4';c.lineWidth=1;c.beginPath();c.moveTo(-.6,rootY);c.lineTo(x-.6,y);c.stroke();weight(c,x,y,flash,.9);
 }else{
  c.rotate(Math.atan2(d.y,d.x));const tip=limb.extension;
  if(family==='clockwork_scarab'){
   scarabHead(c,8.5,0,.9,limb.open,flash);
   for(const side of [-1,1]){c.strokeStyle=SCARAB_INK;c.lineWidth=3.4;c.beginPath();c.moveTo(11.2,side*1.8);c.quadraticCurveTo(tip-2,side*(3+3.2*limb.open),tip,side*(.6+2*limb.open));c.lineTo(tip-2,side*.4);c.stroke();c.strokeStyle=flash?'#fff':'#ffe4a4';c.lineWidth=2.2;c.stroke();}
  }else{
   c.strokeStyle=DRONE_INK;c.lineWidth=1.26;c.fillStyle=flash?'#fff':'#edb344';c.beginPath();c.roundRect(5,1,8,6,[2]);c.fill();c.stroke();
   c.strokeStyle=DRONE_INK;c.lineWidth=3.6;c.beginPath();c.moveTo(10,4);c.lineTo(tip-4,4);c.stroke();c.strokeStyle=flash?'#fff':'#edb344';c.lineWidth=2;c.stroke();c.strokeStyle=flash?'#fff':'#ffe4a4';c.lineWidth=1;c.beginPath();c.moveTo(10,2.9);c.lineTo(tip-4,2.9);c.stroke();
   c.strokeStyle=DRONE_INK;c.lineWidth=1.26;c.fillStyle=flash?'#fff':'#397b70';c.beginPath();c.roundRect(tip-5,-.5,5,9,[1]);c.fill();c.stroke();c.fillStyle=flash?'#fff':'#60d9bc';c.fillRect(tip-1.5,1,1.3,6);
  }
 }
 c.restore();return true;
}
