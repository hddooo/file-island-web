#!/usr/bin/env python3
"""Reuse reviewed PUA glyph display mappings only with identical font/CMap bytes."""
import argparse,hashlib,json,collections,unicodedata
from pathlib import Path
import fitz
NEW='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';OLD='35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def walk(v):
 if isinstance(v,dict):
  yield v
  for x in v.values():yield from walk(x)
 elif isinstance(v,list):
  for x in v:yield from walk(x)
def signatures(doc):
 out={}
 for f in doc[8].get_fonts(full=True):
  if f[3] not in ['CIDFont+F5','CIDFont+F6']:continue
  typ,ref=doc.xref_get_key(f[0],'ToUnicode');assert typ=='xref';data=doc.extract_font(f[0])[3]
  out[f[3]]=dict(fontProgramSha256=hashlib.sha256(data).hexdigest(),toUnicodeSha256=hashlib.sha256(doc.xref_stream(int(ref.split()[0]))).hexdigest(),encoding=f[5])
 return out

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--revision',type=Path,required=True);p.add_argument('--baseline',type=Path,required=True);p.add_argument('--legacy-source',type=Path,required=True);a=p.parse_args();r=a.revision
 assert r.name==NEW and 'private-data' in r.resolve().parts and sha(a.legacy_source)==OLD
 old=fitz.open(a.legacy_source);new=fitz.open(r/'raw/source/original.pdf');old_sig=signatures(old);new_sig=signatures(new);assert old_sig==new_sig and len(new_sig)==2
 maps={}
 for page in (a.baseline/'pages').glob('*.json'):
  for s in walk(json.loads(page.read_text())):
   t=s.get('text');mapped=s.get('renderText')
   if isinstance(t,str) and len(t)==1 and unicodedata.category(t)=='Co' and isinstance(mapped,str) and s.get('mappingAudit',{}).get('verified'):
    assert t not in maps or maps[t]==mapped;maps[t]=mapped
 assert maps.get('\uf09f')=='•'
 result=[];total=0
 for n in range(1,148):
  raw=json.loads((r/f'raw/pages/page-{n:03}.json').read_text());lookup={}
  for b in raw['textBlocks']:
   for li,l in enumerate(b['lines']):
    for si,s in enumerate(l['spans']):
     for ci,c in enumerate(s['chars']):lookup[f"{b['id']}-l{li:04}-s{si:04}-c{ci:04}"]=(c['c'],s['font'])
  path=r/f'semantic/pages/page-{n:03}.json';page=json.loads(path.read_text());count=0
  for s in walk(page['blocks']):
   t=s.get('text')
   if not isinstance(t,str) or not any(c in maps for c in t):continue
   refs=s.get('sourceCharIds');assert refs,'Native source mapping requires anchors'
   used=[]
   for id in refs:
    c,font=lookup[id]
    if c in maps:
     expected='CIDFont+F6' if c=='\uf09f' else 'CIDFont+F5';assert font==expected;used.append(font);count+=1
   assert used
   shown=s.get('renderText',t)
   for c,to in maps.items():shown=shown.replace(c,to)
   s['renderText']=shown;marker=all(c.isspace() or 0xf02b1<=ord(c)<=0xf02b9 for c in t)
   s['mappingAudit']=dict(verified=True,sourceGlyphDescription='outlined-square section numeral' if marker else 'source bullet glyph',verificationMethod='Identical embedded font program and ToUnicode CMap to reviewed source mapping',sourceSha256=NEW,referenceSourceSha256=OLD,fontPrograms={font:new_sig[font] for font in set(used)})
  path.write_text(json.dumps(page,ensure_ascii=False,separators=(',',':'))+'\n');total+=count
  if count:result.append(dict(pdfPage=n,glyphsMapped=count,sourceTextAndCharacterIdsUnchanged=True))
 report=dict(sourceSha256=NEW,referenceSourceSha256=OLD,verifiedFontPrograms=new_sig,glyphDisplayMappings={hex(ord(k)):v for k,v in maps.items()},mappedGlyphs=total,pages=result,scope='Display-only source glyph substitutions with native original text/character IDs retained; no prose rewriting or user data I/O.')
 (r/'validation/font-glyph-mapping-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('Verified glyph display mappings',total,'with identical font programs and CMaps')
if __name__=='__main__':main()
