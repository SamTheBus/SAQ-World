const SCALE=.8,LINE=1.26/SCALE,INK='#11151a',TAU=Math.PI*2;
const smooth=v=>{const p=Math.max(0,Math.min(1,v));return p*p*(3-2*p);};
const color=(flash,hex)=>flash?'#fff':hex;
export function toxicFlyMotionV4(m,time){
 const cx=m.x+m.w/2,cy=m.y+m.h/2+Math.sin(time/110)*4,cast=m.rangedPose;
 const weight=!cast?0:cast.phase==='windup'?smooth(cast.progress):1-smooth(cast.progress);
 let aim={x:0,y:-1};
 if(cast){
  const co=Math.cos(cast.body.rotation),si=Math.sin(cast.body.rotation),facing=cast.drawFacingX??1;
  const local={x:(co*cast.direction.x+si*cast.direction.y)*facing,y:-si*cast.direction.x+co*cast.direction.y};
  const angle=-Math.PI/2+Math.atan2(local.x,-local.y)*weight;
  aim={x:Math.cos(angle),y:Math.sin(angle)};
 }
 return {cx,cy,wingRadius:12+Math.sin(time/60)*11,weight,aim,headAngle:Math.atan2(aim.y,aim.x)+Math.PI/2,
  mouth:{x:cx+aim.x*8,y:cy+aim.y*8},charge:cast?.charge??0,release:cast?.release??0};
}
function ellipse(c,x,y,rx,ry,angle=0){c.beginPath();c.ellipse(x,y,rx,ry,angle,0,TAU);}
function wings(c,q){
 for(const side of [-1,1]){
  const x=q.cx+side*7,y=q.cy-4,angle=side*Math.PI/4;
  c.fillStyle='rgba(104,214,151,.4)';ellipse(c,x,y,5,q.wingRadius,angle);c.fill();
  c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();
  c.save();ellipse(c,x,y,5,q.wingRadius,angle);c.clip();c.translate(x,y);c.rotate(angle);
  c.strokeStyle='rgba(45,112,77,.65)';c.lineWidth=.65;c.beginPath();c.moveTo(0,-q.wingRadius*.65);c.quadraticCurveTo(-1,0,0,q.wingRadius*.7);c.stroke();c.restore();
 }
}
function abdomen(c,q,flash){
 const {cx:x,cy}=q,y=cy+9;
 c.fillStyle=color(flash,'#42c875');ellipse(c,x,y,5,7);c.fill();
 if(!flash){
  c.save();ellipse(c,x,y,5,7);c.clip();
  c.fillStyle='#278b50';c.beginPath();c.moveTo(x+2,y-6);c.quadraticCurveTo(x+3,y+3,x-3.8,y+4.9);c.lineTo(x-2,y+8);c.lineTo(x+6,y+8);c.lineTo(x+6,y-6);c.closePath();c.fill();
  c.fillStyle='#9ce890';ellipse(c,x-1.5,y-2.7,1.7,2.4,.35);c.fill();c.restore();
 }
 c.strokeStyle=INK;c.lineWidth=LINE;ellipse(c,x,y,5,7);c.stroke();
}
function head(c,q,flash){
 const {cx:x,cy:y}=q;
 c.save();c.translate(x,y);c.rotate(q.headAngle);
 // A short real mouthpart swivels at the round head, without stretching.
 c.strokeStyle=INK;c.lineWidth=2.7;c.beginPath();c.moveTo(0,-4.7);c.lineTo(0,-8);c.stroke();
 c.strokeStyle=color(flash,'#739c6c');c.lineWidth=1.05;c.stroke();
 c.fillStyle=color(flash,'#334956');c.beginPath();c.arc(0,0,6,0,TAU);c.fill();
 if(!flash){
  c.save();c.beginPath();c.arc(0,0,6,0,TAU);c.clip();
  c.fillStyle='#1e2d36';c.beginPath();c.moveTo(2.5,-5);c.quadraticCurveTo(4,3,-3.7,4.4);c.lineTo(0,7);c.lineTo(7,7);c.lineTo(7,-5);c.closePath();c.fill();
  c.fillStyle='#627b80';ellipse(c,-1.8,-3.6,2.6,.95,-.15);c.fill();c.restore();
 }
 c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.arc(0,0,6,0,TAU);c.stroke();
 if(!flash)for(const side of [-1,1]){
  c.fillStyle='#c4df68';c.strokeStyle=INK;c.lineWidth=1;ellipse(c,side*2.8,-1.5,2.1,2.55,side*-.18);c.fill();c.stroke();
  c.fillStyle='#eff8af';ellipse(c,side*2.8-.4,-2.3,.8,1,-.15);c.fill();
 }
 c.restore();
 if(!flash&&q.weight>0){
  c.save();c.globalAlpha*=q.weight;c.fillStyle='#91e57c';c.strokeStyle=INK;c.lineWidth=.8;
  ellipse(c,q.mouth.x,q.mouth.y,1.1+q.weight*.9,1.1+q.weight*.9);c.fill();c.stroke();c.restore();
 }
}
export function drawToxicFlyV4(c,m,time){
 const q=toxicFlyMotionV4(m,time),flash=m.flashTimer>0;
 c.save();c.lineJoin='round';c.lineCap='round';
 wings(c,q);abdomen(c,q,flash);head(c,q,flash);c.restore();
}
