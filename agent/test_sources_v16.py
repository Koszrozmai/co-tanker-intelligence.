from pathlib import Path
import copy,json,unittest
from collector import parse_date,parse_html,parse_feed,run
from test_collector import FakeResponse,FakeSession,SRC

class SourceCases(unittest.TestCase):
    def test_calendar_and_rss_dates(self):
        self.assertEqual(parse_date('Fri, 06 Nov 2026 11:45:00 +0000'),'2026-11-06')
        self.assertEqual(parse_date('2026-01-19T07:15:00Z'),'2026-01-19')
        self.assertIsNone(parse_date('2026-02-31'))
        self.assertIsNone(parse_date('2099-12-31'))
    def test_rss_and_atom_dates(self):
        raw='<rss><channel><item><title>Chemical tanker publication</title><link>https://www.imo.org/news/item</link><pubDate>Fri, 06 Nov 2026 11:45:00 +0000</pubDate></item></channel></rss>'
        self.assertEqual(parse_feed(SRC,raw)[0]['published'],'2026-11-06')
        atom='<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Chemical tanker publication</title><link rel="self" href="https://www.imo.org/wrong"/><link rel="alternate" href="https://www.imo.org/right"/><updated>2026-11-06</updated></entry></feed>'
        actual=parse_feed(SRC,atom)[0]
        self.assertEqual(actual['url'],'https://www.imo.org/right');self.assertIsNone(actual['published'])
    def test_circular_title_is_from_the_correct_row(self):
        src=next(x for x in json.loads(Path(__file__).with_name('sources.json').read_text()) if x['id']=='cyprus')
        page='<table><tr><td>06/11/2026</td><td>15/2026</td><td>Test maritime circular title in English</td><td></td><td><a href="/pdf/circular.pdf">15-2026</a></td></tr></table>'
        doc=parse_html(src,page)[0]
        self.assertEqual(doc['published'],'2026-11-06');self.assertIn('15/2026 Test maritime',doc['title'])
    def test_fetch_failure_retains_previous_success_and_delays_retries(self):
        s=run([SRC],{'entries':[],'sources':[]},session=FakeSession())
        class Denied(FakeSession):
            def get(self,*args,**kwargs):
                response=FakeResponse();response.status_code=429;response.headers={'Retry-After':'7200'};return response
        failed=run([SRC],copy.deepcopy(s),session=Denied())
        h=failed['sources'][0];self.assertEqual(h['last_success'],s['sources'][0]['last_success'])
        self.assertEqual(failed['collector_status'],'ALL_SOURCES_FAILED');self.assertIsNotNone(h['next_attempt'])
        stayed=run([SRC],failed,session=FakeSession())
        self.assertTrue(stayed['sources'][0]['deferred']);self.assertEqual(len(stayed['entries']),1)
    def test_changed_title_preserves_revision_history(self):
        s=run([SRC],{'entries':[],'sources':[]},session=FakeSession())
        original=s['entries'][0]['title'];s['entries'][0]['title']='Previous circular title'
        after=run([SRC],s,session=FakeSession())['entries'][0]
        self.assertEqual(after['revision'],2);self.assertEqual(after['title'],original);self.assertEqual(after['history'][0]['title'],'Previous circular title')
