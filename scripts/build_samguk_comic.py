# -*- coding: utf-8 -*-
"""삼국시대 웹툰(media/samguk-comic.html)을 강의 흐름(네 흐름)에 맞춘 한 페이지 학습으로 다시 엮는다.

  python3 scripts/build_samguk_comic.py

- 그림: 예전 웹툰은 1086×1448 그림판 네 장을 base64로 품고(.sheet0–3) 배경 늘이기로 칸을 잘라 보였다.
  처음 실행하면 품은 PNG를 그대로 꺼내(다시 인코딩하지 않음) 해시·바이트 수·크기를 확인한 뒤 media/samguk-sheets/0.png–3.png에
  바이트 그대로 둔다. 다시 실행할 때 웹툰에 품은 그림이 없으면 그 네 파일을 같은 값으로 확인해 쓴다. 하나라도 다르면 멈춘다.
  품은 그림 스타일은 네 파일이 확인된 뒤에만 지운다(17MB를 두 번 두지 않음).
- 칸: 그림판마다 행 높이가 고르지 않아(예: 그림판 0은 358 · 350 · 362 · 378), 조정자가 잰 장면별 사각형(PANELS)을 그대로 쓴다.
  칸 하나를 SVG viewBox로 통째로, 원래 비율로 보여 준다(다시 그리기·확대·잘라 내기 없음). 칸 비율은 그림을 불러오기 전에 자리를 잡는다.
- 기존 파일의 앞부분(스타일)과 </main> 뒤 스크립트(진행 막대 · 가장자리 밀기 · 장면 번호 · 용어 풀이)는 그대로 두고, 품은 그림 스타일만 뺀다.
  이 웹툰 전용 스타일(hanq-samguk-story)은 지우고 다시 넣어 여러 번 실행해도 결과가 같다.
- 장면 32개의 id(s1–s32)·순서·제목·핵심 줄(예전 .beat, 이제 p.key)은 그대로다. 예전 구분 줄(.hook)은 보이게, 예전 설명(.fact)은 장면 안 접힌 보충으로 원문 그대로 둔다.
- 흐름 머리와 ‘이 부분에서 외울 것’ 카드는 media/lecture-flow-samguk.js의 /*FLOW-JSON*/ … /*END-FLOW-JSON*/를 읽는다.
- 말풍선은 그림 밖(아래)에 둔다. 기록에 이름이 없는 화자는 ‘설명용 인물’로 밝힌다. 스타일은 body.s-story 안에서만 쓴다.
- 출력: media/samguk-comic.html, media/samguk-sheets/0–3.png(처음 한 번), docs/samguk-comic-map.json. 시간·난수·개인 경로를 쓰지 않는다.
  근거·정정 기록은 docs/samguk-scene-sources.md.
"""
import base64, hashlib, html, json, os, re, struct

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA = os.path.join(ROOT, 'media')
FILE = 'samguk-comic.html'
SHEET_DIR = 'samguk-sheets'
e = lambda s: html.escape(s, quote=True)

# 원본 그림판(예전 웹툰에 base64로 품었던 PNG): 번호 → (SHA-256, 바이트 수). 모두 1086×1448
SHEETS = {0: ('6c476e4f1fef1707f1f3172f90e751412db9c1bee8e8c6010a90f083d921a74a', 3298422),
          1: ('bfbed0bb132b14a677e0b811231c8e46308123d6d8fc2ccfc225c20d690e2aca', 3301452),
          2: ('88aeaaede189d24f8f403c0e93cb745b5084c4b4a55c26878856d22d0c9fc11d', 3292099),
          3: ('b7a8596db4e7108e9c742072f0486c5fc210120a88ca62fc9b29f0900aae09b5', 3377053)}
SHEET_W, SHEET_H = 1086, 1448
SHEET_RE = re.compile(r'\.sheet(\d)\{background-image:url\(data:image/png;base64,([A-Za-z0-9+/=]+)\)\}')
SHEET_STYLE_RE = re.compile(r'<style>(?:\.sheet\d\{background-image:url\(data:image/png;base64,[A-Za-z0-9+/=]+\)\})+</style>')

# 장면별 칸 사각형(조정자가 잰 값: 그림판, x, y, w, h). 그림판마다 행 높이가 다르다 — 균등 격자를 가정하지 않는다
PANELS = {1: (0, 0, 0, 543, 358), 2: (0, 543, 0, 543, 358), 3: (0, 0, 358, 543, 350), 4: (0, 543, 358, 543, 350),
          5: (0, 0, 708, 543, 362), 6: (0, 543, 708, 543, 362), 7: (0, 0, 1070, 543, 378), 8: (0, 543, 1070, 543, 378),
          9: (1, 0, 0, 543, 352), 10: (1, 543, 0, 543, 352), 11: (1, 0, 352, 543, 326), 12: (1, 543, 352, 543, 326),
          13: (1, 0, 678, 543, 337), 14: (1, 543, 678, 543, 337), 15: (1, 0, 1015, 543, 433), 16: (1, 543, 1015, 543, 433),
          17: (2, 0, 0, 543, 362), 18: (2, 543, 0, 543, 362), 19: (2, 0, 362, 543, 365), 20: (2, 543, 362, 543, 365),
          21: (2, 0, 727, 543, 362), 22: (2, 543, 727, 543, 362), 23: (2, 0, 1089, 543, 359), 24: (2, 543, 1089, 543, 359),
          25: (3, 0, 0, 543, 336), 26: (3, 543, 0, 543, 336), 27: (3, 0, 336, 543, 348), 28: (3, 543, 336, 543, 348),
          29: (3, 0, 684, 543, 329), 30: (3, 543, 684, 543, 329), 31: (3, 0, 1013, 543, 435), 32: (3, 543, 1013, 543, 435)}

# 기록에 이름이 남지 않은 설명용 인물. 그 밖의 화자(을파소 · 미천왕 · 근초고왕 · 소수림왕 · 광개토 대왕 · 장수왕 · 문주왕 · 지증왕 · 법흥왕 · 백제 성왕 · 신라 진흥왕 · 을지문덕 · 김춘추 · 계백)는
# 실제 인물이지만 대사는 학습용 요약이다(실제 발언 인용이 아님)
GENERIC = {'농민', '고구려 장수', '백제 장수', '신하', '신라 사신', '가야 상인', '상인 동료', '백제 사신', '백제 신하', '청년', '학생', '스승', '장인', '고구려 사람',
           '백제 사람', '안내자', '신라 사람', '동료', '사신', '왕실 사람', '백제 장인', '승려', '고구려 신하', '장수', '신라군', '부흥군', '고구려 유민', '신라 장수', '신라 왕', '수군', '기록자'}
ART_NOTE = '그림 속 유물은 학습용 재구성이라 실제 유물의 형태와 다를 수 있어요.'

