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

export {validItem,hash};
