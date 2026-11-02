/*
 * 전체 복습 · 시기별 한 쪽 요약 편집 표 (손으로 쓰는 원본)
 *
 * 카드 번호는 기존 복습 덱(media/review-*-cards.js)의 cards 배열 번호다. 원래 덱은 바꾸지 않는다.
 *   flow : 흐름 칸 (순서·연표·개요 카드)
 *   core : 시험 핵심 칸 (인물 → 정책 → 의미 카드)
 *   cmp  : 혼동 비교 칸 (비교 카드)
 *   tbc  : 혼동 비교 칸에 함께 놓는 교재 비교표 HANQ_TEXTBOOK[era].compare[i]
 * '함정:'·'주의:'로 시작하는 요점은 빌드할 때 혼동 비교 칸으로 옮긴다(문장은 그대로).
 * period(시기 구분)은 교재 원문 PDF 표(<표 N>)와 원래 카드의 시기 줄에 있는 연도·왕만 쓴다.
 * 근거 PDF 쪽: 벼락치기한능검_요약서.pdf, 인쇄 쪽 + 7 = PDF 쪽.
 */
'use strict';
const ANCIENT = require('./ancient-compact.cjs');
const BAEKJE = require('./baekje-compact.cjs');
const SAMGUK = require('./samguk-compact.cjs');
const NAMBUK = require('./nambuk-compact.cjs');

const ANCIENT_PARTS = [
  { part: 'prehistory', deck: 'prehistory', tb: 'prehistory', label: '선사 시대' },
  { part: 'gojoseon', deck: 'gojoseon', tb: 'gojoseon', label: '고조선과 여러 나라' },
  { part: 'samguk', deck: 'samguk', tb: 'samguk', label: '삼국 시대' },
  { part: 'nambuk', deck: 'nambuk', tb: 'nambuk', label: '남북국 시대' }
];

