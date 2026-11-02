#!/usr/bin/env python3
"""Apply private page transcriptions; keep original bytes and native anchors intact."""
import argparse,collections,hashlib,json
from pathlib import Path
SHA='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de'
def charids(v):
 if isinstance(v,dict):
  for k,x in v.items():
   if k=='sourceCharIds':yield from x
   elif k not in ['transcriptionAudit','pageTranscriptionReview']:yield from charids(x)
 elif isinstance(v,list):
  for x in v:yield from charids(x)
def write(p,d):p.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n')
def apply(root,reviews):
 assert root.name==SHA and 'private-data' in root.resolve().parts
 rev=json.loads(reviews.read_text());assert rev['sourceSha256']==SHA
 semantic=root/'semantic';manifest=json.loads((semantic/'manifest.json').read_text());retired=set();result=[]
 for rec in rev['records']:
  n=rec['pdfPage'];p=semantic/f'pages/page-{n:03}.json';prior=json.loads(p.read_text());new=rec['page'];assert new['sourceSha256']==SHA and new['pdfPage']==n
  assert collections.Counter(charids(new['blocks']))==collections.Counter(charids(prior['blocks'])),'Native source character IDs must be retained'
  audit=new['pageTranscriptionReview'];assert audit['status']=='source-verified';raw=json.loads((root/f'raw/pages/page-{n:03}.json').read_text());assert hashlib.sha256((root/'raw'/raw['imagePath']).read_bytes()).hexdigest()==audit['sourceRenderSha256']
  if rec['retireAllSourceImagePlacements']:
   for i in range(len(raw['imagePlacements'])):retired.add(f'p{n:03}-figure-{i+1}')
  write(p,new);result.append(dict(pdfPage=n,sourceRenderHashVerified=True,nativeCharacterIdsPreserved=True,originalAssetsRetainedPrivately=True))
 manifest['figures']=[f for f in manifest['figures'] if f['id'] not in retired]
 for e in manifest['pages']:
  data=json.loads((semantic/f"pages/page-{e['pdfPage']:03}.json").read_text());e['studySectionCounts']={k:sum(b.get('studySection')==k for b in data['blocks']) for k in ['concept','exam']}
 write(semantic/'manifest.json',manifest);write(root/'validation/reviewed-page-application.json',dict(sourceSha256=SHA,records=result,activated=False,sourceFilesDeleted=False));print('Applied',len(result),'reviewed pages; source originals retained')
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('revision',type=Path);p.add_argument('reviews',type=Path);a=p.parse_args();apply(a.revision,a.reviews)
