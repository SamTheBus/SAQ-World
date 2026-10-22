import {drawMimicShieldV4} from './creature_presentation_mimic_shield_v4.js';
import {creaturePresentationForRenderV3} from './creature_presentation_profiles_v3.js';

const TAU=Math.PI*2,clamp=v=>Math.max(0,Math.min(1,v));
export function drawAttachedAegisMimic(c,actor,tick,flash=false){
 const m=actor.aegisMimic;if(!m||m.stage==='detached'||!actor.alive)return false;
 const profile=creaturePresentationForRenderV3('mimic_shield'),f=profile.painterFrame,landing=m.stage==='landing',lift=landing?24*(1-clamp((tick-m.detachedTick)/30)):24;
 c.save();c.translate(actor.position.x,actor.position.y);c.fillStyle='#0c142b44';c.beginPath();c.ellipse(0,8,13,5,0,0,TAU);c.fill();c.translate(0,-lift);
 c.save();c.translate(profile.drawOffset.x,profile.drawOffset.y);c.scale(profile.visualScale,profile.visualScale);
 drawMimicShieldV4(c,{x:f.x,y:f.y,w:f.width,h:f.height,flashTimer:flash?1:0,familyAttack:null,aegisDormant:m.stage==='orbiting'},tick*1000/60,actor.visualSeed??17);c.restore();
 const ratio=clamp(actor.hp.m/Math.max(1e-12,actor.maxHp.m));c.fillStyle='#11151a';c.fillRect(-14,-31,28,5);c.fillStyle=m.stage==='recalling'?'#f2c678':'#70e5e6';c.fillRect(-13,-30,26*ratio,3);
 c.textAlign='center';c.font='bold 6px system-ui';c.fillStyle='#d3faf3';c.fillText(['I','II','III'][m.ordinal],0,-34);c.restore();return true;
}
export function drawAegisMimicTethers(c,model,tick){
 for(const a of Object.values(model.entitiesById??{})){
  const m=a.aegisMimic;if(!a.alive||!m||!['orbiting','recalling'].includes(m.stage))continue;
  const recall=m.stage==='recalling';c.save();c.strokeStyle=recall?'#ffcf86':'#63e8e888';c.lineWidth=recall?1.6:1;c.setLineDash(recall?[3,4]:[2,5]);c.lineDashOffset=-tick*(recall?.9:.2);
  c.beginPath();c.moveTo(m.bossPosition.x,m.bossPosition.y-34);c.lineTo(a.position.x,a.position.y-24);c.stroke();c.restore();
 }
}
