import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateRun,mergeRun,emptyFeed,ingest,STATE_KEY} from './watch_store.mjs';
import {readFileSync} from 'node:fs';
const source=JSON.parse(readFileSync(new URL('./sources.json',import.meta.url)));
const stories=JSON.parse(readFileSync(new URL('./reference_articles.json',import.meta.url))).filter(s=>s.source_id==='imo' && s.scope==='original');
const now=new Date().toISOString(), t0='2026-11-18T19:00:00Z', t1='2026-11-18T20:00:00Z';
const first={run_id:'fixture-one',checks:[{source_id:'imo',status:'ok',detail:'Original read'}],articles:[stories[0]]};
const valid=(obj=first)=>validateRun(obj,source,now);
class MemoryBucket {
  map=new Map(); seq=0;
  async get(key){const o=this.map.get(key);return o?{etag:o.etag,json:async()=>JSON.parse(o.data)}:null;}
  async put(key,data,opts){
    const o=this.map.get(key),c=opts.onlyIf;
    if(c.etagMatches && o?.etag!==c.etagMatches || c.etagDoesNotMatch==='*' && o)return null;
    const etag=String(++this.seq);this.map.set(key,{data,etag});return {etag};
  }
}
const request=payload=>new Request('https://test.invalid/api/watch/runs',{method:'POST',headers:{'Content-Type':'application/json','X-Watch-Writer':'research-v1'},body:JSON.stringify(payload)});
test('old URL checked again never creates a second article or second lesson',async()=>{
  const s=await mergeRun(emptyFeed(source),valid(),source,t0);
  const next=await mergeRun(s,valid({...first,run_id:'fixture-two'}),source,t1);
  assert.equal(next.entries.length,1);assert.equal(next.lessons.length,1);assert.equal(next.new_links_this_run,0);
  assert.equal(next.changed_this_run,0);assert.equal(next.entries[0].last_seen,t1);
});
test('changed text increments revision, keeps prior material and refreshes quiz version',async()=>{
  const s=await mergeRun(emptyFeed(source),valid(),source,t0);
  const next=await mergeRun(s,valid({...first,run_id:'fixture-two',articles:[{...stories[0],summary:'Revised bulletin test.'}]}),source,t1);
  assert.equal(next.entries[0].history[0].summary,stories[0].summary);assert.equal(next.lessons[0].version,2);assert.equal(next.changed_this_run,1);
});
test('failed source retains its previous last success and stored original',async()=>{
  const s=await mergeRun(emptyFeed(source),valid(),source,t0);
  const failed=await mergeRun(s,valid({run_id:'fixture-failure',checks:[{source_id:'imo',status:'unavailable',detail:'HTTP 403'}],articles:[]}),source,t1);
  const h=failed.sources.find(x=>x.id==='imo');
  assert.equal(h.last_success,t0);assert.equal(h.last_attempt,t1);assert.equal(h.consecutive_failures,1);assert.equal(failed.collector_status,'ALL_SOURCES_FAILED');assert.equal(failed.entries.length,1);
});
test('partial source coverage keeps per-source results',async()=>{
 const c={...first,checks:[...first.checks,{source_id:'cyprus',status:'unavailable',detail:'HTTP 403'}]};
 const s=await mergeRun(emptyFeed(source),valid(c),source,t0);
 assert.equal(s.collector_status,'PARTIAL');assert.equal(s.sources.find(x=>x.id==='cyprus').last_success,null);assert.equal(s.runs[0].checked,2);
});
test('source discovery does not replace a checked original',async()=>{
 const s=await mergeRun(emptyFeed(source),valid(),source,t0);
 const next=await mergeRun(s,valid({...first,run_id:'fixture-two',articles:[{...stories[0],scope:'listing'}]}),source,t1);
 assert.equal(next.entries[0].summary,stories[0].summary);assert.equal(next.changed_this_run,0);
});
test('a proposed operational item holds back advice, quiz and automatic approval',async()=>{
 const s=await mergeRun(emptyFeed(source),valid({...first,articles:[{...stories[0],scope:'proposed'}]}),source,t0);
 assert.equal(s.entries[0].scope,'proposed');assert.equal(s.entries[0].summary,'');assert.equal(s.lessons.length,0);assert.equal(s.entries[0].legal_status,'under review');
});
test('out-of-registry URL, unconfirmed source, incorrect date or bad quiz fails validation',()=>{
 for(const patch of [{url:'https://example.org/news'},{published:'2026-02-31'},{quiz:{question:'Q',choices:['a','b','c'],answer:3}},{source_id:'cyprus'}])assert.throws(()=>valid({...first,articles:[{...stories[0],...patch}]}));
});
test('persisted write, exact retry and conflicting reuse',async()=>{
 const b=new MemoryBucket(),initial=emptyFeed(source);
 assert.equal((await ingest(request(first),b,source,initial)).status,201);
 assert.equal((await (await ingest(request(first),b,source,initial)).json()).duplicate,true);
 assert.equal((await ingest(request({...first,articles:[]}),b,source,initial)).status,409);
 assert.equal((await (await b.get(STATE_KEY)).json()).runs.length,1);
});
test('overlapping runs merge without losing either publication',async()=>{
 const b=new MemoryBucket(),initial=emptyFeed(source);
 const second={...first,run_id:'fixture-two',articles:[stories[1]]};
 const results=await Promise.all([first,second].map(r=>ingest(request(r),b,source,initial)));
 assert.deepEqual(results.map(x=>x.status),[201,201]);const data=await (await b.get(STATE_KEY)).json();assert.equal(data.runs.length,2);assert.equal(data.entries.length,2);
});
test('browser-origin requests cannot submit research',async()=>{
 const req=request(first);req.headers.set('origin','https://test.invalid');
 assert.equal((await ingest(req,new MemoryBucket(),source,emptyFeed(source))).status,403);
});
