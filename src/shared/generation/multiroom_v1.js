import {MULTIROOM_VERSION as V,MULTIROOM_POLICY as P} from '../content/multiroom_policy_v1.js';
import {freezeWire,requireContract as check} from '../contracts/wire.js';
const hash=s=>{let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;return n;};
const key=p=>p.x+','+p.y,dirs=[[0,-1],[1,0],[0,1],[-1,0]],point=p=>({x:p.x*32+16,y:p.y*32+16});
function rng(s){let n=hash(s);return max=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n%max;};}
function distances(nodes,edges,start){const d=new Map([[start,0]]),q=[start];for(let i=0;i<q.length;i++)for(const e of edges){const n=e.a===q[i]?e.b:e.b===q[i]?e.a:null;if(n!==null&&!d.has(n)){d.set(n,d.get(q[i])+1);q.push(n);}}return d;}
export function tileDistances(collision,origin){const w=collision.width,h=collision.height,d=new Int32Array(w*h).fill(-1),q=[Math.floor(origin.y/32)*w+Math.floor(origin.x/32)];d[q[0]]=0;for(let i=0;i<q.length;i++){const k=q[i],x=k%w,y=Math.floor(k/w);for(const [dx,dy]of dirs){const xx=x+dx,yy=y+dy,n=yy*w+xx;if(xx>0&&xx<w-1&&yy>0&&yy<h-1&&d[n]<0&&collision.tiles[yy][xx]==='1'){d[n]=d[k]+1;q.push(n);}}}return d;}
const roleFor=(family,i)=>({cave:['branching-caverns','rift-passages','deep-grotto','buried-sanctum'],fort:['gate-halls','barracks-halls','tower-cellars','buried-citadel'],ruin:['broken-courtyard','fractured-galleries','buried-wing','sunken-sanctuary'],crypt:['burial-chambers','family-vaults','catacomb-loops','royal-tomb']}[family][i]);

