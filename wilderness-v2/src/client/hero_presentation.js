import {drawBaseSubweapon,tomeFloatOffset} from './subweapon_hero_art.js';
import {itemArtKey, WEAPON_ART_KEYS } from './equipment_art.js';
// H4A hero_renderer.js classic knight geometry/palette, with the game_render.js
// scale and feet offset. D4 weapon appearance comes only from the projected equipment.
export function primaryPose(primary,tick) {
  const a=primary?.current;if(!a)return {body:0,sword:-0.6,weight:0,active:false,aim:primary?.facing??{x:1,y:0}};
  const progress=Math.max(0,Math.min(1,(tick-a.phaseStartedTick)/Math.max(1,a.phaseEndsTick-a.phaseStartedTick)));
  const reverse=a.comboStep===2?-1:1,heavy=a.comboStep===3;
  const wind=heavy?-2.35:-1.35,follow=heavy?1.35:1.05;
  const sword=a.phase==="startup"?-.6+(wind+.6)*progress:a.phase==="active"?wind+(follow-wind)*progress:follow+(-.6-follow)*progress;
  return {body:reverse*(a.phase==="startup"?-.18*progress:a.phase==="active"?.24:.24*(1-progress))*(heavy?1.8:1),
    sword:sword*reverse,weight:heavy?3:1,active:a.phase==="active",aim:a.aim};
}
export function drawWorldHero(ctx, actor, facing, presentationTime, primary=null,tick=0,hurtFlash=false,equipmentArt=()=>null) {
  if(actor.subType==='shield'&&actor.guard?.raised){facing=actor.guard.direction.x<0?-1:1;primary={...primary,facing:actor.guard.direction};}
  const pose=primaryPose(primary,tick),visual=actor.weaponVisual??'worn';
  const bounce = actor.movedLastTick ? Math.sin(presentationTime/90)*1.5 : 0;
  ctx.save();
  ctx.translate(actor.position.x, actor.position.y-8);
  ctx.scale(0.8*facing, 0.8);
  if(primary)ctx.rotate(pose.body);
  const subweapon=()=>drawBaseSubweapon(ctx,actor.subType,presentationTime,bounce,equipmentArt,actor.guard,facing,tick-actor.shieldRiposteTick,tick-actor.shieldBlockTick,actor.equipmentAppearance?.subweapon);
  if(actor.subType&&facing===-1)subweapon();
  ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.5;
  ctx.fillStyle = "#c0392b";
  ctx.beginPath(); ctx.moveTo(-6, bounce); ctx.lineTo(-18, 15); ctx.lineTo(-2, 18); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (const [color, x, y, w, h] of [["#95a5a6", -8, bounce, 14, 16], ["#bdc3c7", -10, -14+bounce, 18, 16],
    ["#2c3e50", 0, -8+bounce, 6, 4], ["#e74c3c", -5, -20+bounce, 4, 6], ["#e74c3c", -9, -16+bounce, 8, 4]]) {
    ctx.fillStyle = hurtFlash&&(color==="#95a5a6"||color==="#bdc3c7")?"#ffe1d4":color; ctx.beginPath(); ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
  }
  if(primary) {
    // Body lean, shoulder and weapon actually articulate; the trail is secondary.
    ctx.save();ctx.translate(5,bounce+4);ctx.rotate(Math.atan2(pose.aim.y,pose.aim.x*facing)+pose.sword);
    ctx.fillStyle="#95a5a6";ctx.fillRect(0,-3,12,6);ctx.strokeRect(0,-3,12,6);
    // Reuse Dungeon's actual sword vector artwork. Its 34-unit viewBox is
    // rotated around the grip into the existing World Primary pose; authority is unchanged.
    const weapon=equipmentArt(itemArtKey(actor.equipmentAppearance?.weapon)??WEAPON_ART_KEYS[visual]);if(weapon){ctx.save();ctx.translate(12,0);ctx.rotate(Math.PI/2);ctx.drawImage(weapon,-19,-31,38,38);ctx.restore();}
    if(pose.active){ctx.strokeStyle="#fff0bba0";ctx.lineWidth=pose.weight+1;ctx.beginPath();ctx.arc(8,0,32,-.75,.3);ctx.stroke();}
    ctx.restore();
    if(actor.subType){if(facing!==-1)subweapon();}else {
    // H4A hero_renderer.js DEFAULT / HEATER SHIELD geometry, neutral framing tint.
    ctx.save();ctx.translate(-10,9+bounce);ctx.fillStyle='#7f8c8d';ctx.strokeStyle='#000';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-6,-8);ctx.lineTo(6,-8);ctx.lineTo(8,0);ctx.lineTo(0,10);ctx.lineTo(-8,0);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(-4,-6.5);ctx.lineTo(4,-6.5);ctx.lineTo(5.5,-.5);ctx.lineTo(0,7.5);ctx.lineTo(-5.5,-.5);ctx.closePath();ctx.strokeStyle='#bdc3c7';ctx.lineWidth=1.2;ctx.stroke();ctx.restore();}
  }
  ctx.restore();
}

export function drawProofSlime(ctx,actor,flash=false) {
  if(!actor.alive)return;
  ctx.save();ctx.translate(actor.position.x,actor.position.y);
  ctx.fillStyle=flash?"#fff1cc":"#66ad63";ctx.strokeStyle="#203f35";ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(0,-5,15,11,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle="#182d29";ctx.fillRect(-6,-8,3,4);ctx.fillRect(4,-8,3,4);
  const ratio=actor.hp.m/actor.maxHp.m*10**(actor.hp.e-actor.maxHp.e);
  ctx.fillStyle="#16232a";ctx.fillRect(-18,-26,36,4);ctx.fillStyle="#b4e484";ctx.fillRect(-18,-26,36*ratio,4);ctx.restore();
}

// Presentation-only focus location under the same transform as drawWorldHero.
export function tomeFocusPosition(actor,facing,time,primary,tick){const p=tomeFloatOffset(time,actor.movedLastTick?Math.sin(time/90)*1.5:0),angle=primary?primaryPose(primary,tick).body:0,c=Math.cos(angle),s=Math.sin(angle);return {x:actor.position.x+.8*facing*(p.x*c-p.y*s),y:actor.position.y-8+.8*(p.x*s+p.y*c)};}
