import unittest
from collector import parse_html, classify, run, study_card, allowed

SRC={'id':'imo','name':'IMO','host':'www.imo.org','url':'https://www.imo.org/en/mediacentre/pressbriefings/pages/default.aspx','selector':"a[href*='/mediacentre/pressbriefings/pages/']",'path_rule':'/mediacentre/pressbriefings/pages/','mode':'html','topic':'Safety','region':'Global'}
class FakeResponse:
 status_code=200
 headers={}
 encoding='utf-8'
 def iter_content(self,chunk_size):
  yield b'<h3><a href="/en/mediacentre/pressbriefings/pages/chemical-tanker-safety-update.aspx">Chemical tanker safety review guidance</a></h3><a href="https://evil.test/malware">Malware link content</a>'
class FakeSession:
 def get(self,*args,**kwargs):return FakeResponse()
class TestCollector(unittest.TestCase):
 def test_reject_external(self):
  self.assertFalse(allowed('https://other.example/test','www.imo.org'))
 def test_extract(self):
  html='<h3><a href="/en/mediacentre/pressbriefings/pages/chemical-tanker-safety-update.aspx">Chemical tanker safety review guidance</a></h3><a href="https://bad.test/danger">Bad news title and dangerous link</a>'
  rows=parse_html(SRC,html)
  self.assertEqual(len(rows),1)
  self.assertEqual(rows[0]['published'],None)
 def test_no_fake_legal_claims(self):
  result=run([SRC],{'entries':[],'sources':[]},session=FakeSession())
  self.assertEqual(len(result['entries']),1)
  self.assertIn('NOT verified',result['entries'][0]['status_label'])
  self.assertNotIn('effective_date',result['entries'][0])
  self.assertEqual(result['lessons'][0]['status'],'GUIDED RESEARCH / NEEDS SOURCE REVIEW')
 def test_dedup(self):
  x=run([SRC],{'entries':[],'sources':[]},session=FakeSession())
  y=run([SRC],x,session=FakeSession())
  self.assertEqual(y['new_links_this_run'],0)
  self.assertEqual(len(y['entries']),1)
if __name__=='__main__':unittest.main()
