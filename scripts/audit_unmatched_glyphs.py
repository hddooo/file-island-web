import html,json,math,re
from pathlib import Path
import fitz
from enhance_textbook import USE,ATTR
from extract_textbook import write_json
root=Path(__file__).resolve().parents[2]/'hanq-private-data';doc=fitz.open(root/'source/original.pdf');issues=[]
for i,page in enumerate(doc):
 chars={}
 for b in page.get_text('rawdict')['blocks']:
  for l in b.get('lines',[]):
   for s in l['spans']:
    for c in s['chars']:
     x,y=c['origin'];chars.setdefault((c['c'],math.floor(x),math.floor(y)),[]).append((x,y,s['flags']))
 for match in USE.finditer((root/f'enhanced/page-{i+1:03d}.svg').read_text()):
  a=dict(ATTR.findall(match.group(0)))
  if 'data-text' not in a:continue
  ns=[float(n) for n in re.findall(r'[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?',a['transform'])];x,y=ns[4:];ch=html.unescape(a['data-text'])
  found=[bool(flags&16) for dx in [-1,0,1] for dy in [-1,0,1] for xx,yy,flags in chars.get((ch,math.floor(x)+dx,math.floor(y)+dy),[]) if abs(x-xx)<.035 and abs(y-yy)<.035]
  if not found or len(set(found))!=1:issues.append({'pdfPage':i+1,'character':ch,'origin':[x,y],'whitespace':ch.isspace(),'reason':'unmatched-origin' if not found else 'ambiguous-boldness'})
audit={'total':len(issues),'whitespace':sum(i['whitespace'] for i in issues),'nonWhitespace':sum(not i['whitespace'] for i in issues),'issues':issues,'sourceTextLoss':False,'note':'All source glyph uses retained unchanged; extraction matches raw PDF character output. No semantic parity assertion.'};write_json(root/'unmatched-glyph-audit.json',audit);print({k:v for k,v in audit.items() if k!='issues'})
