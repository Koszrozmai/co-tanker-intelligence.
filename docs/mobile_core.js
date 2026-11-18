import {ensurePractice,sanitizePractice,rateQuestion} from './training_engine.js';
import {ensurePlanner,restorePlanner,plannerAction,plannerStats} from './planner_engine.js';
import {BASE_SOURCES, DEFAULT_SETTINGS} from './config.js';
import {INSPECTIONS, LEARNING_MODULES, CO_ROUTINES} from './inspection_data.js';
import {parse} from './parser_pwa.js';
import {validItem,hash} from './classification.js';
const KEY='coIntelligenceV1', FRESHNESS='co_intelligence_last_open_check';
const initState=()=>({settings:{...DEFAULT_SETTINGS},customSources:[],items:[],statuses:{},lastCheck:'',refreshing:false,runCount:0,inspectionContext:{vessel:'',port:'',date:''},inspectionRecords:{},studiedModules:{},routineChecks:{day:'',checks:{}},practice:{reviews:{},sessions:0},planner:{profile:{vessel:'',port:'',eta:'',activity:'general'},tasks:[],templates:[]}});
let storageBlocked=false; let fallbackState=initState();let refreshPromise=null;
async function getState(){
  let data;try {data=JSON.parse(localStorage.getItem(KEY)||'null');}catch {storageBlocked=true;}
  data=data||fallbackState;
  data.settings={...DEFAULT_SETTINGS,...(data.settings||{})};
  data.customSources??=[];data.items??=[];data.statuses??={};
  data.inspectionContext??={vessel:'',port:'',date:''};data.inspectionRecords??={};data.studiedModules??={};data.routineChecks??={day:'',checks:{}};ensurePlanner(data);ensurePractice(data);
  if(data.refreshing&&(!data.refreshStart||Date.now()-Date.parse(data.refreshStart)>60000))data.refreshing=false; // recover interrupted prior run
  return data;
}
async function saveState(s){fallbackState=s;try{localStorage.setItem(KEY,JSON.stringify(s));storageBlocked=false;}catch(e){storageBlocked=true;throw Error('Local browser storage is unavailable or full. Export your backup and check browser storage permissions.');}}
const getSources=s=>[...BASE_SOURCES,...s.customSources].filter(x=>s.settings.enabledIds.includes(x.id));
async function fetchOne(source){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),14000);
  try {
    // Hosted PWA on Netlify with a deployed Function: browsers cannot fetch many sites due to CORS.
    // An unavailable proxy is reported honestly; no invented "no changes" result.
    const netlifyHost=location.hostname.endsWith('.netlify.app');
    const isDefault=BASE_SOURCES.some(x=>x.id===source.id);
    let res;
    if(netlifyHost&&isDefault){
      res=await fetch('/.netlify/functions/source?id='+encodeURIComponent(source.id),{signal:controller.signal,cache:'no-store'});
      if(res.status===404)throw Error('News relay not deployed. Publish the Netlify Function via Git or Netlify CLI; offline features still work.');
    }else{
      res=await fetch(source.url,{signal:controller.signal,credentials:'omit',redirect:'follow',mode:'cors'});
    }
    if(!res.ok)throw Error('HTTP '+res.status+(res.status===403?' (access restricted)':''));
    const raw=(await res.text()).slice(0,2_400_000);
    if(!raw)throw Error('Empty response');
    const list=parse(source,raw);
    if(!list.length)throw Error('No extractable updates; website layout / permissions may have changed.');
    return list;
  }finally{clearTimeout(timer);}
}
async function refreshAll(){
 if(refreshPromise)return refreshPromise;
 refreshPromise=(async()=>{
  let s=await getState();s.refreshing=true;s.refreshStart=new Date().toISOString();await saveState(s);
  const sources=getSources(s);
  const results=await Promise.all(sources.map(async src=>{try{return{src,values:await fetchOne(src)}}catch(e){return{src,error:String(e.message||e)}}}));
  s=await getState();s.refreshing=true;const current=new Map(s.items.map(x=>[x.id,x]));let newCount=0;
  for(const result of results){const {src,values,error}=result;
   if(error){s.statuses[src.id]={ok:false,when:new Date().toISOString(),error,count:0};continue;}
   let added=0;for(const entry of values){const candidate=validItem(entry,src,s);if(!candidate)continue;
    if(!current.has(candidate.id)){current.set(candidate.id,candidate);added++;newCount++;}}
   s.statuses[src.id]={ok:true,when:new Date().toISOString(),count:values.length,newItems:added};
  }
  s.items=[...current.values()].sort((a,b)=>(b.published||b.seenAt.slice(0,10)).localeCompare(a.published||a.seenAt.slice(0,10))||({high:3,medium:2,low:1}[b.priority]-{high:3,medium:2,low:1}[a.priority])).slice(0,1200);
  s.lastCheck=new Date().toISOString();s.runCount=(s.runCount||0)+1;s.lastRunNew=newCount;s.refreshing=false;await saveState(s);
  return {ok:true,newCount,sources:sources.length,okSources:results.filter(x=>x.values).length};
 })().catch(async e=>{let s=await getState();s.refreshing=false;s.lastError=String(e.message||e);try{await saveState(s)}catch{}throw e}).finally(()=>{refreshPromise=null});
 return refreshPromise;
}
async function handle(msg){
 if(String(msg.type||'').startsWith('PLANNER_')){const s=await getState(),r=plannerAction(s,msg);if(r?.ok)await saveState(s);return r;}
 if(msg.type==='GET_STATE')return {ok:true,state:await getState()};
 if(msg.type==='REFRESH') {refreshAll().catch(()=>{});return {ok:true};}
 if(msg.type==='SAVE_INSPECTION_CONTEXT'){const s=await getState(),x=msg.context||{};
  s.inspectionContext={vessel:String(x.vessel||'').trim().slice(0,60),port:String(x.port||'').trim().slice(0,80),date:/^\d{4}-\d\d-\d\d$/.test(String(x.date||''))?x.date:''};await saveState(s);return {ok:true};}
 if(msg.type==='UPDATE_INSPECTION_CHECK'){
  const s=await getState(),type=String(msg.inspection||''),itemId=String(msg.itemId||''),vessel=String(msg.vessel||'').slice(0,60).toLowerCase().trim()||'default';
  if(!INSPECTIONS[type]?.items.some(x=>x.id===itemId))return {ok:false,error:'Unknown checklist item'};
  const key=type+':'+vessel;if(!s.inspectionRecords[key])s.inspectionRecords[key]={};
  const old=s.inspectionRecords[key][itemId]||{};
  const status=['pending','verified','action','na'].includes(msg.status)?msg.status:old.status||'pending';
  const note=String(msg.note??old.note??'').slice(0,1500);
  s.inspectionRecords[key][itemId]={status,note,updatedAt:new Date().toISOString()};await saveState(s);return {ok:true};
 }
 if(msg.type==='RESET_INSPECTION'){const s=await getState(),type=String(msg.inspection||''),vessel=String(msg.vessel||'').slice(0,60).toLowerCase().trim()||'default';
  if(!INSPECTIONS[type])return {ok:false,error:'Unknown inspection type'};delete s.inspectionRecords[type+':'+vessel];await saveState(s);return {ok:true};}
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
  if(msg.reviewed)s.studiedModules[id]=new Date().toISOString();else delete s.studiedModules[id];await saveState(s);return {ok:true};}
 if(msg.type==='TRAINING_RATE'){const s=await getState(),res=rateQuestion(s,String(msg.questionId||''),String(msg.rating||''));if(res.ok)await saveState(s);return res;}
 if(msg.type==='UPDATE_ITEM'){
  const s=await getState(),item=s.items.find(x=>x.id===msg.id);if(!item)return {ok:false,error:'Item not found'};
  if(['read','saved','note'].includes(msg.field))item[msg.field]=msg.field==='note'?String(msg.value||'').slice(0,2000):Boolean(msg.value);
  await saveState(s);return {ok:true};}
 if(msg.type==='SAVE_SETTINGS'){
  const s=await getState(),input=msg.settings||{};
  s.settings={...s.settings,...input,intervalMinutes:Math.max(30,Math.min(1440,Number(input.intervalMinutes)||60))};
  await saveState(s);return {ok:true};}
 if(msg.type==='ADD_SOURCE'){
  const s=await getState();let uri;try{uri=new URL(msg.url);if(!/^https?:$/.test(uri.protocol))throw Error();}catch{return {ok:false,error:'Enter a valid HTTPS URL.'};}
  if([...BASE_SOURCES,...s.customSources].some(x=>x.url===uri.href))return {ok:false,error:'Source already listed'};
  const id='custom-'+hash(uri.href);s.customSources.push({id,name:String(msg.name||uri.hostname).slice(0,80),url:uri.href,mode:'feed',region:'Global',kind:'Custom RSS / Atom',icon:'RSS'});s.settings.enabledIds.push(id);await saveState(s);return{ok:true};}
 if(msg.type==='DELETE_SOURCE'){
  const s=await getState();s.customSources=s.customSources.filter(x=>x.id!==msg.id);s.settings.enabledIds=s.settings.enabledIds.filter(x=>x!==msg.id);await saveState(s);return{ok:true};}
 if(msg.type==='IMPORT_STATE'){
  const old=await getState(),val=msg.value;
  if(!val||!Array.isArray(val.items)||!val.settings)return {ok:false,error:'Unrecognised backup format.'};
  const s={...initState(),...old,settings:{...DEFAULT_SETTINGS,...val.settings},customSources:Array.isArray(val.customSources)?val.customSources.filter(x=>x.id?.startsWith('custom-')&&/^https?:\/\//.test(x.url||'')).slice(0,25):[],items:val.items.filter(x=>typeof x.id==='string'&&typeof x.title==='string'&&/^https?:\/\//.test(x.url||'')).slice(0,1200),statuses:{},refreshing:false,inspectionContext:val.inspectionContext&&typeof val.inspectionContext==='object'?{vessel:String(val.inspectionContext.vessel||'').slice(0,60),port:String(val.inspectionContext.port||'').slice(0,80),date:String(val.inspectionContext.date||'').slice(0,10)}:{vessel:'',port:'',date:''},inspectionRecords:val.inspectionRecords&&typeof val.inspectionRecords==='object'?val.inspectionRecords:{},studiedModules:val.studiedModules&&typeof val.studiedModules==='object'?val.studiedModules:{},routineChecks:val.routineChecks&&typeof val.routineChecks==='object'?val.routineChecks:{day:'',checks:{}},practice:sanitizePractice(val.practice||old.practice),planner:restorePlanner(val.planner||old.planner)};
  await saveState(s);return {ok:true};
 }
 return {ok:false,error:'Unknown request'};
}
const sendMessage=async msg=>{try{return await handle(msg||{})}catch(e){return {ok:false,error:String(e.message||e)}}};
// A narrowly scoped compatibility bridge reuses the tested dashboard; it does not install an Android extension.
globalThis.chrome={runtime:{sendMessage},permissions:{request:async()=>true}};
const hint=document.getElementById('mobileHint');
const isLocal=location.protocol==='file:';
if(isLocal)hint.textContent='Standalone Samsung file · PSC/SIRE/CDI, Academy and notes work offline. Live news refresh may be blocked by browser security (CORS). For full feed use the hosted PWA with a relay.';
else if(location.hostname==='co-tanker-intelligence-watch.koszykrozmaity.chatgpt.site')hint.textContent='Private Watch · Read the scheduled briefing and practise with sources. Checklists and notes are stored on this device.';
else if(!location.hostname.endsWith('.netlify.app'))hint.textContent='Samsung PWA · Offline inspection & Academy ready. Some public sites block direct browser fetches; enable a trusted server relay for the live news feed.';
if('serviceWorker' in navigator && location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
let lastRefreshRun=0;
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')lastRefreshRun=Date.now();});
setInterval(async()=>{
 if(document.visibilityState!=='visible'||refreshPromise)return;
 const s=await getState();if(!s.lastCheck)return;
 const gap=(Number(s.settings.intervalMinutes)||60)*60000;
 if(Date.now()-Date.parse(s.lastCheck)>gap && Date.now()-lastRefreshRun>60000){lastRefreshRun=Date.now();refreshAll().catch(()=>{});}
},60000);
await import('./dashboard.js');
