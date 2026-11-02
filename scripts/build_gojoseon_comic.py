# -*- coding: utf-8 -*-
"""고조선과 여러 나라 웹툰(media/gojoseon-comic.html)을 강의 흐름(① 고조선 · ② 여러 나라)에 맞춘 한 페이지 학습으로 다시 엮는다.

  python3 scripts/build_gojoseon_comic.py

- 기존 파일의 <head>(스타일)와 </main> 뒤 스크립트(가장자리 밀기 · 진행 막대 · 장면 번호 · 용어 풀이)는 그대로 두고, 본문만 아래 SCENES 정의로 다시 쓴다.
  이 웹툰 전용 스타일(hanq-gojoseon-story)은 지우고 다시 넣어 여러 번 실행해도 결과가 같다.
- 장면 12개의 id·순서·제목·꼭 기억 단서는 기존 웹툰 그대로다.
- 그림: media/gojoseon-panels/01–08.webp(모두 508×380, 조정자가 sips로 잰 실제 크기 · 선사시대 그림 539×358과 다름)을 바이트 그대로, 확대·잘라 내기 없이 원래 비율로 보여 준다. 그림 칸은 실제 비율(--gj-ar)만큼
  미리 자리를 잡아 늦게 불러와도 높이가 0이 되지 않는다. 예전에 확대해 쓰던 덧붙인 장면 4개는 같은 그림 전체를 다시 쓰고, 그렇다고 화면에 밝힌다.
  그림 크기가 508×380이 아니면 멈춘다(크기 확인을 끄지 않는다).
- 흐름 머리와 ‘이 부분에서 외울 것’ 카드는 media/lecture-flow-gojoseon.js의 /*FLOW-JSON*/ … /*END-FLOW-JSON*/를 읽는다.
- 말풍선은 그림 밖(아래)에 둔다. 기록에 이름이 없는 화자는 ‘설명용 인물’, 오늘날의 풀이는 ‘해설’로 밝힌다. 스타일은 body.gj-story 안에서만 쓴다.
- 출력: media/gojoseon-comic.html, docs/gojoseon-comic-map.json. 시간·난수·개인 경로를 쓰지 않는다. 근거는 docs/gojoseon-scene-sources.md.
"""
import html, json, os, re, struct

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA = os.path.join(ROOT, 'media')
FILE = 'gojoseon-comic.html'
PANEL_W, PANEL_H = 508, 380
e = lambda s: html.escape(s, quote=True)

# 기록에 이름이 남지 않은 설명용 인물(천군·신지는 사람 이름이 아니라 직책). 준왕·위만만 실제 인물. ‘해설’로 시작하는 화자는 오늘날의 풀이.
GENERIC = {'상인', '동료', '마을 어른', '전령', '주민', '신하', '부여 사람', '청년', '옥저 사람', '바닷가 사람', '여행자', '동예 사람', '제사장', '천군', '신지'}
GUIDE_SPEAKER = '해설 · 오늘날의 풀이'

