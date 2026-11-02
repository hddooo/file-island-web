# -*- coding: utf-8 -*-
"""현대사 웹툰(media/modern-comic.html)을 강의 흐름(다섯 흐름)에 맞춘 한 페이지 학습으로 다시 엮는다.

  python3 scripts/build_modern_comic.py

- 기존 파일의 <head>(스타일)와 </main> 뒤 스크립트는 그대로 두고, 본문만 아래 SCENES 정의로 다시 쓴다. 여러 번 실행해도 결과가 같다.
- 장면 18개의 id·순서·제목·꼭 기억 단서는 기존 웹툰 그대로다(기존 순서가 강의 순서와 같아 옮기지 않았다).
- 그림: media/modern-panels.png(1024×1536, 12칸, 행 높이·열 너비가 서로 다름)은 바이트 그대로 둔다. 조정자가 읽기 전용으로 잰 칸 사각형을
  SVG viewBox로 보여 주어 칸 전체가 원래 비율로, 이웃 칸 없이, 확대·잘라 내기 없이 보인다. 그림 파일이 바뀌면(해시·크기 다름) 멈춘다.
  예전에 칸 일부를 확대해 쓰던 덧붙인 장면 6개는 같은 칸 전체를 다시 쓰고, 그렇다고 화면에 밝힌다.
- 흐름 머리와 ‘이 부분에서 외울 것’ 카드는 media/lecture-flow-modern.js의 /*FLOW-JSON*/ … /*END-FLOW-JSON*/를 읽는다.
- 말풍선은 그림 밖(아래)에 둔다. 기록에 이름이 없는 화자는 ‘설명용 인물’로 밝힌다. 스타일은 body.m-story 안에서만 쓴다.
- 출력: media/modern-comic.html, docs/modern-comic-map.json. 시간·난수·개인 경로를 쓰지 않는다. 근거·정정 기록은 docs/modern-scene-sources.md.
"""
import hashlib, html, json, os, re, struct

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA = os.path.join(ROOT, 'media')
FILE = 'modern-comic.html'
e = lambda s: html.escape(s, quote=True)

# 원본 그림판과 칸 사각형(읽기 전용 측정값: x, y, w, h). 흰 가로줄 359–363 · 750–755 · 1136–1141, 흰 세로줄 336–341 · 682–687.
SHEET, SHEET_SHA, SHEET_W, SHEET_H = 'modern-panels.png', '30a8ed4d366edd53ee1c9d53e8918295c62ec1c6a0b442654e871aaf4a1beaa9', 1024, 1536
PANELS = {1: (0, 0, 336, 359), 2: (342, 0, 340, 359), 3: (688, 0, 336, 359),
          4: (0, 364, 336, 386), 5: (342, 364, 340, 386), 6: (688, 364, 336, 386),
          7: (0, 756, 336, 380), 8: (342, 756, 340, 380), 9: (688, 756, 336, 380),
          10: (0, 1142, 336, 394), 11: (342, 1142, 340, 394), 12: (688, 1142, 336, 394)}

# 기록에 이름이 남지 않은 설명용 인물. 그 밖의 화자(여운형·김구·김규식)는 실제 인물.
GENERIC = {'시민', '유권자', '의원', '농민', '어머니', '아들', '군인', '가족', '기자', '학생', '노동자', '동료', '관리', '이산가족', '선생'}

