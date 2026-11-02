# -*- coding: utf-8 -*-
"""남북국 시대 웹툰(media/nambuk-comic.html)을 강의 흐름(네 흐름)에 맞춘 한 페이지 학습으로 다시 엮는다.

  python3 scripts/build_nambuk_comic.py

- 그림: 예전 웹툰은 1086×1448 그림판 네 장을 base64로 품고(.sheet0–3) 배경 늘이기로 칸을 잘라 보였다.
  처음 실행하면 품은 PNG를 그대로 꺼내(다시 인코딩하지 않음) 해시·크기를 확인한 뒤 media/nambuk-sheets/0.png–3.png에
  바이트 그대로 둔다. 다시 실행할 때 웹툰에 품은 그림이 없으면 그 네 파일을 같은 해시·크기로 확인해 쓴다. 하나라도 다르면 멈춘다.
- 칸: 그림판의 행 높이가 고르지 않고 칸 위치가 뒤바뀐 곳(s3 오른쪽 · s4 왼쪽)도 있어, 조정자가 잰 장면별 사각형(PANELS)을
  그대로 쓴다. 칸 하나를 SVG viewBox로 통째로, 원래 비율로 보여 준다(다시 그리기·확대·잘라 내기 없음). 칸 비율은 그림을 불러오기 전에 자리를 잡는다.
- 기존 파일의 앞부분(스타일)과 </main> 뒤 스크립트(진행 막대 · 가장자리 밀기 · 장면 번호 · 용어 풀이)는 그대로 두고, 품은 그림 스타일만 뺀다.
  이 웹툰 전용 스타일(hanq-nambuk-story)은 지우고 다시 넣어 여러 번 실행해도 결과가 같다.
- 장면 32개의 id(s1–s32)·순서·제목·핵심 줄(예전 .beat, 이제 p.key)은 그대로다. 예전 구분 줄(.hook)은 보이게, 예전 설명(.fact)은 장면 안 접힌 보충으로 원문 그대로 둔다.
- 흐름 머리와 ‘이 부분에서 외울 것’ 카드는 media/lecture-flow-nambuk.js의 /*FLOW-JSON*/ … /*END-FLOW-JSON*/를 읽는다.
- 말풍선은 그림 밖(아래)에 둔다. 기록에 이름이 없는 화자는 ‘설명용 인물’로 밝힌다. 스타일은 body.n-story 안에서만 쓴다.
- 출력: media/nambuk-comic.html, media/nambuk-sheets/0–3.png(처음 한 번), docs/nambuk-comic-map.json. 시간·난수·개인 경로를 쓰지 않는다.
  근거·정정 기록은 docs/nambuk-scene-sources.md.
"""
import base64, hashlib, html, json, os, re, struct

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA = os.path.join(ROOT, 'media')
FILE = 'nambuk-comic.html'
SHEET_DIR = 'nambuk-sheets'
e = lambda s: html.escape(s, quote=True)

# 원본 그림판(예전 웹툰에 base64로 품었던 PNG): 번호 → (SHA-256, 바이트 수). 모두 1086×1448
SHEETS = {0: ('03e16087e8b66c87e896679994ff83a8c9d6c004476ffbf33d3a5585eaaffbed', 3135388),
          1: ('b01abffcfd236b6fdac8e9db4ba5c95ae190d37fe9783e92066d39515c5126e6', 3333327),
          2: ('ea8f29e32980d4265b98f73c8158ef33b1c4553a0d05341d94d891e773c1a0ee', 3167820),
          3: ('f30e7bbffaf1d75c05d1f76018aba6b0dd8cdbd2a9da724e99542631568fc88e', 3317679)}
SHEET_W, SHEET_H = 1086, 1448
SHEET_RE = re.compile(r'\.sheet(\d)\{background-image:url\(data:image/png;base64,([A-Za-z0-9+/=]+)\)\}')
SHEET_STYLE_RE = re.compile(r'<style>(?:\.sheet\d\{background-image:url\(data:image/png;base64,[A-Za-z0-9+/=]+\)\})+</style>')

# 장면별 칸 사각형(조정자가 잰 값: 그림판, x, y, w, h). 행 높이가 그림판마다 다르고 s3·s4는 좌우가 뒤바뀌어 있다 — 균등 격자를 가정하지 않는다
PANELS = {1: (0, 0, 0, 543, 349), 2: (0, 543, 0, 543, 349), 3: (0, 543, 349, 543, 335), 4: (0, 0, 349, 543, 335),
          5: (0, 0, 684, 543, 332), 6: (0, 543, 684, 543, 332), 7: (0, 0, 1016, 543, 432), 8: (0, 543, 1016, 543, 432),
          9: (1, 0, 0, 543, 356), 10: (1, 543, 0, 543, 356), 11: (1, 0, 356, 543, 370), 12: (1, 543, 356, 543, 370),
          13: (1, 0, 726, 543, 338), 14: (1, 543, 726, 543, 338), 15: (1, 0, 1064, 543, 384), 16: (1, 543, 1064, 543, 384),
          17: (2, 0, 0, 543, 351), 18: (2, 543, 0, 543, 351), 19: (2, 0, 351, 543, 327), 20: (2, 543, 351, 543, 327),
          21: (2, 0, 678, 543, 338), 22: (2, 543, 678, 543, 338), 23: (2, 0, 1016, 543, 432), 24: (2, 543, 1016, 543, 432),
          25: (3, 0, 0, 543, 351), 26: (3, 543, 0, 543, 351), 27: (3, 0, 351, 543, 327), 28: (3, 543, 351, 543, 327),
          29: (3, 0, 678, 543, 337), 30: (3, 543, 678, 543, 337), 31: (3, 0, 1015, 543, 433), 32: (3, 543, 1015, 543, 433)}

# 기록에 이름이 남지 않은 설명용 인물. 그 밖의 화자(신문왕 · 대조영 · 무왕 · 장문휴 · 문왕 · 선왕 · 설총 · 원효 · 의상 · 혜초 · 장보고 · 최치원 · 견훤 · 궁예)는 실제 인물이지만 대사는 학습용 요약이다
GENERIC = {'신라 병사', '동료', '신하', '귀족', '지방관', '병사', '장수', '지방 세력가', '관리', '백성', '고구려 유민', '신라 사신', '상인', '학자', '사신',
           '학생', '스승', '왕', '제자', '승려', '장인', '신라 사람', '안내자', '발해 사람', '농민', '지방민', '호족', '발해 사신', '기록자'}

