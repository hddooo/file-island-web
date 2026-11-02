#!/usr/bin/env python3
"""Partition private source data at actual heading/quiz anchors; preserve all bytes.

Main reading tabs receive concept/exam sections. Original exercise/answer pages
remain in the revision and are classified source-quiz, without duplicating them
into the main concept tab or creating any user progress.
"""
import argparse,collections,hashlib,json,re
from pathlib import Path
SHA='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de'
MIXED={37,63,70,101,124}
HEADERS={'구분','내용','특징','시대','시기','인물','사진','출처','페이지','실학자','저서','등급','관등명','공복','골품'}
def norm(s):return ''.join(s.split())
def charids(v):
 if isinstance(v,dict):
  for k,x in v.items():
   if k=='sourceCharIds':yield from x
   elif k!='transcriptionAudit':yield from charids(x)
 elif isinstance(v,list):
  for x in v:yield from charids(x)
def allfigs(blocks):
 for b in blocks:
  if b['type']=='figure':yield b
  elif b['type']=='table':yield from b.get('figures',[])
def txt(b):return ''.join(s.get('renderText',s['text']) for l in b.get('lines',[]) for s in l['spans'])
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,separators=(',',':'))+'\n')
def glyphs(raw):
 out=[]
 for b in raw['textBlocks']:
  for li,l in enumerate(b['lines']):
   for si,s in enumerate(l['spans']):
    for ci,c in enumerate(s['chars']):out.append(dict(**c,id=f"{b['id']}-l{li:04}-s{si:04}-c{ci:04}"))
 return out

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--revision',type=Path,required=True);p.add_argument('--baseline',type=Path,required=True);p.add_argument('--question-labels',type=Path,required=True);p.add_argument('--image-reviews',type=Path);a=p.parse_args();r=a.revision
 assert r.name==SHA and 'private-data' in r.resolve().parts
 semantic=r/'semantic';manifest=json.loads((semantic/'manifest.json').read_text());labels=json.loads(a.question_labels.read_text());source_pages=set();quiz_counts={}
 for qpath in (semantic/'quizzes').glob('*.json'):
  q=json.loads(qpath.read_text());source_pages.update(q['source']['pdfPages']);quiz_counts[q['id']]=len(q['items'])
 classifications={}
 for p in (a.baseline/'pages').glob('*.json'):
  d=json.loads(p.read_text());inv={f['assetId']:f for f in d.get('imageInventory',[])}
  for f in allfigs(d['blocks']):
   if f.get('assetId') in inv and re.match(r'^(decorative-|fragmented-cover-raster|full-page-raster)',f.get('classification','')):classifications[inv[f['assetId']]['sha256']]=f['classification']
 if a.image_reviews:
  image_reviews=json.loads(a.image_reviews.read_text());assert image_reviews['sourceSha256']==SHA
  for record in image_reviews['records']:
   assert record['visualReviewStatus']=='verified' and record['classification']=='decorative-callout-character'
   classifications[record['sha256']]=record['classification']
 report=[];crossings=[];retired=set();reading=set();shared=set()
 for n in range(1,148):
  path=semantic/f'pages/page-{n:03}.json';d=json.loads(path.read_text());raw=json.loads((r/f'raw/pages/page-{n:03}.json').read_text());chars=glyphs(raw);byid={c['id']:c for c in chars};before=collections.Counter(charids(d['blocks']));events=[];cut=None
  rows=collections.defaultdict(list)
  for c in chars:rows[round(c['origin'][1])].append(c)
  for y,cs in sorted(rows.items()):
   cs.sort(key=lambda c:c['bbox'][0]);t=''.join(c['c'] for c in cs);nt=norm(t)
   if nt.startswith('<표') or nt.startswith('〈표'):events.append((min(c['bbox'][1] for c in cs),'concept','native-table-caption'))
   if '시험에는이렇게나온다' in nt:events.append((min(c['bbox'][1] for c in cs),'exam','native-callout-heading'))
  for b in d['blocks']:
   if '-vector-callout-' in b['id']:events.append((b['bbox'][1],'exam','verified-vector-heading'))
   elif '-vector-section-' in b['id']:events.append((b['bbox'][1],'concept','verified-vector-heading'))
  if n in MIXED:
   first=min(q['bbox'][1] for qs in labels.values() for q in qs if q['pdfPage']==n)
   if n==101:first=495.0
   preceding=[]
   for y,cs in rows.items():
    t=''.join(c['c'] for c in sorted(cs,key=lambda c:c['bbox'][0])).strip()
    if '[' in t and ']' in t and first-75<y<first:preceding.append(min(c['bbox'][1] for c in cs))
   cut=max(preceding) if preceding else first-20
  events=sorted(e for e in events if e[0]>80 and (cut is None or e[0]<cut))
  default=events[0][1] if events else 'concept'
  def section(y):
   if n in source_pages and n not in MIXED:return 'source-quiz'
   if cut is not None and y>=cut:return 'source-quiz'
   if n<8 or n>=140:return 'concept'
   state=default
   for yy,kind,_ in events:
    if yy>y:break
    state=kind
   return state
  # Apply source-classified decoration status by exact original image bytes.
  inv={f['assetId']:f for f in d.get('imageInventory',[])}
  for f in inv.values():
   if f['sha256'] in classifications:f['classification']=classifications[f['sha256']]
   if n==1:f['classification']='full-page-raster';d['sourceViewRequired']=True
  for f in allfigs(d['blocks']):
   if f['assetId'] in inv:f['classification']=inv[f['assetId']]['classification']
   if re.match(r'^(decorative-|fragmented-cover-raster|full-page-raster)',f.get('classification','')):retired.add(f['assetId'])
  for b in d['blocks']:
   bb=b.get('bbox') or [0,0,0,0];native=[byid[id] for id in charids(b) if id in byid and not byid[id]['c'].isspace()]
   cats={section((c['bbox'][1]+c['bbox'][3])/2) for c in native}
   if b['type']=='table' and len(cats)>1:crossings.append(dict(pdfPage=n,blockId=b['id'],sections=sorted(cats)))
   b['studySection']=next(iter(cats)) if len(cats)==1 else section((bb[1]+bb[3])/2)
   if b['type']=='table' and b.get('rows') and len(b['rows'])>1 and not b.get('headerRowCount'):
    cells=b['rows'][0]['cells'];words=[norm(txt(c)) for c in cells]
    if len(words)>=2 and all(w in HEADERS for w in words) and all(c.get('rowSpan',1)==1 for c in cells):
     b['headerRowCount']=1
     for c in cells:c.update(header=True,scope='col',sourceShading='blue')
   if n in [2,3,4] and b['type'] in ['text','heading']:
    for l in b['lines']:
     for s in l['spans']:
      if re.search(r'[·.ㆍ…]{4,}',s['text']):s.update(renderText=re.sub(r'[·.ㆍ…]{4,}',' ',s['text']),mappingAudit=dict(verified=True,sourceGlyphDescription='Source TOC dotted leader is layout decoration; original glyph text/IDs retained'))
  parents={b['id']:b for b in d['blocks']}
  for b in d['blocks']:
   if b.get('sourceParentTableId') in parents:b['studySection']=parents[b['sourceParentTableId']]['studySection']
   if b['type']=='table':
    for f in b.get('figures',[]):f['studySection']=b['studySection']
  counts={k:sum(b['studySection']==k for b in d['blocks']) for k in ['concept','exam','source-quiz']}
  d['studySectionPartition']=dict(schemaVersion='hanq-study-sections/1',sourceBoundaryReviewed=not any(c['pdfPage']==n for c in crossings),conceptBlockIds=[b['id'] for b in d['blocks'] if b['studySection']=='concept'],examBlockIds=[b['id'] for b in d['blocks'] if b['studySection']=='exam'],sourceQuizBlockIds=[b['id'] for b in d['blocks'] if b['studySection']=='source-quiz'],method='Verified source vector headings, source-native table captions and original quiz-number/header coordinates')
  assert collections.Counter(charids(d['blocks']))==before
  if counts['concept'] or counts['exam']:reading.add(n)
  if n in source_pages and (counts['concept'] or counts['exam']):shared.add(n)
  write(path,d);entry=next(e for e in manifest['pages'] if e['pdfPage']==n);entry['studySectionCounts']={k:counts[k] for k in ['concept','exam']};report.append(dict(pdfPage=n,readingCounts=counts,quizSectionStartY=cut,sourceSectionEvents=events,nativeCharIdsPreserved=True))
 manifest['figures']=[f for f in manifest['figures'] if f['id'] not in retired];manifest['coverageSummary']=dict(allOriginalPdfPages=147,readingSourcePages=len(reading),exerciseSourcePages=len(source_pages),sharedPdfPages=sorted(shared),sourcePageUnion=len(reading|source_pages),quizItems=sum(quiz_counts.values()),quizItemsByEra=quiz_counts,originalsRetainedPrivately=True)
 manifest['coverageNote']='147 original PDF pages retained. Main reading sections and original exercise sections use source heading/number anchors; source originals and content/figure reviews have separate evidence. Source coverage does not imply pixel-identical reflow.';write(semantic/'manifest.json',manifest)
 out=dict(sourceSha256=SHA,pages=report,crossingTables=crossings,coverage=manifest['coverageSummary'],sourceFilesDeleted=False,activated=False);write(r/'validation/study-section-partition.json',out);print(json.dumps(dict(coverage=out['coverage'],crossingTables=crossings),ensure_ascii=False))
 if crossings:raise SystemExit('Source table crosses a reading boundary: manual review required')
if __name__=='__main__':main()
