// Gilded Scuttler keeps its upright coin shell, stamped rune and ruby eye.
// Only disposable presentation geometry lives here; host contact is unchanged.
const TAU=Math.PI*2,INK='#11151a',SCALE=.74,LINE=1.26/SCALE;
const color=(flash,hex)=>flash?'#fff':hex;
const clamp=x=>Math.max(0,Math.min(1,x));

export function gildedScuttlerLegsV4(time,seed,walk=0){
 const blend=clamp(walk),legs=[];
 // Two depth layers of three legs. The near/far tripods alternate; idle
 // movement is small enough to read as settling rather than running in place.
 for(const near of [false,true])for(let row=0;row<3;row++){
  const phase=time/105+row*Math.PI*.78+(near?Math.PI:0)+(seed%13)*.31;
  const settle=Math.sin(time/490+row*1.7+(near?2:0)+(seed%7))*.28*(1-blend);
  const step=Math.sin(phase)*2.4*blend,lift=Math.max(0,Math.cos(phase))*2.1*blend;
  legs.push({near,root:{x:[-8,0,8][row],y:near?7:4},
   joint:{x:[-15,-1,15][row]+step*.5,y:(near?12:9)-lift*.45+settle},
   foot:{x:[-20,-3,20][row]+step,y:(near?17:13)-lift+settle}});
 }
 return legs;
}

function path(c,points,fill,outline=true){
 c.fillStyle=fill;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fill();
 if(outline){c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();}
}
function segment(c,a,b,width,flash,near){
 const d=Math.hypot(b.x-a.x,b.y-a.y)||1,nx=-(b.y-a.y)/d,ny=(b.x-a.x)/d;
 path(c,[[a.x+nx*width,a.y+ny*width],[b.x+nx*.5,b.y+ny*.5],[b.x-nx*.5,b.y-ny*.5],[a.x-nx*width,a.y-ny*width]],color(flash,near?'#b77b2b':'#7f5b2b'));
 c.strokeStyle=color(flash,near?'#e4b44e':'#bc9547');c.lineWidth=.7;c.beginPath();
 c.moveTo(a.x+nx*.35,a.y+ny*.35);c.lineTo(b.x+nx*.1,b.y+ny*.1);c.stroke();
}
function supports(c,m,time,seed,near){
 for(const leg of gildedScuttlerLegsV4(time,seed,m.motionBlend??0).filter(leg=>leg.near===near)){
  segment(c,leg.joint,leg.foot,1, m.flashTimer,leg.near);
  segment(c,leg.root,leg.joint,1.3,m.flashTimer,leg.near);
  c.fillStyle=color(m.flashTimer,leg.near?'#d5a13e':'#a7833a');c.strokeStyle=INK;c.lineWidth=LINE;
  c.beginPath();c.arc(leg.joint.x,leg.joint.y,1.25,0,TAU);c.fill();c.stroke();
 }
}
function head(c,flash){
 c.fillStyle=color(flash,'#d39b35');c.strokeStyle=INK;c.lineWidth=LINE;
 c.beginPath();c.moveTo(10,-3);c.quadraticCurveTo(15,-5,18.6,-1.5);
 c.quadraticCurveTo(20,1.4,17.2,3.4);c.quadraticCurveTo(12.5,4.4,10,2);c.closePath();c.fill();c.stroke();
 c.fillStyle=color(flash,'#f6d16a');c.beginPath();c.moveTo(10.5,-2.6);
 c.quadraticCurveTo(15,-4,18,-1.8);c.quadraticCurveTo(14.6,-1,11,-.3);c.closePath();c.fill();
 c.fillStyle=color(flash,'#8d5424');c.beginPath();c.moveTo(11,1.5);
 c.quadraticCurveTo(15.3,2.7,18.6,.8);c.quadraticCurveTo(17.6,4.5,11,2.6);c.closePath();c.fill();
 c.fillStyle=color(flash,'#bd3b4b');c.strokeStyle=INK;c.lineWidth=.85;
 c.beginPath();c.ellipse(16.7,-1.15,1.5,1.2,-.15,0,TAU);c.fill();c.stroke();
 c.fillStyle=color(flash,'#ffddbc');c.beginPath();c.arc(16.45,-1.5,.38,0,TAU);c.fill();
}
function jaws(c,end,open,flash){
 c.lineWidth=LINE;c.strokeStyle=INK;
 for(const side of [-1,1]){
  c.fillStyle=color(flash,side<0?'#efbd4c':'#b57b2b');
  c.beginPath();c.moveTo(16,side*2.1);
  c.quadraticCurveTo(end-2.3,side*(open+4),end,side*open);
  c.lineTo(end-2.7,side*(open+.3));c.quadraticCurveTo(17.6,side*.7,16,side*.8);c.closePath();c.fill();c.stroke();
 }
}
function front(c,tip,open,flash){jaws(c,tip,open,flash);head(c,flash);}