# 장면 정의(화면 순서 = 기존 순서 s1–s32). label: 예전 meta 줄(번호 뒤) · title: 예전 h2 · key: 예전 .beat(글자 그대로)
#  when: 왕·시기 줄 · a, b: 말풍선(예전 대사, s8 관리 대사만 뜻이 갈리지 않게 다듬음) · steps: [(이름, cause|dev|res|item, 문장)]
#  hook: 예전 .hook(원문 HTML 그대로, 보이게) · fact: 예전 .fact(원문 HTML 그대로, 접힌 ‘예전 설명’) · stress: 강의가 직접 짚은 말
#  more: [(제목, 문장)] 접힌 보충 · next: (다음 장면으로 잇는 말, 흐름이 바뀌면 True) · src: 강의 행(없으면 None — 기존 노트 근거)
SCENES = [
    dict(id='s1', label='남북국 시대의 문이 열리다 · 시대 흐름', title='전쟁이 끝나도, 역사는 계속된다', when='통일 신라 전기 · 무열왕 → 문무왕(삼국 통일 완성) · 같은 시기 북쪽에는 발해',
         a=('신라 병사', '전쟁은 끝났지만 이제 넓은 나라를 다스려야 합니다.'), b=('동료', '남쪽 신라와 북쪽 발해의 시대가 열리겠군.'),
         steps=[('구분', 'item', '남북국 시대는 남쪽의 통일 신라와 북쪽의 발해가 함께 있던 시대다.'),
                ('배경', 'cause', '무열왕(김춘추) 때 백제를 멸망시켰고, 그 아들 문무왕은 고구려를 멸망시키고 나당 전쟁에서 이겨 삼국 통일을 완성했다.'),
                ('시기', 'item', '통일 신라는 무열왕의 직계 자손이 왕위를 잇던 혜공왕까지를 전기, 혜공왕이 피살된 뒤를 후기(하대)로 나누어 본다.')],
         key='남쪽 통일 신라 · 북쪽 발해',
         hook='무열왕 → 문무왕 → 신문왕의 흐름부터 잡자. 발해의 건국은 <a href="#s9" data-scene-ref="s9">9컷</a>에서 이어진다.',
         fact='<strong>남북국 시대 = 통일 신라와 발해가 함께 있던 시대</strong>. 신라에서는 <strong>최초의 진골 출신 왕 무열왕(김춘추)</strong>의 직계 자손들이 약 120년간 왕위를 이어 갔다. <strong>문무왕</strong>은 무열왕의 아들이다.',
         more=[('흐름 보충 · 문무왕 이야기', '문무왕은 죽어서도 신라를 지키는 용이 되겠다며 바다에 묻혔다는 이야기가 전한다.')],
         next=('통일 뒤 신문왕이 즉위하자마자, 왕의 장인이 반란을 일으켰다.', False), src='338–348'),
    dict(id='s2', label='통일 신라 · 신문왕 · 정치', title='왕의 장인이 반란을 일으켰다', when='신문왕 즉위 직후 · 장인 김흠돌의 반란 → 진골 귀족 숙청 → 왕권 강화',
         a=('신하', '폐하의 장인 김흠돌이 반란을 일으켰습니다!'), b=('신문왕', '가까운 사람이라도 반란은 용서할 수 없다.'),
         steps=[('배경', 'cause', '문무왕의 아들 신문왕이 즉위하자마자 왕의 장인 김흠돌이 반란을 일으켰다.'),
                ('전개', 'dev', '신문왕은 김흠돌의 난을 진압하면서 이와 얽힌 진골 귀족 세력을 많이 숙청했다.'),
                ('결과', 'res', '귀족 세력이 약해지면서 왕권이 강해졌다.')],
         key='김흠돌의 난 진압 → 왕권 강화',
         hook='김흠돌의 난은 신문왕의 왕권 강화와 묶는다. 뒤에 나올 김헌창의 난과 구분!',
         fact='<strong>신문왕 → 김흠돌의 난 진압 → 귀족 숙청 → 왕권 강화</strong>. 귀족 세력의 중심이던 <strong>상대등의 권한</strong>은 약해졌다.',
         stress='통일 신라에서 제일 중요한 왕은 신문왕이라고 짚었어요.',
         next=('반란을 누른 신문왕은 나라를 맡길 인재를 기를 학교도 세웠다.', False), src='348–350 · 466–468'),
    dict(id='s3', label='통일 신라 · 신문왕 · 문화·교육', title='왕에게는 인재도 필요하다', when='신문왕 · 국학 설치(유학 교육)',
         a=('신하', '넓어진 나라를 맡길 인재를 길러야 합니다.'), b=('신문왕', '국학을 세워 유학을 가르치자.'),
         steps=[('배경', 'cause', '통일로 넓어진 나라를 맡길 관리를 길러야 했다.'),
                ('전개', 'dev', '신문왕은 국학을 설치해 유학을 가르쳤다.'),
                ('구분', 'item', '고구려 소수림왕이 세운 학교는 태학, 통일 신라 신문왕이 세운 학교는 국학, 발해의 학교는 주자감이다.')],
         key='신문왕 · 국학',
         hook='고구려 소수림왕 = 태학 / 통일 신라 신문왕 = 국학',
         fact='<strong>신문왕 → 국학 설립</strong>. <strong>국학</strong>은 유교 경전을 가르치는 교육 기관이다. 앞선 고구려의 <strong>태학</strong>과 나라·왕을 구분한다.',
         next=('사람을 기르는 데 이어, 귀족이 가진 땅의 힘도 줄였다.', False), src='359 · 466'),
    dict(id='s4', label='통일 신라 · 신문왕 · 경제·정치', title='귀족의 힘, 땅에서도 줄인다', when='신문왕 · 관료전 지급 · 녹읍 폐지',
         a=('귀족', '우리 땅과 특권은 그대로겠지요?'), b=('신문왕', '관료전을 주고 녹읍은 폐지한다.'),
         steps=[('배경', 'cause', '녹읍은 관리에게 주던 땅으로, 그 땅에서 거두는 곡식뿐 아니라 그 땅에 사는 사람들의 노동력까지 얻을 수 있었다.'),
                ('문제', 'dev', '그래서 귀족 관리가 녹읍의 사람들을 모아 군사로 바꿀 수도 있었다.'),
                ('결과', 'res', '신문왕은 관료전을 지급하고 녹읍을 폐지해 귀족의 경제 기반을 줄이고 왕권을 강화했다.')],
         key='관료전 지급 · 녹읍 폐지',
         hook='신문왕 = 김흠돌의 난 진압 + 관료전 지급 + 녹읍 폐지',
         fact='<strong>신문왕 → 관료전 지급·녹읍 폐지</strong>. 왕권을 강화하던 정치 개혁과 토지 제도 개편을 같은 왕의 이야기로 연결한다.',
         stress='너무 많다 싶으면 김흠돌의 난 · 관료전 지급 · 녹읍 폐지만이라도 신문왕으로 꼭 외우라고 짚었어요.',
         next=('귀족의 힘을 줄인 뒤, 넓어진 땅을 다스릴 행정 구역을 나눴다.', False), src='350–354 · 359–360'),
    dict(id='s5', label='통일 신라 · 지방 제도 · 정치', title='커진 나라, 치우친 수도', when='신문왕 · 지방 행정 = 9주 5소경',
         a=('지방관', '수도가 한쪽에 치우쳐 있습니다.'), b=('신문왕', '전국을 9주로 나누고 5소경을 두어 다스리자.'),
         steps=[('배경', 'cause', '통일 뒤 넓어진 땅을 다스려야 했는데, 수도는 나라의 동남쪽에 치우쳐 있었다.'),
                ('전개', 'dev', '신문왕은 전국을 아홉 개의 주로 나누고 주요 지역 다섯 곳에 소경을 두어 9주 5소경을 완성했다.'),
                ('의미', 'item', '5소경은 수도가 동남쪽에 치우친 점을 보완하는 거점이었다.')],
         key='행정 조직 = 9주 5소경',
         hook='9주 5소경은 지방 행정 제도. 다음 컷의 군사 조직과 분리해서 기억!',
         fact='통일 신라의 지방 행정은 <strong>9주 5소경</strong>. <strong>9주</strong>는 전국의 행정 구역, <strong>5소경</strong>은 수도가 동남쪽에 치우친 점을 보완하기 위한 거점이다.',
         stress='숫자 9로 시작하면 통일 신라이고, 9주 5소경 · 9서당 10정을 만든 왕을 물으면 신문왕이라고 짚었어요.',
         next=('행정 구역에 이어, 그 땅을 지킬 군대도 숫자로 짜였다.', False), src='354–357 · 376–377'),
    dict(id='s6', label='통일 신라 · 군사 제도 · 정치·군사', title='행정과 군대는 숫자가 다르다', when='신문왕 · 군사 조직 = 9서당 10정',
         a=('병사', '행정 숫자가 9주·5소경이면 군대는요?'), b=('장수', '중앙 9서당, 지방 10정이다. 헷갈리지 마라!'),
         steps=[('중앙', 'item', '군사 조직은 9서당 10정으로, 중앙군 9서당에는 신라인뿐 아니라 고구려인·백제인·말갈인도 섞여 있었다.'),
                ('지방', 'item', '지방군은 아홉 주에 1정씩 두고 한 곳에만 하나를 더 두어 10정이었다.'),
                ('구분', 'item', '9주 5소경은 지방 행정, 9서당과 10정은 군사 조직이다.')],
         key='군사 조직 = 9서당 10정',
         hook='행정 9주·5소경 / 군사 9서당·10정. 숫자 뒤의 이름까지 붙여 외우자.',
         fact='통일 신라의 군사 조직은 <strong>9서당 10정</strong>. <strong>중앙군 = 9서당</strong>, <strong>지방군 = 10정</strong>이다.',
         stress='문제 풀이에서 ‘고구려·백제·말갈인을 포함한 군대’가 보이면 9서당, 곧 신문왕이라고 짚었어요.',
         next=('지방을 살피는 장치는 군대만이 아니었다.', False), src='357–359 · 466–468'),
    dict(id='s7', label='통일 신라 · 지방 통제 · 정치', title='지방의 힘도, 관리의 행동도 살핀다', when='통일 신라의 지방 통제 · 외사정(문무왕) · 상수리 제도',
         a=('지방 세력가', '수도에 머물라니 감시하려는 겁니까?'), b=('관리', '상수리로 지방 세력을 견제하고 외사정으로 지방관을 살핀다.'),
         steps=[('외사정', 'item', '문무왕은 넓어진 영토의 지방관을 감찰하려고 외사정을 파견했다.'),
                ('상수리', 'item', '상수리 제도는 지방 세력가나 그 자제를 일정 기간 수도에 머물게 해 지방 세력을 견제한 제도다.'),
                ('구분', 'item', '수도에 머무는 사람은 상수리, 지방관을 살피는 관원은 외사정이다.')],
         key='상수리 제도 · 외사정',
         hook='수도에 머무는 사람 → 상수리 / 지방관을 살피는 관원 → 외사정',
         fact='<strong>상수리 제도</strong>: 지방 세력가나 자제를 일정 기간 <strong>수도에 머물게 하여 견제</strong>. <strong>외사정</strong>: <strong>지방관 감찰</strong>을 위해 파견.',
         stress='외사정 파견은 문무왕 때 시작되었고, 상수리 제도가 나와도 통일 신라라고 짚었어요.',
         more=[('흐름 보충 · 중앙 관청', '선택지에 ‘집사부를 비롯한 14부를 설치하였다’가 나오면 통일 신라라고 짚었다. 교재는 위화부·영객부 같은 관청도 신라로 정리한다.')],
         next=('신문왕 뒤에도 땅의 제도는 왕에 따라 다시 바뀌었다.', False), src='346–347 · 374–377'),
    dict(id='s8', label='성덕왕 → 경덕왕 / 마을의 기록 · 경제', title='땅의 제도가 다시 바뀌었다', when='성덕왕 정전 지급 · 경덕왕 녹읍 부활 · 촌락 문서',
         a=('백성', '우리 땅도 나눠 받나요?'), b=('관리', '성덕왕은 정전을 주었고, 경덕왕은 녹읍을 되살렸다.'),
         steps=[('성덕왕', 'item', '성덕왕 때 백성에게 정전을 지급했다는 기록이 있다.'),
                ('경덕왕', 'item', '신문왕의 손자 경덕왕 때 녹읍이 다시 부활했는데, 귀족 세력이 다시 강해졌다는 뜻이다.'),
                ('기록', 'item', '일본 쇼소인에서 발견된 촌락 문서(민정 문서)에는 서원경(지금의 청주) 지역 네 개 촌락의 사정이 자세히 적혀 있다.')],
         key='토지 제도의 변화 · 촌락 문서',
         hook='정전 = 성덕왕 / 녹읍 부활 = 경덕왕 / 촌락 문서 = 촌주·3년',
         fact='<strong>신문왕: 관료전·녹읍 폐지 → 성덕왕: 정전 지급 → 경덕왕: 녹읍 부활</strong>. 조세 징수를 위해 <strong>촌주</strong>가 <strong>3년마다 신라 촌락 문서</strong>를 작성했다.',
         stress='정전 지급이 나오면 통일 신라 전기 상황이라고 짚었어요.',
         next=('여기부터는 같은 시기 북쪽의 발해를 봐요. 발해는 신라 다음에 온 나라가 아니라, 통일 신라와 나란히 북쪽에 있던 나라예요.', True), src='361–363 · 440–442'),
    dict(id='s9', label='발해 · 대조영 · 정치', title='북쪽, 고구려를 잇는 나라가 서다', when='발해 · 대조영(고왕) 건국 · 처음 이름 진국',
         a=('고구려 유민', '동모산에서 다시 시작하자!'), b=('대조영', '고구려 유민과 말갈인을 모아 발해를 세운다.'),
         steps=[('건국', 'item', '고구려가 멸망한 뒤 대조영이 고구려 유민과 말갈인을 모아 동모산에서 발해를 세웠다.'),
                ('이름', 'item', '발해는 처음에 진국이라고도 불렸다.'),
                ('당과', 'item', '교재에는 대조영이 천문령에서 당의 군대를 격파했다는 표현도 있다.')],
         key='대조영 · 동모산 · 발해 건국',
         hook='건국 인물 대조영 / 구성 고구려 유민·말갈인 / 장소 동모산',
         fact='<strong>대조영 → 고구려 유민·말갈인 → 동모산에서 발해 건국</strong>. 발해를 고구려 멸망 뒤의 역사와 연결하자.',
         next=('나라를 세운 대조영의 뒤를 아들 무왕이 이었다.', False), src='443–446'),
    dict(id='s10', label='발해 · 무왕 · 정치·대외 관계', title='무왕, 바다 건너 당을 치다', when='발해 · 무왕 · 연호 인안 · 장문휴의 당 등주 공격',
         a=('무왕', '당의 압박에 물러서지 않겠다.'), b=('장문휴', '인안 연호 아래 등주를 공격하겠습니다!'),
         steps=[('왕', 'item', '대조영의 아들 무왕은 영토를 넓힌 정복 군주였고, 연호를 인안이라 했다.'),
                ('당과', 'item', '무왕은 장문휴를 보내 바다 건너 당의 등주를 공격했다.'),
                ('구분', 'item', '당을 공격한 왕은 무왕이고, 당과 가까이 지낸 왕은 다음 문왕이다.')],
         key='무왕 · 인안 · 등주 공격',
         hook='무왕 = 인안·장문휴·등주 공격',
         fact='<strong>무왕 → 연호 인안 → 장문휴의 당 등주 공격</strong>. 무왕의 대당 강경 노선을 다음 왕의 친선 정책과 대비한다.',
         stress='발해에서 시험에 제일 잘 나오는 왕은 무왕이고, ‘장문휴가 당의 등주를 공격했다’는 표현으로 나온다고 짚었어요.',
         next=('당과 맞섰던 무왕과 달리, 다음 문왕은 당과 가까이 지냈다.', False), src='446–448'),
    dict(id='s11', label='발해 · 문왕 · 정치·대외 교류', title='문왕, 문을 열고 길을 잇다', when='발해 · 문왕 · 연호 대흥 · 당과 친선 · 상경 천도 · 신라도',
         a=('신라 사신', '이번엔 발해와 신라를 잇는 길도 열렸습니다.'), b=('문왕', '당과 교류하고 신라도도 개설하자.'),
         steps=[('당과', 'item', '무왕이 당과 맞섰다면, 그 뒤 문왕은 당과 가까이 지내며 문물을 받아들였다.'),
                ('수도', 'item', '문왕은 수도를 여러 번 옮겼고, 상경으로 천도한 것도 문왕 때다.'),
                ('연호·길', 'item', '문왕의 연호는 대흥이었고, 교재는 신라와 이어지는 교통로인 신라도 개설을 문왕 때로 정리한다.')],
         key='문왕 · 신라도 · 상경 천도',
         hook='무왕은 당 공격 / 문왕은 당과 친선. 신라도는 문왕과 연결!',
         fact='<strong>문왕 → 당과 친선·선진 문물 수용</strong>, <strong>신라도 개설</strong>, <strong>중경 현덕부 → 상경부 천도</strong>. 신라도는 신라와 연결되는 상설 교통로다.',
         stress='시험에 ‘수도를 상경으로 옮겼다’가 나오면 문왕 때라고 짚었어요.',
         next=('시간이 흘러 10대 선왕 때 발해는 가장 넓은 땅을 다스렸다.', False), src='448–450'),
    dict(id='s12', label='발해 · 선왕 · 정치', title='선왕, 바다 동쪽의 융성한 나라', when='발해 · 선왕 · 연호 건흥 · 5경 15부 62주 · 해동성국',
         a=('신하', '발해의 영역이 크게 넓어졌습니다!'), b=('선왕', '5경 15부 62주로 다스려 해동성국을 이루자.'),
         steps=[('왕', 'item', '선왕은 대조영 동생의 고손자로, 이때 발해의 영토가 가장 넓었다.'),
                ('제도', 'item', '넓은 영토를 다스리려고 지방 제도를 5경 15부 62주로 정비했다.'),
                ('이름', 'item', '중국은 이 무렵의 발해를 ‘바다 동쪽의 융성한 나라’라는 뜻으로 해동성국이라 불렀다.'),
                ('연호', 'item', '선왕의 연호는 건흥이었다.')],
         key='선왕 · 해동성국',
         hook='신라 행정 = 9주 5소경 / 발해 행정 = 5경 15부 62주',
         fact='<strong>선왕 → 5경 15부 62주 → 전성기·해동성국</strong>. 해동성국은 바다 동쪽의 융성한 나라라는 뜻으로 이해하자.',
         stress='숫자 62가 나오면 발해라고 짚었어요.',
         next=('넓은 땅의 발해 사람들은 말과 길로 이웃과 오갔다.', False), src='450–454'),
    dict(id='s13', label='발해 · 경제와 무역 · 경제', title='발해 장터의 인기 상품', when='발해의 경제 · 솔빈부의 말 · 발해 5도로 교역',
         a=('상인', '솔빈부의 말과 인삼, 모피가 인기입니다!'), b=('동료', '신라도로 신라와도 교역하자.'),
         steps=[('특산물', 'item', '발해의 특산물로는 솔빈부의 말이 유명했다.'),
                ('교역', 'item', '발해는 신라도를 비롯한 발해 5도를 통해 주변 나라와 교역했다.'),
                ('살림', 'item', '밭농사가 중심이었고 목축도 발달해, 담비 가죽·모피·인삼 등을 수출했다.')],
         key='솔빈부의 말 · 신라도 교역',
         hook='솔빈부의 말 = 발해 / 신라도 = 발해와 신라의 교통·교역로',
         fact='발해는 <strong>밭농사 중심</strong>, 일부 지역에서 벼농사를 지었고 <strong>목축</strong>도 발달했다. 특산물은 <strong>솔빈부의 말</strong>. <strong>담비 가죽·모피·인삼·자기</strong> 등을 수출하고 <strong>신라도</strong>로 신라와 교역했다.',
         stress='발해 사회에서 제일 잘 나오는 것은 솔빈부의 말이라며 꼭 기억하라고 짚었어요.',
         more=[('흐름 보충 · 발해 5도', '강의와 교재는 거란도·영주도·신라도·일본도 등 다섯 길로 주변 나라와 교역했다고 정리한다.')],
         next=('발해는 학교를 세우고, 스스로 고구려를 잇는 나라라고 내세웠다.', False), src='459–461'),
    dict(id='s14', label='발해 · 교육과 계승 의식 · 문화·정치', title='발해는 스스로 누구의 후계라 했을까', when='발해 · 주자감(국립 학교) · 독자적인 연호 · 고구려 계승 의식',
         a=('학자', '발해는 어떤 나라의 후손이라 했을까요?'), b=('사신', '주자감에서 배우고, 고구려 계승도 내세웠습니다.'),
         steps=[('교육', 'item', '발해의 국립 학교는 주자감이었다.'),
                ('연호', 'item', '발해는 인안·대흥·건흥처럼 독자적인 연호를 썼다.'),
                ('계승', 'item', '발해는 일본에 보낸 국서에서 ‘고려’, ‘고려 국왕’이라는 이름을 써 고구려를 잇는 나라임을 내세웠다.')],
         key='주자감 · 고구려 계승',
         hook='여기서 ‘고려’는 고구려 계승을 나타내는 표현. 뒤에 세워질 왕건의 고려와 혼동하지 말자.',
         fact='발해의 유학 교육 기관은 <strong>주자감</strong>. 일본에 보낸 국서에서 <strong>고려·고려 국왕</strong>이라는 호칭을 사용하며 <strong>고구려 계승</strong>을 표방했다.',
         stress='주자감이 발해의 학교였다는 것은 중요하니 꼭 외우라고 짚었어요.',
         more=[('선택 심화 · 발해의 중앙 관제(3성 6부)', '발해는 당의 3성 6부 관제를 받아들이되 이름은 독자적으로 지었다. 정당성의 장관인 대내상이 나라 일을 총괄했고, 좌사정·우사정이 6부를 나누어 맡았다. 감찰 기관 중정대, 서적을 관리한 문적원도 있었다. 강의는 이 관제를 100점을 목표로 하는 사람만 외우라고 했고, 어느 왕 때인지는 밝히지 않았다.')],
         next=('여기부터는 두 나라의 문화를 주제별로 봐요. 왕의 순서가 아니라 주제로 묶어서, 인물마다 활동한 때가 서로 겹쳐요.', True), src='454–459 · 473–474'),
    dict(id='s15', label='통일 신라 · 유학 교육의 흐름 · 문화·제도', title='학교를 세우고, 가르치고, 뽑는다', when='통일 신라의 유학 교육 · 국학(신문왕) · 독서삼품과(원성왕, 혜공왕 피살 뒤)',
         a=('학생', '공부하면 관리가 될 수 있나요?'), b=('스승', '국학에서 배우고, 원성왕 때 독서삼품과로 경전 실력을 본다.'),
         steps=[('학교', 'item', '신문왕은 국학을 세워 유학을 가르쳤고, 경덕왕 때 국학에 박사와 조교를 두었다.'),
                ('선발', 'item', '혜공왕이 피살된 뒤의 원성왕은 관리를 뽑으려고 유교 경전을 이해한 정도를 시험하는 독서삼품과를 시행했다.'),
                ('구분', 'item', '학교를 세운 것은 신문왕, 관리 선발 시험을 시도한 것은 원성왕이다.')],
         key='국학 → 박사·조교 → 독서삼품과',
         hook='학교 설립은 신문왕 / 박사·조교는 경덕왕 / 독서삼품과는 원성왕',
         fact='<strong>신문왕: 국학 설립 → 경덕왕: 박사·조교 배치 → 원성왕: 독서삼품과 실시</strong>. <strong>독서삼품과</strong>는 유교 경전 이해 수준에 따라 관리를 선발하는 제도다.',
         stress='‘관리 선발을 위해 독서삼품과를 시행하였다’가 나오면 통일 신라 원성왕 때라고 짚었어요.',
         next=('유학을 익힌 6두품 학자 설총은 글과 이야기로 왕에게 조언했다.', False), src='359 · 364–367 · 470'),
    dict(id='s16', label='통일 신라 · 설총 · 문화·문학', title='꽃들의 이야기로 왕에게 조언하다', when='6두품 학자 설총 · 이두 · 화왕계',
         a=('설총', '꽃들의 이야기로 왕께 바른 말을 전하겠습니다.'), b=('왕', '이두와 화왕계로 백성의 말과 정치를 잇는구나.'),
         steps=[('인물', 'item', '설총은 원효의 아들이자 6두품 출신 학자다.'),
                ('이두', 'item', '설총은 한자의 음과 뜻을 빌려 우리말을 적는 이두를 정리했다.'),
                ('글', 'item', '설총은 꽃들의 이야기로 왕에게 바른 정치를 권하는 화왕계를 지었다.')],
         key='설총 · 이두 · 화왕계',
         hook='설총의 짝: 이두·화왕계',
         fact='<strong>설총 → 이두 정리·「화왕계」</strong>. <strong>이두</strong>는 한자의 <strong>음과 훈을 빌려</strong> 우리말을 적는 방식이다. <strong>화왕계</strong>는 왕에게 조언하는 내용의 글이다.',
         stress='‘화왕계를 지었다’, ‘이두 문자를 정리했다’가 나오면 설총이라고 짚었어요.',
         more=[('흐름 보충 · 6두품 3대장', '강의는 골품제 때문에 높은 벼슬에 오르지 못했지만 능력이 뛰어났던 6두품으로 최치원·강수·설총을 꼽았다. 강수는 당에 잡혀 있던 김인문을 풀어 달라는 외교 문서 「청방인문표」를 썼다. 원측과 『해심밀경소』는 주로 오답 선택지로 나온다고 했다.')],
         next=('유학과 함께 불교도 사람들 곁으로 다가갔다. 설총의 아버지가 원효다.', False), src='426–439'),
    dict(id='s17', label='통일 신라 · 원효 · 문화·불교', title='원효, 사람들 속으로 들어가다', when='원효 · 불교 대중화 · 일심 사상 · 화쟁 사상',
         a=('백성', '불교가 어렵게만 느껴집니다.'), b=('원효', '노래와 쉬운 가르침으로 누구나 다가오게 하리라.'),
         steps=[('깨달음', 'cause', '원효는 의상과 당으로 유학을 떠났다가, 밤에 마신 물이 해골 물이었음을 알고 모든 것이 마음먹기에 달렸다고 깨달아 유학을 가지 않았다는 이야기가 전한다.'),
                ('대중화', 'dev', '원효는 어려운 경전을 읽지 않아도 ‘나무아미타불’만 외우면 누구나 극락에 갈 수 있다고 가르치고 무애가를 지어 불교 대중화에 힘썼다.'),
                ('사상', 'item', '원효는 일체유심조와 일심 사상, 화쟁 사상을 말했고, 『대승기신론소』·『금강삼매경론』·『십문화쟁론』 등을 남겼다.')],
         key='원효 · 무애가 · 불교 대중화',
         hook='원효 = 무애가·불교 대중화 / 다음 컷의 의상과 구분',
         fact='<strong>원효 → 『대승기신론소』·『십문화쟁론』</strong>, <strong>「무애가」</strong>, <strong>불교 대중화</strong>. 책 이름과 노래를 한 인물에게 연결한다.',
         stress='마음이 중요하니 마음 심(心) 자가 많이 들어간 일체유심조 · 일심 사상, 그리고 화쟁 사상이 나오면 원효라고 짚었어요.',
         next=('원효와 같은 시대 사람인 의상은 당에 다녀와 화엄 사상을 펼쳤다.', False), src='411–418'),
    dict(id='s18', label='통일 신라 · 의상 · 문화·불교', title='의상, 화엄의 세계를 펼치다', when='의상 · 화엄 사상 · 화엄일승법계도 · 부석사 · 관음 신앙',
         a=('제자', '스님의 가르침을 어디에 담을까요?'), b=('의상', '화엄의 뜻을 법계도에 펼치고 부석사를 세우자.'),
         steps=[('유학', 'item', '의상은 당으로 유학을 다녀와 화엄 사상을 펼쳤다.'),
                ('정리', 'item', '의상은 화엄일승법계도로 화엄 사상을 정리하고, 영주 부석사를 세웠다.'),
                ('신앙', 'item', '의상은 관음 신앙도 강조했다.')],
         key='의상 · 부석사 · 화엄',
         hook='의상 = 부석사·화엄·화엄일승법계도',
         fact='<strong>의상 → 부석사 등 사찰 창건 → 화엄 사상 전파 → 「화엄일승법계도」</strong>. 법계도는 화엄 사상을 정리한 그림이다.',
         stress='관음 신앙이 나와도 의상이라고 짚었어요.',
         next=('불교를 배우려는 발길은 혜초를 인도까지 이끌었다.', False), src='418–420'),
    dict(id='s19', label='통일 신라 · 혜초 · 문화·대외 교류', title='혜초, 먼 길의 기록을 남기다', when='혜초 · 인도 순례 · 『왕오천축국전』',
         a=('제자', '먼 나라까지 다녀오셨습니까?'), b=('혜초', '인도와 중앙아시아의 여정을 왕오천축국전에 남겼다.'),
         steps=[('순례', 'item', '혜초는 지금의 인도 지역을 순례하고 돌아와 여행기 『왕오천축국전』을 남겼다.'),
                ('구분', 'item', '원효는 불교 대중화, 의상은 화엄 사상, 혜초는 순례 기록이다.')],
         key='혜초 · 왕오천축국전',
         hook='원효는 대중화 / 의상은 화엄 / 혜초는 순례 기록',
         fact='<strong>혜초 → 인도·중앙아시아 순례 → 『왕오천축국전』</strong>. 사람 이름과 여행기의 제목을 한 쌍으로 기억한다.',
         stress='혜초는 거의 오답 선택지로 등장한다고 짚었어요.',
         next=('절과 탑에도 이 시대의 불교가 남았다.', False), src='420–421'),
    dict(id='s20', label='통일 신라 · 인쇄술 · 문화·기술', title='돌탑 안에서 나온 오래된 인쇄물', when='경덕왕 때 불국사(김대성) · 불국사 3층 석탑 · 무구정광대다라니경',
         a=('승려', '탑 안에서 오래된 경전이 나왔습니다!'), b=('동료', '무구정광대다라니경, 불국사 3층 석탑에서 발견됐어.'),
         steps=[('절', 'item', '통일 신라의 대표 문화재 불국사는 경덕왕 때 김대성의 주도로 만들어졌고, 다보탑과 불국사 3층 석탑이 있다.'),
                ('발견', 'dev', '불국사 3층 석탑을 보수하던 중 탑 안에서 두루마리로 말린 무구정광대다라니경이 나왔다.'),
                ('의미', 'res', '무구정광대다라니경은 현존하는 세계에서 가장 오래된 목판 인쇄물로 알려져 있다.')],
         key='무구정광대다라니경 · 목판 인쇄',
         hook='무구정광대다라니경 = 목판 인쇄 / 발견 장소 = 불국사 3층 석탑',
         fact='<strong>『무구정광대다라니경』 → 불국사 3층 석탑 안에서 발견</strong>. 현존하는 세계 최고(最古)의 <strong>목판 인쇄물</strong>로 알려져 있다. 여기서 최고는 ‘가장 오래된’이라는 뜻이다.',
         stress='불국사 3층 석탑과 무구정광대다라니경은 세트로도 가끔 문제에 나온다고 짚었어요.',
         more=[('흐름 보충 · 신문왕 · 경덕왕 때의 문화재', '신문왕은 아버지 문무왕을 기리는 감은사를 짓고 감은사지 3층 석탑을 세웠다. 나라의 근심을 없애 준다는 피리 만파식적 이야기도 신문왕 때다. 석굴암도 불국사처럼 경덕왕 때 만들어졌다.')],
         next=('신라 말로 가면 경전보다 참선을 앞세운 선종이 퍼졌다.', False), src='363 · 402–411'),
    dict(id='s21', label='통일 신라 후기 · 선종 · 문화·불교', title='후기로 갈수록, 마음의 수행을 찾다', when='통일 신라 말 · 선종 유행 · 9산 선문 · 승탑',
         a=('승려', '마음을 닦는 수행을 찾는 이가 늘었습니다.'), b=('장인', '통일 신라 후기 선종과 승탑이 유행했지.'),
         steps=[('선종', 'item', '통일 신라 말에는 어려운 경전보다 참선과 수행으로 깨달음을 얻으라는 선종이 유행했다.'),
                ('퍼짐', 'dev', '선종은 글을 못 읽는 백성에게도 인기가 많았고, 전국 아홉 산의 9산 선문을 중심으로 퍼졌다.'),
                ('탑', 'res', '선종과 함께 승려의 사리를 모신 승탑이 유행했고, 대표 사례가 화순 쌍봉사 철감선사탑이다.')],
         key='선종 확산 · 승탑 유행',
         hook='선종과 승탑은 통일 신라 후기 문화의 연결 고리',
         fact='통일 신라 후기 <strong>선종 확산 → 승탑 유행</strong>. 대표 사례는 <strong>쌍봉사 철감선사 승탑</strong>이다. 승탑은 승려의 사리나 유골을 모신 탑이다.',
         stress='키가 작고 둥글둥글한 탑이 나오면 승탑, 곧 통일 신라 말에 유행한 선종으로 연결하라고 짚었어요.',
         next=('절과 탑에 이어 이번엔 무덤을 본다.', False), src='421–425'),
    dict(id='s22', label='통일 신라 · 무덤 · 문화', title='신라의 무덤도 달라졌다', when='통일 신라의 무덤 · 굴식 돌방무덤 · 둘레돌의 12지 신상',
         a=('신라 사람', '옛 무덤과 달라 보이네요.'), b=('안내자', '통일 신라는 굴식 돌방무덤과 12지 신상을 기억해.'),
         steps=[('무덤', 'item', '통일 신라에서는 굴식 돌방무덤을 만들었다.'),
                ('장식', 'item', '무덤 둘레돌에는 12지 신상을 새겼다.'),
                ('구분', 'item', '삼국 시대 신라의 돌무지 덧널무덤과 구분한다.')],
         key='굴식 돌방무덤 · 12지 신상',
         hook='삼국 신라 = 돌무지 덧널무덤 / 통일 신라 = 굴식 돌방무덤·12지 신상',
         fact='통일 신라에는 <strong>굴식 돌방무덤</strong>이 만들어졌고, 무덤의 <strong>둘레돌에 12지 신상</strong>을 새겼다.',
         next=('같은 시기 북쪽 발해의 무덤에는 고구려의 흔적이 남았다.', False), src=None),
    dict(id='s23', label='발해 · 공주들의 무덤 · 문화·계승', title='천장에도 남은 고구려의 흔적', when='발해의 무덤 · 정혜공주묘(모줄임 천장 · 돌사자상) · 고구려 계승',
         a=('발해 사람', '우리 무덤에도 고구려 흔적이 있나요?'), b=('안내자', '정혜공주묘의 굴식 돌방과 모줄임 천장을 보렴.'),
         steps=[('계승', 'cause', '발해는 고구려를 계승한 나라라서, 그것을 보여 주는 문화재가 중요하다.'),
                ('무덤', 'item', '정혜공주묘는 고구려처럼 모줄임 천장 구조를 갖추었고, 입구에 돌사자상이 있다.'),
                ('생활', 'item', '온돌 유적도 발해가 고구려를 이었음을 보여 준다.')],
         key='정혜공주묘 · 모줄임 천장',
         hook='정‘혜’공주묘 = 고구려 양식·굴식 돌방·모줄임 천장',
         fact='발해의 대표 무덤은 <strong>정효공주묘·정혜공주묘</strong>. 이 중 <strong>정혜공주묘</strong>는 고구려 양식을 계승한 <strong>굴식 돌방무덤·모줄임 천장</strong>이 특징이다.',
         stress='발해는 고구려를 계승한 나라니 그것을 증명하는 정혜공주묘와 온돌이 중요하다고 짚었어요.',
         more=[('흐름 보충 · 발해의 다른 문화재', '두 부처가 나란히 앉은 이불병좌상, 영광탑, 석등도 발해의 문화재다. 교재는 정효공주묘로 발해의 유교 수준을 확인할 수 있다고 정리한다.')],
         next=('다시 남쪽 바다로 가면, 장보고가 바닷길을 이끌었다.', False), src='461–465'),
    dict(id='s24', label='통일 신라 · 장보고 · 경제·대외 교류', title='장보고, 바닷길의 중심에 서다', when='통일 신라 · 장보고 · 완도 청해진 · 해상 무역 · 법화원',
         a=('상인', '바닷길에 해적이 들끓습니다.'), b=('장보고', '완도에 청해진을 세워 해상 무역을 지키겠다.'),
         steps=[('거점', 'item', '해상왕 장보고는 완도에 청해진을 세우고 해상 무역을 펼쳤다.'),
                ('당에', 'item', '장보고는 당의 산둥반도에 법화원이라는 절도 지었다.'),
                ('무역항', 'item', '통일 신라의 국제 무역항으로는 울산항·당항성·영암이 있었고, 수도에는 동시 외에 서시와 남시를 더 두었다.')],
         key='장보고 · 완도 · 청해진',
         hook='장보고 = 완도·청해진·해상 무역',
         fact='<strong>장보고 → 완도·청해진 설치 → 해상 무역</strong>. 사람·장소·거점·활동을 한 장면으로 묶자.',
         next=('여기부터는 혜공왕 피살 뒤 흔들리는 신라와 후삼국을 봐요. 다시 시간 순서예요.', True), src='377–381'),
    dict(id='s25', label='통일 신라 하대 · 정치 동요 · 정치', title='왕위를 둘러싼 싸움이 커지다', when='신라 하대(후기) · 혜공왕 피살 → 김헌창의 난 → 장보고의 난',
         a=('신하', '왕위를 두고 진골 귀족들이 계속 다툽니다.'), b=('백성', '중앙의 힘이 약해지고 나라가 흔들리는군요.'),
         steps=[('시작', 'cause', '무열왕의 마지막 직계 후손인 혜공왕이 피살된 뒤 통일 신라 후기(하대)가 되고, 진골 귀족의 왕위 다툼이 심해졌다.'),
                ('김헌창', 'dev', '김헌창은 아버지 김주원이 왕이 되지 못하자 웅천주에서 반란을 일으켰다.'),
                ('장보고', 'dev', '그 뒤 청해진의 장보고도 반란을 일으켰다.'),
                ('결과', 'res', '왕이 자주 바뀌며 중앙 정치가 흔들렸다.')],
         key='귀족의 왕위 다툼 · 중앙의 동요',
         hook='김흠돌의 난 = 신문왕의 왕권 강화 / 김헌창의 난 = 신라 하대의 동요',
         fact='신라 하대 <strong>진골 귀족의 왕위 다툼·정치 혼란</strong> 속에서 <strong>김헌창의 난·장보고의 난</strong> 등이 발생했다. 지방에서는 새로운 세력이 성장했다.',
         stress='혜공왕 피살 → 김헌창의 난 → 장보고의 난의 순서를 많이 묻는다고 짚었어요.',
         more=[('흐름 보충 · 혜공왕 때의 반란', '교재는 혜공왕 때 각간 대공의 반란(96각간의 난)부터 권력 다툼이 시작되었다고 정리한다.')],
         next=('흔들리는 신라에서 6두품 최치원이 진성여왕에게 개혁을 건의했다.', False), src='364–371'),
    dict(id='s26', label='통일 신라 · 최치원과 진성여왕 · 사회·정치', title='최치원의 개혁 건의', when='진성여왕 · 6두품 최치원 · 시무 10여 조',
         a=('최치원', '골품제의 벽을 고치고 정치를 바로잡아야 합니다.'), b=('신하', '진성여왕께 시무 10여 조를 올렸습니다.'),
         steps=[('인물', 'item', '6두품 최치원은 어려서 당에 유학해 과거에 급제하고 당의 관리로 일했으며, 황소의 난 때 격황소서를 써 이름을 알렸다.'),
                ('건의', 'dev', '신라로 돌아온 최치원은 진성여왕에게 개혁안인 시무 10여 조를 건의했다.'),
                ('결과', 'res', '건의는 받아들여지지 않았고, 최치원은 가야산으로 들어갔다고 전한다.')],
         key='최치원 · 시무 10여 조',
         hook='최치원 = 육두품·시무 10여 조·진성여왕',
         fact='<strong>육두품 → 골품제 비판</strong>. <strong>최치원 → 진성여왕에게 시무 10여 조 건의</strong>. 학문적 능력과 신분제의 제약, 개혁 요구를 연결한다.',
         next=('개혁은 받아들여지지 않았고, 같은 진성여왕 때 농민 봉기가 번졌다.', False), src='372–374 · 426–433'),
    dict(id='s27', label='통일 신라 · 진성여왕 때 · 사회·경제', title='견디지 못한 농민들이 일어서다', when='진성여왕 · 원종과 애노의 봉기(사벌주)',
         a=('농민', '세금과 수탈을 더는 견디기 어렵습니다!'), b=('동료', '원종과 애노의 봉기가 일어났다.'),
         steps=[('배경', 'cause', '중앙의 왕위 다툼이 이어지는 동안 세금과 수탈로 농민의 삶이 어려워졌다.'),
                ('봉기', 'dev', '진성여왕 때 전국 곳곳에서 반란이 일어났고, 대표적인 것이 사벌주에서 일어난 원종과 애노의 봉기다.'),
                ('구분', 'item', '진성여왕 때의 두 장면은 최치원의 개혁 건의와 원종과 애노의 봉기다.')],
         key='원종과 애노의 난 · 농민 봉기',
         hook='진성여왕의 두 장면: 최치원의 개혁 건의 / 원종과 애노의 농민 봉기',
         fact='신라 후기 <strong>농민 몰락 → 유랑·초적 증가</strong>. <strong>진성여왕 때 원종과 애노의 난</strong> 등 농민 봉기가 발생했다.',
         stress='혼란스러운 통일 신라 후기를 대표하는 왕이 진성여왕이고, 그때의 대표 반란이 원종과 애노의 반란이라고 짚었어요.',
         more=[('흐름 보충 · 삼대목', '진성여왕 때 향가를 모은 『삼대목』이 만들어졌다.')],
         next=('중앙이 흔들린 지방에서는 호족이 힘을 키웠다.', False), src='371–373 · 442'),
    dict(id='s28', label='신라 말 · 지방 호족 · 정치·사회', title='왕의 힘이 약해진 곳을 누가 채울까', when='신라 말 · 중앙 통제 약화 → 지방 호족 성장',
         a=('지방민', '중앙에서 우리를 다스리지 못합니다.'), b=('호족', '이제 이 지역은 우리가 지키고 이끈다.'),
         steps=[('배경', 'cause', '중앙이 권력 다툼에 빠져 지방을 제대로 돌보지 못했다.'),
                ('성장', 'dev', '그 틈에 지방에서 호족이라는 새로운 세력이 자라났다.'),
                ('이름', 'item', '호족은 스스로 성주나 장군이라 불렀고, 교재는 양길 같은 인물을 예로 든다.')],
         key='중앙 약화 → 지방 호족 성장',
         hook='호족 = 신라 말 지방에서 성장한 유력 세력',
         fact='신라의 <strong>중앙 통제력 약화 → 지방 호족 성장 → 반독립적 세력 형성</strong>. 귀족의 다툼과 농민의 동요가 후삼국으로 넘어가는 배경이다.',
         next=('호족 가운데 견훤이 먼저 완산주에서 후백제를 세웠다.', False), src='381–382'),
    dict(id='s29', label='후삼국으로 · 견훤 · 정치·대외 관계', title='견훤, 후백제의 깃발을 들다', when='후백제 · 견훤 · 완산주(지금의 전주) · 후당·오월과 외교',
         a=('견훤', '완산주에 도읍을 두고 후백제를 세우겠다!'), b=('백성', '남쪽에 새 나라가 섰다.'),
         steps=[('건국', 'item', '견훤은 지금의 전주인 완산주를 도읍으로 삼아 후백제를 세웠다.'),
                ('외교', 'item', '후백제는 중국의 후당과 오월에 사신을 보냈다.'),
                ('공격', 'item', '견훤은 신라의 수도 경주를 습격해 경애왕을 죽게 했다.')],
         key='견훤 · 완산주 · 후백제',
         hook='견훤·후백제·완산주를 한 묶음으로',
         fact='<strong>견훤 → 완산주·후백제 건국</strong>. 중국 <strong>후당·오월</strong> 등과 외교 관계를 맺었고, 신라 <strong>금성을 습격하여 경애왕을 살해</strong>했다.',
         next=('이어 궁예가 후고구려를 세워, 후삼국이 되었다.', False), src='383–385 · 389–391'),
    dict(id='s30', label='후삼국으로 · 궁예 · 정치', title='궁예, 또 다른 나라를 세우다', when='후고구려 · 궁예 · 광평성 · 국호 마진 · 태봉 · 송악 → 철원',
         a=('궁예', '송악에서 후고구려를 열겠다!'), b=('신하', '마진으로 이름을 바꾸고 철원으로 옮기셨다.'),
         steps=[('건국', 'item', '궁예는 송악에서 후고구려를 세웠다.'),
                ('기구', 'item', '궁예는 광평성을 비롯한 정치 기구를 마련했다.'),
                ('변화', 'dev', '궁예는 국호를 마진으로 바꾸고 도읍을 송악에서 철원으로 옮겼으며, 뒤에 국호를 다시 태봉으로 바꾸었다.'),
                ('결과', 'res', '폭정으로 쫓겨난 궁예 대신 왕건이 왕으로 추대되었고, 왕건은 나라 이름을 고려라 했다.')],
         key='궁예 · 송악 → 철원',
         hook='후백제 견훤은 완산주 / 후고구려 궁예는 송악에서 시작',
         fact='<strong>궁예 → 송악·후고구려 건국 → 국호를 마진으로 변경·철원 천도</strong>. 이 편에서는 첨부 자료에 나온 흐름까지 연결한다.',
         stress='후고구려에서 시험에 제일 잘 나오는 것은 광평성이라고 짚었어요.',
         next=('남쪽이 셋으로 나뉜 무렵, 북쪽 발해는 거란의 침입으로 무너졌다. 남쪽 일과는 따로 일어난 일이다.', False), src='385–389 · 470–471'),
    dict(id='s31', label='발해 · 10세기 초 · 정치·대외 관계', title='북쪽의 강국도 무너지다', when='북쪽 · 10세기 초 거란의 침입 → 발해 멸망',
         a=('발해 사신', '거란의 침입을 막기 어렵습니다.'), b=('백성', '해동성국 발해가 끝내 무너지는구나.'),
         steps=[('멸망', 'item', '발해는 10세기 초 거란의 침입으로 멸망했다.'),
                ('구분', 'item', '발해의 멸망은 거란의 침입 때문이고, 남쪽의 후삼국 통일과는 따로 일어난 일이다.')],
         key='거란의 침입 → 발해 멸망',
         hook='발해를 멸망시킨 세력 = 거란',
         fact='발해는 <strong>10세기 초 거란의 침입으로 멸망</strong>했다. <strong>고구려를 계승하여 성장한 발해</strong>의 이야기와, 남쪽의 <strong>후삼국 형성</strong>을 구분해 연결한다.',
         next=('다시 남쪽으로 돌아오면, 후삼국은 고려로 하나가 되어 간다.', False), src=None),
    dict(id='s32', label='남북국 시대 편 · 끝 · 전체 흐름', title='이제, 무대는 후삼국으로', when='후삼국 통일 과정 · 공산 → 고창 → 신라 항복 → 일리천',
         a=('학생', '남쪽 신라와 북쪽 발해, 이후엔 어떻게 되나요?'), b=('기록자', '신라 하대의 혼란과 후삼국이 고려 건국으로 이어진다.'),
         steps=[('공산', 'item', '견훤이 경주를 습격하자 신라를 도우러 간 왕건이 대구 근처 공산 전투에서 크게 졌고, 신숭겸이 전사했다.'),
                ('고창', 'dev', '고려는 다시 힘을 모아 고창 전투에서 견훤에게 크게 이겼고, 왕건은 고창을 안동이라 이름 붙였다.'),
                ('항복', 'dev', '후백제에서는 신검이 아버지 견훤을 금산사에 가두었고, 견훤은 왕건에게 투항했다. 이어 신라의 마지막 왕 경순왕(김부)이 고려에 항복했고, 왕건은 그를 경주의 사심관으로 삼았다.'),
                ('통일', 'res', '마지막으로 왕건이 일리천 전투에서 신검에게 이겨 후백제가 멸망하고 고려가 후삼국을 통일했다.')],
         key='남북국에서 후삼국으로',
         hook='후삼국 = 신라·후백제·후고구려. 다음 편은 고려로 이어지는 과정!',
         fact='신라의 흐름은 <strong>신문왕의 왕권 강화 → 하대의 동요 → 호족·후삼국</strong>. 발해의 흐름은 <strong>대조영 → 무왕(공격) → 문왕(교류) → 선왕(전성기) → 거란에 멸망</strong>이다.',
         stress='공산 전투 · 고창 전투 · 신라 멸망 · 일리천 전투의 순서를 많이 물으니 앞 글자를 따서 ‘공고신일’로 외우라고 짚었어요.',
         next=None, src='388–401 · 471–473'),
]

