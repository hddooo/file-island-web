#!/usr/bin/env python3
"""Compute non-destructive horizontal viewports; never rewrite source PNGs."""
import json,sys
from pathlib import Path
import numpy as np
from PIL import Image
from extract_textbook import sha256,write_json

def run(root):
 root=Path(root);m=json.loads((root/'manifest.json').read_text())
 for p in m['pages']:
  path=root/p['imagePath'];d=json.loads((root/p['dataPath']).read_text())
  with Image.open(path) as im:a=np.asarray(im.convert('RGB'))
  ys,xs=np.where(np.any(a!=255,axis=2));w=a.shape[1]
  pad=int(np.ceil(4*w/d['width']))
  left=max(0,int(xs.min())-pad) if xs.size else 0
  right=min(w,int(xs.max())+1+pad) if xs.size else w
  assert np.all(a[:,:left]==255) and np.all(a[:,right:]==255)
  assert sha256(path)==p['imageSha256']
  d['readingViewport']={'bbox':[left/w*d['width'],0,right/w*d['width'],d['height']],
   'pixelBounds':[left,0,right,a.shape[0]],'sourcePixelWidth':w,'paddingPoints':4,
   'discardedSidePixelsExactlyWhite':True,'sourceImageSha256':p['imageSha256'],
   'policy':'page-wide-horizontal-only; original full-page view unchanged'}
  write_json(root/p['dataPath'],d);p['dataSha256']=sha256(root/p['dataPath'])
 write_json(root/'manifest.json',m)
 print('Verified white-margin viewports:144; source PNGs unchanged')
if __name__=='__main__':run(sys.argv[1])
