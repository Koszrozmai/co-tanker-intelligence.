import {STATE_KEY,ingest,emptyFeed,json} from './watch_store.mjs';
import {ASSETS,REGISTRY,REFERENCE,INSTRUCTIONS} from './assets.js';
const baseHeaders={'x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
function asset(path,req) {
  const a=ASSETS[path==='/'?'/index.html':path];
  if(!a)return new Response('Page unavailable',{status:404,headers:baseHeaders});
  const body=req.method==='HEAD'?null:a.binary?Uint8Array.from(atob(a.data),ch=>ch.charCodeAt(0)):a.data;
  return new Response(body,{headers:{...baseHeaders,'content-type':a.type,'cache-control':'private, no-cache','service-worker-allowed':'/'}});
}
const form={
  run_id:'unique stable ASCII ID, letters/digits/underscores/hyphens, 8 to 80 characters',
  checks:[{source_id:'registry ID',status:'ok or unavailable',detail:'brief factual account of actual access, up to 260 characters'}],
  articles:[{source_id:'successfully checked registry ID',url:'canonical original HTTPS URL on an approved host',scope:'original, listing or proposed',title:'English title',topic:'topic',legal_status:'information, guidance, proposal or under review',published:'YYYY-MM-DD or null',updated_at_source:'YYYY-MM-DD or null',event_start:'YYYY-MM-DD or null',event_end:'YYYY-MM-DD or null',summary:'brief original-source summary for scope original',co_note:'short officer study note for scope original',quiz:{question:'source-grounded question',choices:['first','second','third'],answer:'zero-based integer',explanation:'source-grounded explanation'}}]
};
export default {async fetch(req,env) {
  const {pathname}=new URL(req.url);
  if(pathname==='/api/watch/instructions' && req.method==='GET')return json({version:'1.6.0',registry:REGISTRY,write:{path:'/api/watch/runs',method:'POST',headers:{'X-Watch-Writer':'research-v1','Content-Type':'application/json'},form},instructions:INSTRUCTIONS});
  if(pathname==='/data/intelligence.json' && req.method==='GET') {
    if(!env.BUCKET)return json({error:'Persistent source storage unavailable'},503);
    const o=await env.BUCKET.get(STATE_KEY);
    return o?new Response(o.body,{headers:{...baseHeaders,'content-type':'application/json; charset=utf-8','cache-control':'private, no-store'}}):json(REFERENCE);
  }
  if(pathname==='/api/watch/runs' && req.method==='POST'){
    if(!env.BUCKET)return json({error:'Persistent source storage unavailable'},503);
    return ingest(req,env.BUCKET,REGISTRY,emptyFeed(REGISTRY));
  }
  if(!['GET','HEAD'].includes(req.method))return new Response('Method unavailable',{status:405,headers:baseHeaders});
  return asset(pathname,req);
}};
