# -*- coding: utf-8 -*-
"""개화기 웹툰(media/opening-comic.html)을 강의 강조 모듈(O01–O22, docs/opening-lecture-handoff.json)에 맞춰 다시 엮는다.

  python3 scripts/build_opening_comic.py

- 실행 순서: node scripts/build_opening_sources.cjs → python3 scripts/build_opening_comic.py → node scripts/build_opening_sources.cjs
  (첫 실행이 굵게 표시할 핵심어 media/lecture-terms-opening.js를 만들고, 마지막 실행이 웹툰 장면 연결을 근거 지도에 반영한다.)
- 기존 파일의 <head>(스타일)와 </main> 뒤 스크립트는 그대로 두고 본문만 아래 OPENING 정의로 다시 쓴다. 여러 번 실행해도 결과가 같다.
- 그림: media/opening-panels.png(1024×1536, 12칸, 칸 높이가 서로 다름)은 바이트 그대로 둔다. 칸마다 읽기 전용으로 잰 실제 사각형을
  SVG viewBox로 보여 주어 칸 전체가 원래 비율로, 이웃 칸 없이, 확대·잘라 내기 없이 보인다. 그림 파일이 바뀌면(해시 다름) 멈춘다.
- 새 개념 그림(media/lecture-panels/opening-*.png)이 있으면 그 그림을 쓰고, 없으면 장면 안에 ‘그림 준비 중’ 상자를 두고
  docs/opening-comic-map.json의 art_needed에 그림 요청을 남긴다(다른 그림으로 대신하지 않는다).
- 말풍선은 그림 아래에 둔다. 스타일은 body.o-story 안에서만 적용한다. 고려·조선 생성기와 다른 시대 웹툰은 건드리지 않는다.
- 연도는 표준 연표 기준(강의 스크립트가 받치는 연도와 순서는 docs/opening-scene-sources.md에 따로 적음).
"""
import hashlib, html, json, os, re, struct

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA = os.path.join(ROOT, 'media')
FILE = 'opening-comic.html'
e = lambda s: html.escape(s, quote=True)
TIER_LABEL = {'core': '먼저 기억', 'support': '흐름 보충', 'optional': '선택 심화'}
# 기록에 이름이 남지 않은 설명용 인물(화면에 ‘설명용 인물’로 밝힘). 그 밖의 화자는 기록에 있는 실제 인물.
GENERIC = {'신하', '관리', '다른 관리', '개화 관리', '동료 개화파', '구식 군인', '농민', '농민군', '다른 농민군', '선비', '시민',
           '대한제국 관리', '상인', '해산 군인', '대구 시민', '기자', '학생'}
# 주제별 정리 장면(21·22)의 왕 줄: 한 왕의 때가 아니라 두 왕 대에 걸친 정리임을 밝힌다. 정치 흐름 정렬용 kings·year는 두지 않는다
# (data-kings가 없어야 주제별 장면으로 남아, 연도 순서·부 범위 검사에 끼지 않는다).
TOPIC_REIGN = ('26대 고종 → 27대 순종', '여러 왕 대에 걸친 정리 · 고종 재위 1863–1907 · 순종 재위 1907–1910')
NAV_H = 60 # 고정 바로 가기 줄 높이(px). 장면·부 머리의 scroll-margin이 이 값을 쓴다.

# 원본 그림판과 칸 사각형(읽기 전용 측정값: x, y, w, h). 행마다 높이가 370/376/374/400으로 달라 균등 격자로 자르면 이웃 칸이 섞인다.
SHEET, SHEET_SHA, SHEET_W, SHEET_H = 'opening-panels.png', 'fcfa1b12f78d896b71d0151cde9a78578fc3bfc42e6f5f893cc13045934befca', 1024, 1536
PANELS = {1: (0, 0, 337, 370), 2: (343, 0, 339, 370), 3: (688, 0, 336, 370),
          4: (0, 376, 337, 376), 5: (343, 376, 339, 376), 6: (688, 376, 336, 376),
          7: (0, 757, 337, 374), 8: (343, 757, 339, 374), 9: (688, 757, 336, 374),
          10: (0, 1136, 337, 400), 11: (343, 1136, 339, 400), 12: (688, 1136, 336, 400)}

# 새 개념 그림 요청(파일이 생기면 자동으로 쓴다)
NEW_ART = {
    'eulmi': ('lecture-panels/opening-eulmi-reform.png', '을미개혁(O11) 개념 그림: 관청 앞에서 관리가 상투를 자르라고 알리고, 선비가 망설이며 머리를 감싸 쥔 모습. 벽에 양력 달력. 왕후 시해 장면이나 실제 인물 초상은 넣지 않음. 단일 패널, 기존 개화기 칸과 비슷한 세로 비율(약 337×376), 기존 개화기 그림체.'),
    'club': ('lecture-panels/opening-independence-club.png', '독립협회(O12) 개념 그림: 독립문 앞 광장에 모인 시민과 관리들 앞에서 한 사람이 신문을 들고 연설하는 모습(만민 공동회). 특정 인물 초상과 읽을 수 있는 글자는 넣지 않음. 단일 패널, 기존 칸과 비슷한 세로 비율, 기존 개화기 그림체.'),
    'war1904': ('lecture-panels/opening-russo-japanese-1904.png', '러일 전쟁·화폐 정리(O15) 개념 그림: 멀리 항구에 군함이 보이고, 앞쪽 화폐 교환 창구 앞에서 한국 상인들이 옛 동전 꾸러미를 들고 근심하는 모습. 특정 인물 초상 없음. 단일 패널, 기존 칸과 비슷한 세로 비율, 기존 개화기 그림체.'),
    'debt': ('lecture-panels/opening-national-debt.png', '국채보상운동(O19) 개념 그림: 신문사 앞 모금함에 남녀노소가 돈과 반지·비녀를 내는 모습, 벽에 신문이 붙어 있음(글자는 읽을 수 없게). 특정 인물 초상 없음. 단일 패널, 기존 칸과 비슷한 세로 비율, 기존 개화기 그림체.'),
}

