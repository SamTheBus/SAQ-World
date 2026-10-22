import {drawVoidOrbV4,voidOrbRangedPoseV4} from './creature_presentation_void_orb_v4.js';
import {drawThornWyrmV4,thornWyrmRangedPoseV4} from './creature_presentation_thorn_wyrm_v4.js';
import {drawFrostWyrmlingV4,frostWyrmlingRangedPoseV4} from './creature_presentation_frost_wyrmling_v4.js';
import {drawCorrodedGolemV4} from './creature_presentation_corroded_golem_v4.js';
import {drawMarshGhostV4} from './creature_presentation_marsh_ghost_v4.js';
import {drawToxicFlyV4} from './creature_presentation_toxic_fly_v4.js';
import {drawSwampBasiliskV4} from './creature_presentation_swamp_basilisk_v4.js';
import {drawSlagSlimeV4} from './creature_presentation_slag_slime_v4.js';
import {drawMagmaElementalV4} from './creature_presentation_magma_elemental_v4.js';
import {drawHellBatV4} from './creature_presentation_hell_bat_v4.js';
import {drawLavaSerpentV4,lavaSerpentRangedPoseV4} from './creature_presentation_lava_serpent_v4.js';
import {clockworkDroneRangedPose} from './clockwork_drone_ranged_presentation_v1.js';
// Adapted from SamTheBus/SAQ-Dungeon commit 387c78bfaf9f492fe7b6ff4539b956c12c2a7cdc.
// mob_renderer.js ordinary vType branches; World supplies the clock, phases and
// deterministic visual seed. No Dungeon globals, gameplay mutation or RNG.






export const DUNGEON_MOB_PAINTERS_V1=Object.freeze({thorn_wyrm:drawThornWyrmV4,wyrmling:drawFrostWyrmlingV4,magma_elemental:drawMagmaElementalV4,lava_serpent:drawLavaSerpentV4,hell_bat:drawHellBatV4,slag_slime:drawSlagSlimeV4,swamp_basilisk:drawSwampBasiliskV4,toxic_fly:drawToxicFlyV4,marsh_ghost:drawMarshGhostV4,corroded_golem:drawCorrodedGolemV4,void_orb:drawVoidOrbV4});

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=v=>{const p=clamp(v,0,1);return p*p*(3-2*p);};
const rangedFamilies=new Set(['thorn_wyrm','wyrmling','magma_elemental','toxic_fly']);
export function hostileRangedPose(actor,tick){
  if(actor.enemyFamily==='wyrmling')return frostWyrmlingRangedPoseV4(actor,tick);
  if(actor.enemyFamily==='thorn_wyrm')return thornWyrmRangedPoseV4(actor,tick);
  if(actor.enemyFamily==='void_orb')return voidOrbRangedPoseV4(actor,tick);
  if(actor.enemyFamily==='lava_serpent')return lavaSerpentRangedPoseV4(actor,tick);
  if(actor.enemyFamily==='clockwork_drone')return clockworkDroneRangedPose(actor,tick);
  const r=actor.ranged;if(!actor.alive||!r||r.phase==='idle'||!rangedFamilies.has(actor.enemyFamily))return null;
  const d=r.aim??(r.targetPosition?{x:r.targetPosition.x-actor.position.x,y:r.targetPosition.y-actor.position.y}:{x:actor.presentationFacingX??1,y:0}),length=Math.hypot(d.x,d.y),direction=length>.001?{x:d.x/length,y:d.y/length}:{x:1,y:0};
  const p=clamp((tick-r.phaseStartedTick)/Math.max(1,r.phaseEndsTick-r.phaseStartedTick),0,1),charge=r.phase==='windup'?smooth(p):0;
  const release=r.phase==='recovery'?Math.max(0,1-(tick-r.phaseStartedTick)/3):0,recovery=r.phase==='recovery'?1-p:0,family=actor.enemyFamily;
  const body={x:0,y:0,rotation:0,scaleX:1,scaleY:1};let travel=0;
  const hold=r.phase==='windup'?charge:1-smooth(p),kick=r.phase==='recovery'?Math.sin(Math.PI*clamp((tick-r.phaseStartedTick)/4,0,1)):0;
  switch(family){
    case 'thorn_wyrm':body.rotation=direction.x*(.08*hold-.04*kick);body.scaleX=1-.16*hold+.05*kick;body.scaleY=1+.12*hold;travel=-3*hold-2*kick;break;
    case 'wyrmling':body.rotation=direction.x*(-.09*hold+.06*kick);body.y=-3*hold;body.scaleY=1+.08*hold-.06*kick;travel=-2*hold-3*kick;break;
    case 'magma_elemental':body.rotation=direction.x*(-.06*hold+.08*kick);body.scaleX=1+.08*hold;body.scaleY=1-.08*hold+.06*kick;travel=-hold-4*kick;break;
    case 'toxic_fly':body.rotation=direction.x*(-.12*hold+.08*kick);body.scaleX=1+.12*hold;body.scaleY=1-.13*hold+.1*kick;body.y=-2*hold;travel=-2*hold+1.5*kick;break;
  }
  body.x+=direction.x*travel;body.y+=direction.y*travel;
  return {family,ranged:true,upright:true,bodyPivot:{x:0,y:-10},...(family==='toxic_fly'?{drawFacingX:actor.presentationFacingX===-1?-1:1}:{}),phase:r.phase,progress:p,charge,release,recovery,direction,body,limb:{extension:0,sweep:0,open:charge}};
}

