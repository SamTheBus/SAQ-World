// Source motifs adapted from SAQ Dungeon 387c78bfaf9f492fe7b6ff4539b956c12c2a7cdc,
// mob_renderer.js ordinary vType branches. World owns simulation and timing.
// These seven creatures use contact melee; the lenses and wires are body art.
const TAU=Math.PI*2;
const center=m=>({x:m.x+m.w/2,y:m.y+m.h/2});
const gait=(m,time,seed,offset=0)=>Math.sin((m.stepPhase??time/90)+(seed%19)*.17+offset)*(m.motionBlend??Number(m.movedLastTick));
const attack=m=>m.familyAttack;
const ink=(m,color)=>m.flashTimer>0?'#ffffff':color;
const face=m=>attack(m)?.limb.open??0;

function draw_clockwork_scarab(c,m,time,seed){
 const p=center(m),cy=p.y+Math.sin(time/100)*2,cx=p.x,a=attack(m);
 c.save();c.lineJoin='round';c.lineCap='round';c.strokeStyle='#39291c';c.lineWidth=1.5;
 // Four hinged brass legs keep the source beetle silhouette distinct.
 for(const side of [-1,1])for(const row of [-1,1]){
  const swing=gait(m,time,seed,side+row)*2.5;c.strokeStyle=ink(m,'#7a5c1f');c.lineWidth=1.8;
  c.beginPath();c.moveTo(cx+side*6,cy+row*3);c.lineTo(cx+side*14+swing,cy+row*7);c.lineTo(cx+side*16+swing,cy+row*9);c.stroke();
 }
 c.strokeStyle='#39291c';c.lineWidth=1.5;c.fillStyle=ink(m,'#dca04c');c.beginPath();c.ellipse(cx,cy,12,9,0,0,TAU);c.fill();c.stroke();
 if(!m.flashTimer){
  c.strokeStyle='#4d2e1a';c.lineWidth=1.2;c.beginPath();c.moveTo(cx,cy-8);c.lineTo(cx,cy+8);c.stroke();
  c.save();c.translate(cx,cy);c.rotate(time/1500+(seed%11)*.1);c.fillStyle='#f1c40f';c.beginPath();c.arc(0,0,4,0,TAU);c.fill();c.stroke();
  for(const side of [-1,1]){c.beginPath();c.moveTo(side*2,-3);c.lineTo(side*2,3);c.stroke();}c.restore();
 }
 c.fillStyle=ink(m,'#6e4b23');c.beginPath();c.ellipse(cx+10,cy,4,5,0,0,TAU);c.fill();c.stroke();
 if(!a)for(const side of [-1,1]){c.fillStyle=ink(m,'#d8b675');c.beginPath();c.moveTo(cx+12,cy+side*3);c.lineTo(cx+17,cy+side*5);c.lineTo(cx+15,cy+side*.6);c.closePath();c.fill();c.stroke();}
 c.fillStyle=ink(m,'#fff2ad');for(const side of [-1,1]){c.beginPath();c.arc(cx+12,cy+side*2.5,.85,0,TAU);c.fill();}
 c.restore();
}

function draw_star_weaver(c,m,time,seed){
 const p=center(m),cx=p.x,cy=p.y+Math.sin(time/130)*2.5,a=attack(m);
 c.save();c.lineJoin='round';c.lineCap='round';
 // The source is an open blue constellation with five white joints.
 c.strokeStyle=ink(m,'#3498db');c.lineWidth=1.8;c.shadowBlur=m.flashTimer?0:2;c.shadowColor='#3498db';
 const joints=[[cx,cy-12],[cx+10,cy],[cx+6,cy+10],[cx-6,cy+10],[cx-10,cy]];
 c.beginPath();c.moveTo(...joints[0]);for(const q of joints.slice(1))c.lineTo(...q);c.closePath();c.stroke();c.shadowBlur=0;
 c.fillStyle=ink(m,'#f4fbff');for(const q of joints){c.beginPath();c.arc(...q,2.2,0,TAU);c.fill();c.stroke();}
 c.strokeStyle=ink(m,'#e6f5ff');c.lineWidth=1.5;
 for(let i=0;i<4;i++){
  const side=i%2?-1:1,row=i<2?-1:1;if(a&&side===1)continue;
  const swing=gait(m,time,seed,i)*3;c.beginPath();c.moveTo(cx+10*side,cy+row*4);c.lineTo(cx+21*side+swing,cy+row*7);c.lineTo(cx+25*side+swing,cy+row*12);c.stroke();
 }
 c.restore();
}

