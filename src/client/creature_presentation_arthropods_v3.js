// Walking legs and front attack anatomy are separate structures in every pose.
const TAU=Math.PI*2;
const ink=(m,color)=>m.flashTimer?'#fff':color;
const center=m=>({x:m.x+m.w/2,y:m.y+m.h/2});
export function arthropodWalkingLegsV3(family,time,seed,walk=0){
 const count=family==='star_weaver'?3:4,legs=[];
 for(const side of [-1,1])for(let row=0;row<count;row++){
  const x=-7+row*4.5,fan=(count===3?[-10,-2,9]:[-11,-6,2,10])[row],step=Math.sin(time/100+row*1.7+side+(seed%7))*(walk??0)*2;
  legs.push({root:{x,y:side*4},joint:{x:x+fan*.5+step,y:side*(10+row*.7)},foot:{x:x+fan+step,y:side*(18-Math.abs(fan)*.22)}});
 }
 return legs;
}
function drawWalking(c,m,family,time,seed,cx,cy){
 const star=family==='star_weaver',legs=arthropodWalkingLegsV3(family,time,seed,m.motionBlend??0);
 c.save();c.strokeStyle=ink(m,star?'#142c40':'#31182e');c.lineWidth=star?4.1:4.4;c.lineJoin='round';c.lineCap='round';
 for(const l of legs){c.beginPath();c.moveTo(cx+l.root.x,cy+l.root.y);c.lineTo(cx+l.joint.x,cy+l.joint.y);c.lineTo(cx+l.foot.x,cy+l.foot.y);c.stroke();}
 c.strokeStyle=ink(m,star?'#83c6e7':'#d93491');c.lineWidth=2.4;
 for(const l of legs){c.beginPath();c.moveTo(cx+l.root.x,cy+l.root.y);c.lineTo(cx+l.joint.x,cy+l.joint.y);c.lineTo(cx+l.foot.x,cy+l.foot.y);c.stroke();}
 // A single hard highlight plane keeps each limb solid at world scale.
 c.strokeStyle=ink(m,star?'#d3f0ff':'#ff9cd4');c.lineWidth=.8;
 for(const l of legs){c.beginPath();c.moveTo(cx+l.root.x,cy+l.root.y-.6);c.lineTo(cx+l.joint.x,cy+l.joint.y-.6);c.stroke();}
 c.restore();
}
function drawHead(c,x,y,scale,star,flash){
 c.save();c.translate(x,y);c.scale(scale,scale);c.strokeStyle=flash?'#fff':star?'#142c40':'#31182e';c.lineWidth=1.5;c.fillStyle=flash?'#fff':star?'#68afd2':'#c93b8c';c.beginPath();c.ellipse(0,0,5,4,0,0,TAU);c.fill();c.stroke();
 c.fillStyle=flash?'#fff':star?'#386c94':'#73234f';c.beginPath();c.moveTo(-4,1);c.lineTo(4,1);c.quadraticCurveTo(2,4,-2,3);c.closePath();c.fill();
 c.fillStyle=flash?'#fff':star?'#c7efff':'#ff9dce';c.beginPath();c.ellipse(-1.2,-1.8,2.7,1.1,0,0,TAU);c.fill();
 c.fillStyle=flash?'#fff':star?'#efffff':'#ffd3ee';for(const side of [-1,1]){c.beginPath();c.arc(2,side*1.8,1,0,TAU);c.fill();}c.restore();
}
function drawFront(c,star,tip,open,scale,flash){
 const root=star?7*scale:11*scale;
 c.save();c.lineCap='round';c.lineJoin='round';
 for(const side of [-1,1]){
  if(star){
   const joint=root+(tip-root)*.52,y=side*(2.2+3.5*open);c.strokeStyle=flash?'#fff':'#142c40';c.lineWidth=4.5;c.beginPath();c.moveTo(root,side*3.8);c.quadraticCurveTo(joint,side*7,joint,y);c.lineTo(tip,side*(.8+2.2*open));c.stroke();
   c.strokeStyle=flash?'#fff':'#92cdeb';c.lineWidth=2.7;c.beginPath();c.moveTo(root,side*3.8);c.quadraticCurveTo(joint,side*7,joint,y);c.lineTo(tip,side*(.8+2.2*open));c.lineTo(tip-2,side*.3);c.stroke();
   c.strokeStyle=flash?'#fff':'#e1f5ff';c.lineWidth=.8;c.beginPath();c.moveTo(root,side*3.8-1);c.lineTo(joint,y-1);c.stroke();
   c.fillStyle=flash?'#fff':'#7fc9f5';c.beginPath();c.arc(joint,y,1.4,0,TAU);c.fill();
  }else{
   const spread=1.2+3*open;c.fillStyle=flash?'#fff':'#f6b7da';c.strokeStyle=flash?'#fff':'#54203d';c.lineWidth=1.2;c.beginPath();c.moveTo(root,side*2);c.quadraticCurveTo(tip-1,side*(spread+2),tip,side*spread);c.lineTo(tip-2,side*.3);c.quadraticCurveTo(root+2,side*.7,root,side*2);c.fill();c.stroke();
  }
 }
 c.restore();
}
export function drawStarWeaverV3(c,m,time,seed){
 const p=center(m),cy=p.y+Math.sin(time/130)*2.5;
 c.save();drawWalking(c,m,'star_weaver',time,seed,p.x,cy);c.lineJoin='round';c.strokeStyle=ink(m,'#142c40');c.lineWidth=1.8;
 const joints=[[p.x,cy-12],[p.x+10,cy],[p.x+6,cy+10],[p.x-6,cy+10],[p.x-10,cy]];
 c.fillStyle=ink(m,'#5798c2');c.beginPath();c.moveTo(...joints[0]);for(const q of joints.slice(1))c.lineTo(...q);c.closePath();c.fill();c.stroke();
 c.fillStyle=ink(m,'#2e527c');c.beginPath();c.moveTo(p.x-10,cy);c.lineTo(p.x+10,cy);c.lineTo(p.x+6,cy+10);c.lineTo(p.x-6,cy+10);c.closePath();c.fill();
 c.fillStyle=ink(m,'#b1e3f4');c.beginPath();c.moveTo(p.x,cy-10);c.lineTo(p.x+6,cy-2);c.lineTo(p.x-7,cy-1);c.closePath();c.fill();
 c.fillStyle=ink(m,'#efffff');for(const q of joints){c.beginPath();c.arc(...q,2.2,0,TAU);c.fill();}
 c.strokeStyle=ink(m,'#e0f7ff');c.lineWidth=.8;c.beginPath();c.moveTo(p.x,cy-8);c.lineTo(p.x-5,cy+5);c.lineTo(p.x+6,cy-1);c.lineTo(p.x,cy-8);c.stroke();
 if(!m.familyAttack){drawHead(c,p.x+10,cy,1,true,m.flashTimer);c.save();c.translate(p.x,cy);drawFront(c,true,12/.78,.25,1,m.flashTimer);c.restore();}c.restore();
}
export function drawNeonSpiderV3(c,m,time,seed){
 const p=center(m),cy=p.y;
 c.save();drawWalking(c,m,'neon_spider',time,seed,p.x,cy);c.strokeStyle=ink(m,'#31182e');c.lineWidth=1.7;
 c.fillStyle=ink(m,'#d33990');c.beginPath();c.ellipse(p.x-3,cy,10,7.5,0,0,TAU);c.fill();c.stroke();
 c.save();c.beginPath();c.ellipse(p.x-3,cy,9.3,6.8,0,0,TAU);c.clip();
 c.fillStyle=ink(m,'#762450');c.beginPath();c.moveTo(p.x-13,cy+1);c.lineTo(p.x+7,cy-1);c.lineTo(p.x+7,cy+7.5);c.lineTo(p.x-13,cy+7.5);c.closePath();c.fill();
 c.fillStyle=ink(m,'#ff82c2');c.beginPath();c.moveTo(p.x-12,cy-4);c.lineTo(p.x-3,cy-7);c.lineTo(p.x+4,cy-3);c.lineTo(p.x-9,cy-2);c.closePath();c.fill();c.restore();
 c.fillStyle=ink(m,'#6a214e');c.beginPath();c.moveTo(p.x-8,cy);c.lineTo(p.x-4,cy-3);c.lineTo(p.x,cy);c.lineTo(p.x-4,cy+3);c.closePath();c.fill();c.strokeStyle=ink(m,'#ffd1eb');c.lineWidth=1;c.stroke();
 if(!m.familyAttack){drawHead(c,p.x+8.5,cy,1,false,m.flashTimer);c.save();c.translate(p.x,cy);drawFront(c,false,16/.9,0,1,m.flashTimer);c.restore();}c.restore();
}
export function drawArthropodAttackV3(c,pose,flash=false){
 if(!pose||!['star_weaver','neon_spider'].includes(pose.family))return false;
 const star=pose.family==='star_weaver',scale=star?.78:.9,time=(pose.presentationTick??0)*1000/60,bob=star?Math.sin(time/130)*2.5*scale:0;
 c.save();c.translate(pose.lunge.x+pose.bodyPivot.x,pose.lunge.y+pose.bodyPivot.y+bob);c.rotate(Math.atan2(pose.direction.y,pose.direction.x));
 drawHead(c,(star?10:8.5)*scale,0,scale,star,flash);drawFront(c,star,pose.limb.extension,pose.limb.open,scale,flash);c.restore();return true;
}
