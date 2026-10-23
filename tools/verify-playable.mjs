import {promises as fs} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const dist=path.resolve('dist');
const bytes=async p=>fs.readFile(path.join(dist,p));
const read=async p=>(await bytes(p)).toString('utf8');
const manifest=JSON.parse(await read('runtime-manifest.json'));
const digest=createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');
if(manifest.runtimeSha256!==digest||manifest.runtimeId!==digest.slice(0,16))throw Error('Invalid runtime manifest fingerprint');
const actual=[];
async function walk(dir){
  for(const f of await fs.readdir(dir,{withFileTypes:true})){
    const p=path.join(dir,f.name);
    if(f.isDirectory())await walk(p);
    else if(f.isFile())actual.push(path.relative(dist,p).replaceAll(path.sep,'/'));
  }
}
await walk(dist);
actual.sort();
const expected=['runtime-manifest.json',...manifest.files.map(x=>x.path)].sort();
if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('Runtime file inventory mismatch');
for(const item of manifest.files){
  const file=await bytes(item.path);
  const hash=createHash('sha256').update(file).digest('hex');
  if(item.bytes!==file.length||hash!==item.sha256)throw Error('Runtime integrity mismatch: '+item.path);
}
const html=await read('index.html');
for(const required of ['src/entrypoints/browser_boot.js','src/client/startup_loading_v1.js','src/client/startup_combat_preview_v1.js','save-worker.js','world.css','runtime-manifest.json']){
  if(!html.includes(required))throw Error('HTML missing required runtime reference: '+required);
  await bytes(required);
}
if(html.includes('<script type="importmap">'))throw Error('Source importmap must not be deployed');
if(actual.some(p=>p.startsWith('tools/')||p.startsWith('.github/')||p.startsWith('src/dev/')||p.startsWith('src/shared/')||p.startsWith('src/host/')||p.startsWith('src/simulation/')||p.startsWith('src/storage/')))throw Error('Developer source leaked into playable package');
for(const p of actual.filter(p=>p.endsWith('.js'))){
  const content=await read(p);
  if(p==='save-worker.js'&&/\bimport\s*(?:["'{*]|[\w\d]+)\s+/.test(content))throw Error('Worker bundle contains raw module import: '+p);
  if(/from\s+["']\.{1,2}\/.*src\//.test(content))throw Error('Source path leaked into module: '+p);
}
if(actual.length>50)throw Error('Compact game contains '+actual.length+' files; limit is 50');
console.log('Playable package verified: '+actual.length+' files, '+manifest.files.reduce((n,x)=>n+x.bytes,0)+' bytes; no developer source included');
