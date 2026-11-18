#!/usr/bin/env python3
"""Conservative public-source link collector for CO Tanker Intelligence.

Does not infer legal applicability, effective dates or compliance status from a headline.
Designed to run on GitHub Actions with a transparent static JSON output.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import sys
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.parse import urljoin, urlparse, urldefrag
import requests
from email.utils import parsedate_to_datetime
from lxml import etree, html

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUTPUT = ROOT/'docs'/'data'/'intelligence.json'
UA = 'CO-Tanker-Intelligence/1.6 (public listing monitor; admin contact: configure repo owner)' 
HEADERS = {'User-Agent': UA, 'Accept': 'text/html,application/xml,application/rss+xml;q=0.9,*/*;q=0.5'}
MAX_ENTRIES = 350
MAX_BYTES = 1_800_000

def now(): return datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')
def clean(s): return re.sub(r'\s+', ' ', str(s or '')).strip()
def digest(s): return hashlib.sha256(s.encode('utf-8')).hexdigest()[:24]
def allowed(url, origin_host):
    try:
        p=urlparse(url)
        allowed_hosts={origin_host, origin_host.removeprefix('www.'), 'www.'+origin_host.removeprefix('www.')}
        return p.scheme=='https' and p.hostname in allowed_hosts and p.port in (None,443) and not p.username and not p.password
    except Exception:return False

def canonical(base, href, host):
    if not href or href.startswith(('#','javascript:','mailto:')):return None
    link=urldefrag(urljoin(base, href))[0]
    return link if allowed(link,host) else None

def parse_html(source, content):
    tree = html.fromstring(content)
    xpath = source.get('xpath')
    if xpath:
        anchors = tree.xpath(xpath)
    else:
        # Support the original v1.5 source file and its compact href selectors.
        needles = re.findall(r"a\[href\*=['\"]([^'\"]+)['\"]\]", source.get('selector', ''))
        anchors = [a for a in tree.xpath('//a[@href]') if not needles or any(
            needle.lower() in a.get('href','').lower() for needle in needles)]
    found = {}
    for a in anchors[:400]:
        link = canonical(source['url'], a.get('href',''), source['host'])
        if not link or link.rstrip('/') == source['url'].rstrip('/') or link in found:
            continue
        path = urlparse(link).path.lower()
        if path.endswith('default.aspx') or any(p in path for p in ('/login','/sign-in','/register','/subscribe','/category/','/page/')):
            continue
        if source.get('path_rule') and source['path_rule'].lower() not in path:
            continue
        title = clean(' '.join(a.itertext()))
        published = None
        if source['mode'] == 'cyprus':
            cells = a.xpath('ancestor::tr[1]/td')
            if len(cells) < 3:
                continue
            published = parse_date(clean(' '.join(cells[0].itertext())))
            title = clean(' '.join(cells[1].itertext()) + ' ' + ' '.join(cells[2].itertext()))
        else:
            context = a.xpath('ancestor::*[self::article or self::li or self::tr][1]')
            if context:
                times = context[0].xpath('.//time')
                if times:
                    published = parse_date(times[0].get('datetime') or ''.join(times[0].itertext()))
            if len(title) < 17:
                continue
        if 17 <= len(title) <= 420:
            found[link] = {'title':title[:200], 'url':link, 'published':published}
        if len(found) >= 35:
            break
    return list(found.values())


def parse_date(value):
    if not value:
        return None
    s = clean(value)
    match = re.match(r'^(20\d{2}-\d{2}-\d{2})(?:T| |$)', s)
    try:
        if match:
            day = datetime.strptime(match[1], '%Y-%m-%d').date()
        elif re.fullmatch(r'\d{2}/\d{2}/20\d{2}', s):
            day = datetime.strptime(s, '%d/%m/%Y').date()
        else:
            day = parsedate_to_datetime(s).date()
        return day.isoformat() if datetime(2015,1,1).date() <= day <= datetime.now(timezone.utc).date() else None
    except (ValueError,TypeError,OverflowError):
        return None


def parse_feed(source, raw):
    parser = etree.XMLParser(resolve_entities=False, no_network=True, load_dtd=False, recover=False, huge_tree=False)
    root = etree.fromstring(raw.encode('utf-8') if isinstance(raw,str) else raw, parser)
    output = []
    for item in root.xpath('//*[local-name()="item" or local-name()="entry"]')[:50]:
        title = clean(item.xpath('string(*[local-name()="title"][1])'))
        links = item.xpath('*[local-name()="link" and (not(@rel) or @rel="alternate")]')
        if not links:
            continue
        url = canonical(source['url'],links[0].get('href') or clean(links[0].text),source['host'])
        stamp = item.xpath('string(*[local-name()="published" or local-name()="pubDate" or local-name()="date"][1])')
        if url and len(title) >= 17:
            output.append({'title':title[:200],'url':url,'published':parse_date(stamp)})
    return output


def classify(title,src):
    t=title.lower()
    if any(w in t for w in ['sire','ocimf','vetting']):return 'SIRE 2.0 / vetting'
    if any(w in t for w in ['cdi','chemical','tank cleaning','ibc','cargo','marpol annex ii']):return 'Chemical tanker operations'
    if any(w in t for w in ['inspection','paris mou','psc','detention','deficien']):return 'PSC / inspections'
    if any(w in t for w in ['pollution','emissions','ballast','mepc','marpol','fueleu','carbon']):return 'Environment / MARPOL'
    if any(w in t for w in ['solas','safety','accident','incident','fire','mooring']):return 'Safety & equipment'
    return src['topic']

def study_card(entry):
    topic=entry['topic']
    group=('SIRE 2.0' if 'SIRE' in topic else 'CDI-M' if 'CDI' in topic or 'Chemical' in topic else 'PSC' if 'PSC' in topic else 'Chief Officer')
    return {'id':'learning-'+entry['id'], 'source_id':entry['source_id'], 'source_url':entry['url'], 'title':'Research briefing: '+entry['title'][:100],
        'learning_objective':'Use the linked original publication to determine whether it affects your vessel, crew, equipment, voyage or upcoming inspection.',
        'questions':[f'What does the original publication actually state, and what is only a proposal or news item?',
                     'Does it apply to our chemical/product tanker, flag, trading area and cargo?',
                     f'Could this change any {group} preparation or onboard records, subject to the approved SMS and manuals?'],
        'status':'GUIDED RESEARCH / NEEDS SOURCE REVIEW', 'created_at':entry['discovered_at'], 'topic':topic}

def read_json(path, fallback):
    try:return json.loads(Path(path).read_text(encoding='utf-8'))
    except (OSError,ValueError):return fallback

def run(sources, previous, session=None, delay=0):
    sess=session or requests.Session();current=now()
    old={x['id']:x for x in previous.get('entries',[]) if isinstance(x,dict) and 'id' in x}
    old_source={x['id']:x for x in previous.get('sources',[]) if isinstance(x,dict) and 'id' in x}
    health=[];new=0
    for src in sources:
        spec=dict(src);spec['url']=spec['url'].replace('{year}',str(datetime.now(timezone.utc).year))
        last = old_source.get(src['id'],{})
        if last.get('url') != spec['url']:
            last = {}
        if last.get('next_attempt') and last['next_attempt'] > current:
            health.append({**last, 'deferred':True})
            continue
        response = None
        retry_after = None
        state={**last, 'deferred':False,'id':src['id'],'name':src['name'],'url':spec['url'],'last_attempt':current,'ok':False,'error':None}
        try:
            # Server-side hardcoded sources only, no arbitrary user-supplied URLs.
            if not allowed(spec['url'],src['host']):raise ValueError('Unapproved source domain')
            request_headers={**HEADERS}
            if state.get('etag'):request_headers['If-None-Match']=state['etag']
            if state.get('modified'):request_headers['If-Modified-Since']=state['modified']
            request_url=spec['url']
            response=sess.get(request_url,headers=request_headers,timeout=(6,18),allow_redirects=False,stream=True)
            redirects=0
            while 300<=response.status_code<400 and response.status_code!=304 and redirects<3:
                candidate=canonical(request_url,response.headers.get('Location',''),src['host'])
                if not candidate:raise RuntimeError('Unsafe or missing redirect target')
                response.close();request_url=candidate;redirects+=1
                response=sess.get(request_url,headers=HEADERS,timeout=(6,18),allow_redirects=False,stream=True)
            if response.status_code==304:
                if not state.get('last_success'):raise RuntimeError('Unexpected 304 without a prior successful check')
                state.update(ok=True,last_success=current,fetch_status='unchanged',next_attempt=None,consecutive_failures=0)
                health.append(state);continue
            if response.status_code==429:
                retry_after=response.headers.get('Retry-After')
            if response.status_code!=200:raise RuntimeError('HTTP '+str(response.status_code))
            length=int(response.headers.get('Content-Length','0') or 0)
            if length>MAX_BYTES:raise RuntimeError('Page exceeds maximum size')
            buf=bytearray()
            for chunk in response.iter_content(chunk_size=32_768):
                buf.extend(chunk)
                if len(buf)>MAX_BYTES:raise RuntimeError('Page exceeds maximum size')
            raw=bytes(buf)
            if not raw:raise RuntimeError('Empty response')
            sample=raw.decode(response.encoding or 'utf-8',errors='replace')
            entries=parse_feed(spec,sample) if '<rss' in sample[:400].lower() or '<feed' in sample[:400].lower() else parse_html(spec,sample)
            if not entries:raise RuntimeError('No matching publications: layout, permissions or selector may have changed')
            for doc in entries:
                item_id=digest(src['id']+'|'+doc['url']);topic=classify(doc['title'],spec)
                if item_id in old:
                    old[item_id]['last_seen']=current
                    previous_item=old[item_id]
                    new_date=doc.get('published') or previous_item.get('published')
                    if (previous_item['title'],previous_item.get('published'))!=(doc['title'],new_date):
                        prior={'revision':previous_item.get('revision',1),'at':previous_item.get('changed_at',previous_item.get('discovered_at')),'title':previous_item['title'],'published':previous_item.get('published')}
                        previous_item.update(title=doc['title'], published=new_date, revision=prior['revision']+1, changed_at=current, updated_at=current,
                                             history=[prior,*previous_item.get('history',[])][:4])
                        state['last_change_detected']=current
                    continue
                old[item_id]={'id':item_id,'source_id':src['id'],'source_name':src['name'],'title':doc['title'],'url':doc['url'],'topic':topic,
                    'region':src['region'],'published':doc.get('published'),'scope':'listing','legal_status':'under review','revision':1,'changed_at':current,'discovered_at':current,'last_seen':current,
                    'status_label':'Public source listing detected; legal status and entry into force NOT verified'}
                new+=1
                state['last_change_detected']=current
            state.update(next_attempt=None,consecutive_failures=0,fetch_status='ok')
            state['ok']=True;state['last_success']=current;state['entry_count']=len(entries);state['error']=None
            state['etag']=str(response.headers.get('ETag',''))[:200] or None
            state['modified']=str(response.headers.get('Last-Modified',''))[:200] or None
        except (requests.RequestException,RuntimeError,ValueError) as ex:
            state['error']=str(ex)[:220]
        except Exception as ex:
            state['error']='Unexpected parse failure: '+type(ex).__name__
        finally:
            if response is not None and hasattr(response,'close'):response.close()
        if not state['ok']:
            count=state.get('consecutive_failures',0)+1
            interval=min(24*3600,3600*2**min(count-1,5))
            if retry_after:
                try:
                    seconds=float(retry_after) if retry_after.isdigit() else (parsedate_to_datetime(retry_after)-datetime.now(timezone.utc)).total_seconds()
                    interval=max(interval,seconds)
                except (ValueError,TypeError,OverflowError):pass
            retry_at=datetime.now(timezone.utc)+timedelta(seconds=min(interval,30*86400))
            state.update(fetch_status='unavailable',consecutive_failures=count,next_attempt=retry_at.isoformat(timespec='seconds').replace('+00:00','Z'))
        health.append(state)
        if delay:time.sleep(delay)
    newest=sorted(old.values(),key=lambda x:x.get('changed_at') or x.get('discovered_at',''),reverse=True)[:MAX_ENTRIES]
    # Suggest a limited number of source-based exercises. No invented regulatory interpretations.
    training=[study_card(it) for it in newest[:50]]
    return {'schema_version':1,'generated_at':current,'collector_status':'RUN_COMPLETED' if all(x['ok'] for x in health) else 'PARTIAL' if any(x['ok'] for x in health) else 'ALL_SOURCES_FAILED',
            'entries':newest,'lessons':training,'sources':health,'new_links_this_run':new,
            'disclaimer':'Discovery from public listing pages only. All legal status, effective dates, applicability and onboard actions require verification.'}

def main():
    p=argparse.ArgumentParser();p.add_argument('--sources',default=str(Path(__file__).with_name('sources.json')));p.add_argument('--output',default=str(DEFAULT_OUTPUT));p.add_argument('--delay',type=float,default=0.5)
    a=p.parse_args();sources=read_json(a.sources,[])
    if not sources:sys.exit('No configured sources')
    out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True)
    prior=json.loads(out.read_text(encoding='utf-8')) if out.exists() else {'entries':[],'sources':[]}
    if not isinstance(prior,dict) or not isinstance(prior.get('entries'),list) or not isinstance(prior.get('sources'),list):
        sys.exit('Existing feed is invalid. Restore the previous snapshot before writing.')
    result=run(sources,prior,delay=max(0,min(a.delay,3)))
    temp=out.with_suffix('.tmp');temp.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');temp.replace(out)
    print('Collector completed:',result['new_links_this_run'],'new links; successful sources',sum(x['ok'] for x in result['sources']),'/',len(sources),'output:',out)
    if not any(x['ok'] for x in result['sources']):print('WARNING: All sources failed; status retained in public feed',file=sys.stderr)

if __name__=='__main__':main()
