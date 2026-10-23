// Small, diegetic landmarks for the three native Woodland pilot encounters.
// Graphics and labels never alter combat, collision, rewards, or saved state.
import {projectToLocalFrameD9} from '../shared/contracts/local_world_frames_d9.js';
import {depthItem} from './world_depth_presentation.js';
import {WOODLAND_EVENT_PILOT_V3_7,woodlandPilotWorldPosition} from '../shared/generation/woodland_event_pilot_v3_7.js';

function drawLandmark(ctx,event,x,y,time,near,completed) {
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle='rgba(8,12,9,.45)';ctx.beginPath();ctx.ellipse(0,12,70,22,0,0,Math.PI*2);ctx.fill();
  if(event.kind==='abandoned_camp') {
    ctx.strokeStyle='#594733';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-42,-3);ctx.lineTo(-29,16);ctx.moveTo(-40,16);ctx.lineTo(-22,-2);ctx.stroke();
    ctx.fillStyle='#5b4029';ctx.fillRect(-36,-23,31,17);ctx.strokeStyle='#a08754';ctx.lineWidth=2;ctx.strokeRect(-36,-23,31,17);
    ctx.fillStyle='#2c2820';ctx.beginPath();ctx.ellipse(18,7,21,11,0,0,Math.PI*2);ctx.fill();
    for(let n=0;n<7;n++){const a=n*Math.PI*2/7;ctx.fillStyle=n%2?'#756956':'#443e32';ctx.fillRect(16+Math.cos(a)*15,4+Math.sin(a)*8,8,5);}
    if(!completed){ctx.fillStyle='#e7a047';ctx.beginPath();ctx.moveTo(11,6);ctx.quadraticCurveTo(21,-20+Math.sin(time/380)*3,29,4);ctx.closePath();ctx.fill();
      ctx.fillStyle='#ffe0a4';ctx.beginPath();ctx.moveTo(17,5);ctx.lineTo(21,-8);ctx.lineTo(24,5);ctx.fill();}
  }else if(event.kind==='roaming_pack'){
    for(let i=0;i<9;i++){const a=i*Math.PI*2/9,xx=Math.cos(a)*42,yy=Math.sin(a)*21;ctx.strokeStyle=i%2?'#425132':'#6b683c';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(xx,yy+8);ctx.lineTo(xx-8,yy-11);ctx.lineTo(xx+2,yy-6);ctx.stroke();}
    ctx.fillStyle='#72513b';ctx.beginPath();ctx.ellipse(0,5,17,8,0,0,Math.PI*2);ctx.fill();
    for(let i=0;i<5;i++){const x=-18+i*9;ctx.fillStyle=i%2?'#90825a':'#b8a16f';ctx.beginPath();ctx.arc(x,-3+Math.sin(time/590+i)*2,3,0,Math.PI*2);ctx.fill();}
  }else{
    ctx.fillStyle='#5b5c4c';ctx.beginPath();ctx.moveTo(-29,8);ctx.lineTo(-22,-15);ctx.lineTo(14,-23);ctx.lineTo(34,6);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#adb296';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-20,0);ctx.lineTo(-7,-14);ctx.lineTo(16,-10);ctx.stroke();
    ctx.fillStyle='#5c4426';ctx.fillRect(-17,-21,34,8);
    ctx.fillStyle=completed?'#5e624d':'#dbbb74';ctx.beginPath();ctx.arc(0,-16,4+Math.sin(time/470)*.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#735237';ctx.fillRect(26,-33,5,43);
    ctx.fillStyle='#a18d69';ctx.beginPath();ctx.moveTo(31,-31);ctx.lineTo(49,-28);ctx.lineTo(31,-14);ctx.fill();
  }
  if(near){
    const label=completed?event.label+' · Cleared':event.label;
    ctx.font='bold 13px Georgia, serif';ctx.textAlign='center';
    const w=ctx.measureText(label).width+22;
    ctx.fillStyle='rgba(11,18,20,.84)';ctx.strokeStyle=completed?'#7b8266':'#c9a86c';ctx.lineWidth=1;
    ctx.beginPath();ctx.roundRect(-w/2,-70,w,26,6);ctx.fill();ctx.stroke();
    ctx.fillStyle=completed?'#b1b7a0':'#f1d4a0';ctx.fillText(label,0,-52);
  }
  ctx.restore();
}
export function woodlandPilotEventDepthItems(model,viewport,time) {
  if(!model.space?.overworld||!model.navigation?.position||!model.navigation?.frames)return [];
  const {frames,position}=model.navigation;
  const hero=projectToLocalFrameD9(position,frames);
  if(!hero)return [];
  const status=new Map((model.woodlandPilotEvents??[]).map(event=>[event.slotId,event.state]));
  const result=[];
  for(const event of WOODLAND_EVENT_PILOT_V3_7){
    const center=projectToLocalFrameD9(woodlandPilotWorldPosition(event),frames);
    if(!center||center.x<viewport.x-125||center.y<viewport.y-125||center.x>viewport.x+viewport.width+125||center.y>viewport.y+viewport.height+125)continue;
    const near=Math.hypot(center.x-hero.x,center.y-hero.y)<280;
    const completed=status.get(event.slotId)==='completed';
    result.push(depthItem({id:'woodland-event/'+event.slotId,anchorX:center.x,anchorY:center.y+22,
      draw:ctx=>drawLandmark(ctx,event,center.x,center.y,time,near,completed)}));
  }
  return result;
}