export function drawGildedScuttlerV4(c,m,time,seed){
 const cx=m.x+m.w/2,cy=m.y+m.h-12/SCALE,flash=m.flashTimer,action=m.familyAttack;
 c.save();c.translate(cx,cy);c.lineJoin='round';c.lineCap='round';supports(c,m,time,seed,false);
 c.save();c.rotate(Math.PI/12+Math.sin(time/370+(seed%11)*.19)*.03*(1-(action?.artWeight??0))+(action?.limb.spin??0));
 // The darker lower rim gives the coin thickness. Broad curved planes follow
 // its face instead of applying a stripe across the entire creature.
 c.fillStyle=color(flash,'#a16b27');c.beginPath();c.arc(0,0,13.5,0,TAU);c.fill();
 c.fillStyle=color(flash,'#edba49');c.beginPath();c.arc(-.7,-.9,11.7,0,TAU);c.fill();
 c.fillStyle=color(flash,'#c58a2c');c.beginPath();c.moveTo(-11,-.5);
 c.bezierCurveTo(-8,7,4,9,10.7,2.7);c.bezierCurveTo(9.6,8.9,2,12,-5.1,9.7);
 c.quadraticCurveTo(-10.1,7.4,-11,-.5);c.closePath();c.fill();
 c.fillStyle=color(flash,'#f9d976');c.beginPath();c.moveTo(-9.6,-3.9);
 c.bezierCurveTo(-8.4,-10,-1.8,-13,4,-10.5);c.quadraticCurveTo(7,-9.3,8,-7);
 c.quadraticCurveTo(-2.8,-8.8,-9.6,-3.9);c.closePath();c.fill();
 c.strokeStyle=color(flash,'#8d5d28');c.lineWidth=.95;c.beginPath();c.arc(-.7,-.9,9.3,0,TAU);c.stroke();
 c.strokeStyle=color(flash,'#513923');c.lineWidth=1.65;c.beginPath();
 c.moveTo(-4.3,-4.5);c.lineTo(2.9,2.7);c.moveTo(2.9,-4.5);c.lineTo(-4.3,2.7);c.moveTo(-.7,-6);c.lineTo(-.7,4.2);c.stroke();
 c.fillStyle=color(flash,'#fff1b5');c.beginPath();c.ellipse(-5.7,-6.9,2.1,1.05,-.55,0,TAU);c.fill();
 c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.arc(0,0,13.5,0,TAU);c.stroke();c.restore();
 // The near tripod attaches over the coin's lower face. Only the far tripod
 // belongs behind the shell; mirroring keeps the same near/far depth order.
 supports(c,m,time,seed,true);
 // Source-native orientation is left; the existing family facing map mirrors
 // the whole painter. During an action the same head is aimed independently.
 if(!action){c.save();c.scale(-1,1);front(c,16.5/SCALE,.75,flash);c.restore();}
 c.restore();
}

export function drawGildedScuttlerAttackV4(c,pose,flash=false){
 if(pose?.family!=='gilded_scuttler')return false;
 const size=pose.gildedScuttlerScale??1,scale=SCALE*size,facing=pose.idleFacingX??1;
 const angle=Math.atan2(pose.direction.y,pose.direction.x*facing)*pose.artWeight;
 c.save();c.translate(pose.body.x+pose.bodyPivot.x,pose.body.y+pose.bodyPivot.y);
 c.scale(facing,1);c.rotate(angle);c.scale(scale,scale);c.lineJoin='round';c.lineCap='round';
 front(c,(pose.limb.extension+16.5*(size-1)*(1-pose.artWeight))/scale,pose.limb.open,flash);
 c.restore();return true;
}
