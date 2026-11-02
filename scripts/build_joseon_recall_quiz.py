from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parents[1];src=json.loads((root/'scripts/fixtures/joseon-recall-sources.json').read_text())
kings=['연산군','중종','인종','명종','선조','광해군','인조','효종','숙종','경종','영조','정조','철종','세조','단종','성종','세종']
def king(a):return [x for x in kings if x!=a][:4]
rows=[
('중종과 명종 사이에 짧게 재위한 조선의12대 왕은 ____이다.','인종',king('인종')),
('1608년 광해군 때 대동법을 처음 시행한 지역은 ____이다.','경기',['평안도','함경도','경상도','황해도']),
('인조 때 전세를 풍흉과 관계없이 일정하게 정한 법은 ____이다.','영정법',['균역법','대동법','직전법','과전법']),
('사화 순서 무오·갑자·기묘·을사에서 기묘사화 때의 왕은 ____이다.','중종',king('중종')),
('1453년 이징옥의 난이 일어났을 때 재위한 왕은 ____이다.','단종',king('단종')),
('세조의 직전법은 ____에게만 수조권을 주었다.','현직 관리',['전직 관리','모든 농민','모든 군인','시전 상인']),
('임진왜란 중 훈련도감을 설치한 조선 왕은 ____이다.','선조',king('선조')),
('대동법 시행 뒤 관청에 필요한 물품을 조달한 상인은 ____이다.','공인',['송상','경강상인','보부상','역관']),
('병자호란 때 광교산에서 청군을 물리친 장수는 ____이다.','김준룡',['이순신','권율','김시민','강홍립']),
('무오·갑자·기묘·을사 중 을사사화가 일어난 때의 왕은 ____이다.','명종',king('명종')),
('포수·사수·살수의 삼수병으로 이루어진 군대는 ____이다.','훈련도감',['어영청','총융청','수어청','금위영']),
('대동법으로 거둔 재원을 받아 관청의 물품을 납품한 사람은 ____이다.','공인',['역관','보부상','송상','덕대']),
('조선의 삼사 중 옥당이라고도 불린 기관은 ____이다.','홍문관',['사헌부','사간원','승정원','의금부']),
('현직 관리만 수조권을 받는 직전법을 실시한 왕은 ____이다.','세조',king('세조')),
('연산군 때 조의제문이 빌미가 된 사화는 ____이다.','무오사화',['갑자사화','기묘사화','을사사화','기축옥사']),
('중종 때 소학·현량과·위훈 삭제를 주장하며 개혁한 인물은 ____이다.','조광조',['김종직','이황','이이','송시열']),
('세종 때 북방을 개척한 인물:4군은 최윤덕,6진은 ____이다.','김종서',['최윤덕','이종무','강홍립','신류']),
('과전법 → 직전법 → 성종의 ____ → 명종 때 직전법 폐지.','관수관급제',['대동법','영정법','균역법','공법']),
('효종 때 나선 정벌에 파견한 부대의 주된 무기는 ____이었다.','조총',['활','화차','거북선','총통']),
('정조 때 육의전을 제외한 시전의 금난전권을 폐지한 정책은 ____이다.','신해통공',['균역법','대동법','영정법','관수관급제']),
('균역법으로 줄어든 군포 수입을 토지에서 보충한 부담은 ____이다.','결작',['군포','공납','환곡','선무군관포']),
('철종 때 임술농민봉기 이후 삼정의 폐단을 바로잡으려고 설치한 기구는 ____이다.','삼정이정청',['비변사','선혜청','규장각','의정부']),
('인삼 거래로 알려진 송상의 근거지는 ____이다.','개성',['한양','평양','의주','동래']),
('숙종과 영조 사이에 재위한 조선의20대 왕은 ____이다.','경종',king('경종')),
('영정법은 인조 때 전세,균역법은 영조 때 ____의 부담을 줄인 제도이다.','군포',['전세','공납','환곡','결작']),
('균역법의 수입 감소를 보충하려고 토지에 부과한 것은 ____이다.','결작',['공납','환곡','군포','선무군관포']),
('100리 척을 사용한 동국지도를 만든 사람은 ____이다.','정상기',['김정호','이중환','정약용','홍대용']),
('『의산문답』에서 지전설을 주장한 조선 후기 실학자는 ____이다.','홍대용',['박지원','박제가','이익','정약용']),
('서얼 출신을 규장각 검서관으로 기용한 조선 왕은 ____이다.','정조',king('정조')),
('숙종 때 청과 국경을 정한 비석은 ____이다.','백두산정계비',['북한산비','창녕비','황초령비','마운령비']),
('육의전 이외 시전 상인의 금난전권을 없앤 정조의 정책은 ____이다.','신해통공',['영정법','균역법','대동법','공법']),
('1862년 임술농민봉기 뒤 철종이 설치한 기구는 ____이다.','삼정이정청',['선혜청','비변사','규장각','승정원'])]
assert len(rows)==len(src)==32
qs={};mapping=[]
for i,((q,a,d),source) in enumerate(zip(rows,src),1):
 id=f'z-joseon-recall-{i:02}';assert len(set([a,*d]))==5
 opts=[{'id':'o'+hashlib.sha1((id+'|'+t).encode()).hexdigest()[:10],'text':t,'correct':t==a,'review':[f'{source["q"]} → {source["a"]}' if t==a else f'이 단서의 정답은 {a}입니다. {t}는 이 문항의 답이 아니에요.']} for t in [a,*d]]
 x={'id':id,'chapter':source['era'],'relatedEras':[],'origin':'existing-recall','shape':'single','prompt':'기존 조선 복습 · 핵심어 빈칸','ask':'핵심어','q':q,'a':[a],'answer':a,'options':opts,'why':f'{source["q"]} → {source["a"]}','cue':q.replace('____',a),'overview':{'answer':a,'reason':[f'{source["q"]} → {source["a"]}'],'clue':[q],'context':[],'memory':[a],'contrast':[],'refs':[{'kind':'existing-recall','file':source['file'],'chapter':source['era'],'index':source['index']}]},'sources':[source],'dedup':hashlib.sha256((q+'|'+a).encode()).hexdigest()[:12]}
 x['v']=hashlib.sha256(json.dumps(x,ensure_ascii=False,sort_keys=True).encode()).hexdigest()[:16];x['rv']=hashlib.sha256(json.dumps(x['overview'],ensure_ascii=False).encode()).hexdigest()[:12];qs[id]=x;mapping.append({'id':id,'source':source,'answer':a})
existing=root/'media/era-recall-quiz.js'
if existing.exists():
 old=json.loads(existing.read_text().split('window.HANQ_ERA_RECALL_QUIZ=',1)[1].rstrip(';\n'))
 qs.update({k:v for k,v in old['questions'].items()if not k.startswith('z-joseon-recall-')})
bank={'schema':1,'questions':qs,'ids':list(qs),'connectionIds':old.get('connectionIds',[])};(root/'media/era-recall-quiz.js').write_text('/* Existing sourced era recalls and connection quiz; use source generators. */\nwindow.HANQ_ERA_RECALL_QUIZ='+json.dumps(bank,ensure_ascii=False,separators=(',',':'))+';\n');(root/'scripts/fixtures/joseon-recall-map.json').write_text(json.dumps(mapping,ensure_ascii=False,indent=2));print('32source recalls ->32cloze questions')