# 장면 정의(화면 순서 = 기존 순서). panel: 원본 칸 번호. orig: 원래 장면 번호(data-orig) · added: 뒤에 덧붙인 장면(data-added="density") · reuse: 앞 장면 칸을 다시 씀
#  when: 시기·사건 줄 · steps: [(이름, cause|dev|res|item, 문장)] · key: 기존 꼭 기억 단서(글자 그대로) · stress: 강의가 직접 짚은 말(근거 행은 src·문서)
#  more: [(제목, 문장)] 접힌 보충(강의가 가끔·가볍게로 낮춘 범위 또는 흐름 보충) · next: (다음 장면으로 잇는 말, 흐름이 바뀌면 True) · src: 강의 행
SCENES = [
    dict(id='scene-1', orig=1, panel=1, label='1945 · 광복', title='기쁨 다음의 과제', when='1945 광복 · 조선건국준비위원회 · 미군정 · 모스크바 3국 외상회의',
         alt='기쁨 다음의 과제 장면', a=('시민', '드디어 광복입니다! 이제 나라를 세워야죠.'), b=('여운형', '건국준비위원회로 새 질서를 준비합시다.'),
         steps=[('배경', 'cause', '1945년 8월 15일 광복을 맞자, 여운형은 미리 만든 조선 건국 동맹을 바탕으로 조선건국준비위원회(건준)를 꾸려 치안을 맡았다.'),
                ('전개', 'dev', '건준은 조선 인민 공화국을 선포했지만, 남쪽에 들어온 미군정은 조선 인민 공화국도 충칭의 대한민국 임시정부도 정부로 인정하지 않았다.'),
                ('이어', 'item', '광복 4개월 뒤 모스크바 3국 외상회의에서 최고 5년간의 신탁 통치와 미소공동위원회 설치가 나오자, 신탁 통치를 두고 좌익은 찬성, 우익은 반대하며 대립했다.')],
         key='건준 → 모스크바 3국 외상회의·미소공동위원회', stress='광복부터 정부 수립까지는 전체 큰 흐름을 아는 것이 중요하다고 짚었어요.',
         more=[('흐름 보충 · 광복 직후의 정당', '광복 직후 우익은 한국민주당(1945년 9월 창당), 좌익은 조선 공산당 등을 바로 만들었다.')],
         next=('광복은 끝이 아니라, 어떤 나라를 세울지의 시작이었다.', False), src='1817–1832 · 1857–1859'),
    dict(id='scene-2', orig=2, panel=2, label='1946–1948 · 분단 위기', title='서로 다른 길 앞에서', when='1946 정읍 발언 · 좌우합작 운동 · UN 결정 → 남북 협상 · 1948 제주 4·3 사건',
         alt='서로 다른 길 앞에서 장면', a=('김구', '남쪽만의 선거라면 분단이 굳어질 수 있어요.'), b=('김규식', '남북 협상에 가봅시다.'),
         steps=[('배경', 'cause', '미소공동위원회가 성과 없이 멈추자 1946년 6월 이승만은 정읍에서 남쪽만의 단독 정부 수립을 주장했다.'),
                ('전개', 'dev', '분단을 걱정한 여운형·김규식은 좌우합작 운동을 벌여 좌우합작 7원칙을 냈지만, 미소공동위원회가 결렬되고 1947년 여운형이 암살되며 무산되었다.'),
                ('결과', 'res', 'UN이 선거가 가능한 지역에서만 총선거를 하기로 하자, 김구·김규식은 평양에 가서 남북 협상을 벌였지만 단독 선거를 막지 못했다.'),
                ('비극', 'item', '남쪽만의 선거에 반대한 무장대와 토벌대가 충돌하며 많은 제주도민이 희생된 제주 4·3 사건이 일어났다.')],
         key='좌우합작·남북협상 / 제주 4·3 사건', stress='제주 4·3 사건은 요즘 단독 문제로 종종 나온다고 짚었어요.',
         more=[('흐름 보충 · 김구의 성명', '김구는 “삼천만 동포에게 읍고함”이라는 성명으로 단독 정부 수립에 협력하지 않겠다고 밝혔다.'),
               ('흐름 보충 · 제주 4·3 사건의 진상 규명', '2000년 김대중 정부 때 진상 규명과 희생자 명예 회복을 위한 특별법이 만들어졌고, 2003년 노무현 정부가 진상 보고서를 내고 공식 사과했다.')],
         next=('길이 갈린 가운데 남쪽에서는 첫 보통선거가 치러졌다.', False), src='1832–1852'),
    dict(id='scene-3', orig=3, panel=3, label='1948 · 정부 수립', title='첫 보통선거', when='1948 5·10 총선거 → 제헌국회 → 8월 15일 대한민국 정부 수립',
         alt='첫 보통선거 장면', a=('유권자', '5·10 총선거로 제헌국회를 뽑습니다.'), b=('의원', '헌법을 만들고 정부를 세웁시다.'),
         steps=[('배경', 'cause', 'UN의 결정에 따라 사실상 남쪽만의 총선거가 치러지게 되었다.'),
                ('전개', 'dev', '1948년 5·10 총선거는 우리나라 첫 보통선거로, 헌법을 만들 국회의원을 뽑아 제헌국회를 꾸렸다.'),
                ('결과', 'res', '제헌국회가 헌법을 만들고 나라 이름을 대한민국으로 정했으며, 1948년 8월 15일 대한민국 정부가 수립되었다. 초대 대통령은 이승만이다.'),
                ('경제', 'item', '미군정 시기에 동양척식주식회사 등 일본인이 가졌던 재산은 신한공사로 넘어갔다.')],
         key='5·10 총선거 → 제헌국회 → 대한민국 정부 수립', stress='이 시기의 경제는 신한공사 하나만 알면 된다고 짚었어요.',
         next=('정부를 세운 제헌국회 앞에는 두 가지 큰 과제가 있었다.', False), src='1852–1861'),
    dict(id='constituent-tasks', added=True, panel=3, reuse=True, label='1948–1950 · 제헌국회의 두 과제', title='친일 청산과 농지 개혁',
         when='반민족 행위 처벌법 · 반민특위 · 농지개혁법 · 모두 6·25 전쟁 전 · 1948년 10월 여수·순천 10·19 사건',
         alt='첫 보통선거 장면과 같은 그림(칸 전체 다시 사용 · 국회 앞에 모인 사람들)', a=('의원', '반민족 행위 처벌법으로 반민특위를 만들었소.'), b=('농민', '농지개혁법은 유상 매수·유상 분배라지요.'),
         art_note='그림: ‘첫 보통선거’ 장면과 같은 칸 전체를 확대하지 않고 다시 썼어요.',
         steps=[('배경', 'cause', '정부를 세운 제헌국회에는 친일파 청산과 농지 개혁이라는 두 숙제가 있었다.'),
                ('전개', 'dev', '반민족 행위 처벌법을 만들고 반민특위를 꾸려 친일 혐의자를 체포했지만, 국회 프락치 사건과 반민특위 습격 같은 방해 속에 반민특위는 해체되었다.'),
                ('함께', 'item', '농지개혁법으로 집마다 가질 수 있는 농지의 상한을 정하고, 넘는 땅은 정부가 유상으로 사들여 농민에게 유상으로 나눴다.'),
                ('정부 수립 뒤', 'item', '1948년 10월, 제주 4·3 사건 진압 명령을 거부한 군인들이 일으킨 여수·순천 10·19 사건이 일어났다.')],
         key='반민족 행위 처벌법 → 반민특위(방해 속 해체) / 농지개혁법 = 유상 매수·유상 분배 / 미군정 신한공사 = 일본인 소유 재산 관리',
         stress='반민특위 활동과 농지 개혁은 모두 6·25 전쟁 전이라는 순서를 알아 두라고 짚었어요.',
         next=('정부 수립 2년 만인 1950년, 6·25 전쟁이 일어났다.', True), src='1849–1851 · 1860–1869'),
    dict(id='scene-4', orig=4, panel=4, label='1950 · 6·25 전쟁', title='다시 흩어진 가족', when='1950 애치슨 선언 → 6월 25일 남침 → 인천 상륙 작전 → 중국군 참전 → 1·4 후퇴',
         alt='다시 흩어진 가족 장면', a=('어머니', '전쟁이 터져 피란해야 해요.'), b=('아들', '인천 상륙 뒤에도 전쟁이 계속되네요.'),
         steps=[('배경', 'cause', '1950년 1월 애치슨 선언으로 한반도가 미국의 방위선에서 빠지자, 6월 25일 새벽 북한이 남침했다.'),
                ('전개', 'dev', '낙동강까지 밀렸다가 인천 상륙 작전이 성공해 압록강까지 올라갔다.'),
                ('결과', 'res', '중국군이 참전해 밀고 내려오자 흥남 철수에 이어 서울을 다시 빼앗기는 1·4 후퇴를 겪었다.')],
         key='북한 남침→인천 상륙→중국군 참전·흥남철수',
         next=('전쟁은 멈췄지만, 갈라진 땅과 사람들은 그대로였다.', False), src='1869–1875'),
    dict(id='scene-5', orig=5, panel=5, label='1953 · 정전', title='멈춘 전쟁, 남은 분단', when='38도선 부근 교착 → 1953 정전 협정 → 한미상호방위조약',
         alt='멈춘 전쟁, 남은 분단 장면', a=('군인', '정전 협정으로 총성은 멎었습니다.'), b=('가족', '하지만 돌아갈 길은 아직 막혔어요.'),
         steps=[('배경', 'cause', '전선이 지금의 38도선 부근에서 굳어졌다.'),
                ('전개', 'dev', '전쟁을 끝내지 못한 채 3년 만인 1953년 정전 협정을 맺었다.'),
                ('결과', 'res', '이승만 정부는 미군이 한국에 머물도록 미국과 한미상호방위조약을 맺었다.')],
         key='정전 협정(1953) → 한미상호방위조약', stress='한미상호방위조약은 6·25 전쟁 직후 미국과 맺은 조약으로 선택지에 자주 나온다고 짚었어요.',
         next=('전쟁 중에도 권력을 둘러싼 개헌은 이어졌다.', False), src='1875–1878'),
    dict(id='rhee-amendments', added=True, panel=3, reuse=True, label='이승만 정부 · 두 번의 개헌', title='발췌개헌과 사사오입',
         when='6·25 전쟁 중 부산 발췌개헌 · 전쟁 뒤 사사오입개헌 · 진보당 사건 · 경향신문 폐간',
         alt='첫 보통선거 장면과 같은 그림(칸 전체 다시 사용 · 연단의 정치인)', a=('기자', '전쟁 중 부산에서 발췌개헌으로 직선제가 됐습니다.'), b=('시민', '전쟁 뒤엔 사사오입 개헌으로 중임 제한이 없어졌지요.'),
         art_note='그림: ‘첫 보통선거’ 장면과 같은 칸 전체를 확대하지 않고 다시 썼어요.',
         steps=[('배경', 'cause', '국회가 대통령을 뽑던 때, 전쟁 중 국회에서 지지를 잃은 이승만은 헌법을 바꾸려 했다.'),
                ('전개', 'dev', '임시 수도 부산에 계엄을 선포하고 야당 의원들을 억지로 모아, 대통령 직선제로 바꾸는 발췌개헌을 통과시켰다.'),
                ('결과', 'res', '전쟁 뒤에는 초대 대통령의 중임 제한을 없애는 개헌안이 필요한 찬성표(135.3표)에 못 미쳐 부결되었는데도, 반올림 논리로 통과시킨 사사오입개헌을 했다.'),
                ('독재', 'item', '정부 말에는 진보당 당수 조봉암을 처형한 진보당 사건과 경향신문 폐간이 있었다.'),
                ('경제', 'item', '이승만 정부의 경제는 미국에서 원조받은 밀가루·설탕·면직물을 가공한 삼백 산업이다.')],
         key='발췌개헌(전쟁 중·부산·대통령 직선제) → 사사오입 개헌(초대 대통령 중임 제한 철폐) / 진보당 사건(조봉암)·삼백 산업',
         stress='현대사는 독재에 맞서 민주화되는 과정과 개헌 내용을 많이 묻는다고 짚었어요.',
         more=[('흐름 보충 · 진보당 사건의 재심', '2011년 대법원은 재심에서 조봉암에게 무죄를 선고했다.')],
         next=('분단의 상처 속에서도 학생들은 자유를 요구했다.', False), src='1878–1895 · 1906–1908'),
    dict(id='scene-6', orig=6, panel=6, label='1960 · 4·19 혁명', title='학생이 거리로', when='1960 3·15 부정선거 → 김주열 → 4·19 혁명 → 이승만 하야 → 장면 내각',
         alt='학생이 거리로 장면', a=('학생', '3·15 부정선거를 그냥 넘길 수 없어요!'), b=('시민', '김주열의 죽음 뒤 시위가 번졌습니다.'),
         steps=[('배경', 'cause', '1960년 대통령 선거에서 자유당은 부통령 후보 이기붕을 당선시키려고 3·15 부정선거를 저질렀다.'),
                ('전개', 'dev', '마산에서 시위 중 숨진 김주열의 시신이 바다에서 발견되자 시위가 전국으로 퍼졌고, 이것이 4·19 혁명이다.'),
                ('결과', 'res', '이승만이 물러나고 허정 과도 정부를 거쳐 의원 내각제의 장면 내각(대통령 윤보선)과 민의원·참의원의 양원제 국회가 들어섰다.')],
         key='4·19 혁명 → 이승만 하야·장면 내각', stress='4·19 혁명은 이승만 정부에서 가장 잘 나오고, 결과(의원 내각제 · 양원제)도 중요하다고 짚었어요.',
         next=('4·19 혁명 이듬해, 5·16 군사정변으로 박정희가 권력을 잡았다.', True), src='1895–1906 · 2008–2010'),
    dict(id='scene-7', orig=7, panel=7, label='박정희 정부 · 산업화와 유신', title='공장 불빛과 긴급조치', when='1961 5·16 군사정변 · 경제개발 5개년 계획 · 한일 협정 · 1972 7·4 남북 공동 성명 · 유신헌법',
         alt='공장 불빛과 긴급조치 장면', a=('노동자', '고속도로와 공장이 늘지만 삶은 힘듭니다.'), b=('학생', '유신과 긴급조치에도 목소리를 내요.'),
         steps=[('배경', 'cause', '4·19 이듬해 5·16 군사정변으로 박정희가 국가재건최고회의를 중심으로 권력을 잡았고, 1963년 대통령이 되었다.'),
                ('전개', 'dev', '경제개발 5개년 계획을 시행하고 경부고속도로·서울 지하철 1호선·새마을운동으로 산업화를 밀어붙였으며, 베트남에 파병하고 서독에 광부와 간호사를 보냈다.'),
                ('한일', 'item', '식민 지배에 대한 사과와 배상이 빠진 한일 협정에 반대해 학생들이 6·3 시위를 벌였지만, 정부는 협정을 맺었다.'),
                ('남북', 'item', '1972년 7·4 남북 공동 성명으로 자주·평화·민족 대단결의 통일 원칙을 밝히고 남북조절위원회를 두었다.'),
                ('유신', 'item', '같은 해 10월 유신헌법으로 통일주체국민회의가 임기 6년의 대통령을 횟수 제한 없이 뽑게 하고, 대통령에게 긴급조치권을 주었다.')],
         key='경제개발 5개년·경부고속도로 / 유신헌법', stress='남북 사이의 첫 약속은 박정희 정부의 7·4 남북 공동 성명(남북조절위원회)이라고 짚었어요.',
         more=[('흐름 보충 · 성장의 그늘과 사회 모습', '전태일 분신 사건, 장발·미니스커트 단속, 중앙정보부 창설(1961), 국민교육헌장 공포, 중학교 무시험 추첨 배정, 함평 고구마 사건(농민 운동)도 박정희 정부 때다.')],
         next=('공장과 고속도로가 늘어나는 동안, 장기 집권에 맞선 목소리도 커졌다.', False), src='1910–1946'),
    dict(id='yushin-end', added=True, panel=6, reuse=True, label='1969–1979 · 유신에 맞선 목소리', title='6·3 시위에서 10·26까지',
         when='3선 개헌 반대 · 3·1 민주 구국 선언 · 1979 YH 무역 사건 → 김영삼 제명 → 부마항쟁 → 10·26 사태',
         alt='4·19 혁명 장면과 같은 그림(칸 전체 다시 사용 · 거리에서 외치는 학생)', a=('학생', '한일 국교 정상화에 반대한 6·3 시위가 있었죠.'), b=('시민', 'YH 무역 사건, 부마항쟁 뒤 10·26이 터졌어요.'),
         art_note='그림: ‘학생이 거리로’(4·19 혁명) 장면과 같은 칸 전체를 확대하지 않고 다시 썼어요.',
         steps=[('배경', 'cause', '1969년 3선 개헌 때부터 장기 집권에 반대하는 움직임이 있었고, 유신 뒤에는 3·1 민주 구국 선언과 개헌 청원 100만인 서명 운동이 이어졌다.'),
                ('전개', 'dev', '1979년 YH 무역 여성 노동자들의 농성을 강제로 진압한 일을 신민당 총재 김영삼이 비판하자, 정부는 김영삼을 국회의원에서 제명했다.'),
                ('결과', 'res', '김영삼의 정치 기반인 부산·마산에서 부마항쟁이 일어났고, 진압에 부담을 느낀 김재규가 박정희를 살해한 10·26 사태로 유신 체제가 끝났다.')],
         key='6·3 시위(한일 국교 정상화 반대) / 3선 개헌 반대·3·1 민주 구국 선언 / YH 무역 사건 → 김영삼 제명 → 부마항쟁 → 10·26 사태',
         next=('10·26 사태 뒤, 전두환 신군부가 12·12 군사정변을 일으켰다.', True), src='1926–1934 · 1946–1948'),
    dict(id='scene-8', orig=8, panel=8, label='1980 · 5·18 민주화운동', title='광주에서 버티다', when='1979 12·12 군사정변 → 1980 비상계엄 전국 확대 → 광주 5·18 민주화운동',
         alt='광주에서 버티다 장면', a=('시민', '계엄군에 맞서 시민군을 꾸립시다.'), b=('동료', '광주에서 벌어진 일을 꼭 기억합시다.'),
         steps=[('배경', 'cause', '10·26 뒤 전두환 신군부가 12·12 군사정변으로 권력을 잡자, 서울에서 대학생들이 신군부 반대 시위를 벌였다.'),
                ('전개', 'dev', '신군부가 비상계엄을 전국으로 넓히자 광주에서 이에 반대하는 5·18 민주화운동이 일어났다.'),
                ('결과', 'res', '계엄군의 진압으로 많은 사람이 숨지자 시민들이 무장해 시민군을 꾸렸다.'),
                ('함께', 'item', '이 무렵 신군부는 국가보위비상대책위원회를 설치했고, 5·18 관련 기록물은 세계 기록 유산이 되었다.')],
         key='5·18 민주화운동 = 광주·시민군', stress='‘계엄 확대에 반대했다 · 시민군을 조직했다’가 보이면 5·18이라고 짚었어요.',
         next=('광주의 비극 뒤 들어선 전두환 정부는 새 헌법을 만들었다.', False), src='1948–1954 · 2010–2011'),
    dict(id='chun-government', added=True, panel=7, reuse=True, label='전두환 정부', title='7년 단임과 3저 호황', when='8차 개헌(선거인단 간선 · 7년 단임) · 첫 남북 이산가족 상봉 · 3저 호황',
         alt='산업화 장면과 같은 그림(칸 전체 다시 사용 · 공장에서 일하는 노동자)', a=('기자', '선거인단이 대통령을 뽑는 7년 단임제가 됐습니다.'), b=('노동자', '저유가·저금리·저달러, 3저 호황이라더군요.'),
         art_note='그림: ‘공장 불빛과 긴급조치’ 장면과 같은 칸 전체를 확대하지 않고 다시 썼어요.',
         steps=[('배경', 'cause', '5·18 뒤 들어선 전두환 정부는 8차 개헌으로 대통령 선거인단이 간접 선거로 뽑는 7년 단임제를 만들었다.'),
                ('남북', 'item', '처음으로 남북 이산가족이 서울과 평양에서 만났다.'),
                ('사회', 'item', '교복·두발 자유화와 야간 통행금지 해제가 있었지만, 보도지침으로 언론을 통제하고 삼청교육대로 인권을 탄압했다.'),
                ('경제', 'item', '저금리·저유가·저달러의 3저 호황이 이어졌고, 최저 임금이 이때 정해졌다.')],
         key='전두환 정부 = 8차 개헌(선거인단 간선·7년 단임)·보도지침·삼청교육대·야간 통행금지 해제 / 3저 호황·최저임금법',
         more=[('흐름 보충 · 부천 경찰서 성고문 사건', '가끔 나오는 부천 경찰서 성고문 사건도 전두환 정부 때다.')],
         next=('광주의 기억은 대통령을 직접 뽑자는 요구로 이어졌다.', False), src='1955–1957 · 1966–1972'),
    dict(id='scene-9', orig=9, panel=9, label='1987 · 6월 민주항쟁', title='직접 뽑을 권리', when='1987 박종철 고문치사 · 4·13 호헌조치 → 6월 민주항쟁(이한열 최루탄 피격) → 6·29 민주화 선언 → 9차 개헌',
         alt='직접 뽑을 권리 장면', a=('학생', '4·13 호헌조치를 철폐하라!'), b=('시민', '박종철과 이한열을 잊지 않겠습니다.'),
         steps=[('배경', 'cause', '시민들은 대통령을 직접 뽑자고 요구했지만, 1987년 정부는 4·13 호헌조치로 개헌하지 않겠다고 했다. 서울대생 박종철이 경찰 조사 중 고문으로 숨진 사실도 드러났다.'),
                ('전개', 'dev', '호헌 철폐를 외치는 6월 민주항쟁이 일어났고, 연세대생 이한열이 시위 중 최루탄에 맞아 크게 다치자 시위가 20여 일간 전국으로 이어졌다.'),
                ('결과', 'res', '정부는 6·29 민주화 선언을 발표했고, 9차 개헌으로 지금의 헌법인 대통령 직선제·5년 단임제가 되었다.'),
                ('그 뒤', 'item', '최루탄에 맞은 이한열은 6·29 민주화 선언 뒤에 끝내 숨져, 6월 민주항쟁을 상징하는 희생으로 기억된다.')],
         key='6월 민주항쟁 → 6·29 선언·대통령 직선제', stress='국민의 직접 선거로 5년 단임 대통령을 뽑는다는 내용이 보이면 6월 민주항쟁의 결과라고 짚었어요.',
         next=('여기부터는 정부별 경제·사회·남북 관계 단서를 따라가요. 6월 민주항쟁 뒤 직선제로 노태우 정부가 들어섰다.', True), src='1957–1966 · 2012–2015'),
    dict(id='scene-10', orig=10, panel=10, label='노태우 정부', title='새로운 만남', when='1988 서울 올림픽 · 7·7 선언 · 남북 고위급 회담 · UN 동시 가입 · 남북기본합의서',
         alt='새로운 만남 장면', a=('시민', '서울올림픽을 치렀고 남북 대화도 이어집니다.'), b=('관리', 'UN 동시 가입과 남북기본합의서로 갑시다.'),
         steps=[('배경', 'cause', '노태우 정부 때 88 서울 올림픽이 열렸고, 세계적으로 냉전이 끝나 가고 있었다.'),
                ('전개', 'dev', '소련·중국·북한 등 공산권과도 교류하겠다는 7·7 선언으로 북방 외교를 폈고, 남북 고위급 회담을 여러 차례 열었다.'),
                ('결과', 'res', '남북한이 UN에 동시 가입하고, 남북기본합의서와 한반도 비핵화 공동선언을 채택했다.'),
                ('함께', 'item', '3당 합당으로 민주자유당이 만들어졌다.')],
         key='노태우 = 서울올림픽·7·7 선언·남북기본합의서', stress='노태우 정부부터는 정치사보다 경제·사회·남북 관계를 주로 묻는다고 짚었어요.',
         next=('올림픽과 북방 외교 뒤, 문민정부가 들어섰다.', False), src='1972–1981 · 2026–2028'),
    dict(id='ys-government', added=True, panel=7, reuse=True, label='김영삼 정부', title='금융실명제와 외환위기', when='문민정부 · 금융실명제 · 하나회 해체 · 지방자치제 전면 실시 · 임기 말 외환위기',
         alt='산업화 장면과 같은 그림(칸 전체 다시 사용 · 공장과 산업 현장)', a=('관리', '금융실명제를 실시하고 하나회를 해체했습니다.'), b=('시민', '지방자치제도 열렸지만 임기 말 외환위기가 왔어요.'),
         art_note='그림: ‘공장 불빛과 긴급조치’ 장면과 같은 칸 전체를 확대하지 않고 다시 썼어요.',
         steps=[('배경', 'cause', '군인 출신이 아닌 대통령이 들어서 김영삼 정부를 문민정부라고 불렀다.'),
                ('전개', 'dev', '모든 금융 거래를 실명으로 하는 금융실명제를 실시하고, 군대 안 사조직 하나회를 해체했으며, 역사 바로 세우기로 조선 총독부 건물을 철거했다.'),
                ('함께', 'item', '지방자치제를 전면 실시했고 민주노총이 창립되었으며, OECD에 가입했다.'),
                ('결과', 'res', '빠른 성장 끝에 임기 말 외환위기를 맞았다.')],
         key='김영삼 = 문민정부·금융실명제·하나회 해체·지방자치제 전면 실시·민주노총 창립 → 임기 말 외환위기',
         stress='김영삼 정부에서는 금융실명제가 압도적으로 잘 나온다고 짚었어요.',
         next=('외환위기 속에 들어선 김대중 정부는 위기 극복과 남북 정상회담에 나섰다.', False), src='1981–1989'),
    dict(id='scene-11', orig=11, panel=11, label='김대중·노무현 정부', title='정상회담의 문', when='김대중: 외환위기 극복 · 6·15 남북 공동 선언 / 노무현: 10·4 남북 정상 선언 · 개성공단 착공',
         alt='정상회담의 문 장면', a=('이산가족', '다시 만날 길이 열릴까요?'), b=('관리', '6·15 공동선언 뒤 10·4 선언도 이어집니다.'),
         steps=[('김대중', 'item', '김대중 정부는 금 모으기 운동 등으로 외환위기를 극복해 IMF 자금을 일찍 갚았고, 노사정 위원회·국가 인권 위원회·국민기초생활보장법도 이때다.'),
                ('6·15', 'item', '2000년 평양에서 첫 남북 정상회담을 열어 6·15 남북 공동 선언을 발표했고, 개성공단 조성에 합의했으며 금강산 해로 관광을 시작했다.'),
                ('노무현', 'item', '노무현 정부는 2007년 두 번째 정상회담에서 10·4 남북 정상 선언을 했고, 개성공단을 착공했으며 금강산 육로 관광도 했다.'),
                ('함께', 'item', '호주제 폐지와 과거사 정리 기본법 제정도 노무현 정부 때다.')],
         key='김대중 6·15·금모으기 → 노무현 10·4·개성공단', stress='김대중 정부에서 중요한 것은 남북 관계이고, 호주제 폐지는 노무현 정부로 종종 나온다고 짚었어요.',
         more=[('흐름 보충 · 노벨 평화상', '김대중 대통령은 남북 정상회담의 공로로 노벨 평화상을 받았다.')],
         next=('정부마다 남북 사이에는 서로 다른 약속이 남았다.', False), src='1989–2000'),
    dict(id='inter-korean', added=True, panel=11, reuse=True, label='주제별 · 남북 관계 · 선언 정리', title='7·4에서 판문점까지',
         when='여러 정부에 걸친 정리 · 7·4 → 이산가족 상봉 → 남북기본합의서 → 6·15 → 10·4 → 판문점',
         alt='정상회담의 문 장면과 같은 그림(칸 전체 다시 사용 · 남북의 만남)', a=('학생', '7·4 남북 공동 성명은 박정희 정부 때죠?'), b=('선생', '6·15는 김대중, 10·4는 노무현, 판문점은 문재인이야.'),
         art_note='그림: ‘정상회담의 문’ 장면과 같은 칸 전체를 확대하지 않고 다시 썼어요.',
         steps=[('박정희', 'item', '박정희 정부 때 7·4 남북 공동 성명을 발표하고 남북조절위원회를 두었다.'),
                ('전두환', 'item', '전두환 정부 때 처음으로 남북 이산가족이 만났다.'),
                ('노태우', 'item', '노태우 정부 때 남북 고위급 회담, UN 동시 가입, 남북기본합의서, 한반도 비핵화 공동선언이 있었다.'),
                ('정상회담', 'item', '첫 정상회담은 김대중 정부의 6·15, 두 번째는 노무현 정부의 10·4, 세 번째는 문재인 정부의 판문점 남북 정상회담이다.')],
         key='박정희 7·4 남북 공동 성명 / 전두환 이산가족 고향 방문 / 노태우 남북기본합의서·비핵화 공동선언 / 김대중 6·15 / 노무현 10·4 / 문재인 판문점 정상회담',
         stress='남북 관계는 정부별로 다시 정리해 두라고 짚었어요. 개성공단은 합의(김대중)와 착공(노무현)을 나눠 기억해요.',
         next=('민주주의와 평화를 향한 일은 지금도 계속된다.', False), src='2015–2021 · 2026–2032'),
    dict(id='scene-12', orig=12, panel=12, label='정리 · 오늘로 이어진 역사', title='민주주의와 평화', when='정부별 정리(이명박 · 문재인) · 세 민주화 운동 되짚기',
         alt='민주주의와 평화 장면', a=('학생', '우리가 누리는 직선제도 사람들의 선택이었군요.'), b=('선생', '맞아. 시대마다 사건과 결과를 함께 기억하자.'),
         steps=[('이명박', 'item', '이명박 정부 때 서울에서 G20 정상회의가 열렸고 다문화가족지원법이 만들어졌다.'),
                ('문재인', 'item', '문재인 정부 때 평창 동계 올림픽에서 남북 선수단이 공동 입장했다.'),
                ('되짚기', 'item', '4·19 혁명은 대통령 하야, 5·18 민주화운동은 시민군, 6월 민주항쟁은 직선제 개헌으로 결과를 가른다.')],
         key='4·19 → 5·18 → 6월 민주항쟁 / 남북 대화의 흐름',
         more=[('흐름 보충 · FTA(체결한 정부 기준)', '강의는 시험이 주로 체결한 정부를 묻는다며 이렇게 정리했다: 칠레 = 김대중 정부, 미국 = 노무현 정부, 중국 = 박근혜 정부. 칠레·미국과의 FTA는 체결한 정부와 실제로 효력이 생긴 정부가 다르다.')],
         next=None, src='2000–2014'),
]

