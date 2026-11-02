from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parents[1]
src=json.loads((root/'scripts/fixtures/goryeo-recall-sources.json').read_text())
rows=[
('청연각·보문각을 두고 관학을 키운 고려 왕은 ____이다.','예종',['숙종','성종','광종','공민왕']),
('교정도감 설치와 봉사10조를 연결하는 무신 집권자는 ____이다.','최충헌',['최우','정중부','이의민','최의']),
('교학과 선의 수행을 함께 닦는 교관겸수를 내세운 승려는 ____이다.','의천',['지눌','원효','의상','혜초']),
('정혜쌍수·돈오점수를 내세운 고려 승려는 ____이다.','지눌',['의천','원효','의상','혜초']),
('소를 이용한 깊이갈이가 널리 퍼진 시대는 ____이다.','고려',['구석기','신석기','고조선','삼국']),
('직지심체요절을 금속활자로 찍은 절은 ____이다.','청주 흥덕사',['합천 해인사','순천 송광사','경주 불국사','안동 봉정사']),
('광종 다음 왕으로 시정 전시과를 시작한 고려5대 왕은 ____이다.','경종',['성종','목종','문종','예종']),
('이자겸의 난(1126) 뒤1135년 서경 천도 운동을 이끈 인물은 ____이다.','묘청',['김부식','이자겸','정중부','윤관']),
('김윤후가 몽골군을 막아 낸 두 곳은 ____이다.','처인성·충주성',['귀주·강동6주','진포·황산','공산·고창','안시성·살수']),
('1388위화도 회군 → 1391____ → 1392조선 건국 순서로 이어진다.','과전법',['전민변정도감','경정 전시과','영정법','대동법']),
('인사권을 행사하는 정방을 설치한 무신 집권자는 ____이다.','최우',['최충헌','정중부','이의민','최의']),
('무신 정권의 최고 권력 기구인 교정도감을 설치한 인물은 ____이다.','최충헌',['최우','정중부','이의민','최의']),
('진포 대첩에서 화포를 사용한 고려 인물은 ____이다.','최무선',['강감찬','서희','윤관','김윤후']),
('서희가 거란과의 담판으로 확보한 지역은 ____이다.','강동6주',['동북9성','쌍성총관부','탐라','요동']),
('거란군을 물리친 귀주 대첩의 지휘관은 ____이다.','강감찬',['서희','윤관','김윤후','최무선']),
('노비안검법으로 원래 양인이던 노비를 풀어 준 고려 왕은 ____이다.','광종',['태조','성종','숙종','공민왕']),
('청주 흥덕사에서 간행한 현존 가장 오래된 금속활자본은 ____이다.','직지심체요절',['팔만대장경','무구정광대다라니경','삼국사기','삼국유사'])]
assert len(src)==len(rows)==17
p=root/'media/era-recall-quiz.js';bank=json.loads(p.read_text().split('window.HANQ_ERA_RECALL_QUIZ=',1)[1].rstrip(';\n'));qs={k:v for k,v in bank['questions'].items()if not k.startswith('z-goryeo-recall-')};mapping=[]
for i,((q,a,d),source)in enumerate(zip(rows,src),1):
 id=f'z-goryeo-recall-{i:02}';assert len(set([a,*d]))==5
 opts=[{'id':'o'+hashlib.sha1((id+'|'+t).encode()).hexdigest()[:10],'text':t,'correct':t==a,'review':[f'{source["q"]} → {source["a"]}'if t==a else f'이 단서의 정답은 {a}입니다. 이 보기와 구별해요.']}for t in[a,*d]]
 x={'id':id,'chapter':'goryeo','relatedEras':[],'origin':'existing-recall','shape':'single','prompt':'기존 고려 복습 · 핵심어 빈칸','ask':'핵심어','q':q,'a':[a],'answer':a,'options':opts,'why':f'{source["q"]} → {source["a"]}','cue':q.replace('____',a),'overview':{'answer':a,'reason':[f'{source["q"]} → {source["a"]}'],'clue':[q],'context':[],'memory':[a],'contrast':[],'refs':[{'kind':'existing-recall','file':source['file'],'chapter':'goryeo','index':source['index']}]},'sources':[source],'dedup':hashlib.sha256((q+'|'+a).encode()).hexdigest()[:12]}
 x['v']=hashlib.sha256(json.dumps(x,ensure_ascii=False,sort_keys=True).encode()).hexdigest()[:16];x['rv']=hashlib.sha256(json.dumps(x['overview'],ensure_ascii=False).encode()).hexdigest()[:12];qs[id]=x;mapping.append({'id':id,'source':source,'answer':a})
bank={'schema':1,'questions':qs,'ids':list(qs),'connectionIds':bank.get('connectionIds',[])};p.write_text('/* Existing sourced era recalls and connection quiz; use source generators. */\nwindow.HANQ_ERA_RECALL_QUIZ='+json.dumps(bank,ensure_ascii=False,separators=(',',':'))+';\n');(root/'scripts/fixtures/goryeo-recall-map.json').write_text(json.dumps(mapping,ensure_ascii=False,indent=2));print('17original recalls ->17cloze5choice; existing recalls preserved')
