export function spaceKey(model) {
  const c = model.context;
  return `${c.sessionId}/${c.spaceInstanceId}/${c.spaceRevision}${c.residencyRevision===undefined?"":"/"+c.residencyRevision}`;
}
export function gameplayPresentationState(model,{foregroundModalOpen=false,fullScreenPanelOpen=false}={}){
  const player=model?.playersById?.[model.localPlayerId],actor=player&&model.entitiesById?.[player.entityId];
  const activeGameplay=Boolean(actor?.alive&&['safe','encounter'].includes(model?.persistence?.phase));
  return Object.freeze({activeGameplay,foregroundModalOpen:Boolean(foregroundModalOpen),fullScreenPanelOpen:Boolean(fullScreenPanelOpen),
    gameplayHudVisible:activeGameplay&&!foregroundModalOpen&&!fullScreenPanelOpen});
}
export function applyGameplayPresentationState(document,state){
  const root=document.documentElement;
  root.dataset.activeGameplay=String(state.activeGameplay);
  root.dataset.foregroundModalOpen=String(state.foregroundModalOpen);
  root.dataset.fullScreenPanelOpen=String(state.fullScreenPanelOpen);
  root.dataset.gameplayHudVisible=String(state.gameplayHudVisible);
  return state;
}
export function selectedActor(model) {
  const id = model.playersById[model.localPlayerId]?.entityId;
  if (!id || !model.entitiesById[id]) throw new TypeError("Selected local player is absent");
  return model.entitiesById[id];
}
export function createHeroFacing(){
  const records=new Map();let context=null;
  return Object.freeze({rebase(project){for(const r of records.values()){const p=project({x:r.x,y:r.y});r.x=p.x;r.y=p.y;}},update(model){
    const key=spaceKey(model);if(context!==key){records.clear();context=key;}
    for(const id of records.keys())if(!model.entitiesById[id])records.delete(id);
    const result={};
    for(const [id,actor] of Object.entries(model.entitiesById))if(actor.team!=='hostile'){
      const previous=records.get(id),primary=model.primary?.actorsById[id];
      let facing=previous?.facing??((primary?.facing.x??1)<0?-1:1);
      if(previous&&actor.position.x!==previous.x)facing=actor.position.x>previous.x?1:-1;
      records.set(id,{x:actor.position.x,y:actor.position.y,facing});
      result[id]={facing:primary?.current?(primary.current.aim.x<0?-1:1):facing,
        primary:primary&&!primary.current?{...primary,facing:{x:facing,y:0}}:primary};
    }
    return result;
  }});
}
export function createControlProfile({ coarsePointer = false, touchPoints = 0, legacyMode = null } = {}) {
  let current = Object.freeze({ mode: ["joystick", "cursor"].includes(legacyMode) ? legacyMode :
    coarsePointer || touchPoints > 0 ? "joystick" : "cursor",
  provenance: ["joystick", "cursor"].includes(legacyMode) ? "legacy-preserved/unknown" : "capability-default" });
  return Object.freeze({ read: () => current, select: (mode) => {
    if (!["joystick", "cursor"].includes(mode)) throw new TypeError("Unknown control mode");
    current = Object.freeze({ mode, provenance: "explicit-user" });
    return current;
  } });
}
// Prototype presentation tuning by actual rendered gameplay bounds, not device model.
export const CAMERA_ZOOM_PROFILE=Object.freeze({narrowWidth:600,shortHeight:420,narrow:1.35,shortWide:1.0,standard:1.6});
export function cameraZoomForViewport(width,height){
  if(width<=CAMERA_ZOOM_PROFILE.narrowWidth)return CAMERA_ZOOM_PROFILE.narrow;
  if(height<=CAMERA_ZOOM_PROFILE.shortHeight&&width>height)return CAMERA_ZOOM_PROFILE.shortWide;
  return CAMERA_ZOOM_PROFILE.standard;
}
export function createCamera() {
  const DEAD_ZONE_X=18,DEAD_ZONE_Y=14,FOLLOW_TIME_MS=90,SNAP_GAP_MS=250,SNAP_DISTANCE=192;
  let current = Object.freeze({ x: 0, y: 0, zoom: 1.6, spaceKey: null }),lastTime=null,lastWidth=null,lastHeight=null,lastActor=null;
  return Object.freeze({ read: () => current, update: (model, width, height, time=null) => {
    const actor = selectedActor(model), c = model.space.collision, baseZoom = cameraZoomForViewport(width,height);
    const bound = (target, map, view) => c.endless ? target-view/2 : map <= view ? (map-view)/2 : Math.max(0, Math.min(map-view, target-view/2));
    // Residency revisions describe streamed-page changes inside the same live
    // space. They invalidate rendered data but are not camera discontinuities.
    const mapWidth=c.width*c.tileSize,mapHeight=c.height*c.tileSize,key=`${model.context.sessionId}/${model.context.spaceInstanceId}/${model.context.spaceRevision}`,zoom=baseZoom,viewWidth=width/zoom,viewHeight=height/zoom,focusY=actor.position.y-20,target={x:bound(actor.position.x,mapWidth,viewWidth),y:bound(focusY,mapHeight,viewHeight)},elapsed=Number(time)-Number(lastTime),actorJump=lastActor?Math.hypot(actor.position.x-lastActor.x,actor.position.y-lastActor.y):Infinity;
    const snap=!Number.isFinite(Number(time))||lastTime===null||elapsed<=0||elapsed>=SNAP_GAP_MS||current.spaceKey!==key||lastWidth!==width||lastHeight!==height||current.zoom!==zoom||actorJump>=SNAP_DISTANCE;
    if(snap)current=Object.freeze({...target,zoom,spaceKey:key});
    else{
      const goal=(value,wanted,zone)=>Math.abs(wanted-value)<=zone?value:wanted-Math.sign(wanted-value)*zone,alpha=1-Math.exp(-elapsed/FOLLOW_TIME_MS),clamp=(value,map,view)=>c.endless?value:map<=view?(map-view)/2:Math.max(0,Math.min(map-view,value));
      current=Object.freeze({x:clamp(current.x+(goal(current.x,target.x,DEAD_ZONE_X)-current.x)*alpha,mapWidth,viewWidth),y:clamp(current.y+(goal(current.y,target.y,DEAD_ZONE_Y)-current.y)*alpha,mapHeight,viewHeight),zoom,spaceKey:key});
    }
    lastTime=Number.isFinite(Number(time))?Number(time):null;lastWidth=width;lastHeight=height;lastActor={x:actor.position.x,y:actor.position.y};
    return current;
  } });
}
export function createPaintedPrompt() {
  let painted = null;
  return Object.freeze({ clear: () => { painted = null; }, read: () => painted,
    record: (box) => { painted = Object.freeze({ ...box }); },
    hit: (x, y, key, layout, context) => painted && painted.key === key && painted.layout === layout && painted.context === context &&
      x >= painted.x && x <= painted.x+painted.width && y >= painted.y && y <= painted.y+painted.height ? painted.exitId : null });
}
export function createPresentationQueue() {
  const jobs = new Map();
  return Object.freeze({ retain: (model, requestId, dueTick, message) => {
    jobs.set(requestId, { key: spaceKey(model), requestId, dueTick, message });
  }, due: (model) => {
    const ready = [];
    for (const [id, job] of jobs) if (job.dueTick <= model.tick || job.key !== spaceKey(model)) {
      jobs.delete(id);
      if (job.key === spaceKey(model) && job.dueTick <= model.tick) ready.push(Object.freeze({ ...job }));
    }
    return Object.freeze(ready);
  } });
}