MODERN_CSS = ('<style id="hanq-modern-story">/* 현대사: 흐름 머리 → 시기 줄 → 그림(SVG 칸 전체·원비율) → 그림 밖 말풍선 → 설명 → 꼭 기억 · 강의 강조 → (덩어리 끝) 이 부분에서 외울 것 → 다음 장면 잇기 */'
              '.m-story .scene{padding:0 0 22px;opacity:1!important;transform:none!important;content-visibility:visible!important}'
              '.m-story .m-head{padding:18px 18px 12px}.m-story .m-head .meta{font-size:13px;color:#667085;font-weight:800}'
              '.m-story .m-head h2{font-size:clamp(22px,6vw,28px);line-height:1.25;letter-spacing:-.04em;margin:6px 0 6px;word-break:keep-all}'
              '.m-story .m-when{margin:0;color:#a72d27;font-size:14.5px;line-height:1.5;font-weight:850;word-break:keep-all;overflow-wrap:anywhere}'
              # 그림: 예전 .art 배경 격자(300%×400% 늘이기·확대)는 쓰지 않는다. SVG viewBox = 칸 사각형 전체, 원래 비율(width·height 속성)
              '.m-story .art{background:none;aspect-ratio:auto}'
              '.m-art{margin:0;background:#d9dce0;line-height:0}.m-panel{display:block;width:100%;height:auto}'
              '.m-art-cap{margin:6px 18px 0;font-size:13px;font-weight:750;line-height:1.5;color:#4b5565}.m-art-note{margin:2px 18px 0;font-size:13px;line-height:1.5;color:#5b6576}'
              '.m-talk-cap{margin:12px 18px 0;font-size:13px;font-weight:800;line-height:1.4;color:#5b6576}'
              '.m-talk{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin:8px 18px 0}'
              '.m-talk p{margin:0;padding:10px 12px 11px;background:#fff;border:2px solid #26384c;border-radius:16px 16px 16px 5px;color:#243248;line-height:1.5}'
              '.m-talk p+p{background:#eef6ff;border-color:#315d80;border-radius:16px 16px 5px 16px}'
              '.m-talk b{display:block;margin-bottom:4px;font-size:14px;font-weight:900;color:#b52d34}.m-talk p+p b{color:#315d80}'
              '.m-talk span{display:block;font-size:16px;font-weight:700;word-break:keep-all;overflow-wrap:anywhere}'
              '.m-steps{list-style:none;margin:12px 18px 0;padding:0;display:grid;gap:7px}'
              '.m-steps li{display:grid;grid-template-columns:3.6em minmax(0,1fr);gap:8px;align-items:baseline;font-size:16px;line-height:1.65;color:#2b3443;word-break:keep-all;overflow-wrap:anywhere}'
              '.m-steps .st{display:block;padding:1px 2px;border-radius:6px;text-align:center;font-size:12.5px;font-weight:900;line-height:1.5;background:#eef1f4;color:#4b5565}'
              '.m-steps .st.dev{background:#fff0e9;color:#a72d27}.m-steps .st.res{background:#e9f4ec;color:#2f6b3c}.m-steps .st.item{background:#f6f1e7;color:#7a5a24}'
              '.m-steps strong,.m-mem strong{color:#b52d34;font-weight:900}'
              '.m-story .scene>.key{margin:12px 18px 0;padding:10px 12px;border-left:4px solid #d83b32;background:#fff0e9;color:#a72d27;font-size:15px;font-weight:850;line-height:1.55;word-break:keep-all;overflow-wrap:anywhere}'
              '.m-stress{margin:8px 18px 0;font-size:14px;line-height:1.55;color:#294d87;font-weight:750;word-break:keep-all}.m-stress b{margin-right:6px;padding:1px 7px;border-radius:6px;background:#eef2f8;font-size:12.5px;font-weight:900}'
              '.m-story .scene-more{margin:10px 18px 0;padding:4px 12px;border:1px dashed #d6c7a3;border-radius:10px;background:#fffaf0;font-size:15px;line-height:1.6;color:#3d4859}'
              '.m-story .scene-more>summary{display:flex;align-items:center;min-height:44px;cursor:pointer;font-weight:850}.m-story .scene-more>summary:focus-visible{outline:3px solid #294d8766;outline-offset:2px;border-radius:6px}.m-story .scene-more p{margin:2px 0 10px}'
              '.m-story .m-flow{padding:18px 18px 16px;background:#17243a;color:#fff}.m-story .m-flow:focus{outline:3px solid #f0b593;outline-offset:-3px}'
              '.m-story .m-flow small{display:block;color:#f0b593;font-size:13px;font-weight:800}.m-story .m-flow h2{margin:4px 0 0;color:#fff;font-size:clamp(20px,5.5vw,24px);line-height:1.3;word-break:keep-all}'
              '.m-story .m-flow p{margin:6px 0 0;font-size:15px;line-height:1.6;color:#dce5f0;word-break:keep-all}'
              '.m-mem{margin:0;padding:16px 18px 18px;background:#fff8e8;border-top:4px solid #e5a337;border-bottom:1px solid #f0dfb8}'
              '.m-mem-label{margin:0 0 8px;font-size:17px;font-weight:900;color:#7a4b0d}.m-mem-k+.m-mem-k{margin-top:14px;padding-top:12px;border-top:1px dashed #e3cf9f}'
              '.m-mem-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 10px;margin:0 0 6px}.m-mem-t{font-size:17px;font-weight:900}.m-mem-w{font-size:14px;font-weight:800;color:#294d87}'
              '.m-mem-story p{margin:0 0 6px;font-size:16px;line-height:1.7;color:#243248;word-break:keep-all;overflow-wrap:anywhere}'
              '.m-memo{margin:8px 0;padding:10px 12px;border-left:4px solid #e5a337;border-radius:8px;background:#fff}.m-memo b{display:block;font-size:14px;font-weight:900}.m-memo p{margin:4px 0 0;font-size:16px;line-height:1.7}.m-memo p+p{font-size:15px;color:#5b4a26}'
              '.m-mem-x{margin:8px 0 0;font-size:16px;line-height:1.7;color:#3b3220;word-break:keep-all;overflow-wrap:anywhere}.m-mem-x b{margin-right:6px;padding:1px 7px;border-radius:6px;background:#fce9e5;color:#8f2a26;font-size:13px;font-weight:900}'
              '.m-keys{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:8px 0 0}.m-keys-label{font-size:13px;font-weight:900;color:#5b6576}.m-key{padding:3px 9px;border-radius:999px;background:#fce9e5;color:#8f2a26;font-size:14px;font-weight:850}'
              '.m-guide{margin:12px 0 0;padding:0;list-style:none;font-size:14px;line-height:1.6;color:#d9e0e8}.m-guide b{color:#f0b593}'
              '.m-story .story-seam.m-switch{background:#e6e9ed;color:#17243a;font-weight:850}'
              '.m-story .end p{font-size:16px}'
              # 흐름 바로 가기 줄(개화기·조선·고려·독도와 간도·일제 강점기 웹툰과 같은 방식): 높이 60px 고정, 좁은 화면에서 오른쪽 92px는 홈 버튼 자리, 가로 스크롤은 안쪽 트랙에서만
              '.m-story nav.m-nav{position:sticky;top:0;z-index:5;height:60px;box-sizing:border-box;display:flex;align-items:center;margin:0;padding:0 92px 0 10px;background:#edf0f4;border-bottom:1px solid #d9dee5}'
              '.m-story .m-nav-track{display:flex;align-items:center;gap:6px;min-width:0;width:100%;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scrollbar-width:none}.m-story .m-nav-track::-webkit-scrollbar{display:none}'
              '.m-story nav.m-nav a{flex:none;display:inline-flex;align-items:center;min-height:44px;padding:0 14px;color:#263a55;font-weight:800;font-size:14px;text-decoration:none;background:#fff;border:1px solid #d4dae1;border-radius:99px;white-space:nowrap}'
              '.m-story .comic-home{top:calc(9px + env(safe-area-inset-top));min-height:42px}'
              '@media(min-width:760px){.m-story nav.m-nav{padding-right:10px}}'
              '.m-story .scene,.m-story .m-flow,.m-story .m-mem{scroll-margin-top:68px}'
              '@media(max-width:400px){.m-talk{grid-template-columns:1fr;gap:12px;margin:8px 14px 0}.m-steps{margin:12px 14px 0}.m-art-cap,.m-art-note,.m-talk-cap,.m-stress{margin-left:14px;margin-right:14px}.m-story .scene>.key{margin-left:14px;margin-right:14px}.m-story .m-head{padding:16px 14px 12px}.m-mem{padding-left:14px;padding-right:14px}}'
              '.embedded .m-story nav{display:none}'
              '</style>')


