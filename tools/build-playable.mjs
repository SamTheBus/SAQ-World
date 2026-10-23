import * as esbuild from 'esbuild';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const root=process.cwd();
const dist=path.join(root,'dist');
const at=(...p)=>path.join(root,...p);
await fs.rm(dist,{recursive:true,force:true});
await fs.mkdir(dist,{recursive:true});
const alteredSource=path.normalize('src/entrypoints/playable_browser.js');
let workerConstructorCount=0;
const result=await esbuild.build({
  absWorkingDir:root,
  entryPoints:['src/entrypoints/browser_boot.js'],
  outbase:root,
  outdir:dist,
  entryNames:'[dir]/[name]',
  chunkNames:'src/chunks/[name]-[hash]',
  bundle:true,
  splitting:true,
  platform:'browser',
  format:'esm',
  target:['es2022'],
  legalComments:'none',
  metafile:true,
  plugins:[{
    name:'production-module-workers',
    setup(build){
      build.onLoad({filter:/[\\/]src[\\/]entrypoints[\\/]playable_browser\.js$/},async args=>{
        const original=await fs.readFile(args.path,'utf8');
        const needle='new environment.Worker(workerUrl)';
        const count=original.split(needle).length-1;
        workerConstructorCount+=count;
        if(count!==2)throw Error('Expected two save/world worker constructors, found '+count);
        const patched=original.replaceAll(needle,'new environment.Worker(workerUrl,{type:"module"})').replace('const failure=classifyLocalLaunchError(error);','console.error("SAQ initial game startup stack:",error?.stack??error); const failure=classifyLocalLaunchError(error);');
        return {contents:patched,loader:'js'};
      });
    }
  }]
});
if(workerConstructorCount!==2)throw Error('Production worker patch was not applied');
const workerEntry=String.raw`import {startActivitySaveWorker} from './src/entrypoints/activity_save_worker.js'; startActivitySaveWorker(self);`;
await esbuild.build({
  absWorkingDir:root,
  stdin:{contents:workerEntry,resolveDir:root,sourcefile:'production-worker-entry.js',loader:'js'},
  outfile:path.join(dist,'save-worker.js'),
  bundle:true,
  platform:'browser',
  format:'esm',
  target:['es2022'],
  legalComments:'none'
});
await fs.copyFile(at('world.css'),path.join(dist,'world.css'));
await fs.copyFile(at('manifest.webmanifest'),path.join(dist,'manifest.webmanifest'));
await fs.writeFile(path.join(dist,'.nojekyll'),'');
await fs.mkdir(path.join(dist,'src','client'),{recursive:true});
for(const f of ['startup_loading_v1.js','startup_combat_preview_v1.js']){
  await fs.copyFile(at('src','client',f),path.join(dist,'src','client',f));
}
await fs.cp(at('assets'),path.join(dist,'assets'),{recursive:true});
let html=await fs.readFile(at('index.html'),'utf8');
if(!html.includes('<script type="importmap">'))throw Error('Expected the source importmap');
html=html.replace(/\s*<script type="importmap">[\s\S]*?<\/script>/,'');
const rev=(process.env.GITHUB_SHA||'local-build').slice(0,12);
html=html.replace(/data-world-release="[^"]+"/,'data-world-release="wilderness-v3-compact-'+rev+'"');
html=html.replace(/(src="\.\/src\/entrypoints\/browser_boot\.js)\?[^"]+"/,'$1?v=compact-'+rev+'"');
html=html.replace(/(href="\.\/world\.css)\?[^"]+"/,'$1?v=compact-'+rev+'"');
html=html.replace(/(data-runtime-manifest="runtime-manifest\.json)\?[^"]+"/,'$1?v=compact-'+rev+'"');
await fs.writeFile(path.join(dist,'index.html'),html);
const inventory=[];
async function walk(dir){
  for(const entry of await fs.readdir(dir,{withFileTypes:true})){
    const absolute=path.join(dir,entry.name);
    if(entry.isDirectory())await walk(absolute);
    else if(entry.isFile()){
      const relative=path.relative(dist,absolute).replaceAll(path.sep,'/');
      if(relative==='runtime-manifest.json')continue;
      const data=await fs.readFile(absolute);
      inventory.push({path:relative,bytes:data.byteLength,sha256:createHash('sha256').update(data).digest('hex')});
    }
  }
}
await walk(dist);
inventory.sort((a,b)=>a.path.localeCompare(b.path));
const fingerprint=createHash('sha256').update(JSON.stringify(inventory)).digest('hex');
await fs.writeFile(path.join(dist,'runtime-manifest.json'),JSON.stringify({
  runtimeId:fingerprint.slice(0,16),
  runtimeSha256:fingerprint,
  files:inventory
},null,2)+'\n');
const jsOutputs=Object.keys(result.metafile.outputs).filter(p=>p.endsWith('.js'));
console.log(JSON.stringify({fileCount:inventory.length+1,jsOutputs:jsOutputs.length,workerMode:'module',sourcesBundled:Object.keys(result.metafile.inputs).length,hash:fingerprint.slice(0,16)},null,2));
