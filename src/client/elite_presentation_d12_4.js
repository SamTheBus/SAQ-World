const TAU=Math.PI*2,DARK='#0a211d',EMERALD='#3bd887',PALE='#bdf3a6',GOLD='#e2bd55',PALE_GOLD='#ffe08a';

function energyNode(c,x,y,angle,scale,fill=PALE){c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);c.fillStyle=DARK;c.beginPath();c.moveTo(0,-5);c.lineTo(4,-1);c.lineTo(1,5);c.lineTo(-4,1);c.closePath();c.fill();c.fillStyle=fill;c.beginPath();c.moveTo(0,-3);c.lineTo(2.2,-.5);c.lineTo(.5,3);c.lineTo(-2.2,.6);c.closePath();c.fill();c.restore();}

function runeShard(c,x,y,angle,scale,fill=EMERALD){c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);c.strokeStyle=DARK;c.lineWidth=5;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(-5,3);c.lineTo(-1,-5);c.lineTo(5,-1);c.stroke();c.strokeStyle=fill;c.lineWidth=2.2;c.beginPath();c.moveTo(-5,3);c.lineTo(-1,-5);c.lineTo(5,-1);c.stroke();c.restore();}

function knotStroke(c,path,color,width){c.strokeStyle=DARK;c.lineWidth=width+4;c.stroke(path);c.strokeStyle=color;c.lineWidth=width;c.stroke(path);}

export function drawVitalityWeaverSigilD12_4(c,actor,tick){
 const e=actor.elite;if(e?.affixId!=='vitality_weaver')return;const gather=Math.max(0,Math.min(1,(18-(e.nextPulseTick-tick))/18)),breathe=Math.sin((tick+actor.visualSeed%31)*.12);
 c.save();c.translate(0,8);c.scale(1,.46);c.rotate(-.055+breathe*.008);c.lineCap='round';c.lineJoin='round';
 const emerald=new Path2D();emerald.moveTo(-35,5);emerald.bezierCurveTo(-29,-24,-4,-34,17,-24);emerald.bezierCurveTo(37,-14,31,10,9,20);emerald.bezierCurveTo(-12,30,-30,18,-19,2);emerald.bezierCurveTo(-11,-10,6,-9,17,2);
 const gold=new Path2D();gold.moveTo(-27,-20);gold.bezierCurveTo(-8,-7,9,-7,29,-23);gold.bezierCurveTo(20,-2,5,12,-14,23);gold.bezierCurveTo(-7,7,6,-2,26,8);
 knotStroke(c,emerald,gather>.05?PALE:EMERALD,3.4+gather*1.6);knotStroke(c,gold,GOLD,2.6+gather*.8);
 c.strokeStyle=DARK;c.lineWidth=7;c.beginPath();c.moveTo(-5,-10);c.lineTo(4,-2);c.stroke();c.strokeStyle=PALE_GOLD;c.lineWidth=2.5;c.beginPath();c.moveTo(-5,-10);c.lineTo(4,-2);c.stroke();
 runeShard(c,-34,-13,-.55,.74,gather>.05?PALE:GOLD);runeShard(c,34,12,2.35,.7,EMERALD);energyNode(c,-9,27,.35,.72,PALE_GOLD);energyNode(c,27,-19,-.2,.62,PALE);c.restore();
}

export function drawVitalityWeaverAuraD12_4(c,actor,tick){
 if(actor.elite?.affixId!=='vitality_weaver')return;const phase=(tick+actor.visualSeed%43)*.046,gather=Math.max(0,Math.min(1,(16-(actor.elite.nextPulseTick-tick))/16));c.save();c.lineCap='round';c.lineJoin='round';
 for(let i=0;i<3;i++){
  const p=phase+i*TAU/3,side=Math.cos(p)>=0?1:-1,lift=-18-i*9+Math.sin(p*1.4)*3,reach=20+i*3,wave=Math.sin(p)*8,thread=new Path2D();thread.moveTo(-side*reach,lift+7);thread.bezierCurveTo(-side*7+wave,lift-8,side*8-wave,lift-9,side*reach,lift+1);c.globalAlpha=Math.min(1,.5+i*.12+gather*.2);knotStroke(c,thread,i===1?GOLD:EMERALD,2.4+gather*.6);energyNode(c,side*reach,lift+1,p*.7,.42+i*.05,i===1?PALE_GOLD:PALE);
 }
 c.globalAlpha=.82;for(let i=0;i<3;i++){const p=phase*1.6+i*2.08,r=22+i*3;energyNode(c,Math.cos(p)*r,-21+Math.sin(p)*10,p,.28+(i===0?gather*.1:0),i===1?PALE_GOLD:PALE);}c.restore();
}

export function drawVitalityWeaverPulseD12_4(c,actor,tick){
 const pulse=actor.elite?.affixId==='vitality_weaver'?actor.elite.pulse:null;if(!pulse)return;const age=tick-pulse.tick;if(age<0||age>42)return;const travel=Math.max(0,Math.min(1,age/14)),fade=Math.max(0,Math.min(1,(42-age)/18)),seed=actor.visualSeed>>>0;
 c.save();c.globalAlpha=fade;c.lineCap='round';c.lineJoin='round';
 for(const [index,target] of pulse.recipients.entries()){
  const dx=target.position.x-actor.position.x,dy=target.position.y-actor.position.y,bend=((seed>>>index)&1?1:-1)*(14+index*4),length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length,endX=dx*travel,endY=dy*travel,green=new Path2D(),gold=new Path2D();
  green.moveTo(-3,-8);green.bezierCurveTo(dx*.3+nx*bend,dy*.3+ny*bend-12,dx*.66-nx*bend*.55,dy*.66-ny*bend*.55-4,endX,endY-8);gold.moveTo(3,-10);gold.bezierCurveTo(dx*.28-nx*bend*.7,dy*.28-ny*bend*.7-7,dx*.7+nx*bend*.45,dy*.7+ny*bend*.45-10,endX,endY-10);knotStroke(c,green,EMERALD,3.2);knotStroke(c,gold,PALE_GOLD,1.8);
  if(travel>.82){const burst=Math.min(1,(travel-.82)/.18);for(let n=0;n<4;n++){const a=n*TAU/4+(seed%19)*.07,r=(6+n%2*3)+age*.18;runeShard(c,dx+Math.cos(a)*r,dy-12+Math.sin(a)*r,a+.45,burst*(.32+n*.035),n%2?PALE_GOLD:PALE);}energyNode(c,dx,dy-13,age*.08,.55+burst*.28,PALE);}
 }
 c.restore();
}

export function drawVitalityWeaverBadgeD12_4(c,actor,profile,ratio){
 const e=actor.elite;if(e?.affixId!=='vitality_weaver'||!actor.alive)return false;const width=Math.max(34,Math.min(48,profile.visualBounds.width*.9)),height=6,x=-width/2,y=profile.labels.healthBarY-3;
 c.fillStyle='#071c18';c.fillRect(x-2,y-2,width+4,height+4);c.fillStyle='#25533f';c.fillRect(x,y,width,height);c.fillStyle='#63dc87';c.fillRect(x,y,width*ratio,height);c.strokeStyle='#e2c45f';c.lineWidth=1;c.strokeRect(x-.5,y-.5,width+1,height+1);
 c.save();c.translate(x-7,y+height/2);c.lineCap='round';c.strokeStyle=DARK;c.lineWidth=4;c.beginPath();c.moveTo(-4,2);c.quadraticCurveTo(0,-4,4,2);c.moveTo(-4,-2);c.quadraticCurveTo(0,4,4,-2);c.stroke();c.strokeStyle=GOLD;c.lineWidth=1.5;c.stroke();c.restore();c.textAlign='center';c.font='800 7px system-ui';c.lineWidth=2.4;c.strokeStyle='#071c18';c.strokeText(e.label,0,y-7);c.fillStyle='#bff092';c.fillText(e.label,0,y-7);c.textAlign='left';return true;
}

