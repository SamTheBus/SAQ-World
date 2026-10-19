import {OPEN_TOWN_TEMPLATE_V1 as T} from '../shared/content/open_town_template_v1.js';
import {TOWN_PROPS} from '../shared/generation/planned_town_v1.js';
import {drawSettlementBuilding} from './settlement_building_presentation.js';
import {depthItem} from './world_depth_presentation.js';
const intersects=(x,y,w,h,v)=>x+w>v.x&&x<v.x+v.width&&y+h>v.y&&y<v.y+v.height;
export function drawPlannedTownGround(c,m,v){const o=m.space.plannedTown;if(!o)return;c.save();c.translate(o.x,o.y);for(const [,p,kind] of T.places){if(!intersects(o.x+p.x*32,o.y+p.y*32,p.w*32,p.h*32,v))continue;c.fillStyle=kind==='garden'?'#456845':'#a49d80';c.fillRect(p.x*32,p.y*32,p.w*32,p.h*32);if(kind==='garden')for(let x=p.x*32+20;x<(p.x+p.w)*32;x+=32){c.fillStyle='#6d6243';c.fillRect(x,p.y*32+12,10,p.h*32-24);c.fillStyle='#739b52';for(let y=p.y*32+20;y<(p.y+p.h)*32-12;y+=26)c.fillRect(x-3,y,15,12);}else{c.strokeStyle='#827a65';c.lineWidth=1;for(let y=p.y*32;y<(p.y+p.h)*32;y+=32){c.beginPath();c.moveTo(p.x*32,y);c.lineTo((p.x+p.w)*32,y);c.stroke();}}}if(globalThis.__SAQ_TOWN_REVIEW__?.overlay()){c.lineWidth=2;c.strokeStyle='#4ee7ee';c.strokeRect(0,0,96*32,78*32);c.strokeStyle='#4ee7ee66';for(let x=32;x<96;x+=32)c.strokeRect(x*32,0,0,78*32);for(let y=26;y<78;y+=26)c.strokeRect(0,y*32,96*32,0);for(const b of T.buildings){c.fillStyle='#ed5b7133';c.fillRect(b.x*32,b.y*32,b.w*32,b.h*32);c.strokeStyle='#ee6d8f';c.strokeRect(b.x*32,b.y*32,b.w*32,b.h*32);c.fillStyle='#71fda4';c.fillRect((b.porch.x+1)*32+10,(b.porch.y+1)*32+10,12,12);}}c.restore();}
export function plannedTownDepthItems(m,v){const o=m.space.plannedTown;if(!o)return [];const actor=m.entitiesById[m.playersById[m.localPlayerId].entityId],items=[];
 for(const b of T.buildings){const x=o.x+b.x*32,y=o.y+b.y*32;if(!intersects(x-10,y-100,b.w*32+20,b.h*32+130,v))continue;
  // Render only where the associated collision chunk is already admitted.
  if(!m.space.visual.blockers.some(q=>q.id.includes(b.id)))continue;
  items.push(depthItem({id:'planned-town/'+b.id,anchorY:y+b.h*32,anchorX:x,draw:c=>{c.save();c.translate(o.x,o.y);if(actor.position.y<y+20&&actor.position.y>y-90&&actor.position.x>x-12&&actor.position.x<x+(b.w*32)+12)c.globalAlpha=.55;drawSettlementBuilding(c,b);c.restore();}}));
 }
 for(const p of TOWN_PROPS){const x=o.x+p.x*32+16,y=o.y+p.y*32+18;if(!intersects(x-16,y-30,32,48,v))continue;items.push(depthItem({id:'planned-town/'+p.id,anchorY:y+10,anchorX:x,draw:c=>{c.fillStyle='#342d20';c.beginPath();c.ellipse(x+4,y+5,16,7,0,0,Math.PI*2);c.fill();c.fillStyle='#8d6b3d';c.strokeStyle='#392f26';c.lineWidth=2;c.fillRect(x-11,y-18,22,25);c.strokeRect(x-11,y-18,22,25);c.fillStyle='#b29362';c.beginPath();c.ellipse(x,y-18,11,5,0,0,Math.PI*2);c.fill();c.stroke();}}));}return items;
}