# 장면 정의 (한 장면 = 한 핵심 개념)
#  reign: (왕 대수·이름, 실제 재위 — 고종 재위 1863–1907, 대한제국 황제 1897–1907, 순종 재위 1907–1910, 흥선대원군 집권 1863–1873. 사건 연도는 when에만) · kings:다루는 왕 대수(조선 27왕 순서: 26대 고종, 27대 순종) · year: 정치 흐름 정렬용 연도(같은 해 사건은 같은 값)
#  when: 펼치지 않고 보이는 연도·사건 줄 · scope: 앞 장면보다 이른 해로 돌아가는 같은 왕 때의 다른 흐름(화면에 밝힘)
#  steps: [(이름, cause|dev|res|item, 문장)] — ‘결과’는 앞 단계에서 이어진 일만, 같은 때의 다른 일은 item
#  art: ('p', 칸 번호) 원본 그림판의 칸 · ('new', NEW_ART 키) 새 개념 그림 · art_note: 같은 그림을 다시 쓰면 화면에 밝힘
#  a, b: (화자 이름, 역할, 대사) — 학습용 요약 대화(실제 발언 인용 아님). GENERIC의 이름은 기록에 이름이 없는 설명용 인물로 화면에 밝힌다.
#  learn: 배경→전개→결과 줄 바로 뒤의 ‘이 컷 핵심’ 1–3개 (용어, 뜻·관계 한 문장). 강의 등급 배지는 그대로 두고 필수로 올리지 않는다.
#  key: 이 장면의 시험 단서(예전 ‘꼭 기억’ 항목). 화면에 따로 상자로 두지 않고, 각 낱말이 핵심·본문·연도 줄에 펼치지 않고 보이는지 생성기가 확인한다.
#  more: [(제목, 문장)] 접힌 보충 · next: (다음 장면으로 잇는 말, 왕을 이름 없이 건너뛰면 True)
#  part: 장면 앞에 둘 큰 단락 제목 (id, 작은 제목, 제목)
OPENING = [
    dict(id='scene-1', part=('part-1', '1부 · 1863–1873', '흥선대원군의 10년'), art=('p', 1), mods=['O01'], tier='support', label='1부 · 흥선대원군 집권', title='왕권을 다시 세우려는 개혁',
         reign=('26대 고종 · 흥선대원군 집권', '재위 1863–1907 · 흥선대원군 집권 1863–1873'), kings=(26, 26), year=1863, when='1863 고종 즉위 · 흥선대원군 집권 · 경복궁 중건',
         alt='붉은 관복을 입은 관리가 신하들 앞에서 명령하는 장면(조정 개념 그림 · 흥선대원군의 실제 모습이 아님)',
         a=('흥선대원군', '고종의 아버지 · 실권자', '비변사의 힘을 줄이고 의정부와 삼군부를 되살려라.'), b=('신하', '정책 반응 보고', '양반들이 호포제와 서원 정리에 크게 반발합니다.'),
         learn=[('흥선대원군 집권', '어린 26대 고종 대신 아버지 흥선대원군이 실권을 잡고 왕권을 다시 세우려 했다.'),
                ('호포제 · 사창제 · 서원 정리', '양반에게도 군포를 걷고 환곡을 고쳤으며, 서원을 47곳만 남겨 양반·유생이 반발했다.'),
                ('경복궁 중건 · 당백전', '경복궁을 다시 짓는 비용을 대려고 당백전을 찍어 물가가 크게 올랐다.')],
         steps=[('배경', 'cause', '세도 정치 아래 몇몇 가문이 비변사를 장악해 왕권이 약해져 있었다. 1863 어린 고종이 즉위하자 아버지 흥선대원군이 실권을 잡았다.'),
                ('전개', 'dev', '비변사의 기능을 줄이고 의정부와 삼군부를 되살렸다. 호포제로 양반에게도 군포를 걷고, 환곡 대신 사창제를 두었으며, 서원은 47곳만 남기고 정리했다.'),
                ('결과', 'res', '왕권은 강해졌지만 양반과 유생의 반발이 커졌다.'),
                ('경복궁', 'item', '임진왜란 때 불탄 경복궁을 다시 지으며 당백전을 발행해 물가가 크게 올랐다. 법전 대전회통도 펴냈다.')],
         key=['호포제', '사창제', '서원 정리', '경복궁 중건 · 당백전'],
         next=('같은 흥선대원군 집권기인 1866년, 나라 밖에서 배들이 몰려왔다.', False)),
    dict(id='scene-2', art=('p', 2), mods=['O02'], tier='core', label='1부 · 양요', title='1866년, 병인양요',
         reign=('26대 고종 · 흥선대원군 집권기', '재위 1863–1907 · 흥선대원군 집권 1863–1873'), kings=(26, 26), year=1866, when='1866 병인박해 · 제너럴셔먼호 사건 · 병인양요',
         alt='성벽 위에서 대포를 쏘며 바다의 서양 군함에 맞서는 군사들(양요 개념 그림 · 특정 전투의 실제 장면이 아님)',
         a=('양헌수', '정족산성 전투 지휘', '정족산성에서 프랑스군을 막아 내자!'), b=('한성근', '문수산성 전투 지휘', '문수산성에서도 맞서 싸우겠소.'),
         learn=[('병인양요 (1866 · 프랑스)', '천주교 탄압(병인박해)을 구실로 프랑스가 강화도를 침략한 사건이다.'),
                ('양헌수 · 한성근', '양헌수는 정족산성에서, 한성근은 문수산성에서 프랑스군에 맞섰다.'),
                ('외규장각', '프랑스군이 물러나며 외규장각의 의궤 등 도서를 약탈해 갔다.')],
         steps=[('배경', 'cause', '1866 흥선대원군 정권이 천주교 신자와 프랑스 선교사들을 처형했다(병인박해).'),
                ('같은 해', 'item', '평양에서는 대동강을 거슬러 온 미국 상선 제너럴셔먼호가 백성을 공격하자, 평안도 관찰사 박규수 등이 배를 불태웠다.'),
                ('전개', 'dev', '프랑스가 병인박해를 구실로 강화도를 침략했다(병인양요). 양헌수가 정족산성에서, 한성근이 문수산성에서 맞서 싸웠다.'),
                ('결과', 'res', '프랑스군은 물러나면서 외규장각의 의궤 등 도서를 약탈해 갔다.')],
         key=['병인박해', '제너럴셔먼호 사건', '병인양요 · 양헌수 · 한성근', '외규장각'],
         next=('2년 뒤, 서양과의 충돌이 다시 이어졌다.', False)),
    dict(id='shinmi-1871', art=('p', 2), art_note='그림: 앞 장면과 같은 양요 개념 그림을 다시 썼어요.', mods=['O02'], tier='core', label='1부 · 양요', title='1871년, 신미양요와 척화비',
         reign=('26대 고종 · 흥선대원군 집권기', '재위 1863–1907 · 흥선대원군 집권 1863–1873'), kings=(26, 26), year=1868, when='1868 오페르트 도굴 사건 · 1871 신미양요 · 척화비',
         alt='성벽 위에서 대포를 쏘며 바다의 서양 군함에 맞서는 군사들(앞 장면 그림 다시 사용 · 특정 전투의 실제 장면이 아님)',
         a=('어재연', '광성보 수비 지휘', '광성보를 끝까지 지켜라!'), b=('흥선대원군', '고종의 아버지 · 실권자', '서양과 화친하지 않겠다는 비석을 세워라.'),
         learn=[('신미양요 (1871 · 미국)', '제너럴셔먼호 사건을 문제 삼은 미국이 강화도를 침략한 사건이다.'),
                ('어재연 · 광성보', '어재연이 광성보에서 미국군과 끝까지 싸웠다.'),
                ('척화비', '두 양요를 겪은 흥선대원군이 서양과 화친하지 않겠다는 뜻으로 전국에 세웠다.')],
         steps=[('배경', 'cause', '1868 독일 상인 오페르트가 흥선대원군의 아버지 남연군의 묘를 도굴하려다 실패했다. 미국은 제너럴셔먼호 사건을 문제 삼았다.'),
                ('전개', 'dev', '1871 미국이 강화도를 침략했다(신미양요). 어재연이 광성보에서 싸웠고, 미국군은 어재연의 깃발(수자기)을 가져갔다.'),
                ('결과', 'res', '미국군이 물러난 뒤 흥선대원군은 서양과 화친하지 않겠다는 척화비를 전국에 세웠다.')],
         key=['오페르트 도굴 사건', '신미양요 · 어재연 · 광성보', '척화비'],
         more=[('먼저 기억 · 사건 순서', '병인박해 → 제너럴셔먼호 사건 → 병인양요(1866) → 오페르트 도굴 사건(1868) → 신미양요 → 척화비(1871). 앞글자로 ‘병제병오신척’.')],
         next=('1873년 최익현의 상소를 계기로 흥선대원군이 물러나고, 고종이 직접 정치를 시작했다.', False)),
    dict(id='scene-3', part=('part-2', '2부 · 1873–1887', '나라의 문을 열고, 개화를 둘러싸고 부딪치다'), art=('p', 3), mods=['O03', 'O04'], tier='core', label='2부 · 개항', title='1876년, 강화도 조약',
         reign=('26대 고종 · 직접 정치', '재위 1863–1907 · 직접 정치 1873–'), kings=(26, 26), year=1875, when='1875 운요호 사건 · 1876 강화도 조약',
         alt='조선 관리가 외국 해군 장교 앞에서 조약문에 서명하는 장면(조약 체결 개념 그림 · 특정 조약의 실제 장면이 아님)',
         a=('구로다 기요타카', '일본 측 대표', '운요호 사건의 책임을 지고 조약을 맺으시오.'), b=('신헌', '조선 측 대표','부산 말고도 원산과 인천까지 열어야 한단 말이오?'),
         learn=[('강화도 조약 (1876)', '운요호 사건을 구실로 일본과 맺은 첫 근대적 조약이자 불평등 조약이다.'),
                ('개항 · 해안 측량', '부산 외에 원산·인천을 열고, 일본이 조선 해안을 측량할 수 있게 했다.')],
         steps=[('배경', 'cause', '1875 일본 군함 운요호가 강화도 앞바다에서 충돌을 일으켰다(운요호 사건).'),
                ('전개', 'dev', '1876 이를 구실로 조일수호조규(강화도 조약)를 맺었다. 부산 외에 원산·인천을 열고, 일본이 조선 해안을 측량할 수 있게 했다.'),
                ('결과', 'res', '우리나라가 외국과 맺은 첫 근대적 조약이자 불평등 조약이었다. 조약 뒤 김기수를 1차 수신사로 일본에 보냈다.')],
         key=['운요호 사건', '강화도 조약', '개항 · 해안 측량', '김기수 · 수신사'],
         more=[('선택 심화 · 부속 조약과 통상 장정', '같은 해 조일수호조규 부록(개항장 10리 안 일본인 활동·일본 화폐 사용)과 조일무역규칙(양곡 유출 허용·무관세)을 맺었다. 1883 조일통상장정으로 관세와 방곡령 규정이 들어갔고, 1889 함경도·황해도에서 방곡령을 내렸다.')],
         next=('강화도 조약 뒤 정부는 새 제도와 기술을 들여오는 개화 정책을 서둘렀다.', False), next_part=True),
    dict(id='gaehwa-policy', art=('p', 4), mods=['O06'], tier='core', label='2부 · 개화 정책', title='개화 정책과 위정척사',
         reign=('26대 고종', '재위 1863–1907'), kings=(26, 26), year=1880, when='1880 통리기무아문 · 1881 별기군 · 조사 시찰단 · 영선사 · 영남 만인소',
         alt='관리와 선비들이 문서를 들고 논쟁하는 장면(조정 회의 개념 그림)',
         a=('개화 관리', '개화 정책 설명', '통리기무아문을 두고 신식 군대 별기군을 만들었소.'), b=('이만손', '영남 만인소를 올린 유생', '성리학 질서를 지키자! 미국과의 수교에 반대합니다.'),
         learn=[('통리기무아문 · 별기군', '개화 정책을 총괄할 기구를 두고, 신식 군대 별기군을 만들었다.'),
                ('영선사 · 기기창', '청에 유학생과 기술자를 보냈고, 돌아와 무기 공장 기기창을 세웠다.'),
                ('위정척사 · 영남 만인소', '성리학 질서를 지키려는 유생들이 개화 정책과 미국 수교 논의에 반대했다.')],
         steps=[('배경', 'cause', '강화도 조약으로 나라 문이 열리자 새 제도와 기술을 배울 필요가 커졌다.'),
                ('전개', 'dev', '통리기무아문과 12사를 두어 개화 정책을 총괄하고, 5군영을 2영으로 줄이며 신식 군대 별기군을 만들었다. 일본에 수신사와 조사 시찰단을, 청에 영선사를 보냈다(돌아와 기기창 설립).'),
                ('결과', 'res', '성리학 질서를 지키려는 위정척사 운동이 맞섰다. 1881 이만손 등은 영남 만인소로 조선책략과 미국 수교 논의에 반대했다.'),
                ('앞서', 'item', '최익현은 1876 강화도 조약 때 왜양일체론을 내세워 조약에 반대했다.')],
         key=['통리기무아문', '별기군', '영선사 · 기기창', '위정척사 · 영남 만인소', '최익현 · 왜양일체론'],
         next=('1882년, 조선책략을 계기로 서양 나라와 처음 조약을 맺었다.', False)),
    dict(id='scene-4', art=('p', 3), art_note='그림: 강화도 조약 장면과 같은 조약 체결 개념 그림을 다시 썼어요.', mods=['O05'], tier='core', label='2부 · 서양과의 첫 조약', title='1882년, 조미수호통상조약',
         reign=('26대 고종', '재위 1863–1907'), kings=(26, 26), year=1882, when='1882 조미수호통상조약 · 보빙사',
         alt='조선 관리가 외국 해군 장교 앞에서 조약문에 서명하는 장면(강화도 조약 장면 그림 다시 사용)',
         a=('신헌', '조선 측 대표', '다른 나라에 준 유리한 조건을 미국에도 똑같이 준다는 말이오?'), b=('슈펠트', '미국 측 대표','그렇소. 관세를 인정하고, 다른 나라와 분쟁이 생기면 조정에 나서기로 합시다.'),
         learn=[('조미수호통상조약 (1882)', '조선책략을 계기로 서양 나라와 처음 맺은 조약이다.'),
                ('최혜국 대우 · 관세', '남에게 준 유리한 조건을 미국에도 주는 조항이 처음 들어갔고, 관세도 처음 인정했다.'),
                ('거중 조정', '다른 나라와 분쟁이 생기면 조정·중재에 나선다는 조항이다.')],
         steps=[('배경', 'cause', '1880 2차 수신사 김홍집이 가져온 조선책략은 러시아를 막으려면 청과 친하고, 일본과 맺고, 미국과 연합하라고 권했다.'),
                ('전개', 'dev', '1882 서양 나라와 처음으로 조미수호통상조약을 맺었다. 최혜국 대우를 처음 규정하고, 처음으로 관세를 인정했으며, 거중 조정 조항(다른 나라와 분쟁이 생기면 조정·중재에 나섬)을 넣었다.'),
                ('결과', 'res', '조약 뒤 미국에 보빙사를 보냈다. 이어 영국·독일·러시아 등과도 조약을 맺었다.')],
         key=['조선책략 · 김홍집', '조미수호통상조약', '최혜국 대우', '관세', '거중 조정'],
         more=[('흐름 보충 · 프랑스와의 조약', '프랑스와는 다른 나라보다 늦게(1886) 조약을 맺었고, 천주교 포교를 인정했다.')],
         next=('같은 해 1882년, 차별받던 구식 군인들이 들고일어났다.', False)),
    dict(id='scene-5', art=('p', 5), mods=['O07'], tier='core', label='2부 · 임오군란', title='1882년, 구식 군인의 봉기',
         reign=('26대 고종', '재위 1863–1907'), kings=(26, 26), year=1882, when='1882 임오군란 → 제물포 조약 · 조청상민수륙무역장정',
         alt='머리띠를 두른 군인들이 무기를 들고 일어나는 장면(봉기 개념 그림)',
         a=('구식 군인', '봉기에 나선 군인', '열석 달 밀린 급료라며 준 쌀에 모래가 섞였다!'), b=('관리', '결과 보고', '청군이 들어와 진압하고 흥선대원군을 청으로 데려갔습니다.'),
         learn=[('임오군란 (1882)', '차별받던 구식 군인이 일으킨 봉기를 청군이 들어와 진압했다.'),
                ('제물포 조약 · 조청상민수륙무역장정', '일본과는 공사관 경비군 주둔을, 청과는 청 상인의 상점 개설을 허용하는 조약을 맺었다.')],
         steps=[('배경', 'cause', '신식 군대 별기군과 달리 구식 군인은 차별받았고, 13개월이나 밀린 급료로 받은 쌀에는 모래와 겨가 섞여 있었다.'),
                ('전개', 'dev', '1882 구식 군인이 들고일어나 별기군 일본인 교관을 죽이고 일본 공사관을 습격했다. 청군이 들어와 진압했다.'),
                ('결과', 'res', '청은 마젠창과 묄렌도르프를 보내 내정에 간섭했다. 일본과는 제물포 조약(공사관 경비 일본군 주둔)을, 청과는 조청상민수륙무역장정(청 상인의 한성 상점 개설)을 맺었다.')],
         key=['임오군란', '제물포 조약', '조청상민수륙무역장정'],
         next=('청의 간섭이 심해지자, 2년 뒤 1884년 급진 개화파가 정변을 일으켰다.', False)),
    dict(id='scene-6', art=('p', 6), mods=['O07', 'O08'], tier='core', label='2부 · 갑신정변', title='1884년, 3일 만에 끝난 정변',
         reign=('26대 고종', '재위 1863–1907'), kings=(26, 26), year=1884, when='1884 갑신정변 → 한성 조약 · 1885 톈진 조약',
         alt='서양식 군복을 입은 군인들이 궁궐 계단에 늘어선 장면(정변 개념 그림)',
         a=('김옥균', '급진 개화파', '우정총국 개국 축하연에서 일을 일으킵시다.'), b=('동료 개화파', '걱정을 말함', '청군이 개입하면 버티기 어렵소.'),
         learn=[('갑신정변 · 김옥균', '급진 개화파가 우정총국 개국 축하연에서 일으킨 정변으로, 청군의 개입으로 3일 만에 실패했다.'),
                ('한성 조약 · 톈진 조약', '일본에는 배상을 하고, 청과 일본은 조선에 군대를 보낼 때 서로 알리기로 했다.')],
         steps=[('배경', 'cause', '임오군란 뒤 청의 간섭이 심해지자, 김옥균·홍영식 등 급진 개화파는 일본처럼 빠른 개혁을 원했다.'),
                ('전개', 'dev', '1884 우정총국 개국 축하연에서 정변을 일으켰지만, 청군이 개입해 3일 만에 실패했다.'),
                ('결과', 'res', '일본과는 한성 조약(배상)을, 청과 일본은 1885 톈진 조약(조선에 군대를 보낼 때 서로 알리기)을 맺었다.'),
                ('그 뒤', 'item', '1885–1887 영국이 러시아를 견제하려 거문도를 불법 점령했다(거문도 사건). 이 무렵 유길준 등은 조선 중립화론을 내놓았다.')],
         key=['갑신정변 · 김옥균', '우정총국', '한성 조약 · 톈진 조약'],
         more=[('먼저 기억 · 끝난 뒤 맺은 조약', '임오군란 → 제물포 조약(일본) · 조청상민수륙무역장정(청) / 갑신정변 → 한성 조약(일본) · 톈진 조약(청·일).')],
         next=('갑신정변 10년 뒤인 1894년, 전라도 고부에서 농민이 일어났다.', False)),
    dict(id='scene-7', part=('part-3', '3부 · 1894–1910', '동학 농민 운동과 갑오개혁에서 국권 피탈까지'), art=('p', 7), mods=['O09'], tier='core', label='3부 · 동학 농민 운동', title='1894년, 고부에서 전주성까지',
         reign=('26대 고종', '재위 1863–1907'), kings=(26, 26), year=1894, when='1894 고부 봉기 → 1차 봉기(황토현·황룡촌) → 전주성 점령 → 전주 화약·집강소',
         alt='흰 깃발 아래 농민들 앞에서 외치는 지도자(동학 농민군 개념 그림 · 특정 인물의 초상이 아님)',
         a=('전봉준', '동학 농민군 지도자', '나라를 돕고 백성을 편안하게 하자!'), b=('농민', '농민군 참여자', '황토현에 이어 황룡촌에서도 이겼소!'),
         learn=[('고부 봉기 · 전봉준', '고부 군수 조병갑의 수탈에 맞서 전봉준 등이 들고일어났다.'),
                ('황토현 · 황룡촌', '1차 봉기에서 관군을 이기고 전주성까지 점령했다.'),
                ('전주 화약 · 집강소', '정부와 화약을 맺고, 농민군이 전라도 곳곳에 자치 기구 집강소를 두었다.')],
         steps=[('배경', 'cause', '1860 최제우가 창시한 동학이 퍼져 있었다. 1894 고부 군수 조병갑의 수탈에 맞서 전봉준 등이 봉기했고, 조사하러 온 안핵사 이용태가 오히려 농민을 탄압했다.'),
                ('전개', 'dev', '1차 봉기에서 보국안민·제폭구민을 내세워 황토현·황룡촌 전투에서 이기고 전주성을 점령했다.'),
                ('결과', 'res', '정부와 전주 화약을 맺고, 전라도 곳곳에 자치 기구 집강소를 두어 폐정 개혁을 실천했다.')],
         key=['고부 · 조병갑 · 이용태', '황토현 · 황룡촌', '전주 화약 · 집강소'],
         next=('같은 1894년, 정부가 청에 군대를 요청하자 일본도 군대를 보냈다.', False)),
    dict(id='gyeongbok-1894', art=('p', 9),mods=['O09', 'O10'], tier='core', label='3부 · 경복궁 점령과 청일 전쟁', title='일본군이 궁궐을 차지하다',
         reign=('26대 고종', '재위 1863–1907'), kings=(26, 26), year=1894, when='1894 일본군의 경복궁 점령 → 청일 전쟁',
         alt='불타는 궁궐 문 앞에서 총을 든 군인들과 쓰러진 사람들(점령·전쟁 개념 그림 · 특정 사건의 실제 장면이 아님)',
         a=('관리', '상황 보고', '일본군이 경복궁을 점령했습니다!'), b=('다른 관리', '앞일 설명', '곧 청과 일본이 이 땅에서 전쟁을 벌일 것이오.'),
         learn=[('경복궁 점령 · 청일 전쟁', '농민군의 전주성 점령 뒤 청·일이 군대를 보냈고, 일본군이 궁궐을 차지한 뒤 청과 전쟁을 벌였다.'),
                ('개혁과 2차 봉기로 이어짐', '일본의 영향 아래 개혁이 시작되었고, 외세 간섭에 맞서 농민군은 다시 일어날 준비를 했다.')],
         steps=[('배경', 'cause', '농민군이 전주성을 점령하자 정부는 청에 군대를 요청했고, 일본도 갑신정변 뒤 맺은 톈진 조약을 구실로 군대를 보냈다.'),
                ('전개', 'dev', '일본군이 경복궁을 점령하고 청일 전쟁을 일으켰다.'),
                ('결과', 'res', '일본의 영향 아래 군국기무처가 개혁을 시작했고, 농민군은 외세를 몰아내려 다시 일어날 준비를 했다.')],
         key=['경복궁 점령', '청일 전쟁'],
         next=('같은 1894년 여름, 정부 안에서는 군국기무처가 개혁을 시작했다.', False)),
    dict(id='scene-8', art=('p', 4), art_note='그림: 개화 정책 장면과 같은 조정 회의 개념 그림을 다시 썼어요.', mods=['O10'], tier='core', label='3부 · 1차 갑오개혁', title='군국기무처의 1차 갑오개혁',
         reign=('26대 고종', '재위 1863–1907'), kings=(26, 26), year=1894, when='1894 군국기무처 · 1차 갑오개혁',
         alt='관리와 선비들이 문서를 들고 논쟁하는 장면(개화 정책 장면 그림 다시 사용)',
         a=('관리', '개혁 논의', '갑신정변의 요구와 농민군의 개혁안까지 모아 개혁합시다.'), b=('다른 관리', '개혁 논의', '과거제와 공사 노비제부터 없애야 하오.'),
         learn=[('군국기무처', '1차 갑오개혁을 이끈 기구로, 갑신정변과 농민군의 개혁 요구도 반영했다.'),
                ('과거제 폐지 · 공사 노비제 폐지', '과거 시험과 신분에 따른 노비 제도를 없앤 것이 1차 개혁의 핵심이다.')],
         steps=[('배경', 'cause', '경복궁 점령 뒤 군국기무처가 개혁을 맡았다. 갑신정변의 요구와 농민군의 폐정 개혁안 등이 반영되었다.'),
                ('전개', 'dev', '과거제를 없애고 공사 노비제를 폐지했으며, 과부 재가 금지·연좌제 같은 옛 관습도 없앴다.'),
                ('관제', 'item', '6조를 8아문으로 바꾸었다.')],
         key=['군국기무처', '공사 노비제 폐지', '과거제 폐지'],
         next=('그사이 1894년 가을, 농민군이 외세를 몰아내려 다시 일어났다.', False)),
    dict(id='ugeumchi-1894', art=('p', 7),art_note='그림: 1차 봉기 장면과 같은 농민군 개념 그림을 다시 썼어요.', mods=['O09'], tier='core', label='3부 · 2차 봉기', title='우금치에서 멈춘 농민군',
         reign=('26대 고종', '재위 1863–1907'), kings=(26, 26), year=1894, when='1894 2차 봉기 → 논산 합류 → 우금치 전투 → 전봉준 체포',
         alt='흰 깃발 아래 농민들 앞에서 외치는 지도자(1차 봉기 장면 그림 다시 사용)',
         a=('농민군', '2차 봉기 참여자', '이번에는 일본을 몰아내자!'), b=('다른 농민군', '2차 봉기 참여자', '남접과 북접이 논산에서 합쳤소.'),
         learn=[('2차 봉기 · 우금치', '외세를 몰아내려 다시 일어난 농민군이 공주 우금치에서 일본군과 관군에 패했다.'),
                ('전봉준 체포', '지도자 전봉준이 붙잡히면서 동학 농민 운동이 끝났다.')],
         steps=[('배경', 'cause', '일본군의 경복궁 점령과 청일 전쟁으로 외세의 간섭이 커졌다.'),
                ('전개', 'dev', '농민군이 다시 일어나(2차 봉기) 남접과 북접이 논산에서 합류해 북상했다.'),
                ('결과', 'res', '공주 우금치 전투에서 일본군과 관군에 패했고, 전봉준이 체포되면서 동학 농민 운동은 끝났다.')],
         key=['2차 봉기', '우금치', '전봉준 체포'],
         next=('청일 전쟁에서 일본이 우세해지자, 박영효가 합류한 내각이 2차 개혁을 시작했다.', False)),
    dict(id='hongbeom-1894', art=('p', 8),mods=['O10'], tier='core', label='3부 · 2차 갑오개혁', title='홍범 14조와 교육 입국 조서',
         reign=('26대 고종', '재위 1863–1907'), kings=(26, 26), year=1894, when='1894–1895 홍범 14조 · 교육 입국 조서 · 23부',
         alt='지도와 기차 모형, 지구본이 놓인 책상에서 개혁을 논의하는 관리들(근대 개혁 개념 그림)',
         a=('고종', '조선의 국왕 · 홍범 14조 반포','청에서 독립한 나라임을 밝히고 홍범 14조를 반포하노라.'), b=('관리', '개혁 실행 보고', '학교를 세우고, 8도를 23부로 고치겠습니다.'),
         learn=[('홍범 14조', '고종이 청에서 독립한 나라임을 밝히며 반포한 2차 갑오개혁의 방향이다.'),
                ('교육 입국 조서', '근대 교육을 선언해 한성 사범 학교 같은 근대 학교를 세우게 했다.'),
                ('23부 · 재판소', '8도를 23부로 바꾸고, 근대적 재판소를 두었다.')],
         steps=[('배경', 'cause', '청일 전쟁에서 일본이 우세해지자 김홍집·박영효 연립 내각이 개혁을 이어 갔다.'),
                ('전개', 'dev', '고종이 종묘에서 독립 서고문을 바치고 홍범 14조를 반포했다. 교육 입국 조서를 내려 한성 사범 학교 등 근대 학교를 세웠다.'),
                ('행정', 'item', '8도를 23부로 바꾸고, 근대적 재판소를 두었다.')],
         key=['홍범 14조', '교육 입국 조서', '23부 · 재판소'],
         more=[('먼저 기억 · 1차와 2차 가르기', '1차 = 군국기무처 · 과거제·공사 노비제 폐지 / 2차 = 홍범 14조 · 교육 입국 조서 · 23부 · 재판소. 강의는 군국기무처와 공사 노비제 폐지를 먼저 외우라고 했다.')],
         next=('청일 전쟁 뒤 1895년, 일본의 세력이 흔들리자 궁궐에서 큰일이 일어났다.', False)),
    dict(id='scene-9', art=('new', 'eulmi'), mods=['O11'], tier='core', label='3부 · 을미사변과 을미개혁', title='1895년, 을미사변과 단발령',
         reign=('26대 고종', '재위 1863–1907'), kings=(26, 26), year=1895, when='1895 삼국 간섭 · 을미사변 · 을미개혁 → 1896 아관 파천',
         alt='관청 앞에서 상투를 자르라고 알리는 관리와 망설이는 선비, 벽의 양력 달력(을미개혁 개념 그림)',
         a=('관리', '단발령 알림', '단발령이 내려졌으니 상투를 자르시오.'), b=('선비', '단발령에 반발', '부모에게 받은 머리털을 자를 수는 없소!'),
         learn=[('을미사변', '삼국 간섭 뒤 러시아와 가까워진 명성 왕후를 일본이 시해했다.'),
                ('을미개혁', '단발령을 내리고 태양력을 쓰며, 건양 연호를 정하고 친위대·진위대를 두었다.'),
                ('을미의병 · 아관 파천', '단발령에 반발한 의병이 일어났고, 고종이 러시아 공사관으로 옮기며 개혁이 멈췄다.')],
         steps=[('배경', 'cause', '청일 전쟁 뒤 러시아·프랑스·독일의 삼국 간섭으로 일본이 요동반도를 돌려주자, 명성 왕후 쪽은 러시아와 가까워졌다.'),
                ('전개', 'dev', '1895 일본이 명성 왕후를 시해했다(을미사변). 이어 을미개혁으로 단발령을 내리고 태양력을 쓰며 친위대·진위대를 두었고, 건양 연호를 정했다(1896년부터 사용).'),
                ('결과', 'res', '을미사변과 단발령에 반발한 을미의병이 일어났다. 1896 고종이 러시아 공사관으로 옮기면서(아관 파천) 을미개혁은 중단되었다.')],
         key=['을미사변', '단발령 · 태양력', '건양', '을미의병', '아관 파천'],
         next=('아관 파천 시기에, 서재필이 독립신문을 펴내고 독립협회도 만들어졌다.', False)),
    dict(id='independence-club', art=('new', 'club'), mods=['O12'], tier='support', label='3부 · 독립협회', title='독립신문과 만민 공동회',
         reign=('26대 고종', '재위 1863–1907'), kings=(26, 26), year=1896, when='1896 독립신문 발행 · 독립협회 창립 · 독립문 건립 추진',
         alt='독립문 앞 광장에 모인 시민들 앞에서 신문을 들고 연설하는 사람(독립협회 개념 그림)',
         a=('서재필', '독립신문 발행', '독립신문을 내고, 독립문 건립도 추진합시다.'), b=('시민', '공동회 참가자', '관민 공동회에서 헌의 6조를 결의했소!'),
         learn=[('독립신문 · 독립협회', '서재필이 독립신문을 먼저 냈고, 같은 해 독립협회가 창립되어 독립문 건립을 추진했다.'),
                ('관민 공동회 · 헌의 6조', '관리도 참여한 관민 공동회에서 개혁안 헌의 6조를 결의했다.'),
                ('독립협회 해산', '고종이 황국협회를 동원해 독립협회를 해산시켰다.')],
         steps=[('배경', 'cause', '아관 파천 뒤 러시아 등 열강의 이권 요구가 커졌다.'),
                ('전개', 'dev', '1896 서재필이 독립신문을 발행했다. 같은 해 서재필 등이 독립협회를 창립해 독립문 건립을 추진했고, 러시아의 절영도 조차 요구에 반대했다.'),
                ('결과', 'res', '1898 만민 공동회를 열고, 관민 공동회에서 헌의 6조를 결의했다. 중추원을 의회로 바꾸려 했지만, 고종은 황국협회를 동원해 독립협회를 해산시켰다.')],
         key=['서재필 · 독립신문', '독립협회 · 독립문 건립 추진', '만민 공동회', '관민 공동회 · 헌의 6조'],
         next=('독립협회가 활동하던 사이, 고종은 러시아 공사관에서 돌아와 황제로 즉위했다.', False)),
    dict(id='scene-10', art=('p', 10), mods=['O13', 'O14'], tier='core', label='3부 · 대한제국', title='1897년, 황제의 나라',
         reign=('26대 고종 · 대한제국 황제', '재위 1863–1907 · 황제 1897–1907'), kings=(26, 26), year=1897, when='1897 대한제국 선포 · 환구단 황제 즉위 · 1899 대한국 국제 · 광무개혁',
         scope='주제별 정리 · 독립협회와 같은 시기의 다른 흐름이에요. 앞 장면의 1898년보다 이른 1897년으로 시간이 돌아가요.',
         alt='노란 곤룡포를 입은 황제 뒤로 서양식 건물·전신주·기차가 보이는 장면(대한제국 개념 그림 · 실제 초상이 아님)',
         a=('고종', '대한제국 황제', '환구단에서 황제로 즉위하고, 나라 이름을 대한제국이라 하노라.'), b=('관리', '개혁 실행 보고', '구본신참에 따라 원수부를 두고 지계를 발급하겠습니다.'),
         learn=[('대한제국 · 환구단', '고종이 환구단에서 황제로 즉위하고 국호를 대한제국, 연호를 광무로 정했다.'),
                ('광무개혁 · 구본신참', '옛것을 바탕으로 새것을 받아들인다는 원칙으로 최고 군사 기구 원수부를 두고 지계를 발급했다.')],
         steps=[('배경', 'cause', '1897 고종이 러시아 공사관에서 경운궁으로 돌아왔다.'),
                ('전개', 'dev', '환구단에서 황제로 즉위해 국호를 대한제국, 연호를 광무로 정했다(1863년 왕위 즉위와 다른, 황제 즉위). 1899 대한국 국제로 황제권을 밝혔다.'),
                ('광무개혁', 'item', '구본신참(옛것을 바탕으로 새것을 받아들임)을 내세워 황제 직속 최고 군사 기구인 원수부를 두어 황제가 군을 통솔하고, 양전 사업으로 토지를 재어 지계(근대적 토지 소유 증명서)를 발급했다.'),
                ('같은 때', 'item', '1898 황국 중앙 총상회가 상권 수호에 나섰고, 1899 전차와 경인선 철도가 개통되었다.')],
         key=['대한제국 · 환구단', '구본신참', '원수부', '지계'],
         more=[('선택 심화 · 용암포 사건', '1903 러시아가 압록강 하구의 용암포를 빌리려다 일본의 반대로 무산되었고, 러시아와 일본의 사이가 더 나빠졌다.')],
         next=('정치 흐름은 여기서 잠시 멈추고, 같은 시기에 들어온 근대 문물을 주제별로 모아 봐요(시기가 겹쳐요).', False)),
    dict(id='advisers-1904', art=('new', 'war1904'),mods=['O15'], tier='core', label='3부 · 러일 전쟁', title='1904년, 고문 정치가 시작되다',
         reign=('26대 고종 · 대한제국 황제', '재위 1863–1907 · 황제 1897–1907'), kings=(26, 26), year=1904, when='1904 러일 전쟁 · 한일 의정서 · 제1차 한일 협약 → 1905 화폐 정리 사업',
         alt='멀리 항구의 군함과, 화폐 교환 창구 앞에서 근심하는 상인들(러일 전쟁·화폐 정리 개념 그림)',
         a=('대한제국 관리', '상황 설명', '중립을 선언했는데도 일본군이 들어왔소.'), b=('상인', '화폐 정리 피해', '가진 백동화를 제값에 바꿔 주지 않는다니!'),
         learn=[('한일 의정서', '러일 전쟁 중 일본이 군사 기지로 쓸 땅을 차지할 수 있게 했다.'),
                ('제1차 한일 협약 · 고문 정치', '일본이 추천한 외교 고문 스티븐스와 재정 고문 메가타가 내정에 간섭했다.'),
                ('화폐 정리 사업', '메가타가 백동화 등을 제일은행권으로 바꾸게 해 한국 상인이 큰 피해를 입었다.')],
         steps=[('배경', 'cause', '용암포 문제 등으로 맞서던 러시아와 일본 사이에 1904 러일 전쟁이 일어났다. 대한제국은 중립을 선언했다.'),
                ('전개', 'dev', '일본은 한일 의정서로 군사 기지로 쓸 땅을 차지하고, 제1차 한일 협약으로 고문 정치를 시작했다(외교 고문 스티븐스, 재정 고문 메가타).'),
                ('결과', 'res', '메가타의 화폐 정리 사업(1905)으로 백동화 등을 제일은행권으로 바꾸면서 한국 상인들이 큰 피해를 입었다.'),
                ('같은 때', 'item', '1904 보안회가 일본의 황무지 개간권 요구를 막아 냈다. 1905 일본은 독도를 불법 편입했다.')],
         key=['한일 의정서', '제1차 한일 협약 · 고문 정치', '화폐 정리 사업'],
         next=('러일 전쟁에서 이긴 일본은 1905년 대한제국의 외교권을 빼앗았다.', False)),
    dict(id='scene-11', art=('p', 11), mods=['O16'], tier='core', label='3부 · 을사늑약', title='1905년, 외교권을 빼앗기다',
         reign=('26대 고종 · 대한제국 황제', '재위 1863–1907 · 황제 1897–1907'), kings=(26, 26), year=1905, when='1905 을사늑약 → 1906 통감부',
         alt='일본 장교들에게 둘러싸인 채 조약문에 서명하는 관리(강요된 조약 개념 그림)',
         a=('이토 히로부미', '일본 측 · 조약 강요','이제 외교는 통감부가 맡는다.'), b=('고종', '대한제국 황제', '나는 국새를 찍지 않았으니 무효요!'),
         learn=[('을사늑약 · 외교권', '러일 전쟁에서 이긴 일본이 대한제국의 외교권을 빼앗았다.'),
                ('통감부', '을사늑약 뒤 설치되어 초대 통감 이토 히로부미가 대한제국을 간섭했다.'),
                ('시일야방성대곡 · 을사의병', '장지연은 늑약을 비판하는 논설을 싣고, 신돌석·최익현 등은 의병을 일으켰다.')],
         steps=[('배경', 'cause', '러일 전쟁에서 이긴 일본이 대한제국의 외교권을 노렸다.'),
                ('전개', 'dev', '1905 을사늑약으로 외교권을 빼앗고, 1906 통감부를 두었다(초대 통감 이토 히로부미). 고종은 국새를 찍지 않았다며 무효를 주장했다.'),
                ('결과', 'res', '민영환은 자결하고, 장지연은 황성신문에 시일야방성대곡을 실었다. 신돌석·최익현 등이 을사의병을 일으켰다.')],
         key=['을사늑약 · 외교권', '통감부', '시일야방성대곡', '을사의병'],
         next=('1907년, 고종은 을사늑약이 무효임을 알리려 헤이그에 특사를 보냈다.', False)),
    dict(id='scene-12', art=('p', 12), mods=['O17'], tier='core', label='3부 · 고종 퇴위와 군대 해산', title='1907년, 군대가 해산되다',
         reign=('26대 고종 → 27대 순종', '고종 재위 1863–1907 · 순종 재위 1907–1910'), kings=(26, 27), year=1907, when='1907 헤이그 특사 → 고종 강제 퇴위·순종 즉위 → 정미 7조약·군대 해산 → 1908 서울 진공 작전',
         alt='산속 바위 뒤에서 총을 든 의병들과 태극기(의병 개념 그림 · 특정 전투의 실제 장면이 아님)',
         a=('해산 군인', '의병에 합류', '군대가 해산되어도 총을 놓지 않겠다!'), b=('이인영', '13도 창의군 총대장','13도 창의군을 이루어 서울로 나아갑시다.'),
         learn=[('헤이그 특사 → 고종 강제 퇴위', '을사늑약의 무효를 알리려 한 특사를 구실로 일본이 고종을 물러나게 했고, 27대 순종이 즉위했다.'),
                ('정미 7조약 · 군대 해산', '차관을 일본인으로 채우고 대한제국 군대를 해산했다.'),
                ('정미의병 · 13도 창의군', '해산 군인이 합류해 의병이 커졌고, 13도 창의군이 서울 진공 작전을 벌였다.')],
         steps=[('배경', 'cause', '고종이 을사늑약의 무효를 알리려 헤이그 만국 평화 회의에 특사를 보냈다.'),
                ('전개', 'dev', '일본은 이를 구실로 1907 고종을 강제로 물러나게 했고, 27대 순종이 즉위했다. 이어 한일 신협약(정미 7조약)으로 차관을 일본인으로 채우고 대한제국 군대를 해산했다.'),
                ('결과', 'res', '해산된 군인이 합류한 정미의병이 13도 창의군을 이뤄 1908 서울 진공 작전을 벌였지만 패했고, 1909 이른바 남한 대토벌로 크게 약해졌다.')],
         key=['헤이그 특사', '고종 강제 퇴위 · 27대 순종', '정미 7조약 · 군대 해산', '정미의병 · 13도 창의군'],
         next=('의병이 탄압받는 가운데 1909년, 일본은 사법권마저 빼앗았다.', False)),
    dict(id='annexation-1910', art=('p', 11),art_note='그림: 을사늑약 장면과 같은 강요된 조약 개념 그림을 다시 썼어요.', mods=['O18'], tier='support', label='3부 · 국권 피탈', title='1910년, 나라를 빼앗기다',
         reign=('27대 순종', '재위 1907–1910'), kings=(27, 27), year=1909, when='1909 기유각서 → 1910 경찰권 위탁 → 1910 국권 피탈',
         alt='일본 장교들에게 둘러싸인 채 조약문에 서명하는 관리(을사늑약 장면 그림 다시 사용)',
         a=('관리', '상황 설명', '사법권에 이어 경찰권까지 넘겨주라는 말이오?'), b=('다른 관리', '결과 설명', '결국 나라의 주권까지 빼앗겼소.'),
         learn=[('기유각서 · 경찰권', '사법권과 감옥 사무에 이어 경찰권까지 차례로 빼앗겼다.'),
                ('국권 피탈', '한국 병합 조약으로 대한제국이 나라를 잃었다.')],
         steps=[('배경', 'cause', '정미 7조약 뒤 일본이 대한제국의 행정을 장악해 갔다.'),
                ('전개', 'dev', '1909 기유각서로 사법권과 감옥 사무를, 1910 경찰권을 빼앗았다.'),
                ('결과', 'res', '1910 한국 병합 조약으로 국권을 빼앗겼다(국권 피탈). 조선 왕조와 대한제국의 역사가 끝났다.'),
                ('같은 때', 'item', '1908 장인환·전명운이 스티븐스를, 1909 안중근이 하얼빈에서 이토 히로부미를 처단했다(안중근은 감옥에서 동양평화론을 썼다).')],
         key=['기유각서 · 사법권', '경찰권', '국권 피탈'],
         next=('나라를 빼앗기기까지 같은 시기에 이어진 저항을 주제별로 모아 봐요(앞 장면들과 시기가 겹쳐요).', False)),
    dict(id='national-defense', part=('part-4', '주제별 정리 · 1880년대–1910', '나라를 지키려는 운동과 새로운 문물'), art=('new', 'debt'), mods=['O19'], tier='core', label='주제별 정리 · 국권 수호 운동 (1904–1910)', title='빚을 갚고, 사람을 키우고',
         reign=TOPIC_REIGN, kings=None, year=None, when='여러 해에 걸친 정리 · 보안회 · 국채보상운동 · 대한자강회 · 신민회',
         alt='신문사 앞 모금함에 사람들이 성금을 내는 모습(국채보상운동 개념 그림)',
         a=('대구 시민', '모금 참여자', '나라 빚 1300만 원을 우리 손으로 갚읍시다.'), b=('기자', '신문의 지원 설명', '대한매일신보가 성금 낸 사람의 이름을 싣고 있소.'),
         learn=[('국채보상운동', '대구에서 김광제·서상돈이 시작했고, 양기탁·베델의 대한매일신보가 적극 지원했다.'),
                ('신민회', '안창호 등이 공화정의 근대 국가를 목표로 만든 비밀 결사로, 대성학교·오산학교를 세웠다.'),
                ('보안회 · 대한자강회', '보안회는 황무지 개간권 요구를 막았고, 대한자강회는 고종 강제 퇴위에 반대했다.')],
         steps=[('보안회', 'item', '1904 일본의 황무지 개간권 요구를 막아 냈다.'),
                ('경제', 'item', '1907 대구에서 김광제·서상돈이 국채보상운동을 시작했고, 양기탁과 베델이 발행한 대한매일신보가 운동을 적극 지원했다.'),
                ('대한자강회', 'item', '헌정 연구회를 이어 만든 단체로, 고종 강제 퇴위 반대 운동을 벌였다.'),
                ('신민회', 'item', '1907 안창호 등이 만든 비밀 결사로, 공화정의 근대 국가를 목표로 대성학교·오산학교와 태극서관을 세웠다.')],
         key=['보안회', '국채보상운동 · 대한매일신보', '대한자강회', '신민회'],
         more=[('다음 시대 미리 보기 · 105인 사건', '국권 피탈 뒤인 1911 일제가 총독 암살 모의를 꾸며 내 신민회 인사들을 처벌했고(105인 사건), 신민회는 와해되었다. 일제 강점기에서 다시 다룬다.'),
               ('흐름 보충 · 동양 척식 주식회사', '1908 일제가 세운 동양 척식 주식회사가 토지와 자원을 빼앗는 역할을 했다.')],
         next=None),
    dict(id='modern-culture', art=('p', 10), art_note='그림: 대한제국 장면과 같은 그림(서양식 건물·전신주·기차)을 근대 시설 개념 그림으로 다시 썼어요.', mods=['O20', 'O21', 'O22'], tier='support', label='주제별 정리 · 근대 문물 (1880년대–1910)', title='신문·학교·병원·전차',
         reign=TOPIC_REIGN, kings=None, year=None, when='여러 해에 걸친 정리 · 신문 · 학교 · 병원 · 교통',
         alt='노란 곤룡포의 황제 뒤로 서양식 건물·전신주·기차가 보이는 장면(대한제국 장면 그림 다시 사용 · 근대 시설 개념)',
         a=('기자', '신문 소개', '박문국에서 첫 근대 신문 한성순보를 냈소.'), b=('학생', '학교·교통 소개', '원산학사와 육영공원이 생겼고, 전차도 달려요.'),
         learn=[('박문국 · 한성순보', '정부 기관 박문국이 우리나라 첫 근대 신문 한성순보를 냈다.'),
                ('원산학사 · 육영공원', '원산학사는 첫 근대 학교이고, 육영공원은 헐버트 등 외국인이 가르친 관립 학교다.'),
                ('전차 · 경인선', '1899 서울에 전차가 달리고, 첫 철도인 경인선이 개통되었다.')],
         steps=[('신문', 'item', '한성순보(1883 · 순한문 · 열흘마다) → 한성주보(국한문 · 첫 상업 광고) → 독립신문(서재필 · 한글판·영문판) → 황성신문(국한문)·제국신문(순한글) → 대한매일신보(양기탁·베델)'),
                ('학교', 'item', '원산학사(1883 첫 근대 학교) · 육영공원(관립, 헐버트 등 외국인 교사) · 2차 갑오개혁 때 교육 입국 조서로 관립 학교 설립'),
                ('병원·통신', 'item', '광혜원 → 제중원(알렌) · 우정총국(1884) · 전신'),
                ('교통·건물', 'item', '1899 전차·경인선 개통 · 1905 경부선 · 명동 성당(1898) · 원각사 · 덕수궁 석조전(1910)')],
         key=['박문국 · 한성순보', '원산학사 · 육영공원', '광혜원 → 제중원', '전차 · 경인선'],
         more=[('선택 심화 · 종교와 국학', '손병희가 동학을 천도교로 개편하고 만세보를 냈다. 나철은 대종교를, 박은식은 유교 구신론을, 한용운은 조선 불교 유신론을 내세웠다. 주시경은 국문 연구소에서 한글을 연구했고, 신채호는 대한매일신보에 독사신론을 연재했다.'),
               ('선택 심화 · 인물', '박규수(제너럴셔먼호 때 평안도 관찰사) · 김홍집(조선책략 · 갑오개혁 · 아관 파천 때 피살) · 유길준(서유견문 · 중립화론) · 헐버트(육영공원 교사 · 헤이그 특사를 도움) · 베델(대한매일신보)')],
         next=('다시 정치 흐름으로: ③ 나라를 지키자는 1904년 러일 전쟁부터 이어져요.', False), next_part=True),
]

