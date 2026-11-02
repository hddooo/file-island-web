#!/usr/bin/env python3
"""Apply private, source-checked transcription overrides after verifying raster hashes."""
import argparse,hashlib,json,collections
from pathlib import Path
SHA='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de'
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,separators=(',',':'))+'\n')
def charids(v):
 if isinstance(v,dict):
  for k,x in v.items():
   if k=='sourceCharIds':yield from x
   elif k!='transcriptionAudit':yield from charids(x)
 elif isinstance(v,list):
  for x in v:yield from charids(x)
def remove_figures(blocks,ids):
 out=[]
 for b in blocks:
  if b.get('assetId') in ids:continue
  if b['type']=='table':
   b['figures']=[f for f in b.get('figures',[]) if f.get('assetId') not in ids]
   b['figureGroups']=[g for g in b.get('figureGroups',[]) if not set(g['assetIds'])&ids]
  out.append(b)
 return out

def apply(root,review):
 assert root.name==SHA and 'private-data' in root.resolve().parts
 r=json.loads(review.read_text());assert r['sourceSha256']==SHA
 semantic=root/'semantic';manifest=json.loads((semantic/'manifest.json').read_text());removed=set();counts=[]
 for record in r['records']:
  n=record['pdfPage'];file=semantic/f'pages/page-{n:03}.json';page=json.loads(file.read_text());assert page['sourceSha256']==SHA;before=collections.Counter(charids(page['blocks']));block=record['block'];audit=block['transcriptionAudit'];assert audit['sourceSha256']==SHA and audit['sourceVerified'] is True
  raw=json.loads((root/f'raw/pages/page-{n:03}.json').read_text())
  for id,h in zip(audit['sourceAssetIds'],audit['sourceImageSha256']):
   i=int(id.rsplit('-',1)[1])-1;asset=root/'raw'/raw['imagePlacements'][i]['assetPath'];assert hashlib.sha256(asset.read_bytes()).hexdigest()==h
  retired=set(record['retiredSourceAssetIds']);page['blocks']=remove_figures(page['blocks'],retired);page['figureGroups']=[g for g in page.get('figureGroups',[]) if not set(g['assetIds'])&retired];page['blocks']=[b for b in page['blocks'] if b['id']!=block['id']]+[block];page['blocks'].sort(key=lambda b:((b.get('bbox') or [0,0,0,0])[1],(b.get('bbox') or [0,0,0,0])[0]));assert collections.Counter(charids(page['blocks']))==before
  for f in page['imageInventory']:
   if f['assetId'] in retired:f['presentationStatus']='semantic-transcription-reviewed';f['semanticBlockIds']=[block['id']]
  page['studySectionPartition']['conceptBlockIds']=[b['id'] for b in page['blocks'] if b.get('studySection')=='concept'];write(file,page);removed|=retired;counts.append(dict(pdfPage=n,blockId=block['id'],nativeCharIdsUnchanged=True,sourceImageHashesVerified=True))
 manifest['figures']=[f for f in manifest['figures'] if f['id'] not in removed]
 for entry in manifest['pages']:
  p=json.loads((semantic/f"pages/page-{entry['pdfPage']:03}.json").read_text());entry['studySectionCounts']={k:sum(b.get('studySection')==k for b in p['blocks']) for k in ['concept','exam']}
 write(semantic/'manifest.json',manifest);write(root/'validation/reviewed-diagram-application.json',dict(sourceSha256=SHA,records=counts,sourceFilesDeleted=False,activated=False));print('Applied',len(counts),'reviewed diagram blocks; source assets retained privately')
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('revision',type=Path);p.add_argument('review',type=Path);a=p.parse_args();apply(a.revision,a.review)