NAMBUK_CSS = ('<style id="hanq-nambuk-story">/* 남북국: 흐름 머리 → 왕·시기 줄 → 그림(원본 칸 전체 SVG · 비율 먼저) → 그림 밖 말풍선 → 설명 → 핵심 줄 · 구분 · 강의 강조 → (덩어리 끝) 이 부분에서 외울 것 → 다음 장면 잇기 */'
              'html{scroll-behavior:smooth}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}'
              '.n-story .scene{padding:0 0 22px;border-bottom:0;opacity:1!important;transform:none!important;content-visibility:visible!important}'
              '.n-story .n-head{padding:18px 18px 12px}.n-story .n-head .meta{padding:0;font-size:13px;color:#667085;font-weight:800}'
              '.n-story .n-head h2{padding:0;font-size:clamp(22px,6vw,28px);line-height:1.25;letter-spacing:-.04em;margin:6px 0 6px;word-break:keep-all}'
              '.n-story .n-when{margin:0;color:#a72d27;font-size:14.5px;line-height:1.5;font-weight:850;word-break:keep-all;overflow-wrap:anywhere}'
              # 그림: 예전 .frame 배경 늘이기(200%×4xx%)는 쓰지 않는다. SVG viewBox = 그 장면의 칸 사각형 전체, 칸 비율(--n-ar)로 그림을 불러오기 전에 자리를 잡는다
              '.n-story .n-art{margin:0;background:#d9dce0;line-height:0}.n-story .n-panel{display:block;width:100%;height:auto;aspect-ratio:var(--n-ar)}'
              '.n-art-cap{margin:6px 18px 0;font-size:13px;font-weight:750;line-height:1.5;color:#4b5565}'
              '.n-talk-cap{margin:12px 18px 0;font-size:13px;font-weight:800;line-height:1.4;color:#5b6576}'
              '.n-talk{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin:8px 18px 0}'
              '.n-talk p{margin:0;padding:10px 12px 11px;background:#fff;border:2px solid #26384c;border-radius:16px 16px 16px 5px;color:#243248;line-height:1.5}'
              '.n-talk p+p{background:#eef6ff;border-color:#315d80;border-radius:16px 16px 5px 16px}'
              '.n-talk b{display:block;margin-bottom:4px;font-size:14px;font-weight:900;color:#b52d34}.n-talk p+p b{color:#315d80}'
              '.n-talk span{display:block;font-size:16px;font-weight:700;word-break:keep-all;overflow-wrap:anywhere}'
              '.n-steps{list-style:none;margin:12px 18px 0;padding:0;display:grid;gap:7px}'
              '.n-steps li{display:grid;grid-template-columns:3.6em minmax(0,1fr);gap:8px;align-items:baseline;font-size:16px;line-height:1.65;color:#2b3443;word-break:keep-all;overflow-wrap:anywhere}'
              '.n-steps .st{display:block;padding:1px 2px;border-radius:6px;text-align:center;font-size:12.5px;font-weight:900;line-height:1.5;background:#eef1f4;color:#4b5565}'
              '.n-steps .st.dev{background:#fff0e9;color:#a72d27}.n-steps .st.res{background:#e9f4ec;color:#2f6b3c}.n-steps .st.item{background:#f6f1e7;color:#7a5a24}'
              '.n-steps strong,.n-mem strong{color:#b52d34;font-weight:900}'
              '.n-story .scene>.key{margin:12px 18px 0;padding:10px 12px;border-left:4px solid #d83b32;background:#fff0e9;color:#a72d27;font-size:15px;font-weight:850;line-height:1.55;word-break:keep-all;overflow-wrap:anywhere}'
              '.n-hook{margin:8px 18px 0;font-size:15px;line-height:1.6;color:#35556b;font-weight:750;word-break:keep-all;overflow-wrap:anywhere}.n-hook b{margin-right:6px;padding:1px 7px;border-radius:6px;background:#eaf1f5;font-size:12.5px;font-weight:900}'
              '.n-hook a{color:#294d87;text-decoration:underline;text-underline-offset:2px}'
              '.n-stress{margin:8px 18px 0;font-size:14px;line-height:1.55;color:#294d87;font-weight:750;word-break:keep-all}.n-stress b{margin-right:6px;padding:1px 7px;border-radius:6px;background:#eef2f8;font-size:12.5px;font-weight:900}'
              '.n-story .scene-more{margin:10px 18px 0;padding:4px 12px;border:1px dashed #d6c7a3;border-radius:10px;background:#fffaf0;font-size:15px;line-height:1.6;color:#3d4859}'
              '.n-story .scene-more>summary{display:flex;align-items:center;min-height:44px;cursor:pointer;font-weight:850}.n-story .scene-more>summary:focus-visible{outline:3px solid #294d8766;outline-offset:2px;border-radius:6px}.n-story .scene-more p{margin:2px 0 10px}'
              '.n-story .scene-more strong{color:#bd272c;font-weight:850}'
              '.n-story .n-flow{padding:18px 18px 16px;background:#17243a;color:#fff}.n-story .n-flow:focus{outline:3px solid #f0b593;outline-offset:-3px}'
              '.n-story .n-flow small{display:block;color:#f0b593;font-size:13px;font-weight:800;letter-spacing:0}.n-story .n-flow h2{margin:4px 0 0;padding:0;color:#fff;font-size:clamp(20px,5.5vw,24px);line-height:1.3;word-break:keep-all}'
              '.n-story .n-flow p{margin:6px 0 0;font-size:15px;line-height:1.6;color:#dce5f0;word-break:keep-all}'
              '.n-mem{margin:0;padding:16px 18px 18px;background:#fff8e8;border-top:4px solid #e5a337;border-bottom:1px solid #f0dfb8}'
              '.n-mem-label{margin:0 0 8px;font-size:17px;font-weight:900;color:#7a4b0d}.n-mem-k+.n-mem-k{margin-top:14px;padding-top:12px;border-top:1px dashed #e3cf9f}'
              '.n-mem-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 10px;margin:0 0 6px}.n-mem-t{font-size:17px;font-weight:900}.n-mem-w{font-size:14px;font-weight:800;color:#294d87}'
              '.n-mem-story p{margin:0 0 6px;font-size:16px;line-height:1.7;color:#243248;word-break:keep-all;overflow-wrap:anywhere}'
              '.n-memo{margin:8px 0;padding:10px 12px;border-left:4px solid #e5a337;border-radius:8px;background:#fff}.n-memo b{display:block;font-size:14px;font-weight:900}.n-memo p{margin:4px 0 0;font-size:16px;line-height:1.7}.n-memo p+p{font-size:15px;color:#5b4a26}'
              '.n-mem-x{margin:8px 0 0;font-size:16px;line-height:1.7;color:#3b3220;word-break:keep-all;overflow-wrap:anywhere}.n-mem-x b{margin-right:6px;padding:1px 7px;border-radius:6px;background:#fce9e5;color:#8f2a26;font-size:13px;font-weight:900}'
              '.n-keys{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:8px 0 0}.n-keys-label{font-size:13px;font-weight:900;color:#5b6576}.n-key{padding:3px 9px;border-radius:999px;background:#fce9e5;color:#8f2a26;font-size:14px;font-weight:850}'
              '.n-guide{margin:12px 0 0;padding:0;list-style:none;font-size:14px;line-height:1.6;color:#d9e0e8}.n-guide b{color:#f0b593}'
              '.n-story .chapter-line{padding:15px 22px;background:#e6e9ed;color:#314057;font-weight:800;font-size:14px;line-height:1.6;word-break:keep-all}'
              '.n-story .story-seam.n-switch{background:#e6e9ed;color:#17243a;font-weight:850}'
              '.n-story .end{padding:22px 18px 8px}.n-story .end p{font-size:16px;line-height:1.7}.n-story .end a{display:inline-flex;align-items:center;min-height:44px;font-weight:850;color:#294d87}'
              # 흐름 바로 가기 줄(다른 강의 구성 웹툰과 같은 방식): 높이 60px 고정, 좁은 화면에서 오른쪽 92px는 홈 버튼 자리, 가로 스크롤은 안쪽 트랙에서만. 예전 공용 nav 규칙(줄바꿈·작은 글씨)을 덮는다
              '.n-story nav.n-nav{position:sticky;top:0;z-index:5;height:60px;box-sizing:border-box;display:flex;flex-wrap:nowrap;align-items:center;margin:0;padding:0 92px 0 10px;background:#edf0f4;border-bottom:1px solid #d9dee5}'
              '.n-story .n-nav-track{display:flex;align-items:center;gap:6px;min-width:0;width:100%;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scrollbar-width:none}.n-story .n-nav-track::-webkit-scrollbar{display:none}'
              '.n-story nav.n-nav a{flex:none;display:inline-flex;align-items:center;min-height:44px;padding:0 14px;color:#263a55;font-weight:800;font-size:14px;text-decoration:none;background:#fff;border:1px solid #d4dae1;border-radius:99px;white-space:nowrap}'
              '.n-story nav.n-nav a:focus-visible{outline:3px solid #294d8766;outline-offset:2px}'
              '.n-story .comic-home{top:calc(9px + env(safe-area-inset-top));min-height:42px}'
              '@media(min-width:760px){.n-story nav.n-nav{padding-right:10px}}'
              '.n-story .scene,.n-story .n-flow,.n-story .n-mem{scroll-margin-top:68px}'
              '@media(max-width:400px){.n-talk{grid-template-columns:1fr;gap:12px;margin:8px 14px 0}.n-steps{margin:12px 14px 0}.n-art-cap,.n-talk-cap,.n-hook,.n-stress{margin-left:14px;margin-right:14px}.n-story .scene>.key{margin-left:14px;margin-right:14px}.n-story .n-head{padding:16px 14px 12px}.n-mem{padding-left:14px;padding-right:14px}}'
              '.embedded .n-story nav{display:none}'
              '</style>')