# 장면 정의(화면 순서 = 기존 순서 s1–s32). label: 예전 meta 줄(번호 뒤) · title: 예전 h2 · key: 예전 .beat(글자 그대로)
#  when: 나라·왕·시기 줄 · a, b: 말풍선(예전 대사 그대로) · steps: [(이름, cause|dev|res|item, 문장)]
#  hook: 예전 .hook(원문 HTML 그대로, 보이게) · fact: 예전 .fact(원문 HTML 그대로, 접힌 ‘예전 설명’) · stress: 강의가 직접 짚은 말
#  art_note: 예전 .artnote가 있던 장면(s16–s20) · more: [(제목, 문장)] 접힌 보충 · next: (다음 장면으로 잇는 말, 흐름이 바뀌면 True) · src: 강의 행(없으면 None — 기존 노트 근거)
SCENES = [
    dict(id='s1', label='고구려 · 성장기 · 경제', title='배고프면, 나라부터 흔들린다', when='고구려 전성기 이전 · 고국천왕 · 을파소의 건의 · 진대법',
         a=('농민', '봄인데 곳간이 텅 비었어요!'), b=('을파소', '굶주리는 백성부터 살려야 나라가 버팁니다.'),
         steps=[('건국', 'item', '고구려는 주몽이 세웠고, 그 아들 유리왕이 졸본에서 국내성으로 수도를 옮겼다.'),
                ('배경', 'cause', '봄철이나 흉년이면 곡식이 떨어져 백성이 굶주렸다.'),
                ('제도', 'dev', '고국천왕은 을파소의 건의로, 봄에 나라가 곡식을 빌려주고 가을에 갚게 하는 진대법을 시행했다.'),
                ('함께', 'item', '교재는 고국천왕 때 왕위의 부자 상속이 확립되었다고도 정리한다.')],
         key='진대법',
         hook='진대법 = 고국천왕 + 을파소 + 곡식 대여',
         fact='<strong>고국천왕</strong>은 <strong>을파소</strong>의 건의로 <strong>진대법</strong>을 실시했다. 흉년·춘궁기에 곡식을 빌려주는 <strong>빈민 구제 제도</strong>다.',
         next=('백성을 구한 고구려에도, 북쪽 국경으로 위나라 군대가 밀려왔다.', False), src='106–107 · 147–148'),
    dict(id='s2', label='고구려 · 동천왕 → 미천왕 · 정치·대외 관계', title='얻어맞고, 다시 국경을 밀다', when='고구려 전성기 이전 · 동천왕 때 관구검의 침입 · 미천왕의 서안평 점령·낙랑군 축출',
         a=('고구려 장수', '관구검의 위나라 군대가 밀려옵니다!'), b=('미천왕', '위기가 지나갔다. 이제 서안평과 군현을 되찾자.'),
         steps=[('동천왕', 'item', '동천왕 때 중국 위나라의 관구검이 쳐들어와 수도의 성인 환도성이 함락되었다.'),
                ('미천왕', 'item', '뒤에 미천왕은 서안평을 점령하고 낙랑군을 몰아내 영토를 넓혔다.'),
                ('구분', 'item', '관구검과 환도성은 침입을 당한 일, 서안평과 낙랑군은 밀어낸 일이다.')],
         key='관구검의 침입 → 군현 축출',
         hook='동천왕은 침입을 겪고, 미천왕은 군현을 몰아낸다.',
         fact='<strong>동천왕 → 관구검의 침입</strong>. 이후 <strong>미천왕</strong>은 중국 <strong>5호 16국</strong>의 혼란을 틈타 <strong>서안평</strong>을 공격하고 <strong>낙랑군·대방군을 축출</strong>했다.',
         stress='관구검·환도성, 낙랑군 축출·서안평 점령이 나오면 고구려 전성기 이전으로 보면 되고 왕 이름은 몰라도 된다고 짚었어요.',
         next=('이 무렵 남쪽에서는 백제가 가장 먼저 전성기를 맞는다.', False), src='107–115'),
    dict(id='s3', label='4세기 · 백제 근초고왕 · 정치·문화', title='4세기, 먼저 치고 나간 백제', when='백제 한성 시대 · 근초고왕 · 마한 복속 · 평양성 공격 → 고구려 고국원왕 전사',
         a=('백제 장수', '한강의 힘으로 북쪽까지 치고 올라갑니다!'), b=('근초고왕', '평양성으로 간다. 고흥, 우리 역사도 기록하라.'),
         steps=[('정복', 'item', '근초고왕은 남쪽에 남아 있던 마한을 복속하고 영토를 넓혔다.'),
                ('평양성', 'dev', '근초고왕은 고구려 평양성까지 공격했고, 이를 막으러 나선 고구려 고국원왕이 전사했다.'),
                ('해외', 'item', '근초고왕 때 중국 산둥·요서 지방과 왜까지 진출해 교류했고, 왜 왕에게 주었다고 알려진 칠지도가 남아 있다.'),
                ('역사서', 'item', '박사 고흥이 역사서 「서기」를 편찬했다.')],
         key='4세기 백제 전성기',
         hook='4세기 백제 전성기 → 근초고왕 / 역사책 → 고흥·『서기』',
         fact='<strong>근초고왕</strong>은 <strong>평양성 공격</strong>으로 고구려 <strong>고국원왕을 전사</strong>시키고, <strong>마한의 잔여 세력</strong>을 정복했다. <strong>고흥</strong>에게 역사서 <strong>『서기』</strong>도 편찬하게 했다.',
         stress='‘백제가 평양성을 공격했다’, ‘백제가 공격해 고구려 왕이 죽었다’는 표현이 나오면 근초고왕 때라고 짚었어요.',
         next=('왕을 잃은 고구려에서는 그 아들 소수림왕이 나라의 기틀부터 다시 세운다.', False), src='111–113 · 171–184 · 213–216'),
    dict(id='s4', label='4세기 · 고구려 소수림왕 · 정치·문화', title='소수림왕의 재건 패키지', when='고구려 · 고국원왕의 아들 소수림왕 · 율령 반포 · 태학 설립 · 불교 수용',
         a=('신하', '전쟁에서 다시 일어서려면 나라부터 단단해야 합니다.'), b=('소수림왕', '법을 세우고 태학을 열고, 불교를 받아들이자.'),
         steps=[('배경', 'cause', '소수림왕은 백제와 싸우다 전사한 고국원왕의 아들로, 복수에 나서기보다 나라의 기틀을 먼저 다졌다.'),
                ('정비', 'dev', '나라의 법인 율령을 반포하고, 수도에 국립 학교 태학을 세우고, 전진에서 온 승려 순도를 통해 불교를 받아들였다.'),
                ('결과', 'res', '이렇게 다진 기틀 위에서 고구려는 광개토왕·장수왕 때 전성기를 맞았다.')],
         key='율령 · 태학 · 불교',
         hook='소수림왕 = 율령·태학·불교. 전성기를 떠받칠 기반을 정비!',
         fact='<strong>율령 반포</strong>로 통치 체제 정비, <strong>태학 설립</strong>으로 인재 양성, <strong>전진의 순도</strong>를 통해 <strong>불교 수용</strong>. 이 세 가지를 소수림왕에게 묶는다.',
         stress='율령 · 태학 · 불교가 보이면 고구려 소수림왕이라고 짚었어요.',
         next=('기틀을 다진 고구려는 광개토왕 때 밖으로 뻗어 나간다.', False), src='115–119 · 149'),
    dict(id='s5', label='4세기 말~5세기 초 · 고구려 · 정치·대외 관계', title='광개토왕, 이제 밖으로 달린다', when='고구려 · 광개토왕 · 연호 영락 · 만주 정복 · 신라에 침입한 왜 격퇴',
         a=('신라 사신', '왜군이 쳐들어왔습니다. 도와주십시오!'), b=('광개토 대왕', '영락의 군대가 간다. 신라를 구하라!'),
         steps=[('연호', 'item', '광개토왕은 영락이라는 독자적인 연호를 썼다.'),
                ('정복', 'item', '광개토왕은 후연 등과 싸워 만주 지역으로 영토를 넓혔다.'),
                ('신라 구원', 'dev', '신라 내물 마립간 때 왜가 쳐들어오자 신라가 도움을 청했고, 광개토왕은 군대를 보내 왜를 물리쳤다.'),
                ('유물', 'item', '신라 수도 경주에서 나온 호우명 그릇은 이 무렵 고구려와 신라의 관계를 보여 준다.')],
         key='영락 · 신라 구원',
         hook='소수림왕의 기반 정비 → 광개토왕의 팽창 → 장수왕의 남진',
         fact='<strong>광개토 대왕</strong>은 독자적 연호 <strong>영락</strong>을 사용하고, <strong>신라를 도와 왜군을 격퇴</strong>했다. 소수림왕의 체제 정비와 광개토왕의 팽창을 순서로 연결하자.',
         stress='‘영락이라는 연호를 사용하였다’가 나오면 고구려 광개토왕이라고 짚었어요.',
         next=('같은 무렵 낙동강 유역에는 철로 이름난 가야 연맹이 있었다.', False), src='119–125 · 151–154 · 235–236'),
    dict(id='s6', label='가야 · 전기 금관가야 → 후기 대가야 · 경제·정치', title='철 잘 팔던 가야에 불똥이', when='가야 연맹 · 김수로의 금관가야(김해) · 고령의 대가야 · 철 생산과 수출',
         a=('가야 상인', '철과 말이 잘 팔리니 장터가 북적입니다!'), b=('상인 동료', '하지만 큰 나라의 전쟁이 우리 운명도 바꾸겠어.'),
         steps=[('건국', 'item', '가야는 김수로가 세운 금관가야를 중심으로 대가야·아라가야 등 여러 나라가 모인 연맹이었다.'),
                ('경제', 'item', '김해 일대에서 철이 많이 나 철을 생산했고, 낙랑과 왜 등에 수출했다.'),
                ('흐름', 'item', '전기에는 김해의 금관가야가, 후기에는 고령의 대가야가 연맹을 이끌었다.'),
                ('멸망', 'res', '금관가야는 신라 법흥왕 때, 대가야는 신라 진흥왕 때 신라에 복속되었다.')],
         key='철 · 중개 무역 · 가야 연맹',
         hook='금관가야 → 신라 법흥왕이 병합 / 대가야 → 진흥왕이 정복',
         fact='전기 중심은 <strong>김수로의 금관가야</strong>, 기반은 <strong>철·중개 무역</strong>. 광개토왕의 공격으로 위축된다. 후기에는 <strong>고령의 대가야</strong>가 중심이 된다.',
         stress='가야는 마지막만 알면 된다며, 금관가야는 법흥왕 때, 대가야는 진흥왕 때 신라에 복속되었다고 짚었어요.',
         more=[('흐름 보충 · 가야의 유적', '김해에는 금관가야의 대성동 고분군, 고령에는 대가야의 지산동 고분군이 남아 있다. 철로 만든 갑옷이 보이면 가야로 본다.')],
         next=('다시 고구려로 가면, 광개토왕의 아들 장수왕이 남쪽으로 눈을 돌린다.', False), src='298–303'),
    dict(id='s7', label='5세기 · 고구려 장수왕 · 정치·문화', title='장수왕의 시선은 남쪽으로', when='고구려 · 장수왕 · 광개토대왕릉비 · 국내성 → 평양 천도(남진)',
         a=('신하', '아버지의 업적을 어떻게 남길까요?'), b=('장수왕', '비에 새기고, 수도는 평양으로 옮겨 남쪽을 보자.'),
         steps=[('비석', 'item', '장수왕은 아버지 광개토왕을 기리려고 광개토대왕릉비를 세웠다.'),
                ('천도', 'dev', '장수왕은 남쪽 백제를 본격적으로 공격하려고 수도를 국내성에서 평양으로 옮겼다.'),
                ('무덤', 'item', '거대한 돌무지무덤인 장군총은 장수왕(또는 광개토왕)의 무덤으로 추정된다.')],
         key='평양 천도 · 남진',
         hook='충주 고구려비 = 현재 남한에서 확인된 유일한 고구려비. 정확한 건립 시기는 단정하지 않는다.',
         fact='<strong>414년 광개토 대왕비 건립</strong>, <strong>427년 국내성 → 평양 천도</strong>. 남진하여 <strong>한강 유역</strong>을 차지했다. <strong>충주 고구려비</strong>는 남한강 유역까지 미친 고구려 세력을 보여 준다.',
         next=('여기부터는 한강을 둘러싼 다툼이에요. 고구려의 남진에 맞서 백제와 신라가 손을 잡는다.', True), src='125–128 · 155–158'),
    dict(id='s8', label='5세기 · 나제 동맹과 한성 함락 · 정치·대외 관계', title='“우리 둘이라도 손잡자!”', when='백제·신라 · 나제 동맹 · 개로왕의 북위 국서 · 장수왕의 한성 함락 → 문주왕의 웅진(공주) 천도',
         a=('백제 사신', '고구려가 남쪽으로 내려옵니다!'), b=('신라 사신', '우리라도 손잡읍시다. 나제 동맹을 맺어요.'),
         steps=[('동맹', 'cause', '고구려의 남진을 막으려고 백제와 신라는 나제 동맹을 맺었고, 백제 개로왕은 북위에 국서를 보내 도움을 청했지만 뜻을 이루지 못했다.'),
                ('함락', 'dev', '고구려 장수왕의 공격으로 백제 수도 한성이 함락되고 개로왕이 죽었으며, 고구려가 한강 유역을 차지했다.'),
                ('천도', 'res', '뒤를 이은 문주왕이 수도를 웅진(지금의 공주)으로 옮겼다.'),
                ('동맹 강화', 'item', '웅진 시대에 백제 동성왕은 신라 소지 마립간과 혼인 동맹을 맺어 나제 동맹을 강화했다.')],
         key='나제 동맹 → 한성 함락',
         hook='한성 함락 때 왕 = 개로왕 / 웅진으로 옮긴 왕 = 문주왕',
         fact='<strong>비유왕·눌지왕 → 나제 동맹</strong>. 이후 백제 <strong>개로왕</strong> 때 장수왕의 공격으로 <strong>한성 함락</strong>. 뒤이어 즉위한 <strong>문주왕</strong>이 수도를 <strong>웅진</strong>으로 옮긴다.',
         more=[('흐름 보충 · 처음 동맹을 맺은 왕', '처음 나제 동맹을 맺은 것은 백제 비유왕과 신라 눌지 마립간이다. 강의는 이 왕들은 몰라도 되고 신라 전성기 이전의 일 정도만 알면 된다고 했다.')],
         next=('한성을 잃은 백제는 웅진에서 나라를 다시 일으킨다.', False), src='184–189 · 237 · 325'),
    dict(id='s9', label='6세기 · 백제 무령왕 · 정치·대외 교류', title='웅진에서 다시 살림을 세우다', when='백제 웅진(공주) 시대 · 문주왕의 천도 뒤 · 무령왕 · 22담로 · 남조 양과 교류',
         a=('백제 신하', '한성을 잃었습니다. 어디로 가야 합니까?'), b=('문주왕', '웅진으로 옮겨 다시 나라를 일으키자.'),
         steps=[('지방', 'item', '웅진 시대의 대표 왕 무령왕은 지방을 통제하려고 22담로를 두고 왕족을 보냈다.'),
                ('교류', 'item', '무령왕은 중국 남조의 양과 교류했고, 그 영향으로 무령왕릉은 벽돌무덤으로 만들어졌다.'),
                ('안정', 'item', '무령왕은 백가의 난을 평정했다.')],
         key='22담로 · 왕족 파견',
         hook='22담로·왕족 파견 = 무령왕 / 웅진 = 오늘날 공주',
         fact='<strong>무령왕 → 22담로에 왕족 파견</strong>. 중국 남조의 <strong>양</strong>과 교류했다. 웅진의 <strong>무령왕릉</strong>과 <strong>양직공도</strong>에서 교류 흔적을 확인할 수 있다.',
         stress='숫자 22가 나오면 백제 무령왕이라고 짚었어요.',
         next=('같은 시기 신라는 가장 늦게 전성기를 향해 나라의 틀을 갖춘다.', False), src='187–193 · 218–220'),
    dict(id='s10', label='6세기 · 신라 지증왕 · 정치·경제', title='신라, 이름과 살림부터 정비', when='신라 · 지증왕 · 국호 신라 · 왕 칭호 · 동시전 · 우산국 복속 · 순장 금지',
         a=('신하', '나라 이름과 왕의 칭호부터 정비하시지요.'), b=('지증왕', '좋다. 우산국도 정벌하고 시장도 관리하라.'),
         steps=[('이름', 'item', '지증왕은 서라벌·사로국 등으로 부르던 나라 이름을 신라로 정하고, 마립간 대신 왕이라는 칭호를 썼다.'),
                ('시장', 'item', '수도 경주의 동쪽 시장을 관리하려고 동시전을 설치했다.'),
                ('우산국', 'item', '이사부를 보내 우산국을 복속했고, 이때부터 독도의 역사가 이어진다.'),
                ('풍습', 'item', '왕이 죽으면 사람을 함께 묻던 순장을 금지했다.')],
         key='지증왕의 국가 정비',
         hook='지증왕 = 나라 이름·왕 칭호·우산국·동시전',
         fact='<strong>지증왕 → 국호 신라·왕 칭호</strong>, <strong>이사부의 우산국 정벌</strong>. 수도의 시장을 관리하는 <strong>동시전</strong>도 설치했다. <strong>마립간</strong>은 대군장이라는 뜻이다.',
         stress='지증왕을 물을 때는 동시전 설치를 제일 자주 묻는다고 짚었어요.',
         next=('이어서 왕이 된 법흥왕은 법과 제도로 나라를 다진다.', False), src='238–245 · 316 · 322–324'),
    dict(id='s11', label='6세기 · 신라 법흥왕 · 정치·문화', title='법흥왕, 나라의 규칙을 갖추다', when='신라 · 법흥왕 · 병부·상대등 · 율령 · 불교 공인(이차돈) · 건원 · 금관가야 복속',
         a=('신하', '나라를 다스릴 법과 조직이 필요합니다.'), b=('법흥왕', '율령·병부·상대등을 세우고 불교를 공인하자.'),
         steps=[('제도', 'item', '법흥왕은 병부와 상대등을 두어 중앙 관제를 마련하고, 율령을 반포했다.'),
                ('불교', 'dev', '토착 신앙이 강해 불교를 받아들이기 어려웠지만, 이차돈의 순교를 계기로 불교를 공인했다.'),
                ('연호', 'item', '법흥왕은 건원이라는 독자적인 연호를 썼다.'),
                ('영토', 'item', '법흥왕 때 금관가야를 복속해 영토를 넓혔다.')],
         key='법흥왕 · 건원',
         hook='법흥왕의 연호는 건원 / 광개토왕의 연호는 영락',
         fact='<strong>율령 반포·병부 설치·상대등 설치</strong>, 독자 연호 <strong>건원</strong>. <strong>이차돈의 순교 → 불교 공인</strong>. <strong>금관가야 병합</strong>까지 법흥왕에게 묶는다.',
         stress='너무 많으면 병부와 상대등 설치, 불교 공인만이라도 꼭 외우라고 짚었어요.',
         next=('6세기, 백제와 신라는 다시 손잡고 고구려가 차지한 한강으로 향한다.', False), src='245–252 · 324'),
    dict(id='s12', label='6세기 · 백제 성왕과 신라 진흥왕 · 정치·대외 관계', title='한강을 되찾았는데… 동맹이 갈라졌다', when='백제 사비 시대 · 성왕(사비 천도·남부여) · 진흥왕과 연합해 한강 하류 수복 → 진흥왕이 한강 하류 차지·신주',
         a=('백제 성왕', '한강을 함께 되찾았으니 이제 지켜야 합니다.'), b=('신라 진흥왕', '…한강 하류는 신라가 차지하겠다.'),
         steps=[('천도', 'item', '무령왕의 아들 성왕은 수도를 사비(지금의 부여)로 옮기고 나라 이름을 남부여로 바꾸었다.'),
                ('한강 수복', 'dev', '성왕은 신라 진흥왕과 손잡고 고구려를 공격해 한강 하류 지역을 되찾았다.'),
                ('배신', 'res', '그러나 진흥왕이 동맹을 깨고 한강 하류까지 차지해 신주를 설치하면서 나제 동맹이 깨졌다.')],
         key='나제 동맹 결렬',
         hook='한강의 큰 흐름: 백제 → 고구려 → 신라',
         fact='<strong>성왕 → 사비 천도·남부여</strong>. 백제·신라가 연합해 한강 유역을 회복한 뒤, <strong>진흥왕이 한강 하류까지 차지</strong>하면서 나제 동맹이 깨진다.',
         stress='사비(부여) 시대의 대표 왕 성왕은 굉장히 중요하다고 짚었어요.',
         next=('배신에 분노한 성왕은 관산성으로 향한다.', False), src='193–197 · 252–256 · 320'),
    dict(id='s13', label='6세기 · 성왕 전사 / 진흥왕 팽창 · 정치', title='관산성의 비극, 신라의 전성기', when='관산성 전투 → 백제 성왕 전사 · 진흥왕의 대가야 정복 · 화랑도 개편 · 거칠부의 「국사」',
         a=('백제 장수', '성왕께서 관산성에서 전사하셨습니다!'), b=('신라 장수', '진흥왕의 영토는 더 넓어지고 있다.'),
         steps=[('관산성', 'dev', '성왕은 대가야와 함께 신라 관산성을 공격했지만, 김무력이 이끈 신라군에 패해 전사했다.'),
                ('정복', 'res', '이어 진흥왕은 대가야를 정복했고, 가야는 역사 속으로 사라졌다.'),
                ('제도', 'item', '진흥왕은 화랑도를 국가적인 조직으로 개편하고, 거칠부에게 역사서 「국사」를 편찬하게 했다.')],
         key='관산성 전사 / 신라의 팽창',
         hook='단양 적성비는 순수비 4개에 포함하지 않는다.',
         fact='<strong>성왕 → 관산성 전사</strong>. <strong>진흥왕 → 화랑도 개편·대가야 정복</strong>. <strong>단양 적성비</strong>와 <strong>북한산·창녕·황초령·마운령의 4개 순수비</strong>가 영토 확장과 연결된다.',
         next=('여기부터는 세 나라의 사회와 문화를 주제별로 나란히 봐요. 왕의 순서가 아니라 시기가 서로 겹쳐요.', True), src='197–199 · 256–258 · 286 · 309–310'),
    dict(id='s14', label='삼국 사회를 걷다 · 경제 / 정치 / 사회', title='전쟁 뒤편, 백성·귀족·청년의 하루', when='나라별 비교 · 고구려 · 백제 · 신라의 통치와 사회',
         a=('청년', '열심히 해도 골품 때문에 길이 막힌대요.'), b=('농민', '우린 밭을 갈고, 귀족은 회의에서 나라 일을 정하지.'),
         steps=[('고구려', 'item', '고구려는 지방의 여러 성에 욕살·처려근지 같은 지방관을 두었고, 집집마다 부경이라는 창고가 있었다.'),
                ('백제', 'item', '백제는 정사암에 모여 재상을 뽑았고, 내신좌평·내두좌평 등 6좌평의 관제를 두었으며, 왕족은 부여씨였다.'),
                ('신라', 'item', '신라는 귀족 회의인 화백 회의를 만장일치로 운영했고, 골품에 따라 관등 승진과 일상생활을 엄격히 제한했다.'),
                ('화랑', 'item', '청소년 조직 화랑(국선)은 진흥왕 때 국가적인 조직이 되었고, 원광이 지은 세속 5계를 규범으로 삼았다.')],
         key='경제 · 정치 · 사회를 구분',
         hook='혼인 풍습 서옥제는 고구려의 사회, 귀족 회의는 정치에 속한다.',
         fact='[경제] <strong>철제 농기구·우경</strong>. [정치] 고구려 <strong>제가회의</strong>, 백제 <strong>정사암 회의</strong>, 신라 <strong>화백 회의(만장일치)</strong>. [사회] 신라 <strong>골품제</strong>는 관등·승진을 제한. <strong>화랑도</strong>의 규범은 <strong>세속 5계</strong>다.',
         stress='‘지방의 여러 성에 욕살·처려근지 등을 두었다’, ‘집집마다 부경이라는 창고가 있었다’는 시험에 매번 나오는 고구려 선택지이고, 무슨무슨 좌평·부여씨가 보이면 백제라고 짚었어요.',
         more=[('흐름 보충 · 원광의 걸사표', '진흥왕과 선덕여왕 사이 진평왕 때 승려 원광이 수나라에 군사를 청하는 걸사표를 지었다.')],
         next=('세 나라는 나라를 맡길 인재를 학교에서 길러 냈다.', False), src='144–149 · 209–213 · 276–279 · 287–290'),
    dict(id='s15', label='삼국의 교육 현장 · 문화·교육', title='세 나라 학생들은 뭘 배웠을까', when='나라별 비교 · 고구려 태학·경당 · 백제 박사 · 신라 임신서기석',
         a=('학생', '글만 배우나요?'), b=('스승', '고구려 경당에선 글과 활쏘기를 함께 익힌단다.'),
         steps=[('태학', 'item', '태학은 소수림왕 때 수도에 세운 고구려의 국립 학교다.'),
                ('경당', 'item', '경당은 고구려의 지방에서 글과 활쏘기를 가르친 학교다.'),
                ('백제', 'item', '백제에는 오경박사·의박사 같은 전문 인재가 있었다.'),
                ('신라', 'item', '신라의 임신서기석에는 두 청년이 유학 경전을 열심히 공부해 나라에 보탬이 되자고 맹세한 글이 새겨져 있다.')],
         key='태학 · 경당 · 박사 · 임신서기석',
         hook='경당을 소수림왕의 확정 업적으로 묶지 말자. 정확한 설립 시기는 불명확하다.',
         fact='고구려 <strong>태학</strong>은 중앙 교육, <strong>경당</strong>은 지방에서 글·활쏘기. 백제는 <strong>오경박사·의박사</strong> 등 전문 인재. 신라 <strong>임신서기석</strong>에는 청년들의 유학 경전 학습 맹세가 남았다.',
         next=('배움의 흔적은 무덤과 벽화에도 남았다. 먼저 고구려의 무덤이다.', False), src='148–149 · 295–297'),
    dict(id='s16', label='문화 산책 · 고구려 · 문화·무덤', title='고구려 무덤의 문을 열면', when='고구려 · 돌무지무덤(장군총) → 굴식 돌방무덤(벽화 · 모줄임 천장)',
         a=('장인', '이 돌무덤은 어떻게 쌓았나요?'), b=('고구려 사람', '돌을 쌓던 무덤도, 벽화를 그린 굴식 무덤도 남겼지.'), art_note=True,
         steps=[('초기', 'item', '고구려 초기 무덤은 돌을 쌓아 만든 돌무지무덤이고, 대표가 장군총이다.'),
                ('변화', 'dev', '뒤에는 무덤 안에 돌방을 만든 굴식 돌방무덤으로 바뀌었다.'),
                ('벽화', 'item', '벽화는 굴식 돌방무덤에서 발견되며, 천장이 점점 좁아지는 모줄임 천장 구조가 특징이다.'),
                ('예', 'item', '쌍영총 벽화의 개마무사와 안악 3호분 벽화가 대표적이다.')],
         key='고구려의 무덤',
         hook='고구려 장군총 = 돌무지무덤 / 벽화·현무도 = 굴식 돌방무덤 쪽',
         fact='<strong>돌무지무덤 → 굴식 돌방무덤</strong>. <strong>장군총</strong>은 발전된 돌무지무덤의 예다. 굴식 돌방무덤에는 벽화가 남아 있고, <strong>강서대묘 현무도</strong>에는 <strong>도교</strong>의 영향이 나타난다.',
         stress='벽화가 발견되었다고 하면 굴식 돌방무덤이라고 짚었어요.',
         next=('이번엔 백제다. 수도가 바뀌며 무덤도 달라진다.', False), src='155–162'),
    dict(id='s17', label='문화 산책 · 백제 · 문화·무덤', title='백제 무덤은 수도를 따라 읽자', when='백제 · 한성 석촌동 → 웅진(공주) 송산리·무령왕릉 → 사비(부여) 능산리',
         a=('백제 사람', '수도 따라 무덤도 달라진다고요?'), b=('안내자', '한성 석촌동, 웅진 무령왕릉, 사비 능산리로 기억해.'), art_note=True,
         steps=[('한성', 'item', '한성 시대의 서울 석촌동 고분군은 고구려처럼 돌무지무덤이라, 백제가 고구려에서 내려온 나라임을 보여 준다고 해석한다.'),
                ('웅진', 'item', '공주의 송산리 고분군에는 남조의 영향을 받은 벽돌무덤 무령왕릉이 있고, 왕과 왕비의 지석·석수가 출토되었다.'),
                ('사비', 'item', '부여의 백제 무덤들은 능산리 고분군이라 부른다.')],
         key='한성 → 웅진 → 사비',
         hook='한성·웅진·사비 = 석촌동·무령왕릉·능산리',
         fact='<strong>한성 → 석촌동 고분군·돌무지무덤</strong>. <strong>웅진 → 무령왕릉·벽돌무덤</strong>과 굴식 돌방무덤. <strong>사비 → 능산리 고분·굴식 돌방무덤</strong>. 벽돌무덤에는 <strong>중국 남조의 영향</strong>이 보인다.',
         stress='송산리 고분군 · 능산리 고분군이 나오면 백제라고 짚었어요.',
         next=('신라는 돌무지 덧널무덤에 많은 껴묻거리를 남겼다.', False), src='216–222'),
    dict(id='s18', label='문화 산책 · 신라 · 문화·무덤', title='신라의 보물이 남은 까닭', when='신라 · 돌무지 덧널무덤 · 천마총의 천마도 · 금관',
         a=('신라 사람', '무덤을 열지 않고도 보물이 남았다고요?'), b=('동료', '돌무지 덧널무덤 구조가 껴묻거리를 지켜 줬어.'), art_note=True,
         steps=[('구조', 'item', '신라 초기 무덤은 나무 덧널 안에 널과 껴묻거리 상자를 두고 돌로 덮은 뒤 흙을 덮은 돌무지 덧널무덤이다.'),
                ('유물', 'item', '천마총에서 나온 천마도는 벽화가 아니라 말 안장에 그린 그림이고, 금관도 유명하다.'),
                ('변화', 'item', '신라 무덤도 시간이 지나며 굴식 돌방무덤으로 바뀌었다.')],
         key='돌무지 덧널무덤',
         hook='신라 = ‘덧널’ + 많은 껴묻거리. 그림은 구조 이해를 위한 재구성이다.',
         fact='<strong>돌무지 덧널무덤</strong>은 구조상 도굴이 어려워 <strong>천마도·금관·유리잔</strong> 등 껴묻거리가 많이 출토되었다. 고구려의 <strong>돌무지무덤</strong>과 명칭을 구분한다.',
         stress='천마도는 벽화가 아니라 말 안장에 그려진 그림이라고 짚었어요.',
         next=('무덤 속 유물과 함께 세 나라의 믿음도 살펴보자.', False), src='280–286'),
    dict(id='s19', label='문화 산책 · 불교 · 문화·종교', title='불교가 건너오고, 탑이 올라가다', when='나라별 비교 · 불교 수용(소수림왕 · 침류왕 · 법흥왕) · 미륵사지 석탑 · 황룡사 9층 목탑',
         a=('사신', '불교가 나라에 들어왔습니다.'), b=('왕실 사람', '고구려는 소수림왕, 백제는 침류왕, 신라는 법흥왕 때야.'), art_note=True,
         steps=[('고구려', 'item', '고구려는 소수림왕 때 전진의 순도를 통해 불교를 받아들였다.'),
                ('백제', 'item', '백제는 침류왕 때 동진의 마라난타를 통해 불교를 받아들였는데, 근초고왕의 정복 활동 뒤의 일이다.'),
                ('신라', 'item', '신라는 법흥왕 때 이차돈의 순교를 계기로 불교를 공인했다.'),
                ('무왕', 'item', '백제 무왕은 금마저(익산)에 미륵사를 세웠고, 미륵사지 석탑은 돌로 쌓았지만 목탑 양식을 띤다.'),
                ('선덕여왕', 'item', '신라 선덕여왕 때 자장의 건의로 황룡사 9층 목탑을 세웠고, 돌을 벽돌처럼 다듬어 쌓은 분황사 모전 석탑과 첨성대도 이때다.')],
         key='불교 수용과 탑',
         hook='불교 수용의 왕: 소수림왕·침류왕·법흥왕',
         fact='고구려 <strong>소수림왕 ← 전진·순도</strong>. 백제 <strong>침류왕 ← 동진·마라난타</strong>. 신라 <strong>법흥왕 ← 이차돈</strong>. 백제 <strong>미륵사지 석탑</strong>은 목탑 양식을 계승했고, 신라 <strong>황룡사 9층 목탑</strong>은 <strong>자장</strong>의 건의로 건립되었다.',
         stress='‘미륵사를 창건하였다’면 백제 무왕, ‘자장의 건의로 황룡사 9층 목탑이 건립되었다’면 선덕여왕이라고 짚었어요.',
         more=[('흐름 보충 · 다른 불교 문화재', '부여의 정림사지 5층 석탑은 백제 멸망 뒤 당 장수 소정방이 1층에 백제를 평정했다는 글을 새긴 탑이다. 고구려 불교 문화재로는 연가7년명 금동여래입상이 나온다.')],
         next=('불교와 함께 도교의 신선 사상도 공예품에 담겼다.', False), src='117–119 · 163 · 181–184 · 200–202 · 222–232 · 247–250 · 290–295 · 321'),
    dict(id='s20', label='문화 산책 · 도교와 한문학 · 문화·사상', title='향로 속 산, 벽돌 속 풍경', when='나라별 비교 · 고구려 사신도 · 백제 금동대향로 · 산수무늬 벽돌 · 사택지적비',
         a=('백제 장인', '향로에 산과 신선의 세계를 담았습니다.'), b=('동료', '물건과 비석에도 불교·도교·한문 문화가 남았네.'), art_note=True,
         steps=[('고구려', 'item', '고구려 무덤의 사신도 벽화는 도교 문화를 보여 준다.'),
                ('백제', 'item', '부여에서 나온 금동대향로는 아래의 용부터 위의 봉황까지 신선이 사는 이상 세계를 표현했고, 산수무늬 벽돌도 도교를 보여 준다.'),
                ('한문학', 'item', '백제 사택지적비는 높은 한문학 수준과 불교·도교 사상을 함께 보여 준다.')],
         key='도교의 흔적',
         hook='사택지적비 = 백제 / 한문학 + 불교·도교. 유물 그림은 학습용 재구성.',
         fact='<strong>도교</strong>의 흔적: 고구려 <strong>강서대묘 현무도</strong>, 백제 <strong>산수무늬 벽돌·금동 대향로·사택지적비</strong>. <strong>사택지적비</strong>는 높은 <strong>한문학 수준</strong>과 <strong>불교·도교 사상</strong>도 보여 준다.',
         stress='사신도 벽화가 보이면 도교 문화재 정도로 알면 된다고 짚었어요.',
         next=('삼국의 지식과 기술은 바다를 건너 일본으로도 갔다.', False), src='167–169 · 225–229'),
    dict(id='s21', label='삼국 → 일본 · 문화·교류', title='문화는 바다를 건넌다', when='삼국 → 일본 · 고구려 혜자 · 백제 노리사치계',
         a=('승려', '배를 타고 일본으로 건너갑니다.'), b=('동료', '혜자는 고구려, 노리사치계는 백제에서 갔지.'),
         steps=[('고구려', 'item', '고구려 승려 혜자는 일본 쇼토쿠 태자의 스승이 되었다.'),
                ('백제', 'item', '백제의 노리사치계는 일본에 불경과 불상을 전했다.')],
         key='혜자 · 노리사치계',
         hook='혜자는 고구려 / 노리사치계는 백제',
         fact='고구려 승려 <strong>혜자 → 쇼토쿠 태자의 스승</strong>. 백제 <strong>노리사치계 → 일본에 불경·불상 전파</strong>. 이제 다시, 삼국의 운명을 바꿀 7세기의 전쟁으로 돌아간다.',
         next=('여기부터는 다시 시간 순서예요. 7세기, 중국을 통일한 수가 고구려를 압박한다.', True), src=None),
    dict(id='s22', label='7세기 · 고구려와 수 · 정치·전쟁', title='수의 대군, 살수에서 막히다', when='7세기 · 고구려 영양왕 · 수의 침입 → 을지문덕의 살수 대첩 · 이문진의 「신집」 5권',
         a=('고구려 장수', '수 양제의 대군이 또 밀려옵니다!'), b=('을지문덕', '살수에서 막아 내라!'),
         steps=[('배경', 'cause', '중국을 통일한 수가 고구려에 머리를 숙이라고 요구했지만 고구려는 거절했다.'),
                ('전개', 'dev', '수가 대군을 이끌고 쳐들어왔고, 영양왕 때 을지문덕이 살수에서 크게 이겼다.'),
                ('역사서', 'item', '영양왕 때 이문진이 옛 역사서 「유기」 100권을 간추려 「신집」 5권을 편찬했다.')],
         key='을지문덕 · 살수 대첩',
         hook='수와의 전쟁 = 을지문덕·살수 대첩. 병력 수치는 첨부 자료의 서술을 따름.',
         fact='<strong>수 문제 → 30만 대군 침입 실패</strong>. <strong>수 양제 → 113만 대군 동원</strong>, <strong>우중문·우문술</strong> 등의 30만 별동대가 평양으로 진격했다. <strong>을지문덕의 살수 대첩</strong>으로 고구려가 승리한다.',
         next=('수가 무너지고 당이 들어서자 고구려는 다시 대비에 나선다.', False), src='128–133 · 169–171'),
    dict(id='s23', label='7세기 · 고구려와 당 · 정치·전쟁', title='이번에는 당, 안시성은 버틴다', when='7세기 · 천리장성 축조 → 연개소문의 정변 → 당의 침입 · 안시성 싸움',
         a=('고구려 신하', '이번엔 당이 쳐들어옵니다.'), b=('장수', '천리장성을 쌓고 안시성에서 버텨야 합니다.'),
         steps=[('대비', 'cause', '수가 망하고 당이 세워지자 고구려는 당의 공격에 대비해 천리장성을 쌓았고, 공사 책임자는 연개소문이었다.'),
                ('정변', 'dev', '당에 굽히자는 분위기에 반대한 연개소문이 정변을 일으켜 권력을 잡았다.'),
                ('결과', 'res', '당은 이를 구실로 쳐들어왔지만, 안시성의 군사와 백성이 당군을 물리쳤다.')],
         key='당 태종 · 안시성 싸움',
         hook='수 → 살수 / 당 → 안시성. 두 전쟁을 구분!',
         fact='<strong>천리 장성 축조</strong>로 대비. <strong>연개소문</strong>은 정변으로 권력을 잡고 <strong>당·신라에 강경 정책</strong>을 폈다. 이를 구실로 침략한 <strong>당 태종</strong>의 군대를 <strong>안시성 싸움</strong>에서 격퇴했다.',
         next=('같은 무렵 남쪽에서는 백제의 공격을 받은 신라가 동맹을 찾아 나선다.', False), src='133–139'),
    dict(id='s24', label='7세기 · 나당 동맹 · 정치·외교', title='김춘추, 동맹을 구하러 가다', when='7세기 · 의자왕의 대야성 함락 → 김춘추의 나당 동맹 · 선덕여왕 때 비담과 염종의 난',
         a=('김춘추', '백제의 공격을 막을 동맹이 필요합니다.'), b=('신하', '고구려와 왜에 도움을 청했지만 길이 막혔습니다.'),
         steps=[('배경', 'cause', '백제 의자왕이 윤충을 보내 신라의 대야성을 함락했고, 이때 김춘추의 딸과 사위가 죽었다.'),
                ('동맹', 'dev', '고구려·왜에 도움을 구했지만 뜻을 이루지 못한 김춘추는 당으로 건너가 군사 동맹을 맺었고, 이것이 나당 동맹이다.'),
                ('신라 안', 'item', '선덕여왕 때 일어난 비담과 염종의 난은 김유신이 진압했다.'),
                ('뒤에', 'item', '김춘추는 뒤에 왕위에 올라 무열왕이 되었다.')],
         key='나당 동맹',
         hook='나제 = 신라+백제 / 나당 = 신라+당. ‘나’는 신라!',
         fact='고구려·왜에 도움을 구했으나 뜻을 이루지 못한 <strong>김춘추</strong>는 <strong>당과 군사 동맹</strong>을 맺었다. 이것이 <strong>나당 동맹</strong>, 함께 싸우는 군대가 <strong>나당 연합군</strong>이다. 김춘추는 뒤에 <strong>무열왕</strong>, 최초의 <strong>진골 출신 왕</strong>이 된다.',
         stress='선택지에 ‘윤충을 보내 대야성을 함락하였다’가 나오면 백제 의자왕, ‘김유신이 비담과 염종의 난을 진압하였다’면 선덕여왕 때라고 짚었어요.',
         next=('나당 연합군은 먼저 백제로 향한다.', False), src='203–205 · 259–267 · 311–312'),
    dict(id='s25', label='삼국 통일 과정 ① · 정치·전쟁', title='첫 번째 멸망, 백제', when='나당 연합군 · 계백의 황산벌 전투 → 사비성 함락 → 백제 멸망(의자왕)',
         a=('계백', '황산벌에서 끝까지 맞서겠다!'), b=('신라군', '나당 연합군이 사비로 진격한다.'),
         steps=[('전개', 'dev', '나당 연합군이 백제를 공격하자 계백이 결사대를 이끌고 황산벌에서 싸웠지만 패했다.'),
                ('결과', 'res', '사비성이 함락되어 의자왕 때 백제가 멸망했다.'),
                ('뒤에', 'item', '백제가 멸망한 뒤 무열왕(김춘추)이 세상을 떠났다.')],
         key='백제 멸망',
         hook='백제 마지막 왕 = 의자왕 / 마지막 수도 = 사비 / 황산벌 = 계백',
         fact='<strong>계백 → 황산벌 전투</strong>. 결사 항전에도 <strong>사비성 함락 → 백제 멸망</strong>으로 이어졌다. 하지만 나라가 무너졌다고 사람들이 곧바로 저항을 멈춘 것은 아니었다.',
         next=('백제는 무너졌지만, 유민들은 부흥 운동으로 다시 맞선다.', False), src='205–206 · 267–268'),
    dict(id='s26', label='백제 부흥 운동 · 정치·전쟁', title='“백제를 다시 세우자!”', when='백제 멸망 뒤 · 복신·도침(부여풍 추대) · 흑치상지(임존성) · 백강 전투',
         a=('부흥군', '백제를 다시 세울 사람을 모읍시다!'), b=('동료', '주류성의 복신·도침은 부여풍을, 임존성의 흑치상지는 항전한다.'),
         steps=[('왕 추대', 'item', '복신과 도침은 부여풍을 왕으로 추대해 부흥 운동을 이끌었다.'),
                ('임존성', 'item', '흑치상지는 임존성에서 부흥군을 이끌었다.'),
                ('결과', 'res', '왜가 부흥 운동을 도와 백강에서 싸웠지만 나당 연합군이 이기면서 백제 부흥 운동은 끝났다.')],
         key='백제 부흥 운동',
         hook='주류성 = 복신·도침·부여풍 / 임존성 = 흑치상지 / 백강 = 왜 원군 패배',
         fact='<strong>복신·도침 → 부여풍 추대·주류성</strong>. <strong>흑치상지 → 임존성</strong>. 그러나 지도부 내분이 일어나고, <strong>왜 원군이 백강 전투에서 나당 연합군에 패배</strong>하면서 부흥 운동이 진압되었다.',
         next=('한편 북쪽 고구려에서는 연개소문이 죽은 뒤 권력 다툼이 벌어진다.', False), src='206–209'),
    dict(id='s27', label='삼국 통일 과정 ② · 정치·전쟁', title='버티던 고구려도 안에서 갈라지다', when='연개소문 사후 아들들의 권력 다툼 → 나당 연합군 → 평양성 함락 → 고구려 멸망(문무왕 때)',
         a=('고구려 신하', '연개소문이 죽고 아들들이 갈라섰습니다.'), b=('신라군', '내분을 틈타 평양성으로 진격하자.'),
         steps=[('배경', 'cause', '연개소문이 죽은 뒤 아들들이 권력을 두고 다투면서 고구려가 약해졌다.'),
                ('결과', 'res', '이 틈에 나당 연합군이 쳐들어와 평양성이 함락되고 고구려가 멸망했다.'),
                ('시기', 'item', '고구려 멸망은 백제 멸망 8년 뒤, 김춘추의 아들 문무왕 때의 일이다.')],
         key='고구려 멸망',
         hook='멸망 순서: 백제 먼저 → 고구려 나중',
         fact='<strong>연개소문 사후 내분 → 국력 약화 → 나당 연합군 공격 → 평양성 함락 → 고구려 멸망</strong>. 안시성에서 당을 막아 낸 사건과, 훗날 멸망한 사건을 구분한다.',
         next=('고구려 유민도 부흥을 꿈꾼다.', False), src='139–140 · 268–269'),
    dict(id='s28', label='고구려 부흥 운동 · 정치', title='고구려를 다시 세우려는 사람들', when='고구려 멸망 뒤 · 검모잠·고연무 · 안승 · 보덕국왕',
         a=('고구려 유민', '우리도 다시 나라를 세우자!'), b=('신라 사신', '안승을 왕으로 추대하고 당에 맞서자.'),
         steps=[('부흥', 'item', '검모잠과 고연무는 안승을 왕으로 받들어 고구려 부흥 운동을 벌였다.'),
                ('신라', 'item', '신라 문무왕은 안승을 보덕국왕으로 임명했다.'),
                ('구분', 'item', '백제 부흥 운동은 복신·도침·흑치상지와 부여풍, 고구려 부흥 운동은 검모잠·고연무와 안승이다.')],
         key='고구려 부흥 운동',
         hook='백제 부흥의 왕 = 부여풍 / 고구려 부흥의 왕 = 안승',
         fact='<strong>검모잠·고연무 → 안승 추대</strong>. 그러나 내분으로 <strong>안승이 검모잠을 제거</strong>하고 신라에 투항했다. 신라는 <strong>금마저에 보덕국</strong>을 두어 안승과 유민을 정착시켰으나, 보덕국도 훗날 반란 진압 뒤 해체되었다.',
         stress='‘안승을 보덕국왕으로 임명했다’는 표현이 굉장히 잘 나온다고 짚었어요.',
         next=('두 나라가 무너지자 당은 이제 한반도 전체를 노린다.', False), src='140–143'),
    dict(id='s29', label='나당 동맹 → 나당 전쟁 · 정치·대외 관계', title='동맹이었는데, 이제 적이라고?', when='당의 한반도 지배 시도(웅진 도독부 · 계림 도독부 · 안동 도호부) → 나당 전쟁',
         a=('신라 장수', '당이 이제 한반도를 직접 차지하려 합니다.'), b=('신라 왕', '동맹은 끝났다. 나당 전쟁으로 맞서자.'),
         steps=[('배경', 'cause', '백제와 고구려가 멸망하자 당은 한반도 전체를 차지하려는 욕심을 냈다.'),
                ('전개', 'dev', '당은 웅진 도독부·계림 도독부·안동 도호부를 두어 한반도를 직접 다스리려 했다.'),
                ('결과', 'res', '이를 받아들일 수 없던 신라가 당과 전쟁을 벌였다.')],
         key='나당 전쟁',
         hook='나당 동맹으로 두 나라를 무너뜨린 뒤 → 나당 전쟁으로 당을 몰아낸다.',
         fact='<strong>당의 한반도 지배 야욕 → 나당 전쟁</strong>. 앞서 신라가 고구려 부흥군을 지원한 일도 당에 맞서는 흐름으로 연결된다. <strong>동맹 체결</strong>과 <strong>동맹 결렬 뒤 전쟁</strong>은 서로 다른 단계다.',
         next=('신라는 매소성과 기벌포에서 당을 몰아낸다.', False), src='269–272'),
    dict(id='s30', label='676년 · 문무왕의 삼국 통일 · 정치·전쟁', title='매소성에서, 기벌포에서', when='나당 전쟁 · 매소성 전투 · 기벌포 전투 → 문무왕의 삼국 통일',
         a=('신라 장수', '육지 매소성에서 당군을 물리쳤습니다!'), b=('수군', '기벌포에서도 격퇴했습니다. 당이 물러납니다!'),
         steps=[('전투', 'dev', '신라는 매소성 전투와 기벌포 전투에서 당군을 물리쳤다.'),
                ('결과', 'res', '당을 몰아내면서 문무왕 때 삼국 통일이 완성되었다.'),
                ('구분', 'item', '매소성·기벌포 전투는 백제 부흥 운동이 아니라 당을 몰아낸 나당 전쟁의 싸움이다.')],
         key='676년 · 문무왕의 통일',
         hook='매·기 = 매소성·기벌포. 두 전투는 백제 부흥이 아니라 당을 몰아낸 나당 전쟁!',
         fact='<strong>매소성·기벌포에서 당군 격퇴</strong>. 평양의 <strong>안동 도호부</strong>는 <strong>요동성</strong>으로 물러났다. <strong>무열왕의 아들 문무왕</strong>은 <strong>676년 삼국 통일</strong>을 완성했다.',
         stress='660 · 668 · 676 같은 연도는 몰라도 되고 보통 순서로만 묻는다고 했어요.',
         next=('여기서 전쟁의 흐름을 마치고, 같은 시기 세 나라의 전성기를 한 줄로 정리해요.', False), src='272–276 · 326'),
    dict(id='s31', label='전성기와 한강을 한 줄로 · 정치·흐름', title='같은 시대에도, 역할은 달랐다', when='정리 · 같은 시기 세 나라가 전성기를 맞은 차례 · 한강의 주인',
         a=('학생', '4세기엔 고구려도 강했는데, 왜 백제 전성기예요?'), b=('스승', '같은 시대에도 나라별 성장의 정점은 달라. 시기와 왕을 나눠 보자.'),
         steps=[('기준', 'item', '삼국의 전성기는 한강을 누가 차지했는지로 보면 된다.'),
                ('차례', 'item', '전성기를 맞은 차례는 백제(근초고왕), 고구려(소수림왕의 정비 뒤 광개토왕·장수왕), 신라(지증왕·법흥왕의 정비 뒤 진흥왕)다.'),
                ('주의', 'item', '세 나라는 같은 시기에 나란히 있었으니, 이 차례는 한 나라가 다른 나라를 이은 순서가 아니라 전성기를 맞은 순서다.')],
         key='근초고 → 광개토·장수 → 진흥',
         hook='한강: 백제 → 고구려 → 신라 / 전성기: 근초고 → 광개토·장수 → 진흥',
         fact='<strong>4세기 백제 근초고왕 → 5세기 고구려 광개토·장수왕 → 6세기 신라 진흥왕</strong>. 광개토왕의 활동은 <strong>4세기 말~5세기 초</strong>에 걸친다. 소수림왕은 그 앞의 <strong>체제 정비</strong>로 연결한다.',
         stress='삼국의 전성기는 백제 → 고구려 → 신라 순이고, 전성기는 한강을 누가 차지했는지로 보면 된다고 짚었어요.',
         next=('왕과 전쟁 뒤에는 제도와 문화, 사람들의 삶이 함께 있었다.', False), src='101–103 · 304–314 · 331–335'),
    dict(id='s32', label='삼국시대 편 · 끝 · 사건 연결', title='이제, 이름들이 한 이야기로 남는다', when='정리 · 7세기 전쟁에서 통일까지',
         a=('학생', '왕 이름만 외우면 이야기가 되는 줄 알았어요.'), b=('기록자', '백성의 삶과 문화까지 이어 보면 삼국의 흐름이 보이지?'),
         steps=[('같은 무렵', 'item', '고구려가 수·당과 싸우던 무렵, 남쪽에서는 백제 의자왕이 신라의 대야성을 쳤고 이것이 나당 동맹으로 이어졌다.'),
                ('통일', 'item', '백제와 고구려가 차례로 멸망한 뒤, 신라가 나당 전쟁에서 이겨 삼국 통일을 마무리했다.'),
                ('다음', 'item', '통일 뒤에는 남쪽의 통일 신라와 북쪽의 발해가 나란히 있던 남북국 시대로 이어진다.')],
         key='삼국시대 편 · 끝',
         hook='이 편은 첨부 PDF의 삼국·가야와 통일 과정, 관련 경제·사회·문화를 엮었다.',
         fact='<strong>전성기</strong>는 한강의 주인 변화에, <strong>문화</strong>는 만든 나라에, <strong>통일</strong>은 동맹과 전쟁의 순서에 묶어 기억하자. 통일 이후의 신라와 발해는 다음 시대의 이야기다.',
         next=None, src='310–314 · 336'),
]

