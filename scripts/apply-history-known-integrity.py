#!/usr/bin/env python3
"""Apply private, source-anchored page corrections to a separate local candidate.

Review input is private. Source PDF, quiz files and immutable old data are not
write targets. A full native ID/text check is required after application.
"""
import argparse,collections,hashlib,json
from pathlib import Path

SOURCE='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ids(x):
 if isinstance(x,dict):
  for k,v in x.items():
   if k=='sourceCharIds':yield from v
   elif k not in ['transcriptionAudit','referenceTranscriptionAudit','pageTranscriptionReview','sourceRelationReview']:yield from ids(v)
 elif isinstance(x,list):
  for v in x:yield from ids(v)
def native_pairs(x):
 if isinstance(x,dict):
  if x.get('sourceCharIds') and isinstance(x.get('text'),str):
   assert len(x['sourceCharIds'])==len(x['text']), 'native span length'
   yield from zip(x['sourceCharIds'],x['text'])
  else:
   for k,v in x.items():
    if k not in ['transcriptionAudit','referenceTranscriptionAudit','pageTranscriptionReview','sourceRelationReview']:yield from native_pairs(v)
 elif isinstance(x,list):
  for v in x:yield from native_pairs(v)
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,separators=(',',':'))+'\n')
def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('candidate',type=Path);parser.add_argument('review',type=Path);a=parser.parse_args();root=a.candidate.resolve()
 assert root.name==SOURCE and 'private-data' in root.parts and 'correction-candidates' in root.parts and any(p.startswith('known-integrity-') for p in root.parts)
 review=json.loads(a.review.read_text());assert review['sourceSha256']==SOURCE and sha(root/'raw/source/original.pdf')==SOURCE
 semantic=root/'semantic';quizzes={p.name:sha(p) for p in (semantic/'quizzes').glob('*.json')};manifest=json.loads((semantic/'manifest.json').read_text());plans={}
 for rec in review['records']:
  n=rec['pdfPage'];path=semantic/f'pages/page-{n:03}.json';assert path not in plans and sha(path)==rec['beforePageSha256'],('source page pin',n)
  before=json.loads(path.read_text());after=rec['page'];assert after['pdfPage']==n and after['sourceSha256']==SOURCE
  assert collections.Counter(native_pairs(before['blocks']))==collections.Counter(native_pairs(after['blocks'])),('source native text or IDs changed',n)
  raw=json.loads((root/f'raw/pages/page-{n:03}.json').read_text());assert sha(root/'raw'/raw['imagePath'])==rec['sourceRenderSha256']
  assert len((json.dumps(after,ensure_ascii=False,separators=(',',':'))+'\n').encode())<=2*1024*1024
  plans[path]=after
 for path,page in plans.items():write(path,page)
 for item in manifest['pages']:
  path=semantic/f"pages/page-{item['pdfPage']:03}.json"
  if path in plans:item['studySectionCounts']={s:sum(b['studySection']==s for b in plans[path]['blocks']) for s in ['concept','exam']}
 write(semantic/'manifest.json',manifest)
 assert quizzes=={p.name:sha(p) for p in (semantic/'quizzes').glob('*.json')}
 write(root/'validation/known-integrity-application.json',dict(sourceSha256=SOURCE,reviewId=review['reviewId'],pages=sorted(p['pdfPage'] for p in plans.values()),nativeCharacterIdsUnchanged=True,quizBytesUnchanged=True,sourcePdfUnchanged=True,activated=False))
 print(json.dumps(dict(pages=len(plans),nativeIdsUnchanged=True,quizBytesUnchanged=True,activated=False)))
if __name__=='__main__':main()