def png_size(data):
    if data[:8] != b'\x89PNG\r\n\x1a\n' or data[12:16] != b'IHDR':
        raise SystemExit('PNG 머리가 아니에요.')
    return struct.unpack('>II', data[16:24])


def check_png(n, data, where):
    sha, size = SHEETS[n]
    if len(data) != size or hashlib.sha256(data).hexdigest() != sha:
        raise SystemExit('%s 그림판 %d이 측정 때와 달라요(해시·바이트 수). 칸 사각형을 다시 재야 해요.' % (where, n))
    if png_size(data) != (SHEET_W, SHEET_H):
        raise SystemExit('%s 그림판 %d 크기가 %d×%d가 아니에요.' % (where, n, SHEET_W, SHEET_H))


def prepare_sheets(src):
    """웹툰에 품은 PNG 네 장을 그대로 꺼내 media/nambuk-sheets/N.png로 둔다(처음 한 번). 품은 그림이 없으면 둔 파일을 확인한다."""
    found = {}
    for m in SHEET_RE.finditer(src):
        found.setdefault(int(m.group(1)), []).append(m.group(2))
    if found and (sorted(found) != [0, 1, 2, 3] or any(len(v) != 1 for v in found.values())):
        raise SystemExit('웹툰에 품은 그림판이 .sheet0–3 한 번씩이 아니에요: %r' % sorted(found))
    os.makedirs(os.path.join(MEDIA, SHEET_DIR), exist_ok=True)
    for n in range(4):
        path = os.path.join(MEDIA, SHEET_DIR, '%d.png' % n)
        if found:
            data = base64.b64decode(found[n][0], validate=True)
            check_png(n, data, '웹툰에 품은')
            if os.path.exists(path):
                with open(path, 'rb') as f:
                    if f.read() != data:
                        raise SystemExit('media/%s/%d.png 가 웹툰에 품은 그림과 달라요. 덮어쓰지 않아요.' % (SHEET_DIR, n))
            else:
                with open(path, 'wb') as f:
                    f.write(data)
        else:
            if not os.path.exists(path):
                raise SystemExit('웹툰에 품은 그림도 media/%s/%d.png 도 없어요.' % (SHEET_DIR, n))
            with open(path, 'rb') as f:
                check_png(n, f.read(), 'media/%s/%d.png' % (SHEET_DIR, n))


