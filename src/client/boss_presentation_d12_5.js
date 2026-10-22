import {drawArachnidTreantBodyV4} from './creature_presentation_arachnid_treant_v4.js';
const TAU=Math.PI*2,INK='#172019',BARK='#5b3524',BARK_DARK='#382219',BARK_LIGHT='#8a5b36',MOSS='#58834c',MOSS_LIGHT='#86b85e',ELDRITCH='#8de270',WEB='#d8f2c3',DANGER='#f1a253';
const SLAM_RIM_SEGMENTS=Object.freeze([[-2.94,-2.31],[-1.98,-1.37],[-1.04,-.18],[.13,.66],[.94,1.49],[1.83,2.63]]);
const SLAM_CRACKS=Object.freeze([
 [[-5,3],[-17,-3],[-25,-14],[-39,-18],[-47,-31]],
 [[-17,-3],[-29,7],[-46,9],[-54,18]],
 [[5,-5],[14,-18],[28,-22],[39,-35]],
 [[14,-18],[27,-9],[34,3],[48,8]],
 [[3,7],[12,19],[8,33],[18,45]],
 [[-3,11],[-14,22],[-21,39],[-37,45]],
 [[12,20],[27,26],[42,22],[53,31]],
 [[-15,23],[-33,20],[-48,28]]
].map((points,index)=>{let length=0;for(let i=1;i<points.length;i++)length+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);return Object.freeze({delay:(index%4)*.045,length,points:Object.freeze(points.map(Object.freeze))});}));
const arc=(c,front,rx,ry,y=7)=>{const overlap=.035,start=front?-overlap:Math.PI-overlap,end=front?Math.PI+overlap:TAU+overlap;c.beginPath();c.ellipse(0,y,rx,ry,0,start,end);c.stroke();};
function barkPlate(c,points,fill=BARK){c.fillStyle=fill;c.strokeStyle=INK;c.lineWidth=2;c.lineJoin='round';c.beginPath();c.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);c.closePath();c.fill();c.stroke();}
function shieldPass(c,boss,tick,front){if(!boss?.shieldActive)return;const phase=(tick-(boss.shieldStartedTick??tick))*.055;c.save();c.translate(0,5);c.globalAlpha=.78;c.strokeStyle='#23351e';c.lineWidth=8;arc(c,front,49,31,0);c.strokeStyle=ELDRITCH;c.lineWidth=3;arc(c,front,49,31,0);for(let i=0;i<7;i++){const a=phase+i*TAU/7,isFront=Math.sin(a)>=0;if(isFront!==front)continue;const x=Math.cos(a)*47,y=Math.sin(a)*29;c.fillStyle=i%2?WEB:'#d7c47b';c.strokeStyle=INK;c.lineWidth=1.5;c.beginPath();c.moveTo(x,y-4);c.lineTo(x+4,y);c.lineTo(x,y+4);c.lineTo(x-4,y);c.closePath();c.fill();c.stroke();}c.restore();}
function spiderLeg(c,side,index,tick){const y=-4-index*7,lift=Math.sin((tick+index*11)*.09)*1.4,x=side*(20+index*2);c.strokeStyle=INK;c.lineWidth=10;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(side*10,y);c.lineTo(x,y+side*index*.5+lift);c.lineTo(side*(38+index*4),y+13+index*3);c.stroke();c.strokeStyle=index%2?BARK:BARK_DARK;c.lineWidth=6;c.stroke();c.strokeStyle=BARK_LIGHT;c.lineWidth=1.5;c.beginPath();c.moveTo(side*13,y-1);c.lineTo(x,y-1+lift);c.stroke();}
export function drawArachnidTreantD12_5A(c,actor,tick,flash=false){
 if(!actor.boss)return false;
 c.save();c.translate(actor.position.x,actor.position.y);
 const dying=!actor.alive,death=dying?Math.min(1,(actor.deathAge??0)/36):0;
 c.globalAlpha=1-death*.72;c.fillStyle='#10170f66';c.beginPath();c.ellipse(0,9,43,20,0,0,TAU);c.fill();
 shieldPass(c,actor.boss,tick,false);
 drawArachnidTreantBodyV4(c,actor,tick,flash);
 shieldPass(c,actor.boss,tick,true);
 if(actor.boss.shieldBrokenTick!==null){const age=tick-actor.boss.shieldBrokenTick;if(age>=0&&age<36){c.globalAlpha=(1-age/36)*.9;c.strokeStyle='#e8f7b1';c.lineWidth=4;c.beginPath();c.arc(0,-12,48+age*.8,0,TAU);c.stroke();for(let i=0;i<7;i++){const a=i*TAU/7;c.fillStyle=ELDRITCH;c.fillRect(Math.cos(a)*(44+age),-12+Math.sin(a)*(28+age*.45),3,3);}}}
 c.restore();return true;
}

