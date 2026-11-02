#!/usr/bin/env python3
"""Recover source vector headings only when their actual path programs match.

This is a private source comparison, not OCR or an assumption that editions have
identical wording. Unmatched vector lettering is reported for manual review.
"""
import argparse,collections,copy,hashlib,json
from pathlib import Path
import fitz
NEW='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';OLD='35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442'
def norm(s):return ''.join(s.split())
def text(b):return ''.join(s.get('renderText',s['text']) for l in b.get('lines',[]) for s in l['spans'])
def charids(v):
 if isinstance(v,dict):
  for k,x in v.items():
   if k=='sourceCharIds':yield from x
   elif k!='transcriptionAudit':yield from charids(x)
 elif isinstance(v,list):
  for x in v:yield from charids(x)
def close(a,b):
 if isinstance(a,(int,float)) and isinstance(b,(int,float)):return abs(a-b)<.04
 if type(a)!=type(b):return False
 if isinstance(a,list):return len(a)==len(b) and all(close(x,y) for x,y in zip(a,b))
 if isinstance(a,dict):return a.keys()==b.keys() and all(close(a[k],b[k]) for k in a)
 return a==b
def fingerprint(drawings,bb):
 rect=fitz.Rect(bb);out=[]
 def cv(x):
  if isinstance(x,fitz.Point):return [x.x-bb[0],x.y-bb[1]]
  if isinstance(x,fitz.Rect):return [x.x0-bb[0],x.y0-bb[1],x.x1-bb[0],x.y1-bb[1]]
  if isinstance(x,fitz.Quad):return [cv(p) for p in x]
  if isinstance(x,(tuple,list)):return [cv(v) for v in x]
  return x
 for d in drawings:
  b=d['rect']
  if not rect.contains(b) or not d.get('fill') or b.width<.1 or b.height<.1:continue
  out.append(dict(rect=[b.x0-bb[0],b.y0-bb[1],b.x1-bb[0],b.y1-bb[1]],fill=list(d['fill']),type=d['type'],items=cv(d['items'])))
 return sorted(out,key=lambda d:tuple(round(v,1) for v in d['rect']))
