// Deliberate context activation. Held key/repeat cannot trigger stairs or exit.
export function createCivilianContextInput({environment,readModel,activate,isBlocked=()=>false}){
 const key=e=>{if(e.code!=='KeyE'||e.repeat||isBlocked()||/INPUT|SELECT|TEXTAREA/.test(e.target?.tagName??''))return;const m=readModel(),a=m.entitiesById[m.playersById[m.localPlayerId].entityId],exit=m.space.exits?.find(e=>Math.hypot(a.position.x-e.x,a.position.y-e.y)<=e.radius);if(exit){e.preventDefault();activate(exit.exitId);}};
 environment.addEventListener('keydown',key);return {destroy:()=>environment.removeEventListener('keydown',key)};
}
