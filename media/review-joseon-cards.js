/* 조선 교재 핵심140행을 실제 표시 카드로 보존합니다. 공통·혼합 주제는 전기/후기 양쪽에 포함합니다. */
(function(root){'use strict';var deck={
  "era": "joseon",
  "title": "조선 시대",
  "sources": [
    "media/textbook-notes.js",
    "media/study-notes.js",
    "media/lecture-flow-joseon.js",
    "media/quiz-catalog.js",
    "media/review-book/data/unit04.js",
    "index.html"
  ],
  "refFormat": {
    "tb": "tb:그룹:행 (textbook.core, 0부터)",
    "qz": "qz:퀴즈 id",
    "on": "on:joseon-early|late:섹션:항목 (originalNotes, 0부터)",
    "bk": "bk:교재 쪽 이미지 id"
  },
  "outline": [
    {
      "no": 1,
      "id": "jo-01",
      "stage": "목차",
      "topic": "목차",
      "sec": 7
    },
    {
      "no": 2,
      "id": "jo-02",
      "stage": "전기 왕과 제도 정비",
      "topic": "건국 · 이성계와 정도전",
      "sec": 8
    },
    {
      "no": 3,
      "id": "jo-03",
      "stage": "전기 왕과 제도 정비",
      "topic": "태종 · 왕권 강화",
      "sec": 8
    },
    {
      "no": 4,
      "id": "jo-04",
      "stage": "전기 왕과 제도 정비",
      "topic": "세종 · 정치·전세·학문",
      "sec": 8
    },
    {
      "no": 5,
      "id": "jo-05",
      "stage": "전기 왕과 제도 정비",
      "topic": "세종 · 북방 개척과 대일 관계",
      "sec": 8
    },
    {
      "no": 6,
      "id": "jo-06",
      "stage": "전기 왕과 제도 정비",
      "topic": "계유정난과 세조",
      "sec": 8
    },
    {
      "no": 7,
      "id": "jo-07",
      "stage": "전기 왕과 제도 정비",
      "topic": "성종 · 경국대전과 홍문관",
      "sec": 8
    },
    {
      "no": 8,
      "id": "jo-08",
      "stage": "사화·사림·붕당",
      "topic": "사화 4개 · 연도·왕·계기",
      "sec": 8
    },
    {
      "no": 9,
      "id": "jo-09",
      "stage": "사화·사림·붕당",
      "topic": "중종 · 조광조의 개혁",
      "sec": 8
    },
    {
      "no": 10,
      "id": "jo-10",
      "stage": "사화·사림·붕당",
      "topic": "선조 · 붕당의 시작",
      "sec": 8
    },
    {
      "no": 11,
      "id": "jo-11",
      "stage": "양난과 반정",
      "topic": "전쟁과 반정 연표",
      "sec": 8
    },
    {
      "no": 12,
      "id": "jo-12",
      "stage": "양난과 반정",
      "topic": "임진왜란 · 인물과 전투",
      "sec": 8
    },
    {
      "no": 13,
      "id": "jo-13",
      "stage": "양난과 반정",
      "topic": "광해군 · 외교와 왕실 갈등",
      "sec": 8
    },
    {
      "no": 14,
      "id": "jo-14",
      "stage": "양난과 반정",
      "topic": "대동법 · 인물과 기관",
      "sec": 8
    },
    {
      "no": 15,
      "id": "jo-15",
      "stage": "양난과 반정",
      "topic": "인조 · 이괄의 난·정묘호란·영정법",
      "sec": 8
    },
    {
      "no": 16,
      "id": "jo-16",
      "stage": "양난과 반정",
      "topic": "병자호란 · 항전과 화친",
      "sec": 8
    },
    {
      "no": 17,
      "id": "jo-17",
      "stage": "정치 변동과 후기 왕",
      "topic": "효종 · 북벌과 나선 정벌",
      "sec": 8
    },
    {
      "no": 18,
      "id": "jo-18",
      "stage": "정치 변동과 후기 왕",
      "topic": "현종 예송 · 숙종 환국",
      "sec": 8
    },
    {
      "no": 19,
      "id": "jo-19",
      "stage": "정치 변동과 후기 왕",
      "topic": "영조 · 탕평과 균역법",
      "sec": 8
    },
    {
      "no": 20,
      "id": "jo-20",
      "stage": "정치 변동과 후기 왕",
      "topic": "정조 · 규장각과 개혁",
      "sec": 8
    },
    {
      "no": 21,
      "id": "jo-21",
      "stage": "정치 변동과 후기 왕",
      "topic": "세도정치기 · 순조와 철종",
      "sec": 8
    },
    {
      "no": 22,
      "id": "jo-22",
      "stage": "통치 기구·토지·세금 (시대 횡단)",
      "topic": "중앙 기구 ① 왕명·사법·수도·교육·역사",
      "sec": 8
    },
    {
      "no": 23,
      "id": "jo-23",
      "stage": "통치 기구·토지·세금 (시대 횡단)",
      "topic": "중앙 기구 ② 삼사와 양사",
      "sec": 8
    },
    {
      "no": 24,
      "id": "jo-24",
      "stage": "통치 기구·토지·세금 (시대 횡단)",
      "topic": "지방과 향촌 · 자치와 교육",
      "sec": 8
    },
    {
      "no": 25,
      "id": "jo-25",
      "stage": "통치 기구·토지·세금 (시대 횡단)",
      "topic": "토지 제도의 흐름",
      "sec": 8
    },
    {
      "no": 26,
      "id": "jo-26",
      "stage": "통치 기구·토지·세금 (시대 횡단)",
      "topic": "세금 3종 · 전세·공납·군역",
      "sec": 8
    },
    {
      "no": 27,
      "id": "jo-27",
      "stage": "경제·사회 (조선 후기, 시기 겹침)",
      "topic": "경제의 변화 · 농업·상업·광업·화폐",
      "sec": 8
    },
    {
      "no": 28,
      "id": "jo-28",
      "stage": "경제·사회 (조선 후기, 시기 겹침)",
      "topic": "신분과 사회의 변화 · 서민 문화·종교",
      "sec": 8
    },
    {
      "no": 29,
      "id": "jo-29",
      "stage": "문화·학문·기록 (시대 횡단)",
      "topic": "전기 왕들의 문화 사업",
      "sec": 8
    },
    {
      "no": 30,
      "id": "jo-30",
      "stage": "문화·학문·기록 (시대 횡단)",
      "topic": "서원과 성리학자",
      "sec": 8
    },
    {
      "no": 31,
      "id": "jo-31",
      "stage": "문화·학문·기록 (시대 횡단)",
      "topic": "기록물과 대외 사절",
      "sec": 8
    },
    {
      "no": 32,
      "id": "jo-32",
      "stage": "문화·학문·기록 (시대 횡단)",
      "topic": "실학 ① 토지 개혁론과 정약용",
      "sec": 8
    },
    {
      "no": 33,
      "id": "jo-33",
      "stage": "문화·학문·기록 (시대 횡단)",
      "topic": "실학 ② 북학·상공업·백과·역법",
      "sec": 8
    },
    {
      "no": 34,
      "id": "jo-34",
      "stage": "문화·학문·기록 (시대 횡단)",
      "topic": "역사서와 지도",
      "sec": 8
    },
    {
      "no": 35,
      "id": "jo-35",
      "stage": "문화·학문·기록 (시대 횡단)",
      "topic": "후기 왕의 편찬 · 양명학 · 서화",
      "sec": 8
    },
    {
      "no": 36,
      "id": "jo-36",
      "stage": "전체 정리",
      "topic": "전체 정리",
      "sec": 9
    }
  ],
  "cards": [
    {
      "id": "jo-01",
      "kind": "outline",
      "stage": "cross",
      "era": "조선",
      "topic": "목차",
      "sub": "1388–1862 · 왕 순서 + 시대를 가로지르는 주제",
      "sec": 7,
      "points": [
        "전기 왕 → 사화·사림 → 양난 → 정치 변동 → 후기 왕",
        "기구·토지·세금·경제·사회·문화는 시대 횡단 정리",
        "마지막 카드: 전체 정리"
      ],
      "refs": [
        "tb:0:0",
        "tb:3:0",
        "tb:6:0",
        "tb:16:0",
        "tb:17:0"
      ],
      "quiz": [],
      "notes": [],
      "aux": [
        {
          "src": "flow",
          "text": "다섯 흐름은 왕이 이어지는 순서, 경제·사회는 여러 왕 대에 걸친 주제별 정리"
        }
      ],
      "stageLabel": "목차",
      "book": [],
      "core": [
        {
          "ref": "tb:0:0",
          "group": "건국과 태종",
          "topic": "위화도 회군 · 과전법",
          "features": "고려 말 이성계 세력이 권력과 토지 제도를 장악"
        },
        {
          "ref": "tb:3:0",
          "group": "사화 4개 · 연도 · 왕 · 계기",
          "topic": "무오사화",
          "features": "1498 · 연산군 · 김종직의 조의제문 문제"
        },
        {
          "ref": "tb:6:0",
          "group": "전쟁과 반정 · 연도 · 왕 · 계기",
          "topic": "임진왜란",
          "features": "1592 · 선조 · 일본의 침입"
        },
        {
          "ref": "tb:16:0",
          "group": "영조 · 정조",
          "topic": "영조 · 탕평비",
          "features": "붕당 다툼을 경계"
        },
        {
          "ref": "tb:17:0",
          "group": "세도정치기",
          "topic": "순조 · 공노비 해방",
          "features": "1801 · 내수사·중앙 관청의 납공 노비 해방(지방 관노비 등은 남음)"
        }
      ]
    },
    {
      "id": "jo-02",
      "stage": "early",
      "era": "조선 · 건국",
      "topic": "건국 · 이성계와 정도전",
      "sub": "고려 말 1388 위화도 회군 → 1392 조선 건국",
      "sec": 8,
      "points": [
        "이성계 → 위화도 회군 → 과전법으로 권력·토지 장악",
        "정도전 → 조선경국전(통치 구상)·불씨잡변(불교 비판)",
        "정도전은 1차 왕자의 난(1398) 때 제거"
      ],
      "refs": [
        "tb:0:0",
        "tb:0:1"
      ],
      "quiz": [
        "qz:legacy-joseon-early-004",
        "qz:legacy-joseon-early-013"
      ],
      "notes": [
        "on:joseon-early:0:0"
      ],
      "aux": [
        {
          "src": "flow",
          "text": "1388 위화도 회군 → 1391 과전법 → 1392 조선 건국"
        },
        {
          "src": "on:joseon-early:0:0",
          "text": "건국 뒤 한성 도읍"
        },
        {
          "src": "qz:legacy-joseon-early-013",
          "text": "조선경국전 = 재상 중심 정치 강조"
        }
      ],
      "stageLabel": "전기 왕과 제도 정비",
      "book": [
        "bk:u04_p02",
        "bk:u04_p04",
        "bk:u04_p06"
      ],
      "core": [
        {
          "ref": "tb:0:0",
          "group": "건국과 태종",
          "topic": "위화도 회군 · 과전법",
          "features": "고려 말 이성계 세력이 권력과 토지 제도를 장악"
        },
        {
          "ref": "tb:0:1",
          "group": "건국과 태종",
          "topic": "정도전 · 조선경국전 · 불씨잡변",
          "features": "통치 구상 / 불교 비판"
        }
      ]
    },
    {
      "era": "조선 · 건국",
      "topic": "건국과 태종",
      "sub": "핵심 관계 · 위화도 회군 · 과전법",
      "sec": 8,
      "points": [
        "위화도 회군 · 과전법",
        "고려 말 이성계 세력이 권력과 토지 제도를 장악"
      ],
      "refs": [
        "tb:0:0"
      ],
      "stage": "early"
    },
    {
      "era": "조선 · 건국",
      "topic": "건국과 태종",
      "sub": "핵심 관계 · 정도전 · 조선경국전 · 불씨잡변",
      "sec": 8,
      "points": [
        "정도전 · 조선경국전 · 불씨잡변",
        "통치 구상 / 불교 비판"
      ],
      "refs": [
        "tb:0:1"
      ],
      "stage": "early"
    },
    {
      "id": "jo-03",
      "stage": "early",
      "era": "조선 · 건국",
      "topic": "태종 · 왕권 강화",
      "sub": "3대 태종 · 두 차례 왕자의 난 뒤 즉위",
      "sec": 8,
      "points": [
        "태종 → 6조 직계제: 6조가 왕에게 직보 → 왕권 강화",
        "태종 → 사간원 독립(간쟁) · 호패법 · 저화",
        "6조 직계제는 태종·세조 / 의정부 서사제는 세종"
      ],
      "refs": [
        "tb:0:2",
        "tb:0:3",
        "tb:0:4",
        "tb:0:5"
      ],
      "quiz": [
        "qz:legacy-joseon-early-009",
        "qz:legacy-joseon-early-020"
      ],
      "notes": [
        "on:joseon-early:0:1"
      ],
      "aux": [
        {
          "src": "on:joseon-early:0:1",
          "text": "태종 묶음에 양전도 포함"
        },
        {
          "src": "qz:legacy-joseon-early-009",
          "text": "문하부 폐지, 낭사를 사간원으로 독립"
        }
      ],
      "stageLabel": "전기 왕과 제도 정비",
      "book": [
        "bk:u04_p02",
        "bk:u04_p04",
        "bk:u04_p06"
      ],
      "core": [
        {
          "ref": "tb:0:2",
          "group": "건국과 태종",
          "topic": "태종 · 6조 직계제",
          "features": "6조가 왕에게 바로 보고 → 왕권 강화"
        },
        {
          "ref": "tb:0:3",
          "group": "건국과 태종",
          "topic": "태종 · 사간원",
          "features": "간쟁 기관을 따로 세움"
        },
        {
          "ref": "tb:0:4",
          "group": "건국과 태종",
          "topic": "태종 · 호패법",
          "features": "16세 이상 남자에게 신분 패"
        },
        {
          "ref": "tb:0:5",
          "group": "건국과 태종",
          "topic": "태종 · 저화",
          "features": "종이돈 발행"
        }
      ]
    },
    {
      "era": "조선 · 건국",
      "topic": "건국과 태종",
      "sub": "핵심 관계 · 태종 · 6조 직계제",
      "sec": 8,
      "points": [
        "태종 · 6조 직계제",
        "6조가 왕에게 바로 보고 → 왕권 강화"
      ],
      "refs": [
        "tb:0:2"
      ],
      "stage": "early"
    },
    {
      "era": "조선 · 건국",
      "topic": "건국과 태종",
      "sub": "핵심 관계 · 태종 · 사간원",
      "sec": 8,
      "points": [
        "태종 · 사간원",
        "간쟁 기관을 따로 세움"
      ],
      "refs": [
        "tb:0:3"
      ],
      "stage": "early"
    },
    {
      "era": "조선 · 건국",
      "topic": "건국과 태종",
      "sub": "핵심 관계 · 태종 · 호패법",
      "sec": 8,
      "points": [
        "태종 · 호패법",
        "16세 이상 남자에게 신분 패"
      ],
      "refs": [
        "tb:0:4"
      ],
      "stage": "early"
    },
    {
      "era": "조선 · 건국",
      "topic": "건국과 태종",
      "sub": "핵심 관계 · 태종 · 저화",
      "sec": 8,
      "points": [
        "태종 · 저화",
        "종이돈 발행"
      ],
      "refs": [
        "tb:0:5"
      ],
      "stage": "early"
    },
    {
      "id": "jo-04",
      "stage": "early",
      "era": "조선 · 세종",
      "topic": "세종 · 정치·전세·학문",
      "sub": "4대 세종 · 1418–1450",
      "sec": 8,
      "points": [
        "세종 → 의정부 서사제: 재상 논의 뒤 왕에게 보고",
        "세종 → 연분 9등법(풍흉)·전분 6등법(땅 비옥도)",
        "세종 → 집현전(학문 연구) · 훈민정음(새 문자)"
      ],
      "refs": [
        "tb:1:0",
        "tb:1:1",
        "tb:1:2"
      ],
      "quiz": [
        "qz:legacy-joseon-early-002",
        "qz:legacy-joseon-late-062"
      ],
      "notes": [
        "on:joseon-early:0:2",
        "on:joseon-early:2:2"
      ],
      "aux": [
        {
          "src": "flow",
          "text": "훈민정음 1443"
        },
        {
          "src": "qz:legacy-joseon-late-062",
          "text": "집현전은 세조 때 폐지"
        }
      ],
      "stageLabel": "전기 왕과 제도 정비",
      "book": [
        "bk:u04_p03",
        "bk:u04_p04"
      ],
      "core": [
        {
          "ref": "tb:1:0",
          "group": "세종",
          "topic": "세종 · 의정부 서사제",
          "features": "재상 논의를 거쳐 왕에게 보고"
        },
        {
          "ref": "tb:1:1",
          "group": "세종",
          "topic": "세종 · 연분 9등법 · 전분 6등법",
          "features": "풍흉 9단계·땅 6등급으로 전세 차등"
        },
        {
          "ref": "tb:1:2",
          "group": "세종",
          "topic": "세종 · 집현전 · 훈민정음",
          "features": "학문 연구 기관 / 새 문자"
        }
      ]
    },
    {
      "era": "조선 · 세종",
      "topic": "세종",
      "sub": "핵심 관계 · 세종 · 의정부 서사제",
      "sec": 8,
      "points": [
        "세종 · 의정부 서사제",
        "재상 논의를 거쳐 왕에게 보고"
      ],
      "refs": [
        "tb:1:0"
      ],
      "stage": "early"
    },
    {
      "era": "조선 · 세종",
      "topic": "세종",
      "sub": "핵심 관계 · 세종 · 연분 9등법 · 전분 6등법",
      "sec": 8,
      "points": [
        "세종 · 연분 9등법 · 전분 6등법",
        "풍흉 9단계·땅 6등급으로 전세 차등"
      ],
      "refs": [
        "tb:1:1"
      ],
      "stage": "early"
    },
    {
      "era": "조선 · 세종",
      "topic": "세종",
      "sub": "핵심 관계 · 세종 · 집현전 · 훈민정음",
      "sec": 8,
      "points": [
        "세종 · 집현전 · 훈민정음",
        "학문 연구 기관 / 새 문자"
      ],
      "refs": [
        "tb:1:2"
      ],
      "stage": "early"
    },
    {
      "id": "jo-05",
      "stage": "early",
      "era": "조선 · 세종",
      "topic": "세종 · 북방 개척과 대일 관계",
      "sub": "4군 6진 · 쓰시마 정벌 · 계해약조",
      "sec": 8,
      "points": [
        "최윤덕 → 4군 · 김종서 → 6진: 북방 개척",
        "이종무 → 쓰시마(왜구 근거지) 정벌 → 3포 개방",
        "계해약조 → 일본과 교역 규모 약속"
      ],
      "refs": [
        "tb:1:3",
        "tb:1:4"
      ],
      "quiz": [
        "qz:legacy-joseon-early-007",
        "qz:legacy-joseon-early-012",
        "qz:legacy-joseon-early-017",
        "qz:legacy-joseon-early-023",
        "qz:legacy-joseon-late-069",
        "qz:legacy-joseon-late-071"
      ],
      "notes": [
        "on:joseon-early:3:0"
      ],
      "aux": [
        {
          "src": "qz:legacy-joseon-late-071",
          "text": "6진 개척(두만강 일대) 상대 = 여진"
        },
        {
          "src": "qz:legacy-joseon-early-023",
          "text": "최윤덕이 이만주 부대 정벌"
        }
      ],
      "stageLabel": "전기 왕과 제도 정비",
      "book": [
        "bk:u04_p03",
        "bk:u04_p04",
        "bk:u04_p06",
        "bk:u04_p16"
      ],
      "core": [
        {
          "ref": "tb:1:3",
          "group": "세종",
          "topic": "세종 · 4군 · 6진",
          "features": "최윤덕 4군, 김종서 6진 — 북방 개척"
        },
        {
          "ref": "tb:1:4",
          "group": "세종",
          "topic": "세종 · 쓰시마섬 · 계해약조",
          "features": "왜구 근거지 정벌 / 교역 규모 약속"
        }
      ]
    },
    {
      "era": "조선 · 세종",
      "topic": "세종",
      "sub": "핵심 관계 · 세종 · 4군 · 6진",
      "sec": 8,
      "points": [
        "세종 · 4군 · 6진",
        "최윤덕 4군, 김종서 6진 — 북방 개척"
      ],
      "refs": [
        "tb:1:3"
      ],
      "stage": "early"
    },
    {
      "era": "조선 · 세종",
      "topic": "세종",
      "sub": "핵심 관계 · 세종 · 쓰시마섬 · 계해약조",
      "sec": 8,
      "points": [
        "세종 · 쓰시마섬 · 계해약조",
        "왜구 근거지 정벌 / 교역 규모 약속"
      ],
      "refs": [
        "tb:1:4"
      ],
      "stage": "early"
    },
    {
      "id": "jo-06",
      "stage": "early",
      "era": "조선 · 세조",
      "topic": "계유정난과 세조",
      "sub": "6대 단종 → 7대 세조 · 1453–1455",
      "sec": 8,
      "points": [
        "1453 계유정난(단종 때) → 1455 수양대군 세조 즉위",
        "세조 → 직전법: 현직 관리에게만 수조권",
        "세조 때 이시애의 난(길주) / 이징옥의 난은 단종 때"
      ],
      "refs": [
        "tb:2:0",
        "tb:2:1",
        "tb:2:2",
        "tb:2:3"
      ],
      "quiz": [
        "qz:legacy-joseon-early-000",
        "qz:legacy-joseon-early-006",
        "qz:legacy-joseon-early-010",
        "qz:legacy-joseon-early-015",
        "qz:legacy-joseon-early-016",
        "qz:legacy-joseon-early-021",
        "qz:legacy-joseon-late-070"
      ],
      "notes": [
        "on:joseon-early:0:3"
      ],
      "aux": [
        {
          "src": "on:joseon-early:0:3",
          "text": "세조: 사육신 처형·집현전 폐지"
        },
        {
          "src": "qz:legacy-joseon-early-015",
          "text": "직전법과 함께 수신전·휼양전 폐지"
        },
        {
          "src": "qz:legacy-joseon-late-070",
          "text": "진관 체제 → 세조 (퀴즈에만 있음, uncertain)"
        }
      ],
      "stageLabel": "전기 왕과 제도 정비",
      "book": [
        "bk:u04_p03",
        "bk:u04_p04"
      ],
      "core": [
        {
          "ref": "tb:2:0",
          "group": "단종 · 세조 · 성종",
          "topic": "단종 · 계유정난",
          "features": "1453 · 단종 때 수양대군이 권력을 잡음"
        },
        {
          "ref": "tb:2:1",
          "group": "단종 · 세조 · 성종",
          "topic": "세조 즉위",
          "features": "1455 · 수양대군이 왕위에 오름(정난 2년 뒤)"
        },
        {
          "ref": "tb:2:2",
          "group": "단종 · 세조 · 성종",
          "topic": "세조 · 직전법",
          "features": "현직 관리에게만 수조권"
        },
        {
          "ref": "tb:2:3",
          "group": "단종 · 세조 · 성종",
          "topic": "세조 · 이시애의 난",
          "features": "길주를 근거로 일어난 반란"
        }
      ]
    },
    {
      "era": "조선 · 세조",
      "topic": "단종 · 세조 · 성종",
      "sub": "핵심 관계 · 단종 · 계유정난",
      "sec": 8,
      "points": [
        "단종 · 계유정난",
        "1453 · 단종 때 수양대군이 권력을 잡음"
      ],
      "refs": [
        "tb:2:0"
      ],
      "stage": "early"
    },
    {
      "era": "조선 · 세조",
      "topic": "단종 · 세조 · 성종",
      "sub": "핵심 관계 · 세조 즉위",
      "sec": 8,
      "points": [
        "세조 즉위",
        "1455 · 수양대군이 왕위에 오름(정난 2년 뒤)"
      ],
      "refs": [
        "tb:2:1"
      ],
      "stage": "early"
    },
    {
      "era": "조선 · 세조",
      "topic": "단종 · 세조 · 성종",
      "sub": "핵심 관계 · 세조 · 직전법",
      "sec": 8,
      "points": [
        "세조 · 직전법",
        "현직 관리에게만 수조권"
      ],
      "refs": [
        "tb:2:2"
      ],
      "stage": "early"
    },
    {
      "era": "조선 · 세조",
      "topic": "단종 · 세조 · 성종",
      "sub": "핵심 관계 · 세조 · 이시애의 난",
      "sec": 8,
      "points": [
        "세조 · 이시애의 난",
        "길주를 근거로 일어난 반란"
      ],
      "refs": [
        "tb:2:3"
      ],
      "stage": "early"
    },
    {
      "id": "jo-07",
      "stage": "early",
      "era": "조선 · 성종",
      "topic": "성종 · 경국대전과 홍문관",
      "sub": "8대 예종 → 9대 성종",
      "sec": 8,
      "points": [
        "성종 → 경국대전: 나라 운영의 기본 법전 완성",
        "성종 → 홍문관: 경연과 학문 자문",
        "성종 때 중앙에 들어온 사림 → 훈구와 충돌(사화)"
      ],
      "refs": [
        "tb:2:4",
        "tb:2:5"
      ],
      "quiz": [
        "qz:legacy-joseon-early-001",
        "qz:legacy-joseon-early-014"
      ],
      "notes": [
        "on:joseon-early:0:4"
      ],
      "aux": [
        {
          "src": "on:joseon-early:0:4",
          "text": "예종: 남이 처형 / 성종: 사림 등용"
        },
        {
          "src": "qz:legacy-joseon-early-014",
          "text": "유자광의 고변 → 남이 처형 = 예종"
        }
      ],
      "stageLabel": "전기 왕과 제도 정비",
      "book": [
        "bk:u04_p03",
        "bk:u04_p04",
        "bk:u04_p06"
      ],
      "core": [
        {
          "ref": "tb:2:4",
          "group": "단종 · 세조 · 성종",
          "topic": "성종 · 경국대전",
          "features": "나라 운영의 기본 법전 완성"
        },
        {
          "ref": "tb:2:5",
          "group": "단종 · 세조 · 성종",
          "topic": "성종 · 홍문관",
          "features": "경연과 학문 자문을 맡은 기관"
        }
      ]
    },
    {
      "era": "조선 · 성종",
      "topic": "단종 · 세조 · 성종",
      "sub": "핵심 관계 · 성종 · 경국대전",
      "sec": 8,
      "points": [
        "성종 · 경국대전",
        "나라 운영의 기본 법전 완성"
      ],
      "refs": [
        "tb:2:4"
      ],
      "stage": "early"
    },
    {
      "era": "조선 · 성종",
      "topic": "단종 · 세조 · 성종",
      "sub": "핵심 관계 · 성종 · 홍문관",
      "sec": 8,
      "points": [
        "성종 · 홍문관",
        "경연과 학문 자문을 맡은 기관"
      ],
      "refs": [
        "tb:2:5"
      ],
      "stage": "early"
    },
    {
      "id": "jo-08",
      "stage": "early",
      "era": "조선 · 사화",
      "topic": "사화 4개 · 연도·왕·계기",
      "sub": "1498–1545 · 무갑기을 = 연연중명",
      "sec": 8,
      "points": [
        "무오(1498)·갑자(1504) → 연산군 → 중종반정",
        "기묘(1519) → 중종 · 을사(1545) → 명종",
        "계기: 조의제문 / 폐비 윤씨 / 조광조 / 외척"
      ],
      "refs": [
        "tb:3:0",
        "tb:3:1",
        "tb:3:2",
        "tb:3:3"
      ],
      "quiz": [
        "qz:legacy-joseon-early-005",
        "qz:legacy-joseon-early-008",
        "qz:legacy-joseon-early-011",
        "qz:legacy-joseon-early-022"
      ],
      "notes": [
        "on:joseon-early:1:0",
        "on:joseon-early:1:3"
      ],
      "aux": [
        {
          "src": "flow",
          "text": "사화 순서일 뿐 왕위 계승은 중종 → 인종 → 명종"
        },
        {
          "src": "flow",
          "text": "1506 중종반정으로 연산군 폐위"
        }
      ],
      "stageLabel": "사화·사림·붕당",
      "book": [
        "bk:u04_p03",
        "bk:u04_p05",
        "bk:u04_p06"
      ],
      "core": [
        {
          "ref": "tb:3:0",
          "group": "사화 4개 · 연도 · 왕 · 계기",
          "topic": "무오사화",
          "features": "1498 · 연산군 · 김종직의 조의제문 문제"
        },
        {
          "ref": "tb:3:1",
          "group": "사화 4개 · 연도 · 왕 · 계기",
          "topic": "갑자사화",
          "features": "1504 · 연산군 · 폐비 윤씨 사건"
        },
        {
          "ref": "tb:3:2",
          "group": "사화 4개 · 연도 · 왕 · 계기",
          "topic": "기묘사화",
          "features": "1519 · 중종 · 조광조 개혁에 대한 훈구 반발"
        },
        {
          "ref": "tb:3:3",
          "group": "사화 4개 · 연도 · 왕 · 계기",
          "topic": "을사사화",
          "features": "1545 · 명종 · 외척 윤임·윤원형 세력 대립"
        }
      ]
    },
    {
      "era": "조선 · 사화",
      "topic": "사화 4개 · 연도 · 왕 · 계기",
      "sub": "핵심 관계 · 무오사화",
      "sec": 8,
      "points": [
        "무오사화",
        "1498 · 연산군 · 김종직의 조의제문 문제"
      ],
      "refs": [
        "tb:3:0"
      ],
      "stage": "early"
    },
    {
      "era": "조선 · 사화",
      "topic": "사화 4개 · 연도 · 왕 · 계기",
      "sub": "핵심 관계 · 갑자사화",
      "sec": 8,
      "points": [
        "갑자사화",
        "1504 · 연산군 · 폐비 윤씨 사건"
      ],
      "refs": [
        "tb:3:1"
      ],
      "stage": "early"
    },
    {
      "era": "조선 · 사화",
      "topic": "사화 4개 · 연도 · 왕 · 계기",
      "sub": "핵심 관계 · 기묘사화",
      "sec": 8,
      "points": [
        "기묘사화",
        "1519 · 중종 · 조광조 개혁에 대한 훈구 반발"
      ],
      "refs": [
        "tb:3:2"
      ],
      "stage": "early"
    },
    {
      "era": "조선 · 사화",
      "topic": "사화 4개 · 연도 · 왕 · 계기",
      "sub": "핵심 관계 · 을사사화",
      "sec": 8,
      "points": [
        "을사사화",
        "1545 · 명종 · 외척 윤임·윤원형 세력 대립"
      ],
      "refs": [
        "tb:3:3"
      ],
      "stage": "early"
    },
    {
      "id": "jo-09",
      "stage": "early",
      "era": "조선 · 사화",
      "topic": "중종 · 조광조의 개혁",
      "sub": "11대 중종 · 1519 기묘사화",
      "sec": 8,
      "points": [
        "조광조 → 현량과(추천 선발) · 위훈 삭제 주장",
        "위훈 삭제에 공신 반발 → 기묘사화로 일파 제거",
        "조광조는 소학·향약 보급도 추진"
      ],
      "refs": [
        "tb:4:0",
        "tb:4:1",
        "tb:4:2"
      ],
      "quiz": [
        "qz:legacy-joseon-early-003",
        "qz:legacy-joseon-early-018"
      ],
      "notes": [
        "on:joseon-early:1:1"
      ],
      "aux": [],
      "stageLabel": "사화·사림·붕당",
      "book": [
        "bk:u04_p03",
        "bk:u04_p05",
        "bk:u04_p06"
      ],
      "core": [
        {
          "ref": "tb:4:0",
          "group": "중종 · 조광조의 개혁",
          "topic": "조광조 · 현량과",
          "features": "추천으로 인재를 뽑으려 함"
        },
        {
          "ref": "tb:4:1",
          "group": "중종 · 조광조의 개혁",
          "topic": "조광조 · 위훈 삭제",
          "features": "공신의 부풀린 공로를 지우자는 주장"
        },
        {
          "ref": "tb:4:2",
          "group": "중종 · 조광조의 개혁",
          "topic": "기묘사화",
          "features": "이 개혁에 반발한 세력이 조광조 일파를 몰아냄"
        }
      ]
    },
    {
      "era": "조선 · 사화",
      "topic": "중종 · 조광조의 개혁",
      "sub": "핵심 관계 · 조광조 · 현량과",
      "sec": 8,
      "points": [
        "조광조 · 현량과",
        "추천으로 인재를 뽑으려 함"
      ],
      "refs": [
        "tb:4:0"
      ],
      "stage": "early"
    },
    {
      "era": "조선 · 사화",
      "topic": "중종 · 조광조의 개혁",
      "sub": "핵심 관계 · 조광조 · 위훈 삭제",
      "sec": 8,
      "points": [
        "조광조 · 위훈 삭제",
        "공신의 부풀린 공로를 지우자는 주장"
      ],
      "refs": [
        "tb:4:1"
      ],
      "stage": "early"
    },
    {
      "era": "조선 · 사화",
      "topic": "중종 · 조광조의 개혁",
      "sub": "핵심 관계 · 기묘사화",
      "sec": 8,
      "points": [
        "기묘사화",
        "이 개혁에 반발한 세력이 조광조 일파를 몰아냄"
      ],
      "refs": [
        "tb:4:2"
      ],
      "stage": "early"
    },
    {
      "id": "jo-10",
      "stage": "late",
      "era": "조선 · 붕당",
      "topic": "선조 · 붕당의 시작",
      "sub": "14대 선조 · 1575–1589",
      "sec": 8,
      "points": [
        "이조전랑 자리 다툼 → 동인·서인 분열(1575)",
        "정여립 모반 사건 → 기축옥사(1589), 분열 뒤 사건",
        "세자 책봉 문제(정철 유배) → 동인이 남인·북인으로"
      ],
      "refs": [
        "tb:5:0",
        "tb:5:1",
        "tb:5:2"
      ],
      "quiz": [
        "qz:legacy-joseon-late-004",
        "qz:legacy-joseon-late-008"
      ],
      "notes": [
        "on:joseon-late:0:0"
      ],
      "aux": [
        {
          "src": "on:joseon-late:0:0",
          "text": "이조전랑 다툼의 두 인물: 김효원·심의겸"
        }
      ],
      "stageLabel": "사화·사림·붕당",
      "book": [
        "bk:u04_p08",
        "bk:u04_p10"
      ],
      "core": [
        {
          "ref": "tb:5:0",
          "group": "선조 · 붕당의 시작",
          "topic": "선조 · 이조전랑",
          "features": "인사 담당 자리를 둘러싼 다툼 → 동인·서인"
        },
        {
          "ref": "tb:5:1",
          "group": "선조 · 붕당의 시작",
          "topic": "정여립 모반 사건",
          "features": "선조 때 기축옥사의 발단이 된 사건"
        },
        {
          "ref": "tb:5:2",
          "group": "선조 · 붕당의 시작",
          "topic": "선조 · 동인의 분화",
          "features": "세자 책봉 문제(정철 유배) 갈등 뒤 남인·북인"
        }
      ]
    },
    {
      "era": "조선 · 붕당",
      "topic": "선조 · 붕당의 시작",
      "sub": "핵심 관계 · 선조 · 이조전랑",
      "sec": 8,
      "points": [
        "선조 · 이조전랑",
        "인사 담당 자리를 둘러싼 다툼 → 동인·서인"
      ],
      "refs": [
        "tb:5:0"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 붕당",
      "topic": "선조 · 붕당의 시작",
      "sub": "핵심 관계 · 정여립 모반 사건",
      "sec": 8,
      "points": [
        "정여립 모반 사건",
        "선조 때 기축옥사의 발단이 된 사건"
      ],
      "refs": [
        "tb:5:1"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 붕당",
      "topic": "선조 · 붕당의 시작",
      "sub": "핵심 관계 · 선조 · 동인의 분화",
      "sec": 8,
      "points": [
        "선조 · 동인의 분화",
        "세자 책봉 문제(정철 유배) 갈등 뒤 남인·북인"
      ],
      "refs": [
        "tb:5:2"
      ],
      "stage": "late"
    },
    {
      "id": "jo-11",
      "stage": "late",
      "era": "조선 · 양난",
      "topic": "전쟁과 반정 연표",
      "sub": "1592–1636 · 선조 → 광해군 → 인조",
      "sec": 8,
      "points": [
        "1592 임진왜란(선조·일본) → 1623 인조반정",
        "1627 정묘호란(후금) → 1636 병자호란(청)",
        "호란 둘 다 인조 · 반정으로 광해군 축출"
      ],
      "refs": [
        "tb:6:0",
        "tb:6:1",
        "tb:6:2",
        "tb:6:3"
      ],
      "quiz": [],
      "notes": [],
      "aux": [
        {
          "src": "flow",
          "text": "정묘호란은 형제 관계, 병자호란은 1637 삼전도 항복"
        }
      ],
      "stageLabel": "양난과 반정",
      "book": [
        "bk:u04_p12",
        "bk:u04_p13"
      ],
      "core": [
        {
          "ref": "tb:6:0",
          "group": "전쟁과 반정 · 연도 · 왕 · 계기",
          "topic": "임진왜란",
          "features": "1592 · 선조 · 일본의 침입"
        },
        {
          "ref": "tb:6:1",
          "group": "전쟁과 반정 · 연도 · 왕 · 계기",
          "topic": "인조반정",
          "features": "1623 · 인조 · 광해군을 몰아내고 즉위"
        },
        {
          "ref": "tb:6:2",
          "group": "전쟁과 반정 · 연도 · 왕 · 계기",
          "topic": "정묘호란",
          "features": "1627 · 인조 · 후금의 침입"
        },
        {
          "ref": "tb:6:3",
          "group": "전쟁과 반정 · 연도 · 왕 · 계기",
          "topic": "병자호란",
          "features": "1636 · 인조 · 청의 침입"
        }
      ]
    },
    {
      "era": "조선 · 양난",
      "topic": "전쟁과 반정 · 연도 · 왕 · 계기",
      "sub": "핵심 관계 · 임진왜란",
      "sec": 8,
      "points": [
        "임진왜란",
        "1592 · 선조 · 일본의 침입"
      ],
      "refs": [
        "tb:6:0"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 양난",
      "topic": "전쟁과 반정 · 연도 · 왕 · 계기",
      "sub": "핵심 관계 · 인조반정",
      "sec": 8,
      "points": [
        "인조반정",
        "1623 · 인조 · 광해군을 몰아내고 즉위"
      ],
      "refs": [
        "tb:6:1"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 양난",
      "topic": "전쟁과 반정 · 연도 · 왕 · 계기",
      "sub": "핵심 관계 · 정묘호란",
      "sec": 8,
      "points": [
        "정묘호란",
        "1627 · 인조 · 후금의 침입"
      ],
      "refs": [
        "tb:6:2"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 양난",
      "topic": "전쟁과 반정 · 연도 · 왕 · 계기",
      "sub": "핵심 관계 · 병자호란",
      "sec": 8,
      "points": [
        "병자호란",
        "1636 · 인조 · 청의 침입"
      ],
      "refs": [
        "tb:6:3"
      ],
      "stage": "late"
    },
    {
      "id": "jo-12",
      "stage": "late",
      "era": "조선 · 양난",
      "topic": "임진왜란 · 인물과 전투",
      "sub": "14대 선조 · 1592",
      "sec": 8,
      "points": [
        "신립 → 탄금대(충주) 배수진 → 패배",
        "이순신 한산도 · 권율 행주 · 김시민 진주",
        "의병 조헌 금산 · 정문부 북관 / 훈련도감 삼수병"
      ],
      "refs": [
        "tb:7:0",
        "tb:7:1",
        "tb:7:2",
        "tb:7:3",
        "tb:7:4"
      ],
      "quiz": [
        "qz:legacy-joseon-late-006",
        "qz:legacy-joseon-late-011",
        "qz:legacy-joseon-late-013",
        "qz:legacy-joseon-late-022",
        "qz:legacy-joseon-late-028",
        "qz:legacy-joseon-late-034",
        "qz:legacy-joseon-early-024",
        "qz:legacy-joseon-early-025",
        "qz:legacy-joseon-early-026",
        "qz:legacy-joseon-early-028",
        "qz:legacy-joseon-early-030",
        "qz:legacy-joseon-early-031"
      ],
      "notes": [
        "on:joseon-early:3:1"
      ],
      "aux": [
        {
          "src": "on:joseon-early:3:1",
          "text": "동래성 송상현 항전"
        },
        {
          "src": "qz:legacy-joseon-late-006",
          "text": "이덕형이 명에 청원사로 파견 (퀴즈에만 있음)"
        }
      ],
      "stageLabel": "양난과 반정",
      "book": [
        "bk:u04_p08",
        "bk:u04_p10"
      ],
      "core": [
        {
          "ref": "tb:7:0",
          "group": "임진왜란 · 선조",
          "topic": "선조 · 임진왜란",
          "features": "일본의 침략"
        },
        {
          "ref": "tb:7:1",
          "group": "임진왜란 · 선조",
          "topic": "신립 · 탄금대",
          "features": "충주에서 배수진을 쳤으나 패배"
        },
        {
          "ref": "tb:7:2",
          "group": "임진왜란 · 선조",
          "topic": "훈련도감",
          "features": "포수·사수·살수(삼수병)로 이룬 군대"
        },
        {
          "ref": "tb:7:3",
          "group": "임진왜란 · 선조",
          "topic": "이순신 · 권율 · 김시민",
          "features": "한산도 · 행주 · 진주 (지휘관과 전투)"
        },
        {
          "ref": "tb:7:4",
          "group": "임진왜란 · 선조",
          "topic": "조헌 · 정문부",
          "features": "금산의 의병 / 북관의 의병"
        }
      ]
    },
    {
      "era": "조선 · 양난",
      "topic": "임진왜란 · 선조",
      "sub": "핵심 관계 · 선조 · 임진왜란",
      "sec": 8,
      "points": [
        "선조 · 임진왜란",
        "일본의 침략"
      ],
      "refs": [
        "tb:7:0"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 양난",
      "topic": "임진왜란 · 선조",
      "sub": "핵심 관계 · 신립 · 탄금대",
      "sec": 8,
      "points": [
        "신립 · 탄금대",
        "충주에서 배수진을 쳤으나 패배"
      ],
      "refs": [
        "tb:7:1"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 양난",
      "topic": "임진왜란 · 선조",
      "sub": "핵심 관계 · 훈련도감",
      "sec": 8,
      "points": [
        "훈련도감",
        "포수·사수·살수(삼수병)로 이룬 군대"
      ],
      "refs": [
        "tb:7:2"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 양난",
      "topic": "임진왜란 · 선조",
      "sub": "핵심 관계 · 이순신 · 권율 · 김시민",
      "sec": 8,
      "points": [
        "이순신 · 권율 · 김시민",
        "한산도 · 행주 · 진주 (지휘관과 전투)"
      ],
      "refs": [
        "tb:7:3"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 양난",
      "topic": "임진왜란 · 선조",
      "sub": "핵심 관계 · 조헌 · 정문부",
      "sec": 8,
      "points": [
        "조헌 · 정문부",
        "금산의 의병 / 북관의 의병"
      ],
      "refs": [
        "tb:7:4"
      ],
      "stage": "late"
    },
    {
      "id": "jo-13",
      "stage": "late",
      "era": "조선 · 광해군",
      "topic": "광해군 · 외교와 왕실 갈등",
      "sub": "15대 광해군 · 1608–1623",
      "sec": 8,
      "points": [
        "광해군 → 중립외교: 명·후금 사이 균형(강홍립)",
        "광해군 → 기유약조: 일본과 교역 재개",
        "영창대군·인목대비 → 광해군 때 왕실 갈등"
      ],
      "refs": [
        "tb:8:0",
        "tb:8:1",
        "tb:8:2"
      ],
      "quiz": [
        "qz:legacy-joseon-late-000",
        "qz:legacy-joseon-late-020",
        "qz:legacy-joseon-late-033"
      ],
      "notes": [
        "on:joseon-late:0:1"
      ],
      "aux": [
        {
          "src": "on:joseon-late:0:1",
          "text": "강홍립이 사르후 전투에 참전"
        },
        {
          "src": "qz:legacy-joseon-late-033",
          "text": "영창대군을 죽이고 인목대비를 유폐"
        }
      ],
      "stageLabel": "양난과 반정",
      "book": [
        "bk:u04_p08",
        "bk:u04_p10"
      ],
      "core": [
        {
          "ref": "tb:8:0",
          "group": "광해군",
          "topic": "광해군 · 중립외교",
          "features": "명과 후금 사이에서 균형"
        },
        {
          "ref": "tb:8:1",
          "group": "광해군",
          "topic": "광해군 · 기유약조",
          "features": "일본과 교역 재개"
        },
        {
          "ref": "tb:8:2",
          "group": "광해군",
          "topic": "영창대군 · 인목대비",
          "features": "광해군 때의 왕실 갈등"
        }
      ]
    },
    {
      "era": "조선 · 광해군",
      "topic": "광해군",
      "sub": "핵심 관계 · 광해군 · 중립외교",
      "sec": 8,
      "points": [
        "광해군 · 중립외교",
        "명과 후금 사이에서 균형"
      ],
      "refs": [
        "tb:8:0"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 광해군",
      "topic": "광해군",
      "sub": "핵심 관계 · 광해군 · 기유약조",
      "sec": 8,
      "points": [
        "광해군 · 기유약조",
        "일본과 교역 재개"
      ],
      "refs": [
        "tb:8:1"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 광해군",
      "topic": "광해군",
      "sub": "핵심 관계 · 영창대군 · 인목대비",
      "sec": 8,
      "points": [
        "영창대군 · 인목대비",
        "광해군 때의 왕실 갈등"
      ],
      "refs": [
        "tb:8:2"
      ],
      "stage": "late"
    },
    {
      "id": "jo-14",
      "stage": "late",
      "era": "조선 · 광해군",
      "topic": "대동법 · 인물과 기관",
      "sub": "광해군 때 경기에서 시작 → 차츰 확대",
      "sec": 8,
      "points": [
        "이원익 → 대동법: 광해군 때 경기에서 시작",
        "김육 → 대동법 확대 건의",
        "선혜청 = 담당 관청 · 공인 = 관청 물품 조달 상인"
      ],
      "refs": [
        "tb:8:3",
        "tb:8:4",
        "tb:8:5"
      ],
      "quiz": [
        "qz:legacy-joseon-late-014",
        "qz:legacy-joseon-late-041",
        "qz:legacy-joseon-late-046"
      ],
      "notes": [
        "on:joseon-late:0:2"
      ],
      "aux": [
        {
          "src": "on:joseon-late:0:2",
          "text": "방납의 폐단 → 토산물 대신 쌀·동전 → 공인 등장"
        },
        {
          "src": "flow",
          "text": "1608 경기에서 시작, 한 왕이 전국에서 한꺼번에 시작한 제도 아님"
        },
        {
          "src": "qz:legacy-joseon-late-046",
          "text": "이원익이 선혜청을 두고 실시할 것을 주장"
        }
      ],
      "stageLabel": "양난과 반정",
      "book": [
        "bk:u04_p08",
        "bk:u04_p10",
        "bk:u04_p17"
      ],
      "core": [
        {
          "ref": "tb:8:3",
          "group": "광해군",
          "topic": "대동법 · 이원익",
          "features": "광해군 때 경기에서 시작, 그 뒤 차츰 확대"
        },
        {
          "ref": "tb:8:4",
          "group": "광해군",
          "topic": "김육",
          "features": "대동법 확대를 건의"
        },
        {
          "ref": "tb:8:5",
          "group": "광해군",
          "topic": "선혜청 · 공인",
          "features": "대동법 담당 관청 / 관청 물품을 대는 상인"
        }
      ]
    },
    {
      "era": "조선 · 광해군",
      "topic": "광해군",
      "sub": "핵심 관계 · 대동법 · 이원익",
      "sec": 8,
      "points": [
        "대동법 · 이원익",
        "광해군 때 경기에서 시작, 그 뒤 차츰 확대"
      ],
      "refs": [
        "tb:8:3"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 광해군",
      "topic": "광해군",
      "sub": "핵심 관계 · 김육",
      "sec": 8,
      "points": [
        "김육",
        "대동법 확대를 건의"
      ],
      "refs": [
        "tb:8:4"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 광해군",
      "topic": "광해군",
      "sub": "핵심 관계 · 선혜청 · 공인",
      "sec": 8,
      "points": [
        "선혜청 · 공인",
        "대동법 담당 관청 / 관청 물품을 대는 상인"
      ],
      "refs": [
        "tb:8:5"
      ],
      "stage": "late"
    },
    {
      "id": "jo-15",
      "stage": "late",
      "era": "조선 · 인조",
      "topic": "인조 · 이괄의 난·정묘호란·영정법",
      "sub": "16대 인조 · 1623–1627",
      "sec": 8,
      "points": [
        "이괄의 난 → 인조가 공주(공산성)로 피란",
        "정묘호란(후금) → 정봉수·이립 용골산성 항전",
        "인조 → 영정법: 풍흉 무관 전세 고정(1결 4~6두)"
      ],
      "refs": [
        "tb:9:0",
        "tb:9:1",
        "tb:9:2"
      ],
      "quiz": [
        "qz:legacy-joseon-late-001",
        "qz:legacy-joseon-late-030",
        "qz:legacy-joseon-late-039",
        "qz:legacy-joseon-late-042",
        "qz:legacy-joseon-early-032"
      ],
      "notes": [
        "on:joseon-late:0:3",
        "on:joseon-early:3:3"
      ],
      "aux": [
        {
          "src": "on:joseon-late:0:3",
          "text": "인조반정으로 북인 몰락"
        },
        {
          "src": "qz:legacy-joseon-late-039",
          "text": "총융청·수어청 창설 → 인조 (퀴즈에만 있음, uncertain)"
        }
      ],
      "stageLabel": "양난과 반정",
      "book": [
        "bk:u04_p08",
        "bk:u04_p10"
      ],
      "core": [
        {
          "ref": "tb:9:0",
          "group": "인조",
          "topic": "인조 · 이괄의 난",
          "features": "공주(공산성)로 피란"
        },
        {
          "ref": "tb:9:1",
          "group": "인조",
          "topic": "정묘호란 · 용골산성",
          "features": "후금의 침입, 정봉수·이립이 항전"
        },
        {
          "ref": "tb:9:2",
          "group": "인조",
          "topic": "인조 · 영정법",
          "features": "풍흉과 관계없이 전세를 고정"
        }
      ]
    },
    {
      "era": "조선 · 인조",
      "topic": "인조",
      "sub": "핵심 관계 · 인조 · 이괄의 난",
      "sec": 8,
      "points": [
        "인조 · 이괄의 난",
        "공주(공산성)로 피란"
      ],
      "refs": [
        "tb:9:0"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 인조",
      "topic": "인조",
      "sub": "핵심 관계 · 정묘호란 · 용골산성",
      "sec": 8,
      "points": [
        "정묘호란 · 용골산성",
        "후금의 침입, 정봉수·이립이 항전"
      ],
      "refs": [
        "tb:9:1"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 인조",
      "topic": "인조",
      "sub": "핵심 관계 · 인조 · 영정법",
      "sec": 8,
      "points": [
        "인조 · 영정법",
        "풍흉과 관계없이 전세를 고정"
      ],
      "refs": [
        "tb:9:2"
      ],
      "stage": "late"
    },
    {
      "id": "jo-16",
      "stage": "late",
      "era": "조선 · 인조",
      "topic": "병자호란 · 항전과 화친",
      "sub": "1636 청의 침입 · 1637 삼전도",
      "sec": 8,
      "points": [
        "인조 → 남한산성 피란·항전 → 삼전도 항복",
        "김준룡 → 광교산 전투 승리",
        "김상헌 = 끝까지 항전 / 최명길 = 화친 주장"
      ],
      "refs": [
        "tb:10:0",
        "tb:10:1",
        "tb:10:2"
      ],
      "quiz": [
        "qz:legacy-joseon-late-016",
        "qz:legacy-joseon-late-024",
        "qz:legacy-joseon-early-027",
        "qz:legacy-joseon-early-029"
      ],
      "notes": [
        "on:joseon-late:0:4",
        "on:joseon-late:0:5",
        "on:joseon-early:3:2"
      ],
      "aux": [
        {
          "src": "on:joseon-late:0:4",
          "text": "항복 뒤 삼전도비 · 정묘(용골산성)와 구분"
        }
      ],
      "stageLabel": "양난과 반정",
      "book": [
        "bk:u04_p08",
        "bk:u04_p10"
      ],
      "core": [
        {
          "ref": "tb:10:0",
          "group": "병자호란 · 인조",
          "topic": "인조 · 남한산성",
          "features": "청이 쳐들어오자 피란해 항전"
        },
        {
          "ref": "tb:10:1",
          "group": "병자호란 · 인조",
          "topic": "김준룡 · 광교산",
          "features": "광교산 전투에서 승리"
        },
        {
          "ref": "tb:10:2",
          "group": "병자호란 · 인조",
          "topic": "병자호란 · 김상헌 · 최명길",
          "features": "끝까지 항전 / 화친 주장"
        }
      ]
    },
    {
      "era": "조선 · 인조",
      "topic": "병자호란 · 인조",
      "sub": "핵심 관계 · 인조 · 남한산성",
      "sec": 8,
      "points": [
        "인조 · 남한산성",
        "청이 쳐들어오자 피란해 항전"
      ],
      "refs": [
        "tb:10:0"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 인조",
      "topic": "병자호란 · 인조",
      "sub": "핵심 관계 · 김준룡 · 광교산",
      "sec": 8,
      "points": [
        "김준룡 · 광교산",
        "광교산 전투에서 승리"
      ],
      "refs": [
        "tb:10:1"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 인조",
      "topic": "병자호란 · 인조",
      "sub": "핵심 관계 · 병자호란 · 김상헌 · 최명길",
      "sec": 8,
      "points": [
        "병자호란 · 김상헌 · 최명길",
        "끝까지 항전 / 화친 주장"
      ],
      "refs": [
        "tb:10:2"
      ],
      "stage": "late"
    },
    {
      "id": "jo-17",
      "stage": "late",
      "era": "조선 · 효종",
      "topic": "효종 · 북벌과 나선 정벌",
      "sub": "17대 효종 · 1649–1659",
      "sec": 8,
      "points": [
        "효종 → 북벌: 어영청 중심, 청을 치려는 계획",
        "효종 → 나선 정벌: 청 요청, 신류 조총 부대",
        "송시열 → 기축봉사: 북벌의 뜻을 담아 올린 글"
      ],
      "refs": [
        "tb:15:0",
        "tb:15:1",
        "tb:15:2"
      ],
      "quiz": [
        "qz:legacy-joseon-late-007",
        "qz:legacy-joseon-late-017",
        "qz:legacy-joseon-late-027",
        "qz:legacy-joseon-late-040"
      ],
      "notes": [
        "on:joseon-late:1:0"
      ],
      "aux": [
        {
          "src": "flow",
          "text": "청에 인질로 갔던 봉림대군이 효종으로 즉위"
        }
      ],
      "stageLabel": "정치 변동과 후기 왕",
      "book": [
        "bk:u04_p09",
        "bk:u04_p11"
      ],
      "core": [
        {
          "ref": "tb:15:0",
          "group": "효종 · 현종 · 숙종",
          "topic": "효종 · 북벌",
          "features": "청을 치려는 계획"
        },
        {
          "ref": "tb:15:1",
          "group": "효종 · 현종 · 숙종",
          "topic": "효종 · 나선 정벌",
          "features": "청의 요청으로 러시아와 싸움"
        },
        {
          "ref": "tb:15:2",
          "group": "효종 · 현종 · 숙종",
          "topic": "송시열 · 기축봉사",
          "features": "북벌의 뜻을 담아 올린 글"
        }
      ]
    },
    {
      "era": "조선 · 효종",
      "topic": "효종 · 현종 · 숙종",
      "sub": "핵심 관계 · 효종 · 북벌",
      "sec": 8,
      "points": [
        "효종 · 북벌",
        "청을 치려는 계획"
      ],
      "refs": [
        "tb:15:0"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 효종",
      "topic": "효종 · 현종 · 숙종",
      "sub": "핵심 관계 · 효종 · 나선 정벌",
      "sec": 8,
      "points": [
        "효종 · 나선 정벌",
        "청의 요청으로 러시아와 싸움"
      ],
      "refs": [
        "tb:15:1"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 효종",
      "topic": "효종 · 현종 · 숙종",
      "sub": "핵심 관계 · 송시열 · 기축봉사",
      "sec": 8,
      "points": [
        "송시열 · 기축봉사",
        "북벌의 뜻을 담아 올린 글"
      ],
      "refs": [
        "tb:15:2"
      ],
      "stage": "late"
    },
    {
      "id": "jo-18",
      "stage": "late",
      "era": "조선 · 현종·숙종",
      "topic": "현종 예송 · 숙종 환국",
      "sub": "18대 현종 → 19대 숙종 · 1659–1720",
      "sec": 8,
      "points": [
        "현종 → 예송: 왕실 상복 기간, 서인 vs 남인",
        "숙종 → 환국: 집권 붕당 급변(경신·기사·갑술)",
        "숙종 → 금위영(5군영 완성)·백두산 정계비·초량 왜관"
      ],
      "refs": [
        "tb:15:3",
        "tb:15:4",
        "tb:15:5",
        "tb:15:6",
        "tb:15:7"
      ],
      "quiz": [
        "qz:legacy-joseon-late-002",
        "qz:legacy-joseon-late-009",
        "qz:legacy-joseon-late-015",
        "qz:legacy-joseon-late-023",
        "qz:legacy-joseon-late-025",
        "qz:legacy-joseon-late-036",
        "qz:legacy-joseon-late-045",
        "qz:legacy-joseon-late-049",
        "qz:legacy-joseon-late-066"
      ],
      "notes": [
        "on:joseon-late:1:1",
        "on:joseon-late:1:2",
        "on:joseon-late:1:3"
      ],
      "aux": [
        {
          "src": "on:joseon-late:1:1",
          "text": "자의 대비 상복: 기해예송 서인 승, 갑인예송 남인 승"
        },
        {
          "src": "on:joseon-late:1:2",
          "text": "인현왕후 폐위·복위, 장희빈, 송시열 → 숙종"
        },
        {
          "src": "flow",
          "text": "백두산 정계비 1712"
        },
        {
          "src": "qz:legacy-joseon-late-049",
          "text": "만동묘 설치 → 숙종 (퀴즈에만 있음, uncertain)"
        }
      ],
      "stageLabel": "정치 변동과 후기 왕",
      "book": [
        "bk:u04_p09",
        "bk:u04_p11"
      ],
      "core": [
        {
          "ref": "tb:15:3",
          "group": "효종 · 현종 · 숙종",
          "topic": "현종 · 예송",
          "features": "왕실 상복 기간 논쟁(서인 vs 남인)"
        },
        {
          "ref": "tb:15:4",
          "group": "효종 · 현종 · 숙종",
          "topic": "숙종 · 환국",
          "features": "집권 붕당이 갑자기 바뀜"
        },
        {
          "ref": "tb:15:5",
          "group": "효종 · 현종 · 숙종",
          "topic": "숙종 · 금위영",
          "features": "5군영이 다 갖춰짐"
        },
        {
          "ref": "tb:15:6",
          "group": "효종 · 현종 · 숙종",
          "topic": "숙종 · 백두산 정계비",
          "features": "청과의 국경 표시"
        },
        {
          "ref": "tb:15:7",
          "group": "효종 · 현종 · 숙종",
          "topic": "숙종 · 초량 왜관",
          "features": "일본과 교역한 장소"
        }
      ]
    },
    {
      "era": "조선 · 현종·숙종",
      "topic": "효종 · 현종 · 숙종",
      "sub": "핵심 관계 · 현종 · 예송",
      "sec": 8,
      "points": [
        "현종 · 예송",
        "왕실 상복 기간 논쟁(서인 vs 남인)"
      ],
      "refs": [
        "tb:15:3"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 현종·숙종",
      "topic": "효종 · 현종 · 숙종",
      "sub": "핵심 관계 · 숙종 · 환국",
      "sec": 8,
      "points": [
        "숙종 · 환국",
        "집권 붕당이 갑자기 바뀜"
      ],
      "refs": [
        "tb:15:4"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 현종·숙종",
      "topic": "효종 · 현종 · 숙종",
      "sub": "핵심 관계 · 숙종 · 금위영",
      "sec": 8,
      "points": [
        "숙종 · 금위영",
        "5군영이 다 갖춰짐"
      ],
      "refs": [
        "tb:15:5"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 현종·숙종",
      "topic": "효종 · 현종 · 숙종",
      "sub": "핵심 관계 · 숙종 · 백두산 정계비",
      "sec": 8,
      "points": [
        "숙종 · 백두산 정계비",
        "청과의 국경 표시"
      ],
      "refs": [
        "tb:15:6"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 현종·숙종",
      "topic": "효종 · 현종 · 숙종",
      "sub": "핵심 관계 · 숙종 · 초량 왜관",
      "sec": 8,
      "points": [
        "숙종 · 초량 왜관",
        "일본과 교역한 장소"
      ],
      "refs": [
        "tb:15:7"
      ],
      "stage": "late"
    },
    {
      "id": "jo-19",
      "stage": "late",
      "era": "조선 · 영조",
      "topic": "영조 · 탕평과 균역법",
      "sub": "20대 경종 → 21대 영조 · 1724–1776",
      "sec": 8,
      "points": [
        "영조 → 탕평비: 붕당 다툼 경계",
        "영조 → 균역법(1750): 군포 2필 → 1필",
        "부족분 → 결작(토지)·선무군관포로 보충"
      ],
      "refs": [
        "tb:16:0",
        "tb:16:1",
        "tb:16:2"
      ],
      "quiz": [
        "qz:legacy-joseon-late-005",
        "qz:legacy-joseon-late-012",
        "qz:legacy-joseon-late-019",
        "qz:legacy-joseon-late-029",
        "qz:legacy-joseon-late-035",
        "qz:legacy-joseon-late-048"
      ],
      "notes": [
        "on:joseon-late:1:4",
        "on:joseon-late:2:0",
        "on:joseon-late:2:1"
      ],
      "aux": [
        {
          "src": "on:joseon-late:1:4",
          "text": "경종 때 목호룡 고변 → 신임사화, 연잉군(=영조) 왕세제"
        },
        {
          "src": "on:joseon-late:2:0",
          "text": "영조 선택지: 이인좌의 난·청계천 정비·신문고 복구"
        },
        {
          "src": "on:joseon-late:2:1",
          "text": "결작 = 토지 1결당 쌀 2두, 어장세·선박세도 보충"
        }
      ],
      "stageLabel": "정치 변동과 후기 왕",
      "book": [
        "bk:u04_p09",
        "bk:u04_p11",
        "bk:u04_p17"
      ],
      "core": [
        {
          "ref": "tb:16:0",
          "group": "영조 · 정조",
          "topic": "영조 · 탕평비",
          "features": "붕당 다툼을 경계"
        },
        {
          "ref": "tb:16:1",
          "group": "영조 · 정조",
          "topic": "영조 · 균역법",
          "features": "군포 2필 → 1필"
        },
        {
          "ref": "tb:16:2",
          "group": "영조 · 정조",
          "topic": "결작 · 선무군관포",
          "features": "줄어든 군포를 메운 부담(토지·선무군관)"
        }
      ]
    },
    {
      "era": "조선 · 영조",
      "topic": "영조 · 정조",
      "sub": "핵심 관계 · 영조 · 탕평비",
      "sec": 8,
      "points": [
        "영조 · 탕평비",
        "붕당 다툼을 경계"
      ],
      "refs": [
        "tb:16:0"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 영조",
      "topic": "영조 · 정조",
      "sub": "핵심 관계 · 영조 · 균역법",
      "sec": 8,
      "points": [
        "영조 · 균역법",
        "군포 2필 → 1필"
      ],
      "refs": [
        "tb:16:1"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 영조",
      "topic": "영조 · 정조",
      "sub": "핵심 관계 · 결작 · 선무군관포",
      "sec": 8,
      "points": [
        "결작 · 선무군관포",
        "줄어든 군포를 메운 부담(토지·선무군관)"
      ],
      "refs": [
        "tb:16:2"
      ],
      "stage": "late"
    },
    {
      "id": "jo-20",
      "stage": "late",
      "era": "조선 · 정조",
      "topic": "정조 · 규장각과 개혁",
      "sub": "22대 정조 · 1776–1800",
      "sec": 8,
      "points": [
        "정조 → 규장각(학문 기관)·초계문신제(문신 재교육)",
        "정조 → 장용영: 왕의 친위 부대",
        "정조 → 신해통공(1791): 시전 금난전권 축소"
      ],
      "refs": [
        "tb:16:3",
        "tb:16:4",
        "tb:16:5"
      ],
      "quiz": [
        "qz:legacy-joseon-late-003",
        "qz:legacy-joseon-late-018",
        "qz:legacy-joseon-late-031",
        "qz:legacy-joseon-late-038"
      ],
      "notes": [
        "on:joseon-late:2:2",
        "on:joseon-late:2:3"
      ],
      "aux": [
        {
          "src": "on:joseon-late:2:2",
          "text": "규장각에 서얼 검서관 등용"
        },
        {
          "src": "flow",
          "text": "신해통공은 육의전 제외 · 수원 화성 1796 완공"
        }
      ],
      "stageLabel": "정치 변동과 후기 왕",
      "book": [
        "bk:u04_p09",
        "bk:u04_p11"
      ],
      "core": [
        {
          "ref": "tb:16:3",
          "group": "영조 · 정조",
          "topic": "정조 · 규장각 · 초계문신제",
          "features": "학문 기관 / 젊은 문신 재교육"
        },
        {
          "ref": "tb:16:4",
          "group": "영조 · 정조",
          "topic": "정조 · 장용영",
          "features": "왕의 친위 부대"
        },
        {
          "ref": "tb:16:5",
          "group": "영조 · 정조",
          "topic": "정조 · 신해통공",
          "features": "시전 상인의 특권(금난전권)을 줄임"
        }
      ]
    },
    {
      "era": "조선 · 정조",
      "topic": "영조 · 정조",
      "sub": "핵심 관계 · 정조 · 규장각 · 초계문신제",
      "sec": 8,
      "points": [
        "정조 · 규장각 · 초계문신제",
        "학문 기관 / 젊은 문신 재교육"
      ],
      "refs": [
        "tb:16:3"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 정조",
      "topic": "영조 · 정조",
      "sub": "핵심 관계 · 정조 · 장용영",
      "sec": 8,
      "points": [
        "정조 · 장용영",
        "왕의 친위 부대"
      ],
      "refs": [
        "tb:16:4"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 정조",
      "topic": "영조 · 정조",
      "sub": "핵심 관계 · 정조 · 신해통공",
      "sec": 8,
      "points": [
        "정조 · 신해통공",
        "시전 상인의 특권(금난전권)을 줄임"
      ],
      "refs": [
        "tb:16:5"
      ],
      "stage": "late"
    },
    {
      "id": "jo-21",
      "stage": "late",
      "era": "조선 · 세도정치",
      "topic": "세도정치기 · 순조와 철종",
      "sub": "23대 순조 → 25대 철종 · 1800–1862",
      "sec": 8,
      "points": [
        "순조 → 공노비 해방(1801)·홍경래의 난(정주성)",
        "순조 → 신유박해 → 황사영 백서 사건",
        "철종 → 임술농민봉기(진주·유계춘) → 박규수·삼정이정청"
      ],
      "refs": [
        "tb:17:0",
        "tb:17:1",
        "tb:17:2",
        "tb:17:3",
        "tb:17:4"
      ],
      "quiz": [
        "qz:legacy-joseon-late-010",
        "qz:legacy-joseon-late-021",
        "qz:legacy-joseon-late-026",
        "qz:legacy-joseon-late-032",
        "qz:legacy-joseon-late-037",
        "qz:legacy-joseon-late-043",
        "qz:legacy-joseon-late-047"
      ],
      "notes": [
        "on:joseon-late:2:4"
      ],
      "aux": [
        {
          "src": "flow",
          "text": "순조·헌종·철종 3대 외척 세도정치, 홍경래의 난 1811, 임술농민봉기 1862"
        },
        {
          "src": "qz:legacy-joseon-late-047",
          "text": "신유박해에 이승훈·정약용 등 연루"
        },
        {
          "src": "qz:legacy-joseon-late-026",
          "text": "퀴즈 표현: 궁방·중앙 관서 공노비 6만여 명"
        }
      ],
      "stageLabel": "정치 변동과 후기 왕",
      "book": [
        "bk:u04_p09",
        "bk:u04_p12",
        "bk:u04_p14"
      ],
      "core": [
        {
          "ref": "tb:17:0",
          "group": "세도정치기",
          "topic": "순조 · 공노비 해방",
          "features": "1801 · 내수사·중앙 관청의 납공 노비 해방(지방 관노비 등은 남음)"
        },
        {
          "ref": "tb:17:1",
          "group": "세도정치기",
          "topic": "순조 · 홍경래의 난",
          "features": "정주성을 차지한 봉기"
        },
        {
          "ref": "tb:17:2",
          "group": "세도정치기",
          "topic": "순조 · 신유박해 · 황사영",
          "features": "천주교 탄압 / 백서 사건"
        },
        {
          "ref": "tb:17:3",
          "group": "세도정치기",
          "topic": "철종 · 임술농민봉기",
          "features": "진주에서 유계춘이 이끈 봉기"
        },
        {
          "ref": "tb:17:4",
          "group": "세도정치기",
          "topic": "박규수 · 삼정이정청",
          "features": "안핵사로 파견 / 수취 제도 개선 기구"
        }
      ]
    },
    {
      "era": "조선 · 세도정치",
      "topic": "세도정치기",
      "sub": "핵심 관계 · 순조 · 공노비 해방",
      "sec": 8,
      "points": [
        "순조 · 공노비 해방",
        "1801 · 내수사·중앙 관청의 납공 노비 해방(지방 관노비 등은 남음)"
      ],
      "refs": [
        "tb:17:0"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 세도정치",
      "topic": "세도정치기",
      "sub": "핵심 관계 · 순조 · 홍경래의 난",
      "sec": 8,
      "points": [
        "순조 · 홍경래의 난",
        "정주성을 차지한 봉기"
      ],
      "refs": [
        "tb:17:1"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 세도정치",
      "topic": "세도정치기",
      "sub": "핵심 관계 · 순조 · 신유박해 · 황사영",
      "sec": 8,
      "points": [
        "순조 · 신유박해 · 황사영",
        "천주교 탄압 / 백서 사건"
      ],
      "refs": [
        "tb:17:2"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 세도정치",
      "topic": "세도정치기",
      "sub": "핵심 관계 · 철종 · 임술농민봉기",
      "sec": 8,
      "points": [
        "철종 · 임술농민봉기",
        "진주에서 유계춘이 이끈 봉기"
      ],
      "refs": [
        "tb:17:3"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 세도정치",
      "topic": "세도정치기",
      "sub": "핵심 관계 · 박규수 · 삼정이정청",
      "sec": 8,
      "points": [
        "박규수 · 삼정이정청",
        "안핵사로 파견 / 수취 제도 개선 기구"
      ],
      "refs": [
        "tb:17:4"
      ],
      "stage": "late"
    },
    {
      "id": "jo-22",
      "stage": "cross",
      "era": "조선 · 통치 기구",
      "topic": "중앙 기구 ① 왕명·사법·수도·교육·역사",
      "sub": "기능과 별칭 (조선 전 시기)",
      "sec": 8,
      "points": [
        "승정원(도승지·은대) → 왕명 전달 비서 기관",
        "의금부(금오·조옥) → 왕 직속 사법 / 한성부 → 수도",
        "성균관(대사성) → 최고 교육 / 춘추관 → 역사 편찬"
      ],
      "refs": [
        "tb:11:0",
        "tb:11:1",
        "tb:11:6",
        "tb:11:7",
        "tb:11:8"
      ],
      "quiz": [
        "qz:legacy-joseon-late-050",
        "qz:legacy-joseon-late-051",
        "qz:legacy-joseon-late-052",
        "qz:legacy-joseon-late-054",
        "qz:legacy-joseon-late-056",
        "qz:legacy-joseon-late-057",
        "qz:legacy-joseon-late-060",
        "qz:legacy-joseon-late-061",
        "qz:legacy-joseon-late-063",
        "qz:legacy-joseon-early-019"
      ],
      "notes": [
        "on:joseon-late:6:0",
        "on:joseon-late:6:1",
        "on:joseon-late:6:3",
        "on:joseon-early:1:2"
      ],
      "aux": [
        {
          "src": "on:joseon-early:1:2",
          "text": "비변사: 삼포왜란 뒤 중종 때 임시 → 을묘왜변 뒤 명종 때 상설"
        },
        {
          "src": "on:joseon-late:6:3",
          "text": "비변사는 세도정치기 외척 권력의 중심"
        },
        {
          "src": "qz:legacy-joseon-late-060",
          "text": "성균관에 대성전과 명륜당"
        },
        {
          "src": "qz:legacy-joseon-late-063",
          "text": "승문원 = 사대교린 문서 (퀴즈에만 있음)"
        }
      ],
      "stageLabel": "통치 기구·토지·세금 (시대 횡단)",
      "book": [
        "bk:u04_p05",
        "bk:u04_p15",
        "bk:u04_p18",
        "bk:u04_p24"
      ],
      "core": [
        {
          "ref": "tb:11:0",
          "group": "중앙 기구 · 기능과 별칭 (조선 전 시기)",
          "topic": "승정원 · 도승지 · 은대",
          "features": "왕명을 전하는 비서 기관"
        },
        {
          "ref": "tb:11:1",
          "group": "중앙 기구 · 기능과 별칭 (조선 전 시기)",
          "topic": "의금부 · 금오 · 조옥",
          "features": "왕이 직접 다스린 사법 기관"
        },
        {
          "ref": "tb:11:6",
          "group": "중앙 기구 · 기능과 별칭 (조선 전 시기)",
          "topic": "한성부",
          "features": "수도의 행정·치안"
        },
        {
          "ref": "tb:11:7",
          "group": "중앙 기구 · 기능과 별칭 (조선 전 시기)",
          "topic": "성균관 · 대사성",
          "features": "최고 교육 기관"
        },
        {
          "ref": "tb:11:8",
          "group": "중앙 기구 · 기능과 별칭 (조선 전 시기)",
          "topic": "춘추관",
          "features": "역사 편찬"
        }
      ]
    },
    {
      "era": "조선 · 통치 기구",
      "topic": "중앙 기구 · 기능과 별칭 (조선 전 시기)",
      "sub": "핵심 관계 · 승정원 · 도승지 · 은대",
      "sec": 8,
      "points": [
        "승정원 · 도승지 · 은대",
        "왕명을 전하는 비서 기관"
      ],
      "refs": [
        "tb:11:0"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 · 통치 기구",
      "topic": "중앙 기구 · 기능과 별칭 (조선 전 시기)",
      "sub": "핵심 관계 · 의금부 · 금오 · 조옥",
      "sec": 8,
      "points": [
        "의금부 · 금오 · 조옥",
        "왕이 직접 다스린 사법 기관"
      ],
      "refs": [
        "tb:11:1"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 · 통치 기구",
      "topic": "중앙 기구 · 기능과 별칭 (조선 전 시기)",
      "sub": "핵심 관계 · 한성부",
      "sec": 8,
      "points": [
        "한성부",
        "수도의 행정·치안"
      ],
      "refs": [
        "tb:11:6"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 · 통치 기구",
      "topic": "중앙 기구 · 기능과 별칭 (조선 전 시기)",
      "sub": "핵심 관계 · 성균관 · 대사성",
      "sec": 8,
      "points": [
        "성균관 · 대사성",
        "최고 교육 기관"
      ],
      "refs": [
        "tb:11:7"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 · 통치 기구",
      "topic": "중앙 기구 · 기능과 별칭 (조선 전 시기)",
      "sub": "핵심 관계 · 춘추관",
      "sec": 8,
      "points": [
        "춘추관",
        "역사 편찬"
      ],
      "refs": [
        "tb:11:8"
      ],
      "stage": "cross"
    },
    {
      "id": "jo-23",
      "stage": "cross",
      "era": "조선 · 통치 기구",
      "topic": "중앙 기구 ② 삼사와 양사",
      "sub": "감찰·간쟁·경연 · 서경권",
      "sec": 8,
      "points": [
        "사헌부(대사헌) → 관리 감찰·탄핵",
        "사간원 → 왕에게 간쟁 / 홍문관(옥당) → 경연·자문",
        "삼사 = 사헌부·사간원·홍문관 · 양사(앞 둘) = 서경권"
      ],
      "refs": [
        "tb:11:2",
        "tb:11:3",
        "tb:11:4",
        "tb:11:5"
      ],
      "quiz": [
        "qz:legacy-joseon-late-053",
        "qz:legacy-joseon-late-055",
        "qz:legacy-joseon-late-058",
        "qz:legacy-joseon-late-059"
      ],
      "notes": [
        "on:joseon-late:6:2"
      ],
      "aux": [
        {
          "src": "qz:legacy-joseon-late-053",
          "text": "서경권 = 5품 이하 관리 임명 동의"
        }
      ],
      "stageLabel": "통치 기구·토지·세금 (시대 횡단)",
      "book": [
        "bk:u04_p15",
        "bk:u04_p18",
        "bk:u04_p24"
      ],
      "core": [
        {
          "ref": "tb:11:2",
          "group": "중앙 기구 · 기능과 별칭 (조선 전 시기)",
          "topic": "사헌부 · 대사헌",
          "features": "관리를 감찰·탄핵"
        },
        {
          "ref": "tb:11:3",
          "group": "중앙 기구 · 기능과 별칭 (조선 전 시기)",
          "topic": "사간원",
          "features": "왕의 잘못에 간쟁"
        },
        {
          "ref": "tb:11:4",
          "group": "중앙 기구 · 기능과 별칭 (조선 전 시기)",
          "topic": "홍문관 · 옥당 · 경연",
          "features": "경연과 학문 자문"
        },
        {
          "ref": "tb:11:5",
          "group": "중앙 기구 · 기능과 별칭 (조선 전 시기)",
          "topic": "사헌부 · 사간원 · 홍문관",
          "features": "셋을 묶어 삼사, 앞의 둘은 양사(서경권)"
        }
      ]
    },
    {
      "era": "조선 · 통치 기구",
      "topic": "중앙 기구 · 기능과 별칭 (조선 전 시기)",
      "sub": "핵심 관계 · 사헌부 · 대사헌",
      "sec": 8,
      "points": [
        "사헌부 · 대사헌",
        "관리를 감찰·탄핵"
      ],
      "refs": [
        "tb:11:2"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 · 통치 기구",
      "topic": "중앙 기구 · 기능과 별칭 (조선 전 시기)",
      "sub": "핵심 관계 · 사간원",
      "sec": 8,
      "points": [
        "사간원",
        "왕의 잘못에 간쟁"
      ],
      "refs": [
        "tb:11:3"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 · 통치 기구",
      "topic": "중앙 기구 · 기능과 별칭 (조선 전 시기)",
      "sub": "핵심 관계 · 홍문관 · 옥당 · 경연",
      "sec": 8,
      "points": [
        "홍문관 · 옥당 · 경연",
        "경연과 학문 자문"
      ],
      "refs": [
        "tb:11:4"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 · 통치 기구",
      "topic": "중앙 기구 · 기능과 별칭 (조선 전 시기)",
      "sub": "핵심 관계 · 사헌부 · 사간원 · 홍문관",
      "sec": 8,
      "points": [
        "사헌부 · 사간원 · 홍문관",
        "셋을 묶어 삼사, 앞의 둘은 양사(서경권)"
      ],
      "refs": [
        "tb:11:5"
      ],
      "stage": "cross"
    },
    {
      "id": "jo-24",
      "stage": "cross",
      "era": "조선 · 지방",
      "topic": "지방과 향촌 · 자치와 교육",
      "sub": "유향소·경재소·향교·향약 (조선 전 시기)",
      "sec": 8,
      "points": [
        "유향소(좌수·별감) → 향촌 양반 자치 조직",
        "경재소 → 중앙에서 유향소 관리(임원 임명권)",
        "향교 → 지방 국립 교육 / 향약 → 마을 공동 규약"
      ],
      "refs": [
        "tb:12:0",
        "tb:12:1",
        "tb:12:2",
        "tb:12:3"
      ],
      "quiz": [
        "qz:legacy-joseon-late-064",
        "qz:legacy-joseon-late-065",
        "qz:legacy-joseon-late-067",
        "qz:legacy-joseon-late-068",
        "qz:legacy-joseon-late-082",
        "qz:legacy-joseon-late-083",
        "qz:legacy-joseon-late-087"
      ],
      "notes": [
        "on:joseon-early:2:3",
        "on:joseon-late:6:4"
      ],
      "aux": [
        {
          "src": "on:joseon-early:2:3",
          "text": "8도 관찰사·군현 수령 파견, 향리는 수령 보좌"
        },
        {
          "src": "qz:legacy-joseon-late-068",
          "text": "향교에 중앙에서 교수·훈도 파견"
        },
        {
          "src": "qz:legacy-joseon-late-087",
          "text": "구향·신향의 향전 → 조선 후기"
        },
        {
          "src": "qz:legacy-joseon-late-082",
          "text": "구분: 사심관·향/부곡/소 → 고려"
        }
      ],
      "stageLabel": "통치 기구·토지·세금 (시대 횡단)",
      "book": [
        "bk:u04_p15",
        "bk:u04_p16",
        "bk:u04_p24"
      ],
      "core": [
        {
          "ref": "tb:12:0",
          "group": "지방과 향촌 (조선 전 시기)",
          "topic": "유향소 · 좌수 · 별감",
          "features": "향촌 양반의 자치 조직과 그 임원"
        },
        {
          "ref": "tb:12:1",
          "group": "지방과 향촌 (조선 전 시기)",
          "topic": "경재소",
          "features": "중앙에서 유향소를 관리"
        },
        {
          "ref": "tb:12:2",
          "group": "지방과 향촌 (조선 전 시기)",
          "topic": "향교",
          "features": "지방의 국립 교육 기관"
        },
        {
          "ref": "tb:12:3",
          "group": "지방과 향촌 (조선 전 시기)",
          "topic": "향약",
          "features": "마을이 함께 지킨 규약"
        }
      ]
    },
    {
      "era": "조선 · 지방",
      "topic": "지방과 향촌 (조선 전 시기)",
      "sub": "핵심 관계 · 유향소 · 좌수 · 별감",
      "sec": 8,
      "points": [
        "유향소 · 좌수 · 별감",
        "향촌 양반의 자치 조직과 그 임원"
      ],
      "refs": [
        "tb:12:0"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 · 지방",
      "topic": "지방과 향촌 (조선 전 시기)",
      "sub": "핵심 관계 · 경재소",
      "sec": 8,
      "points": [
        "경재소",
        "중앙에서 유향소를 관리"
      ],
      "refs": [
        "tb:12:1"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 · 지방",
      "topic": "지방과 향촌 (조선 전 시기)",
      "sub": "핵심 관계 · 향교",
      "sec": 8,
      "points": [
        "향교",
        "지방의 국립 교육 기관"
      ],
      "refs": [
        "tb:12:2"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 · 지방",
      "topic": "지방과 향촌 (조선 전 시기)",
      "sub": "핵심 관계 · 향약",
      "sec": 8,
      "points": [
        "향약",
        "마을이 함께 지킨 규약"
      ],
      "refs": [
        "tb:12:3"
      ],
      "stage": "cross"
    },
    {
      "id": "jo-25",
      "stage": "early",
      "era": "조선 · 토지",
      "topic": "토지 제도의 흐름",
      "sub": "과전법 → 직전법(세조) → 관수관급제(성종) → 폐지(명종)",
      "sec": 8,
      "points": [
        "과전법: 전·현직 관리에 경기 땅 수조권",
        "→ 직전법(세조, 현직만) → 관수관급제(성종)",
        "→ 직전법 폐지(명종) → 이후 녹봉만 지급"
      ],
      "refs": [
        "tb:13:0",
        "tb:13:1",
        "tb:13:2",
        "tb:13:3"
      ],
      "quiz": [
        "qz:legacy-joseon-late-094",
        "qz:legacy-joseon-late-101"
      ],
      "notes": [
        "on:joseon-early:2:0",
        "on:joseon-early:2:1"
      ],
      "aux": [
        {
          "src": "on:joseon-early:2:1",
          "text": "직전법과 함께 수신전·휼양전 폐지"
        },
        {
          "src": "qz:legacy-joseon-late-101",
          "text": "경기 한정 과전 = 고려 말(조선 건국 직전)"
        },
        {
          "src": "qz:legacy-joseon-late-094",
          "text": "구분: 녹과전 → 고려"
        }
      ],
      "stageLabel": "통치 기구·토지·세금 (시대 횡단)",
      "book": [
        "bk:u04_p04",
        "bk:u04_p16",
        "bk:u04_p19"
      ],
      "core": [
        {
          "ref": "tb:13:0",
          "group": "토지 제도의 흐름 (태조~명종)",
          "topic": "과전법",
          "features": "전·현직 관리에게 경기 땅의 수조권"
        },
        {
          "ref": "tb:13:1",
          "group": "토지 제도의 흐름 (태조~명종)",
          "topic": "직전법 (세조)",
          "features": "현직 관리에게만 수조권"
        },
        {
          "ref": "tb:13:2",
          "group": "토지 제도의 흐름 (태조~명종)",
          "topic": "관수관급제 (성종)",
          "features": "나라가 대신 거두어 관리에게 줌"
        },
        {
          "ref": "tb:13:3",
          "group": "토지 제도의 흐름 (태조~명종)",
          "topic": "직전법 폐지 (명종)",
          "features": "이후 녹봉만 지급"
        }
      ]
    },
    {
      "era": "조선 · 토지",
      "topic": "토지 제도의 흐름 (태조~명종)",
      "sub": "핵심 관계 · 과전법",
      "sec": 8,
      "points": [
        "과전법",
        "전·현직 관리에게 경기 땅의 수조권"
      ],
      "refs": [
        "tb:13:0"
      ],
      "stage": "early"
    },
    {
      "era": "조선 · 토지",
      "topic": "토지 제도의 흐름 (태조~명종)",
      "sub": "핵심 관계 · 직전법 (세조)",
      "sec": 8,
      "points": [
        "직전법 (세조)",
        "현직 관리에게만 수조권"
      ],
      "refs": [
        "tb:13:1"
      ],
      "stage": "early"
    },
    {
      "era": "조선 · 토지",
      "topic": "토지 제도의 흐름 (태조~명종)",
      "sub": "핵심 관계 · 관수관급제 (성종)",
      "sec": 8,
      "points": [
        "관수관급제 (성종)",
        "나라가 대신 거두어 관리에게 줌"
      ],
      "refs": [
        "tb:13:2"
      ],
      "stage": "early"
    },
    {
      "era": "조선 · 토지",
      "topic": "토지 제도의 흐름 (태조~명종)",
      "sub": "핵심 관계 · 직전법 폐지 (명종)",
      "sec": 8,
      "points": [
        "직전법 폐지 (명종)",
        "이후 녹봉만 지급"
      ],
      "refs": [
        "tb:13:3"
      ],
      "stage": "early"
    },
    {
      "id": "jo-26",
      "stage": "late",
      "era": "조선 · 수취",
      "topic": "세금 3종 · 전세·공납·군역",
      "sub": "조선 전 시기 비교 · 세종 전세 참고",
      "sec": 8,
      "points": [
        "전세 → 영정법(인조): 풍흉과 관계없이 고정",
        "공납 → 대동법(광해군): 토지 기준 쌀·베·동전",
        "군역 → 균역법(영조): 2필→1필, 결작 등 보충"
      ],
      "refs": [
        "tb:18:0",
        "tb:18:1",
        "tb:18:2",
        "tb:18:3"
      ],
      "quiz": [],
      "notes": [
        "on:joseon-late:3:0",
        "on:joseon-late:3:1",
        "on:joseon-late:3:2",
        "on:joseon-late:3:3"
      ],
      "aux": [
        {
          "src": "on:joseon-late:3:3",
          "text": "영정법=인조·전세, 대동법=광해군·공납·공인, 균역법=영조·군역·결작"
        },
        {
          "src": "on:joseon-late:3:0",
          "text": "세종 연분 9등·전분 6등 → 인조 영정법 1결당 4~6두"
        }
      ],
      "stageLabel": "통치 기구·토지·세금 (시대 횡단)",
      "book": [
        "bk:u04_p13",
        "bk:u04_p14",
        "bk:u04_p16",
        "bk:u04_p17",
        "bk:u04_p19"
      ],
      "core": [
        {
          "ref": "tb:18:0",
          "group": "세금 3종 · 조선 전 시기 비교",
          "topic": "전세(토지) · 영정법",
          "features": "인조 · 땅에 매긴 세 → 풍흉과 관계없이 고정"
        },
        {
          "ref": "tb:18:1",
          "group": "세금 3종 · 조선 전 시기 비교",
          "topic": "공납(특산물) · 대동법",
          "features": "광해군 시작 · 집마다 특산물 → 토지 기준 쌀·베·동전"
        },
        {
          "ref": "tb:18:2",
          "group": "세금 3종 · 조선 전 시기 비교",
          "topic": "군역(군포) · 균역법",
          "features": "영조 · 2필 → 1필, 결작 등으로 보충"
        },
        {
          "ref": "tb:18:3",
          "group": "세금 3종 · 조선 전 시기 비교",
          "topic": "참고 · 연분 9등법 · 전분 6등법",
          "features": "세종 · 전세를 풍흉·비옥도로 나눔"
        }
      ]
    },
    {
      "era": "조선 · 수취",
      "topic": "세금 3종 · 조선 전 시기 비교",
      "sub": "핵심 관계 · 전세(토지) · 영정법",
      "sec": 8,
      "points": [
        "전세(토지) · 영정법",
        "인조 · 땅에 매긴 세 → 풍흉과 관계없이 고정"
      ],
      "refs": [
        "tb:18:0"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 수취",
      "topic": "세금 3종 · 조선 전 시기 비교",
      "sub": "핵심 관계 · 공납(특산물) · 대동법",
      "sec": 8,
      "points": [
        "공납(특산물) · 대동법",
        "광해군 시작 · 집마다 특산물 → 토지 기준 쌀·베·동전"
      ],
      "refs": [
        "tb:18:1"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 수취",
      "topic": "세금 3종 · 조선 전 시기 비교",
      "sub": "핵심 관계 · 군역(군포) · 균역법",
      "sec": 8,
      "points": [
        "군역(군포) · 균역법",
        "영조 · 2필 → 1필, 결작 등으로 보충"
      ],
      "refs": [
        "tb:18:2"
      ],
      "stage": "late"
    },
    {
      "era": "조선 · 수취",
      "topic": "세금 3종 · 조선 전 시기 비교",
      "sub": "핵심 관계 · 참고 · 연분 9등법 · 전분 6등법",
      "sec": 8,
      "points": [
        "참고 · 연분 9등법 · 전분 6등법",
        "세종 · 전세를 풍흉·비옥도로 나눔"
      ],
      "refs": [
        "tb:18:3"
      ],
      "stage": "late"
    },
    {
      "id": "jo-27",
      "stage": "late",
      "era": "조선 후기 · 경제",
      "topic": "경제의 변화 · 농업·상업·광업·화폐",
      "sub": "17~19세기 · 여러 왕 대에 걸친 변화",
      "sec": 8,
      "points": [
        "모내기법 → 벼·보리 이모작 확대",
        "구황 작물(감자·고구마) / 상품 작물(고추·담배)",
        "도고·보부상·송상 · 덕대·설점수세제 · 상평통보"
      ],
      "refs": [
        "tb:19:0",
        "tb:19:1",
        "tb:19:2",
        "tb:19:3",
        "tb:19:4",
        "tb:19:5"
      ],
      "quiz": [
        "qz:legacy-joseon-late-089",
        "qz:legacy-joseon-late-090",
        "qz:legacy-joseon-late-091",
        "qz:legacy-joseon-late-092",
        "qz:legacy-joseon-late-093",
        "qz:legacy-joseon-late-095",
        "qz:legacy-joseon-late-096",
        "qz:legacy-joseon-late-097",
        "qz:legacy-joseon-late-098",
        "qz:legacy-joseon-late-099",
        "qz:legacy-joseon-late-100",
        "qz:legacy-joseon-late-102",
        "qz:legacy-joseon-late-103",
        "qz:legacy-joseon-late-104",
        "qz:legacy-joseon-late-105",
        "qz:legacy-joseon-late-106"
      ],
      "notes": [
        "on:joseon-late:4:0",
        "on:joseon-late:4:1",
        "on:joseon-late:4:2",
        "on:joseon-late:4:3",
        "on:joseon-late:4:4"
      ],
      "aux": [
        {
          "src": "on:joseon-late:4:4",
          "text": "숙종 때 상평통보 발행·보급 · 전황 = 시중 돈 부족"
        },
        {
          "src": "on:joseon-late:4:2",
          "text": "송상=개성(송방), 만상=의주, 경강상인=한강, 내상=동래"
        },
        {
          "src": "on:joseon-late:4:1",
          "text": "포구 중개 = 객주·여각"
        },
        {
          "src": "qz:legacy-joseon-late-091",
          "text": "구분(고려): 서적점·다점, 은병, 건원중보, 깊이갈이, 경시서, 벽란도"
        }
      ],
      "stageLabel": "경제·사회 (조선 후기, 시기 겹침)",
      "book": [
        "bk:u04_p17",
        "bk:u04_p19",
        "bk:u04_p25",
        "bk:u04_p26"
      ],
      "core": [
        {
          "ref": "tb:19:0",
          "group": "경제의 변화 (조선 후기 사회)",
          "topic": "모내기법",
          "features": "벼·보리 이모작이 늘어남"
        },
        {
          "ref": "tb:19:1",
          "group": "경제의 변화 (조선 후기 사회)",
          "topic": "구황 작물 · 상품 작물",
          "features": "흉년 대비 작물 / 팔기 위한 작물"
        },
        {
          "ref": "tb:19:2",
          "group": "경제의 변화 (조선 후기 사회)",
          "topic": "도고 · 보부상",
          "features": "독점 도매 상인 / 장시를 도는 상인"
        },
        {
          "ref": "tb:19:3",
          "group": "경제의 변화 (조선 후기 사회)",
          "topic": "송상",
          "features": "개성 상인"
        },
        {
          "ref": "tb:19:4",
          "group": "경제의 변화 (조선 후기 사회)",
          "topic": "덕대 · 설점수세제",
          "features": "광산 경영자 / 민간 채굴 허용·세금"
        },
        {
          "ref": "tb:19:5",
          "group": "경제의 변화 (조선 후기 사회)",
          "topic": "상평통보",
          "features": "널리 쓰인 동전"
        }
      ]
    },
    {
      "era": "조선 후기 · 경제",
      "topic": "경제의 변화 (조선 후기 사회)",
      "sub": "핵심 관계 · 모내기법",
      "sec": 8,
      "points": [
        "모내기법",
        "벼·보리 이모작이 늘어남"
      ],
      "refs": [
        "tb:19:0"
      ],
      "stage": "late"
    },
    {
      "era": "조선 후기 · 경제",
      "topic": "경제의 변화 (조선 후기 사회)",
      "sub": "핵심 관계 · 구황 작물 · 상품 작물",
      "sec": 8,
      "points": [
        "구황 작물 · 상품 작물",
        "흉년 대비 작물 / 팔기 위한 작물"
      ],
      "refs": [
        "tb:19:1"
      ],
      "stage": "late"
    },
    {
      "era": "조선 후기 · 경제",
      "topic": "경제의 변화 (조선 후기 사회)",
      "sub": "핵심 관계 · 도고 · 보부상",
      "sec": 8,
      "points": [
        "도고 · 보부상",
        "독점 도매 상인 / 장시를 도는 상인"
      ],
      "refs": [
        "tb:19:2"
      ],
      "stage": "late"
    },
    {
      "era": "조선 후기 · 경제",
      "topic": "경제의 변화 (조선 후기 사회)",
      "sub": "핵심 관계 · 송상",
      "sec": 8,
      "points": [
        "송상",
        "개성 상인"
      ],
      "refs": [
        "tb:19:3"
      ],
      "stage": "late"
    },
    {
      "era": "조선 후기 · 경제",
      "topic": "경제의 변화 (조선 후기 사회)",
      "sub": "핵심 관계 · 덕대 · 설점수세제",
      "sec": 8,
      "points": [
        "덕대 · 설점수세제",
        "광산 경영자 / 민간 채굴 허용·세금"
      ],
      "refs": [
        "tb:19:4"
      ],
      "stage": "late"
    },
    {
      "era": "조선 후기 · 경제",
      "topic": "경제의 변화 (조선 후기 사회)",
      "sub": "핵심 관계 · 상평통보",
      "sec": 8,
      "points": [
        "상평통보",
        "널리 쓰인 동전"
      ],
      "refs": [
        "tb:19:5"
      ],
      "stage": "late"
    },
    {
      "id": "jo-28",
      "stage": "cross",
      "era": "조선 후기 · 사회",
      "topic": "신분과 사회의 변화 · 서민 문화·종교",
      "sub": "조선 후기 신분 동요 · 구제 기관",
      "sec": 8,
      "points": [
        "서얼 → 통청 운동 → 정조 때 규장각 검서관 기용",
        "중인 → 시사 / 한글소설·판소리 → 서민 문화 성장",
        "천주교(서학) → 박해 · 최제우 → 동학 창시"
      ],
      "refs": [
        "tb:20:0",
        "tb:20:1",
        "tb:20:2",
        "tb:20:3",
        "tb:20:4",
        "tb:20:5"
      ],
      "quiz": [
        "qz:legacy-joseon-late-044",
        "qz:legacy-joseon-late-075",
        "qz:legacy-joseon-late-076",
        "qz:legacy-joseon-late-077",
        "qz:legacy-joseon-late-078",
        "qz:legacy-joseon-late-079",
        "qz:legacy-joseon-late-080",
        "qz:legacy-joseon-late-081",
        "qz:legacy-joseon-late-084",
        "qz:legacy-joseon-late-085",
        "qz:legacy-joseon-late-086",
        "qz:legacy-joseon-late-088",
        "qz:legacy-joseon-late-138"
      ],
      "notes": [
        "on:joseon-late:5:0",
        "on:joseon-late:5:1",
        "on:joseon-late:5:2",
        "on:joseon-late:5:3",
        "on:joseon-late:8:4"
      ],
      "aux": [
        {
          "src": "on:joseon-late:5:0",
          "text": "박제가·이덕무 등 서얼이 검서관으로 기용"
        },
        {
          "src": "on:joseon-late:5:1",
          "text": "상민은 납속·공명첩으로 신분 상승"
        },
        {
          "src": "on:joseon-late:5:3",
          "text": "전기수·탈춤·산대놀이·민화도 서민 문화"
        },
        {
          "src": "on:joseon-late:8:4",
          "text": "신해박해=정조(윤지충) / 신유박해=순조(정약용 형제·황사영)"
        },
        {
          "src": "qz:legacy-joseon-late-077",
          "text": "구분(고려): 혜민국·동서대비원·제위보·구제도감"
        },
        {
          "src": "qz:legacy-joseon-late-138",
          "text": "정감록 = 조선 말 왕조 교체 예언서 (퀴즈에만 있음)"
        }
      ],
      "stageLabel": "경제·사회 (조선 후기, 시기 겹침)",
      "book": [
        "bk:u04_p16",
        "bk:u04_p17",
        "bk:u04_p19",
        "bk:u04_p25"
      ],
      "core": [
        {
          "ref": "tb:20:0",
          "group": "신분과 사회의 변화 (조선 후기 사회)",
          "topic": "서얼 · 규장각 검서관",
          "features": "관직 진출 요구 / 정조 때 기용"
        },
        {
          "ref": "tb:20:1",
          "group": "신분과 사회의 변화 (조선 후기 사회)",
          "topic": "중인 · 시사",
          "features": "시를 짓는 모임"
        },
        {
          "ref": "tb:20:2",
          "group": "신분과 사회의 변화 (조선 후기 사회)",
          "topic": "한글소설 · 판소리",
          "features": "서민 문화의 성장"
        },
        {
          "ref": "tb:20:3",
          "group": "신분과 사회의 변화 (조선 후기 사회)",
          "topic": "혜민서 · 동서활인서",
          "features": "치료·빈민 구제 기관"
        },
        {
          "ref": "tb:20:4",
          "group": "신분과 사회의 변화 (조선 후기 사회)",
          "topic": "천주교",
          "features": "서학으로 들어와 퍼짐 · 박해"
        },
        {
          "ref": "tb:20:5",
          "group": "신분과 사회의 변화 (조선 후기 사회)",
          "topic": "동학",
          "features": "최제우가 창시한 종교"
        }
      ]
    },
    {
      "era": "조선 후기 · 사회",
      "topic": "신분과 사회의 변화 (조선 후기 사회)",
      "sub": "핵심 관계 · 서얼 · 규장각 검서관",
      "sec": 8,
      "points": [
        "서얼 · 규장각 검서관",
        "관직 진출 요구 / 정조 때 기용"
      ],
      "refs": [
        "tb:20:0"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 후기 · 사회",
      "topic": "신분과 사회의 변화 (조선 후기 사회)",
      "sub": "핵심 관계 · 중인 · 시사",
      "sec": 8,
      "points": [
        "중인 · 시사",
        "시를 짓는 모임"
      ],
      "refs": [
        "tb:20:1"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 후기 · 사회",
      "topic": "신분과 사회의 변화 (조선 후기 사회)",
      "sub": "핵심 관계 · 한글소설 · 판소리",
      "sec": 8,
      "points": [
        "한글소설 · 판소리",
        "서민 문화의 성장"
      ],
      "refs": [
        "tb:20:2"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 후기 · 사회",
      "topic": "신분과 사회의 변화 (조선 후기 사회)",
      "sub": "핵심 관계 · 혜민서 · 동서활인서",
      "sec": 8,
      "points": [
        "혜민서 · 동서활인서",
        "치료·빈민 구제 기관"
      ],
      "refs": [
        "tb:20:3"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 후기 · 사회",
      "topic": "신분과 사회의 변화 (조선 후기 사회)",
      "sub": "핵심 관계 · 천주교",
      "sec": 8,
      "points": [
        "천주교",
        "서학으로 들어와 퍼짐 · 박해"
      ],
      "refs": [
        "tb:20:4"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 후기 · 사회",
      "topic": "신분과 사회의 변화 (조선 후기 사회)",
      "sub": "핵심 관계 · 동학",
      "sec": 8,
      "points": [
        "동학",
        "최제우가 창시한 종교"
      ],
      "refs": [
        "tb:20:5"
      ],
      "stage": "cross"
    },
    {
      "id": "jo-29",
      "stage": "early",
      "era": "조선 전기 · 문화",
      "topic": "전기 왕들의 문화 사업",
      "sub": "태종 → 세종 → 세조 → 성종 → 명종",
      "sec": 8,
      "points": [
        "태종 → 주자소·계미자 / 혼일강리역대국도지도",
        "세종 → 칠정산·갑인자 · 농사직설·향약집성방",
        "세조 → 간경도감 · 성종 → 악학궤범 · 명종 → 구황촬요"
      ],
      "refs": [
        "tb:14:0",
        "tb:14:1",
        "tb:14:2",
        "tb:14:3",
        "tb:14:4",
        "tb:14:5",
        "tb:14:6"
      ],
      "quiz": [
        "qz:legacy-joseon-late-107",
        "qz:legacy-joseon-late-109",
        "qz:legacy-joseon-late-115",
        "qz:legacy-joseon-late-121",
        "qz:legacy-joseon-late-122",
        "qz:legacy-joseon-late-126",
        "qz:legacy-joseon-late-130",
        "qz:legacy-joseon-late-133"
      ],
      "notes": [
        "on:joseon-early:4:0",
        "on:joseon-early:4:1"
      ],
      "aux": [
        {
          "src": "on:joseon-early:4:0",
          "text": "세종 의방유취도 편찬"
        },
        {
          "src": "on:joseon-early:4:1",
          "text": "태조 천상열차분야지도 · 성종 동국여지승람"
        },
        {
          "src": "qz:legacy-joseon-late-130",
          "text": "삼강행실도 → 세종 (퀴즈·쪽 라벨에만 있음)"
        }
      ],
      "stageLabel": "문화·학문·기록 (시대 횡단)",
      "book": [
        "bk:u04_p20",
        "bk:u04_p26",
        "bk:u04_p27"
      ],
      "core": [
        {
          "ref": "tb:14:0",
          "group": "전기 왕들의 문화 사업",
          "topic": "태종 · 주자소 · 계미자",
          "features": "활자를 만드는 관청과 금속 활자"
        },
        {
          "ref": "tb:14:1",
          "group": "전기 왕들의 문화 사업",
          "topic": "태종 · 혼일강리역대국도지도",
          "features": "세계 지도"
        },
        {
          "ref": "tb:14:2",
          "group": "전기 왕들의 문화 사업",
          "topic": "세종 · 칠정산 · 갑인자",
          "features": "한양 기준 역법 / 금속 활자"
        },
        {
          "ref": "tb:14:3",
          "group": "전기 왕들의 문화 사업",
          "topic": "세종 · 농사직설 · 향약집성방",
          "features": "우리 농법서 / 우리 약재 의학서"
        },
        {
          "ref": "tb:14:4",
          "group": "전기 왕들의 문화 사업",
          "topic": "세조 · 간경도감",
          "features": "불경을 간행"
        },
        {
          "ref": "tb:14:5",
          "group": "전기 왕들의 문화 사업",
          "topic": "성종 · 악학궤범",
          "features": "음악을 정리"
        },
        {
          "ref": "tb:14:6",
          "group": "전기 왕들의 문화 사업",
          "topic": "명종 · 구황촬요",
          "features": "흉년을 견디는 법을 모은 책"
        }
      ]
    },
    {
      "era": "조선 전기 · 문화",
      "topic": "전기 왕들의 문화 사업",
      "sub": "핵심 관계 · 태종 · 주자소 · 계미자",
      "sec": 8,
      "points": [
        "태종 · 주자소 · 계미자",
        "활자를 만드는 관청과 금속 활자"
      ],
      "refs": [
        "tb:14:0"
      ],
      "stage": "early"
    },
    {
      "era": "조선 전기 · 문화",
      "topic": "전기 왕들의 문화 사업",
      "sub": "핵심 관계 · 태종 · 혼일강리역대국도지도",
      "sec": 8,
      "points": [
        "태종 · 혼일강리역대국도지도",
        "세계 지도"
      ],
      "refs": [
        "tb:14:1"
      ],
      "stage": "early"
    },
    {
      "era": "조선 전기 · 문화",
      "topic": "전기 왕들의 문화 사업",
      "sub": "핵심 관계 · 세종 · 칠정산 · 갑인자",
      "sec": 8,
      "points": [
        "세종 · 칠정산 · 갑인자",
        "한양 기준 역법 / 금속 활자"
      ],
      "refs": [
        "tb:14:2"
      ],
      "stage": "early"
    },
    {
      "era": "조선 전기 · 문화",
      "topic": "전기 왕들의 문화 사업",
      "sub": "핵심 관계 · 세종 · 농사직설 · 향약집성방",
      "sec": 8,
      "points": [
        "세종 · 농사직설 · 향약집성방",
        "우리 농법서 / 우리 약재 의학서"
      ],
      "refs": [
        "tb:14:3"
      ],
      "stage": "early"
    },
    {
      "era": "조선 전기 · 문화",
      "topic": "전기 왕들의 문화 사업",
      "sub": "핵심 관계 · 세조 · 간경도감",
      "sec": 8,
      "points": [
        "세조 · 간경도감",
        "불경을 간행"
      ],
      "refs": [
        "tb:14:4"
      ],
      "stage": "early"
    },
    {
      "era": "조선 전기 · 문화",
      "topic": "전기 왕들의 문화 사업",
      "sub": "핵심 관계 · 성종 · 악학궤범",
      "sec": 8,
      "points": [
        "성종 · 악학궤범",
        "음악을 정리"
      ],
      "refs": [
        "tb:14:5"
      ],
      "stage": "early"
    },
    {
      "era": "조선 전기 · 문화",
      "topic": "전기 왕들의 문화 사업",
      "sub": "핵심 관계 · 명종 · 구황촬요",
      "sec": 8,
      "points": [
        "명종 · 구황촬요",
        "흉년을 견디는 법을 모은 책"
      ],
      "refs": [
        "tb:14:6"
      ],
      "stage": "early"
    },
    {
      "id": "jo-30",
      "stage": "early",
      "era": "조선 · 성리학",
      "topic": "서원과 성리학자",
      "sub": "주세붕 · 이황 · 이이",
      "sec": 8,
      "points": [
        "주세붕 → 백운동 서원(최초) → 소수 서원(사액)",
        "이황 → 성학십도 · 기대승과 사단칠정 논쟁",
        "이이 → 성학집요: 성리학 정리 대표 저서"
      ],
      "refs": [
        "tb:14:7",
        "tb:14:8"
      ],
      "quiz": [
        "qz:legacy-joseon-late-111",
        "qz:legacy-joseon-late-112",
        "qz:legacy-joseon-late-127",
        "qz:legacy-joseon-late-134",
        "qz:legacy-joseon-late-135"
      ],
      "notes": [
        "on:joseon-early:4:2",
        "on:joseon-late:8:1",
        "on:joseon-late:8:2"
      ],
      "aux": [
        {
          "src": "on:joseon-early:4:2",
          "text": "백운동서원은 명종 때 소수서원으로 사액"
        },
        {
          "src": "qz:legacy-joseon-late-127",
          "text": "이이 동호문답 (퀴즈에만 있음)"
        },
        {
          "src": "qz:legacy-joseon-late-135",
          "text": "가례집람 → 정답 표기 선조(김장생), uncertain"
        }
      ],
      "stageLabel": "문화·학문·기록 (시대 횡단)",
      "book": [
        "bk:u04_p21",
        "bk:u04_p26",
        "bk:u04_p27"
      ],
      "core": [
        {
          "ref": "tb:14:7",
          "group": "전기 왕들의 문화 사업",
          "topic": "주세붕 · 백운동 서원 → 소수 서원",
          "features": "최초의 서원 → 사액 서원"
        },
        {
          "ref": "tb:14:8",
          "group": "전기 왕들의 문화 사업",
          "topic": "이황 · 성학십도 / 이이 · 성학집요",
          "features": "성리학을 정리한 대표 저서"
        }
      ]
    },
    {
      "era": "조선 · 성리학",
      "topic": "전기 왕들의 문화 사업",
      "sub": "핵심 관계 · 주세붕 · 백운동 서원 → 소수 서원",
      "sec": 8,
      "points": [
        "주세붕 · 백운동 서원 → 소수 서원",
        "최초의 서원 → 사액 서원"
      ],
      "refs": [
        "tb:14:7"
      ],
      "stage": "early"
    },
    {
      "era": "조선 · 성리학",
      "topic": "전기 왕들의 문화 사업",
      "sub": "핵심 관계 · 이황 · 성학십도 / 이이 · 성학집요",
      "sec": 8,
      "points": [
        "이황 · 성학십도 / 이이 · 성학집요",
        "성리학을 정리한 대표 저서"
      ],
      "refs": [
        "tb:14:8"
      ],
      "stage": "early"
    },
    {
      "id": "jo-31",
      "stage": "cross",
      "era": "조선 · 기록",
      "topic": "기록물과 대외 사절",
      "sub": "조선 전 시기 기록물 · 통신사",
      "sec": 8,
      "points": [
        "조선왕조실록 → 왕대별 국정 / 의궤 → 왕실 행사",
        "승정원 → 승정원일기 · 허준 → 동의보감",
        "통신사 → 일본에 보낸 사절"
      ],
      "refs": [
        "tb:21:0",
        "tb:21:1",
        "tb:21:2",
        "tb:21:3",
        "tb:21:4"
      ],
      "quiz": [
        "qz:legacy-joseon-late-072",
        "qz:legacy-joseon-late-073",
        "qz:legacy-joseon-late-074",
        "qz:legacy-joseon-late-108",
        "qz:legacy-joseon-late-123"
      ],
      "notes": [],
      "aux": [
        {
          "src": "qz:legacy-joseon-late-108",
          "text": "동의보감 정답 표기에 광해군 병기"
        },
        {
          "src": "qz:legacy-joseon-late-123",
          "text": "통신사 = 임진왜란 이후 에도 막부 요청"
        },
        {
          "src": "qz:legacy-joseon-late-072",
          "text": "대외 상대 구분: 연행사→청, 동평관→왜, 경성·경원 무역소→여진"
        }
      ],
      "stageLabel": "문화·학문·기록 (시대 횡단)",
      "book": [
        "bk:u04_p16",
        "bk:u04_p20",
        "bk:u04_p25",
        "bk:u04_p26"
      ],
      "core": [
        {
          "ref": "tb:21:0",
          "group": "기록과 외교 (조선 전 시기 기록물)",
          "topic": "조선왕조실록",
          "features": "왕대별 국정 기록"
        },
        {
          "ref": "tb:21:1",
          "group": "기록과 외교 (조선 전 시기 기록물)",
          "topic": "조선왕조의궤",
          "features": "왕실 행사 기록"
        },
        {
          "ref": "tb:21:2",
          "group": "기록과 외교 (조선 전 시기 기록물)",
          "topic": "승정원일기",
          "features": "승정원이 남긴 업무·국정 기록"
        },
        {
          "ref": "tb:21:3",
          "group": "기록과 외교 (조선 전 시기 기록물)",
          "topic": "동의보감",
          "features": "허준의 의학서"
        },
        {
          "ref": "tb:21:4",
          "group": "기록과 외교 (조선 전 시기 기록물)",
          "topic": "통신사",
          "features": "일본에 보낸 사절"
        }
      ]
    },
    {
      "era": "조선 · 기록",
      "topic": "기록과 외교 (조선 전 시기 기록물)",
      "sub": "핵심 관계 · 조선왕조실록",
      "sec": 8,
      "points": [
        "조선왕조실록",
        "왕대별 국정 기록"
      ],
      "refs": [
        "tb:21:0"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 · 기록",
      "topic": "기록과 외교 (조선 전 시기 기록물)",
      "sub": "핵심 관계 · 조선왕조의궤",
      "sec": 8,
      "points": [
        "조선왕조의궤",
        "왕실 행사 기록"
      ],
      "refs": [
        "tb:21:1"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 · 기록",
      "topic": "기록과 외교 (조선 전 시기 기록물)",
      "sub": "핵심 관계 · 승정원일기",
      "sec": 8,
      "points": [
        "승정원일기",
        "승정원이 남긴 업무·국정 기록"
      ],
      "refs": [
        "tb:21:2"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 · 기록",
      "topic": "기록과 외교 (조선 전 시기 기록물)",
      "sub": "핵심 관계 · 동의보감",
      "sec": 8,
      "points": [
        "동의보감",
        "허준의 의학서"
      ],
      "refs": [
        "tb:21:3"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 · 기록",
      "topic": "기록과 외교 (조선 전 시기 기록물)",
      "sub": "핵심 관계 · 통신사",
      "sec": 8,
      "points": [
        "통신사",
        "일본에 보낸 사절"
      ],
      "refs": [
        "tb:21:4"
      ],
      "stage": "cross"
    },
    {
      "id": "jo-32",
      "stage": "late",
      "era": "조선 후기 · 실학",
      "topic": "실학 ① 토지 개혁론과 정약용",
      "sub": "유형원 · 이익 · 정약용",
      "sec": 8,
      "points": [
        "유형원 → 균전론: 신분 따라 토지 분배",
        "이익 → 한전론(매매 제한) · 정약용 → 여전론",
        "정약용 → 경세유표·마과회통 · 기기도설→거중기"
      ],
      "refs": [
        "tb:22:0",
        "tb:22:1",
        "tb:22:2",
        "tb:22:3",
        "tb:22:4"
      ],
      "quiz": [
        "qz:legacy-joseon-late-131",
        "qz:legacy-joseon-late-132"
      ],
      "notes": [
        "on:joseon-late:7:0",
        "on:joseon-late:7:4"
      ],
      "aux": [
        {
          "src": "on:joseon-late:7:0",
          "text": "유형원=반계수록, 이익=좀론"
        },
        {
          "src": "on:joseon-late:7:4",
          "text": "거중기 → 수원 화성 축조에 사용"
        }
      ],
      "stageLabel": "문화·학문·기록 (시대 횡단)",
      "book": [
        "bk:u04_p22",
        "bk:u04_p27"
      ],
      "core": [
        {
          "ref": "tb:22:0",
          "group": "실학 · 토지 개혁",
          "topic": "유형원 · 균전론",
          "features": "신분에 따라 토지를 나눠 주자"
        },
        {
          "ref": "tb:22:1",
          "group": "실학 · 토지 개혁",
          "topic": "이익 · 한전론",
          "features": "토지 매매를 제한하자"
        },
        {
          "ref": "tb:22:2",
          "group": "실학 · 토지 개혁",
          "topic": "정약용 · 여전론",
          "features": "마을이 함께 짓고 일한 만큼 나누자"
        },
        {
          "ref": "tb:22:3",
          "group": "실학 · 토지 개혁",
          "topic": "정약용 · 경세유표 · 마과회통",
          "features": "제도 개혁 / 홍역 의학"
        },
        {
          "ref": "tb:22:4",
          "group": "실학 · 토지 개혁",
          "topic": "정약용 · 기기도설 · 거중기",
          "features": "서양 기술 참고 / 무거운 돌 들기"
        }
      ]
    },
    {
      "era": "조선 후기 · 실학",
      "topic": "실학 · 토지 개혁",
      "sub": "핵심 관계 · 유형원 · 균전론",
      "sec": 8,
      "points": [
        "유형원 · 균전론",
        "신분에 따라 토지를 나눠 주자"
      ],
      "refs": [
        "tb:22:0"
      ],
      "stage": "late"
    },
    {
      "era": "조선 후기 · 실학",
      "topic": "실학 · 토지 개혁",
      "sub": "핵심 관계 · 이익 · 한전론",
      "sec": 8,
      "points": [
        "이익 · 한전론",
        "토지 매매를 제한하자"
      ],
      "refs": [
        "tb:22:1"
      ],
      "stage": "late"
    },
    {
      "era": "조선 후기 · 실학",
      "topic": "실학 · 토지 개혁",
      "sub": "핵심 관계 · 정약용 · 여전론",
      "sec": 8,
      "points": [
        "정약용 · 여전론",
        "마을이 함께 짓고 일한 만큼 나누자"
      ],
      "refs": [
        "tb:22:2"
      ],
      "stage": "late"
    },
    {
      "era": "조선 후기 · 실학",
      "topic": "실학 · 토지 개혁",
      "sub": "핵심 관계 · 정약용 · 경세유표 · 마과회통",
      "sec": 8,
      "points": [
        "정약용 · 경세유표 · 마과회통",
        "제도 개혁 / 홍역 의학"
      ],
      "refs": [
        "tb:22:3"
      ],
      "stage": "late"
    },
    {
      "era": "조선 후기 · 실학",
      "topic": "실학 · 토지 개혁",
      "sub": "핵심 관계 · 정약용 · 기기도설 · 거중기",
      "sec": 8,
      "points": [
        "정약용 · 기기도설 · 거중기",
        "서양 기술 참고 / 무거운 돌 들기"
      ],
      "refs": [
        "tb:22:4"
      ],
      "stage": "late"
    },
    {
      "id": "jo-33",
      "stage": "late",
      "era": "조선 후기 · 실학",
      "topic": "실학 ② 북학·상공업·백과·역법",
      "sub": "홍대용 · 박지원 · 박제가 · 유수원 외",
      "sec": 8,
      "points": [
        "홍대용 → 의산문답·지전설 / 박지원 → 열하일기·양반전",
        "박제가 → 북학의(청 문물) · 유수원 → 우서(직업 평등)",
        "이수광 지봉유설 · 서유구 임원경제지 · 김육 시헌력"
      ],
      "refs": [
        "tb:23:0",
        "tb:23:1",
        "tb:23:2",
        "tb:23:3",
        "tb:23:4",
        "tb:23:5",
        "tb:23:6"
      ],
      "quiz": [
        "qz:legacy-joseon-late-113",
        "qz:legacy-joseon-late-117",
        "qz:legacy-joseon-late-119",
        "qz:legacy-joseon-late-139"
      ],
      "notes": [
        "on:joseon-late:7:1"
      ],
      "aux": [
        {
          "src": "qz:legacy-joseon-late-113",
          "text": "홍대용 무한 우주론"
        },
        {
          "src": "qz:legacy-joseon-late-117",
          "text": "박제가는 서자 출신 규장각 검서관"
        }
      ],
      "stageLabel": "문화·학문·기록 (시대 횡단)",
      "book": [
        "bk:u04_p22",
        "bk:u04_p26",
        "bk:u04_p27"
      ],
      "core": [
        {
          "ref": "tb:23:0",
          "group": "실학 · 상공업과 청 문물",
          "topic": "홍대용 · 의산문답 · 지전설",
          "features": "지구가 돈다는 주장"
        },
        {
          "ref": "tb:23:1",
          "group": "실학 · 상공업과 청 문물",
          "topic": "박지원 · 열하일기 · 양반전",
          "features": "수레·선박 이용 / 양반 풍자"
        },
        {
          "ref": "tb:23:2",
          "group": "실학 · 상공업과 청 문물",
          "topic": "박제가 · 북학의",
          "features": "청의 문물을 배우자"
        },
        {
          "ref": "tb:23:3",
          "group": "실학 · 상공업과 청 문물",
          "topic": "유수원 · 우서",
          "features": "사농공상 직업의 평등"
        },
        {
          "ref": "tb:23:4",
          "group": "실학 · 상공업과 청 문물",
          "topic": "이수광 · 지봉유설",
          "features": "백과사전식 저술"
        },
        {
          "ref": "tb:23:5",
          "group": "실학 · 상공업과 청 문물",
          "topic": "서유구 · 임원경제지",
          "features": "농촌 생활 백과"
        },
        {
          "ref": "tb:23:6",
          "group": "실학 · 상공업과 청 문물",
          "topic": "김육 · 시헌력",
          "features": "새 역법 도입"
        }
      ]
    },
    {
      "era": "조선 후기 · 실학",
      "topic": "실학 · 상공업과 청 문물",
      "sub": "핵심 관계 · 홍대용 · 의산문답 · 지전설",
      "sec": 8,
      "points": [
        "홍대용 · 의산문답 · 지전설",
        "지구가 돈다는 주장"
      ],
      "refs": [
        "tb:23:0"
      ],
      "stage": "late"
    },
    {
      "era": "조선 후기 · 실학",
      "topic": "실학 · 상공업과 청 문물",
      "sub": "핵심 관계 · 박지원 · 열하일기 · 양반전",
      "sec": 8,
      "points": [
        "박지원 · 열하일기 · 양반전",
        "수레·선박 이용 / 양반 풍자"
      ],
      "refs": [
        "tb:23:1"
      ],
      "stage": "late"
    },
    {
      "era": "조선 후기 · 실학",
      "topic": "실학 · 상공업과 청 문물",
      "sub": "핵심 관계 · 박제가 · 북학의",
      "sec": 8,
      "points": [
        "박제가 · 북학의",
        "청의 문물을 배우자"
      ],
      "refs": [
        "tb:23:2"
      ],
      "stage": "late"
    },
    {
      "era": "조선 후기 · 실학",
      "topic": "실학 · 상공업과 청 문물",
      "sub": "핵심 관계 · 유수원 · 우서",
      "sec": 8,
      "points": [
        "유수원 · 우서",
        "사농공상 직업의 평등"
      ],
      "refs": [
        "tb:23:3"
      ],
      "stage": "late"
    },
    {
      "era": "조선 후기 · 실학",
      "topic": "실학 · 상공업과 청 문물",
      "sub": "핵심 관계 · 이수광 · 지봉유설",
      "sec": 8,
      "points": [
        "이수광 · 지봉유설",
        "백과사전식 저술"
      ],
      "refs": [
        "tb:23:4"
      ],
      "stage": "late"
    },
    {
      "era": "조선 후기 · 실학",
      "topic": "실학 · 상공업과 청 문물",
      "sub": "핵심 관계 · 서유구 · 임원경제지",
      "sec": 8,
      "points": [
        "서유구 · 임원경제지",
        "농촌 생활 백과"
      ],
      "refs": [
        "tb:23:5"
      ],
      "stage": "late"
    },
    {
      "era": "조선 후기 · 실학",
      "topic": "실학 · 상공업과 청 문물",
      "sub": "핵심 관계 · 김육 · 시헌력",
      "sec": 8,
      "points": [
        "김육 · 시헌력",
        "새 역법 도입"
      ],
      "refs": [
        "tb:23:6"
      ],
      "stage": "late"
    },
    {
      "id": "jo-34",
      "stage": "cross",
      "era": "조선 · 역사·지리",
      "topic": "역사서와 지도",
      "sub": "전기 관찬 사서 → 후기 발해고·지도",
      "sec": 8,
      "points": [
        "정인지 → 고려사 · 서거정 → 동국통감(고조선~고려)",
        "신숙주 → 해동제국기(일본) · 유득공 → 발해고",
        "정상기 → 동국지도(100리 척) · 김정호 → 대동여지도"
      ],
      "refs": [
        "tb:24:0",
        "tb:24:1",
        "tb:24:2",
        "tb:24:3",
        "tb:24:4",
        "tb:24:5",
        "tb:24:6"
      ],
      "quiz": [
        "qz:legacy-joseon-late-114",
        "qz:legacy-joseon-late-129",
        "qz:legacy-joseon-late-136",
        "qz:legacy-joseon-late-137"
      ],
      "notes": [
        "on:joseon-late:7:2",
        "on:joseon-late:7:3"
      ],
      "aux": [
        {
          "src": "on:joseon-late:7:2",
          "text": "유득공(발해고) ↔ 유수원(우서) 혼동 주의"
        },
        {
          "src": "on:joseon-late:7:3",
          "text": "안정복 동사강목 · 이중환 택리지"
        },
        {
          "src": "qz:legacy-joseon-late-136",
          "text": "종묘 = 역대 왕·왕비 신주"
        }
      ],
      "stageLabel": "문화·학문·기록 (시대 횡단)",
      "book": [
        "bk:u04_p21",
        "bk:u04_p22",
        "bk:u04_p26",
        "bk:u04_p27"
      ],
      "core": [
        {
          "ref": "tb:24:0",
          "group": "역사와 지리",
          "topic": "정인지 · 고려사",
          "features": "고려의 역사"
        },
        {
          "ref": "tb:24:1",
          "group": "역사와 지리",
          "topic": "서거정 · 동국통감",
          "features": "고조선부터 고려까지 통사"
        },
        {
          "ref": "tb:24:2",
          "group": "역사와 지리",
          "topic": "신숙주 · 해동제국기",
          "features": "일본 견문 기록"
        },
        {
          "ref": "tb:24:3",
          "group": "역사와 지리",
          "topic": "유득공 · 발해고",
          "features": "발해를 우리 역사로(남북국)"
        },
        {
          "ref": "tb:24:4",
          "group": "역사와 지리",
          "topic": "정상기 · 동국지도 · 100리 척",
          "features": "100리를 1척으로 줄인 지도"
        },
        {
          "ref": "tb:24:5",
          "group": "역사와 지리",
          "topic": "김정호 · 대동여지도",
          "features": "10리마다 눈금"
        },
        {
          "ref": "tb:24:6",
          "group": "역사와 지리",
          "topic": "종묘",
          "features": "왕실 조상을 모신 제례 공간"
        }
      ]
    },
    {
      "era": "조선 · 역사·지리",
      "topic": "역사와 지리",
      "sub": "핵심 관계 · 정인지 · 고려사",
      "sec": 8,
      "points": [
        "정인지 · 고려사",
        "고려의 역사"
      ],
      "refs": [
        "tb:24:0"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 · 역사·지리",
      "topic": "역사와 지리",
      "sub": "핵심 관계 · 서거정 · 동국통감",
      "sec": 8,
      "points": [
        "서거정 · 동국통감",
        "고조선부터 고려까지 통사"
      ],
      "refs": [
        "tb:24:1"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 · 역사·지리",
      "topic": "역사와 지리",
      "sub": "핵심 관계 · 신숙주 · 해동제국기",
      "sec": 8,
      "points": [
        "신숙주 · 해동제국기",
        "일본 견문 기록"
      ],
      "refs": [
        "tb:24:2"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 · 역사·지리",
      "topic": "역사와 지리",
      "sub": "핵심 관계 · 유득공 · 발해고",
      "sec": 8,
      "points": [
        "유득공 · 발해고",
        "발해를 우리 역사로(남북국)"
      ],
      "refs": [
        "tb:24:3"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 · 역사·지리",
      "topic": "역사와 지리",
      "sub": "핵심 관계 · 정상기 · 동국지도 · 100리 척",
      "sec": 8,
      "points": [
        "정상기 · 동국지도 · 100리 척",
        "100리를 1척으로 줄인 지도"
      ],
      "refs": [
        "tb:24:4"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 · 역사·지리",
      "topic": "역사와 지리",
      "sub": "핵심 관계 · 김정호 · 대동여지도",
      "sec": 8,
      "points": [
        "김정호 · 대동여지도",
        "10리마다 눈금"
      ],
      "refs": [
        "tb:24:5"
      ],
      "stage": "cross"
    },
    {
      "era": "조선 · 역사·지리",
      "topic": "역사와 지리",
      "sub": "핵심 관계 · 종묘",
      "sec": 8,
      "points": [
        "종묘",
        "왕실 조상을 모신 제례 공간"
      ],
      "refs": [
        "tb:24:6"
      ],
      "stage": "cross"
    },
    {
      "id": "jo-35",
      "stage": "late",
      "era": "조선 후기 · 문화",
      "topic": "후기 왕의 편찬 · 양명학 · 서화",
      "sub": "영조 · 정조 · 정제두 · 정선 · 김정희",
      "sec": 8,
      "points": [
        "영조 → 속대전·동국문헌비고 · 정조 → 수원 화성",
        "정제두 → 양명학·강화학파 · 정선 → 진경산수화",
        "김정희 → 추사체·세한도·금석과안록 / 신윤복·김득신"
      ],
      "refs": [
        "tb:25:0",
        "tb:25:1",
        "tb:25:2",
        "tb:25:3",
        "tb:25:4",
        "tb:25:5",
        "tb:25:6"
      ],
      "quiz": [
        "qz:legacy-joseon-late-110",
        "qz:legacy-joseon-late-116",
        "qz:legacy-joseon-late-118",
        "qz:legacy-joseon-late-120",
        "qz:legacy-joseon-late-124",
        "qz:legacy-joseon-late-125",
        "qz:legacy-joseon-late-128"
      ],
      "notes": [
        "on:joseon-late:8:0",
        "on:joseon-late:8:3",
        "on:joseon-early:4:3"
      ],
      "aux": [
        {
          "src": "on:joseon-late:8:0",
          "text": "정조 → 대전통편·무예도보통지"
        },
        {
          "src": "on:joseon-late:8:3",
          "text": "정선 금강전도·인왕제색도"
        },
        {
          "src": "on:joseon-early:4:3",
          "text": "전기 그림(안견 몽유도원도·강희안 고사관수도)과 구분"
        }
      ],
      "stageLabel": "문화·학문·기록 (시대 횡단)",
      "book": [
        "bk:u04_p20",
        "bk:u04_p23",
        "bk:u04_p27"
      ],
      "core": [
        {
          "ref": "tb:25:0",
          "group": "후기 왕과 예술",
          "topic": "영조 · 속대전 · 동국문헌비고",
          "features": "법전 정비 / 문물 백과"
        },
        {
          "ref": "tb:25:1",
          "group": "후기 왕과 예술",
          "topic": "정조 · 수원 화성",
          "features": "거중기를 써서 쌓은 성"
        },
        {
          "ref": "tb:25:2",
          "group": "후기 왕과 예술",
          "topic": "정제두 · 강화학파",
          "features": "양명학"
        },
        {
          "ref": "tb:25:3",
          "group": "후기 왕과 예술",
          "topic": "정선",
          "features": "진경산수화"
        },
        {
          "ref": "tb:25:4",
          "group": "후기 왕과 예술",
          "topic": "김정희 · 추사체 · 세한도",
          "features": "글씨체와 그림"
        },
        {
          "ref": "tb:25:5",
          "group": "후기 왕과 예술",
          "topic": "김정희 · 금석과안록",
          "features": "북한산비가 진흥왕 순수비임을 밝힘"
        },
        {
          "ref": "tb:25:6",
          "group": "후기 왕과 예술",
          "topic": "신윤복 · 월하정인 / 김득신 · 파적도",
          "features": "풍속화"
        }
      ]
    },
    {
      "era": "조선 후기 · 문화",
      "topic": "후기 왕과 예술",
      "sub": "핵심 관계 · 영조 · 속대전 · 동국문헌비고",
      "sec": 8,
      "points": [
        "영조 · 속대전 · 동국문헌비고",
        "법전 정비 / 문물 백과"
      ],
      "refs": [
        "tb:25:0"
      ],
      "stage": "late"
    },
    {
      "era": "조선 후기 · 문화",
      "topic": "후기 왕과 예술",
      "sub": "핵심 관계 · 정조 · 수원 화성",
      "sec": 8,
      "points": [
        "정조 · 수원 화성",
        "거중기를 써서 쌓은 성"
      ],
      "refs": [
        "tb:25:1"
      ],
      "stage": "late"
    },
    {
      "era": "조선 후기 · 문화",
      "topic": "후기 왕과 예술",
      "sub": "핵심 관계 · 정제두 · 강화학파",
      "sec": 8,
      "points": [
        "정제두 · 강화학파",
        "양명학"
      ],
      "refs": [
        "tb:25:2"
      ],
      "stage": "late"
    },
    {
      "era": "조선 후기 · 문화",
      "topic": "후기 왕과 예술",
      "sub": "핵심 관계 · 정선",
      "sec": 8,
      "points": [
        "정선",
        "진경산수화"
      ],
      "refs": [
        "tb:25:3"
      ],
      "stage": "late"
    },
    {
      "era": "조선 후기 · 문화",
      "topic": "후기 왕과 예술",
      "sub": "핵심 관계 · 김정희 · 추사체 · 세한도",
      "sec": 8,
      "points": [
        "김정희 · 추사체 · 세한도",
        "글씨체와 그림"
      ],
      "refs": [
        "tb:25:4"
      ],
      "stage": "late"
    },
    {
      "era": "조선 후기 · 문화",
      "topic": "후기 왕과 예술",
      "sub": "핵심 관계 · 김정희 · 금석과안록",
      "sec": 8,
      "points": [
        "김정희 · 금석과안록",
        "북한산비가 진흥왕 순수비임을 밝힘"
      ],
      "refs": [
        "tb:25:5"
      ],
      "stage": "late"
    },
    {
      "era": "조선 후기 · 문화",
      "topic": "후기 왕과 예술",
      "sub": "핵심 관계 · 신윤복 · 월하정인 / 김득신 · 파적도",
      "sec": 8,
      "points": [
        "신윤복 · 월하정인 / 김득신 · 파적도",
        "풍속화"
      ],
      "refs": [
        "tb:25:6"
      ],
      "stage": "late"
    },
    {
      "id": "jo-36",
      "kind": "summary",
      "stage": "late",
      "era": "조선",
      "topic": "전체 정리",
      "sub": "왕의 순서 + 여러 왕 대에 걸친 변화",
      "sec": 9,
      "points": [
        "제도 정비 → 사화·붕당 → 양난 → 탕평 → 세도",
        "세금 셋: 영정법(인조)·대동법(광해군)·균역법(영조)",
        "경제·사회·문화는 여러 왕 대에 걸쳐 겹침"
      ],
      "refs": [
        "tb:18:0",
        "tb:18:1",
        "tb:18:2"
      ],
      "quiz": [],
      "notes": [],
      "aux": [
        {
          "src": "flow",
          "text": "경제·사회 변화는 앞 정치 사건이 바로 일으켰다고 잇지 않는다"
        }
      ],
      "stageLabel": "전체 정리",
      "book": [],
      "core": [
        {
          "ref": "tb:18:0",
          "group": "세금 3종 · 조선 전 시기 비교",
          "topic": "전세(토지) · 영정법",
          "features": "인조 · 땅에 매긴 세 → 풍흉과 관계없이 고정"
        },
        {
          "ref": "tb:18:1",
          "group": "세금 3종 · 조선 전 시기 비교",
          "topic": "공납(특산물) · 대동법",
          "features": "광해군 시작 · 집마다 특산물 → 토지 기준 쌀·베·동전"
        },
        {
          "ref": "tb:18:2",
          "group": "세금 3종 · 조선 전 시기 비교",
          "topic": "군역(군포) · 균역법",
          "features": "영조 · 2필 → 1필, 결작 등으로 보충"
        }
      ]
    }
  ],
  "uncertain": [
    {
      "item": "진관 체제 → 세조",
      "src": "qz:legacy-joseon-late-070",
      "reason": "퀴즈에만 있음, core·노트 근거 없음"
    },
    {
      "item": "총융청·수어청 → 인조",
      "src": "qz:legacy-joseon-late-039",
      "reason": "퀴즈에만 있음"
    },
    {
      "item": "만동묘 → 숙종",
      "src": "qz:legacy-joseon-late-049",
      "reason": "퀴즈에만 있음"
    },
    {
      "item": "승문원 = 사대교린 문서",
      "src": "qz:legacy-joseon-late-063",
      "reason": "퀴즈·쪽 라벨(p24)에만 있음, 설치 왕 없음"
    },
    {
      "item": "연행사·동평관·무역소",
      "src": "qz:legacy-joseon-late-072~074",
      "reason": "상대국만 있고 왕·연도 없음 → 시기 미표기"
    },
    {
      "item": "이덕형 청원사 · 이만주 정벌 · 이이 동호문답",
      "src": "qz:legacy-joseon-late-006, early-023, late-127",
      "reason": "퀴즈에만 있음"
    },
    {
      "item": "삼강행실도 → 세종",
      "src": "qz:legacy-joseon-late-130, bk:u04_p20",
      "reason": "퀴즈와 맥락 없는 쪽 라벨에만 있음"
    },
    {
      "item": "가례집람 → 선조 (김장생)",
      "src": "qz:legacy-joseon-late-135, bk:u04_p27",
      "reason": "정답 표기가 왕·인물 혼합, 저자 관계 단정 안 함"
    },
    {
      "item": "이황 정답의 \"(=소수서원)\" 주석",
      "src": "qz:legacy-joseon-late-112",
      "reason": "관계 불명확 → 성학십도 저자=이황만 채택"
    },
    {
      "item": "정감록",
      "src": "qz:legacy-joseon-late-138, bk:u04_p20",
      "reason": "\"조선 말\"만 있고 왕·연도 없음"
    },
    {
      "item": "허적과 \"윤후\"",
      "src": "qz:legacy-joseon-late-045",
      "reason": "쪽 라벨 p11은 \"허적과 윤휴\" → 퀴즈 오기로 보임"
    },
    {
      "item": "\"사당칠정\"",
      "src": "qz:legacy-joseon-late-134",
      "reason": "노트·p21은 사단칠정 → 퀴즈 오기로 보임"
    },
    {
      "item": "공노비 해방 범위",
      "src": "tb:17:0 vs qz:legacy-joseon-late-026, on:joseon-late:5:2",
      "reason": "core=내수사·중앙 관청 납공 노비, 퀴즈=궁방·중앙 관서 6만여 명 → core 표현 우선"
    },
    {
      "item": "백운동 서원 사액 시기",
      "src": "on:joseon-early:4:2 vs bk:u04_p21",
      "reason": "노트=명종 때 사액, p21 \"중종\" 라벨은 맥락 없음 → 단정 안 함"
    },
    {
      "item": "상평통보 발행 왕",
      "src": "on:joseon-late:4:4",
      "reason": "core에는 왕 없음, 노트만 숙종 → aux로만 표기"
    },
    {
      "item": "혜민서·동서활인서·천주교·동학·통신사의 연도",
      "src": "tb:20:3~5, tb:21:4",
      "reason": "core에 연도·왕 없음 → 연도 미표기"
    },
    {
      "item": "교재 쪽 라벨 중 제목·조각",
      "src": "bk:u04_p04,p09,p15,p16,p18,p20~p23",
      "reason": "\"을 정벌\", \"또는 후원\", \"유\", \"교\", \"도기\", \"사실적\", \"권력\", \"장악\", \"연구\", \"백과\", \"사전\", \"언어\", \"지리지\", \"국학\", \"중농\", \"중상\", \"천문학\", \"농서\", \"기타\", \"건축\", \"지도\", \"조선 전기/후기/말\" 및 분류 제목 → 관계 근거로 쓰지 않음"
    },
    {
      "item": "core 밖 쪽 라벨 인물·용어",
      "src": "bk:u04_p10,p11,p12,p18",
      "reason": "곽재우·김천일·고경명·회답겸쇄환사·대제학·이승훈·인현 왕후 등은 라벨만 있어 관계 미추가(일부는 노트·퀴즈 aux로만)"
    }
  ],
  "coverage": {
    "coreRows": {
      "total": 140,
      "covered": 140,
      "missing": [],
      "duplicates": [],
      "badRefs": []
    },
    "quiz": {
      "expected": 173,
      "covered": 173
    },
    "originalNotes": {
      "expected": 65,
      "covered": 65
    },
    "bookPages": {
      "total": 28,
      "withLabels": 25
    },
    "cards": 36,
    "pointIssues": []
  },
  "stageBasis": "textbook core group chronology; shared or mixed topics are cross and included in both ranges"
};root.HANQ_JOSEON_REVIEW=deck;root.HANQ_MEMORY_REVIEWS=root.HANQ_MEMORY_REVIEWS||{};root.HANQ_MEMORY_REVIEWS.joseon=deck;})(typeof window!=='undefined'?window:globalThis);
