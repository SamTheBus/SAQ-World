// Source identities/palettes: SamTheBus/SAQ-Dungeon commit
// 387c78bfaf9f492fe7b6ff4539b956c12c2a7cdc, game_render.js projectile
// branches and projectile_update.js trails. All geometry below is disposable
// Canvas art: no collision, position, velocity, damage or gameplay RNG changes.
export const ORDINARY_HOSTILE_PROJECTILE_IMPACT_MS = 190;
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const styles=new Set(['thorn','frost','fireball','maelstrom','void','clockwork']);

export function ordinaryHostileProjectilePose(projectile,presentationTick){
  const direction=projectile.direction??{x:1,y:0},length=Math.hypot(direction.x,direction.y);
  const unit=length>.001?{x:direction.x/length,y:direction.y/length}:{x:1,y:0};
  const age=Number.isFinite(projectile.firedTick)?Math.max(0,presentationTick-projectile.firedTick):3;
  const radius=clamp(Number.isFinite(projectile.radius)?projectile.radius:6,2,8);
  // Authority already places the shot at its muzzle. Rendering stays on that
  // exact path at every age; only the common visual body height is applied.
  return {position:{x:projectile.position.x,y:projectile.position.y-8},
    direction:unit,angle:Math.atan2(unit.y,unit.x),radius,age,style:styles.has(projectile.style)?projectile.style:null};
}

