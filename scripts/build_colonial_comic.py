# -*- coding: utf-8 -*-
"""일제 강점기 웹툰(media/colonial-comic.html)을 세 시기 묶음에 맞춘 한 페이지 학습으로 다시 엮는다.

  python3 scripts/build_colonial_comic.py

- 기존 파일의 <head>(스타일)와 </main> 뒤 스크립트는 그대로 두고, 본문만 아래 SCENES 정의로 다시 쓴다. 여러 번 실행해도 결과가 같다.
- 장면 18개의 id·제목·꼭 기억 단서는 기존 웹툰 그대로다. 강의 순서(통치 세 시기 → 독립운동사)에 맞춰 순서만 바꿨다.
- 그림: media/colonial-panels.png(1024×1536, 12칸, 행 높이·열 너비가 서로 다름)은 바이트 그대로 둔다. 조정자가 읽기 전용으로 잰 칸 사각형을
  SVG viewBox로 보여 주어 칸 전체가 원래 비율로, 이웃 칸 없이, 확대·잘라 내기 없이 보인다. 그림 파일이 바뀌면(해시·크기 다름) 멈춘다.
  예전에 칸 일부를 확대해 쓰던 덧붙인 장면 6개는 같은 칸 전체를 다시 쓰고, 그렇다고 화면에 밝힌다.
- 흐름 머리와 ‘이 부분에서 외울 것’ 카드는 media/lecture-flow-colonial.js의 /*FLOW-JSON*/ … /*END-FLOW-JSON*/를 읽는다.
- 말풍선은 그림 밖(아래)에 둔다. 기록에 이름이 없는 화자는 ‘설명용 인물’로 밝힌다. 스타일은 body.c-story 안에서만 쓴다.
- 출력: media/colonial-comic.html, docs/colonial-comic-map.json. 시간·난수·개인 경로를 쓰지 않는다. 근거·정정 기록은 docs/colonial-scene-sources.md.
"""
import hashlib, html, json, os, re, struct

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA = os.path.join(ROOT, 'media')
FILE = 'colonial-comic.html'
e = lambda s: html.escape(s, quote=True)

# 원본 그림판과 칸 사각형(읽기 전용 측정값: x, y, w, h). 흰 가로줄 370–377 · 744–751 · 1107–1114, 흰 세로줄 338–344 · 679–685.
SHEET, SHEET_SHA, SHEET_W, SHEET_H = 'colonial-panels.png', '1808ac69a3a1eab7074f7b9fbcd55efae55b4754d5be42194e0c3215f8a81e02', 1024, 1536
PANELS = {1: (0, 0, 338, 370), 2: (345, 0, 334, 370), 3: (686, 0, 338, 370),
          4: (0, 378, 338, 366), 5: (345, 378, 334, 366), 6: (686, 378, 338, 366),
          7: (0, 752, 338, 355), 8: (345, 752, 334, 355), 9: (686, 752, 338, 355),
          10: (0, 1115, 338, 421), 11: (345, 1115, 334, 421), 12: (686, 1115, 338, 421)}

# 기록에 이름이 남지 않은 설명용 인물. 그 밖의 화자(임병찬·박상진·김원봉·김구·지청천·양세봉)는 실제 인물.
GENERIC = {'학생', '아버지', '농민', '동료', '시민', '독립운동가', '교사', '상인', '회원', '노동자', '독립군', '단원', '광복군', '학자', '역사가'}