const COMMAND_CYAN='#00d2ff',COMMAND_PALE='#b9f4ff',COMMAND_DARK='#092a3a',COMMAND_GOLD='#f0c95a';

function commandChevron(c,x,y,angle,scale,color=COMMAND_CYAN){c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);c.lineJoin='round';c.lineCap='round';c.strokeStyle=COMMAND_DARK;c.lineWidth=5;c.beginPath();c.moveTo(-5,3);c.lineTo(0,-3);c.lineTo(5,3);c.stroke();c.strokeStyle=color;c.lineWidth=2;c.stroke();c.restore();}

export function drawSwiftCommanderSigilD12_4D(c,actor,tick){
 const e=actor.elite;if(e?.affixId!=='swift_commander')return;const phase=(tick+actor.visualSeed%47)*.035,gather=Math.max(0,Math.min(1,(18-(e.nextPulseTick-tick))/18));
 c.save();c.translate(0,8);c.scale(1,.48);c.rotate(phase);c.lineJoin='round';c.lineCap='round';c.setLineDash([8,6]);c.strokeStyle=COMMAND_DARK;c.lineWidth=7;c.beginPath();c.ellipse(0,0,35,29,0,0,TAU);c.stroke();c.strokeStyle=COMMAND_CYAN;c.lineWidth=3;c.stroke();c.setLineDash([]);
 for(let i=0;i<4;i++){c.save();c.rotate(i*Math.PI/2);c.fillStyle=COMMAND_DARK;c.beginPath();c.moveTo(-7,-31);c.lineTo(0,-42-gather*4);c.lineTo(7,-31);c.lineTo(0,-25);c.closePath();c.fill();c.fillStyle=i%2?COMMAND_GOLD:COMMAND_PALE;c.beginPath();c.moveTo(-3,-31);c.lineTo(0,-38-gather*3);c.lineTo(3,-31);c.lineTo(0,-28);c.closePath();c.fill();c.restore();}
 c.rotate(-phase);c.strokeStyle=COMMAND_DARK;c.lineWidth=8;c.beginPath();c.moveTo(-15,8);c.lineTo(0,-14);c.lineTo(15,8);c.moveTo(-10,13);c.lineTo(0,-1);c.lineTo(10,13);c.stroke();c.strokeStyle=COMMAND_GOLD;c.lineWidth=3;c.stroke();c.restore();
}

export function drawSwiftCommanderAuraD12_4D(c,actor,tick){
 const e=actor.elite;if(e?.affixId!=='swift_commander')return;const phase=(tick+actor.visualSeed%29)*.055;c.save();c.lineCap='round';c.lineJoin='round';
 for(let i=0;i<3;i++){const p=phase+i*TAU/3,r=24+i*3,x=Math.cos(p)*r,y=-22+Math.sin(p)*10;commandChevron(c,x,y,p+Math.PI/2,.48+i*.04,i===1?COMMAND_GOLD:COMMAND_PALE);}
 for(const [index,target] of (e.supportLinks??[]).entries()){const dx=target.position.x-actor.position.x,dy=target.position.y-actor.position.y,length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length,bend=(index%2?1:-1)*(9+index*2),path=new Path2D();path.moveTo(0,-8);path.quadraticCurveTo(dx*.5+nx*bend,dy*.5+ny*bend-8,dx,dy-8);c.globalAlpha=.42;c.setLineDash([5,7]);c.strokeStyle=COMMAND_DARK;c.lineWidth=5;c.stroke(path);c.strokeStyle=index%2?COMMAND_GOLD:COMMAND_CYAN;c.lineWidth=2;c.stroke(path);c.setLineDash([]);c.globalAlpha=.92;for(let n=0;n<target.stacks;n++)commandChevron(c,dx+(n-(target.stacks-1)/2)*8,dy-17-n%2*2,0,.42,n===2?COMMAND_GOLD:COMMAND_PALE);}
 c.restore();
}

export function drawSwiftCommanderPulseD12_4D(c,actor,tick){
 const pulse=actor.elite?.affixId==='swift_commander'?actor.elite.pulse:null;if(!pulse)return;const age=tick-pulse.tick;if(age<0||age>30)return;const spread=Math.min(1,age/15),fade=Math.max(0,(30-age)/16);c.save();c.globalAlpha=fade;c.scale(1,.48);c.strokeStyle=COMMAND_DARK;c.lineWidth=8;c.beginPath();c.ellipse(0,12,24+spread*38,18+spread*29,0,0,TAU);c.stroke();c.strokeStyle=COMMAND_CYAN;c.lineWidth=3;c.stroke();for(let i=0;i<6;i++){const a=i*TAU/6+age*.04;commandChevron(c,Math.cos(a)*(24+spread*36),12+Math.sin(a)*(18+spread*27),a+Math.PI/2,.42,i%3===1?COMMAND_GOLD:COMMAND_PALE);}c.restore();
}

export function drawSwiftHasteD12_4D(c,actor,tick){
 const h=actor.eliteHaste;if(!h||!actor.alive)return;const phase=(tick+actor.visualSeed%23)*.09;c.save();c.globalAlpha=.82;c.lineCap='round';for(let i=0;i<h.stacks;i++){const y=-12-i*7,travel=((phase+i*.27)%1)*11;c.strokeStyle=COMMAND_DARK;c.lineWidth=4;c.beginPath();c.moveTo(-25-travel,y);c.lineTo(-13-travel,y-2);c.stroke();c.strokeStyle=i===2?COMMAND_GOLD:COMMAND_CYAN;c.lineWidth=1.5;c.stroke();commandChevron(c,11+(i-(h.stacks-1)/2)*8,-31,0,.38,i===2?COMMAND_GOLD:COMMAND_PALE);}c.restore();
}

export function drawSwiftCommanderBadgeD12_4D(c,actor,profile,ratio){
 const e=actor.elite;if(e?.affixId!=='swift_commander'||!actor.alive)return false;const width=Math.max(38,Math.min(52,profile.visualBounds.width)),height=6,x=-width/2,y=profile.labels.healthBarY-3;
 c.fillStyle='#071923';c.fillRect(x-2,y-2,width+4,height+4);c.fillStyle='#164760';c.fillRect(x,y,width,height);c.fillStyle=COMMAND_CYAN;c.fillRect(x,y,width*ratio,height);c.strokeStyle=COMMAND_GOLD;c.lineWidth=1;c.strokeRect(x-.5,y-.5,width+1,height+1);commandChevron(c,x-8,y+height/2,0,.55,COMMAND_GOLD);c.textAlign='center';c.font='800 7px system-ui';c.lineWidth=2.4;c.strokeStyle='#071923';c.strokeText(e.label,0,y-7);c.fillStyle=COMMAND_PALE;c.fillText(e.label,0,y-7);c.textAlign='left';return true;
}

const ICE_CYAN='#38bdf8',ICE_BLUE='#79d7ff',ICE_PALE='#d9f7ff',ICE_DARK='#102d4a';

function frostShard(c,x,y,angle,scale,fill=ICE_PALE){c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);c.lineJoin='round';c.fillStyle=ICE_DARK;c.beginPath();c.moveTo(0,-8);c.lineTo(5,1);c.lineTo(1,7);c.lineTo(-4,2);c.closePath();c.fill();c.fillStyle=fill;c.beginPath();c.moveTo(0,-5.5);c.lineTo(2.8,.7);c.lineTo(.6,4);c.lineTo(-2.1,1.2);c.closePath();c.fill();c.strokeStyle='#fff';c.globalAlpha=.68;c.lineWidth=1;c.beginPath();c.moveTo(0,-4);c.lineTo(.5,2.5);c.stroke();c.restore();}