# 장면 정의(화면 순서 = 기존 순서). panel: gojoseon-panels/NN.webp. orig: 원래 장면 번호(data-orig) · added: 덧붙인 장면(data-added="density") · reuse: 앞 장면 그림 전체를 다시 씀
#  when: 나라·사건 줄 · steps: [(이름, cause|dev|res|item, 문장)] · key: 기존 꼭 기억 단서(글자 그대로) · stress: 강의가 직접 짚은 말(근거 행은 src·문서)
#  more: [(제목, 문장)] 접힌 보충 · next: (다음 장면으로 잇는 말, 흐름이 바뀌면 True) · src: 강의 행
SCENES = [
    dict(id='scene-1', orig=1, panel=1, label='고조선 · 건국', title='첫 나라의 이야기', when='고조선 · 단군왕검이 세웠다는 건국 이야기 · 수도 왕검성',
         alt='첫 나라의 이야기 장면', a=('상인', '우리 마을은 왕검성으로 물건을 보냅니다.'), b=('동료', '단군왕검이 세운 나라라는 이야기가 전해지지.'),
         steps=[('건국', 'item', '고조선은 단군왕검이 세웠다고 전해지는 우리나라 최초의 국가다.'),
                ('수도', 'item', '고조선의 수도는 왕검성이었다.'),
                ('관직', 'item', '왕 아래에 상·대부·장군 같은 관직을 두었다.')],
         key='고조선 = 단군왕검 건국 전승·왕검성',
         next=('나라를 세운 이야기와 함께, 사람들이 지킬 법도 남았다.', False), src='47–52'),
    dict(id='gojoseon-law', added=True, panel=1, reuse=True, label='고조선 · 범금 8조', title='나라를 세운 이야기와 법', when='고조선 · 범금 8조(8조법) · 단군 건국 이야기',
         alt='왕검성 앞 장터의 고조선 사람들(앞 장면과 같은 그림 · 그림 전체 다시 사용)', a=('마을 어른', '범금 8조로 생명과 재산을 지키지.'), b=(GUIDE_SPEAKER, '단군 건국 이야기에서 홍익인간과 제정일치를 읽을 수 있어요.'),
         art_note='그림: ‘첫 나라의 이야기’ 장면과 같은 그림 전체를 확대하지 않고 다시 썼어요.',
         steps=[('법', 'item', '사회 질서를 유지하기 위해 범금 8조를 두었다.'),
                ('내용', 'item', '사람을 죽인 자는 사형에 처하고, 상처를 입힌 자는 곡식으로 갚게 하고, 도둑질한 자는 노비로 삼았다.'),
                ('의미', 'item', '범금 8조로 보아 생명과 노동력, 사유 재산을 중시한 사회였다.'),
                ('이야기', 'item', '단군 건국 이야기에는 홍익인간과 제정일치의 모습이 담겨 있다.')],
         key='단군 건국 이야기 = 홍익인간·제정일치 / 범금 8조 = 생명·노동력·사유 재산 중시',
         stress='고조선에서 제일 시험에 잘 나오고 제일 중요한 것은 “사회 질서를 유지하기 위해 범금 8조를 두었다”라고 짚었어요.',
         next=('나라가 자라자 서쪽 연과 맞닿은 국경도 흔들렸다.', False), src='54–58'),
    dict(id='scene-2', orig=2, panel=2, label='고조선 · 연의 공격', title='국경에 닥친 전쟁', when='고조선 · 연(중국)의 장수 진개의 공격',
         alt='국경에 닥친 전쟁 장면', a=('전령', '연의 장수 진개가 공격해 옵니다!'), b=('주민', '서쪽 땅을 지켜야 해요.'),
         steps=[('배경', 'cause', '고조선은 이웃한 중국의 연나라와 맞서고 있었다.'),
                ('전개', 'dev', '연나라의 장수 진개가 고조선을 공격해 왔다.'),
                ('결과', 'res', '이를 통해 고조선이 중국 세력과 대립했음을 알 수 있다.'),
                ('구분', 'item', '진개는 연나라의 장수이고, 뒤에 고조선을 멸망시킨 것은 한나라의 무제다. 서로 다른 나라, 다른 때의 공격이다.')],
         key='고조선 = 연 장수 진개의 침략',
         next=('연의 공격이 있은 뒤 시간이 흘러, 준왕의 나라에 위만이 들어왔다.', False), src='52–53'),
    dict(id='scene-3', orig=3, panel=3, label='고조선 · 위만의 집권', title='왕위가 바뀌다', when='고조선 · 위만이 준왕을 몰아냄 → 위만 조선',
         alt='왕위가 바뀌다 장면', a=('준왕', '위만에게 서쪽 국경을 맡겨도 되겠소?'), b=('위만', '그곳에서 세력을 키우겠습니다.'),
         steps=[('배경', 'cause', '준왕은 중국에서 넘어온 위만에게 서쪽 국경 지역을 맡겼다.'),
                ('전개', 'dev', '그곳에서 세력을 키운 위만은 준왕을 몰아내고 왕이 되었다.'),
                ('결과', 'res', '이때부터를 위만 조선이라 부른다.')],
         key='위만이 준왕을 몰아냄 → 진번·임둔 복속 → 우거왕 때 한 무제 침략·왕검성 함락',
         next=('왕위를 차지한 위만은 철과 교역으로 나라를 키웠다.', False), src='49–51'),
    dict(id='wiman-trade', added=True, panel=3, reuse=True, label='고조선 · 위만 조선의 성장과 멸망', title='철기와 중계 무역',
         when='위만 조선 · 철기 문화 · 진번·임둔 복속 · 중계 무역 → 우거왕 때 한 무제의 공격',
         alt='궁궐에서 위만과 신하가 이야기하는 장면(앞 장면과 같은 그림 · 그림 전체 다시 사용)', a=('신하', '위만 이후 철기 문화가 더 퍼졌습니다.'), b=('위만', '중국과 진 사이 중계 무역으로 이익을 얻자.'),
         art_note='그림: ‘왕위가 바뀌다’ 장면과 같은 그림 전체를 확대하지 않고 다시 썼어요.',
         steps=[('배경', 'cause', '위만 조선은 철기 문화를 받아들여 힘을 키웠다.'),
                ('전개', 'dev', '진번과 임둔을 복속해 영토를 넓히고, 중국과 한반도 남쪽의 진 사이에서 중계 무역으로 이익을 얻었다.'),
                ('멸망', 'item', '우거왕 때 한 무제의 공격으로 수도 왕검성이 함락되어 고조선이 멸망했다.'),
                ('그 뒤', 'item', '한나라는 고조선 지역을 다스리려고 한사군이라 불리는 군현을 설치했다.')],
         key='위만 조선 = 철기 문화 수용·진번·임둔 복속·중국과 진 사이 중계 무역 → 우거왕 때 한 무제 공격·왕검성 함락',
         stress='진번과 임둔을 복속시켰다는 표현이 나와도 고조선이라고 짚었어요.',
         next=('이제 고조선에 이어 여러 나라를 봐요. 차례로 이어진 나라가 아니라 지역마다 나란히 있던 나라들이라, 북쪽부터 지역별로 봐요.', True), src='53–59'),
    dict(id='scene-4', orig=4, panel=4, label='여러 나라 · 부여(북쪽)', title='북쪽 넓은 들판의 부여', when='부여 · 연맹 왕국 · 사출도 · 영고(12월)',
         alt='북쪽 넓은 들판의 부여 장면', a=('부여 사람', '마가와 우가가 각자 사출도를 맡아요.'), b=('동료', '12월 영고도 곧 시작이군요!'),
         steps=[('정치', 'item', '왕 아래 마가·우가·저가·구가가 각자 사출도를 다스려, 왕권이 강하지 않았다.'),
                ('제천', 'item', '12월에 영고라는 제천 행사를 열었다.'),
                ('법·풍습', 'item', '도둑질하면 12배로 갚게 하는 1책 12법과 소의 굽으로 길흉을 점치는 우제점법이 있었다.')],
         key='부여 = 사출도·영고(12월)·1책 12법·우제점법', stress='부여에서 제일 시험에 잘 나오는 것은 사출도라고 짚었어요.',
         next=('남쪽 산악 지역으로 가니 고구려의 5부가 보였다.', False), src='59–65'),
    dict(id='scene-5', orig=5, panel=5, label='여러 나라 · 고구려', title='산성 아래의 고구려', when='고구려 · 5부 연맹 · 제가회의 · 동맹(10월) · 서옥제',
         alt='산성 아래의 고구려 장면', a=('청년', '혼인하면 신부 집 뒤에 서옥을 짓는대.'), b=('동료', '제가회의에선 나라 일도 의논하지.'),
         steps=[('정치', 'item', '계루부·소노부 등 5부의 연맹체로, 귀족 회의인 제가회의에서 나라의 중대사를 정했다.'),
                ('관직', 'item', '왕 아래 상가·대로·패자 같은 관직이 있었고, 대가들은 사자·조의·선인을 거느렸다.'),
                ('제천', 'item', '10월에 동맹이라는 제천 행사를 열었다.'),
                ('혼인', 'item', '혼인한 뒤 남자가 여자 집 뒤에 서옥을 짓고 살다가 자식이 자라면 함께 남자 집으로 돌아가는 서옥제가 있었다.')],
         key='고구려 = 계루부·제가회의·서옥제·동맹(10월)', stress='고구려는 동맹 · 제가회의 · 서옥제 세 가지를 기억하라고 짚었어요.',
         next=('산을 넘어 바닷가 옥저로 내려가자 삶의 방식이 달랐다.', False), src='65–72 · 95–97'),
    dict(id='scene-6', orig=6, panel=6, label='여러 나라 · 옥저(동해안)', title='바닷가의 옥저', when='옥저 · 소금·해산물 · 민며느리제 · 골장제',
         alt='바닷가의 옥저 장면', a=('옥저 사람', '소금과 해산물을 다른 나라에 팔아.'), b=('동료', '민며느리제와 골장제도 우리 풍습이지.'),
         steps=[('경제', 'item', '동해안에 있어 소금과 해산물이 특산물이었다.'),
                ('혼인', 'item', '여자아이를 남자 집에서 데려다 키우고, 성인이 되면 남자 집이 여자 집에 예물을 주고 혼인하는 민며느리제가 있었다.'),
                ('장례', 'item', '시신을 임시로 묻었다가 뼈만 추려 온 가족의 뼈를 하나의 곽에 안치하는 골장제(가족 공동 무덤)가 있었다.')],
         key='옥저 = 소금·해산물·민며느리제·골장제', stress='옥저는 민며느리제와 골장제가 중요하다고 짚었어요.',
         next=('바닷가 마을을 다스리는 사람은 왕이 아니었다.', False), src='72–78'),
    dict(id='eupgun-samno', added=True, panel=6, reuse=True, label='여러 나라 · 옥저와 동예의 공통점', title='왕 대신 읍군·삼로가', when='옥저·동예 공통 · 군장 국가 · 읍군·삼로',
         alt='바닷가 마을에서 이야기를 나누는 사람들(앞 장면과 같은 그림 · 그림 전체 다시 사용)', a=('바닷가 사람', '우리 마을은 왕 없이 읍군·삼로가 이끌어요.'), b=('여행자', '옥저도 동예도 그 점은 같군요.'),
         art_note='그림: ‘바닷가의 옥저’ 장면과 같은 그림 전체를 확대하지 않고 다시 썼어요.',
         steps=[('정치', 'item', '옥저와 동예에는 왕이 없고, 읍군·삼로라는 군장이 읍락을 다스렸다.'),
                ('구분', 'item', '다스리는 방식은 같아도 풍습은 다르다. 민며느리제·골장제는 옥저, 책화·무천은 동예다.')],
         key='옥저·동예 공통 = 왕 없이 읍군·삼로가 지배 / 풍습은 서로 다름',
         next=('해안길 끝, 동예의 사람들은 경계를 엄격히 지켰다.', False), src='77–81'),
    dict(id='scene-7', orig=7, panel=7, label='여러 나라 · 동예(동해안)', title='경계를 지키는 동예', when='동예 · 책화 · 무천(10월) · 단궁·과하마·반어피',
         alt='경계를 지키는 동예 장면', a=('동예 사람', '저 산을 함부로 넘으면 책화로 배상해요.'), b=('여행자', '무천 날엔 함께 춤추겠군요.'),
         steps=[('사회', 'item', '읍락 사이의 경계를 중시해, 다른 읍락을 침범하면 노비나 소·말로 갚게 하는 책화가 있었다.'),
                ('제천', 'item', '10월에 무천이라는 제천 행사를 열고 밤낮으로 음주가무를 즐겼다.'),
                ('특산물', 'item', '특산물로 단궁(활), 과하마(작은 말), 반어피(바다표범 가죽)가 유명했다.')],
         key='동예 = 책화·무천(10월)·단궁·과하마·반어피', stress='동예에서는 책화가 제일 중요하다고 짚었어요.',
         next=('더 남쪽 삼한의 들판에는 벼와 철의 교역이 이어졌다.', False), src='79–82 · 98–99'),
    dict(id='scene-8', orig=8, panel=8, label='여러 나라 · 삼한(남쪽)', title='철과 벼가 자라는 삼한', when='삼한(마한·진한·변한) · 제정 분리 · 벼농사 · 변한의 철',
         alt='철과 벼가 자라는 삼한 장면', a=('상인', '변한의 덩이쇠를 낙랑에 팔러 갑니다.'), b=('제사장', '소도의 제사는 천군이 맡지요.'),
         steps=[('정치', 'item', '정치 지도자는 신지·읍차, 제사장은 천군으로, 정치와 제사가 나뉜 제정 분리 사회였다.'),
                ('소도', 'item', '천군이 다스리는 신성 지역 소도에는 죄인이 달아나도 함부로 들어가 잡을 수 없었다.'),
                ('경제', 'item', '남쪽이라 벼농사가 발달했고, 변한은 철을 생산해 덩이쇠를 낙랑에 수출했다.')],
         key='삼한 = 벼농사·변한 철·천군·소도·신지·읍차', stress='시험 선택지에 소도가 보이면 삼한이라고 짚었어요.',
         next=('벼와 철이 오가는 들판에서 계절마다 제사가 열렸다.', False), src='82–87 · 98'),
    dict(id='samhan-rites', added=True, panel=8, reuse=True, label='여러 나라 · 삼한의 제사', title='5월과 10월의 계절 제사', when='삼한 · 5월(씨뿌리기 뒤) · 10월(농사 마친 뒤) 계절제',
         alt='들판에서 제사장과 사람들이 모인 장면(앞 장면과 같은 그림 · 그림 전체 다시 사용)', a=('천군', '5월과 10월, 계절마다 제사를 올리자.'), b=('신지', '정치는 신지·읍차가, 제사는 천군이 맡지요.'),
         art_note='그림: ‘철과 벼가 자라는 삼한’ 장면과 같은 그림 전체를 확대하지 않고 다시 썼어요.',
         steps=[('제사', 'item', '씨뿌리기가 끝난 5월과 농사를 마친 10월에 계절마다 제사를 지냈다.'),
                ('구분', 'item', '정치는 신지·읍차가, 제사는 천군이 소도에서 맡았다.')],
         key='삼한 = 정치(신지·읍차)와 제사(천군·소도) 분리 / 5월·10월 계절 제사',
         next=None, src='83–86'),
]