# 장면 정의(화면 순서). panel: 원본 칸 번호. orig: 원래 장면 번호(data-orig) · added: 뒤에 덧붙인 장면(data-added="density") · reuse: 앞 장면 칸을 다시 씀
#  when: 시기·사건 줄 · steps: [(이름, cause|dev|res|item, 문장)] · key: 기존 꼭 기억 단서(글자 그대로) · stress: 강의가 직접 짚은 말(근거 행은 src·문서)
#  more: [(제목, 문장)] 접힌 보충(강의가 배경·가볍게로 낮춘 범위 또는 흐름 보충) · next: (다음 장면으로 잇는 말, 흐름이 바뀌면 True) · src: 강의 행
SCENES = [
    dict(id='scene-1', orig=1, panel=1, label='1910년대 · 무단 통치', title='거리마다 헌병', when='1910년대 · 조선 총독부 · 헌병 경찰 통치',
         alt='거리마다 헌병 장면', a=('학생', '말 한마디에도 헌병이 잡아갑니다.'), b=('아버지', '회사도 허가를 받아야 한다니…'),
         steps=[('배경', 'cause', '국권을 빼앗은 일제는 조선 총독부를 두고 1910년대에 무력으로 다스렸다.'),
                ('전개', 'dev', '헌병이 경찰 일까지 맡는 헌병 경찰 통치를 펴서 교사까지 칼을 찼고, 조선인에게만 태형령을 적용했다.'),
                ('함께', 'item', '회사령으로 회사를 세우려면 총독부의 허가를 받아야 했다.')],
         key='헌병경찰·태형령·회사령', stress='헌병 경찰 통치 · 태형 · 회사령은 꼭 외우라고 짚었어요.',
         more=[('흐름 보충 · 조선물산공진회', '1915년 일제는 경복궁에서 조선물산공진회를 열어 식민 지배를 자랑했다. 1920년대 물산 장려 운동과 이름이 비슷하니 구분한다.')],
         next=('거리의 감시가 삼엄해지는 사이, 땅마저 조사 대상이 됐다.', False), src='1609–1616 · 1624–1627'),
    dict(id='scene-2', orig=2, panel=2, label='1910년대 · 토지조사사업', title='땅을 조사한다는 말', when='1910년대 · 토지조사사업 · 기한 안에 신고',
         alt='땅을 조사한다는 말 장면', a=('농민', '이 땅에서 평생 농사 지었어요.'), b=('동료', '신고하지 못하면 소유권을 잃을 수도 있답니다.'),
         steps=[('배경', 'cause', '일제는 땅을 확보하려고 국권 피탈 뒤 가장 먼저 토지조사사업을 벌였다.'),
                ('전개', 'dev', '정해진 기한 안에 복잡한 서류로 신고하게 해, 신고하지 못한 땅과 나라 땅을 가져갔다.'),
                ('결과', 'res', '대대로 인정되던 소작인의 경작권은 부정되고 지주의 권리만 강해졌다.'),
                ('함께', 'item', '이렇게 얻은 땅은 동양 척식 주식회사로 넘어갔다.')],
         key='1910년대 토지조사사업',
         next=('1919년, 고종의 인산일을 앞두고 나라 안팎에서 독립을 외칠 준비가 시작되었다.', False), src='1616–1624'),
    dict(id='scene-3', orig=3, panel=3, label='1919 · 3·1 운동', title='사람들이 거리로', when='1919 · 2·8 독립 선언 → 고종의 인산일을 앞두고 3·1 운동 → 전국으로 확산',
         alt='사람들이 거리로 장면', a=('학생', '우리 목소리를 함께 외쳐요!'), b=('시민', '만세가 전국으로 퍼집니다.'),
         steps=[('배경', 'cause', '1차 세계 대전 뒤 윌슨이 민족 자결주의를 내세우자, 도쿄의 유학생들이 2·8 독립 선언을 발표했다.'),
                ('전개', 'dev', '고종이 갑자기 세상을 떠나자, 그 장례(인산일)를 앞두고 사람들이 모인 가운데 1919년 3·1 운동이 시작되어 전국으로 퍼졌다. 일제 강점기 최대 규모의 독립운동이었다.'),
                ('탄압', 'item', '일제는 경기도 화성 제암리 학살 등으로 운동을 짓눌렀다.'),
                ('결과', 'res', '구심점이 필요하다는 생각에 대한민국 임시정부가 세워졌고, 일제는 1920년부터 통치 방식을 바꿨다.')],
         key='3·1 운동 → 대한민국 임시정부 수립', stress='3·1 운동은 결과(임시정부 수립 · 통치 방식의 변화)도 중요하다고 짚었어요.',
         next=('거리의 외침은 나라 밖 상하이의 임시 정부로 이어졌다.', False), src='1627–1642'),
    dict(id='scene-4', orig=4, panel=4, label='1919 · 대한민국 임시정부', title='상하이에서 이어받다', when='1919 상하이 · 초대 대통령 이승만 · 연통제 · 교통국 · 독립공채',
         alt='상하이에서 이어받다 장면', a=('독립운동가', '흩어진 힘을 정부로 모읍시다.'), b=('동료', '연통제와 교통국으로 국내와 연결하지요.'),
         steps=[('배경', 'cause', '3·1 운동의 힘을 하나로 모을 구심점이 필요했다.'),
                ('전개', 'dev', '상하이에 대한민국 임시정부가 세워졌다. 연통제·교통국으로 국내와 연락하고, 독립공채를 팔고, 미국에 구미 위원부를 두었다.'),
                ('결과', 'res', '연통제가 발각되고 외교 활동도 성과를 거두지 못하자 활동이 위축되었다.'),
                ('체제', 'item', '초대 대통령은 이승만이고, 대통령제 → 국무령제 → 국무위원제 → 주석제를 거쳐 마지막 주석은 김구였다. 1940년대에는 조소앙의 삼균주의를 바탕으로 건국 강령을 발표했다.')],
         key='임시정부 = 연통제·교통국·독립공채', stress='초대 대통령과 마지막 주석, 독립공채 · 삼균주의는 임시정부 단서라고 짚었어요.',
         more=[('강의가 가볍게 넘긴 범위 · 국민대표회의', '1923년 국민대표회의에서 임시정부를 없애고 새로 만들자는 창조파와 고쳐서 이어 가자는 개조파가 맞서다 결렬되었고, 임시정부는 오래 침체했다.')],
         next=('여기까지가 1910년대예요. 3·1 운동에 놀란 일제는 1920년부터 통치 방식을 바꿨다.', True), src='1639–1655'),
    dict(id='scene-5', orig=5, panel=5, label='1920년대 · 이른바 문화 통치', title='이름만 바뀐 통치', when='1920년대 · 보통 경찰 · 1925 치안유지법 · 산미증식계획',
         alt='이름만 바뀐 통치 장면', a=('학생', '헌병이 물러났는데 왜 잡혀가는 사람은 많죠?'), b=('교사', '보통경찰과 치안유지법이 뒤를 이었어.'),
         steps=[('배경', 'cause', '3·1 운동에 놀란 일제는 무력만으로는 다스릴 수 없다고 보고 통치의 겉모습을 바꿨다.'),
                ('전개', 'dev', '헌병 경찰을 보통 경찰로 바꾸었지만, 경찰 병력과 예산은 오히려 늘었다.'),
                ('함께', 'item', '1925년 치안유지법을 만들어 사회주의자뿐 아니라 민족 운동도 탄압했다.'),
                ('경제', 'item', '일본의 쌀 부족을 메우려 산미증식계획을 폈지만, 늘어난 생산보다 빼앗긴 쌀이 많아 1인당 쌀 소비가 줄고 소작쟁의가 늘었다.')],
         key='문화 통치 = 보통경찰·치안유지법·산미증식계획', stress='치안유지법은 1920년대라는 것만 알면 된다고 짚었어요.',
         more=[('배경 지식 · 강의가 시험에는 거의 안 나온다고 한 부분', '지방 자문 기구에 조선인도 참여한다고 했지만 친일파와 일본인으로 채웠다. 문관 총독도 임명하겠다고 했지만 한 번도 없었다. 동아일보·조선일보 발행을 허용했지만 기사를 검열했다.')],
         next=('감시는 교묘해졌지만, 사람들은 스스로 힘을 기르려 했다.', False), src='1659–1683'),
    dict(id='scene-6', orig=6, panel=6, label='1920년대 · 실력 양성 운동', title='우리 힘으로 배우고 쓰자', when='1920년대 초 · 물산 장려 운동 · 민립 대학 설립 운동',
         alt='우리 힘으로 배우고 쓰자 장면', a=('상인', '우리 물건을 써야 합니다.'), b=('학생', '민립대학을 세워 배울 길도 열어요.'),
         steps=[('배경', 'cause', '1920년 회사령이 폐지되고 이어 관세도 없어지자 일본 상품이 밀려들어 조선 기업이 피해를 보았다.'),
                ('전개', 'dev', '평양에서 조만식을 중심으로 조선 물산 장려회가 만들어져 우리가 만든 물건을 쓰자는 물산 장려 운동을 벌였다.'),
                ('같은 때', 'item', '서울에서는 이상재를 중심으로 조선 민립 대학 기성회가 ‘한 사람이 1원씩’ 모금하는 민립 대학 설립 운동을 벌였다.'),
                ('결과', 'res', '일제가 경성 제국 대학을 서둘러 세우자 민립 대학 모금 운동은 흐지부지되었다.')],
         key='물산장려운동·민립대학운동 / 신간회',
         next=('1926년, 순종의 인산일에 맞춰 다시 만세 운동이 준비되었다.', False), src='1668–1678'),
    dict(id='singanhoe', added=True, panel=3, reuse=True, label='1926–1931 · 6·10 만세와 신간회', title='좌우가 손잡다',
         when='1926 6·10 만세 운동 → 정우회 선언 → 신간회 → 1929 광주학생항일운동 → 1931 해소',
         alt='3·1 운동 장면과 같은 그림(칸 전체 다시 사용 · 만세를 외치는 사람들)', a=('학생', '순종의 인산일에 6·10 만세를 외쳤어요.'), b=('회원', '정우회 선언 뒤 신간회가 만들어졌지요.'),
         art_note='그림: ‘사람들이 거리로’(3·1 운동) 장면과 같은 칸 전체를 확대하지 않고 다시 썼어요.',
         steps=[('배경', 'cause', '1926년 순종의 인산일에 맞춘 6·10 만세 운동은 준비하던 사회주의 계열 인물이 미리 붙잡혀 학생 중심으로 작게 일어났다.'),
                ('전개', 'dev', '분열하지 말자는 민족 유일당 운동 속에 정우회 선언을 바탕으로 비타협적 민족주의와 사회주의가 손잡고 신간회를 만들었다. 초대 회장은 이상재였다.'),
                ('광주', 'item', '1929년 광주에서 한일 학생 충돌로 광주학생항일운동이 일어나자 신간회가 진상 조사단을 보내 전국에 알렸다.'),
                ('결과', 'res', '지도부가 대거 붙잡힌 뒤 사회주의 계열이 빠져나가 1931년 신간회는 해소되었다.'),
                ('함께', 'item', '근우회는 신간회의 자매 단체인 여성 단체다.')],
         key='6·10 만세운동(순종 인산일) → 정우회 선언 → 신간회 / 근우회 / 광주학생항일운동에 신간회 진상 조사단',
         stress='신간회 활동 가운데 광주학생항일운동 진상 조사단 파견이 제일 잘 나오고, 여성 단체는 근우회가 거의 정답이라고 짚었어요.',
         next=('농촌과 공장에서도 권리를 찾으려는 싸움이 이어졌다.', False), src='1687–1712 · 1724–1726'),
    dict(id='social-movements', added=True, panel=2, reuse=True, label='1920년대–1930년대 초 · 농민·노동·사회', title='암태도에서 원산까지',
         when='조선 형평사 · 1923 암태도 소작쟁의 · 1929 원산 총파업 · 1930년대 초 브나로드 운동',
         alt='토지조사사업 장면과 같은 그림(칸 전체 다시 사용 · 들판의 농민)', a=('농민', '암태도에서 높은 소작료에 맞섰습니다.'), b=('노동자', '원산 총파업, 을밀대 강주룡의 농성도 있었죠.'),
         art_note='그림: ‘땅을 조사한다는 말’(토지조사사업) 장면과 같은 칸 전체를 확대하지 않고 다시 썼어요.',
         steps=[('형평', 'item', '진주에서 조선 형평사가 만들어져 백정에 대한 차별 철폐를 요구했다. 이것이 형평 운동이다.'),
                ('농민', 'item', '1923년 전남 신안군 암태도에서 높은 소작료에 맞선 암태도 소작쟁의가 일어났다.'),
                ('노동', 'item', '1929년 일본인 관리자의 폭행을 계기로 원산 총파업이 일어났고, 1930년대 초 강주룡은 평양 을밀대 지붕에서 고공 농성을 벌였다.'),
                ('계몽', 'item', '방정환은 천도교 소년회를 중심으로 어린이날을 정했고, 1930년대 초 동아일보는 농촌에서 한글을 가르치는 브나로드 운동을 이끌었다.')],
         key='암태도 소작쟁의 / 조선 형평사(백정 차별 철폐) / 원산 총파업 / 강주룡 을밀대 고공 농성 / 방정환 소년 운동·브나로드 운동',
         stress='형평 운동 = 백정 차별 반대는 정말 잘 나오고, 농민 운동 가운데 암태도 소작쟁의가 제일 잘 나온다고 짚었어요.',
         next=('여기까지가 1920년대예요. 1937년 중일 전쟁이 시작되자 일제는 민족 말살 통치로 바꿨다.', True), src='1684–1686 · 1713–1727'),
    dict(id='scene-10', orig=10, panel=10, label='1937–1945 · 민족 말살 통치', title='이름과 삶을 빼앗다', when='1937 중일 전쟁 · 1938 국가총동원법 · 황국신민서사 · 창씨개명 · 신사 참배',
         alt='이름과 삶을 빼앗다 장면', a=('시민', '우리말도 이름도 마음대로 못 씁니다.'), b=('동료', '강제 동원까지… 그래도 기록하고 버팁시다.'),
         steps=[('배경', 'cause', '1937년 중일 전쟁이 시작되자 일제는 조선인도 일본 천황의 신민이라며 민족을 지우려 했다.'),
                ('전개', 'dev', '1938년 국가총동원법을 시행하고, 황국신민서사 암송·창씨개명·신사 참배를 강요했다. 애국반으로 서로 감시하게 했다.'),
                ('결과', 'res', '전쟁 막바지에는 금속을 빼앗고 지원병·징용·여자 정신 근로령으로 사람까지 끌어갔다.'),
                ('앞서', 'item', '1930년대 초부터 전쟁을 준비하며 남쪽에는 면화, 북쪽에는 양을 기르게 하는 남면북양 정책을 폈다.')],
         key='민족말살·황국신민서사·창씨개명·징용·징병', stress='무엇을 ‘강요·강제’했다고 나오면 일제 말이고, 1910년대와 일제 말을 먼저 외우라고 짚었어요.',
         next=('이름과 말을 빼앗으려 할수록 말과 역사를 지키려는 사람들이 있었다.', False), src='1733–1747'),
    dict(id='language-history', added=True, panel=5, reuse=True, label='주제별 · 1920년대–1940년대 · 말과 역사를 지키다', title='조선어학회와 민족 사학',
         when='여러 해에 걸친 정리 · 조선어 연구회 → 조선어학회 · 1942 조선어학회 사건 · 민족 사학',
         alt='문화 통치 장면과 같은 그림(칸 전체 다시 사용 · 교실의 학생과 교사)', a=('학자', '한글맞춤법 통일안과 우리말 큰 사전을 준비합니다.'), b=('역사가', '신채호는 조선상고사, 박은식은 한국통사를 썼지.'),
         art_note='그림: ‘이름만 바뀐 통치’(1920년대) 장면과 같은 칸 전체를 확대하지 않고 다시 썼어요.',
         steps=[('국어', 'item', '1920년대 조선어 연구회가 지금의 한글날을 만들었고, 뒤를 이은 조선어학회는 한글 맞춤법 통일안을 만들고 우리말 큰사전 편찬을 시도했다.'),
                ('탄압', 'item', '1942년 조선어학회 사건으로 탄압을 받아 활동이 중단되었지만, 광복 뒤 그때의 원고로 우리말 큰사전을 완성했다.'),
                ('역사', 'item', '신채호(조선상고사 · 아와 비아의 투쟁), 박은식(한국통사 · 한국독립운동지혈사), 정인보(조선학 운동 · 얼), 백남운(조선사회경제사)이 민족의 역사를 지키려 했다.'),
                ('학회', 'item', '일제의 식민 사학에 맞서 진단학회가 결성되었다.'),
                ('영화', 'item', '1920년대에는 나운규가 각본·감독·주연을 모두 맡은 영화 아리랑이 나왔다.')],
         key='조선어학회 = 한글맞춤법 통일안·우리말 큰 사전 → 조선어학회 사건 / 신채호 조선상고사·박은식 한국통사·백남운 조선사회경제사',
         stress='문학·예술 가운데 나운규의 아리랑이 시험에 제일 잘 나온다고 짚었어요.',
         more=[('흐름 보충 · 종교와 문학', '천도교(손병희 · 방정환 어린이날 · 개벽) · 대종교(나철 · 중광단) · 원불교(박중빈 · 새생활 운동) · 천주교 의민단 · 한용운 조선불교유신론 · 박은식 유교 구신론. 심훈 상록수 · 윤동주.'),
               ('흐름 보충 · 조선 교육령', '1차 조선 교육령으로 보통학교를 4년으로 줄였고, 2차 때는 겉으로 일본인과 같은 교육을 내세웠다. 중일 전쟁 뒤에는 조선어 교육을 선택 과목으로 바꿨다가 금지했다.')],
         next=('여기까지가 통치의 변화와 국내 운동이에요. 이제 같은 35년을 독립운동의 흐름으로 다시 1910년대부터 따라가요.', True), src='1774–1805'),
    dict(id='secret-societies', added=True, panel=6, reuse=True, label='1910년대 · 비밀 결사와 해외 기지', title='독립의군부와 대한광복회',
         when='1910년대 · 국내 비밀 결사 · 서간도 · 북간도 · 연해주 · 미국의 독립운동 기지',
         alt='실력 양성 장면과 같은 그림(칸 전체 다시 사용 · 비밀 결사 개념)', a=('임병찬', '고종의 밀지를 받아 독립의군부를 꾸렸소.'), b=('박상진', '대한광복회는 공화주의를 내세웁니다.'),
         art_note='그림: ‘우리 힘으로 배우고 쓰자’ 장면과 같은 칸 전체를 확대하지 않고 다시 썼어요.',
         steps=[('배경', 'cause', '1910년대 무단 통치 아래 국내 단체는 비밀 결사로 활동했고, 나라 밖에는 독립운동 기지를 세웠다.'),
                ('국내', 'item', '임병찬의 독립의군부는 고종의 밀지를 받아 복벽주의를, 박상진의 대한광복회는 공화주의를 내세웠다.'),
                ('서간도', 'item', '서간도에는 경학사·신흥강습소(뒤에 신흥무관학교)가 있었다.'),
                ('북간도', 'item', '북간도에는 이상설이 세운 서전서숙이 있었고 명동학교도 있었다. 대종교의 중광단은 뒤에 북로군정서로 이어졌다.'),
                ('밖으로', 'item', '연해주에는 권업회와 대한광복군 정부, 상하이에는 신한청년당, 미국에는 대한인국민회·흥사단·대조선국민군단이 있었다.')],
         key='독립의군부 = 임병찬·고종 밀지·복벽주의 / 대한광복회 = 박상진·공화주의·친일파 처단 / 해외: 서간도 경학사·연해주 권업회·상하이 신한청년당·미국 대한인국민회',
         stress='연해주의 권업회 · 대한광복군 정부는 중요하고, 미국의 흥사단 · 대조선국민군단은 알아 두라고 짚었어요.',
         more=[('흐름 보충 · 멕시코', '멕시코에는 에네켄 농장과 숭무학교가 있었다.')],
         next=('1920년대에는 도시 한가운데서 일제 기관을 노린 의열 투쟁이 이어졌다.', False), src='1753–1761 · 1806–1813'),
    dict(id='uiyeoldan', added=True, panel=9, reuse=True, label='1920년대 · 의열단', title='도시 한가운데의 의거', when='1920년대 · 김원봉의 의열단 · 신채호의 조선혁명선언',
         alt='한인애국단 장면과 같은 그림(칸 전체 다시 사용 · 의거를 준비하는 사람들)', a=('김원봉', '조선혁명선언을 지침 삼아 의열단을 이끌겠소.'), b=('단원', '종로경찰서, 총독부, 동척이 목표였지요.'),
         art_note='그림: ‘상하이에서 울린 소식’(한인애국단) 장면과 같은 칸 전체를 확대하지 않고 다시 썼어요.',
         steps=[('배경', 'cause', '김원봉이 조직한 의열단은 일제 기관을 부수고 친일파를 처단하려 했다.'),
                ('전개', 'dev', '신채호가 쓴 조선혁명선언을 활동 지침으로 삼았다. 김상옥은 종로경찰서, 김익상은 조선총독부, 나석주는 동양척식주식회사를 공격했다.'),
                ('뒤에', 'item', '김원봉은 뒤에(1938) 중국 관내에서 조선의용대를 만들었다.')],
         key='의열단 = 김원봉·신채호 조선혁명선언 / 김상옥(종로경찰서)·김익상(조선총독부)·나석주(동양척식주식회사)',
         next=('같은 1920년대, 만주 국경에서는 독립군이 일본군과 싸웠다.', False), src='1761–1762 · 1813–1815'),
    dict(id='scene-7', orig=7, panel=7, label='1920년대 · 봉오동·청산리', title='국경에서 들린 승전보', when='1920년대 · 봉오동 전투 → 청산리 전투 → 간도 참변',
         alt='국경에서 들린 승전보 장면', a=('독립군', '봉오동에서 이겼습니다!'), b=('동료', '청산리 승리 뒤 간도 참변이 이어졌어요.'),
         steps=[('배경', 'cause', '만주의 독립군이 국경을 넘나들며 일본군을 공격했다.'),
                ('전개', 'dev', '홍범도의 대한독립군이 봉오동 전투에서, 김좌진의 북로군정서군 등이 청산리 전투에서 일본군을 크게 이겼다.'),
                ('결과', 'res', '일제는 보복으로 간도의 한인들을 학살했다. 이것이 간도 참변이다.')],
         key='봉오동(홍범도)→청산리(김좌진)→간도 참변', stress='봉오동부터 미쓰야 협정까지 1920년대는 전체 순서로 기억하라고 짚었어요.',
         next=('국경에서 승리한 뒤, 흩어진 힘을 다시 모으려 했다.', False), src='1762–1766 · 1778–1779'),
    dict(id='scene-8', orig=8, panel=8, label='1920년대 · 독립군의 시련', title='승리 뒤 다시 모이다', when='간도 참변 → 자유시 참변 → 미쓰야 협정',
         alt='승리 뒤 다시 모이다 장면', a=('독립군', '간도 참변 뒤 자유시로 갔지만 또 시련을 겪었어요.'), b=('동료', '부대를 다시 정비해 싸움을 이어가야죠.'),
         steps=[('배경', 'cause', '간도 참변을 피해 독립군은 러시아 자유시로 옮겨 갔다.'),
                ('전개', 'dev', '그곳에서 독립군이 큰 피해를 입은 자유시 참변이 일어났다.'),
                ('결과', 'res', '다시 만주로 돌아온 독립군을 막으려 일제는 만주 군벌과 미쓰야 협정을 맺었다.')],
         key='간도 참변 → 자유시 참변 → 미쓰야 협정',
         next=('1930년대 초, 만주에서는 두 독립군 부대가 일본군과 맞섰다.', False), src='1763–1766'),
    dict(id='manchuria-1930s', added=True, panel=7, reuse=True, label='1930년대 초 · 만주 무장 투쟁', title='쌍성보와 영릉가', when='1930년대 초 · 한국독립군(북만주) · 조선혁명군(남만주)',
         alt='봉오동·청산리 장면과 같은 그림(칸 전체 다시 사용 · 싸우는 독립군)', a=('지청천', '한국독립군은 쌍성보와 대전자령에서 싸웠소.'), b=('양세봉', '조선혁명군은 영릉가와 흥경성에서 싸웠지.'),
         art_note='그림: ‘국경에서 들린 승전보’ 장면과 같은 칸 전체를 확대하지 않고 다시 썼어요.',
         steps=[('북만주', 'item', '지청천의 한국독립군은 쌍성보·대전자령에서 일본군과 싸웠다.'),
                ('남만주', 'item', '양세봉의 조선혁명군은 영릉가·흥경성에서 일본군과 싸웠다.'),
                ('구분', 'item', '북만주의 지청천은 한국독립군, 뒤에 충칭의 지청천은 한국광복군 총사령관이다.')],
         key='한국독립군 = 지청천·북만주·쌍성보/대전자령 / 조선혁명군 = 양세봉·남만주·영릉가/흥경성 / 조선의용대 = 김원봉·1938 우한',
         next=('같은 1930년대 초, 상하이에서는 김구가 한인애국단을 이끌었다.', False), src='1766–1768'),
    dict(id='scene-9', orig=9, panel=9, label='1930년대 초 · 한인애국단', title='상하이에서 울린 소식', when='1930년대 초 · 김구의 한인애국단 · 이봉창 · 윤봉길',
         alt='상하이에서 울린 소식 장면', a=('김구', '행동으로 세계의 눈을 돌립시다.'), b=('동료', '이봉창에 이어 윤봉길의 의거가 있었습니다.'),
         steps=[('배경', 'cause', '김구가 대한민국 임시정부 소속으로 한인애국단을 조직했다.'),
                ('전개', 'dev', '이봉창은 도쿄에서 일왕의 마차에 폭탄을 던졌고, 윤봉길은 상하이 훙커우 공원에서 의거를 일으켰다.')],
         key='한인애국단 = 김구·이봉창·윤봉길',
         next=('중일 전쟁 뒤, 중국 관내에서 새 한인 무장 부대들이 만들어졌다.', False), src='1769–1770'),
    dict(id='scene-11', orig=11, panel=11, label='일제 말 · 조선의용대와 한국광복군', title='끝까지 준비하다', when='1938 조선의용대(우한) · 1940 한국광복군(충칭) · 국내 진공 작전 준비',
         alt='끝까지 준비하다 장면', a=('광복군', '충칭에서 국내 진공을 준비합니다.'), b=('동료', '광복의 날까지 독립운동을 이어갑시다.'),
         steps=[('1938', 'item', '김원봉이 우한에서 조선민족전선연맹 산하의 조선의용대를 조직했다. 중국 관내 첫 한인 무장 부대다.'),
                ('1940', 'item', '충칭에서 대한민국 임시정부 산하의 한국광복군이 만들어졌다. 총사령관은 지청천이다.'),
                ('활동', 'item', '인도·미얀마 전선에 파견되었고, 미국(OSS)과 협력해 국내 진공 작전을 준비했다.'),
                ('구분', 'item', '조선의용대(1938 · 김원봉)와 한국광복군(1940 · 임시정부)은 따로 만들어진 다른 부대다.')],
         key='한국광복군 = 임시정부 산하·지청천·국내 진공 계획', stress='인도 · 미얀마 파견, 미국과 협력한 국내 진공 작전 계획은 모두 한국광복군이라고 짚었어요.',
         next=('독립을 기다리던 준비는 마침내 광복의 날과 만났다.', False), src='1770–1774'),
    dict(id='scene-12', orig=12, panel=12, label='1945 · 광복', title='기다리던 날', when='1945 광복 · 다음 시대는 대한민국 정부 수립',
         alt='기다리던 날 장면', a=('시민', '정말 광복이 왔어요!'), b=('독립운동가', '끝까지 이어 온 싸움이었습니다.'),
         steps=[('광복', 'item', '1945년, 35년의 일제 강점기가 끝나고 광복을 맞았다.'),
                ('다음 시대', 'item', '광복 뒤에는 새 나라를 세울 과제가 남았다. 대한민국 정부 수립은 다음 시대에서 이어진다.')],
         key='1945 광복 / 다음 시대는 대한민국 정부 수립',
         next=None, src='1607'),
]

