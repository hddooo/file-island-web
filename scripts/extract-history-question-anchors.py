#!/usr/bin/env python3
import argparse,hashlib,json,re,collections
from pathlib import Path
import fitz
parser=argparse.ArgumentParser(description='Extract private, source-bound quiz anchors; does not activate data.')
parser.add_argument('--source',type=Path,required=True)
parser.add_argument('--output',type=Path,required=True)
args=parser.parse_args()
assert hashlib.sha256(args.source.read_bytes()).hexdigest()=='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de','Unexpected source revision'
R=args.output
assert any(part in R.resolve().parts for part in ['private-data','evidence']),'Private output required'
R.mkdir(exist_ok=True,parents=True)
D=fitz.open(args.source)
assert len(D)==147

GROUPS={'prehistory':[14,15],'ancient':[27,28,29,30],'nambuk':[37,38,39,40],'goryeo':[49,50,51,57,58],'joseon':[63,64,70,71,72,83,84,85,86],'opening':[90,94,95,101,102,103,104,107],'colonial':[114,115,121,122,124,125],'modern':[137,138,139]}
ANSWERPAGES={15,30,40,52,58,64,72,87,90,95,104,107,115,122,125,139}
result={};report=[]
for era,pages in GROUPS.items():
 records=[]
 for n in pages:
  ls=[];raw=D[n-1].get_text('rawdict')
  for bi,b in enumerate(raw['blocks']):
   if b['type']!=0:continue
   for li,l in enumerate(b['lines']):
    chars=[dict(**c,id=f'p{n:03}-b{bi:04}-l{li:04}-s{si:04}-c{ci:04}') for si,s in enumerate(l['spans']) for ci,c in enumerate(s['chars'])];t=''.join(c['c'] for c in chars);ls.append(dict(text=t,bbox=list(l['bbox']),chars=chars))
  blanklines=[l for l in ls if re.search(r'\([\s,/]{3,}\)',l['text'])];lastblank=max((l['bbox'][3] for l in blanklines),default=0)
  labels=[]
  for l in ls:
   m=re.match(r'^\s*\((\d+)\)(?!-)',l['text'])
   if m and 90<l['bbox'][0]<100:labels.append(dict(number=int(m[1]),bbox=l['bbox'],numberChars=l['chars'][:m.end()],nativeLine=l['text']))
  firstanswer=min((l['bbox'][1] for l in labels if l['number']==1 and l['bbox'][1]>lastblank+3),default=775) if n in ANSWERPAGES else 775
  qs=[dict(pdfPage=n,**l) for l in labels if 80<l['bbox'][1]<firstanswer-3]
  qs.sort(key=lambda x:x['bbox'][1]);records+=qs;report.append(dict(era=era,pdfPage=n,lastBlank=lastblank,answerStartY=firstanswer,questionLabels=[q['number'] for q in qs]))
 result[era]=records
(R/'question-label-records.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));(R/'question-label-page-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
for era,rs in result.items():
 print(era,len(rs));group=[]
 for x in rs:
  if x['number']==1 and group:print([q['number'] for q in group]);group=[]
  group.append(x)
 if group:print([q['number'] for q in group])
