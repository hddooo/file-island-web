#!/usr/bin/env python3
"""Extract PDF source image+soft-mask composition into authenticated PNG assets.

This is canonical PDF asset extraction, without retouching/cropping/generation.
Original encoded image and mask files remain unchanged in the private raw root.
"""
import argparse,hashlib,json
from pathlib import Path
import fitz
SHA='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('revision',type=Path);a=p.parse_args();r=a.revision;assert r.name==SHA and 'private-data' in r.resolve().parts
 root=r/'semantic';m=json.loads((root/'manifest.json').read_text());entries={f['id']:f for f in m['figures']};results=[]
 for n in range(1,148):
  raw=json.loads((r/f'raw/pages/page-{n:03}.json').read_text());pagepath=root/f'pages/page-{n:03}.json';page=json.loads(pagepath.read_text());changed=False
  for i,f in enumerate(raw['imagePlacements'],1):
   id=f'p{n:03}-figure-{i}'
   if not f.get('maskPath') or id not in entries:continue
   original=r/'raw'/f['assetPath'];maskfile=r/'raw'/f['maskPath'];original_sha=sha(original);mask_sha=sha(maskfile);base=fitz.Pixmap(original);mask=fitz.Pixmap(maskfile)
   assert base.width==mask.width and base.height==mask.height and mask.n==1
   if base.alpha:base=fitz.Pixmap(base,0)
   if base.colorspace.n!=3:base=fitz.Pixmap(fitz.csRGB,base)
   merged=fitz.Pixmap(base,mask);assert merged.alpha and merged.n==4
   output=root/'assets'/f'{id}.png';merged.save(output);reopened=fitz.Pixmap(output);assert reopened.alpha and reopened.width==mask.width and reopened.height==mask.height
   assert reopened.samples[3::4]==mask.samples,'Saved alpha must match the original PDF soft mask exactly'
   assert output.stat().st_size<=2*1024*1024,'Original alpha asset exceeds current private API bound'
   entry=entries[id];entry.update(extension='png',bytes=output.stat().st_size,sha256=sha(output),sourceImageSha256=original_sha,sourceMaskSha256=mask_sha,sourceAlphaPreserved=True)
   for inv in page.get('imageInventory',[]):
    if inv['assetId']==id:inv.update(exportExtension='png',exportSha256=entry['sha256'],exportBytes=entry['bytes'],sourceMaskSha256=mask_sha,presentationStatus='source-alpha-preserved')
   assert sha(original)==original_sha and sha(maskfile)==mask_sha
   results.append(dict(assetId=id,pdfPage=n,sourceImageSha256=original_sha,sourceMaskSha256=mask_sha,exportSha256=entry['sha256'],exportBytes=entry['bytes'],sourceAlphaExact=True,originalFilesUnchanged=True));changed=True
  if changed:pagepath.write_text(json.dumps(page,ensure_ascii=False,separators=(',',':'))+'\n')
 (root/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,separators=(',',':'))+'\n');(r/'validation/source-alpha-preservation.json').write_text(json.dumps(dict(sourceSha256=SHA,assets=results,scope='PDF image/soft-mask extraction using PyMuPDF; saved PNG alpha byte-for-byte checked against source mask; original source files unchanged.',activated=False),ensure_ascii=False,indent=2)+'\n');print('Preserved source alpha for',len(results),'available original figures')
if __name__=='__main__':main()