function cocoonShellPath(c){
 c.beginPath();c.moveTo(0,-20);c.bezierCurveTo(15,-15,17,5,6,16);
 c.quadraticCurveTo(0,21,-7,16);c.bezierCurveTo(-17,4,-14,-15,0,-20);c.closePath();
}
function cocoonCupPath(c){
 c.beginPath();c.moveTo(-16,10);c.quadraticCurveTo(-10,6,-6,10);c.lineTo(-1,8);
 c.lineTo(4,11);c.lineTo(10,8);c.lineTo(16,11);c.lineTo(16,23);c.lineTo(-16,23);c.closePath();
}
export function drawTreantCocoonD12_5A(c,actor,tick){
 if(actor.bossSummon?.stage!=='cocoon')return false;
 const ink='#11151a',bark='#71503a',lightBark='#a8784d',darkBark='#433025';
 const moss='#568347',lightMoss='#8ab75c',darkMoss='#315437';
 c.save();c.translate(actor.position.x,actor.position.y);
 c.fillStyle='#11180e77';c.beginPath();c.ellipse(0,7,15,8,0,0,TAU);c.fill();
 const pulse=1+Math.sin((tick+(actor.visualSeed%31))*.08)*.035;
 c.scale(pulse,pulse);c.lineCap='round';c.lineJoin='round';
 cocoonShellPath(c);c.fillStyle=moss;c.fill();
 c.save();cocoonShellPath(c);c.clip();
 // Broad green planes follow the swollen seed, with the light on its left.
 c.fillStyle=lightMoss;c.beginPath();c.moveTo(-18,-24);c.lineTo(3,-24);
 c.bezierCurveTo(-6,-13,-9,-1,-5,10);c.lineTo(-15,19);c.closePath();c.fill();
 c.fillStyle=darkMoss;c.beginPath();c.moveTo(4,-23);c.bezierCurveTo(20,-16,21,14,5,22);
 c.lineTo(-2,19);c.bezierCurveTo(10,8,12,-7,4,-23);c.closePath();c.fill();
 // A few curved silk strands wrap the shell. Clip every strand to its edge.
 c.strokeStyle=WEB;c.lineWidth=.9/pulse;c.beginPath();
 c.moveTo(-15,-13);c.quadraticCurveTo(-4,-6,15,-10);
 c.moveTo(-16,-3);c.quadraticCurveTo(-2,6,16,2);
 c.moveTo(-14,7);c.quadraticCurveTo(0,15,14,10);
 c.moveTo(-8,-22);c.quadraticCurveTo(-6,-8,11,15);
 c.moveTo(7,-22);c.quadraticCurveTo(3,-4,-10,16);c.stroke();
 // The lower shell sits in a small woody cup, like its parent's root bark.
 cocoonCupPath(c);
 c.fillStyle=bark;c.fill();c.save();c.clip();
 c.fillStyle=lightBark;c.beginPath();c.moveTo(-16,8);c.lineTo(-4,8);c.lineTo(-1,22);c.lineTo(-16,22);c.closePath();c.fill();
 c.fillStyle=darkBark;c.beginPath();c.moveTo(9,7);c.lineTo(17,7);c.lineTo(17,23);c.lineTo(2,23);c.lineTo(7,16);c.closePath();c.fill();c.restore();
 cocoonCupPath(c);c.strokeStyle=ink;c.lineWidth=1.26/pulse;c.stroke();
 c.fillStyle=moss;c.strokeStyle=ink;c.lineWidth=.85/pulse;
 c.beginPath();c.moveTo(-12,12);c.lineTo(-8,9);c.quadraticCurveTo(-4,10,-6,14);
 c.lineTo(-9,13);c.lineTo(-11,15);c.closePath();c.fill();c.stroke();
 c.restore();
 cocoonShellPath(c);c.strokeStyle=ink;c.lineWidth=1.26/pulse;c.stroke();
 // The original pair of green glints peeks through the silk.
 for(const [x,y,angle]of [[-4,-3,-.3],[5,2,.3]]){
  c.fillStyle=ink;c.beginPath();c.ellipse(x,y,2.8,2,angle,0,TAU);c.fill();
  c.save();c.shadowColor=ELDRITCH;c.shadowBlur=1.4;c.fillStyle=ELDRITCH;
  c.beginPath();c.ellipse(x,y,1.7,1.3,angle,0,TAU);c.fill();c.restore();
  c.fillStyle='#efffc9';c.beginPath();c.arc(x-.5,y-.4,.45,0,TAU);c.fill();
 }
 c.restore();return true;
}

