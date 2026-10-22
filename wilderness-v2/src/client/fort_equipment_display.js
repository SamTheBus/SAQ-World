// Fort racks reuse the iron-sword and starter-shield silhouettes and palette
// from the established equipment catalog. They stay vector based so authored
// scenery remains deterministic inside cached environment rasters.
const OUT='#05070a',STEEL_DARK='#475569',STEEL='#94a3b8',STEEL_LIGHT='#e2e8f0',WOOD_DARK='#2b1b12',WOOD='#68401f',WOOD_LIGHT='#ad7040';
export const FORT_RACK_PROP_SCALE=.54;
const path=(ctx,points,fill,line=OUT,width=1.8)=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=line;ctx.lineWidth=width;ctx.stroke();};
function sword(ctx,x,y,angle=0,scale=1){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);
 path(ctx,[[0,-28],[-4,-23],[-3,11],[0,13]],STEEL_DARK);path(ctx,[[0,-28],[4,-23],[3,11],[0,13]],STEEL_LIGHT);ctx.fillStyle='rgba(255,255,255,.45)';ctx.fillRect(1,-22,1.2,29);
 path(ctx,[[-11,10],[0,7],[11,10],[9,14],[-9,14]],STEEL);ctx.fillStyle=WOOD_DARK;ctx.fillRect(-2.5,14,5,13);ctx.strokeStyle=OUT;ctx.lineWidth=1.5;ctx.strokeRect(-2.5,14,5,13);path(ctx,[[0,25],[4,29],[0,32],[-4,29]],STEEL);ctx.restore();}
function axe(ctx,x,y,angle=0,scale=1){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);ctx.fillStyle=WOOD_DARK;ctx.fillRect(-2.5,-21,5,49);ctx.fillStyle=WOOD_LIGHT;ctx.fillRect(-1.2,-19,1.8,43);ctx.strokeStyle=OUT;ctx.lineWidth=1.5;ctx.strokeRect(-2.5,-21,5,49);
 path(ctx,[[0,-20],[11,-25],[17,-18],[14,-7],[0,-10]],STEEL_DARK);path(ctx,[[0,-20],[-9,-23],[-14,-17],[-12,-8],[0,-10]],STEEL_LIGHT);ctx.restore();}
function shield(ctx,x,y,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);path(ctx,[[-14,-14],[0,-18],[14,-14],[12,5],[0,19],[-12,5]],STEEL_DARK);path(ctx,[[0,-16],[12,-13],[10,4],[0,16]],STEEL);ctx.strokeStyle=STEEL_LIGHT;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-7,-8);ctx.quadraticCurveTo(0,-12,7,-8);ctx.lineTo(5,3);ctx.quadraticCurveTo(0,10,0,10);ctx.quadraticCurveTo(0,10,-5,3);ctx.closePath();ctx.stroke();ctx.restore();}
export function drawFortEquipmentRack(ctx,x,y,variant=0){ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
 ctx.fillStyle='rgba(8,12,10,.4)';ctx.beginPath();ctx.ellipse(x+3,y+18,35,9,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=WOOD_DARK;ctx.fillRect(x-30,y-20,7,43);ctx.fillRect(x+23,y-20,7,43);ctx.fillRect(x-33,y-15,66,8);ctx.fillRect(x-33,y+13,66,8);ctx.strokeStyle=OUT;ctx.lineWidth=2;ctx.strokeRect(x-33,y-15,66,8);ctx.strokeRect(x-33,y+13,66,8);ctx.fillStyle=WOOD_LIGHT;ctx.fillRect(x-29,y-12,58,3);ctx.fillRect(x-29,y+16,58,2);
 // Display pieces use a scenery-only scale. Equipped, dropped, inventory and
 // combat artwork continue to use their existing presentation sizes.
 const s=FORT_RACK_PROP_SCALE;if(variant%2){sword(ctx,x-17,y-2,-.12,s);shield(ctx,x+2,y-1,s);axe(ctx,x+20,y,0.13,s*.92);}else{axe(ctx,x-19,y,-.12,s*.92);shield(ctx,x,y-1,s);sword(ctx,x+19,y-2,.13,s);}ctx.restore();
}
