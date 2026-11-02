#!/usr/bin/env python3
"""Seal two private source revisions into a hash-audited inactive handoff bundle.

No browser screenshots, unrelated user files, credentials, or public uploads.
The archive may be transferred only through the authorized private file route.
"""
import argparse,hashlib,json,tarfile
from pathlib import Path
SOURCES={'35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442':144,'d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de':147}
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  while chunk:=f.read(1024*1024):h.update(chunk)
 return h.hexdigest()
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--revisions',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();r=a.revisions.resolve();out=a.output.resolve()
 assert 'private-data' in r.parts and 'private-data' in out.parts and not out.exists(),'Use a new private archive path'
 inventory=[]
 for source,pages in SOURCES.items():
  root=r/source;assert sha(root/'raw/source/original.pdf')==source
  raw=json.loads((root/'raw/manifest.json').read_text());semantic=json.loads((root/'semantic/manifest.json').read_text());assert raw['source']['pageCount']==pages and semantic['source']['totalPdfPages']==pages and semantic['source']['sha256']==source
  for file in sorted(root.rglob('*')):
   assert not file.is_symlink(),'Materialize source bytes before packaging'
   if file.is_file():inventory.append(dict(path=str(file.relative_to(r)),bytes=file.stat().st_size,sha256=sha(file)))
 metadata=dict(schemaVersion='hanq-source-handoff/1',status='candidate-not-active',sources=[dict(sha256=s,pages=n,rawRoot=s+'/raw',semanticRoot=s+'/semantic') for s,n in SOURCES.items()],sourceVersionsPath=list(SOURCES)[1]+'/validation/source-version-comparison.json',legacySemanticImmutable=True,productionWrites=False,activationDependencies=['Source-bound147p FE/API and era ranges','Archived original quiz/workspace read and resume path','Bounded validator support for original source forms','Source-original full-page/zoom and cover view','Exact integrated SHA CI and root deployment'],files=inventory)
 data=(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n').encode();out.parent.mkdir(parents=True,exist_ok=True)
 import io
 with tarfile.open(out,'w:gz',compresslevel=6) as t:
  info=tarfile.TarInfo('bundle-manifest.json');info.size=len(data);info.mode=0o600;t.addfile(info,io.BytesIO(data))
  for file in inventory:t.add(r/file['path'],arcname=file['path'],recursive=False)
 # Read every member back, reject traversal and verify the sealed inventory.
 with tarfile.open(out,'r:gz') as t:
  assert len(t.getmembers())==len(inventory)+1
  for f in inventory:
   member=t.getmember(f['path']);assert member.isfile() and not member.name.startswith('/') and '..' not in Path(member.name).parts
   h=hashlib.sha256();stream=t.extractfile(member)
   while chunk:=stream.read(1024*1024):h.update(chunk)
   assert member.size==f['bytes'] and h.hexdigest()==f['sha256']
 receipt=dict(archive=out.name,bytes=out.stat().st_size,sha256=sha(out),files=len(inventory),readbackVerified=True,sources=list(SOURCES),status='candidate-not-active')
 out.with_suffix(out.suffix+'.receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt))
if __name__=='__main__':main()