export function drawGlacialWardenSigilD12_4E(c,actor,tick){
 const e=actor.elite;if(e?.affixId!=='glacial_warden')return;const phase=(tick+actor.visualSeed%53)*.026,gather=Math.max(0,Math.min(1,(22-(e.nextPulseTick-tick))/22));c.save();c.translate(0,9);c.scale(1,.48);c.rotate(phase*.35);c.lineJoin='round';
 for(let i=0;i<6;i++){c.save();c.rotate(i*TAU/6);c.strokeStyle=ICE_DARK;c.lineWidth=7;c.beginPath();c.moveTo(0,-13);c.lineTo(0,-34-gather*5);c.lineTo(-6,-27);c.moveTo(0,-25);c.lineTo(7,-20);c.stroke();c.strokeStyle=i%2?ICE_BLUE:ICE_CYAN;c.lineWidth=2.5;c.stroke();c.restore();}
 c.fillStyle=ICE_DARK;c.beginPath();for(let i=0;i<6;i++){const a=i*TAU/6-Math.PI/2,r=i%2?9:15;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();c.strokeStyle=ICE_PALE;c.lineWidth=2;c.stroke();c.restore();
}

export function drawGlacialWardenAuraD12_4E(c,actor,tick){
 if(actor.elite?.affixId!=='glacial_warden')return;const phase=(tick+actor.visualSeed%37)*.045;c.save();for(let i=0;i<5;i++){const p=phase+i*TAU/5,r=23+(i%2)*5,x=Math.cos(p)*r,y=-19+Math.sin(p)*11;frostShard(c,x,y,p+.45,.42+(i%3)*.06,i%2?ICE_BLUE:ICE_PALE);}c.restore();
}

export function drawGlacialWardenPulseD12_4E(c,actor,tick){
 const pulse=actor.elite?.affixId==='glacial_warden'?actor.elite.pulse:null;if(!pulse)return;const age=tick-pulse.tick;if(age<0||age>42)return;const spread=Math.min(1,age/24),fade=Math.max(0,(42-age)/18),radius=20+spread*90;c.save();c.globalAlpha=fade;c.scale(1,.48);c.strokeStyle=ICE_DARK;c.lineWidth=9;c.beginPath();c.ellipse(0,14,radius,radius*.76,0,0,TAU);c.stroke();c.strokeStyle=ICE_PALE;c.lineWidth=3;c.stroke();c.strokeStyle=ICE_CYAN;c.lineWidth=1.5;c.setLineDash([8,7]);c.beginPath();c.ellipse(0,14,radius-5,(radius-5)*.76,0,0,TAU);c.stroke();c.setLineDash([]);for(let i=0;i<8;i++){const a=i*TAU/8+age*.018;frostShard(c,Math.cos(a)*radius,14+Math.sin(a)*radius*.76,a+.5,.34,i%2?ICE_BLUE:ICE_PALE);}c.restore();
}

function glacialSnareFrame(actor,tick){const status=actor.timedStatuses?.glacial_warden_snare;if(!status||!actor.alive)return null;const phase=(tick+actor.visualSeed%31)*.07;return {phase,alpha:.45+.4*Math.min(1,status.remainingTicks/10),centerY:8,radiusX:18,radiusY:13,dashOffset:-phase*8};}
function drawGlacialSnarePassD12_4E(c,actor,tick,front){
 const frame=glacialSnareFrame(actor,tick);if(!frame)return;c.save();c.translate(actor.position.x,actor.position.y);c.globalAlpha=frame.alpha;
 c.save();c.scale(1,.48);c.beginPath();c.rect(-28,front?frame.centerY:-12,56,front?22:frame.centerY+12);c.clip();c.strokeStyle=ICE_DARK;c.lineWidth=7;c.beginPath();c.ellipse(0,frame.centerY,frame.radiusX,frame.radiusY,0,0,TAU);c.stroke();c.strokeStyle=ICE_CYAN;c.lineWidth=2.5;c.setLineDash([5,4]);c.lineDashOffset=frame.dashOffset;c.stroke();c.setLineDash([]);c.restore();
 for(let i=0;i<4;i++){const angle=frame.phase+i*TAU/4,isFront=Math.sin(angle)>=0;if(isFront!==front)continue;const radius=15+(i%2)*3;frostShard(c,Math.cos(angle)*radius,2+Math.sin(angle)*8,angle,.33,i%2?ICE_BLUE:ICE_PALE);}
 c.restore();
}
export function drawGlacialSnareRearD12_4E(c,actor,tick){drawGlacialSnarePassD12_4E(c,actor,tick,false);}
export function drawGlacialSnareFrontD12_4E(c,actor,tick){drawGlacialSnarePassD12_4E(c,actor,tick,true);}

export function drawGlacialWardenBadgeD12_4E(c,actor,profile,ratio){
 const e=actor.elite;if(e?.affixId!=='glacial_warden'||!actor.alive)return false;const width=Math.max(40,Math.min(54,profile.visualBounds.width+4)),height=6,x=-width/2,y=profile.labels.healthBarY-3;c.fillStyle='#071b2b';c.fillRect(x-2,y-2,width+4,height+4);c.fillStyle='#205879';c.fillRect(x,y,width,height);c.fillStyle=ICE_CYAN;c.fillRect(x,y,width*ratio,height);c.strokeStyle=ICE_PALE;c.lineWidth=1;c.strokeRect(x-.5,y-.5,width+1,height+1);frostShard(c,x-8,y+height/2,.2,.5,ICE_PALE);c.textAlign='center';c.font='800 7px system-ui';c.lineWidth=2.4;c.strokeStyle='#071b2b';c.strokeText(e.label,0,y-7);c.fillStyle=ICE_PALE;c.fillText(e.label,0,y-7);c.textAlign='left';return true;
}

const TOXIC_MINT='#69e09b',TOXIC_LIME='#c7ff9a',TOXIC_DARK='#241735',TOXIC_VIOLET='#70408f',TOXIC_SLUDGE='#31543f';

function toxicDrop(c,x,y,angle,scale,fill=TOXIC_MINT){c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);c.lineJoin='round';c.fillStyle=TOXIC_DARK;c.beginPath();c.moveTo(0,-8);c.quadraticCurveTo(6,-1,4,4);c.quadraticCurveTo(0,9,-4,4);c.quadraticCurveTo(-6,-1,0,-8);c.closePath();c.fill();c.fillStyle=fill;c.beginPath();c.moveTo(0,-5);c.quadraticCurveTo(3,-1,2.3,3);c.quadraticCurveTo(0,5.5,-2.2,3);c.quadraticCurveTo(-3,-1,0,-5);c.closePath();c.fill();c.fillStyle='#efffc9';c.beginPath();c.arc(-.8,-1.6,1,0,TAU);c.fill();c.restore();}

function toxicEliteFrame(actor,tick){if(actor.elite?.affixId!=='toxic_decay'||!actor.alive)return null;const phase=(tick+actor.visualSeed%43)*.052;return {phase,centerY:9,radiusX:34,radiusY:25,dashOffset:-phase*7,alpha:.86};}
function drawToxicDecayPassD12_4F(c,actor,tick,front){const frame=toxicEliteFrame(actor,tick);if(!frame)return;c.save();c.globalAlpha=frame.alpha;
 c.save();c.scale(1,.48);c.beginPath();c.rect(-46,front?frame.centerY:-28,92,front?38:frame.centerY+28);c.clip();c.strokeStyle=TOXIC_DARK;c.lineWidth=9;c.setLineDash([9,5,3,5]);c.lineDashOffset=frame.dashOffset;c.beginPath();c.ellipse(0,frame.centerY,frame.radiusX,frame.radiusY,0,0,TAU);c.stroke();c.strokeStyle=TOXIC_MINT;c.lineWidth=3;c.stroke();c.setLineDash([]);for(let i=0;i<4;i++){const a=i*TAU/4+.4;c.strokeStyle=i%2?TOXIC_VIOLET:TOXIC_LIME;c.lineWidth=3;c.beginPath();c.moveTo(Math.cos(a)*18,frame.centerY+Math.sin(a)*13);c.lineTo(Math.cos(a)*27,frame.centerY+Math.sin(a)*20);c.stroke();}c.restore();
 for(let i=0;i<6;i++){const angle=frame.phase+i*TAU/6,isFront=Math.sin(angle)>=0;if(isFront!==front)continue;const r=25+(i%2)*6;toxicDrop(c,Math.cos(angle)*r,3+Math.sin(angle)*10,angle*.35,.34+(i%3)*.05,i%2?TOXIC_VIOLET:TOXIC_LIME);}c.restore();}
