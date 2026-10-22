import { selectedActor, spaceKey } from "./presentation_state.js";

export function createWorldInput({ canvas, environment, renderer, profile, adapter, readModel, reportError, now, isBlocked=()=>false,openForge=()=>{}, openFerry=()=>{},openService=()=>{}, retryRejectedStop=false, readCommandModel=readModel }) {
  const keys = new Set(), actionOwners = new Set(), listeners = [];
  let movementOwner = null, joystick = null, cursor = null, suppressedUntil = -1, lastIntent = "0,0", key = spaceKey(readModel());
  const directional = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyW", "KeyA", "KeyS", "KeyD"]);
  let stopPending=false;
  function retryStop(){
    if(!stopPending)return true;
    const model=readCommandModel();if(!selectedActor(model).alive){stopPending=false;lastIntent='0,0';return true;}
    try{const result=adapter.issue('movement.setIntent',{x:0,y:0},model);if(result?.status==='admitted'||result?.status==='alreadyApplied'){stopPending=false;lastIntent='0,0';return true;}}
    catch(error){reportError(error.message);}return false;
  }
  function send(x, y, model) {
    const length = Math.hypot(x, y); if (length > 1) { x /= length; y /= length; }
    const signature = `${x},${y}`;
    if (isBlocked() || signature === lastIntent || !selectedActor(model??readModel()).alive) return;
    try { const result=adapter.issue("movement.setIntent", { x, y }, retryRejectedStop?readCommandModel():model);
      if(!retryRejectedStop||result?.status==='admitted'||result?.status==='alreadyApplied')lastIntent=signature;
      else if(signature==='0,0')stopPending=true;
    }
    catch (error) { reportError(error.message); }
  }
  function refresh(model = readModel()) {
    if (spaceKey(model) !== key) { clear(false); key = spaceKey(model); }
    if(stopPending&&!retryStop())return;
    if (isBlocked() || !selectedActor(model).alive) { if(keys.size||movementOwner!==null||actionOwners.size||joystick||cursor||lastIntent!=="0,0")clear(retryRejectedStop&&selectedActor(model).alive);return; }
    // A checkpoint pauses authority, not the physical key/touch ownership.
    // Retain candidate input until admission resumes; a released key then sends
    // zero rather than losing track of the still-authoritative movement intent.
    if (!["safe","encounter"].includes(model.persistence.phase)) { if(!retryRejectedStop)clear(false); return; }
    if (keys.size) return send(Number(keys.has("ArrowRight") || keys.has("KeyD"))-Number(keys.has("ArrowLeft") || keys.has("KeyA")),
      Number(keys.has("ArrowDown") || keys.has("KeyS"))-Number(keys.has("ArrowUp") || keys.has("KeyW")),model);
    if (joystick) return send(joystick.dx/44, joystick.dy/44,model);
    if (cursor) {
      const actor = selectedActor(model), dx = cursor.x-actor.position.x, dy = cursor.y-actor.position.y, distance = Math.hypot(dx, dy);
      if (distance <= 4) return send(0, 0,model);
      return send(dx/distance, dy/distance,model);
    }
    send(0, 0,model);
  }
  function clear(release = true) {
    const owned = [movementOwner, ...actionOwners];
    keys.clear(); movementOwner = null; actionOwners.clear(); joystick = null; cursor = null;
    for (const id of owned) if (id !== null) try { canvas.releasePointerCapture?.(id); } catch { /* Already released. */ }
    if(retryRejectedStop){stopPending=stopPending||lastIntent!=='0,0';retryStop();}
    else {if (release) send(0, 0);stopPending=false;lastIntent = "0,0";}
  }
  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX-rect.left)*canvas.width/rect.width, y: (event.clientY-rect.top)*canvas.height/rect.height };
  }
  function action(exitId) {
    if (isBlocked() || !exitId || !selectedActor(readModel()).alive) return false;
    clear();
    try { const selected=readModel().space.exits?.find(e=>e.exitId===exitId);let result;if(selected?.serviceNpcId){if(selected.available)openService(selected);}else if(selected?.ferryLandingId){if(selected.available)openFerry(selected);}else if(selected?.forgeAction){if(selected.available)openForge();}else if(selected?.siteAction)result=adapter.issue("site.transition",selected.siteAction);else result=adapter.issue("space.travel", { exitId });if(result?.then)result.catch(error=>reportError(error.message)); } catch (error) { reportError(error.message); }
    return true;
  }
  function listen(target, type, handler, options) { target.addEventListener(type, handler, options); listeners.push(() => target.removeEventListener(type, handler, options)); }
  listen(environment, "keydown", (event) => {
    if (!directional.has(event.code) || ["SELECT", "INPUT", "BUTTON"].includes(event.target?.tagName)) return;
    event.preventDefault();
    if (isBlocked()) return; // Preparation input is discarded, never queued.
    if (event.repeat && !keys.has(event.code)) return; // A held old-space key needs a fresh keydown.
    keys.add(event.code); refresh();
  });
  listen(environment, "keyup", (event) => { if (directional.has(event.code)) { keys.delete(event.code); refresh(); } });
  listen(canvas, "pointerdown", (event) => {
    if (isBlocked() || event.button !== 0 || !selectedActor(readModel()).alive) return;
    event.preventDefault(); suppressedUntil = now()+800;
    const p = point(event), model = readModel(), exitId = renderer.hit(p, model);
    if (exitId) {
      action(exitId); actionOwners.add(event.pointerId);
      try { canvas.setPointerCapture(event.pointerId); } catch { /* Capture unavailable. */ }
      return;
    }
    if (movementOwner !== null || !["safe","encounter"].includes(model.persistence.phase)) return;
    movementOwner = event.pointerId;
    try { canvas.setPointerCapture(event.pointerId); } catch { /* Capture unavailable. */ }
    if (profile.read().mode === "joystick") joystick = { x: p.x, y: p.y, dx: 0, dy: 0 };
    else { const cam = renderer.camera.read(); cursor = { x: p.x/cam.zoom+cam.x, y: p.y/cam.zoom+cam.y }; }
    refresh();
  });
  listen(canvas, "pointermove", (event) => {
    if (movementOwner !== event.pointerId) return;
    const p = point(event);
    if (joystick) { const dx = p.x-joystick.x, dy = p.y-joystick.y, factor = Math.max(1, Math.hypot(dx, dy)/44);
      Object.assign(joystick, { dx: dx/factor, dy: dy/factor }); }
    else { const cam = renderer.camera.read(); cursor = { x: p.x/cam.zoom+cam.x, y: p.y/cam.zoom+cam.y }; }
    refresh();
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) listen(canvas, type, (event) => {
    actionOwners.delete(event.pointerId);
    if (movementOwner === event.pointerId) { movementOwner = null; joystick = null; cursor = null; refresh(); }
  });
  listen(canvas, "click", (event) => { event.preventDefault(); if (now() > suppressedUntil) action(renderer.hit(point(event), readModel())); });
  listen(environment, "blur", () => clear());
  listen(environment.document, "visibilitychange", () => { if (environment.document.hidden) clear(); });
  listen(canvas, "contextlost", (event) => { event.preventDefault(); clear(); });
  listen(canvas, "contextrestored", () => { clear(); renderer.replaceContext(); });
  return Object.freeze({ refresh, clear, activate:action, destroy: () => { clear(); listeners.forEach((remove) => remove()); },
    read: () => Object.freeze({ movementOwner, actionOwners: Object.freeze([...actionOwners]), keys: Object.freeze([...keys]),
      joystick: joystick ? Object.freeze({ ...joystick }) : null, cursor: cursor ? Object.freeze({ ...cursor }) : null }) });
}
