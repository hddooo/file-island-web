#!/usr/bin/env python3
"""Build a private, source-preserving semantic candidate; never activate it.

All native characters keep source IDs. Automatic tables/reading order remain
unverified. Identical source rasters may reuse reviewed diagram transcriptions;
no old native prose, questions or answer keys are copied into the new revision.
"""
import argparse,collections,copy,hashlib,json,re
from pathlib import Path
import fitz
SOURCE='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de'
OLD='35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442'
ERAS=[('prehistory',8,15),('ancient',16,30),('nambuk',31,40),('goryeo',41,58),('joseon',59,87),('opening',88,107),('colonial',108,125),('modern',126,139),('people',140,141),('regions',142,144),('credits',145,147),('front',1,7)]

def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,x):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,separators=(',',':'))+'\n')
def inside(c,b):return b[0]<=sum(c['bbox'][::2])/2<b[2] and b[1]<=sum(c['bbox'][1::2])/2<b[3]
def box(cs):return [min(c['bbox'][0] for c in cs),min(c['bbox'][1] for c in cs),max(c['bbox'][2] for c in cs),max(c['bbox'][3] for c in cs)]
def native_chars(data):
 out=[]
 for b in data['textBlocks']:
  for li,l in enumerate(b['lines']):
   for si,s in enumerate(l['spans']):
    for ci,c in enumerate(s['chars']):out.append(dict(text=c['c'],bbox=c['bbox'],baseline=c['origin'][1],bold=bool(s['flags']&16),fontSize=s['size'],id=f"{b['id']}-l{li:04}-s{si:04}-c{ci:04}"))
 return out

def lines(cs):
 by=collections.defaultdict(list)
 for c in cs:by[round(c['baseline'],1)].append(c)
 result=[]
 for y,chars in sorted(by.items()):
  spans=[]
  for c in sorted(chars,key=lambda c:c['bbox'][0]):
   s=dict(text=c['text'],bold=c['bold'],fontSize=c['fontSize'],sourceCharIds=[c['id']])
   if spans and spans[-1]['bold']==s['bold'] and spans[-1]['fontSize']==s['fontSize']:
    spans[-1]['text']+=s['text'];spans[-1]['sourceCharIds']+=s['sourceCharIds']
   else:spans.append(s)
  result.append(dict(baseline=y,spans=spans))
 return result

def boundaries(values):
 out=[]
 for v in sorted(values):
  if not out or abs(v-out[-1])>.5:out.append(v)
 return out

def table_candidate(t,n,index,chars,used):
 xs=boundaries([v for row in t.rows for b in row.cells if b for v in [b[0],b[2]]]);ys=boundaries([v for row in t.rows for b in row.cells if b for v in [b[1],b[3]]])
 if len(xs)<2 or len(ys)<2:raise ValueError('Empty table geometry')
 cols=len(xs)-1;rows=[dict(cells=[]) for _ in range(len(ys)-1)];occupied=set();known=set();local=set()
 for row in t.rows:
  for bb in row.cells:
   if bb is None:continue
   key=tuple(round(v,2) for v in bb)
   if key in known:continue
   known.add(key)
   x0=min(range(len(xs)),key=lambda i:abs(xs[i]-bb[0]));x1=min(range(len(xs)),key=lambda i:abs(xs[i]-bb[2]));y0=min(range(len(ys)),key=lambda i:abs(ys[i]-bb[1]));y1=min(range(len(ys)),key=lambda i:abs(ys[i]-bb[3]))
   if x1<=x0 or y1<=y0:raise ValueError('Invalid merged cell')
   cells={(y,x) for y in range(y0,y1) for x in range(x0,x1)}
   if cells&occupied:raise ValueError('Overlapping table geometry')
   occupied|=cells;cs=[c for c in chars if c['id'] not in used and c['id'] not in local and inside(c,bb)];local.update(c['id'] for c in cs)
   rows[y0]['cells'].append(dict(id=f'81-p{n:03}-table{index}-r{y0}-c{x0}',rowIndex=y0,columnIndex=x0,rowSpan=y1-y0,colSpan=x1-x0,bbox=list(bb),header=False,lines=lines(cs)))
 if occupied!={(y,x) for y in range(len(rows)) for x in range(cols)}:raise ValueError('Incomplete table occupancy')
 for row in rows:row['cells'].sort(key=lambda c:c['columnIndex'])
 used.update(local)
 return dict(id=f'81-p{n:03}-table{index}',type='table',bbox=list(t.bbox),columnCount=cols,rows=rows,reviewStatus='unverified',studySection='concept',layoutRole='native-table',sourceExtraction=dict(tableGeometry='automatic-unverified',nativeCharactersRetained=len(local)))