def check_sheet():
    """그림판이 측정 때와 같은지(해시·크기), 칸 사각형이 그림판 안에서 서로 겹치지 않는지 확인한다."""
    path = os.path.join(MEDIA, SHEET)
    with open(path, 'rb') as f:
        data = f.read()
    if hashlib.sha256(data).hexdigest() != SHEET_SHA:
        raise SystemExit('media/%s 가 측정 때와 달라요(해시). 칸 사각형을 다시 재야 해요.' % SHEET)
    if struct.unpack('>II', data[16:24]) != (SHEET_W, SHEET_H):
        raise SystemExit('media/%s 크기가 %d×%d가 아니에요.' % (SHEET, SHEET_W, SHEET_H))
    rects = list(PANELS.values())
    for i, (x, y, w, h) in enumerate(rects):
        if x < 0 or y < 0 or w <= 0 or h <= 0 or x + w > SHEET_W or y + h > SHEET_H:
            raise SystemExit('칸 사각형이 그림판 밖으로 나가요: %r' % (rects[i],))
        for j, (a, b, c, d) in enumerate(rects):
            if i != j and not (x + w <= a or a + c <= x or y + h <= b or b + d <= y):
                raise SystemExit('칸 사각형이 서로 겹쳐요: %r %r' % (rects[i], rects[j]))


