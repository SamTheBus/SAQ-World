import {tavernFloor,TAVERN_INTERIOR_V1} from '../shared/content/tavern_interior_v1.js';
import {depthItem} from './world_depth_presentation.js';
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
function furniture(c,p){const x=p.x*32,y=p.y*32,w=p.w*32,h=p.h*32;
 rect(c,x+3,y+3,w-2,h,'#0005');c.strokeStyle='#352619';c.lineWidth=2;
 if(p.type==='bed'){
  rect(c,x+2,y-8,w-4,h+6,'#55402d');rect(c,x+6,y-6,w-12,h-1,'#eee1ba');rect(c,x+24,y-4,w-30,h-5,'#617e79');rect(c,x+8,y-4,13,h-5,'#fbefd1');c.strokeRect(x+2,y-8,w-4,h+6);rect(c,x+1,y-12,5,h+12,'#89704c');
 }else if(['table','desk','counter','worktop'].includes(p.type)){
  rect(c,x+5,y+h-10,5,9,'#3b281b');rect(c,x+w-10,y+h-10,5,9,'#3b281b');rect(c,x+2,y-10,w-4,h-2,'#714d2e');rect(c,x+2,y-13,w-4,h-2,'#aa7c48');c.strokeRect(x+2,y-13,w-4,h-2);
  c.strokeStyle='#725532';for(let yy=y-6;yy<y+h-15;yy+=10){c.beginPath();c.moveTo(x+4,yy);c.lineTo(x+w-4,yy);c.stroke();}
  if(p.type==='counter'){for(let yy=y+8;yy<y+h-12;yy+=30){rect(c,x+8,yy-12,8,9,'#ddd0a0');rect(c,x+20,yy-14,5,12,'#7f9669');}}
  else if(p.type==='worktop'){rect(c,x+7,y+4,18,10,'#dbcfad');rect(c,x+9,y+7,13,3,'#718255');}
  else {c.fillStyle='#dfcda0';c.beginPath();c.ellipse(x+w*.5,y+h*.45-13,9,6,0,0,7);c.fill();rect(c,x+w*.7,y+h*.5-19,6,8,'#b5a484');}
 }else if(['chair','bench'].includes(p.type)){
  rect(c,x+4,y+8,w-8,h-12,'#674a2e');rect(c,x+3,y-9,w-6,10,'#926c3e');rect(c,x+6,y+1,w-12,h-17,'#b88b4e');rect(c,x+5,y+h-6,5,6,'#3f2e20');rect(c,x+w-10,y+h-6,5,6,'#3f2e20');
 }else if(['hearth','oven'].includes(p.type)){
  rect(c,x+2,y-16,w-4,h+14,'#756b5c');rect(c,x+8,y+h-29,w-16,22,'#28251e');rect(c,x+11,y+h-21,w-22,12,'#cd713b');rect(c,x+14,y+h-19,w-28,8,'#f2bd66');c.strokeStyle='#504b40';for(let yy=y-10;yy<y+h;yy+=12){c.beginPath();c.moveTo(x+3,yy);c.lineTo(x+w-3,yy);c.stroke();}rect(c,x,y+h-8,w,6,'#9c9277');
 }else {rect(c,x+2,y-15,w-4,h+12,'#6a4c31');rect(c,x+5,y-12,w-10,h+5,'#93744a');c.strokeRect(x+2,y-15,w-4,h+12);rect(c,x+w/2-1,y-9,2,h,'#4d3826');rect(c,x+w*.7,y+4,3,4,'#d1b461');}
}
export function drawTavernGround(c,space){const f=tavernFloor(space.settlementInterior.floorId),r=TAVERN_INTERIOR_V1;
 rect(c,0,0,r.width*32,r.height*32,'#322e25');rect(c,32,32,384,320,'#936b43');
 c.strokeStyle='#684d33';c.lineWidth=1;
 for(let y=38;y<348;y+=16)for(let x=43;x<408;x+=43){const length=14+((x*3+y*7)%19);c.strokeStyle=(x+y)%2?'#a47b4c66':'#533c2344';c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+length*.5,y-2,x+length,y);c.stroke();}c.strokeStyle='#684d33';for(let y=32;y<352;y+=16){c.beginPath();c.moveTo(32,y);c.lineTo(416,y);c.stroke();for(let x=32+((y/16)%3)*39;x<416;x+=112){c.beginPath();c.moveTo(x,y);c.lineTo(x,y+16);c.stroke();}}
 if(f.id==='ground'){rect(c,182,177,87,113,'#794e3b');c.strokeStyle='#cbb37a';c.lineWidth=2;c.strokeRect(186,181,79,105);rect(c,320,32,96,160,'#9b9580');c.strokeStyle='#797362';for(let y=32;y<192;y+=32){c.beginPath();c.moveTo(320,y);c.lineTo(416,y);c.stroke();}for(let x=320;x<416;x+=32){c.beginPath();c.moveTo(x,32);c.lineTo(x,192);c.stroke();}rect(c,32,252,49,39,'#a58c5c');}
 else {rect(c,195,34,47,252,'#7b4d3b');c.strokeStyle='#c7aa6d';c.strokeRect(199,37,39,246);for(const d of f.destinations){rect(c,d.x-23,d.y-20,46,38,'#657775');}}
 const s=f.stairs;rect(c,s.x*32,s.y*32,s.w*32,s.h*32,'#513e2c');for(let i=0;i<7;i++){rect(c,s.x*32+6,s.y*32+i*8+3,s.w*32-12,5,'#bda275');}c.strokeStyle='#d1bb89';c.lineWidth=2;c.beginPath();c.moveTo((s.x+.5)*32,(s.y+1.5)*32);c.lineTo((s.x+.5)*32,(s.y+.4)*32);c.lineTo((s.x+.3)*32,(s.y+.65)*32);c.stroke();
 // Modest grounded hearth warmth, entirely presentation owned.
 if(f.id==='ground'){const glow=c.createRadialGradient(55,84,3,55,84,74);glow.addColorStop(0,'#f9bd5a22');glow.addColorStop(1,'#f9bd5a00');c.fillStyle=glow;c.fillRect(28,32,104,128);}
 // Low cutaway outer walls show fitted boundaries without a roof hiding actors.
 for(let x=0;x<14;x++){rect(c,x*32,0,32,26,'#92826a');rect(c,x*32,352,32,26,'#92826a');}for(let y=1;y<11;y++){rect(c,0,y*32,26,32,'#92826a');rect(c,416,y*32,26,32,'#92826a');}
 if(f.id==='ground'){rect(c,0,252,32,40,'#55452f');rect(c,3,255,22,34,'#b8a278');}
 for(const x of [80,208,336]){rect(c,x,1,25,17,'#a7c3b4');rect(c,x+11,1,3,17,'#605444');}
}
export function tavernDepthItems(model){const f=tavernFloor(model.space.settlementInterior.floorId),actor=model.entitiesById[model.playersById[model.localPlayerId].entityId],items=[];
 for(const p of f.furniture)items.push(depthItem({id:'tavern/'+p.id,anchorX:p.x*32,anchorY:(p.y+p.h)*32-4,draw:c=>furniture(c,p)}));
 for(const p of f.walls)items.push(depthItem({id:'wall/'+p.x+'/'+p.y,anchorX:p.x*32,anchorY:(p.y+1)*32-3,draw:c=>{c.save();if(Math.hypot(actor.position.x-(p.x+.5)*32,actor.position.y-(p.y+.5)*32)<52)c.globalAlpha=.55;rect(c,p.x*32,p.y*32-18,32,45,'#91836e');rect(c,p.x*32+2,p.y*32-20,28,8,'#bead8e');c.strokeStyle='#5b5143';c.strokeRect(p.x*32,p.y*32-18,32,45);c.restore();}}));return items;
}