// Bounded lattice supplies noncrossing adjacency, not the final silhouette.
// Seeded graph growth, room dimensions, coherent chamber contours, corridors,
// orientation and loop selection are independently domain separated.
function buildRecipe(seed,family,tier,index){
 check(['cave','fort','ruin','crypt'].includes(family)&&P.floors[tier]&&index>=0&&index<P.floors[tier],'Unknown multiroom input');
 for(let attempt=0;attempt<P.maximumAttempts;attempt++){
  const roll=rng(V+'/'+seed+'/'+family+'/'+tier+'/'+index+'/'+attempt),range=P.rooms[tier],count=range[0]+roll(range[1]-range[0]+1),nodes=[{x:roll(4),y:roll(2)}],edges=[];
  while(nodes.length<count){const frontier=[];for(let a=0;a<nodes.length;a++)for(const [dx,dy]of dirs){const p={x:nodes[a].x+dx,y:nodes[a].y+dy};if(p.x>=0&&p.x<4&&p.y>=0&&p.y<2&&!nodes.some(n=>key(n)===key(p)))frontier.push({a,p});}const next=frontier[roll(frontier.length)];edges.push({a:next.a,b:nodes.length,kind:'corridor'});nodes.push(next.p);}
  let start=roll(count),end=0,best=-1;for(let a=0;a<count;a++){const d=distances(nodes,edges,a);for(let b=0;b<count;b++)if(d.get(b)>best){best=d.get(b);start=a;end=b;}}
  if(best<3||best===count-1)continue;
  if(roll(2)){const t=start;start=end;end=t;}
  // One optional loop where it cannot bypass the exploration depth or consume
  // the final optional branch. Small keeps a readable branched four/five-room tree.
  if(tier!=='small'&&roll(2)){
   const options=[];for(let a=0;a<count;a++)for(let b=a+1;b<count;b++)if(Math.abs(nodes[a].x-nodes[b].x)+Math.abs(nodes[a].y-nodes[b].y)===1&&!edges.some(e=>e.a===a&&e.b===b||e.a===b&&e.b===a))options.push({a,b,kind:'loop'});
   for(const e of options){const trial=[...edges,e],d=distances(nodes,trial,start),back=distances(nodes,trial,end),depth=d.get(end);if(depth>=3&&nodes.some((_,i)=>d.get(i)+back.get(i)>depth)){edges.push(e);break;}}
  }
  const roomDepth=distances(nodes,edges,start),back=distances(nodes,edges,end),depth=roomDepth.get(end),optional=nodes.map((_,i)=>i).filter(i=>roomDepth.get(i)+back.get(i)>depth);if(!optional.length)continue;
  const mirrorX=roll(2),mirrorY=roll(2),turn=roll(2),rooms=nodes.map((n,i)=>{const x=mirrorX?3-n.x:n.x,y=mirrorY?1-n.y:n.y,px=10+x*19+roll(3)-1,py=11+y*20+roll(3)-1,cx=turn?py:px,cy=turn?px:py,rx=i===end?9:5+roll(2),ry=i===end?8:5+roll(3),id=family==='cave'?'floor-'+index+'-room-'+i:family+'-room:'+index+':'+i;return {roomId:id,role:i===start?'arrival':i===end?'final-reward':optional.includes(i)?'optional-branch':'exploration',architecture:family==='fort'?['hall','barracks','tower','store-room'][roll(4)]:family==='crypt'?['burial-chamber','vault','ossuary','memorial'][roll(4)]:family==='ruin'?['broken-chamber','courtyard','cloister','buried-room'][roll(4)]:['cavern','grotto','rift-chamber'][roll(3)],cx,cy,rx,ry,bounds:{x:cx-rx,y:cy-ry,width:rx*2+1,height:ry*2+1}};});
  const w=turn?44:80,h=turn?80:44,cells=Array.from({length:h},()=>Array(w).fill('0')),put=(x,y)=>{if(x>0&&x<w-1&&y>0&&y<h-1)cells[y][x]='1';},stamp=(x,y,r=2)=>{for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)put(x+dx,y+dy);};
  for(const r of rooms){for(let y=r.cy-r.ry;y<=r.cy+r.ry;y++)for(let x=r.cx-r.rx;x<=r.cx+r.rx;x++){
   const dx=x-r.cx,dy=y-r.cy;let open=true;
   if(family==='cave'){const wobble=.08*Math.sin((dy+r.cx)*.55)+.08*Math.cos((dx-r.cy)*.45);open=(dx/r.rx)**2+(dy/r.ry)**2<=1+wobble||Math.abs(dx)<=3&&Math.abs(dy)<=3;}
   else if(family==='fort'&&r.architecture==='tower')open=Math.abs(dx)+Math.abs(dy)<=r.rx+r.ry-4;
   else if(family==='ruin')open=!(Math.abs(dx)>r.rx-2&&Math.abs(dy)>r.ry-2);
   else if(family==='crypt')open=!(Math.abs(dx)>r.rx-1&&Math.abs(dy)>r.ry-1);
   if(open)put(x,y);
  }}
  const corridors=[];
  for(const e of edges){const a=rooms[e.a],b=rooms[e.b],horizontal=Math.abs(a.cx-b.cx)>Math.abs(a.cy-b.cy),bend=horizontal?{x:Math.floor((a.cx+b.cx)/2),y:a.cy}:{x:a.cx,y:Math.floor((a.cy+b.cy)/2)},path=[{x:a.cx,y:a.cy},bend,horizontal?{x:bend.x,y:b.cy}:{x:b.cx,y:bend.y},{x:b.cx,y:b.cy}];for(let i=1;i<path.length;i++){const aa=path[i-1],bb=path[i],dx=Math.sign(bb.x-aa.x),dy=Math.sign(bb.y-aa.y);for(let x=aa.x,y=aa.y;;x+=dx,y+=dy){stamp(x,y);if(x===bb.x&&y===bb.y)break;}}corridors.push({from:a.roomId,to:b.roomId,kind:e.kind,widthTiles:5,path});}
  const blockers=[],furniture=[];for(const r of rooms){if(r.roomId===rooms[start].roomId||r.roomId===rooms[end].roomId)continue;if(family==='fort'&&r.architecture==='barracks'){const x=r.cx-r.rx+2,y=r.cy-r.ry+2;for(let yy=y;yy<y+2;yy++)for(let xx=x;xx<x+2;xx++)cells[yy][xx]='0';blockers.push({kind:'fort-interior-storage',x,y,width:2,height:2});furniture.push({kind:'fort-storage',x:x+1,y:y+1,width:2,height:2,variant:0});}}
  const collision={tileSize:32,width:w,height:h,tiles:cells.map(r=>r.join(''))},arrival=point({x:rooms[start].cx,y:rooms[start].cy}),d=tileDistances(collision,arrival),last=rooms[end],candidate=[];
  for(let y=last.cy-3;y<=last.cy+3;y++)for(let x=last.cx-4;x<=last.cx+4;x++)if(cells[y]?.[x]==='1')candidate.push({x,y,d:d[y*w+x]});
  candidate.sort((a,b)=>b.d-a.d||hash(seed+'/'+index+'/'+a.x+'/'+a.y)-hash(seed+'/'+index+'/'+b.x+'/'+b.y));const stair=candidate[roll(Math.min(8,candidate.length))];if(stair.d<P.minimumStairRouteTiles)continue;
  const down=point(stair),reward=point({x:last.cx+(stair.x>=last.cx?-4:4),y:last.cy+3}),combatRooms=[end,...rooms.map((_,i)=>i).filter(i=>i!==start&&i!==end&&!optional.includes(i)).sort((a,b)=>roomDepth.get(b)-roomDepth.get(a))].slice(0,3),families=family==='cave'?['rust_nibbler','gargoyle','cursed_blade']:family==='fort'?index>=2?['golem','rust_nibbler','gargoyle']:['animated_armor','gargoyle','animated_armor']:['cursed_blade','gargoyle','rust_nibbler'];
  const roster=family==='ruin'?(tier==='small'?['gargoyle','cursed_blade']:tier==='standard'?index===0?['gargoyle','cursed_blade','gargoyle']:['cursed_blade','gargoyle','rust_nibbler']:tier==='large'?['gargoyle','cursed_blade','rust_nibbler','gargoyle']:['cursed_blade','gargoyle','rust_nibbler','gargoyle','cursed_blade']):family==='crypt'?['cursed_blade','gargoyle','rust_nibbler','gargoyle'].slice(0,tier==='small'?3:4):families;
  const encounter={rank:'C',members:roster.map((enemy,i)=>{const ri=combatRooms[i%combatRooms.length],extra=i>=combatRooms.length;return {memberKey:family+':multiroom:'+index+':'+i,family:enemy,roomId:rooms[ri].roomId,position:point({x:rooms[ri].cx+(extra?2:i===0?-2:0),y:rooms[ri].cy+(extra?2:-2)}),...(family==='fort'?{eliteAffixId:i===0&&index===1?'swift_commander':i===0&&index===2?'slag_shaper':i===0&&index===3?'iron_citadel':null}:{})};})};
  const decorations=[...furniture];for(const r of rooms){if(family==='fort')decorations.push({kind:'fort-rug',x:r.cx-2,y:r.cy-1,width:4,height:2},{kind:'fort-banner',x:r.cx,y:r.cy-r.ry+1,variant:index%2});else if(family!=='cave')decorations.push({kind:'ruin-moss-patch',x:r.cx-2,y:r.cy+2,variant:roll(3)},{kind:'ruin-rubble-flat',x:r.cx-r.rx+2,y:r.cy+r.ry-2,variant:roll(3)});decorations.push({kind:'sconce',x:r.cx,y:r.cy-r.ry+1});}
  const arrivalFacing=roll(4),onwardFacing=roll(4);if(family==='cave'){if(index>0)decorations.push({kind:'cave-stairs-up',x:arrival.x/32,y:arrival.y/32,facing:arrivalFacing});if(index+1<P.floors[tier])decorations.push({kind:'cave-stairs-down',x:down.x/32,y:down.y/32,facing:onwardFacing});for(const ri of optional)decorations.push({kind:'cave-glow-mushrooms',x:rooms[ri].cx-3,y:rooms[ri].cy+2,variant:roll(3)});}
  const graph={version:V,rooms,edges:corridors.map(e=>({...e,walkable:true})),topology:{form:'branched-'+family,startNodeId:rooms[start].roomId,endNodeId:last.roomId},navigation:{attempt,arrivalFacing,onwardFacing,arrivalRoomId:rooms[start].roomId,onwardRoomId:last.roomId,optionalRoomIds:optional.map(i=>rooms[i].roomId),minimumRoomEdges:depth,onwardRouteTiles:stair.d,loopCount:edges.filter(e=>e.kind==='loop').length}};
  return freezeWire({version:V,role:roleFor(family,index),collision,visual:{...(family==='cave'?{version:'woodland-cave-generated-d12-2-v1',character:'branching-caverns',motifs:rooms.map(r=>({kind:'earth-patch',x:r.cx,y:r.cy,scale:1,rotation:0}))}:family==='fort'?{}:{version:'woodland-ruin-presentation-d11.3-planned-v1'}),originTile:{x:0,y:0},terrain:[...collision.tiles],blockers,decorations},entrance:arrival,stairAnchors:{up:{...arrival},down},graph,encounter,reward:{kind:'chest',art:'chest',position:reward}});
 }
 throw new TypeError('MULTIROOM_BOUNDED_GENERATION_EXHAUSTED:'+family+'/'+tier+'/'+index);
}

const recipeCache=new Map();
export function multiroomRecipe(seed,family,tier,index){const k=seed+'/'+family+'/'+tier+'/'+index;if(!recipeCache.has(k)){const r=buildRecipe(seed,family,tier,index);if(recipeCache.size>=128)recipeCache.delete(recipeCache.keys().next().value);recipeCache.set(k,r);}return recipeCache.get(k);}
