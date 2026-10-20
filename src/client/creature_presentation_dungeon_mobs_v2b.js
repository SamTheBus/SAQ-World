import {drawClockworkScarabV3 as draw_clockwork_scarab,drawTemporalWatcherV3 as draw_temporal_watcher,drawClockworkDroneV3 as draw_clockwork_drone} from './creature_presentation_clockwork_v3.js';
import {drawStarWeaverV3 as draw_star_weaver,drawNeonSpiderV3 as draw_neon_spider} from './creature_presentation_arthropods_v3.js';
// Source motifs adapted from SAQ Dungeon 387c78bfaf9f492fe7b6ff4539b956c12c2a7cdc,
// mob_renderer.js ordinary vType branches. World owns simulation and timing.
// These seven creatures use contact melee; the lenses and wires are body art.
const TAU=Math.PI*2;
const center=m=>({x:m.x+m.w/2,y:m.y+m.h/2});
const attack=m=>m.familyAttack;
const ink=(m,color)=>m.flashTimer>0?'#ffffff':color;
const face=m=>attack(m)?.limb.open??0;

function draw_wireframe_orb(c,m,time,seed){
 const p=center(m),q=face(m),a=attack(m);
 c.save();c.translate(p.x,p.y);c.rotate(time/600+(seed%11)*.09+(a?.limb.sweep??0));c.strokeStyle=ink(m,'#3498db');c.lineWidth=1.5;
 // Solid faceted core under the original rotating wire lattice.
 c.fillStyle=ink(m,'#397fba');c.beginPath();c.moveTo(-10,-10);c.lineTo(10,-10);c.lineTo(10,10);c.lineTo(-10,10);c.closePath();c.fill();
 c.fillStyle=ink(m,'#a5d9ff');c.beginPath();c.moveTo(-9,-9);c.lineTo(2,-7);c.lineTo(-2,2);c.lineTo(-9,8);c.closePath();c.fill();
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