OPENING_CSS = ('<style id="hanq-opening-story">/* 개화기: 제목·왕 줄 → 그림(SVG 칸 전체·원비율) → 그림 밖 말풍선 → 배경→전개→결과 → 이 컷 핵심 → (덩어리 끝) 이 부분에서 외울 것 → 다음 사건 잇기 */'
               '.o-story{--o-nav-h:' + str(NAV_H) + 'px}'
               '.o-story .scene{padding:0 0 22px;opacity:1!important;transform:none!important;content-visibility:visible!important}'
               # 고정 바로 가기 줄(높이 고정) 아래로 장면·부 머리가 오도록: 앵커 이동·scrollIntoView 모두 scroll-margin을 따른다
               '.o-story .scene,.o-story .o-part,.o-story .bridge{scroll-margin-top:calc(var(--o-nav-h) + 8px)}'
               # 홈 버튼(고정, 오른쪽 위)이 바로 가기 줄 안에 놓이도록: 줄 오른쪽을 비우고, 가로 스크롤은 안쪽 트랙에서만 일어나 버튼 밑으로 지나가지 않는다
               '.o-story nav.o-nav{position:sticky;top:0;z-index:5;height:var(--o-nav-h);box-sizing:border-box;display:flex;align-items:center;padding:0 92px 0 10px;background:#edf0f4;border-bottom:1px solid #d9dee5}'
               '.o-story .o-nav-track{display:flex;align-items:center;gap:6px;min-width:0;width:100%;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scrollbar-width:none}.o-story .o-nav-track::-webkit-scrollbar{display:none}'
               '.o-story nav.o-nav a{flex:none;display:inline-flex;align-items:center;min-height:44px;padding:0 12px;color:#263a55;font-weight:800;font-size:14px;text-decoration:none;background:#fff;border:1px solid #d4dae1;border-radius:99px}'
               '.o-story .comic-home{top:calc(9px + env(safe-area-inset-top));min-height:42px}'
               '@media(min-width:760px){.o-story nav.o-nav{padding-right:10px}}.embedded .o-story nav.o-nav{padding-right:10px}'
               '.o-guide{margin:12px 0 0;padding:0;list-style:none;font-size:14px;line-height:1.6;color:#d9e0e8}.o-guide b{color:#f0b593}'
               # 세 부분: 짧은 머리 → 장면(모두 펼침) → 흐름이 끊기는 곳의 ‘이 부분에서 외울 것’ 카드
               '.o-psec{border-bottom:12px solid #e6e9ed}.o-story .o-part .o-part-lead{margin:6px 0 0;font-size:15px;line-height:1.6;color:#dce5f0;word-break:keep-all}'
               '.o-mem{margin:0;padding:16px 18px 18px;background:#fff8e8;border-top:4px solid #e5a337;border-bottom:1px solid #f0dfb8;scroll-margin-top:calc(var(--o-nav-h) + 8px)}'
               '.o-mem-label{margin:0 0 8px;font-size:17px;font-weight:900;color:#7a4b0d}.o-mem-k+.o-mem-k{margin-top:14px;padding-top:12px;border-top:1px dashed #e3cf9f}'
               '.o-chunk-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 10px;margin:0 0 6px}.o-chunk-t{font-size:17px;font-weight:900}.o-chunk-w{font-size:14px;font-weight:800;color:#294d87}'
               '.o-chunk-story p{margin:0 0 6px;font-size:16px;line-height:1.7;color:#243248;word-break:keep-all;overflow-wrap:anywhere}.o-chunk-story .o-em,.o-mem-x .o-em{color:#b52d34;font-weight:900}'
               '.o-memo{margin:8px 0;padding:10px 12px;border-left:4px solid #e5a337;border-radius:8px;background:#fff}.o-memo-label{display:block;font-size:14px;font-weight:900}'
               '.o-memo-text{margin:4px 0;font-size:16px;font-weight:800;line-height:1.7;word-break:keep-all}.o-memo-note{margin:0;font-size:15px;line-height:1.7;color:#5b4a26;word-break:keep-all}'
               '.o-mem-x{margin:8px 0 0;font-size:16px;line-height:1.7;color:#3b3220;word-break:keep-all;overflow-wrap:anywhere}.o-mem-x b{margin-right:6px;padding:1px 7px;border-radius:6px;background:#fce9e5;color:#8f2a26;font-size:13px;font-weight:900}'
               '.o-chunk-k{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:8px 0 0}.o-keys-label{font-size:13px;font-weight:900;color:#5b6576}'
               '.o-key{padding:3px 9px;border-radius:999px;background:#fce9e5;color:#8f2a26;font-size:14px;font-weight:850}'
               # 앱 안(학습 화면)에서는 앱이 세 부분 바로 가기를 맡으므로 웹툰의 고정 줄은 숨긴다
               '.embedded .o-story nav.o-nav{display:none}'
               # 앱의 세 부분 바로 가기로 옮겨 온 부분 머리에는 초점 테두리를 보인다(앱이 tabindex=-1로 초점만 옮김)
               '.o-story .o-part:focus{outline:3px solid #f0b593;outline-offset:-3px}'
               # 끝 정리(이 웹툰의 .end 안에서만): 세 부분 줄, 사건 하나씩 묶어 줄바꿈
               '.o-story .end .o-end-flow{list-style:none;margin:12px 0 18px;padding:0;display:grid;gap:12px}'
               '.o-story .end .o-end-flow li{padding:10px 0 0;border-top:1px solid #ffffff26;line-height:1.7}'
               '.o-story .end .o-end-part{display:block;margin:0 0 4px;color:#f0b593;font-size:14px;font-weight:900}'
               '.o-story .end .o-end-evs{display:block;color:#e7eaf0;font-size:16px;word-break:keep-all}'
               '.o-story .end .o-end-ev{display:inline-block;max-width:100%;margin-right:.45em;overflow-wrap:anywhere}.o-story .end .o-end-ar{color:#ffb5a8}'
               '.o-part{padding:16px 18px;background:#17243a;color:#fff}.o-part small{display:block;color:#f0b593;font-size:12px;font-weight:800}.o-story .o-part h2{margin:4px 0 0;color:#fff;font-size:clamp(18px,5vw,22px);line-height:1.3;word-break:keep-all}'
               '.o-story .o-head{padding:18px 18px 0}.o-story .o-head .meta{font-size:13px;color:#667085;font-weight:800;letter-spacing:.02em}'
               '.o-story .o-head h2{font-size:clamp(22px,6vw,28px);line-height:1.25;letter-spacing:-.04em;margin:6px 0;word-break:keep-all}'
               '.o-story .o-head .o-reign{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 8px;margin:0 0 4px;font-size:15px;line-height:1.45}'
               '.o-story .o-reign .king{color:#142031;font-weight:900}.o-story .o-reign .years{color:#4b5565;font-size:14px;font-weight:750}'
               '.o-story .o-head .o-when{margin:0 0 12px;color:#a72d27;font-size:14.5px;line-height:1.5;font-weight:850;word-break:keep-all;overflow-wrap:anywhere}'
               '.o-story .o-head .o-scope{margin:-6px 0 12px;padding:6px 10px;border-left:3px solid #294d87;border-radius:6px;background:#eef2f8;color:#294d87;font-size:13.5px;font-weight:800;line-height:1.5;word-break:keep-all;overflow-wrap:anywhere}'
               '.o-learn{margin:12px 18px 0;padding:10px 12px 12px;border:2px solid #e3a59d;border-radius:12px;background:#fff6f2}'
               '.o-learn .o-learn-label{margin:0 0 6px;font-size:14px;font-weight:900;color:#a72d27}'
               '.o-learn ol{margin:0;padding:0 0 0 1.4em;display:grid;gap:8px}'
               '.o-learn li{font-size:15px;line-height:1.55;color:#2b3443;word-break:keep-all;overflow-wrap:anywhere}.o-learn li::marker{font-weight:900;color:#a72d27}'
               '.o-learn .lt{display:block;font-size:16px;font-weight:900;color:#b52d34}.o-learn .lt.plain{color:#263a55}.o-learn li>span{display:block}'
               '.o-art{margin:0;background:#d9dce0;line-height:0}.o-panel{display:block;width:100%;height:auto}.o-art img{display:block;width:100%;height:auto}'
               '.o-art-pending{margin:0 18px;padding:18px;border:2px dashed #c9b98f;border-radius:12px;background:#fff8ec;color:#5a4a2b;line-height:1.6}.o-art-pending strong{display:block;font-size:15px}.o-art-pending span{display:block;font-size:13px}'
               '.o-art-cap{margin:6px 18px 0;font-size:13px;font-weight:750;line-height:1.5;color:#4b5565}'
               '.o-art-note{margin:2px 18px 0;font-size:13px;line-height:1.5;color:#5b6576}'
               '.o-talk{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin:12px 18px 0}'
               '.o-talk .o-talk-cap{grid-column:1/-1;margin:0;font-size:13px;font-weight:800;line-height:1.4;color:#5b6576}'
               '.o-talk .say{margin:0;padding:10px 12px 11px;background:#fff;border:2px solid #26384c;border-radius:16px 16px 16px 5px;color:#243248;line-height:1.5}'
               '.o-talk .say+.say{background:#eef6ff;border-color:#315d80;border-radius:16px 16px 5px 16px}'
               '.o-talk .who{font-size:15px;font-weight:900;color:#b52d34}.o-talk .say+.say .who{color:#315d80}'
               '.o-talk .role{margin-left:6px;font-size:14px;font-weight:700;color:#4b5565}'
               '.o-talk .line{display:block;margin-top:4px;font-size:16px;font-weight:700;word-break:keep-all;overflow-wrap:anywhere}'
               '.o-steps{list-style:none;margin:12px 18px 0;padding:0;display:grid;gap:7px}'
               '.o-steps li{display:grid;grid-template-columns:3.6em minmax(0,1fr);gap:8px;align-items:baseline;font-size:15px;line-height:1.6;color:#2b3443;word-break:keep-all;overflow-wrap:anywhere}'
               '.o-steps .st{display:block;padding:1px 2px;border-radius:6px;text-align:center;font-size:12.5px;font-weight:900;line-height:1.5;background:#eef1f4;color:#4b5565}'
               '.o-steps .st.dev{background:#fff0e9;color:#a72d27}.o-steps .st.res{background:#e9f4ec;color:#2f6b3c}.o-steps .st.item{background:#f6f1e7;color:#7a5a24}'
               '.o-steps strong{color:#b52d34;font-weight:900}'
               '.o-story .scene-tier{display:inline-block;margin-left:4px;padding:0 6px;border-radius:99px;font-size:12px;font-weight:900;line-height:1.7;vertical-align:1px;background:#fce9e5;color:#b52d34}'
               '.o-story .scene-tier.tier-support{background:#eef1f4;color:#4b5565}.o-story .scene-tier.tier-optional{background:#f6f1e7;color:#7a5a24}'
               '.o-story .scene-more{margin:10px 18px 0;padding:4px 12px;border:1px dashed #d6c7a3;border-radius:10px;background:#fffaf0;font-size:14px;line-height:1.6;color:#3d4859}'
               '.o-story .scene-more>summary{display:flex;align-items:center;min-height:44px;cursor:pointer;font-weight:850}.o-story .scene-more>summary:focus-visible{outline:3px solid #294d8766;outline-offset:2px;border-radius:6px}.o-story .scene-more p{margin:2px 0 10px}'
               '.o-story .legacy-anchor{display:block;position:relative;top:calc(-1 * (var(--o-nav-h) + 8px));height:0}'
               '.o-story .bridge .leap{flex:none;padding:1px 7px;border-radius:99px;background:#f6f1e7;color:#7a5a24;font-size:11.5px;font-weight:900;white-space:nowrap}'
               '.o-story .bridge.o-part-bridge{background:#17243a;color:#e7ecf2}.o-story .bridge.o-part-bridge .bridge-dots{color:#ffb5a8}'
               '@media(max-width:400px){.o-talk{grid-template-columns:1fr;gap:12px;margin:12px 14px 0}.o-steps{margin:12px 14px 0}.o-art-cap{margin:6px 14px 0}.o-art-note{margin:2px 14px 0}.o-art-pending{margin:0 14px}.o-learn{margin-left:14px;margin-right:14px}.o-mem{padding-left:14px;padding-right:14px}.o-story .o-head{padding:16px 14px 0}.o-story nav.o-nav a{padding:0 10px}}'
               '</style>')


