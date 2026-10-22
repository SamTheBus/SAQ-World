// Presentation-only painter ordering. Canonical state never depends on this
// list: each item supplies a stable ground contact and deterministic identity.
export function compareDepthItems(a,b){
  return Number(a.anchorY)-Number(b.anchorY)||Number(a.anchorX??0)-Number(b.anchorX??0)||String(a.id).localeCompare(String(b.id));
}
export function drawDepthItems(ctx,items){
  const ordered=[...items].sort(compareDepthItems);
  for(const item of ordered)item.draw(ctx);
  return ordered;
}
export function depthItem({id,anchorX=0,anchorY,draw}){
  if(!id||!Number.isFinite(Number(anchorY))||typeof draw!=='function')throw new TypeError('Invalid depth item');
  return Object.freeze({id:String(id),anchorX:Number(anchorX),anchorY:Number(anchorY),draw});
}