export function drawToxicDecayRearD12_4F(c,actor,tick){drawToxicDecayPassD12_4F(c,actor,tick,false);}
export function drawToxicDecayFrontD12_4F(c,actor,tick){drawToxicDecayPassD12_4F(c,actor,tick,true);}

function toxicPoisonFrame(actor,tick){const status=actor.timedStatuses?.toxic_decay_poison;if(!status||!actor.alive)return null;const phase=(tick+actor.visualSeed%37)*.075,stacks=status.stacks;return {status,phase,stacks,alpha:.52+.1*stacks,centerY:8,radiusX:16+stacks*2,radiusY:11+stacks,dashOffset:-phase*6};}
function drawToxicPoisonPassD12_4F(c,actor,tick,front){const frame=toxicPoisonFrame(actor,tick);if(!frame)return;c.save();c.translate(actor.position.x,actor.position.y);c.globalAlpha=frame.alpha;
 c.save();c.scale(1,.48);c.beginPath();c.rect(-30,front?frame.centerY:-16,60,front?28:frame.centerY+16);c.clip();c.strokeStyle=TOXIC_DARK;c.lineWidth=6;c.setLineDash([4,4]);c.lineDashOffset=frame.dashOffset;c.beginPath();c.ellipse(0,frame.centerY,frame.radiusX,frame.radiusY,0,0,TAU);c.stroke();c.strokeStyle=frame.stacks===3?TOXIC_LIME:TOXIC_MINT;c.lineWidth=2.4;c.stroke();c.setLineDash([]);c.restore();
 const count=frame.stacks*2+1;for(let i=0;i<count;i++){const angle=frame.phase+i*TAU/count,isFront=Math.sin(angle)>=0;if(isFront!==front)continue;const r=frame.radiusX-2+(i%2)*3;toxicDrop(c,Math.cos(angle)*r,2+Math.sin(angle)*(6+frame.stacks),angle*.25,.22+frame.stacks*.035,i%3===1?TOXIC_VIOLET:TOXIC_LIME);}
 if(front&&frame.status.lastApplicationAdded){const age=tick-frame.status.lastApplicationTick;if(age>=0&&age<=36){c.globalAlpha=Math.max(0,1-age/36);c.textAlign='center';c.font='900 8px system-ui';c.lineWidth=3;c.strokeStyle=TOXIC_DARK;c.strokeText('TOXIC ROT!',0,-42-age*.18);c.fillStyle=TOXIC_LIME;c.fillText('TOXIC ROT!',0,-42-age*.18);c.textAlign='left';}}
 c.restore();}
export function drawToxicPoisonRearD12_4F(c,actor,tick){drawToxicPoisonPassD12_4F(c,actor,tick,false);}
export function drawToxicPoisonFrontD12_4F(c,actor,tick){drawToxicPoisonPassD12_4F(c,actor,tick,true);}

export function drawToxicDecayBadgeD12_4F(c,actor,profile,ratio){const e=actor.elite;if(e?.affixId!=='toxic_decay'||!actor.alive)return false;const width=Math.max(38,Math.min(52,profile.visualBounds.width)),height=6,x=-width/2,y=profile.labels.healthBarY-3;c.fillStyle=TOXIC_DARK;c.fillRect(x-2,y-2,width+4,height+4);c.fillStyle=TOXIC_SLUDGE;c.fillRect(x,y,width,height);c.fillStyle=TOXIC_MINT;c.fillRect(x,y,width*ratio,height);c.strokeStyle=TOXIC_LIME;c.lineWidth=1;c.strokeRect(x-.5,y-.5,width+1,height+1);toxicDrop(c,x-8,y+height/2,.1,.48,TOXIC_LIME);c.textAlign='center';c.font='800 7px system-ui';c.lineWidth=2.4;c.strokeStyle=TOXIC_DARK;c.strokeText(e.label,0,y-7);c.fillStyle=TOXIC_LIME;c.fillText(e.label,0,y-7);c.textAlign='left';return true;}

const CITADEL_BLUE='#7196b5',CITADEL_PALE='#d2e2eb',CITADEL_DARK='#182a38',CITADEL_STEEL='#45657d',CITADEL_GOLD='#d8b968';

function citadelShield(c,x,y,scale,fill=CITADEL_BLUE){c.save();c.translate(x,y);c.scale(scale,scale);c.lineJoin='round';c.fillStyle=CITADEL_DARK;c.beginPath();c.moveTo(0,-9);c.lineTo(7,-6);c.lineTo(6,3);c.quadraticCurveTo(3,9,0,11);c.quadraticCurveTo(-3,9,-6,3);c.lineTo(-7,-6);c.closePath();c.fill();c.fillStyle=fill;c.beginPath();c.moveTo(0,-6);c.lineTo(4.5,-4);c.lineTo(4,2.5);c.quadraticCurveTo(2,6.5,0,8);c.quadraticCurveTo(-2,6.5,-4,2.5);c.lineTo(-4.5,-4);c.closePath();c.fill();c.strokeStyle=CITADEL_PALE;c.lineWidth=1.3;c.beginPath();c.moveTo(0,-5);c.lineTo(0,6);c.moveTo(-3.2,-1);c.lineTo(3.2,-1);c.stroke();c.restore();}

function citadelEllipseHalf(c,cx,cy,rx,ry,front,darkWidth,color,width){const overlap=.035,start=front?-overlap:Math.PI-overlap,end=front?Math.PI+overlap:TAU+overlap;c.lineCap='round';c.strokeStyle=CITADEL_DARK;c.lineWidth=darkWidth;c.beginPath();c.ellipse(cx,cy,rx,ry,0,start,end);c.stroke();c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.ellipse(cx,cy,rx,ry,0,start,end);c.stroke();}

function citadelEliteFrame(actor,tick){if(actor.elite?.affixId!=='iron_citadel'||!actor.alive)return null;const phase=(tick+actor.visualSeed%41)*.032,gather=Math.max(0,Math.min(1,(18-(actor.elite.nextPulseTick-tick))/18));return {phase,gather,centerY:10,radiusX:36,radiusY:25};}
function drawIronCitadelPassD12_4G(c,actor,tick,front){const f=citadelEliteFrame(actor,tick);if(!f)return;c.save();
 c.save();c.scale(1,.48);c.beginPath();c.rect(-48,front?f.centerY-1:-30,96,front?43:f.centerY+31);c.clip();c.lineJoin='miter';c.strokeStyle=CITADEL_DARK;c.lineWidth=9;c.beginPath();for(let i=0;i<8;i++){const a=i*TAU/8,r=i%2?27:36,x=Math.cos(a)*r,y=f.centerY+Math.sin(a)*r*.72;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);}c.closePath();c.stroke();c.strokeStyle=CITADEL_STEEL;c.lineWidth=3;c.stroke();c.restore();
 for(let i=0;i<6;i++){const a=f.phase+i*TAU/6,isFront=Math.sin(a)>=0;if(isFront!==front)continue;const r=27+(i%2)*4;citadelShield(c,Math.cos(a)*r,3+Math.sin(a)*11,.34+(i%3)*.035,i===2?CITADEL_GOLD:CITADEL_PALE);}
 if(!front){for(const [index,target] of (actor.elite.supportLinks??[]).entries()){const dx=target.position.x-actor.position.x,dy=target.position.y-actor.position.y,path=new Path2D();path.moveTo(0,5);path.lineTo(dx*.38,dy*.38+5);path.lineTo(dx,dy+5);c.globalAlpha=.36;c.setLineDash([4,6]);c.strokeStyle=CITADEL_DARK;c.lineWidth=5;c.stroke(path);c.strokeStyle=CITADEL_BLUE;c.lineWidth=2;c.stroke(path);c.setLineDash([]);}}
 if(actor.elite.pulse){const age=tick-actor.elite.pulse.tick;if(age>=0&&age<=32){const spread=Math.min(1,age/16),fade=Math.max(0,(32-age)/18);c.globalAlpha=fade;c.save();c.scale(1,.48);citadelEllipseHalf(c,0,10,22+spread*78,16+spread*56,front,9,CITADEL_PALE,3);c.restore();}}
 c.restore();}
