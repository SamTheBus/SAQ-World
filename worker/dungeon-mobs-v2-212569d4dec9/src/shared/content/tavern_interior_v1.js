// Civilian fitted-space recipe. No campaign, encounter or reward assumptions.
const freeze=o=>{for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return Object.freeze(o);};
const f=(id,type,x,y,w=1,h=1)=>({id,type,x,y,w,h});
export const TAVERN_INTERIOR_V1=freeze({version:'tavern-fitted-v1',width:14,height:12,tileSize:32,usable:[12,10],
 floors:[{id:'ground',walls:[],furniture:[
 f('hearth','hearth',1,1,1,2),f('table-west','table',3,2,2,2),f('table-east','table',6,2,2,2),
 f('bench-west','bench',3,1,2,1),f('bench-east','bench',6,1,2,1),f('seat-west','chair',3,4),f('seat-east','chair',7,4),
 f('counter','counter',9,1,1,4),f('oven','oven',11,1,2,1),f('kitchen','worktop',12,3,1,2),f('pantry','cupboard',11,5,2,1),
 f('table-small','table',3,6,2,1),f('seat-small','chair',3,7),f('rack','rack',1,10,2,1)],
 stairs:{x:10,y:8,w:2,h:2},arrival:{x:112,y:288},exitAnchor:{x:48,y:272},stairAnchor:{x:352,y:272},stairArrival:{x:272,y:272},
 destinations:[{id:'common-room',x:208,y:208},{id:'counter-front',x:272,y:112},{id:'kitchen',x:352,y:112}]},
 {id:'upper',walls:[...Array.from({length:10},(_,i)=>i+1).filter(y=>![3,4,8,9].includes(y)).flatMap(y=>[{x:5,y},{x:8,y}]),...Array.from({length:5},(_,i)=>({x:i+1,y:6})),...Array.from({length:5},(_,i)=>({x:i+8,y:6}))],
 furniture:[f('bed-nw','bed',1,1,2,1),f('wardrobe-nw','cupboard',1,4),f('desk-nw','desk',3,1),
 f('bed-ne','bed',10,1,2,1),f('wardrobe-ne','cupboard',12,4),f('desk-ne','desk',9,1),
 f('bed-sw','bed',1,9,2,1),f('wardrobe-sw','cupboard',4,10),f('desk-sw','desk',1,7),
 f('bed-se','bed',10,9,2,1),f('wardrobe-se','cupboard',12,7),f('desk-se','desk',9,10)],
 stairs:{x:6,y:9,w:2,h:2},arrival:{x:224,y:240},stairAnchor:{x:224,y:304},
 destinations:[{id:'guest-room-1',x:112,y:112},{id:'guest-room-2',x:336,y:112},{id:'guest-room-3',x:112,y:256},{id:'guest-room-4',x:336,y:256}]}]});
export function tavernFloor(id){const f=TAVERN_INTERIOR_V1.floors.find(f=>f.id===id);if(!f)throw new TypeError('Unknown tavern floor');return f;}
const collisions=new Map();
export function tavernCollision(id){if(collisions.has(id))return collisions.get(id);const f=tavernFloor(id),r=TAVERN_INTERIOR_V1,c=freeze({width:r.width,height:r.height,tileSize:r.tileSize,tiles:Array.from({length:r.height},(_,y)=>Array.from({length:r.width},(_,x)=>x===0||y===0||x===r.width-1||y===r.height-1||f.walls.some(p=>p.x===x&&p.y===y)||f.furniture.some(p=>x>=p.x&&y>=p.y&&x<p.x+p.w&&y<p.y+p.h)?'2':'1').join(''))});collisions.set(id,c);return c;}
