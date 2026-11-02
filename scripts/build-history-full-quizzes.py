#!/usr/bin/env python3
"""Compile private new-edition native question/answer anchors, retaining source forms.

Requires a separately source-reviewed panel/topic map. Does not migrate attempts,
activate a dataset, normalize source answers into a previous edition, or publish.
"""
import argparse,collections,copy,hashlib,json,re
from pathlib import Path
SHA='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de'
PREFIX='81-d54c1aa5'
CIRCLED='①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'
def norm(s):return re.sub(r'\s+','',s)
def box(cs):return [min(c['bbox'][0] for c in cs),min(c['bbox'][1] for c in cs),max(c['bbox'][2] for c in cs),max(c['bbox'][3] for c in cs)]
def inside(c,b):return b[0]<=sum(c['bbox'][::2])/2<b[2] and b[1]<=sum(c['bbox'][1::2])/2<b[3]
def ordered(cs):return sorted(cs,key=lambda c:(round(c['origin'][1]),c['bbox'][0]))
def text(cs):return ''.join(c['c'] for c in cs)
def ids(cs):return [c['id'] for c in cs]
def split_top(s,separator=','):
 result=[];start=0;depth=0
 for i,c in enumerate(s):
  if c=='(':depth+=1
  elif c==')':depth-=1
  elif c==separator and depth==0:result.append(s[start:i].strip());start=i+1
 result.append(s[start:].strip());return result
class Source:
 def __init__(self,raw):self.raw=raw;self.cache={};self.manifest=json.loads((raw/'manifest.json').read_text());assert self.manifest['source']['sha256']==SHA
 def chars(self,n):
  if n not in self.cache:
   d=json.loads((self.raw/f'pages/page-{n:03}.json').read_text());cs=[]
   for b in d['textBlocks']:
    for li,l in enumerate(b['lines']):
     for si,s in enumerate(l['spans']):
      for ci,c in enumerate(s['chars']):cs.append(dict(**c,id=f"{b['id']}-l{li:04}-s{si:04}-c{ci:04}"))
   self.cache[n]=cs
  return self.cache[n]
 def region(self,n,b):return ordered([c for c in self.chars(n) if inside(c,b)])
 def anchor(self,n,cs):return dict(pdfPage=n,printedPage=n-7,bbox=box(cs),text=text(cs),sourceCharacterIds=ids(cs))

def classification(item,cs,answer,source):
 raw=text(cs);num=item['originalNumber'];label=f'({num})';subpattern=rf'\({num}\)-([1-4])';matches=list(re.finditer(subpattern,raw));assert len(matches)==4,'classification subitems'
 choice_start=raw.rfind('<보기>');assert choice_start>matches[-1].end(),'classification choices'
 stem=raw[len(label):matches[0].start()].strip();subs=[]
 for i,m in enumerate(matches):
  end=matches[i+1].start() if i+1<len(matches) else choice_start
  t=raw[m.end():end].strip();assert t.endswith(':'),t
  slabel=m.group();subs.append(dict(id=item['id']+f':sub:{i+1}',order=i+1,originalNumberLabel=slabel,text=t,sourceText=slabel+' '+t,responseSlotId=item['id']+f':response:{i+1}',sourceCharacterIds=ids(cs[m.start():end])))
 choices=[];choicechars=cs[choice_start+4:];parts=re.split(r'(['+CIRCLED+'])',text(choicechars))
 for i in range(1,len(parts),2):choices.append(dict(label=parts[i],text=parts[i+1].strip(),sourceText=parts[i]+' '+parts[i+1].strip()))
 grouped=[split_top(x) for x in answer['text'].split('/')];assert len(grouped)==4
 aid=[];answers=[];slots=[];groups=[]
 for i,given in enumerate(grouped):
  refs=[]
  for part in given:
   id=item['id']+f':answer:{len(answers)+1}';refs.append(id);aid.append(part);answers.append(dict(id=id,text=part,sourcePage=answer['pdfPage'],bounds=answer['bbox'],sourceCharacterIds=answer['sourceCharacterIds']))
  gt=', '.join(given);slots.append(dict(id=subs[i]['responseSlotId'],order=i+1,kind='colon-response',sourcePrintedBlank=False,sourceAnchor=':',answerIds=refs,answer=dict(text=gt,parts=given,orderMatters=False)))
  groups.append(dict(subitemId=subs[i]['id'],responseSlotId=subs[i]['responseSlotId'],order=i+1,text=gt,parts=given,answerIds=refs))
 item.update(kind='classification',text=stem,segments=[dict(type='text',text=stem)],blanks=[],subitems=subs,responseSlots=slots,choices=choices,choicesLabel='<보기>',choicesLabelSourceText='<보기>',answers=answers,answer=dict(text=answer['text'],parts=aid,orderMatters=True,sourceText=label+' '+answer['text'],groupSeparator='/',groups=groups),requiredRendererFeatures=['classification-response-groups'])
 item['sourceText']=label+stem+''.join(s['sourceText'] for s in subs)+'<보기>'+''.join(c['sourceText'] for c in choices)
 assert norm(item['sourceText'])==norm(raw),'classification full wording'
 source['questionCharacterIds']=ids(cs);source['questionNativeText']=raw
 return item

