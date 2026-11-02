#!/usr/bin/env python3
"""Compile reviewed, anchored private source records into the existing quiz schema.

Input and output contain private textbook material and MUST remain outside public
assets/Git. This compiler never reads/writes user attempts, DB rows or XP.
"""
import argparse,hashlib,json,re
from pathlib import Path
SCHEMA='hanq-source-quiz/1'
SOURCE='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de'

def compile_quiz(sample,raw_root):
 if sample.get('source',{}).get('sha256')!=SOURCE:raise ValueError('Unexpected source revision')
 records=sample['quizSample']['items'];items=[];topic_ids=[]
 for record in records:
  if not record.get('answer'):raise ValueError('Missing source answer anchor')
  item_id=record['id'];question=record['question'];answer=record['answer'];blank=record['blank'];number=record['originalNumber'];kind=record['kind']
  if not item_id.startswith('81-d54c1aa5:'):raise ValueError('Legacy item namespace cannot be reused')
  if not all(a.get('sourceCharacterIds') and a.get('bbox') for a in [question,answer,blank]):raise ValueError('Missing source character geometry')
  if record['subtopicId'] not in topic_ids:topic_ids.append(record['subtopicId'])
  answer_text=answer['text'].strip();events=[]
  if kind=='sequence':
   pieces=re.split(r'([①-⑳])',record['sequenceChoices']['text'])
   for i in range(1,len(pieces),2):
    label=pieces[i];text=pieces[i+1].strip();events.append(dict(label=label,text=text,sourceText=label+' '+text))
   parts=list(answer_text.replace('→',''));separator='→' if '→' in answer_text else ''
   if sorted(parts)!=sorted(e['label'] for e in events):raise ValueError('Sequence answer/choices mismatch')
  else:parts=[p.strip() for p in answer_text.split(',')];separator=''
  aid=[item_id+f':answer:{i+1}' for i in range(len(parts))];bid=item_id+':blank:1'
  match=re.search(r'\( +\)',blank['text'])
  if not match:raise ValueError('Only explicit printed blanks can be compiled')
  placeholder=match.group();blank_record=dict(id=bid,placeholder=placeholder,answerIds=aid,bounds=blank['bbox'],sourceCharacterIds=blank['sourceCharacterIds'])
  stem=question['text'];segments=[dict(type='text',text=stem+' '),dict(type='blank',id=bid,placeholder=placeholder,answerIds=aid)]
  source_text=f'({number}) '+stem+' '+placeholder+(' '+''.join(e['sourceText'] for e in events) if events else '')
  source=dict(sha256=SOURCE,revision=SOURCE,pdfPage=question['pdfPage'],printedPage=question['printedPage'],questionBounds=question['bbox'],questionCharacterIds=question['sourceCharacterIds'],numberCharacterIds=record['numberAnchor']['sourceCharacterIds'],numberBounds=record['numberAnchor']['bbox'],answerPdfPage=answer['pdfPage'],answerPrintedPage=answer['printedPage'],answerBounds=answer['bbox'],answerCharacterIds=answer['sourceCharacterIds'],verificationBasis='New-edition original PDF14/15 visual question/answer-table comparison plus exact native character anchors; source historical facts not independently verified')
  if events:source['choiceCharacterIds']=record['sequenceChoices']['sourceCharacterIds']
  item=dict(id=item_id,order=len(items)+1,sourcePage=question['pdfPage'],pdfPage=question['pdfPage'],printedPage=question['printedPage'],subtopicId=record['subtopicId'],originalNumber=number,originalNumberLabel=f'({number})',kind=kind,text=stem,sourceText=source_text,segments=segments,blanks=[blank_record],answer=dict(text=answer_text,parts=parts,orderMatters=kind=='sequence',partOrderPreserved=True,sourceText=f'({number}) '+answer_text),answers=[dict(id=id,text=text,order=i+1,sourcePage=answer['pdfPage'],bounds=answer['bbox'],sourceCharacterIds=answer['sourceCharacterIds']) for i,(id,text) in enumerate(zip(aid,parts))],source=source,verification=dict(status='source-verified',textVerified=True,answerPairVerified=True,ocrUsed=False,historicalCorrectnessIndependentlyChecked=False))
  if events:item['events']=events
  items.append(item)
 pages=sorted({i['pdfPage'] for i in items}|{i['source']['answerPdfPage'] for i in items})
 manifest=json.loads((raw_root/'manifest.json').read_text());page_records={p['pdfPage']:p for p in manifest['pages']}
 titles={'prehistory':'선사시대','gojoseon-and-states':'고조선과 여러나라'}
 return dict(schemaVersion=SCHEMA,id='prehistory',title='선사시대~여러나라의 성장',source=dict(sha256=SOURCE,revision=SOURCE,pdfPages=pages,printedPages=[n-7 for n in pages],coordinateSystem='PDF points; top-left origin; x0,y0,x1,y1; 1-based PDF page numbers',pageDimensions={str(n):[page_records[n]['width'],page_records[n]['height']] for n in pages},nativeExtraction='PyMuPDF 1.26.6 rawdict characters with new-edition source anchors',sourceRenderSha256={str(n):page_records[n]['imageSha256'] for n in pages}),access=dict(audience='authenticated-members',publicAssetsAllowed=False,uploaded=False,deployed=False),subtopics=[dict(id=id,title=titles[id],sourcePage=next(i['sourcePage'] for i in items if i['subtopicId']==id),itemCount=sum(i['subtopicId']==id for i in items)) for id in topic_ids],items=items)

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--reviewed-sample',type=Path,required=True);p.add_argument('--raw-root',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
 if not any(x in a.output.resolve().parts for x in ['private-data','evidence']):raise ValueError('Private output directory required')
 result=compile_quiz(json.loads(a.reviewed_sample.read_text()),a.raw_root)
 a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(dict(id=result['id'],items=len(result['items']),sha256=hashlib.sha256(a.output.read_bytes()).hexdigest())))
if __name__=='__main__':main()
