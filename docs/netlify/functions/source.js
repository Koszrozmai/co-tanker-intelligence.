const SOURCES={
 imo:'https://www.imo.org/en/mediacentre/pressbriefings/pages/default.aspx',
 cyprus:'https://www.gov.cy/dms/en/documents/circulars-'+new Date().getUTCFullYear()+'/',
 paris:'https://parismou.org/posts/news/',
 intertanko:'https://www.intertanko.com/news-desk',
 ocimf:'https://www.ocimf.org/news-and-events/newsletter',
 emsa:'https://www.emsa.europa.eu/newsroom/latest-news.html',
 bimco:'https://www.bimco.org/news-insights/bimco-news/',
 echa:'https://echa.europa.eu/news',
 mca:'https://www.gov.uk/government/organisations/maritime-and-coastguard-agency'
};
exports.handler=async(event)=>{
 const id=event.queryStringParameters?.id||'';
 if(!Object.prototype.hasOwnProperty.call(SOURCES,id))return {statusCode:400,body:'Unknown approved source identifier'};
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetch(SOURCES[id],{signal:controller.signal,redirect:'manual',headers:{'Accept':'text/html, application/rss+xml, application/atom+xml;q=0.8','User-Agent':'CO-Tanker-Intelligence-Reader/1.2 (public-source index; no authentication)'}});
  if(response.status>=300&&response.status<400)return{statusCode:502,body:'Source redirected; update verified canonical source URL in the serverless function.'};
  if(!response.ok)return{statusCode:response.status>=400&&response.status<600?response.status:502,body:'Public source returned HTTP '+response.status};
  const declared=Number(response.headers.get('content-length')||0);
  if(declared>2400000)return{statusCode:413,body:'Source page exceeds safe size limit'};
  const body=(await response.text());
  if(body.length>2400000)return{statusCode:413,body:'Source page exceeds safe size limit'};
  return{statusCode:200,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=600','X-Content-Type-Options':'nosniff'},body};
 }catch(e){return{statusCode:502,body:'Source fetch failed: '+String(e.message||e).slice(0,150)}}finally{clearTimeout(timer)}
};
