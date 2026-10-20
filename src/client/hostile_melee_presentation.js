import {dungeonMobMeleePoseV2A,drawDungeonMobMeleeLimbV2A,drawDungeonMobContactV2A} from './creature_presentation_dungeon_mobs_v2a.js';
import {dungeonMobMeleePoseV2B,drawDungeonMobMeleeLimbV2B,drawDungeonMobContactV2B} from './dungeon_mob_melee_presentation_v2b.js';
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const smooth = x => { const p=clamp(x,0,1); return p*p*(3-2*p); };
const turn = a => Math.atan2(Math.sin(a),Math.cos(a));
export const HOSTILE_STRIKE_FEEDBACK_MS = 190;

// These are disposable poses, not movement, attack shapes or timing rules.
// The near face is bounded by the same combat radii as the authoritative hit.
export function hostileMeleePose(actor, tick) {
  const imported=dungeonMobMeleePoseV2A(actor,tick)??dungeonMobMeleePoseV2B(actor,tick);if(imported)return imported;
  const phase=actor.meleePhase,g=actor.meleeGeometry;
  if(!actor.alive||!g||!phase||phase.phase==='idle')return null;
  const dx=g.targetPosition?g.targetPosition.x-actor.position.x:actor.presentationFacingX??1;
  const dy=g.targetPosition?g.targetPosition.y-actor.position.y:0,distance=Math.hypot(dx,dy);
  const direction=distance>.001?{x:dx/distance,y:dy/distance}:{x:1,y:0},angle=Math.atan2(direction.y,direction.x);
  const sourceRadius=g.sourceRadius,targetRadius=g.targetRadius;
  const centerLimit=g.mode==='clearHullGap'?g.reach+sourceRadius+targetRadius:g.reach;
  const weaponReach=Math.max(sourceRadius,centerLimit-targetRadius);
  const contactReach=clamp(distance-targetRadius,sourceRadius,weaponReach);
  const p=clamp((tick-phase.phaseStartedTick)/Math.max(1,phase.phaseEndsTick-phase.phaseStartedTick),0,1);
  const windup=phase.phase==='windup',impact=phase.phase==='impact',w=windup?smooth(p):0,r=phase.phase==='recovery'?(1-p)**2:0;
  const family=actor.enemyFamily,body={x:0,y:0,rotation:0,scaleX:1,scaleY:1},limb={extension:0,sweep:0,open:0};
  let travel=0,lift=0;
  switch(family){
    case 'sprout': { // Pull the cap back, then jab with the head rather than slide upright.
      const front=22.5,lean=turn(angle+Math.PI/2),reach=Math.max(0,contactReach-front);
      travel=windup?-5*w:impact?reach*(1-.12*p):reach*r;
      body.rotation=windup?lean*w*.34-.18*w:impact?lean+.12*p:lean*r;
      body.scaleX=windup?1+.14*w:impact?1.08:1+.08*r;body.scaleY=windup?1-.2*w:impact?.92:1-.08*r;
      break;
    }
    case 'slime': { // Compress, lift into a short hop, land wide, then spring back.
      const hop=windup?smooth((p-.55)/.45):0,compress=windup?smooth(p/.55)*(1-hop):0,reach=Math.max(0,contactReach-14);
      travel=windup?-4*compress+reach*.65*hop:impact?reach:reach*r;
      lift=windup?-Math.sin(hop*Math.PI)*12:impact?2*p:-Math.sin(p*Math.PI)*3;
      body.rotation=angle;body.scaleX=windup?1+.45*compress-.12*hop:impact?1.45-.2*p:1+.15*r;
      body.scaleY=windup?1-.45*compress+.25*hop:impact?.65+.2*p:1-.12*r;
      limb.open=compress;break;
    }
    case 'golem': { // Torso braces while one independent floating gauntlet makes a heavy punch.
      const reach=Math.min(7,Math.max(0,contactReach-28));
      travel=windup?-2*w:impact?reach:reach*r;lift=windup?2*w:impact?2*(1-p):r;
      body.rotation=(windup?-.12*w:impact?.09:.09*r)*(direction.x<0?-1:1);body.scaleY=1+(windup?.04*w:impact?-.035:-.035*r);
      limb.extension=windup?8-15*w:impact?contactReach-travel:(contactReach-reach)*r+8*(1-r);
      limb.sweep=windup?-.18*w:impact?.07*p:.07*r;limb.open=windup?w:impact?1:r;break;
    }
    case 'gargoyle': { // Fold wings/crouch, pounce briefly and rake with an actual claw.
      const reach=Math.max(0,contactReach-14);
      travel=windup?-4*w:impact?reach*(1-.08*p):reach*r;lift=windup?3*w:impact?-2*(1-p):-2*r;
      body.rotation=(windup?-.2*w:impact?.08:.08*r)*(direction.x<0?-1:1);body.scaleX=impact?1.08:1;body.scaleY=windup?1-.18*w:impact?.94:1-.06*r;
      limb.extension=windup?6-3*w:impact?contactReach-travel:14*r+6*(1-r);
      limb.sweep=windup?-.65*w:impact?1.15*p:1.15*r;limb.open=windup?1-w:impact?1:r;break;
    }
    case 'rust_nibbler': { // Mandibles open while the carapace recoils, then snap shut.
      const reach=Math.max(0,contactReach-17);
      travel=windup?-2*w:impact?reach*(1-.1*p):reach*r;body.rotation=angle;
      body.scaleX=windup?1-.1*w:impact?1.08:1+.08*r;body.scaleY=windup?1+.08*w:impact?.92:1-.08*r;
      limb.extension=17;limb.open=windup?2+4*w:impact?.7+.3*p:1+2*(1-r);break;
    }
    case 'animated_armor': { // Plant the stance, raise the weapon, then swing from its shoulder.
      const reach=Math.max(0,contactReach-29);
      travel=windup?-1.5*w:impact?reach:reach*r;body.rotation=(windup?-.14*w:impact?.1:.1*r)*(direction.x<0?-1:1);
      body.scaleY=windup?1-.04*w:1;limb.extension=29;limb.sweep=windup?-1.35*w:impact?1.1*p:1.1*r;limb.open=windup?w:impact?1:r;break;
    }
    case 'cursed_blade': { // The weapon itself turns toward the target and thrusts, with a short recovery sweep.
      const reach=Math.max(0,contactReach-28.5),aim=turn(angle+Math.PI/2),side=(phase.actionSequence??0)%2?-1:1;
      travel=windup?-6*w:impact?reach*(1-.08*p):reach*r;lift=windup?-3*w:impact?-1*(1-p):-r;
      limb.sweep=windup?-.65*side*w:impact?.4*side*p:.4*side*r;
      body.rotation=windup?aim*w+limb.sweep:impact?aim+limb.sweep:aim*r+limb.sweep;
      limb.extension=28.5;break;
    }
    case 'lava_serpent': {
      const reach=Math.max(0,contactReach-12),aim=turn(angle+Math.PI);
      travel=windup?-4*w:impact?reach*(1-.12*p):reach*r;
      body.rotation=windup?aim-.28*w:impact?aim+.12*p:aim*r;
      body.scaleX=windup?1-.18*w:impact?1.08:1+.08*r;body.scaleY=windup?1+.13*w:impact?.94:1-.06*r;break;
    }
    case 'hell_bat': {
      const reach=Math.max(0,contactReach-18),aim=turn(angle+Math.PI/2);
      travel=windup?-3*w:impact?reach*(1-.08*p):reach*r;lift=windup?-4*w:impact?-2*(1-p):-2*r;
      body.rotation=windup?aim*.7:impact?aim:aim*r;body.scaleX=windup?1+.18*w:impact?.88:1-.12*r;body.scaleY=windup?1-.08*w:impact?1.1:1+.1*r;break;
    }
    case 'slag_slime': {
      const reach=Math.max(0,contactReach-16);travel=windup?-2.5*w:impact?reach:reach*r;lift=windup?2*w:impact?3*(1-p):2*r;
      body.rotation=angle;body.scaleX=windup?1+.32*w:impact?1.2:1+.2*r;body.scaleY=windup?1-.38*w:impact?.82:1-.18*r;break;
    }
    case 'swamp_basilisk': {
      const reach=Math.max(0,contactReach-13),aim=turn(angle+Math.PI);
      travel=windup?-5*w:impact?reach*(1-.06*p):reach*r;lift=windup?-2*w:impact?1:0;
      body.rotation=windup?aim+.22*w:impact?aim-.08*p:aim*r;body.scaleX=windup?1-.12*w:impact?1.12:1+.12*r;body.scaleY=windup?1+.18*w:impact?.9:1-.1*r;break;
    }
    case 'marsh_ghost': {
      const reach=Math.max(0,contactReach-23),aim=turn(angle+Math.PI/2);
      travel=windup?-2*w:impact?reach:reach*r;lift=windup?-7*w:impact?-1*(1-p):-r;
      body.rotation=windup?aim*.55-.12*w:impact?aim:aim*r;body.scaleX=windup?1-.15*w:impact?.92:1-.08*r;body.scaleY=windup?1+.2*w:impact?1.08:1+.08*r;break;
    }
    case 'corroded_golem': {
      const reach=Math.min(5,Math.max(0,contactReach-29));travel=windup?-1.5*w:impact?reach:reach*r;lift=windup?-2*w:impact?3*(1-p):r;
      body.rotation=(windup?.1*w:impact?-.08:-.08*r)*(direction.x<0?-1:1);body.scaleY=windup?1+.06*w:impact?.94:1-.06*r;
      limb.extension=windup?7-11*w:impact?contactReach-travel:(contactReach-reach)*r+7*(1-r);limb.open=windup?w:impact?1:r;break;
    }
  }
  body.x=direction.x*travel;body.y=direction.y*travel+lift;
  return {family,phase:phase.phase,progress:p,direction,sourceRadius,targetRadius,centerLimit,weaponReach,contactReach,body,limb};
}