def make_item(src,era,topic,record,end_y,answer,order):
 n=record['pdfPage'];num=record['number'];un=num is None;item_id=f'{PREFIX}:p{n:03}:{topic}:'+('source-1' if un else str(num));label='' if un else f'({num})'
 start=record['bbox'][1]-.4;cs=src.region(n,[88,start,511,end_y]);full=text(cs)
 # A heading following the current item belongs to the next subtopic.
 by=collections.defaultdict(list)
 for c in cs:by[round(c['origin'][1])].append(c)
 for y,row in sorted(by.items()):
  t=text(row).strip()
  if t.startswith('[') and ']' in t and y>record['bbox'][3]+2:
   cs=[c for c in cs if c['bbox'][1]<min(c['bbox'][1] for c in row)-.2];break
 raw=text(cs);features=[];number_ids=[]
 if not un:
  m=re.match(r'^\s*\('+str(num)+r'\)',raw);assert m,(era,topic,num,raw[:50]);number_ids=ids(cs[:m.end()]);body=cs[m.end():]
 else:body=cs;features.append('unnumbered-source-item')
 atext=answer['text'].strip();source=dict(sha256=SHA,revision=SHA,pdfPage=n,printedPage=n-7,questionBounds=box(cs),questionCharacterIds=[],numberCharacterIds=number_ids,questionNativeText='',answerPdfPage=answer['pdfPage'],answerPrintedPage=answer['pdfPage']-7,answerBounds=answer['bbox'],answerCharacterIds=answer['sourceCharacterIds'],answerNativeText=atext,verificationBasis='New-edition native question/answer glyph anchors and original numbered answer-panel mapping; no independent historical fact verification')
 item=dict(id=item_id,order=order,sourcePage=n,pdfPage=n,printedPage=n-7,subtopicId=topic,originalNumber=num,originalNumberLabel=label,kind='fill-in',source=source,verification=dict(status='source-verified',textVerified=True,answerPairVerified=True,ocrUsed=False,historicalCorrectnessIndependentlyChecked=False))
 if un:item.update(originalNumberPresent=False,sourceOrdinal=1)
 if era=='goryeo' and topic=='military-rule' and num==2:return classification(item,cs,answer,source)
 # An explicit printed blank is required; use its complete source glyph range.
 bodytext=text(body);blankmatch=re.search(r'\([\s,]{3,}\)',bodytext);assert blankmatch,(era,topic,num,bodytext)
 bchars=body[blankmatch.start():blankmatch.end()];placeholder=text(bchars);bid=item_id+':blank:1'
 remaining=body[:blankmatch.start()]+body[blankmatch.end():];rt=text(remaining)
 seq=any(c in CIRCLED for c in atext)
 events=[]
 if seq:
  first=next(i for i,c in enumerate(remaining) if c['c'] in CIRCLED);stemchars=remaining[:first];choicechars=remaining[first:];chunks=re.split(r'(['+CIRCLED+'])',text(choicechars))
  for i in range(1,len(chunks),2):
   val=chunks[i+1].strip();events.append(dict(label=chunks[i],text=val,sourceText=chunks[i]+' '+val))
  tokens=[]
  for m in re.finditer(r'(['+CIRCLED+r'])(\([^()]*\))?',atext):tokens.append(dict(label=m.group(1),annotation=m.group(2) or '',text=m.group(),order=len(tokens)+1))
  parts=[t['label'] for t in tokens];assert sorted(parts)==sorted(e['label'] for e in events),(era,topic,num,'sequence labels',parts,events)
  kind='sequence';sep='→' if '→' in atext else '';ordered_answer=True
 else:
  stemchars=remaining;choicechars=[];kind='fill-in';sep='';ordered_answer=',' in placeholder
  parts=split_top(atext,'/' if ',' in placeholder and '/' in atext else ',')
  tokens=[]
 stem=text(stemchars).strip();source['questionCharacterIds']=ids(stemchars);source['questionNativeText']=text(stemchars)
 if choicechars:source['choiceCharacterIds']=ids(choicechars);source['choiceNativeText']=text(choicechars)
 aid=[item_id+f':answer:{i+1}' for i in range(len(parts))]
 blank=dict(id=bid,placeholder=placeholder,answerIds=aid,bounds=box(bchars),sourceCharacterIds=ids(bchars))
 if ',' in placeholder:
  spaces=placeholder[1:-1].split(',');assert len(spaces)==len(parts) and all(re.fullmatch(r' +',s) for s in spaces)
  blank.update(partSeparator=',',parts=[dict(id=bid+f':part:{i+1}',order=i+1,placeholder=s,answerIds=[aid[i]]) for i,s in enumerate(spaces)]);features.append('partitioned-source-blank')
 answerobj=dict(text=atext,parts=parts,orderMatters=ordered_answer,partOrderPreserved=True,sourceText=(label+' ' if label else '')+atext)
 if kind=='sequence':
  answerobj['sequenceSeparator']=sep
  if any(t['annotation'] for t in tokens):answerobj.update(sequenceTokens=tokens,responseText=sep.join(parts));features.append('annotated-source-sequence')
 elif ',' in placeholder and '/' in atext:answerobj['sourceSeparator']='/'
 segments=[dict(type='text',text=stem+' '),dict(type='blank',id=bid,placeholder=placeholder,answerIds=aid)]
 item.update(kind=kind,text=stem,sourceText=(label+' ' if label else '')+stem+' '+placeholder+(' '+''.join(e['sourceText'] for e in events) if events else ''),segments=segments,blanks=[blank],answer=answerobj,answers=[dict(id=id,text=part,order=i+1,sourcePage=answer['pdfPage'],bounds=answer['bbox'],sourceCharacterIds=answer['sourceCharacterIds']) for i,(id,part) in enumerate(zip(aid,parts))])
 if events:item['events']=events
 if features:item['requiredRendererFeatures']=features
 return item