const PLAN = {
  ancient: {
    title: '고대사',
    outline: { id: 'anc-outline', title: '고대사 큰 흐름 · 선사 → 고조선 → 삼국 → 남북국', period: '구석기 ~ 후삼국 통일 · 교재 Ⅰ·Ⅱ단원(표 1~14)', rowsFrom: 0 },
    recap: { id: 'anc-recap', title: '고대사 전체 정리', period: '선사 · 고조선과 여러 나라 · 삼국 · 남북국을 한 번에' },
    parts: {
      prehistory: [
        { id: 'pre-outline', kind: 'outline', scope: 'part', title: '선사 시대 큰 흐름', period: '구석기 → 신석기 → 청동기 → 철기 · 교재 표 1', flow: [0] },
        { id: 'pre-1', kind: 'period', title: '선사 ① 구석기·신석기 · 이동에서 정착으로', period: '구석기(이동 생활) → 신석기(농경·정착) · 교재 표 1', core: [1, 2, 3] },
        { id: 'pre-2', kind: 'period', title: '선사 ② 청동기·철기 · 계급과 철제 농기구', period: '청동기(사유 재산·계급) → 철기(철제 농기구·교역) · 교재 표 1', core: [4, 5, 6], tbc: [0] },
        { id: 'pre-recap', kind: 'recap', scope: 'part', title: '선사 시대 정리', period: '도구와 무덤 이름이 곧 시대 단서', flow: [7] }
      ],
      gojoseon: [
        { id: 'gj-outline', kind: 'outline', scope: 'part', title: '고조선과 여러 나라 큰 흐름', period: '고조선은 순서로, 여러 나라는 지역별 비교 · 교재 표 2·3', flow: [0] },
        { id: 'gj-1', kind: 'period', title: '고조선 · 건국에서 멸망까지', period: '단군왕검 건국 → 위만 조선 → 우거왕 때 한의 공격으로 멸망 · 교재 표 2', core: [1, 2] },
        { id: 'gj-2', kind: 'period', title: '여러 나라 · 부여·초기 고구려·옥저·동예·삼한', period: '고조선 멸망 전후 각 지역에 나란히 성장 · 교재 표 3', core: [3, 4, 5, 6, 7], cmp: [8], tbc: [0] },
        { id: 'gj-recap', kind: 'recap', scope: 'part', title: '고조선과 여러 나라 정리', period: '정치 · 제천 · 혼인을 같은 순서로 비교', flow: [9] }
      ],
      samguk: [
        { id: 'sa-outline', kind: 'outline', scope: 'part', title: '삼국 시대 큰 흐름', period: '고구려 · 백제 · 신라 · 가야는 같은 시기에 나란히 · 교재 표 4~10', flow: [0] },
        { id: 'sa-1', kind: 'period', title: '삼국 ① 초기 발전에서 4세기까지 · 고구려의 위기·재정비와 백제 근초고왕', period: '고국천왕 → 동천왕 → 미천왕 · 백제 근초고왕(4세기 전성기) · 고국원왕 전사 → 소수림왕', core: [1, 2, 3] },
        { id: 'sa-2', kind: 'period', title: '삼국 ② 5세기 · 광개토왕·장수왕과 가야 연맹', period: '고구려 5세기 전성기(영락 연호 → 평양 천도) · 금관가야 → 대가야', core: [4, 5] },
        { id: 'sa-3', kind: 'period', title: '삼국 ③ 5~6세기 · 웅진 백제·신라 체제 정비·한강 쟁탈', period: '장수왕 남진 → 웅진 천도 · 지증왕 → 법흥왕 · 성왕 사비 천도 → 관산성 · 진흥왕 팽창', core: [6, 7, 8, 9], tbc: [0, 1] },
        { id: 'sa-4', kind: 'topic', title: '삼국 · 주제 · 제도와 문화 (나라별 비교)', period: '세 나라에 공통으로 걸친 제도·신분·불교·도교 · 시기가 겹침', core: [10, 11, 12, 13], tbc: [2] },
        { id: 'sa-5', kind: 'period', title: '삼국 ④ 7세기 · 수·당 전쟁에서 삼국 통일까지', period: '수 → 살수 / 당 → 안시성 · 나당 동맹 → 백제 멸망 → 고구려 멸망 → 나당 전쟁 → 통일', core: [14, 15, 16, 17] },
        { id: 'sa-recap', kind: 'recap', scope: 'part', title: '삼국 시대 정리', period: '전성기 순서는 나라가 바뀐 순서가 아님', flow: [18] }
      ],
      nambuk: [
        { id: 'nb-outline', kind: 'outline', scope: 'part', title: '남북국 시대 큰 흐름', period: '통일 신라와 발해는 같은 시기 · 교재 표 11~14', flow: [0] },
        { id: 'nb-1', kind: 'period', title: '남북국 ① 통일 신라 · 신문왕과 통치 조직', period: '문무왕 통일 완성 → 신문왕 왕권 강화 · 9주 5소경 · 9서당 10정', core: [1, 2, 3], tbc: [0] },
        { id: 'nb-2', kind: 'period', title: '남북국 ② 발해 · 건국에서 해동성국까지', period: '고구려 유민·말갈인 건국 → 무왕(공격) → 문왕(교류) → 선왕(전성기)', core: [4, 5, 6, 7], tbc: [1] },
        { id: 'nb-3', kind: 'topic', title: '남북국 · 주제 · 학문·불교·기록', period: '인물마다 시기가 겹치는 주제 묶음', core: [8, 9, 10, 11], tbc: [2] },
        { id: 'nb-4', kind: 'period', title: '남북국 ③ 신라 말 · 하대의 혼란과 후삼국', period: '혜공왕 피살 뒤 왕위 다툼 → 진성여왕 때 봉기·호족 → 후백제·후고구려 → 고려의 통일', core: [12, 13, 14, 15] },
        { id: 'nb-recap', kind: 'recap', scope: 'part', title: '남북국 시대 정리', period: '남과 북을 나란히, 신라 말은 시간 순서로', flow: [16] }
      ]
    }
  },

  /* 고대사 안의 부분 요약(전달): 메뉴의 ‘선사 시대’·‘고조선과 여러 나라’ 범위와 CBT 약한 시대 경로만 이 덱을 연다.
     고대사 전체·삼국·남북국은 기존 카드 그대로. noFloor: 짧은 단원이라 15분 하한으로 늘리지 않음(글자당 90ms 그대로) */
  prehistory: { deck: 'prehistory', tb: 'prehistory', title: '선사 시대', timeline: 'PREHISTORY_FLOW', finishScene: 'last', noFloor: true, exclude: ANCIENT.ANCIENT_EXCLUDE.prehistory, pages: [] },
  gojoseon: { deck: 'gojoseon', tb: 'gojoseon', title: '고조선과 여러 나라', finishScene: 'last', noFloor: true, exclude: ANCIENT.ANCIENT_EXCLUDE.gojoseon, pages: [] },
  /* 백제 웅진·사비 왕 비교는 별도 선택 범위로 유지한다. 고대사 전체는 기존 카드, 삼국·남북국은 아래 새 요약이다.
     백제 덱은 삼국 카드 중 백제 수도·네 왕 요점(points)만 책임진다(scripts/baekje-compact.cjs) */
  /* 삼국 시대(전달): 고대사 범위 ‘삼국 시대’와 CBT 약한 시대(삼국) 경로가 이 덱을 연다(기존 삼국 19장 카드를 대신함).
     noFloor: 실제 분량대로 재고 15분 하한으로 늘리지 않음(글자당 90ms 그대로) */
  samguk: { deck: 'samguk', tb: 'samguk', title: '삼국 시대', timeline: 'SAMGUK_FLOW', finishScene: 'last', noFloor: true, exclude: SAMGUK.SAMGUK_EXCLUDE, pages: [] },
  /* 남북국 시대(전달): 고대사 범위 ‘남북국 시대’와 CBT 약한 시대(남북국) 경로가 이 덱을 연다(기존 남북국 17장 카드를 대신함) */
  nambuk: { deck: 'nambuk', tb: 'nambuk', title: '남북국 시대', timeline: 'NAMBUK_FLOW', finishScene: 'last', noFloor: true, exclude: NAMBUK.NAMBUK_EXCLUDE, pages: [] },
  baekje: { deck: 'samguk', tb: 'samguk', title: '백제 웅진·사비 왕 비교', timeline: 'BAEKJE_FLOW', finishScene: 'last', noFloor: true, points: BAEKJE.BAEKJE_POINTS, exclude: {}, pages: [] },

  goryeo: {
    deck: 'goryeo', tb: 'goryeo', title: '고려',
    /* 사용자 승인 10쪽: 전체 목차 → 다섯 시기(교재 원문 PDF 40쪽 ①~⑤, 41쪽 <표 15>) → 사회 → 경제 → 문화 → 최종 정리.
       쪽마다 장면(scenes)을 차례로 보여 준다. cite는 문서용 근거(화면에는 안 보임). */
    timeline: 'GORYEO_TB15',
    /* 끝나면 마지막 장면(정답 확인) 하나만 남기고, 끝난 뒤 쪽 이동은 그 쪽 첫 장면에서 멈춘 채 시작(쪽 전체를 펼치지 않음) */
    finishScene: 'last',
    /* 원래 카드 부제 중 문항 안내(7·11·64)와 옛 시기 범위(27: 1270–1374, 교재 표 15의 원 간섭기 1270~1351과 어긋남)는 화면에 쓰지 않음 · 요점은 그대로 */
    hideSub: [7, 11, 27, 64],
    exclude: {
      'goryeo#0:0': '옛 6단계 목차 번호 줄(① 태조·광종·성종(+거란) ② 문벌귀족 ③ 무신) — 교재 PDF 40·41쪽 다섯 시기로 바로잡음 · 역사 사실이 아닌 목차',
      'goryeo#0:1': '옛 6단계 목차 번호 줄(④ 몽골 항쟁 ⑤ 원 간섭·공민왕 ⑥ 고려 말) — 몽골 항쟁은 무신집권기 안, 공민왕은 원 간섭기→고려 말 다리로 다시 배치',
      'goryeo#0:2': '옛 목차의 주제 4갈래(통치·지방 / 경제·구휼 / 불교 / 문화) — 승인된 사회·경제·문화 3쪽 구성으로 바뀜(내용은 7~9쪽에 그대로)',
      'goryeo#1:0': '읽는 방법 안내(정치 흐름 먼저, 경제·불교·문화는 마지막) — 학습 안내 문장, 역사 사실 아님',
      'goryeo#1:1': '읽는 방법 안내(경제·불교·문화는 정치 흐름과 시기가 겹침) — 목차 1쪽 둘째 장면의 겹치는 주제 줄로 대신함',
      'goryeo#1:2': '읽는 방법 안내(배경 → 전개 → 결과로 연결) — 학습 안내 문장, 역사 사실 아님'
    },
    pages: [
      { id: 'go-1', kind: 'outline', at: 'all', title: '고려 전체 목차 · 다섯 시기', period: '918 건국 ~ 1392 멸망', cite: 'PDF 40쪽 다섯 시기 · 41쪽 <표 15>',
        scenes: [
          { title: '다섯 시기 · 세력 · 주요 인물과 사건', tb15: 'full' },
          { title: '시기마다 침입한 세력 · 시기와 겹치는 주제', tb15: 'invaders',
            notes: [{ head: '시기와 겹치는 주제', items: ['사회(통치 조직·구휼) · 경제 · 문화(불교·인쇄·역사서·건축)는 다섯 시기에 걸쳐 겹쳐요 → 7~9쪽'], src: 'pdf:40 · pdf:51:표21 · pdf:53:표22' }] }
        ] },
      { id: 'go-2', kind: 'period', at: 'early', title: '고려 ① 고려 초기', period: '918~1018년 · 세력: 호족 · 침략: 거란(요)', cite: 'PDF 41쪽 <표 15>·<표 16>, 42쪽',
        scenes: [
          /* 기출 70~79회 고려 문항에 고창 전투·궁예·광평성·경순왕·일리천이 여러 번 나와(문서의 문항 id) 남북국 덱의 검증된 후삼국 카드 두 장을 함께 보여 줌 */
          { title: '후삼국 통일 → 왕건의 고려 건국', core: [{ deck: 'nambuk', tb: 'nambuk', i: 14 }, { deck: 'nambuk', tb: 'nambuk', i: 15 }] },
          { title: '태조 → 광종 → 경종 → 성종 · 나라의 틀', core: [2, 3, 4, 5, 6], cmp: [7] },
          { title: '거란의 침입과 극복', flow: [11], core: [8, 9, 10] }
        ] },
      { id: 'go-3', kind: 'period', at: 'munbeol', title: '고려 ② 문벌귀족 시기', period: '1018~1170년 · 세력: 문벌 귀족 · 침략: 여진(금)', cite: 'PDF 41쪽 <표 15>, 43쪽 <표 17>',
        scenes: [
          { title: '문종 → 숙종 → 예종 · 사학·화폐·여진 정벌', core: [12, 13, 14, 15] },
          { title: '인종 · 이자겸의 난 → 묘청의 서경 천도 운동', core: [16, 17] }
        ] },
      { id: 'go-4', kind: 'period', at: 'musin', title: '고려 ③ 무신집권기', period: '1170~1270년 · 세력: 무신 · 침략: 몽골(원)', cite: 'PDF 41쪽 <표 15>, 44~45쪽 <표 18>',
        scenes: [
          { title: '무신 정변 → 최씨 정권 · 권력 기구', flow: [18], core: [19, 20, 21] },
          { title: '사회 혼란 · 반무신·농민·천민 봉기', core: [22, 23] },
          { title: '무신집권기의 몽골 침입과 항쟁 → 삼별초', core: [24, 25, 26], cmp: [62], tbc: [0] }
        ] },
      { id: 'go-5', kind: 'period', at: 'won', title: '고려 ④ 원 간섭기', period: '1270~1351년 · 세력: 권문세족 · 원의 내정 간섭', cite: 'PDF 41쪽 <표 15>, 46쪽 <표 19>',
        scenes: [
          { title: '원이 둔 기구와 수탈 · 지배층과 풍속', core: [27, 28] },
          { title: '신진사대부의 성장 · 원 간섭기 흐름', core: [30, 31] }
        ] },
      { id: 'go-6', kind: 'period', at: 'late', title: '고려 ⑤ 고려 말', period: '1351~1392년 · 세력: 신진사대부·신흥무인 · 침략: 홍건적·왜구', cite: 'PDF 41쪽 <표 15>, 46쪽 <표 19>, 47쪽 <표 20>',
        scenes: [
          { title: '원 간섭기 → 고려 말을 잇는 공민왕의 반원 개혁',
            notes: [{ head: '두 시기를 잇는 다리', items: ['공민왕(1351~): 기철 세력 숙청 · 쌍성총관부 탈환 · 전민변정도감 → 원의 내정 간섭이 끝남', '교재는 공민왕 개혁을 원 간섭기 칸에 두고, 고려 말을 1351~1392년으로 나눔 → 공민왕은 두 시기를 잇는 왕'], src: 'pdf:41:표15 · pdf:46:표19' }],
            core: [29] },
          { title: '홍건적·왜구 → 요동 정벌 → 위화도 회군 → 조선 건국', core: [32, 33, 34] }
        ] },
      { id: 'go-7', kind: 'topic', at: 'all', title: '고려 · 사회 · 통치 조직과 구휼', period: '고려 전 시기 · 다섯 시기에 걸쳐 겹침', cite: 'PDF 41쪽 <표 16>, 51~52쪽 <표 21>',
        scenes: [
          { title: '중앙 정치 기구 · 2성 6부와 고려만의 기구', core: [35, 36, 37], cmp: [63], tbc: [1] },
          { title: '지방 행정과 군사 · 백성을 돕는 구휼 기관', core: [38, 39, 45, 46] }
        ] },
      { id: 'go-8', kind: 'topic', at: 'all', title: '고려 · 경제', period: '고려 전 시기 · 다섯 시기에 걸쳐 겹침', cite: 'PDF 51~52쪽 <표 21>',
        scenes: [
          { title: '무역·상업과 화폐', core: [40, 41] },
          { title: '토지 제도 · 역분전 → 전시과 → 과전법', core: [42, 43, 44] }
        ] },
      { id: 'go-9', kind: 'topic', at: 'all', title: '고려 · 문화', period: '고려 전 시기 · 다섯 시기에 걸쳐 겹침', cite: 'PDF 53쪽 <표 22>',
        scenes: [
          { title: '불교 · 의천 → 지눌', core: [47, 48, 49, 50], cmp: [51] },
          { title: '인쇄 기술과 역사서', flow: [59], core: [52, 57, 58] },
          { title: '학문과 저자 구별', core: [60, 61], tbc: [2] },
          { title: '탑·불상·건축·공예', core: [53, 54, 55, 56] }
        ] },
      { id: 'go-10', kind: 'recap', at: 'all', title: '고려 최종 정리', period: '고려 초기 → 문벌귀족 시기 → 무신집권기 → 원 간섭기 → 고려 말', cite: 'PDF 41쪽 <표 15>',
        scenes: [
          { title: '다섯 시기 다시 잇기', tb15: 'short' },
          { title: '전체 흐름과 헷갈리는 짝', flow: [65], cmp: [64] }
        ] }
    ]
  },

  joseon: {
    deck: 'joseon', tb: ['joseon-early', 'joseon-late'], title: '조선',
    /* 전달판은 scripts/joseon-compact.cjs(14쪽)를 쓰고, 아래 pages는 예전 초안(재생에 쓰지 않음)으로만 남김 */
    timeline: 'JOSEON_BOOK',
    exclude: { 'joseon#0:2': '목차 안내(‘마지막 카드: 전체 정리’) — 역사 사실 아님' },
    pages: [
      { id: 'jo-outline', kind: 'outline', stage: 'cross', title: '조선 큰 흐름 · 왕 순서와 시대를 가로지르는 주제', period: '1388 위화도 회군 ~ 1862 · 교재 표 23~30', flow: [0] },
      { id: 'jo-1', kind: 'period', stage: 'early', title: '조선 전기 ① 건국과 태종', period: '1388 위화도 회군 → 1392 조선 건국 → 3대 태종 (교재 표 23)', flow: [1, 4], core: [2, 3, 5, 6, 7, 8] },
      { id: 'jo-2', kind: 'period', stage: 'early', title: '조선 전기 ② 세종 · 정치·전세·학문·영토', period: '4대 세종 1418–1450 (교재 표 23)', flow: [9, 13], core: [10, 11, 12, 14, 15] },
      { id: 'jo-3', kind: 'period', stage: 'early', title: '조선 전기 ③ 단종·세조·성종 · 체제 완성', period: '1453 계유정난 → 1455 세조 즉위 → 8대 예종 → 9대 성종 (교재 표 23)', flow: [16, 21], core: [17, 18, 19, 20, 22, 23] },
      { id: 'jo-4', kind: 'period', stage: 'early', title: '조선 전기 ④ 사림과 사화 · 조광조의 개혁', period: '1498–1545 · 연산군 → 중종 → 명종 (교재 표 23)', flow: [24, 29], core: [25, 26, 27, 28, 30, 31, 32] },
      { id: 'jo-5', kind: 'period', stage: 'late', title: '조선 ⑤ 선조 · 붕당의 시작', period: '14대 선조 1575–1589 (교재 표 24)', flow: [33], core: [34, 35, 36] },
      { id: 'jo-6', kind: 'period', stage: 'late', title: '조선 ⑥ 양난 ① 임진왜란', period: '1592 · 14대 선조 · 1592–1636 전쟁과 반정 연표 (교재 표 23·24)', flow: [37, 42], core: [38, 43, 44, 45, 46, 47], tbc: [['joseon-early', 1]] },
      { id: 'jo-7', kind: 'period', stage: 'late', title: '조선 ⑦ 광해군 · 중립 외교와 대동법', period: '15대 광해군 1608–1623 (교재 표 24·25)', flow: [48, 52], core: [49, 50, 51, 53, 54, 55] },
      { id: 'jo-8', kind: 'period', stage: 'late', title: '조선 ⑧ 인조반정과 정묘호란', period: '1623 인조반정 → 16대 인조 1623–1627 (교재 표 24)', flow: [56], core: [39, 40, 57, 58, 59] },
      { id: 'jo-9', kind: 'period', stage: 'late', title: '조선 ⑨ 양난 ② 병자호란', period: '1636 청의 침입 · 1637 삼전도 (교재 표 24)', flow: [60], core: [41, 61, 62, 63] },
      { id: 'jo-10', kind: 'period', stage: 'late', title: '조선 ⑩ 효종 · 북벌과 나선 정벌', period: '17대 효종 1649–1659 (교재 표 24)', flow: [64], core: [65, 66, 67], tbc: [['joseon-late', 2]] },
      { id: 'jo-11', kind: 'period', stage: 'late', title: '조선 ⑪ 현종 예송 · 숙종 환국', period: '18대 현종 → 19대 숙종 1659–1720 (교재 표 24)', flow: [68], core: [69, 70, 71, 72, 73] },
      { id: 'jo-12', kind: 'period', stage: 'late', title: '조선 ⑫ 영조·정조 · 탕평과 개혁', period: '20대 경종 → 21대 영조 1724–1776 → 22대 정조 1776–1800 (교재 표 24)', flow: [74, 78], core: [75, 76, 77, 79, 80, 81], tbc: [['joseon-late', 0]] },
      { id: 'jo-13', kind: 'period', stage: 'late', title: '조선 ⑬ 세도정치기 · 순조~철종', period: '23대 순조 → 25대 철종 1800–1862 (교재 표 24)', flow: [82], core: [83, 84, 85, 86, 87] },
      { id: 'jo-t1', kind: 'topic', stage: 'cross', title: '조선 · 주제 · 중앙 기구 ① 왕명·사법·수도·교육·역사', period: '조선 전 시기 · 기능과 별칭 (교재 표 23)', flow: [88], core: [89, 90, 91, 92, 93], tbc: [['joseon-early', 0]] },
      { id: 'jo-t2', kind: 'topic', stage: 'cross', title: '조선 · 주제 · 중앙 기구 ② 삼사와 양사', period: '조선 전 시기 · 감찰·간쟁·경연 · 서경권 (교재 표 23)', flow: [94], core: [95, 96, 97, 98] },
      { id: 'jo-t3', kind: 'topic', stage: 'cross', title: '조선 · 주제 · 지방과 향촌', period: '조선 전 시기 · 유향소·경재소·향교·향약 (교재 표 25)', flow: [99], core: [100, 101, 102, 103] },
      { id: 'jo-t4', kind: 'topic', stage: 'early', title: '조선 · 주제 · 토지 제도의 흐름', period: '태조~명종 · 과전법 → 직전법(세조) → 관수관급제(성종) → 폐지(명종) (교재 표 25)', flow: [104], core: [105, 106, 107, 108] },
      { id: 'jo-t5', kind: 'topic', stage: 'early', title: '조선 · 주제 · 전기 왕들의 문화 사업', period: '태종 → 세종 → 세조 → 성종 → 명종 (교재 표 26)', flow: [128], core: [129, 130, 131, 132, 133, 134, 135] },
      { id: 'jo-t6', kind: 'topic', stage: 'early', title: '조선 · 주제 · 서원과 성리학자', period: '주세붕 · 이황 · 이이 (교재 표 28)', flow: [136], core: [137, 138] },
      { id: 'jo-t7', kind: 'topic', stage: 'late', title: '조선 · 주제 · 세금 3종 (전세·공납·군역)', period: '조선 전 시기 비교 · 영정법(인조)·대동법(광해군)·균역법(영조) (교재 표 25)', flow: [109], core: [110, 111, 112, 113] },
      { id: 'jo-t8', kind: 'topic', stage: 'late', title: '조선 · 주제 · 후기 경제의 변화', period: '17~19세기 · 여러 왕 대에 걸친 변화 (교재 표 25)', flow: [114], core: [115, 116, 117, 118, 119, 120] },
      { id: 'jo-t9', kind: 'topic', stage: 'cross', title: '조선 · 주제 · 후기 신분과 사회·종교', period: '조선 후기 신분 동요 · 구제 기관 (교재 표 25)', flow: [121], core: [122, 123, 124, 125, 126, 127] },
      { id: 'jo-t10', kind: 'topic', stage: 'cross', title: '조선 · 주제 · 기록물과 통신사', period: '조선 전 시기 기록물 · 대외 사절 (교재 표 27)', flow: [139], core: [140, 141, 142, 143, 144] },
      { id: 'jo-t11', kind: 'topic', stage: 'late', title: '조선 · 주제 · 실학 ① 토지 개혁론', period: '유형원 · 이익 · 정약용 (교재 표 29)', flow: [145], core: [146, 147, 148, 149, 150], tbc: [['joseon-late', 1]] },
      { id: 'jo-t12', kind: 'topic', stage: 'late', title: '조선 · 주제 · 실학 ② 북학·상공업·백과·역법', period: '홍대용 · 박지원 · 박제가 · 유수원 외 (교재 표 29)', flow: [151], core: [152, 153, 154, 155, 156, 157, 158] },
      { id: 'jo-t13', kind: 'topic', stage: 'cross', title: '조선 · 주제 · 역사서와 지도', period: '전기 관찬 사서 → 후기 발해고·지도 (교재 표 26·28)', flow: [159], core: [160, 161, 162, 163, 164, 165, 166] },
      { id: 'jo-t14', kind: 'topic', stage: 'late', title: '조선 · 주제 · 후기 편찬·양명학·서화', period: '영조 · 정조 · 정제두 · 정선 · 김정희 (교재 표 26·28·30)', flow: [167], core: [168, 169, 170, 171, 172, 173, 174] },
      { id: 'jo-recap', kind: 'recap', stage: 'cross', title: '조선 전체 정리', period: '왕의 순서 + 여러 왕 대에 걸친 변화', flow: [175] }
    ]
  },

  opening: {
    deck: 'opening', tb: 'opening', title: '개화기',
    pages: [
      { id: 'op-outline', kind: 'outline', title: '개화기 큰 흐름 · 쇄국 → 개항 → 개혁 → 대한제국 → 국권 피탈', period: '1863 고종 즉위 ~ 1910 국권 피탈 · 교재 표 31~36', flow: [0] },
      { id: 'op-1', kind: 'period', title: '개화기 ① 흥선대원군과 두 양요', period: '1863 고종 즉위 · 1866 병인양요 · 1871 신미양요 (교재 표 31)', core: [1, 2, 3, 4] },
      { id: 'op-2', kind: 'period', title: '개화기 ② 강화도 조약과 개항', period: '1873 고종 친정 → 1875 운요호 사건 → 1876 강화도 조약 → 1883 개정 통상장정 (교재 표 32)', core: [5, 6, 7] },
      { id: 'op-3', kind: 'period', title: '개화기 ③ 1880년대 개화 정책과 반발', period: '1880년대 · 1882 조미수호통상조약 · 1882 임오군란 (교재 표 32·33)', core: [8, 9, 10, 11, 12] },
      { id: 'op-4', kind: 'period', title: '개화기 ④ 1880년대 근대 문물 (신문·학교·시설·의료)', period: '1880년대 · 원산학사 1883 · 육영공원 1886 (교재 표 36)', core: [13, 14, 15, 16] },
      { id: 'op-5', kind: 'period', title: '개화기 ⑤ 갑신정변과 그 뒤', period: '1884 갑신정변 → 한성 조약 · 톈진 조약 · 거문도 사건 (교재 표 33)', core: [17, 18] },
      { id: 'op-6', kind: 'period', title: '개화기 ⑥ 동학 농민 운동과 갑오·을미개혁', period: '1894 동학 농민 운동 · 1894–1895 갑오개혁 · 1895 을미개혁 (교재 표 34)', core: [19, 20, 21, 22] },
      { id: 'op-7', kind: 'period', title: '개화기 ⑦ 독립협회와 대한제국', period: '1896–1898 독립협회 · 1897 대한제국 · 1899 대한국 국제 (교재 표 34)', core: [23, 25, 26, 27], cmp: [24], tbc: [0, 1] },
      { id: 'op-8', kind: 'period', title: '개화기 ⑧ 러일 전쟁 · 을사늑약 · 정미의병', period: '1904 러일 전쟁 → 1905 을사늑약 → 1907 헤이그 특사·정미의병 (교재 표 35)', core: [28, 29, 30] },
      { id: 'op-9', kind: 'period', title: '개화기 ⑨ 애국 계몽 운동과 근대 문물', period: '1906 대한자강회 · 1907 국채보상운동·신민회 (교재 표 35·36)', core: [31, 32, 33, 34] },
      { id: 'op-10', kind: 'period', title: '개화기 ⑩ 국권 피탈과 항일 의거', period: '1908–1910 · 외교권 → 내정권·군대 → 사법권 → 경찰권 (교재 표 35)', core: [35, 36] },
      { id: 'op-recap', kind: 'recap', title: '개화기 전체 정리', period: '연도로 사건 가르기', flow: [37] }
    ]
  },

  colonial: {
    deck: 'colonial', tb: 'colonial', title: '일제강점기',
    pages: [
      { id: 'co-outline', kind: 'outline', title: '일제강점기 큰 흐름 · 1910년대 / 1920년대 / 1930년대~1945', period: '1910 국권 피탈 → 1945 광복 · 교재 표 37~44', flow: [0, 1] },
      { id: 'co-1', kind: 'period', title: '1910년대 ① 무단 통치와 토지 조사 사업', period: '1910년대 · 무단 통치 (교재 표 37)', core: [2, 3, 4], cmp: [5] },
      { id: 'co-2', kind: 'period', title: '1910년대 ② 비밀 결사와 국외 독립운동 기지', period: '1910년대 · 국내 비밀 결사 · 서간도·북간도·연해주·상하이 (교재 표 39)', core: [6, 7, 8, 9, 10, 11] },
      { id: 'co-3', kind: 'period', title: '1910년대 ③ 3·1 운동과 대한민국 임시정부', period: '1919 3·1 운동 → 1919 상하이 임시정부 (교재 표 37·38)', core: [13, 14, 15, 16, 17] },
      { id: 'co-4', kind: 'period', title: '1920년대 ① 문화 통치와 산미 증식 계획', period: '1920년대 · 3·1 운동 뒤 회유와 통제 · 1925 치안유지법 (교재 표 37)', core: [18, 19, 20] },
      { id: 'co-5', kind: 'period', title: '1920년대 ② 실력 양성과 사회 운동', period: '1920년대 · 물산장려 · 민립대학 · 형평 · 농민·노동·여성·소년 (교재 표 37·38)', core: [22, 23, 24, 29, 30, 31] },
      { id: 'co-6', kind: 'period', title: '1920년대 ③ 국민대표회의 · 6·10 만세 · 신간회 · 광주 학생', period: '1923 국민대표회의 · 1926 6·10 만세 · 1927~1931 신간회 · 1929 광주 학생 (교재 표 38·40)', core: [21, 25, 27, 28], cmp: [26] },
      { id: 'co-7', kind: 'period', title: '1920년대 ④ 의열 투쟁과 만주 무장 투쟁', period: '1919 의열단 · 1920 봉오동·청산리 → 간도 참변 → 1921 자유시 → 1925 미쓰야 (교재 표 40)', flow: [39], core: [32, 33, 34, 35, 36, 37, 38] },
      { id: 'co-8', kind: 'period', title: '1930년대~1945 ① 농촌 정책과 사회 운동', period: '1930년대 · 농촌 진흥 운동 1932~1940 · 1931 강주룡 (교재 표 37·41)', core: [40, 41, 42] },
      { id: 'co-9', kind: 'period', title: '1930년대~1945 ② 민족 말살 통치와 전시 동원', period: '1937 중일 전쟁 이후 강화 · 1938 국가 총동원법 (교재 표 37)', core: [43, 44, 45] },
      { id: 'co-10', kind: 'period', title: '1930년대~1945 ③ 만주 무장 투쟁과 한인애국단', period: '1930년대 초 · 북만주 한국독립군 · 남만주 조선혁명군 · 1931 한인애국단 (교재 표 41)', core: [46, 47, 48, 49, 50] },
      { id: 'co-11', kind: 'period', title: '1930년대~1945 ④ 조선의용대·한국광복군과 광복', period: '1938 조선의용대 · 1940 한국광복군 · 1945 광복 (교재 표 42)', core: [51, 52, 53, 54, 55], cmp: [73], tbc: [1] },
      { id: 'co-t1', kind: 'topic', title: '일제강점기 · 주제 · 미주 활동과 국외 이주', period: '여러 시기에 걸친 국외 활동과 이주 (교재 표 39·38)', core: [12, 56, 57] },
      { id: 'co-t2', kind: 'topic', title: '일제강점기 · 주제 · 국어·역사 연구와 식민 사학', period: '국문연구소 → 조선어 연구회 → 조선어학회 1931~42 (교재 표 43)', core: [58, 59, 60, 61, 62, 63] },
      { id: 'co-t3', kind: 'topic', title: '일제강점기 · 주제 · 교육령과 종교', period: '조선교육령: 무단 통치 → 문화 통치 → 1938~1945 (교재 표 43)', core: [64, 65, 67, 68, 69] },
      { id: 'co-t4', kind: 'topic', title: '일제강점기 · 주제 · 연극·영화·문학·언론·일상', period: '시기가 겹치는 문화·생활 (교재 표 43·44)', core: [66, 70, 71, 72] },
      { id: 'co-recap', kind: 'recap', title: '일제강점기 전체 정리', period: '통치 방식 → 수탈 → 민족 운동을 시기마다', flow: [75], cmp: [74], tbc: [0] }
    ]
  },

  modern: {
    deck: 'modern', tb: 'modern', title: '현대사',
    pages: [
      { id: 'mo-outline', kind: 'outline', title: '현대사 큰 흐름 · 광복 → 정부 수립 → 전쟁 → 정부별 민주화·경제·통일', period: '1945 광복 ~ 문재인 정부 · 교재 표 45~49', flow: [0, 1] },
      { id: 'mo-1', kind: 'period', title: '현대 ① 광복과 통일 정부 수립 노력', period: '1945 광복 직후 → 모스크바 3국 외상회의 → 미소공동위원회 → 좌우합작 → 남북협상 (교재 표 45)', core: [2, 3, 4, 5, 6, 7] },
      { id: 'mo-2', kind: 'period', title: '현대 ② 5·10 총선거와 정부 수립 · 제헌 국회', period: '1948 · 제주 4·3 → 5·10 총선거 → 정부 수립 → 여수·순천 10·19 · 반민특위·농지개혁 (교재 표 45·46)', flow: [11], core: [8, 9, 10, 12, 13] },
      { id: 'mo-3', kind: 'period', title: '현대 ③ 6·25 전쟁', period: '1950 발발 → 1950–1951 반격과 후퇴 → 1953 정전 (교재 표 46)', flow: [18], core: [14, 15, 16, 17] },
      { id: 'mo-4', kind: 'period', title: '현대 ④ 이승만 정부와 4·19 혁명', period: '1952 발췌 개헌 → 1954 사사오입 개헌 → 1960 4·19 혁명 (교재 표 46)', core: [19, 20, 21, 22, 23, 24] },
      { id: 'mo-5', kind: 'period', title: '현대 ⑤ 박정희 정부 ① 5·16에서 경제 개발까지', period: '1961 5·16 군사정변 · 1964 6·3 시위 · 산업화 (교재 표 47)', core: [25, 26, 27, 28, 29, 30, 31] },
      { id: 'mo-6', kind: 'period', title: '현대 ⑥ 박정희 정부 ② 3선 개헌 반대에서 유신 말기까지', period: '3선 개헌 반대(유신 전) → 1972 7·4 남북 공동성명 → 1972.10 유신헌법 → 1979 (교재 표 47)', core: [32, 33, 34, 35, 36] },
      { id: 'mo-7', kind: 'period', title: '현대 ⑦ 신군부와 전두환 정부', period: '1979–1980 신군부·5·18 → 전두환 정부 (교재 표 48)', core: [37, 38, 39, 40, 41, 42, 43] },
      { id: 'mo-8', kind: 'period', title: '현대 ⑧ 1987 6월 민주항쟁', period: '1987 · 원인 → 결과(직선제 개헌) (교재 표 48)', core: [44, 45] },
      { id: 'mo-9', kind: 'period', title: '현대 ⑨ 노태우·김영삼 정부', period: '노태우 1988~1993 · 김영삼 1993~1998 (교재 표 49)', core: [46, 47, 48, 49] },
      { id: 'mo-10', kind: 'period', title: '현대 ⑩ 김대중·노무현 정부', period: '김대중 1998~2003 · 노무현 2003~2008 (교재 표 49)', core: [50, 51, 52, 53, 54, 57], cmp: [64] },
      { id: 'mo-11', kind: 'period', title: '현대 ⑪ 이명박·박근혜·문재인 정부', period: '이명박·박근혜 정부 · 문재인 2017~2022 (교재 표 49)', core: [55, 56] },
      { id: 'mo-t1', kind: 'topic', title: '현대 · 주제 · 개헌·민주화 운동·남북 관계 비교', period: '정부를 가로지르는 비교 주제', core: [58, 59, 60, 61, 62, 63], tbc: [0, 1] },
      { id: 'mo-recap', kind: 'recap', title: '현대사 전체 정리', period: '광복부터 유신까지 · 신군부부터 문재인 정부까지', flow: [65, 66] }
    ]
  }
};

