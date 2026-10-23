// Hand-authored Canvas silhouettes for the eight restored World boss identities.
// Rendering follows authoritative phase/tick records; it never decides damage or targeting.
import {recoveredBossForId} from '../shared/content/recovered_boss_catalog_v1.js';
import {hasArchivedBossPainter,drawArchivedBossActor,drawArchivedBossGround,drawArchivedBossHud} from './boss_archive_world_adapter_v1.js';
const TAU=Math.PI*2;
const circle=(c,x,y,r,fill,stroke=null,width=1)=>{c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}};
const poly=(c,pts,fill,stroke='#101925',w=2)=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}};
const line=(c,pts,color,width=2)=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke();};
const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
function gear(c,x,y,r,teeth,tick,sign=1){c.save();c.translate(x,y);c.rotate(tick*.006*sign);let pts=[];for(let i=0;i<teeth*4;i++){const a=i*TAU/(teeth*4),rad=i%4<2?r+3:r-3;pts.push([Math.cos(a)*rad,Math.sin(a)*rad]);}poly(c,pts,'#32425b','#edd99f',2);circle(c,0,0,r*.48,'#1b2334','#e5c37a',2);circle(c,0,0,3,'#c9f6ff');c.restore();}
function blob(c,tick,color){const p=[];for(let i=0;i<32;i++){const a=i*TAU/32,r=34+4*Math.sin(a*5+tick*.035)+2*Math.sin(a*9-tick*.024);p.push([Math.cos(a)*r,Math.sin(a)*r*.82]);}poly(c,p,color,'#2a443b',3);}
function rabbit(c,x,y,q){c.save();c.translate(x,y-Math.abs(Math.sin(q))*7);c.rotate(Math.sin(q*.7)*.12);circle(c,0,0,6,'#c5a48b','#462b2b',1.4);circle(c,5,-4,4,'#a88971');poly(c,[[4,-7],[3,-18],[6,-17],[8,-7]],'#b5a28b');poly(c,[[10,-6],[10,-16],[13,-13],[13,-5]],'#b5a28b');circle(c,7,-4,1,'#1b1417');c.restore();}
function drawCinderhart(c,a,t){
 const step=Math.sin(t*.12)*3;
 for(const side of[-1,1]){const x=side*14;line(c,[[x,1],[x+side*5,12+step*side],[x+side*7,23]],'#302a2a',6);line(c,[[x+side*7,23],[x+side*11,23]],'#180f12',3);}
 poly(c,[[-26,-8],[-18,-27],[14,-27],[29,-7],[14,5],[-20,5]],'#452b29','#15161b',3);
 poly(c,[[-2,-20],[12,-43],[24,-48],[31,-35],[23,-17]],'#3b2727');
 for(const side of[-1,1]){line(c,[[side*18,-38],[side*24,-57],[side*34,-70]],'#342c2b',5);
  line(c,[[side*24,-57],[side*16,-73]],'#c97a36',3);line(c,[[side*30,-65],[side*41,-62]],'#cb723c',2);}
 circle(c,14,-36,8,'#35252a','#b34f32',2);
 circle(c,17,-37,3,'#ffcd55');circle(c,3,-16,5,'#f47230');
 for(let i=0;i<9;i++){let x=-24+i*6,y=-24-Math.sin(t*.055+i*1.9)*14;circle(c,x,y,1.5+(i%3),i%2?'#f0a53d':'#ed5133');}

}
function drawHooktail(c,a,t){
 const q=Math.sin(t*.045),w=Math.sin(t*.07)*12;
 poly(c,[[-28,-4],[-57,-41-w],[-47,-5],[-39,2],[-20,5]],'#752e39','#260f1a',2);
 poly(c,[[12,-7],[59,-42+w],[38,12],[24,11]],'#a13b3d','#381a29',2);
 line(c,[[-23,4],[-51,24],[-62,5],[-46,-1]],'#a7454a',11);
 poly(c,[[-48,-3],[-58,-17],[-71,-9],[-62,6]],'#e87e67');
 poly(c,[[-25,-21],[5,-34],[28,-14],[34,6],[11,19],[-15,10]],'#84333c','#391923',3);
 for(let i=0;i<7;i++)poly(c,[[-22+i*7,-20],[ -16+i*7,-33],[-11+i*7,-19]],'#dc886c');
 poly(c,[[19,-27],[43,-31],[51,-21],[37,-10],[20,-10]],'#ac4c4a');
 poly(c,[[39,-11],[56,-6],[38,-2],[28,-8]],'#7e3032');
 circle(c,39,-23,2.4,'#ffd76e');
 for(let i=0;i<3;i++){circle(c,47+i*7,-9+Math.sin(t*.08+i)*4,2+i,'#ff8b40');}
}
function drawMarcus(c,a,t){
 const q=Math.sin(t*.072);
 poly(c,[[-20,7],[-28,-31],[-17,-43],[5,-32],[21,6]],'#823d35','#2d1d24',3);
 poly(c,[[-12,-7],[-7,-33],[10,-33],[15,-5],[21,15],[-23,15]],'#4b2c32');
 circle(c,0,-40,12,'#d19b70','#553c35',2);
 poly(c,[[-18,-53],[-9,-63],[9,-63],[18,-53]],'#403444');
 line(c,[[-24,-53],[24,-53]],'#e7b85d',4);
 circle(c,-4,-41,1.8,'#f8e2a4');circle(c,6,-41,1.8,'#f8e2a4');
 line(c,[[-17,-27],[-28,-12+q*3]],'#c9a273',7);line(c,[[15,-26],[29,-8-q*3]],'#d5aa73',7);
 for(let i=0;i<8;i++){const ang=i*TAU/8+t*.018,near=Math.sin(ang)>0,x=Math.cos(ang)*49,y=-18+Math.sin(ang)*20;if(!near)circle(c,x,y,6,'#af7e32','#fce099',1.5);}
 for(let i=0;i<8;i++){const ang=i*TAU/8+t*.018;if(Math.sin(ang)<=0)continue;const x=Math.cos(ang)*49,y=-18+Math.sin(ang)*20;circle(c,x,y,6,'#bb883f','#ffdf87',2);line(c,[[x-2,y-3],[x+2,y+3]],'#fff1b8',1);}
}
function drawGilded(c,a,t){
 const flap=Math.sin(t*.08)*10;
 poly(c,[[-22,-5],[-62,-28-flap],[-48,11],[-19,10]],'#cd9653','#513c43',2);
 poly(c,[[22,-5],[62,-28+flap],[48,11],[19,10]],'#c88c48','#513c43',2);
 poly(c,[[-37,-18],[35,-18],[30,21],[-32,21]],'#70502a','#2f2225',3);
 poly(c,[[-38,-19],[-42,-41],[39,-41],[36,-19]],'#9b652b','#2d2223',3);
 poly(c,[[-30,-19],[25,-19],[18,-7],[-22,-7]],'#211b1c','#e1ba55',2);
 for(let i=0;i<5;i++)poly(c,[[-28+i*12,-17],[-23+i*12,-5],[-19+i*12,-17]],'#fcdfaa',null);
 poly(c,[[-11,-5],[0,-19],[12,-5],[0,13]],'#bd2c58','#f6a5ab',2);
 circle(c,0,-5,4,'#ffdde2');
 for(let side of[-1,1]){line(c,[[side*30,2],[side*42,14],[side*48,8]],'#e3aa4b',6);line(c,[[side*42,14],[side*50,20]],'#e3aa4b',5);}
 circle(c,0,-49,4,'#f8d170');
}
function drawNexus(c,a,t){
 const angle=t*.012,q=Math.sin(t*.061);
 c.save();c.rotate(angle);
 poly(c,[[0,-51],[34,-15],[39,22],[0,46],[-39,22],[-34,-15]],'#2e436c','#7bf8ed',2.5);
 poly(c,[[0,-51],[0,46],[39,22],[34,-15]],'#364e7c','#6ff5f3',1.5);
 poly(c,[[0,-51],[0,46],[-39,22],[-34,-15]],'#433968','#bd99ff',1.5);
 poly(c,[[0,-24],[18,0],[0,24],[-18,0]],'#9e69de','#e5d4ff',2);
 circle(c,0,0,6,'#a6ffff');c.restore();
 for(let i=0;i<6;i++){let an=i*TAU/6-angle*.7;circle(c,Math.cos(an)*54,Math.sin(an)*43,2.6,'#63dbea');}
}
function drawChronos(c,a,t){
 const spin=a.boss.phase===2?2:1;
 gear(c,-21,-13,24,10,t*spin,1);gear(c,23,-18,20,9,t*spin,-1);gear(c,2,-36,12,7,t*spin,1);
 circle(c,0,-7,28,'#2b3d4c','#dcc87f',3);
 circle(c,0,-7,17,'#1b2633','#a9bcd0',2);
 for(let i=0;i<12;i++){const q=i*TAU/12;line(c,[[Math.sin(q)*22,-7-Math.cos(q)*22],[Math.sin(q)*25,-7-Math.cos(q)*25]],'#f0daa1',1.4);}
 const q=t*.028;line(c,[[0,-7],[Math.sin(q)*16,-7-Math.cos(q)*16]],'#eac778',2.3);
 line(c,[[0,-7],[Math.sin(q*.32)*11,-7-Math.cos(q*.32)*11]],'#7de8e8',3.1);
 circle(c,0,-7,3,'#fff6bd');
 for(let side of[-1,1])line(c,[[side*22,8],[side*28,26]],'#9ca6a6',5);
}
function drawVoid(c,a,t){
 const pulse=Math.sin(t*.06)*3;
 poly(c,[[0,-57-pulse],[28,-27],[34,9],[0,30],[-34,9],[-28,-27]],'#27223a','#9869b3',3);
 poly(c,[[0,-57-pulse],[0,30],[34,9],[28,-27]],'#392441');
 poly(c,[[0,-57-pulse],[0,30],[-34,9],[-28,-27]],'#201a37');
 for(const [x,y,r] of [[0,-28,7],[-16,-13,6],[16,-13,6],[-10,4,5],[10,4,5]]){
  circle(c,x,y,r,'#ef70d6','#fee4ff',1.1);circle(c,x,y,r*.43,'#2f1639');
 }
 for(let i=0;i<10;i++){let q=i*TAU/10+t*.007,x=Math.cos(q)*(45+i%3*7),y=-14+Math.sin(q)*(39+i%3*6);circle(c,x,y,1.5,'#dc75e0');}
}
function drawCorrosive(c,a,t){
 blob(c,t,'#548d62b9');
 blob(c,t*.78,'#72c4899b');
 for(let i=0;i<12;i++){const q=i*TAU/12+t*.004,rad=18+i%3*5;circle(c,Math.cos(q)*rad,Math.sin(q)*rad*.68,3+i%3,'#d4f7a4a8');}
 for(const[x,y] of [[-12,-8],[10,-7],[0,8]]){circle(c,x,y,6,'#eaf7b2');circle(c,x+1,y,2.6,'#24493c');}
 for(let i=0;i<4;i++){const x=-25+i*16;poly(c,[[x,16],[x+6,36+Math.sin(t*.06+i)*5],[x+12,19]],'#77ae69a8',null);}
}
export function drawRecoveredBossV1(c,a,t,flash=false){
 if(hasArchivedBossPainter(a.boss?.bossDefinitionId))return drawArchivedBossActor(c,a,t,flash);
 const spec=recoveredBossForId(a.boss?.bossDefinitionId);if(!spec)return false;
 c.save();c.translate(a.position.x,a.position.y);
 c.globalAlpha=a.alive?1:.3;
 c.fillStyle='#09101688';c.beginPath();c.ellipse(0,18,44,15,0,0,TAU);c.fill();
 c.strokeStyle=spec.color+'a0';c.lineWidth=1.8;c.beginPath();c.ellipse(0,17,46+Math.sin(t*.03)*2,17,0,0,TAU);c.stroke();
 c.translate(0,Math.sin(t*.04)*2);
 const id=spec.id;
 if(id==='cinderhart')drawCinderhart(c,a,t);
 if(id==='hooktail')drawHooktail(c,a,t);
 if(id==='marcus')drawMarcus(c,a,t);
 if(id==='gilded_vault_keeper')drawGilded(c,a,t);
 if(id==='nexus_overseer')drawNexus(c,a,t);
 if(id==='chronos_arbitrator')drawChronos(c,a,t);
 if(id==='void_overseer'){drawVoid(c,a,t);if(a.boss.pendingAction?.ability==='eye_lance'){const q=ease((t-a.boss.pendingAction.startedTick)/Math.max(1,a.boss.pendingAction.resolvesTick-a.boss.pendingAction.startedTick));circle(c,0,-28,6+q*11,'#ffd9ffa0','#ff8cf8',2+q*2);}}
 if(id==='corrosive_abomination')drawCorrosive(c,a,t);
 if(a.boss.phase===2){c.globalAlpha=.44;c.strokeStyle=spec.color;c.lineWidth=2;c.beginPath();c.arc(0,-12,41+Math.sin(t*.06)*2,0,TAU);c.stroke();}
 if(a.boss.shieldActive){c.globalAlpha=.75;c.strokeStyle='#b2f8f3';c.lineWidth=3;c.beginPath();c.arc(0,-12,51,0,TAU);c.stroke();}
 if(flash){c.fillStyle='#fff5e98c';c.beginPath();c.arc(0,-12,33,0,TAU);c.fill();}
 c.restore();return true;
}
export function drawRecoveredSummonV1(c,a,t,flash=false){
 const s=a.bossSummon;if(!s||!['slime','slag','hologram','bunny'].includes(s.kind))return false;
 if(s.stage==='dormant'||s.stage==='defeated')return true;
 // Original Corrosive renderer owns the true slime/slag body and health pip.
 if(s.kind==='slime'||s.kind==='slag')return true;
 c.save();c.translate(a.position.x,a.position.y);let q=Math.sin(t*.085+a.position.x*.01);
 if(s.kind==='bunny'){rabbit(c,0,0,t*.15+(s.ordinal??0));}
 else if(s.kind==='hologram'){c.globalAlpha=.62;poly(c,[[0,-21+q*3],[16,0],[0,19+q*3],[-16,0]],'#5788cba8','#a3efff',2);circle(c,0,0,3,'#f1ddff');}
 else{poly(c,[[-17,7],[-16,-4],[-7,-14+q*3],[8,-13+q*3],[17,3],[12,13],[-11,13]],s.kind==='slag'?'#b26942':'#71aa77',s.kind==='slag'?'#ffbe5d':'#c6f49b',2);circle(c,-6,-3,3,'#fcf4d6');circle(c,6,-3,3,'#fcf4d6');}
 if(flash)circle(c,0,0,18,'#ffffff45');c.restore();return true;
}
const color=(kind)=>({acid:'#90dc63',slag:'#f3ab3e',fire:'#f17131',molten:'#da683f',void:'#ba75d9',time:'#74bed4',gold:'#e7b749',collapse:'#eb5a69'})[kind]??'#c87866';
export function drawRecoveredBossGroundV1(c,model,t){
 const h=model.bossHazards??{};
 drawArchivedBossGround(c,model,t);
 for(const p of h.recoveredPools??[]){
  if(hasArchivedBossPainter(p.bossDefinitionId))continue;
  const life=Math.min(1,(p.expiresTick-t)/40,(t-p.createdTick)/15);if(life<=0)continue;
  const col=color(p.kind);c.save();c.translate(p.position.x,p.position.y);c.globalAlpha=.38*life;
  c.fillStyle=col;c.strokeStyle=col;c.lineWidth=3;
  c.beginPath();c.arc(0,0,p.kind==='prism'?p.radius*(1-.64*Math.min(1,(t-p.createdTick)/(p.expiresTick-p.createdTick))):p.radius,0,TAU);
  if(p.kind==='collapse'||p.kind==='prism'){c.setLineDash([12,10]);c.stroke();c.setLineDash([]);}else{c.fill();c.globalAlpha=.72*life;c.stroke();}
  if(p.kind==='fire'||p.kind==='molten'||p.kind==='slag')for(let i=0;i<8;i++){const q=i*TAU/8+t*.013;circle(c,Math.cos(q)*p.radius*.7,Math.sin(q)*p.radius*.62,2+Math.sin(t*.08+i),'#ffdda1');}
  c.restore();
 }
 // Void's Eye Lance is warned by its glowing eyes: the floor has NO warning line.
 for(const a of Object.values(model.entitiesById??{})){
  if(a?.boss?.bossDefinitionId!=='void_overseer'||!a.alive)continue;
  const action=a.boss.lastAction;
  if(action?.ability==='eye_lance'&&t-action.resolvedTick>=0&&t-action.resolvedTick<16){
   const from={x:a.position.x,y:a.position.y-23},v={x:action.targetPosition.x-a.position.x,y:action.targetPosition.y-a.position.y};
   const norm=Math.hypot(v.x,v.y)||1,to={x:from.x+v.x/norm*260,y:from.y+v.y/norm*260};
   c.save();c.globalAlpha=1-(t-action.resolvedTick)/16;
   line(c,[[from.x,from.y],[to.x,to.y]],'#a949c6',8);line(c,[[from.x,from.y],[to.x,to.y]],'#ffe2ff',2.3);c.restore();
  }
 }
 for(const q of h.recoveredTelegraphs??[]){
  const spec=recoveredBossForId(q.bossDefinitionId);if(!spec||q.ability==='eye_lance'||hasArchivedBossPainter(q.bossDefinitionId))continue;
  const span=Math.max(1,q.resolvesTick-q.startedTick),progress=ease((t-q.startedTick)/span);
  c.save();c.translate(q.position.x,q.position.y);c.globalAlpha=.35+progress*.55;
  c.strokeStyle=spec.color;c.lineWidth=1.5+progress*2;
  const radius=attackRadiusForVisual(q.ability);
  c.beginPath();c.arc(0,0,radius,0,TAU);c.stroke();
  c.setLineDash([3,6]);c.lineDashOffset=-t*.55;c.beginPath();c.arc(0,0,radius*(.95-.45*progress),0,TAU);c.stroke();c.setLineDash([]);
  if(progress>.85){c.fillStyle=spec.color;c.globalAlpha=(progress-.85)*.9;c.beginPath();c.arc(0,0,radius,0,TAU);c.fill();}
  c.restore();
 }
}
function attackRadiusForVisual(a){return ({eye_lance:24,singularity:95,corrosive_slam:72,spore_storm:105,acid_spill:65,chronos_slam:65,
 time_field:105,chronos_rewind:65,prism_collapse:120,control_glitch:180,prism_slam:68,vault_crush:70,gold_fall:75,
 taxation:70,coin_barrage:110,gold_rush:130,gilded_lasso:75,molten_shield:80,scarlet_fire:115,hooked_tail:75,
 arena_collapse:200,fire_charge:110,landing_fire:90})[a]??75;}
