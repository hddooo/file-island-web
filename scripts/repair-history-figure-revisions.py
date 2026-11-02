#!/usr/bin/env python3
"""Bind embedded reviewed diagram photos to new source assets by exact SHA256."""
import argparse,collections,hashlib,json
from pathlib import Path
SHA='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de'
def refs(v):
 if isinstance(v,dict):
  for k,x in v.items():
   if k=='sourceCharIds':yield from x
   elif k!='transcriptionAudit':yield from refs(x)
 elif isinstance(v,list):
  for x in v:yield from refs(x)
def replace(v,m):
 if isinstance(v,str):return m.get(v,v)
 if isinstance(v,list):return [replace(x,m) for x in v]
 if isinstance(v,dict):return {k:replace(x,m) for k,x in v.items()}
 return v

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--revision',type=Path,required=True);p.add_argument('--baseline',type=Path,required=True);a=p.parse_args();r=a.revision;assert r.name==SHA and 'private-data' in r.resolve().parts
 old={}
 for path in (a.baseline/'pages').glob('*.json'):
  for f in json.loads(path.read_text()).get('imageInventory',[]):old[f['assetId']]=f
 repaired=[]
 for path in (r/'semantic/pages').glob('*.json'):
  d=json.loads(path.read_text());n=d['pdfPage'];before=collections.Counter(refs(d['blocks']));byhash=collections.defaultdict(list)
  for f in d.get('imageInventory',[]):byhash[f['sha256']].append(f)
  keepers={};changed=False
  for i,b in enumerate(d['blocks']):
   if not b.get('transcriptionAudit'):continue
   mapping={}
   for f in b.get('figures',[]):
    id=f['assetId']
    if id.startswith(f'p{n:03}-'):continue
    source=old[id];targets=byhash[source['sha256']];assert len(targets)==1,'Ambiguous photo revision';target=targets[0];newid=target['assetId'];mapping[id]=newid
    asset=r/'semantic/assets'/f"{newid}.{target['extension']}";assert hashlib.sha256(asset.read_bytes()).hexdigest()==source['sha256']
    f.update(id='81-'+newid+'-captioned',assetId=newid,bbox=target['bbox'],alt='원문 사진');keepers[newid]=b['id'];changed=True;repaired.append(dict(pdfPage=n,oldAssetId=id,newAssetId=newid,exactOriginalImageSha256=source['sha256'],captionContainer=b['id']))
   if mapping:d['blocks'][i]=replace(b,mapping)
  if not changed:continue
  result=[]
  for b in d['blocks']:
   if b['type']=='figure' and b['assetId'] in keepers:continue
   if b['type']=='table':
    remove={id for id,owner in keepers.items() if owner!=b['id']};b['figures']=[f for f in b.get('figures',[]) if f['assetId'] not in remove];b['figureGroups']=[g for g in b.get('figureGroups',[]) if not set(g['assetIds'])&remove]
   result.append(b)
  d['blocks']=result;assert collections.Counter(refs(d['blocks']))==before
  path.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n')
 out=dict(sourceSha256=SHA,repaired=repaired,sourceFilesDeleted=False,nativeTextChanged=False,activated=False);(r/'validation/embedded-figure-revision-repair.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print('Reanchored embedded source photos',len(repaired),'with exact original image hashes; duplicate raw placements removed from display only')
if __name__=='__main__':main()
