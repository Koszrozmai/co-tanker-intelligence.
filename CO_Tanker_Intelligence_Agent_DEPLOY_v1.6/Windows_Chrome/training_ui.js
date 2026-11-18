import {PRACTICE_QUESTIONS, REFERENCE_DESK, VERIFIED_BRIEFS, dueQuestions, today,ensurePractice} from './training_engine.js';
const byId=id=>document.getElementById(id);
const make=(tag,cls,txt)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=txt;return el;};
const add=(el,...parts)=>{for(const c of parts)if(c)el.append(c);return el;};
const practiceLink=(url,title)=>{const a=make('a','reference-short',title);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;};
const selector=()=>byId('practiceFilter')?.value||'all';
let questionId='',revealed=false,lastPrompt='';
export function renderPractice(env){const state=env.getState();if(!state)return;const p=ensurePractice(state),filter=selector(),due=dueQuestions(state,filter),total=PRACTICE_QUESTIONS.filter(q=>filter==='all'||q.inspection===filter).length;
 byId('practiceStats').textContent=`${due.length} due / ${total} questions in this selection · ${Object.keys(p.reviews).length} reviewed · ${p.sessions||0} total reviews`;
 const list=byId('practiceQueue');list.replaceChildren();const archived=PRACTICE_QUESTIONS.filter(q=>(filter==='all'||q.inspection===filter)&&!due.includes(q));
 if(!questionId||!PRACTICE_QUESTIONS.some(q=>q.id===questionId&&(filter==='all'||q.inspection===filter)))questionId=(due[0]||archived[0]||{}).id;
 const q=PRACTICE_QUESTIONS.find(x=>x.id===questionId);
 if(q){const progress=p.reviews[q.id];const card=make('article','scenario-card');
  add(card,make('div','card-eyebrow',`${q.inspection.toUpperCase()} · ${q.topic} · ${q.id}`),make('h3','',q.question));
  add(card,make('p','subtle','Think about your actual ship, documents and practical evidence before revealing the discussion points.'));
  if(revealed){const panel=make('div','scenario-guidance');add(panel,make('b','','Suggested discussion points (not a model inspection answer)'),make('p','',q.guidance),practiceLink(q.url,'Open official reference'));card.append(panel);}
  else add(card,practiceButton('Reveal guidance',()=>{revealed=true;renderPractice(env)},'practiceButton-outline'));
  if(revealed){const buttons=make('div','scenario-actions');for(const [key,label] of [['again','↺ Repeat today'],['soon','◷ Review in 2 days'],['confident','✓ Confident']])buttons.append(practiceButton(label,async()=>{
    const out=await env.send('TRAINING_RATE',{questionId:q.id,rating:key});if(!out?.ok)return env.toast(out?.error||'Could not save review',true);revealed=false;questionId='';await env.reload();renderPractice(env);env.toast('Review saved · next due date updated');
   },key==='confident'?'practiceButton-primary':'practiceButton-outline'));card.append(buttons);}
  if(progress)card.append(make('p','micro',`Last review: ${progress.last.slice(0,10)} · Next due: ${progress.due} · Confidence streak: ${progress.streak}`));
  list.append(card);
 }else list.append(make('p','intro','No questions available for this selection.'));
 const nav=make('div','practice-mini-list');for(const q2 of (due.length?due:archived).slice(0,12)){nav.append(practiceButton(`${q2.inspection.toUpperCase()} · ${q2.topic}`,()=>{questionId=q2.id;revealed=false;renderPractice(env)},'mini-btn'+(q2.id===questionId?' is-selected':'')));}list.append(nav);
 const briefBox=byId('verifiedBriefs');briefBox.replaceChildren();for(const brief of VERIFIED_BRIEFS){const box=make('article','brief-card');add(box,make('span','card-eyebrow',brief.status),make('h3','',brief.title),make('div','micro',brief.date),make('p','subtle',brief.summary),practiceLink(brief.url,'Open original source'));briefBox.append(box);}
 const ref=byId('referencesDesk');ref.replaceChildren();for(const r of REFERENCE_DESK){const box=make('div','desk-reference');add(box,make('div','card-eyebrow',`${r.topic} · ${r.region}`),practiceLink(r.url,r.title),make('p','subtle',r.summary));ref.append(box);}
}
function practiceButton(label,fn,cls='practiceButton-outline'){const b=make('button',cls,label);b.type='practiceButton';b.addEventListener('click',fn);return b;}
function promptText(question,focus,reference){return `You are a cautious tanker Chief Officer knowledge assistant. Respond in professional English.\n\nQuestion: ${question}\nTopic: ${focus}\nOfficial reference to verify: ${reference}\n\nUse current verified primary sources where possible. Distinguish mandatory law from industry guidance and company-specific procedures. State publication date vs effective date and verify ship/flag/cargo/GT applicability. Cite URLs. Do not invent clause numbers, exact thresholds or inspection answers. Provide: (1) practical explanation, (2) checks onboard, (3) crew interview preparation, (4) what to verify with the vessel SMS/P&A Manual/SDS/Certificate of Fitness. No assumed evidence of completed checks.`;}
export function wirePractice(env){
 byId('practiceFilter').addEventListener('change',()=>{questionId='';revealed=false;renderPractice(env)});
 byId('practiceNext').addEventListener('click',()=>{const due=dueQuestions(env.getState(),selector()),candidate=due.find(x=>x.id!==questionId)||due[0];if(candidate){questionId=candidate.id;revealed=false;renderPractice(env)}});
 byId('askReference').addEventListener('change',()=>{});
 byId('buildAIPrompt').addEventListener('click',()=>{
  const question=byId('askQuestion').value.trim();if(question.length<8){env.toast('Please enter a question with at least 8 characters',true);return;}
  const focus=byId('askTopic').value,ref=REFERENCE_DESK.find(r=>r.id===byId('askReference').value)||REFERENCE_DESK[0];lastPrompt=promptText(question,focus,ref.url);byId('askPreview').value=lastPrompt;byId('askPreview').hidden=false;byId('copyAsk').disabled=false;
 });
 byId('copyAsk').addEventListener('click',async()=>{
  if(!lastPrompt)return;try{await navigator.clipboard.writeText(lastPrompt);env.toast('Question and safety context copied — paste into your AI chat.');}
  catch{byId('askPreview').hidden=false;byId('askPreview').focus();byId('askPreview').select();env.toast('Clipboard unavailable. Select and copy the text shown.');}
 });
 for(const [id,url] of [['openChatGPT','https://chatgpt.com/'],['openGemini','https://gemini.google.com/']])byId(id).addEventListener('click',()=>window.open(url,'_blank','noopener,noreferrer'));
 const sel=byId('askReference');for(const r of REFERENCE_DESK){const opt=new Option(r.title,r.id);sel.add(opt)}
}
