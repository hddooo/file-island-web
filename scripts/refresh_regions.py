#!/usr/bin/env python3
import json,sys
from pathlib import Path
import fitz
from enhance_textbook import regions
from extract_textbook import write_json, sha256
root=Path(sys.argv[1]);m=json.loads((root/'manifest.json').read_text());doc=fitz.open(root/m['source']['pdfPath'])
image_checksums={path:sha256(root/path) for p in m['pages'] for path in [p['imagePath'],p['enhancedImagePath']]}
for i,p in enumerate(m['pages']):
 d=json.loads((root/p['dataPath']).read_text()); d['regions'],d['tableCandidates']=regions(doc[i],d)
 write_json(root/p['dataPath'],d); p['dataSha256']=sha256(root/p['dataPath']);p['regionCount']=len(d['regions'])
assert all(sha256(root/path)==checksum for path,checksum in image_checksums.items()), 'Region refresh changed an image'
m['segmentation']={'policy':'whole-table-envelope-protection; whole-page fallback without reliable table geometry','semanticReviewStatus':'unverified','originalAndEnhancedImagesUnchanged':True}
write_json(root/'manifest.json',m)
audit_path=root/'enhancement-audit.json'
if audit_path.exists():
 audits=json.loads(audit_path.read_text())
 for audit,page in zip(audits,m['pages']):
  audit['regionCount']=page['regionCount']
 write_json(audit_path,audits)
print('Refreshed conservative whole-table regions',sum(p['regionCount'] for p in m['pages']))
