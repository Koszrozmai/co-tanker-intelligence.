/* Public maritime research records. The private Site authorises unattended writes.
   Shipboard notes, checklist records and personal learning history stay on the device. */
const STATE_KEY = 'watch/current-v1.json';
const DOC_LIMIT = 320;
const MAX_BODY = 90000;
const statuses = new Set(['information', 'guidance', 'proposal', 'under review']);
const utcDay = value => value.slice(0, 10);
const timestamp = () => new Date().toISOString();
const text = (value, limit, label) => {
  if (typeof value !== 'string' || !value.trim() || value.length > limit) throw Error('Invalid ' + label);
  return value.trim();
};
function dateOrNull(value, latest, field) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw Error('Invalid ' + field);
  const day = new Date(value + 'T12:00:00Z');
  if (!Number.isFinite(day.getTime()) || utcDay(day.toISOString()) !== value || (latest && value > latest)) throw Error('Invalid ' + field);
  return value;
}
function documentURL(value, spec) {
  const url = new URL(text(value, 1000, 'original URL'));
  const hosts = [spec.host, ...(spec.extra_hosts || [])].map(h => h.replace(/^www\./, ''));
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !hosts.includes(url.hostname.replace(/^www\./, ''))) throw Error('Original URL outside the source registry');
  if (url.pathname === '/' && !url.search) throw Error('Use the original publication URL');
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) if (/^utm_|^fbclid$|^gclid$/i.test(key)) url.searchParams.delete(key);
  return url.href;
}
function validateQuiz(raw) {
  if (!raw) return null;
  if (!Array.isArray(raw.choices) || raw.choices.length !== 3 || !Number.isInteger(raw.answer) || raw.answer < 0 || raw.answer > 2) throw Error('Invalid quiz');
  const choices = raw.choices.map(v => text(v, 230, 'quiz choice'));
  if (new Set(choices).size !== 3) throw Error('Duplicate quiz choices');
  return {question:text(raw.question, 320, 'quiz question'), choices, answer:raw.answer, explanation:text(raw.explanation, 520, 'quiz explanation')};
}
function validateRun(raw, registry, at) {
  if (!raw || !/^[a-zA-Z0-9_-]{8,80}$/.test(raw.run_id || '')) throw Error('A stable run_id is required');
  if (!Array.isArray(raw.checks) || !raw.checks.length || raw.checks.length > registry.length) throw Error('A source check is required');
  if (!Array.isArray(raw.articles) || raw.articles.length > 18) throw Error('Invalid articles array');
  const specs = new Map(registry.map(s => [s.id,s]));
  const checks = raw.checks.map(c => {
    if (!specs.has(c.source_id) || !['ok','unavailable'].includes(c.status)) throw Error('Unrecognised source check');
    return {source_id:c.source_id, status:c.status, detail:text(c.detail, 260, 'source check detail')};
  });
  if (new Set(checks.map(c => c.source_id)).size !== checks.length) throw Error('Duplicate source check');
  const good = new Set(checks.filter(c => c.status === 'ok').map(c => c.source_id));
  const today = utcDay(at);
  const articles = raw.articles.map(a => {
    if (!good.has(a.source_id) || !statuses.has(a.legal_status)) throw Error('Article requires a successful source check and a recognised status');
    const scope = a.scope || 'original';
    if (!['original','listing','proposed'].includes(scope)) throw Error('Invalid verification scope');
    const source = specs.get(a.source_id);
    const item = {source_id:source.id, url:documentURL(a.url,source), title:text(a.title,200,'title'), topic:text(a.topic,100,'topic'),
      legal_status:a.legal_status, scope, published:dateOrNull(a.published,today,'publication date'), updated_at_source:dateOrNull(a.updated_at_source,today,'source update date'),
      event_start:dateOrNull(a.event_start,null,'event start'), event_end:dateOrNull(a.event_end,null,'event end'),
      summary:'', co_note:'', quiz:null};
    if (item.event_start && item.event_end && item.event_start > item.event_end) throw Error('Invalid event interval');
    if (scope === 'original') {
      item.summary = text(a.summary, 850, 'summary');
      item.co_note = text(a.co_note, 600, 'study note');
      item.quiz = validateQuiz(a.quiz);
    } else item.legal_status = 'under review';
    return item;
  });
  if (new Set(articles.map(a=>a.url)).size !== articles.length) throw Error('Duplicate original in the same run');
  return {run_id:raw.run_id,checks,articles};
}
async function hash(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), n=>n.toString(16).padStart(2,'0')).join('');
}
function sourceState(spec) {
  return {id:spec.id,name:spec.name,url:spec.url.replace('{year}',new Date().getUTCFullYear()),ok:false,fetch_status:'not_checked',last_attempt:null,last_success:null,last_change_detected:null,consecutive_failures:0};
}
function emptyFeed(registry) {
  return {schema_version:1,generated_at:null,collector_status:'NOT_DEPLOYED',entries:[],lessons:[],sources:registry.map(sourceState),runs:[],briefing:null};
}
function exercise(entry) {
  return {id:'study-'+entry.id,entry_id:entry.id,source_id:entry.source_id,source_url:entry.url,title:entry.title,topic:entry.topic,version:entry.revision,
    status:entry.quiz?'SOURCE-BASED QUIZ':'GUIDED SOURCE READING',learning_objective:entry.co_note,created_at:entry.discovered_at,
    verified_at:entry.verified_at,quiz:entry.quiz,questions:entry.quiz?[]:['Which statement in the original document supports this summary?']};
}
async function mergeRun(previous, run, registry, at) {
  if (previous.runs.some(r=>r.id===run.run_id)) return previous;
  const entries = new Map(previous.entries.map(e=>[e.url,e]));
  const changedSources = new Set();
  let added=0, amended=0;
  for (const doc of run.articles) {
    const old = entries.get(doc.url);
    const source = registry.find(s=>s.id===doc.source_id);
    // A listing can corroborate presence but cannot replace an original already read.
    if (old?.scope==='original' && doc.scope==='listing') {entries.set(doc.url,{...old,last_seen:at});continue;}
    const fingerprint = await hash(JSON.stringify(doc));
    if (old?.fingerprint===fingerprint) {
      entries.set(doc.url,{...old,last_seen:at,verified_at:doc.scope==='original'?at:old.verified_at});continue;
    }
    const history = old ? [{revision:old.revision,at:old.changed_at,title:old.title,summary:old.summary,legal_status:old.legal_status},...(old.history||[])].slice(0,4) : [];
    const entry = {...doc,id:old?.id || (await hash(doc.url)).slice(0,24),source_name:source.name,region:source.region,
      status_label:doc.scope==='original'?'Original publication checked':doc.scope==='listing'?'Listing only · original pending':'Proposed · awaiting review',
      revision:(old?.revision||0)+1,fingerprint,history,discovered_at:old?.discovered_at||at,last_seen:at,changed_at:at,verified_at:doc.scope==='original'?at:null};
    entries.set(doc.url,entry);changedSources.add(source.id);
    if (old) amended++; else added++;
  }
  const sources = previous.sources.map(s=>{
    const c=run.checks.find(x=>x.source_id===s.id);
    if (!c) return s;
    const ok=c.status==='ok';
    return {...s,ok,fetch_status:c.status,last_attempt:at,last_success:ok?at:s.last_success,last_change_detected:changedSources.has(s.id)?at:s.last_change_detected,
      consecutive_failures:ok?0:(s.consecutive_failures||0)+1,error:ok?null:c.detail,detail:c.detail};
  });
  const docs=[...entries.values()].sort((a,b)=>b.changed_at.localeCompare(a.changed_at)||a.title.localeCompare(b.title)).slice(0,DOC_LIMIT);
  const okCount=run.checks.filter(x=>x.status==='ok').length;
  const record={id:run.run_id,at,checked:run.checks.length,successful:okCount,added,amended};
  const runs=[record,...previous.runs].slice(0,128);
  const today=runs.filter(r=>utcDay(r.at)===utcDay(at));
  return {schema_version:1,generated_at:at,collector_status:!okCount?'ALL_SOURCES_FAILED':okCount<run.checks.length?'PARTIAL':'RUN_COMPLETED',delivery:'private-watch',
    entries:docs,lessons:docs.filter(x=>x.scope==='original').map(exercise),sources,runs,new_links_this_run:added,changed_this_run:amended,
    briefing:{day:utcDay(at),checks:today.length,added:today.reduce((n,r)=>n+r.added,0),amended:today.reduce((n,r)=>n+r.amended,0)}};
}
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'}});
async function readBody(request) {
  const reader=request.body?.getReader();if (!reader) throw Error('Empty body');
  const chunks=[];let length=0;
  for (;;) {const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>MAX_BODY){await reader.cancel();throw Error('Body too large');}chunks.push(value);}
  const all=new Uint8Array(length);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.length;}
  return JSON.parse(new TextDecoder().decode(all));
}
async function ingest(request, bucket, registry, seed) {
  if (request.headers.get('origin') || request.headers.get('sec-fetch-site')==='cross-site' || request.headers.get('x-watch-writer')!=='research-v1') return json({error:'Scheduled research writer required'},403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json({error:'JSON required'},415);
  let run;
  try {run=validateRun(await readBody(request),registry,timestamp());} catch(e){return json({error:e.message},400);}
  const archiveKey='watch/runs/'+run.run_id+'.json';
  const record={at:timestamp(),run};
  const archived=await bucket.put(archiveKey,JSON.stringify(record),{onlyIf:{etagDoesNotMatch:'*'}});
  if (!archived) {
    const existing=await bucket.get(archiveKey);const saved=await existing.json();
    if (JSON.stringify(saved.run)!==JSON.stringify(run)) return json({error:'Run ID already used with different input'},409);
    record.at=saved.at;
  }
  for (let i=0;i<4;i++) {
    const object=await bucket.get(STATE_KEY);
    const old=object?await object.json():seed;
    if (old.runs.some(x=>x.id===run.run_id) || (old.generated_at && record.at < (old.runs.at(-1)?.at||''))) return json({run_id:run.run_id,duplicate:true,generated_at:old.generated_at});
    // Commit time reflects materialisation. Retries of archived submissions use the same payload.
    const next=await mergeRun(old,run,registry,timestamp());
    const write=await bucket.put(STATE_KEY,JSON.stringify(next),{onlyIf:object?{etagMatches:object.etag}:{etagDoesNotMatch:'*'}});
    if (write) return json({run_id:run.run_id,generated_at:next.generated_at,added:next.new_links_this_run,amended:next.changed_this_run,status:next.collector_status},201);
  }
  return json({error:'Concurrent update. Retry identical run ID and body.'},409);
}
export {validateRun,mergeRun,emptyFeed,ingest,json,STATE_KEY};
