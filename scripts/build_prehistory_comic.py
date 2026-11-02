# -*- coding: utf-8 -*-
"""선사시대 웹툰(media/prehistory-comic.html)을 강의 흐름(구석기 · 신석기 · 청동기 · 철기)에 맞춘 한 페이지 학습으로 다시 엮는다.

  python3 scripts/build_prehistory_comic.py

- 기존 파일의 <head>(스타일)와 </main> 뒤 스크립트(진행 막대 · 가장자리 밀기 · 장면 번호 · 용어 풀이)는 그대로 두고, 본문만 아래 SCENES 정의로 다시 쓴다.
  고려 생성기처럼 이 웹툰 전용 스타일(hanq-prehistory-story)은 지우고 다시 넣어 여러 번 실행해도 결과가 같다.
- 장면 12개의 id·순서·제목·꼭 기억 단서는 기존 웹툰 그대로다.
- 그림: media/prehistory-panels/01–08.webp(모두 539×358)을 바이트 그대로, 확대·잘라 내기 없이 원래 비율로 보여 준다. 그림 칸은 실제 비율(--p-ar)만큼
  미리 자리를 잡아 늦게 불러와도 높이가 0이 되지 않는다. 예전에 확대해 쓰던 덧붙인 장면 4개는 같은 그림 전체를 다시 쓰고, 그렇다고 화면에 밝힌다.
  그림 크기가 539×358이 아니면 멈춘다.
- 흐름 머리와 ‘이 부분에서 외울 것’ 카드는 media/lecture-flow-prehistory.js의 /*FLOW-JSON*/ … /*END-FLOW-JSON*/를 읽는다.
- 말풍선은 그림 밖(아래)에 둔다. 상상 속 화자는 ‘설명용 인물’, 오늘날의 유적 설명은 ‘해설’로 밝힌다. 스타일은 body.p-story 안에서만 쓴다.
- 출력: media/prehistory-comic.html, docs/prehistory-comic-map.json. 시간·난수·개인 경로를 쓰지 않는다. 근거는 docs/prehistory-scene-sources.md.
"""
import html, json, os, re, struct

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA = os.path.join(ROOT, 'media')
FILE = 'prehistory-comic.html'
PANEL_W, PANEL_H = 539, 358
e = lambda s: html.escape(s, quote=True)

# 상상 속 설명용 인물(선사시대에는 이름이 남은 사람이 없다). ‘해설’로 시작하는 화자는 오늘날의 설명.
GENERIC = {'아버지', '아이', '농부', '동료', '직조인', '어머니', '지도자', '전사', '족장', '마을 사람', '대장장이', '상인'}
GUIDE_SPEAKER = '해설 · 오늘의 유적 안내'

