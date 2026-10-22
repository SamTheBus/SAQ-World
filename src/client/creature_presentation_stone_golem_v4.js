// Stone Golem polish: retain the original silhouette, levitation and blue core.
// Facets and moss live inside the existing stones. No actor state is changed.
const TAU=Math.PI*2,INK='#11151a',STONE='#4a5568',LIGHT='#718096',DARK='#303d50',BLUE='#38bdf8';
const color=(flash,hex)=>flash?'#fff':hex;
function polygon(c,points,fill){c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fillStyle=fill;c.fill();}
function blockPath(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,[r]);}
export function drawGolemStoneBlockV4(c,x,y,w,h,r,flash=false,line=1.8,head=false){
 const bevel=Math.min(w,h)*.22,base=head?LIGHT:STONE,light=head?'#9aaab8':'#788a9e',dark=head?'#4a5b70':DARK;
 c.save();blockPath(c,x,y,w,h,r);c.fillStyle=color(flash,base);c.fill();
 if(!flash){
  c.save();blockPath(c,x,y,w,h,r);c.clip();
  polygon(c,[[x,y],[x+w,y],[x+w-bevel,y+bevel],[x+bevel,y+bevel],[x,y+h*.48]],light);
  polygon(c,[[x+w,y],[x+w,y+h],[x+w-bevel*1.25,y+h],[x+w-bevel,y+bevel]],dark);
  polygon(c,[[x,y+h],[x+w,y+h],[x+w-bevel,y+h-bevel*.65],[x+bevel,y+h-bevel*.65]],dark);
  c.restore();
  // A single shallow chip reads as stone without covering the face in cracks.
  c.strokeStyle=dark;c.lineWidth=.7;c.beginPath();c.moveTo(x+w*.72,y+1.2);
  c.lineTo(x+w*.65,y+bevel*.85);c.lineTo(x+w*.76,y+bevel*1.2);c.stroke();
 }
 blockPath(c,x,y,w,h,r);c.strokeStyle=INK;c.lineWidth=line;c.stroke();c.restore();
}
function torsoPath(c,cx,cy){
 c.beginPath();c.moveTo(cx-12,cy-7);c.lineTo(cx+12,cy-7);c.lineTo(cx+15,cy+5);
 c.lineTo(cx,cy+16);c.lineTo(cx-15,cy+5);c.closePath();
}
function moss(c,cx,cy){
 c.fillStyle='#456a34';c.beginPath();c.moveTo(cx-9,cy-5);c.quadraticCurveTo(cx-6,cy-7,cx-4,cy-5);
 c.quadraticCurveTo(cx-1,cy-5,cx-2,cy-2);c.quadraticCurveTo(cx-1,cy,cx-4,cy);
 c.lineTo(cx-6,cy-1);c.quadraticCurveTo(cx-9,cy-1,cx-9,cy-5);c.closePath();c.fill();
 c.fillStyle='#78974d';c.beginPath();c.moveTo(cx-9,cy-5);c.quadraticCurveTo(cx-6,cy-7,cx-4,cy-5);
 c.quadraticCurveTo(cx-2,cy-5,cx-2,cy-3);c.lineTo(cx-4,cy-3);c.quadraticCurveTo(cx-6,cy-5,cx-9,cy-4);c.closePath();c.fill();
 c.fillStyle='#456a34';c.beginPath();c.moveTo(cx+4,cy+2);c.quadraticCurveTo(cx+4,cy-1,cx+7,cy);
 c.quadraticCurveTo(cx+9,cy-1,cx+10,cy+1);c.lineTo(cx+10,cy+3);
 c.quadraticCurveTo(cx+11,cy+5,cx+8,cy+5);c.quadraticCurveTo(cx+6,cy+7,cx+5,cy+4);c.closePath();c.fill();
 c.fillStyle='#78974d';c.beginPath();c.moveTo(cx+4,cy+2);c.quadraticCurveTo(cx+4,cy-1,cx+7,cy);
 c.quadraticCurveTo(cx+9,cy-1,cx+10,cy+1);c.lineTo(cx+7,cy+3);c.closePath();c.fill();
}
export function drawStoneGolemV4(c,m,time){
 const phase=m.meleePhase?.phase??(m.meleeAction?'impact':'idle'),p=m.phaseProgress??0;
 const windup=phase==='windup'?p:0,impact=phase==='impact'?1-p*.28:0;
 const hover=phase!=='idle'?-windup*3+impact*4:Math.sin(time/200)*3.5;
 const cx=m.x+m.w/2,cy=m.y+m.h/2+hover,flash=m.flashTimer>0;
 c.save();c.lineJoin='round';c.lineCap='round';
 for(const side of [-1,1]){
  c.save();c.translate(cx+side*11,cy-10);c.rotate(side*.2+Math.sin(time/400+side)*.1);
  drawGolemStoneBlockV4(c,-5,-5,10,12,2,flash);c.restore();
 }
 torsoPath(c,cx,cy);c.fillStyle=color(flash,STONE);c.fill();
 if(!flash){
  c.save();torsoPath(c,cx,cy);c.clip();
  polygon(c,[[cx-12,cy-7],[cx+12,cy-7],[cx+9,cy-3],[cx-9,cy-3]],'#788a9e');
  polygon(c,[[cx-12,cy-7],[cx-9,cy-3],[cx-10,cy+3],[cx,cy+16],[cx-15,cy+5]],LIGHT);
  polygon(c,[[cx+12,cy-7],[cx+15,cy+5],[cx,cy+16],[cx+6,cy+5],[cx+9,cy-3]],DARK);
  c.strokeStyle=DARK;c.lineWidth=.8;c.beginPath();c.moveTo(cx-1,cy-2);c.lineTo(cx+1,cy+1);c.lineTo(cx-1,cy+4);c.stroke();
  moss(c,cx,cy);c.restore();
 }
 torsoPath(c,cx,cy);c.strokeStyle=INK;c.lineWidth=1.8;c.stroke();
 const headY=cy-20;
 drawGolemStoneBlockV4(c,cx-8,headY-7,16,14,4,flash,1.8,true);
 if(!flash){
  const pulse=.8+Math.sin(time/150)*.2;
  c.save();c.shadowBlur=10*pulse;c.shadowColor=BLUE;c.fillStyle=BLUE;
  c.beginPath();c.arc(cx,headY,3.2*pulse,0,TAU);c.fill();
  c.fillStyle='#fff';c.beginPath();c.arc(cx,headY,1,0,TAU);c.fill();c.restore();
 }
 if(!m.familyAttack)for(const side of [-1,1]){
  const handX=cx+side*(18+windup*2+impact*6),handY=cy+3+Math.sin(time/250+side)*2-windup*4+impact*3;
  c.save();c.translate(handX,handY);c.rotate(side*.15);
  drawGolemStoneBlockV4(c,-6,-7,12,16,3,flash);
  if(!flash){
   c.strokeStyle=BLUE;c.lineWidth=1.2;c.globalAlpha=.6+Math.sin(time/150)*.4;
   c.beginPath();c.moveTo(-2.5,-1.5);c.lineTo(2.5,-1.5);c.moveTo(0,-3.5);c.lineTo(0,1.5);c.stroke();
  }
  c.restore();
 }
 c.restore();
}
