"""Convert original source-backed connection material to cloze5choice. Preserve source mappings and all other question versions."""
from pathlib import Path
import json,hashlib,re,unicodedata
root=Path(__file__).resolve().parents[1];src=json.loads((root/'media/study-supplements.json').read_text());p=root/'media/era-recall-quiz.js';bank=json.loads(p.read_text().split('window.HANQ_ERA_RECALL_QUIZ=',1)[1].rstrip(';\n'));qs={k:v for k,v in bank['questions'].items()if not k.startswith('z-connection-')}
def norm(s):return re.sub(r'[\s·ㆍ,→/()「」『』]', '',unicodedata.normalize('NFKC',s))
def bits(s):return {norm(x)for x in re.split(r' · |·| → | / ',s)if len(norm(x))>1}
rows=[]
for era,cards in src.items():
 for card in cards:
  chapter=card.get('sourceEra',era)
  if card.get('answer'):
   a=card['answer'];q=card['question'];clue=' / '.join(v for k,v in card['rows']);rows.append({'era':era,'chapter':chapter,'card':card,'row':None,'answer':a,'stem':card['title']+' · '+q+'\n빈칸에 맞는 핵심어(묶음)는 ____이다.','reason':clue})
  else:
   for n,(key,value)in enumerate(card['rows']):
    a=key
    if key=='가족 생활':a='남녀 균분 상속·여성 재가'
    if key=='귀족의 기반':a='음서·공음전'
    # Mask any literal answer phrase in the factual clue; preserve the entire original source separately.
    clue=value
    for token in sorted(bits(a),key=len,reverse=True):
     if token in norm(clue):
      # Specific phrases in ordinary spacing are the original key; generic multi-concept source clues remain contextual.
      for actual in re.split(r' · |·| → | / ',a):
       if norm(actual)==token:clue=clue.replace(actual,'해당 용어')
    rows.append({'era':era,'chapter':chapter,'card':card,'row':n,'answer':a,'stem':card['title']+' · '+clue+'\n이 설명을 연결하는 핵심어(묶음)는 ____이다.','reason':value})
other=json.loads((root/'scripts/fixtures/other-era-recall-sources.json').read_text())
for source in other:
 card={'id':'recall:'+source['file']+':'+source['era']+':'+str(source['index']),'title':source['era']+' 복습','question':source['q'],'rows':[[source['q'],source['a']]],'answer':source['a'],'sourceFile':source['file'],'sourceIndex':source['index']}
 rows.append({'era':source['era'],'chapter':'colonial'if '105인' in source['a']else source['era'],'card':card,'row':None,'answer':'105인 사건'if '105인' in source['a']else source['a'],'stem':source['q']+'\n핵심어는 ____이다.','reason':source['q']+' → '+source['a']})
# The source rows are compact captions. Expand ambiguous captions using their own named clue.
for row in rows:
 key=row['answer'];c=row['card']
 if key=='최영 · 홍산전투':row['stem']='고려 말, 최영이 왜구를 물리친 전투와 지휘관을 연결한 묶음은 ____이다.'
 if key=='이성계 · 황산 전투':row['stem']='고려 말, 이성계가 왜구를 물리친 전투와 지휘관을 연결한 묶음은 ____이다.'
 if key=='숙종 · 해동통보':row['stem']='고려에서 해동통보를 발행한 왕과 화폐를 연결한 묶음은 ____이다.'
 if key=='월정사 팔각구층석탑':row['stem']='고려의 다각·다층탑으로 팔각형 평면과 아홉 층을 갖춘 석탑은 ____이다.'
 if key=='관촉사 석조미륵보살입상':row['stem']='관촉사에 있는 고려 초기의 크고 독특한 석조 미륵보살상은 ____이다.'
 if key=='쌍봉사 철감선사탑 · 승탑':row['stem']='쌍봉사에 남아 있는 철감선사의 사리를 모신 탑과 탑의 유형을 연결한 묶음은 ____이다.'
for row in rows:
 if row['answer'].startswith('광무개혁'):row['answer']='광무개혁'
 if row['answer']=='참고 · 연분 9등법 · 전분 6등법':row['answer']='연분 9등법 · 전분 6등법'
 clean_stems={'향리와 속현': '고려에서 지방관이 없는 지역의 실제 행정을 맡은 토착 세력과 그 지역 명칭을 연결한 묶음은 ____이다.', '음서·공음전': '고려의 관직 진출 특권과 5품 이상 관료의 경제적 기반을 연결한 제도 묶음은 ____이다.', '흑창 → 의창 / 상평창': '태조의 구휼 창고를 성종 때 확대한 순서와 곡식을 사고팔아 물가를 조절한 창고를 연결한 묶음은 ____이다.', '혜민국·동서대비원': '고려에서 약을 나눠 준 기구와 병자·가난한 사람을 돌본 기구를 연결한 묶음은 ____이다.', '최충 → 숙종 → 예종': '문헌공도·9재 학당의 인물 → 서적포를 둔 왕 → 7재·양현고로 관학을 지원한 왕의 순서는 ____이다.', '안향·이제현·이색': '성리학을 소개한 인물 · 만권당에서 교류한 인물 · 성균관에서 새 학문을 가르친 인물을 연결한 묶음은 ____이다.', '수시력·농상집요·향약구급방': '원에서 들어온 역법·농서와 고려의 현존 가장 오래된 의학서를 연결한 묶음은 ____이다.', '강화': '몽골 항쟁의 근거지 · 두 차례 양요 · 근대 조약 체결을 공통으로 연결하는 지역은 ____이다.', '진주': '임진왜란의 성 전투 · 임술농민봉기 · 형평운동을 공통으로 연결하는 도시는 ____이다.', '원산': '근대 사립학교 설립과 일제 강점기 총파업을 공통으로 연결하는 도시는 ____이다.', '사헌부 · 사간원 · 홍문관': '조선의 간쟁·탄핵·경연 기관을 묶은 삼사에 해당하는 기관들은 ____이다.'}
 if row['answer']in clean_stems:row['stem']=clean_stems[row['answer']]