def check_panels():
    """칸 사각형이 그림판 안에 있고, 같은 그림판에서 서로 겹치지 않는지 확인한다."""
    if sorted(PANELS) != list(range(1, 33)):
        raise SystemExit('칸 사각형은 장면 1–32에 하나씩이어야 해요.')
    rects = list(PANELS.values())
    for i, (s, x, y, w, h) in enumerate(rects):
        if s not in SHEETS or x < 0 or y < 0 or w <= 0 or h <= 0 or x + w > SHEET_W or y + h > SHEET_H:
            raise SystemExit('칸 사각형이 그림판 밖으로 나가요: %r' % (rects[i],))
        for j, (t, a, b, c, d) in enumerate(rects):
            if i != j and s == t and not (x + w <= a or a + c <= x or y + h <= b or b + d <= y):
                raise SystemExit('칸 사각형이 서로 겹쳐요: %r %r' % (rects[i], rects[j]))


def load_flow():
    s = open(os.path.join(MEDIA, 'lecture-flow-nambuk.js'), encoding='utf-8').read()
    m = re.search(r'/\*FLOW-JSON\*/(.*?)/\*END-FLOW-JSON\*/', s, re.S)
    if not m:
        raise SystemExit('media/lecture-flow-nambuk.js 에 흐름 데이터(FLOW-JSON)가 없어요.')
    return json.loads(m.group(1))


