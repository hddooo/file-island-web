#!/usr/bin/env python3
"""Apply private, pixel-reviewed span styles to a separate local candidate."""
import argparse,hashlib,json
from pathlib import Path
N='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def normalized(x):
 if isinstance(x,list):return [normalized(v) for v in x]
 if not isinstance(x,dict):return x
 if 'spans' in x:
  chars=[]
  for s in x['spans']:
   other={k:v for k,v in s.items() if k not in ['text','renderText','sourceCharIds','sourceStyle','sourceStyleAudit']}
   for i,ch in enumerate(s['text']):chars.append(dict(text=ch,properties=other,**({'id':s['sourceCharIds'][i]} if s.get('sourceCharIds') else {}),**({'renderText':s['renderText'][i]} if 'renderText'in s else {})))
  return {**{k:normalized(v) for k,v in x.items() if k!='spans'},'characters':chars}
 return {k:normalized(v) for k,v in x.items()}
def validate_styles(x):
 if isinstance(x,dict):
  if 'sourceStyleAudit'in x:assert 'sourceStyle'in x
  if 'sourceStyle'in x:
   s=x['sourceStyle'];assert isinstance(s,dict) and s and set(s)<=set(['ink','underline','highlight','bold'])
   if 'ink'in s:assert s['ink'] in ['default','muted','red','green']
   for k in ['underline','bold']:
    if k in s:assert s[k] is True
   if 'highlight'in s:assert s['highlight']=='green'
   assert x.get('sourceStyleAudit')==dict(verified=True,sourceRevision=N)
  for v in x.values():validate_styles(v)
 elif isinstance(x,list):
  for v in x:validate_styles(v)
def main():
 a=argparse.ArgumentParser(description=__doc__);a.add_argument('candidate',type=Path);a.add_argument('review',type=Path);args=a.parse_args();r=args.candidate.resolve();assert r.name==N and 'private-data'in r.parts and any(p.startswith('style-integrity-') for p in r.parts)
 review=json.loads(args.review.read_text());assert review['sourceSha256']==N and sha(r/'raw/source/original.pdf')==N
 sem=r/'semantic';unchanged={str(p.relative_to(sem)):sha(p) for d in ['quizzes','assets'] for p in (sem/d).rglob('*') if p.is_file()};manifest=sha(sem/'manifest.json');plans={}
 for rec in review['records']:
  n=rec['pdfPage'];p=sem/f'pages/page-{n:03}.json';assert p not in plans and sha(p)==rec['beforePageSha256'];before=json.loads(p.read_text());after=rec['page'];assert after['pdfPage']==n and after['sourceSha256']==N
  assert normalized(before)==normalized(after),('Non-style content/order changed',n);validate_styles(after);assert sha(r/f'raw/renders/page-{n:03}.png')==rec['sourceRenderSha256'];plans[p]=after
 for p,x in plans.items():p.write_text(json.dumps(x,ensure_ascii=False,separators=(',',':'))+'\n')
 assert manifest==sha(sem/'manifest.json') and unchanged=={f:sha(sem/f) for f in unchanged}
 report=dict(reviewId=review['reviewId'],pages=sorted(x['pdfPage'] for x in plans.values()),onlyStyleMetadataAndSpanBoundariesChanged=True,textOrderAndAllCharacterPropertiesUnchanged=True,manifestQuizzesAssetsUnchanged=True,activated=False)
 (r/'validation/source-style-application.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
if __name__=='__main__':main()
