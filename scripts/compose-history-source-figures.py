#!/usr/bin/env python3
"""Compose exact contiguous source fragments through the existing gallery schema."""
import argparse,collections,json,re
from pathlib import Path
SHA='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de'
def refs(v):
 if isinstance(v,dict):
  for k,x in v.items():
   if k=='sourceCharIds':yield from x
   elif k!='transcriptionAudit':yield from refs(x)
 elif isinstance(v,list):
  for x in v:yield from refs(x)
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('revision',type=Path);a=p.parse_args();r=a.revision;assert r.name==SHA and 'private-data' in r.resolve().parts;report=[]
 for path in sorted((r/'semantic/pages').glob('*.json')):
  d=json.loads(path.read_text());before=collections.Counter(refs(d['blocks']));figs={b['assetId']:b for b in d['blocks'] if b['type']=='figure'};done=[]
  for i,g in enumerate(d.get('figureGroups',[]),1):
   if not all(id in figs for id in g['assetIds']):continue
   members=[figs[id] for id in g['assetIds']]
   if all(re.match(r'^(decorative-|fragmented-cover-raster|full-page-raster)',f.get('classification','')) for f in members):continue
   assert len({f['studySection'] for f in members})==1 and g['reviewStatus']=='verified';kind=members[0]['studySection'];id=f"81-p{d['pdfPage']:03}-composite-gallery-{i}";box=g['sourceBBox']
   for f in members:f['sourceRowIndices']=[0]
   table=dict(id=id,type='table',columnCount=1,rows=[dict(cells=[dict(id=id+'-cell',rowIndex=0,columnIndex=0,rowSpan=1,colSpan=1,header=False,bbox=box,lines=[],sourceIllustrationCell=True)])],figures=members,figureGroups=[g],bbox=box,layoutRole='source-illustration-gallery',reviewStatus='verified',studySection=kind,sourceCompositionAudit=dict(method='exact-original-placement',sourceSha256=SHA,sourceAssetIds=g['assetIds'],scope='Original contiguous source strips retained as one source canvas; no pixel editing or inferred caption.'))
   d['blocks']=[b for b in d['blocks'] if b not in members]+[table];done.append(dict(galleryId=id,sourceAssetIds=g['assetIds'],bbox=box))
  d['blocks'].sort(key=lambda b:((b.get('bbox') or [0,0,0,0])[1],(b.get('bbox') or [0,0,0,0])[0]));assert collections.Counter(refs(d['blocks']))==before
  for key,section in [('conceptBlockIds','concept'),('examBlockIds','exam'),('sourceQuizBlockIds','source-quiz')]:d['studySectionPartition'][key]=[b['id'] for b in d['blocks'] if b['studySection']==section]
  path.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n')
  if done:report.append(dict(pdfPage=d['pdfPage'],galleries=done,nativeTextAndOriginalAssetsUnchanged=True))
 manifestpath=r/'semantic/manifest.json';manifest=json.loads(manifestpath.read_text())
 for entry in manifest['pages']:
  page=json.loads((r/f"semantic/pages/page-{entry['pdfPage']:03}.json").read_text());entry['studySectionCounts']={kind:sum(b['studySection']==kind for b in page['blocks']) for kind in ['concept','exam']}
 manifestpath.write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n')
 (r/'validation/source-figure-composition.json').write_text(json.dumps(dict(sourceSha256=SHA,pages=report,activated=False),ensure_ascii=False,indent=2)+'\n');print('Composed source fragment galleries',sum(len(x['galleries']) for x in report),'across',len(report),'pages')
if __name__=='__main__':main()