SAMGUK_CSS = ('<style id="hanq-samguk-story">/* 삼국: 흐름 머리 → 나라·왕·시기 줄 → 그림(원본 칸 전체 SVG · 비율 먼저) → 그림 밖 말풍선 → 설명 → 핵심 줄 · 구분 · 강의 강조 → (덩어리 끝) 이 부분에서 외울 것 → 다음 장면 잇기 */'
              'html{scroll-behavior:smooth}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}'
              '.s-story .scene{padding:0 0 22px;border-bottom:0;opacity:1!important;transform:none!important;content-visibility:visible!important}'
              '.s-story .s-head{padding:18px 18px 12px}.s-story .s-head .meta{padding:0;font-size:13px;color:#667085;font-weight:800}'
              '.s-story .s-head h2{padding:0;font-size:clamp(22px,6vw,28px);line-height:1.25;letter-spacing:-.04em;margin:6px 0 6px;word-break:keep-all}'
              '.s-story .s-when{margin:0;color:#a72d27;font-size:14.5px;line-height:1.5;font-weight:850;word-break:keep-all;overflow-wrap:anywhere}'
              # 그림: 예전 .frame 배경 늘이기(200%×4xx%)는 쓰지 않는다. SVG viewBox = 그 장면의 칸 사각형 전체, 칸 비율(--s-ar)로 그림을 불러오기 전에 자리를 잡는다
              '.s-story .s-art{margin:0;background:#d9dce0;line-height:0}.s-story .s-panel{display:block;width:100%;height:auto;aspect-ratio:var(--s-ar)}'
              '.s-art-cap{margin:6px 18px 0;font-size:13px;font-weight:750;line-height:1.5;color:#4b5565}.s-art-note{margin:2px 18px 0;font-size:13px;line-height:1.5;color:#5b6576}'
              '.s-talk-cap{margin:12px 18px 0;font-size:13px;font-weight:800;line-height:1.4;color:#5b6576}'
              '.s-talk{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin:8px 18px 0}'
              '.s-talk p{margin:0;padding:10px 12px 11px;background:#fff;border:2px solid #26384c;border-radius:16px 16px 16px 5px;color:#243248;line-height:1.5}'
              '.s-talk p+p{background:#eef6ff;border-color:#315d80;border-radius:16px 16px 5px 16px}'
              '.s-talk b{display:block;margin-bottom:4px;font-size:14px;font-weight:900;color:#b52d34}.s-talk p+p b{color:#315d80}'
              '.s-talk span{display:block;font-size:16px;font-weight:700;word-break:keep-all;overflow-wrap:anywhere}'
              '.s-steps{list-style:none;margin:12px 18px 0;padding:0;display:grid;gap:7px}'
              '.s-steps li{display:grid;grid-template-columns:3.6em minmax(0,1fr);gap:8px;align-items:baseline;font-size:16px;line-height:1.65;color:#2b3443;word-break:keep-all;overflow-wrap:anywhere}'
              '.s-steps .st{display:block;padding:1px 2px;border-radius:6px;text-align:center;font-size:12.5px;font-weight:900;line-height:1.5;background:#eef1f4;color:#4b5565}'
              '.s-steps .st.dev{background:#fff0e9;color:#a72d27}.s-steps .st.res{background:#e9f4ec;color:#2f6b3c}.s-steps .st.item{background:#f6f1e7;color:#7a5a24}'
              '.s-steps strong,.s-mem strong{color:#b52d34;font-weight:900}'
              '.s-story .scene>.key{margin:12px 18px 0;padding:10px 12px;border-left:4px solid #d83b32;background:#fff0e9;color:#a72d27;font-size:15px;font-weight:850;line-height:1.55;word-break:keep-all;overflow-wrap:anywhere}'
              '.s-hook{margin:8px 18px 0;font-size:15px;line-height:1.6;color:#35556b;font-weight:750;word-break:keep-all;overflow-wrap:anywhere}.s-hook b{margin-right:6px;padding:1px 7px;border-radius:6px;background:#eaf1f5;font-size:12.5px;font-weight:900}'
              '.s-stress{margin:8px 18px 0;font-size:14px;line-height:1.55;color:#294d87;font-weight:750;word-break:keep-all}.s-stress b{margin-right:6px;padding:1px 7px;border-radius:6px;background:#eef2f8;font-size:12.5px;font-weight:900}'
              '.s-story .scene-more{margin:10px 18px 0;padding:4px 12px;border:1px dashed #d6c7a3;border-radius:10px;background:#fffaf0;font-size:15px;line-height:1.6;color:#3d4859}'
              '.s-story .scene-more>summary{display:flex;align-items:center;min-height:44px;cursor:pointer;font-weight:850}.s-story .scene-more>summary:focus-visible{outline:3px solid #294d8766;outline-offset:2px;border-radius:6px}.s-story .scene-more p{margin:2px 0 10px}'
              '.s-story .scene-more strong{color:#bd272c;font-weight:850}'
              '.s-story .s-flow{padding:18px 18px 16px;background:#17243a;color:#fff}.s-story .s-flow:focus{outline:3px solid #f0b593;outline-offset:-3px}'
              '.s-story .s-flow small{display:block;color:#f0b593;font-size:13px;font-weight:800;letter-spacing:0}.s-story .s-flow h2{margin:4px 0 0;padding:0;color:#fff;font-size:clamp(20px,5.5vw,24px);line-height:1.3;word-break:keep-all}'
              '.s-story .s-flow p{margin:6px 0 0;font-size:15px;line-height:1.6;color:#dce5f0;word-break:keep-all}'
              '.s-mem{margin:0;padding:16px 18px 18px;background:#fff8e8;border-top:4px solid #e5a337;border-bottom:1px solid #f0dfb8}'
              '.s-mem-label{margin:0 0 8px;font-size:17px;font-weight:900;color:#7a4b0d}.s-mem-k+.s-mem-k{margin-top:14px;padding-top:12px;border-top:1px dashed #e3cf9f}'
              '.s-mem-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 10px;margin:0 0 6px}.s-mem-t{font-size:17px;font-weight:900}.s-mem-w{font-size:14px;font-weight:800;color:#294d87}'
              '.s-mem-story p{margin:0 0 6px;font-size:16px;line-height:1.7;color:#243248;word-break:keep-all;overflow-wrap:anywhere}'
              '.s-memo{margin:8px 0;padding:10px 12px;border-left:4px solid #e5a337;border-radius:8px;background:#fff}.s-memo b{display:block;font-size:14px;font-weight:900}.s-memo p{margin:4px 0 0;font-size:16px;line-height:1.7}.s-memo p+p{font-size:15px;color:#5b4a26}'
              '.s-mem-x{margin:8px 0 0;font-size:16px;line-height:1.7;color:#3b3220;word-break:keep-all;overflow-wrap:anywhere}.s-mem-x b{margin-right:6px;padding:1px 7px;border-radius:6px;background:#fce9e5;color:#8f2a26;font-size:13px;font-weight:900}'
              '.s-keys{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:8px 0 0}.s-keys-label{font-size:13px;font-weight:900;color:#5b6576}.s-key{padding:3px 9px;border-radius:999px;background:#fce9e5;color:#8f2a26;font-size:14px;font-weight:850}'
              '.s-guide{margin:12px 0 0;padding:0;list-style:none;font-size:14px;line-height:1.6;color:#d9e0e8}.s-guide b{color:#f0b593}'
              '.s-story .chapter-line{padding:15px 22px;background:#e6e9ed;color:#314057;font-weight:800;font-size:14px;line-height:1.6;word-break:keep-all}'
              '.s-story .story-seam.s-switch{background:#e6e9ed;color:#17243a;font-weight:850}'
              '.s-story .end{padding:22px 18px 8px}.s-story .end p{font-size:16px;line-height:1.7}.s-story .end a{display:inline-flex;align-items:center;min-height:44px;font-weight:850;color:#294d87}'
              # 흐름 바로 가기 줄(다른 강의 구성 웹툰과 같은 방식): 높이 60px 고정, 좁은 화면에서 오른쪽 92px는 홈 버튼 자리, 가로 스크롤은 안쪽 트랙에서만. 예전 공용 nav 규칙(줄바꿈·작은 글씨)을 덮는다
              '.s-story nav.s-nav{position:sticky;top:0;z-index:5;height:60px;box-sizing:border-box;display:flex;flex-wrap:nowrap;align-items:center;margin:0;padding:0 92px 0 10px;background:#edf0f4;border-bottom:1px solid #d9dee5}'
              '.s-story .s-nav-track{display:flex;align-items:center;gap:6px;min-width:0;width:100%;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scrollbar-width:none}.s-story .s-nav-track::-webkit-scrollbar{display:none}'
              '.s-story nav.s-nav a{flex:none;display:inline-flex;align-items:center;min-height:44px;padding:0 14px;color:#263a55;font-weight:800;font-size:14px;text-decoration:none;background:#fff;border:1px solid #d4dae1;border-radius:99px;white-space:nowrap}'
              '.s-story nav.s-nav a:focus-visible{outline:3px solid #294d8766;outline-offset:2px}'
              '.s-story .comic-home{top:calc(9px + env(safe-area-inset-top));min-height:42px}'
              '@media(min-width:760px){.s-story nav.s-nav{padding-right:10px}}'
              '.s-story .scene,.s-story .s-flow,.s-story .s-mem{scroll-margin-top:68px}'
              '@media(max-width:400px){.s-talk{grid-template-columns:1fr;gap:12px;margin:8px 14px 0}.s-steps{margin:12px 14px 0}.s-art-cap,.s-art-note,.s-talk-cap,.s-hook,.s-stress{margin-left:14px;margin-right:14px}.s-story .scene>.key{margin-left:14px;margin-right:14px}.s-story .s-head{padding:16px 14px 12px}.s-mem{padding-left:14px;padding-right:14px}}'
              '.embedded .s-story nav{display:none}'
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
    """웹툰에 품은 PNG 네 장을 그대로 꺼내 media/samguk-sheets/N.png로 둔다(처음 한 번). 품은 그림이 없으면 둔 파일을 확인한다."""
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
        # 품었든 아니든, 둔 파일을 다시 읽어 확인한 뒤에야 품은 그림 스타일을 지운다
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
    s = open(os.path.join(MEDIA, 'lecture-flow-samguk.js'), encoding='utf-8').read()
    m = re.search(r'/\*FLOW-JSON\*/(.*?)/\*END-FLOW-JSON\*/', s, re.S)
    if not m:
        raise SystemExit('media/lecture-flow-samguk.js 에 흐름 데이터(FLOW-JSON)가 없어요.')
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
    return ('<div class="s-art" data-panel="samguk-%d-s%02d"><svg class="s-panel" viewBox="%d %d %d %d" width="%d" height="%d" style="--s-ar:%d / %d" role="img" aria-label="%s" focusable="false" preserveAspectRatio="xMidYMid meet">'
            '<image href="%s/%d.png" x="0" y="0" width="%d" height="%d"/></svg></div>') % (
        s, n, x, y, w, h, w, h, w, h, e(sc['title'] + ' 장면(원본 그림판 칸 전체)'), SHEET_DIR, s, SHEET_W, SHEET_H)


def scene_html(sc, n, vocab):
    head = '<div class="s-head"><div class="meta"><span data-scene-count data-format="n">%02d</span> · %s</div><h2>%s</h2><p class="s-when">%s</p></div>' % (
        n, e(sc['label']), e(sc['title']), e(sc['when']))
    cap = '<p class="s-art-cap">개념 그림 · 실제 인물의 초상이나 유물·유적 사진이 아니에요.</p>'
    note = '<p class="s-art-note">%s</p>' % e(ART_NOTE) if sc.get('art_note') else ''
    talk = ('<p class="s-talk-cap">학습용 요약 대화 · 실제 발언을 그대로 옮긴 것이 아니에요.</p><div class="s-talk">%s</div>'
            % ''.join('<p aria-label="%s: %s"><b>%s</b><span>%s</span></p>' % (e(who(w)), e(t), e(who(w)), e(t)) for w, t in (sc['a'], sc['b'])))
    seen = set()
    steps = '<ol class="s-steps" aria-label="장면 설명">%s</ol>' % ''.join(
        '<li><b class="st %s">%s</b><span>%s</span></li>' % (k, e(l), bold_terms(t, seen, vocab)) for l, k, t in sc['steps'])
    hook = '<p class="s-hook"><b>구분</b>%s</p>' % sc['hook']
    stress = '<p class="s-stress"><b>강의 강조</b>%s</p>' % e(sc['stress']) if sc.get('stress') else ''
    more = ''.join('<details class="scene-more"><summary>%s</summary><p>%s</p></details>' % (e(t), e(x)) for t, x in sc.get('more', []))
    orig = '<details class="scene-more s-orig"><summary>예전 설명(원문 그대로)</summary><p>%s</p></details>' % sc['fact']
    return '<section class="scene" data-orig="%d" id="%s">%s%s%s%s%s%s<p class="key">%s</p>%s%s%s%s</section>' % (
        n, e(sc['id']), head, art_html(sc, n), cap, note, talk, steps, e(sc['key']), hook, stress, more, orig)


def memory_html(after, chunks):
    def one(k):
        memo = ('<div class="s-memo"><b>%s</b><p>%s</p><p>%s</p></div>' % (e(k['memo']['label']), e(k['memo']['text']), e(k['memo']['note']))) if k.get('memo') else ''
        wrong = '<p class="s-mem-x"><b>헷갈리지 않기</b>%s</p>' % em(k['x']) if k.get('x') else ''
        return ('<div class="s-mem-k"><p class="s-mem-head"><b class="s-mem-t">%s</b><span class="s-mem-w">%s</span></p><div class="s-mem-story">%s</div>%s%s'
                '<p class="s-keys"><span class="s-keys-label">암기 키워드</span>%s</p></div>') % (
            e(k['t']), e(k['w']), ''.join('<p>%s</p>' % em(x) for x in k['story']), memo, wrong, ''.join('<span class="s-key">%s</span>' % e(x) for x in k['k']))
    return '<aside class="s-mem" id="mem-%s" aria-label="이 부분에서 외울 것: %s"><p class="s-mem-label">이 부분에서 외울 것</p>%s</aside>' % (
        e(after), e(' · '.join(k['t'] for k in chunks)), '<ul>'+''.join('<li><b>%s</b> · %s</li>'%(e(k['t']),e(' → '.join(k['k']))) for k in chunks)+'</ul><details><summary>세부 내용 펼쳐보기</summary>'+''.join(one(k) for k in chunks)+'</details>')


def bridge_html(sc):
    if not sc.get('next'):
        return ''
    text, switch = sc['next']
    return '<div class="story-seam%s" aria-label="이야기 흐름"><span class="story-seam-dots" aria-hidden="true">…</span><span class="story-seam-text">%s</span></div>' % (
        ' s-switch' if switch else '', e(text))


def build():
    check_panels()
    keys = [sc['id'] for sc in SCENES]
    if keys != ['s%d' % i for i in range(1, 33)]:
        raise SystemExit('삼국 장면은 s1–s32, 기존 순서 그대로여야 해요.')
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
    head = re.sub(r'<style id="hanq-samguk-story">.*?</style>', '', src[:cut], flags=re.S) + SAMGUK_CSS
    tail = SHEET_STYLE_RE.sub('', src[src.index('</main>'):])
    if 'base64,' in tail:
        raise SystemExit('</main> 뒤에 품은 그림이 남아 있어요.')
    body, scenes, memory = '', [], []
    for n, sc in enumerate(SCENES, 1):
        if sc['id'] in starts:
            f = starts[sc['id']]
            body += '<div class="s-flow" id="%s"><small>%s · %s</small><h2 id="%s-h">%s %s</h2><p>%s</p></div>\n' % (
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
                           source=('강의 ' + sc['src'] + '행') if sc['src'] else '기존 웹툰 설명(강의 100–336행·교재 PDF 16–30쪽에 없음)'))
    guide = ('<ul class="s-guide"><li><b>네 흐름</b> ① 성장 → ② 한강 쟁탈과 신라의 성장 → ③ 사회와 문화(나라별 비교) → ④ 7세기 전쟁과 통일. 고구려·백제·신라·가야는 같은 시기에 나란히 있던 나라예요.</li>'
             '<li><b>컷마다</b> 나라·왕·시기 → 그림 → 대화 → 설명 → 핵심 줄을 읽어요. 강의가 직접 짚은 말은 ‘강의 강조’로 표시해요.</li>'
             '<li><b>큰 흐름 끝</b>마다 ‘이 부분에서 외울 것’으로 이어서 정리해요.</li></ul>')
    header = ('<header><small>한국사 웹툰 01 · ACTION EDITION</small><h1>한강의 주인이<br>바뀔 때</h1><p>세 나라의 성장, 동맹, 배신, 그리고 통일.<br>그 안에서 살아간 사람들의 이야기.</p>'
              '<p style="font-size:12px"><span data-scene-total>32</span>컷 · 삼국·가야의 성장부터 삼국 통일까지<br>대사와 인물은 학습용 각색. 빨간 굵은 글씨는 핵심어.</p>' + guide + '</header>'
              '<nav class="s-nav" aria-label="삼국시대 흐름 바로 가기"><div class="s-nav-track">%s</div></nav>'
              '<div class="chapter-line">%s</div>\n') % (''.join('<a href="#%s">%s %s</a>' % (e(f['id']), e(f['no']), e(f['name'])) for f in flow['list']), e(flow['note']))
    end = ('<div class="end"><strong>흐름 한 줄</strong>'
           '<p>전성기를 맞은 차례(같은 시기 세 나라): 백제 근초고왕 · 고구려 광개토왕·장수왕 · 신라 진흥왕 / 한강의 주인: 백제 → 고구려 → 신라</p>'
           '<p>7세기: 수·당의 침입(살수 · 안시성) · 대야성 함락 → 나당 동맹 → 백제 멸망 → 고구려 멸망 → 나당 전쟁(매소성 · 기벌포) → 삼국 통일</p>'
           '<a href="../index.html#chapter/samguk/quiz" target="_top">다 읽었다면 퀴즈로 확인하기 →</a></div>'
           '<div class="source">자료: 「한능검 심화 시대별 문단구분 수정본 v2」 5~7쪽의 삼국·가야·통일 과정과 8~10쪽의 삼국 경제·사회·문화. 서옥제는 4쪽에서 연결했습니다. 전성기의 세기 구분은 앞선 교재 학습 내용을 함께 반영했습니다.'
           '<br><br>설명·외울 것 카드는 강의 원고와 교재(삼국시대 단원)를 따라 다시 정리했습니다(근거 행·쪽은 docs/samguk-scene-sources.md). 장면마다 예전 설명은 ‘예전 설명(원문 그대로)’에 접어 두었습니다.'
           '<br><br>대사는 실제 발언이 아닌 학습용 각색입니다. 그림은 복식·유물·지형의 정확한 복원 자료가 아닙니다. 핵심 사실은 설명과 강조어를 기준으로 읽어 주세요.'
           '<br><br>내장 이미지 생성 도구로 제작한 독자적인 캐릭터와 그림입니다. 그림은 예전 웹툰에 들어 있던 그림판을 바이트 그대로 따로 둔 파일에서, 장면마다 칸 하나를 통째로 보여 줍니다.</div>')
    doc = (head + '</head><body class="s-story"><a class="comic-home" href="../index.html" aria-label="시대별 목차로 이동">⌂ 홈</a><div id="progress"></div><main>'
           + header + body + end + tail)
    with open(os.path.join(MEDIA, FILE), 'w', encoding='utf-8') as f:
        f.write(doc)
    cmap = dict(generated_by='scripts/build_samguk_comic.py',
                note='삼국 웹툰 장면(화면 순서 = 기존 s1–s32)·흐름·원본 그림판 칸(바이트 그대로, SVG viewBox로 칸 전체)·기존 제목·핵심 줄·강의 강조와 근거 행, 이 부분에서 외울 것 카드 위치.',
                panel_source=dict(width=SHEET_W, height=SHEET_H,
                                  sheets={'%d' % k: dict(file='media/%s/%d.png' % (SHEET_DIR, k), sha256=v[0], bytes=v[1]) for k, v in sorted(SHEETS.items())},
                                  extracted_from='예전 media/samguk-comic.html의 .sheet0–3 base64 PNG(다시 인코딩하지 않음)'),
                scenes=scenes, memory=memory)
    with open(os.path.join(ROOT, 'docs', 'samguk-comic-map.json'), 'w', encoding='utf-8') as f:
        json.dump(cmap, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print('삼국 장면', len(scenes), '· 흐름', len(flow['list']), '· 카드', len(memory))


if __name__ == '__main__':
    build()

# Source-backed supplementary learning cuts; original scene keys stay unchanged.
from study_supplements import apply as apply_study_supplements
apply_study_supplements()