export function drawIronCitadelRearD12_4G(c,actor,tick){drawIronCitadelPassD12_4G(c,actor,tick,false);}
export function drawIronCitadelFrontD12_4G(c,actor,tick){drawIronCitadelPassD12_4G(c,actor,tick,true);}

function drawIronGuardPassD12_4G(c,actor,tick,front){const g=actor.eliteGuard;if(!g?.lastImpact||!actor.alive)return;c.save();c.globalAlpha=.66+.08*g.stacks;
 if(g.lastImpact){const age=tick-g.lastImpact.tick;if(age>=0&&age<=36){c.globalAlpha=Math.max(0,1-age/36);c.save();c.scale(1,.48);citadelEllipseHalf(c,0,9,18+age*.65,13+age*.42,front,9,CITADEL_PALE,3);c.restore();const dx=g.lastImpact.sourcePosition.x-actor.position.x,dy=g.lastImpact.sourcePosition.y-actor.position.y,length=Math.hypot(dx,dy)||1,shieldX=dx/length*22,shieldY=dy/length*9+1,shieldFront=shieldY>=1;if(shieldFront===front)citadelShield(c,shieldX,shieldY,.56,CITADEL_PALE);}}
 c.restore();}
export function drawIronGuardRearD12_4G(c,actor,tick){drawIronGuardPassD12_4G(c,actor,tick,false);}
export function drawIronGuardFrontD12_4G(c,actor,tick){drawIronGuardPassD12_4G(c,actor,tick,true);}

export function drawIronCitadelBadgeD12_4G(c,actor,profile,ratio){const e=actor.elite;if(e?.affixId!=='iron_citadel'||!actor.alive)return false;const width=Math.max(38,Math.min(52,profile.visualBounds.width)),height=6,x=-width/2,y=profile.labels.healthBarY-3;c.fillStyle=CITADEL_DARK;c.fillRect(x-2,y-2,width+4,height+4);c.fillStyle='#2e4658';c.fillRect(x,y,width,height);c.fillStyle=CITADEL_BLUE;c.fillRect(x,y,width*ratio,height);c.strokeStyle=CITADEL_PALE;c.lineWidth=1;c.strokeRect(x-.5,y-.5,width+1,height+1);c.textAlign='center';c.font='800 7px system-ui';c.lineWidth=2.4;c.strokeStyle=CITADEL_DARK;c.strokeText(e.label,0,y-7);c.fillStyle=CITADEL_PALE;c.fillText(e.label,0,y-7);c.textAlign='left';return true;}

const BLOOD_CRIMSON='#d34550',BLOOD_RED='#8f2639',BLOOD_DARK='#32121d',BLOOD_GOLD='#f2c36c',BLOOD_PALE='#ffe2a0';

function bloodFang(c,x,y,angle,scale,fill=BLOOD_CRIMSON){c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);c.lineJoin='round';c.fillStyle=BLOOD_DARK;c.beginPath();c.moveTo(-5,-6);c.lineTo(5,-2);c.lineTo(2,8);c.lineTo(-1,3);c.lineTo(-6,7);c.closePath();c.fill();c.fillStyle=fill;c.beginPath();c.moveTo(-3,-3);c.lineTo(2,-1);c.lineTo(1,5);c.lineTo(-1,1);c.lineTo(-4,4);c.closePath();c.fill();c.restore();}
function bloodEllipseHalf(c,cx,cy,rx,ry,front,darkWidth,color,width,dashOffset=0){const overlap=.035,start=front?-overlap:Math.PI-overlap,end=front?Math.PI+overlap:TAU+overlap;c.lineCap='round';c.strokeStyle=BLOOD_DARK;c.lineWidth=darkWidth;c.beginPath();c.ellipse(cx,cy,rx,ry,0,start,end);c.stroke();c.strokeStyle=color;c.lineWidth=width;c.setLineDash([7,4,2,4]);c.lineDashOffset=dashOffset;c.beginPath();c.ellipse(cx,cy,rx,ry,0,start,end);c.stroke();c.setLineDash([]);}
function bloodBerserkerFrame(actor,tick){if(actor.elite?.affixId!=='blood_berserker'||!actor.alive)return null;const phase=(tick+actor.visualSeed%43)*.052,gather=Math.max(0,Math.min(1,(18-(actor.elite.nextPulseTick-tick))/18));return {phase,gather,centerY:10,radiusX:36,radiusY:25,dashOffset:-phase*8};}
function drawBloodBerserkerPassD12_4H_A(c,actor,tick,front){const frame=bloodBerserkerFrame(actor,tick);if(!frame)return;c.save();
 c.save();c.scale(1,.48);bloodEllipseHalf(c,0,frame.centerY,frame.radiusX,frame.radiusY,front,9,frame.gather>.05?BLOOD_GOLD:BLOOD_RED,3,frame.dashOffset);c.restore();
 for(let i=0;i<6;i++){const a=frame.phase+i*TAU/6,isFront=Math.sin(a)>=0;if(isFront!==front)continue;const r=27+(i%2)*5;bloodFang(c,Math.cos(a)*r,3+Math.sin(a)*11,a+.6,.32+(i%3)*.04,i===2?BLOOD_GOLD:BLOOD_CRIMSON);}
 const pulse=actor.elite.pulse;if(pulse){const age=tick-pulse.tick;if(age>=0&&age<=24){const spread=Math.min(1,age/12),fade=Math.max(0,(24-age)/12);c.globalAlpha=fade;c.save();c.scale(1,.48);bloodEllipseHalf(c,0,10,22+spread*24,16+spread*16,front,8,BLOOD_GOLD,2.6,-age*.6);c.restore();}}
 c.restore();}
export function drawBloodBerserkerRearD12_4H_A(c,actor,tick){drawBloodBerserkerPassD12_4H_A(c,actor,tick,false);}
export function drawBloodBerserkerFrontD12_4H_A(c,actor,tick){drawBloodBerserkerPassD12_4H_A(c,actor,tick,true);}