def load_flow():
    s = open(os.path.join(MEDIA, 'lecture-flow-modern.js'), encoding='utf-8').read()
    m = re.search(r'/\*FLOW-JSON\*/(.*?)/\*END-FLOW-JSON\*/', s, re.S)
    if not m:
        raise SystemExit('media/lecture-flow-modern.js 에 흐름 데이터(FLOW-JSON)가 없어요.')
    return json.loads(m.group(1))


def em(s):
    return re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', e(s))


def bold_terms(text, seen, vocab):
    """장면 설명에서 흐름 데이터의 굵게 표시 말(terms)을 처음 나올 때 한 번만 굵게(긴 말부터)."""
    terms = sorted((t for t in vocab if t not in seen), key=len, reverse=True)
    if not terms:
        return e(text)
    rx = re.compile('|'.join(re.escape(t) for t in terms))
    out, pos = [], 0
    for m in rx.finditer(text):
        if m.group(0) in seen:
            continue
        seen.add(m.group(0))
        out.append(e(text[pos:m.start()]) + '<strong>' + e(m.group(0)) + '</strong>')
        pos = m.end()
    return ''.join(out) + e(text[pos:])


def who(w):
    return w + ' · 설명용 인물' if w in GENERIC else w


def art_html(sc):
    x, y, w, h = PANELS[sc['panel']]
    return ('<div class="m-art" data-panel="modern-p%02d"><svg class="m-panel" viewBox="%d %d %d %d" width="%d" height="%d" role="img" aria-label="%s" focusable="false" preserveAspectRatio="xMidYMid meet">'
            '<image href="%s" x="0" y="0" width="%d" height="%d"/></svg></div>') % (sc['panel'], x, y, w, h, w, h, e(sc['alt']), SHEET, SHEET_W, SHEET_H)


