// Client-only energy core and three real orbiting fragments.
// The leading fragment makes contact and returns; no projectile is spawned.
const SCALE=.82,LINE=1.26/SCALE,INK='#11151a',TAU=Math.PI*2;
const mix=(a,b,w)=>a+(b-a)*w;
const blend=(a,b,w)=>({x:mix(a.x,b.x,w),y:mix(a.y,b.y,w)});
const turn=x=>Math.atan2(Math.sin(x),Math.cos(x));
const color=(flash,hex)=>flash?'#fff':hex;

function local(a,p){
 const b=a.body,v=a.bodyPivot,size=a.riftDrifterScale??1,facing=a.idleFacingX??1;
 const x=p.x-b.x-v.x,y=p.y-b.y-v.y,co=Math.cos(b.rotation),si=Math.sin(b.rotation);
 return {x:((co*x+si*y)/b.scaleX+v.x)/(SCALE*size)*facing,
  y:((-si*x+co*y)/b.scaleY+v.y)/(SCALE*size)};
}

export function riftDrifterMotionV4(m,time){
 const x=m.x+m.w/2,y=m.y+m.h/2+Math.sin(time/110)*6,a=m.familyAttack;
 const weight=a?.artWeight??0,strike=a?.strikeBlend??0,reach=a?.phase==='recovery'?strike*strike:strike;
 let aim={x:1,y:0};
 if(a){const o=local(a,{x:0,y:0}),p=local(a,a.direction),d=Math.hypot(p.x-o.x,p.y-o.y);aim={x:(p.x-o.x)/d,y:(p.y-o.y)/d};}
 const normal={x:-aim.y,y:aim.x},targetAngle=Math.atan2(aim.y,aim.x);
 const shards=[0,1,2].map(i=>{
  const orbit=time/180+i*TAU/3,idle={x:x+Math.cos(orbit)*16,y:y+Math.sin(orbit)*8};
  const side=i===1?-1:i===2?1:0;
  const brace={x:x-aim.x*(i===0?11:6)+normal.x*side*7,y:y-aim.y*(i===0?11:6)+normal.y*side*7};
  const rest=blend(idle,brace,weight);
  let center=rest,angle=-Math.PI/2;
  if(a){
   angle+=turn(targetAngle-angle)*weight;
   if(i===0){
    const goal=local(a,{x:a.direction.x*a.contactReach,y:a.direction.y*a.contactReach-8});
    center=blend(rest,{x:goal.x-Math.cos(angle)*5,y:goal.y-Math.sin(angle)*5},reach);
   }else{
    const guard={x:x-aim.x*4+normal.x*side*11,y:y-aim.y*4+normal.y*side*11};
    center=blend(rest,guard,strike);
   }
  }
  const u={x:Math.cos(angle),y:Math.sin(angle)},n={x:-u.y,y:u.x};
  const vertices=[{x:center.x+u.x*5,y:center.y+u.y*5},{x:center.x+n.x*3.5,y:center.y+n.y*3.5},
   {x:center.x-u.x*5,y:center.y-u.y*5},{x:center.x-n.x*3.5,y:center.y-n.y*3.5}];
  return {index:i,center,angle,vertices,leading:i===0};
 });
 return {x,y,shards};
}

function core(c,{x,y}){
 c.beginPath();c.moveTo(x+1,y-10);c.lineTo(x+6,y-3);c.lineTo(x+4,y+1);
 c.lineTo(x+5,y+5);c.lineTo(x-1,y+11);c.lineTo(x-6,y+4);
 c.lineTo(x-4,y-1);c.lineTo(x-5,y-5);c.closePath();
}
function shard(c,a,flash){
 const v=a.vertices;c.beginPath();c.moveTo(v[0].x,v[0].y);
 for(let i=1;i<4;i++)c.lineTo(v[i].x,v[i].y);c.closePath();
 c.fillStyle=color(flash,'#8e44ad');c.fill();
 if(!flash){
  c.fillStyle='#c381d9';c.beginPath();c.moveTo(v[0].x,v[0].y);c.lineTo(a.center.x,a.center.y);
  c.lineTo(v[3].x,v[3].y);c.closePath();c.fill();
  c.fillStyle='#4b1a64';c.beginPath();c.moveTo(v[1].x,v[1].y);c.lineTo(v[2].x,v[2].y);
  c.lineTo(a.center.x,a.center.y);c.closePath();c.fill();
 }
 c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.moveTo(v[0].x,v[0].y);
 for(let i=1;i<4;i++)c.lineTo(v[i].x,v[i].y);c.closePath();c.stroke();
}

export function drawRiftDrifterV4(c,m,time,seed){
 const q=riftDrifterMotionV4(m,time),flash=m.flashTimer>0,{x,y}=q;
 c.save();c.lineJoin='round';
 const g=c.createRadialGradient(x,y,1,x,y,12);
 g.addColorStop(0,'#fff');g.addColorStop(.4,'#e84393');g.addColorStop(1,'rgba(142,68,173,0)');
 c.fillStyle=g;c.beginPath();c.arc(x,y,12,0,TAU);c.fill();
 for(const a of q.shards.filter(a=>a.center.y<y))shard(c,a,flash);
 c.fillStyle=color(flash,'#e84393');core(c,q);c.fill();
 if(!flash){
  c.save();core(c,q);c.clip();c.fillStyle='#f88fc3';c.beginPath();
  c.moveTo(x+1,y-10);c.lineTo(x-5,y-5);c.lineTo(x-4,y-1);c.lineTo(x-6,y+4);
  c.lineTo(x-1,y+11);c.lineTo(x-1,y+1);c.lineTo(x+2,y-4);c.closePath();c.fill();
  c.fillStyle='#a5266f';c.beginPath();c.moveTo(x+6,y-3);c.lineTo(x+4,y+1);c.lineTo(x+5,y+5);
  c.lineTo(x-1,y+11);c.lineTo(x+1,y+2);c.closePath();c.fill();c.restore();
 }
 c.strokeStyle=INK;c.lineWidth=LINE;core(c,q);c.stroke();
 if(!flash){
  c.fillStyle='#fff3fa';c.beginPath();c.moveTo(x-1,y-7);c.lineTo(x+1,y-2);
  c.lineTo(x-1.5,y+1);c.lineTo(x+1,y);c.lineTo(x-2,y+7);c.lineTo(x+2,y+2);
  c.lineTo(x+.6,y-1);c.lineTo(x+2,y-5);c.closePath();c.fill();
 }
 for(const a of q.shards.filter(a=>a.center.y>=y))shard(c,a,flash);
 c.restore();
}
