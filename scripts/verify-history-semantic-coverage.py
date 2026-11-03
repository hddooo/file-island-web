#!/usr/bin/env python3
"""Verify private semantic native glyph coverage, source figure bytes and bounds."""
import argparse,hashlib,json,collections,re,unicodedata
from pathlib import Path
SHA='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de'
HELD={'p009-figure-4','p009-figure-5','p009-figure-6'}
def walk(v):
 if isinstance(v,dict):
  yield v
  for x in v.values():yield from walk(x)
 elif isinstance(v,list):
  for x in v:yield from walk(x)
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('revision',type=Path);p.add_argument('--era',help='Verify only this exact source era; never label a partial result as complete');a=p.parse_args();r=a.revision;assert r.name==SHA
 semantic=r/'semantic';m=json.loads((semantic/'manifest.json').read_text());assert m['source']['sha256']==SHA and m['source']['totalPdfPages']==147
 assert {p['pdfPage'] for p in m['pages']}==set(range(1,148));available={f['id']:f for f in m['figures']};page_results=[];missing=[];native_total=0
 range0=next((e for e in m.get('eraRanges',[]) if e['id']==a.era),None) if a.era else None
 assert not a.era or range0,'Unknown era; refusing an unfiltered verification'
 selected_pages=list(range(range0['fromPage'],range0['toPage']+1)) if range0 else list(range(1,148))
 assert m['quizCount']==8 and len(m['quizzes'])==8 and sum(q['itemCount'] for q in m['quizzes'])==697
 for q in m['quizzes']:
  data=json.loads((semantic/'quizzes'/f"{q['id']}.json").read_text());assert q['itemCount']==len(data['items']) and q['pdfPages']==data['source']['pdfPages']
 for n in selected_pages:
  raw=json.loads((r/f'raw/pages/page-{n:03}.json').read_text());lookup={}
  for b in raw['textBlocks']:
   for li,l in enumerate(b['lines']):
    for si,s in enumerate(l['spans']):
     for ci,c in enumerate(s['chars']):lookup[f"{b['id']}-l{li:04}-s{si:04}-c{ci:04}"]=c['c']
  path=semantic/f'pages/page-{n:03}.json';d=json.loads(path.read_text());assert d['sourceSha256']==SHA;assert path.stat().st_size<=2*1024*1024
  collected=[];unmapped=[]
  for v in walk(d['blocks']):
   if v.get('sourceCharIds') and isinstance(v.get('text'),str):
    ids=v['sourceCharIds'];assert ''.join(lookup[id] for id in ids)==v['text'],(n,'literal source glyph mismatch');collected+=ids
    if any(unicodedata.category(c)=='Co' for c in v['text']):
     assert v.get('mappingAudit',{}).get('verified') and 'renderText' in v,(n,'unmapped source PUA')
   if v.get('type')=='figure':
    id=v['assetId'];classification=v.get('classification','')
    if not re.match(r'^(decorative-|fragmented-cover-raster|full-page-raster)',classification) and id not in available:missing.append(id)
  assert collections.Counter(collected)==collections.Counter(lookup.keys()),(n,'native glyph ID deficit/duplicate')
  assert d['studySectionPartition']['schemaVersion']=='hanq-study-sections/1'
  for key,kind in [('conceptBlockIds','concept'),('examBlockIds','exam'),('sourceQuizBlockIds','source-quiz')]:assert d['studySectionPartition'][key]==[b['id'] for b in d['blocks'] if b['studySection']==kind],(n,'stale section block IDs')
  entry=next(p for p in m['pages'] if p['pdfPage']==n);assert entry['studySectionCounts']=={kind:sum(b['studySection']==kind for b in d['blocks']) for kind in ['concept','exam']},(n,'stale manifest section counts')
  native_total+=len(lookup);page_results.append(dict(pdfPage=n,nativeCharacters=len(lookup),nativeTextAndIdsExact=True,pageJsonBytes=path.stat().st_size))
 expected_held={id for id in HELD if int(id[1:4]) in selected_pages}
 assert set(missing)==expected_held,('unexpected unavailable figures',sorted(set(missing)))
 assert HELD.isdisjoint(available),'Approval-held source assets must remain unavailable'
 for id,f in available.items():
  file=semantic/'assets'/f"{id}.{f['extension']}";b=file.read_bytes();assert len(b)==f['bytes'] and len(b)<=2*1024*1024 and hashlib.sha256(b).hexdigest()==f['sha256']
  assert b.startswith(b'\x89PNG\r\n\x1a\n') if f['extension']=='png' else b.startswith(b'\xff\xd8') and b.endswith(b'\xff\xd9')
  n=int(id[1:4]);i=int(id.rsplit('-',1)[1]);placement=json.loads((r/f'raw/pages/page-{n:03}.json').read_text())['imagePlacements'][i-1]
  if placement.get('maskPath'):
   assert f.get('sourceAlphaPreserved') and f['extension']=='png',(id,'missing source alpha')
   assert hashlib.sha256((r/'raw'/placement['assetPath']).read_bytes()).hexdigest()==f['sourceImageSha256']
   assert hashlib.sha256((r/'raw'/placement['maskPath']).read_bytes()).hexdigest()==f['sourceMaskSha256']
 assert native_total>0
 if not a.era:assert native_total==119809
 report=dict(sourceSha256=SHA,eraFilter=a.era,pdfPages=len(selected_pages),all147NativePagesVerified=not bool(a.era),nativeCharacters=native_total,nativeGlyphTextAndIdsExact=True,availableFigureAssetsVerified=len(available),unavailableSourceFigureAssets=sorted(set(missing)),heldPolicyPreserved=True,coverage=m['coverageSummary'],originalSourcesDeleted=False,activated=False,scope='Selected source-page native glyph identity/coverage, bounded semantic files and exact original available-asset bytes. A filtered result does not verify other eras. Source-only artwork, visual reflow and live API/deployment checks are separate.',pages=page_results)
 report_name=f'semantic-source-coverage-{a.era}.json' if a.era else 'semantic-source-coverage.json'
 (r/'validation'/report_name).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='pages'},ensure_ascii=False))
if __name__=='__main__':main()