def mapped_page(old):return old if old<=39 else old+1 if old<=50 else old+2 if old<=74 else old+3
def glyphs(page):return [c for b in page.get_text('rawdict')['blocks'] if b['type']==0 for l in b['lines'] for s in l['spans'] for c in s['chars']]
def imgs(page):return [b for b in page.get_text('dict')['blocks'] if b['type']==1]
def write(p,d):p.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n')
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--legacy-source',type=Path,required=True);p.add_argument('--baseline',type=Path,required=True);p.add_argument('--revision',type=Path,required=True);a=p.parse_args();r=a.revision
 assert r.name==NEW and 'private-data' in r.resolve().parts;assert hashlib.sha256(a.legacy_source.read_bytes()).hexdigest()==OLD
 old=fitz.open(a.legacy_source);new=fitz.open(r/'raw/source/original.pdf');draw_old={};draw_new={};all_new_imgs=collections.defaultdict(list);native_new={}
 for n in range(1,148):
  raw=json.loads((r/f'raw/pages/page-{n:03}.json').read_text())
  for f in raw['imagePlacements']:
   h=hashlib.sha256((r/'raw'/f['assetPath']).read_bytes()).hexdigest();all_new_imgs[h].append((n,f['bbox']))
 matches=collections.defaultdict(list);unmatched=[]
 for path in sorted((a.baseline/'pages').glob('*.json')):
  source=json.loads(path.read_text());op=source['pdfPage']
  if op<8 or op>136:continue
  for block in source['blocks']:
   if '-visual-heading-' not in block['id'] or not block.get('bbox'):continue
   kind=block['id'].rsplit('-',1)[-1];bb=list(block['bbox'])
   if op not in draw_old:draw_old[op]=old[op-1].get_drawings()
   nearby=[d['rect'] for d in draw_old[op] if d.get('fill') and d['rect'].height>2 and d['rect'].width<400 and d['rect'].y0>=bb[1]-3 and d['rect'].y1<=bb[3]+4 and d['rect'].x0>=bb[0]-4 and d['rect'].x0<=bb[2]+4]
   if nearby:bb=[min([bb[0]]+[x.x0 for x in nearby]),min([bb[1]]+[x.y0 for x in nearby]),max([bb[2]]+[x.x1 for x in nearby]),max([bb[3]]+[x.y1 for x in nearby])]
   fp=fingerprint(draw_old[op],bb)
   commands=sum(len(d['items']) for d in fp)
   if commands<20:continue
   candidates=[]
   if kind=='section':
    gs=[c for c in glyphs(old[op-1]) if 0xf02b1<=ord(c['c'])<=0xf02b9 and c['bbox'][0]<110 and abs(c['bbox'][1]-bb[1])<10]
    if len(gs)==1:
     np=mapped_page(op);native_new.setdefault(np,glyphs(new[np-1]));oldg=gs[0]
     for g in native_new[np]:
      if g['c']==oldg['c'] and g['bbox'][0]<110:
       dx=g['origin'][0]-oldg['origin'][0];dy=g['origin'][1]-oldg['origin'][1];candidates.append((np,[bb[0]+dx,bb[1]+dy,bb[2]+dx,bb[3]+dy]))
   elif kind=='callout':
    choices=[im for im in imgs(old[op-1]) if abs(im['bbox'][1]+17-bb[1])<25 and im['bbox'][2]-im['bbox'][0]<55 and im['bbox'][3]-im['bbox'][1]<45]
    if choices:
     ref=min(choices,key=lambda im:abs(im['bbox'][1]+17-bb[1]));h=hashlib.sha256(ref['image']).hexdigest()
     for np,nb in all_new_imgs[h]:
      dy=nb[1]-ref['bbox'][1]
      for dx in {0,nb[0]-ref['bbox'][0]}:candidates.append((np,[bb[0]+dx,bb[1]+dy,bb[2]+dx,bb[3]+dy]))
    # Locate the matching title ink itself, independent of a publisher icon's y offset.
    reference=max(fp,key=lambda d:(d['rect'][2]-d['rect'][0])*(d['rect'][3]-d['rect'][1]))
    rw=reference['rect'][2]-reference['rect'][0];rh=reference['rect'][3]-reference['rect'][1]
    for np in range(8,140):
     if np not in draw_new:draw_new[np]=new[np-1].get_drawings()
     for d in draw_new[np]:
      q=d['rect']
      if not d.get('fill') or abs(q.width-rw)>.04 or abs(q.height-rh)>.04 or abs(q.x0-(bb[0]+reference['rect'][0]))>20:continue
      x=q.x0-reference['rect'][0];y=q.y0-reference['rect'][1];candidates.append((np,[x,y,x+bb[2]-bb[0],y+bb[3]-bb[1]]))
   else:continue
   found=0
   for np,target in candidates:
    if target[1]<0 or target[3]>842:continue
    if np not in draw_new:draw_new[np]=new[np-1].get_drawings()
    actual=fingerprint(draw_new[np],target)
    if not close(fp,actual):continue
    found+=1
    ink=[min(d['rect'][0] for d in actual)+target[0],min(d['rect'][1] for d in actual)+target[1],max(d['rect'][2] for d in actual)+target[0],max(d['rect'][3] for d in actual)+target[1]]
    prior=next((x for x in matches[np] if close(x['transcriptionAudit']['sourceInkBBox'],ink) and norm(text(x))==norm(text(block))),None)
    if prior:
     previous_page=prior['transcriptionAudit']['referencePdfPage']
     if mapped_page(op)!=np or mapped_page(previous_page)==np:continue
     matches[np].remove(prior)
    clone=copy.deepcopy(block);clone['id']=f'81-p{np:03}-vector-{kind}-{round(target[1],1)}';clone['bbox']=target;clone['reviewStatus']='verified';clone['transcriptionAudit']=dict(method='verified-vector-path-program-match',sourceVerified=True,sourcePdfPage=np,sourceSha256=NEW,sourceBBox=target,sourceInkBBox=ink,referenceSourceSha256=OLD,referencePdfPage=op,referenceBlockId=block['id'],pathCommandCount=commands,coordinateTolerancePdfPoints=.04,sourceVectorProgramSha256=hashlib.sha256(json.dumps(actual,sort_keys=True).encode()).hexdigest(),verificationScope='All filled vector programs wholly inside the reviewed heading bounds match reference operations/colors/coordinates after translation; not a whole-page fidelity claim.')
    dx=target[0]-bb[0];dy=target[1]-bb[1]
    for line in clone.get('lines',[]):
     if line.get('bbox'):line['bbox']=[line['bbox'][0]+dx,line['bbox'][1]+dy,line['bbox'][2]+dx,line['bbox'][3]+dy]
     for span in line.get('spans',[]):
      if span.get('bbox'):span['bbox']=[span['bbox'][0]+dx,span['bbox'][1]+dy,span['bbox'][2]+dx,span['bbox'][3]+dy]
      if span.get('transcriptionAudit'):span['referenceTranscriptionAudit']=span.pop('transcriptionAudit')
      span['transcriptionAudit']=copy.deepcopy(clone['transcriptionAudit'])
    matches[np].append(clone)
   if not found:unmatched.append(dict(oldPage=op,blockId=block['id'],kind=kind,candidateCount=len(candidates)))
 applied=[]
 for n,headers in matches.items():
  path=r/f'semantic/pages/page-{n:03}.json';page=json.loads(path.read_text());before=collections.Counter(charids(page['blocks']))
  for header in sorted(headers,key=lambda h:h['bbox'][1]):
   if any(norm(text(header)) in norm(text(b)) and abs((b.get('bbox') or [0,-100,0,0])[1]-header['bbox'][1])<12 for b in page['blocks'] if b['type'] in ['heading','text']):continue
   if '-vector-section-' in header['id']:
    markers=[b for b in page['blocks'] if b['type'] in ['text','heading'] and b.get('bbox') and abs(b['bbox'][1]-header['bbox'][1])<8 and len(norm(text(b)))==1 and 0xf02b1<=ord(norm(text(b)))<=0xf02b9]
    if len(markers)==1:
     marker=markers[0];spans=[s for l in marker['lines'] for s in l['spans']]
     for span in spans:
      if any(0xf02b1<=ord(c)<=0xf02b9 for c in span['text']):span.update(renderText=''.join(str(ord(c)-0xf02b0) if 0xf02b1<=ord(c)<=0xf02b9 else c for c in span['text']),mappingAudit=dict(verified=True,sourceGlyphDescription='outlined-square section numeral'))
     header['lines'][0]['spans']=spans+[dict(text=' ',bold=False,sourceRasterText=True)]+header['lines'][0]['spans'];page['blocks'].remove(marker)
   page['blocks']=[b for b in page['blocks'] if b['id']!=header['id']]+[header]
  page['blocks'].sort(key=lambda b:((b.get('bbox') or [0,0,0,0])[1],(b.get('bbox') or [0,0,0,0])[0]));assert collections.Counter(charids(page['blocks']))==before;write(path,page);applied.extend(dict(pdfPage=n,id=h['id'],kind=h['id'].split('-vector-')[1].split('-')[0],bbox=h['bbox'],pathCommandCount=h['transcriptionAudit']['pathCommandCount']) for h in headers)
 report=dict(sourceSha256=NEW,referenceSourceSha256=OLD,verifiedHeadings=applied,unmatchedReferenceHeadings=unmatched,nativeCharIdsUnchanged=True,active=False)
 write(r/'validation/vector-heading-verification.json',report);print('Vector headings verified',len(applied),'across',len(matches),'pages; unmatched reference records',len(unmatched))
if __name__=='__main__':main()