def em(s):
    return re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', e(s))


def bold_terms(text, seen, vocab):
    """장면 설명에서 흐름 데이터의 굵게 표시 말(terms)을 처음 나올 때 한 번만 굵게. 긴 말부터 맞추고, 이미 굵게 한 말은 통째로 건너뛰어 더 짧은 말이 그 안에서 굵어지지 않게 한다(예: 문무왕 안의 무왕)."""
    rx = re.compile('|'.join(re.escape(t) for t in sorted(vocab, key=len, reverse=True)))
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


def art_html(sc, n):
    s, x, y, w, h = PANELS[n]
    return ('<div class="n-art" data-panel="nambuk-%d-s%02d"><svg class="n-panel" viewBox="%d %d %d %d" width="%d" height="%d" style="--n-ar:%d / %d" role="img" aria-label="%s" focusable="false" preserveAspectRatio="xMidYMid meet">'
            '<image href="%s/%d.png" x="0" y="0" width="%d" height="%d"/></svg></div>') % (
        s, n, x, y, w, h, w, h, w, h, e(sc['title'] + ' 장면(원본 그림판 칸 전체)'), SHEET_DIR, s, SHEET_W, SHEET_H)


def scene_html(sc, n, vocab):
    head = '<div class="n-head"><div class="meta"><span data-scene-count data-format="n">%02d</span> · %s</div><h2>%s</h2><p class="n-when">%s</p></div>' % (
        n, e(sc['label']), e(sc['title']), e(sc['when']))
    cap = '<p class="n-art-cap">개념 그림 · 실제 인물의 초상이나 유물·유적 사진이 아니에요.</p>'
    talk = ('<p class="n-talk-cap">학습용 요약 대화 · 실제 발언을 그대로 옮긴 것이 아니에요.</p><div class="n-talk">%s</div>'
            % ''.join('<p aria-label="%s: %s"><b>%s</b><span>%s</span></p>' % (e(who(w)), e(t), e(who(w)), e(t)) for w, t in (sc['a'], sc['b'])))
    seen = set()
    steps = '<ol class="n-steps" aria-label="장면 설명">%s</ol>' % ''.join(
        '<li><b class="st %s">%s</b><span>%s</span></li>' % (k, e(l), bold_terms(t, seen, vocab)) for l, k, t in sc['steps'])
    hook = '<p class="n-hook"><b>구분</b>%s</p>' % sc['hook']
    stress = '<p class="n-stress"><b>강의 강조</b>%s</p>' % e(sc['stress']) if sc.get('stress') else ''
    more = ''.join('<details class="scene-more"><summary>%s</summary><p>%s</p></details>' % (e(t), e(x)) for t, x in sc.get('more', []))
    orig = '<details class="scene-more n-orig"><summary>예전 설명(원문 그대로)</summary><p>%s</p></details>' % sc['fact']
    return '<section class="scene" data-orig="%d" id="%s">%s%s%s%s%s<p class="key">%s</p>%s%s%s%s</section>' % (
        n, e(sc['id']), head, art_html(sc, n), cap, talk, steps, e(sc['key']), hook, stress, more, orig)


