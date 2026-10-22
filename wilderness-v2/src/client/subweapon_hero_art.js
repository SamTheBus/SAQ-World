// Port of hero_renderer.js drawSubweapon: neutral cutout Shield/Tome and base Dagger.
// Source presentation clock is injected; no Dungeon ownership, rarity or mastery runtime.
import {itemArtKey} from './equipment_art.js';
import {RARITY_COLORS} from '../shared/content/generated_gear.js';
export function tomeFloatOffset(time,bounce=0){return {x:25,y:-15+bounce+Math.sin(time/200)*5};}
export function drawBaseSubweapon(ctx,type,time,bounce,art,guard=null,facing=1,riposteAge=100,blockAge=100,item=null){
 const stars=item?.generated?.rarityTier??0,tierColor=RARITY_COLORS[stars];
 if(type==='tome'){const p=tomeFloatOffset(time,bounce);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.PI/12);ctx.rotate(Math.PI/12);const img=art(itemArtKey(item)??'starter-tome');const points=Array.from({length:stars},(_,i)=>{const a=time/1200+i*Math.PI*2/stars;return {x:Math.cos(a)*15,y:Math.sin(a)*6};});const orbit=front=>{ctx.fillStyle=tierColor;for(const p of points)if((p.y>=0)===front){ctx.globalAlpha=.65;ctx.beginPath();ctx.arc(p.x,p.y,1.4,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}};orbit(false);if(img)ctx.drawImage(img,-11,-11,22,22);orbit(true);ctx.restore();}
 else if(type==='shield'){ctx.save();const jab=riposteAge>=0&&riposteAge<12?Math.sin(Math.PI*riposteAge/12)*7:0,recoil=blockAge>=0&&blockAge<9?Math.sin(Math.PI*blockAge/9)*3:0;if(guard?.raised){ctx.translate(guard.direction.x*facing*(17+jab-recoil),guard.direction.y*(17+jab-recoil)-2+bounce);ctx.scale(1.1,1.1);}else ctx.translate(6+jab-(guard?.mustRelease?recoil*2:recoil),4+bounce+(guard?.mustRelease?recoil:0));ctx.rotate(-Math.sin(time/320)*.05+.15);const img=art(itemArtKey(item)??'starter-shield');if(img)ctx.drawImage(img,-13,-13,26,26);
 const glintTime=(time/2000)%1;if(glintTime<.3){const y=-9.5+glintTime/.3*19;ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-6,y);ctx.lineTo(6,y-3);ctx.stroke();}ctx.restore();}
 else if(type==='dagger'){ctx.save();ctx.translate(14,6+bounce);ctx.rotate(Math.PI*3/4-Math.sin(time/240)*.08);const img=art(itemArtKey(item)??'starter-dagger');if(img)ctx.drawImage(img,-16,-20,32,32);ctx.restore();}
}
