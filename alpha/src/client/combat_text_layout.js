// Disposable screen-space layout. A swept box reserves the complete short trajectory.
export const TEXT_LAYOUT=Object.freeze({maxLabels:128,maxCandidates:63,padding:3,travelY:18,travelX:9});
export const intersects=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
export function combatTextStyle(n){const tick=['bleed','burn','poison','bloom'].includes(n.mechanic),strong=n.mechanic==='fire'||n.mechanic==='bash';return n.critical?{size:18,maxSize:21,life:750}:tick?{size:13,maxSize:13,life:460}:n.mechanic==='offhand'?{size:14,maxSize:14,life:540}:{size:strong?18:16,maxSize:strong?18:16,life:660};}
export function chooseTextPath(anchor,size,occupied,reserved,view,sequence,scale=1,preferred=null){
 const pad=TEXT_LAYOUT.padding*scale,dy=TEXT_LAYOUT.travelY*scale,dx=TEXT_LAYOUT.travelX*scale;
 const legal=p=>{const box={x:p.x-size.width/2+Math.min(0,p.direction*dx)-pad,y:p.y-size.height/2-dy-pad,width:size.width+Math.abs(p.direction*dx)+pad*2,height:size.height+dy+pad*2};return box.x>=view.x&&box.y>=view.y&&box.x+box.width<=view.x+view.width&&box.y+box.height<=view.y+view.height&&!occupied.some(b=>intersects(box,b))&&!reserved.some(b=>intersects(box,b))?{...p,box}:null;};
 if(preferred){const p=legal(preferred);if(p)return p;}
 const order=sequence%2?[0,-1,1]:[0,1,-1];let tried=0;
 for(const row of [0,1,2,3,-1,-2,-3])for(const side of order)for(let spread=0;spread<3;spread++){
  if(++tried>TEXT_LAYOUT.maxCandidates)return null;
  const x=anchor.x+side*(size.width/2+14*scale+spread*20*scale),y=anchor.y-(row*(size.height+6*scale))-spread*5*scale;
  const edgeX=Math.max(view.x+size.width/2+pad+dx,Math.min(view.x+view.width-size.width/2-pad-dx,x)),edgeY=Math.max(view.y+size.height/2+dy+pad,Math.min(view.y+view.height-size.height/2-pad,y));
  const p=legal({x:Math.abs(edgeX-x)<=48*scale?edgeX:x,y:Math.abs(edgeY-y)<=48*scale?edgeY:y,direction:side});if(p)return p;
 }
 return null; // Caller permits only a 120 ms placement opportunity, then retires transient text.
}
