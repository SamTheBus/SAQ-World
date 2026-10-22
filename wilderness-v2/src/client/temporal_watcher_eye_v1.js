// Cosmetic only. Read the existing view; do not acquire an AI target or save
// a new timer. The supplied tick and visual seed keep blinks deterministic.
const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
export function watcherLookTarget(actor,entitiesById){
 if(!point(actor?.position))return null;
 const rangeSquared=320*320,distance=e=>(e.position.x-actor.position.x)**2+(e.position.y-actor.position.y)**2;
 const eligible=e=>e?.alive&&e.team==='party'&&point(e.position)&&distance(e)<=rangeSquared;
 const engaged=entitiesById[actor.meleePhase?.targetEntityId];
 if(eligible(engaged))return {...engaged.position};
 let nearest=null,nearestId='',best=Infinity;
 for(const [id,e] of Object.entries(entitiesById))if(eligible(e)){
  const d=distance(e);if(d<best||(d===best&&id<nearestId)){nearest=e;nearestId=id;best=d;}
 }
 return nearest?{...nearest.position}:null;
}
export function watcherLookDirection(actor,target,pose=null){
 if(!point(actor?.position)||!point(target))return {x:0,y:0};
 const dx=target.x-actor.position.x-(pose?.body?.x??0),dy=target.y-actor.position.y-(pose?.body?.y??0),angle=pose?.body?.rotation??0;
 const cos=Math.cos(angle),sin=Math.sin(angle),facing=actor.presentationFacingX===-1?-1:1;
 return {x:(dx*cos+dy*sin)*facing,y:dy*cos-dx*sin};
}
export function watcherEyePose(tick,seed,direction=null,phase='idle',flash=false){
 const dx=point(direction)?direction.x:0,dy=point(direction)?direction.y:0,length=Math.max(64,Math.hypot(dx,dy));
 const visualSeed=seed>>>0,period=260+visualSeed%101,offset=(visualSeed*37+19)%period;
 const elapsed=Number.isFinite(tick)?tick:0,cycle=((elapsed+offset)%period+period)%period,blinkAge=cycle-(period-10);
 const openness=phase==='idle'&&!flash&&blinkAge>=0?1-Math.sin(Math.PI*blinkAge/10)**2:1;
 return {gazeX:dx/length*2.2,gazeY:dy/length*.75,openness};
}
