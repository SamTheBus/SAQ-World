import {mergeObservedSummaryV2} from './navigation_summary_v2.js';
import {D9_RUNTIME_POLICY as B} from '../shared/content/world_runtime_policy_d9.js';
import {createPageTransaction,pageDigest} from './paged_world_store.js';
import {worldDocument} from './world_page_publication_d9.js';
import {copyWire,requireContract as check} from '../shared/contracts/wire.js';
import {floorDiv,signedAddress} from '../shared/contracts/world_address.js';
import {validateNavigationD9} from '../shared/contracts/world_navigation_d9.js';
const VERSION='world-map-knowledge-d9-v1';
const mapKey=(playerId,spaceInstanceId,level,x,y,sha256)=>pageDigest([VERSION,playerId,spaceInstanceId,level,x,y],sha256);
export const MAP_MAX_LEVEL_D9=B.mapOverviewLevels;
async function readValue(index,key,io){const ref=await index.get(key);if(!ref)return null;const doc=await io.readPage(ref.pageId);check(await pageDigest(doc,io.sha256)===ref.pageId&&doc.kind==='navigation','Navigation page commitment');return doc.payload;}
export async function prepareNavigationPagesD9({root,navigation,stagedPages=[]},{sha256,readPage}){
 validateNavigationD9(navigation);const staged=new Map(stagedPages.map(p=>[p.id,p.value])),io={sha256,readPage:async id=>staged.get(id)??readPage(id)},index=createPageTransaction({root,readPage:io.readPage,sha256}),documents=new Map(),rows=navigation.pending.slice(0,B.navigationFlushPages);
 async function put(key,value){const doc=worldDocument('navigation',value),id=await pageDigest(doc,sha256);staged.set(id,doc);documents.set(id,{id,value:doc});await index.set(key,{version:'world-page-ref-d9-v1',pageId:id});}
 for(const row of rows){
  const key=await mapKey(row.playerId,row.spaceInstanceId,0,row.chunkX,row.chunkY,sha256),old=await readValue(index,key,io),tiles=[...row.tiles].map((v,i)=>v==='?'?old?.tiles[i]??'?':v).join(''),markers=[...new Map([...(old?.markers??[]),...row.markers].map(m=>[m.id,m])).values()];
  await put(key,{version:VERSION,...copyWire(row),tiles,markers,level:0});
  // Sparse 8×8 summaries at each overview level contain only already observed
  // cells, never generator-derived coastlines, hidden sites or undiscovered floors.
  for(let level=1;level<=MAP_MAX_LEVEL_D9;level++){
   const size=1n<<BigInt(level),x=floorDiv(BigInt(row.chunkX),size),y=floorDiv(BigInt(row.chunkY),size),k=await mapKey(row.playerId,row.spaceInstanceId,level,String(x),String(y),sha256),prior=await readValue(index,k,io),cells=[...(prior?.tiles??'?'.repeat(64))];
   for(let py=0;py<26;py++)for(let px=0;px<32;px++){const color=row.tiles[py*32+px];if(color==='?')continue;const sx=Number(((BigInt(row.chunkX)-x*size)*32n+BigInt(px))*8n/(size*32n)),sy=Number(((BigInt(row.chunkY)-y*size)*26n+BigInt(py))*8n/(size*26n));cells[sy*8+sx]=color;}
   const summary=['planned-world-shoreline-v2','planned-world-water-v3'].includes(row.region?.version)?mergeObservedSummaryV2(prior,row,old?.tiles,Number(size),Number(BigInt(row.chunkX)-x*size),Number(BigInt(row.chunkY)-y*size)):null;
   await put(k,{...(summary??{}),version:VERSION,playerId:row.playerId,spaceInstanceId:row.spaceInstanceId,chunkX:String(x),chunkY:String(y),level,tiles:summary?.tiles??cells.join(''),markers:[],region:null});
  }
 }
 return {expectedRoot:root,root:index.root(),rows:copyWire(rows),pages:[...documents.values(),...index.pages()]};
}
export async function readNavigationWindowD9({root,playerId,spaceInstanceId,level,x,y,width,height,stagedPages=[]},{sha256,readPage}){
 signedAddress(x);signedAddress(y);check(Number.isInteger(level)&&level>=0&&level<=MAP_MAX_LEVEL_D9&&Number.isInteger(width)&&Number.isInteger(height)&&width>0&&height>0&&width*height<=B.mapViewportCells,'Map viewport admission');
 const staged=new Map(stagedPages.map(p=>[p.id,p.value])),io={sha256,readPage:async id=>staged.get(id)??readPage(id)},index=createPageTransaction({root,sha256,readPage:io.readPage}),pages=[];
 for(let dy=0;dy<height;dy++)for(let dx=0;dx<width;dx++){const cx=String(BigInt(x)+BigInt(dx)),cy=String(BigInt(y)+BigInt(dy)),page=await readValue(index,await mapKey(playerId,spaceInstanceId,level,cx,cy,sha256),io);if(page)pages.push(copyWire(page));}
 return {version:VERSION,root,level,pages};
}