/* 저장소 안 덱·교재 노트에는 없고 교재 원문 PDF 표에만 있는 연도(직접 확인한 쪽) */
const PDF_CITED_YEARS = {
  '1018': 'PDF 41쪽(인쇄 34쪽) <표 15> 고려 시대 구분: 초기 918~1018년 · 문벌귀족 1018~1170년',
  '1351': 'PDF 41쪽(인쇄 34쪽) <표 15> 고려 시대 구분: 원 간섭기 1270~1351년 · 말기 1351~1392년',
  '1170': 'PDF 41쪽(인쇄 34쪽) <표 15> 고려 시대 구분: 무신집권기 1170~1270년',
  '1270': 'PDF 41쪽(인쇄 34쪽) <표 15> 고려 시대 구분: 원 간섭기 1270~1351년',
  '1392': 'PDF 41쪽(인쇄 34쪽) <표 15> 고려 시대 구분: 말기 1351~1392년',
  '1910': 'PDF 58쪽 조선 단원 연표(1392~1910, 조정자가 그림으로 확인) · 조선 복습 범위는 철종까지'
};

/* 교재 원문 PDF 41쪽 <표 15> 고려 시대 구분 — 화면 그림(2026-10-09 조정자 렌더)과 글을 함께 확인. 몽골(원)은 무신집권기·원 간섭기 두 칸에 걸침 */
const GORYEO_TB15 = [
  { key: 'early', no: '①', name: '고려 초기', years: '918~1018년', from: 918, to: 1018, power: '호족', events: ['왕건: 고려 건국', '광종: 과거/노비안검법', '성종: 최승로 시무28조 (거란 1차, 서희)', '현종: 거란 침입 (2차 양규, 3차 강감찬)'], invader: '거란(요)' },
  { key: 'munbeol', no: '②', name: '문벌귀족 시기', years: '1018~1170년', from: 1018, to: 1170, power: '문벌 귀족', events: ['최충 9재 학당', '윤관 동북9성', '이자겸의 난', '묘청의 난'], invader: '여진(금)' },
  { key: 'musin', no: '③', name: '무신집권기', years: '1170~1270년', from: 1170, to: 1270, power: '무신', events: ['정중부, 이의민', '조위총의 난', '최충헌, 최우', '김사미·효심/만적', '삼별초 항쟁'], invader: '몽골(원)' },
  { key: 'won', no: '④', name: '원 간섭기', years: '1270~1351년', from: 1270, to: 1351, power: '권문세족', events: ['정동행성', '공녀, 응방, 몽골풍', '공민왕: 쌍성총관부 탈환, 전민변정도감', '신진사대부 성장'], invader: '몽골(원)' },
  { key: 'late', no: '⑤', name: '고려 말', years: '1351~1392년', from: 1351, to: 1392, power: '신진사대부, 신흥무인', events: ['홍건적, 왜구 : 이성계, 최영, 최무선', '요동정벌 → 위화도회군', '과전법'], invader: '홍건적, 왜구' }
];
/* 교재 원문 PDF 58쪽 ‘1. 조선 전기’(태조~명종) · 63쪽 ‘2. 조선 후기’(선조~철종): 교재의 공식 구분은 둘뿐(재위 연도 없이 같은 너비) */
const JOSEON_BOOK = [
  { key: 'early', no: '①', name: '조선 전기', years: '태조~명종', weight: 1 },
  { key: 'late', no: '②', name: '조선 후기', years: '선조~철종', weight: 1 }
];
const TIMELINES = { GORYEO_TB15, JOSEON_BOOK, PREHISTORY_FLOW: ANCIENT.PREHISTORY_FLOW, BAEKJE_FLOW: BAEKJE.BAEKJE_FLOW, SAMGUK_FLOW: SAMGUK.SAMGUK_FLOW, NAMBUK_FLOW: NAMBUK.NAMBUK_FLOW };
const TIMELINE_SOURCE = { GORYEO_TB15: '교재 원문 PDF 41쪽(인쇄 34쪽) <표 15> 고려 시대 구분', JOSEON_BOOK: '교재 원문 PDF 58쪽 1. 조선 전기(태조~명종) · 63쪽 2. 조선 후기(선조~철종)' };

/* 이번 전달에서 새 시기별 요약으로 재생하는 묶음. 나머지는 초안으로만 만들고(문서·적용 범위에 초안 표시) 기존 복습 화면을 그대로 쓴다 */
const ENABLED = ['goryeo', 'joseon', 'prehistory', 'gojoseon', 'baekje', 'samguk', 'nambuk'];

module.exports = { PLAN, ANCIENT_PARTS, PDF_CITED_YEARS, TIMELINES, TIMELINE_SOURCE, ENABLED };
