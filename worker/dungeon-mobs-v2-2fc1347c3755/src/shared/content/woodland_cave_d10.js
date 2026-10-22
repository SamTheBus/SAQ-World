import {freezeWire} from '../contracts/wire.js';
import {buildDefinedFunctionalSiteD10} from './site_definition_runtime_d10.js';

export const WOODLAND_CAVE_PACKAGE_ID='woodland-cave';
export const WOODLAND_CAVE_VERSION='woodland-cave-d10-2-v1';
export const WOODLAND_CAVE_CONTENT_HASH='a01314559a5a07e22ba47688b59047f5274314c3ad5188c0fd9e67cd4baaf16b';
export const WOODLAND_CAVE_PACKAGE=freezeWire({packageId:WOODLAND_CAVE_PACKAGE_ID,packageVersion:WOODLAND_CAVE_VERSION,contentHash:WOODLAND_CAVE_CONTENT_HASH,siteClass:'dungeon',capabilities:['interior'],biomes:['woodland'],minimumLevel:1,maximumLevel:null,repeatable:false,unique:true,reservedSiteId:null});

const W=28,H=20,tiles=Array.from({length:H},()=>Array(W).fill('0'));
const zones=[
 [[9,3],[14,3],[17,5],[19,7],[18,9],[19,11],[17,13],[15,15],[11,14],[8,15],[6,13],[4,12],[3,9],[5,7],[6,5]],
 [[13,18.9],[16,18.9],[16,17.2],[15.3,16.1],[17,14.3],[15.5,13.2],[13,14],[12,15.6],[13,17]],
 [[16.5,6.8],[21.7,6.5],[22.1,9.7],[17.2,10.2]],
 [[22,3.8],[25,4.2],[27,6],[26.5,9.5],[24.7,11],[21.2,10.3],[20.4,8],[21,5.5]]
];
const inside=(x,y,p)=>{let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>y)!==(p[j][1]>y)&&x<(p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0])yes=!yes;return yes;};
for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(zones.some(p=>inside(x+.5,y+.5,p)))tiles[y][x]='1';
// Two solid rock columns break the main chamber silhouette without splitting it.
tiles[9][8]='0';tiles[6][16]='0';
const rows=tiles.map(r=>r.join(''));
const decorations=[
 {kind:'cave-light-shaft',x:14.5,y:17.4,variant:0},
 {kind:'cave-glow-mushrooms',x:6.4,y:11.5,variant:0},{kind:'cave-glow-mushrooms',x:15.7,y:5.4,variant:1},{kind:'cave-glow-mushrooms',x:25.0,y:9.2,variant:2},
 {kind:'cave-stalagmites',x:5.7,y:8.0,variant:0},{kind:'cave-stalagmites',x:16.2,y:12.0,variant:1},{kind:'cave-stalactites',x:11.8,y:4.0,variant:0},
 {kind:'cave-rubble',x:9.5,y:13.0,variant:0},{kind:'cave-wall-roots',x:18.35,y:10.7,variant:0},{kind:'cave-remains',x:20.8,y:8.8,variant:0},
 {kind:'cave-mineral-deposit',x:8.25,y:9.15,variant:0},{kind:'cave-reward-nook',x:23.5,y:7.25,variant:0}
];
export const WOODLAND_CAVE_EXTERIOR=freezeWire({width:12,height:9,entranceTile:{x:5,y:3},collision:[
 '000000000000','000000000000','000000000000','000001100000','000001100000','011111111110','111111111111','111111111111','111111111111'
],terrain:['rrrrrrrrrrrr','rrrrrrrrrrrr','rrrrrpprrrrr','rrrrpppprrrr','ggrrpppprrgg','gggrpppprggg','gggrrppprggg','ggggrpppgggg','gggggppggggg'],blockers:[
 {kind:'cave-rock-wall',detail:'back-cliff',x:0,y:0,width:12,height:2},{kind:'cave-rock-wall',detail:'mouth-backstop',x:5,y:2,width:2,height:1},{kind:'cave-rock-wall',detail:'left-mouth',x:0,y:2,width:5,height:2},{kind:'cave-rock-wall',detail:'right-mouth',x:7,y:2,width:5,height:2},
 {kind:'cave-rock-wall',detail:'left-shoulder',x:0,y:4,width:5,height:1},{kind:'cave-rock-wall',detail:'right-shoulder-log',x:7,y:4,width:5,height:1},{kind:'cave-rock-wall',detail:'left-edge',x:0,y:5,width:1,height:1},{kind:'cave-rock-wall',detail:'right-edge',x:11,y:5,width:1,height:1}
],decorations:[{kind:'cave-mouth',x:5.5,y:3.55,variant:0},{kind:'cave-shrub',x:1.35,y:6.35,variant:0},{kind:'cave-shrub',x:10.35,y:6.05,variant:1},{kind:'cave-roots-exterior',x:8.55,y:3.7,variant:0},{kind:'cave-vines-exterior',x:2.25,y:3.15,variant:0},{kind:'cave-grass-tuft',x:3.45,y:6.5,variant:0},{kind:'cave-grass-tuft',x:8.25,y:6.85,variant:1},{kind:'cave-trail-stones',x:5.9,y:6.55,variant:0}]});

export const WOODLAND_CAVE_TEMPLATE=freezeWire({
 version:WOODLAND_CAVE_VERSION,label:'Woodland Cave',siteKind:'woodland-cave',
 collision:{tileSize:32,width:W,height:H,tiles:[...rows]},entrance:{x:464,y:592},
 rooms:[{roomId:'entrance-passage',role:'arrival',x:12,y:13,width:6,height:6},{roomId:'main-cavern',role:'encounter',x:3,y:3,width:17,height:13},{roomId:'reward-pocket',role:'reward',x:20,y:4,width:7,height:8}],
 decorations:decorations.map(d=>({...d})),visual:{originTile:{x:0,y:0},terrain:[...rows],blockers:[],decorations:decorations.map(d=>({...d}))},
 encounter:{rank:'C',members:[{family:'golem',x:352,y:288},{family:'slime',x:496,y:288},{family:'sprout',x:416,y:384}]},
 reward:{kind:'chest',art:'chest',position:{x:752,y:256}}
});
export const WOODLAND_CAVE_DEFINITION=freezeWire({package:WOODLAND_CAVE_PACKAGE,template:WOODLAND_CAVE_TEMPLATE,groupSuffix:'hollow-depths'});
export const buildWoodlandCaveD10=(state,site,binding,options)=>buildDefinedFunctionalSiteD10(state,site,binding,WOODLAND_CAVE_DEFINITION,options);