def sha256(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def png_size(path):
    with open(path, 'rb') as f:
        b = f.read(24)
    return struct.unpack('>II', b[16:24])


def load_terms():
    p = os.path.join(MEDIA, 'lecture-terms-opening.js')
    if not os.path.exists(p):
        raise SystemExit('media/lecture-terms-opening.js 가 없어요. 먼저 node scripts/build_opening_sources.cjs 를 실행하세요.')
    s = open(p, encoding='utf-8').read()
    m = re.search(r'window\.HANQ_LECTURE_TERMS\.opening=(\[.*?\]);', s)
    return json.loads(m.group(1))


def bold_terms(text, seen, vocab):
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


def tier_badge(t):
    return '<span class="scene-tier tier-%s">%s</span>' % (t, TIER_LABEL[t])


def art_html(sc, load):
    """그림 HTML과 (필요하면) 그림 요청. 원본 칸은 SVG viewBox로 칸 사각형 전체만 보인다."""
    kind, ref = sc['art'][0], sc['art'][1]
    if kind == 'p':
        x, y, w, h = PANELS[ref]
        return ('<div class="o-art" data-panel="opening-p%02d"><svg class="o-panel" viewBox="%d %d %d %d" width="%d" height="%d" role="img" aria-label="%s" focusable="false" preserveAspectRatio="xMidYMid meet">'
                '<image href="%s" x="0" y="0" width="%d" height="%d"/></svg></div>') % (ref, x, y, w, h, w, h, e(sc['alt']), SHEET, SHEET_W, SHEET_H), None, '%s#p%02d' % (SHEET, ref)
    path, brief = NEW_ART[ref]
    full = os.path.join(MEDIA, path)
    if os.path.exists(full):
        w, h = png_size(full)
        return '<div class="o-art" data-art="new"><img src="%s" width="%d" height="%d" alt="%s" decoding="async" loading="%s"></div>' % (path, w, h, e(sc['alt']), load), None, path
    return ('<div class="o-art-pending" role="note" data-art-needed="%s"><strong>그림 준비 중</strong><span>이 장면에 맞는 개념 그림을 준비하고 있어요. 먼저 글로 읽어요.</span></div>' % path), dict(expected_file='media/' + path, brief=brief), None


def scene_html(sc, n, vocab):
    idattr = ' id="%s"' % e(sc['id']) if sc.get('id') else ''
    kings = ' data-kings="%d-%d"' % sc['kings'] if sc.get('kings') else ''
    year = ' data-year="%d"' % sc['year'] if sc.get('year') else ''
    scope_attr = ' data-scope="reign"' if sc.get('scope') else ''
    reign = ('<p class="o-reign"><b class="king">%s</b><span class="years">%s</span></p>' % (e(sc['reign'][0]), e(sc['reign'][1]))) if sc.get('reign') else ''
    scope = '<p class="o-scope">%s</p>' % e(sc['scope']) if sc.get('scope') else ''
    head = ('<div class="o-head"><div class="meta"><span data-scene-count data-format="n">%02d</span> · %s %s</div><h2>%s</h2>%s<p class="o-when">%s</p>%s</div>'
            % (n, e(sc['label']), tier_badge(sc['tier']), e(sc['title']), reign, e(sc['when']), scope))
    # 이 컷 핵심: 배경→전개→결과 설명 뒤에 1–3개(앞에 미리 읽히는 요약이 되지 않게), 강의 핵심어가 든 용어만 굵게(등급을 올리지 않음)
    learn = '<div class="o-learn" aria-label="이 컷 핵심"><p class="o-learn-label">이 컷 핵심</p><ol>%s</ol></div>' % ''.join(
        ('<li><strong class="lt">%s</strong><span>%s</span></li>' if any(t in term for t in vocab) else '<li><b class="lt plain">%s</b><span>%s</span></li>') % (e(term), e(text))
        for term, text in sc['learn'])
    art, need, art_ref = art_html(sc, 'eager' if n <= 2 else 'lazy')
    cap = '<p class="o-art-cap">개념 그림 · 실제 인물의 초상이나 현장 그림이 아니에요.</p>'
    note = '<p class="o-art-note">%s</p>' % e(sc['art_note']) if sc.get('art_note') else ''
    talk = '<div class="o-talk"><p class="o-talk-cap">학습용 요약 대화 · 실제 발언을 그대로 옮긴 것이 아니에요.</p>%s</div>' % ''.join(
        '<p class="say%s" aria-label="%s(%s): %s"><b class="who">%s</b><span class="role">%s</span><span class="line">%s</span></p>' % (
            ' generic' if w in GENERIC else '', e(w), e(role(w, r)), e(t), e(w), e(role(w, r)), e(t)) for w, r, t in (sc['a'], sc['b']))
    seen = set()
    steps = '<ol class="o-steps" aria-label="장면 흐름">%s</ol>' % ''.join(
        '<li><b class="st %s">%s</b><span>%s</span></li>' % (k, e(lbl), bold_terms(t, seen, vocab)) for lbl, k, t in sc['steps'])
    more = ''.join('<details class="scene-more"><summary>%s</summary><p>%s</p></details>' % (e(t), e(x)) for t, x in sc.get('more', []))
    html_ = '<section class="scene"%s data-lecture="%s"%s%s%s>%s%s%s%s%s%s%s%s</section>' % (
        idattr, e(' '.join(sc['mods'])), kings, year, scope_attr, head, art, cap, note, talk, steps, learn, more)
    check_scene(sc, n, html_)
    return html_, need, art_ref


def role(name, r):
    """역할 표시. 기록에 이름이 없는 설명용 인물은 그렇다고 밝힌다."""
    return r + ' · 설명용 인물' if name in GENERIC else r


def check_scene(sc, n, html_):
    """읽기 부담·시험 단서 보존 확인: 외울 것 1–3개(뜻 문장), 화자 이름·역할, 예전 꼭 기억 낱말이 펼치지 않은 글에 모두 남는지."""
    if not 1 <= len(sc['learn']) <= 3 or any(len(t) < 12 or not t.endswith('다.') for _, t in sc['learn']):
        raise SystemExit('장면 %d: 이 장면에서 외울 것은 1–3개, 각각 뜻·관계를 한 문장으로' % n)
    if any(not w or not r for w, r, _ in (sc['a'], sc['b'])):
        raise SystemExit('장면 %d: 말풍선 화자 이름·역할이 비어 있음' % n)
    vis = re.sub(r'\s+', '', html.unescape(re.sub(r'<[^>]+>', ' ', re.sub(r'<details[\s\S]*?</details>', ' ', html_))))
    lost = [p for k in sc['key'] for p in re.split(r' · | → ', k) if re.sub(r'\s+', '', p) not in vis]
    if lost:
        raise SystemExit('장면 %d: 시험 단서가 펼친 글에서 빠짐: %s' % (n, ', '.join(lost)))


def bridge_html(sc):
    if not sc.get('next'):
        return ''
    text, leap = sc['next']
    cls = 'bridge o-part-bridge' if sc.get('next_part') else 'bridge'
    chip = '<span class="leap">중간 왕 생략</span>' if leap else ''
    return '<div class="%s" aria-label="다음 이야기"%s><span class="bridge-dots" aria-hidden="true">…</span><span class="bridge-text">%s</span>%s</div>' % (
        cls, ' data-leap="1"' if leap else '', e(text), chip)


def part_html(sc):
    """예전 부 머리(#part-1–#part-4) 자리: 같은 장면 바로 앞에 빈 앵커만 남긴다(바로 링크가 접힌 부모를 열고 그 장면으로 간다)."""
    if not sc.get('part'):
        return ''
    return '<span class="legacy-anchor" id="%s" aria-hidden="true"></span>' % e(sc['part'][0])


def load_parts():
    """요약 노트와 같은 세 부분 기준 데이터(media/lecture-notes-opening.js의 /*PARTS-JSON*/ … /*END-PARTS-JSON*/)."""
    s = open(os.path.join(MEDIA, 'lecture-notes-opening.js'), encoding='utf-8').read()
    m = re.search(r'/\*PARTS-JSON\*/(.*?)/\*END-PARTS-JSON\*/', s, re.S)
    if not m:
        raise SystemExit('media/lecture-notes-opening.js 에 세 부분 데이터(PARTS-JSON)가 없어요.')
    return json.loads(m.group(1))


# 세 부분에 넣을 장면(id 순서 = 화면 순서). 모든 장면은 펼친 채 보인다.
# 덩어리(parts 데이터의 chunks)는 go 장면에서 시작해 다음 덩어리의 go 앞까지 이어지고, 그 마지막 장면 뒤에 ‘이 부분에서 외울 것’ 카드가 붙는다.
PART_SCENES = {
    'part-fix': ['scene-1', 'scene-2', 'shinmi-1871', 'scene-3'],
    'part-reform': ['gaehwa-policy', 'scene-4', 'scene-5', 'scene-6', 'scene-7', 'gyeongbok-1894', 'scene-8', 'ugeumchi-1894', 'hongbeom-1894', 'scene-9', 'independence-club', 'scene-10'],
    'part-defend': ['advisers-1904', 'scene-11', 'scene-12', 'annexation-1910', 'national-defense'],
}
# 웹툰 끝 ‘개화기, 한 줄로’: 예전 한 줄과 같은 사건·연도·순서를 세 부분(parts 순서)으로만 나눈 것
END_FLOW = [
    ['1863 26대 고종 즉위·흥선대원군 집권', '1866 병인양요', '1871 신미양요·척화비', '1876 강화도 조약'],
    ['1880–1881 개화 정책', '1882 조미수호통상조약·임오군란', '1884 갑신정변', '1894 동학 농민 운동·갑오개혁', '1895 을미사변·을미개혁', '1896 아관 파천·독립협회', '1897 대한제국'],
    ['1904 러일 전쟁', '1905 을사늑약', '1907 고종 강제 퇴위·27대 순종·군대 해산', '1909 기유각서', '1910 국권 피탈'],
]
# 정치 흐름 뒤에 붙는 주제별 장면(시기가 겹침). 카드는 그 장면의 ‘이 컷 핵심’ 문장으로 만든다.
PART_TOPIC = {'part-reform': [('modern-culture', '근대 문물 (주제별)', '1880년대–1910 · 시기가 겹침')]}

# 바로 링크(#scene-…, 예전 #part-1–4, 덩어리의 ‘만화로 보기’)가 접힌 부모 details를 열고, 고정 바로 가기 줄 아래로 장면을 보여 준다
DEEPLINK_JS = ('<script id="hanq-opening-deeplink">(function(){'
               'function reveal(id,smooth){if(!id)return;var t=document.getElementById(id);if(!t)return;'
               'if(t.tagName==="DETAILS")t.open=true;for(var d=t.parentElement&&t.parentElement.closest("details");d;d=d.parentElement&&d.parentElement.closest("details"))d.open=true;'
               'var el=t;while(el.classList.contains("legacy-anchor")&&el.nextElementSibling)el=el.nextElementSibling;'
               'var calm=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;el.scrollIntoView({block:"start",behavior:smooth&&!calm?"smooth":"auto"});}'
               'function fromHash(smooth){var h=location.hash.slice(1);try{h=decodeURIComponent(h);}catch(e){}reveal(h,smooth);}'
               'window.addEventListener("hashchange",function(){fromHash(true);});'
               'document.addEventListener("click",function(e){var a=e.target&&e.target.closest&&e.target.closest("a[href^=\\"#\\"]");if(a&&a.getAttribute("href")===location.hash)setTimeout(function(){fromHash(true);},0);});'
               'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){fromHash(false);});else fromHash(false);'
               '})();</script>')


def em(s):
    """이야기 문장: 먼저 HTML 이스케이프한 뒤 **용어**만 굵게(요약 노트의 partsEm과 같은 규칙)."""
    return re.sub(r'\*\*([^*]+)\*\*', r'<strong class="o-em">\1</strong>', e(s))


def memory_chunk_html(k):
    """카드 안 덩어리 하나: 사건·왕/시기 → 이어지는 이야기 2–4문장(요약 노트와 같은 문장) → 외우는 순서(있으면) → 헷갈리지 않기 → 암기 키워드."""
    memo = ('<div class="o-memo"><b class="o-memo-label">%s</b><p class="o-memo-text">%s</p><p class="o-memo-note">%s</p></div>'
            % (e(k['memo']['label']), e(k['memo']['text']), e(k['memo']['note']))) if k.get('memo') else ''
    wrong = '<p class="o-mem-x"><b>헷갈리지 않기</b>%s</p>' % em(k['x']) if k.get('x') else ''
    return ('<div class="o-mem-k"><p class="o-chunk-head"><b class="o-chunk-t">%s</b><span class="o-chunk-w">%s</span></p>'
            '<div class="o-chunk-story">%s</div>%s%s'
            '<p class="o-chunk-k"><span class="o-keys-label">암기 키워드</span>%s</p></div>') % (
        e(k['t']), e(k['w']), ''.join('<p>%s</p>' % em(x) for x in k['story']), memo, wrong,
        ''.join('<span class="o-key">%s</span>' % e(x) for x in k['k']))


def memory_html(after, chunks):
    """흐름이 끊기는 곳(덩어리의 마지막 장면 뒤)의 ‘이 부분에서 외울 것’ 카드."""
    return ('<aside class="o-mem" id="mem-%s" aria-label="이 부분에서 외울 것: %s"><p class="o-mem-label">이 부분에서 외울 것</p>%s</aside>'
            % (e(after), e(' · '.join(k['t'] for k in chunks)), '<ul>'+''.join('<li><b>%s</b> · %s</li>'%(e(k['t']),e(' → '.join(k['k']))) for k in chunks)+'</ul><details><summary>세부 내용 펼쳐보기</summary>'+''.join(memory_chunk_html(k) for k in chunks)+'</details>'))


def chunk_ends(ids, chunks):
    """덩어리마다 마지막 장면 id: go부터 다음(더 뒤에서 시작하는) 덩어리의 go 바로 앞까지. 같은 장면에서 시작하는 덩어리는 같은 카드로 묶인다."""
    starts = [ids.index(k['go']) for k in chunks]
    if starts != sorted(starts):
        raise SystemExit('덩어리의 go 장면 순서가 화면 순서와 달라요.')
    ends = {}
    for k, st in zip(chunks, starts):
        later = [x for x in starts if x > st]
        ends.setdefault(ids[(min(later) - 1) if later else len(ids) - 1], []).append(k)
    return ends


def build():
    sheet = os.path.join(MEDIA, SHEET)
    if sha256(sheet) != SHEET_SHA or tuple(png_size(sheet)) != (SHEET_W, SHEET_H):
        raise SystemExit('media/opening-panels.png 가 측정할 때와 다릅니다(해시·크기). 칸 좌표를 다시 재야 합니다.')
    vocab = load_terms()
    src = open(os.path.join(MEDIA, FILE), encoding='utf-8').read()
    head = re.sub(r'<script id="hanq-opening-deeplink">.*?</script>', '', re.sub(r'<style id="hanq-opening-story">.*?</style>', '', src[:src.index('</head>')], flags=re.S), flags=re.S) + OPENING_CSS + DEEPLINK_JS
    tail = src[src.index('</main>'):]
    parts = load_parts()
    by_id = {sc['id']: sc for sc in OPENING}
    placed = [i for p in parts['list'] for i in PART_SCENES[p['id']] + [t[0] for t in PART_TOPIC.get(p['id'], [])]]
    if sorted(placed) != sorted(by_id) or len(placed) != len(OPENING):
        raise SystemExit('세 부분에 모든 장면을 한 번씩 넣어야 해요.')
    if any(k['go'] not in PART_SCENES[p['id']] for p in parts['list'] for k in p['chunks']):
        raise SystemExit('세 부분 덩어리의 go가 그 부분의 장면이 아니에요.')
    body, scenes, needed, mems, n = '', [], [], [], 0

    def emit(sc, pnum, pid, cards):
        nonlocal n
        n += 1
        sc = dict(sc, label=re.sub(r'^\d부 · ', '%d부 · ' % pnum, sc['label']))
        h, need, art_ref = scene_html(sc, n, vocab)
        card = ''
        if cards:
            card = memory_html(sc['id'], cards)
            mems.append(dict(after=sc['id'], scene=n, part=pid, chunks=[k['t'] for k in cards]))
        scenes.append(dict(file=FILE, id=sc.get('id'), scene=n, part=pid, modules=sc['mods'], tier=sc['tier'], art=art_ref, art_reused=bool(sc.get('art_note')), depicts=sc['alt'],
                           reign=' · '.join(sc['reign']) if sc.get('reign') else None, when=sc['when'], scope=sc.get('scope'),
                           next=sc['next'][0] if sc.get('next') else None, leap=bool(sc.get('next') and sc['next'][1]),
                           learn=[t for t, _ in sc['learn']], exam_clues=sc['key'],
                           speakers=[dict(name=w, role=role(w, r), generic=w in GENERIC) for w, r, _ in (sc['a'], sc['b'])]))
        if need:
            needed.append(dict(file=FILE, id=sc.get('id'), scene=n, modules=sc['mods'], tier=sc['tier'], **need))
        # 장면 → (흐름이 끊기는 곳이면) ‘이 부분에서 외울 것’ → 다음 장면으로 잇는 줄
        return part_html(sc) + h + card + bridge_html(sc) + '\n'

    # 세 부분: 짧은 머리(번호·이름·범위·한 문장) → 장면들(모두 펼친 채) → 덩어리 끝마다 외울 것 카드 → 다음 부분
    for pnum, p in enumerate(parts['list'], 1):
        ids = PART_SCENES[p['id']]
        old_ends=chunk_ends(ids,p['chunks'])
        topics=PART_TOPIC.get(p['id'],[])
        grouped=list(p['chunks'])+[dict(t=tt,w=tw,story=[x for _,x in by_id[tid]['learn']],k=[t for t,_ in by_id[tid]['learn']]) for tid,tt,tw in topics]
        group_end=topics[-1][0] if topics else ids[-1]
        ends={group_end:grouped}
        body += ('<section class="o-psec" aria-labelledby="%s-h"><div class="o-part" id="%s"><small>%d부 · %s</small><h2 id="%s-h">%s %s</h2><p class="o-part-lead">%s</p></div>\n'
                 % (e(p['id']), e(p['id']), pnum, e(p['range']), e(p['id']), e(p['no']), e(p['name']), e(p['lead'])))
        # 예전 접힌 상세 만화의 id(#part-…-detail)는 같은 부분 첫 장면으로 가는 빈 앵커로만 남긴다(다시 접지 않음)
        body += '<span class="legacy-anchor" id="%s-detail" aria-hidden="true"></span>' % e(p['id'])
        for i in ids:
            body += emit(by_id[i], pnum, p['id'], ends.get(i))
            if i in old_ends and i!=group_end:body += '<span class="legacy-anchor" id="mem-%s" aria-hidden="true"></span>' % e(i)
        for tid, tt, tw in PART_TOPIC.get(p['id'], []):
            tsc = by_id[tid]
            body += emit(tsc,pnum,p['id'],ends.get(tid))
            if tid!=group_end:body += '<span class="legacy-anchor" id="mem-%s" aria-hidden="true"></span>' % e(tid)
        body += '</section>\n'
    guide = ('<ul class="o-guide"><li><b>세 부분</b> ① 나라를 바로잡자 · ② 나라를 개혁하자 · ③ 나라를 지키자. 주제로 나눈 묶음이라 시기가 조금씩 겹쳐요.</li>'
             '<li><b>컷마다</b> 왕·연도 → 그림 → 대화 → 배경 → 전개 → 결과를 읽어요.</li>'
             '<li><b>흐름이 끊기는 곳</b>마다 ‘이 부분에서 외울 것’으로 사람·사건을 이어서 정리해요.</li></ul>')
    header = ('<header><small>한국사 한눈에 · 시대 웹툰</small><h1>개항기와 대한제국</h1><p>26대 고종 즉위와 흥선대원군 집권(1863)부터 27대 순종 때의 국권 피탈(1910)까지, 세 부분으로 따라가요.</p>' + guide + '</header>\n'
              '<nav class="o-nav" aria-label="세 부분 바로 가기"><div class="o-nav-track">%s</div></nav>\n') % ''.join(
        '<a href="#%s">%s %s</a>' % (e(p['id']), e(p['no']), e(p['name'])) for p in parts['list'])
    # 끝 정리: 같은 사건·연도·순서를 세 부분 줄로 나눈다. 사건 하나(→ 연도 사건)는 한 덩어리로 줄바꿈되어 화살표·연도가 따로 떨어지지 않는다
    end_rows = ''.join(
        '<li><b class="o-end-part">%s %s</b><span class="o-end-evs">%s</span></li>' % (
            e(p['no']), e(p['name']),
            ''.join('<span class="o-end-ev">%s%s</span>' % ('<span class="o-end-ar" aria-hidden="true">→ </span>' if (gi or j) else '', e(ev))
                    for j, ev in enumerate(evs)))
        for gi, (p, evs) in enumerate(zip(parts['list'], END_FLOW)))
    end = ('<div class="end"><strong>개화기, 한 줄로</strong><ol class="o-end-flow">' + end_rows + '</ol>'
           '<a href="../index.html#chapter/opening/quiz" target="_top">다 읽었다면 퀴즈로 확인하기 →</a></div>')
    doc = head + '</head><body class="o-story"><a class="comic-home" href="../index.html" aria-label="시대별 목차로 이동">⌂ 홈</a><main>' + header + body + end + tail
    with open(os.path.join(MEDIA, FILE), 'w', encoding='utf-8') as f:
        f.write(doc)
    cmap = dict(generated_by='scripts/build_opening_comic.py',
                note='개화기 웹툰 장면별 강의 모듈·등급·그림. 원본 칸은 opening-panels.png#pNN(칸 번호), 새 개념 그림은 media/lecture-panels의 파일, art가 null이면 그림 준비 중(art_needed).',
                panel_source=dict(file='media/' + SHEET, sha256=SHEET_SHA, width=SHEET_W, height=SHEET_H,
                                  panels={'p%02d' % k: dict(x=v[0], y=v[1], w=v[2], h=v[3]) for k, v in sorted(PANELS.items())}),
                scenes=scenes, memory=mems, art_needed=needed)
    with open(os.path.join(ROOT, 'docs', 'opening-comic-map.json'), 'w', encoding='utf-8') as f:
        json.dump(cmap, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print('개화기 장면', len(scenes), '· 그림 필요', [a['scene'] for a in needed])


if __name__ == '__main__':
    build()

# Source-backed supplementary learning cuts; original scene keys stay unchanged.
from study_supplements import apply as apply_study_supplements
apply_study_supplements()
