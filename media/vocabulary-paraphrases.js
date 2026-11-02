/* Context-bound learning glosses. No note mutation, IDs, storage or account requests. */
(function(root){'use strict';var entries={
  "diminish": {"context":"소음의 감소","items":[{"expression":"decrease","meaning":"줄어들다","note":"소음의 양이나 정도가 작아지는 문맥"}]},
  "obvious": {"context":"분명한 해결책","items":[{"expression":"clear","meaning":"분명한","note":"쉽게 알아볼 수 있는 문맥"}]},
  "throughout": {"context":"기간 전체","items":[{"expression":"during the whole of","meaning":"~의 기간 내내","note":"기간 전체를 나타내는 문맥"}]},
  "other than": {"context":"제외","items":[{"expression":"except for","meaning":"~을 제외하고","note":"대상을 제외하는 문맥"}]},
  "notwithstanding": {"context":"양보","items":[{"expression":"despite","meaning":"~에도 불구하고","note":"명사구 앞의 양보 표현"}]},
  "upon": {"context":"도착 직후","items":[{"expression":"on arrival","meaning":"도착하자마자","note":"예문의 도착 시점을 풀어 쓴 표현"}]},
  "severe": {"context":"날씨","items":[{"expression":"harsh","meaning":"혹독한","note":"날씨가 심한 문맥"}]},
  "in the event of": {"context":"상황 발생","items":[{"expression":"if there is","meaning":"~이 발생하면","note":"명사구를 절로 풀어 쓴 표현"}]},
  "of the following": {"context":"선택","items":[{"expression":"from the options below","meaning":"아래 선택지 중에서","note":"선택 대상을 풀어 쓴 표현"}]},
  "rate": {"context":"호텔 요금","items":[{"expression":"price","meaning":"가격·요금","note":"호텔 요금 문맥"}]},
  "nevertheless": {"context":"대조","items":[{"expression":"even so","meaning":"그럼에도","note":"앞 문장과 대조하는 부사 표현"}]},
  "if so": {"context":"앞 조건이 성립하는 경우","items":[{"expression":"if that is the case","meaning":"그런 경우라면"}]},
  "batter": {"context":"빵틀에 부어 굽는 반죽 문맥","items":[{"expression":"a liquid mixture for baking","meaning":"굽기 위해 만든 묽은 혼합물","note":"뜻을 풀어 쓴 설명"}]},
  "into": {"context":"빵틀 안쪽으로 붓는 방향","items":[{"expression":"to the inside of","meaning":"~의 안쪽으로","note":"이 문장의 이동 방향을 풀어 쓴 설명"}]},
  "mitigate": {"context":"위험·피해를 줄이는 문맥","items":[{"expression":"reduce / lessen","meaning":"줄이다·덜다","note":"mitigate risks/damage와 대응하는 문맥"}]},
  "sort": {"context":"sort through applications의 검토·선별 문맥","items":[{"expression":"go through applications one by one","meaning":"지원서를 하나씩 살펴보다","note":"지원서를 검토하는 동작의 유사 표현"}]},
  "once": {"context":"수습을 마친 뒤 혜택 자격이 생기는 문맥","items":[{"expression":"after they complete the probationary period","meaning":"그들이 수습 기간을 마친 후","note":"once의 선후 관계를 풀어 쓴 표현; 언제나 ‘즉시’를 뜻하지는 않음"}]},
  "benefit": {"context":"회사의 health benefits 문맥","items":[{"expression":"employer-provided health coverage","meaning":"회사가 제공하는 의료·건강보험 보장","note":"일반적인 benefit=이점과 구분"}]},
  "probationary": {"context":"probationary period의 수습 기간 문맥","items":[{"expression":"initial trial period","meaning":"초기의 수습·평가 기간"}]},
  "among": {"context":"여러 주제에 포함되는 문맥","items":[{"expression":"be included in","meaning":"~에 포함되다","note":"are among the topics → are included in the topics"}]},
  "primary": {"context":"중요도에서 주된·주요한 것","items":[{"expression":"main / principal","meaning":"주된·주요한","note":"primary ingredient → main ingredient처럼 명사를 꾸미는 문맥"}]},
  "favor": {"context":"뜻과 품사에 따라 구별","items":[{"expression":"help","meaning":"명사: 도움","note":"do someone a favor의 도움 문맥"},{"expression":"prefer / support","meaning":"동사: 선호하다 / 지지하다","note":"favor a plan처럼 계획·제안을 고르거나 지지하는 문맥"}]},
  "slip": {"context":"서류·배송 문맥","items":[{"expression":"a small piece of paper","meaning":"작은 종이 한 장"},{"expression":"packing list","meaning":"포장 물품 목록","note":"packing slip의 물품·수량을 확인하는 용도"}]},
  "vulnerable": {"context":"피해 위험에 노출된 문맥","items":[{"expression":"at risk of theft","meaning":"도난 위험에 처한","note":"vulnerable to theft와 대응; of 뒤 위험 내용"}]},
  "absorb": {"context":"정보·지식을 이해하는 문맥","items":[{"expression":"take in information","meaning":"정보를 받아들이다·이해하다","note":"액체 흡수와는 뜻을 구별"}]},
  "reluctantly": {"context":"내키지 않지만 행동하는 문맥","items":[{"expression":"unwillingly","meaning":"마지못해"}]},
  "ripe": {"context":"먹을 만큼 익은 과일","items":[{"expression":"ready to eat","meaning":"먹을 만큼 익은","note":"과일이 익은 상태를 풀어 쓴 표현"}]},
  "mash": {"context":"음식을 눌러 으깨는 문맥","items":[{"expression":"crush into a soft mass","meaning":"눌러 부드러운 덩어리로 으깨다"}]},
  "flour": {"context":"곡물을 갈아 만든 가루","items":[{"expression":"finely ground grain","meaning":"곱게 간 곡물","note":"뜻을 풀어 쓴 설명; 모든 powder가 flour는 아님"}]},
  "loaf": {"context":"한 덩어리로 구운 빵","items":[{"expression":"a whole piece of baked bread","meaning":"통째로 구운 빵 한 덩이","note":"bread는 빵 일반, a loaf는 그 한 덩이"}]},
  "toothpick": {"context":"사물의 뜻을 풀어 쓴 설명","items":[{"expression":"a small stick for cleaning between teeth","meaning":"이 사이를 청소하는 작은 막대"}]},
  "alleviate": {"context":"부담을 줄이는 문맥","items":[{"expression":"ease / lessen the burden","meaning":"부담을 덜다·줄이다","note":"alleviate the burden과 대응"}]},
  "revamp": {"context":"좌석 배치·구성을 손보는 문맥","items":[{"expression":"redesign","meaning":"다시 설계하다","note":"배치·구성을 바꾸는 경우의 유사 표현"}]},
  "deem": {"context":"~라고 판단하다","items":[{"expression":"consider","meaning":"~라고 여기다·판단하다","note":"consider A + 형용사"}]},
  "be hesitant to + v": {
    "context": "망설이는 뜻",
    "items": [
      {
        "expression": "be reluctant to + V",
        "meaning": "~하기를 꺼리다",
        "note": "hesitant는 망설임, reluctant는 내키지 않음·꺼림에 초점"
      }
    ]
  },
  "customary": {
    "context": "관례적인 행동",
    "items": [
      {
        "expression": "usual",
        "meaning": "통상적인",
        "note": "customary는 관습·관례에 초점"
      }
    ]
  },
  "near / nearly": {
    "context": "장소 / 거의를 구별",
    "items": [
      {
        "expression": "near the station → close to the station",
        "meaning": "역 가까이에",
        "note": "장소 전치사구 / nearly → almost = 거의"
      }
    ]
  },
  "late / lately": {
    "context": "늦음 / 최근을 구별",
    "items": [
      {
        "expression": "arrive late → arrive behind schedule",
        "meaning": "예정보다 늦게 도착하다",
        "note": "일정 기준의 late / lately → recently = 최근에"
      }
    ]
  },
  "hard / hardly": {
    "context": "노력 / 거의 없음 구별",
    "items": [
      {
        "expression": "work hard → work diligently",
        "meaning": "열심히 일하다",
        "note": "hardly → scarcely = 거의 ~않다; 두 부사의 뜻은 반대 방향"
      }
    ]
  },
  "high / highly": {
    "context": "높이 / 정도를 구별",
    "items": [
      {
        "expression": "fly high → fly at a great height",
        "meaning": "높이 날다",
        "note": "highly effective → very effective = 매우 효과적인"
      }
    ]
  },
  "atmosphere": {
    "context": "식당의 분위기",
    "items": [
      {
        "expression": "ambience",
        "meaning": "분위기",
        "note": "대기라는 과학적 뜻에는 이 대응을 쓰지 않음"
      }
    ]
  },
  "known for": {
    "context": "특징으로 알려짐",
    "items": [
      {
        "expression": "famous for",
        "meaning": "~로 유명한",
        "note": "famous는 널리 알려진 정도가 더 강함"
      }
    ]
  },
  "accurately": {
    "context": "정확한 재현·기록",
    "items": [
      {
        "expression": "precisely",
        "meaning": "정확하게",
        "note": "정밀함에 초점"
      }
    ]
  },
  "impartial": {
    "context": "공정한 판단·조언",
    "items": [
      {
        "expression": "unbiased",
        "meaning": "편견 없는",
        "note": "특정 편을 들지 않음"
      }
    ]
  },
  "commence": {
    "context": "작업·행사 시작",
    "items": [
      {
        "expression": "begin",
        "meaning": "시작하다",
        "note": "commence가 더 격식 있음"
      }
    ]
  },
  "disappointed": {
    "context": "사람이 실망한 상태",
    "items": [
      {
        "expression": "let down",
        "meaning": "실망한",
        "note": "feel let down처럼 사용"
      }
    ]
  },
  "disappointing": {
    "context": "결과가 기대에 못 미침",
    "items": [
      {
        "expression": "unsatisfactory",
        "meaning": "만족스럽지 못한",
        "note": "사람의 감정 disappointed와 구별"
      }
    ]
  },
  "selection": {
    "context": "가게가 제공하는 상품 구성",
    "items": [
      {
        "expression": "range",
        "meaning": "다양한 구성",
        "note": "a selection of dishes → a range of dishes"
      }
    ]
  },
  "tirelessly": {
    "context": "지치지 않는 노력",
    "items": [
      {
        "expression": "untiringly",
        "meaning": "지칠 줄 모르고",
        "note": "단순히 오래 일했다는 뜻보다 지속적 노력"
      }
    ]
  },
  "contemporary dishes": {
    "context": "요리 스타일",
    "items": [
      {
        "expression": "modern dishes",
        "meaning": "현대적인 요리",
        "note": "contemporary는 동시대의 뜻도 있음"
      }
    ]
  },
  "admit (admitting)": {
    "context": "실수를 인정하는 뜻",
    "items": [
      {
        "expression": "acknowledge a mistake",
        "meaning": "실수를 인정하다",
        "note": "admit a mistake와 대응; 입장을 허용하는 뜻은 별개"
      }
    ]
  },
  "approach (approaching)": {
    "context": "행사 시점이 가까워짐",
    "items": [
      {
        "expression": "draw near",
        "meaning": "다가오다",
        "note": "the event is approaching → the event is drawing near"
      }
    ]
  },
  "happen (happening)": {
    "context": "일어나다",
    "items": [
      {
        "expression": "take place",
        "meaning": "일어나다·개최되다",
        "note": "미래 행사가 다가온다는 approaching과 구별"
      }
    ]
  },
  "hold (holding)": {
    "context": "행사를 개최함",
    "items": [
      {
        "expression": "organize an event",
        "meaning": "행사를 주최·준비하다",
        "note": "hold an event; 행사 주어는 be held"
      }
    ]
  },
  "eligible": {
    "context": "할인 대상 자격",
    "items": [
      {
        "expression": "qualify for",
        "meaning": "~의 자격을 갖추다",
        "note": "be eligible for a discount → qualify for a discount; 형용사구에서 동사로 변경"
      }
    ]
  },
  "ambitious": {
    "context": "목표가 도전적임",
    "items": [
      {
        "expression": "challenging",
        "meaning": "달성하기 도전적인",
        "note": "an ambitious target → a challenging target"
      }
    ]
  },
  "influential": {
    "context": "사람의 영향력",
    "items": [
      {
        "expression": "having considerable influence",
        "meaning": "상당한 영향력이 있는",
        "note": "부유하다는 affluent와 구별"
      }
    ]
  },
  "affluent": {
    "context": "경제적으로 부유함",
    "items": [
      {
        "expression": "wealthy",
        "meaning": "부유한",
        "note": "영향력이 있다는 influential과 구별"
      }
    ]
  },
  "promote": {
    "context": "건강·의식 증진",
    "items": [
      {
        "expression": "foster",
        "meaning": "기르다·촉진하다",
        "note": "홍보·승진시키는 뜻에는 그대로 치환하지 않음"
      }
    ]
  },
  "be pleased to ~": {
    "context": "환영하며 기뻐함",
    "items": [
      {
        "expression": "be delighted to + V",
        "meaning": "~하게 되어 기쁘다",
        "note": "delighted가 더 강한 기쁨"
      }
    ]
  },
  "appreciation of nature": {
    "context": "자연의 가치 이해",
    "items": [
      {
        "expression": "understanding and valuing nature",
        "meaning": "자연을 이해하고 소중히 여김",
        "note": "감사라는 뜻과 구별"
      }
    ]
  },
  "returning members": {
    "context": "다시 참여하는 회원",
    "items": [
      {
        "expression": "members coming back",
        "meaning": "다시 오는 회원들",
        "note": "물건을 반환한다는 뜻이 아님"
      }
    ]
  },
  "environmental consciousness": {
    "context": "환경 문제 인식",
    "items": [
      {
        "expression": "environmental awareness",
        "meaning": "환경 의식",
        "note": "상태·인식의 뜻"
      }
    ]
  },
  "for this occasion": {
    "context": "해당 행사를 위해",
    "items": [
      {
        "expression": "for this event",
        "meaning": "이 행사를 위해",
        "note": "occasion이 행사인 문맥"
      }
    ]
  },
  "devotion": {
    "context": "일·사람에 헌신",
    "items": [
      {
        "expression": "dedication",
        "meaning": "헌신",
        "note": "devotion to N → dedication to N"
      }
    ]
  },
  "unwavering": {
    "context": "지지·의지가 흔들리지 않음",
    "items": [
      {
        "expression": "steadfast",
        "meaning": "확고한",
        "note": "unwavering support → steadfast support"
      }
    ]
  },
  "superb clothing": {
    "context": "옷의 품질 평가",
    "items": [
      {
        "expression": "excellent clothing",
        "meaning": "훌륭한 의류",
        "note": "superb는 매우 뛰어남"
      }
    ]
  },
  "ready-to-wear lines": {
    "context": "의류 제품군",
    "items": [
      {
        "expression": "off-the-rack collections",
        "meaning": "기성복 컬렉션",
        "note": "맞춤 제작 의류와 구별"
      }
    ]
  },
  "the ongoing support of ~": {
    "context": "계속되는 지원",
    "items": [
      {
        "expression": "the continued support of ~",
        "meaning": "~의 지속적인 지원",
        "note": "지속성을 바꿔 말함"
      }
    ]
  },
  "the level of success": {
    "context": "성공의 정도",
    "items": [
      {
        "expression": "the degree of success",
        "meaning": "성공의 정도",
        "note": "수준·정도를 나타냄"
      }
    ]
  },
  "be encouraged to ~": {
    "context": "권장·격려",
    "items": [
      {
        "expression": "be urged to + V",
        "meaning": "~하도록 권고받다",
        "note": "urged가 더 강한 권고일 수 있음"
      }
    ]
  },
  "press conference": {
    "context": "언론 대상 회견",
    "items": [
      {
        "expression": "news conference",
        "meaning": "기자 회견",
        "note": "공식 발표·질의응답 행사"
      }
    ]
  },
  "public relations department": {
    "context": "부서명",
    "items": [
      {
        "expression": "PR department",
        "meaning": "홍보 부서",
        "note": "PR는 public relations의 약자"
      }
    ]
  },
  "administration": {
    "context": "조직의 운영·관리",
    "items": [
      {
        "expression": "management",
        "meaning": "관리·운영진",
        "note": "정부·행정기관이라는 뜻은 문맥을 따로 확인"
      }
    ]
  },
  "questionnaire": {
    "context": "응답을 받는 질문지",
    "items": [
      {
        "expression": "survey form",
        "meaning": "설문지",
        "note": "survey는 조사 전체도 뜻함"
      }
    ]
  },
  "consulting": {
    "context": "자문 업무",
    "items": [
      {
        "expression": "advisory services",
        "meaning": "자문 서비스",
        "note": "consulting을 명사로 쓴 업무 문맥"
      }
    ]
  },
  "be on top of everything": {
    "context": "일을 잘 파악·관리함",
    "items": [
      {
        "expression": "have everything under control",
        "meaning": "모든 일을 관리하고 있다",
        "note": "물리적으로 위에 있다는 뜻이 아님"
      }
    ]
  },
  "acquisition": {
    "context": "구입·인수",
    "items": [
      {
        "expression": "purchase",
        "meaning": "구입·매입",
        "note": "기업을 사들이는 인수에도 사용; 지식 습득은 별도"
      }
    ]
  },
  "what's still left to be done?": {
    "context": "남은 업무를 물음",
    "items": [
      {
        "expression": "What remains to be done?",
        "meaning": "무엇을 더 해야 하나요?",
        "note": "해야 할 일의 나머지를 물음"
      }
    ]
  },
  "run into": {
    "context": "우연히 사람을 만남",
    "items": [
      {
        "expression": "encounter",
        "meaning": "우연히 마주치다",
        "note": "run into someone; 문제에 부딪히는 뜻도 있음"
      }
    ]
  },
  "firm": {
    "context": "회사·업체",
    "items": [
      {
        "expression": "company",
        "meaning": "회사",
        "note": "단단한이라는 형용사 뜻과 구별"
      }
    ]
  },
  "be capable of ~": {
    "context": "할 능력이 있음",
    "items": [
      {
        "expression": "be able to + V",
        "meaning": "~할 수 있다",
        "note": "capable of + N/동명사 → able to + 동사원형"
      }
    ]
  },
  "i was wondering if ~": {
    "context": "공손한 질문",
    "items": [
      {
        "expression": "Could you tell me whether ~?",
        "meaning": "~인지 알려 주시겠어요?",
        "note": "의문문 어순이 아닌 whether + 주어 + 동사"
      }
    ]
  },
  "sightseeing": {
    "context": "명소 구경",
    "items": [
      {
        "expression": "visiting tourist attractions",
        "meaning": "관광 명소 방문",
        "note": "관광 활동을 풀어 쓴 표현"
      }
    ]
  },
  "stopover": {
    "context": "여행 중 경유 체류",
    "items": [
      {
        "expression": "layover",
        "meaning": "중간 체류·경유",
        "note": "항공에서는 체류 길이에 따라 구별하기도 함"
      }
    ]
  },
  "it would be a shame to ~": {
    "context": "아쉽고 안타까움",
    "items": [
      {
        "expression": "it would be regrettable to + V",
        "meaning": "~하면 유감이겠다",
        "note": "수치심이라는 뜻이 아닌 아쉬움"
      }
    ]
  },
  "food critic": {
    "context": "음식 평가를 쓰는 사람",
    "items": [
      {
        "expression": "restaurant reviewer",
        "meaning": "식당 평론가",
        "note": "식당·음식 평가 문맥의 인물 대응"
      }
    ]
  },
  "a set of luggage": {
    "context": "여행 가방 묶음",
    "items": [
      {
        "expression": "a luggage set",
        "meaning": "여행 가방 세트",
        "note": "luggage는 불가산"
      }
    ]
  },
  "on the house": {
    "context": "가게의 무료 제공",
    "items": [
      {
        "expression": "complimentary",
        "meaning": "무료로 제공되는",
        "note": "dessert on the house → complimentary dessert"
      }
    ]
  },
  "throughout": {
    "context": "기간 내내",
    "items": [
      {
        "expression": "during the whole of",
        "meaning": "~동안 내내",
        "note": "throughout January → during the whole of January"
      }
    ]
  },
  "carousel": {
    "context": "공항 수하물 수취 장치",
    "items": [
      {
        "expression": "baggage conveyor",
        "meaning": "수하물 컨베이어",
        "note": "baggage carousel; 회전목마 뜻과 구별"
      }
    ]
  },
  "disembark": {
    "context": "비행기·배에서 내림",
    "items": [
      {
        "expression": "get off",
        "meaning": "내리다",
        "note": "disembark from a plane → get off a plane"
      }
    ]
  },
  "provide a with b": {
    "context": "제공 구조",
    "items": [
      {
        "expression": "supply A with B",
        "meaning": "A에게 B를 제공하다",
        "note": "provide B for A 형태도 있음"
      }
    ]
  },
  "grant": {
    "context": "지원금·보조금",
    "items": [
      {
        "expression": "funding",
        "meaning": "지원 자금",
        "note": "grant는 특정 지원금, funding은 자금 제공·자금 전반"
      }
    ]
  },
  "give recognition to ~": {
    "context": "공로 인정",
    "items": [
      {
        "expression": "acknowledge the contribution of ~",
        "meaning": "~의 기여를 인정하다",
        "note": "단순히 알아본다는 뜻과 구별"
      }
    ]
  },
  "a portion of": {
    "context": "일부 구간·양",
    "items": [
      {
        "expression": "part of",
        "meaning": "~의 일부",
        "note": "a portion of the road → part of the road"
      }
    ]
  },
  "be suspended from ~": {
    "context": "어딘가에 매달림",
    "items": [
      {
        "expression": "hang from",
        "meaning": "~에 매달려 있다",
        "note": "징계로 정직·정학인 뜻에는 사용하지 않음"
      }
    ]
  },
  "refer to": {
    "context": "자료 참고",
    "items": [
      {
        "expression": "consult",
        "meaning": "참고하다·찾아보다",
        "note": "refer to the documents → consult the documents; consult 뒤 to 없음"
      }
    ]
  },
  "redeem": {
    "context": "포인트를 혜택으로 교환",
    "items": [
      {
        "expression": "exchange points for benefits",
        "meaning": "포인트를 혜택과 교환하다",
        "note": "상환·구원 등 다른 뜻과 구별"
      }
    ]
  },
  "secretary": {
    "context": "업무를 보좌하는 비서",
    "items": [
      {
        "expression": "administrative assistant",
        "meaning": "행정·사무 보조 담당자",
        "note": "직무 범위가 완전히 같다는 뜻은 아님"
      }
    ]
  },
  "wallpaper": {
    "context": "벽을 바르는 재료",
    "items": [
      {
        "expression": "wall covering",
        "meaning": "벽 마감재",
        "note": "wall covering이 더 넓은 범주"
      }
    ]
  },
  "future initiatives": {
    "context": "앞으로 추진할 사업",
    "items": [
      {
        "expression": "upcoming projects",
        "meaning": "다가오는 프로젝트",
        "note": "initiative는 새롭게 추진하는 계획에 초점"
      }
    ]
  },
  "not to my knowledge.": {
    "context": "아는 범위에서 부정",
    "items": [
      {
        "expression": "Not as far as I know.",
        "meaning": "제가 알기로는 아니에요",
        "note": "단정적인 No와 구별"
      }
    ]
  },
  "range from a to b": {
    "context": "범위 표현",
    "items": [
      {
        "expression": "vary from A to B",
        "meaning": "A에서 B까지 다양하다",
        "note": "수치·종류의 범위를 나타냄"
      }
    ]
  },
  "in exchange for": {
    "context": "대가로 교환",
    "items": [
      {
        "expression": "in return for",
        "meaning": "~의 대가로",
        "note": "물건·혜택을 교환하는 문맥"
      }
    ]
  },
  "until": {
    "context": "계속되다가 끝나는 시점",
    "items": [
      {
        "expression": "up to Friday",
        "meaning": "금요일까지 계속",
        "note": "until Friday의 상태 지속 문맥. 완료 기한 by와 구별"
      }
    ]
  },
  "by": {
    "context": "완료 기한",
    "items": [
      {
        "expression": "no later than",
        "meaning": "늦어도 ~까지",
        "note": "submit by Friday → submit no later than Friday"
      }
    ]
  },
  "within": {
    "context": "기간 안에 완료",
    "items": [
      {
        "expression": "in no more than",
        "meaning": "~이내에",
        "note": "within two days → in no more than two days"
      }
    ]
  },
  "for": {
    "context": "기간의 길이",
    "items": [
      {
        "expression": "for a period of",
        "meaning": "~의 기간 동안",
        "note": "for two weeks → for a period of two weeks"
      }
    ]
  },
  "during": {
    "context": "특정 기간 안",
    "items": [
      {
        "expression": "in the course of",
        "meaning": "~동안에",
        "note": "during the meeting → in the course of the meeting; 내내 지속을 보장하지 않음"
      }
    ]
  },
  "since": {
    "context": "현재완료에서의 시작 시점",
    "items": [
      {
        "expression": "from that time until now",
        "meaning": "그때부터 지금까지",
        "note": "시간 용법의 since; 이유 용법은 별개"
      }
    ]
  },
  "advice": {
    "context": "조언 내용",
    "items": [
      {
        "expression": "guidance",
        "meaning": "지도·조언",
        "note": "각각 불가산; 직접 치환보다 뜻의 연결"
      }
    ]
  },
  "information": {
    "context": "알려진 사실·내용",
    "items": [
      {
        "expression": "details",
        "meaning": "세부 정보",
        "note": "information 불가산 → details 복수; 동사 수 변경"
      }
    ]
  },
  "equipment": {
    "context": "업무용 장비",
    "items": [
      {
        "expression": "tools and devices",
        "meaning": "도구와 기기",
        "note": "equipment 불가산 → 복수 표현; 동사 수 변경"
      }
    ]
  },
  "furniture": {
    "context": "가구류",
    "items": [
      {
        "expression": "tables, chairs and other furnishings",
        "meaning": "책상·의자 등 비품",
        "note": "범주를 풀어 쓴 표현이며 구성품은 문맥 확인"
      }
    ]
  },
  "luggage": {
    "context": "여행 가방",
    "items": [
      {
        "expression": "baggage",
        "meaning": "수하물",
        "note": "둘 다 불가산; 공항 문맥에서 연결"
      }
    ]
  },
  "authorization": {
    "context": "공식 허가",
    "items": [
      {
        "expression": "permission",
        "meaning": "허가",
        "note": "authorization이 더 공식적"
      }
    ]
  },
  "advisory": {
    "context": "여행 주의보라는 명사",
    "items": [
      {
        "expression": "official travel warning",
        "meaning": "공식 여행 주의보",
        "note": "a travel advisory의 대응. 자문의라는 형용사 용법은 별개"
      }
    ]
  },
  "appreciation": {
    "context": "디자인의 가치 이해",
    "items": [
      {
        "expression": "understanding of the value of",
        "meaning": "~의 가치를 이해함",
        "note": "appreciation of industrial design의 뜻. 감사 gratitude와 구별"
      }
    ]
  },
  "approaching": {
    "context": "다가오는 시점",
    "items": [
      {
        "expression": "drawing near",
        "meaning": "다가오는",
        "note": "행사가 가까워지는 문맥"
      }
    ]
  },
  "admit": {
    "context": "실수를 인정",
    "items": [
      {
        "expression": "acknowledge",
        "meaning": "인정하다",
        "note": "admit a mistake → acknowledge a mistake; 입장 허가는 별개"
      }
    ]
  },
  "admission": {
    "context": "행사·장소 입장",
    "items": [
      {
        "expression": "entry",
        "meaning": "입장",
        "note": "admission to the venue → entry to the venue; 고백 뜻은 별개"
      }
    ]
  },
  "setback": {
    "context": "계획의 차질",
    "items": [
      {
        "expression": "obstacle",
        "meaning": "장애물·난관",
        "note": "setback은 진행을 늦추는 차질, obstacle은 방해 요인"
      }
    ]
  },
  "intervene": {
    "context": "분쟁 중재",
    "items": [
      {
        "expression": "mediate",
        "meaning": "중재하다",
        "note": "intervene in a dispute → mediate a dispute; 모든 개입이 중재인 것은 아님"
      }
    ]
  },
  "spacious": {
    "context": "실내가 넓음",
    "items": [
      {
        "expression": "roomy",
        "meaning": "넓고 여유 있는",
        "note": "a spacious room → a roomy room"
      }
    ]
  },
  "obedient": {
    "context": "규칙·명령을 따름",
    "items": [
      {
        "expression": "compliant",
        "meaning": "요구·규칙을 따르는",
        "note": "obedient to → compliant with; 전치사 변경"
      }
    ]
  },
  "wipe down": {
    "context": "표면을 닦음",
    "items": [
      {
        "expression": "clean by wiping",
        "meaning": "닦아서 청소하다",
        "note": "wipe down a counter → clean the counter by wiping it"
      }
    ]
  },
  "kitchen appliance": {
    "context": "주방 기기",
    "items": [
      {
        "expression": "kitchen device",
        "meaning": "주방 장치",
        "note": "appliance는 기능을 갖춘 가전·기기에 초점"
      }
    ]
  },
  "potted plant": {
    "context": "화분에 심은 식물",
    "items": [
      {
        "expression": "plant in a pot",
        "meaning": "화분 속 식물",
        "note": "명사 앞 수식 → 명사 뒤 전치사구"
      }
    ]
  },
  "purse": {
    "context": "여성용 가방 문맥",
    "items": [
      {
        "expression": "handbag",
        "meaning": "핸드백",
        "note": "영국식 purse가 동전지갑인 문맥과 구별"
      }
    ]
  },
  "transition": {
    "context": "상태·단계 변화",
    "items": [
      {
        "expression": "changeover",
        "meaning": "전환",
        "note": "transition to a new system → changeover to a new system"
      }
    ]
  },
  "guidelines": {
    "context": "행동 지침",
    "items": [
      {
        "expression": "instructions",
        "meaning": "지시·안내",
        "note": "guidelines는 권고 성격일 수 있으며 instructions는 더 구체적"
      }
    ]
  },
  "submit": {
    "context": "문서 제출",
    "items": [
      {
        "expression": "hand in",
        "meaning": "제출하다",
        "note": "submit a report → hand in a report"
      }
    ]
  },
  "recommend": {
    "context": "직무에 사람을 추천",
    "items": [
      {
        "expression": "suggest someone for a position",
        "meaning": "누군가를 직무 후보로 추천하다",
        "note": "recommend someone for a position의 대응. suggest someone to V로 바꾸지 않음"
      }
    ]
  },
  "independently": {
    "context": "도움 없이 수행",
    "items": [
      {
        "expression": "on one's own",
        "meaning": "혼자서·독립적으로",
        "note": "independently의 별도·각각 뜻은 문맥 확인"
      }
    ]
  },
  "convince": {
    "context": "납득시킴",
    "items": [
      {
        "expression": "persuade",
        "meaning": "설득하다",
        "note": "convince someone to do → persuade someone to do; 믿게 한다는 뜻은 문맥 확인"
      }
    ]
  },
  "be tailored to ~": {
    "context": "대상에 맞춘 프로그램",
    "items": [
      {
        "expression": "be customized for",
        "meaning": "~을 위해 맞춤 구성되다",
        "note": "tailored to + 대상 → customized for + 대상; 전치사 변경"
      }
    ]
  },
  "linguist": {
    "context": "언어 분야 전문가",
    "items": [
      {
        "expression": "language expert",
        "meaning": "언어 전문가",
        "note": "language expert가 반드시 언어학 연구자만을 뜻하지는 않음"
      }
    ]
  },
  "career aspirations": {
    "context": "직업적 목표",
    "items": [
      {
        "expression": "career goals",
        "meaning": "커리어 목표",
        "note": "aspirations만 쓰면 진로 외 열망도 포함"
      },
      {
        "expression": "aspirations",
        "meaning": "열망·포부",
        "note": "career를 빼면 직업적 목표로 한정되지 않음"
      }
    ]
  },
  "distinct": {
    "context": "뚜렷한 이점",
    "items": [
      {
        "expression": "a clear advantage",
        "meaning": "뚜렷한 이점",
        "note": "a distinct advantage의 명사구 대응"
      },
      {
        "expression": "different from",
        "meaning": "~와 다른",
        "note": "distinct from의 구별 용법; 전치사 from 유지"
      }
    ]
  }
};
// Concise display overrides; original editorial notes remain above for reference.
var concise={"mitigate": [{"expression": "reduce", "meaning": "줄이다"}, {"expression": "lessen", "meaning": "덜다"}], "primary": [{"expression": "main", "meaning": "주된"}, {"expression": "principal", "meaning": "주요한"}], "once": [{"expression": "after", "meaning": "~한 뒤에"}], "probationary": [{"expression": "trial", "meaning": "수습·시험 단계의"}], "benefit": [{"expression": "health coverage", "meaning": "의료·건강보험 보장"}], "favor": [{"expression": "help", "meaning": "도움"}], "slip": [{"expression": "packing list", "meaning": "포장 물품 목록"}], "vulnerable": [{"expression": "at risk", "meaning": "위험에 노출된"}], "absorb": [{"expression": "take in", "meaning": "받아들이다·이해하다"}], "alleviate": [{"expression": "ease", "meaning": "완화하다"}, {"expression": "lessen", "meaning": "줄이다"}], "eligible": [{"expression": "qualified", "meaning": "자격이 있는"}], "until": [{"expression": "up to", "meaning": "~까지 계속"}], "near / nearly": [{"expression": "close to", "meaning": "~가까이에"}], "late / lately": [{"expression": "behind schedule", "meaning": "예정보다 늦게"}], "hard / hardly": [{"expression": "diligently", "meaning": "열심히"}], "high / highly": [{"expression": "at a great height", "meaning": "높은 곳에서"}], "career aspirations": [{"expression": "career goals", "meaning": "진로 목표"}], "distinct": [{"expression": "clear", "meaning": "뚜렷한"}], "recommend": [{"expression": "put forward", "meaning": "후보로 추천하다"}], "tirelessly": [{"expression": "without getting tired", "meaning": "지치지 않고"}]};
// The ticket-holder example uses admit = allow entry, not acknowledge a fact.
concise['admit (admitting)']=[{expression:'let in',meaning:'입장시키다·들여보내다'}];
function key(x){return String(x||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();}
function get(note){var k=key(note.expression),entry=entries[k];if(!entry)return null;return{items:(concise[k]||entry.items).slice(0,2)};}
function render(parent,note){var entry=get(note);if(!entry)return null;var box=document.createElement('section');box.className='tn-paraphrases';var heading=document.createElement('h4');heading.textContent='Paraphrase';box.appendChild(heading);entry.items.forEach(function(item){var p=document.createElement('p'),strong=document.createElement('strong');strong.textContent=item.expression;p.append(strong,document.createTextNode(' — '+item.meaning));box.appendChild(p);});parent.appendChild(box);return box;}
root.HanqVocabularyParaphrases={get:get,render:render,terms:Object.keys(entries)};
})(window);
