#!/usr/bin/env python3
"""Locate and validate private 81st-edition review inputs without publishing text."""
import argparse,collections,hashlib,json
from pathlib import Path
SHA='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de'
NAMES=['quiz-review-map.json','reviewed-diagram-overrides.json','reviewed-page-overrides.json','reviewed-image-classifications.json']
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('revision',type=Path);p.add_argument('output',type=Path);a=p.parse_args();root=a.revision.resolve();assert root.name==SHA and 'private-data'in root.parts
 result=[]
 for name in NAMES:
  path=root/'validation'/name;assert path.is_file(),f'Missing private review input: {path}'
  raw=path.read_bytes();x=json.loads(raw);assert isinstance(x,dict)
  if name!='quiz-review-map.json':assert x['sourceSha256']==SHA and isinstance(x['records'],list)
  row=dict(name=name,path=str(path),bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest())
  if name=='quiz-review-map.json':
   actual={}
   for era,review in x.items():
    q=json.loads((root/f'semantic/quizzes/{era}.json').read_text());assert q['source']['sha256']==SHA
    topics=collections.Counter(i['subtopicId'] for i in q['items']);expected={t['id']:t['count'] for t in review['topics']};assert dict(topics)==expected,(era,'review map topic counts differ from canonical quiz');actual[era]=len(q['items'])
   assert len(actual)==8 and sum(actual.values())==697;row.update(eraCounts=actual,sourceBinding='Canonical quiz source SHA and complete per-topic count equality')
  else:row['records']=len(x['records'])
  result.append(row)
 report=dict(sourceRevision=SHA,files=result,allFourPresent=True,canonicalQuizItems=697,sourceTextPublished=False,scope='Located existing private review records and checked source/count/hash binding. This does not add human-reviewed coverage or replace original visual comparison.')
 a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('PASS: four source-bound review inputs; 8 eras,697 canonical quiz items; no source text output')
if __name__=='__main__':main()