export function drawOrdinaryHostileProjectile(c,projectile,presentationTick){
  const pose=ordinaryHostileProjectilePose(projectile,presentationTick),r=pose.radius;
  const pulse=Math.sin(presentationTick*.21)*.35;
  c.save();c.translate(pose.position.x,pose.position.y);c.rotate(pose.angle);
  c.lineJoin='round';c.lineCap='round';c.strokeStyle='#13202a';c.lineWidth=1.3;
  switch(pose.style){
    case 'clockwork':
      // A compact teal energy slug with a gold band, not a source-to-target beam.
      c.strokeStyle='#11151a';c.lineWidth=1.26;c.fillStyle='#397b70';
      c.beginPath();c.moveTo(r+1,0);c.lineTo(r*.35,-r*.6);c.lineTo(-r*.7,-r*.6);c.lineTo(-r-1,0);c.lineTo(-r*.7,r*.6);c.lineTo(r*.35,r*.6);c.closePath();c.fill();c.stroke();
      c.fillStyle='#60d9bc';c.beginPath();c.moveTo(r*.65,0);c.lineTo(r*.15,-r*.3);c.lineTo(-r*.5,-r*.3);c.lineTo(-r*.5,r*.3);c.lineTo(r*.15,r*.3);c.closePath();c.fill();
      c.strokeStyle='#ffe4a4';c.lineWidth=1.1;c.beginPath();c.moveTo(-r*.4,-r*.5);c.lineTo(-r*.4,r*.5);c.stroke();
      c.fillStyle='#60d9bc';c.fillRect(-r-5,-.7,2.5,1.4);c.fillStyle='#edb344';c.fillRect(-r-9,-.5,1.6,1);break;
    case 'thorn':
      // A barbed green seed, with two short detached leaf flecks.
      c.fillStyle='#2ecc71';c.beginPath();c.moveTo(r+1,0);c.lineTo(-r*.6,-r*.63);
      c.lineTo(-r*.25,-1);c.lineTo(-r-3,-2.5);c.lineTo(-r*.75,.8);
      c.lineTo(-r*.55,r*.58);c.closePath();c.fill();c.stroke();
      c.strokeStyle='#a3fd83';c.lineWidth=1;c.beginPath();c.moveTo(-r*.5,0);c.lineTo(r*.55,0);c.stroke();
      c.fillStyle='#6da54c';c.beginPath();c.moveTo(-r-7,-2);c.lineTo(-r-4,-3);c.lineTo(-r-5,0);c.closePath();c.fill();
      c.fillRect(-r-11,1,2.2,1.2);break;
    case 'frost':
      // A faceted ice shard; its bevel and two small chips remain local.
      c.fillStyle='#3498db';c.beginPath();c.moveTo(r+1,0);c.lineTo(-1,-r*.78);
      c.lineTo(-r-1,0);c.lineTo(-1,r*.78);c.closePath();c.fill();c.stroke();
      c.fillStyle='#dffaff';c.beginPath();c.moveTo(r*.8,0);c.lineTo(-1,-r*.48);c.lineTo(-r*.7,0);c.closePath();c.fill();
      c.strokeStyle='#81ecec';c.lineWidth=1.1;c.beginPath();c.moveTo(-r-5,-3);c.lineTo(-r-8,-5);
      c.moveTo(-r-8,3);c.lineTo(-r-12,2);c.stroke();break;
    case 'fireball':
      if(projectile.sourceFamily==='lava_serpent'||projectile.sourceFamily==='magma_elemental'){
        const tail=Math.min(12,pose.age*2.2),magma=projectile.sourceFamily==='magma_elemental';
        c.strokeStyle='#11151a';c.lineWidth=1.26;c.fillStyle=magma?'#b84323':'#bf3510';c.beginPath();c.moveTo(r,0);c.quadraticCurveTo(0,-r,-r-tail,-r*.45);c.lineTo(-r-tail*.45,0);c.lineTo(-r-tail*.8,r*.5);c.quadraticCurveTo(0,r,r,0);c.closePath();c.fill();
        c.fillStyle=magma?'#ef7f28':'#f55518';c.beginPath();c.arc(0,0,r*.9,0,TAU);c.fill();c.stroke();
        c.fillStyle=magma?'#ffd27d':'#ffc964';c.beginPath();c.ellipse(r*.1,-r*.07,r*.58,r*.55,-.2,0,TAU);c.fill();
        c.fillStyle='#fff2b8';c.beginPath();c.ellipse(r*.25,-r*.17,r*.25,r*.21,-.3,0,TAU);c.fill();break;
      }
      // Flames stream behind a solid hot core, rather than a long beam.
      c.fillStyle='#bc4424';c.beginPath();c.moveTo(r+pulse,0);c.quadraticCurveTo(1,-r-1,-r-10,-4);
      c.lineTo(-r-5,0);c.lineTo(-r-12,3);c.quadraticCurveTo(0,r+2,r+pulse,0);c.closePath();c.fill();
      c.fillStyle='#e67e22';c.beginPath();c.arc(0,0,r*.9,0,TAU);c.fill();c.stroke();
      c.fillStyle='#f1c40f';c.beginPath();c.ellipse(r*.15,0,r*.5,r*.55,0,0,TAU);c.fill();
      c.fillStyle='#fff0a8';c.beginPath();c.arc(r*.32,-1,r*.2,0,TAU);c.fill();break;
    case 'maelstrom':
      // Toxic Fly's green spit uses a lopsided glob and a tight moving spiral.
      c.fillStyle='#2ecc71';c.beginPath();c.moveTo(r,0);c.bezierCurveTo(r,-r,-r*.7,-r,-r,-1);
      c.bezierCurveTo(-r-1,r*.8,r*.8,r+1,r,0);c.closePath();c.fill();c.stroke();
      c.strokeStyle='#55efc4';c.lineWidth=1.2;c.beginPath();c.arc(-.5,-.5,r*.55,-.8,4.3);c.stroke();
      c.fillStyle='#a3fd83';c.beginPath();c.ellipse(-r-5,-2,2.3,1.4,-.3,0,TAU);c.fill();
      c.beginPath();c.arc(-r-10,2,1.3,0,TAU);c.fill();break;
    case 'void': {
      // A dark core and tilted local orbit distinguish the Void Orb's shot.
      const rotation=presentationTick*.13;
      c.save();c.rotate(rotation);c.strokeStyle='#8e44ad';c.lineWidth=1.4;
      c.beginPath();c.ellipse(0,0,r+2,r*.45,0,Math.PI,TAU);c.stroke();c.restore();
      c.fillStyle='#291039';c.beginPath();c.arc(0,0,r*.88,0,TAU);c.fill();c.stroke();
      c.fillStyle='#ff007f';c.beginPath();c.arc(1,-.5,r*.38+pulse*.3,0,TAU);c.fill();
      c.save();c.rotate(rotation);c.strokeStyle='#b66ad0';c.beginPath();c.ellipse(0,0,r+2,r*.45,0,0,Math.PI);c.stroke();c.restore();
      c.fillStyle='#8e44ad';c.beginPath();c.moveTo(-r-7,-2);c.lineTo(-r-4,0);c.lineTo(-r-7,2);c.lineTo(-r-10,0);c.closePath();c.fill();break;
    }
    default:c.fillStyle='#efb8a5';c.beginPath();c.arc(0,0,r*.7,0,TAU);c.fill();c.stroke();
  }
  c.restore();
}

