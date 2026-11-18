// Shared desktop / Samsung user interface. No HTML injection from user-provided fields.
import {plannerStats,plannerToday,dateOffset} from './planner_engine.js';
const plannerExpanded=new Set();
const q=id=>document.getElementById(id);
function dom(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function action(label,cb,cls='mini-btn'){const b=dom('button',cls,label);b.type='button';b.addEventListener('click',cb);return b;}
function input(value,placeholder='',type='text'){const i=dom('input');i.type=type;i.value=value||'';i.placeholder=placeholder;return i;}
const dateLabel=d=>d||'No due date';
function sorted(tasks){return [...tasks].sort((a,b)=>(a.status==='done')-(b.status==='done')||(a.dueDate||'9999').localeCompare(b.dueDate||'9999')||a.title.localeCompare(b.title));}
function createCard(t,env){const {send,reload,toast,render}=env,today=plannerToday();
 const card=dom('article','planner-task'+(t.status==='done'?' is-done':'')+(t.status!=='done'&&t.dueDate&&t.dueDate<today?' is-overdue':''));
 const head=dom('div','planner-task-head'),meta=dom('div','planner-meta');
 meta.append(dom('span','planner-pill',t.status==='done'?'DONE':t.dueDate&&t.dueDate<today?'OVERDUE':t.dueDate===today?'DUE TODAY':t.priority.toUpperCase()),dom('span','',t.category),dom('span','',dateLabel(t.dueDate)));
 head.append(dom('h3','',t.title),meta);card.append(head);
 if(t.details)card.append(dom('p','planner-desc',t.details));
 const sub=dom('p','planner-sub',[t.port,t.phase,t.owner?'Owner: '+t.owner:'',t.source].filter(Boolean).join(' · '));card.append(sub);
 const buttons=dom('div','planner-actions');
 buttons.append(action(t.status==='done'?'↶ Reopen':'✓ Mark done',async()=>{const r=await send('PLANNER_UPDATE',{id:t.id,patch:{status:t.status==='done'?'open':'done'}});if(!r.ok)return toast(r.error,true);await reload();render();},t.status==='done'?'button-outline small':'button-primary small'));
 buttons.append(action(plannerExpanded.has(t.id)?'Close editor':'Edit / evidence',()=>{plannerExpanded.has(t.id)?plannerExpanded.delete(t.id):plannerExpanded.add(t.id);render();}));
 buttons.append(action('Reuse as template',async()=>{const r=await send('PLANNER_SAVE_TEMPLATE',{id:t.id});if(!r.ok)return toast(r.error,true);await reload();render();toast('Approved reusable template stored on this device.');}));
 buttons.append(action('Delete',async()=>{if(!confirm('Delete this planner task? Inspection records will remain unchanged.'))return;const r=await send('PLANNER_DELETE',{id:t.id});if(!r.ok)return toast(r.error,true);plannerExpanded.delete(t.id);await reload();render();}));
 card.append(buttons);
 if(plannerExpanded.has(t.id)){
  const editor=dom('div','planner-editor');const title=input(t.title,'Task title'),date=input(t.dueDate,'','date'),owner=input(t.owner,'Person responsible'),priority=dom('select');
  ['critical','high','normal','information'].forEach(p=>{const o=dom('option','',p);o.value=p;priority.append(o)});priority.value=t.priority;
  const details=dom('textarea');details.value=t.details||'';details.rows=3;details.placeholder='Actual observation / action / evidence reference (not proof of compliance)';
  editor.append(labelled('Task',title),labelled('Due date',date),labelled('Owner',owner),labelled('Priority',priority),labelled('Notes or evidence reference',details));
  editor.append(action('Save changes',async()=>{const r=await send('PLANNER_UPDATE',{id:t.id,patch:{title:title.value,dueDate:date.value,owner:owner.value,priority:priority.value,details:details.value}});if(!r.ok)return toast(r.error,true);plannerExpanded.delete(t.id);await reload();render();toast('Planner task updated');},'button-primary small'));card.append(editor);
 }
 return card;
}
function labelled(text,control){const wrap=dom('label','planner-field'),name=dom('span','',text);wrap.append(name,control);return wrap;}
function downloadCsv(tasks){const cells=[['Status','Due date','Priority','Title','Category','Port','Phase','Owner','Notes','Source','Updated at'],...tasks.map(t=>[t.status,t.dueDate,t.priority,t.title,t.category,t.port,t.phase,t.owner,t.details,t.source,t.updatedAt])];
 const csv='\ufeff'+cells.map(row=>row.map(s=>'"'+String(s??'').replaceAll('"','""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=dom('a');a.href=url;a.download='co_planner_'+plannerToday()+'.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function wirePlanner(env){const {send,reload,toast,render}=env;
 q('plannerGenerate').addEventListener('click',async()=>{
  const profile={vessel:q('planVessel').value,port:q('planPort').value,eta:q('planEta').value,activity:q('planActivity').value};
  const r=await send('PLANNER_GENERATE_PORT',{profile});if(!r.ok)return toast(r.error,true);await reload();render();toast(r.added?`${r.added} suggested preparation tasks added. Check local requirements.`:'No duplicate tasks added for this port call.');
 });
 q('plannerAdd').addEventListener('click',async()=>{
  const task={title:q('planNewTitle').value,details:q('planNewDetails').value,dueDate:q('planNewDue').value,priority:q('planNewPriority').value,port:q('planPort').value,source:'manual'};
  const r=await send('PLANNER_ADD',{task});if(!r.ok)return toast(r.error,true);q('planNewTitle').value='';q('planNewDetails').value='';await reload();render();toast('Task saved locally');
 });
 q('plannerTemplateAdd').addEventListener('click',async()=>{const id=q('plannerTemplateSelect').value;if(!id)return toast('Choose a saved template first',true);
  const r=await send('PLANNER_APPLY_TEMPLATE',{id,dueDate:q('planNewDue').value});if(!r.ok)return toast(r.error,true);await reload();render();toast('Reusable template added as a new task');});
 q('plannerTemplateDelete').addEventListener('click',async()=>{const id=q('plannerTemplateSelect').value;if(!id)return;if(!confirm('Remove selected personal template? Existing tasks will remain.'))return;const r=await send('PLANNER_DELETE_TEMPLATE',{id});if(!r.ok)return toast(r.error,true);await reload();render();});
 q('plannerFilter').addEventListener('change',render);
 q('plannerExport').addEventListener('click',()=>downloadCsv(env.getState().planner?.tasks||[]));
}
export function renderPlanner(env){const {getState}=env,state=getState(),p=state.planner||{tasks:[],templates:[],profile:{}},stats=plannerStats(p);let s=p.profile||{};
 for(const [id,value] of [['planVessel',s.vessel||state.inspectionContext?.vessel||''],['planPort',s.port||state.inspectionContext?.port||''],['planEta',s.eta||''],['planActivity',s.activity||'general']]){const e=q(id);if(e&&document.activeElement!==e)e.value=value;}
 q('planTotal').textContent=stats.total;q('planOpen').textContent=stats.open;q('planOverdue').textContent=stats.overdue;q('planToday').textContent=stats.today;
 const selector=q('plannerTemplateSelect'),current=selector.value;selector.replaceChildren();const placeholder=dom('option','','Choose saved task template…');placeholder.value='';selector.append(placeholder);
 for(const t of p.templates){const o=dom('option','',t.title);o.value=t.id;selector.append(o)}selector.value=p.templates.some(t=>t.id===current)?current:'';
 const f=q('plannerFilter').value,today=plannerToday(),week=dateOffset(today,7);
 const tasks=sorted(p.tasks||[]).filter(t=> f==='all'||(f==='open'&&t.status!=='done')||(f==='done'&&t.status==='done')||(f==='overdue'&&t.status!=='done'&&t.dueDate&&t.dueDate<today)||(f==='today'&&t.status!=='done'&&t.dueDate===today)||(f==='week'&&t.status!=='done'&&t.dueDate&&t.dueDate>=today&&t.dueDate<=week));
 const list=q('plannerTasks');list.replaceChildren();q('plannerVisibleCount').textContent=`${tasks.length} shown · ${p.templates.length} user-approved reusable templates`;
 if(!tasks.length){const empty=dom('div','planner-empty','No matching tasks. Add one manually or generate a port call preparation plan.');list.append(empty);}else for(const t of tasks.slice(0,200))list.append(createCard(t,env));
 if(tasks.length>200)list.append(dom('p','planner-sub','Displaying first 200 tasks. Narrow the filter to review others.'));
 q('navPlannerBadge').textContent=stats.overdue?String(stats.overdue):'';
}
export function renderPlannerMini(env){const out=q('plannerPreview');if(!out)return;out.replaceChildren();const state=env.getState(),p=state.planner||{tasks:[]},stats=plannerStats(p),today=plannerToday();
 q('plannerPreviewStats').textContent=`${stats.open} open · ${stats.overdue} overdue · ${stats.today} due today`;
 const top=sorted((p.tasks||[]).filter(x=>x.status!=='done')).slice(0,4);
 if(!top.length)out.append(dom('p','planner-sub','No outstanding tasks. Build a port plan or capture the next action.'));
 for(const t of top){const line=dom('div','planner-mini-line');line.append(dom('strong','',t.title),dom('span','',dateLabel(t.dueDate)));out.append(line);}
}