function bloodTransferPacket(c,x,y,angle,scale,leading){c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);c.lineJoin='round';c.fillStyle=BLOOD_DARK;c.beginPath();c.moveTo(-10,0);c.lineTo(-3,-5);c.lineTo(8,0);c.lineTo(-3,5);c.closePath();c.fill();c.fillStyle=leading?BLOOD_GOLD:BLOOD_CRIMSON;c.beginPath();c.moveTo(-7,0);c.lineTo(-2,-2.8);c.lineTo(6,0);c.lineTo(-2,2.8);c.closePath();c.fill();c.strokeStyle=BLOOD_PALE;c.lineWidth=1;c.beginPath();c.moveTo(1,-1.2);c.lineTo(6,0);c.lineTo(1,1.2);c.stroke();c.restore();}
function bloodArrivalFlare(c,x,y,age,seed){const flareAge=age-18;if(flareAge<0||flareAge>16)return;const fade=1-flareAge/16,spread=8+flareAge*.72;c.save();c.translate(x,y);c.globalAlpha=fade;c.scale(1,.5);c.strokeStyle=BLOOD_DARK;c.lineWidth=6;c.beginPath();c.ellipse(0,3,spread+7,spread*.62+4,0,0,TAU);c.stroke();c.strokeStyle=BLOOD_GOLD;c.lineWidth=2.2;c.stroke();c.restore();c.save();c.translate(x,y-10);c.globalAlpha=fade;for(let i=0;i<5;i++){const a=(i*TAU/5)+((seed%17)-8)*.025,r=6+flareAge*.7;bloodFang(c,Math.cos(a)*r,Math.sin(a)*r,a+.4,.28+i*.018,i%2?BLOOD_GOLD:BLOOD_CRIMSON);}c.restore();}

// Transfer packets are drawn before the shared actor depth pass so they travel behind bodies.
export function drawBerserkerTransfersD12_4H_A(c,model,tick){for(const sourceId in model.entitiesById){const source=model.entitiesById[sourceId],pulse=source.elite?.affixId==='blood_berserker'?source.elite.pulse:null;if(!source.alive||!pulse)continue;const age=tick-pulse.tick;if(age<0||age>34)continue;for(let index=0;index<pulse.recipients.length;index++){const projected=pulse.recipients[index];if(projected.stacks<=projected.previousStacks)continue;const target=model.entitiesById[projected.entityId];if(!target?.alive)continue;const sx=source.position.x,sy=source.position.y-6,tx=target.position.x,ty=target.position.y-6,dx=tx-sx,dy=ty-sy,length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length,seed=((source.visualSeed>>>0)^((target.visualSeed??0)>>>0)^(index*2654435761))>>>0,bend=((seed&1)?1:-1)*(8+(seed%9)),cx=(sx+tx)/2+nx*bend,cy=(sy+ty)/2+ny*bend-5;for(let packet=0;packet<4;packet++){const localAge=age-packet*3;if(localAge<0||localAge>24)continue;const p=localAge/24,q=1-p,x=q*q*sx+2*q*p*cx+p*p*tx,y=q*q*sy+2*q*p*cy+p*p*ty,tdx=2*q*(cx-sx)+2*p*(tx-cx),tdy=2*q*(cy-sy)+2*p*(ty-cy),fade=Math.min(1,localAge/4)*Math.min(1,(24-localAge)/5);c.save();c.globalAlpha=.34+.66*fade;bloodTransferPacket(c,x,y,Math.atan2(tdy,tdx),.64+packet*.035,packet<2);c.restore();}bloodArrivalFlare(c,tx,ty,age,seed);}}}

export function drawBloodBerserkerBadgeD12_4H_A(c,actor,profile,ratio){const e=actor.elite;if(e?.affixId!=='blood_berserker'||!actor.alive)return false;const width=Math.max(40,Math.min(54,profile.visualBounds.width+4)),height=6,x=-width/2,y=profile.labels.healthBarY-3;c.fillStyle=BLOOD_DARK;c.fillRect(x-2,y-2,width+4,height+4);c.fillStyle='#57202d';c.fillRect(x,y,width,height);c.fillStyle=BLOOD_CRIMSON;c.fillRect(x,y,width*ratio,height);c.strokeStyle=BLOOD_GOLD;c.lineWidth=1;c.strokeRect(x-.5,y-.5,width+1,height+1);bloodFang(c,x-8,y+height/2,.2,.48,BLOOD_GOLD);c.textAlign='center';c.font='800 7px system-ui';c.lineWidth=2.4;c.strokeStyle=BLOOD_DARK;c.strokeText(e.label,0,y-7);c.fillStyle=BLOOD_PALE;c.fillText(e.label,0,y-7);c.textAlign='left';return true;}

const NULL_DARK='#251339',NULL_VIOLET='#9b5de5',NULL_PALE='#e4c7ff',NULL_FRACTURE='#c98cff';
function nullShard(c,x,y,angle,scale,fill=NULL_VIOLET){c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);c.lineJoin='round';c.fillStyle=NULL_DARK;c.beginPath();c.moveTo(-7,-2);c.lineTo(-1,-7);c.lineTo(2,-2);c.lineTo(7,0);c.lineTo(1,3);c.lineTo(-2,8);c.closePath();c.fill();c.fillStyle=fill;c.beginPath();c.moveTo(-4,-1);c.lineTo(-1,-4);c.lineTo(1,-.5);c.lineTo(4,.2);c.lineTo(.5,1.8);c.lineTo(-1,4);c.closePath();c.fill();c.restore();}
function nullHalfEllipse(c,cx,cy,rx,ry,front,darkWidth,color,width,dashOffset=0){const overlap=.025,start=front?-overlap:Math.PI-overlap,end=front?Math.PI+overlap:TAU+overlap;c.lineCap='round';c.strokeStyle=NULL_DARK;c.lineWidth=darkWidth;c.beginPath();c.ellipse(cx,cy,rx,ry,0,start,end);c.stroke();c.strokeStyle=color;c.lineWidth=width;c.setLineDash([7,5,2,5]);c.lineDashOffset=dashOffset;c.beginPath();c.ellipse(cx,cy,rx,ry,0,start,end);c.stroke();c.setLineDash([]);}
function nullifierFrame(actor,tick){if(actor.elite?.affixId!=='nullifier'||!actor.alive)return null;const remaining=actor.elite.nextPulseTick-tick,charge=remaining>0&&remaining<=60?(61-remaining)/60:0,phase=(tick+actor.visualSeed%47)*.055;return {remaining,charge,phase,dashOffset:-phase*9};}
function drawNullifierPass(c,actor,tick,front){const frame=nullifierFrame(actor,tick);if(!frame)return;c.save();
 c.save();c.scale(1,.48);nullHalfEllipse(c,0,11,29,23,front,7,NULL_VIOLET,2.3,frame.dashOffset);if(frame.charge>0){c.globalAlpha=.38+.55*frame.charge;nullHalfEllipse(c,0,11,90,90,front,8+frame.charge*3,frame.charge>.7?NULL_PALE:NULL_FRACTURE,2.4+frame.charge*1.2,frame.dashOffset*1.5);}c.restore();
 const fragmentCount=frame.charge>0?10:4;for(let i=0;i<fragmentCount;i++){const a=frame.phase+i*TAU/fragmentCount,isFront=Math.sin(a)>=0;if(isFront!==front)continue;const radius=frame.charge>0?80-frame.charge*49:24+(i%2)*4,x=Math.cos(a)*radius,y=4+Math.sin(a)*radius*.48;nullShard(c,x,y,a+Math.PI*.5,.34+frame.charge*.18,i%3===1?NULL_PALE:NULL_FRACTURE);}
 const pulse=actor.elite.pulse;if(pulse){const age=tick-pulse.tick;if(age>=0&&age<=42){const spread=Math.min(1,age/24),fade=Math.max(0,(42-age)/18),radius=18+spread*72;c.globalAlpha=fade;c.save();c.scale(1,.48);nullHalfEllipse(c,0,11,radius,radius,front,10,NULL_PALE,3.2,-age*.8);c.restore();for(let i=0;i<8;i++){const a=i*TAU/8+(actor.visualSeed%19)*.037,isFront=Math.sin(a)>=0;if(isFront!==front)continue;nullShard(c,Math.cos(a)*radius,4+Math.sin(a)*radius*.48,a+.7,.3+spread*.18,i%2?NULL_VIOLET:NULL_PALE);}}}
 c.restore();}
export function drawNullifierRearD12_4I(c,actor,tick){drawNullifierPass(c,actor,tick,false);}
export function drawNullifierFrontD12_4I(c,actor,tick){drawNullifierPass(c,actor,tick,true);}

