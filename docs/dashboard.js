import {wireWatch,onWatchPage,exportWatchBackup,importWatchBackup} from './always_on_ui.js';
import {wirePractice,renderPractice} from './training_ui.js';
import {wirePlanner,renderPlanner,renderPlannerMini} from './planner_ui.js';
import {BASE_SOURCES,QUICK_LINKS,TOPICS} from './config.js';
import {INSPECTIONS, LEARNING_MODULES, CO_ROUTINES} from './inspection_data.js';
let state=null,page='overview',displayLimit=45,expanded=new Set(),currentResults=[],toastTimer=null;
const el=id=>document.getElementById(id);
const send=(type,rest={})=>chrome.runtime.sendMessage({type,...rest});
const node=(tag,cls='',txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
const append=(parent,...children)=>{for(const c of children)if(c)parent.append(c);return parent;};
const fmtDate=v=>{if(!v)return 'Publication date not provided'; const d=new Date(v.slice(0,10)+'T12:00:00Z');return Number.isNaN(d.valueOf())?'Publication date not provided':new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(d);};
const fmtWhen=v=>v?new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(v)):'Never';
function showToast(msg,error=false){const b=el('toast');b.textContent=msg;b.style.background=error?'#ffc3ad':'#b4eee2';b.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>b.classList.remove('show'),3200);}
function link(url,label,cls=''){const a=node('a',cls,label);if(/^https?:\/\//i.test(url||'')){a.href=url;a.target='_blank';a.rel='noopener noreferrer';}return a;}
function button(label,fn,cls='mini-btn'){const b=node('button',cls,label);b.type='button';b.addEventListener('click',fn);return b;}
async function reload(){const x=await send('GET_STATE');if(!x?.ok)throw Error(x?.error||'Cannot access extension storage');state=x.state;updateHeader();}
function allSources(){return [...BASE_SOURCES,...(state?.customSources||[])];}
function updateHeader(){
 if(!state)return;
 const unread=state.items.filter(x=>!x.read),sources=allSources();
 el('metricPriority').textContent=unread.filter(x=>x.priority==='high').length;
 el('metricUnread').textContent=unread.length;
 el('metricSources').textContent=sources.filter(x=>state.settings.enabledIds.includes(x.id)&&state.statuses[x.id]?.ok).length+' / '+sources.filter(x=>state.settings.enabledIds.includes(x.id)).length;
 el('metricSaved').textContent=state.items.filter(x=>x.saved).length;
 el('lastSync').textContent=(state.refreshing?'Checking sources…':state.lastCheck?'Checked '+fmtWhen(state.lastCheck):'First check not completed');
 el('syncIcon').classList.toggle('spinning',!!state.refreshing);
 el('refreshBtn').disabled=!!state.refreshing;
 el('navUnread').style.display=unread.length?'block':'none';
}
function pageName(p){return {overview:'Command overview',feed:'Intelligence feed',saved:'Saved & notes',learning:'Knowledge centre',inspections:'Inspection readiness',academy:'CO Academy & routines',sources:'Sources & settings',planner:'CO Planner & port calls',practice:'Inspector practice & AI',watch:'Always-On Intelligence'}[p]||'Command overview';}
function showPage(p){
 if(!['overview','feed','saved','learning','inspections','academy','sources','planner','practice','watch'].includes(p))p='overview';
 page=p;if(el('mobileJump'))el('mobileJump').value=p;location.hash='#'+p;document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id==='page-'+p));
 document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.page===p));
 el('pageTitle').textContent=pageName(p);window.scrollTo({top:0,behavior:'instant'});renderPage();
}
function empty(target,title,desc){const box=node('div','empty-state');append(box,node('strong','',title),node('p','',desc));target.append(box);}
function articleCard(item){
 const outer=node('article','news-card priority-'+item.priority+(item.read?'':' unread'));
 const inner=node('div','news-inner');append(outer,node('div','priority-bar'),inner);
 const head=node('div','news-head');
 append(head,node('span','source-tag',item.source),node('span','priority-tag',item.priority==='high'?'REVIEW FIRST':item.priority==='medium'?'RELEVANT':'GENERAL'),node('span','',fmtDate(item.published)));
 const title=node('h3','news-title');append(title,link(item.url,item.title));
 const summary=node('p','news-summary',item.summary||'No source excerpt available. Open the original publication to read the full text.');
 const bottom=node('div','news-foot');append(bottom,node('span','topic-chip',item.category));
 for(const t of (item.topics||[]).slice(0,3))append(bottom,node('span','topic-chip',t));
 const actions=node('div','news-actions');
 const save=button(item.saved?'◆ Saved':'◇ Save',async()=>{await updateItem(item,'saved',!item.saved);});
 if(item.saved)save.classList.add('saved');
 const read=button(item.read?'↶ Unread':'✓ Read',async()=>{await updateItem(item,'read',!item.read);});
 const detail=button(expanded.has(item.id)?'− Details':'+ Details',()=>{if(expanded.has(item.id))expanded.delete(item.id);else expanded.add(item.id);renderPage();});
 append(actions,detail,save,read);append(bottom,actions);append(inner,head,title,summary,bottom);
 if(expanded.has(item.id)){
  const box=node('div','detail-panel');
  const row=node('div');append(row,node('b','','Suggested review: '),document.createTextNode(item.recommendation||'Check the original text.'));
  const legal=node('div','detail-note');append(legal,node('b','','Source status: '),document.createTextNode(item.statusLabel||'Verify the publication status.'));
  const effective=node('div','detail-note');append(effective,node('b','','Entry into force / mandatory applicability: '),document.createTextNode('NOT VERIFIED from the headline. Consult the full primary document, flag instructions and your SMS.'));
  const ta=node('textarea','');ta.placeholder='Your onboard note, action or question for the Master…';ta.value=item.note||'';ta.setAttribute('aria-label','Notes for '+item.title);
  append(box,row,legal,effective,node('div','detail-note','YOUR NOTE'),ta,button('Save note',async()=>{const result=await send('UPDATE_ITEM',{id:item.id,field:'note',value:ta.value});if(result?.ok){item.note=ta.value;showToast('Note saved locally');}else showToast(result?.error||'Unable to save',true);},'button-outline small'));
  inner.append(box);
 }
 return outer;
}
async function updateItem(item,field,value){
 const res=await send('UPDATE_ITEM',{id:item.id,field,value});if(!res?.ok){showToast(res?.error||'Update failed',true);return;}
 item[field]=value;updateHeader();renderPage();
}
function renderOverview(){
 const target=el('priorityList');target.replaceChildren();
 const shown=state.items.filter(x=>!x.read&&x.priority==='high').slice(0,6);
 if(!shown.length){empty(target,state.lastCheck?'No unread priority headlines':'Ready for your first source check',state.lastCheck?'The monitored sources may still have relevant lower-priority items. Open the full feed.':'Click “Refresh now” to retrieve current public source listings. Initial headlines are not pre-filled or invented.');return;}
 shown.forEach(x=>target.append(articleCard(x)));
}
function populateDropdown(sel,rows,title,selected){sel.replaceChildren();const all=node('option','',title);all.value='all';sel.append(all);for(const [value,label] of rows){const opt=node('option','',label);opt.value=value;sel.append(opt);}sel.value=selected||'all';}
function renderFeed(){
 const srcCurrent=el('sourceFilter').value,catCurrent=el('categoryFilter').value;
 populateDropdown(el('sourceFilter'),allSources().map(s=>[s.id,s.name]),'All sources',srcCurrent);
 populateDropdown(el('categoryFilter'),[...new Set(state.items.map(x=>x.category))].sort().map(x=>[x,x]),'All topics',catCurrent);
 const search=el('searchInput').value.trim().toLowerCase(),pr=el('priorityFilter').value,cat=el('categoryFilter').value,src=el('sourceFilter').value,unread=el('unreadOnly').checked;
 const results=state.items.filter(x=>(pr==='all'||x.priority===pr)&&(cat==='all'||x.category===cat)&&(src==='all'||x.sourceId===src)&&(!unread||!x.read)&&(!search||(x.title+' '+x.summary+' '+x.source+' '+x.category+' '+(x.note||'')).toLowerCase().includes(search)));
 currentResults=results;
 el('feedCount').textContent=`Showing ${Math.min(displayLimit,results.length)} of ${results.length} matching items · ${state.items.length} stored in this browser`;
 const out=el('fullFeed');out.replaceChildren();if(!results.length)empty(out,'No matching headlines','Try another filter, check the source health panel, or perform a source refresh.');
 else for(const it of results.slice(0,displayLimit))out.append(articleCard(it));
 el('showMore').hidden=results.length<=displayLimit;
}
function renderSaved(){
 const target=el('savedFeed');target.replaceChildren();const saved=state.items.filter(x=>x.saved);
 if(!saved.length)empty(target,'No saved articles yet','Use ◇ Save on any intelligence item to build your own onboard reading file.');
 else saved.forEach(x=>target.append(articleCard(x)));
}
function renderLearning(){
 const grid=el('knowledgeGrid');grid.replaceChildren();
 TOPICS.forEach((t,i)=>{
  const box=node('article','knowledge-card');append(box,node('div','num',String(i+1).padStart(2,'0')+' / CHIEF OFFICER STUDY'),node('h3','',t.title),node('p','sub',t.subtitle),node('p','',t.desc),button('Find related news →',()=>{showPage('feed');el('searchInput').value=t.queries[0];renderFeed();},'text-link'));grid.append(box);
 });
 const container=el('quickLinks');container.replaceChildren();let groups=new Map();for(const q of QUICK_LINKS){if(!groups.has(q.group))groups.set(q.group,[]);groups.get(q.group).push(q);}
 for(const [group,rows] of groups){const div=node('div','reference-group');div.append(node('h3','',group.toUpperCase()));for(const r of rows){const row=node('div','reference-row');append(row,link(r.url,r.name),node('span','',r.scope));div.append(row);}container.append(div);}
}
function renderSources(){
 const s=state.settings;el('intervalSelect').value=String(s.intervalMinutes);
 el('notifyToggle').checked=!!s.notify;el('europeToggle').checked=!!s.europeFirst;el('keywordsField').value=s.keywords||'';
 const list=el('sourcesList');list.replaceChildren();
 for(const src of allSources()){
  const row=node('div','source-row');const check=node('input','source-toggle');check.type='checkbox';check.checked=s.enabledIds.includes(src.id);check.dataset.source=src.id;check.setAttribute('aria-label','Enable '+src.name);
  const logo=node('div','source-icon',src.icon||'RSS');
  const information=node('div','source-info');information.append(node('strong','',src.name));
  const sourceLink=link(src.url,src.region+' · '+src.kind);sourceLink.className='source-url';information.append(node('small',''));information.lastElementChild.append(sourceLink);
  const status=state.statuses[src.id];
  const right=node('div','source-state '+(!check.checked?'status-pending':status?.ok?'status-ok':status?'status-fail':'status-pending'),!check.checked?'PAUSED':!status?'NOT CHECKED':status.ok?`OK · ${status.count} found`:'CHECK FAILED');
  right.title=status?.error||('Last check '+fmtWhen(status?.when));
  append(row,check,logo,information,right);
  if(src.id.startsWith('custom-'))row.append(button('×',async()=>{if(!confirm('Remove this custom source? Saved news will remain.'))return;const r=await send('DELETE_SOURCE',{id:src.id});if(r.ok){await reload();renderSources();showToast('Source removed');}},'delete'));
  list.append(row);
 }
}
// Inspection and onboard-learning features (English UI; all review data stays in local Chrome storage).
let inspectionType='psc', openInspectionNotes=new Set(), routineId='daily', openLessons=new Set(), openAnswers=new Set(), showOnlyUnstudied=false;
const currentVessel=()=>String(state?.inspectionContext?.vessel||'').trim().toLowerCase()||'default';
const inspectionRecord=()=>state?.inspectionRecords?.[inspectionType+':'+currentVessel()]||{};
const statusOptions=[['pending','Not reviewed'],['verified','Checked onboard'],['action','Action required'],['na','Not applicable']];
function safeDateNow(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function renderInspections(){
 const data=INSPECTIONS[inspectionType], rec=inspectionRecord();
 document.querySelectorAll('.inspect-tab').forEach(b=>{const active=b.dataset.inspection===inspectionType;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 el('vesselInput').value=state.inspectionContext.vessel||'';
 el('portInput').value=state.inspectionContext.port||'';
 el('inspectionDateInput').value=state.inspectionContext.date||'';
 el('inspectionEyebrow').textContent=data.eyebrow;
 el('inspectionTitle').textContent=data.title;
 el('inspectionSubtitle').textContent=data.subtitle;
 el('inspectionCaution').textContent=data.caution;
 const totals={pending:0,verified:0,action:0,na:0};
 data.items.forEach(i=>totals[rec[i.id]?.status||'pending']++);
 const reviewed=totals.verified+totals.action+totals.na;
 const stats=el('inspectionStats');stats.replaceChildren();
 const makeStat=(value,label,cls='')=>{const box=node('div','stat-tile '+cls);append(box,node('b','',String(value)),node('span','',label));stats.append(box);};
 makeStat(reviewed+' / '+data.items.length,'Reviewed · self-check only');makeStat(totals.action,'Action required','urgent');makeStat(totals.pending,'Not reviewed');
 const phase=el('inspectionPhases');phase.replaceChildren();
 data.phases.forEach(([title,desc],idx)=>{const row=node('div','phase-step');append(row,node('span','phase-number',String(idx+1).padStart(2,'0')),append(node('div',''),node('b','',title),node('p','',desc)));phase.append(row);});
 const insight=el('inspectionInsights');insight.replaceChildren();data.insights.forEach(v=>{const line=node('div','insight-line');append(line,node('span','','•'),node('p','',v));insight.append(line);});
 const refs=el('inspectionLinks');refs.replaceChildren();data.links.forEach(([name,url])=>refs.append(link(url,name+' ↗','reference-short')));
 const q=el('inspectionSearch').value.trim().toLowerCase(),sel=el('inspectionStatusFilter').value,criticalFirst=el('criticalFirst').checked;
 let items=data.items.filter(i=>(sel==='all'||(rec[i.id]?.status||'pending')===sel)&&(!q||(i.title+' '+i.check+' '+i.evidence+' '+i.group+' '+(rec[i.id]?.note||'')).toLowerCase().includes(q)));
 if(criticalFirst)items=[...items].sort((a,b)=>(b.priority==='critical')-(a.priority==='critical'));
 el('inspectionCount').textContent=`${items.length} of ${data.items.length} checks shown · ${totals.action} action(s) flagged · saved by vessel ID on this computer`;
 const target=el('inspectionItems');target.replaceChildren();if(!items.length){empty(target,'No matching checks','Change the search or status filter.');return;}
 let groups=new Map();for(const item of items){if(!groups.has(item.group))groups.set(item.group,[]);groups.get(item.group).push(item);}
 for(const [group,entries] of groups){
  const section=node('section','check-group');const count=node('span','check-count',entries.length+' topics');const header=node('div','check-group-header');append(header,node('h3','',group),count);section.append(header);
  for(const item of entries){
   const saved=rec[item.id]||{status:'pending',note:''};const card=node('article','check-card '+(saved.status==='action'?'needs-action':saved.status==='verified'?'reviewed':'')+(item.priority==='critical'?' critical-check':''));
   const upper=node('div','check-upper');const titleBox=node('div','check-title');const flags=node('div','check-flags');
   if(item.priority==='critical')flags.append(node('span','flag-critical','HIGH-IMPACT REVIEW'));
   flags.append(node('span','flag-kind',item.kind));append(titleBox,flags,node('h4','',item.title));
   const dropdown=node('select','status-select');dropdown.setAttribute('aria-label','Review status for '+item.title);
   statusOptions.forEach(([v,label])=>{const o=node('option','',label);o.value=v;dropdown.append(o);});dropdown.value=saved.status||'pending';
   dropdown.addEventListener('change',async()=>{const r=await send('UPDATE_INSPECTION_CHECK',{inspection:inspectionType,itemId:item.id,vessel:currentVessel(),status:dropdown.value});if(!r?.ok){showToast(r?.error||'Cannot store review',true);return;}await reload();renderInspections();});
   append(upper,titleBox,dropdown);append(card,upper,node('p','check-text',item.check));
   const actions=node('div','check-footer');append(actions,node('span','evidence-line','EVIDENCE TO SEEK: '+item.evidence));
   const toggle=button(openInspectionNotes.has(item.id)?'− Hide note':'+ Evidence / note',()=>{if(openInspectionNotes.has(item.id))openInspectionNotes.delete(item.id);else openInspectionNotes.add(item.id);renderInspections();},'mini-btn');actions.append(toggle);card.append(actions);
   if(openInspectionNotes.has(item.id)){
    const panel=node('div','check-note-panel');const labelText=node('label','note-label','YOUR ACTUAL FINDINGS / EVIDENCE / CORRECTIVE ACTION');const notes=node('textarea','');notes.rows=3;notes.value=saved.note||'';notes.placeholder='Example: No. 2 fire door failed to self-close; defect #…, informed Master, temporary control per SMS.';
    const st=node('div','note-meta',saved.updatedAt?'Saved '+fmtWhen(saved.updatedAt):'No review saved yet');
    const save=button('Save evidence note',async()=>{const r=await send('UPDATE_INSPECTION_CHECK',{inspection:inspectionType,itemId:item.id,vessel:currentVessel(),status:dropdown.value,note:notes.value});if(!r?.ok){showToast(r?.error||'Unable to save',true);return;}await reload();renderInspections();showToast('Observation saved on this device');},'button-outline small');
    append(panel,labelText,notes,append(node('div','check-note-buttons'),st,save));card.append(panel);
   }
   section.append(card);
  }
  target.append(section);
 }
}
function csvValue(v){let s=String(v??'').replace(/\r?\n/g,' ');if(/^[\s]*[=+@\-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function exportInspectionCsv(){
 const data=INSPECTIONS[inspectionType],rec=inspectionRecord();const rows=[['Inspection','Vessel','Port','Planned date','ID','Section','Review topic','Risk focus','Self-check status','Suggested evidence','Actual note','Last updated','Source / validity note']];
 for(const i of data.items){const r=rec[i.id]||{};rows.push([data.short,state.inspectionContext.vessel,state.inspectionContext.port,state.inspectionContext.date,i.id,i.group,i.title,i.priority,r.status||'pending',i.evidence,r.note||'',r.updatedAt||'','Independent study tool - verify official rules, SMS and vessel applicability']);}
 const content='\ufeff'+rows.map(r=>r.map(csvValue).join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));const a=node('a');a.href=url;a.download='CO_'+inspectionType.toUpperCase()+'_self_check_'+safeDateNow()+'.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function renderAcademy(){
 const todayIndex=Math.floor(new Date().setHours(12,0,0,0)/86400000)%LEARNING_MODULES.length;
 const selected=LEARNING_MODULES[todayIndex];el('todayDrillTitle').textContent=selected.title;el('todayDrillText').textContent=selected.scenario;
 el('studyCount').textContent=LEARNING_MODULES.filter(m=>!!state.studiedModules[m.id]).length+' / '+LEARNING_MODULES.length;
 el('drillOpen').onclick=()=>{openLessons.add(selected.id);showOnlyUnstudied=false;renderAcademy();el('academy-'+selected.id)?.scrollIntoView({behavior:'smooth',block:'start'});};
 const tabRoot=el('routineTabs');tabRoot.replaceChildren();CO_ROUTINES.forEach(r=>{const b=button(r.label,()=>{routineId=r.id;renderAcademy();},'routine-tab'+(routineId===r.id?' active':''));tabRoot.append(b);});
 const routine=CO_ROUTINES.find(r=>r.id===routineId);const out=el('routinePanel');out.replaceChildren();const header=node('div','routine-header');append(header,node('strong','',routine.label),node('span','',routine.window));out.append(header);
 const today=safeDateNow();const todayChecks=state.routineChecks?.day===today?(state.routineChecks.checks||{}):{};
 const count=routine.steps.filter((_,i)=>todayChecks[routine.id+':'+i]).length;
 out.append(node('p','routine-progress',`${count} / ${routine.steps.length} marked done today · Resets automatically with the local date`));
 routine.steps.forEach((step,idx)=>{const label=node('label','routine-step');const input=node('input');input.type='checkbox';input.checked=!!todayChecks[routine.id+':'+idx];input.addEventListener('change',async()=>{const r=await send('UPDATE_ROUTINE',{routine:routine.id,step:idx,day:today,checked:input.checked});if(!r?.ok){showToast('Could not save routine',true);return;}await reload();renderAcademy();});append(label,input,node('span','',step));out.append(label);});
 const target=el('academyGrid');target.replaceChildren();let displayed=0;
 for(const m of LEARNING_MODULES){
  if(showOnlyUnstudied&&state.studiedModules[m.id])continue;displayed++;
  const studied=!!state.studiedModules[m.id],exp=openLessons.has(m.id),ans=openAnswers.has(m.id);
  const card=node('article','academy-card'+(studied?' is-studied':''));card.id='academy-'+m.id;
  const head=node('div','academy-card-top');append(head,node('span','lesson-tag',m.tag+' · '+m.minutes+' min'),node('span','lesson-status',studied?'✓ REVIEWED':'NOT YET STUDIED'));append(card,head,node('h3','',m.title),node('p','lesson-goal',m.goal));
  const toggle=button(exp?'− Close lesson':'+ Open lesson',()=>{if(exp)openLessons.delete(m.id);else openLessons.add(m.id);renderAcademy();},'button-outline small');card.append(toggle);
  if(exp){
   const content=node('div','lesson-content');const points=node('ul','lesson-points');m.points.forEach(point=>points.append(node('li','',point)));append(content,node('h4','','Operational coaching points'),points,node('div','card-eyebrow','DISCUSS WITH THE CREW'),node('p','lesson-scenario',m.scenario));
   const answer=button(ans?'− Hide suggested debrief':'Reveal suggested debrief',()=>{if(ans)openAnswers.delete(m.id);else openAnswers.add(m.id);renderAcademy();},'mini-btn');content.append(answer);
   if(ans)content.append(node('p','lesson-answer',m.debrief));
   const refs=node('div','lesson-links');m.sources.forEach(([name,url])=>refs.append(link(url,name+' ↗')));content.append(refs);
   const done=button(studied?'Mark as not studied':'✓ Mark lesson reviewed',async()=>{const r=await send('UPDATE_STUDY',{id:m.id,reviewed:!studied});if(!r?.ok){showToast('Could not store progress',true);return;}await reload();renderAcademy();showToast(studied?'Review status cleared':'Lesson reviewed');},'button-primary');content.append(done);card.append(content);
  }
  target.append(card);
 }
 if(!displayed)empty(target,'All lessons reviewed','You can toggle “Show all lessons” to revisit any topic.');
 el('showUnstudied').textContent=showOnlyUnstudied?'Show all lessons':'Show not yet studied';
}

function renderPage(){if(!state)return;updateHeader();if(page==='overview')renderOverview();else if(page==='feed')renderFeed();else if(page==='saved')renderSaved();else if(page==='learning')renderLearning();else if(page==='inspections')renderInspections();else if(page==='academy')renderAcademy();else if(page==='sources')renderSources();else if(page==='planner')renderPlanner(plannerEnv);if(page==='overview')renderPlannerMini(plannerEnv);if(page==='practice')renderPractice(plannerEnv);if(page==='watch')onWatchPage();}
const plannerEnv={send,reload,toast:showToast,render:()=>renderPage(),getState:()=>state};
function wire(){
 wireWatch();
 wirePlanner(plannerEnv);
 wirePractice(plannerEnv);
 el('mobileJump').addEventListener('change',e=>showPage(e.target.value));
 document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
 document.querySelectorAll('[data-action="open-feed"]').forEach(b=>b.addEventListener('click',()=>showPage('feed')));
 document.querySelectorAll('[data-action="open-learning"]').forEach(b=>b.addEventListener('click',()=>showPage('learning')));
 document.querySelectorAll('[data-action="open-inspections"]').forEach(b=>b.addEventListener('click',()=>showPage('inspections')));
 document.querySelectorAll('[data-action="open-planner"]').forEach(b=>b.addEventListener('click',()=>showPage('planner')));
 document.querySelectorAll('[data-action="open-practice"]').forEach(b=>b.addEventListener('click',()=>showPage('practice')));
 document.querySelectorAll('[data-action="open-academy"]').forEach(b=>b.addEventListener('click',()=>showPage('academy')));
 document.querySelectorAll('.inspect-tab').forEach(b=>b.addEventListener('click',()=>{inspectionType=b.dataset.inspection;openInspectionNotes.clear();el('inspectionSearch').value='';el('inspectionStatusFilter').value='all';renderInspections();}));
 for(const id of ['inspectionSearch','inspectionStatusFilter','criticalFirst'])el(id).addEventListener(id==='inspectionSearch'?'input':'change',renderInspections);
 el('saveVessel').addEventListener('click',async()=>{const context={vessel:el('vesselInput').value,port:el('portInput').value,date:el('inspectionDateInput').value};const r=await send('SAVE_INSPECTION_CONTEXT',{context});if(!r?.ok){showToast(r?.error||'Cannot save profile',true);return;}await reload();renderInspections();showToast('Vessel profile saved');});
 el('exportChecks').addEventListener('click',exportInspectionCsv);
 el('inspectNewsBtn').addEventListener('click',()=>{const q={psc:'PSC',sire:'SIRE 2.0',cdi:'chemical tanker'}[inspectionType];showPage('feed');el('searchInput').value=q;renderFeed();});
 el('resetChecks').addEventListener('click',async()=>{if(!confirm('Clear all saved statuses and evidence notes for the selected inspection on this vessel?'))return;const r=await send('RESET_INSPECTION',{inspection:inspectionType,vessel:currentVessel()});if(!r?.ok){showToast(r?.error||'Reset failed',true);return;}await reload();renderInspections();showToast('Selected inspection reset');});
 el('showUnstudied').addEventListener('click',()=>{showOnlyUnstudied=!showOnlyUnstudied;renderAcademy();});
 el('refreshBtn').addEventListener('click',async()=>{
  const r=await send('REFRESH');if(!r?.ok){showToast(r?.error||'Could not start refresh',true);return;}await reload();updateHeader();showToast('Source check started; source status will update while open.');
 });
 for(const id of ['searchInput','priorityFilter','categoryFilter','sourceFilter','unreadOnly'])el(id).addEventListener(id==='searchInput'?'input':'change',()=>{displayLimit=45;renderFeed();});
 el('showMore').addEventListener('click',()=>{displayLimit+=50;renderFeed();});
 el('markVisibleRead').addEventListener('click',async()=>{
  const items=currentResults.slice(0,displayLimit).filter(x=>!x.read);if(items.length>30&&!confirm(`Mark ${items.length} visible results as read?`))return;
  await Promise.all(items.map(x=>send('UPDATE_ITEM',{id:x.id,field:'read',value:true})));await reload();renderFeed();showToast(`${items.length} items marked as read`);
 });
 el('saveSettings').addEventListener('click',async()=>{
  const ids=[...document.querySelectorAll('#sourcesList input[data-source]:checked')].map(x=>x.dataset.source);
  const settings={intervalMinutes:Number(el('intervalSelect').value),notify:el('notifyToggle').checked,europeFirst:el('europeToggle').checked,keywords:el('keywordsField').value,enabledIds:ids};
  const r=await send('SAVE_SETTINGS',{settings});if(!r?.ok){showToast(r?.error||'Settings error',true);return;}await reload();renderSources();showToast('Monitoring preferences saved');
 });
 el('addSource').addEventListener('click',async()=>{
  const name=el('customName').value.trim(),url=el('customUrl').value.trim(),notice=el('addSourceMsg');
  let u;try{u=new URL(url);if(!/^https?:$/.test(u.protocol))throw Error();}catch{notice.textContent='Enter a valid URL beginning with https:// or http://';return;}
  try{
   const granted=await chrome.permissions.request({origins:[u.origin+'/*']});if(!granted){notice.textContent='Permission was declined. Source not added.';return;}
   const r=await send('ADD_SOURCE',{name,url});if(!r?.ok){notice.textContent=r?.error||'Could not add source';return;}
   notice.textContent='Added. Use “Refresh now” to test the feed.';el('customName').value='';el('customUrl').value='';await reload();renderSources();
  }catch(e){notice.textContent=String(e.message||e);}
 });
 el('exportData').addEventListener('click',()=>{
  const output={format:'co-intelligence-backup',version:5,exportedAt:new Date().toISOString(),settings:state.settings,items:state.items,customSources:state.customSources,inspectionContext:state.inspectionContext,inspectionRecords:state.inspectionRecords,studiedModules:state.studiedModules,routineChecks:state.routineChecks,practice:state.practice,planner:state.planner,alwaysOn:exportWatchBackup()};
  const blob=new Blob([JSON.stringify(output,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='co_intelligence_backup_'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 el('importData').addEventListener('click',()=>el('importFile').click());
 el('importFile').addEventListener('change',async e=>{
  const f=e.target.files?.[0];if(!f)return;if(f.size>9_000_000){showToast('Backup file is too large',true);return;}
  try{const value=JSON.parse(await f.text());if(!confirm('Import this backup and replace existing items/settings?'))return;
   const r=await send('IMPORT_STATE',{value});if(!r.ok)throw Error(r.error);await reload();importWatchBackup(value.alwaysOn);renderPage();showToast('Backup imported');
  }catch(err){showToast(err.message||'Invalid backup',true);}finally{e.target.value='';}
 });
 window.addEventListener('hashchange',()=>{const p=location.hash.slice(1);if(p!==page)showPage(p);});
}
async function main(){wire();try{await reload();showPage(location.hash.slice(1)||'overview');}
 catch(e){el('priorityList').textContent='App storage unavailable: '+e.message;showToast('Error loading local app data',true);return;}
 let priorRun=state.runCount;
 setInterval(async()=>{
  if(document.visibilityState!=='visible')return;
  try{const result=await send('GET_STATE');if(!result?.ok)return;
   const next=result.state;const changed=next.runCount!==priorRun;const wasRefreshing=state.refreshing;
   state=next;updateHeader();
   if(changed){priorRun=state.runCount;renderPage();showToast(`Checked sources: ${state.lastRunNew||0} new entries`);}
   else if(wasRefreshing&&!state.refreshing&&page==='sources')renderSources();
  }catch{}
 },2500);
}
main();
