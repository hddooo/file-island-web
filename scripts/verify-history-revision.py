#!/usr/bin/env python3
"""Verify private source anchors and immutable legacy bytes, without API/DB I/O."""
import argparse,collections,hashlib,json,re
from pathlib import Path
NEW='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de'
OLD='35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def norm(s):return re.sub(r'\s+','',s)
def chars(data):
 result={}
 for b in data['textBlocks']:
  for li,l in enumerate(b['lines']):
   for si,s in enumerate(l['spans']):
    for ci,c in enumerate(s['chars']):result[f"{b['id']}-l{li:04}-s{si:04}-c{ci:04}"]=c
 return result

def verify(root):
 current=root/NEW;legacy=root/OLD;raw=current/'raw';semantic=current/'semantic';manifest=json.loads((raw/'manifest.json').read_text());assert sha(raw/'source/original.pdf')==NEW
 assert manifest['source']['pageCount']==147 and len(manifest['pages'])==147
 maps={};checked=[]
 def source_text(page,ids):
  if page not in maps:maps[page]=chars(json.loads((raw/f'pages/page-{page:03}.json').read_text()))
  if not ids or len(ids)!=len(set(ids)):raise AssertionError('Missing/repeated character anchor')
  return ''.join(maps[page][id]['c'] for id in ids)
 for path in sorted((semantic/'quizzes').glob('*.json')):
  assert path.stat().st_size<=2*1024*1024,('quiz exceeds private API file bound',path.name)
  q=json.loads(path.read_text());assert q['source']['sha256']==NEW;old=json.loads((legacy/'semantic/quizzes'/path.name).read_text());oldids={i['id'] for i in old['items']};assert not oldids&{i['id'] for i in q['items']}
  for i,item in enumerate(q['items'],1):
   s=item['source'];assert item['order']==i and s['sha256']==NEW
   native_question=source_text(s['pdfPage'],s['questionCharacterIds'])
   assert native_question==s.get('questionNativeText',item['text'])
   if item['kind']=='classification':assert norm(native_question)==norm(item['sourceText'])
   else:assert norm(native_question)==norm(item['text'])
   if item['originalNumber'] is not None:assert norm(source_text(s['pdfPage'],s['numberCharacterIds']))==item['originalNumberLabel']
   else:assert item['originalNumberPresent'] is False and item['originalNumberLabel']==''
   assert source_text(s['answerPdfPage'],s['answerCharacterIds']).strip()==item['answer']['text']
   for blank in item['blanks']:assert blank['placeholder'] in source_text(s['pdfPage'],blank['sourceCharacterIds'])
   if item.get('events'):assert norm(source_text(s['pdfPage'],s['choiceCharacterIds']))==norm(''.join(e['sourceText'] for e in item['events']))
   checked.append(dict(quizId=q['id'],itemId=item['id'],questionAndAnswerNativeAnchorsExact=True,originalNumberExact=True,legacyItemIdReused=False))
  for n,h in q['source']['sourceRenderSha256'].items():assert sha(raw/f'renders/page-{int(n):03}.png')==h
 snapshot=json.loads((legacy/'snapshot-integrity.json').read_text());assert snapshot['sourceSha256']==OLD
 for f in snapshot['files']:assert sha(legacy/'semantic'/f['path'])==f['sha256']
 report=dict(sourceSha256=NEW,legacySourceSha256=OLD,rawPages=147,quizItemsVerified=len(checked),legacySnapshotFilesVerified=len(snapshot['files']),legacySnapshotUnchanged=True,sourceAnchorsExact=True,legacyIdsReused=False,productionWrites=False,scope='Byte and native-source anchor verification. Human source review, raster wording, renderer integration and exact-SHA release are separate.',items=checked)
 out=current/'validation/source-anchor-verification.json';out.parent.mkdir(exist_ok=True);out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='items'}))
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('revisions',type=Path);a=p.parse_args();verify(a.revisions)