function nullifiedFrame(actor,tick){const status=actor.timedStatuses?.nullified;if(!status||!actor.alive)return null;const phase=(tick+actor.visualSeed%41)*.07,fade=Math.min(1,status.remainingTicks/12);return {phase,alpha:(.46+.12*Math.sin(phase))*fade,centerY:8,radiusX:20,radiusY:14,dashOffset:-phase*7};}
function drawNullifiedPass(c,actor,tick,front){const frame=nullifiedFrame(actor,tick);if(!frame)return;c.save();c.translate(actor.position.x,actor.position.y);c.globalAlpha=frame.alpha;c.save();c.scale(1,.48);nullHalfEllipse(c,0,frame.centerY,frame.radiusX,frame.radiusY,front,6,NULL_FRACTURE,2.2,frame.dashOffset);c.restore();for(let i=0;i<5;i++){const a=frame.phase+i*TAU/5,isFront=Math.sin(a)>=0;if(isFront!==front)continue;const r=17+(i%2)*3;nullShard(c,Math.cos(a)*r,1+Math.sin(a)*8,a+.8,.24,i%2?NULL_PALE:NULL_VIOLET);}c.restore();}
export function drawNullifiedRearD12_4I(c,actor,tick){drawNullifiedPass(c,actor,tick,false);}
export function drawNullifiedFrontD12_4I(c,actor,tick){drawNullifiedPass(c,actor,tick,true);}

export function drawNullifierBadgeD12_4I(c,actor,profile,ratio){const e=actor.elite;if(e?.affixId!=='nullifier'||!actor.alive)return false;const width=Math.max(38,Math.min(52,profile.visualBounds.width+2)),height=6,x=-width/2,y=profile.labels.healthBarY-3;c.fillStyle=NULL_DARK;c.fillRect(x-2,y-2,width+4,height+4);c.fillStyle='#482368';c.fillRect(x,y,width,height);c.fillStyle=NULL_VIOLET;c.fillRect(x,y,width*ratio,height);c.strokeStyle=NULL_PALE;c.lineWidth=1;c.strokeRect(x-.5,y-.5,width+1,height+1);nullShard(c,x-8,y+height/2,.2,.45,NULL_PALE);c.textAlign='center';c.font='800 7px system-ui';c.lineWidth=2.4;c.strokeStyle=NULL_DARK;c.strokeText(e.label,0,y-7);c.fillStyle=NULL_PALE;c.fillText(e.label,0,y-7);c.textAlign='left';return true;}

const WEB_SILVER='#c7e9ef',WEB_CYAN='#88e8f6',WEB_WHITE='#f1fdff',WEB_INDIGO='#241b4b';
function webKnot(c,x,y,angle,scale,light=false){c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);c.lineCap='round';c.lineJoin='round';c.strokeStyle=WEB_INDIGO;c.lineWidth=5;c.beginPath();c.moveTo(-5,3);c.quadraticCurveTo(-1,-6,4,-2);c.quadraticCurveTo(8,1,3,6);c.stroke();c.strokeStyle=light?WEB_WHITE:WEB_CYAN;c.lineWidth=2;c.stroke();c.beginPath();c.moveTo(2,5);c.lineTo(7,9);c.stroke();c.restore();}
function webArc(c,rx,ry,radius,front,alpha,lineWidth=1.7){const overlap=.035,start=front?-overlap:Math.PI-overlap,end=front?Math.PI+overlap:TAU+overlap;c.globalAlpha=alpha;c.strokeStyle=WEB_INDIGO;c.lineWidth=lineWidth+2.2;c.beginPath();c.ellipse(0,8,rx*radius,ry*radius,0,start,end);c.stroke();c.strokeStyle=WEB_SILVER;c.lineWidth=lineWidth;c.stroke();}
function drawWebWeaverPass(c,actor,tick,front){if(actor.elite?.affixId!=='web_weaver'||!actor.alive)return;const phase=(tick+(actor.visualSeed%53))*.052,gather=Math.max(0,Math.min(1,(18-(actor.elite.nextPulseTick-tick))/18));c.save();for(let ring=1;ring<=2;ring++)webArc(c,32,23,.48+ring*.25,front,.5+gather*.28,1.3+ring*.2);for(let i=0;i<8;i++){const a=i*TAU/8+(actor.visualSeed%11)*.012,isFront=Math.sin(a)>=0;if(isFront!==front)continue;const x1=Math.cos(a)*10,y1=8+Math.sin(a)*5,x2=Math.cos(a)*32,y2=8+Math.sin(a)*23;c.globalAlpha=.62;c.strokeStyle=WEB_INDIGO;c.lineWidth=4;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.strokeStyle=i%2?WEB_SILVER:WEB_CYAN;c.lineWidth=1.6;c.stroke();const orbit=phase+i*TAU/8,r=25+(i%2)*4;webKnot(c,Math.cos(orbit)*r,3+Math.sin(orbit)*12,orbit+.7,.32+gather*.08,i%3===0);}c.restore();}
export function drawWebWeaverRearD12_4J(c,actor,tick){drawWebWeaverPass(c,actor,tick,false);}
export function drawWebWeaverFrontD12_4J(c,actor,tick){drawWebWeaverPass(c,actor,tick,true);}

export function drawWebWeaverBadgeD12_4J(c,actor,profile,ratio){const e=actor.elite;if(e?.affixId!=='web_weaver'||!actor.alive)return false;const width=Math.max(42,Math.min(56,profile.visualBounds.width+6)),height=6,x=-width/2,y=profile.labels.healthBarY-3;c.fillStyle=WEB_INDIGO;c.fillRect(x-2,y-2,width+4,height+4);c.fillStyle='#34546b';c.fillRect(x,y,width,height);c.fillStyle=WEB_CYAN;c.fillRect(x,y,width*ratio,height);c.strokeStyle=WEB_WHITE;c.lineWidth=1;c.strokeRect(x-.5,y-.5,width+1,height+1);webKnot(c,x-8,y+height/2,.2,.4,true);c.textAlign='center';c.font='800 7px system-ui';c.lineWidth=2.4;c.strokeStyle=WEB_INDIGO;c.strokeText(e.label,0,y-7);c.fillStyle=WEB_WHITE;c.fillText(e.label,0,y-7);c.textAlign='left';return true;}

function groundWeb(c,row,tick,pending){const x=row.position.x,y=row.position.y,rx=row.geometry.radiusX,ry=row.geometry.radiusY,seed=parseInt(row.hazardId.slice(-8),16)>>>0;c.save();c.translate(x,y);let alpha=.72,contraction=1;if(pending){const progress=Math.max(0,Math.min(1,(tick-row.startedTick)/(row.resolvesTick-row.startedTick)));alpha=.2+.58*progress;contraction=1.34-progress*.34;}else{alpha=Math.min(.78,row.ageTicks/10*.78,row.remainingTicks/24*.78);if(row.ageTicks<10)contraction=1.12-row.ageTicks*.012;}c.globalAlpha=Math.max(0,alpha);for(let ring=1;ring<=4;ring++){const r=(ring/4)*contraction,crooked=((seed>>ring)&3)-1.5;c.strokeStyle=WEB_INDIGO;c.lineWidth=4;c.beginPath();c.ellipse(crooked,0,rx*r,ry*r,0,0,TAU);c.stroke();c.strokeStyle=ring%2?WEB_SILVER:WEB_CYAN;c.lineWidth=1.6;c.stroke();}for(let i=0;i<8;i++){const a=i*TAU/8+(seed%17)*.004,wobble=((seed>>(i%16))&3)-1.5;c.strokeStyle=WEB_INDIGO;c.lineWidth=4;c.beginPath();c.moveTo(Math.cos(a)*5,Math.sin(a)*3);c.quadraticCurveTo(Math.cos(a)*rx*.52-Math.sin(a)*wobble,Math.sin(a)*ry*.52+Math.cos(a)*wobble,Math.cos(a)*rx*contraction,Math.sin(a)*ry*contraction);c.stroke();c.strokeStyle=i%2?WEB_SILVER:WEB_CYAN;c.lineWidth=1.5;c.stroke();}if(!pending&&row.ageTicks<=12){const snap=1-row.ageTicks/12;c.globalAlpha=snap*.85;c.strokeStyle=WEB_WHITE;c.lineWidth=3+snap*3;c.beginPath();c.ellipse(0,0,rx*(1+snap*.18),ry*(1+snap*.18),0,0,TAU);c.stroke();}c.restore();}
export function drawWebWeaverHazardsD12_4J(c,model,tick){const rows=model.hostileHazards;if(!rows)return;for(const row of rows.pendingCasts)if(row.kind==='web_weaver_web')groundWeb(c,row,tick,true);for(const row of rows.active)if(row.kind==='web_weaver_web')groundWeb(c,row,tick,false);}

