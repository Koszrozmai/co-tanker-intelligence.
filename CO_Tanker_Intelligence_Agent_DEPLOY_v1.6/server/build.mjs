import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=file=>fs.readFile(path.join(root,file),'utf8');
const assets={};
const types={'.js':'text/javascript; charset=utf-8','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webmanifest':'application/manifest+json'};
async function collect(dir) {
  for(const d of await fs.readdir(path.join(root,'docs',dir),{withFileTypes:true})){
    const key=path.join(dir,d.name);
    if(d.isDirectory()){await collect(key);continue;}
    const ext=path.extname(key);if(!types[ext])continue;
    const binary=ext==='.png',data=await fs.readFile(path.join(root,'docs',key));
    assets['/'+key]={type:types[ext],binary,data:data.toString(binary?'base64':'utf8')};
  }
}
await collect('');
const ref=await read('docs/release_reference.js');
const marker='export const RELEASE_REFERENCE = ';
if(!ref.startsWith(marker))throw Error('Missing reference snapshot');
const reference=JSON.parse(ref.slice(marker.length).trim().replace(/;$/,''));
const registry=JSON.parse(await read('agent/sources.json'));
const globals='const ASSETS='+JSON.stringify(assets)+';\nconst REGISTRY='+JSON.stringify(registry)+';\nconst REFERENCE='+JSON.stringify(reference)+';\nconst INSTRUCTIONS='+JSON.stringify(await read('agent/RESEARCH_RUNBOOK.md'))+';\n';
const store=(await read('agent/watch_store.mjs')).replace(/^export \{[^;]+;\s*$/m,'');
const worker=(await read('server/index.js')).replace(/^import .*;\s*$/gm,'');
await fs.mkdir(path.join(root,'server/dist/server'),{recursive:true});

await fs.writeFile(path.join(root,'server/dist/server/index.js'),globals+store+'\n'+worker);

console.log('Built '+Object.keys(assets).length+' dashboard resources with the research API.');