def diagrams(baseline):
 candidates=[]
 for p in sorted((baseline/'pages').glob('*.json')):
  d=json.loads(p.read_text())
  for b in d['blocks']:
   a=b.get('transcriptionAudit',{});hs=a.get('sourceImageSha256',[])
   if isinstance(hs,str):hs=[hs]
   if hs:candidates.append((b,hs))
 return candidates

def build(raw,baseline,out):
 m=json.loads((raw/'manifest.json').read_text())
 if m['source']['sha256']!=SOURCE or m['source']['pageCount']!=147:raise ValueError('Unexpected new source')
 if digest(raw/'source/original.pdf')!=SOURCE:raise ValueError('Source byte integrity failed')
 bm=json.loads((baseline/'manifest.json').read_text())
 if bm['source']['sha256']!=OLD:raise ValueError('Unexpected baseline')
 doc=fitz.open(raw/'source/original.pdf');reuse=diagrams(baseline);held=set();known_class={};old_figure_meta={}
 for p in (baseline/'pages').glob('*.json'):
  d=json.loads(p.read_text())
  for f in d.get('imageInventory',[]):
   old_figure_meta[f['assetId']]=f
   if re.match(r'^(decorative-|fragmented-cover-raster|full-page-raster)',f.get('classification','')):known_class[f['sha256']]=f['classification']
   if f['assetId'] in ['p009-figure-4','p009-figure-5','p009-figure-6']:held.add(f['sha256'])
 manifest=dict(schemaVersion='hanq-semantic-manifest/1',source=dict(sha256=SOURCE,totalPdfPages=147,edition='81회 대비',revision=SOURCE),bundleStatus='candidate-not-active',pageCount=147,pages=[],quizzes=[],quizCount=0,figures=[],fourChoices=[],eraRanges=[dict(id=id,fromPage=start,toPage=end) for id,start,end in ERAS],coverageNote='All147 source pages retained privately. Native extraction/automatic tables are candidates; reviewed quizzes and explicit verification reports have independent status. Original source is authoritative.')
 audit=[]
 for n,page in enumerate(doc,1):
  data=json.loads((raw/f'pages/page-{n:03}.json').read_text());cs=native_chars(data);used=set();blocks=[];failures=[]
  for i,t in enumerate(sorted(page.find_tables().tables,key=lambda t:(t.bbox[1],t.bbox[0])),1):
   try:blocks.append(table_candidate(t,n,i,cs,used))
   except ValueError as e:failures.append(str(e))
  outside=[c for c in cs if c['id'] not in used];by=collections.defaultdict(list)
  for c in outside:by[round(c['baseline'],1)].append(c)
  for y,group in sorted(by.items()):
   blocks.append(dict(id=f'81-p{n:03}-native-{y}',type='text',bbox=box(group),lines=lines(group),reviewStatus='unverified',studySection='concept'))
  image_meta=[];page_images=[]
  for i,f in enumerate(data['imagePlacements'],1):
   original=raw/f['assetPath'];sha=digest(original);ext=original.suffix[1:];asset=f'p{n:03}-figure-{i}';target=out/'assets'/f'{asset}.{ext}';target.parent.mkdir(exist_ok=True,parents=True);target.write_bytes(original.read_bytes())
   meta=dict(assetId=asset,bbox=f['bbox'],sha256=sha,bytes=original.stat().st_size,extension=ext,sourceBlockId=f['id'],pageAreaRatio=(f['bbox'][2]-f['bbox'][0])*(f['bbox'][3]-f['bbox'][1])/(page.rect.width*page.rect.height),classification=known_class.get(sha,'unreviewed-source-image'),availability='held-existing-review' if sha in held else 'candidate')
   image_meta.append(meta);page_images.append(dict(id='81-'+asset,type='figure',assetId=asset,bbox=f['bbox'],alt='원문 그림',reviewStatus='unverified',studySection='concept',classification=meta['classification']))
  byhash=collections.defaultdict(list)
  for f in image_meta:byhash[f['sha256']].append(f)
  retired=set();reused=[];embedded_consumed=set()
  for old,hs in reuse:
   if not all(len(byhash[h])==1 for h in hs):continue
   native=copy.deepcopy(old);native['id']='81-'+old['id'];native['reviewStatus']='unverified';native['studySection']='concept'
   for k in ['sourceParentTableId','sourceTargetCellId','sourcePlacement','sourceContentCellId']:native.pop(k,None)
   bounds=[byhash[h][0]['bbox'] for h in hs];bb=[min(x[0] for x in bounds),min(x[1] for x in bounds),max(x[2] for x in bounds),max(x[3] for x in bounds)];native['bbox']=bb
   replacements={}
   for f in native.get('figures',[]):
    old_meta=old_figure_meta[f['assetId']];actual=byhash[old_meta['sha256']]
    if len(actual)!=1:raise ValueError('Ambiguous embedded source figure revision')
    target=actual[0];replacements[f['assetId']]=target['assetId'];f.update(id='81-'+target['assetId']+'-captioned',assetId=target['assetId'],bbox=target['bbox'],alt='원문 사진');embedded_consumed.add(target['assetId'])
   def replace_refs(value):
    if isinstance(value,str):return replacements.get(value,value)
    if isinstance(value,list):return [replace_refs(x) for x in value]
    if isinstance(value,dict):return {k:replace_refs(x) for k,x in value.items()}
    return value
   native=replace_refs(native)

   native['transcriptionAudit'].update(sourcePdfPage=n,sourceSha256=SOURCE,sourceAssetIds=[byhash[h][0]['assetId'] for h in hs],sourceBBox=bb,sourceVerified=False,verificationScope='Exact original image bytes match prior reviewed transcription; new placement and captions require source review')
   blocks.append(native);retired.update(byhash[h][0]['assetId'] for h in hs);reused.append(native['id'])
  for f in page_images:
   if f['assetId'] not in retired and f['assetId'] not in embedded_consumed:blocks.append(f)
  # Reattach source-only pictures to their original native cells. No caption text is inferred.
  group_records=[];fig_by_id={f['assetId']:f for f in page_images if f['assetId'] not in retired and f['assetId'] not in embedded_consumed}
  candidates=sorted(fig_by_id.values(),key=lambda f:(f['bbox'][0],f['bbox'][1]));seen=set()
  for f in candidates:
   if f['assetId'] in seen:continue
   members=[f];last=f
   while True:
    matches=[g for g in candidates if g['assetId'] not in seen and g not in members and abs(g['bbox'][0]-last['bbox'][0])<.01 and abs(g['bbox'][2]-last['bbox'][2])<.01 and abs(g['bbox'][1]-last['bbox'][3])<.01]
    if len(matches)!=1:break
    g=matches[0];join=[last['bbox'][0],last['bbox'][3]-.1,last['bbox'][2],g['bbox'][1]+.1]
    if any(inside(c,join) and not c['text'].isspace() for c in cs):break
    members.append(g);last=g
   seen.update(g['assetId'] for g in members)
   if len(members)>1:group_records.append(dict(assetIds=[g['assetId'] for g in members],relationship='vertical-contiguous-fragments-of-one-source-illustration',sourceBBox=[f['bbox'][0],f['bbox'][1],f['bbox'][2],last['bbox'][3]],reviewStatus='verified',verificationScope='Exact original x extents and contiguous y placement, without intervening native text; source composited geometry retained, no inferred caption.'))
  tables=[b for b in blocks if b['type']=='table' and b['id'].startswith(f'81-p{n:03}-table')]
  for f in list(blocks):
   if f['type']!='figure' and f['id'] not in reused:continue
   bb=f['bbox'];targets=[]
   for t in tables:
    for row in t['rows']:
     for c in row['cells']:
      cb=c['bbox']
      if cb[0]-.1<=bb[0] and cb[1]-.1<=bb[1] and cb[2]+.1>=bb[2] and cb[3]+.1>=bb[3]:targets.append((t,c))
   if len(targets)!=1:continue
   t,c=targets[0]
   if f['type']=='figure':
    f['sourceRowIndices']=list(range(c['rowIndex'],c['rowIndex']+c['rowSpan']));t.setdefault('figures',[]).append(f);blocks.remove(f)
   else:f.update(sourceParentTableId=t['id'],sourceTargetCellId=c['id'],sourcePlacement='after')
  for t in tables:
   figids={f['assetId'] for f in t.get('figures',[])}
   grouped=[g for g in group_records if set(g['assetIds'])<=figids]
   if grouped:t['figureGroups']=grouped
  page_groups=[g for g in group_records if all(any(b.get('assetId')==id for b in blocks) for id in g['assetIds'])]
  blocks.sort(key=lambda b:((b.get('bbox') or b.get('transcriptionAudit',{}).get('sourceBBox') or [0,0,0,0])[1],(b.get('bbox') or [0,0,0,0])[0]))
  kept=[id for b in blocks if b['type'] in ['text','heading','table'] for id in collect_char_ids(b)]
  if collections.Counter(kept)!=collections.Counter(c['id'] for c in cs):raise ValueError(f'Native character coverage failed on {n}')
  result=dict(schemaVersion='hanq-semantic/1',pdfPage=n,printedPage=n-7 if n>=8 else None,width=page.rect.width,height=page.rect.height,sourceSha256=SOURCE,reviewStatus='unverified',blocks=blocks,sourceBlanks=[],generatedPractice=[],imageInventory=image_meta,figureGroups=page_groups,studySectionPartition=dict(schemaVersion='hanq-study-sections/1',sourceBoundaryReviewed=False,conceptBlockIds=[b['id'] for b in blocks],examBlockIds=[]),limitations=['Automatic native/table order is not fully source-reviewed.','Image and vector lettering require source transcription/review; original source retained.','Study-section concept/exam boundary classification pending.'])
  write(out/f'pages/page-{n:03}.json',result)
  manifest['pages'].append(dict(pdfPage=n,printedPage=result['printedPage'],figuresAvailable=True,reviewStatus='unverified',studySectionCounts=dict(concept=len(blocks),exam=0)))
  for f in image_meta:
   if f['availability']!='held-existing-review' and not re.match(r'^(decorative-|fragmented-cover-raster|full-page-raster)',f['classification']) and f['assetId'] not in retired and f['extension'] in ['png','jpeg'] and f['bytes']<=2*1024*1024:manifest['figures'].append(dict(id=f['assetId'],pdfPage=n,extension=f['extension'],sha256=f['sha256'],bytes=f['bytes']))
  audit.append(dict(pdfPage=n,nativeCharacters=len(cs),nativeCharacterCoverageExact=True,tableCount=sum(b['type']=='table' for b in blocks),tableDetectionFailures=failures,sourceImagePlacements=len(image_meta),reusedDiagramBlocks=reused,heldAssets=[f['assetId'] for f in image_meta if f['availability']=='held-existing-review'],reviewStatus='unverified'))
  if n%20==0:print('Built semantic candidate',n,'/147',flush=True)
 for p in sorted((out/'quizzes').glob('*.json')):
  q=json.loads(p.read_text());manifest['quizzes'].append(dict(id=q['id'],eraId=q['id'],title=q['title'],itemCount=len(q['items']),pdfPages=q['source']['pdfPages'],reviewStatus='source-verified'))
 manifest['quizCount']=len(manifest['quizzes']);write(out/'manifest.json',manifest);write(out.parent/'validation/semantic-generation-audit.json',dict(sourceSha256=SOURCE,pages=audit,publicationAllowed=False,active=False));print('Built147 candidate pages; complete native character coverage; not active',flush=True)

def collect_char_ids(v):
 if isinstance(v,dict):
  for k,x in v.items():
   if k=='sourceCharIds':yield from x
   elif k!='transcriptionAudit':yield from collect_char_ids(x)
 elif isinstance(v,list):
  for x in v:yield from collect_char_ids(x)

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--raw-root',type=Path,required=True);p.add_argument('--baseline',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
 if 'private-data' not in a.output.resolve().parts:raise ValueError('Private output directory required')
 build(a.raw_root,a.baseline,a.output)
if __name__=='__main__':main()
