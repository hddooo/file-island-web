#!/usr/bin/env python3
import argparse,hashlib,json,re,collections
from pathlib import Path
import fitz
parser=argparse.ArgumentParser(description='Extract private, source-bound quiz anchors; does not activate data.')
parser.add_argument('--source',type=Path,required=True)
parser.add_argument('--output',type=Path,required=True)
parser.add_argument('--question-review',type=Path,required=True)
args=parser.parse_args()
assert hashlib.sha256(args.source.read_bytes()).hexdigest()=='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de','Unexpected source revision'
R=args.output
assert any(part in R.resolve().parts for part in ['private-data','evidence']),'Private output required'
R.mkdir(exist_ok=True,parents=True)
D=fitz.open(args.source)
assert len(D)==147

PAGES=[15,30,40,52,58,64,72,87,90,95,104,107,115,122,125,139]
review=json.loads(args.question_review.read_text());starts={p['pdfPage']:p['answerStartY'] for p in review if p['pdfPage'] in PAGES}

def allchars(p,n):
 cs=[]
 for bi,b in enumerate(p.get_text('rawdict')['blocks']):
  if b['type']!=0:continue
  for li,l in enumerate(b['lines']):
   for si,s in enumerate(l['spans']):
    for ci,c in enumerate(s['chars']):cs.append(dict(**c,id=f'p{n:03}-b{bi:04}-l{li:04}-s{si:04}-c{ci:04}'))
 return cs

def bbox(cs):return [min(c['bbox'][0] for c in cs),min(c['bbox'][1] for c in cs),max(c['bbox'][2] for c in cs),max(c['bbox'][3] for c in cs)]
def inside(c,b):return b[0]<=sum(c['bbox'][::2])/2<b[2] and b[1]<=sum(c['bbox'][1::2])/2<b[3]
def unique(vals):
 out=[]
 for v in sorted(vals):
  if not out or abs(v-out[-1])>.6:out.append(v)
 return out
out=[]
for n in PAGES:
 p=D[n-1];cs=allchars(p,n);lines=collections.defaultdict(list)
 for c in cs:lines[round(c['origin'][1])].append(c)
 labels=[]
 for y,row in sorted(lines.items()):
  row=sorted(row,key=lambda c:c['bbox'][0]);t=''.join(c['c'] for c in row)
  for m in re.finditer(r'\((\d{1,3})\)',t):
   cc=row[m.start():m.end()];bb=bbox(cc)
   if bb[1]>=starts.get(n,0)-1 and bb[1]<775:labels.append(dict(number=int(m[1]),bbox=bb,baseline=y,numberChars=cc))
 labels.sort(key=lambda l:(l['baseline'],l['bbox'][0]));h=[];v=[]
 for dr in p.get_drawings():
  if dr['type'] not in ['s','fs']:continue
  for item in dr['items']:
   if item[0]!='l':continue
   a,b=item[1:3]
   if abs(a.y-b.y)<.2 and abs(a.x-b.x)>150:h.append((a.y,min(a.x,b.x),max(a.x,b.x)))
   if abs(a.x-b.x)<.2 and abs(a.y-b.y)>25:v.append((a.x,min(a.y,b.y),max(a.y,b.y)))
 # Equal-y strokes form a frame envelope even where the caption hides a short top segment.
 hh=[]
 for y in unique(t[0] for t in h):
  seg=[x for x in h if abs(x[0]-y)<.7];hh.append((y,min(x[1] for x in seg),max(x[2] for x in seg)))
 panels=collections.defaultdict(list)
 for l in labels:
  x=(l['bbox'][0]+l['bbox'][2])/2;y=l['baseline']
  vx=unique(a for a,lo,hi in v if lo-1<=y<=hi+1)
  left=max((a for a in vx if a<x),default=87.8);right=min((a for a in vx if a>x),default=510.7)
  hy=unique(a for a,lo,hi in hh if lo<=left+1 and hi>=right-1)
  top=max((a for a in hy if a<l['bbox'][1]),default=starts.get(n,0)-30);bottom=min((a for a in hy if a>l['bbox'][3]),default=775)
  panel=tuple(round(z,1) for z in [left,top,right,bottom]);panels[panel].append(l)
 results=[]
 for panel,entries in sorted(panels.items(),key=lambda x:(x[0][1],x[0][0])):
  answers=[]
  for label in entries:
   y=label['baseline'];same=sorted([l for l in entries if abs(l['baseline']-y)<=12],key=lambda l:l['bbox'][0]);right=min((l['bbox'][0]-.5 for l in same if l['bbox'][0]>label['bbox'][0]+2),default=panel[2]-.2)
   notes=[c['bbox'][0] for c in cs if c['c']=='※' and abs(c['origin'][1]-y)<=12 and c['bbox'][0]>label['bbox'][2]]
   if notes:right=min(right,min(notes)-.2)
   nextrow=min((l['bbox'][1]-.5 for l in entries if l['baseline']>y+12),default=min(panel[3]-.2,label['bbox'][3]+30))
   region=[label['bbox'][0]-.2,label['bbox'][1]-.4,right,nextrow];chars=[c for c in cs if inside(c,region) and c['id'] not in {x['id'] for x in label['numberChars']}]
   chars.sort(key=lambda c:(round(c['origin'][1]),c['bbox'][0]));s=''.join(c['c'] for c in chars).strip()
   answers.append(dict(number=label['number'],text=s,bbox=bbox(chars) if chars else None,sourceCharacterIds=[c['id'] for c in chars],numberBounds=label['bbox'],panel=list(panel)))
  results.append(dict(panel=list(panel),numbers=[a['number'] for a in answers],answers=answers))
 out.append(dict(pdfPage=n,answerStartY=starts.get(n,0),panels=results));print(n,[(x['panel'],x['numbers']) for x in results])
(R/'answer-panel-candidates.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