function traceSlamCrack(c,crack,reveal){let remaining=crack.length*Math.max(0,Math.min(1,reveal));const points=crack.points;c.beginPath();c.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length&&remaining>0;i++){const previous=points[i-1],next=points[i],length=Math.hypot(next[0]-previous[0],next[1]-previous[1]);if(remaining>=length)c.lineTo(next[0],next[1]);else{const ratio=remaining/length;c.lineTo(previous[0]+(next[0]-previous[0])*ratio,previous[1]+(next[1]-previous[1])*ratio);}remaining-=length;}c.stroke();}
function slamTelegraph(c,row,tick,progress){const radius=row.radius,flash=Math.max(0,(progress-.9)/.1),spread=progress*progress*(3-2*progress);c.save();c.translate(row.position.x,row.position.y);
 // A quiet transparent footprint marks the exact authority radius without becoming an opaque disk.
 c.globalAlpha=.055+progress*.075+flash*.08;c.fillStyle=DANGER;c.beginPath();c.ellipse(0,0,radius,radius,0,0,TAU);c.fill();
 // Uneven broken edge pieces communicate the boundary without forming a decorative ring.
 c.globalAlpha=.48+progress*.38;c.strokeStyle=flash>0?'#ffd789':DANGER;c.lineWidth=2+progress*1.5;for(const segment of SLAM_RIM_SEGMENTS){c.beginPath();c.ellipse(0,0,radius,radius,0,segment[0],segment[1]);c.stroke();}
 // Hand-authored branching cracks spread across the ground as the authority deadline approaches.
 c.lineCap='round';c.lineJoin='round';for(const crack of SLAM_CRACKS){const reveal=Math.max(0,(spread-crack.delay)/(1-crack.delay));if(reveal<=0)continue;c.globalAlpha=.5+progress*.35;c.strokeStyle='#60301f';c.lineWidth=3;traceSlamCrack(c,crack,reveal);if(progress>.62){c.globalAlpha=(progress-.62)/.38*(.45+flash*.35);c.strokeStyle=flash>0?'#ffd37c':'#e98738';c.lineWidth=1.25+flash;traceSlamCrack(c,crack,reveal);}}
 if(flash>0){c.globalAlpha=flash*.2;c.fillStyle='#ffd98a';c.beginPath();c.ellipse(0,0,radius,radius,0,0,TAU);c.fill();c.globalAlpha=flash*.75;c.fillStyle='#fff0b5';for(const [x,y] of [[-7,4],[6,-5],[12,18],[-15,22]])c.fillRect(x-1.5,y-1.5,3,3);}
 c.restore();}
