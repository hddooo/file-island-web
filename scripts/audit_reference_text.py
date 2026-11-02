#!/usr/bin/env python3
"""Compare a previously extracted PAGE-delimited reference without altering output text."""
import hashlib,json,re,sys
from pathlib import Path
from extract_textbook import write_json
root,reference=map(Path,sys.argv[1:3]);parts=re.split(r'\n--- PAGE (\d+) ---\n',reference.read_text());checks=[]
for i in range(1,len(parts),2):
 n=int(parts[i]);d=json.loads((root/f'pages/page-{n:03d}.json').read_text())
 checks.append({'pdfPage':n,'matchesIgnoringOuterWhitespace':parts[i+1].strip()==d['text'].strip()})
audit={'referenceFile':reference.name,'referenceSha256':hashlib.sha256(reference.read_bytes()).hexdigest(),'referencePages':len(checks),'matchingPageTextIgnoringOuterWhitespace':sum(c['matchesIgnoringOuterWhitespace'] for c in checks),'pages':checks,'note':'Comparison only; saved extraction remains unmodified. Original PDF remains authoritative.'}
write_json(root/'reference-text-audit.json',audit)
print(f"Reference text matches: {audit['matchingPageTextIgnoringOuterWhitespace']}/{len(checks)} pages")