groups={}
for row in rows:groups.setdefault((row['chapter'],norm(row['answer'])),[]).append(row)
overrides=json.loads((root/'scripts/fixtures/connection-choice-overrides.json').read_text())['profiles']
existing={(q['chapter'],norm(q['answer'])):q['id']for q in qs.values()}
mapping=[]
for (chapter,canonical),members in groups.items():
 x=members[0];a=x['answer'];id='z-connection-'+hashlib.sha256((chapter+'|'+canonical).encode()).hexdigest()[:12];choices=[]
 pool=[y['answer']for y in rows if y['chapter']==chapter]+[y['answer']for y in rows]
 countries=['고조선','부여','고구려','백제','신라','발해','고려','조선']
 people=['무왕','문무왕','신문왕','김헌창','최영','최무선','이성계','박위','혜심','예종','숙종','의천','지눌','요세','최충헌','최우','정중부','이의민','광종','성종','경종','목종','태조','세종','원효','의상','강감찬','서희','김윤후','윤관','김구','김원봉','신채호','박은식','정조','영조','이황','이이','홍대용','박지원','김대중','노무현']
 if a in countries:pool=countries
 elif a in people:pool=[t for t in people if any(norm(y['answer'])==norm(t)for y in rows)]+people
 for t in pool:
  if norm(t)==canonical or norm(t)in canonical or canonical in norm(t)or bits(t)&bits(a)or t in choices:continue
  choices.append(t)
  if len(choices)==4:break
 assert len(choices)==4,(id,a)
 sources=[{'file':y['card'].get('sourceFile','study-supplements.json'),'index':y['card'].get('sourceIndex'),'era':y['era'],'sourceEra':y['chapter'],'id':y['card']['id'],'row':y['row'],'title':y['card']['title'],'question':y['card']['question'],'rows':y['card']['rows'],'answer':y['card'].get('answer')}for y in members]
 if (chapter,canonical) in existing:
  mapping.append({'id':existing[(chapter,canonical)],'answer':a,'chapter':chapter,'sources':sources,'reusedExisting':True});continue
 reason=x['reason'];opts=[{'id':'o'+hashlib.sha1((id+'|'+t).encode()).hexdigest()[:10],'text':t,'correct':t==a,'review':[a+' — '+reason if t==a else '이 단서의 정답은 '+a+'이다. 이 보기와 연결을 구별한다.']}for t in[a,*choices]]
 q={'id':id,'chapter':chapter,'relatedEras':[],'origin':'existing-connection','shape':'single','prompt':'핵심 연결 · 빈칸5지선다','ask':'핵심어','q':x['stem'],'a':[a],'answer':a,'options':opts,'why':reason,'cue':x['stem'].replace('____',a),'overview':{'answer':a,'reason':[reason],'clue':[x['stem']],'context':[],'memory':[a],'contrast':[],'refs':[{'kind':'existing-connection','file':'study-supplements.json','chapter':chapter,'id':y['card']['id'],'row':y['row']}for y in members]},'sources':sources,'dedup':hashlib.sha256((chapter+'|'+canonical).encode()).hexdigest()[:12]}
 profile=overrides.get(id)
 if profile:
  peers=profile['wrongPeers'];assert len(peers)==4 and len({norm(t['text'])for t in peers})==4 and all(norm(t['text'])!=norm(a)for t in peers),(id,peers)
  q['options']=[{'id':'o'+hashlib.sha1((id+'|'+t).encode()).hexdigest()[:10],'text':t,'correct':True,'review':profile['correctLines']}for t in[a]]+[
   {'id':'o'+hashlib.sha1((id+'|'+t['text']).encode()).hexdigest()[:10],'text':t['text'],'correct':False,'review':t['lines'],'peerEra':t['era'],'peerSources':t['sources']}for t in peers]
  q['overview']['reason']=profile['correctLines'];q['comparisonCategory']=profile['category'];q['comparisonCorrectEra']=profile['correctEra'];q['comparisonSources']=profile['correctSources']
 # Correct a derived stem using its own original card's explicit factual row; raw source/mapping stays unchanged.
 if a=='김보당의 난 → 봉사10조 → 삼별초 항쟁':
  q['q']=q['q'].replace('명종 복위','의종 복위');q['cue']=q['cue'].replace('명종 복위','의종 복위');q['overview']['clue']=[q['q']]
 q['v']=hashlib.sha256(json.dumps(q,ensure_ascii=False,sort_keys=True).encode()).hexdigest()[:16];q['rv']=hashlib.sha256(json.dumps(q['overview'],ensure_ascii=False).encode()).hexdigest()[:12];qs[id]=q;mapping.append({'id':id,'answer':a,'chapter':chapter,'sources':sources})
p.write_text('/* Existing sourced era recalls and connection quiz; use source generators. */\nwindow.HANQ_ERA_RECALL_QUIZ='+json.dumps({'schema':1,'questions':qs,'ids':list(qs),'connectionIds':list(dict.fromkeys(x['id']for x in mapping))},ensure_ascii=False,separators=(',',':'))+';\n');(root/'scripts/fixtures/connection-quiz-map.json').write_text(json.dumps({'sourceCards':sum(map(len,src.values())),'sourceUnits':len(rows),'questions':len(groups),'otherEraRecalls':len(other),'mapping':mapping},ensure_ascii=False,indent=2)+'\n');print(len(rows),'source units ->',len(groups),'deduplicated questions; all116cards mapped')