export function drawOrdinaryHostileProjectileImpact(c,contact,age){
  if(age<0||age>=ORDINARY_HOSTILE_PROJECTILE_IMPACT_MS||!contact?.position)return;
  const t=age/ORDINARY_HOSTILE_PROJECTILE_IMPACT_MS,s=1-t;
  c.save();c.translate(contact.position.x,contact.position.y-8);c.globalAlpha*=s**1.2;
  c.lineCap='round';c.lineJoin='round';c.lineWidth=1.2;
  switch(contact.style){
    case 'clockwork':
      c.strokeStyle='#11151a';c.fillStyle='#60d9bc';
      for(let i=0;i<3;i++){const a=i*TAU/3+.2,r=2+5*t;c.save();c.translate(Math.cos(a)*r,Math.sin(a)*r);c.rotate(a);c.beginPath();c.moveTo(2*s,0);c.lineTo(0,-1.4*s);c.lineTo(-2*s,0);c.lineTo(0,1.4*s);c.closePath();c.fill();c.stroke();c.restore();}
      c.strokeStyle='#ffe4a4';c.beginPath();c.arc(0,0,1+3*t,0,TAU);c.stroke();break;
    case 'thorn':
      c.fillStyle='#7cbd58';c.strokeStyle='#c6ed9d';
      for(let i=0;i<3;i++){const a=i*TAU/3+.3,r=3+5*t;c.save();c.translate(Math.cos(a)*r,Math.sin(a)*r);c.rotate(a);
        c.beginPath();c.moveTo(2.4,0);c.lineTo(-1.5,-1.2);c.lineTo(-.7,1.3);c.closePath();c.fill();c.stroke();c.restore();}break;
    case 'frost':
      c.fillStyle='#c4f8ff';c.strokeStyle='#3498db';
      for(let i=0;i<4;i++){const a=i*Math.PI/2+.4,r=3+4*t;c.save();c.translate(Math.cos(a)*r,Math.sin(a)*r);c.rotate(a);
        c.beginPath();c.moveTo(2.8,0);c.lineTo(0,-1.6);c.lineTo(-1.7,0);c.lineTo(0,1.6);c.closePath();c.fill();c.stroke();c.restore();}break;
    case 'fireball':
      c.fillStyle='#e67e22';for(let i=0;i<3;i++){const a=i*TAU/3-.4,r=2+4*t;c.save();c.translate(Math.cos(a)*r,Math.sin(a)*r);c.rotate(a);
        c.beginPath();c.moveTo(3.2,0);c.quadraticCurveTo(-1,-3.2,-3,-1);c.quadraticCurveTo(-1,2.5,3.2,0);c.closePath();c.fill();c.restore();}
      c.fillStyle='#f1c40f';c.beginPath();c.arc(0,0,2.6*s+.5,0,TAU);c.fill();break;
    case 'maelstrom':
      c.fillStyle='#55cf7d';for(let i=0;i<5;i++){const a=i*TAU/5+.2,r=2+6*t;c.beginPath();c.ellipse(Math.cos(a)*r,Math.sin(a)*r,1.4*s+.3,2*s+.4,a,0,TAU);c.fill();}
      c.strokeStyle='#a3fd83';c.beginPath();c.arc(0,0,2*s+.7,-.4,2.7);c.stroke();break;
    case 'void':
      c.strokeStyle='#c78bdd';c.lineWidth=1.4;for(let i=0;i<4;i++){const a=i*Math.PI/2+.5,outer=7-2*t,inner=1+2*t;
        c.beginPath();c.moveTo(Math.cos(a)*outer,Math.sin(a)*outer);c.lineTo(Math.cos(a)*inner,Math.sin(a)*inner);c.stroke();}
      c.fillStyle='#ff5cac';c.beginPath();c.moveTo(0,-3*s);c.lineTo(2*s,0);c.lineTo(0,3*s);c.lineTo(-2*s,0);c.closePath();c.fill();break;
    default:c.fillStyle='#f3c6ad';c.beginPath();c.arc(0,0,2.5*s+.7,0,TAU);c.fill();
  }
  c.restore();
}