def memory_html(after, chunks):
    def one(k):
        memo = ('<div class="n-memo"><b>%s</b><p>%s</p><p>%s</p></div>' % (e(k['memo']['label']), e(k['memo']['text']), e(k['memo']['note']))) if k.get('memo') else ''
        wrong = '<p class="n-mem-x"><b>헷갈리지 않기</b>%s</p>' % em(k['x']) if k.get('x') else ''
        return ('<div class="n-mem-k"><p class="n-mem-head"><b class="n-mem-t">%s</b><span class="n-mem-w">%s</span></p><div class="n-mem-story">%s</div>%s%s'
                '<p class="n-keys"><span class="n-keys-label">암기 키워드</span>%s</p></div>') % (
            e(k['t']), e(k['w']), ''.join('<p>%s</p>' % em(x) for x in k['story']), memo, wrong, ''.join('<span class="n-key">%s</span>' % e(x) for x in k['k']))
    return '<aside class="n-mem" id="mem-%s" aria-label="이 부분에서 외울 것: %s"><p class="n-mem-label">이 부분에서 외울 것</p>%s</aside>' % (
        e(after), e(' · '.join(k['t'] for k in chunks)), '<ul>'+''.join('<li><b>%s</b> · %s</li>'%(e(k['t']),e(' → '.join(k['k']))) for k in chunks)+'</ul><details><summary>세부 내용 펼쳐보기</summary>'+''.join(one(k) for k in chunks)+'</details>')


