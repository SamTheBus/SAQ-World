// A compact mechanical arachnid. Armor and neon insets follow articulated
// joints; the front mandibles remain separate from all eight support legs.
const TAU=Math.PI*2,INK='#11151a',LINE=1.26/.9;
const color=(flash,hex)=>flash?'#fff':hex;
function plate(c,points,fill,outline=true){
 c.fillStyle=fill;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fill();
 if(outline){c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();}
}
export function neonSpiderWalkingLegsV4(time,seed,walk=0){
 const legs=[],blend=Math.max(0,Math.min(1,walk??0));
 for(const side of [-1,1])for(let row=0;row<4;row++){
  const x=-7+row*4.5,fan=[-11,-6,2,10][row],phase=time/145+row*1.7+side+(seed%7),idle=Math.sin(time/470+row*1.3+side+(seed%11)*.37);
  const step=Math.sin(phase)*blend*2.4,lift=Math.max(0,Math.cos(phase))*blend*1.5;
  legs.push({root:{x,y:side*4},joint:{x:x+fan*.25+step*.4+idle*.55*(1-blend),y:side*(10+row*.7-lift*.45+idle*.45*(1-blend))},foot:{x:x+fan+step+idle*.15*(1-blend),y:side*(18-Math.abs(fan)*.22-lift)}});
 }
 return legs;
}
function strut(c,a,b,rootWidth,tipWidth,neon,flash){
 const d=Math.hypot(b.x-a.x,b.y-a.y)||1,ux=(b.x-a.x)/d,uy=(b.y-a.y)/d,nx=-uy,ny=ux;
 plate(c,[[a.x+nx*rootWidth,a.y+ny*rootWidth],[b.x+nx*tipWidth,b.y+ny*tipWidth],[b.x-nx*tipWidth,b.y-ny*tipWidth],[a.x-nx*rootWidth,a.y-ny*rootWidth]],color(flash,'#514761'));
 plate(c,[[a.x+nx*rootWidth*.6,a.y+ny*rootWidth*.6],[b.x+nx*tipWidth*.6,b.y+ny*tipWidth*.6],[b.x,b.y],[a.x,a.y]],color(flash,'#9384a6'),false);
 // Each rigid segment has its own inset. The strips stop before the exposed
 // pivot, making the joint's movement visible rather than bending a light tube.
 c.strokeStyle=color(flash,neon);c.lineWidth=1.15;c.lineCap='butt';c.beginPath();c.moveTo(a.x+ux*d*.22,a.y+uy*d*.22);c.lineTo(a.x+ux*d*.73,a.y+uy*d*.73);c.stroke();
}
function supports(c,m,time,seed,cx,cy){
 const at=p=>({x:cx+p.x,y:cy+p.y});
 for(const [i,l]of neonSpiderWalkingLegsV4(time,seed,m.motionBlend??0).entries()){
  const neon=i%2?'#ff4acb':'#47f3ef';
  strut(c,at(l.joint),at(l.foot),1.4,.45,neon,m.flashTimer);
  strut(c,at(l.root),at(l.joint),1.65,1.3,neon,m.flashTimer);
  c.strokeStyle=INK;c.lineWidth=LINE;c.fillStyle=color(m.flashTimer,'#888095');
  c.beginPath();c.arc(cx+l.joint.x,cy+l.joint.y,1.65,0,TAU);c.fill();c.stroke();
  c.fillStyle=color(m.flashTimer,'#262331');c.beginPath();c.arc(cx+l.joint.x,cy+l.joint.y,.6,0,TAU);c.fill();
 }
}
function head(c,scale,flash){
 c.save();c.scale(scale,scale);c.translate(8.5,0);
 plate(c,[[-5,-2],[-3.5,-3.8],[2.6,-3.8],[5,-1.8],[5,1.8],[2.6,3.8],[-3.5,3.8],[-5,2]],color(flash,'#514761'));
 plate(c,[[-4.1,-1.6],[-2.9,-3],[2.3,-3],[3.4,-2.1],[-1.4,-1]],color(flash,'#a494b4'),false);
 plate(c,[[-4.2,1],[4.4,1],[2.3,3],[-2.9,3]],color(flash,'#292334'),false);
 c.fillStyle=color(flash,'#171d2b');c.beginPath();c.roundRect(.1,-3.1,3.7,6.2,.9);c.fill();
 c.save();if(!flash){c.shadowColor='#47f3ef';c.shadowBlur=2;}
 c.fillStyle=color(flash,'#c5fffc');for(const side of [-1,1]){c.beginPath();c.arc(2.5,side*1.3,.95,0,TAU);c.fill();}c.restore();c.restore();
}
function mandibles(c,tip,open,scale,flash){
 c.save();c.scale(scale,scale);const endX=tip/scale;
 for(const side of [-1,1]){
  const pivot={x:10.8,y:side*4.1},end={x:endX,y:side*(.35+4*open)},d=Math.hypot(end.x-pivot.x,end.y-pivot.y)||1,ux=(end.x-pivot.x)/d,uy=(end.y-pivot.y)/d,nx=-uy*side,ny=ux*side;
  const knee={x:pivot.x+ux*d*.55+nx*1.2,y:pivot.y+uy*d*.55+ny*1.2};
  plate(c,[[pivot.x+nx*.8,pivot.y+ny*.8],[knee.x,knee.y],[end.x,end.y],[end.x-ux*2-nx*.45,end.y-uy*2-ny*.45],[pivot.x-nx*.8,pivot.y-ny*.8]],color(flash,'#756783'));
  c.strokeStyle=color(flash,'#ff4acb');c.lineWidth=1.15;c.lineCap='butt';c.beginPath();c.moveTo(knee.x-ux*.4,knee.y-uy*.4);c.lineTo(end.x-ux*.8,end.y-uy*.8);c.stroke();
  c.fillStyle=color(flash,'#a494b4');c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.arc(pivot.x,pivot.y,1.25,0,TAU);c.fill();c.stroke();
  c.fillStyle=color(flash,'#292334');c.beginPath();c.arc(pivot.x,pivot.y,.4,0,TAU);c.fill();
 }
 c.restore();
}
export function drawNeonSpiderV4(c,m,time,seed){
 const cx=m.x+m.w/2,cy=m.y+m.h/2,flash=m.flashTimer;
 c.save();c.lineJoin='round';supports(c,m,time,seed,cx,cy);c.translate(cx,cy);
 const hull=[[-14,-3],[-10,-8],[-2,-8],[4,-5],[5,5],[-2,8],[-10,8],[-14,3]];
 plate(c,hull,color(flash,'#514761'),false);
 plate(c,[[-14,0],[5,0],[5,5],[-2,8],[-10,8],[-14,3]],color(flash,'#292334'),false);
 plate(c,[[-10,-8],[-2,-8],[4,-5],[-3,-4],[-12,-3]],color(flash,'#a494b4'),false);
 c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.moveTo(...hull[0]);for(const p of hull.slice(1))c.lineTo(...p);c.closePath();c.stroke();
 // A separate rear plate, two vents and an armored neck make the shell read as
 // assembled hardware at small scale. Neon stays inside the armor channels.
 plate(c,[[-13,-2.7],[-9.6,-6],[-7,-5],[-9.1,0],[-7,5],[-9.6,6],[-13,2.7]],color(flash,'#3b3448'));
 plate(c,[[1.2,-5],[5.4,-3.7],[6.4,0],[5.4,3.7],[1.2,5],[-.8,2.4],[-.8,-2.4]],color(flash,'#655773'));
 c.strokeStyle=color(flash,'#191b27');c.lineWidth=1.1;for(const y of [-1.5,1.5]){c.beginPath();c.moveTo(-12,y);c.lineTo(-10.2,y);c.stroke();}
 c.save();if(!flash)c.globalAlpha*=.88+.12*Math.sin(time/350+(seed%13)*.6);
 plate(c,[[-8,-5],[-3,-5],[1,-3.1],[-.4,-1.9],[-3.4,-3.1],[-8,-3.1]],color(flash,'#47f3ef'),false);
 plate(c,[[-8,5],[-3,5],[1,3.1],[-.4,1.9],[-3.4,3.1],[-8,3.1]],color(flash,'#ff4acb'),false);c.restore();
 plate(c,[[-9,0],[-5,-3.4],[-1,0],[-5,3.4]],color(flash,'#192c38'));
 c.save();if(!flash){c.shadowColor='#47f3ef';c.shadowBlur=2.5;}
 plate(c,[[-8,0],[-5,-2.3],[-2,0],[-5,2.3]],color(flash,'#47f3ef'),false);c.restore();
 plate(c,[[-6.6,0],[-5,-1.2],[-3.4,0],[-5,1.2]],color(flash,'#dcfffc'),false);
 if(!m.familyAttack){head(c,1,flash);mandibles(c,16/.9,0,1,flash);}
 c.restore();
}
export function drawNeonSpiderAttackV4(c,pose,flash=false){
 if(pose?.family!=='neon_spider')return false;
 const size=pose.neonSpiderScale??1,scale=.9*size,facing=pose.idleFacingX??1,angle=Math.atan2(pose.direction.y,pose.direction.x*facing)*pose.artWeight;
 c.save();c.translate(pose.lunge.x+pose.bodyPivot.x,pose.lunge.y+pose.bodyPivot.y);c.scale(facing,1);c.rotate(angle);
 head(c,scale,flash);mandibles(c,pose.limb.extension+16*(size-1)*(1-pose.artWeight),pose.limb.open,scale,flash);c.restore();return true;
}