# 장면 정의(화면 순서 = 기존 순서). panel: prehistory-panels/NN.webp. orig: 원래 장면 번호(data-orig) · added: 덧붙인 장면(data-added="density") · reuse: 앞 장면 그림 전체를 다시 씀
#  when: 시대·사건 줄 · steps: [(이름, cause|dev|res|item, 문장)] · key: 기존 꼭 기억 단서(글자 그대로) · stress: 강의가 직접 짚은 말(근거 행은 src·문서)
#  more: [(제목, 문장)] 접힌 보충(유적지처럼 강의가 몰라도 된다고 한 범위) · next: (다음 장면으로 잇는 말, 시대가 바뀌면 True) · src: 강의 행
SCENES = [
    dict(id='scene-1', orig=1, panel=1, label='구석기 · 이동 생활', title='먹을 것이 떨어졌다', when='구석기 시대 · 사냥과 채집 → 먹을 것을 따라 이동',
         alt='먹을 것이 떨어졌다 장면', a=('아버지', '이제 먹을 게 없어. 강 쪽으로 옮기자.'), b=('아이', '그럼 주먹도끼부터 챙길게!'),
         steps=[('배경', 'cause', '구석기 사람들은 열매를 따고 짐승을 사냥하며 먹을 것을 구했다.'),
                ('전개', 'dev', '주변의 먹을 것이 떨어지면 다른 곳으로 옮겨 다니는 이동 생활을 했다.'),
                ('결과', 'res', '자기 집 없이 옮겨 다녀서 주로 동굴이나 강가의 막집에서 지냈다.')],
         key='구석기 = 이동 생활·동굴·뗀석기', stress='선사시대는 각 시대의 생활 모습과 사용한 도구만 알면 된다고 짚었어요.',
         next=('먹을 것을 따라 강가에 닿자, 막집이 하루의 집이 되었다.', False), src='18–21'),
    dict(id='scene-2', orig=2, panel=2, label='구석기 · 뗀석기', title='오늘의 집은 강가', when='구석기 · 강가의 막집 · 뗀석기(주먹도끼 · 슴베찌르개)',
         alt='오늘의 집은 강가 장면', a=('아버지', '이 슴베찌르개를 자루에 끼워 봐.'), b=('아이', '사냥이 끝나면 또 다른 곳으로 가요?'),
         steps=[('도구', 'item', '돌을 깨뜨리거나 떼어 내 만든 뗀석기를 썼다.'),
                ('대표', 'item', '대표 유물은 주먹도끼와 슴베찌르개다. 슴베찌르개는 자루에 끼워 쓰는 사냥 도구다.'),
                ('집', 'item', '강 근처에 막집을 짓고 잠시 머물다 다시 옮겨 갔다.')],
         key='구석기 = 막집·주먹도끼·슴베찌르개',
         next=('사냥 도구를 다듬던 손길은 오늘날 유적으로 남았다.', False), src='20–22'),
    dict(id='paleo-sites', added=True, panel=2, reuse=True, label='구석기 · 정리', title='깨서 만든 도구가 남은 자리', when='구석기 정리 · 뗀석기 · 다른 시대와 가르기',
         alt='강가에서 돌도구를 다듬는 구석기 사람들(앞 장면과 같은 그림 · 그림 전체 다시 사용)', a=('아버지', '주먹도끼도 찍개도 돌을 깨서 만들었지.'), b=(GUIDE_SPEAKER, '구석기 유적으로 연천 전곡리와 공주 석장리가 있어요.'),
         art_note='그림: ‘오늘의 집은 강가’ 장면과 같은 그림 전체를 확대하지 않고 다시 썼어요.',
         steps=[('도구', 'item', '주먹도끼와 찍개도 돌을 깨서 만든 뗀석기다.'),
                ('구분', 'item', '움집·빗살무늬 토기·농경은 신석기의 것이라 구석기와 섞지 않는다.')],
         key='구석기 유적 = 연천 전곡리·공주 석장리 / 움집·빗살무늬 토기·농경은 구석기 아님',
         stress='유적지를 몰라도 문제를 풀 수 있고, 생활 모습과 도구만 알면 된다고 짚었어요.',
         more=[('유적지 · 강의가 몰라도 된다고 한 범위', '구석기 유적: 연천 전곡리, 공주 석장리, 청원 두루봉 동굴, 단양 금굴.')],
         next=('오랜 세월 뒤, 사람들은 다시 돌아올 땅을 가꾸기 시작했다.', True), src='22–25'),
    dict(id='scene-3', orig=3, panel=3, label='신석기 · 농경 시작', title='씨앗을 심고 머물다', when='신석기 시대 · 농경과 목축 시작 → 정착 → 움집',
         alt='씨앗을 심고 머물다 장면', a=('농부', '여기에 뿌린 씨가 다시 자랐어!'), b=('동료', '남은 곡식은 빗살무늬 토기에 담자.'),
         steps=[('배경', 'cause', '신석기 사람들은 농경과 목축을 시작해 조·피·수수 같은 곡식을 길렀다.'),
                ('전개', 'dev', '농사를 지으려면 한곳에 머물러야 해서 정착 생활을 하게 되었다.'),
                ('결과', 'res', '땅을 파고 지은 움집에서 살았고, 곡식은 빗살무늬 토기에 담아 저장했다.')],
         key='신석기 = 농경·목축 시작·움집·빗살무늬 토기', stress='신석기에서 제일 중요한 특징은 농사(농경·목축)를 시작했다는 것이라고 짚었어요.',
         next=('마을에 머무르자 곡식을 담는 그릇과 옷을 만드는 손도 늘었다.', False), src='25–26 · 34'),
    dict(id='scene-4', orig=4, panel=4, label='신석기 · 옷 만들기', title='실과 옷이 생기다', when='신석기 · 가락바퀴로 실 → 뼈바늘로 옷 · 간석기',
         alt='실과 옷이 생기다 장면', a=('직조인', '가락바퀴로 실을 뽑았어.'), b=('동료', '그럼 뼈바늘로 옷을 꿰매 볼게.'),
         steps=[('옷', 'item', '가락바퀴로 실을 꼬고 뼈바늘로 꿰매 옷을 만들기 시작했다.'),
                ('도구', 'item', '돌을 갈아 만든 간석기를 썼고, 갈돌과 갈판으로 곡식을 갈았다.')],
         key='신석기 = 가락바퀴·뼈바늘·갈돌·갈판', stress='옷을 만들기 시작한 것도 신석기의 중요한 특징이고, 신석기는 빗살무늬 토기와 가락바퀴 두 가지만 알면 된다고 짚었어요.',
         next=('실을 잣고 옷을 짓던 집은 강가의 둥근 움집이었다.', False), src='27–31'),
    dict(id='neo-village', added=True, panel=3, reuse=True, label='신석기 · 움집과 원시 신앙', title='화덕을 둘러싼 둥근 움집', when='신석기 · 원형 움집 · 중앙 화덕 · 원시 신앙',
         alt='씨앗을 심고 머무는 신석기 마을(앞 장면과 같은 그림 · 그림 전체 다시 사용)', a=('어머니', '움집 한가운데 화덕을 두니 따뜻해.'), b=(GUIDE_SPEAKER, '서울 암사동에서 이런 신석기 마을 유적이 발견되었어요.'),
         art_note='그림: ‘씨앗을 심고 머물다’ 장면과 같은 그림 전체를 확대하지 않고 다시 썼어요.',
         steps=[('집', 'item', '신석기의 움집은 바닥이 둥글고 한가운데에 화덕을 두었다.'),
                ('신앙', 'item', '샤머니즘·토테미즘·애니미즘 같은 원시 신앙도 이때 생겨났다.')],
         key='신석기 = 원형 움집·중앙 화덕·갈돌·갈판 / 대표 유적 서울 암사동', stress='신석기 유적지도 몰라도 된다고 짚었어요.',
         more=[('유적지 · 강의가 몰라도 된다고 한 범위', '신석기 유적: 서울 암사동, 제주 고산리, 양양 오산리, 부산 동삼동.')],
         next=('농사가 커지고 남는 곡식이 생기자 사람들 사이에 차이가 보였다.', True), src='27 · 30–33'),
    dict(id='scene-5', orig=5, panel=5, label='청동기 · 벼농사와 계급', title='남는 곡식, 다른 자리', when='청동기 시대 · 벼농사 → 생산 증가 → 사유 재산 → 계급',
         alt='남는 곡식, 다른 자리 장면', a=('농부', '반달 돌칼로 벼를 다 거뒀어.'), b=('동료', '저 집은 곡식 창고가 더 크네.'),
         steps=[('배경', 'cause', '청동기 시대에는 신석기의 조·피·수수에 더해 쌀을 기르는 벼농사가 시작되었다.'),
                ('전개', 'dev', '생산량이 늘자 남는 곡식을 차지한 사람이 생겨 사유 재산이 생겼다.'),
                ('결과', 'res', '가진 것의 차이가 커지며 계급이 생기고 지배층이 나타났다.'),
                ('도구', 'item', '벼를 거둘 때는 돌로 만든 반달 돌칼을 썼다.')],
         key='청동기 = 벼농사·사유 재산·계급·반달 돌칼',
         next=('재산이 쌓이자 마을을 지키고 다스릴 힘도 모였다.', False), src='33–36 · 37–38'),
    dict(id='scene-6', orig=6, panel=6, label='청동기 · 방어와 권위', title='마을에 울타리를 두르다', when='청동기 · 환호와 목책 · 비파형 동검 · 민무늬 토기',
         alt='마을에 울타리를 두르다 장면', a=('지도자', '창고 둘레에 환호와 목책을 두르자.'), b=('전사', '비파형 동검은 의식 때 들겠습니다.'),
         steps=[('배경', 'cause', '마을마다 다른 마을의 침략을 막아야 했다.'),
                ('전개', 'dev', '마을 둘레에 도랑인 환호를 파고 나무 울타리인 목책을 둘렀다.'),
                ('함께', 'item', '비파형 동검 같은 청동 물건은 지배층의 권위를 보여 주었고, 그릇으로는 민무늬 토기를 썼다.')],
         key='청동기 = 환호·목책·비파형 동검·민무늬 토기', stress='환호와 목책이 나오면 청동기라고 짚었어요.',
         next=('울타리 안에서는 청동 의기를 든 사람이 마을을 이끌었다.', False), src='36–37 · 39–41'),
    dict(id='bronze-village', added=True, panel=6, reuse=True, label='청동기 · 지배층의 물건', title='지배자가 든 청동 거울', when='청동기 · 비파형 동검 · 거친무늬 거울 · 농경문 청동기',
         alt='마을에 울타리를 두르는 청동기 마을(앞 장면과 같은 그림 · 그림 전체 다시 사용)', a=('족장', '비파형 동검과 거친무늬 거울은 내 힘의 표시다.'), b=(GUIDE_SPEAKER, '부여 송국리 같은 마을 유적에서는 민무늬 토기가 나와요.'),
         art_note='그림: ‘마을에 울타리를 두르다’ 장면과 같은 그림 전체를 확대하지 않고 다시 썼어요.',
         steps=[('권위', 'item', '비파형 동검과 거친무늬 거울은 지배층이 권위를 보이는 물건이었다.'),
                ('기록', 'item', '당시 생활 모습을 새긴 농경문 청동기도 이 시대의 유물이다.'),
                ('구분', 'item', '청동은 지배층의 무기와 의례 도구에 쓰였고, 벼를 거두는 도구는 돌로 만든 반달 돌칼이었다.')],
         key='청동기 = 비파형 동검·거친무늬 거울(지배층) / 민무늬 토기 / 대표 유적 부여 송국리',
         more=[('유적지 · 강의가 몰라도 된다고 한 범위', '청동기 유적: 부여 송국리(환호·목책 흔적), 울산 울주 반구대 바위그림(신석기·청동기의 생활 모습을 바위에 새김).')],
         next=('살아 있을 때의 힘은 죽은 뒤 큰 무덤에도 남았다.', False), src='36–41'),
    dict(id='scene-7', orig=7, panel=7, label='청동기 · 고인돌', title='큰 돌 아래 남은 권력', when='청동기 · 지배층의 무덤 고인돌',
         alt='큰 돌 아래 남은 권력 장면', a=('마을 사람', '저 고인돌을 세우는 데 온 마을이 모였어.'), b=('동료', '지배층의 힘이 이렇게 드러나는군.'),
         steps=[('배경', 'cause', '계급이 생기면서 지배층이 마을을 이끌었다.'),
                ('전개', 'dev', '많은 사람을 모아 큰 돌로 지배층의 무덤인 고인돌을 세웠다.'),
                ('결과', 'res', '큰 무덤을 만들 만큼 사람을 부릴 수 있는 지배층의 힘이 드러났다.')],
         key='청동기 = 고인돌·지배층의 등장',
         next=('뒤이어 쇠로 만든 도구가 밭과 교역의 모습을 바꿨다.', True), src='35–37'),
    dict(id='scene-8', orig=8, panel=8, label='철기 · 오답 가르기', title='쇠가 밭에 들어오다', when='철기 시대 · 철제 농기구 · 세형 동검 · 중국 화폐',
         alt='쇠가 밭에 들어오다 장면', a=('대장장이', '철로 만든 호미와 쇠스랑이야.'), b=('농부', '밭일이 빨라졌네. 교역도 커지겠어!'),
         steps=[('농사', 'item', '호미·쇠스랑·괭이 같은 철제 농기구를 만들어 썼다.'),
                ('청동', 'item', '비파형 동검과 달리 한반도만의 모양인 세형 동검을 거푸집으로 만들었다.'),
                ('교역', 'item', '명도전·반량전 같은 중국 화폐가 발견되어 중국과 교역했음을 알 수 있다.')],
         key='철기 = 철제 농기구·세형 동검·중국 화폐 교역', stress='철기는 주로 오답 선택지로 나오니, 구석기·신석기·청동기 위주로 보라고 짚었어요.',
         next=('쇠 농기구가 퍼진 마을에는 먼 곳의 돈과 물건도 들어왔다.', False), src='42–47'),
    dict(id='iron-trade', added=True, panel=8, reuse=True, label='철기 · 정리', title='철은 농사, 청동은 의례', when='철기 · 철제 농기구(생산) · 세형 동검 · 잔무늬 거울 · 명도전',
         alt='대장간이 있는 철기 마을(앞 장면과 같은 그림 · 그림 전체 다시 사용)', a=('상인', '중국 돈 명도전이 이 마을까지 왔어.'), b=('대장장이', '청동은 세형 동검·잔무늬 거울로 쓰지.'),
         art_note='그림: ‘쇠가 밭에 들어오다’ 장면과 같은 그림 전체를 확대하지 않고 다시 썼어요.',
         steps=[('정리', 'item', '철은 농기구로 생산에 쓰였고, 청동은 세형 동검·잔무늬 거울처럼 의례에 쓰였다.'),
                ('구분', 'item', '청동기 시대의 비파형 동검·거친무늬 거울과 철기 시대의 세형 동검·잔무늬 거울을 짝지어 가른다.')],
         key='철기 = 철제 농기구(생산) / 세형 동검·잔무늬 거울(철기 시대의 청동기) / 명도전 = 중국과 교류',
         more=[('흐름 보충 · 무덤과 화폐', '철기 시대에는 독무덤·널무덤을 만들었고, 오수전 같은 중국 화폐도 쓰였다.')],
         next=None, src='43–47'),
]