def bridge_html(sc):
    if not sc.get('next'):
        return ''
    text, switch = sc['next']
    return '<div class="story-seam%s" aria-label="이야기 흐름"><span class="story-seam-dots" aria-hidden="true">…</span><span class="story-seam-text">%s</span></div>' % (
        ' n-switch' if switch else '', e(text))


def build():
    check_panels()
    keys = [sc['id'] for sc in SCENES]
    if keys != ['s%d' % i for i in range(1, 33)]:
        raise SystemExit('남북국 장면은 s1–s32, 기존 순서 그대로여야 해요.')
    for sc in SCENES:
        if not all(t.endswith('다.') for _, _, t in sc['steps']):
            raise SystemExit('%s: 설명 줄은 ‘다.’로 끝나는 문장이어야 해요.' % sc['id'])
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
    prepare_sheets(src)
    # 예전 파일에는 <head>·<body> 태그가 없다(스타일 뒤 바로 홈 버튼). 다시 만든 파일은 </head> 앞까지가 앞부분이다
    cut = src.index('</head>') if '</head>' in src else src.index('<a class="comic-home"')
    head = re.sub(r'<style id="hanq-nambuk-story">.*?</style>', '', src[:cut], flags=re.S) + NAMBUK_CSS
    tail = SHEET_STYLE_RE.sub('', src[src.index('</main>'):])
    if 'base64,' in tail:
        raise SystemExit('</main> 뒤에 품은 그림이 남아 있어요.')
    body, scenes, memory = '', [], []
    for n, sc in enumerate(SCENES, 1):
        if sc['id'] in starts:
            f = starts[sc['id']]
            body += '<div class="n-flow" id="%s"><small>%s · %s</small><h2 id="%s-h">%s %s</h2><p>%s</p></div>\n' % (
                e(f['id']), e(f['no']), e(f['range']), e(f['id']), e(f['no']), e(f['name']), e(f['lead']))
        card = '<span class="legacy-anchor" id="mem-%s" aria-hidden="true"></span>' % e(sc['id']) if sc['id'] in old_ends and sc['id'] not in ends else ''
        if sc['id'] in ends:
            card = memory_html(sc['id'], ends[sc['id']])
            memory.append(dict(after=sc['id'], scene=n, chunks=[k['t'] for k in ends[sc['id']]]))
        body += scene_html(sc, n, vocab) + card + bridge_html(sc) + '\n'
        fl = [f['id'] for f in flow['list'] if keys.index(f['start']) <= n - 1][-1]
        s, x, y, w, h = PANELS[n]
        scenes.append(dict(id=sc['id'], scene=n, flow=fl, orig=n, title=sc['title'], key=sc['key'],
                           panel=dict(sheet='media/%s/%d.png' % (SHEET_DIR, s), sha256=SHEETS[s][0], rect=[x, y, w, h]),
                           speakers=[w2 for w2, _ in (sc['a'], sc['b'])], stress=sc.get('stress'), teacher_lines=sc['src'],
                           source=('강의 ' + sc['src'] + '행') if sc['src'] else '기존 웹툰 설명(강의 337–478행·교재 PDF 31–37쪽에 없음)'))
    guide = ('<ul class="n-guide"><li><b>네 흐름</b> ① 통일 신라 전기 → ② 같은 시기 북쪽의 발해 → ③ 두 나라의 문화(주제별) → ④ 신라 하대의 동요와 후삼국. 신라와 발해는 앞뒤로 이어진 나라가 아니라 남북에 나란히 있던 나라예요.</li>'
             '<li><b>컷마다</b> 왕·시기 → 그림 → 대화 → 설명 → 핵심 줄을 읽어요. 강의가 직접 짚은 말은 ‘강의 강조’로 표시해요.</li>'
             '<li><b>큰 흐름 끝</b>마다 ‘이 부분에서 외울 것’으로 이어서 정리해요.</li></ul>')
    header = ('<header><small>한국사 웹툰 02 · 남북국 시대</small><h1>남쪽의 신라,<br>북쪽의 발해</h1><p>통일 이후의 신라, 고구려를 잇는 발해.<br>두 나라의 발전부터 후삼국으로 향하는 이야기.</p>'
              '<p style="font-size:12px"><span data-scene-total>32</span>컷 · 통일 신라·발해에서 후삼국까지<br>대사와 인물은 학습용 각색. 빨간 굵은 글씨는 핵심어.</p>' + guide + '</header>'
              '<nav class="n-nav" aria-label="남북국 시대 흐름 바로 가기"><div class="n-nav-track">%s</div></nav>'
              '<div class="chapter-line">%s</div>\n') % (''.join('<a href="#%s">%s %s</a>' % (e(f['id']), e(f['no']), e(f['name'])) for f in flow['list']), e(flow['note']))
    end = ('<div class="end"><strong>흐름 한 줄</strong>'
           '<p>통일 신라: 문무왕 통일 완성 → 신문왕 왕권 강화·제도 정비 → 성덕왕 정전 → 경덕왕 녹읍 부활 → 혜공왕 피살 → 김헌창의 난 → 장보고의 난 → 진성여왕 → 후삼국 → 고려의 통일</p>'
           '<p>발해(같은 시기 북쪽): 대조영 건국 · 무왕 등주 공격 · 문왕 상경 천도 · 선왕 해동성국 · 10세기 초 거란에 멸망</p>'
           '<a href="../index.html#chapter/nambuk/quiz" target="_top">다 읽었다면 퀴즈로 확인하기 →</a></div>'
           '<div class="source">자료: 「한능검 심화 시대별 문단구분 수정본 v2」 7~10쪽 중 통일 신라·발해의 정치·경제·사회·문화와 후삼국의 성립. 나라별·분야별 원문을 사건과 인물의 흐름에 맞춰 재구성했습니다. 문화 장면은 활동 시기가 다른 인물들을 주제별로 묶은 장면이며, 등장 순서가 모두 연대순인 것은 아닙니다.'
           '<br><br>설명·외울 것 카드는 강의 원고와 교재(통일신라·발해 단원)를 따라 다시 정리했습니다(근거 행·쪽은 docs/nambuk-scene-sources.md). 장면마다 예전 설명은 ‘예전 설명(원문 그대로)’에 접어 두었습니다.'
           '<br><br>대사는 실제 발언이 아닌 학습용 각색입니다. 그림은 복식·유물·지형의 정확한 복원 자료가 아닙니다. 핵심 사실은 설명과 강조어를 기준으로 읽어 주세요.'
           '<br><br>내장 이미지 생성 도구로 제작한 독자적인 캐릭터와 그림입니다. 그림은 예전 웹툰에 들어 있던 그림판을 바이트 그대로 따로 둔 파일에서, 장면마다 칸 하나를 통째로 보여 줍니다.</div>')
    doc = (head + '</head><body class="n-story"><a class="comic-home" href="../index.html" aria-label="시대별 목차로 이동">⌂ 홈</a><div id="progress"></div><main>'
           + header + body + end + tail)
    with open(os.path.join(MEDIA, FILE), 'w', encoding='utf-8') as f:
        f.write(doc)
    cmap = dict(generated_by='scripts/build_nambuk_comic.py',
                note='남북국 웹툰 장면(화면 순서 = 기존 s1–s32)·흐름·원본 그림판 칸(바이트 그대로, SVG viewBox로 칸 전체)·기존 제목·핵심 줄·강의 강조와 근거 행, 이 부분에서 외울 것 카드 위치.',
                panel_source=dict(width=SHEET_W, height=SHEET_H,
                                  sheets={'%d' % k: dict(file='media/%s/%d.png' % (SHEET_DIR, k), sha256=v[0], bytes=v[1]) for k, v in sorted(SHEETS.items())},
                                  extracted_from='예전 media/nambuk-comic.html의 .sheet0–3 base64 PNG(다시 인코딩하지 않음)'),
                scenes=scenes, memory=memory)
    with open(os.path.join(ROOT, 'docs', 'nambuk-comic-map.json'), 'w', encoding='utf-8') as f:
        json.dump(cmap, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print('남북국 장면', len(scenes), '· 흐름', len(flow['list']), '· 카드', len(memory))


if __name__ == '__main__':
    build()

# Source-backed supplementary learning cuts; original scene keys stay unchanged.
from study_supplements import apply as apply_study_supplements
apply_study_supplements()