function rootSnareTelegraph(c,row,tick,progress){const rx=row.radius,ry=row.radius;c.save();c.translate(row.position.x,row.position.y);c.globalAlpha=.25+.6*progress;c.fillStyle='#386c3455';c.strokeStyle=ELDRITCH;c.lineWidth=2+progress*2;c.beginPath();c.ellipse(0,0,rx,ry,0,0,TAU);c.fill();c.stroke();c.setLineDash([7,5]);c.lineDashOffset=-tick*.8;c.strokeStyle=WEB;c.lineWidth=1.5;c.beginPath();c.ellipse(0,0,rx*(.45+.55*progress),ry*(.45+.55*progress),0,0,TAU);c.stroke();c.setLineDash([]);c.strokeStyle=WEB;c.lineWidth=1.4;for(let i=0;i<8;i++){const a=i*TAU/8;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*rx*.88,Math.sin(a)*ry*.88);c.stroke();}c.restore();}
function telegraph(c,row,tick){const progress=Math.max(0,Math.min(1,(tick-row.startedTick)/(row.resolvesTick-row.startedTick)));if(row.ability==='slam')slamTelegraph(c,row,tick,progress);else rootSnareTelegraph(c,row,tick,progress);}
function rootWeb(c,row,tick){const fade=Math.max(0,Math.min(1,row.ageTicks/10,row.remainingTicks/20)),rx=row.geometry.radiusX,ry=row.geometry.radiusY,seed=parseInt(row.hazardId.slice(-8),16)>>>0;c.save();c.translate(row.position.x,row.position.y);c.globalAlpha=.78*fade;c.fillStyle='#29452b66';c.strokeStyle=INK;c.lineWidth=4;c.beginPath();c.ellipse(0,0,rx,ry,0,0,TAU);c.fill();c.stroke();c.strokeStyle=WEB;c.lineWidth=1.7;c.stroke();for(let ring=1;ring<=3;ring++){c.strokeStyle=ring%2?ELDRITCH:WEB;c.lineWidth=1.2;c.beginPath();c.ellipse(0,0,rx*ring/4,ry*ring/4,0,0,TAU);c.stroke();}for(let i=0;i<10;i++){const a=i*TAU/10+(seed%17)*.006;c.strokeStyle=i%2?WEB:ELDRITCH;c.lineWidth=1.4;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(Math.cos(a+.28)*rx*.55,Math.sin(a+.28)*ry*.55,Math.cos(a)*rx,Math.sin(a)*ry);c.stroke();}c.restore();}
export function drawArachnidTreantGroundD12_5A(c,model,tick){for(const row of model.bossHazards?.telegraphs??[])telegraph(c,row,tick);for(const row of model.bossHazards?.webs??[])rootWeb(c,row,tick);}

export function drawArachnidTreantBossHudD12_5A(c,canvas,model){const boss=Object.values(model.entitiesById).find(actor=>actor.boss&&actor.alive);if(!boss)return false;const width=Math.min(430,canvas.width-28),x=(canvas.width-width)/2,y=14,ratio=Math.max(0,Math.min(1,boss.hp.m/boss.maxHp.m));c.save();c.fillStyle='#111a15e8';c.strokeStyle='#8db46a';c.lineWidth=2;c.fillRect(x,y,width,34);c.strokeRect(x+.5,y+.5,width-1,33);c.fillStyle='#2a1713';c.fillRect(x+9,y+19,width-18,8);c.fillStyle=boss.boss.shieldActive?'#79b85c':'#b64932';c.fillRect(x+9,y+19,(width-18)*ratio,8);c.strokeStyle='#ead7a3';c.lineWidth=1;c.strokeRect(x+8.5,y+18.5,width-17,9);c.textAlign='center';c.font='900 11px Georgia, serif';c.fillStyle='#f2e5bd';c.fillText('ARACHNID TREANT',canvas.width/2,y+13);if(boss.boss.shieldActive){c.font='800 8px system-ui';c.fillStyle='#a9ef83';c.fillText('ELDRITCH BARK SHIELD',canvas.width/2,y+32);}c.restore();return true;}