GOJOSEON_CSS = ('<style id="hanq-gojoseon-story">/* 고조선과 여러 나라: 흐름 머리 → 나라 줄 → 그림(원래 비율, 자리 먼저) → 그림 밖 말풍선 → 설명 → 꼭 기억 · 강의 강조 → (덩어리 끝) 이 부분에서 외울 것 → 다음 장면 잇기 */'
                '.gj-story .scene{padding:0 0 22px;opacity:1!important;transform:none!important;content-visibility:visible!important}'
                '.gj-story .gj-head{padding:18px 18px 12px}.gj-story .gj-head .meta{font-size:13px;color:#667085;font-weight:800}'
                '.gj-story .gj-head h2{font-size:clamp(22px,6vw,28px);line-height:1.25;letter-spacing:-.04em;margin:6px 0 6px;word-break:keep-all}'
                '.gj-story .gj-when{margin:0;color:#a72d27;font-size:14.5px;line-height:1.5;font-weight:850;word-break:keep-all;overflow-wrap:anywhere}'
                # 그림: 예전 .art img{aspect-ratio:1.33;object-fit:cover}(잘림)와 확대 transform은 쓰지 않는다. 칸이 실제 그림 비율(--gj-ar)만큼 먼저 자리를 잡고, 그림은 contain으로 원래 비율 그대로
                '.gj-story .gj-art{display:block;width:100%;aspect-ratio:var(--gj-ar);background:#d8d2c4;line-height:0}'
                '.gj-story .gj-art img{display:block;width:100%;height:100%;object-fit:contain;transform:none}'
                '.gj-art-cap{margin:6px 18px 0;font-size:13px;font-weight:750;line-height:1.5;color:#4b5565}.gj-art-note{margin:2px 18px 0;font-size:13px;line-height:1.5;color:#5b6576}'
                '.gj-talk-cap{margin:12px 18px 0;font-size:13px;font-weight:800;line-height:1.4;color:#5b6576}'
                '.gj-talk{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin:8px 18px 0}'
                '.gj-talk p{margin:0;padding:10px 12px 11px;background:#fff;border:2px solid #26384c;border-radius:16px 16px 16px 5px;color:#243248;line-height:1.5}'
                '.gj-talk p+p{background:#eef6ff;border-color:#315d80;border-radius:16px 16px 5px 16px}'
                '.gj-talk b{display:block;margin-bottom:4px;font-size:14px;font-weight:900;color:#b52d34}.gj-talk p+p b{color:#315d80}'
                '.gj-talk span{display:block;font-size:16px;font-weight:700;word-break:keep-all;overflow-wrap:anywhere}'
                '.gj-steps{list-style:none;margin:12px 18px 0;padding:0;display:grid;gap:7px}'
                '.gj-steps li{display:grid;grid-template-columns:3.6em minmax(0,1fr);gap:8px;align-items:baseline;font-size:16px;line-height:1.65;color:#2b3443;word-break:keep-all;overflow-wrap:anywhere}'
                '.gj-steps .st{display:block;padding:1px 2px;border-radius:6px;text-align:center;font-size:12.5px;font-weight:900;line-height:1.5;background:#eef1f4;color:#4b5565}'
                '.gj-steps .st.dev{background:#fff0e9;color:#a72d27}.gj-steps .st.res{background:#e9f4ec;color:#2f6b3c}.gj-steps .st.item{background:#f6f1e7;color:#7a5a24}'
                '.gj-steps strong,.gj-mem strong{color:#b52d34;font-weight:900}'
                '.gj-story .scene>.key{margin:12px 18px 0;padding:10px 12px;border-left:4px solid #d83b32;background:#fff0e9;color:#a72d27;font-size:15px;font-weight:850;line-height:1.55;word-break:keep-all;overflow-wrap:anywhere}'
                '.gj-stress{margin:8px 18px 0;font-size:14px;line-height:1.55;color:#294d87;font-weight:750;word-break:keep-all}.gj-stress b{margin-right:6px;padding:1px 7px;border-radius:6px;background:#eef2f8;font-size:12.5px;font-weight:900}'
                '.gj-story .scene-more{margin:10px 18px 0;padding:4px 12px;border:1px dashed #d6c7a3;border-radius:10px;background:#fffaf0;font-size:15px;line-height:1.6;color:#3d4859}'
                '.gj-story .scene-more>summary{display:flex;align-items:center;min-height:44px;cursor:pointer;font-weight:850}.gj-story .scene-more>summary:focus-visible{outline:3px solid #294d8766;outline-offset:2px;border-radius:6px}.gj-story .scene-more p{margin:2px 0 10px}'
                '.gj-story .gj-flow{padding:18px 18px 16px;background:#17243a;color:#fff}.gj-story .gj-flow:focus{outline:3px solid #f0b593;outline-offset:-3px}'
                '.gj-story .gj-flow small{display:block;color:#f0b593;font-size:13px;font-weight:800}.gj-story .gj-flow h2{margin:4px 0 0;color:#fff;font-size:clamp(20px,5.5vw,24px);line-height:1.3;word-break:keep-all}'
                '.gj-story .gj-flow p{margin:6px 0 0;font-size:15px;line-height:1.6;color:#dce5f0;word-break:keep-all}'
                '.gj-mem{margin:0;padding:16px 18px 18px;background:#fff8e8;border-top:4px solid #e5a337;border-bottom:1px solid #f0dfb8}'
                '.gj-mem-label{margin:0 0 8px;font-size:17px;font-weight:900;color:#7a4b0d}.gj-mem-k+.gj-mem-k{margin-top:14px;padding-top:12px;border-top:1px dashed #e3cf9f}'
                '.gj-mem-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 10px;margin:0 0 6px}.gj-mem-t{font-size:17px;font-weight:900}.gj-mem-w{font-size:14px;font-weight:800;color:#294d87}'
                '.gj-mem-story p{margin:0 0 6px;font-size:16px;line-height:1.7;color:#243248;word-break:keep-all;overflow-wrap:anywhere}'
                '.gj-memo{margin:8px 0;padding:10px 12px;border-left:4px solid #e5a337;border-radius:8px;background:#fff}.gj-memo b{display:block;font-size:14px;font-weight:900}.gj-memo p{margin:4px 0 0;font-size:16px;line-height:1.7}.gj-memo p+p{font-size:15px;color:#5b4a26}'
                '.gj-mem-x{margin:8px 0 0;font-size:16px;line-height:1.7;color:#3b3220;word-break:keep-all;overflow-wrap:anywhere}.gj-mem-x b{margin-right:6px;padding:1px 7px;border-radius:6px;background:#fce9e5;color:#8f2a26;font-size:13px;font-weight:900}'
                '.gj-keys{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:8px 0 0}.gj-keys-label{font-size:13px;font-weight:900;color:#5b6576}.gj-key{padding:3px 9px;border-radius:999px;background:#fce9e5;color:#8f2a26;font-size:14px;font-weight:850}'
                '.gj-guide{margin:12px 0 0;padding:0;list-style:none;font-size:14px;line-height:1.6;color:#d9e0e8}.gj-guide b{color:#f0b593}'
                '.gj-story .chapter-line{padding:15px 22px;background:#e6e9ed;color:#314057;font-weight:800;font-size:14px;line-height:1.6;word-break:keep-all}'
                '.gj-story .story-seam{display:flex;align-items:center;justify-content:center;gap:9px;margin:0;padding:13px 20px 15px;background:linear-gradient(180deg,#fff 0%,#f7f2e9 52%,#fff 100%);color:#3d4b5d;font-size:14px;line-height:1.55;font-weight:750}'
                '.gj-story .story-seam-dots{flex:none;color:#b53940;font-size:26px;line-height:1;font-weight:900;letter-spacing:2px}.gj-story .story-seam-text{flex:0 1 auto}'
                '.gj-story .story-seam.gj-switch{background:#e6e9ed;color:#17243a;font-weight:850}'
                '.gj-story .end p{font-size:16px}'
                # 흐름 바로 가기 줄(다른 강의 구성 웹툰과 같은 방식): 높이 60px 고정, 좁은 화면에서 오른쪽 92px는 홈 버튼 자리, 가로 스크롤은 안쪽 트랙에서만
                '.gj-story nav.gj-nav{position:sticky;top:0;z-index:5;height:60px;box-sizing:border-box;display:flex;align-items:center;margin:0;padding:0 92px 0 10px;background:#edf0f4;border-bottom:1px solid #d9dee5}'
                '.gj-story .gj-nav-track{display:flex;align-items:center;gap:6px;min-width:0;width:100%;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scrollbar-width:none}.gj-story .gj-nav-track::-webkit-scrollbar{display:none}'
                '.gj-story nav.gj-nav a{flex:none;display:inline-flex;align-items:center;min-height:44px;padding:0 14px;color:#263a55;font-weight:800;font-size:14px;text-decoration:none;background:#fff;border:1px solid #d4dae1;border-radius:99px;white-space:nowrap}'
                '.gj-story nav.gj-nav a:focus-visible{outline:3px solid #294d8766;outline-offset:2px}'
                '.gj-story .comic-home{top:calc(9px + env(safe-area-inset-top));min-height:42px}'
                '@media(min-width:760px){.gj-story nav.gj-nav{padding-right:10px}}'
                '.gj-story .scene,.gj-story .gj-flow,.gj-story .gj-mem{scroll-margin-top:68px}'
                '@media(max-width:400px){.gj-talk{grid-template-columns:1fr;gap:12px;margin:8px 14px 0}.gj-steps{margin:12px 14px 0}.gj-art-cap,.gj-art-note,.gj-talk-cap,.gj-stress{margin-left:14px;margin-right:14px}.gj-story .scene>.key{margin-left:14px;margin-right:14px}.gj-story .gj-head{padding:16px 14px 12px}.gj-mem{padding-left:14px;padding-right:14px}}'
                '.embedded .gj-story nav{display:none}'
                '</style>')


