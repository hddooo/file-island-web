#!/usr/bin/env python3
"""Refresh candidate quiz metadata from the eight actual private quiz files."""
import argparse,json
from pathlib import Path
SHA='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de'
COUNTS=dict(prehistory=37,ancient=69,nambuk=55,goryeo=100,joseon=172,opening=118,colonial=84,modern=62)
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('revision',type=Path);a=p.parse_args();r=a.revision
 assert r.name==SHA and 'private-data' in r.resolve().parts
 path=r/'semantic/manifest.json';m=json.loads(path.read_text());assert m['source']['sha256']==SHA and m['bundleStatus']=='candidate-not-active'
 entries=[]
 for f in sorted((r/'semantic/quizzes').glob('*.json')):
  q=json.loads(f.read_text());assert q['source']['sha256']==SHA and len(q['items'])==COUNTS[q['id']]
  entries.append(dict(id=q['id'],eraId=q['id'],title=q['title'],itemCount=len(q['items']),pdfPages=q['source']['pdfPages'],reviewStatus='source-verified'))
 assert {q['id'] for q in entries}==set(COUNTS)
 m.update(quizzes=entries,quizCount=len(entries));path.write_text(json.dumps(m,ensure_ascii=False,separators=(',',':'))+'\n');print('Synced8 source quiz entries/697 items; candidate remains inactive')
if __name__=='__main__':main()
