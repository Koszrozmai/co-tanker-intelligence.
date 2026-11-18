// Offline-first, user-controlled planner engine. Nothing generated here asserts legal compliance.
export const WORKFLOW_TASKS = [
 {id:'agent',phase:'Before arrival',title:'Review agent / terminal pre-arrival instructions',category:'Port documents',offset:-3,priority:'high',activities:['all'],details:'Verify latest port call instructions, forms, reporting windows and agent messages. A previous visit does not establish current requirements.'},
 {id:'certs',phase:'Before arrival',title:'Confirm ship certificates and open findings',category:'Documents',offset:-3,priority:'high',activities:['all'],details:'Review applicable certificates, current conditions, findings and outstanding corrective actions against controlled onboard records.'},
 {id:'arrival',phase:'Before arrival',title:'Prepare port-arrival declarations with relevant departments',category:'Port documents',offset:-2,priority:'normal',activities:['all'],details:'Use current agent and company instructions; coordinate documents with Master and other responsible officers.'},
 {id:'muster',phase:'Before arrival',title:'Confirm crew roles, drills and key operational familiarisation',category:'People',offset:-2,priority:'normal',activities:['all'],details:'Check actual crew understanding and required records; do not infer that a drill was performed.'},
 {id:'mooring',phase:'Before arrival',title:'Review mooring and berthing risk controls',category:'Safety',offset:-1,priority:'high',activities:['all'],details:'Consider mooring plan, manpower, environmental limits, communications and equipment condition with Master and terminal.'},
 {id:'pollution',phase:'Before arrival',title:'Review pollution prevention and deck readiness',category:'Safety',offset:-1,priority:'high',activities:['all'],details:'Verify relevant containment, scuppers, spill-response equipment and current approved procedures.'},
 {id:'cargoDocs',phase:'Before arrival',title:'Verify cargo documents, SDS and relevant ship restrictions',category:'Cargo',offset:-2,priority:'high',activities:['loading','discharging'],details:'Confirm product-specific SDS, MARPOL/IBC applicability, certificate of fitness, compatibility and company cargo instructions where relevant.'},
 {id:'cargoPlan',phase:'Before arrival',title:'Prepare and review cargo plan with responsible officers',category:'Cargo',offset:-1,priority:'high',activities:['loading','discharging'],details:'Review quantities, capacities, stresses/stability, segregation, rates, pressures, limits and emergency arrangements as applicable.'},
 {id:'tanksReady',phase:'Before arrival',title:'Verify tank readiness for nominated cargo',category:'Cargo',offset:-1,priority:'high',activities:['loading'],details:'Check actual tank condition and accepted preparation requirements; verify any necessary inspection / sampling / wall-wash documents.'},
 {id:'discharge',phase:'Before arrival',title:'Verify discharge sequence and transfer systems',category:'Cargo',offset:-1,priority:'high',activities:['discharging'],details:'Confirm cargo distribution, nominated tanks, valves, hoses, planned rates, stripping and required checks against approved plan.'},
 {id:'clean',phase:'Before arrival',title:'Prepare tank-cleaning sequence and waste strategy',category:'Tank cleaning',offset:-1,priority:'high',activities:['tank_cleaning'],details:'Assess cargo history, approved procedures, MARPOL Annex II residue requirements, safety controls and reception facilities where relevant.'},
 {id:'ptw',phase:'Before arrival',title:'Prepare task risk assessments and permits as needed',category:'Safety',offset:-1,priority:'high',activities:['tank_cleaning'],details:'Determine whether permits, isolations, enclosed-space precautions or work controls apply; no permit is considered approved by this reminder.'},
 {id:'shipshore',phase:'Alongside',title:'Complete ship/shore safety discussions and checks',category:'Cargo',offset:0,priority:'high',activities:['loading','discharging'],details:'Conduct real joint checks, agree communications and emergency stops according to applicable terminal/company procedures.'},
 {id:'lineup',phase:'Alongside',title:'Verify line-up and transfer safeguards before start',category:'Cargo',offset:0,priority:'high',activities:['loading','discharging'],details:'Physically verify the system and independent checks where required; do not mark completion based solely on a saved template.'},
 {id:'watch',phase:'Alongside',title:'Monitor transfer parameters and required records',category:'Cargo',offset:0,priority:'high',activities:['loading','discharging'],details:'Maintain actual transfer logs, communications, equipment checks and agreed response limits.'},
 {id:'monitorCleaning',phase:'Alongside',title:'Verify tank-cleaning equipment, wash parameters and records',category:'Tank cleaning',offset:0,priority:'high',activities:['tank_cleaning'],details:'Confirm approved cleaning instructions, machinery condition, PPE, atmospheres where relevant, and waste tracking.'},
 {id:'departureDocs',phase:'Before departure',title:'Close out documents and discrepancies before sailing',category:'Port documents',offset:0,priority:'normal',activities:['all'],details:'Check shipboard and terminal records relevant to this visit and communicate outstanding issues to Master.'},
 {id:'cargoClose',phase:'Before departure',title:'Verify post-transfer and cargo records',category:'Cargo',offset:0,priority:'high',activities:['loading','discharging'],details:'Review actual figures, line draining, sampling, seal arrangements, documents and any required logs as applicable.'},
 {id:'after',phase:'After departure',title:'Archive records and carry forward outstanding actions',category:'Documents',offset:1,priority:'normal',activities:['all'],details:'Record actual findings, link open actions to owners and dates, and file controlled documents in the approved QMS.'}
];
const activities=['general','loading','discharging','tank_cleaning'];
const priorities=['critical','high','normal','information'];
const categories=['Documents','Port documents','Safety','Cargo','Tank cleaning','People','Inspection','General'];
const clean=(v,max=180)=>String(v??'').trim().slice(0,max);
const day=v=>{const x=String(v||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(x))return '';const d=new Date(x+'T12:00:00Z');return !Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===x?x:'';};
export function dateOffset(iso,offset){const d=new Date(iso+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10);}
export function plannerToday(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
export function ensurePlanner(s){if(!s.planner||typeof s.planner!=='object')s.planner={};const p=s.planner;
 if(!Array.isArray(p.tasks))p.tasks=[];if(!Array.isArray(p.templates))p.templates=[];
 if(!p.profile||typeof p.profile!=='object')p.profile={vessel:'',port:'',eta:'',activity:'general'};
 return p;}
const nextId=()=>('t-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10));
function makeTask(o){return {id:nextId(),title:clean(o.title,160),details:clean(o.details,1600),category:categories.includes(o.category)?o.category:'General',priority:priorities.includes(o.priority)?o.priority:'normal',dueDate:day(o.dueDate),status:'open',owner:clean(o.owner,70),port:clean(o.port,80),phase:clean(o.phase,60),source:clean(o.source,40)||'manual',templateId:clean(o.templateId,80),portPlanKey:clean(o.portPlanKey,220),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),completedAt:''};}
export function restorePlanner(value){const raw=value&&typeof value==='object'?value:{};
 const profile=raw.profile&&typeof raw.profile==='object'?raw.profile:{};
 const safe={profile:{vessel:clean(profile.vessel,60),port:clean(profile.port,80),eta:day(profile.eta),activity:activities.includes(profile.activity)?profile.activity:'general'},tasks:[],templates:[],reminderSentDay:day(raw.reminderSentDay)};
 if(Array.isArray(raw.tasks))safe.tasks=raw.tasks.slice(0,1800).filter(x=>x&&typeof x==='object'&&clean(x.id,90)&&clean(x.title,160)).map(x=>({...makeTask(x),id:clean(x.id,90),status:x.status==='done'?'done':'open',createdAt:clean(x.createdAt,40),updatedAt:clean(x.updatedAt,40),completedAt:clean(x.completedAt,40)}));
 if(Array.isArray(raw.templates))safe.templates=raw.templates.slice(0,100).filter(x=>x&&typeof x==='object'&&clean(x.id,90)&&clean(x.title,160)).map(x=>({id:clean(x.id,90),title:clean(x.title,160),details:clean(x.details,1600),category:categories.includes(x.category)?x.category:'General',priority:priorities.includes(x.priority)?x.priority:'normal',owner:clean(x.owner,70)}));
 return safe;
}
export function plannerStats(p,today=plannerToday()){const tasks=p.tasks||[];const open=tasks.filter(t=>t.status!=='done');return {total:tasks.length,open:open.length,overdue:open.filter(t=>t.dueDate&&t.dueDate<today).length,today:open.filter(t=>t.dueDate===today).length,week:open.filter(t=>t.dueDate&&t.dueDate>=today&&t.dueDate<=dateOffset(today,7)).length};}
export function plannerAction(s,msg){if(!String(msg.type||'').startsWith('PLANNER_'))return null;
 const p=ensurePlanner(s),type=msg.type;
 if(type==='PLANNER_PROFILE'||type==='PLANNER_GENERATE_PORT'){
  const o=msg.profile||{},port=clean(o.port,80),eta=day(o.eta),activity=activities.includes(o.activity)?o.activity:'general',vessel=clean(o.vessel,60);
  if(type==='PLANNER_GENERATE_PORT'&&(!port||!eta))return {ok:false,error:'Port name and a valid ETA date are required.'};
  p.profile={port,eta,activity,vessel};
  if(type==='PLANNER_PROFILE')return {ok:true};
  const key=[port.toLowerCase(),eta,activity,vessel.toLowerCase()].join('|');let added=0;
  for(const item of WORKFLOW_TASKS){if(!(item.activities.includes('all')||item.activities.includes(activity)))continue;
   if(p.tasks.some(t=>t.portPlanKey===key&&t.templateId===item.id))continue;
   if(p.tasks.length>=1800)return {ok:false,error:'Planner task limit reached; archive tasks in a backup first.'};
   p.tasks.push(makeTask({...item,category:item.category,title:item.title,details:item.details,priority:item.priority,dueDate:dateOffset(eta,item.offset),port,source:'suggested workflow',phase:item.phase,templateId:item.id,portPlanKey:key}));added++;
  }
  return {ok:true,added};
 }
 if(type==='PLANNER_ADD'){
  const o=msg.task||{},title=clean(o.title,160);if(!title)return {ok:false,error:'Task title is required.'};
  if(p.tasks.length>=1800)return {ok:false,error:'Planner task limit reached.'};
  p.tasks.push(makeTask(o));return {ok:true};
 }
 if(type==='PLANNER_UPDATE'){
  const t=p.tasks.find(x=>x.id===msg.id);if(!t)return {ok:false,error:'Task not found'};
  const o=msg.patch||{};if('title' in o){if(!clean(o.title,160))return {ok:false,error:'Title cannot be empty'};t.title=clean(o.title,160);}
  if('details' in o)t.details=clean(o.details,1600);
  if('dueDate' in o)t.dueDate=day(o.dueDate);
  if('owner' in o)t.owner=clean(o.owner,70);
  if('priority' in o&&priorities.includes(o.priority))t.priority=o.priority;
  if('category' in o&&categories.includes(o.category))t.category=o.category;
  if('status' in o&&['open','done'].includes(o.status)){t.status=o.status;t.completedAt=o.status==='done'?new Date().toISOString():'';}
  t.updatedAt=new Date().toISOString();return {ok:true};
 }
 if(type==='PLANNER_DELETE'){const before=p.tasks.length;p.tasks=p.tasks.filter(t=>t.id!==msg.id);return before===p.tasks.length?{ok:false,error:'Task not found'}:{ok:true};}
 if(type==='PLANNER_SAVE_TEMPLATE'){
  const task=p.tasks.find(t=>t.id===msg.id);if(!task)return {ok:false,error:'Task not found'};
  if(p.templates.some(t=>t.title.toLowerCase()===task.title.toLowerCase()))return {ok:false,error:'This title is already in your reusable templates.'};
  if(p.templates.length>=100)return {ok:false,error:'Reusable template limit reached.'};
  p.templates.push({id:nextId(),title:task.title,details:task.details,category:task.category,priority:task.priority,owner:task.owner});return {ok:true};
 }
 if(type==='PLANNER_APPLY_TEMPLATE'){
  const temp=p.templates.find(t=>t.id===msg.id);if(!temp)return {ok:false,error:'Saved template not found'};
  if(p.tasks.length>=1800)return {ok:false,error:'Planner task limit reached.'};
  p.tasks.push(makeTask({...temp,dueDate:day(msg.dueDate),port:clean(p.profile.port,80),source:'approved personal template'}));return {ok:true};
 }
 if(type==='PLANNER_DELETE_TEMPLATE'){
  if(!p.templates.some(t=>t.id===msg.id))return {ok:false,error:'Saved template not found'};
  p.templates=p.templates.filter(t=>t.id!==msg.id);return {ok:true};
 }
 return {ok:false,error:'Unknown planner action'};
}
