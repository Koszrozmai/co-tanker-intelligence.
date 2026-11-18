/* Isolated DOM parsing, no external scripts or dynamic HTML insertion. */
const text = el => (el?.textContent || '').replace(/\s+/g,' ').trim();
function absUrl(u,base){ try{let x=new URL(u,base);return /^https?:$/.test(x.protocol)?x.href:'';}catch{return '';} }
function cleanTitle(s){return (s||'').replace(/\s+/g,' ').replace(/^(more info|read more|continue reading)\s*[›»]?/i,'').trim().slice(0,230);}
function dateFrom(s){
 const v=String(s||'').replace(/\s+/g,' ').slice(0,200);
 const a=v.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
 if(a)return `${a[1]}-${a[2].padStart(2,'0')}-${a[3].padStart(2,'0')}`;
 const b=v.match(/\b(\d{1,2})[/.](\d{1,2})[/.](20\d{2})\b/);
 if(b&&+b[1]<=31&&+b[2]<=12)return `${b[3]}-${b[2].padStart(2,'0')}-${b[1].padStart(2,'0')}`;
 const c=v.match(/\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})(?!\d)/i);
 if(c){const m=['january','february','march','april','may','june','july','august','september','october','november','december'].indexOf(c[2].toLowerCase())+1;return `${c[3]}-${String(m).padStart(2,'0')}-${c[1].padStart(2,'0')}`;}
 return '';
}
function contextFor(a){
 let n=a;
 for(let i=0;i<4&&n;i++,n=n.parentElement){
  const dt=n.querySelector?.('time[datetime],time,[datetime]');
  if(dt)return {date:dateFrom(dt.getAttribute('datetime')||text(dt)) || dateFrom(text(n).slice(0,200)), description:text(n).slice(0,330)};
  if(n.tagName==='ARTICLE'||/\b(card|item|news|post|result|briefing)\b/i.test(n.className||''))return {date:dateFrom(text(n).slice(0,200)), description:text(n).slice(0,330)};
 }
 return {date:'',description:text(a.parentElement).slice(0,330)};
}
function collectHtml(doc,src){
 const selected=src.selector ? Array.from(doc.querySelectorAll(src.selector)):[];
 const nodes= selected.length ? selected : Array.from(doc.querySelectorAll('article h2 a, article h3 a, main h2 a, main h3 a')).filter(a=>a.href);
 const result=[];
 for(const a of nodes){
  let title=cleanTitle(text(a));
  if(title.length<13||/^(home|news|view all|more|next|previous|contact|archive|download)$/i.test(title))continue;
  const url=absUrl(a.getAttribute('href'),src.url);if(!url||url===src.url)continue;
  const ctx=contextFor(a);
  result.push({title,url,date:ctx.date,summary:ctx.description&&ctx.description!==title ? ctx.description.slice(0,300):''});
 }
 return result;
}
function collectParis(doc,src){
 const arr=[];
 // Headlines may be plain headings with a separate "More info" link.
 for(const h of doc.querySelectorAll('h3,h4')){
  const title=cleanTitle(text(h));if(title.length<18)continue;
  let parent=h;let a=h.querySelector('a[href]');
  for(let j=0;!a&&j<3&&parent;j++,parent=parent.parentElement){
   a=parent.querySelector('a[href]');
  }
  if(!a)continue;
  const url=absUrl(a.getAttribute('href'),src.url);
  if(!url || url===src.url || url.includes('/posts/news/'))continue;
  const ctx=contextFor(h);
  arr.push({title,url,date:ctx.date||dateFrom(text(h.parentElement?.parentElement).slice(0,180)),summary:''});
 }
 return arr.length?arr:collectHtml(doc,{...src,selector:'a[href*="parismou.org/"]'});
}
function collectCyprus(doc,src){
 const r=[];
 for(const tr of doc.querySelectorAll('table tr')){
  const c=[...tr.querySelectorAll('td')];if(c.length<3)continue;
  const arr=c.map(text);const date=dateFrom(arr[0]);
  const subject=arr.slice(1).sort((a,b)=>b.length-a.length).find(x=>x.length>19);
  if(!subject)continue;
  const links=[...tr.querySelectorAll('a[href]')];
  const target=links.find(a=>/pdf|circular|download/i.test(a.getAttribute('href')||''))||links[0];
  const url=target?absUrl(target.getAttribute('href'),src.url):src.url;
  r.push({title:cleanTitle(subject),url,date,summary:`Cyprus Shipping Deputy Ministry circular. ${arr.slice(0,3).join(' · ')}`.slice(0,320)});
 }
 if(!r.length){ // Never use empty or generic "news" as a false flag update.
  return collectHtml(doc,{...src,selector:'main a[href$=".pdf"], article a[href$=".pdf"]'});
 }
 return r;
}
function child(n,tag){return [...n.children].find(x=>x.localName?.toLowerCase()===tag.toLowerCase());}
function collectFeed(doc,src){
 const r=[];const nodes=[...doc.querySelectorAll('item,entry')];
 for(const node of nodes){
  const title=cleanTitle(text(child(node,'title')));
  let link='';for(const x of [...node.children].filter(x=>x.localName?.toLowerCase()==='link')) {if(x.getAttribute('rel')!=='self'){link=x.getAttribute('href')||text(x);if(link)break;}}
  const date=text(child(node,'pubDate')||child(node,'published')||child(node,'updated'));
  const iso = dateFrom(date) || (Number.isNaN(Date.parse(date))?'':new Date(date).toISOString().slice(0,10));
  const description=text(child(node,'description')||child(node,'summary')||child(node,'content'));
  if(title.length>=12)r.push({title,url:absUrl(link,src.url),date:iso,summary:description.slice(0,300)});
 }
 return r;
}
function parse(src,raw){
 if(typeof raw!=='string'||raw.length<120)throw Error('Empty or invalid source response');
 if(/<title[^>]*>\s*(403 Forbidden|Access Denied|404|Just a moment)/i.test(raw.slice(0,5000)))throw Error('Source blocked access / challenge');
 const xml=raw.trimStart().startsWith('<?xml')||/<(rss|feed)(\s|>)/i.test(raw.slice(0,800));
 const doc=new DOMParser().parseFromString(raw,xml?'text/xml':'text/html');
 if(xml&&doc.querySelector('parsererror'))throw Error('Invalid XML feed');
 let items=xml?collectFeed(doc,src):src.mode==='cyprus'?collectCyprus(doc,src):src.mode==='paris'?collectParis(doc,src):collectHtml(doc,src);
 const unique=new Map();
 for(const item of items){
  if(!item.url || !/^https?:\/\//.test(item.url) || item.title.length<12)continue;
  const key=(item.url+'|'+item.title.toLowerCase()).slice(0,800);
  if(!unique.has(key))unique.set(key,item);
 }
 return [...unique.values()].slice(0,75);
}
chrome.runtime.onMessage.addListener((message,sender,reply)=>{
 if(message?.type!=='PARSE_HTML')return false;
 try{reply({ok:true,items:parse(message.source,message.raw)});}catch(e){reply({ok:false,error:String(e.message||e)});}
 return false;
});
