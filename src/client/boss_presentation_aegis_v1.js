import {drawMimicShieldV4} from './creature_presentation_mimic_shield_v4.js';
import {presentCombat} from '../shared/contracts/combat_amount.js';

const TAU=Math.PI*2,INK='#11151a',CYAN='#65e6ec',LIGHT='#b1fcf0',BLUE='#298eaa',STONE='#405469',DARK='#233346';
const clamp=v=>Math.max(0,Math.min(1,v));
function plate(c,points,color,outline=true){c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fillStyle=color;c.fill();if(outline){c.strokeStyle=INK;c.lineWidth=1.26;c.lineJoin='round';c.stroke();}}
function hex(c,r){const points=[];for(let i=0;i<6;i++){const a=i*TAU/6-Math.PI/6;points.push([Math.cos(a)*r,Math.sin(a)*r]);}return points;}
function rune(c,x,y,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);c.strokeStyle=CYAN;c.lineWidth=1.15;c.lineCap='square';c.beginPath();c.moveTo(-3,-3);c.lineTo(0,-6);c.lineTo(3,-3);c.moveTo(0,-6);c.lineTo(0,5);c.moveTo(-3,1);c.lineTo(3,1);c.stroke();c.restore();}
function shield(c,x,y,r,spin,flash=false){
 c.save();c.translate(x,y);c.rotate(spin);plate(c,hex(c,r),flash?LIGHT:STONE);
 plate(c,[[0,-r],...[0,1,2].map(i=>hex(c,r)[i]),[0,0]],'#6d8798',false);
 plate(c,hex(c,r*.72),DARK);plate(c,[[-r*.42,0],[0,-r*.48],[r*.42,0],[0,r*.48]],flash?'#f2ffed':CYAN);
 c.strokeStyle=LIGHT;c.lineWidth=1;c.beginPath();c.moveTo(-r*.2,-r*.04);c.lineTo(0,-r*.26);c.lineTo(r*.2,-r*.04);c.stroke();c.restore();
}
function chains(c,t){
 for(const side of [-1,1]){
  const wave=Math.sin(t*.047+side*1.5)*5;
  for(let i=0;i<13;i++){
   const q=i/12,x=side*(22+Math.sin(q*Math.PI)*5)+(wave*q*q),y=-61+q*90;
   c.save();c.translate(x,y);c.rotate(side*.18+Math.cos(t*.047+side)*q*.14);
   c.strokeStyle=INK;c.lineWidth=3.8;c.beginPath();c.ellipse(0,0,i%2?1.7:2.3,3.7,0,0,TAU);c.stroke();
   c.strokeStyle=i%4===1?CYAN:'#718b9d';c.lineWidth=1.3;c.stroke();c.restore();
  }
  plate(c,[[side*22-4,-65],[side*22,-70],[side*22+4,-65],[side*22,-60]],BLUE);
 }
}
function tower(c,b,t,front,flash){
 const a=b.shieldAngle??Math.PI/2;if((Math.sin(a)>=0)!==front||b.phase!==2||b.mimicEncounter&&!b.mimicEncounter.fusedOrdinals.length)return;
 const dazed=b.actionState==='dazed',age=t-(b.lastAction?.resolvedTick??-100),bash=b.lastAction?.ability==='shield_bash'&&age>=0&&age<18?Math.sin(age/18*Math.PI)*12:0,s=.55+.45*Math.abs(Math.sin(a)),x=dazed?48:Math.cos(a)*(43+bash),y=dazed?24:Math.sin(a)*(18+bash*.5)-18;
 c.save();c.translate(x,y);c.rotate(dazed?.22+Math.sin(t*.08)*.08:0);c.scale(s,1);
 // Compensate the horizontal perspective so the silhouette has the same ink
 // thickness as the golem and other polished creatures.
 const survivors=b.mimicEncounter?.fusedOrdinals??[0,1,2],towerWidth=.58+survivors.length*.14;c.scale(towerWidth,1);
 if(b.mimicEncounter){
  plate(c,[[-3,-44],[3,-44],[4,27],[0,38],[-4,27]],'#304758');
  c.strokeStyle=CYAN;c.lineWidth=1.2;c.beginPath();c.moveTo(0,-40);c.lineTo(0,29);c.stroke();
  const positions=[[-11,-24],[11,-24],[0,6]];
  for(const i of survivors){c.save();c.translate(...positions[i]);c.scale(.76,.76);drawMimicShieldV4(c,{x:-16,y:-16,w:32,h:32,flashTimer:flash?1:0,familyAttack:null},t*1000/60,11+i*7);c.restore();}
  c.restore();return;
 }
 const polygon=[[-22,-39],[0,-46],[22,-39],[25,24],[0,43],[-25,24]];
 plate(c,polygon,flash?LIGHT:STONE);
 plate(c,[[-22,-39],[0,-46],[0,43],[-25,24]],'#617c8c',false);
 plate(c,[[0,-46],[22,-39],[25,24],[0,43]],DARK,false);
 plate(c,[[-15,-32],[0,-37],[15,-32],[17,20],[0,32],[-17,20]],'#263f51');
 plate(c,[[-3,-27],[3,-27],[3,-6],[12,-6],[12,0],[3,0],[3,22],[-3,22],[-3,0],[-12,0],[-12,-6],[-3,-6]],dazed?'#4c7c90':CYAN);
 plate(c,[[-22,-17],[22,-17],[23,-10],[-23,-10]],'#869eaa');
 plate(c,[[-24,16],[24,16],[24,22],[-24,22]],'#536c80');
 for(let i=0;i<3;i++){const x=(i-1)*10;plate(c,[[x-4,-34],[x+4,-34],[x+4,-27],[x-4,-27]],survivors.includes(i)?CYAN:'#11151a');}
 rune(c,0,-22,.65);
 c.strokeStyle=INK;c.lineWidth=1.26/s;c.beginPath();c.moveTo(...polygon[0]);for(const p of polygon.slice(1))c.lineTo(...p);c.closePath();c.stroke();c.restore();
}
export function drawAegisGoliath(c,actor,tick,flash=false){
 const b=actor.boss;if(b?.bossDefinitionId!=='aegis_goliath')return false;
 c.save();c.translate(actor.position.x,actor.position.y);
 const death=actor.alive?0:clamp((actor.deathAge??0)/36),hover=Math.sin(tick*.075)*3.8;
 c.globalAlpha=1-death*.85;c.fillStyle='#10192555';c.beginPath();c.ellipse(0,9,37+hover*.35,15+hover*.1,0,0,TAU);c.fill();
 const pending=b.pendingAction,p=pending?clamp((tick-pending.startedTick)/(pending.resolvesTick-pending.startedTick)):0;
 const enraged=b.mimicEncounter&&b.mimicEncounter.enragedTick!==null,pulse=1+Math.sin(tick*(enraged?.21:.11))*(enraged?.12:.06)+(b.actionState==='recalling'?.18:0);
 const impactAge=tick-(b.lastAction?.resolvedTick??-100),slamDrop=b.lastAction?.ability==='magnetic_pull'&&impactAge>=0&&impactAge<18?Math.sin(impactAge/18*Math.PI)*10:0;
 c.translate(0,-30+hover+death*16+slamDrop-(pending?.ability==='magnetic_pull'?p*5:0));
 if(b.phase===1&&!b.mimicEncounter)for(let i=0;i<3;i++){const a=tick/60+i*TAU/3;if(Math.sin(a)<0)shield(c,Math.cos(a)*55,Math.sin(a)*16-3,14,tick/80+i*.2,flash);}
 tower(c,b,tick,false,flash);chains(c,tick);
 // Six large stone planes keep the original floating torso readable at game
 // scale. There is deliberately no added head, human face or tiny engraving.
 const body=[[0,-24],[20,-22],[26,-2],[0,28],[-26,-2],[-20,-22]];
 plate(c,body,flash?LIGHT:STONE);
 plate(c,[[0,-24],[-20,-22],[-26,-2],[-4,-8]],flash?LIGHT:'#698695',false);
 plate(c,[[0,-24],[20,-22],[26,-2],[4,-8]],flash?LIGHT:'#35485c',false);
 plate(c,[[-26,-2],[0,28],[0,9],[-4,-8]],flash?LIGHT:'#344557',false);
 plate(c,[[26,-2],[0,28],[0,9],[4,-8]],flash?LIGHT:'#1b2b3d',false);
 plate(c,[[0,-18],[12,-6],[0,12],[-12,-6]],INK);
 c.save();c.translate(0,-4);c.scale(pulse,pulse);
 plate(c,[[0,-10],[7,-3],[4,6],[0,10],[-4,6],[-7,-3]],flash?'#ffffff':b.mimicEncounter?.enragedTick!==null&&b.mimicEncounter?'#ff995b':CYAN);
 plate(c,[[0,-10],[0,10],[-4,6],[-7,-3]],b.mimicEncounter?.enragedTick!==null&&b.mimicEncounter?'#ffe5a2':'#a8fff3',false);
 plate(c,[[0,-7],[3,-2],[0,5],[-3,-2]],'#eafffa',false);c.restore();
 c.strokeStyle=CYAN;c.lineWidth=1.4;c.lineCap='round';
 c.beginPath();c.moveTo(-16,-18);c.lineTo(-20,-5);c.lineTo(-14,0);c.moveTo(16,-18);c.lineTo(20,-5);c.lineTo(14,0);c.stroke();
 plate(c,body,'#00000000');
 if(pending?.ability==='magnetic_pull'){
  c.strokeStyle='#a7fff3';c.lineWidth=1.5;c.globalAlpha=.5+p*.4;c.beginPath();c.arc(0,-4,15+Math.sin(tick*.2)*2,0,TAU);c.stroke();c.globalAlpha=1-death*.85;
 }
 if(b.phase===1&&!b.mimicEncounter)for(let i=0;i<3;i++){const a=tick/60+i*TAU/3;if(Math.sin(a)>=0)shield(c,Math.cos(a)*55,Math.sin(a)*16-3,14,tick/80+i*.2,flash);}
 tower(c,b,tick,true,flash);
 if(b.actionState==='dazed'){
  for(let i=0;i<3;i++){const a=tick*.09+i*TAU/3;plate(c,[[0,-3],[1,-1],[3,0],[1,1],[0,3],[-1,1],[-3,0],[-1,-1]].map(([x,y])=>[x+Math.cos(a)*20,y-71+Math.sin(a)*5]),'#fff0a6');}
 }
 c.restore();return true;
}
export function drawAegisGround(c,model,tick){
 for(const a of Object.values(model.entitiesById??{})){const b=a.boss,last=b?.lastAction,age=tick-(last?.resolvedTick??-100);if(b?.bossDefinitionId!=='aegis_goliath'||!a.alive||last?.ability!=='magnetic_pull'||age<0||age>=18)continue;c.save();c.translate(last.targetPosition.x,last.targetPosition.y);c.globalAlpha=(1-age/18)*.75;c.strokeStyle='#c5fff0';c.lineWidth=3*(1-age/18)+1;c.beginPath();c.arc(0,0,30+age*40/18,0,TAU);c.stroke();c.restore();}
 for(const h of model.bossHazards?.aegisTelegraphs??[]){
  const p=clamp((tick-h.startedTick)/(h.resolvesTick-h.startedTick));c.save();c.translate(h.position.x,h.position.y);c.lineWidth=1.7;c.strokeStyle='#ffc171';c.fillStyle='#f3a04b20';
  if(h.ability==='magnetic_pull'){
   c.beginPath();c.arc(0,0,70,0,TAU);c.fill();c.stroke();
   // Moving inward chevrons distinguish the pull from its damaging slam rim.
   c.strokeStyle='#8bf4f0';c.lineWidth=1.3;
   for(let i=0;i<8;i++){const a=i*TAU/8,r=82+(1-(tick%24)/24)*32;c.save();c.rotate(a);c.beginPath();c.moveTo(r+5,-4);c.lineTo(r,0);c.lineTo(r+5,4);c.stroke();c.restore();}
   c.strokeStyle='#ffc171';c.beginPath();c.arc(0,0,70,-Math.PI/2,-Math.PI/2+p*TAU);c.lineWidth=3;c.stroke();
  }else if(h.ability==='shield_bash'){
   c.beginPath();c.moveTo(0,0);c.arc(0,0,64,h.angle-.5,h.angle+.5);c.closePath();c.fill();c.stroke();c.fillStyle='#fbbf6955';c.beginPath();c.moveTo(0,0);c.arc(0,0,64*p,h.angle-.5,h.angle+.5);c.closePath();c.fill();
  }else{
   // The throw marks the two launch bearings, not a fictitious damage beam.
   c.strokeStyle='#8bf4f0';for(const offset of[-.25,.25]){const a=h.angle+offset;c.save();c.rotate(a);c.beginPath();c.moveTo(38,0);c.lineTo(59,0);c.lineTo(54,-4);c.moveTo(59,0);c.lineTo(54,4);c.stroke();c.restore();}
  }c.restore();
 }
}
export function drawAegisProjectiles(c,model,tick){
 for(const p of model.bossHazards?.aegisProjectiles??[]){c.save();c.translate(p.position.x,p.position.y);c.fillStyle='#111b2a44';c.beginPath();c.ellipse(0,7,10,4,0,0,TAU);c.fill();const n=Math.hypot(p.velocity.x,p.velocity.y)||1;c.strokeStyle='#65e6ec88';c.lineWidth=3;c.beginPath();c.moveTo(-p.velocity.x/n*15,-18-p.velocity.y/n*15);c.lineTo(0,-18);c.stroke();shield(c,0,-18,10,tick*.16+p.ordinal);c.restore();}
}
export function drawAegisBossHud(c,canvas,model){
 const actor=Object.values(model.entitiesById).find(a=>a.alive&&a.boss?.bossDefinitionId==='aegis_goliath');if(!actor)return false;
 const width=Math.min(340,canvas.width-32),x=(canvas.width-width)/2,y=12,ratio=clamp(actor.hp?.m!==undefined?actor.hp.m/Math.max(1e-12,actor.maxHp.m):presentCombat(actor.hp)/Math.max(1,presentCombat(actor.maxHp))),b=actor.boss;
 c.save();c.fillStyle='#101827e8';c.fillRect(x,y,width,42);c.strokeStyle='#718e9f';c.lineWidth=1;c.strokeRect(x+.5,y+.5,width-1,41);
 c.fillStyle='#090f19';c.fillRect(x+10,y+19,width-20,8);c.fillStyle=b.actionState==='dazed'?'#e9cb78':'#46b8c9';c.fillRect(x+10,y+19,(width-20)*ratio,8);c.textAlign='center';c.font='900 11px Georgia, serif';c.fillStyle='#e2fcf5';c.fillText('AEGIS GOLIATH',canvas.width/2,y+13);
 c.font='800 8px system-ui';c.fillStyle=b.actionState==='dazed'?'#fff0a6':'#90e9ef';
 const names={magnetic_pull:'MAGNETIC PULL → SLAM',boomerang_shield:'RETURNING SHIELDS',shield_bash:'SHIELD BASH'};
 c.fillText(b.actionState==='recalling'?'RECALLING MIMICS · FINISH THE WOUNDED':b.mimicEncounter&&b.mimicEncounter.enragedTick!==null?(b.pendingAction?'ENRAGED · '+names[b.pendingAction.ability]:'ENRAGED · CORE EXPOSED'):b.actionState==='dazed'?'DAZED · SHIELD DOWN':b.pendingAction?names[b.pendingAction.ability]:b.phase===2?'TOWER SHIELD · FLANK TO STRIKE':'ORBITAL AEGIS',canvas.width/2,y+37);
 if(b.actionState==='recalling'&&b.mimicEncounter){const p=clamp((model.tick-b.mimicEncounter.recallStartedTick)/120);c.fillStyle='#ffc67b';c.fillRect(x+10,y+40,(width-20)*p,2);}
 if(b.mimicEncounter&&b.mimicEncounter.fusedOrdinals.length){const ratio=clamp(presentCombat(b.mimicEncounter.towerHp)/Math.max(1,presentCombat(b.mimicEncounter.towerMaxHp)));c.fillStyle='#101827';c.fillRect(x,y+43,width,17);c.fillStyle='#9fe6e4';c.font='bold 7px system-ui';c.fillText('MIMIC TOWER · '+b.mimicEncounter.fusedOrdinals.length+' SURVIVOR'+(b.mimicEncounter.fusedOrdinals.length===1?'':'S'),canvas.width/2,y+51);c.fillStyle='#243a48';c.fillRect(x+10,y+54,width-20,4);c.fillStyle='#78dce1';c.fillRect(x+10,y+54,(width-20)*ratio,4);}
 c.restore();return true;
}