function drawWebbedPass(c,actor,tick,front){const status=actor.timedStatuses?.webbed;if(!status||!actor.alive)return;const phase=(tick+(actor.visualSeed%31))*.075;c.save();c.translate(actor.position.x,actor.position.y);c.globalAlpha=.74;for(let ring=1;ring<=2;ring++)webArc(c,20,14,.48+ring*.28,front,.66,1.25);for(let i=0;i<5;i++){const a=phase+i*TAU/5,isFront=Math.sin(a)>=0;if(isFront!==front)continue;webKnot(c,Math.cos(a)*17,5+Math.sin(a)*7,a+.7,.22,i%2===0);}c.restore();}
export function drawWebbedRearD12_4J(c,actor,tick){drawWebbedPass(c,actor,tick,false);}
export function drawWebbedFrontD12_4J(c,actor,tick){drawWebbedPass(c,actor,tick,true);}

const SLAG_ORANGE='#f97316',SLAG_EMBER='#ef3f20',SLAG_HEAT='#fff0a8',SLAG_CRUST='#211a19',SLAG_SHADOW='#25130f';
function slagFragment(c,x,y,angle,scale,hot=false){c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);c.lineJoin='round';c.fillStyle=SLAG_SHADOW;c.beginPath();c.moveTo(-5,2);c.lineTo(-2,-5);c.lineTo(5,-3);c.lineTo(6,3);c.lineTo(0,6);c.closePath();c.fill();c.strokeStyle=hot?SLAG_HEAT:SLAG_ORANGE;c.lineWidth=1.5;c.beginPath();c.moveTo(-2,-3);c.lineTo(0,1);c.lineTo(4,-1);c.moveTo(0,1);c.lineTo(2,4);c.stroke();c.restore();}
function slagHalfArc(c,front,alpha){const overlap=.035,start=front?-overlap:Math.PI-overlap,end=front?Math.PI+overlap:TAU+overlap;c.globalAlpha=alpha;c.strokeStyle=SLAG_SHADOW;c.lineWidth=5;c.beginPath();c.ellipse(0,8,32,21,0,start,end);c.stroke();c.strokeStyle=SLAG_ORANGE;c.lineWidth=2;c.stroke();}
function drawSlagShaperPass(c,actor,tick,front){if(actor.elite?.affixId!=='slag_shaper'||!actor.alive)return;const phase=(tick+(actor.visualSeed%47))*.061,gather=Math.max(0,Math.min(1,(18-(actor.elite.nextPulseTick-tick))/18));c.save();slagHalfArc(c,front,.54+gather*.24);for(let i=0;i<6;i++){const a=phase+i*TAU/6,isFront=Math.sin(a)>=0;if(isFront!==front)continue;const r=25+(i%2)*4;slagFragment(c,Math.cos(a)*r,4+Math.sin(a)*12,a+.4,.42+gather*.08,i%3===0);}c.restore();}
export function drawSlagShaperRearD12_4K(c,actor,tick){drawSlagShaperPass(c,actor,tick,false);}
export function drawSlagShaperFrontD12_4K(c,actor,tick){drawSlagShaperPass(c,actor,tick,true);}

export function drawSlagShaperBadgeD12_4K(c,actor,profile,ratio){const e=actor.elite;if(e?.affixId!=='slag_shaper'||!actor.alive)return false;const width=Math.max(42,Math.min(56,profile.visualBounds.width+6)),height=6,x=-width/2,y=profile.labels.healthBarY-3;c.fillStyle=SLAG_SHADOW;c.fillRect(x-2,y-2,width+4,height+4);c.fillStyle='#64251c';c.fillRect(x,y,width,height);c.fillStyle=SLAG_ORANGE;c.fillRect(x,y,width*ratio,height);c.strokeStyle=SLAG_HEAT;c.lineWidth=1;c.strokeRect(x-.5,y-.5,width+1,height+1);slagFragment(c,x-8,y+height/2,.2,.42,true);c.textAlign='center';c.font='800 7px system-ui';c.lineWidth=2.4;c.strokeStyle=SLAG_SHADOW;c.strokeText(e.label,0,y-7);c.fillStyle=SLAG_HEAT;c.fillText(e.label,0,y-7);c.textAlign='left';return true;}

function groundSlag(c,row,tick,pending){const x=row.position.x,y=row.position.y,rx=row.geometry.radiusX,ry=row.geometry.radiusY,seed=parseInt(row.hazardId.slice(-8),16)>>>0;c.save();c.translate(x,y);let alpha=.88,contraction=1;if(pending){const progress=Math.max(0,Math.min(1,(tick-row.startedTick)/(row.resolvesTick-row.startedTick)));alpha=.25+.62*progress;contraction=progress===1?1:1.16-progress*.16;}else alpha=Math.min(.9,row.ageTicks/8*.9,row.remainingTicks/20*.9);c.globalAlpha=Math.max(0,alpha);c.fillStyle=pending?SLAG_SHADOW:SLAG_CRUST;c.beginPath();c.ellipse(0,0,rx*contraction,ry*contraction,0,0,TAU);c.fill();c.strokeStyle=SLAG_SHADOW;c.lineWidth=2.2;c.stroke();if(!pending){c.fillStyle=SLAG_ORANGE;c.beginPath();c.ellipse(0,0,rx*.78,ry*.68,0,0,TAU);c.fill();c.fillStyle=SLAG_HEAT;c.globalAlpha*=.72;c.beginPath();c.ellipse(-rx*.2,-ry*.12,rx*.28,ry*.2,0,0,TAU);c.fill();}c.lineCap='round';for(let i=0;i<5;i++){const a=i*TAU/5+(seed%13)*.011,length=(pending?.55:.72)*contraction;c.strokeStyle=SLAG_SHADOW;c.lineWidth=3;c.beginPath();c.moveTo(Math.cos(a)*rx*.12,Math.sin(a)*ry*.12);c.lineTo(Math.cos(a)*rx*length,Math.sin(a)*ry*length);c.stroke();c.strokeStyle=pending?SLAG_ORANGE:SLAG_HEAT;c.lineWidth=1;c.stroke();}if(!pending){for(let i=0;i<2;i++){const phase=(tick+seed%31+i*17)*.13,r=.9+((Math.sin(phase)+1)*.45);c.fillStyle=i?SLAG_HEAT:SLAG_EMBER;c.beginPath();c.arc((i?-.28:.34)*rx,Math.sin(phase)*ry*.22,r,0,TAU);c.fill();}}c.restore();}
export function drawSlagShaperHazardsD12_4K(c,model,tick){const rows=model.hostileHazards;if(!rows)return;for(const row of rows.pendingCasts)if(row.kind==='slag_shaper_pool')groundSlag(c,row,tick,true);for(const row of rows.active)if(row.kind==='slag_shaper_pool')groundSlag(c,row,tick,false);}
