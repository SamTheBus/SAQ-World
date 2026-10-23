import * as fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { build as bundle } from 'esbuild';

const root = process.cwd();
const out = path.join(root, 'dist');
const revision = 'compact-main-v1-20261022';
await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });

// Cache-busting query suffixes don't identify different modules in a compiled game.
// Keep module-relative asset URLs pointing to their ORIGINAL source directories.
const canonicalModules = {
  name: 'saq-original-module-urls',
  setup(builder) {
    builder.onResolve({ filter: /\.js\?[^#]+$/ }, args => {
      if (!args.path.startsWith('.')) return;
      return { path: path.resolve(args.resolveDir, args.path.split('?')[0]) };
    });
    builder.onLoad({ filter: /\.js$/ }, async args => {
      const source = await fs.readFile(args.path, 'utf8');
      if (!source.includes('import.meta.url')) return;
      const original = './' + path.relative(root, args.path).split(path.sep).join('/');
      const originalUrl = '(new URL(' + JSON.stringify(original) + ", new URL('./', globalThis.location.href)).href)";
      return { loader: 'js', contents: source.replace(/\bimport\.meta\.url\b/g, originalUrl) };
    });
  }
};

const common = {
  absWorkingDir: root, bundle: true, platform: 'browser',
  target: ['es2022'], minify: false, sourcemap: false,
  legalComments: 'none', plugins: [canonicalModules], logLevel: 'info',
  metafile: true
};
const client = await bundle({
  ...common, entryPoints: ['src/entrypoints/browser_boot.js'],
  outfile: path.join(out, 'game.js'), format: 'esm', splitting: false
});
const worker = await bundle({
  ...common, entryPoints: ['save-worker.js'],
  outfile: path.join(out, 'save-worker.js'), format: 'iife', splitting: false
});

await fs.cp(path.join(root, 'assets'), path.join(out, 'assets'), { recursive: true });
for (const name of ['world.css', 'manifest.webmanifest']) {
  await fs.copyFile(path.join(root, name), path.join(out, name));
}
await fs.copyFile(path.join(root, 'src/client/startup_loading_v1.js'), path.join(out, 'startup-loading.js'));
await fs.copyFile(path.join(root, 'src/client/startup_combat_preview_v1.js'), path.join(out, 'startup-combat-preview.js'));
await fs.writeFile(path.join(out, '.nojekyll'), '');

let html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<script\s+type="importmap">[\s\S]*?<\/script>/g, '');
html = html.replace(/<script\s+src="\.\/src\/client\/startup_loading_v1\.js[^"]*"><\/script>/g,
  '<script src="./startup-loading.js?v=' + revision + '"></script>');
html = html.replace(/<script\s+src="\.\/src\/client\/startup_combat_preview_v1\.js[^"]*"><\/script>/g,
  '<script src="./startup-combat-preview.js?v=' + revision + '"></script>');
html = html.replace(/<script\s+type="module"\s+src="\.\/src\/entrypoints\/browser_boot\.js[^"]*"><\/script>/g,
  '<script type="module" src="./game.js?v=' + revision + '"></script>');
html = html.replace(/data-world-release="[^"]+"/, 'data-world-release="' + revision + '"');
html = html.replace(/data-runtime-manifest="[^"]+"/,
  'data-runtime-manifest="runtime-manifest.json?v=' + revision + '"');
html = html.replace(/href="\.\/world\.css\?[^"]+"/, 'href="./world.css?v=' + revision + '"');
await fs.writeFile(path.join(out, 'index.html'), html);

async function enumerate(dir, prefix = '') {
  let result = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const relative = prefix ? prefix + '/' + e.name : e.name;
    if (e.isDirectory()) result.push(...await enumerate(path.join(dir, e.name), relative));
    else if (e.isFile() && relative !== 'runtime-manifest.json') {
      const bytes = await fs.readFile(path.join(dir, e.name));
      result.push({
        path: relative, bytes: bytes.byteLength,
        sha256: crypto.createHash('sha256').update(bytes).digest('hex')
      });
    }
  }
  return result;
}
const files = (await enumerate(out)).sort((a, b) => a.path.localeCompare(b.path, 'en'));
const digest = crypto.createHash('sha256').update(JSON.stringify(files)).digest('hex');
const manifest = {
  runtimeId: digest.slice(0, 16), runtimeSha256: digest,
  parentRuntimeId: '17c29efcbb1fd574', reviewRevision: 95,
  changedRuntimeFiles: ['index.html', 'game.js', 'save-worker.js'],
  addedRuntimeFiles: ['game.js', 'startup-loading.js', 'startup-combat-preview.js'],
  unchangedRuntimeFiles: [], files
};
await fs.writeFile(path.join(out, 'runtime-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({
  productionFileCount: files.length + 1,
  clientModules: Object.keys(client.metafile.inputs).length,
  workerModules: Object.keys(worker.metafile.inputs).length,
  browserBundleBytes: (await fs.stat(path.join(out, 'game.js'))).size,
  workerBundleBytes: (await fs.stat(path.join(out, 'save-worker.js'))).size,
  fingerprint: manifest.runtimeId
}, null, 2));