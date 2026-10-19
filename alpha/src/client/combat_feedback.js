import {drawEarthBreaker} from './mastery_art.js';
import {drawLightningChain} from './tome_element_art.js';
import {drawBarrierImpact,drawBarrierAbsorptionIcon} from './barrier_impact.js';
import {drawDungeonCrit,drawDungeonDefense} from './dungeon_combat_icons.js';
import {combatTextStyle,chooseTextPath} from './combat_text_layout.js';
import {drawPacketIcon,drawCombatImpact,MECHANIC_COLORS} from './combat_vfx.js';
import {integerRatio,formatLarge} from '../shared/contracts/large_number.js';
import {combatInteger,presentCombat} from '../shared/contracts/combat_amount.js';
import {spaceKey} from './presentation_state.js';

// H4A player_attack.js / mob_renderer.js / floating_text.js adaptations.
// Everything here is disposable client state. Time is supplied by the renderer.
export const HIT_FEEDBACK=Object.freeze({flashMs:100,recoilMs:180,sparksMs:170,placementMs:120,numberMs:750,maxNumbers:128,maxPerTarget:128,maxReactions:32});
const boundedSet=(map,key,value)=>{map.delete(key);if(map.size>=HIT_FEEDBACK.maxReactions)map.delete(map.keys().next().value);map.set(key,value);};
export function createCombatFeedback(){
  let domain=null,context=null,cursor=0,numbers=[],impacts=[],peak=0,lastModel=null,lastLayout=[],lastReserved=[];const reactions=new Map(),primaries=new Map();
  function update(model,time){
    lastModel=model;
    const nextDomain=model.context.campaignId+'/'+model.context.sessionId,key=spaceKey(model);
    if(domain!==nextDomain){domain=nextDomain;cursor=0;context=null;}
    if(context!==key){numbers=[];impacts=[];reactions.clear();primaries.clear();context=key;}
    numbers=numbers.filter(n=>n.shown===undefined?time-n.born<=HIT_FEEDBACK.placementMs:time-n.shown<combatTextStyle(n).life);
    impacts=impacts.filter(n=>time-n.born<300);
    for(const [id,r] of reactions)if(time-r.born>=HIT_FEEDBACK.recoilMs)reactions.delete(id);
    for(const e of model.primary?.events??[]){
      if(e.eventSequence<=cursor)continue;cursor=e.eventSequence;
      if(e.kind==='combat.primaryStarted'){boundedSet(primaries,e.source.entityId,{commandId:e.causation.commandId,step:e.payload.comboStep});continue;}
      if(e.kind==='combat.primaryFinished'){primaries.delete(e.source.entityId);continue;}
      if(!['combat.damageApplied','combat.defenseResolved'].includes(e.kind))continue;
      const target=model.entitiesById[e.subject.entityId],source=model.entitiesById[e.source.entityId];if(!target)continue;
      const primary=primaries.get(e.source.entityId),heavy=target.team==='hostile'&&primary?.commandId===e.causation.commandId&&primary?.step===3;
      const dx=source?target.position.x-source.position.x:0,dy=source?target.position.y-source.position.y:0,length=Math.hypot(dx,dy);
      const direction=length>.001?{x:dx/length,y:dy/length}:{x:0,y:0};
      const player=target.team==='party',position={...target.position};
      boundedSet(reactions,e.subject.entityId,{born:time,direction,position,heavy,player,defended:Boolean(e.payload.defenseKind)});
      // Keep individual events; a hard cap bounds disposable feedback during extreme bursts.
      const same=numbers.filter(n=>n.targetId===e.subject.entityId);
      if(same.length>=HIT_FEEDBACK.maxPerTarget)numbers=numbers.filter(n=>n!==same[0]);
      if(numbers.length>=HIT_FEEDBACK.maxNumbers)numbers.shift();
      const damage=e.payload.damage,value=formatLarge(combatInteger(damage));
      numbers.push({sourceId:e.source.entityId,sourcePosition:source?{...source.position}:null,earthBreaker:e.payload.mechanic==='bash'&&model.combatPresentation?.families[e.source.entityId]?.mastery?.earthBreaker,eventTick:e.tick,eventSequence:e.eventSequence,targetId:e.subject.entityId,born:time,position,player,heavy,direction,chainFrom:e.payload.chainFrom??null,barrierAbsorption:e.payload.barrierAbsorption??null,sourceItem:e.payload.sourceItem??null,trigger:e.payload.trigger??null,defenseKind:e.payload.defenseKind,mechanic:e.payload.mechanic,critical:e.payload.critical===true,defended:Boolean(e.payload.defenseKind),text:e.kind==='combat.defenseResolved'?(e.payload.defenseKind??'block').toUpperCase():((player?'-':'')+value)});if(impacts.length>=128)impacts.shift();impacts.push(numbers[numbers.length-1]);
      if(e.payload.barrierAbsorption){const b=e.payload.barrierAbsorption,n=numbers[numbers.length-1],label={...n,labelKind:'absorption',mechanic:'barrier',defenseKind:'barrier',critical:false,text:'BARRIER -'+formatLarge(combatInteger(b.absorbed))};if(presentCombat(e.payload.damage)===0)numbers[numbers.length-1]=label;else{if(numbers.length>=HIT_FEEDBACK.maxNumbers)numbers.shift();numbers.push(label);}}
      peak=Math.max(peak,numbers.length);
    }
  }
  function reaction(id,time){const r=reactions.get(id);if(!r||time-r.born>=HIT_FEEDBACK.recoilMs)return null;
    const age=Math.max(0,time-r.born),strength=r.player?0:r.heavy?8:5,decay=(1-age/HIT_FEEDBACK.recoilMs)**2;
    return {offsetX:r.direction.x*strength*decay,offsetY:r.direction.y*strength*decay,flash:age<HIT_FEEDBACK.flashMs,player:r.player};
  }
  function draw(ctx,time,art=()=>null,viewport=null){
    ctx.save();
    for(const r of reactions.values()){if(r.defended)continue;const age=time-r.born;if(age<0||age>=HIT_FEEDBACK.sparksMs)continue;
      const t=age/HIT_FEEDBACK.sparksMs,p=r.position,base=Math.atan2(r.direction.y,r.direction.x),count=r.heavy?7:5;
      ctx.globalAlpha=1-t;ctx.strokeStyle=r.player?'#ff947c':'#fff0b0';ctx.lineWidth=r.heavy?2.3:1.8;
      for(let n=0;n<count;n++){const angle=base+(n-(count-1)/2)*.46,near=5+t*13,far=near+(r.heavy?12:8)*(1-t);
        ctx.beginPath();ctx.moveTo(p.x+Math.cos(angle)*near,p.y-12+Math.sin(angle)*near);ctx.lineTo(p.x+Math.cos(angle)*far,p.y-12+Math.sin(angle)*far);ctx.stroke();}
      if(r.player&&!r.defended){ctx.strokeStyle='#ff806b';ctx.beginPath();ctx.ellipse(p.x,p.y-13,13+t*5,18+t*5,0,0,Math.PI*2);ctx.stroke();}
    }
    // Keep impacts in world coordinates; text alone uses measured screen pixels.
    const earthDrawn=new Set();for(const n of impacts){const age=time-n.born;if(n.earthBreaker&&n.sourcePosition&&!earthDrawn.has(n.sourceId+'/'+n.eventTick)){earthDrawn.add(n.sourceId+'/'+n.eventTick);drawEarthBreaker(ctx,n.sourcePosition,n.direction,age);}if(n.chainFrom)drawLightningChain(ctx,n.chainFrom.position,n.position,age);if(n.barrierAbsorption){const b=n.barrierAbsorption;drawBarrierImpact(ctx,n.position.x,n.position.y,-n.direction.x,-n.direction.y,age,{remaining:integerRatio(combatInteger(b.remaining),combatInteger(b.capacity)),capacity:1});}if(n.mechanic!=='main'&&n.mechanic!=='hostile'&&n.mechanic!==n.defenseKind)drawCombatImpact(ctx,n.mechanic==='bash'&&n.trigger==='reactive'?'shieldRiposte':n.mechanic,n.position.x,n.position.y,n.direction.x,n.direction.y,age,n.critical);if(n.defenseKind==='block'||n.defenseKind==='parry')drawCombatImpact(ctx,n.defenseKind,n.position.x,n.position.y,-n.direction.x,-n.direction.y,age);}
    const transform=ctx.getTransform(),point=p=>({x:p.x*transform.a+transform.e,y:p.y*transform.d+transform.f}),scale=ctx.canvas.width/(ctx.canvas.clientWidth||ctx.canvas.width),view={x:4*scale,y:4*scale,width:ctx.canvas.width-8*scale,height:ctx.canvas.height-8*scale};
    const reserved=[],occupied=[];lastLayout=[];
    // Reserve every already-visible trajectory before placing any new event.
    for(const n of numbers){if(!n.path)continue;const p=point(n.position),b=n.path.box;occupied.push({x:p.x+b.x,y:p.y+b.y,width:b.width,height:b.height});}
    for(const a of Object.values(lastModel?.entitiesById??{})){if(!a.alive)continue;const p=point(a.position);if(p.x<-60||p.y<-100||p.x>ctx.canvas.width+60||p.y>ctx.canvas.height+100)continue;reserved.push({x:p.x-21*transform.a,y:p.y-36*transform.d,width:42*transform.a,height:10*transform.d});}
    for(const e of lastModel?.combatPresentation?.statuses??[]){const a=lastModel.entitiesById[e.targetId];if(!a?.alive)continue;const p=point(a.position),top=p.y-(49+(e.lane??0)*18)*transform.d;reserved.push({x:p.x-34*transform.a,y:top-19*transform.d,width:68*transform.a,height:29*transform.d});}
    lastReserved=reserved;
    ctx.setTransform(1,0,0,1,0,0);ctx.textAlign='left';ctx.textBaseline='middle';ctx.lineJoin='round';
    for(const n of numbers){if(n.shown===undefined&&time-n.born>HIT_FEEDBACK.placementMs)continue;const p=point(n.position);if(p.x<0||p.x>ctx.canvas.width||p.y<0||p.y>ctx.canvas.height)continue;
      const style=combatTextStyle(n),icon=Boolean(n.defenseKind)||(n.mechanic!=='main'&&n.mechanic!=='hostile'),mechanicWidth=icon?24*scale:0,critWidth=n.critical?20*scale:0,iconWidth=mechanicWidth+critWidth;
      ctx.font=`800 ${style.maxSize*scale}px system-ui`;const measure=ctx.measureText(n.text),textWidth=Math.max(measure.width,(measure.actualBoundingBoxLeft||0)+(measure.actualBoundingBoxRight||0)),height=Math.max(style.maxSize,(measure.actualBoundingBoxAscent||0)/scale+(measure.actualBoundingBoxDescent||0)/scale,icon?22:0)*scale+4*scale,size={width:textWidth+iconWidth+4*scale,height};
      const old=n.path?{x:p.x+n.path.x,y:p.y+n.path.y,direction:n.path.direction}:null;
      const localTop=Math.min(p.y-36*transform.d,...(lastModel?.combatPresentation?.statuses??[]).filter(e=>e.targetId===n.targetId).map(e=>p.y-(68+(e.lane??0)*18)*transform.d));
      const chosen=old?{...old,box:{x:p.x+n.path.box.x,y:p.y+n.path.box.y,width:n.path.box.width,height:n.path.box.height}}:chooseTextPath({x:p.x,y:localTop-size.height/2-6*scale},size,occupied,reserved,view,n.eventSequence,scale);
      if(!chosen)continue;
      if(!n.path){occupied.push(chosen.box);n.path={x:chosen.x-p.x,y:chosen.y-p.y,direction:chosen.direction,box:{x:chosen.box.x-p.x,y:chosen.box.y-p.y,width:chosen.box.width,height:chosen.box.height}};n.shown=time;}
      const age=Math.max(0,time-n.shown),t=age/style.life;if(t>=1)continue;
      const x=chosen.x+chosen.direction*9*scale*t,y=chosen.y-18*scale*t,font=style.size+(n.critical?3*Math.max(0,1-age/150):0);
      ctx.globalAlpha=Math.min(1,(1-t)*4);ctx.font=`800 ${font*scale}px system-ui`;ctx.lineWidth=3*scale;ctx.strokeStyle='#140d20';ctx.fillStyle=n.labelKind==='absorption'?'#d49afa':n.defended?'#67e8f9':n.player?'#ff6a66':n.critical?'#ffe6a0':MECHANIC_COLORS[n.mechanic]??(n.heavy?'#ffe16b':'#fff7db');
      const width=ctx.measureText(n.text).width+iconWidth,left=x-width/2;
      if(icon){ctx.save();ctx.translate(left+10*scale,y);ctx.scale(scale,scale);if(n.labelKind==='absorption')drawBarrierAbsorptionIcon(ctx,0,0,18);else if(n.defenseKind)drawDungeonDefense(ctx,n.defenseKind,0,0,18);else drawPacketIcon(ctx,n.mechanic,n.sourceItem,0,0,art);ctx.restore();}
      if(n.critical)drawDungeonCrit(ctx,left+mechanicWidth+9*scale,y,16*scale);
      ctx.strokeText(n.text,left+iconWidth,y);ctx.fillText(n.text,left+iconWidth,y);
      lastLayout.push({eventSequence:n.eventSequence,targetId:n.targetId,box:chosen.box,text:n.text,mechanic:n.mechanic,critical:n.critical,life:style.life,font,position:{x,y}});
    }
    ctx.restore();
  }
  return Object.freeze({rebase(project){for(const n of new Set([...numbers,...impacts,...reactions.values()])){n.position=project(n.position);if(n.sourcePosition)n.sourcePosition=project(n.sourcePosition);if(n.chainFrom)n.chainFrom={...n.chainFrom,position:project(n.chainFrom.position)};}},update,reaction,draw,resources:()=>({floatingNumbers:numbers.length,hitReactions:reactions.size,peakFloatingNumbers:peak}),
    // Explicit inspection is for evidence; normal rendering never serializes it.
    inspect:()=>({cursor,reserved:lastReserved.map(b=>({...b})),layout:lastLayout.map(n=>({...n,box:{...n.box}})),numbers:numbers.map(n=>({...n,position:{...n.position}}))})});
}
