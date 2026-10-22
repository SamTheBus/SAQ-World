import {brimstoneAttackPose,brimstoneArmAngles,drawBrimstoneAttackGround} from './brimstone_attack_effects_v2.js';
export {brimstoneEffectDepthItems} from './brimstone_attack_effects_v2.js';
import {BRIMSTONE_ID,BRIMSTONE as C} from '../shared/content/brimstone_colossus_v1.js';
import {presentCombat} from '../shared/contracts/combat_amount.js';

const TAU=Math.PI*2,INK='#101316',IRON='#454955',LIT='#777d89',SHADE='#292c37',DEEP='#1c2029',ORANGE='#f56829',HOT='#ffcb61';
const clamp=v=>Math.max(0,Math.min(1,v));
function poly(c,p,fill,edge=true){c.beginPath();c.moveTo(...p[0]);for(const v of p.slice(1))c.lineTo(...v);c.closePath();c.fillStyle=fill;c.fill();if(edge){c.strokeStyle=INK;c.lineWidth=1.26;c.lineJoin='round';c.stroke();}}
function ellipse(c,x,y,rx,ry,fill,edge=true){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=fill;c.fill();if(edge){c.strokeStyle=INK;c.lineWidth=1.26;c.stroke();}}
function flame(c,x,y,s,t){
 c.save();c.translate(x,y);c.scale(s,s);const bend=Math.sin(t*.11)*2;
 poly(c,[[-5,1],[-7,-5],[-3,-10],[bend,-19],[3,-10],[7,-5],[5,1]],ORANGE,false);
 poly(c,[[-3,1],[-3,-6],[1,-12],[4,-4],[3,1]],HOT,false);c.restore();
}
function arm(c,side,raise,impact,t,flash,hand=null,heat=0){
 const angles=hand?brimstoneArmAngles(side,hand):null;
 c.save();c.translate(side*28,-61);c.rotate(angles?angles.upper:side*(-.12-raise*1.5+impact*.4));
 // Upper arm and mechanical elbow stay attached throughout the slam.
 poly(c,[[-8,-5],[8,-5],[10,15],[7,22],[-6,22],[-10,14]],flash?HOT:SHADE);
 poly(c,[[-8,-5],[2,-5],[3,16],[-6,19],[-10,14]],LIT,false);
 ellipse(c,0,21,7,7,DEEP);ellipse(c,0,21,3,3,ORANGE,false);
 c.translate(0,23);c.rotate(angles?angles.lower:side*(raise*.4+Math.sin(t*.06)*.015));
 poly(c,[[-12,-1],[10,-1],[14,10],[11,28],[-11,28],[-15,12]],flash?HOT:IRON);
 poly(c,[[-12,-1],[1,-1],[-1,20],[-11,28],[-15,12]],LIT,false);
 poly(c,[[7,0],[10,-1],[14,10],[11,28],[4,24]],SHADE,false);
 poly(c,[[-11,21],[11,21],[13,30],[6,35],[-9,33],[-14,27]],flash?HOT:SHADE);
 poly(c,[[-11,21],[7,21],[5,26],[-11,27],[-14,25]],IRON,false);
 // One broad heat seam instead of etched noise.
 poly(c,[[-7,3],[-1,7],[-4,12],[3,17],[0,19],[-8,12],[-5,8]],ORANGE,false);
 c.strokeStyle=INK;c.lineWidth=1.1;c.beginPath();c.moveTo(-5,27);c.lineTo(-5,32);c.moveTo(3,27);c.lineTo(3,33);c.stroke();
 if(heat>0){c.save();c.globalAlpha=heat;poly(c,[[-10,22],[7,22],[8,25],[-11,26]],HOT,false);for(let i=0;i<2;i++){const d=(t*.7+i*11)%24,x=-6+i*11;c.globalAlpha=heat*(1-d/24);poly(c,[[x,-d+18],[x+1.4,-d+20],[x,-d+22],[x-1,-d+20]],ORANGE,false);}c.restore();}
 c.restore();
}
export function drawBrimstoneColossus(c,a,tick,flash=false){
 const b=a.boss;if(b?.bossDefinitionId!==BRIMSTONE_ID)return false;
 const ability=b.pendingAction?.ability,pose=brimstoneAttackPose(b,tick),raising=0,punch=0;
 const walk=a.movedLastTick?Math.sin(tick*TAU/30):0,breath=Math.sin(tick*.055),lean=Math.cos(b.facingAngle??1.57)*2.2;
 c.save();c.translate(a.position.x,a.position.y);
 c.globalAlpha=a.alive===false?.45:1;
 ellipse(c,0,4,40,12,'#10131a44',false);
 // Grounded, separate feet; gait is a weight shift, never a flipped sprite.
 for(const side of[-1,1]){
  const step=side*walk*1.5;c.save();c.translate(side*15,step);
  poly(c,[[-9,-29],[9,-29],[10,-9],[7,-3],[-10,-3],[-12,-12]],SHADE);
  poly(c,[[-8,-28],[3,-28],[2,-12],[-8,-7],[-12,-12]],LIT,false);
  poly(c,[[-10,-10],[7,-10],[12,-3],[12,4],[-13,4],[-15,-1]],IRON);
  poly(c,[[-10,-10],[5,-10],[7,-6],[-10,-4],[-15,-1]],LIT,false);
  poly(c,[[5,-9],[7,-10],[12,-3],[12,4],[5,3]],SHADE,false);
  c.restore();
 }
 c.translate(lean,breath*.7+pose.drop);
 if(pose.strikeSide!==-1)arm(c,-1,raising,0,tick,flash,pose.hands[-1],pose.heat);
 if(pose.strikeSide!==1)arm(c,1,raising+punch*.6,0,tick,flash,pose.hands[1],pose.heat);
 // Molten joints sit beneath broad obsidian plate planes.
 poly(c,[[-17,-35],[-23,-62],[-11,-75],[12,-75],[24,-60],[16,-33],[0,-24]],flash?HOT:DEEP);
 poly(c,[[-19,-65],[-7,-72],[-6,-38],[-13,-32]],ORANGE,false);
 poly(c,[[17,-65],[9,-70],[6,-39],[13,-32]],ORANGE,false);
 poly(c,[[-26,-70],[0,-78],[26,-70],[21,-51],[12,-45],[-13,-45],[-23,-53]],flash?HOT:IRON);
 poly(c,[[-26,-70],[0,-78],[6,-70],[-7,-58],[-23,-53]],LIT,false);
 poly(c,[[14,-73],[26,-70],[21,-51],[12,-45],[6,-54]],SHADE,false);
 // Deep furnace opening, a warm stepped core and two solid protective ribs.
 poly(c,[[-12,-56],[0,-62],[13,-55],[12,-37],[0,-30],[-12,-38]],INK);
 poly(c,[[-8,-53],[1,-58],[9,-52],[8,-40],[0,-35],[-8,-41]],ORANGE,false);
 poly(c,[[-5,-51],[1,-56],[5,-50],[4,-42],[0,-39],[-4,-44]],HOT,false);
 poly(c,[[-2,-48],[1,-51],[3,-47],[0,-43]],'#fff0ba',false);
 c.strokeStyle=IRON;c.lineWidth=2.7;c.beginPath();c.moveTo(-10,-49);c.lineTo(10,-49);c.moveTo(-10,-41);c.lineTo(9,-41);c.stroke();
 poly(c,[[-21,-39],[-11,-42],[0,-33],[11,-42],[21,-39],[15,-28],[0,-21],[-15,-28]],IRON);
 poly(c,[[-21,-39],[-11,-42],[0,-33],[0,-26],[-15,-28]],LIT,false);
 // Angular pauldrons are distinct from the golem's stone boulders.
 for(const side of[-1,1]){
  c.save();c.scale(side,1);
  poly(c,[[18,-73],[28,-83],[43,-79],[39,-69],[48,-60],[28,-61],[23,-65]],flash?HOT:IRON);
  poly(c,[[18,-73],[28,-83],[43,-79],[35,-75],[27,-70]],LIT,false);
  poly(c,[[35,-75],[39,-69],[48,-60],[28,-61],[27,-66]],SHADE,false);
  poly(c,[[30,-79],[34,-91],[39,-80]],'#bc743e');
  poly(c,[[30,-69],[37,-68],[33,-66]],ORANGE,false);
  c.restore();
 }
 // Sulfur horns curve up from a squat armoured helmet, preserving Ignis.
 c.save();c.translate(lean*.45,-1-breath*.3);
 for(const side of[-1,1]){
  c.save();c.scale(side,1);c.beginPath();c.moveTo(9,-84);c.bezierCurveTo(20,-89,27,-103,26,-114);c.bezierCurveTo(35,-102,32,-89,16,-78);c.closePath();c.fillStyle=flash?HOT:'#c18747';c.fill();c.strokeStyle=INK;c.lineWidth=1.26;c.stroke();
  c.beginPath();c.moveTo(15,-85);c.bezierCurveTo(24,-92,28,-102,26,-112);c.bezierCurveTo(30,-105,29,-94,19,-84);c.closePath();c.fillStyle='#edbf70';c.fill();c.restore();
 }
 poly(c,[[-13,-97],[0,-102],[14,-96],[15,-78],[9,-69],[-10,-70],[-15,-80]],flash?HOT:IRON);
 poly(c,[[-13,-97],[0,-102],[3,-95],[-1,-87],[-14,-83]],LIT,false);
 poly(c,[[7,-99],[14,-96],[15,-78],[9,-69],[4,-74]],SHADE,false);
 poly(c,[[-12,-88],[11,-88],[10,-81],[0,-78],[-11,-82]],INK);
 poly(c,[[-9,-86],[-1,-85],[-2,-82],[-9,-83]],HOT,false);
 poly(c,[[2,-85],[9,-86],[9,-83],[3,-82]],HOT,false);
 poly(c,[[-3,-89],[3,-89],[2,-78],[0,-75],[-3,-78]],SHADE);
 c.restore();
 if(pose.strikeSide)arm(c,pose.strikeSide,0,0,tick,flash,pose.hands[pose.strikeSide],pose.heat);
 // Heat stays local to the furnace; there is no whole-body shading filter.
 for(let i=0;i<3;i++){
  const age=(tick* .6+i*17)%53,x=Math.sin(i*3.2+tick*.018)*(8+age*.12),y=-59-age*.65;
  c.globalAlpha=(1-age/53)*.75;poly(c,[[x,y-1.5],[x+1,y],[x,y+1.5],[x-1,y]],i%2?HOT:ORANGE,false);
 }c.globalAlpha=1;
 if(ability==='magma_vents'){flame(c,-5,-60,.48, tick);flame(c,6,-60,.36,tick+10);}
 c.restore();return true;
}
export function drawBrimstoneGround(c,model,tick){drawBrimstoneAttackGround(c,model,tick);}
export function drawBrimstoneBossHud(c,canvas,model){
 const a=Object.values(model.entitiesById).find(a=>a.alive&&a.boss?.bossDefinitionId===BRIMSTONE_ID);if(!a)return false;
 const b=a.boss,w=Math.min(480,canvas.width-24),x=(canvas.width-w)/2,y=10;
 const ratio=a.hp&&typeof a.hp.m==='number'&&typeof a.maxHp?.m==='number'?clamp(a.hp.m/a.maxHp.m):clamp(presentCombat(a.hp)/Math.max(1,presentCombat(a.maxHp)));
 c.save();c.fillStyle='#15151fed';c.strokeStyle='#cc8b4e';c.lineWidth=1.3;c.beginPath();c.roundRect(x,y,w,58,7);c.fill();c.stroke();c.fillStyle='#f5ddbe';c.font='bold 13px sans-serif';c.textAlign='center';c.fillText(C.label,canvas.width/2,y+17);
 c.fillStyle='#352d36';c.fillRect(x+12,y+24,w-24,8);c.fillStyle='#e46e39';c.fillRect(x+12,y+24,(w-24)*ratio,8);
 c.font='11px sans-serif';c.fillStyle=HOT;const labels={strike:'Gauntlet strike',slam:'Molten slam — move out of the ring',magma_vents:'Magma vents — watch the cross-shaped fissures'};c.fillText(labels[b.pendingAction?.ability]??'Brimstone furnace',canvas.width/2,y+47);c.restore();return true;
}