def webp_size(path):
    """WebP 그림의 가로·세로(VP8 · VP8L · VP8X)."""
    b = open(path, 'rb').read(40)
    kind = b[12:16]
    if kind == b'VP8X':
        return 1 + int.from_bytes(b[24:27], 'little'), 1 + int.from_bytes(b[27:30], 'little')
    if kind == b'VP8L':
        v = struct.unpack('<I', b[21:25])[0]
        return (v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1
    return struct.unpack('<H', b[26:28])[0] & 0x3fff, struct.unpack('<H', b[28:30])[0] & 0x3fff


def check_panels():
    for n in sorted({sc['panel'] for sc in SCENES}):
        path = os.path.join(MEDIA, 'gojoseon-panels', '%02d.webp' % n)
        if webp_size(path) != (PANEL_W, PANEL_H):
            raise SystemExit('media/gojoseon-panels/%02d.webp 크기가 %d×%d가 아니에요.' % (n, PANEL_W, PANEL_H))


def load_flow():
    s = open(os.path.join(MEDIA, 'lecture-flow-gojoseon.js'), encoding='utf-8').read()
    m = re.search(r'/\*FLOW-JSON\*/(.*?)/\*END-FLOW-JSON\*/', s, re.S)
    if not m:
        raise SystemExit('media/lecture-flow-gojoseon.js 에 흐름 데이터(FLOW-JSON)가 없어요.')
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


def art_html(sc, n):
    load = 'eager' if n <= 2 else 'lazy'
    return ('<div class="gj-art" data-panel="gojoseon-%02d" style="--gj-ar:%d / %d"><img src="gojoseon-panels/%02d.webp" width="%d" height="%d" alt="%s" decoding="async" loading="%s"></div>'
            % (sc['panel'], PANEL_W, PANEL_H, sc['panel'], PANEL_W, PANEL_H, e(sc['alt']), load))


def scene_html(sc, n, vocab):
    attrs = (' data-orig="%d"' % sc['orig']) if sc.get('orig') else ''
    attrs += ' id="%s"' % e(sc['id'])
    attrs += ' data-added="density"' if sc.get('added') else ''
    head = '<div class="gj-head"><div class="meta"><span data-scene-count data-format="n">%02d</span> · %s</div><h2>%s</h2><p class="gj-when">%s</p></div>' % (
        n, e(sc['label']), e(sc['title']), e(sc['when']))
    cap = '<p class="gj-art-cap">개념 그림 · 실제 인물의 초상이나 유적 사진이 아니에요.</p>'
    note = '<p class="gj-art-note">%s</p>' % e(sc['art_note']) if sc.get('art_note') else ''
    talk = ('<p class="gj-talk-cap">학습용 요약 대화 · 실제 발언을 그대로 옮긴 것이 아니에요. ‘해설’은 오늘날의 풀이예요.</p><div class="gj-talk">%s</div>'
            % ''.join('<p aria-label="%s: %s"><b>%s</b><span>%s</span></p>' % (e(who(w)), e(t), e(who(w)), e(t)) for w, t in (sc['a'], sc['b'])))
    seen = set()
    steps = '<ol class="gj-steps" aria-label="장면 설명">%s</ol>' % ''.join(
        '<li><b class="st %s">%s</b><span>%s</span></li>' % (k, e(l), bold_terms(t, seen, vocab)) for l, k, t in sc['steps'])
    stress = '<p class="gj-stress"><b>강의 강조</b>%s</p>' % e(sc['stress']) if sc.get('stress') else ''
    more = ''.join('<details class="scene-more"><summary>%s</summary><p>%s</p></details>' % (e(t), e(x)) for t, x in sc.get('more', []))
    return '<section class="scene"%s>%s%s%s%s%s%s<p class="key">%s</p>%s%s</section>' % (
        attrs, head, art_html(sc, n), cap, note, talk, steps, e(sc['key']), stress, more)


def memory_html(after, chunks):
    def one(k):
        memo = ('<div class="gj-memo"><b>%s</b><p>%s</p><p>%s</p></div>' % (e(k['memo']['label']), e(k['memo']['text']), e(k['memo']['note']))) if k.get('memo') else ''
        wrong = '<p class="gj-mem-x"><b>헷갈리지 않기</b>%s</p>' % em(k['x']) if k.get('x') else ''
        return ('<div class="gj-mem-k"><p class="gj-mem-head"><b class="gj-mem-t">%s</b><span class="gj-mem-w">%s</span></p><div class="gj-mem-story">%s</div>%s%s'
                '<p class="gj-keys"><span class="gj-keys-label">암기 키워드</span>%s</p></div>') % (
            e(k['t']), e(k['w']), ''.join('<p>%s</p>' % em(x) for x in k['story']), memo, wrong, ''.join('<span class="gj-key">%s</span>' % e(x) for x in k['k']))
    return '<aside class="gj-mem" id="mem-%s" aria-label="이 부분에서 외울 것: %s"><p class="gj-mem-label">이 부분에서 외울 것</p>%s</aside>' % (
        e(after), e(' · '.join(k['t'] for k in chunks)), ''.join(one(k) for k in chunks))


def bridge_html(sc):
    if not sc.get('next'):
        return ''
    text, switch = sc['next']
    return '<div class="story-seam%s" aria-label="이야기 흐름"><span class="story-seam-dots" aria-hidden="true">…</span><span class="story-seam-text">%s</span></div>' % (
        ' gj-switch' if switch else '', e(text))


def build():
    check_panels()
    keys = [sc['id'] for sc in SCENES]
    if len(keys) != 12 or len(set(keys)) != 12:
        raise SystemExit('고조선과 여러 나라 장면은 12개, id는 서로 달라야 해요.')
    if sorted(sc['panel'] for sc in SCENES if not sc.get('reuse')) != list(range(1, 9)):
        raise SystemExit('원래 장면 8개는 그림 01–08을 하나씩 써야 해요.')
    flow = load_flow()
    vocab = flow['terms']
    starts = {f['start']: f for f in flow['list']}
    chunks = [k for f in flow['list'] for k in f['chunks']]
    idx = [keys.index(k['go']) for k in chunks]
    if idx != sorted(idx) or len(set(idx)) != len(idx) or any(f['start'] != f['chunks'][0]['go'] for f in flow['list']) or keys[0] != flow['list'][0]['start']:
        raise SystemExit('흐름·덩어리 시작 장면이 화면 순서와 맞지 않아요.')
    ends = {}
    for i, k in enumerate(chunks):
        ends.setdefault(keys[idx[i + 1] - 1] if i + 1 < len(chunks) else keys[-1], []).append(k)
    src = open(os.path.join(MEDIA, FILE), encoding='utf-8').read()
    head = re.sub(r'<style id="hanq-gojoseon-story">.*?</style>', '', src[:src.index('</head>')], flags=re.S) + GOJOSEON_CSS
    tail = src[src.index('</main>'):]
    body, scenes, memory = '', [], []
    for n, sc in enumerate(SCENES, 1):
        if sc['id'] in starts:
            f = starts[sc['id']]
            body += '<div class="gj-flow" id="%s"><small>%s · %s</small><h2 id="%s-h">%s %s</h2><p>%s</p></div>\n' % (
                e(f['id']), e(f['no']), e(f['range']), e(f['id']), e(f['no']), e(f['name']), e(f['lead']))
        card = ''
        if sc['id'] in ends:
            card = memory_html(sc['id'], ends[sc['id']])
            memory.append(dict(after=sc['id'], scene=n, chunks=[k['t'] for k in ends[sc['id']]]))
        body += scene_html(sc, n, vocab) + card + bridge_html(sc) + '\n'
        fl = [f['id'] for f in flow['list'] if keys.index(f['start']) <= n - 1][-1]
        scenes.append(dict(id=sc['id'], scene=n, flow=fl, orig=sc.get('orig'), added=bool(sc.get('added')), panel='gojoseon-panels/%02d.webp' % sc['panel'],
                           size=[PANEL_W, PANEL_H], reused=bool(sc.get('reuse')), depicts=sc['alt'], key=sc['key'], speakers=[w for w, _ in (sc['a'], sc['b'])],
                           stress=sc.get('stress'), teacher_lines=sc['src']))
    guide = ('<ul class="gj-guide"><li><b>두 흐름</b> ① 고조선은 건국에서 멸망까지 순서대로, ② 여러 나라는 차례로 이어진 나라가 아니라 지역마다 나란히 있던 나라라 북쪽부터 남쪽으로 비교해요.</li>'
             '<li><b>컷마다</b> 나라 → 그림 → 대화 → 설명 → 꼭 기억을 읽어요. 강의가 직접 짚은 말은 ‘강의 강조’로 표시해요.</li>'
             '<li><b>흐름이 끊기는 곳</b>마다 ‘이 부분에서 외울 것’으로 나라별 단서를 이어서 정리해요.</li></ul>')
    header = ('<header><small>한국사 한눈에 · 시대 웹툰</small><h1>고조선과 여러 나라</h1><p>한 나라의 흥망 뒤에도, 지역마다 다른 삶이 이어졌다.</p>' + guide + '</header>'
              '<nav class="gj-nav" aria-label="고조선과 여러 나라 흐름 바로 가기"><div class="gj-nav-track">%s</div></nav>'
              '<div class="chapter-line">%s</div>\n') % (''.join('<a href="#%s">%s %s</a>' % (e(f['id']), e(f['no']), e(f['name'])) for f in flow['list']), e(flow['note']))
    end = ('<div class="end"><strong>흐름 한 줄</strong>'
           '<p>고조선: 단군왕검 건국 → 연 장수 진개의 공격 → 위만 → 진번·임둔 복속 → 우거왕 때 한 무제 공격·멸망</p>'
           '<p>여러 나라(나란히): 부여 사출도·영고 · 고구려 제가회의·동맹·서옥제 · 옥저 민며느리제·골장제 · 동예 책화·무천 · 삼한 천군·소도</p>'
           '<a href="../index.html#chapter/gojoseon/quiz" target="_top">다 읽었다면 퀴즈로 확인하기 →</a></div>')
    doc = (head + '</head><body class="gj-story"><a class="comic-home" href="../index.html" aria-label="시대별 목차로 이동">⌂ 홈</a><div id="progress"></div><main>'
           + header + body + end + tail)
    with open(os.path.join(MEDIA, FILE), 'w', encoding='utf-8') as f:
        f.write(doc)
    cmap = dict(generated_by='scripts/build_gojoseon_comic.py',
                note='고조선과 여러 나라 웹툰 장면(화면 순서)·흐름·그림(바이트 그대로, 508×380 전체)·기존 꼭 기억 단서·강의 강조와 근거 행, 이 부분에서 외울 것 카드 위치.',
                scenes=scenes, memory=memory)
    with open(os.path.join(ROOT, 'docs', 'gojoseon-comic-map.json'), 'w', encoding='utf-8') as f:
        json.dump(cmap, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print('고조선과 여러 나라 장면', len(scenes), '· 흐름', len(flow['list']), '· 카드', len(memory))


if __name__ == '__main__':
    build()

# Source-backed supplementary learning cuts; original scene keys stay unchanged.
from study_supplements import apply as apply_study_supplements
apply_study_supplements()