function draw_temporal_watcher(c,m,time,seed){
 const p=center(m),cx=p.x,cy=p.y+Math.sin(time/140)*2.5,q=face(m);
 c.save();c.translate(cx,cy);c.strokeStyle=ink(m,'#a4773b');c.lineWidth=1.2;
 c.beginPath();c.ellipse(0,0,18,6,time/800+(seed%7)*.1,0,TAU);c.stroke();
 c.fillStyle=ink(m,'#dca04c');c.strokeStyle='#362b1c';c.lineWidth=1.8;c.beginPath();c.arc(0,0,10,0,TAU);c.fill();c.stroke();
 // Iris shutters draw inward while the brass housing braces for its ram.
 c.fillStyle=ink(m,'#ffd700');c.beginPath();c.ellipse(2,-1,4.5,Math.max(1,4.5-q*2.5),0,0,TAU);c.fill();c.stroke();
 c.fillStyle=ink(m,'#fff5d0');c.beginPath();c.arc(2.5,-1.5,1.4+Math.sin(time/100)*.25,0,TAU);c.fill();
 if(q){c.strokeStyle=ink(m,'#5d431f');c.lineWidth=1;c.beginPath();c.moveTo(-3,-6);c.lineTo(5,-3-q);c.moveTo(-3,4);c.lineTo(5,1+q);c.stroke();}
 c.restore();
}

function draw_clockwork_drone(c,m,time,seed){
 const p=center(m),cx=p.x,cy=p.y+Math.sin(time/120)*3,q=face(m);
 c.save();c.translate(cx,cy);c.lineJoin='round';c.lineCap='round';
 // Source propeller/hull/lens; the rotor stays attached to its own mast.
 c.strokeStyle=ink(m,'#68716e');c.lineWidth=1.3;c.beginPath();c.moveTo(0,-7);c.lineTo(0,-12);c.stroke();
 c.save();c.translate(0,-11);c.rotate(time/80+(seed%13)*.2);c.beginPath();c.moveTo(-12,0);c.lineTo(12,0);c.stroke();c.beginPath();c.moveTo(0,-3);c.lineTo(0,3);c.stroke();c.restore();
 c.fillStyle=ink(m,'#b7950b');c.strokeStyle='#302a1a';c.lineWidth=1.8;c.beginPath();c.roundRect(-8,-8,16,14,[3]);c.fill();c.stroke();
 c.fillStyle=ink(m,'#e67e22');c.beginPath();c.ellipse(1,0,3+q,3-q*.8,0,0,TAU);c.fill();c.stroke();
 c.fillStyle=ink(m,'#fff2bd');c.beginPath();c.arc(.2,-.8,.8,0,TAU);c.fill();
 if(!attack(m)){c.strokeStyle=ink(m,'#9f8740');c.lineWidth=2;c.beginPath();c.moveTo(-5,5);c.lineTo(-7,10);c.moveTo(5,5);c.lineTo(7,10);c.stroke();}
 c.restore();
}

function draw_neon_spider(c,m,time,seed){
 const p=center(m),cx=p.x,cy=p.y,a=attack(m),q=face(m);
 c.save();c.strokeStyle=ink(m,'#ff007f');c.lineWidth=2;c.lineJoin='round';c.lineCap='round';
 c.beginPath();c.arc(cx,cy,6,0,TAU);c.stroke();
 // Four angular source legs frame the small open neon core.
 for(let i=0;i<4;i++){
  const side=i%2?-1:1,row=i<2?-1:1;if(a&&side===1)continue;
  const step=gait(m,time,seed,i)*2;c.beginPath();c.moveTo(cx,cy+row);c.lineTo(cx+12*side,cy+4*row+step);c.lineTo(cx+16*side,cy+13*row+step);c.stroke();
 }
 c.fillStyle=ink(m,'#ffa4d3');for(const side of [-1,1]){c.beginPath();c.arc(cx+3,cy+side*(2-q*.8),.8,0,TAU);c.fill();}
 c.restore();
}

