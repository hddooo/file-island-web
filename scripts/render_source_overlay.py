#!/usr/bin/env python3
"""Overlay only original bold glyph paths on original PDF, preserving base rendering."""
import argparse,json,xml.etree.ElementTree as ET
from pathlib import Path
import fitz
ET.register_namespace("", "http://www.w3.org/2000/svg")
ET.register_namespace("xlink", "http://www.w3.org/1999/xlink")
from enhance_textbook import enhance_svg,USE
from extract_textbook import sha256,write_json

def bold_overlay(page):
 original=page.get_svg_image(text_as_path=True)
 enhanced,audit=enhance_svg(page,original)
 changed={i for i,(a,b) in enumerate(zip(USE.findall(original),USE.findall(enhanced))) if a!=b}
 root=ET.fromstring(enhanced); counter=[0]
 def prune(node,in_defs=False):
  for child in list(node):
   kind=child.tag.rsplit('}',1)[-1]
   if in_defs or kind=='defs':continue
   if kind=='use':
    keep=counter[0] in changed;counter[0]+=1
    if not keep:node.remove(child)
   elif kind=='g':
    prune(child)
    if not len(child):node.remove(child)
   else:node.remove(child)
 prune(root)
 return ET.tostring(root,encoding='utf-8'),audit

def run(root,pages=None):
 import numpy as np
 from PIL import Image
 root=Path(root);manifest=json.loads((root/'manifest.json').read_text());doc=fitz.open(root/'source/original.pdf');audits=[]
 (root/'enhanced-masks').mkdir(exist_ok=True)
 for i,p in enumerate(manifest['pages']):
  if pages and i+1 not in pages:continue
  page=doc[i];svg,audit=bold_overlay(page)
  data=json.loads((root/p['dataPath']).read_text())
  source_path=root/p['imagePath'];source_sha=sha256(source_path)
  original=np.array(Image.open(source_path).convert('RGB'))
  with fitz.open(stream=svg,filetype='svg') as overlay:
   pix=overlay[0].get_pixmap(matrix=fitz.Matrix(2,2),alpha=True)
   glyph_mask=np.frombuffer(pix.samples,dtype=np.uint8).reshape(pix.height,pix.width,4)[:,:,3]>0
  assert glyph_mask.shape == original.shape[:2]
  protected=np.zeros(glyph_mask.shape,dtype=bool)
  def protect(box):
   x0,y0,x1,y1=box
   protected[max(0,int(y0*2)):min(pix.height,int(np.ceil(y1*2))),max(0,int(x0*2)):min(pix.width,int(np.ceil(x1*2)))]=True
  for block in data['textBlocks']:
   for line in block['lines']:
    for span in line['spans']:
     if not(span['flags']&16):protect(span['bbox'])
  for image in data['imagePlacements']:protect(image['bbox'])
  # Only existing source ink within exact original bold glyph coverage is changed.
  mask=glyph_mask & ~protected & (original.min(axis=2)<240)
  result=original.copy()
  light=original.min(axis=2)[mask].astype(float)/255
  blue=np.array([18,59,117])
  result[mask]=np.rint(blue[None,:]*(1-light[:,None])+255*light[:,None]).astype(np.uint8)
  changed=np.any(result!=original,axis=2)
  outside=int(np.count_nonzero(changed & ~mask)); protected_changes=int(np.count_nonzero(changed & protected))
  assert outside==0 and protected_changes==0
  path=f'enhanced/page-{i+1:03d}.png'; Image.fromarray(result).save(root/path)
  mask_path=f'enhanced-masks/page-{i+1:03d}.png';Image.fromarray(mask.astype(np.uint8)*255).save(root/mask_path)
  assert sha256(source_path)==source_sha==p['imageSha256']
  check=np.array(Image.open(root/path).convert('RGB'))
  assert np.array_equal(check[~mask],original[~mask]) and np.array_equal(check[protected],original[protected])
  page_audit={'pdfPage':i+1,'rasterization':'original-PNG-source-ink-recolor-through-bold-glyph-mask',
    'pixelPreservationVerified':True,'changedPixels':int(changed.sum()),'outsideMaskChangedPixels':outside,
    'protectedNormalTextAndImageChangedPixels':protected_changes,'originalPngChecksumUnchanged':True,
    'maskPath':mask_path,'maskSha256':sha256(root/mask_path),'semanticReviewStatus':'unverified'}
  data['enhancementAudit'].update(page_audit)
  write_json(root/p['dataPath'],data)
  p['dataSha256']=sha256(root/p['dataPath']);p['enhancedImageSha256']=sha256(root/path)
  audits.append(page_audit)
  if (i+1)%12==0:print(f'Pixel-verified {i+1}/144',flush=True)
 manifest['enhancement']['rasterization']='original-PNG-source-ink-recolor-through-bold-glyph-mask'
 write_json(root/'manifest.json',manifest)
 write_json(root/'pixel-preservation-audit.json',audits)
 print('Source pixels preserved outside exact selected glyph mask',flush=True)
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);parser.add_argument('--pages',type=int,nargs='*');args=parser.parse_args();run(args.output,args.pages)
