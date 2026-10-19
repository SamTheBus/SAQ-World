// One-shot contextual action input. Each pointer owns only this button, so a
// second finger can interact while the movement surface keeps its first one.
export function createContextActionInput({button,activate}){
 const listeners=[],owners=new Set();
 const listen=(type,fn)=>{button.addEventListener(type,fn);listeners.push(()=>button.removeEventListener(type,fn));};
 listen('pointerdown',event=>{if(event.button!==0||owners.has(event.pointerId))return;event.preventDefault();event.stopPropagation();owners.add(event.pointerId);try{button.setPointerCapture(event.pointerId);}catch{/* Capture is optional. */}activate();});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(type,event=>{if(!owners.delete(event.pointerId))return;event.preventDefault?.();});
 // Pointer clicks were already committed on pointerdown. A zero-detail click is
 // keyboard/programmatic activation, so desktop accessibility keeps working.
 listen('click',event=>{event.preventDefault();if(event.detail===0)activate();});
 function clear(){for(const owner of owners)try{button.releasePointerCapture(owner);}catch{/* Already released. */}owners.clear();}
 return Object.freeze({clear,read:()=>({owners:[...owners]}),destroy(){clear();listeners.forEach(remove=>remove());}});
}
