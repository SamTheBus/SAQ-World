#!/usr/bin/env python3
from pathlib import Path
import hashlib,json,posixpath,re,shutil
ROOT=Path(__file__).resolve().parents[1]
BUILD=ROOT
prior=json.loads((BUILD/'runtime-manifest.json').read_text())
prior_hashes={r['path']:r['sha256'] for r in prior['files']}
package_path=BUILD/'review/current/runtime-package.json'
prior_package=json.loads(package_path.read_text()) if package_path.is_file() else None
pattern=re.compile(r'''(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)(['"])(\.[^'"\n]+\.js)\1''')
entry='src/entrypoints/activity_save_worker.js'
visited=set();pending=[entry]
while pending:
 name=pending.pop()
 if name in visited:continue
 p=BUILD/name
 assert p.is_file(),name
 visited.add(name)
 for match in pattern.finditer(p.read_text()):
  dependency=posixpath.normpath(posixpath.join(posixpath.dirname(name),match.group(2)))
  assert dependency.startswith('src/'),dependency
  pending.append(dependency)
source_rows=[]
for p in sorted((BUILD/'src').rglob('*.js')):
 source_rows.append({'path':p.relative_to(BUILD).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
digest=hashlib.sha256(json.dumps(source_rows,separators=(',',':')).encode()).hexdigest()
release='dungeon-mobs-v2-'+digest[:12]
worker_release=release
reused_worker=False
if prior_package:
 old_entry=prior_package.get('workerEntry','')
 old_files=prior_package.get('workerFiles',[])
 old_release=old_entry.split('/')[1] if old_entry.startswith('worker/') else None
 old_modules={name.split('/src/',1)[1] for name in old_files if '/src/' in name}
 if old_release and old_modules=={name.removeprefix('src/') for name in visited} and all((BUILD/name).is_file() and (BUILD/name).read_bytes()==(BUILD/('src/'+name.split('/src/',1)[1])).read_bytes() for name in old_files):
  worker_release=old_release;reused_worker=True
worker_dir=BUILD/'worker'/worker_release
worker_dir.mkdir(parents=True,exist_ok=True)
for name in sorted(visited):
 p=worker_dir/name;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(BUILD/name,p)
(BUILD/('save-worker.'+worker_release+'.js')).write_text("import('./worker/"+worker_release+"/src/entrypoints/activity_save_worker.js').then(module=>module.startActivitySaveWorker(self));\n")
changed={r['path'] for r in source_rows if prior_hashes.get(r['path'])!=r['sha256']}
for document in ['index.html','world-cumulative-dev.html','review/current/hostile-attack-gallery.html','review/current/dungeon-mobs-gallery.html','review/current/dungeon-mobs-v2-gallery.html','review/current/clockwork-revamp-gallery.html','review/current/cel-roster-gallery.html']:
 existing=re.search(r'<script type="importmap">(.*?)</script>',(BUILD/document).read_text(),re.S)
 if existing:
  for key in json.loads(existing.group(1))['imports']:
   module=posixpath.normpath(posixpath.join(posixpath.dirname(document),key))
   if module.startswith('src/') and (BUILD/module).is_file():changed.add(module)
changed=sorted(changed)
for name in ['index.html','world-cumulative-dev.html','review/current/hostile-attack-gallery.html','review/current/dungeon-mobs-gallery.html','review/current/dungeon-mobs-v2-gallery.html','review/current/clockwork-revamp-gallery.html','review/current/cel-roster-gallery.html']:
 p=BUILD/name;raw=p.read_bytes();s=raw.decode()
 mappings={}
 for rel in changed:
  key=posixpath.relpath(rel,posixpath.dirname(name) or '.')
  if not key.startswith('.'):key='./'+key
  mappings[key]=key+'?v='+release
 block='<script type="importmap">'+json.dumps({'imports':mappings},separators=(',',':'))+'</script>'
 assert len(re.findall(r'<script type="importmap">.*?</script>',s,flags=re.S))==1,name
 s=re.sub(r'<script type="importmap">.*?</script>',lambda m:block,s,count=1,flags=re.S)
 if name in ['index.html','world-cumulative-dev.html']:
  s=re.sub(r'\sdata-world-release="[^"]*"','',s,count=1)
  s=re.sub(r'\sdata-world-save-worker="[^"]*"','',s,count=1)
  s=s.replace('<html ', '<html data-world-release="'+release+'" data-world-save-worker="save-worker.'+worker_release+'.js" ',1)
  s=re.sub(r'data-runtime-manifest="[^"]*"', 'data-runtime-manifest="runtime-manifest.json?v='+release+'"', s, count=1)
 p.write_bytes(s.encode())
for name in visited:
 assert (worker_dir/name).read_bytes()==(BUILD/name).read_bytes(),name
for name in visited:
 for m in pattern.finditer((worker_dir/name).read_text()):
  assert ((worker_dir/name).parent/m.group(2)).resolve().is_file()
report={'release':release,'workerRelease':worker_release,'reusedWorkerGraph':reused_worker,'sourceGraphSha256':digest,'workerWrapper':'save-worker.'+worker_release+'.js','workerEntry':str((worker_dir/entry).relative_to(BUILD)),'workerModules':len(visited),'changedSourceModules':len(changed),'workerModulesByteIdentical':True,'workerAssetBase':'public root save-worker URL','workerFiles':[str((worker_dir/n).relative_to(BUILD)) for n in sorted(visited)]}
(ROOT/'review/current/runtime-package.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:report[k] for k in report if k!='workerFiles'}))

# Keep the generated graph and its entry in the runtime commitment. The source
# remains canonical in src/; worker copies are immutable cache-safe deployment.
paths={r['path'] for r in prior['files']}
paths.update(p.relative_to(BUILD).as_posix() for p in (BUILD/'src').rglob('*.js'))
paths.update(p.relative_to(BUILD).as_posix() for p in (BUILD/'worker').rglob('*.js'))
paths.update(p.relative_to(BUILD).as_posix() for p in BUILD.glob('save-worker.dungeon-mobs-*.js'))
rows=[]
for name in sorted(paths):
 raw=(BUILD/name).read_bytes()
 rows.append({'path':name,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
sha=hashlib.sha256(json.dumps(rows,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
manifest={'runtimeId':sha[:16],'runtimeSha256':sha,'parentRuntimeId':prior['runtimeId'],
 'reviewRevision':prior.get('reviewRevision',0)+1,
 'changedRuntimeFiles':[r['path'] for r in rows if r['path'] in prior_hashes and prior_hashes[r['path']]!=r['sha256']],
 'addedRuntimeFiles':[r['path'] for r in rows if r['path'] not in prior_hashes],
 'unchangedRuntimeFiles':[r['path'] for r in rows if prior_hashes.get(r['path'])==r['sha256']],
 'files':rows}
if sha==prior.get('runtimeSha256'):
 manifest=prior  # Repackaging identical source keeps the existing parent/revision.
(BUILD/'runtime-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'runtimeId':sha[:16],'committedFiles':len(rows)}))
