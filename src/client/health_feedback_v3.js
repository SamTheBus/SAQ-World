// Wilderness V3 · SAQ Dungeon-inspired health reactions.
// Presentation only: no mutation of actor projections, damage or persisted state.
import {creaturePresentationForRenderV3} from './creature_presentation_profiles_v3.js';

export const clampHealthRatio=value=>Number.isFinite(value)?Math.min(1,Math.max(0,value)):0;
export function actorHealthRatio(actor){
  const hp=actor?.hp,max=actor?.maxHp;
  if(!actor||!hp||!max)return 0;
  if(typeof hp.m==='number'&&typeof max.m==='number'&&max.m>0){
    return clampHealthRatio(hp.m/max.m*Math.pow(10,(hp.e??0)-(max.e??0)));
  }
  return clampHealthRatio(Number(hp)/Number(max));
}

// Holds missing health in pale gold for 140 ms, then catches up smoothly.
// Reset on a new world space and after a seek so stale actors cannot flash.
export function createHealthTrailsV3(){
  const entries=new Map();
  function sample(id,ratio,time){
    const actual=clampHealthRatio(ratio),now=Number.isFinite(time)?time:0;
    if(entries.size>256){
      for(const [key,value] of entries)if(now-value.at>8000)entries.delete(key);
      if(entries.size>384)entries.delete(entries.keys().next().value);
    }
    let item=entries.get(id);
    if(!item||now<item.at||now-item.at>5000){
      item={actual,trail:actual,hitAt:-Infinity,at:now};entries.set(id,item);
      return {actual,trail:actual,impact:0};
    }
    const dt=Math.min(90,Math.max(0,now-item.at));
    if(actual<item.actual-.0005){item.trail=Math.max(item.trail,item.actual);item.hitAt=now;}
    else if(actual>item.actual+.0005){item.trail=actual;item.hitAt=-Infinity;}
    item.actual=actual;item.at=now;
    if(now-item.hitAt>140)item.trail=Math.max(actual,item.trail-dt*.00065);
    item.trail=Math.max(item.trail,actual);
    return {actual,trail:item.trail,impact:Math.max(0,1-(now-item.hitAt)/260)};
  }
  return Object.freeze({sample,clear:()=>entries.clear(),count:()=>entries.size});
}

// Draw on top of the accepted native creature/elite/Mimic bar: only the
// lost-health segment is replaced. All colored affix labels are preserved.
export function drawEnemyHealthEchoV3(c,actor,reading,tick){
  if(!actor?.alive||reading.trail-reading.actual<=.001&&reading.impact<=0)return;
  let x=-18,y=-26,w=36,h=4;
  if(actor.aegisMimic&&actor.aegisMimic.stage!=='detached'){
    const m=actor.aegisMimic,landing=m.stage==='landing';
    const lift=landing?24*(1-clampHealthRatio((tick-m.detachedTick)/30)):24;
    x=-13;y=-30-lift;w=26;h=3;
  } else if(actor.enemyFamily){
    const profile=creaturePresentationForRenderV3(actor.enemyFamily)||creaturePresentationForRenderV3('sprout');
    const width=Math.max(18,Math.min(34,profile.visualBounds.width*.68));
    w=actor.elite?Math.max(34,Math.min(54,profile.visualBounds.width*.9)):width;
    x=-w/2;y=profile.labels.healthBarY;
    h=actor.elite?6:profile.visualScale<.72?3:4;
  }
  c.save();c.translate(actor.position.x,actor.position.y);
  const gap=Math.max(0,reading.trail-reading.actual);
  if(gap>.001){
    c.fillStyle=`rgba(255,231,171,${.65+reading.impact*.3})`;
    c.fillRect(x+w*reading.actual,y+h-2,Math.max(.4,w*gap),Math.min(2,h));
  }
  if(reading.impact>0){
    c.strokeStyle=`rgba(255,244,201,${reading.impact*.8})`;
    c.lineWidth=.9;c.strokeRect(x-.7,y-.7,w+1.4,h+1.4);
  }
  c.restore();
}

export function drawBossHealthEchoV3(c,canvas,actor,reading,time){
  if(!actor?.alive)return;
  const id=actor.boss?.bossDefinitionId;
  let bar;
  if(id==='brimstone_colossus'){
    const width=Math.min(480,canvas.width-24);bar={x:(canvas.width-width)/2+12,y:34,w:width-24,h:8};
  }else if(id==='aegis_goliath'){
    const width=Math.min(340,canvas.width-32);bar={x:(canvas.width-width)/2+10,y:31,w:width-20,h:8};
  }else if(id==='arachnid_treant'){
    const width=Math.min(430,canvas.width-28);bar={x:(canvas.width-width)/2+9,y:33,w:width-18,h:8};
  }else return;
  c.save();
  const gap=Math.max(0,reading.trail-reading.actual);
  if(gap>.001){c.fillStyle=`rgba(255,231,171,${.76+reading.impact*.2})`;c.fillRect(bar.x+bar.w*reading.actual,bar.y,bar.w*gap,bar.h);}
  if(reading.impact>0){
    c.strokeStyle=`rgba(255,228,168,${reading.impact*.9})`;c.lineWidth=1.7;c.strokeRect(bar.x-1,bar.y-1,bar.w+2,bar.h+2);
    c.fillStyle=`rgba(255,252,222,${reading.impact*.8})`;c.fillRect(bar.x+bar.w*reading.actual-1,bar.y,2,bar.h);
  }
  // Subtle half-health phase marker, independent of the authoritative phase.
  c.fillStyle='#f6daac9b';c.fillRect(bar.x+bar.w*.5-.5,bar.y,1,bar.h);
  c.restore();
}

export function createPlayerHealthHudV3(doc){
  const track=doc.querySelector('.hp-track'),root=doc.getElementById('world-app'),vitals=doc.getElementById('world-hud-vitals');
  const trails=createHealthTrailsV3(),echo=track?doc.createElement('span'):null;
  if(echo){echo.className='saq-hp-echo-v3';echo.setAttribute('aria-hidden','true');track.appendChild(echo);}
  return Object.freeze({
    update(ratio,time){
      const data=trails.sample('hero',ratio,time);
      if(echo){echo.style.left=`${(data.actual*100).toFixed(3)}%`;echo.style.width=`${(Math.max(0,data.trail-data.actual)*100).toFixed(3)}%`;echo.style.opacity=String(.62+data.impact*.38);}
      const low=data.actual>0&&data.actual<=.35;
      if(root){root.classList.toggle('saq-low-health-v3',low);root.style.setProperty('--saq-injury-opacity',String(low?Math.min(.88,Math.max(.2,(.35-data.actual)/.35*.88)):'0'));}
      vitals?.classList.toggle('saq-critical-health-v3',data.actual>0&&data.actual<=.2);
      return data;
    },
    reset(){trails.clear();if(root){root.classList.remove('saq-low-health-v3');root.style.removeProperty('--saq-injury-opacity');}vitals?.classList.remove('saq-critical-health-v3');},
    destroy(){echo?.remove();if(root){root.classList.remove('saq-low-health-v3');root.style.removeProperty('--saq-injury-opacity');}vitals?.classList.remove('saq-critical-health-v3');}
  });
}