def scene_html(sc, n, vocab):
    attrs = (' data-orig="%d"' % sc['orig']) if sc.get('orig') else ''
    attrs += ' id="%s"' % e(sc['id'])
    attrs += ' data-added="density"' if sc.get('added') else ''
    head = '<div class="m-head"><div class="meta"><span data-scene-count data-format="n">%02d</span> · %s</div><h2>%s</h2><p class="m-when">%s</p></div>' % (
        n, e(sc['label']), e(sc['title']), e(sc['when']))
    cap = '<p class="m-art-cap">개념 그림 · 실제 인물의 초상이나 현장 사진이 아니에요.</p>'
    note = '<p class="m-art-note">%s</p>' % e(sc['art_note']) if sc.get('art_note') else ''
    talk = ('<p class="m-talk-cap">학습용 요약 대화 · 실제 발언을 그대로 옮긴 것이 아니에요.</p><div class="m-talk">%s</div>'
            % ''.join('<p aria-label="%s: %s"><b>%s</b><span>%s</span></p>' % (e(who(w)), e(t), e(who(w)), e(t)) for w, t in (sc['a'], sc['b'])))
    seen = set()
    steps = '<ol class="m-steps" aria-label="장면 설명">%s</ol>' % ''.join(
        '<li><b class="st %s">%s</b><span>%s</span></li>' % (k, e(l), bold_terms(t, seen, vocab)) for l, k, t in sc['steps'])
    stress = '<p class="m-stress"><b>강의 강조</b>%s</p>' % e(sc['stress']) if sc.get('stress') else ''
    more = ''.join('<details class="scene-more"><summary>%s</summary><p>%s</p></details>' % (e(t), e(x)) for t, x in sc.get('more', []))
    return '<section class="scene"%s>%s%s%s%s%s%s<p class="key">%s</p>%s%s</section>' % (
        attrs, head, art_html(sc), cap, note, talk, steps, e(sc['key']), stress, more)