function draw_wireframe_orb(c,m,time,seed){
 const p=center(m),q=face(m),a=attack(m);
 c.save();c.translate(p.x,p.y);c.rotate(time/600+(seed%11)*.09+(a?.limb.sweep??0));c.strokeStyle=ink(m,'#3498db');c.lineWidth=1.5;
 // Preserve the source rotating square; inset cross-braces expose its tumble.
 c.strokeRect(-10,-10,20,20);c.beginPath();c.moveTo(-10,-10);c.lineTo(4-q*2,-4);c.lineTo(10,-10);c.moveTo(-10,10);c.lineTo(4-q*2,4);c.lineTo(10,10);c.moveTo(4-q*2,-4);c.lineTo(4-q*2,4);c.stroke();
 c.fillStyle=ink(m,'#a5d9ff');for(const side of [-1,1]){c.beginPath();c.arc(10,side*10,1.2,0,TAU);c.fill();}c.restore();
}

const mix=v=>{v^=v>>>16;v=Math.imul(v,0x7feb352d);v^=v>>>15;v=Math.imul(v,0x846ca68b);return(v^(v>>>16))>>>0;};
function draw_cyber_wraith(c,m,time,seed){
 const p=center(m),frame=Math.floor(time/80),j=mix((seed>>>0)^frame),glitch=(j&31)===0;
 const cx=p.x+(glitch?((j>>>5)%5-2)*.5:0),cy=p.y+Math.sin(time/150)*3+(glitch?((j>>>9)%3-1)*.5:0),q=face(m);
 c.save();c.translate(cx,cy);c.lineJoin='round';c.lineCap='round';
 // Source holographic tails and dark cyan-edged hood. Jitter is seeded/bounded.
 c.fillStyle=ink(m,'rgba(0,210,255,.15)');c.strokeStyle=ink(m,'rgba(0,210,255,.55)');c.lineWidth=1.5;
 c.beginPath();c.moveTo(-10,4);c.quadraticCurveTo(-14,16,-4,24);c.lineTo(4,24);c.quadraticCurveTo(14,16,10,4);c.closePath();c.fill();c.stroke();
 c.fillStyle=ink(m,'#0f172a');c.strokeStyle=ink(m,'#00d2ff');c.lineWidth=1.8;c.beginPath();c.arc(0,-9,7.5,Math.PI,0);c.lineTo(7.5,4);c.quadraticCurveTo(4,11,0,15);c.quadraticCurveTo(-4,11,-7.5,4);c.closePath();c.fill();c.stroke();
 c.fillStyle=ink(m,'#ff007f');c.fillRect(-4,-10,8,Math.max(1,2-q));
 if(!attack(m)){c.strokeStyle=ink(m,'#7ce7f8');c.lineWidth=1.5;for(const side of [-1,1]){c.beginPath();c.moveTo(side*6,1);c.lineTo(side*10,6);c.lineTo(side*8,9);c.stroke();}}
 if(glitch&&!m.flashTimer){c.strokeStyle='#ff65af';c.lineWidth=1;c.beginPath();c.moveTo(-9,-3);c.lineTo(6,-3);c.moveTo(-4,8);c.lineTo(9,8);c.stroke();}
 c.restore();
}

export const DUNGEON_MOB_PAINTERS_V2B=Object.freeze({clockwork_scarab:draw_clockwork_scarab,star_weaver:draw_star_weaver,temporal_watcher:draw_temporal_watcher,clockwork_drone:draw_clockwork_drone,neon_spider:draw_neon_spider,wireframe_orb:draw_wireframe_orb,cyber_wraith:draw_cyber_wraith});