export function drawRecoveredBossHudV1(c,canvas,model){
 if(drawArchivedBossHud(c,canvas,model))return true;
 const actor=Object.values(model.entitiesById??{}).find(a=>a.alive&&recoveredBossForId(a.boss?.bossDefinitionId));
 if(!actor)return false;
 const spec=recoveredBossForId(actor.boss.bossDefinitionId),width=Math.min(430,canvas.width-28),x=(canvas.width-width)/2,y=14;
 const hp=actor.hp.m*Math.pow(10,actor.hp.e),max=actor.maxHp.m*Math.pow(10,actor.maxHp.e);
 const ratio=Math.max(0,Math.min(1,hp/(max||1)));
 c.save();c.fillStyle='#111923ee';c.strokeStyle=spec.color;c.lineWidth=2;c.fillRect(x,y,width,37);c.strokeRect(x+.5,y+.5,width-1,36);
 c.fillStyle='#311e26';c.fillRect(x+10,y+20,width-20,8);
 c.fillStyle=spec.color;c.fillRect(x+10,y+20,(width-20)*ratio,8);
 c.strokeStyle='#eee0bb';c.lineWidth=1;c.strokeRect(x+9.5,y+19.5,width-19,9);
 c.textAlign='center';c.font='900 11px Georgia,serif';c.fillStyle='#f6e8d7';c.fillText(spec.label,canvas.width/2,y+13);
 if(actor.boss.phase===2){c.fillStyle='#f5ccad';c.font='800 8px system-ui';c.fillText('PHASE II'+(actor.boss.shieldActive?'  ·  SHIELDED':''),canvas.width/2,y+36);}
 c.restore();return true;
}