PREHISTORY_CSS = ('<style id="hanq-prehistory-story">/* 선사시대: 흐름 머리 → 시대 줄 → 그림(원래 비율, 자리 먼저 잡음) → 그림 밖 말풍선 → 설명 → 꼭 기억 · 강의 강조 → (시대 끝) 이 부분에서 외울 것 → 다음 장면 잇기 */'
                  '.p-story .scene{padding:0 0 22px;opacity:1!important;transform:none!important;content-visibility:visible!important}'
                  '.p-story .p-head{padding:18px 18px 12px}.p-story .p-head .meta{font-size:13px;color:#667085;font-weight:800}'
                  '.p-story .p-head h2{font-size:clamp(22px,6vw,28px);line-height:1.25;letter-spacing:-.04em;margin:6px 0 6px;word-break:keep-all}'
                  '.p-story .p-when{margin:0;color:#a72d27;font-size:14.5px;line-height:1.5;font-weight:850;word-break:keep-all;overflow-wrap:anywhere}'
                  # 그림: 예전 .art img{aspect-ratio:1.33;object-fit:cover}(잘림)와 확대 transform은 쓰지 않는다. 칸이 실제 그림 비율(--p-ar)만큼 먼저 자리를 잡고, 그림은 contain으로 원래 비율 그대로
                  '.p-story .p-art{display:block;width:100%;aspect-ratio:var(--p-ar);background:#d8d2c4;line-height:0}'
                  '.p-story .p-art img{display:block;width:100%;height:100%;object-fit:contain;transform:none}'
                  '.p-art-cap{margin:6px 18px 0;font-size:13px;font-weight:750;line-height:1.5;color:#4b5565}.p-art-note{margin:2px 18px 0;font-size:13px;line-height:1.5;color:#5b6576}'
                  '.p-talk-cap{margin:12px 18px 0;font-size:13px;font-weight:800;line-height:1.4;color:#5b6576}'
                  '.p-talk{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin:8px 18px 0}'
                  '.p-talk p{margin:0;padding:10px 12px 11px;background:#fff;border:2px solid #26384c;border-radius:16px 16px 16px 5px;color:#243248;line-height:1.5}'
                  '.p-talk p+p{background:#eef6ff;border-color:#315d80;border-radius:16px 16px 5px 16px}'
                  '.p-talk b{display:block;margin-bottom:4px;font-size:14px;font-weight:900;color:#b52d34}.p-talk p+p b{color:#315d80}'
                  '.p-talk span{display:block;font-size:16px;font-weight:700;word-break:keep-all;overflow-wrap:anywhere}'
                  '.p-steps{list-style:none;margin:12px 18px 0;padding:0;display:grid;gap:7px}'
                  '.p-steps li{display:grid;grid-template-columns:3.6em minmax(0,1fr);gap:8px;align-items:baseline;font-size:16px;line-height:1.65;color:#2b3443;word-break:keep-all;overflow-wrap:anywhere}'
                  '.p-steps .st{display:block;padding:1px 2px;border-radius:6px;text-align:center;font-size:12.5px;font-weight:900;line-height:1.5;background:#eef1f4;color:#4b5565}'
                  '.p-steps .st.dev{background:#fff0e9;color:#a72d27}.p-steps .st.res{background:#e9f4ec;color:#2f6b3c}.p-steps .st.item{background:#f6f1e7;color:#7a5a24}'
                  '.p-steps strong,.p-mem strong{color:#b52d34;font-weight:900}'
                  '.p-story .scene>.key{margin:12px 18px 0;padding:10px 12px;border-left:4px solid #d83b32;background:#fff0e9;color:#a72d27;font-size:15px;font-weight:850;line-height:1.55;word-break:keep-all;overflow-wrap:anywhere}'
                  '.p-stress{margin:8px 18px 0;font-size:14px;line-height:1.55;color:#294d87;font-weight:750;word-break:keep-all}.p-stress b{margin-right:6px;padding:1px 7px;border-radius:6px;background:#eef2f8;font-size:12.5px;font-weight:900}'
                  '.p-story .scene-more{margin:10px 18px 0;padding:4px 12px;border:1px dashed #d6c7a3;border-radius:10px;background:#fffaf0;font-size:15px;line-height:1.6;color:#3d4859}'
                  '.p-story .scene-more>summary{display:flex;align-items:center;min-height:44px;cursor:pointer;font-weight:850}.p-story .scene-more>summary:focus-visible{outline:3px solid #294d8766;outline-offset:2px;border-radius:6px}.p-story .scene-more p{margin:2px 0 10px}'
                  '.p-story .p-flow{padding:18px 18px 16px;background:#17243a;color:#fff}.p-story .p-flow:focus{outline:3px solid #f0b593;outline-offset:-3px}'
                  '.p-story .p-flow small{display:block;color:#f0b593;font-size:13px;font-weight:800}.p-story .p-flow h2{margin:4px 0 0;color:#fff;font-size:clamp(20px,5.5vw,24px);line-height:1.3;word-break:keep-all}'
                  '.p-story .p-flow p{margin:6px 0 0;font-size:15px;line-height:1.6;color:#dce5f0;word-break:keep-all}'
                  '.p-mem{margin:0;padding:16px 18px 18px;background:#fff8e8;border-top:4px solid #e5a337;border-bottom:1px solid #f0dfb8}'
                  '.p-mem-label{margin:0 0 8px;font-size:17px;font-weight:900;color:#7a4b0d}.p-mem-k+.p-mem-k{margin-top:14px;padding-top:12px;border-top:1px dashed #e3cf9f}'
                  '.p-mem-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 10px;margin:0 0 6px}.p-mem-t{font-size:17px;font-weight:900}.p-mem-w{font-size:14px;font-weight:800;color:#294d87}'
                  '.p-mem-story p{margin:0 0 6px;font-size:16px;line-height:1.7;color:#243248;word-break:keep-all;overflow-wrap:anywhere}'
                  '.p-memo{margin:8px 0;padding:10px 12px;border-left:4px solid #e5a337;border-radius:8px;background:#fff}.p-memo b{display:block;font-size:14px;font-weight:900}.p-memo p{margin:4px 0 0;font-size:16px;line-height:1.7}.p-memo p+p{font-size:15px;color:#5b4a26}'
                  '.p-mem-x{margin:8px 0 0;font-size:16px;line-height:1.7;color:#3b3220;word-break:keep-all;overflow-wrap:anywhere}.p-mem-x b{margin-right:6px;padding:1px 7px;border-radius:6px;background:#fce9e5;color:#8f2a26;font-size:13px;font-weight:900}'
                  '.p-keys{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:8px 0 0}.p-keys-label{font-size:13px;font-weight:900;color:#5b6576}.p-key{padding:3px 9px;border-radius:999px;background:#fce9e5;color:#8f2a26;font-size:14px;font-weight:850}'
                  '.p-guide{margin:12px 0 0;padding:0;list-style:none;font-size:14px;line-height:1.6;color:#d9e0e8}.p-guide b{color:#f0b593}'
                  '.p-story .chapter-line{padding:15px 22px;background:#e6e9ed;color:#314057;font-weight:800;font-size:14px;line-height:1.6;word-break:keep-all}'
                  '.p-story .story-seam{display:flex;align-items:center;justify-content:center;gap:9px;margin:0;padding:13px 20px 15px;background:linear-gradient(180deg,#fff 0%,#f7f2e9 52%,#fff 100%);color:#3d4b5d;font-size:14px;line-height:1.55;font-weight:750}'
                  '.p-story .story-seam-dots{flex:none;color:#b53940;font-size:26px;line-height:1;font-weight:900;letter-spacing:2px}.p-story .story-seam-text{flex:0 1 auto}'
                  '.p-story .story-seam.p-switch{background:#e6e9ed;color:#17243a;font-weight:850}'
                  '.p-story .end p{font-size:16px}'
                  # 흐름 바로 가기 줄(다른 강의 구성 웹툰과 같은 방식): 높이 60px 고정, 좁은 화면에서 오른쪽 92px는 홈 버튼 자리, 가로 스크롤은 안쪽 트랙에서만
                  '.p-story nav.p-nav{position:sticky;top:0;z-index:5;height:60px;box-sizing:border-box;display:flex;align-items:center;margin:0;padding:0 92px 0 10px;background:#edf0f4;border-bottom:1px solid #d9dee5}'
                  '.p-story .p-nav-track{display:flex;align-items:center;gap:6px;min-width:0;width:100%;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scrollbar-width:none}.p-story .p-nav-track::-webkit-scrollbar{display:none}'
                  '.p-story nav.p-nav a{flex:none;display:inline-flex;align-items:center;min-height:44px;padding:0 14px;color:#263a55;font-weight:800;font-size:14px;text-decoration:none;background:#fff;border:1px solid #d4dae1;border-radius:99px;white-space:nowrap}'
                  '.p-story nav.p-nav a:focus-visible{outline:3px solid #294d8766;outline-offset:2px}'
                  '.p-story .comic-home{top:calc(9px + env(safe-area-inset-top));min-height:42px}'
                  '@media(min-width:760px){.p-story nav.p-nav{padding-right:10px}}'
                  '.p-story .scene,.p-story .p-flow,.p-story .p-mem{scroll-margin-top:68px}'
                  '@media(max-width:400px){.p-talk{grid-template-columns:1fr;gap:12px;margin:8px 14px 0}.p-steps{margin:12px 14px 0}.p-art-cap,.p-art-note,.p-talk-cap,.p-stress{margin-left:14px;margin-right:14px}.p-story .scene>.key{margin-left:14px;margin-right:14px}.p-story .p-head{padding:16px 14px 12px}.p-mem{padding-left:14px;padding-right:14px}}'
                  '.embedded .p-story nav{display:none}'
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
        path = os.path.join(MEDIA, 'prehistory-panels', '%02d.webp' % n)
        if webp_size(path) != (PANEL_W, PANEL_H):
            raise SystemExit('media/prehistory-panels/%02d.webp 크기가 %d×%d가 아니에요.' % (n, PANEL_W, PANEL_H))


def load_flow():
    s = open(os.path.join(MEDIA, 'lecture-flow-prehistory.js'), encoding='utf-8').read()
    m = re.search(r'/\*FLOW-JSON\*/(.*?)/\*END-FLOW-JSON\*/', s, re.S)
    if not m:
        raise SystemExit('media/lecture-flow-prehistory.js 에 흐름 데이터(FLOW-JSON)가 없어요.')
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
    return ('<div class="p-art" data-panel="prehistory-%02d" style="--p-ar:%d / %d"><img src="prehistory-panels/%02d.webp" width="%d" height="%d" alt="%s" decoding="async" loading="%s"></div>'
            % (sc['panel'], PANEL_W, PANEL_H, sc['panel'], PANEL_W, PANEL_H, e(sc['alt']), load))


def scene_html(sc, n, vocab):
    attrs = (' data-orig="%d"' % sc['orig']) if sc.get('orig') else ''
    attrs += ' id="%s"' % e(sc['id'])
    attrs += ' data-added="density"' if sc.get('added') else ''
    head = '<div class="p-head"><div class="meta"><span data-scene-count data-format="n">%02d</span> · %s</div><h2>%s</h2><p class="p-when">%s</p></div>' % (
        n, e(sc['label']), e(sc['title']), e(sc['when']))
    cap = '<p class="p-art-cap">개념 그림 · 실제 유적이나 유물 사진이 아니에요.</p>'
    note = '<p class="p-art-note">%s</p>' % e(sc['art_note']) if sc.get('art_note') else ''
    talk = ('<p class="p-talk-cap">학습용 요약 대화 · 선사시대 사람의 실제 말이 아니에요. ‘해설’은 오늘날의 설명이에요.</p><div class="p-talk">%s</div>'
            % ''.join('<p aria-label="%s: %s"><b>%s</b><span>%s</span></p>' % (e(who(w)), e(t), e(who(w)), e(t)) for w, t in (sc['a'], sc['b'])))
    seen = set()
    steps = '<ol class="p-steps" aria-label="장면 설명">%s</ol>' % ''.join(
        '<li><b class="st %s">%s</b><span>%s</span></li>' % (k, e(l), bold_terms(t, seen, vocab)) for l, k, t in sc['steps'])
    stress = '<p class="p-stress"><b>강의 강조</b>%s</p>' % e(sc['stress']) if sc.get('stress') else ''
    more = ''.join('<details class="scene-more"><summary>%s</summary><p>%s</p></details>' % (e(t), e(x)) for t, x in sc.get('more', []))
    return '<section class="scene"%s>%s%s%s%s%s%s<p class="key">%s</p>%s%s</section>' % (
        attrs, head, art_html(sc, n), cap, note, talk, steps, e(sc['key']), stress, more)


def memory_html(after, chunks):
    def one(k):
        memo = ('<div class="p-memo"><b>%s</b><p>%s</p><p>%s</p></div>' % (e(k['memo']['label']), e(k['memo']['text']), e(k['memo']['note']))) if k.get('memo') else ''
        wrong = '<p class="p-mem-x"><b>헷갈리지 않기</b>%s</p>' % em(k['x']) if k.get('x') else ''
        return ('<div class="p-mem-k"><p class="p-mem-head"><b class="p-mem-t">%s</b><span class="p-mem-w">%s</span></p><div class="p-mem-story">%s</div>%s%s'
                '<p class="p-keys"><span class="p-keys-label">암기 키워드</span>%s</p></div>') % (
            e(k['t']), e(k['w']), ''.join('<p>%s</p>' % em(x) for x in k['story']), memo, wrong, ''.join('<span class="p-key">%s</span>' % e(x) for x in k['k']))
    return '<aside class="p-mem" id="mem-%s" aria-label="이 부분에서 외울 것: %s"><p class="p-mem-label">이 부분에서 외울 것</p>%s</aside>' % (
        e(after), e(' · '.join(k['t'] for k in chunks)), ''.join(one(k) for k in chunks))


def bridge_html(sc):
    if not sc.get('next'):
        return ''
    text, switch = sc['next']
    return '<div class="story-seam%s" aria-label="이야기 흐름"><span class="story-seam-dots" aria-hidden="true">…</span><span class="story-seam-text">%s</span></div>' % (
        ' p-switch' if switch else '', e(text))


def build():
    check_panels()
    keys = [sc['id'] for sc in SCENES]
    if len(keys) != 12 or len(set(keys)) != 12:
        raise SystemExit('선사시대 장면은 12개, id는 서로 달라야 해요.')
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
    head = re.sub(r'<style id="hanq-prehistory-story">.*?</style>', '', src[:src.index('</head>')], flags=re.S) + PREHISTORY_CSS
    tail = src[src.index('</main>'):]
    body, scenes, memory = '', [], []
    for n, sc in enumerate(SCENES, 1):
        if sc['id'] in starts:
            f = starts[sc['id']]
            body += '<div class="p-flow" id="%s"><small>%s · %s</small><h2 id="%s-h">%s %s</h2><p>%s</p></div>\n' % (
                e(f['id']), e(f['no']), e(f['range']), e(f['id']), e(f['no']), e(f['name']), e(f['lead']))
        card = ''
        if sc['id'] in ends:
            card = memory_html(sc['id'], ends[sc['id']])
            memory.append(dict(after=sc['id'], scene=n, chunks=[k['t'] for k in ends[sc['id']]]))
        body += scene_html(sc, n, vocab) + card + bridge_html(sc) + '\n'
        fl = [f['id'] for f in flow['list'] if keys.index(f['start']) <= n - 1][-1]
        scenes.append(dict(id=sc['id'], scene=n, flow=fl, orig=sc.get('orig'), added=bool(sc.get('added')), panel='prehistory-panels/%02d.webp' % sc['panel'],
                           size=[PANEL_W, PANEL_H], reused=bool(sc.get('reuse')), depicts=sc['alt'], key=sc['key'], speakers=[w for w, _ in (sc['a'], sc['b'])],
                           stress=sc.get('stress'), teacher_lines=sc['src']))
    guide = ('<ul class="p-guide"><li><b>네 흐름</b> ① 구석기 → ② 신석기 → ③ 청동기는 생활 모습과 도구로 가르고, ④ 철기는 오답을 가르는 데만 써요.</li>'
             '<li><b>컷마다</b> 시대 → 그림 → 대화 → 설명 → 꼭 기억을 읽어요. 강의가 직접 짚은 말은 ‘강의 강조’로 표시해요.</li>'
             '<li><b>시대가 끝나는 곳</b>마다 ‘이 부분에서 외울 것’으로 생활과 도구를 이어서 정리해요.</li></ul>')
    header = ('<header><small>한국사 한눈에 · 시대 웹툰</small><h1>선사시대</h1><p>떠돌던 사람들은 어떻게 마을을 이루게 됐을까?</p>' + guide + '</header>'
              '<nav class="p-nav" aria-label="선사시대 흐름 바로 가기"><div class="p-nav-track">%s</div></nav>'
              '<div class="chapter-line">%s</div>\n') % (''.join('<a href="#%s">%s %s</a>' % (e(f['id']), e(f['no']), e(f['name'])) for f in flow['list']), e(flow['note']))
    end = ('<div class="end"><strong>흐름 한 줄</strong>'
           '<p>구석기 이동·뗀석기 → 신석기 농경 시작·정착 → 청동기 벼농사·계급 → 철기 생산·교역(주로 오답)</p>'
           '<a href="../index.html#chapter/prehistory/quiz" target="_top">다 읽었다면 퀴즈로 확인하기 →</a></div>')
    doc = (head + '</head><body class="p-story"><a class="comic-home" href="../index.html" aria-label="시대별 목차로 이동">⌂ 홈</a><div id="progress"></div><main>'
           + header + body + end + tail)
    with open(os.path.join(MEDIA, FILE), 'w', encoding='utf-8') as f:
        f.write(doc)
    cmap = dict(generated_by='scripts/build_prehistory_comic.py',
                note='선사시대 웹툰 장면(화면 순서)·흐름·그림(바이트 그대로, 539×358 전체)·기존 꼭 기억 단서·강의 강조와 근거 행, 이 부분에서 외울 것 카드 위치.',
                scenes=scenes, memory=memory)
    with open(os.path.join(ROOT, 'docs', 'prehistory-comic-map.json'), 'w', encoding='utf-8') as f:
        json.dump(cmap, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print('선사시대 장면', len(scenes), '· 흐름', len(flow['list']), '· 카드', len(memory))


if __name__ == '__main__':
    build()

# Source-backed supplementary learning cuts; original scene keys stay unchanged.
from study_supplements import apply as apply_study_supplements
apply_study_supplements()