def memory_html(after, chunks):
    def one(k):
        memo = ('<div class="m-memo"><b>%s</b><p>%s</p><p>%s</p></div>' % (e(k['memo']['label']), e(k['memo']['text']), e(k['memo']['note']))) if k.get('memo') else ''
        wrong = '<p class="m-mem-x"><b>헷갈리지 않기</b>%s</p>' % em(k['x']) if k.get('x') else ''
        return ('<div class="m-mem-k"><p class="m-mem-head"><b class="m-mem-t">%s</b><span class="m-mem-w">%s</span></p><div class="m-mem-story">%s</div>%s%s'
                '<p class="m-keys"><span class="m-keys-label">암기 키워드</span>%s</p></div>') % (
            e(k['t']), e(k['w']), ''.join('<p>%s</p>' % em(x) for x in k['story']), memo, wrong, ''.join('<span class="m-key">%s</span>' % e(x) for x in k['k']))
    return '<aside class="m-mem" id="mem-%s" aria-label="이 부분에서 외울 것: %s"><p class="m-mem-label">이 부분에서 외울 것</p>%s</aside>' % (
        e(after), e(' · '.join(k['t'] for k in chunks)), '<ul>'+''.join('<li><b>%s</b> · %s</li>'%(e(k['t']),e(' → '.join(k['k']))) for k in chunks)+'</ul><details><summary>세부 내용 펼쳐보기</summary>'+''.join(one(k) for k in chunks)+'</details>')


