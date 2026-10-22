import {freezeWire,requireContract as check} from '../contracts/wire.js';

export const RUIN_GROVE_VERSION='small-woodland-grove-composition-v1';
export const isRuinGrovePilot=(asset,reservation)=>asset.assetId==='alpha'&&reservation.id==='repeatable-slot:ruin:woodland:small:01'&&reservation.tier==='small';
const hash=s=>{let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;return n;};
const key=(x,y)=>x+','+y,order=(a,b)=>a.y-b.y||a.x-b.x;
const ratios=[488/522,516/315,418/501,285/368,318/408,281/353];

// A soft, irregular inner transition. Weight is exactly zero outside the pilot;
// no geography, collision, material identity or route width is selected here.
export function ruinLandscapeBlendAt(scene,x,y){
 const d=Math.min(x-scene.left,y-scene.top,scene.left+scene.width-x,scene.top+scene.height-y);
 if(d<=0)return 0;
 const inset=.7+.45*Math.sin(x/3.7)+.35*Math.cos(y/4.3)+.25*Math.sin((x+y)/5.1);
 const t=Math.max(0,Math.min(1,(d-Math.max(0,inset))/4));return t*t*(3-2*t);
}

// Native vegetation is the maximum permitted collision envelope. The new local
// footprint only removes foliage cells; it never adds blockers or clears water,
// walls, roads, approach/circulation, or ground outside this exact ruin envelope.
export function createRuinGrovePlan(ruin,seed,nativeTile){
 check(ruin.reservation.tier==='small','Grove pilot requires Small ruin');
 const domain=seed+'/'+ruin.reservation.id+'/'+RUIN_GROVE_VERSION,original=[],native=new Map();
 for(let y=ruin.top;y<ruin.top+ruin.height;y++)for(let x=ruin.left;x<ruin.left+ruin.width;x++){
  const b=ruin.apply(x,y,nativeTile(x,y));if(b.collision==='2'&&b.material==='g'&&!ruin.ownsStructure(x,y)){const p={x,y};original.push(p);native.set(key(x,y),p);}
 }
 const pending=new Set(native.keys()),components=[];
 for(const start of original){if(!pending.delete(key(start.x,start.y)))continue;const q=[start];for(let i=0;i<q.length;i++)for(const [dx,dy]of [[0,1],[1,0],[0,-1],[-1,0]]){const k=key(q[i].x+dx,q[i].y+dy);if(pending.delete(k))q.push(native.get(k));}components.push(q.sort(order));}
 const occupied=new Map(),pieces=[],clusters=[];
 for(const [index,cells]of components.entries()){
  const id='grove:'+hash(domain+'/cluster/'+index).toString(16).padStart(8,'0'),candidates=[];
  for(const p of cells)for(const [dx,dy]of [[0,0],[16,0],[0,16],[16,16]]){
   const n=hash(domain+'/shrub/'+p.x+'/'+p.y+'/'+dx+'/'+dy),width=[72,80,84][n%3],variant=(n>>>6)%4===0?5:3,h=width*ratios[variant],cx=p.x*32+16+dx+((n>>>12)%9-4),cy=p.y*32+16+dy+((n>>>16)%9-4),ground=cy+h*.39;
   if(cx-width/2<ruin.left*32+4||cx+width/2>(ruin.left+ruin.width)*32-4||ground-h*.94<ruin.top*32+4||ground+h*.06>(ruin.top+ruin.height)*32-4)continue;
   // The source's lower roots/branch gaps are not solid underbrush. Keep the
   // authoritative root footprint within its readable leaf mass, not its box.
   const covers=cells.filter(q=>((q.x*32+16-cx)/(width*.40))**2+((q.y*32+16-cy)/(h*.36))**2<=.78&&(q.y*32+16-cy)/h+.55<=.78);
   if(covers.length<2)continue;
   let clear=true;for(let y=Math.floor((cy-h*.36)/32);y<=Math.floor((cy+h*.36)/32)&&clear;y++)for(let x=Math.floor((cx-width*.40)/32);x<=Math.floor((cx+width*.40)/32);x++)if(((x*32+16-cx)/(width*.40))**2+((y*32+16-cy)/(h*.36))**2<=.78){const b=ruin.apply(x,y,nativeTile(x,y));if(ruin.ownsStructure(x,y)||ruin.trail.has(key(x,y))||ruin.circulation.has(key(x,y))||Math.abs(x-ruin.entrance.x)<=5&&y>=ruin.entrance.y-4&&y<=ruin.entrance.y+10)clear=false;}
   if(clear)candidates.push({cx,cy,ground,width,variant,covers,n});
  }
  const claimed=new Set(),target=Math.ceil(cells.length*(.70+(hash(id)%13)/100)),chosen=[];
  while(claimed.size<target){let best=null,score=-Infinity;for(const p of candidates){const fresh=p.covers.filter(q=>!claimed.has(key(q.x,q.y))).length;if(fresh<2)continue;const overlap=p.covers.length-fresh,s=fresh*10-overlap*4+(p.n%1000)/1000;if(s>score){score=s;best=p;}}if(!best)break;chosen.push(best);for(const p of best.covers){claimed.add(key(p.x,p.y));occupied.set(key(p.x,p.y),p);}candidates.splice(candidates.indexOf(best),1);}
  const member=cells.filter(p=>claimed.has(key(p.x,p.y)));if(!member.length)continue;
  for(const [i,p]of chosen.entries())pieces.push({id:id+'/shrub/'+i,kind:'ruin-grove-shrub-'+p.variant,x:p.cx/32,y:p.ground/32,width:p.width,variant:p.n%4,clusterId:id});
  const treeCandidates=member.map(p=>({...p,n:hash(domain+'/tree/'+p.x+'/'+p.y)})).sort((a,b)=>a.n-b.n||order(a,b)),trees=[];
  for(const p of treeCandidates){if(trees.length>=Math.min(3,Math.floor(member.length/6)))break;const x=p.x*32+16+(p.n%9-4),y=p.y*32+23+((p.n>>>8)%7-3);if(trees.some(q=>Math.hypot(q.x-x,q.y-y)<46))continue;const variant=(index+trees.length)%3,width=[72,46,74][variant];trees.push({x,y});pieces.push({id:id+'/tree/'+trees.length,kind:'ruin-grove-tree-'+variant,x:x/32,y:y/32,width,variant:p.n%4,clusterId:id});}
  clusters.push({id,nativeCells:cells.length,cells:member,shrubs:chosen.length,trees:trees.length});
 }
 const record=freezeWire({version:RUIN_GROVE_VERSION,scene:{left:ruin.left,top:ruin.top,width:ruin.width,height:ruin.height},originalCells:original.map(p=>({...p})),occupiedCells:[...occupied.values()].sort(order).map(p=>({...p})),removedCells:original.filter(p=>!occupied.has(key(p.x,p.y))).map(p=>({...p})),clusters:clusters.map(c=>({...c,cells:c.cells.map(p=>({...p}))})),pieces});
 return Object.freeze({record,apply(x,y,b){if(!native.has(key(x,y)))return b;return {...b,collision:occupied.has(key(x,y))?'2':'1',grovePilot:true};},presentation(cx,cy){return record.pieces.filter(p=>Math.floor(p.x/32)===cx&&Math.floor(p.y/26)===cy).map(({clusterId,...p})=>({...p,x:p.x-cx*32,y:p.y-cy*26,plannedRuinExterior:true}));}});
}