COLONIAL_CSS = ('<style id="hanq-colonial-story">/* 일제 강점기: 흐름 머리 → 시기 줄 → 그림(SVG 칸 전체·원비율) → 그림 밖 말풍선 → 설명 → 꼭 기억 · 강의 강조 → (덩어리 끝) 이 부분에서 외울 것 → 다음 장면 잇기 */'
                '.c-story .scene{padding:0 0 22px;opacity:1!important;transform:none!important;content-visibility:visible!important}'
                '.c-story .c-head{padding:18px 18px 12px}.c-story .c-head .meta{font-size:13px;color:#667085;font-weight:800}'
                '.c-story .c-head h2{font-size:clamp(22px,6vw,28px);line-height:1.25;letter-spacing:-.04em;margin:6px 0 6px;word-break:keep-all}'
                '.c-story .c-when{margin:0;color:#a72d27;font-size:14.5px;line-height:1.5;font-weight:850;word-break:keep-all;overflow-wrap:anywhere}'
                # 그림: 예전 .art 배경 격자(300%×400% 늘이기·확대)는 쓰지 않는다. SVG viewBox = 칸 사각형 전체, 원래 비율(width·height 속성)
                '.c-story .art{background:none;aspect-ratio:auto}'
                '.c-art{margin:0;background:#d9dce0;line-height:0}.c-panel{display:block;width:100%;height:auto}'
                '.c-art-cap{margin:6px 18px 0;font-size:13px;font-weight:750;line-height:1.5;color:#4b5565}.c-art-note{margin:2px 18px 0;font-size:13px;line-height:1.5;color:#5b6576}'
                '.c-talk-cap{margin:12px 18px 0;font-size:13px;font-weight:800;line-height:1.4;color:#5b6576}'
                '.c-talk{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin:8px 18px 0}'
                '.c-talk p{margin:0;padding:10px 12px 11px;background:#fff;border:2px solid #26384c;border-radius:16px 16px 16px 5px;color:#243248;line-height:1.5}'
                '.c-talk p+p{background:#eef6ff;border-color:#315d80;border-radius:16px 16px 5px 16px}'
                '.c-talk b{display:block;margin-bottom:4px;font-size:14px;font-weight:900;color:#b52d34}.c-talk p+p b{color:#315d80}'
                '.c-talk span{display:block;font-size:16px;font-weight:700;word-break:keep-all;overflow-wrap:anywhere}'
                '.c-steps{list-style:none;margin:12px 18px 0;padding:0;display:grid;gap:7px}'
                '.c-steps li{display:grid;grid-template-columns:3.6em minmax(0,1fr);gap:8px;align-items:baseline;font-size:16px;line-height:1.65;color:#2b3443;word-break:keep-all;overflow-wrap:anywhere}'
                '.c-steps .st{display:block;padding:1px 2px;border-radius:6px;text-align:center;font-size:12.5px;font-weight:900;line-height:1.5;background:#eef1f4;color:#4b5565}'
                '.c-steps .st.dev{background:#fff0e9;color:#a72d27}.c-steps .st.res{background:#e9f4ec;color:#2f6b3c}.c-steps .st.item{background:#f6f1e7;color:#7a5a24}'
                '.c-steps strong,.c-mem strong{color:#b52d34;font-weight:900}'
                '.c-story .scene>.key{margin:12px 18px 0;padding:10px 12px;border-left:4px solid #d83b32;background:#fff0e9;color:#a72d27;font-size:15px;font-weight:850;line-height:1.55;word-break:keep-all;overflow-wrap:anywhere}'
                '.c-stress{margin:8px 18px 0;font-size:14px;line-height:1.55;color:#294d87;font-weight:750;word-break:keep-all}.c-stress b{margin-right:6px;padding:1px 7px;border-radius:6px;background:#eef2f8;font-size:12.5px;font-weight:900}'
                '.c-story .scene-more{margin:10px 18px 0;padding:4px 12px;border:1px dashed #d6c7a3;border-radius:10px;background:#fffaf0;font-size:15px;line-height:1.6;color:#3d4859}'
                '.c-story .scene-more>summary{display:flex;align-items:center;min-height:44px;cursor:pointer;font-weight:850}.c-story .scene-more>summary:focus-visible{outline:3px solid #294d8766;outline-offset:2px;border-radius:6px}.c-story .scene-more p{margin:2px 0 10px}'
                '.c-story .c-flow{padding:18px 18px 16px;background:#17243a;color:#fff}.c-story .c-flow:focus{outline:3px solid #f0b593;outline-offset:-3px}'
                '.c-story .c-flow small{display:block;color:#f0b593;font-size:13px;font-weight:800}.c-story .c-flow h2{margin:4px 0 0;color:#fff;font-size:clamp(20px,5.5vw,24px);line-height:1.3;word-break:keep-all}'
                '.c-story .c-flow p{margin:6px 0 0;font-size:15px;line-height:1.6;color:#dce5f0;word-break:keep-all}'
                '.c-mem{margin:0;padding:16px 18px 18px;background:#fff8e8;border-top:4px solid #e5a337;border-bottom:1px solid #f0dfb8}'
                '.c-mem-label{margin:0 0 8px;font-size:17px;font-weight:900;color:#7a4b0d}.c-mem-k+.c-mem-k{margin-top:14px;padding-top:12px;border-top:1px dashed #e3cf9f}'
                '.c-mem-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 10px;margin:0 0 6px}.c-mem-t{font-size:17px;font-weight:900}.c-mem-w{font-size:14px;font-weight:800;color:#294d87}'
                '.c-mem-story p{margin:0 0 6px;font-size:16px;line-height:1.7;color:#243248;word-break:keep-all;overflow-wrap:anywhere}'
                '.c-memo{margin:8px 0;padding:10px 12px;border-left:4px solid #e5a337;border-radius:8px;background:#fff}.c-memo b{display:block;font-size:14px;font-weight:900}.c-memo p{margin:4px 0 0;font-size:16px;line-height:1.7}.c-memo p+p{font-size:15px;color:#5b4a26}'
                '.c-mem-x{margin:8px 0 0;font-size:16px;line-height:1.7;color:#3b3220;word-break:keep-all;overflow-wrap:anywhere}.c-mem-x b{margin-right:6px;padding:1px 7px;border-radius:6px;background:#fce9e5;color:#8f2a26;font-size:13px;font-weight:900}'
                '.c-keys{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:8px 0 0}.c-keys-label{font-size:13px;font-weight:900;color:#5b6576}.c-key{padding:3px 9px;border-radius:999px;background:#fce9e5;color:#8f2a26;font-size:14px;font-weight:850}'
                '.c-guide{margin:12px 0 0;padding:0;list-style:none;font-size:14px;line-height:1.6;color:#d9e0e8}.c-guide b{color:#f0b593}'
                '.c-story .story-seam.c-switch{background:#e6e9ed;color:#17243a;font-weight:850}'
                '.c-story .end p{font-size:16px}'
                # 흐름 바로 가기 줄(개화기·조선·고려·독도와 간도 웹툰과 같은 방식): 높이 60px 고정, 좁은 화면에서 오른쪽 92px는 홈 버튼 자리, 가로 스크롤은 안쪽 트랙에서만
                '.c-story nav.c-nav{position:sticky;top:0;z-index:5;height:60px;box-sizing:border-box;display:flex;align-items:center;margin:0;padding:0 92px 0 10px;background:#edf0f4;border-bottom:1px solid #d9dee5}'
                '.c-story .c-nav-track{display:flex;align-items:center;gap:6px;min-width:0;width:100%;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scrollbar-width:none}.c-story .c-nav-track::-webkit-scrollbar{display:none}'
                '.c-story nav.c-nav a{flex:none;display:inline-flex;align-items:center;min-height:44px;padding:0 14px;color:#263a55;font-weight:800;font-size:14px;text-decoration:none;background:#fff;border:1px solid #d4dae1;border-radius:99px;white-space:nowrap}'
                '.c-story .comic-home{top:calc(9px + env(safe-area-inset-top));min-height:42px}'
                '@media(min-width:760px){.c-story nav.c-nav{padding-right:10px}}'
                '.c-story .scene,.c-story .c-flow,.c-story .c-mem{scroll-margin-top:68px}'
                '@media(max-width:400px){.c-talk{grid-template-columns:1fr;gap:12px;margin:8px 14px 0}.c-steps{margin:12px 14px 0}.c-art-cap,.c-art-note,.c-talk-cap,.c-stress{margin-left:14px;margin-right:14px}.c-story .scene>.key{margin-left:14px;margin-right:14px}.c-story .c-head{padding:16px 14px 12px}.c-mem{padding-left:14px;padding-right:14px}}'
                '.embedded .c-story nav{display:none}'
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
    s = open(os.path.join(MEDIA, 'lecture-flow-colonial.js'), encoding='utf-8').read()
    m = re.search(r'/\*FLOW-JSON\*/(.*?)/\*END-FLOW-JSON\*/', s, re.S)
    if not m:
        raise SystemExit('media/lecture-flow-colonial.js 에 흐름 데이터(FLOW-JSON)가 없어요.')
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
    return ('<div class="c-art" data-panel="colonial-p%02d"><svg class="c-panel" viewBox="%d %d %d %d" width="%d" height="%d" role="img" aria-label="%s" focusable="false" preserveAspectRatio="xMidYMid meet">'
            '<image href="%s" x="0" y="0" width="%d" height="%d"/></svg></div>') % (sc['panel'], x, y, w, h, w, h, e(sc['alt']), SHEET, SHEET_W, SHEET_H)


def scene_html(sc, n, vocab):
    attrs = (' data-orig="%d"' % sc['orig']) if sc.get('orig') else ''
    attrs += ' id="%s"' % e(sc['id'])
    attrs += ' data-added="density"' if sc.get('added') else ''
    head = '<div class="c-head"><div class="meta"><span data-scene-count data-format="n">%02d</span> · %s</div><h2>%s</h2><p class="c-when">%s</p></div>' % (
        n, e(sc['label']), e(sc['title']), e(sc['when']))
    cap = '<p class="c-art-cap">개념 그림 · 실제 인물의 초상이나 현장 사진이 아니에요.</p>'
    note = '<p class="c-art-note">%s</p>' % e(sc['art_note']) if sc.get('art_note') else ''
    talk = ('<p class="c-talk-cap">학습용 요약 대화 · 실제 발언을 그대로 옮긴 것이 아니에요.</p><div class="c-talk">%s</div>'
            % ''.join('<p aria-label="%s: %s"><b>%s</b><span>%s</span></p>' % (e(who(w)), e(t), e(who(w)), e(t)) for w, t in (sc['a'], sc['b'])))
    seen = set()
    steps = '<ol class="c-steps" aria-label="장면 설명">%s</ol>' % ''.join(
        '<li><b class="st %s">%s</b><span>%s</span></li>' % (k, e(l), bold_terms(t, seen, vocab)) for l, k, t in sc['steps'])
    stress = '<p class="c-stress"><b>강의 강조</b>%s</p>' % e(sc['stress']) if sc.get('stress') else ''
    more = ''.join('<details class="scene-more"><summary>%s</summary><p>%s</p></details>' % (e(t), e(x)) for t, x in sc.get('more', []))
    return '<section class="scene"%s>%s%s%s%s%s%s<p class="key">%s</p>%s%s</section>' % (
        attrs, head, art_html(sc), cap, note, talk, steps, e(sc['key']), stress, more)


def memory_html(after, chunks):
    def one(k):
        memo = ('<div class="c-memo"><b>%s</b><p>%s</p><p>%s</p></div>' % (e(k['memo']['label']), e(k['memo']['text']), e(k['memo']['note']))) if k.get('memo') else ''
        wrong = '<p class="c-mem-x"><b>헷갈리지 않기</b>%s</p>' % em(k['x']) if k.get('x') else ''
        return ('<div class="c-mem-k"><p class="c-mem-head"><b class="c-mem-t">%s</b><span class="c-mem-w">%s</span></p><div class="c-mem-story">%s</div>%s%s'
                '<p class="c-keys"><span class="c-keys-label">암기 키워드</span>%s</p></div>') % (
            e(k['t']), e(k['w']), ''.join('<p>%s</p>' % em(x) for x in k['story']), memo, wrong, ''.join('<span class="c-key">%s</span>' % e(x) for x in k['k']))
    return '<aside class="c-mem" id="mem-%s" aria-label="이 부분에서 외울 것: %s"><p class="c-mem-label">이 부분에서 외울 것</p>%s</aside>' % (
        e(after), e(' · '.join(k['t'] for k in chunks)), '<ul>' + ''.join('<li><b>%s</b> · %s</li>' % (e(k['t']), e(' → '.join(k['k']))) for k in chunks) + '</ul><details><summary>세부 내용 펼쳐보기</summary>' + ''.join(one(k) for k in chunks) + '</details>')


def bridge_html(sc):
    if not sc.get('next'):
        return ''
    text, switch = sc['next']
    return '<div class="story-seam%s" aria-label="이야기 흐름"><span class="story-seam-dots" aria-hidden="true">…</span><span class="story-seam-text">%s</span></div>' % (
        ' c-switch' if switch else '', e(text))


def build():
    check_sheet()
    # Group the same 18 scenes by decade without deleting a scene or detailed memory chunk.
    order=['scene-1','scene-2','scene-3','scene-4','secret-societies','scene-5','scene-6','singanhoe','social-movements','uiyeoldan','scene-7','scene-8','scene-10','language-history','manchuria-1930s','scene-9','scene-11','scene-12']
    by_id={sc['id']:sc for sc in SCENES}
    ordered=[dict(by_id[key]) for key in order]
    joins={'scene-4':('같은 1910년대, 국내 비밀 결사와 해외 독립운동 기지도 살펴봐요.',False),'secret-societies':('이제 1920년대, 통치 방식과 독립운동이 어떻게 바뀌었는지 함께 봐요.',True),'social-movements':('같은 1920년대, 의열단과 만주 독립군의 활동도 이어서 봐요.',False),'scene-8':('1930년대 이후로 넘어가요. 민족 말살 통치는 1937년 중일 전쟁 이후예요.',True),'language-history':('이어서 1930년대 만주의 무장 투쟁과 한인애국단을 봐요.',False)}
    for sc in ordered:
        if sc['id'] in joins:sc['next']=joins[sc['id']]
    keys = [sc['id'] for sc in ordered]
    if len(keys) != 18 or len(set(keys)) != 18 or any(sc['panel'] not in PANELS for sc in SCENES):
        raise SystemExit('일제 강점기 장면은 18개, id는 서로 달라야 하고 칸 번호는 1–12여야 해요.')
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
        last = keys[keys.index(flow['list'][i + 1]['start']) - 1] if i + 1 < len(flow['list']) else keys[-1]
        ends[last] = group['chunks']
    src = open(os.path.join(MEDIA, FILE), encoding='utf-8').read()
    head = re.sub(r'<style id="hanq-colonial-story">.*?</style>', '', src[:src.index('</head>')], flags=re.S) + COLONIAL_CSS
    tail = src[src.index('</main>'):]
    body, scenes, memory = '', [], []
    for n, sc in enumerate(ordered, 1):
        if sc['id'] in starts:
            f = starts[sc['id']]
            body += '<div class="c-flow" id="%s"><small>%s · %s</small><h2 id="%s-h">%s %s</h2><p>%s</p></div>\n' % (
                e(f['id']), e(f['no']), e(f['range']), e(f['id']), e(f['no']), e(f['name']), e(f['lead']))
        if sc['id']=='secret-societies':body+='<span class="legacy-anchor" id="flow-4" aria-hidden="true"></span><span class="legacy-anchor" id="flow-4-h" aria-hidden="true"></span>'
        card = '<span class="legacy-anchor" id="mem-%s" aria-hidden="true"></span>' % e(sc['id']) if sc['id'] in old_ends and sc['id'] not in ends else ''
        if sc['id'] in ends:
            card = memory_html(sc['id'], ends[sc['id']])
            memory.append(dict(after=sc['id'], scene=n, chunks=[k['t'] for k in ends[sc['id']]]))
        body += scene_html(sc, n, vocab) + card + bridge_html(sc) + '\n'
        fl = [f['id'] for f in flow['list'] if keys.index(f['start']) <= n - 1][-1]
        scenes.append(dict(id=sc['id'], scene=n, flow=fl, orig=sc.get('orig'), added=bool(sc.get('added')), panel=sc['panel'], rect=list(PANELS[sc['panel']]),
                           reused=bool(sc.get('reuse')), depicts=sc['alt'], key=sc['key'], speakers=[w for w, _ in (sc['a'], sc['b'])],
                           stress=sc.get('stress'), teacher_lines=sc['src']))
    guide = ('<ul class="c-guide"><li><b>세 묶음</b> ① 1910년대 무단 통치 → ② 1920년대 문화 통치 → ③ 1930년대 이후 민족 말살 통치. 각 시기의 독립운동을 함께 읽어요. 민족 말살 통치는 1937년 이후이며 말·역사 지키기는 1920년대부터의 주제별 보충이에요.</li>'
             '<li><b>컷마다</b> 시기 → 그림 → 대화 → 설명 → 꼭 기억을 읽어요. 강의가 직접 짚은 말은 ‘강의 강조’로 표시해요.</li>'
             '<li><b>큰 흐름 끝</b>마다 ‘이 부분에서 외울 것’으로 사람·사건을 이어서 정리해요.</li></ul>')
    header = ('<header><small>한국사 한눈에 · 시대 웹툰</small><h1>일제 강점기와 독립운동</h1><p>통치 방식의 변화와 국내외 독립운동</p>' + guide + '</header>'
              '<nav class="c-nav" aria-label="일제 강점기 흐름 바로 가기"><div class="c-nav-track">%s</div></nav>'
              '<div class="chapter-line">%s</div>\n') % (''.join('<a href="#%s">%s %s</a>' % (e(f['id']), e(f['no']), e(f['name'])) for f in flow['list']), e(flow['note']))
    end = ('<div class="end"><strong>이 시대 한 줄 흐름</strong>'
           '<p>통치: 1910년대 무단 통치(헌병 경찰·태형령·회사령·토지조사사업) → 1919 3·1 운동·임시정부 → 1920년대 이른바 문화 통치(보통 경찰·치안유지법·산미증식계획) → 1937 중일 전쟁 뒤 민족 말살 통치</p>'
           '<p>독립운동: 1910년대 비밀 결사·해외 기지 → 1920년대 의열단·봉오동·청산리 → 1930년대 한국독립군·조선혁명군·한인애국단 → 조선의용대(1938)·한국광복군(1940) → 1945 광복</p>'
           '<a href="../index.html#chapter/colonial/quiz" target="_top">다 읽었다면 퀴즈로 확인하기 →</a></div>')
    doc = head + '</head><body class="c-story"><a class="comic-home" href="../index.html" aria-label="시대별 목차로 이동">⌂ 홈</a><main>' + header + body + end + tail
    with open(os.path.join(MEDIA, FILE), 'w', encoding='utf-8') as f:
        f.write(doc)
    cmap = dict(generated_by='scripts/build_colonial_comic.py',
                note='일제 강점기 웹툰 장면(화면 순서)·흐름·원본 칸·기존 꼭 기억 단서·강의 강조와 근거 행, 이 부분에서 외울 것 카드 위치. 그림판은 바이트 그대로이고 칸 하나를 SVG viewBox로 통째로 보여 준다.',
                panel_source=dict(file='media/' + SHEET, sha256=SHEET_SHA, width=SHEET_W, height=SHEET_H,
                                  panels={'p%02d' % k: dict(x=v[0], y=v[1], w=v[2], h=v[3]) for k, v in sorted(PANELS.items())}),
                scenes=scenes, memory=memory)
    with open(os.path.join(ROOT, 'docs', 'colonial-comic-map.json'), 'w', encoding='utf-8') as f:
        json.dump(cmap, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print('일제 강점기 장면', len(scenes), '· 흐름', len(flow['list']), '· 카드', len(memory))


if __name__ == '__main__':
    build()

# Source-backed supplementary learning cuts; original scene keys stay unchanged.
from study_supplements import apply as apply_study_supplements
apply_study_supplements()