// Real fists, claws, mandibles and weapons replace their idle carried parts.
// They are drawn at body height. No warning is painted on the ground.
export function drawHostileMeleeLimb(c,pose,flash=false){
  if(drawDungeonMobMeleeLimbV2A(c,pose,flash)||drawDungeonMobMeleeLimbV2B(c,pose,flash))return;
  if(!pose)return;
  const {family,body,limb}=pose;
  if(!['golem','gargoyle','rust_nibbler','animated_armor','corroded_golem'].includes(family))return;
  c.save();c.translate(body.x,body.y-8);c.rotate(Math.atan2(pose.direction.y,pose.direction.x));
  c.lineJoin='round';c.lineCap='round';c.strokeStyle='#20272c';c.lineWidth=1.5;
  if(family==='corroded_golem'){
    for(const side of [-1,1]){c.save();c.translate(limb.extension-4.5,side*4.5);c.fillStyle=flash?'#fff':'#2c3e50';c.beginPath();c.roundRect(-4.5,-4.5,9,9,[2]);c.fill();c.stroke();c.strokeStyle=flash?'#fff':'#53b67a';c.lineWidth=1;c.beginPath();c.moveTo(-3,-2);c.lineTo(0,1);c.lineTo(2,-2);c.stroke();c.restore();}
  }else if(family==='golem'){
    // One gauntlet stays braced; the punching fist is a separate stone mass.
    c.fillStyle=flash?'#fff':'#4a5568';c.save();c.translate(-3,8);c.rotate(-.25);c.beginPath();c.roundRect(-4,-4,8,9,[2]);c.fill();c.stroke();c.restore();
    const x=limb.extension-5.5;c.save();c.translate(x,0);c.rotate(limb.sweep);c.beginPath();c.roundRect(-5.5,-6,11,12,[2.5]);c.fill();c.stroke();
    c.fillStyle=flash?'#fff':'#718096';c.fillRect(1,-5,3,9);c.strokeStyle=flash?'#fff':'#38bdf8';c.lineWidth=1;c.beginPath();c.moveTo(-2,-3);c.lineTo(1,0);c.lineTo(-2,3);c.stroke();c.restore();
  }else if(family==='gargoyle'){
    c.rotate(limb.sweep);const x=limb.extension;
    c.strokeStyle=flash?'#fff':'#697579';c.lineWidth=4;c.beginPath();c.moveTo(1,5);c.quadraticCurveTo(x*.55,6,x-4,0);c.stroke();
    c.strokeStyle=flash?'#fff':'#c2c4ae';c.lineWidth=1.8;for(const y of [-3,0,3]){c.beginPath();c.moveTo(x-5,y+2);c.quadraticCurveTo(x-1,y+1,x,y-1);c.stroke();}
  }else if(family==='rust_nibbler'){
    const tip=limb.extension,open=limb.open;c.fillStyle=flash?'#fff':'#b65327';
    for(const side of [-1,1]){c.beginPath();c.moveTo(9,side*3);c.quadraticCurveTo(tip-1,side*(open+3),tip,side*open);c.lineTo(tip-3,side*.5);c.lineTo(10,side);c.closePath();c.fill();c.stroke();}
  }else{
    c.fillStyle=flash?'#fff':'#59686b';c.beginPath();c.roundRect(1,-5,10,9,[3]);c.fill();c.stroke();
    c.translate(7,0);c.rotate(limb.sweep);c.fillStyle=flash?'#fff':'#344247';c.beginPath();c.roundRect(-2,-4,7,8,[2]);c.fill();c.stroke();
    c.fillStyle=flash?'#fff':'#76543b';c.fillRect(4,-6,3,12);c.strokeRect(4,-6,3,12);
    c.fillStyle=flash?'#fff':'#809194';c.beginPath();c.moveTo(6,-2.5);c.lineTo(limb.extension-7,0);c.lineTo(limb.extension-11,3);c.lineTo(6,2.5);c.closePath();c.fill();c.stroke();
    if(!flash){c.strokeStyle='#b4c8c5';c.lineWidth=.7;c.beginPath();c.moveTo(8,-1);c.lineTo(limb.extension-11,0);c.stroke();}
  }
  c.restore();
}