def main():
 p=argparse.ArgumentParser(description=__doc__)
 for flag in ['raw-root','question-labels','page-review','answer-panels','review-map','output']:p.add_argument('--'+flag,type=Path,required=True)
 a=p.parse_args();assert 'private-data' in a.output.resolve().parts
 src=Source(a.raw_root);questions=json.loads(a.question_labels.read_text());page_review=json.loads(a.page_review.read_text());panels={p['pdfPage']:p['panels'] for p in json.loads(a.answer_panels.read_text())};config=json.loads(a.review_map.read_text());cuts={r['pdfPage']:r['answerStartY'] for r in page_review}
 # Original unnumbered sequence: explicit source blank and choices, not a new question number.
 qs=questions['opening'];unnumbered=dict(pdfPage=101,number=None,bbox=[93,495.0,499,512.1]);idx=next(i for i,q in enumerate(qs) if q['pdfPage']==101);qs.insert(idx,unnumbered)
 ca=src.region(104,[88,290,510,321]);i=next(i for i,c in enumerate(ca) if c['c'] in CIRCLED);ca=ca[i:];unnumbered_answer=src.anchor(104,ca)
 results=[]
 for era,meta in config.items():
  records=questions[era];cursor=0;items=[];topics=[]
  for topic in meta['topics']:
   count=topic['count'];rs=records[cursor:cursor+count];assert len(rs)==count
   expected=[None] if topic['id']=='donghak-sequence' else list(range(1,count+1));assert [r['number'] for r in rs]==expected,(era,topic['id'],'question numbering')
   if topic['answerPanel'] is None:answer_map={None:unnumbered_answer}
   else:
    entries=panels[topic['answerPage']][topic['answerPanel']]['answers'];assert len(entries)==count and len({e['number'] for e in entries})==count
    answer_map={e['number']:dict(**e,pdfPage=topic['answerPage']) for e in entries};assert sorted(answer_map)==expected
   for j,r in enumerate(rs):
    nxt=next((q for q in records[cursor+j+1:] if q['pdfPage']==r['pdfPage']),None);end=nxt['bbox'][1]-.3 if nxt else cuts[r['pdfPage']]-3
    if r['number'] is None:end=595
    items.append(make_item(src,era,topic['id'],r,end,answer_map[r['number']],len(items)+1))
   topics.append(dict(id=topic['id'],title=topic['title'],sourcePage=rs[0]['pdfPage'],itemCount=count));cursor+=count
  assert cursor==len(records),(era,cursor,len(records))
  pdfpages=sorted({i['pdfPage'] for i in items}|{i['source']['answerPdfPage'] for i in items});page_data={p['pdfPage']:p for p in src.manifest['pages']}
  q=dict(schemaVersion='hanq-source-quiz/1',id=era,title=meta['title'],source=dict(sha256=SHA,revision=SHA,pdfPages=pdfpages,printedPages=[n-7 for n in pdfpages],coordinateSystem='PDF points; top-left origin; 1-based PDF pages',pageDimensions={str(n):[page_data[n]['width'],page_data[n]['height']] for n in pdfpages},sourceRenderSha256={str(n):page_data[n]['imageSha256'] for n in pdfpages},nativeExtraction='PyMuPDF1.26.6 rawdict glyph geometry and reviewed original answer-panel numbering'),access=dict(audience='authenticated-members',publicAssetsAllowed=False,uploaded=False,deployed=False),subtopics=topics,items=items)
  out=a.output/f'{era}.json';out.parent.mkdir(exist_ok=True,parents=True);out.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n');results.append(dict(id=era,items=len(items),sha256=hashlib.sha256(out.read_bytes()).hexdigest()));print(results[-1])
 print('TOTAL',sum(x['items'] for x in results))
if __name__=='__main__':main()
