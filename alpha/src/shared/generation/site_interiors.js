import { SITE_RECIPE_VERSION, collidesWithTiles } from '../contracts/site_interiors.js';
import { BASELINE_PROGRESSION_POWER } from '../contracts/threat_power.js';
import { canonicalStringify, freezeWire, requireContract } from '../contracts/wire.js';
import { bytesToHex, hashBytes, frameUtf8, utf8 } from '../contracts/hashing.js';
import { deriveScopedStream, nextBoundedInteger } from '../contracts/rng.js';
import { createId } from '../contracts/identities.js';
import { ORDINARY_ENEMIES, resolveOrdinaryProfile } from '../content/ordinary_enemies.js';

// Dungeon carveRoom/connectRooms ideas; bounded World-owned recipe, no run state.
export async function generateSiteInterior(manifest,site,overworldCollision,sha256) {
  const stream=await deriveScopedStream(manifest.generation,{domain:'site-interior',keys:[{kind:'recipe',value:SITE_RECIPE_VERSION},{kind:'recipe',value:'site-'+site.locationId.slice(4)}]},{sha256});
  let rng=stream.initialState;const take=n=>{const result=nextBoundedInteger(rng,n);rng=result.state;return result.value;};
  const token=async key=>bytesToHex((await hashBytes(frameUtf8([SITE_RECIPE_VERSION,site.locationId,key]),sha256)).slice(0,16));
  const width=48,height=44,tiles=Array.from({length:height},()=>Array(width).fill('2'));
  const centers=[[9,34],[9,14],[29,11],[35,32]],rooms=centers.map(([cx,cy],i)=>{const w=9+take(3),h=9+take(3);return {roomId:'room:'+i,role:i?'encounter':'arrival',x:cx-Math.floor(w/2),y:cy-Math.floor(h/2),width:w,height:h};});
  for(const r of rooms)for(let y=r.y;y<r.y+r.height;y++)for(let x=r.x;x<r.x+r.width;x++)tiles[y][x]='1';
  for(let n=1;n<centers.length;n++){let [x,y]=centers[n-1];const [tx,ty]=centers[n];
    while(x!==tx){for(let d=-1;d<=1;d++)tiles[y+d][x]='1';x+=Math.sign(tx-x);}
    while(y!==ty){for(let d=-1;d<=1;d++)tiles[y][x+d]='1';y+=Math.sign(ty-y);}tiles[y][x]='1';
  }
  const floors=tiles.map(row=>[...row]);for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++)if(floors[y][x]==='2'&&[-1,0,1].some(dy=>[-1,0,1].some(dx=>floors[y+dy][x+dx]==='1')))tiles[y][x]='0';
  const collision={tileSize:32,width,height,tiles:tiles.map(row=>row.join(''))},entrance={x:centers[0][0]*32+16,y:centers[0][1]*32+16};
  // Compiler guarantees a walkable semantic entrance; keep exactly that anchor.
  requireContract(!collidesWithTiles(overworldCollision,site.position.x,site.position.y,10),'Blocked semantic return anchor');
  const groups=[];for(let i=1;i<4;i++){const members=[];for(let j=0;j<2;j++){const enemy=ORDINARY_ENEMIES[(i+j-1)%3],p=resolveOrdinaryProfile(enemy,site.siteTier);
    members.push({entityId:createId('entityId',await token('actor:'+i+':'+j)),enemyDefinitionId:enemy.enemyDefinitionId,profileId:p.contentDefinitionId,position:{x:centers[i][0]*32+16+j*32,y:centers[i][1]*32+16}});}
    groups.push({groupId:'site:'+site.locationId+':'+i,roomId:rooms[i].roomId,required:true,members});}
  const decorations=rooms.map(r=>({kind:'sconce',x:r.x+2,y:r.y-1})).filter(p=>tiles[p.y][p.x]==='0'&&tiles[p.y+1][p.x]==='1');
  const body={recipeVersion:SITE_RECIPE_VERSION,siteId:site.locationId,logicalSpaceId:createId('spaceId',await token('logical-space')),collision,entrance,returnAnchor:{...site.position},rooms,groups,decorations,progressionPower:BASELINE_PROGRESSION_POWER};
  return freezeWire({...body,contentHash:bytesToHex(await hashBytes(utf8(canonicalStringify(body)),sha256))});
}