def bridge_html(sc):
    if not sc.get('next'):
        return ''
    text, switch = sc['next']
    return '<div class="story-seam%s" aria-label="이야기 흐름"><span class="story-seam-dots" aria-hidden="true">…</span><span class="story-seam-text">%s</span></div>' % (
        ' m-switch' if switch else '', e(text))


def build():
    check_sheet()
    keys = [sc['id'] for sc in SCENES]
    if len(keys) != 18 or len(set(keys)) != 18 or any(sc['panel'] not in PANELS for sc in SCENES):
        raise SystemExit('현대사 장면은 18개, id는 서로 달라야 하고 칸 번호는 1–12여야 해요.')
    if sorted({sc['panel'] for sc in SCENES if not sc.get('reuse')}) != list(range(1, 13)):
        raise SystemExit('원래 장면 12개는 원본 칸 1–12를 하나씩 써야 해요.')
    flow = load_flow()
    vocab = flow['terms']
    starts = {f['start']: f for f in flow['list']}
    chunks = [k for f in flow['list'] for k in f['chunks']]
    idx = [keys.index(k['go']) for k in chunks]
    if idx != sorted(idx) or len(set(idx)) != len(idx) or any(f['start'] != f['chunks'][0]['go'] for f in flow['list']) or keys[0] != flow['list'][0]['start']:
        raise SystemExit('흐름·덩어리 시작 장면이 화면 순서와 맞지 않아요.')
    old_ends=[keys[x-1] for x in idx[1:]]+[keys[-1]]
    ends = {}
    for i, group in enumerate(flow['list']):
        last=keys[keys.index(flow['list'][i+1]['start'])-1] if i+1<len(flow['list']) else keys[-1]
        ends[last]=group['chunks']
    src = open(os.path.join(MEDIA, FILE), encoding='utf-8').read()
    head = re.sub(r'<style id="hanq-modern-story">.*?</style>', '', src[:src.index('</head>')], flags=re.S) + MODERN_CSS
    tail = src[src.index('</main>'):]
    body, scenes, memory = '', [], []
    for n, sc in enumerate(SCENES, 1):
        if sc['id'] in starts:
            f = starts[sc['id']]
            body += '<div class="m-flow" id="%s"><small>%s · %s</small><h2 id="%s-h">%s %s</h2><p>%s</p></div>\n' % (
                e(f['id']), e(f['no']), e(f['range']), e(f['id']), e(f['no']), e(f['name']), e(f['lead']))
        card = '<span class="legacy-anchor" id="mem-%s" aria-hidden="true"></span>' % e(sc['id']) if sc['id'] in old_ends and sc['id'] not in ends else ''
        if sc['id'] in ends:
            card = memory_html(sc['id'], ends[sc['id']])
            memory.append(dict(after=sc['id'], scene=n, chunks=[k['t'] for k in ends[sc['id']]]))
        body += scene_html(sc, n, vocab) + card + bridge_html(sc) + '\n'
        fl = [f['id'] for f in flow['list'] if keys.index(f['start']) <= n - 1][-1]
        scenes.append(dict(id=sc['id'], scene=n, flow=fl, orig=sc.get('orig'), added=bool(sc.get('added')), panel=sc['panel'], rect=list(PANELS[sc['panel']]),
                           reused=bool(sc.get('reuse')), depicts=sc['alt'], key=sc['key'], speakers=[w for w, _ in (sc['a'], sc['b'])],
                           stress=sc.get('stress'), teacher_lines=sc['src']))
    guide = ('<ul class="m-guide"><li><b>다섯 흐름</b> ① 광복에서 정부 수립 → ② 6·25 전쟁과 4·19 → ③ 박정희 정부와 유신 → ④ 신군부와 6월 민주항쟁 → ⑤ 민주화 이후 정부와 남북 관계. 남북 관계·FTA는 여러 정부에 걸친 주제별 정리예요.</li>'
             '<li><b>컷마다</b> 시기 → 그림 → 대화 → 설명 → 꼭 기억을 읽어요. 강의가 직접 짚은 말은 ‘강의 강조’로 표시해요.</li>'
             '<li><b>큰 흐름 끝</b>마다 ‘이 부분에서 외울 것’으로 사람·사건을 이어서 정리해요.</li></ul>')
    header = ('<header><small>한국사 한눈에 · 시대 웹툰</small><h1>광복과 대한민국</h1><p>정부 수립·전쟁·민주화·남북 관계</p>' + guide + '</header>'
              '<nav class="m-nav" aria-label="현대사 흐름 바로 가기"><div class="m-nav-track">%s</div></nav>'
              '<div class="chapter-line">%s</div>\n') % (''.join('<a href="#%s">%s %s</a>' % (e(f['id']), e(f['no']), e(f['name'])) for f in flow['list']), e(flow['note']))
    end = ('<div class="end"><strong>이 시대 한 줄 흐름</strong>'
           '<p>광복 → 건준 → 모스크바 3국 외상회의 → 정읍 발언·좌우합작 → 남북 협상·제주 4·3 → 5·10 총선거·정부 수립 → 반민특위·농지 개혁 → 6·25 전쟁 → 발췌개헌·사사오입 → 4·19 혁명</p>'
           '<p>5·16 → 경제개발·한일 협정·7·4 남북 공동 성명 → 유신 → 10·26 → 12·12 → 5·18 → 6월 민주항쟁·직선제 → 노태우·김영삼·김대중·노무현 정부의 경제·사회·남북 관계</p>'
           '<a href="../index.html#chapter/modern/quiz" target="_top">다 읽었다면 퀴즈로 확인하기 →</a></div>')
    doc = head + '</head><body class="m-story"><a class="comic-home" href="../index.html" aria-label="시대별 목차로 이동">⌂ 홈</a><main>' + header + body + end + tail
    with open(os.path.join(MEDIA, FILE), 'w', encoding='utf-8') as f:
        f.write(doc)
    cmap = dict(generated_by='scripts/build_modern_comic.py',
                note='현대사 웹툰 장면(화면 순서)·흐름·원본 칸·기존 꼭 기억 단서·강의 강조와 근거 행, 이 부분에서 외울 것 카드 위치. 그림판은 바이트 그대로이고 칸 하나를 SVG viewBox로 통째로 보여 준다.',
                panel_source=dict(file='media/' + SHEET, sha256=SHEET_SHA, width=SHEET_W, height=SHEET_H,
                                  panels={'p%02d' % k: dict(x=v[0], y=v[1], w=v[2], h=v[3]) for k, v in sorted(PANELS.items())}),
                scenes=scenes, memory=memory)
    with open(os.path.join(ROOT, 'docs', 'modern-comic-map.json'), 'w', encoding='utf-8') as f:
        json.dump(cmap, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print('현대사 장면', len(scenes), '· 흐름', len(flow['list']), '· 카드', len(memory))


if __name__ == '__main__':
    build()

# Source-backed supplementary learning cuts; original scene keys stay unchanged.
from study_supplements import apply as apply_study_supplements
apply_study_supplements()
