import {ensurePractice,sanitizePractice,rateQuestion} from './training_engine.js';
import {ensurePlanner,restorePlanner,plannerAction,plannerStats} from './planner_engine.js';
import {BASE_SOURCES, DEFAULT_SETTINGS} from './config.js';
import {INSPECTIONS, LEARNING_MODULES, CO_ROUTINES} from './inspection_data.js';
const KEY='coIntelligenceV1';const ALARM='coIntelligenceCheck';
let refreshPromise=null,offscreenCreating=null;
const initState=()=>({settings:{...DEFAULT_SETTINGS},customSources:[],items:[],statuses:{},lastCheck:'',refreshing:false,runCount:0,inspectionContext:{vessel:'',port:'',date:''},inspectionRecords:{},studiedModules:{},routineChecks:{day:'',checks:{}},practice:{reviews:{},sessions:0},planner:{profile:{vessel:'',port:'',eta:'',activity:'general'},tasks:[],templates:[]}});
async function getState(){
 const data=(await chrome.storage.local.get(KEY))[KEY]||initState();
 data.settings={...DEFAULT_SETTINGS,...(data.settings||{})};
 data.customSources??=[];data.items??=[];data.statuses??={};
 data.inspectionContext??={vessel:'',port:'',date:''};data.inspectionRecords??={};data.studiedModules??={};data.routineChecks??={day:'',checks:{}};ensurePlanner(data);ensurePractice(data);return data;
}
async function saveState(s){await chrome.storage.local.set({[KEY]:s}); await setBadge(s);}
async function setBadge(s){
 const count=s.items.filter(x=>!x.read&&x.priority==='high').length;
 try{await chrome.action.setBadgeBackgroundColor({color:'#ec8c4e'});await chrome.action.setBadgeText({text:count?String(Math.min(count,99)):'',});}
 catch(e){/* badge optional */}
}
function getSources(s){return [...BASE_SOURCES,...s.customSources].filter(x=>s.settings.enabledIds.includes(x.id));}
function tokenize(s){return String(s||'').toLowerCase().normalize('NFKD');}
function classify(t,src,settings){
 const v=tokenize(t.title+' '+t.summary);
 const patterns=[
  ['Port State Control',/psc|paris mou|tokyo mou|concentrated inspection|detention|cic\b|refusal of access|deficienc/],
  ['Vetting & inspection',/sire|vetting|ocimf|viq|tmsa|cdi\b|chemical distribution institute|terminal inspection|audit/],
  ['Cargo & chemicals',/chemical|tanker|cargo|annex ii|ibc code|prewash|stripp|tank clean|wall wash|tank vent|inert|gas-free|msds|sds|vapour|toxic|edc|xylene|benzene/],
  ['Environment',/marpol|emission|pollution|fuelEU|eu ets|carbon|ballast|bwm|biofouling|ghg|co2|sulphur|greenhouse/],
  ['Security & trade',/piracy|attack|security|sanction|red sea|black sea|hormuz|war risk|strait|seafarer protection/],
  ['Safety & crew',/solas|enclosed space|rescue|lifeboat|fire|safety|stcw|mlc|incident|accident|mooring|seafarer/],
  ['Navigation',/navigation|ecdis|pilotage|chart|ais\b|gmdss|bridge|voyage|collision/]
 ];
 let category=patterns.find(([,rx])=>rx.test(v))?.[0]||'Maritime industry';
 const topics=[];
 if(/chemical|tanker|cargo|ibc|annex ii|prewash|stripp|inert|tank clean|wall wash/.test(v))topics.push('CHEMICAL TANKER');
 if(/eu|europe|paris mou|fueleu|ets|mediterranean|baltic|north sea|cyprus|uk\b|rotterdam|amsterdam/.test(v)||src.region==='Europe'||src.region==='Flag')topics.push('EUROPE');
 if(src.id==='cyprus')topics.push('CYPRUS FLAG');
 if(/inspection|audit|psc|sire|cdi\b|vetting|mou|deficienc/.test(v))topics.push('INSPECTIONS');
 let score=0;
 if(src.kind==='Flag Administration'||src.kind==='Authority'||src.kind==='PSC Authority')score+=12;
 if(/\b(circular|amendment|mandatory|effective|enters? into force|entry into force|new regulation|requirements?|prohibition|safety alert|immediate|urgent|deadline|restricted|detention|ban)\b/.test(v))score+=35;
 if(/\b(chemical tanker|marpol|solas|ibc code|sire 2\.0|cdi|prewash|port state control|concentrated inspection campaign|fueleu|eu ets|risk assessment|enclosed space)\b/.test(v))score+=30;
 if(/\b(tanker|chemical|cargo|safety|inspection|pollution|security|vetting|navigation|mooring|tank cleaning)\b/.test(v))score+=17;
 if(src.id==='cyprus')score+=18;
 if(src.id==='paris'&&/concentrated|campaign|inspection|deficienc/.test(v))score+=20;
 const userKeywords=(settings.keywords||'').split(',').map(x=>x.trim().toLowerCase()).filter(x=>x.length>2);
 if(userKeywords.some(k=>v.includes(k)))score+=12;
 if(settings.europeFirst&&topics.includes('EUROPE'))score+=8;
 const priority=score>=58?'high':score>=25?'medium':'low';
 let recommendation='Read the original publication and determine if it applies to your vessel, flag, cargo, location and operation.';
 if(category==='Cargo & chemicals')recommendation='Compare the source with your ship’s P&A Manual, IBC cargo conditions, SDS, cargo plan and company SMS.';
 if(category==='Port State Control')recommendation='Check inspection focus, current campaign dates, certificates, logs, maintenance and crew familiarity.';
 if(category==='Vetting & inspection')recommendation='Review the official OCIMF programme guidance and vessel/company SIRE 2.0 preparations.';
 if(category==='Environment')recommendation='Confirm applicability by ship type, GT, voyage and effective date using the primary legal instrument.';
 if(category==='Security & trade')recommendation='Check flag/company security instructions, official warnings and voyage-specific risk assessment.';
 const statusLabel=src.id==='cyprus'?'Flag circular: confirm applicability':src.kind.includes('Industry')?'Industry information, not legislation':src.kind==='Authority'||src.kind==='PSC Authority'||src.kind==='EU Agency'?'Official information: verify legal status':'Agency news: verify legal status';
 return {priority,category,topics,recommendation,statusLabel};
}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
function validItem(x,src,s){
 if(!x||typeof x.title!=='string'||typeof x.url!=='string')return null;
 let u;try{u=new URL(x.url);if(!/^https?:$/.test(u.protocol))return null;}catch{return null;}
 let published='';
 if(/^20\d\d-\d\d-\d\d$/.test(x.date||'')&&!Number.isNaN(Date.parse(x.date)))published=x.date;
 if(published&&Date.parse(published)>Date.now()+86400000)return null;
 if(published&&s.settings.maxAgeDays&&Date.now()-Date.parse(published)>s.settings.maxAgeDays*86400000)return null;
 const title=x.title.replace(/\s+/g,' ').trim().slice(0,220),summary=(x.summary||'').replace(/\s+/g,' ').trim().slice(0,350);
 if(title.length<12)return null;
 const canonical=u.href.split('#')[0];
 return {id:hash(src.id+'|'+canonical+'|'+title.toLowerCase()),sourceId:src.id,source:src.name,url:canonical,title,summary,published,seenAt:new Date().toISOString(),read:false,saved:false,note:'',...classify({title,summary},src,s.settings)};
}
async function assureOffscreen(){
 if(await chrome.offscreen.hasDocument())return;
 if(offscreenCreating)return offscreenCreating;
 offscreenCreating=chrome.offscreen.createDocument({url:'offscreen.html',reasons:['DOM_PARSER'],justification:'Parse public RSS/XML/HTML safely to extract news links and circular listings.'});
 try{await offscreenCreating;}finally{offscreenCreating=null;}
}
async function fetchOne(source){
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
 try{
  const res=await fetch(source.url,{signal:controller.signal,credentials:'omit',redirect:'follow',headers:{'Accept':'application/rss+xml, application/atom+xml, application/xml, text/html;q=0.9, */*;q=0.7'}});
  if(!res.ok)throw Error(`HTTP ${res.status}${res.status===403?' (access restricted)':''}`);
  const size=Number(res.headers.get('content-length'));
  if(size>2_400_000)throw Error('Page too large; inspect manually');
  const raw=(await res.text()).slice(0,2_400_000);
  if(!raw||/\/member-login|\/login\b/i.test(res.url)&&res.url!==source.url)throw Error('Source requires login');
  await assureOffscreen();
  const data=await chrome.runtime.sendMessage({type:'PARSE_HTML',source,raw});
  if(!data?.ok)throw Error(data?.error||'Parser failed');
  if(!data.items?.length)throw Error('No extractable entries. Site layout / access may have changed.');
  return data.items;
 }finally{clearTimeout(timer);}
}
async function refreshAll({manual=false}={}){
 if(refreshPromise)return refreshPromise;
 refreshPromise=(async()=>{
  let s=await getState();s.refreshing=true;s.refreshStart=new Date().toISOString();await saveState(s);
  const sources=getSources(s);const results=await Promise.all(sources.map(async src=>{
   try{const values=await fetchOne(src);return {src,values};}
   catch(e){return {src,error:String(e.message||e)}};
  }));
  s=await getState();const current=new Map(s.items.map(x=>[x.id,x]));let newCount=0,newHigh=[];
  for(const result of results){
   const {src,values,error}=result;
   if(error){s.statuses[src.id]={ok:false,when:new Date().toISOString(),error,count:0};continue;}
   let added=0;
   for(const v of values){
    const candidate=validItem(v,src,s);if(!candidate)continue;
    if(!current.has(candidate.id)){
     current.set(candidate.id,candidate);added++;newCount++;
     if(s.runCount>0&&candidate.priority==='high')newHigh.push(candidate);
    }
   }
   s.statuses[src.id]={ok:true,when:new Date().toISOString(),count:values.length,newItems:added};
  }
  s.items=[...current.values()].sort((a,b)=>(b.published||b.seenAt.slice(0,10)).localeCompare(a.published||a.seenAt.slice(0,10))||({high:3,medium:2,low:1}[b.priority]-{high:3,medium:2,low:1}[a.priority])).slice(0,1400);
  s.lastCheck=new Date().toISOString();s.runCount=(s.runCount||0)+1;s.lastRunNew=newCount;s.refreshing=false;await saveState(s);
  if(s.settings.notify&&newHigh.length>0){
   const msg=newHigh.length===1?newHigh[0].title:`${newHigh.length} new priority items: ${newHigh.slice(0,2).map(x=>x.source.split(' · ')[0]).join(', ')}`;
   try{await chrome.notifications.create('co-latest-'+Date.now(),{type:'basic',title:'Tanker Intelligence · review',message:msg.slice(0,210),iconUrl:'icons/icon128.png',priority:1});}catch{}
  }
  return {newCount,sources:sources.length,ok:results.filter(x=>x.values).length};
 })().catch(async e=>{const s=await getState();s.refreshing=false;s.lastError=String(e.message||e);await saveState(s);throw e;}).finally(()=>{refreshPromise=null;});
 return refreshPromise;
}
// Best-effort once-a-day reminder while desktop Chrome is running. No background guarantee on Android.
async function maybeNotifyPlanner(){
 const s=await getState();if(!s.settings.notify)return;
 const p=ensurePlanner(s),today=new Date();
 const date=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
 if(p.reminderSentDay===date)return;
 const stats=plannerStats(p,date),pending=stats.today+stats.overdue;
 if(!pending)return;
 try {
  await chrome.notifications.create('co-planner-'+date,{type:'basic',title:'CO Planner · action reminder',message:`${stats.overdue} overdue and ${stats.today} due today. Review your action register and verify tasks onboard.`,iconUrl:'icons/icon128.png',priority:1});
  p.reminderSentDay=date;await saveState(s);
 }catch(e){/* no permission / notification setting: the dashboard still shows due tasks */}
}
async function configureAlarm(){const s=await getState();await chrome.alarms.clear(ALARM);await chrome.alarms.create(ALARM,{periodInMinutes:Number(s.settings.intervalMinutes)||60});}
chrome.runtime.onInstalled.addListener(async()=>{await configureAlarm();await setBadge(await getState());await refreshAll().catch(()=>{});await maybeNotifyPlanner().catch(()=>{});});
chrome.runtime.onStartup.addListener(async()=>{await configureAlarm();await refreshAll().catch(()=>{});await maybeNotifyPlanner().catch(()=>{});});
chrome.alarms.onAlarm.addListener(alarm=>{if(alarm.name===ALARM){refreshAll().catch(()=>{});maybeNotifyPlanner().catch(()=>{});}});
chrome.action.onClicked.addListener(()=>chrome.tabs.create({url:chrome.runtime.getURL('dashboard.html')}));
chrome.notifications.onClicked.addListener(id=>chrome.tabs.create({url:chrome.runtime.getURL(String(id).startsWith('co-planner-')?'dashboard.html#planner':'dashboard.html')}));
chrome.runtime.onMessage.addListener((msg,sender,send)=>{
 if(!msg?.type)return false;
 (async()=>{
  if(String(msg.type||'').startsWith('PLANNER_')){const s=await getState();const result=plannerAction(s,msg);if(result?.ok)await saveState(s);return result;}
  if(msg.type==='REFRESH'){if(!refreshPromise)refreshAll({manual:true}).catch(()=>{});return {ok:true};}
  if(msg.type==='GET_STATE')return {ok:true,state:await getState()};
  if(msg.type==='SAVE_INSPECTION_CONTEXT'){
   const s=await getState(),x=msg.context||{};
   const vessel=String(x.vessel||'').trim().slice(0,60),port=String(x.port||'').trim().slice(0,80),date=String(x.date||'');
   s.inspectionContext={vessel,port,date:/^\d{4}-\d\d-\d\d$/.test(date)?date:''};await saveState(s);return {ok:true};
  }
  if(msg.type==='UPDATE_INSPECTION_CHECK'){
   const s=await getState(),type=String(msg.inspection||''),itemId=String(msg.itemId||''),vessel=String(msg.vessel||'').slice(0,60).toLowerCase().trim()||'default';
   if(!INSPECTIONS[type]?.items.some(x=>x.id===itemId))return {ok:false,error:'Unknown checklist item'};
   const key=type+':'+vessel;
   if(!s.inspectionRecords[key])s.inspectionRecords[key]={};
   const old=s.inspectionRecords[key][itemId]||{};
   const status=['pending','verified','action','na'].includes(msg.status)?msg.status:old.status||'pending';
   const note=String(msg.note??old.note??'').slice(0,1500);
   s.inspectionRecords[key][itemId]={status,note,updatedAt:new Date().toISOString()};
   await saveState(s);return {ok:true};
  }
  if(msg.type==='RESET_INSPECTION'){
   const s=await getState(),type=String(msg.inspection||''),vessel=String(msg.vessel||'').slice(0,60).toLowerCase().trim()||'default';
   if(!INSPECTIONS[type])return {ok:false,error:'Unknown inspection type'};
   delete s.inspectionRecords[type+':'+vessel];await saveState(s);return {ok:true};
  }
  if(msg.type==='UPDATE_ROUTINE'){
   const s=await getState(),rid=String(msg.routine||''),idx=Number(msg.step),day=String(msg.day||'');
   const routine=CO_ROUTINES.find(x=>x.id===rid);
   if(!routine||!Number.isInteger(idx)||idx<0||idx>=routine.steps.length||!/^\d{4}-\d\d-\d\d$/.test(day))return {ok:false,error:'Invalid routine check'};
   if(s.routineChecks.day!==day)s.routineChecks={day,checks:{}};
   if(msg.checked)s.routineChecks.checks[rid+':'+idx]=true;else delete s.routineChecks.checks[rid+':'+idx];
   await saveState(s);return {ok:true};
  }
  if(msg.type==='UPDATE_STUDY'){
   const s=await getState(),id=String(msg.id||'');
   if(!LEARNING_MODULES.some(x=>x.id===id))return {ok:false,error:'Unknown learning module'};
   if(msg.reviewed)s.studiedModules[id]=new Date().toISOString();else delete s.studiedModules[id];
   await saveState(s);return {ok:true};
  }
  if(msg.type==='TRAINING_RATE'){const s=await getState(),res=rateQuestion(s,String(msg.questionId||''),String(msg.rating||''));if(res.ok)await saveState(s);return res;}
  if(msg.type==='UPDATE_ITEM'){
   const s=await getState();const item=s.items.find(x=>x.id===msg.id);if(!item)return {ok:false,error:'Item not found'};
   if(['read','saved','note'].includes(msg.field))item[msg.field]=msg.field==='note'?String(msg.value||'').slice(0,2000):Boolean(msg.value);
   await saveState(s);return {ok:true};
  }
  if(msg.type==='SAVE_SETTINGS'){
   const s=await getState();const input=msg.settings||{};
   s.settings={...s.settings,...input,intervalMinutes:Math.max(30,Math.min(1440,Number(input.intervalMinutes)||60))};
   await saveState(s);await configureAlarm();return {ok:true};
  }
  if(msg.type==='ADD_SOURCE'){
   const s=await getState();let uri;try{uri=new URL(msg.url);if(!/^https?:$/.test(uri.protocol))throw Error();}catch{return {ok:false,error:'Enter a valid HTTPS/HTTP URL.'};}
   if([...BASE_SOURCES,...s.customSources].some(x=>x.url===uri.href))return {ok:false,error:'This source is already listed.'};
   const id='custom-'+hash(uri.href);s.customSources.push({id,name:String(msg.name||uri.hostname).slice(0,80),url:uri.href,mode:'feed',region:'Global',kind:'Custom RSS / Atom',icon:'RSS'});
   s.settings.enabledIds.push(id);await saveState(s);return {ok:true};
  }
  if(msg.type==='DELETE_SOURCE'){
   const s=await getState();s.customSources=s.customSources.filter(x=>x.id!==msg.id);s.settings.enabledIds=s.settings.enabledIds.filter(x=>x!==msg.id);await saveState(s);return {ok:true};
  }
  if(msg.type==='IMPORT_STATE'){
   const old=await getState();const val=msg.value;
   if(!val||!Array.isArray(val.items)||!val.settings)return {ok:false,error:'Unrecognised backup format.'};
   const safe={...initState(),...old,settings:{...DEFAULT_SETTINGS,...val.settings},customSources:Array.isArray(val.customSources)?val.customSources.filter(x=>x.id?.startsWith('custom-')&&/^https?:\/\//.test(x.url||'')).slice(0,25):[],items:val.items.filter(x=>typeof x.id==='string'&&typeof x.title==='string'&&/^https?:\/\//.test(x.url||'')).slice(0,1400),statuses:{},refreshing:false,inspectionContext:val.inspectionContext&&typeof val.inspectionContext==='object'?{vessel:String(val.inspectionContext.vessel||'').slice(0,60),port:String(val.inspectionContext.port||'').slice(0,80),date:String(val.inspectionContext.date||'').slice(0,10)}:{vessel:'',port:'',date:''},inspectionRecords:val.inspectionRecords&&typeof val.inspectionRecords==='object'?val.inspectionRecords:{},studiedModules:val.studiedModules&&typeof val.studiedModules==='object'?val.studiedModules:{},routineChecks:val.routineChecks&&typeof val.routineChecks==='object'?val.routineChecks:{day:'',checks:{}},practice:sanitizePractice(val.practice||old.practice),planner:restorePlanner(val.planner||old.planner)};
   await saveState(safe);await configureAlarm();return {ok:true};
  }
  return {ok:false,error:'Unknown request'};
 })().then(send).catch(e=>send({ok:false,error:String(e.message||e)}));
 return true;
});
