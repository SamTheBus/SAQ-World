import {freezeWire} from '../contracts/wire.js';
import {buildDefinedWorldCompoundD10} from './site_definition_runtime_d10.js';

export const WOODLAND_FORT_PACKAGE_ID='woodland-fort';
export const WOODLAND_FORT_VERSION='woodland-fort-d10-v5';
export const WOODLAND_FORT_CONTENT_HASH='db99ba0f0ba98874b641367fea38d0044d6e532135997adff3f838f70fd695fa';
export const WOODLAND_FORT_PACKAGE=freezeWire({packageId:WOODLAND_FORT_PACKAGE_ID,packageVersion:WOODLAND_FORT_VERSION,contentHash:WOODLAND_FORT_CONTENT_HASH,siteClass:'dungeon',capabilities:['interior'],biomes:['woodland'],minimumLevel:1,maximumLevel:null,repeatable:false,unique:true,reservedSiteId:null});

// The 48x36 daylight compound is stamped across four overworld pages. Only
// the small keep room is instanced; the gate and courtyard remain overworld.
const W=48,H=36,tiles=Array.from({length:H},()=>Array.from({length:W},()=> '1'));
const block=(x,y,width,height)=>{for(let yy=y;yy<y+height;yy++)for(let xx=x;xx<x+width;xx++)tiles[yy][xx]='0';};
const blockers=[
 {kind:'fort-wall',detail:'north-wall',x:8,y:3,width:32,height:2},{kind:'fort-wall',detail:'west-wall',x:4,y:7,width:2,height:22},{kind:'fort-wall',detail:'east-wall',x:42,y:7,width:2,height:22},
 {kind:'fort-wall',detail:'south-west-wall',x:8,y:31,width:14,height:2},{kind:'fort-wall',detail:'south-east-wall',x:26,y:31,width:14,height:2},
 {kind:'fort-tower-base',detail:'north-west-tower',x:3,y:2,width:5,height:5},{kind:'fort-tower-base',detail:'north-east-tower',x:40,y:2,width:5,height:5},
 {kind:'fort-tower-base',detail:'south-west-tower',x:3,y:29,width:5,height:5},{kind:'fort-tower-base',detail:'south-east-tower',x:40,y:29,width:5,height:5},
 {kind:'fort-gatehouse-base',detail:'west-gatehouse',x:17,y:29,width:5,height:4},{kind:'fort-gatehouse-base',detail:'east-gatehouse',x:26,y:29,width:5,height:4},
 {kind:'fort-keep-base',detail:'keep',x:16,y:6,width:16,height:8},
 {kind:'fort-prop-solid',detail:'field-tent',x:8,y:16,width:5,height:3},{kind:'fort-prop-solid',detail:'lean-to',x:35,y:8,width:5,height:3},
 {kind:'fort-prop-solid',detail:'supply-cart',x:35,y:24,width:3,height:2},{kind:'fort-prop-solid',detail:'well',x:31,y:15,width:2,height:2},
 {kind:'thicket',detail:'fort-edge',x:0,y:3,width:2,height:3},{kind:'thicket',detail:'fort-edge',x:1,y:12,width:2,height:3},{kind:'thicket',detail:'fort-edge',x:0,y:25,width:2,height:3},
 {kind:'thicket',detail:'fort-edge',x:2,y:34,width:3,height:2},{kind:'thicket',detail:'fort-edge',x:45,y:5,width:2,height:3},{kind:'thicket',detail:'fort-edge',x:46,y:12,width:2,height:3},
 {kind:'thicket',detail:'fort-edge',x:45,y:23,width:3,height:3},{kind:'thicket',detail:'fort-edge',x:44,y:33,width:3,height:3},{kind:'thicket',detail:'fort-edge',x:10,y:0,width:3,height:2},
 {kind:'thicket',detail:'fort-edge',x:15,y:1,width:2,height:2},{kind:'thicket',detail:'fort-edge',x:33,y:0,width:3,height:2},{kind:'thicket',detail:'fort-edge',x:38,y:1,width:2,height:2}
];
for(const b of blockers)block(b.x,b.y,b.width,b.height);
// Four tiles remain continuously walkable from the connected road, through
// the open gate, and up to the keep door.
for(let y=29;y<H;y++)for(let x=22;x<=25;x++)tiles[y][x]='1';
const collision={tileSize:32,width:W,height:H,tiles:tiles.map(row=>row.join(''))};
const terrain=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>{
 // One joined packed-earth court: narrower at the keep and gate, broader
 // through the organized working yard. Grass only breaks into its perimeter.
 const left=y<=15?16:y<=20?10:y<=26?7:11,right=y<=15?31:y<=20?38:y<=26?40:36;
 const courtyard=y>=14&&y<=29&&x>=left&&x<=right;
 const edgeGrass=courtyard&&((y===14&&(x<19||x>28))||(y===16&&(x===10||x===38))||(y===21&&(x===7||x===40))||(y===26&&(x<10||x>37))||(y===29&&(x<14||x>33)));
 if(x>=22&&x<=25&&y>=13)return 'p';
 if(y===18&&x>=8&&x<=39)return 'p';
 if(courtyard&&!edgeGrass)return 'r';
 return 'g';
}));
const decorations=[
 {kind:'fort-keep-facade',x:24,y:10,width:16,height:8},{kind:'fort-gatehouse',x:24,y:31,width:15,height:5},
 {kind:'fort-watchtower',x:5.5,y:4.5,variant:0},{kind:'fort-watchtower',x:42.5,y:4.5,variant:1},{kind:'fort-watchtower',x:5.5,y:31.5,variant:2},{kind:'fort-watchtower',x:42.5,y:31.5,variant:3},
 // Keep approach: paired banners and ordered stores frame the chest and door.
 {kind:'fort-banner',x:18.5,y:13.2,variant:0},{kind:'fort-banner',x:29.5,y:13.2,variant:1},{kind:'fort-crates',x:18.5,y:15.2,variant:0},{kind:'fort-barrels',x:29.5,y:15.2,variant:0},
 // Open gate: standards sit on the inner gatehouse faces, clear of the road.
 {kind:'fort-banner',x:20.5,y:29.4,variant:1},{kind:'fort-banner',x:27.5,y:29.4,variant:0},
 // Camp and mess yard at west, training yard at southwest.
 {kind:'fort-tent',x:10.5,y:17.5,variant:0},{kind:'fort-fire',x:15.5,y:20.5,variant:0},{kind:'fort-table',x:14.5,y:18.2,variant:0},
 {kind:'fort-weapon-rack',x:9.5,y:22.2,variant:1},{kind:'fort-training-target',x:11.5,y:25,variant:0},{kind:'fort-training-target',x:16,y:25.5,variant:1},{kind:'fort-supplies',x:8.5,y:27.2,variant:1},
 // Supply and defensive storage at east, grouped against the wall.
 {kind:'fort-lean-to',x:37.5,y:9.5,variant:1},{kind:'fort-weapon-rack',x:37,y:16.2,variant:0},{kind:'fort-crates',x:35.2,y:20.2,variant:0},{kind:'fort-barrels',x:38,y:20.5,variant:0},
 {kind:'fort-supplies',x:36.5,y:22.8,variant:0},{kind:'fort-cart',x:36.5,y:25,variant:0},{kind:'fort-well',x:32,y:16,variant:0},
 // Woodland growth is confined to walls and court edges.
 {kind:'fort-shrub',x:7,y:8,variant:0},{kind:'fort-shrub',x:40,y:12,variant:1},{kind:'fort-shrub',x:7.2,y:20.5,variant:2},{kind:'fort-shrub',x:40.5,y:25.5,variant:3},
 {kind:'fort-vines',x:16.4,y:8,variant:0},{kind:'fort-vines',x:31.4,y:9,variant:1},{kind:'fort-roots',x:7.2,y:28,variant:0},{kind:'fort-moss',x:37,y:4.5,variant:0}
];
const visual={originTile:{x:0,y:0},terrain:terrain.map(row=>row.join('')),biomes:tiles.map(row=>row.map(()=> 'w').join('')),blockers,decorations};
export const WOODLAND_FORT_TEMPLATE=freezeWire({
 version:WOODLAND_FORT_VERSION,label:'Woodland Fort',siteKind:'woodland-fort',placement:'overworld-compound',
 collision,entrance:{x:752,y:1136},keepDoor:{x:784,y:464},
 keep:{collision:{tileSize:32,width:14,height:12,tiles:Array.from({length:12},(_,y)=>Array.from({length:14},(_,x)=>x===0||y===0||x===13||y===11||x>=5&&x<=8&&y>=4&&y<=5||x>=10&&x<=11&&y>=7&&y<=8?'0':'1').join(''))},entrance:{x:224,y:304},visual:{originTile:{x:0,y:0},terrain:Array.from({length:12},(_,y)=>Array.from({length:14},(_,x)=>x===0||y===0||x===13||y===11||x>=5&&x<=8&&y>=4&&y<=5||x>=10&&x<=11&&y>=7&&y<=8?'0':'1').join('')),blockers:[{kind:'fort-interior-table',x:5,y:4,width:4,height:2},{kind:'fort-interior-storage',x:10,y:7,width:2,height:2}],decorations:[
  {kind:'fort-rug',x:5,y:7,width:4,height:2},{kind:'fort-table',x:6.5,y:4.8,variant:1},{kind:'fort-storage',x:10.5,y:7.8,variant:0},
  {kind:'fort-weapon-rack',x:2,y:3,variant:0},{kind:'fort-weapon-rack',x:11.5,y:3,variant:1},{kind:'fort-banner',x:1.4,y:4,variant:0},{kind:'fort-banner',x:12.6,y:4,variant:1},
  {kind:'sconce',x:3,y:1},{kind:'sconce',x:10,y:1},{kind:'sconce',x:1,y:8},{kind:'sconce',x:12,y:8},{kind:'fort-bench',x:3,y:8.5,variant:0},{kind:'fort-map',x:7,y:1.4,variant:0}
 ]}},
 rooms:[{roomId:'gate',role:'arrival',x:22,y:31,width:4,height:3},{roomId:'courtyard',role:'encounter',x:9,y:16,width:30,height:14},{roomId:'keep-approach',role:'reward',x:17,y:14,width:14,height:5}],
 decorations:[],visual,
 encounter:{rank:'C',members:[{family:'sprout',x:544,y:720},{family:'slime',x:1072,y:656},{family:'sprout',x:784,y:848}]},
 reward:{kind:'chest',art:'chest',position:{x:688,y:528}}
});
export const WOODLAND_FORT_DEFINITION=freezeWire({package:WOODLAND_FORT_PACKAGE,template:WOODLAND_FORT_TEMPLATE,groupSuffix:'fort-courtyard'});
export const buildWoodlandFortD10=(state,parcel,binding,options)=>buildDefinedWorldCompoundD10(state,parcel,binding,WOODLAND_FORT_DEFINITION,options);