export function hostileContactPose(contact,age){
  if(age<0||age>=HOSTILE_STRIKE_FEEDBACK_MS)return null;
  const source=contact.sourcePosition,target=contact.targetPosition;
  if(!source||!target)return null;
  const dx=target.x-source.x,dy=target.y-source.y,distance=Math.hypot(dx,dy),direction=distance>.001?{x:dx/distance,y:dy/distance}:{x:1,y:0};
  const max=contact.mode==='clearHullGap'?contact.reach+contact.sourceRadius:Math.max(0,contact.reach-contact.targetRadius);
  const near=Math.min(max,Math.max(0,distance-contact.targetRadius));
  const contactPosition={x:source.x+direction.x*near,y:source.y+direction.y*near};
  return {family:contact.family??null,progress:age/HOSTILE_STRIKE_FEEDBACK_MS,direction,contactPosition,radius:11};
}

// A local contact flourish survives a missed impact frame. Nothing joins the
// enemy to the victim: all marks stay within eleven pixels of the near face.
export function drawHostileContact(c,contact,age){
  if(drawDungeonMobContactV2A(c,contact,age)||drawDungeonMobContactV2B(c,contact,age))return;
  const pose=hostileContactPose(contact,age);if(!pose)return;
  const {family,progress:t,direction,contactPosition:p}=pose,s=1-t;
  c.save();c.translate(p.x,p.y-8);c.rotate(Math.atan2(direction.y,direction.x));c.globalAlpha*=(1-t)**1.25;c.lineCap='round';
  switch(family){
    case 'sprout':c.strokeStyle='#e8d6ab';c.lineWidth=1.8;c.beginPath();c.arc(-1,0,4+2*t,-1.1,1.1);c.moveTo(2,-4);c.lineTo(4,-6);c.moveTo(2,4);c.lineTo(4,6);c.stroke();break;
    case 'slime':c.fillStyle='#83d872';for(let i=0;i<5;i++){const a=(i-2)*.5,r=3+5*t;c.beginPath();c.ellipse(Math.cos(a)*r,Math.sin(a)*r,1.2*s+.4,1.8*s+.4,a,0,Math.PI*2);c.fill();}break;
    case 'golem':c.fillStyle='#85929d';for(let i=0;i<4;i++){c.save();c.translate((i%2?1:-1)*(3+3*t),((i>>1)?1:-1)*(2+4*t));c.rotate(i*.7+t);c.fillRect(-1.5,-1.5,3,3);c.restore();}c.strokeStyle='#c7c3a9';c.lineWidth=1.7;c.beginPath();c.moveTo(-2,-5);c.lineTo(1,-1);c.lineTo(-1,1);c.lineTo(3,5);c.stroke();break;
    case 'gargoyle':c.strokeStyle='#b9bba6';c.lineWidth=1.3;for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(-4,i*3-3);c.quadraticCurveTo(1,i*3,5,i*3+2);c.stroke();}break;
    case 'rust_nibbler':c.strokeStyle='#d59159';c.lineWidth=1.6;for(const side of [-1,1]){c.beginPath();c.moveTo(-3,side*(5+2*t));c.lineTo(1,side*2);c.lineTo(4,side*(4+2*t));c.stroke();}break;
    case 'animated_armor':c.strokeStyle='#d4e2dd';c.lineWidth=1.8;c.beginPath();c.moveTo(-5,-7);c.quadraticCurveTo(1,0,5,7);c.stroke();c.strokeStyle='#b99c6d';c.lineWidth=1;c.beginPath();c.moveTo(1,-3);c.lineTo(5,-5);c.moveTo(2,2);c.lineTo(6,3);c.stroke();break;
    case 'cursed_blade':c.strokeStyle='#b5a0cc';c.lineWidth=2;c.beginPath();c.moveTo(-5,0);c.lineTo(5,0);c.stroke();c.lineWidth=1;c.beginPath();c.moveTo(2,-4);c.lineTo(5,0);c.lineTo(2,4);c.stroke();break;
    case 'lava_serpent':c.fillStyle='#e68837';for(let i=0;i<3;i++){c.save();c.translate(2+3*t,(i-1)*(3+2*t));c.rotate(i*.8);c.fillRect(-1,-2,2,4);c.restore();}break;
    case 'hell_bat':c.strokeStyle='#c76d69';c.lineWidth=1.5;c.beginPath();c.moveTo(-4,-5);c.quadraticCurveTo(3,-2,4,4);c.moveTo(-1,-6);c.quadraticCurveTo(6,0,3,6);c.stroke();break;
    case 'slag_slime':c.fillStyle='#6cbf72';c.beginPath();c.ellipse(1,0,3+2*t,2*(1-t)+1,.3,0,Math.PI*2);c.fill();c.fillStyle='#8a9590';c.save();c.translate(4,4*t);c.rotate(t);c.fillRect(-1.5,-1,3,2);c.restore();break;
    case 'swamp_basilisk':c.strokeStyle='#b8d4a7';c.lineWidth=1.6;for(const side of [-1,1]){c.beginPath();c.moveTo(-2,side*5);c.lineTo(2,side*1.5);c.lineTo(4,side*4);c.stroke();}break;
    case 'marsh_ghost':c.strokeStyle='#8ecabd';c.lineWidth=1.5;for(const side of [-1,1]){c.beginPath();c.moveTo(-5,side*4);c.bezierCurveTo(0,side*7,5,side*2,2,0);c.stroke();}break;
    case 'corroded_golem':c.fillStyle='#66867b';for(const side of [-1,1]){c.save();c.translate(1+3*t,side*(3+2*t));c.rotate(side*.4+t);c.fillRect(-2,-2,4,4);c.restore();}c.strokeStyle='#7bc28d';c.lineWidth=1;c.beginPath();c.moveTo(-2,-3);c.lineTo(1,0);c.lineTo(-1,3);c.stroke();break;
    default:c.fillStyle='#f3c6ad';c.beginPath();c.arc(0,0,2.5*s+.7,0,Math.PI*2);c.fill();
  }
  c.restore();
}
