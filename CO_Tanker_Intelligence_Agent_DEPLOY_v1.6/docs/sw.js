const PREFIX='co-tanker-intelligence-';
const CACHE=PREFIX+'v1.6.0b';
const ROOT=new URL('./',self.registration.scope);
const ASSETS=['./','./index.html','./styles.css','./dashboard.js','./mobile_core.js','./config.js','./inspection_data.js','./planner_engine.js','./planner_ui.js','./training_engine.js','./training_ui.js','./parser_pwa.js','./classification.js','./always_on_ui.js','./release_reference.js','./manifest.webmanifest','./icons/icon192.png','./icons/icon512.png'];
const shellPaths=new Set(ASSETS.map(path=>new URL(path,ROOT).pathname));
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(ASSETS.map(path=>new Request(new URL(path,ROOT),{credentials:'same-origin',cache:'reload',redirect:'error'})));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==ROOT.origin||!shellPaths.has(url.pathname))return;
  // The feed has its own validated, timestamped device snapshot in Watch.
  // Authentication, APIs and external requests must never enter the offline app shell.
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE),key=new URL(url.pathname,ROOT);
    const stored=await cache.match(key);
    if(stored)return stored;
    return fetch(event.request);
  })());
});
