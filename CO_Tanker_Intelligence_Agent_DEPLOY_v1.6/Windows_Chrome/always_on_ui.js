import {RELEASE_REFERENCE} from './release_reference.js';

const STORE='coIntelligenceAlwaysOnV1';
const HOSTED='https://co-tanker-intelligence-watch.koszykrozmaity.chatgpt.site';
const extension=location.protocol==='chrome-extension:';
const localFile=location.protocol==='file:' || new URLSearchParams(location.search).has('standalone');
const defaultURL=extension?HOSTED+'/data/intelligence.json':localFile?'':'./data/intelligence.json';
const $=id=>document.getElementById(id);
function element(tag,css,value) {
  const result=document.createElement(tag);
  if(css) result.className=css;
  if(value!==undefined) result.textContent=String(value);
  return result;
}
function link(url,label) {
  try {
    const target=new URL(url);
    if(target.protocol!=='https:' || target.username || target.password) throw Error();
    const a=element('a','reference-short',label);
    a.href=target.href;a.target='_blank';a.rel='noopener noreferrer';return a;
  } catch {return element('span','micro','Original link unavailable');}
}
const defaults=()=>({url:defaultURL,seen:[],saved:[],answers:{},cached:null,lastRead:'',lastVisit:'',lastError:''});
function validateFeed(data) {
  if(data?.schema_version!==1 || !['entries','lessons','sources'].every(k=>Array.isArray(data[k]) && data[k].length<=2000)) throw Error('Unsupported feed format');
  for(const e of data.entries) {
    if(!e || typeof e.id!=='string' || typeof e.title!=='string' || typeof e.url!=='string' || !Array.isArray(e.history||[])) throw Error('Invalid publication record');
  }
  for(const l of data.lessons) if(!l || typeof l.id!=='string' || !Array.isArray(l.questions||[]) || (l.quiz && (!Array.isArray(l.quiz.choices)||l.quiz.choices.length!==3||!Number.isInteger(l.quiz.answer)||l.quiz.answer<0||l.quiz.answer>2))) throw Error('Invalid study record');
  if(data.sources.some(s=>!s || typeof s.id!=='string')) throw Error('Invalid source records');
  return data;
}
function readStore(data) {
  const result=defaults();if(!data || typeof data!=='object')return result;
  for(const key of ['url','lastRead','lastVisit','lastError']) if(typeof data[key]==='string')result[key]=data[key].slice(0,800);
  if(!result.url) result.url=defaultURL;
  for(const key of ['seen','saved']) if(Array.isArray(data[key]))result[key]=data[key].filter(v=>typeof v==='string').slice(-2000);
  if(data.answers && typeof data.answers==='object')result.answers=Object.fromEntries(Object.entries(data.answers).filter(([k,v])=>k.length<=140 && Number.isInteger(v)&&v>=0&&v<=2).slice(-1000));
  if(data.cached)try{result.cached=validateFeed(data.cached);}catch{}
  return result;
}
let watch=defaults();
try {watch=readStore(JSON.parse(localStorage.getItem(STORE)||'null'));}catch{}
let baseline=watch.lastVisit,requestSerial=0,pending=false,failure='',storageError=false,limit=20;
const dateFormat=new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'UTC'});
const date=value=>value && Number.isFinite(Date.parse(value))?dateFormat.format(new Date(value))+' UTC':'No successful check recorded';
const keyFor=e=>e.id+(e.revision>1?'@'+e.revision:'');
const changedAt=e=>e.changed_at||e.updated_at||e.discovered_at||'';
function save() {
  try{localStorage.setItem(STORE,JSON.stringify(watch));storageError=false;}
  catch{storageError=true;}
  const hint=$('watchStorage');if(hint)hint.textContent=storageError?'Device storage is full or unavailable. Export a backup before leaving.':'';
}
function changeSet(field,key) {
  const values=new Set(watch[field]);values.has(key)?values.delete(key):values.add(key);watch[field]=[...values].slice(-2000);
}
function button(label,click) {
  const b=element('button','button-outline small',label);b.type='button';b.addEventListener('click',click);return b;
}
function feedData() {
  return watch.cached || RELEASE_REFERENCE;
}
function isReference(d) {return ['REFERENCE_SNAPSHOT','NOT_DEPLOYED'].includes(d.collector_status)||!d.generated_at;}
function statusLine(d) {
  if(isReference(d)) return d.collector_status==='NOT_DEPLOYED'?'Collector awaiting first run':'Offline reference edition · originals checked '+(d.reference_checked||'on release');
  const age=(Date.now()-Date.parse(d.generated_at))/3600000;
  if(!Number.isFinite(age)||age < -0.1)return 'Collector time unavailable or inconsistent';
  const state=({ALL_SOURCES_FAILED:'Last run failed across all attempted sources',PARTIAL:'Last run had source access failures',RUN_COMPLETED:'Last run completed'})[d.collector_status]||'Collector state unknown';
  return (age>12?'Stale feed · ':'')+state+' · '+date(d.generated_at);
}
function passes(e,d) {
  const view=$('watchFilter')?.value||'all';
  const query=($('watchSearch')?.value||'').trim().toLowerCase();
  if(query && ![e.title,e.topic,e.source_name,e.summary].join(' ').toLowerCase().includes(query))return false;
  if(view==='last')return !isReference(d) && !!baseline && changedAt(e)>baseline;
  if(view==='unread')return !watch.seen.includes(keyFor(e));
  if(view==='saved')return watch.saved.includes(e.id);
  if(view==='review')return e.scope!=='original';
  if(view==='original')return e.scope==='original';
  if(view==='europe')return ['Europe','Flag'].includes(e.region);
  if(view==='inspection')return /sire|vetting|psc|inspec|cdi/i.test(e.topic+' '+e.title);
  return true;
}
function article(e) {
  const card=element('article','watch-card'),head=element('div','watch-card-head');
  head.append(element('span','watch-chip',e.source_name||e.source_id),element('span','watch-chip',e.topic||'General'));
  const title=element('h3','');title.append(link(e.url,e.title));
  card.append(head,title,element('p','micro',e.status_label||'Listing only · original pending'));
  if(e.summary)card.append(element('p','watch-summary',e.summary));
  const dates=[];
  if(e.published)dates.push('Published '+e.published);
  if(e.updated_at_source)dates.push('Publisher updated '+e.updated_at_source);
  if(e.event_start)dates.push('Event '+e.event_start+(e.event_end?' – '+e.event_end:''));
  if(e.verified_at)dates.push('Original checked '+e.verified_at.slice(0,10));
  if(e.legal_status)dates.push('Classification · '+e.legal_status);
  if(dates.length)card.append(element('p','micro',dates.join(' · ')));
  if(e.history?.length) {
    const detail=element('details','watch-history');detail.append(element('summary','', 'Revision '+e.revision+' · View earlier versions'));
    for(const old of e.history)detail.append(element('p','micro','v'+old.revision+' · '+String(old.at||'').slice(0,10)+' · '+old.title+(old.summary?' — '+old.summary:'')));
    card.append(detail);
  }
  const actions=element('div','watch-actions');
  const read=watch.seen.includes(keyFor(e)),saved=watch.saved.includes(e.id);
  const readBtn=button(read?'Reviewed':'Mark reviewed',()=>{changeSet('seen',keyFor(e));save();render();});
  const saveBtn=button(saved?'Saved':'Save',()=>{changeSet('saved',e.id);save();render();});
  readBtn.setAttribute('aria-pressed',String(read));saveBtn.setAttribute('aria-pressed',String(saved));
  actions.append(readBtn,saveBtn);card.append(actions);return card;
}
function lesson(l) {
  const card=element('article','watch-card');
  card.append(element('span','watch-chip',l.status||'Guided reading'),element('h3','',l.title),element('p','watch-summary',l.learning_objective||''));
  if(l.quiz) {
    const q=l.quiz,key=l.id+'@'+(l.version||1),selected=watch.answers[key];
    card.append(element('p','watch-question',q.question));
    const choices=element('div','watch-options');
    const result=element('p','micro');result.setAttribute('role','status');
    q.choices.forEach((choice,i)=>{const opt=button(choice,()=>{watch.answers[key]=i;save();renderLessons();});opt.setAttribute('aria-pressed',String(selected===i));choices.append(opt);});
    if(selected!==undefined)result.textContent=(selected===q.answer?'Correct. ':'Review the original. ')+q.explanation;
    card.append(choices,result);
  } else for(const q of (l.questions||[]).slice(0,4))card.append(element('p','micro',q));
  card.append(link(l.source_url,'Read the original'));return card;
}
let lessonLimit=6;
function renderLessons() {
  const root=$('watchLessons');root.replaceChildren();const list=feedData().lessons;
  for(const l of list.slice(0,lessonLimit))root.append(lesson(l));
  if(!list.length)root.append(element('p','subtle','No new guided study is available. The CO Academy remains available offline.'));
  if(list.length>lessonLimit)root.append(button('Show more study cards',()=>{lessonLimit+=12;renderLessons();}));
}
function render() {
  if(!$('watchStatus'))return;
  const d=feedData(),headline=statusLine(d);
  const status=$('watchStatus');status.textContent=(pending?'Checking feed… · ':'')+headline;
  $('watchError').textContent=failure || watch.lastError || '';
  $('watchStorage').textContent=storageError?'Device storage is unavailable or full. Export a backup before leaving.':'';
  const unread=d.entries.filter(e=>!watch.seen.includes(keyFor(e))).length;
  const recent=(!isReference(d)&&baseline)?d.entries.filter(e=>changedAt(e)>baseline).length:null;
  const short=$('watchOverview');if(short)short.textContent=headline+' · '+(recent===null?unread+' unread':recent+' new or revised since your previous visit');
  $('watchCounts').textContent=(isReference(d)?'Reference collection':recent===null?'First visit on this device':recent+' new or revised since your last visit')+' · '+unread+' unread · '+d.lessons.length+' study cards';
  const briefing=d.briefing;
  $('watchBrief').textContent=briefing?'Daily briefing · '+briefing.day+' UTC · '+briefing.added+' discovered · '+briefing.amended+' revised · '+briefing.checks+' recorded runs':'';
  const root=$('watchEntries');root.replaceChildren();const rows=d.entries.filter(e=>passes(e,d));
  for(const e of rows.slice(0,limit))root.append(article(e));
  if(!rows.length)root.append(element('p','subtle',$('watchFilter').value==='last'&&!baseline?'Your next visit will show changes since this visit.':'No publications match this view.'));
  $('watchMore').hidden=rows.length<=limit;$('watchMarkAll').disabled=!rows.length;
  const sources=$('watchSources');sources.replaceChildren();
  for(const s of d.sources) {
    const row=element('div','watch-source'),info=element('div','');
    const label=s.fetch_status==='not_checked'?'Awaiting check':s.ok?'Available':'Failed';
    info.append(element('strong','',s.name||s.id),element('p','micro','Last success · '+date(s.last_success)+(s.last_attempt?' | Attempt · '+date(s.last_attempt):'')));
    if(s.detail||s.error)info.append(element('p','micro',s.detail||s.error));
    row.append(info,element('span',s.ok?'status-ok':'status-fail',label));sources.append(row);
  }
  renderLessons();
}
async function getFeed(url, signal) {
  const target=new URL(url,location.href);
  if(!['http:','https:'].includes(target.protocol) || target.username || target.password || (target.origin!==location.origin&&target.protocol!=='https:'))throw Error('Enter a valid HTTPS feed');
  const credentials=target.origin===location.origin?'same-origin':extension && target.origin===HOSTED?'include':'omit';
  const response=await fetch(target.href,{signal,cache:'no-store',credentials,referrerPolicy:'no-referrer'});
  if(!response.ok)throw Error('Feed returned HTTP '+response.status);
  if((response.headers.get('content-type')||'').includes('text/html'))throw Error('Sign in through Open private Watch to use this hosted feed');
  const max=2600000,reader=response.body?.getReader();
  if(!reader || Number(response.headers.get('content-length')||0)>max)throw Error('Feed exceeds the supported size or could not be read');
  const decoder=new TextDecoder();let body='',count=0;
  try{for(;;){const {value,done}=await reader.read();if(done)break;count+=value.length;if(count>max){await reader.cancel();throw Error('Feed exceeds the supported size');}body+=decoder.decode(value,{stream:true});}}
  finally{reader.releaseLock();}
  return validateFeed(JSON.parse(body+decoder.decode()));
}
async function refresh(force=false) {
  if(!watch.url || (pending&&!force)){render();return;}
  const serial=++requestSerial,controller=new AbortController();pending=true;failure='';render();
  const timeout=setTimeout(()=>controller.abort(),15000);
  try {
    const d=await getFeed(watch.url,controller.signal);
    if(serial!==requestSerial)return;
    // A release placeholder or a failed source run may still contain useful older records.
    if(d.collector_status==='NOT_DEPLOYED'&&!d.entries.length) {
      watch.lastError='This feed has no collector run yet. Showing the last available reading collection.';save();return;
    }
    if(watch.cached?.generated_at && d.generated_at && Date.parse(d.generated_at)<Date.parse(watch.cached.generated_at))throw Error('Received an older snapshot');
    watch.cached=d;watch.lastRead=new Date().toISOString();watch.lastError='';
    if(d.generated_at && Number.isFinite(Date.parse(d.generated_at)))watch.lastVisit=d.generated_at;
    save();
  }catch(e){if(serial===requestSerial){failure='Feed refresh failed. '+(e.name==='AbortError'?'Connection timed out.':String(e.message||e))+'. Showing the last available reading collection.';watch.lastError=failure;save();}}
  finally{clearTimeout(timeout);if(serial===requestSerial){pending=false;render();}}
}
export function exportWatchBackup() {return {...watch};}
export function importWatchBackup(data) {
  if(!data||typeof data!=='object')return;
  requestSerial++;pending=false;watch=readStore(data);baseline=watch.lastVisit;failure='';save();render();
  if($('watchFeedUrl'))$('watchFeedUrl').value=watch.url;
}
let lastAttempt=0;
export function onWatchPage() {
  render();if(watch.url&&!pending&&Date.now()-lastAttempt>20*60*1000){lastAttempt=Date.now();refresh();}
}
export function wireWatch() {
  if(!$('watchSaveUrl'))return;
  $('watchFeedUrl').value=watch.url;
  $('watchHosted').href=HOSTED+'/#watch';
  $('watchSaveUrl').addEventListener('click',async()=>{
    const value=$('watchFeedUrl').value.trim()||defaultURL;
    try {
      if(value){
        const u=new URL(value,location.href);
        if(u.protocol!=='https:' && !(value===defaultURL && u.origin===location.origin))throw Error('Use an HTTPS feed');
        if(u.username||u.password)throw Error('Remove credentials from the URL');
        if(extension && !await chrome.permissions.request({origins:[u.origin+'/*']}))throw Error('Feed permission was declined');
      }
      if(watch.url!==value){watch.cached=null;watch.lastVisit='';watch.lastRead='';watch.lastError='';baseline='';}
      watch.url=value;save();lastAttempt=Date.now();await refresh(true);
    }catch(e){failure=e.message;render();}
  });
  $('watchRefresh').addEventListener('click',()=>{lastAttempt=Date.now();refresh(true);});
  $('watchMarkAll').addEventListener('click',()=>{
    const data=feedData(),shown=data.entries.filter(e=>passes(e,data)).slice(0,limit);
    watch.seen=[...new Set([...watch.seen,...shown.map(keyFor)])].slice(-2000);save();render();
  });
  $('watchMore').addEventListener('click',()=>{limit+=30;render();});
  for(const id of ['watchFilter','watchSearch'])$(id).addEventListener(id==='watchSearch'?'input':'change',()=>{limit=20;render();});
  // The overview and Watch share one refresh, even if both initialise at the same time.
  if(extension && watch.url===defaultURL) {
    render();chrome.permissions.contains({origins:[HOSTED+'/*']}).then(granted=>{if(granted)onWatchPage();else lastAttempt=Date.now();}).catch(()=>{});
  } else onWatchPage();
}
