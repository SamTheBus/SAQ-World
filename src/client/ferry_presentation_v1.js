// Temporary Canvas boat, mooring ropes, landing sign. The boat is moored on
// authoritative ocean and never grants walkability to water.
export function drawFerryLandings(ctx,exits){
 for(const e of exits??[]){if(!e.ferryLandingId)continue;const b=e.boat;ctx.save();
  if(b){ctx.strokeStyle='#b69b69';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.save();ctx.translate(b.x,b.y);ctx.rotate(e.facing.x?Math.PI/2:0);ctx.fillStyle='#60402b';ctx.strokeStyle='#241f20';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-46);ctx.quadraticCurveTo(31,-14,23,34);ctx.quadraticCurveTo(0,49,-23,34);ctx.quadraticCurveTo(-31,-14,0,-46);ctx.fill();ctx.stroke();ctx.fillStyle='#b18753';ctx.fillRect(-17,-18,34,45);ctx.strokeStyle='#6c4d30';ctx.lineWidth=2;for(let y=-16;y<28;y+=9){ctx.beginPath();ctx.moveTo(-17,y);ctx.lineTo(17,y);ctx.stroke();}ctx.fillStyle='#ddd3b0';ctx.fillRect(-21,3,42,7);ctx.restore();}
  ctx.fillStyle='#65482c';ctx.fillRect(e.x-3,e.y-26,6,27);ctx.fillStyle='#e5cc91';ctx.strokeStyle='#3b3027';ctx.lineWidth=2;ctx.fillRect(e.x-21,e.y-42,42,22);ctx.strokeRect(e.x-21,e.y-42,42,22);ctx.fillStyle='#23323a';ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillText('FERRY',e.x,e.y-27);ctx.fillStyle='#13262be8';ctx.font='600 12px system-ui';const label=e.label.replace('Ferry · ',''),w=ctx.measureText(label).width+16;ctx.fillRect(e.x-w/2,e.y+24,w,23);ctx.fillStyle='#f0dfb4';ctx.fillText(label,e.x,e.y+40);ctx.restore();
 }
}
