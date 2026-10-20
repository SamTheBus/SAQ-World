// Cel-shaded world-scale redesigns. Every surface uses hard color bands.
// The supplied presentation clock drives every articulated detail.
const TAU=Math.PI*2;
const ink=(m,color)=>m.flashTimer?'#fff':color;
const center=m=>({x:m.x+m.w/2,y:m.y+m.h/2});
const disk=(c,x,y,r,fill)=>{c.fillStyle=fill;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.stroke();};
function scarabHead(c,x,y,scale,open,flash){
 c.save();c.translate(x,y);c.scale(scale,scale);c.strokeStyle=flash?'#fff':'#263738';c.lineWidth=1.5;
 c.fillStyle=flash?'#fff':'#33514c';c.beginPath();c.moveTo(-4,-5);c.lineTo(3,-4);c.lineTo(6,0);c.lineTo(3,4);c.lineTo(-4,5);c.closePath();c.fill();c.stroke();
 c.fillStyle=flash?'#fff':'#79a18a';c.beginPath();c.moveTo(-3,-4);c.lineTo(2,-3);c.lineTo(4,-1);c.lineTo(-3,-1);c.closePath();c.fill();
 c.fillStyle=flash?'#fff':'#1c3433';c.beginPath();c.moveTo(-3,1);c.lineTo(4,1);c.lineTo(2,3);c.lineTo(-3,4);c.closePath();c.fill();
 c.fillStyle=flash?'#fff':'#8cfff1';for(const side of [-1,1]){c.beginPath();c.ellipse(2,side*2.2,1.4,.9,0,0,TAU);c.fill();}
 c.restore();
}
export function drawClockworkScarabV3(c,m,time,seed){
 const p=center(m),cy=p.y+Math.sin(time/180)*.6,a=m.familyAttack,walk=m.motionBlend??0;
 c.save();c.lineJoin='round';c.lineCap='round';c.strokeStyle=ink(m,'#252b29');c.lineWidth=1.6;
 // Six jointed copper legs remain under the plated shell during a bite.
 for(const side of [-1,1])for(let row=0;row<3;row++){
  const x=p.x-8+row*7,fan=[-9,-3,9][row],step=Math.sin(time/95+row*1.7+side)*walk*2.5;
  c.strokeStyle=ink(m,'#3a3327');c.lineWidth=3;c.beginPath();c.moveTo(x,cy+side*5);c.lineTo(x+fan*.5+step,cy+side*11);c.lineTo(x+fan+step,cy+side*15);c.stroke();
  c.strokeStyle=ink(m,'#d09c4c');c.lineWidth=1.3;c.beginPath();c.moveTo(x,cy+side*5);c.lineTo(x+fan*.5+step,cy+side*11);c.lineTo(x+fan+step,cy+side*15);c.stroke();
  disk(c,x+fan*.5+step,cy+side*11,1.7,ink(m,'#a47939'));
 }
 c.strokeStyle=ink(m,'#252b29');c.lineWidth=1.6;c.fillStyle=ink(m,'#365049');c.beginPath();c.ellipse(p.x-1,cy,14,10,0,0,TAU);c.fill();c.stroke();
 const lift=(a?.artWeight??0)*(1-(a?.strikeBlend??0))*1.2;
 for(const side of [-1,1]){
  c.fillStyle=ink(m,side<0?'#e5b45e':'#96602f');c.beginPath();c.moveTo(p.x-13,cy+side*1.3);c.quadraticCurveTo(p.x-11,cy+side*(12+lift),p.x+6,cy+side*(8+lift));c.lineTo(p.x+9,cy+side*2);c.lineTo(p.x-13,cy+side*1.3);c.fill();c.stroke();
  c.fillStyle=ink(m,side<0?'#ffe3a2':'#c58c42');c.beginPath();c.moveTo(p.x-10,cy+side*3);c.lineTo(p.x-5,cy+side*7);c.lineTo(p.x+4,cy+side*6);c.lineTo(p.x+6,cy+side*3);c.closePath();c.fill();
  c.strokeStyle=ink(m,'#f6d995');c.lineWidth=1;c.beginPath();c.moveTo(p.x-10,cy+side*3);c.quadraticCurveTo(p.x-5,cy+side*8,p.x+4,cy+side*6);c.stroke();c.strokeStyle=ink(m,'#252b29');
  for(const x of [-7,2])disk(c,p.x+x,cy+side*6.5,1,ink(m,'#675132'));
 }
 c.fillStyle=ink(m,'#172f2d');c.beginPath();c.roundRect(p.x-9,cy-2,15,4,[2]);c.fill();c.stroke();
 c.fillStyle=ink(m,'#7ae2c8');c.fillRect(p.x-6,cy-.7,9,1.4);
 if(!a){scarabHead(c,p.x+10,cy,1,.2,m.flashTimer);for(const side of [-1,1]){c.strokeStyle=ink(m,'#e3ca83');c.lineWidth=2;c.beginPath();c.moveTo(p.x+13,cy+side*2);c.quadraticCurveTo(p.x+20,cy+side*5,p.x+19,cy+side);c.stroke();}}
 c.restore();
}
function gearCase(c,x,y,m){
 c.save();c.translate(x,y);c.strokeStyle=ink(m,'#242b2d');c.lineWidth=1.4;
 c.fillStyle=ink(m,'#73512d');c.beginPath();for(let n=0;n<48;n++){const a=n*TAU/48,r=n%4<2?15.5:13.4,px=Math.cos(a)*r,py=Math.sin(a)*r;n?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.fill();c.stroke();
 disk(c,0,0,12.4,ink(m,'#d8b262'));
 c.fillStyle=ink(m,'#f8df98');c.beginPath();c.arc(0,0,11.6,Math.PI,TAU);c.closePath();c.fill();
 c.fillStyle=ink(m,'#8c6339');c.beginPath();c.arc(0,0,11.6,0,Math.PI);c.closePath();c.fill();
 disk(c,0,0,10.7,ink(m,'#19343a'));
 c.fillStyle=ink(m,'#315862');c.beginPath();c.arc(0,0,9.9,Math.PI,TAU);c.closePath();c.fill();
 c.strokeStyle=ink(m,'#edcf87');c.lineWidth=1.2;for(let n=0;n<12;n++){const a=n*TAU/12;c.beginPath();c.moveTo(Math.cos(a)*8.8,Math.sin(a)*8.8);c.lineTo(Math.cos(a)*(n%3?10:10.3),Math.sin(a)*(n%3?10:10.3));c.stroke();}
 c.restore();
}
function weight(c,x,y,flash,scale=1){
 c.save();c.translate(x,y);c.scale(scale,scale);c.strokeStyle=flash?'#fff':'#30302a';c.lineWidth=1.4;c.fillStyle=flash?'#fff':'#c69b4b';c.beginPath();c.moveTo(0,-5);c.lineTo(4.5,-2);c.lineTo(4.5,3);c.lineTo(0,5);c.lineTo(-4.5,3);c.lineTo(-4.5,-2);c.closePath();c.fill();c.stroke();
 c.fillStyle=flash?'#fff':'#f3d78a';c.beginPath();c.moveTo(0,-4);c.lineTo(3.5,-1.5);c.lineTo(-3.5,-1.5);c.closePath();c.fill();
 c.fillStyle=flash?'#fff':'#79582f';c.beginPath();c.moveTo(-3.5,1);c.lineTo(3.5,1);c.lineTo(3.5,2.5);c.lineTo(0,4);c.lineTo(-3.5,2.5);c.closePath();c.fill();
 c.fillStyle=flash?'#fff':'#98e6d1';c.fillRect(-1.4,-1.7,2.8,3.4);c.restore();
}
export function drawTemporalWatcherV3(c,m,time,seed){
 const p=center(m),cy=p.y+Math.sin(time/230)*1.4,a=m.familyAttack,q=a?.limb.open??0;
 c.save();c.lineJoin='round';c.lineCap='round';
 // A toothed clock housing, readable iris and hour marks form the silhouette.
 for(const side of [-1,1]){c.strokeStyle=ink(m,'#344247');c.lineWidth=1.5;c.fillStyle=ink(m,'#94703f');c.beginPath();c.moveTo(p.x+side*10,cy-8);c.lineTo(p.x+side*19,cy-4);c.lineTo(p.x+side*15,cy+1);c.lineTo(p.x+side*10,cy+3);c.closePath();c.fill();c.stroke();}
 gearCase(c,p.x,cy,m);c.strokeStyle=ink(m,'#344247');c.lineWidth=1.2;
 c.fillStyle=ink(m,'#6dcec2');c.beginPath();c.ellipse(p.x,cy,6.2,Math.max(2.8,6-q*2),0,0,TAU);c.fill();c.stroke();
 disk(c,p.x+.8,cy,3.1,ink(m,'#10292e'));c.fillStyle=ink(m,'#e9fff1');c.beginPath();c.arc(p.x+1.6,cy-1,1,0,TAU);c.fill();
 c.strokeStyle=ink(m,'#ffd700');c.lineWidth=1.2;c.beginPath();const h=time/1900+(seed%5);c.moveTo(p.x,cy);c.lineTo(p.x+Math.cos(h)*5.5,cy+Math.sin(h)*5.5);c.moveTo(p.x,cy);c.lineTo(p.x+Math.cos(h*.19)*3.8,cy+Math.sin(h*.19)*3.8);c.stroke();
 if(!a){c.strokeStyle=ink(m,'#ceb375');c.lineWidth=2.5;c.beginPath();c.moveTo(p.x,cy+9);c.lineTo(p.x,cy+21);c.stroke();weight(c,p.x,cy+21,m.flashTimer);}
 c.restore();
}
export function drawClockworkDroneV3(c,m,time,seed){
 const p=center(m),cy=p.y+Math.sin(time/190)*1.5,a=m.familyAttack;
 c.save();c.lineJoin='round';c.lineCap='round';c.strokeStyle=ink(m,'#26343a');c.lineWidth=1.6;
 // Twin ducted rotors and shoulder struts support a compact armored hull.
 c.strokeStyle=ink(m,'#7b6750');c.lineWidth=3;c.beginPath();c.moveTo(p.x-7,cy);c.lineTo(p.x-16,cy-9);c.moveTo(p.x+6,cy);c.lineTo(p.x+17,cy-9);c.stroke();
 for(const side of [-1,1]){const x=p.x+side*16,y=cy-10;c.strokeStyle=ink(m,'#26343a');c.fillStyle=ink(m,'#a68a54');c.beginPath();c.ellipse(x,y,8,4.5,0,0,TAU);c.fill();c.stroke();c.fillStyle=ink(m,'#203c40');c.beginPath();c.ellipse(x,y,5.5,2.6,0,0,TAU);c.fill();
  c.strokeStyle=ink(m,'#d9e4c9');c.lineWidth=1.2;const angle=time/55+side;c.beginPath();c.moveTo(x-Math.cos(angle)*5,y-Math.sin(angle)*2);c.lineTo(x+Math.cos(angle)*5,y+Math.sin(angle)*2);c.moveTo(x+Math.sin(angle)*4,y-Math.cos(angle)*2);c.lineTo(x-Math.sin(angle)*4,y+Math.cos(angle)*2);c.stroke();}
 c.strokeStyle=ink(m,'#26343a');c.fillStyle=ink(m,'#c39b34');c.beginPath();c.moveTo(p.x-12,cy-5);c.lineTo(p.x-6,cy-10);c.lineTo(p.x+9,cy-7);c.lineTo(p.x+14,cy-1);c.lineTo(p.x+10,cy+8);c.lineTo(p.x-9,cy+9);c.lineTo(p.x-14,cy+3);c.closePath();c.fill();c.stroke();
 c.fillStyle=ink(m,'#735133');c.beginPath();c.moveTo(p.x-12,cy+3);c.lineTo(p.x+12,cy+2);c.lineTo(p.x+9,cy+7);c.lineTo(p.x-8,cy+8);c.closePath();c.fill();
 c.fillStyle=ink(m,'#e0c785');c.beginPath();c.moveTo(p.x-9,cy-5);c.lineTo(p.x-4,cy-8);c.lineTo(p.x+7,cy-5);c.lineTo(p.x+5,cy-1);c.lineTo(p.x-10,cy);c.closePath();c.fill();
 c.fillStyle=ink(m,'#31464a');c.beginPath();c.roundRect(p.x-7,cy,12,6,[2]);c.fill();c.stroke();c.strokeStyle=ink(m,'#97aa9a');c.lineWidth=.8;for(let i=0;i<3;i++){c.beginPath();c.moveTo(p.x-5+i*3,cy+1);c.lineTo(p.x-5+i*3,cy+4.5);c.stroke();}
 c.strokeStyle=ink(m,'#26343a');disk(c,p.x+9,cy-.5,5.1,ink(m,'#2b5357'));disk(c,p.x+9,cy-.5,2.8,ink(m,'#79e1e1'));
 c.fillStyle=ink(m,'#effff3');c.beginPath();c.arc(p.x+9.8,cy-1.3,.9,0,TAU);c.fill();
 c.strokeStyle=ink(m,'#7a6541');c.lineWidth=2;for(const side of [-1,1]){c.beginPath();c.moveTo(p.x+side*6,cy+8);c.lineTo(p.x+side*8,cy+13);c.lineTo(p.x+side*4,cy+13);c.stroke();}
 if(!a){c.fillStyle=ink(m,'#bbac79');c.beginPath();c.roundRect(p.x+11,cy+3,7,5,[1.5]);c.fill();c.stroke();}
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
  const brace=aim+2.3,committed=brace+turn(aim-brace)*s,angle=Math.PI/2+turn(committed-Math.PI/2)*w;
  const rootY=8.1*(1-s),length=10.8+(limb.extension-4.5-10.8)*w,x=Math.cos(angle)*length,y=rootY+Math.sin(angle)*length;
  c.strokeStyle=flash?'#fff':'#665335';c.lineWidth=3.4;c.beginPath();c.moveTo(0,rootY);c.lineTo(x,y);c.stroke();c.strokeStyle=flash?'#fff':'#e5c989';c.lineWidth=1;c.beginPath();c.moveTo(-.6,rootY);c.lineTo(x-.6,y);c.stroke();weight(c,x,y,flash,.9);
 }else{
  c.rotate(Math.atan2(d.y,d.x));const tip=limb.extension;
  if(family==='clockwork_scarab'){
   scarabHead(c,8.5,0,.9,limb.open,flash);c.strokeStyle=flash?'#fff':'#e8ce8a';c.lineWidth=2.2;
   for(const side of [-1,1]){c.beginPath();c.moveTo(11.2,side*1.8);c.quadraticCurveTo(tip-2,side*(3+3.2*limb.open),tip,side*(.6+2*limb.open));c.lineTo(tip-2,side*.4);c.stroke();}
  }else{
   c.strokeStyle=flash?'#fff':'#27393d';c.lineWidth=1.4;c.fillStyle=flash?'#fff':'#a99460';c.beginPath();c.roundRect(5,1,8,6,[2]);c.fill();c.stroke();
   c.strokeStyle=flash?'#fff':'#b9c6bc';c.lineWidth=3.6;c.beginPath();c.moveTo(10,4);c.lineTo(tip-4,4);c.stroke();c.strokeStyle=flash?'#fff':'#f1ebcb';c.lineWidth=1;c.beginPath();c.moveTo(10,2.9);c.lineTo(tip-4,2.9);c.stroke();
   c.fillStyle=flash?'#fff':'#586e6a';c.beginPath();c.roundRect(tip-5,-.5,5,9,[1]);c.fill();c.stroke();c.fillStyle=flash?'#fff':'#a8eee0';c.fillRect(tip-1.5,1,1.3,6);
  }
 }
 c.restore();return true;
}
