window.HANQ_TOEIC_GRAMMAR_DATA={
  "version": 2,
  "routeAliases": {
    "complements": "sentence-patterns",
    "prepositions": "clauses-connectors",
    "connectors": "clauses-connectors",
    "gerunds": "verbs-verbals",
    "notes": "conditionals"
  },
  "chapters": [
    {
      "id": "sentence-patterns",
      "title": "Chapter 1 · 문장형식",
      "lead": "빈칸이 주어·동사·목적어·보어·수식어 중 어디인지 먼저 정하고, 그 자리에 맞는 형태를 고르세요.",
      "topics": [
        {
          "id": "sp-elements",
          "title": "문장 성분: S · V · O · C · 수식어",
          "concept": "절마다 중심 동사구와 주어를 먼저 찾습니다. 관계절·부사절·병렬 구조에는 동사가 더 있을 수 있습니다. 빈칸이 동사 자리인지, 목적어·보어·수식어·연결어 자리인지 앞뒤 구조로 판단하세요.",
          "examType": "본동사가 빠진 문장에서 동사 형태 고르기 / 이미 동사가 있을 때 수식어 고르기",
          "memory": [
            {
              "pattern": "S + V (+ O / C)",
              "meaning": "뼈대",
              "note": "주어·동사부터 표시하면 빈칸 역할이 보입니다."
            },
            {
              "pattern": "중심 동사구가 빠진 절 → 동사 형태 확인",
              "meaning": "시제·수 있는 동사",
              "note": "조동사·be·have와 연결되는 -ing/p.p.인지, 시제 있는 동사가 필요한지도 함께 봅니다."
            },
            {
              "pattern": "S + V 확인 → 남은 빈칸 역할 판단",
              "meaning": "부사·전치사구 등",
              "note": "동사가 있어도 목적어·보어·준동사·절 연결어가 더 필요할 수 있습니다."
            },
            {
              "pattern": "S + V",
              "meaning": "1형식",
              "note": "필수 목적어 없음",
              "basis": "general_grammar"
            },
            {
              "pattern": "S + V + C",
              "meaning": "2형식",
              "note": "주어의 상태·신분을 설명",
              "basis": "general_grammar"
            },
            {
              "pattern": "S + V + O",
              "meaning": "3형식",
              "note": "타동사의 목적어",
              "basis": "general_grammar"
            },
            {
              "pattern": "S + V + IO + DO",
              "meaning": "4형식",
              "note": "사람에게 대상을 주기",
              "basis": "general_grammar"
            },
            {
              "pattern": "S + V + O + C",
              "meaning": "5형식",
              "note": "목적어의 상태·동작을 설명",
              "basis": "general_grammar"
            },
            {
              "pattern": "It is + 형용사 + to V",
              "meaning": "가주어·진주어",
              "note": "실제 내용을 뒤 to부정사로",
              "basis": "general_grammar"
            },
            {
              "pattern": "There is + 단수명사",
              "meaning": "존재 구문",
              "note": "뒤 명사와 동사 수 확인",
              "basis": "general_grammar"
            },
            {
              "pattern": "There are + 복수명사",
              "meaning": "존재 구문",
              "note": "뒤 명사와 동사 수 확인",
              "basis": "general_grammar"
            }
          ]
        },
        {
          "id": "sp-noun-phrase",
          "title": "명사구와 명사 + 명사",
          "concept": "한정사(a/the/our) + 형용사 + 명사가 한 덩어리입니다. 앞 명사가 뒤 명사를 꾸미는 복합명사(safety inspection, job applicant)도 자주 나옵니다.",
          "examType": "한정사·형용사 뒤 빈칸에 명사 고르기 / 명사 앞 빈칸에 명사 수식어 고르기",
          "memory": [
            {
              "pattern": "형용사 + 명사 자리",
              "meaning": "practical + 명사",
              "note": "1회117 원오답 표시; 빈칸 구조 확인",
              "priorityBasis": "reported_wrong",
              "priorityEvidence": "1회117 원오답 표시; 빈칸 구조 확인"
            },
            {
              "pattern": "a/the/소유격 + (형용사) + 명사",
              "meaning": "명사구",
              "note": "관사 바로 뒤가 항상 명사인 것은 아닙니다. 형용사가 끼어들 수 있습니다."
            },
            {
              "pattern": "명사 + 명사",
              "meaning": "복합명사",
              "note": "앞 명사는 단수가 흔하지만 sales report처럼 고정 복수형 수식어도 있습니다."
            },
            {
              "pattern": "recommendation letter / letter of recommendation",
              "meaning": "같은 뜻 두 구조",
              "note": "익숙한 덩어리로 기억하세요."
            }
          ]
        },
        {
          "id": "sp-ing-ed",
          "title": "-ing · -ed 형태의 여러 역할",
          "concept": "-ing는 동명사(명사 역할), 진행형, 분사 수식어가 될 수 있고, -ed는 과거형, 수동·완료의 과거분사, 분사 수식어가 될 수 있습니다. 철자가 아니라 문장 속 역할로 판단합니다.",
          "examType": "주어 자리 동명사구 / 명사 앞뒤 분사 / be + -ing·p.p. 구별",
          "memory": [
            {
              "pattern": "-ing구 = 주어·목적어",
              "meaning": "동명사 = 명사 역할",
              "note": "동명사구 주어는 단수 동사로 받습니다."
            },
            {
              "pattern": "be + -ing",
              "meaning": "진행 또는 형용사 보어",
              "note": "is checking(진행) / is encouraging(형용사)"
            },
            {
              "pattern": "명사 + -ing/-ed 구",
              "meaning": "분사 수식",
              "note": "자세한 분사 판단은 Chapter 4 분사 파트"
            }
          ]
        },
        {
          "id": "sp-subject-complement",
          "title": "주격보어: be · become · remain · seem",
          "concept": "보어는 주어의 상태나 정체를 설명합니다. 상태면 형용사, 정체·직책이면 명사구입니다. '보어 = 무조건 형용사'가 아닙니다.",
          "examType": "seem/remain/become 뒤 형용사 vs 부사 / 직책 명사 vs 형용사",
          "memory": [
            {
              "pattern": "seem / remain + 형용사",
              "meaning": "~해 보이다 / ~한 상태로 남다",
              "note": "remain open, seem reasonable"
            },
            {
              "pattern": "become + 명사구",
              "meaning": "~이 되다(정체)",
              "note": "became the director"
            },
            {
              "pattern": "동사 뒤 ≠ 부사 자동 선택",
              "meaning": "주어 설명이면 형용사",
              "note": "주어의 상태·정체를 설명하는 보어와 동사·형용사·문장 등을 꾸미는 부사를 구별합니다."
            },
            {
              "pattern": "become + 형용사",
              "meaning": "상태 변화",
              "note": "become available",
              "basis": "general_grammar"
            },
            {
              "pattern": "remain + 형용사",
              "meaning": "상태 유지",
              "note": "remain high",
              "basis": "general_grammar"
            },
            {
              "pattern": "seem + 형용사",
              "meaning": "~해 보이다",
              "note": "seem reasonable",
              "basis": "general_grammar"
            },
            {
              "pattern": "be + 명사구",
              "meaning": "신분·정체 보어",
              "note": "She is an engineer.",
              "basis": "general_grammar"
            }
          ]
        },
        {
          "id": "sp-object-complement",
          "title": "목적격보어: keep · find · consider · leave · make",
          "concept": "S + V + O + C에서 보어는 목적어를 설명합니다. make O + 동사원형(행동)과 make O + 형용사(상태)를 구분하고, 수동이면 be made to do로 to가 살아납니다.",
          "examType": "O 뒤 빈칸에 형용사·명사구 보어 / make O do vs be made to do",
          "memory": [
            {
              "pattern": "have + O + V",
              "meaning": "목적어가 직접 하는 동작",
              "note": "1회130 원오답 표시; 사역 구조",
              "priorityBasis": "reported_wrong",
              "priorityEvidence": "1회130 원오답 표시; 사역 구조"
            },
            {
              "pattern": "keep/leave/find O + 형용사",
              "meaning": "O를 ~한 상태로",
              "note": "keep records confidential"
            },
            {
              "pattern": "consider O + 명사구",
              "meaning": "O를 ~로 여기다",
              "note": "consider her a strong candidate"
            },
            {
              "pattern": "make O do ↔ O be made to do",
              "meaning": "~하게 하다",
              "note": "능동은 원형, 수동은 to부정사"
            },
            {
              "pattern": "keep O informed / secure",
              "meaning": "O를 ~된 상태로",
              "note": "p.p.·형용사도 목적격보어가 됩니다."
            },
            {
              "pattern": "make + O + 형용사",
              "meaning": "O를 ~하게 만들다",
              "note": "make the system reliable",
              "basis": "general_grammar"
            },
            {
              "pattern": "keep + O + 형용사",
              "meaning": "O를 ~하게 유지하다",
              "note": "keep records secure",
              "basis": "general_grammar"
            },
            {
              "pattern": "find + O + 형용사",
              "meaning": "O가 ~하다고 생각하다",
              "note": "find the schedule convenient",
              "basis": "general_grammar"
            }
          ]
        },
        {
          "id": "sp-multi-pattern",
          "title": "같은 동사, 다른 문형",
          "concept": "keep, make, find, leave 등은 목적어만 갖기도 하고 목적어 + 보어를 갖기도 합니다. 동사 이름이 아니라 실제 뒤 구조를 읽으세요.",
          "examType": "같은 동사 뒤 목적어만 있는지, 목적어 + 보어인지 판단",
          "memory": [
            {
              "pattern": "provide A with B",
              "meaning": "A에게 B를 제공하다",
              "note": "단어장 provide A with B",
              "basis": "general_grammar",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "단어장 provide A with B"
            },
            {
              "pattern": "provide B to A",
              "meaning": "B를 A에게 제공하다",
              "note": "수여 대상·대상을 구별",
              "basis": "general_grammar"
            },
            {
              "pattern": "grant A B",
              "meaning": "A에게 B를 주다",
              "note": "사람·대상 순서 확인",
              "basis": "general_grammar"
            },
            {
              "pattern": "keep + O",
              "meaning": "보관하다",
              "note": "keep receipts"
            },
            {
              "pattern": "keep + O + C",
              "meaning": "~한 상태로 유지하다",
              "note": "keep the room locked"
            },
            {
              "pattern": "make + O",
              "meaning": "만들다·하다",
              "note": "make a reservation / make arrangements"
            }
          ]
        }
      ],
      "examples": [
        {
          "en": "The updated safety manual explains each step clearly.",
          "ko": "개정된 안전 매뉴얼은 각 단계를 명확하게 설명합니다.",
          "focus": [
            "The updated safety manual",
            "explains",
            "each step",
            "clearly"
          ],
          "why": "주어(명사구) + 본동사 explains + 목적어 each step + 부사 clearly. 뼈대가 완성된 뒤에 붙은 clearly는 동사를 꾸미는 수식어입니다.",
          "topicId": "sp-elements",
          "exampleKind": "authored_learning"
        },
        {
          "en": "Our customer service representatives remain available on weekends.",
          "ko": "저희 고객 서비스 담당자들은 주말에도 응대 가능한 상태로 근무합니다.",
          "focus": [
            "customer service representatives",
            "remain available"
          ],
          "why": "customer service가 representatives를 꾸미는 명사 + 명사 구조이고, remain 뒤 available은 주어의 상태를 설명하는 형용사 보어입니다.",
          "topicId": "sp-subject-complement",
          "exampleKind": "authored_learning"
        },
        {
          "en": "Reviewing contracts is part of Ms. Lin's role.",
          "ko": "계약서 검토는 린 씨 업무의 일부입니다.",
          "focus": [
            "Reviewing contracts",
            "is"
          ],
          "why": "Reviewing contracts는 하나의 활동을 나타내는 동명사구 주어이므로 단수 동사 is로 받습니다.",
          "topicId": "sp-ing-ed",
          "exampleKind": "authored_learning"
        },
        {
          "en": "We kept the client informed of every schedule change.",
          "ko": "우리는 고객에게 모든 일정 변경 사항을 계속 알렸습니다.",
          "focus": [
            "kept the client informed"
          ],
          "why": "client가 '정보를 받는' 쪽이므로 목적격보어로 과거분사 informed를 씁니다. 목적격보어는 형용사뿐 아니라 p.p.도 될 수 있습니다.",
          "topicId": "sp-object-complement",
          "exampleKind": "authored_learning"
        },
        {
          "en": "The store keeps receipts for a year and keeps the storage room locked.",
          "ko": "그 매장은 영수증을 1년간 보관하고 창고를 잠긴 상태로 유지합니다.",
          "focus": [
            "keeps receipts",
            "keeps the storage room locked"
          ],
          "why": "첫 keep은 목적어만 있는 '보관하다', 둘째 keep은 목적어 + 보어(locked)인 '~한 상태로 유지하다'입니다.",
          "topicId": "sp-multi-pattern",
          "exampleKind": "authored_learning"
        }
      ],
      "practice": [
        {
          "id": "c1-1",
          "stem": "The revised proposal seems _____ to the entire committee.",
          "choices": [
            "reasonably",
            "reasonable",
            "reason",
            "reasons"
          ],
          "answer": 1,
          "reason": "주어 proposal의 상태를 설명하는 형용사 reasonable이 필요합니다.",
          "translation": "수정된 제안은 위원회 전체에 합리적으로 보입니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "reasonably",
              "correct": false,
              "explanation": "부사·합리적으로. proposal의 상태를 나타내는 보어 자리이므로 이 문장에서는 부사가 맞지 않습니다."
            },
            {
              "label": "B",
              "text": "reasonable",
              "correct": true,
              "explanation": "형용사·합리적인. seems 뒤에서 제안이 합리적이라는 상태를 설명합니다."
            },
            {
              "label": "C",
              "text": "reason",
              "correct": false,
              "explanation": "명사·이유. 제안을 이유라고 규정하는 문맥이 아니며, 여기서는 상태를 나타내는 형용사가 자연스럽습니다."
            },
            {
              "label": "D",
              "text": "reasons",
              "correct": false,
              "explanation": "reasons는 이유들이라는 복수명사입니다. 이 문장에서 proposal의 합리적인 성격을 설명할 형용사 보어가 되지 못합니다."
            }
          ],
          "reviewPoint": "seem 뒤가 주어의 상태를 설명하면 형용사 보어를 검토하세요.",
          "topicId": "sp-subject-complement"
        },
        {
          "id": "c1-2",
          "stem": "All customer records must remain _____ during the system upgrade.",
          "choices": [
            "confidentially",
            "confidentiality",
            "confidential",
            "confide"
          ],
          "answer": 2,
          "reason": "remain 뒤에서 records의 상태를 설명하는 형용사 confidential이 필요합니다.",
          "translation": "시스템 업그레이드 중에도 모든 고객 기록은 기밀 상태로 유지돼야 합니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "confidentially",
              "correct": false,
              "explanation": "confidentially는 기밀로라는 방식 부사입니다. remain 뒤에서 records의 상태를 나타내는 보어가 될 수 없습니다."
            },
            {
              "label": "B",
              "text": "confidentiality",
              "correct": false,
              "explanation": "명사·기밀성. 기록을 추상적인 기밀성 자체와 동일시하는 표현은 이 문맥에 맞지 않습니다."
            },
            {
              "label": "C",
              "text": "confidential",
              "correct": true,
              "explanation": "confidential은 기밀의라는 형용사로 records가 계속 유지할 상태를 설명합니다."
            },
            {
              "label": "D",
              "text": "confide",
              "correct": false,
              "explanation": "confide는 털어놓다는 동사원형으로 remain 뒤 상태 보어에 바로 쓸 수 없습니다."
            }
          ],
          "reviewPoint": "remain+형용사는 주어 상태를 설명합니다. keep records confidential도 같은 상태 보어이지만 동사 뒤 부사를 무조건 금지하지 않습니다.",
          "topicId": "sp-subject-complement"
        },
        {
          "id": "c1-3",
          "stem": "After reviewing her experience, the board considered Ms. Cho _____ for the project.",
          "choices": [
            "an excellent candidate",
            "excellently",
            "excellence",
            "excel"
          ],
          "answer": 0,
          "reason": "목적어 Ms. Cho의 정체를 설명하는 명사구 an excellent candidate가 맞습니다.",
          "translation": "경력을 검토한 후 이사회는 조 씨를 그 프로젝트의 훌륭한 후보자로 여겼습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "an excellent candidate",
              "correct": true,
              "explanation": "명사구·훌륭한 후보자. Ms. Cho가 어떤 사람인지 나타내는 목적격보어입니다."
            },
            {
              "label": "B",
              "text": "excellently",
              "correct": false,
              "explanation": "부사·훌륭하게. Ms. Cho의 자격·정체를 나타내는 보어가 될 수 없습니다."
            },
            {
              "label": "C",
              "text": "excellence",
              "correct": false,
              "explanation": "명사·탁월함. 사람을 후보자로 평가하는 문맥에서 추상적 성질인 excellence와 동일시하지 않습니다."
            },
            {
              "label": "D",
              "text": "excel",
              "correct": false,
              "explanation": "동사원형·뛰어나다. consider O 뒤에 excel을 원형으로 바로 붙일 수 없습니다."
            }
          ],
          "reviewPoint": "보어는 형용사뿐 아니라 사람의 직책·정체를 나타내는 명사구도 가능합니다.",
          "topicId": "sp-object-complement"
        },
        {
          "id": "c1-4",
          "stem": "The safety officer made all visitors _____ protective glasses.",
          "choices": [
            "wearing",
            "wore",
            "to wear",
            "wear"
          ],
          "answer": 3,
          "reason": "능동 make + 목적어 + 동사원형이므로 wear입니다.",
          "translation": "안전 담당자는 모든 방문객에게 보안경을 쓰게 했습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "wearing",
              "correct": false,
              "explanation": "현재분사/-ing형·착용하는. 여기서는 make + O + 동사원형의 사역 구조이므로 wearing이 아닙니다."
            },
            {
              "label": "B",
              "text": "wore",
              "correct": false,
              "explanation": "wear의 과거형·착용했다. made 뒤 목적격보어에 과거 시제 동사를 바로 놓지 않습니다."
            },
            {
              "label": "C",
              "text": "to wear",
              "correct": false,
              "explanation": "to부정사·착용하다. 능동 made O 뒤에는 to 없이 wear를 씁니다. 수동 were made to wear와 구분하세요."
            },
            {
              "label": "D",
              "text": "wear",
              "correct": true,
              "explanation": "동사원형·착용하다. visitors가 보안경을 쓰게 했다는 능동 사역 구조에 맞습니다."
            }
          ],
          "reviewPoint": "make O do / O be made to do를 짝으로 비교하세요.",
          "topicId": "sp-object-complement"
        },
        {
          "id": "c1-5",
          "stem": "The software update made the ordering process _____.",
          "choices": [
            "efficiently",
            "efficiency",
            "efficient",
            "efficiencies"
          ],
          "answer": 2,
          "reason": "목적어 process의 상태를 설명하는 형용사 efficient가 맞습니다.",
          "translation": "소프트웨어 업데이트는 주문 절차를 효율적으로 만들었습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "efficiently",
              "correct": false,
              "explanation": "부사·효율적으로. 목적어 process의 상태를 완성하는 보어 자리이므로 부사가 아닙니다."
            },
            {
              "label": "B",
              "text": "efficiency",
              "correct": false,
              "explanation": "명사·효율성. 절차를 효율성이라는 추상명사 자체와 동일시하는 뜻은 이 문맥에 맞지 않습니다."
            },
            {
              "label": "C",
              "text": "efficient",
              "correct": true,
              "explanation": "형용사·효율적인. made + process + efficient로 절차를 효율적인 상태로 만들었다는 뜻입니다."
            },
            {
              "label": "D",
              "text": "efficiencies",
              "correct": false,
              "explanation": "복수명사·효율 향상/절감 효과들. process가 그런 효과들 자체라는 뜻이 아니므로 보어로 부적절합니다."
            }
          ],
          "reviewPoint": "make O + 형용사는 O의 상태 변화, make O + 원형은 O가 하는 행동입니다.",
          "topicId": "sp-object-complement"
        },
        {
          "id": "sp-06",
          "stem": "Applicants must attach a letter of _____ from a previous employer to the application form.",
          "choices": [
            "recommended",
            "recommendation",
            "recommends",
            "recommend"
          ],
          "answer": 1,
          "reason": "of 뒤에서 편지의 내용을 나타내는 명사 recommendation이 필요합니다. a letter of recommendation은 추천서입니다.",
          "translation": "지원자는 이전 고용주가 작성한 추천서를 지원서에 첨부해야 합니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "recommended",
              "correct": false,
              "explanation": "recommended는 추천된이라는 과거분사로, 이 자리에서 추천 내용이라는 명사 역할을 하지 못합니다."
            },
            {
              "label": "B",
              "text": "recommendation",
              "correct": true,
              "explanation": "recommendation은 추천이라는 명사로 a letter of recommendation(추천서)을 완성합니다."
            },
            {
              "label": "C",
              "text": "recommends",
              "correct": false,
              "explanation": "recommends는 현재시제 동사형으로, of 뒤 명사구를 완성하지 못합니다."
            },
            {
              "label": "D",
              "text": "recommend",
              "correct": false,
              "explanation": "recommend는 추천하다는 동사원형으로 전치사 of의 명사 목적어가 될 수 없습니다."
            }
          ],
          "reviewPoint": "recommendation letter = letter of recommendation. 관사 바로 뒤가 아니라 빈칸의 실제 위치를 봅니다.",
          "topicId": "sp-noun-phrase"
        },
        {
          "id": "sp-07",
          "stem": "The results of the customer survey _____ that most users prefer the mobile app to the website.",
          "choices": [
            "indication",
            "to indicate",
            "indicate",
            "indicating"
          ],
          "answer": 2,
          "reason": "주어 The results(복수)에 본동사가 없으므로 시제 있는 복수 동사 indicate가 필요합니다.",
          "translation": "고객 설문 결과는 대부분의 사용자가 웹사이트보다 모바일 앱을 선호한다는 것을 보여 줍니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "indication",
              "correct": false,
              "explanation": "명사·징후. results 뒤에 명사를 놓으면 동사가 없어 that절을 이어 갈 수 없습니다."
            },
            {
              "label": "B",
              "text": "to indicate",
              "correct": false,
              "explanation": "to부정사. 목적·수식 역할은 하지만 문장의 본동사를 대신하지 못합니다."
            },
            {
              "label": "C",
              "text": "indicate",
              "correct": true,
              "explanation": "현재 시제 복수 동사·나타내다. 주어 results와 수가 맞고 that절을 목적어로 받습니다."
            },
            {
              "label": "D",
              "text": "indicating",
              "correct": false,
              "explanation": "-ing형. 혼자 본동사가 될 수 없어 문장에 시제 동사가 없는 상태로 남습니다."
            }
          ],
          "reviewPoint": "of the customer survey는 수식어입니다. 주어 핵심 results를 찾고 본동사가 있는지 확인하세요.",
          "topicId": "sp-elements"
        },
        {
          "id": "sp-08",
          "stem": "After ten years with the firm, Mr. Ortiz became the _____ of its Lisbon office.",
          "choices": [
            "directly",
            "directed",
            "direct",
            "director"
          ],
          "answer": 3,
          "reason": "became 뒤에서 Mr. Ortiz의 직책(정체)을 나타내는 명사 director가 필요합니다. the ... of 구조도 명사를 요구합니다.",
          "translation": "회사에서 10년을 근무한 후, 오티스 씨는 리스본 지사의 지사장이 되었습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "directly",
              "correct": false,
              "explanation": "부사·직접. the 뒤 명사 자리이자 주어의 정체를 나타내는 보어 자리에 부사는 올 수 없습니다."
            },
            {
              "label": "B",
              "text": "directed",
              "correct": false,
              "explanation": "과거형/과거분사·지시한, 지시받은. 사람의 직책을 나타내는 명사가 아닙니다."
            },
            {
              "label": "C",
              "text": "direct",
              "correct": false,
              "explanation": "형용사·직접적인 / 동사·지시하다. the와 of 사이에서 사람의 직책을 나타내지 못합니다."
            },
            {
              "label": "D",
              "text": "director",
              "correct": true,
              "explanation": "사람명사·책임자. became의 명사 보어로 Mr. Ortiz의 직책을 설명합니다."
            }
          ],
          "reviewPoint": "become + 명사구는 정체·직책, become + 형용사는 상태입니다. 보어가 늘 형용사인 것은 아닙니다.",
          "topicId": "sp-subject-complement"
        },
        {
          "id": "sp-09",
          "stem": "The museum's east wing will remain _____ during the renovation. Visitors can still enter it through the main lobby.",
          "choices": [
            "accessible",
            "accessibly",
            "accessibility",
            "access"
          ],
          "answer": 0,
          "reason": "remain 뒤에서 east wing의 상태(출입 가능한)를 설명하는 형용사 보어 accessible이 맞습니다. 둘째 문장도 계속 입장할 수 있다는 상태를 확인해 줍니다.",
          "translation": "박물관 동관은 보수 공사 중에도 출입이 가능합니다. 방문객은 중앙 로비를 통해 계속 입장할 수 있습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "accessible",
              "correct": true,
              "explanation": "형용사·접근 가능한. remain accessible로 동관이 계속 출입 가능한 상태임을 나타냅니다."
            },
            {
              "label": "B",
              "text": "accessibly",
              "correct": false,
              "explanation": "부사·접근하기 쉽게. 주어의 상태를 나타내는 보어 자리에 부사는 맞지 않습니다."
            },
            {
              "label": "C",
              "text": "accessibility",
              "correct": false,
              "explanation": "명사·접근성. 동관 자체를 '접근성'이라는 추상 개념과 동일시하게 되어 어색합니다."
            },
            {
              "label": "D",
              "text": "access",
              "correct": false,
              "explanation": "명사·접근(권) / 동사·접근하다. remain 뒤에서 동관의 상태를 설명하지 못합니다."
            }
          ],
          "reviewPoint": "remain + 형용사: '~한 상태로 남다'. 뒤 문장의 단서(can still enter)와 함께 읽으세요.",
          "topicId": "sp-subject-complement"
        },
        {
          "id": "sp-10",
          "stem": "New employees are made _____ a safety orientation before entering the factory floor.",
          "choices": [
            "attend",
            "to attend",
            "attending",
            "attended"
          ],
          "answer": 1,
          "reason": "사역 make가 수동태(are made)로 바뀌면 원형 대신 to부정사를 씁니다.",
          "translation": "신입 직원들은 공장 작업장에 들어가기 전에 안전 교육에 의무적으로 참석해야 합니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "attend",
              "correct": false,
              "explanation": "동사원형. 능동 make O attend에서는 맞지만, 수동 be made 뒤에서는 to가 필요합니다."
            },
            {
              "label": "B",
              "text": "to attend",
              "correct": true,
              "explanation": "to부정사. be made to attend로 '참석하도록 요구받다'라는 수동 사역 구조를 완성합니다."
            },
            {
              "label": "C",
              "text": "attending",
              "correct": false,
              "explanation": "-ing형. be made 뒤에서 해야 하는 행동을 나타내는 형태가 아닙니다."
            },
            {
              "label": "D",
              "text": "attended",
              "correct": false,
              "explanation": "과거형/과거분사. are made attended는 수동이 겹쳐 성립하지 않습니다."
            }
          ],
          "reviewPoint": "make O do(능동) ↔ O be made to do(수동). 수동에서 to가 다시 나타납니다.",
          "topicId": "sp-object-complement"
        }
      ],
      "sources": [
        "link",
        "adj",
        "make",
        "ybm-basic-2025"
      ],
      "priorityPolicy": "사용자 원오답·확인된 채점 오답 → 단어장 → 최근 교육자료·기본문법. 보기 출현을 선택한 오답으로 추정하지 않음.",
      "recentTypeSupport": [
        "주어·동사·보어 자리",
        "remain + 형용사",
        "make + 목적어 + 비교급 형용사"
      ]
    },
    {
      "id": "nouns-pronouns",
      "title": "Chapter 2 · 명사",
      "lead": "명사 자리와 형태를 찾고 한정사·가산성·수를 함께 확인해요.",
      "topics": [
        {
          "id": "np-suffix",
          "title": "명사 어미와 사람명사",
          "concept": "-tion, -ment, -ance, -ity, -ness는 명사의 단서이고, -er/-or/-ant/-ist는 사람명사의 단서입니다. 단, 어미는 단서일 뿐 증거가 아닙니다(professional, representative, critic도 사람명사).",
          "examType": "사람명사 vs 행위·추상명사 (assistant / assistance)",
          "memory": [
            {
              "pattern": "recommendations: 형용사 + 명사 자리",
              "meaning": "먼저 구별할 내 자료",
              "note": "1회117 원오답 표시",
              "priorityBasis": "reported_wrong",
              "priorityEvidence": "1회117 원오답 표시"
            },
            {
              "pattern": "assistant / assistance",
              "meaning": "보조 직원 / 도움",
              "note": "사람이 필요한 자리인지 문맥 확인"
            },
            {
              "pattern": "distributor · architect · recipient",
              "meaning": "유통업체·건축가·수령인",
              "note": "distributor는 회사도 가리킴"
            },
            {
              "pattern": "representative · associate · professional · critic",
              "meaning": "대표·동료·전문가·비평가",
              "note": "-ive, -ate, -al, -ic도 사람명사가 될 수 있음"
            },
            {
              "pattern": "replacement · addition",
              "meaning": "후임자/교체품 · 새 구성원/추가분",
              "note": "사람인지 사물인지 문맥이 정함"
            },
            {
              "pattern": "applicant",
              "meaning": "지원자",
              "note": "application 신청·지원",
              "basis": "general_grammar"
            },
            {
              "pattern": "application",
              "meaning": "신청·지원",
              "note": "applicant 지원자",
              "basis": "general_grammar"
            },
            {
              "pattern": "attendee",
              "meaning": "참석자",
              "note": "attendance 참석",
              "basis": "general_grammar"
            },
            {
              "pattern": "attendance",
              "meaning": "참석",
              "note": "attendee 참석자",
              "basis": "general_grammar"
            },
            {
              "pattern": "employee",
              "meaning": "직원",
              "note": "employment 고용",
              "basis": "general_grammar"
            },
            {
              "pattern": "employment",
              "meaning": "고용",
              "note": "employee 직원",
              "basis": "general_grammar"
            },
            {
              "pattern": "recipient",
              "meaning": "수령인",
              "note": "receipt 수령·영수증",
              "basis": "general_grammar"
            },
            {
              "pattern": "receipt",
              "meaning": "수령·영수증",
              "note": "recipient 수령인",
              "basis": "general_grammar"
            }
          ]
        },
        {
          "id": "np-ing-nouns",
          "title": "-ing로 끝나는 명사",
          "concept": "accounting, advertising, catering, brainstorming, handling, landscaping, publishing, shipping은 분야·활동을 나타내는 명사로 주로 불가산입니다. 반면 drawing(그림·추첨), opening(공석·개장)은 셀 수 있고, earnings(수익)는 복수형으로 씁니다.",
          "examType": "분야명사(publishing) vs 사람명사(publisher) / openings·earnings의 수",
          "memory": [
            {
              "pattern": "work in publishing / advertising",
              "meaning": "~ 업계에서 일하다",
              "note": "관사 없는 분야명사"
            },
            {
              "pattern": "a drawing / job openings",
              "meaning": "추첨(그림) / 일자리 공석",
              "note": "가산명사: a·복수형 가능"
            },
            {
              "pattern": "earnings",
              "meaning": "수익·소득",
              "note": "복수 취급: Earnings rose."
            },
            {
              "pattern": "shipping and handling",
              "meaning": "배송·취급(비용)",
              "note": "고정 표현"
            },
            {
              "pattern": "training program",
              "meaning": "교육 프로그램",
              "note": "명사 + 명사",
              "basis": "general_grammar"
            },
            {
              "pattern": "application form",
              "meaning": "신청서",
              "note": "명사 + 명사",
              "basis": "general_grammar"
            },
            {
              "pattern": "customer service",
              "meaning": "고객 서비스",
              "note": "분야·기능을 앞 명사로",
              "basis": "general_grammar"
            },
            {
              "pattern": "safety regulations",
              "meaning": "안전 규정",
              "note": "뒤 중심명사의 수 확인",
              "basis": "general_grammar"
            },
            {
              "pattern": "sales figures",
              "meaning": "매출 수치",
              "note": "뒤 중심명사의 수 확인",
              "basis": "general_grammar"
            }
          ]
        },
        {
          "id": "np-multipos",
          "title": "명사·동사·형용사 겸용 단어",
          "concept": "use, increase, visit, stay, delay, purchase, limit, access, need, permit, check, review, result, repair 등은 명사와 동사로 모두 쓰입니다. alternative, initiative, representative, rental은 명사·형용사 겸용입니다. 자리(한정사 뒤인지, 주어 뒤인지)로 품사를 정합니다.",
          "examType": "a/the/소유격 뒤 겸용어의 명사형 고르기 / 가산·불가산 판단",
          "memory": [
            {
              "pattern": "a parking permit / permit A to do",
              "meaning": "허가증 / 허락하다",
              "note": "permission은 일반적인 허가 의미에서 불가산입니다. 권한 단위를 뜻하는 전문 용법까지 무조건 금지하지 않습니다."
            },
            {
              "pattern": "an increase in / increase by",
              "meaning": "~의 증가 / ~만큼 늘다",
              "note": "명사 뒤 in, 동사 뒤 by"
            },
            {
              "pattern": "a rental car / car rental",
              "meaning": "임대용 차 / 차량 임대",
              "note": "형용사·명사 겸용"
            },
            {
              "pattern": "a 없음 ≠ 복수",
              "meaning": "불가산·소유격·the 가능",
              "note": "access, information, equipment"
            },
            {
              "pattern": "authorization [U/C] / an advisory",
              "meaning": "허가·승인 / 주의보",
              "note": "authorization은 의미에 따라 가산·불가산. advisory는 자문의(형용사)·주의보(가산명사) 모두 가능."
            }
          ]
        },
        {
          "id": "np-determiners",
          "title": "한정사와 가산·불가산",
          "concept": "each/every는 기본적으로 단수명사, many/few/several은 가산 복수, much/little은 불가산과 결합합니다. any는 뜻에 따라 단수·복수·불가산이 가능하고, another three days 같은 추가 수량도 가능합니다.",
          "examType": "명사 앞 한정사 고르기 / 한정사 뒤 명사 수 고르기",
          "memory": [
            {
              "pattern": "an extensive selection of + N",
              "meaning": "먼저 구별할 내 자료",
              "note": "2회107 원오답 표시",
              "priorityBasis": "reported_wrong",
              "priorityEvidence": "2회107 원오답 표시"
            },
            {
              "pattern": "a set of luggage",
              "meaning": "먼저 구별할 내 자료",
              "note": "사용자 단어장; luggage 불가산",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장; luggage 불가산"
            },
            {
              "pattern": "some / any / all + 복수·불가산",
              "meaning": "수량·범위를 나타냄",
              "note": "some reports / some information. any는 any applicant처럼 단수도 가능하므로 뜻을 확인."
            },
            {
              "pattern": "each / every / another + 단수명사",
              "meaning": "각 / 모든 / 또 하나의",
              "note": "every applicant, another option. 단, another three days처럼 추가 수량은 숫자+복수 가능."
            },
            {
              "pattern": "many / few / several / various + 복수명사",
              "meaning": "많은 / 거의 없는 / 몇몇 / 다양한",
              "note": "several openings"
            },
            {
              "pattern": "much / little + 불가산",
              "meaning": "많은 / 거의 없는",
              "note": "little training, much equipment"
            },
            {
              "pattern": "a selection of",
              "meaning": "엄선된 ~ / 다양한 ~",
              "note": "'대부분'이라는 뜻이 아님"
            },
            {
              "pattern": "few / little ↔ a few / a little",
              "meaning": "거의 없는 ↔ 몇몇의·약간의",
              "note": "명사 없이도 few는 사람·가산 복수, little은 양을 가리킬 수 있음"
            },
            {
              "pattern": "information",
              "meaning": "정보 [U]",
              "note": "기본 의미에서 불가산",
              "basis": "general_grammar"
            },
            {
              "pattern": "advice",
              "meaning": "조언 [U]",
              "note": "an advisory(명사)와 구별",
              "basis": "general_grammar"
            },
            {
              "pattern": "equipment",
              "meaning": "장비 [U]",
              "note": "a piece of equipment",
              "basis": "general_grammar"
            },
            {
              "pattern": "furniture",
              "meaning": "가구 [U]",
              "note": "a piece of furniture",
              "basis": "general_grammar"
            },
            {
              "pattern": "luggage",
              "meaning": "수하물 [U]",
              "note": "단어장 a set of luggage",
              "basis": "general_grammar"
            },
            {
              "pattern": "research",
              "meaning": "연구 [U]",
              "note": "기본 의미에서 불가산",
              "basis": "general_grammar"
            },
            {
              "pattern": "merchandise",
              "meaning": "상품 [U]",
              "note": "기본 의미에서 불가산",
              "basis": "general_grammar"
            },
            {
              "pattern": "assistance",
              "meaning": "도움 [U]",
              "note": "기본 의미에서 불가산",
              "basis": "general_grammar"
            },
            {
              "pattern": "experience",
              "meaning": "경력·경험 [U]",
              "note": "a memorable experience는 하나의 경험 [C]",
              "basis": "general_grammar"
            },
            {
              "pattern": "room",
              "meaning": "공간·여유 [U]",
              "note": "a meeting room은 방 [C]",
              "basis": "general_grammar"
            },
            {
              "pattern": "some + 복수 가산명사",
              "meaning": "몇몇·일부",
              "note": "some applications",
              "basis": "general_grammar"
            },
            {
              "pattern": "some + 불가산명사",
              "meaning": "약간·일부",
              "note": "some information",
              "basis": "general_grammar"
            },
            {
              "pattern": "any + 단수 가산명사",
              "meaning": "어느 ~라도",
              "note": "any applicant",
              "basis": "general_grammar"
            },
            {
              "pattern": "any + 복수명사",
              "meaning": "어떤 ~도·몇몇이라도",
              "note": "부정·의문 등 문맥 확인",
              "basis": "general_grammar"
            },
            {
              "pattern": "any + 불가산명사",
              "meaning": "얼마간의 ~라도",
              "note": "any assistance",
              "basis": "general_grammar"
            },
            {
              "pattern": "a few + 복수명사",
              "meaning": "약간 있는",
              "note": "긍정적 수량",
              "basis": "general_grammar"
            },
            {
              "pattern": "few + 복수명사",
              "meaning": "거의 없는",
              "note": "부정적 수량",
              "basis": "general_grammar"
            },
            {
              "pattern": "a little + 불가산명사",
              "meaning": "약간 있는",
              "note": "긍정적 양",
              "basis": "general_grammar"
            },
            {
              "pattern": "little + 불가산명사",
              "meaning": "거의 없는",
              "note": "부정적 양",
              "basis": "general_grammar"
            }
          ]
        }
      ],
      "examples": [
        {
          "en": "Two job openings in our shipping department were posted today.",
          "ko": "오늘 저희 배송 부서에 일자리 공석 두 개가 게시되었습니다.",
          "focus": [
            "job openings",
            "shipping department"
          ],
          "why": "opening(공석)은 셀 수 있으므로 Two + openings로 복수를 씁니다. shipping은 department를 꾸미는 분야명사입니다.",
          "topicId": "np-ing-nouns",
          "exampleKind": "authored_learning"
        },
        {
          "en": "Ms. Diaz, our regional representative, will contact each recipient personally.",
          "ko": "지역 담당자인 디아스 씨가 각 수령인에게 직접 연락할 것입니다.",
          "focus": [
            "representative",
            "each recipient"
          ],
          "why": "-ive로 끝나도 representative는 사람명사입니다. each 뒤에는 단수명사 recipient가 옵니다.",
          "topicId": "np-suffix",
          "exampleKind": "authored_learning"
        },
        {
          "en": "Customers may request a refund within 30 days of purchase.",
          "ko": "고객은 구매일로부터 30일 이내에 환불을 요청할 수 있습니다.",
          "focus": [
            "a refund",
            "of purchase"
          ],
          "why": "purchase는 동사로도 쓰이지만 여기서는 전치사 of 뒤 명사입니다. 관사가 없다고 복수인 것이 아니라 '구매 (행위)'를 일반적으로 가리킨 것입니다.",
          "topicId": "np-multipos",
          "exampleKind": "authored_learning"
        },
        {
          "en": "The equipment in the laboratory is inspected every month.",
          "ko": "실험실 장비는 매달 점검됩니다.",
          "focus": [
            "equipment",
            "is inspected"
          ],
          "why": "equipment는 불가산명사이므로 단수 동사 is를 씁니다.",
          "topicId": "np-determiners",
          "exampleKind": "authored_learning"
        },
        {
          "en": "Several applicants have relevant experience in customer service.",
          "ko": "여러 지원자는 고객 서비스 분야의 관련 경험이 있습니다.",
          "focus": [
            "Several applicants",
            "experience"
          ],
          "why": "several 뒤에는 복수 가산명사 applicants, 일반적인 경력이라는 뜻의 experience는 불가산으로 씁니다.",
          "topicId": "np-determiners",
          "exampleKind": "authored_learning"
        }
      ],
      "practice": [
        {
          "id": "np-01",
          "stem": "Please forward all billing questions to Mr. Grant, our accounts _____.",
          "choices": [
            "assisted",
            "assistant",
            "assistance",
            "assist"
          ],
          "answer": 1,
          "reason": "Mr. Grant와 동격으로 그의 직책을 나타내야 하므로 사람명사 assistant가 맞습니다.",
          "translation": "모든 청구 관련 문의는 회계 보조 직원인 그랜트 씨에게 전달해 주세요.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "assisted",
              "correct": false,
              "explanation": "과거형/과거분사. our accounts 뒤에서 사람을 가리키는 명사가 되지 못합니다."
            },
            {
              "label": "B",
              "text": "assistant",
              "correct": true,
              "explanation": "사람명사·보조 직원. Mr. Grant = our accounts assistant로 동격이 성립합니다."
            },
            {
              "label": "C",
              "text": "assistance",
              "correct": false,
              "explanation": "불가산명사·도움. 사람(Mr. Grant)을 '도움'이라는 행위와 동격으로 놓을 수 없습니다."
            },
            {
              "label": "D",
              "text": "assist",
              "correct": false,
              "explanation": "동사·돕다. 소유격 our 뒤 명사구를 마무리하는 자리에 동사원형은 올 수 없습니다."
            }
          ],
          "reviewPoint": "동격 콤마 뒤 빈칸은 앞 사람의 직책인지 확인하세요. assistant(사람) / assistance(도움).",
          "topicId": "np-suffix"
        },
        {
          "id": "np-02",
          "stem": "Ms. Reyes has worked in magazine _____ for twelve years and now edits a travel monthly.",
          "choices": [
            "publishes",
            "published",
            "publishing",
            "publisher"
          ],
          "answer": 2,
          "reason": "work in + 분야에서 '잡지 출판(업계)'을 뜻하는 분야명사 publishing이 필요합니다.",
          "translation": "레예스 씨는 잡지 출판 분야에서 12년간 일했고 현재 여행 월간지를 편집하고 있습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "publishes",
              "correct": false,
              "explanation": "3인칭 단수 동사. 전치사 in의 목적어인 명사 자리에 동사는 올 수 없습니다."
            },
            {
              "label": "B",
              "text": "published",
              "correct": false,
              "explanation": "과거형/과거분사·출판된. 분야를 나타내는 명사가 아니어서 in 뒤를 완성하지 못합니다."
            },
            {
              "label": "C",
              "text": "publishing",
              "correct": true,
              "explanation": "분야명사·출판(업). 관사 없이 work in publishing처럼 업계를 나타냅니다."
            },
            {
              "label": "D",
              "text": "publisher",
              "correct": false,
              "explanation": "가산 사람/회사명사·출판인, 출판사. 단수 가산명사라 관사가 필요하고, '출판사 안에서'라는 뜻은 보통 at a publisher로 씁니다."
            }
          ],
          "reviewPoint": "work in publishing / advertising / accounting: 업계는 -ing 분야명사, 사람·회사는 -er/-or.",
          "topicId": "np-ing-nouns"
        },
        {
          "id": "np-03",
          "stem": "The company announced several new _____ in its engineering department.",
          "choices": [
            "opens",
            "opened",
            "opening",
            "openings"
          ],
          "answer": 3,
          "reason": "several 뒤에는 복수명사가 오며, 여기서 opening은 '공석'이라는 가산명사이므로 openings입니다.",
          "translation": "그 회사는 엔지니어링 부서에 여러 개의 새 공석을 발표했습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "opens",
              "correct": false,
              "explanation": "3인칭 단수 동사. 형용사 new 뒤의 명사 자리에 동사는 올 수 없습니다."
            },
            {
              "label": "B",
              "text": "opened",
              "correct": false,
              "explanation": "과거형/과거분사. announced의 목적어가 될 명사가 빠지게 됩니다."
            },
            {
              "label": "C",
              "text": "opening",
              "correct": false,
              "explanation": "단수명사·공석. several은 복수명사와 쓰므로 단수형은 맞지 않습니다."
            },
            {
              "label": "D",
              "text": "openings",
              "correct": true,
              "explanation": "복수명사·공석들. opening은 셀 수 있는 명사이므로 several new openings가 됩니다."
            }
          ],
          "reviewPoint": "-ing로 끝나도 opening·drawing처럼 셀 수 있는 명사가 있습니다. 앞 한정사(several)로 수를 확인하세요.",
          "topicId": "np-determiners"
        },
        {
          "id": "np-04",
          "stem": "Quarterly _____ rose by 8 percent compared with the same period last year. The increase came mainly from online sales.",
          "choices": [
            "earnings",
            "earning",
            "earned",
            "earn"
          ],
          "answer": 0,
          "reason": "rose의 주어로 '수익'을 뜻하는 명사가 필요하며, 이 의미의 명사는 복수형 earnings로 씁니다.",
          "translation": "분기 수익이 전년 동기 대비 8퍼센트 증가했습니다. 증가분은 주로 온라인 판매에서 나왔습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "earnings",
              "correct": true,
              "explanation": "복수형 명사·수익. Quarterly earnings가 rose의 주어가 됩니다."
            },
            {
              "label": "B",
              "text": "earning",
              "correct": false,
              "explanation": "-ing형. '수익'이라는 뜻의 명사로는 복수형 earnings를 쓰며, 단수 earning은 이 문맥에서 주어가 되지 못합니다."
            },
            {
              "label": "C",
              "text": "earned",
              "correct": false,
              "explanation": "과거형/과거분사·벌었다/번. 이미 본동사 rose가 있어 주어 명사 자리를 채우지 못합니다."
            },
            {
              "label": "D",
              "text": "earn",
              "correct": false,
              "explanation": "동사원형·벌다. Quarterly 뒤 주어 자리에 명사가 아닌 동사를 놓을 수 없습니다."
            }
          ],
          "reviewPoint": "earnings(수익)는 복수형으로 굳은 명사입니다. 뒤 문장의 The increase가 수익 증가를 다시 가리킵니다.",
          "topicId": "np-ing-nouns"
        },
        {
          "id": "np-05",
          "stem": "Visitors who park in the north lot must display a parking _____ on the dashboard.",
          "choices": [
            "permissive",
            "permit",
            "permission",
            "permitted"
          ],
          "answer": 1,
          "reason": "a parking ___는 셀 수 있는 물건(주차 허가증)이어야 하므로 명사 permit입니다.",
          "translation": "북쪽 주차장에 주차하는 방문객은 주차 허가증을 대시보드 위에 비치해야 합니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "permissive",
              "correct": false,
              "explanation": "형용사·관대한. 명사가 빠져 display의 목적어가 완성되지 않습니다."
            },
            {
              "label": "B",
              "text": "permit",
              "correct": true,
              "explanation": "가산명사·허가증. display(보이게 두다)의 목적어로 실물 허가증이 자연스럽습니다."
            },
            {
              "label": "C",
              "text": "permission",
              "correct": false,
              "explanation": "permission은 여기서 추상적인 허락을 뜻해, a와 함께 실물 주차 허가증을 가리키지 못합니다."
            },
            {
              "label": "D",
              "text": "permitted",
              "correct": false,
              "explanation": "과거분사·허용된. a parking 뒤에서 명사구를 끝내는 명사가 필요합니다."
            }
          ],
          "reviewPoint": "permit은 명사(허가증)·동사(허락하다) 겸용. permission은 불가산이라 a permission으로 쓰지 않습니다.",
          "topicId": "np-multipos"
        },
        {
          "id": "np-06",
          "stem": "_____ applicant will receive a confirmation e-mail within 24 hours of submitting the form.",
          "choices": [
            "Many",
            "All",
            "Each",
            "Several"
          ],
          "answer": 2,
          "reason": "applicant가 가산 단수명사이므로 each applicant입니다. will receive 자체는 단수·복수를 구별하는 단서가 아닙니다.",
          "translation": "각 지원자는 양식을 제출한 후 24시간 이내에 확인 이메일을 받게 됩니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "Many",
              "correct": false,
              "explanation": "many는 복수명사와 씁니다. 단수 applicant와 수가 맞지 않습니다."
            },
            {
              "label": "B",
              "text": "All",
              "correct": false,
              "explanation": "all은 복수명사(all applicants)나 불가산명사와 씁니다. 가산 단수 applicant 앞에는 맞지 않습니다."
            },
            {
              "label": "C",
              "text": "Each",
              "correct": true,
              "explanation": "each + 단수명사. Each applicant로 지원자 한 명 한 명을 가리킵니다."
            },
            {
              "label": "D",
              "text": "Several",
              "correct": false,
              "explanation": "several은 복수명사와 씁니다. several applicants여야 합니다."
            }
          ],
          "reviewPoint": "빈칸 뒤 명사가 단수인지 복수인지 먼저 보고 한정사를 고르세요.",
          "topicId": "np-determiners"
        },
        {
          "id": "np-07",
          "stem": "The new scheduling software requires very _____ training, so staff can start using it right away.",
          "choices": [
            "many",
            "several",
            "few",
            "little"
          ],
          "answer": 3,
          "reason": "training은 불가산명사이고, '바로 쓸 수 있다'는 뒤 내용과 맞으려면 '거의 없는'을 뜻하는 little이 필요합니다.",
          "translation": "새 일정 관리 소프트웨어는 교육이 거의 필요 없어서 직원들이 바로 사용할 수 있습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "many",
              "correct": false,
              "explanation": "many는 가산 복수명사와 쓰며, '많은 교육'은 so 이하의 '바로 쓸 수 있다'와도 충돌합니다."
            },
            {
              "label": "B",
              "text": "several",
              "correct": false,
              "explanation": "several은 가산 복수명사와 쓰고, very several이라는 표현도 쓰지 않습니다."
            },
            {
              "label": "C",
              "text": "few",
              "correct": false,
              "explanation": "few는 가산 복수명사와 씁니다. 불가산 training에는 쓰지 않습니다."
            },
            {
              "label": "D",
              "text": "little",
              "correct": true,
              "explanation": "little + 불가산명사·거의 없는. 교육이 거의 필요 없어 바로 쓸 수 있다는 흐름과 맞습니다."
            }
          ],
          "reviewPoint": "little / much + 불가산, few / many + 가산 복수. 뜻(많다/적다)도 뒤 절과 맞춰 보세요.",
          "topicId": "np-determiners"
        }
      ],
      "sources": [
        "quantifiers",
        "pronoun-personal",
        "pronoun-possessive",
        "pronoun-reflexive",
        "pronoun-none",
        "pronoun-any",
        "pronoun-another",
        "pronoun-one",
        "pronoun-those",
        "pronoun-modifiers",
        "ybm-basic-2025"
      ],
      "priorityPolicy": "사용자 원오답·확인된 채점 오답 → 단어장 → 최근 교육자료·기본문법. 보기 출현을 선택한 오답으로 추정하지 않음.",
      "recentTypeSupport": [
        "명사 자리",
        "복합명사"
      ]
    },
    {
      "id": "pronouns",
      "title": "Chapter 3 · 대명사",
      "lead": "가리키는 대상·격·수를 먼저 보고 수식·비교·대체를 구별해요.",
      "topics": [
        {
          "id": "np-pronoun-summary",
          "title": "대명사 요약",
          "reviewFocus": true,
          "concept": "대상·격·수를 먼저 확인합니다. 수식·비교·대체 의미를 구별합니다.",
          "conceptLines": [
            "대상·격·수를 먼저 확인.",
            "수식·비교·대체를 구별."
          ],
          "examType": "교재 p.38–43에서 확인한 격·재귀·제한 수식·비교 대체·수일치",
          "summaryNote": "⭐는 사용자가 요청한 복습 표시입니다. 사진의 체크를 오답 기록이나 출제 빈도로 해석하지 않았어요.",
          "summaryTables": [
            {
              "title": "내 자료에서 먼저 구별",
              "headers": [
                "핵심",
                "판단",
                "확인 범위"
              ],
              "rows": [
                [
                  "its + N · whose + N",
                  "소유 형태와 절 연결 역할을 구별",
                  "2회 흰둥이126 원오답의 보기; 선택한 오답은 추정 안 함"
                ],
                [
                  "those",
                  "복수 대명사와 관계절 연결을 구별",
                  "같은126번 보기 대조; 관계절은Chapter7"
                ],
                [
                  "their + N",
                  "소유격은 뒤에 명사를 붙임",
                  "단어장 redeem의 their points 문맥"
                ]
              ]
            },
            {
              "title": "1 · 인칭대명사 격 형태표",
              "headers": [
                "주격",
                "소유격 + 명사",
                "목적격",
                "소유대명사",
                "재귀대명사"
              ],
              "rows": [
                [
                  "I",
                  "my",
                  "me",
                  "mine",
                  "myself"
                ],
                [
                  "you",
                  "your",
                  "you",
                  "yours",
                  "yourself · yourselves"
                ],
                [
                  "he",
                  "his",
                  "him",
                  "his",
                  "himself"
                ],
                [
                  "she",
                  "her",
                  "her",
                  "hers",
                  "herself"
                ],
                [
                  "it",
                  "its",
                  "it",
                  "보통 단독형 안 씀",
                  "itself"
                ],
                [
                  "we",
                  "our",
                  "us",
                  "ours",
                  "ourselves"
                ],
                [
                  "they",
                  "their",
                  "them",
                  "theirs",
                  "themselves"
                ]
              ],
              "note": "주어 자리=주격, 동사·전치사의 목적어=목적격, 명사 앞=소유격, 소유격+명사를 대신하는 단독형=소유대명사. its와 it’s(it is/has)를 구별."
            },
            {
              "title": "⭐ 먼저 구별할 두 쌍",
              "headers": [
                "구별",
                "핵심"
              ],
              "rows": [
                [
                  "those with / them",
                  "those with ~ = ~한 사람들 / them = 앞서 특정한 그들. Q7은 새 조건에 맞는 사람 집단을 고르는 문항."
                ],
                [
                  "that/those / it/them",
                  "that/those = 다른 대상의 같은 종류 명사 반복 대체 / it, them = 바로 그 대상. 뒤 수식어만 보고 them을 무조건 금지하지 않기."
                ]
              ],
              "note": ""
            },
            {
              "title": "2 · 재귀: 같은 대상 / 강조 / 관용",
              "headers": [
                "짝",
                "선택 기준",
                "암기"
              ],
              "rows": [
                [
                  "주어 = 목적어",
                  "introduce oneself / enjoy oneself",
                  "The members introduced themselves: 소개하는 사람과 소개되는 사람이 같음."
                ],
                [
                  "강조 재귀",
                  "주어 옆·문장 끝의 직접",
                  "the manager herself: 강조를 빼도 핵심 문장이 성립. 목적어 재귀와 구별."
                ],
                [
                  "고정 표현",
                  "by oneself = on one’s own",
                  "혼자서·도움 없이. pride oneself on / familiarize oneself with / among themselves도 덩어리로 확인."
                ],
                [
                  "형태",
                  "myself · yourself/yourselves · himself · herself · itself · ourselves · themselves",
                  "주어의 인칭·수에 맞춤. my own/their own은 뒤 명사를 꾸미거나 on one’s own처럼 쓰며 재귀형과 자리를 무조건 바꾸지 않음."
                ],
                [
                  "for oneself",
                  "자신을 위해; 스스로 판단하여",
                  "do it for oneself"
                ],
                [
                  "each other",
                  "서로 다른 대상 간 상호 관계",
                  "They help each other."
                ]
              ],
              "note": ""
            },
            {
              "title": "3 · those 뒤에서 사람 범위를 한정",
              "headers": [
                "형태",
                "뜻",
                "수·구별"
              ],
              "rows": [
                [
                  "those who + 복수동사",
                  "~하는 사람들",
                  "Those who apply ... / 한 사람 anyone who applies ...와 구별."
                ],
                [
                  "those + -ing",
                  "~하고 있는 사람들",
                  "those using the old version: 능동·진행 의미의 분사구."
                ],
                [
                  "those + p.p.",
                  "~된 사람들",
                  "those assigned to the team: 수동 의미의 분사구."
                ],
                [
                  "those + 전치사구",
                  "그 조건에 해당하는 사람들",
                  "those with tickets / those with scheduling conflicts. 전치사 뒤 명사까지 읽기."
                ]
              ],
              "note": "교재 p.41 Q7은 those가 의도된 선택. 이것을 인칭대명사는 절대 뒤에서 수식할 수 없다는 보편 규칙으로 넓히지 않음."
            },
            {
              "title": "지시대명사 · 명사를 붙이면 한정사",
              "headers": [
                "형태",
                "뜻·수",
                "뒤 명사 유무",
                "대표 쓰임"
              ],
              "rows": [
                [
                  "this",
                  "이것 · 단수",
                  "단독 가능; 단수 명사 앞 가능",
                  "This is new.\nthis report"
                ],
                [
                  "that",
                  "저것 · 단수",
                  "단독 가능; 단수 명사 앞 가능",
                  "That is useful.\nthat report"
                ],
                [
                  "these",
                  "이것들 · 복수",
                  "단독 가능; 복수 명사 앞 가능",
                  "These are new.\nthese reports"
                ],
                [
                  "those",
                  "저것들 · 복수",
                  "단독 가능; 복수 명사 앞 가능",
                  "Those are useful.\nthose reports"
                ]
              ],
              "note": "this·that은 불가산명사 앞에도 옵니다(this information). 비교 대체 that·those와 those who의 뜻은 아래 구획에서 따로 확인합니다."
            },
            {
              "title": "4 · 비교 대체와 같은 대상 받기",
              "headers": [
                "짝",
                "받는 대상",
                "판단"
              ],
              "rows": [
                [
                  "that / those",
                  "that=가산 단수·불가산, those=복수",
                  "price → that of ... / prices → those at ... / information → that in ..."
                ],
                [
                  "it / them",
                  "앞에서 특정한 바로 그 대상",
                  "I bought it: 이미 말한 그 물건. 다른 지점·다른 해의 가격을 새로 비교하는 those와 구별."
                ],
                [
                  "one / ones",
                  "같은 종류의 가산 명사 단수/복수",
                  "다른 하나·여럿 또는 수식된 대상을 대신함. 불가산 information을 one으로 받지 않기."
                ]
              ],
              "note": "that/those는 than 뒤에만 오지 않음: the same as, similar to, different from 뒤에서도 명사의 반복을 대신할 수 있음."
            },
            {
              "title": "5 · 다른 하나 / 다른 것들 / 나머지",
              "headers": [
                "형태",
                "뜻",
                "짝 구별"
              ],
              "rows": [
                [
                  "one / ones",
                  "가산 단수 / 복수 반복 대체",
                  "a new one / the light ones. 형용사·한정사로 범위를 좁힐 수 있음."
                ],
                [
                  "another (one) / other + 명사 / others",
                  "또 하나 / 다른 + 명사 / 다른 것들",
                  "another option, other options, others. others 뒤에 명사를 다시 붙이지 않음."
                ],
                [
                  "the other / the others",
                  "정해진 집합의 나머지 하나 / 나머지 전부",
                  "둘 중 one ... the other. 여러 개 중 일부를 빼고 남은 전부는 the others. the other + 복수명사도 가능."
                ],
                [
                  "another + 숫자 + 복수명사",
                  "추가 수량을 한 묶음으로",
                  "another three days = 사흘 더. another는 기본 단수라는 규칙만으로 이 표현을 오답 처리하지 않음."
                ]
              ],
              "note": ""
            },
            {
              "title": "6 · 수량 표현과 동사 수일치",
              "headers": [
                "표현",
                "명사·동사 수",
                "놓치지 않기"
              ],
              "rows": [
                [
                  "each(각각) / every(모든) / one(하나)",
                  "each/every + 단수명사; one of + 복수명사 → 단수동사; every two weeks는 간격 표현(2주마다)",
                  "each of the forms is ... / every form is ... / every of는 쓰지 않고 every one of로. every는 이 용법에서 단독 대명사로 쓰지 않음."
                ],
                [
                  "both(둘 다) / many(많은) / (a) few / several(몇몇)",
                  "가산 복수 → 복수동사",
                  "both of the rooms are ... / few는 거의 없음, a few는 몇 개 있음."
                ],
                [
                  "much(많은 양) / (a) little",
                  "불가산 → 단수동사",
                  "little는 거의 없음, a little는 약간 있음. Little of the information is useful."
                ],
                [
                  "all(전부) / some(일부) / most(대부분)",
                  "복수 대상을 받으면 복수, 불가산이면 단수",
                  "All of the rooms are ... / All of the equipment is ..."
                ],
                [
                  "none(하나도·조금도 없음)",
                  "불가산 대상이면 단수; 복수 대상은 뜻·문체에 따라 단수/복수 가능",
                  "None of the equipment is ... / None of the applicants is/are ...처럼 일률적으로 단수만 강제하지 않음."
                ],
                [
                  "any(조금이라도·어느 것이든)",
                  "단수·복수·불가산 모두 가능, 뜻과 대상을 확인",
                  "any technician(어느 기술자든) / any questions(질문이 조금이라도) / any information(정보가 조금이라도). 동사는 가리키는 대상의 수·양에 맞춤."
                ],
                [
                  "anyone / everyone / no one / nobody / nothing",
                  "이 형태들은 기본적으로 단수동사",
                  "everyone과 every one of를 구별. no one/nobody는 사람 없음, none of는 한정된 집단·양 가운데 없음."
                ],
                [
                  "of 뒤 한정사",
                  "of + the/소유격/목적격대명사",
                  "one of the tasks / each of them. 명사 앞에 쓸 때는 each task처럼 of 없이도 가능. none of의 명사구도 한정 범위를 확인."
                ]
              ],
              "note": ""
            },
            {
              "title": "추가로 구별 · 수량·재귀·대체",
              "headers": [
                "표현",
                "뜻·구조",
                "유의점"
              ],
              "rows": [
                [
                  "by oneself",
                  "혼자; 도움 없이",
                  "강조 재귀와 구별"
                ],
                [
                  "for oneself",
                  "자신을 위해; 스스로",
                  "서로는 each other"
                ],
                [
                  "other information",
                  "다른 정보",
                  "other는 복수명사 전용이 아님"
                ],
                [
                  "some ... others",
                  "일부는 … 다른 일부는",
                  "나머지 전부는 the others"
                ],
                [
                  "either + 단수명사",
                  "둘 중 어느 하나",
                  "either of + 복수는 별도 구조"
                ],
                [
                  "neither + 단수명사",
                  "둘 중 어느 것도 아닌",
                  "neither of 실제 수일치는 문맥·격식 확인"
                ]
              ]
            }
          ],
          "comparisonExamples": [
            {
              "en": "This year's sales figures are higher than those of last year.",
              "ko": "올해 매출 수치는 작년 매출 수치보다 높습니다.",
              "focus": [
                "sales figures",
                "those of last year"
              ],
              "why": "앞의 복수명사 figures를 다른 해의 수치와 비교하므로 those. 같은 수치를 그대로 다시 지칭하는 them과 다름. 단수·불가산 반복 대체는 that.",
              "topicId": "np-pronoun-summary"
            },
            {
              "en": "Of the four rooms, two are booked, and the others are available for another three days.",
              "ko": "방 네 개 중 두 개는 예약됐고, 나머지 방들은 사흘 더 이용할 수 있습니다.",
              "focus": [
                "the others",
                "another three days"
              ],
              "why": "정해진 네 개 중 남은 전부는 the others. another + 숫자 + 복수명사는 추가 수량이므로 another three days가 가능함. 교재의 나머지 구별을 적용한 학습용 예문.",
              "topicId": "np-pronoun-summary"
            }
          ],
          "exampleTitle": "보충 비교 예문 2개"
        },
        {
          "id": "np-pronoun-case",
          "title": "인칭대명사의 격과 재귀대명사",
          "concept": "주어 자리는 주격, 동사·전치사의 목적어 자리는 목적격, 명사 앞은 소유격, 소유격+명사를 대신하는 단독형은 소유대명사입니다. 주어와 목적어가 같은 재귀 용법과 생략 가능한 강조 용법을 구별합니다.",
          "examType": "빈칸 앞뒤로 격 판단 / by oneself·강조 재귀",
          "memory": [
            {
              "pattern": "they · them · their · theirs · themselves",
              "meaning": "주격·목적격·소유격·소유대명사·재귀",
              "note": "명사 앞 = 소유격"
            },
            {
              "pattern": "by oneself",
              "meaning": "혼자서(도움 없이)",
              "note": "finished it by herself"
            },
            {
              "pattern": "S + V ... oneself",
              "meaning": "직접 (강조)",
              "note": "생략해도 문장이 성립"
            },
            {
              "pattern": "소유격 + N",
              "meaning": "뒤 명사가 필요",
              "note": "their proposal",
              "basis": "general_grammar"
            },
            {
              "pattern": "소유대명사 단독",
              "meaning": "소유격 + 명사를 대신함",
              "note": "ours = our proposal",
              "basis": "general_grammar"
            },
            {
              "pattern": "its",
              "meaning": "그것의",
              "note": "it's = it is 또는 it has",
              "basis": "general_grammar"
            },
            {
              "pattern": "재귀대명사",
              "meaning": "주어와 목적어가 같은 대상",
              "note": "introduce oneself",
              "basis": "general_grammar"
            }
          ]
        },
        {
          "id": "np-indefinite",
          "title": "those who · one/ones · that/those · either/neither",
          "concept": "those who/with는 ~하는 사람들/~을 가진 사람들, anyone who는 ~하는 누구든입니다. one/ones는 가산 단수/복수 명사의 반복을 대신합니다. 비교·제한 수식 문맥에서는 that/those도 쓰며, that은 불가산명사도 받을 수 있습니다. a/the 여부만으로 고르지 않습니다. either/neither of 뒤 동사는 격식체에서 단수가 기본입니다.",
          "examType": "those who / those with / 비교 대상 that·those",
          "memory": [
            {
              "pattern": "those who + 복수동사",
              "meaning": "~하는 사람들",
              "note": "Those who registered ..."
            },
            {
              "pattern": "those with + 명사",
              "meaning": "~을 가진 사람들",
              "note": "those with tickets"
            },
            {
              "pattern": "that/those of(at) ~",
              "meaning": "앞 명사 반복 대신",
              "note": "prices ... lower than those at ..."
            },
            {
              "pattern": "either/neither of + 복수명사",
              "meaning": "둘 중 하나/둘 다 아님",
              "note": "격식체: + 단수동사"
            },
            {
              "pattern": "it",
              "meaning": "앞서 나온 같은 대상",
              "note": "그 물건 자체",
              "basis": "general_grammar"
            },
            {
              "pattern": "one",
              "meaning": "같은 종류의 다른 하나",
              "note": "단수 가산명사 대체",
              "basis": "general_grammar"
            },
            {
              "pattern": "ones",
              "meaning": "같은 종류의 다른 것들",
              "note": "복수 가산명사 대체",
              "basis": "general_grammar"
            },
            {
              "pattern": "that of",
              "meaning": "다른 대상의 단수·불가산명사 대체",
              "note": "비교되는 대상을 맞추기",
              "basis": "general_grammar"
            },
            {
              "pattern": "those of",
              "meaning": "다른 대상의 복수명사 대체",
              "note": "비교되는 대상을 맞추기",
              "basis": "general_grammar"
            },
            {
              "pattern": "anyone who + 단수동사",
              "meaning": "~하는 누구든지",
              "note": "anyone은 단수 기본",
              "basis": "general_grammar"
            },
            {
              "pattern": "everyone + 단수동사",
              "meaning": "모든 사람",
              "note": "every one of와 형태 구별",
              "basis": "general_grammar"
            },
            {
              "pattern": "each of + 복수명사 + 단수동사",
              "meaning": "각각",
              "note": "each가 핵심 주어",
              "basis": "general_grammar"
            },
            {
              "pattern": "either + 단수명사",
              "meaning": "둘 중 어느 하나",
              "note": "either of는 별도 구조",
              "basis": "general_grammar"
            },
            {
              "pattern": "neither + 단수명사",
              "meaning": "둘 중 어느 것도 아닌",
              "note": "neither of의 실제 수일치는 문맥·격식 확인",
              "basis": "general_grammar"
            },
            {
              "pattern": "both + 복수명사",
              "meaning": "둘 다",
              "note": "복수 동사",
              "basis": "general_grammar"
            },
            {
              "pattern": "other + 불가산명사",
              "meaning": "다른 ~",
              "note": "other information 가능",
              "basis": "general_grammar"
            },
            {
              "pattern": "another + 수량 + 복수명사",
              "meaning": "추가로 그 수만큼",
              "note": "another three days",
              "basis": "general_grammar"
            },
            {
              "pattern": "some ... others",
              "meaning": "일부는 … 다른 일부는",
              "note": "나머지 전부는 the others",
              "basis": "general_grammar"
            }
          ]
        }
      ],
      "examples": [
        {
          "en": "Ms. Ito checked the figures herself before the board met.",
          "ko": "이토 씨는 이사회가 열리기 전에 수치를 직접 확인했습니다.",
          "focus": [
            "herself"
          ],
          "why": "herself는 '직접'이라는 강조 재귀대명사입니다. 빼도 문장이 성립하므로 목적어가 아닌 강조 용법입니다.",
          "topicId": "np-pronoun-case",
          "exampleKind": "authored_learning"
        },
        {
          "en": "Prices at the new store are lower than those at the downtown location.",
          "ko": "새 매장의 가격은 시내 지점의 가격보다 낮습니다.",
          "focus": [
            "those at the downtown location"
          ],
          "why": "those는 앞의 복수명사 prices를 반복하지 않으려고 쓴 대명사입니다. 단수 명사였다면 that을 씁니다.",
          "topicId": "np-indefinite",
          "exampleKind": "authored_learning"
        },
        {
          "en": "Please ask Karin Runda if she can work on the mapping project.",
          "ko": "카린 룬다 씨가 지도 제작 프로젝트에 참여할 수 있는지 물어봐 주세요.",
          "focus": [
            "she"
          ],
          "why": "교재 p.38의 격 구별. if절의 주어이므로 she. her는 목적격/소유격, hers는 소유대명사, herself는 재귀형.",
          "topicId": "np-pronoun-summary",
          "exampleKind": "provided_material"
        },
        {
          "en": "The members introduced themselves, and the manager herself checked their plans.",
          "ko": "구성원들은 자기소개를 했고, 관리자는 직접 그들의 계획을 확인했습니다.",
          "focus": [
            "themselves",
            "herself",
            "their plans"
          ],
          "why": "소개하는 사람=소개되는 사람은 themselves. manager herself는 빼도 되는 직접의 강조. plans 앞은 소유격 their. 교재의 구별을 적용한 학습용 예문.",
          "topicId": "np-pronoun-summary",
          "exampleKind": "authored_learning"
        },
        {
          "en": "The instructor may permit those with scheduling conflicts to leave the class early.",
          "ko": "강사는 일정이 겹치는 사람들에게 수업에서 일찍 나가는 것을 허락할 수 있습니다.",
          "focus": [
            "those with scheduling conflicts"
          ],
          "why": "교재 p.41 Q7. those with ...가 해당 조건의 사람들을 뜻함. 목적어 자리만 보고 them으로 고르면 의도된 집단 한정을 놓침. them을 언제나 수식 불가라고 일반화하지 않음.",
          "topicId": "np-pronoun-summary",
          "exampleKind": "provided_material"
        }
      ],
      "practice": [
        {
          "id": "np-08",
          "stem": "Ms. Novak and her team finished the client presentation two days early. The client praised _____ for the clear and simple design.",
          "choices": [
            "them",
            "their",
            "theirs",
            "they"
          ],
          "answer": 0,
          "reason": "praised의 목적어 자리이고 앞 문장의 Ms. Novak and her team을 가리키므로 목적격 them입니다.",
          "translation": "노박 씨와 그녀의 팀은 고객 발표 자료를 이틀 일찍 끝냈습니다. 고객은 명확하고 간결한 디자인에 대해 그들을 칭찬했습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "them",
              "correct": true,
              "explanation": "목적격. 앞 문장의 Ms. Novak and her team(복수)을 받아 praised의 목적어가 됩니다."
            },
            {
              "label": "B",
              "text": "their",
              "correct": false,
              "explanation": "소유격. 뒤에 명사가 와야 하는데 바로 전치사 for가 이어집니다."
            },
            {
              "label": "C",
              "text": "theirs",
              "correct": false,
              "explanation": "소유대명사·그들의 것. 고객이 칭찬한 대상은 '그들의 것'이 아니라 팀 사람들 자신입니다."
            },
            {
              "label": "D",
              "text": "they",
              "correct": false,
              "explanation": "주격. 동사 praised 뒤 목적어 자리에는 주격을 쓰지 않습니다."
            }
          ],
          "reviewPoint": "대명사는 앞 문장에서 가리키는 대상(수)을 찾고, 빈칸 자리(주어·목적어·명사 앞)로 격을 정하세요.",
          "topicId": "np-pronoun-case"
        },
        {
          "id": "np-09",
          "stem": "Because his assistant was on leave, Mr. Hale had to book the business trip by _____.",
          "choices": [
            "his",
            "himself",
            "he",
            "him"
          ],
          "answer": 1,
          "reason": "by oneself(혼자서)는 재귀대명사를 쓰는 고정 표현이므로 by himself입니다.",
          "translation": "보조 직원이 휴가 중이어서 헤일 씨는 출장 예약을 혼자서 해야 했습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "his",
              "correct": false,
              "explanation": "소유격. 뒤에 명사가 없어 by his만으로는 구가 완성되지 않습니다."
            },
            {
              "label": "B",
              "text": "himself",
              "correct": true,
              "explanation": "재귀대명사. by himself = 도움 없이 혼자서. 보조 직원이 없었다는 이유와 맞습니다."
            },
            {
              "label": "C",
              "text": "he",
              "correct": false,
              "explanation": "주격. 전치사 by 뒤에는 주격을 쓸 수 없습니다."
            },
            {
              "label": "D",
              "text": "him",
              "correct": false,
              "explanation": "목적격. by him은 '그에 의해'로, 주어 Mr. Hale 자신이 혼자 했다는 뜻이 되지 않습니다."
            }
          ],
          "reviewPoint": "by oneself(혼자서) / for oneself(스스로를 위해) / 강조 재귀(직접)를 구분하세요.",
          "topicId": "np-pronoun-case"
        },
        {
          "id": "np-10",
          "stem": "_____ who registered before May 1 will receive a 15 percent discount on the workshop fee.",
          "choices": [
            "Themselves",
            "Their",
            "Those",
            "Them"
          ],
          "answer": 2,
          "reason": "who절의 수식을 받아 '~한 사람들'을 뜻하는 표현은 Those who입니다.",
          "translation": "5월 1일 이전에 등록한 사람들은 워크숍 비용을 15퍼센트 할인받게 됩니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "Themselves",
              "correct": false,
              "explanation": "themselves는 재귀대명사입니다. 이 문장에는 재귀대명사가 받을 앞선 주어가 없어 단독 주어로 쓰지 못합니다."
            },
            {
              "label": "B",
              "text": "Their",
              "correct": false,
              "explanation": "소유격. 뒤에 명사가 와야 하며 who를 바로 이어 받을 수 없습니다."
            },
            {
              "label": "C",
              "text": "Those",
              "correct": true,
              "explanation": "지시대명사·사람들. those who + 동사로 '~하는 사람들'을 나타내며 will receive의 주어가 됩니다."
            },
            {
              "label": "D",
              "text": "Them",
              "correct": false,
              "explanation": "목적격. 문장 맨 앞 주어 자리에 목적격을 쓸 수 없습니다."
            }
          ],
          "reviewPoint": "those who + 복수동사 / anyone who + 단수동사 / those with + 명사를 덩어리로 기억하세요.",
          "topicId": "np-indefinite"
        }
      ],
      "sources": [
        "quantifiers",
        "pronoun-personal",
        "pronoun-possessive",
        "pronoun-reflexive",
        "pronoun-none",
        "pronoun-any",
        "pronoun-another",
        "pronoun-one",
        "pronoun-those",
        "pronoun-modifiers",
        "ybm-basic-2025"
      ],
      "reviewFocus": [
        "np-pronoun-summary"
      ],
      "priorityPolicy": "사용자 원오답·확인된 채점 오답 → 단어장 → 최근 교육자료·기본문법. 보기 출현을 선택한 오답으로 추정하지 않음.",
      "recentTypeSupport": [
        "소유격 + 명사",
        "everyone who + 단수 동사"
      ]
    },
    {
      "id": "adjectives-adverbs",
      "title": "Chapter 4 · 형용사·부사",
      "lead": "명사를 설명하면 형용사, 동사·형용사·부사·문장 전체를 설명하면 부사입니다. 어미보다 자리와 의미를 먼저 보세요.",
      "topics": [
        {
          "id": "aa-adj-form",
          "title": "형용사 어미 · -ly 형용사 · 복합형용사",
          "concept": "-able, -ive, -ous, -al, -ful은 형용사의 단서입니다. 하지만 friendly, costly, likely, timely는 -ly로 끝나도 형용사이고, daily, weekly, monthly, quarterly, yearly는 형용사와 부사 모두 됩니다. 하이픈 복합형용사(state-of-the-art, cost-effective)는 한 단어처럼 명사를 꾸밉니다.",
          "examType": "명사 앞 형용사 고르기 / -ly 형용사를 부사로 착각하는 함정",
          "memory": [
            {
              "pattern": "obedient to + N",
              "meaning": "~에게 순종적인 · 형용사 + 전치사",
              "note": "사용자 요청 보강 단어 obedient",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 요청 보강 단어 obedient"
            },
            {
              "pattern": "spacious",
              "meaning": "널찍한 · 형용사",
              "note": "사용자 요청 보강 단어 spacious",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 요청 보강 단어 spacious"
            },
            {
              "pattern": "impartial",
              "meaning": "공정한 · 형용사",
              "note": "사용자 단어장 impartial",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장 impartial"
            },
            {
              "pattern": "customary",
              "meaning": "관례적인 [형]",
              "note": "단어장 확인",
              "basis": "general_grammar",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장 customary"
            },
            {
              "pattern": "friendly · costly · likely · timely",
              "meaning": "친절한 · 비용이 드는 · ~할 것 같은 · 시기적절한",
              "note": "형용사. 부사가 필요하면 in a timely manner"
            },
            {
              "pattern": "daily · weekly · monthly · quarterly",
              "meaning": "매일(의) · 매주(의) · 매월(의) · 분기별(의)",
              "note": "a monthly report(형) / is updated monthly(부)"
            },
            {
              "pattern": "state-of-the-art · cost-effective",
              "meaning": "최신식의 · 비용 효율적인",
              "note": "명사 앞에서 하이픈으로 묶음"
            },
            {
              "pattern": "complimentary / complementary",
              "meaning": "무료의(칭찬의) / 상호 보완적인",
              "note": "complimentary breakfast = 무료 조식"
            },
            {
              "pattern": "authentic",
              "meaning": "진짜의·정통의 [형]",
              "note": "명사를 꾸미기",
              "basis": "general_grammar"
            },
            {
              "pattern": "friendly",
              "meaning": "친절한 [형]",
              "note": "-ly지만 형용사",
              "basis": "general_grammar"
            },
            {
              "pattern": "costly",
              "meaning": "비용이 많이 드는 [형]",
              "note": "-ly지만 형용사",
              "basis": "general_grammar"
            },
            {
              "pattern": "timely",
              "meaning": "시기적절한 [형]",
              "note": "-ly지만 형용사",
              "basis": "general_grammar"
            }
          ]
        },
        {
          "id": "aa-position",
          "title": "형용사 자리 vs 부사 자리",
          "concept": "명사의 성격·상태를 설명하면 형용사, 동사·형용사·다른 부사·문장 전체를 꾸미면 부사를 검토합니다. 명사 앞에는 명사 수식어도, 보어에는 명사구도 올 수 있으므로 위치만으로 형용사를 확정하지 마세요.",
          "examType": "be/관사 뒤 형용사 vs 동사 뒤 부사 / 형용사 앞 부사",
          "memory": [
            {
              "pattern": "an ambitious + N",
              "meaning": "먼저 구별할 내 자료",
              "note": "1회109 원오답 표시",
              "priorityBasis": "reported_wrong",
              "priorityEvidence": "1회109 원오답 표시"
            },
            {
              "pattern": "be hesitant to V",
              "meaning": "먼저 구별할 내 자료",
              "note": "사용자 단어장",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장"
            },
            {
              "pattern": "a/the + ___ + 명사",
              "meaning": "형용사 또는 명사 수식어",
              "note": "an innovative approach / a safety inspection: 뜻과 결합까지 확인"
            },
            {
              "pattern": "be/seem/remain + ___",
              "meaning": "상태를 설명하면 형용사",
              "note": "정체를 나타내는 명사 보어도 가능: She is our director."
            },
            {
              "pattern": "___ + 형용사/부사",
              "meaning": "정도 부사",
              "note": "extremely helpful, very quickly"
            },
            {
              "pattern": "완성 문장 + ___",
              "meaning": "부사",
              "note": "respond promptly"
            },
            {
              "pattern": "be + 부사 + 명사구 보어",
              "meaning": "현재·직접 등 부가 의미",
              "note": "She is currently our director: currently가 director를 형용사처럼 꾸미는 것은 아닙니다."
            },
            {
              "pattern": "be of + 형용사 + 추상명사",
              "meaning": "~한 성질이다",
              "note": "of high importance = important. importance 앞은 형용사 high; 비교 문맥이면 higher."
            },
            {
              "pattern": "responsible for + N",
              "meaning": "~을 담당하는",
              "note": "형용사 + 전치사",
              "basis": "general_grammar"
            },
            {
              "pattern": "familiar with + N",
              "meaning": "~에 익숙한",
              "note": "형용사 + 전치사",
              "basis": "general_grammar"
            },
            {
              "pattern": "eligible for + N",
              "meaning": "~의 자격이 있는",
              "note": "eligible to V와 구별",
              "basis": "general_grammar"
            },
            {
              "pattern": "capable of + V-ing",
              "meaning": "~할 능력이 있는",
              "note": "단어장 be capable of",
              "basis": "general_grammar"
            },
            {
              "pattern": "aware of + N",
              "meaning": "~을 알고 있는",
              "note": "형용사 + 전치사",
              "basis": "general_grammar"
            },
            {
              "pattern": "interested in + N",
              "meaning": "~에 관심 있는",
              "note": "-ing 목적어도 가능",
              "basis": "general_grammar"
            },
            {
              "pattern": "available to + 사람",
              "meaning": "~가 이용할 수 있는",
              "note": "available for + 용도도 가능",
              "basis": "general_grammar"
            },
            {
              "pattern": "suitable for + N",
              "meaning": "~에 적합한",
              "note": "형용사 + 전치사",
              "basis": "general_grammar"
            },
            {
              "pattern": "hesitant to V",
              "meaning": "~하기를 망설이는",
              "note": "단어장 be hesitant to",
              "basis": "general_grammar"
            },
            {
              "pattern": "willing to V",
              "meaning": "기꺼이 ~하는",
              "note": "형용사 + 부정사",
              "basis": "general_grammar"
            },
            {
              "pattern": "likely to V",
              "meaning": "~할 가능성이 큰",
              "note": "형용사 + 부정사",
              "basis": "general_grammar"
            },
            {
              "pattern": "ready to V",
              "meaning": "~할 준비가 된",
              "note": "형용사 + 부정사",
              "basis": "general_grammar"
            }
          ],
          "reviewFocus": true,
          "reviewBlocks": [
            {
              "title": "more/most가 붙어도 수식 대상부터",
              "lines": [
                "use resources more effectively → use라는 동작을 설명: 부사 effectively",
                "her most recent book → book이라는 명사를 설명: 형용사 recent",
                "more/most는 비교의 정도를 표시합니다. 뒤 단어의 품사는 문장 역할로 정합니다."
              ]
            },
            {
              "title": "be hesitant to vs hesitate to",
              "lines": [
                "She was hesitant to start. → hesitant는 형용사, was의 상태 보어",
                "She hesitated to start. → hesitate는 동사, 여기서는 자동사",
                "was hesitated to start ✗ → 이 뜻의 hesitate를 수동태로 쓰지 않습니다."
              ]
            }
          ]
        },
        {
          "id": "aa-participial",
          "title": "분사형용사 · be + -ing / be + p.p.",
          "concept": "be + -ing는 진행형일 수도, 형용사 보어(encouraging)일 수도 있습니다. be + p.p.는 수동태일 수도, 상태 형용사(be qualified)일 수도 있습니다. 감정 단어는 감정을 일으키는 쪽이 -ing/-ive, 감정을 느끼는 쪽이 -ed입니다. '무조건 형용사형'이 아니라 주어와의 의미 관계로 고릅니다.",
          "examType": "impressed vs impressive / encouraging vs encouraged",
          "memory": [
            {
              "pattern": "disappointing: 경험·사물이 실망을 줌",
              "meaning": "먼저 구별할 내 자료",
              "note": "2회109 원오답 및 온라인 오답 확인",
              "priorityBasis": "graded_wrong",
              "priorityEvidence": "2회109 원오답 및 온라인 오답 확인"
            },
            {
              "pattern": "disappointed",
              "meaning": "실망한 상태 · -ed형 형용사",
              "note": "사용자 단어장 disappointed",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장 disappointed"
            },
            {
              "pattern": "사물·결과 + is encouraging / impressive",
              "meaning": "고무적인 / 인상적인",
              "note": "감정을 일으키는 쪽"
            },
            {
              "pattern": "사람 + is impressed / satisfied (by/with)",
              "meaning": "감명받은 / 만족한",
              "note": "감정을 느끼는 쪽"
            },
            {
              "pattern": "be + p.p. + by 행위자",
              "meaning": "수동태",
              "note": "was reviewed by the team"
            },
            {
              "pattern": "be qualified for / be located in",
              "meaning": "자격 있는 / 위치한",
              "note": "상태를 나타내는 p.p. 형용사"
            }
          ]
        },
        {
          "id": "aa-adverb-roles",
          "title": "부사의 역할과 위치",
          "concept": "방식·정도·빈도 등을 더하는 부사는 수식 대상과 위치를 확인합니다. 수동태·완료형 안(has been carefully reviewed)이나 동사구 끝에 자주 놓입니다. 장소 등 필수 보충어도 있으므로 부사는 모두 지워도 된다고 외우지 마세요. 짧은 목적어와 동사 사이에는 방식 부사를 보통 두지 않습니다.",
          "examType": "has been ___ p.p. / be ___ p.p. 사이 부사",
          "memory": [
            {
              "pattern": "worked tirelessly",
              "meaning": "먼저 구별할 내 자료",
              "note": "2회102 원오답 표시",
              "priorityBasis": "reported_wrong",
              "priorityEvidence": "2회102 원오답 표시"
            },
            {
              "pattern": "replicate colors accurately",
              "meaning": "먼저 구별할 내 자료",
              "note": "2회122 원오답 표시",
              "priorityBasis": "reported_wrong",
              "priorityEvidence": "2회122 원오답 표시"
            },
            {
              "pattern": "hard",
              "meaning": "열심히·세게",
              "note": "work hard",
              "basis": "general_grammar",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장 형용사·부사 짝"
            },
            {
              "pattern": "hardly",
              "meaning": "거의 ~않다",
              "note": "hard와 뜻 구별",
              "basis": "general_grammar",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장 형용사·부사 짝"
            },
            {
              "pattern": "late",
              "meaning": "늦은·늦게",
              "note": "arrive late",
              "basis": "general_grammar",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장 형용사·부사 짝"
            },
            {
              "pattern": "lately",
              "meaning": "최근에",
              "note": "lately = recently",
              "basis": "general_grammar",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장 형용사·부사 짝"
            },
            {
              "pattern": "high",
              "meaning": "높은·높이",
              "note": "high prices; fly high",
              "basis": "general_grammar",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장 형용사·부사 짝"
            },
            {
              "pattern": "highly",
              "meaning": "매우·높이 평가하여",
              "note": "highly effective; highly regarded",
              "basis": "general_grammar",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장 형용사·부사 짝"
            },
            {
              "pattern": "near",
              "meaning": "가까운·가까이",
              "note": "near the station에서는 전치사",
              "basis": "general_grammar",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장 형용사·부사 짝"
            },
            {
              "pattern": "nearly",
              "meaning": "거의",
              "note": "nearly finished",
              "basis": "general_grammar",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장 형용사·부사 짝"
            },
            {
              "pattern": "have/be + ___ + p.p.",
              "meaning": "부사",
              "note": "was clearly explained"
            },
            {
              "pattern": "V + O + ___",
              "meaning": "부사(문장 끝)",
              "note": "explains each step clearly"
            },
            {
              "pattern": "___, S + V",
              "meaning": "문장 부사",
              "note": "Unfortunately, ..."
            },
            {
              "pattern": "tirelessly + 동작동사",
              "meaning": "지칠 줄 모르고",
              "note": "2회102 원오답 표시",
              "basis": "general_grammar"
            },
            {
              "pattern": "accurately + 동작동사",
              "meaning": "정확하게",
              "note": "2회122 원오답 표시",
              "basis": "general_grammar"
            },
            {
              "pattern": "fast",
              "meaning": "빠른 [형]·빨리 [부]",
              "note": "fastly는 일반적으로 쓰지 않음",
              "basis": "general_grammar"
            },
            {
              "pattern": "relatively",
              "meaning": "비교적",
              "note": "relatively inexpensive",
              "basis": "general_grammar"
            },
            {
              "pattern": "particularly",
              "meaning": "특히",
              "note": "particularly useful",
              "basis": "general_grammar"
            },
            {
              "pattern": "sufficiently",
              "meaning": "충분히",
              "note": "sufficiently detailed",
              "basis": "general_grammar"
            }
          ]
        },
        {
          "id": "aa-time-adverbs",
          "title": "still · yet · already · hardly · only — 의미와 도치",
          "concept": "still/yet/already/soon 하나로 시제를 확정하지 않습니다. hardly는 거의 ~않다, seldom/rarely는 좀처럼 ~않다라는 뜻입니다. 기본 용법에서 별도 not을 덧붙이지 않습니다. 부정어 또는 Only after/if가 문두에 오면 해당 주절이 도치됩니다. Only가 주어를 꾸미면 이 규칙을 적용하지 않습니다.",
          "examType": "부정문 끝 yet / hardly 의미 / Only + 부사구 뒤 도치",
          "memory": [
            {
              "pattern": "have not p.p. yet / still have not p.p.",
              "meaning": "아직 ~않았다",
              "note": "yet은 부정문 끝, still은 부정어 앞"
            },
            {
              "pattern": "hardly · seldom · rarely",
              "meaning": "거의 ~않다",
              "note": "not과 함께 쓰지 않음"
            },
            {
              "pattern": "Only after/if + 절, 조동사 + S + V",
              "meaning": "~해야만 비로소",
              "note": "도치는 주절에서 일어남"
            },
            {
              "pattern": "even · only",
              "meaning": "~조차 · ~만",
              "note": "꾸미는 말 바로 앞에 두어 범위를 정함"
            }
          ]
        },
        {
          "id": "aa-number-adverbs",
          "title": "수량·시점 부사: approximately · up to · right · shortly",
          "concept": "숫자 앞 부사는 범위를 정합니다. approximately(약), at least(최소, ≥), up to(최대, ≤), more than/over(초과, >)를 구분하세요. 시점 앞의 right(바로), immediately/shortly/soon after(직후·곧)도 자주 쓰입니다.",
          "examType": "숫자 앞 범위 부사 의미 판단 / shortly after + 시점",
          "memory": [
            {
              "pattern": "approximately / about + 숫자",
              "meaning": "약",
              "note": "정확한 수가 아님"
            },
            {
              "pattern": "at least / up to + 숫자",
              "meaning": "최소 / 최대",
              "note": "≥ / ≤"
            },
            {
              "pattern": "more than / over + 숫자",
              "meaning": "~보다 많은",
              "note": "> (그 숫자는 포함하지 않음)"
            },
            {
              "pattern": "right / shortly / immediately after",
              "meaning": "직후 / 얼마 후 / 즉시",
              "note": "after·before 앞 강조"
            },
            {
              "pattern": "approximately + 수량",
              "meaning": "대략",
              "note": "approximately 50 visitors",
              "basis": "general_grammar"
            },
            {
              "pattern": "nearly + 수량·기간",
              "meaning": "거의",
              "note": "nearly three weeks",
              "basis": "general_grammar"
            },
            {
              "pattern": "shortly before",
              "meaning": "~직전에",
              "note": "시점이 가깝다는 뜻",
              "basis": "general_grammar"
            }
          ]
        }
      ],
      "examples": [
        {
          "en": "The newsletter is issued monthly, and the monthly issue goes to all staff.",
          "ko": "소식지는 매월 발행되며, 월간호는 전 직원에게 배포됩니다.",
          "focus": [
            "issued monthly",
            "monthly issue"
          ],
          "why": "첫 monthly는 동사 issued를 꾸미는 부사, 둘째 monthly는 명사 issue를 꾸미는 형용사입니다. 같은 단어도 자리로 품사가 정해집니다.",
          "topicId": "aa-adj-form",
          "exampleKind": "authored_learning"
        },
        {
          "en": "The front desk staff were friendly and handled requests promptly.",
          "ko": "프런트 직원들은 친절했고 요청을 신속하게 처리했습니다.",
          "focus": [
            "were friendly",
            "handled requests promptly"
          ],
          "why": "friendly는 -ly로 끝나지만 주어의 상태를 설명하는 형용사 보어입니다. promptly는 handled를 꾸미는 부사입니다.",
          "topicId": "aa-position",
          "exampleKind": "authored_learning"
        },
        {
          "en": "Visitors were impressed by the museum's impressive collection.",
          "ko": "방문객들은 박물관의 인상적인 소장품에 감명받았습니다.",
          "focus": [
            "were impressed",
            "impressive collection"
          ],
          "why": "감명을 느낀 사람(visitors)은 impressed, 감명을 준 대상(collection)은 impressive입니다.",
          "topicId": "aa-participial",
          "exampleKind": "authored_learning"
        },
        {
          "en": "The contract has been carefully reviewed by our legal team.",
          "ko": "계약서는 법무팀이 꼼꼼히 검토했습니다.",
          "focus": [
            "has been carefully reviewed"
          ],
          "why": "부사 carefully가 수동 완료형 has been과 p.p. reviewed 사이에서 동작의 방식을 설명합니다.",
          "topicId": "aa-adverb-roles",
          "exampleKind": "authored_learning"
        },
        {
          "en": "Only after the inspection is complete will the store reopen.",
          "ko": "점검이 끝나야만 매장이 다시 문을 엽니다.",
          "focus": [
            "Only after the inspection is complete",
            "will the store reopen"
          ],
          "why": "Only after 부사절이 문두에 오면 주절이 조동사 + 주어(will the store) 순서로 도치됩니다. 부사절 안(the inspection is)은 도치되지 않습니다.",
          "topicId": "aa-time-adverbs",
          "exampleKind": "authored_learning"
        }
      ],
      "practice": [
        {
          "id": "aa-01",
          "stem": "The firm's approach to customer service is remarkably _____.",
          "choices": [
            "innovation",
            "innovate",
            "innovative",
            "innovatively"
          ],
          "answer": 2,
          "reason": "remarkably가 정도를 더하고, 주어 approach의 성격을 설명하는 형용사 innovative가 보어로 옵니다.",
          "translation": "그 회사의 고객 서비스 방식은 매우 혁신적입니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "innovation",
              "correct": false,
              "explanation": "innovation은 혁신이라는 명사입니다. 여기서는 remarkably가 수식할 정도·성격을 나타내는 형용사가 필요합니다."
            },
            {
              "label": "B",
              "text": "innovate",
              "correct": false,
              "explanation": "innovate는 혁신하다는 동사원형으로 is remarkably 뒤 보어가 되지 못합니다."
            },
            {
              "label": "C",
              "text": "innovative",
              "correct": true,
              "explanation": "innovative는 혁신적인이라는 형용사로 approach의 성격을 설명합니다."
            },
            {
              "label": "D",
              "text": "innovatively",
              "correct": false,
              "explanation": "innovatively는 혁신적으로라는 부사여서 이 문장의 주격보어 자리를 채우지 못합니다."
            }
          ],
          "reviewPoint": "명사 앞 수식어와 달리 정도 부사+상태 보어 자리는 형용사 여부가 분명합니다.",
          "topicId": "aa-position"
        },
        {
          "id": "aa-02",
          "stem": "The two-week shipping delay proved _____ for the supplier, which had to pay a late-delivery penalty.",
          "choices": [
            "cost",
            "costing",
            "costs",
            "costly"
          ],
          "answer": 3,
          "reason": "prove + 형용사 보어로 '비용이 많이 드는 것으로 드러나다'를 뜻해야 하므로 형용사 costly입니다.",
          "translation": "2주간의 배송 지연은 공급업체에 큰 비용 부담이 되었고, 그 업체는 지연 배송 위약금을 내야 했습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "cost",
              "correct": false,
              "explanation": "명사·비용 / 동사·비용이 들다. proved cost로는 지연이 어떤 상태였는지 설명하지 못합니다."
            },
            {
              "label": "B",
              "text": "costing",
              "correct": false,
              "explanation": "-ing형. cost는 보통 진행형·형용사형으로 이런 보어 자리에 쓰지 않습니다."
            },
            {
              "label": "C",
              "text": "costs",
              "correct": false,
              "explanation": "costs는 비용들이라는 복수명사입니다. 지연으로 비용이 많이 들었다는 상태를 설명하려면 costly가 필요합니다."
            },
            {
              "label": "D",
              "text": "costly",
              "correct": true,
              "explanation": "형용사·비용이 많이 드는. -ly로 끝나지만 형용사이며 proved 뒤에서 delay의 성격을 설명합니다."
            }
          ],
          "reviewPoint": "costly, timely, friendly, likely는 -ly 형용사입니다. 부사로 착각하지 마세요.",
          "topicId": "aa-adj-form"
        },
        {
          "id": "aa-03",
          "stem": "The shuttle bus runs _____ between the airport and the conference hotel during the event.",
          "choices": [
            "daily",
            "everyday",
            "day-to-day",
            "a day"
          ],
          "answer": 0,
          "reason": "runs를 꾸미는 부사 자리이며, daily는 '매일'이라는 부사로 쓸 수 있습니다.",
          "translation": "행사 기간 동안 셔틀버스가 공항과 회의 호텔 사이를 매일 운행합니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "daily",
              "correct": true,
              "explanation": "부사·매일. daily는 형용사(a daily shuttle)와 부사(runs daily) 모두 됩니다."
            },
            {
              "label": "B",
              "text": "everyday",
              "correct": false,
              "explanation": "형용사·일상적인. 한 단어 everyday는 명사 앞에만 쓰며, 부사는 두 단어 every day입니다."
            },
            {
              "label": "C",
              "text": "day-to-day",
              "correct": false,
              "explanation": "형용사·일상적인. 명사 앞(day-to-day operations)에 쓰는 복합형용사로, 동사를 꾸미지 않습니다."
            },
            {
              "label": "D",
              "text": "a day",
              "correct": false,
              "explanation": "'하루에'는 횟수와 함께(twice a day) 씁니다. 단독 runs a day로는 '매일 운행한다'는 뜻이 되지 않습니다."
            }
          ],
          "reviewPoint": "daily / weekly / monthly / quarterly는 형용사·부사 겸용. everyday(형) vs every day(부).",
          "topicId": "aa-adj-form"
        },
        {
          "id": "aa-04",
          "stem": "The instructions in the new manual are short and easy to follow. Most users have found them _____ helpful.",
          "choices": [
            "extremity",
            "extremely",
            "extreme",
            "extremes"
          ],
          "answer": 1,
          "reason": "형용사 helpful이 목적격보어이고, 빈칸은 helpful의 정도를 꾸미는 부사 자리입니다.",
          "translation": "새 매뉴얼의 안내는 짧고 따라 하기 쉽습니다. 대부분의 사용자가 그것이 매우 도움이 된다고 생각했습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "extremity",
              "correct": false,
              "explanation": "명사·극단, 말단. 형용사를 수식하는 역할을 하지 못합니다."
            },
            {
              "label": "B",
              "text": "extremely",
              "correct": true,
              "explanation": "부사·매우. 형용사 helpful 앞에서 정도를 강조합니다."
            },
            {
              "label": "C",
              "text": "extreme",
              "correct": false,
              "explanation": "extreme은 극단적인이라는 형용사입니다. helpful의 정도를 매우라고 높이는 부사 역할을 하지 못합니다."
            },
            {
              "label": "D",
              "text": "extremes",
              "correct": false,
              "explanation": "복수명사·극단. found them 뒤 보어 helpful 앞에 명사가 끼어들 자리가 없습니다."
            }
          ],
          "reviewPoint": "보어(형용사) 앞 빈칸은 그 형용사를 꾸미는 부사 자리입니다.",
          "topicId": "aa-position"
        },
        {
          "id": "aa-05",
          "stem": "The judges were _____ by the quality of the student designs and awarded three prizes instead of one.",
          "choices": [
            "impressing",
            "impression",
            "impressed",
            "impressive"
          ],
          "answer": 2,
          "reason": "심사위원이 디자인의 질에 의해 감명을 받은 것이므로 감정을 느끼는 쪽을 나타내는 impressed입니다.",
          "translation": "심사위원들은 학생 디자인의 수준에 감명받아 상을 하나가 아닌 세 개 수여했습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "impressing",
              "correct": false,
              "explanation": "-ing형. were impressing은 심사위원이 누군가에게 감명을 주고 있었다는 진행형이 되어 by 이하와 맞지 않습니다."
            },
            {
              "label": "B",
              "text": "impression",
              "correct": false,
              "explanation": "명사·인상. 심사위원이 '인상'이라는 명사와 같을 수 없습니다."
            },
            {
              "label": "C",
              "text": "impressed",
              "correct": true,
              "explanation": "과거분사·감명받은. judges가 감정을 느끼는 쪽이고 by + 원인이 이어집니다."
            },
            {
              "label": "D",
              "text": "impressive",
              "correct": false,
              "explanation": "형용사·인상적인. 심사위원 자신이 인상적이라는 뜻이 되고, by the quality와도 연결되지 않습니다."
            }
          ],
          "reviewPoint": "감정을 느끼는 사람은 -ed, 감정을 일으키는 대상은 -ing/-ive. 형태가 아닌 의미 관계로 고르세요.",
          "topicId": "aa-participial"
        },
        {
          "id": "aa-06",
          "stem": "The first-quarter results were highly _____, so the board approved additional funding for the project.",
          "choices": [
            "encouraged",
            "encourage",
            "encouragement",
            "encouraging"
          ],
          "answer": 3,
          "reason": "결과가 이사회를 고무시킨(긍정적 인상을 준) 쪽이므로 형용사 보어 encouraging입니다.",
          "translation": "1분기 실적이 매우 고무적이어서 이사회는 프로젝트 추가 자금을 승인했습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "encouraged",
              "correct": false,
              "explanation": "과거분사·고무된. 실적(사물)이 격려를 받았다는 뜻이 되어 의미가 맞지 않습니다."
            },
            {
              "label": "B",
              "text": "encourage",
              "correct": false,
              "explanation": "동사원형. were 뒤 보어 자리에 원형은 올 수 없습니다."
            },
            {
              "label": "C",
              "text": "encouragement",
              "correct": false,
              "explanation": "encouragement는 격려라는 명사입니다. 이 자리에서는 정도 부사 highly가 꾸미는 형용사 보어가 필요합니다."
            },
            {
              "label": "D",
              "text": "encouraging",
              "correct": true,
              "explanation": "분사형용사·고무적인. results가 기대감을 일으켰다는 뜻으로 so 이하의 추가 자금 승인과 이어집니다."
            }
          ],
          "reviewPoint": "be + -ing가 항상 진행형은 아닙니다. 사물 주어 + encouraging은 '고무적인'이라는 형용사 보어입니다.",
          "topicId": "aa-participial"
        },
        {
          "id": "aa-07",
          "stem": "The revised travel policy has been _____ communicated to all employees through the intranet.",
          "choices": [
            "clearly",
            "clear",
            "clearer",
            "clarity"
          ],
          "answer": 0,
          "reason": "has been과 p.p. communicated 사이에서 전달 방식을 꾸미는 부사 clearly가 필요합니다.",
          "translation": "개정된 출장 규정이 사내 인트라넷을 통해 전 직원에게 명확하게 전달되었습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "clearly",
              "correct": true,
              "explanation": "부사·명확하게. 수동 완료형 사이에서 동사 communicated의 방식을 설명합니다."
            },
            {
              "label": "B",
              "text": "clear",
              "correct": false,
              "explanation": "형용사·명확한. 조동사와 p.p. 사이에 형용사는 들어가지 않습니다."
            },
            {
              "label": "C",
              "text": "clearer",
              "correct": false,
              "explanation": "clearer는 더 명확한이라는 비교급 형용사입니다. 여기서는 communicated를 수식할 부사 clearly가 필요합니다. 비교 대상 생략 여부가 핵심은 아닙니다."
            },
            {
              "label": "D",
              "text": "clarity",
              "correct": false,
              "explanation": "명사·명확성. 동사 구 사이에 명사가 끼어들 수 없습니다."
            }
          ],
          "reviewPoint": "have/be + ____ + p.p.는 부사 자리입니다.",
          "topicId": "aa-adverb-roles"
        },
        {
          "id": "aa-08",
          "stem": "The old printer is _____ used now that the new one has been installed on the second floor.",
          "choices": [
            "hardship",
            "hardly",
            "hard",
            "hardness"
          ],
          "answer": 1,
          "reason": "새 프린터가 설치되어 이전 프린터를 거의 쓰지 않는다는 문맥입니다. hardly는 거의 ~않다라는 부사입니다.",
          "translation": "2층에 새 프린터가 설치돼 이제 이전 프린터는 거의 사용되지 않습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "hardship",
              "correct": false,
              "explanation": "hardship은 곤란·고난이라는 명사로 사용 빈도를 나타낼 수 없습니다."
            },
            {
              "label": "B",
              "text": "hardly",
              "correct": true,
              "explanation": "hardly는 거의 ~않다라는 부사로 used의 빈도를 나타냅니다."
            },
            {
              "label": "C",
              "text": "hard",
              "correct": false,
              "explanation": "hard는 열심히/세게라는 뜻의 부사로도 쓰지만, 여기서 거의 사용하지 않는다는 의미를 만들지 못합니다."
            },
            {
              "label": "D",
              "text": "hardness",
              "correct": false,
              "explanation": "hardness는 단단함이라는 명사로 수동 동사구 is used 안에서 빈도를 수식하지 못합니다."
            }
          ],
          "reviewPoint": "hard(열심히/세게)와 hardly(거의 ~않다)는 뜻이 다릅니다.",
          "topicId": "aa-time-adverbs"
        },
        {
          "id": "aa-09",
          "stem": "The fire code permits 40 people in each meeting room but prohibits larger groups. A meeting room must never hold _____ forty people.",
          "choices": [
            "up to",
            "approximately",
            "more than",
            "at least"
          ],
          "answer": 2,
          "reason": "40명 초과를 금지하므로 never hold more than forty(40명을 넘게 수용하면 안 된다)입니다.",
          "translation": "소방 규정은 회의실당 40명까지 허용하지만 더 큰 단체는 금지합니다. 회의실은 절대 40명을 넘게 수용하면 안 됩니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "up to",
              "correct": false,
              "explanation": "up to는 40명 이하 범위입니다. never와 합치면 허용된 범위의 수용까지 금지하게 됩니다."
            },
            {
              "label": "B",
              "text": "approximately",
              "correct": false,
              "explanation": "approximately는 약 40명입니다. 엄격히 40명 초과를 금지하는 상한을 나타내지 못합니다."
            },
            {
              "label": "C",
              "text": "more than",
              "correct": true,
              "explanation": "more than은 40명 초과입니다. never와 합쳐 초과 인원 수용 금지라는 규정을 표현합니다."
            },
            {
              "label": "D",
              "text": "at least",
              "correct": false,
              "explanation": "at least는 40명 이상입니다. never at least forty라면 정확히 40명도 금지해 첫 문장과 충돌합니다."
            }
          ],
          "reviewPoint": "more than은 초과(>), at least는 이상(≥). 부정어가 범위에 미치는 영향도 읽습니다.",
          "topicId": "aa-number-adverbs"
        },
        {
          "id": "aa-10",
          "stem": "The replacement parts have not arrived _____, so the repair has been rescheduled for next week.",
          "choices": [
            "arrival",
            "recent",
            "arriving",
            "yet"
          ],
          "answer": 3,
          "reason": "아직 도착하지 않았다는 현재 상황에는 have not arrived yet이 맞습니다.",
          "translation": "교체 부품이 아직 도착하지 않아 수리가 다음 주로 변경됐습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "arrival",
              "correct": false,
              "explanation": "arrival은 도착이라는 명사로 완료 동사구 뒤에서 아직이라는 시간 의미를 나타내지 못합니다."
            },
            {
              "label": "B",
              "text": "recent",
              "correct": false,
              "explanation": "recent는 최근의라는 형용사로 arrived를 수식할 수 없습니다."
            },
            {
              "label": "C",
              "text": "arriving",
              "correct": false,
              "explanation": "arriving은 도착하다의 -ing형으로 have not arrived 뒤에 이대로 연결할 수 없습니다."
            },
            {
              "label": "D",
              "text": "yet",
              "correct": true,
              "explanation": "yet은 아직이라는 부사로 현재완료 부정문 끝에서 미완료 상태를 나타냅니다."
            }
          ],
          "reviewPoint": "have not p.p. yet: 아직 ~하지 않았다. already를 부정문에서 절대 못 쓴다고 일반화하지 않습니다.",
          "topicId": "aa-time-adverbs"
        }
      ],
      "sources": [
        "adj",
        "adverbs",
        "ybm-basic-2025"
      ],
      "reviewFocus": [
        {
          "topicId": "aa-position",
          "label": "more/most 뒤 품사 · be hesitant to"
        }
      ],
      "priorityPolicy": "사용자 원오답·확인된 채점 오답 → 단어장 → 최근 교육자료·기본문법. 보기 출현을 선택한 오답으로 추정하지 않음.",
      "recentTypeSupport": [
        "형용사를 수식하는 부사",
        "nearly + 기간",
        "형용사 후치 수식"
      ]
    },
    {
      "id": "verbs-verbals",
      "title": "Chapter 5 · 동사·준동사",
      "lead": "동사 → to부정사 → 동명사 → 분사 순서로 나눠 봅니다. 앞 단어가 요구하는 형태와, 주어와의 능동·수동 관계를 확인하세요.",
      "topics": [
        {
          "id": "vv-verb-forms",
          "group": "동사",
          "title": "동사 어미 · 조동사 + 원형 · 명령문",
          "concept": "-ize, -ify, -en, -ate는 동사의 단서입니다. 조동사(will, can, must, should) 뒤와 명령문(Please ...)은 동사원형입니다.",
          "examType": "조동사 뒤 원형 / Please 뒤 원형",
          "memory": [
            {
              "pattern": "modernize · simplify · strengthen · finalize",
              "meaning": "현대화하다 · 단순화하다 · 강화하다 · 확정하다",
              "note": "동사 어미 단서"
            },
            {
              "pattern": "must / should / will + 원형",
              "meaning": "조동사 뒤",
              "note": "must present (presents ✗)"
            },
            {
              "pattern": "Please + 원형",
              "meaning": "명령문",
              "note": "Please submit ..."
            }
          ]
        },
        {
          "id": "vv-help-mandative",
          "group": "동사",
          "title": "help (O) (to) do · 요구·제안 that + 원형",
          "concept": "help는 목적어와 to를 모두 생략할 수 있어 help (O) do / help (O) to do가 모두 됩니다. suggest/request/recommend/demand/require가 '해야 한다'는 요구를 나타내면 that절에 (should) 동사원형을 씁니다. 단순히 사실을 전달하는 suggest(시사하다)는 일반 시제를 씁니다.",
          "examType": "request that + 원형 / 수동 원형 be p.p.",
          "memory": [
            {
              "pattern": "help (O) (to) do",
              "meaning": "~가 …하도록 돕다",
              "note": "help staff track = help staff to track"
            },
            {
              "pattern": "request/require/recommend that S (should) + 원형",
              "meaning": "~해야 한다고 요청하다",
              "note": "수동은 be + p.p."
            },
            {
              "pattern": "The data suggest that S + 시제동사",
              "meaning": "자료가 ~을 시사하다",
              "note": "요구가 아니면 원형 아님"
            },
            {
              "pattern": "suggest that S + 원형",
              "meaning": "제안·요구·주장(해야 한다)의 의미",
              "note": "사실을 시사·주장하는 용법은 일반 시제",
              "basis": "general_grammar"
            },
            {
              "pattern": "recommend that S + 원형",
              "meaning": "제안·요구·주장(해야 한다)의 의미",
              "note": "사실을 시사·주장하는 용법은 일반 시제",
              "basis": "general_grammar"
            },
            {
              "pattern": "propose that S + 원형",
              "meaning": "제안·요구·주장(해야 한다)의 의미",
              "note": "사실을 시사·주장하는 용법은 일반 시제",
              "basis": "general_grammar"
            },
            {
              "pattern": "request that S + 원형",
              "meaning": "제안·요구·주장(해야 한다)의 의미",
              "note": "사실을 시사·주장하는 용법은 일반 시제",
              "basis": "general_grammar"
            },
            {
              "pattern": "demand that S + 원형",
              "meaning": "제안·요구·주장(해야 한다)의 의미",
              "note": "사실을 시사·주장하는 용법은 일반 시제",
              "basis": "general_grammar"
            },
            {
              "pattern": "require that S + 원형",
              "meaning": "제안·요구·주장(해야 한다)의 의미",
              "note": "사실을 시사·주장하는 용법은 일반 시제",
              "basis": "general_grammar"
            },
            {
              "pattern": "insist that S + 원형",
              "meaning": "제안·요구·주장(해야 한다)의 의미",
              "note": "사실을 시사·주장하는 용법은 일반 시제",
              "basis": "general_grammar"
            },
            {
              "pattern": "order that S + 원형",
              "meaning": "제안·요구·주장(해야 한다)의 의미",
              "note": "사실을 시사·주장하는 용법은 일반 시제",
              "basis": "general_grammar"
            },
            {
              "pattern": "urge that S + 원형",
              "meaning": "제안·요구·주장(해야 한다)의 의미",
              "note": "사실을 시사·주장하는 용법은 일반 시제",
              "basis": "general_grammar"
            },
            {
              "pattern": "advise that S + 원형",
              "meaning": "제안·요구·주장(해야 한다)의 의미",
              "note": "사실을 시사·주장하는 용법은 일반 시제",
              "basis": "general_grammar"
            },
            {
              "pattern": "essential that S + 원형",
              "meaning": "필요·중요 판단",
              "note": "should + V도 가능",
              "basis": "general_grammar"
            },
            {
              "pattern": "necessary that S + 원형",
              "meaning": "필요·중요 판단",
              "note": "should + V도 가능",
              "basis": "general_grammar"
            },
            {
              "pattern": "important that S + 원형",
              "meaning": "필요·중요 판단",
              "note": "should + V도 가능",
              "basis": "general_grammar"
            },
            {
              "pattern": "vital that S + 원형",
              "meaning": "필요·중요 판단",
              "note": "should + V도 가능",
              "basis": "general_grammar"
            },
            {
              "pattern": "imperative that S + 원형",
              "meaning": "필요·중요 판단",
              "note": "should + V도 가능",
              "basis": "general_grammar"
            },
            {
              "pattern": "recommendation that S + 원형",
              "meaning": "제안·요구 내용을 나타내는 명사",
              "note": "that절 내용 확인",
              "basis": "general_grammar"
            },
            {
              "pattern": "suggestion that S + 원형",
              "meaning": "제안·요구 내용을 나타내는 명사",
              "note": "that절 내용 확인",
              "basis": "general_grammar"
            },
            {
              "pattern": "proposal that S + 원형",
              "meaning": "제안·요구 내용을 나타내는 명사",
              "note": "that절 내용 확인",
              "basis": "general_grammar"
            },
            {
              "pattern": "that S + be p.p.",
              "meaning": "요구절의 수동 원형",
              "note": "recommend that the invoice be revised",
              "basis": "general_grammar"
            },
            {
              "pattern": "that S + not V",
              "meaning": "요구절의 부정",
              "note": "recommend that the file not be deleted",
              "basis": "general_grammar"
            },
            {
              "pattern": "suggest that + 일반 시제",
              "meaning": "~임을 시사하다",
              "note": "제안 의미와 구별",
              "basis": "general_grammar"
            },
            {
              "pattern": "insist that + 일반 시제",
              "meaning": "사실이라고 주장하다",
              "note": "해야 한다는 요구 의미와 구별",
              "basis": "general_grammar"
            }
          ]
        },
        {
          "id": "vv-causative",
          "group": "동사",
          "title": "have·get: 목적어가 하는가, 받는가?",
          "concept": "목적어와 뒤 동작의 관계로 능동·수동을 판단합니다. 사람/사물만으로 고르지 않습니다. have O -ing라는 별도 진행 상황 용법도 있어 뒤 구조를 함께 봅니다.",
          "examType": "have O 원형 / have O p.p. / get O to do·p.p.",
          "memory": [
            {
              "pattern": "have + O + V",
              "meaning": "O에게 ~하게 시키다",
              "note": "1회130 원오답 표시",
              "basis": "general_grammar",
              "priorityBasis": "reported_wrong",
              "priorityEvidence": "1회130 원오답 표시"
            },
            {
              "pattern": "have O do / have O done",
              "meaning": "O에게 하게 하다 / O를 처리받다",
              "note": "have a technician inspect it / have the lift inspected"
            },
            {
              "pattern": "get O to do / get O done",
              "meaning": "O가 하도록 하다 / O를 처리받다",
              "note": "get staff to check it / get the figures checked"
            },
            {
              "pattern": "make + O + V",
              "meaning": "O가 ~하게 만들다",
              "note": "사역 능동",
              "basis": "general_grammar"
            },
            {
              "pattern": "get + O + to V",
              "meaning": "O가 ~하게 하다",
              "note": "get은 to 사용",
              "basis": "general_grammar"
            },
            {
              "pattern": "help + O + V",
              "meaning": "O가 ~하도록 돕다",
              "note": "to V도 가능",
              "basis": "general_grammar"
            },
            {
              "pattern": "have + O + p.p.",
              "meaning": "O가 ~되게 하다",
              "note": "O가 동작을 받음",
              "basis": "general_grammar"
            },
            {
              "pattern": "get + O + p.p.",
              "meaning": "O가 ~되게 하다",
              "note": "O가 동작을 받음",
              "basis": "general_grammar"
            },
            {
              "pattern": "help + O + to V",
              "meaning": "O가 ~하도록 돕다",
              "note": "to 없는 원형도 가능",
              "basis": "general_grammar"
            }
          ]
        },
        {
          "id": "vv-transitivity",
          "group": "동사",
          "title": "자동사 + 전치사 vs 타동사 + 목적어",
          "concept": "respond to, comply with, depend on, refer to처럼 전치사가 필요한 동사와, discuss, attend, contact, reach처럼 바로 목적어를 받는 동사를 구분합니다. move, work, run, increase는 자동사·타동사 모두로 쓰입니다.",
          "examType": "동사 뒤 전치사 유무 / 동사 + 명사 연어",
          "memory": [
            {
              "pattern": "approach",
              "meaning": "다가오다(자동사)·접근하다(타동사)",
              "note": "1회120 원오답 표시; 실제 문맥은 다가오다",
              "priorityBasis": "reported_wrong",
              "priorityEvidence": "1회120 원오답 표시; 실제 문맥은 다가오다"
            },
            {
              "pattern": "commence",
              "meaning": "시작되다·시작하다",
              "note": "자동사·타동사 모두 가능",
              "basis": "general_grammar",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장·요청한 보강 단어"
            },
            {
              "pattern": "intervene in + N",
              "meaning": "상황에 개입하다",
              "note": "자동사 + 전치사",
              "basis": "general_grammar",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장·요청한 보강 단어"
            },
            {
              "pattern": "respond to · comply with · depend on",
              "meaning": "~에 응답하다 · 준수하다 · 의존하다",
              "note": "전치사 필요"
            },
            {
              "pattern": "discuss · attend · contact + O",
              "meaning": "논의하다 · 참석하다 · 연락하다",
              "note": "discuss about ✗"
            },
            {
              "pattern": "run a store / The bus runs",
              "meaning": "운영하다 / 운행하다",
              "note": "타동·자동 겸용"
            },
            {
              "pattern": "receive permission · make arrangements",
              "meaning": "허가를 받다 · 준비하다",
              "note": "동사 + 명사 덩어리"
            },
            {
              "pattern": "arrive",
              "meaning": "도착하다 · 자동사",
              "note": "arrive at 장소",
              "basis": "general_grammar"
            },
            {
              "pattern": "occur",
              "meaning": "발생하다 · 자동사",
              "note": "목적어 없이 사용",
              "basis": "general_grammar"
            },
            {
              "pattern": "rise",
              "meaning": "오르다 · 자동사",
              "note": "rise–rose–risen",
              "basis": "general_grammar"
            },
            {
              "pattern": "respond to + N",
              "meaning": "~에 응답하다",
              "note": "자동사 + 전치사",
              "basis": "general_grammar"
            },
            {
              "pattern": "participate in + N",
              "meaning": "~에 참여하다",
              "note": "자동사 + 전치사",
              "basis": "general_grammar"
            },
            {
              "pattern": "discuss + O",
              "meaning": "~을 논의하다",
              "note": "discuss about O로 쓰지 않기",
              "basis": "general_grammar"
            },
            {
              "pattern": "attend + O",
              "meaning": "행사·회의에 참석하다",
              "note": "attend the meeting",
              "basis": "general_grammar"
            },
            {
              "pattern": "reach + O",
              "meaning": "~에 도달하다",
              "note": "reach the destination",
              "basis": "general_grammar"
            },
            {
              "pattern": "raise + O",
              "meaning": "~을 올리다",
              "note": "raise–raised–raised",
              "basis": "general_grammar"
            },
            {
              "pattern": "enter + O",
              "meaning": "장소에 들어가다",
              "note": "enter the building",
              "basis": "general_grammar"
            }
          ]
        },
        {
          "id": "vv-infinitive",
          "group": "to부정사",
          "title": "to부정사: 목적 · 동사 + to do",
          "concept": "to부정사는 목적을 나타내거나 특정 동사의 목적어·보충어로 쓰입니다. 동사의 뜻만 추측하지 말고 plan/decide to do처럼 실제 결합을 외우세요. advise/encourage/invite O to do의 목적어가 수동태 주어가 되면 O be advised/encouraged/invited to do로 이어집니다.",
          "examType": "동사 뒤 to do vs -ing / 문두 To do 목적",
          "memory": [
            {
              "pattern": "be hesitant to V",
              "meaning": "~하기를 망설이다",
              "note": "사용자 단어장",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장"
            },
            {
              "pattern": "would like · need · plan · intend · decide",
              "meaning": "+ to do",
              "note": "앞으로 할 일·결정"
            },
            {
              "pattern": "fail · strive · promise · afford · expect",
              "meaning": "+ to do",
              "note": "cannot afford to wait"
            },
            {
              "pattern": "(In order) to do, S + V",
              "meaning": "~하기 위해",
              "note": "in order to better serve"
            },
            {
              "pattern": "encourage / invite / advise O to do",
              "meaning": "O에게 ~하도록 권하다/초대하다/조언하다",
              "note": "수동: staff are encouraged to attend"
            },
            {
              "pattern": "agree to V",
              "meaning": "동의하다",
              "note": "to부정사 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "decide to V",
              "meaning": "결정하다",
              "note": "to부정사 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "plan to V",
              "meaning": "계획하다",
              "note": "to부정사 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "arrange to V",
              "meaning": "준비하다",
              "note": "to부정사 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "hope to V",
              "meaning": "희망하다",
              "note": "to부정사 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "expect to V",
              "meaning": "예상하다",
              "note": "to부정사 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "intend to V",
              "meaning": "의도하다",
              "note": "to부정사 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "aim to V",
              "meaning": "목표로 하다",
              "note": "to부정사 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "promise to V",
              "meaning": "약속하다",
              "note": "to부정사 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "offer to V",
              "meaning": "제안하다",
              "note": "to부정사 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "volunteer to V",
              "meaning": "자원하다",
              "note": "to부정사 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "refuse to V",
              "meaning": "거절하다",
              "note": "to부정사 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "fail to V",
              "meaning": "~하지 못하다",
              "note": "to부정사 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "manage to V",
              "meaning": "가까스로 ~하다",
              "note": "to부정사 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "afford to V",
              "meaning": "~할 여유가 있다",
              "note": "to부정사 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "attempt to V",
              "meaning": "시도하다",
              "note": "to부정사 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "seek to V",
              "meaning": "추구·시도하다",
              "note": "to부정사 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "learn to V",
              "meaning": "배우다",
              "note": "to부정사 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "need to V",
              "meaning": "필요하다",
              "note": "to부정사 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "would like to V",
              "meaning": "~하고 싶다",
              "note": "to부정사 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "strive to V",
              "meaning": "노력하다",
              "note": "to부정사 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "ask + O + to V",
              "meaning": "부탁하다",
              "note": "사람 목적어와 to부정사",
              "basis": "general_grammar"
            },
            {
              "pattern": "tell + O + to V",
              "meaning": "말하다",
              "note": "사람 목적어와 to부정사",
              "basis": "general_grammar"
            },
            {
              "pattern": "remind + O + to V",
              "meaning": "상기시키다",
              "note": "사람 목적어와 to부정사",
              "basis": "general_grammar"
            },
            {
              "pattern": "instruct + O + to V",
              "meaning": "지시하다",
              "note": "사람 목적어와 to부정사",
              "basis": "general_grammar"
            },
            {
              "pattern": "allow + O + to V",
              "meaning": "허락하다",
              "note": "사람 목적어와 to부정사",
              "basis": "general_grammar"
            },
            {
              "pattern": "permit + O + to V",
              "meaning": "허용하다",
              "note": "사람 목적어와 to부정사",
              "basis": "general_grammar"
            },
            {
              "pattern": "enable + O + to V",
              "meaning": "가능하게 하다",
              "note": "사람 목적어와 to부정사",
              "basis": "general_grammar"
            },
            {
              "pattern": "encourage + O + to V",
              "meaning": "장려하다",
              "note": "사람 목적어와 to부정사",
              "basis": "general_grammar"
            },
            {
              "pattern": "require + O + to V",
              "meaning": "요구하다",
              "note": "사람 목적어와 to부정사",
              "basis": "general_grammar"
            },
            {
              "pattern": "expect + O + to V",
              "meaning": "기대하다",
              "note": "사람 목적어와 to부정사",
              "basis": "general_grammar"
            },
            {
              "pattern": "invite + O + to V",
              "meaning": "초대하다",
              "note": "사람 목적어와 to부정사",
              "basis": "general_grammar"
            },
            {
              "pattern": "persuade + O + to V",
              "meaning": "설득하다",
              "note": "사람 목적어와 to부정사",
              "basis": "general_grammar"
            },
            {
              "pattern": "opportunity to V",
              "meaning": "~할 기회",
              "note": "명사 뒤 수식",
              "basis": "general_grammar"
            },
            {
              "pattern": "ability to V",
              "meaning": "~할 능력",
              "note": "명사 뒤 수식",
              "basis": "general_grammar"
            },
            {
              "pattern": "decision to V",
              "meaning": "~하기로 한 결정",
              "note": "명사 뒤 수식",
              "basis": "general_grammar"
            },
            {
              "pattern": "be reluctant to V",
              "meaning": "~하기를 꺼리다",
              "note": "형용사 뒤 부정사",
              "basis": "general_grammar"
            },
            {
              "pattern": "be eager to V",
              "meaning": "간절히 ~하고 싶다",
              "note": "형용사 뒤 부정사",
              "basis": "general_grammar"
            },
            {
              "pattern": "be able to V",
              "meaning": "~할 수 있다",
              "note": "형용사 뒤 부정사",
              "basis": "general_grammar"
            },
            {
              "pattern": "allow V-ing",
              "meaning": "행동을 허용하다",
              "note": "allow + O + to V와 구별",
              "basis": "general_grammar"
            },
            {
              "pattern": "명사 plan + to V",
              "meaning": "~할 계획",
              "note": "동사 plan과 별도로 명사 뒤 수식",
              "basis": "general_grammar"
            },
            {
              "pattern": "be willing to V",
              "meaning": "기꺼이 ~하다",
              "note": "형용사 뒤 부정사",
              "basis": "general_grammar"
            },
            {
              "pattern": "be ready to V",
              "meaning": "~할 준비가 되다",
              "note": "형용사 뒤 부정사",
              "basis": "general_grammar"
            },
            {
              "pattern": "be likely to V",
              "meaning": "~할 가능성이 크다",
              "note": "형용사 뒤 부정사",
              "basis": "general_grammar"
            }
          ]
        },
        {
          "id": "vv-gerund",
          "group": "동명사",
          "title": "동명사: 동사·전치사 뒤 -ing",
          "concept": "동명사는 명사 역할을 하면서 목적어·부사를 그대로 가질 수 있습니다(managing projects efficiently). 반대로 명사형은 형용사와 of를 씁니다(efficient management of projects). 전치사 to(look forward to, be accustomed to) 뒤와 by/upon 뒤에도 -ing가 옵니다.",
          "examType": "동사 + -ing / 전치사 to + -ing / 수동 동명사 being p.p.",
          "memory": [
            {
              "pattern": "be capable of V-ing",
              "meaning": "먼저 구별할 내 자료",
              "note": "사용자 단어장",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장"
            },
            {
              "pattern": "enjoy · avoid · consider · finish · postpone + -ing",
              "meaning": "다른 동작을 목적어로",
              "note": "suggest는 -ing / that절 둘 다"
            },
            {
              "pattern": "look forward to · be accustomed to + -ing",
              "meaning": "~을 고대하다 · ~에 익숙하다",
              "note": "to = 전치사"
            },
            {
              "pattern": "by -ing / upon -ing",
              "meaning": "~함으로써 / ~하자마자",
              "note": "Upon receiving ..."
            },
            {
              "pattern": "not -ing / being p.p.",
              "meaning": "부정 / 수동 동명사",
              "note": "being interrupted"
            },
            {
              "pattern": "stop -ing / stop to do · remember -ing / to do",
              "meaning": "중단 / 하려고 멈춤 · 한 일 기억 / 할 일 기억",
              "note": "뜻이 달라짐"
            },
            {
              "pattern": "avoid V-ing",
              "meaning": "피하다",
              "note": "동명사 목적어",
              "basis": "general_grammar"
            },
            {
              "pattern": "enjoy V-ing",
              "meaning": "즐기다",
              "note": "동명사 목적어",
              "basis": "general_grammar"
            },
            {
              "pattern": "finish V-ing",
              "meaning": "끝내다",
              "note": "동명사 목적어",
              "basis": "general_grammar"
            },
            {
              "pattern": "keep V-ing",
              "meaning": "계속하다",
              "note": "동명사 목적어",
              "basis": "general_grammar"
            },
            {
              "pattern": "consider V-ing",
              "meaning": "고려하다",
              "note": "동명사 목적어",
              "basis": "general_grammar"
            },
            {
              "pattern": "suggest V-ing",
              "meaning": "제안하다",
              "note": "동명사 목적어",
              "basis": "general_grammar"
            },
            {
              "pattern": "recommend V-ing",
              "meaning": "권하다",
              "note": "동명사 목적어",
              "basis": "general_grammar"
            },
            {
              "pattern": "postpone V-ing",
              "meaning": "연기하다",
              "note": "동명사 목적어",
              "basis": "general_grammar"
            },
            {
              "pattern": "delay V-ing",
              "meaning": "미루다",
              "note": "동명사 목적어",
              "basis": "general_grammar"
            },
            {
              "pattern": "put off V-ing",
              "meaning": "미루다",
              "note": "동명사 목적어",
              "basis": "general_grammar"
            },
            {
              "pattern": "admit V-ing",
              "meaning": "인정하다",
              "note": "동명사 목적어",
              "basis": "general_grammar"
            },
            {
              "pattern": "deny V-ing",
              "meaning": "부인하다",
              "note": "동명사 목적어",
              "basis": "general_grammar"
            },
            {
              "pattern": "mind V-ing",
              "meaning": "꺼리다",
              "note": "동명사 목적어",
              "basis": "general_grammar"
            },
            {
              "pattern": "risk V-ing",
              "meaning": "위험을 감수하다",
              "note": "동명사 목적어",
              "basis": "general_grammar"
            },
            {
              "pattern": "begin to V 또는 V-ing",
              "meaning": "둘 다 가능",
              "note": "세부 문맥·용법 차이는 별도 확인",
              "basis": "general_grammar"
            },
            {
              "pattern": "start to V 또는 V-ing",
              "meaning": "둘 다 가능",
              "note": "세부 문맥·용법 차이는 별도 확인",
              "basis": "general_grammar"
            },
            {
              "pattern": "continue to V 또는 V-ing",
              "meaning": "둘 다 가능",
              "note": "세부 문맥·용법 차이는 별도 확인",
              "basis": "general_grammar"
            },
            {
              "pattern": "remember to V",
              "meaning": "해야 할 일을 기억하다",
              "note": "앞으로 할 일",
              "basis": "general_grammar"
            },
            {
              "pattern": "remember V-ing",
              "meaning": "했던 일을 기억하다",
              "note": "이미 한 일",
              "basis": "general_grammar"
            },
            {
              "pattern": "forget to V",
              "meaning": "할 일을 잊다",
              "note": "할 일 누락",
              "basis": "general_grammar"
            },
            {
              "pattern": "forget V-ing",
              "meaning": "했던 일을 잊다",
              "note": "과거 경험",
              "basis": "general_grammar"
            },
            {
              "pattern": "stop to V",
              "meaning": "~하려고 멈추다",
              "note": "목적의 부정사",
              "basis": "general_grammar"
            },
            {
              "pattern": "stop V-ing",
              "meaning": "~하던 일을 그만두다",
              "note": "동명사 목적어",
              "basis": "general_grammar"
            },
            {
              "pattern": "try to V",
              "meaning": "~하려고 노력하다",
              "note": "시도·노력",
              "basis": "general_grammar"
            },
            {
              "pattern": "try V-ing",
              "meaning": "시험 삼아 ~해 보다",
              "note": "방법 시험",
              "basis": "general_grammar"
            },
            {
              "pattern": "regret to V",
              "meaning": "유감스럽게 ~하다",
              "note": "통보·알림 등",
              "basis": "general_grammar"
            },
            {
              "pattern": "regret V-ing",
              "meaning": "~했던 일을 후회하다",
              "note": "과거 행동",
              "basis": "general_grammar"
            },
            {
              "pattern": "look forward to V-ing",
              "meaning": "~을 기대하다",
              "note": "to는 전치사",
              "basis": "general_grammar"
            },
            {
              "pattern": "object to V-ing",
              "meaning": "~에 반대하다",
              "note": "to는 전치사",
              "basis": "general_grammar"
            },
            {
              "pattern": "be committed to V-ing",
              "meaning": "~에 전념하다",
              "note": "to는 전치사",
              "basis": "general_grammar"
            },
            {
              "pattern": "be dedicated to V-ing",
              "meaning": "~에 헌신하다",
              "note": "to는 전치사",
              "basis": "general_grammar"
            },
            {
              "pattern": "be accustomed to V-ing",
              "meaning": "~에 익숙하다",
              "note": "to는 전치사",
              "basis": "general_grammar"
            },
            {
              "pattern": "be used to V-ing",
              "meaning": "~에 익숙하다",
              "note": "to는 전치사",
              "basis": "general_grammar"
            },
            {
              "pattern": "used to V",
              "meaning": "과거에 ~하곤 했다",
              "note": "과거 습관·상태",
              "basis": "general_grammar"
            },
            {
              "pattern": "be used to V",
              "meaning": "~하는 데 사용되다",
              "note": "use의 수동 + 목적 부정사",
              "basis": "general_grammar"
            },
            {
              "pattern": "be responsible for V-ing",
              "meaning": "~할 책임이 있다",
              "note": "for는 전치사",
              "basis": "general_grammar"
            }
          ]
        },
        {
          "id": "vv-participle",
          "group": "분사",
          "title": "분사: 능동 -ing / 수동 p.p. · 분사구문",
          "concept": "분사 수식은 꾸미는 명사와 동작의 관계를 봅니다: the staff attending(참석하는 직원), the attached file(첨부된 파일). outstanding·promising 등은 굳어진 형용사 뜻도 함께 익힙니다. 일반적인 주어 생략 분사구문은 주절 주어와 연결하고, 앞선 완료는 having p.p.로 명확히 할 수 있습니다.",
          "examType": "명사 앞뒤 분사 / 문두 분사구문 능동·수동 / 관용 분사구",
          "memory": [
            {
              "pattern": "leading · existing · lasting · outstanding · following",
              "meaning": "선도하는 · 기존의 · 지속되는 · 뛰어난(미결제의) · 다음의",
              "note": "능동·상태 -ing"
            },
            {
              "pattern": "attached · enclosed · revised · qualified · designated",
              "meaning": "첨부된 · 동봉된 · 수정된 · 자격 있는 · 지정된",
              "note": "수동 p.p."
            },
            {
              "pattern": "unless otherwise stated · once submitted · than expected · as planned",
              "meaning": "별도 명시가 없으면 · 일단 제출되면 · 예상보다 · 계획대로",
              "note": "접속사 + p.p. 관용구"
            },
            {
              "pattern": "Having p.p., S + V",
              "meaning": "~한 후에 (먼저 끝남)",
              "note": "주어 생략 시 보통 주절 주어와 일치. 모든 선후 관계에 having이 필수는 아닙니다."
            },
            {
              "pattern": "with + O + -ing/p.p.",
              "meaning": "O가 ~한 채로",
              "note": "with the door locked"
            },
            {
              "pattern": "as planned / as CEO",
              "meaning": "계획대로 / CEO로서",
              "note": "as 뒤 분사 축약절과 as+명사구의 역할이 다릅니다."
            },
            {
              "pattern": "명사 + V-ing",
              "meaning": "능동·진행 관계의 후치 수식",
              "note": "staff working abroad",
              "basis": "general_grammar"
            },
            {
              "pattern": "명사 + p.p.",
              "meaning": "수동 관계의 후치 수식",
              "note": "documents attached to the email",
              "basis": "general_grammar"
            },
            {
              "pattern": "to be delivered",
              "meaning": "배달될",
              "note": "수동 부정사",
              "basis": "general_grammar"
            },
            {
              "pattern": "being repaired",
              "meaning": "수리되고 있는",
              "note": "수동 동명사·분사형",
              "basis": "general_grammar"
            },
            {
              "pattern": "experienced",
              "meaning": "경험 많은",
              "note": "p.p.형이라고 언제나 수동 동사인 것은 아님",
              "basis": "general_grammar"
            }
          ]
        }
      ],
      "examples": [
        {
          "en": "The manager requested that every invoice be checked twice.",
          "ko": "관리자는 모든 청구서를 두 번 확인하라고 요청했습니다.",
          "focus": [
            "requested that",
            "be checked"
          ],
          "why": "request가 요구를 나타내므로 that절에 (should) 동사원형을 씁니다. 청구서는 확인을 받는 대상이라 수동 원형 be checked입니다.",
          "topicId": "vv-help-mandative",
          "exampleKind": "authored_learning"
        },
        {
          "en": "We had a technician inspect the lift and had the emergency lights replaced.",
          "ko": "우리는 기술자에게 승강기를 점검하게 하고 비상등 교체를 맡겼습니다.",
          "focus": [
            "had a technician inspect",
            "had the emergency lights replaced"
          ],
          "why": "기술자는 점검하는 수행자라 원형 inspect, 비상등은 교체되는 대상이라 p.p. replaced입니다.",
          "topicId": "vv-causative",
          "exampleKind": "authored_learning"
        },
        {
          "en": "In order to better serve our members, we have extended our opening hours.",
          "ko": "회원들께 더 나은 서비스를 제공하기 위해 운영 시간을 연장했습니다.",
          "focus": [
            "In order to better serve"
          ],
          "why": "목적을 나타내는 in order to + 동사원형이며, 부사 better가 to와 serve 사이에 놓였습니다.",
          "topicId": "vv-infinitive",
          "exampleKind": "authored_learning"
        },
        {
          "en": "Upon receiving your payment, we will ship the order.",
          "ko": "결제를 받는 즉시 주문 상품을 발송하겠습니다.",
          "focus": [
            "Upon receiving"
          ],
          "why": "전치사 upon 뒤에 동명사 receiving이 오고, receiving이 your payment를 목적어로 가집니다.",
          "topicId": "vv-gerund",
          "exampleKind": "authored_learning"
        },
        {
          "en": "Having reviewed all five bids, the committee selected a local contractor.",
          "ko": "다섯 건의 입찰서를 모두 검토한 후 위원회는 지역 업체를 선정했습니다.",
          "focus": [
            "Having reviewed",
            "the committee"
          ],
          "why": "having reviewed가 검토 완료 후 선정을 분명히 합니다. 일반적인 주어 생략 분사구문에서 검토 주체는 주절 주어 the committee입니다. Reviewing도 문맥에 따라 가능하므로 선후 관계에 having을 무조건 강제하지 않습니다.",
          "topicId": "vv-participle",
          "exampleKind": "authored_learning"
        }
      ],
      "practice": [
        {
          "id": "vv-06",
          "stem": "The updated checklist helps technicians _____ small leaks during routine inspections.",
          "choices": [
            "detecting",
            "detected",
            "detects",
            "detect"
          ],
          "answer": 3,
          "reason": "help+목적어+동사원형 결합입니다. to detect도 가능하지만 이 문항 보기에는 없습니다.",
          "translation": "개정된 점검표는 기술자들이 정기 점검 중 작은 누수를 찾아내도록 돕습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "detecting",
              "correct": false,
              "explanation": "detecting은 -ing형입니다. 이 뜻의 help O 뒤에는 원형 또는 to부정사를 씁니다."
            },
            {
              "label": "B",
              "text": "detected",
              "correct": false,
              "explanation": "detected는 과거분사로, 기술자가 누수를 찾아내는 능동 동작을 연결하지 못합니다."
            },
            {
              "label": "C",
              "text": "detects",
              "correct": false,
              "explanation": "detects는 3인칭 단수 현재형으로 help O 뒤 동사원형 자리에 맞지 않습니다."
            },
            {
              "label": "D",
              "text": "detect",
              "correct": true,
              "explanation": "detect는 찾아내다는 동사원형으로 helps technicians detect 구조를 완성합니다."
            }
          ],
          "reviewPoint": "help O do와 help O to do는 모두 가능합니다.",
          "topicId": "vv-help-mandative"
        },
        {
          "id": "vv-07",
          "stem": "The safety inspector recommended that the old wiring _____ before the store reopens.",
          "choices": [
            "be replaced",
            "replace",
            "replacing",
            "to be replaced"
          ],
          "answer": 0,
          "reason": "recommend가 '~해야 한다'는 권고이므로 that절에 (should) 원형을 쓰고, 배선은 교체되는 대상이므로 수동 원형 be replaced입니다.",
          "translation": "안전 점검관은 매장이 다시 문을 열기 전에 낡은 배선을 교체해야 한다고 권고했습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "be replaced",
              "correct": true,
              "explanation": "수동 원형. 권고의 that절에서 (should) be replaced로 배선이 교체되어야 함을 나타냅니다."
            },
            {
              "label": "B",
              "text": "replace",
              "correct": false,
              "explanation": "능동 원형. 배선이 무언가를 교체한다는 뜻이 되고, replace 뒤에 목적어도 없습니다."
            },
            {
              "label": "C",
              "text": "replacing",
              "correct": false,
              "explanation": "-ing형. that절에는 주어 뒤 동사가 필요한데 -ing는 혼자 동사가 되지 못합니다."
            },
            {
              "label": "D",
              "text": "to be replaced",
              "correct": false,
              "explanation": "to부정사. that절의 주어 the old wiring 뒤에 동사 역할을 할 형태가 필요합니다."
            }
          ],
          "reviewPoint": "요구·제안·권고 that절 = (should) 원형. 주어가 동작을 받으면 be + p.p.를 쓰세요.",
          "topicId": "vv-help-mandative"
        },
        {
          "id": "vv-08",
          "stem": "All tenants are expected to _____ the new recycling rules starting next month.",
          "choices": [
            "compliance with",
            "comply with",
            "comply",
            "complying"
          ],
          "answer": 1,
          "reason": "to 뒤에 동사원형이 필요하고, comply는 목적어 앞에 with가 있어야 하므로 comply with입니다.",
          "translation": "모든 입주자는 다음 달부터 새로운 재활용 규정을 준수해야 합니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "compliance with",
              "correct": false,
              "explanation": "명사구·준수. to 뒤에 동사원형이 필요한 자리여서 명사는 맞지 않습니다."
            },
            {
              "label": "B",
              "text": "comply with",
              "correct": true,
              "explanation": "자동사 + 전치사·~을 준수하다. to comply with the rules가 완성됩니다."
            },
            {
              "label": "C",
              "text": "comply",
              "correct": false,
              "explanation": "자동사 comply는 바로 목적어를 받지 못하므로 the new recycling rules가 연결되지 않습니다."
            },
            {
              "label": "D",
              "text": "complying",
              "correct": false,
              "explanation": "-ing형. be expected to 뒤의 to는 부정사 표지이므로 원형이 와야 합니다."
            }
          ],
          "reviewPoint": "comply with / respond to / depend on: 전치사까지 한 덩어리로 기억하세요.",
          "topicId": "vv-transitivity"
        },
        {
          "id": "vv-09",
          "stem": "The hotel had its reception area _____ by a local designer before the tourist season began.",
          "choices": [
            "to redesign",
            "redesigns",
            "redesigned",
            "redesign"
          ],
          "answer": 2,
          "reason": "reception area는 디자이너에 의해 새로 설계되는 대상이므로 have O p.p.인 redesigned입니다.",
          "translation": "그 호텔은 관광철이 시작되기 전에 지역 디자이너에게 접수 공간 재설계를 맡겼습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "to redesign",
              "correct": false,
              "explanation": "to redesign은 to부정사로 이 have O p.p. 서비스 의뢰 구조를 완성하지 못합니다."
            },
            {
              "label": "B",
              "text": "redesigns",
              "correct": false,
              "explanation": "redesigns는 현재시제 동사형으로 had의 목적어 뒤 보어 자리에 놓지 않습니다."
            },
            {
              "label": "C",
              "text": "redesigned",
              "correct": true,
              "explanation": "redesigned는 재설계된이라는 과거분사로 reception area가 동작을 받는 관계를 나타냅니다."
            },
            {
              "label": "D",
              "text": "redesign",
              "correct": false,
              "explanation": "redesign은 원형입니다. have O do라면 reception area가 설계를 하는 주체가 되어 문맥과 맞지 않습니다."
            }
          ],
          "reviewPoint": "have O do/done은 O와 동작 사이의 능동·수동 관계로 결정합니다.",
          "topicId": "vv-causative"
        },
        {
          "id": "c4-1",
          "stem": "_____ customer inquiries promptly helps the support team maintain a good reputation.",
          "choices": [
            "Handled",
            "Handling",
            "Handles",
            "Handle"
          ],
          "answer": 1,
          "reason": "Handling customer inquiries promptly라는 동명사구 전체가 helps의 주어입니다.",
          "translation": "고객 문의를 신속하게 처리하면 지원팀이 좋은 평판을 유지하는 데 도움이 됩니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "Handled",
              "correct": false,
              "explanation": "과거형/과거분사. 문의를 처리하는 활동을 주어로 만들지 못합니다. handled가 inquiries를 수식하는 명사구로 읽혀도 복수 inquiries와 helps의 수가 맞지 않습니다."
            },
            {
              "label": "B",
              "text": "Handling",
              "correct": true,
              "explanation": "동명사·처리하는 것. customer inquiries를 목적어로 받고 promptly의 수식을 받는 구 전체가 단수 동사 helps의 주어입니다."
            },
            {
              "label": "C",
              "text": "Handles",
              "correct": false,
              "explanation": "3인칭 단수 현재 동사. 시제 동사 handles 자체를 helps의 주어로 놓을 수 없습니다."
            },
            {
              "label": "D",
              "text": "Handle",
              "correct": false,
              "explanation": "동사원형. 이 일반 서술문에서는 원형 handle을 동명사처럼 주어로 쓰지 않습니다."
            }
          ],
          "reviewPoint": "동명사구 전체의 역할을 찾고, 내부 목적어·부사와 본동사를 구분하세요.",
          "topicId": "vv-gerund"
        },
        {
          "id": "c4-2",
          "stem": "The company postponed _____ the workshop until the new equipment arrived.",
          "choices": [
            "hold",
            "held",
            "holding",
            "to hold"
          ],
          "answer": 2,
          "reason": "다른 동작을 직접 목적어로 연결하는 postpone + -ing 결합이므로 holding입니다.",
          "translation": "회사는 새 장비가 도착할 때까지 워크숍 개최를 연기했습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "hold",
              "correct": false,
              "explanation": "동사원형·개최하다. postpone 뒤 다른 동작을 직접 목적어로 이을 때 원형을 쓰지 않습니다."
            },
            {
              "label": "B",
              "text": "held",
              "correct": false,
              "explanation": "hold의 과거형/과거분사. postpone의 동작 목적어 자리를 만들지 못합니다."
            },
            {
              "label": "C",
              "text": "holding",
              "correct": true,
              "explanation": "동명사·개최하는 것. postponed holding the workshop이라는 결합에 맞습니다."
            },
            {
              "label": "D",
              "text": "to hold",
              "correct": false,
              "explanation": "to부정사·개최하다. 이 의미의 postpone은 동작 목적어로 to hold가 아닌 holding을 받습니다."
            }
          ],
          "reviewPoint": "postpone holding / consider changing / finish reviewing처럼 앞 동사와 결합을 함께 익히세요.",
          "topicId": "vv-gerund"
        },
        {
          "id": "c4-3",
          "stem": "We look forward to _____ your representatives at the trade fair.",
          "choices": [
            "meet",
            "met",
            "meets",
            "meeting"
          ],
          "answer": 3,
          "reason": "look forward to의 to는 전치사이므로 동명사 meeting이 옵니다.",
          "translation": "무역 박람회에서 귀사 대표들을 만나기를 기대합니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "meet",
              "correct": false,
              "explanation": "동사원형·만나다. 이 표현의 to는 부정사 표지가 아닌 전치사여서 원형이 아닙니다."
            },
            {
              "label": "B",
              "text": "met",
              "correct": false,
              "explanation": "meet의 과거형/과거분사. 전치사 뒤에서 만나는 활동을 나타내는 형태가 아닙니다."
            },
            {
              "label": "C",
              "text": "meets",
              "correct": false,
              "explanation": "3인칭 단수 현재 동사. 전치사 뒤에 주어 없이 시제 동사를 놓을 수 없습니다."
            },
            {
              "label": "D",
              "text": "meeting",
              "correct": true,
              "explanation": "동명사·만나는 것. 전치사 to 뒤에 오고 your representatives를 목적어로 받습니다."
            }
          ],
          "reviewPoint": "look forward to meeting / plan to meet: 두 to의 역할을 구분하세요.",
          "topicId": "vv-gerund"
        },
        {
          "id": "c4-4",
          "stem": "Most speakers dislike _____ by unrelated questions during a presentation.",
          "choices": [
            "being interrupted",
            "been interrupted",
            "be interrupted",
            "was interrupted"
          ],
          "answer": 0,
          "reason": "발표자가 질문에 의해 방해받는 수동 관계이므로 being interrupted입니다.",
          "translation": "대부분의 발표자는 발표 중 무관한 질문으로 방해받는 것을 싫어합니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "being interrupted",
              "correct": true,
              "explanation": "수동 동명사·방해받는 것. dislike의 동작 목적어이며 by 이하가 방해의 원인을 나타냅니다."
            },
            {
              "label": "B",
              "text": "been interrupted",
              "correct": false,
              "explanation": "been은 be의 과거분사. 이 자리에 동명사구를 만들지 못하며 been 단독으로 수동 동사를 완성하지 못합니다."
            },
            {
              "label": "C",
              "text": "be interrupted",
              "correct": false,
              "explanation": "be는 원형. dislike 뒤의 동작 목적어에 원형 be를 바로 쓰지 않습니다."
            },
            {
              "label": "D",
              "text": "was interrupted",
              "correct": false,
              "explanation": "was interrupted는 과거 시제 수동 동사. 이를 절로 이끌 주어·접속사가 없으므로 맞지 않습니다."
            }
          ],
          "reviewPoint": "동명사도 수동이 필요하면 being + p.p.로 표현합니다.",
          "topicId": "vv-gerund"
        },
        {
          "id": "c4-5",
          "stem": "Please remember _____ the signed contract to the client before you leave; it is still on your desk.",
          "choices": [
            "sending",
            "sent",
            "to send",
            "sends"
          ],
          "answer": 2,
          "reason": "아직 해야 할 발송을 잊지 말라는 지시이므로 remember to send입니다.",
          "translation": "퇴근하기 전에 서명된 계약서를 고객에게 보내는 것을 잊지 마세요. 계약서는 아직 책상 위에 있습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "sending",
              "correct": false,
              "explanation": "동명사·보낸 것을 기억하다. 이미 한 행동의 기억인데, 계약서가 아직 책상 위에 있어 앞으로 보내야 하는 문맥과 맞지 않습니다."
            },
            {
              "label": "B",
              "text": "sent",
              "correct": false,
              "explanation": "과거형/과거분사. remember 뒤에 이 형태만으로 동작 목적어를 만들지 않습니다."
            },
            {
              "label": "C",
              "text": "to send",
              "correct": true,
              "explanation": "to부정사·보낼 것을 잊지 않다. 아직 발송 전이므로 앞으로 할 일을 챙기는 remember to send입니다."
            },
            {
              "label": "D",
              "text": "sends",
              "correct": false,
              "explanation": "3인칭 단수 현재 동사. remember 뒤에 주어 없는 시제 동사를 직접 붙일 수 없습니다."
            }
          ],
          "reviewPoint": "remember sending은 과거 행동의 기억, remember to send는 해야 할 일 챙기기입니다.",
          "topicId": "vv-gerund"
        },
        {
          "id": "vv-10",
          "stem": "_____ by the city council last month, the new parking rules take effect on Monday. Drivers should check the posted signs carefully.",
          "choices": [
            "Approved",
            "Approving",
            "Having approved",
            "Approve"
          ],
          "answer": 0,
          "reason": "분사구문의 생략된 주어는 주절 주어 the new parking rules이고, 규정은 시의회에 의해 승인된 대상이므로 수동 과거분사 Approved입니다.",
          "translation": "지난달 시의회에서 승인된 새 주차 규정이 월요일부터 시행됩니다. 운전자는 게시된 표지판을 잘 확인해야 합니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "Approved",
              "correct": true,
              "explanation": "과거분사·승인된. 규정이 승인을 받은 쪽이고 by the city council이 행위자를 밝힙니다."
            },
            {
              "label": "B",
              "text": "Approving",
              "correct": false,
              "explanation": "현재분사·승인하는. 규정이 무언가를 승인한다는 능동 의미가 되어 by 이하와도 맞지 않습니다."
            },
            {
              "label": "C",
              "text": "Having approved",
              "correct": false,
              "explanation": "완료 능동 분사·승인한 후. 먼저 일어난 일은 맞지만, 규정이 승인을 '한' 주체가 되어 능동·수동이 틀립니다."
            },
            {
              "label": "D",
              "text": "Approve",
              "correct": false,
              "explanation": "동사원형. 명령문처럼 보이지만 뒤에 쉼표와 다른 주절이 이어지므로 문장 구조가 성립하지 않습니다."
            }
          ],
          "reviewPoint": "문두 분사구문: 주절 주어를 찾아 그 주어가 동작을 하는지(-ing) 받는지(p.p.) 판단하세요.",
          "topicId": "vv-participle"
        }
      ],
      "sources": [
        "infinitives",
        "ingverbs",
        "make",
        "forward",
        "accustomed",
        "zim-2026",
        "chula-2024"
      ],
      "priorityPolicy": "사용자 원오답·확인된 채점 오답 → 단어장 → 최근 교육자료·기본문법. 보기 출현을 선택한 오답으로 추정하지 않음.",
      "recentTypeSupport": [
        "to부정사·동명사·분사",
        "제안·요구 that절"
      ]
    },
    {
      "id": "agreement-voice-tense",
      "title": "Chapter 6 · 수·태·시제",
      "lead": "동사 빈칸은 ① 주어의 수 ② 능동·수동 ③ 시간 관계를 차례로 확인합니다. 시간 단어 하나가 아니라 문장·앞뒤 문장 전체의 시간을 보세요.",
      "topics": [
        {
          "id": "avt-agreement",
          "title": "주어-동사 수 일치",
          "concept": "동사의 수는 주어의 핵심 명사가 정합니다. 전치사구·관계절 같은 수식어는 건너뜁니다. a number of + 복수명사는 복수 동사, the number of는 단수 동사입니다. a range/variety/series of는 머리명사나 의미에 따라 단수·복수 모두 보이므로 '항상 복수'로 외우지 않습니다.",
          "examType": "긴 주어 뒤 동사 수 / each of · the number of",
          "memory": [
            {
              "pattern": "a set of luggage",
              "meaning": "핵심 주어 set에 맞추기",
              "note": "사용자 단어장; luggage는 불가산",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장; luggage는 불가산"
            },
            {
              "pattern": "Each of the + 복수명사 + 단수동사",
              "meaning": "~ 각각은",
              "note": "Each of the laptops comes ..."
            },
            {
              "pattern": "A number of + 복수명사 + 복수동사",
              "meaning": "많은 ~",
              "note": "A number of staff have ..."
            },
            {
              "pattern": "The number of + 복수명사 + 단수동사",
              "meaning": "~의 수",
              "note": "The number of orders has ..."
            },
            {
              "pattern": "동명사구 주어 + 단수동사",
              "meaning": "~하는 것은",
              "note": "Chapter 1 연결"
            },
            {
              "pattern": "핵심 주어 + 동사",
              "meaning": "수식어를 빼고 수 확인",
              "note": "a set of luggage는 set 기준",
              "basis": "general_grammar"
            },
            {
              "pattern": "each + 단수명사",
              "meaning": "단수 동사",
              "note": "각각",
              "basis": "general_grammar"
            },
            {
              "pattern": "every + 단수명사",
              "meaning": "단수 동사",
              "note": "모든",
              "basis": "general_grammar"
            },
            {
              "pattern": "everyone",
              "meaning": "단수 동사",
              "note": "모든 사람",
              "basis": "general_grammar"
            },
            {
              "pattern": "someone",
              "meaning": "단수 동사",
              "note": "누군가",
              "basis": "general_grammar"
            },
            {
              "pattern": "anyone",
              "meaning": "단수 동사",
              "note": "누구든지",
              "basis": "general_grammar"
            },
            {
              "pattern": "nobody",
              "meaning": "단수 동사",
              "note": "아무도 ~않는",
              "basis": "general_grammar"
            },
            {
              "pattern": "one of + 복수명사",
              "meaning": "단수 동사",
              "note": "one이 핵심",
              "basis": "general_grammar"
            },
            {
              "pattern": "both A and B",
              "meaning": "복수 동사 기본",
              "note": "두 대상을 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "either A or B",
              "meaning": "가까운 주어에 일치",
              "note": "사람·수 확인",
              "basis": "general_grammar"
            },
            {
              "pattern": "neither A nor B",
              "meaning": "가까운 주어에 일치",
              "note": "사람·수 확인",
              "basis": "general_grammar"
            },
            {
              "pattern": "not only A but also B",
              "meaning": "가까운 주어에 일치",
              "note": "사람·수 확인",
              "basis": "general_grammar"
            },
            {
              "pattern": "A as well as B",
              "meaning": "A에 일치",
              "note": "부가 요소 B",
              "basis": "general_grammar"
            },
            {
              "pattern": "A along with B",
              "meaning": "A에 일치",
              "note": "부가 요소 B",
              "basis": "general_grammar"
            },
            {
              "pattern": "A together with B",
              "meaning": "A에 일치",
              "note": "부가 요소 B",
              "basis": "general_grammar"
            },
            {
              "pattern": "some of + N",
              "meaning": "뒤 명사·지시 대상에 일치",
              "note": "복수·불가산 구별",
              "basis": "general_grammar"
            },
            {
              "pattern": "most of + N",
              "meaning": "뒤 명사·지시 대상에 일치",
              "note": "복수·불가산 구별",
              "basis": "general_grammar"
            },
            {
              "pattern": "half of + N",
              "meaning": "뒤 명사·지시 대상에 일치",
              "note": "복수·불가산 구별",
              "basis": "general_grammar"
            },
            {
              "pattern": "the rest of + N",
              "meaning": "뒤 명사·지시 대상에 일치",
              "note": "복수·불가산 구별",
              "basis": "general_grammar"
            },
            {
              "pattern": "명사절 주어",
              "meaning": "단수 동사 기본",
              "note": "하나의 절을 주어로",
              "basis": "general_grammar"
            },
            {
              "pattern": "불가산명사 주어",
              "meaning": "단수 동사",
              "note": "information is",
              "basis": "general_grammar"
            },
            {
              "pattern": "none of + N",
              "meaning": "대상·문맥에 따라 단복수",
              "note": "모두 단수라고 단정하지 않기",
              "basis": "general_grammar"
            },
            {
              "pattern": "neither of + 복수명사",
              "meaning": "격식에서는 단수 기본",
              "note": "실제 사용에서는 복수도 나타남",
              "basis": "general_grammar"
            }
          ]
        },
        {
          "id": "avt-tense-basic",
          "title": "현재 · 과거 · 미래 · 진행",
          "concept": "현재 시제는 반복·일정·사실, 과거는 끝난 시점, 진행은 진행 중이거나 예정된 일을 나타냅니다. 이미 정해진 가까운 미래 일정은 현재진행형으로도 씁니다. now, recently 같은 단어 하나로 시제를 확정하지 마세요.",
          "examType": "앞 문장의 시점을 근거로 시제 고르기 (2~3문장 문맥)",
          "memory": [
            {
              "pattern": "yesterday / last week / in 2019 / ago",
              "meaning": "끝난 과거 시점",
              "note": "→ 과거 시제"
            },
            {
              "pattern": "be + -ing + 미래 시점",
              "meaning": "예정된 일정",
              "note": "He is visiting the office tomorrow."
            },
            {
              "pattern": "recently",
              "meaning": "최근에",
              "note": "과거·현재완료 모두 가능"
            },
            {
              "pattern": "현재 V·Vs",
              "meaning": "습관·일반 사실·현재 상태",
              "note": "주어 수 확인",
              "basis": "general_grammar"
            },
            {
              "pattern": "과거 V-ed",
              "meaning": "끝난 과거",
              "note": "동사의 불규칙형 확인",
              "basis": "general_grammar"
            },
            {
              "pattern": "현재진행 am·is·are V-ing",
              "meaning": "지금 진행·확정 미래 계획",
              "note": "문맥 확인",
              "basis": "general_grammar"
            },
            {
              "pattern": "과거진행 was·were V-ing",
              "meaning": "과거 시점 진행",
              "note": "당시 진행 중",
              "basis": "general_grammar"
            },
            {
              "pattern": "현재수동 am·is·are p.p.",
              "meaning": "현재의 수동",
              "note": "be 수일치",
              "basis": "general_grammar"
            },
            {
              "pattern": "과거수동 was·were p.p.",
              "meaning": "과거의 수동",
              "note": "be 수일치",
              "basis": "general_grammar"
            },
            {
              "pattern": "미래수동 will be p.p.",
              "meaning": "앞으로 ~될",
              "note": "will 뒤 원형",
              "basis": "general_grammar"
            },
            {
              "pattern": "진행수동 be being p.p.",
              "meaning": "~되고 있는",
              "note": "진행 시점에 맞는 be",
              "basis": "general_grammar"
            },
            {
              "pattern": "상태동사 기본 의미",
              "meaning": "know·believe·own·belong 등",
              "note": "보통 진행형 피함; 다른 동적 의미는 별개",
              "basis": "general_grammar"
            }
          ]
        },
        {
          "id": "avt-perfect",
          "title": "현재완료 · 과거완료 · 미래완료",
          "concept": "since + 과거 시점, for/over the past + 기간은 현재까지 이어지는 현재완료와 잘 어울립니다. 과거완료는 과거 기준 시점보다 앞선 일을 밝혀야 할 때 쓰며, before/after로 순서가 분명하면 과거 시제로도 충분합니다. 미래완료는 by + 미래 시점까지 완료될 일입니다.",
          "examType": "since/for/over the past + 현재완료 / By the time + 현재, 미래완료",
          "memory": [
            {
              "pattern": "would have p.p.",
              "meaning": "과거의 가정 결과 등 문맥 확인",
              "note": "사용자 단어장; 일반 현재완료와 구별",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장; 일반 현재완료와 구별"
            },
            {
              "pattern": "since + 과거 시점 / for + 기간",
              "meaning": "~이후로 / ~동안",
              "note": "has managed since 2019"
            },
            {
              "pattern": "over the past + 기간",
              "meaning": "지난 ~ 동안",
              "note": "have risen over the past year"
            },
            {
              "pattern": "had p.p.",
              "meaning": "과거 기준보다 먼저",
              "note": "필요할 때 쓰는 것, 의무 아님"
            },
            {
              "pattern": "By the time/By + 미래, will have p.p.",
              "meaning": "~때까지 완료",
              "note": "미래완료"
            },
            {
              "pattern": "have·has p.p.",
              "meaning": "현재완료",
              "note": "현재와 연결된 경험·완료·지속",
              "basis": "general_grammar"
            },
            {
              "pattern": "will have p.p.",
              "meaning": "미래완료",
              "note": "미래 기준 시점까지 완료",
              "basis": "general_grammar"
            },
            {
              "pattern": "have·has been p.p.",
              "meaning": "현재완료 수동",
              "note": "현재와 연결된 수동",
              "basis": "general_grammar"
            },
            {
              "pattern": "had been p.p.",
              "meaning": "과거완료 수동",
              "note": "과거 기준보다 앞선 수동",
              "basis": "general_grammar"
            },
            {
              "pattern": "will have been p.p.",
              "meaning": "미래완료 수동",
              "note": "미래 기준까지 완료될 수동",
              "basis": "general_grammar"
            },
            {
              "pattern": "for + 기간",
              "meaning": "기간의 길이",
              "note": "현재완료만의 표지는 아님",
              "basis": "general_grammar"
            }
          ]
        },
        {
          "id": "avt-time-clause",
          "title": "시간·조건 부사절의 현재 vs 명사절의 will",
          "concept": "미래를 나타내는 시간·조건 부사절(when/until/as soon as/before/if/unless)에는 보통 현재형을 씁니다. know/ask/wonder의 목적어인 명사절에서는 미래 일을 will로 표현할 수 있습니다. 의지·요청 의미의 will 등은 별도 용법이므로 will을 모든 if절에서 금지하지 않습니다.",
          "examType": "until/as soon as 절 현재 / whether·when 명사절 will",
          "memory": [
            {
              "pattern": "until / as soon as / when + 현재·현재완료",
              "meaning": "부사절 = 미래도 현재형",
              "note": "wait until it arrives / has arrived: 미래 완료도 시간절에서는 현재완료 가능"
            },
            {
              "pattern": "know / ask + whether·when + will",
              "meaning": "명사절 = will 가능",
              "note": "whether he will attend"
            }
          ]
        },
        {
          "id": "avt-voice",
          "title": "능동 vs 수동",
          "concept": "주어가 동작을 하면 능동, 받으면 수동입니다. 빈칸 뒤 목적어 유무가 단서지만, give/send/offer처럼 목적어가 둘인 동사는 수동태 뒤에도 목적어가 남습니다(were given badges). arrive, occur, happen처럼 목적어를 갖지 않는 동사는 수동태가 되지 않습니다. 뒤에 전치사가 있다고 수동인 것도 아닙니다.",
          "examType": "주어와 동사의 의미 관계로 태 결정 / 자동사 수동 함정",
          "memory": [
            {
              "pattern": "be encouraged to V",
              "meaning": "~하도록 장려되다",
              "note": "단어장 확인",
              "basis": "general_grammar",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장"
            },
            {
              "pattern": "S + be given / sent / offered + O",
              "meaning": "~을 받다",
              "note": "수동 뒤에도 목적어"
            },
            {
              "pattern": "arrive · occur · happen · rise",
              "meaning": "자동사",
              "note": "was arrived ✗"
            },
            {
              "pattern": "be kept secure / be considered essential",
              "meaning": "5형식 수동",
              "note": "수동 뒤 보어가 남음"
            },
            {
              "pattern": "V + 전치사 ≠ 수동",
              "meaning": "자동사+전치사도 능동",
              "note": "responded to ..."
            },
            {
              "pattern": "will be + p.p.",
              "meaning": "미래에 ~될 것이다",
              "note": "The documents will be delivered on Friday. 미래 시점과 수동 관계를 함께 판단"
            },
            {
              "pattern": "be expected to V",
              "meaning": "~할 것으로 예상되다",
              "note": "수동 + 부정사",
              "basis": "general_grammar"
            },
            {
              "pattern": "be required to V",
              "meaning": "~하도록 요구되다",
              "note": "수동 + 부정사",
              "basis": "general_grammar"
            },
            {
              "pattern": "be said to V",
              "meaning": "~한다고 한다",
              "note": "보고 수동",
              "basis": "general_grammar"
            },
            {
              "pattern": "be believed to V",
              "meaning": "~한다고 여겨지다",
              "note": "보고 수동",
              "basis": "general_grammar"
            },
            {
              "pattern": "be reported to V",
              "meaning": "~한다고 보고되다",
              "note": "보고 수동",
              "basis": "general_grammar"
            },
            {
              "pattern": "be reported to have p.p.",
              "meaning": "이전에 ~했다고 보고되다",
              "note": "보고 시점보다 앞선 일",
              "basis": "general_grammar"
            },
            {
              "pattern": "be offered + 명사",
              "meaning": "대상이 뒤에 남을 수 있음",
              "note": "4형식 수동",
              "basis": "general_grammar"
            },
            {
              "pattern": "be given + 명사",
              "meaning": "대상이 뒤에 남을 수 있음",
              "note": "4형식 수동",
              "basis": "general_grammar"
            },
            {
              "pattern": "happen",
              "meaning": "발생하다 · 자동사",
              "note": "기본 용법 수동 불가",
              "basis": "general_grammar"
            },
            {
              "pattern": "remain",
              "meaning": "남다·상태 유지 · 자동사",
              "note": "기본 용법 수동 불가",
              "basis": "general_grammar"
            },
            {
              "pattern": "lie–lay–lain",
              "meaning": "눕다·놓여 있다 · 자동사",
              "note": "lie의 다른 뜻 거짓말하다와 구별",
              "basis": "general_grammar"
            },
            {
              "pattern": "lay–laid–laid",
              "meaning": "~을 놓다 · 타동사",
              "note": "목적어 필요",
              "basis": "general_grammar"
            }
          ]
        }
      ],
      "examples": [
        {
          "en": "A number of applicants have asked about the deadline, but the number of seats is limited.",
          "ko": "많은 지원자가 마감일을 문의했지만, 좌석 수는 한정되어 있습니다.",
          "focus": [
            "A number of applicants have",
            "the number of seats is"
          ],
          "why": "a number of는 '많은'이라 복수 applicants에 맞춰 have, the number of는 '수' 자체가 주어라 단수 is입니다.",
          "topicId": "avt-agreement",
          "exampleKind": "authored_learning"
        },
        {
          "en": "Online sales have risen steadily over the past three years.",
          "ko": "온라인 매출은 지난 3년 동안 꾸준히 증가해 왔습니다.",
          "focus": [
            "have risen",
            "over the past three years"
          ],
          "why": "over the past + 기간은 과거부터 현재까지 이어진 변화를 나타내므로 현재완료 have risen과 어울립니다.",
          "topicId": "avt-perfect",
          "exampleKind": "authored_learning"
        },
        {
          "en": "We will start the meeting as soon as everyone arrives.",
          "ko": "모두가 도착하는 대로 회의를 시작하겠습니다.",
          "focus": [
            "as soon as everyone arrives"
          ],
          "why": "as soon as가 이끄는 시간 부사절이므로 미래 일이라도 현재 시제 arrives를 씁니다. 주절은 will start입니다.",
          "topicId": "avt-time-clause",
          "exampleKind": "authored_learning"
        },
        {
          "en": "All participants will be given name badges at the entrance next Monday.",
          "ko": "모든 참가자는 다음 주 월요일 입구에서 이름표를 받을 예정입니다.",
          "focus": [
            "will be given name badges"
          ],
          "why": "next Monday의 미래 수동은 will be given입니다. give는 사람과 사물 목적어를 가져 수동 뒤에도 name badges가 남습니다.",
          "topicId": "avt-voice",
          "exampleKind": "authored_learning"
        },
        {
          "en": "The keynote speaker arrived late because her flight had been delayed.",
          "ko": "기조연설자는 항공편이 지연되었기 때문에 늦게 도착했습니다.",
          "focus": [
            "arrived",
            "had been delayed"
          ],
          "why": "arrive는 자동사라 능동 arrived만 가능합니다. 항공편 지연은 도착보다 먼저 일어난 일이고 비행기는 지연을 당한 쪽이라 과거완료 수동 had been delayed입니다.",
          "topicId": "avt-perfect",
          "exampleKind": "authored_learning"
        }
      ],
      "practice": [
        {
          "id": "avt-01",
          "stem": "Each of the new laptops _____ with a two-year warranty and a carrying case.",
          "choices": [
            "comes",
            "come",
            "coming",
            "have come"
          ],
          "answer": 0,
          "reason": "주어의 핵심은 Each(각각)이므로 단수 동사 comes입니다. of the new laptops는 수식어입니다.",
          "translation": "새 노트북은 각각 2년 보증과 휴대용 케이스가 함께 제공됩니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "comes",
              "correct": true,
              "explanation": "3인칭 단수 현재. Each가 주어이므로 단수 동사로 일치합니다."
            },
            {
              "label": "B",
              "text": "come",
              "correct": false,
              "explanation": "복수 현재형. 바로 앞 laptops에 끌려 고르기 쉬운 형태지만 주어는 Each입니다."
            },
            {
              "label": "C",
              "text": "coming",
              "correct": false,
              "explanation": "-ing형. 혼자 본동사가 될 수 없어 문장에 동사가 없게 됩니다."
            },
            {
              "label": "D",
              "text": "have come",
              "correct": false,
              "explanation": "복수 현재완료. 수가 맞지 않고, 제품 구성이라는 일반적 사실에 완료형도 어색합니다."
            }
          ],
          "reviewPoint": "Each of + 복수명사 + 단수동사. of 뒤 명사가 아니라 Each에 일치시키세요.",
          "topicId": "avt-agreement"
        },
        {
          "id": "avt-02",
          "stem": "The number of online orders _____ sharply since the company launched its new website in March.",
          "choices": [
            "were increased",
            "has increased",
            "have increased",
            "increasing"
          ],
          "answer": 1,
          "reason": "주어 The number(수)는 단수이고, since + 과거 시점이 현재까지의 변화를 나타내므로 has increased입니다.",
          "translation": "회사가 3월에 새 웹사이트를 연 이후 온라인 주문 수가 급격히 늘었습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "were increased",
              "correct": false,
              "explanation": "were increased는 복수 과거 수동형으로 단수 주어 The number와 수가 맞지 않습니다. 현재까지의 변화를 말하는 이 문맥의 시제도 다릅니다."
            },
            {
              "label": "B",
              "text": "has increased",
              "correct": true,
              "explanation": "단수 현재완료. The number와 수가 맞고 since 이후 지금까지의 증가를 나타냅니다."
            },
            {
              "label": "C",
              "text": "have increased",
              "correct": false,
              "explanation": "복수 현재완료. 시제는 맞지만 주어 The number는 단수입니다."
            },
            {
              "label": "D",
              "text": "increasing",
              "correct": false,
              "explanation": "-ing형. 본동사가 될 수 없습니다."
            }
          ],
          "reviewPoint": "The number of ~ + 단수동사 / A number of ~ + 복수동사.",
          "topicId": "avt-agreement"
        },
        {
          "id": "avt-03",
          "stem": "Ms. Kwon joined Delta Logistics as a regional coordinator in 2019. Since then, she _____ three new branch offices.",
          "choices": [
            "will open",
            "had opened",
            "has opened",
            "opens"
          ],
          "answer": 2,
          "reason": "Since then(2019년 이후 지금까지)은 과거부터 현재까지 이어진 기간이므로 현재완료 has opened입니다.",
          "translation": "권 씨는 2019년 지역 코디네이터로 델타 물류에 입사했습니다. 그 이후 그녀는 세 개의 새 지점을 열었습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "will open",
              "correct": false,
              "explanation": "미래. since then은 이미 지나온 기간이므로 미래 시제와 맞지 않습니다."
            },
            {
              "label": "B",
              "text": "had opened",
              "correct": false,
              "explanation": "과거완료. 기준이 되는 다른 과거 시점이 없고, since then은 현재까지 이어집니다."
            },
            {
              "label": "C",
              "text": "has opened",
              "correct": true,
              "explanation": "현재완료. 2019년부터 현재까지의 기간에 이룬 성과를 나타냅니다."
            },
            {
              "label": "D",
              "text": "opens",
              "correct": false,
              "explanation": "현재 시제. 습관·일정을 나타낼 뿐, since then이 가리키는 '그때부터 지금까지'의 누적 결과를 표현하지 못합니다."
            }
          ],
          "reviewPoint": "앞 문장의 과거 시점 + Since then → 현재완료. 문장 사이의 시간 연결을 읽으세요.",
          "topicId": "avt-perfect"
        },
        {
          "id": "avt-04",
          "stem": "Please wait in the lobby until your name _____ by the receptionist.",
          "choices": [
            "will be called",
            "calls",
            "called",
            "is called"
          ],
          "answer": 3,
          "reason": "until이 이끄는 시간 부사절이므로 미래 일이라도 현재 시제를 쓰고, 이름은 불리는 대상이라 수동 is called입니다.",
          "translation": "접수 직원이 이름을 부를 때까지 로비에서 기다려 주세요.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "will be called",
              "correct": false,
              "explanation": "미래 수동. 수동은 맞지만 until 부사절에서는 미래를 현재 시제로 나타냅니다."
            },
            {
              "label": "B",
              "text": "calls",
              "correct": false,
              "explanation": "현재 능동. 이름이 누군가를 부른다는 뜻이 되고 by the receptionist와도 맞지 않습니다."
            },
            {
              "label": "C",
              "text": "called",
              "correct": false,
              "explanation": "과거형/과거분사. 앞으로 기다리라는 지시와 과거 시제가 맞지 않고, p.p.만으로는 동사가 되지 않습니다."
            },
            {
              "label": "D",
              "text": "is called",
              "correct": true,
              "explanation": "현재 수동. 시간 부사절의 현재 시제 + 이름이 불리는 수동 관계 모두 맞습니다."
            }
          ],
          "reviewPoint": "시간·조건 부사절 = 현재형으로 미래. 동시에 능동·수동도 확인하세요.",
          "topicId": "avt-time-clause"
        },
        {
          "id": "avt-05",
          "stem": "We do not yet know whether the supplier _____ the remaining parts by Friday.",
          "choices": [
            "will deliver",
            "delivering",
            "to deliver",
            "deliver"
          ],
          "answer": 0,
          "reason": "whether절은 know의 목적어인 명사절이므로 미래 일에 will을 그대로 쓸 수 있습니다. 주어 the supplier 뒤 시제 동사가 필요합니다.",
          "translation": "공급업체가 남은 부품을 금요일까지 배송할지 아직 모릅니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "will deliver",
              "correct": true,
              "explanation": "미래. 명사절 안에서 앞으로 일어날지 모르는 배송을 나타냅니다."
            },
            {
              "label": "B",
              "text": "delivering",
              "correct": false,
              "explanation": "-ing형. whether절의 주어 the supplier 뒤에 시제 동사가 필요합니다."
            },
            {
              "label": "C",
              "text": "to deliver",
              "correct": false,
              "explanation": "to부정사. whether to deliver는 주어 없이 쓰는 구조로, 주어 the supplier가 있는 이 문장과 맞지 않습니다."
            },
            {
              "label": "D",
              "text": "deliver",
              "correct": false,
              "explanation": "원형/복수 현재. 단수 주어 the supplier와 수가 맞지 않습니다."
            }
          ],
          "reviewPoint": "부사절의 '현재로 미래' 규칙을 명사절(know whether/when ...)에 적용하지 마세요.",
          "topicId": "avt-time-clause"
        },
        {
          "id": "avt-06",
          "stem": "By the time the conference opens next Monday, the organizers _____ all 300 name badges.",
          "choices": [
            "are printed",
            "will have printed",
            "have printed",
            "had printed"
          ],
          "answer": 1,
          "reason": "다음 주 월요일(미래 시점)까지 완료될 일이므로 미래완료 will have printed입니다.",
          "translation": "다음 주 월요일 회의가 개막할 때쯤이면 주최 측은 이름표 300개를 모두 인쇄해 두었을 것입니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "are printed",
              "correct": false,
              "explanation": "현재 수동. 주최 측이 인쇄를 하는 쪽이고, 뒤에 목적어 badges도 있어 수동이 맞지 않습니다."
            },
            {
              "label": "B",
              "text": "will have printed",
              "correct": true,
              "explanation": "미래완료. 미래 기준 시점 전에 끝나 있을 일을 나타냅니다."
            },
            {
              "label": "C",
              "text": "have printed",
              "correct": false,
              "explanation": "현재완료. 기준 시점이 현재여서 '다음 주 월요일까지'라는 미래 기준과 맞지 않습니다."
            },
            {
              "label": "D",
              "text": "had printed",
              "correct": false,
              "explanation": "과거완료. 과거 기준 시점에 쓰며, next Monday라는 미래 기준과 충돌합니다."
            }
          ],
          "reviewPoint": "By the time + 현재(미래 의미), S + will have p.p.",
          "topicId": "avt-perfect"
        },
        {
          "id": "avt-07",
          "stem": "Mr. Lee's flight lands in Seoul at 9 a.m. tomorrow. He _____ the Seoul branch in the afternoon and returns on Thursday.",
          "choices": [
            "has visited",
            "was visiting",
            "is visiting",
            "visited"
          ],
          "answer": 2,
          "reason": "내일 일정으로 이미 정해진 방문이므로 예정된 미래를 나타내는 현재진행형 is visiting입니다.",
          "translation": "이 씨의 항공편은 내일 오전 9시에 서울에 도착합니다. 그는 오후에 서울 지점을 방문하고 목요일에 돌아옵니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "has visited",
              "correct": false,
              "explanation": "현재완료. 이미 방문했다는 뜻이 되어 내일 일정과 충돌합니다."
            },
            {
              "label": "B",
              "text": "was visiting",
              "correct": false,
              "explanation": "과거진행. 과거 시점의 진행 중 동작이라 미래 일정과 맞지 않습니다."
            },
            {
              "label": "C",
              "text": "is visiting",
              "correct": true,
              "explanation": "현재진행형(예정). 앞 문장의 tomorrow 일정과 이어지는 확정된 계획을 나타냅니다."
            },
            {
              "label": "D",
              "text": "visited",
              "correct": false,
              "explanation": "과거. 내일 도착한 뒤의 일정이므로 과거 시제가 맞지 않습니다."
            }
          ],
          "reviewPoint": "정해진 가까운 미래 일정은 현재진행형으로도 씁니다. 앞 문장의 시점을 근거로 판단하세요.",
          "topicId": "avt-tense-basic"
        },
        {
          "id": "avt-08",
          "stem": "The shipment of office chairs _____ two days earlier than expected, so the setup began on Tuesday.",
          "choices": [
            "was arrived",
            "has been arrived",
            "arrival",
            "arrived"
          ],
          "answer": 3,
          "reason": "arrive는 목적어를 갖지 않는 자동사라 수동태가 될 수 없습니다. 과거 사건이므로 arrived입니다.",
          "translation": "사무용 의자 배송품이 예상보다 이틀 일찍 도착해서 화요일에 설치가 시작되었습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "was arrived",
              "correct": false,
              "explanation": "수동형. arrive는 자동사라 be arrived 형태를 쓰지 않습니다."
            },
            {
              "label": "B",
              "text": "has been arrived",
              "correct": false,
              "explanation": "has been arrived는 현재완료 수동 형태입니다. 여기서 도착하다라는 자동사 arrive에는 수동태를 만들지 않습니다."
            },
            {
              "label": "C",
              "text": "arrival",
              "correct": false,
              "explanation": "명사·도착. 문장에 본동사가 없게 됩니다."
            },
            {
              "label": "D",
              "text": "arrived",
              "correct": true,
              "explanation": "자동사 과거형. 배송품이 도착했다는 능동이며 began과 시제도 맞습니다."
            }
          ],
          "reviewPoint": "arrive · occur · happen · rise는 수동 불가. 주어가 사물이라고 수동을 고르지 마세요.",
          "topicId": "avt-voice"
        },
        {
          "id": "avt-09",
          "stem": "On their first day, all new hires _____ a copy of the employee handbook by the human resources team.",
          "choices": [
            "are given",
            "give",
            "are giving",
            "have given"
          ],
          "answer": 0,
          "reason": "신입 직원은 인사팀으로부터 안내서를 받는 쪽이므로 수동태 are given이며, give는 수동 뒤에도 목적어(a copy)가 남습니다.",
          "translation": "입사 첫날 모든 신입 직원은 인사팀으로부터 직원 안내서 한 부를 받습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "are given",
              "correct": true,
              "explanation": "현재 수동. 직원이 안내서를 받는 관계이고, by the human resources team이 주는 쪽을 밝힙니다."
            },
            {
              "label": "B",
              "text": "give",
              "correct": false,
              "explanation": "현재 능동. 신입 직원이 안내서를 나눠 준다는 뜻이 되어 by 이하와 충돌합니다."
            },
            {
              "label": "C",
              "text": "are giving",
              "correct": false,
              "explanation": "are giving은 능동 진행형으로, 신입 직원이 안내서를 주는 쪽이 됩니다. 인사팀에게 받는 관계와 다릅니다."
            },
            {
              "label": "D",
              "text": "have given",
              "correct": false,
              "explanation": "현재완료 능동. 직원이 주는 쪽이 되며 by + 행위자와 함께 쓸 수 없습니다."
            }
          ],
          "reviewPoint": "빈칸 뒤 목적어가 있어도 수동일 수 있습니다(give/send/offer). 주어가 받는 쪽인지 확인하세요.",
          "topicId": "avt-voice"
        },
        {
          "id": "avt-10",
          "stem": "The conference room on the third floor _____ last week. It now has new chairs, brighter lighting, and a larger screen.",
          "choices": [
            "was renovating",
            "was renovated",
            "renovated",
            "has renovated"
          ],
          "answer": 1,
          "reason": "회의실은 보수 공사를 받은 대상이고 last week는 끝난 과거 시점이므로 과거 수동 was renovated입니다. 다음 문장이 공사 결과를 보여 줍니다.",
          "translation": "3층 회의실은 지난주에 보수되었습니다. 이제 새 의자와 더 밝은 조명, 더 큰 스크린이 있습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "was renovating",
              "correct": false,
              "explanation": "과거진행 능동. 회의실이 보수 작업을 하고 있었다는 뜻이 됩니다."
            },
            {
              "label": "B",
              "text": "was renovated",
              "correct": true,
              "explanation": "과거 수동. 회의실이 보수를 받은 관계와 last week 시점이 모두 맞습니다."
            },
            {
              "label": "C",
              "text": "renovated",
              "correct": false,
              "explanation": "과거 능동. 회의실이 무언가를 보수했다는 뜻이 되고 renovate의 목적어도 없습니다."
            },
            {
              "label": "D",
              "text": "has renovated",
              "correct": false,
              "explanation": "현재완료 능동. 능동이 틀리고 last week 같은 끝난 시점과 현재완료는 함께 쓰지 않습니다."
            }
          ],
          "reviewPoint": "태(받는 쪽 → 수동)와 시제(last week → 과거)를 따로 확인한 뒤 둘 다 맞는 보기를 고르세요.",
          "topicId": "avt-voice"
        }
      ],
      "sources": [
        "passive",
        "presentperfect",
        "pastperfect",
        "zim-2026",
        "chula-2024"
      ],
      "priorityPolicy": "사용자 원오답·확인된 채점 오답 → 단어장 → 최근 교육자료·기본문법. 보기 출현을 선택한 오답으로 추정하지 않음.",
      "recentTypeSupport": [
        "주어·동사 수일치",
        "수동태·시제"
      ]
    },
    {
      "id": "clauses-connectors",
      "title": "Chapter 7 · 관계사·접속사·전치사",
      "lead": "관계사는 앞말을 설명하는 절을, 접속사는 절과 절의 관계를 만듭니다. 이 단원에서는 절을 잇는 접속사와 명사구 앞 전치사의 구조를 구별합니다.",
      "topics": [
        {
          "id": "cc-conj-prep",
          "title": "접속사 vs 전치사: 원인 · 양보 · 시간 · 조건 · 목적",
          "concept": "뒤가 절(S + V)인지 명사구인지 먼저 구별해요.\n접속부사는 문장 사이 뜻을 잇고, 독립절 연결에는 구두점이 필요해요.",
          "examType": "뒤 구조(절/명사구) + 의미 관계로 연결어 고르기",
          "contrastGroups": [
            {
              "meaning": "양보 · 대조",
              "left": [
                {
                  "expression": "although",
                  "meaning": "비록 ~이지만",
                  "sourceIds": [
                    "null"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction"
                },
                {
                  "expression": "though",
                  "meaning": "~이지만",
                  "sourceIds": [
                    "null"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction"
                },
                {
                  "expression": "even though",
                  "meaning": "~임에도 불구하고",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "conjunction"
                },
                {
                  "expression": "while",
                  "meaning": "~인 반면",
                  "sourceIds": [
                    "null",
                    "x420"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction",
                  "multi": "시간·대조; 축약절 가능"
                },
                {
                  "expression": "whereas",
                  "meaning": "~인 반면",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "conjunction"
                },
                {
                  "expression": "even if",
                  "meaning": "설령 ~해도",
                  "sourceIds": [
                    "hack24"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction"
                }
              ],
              "right": [
                {
                  "expression": "despite",
                  "meaning": "~에도 불구하고",
                  "sourceIds": [
                    "hack25",
                    "null"
                  ],
                  "basis": "recent_material",
                  "role": "preposition",
                  "priorityBasis": "reported_wrong",
                  "priorityEvidence": "2회 흰둥이113 원오답 표시",
                  "priority": 1
                },
                {
                  "expression": "in spite of",
                  "meaning": "~에도 불구하고",
                  "sourceIds": [
                    "null"
                  ],
                  "basis": "recent_material",
                  "role": "preposition"
                },
                {
                  "expression": "contrary to",
                  "meaning": "~와 반대로",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "in contrast to",
                  "meaning": "~와 대조적으로",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "in contrast with",
                  "meaning": "~와 대조적으로",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                }
              ],
              "adverbs": [
                {
                  "expression": "however",
                  "meaning": "그러나",
                  "sourceIds": [
                    "x436"
                  ],
                  "basis": "recent_material",
                  "role": "adverb"
                },
                {
                  "expression": "nevertheless",
                  "meaning": "그럼에도 불구하고",
                  "sourceIds": [
                    "x436"
                  ],
                  "basis": "recent_material",
                  "role": "adverb"
                },
                {
                  "expression": "nonetheless",
                  "meaning": "그럼에도 불구하고",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                },
                {
                  "expression": "even so",
                  "meaning": "그렇다 해도",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                },
                {
                  "expression": "in contrast",
                  "meaning": "대조적으로",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                },
                {
                  "expression": "on the other hand",
                  "meaning": "다른 한편으로",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                },
                {
                  "expression": "on the contrary",
                  "meaning": "오히려 그 반대로",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                }
              ]
            },
            {
              "meaning": "시간 · 순서",
              "left": [
                {
                  "expression": "before",
                  "meaning": "~하기 전에",
                  "sourceIds": [
                    "dok",
                    "null"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction",
                  "multi": "절·명사구 모두 가능"
                },
                {
                  "expression": "after",
                  "meaning": "~한 후에",
                  "sourceIds": [
                    "x406"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction",
                  "multi": "절·명사구 모두 가능"
                },
                {
                  "expression": "when",
                  "meaning": "~할 때",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "conjunction"
                },
                {
                  "expression": "while",
                  "meaning": "~하는 동안",
                  "sourceIds": [
                    "null",
                    "x420"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction",
                  "multi": "시간·대조; 축약절 가능"
                },
                {
                  "expression": "since",
                  "meaning": "~한 이래로",
                  "sourceIds": [
                    "dok"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction",
                  "multi": "절: 이유·시간; 명사구: 시간"
                },
                {
                  "expression": "until",
                  "meaning": "~할 때까지",
                  "sourceIds": [
                    "hack25"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction",
                  "multi": "절·명사구 모두 가능"
                },
                {
                  "expression": "once",
                  "meaning": "일단 ~하면",
                  "sourceIds": [
                    "dok",
                    "hack25"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction"
                },
                {
                  "expression": "as soon as",
                  "meaning": "~하자마자",
                  "sourceIds": [
                    "dok"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction"
                },
                {
                  "expression": "by the time",
                  "meaning": "~할 무렵까지",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "conjunction"
                },
                {
                  "expression": "as",
                  "meaning": "~하는 동안",
                  "sourceIds": [
                    "dok"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction",
                  "multi": "절: 이유·시간·비교; 명사구: 자격"
                }
              ],
              "right": [
                {
                  "expression": "since",
                  "meaning": "시작 시점 이래로",
                  "sourceIds": [
                    "dok"
                  ],
                  "basis": "recent_material",
                  "role": "preposition",
                  "multi": "절: 이유·시간; 명사구: 시간",
                  "priorityBasis": "reported_wrong",
                  "priorityEvidence": "2회 흰둥이119 원오답 표시",
                  "priority": 1
                },
                {
                  "expression": "by",
                  "meaning": "늦어도 ~까지",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition",
                  "priorityBasis": "reported_wrong",
                  "priorityEvidence": "1회 지면111 원오답 표시",
                  "priority": 1
                },
                {
                  "expression": "before",
                  "meaning": "~전에",
                  "sourceIds": [
                    "dok",
                    "null"
                  ],
                  "basis": "recent_material",
                  "role": "preposition",
                  "multi": "절·명사구 모두 가능"
                },
                {
                  "expression": "after",
                  "meaning": "~후에",
                  "sourceIds": [
                    "x406"
                  ],
                  "basis": "recent_material",
                  "role": "preposition",
                  "multi": "절·명사구 모두 가능"
                },
                {
                  "expression": "prior to",
                  "meaning": "~전에",
                  "sourceIds": [
                    "null",
                    "x410"
                  ],
                  "basis": "recent_material",
                  "role": "preposition"
                },
                {
                  "expression": "subsequent to",
                  "meaning": "~이후에",
                  "sourceIds": [
                    "x406"
                  ],
                  "basis": "recent_material",
                  "role": "preposition"
                },
                {
                  "expression": "following",
                  "meaning": "~이후에",
                  "sourceIds": [
                    "x406"
                  ],
                  "basis": "recent_material",
                  "role": "preposition"
                },
                {
                  "expression": "during",
                  "meaning": "특정 기간 중에",
                  "sourceIds": [
                    "null",
                    "x430g"
                  ],
                  "basis": "recent_material",
                  "role": "preposition"
                },
                {
                  "expression": "for",
                  "meaning": "기간의 길이 동안",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "until",
                  "meaning": "끝 시점까지 계속",
                  "sourceIds": [
                    "hack25"
                  ],
                  "basis": "recent_material",
                  "role": "preposition",
                  "multi": "절·명사구 모두 가능"
                },
                {
                  "expression": "as of",
                  "meaning": "~부로; ~현재로",
                  "sourceIds": [
                    "hack24"
                  ],
                  "basis": "recent_material",
                  "role": "preposition"
                },
                {
                  "expression": "in advance of",
                  "meaning": "~에 앞서",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "ahead of",
                  "meaning": "~보다 앞서",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "throughout",
                  "meaning": "기간 내내; 전체에 걸쳐",
                  "role": "preposition",
                  "basis": "general_grammar",
                  "sourceIds": [],
                  "priority": 2,
                  "priorityBasis": "vocabulary",
                  "priorityEvidence": "사용자 단어장 throughout"
                }
              ],
              "adverbs": [
                {
                  "expression": "meanwhile",
                  "meaning": "그동안; 한편",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                },
                {
                  "expression": "in the meantime",
                  "meaning": "그동안",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                },
                {
                  "expression": "then",
                  "meaning": "그다음; 그때",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb",
                  "usage": "일반 부사·부사구의 연결 쓰임"
                },
                {
                  "expression": "afterward",
                  "meaning": "그 후에",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb",
                  "usage": "일반 부사·부사구의 연결 쓰임"
                },
                {
                  "expression": "subsequently",
                  "meaning": "그 뒤에",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb",
                  "usage": "일반 부사·부사구의 연결 쓰임"
                },
                {
                  "expression": "previously",
                  "meaning": "이전에 (미리 아님)",
                  "sourceIds": [
                    "x420"
                  ],
                  "basis": "recent_material",
                  "role": "adverb",
                  "usage": "일반 부사·부사구의 연결 쓰임"
                },
                {
                  "expression": "thereafter",
                  "meaning": "그 이후에",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb",
                  "usage": "일반 부사·부사구의 연결 쓰임"
                }
              ]
            },
            {
              "meaning": "대체 · 선택",
              "left": [
                {
                  "expression": "or",
                  "meaning": "또는",
                  "sourceIds": [
                    "null"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction",
                  "multi": "단어·구도 연결",
                  "priorityBasis": "reported_wrong",
                  "priorityEvidence": "2회 흰둥이114 원오답 표시",
                  "priority": 1
                },
                {
                  "expression": "either A or B",
                  "meaning": "A나 B 중 하나",
                  "sourceIds": [
                    "null"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction",
                  "multi": "같은 형태끼리 병렬"
                }
              ],
              "right": [
                {
                  "expression": "in exchange for",
                  "meaning": "~의 대가로; 맞바꾸어",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition",
                  "priorityBasis": "vocabulary",
                  "priorityEvidence": "사용자 단어장 in exchange for·redeem",
                  "priority": 2
                },
                {
                  "expression": "instead of",
                  "meaning": "~대신에",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "in place of",
                  "meaning": "~대신에",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                }
              ],
              "adverbs": [
                {
                  "expression": "instead",
                  "meaning": "대신에",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                },
                {
                  "expression": "alternatively",
                  "meaning": "그 대신; 다른 방법으로",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                }
              ]
            },
            {
              "meaning": "이유 → 결과 (방향을 구별)",
              "left": [
                {
                  "expression": "because",
                  "meaning": "~이기 때문에",
                  "sourceIds": [
                    "null"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction"
                },
                {
                  "expression": "since",
                  "meaning": "~이므로",
                  "sourceIds": [
                    "dok"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction",
                  "multi": "절: 이유·시간; 명사구: 시간"
                },
                {
                  "expression": "as",
                  "meaning": "~이므로",
                  "sourceIds": [
                    "dok"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction",
                  "multi": "절: 이유·시간·비교; 명사구: 자격"
                },
                {
                  "expression": "now that",
                  "meaning": "이제 ~이므로",
                  "sourceIds": [
                    "hack24"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction"
                }
              ],
              "right": [
                {
                  "expression": "because of",
                  "meaning": "~때문에",
                  "sourceIds": [
                    "null",
                    "x430v"
                  ],
                  "basis": "recent_material",
                  "role": "preposition"
                },
                {
                  "expression": "due to",
                  "meaning": "~로 인해",
                  "sourceIds": [
                    "hack24",
                    "null"
                  ],
                  "basis": "recent_material",
                  "role": "preposition"
                },
                {
                  "expression": "on account of",
                  "meaning": "~때문에",
                  "sourceIds": [
                    "x430v"
                  ],
                  "basis": "recent_material",
                  "role": "preposition"
                },
                {
                  "expression": "owing to",
                  "meaning": "~때문에",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "thanks to",
                  "meaning": "~덕분에",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "as a result of",
                  "meaning": "~의 결과로",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                }
              ],
              "adverbs": [
                {
                  "expression": "therefore",
                  "meaning": "그러므로",
                  "sourceIds": [
                    "x422"
                  ],
                  "basis": "recent_material",
                  "role": "adverb"
                },
                {
                  "expression": "thus",
                  "meaning": "따라서",
                  "sourceIds": [
                    "x422"
                  ],
                  "basis": "recent_material",
                  "role": "adverb"
                },
                {
                  "expression": "consequently",
                  "meaning": "그 결과",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                },
                {
                  "expression": "hence",
                  "meaning": "그러므로",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                },
                {
                  "expression": "as a result",
                  "meaning": "그 결과",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                },
                {
                  "expression": "accordingly",
                  "meaning": "그에 따라",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                },
                {
                  "expression": "after all",
                  "meaning": "어쨌든 ~이니까",
                  "sourceIds": [
                    "x362"
                  ],
                  "basis": "recent_material",
                  "role": "adverb"
                }
              ]
            },
            {
              "meaning": "조건 · 무관",
              "left": [
                {
                  "expression": "if",
                  "meaning": "만약 ~라면",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "conjunction"
                },
                {
                  "expression": "unless",
                  "meaning": "~하지 않는 한",
                  "sourceIds": [
                    "hack25",
                    "null",
                    "x420"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction"
                },
                {
                  "expression": "provided (that)",
                  "meaning": "~라는 조건으로",
                  "sourceIds": [
                    "x436"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction"
                },
                {
                  "expression": "providing (that)",
                  "meaning": "~라는 조건으로",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "conjunction"
                },
                {
                  "expression": "as long as",
                  "meaning": "~하는 한",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "conjunction"
                },
                {
                  "expression": "in case",
                  "meaning": "혹시 ~할 경우에 대비하여",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "conjunction"
                },
                {
                  "expression": "in the event that",
                  "meaning": "~이 발생하면",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "conjunction"
                },
                {
                  "expression": "whether or not",
                  "meaning": "~이든 아니든",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "conjunction"
                }
              ],
              "right": [
                {
                  "expression": "in case of",
                  "meaning": "~의 경우에는",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "in the event of",
                  "meaning": "~이 발생하면",
                  "sourceIds": [
                    "x388"
                  ],
                  "basis": "recent_material",
                  "role": "preposition"
                },
                {
                  "expression": "without",
                  "meaning": "~없이",
                  "sourceIds": [
                    "null"
                  ],
                  "basis": "recent_material",
                  "role": "preposition"
                },
                {
                  "expression": "regardless of",
                  "meaning": "~와 관계없이",
                  "sourceIds": [
                    "x434"
                  ],
                  "basis": "recent_material",
                  "role": "preposition"
                },
                {
                  "expression": "irrespective of",
                  "meaning": "~와 관계없이",
                  "sourceIds": [
                    "x434"
                  ],
                  "basis": "recent_material",
                  "role": "preposition"
                }
              ],
              "adverbs": [
                {
                  "expression": "otherwise",
                  "meaning": "그렇지 않으면",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb",
                  "multi": "그렇지 않으면; 그 점 외에는"
                },
                {
                  "expression": "in that case",
                  "meaning": "그 경우에는",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                }
              ]
            },
            {
              "meaning": "추가 · 병렬",
              "left": [
                {
                  "expression": "and",
                  "meaning": "그리고",
                  "sourceIds": [
                    "null"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction",
                  "multi": "단어·구도 연결"
                },
                {
                  "expression": "not only A but also B",
                  "meaning": "A뿐 아니라 B도",
                  "sourceIds": [
                    "null"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction",
                  "multi": "같은 형태끼리 병렬"
                }
              ],
              "right": [
                {
                  "expression": "in addition to",
                  "meaning": "~에 더해",
                  "sourceIds": [
                    "x388"
                  ],
                  "basis": "recent_material",
                  "role": "preposition"
                },
                {
                  "expression": "besides",
                  "meaning": "~외에도",
                  "sourceIds": [
                    "x388"
                  ],
                  "basis": "recent_material",
                  "role": "preposition",
                  "multi": "전치사·부사; beside(옆에)와 구별"
                },
                {
                  "expression": "along with",
                  "meaning": "~와 함께",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "on top of",
                  "meaning": "~에 더하여",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "apart from",
                  "meaning": "~외에도 (추가)",
                  "sourceIds": [
                    "x388"
                  ],
                  "basis": "recent_material",
                  "role": "preposition",
                  "multi": "추가·제외는 문맥으로 구별"
                }
              ],
              "adverbs": [
                {
                  "expression": "moreover",
                  "meaning": "게다가",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                },
                {
                  "expression": "furthermore",
                  "meaning": "더욱이",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                },
                {
                  "expression": "in addition",
                  "meaning": "게다가",
                  "sourceIds": [
                    "x388"
                  ],
                  "basis": "recent_material",
                  "role": "adverb"
                },
                {
                  "expression": "additionally",
                  "meaning": "추가로",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                },
                {
                  "expression": "besides",
                  "meaning": "게다가",
                  "sourceIds": [
                    "x388"
                  ],
                  "basis": "recent_material",
                  "role": "adverb",
                  "multi": "전치사·부사; beside(옆에)와 구별"
                },
                {
                  "expression": "also",
                  "meaning": "또한",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb",
                  "usage": "일반 부사·부사구의 연결 쓰임"
                }
              ]
            },
            {
              "meaning": "목적 · 용도",
              "left": [
                {
                  "expression": "so that",
                  "meaning": "~하도록",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "conjunction"
                },
                {
                  "expression": "in order that",
                  "meaning": "~하도록 (격식)",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "conjunction"
                }
              ],
              "right": [
                {
                  "expression": "for",
                  "meaning": "~을 위한",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "for the purpose of",
                  "meaning": "~할 목적으로",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "with a view to",
                  "meaning": "~할 목적으로",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                }
              ],
              "adverbs": [
                {
                  "expression": "to this end",
                  "meaning": "이를 위해",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                },
                {
                  "expression": "for this purpose",
                  "meaning": "이 목적을 위해",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                }
              ]
            },
            {
              "meaning": "예시 · 구체화",
              "left": [],
              "right": [
                {
                  "expression": "such as",
                  "meaning": "~와 같은",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "including",
                  "meaning": "~을 포함하여",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                }
              ],
              "adverbs": [
                {
                  "expression": "for example",
                  "meaning": "예를 들어",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                },
                {
                  "expression": "for instance",
                  "meaning": "예를 들어",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                },
                {
                  "expression": "specifically",
                  "meaning": "구체적으로",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb",
                  "usage": "일반 부사·부사구의 연결 쓰임"
                },
                {
                  "expression": "in particular",
                  "meaning": "특히",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb",
                  "usage": "일반 부사·부사구의 연결 쓰임"
                },
                {
                  "expression": "namely",
                  "meaning": "즉; 구체적으로 말해",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                }
              ]
            },
            {
              "meaning": "제외 · 예외",
              "left": [
                {
                  "expression": "except (that)",
                  "meaning": "~라는 점을 제외하면",
                  "sourceIds": [
                    "x398"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction",
                  "multi": "절 앞; 명사구형과 구별"
                }
              ],
              "right": [
                {
                  "expression": "except",
                  "meaning": "~을 제외하고",
                  "sourceIds": [
                    "x388",
                    "x398"
                  ],
                  "basis": "recent_material",
                  "role": "preposition",
                  "multi": "명사구 앞; 절은 except (that)"
                },
                {
                  "expression": "except for",
                  "meaning": "~을 제외하고",
                  "sourceIds": [
                    "x398"
                  ],
                  "basis": "recent_material",
                  "role": "preposition"
                },
                {
                  "expression": "apart from",
                  "meaning": "~을 제외하면",
                  "sourceIds": [
                    "x388"
                  ],
                  "basis": "recent_material",
                  "role": "preposition",
                  "multi": "추가·제외는 문맥으로 구별"
                },
                {
                  "expression": "excluding",
                  "meaning": "~을 제외하고",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "with the exception of",
                  "meaning": "~을 제외하고",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                }
              ],
              "adverbs": [
                {
                  "expression": "otherwise",
                  "meaning": "그 점 외에는",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb",
                  "multi": "그렇지 않으면; 그 점 외에는"
                }
              ]
            },
            {
              "meaning": "고려 · 근거 · 준수",
              "left": [
                {
                  "expression": "given (that)",
                  "meaning": "~라는 점을 고려하면",
                  "sourceIds": [
                    "x364"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction",
                  "multi": "절 앞; given + 명사구와 구별"
                },
                {
                  "expression": "considering (that)",
                  "meaning": "~라는 점을 고려하면",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "conjunction",
                  "multi": "절 앞; 명사구형과 구별"
                }
              ],
              "right": [
                {
                  "expression": "given",
                  "meaning": "~을 고려하면",
                  "sourceIds": [
                    "x364"
                  ],
                  "basis": "recent_material",
                  "role": "preposition",
                  "multi": "명사구 앞; 절은 given (that)"
                },
                {
                  "expression": "considering",
                  "meaning": "~을 고려하면",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition",
                  "multi": "명사구 앞; 절은 considering (that)"
                },
                {
                  "expression": "in light of",
                  "meaning": "~에 비추어",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "in view of",
                  "meaning": "~을 고려하여",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "according to",
                  "meaning": "~에 따르면",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "in accordance with",
                  "meaning": "~에 따라",
                  "sourceIds": [
                    "x430g"
                  ],
                  "basis": "recent_material",
                  "role": "preposition"
                },
                {
                  "expression": "in keeping with",
                  "meaning": "~에 부합하여",
                  "sourceIds": [
                    "x430g"
                  ],
                  "basis": "recent_material",
                  "role": "preposition"
                },
                {
                  "expression": "in compliance with",
                  "meaning": "~을 준수하여",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "in line with",
                  "meaning": "~에 부합하여",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "on the basis of",
                  "meaning": "~을 근거로",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                }
              ],
              "adverbs": [
                {
                  "expression": "accordingly",
                  "meaning": "그에 맞추어",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                }
              ]
            },
            {
              "meaning": "비교 · 유사",
              "left": [
                {
                  "expression": "as",
                  "meaning": "~처럼",
                  "sourceIds": [
                    "dok"
                  ],
                  "basis": "recent_material",
                  "role": "conjunction",
                  "multi": "절: 이유·시간·비교; 명사구: 자격"
                },
                {
                  "expression": "as if",
                  "meaning": "마치 ~인 것처럼",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "conjunction"
                },
                {
                  "expression": "as though",
                  "meaning": "마치 ~인 것처럼",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "conjunction"
                }
              ],
              "right": [
                {
                  "expression": "like",
                  "meaning": "~처럼",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "unlike",
                  "meaning": "~와 달리",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "in comparison with",
                  "meaning": "~와 비교하면",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                }
              ],
              "adverbs": [
                {
                  "expression": "likewise",
                  "meaning": "마찬가지로",
                  "sourceIds": [
                    "x422"
                  ],
                  "basis": "recent_material",
                  "role": "adverb"
                },
                {
                  "expression": "similarly",
                  "meaning": "비슷하게",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                },
                {
                  "expression": "in the same way",
                  "meaning": "같은 방식으로",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                }
              ]
            },
            {
              "meaning": "정리 · 보충 설명",
              "left": [],
              "right": [],
              "adverbs": [
                {
                  "expression": "in fact",
                  "meaning": "사실은",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                },
                {
                  "expression": "indeed",
                  "meaning": "실제로; 참으로",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                },
                {
                  "expression": "in other words",
                  "meaning": "다시 말해",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                },
                {
                  "expression": "in short",
                  "meaning": "요컨대",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                },
                {
                  "expression": "in conclusion",
                  "meaning": "결론적으로",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb"
                },
                {
                  "expression": "overall",
                  "meaning": "전반적으로",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "adverb",
                  "usage": "일반 부사·부사구의 연결 쓰임"
                }
              ]
            },
            {
              "meaning": "장소 · 위치 (기존 학습 표현)",
              "left": [],
              "right": [
                {
                  "expression": "at",
                  "meaning": "지점에서",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "on",
                  "meaning": "표면에",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "in",
                  "meaning": "공간 안에",
                  "sourceIds": [],
                  "basis": "general_grammar",
                  "role": "preposition"
                },
                {
                  "expression": "beside",
                  "meaning": "~옆에",
                  "sourceIds": [
                    "x388"
                  ],
                  "basis": "recent_material",
                  "role": "preposition"
                },
                {
                  "expression": "next to",
                  "meaning": "~바로 옆에",
                  "sourceIds": [
                    "x388"
                  ],
                  "basis": "recent_material",
                  "role": "preposition"
                }
              ],
              "adverbs": []
            }
          ],
          "contrastNote": "↔는 문맥에 따라 품사·뜻이 달라지는 표현입니다. since + 명사구는 시간, as + 명사구는 자격(~로서)입니다. and·or는 단어·구도 연결합니다. 오른쪽 열에는 일반 부사·부사구의 연결 쓰임도 포함합니다.",
          "reviewFocus": true,
          "boardTitle": "2024년 이후 토익 해설·학습 자료를 참고한 연결어 암기표",
          "connectorSources": [
            {
              "id": "dok",
              "date": "2024-04-05",
              "url": "https://www.dokjongban.com/2024/04/05/161986/",
              "title": "독종반 연결사 학습정리",
              "kind": "학원 학습정리; 출제 순위 수치는 사용하지 않음",
              "expressions": [
                "since",
                "before",
                "once",
                "as",
                "as soon as"
              ]
            },
            {
              "id": "hack24",
              "date": "2024-11-28",
              "url": "https://v.daum.net/v/20241128100247511",
              "title": "해커스·코리아헤럴드 학습문제",
              "kind": "출판사 제공 학습문제·보기; 실기출 인증 아님",
              "expressions": [
                "due to",
                "as of",
                "even if",
                "now that"
              ]
            },
            {
              "id": "hack25",
              "date": "2025-04-03",
              "url": "https://v.daum.net/v/20250403100014870",
              "title": "해커스·코리아헤럴드 학습문제",
              "kind": "출판사 제공 학습문제·보기; 실기출 인증 아님",
              "expressions": [
                "despite",
                "once",
                "until",
                "unless"
              ]
            },
            {
              "id": "null",
              "date": "2025-09-02",
              "url": "https://www.nullarbor.co.jp/toeictest/ToeicPart5.html",
              "title": "Nullarbor Press Part5 학습안내",
              "kind": "출판사 학습안내 갱신일; 원문 예문 전재 없음",
              "expressions": [
                "during",
                "while",
                "despite",
                "in spite of",
                "though",
                "although",
                "prior to",
                "before",
                "due to",
                "because of",
                "because",
                "without",
                "unless",
                "and",
                "or",
                "not only A but also B",
                "either A or B"
              ]
            },
            {
              "id": "x362",
              "date": "2024-08-26",
              "url": "https://x-gate.jp/2024/08/26/toeic362am/",
              "title": "X-GATE 2024-08-26",
              "kind": "강사 복습·해설; ETS 공식 문항 인증 아님",
              "expressions": [
                "after all"
              ]
            },
            {
              "id": "x364",
              "date": "2024-09-15",
              "url": "https://x-gate.jp/2024/09/15/toeic364am/",
              "title": "X-GATE 2024-09-15",
              "kind": "강사 복습·해설; ETS 공식 문항 인증 아님",
              "expressions": [
                "given",
                "given (that)"
              ]
            },
            {
              "id": "x388",
              "date": "2025-05-19",
              "url": "https://x-gate.jp/2025/05/19/toeic388am_grammar/",
              "title": "X-GATE 2025-05-19",
              "kind": "강사 복습·해설; ETS 공식 문항 인증 아님",
              "expressions": [
                "besides",
                "in addition",
                "in addition to",
                "except",
                "apart from",
                "in the event of",
                "beside",
                "next to"
              ]
            },
            {
              "id": "x398",
              "date": "2025-08-24",
              "url": "https://x-gate.jp/2025/08/24/toeic398am/",
              "title": "X-GATE 2025-08-24",
              "kind": "강사 복습·해설; ETS 공식 문항 인증 아님",
              "expressions": [
                "except for",
                "except",
                "except (that)"
              ]
            },
            {
              "id": "x406",
              "date": "2025-11-16",
              "url": "https://x-gate.jp/2025/11/16/toeic406am/",
              "title": "X-GATE 2025-11-16",
              "kind": "강사 복습·해설; ETS 공식 문항 인증 아님",
              "expressions": [
                "subsequent to",
                "after",
                "following"
              ]
            },
            {
              "id": "x410",
              "date": "2025-12-20",
              "url": "https://x-gate.jp/2025/12/20/toeic410am/",
              "title": "X-GATE 2025-12-20",
              "kind": "강사 복습·해설; ETS 공식 문항 인증 아님",
              "expressions": [
                "prior to"
              ]
            },
            {
              "id": "x420",
              "date": "2026-03-16",
              "url": "https://x-gate.jp/2026/03/16/toeic420am_grammar/",
              "title": "X-GATE 2026-03-16",
              "kind": "강사 복습·해설; ETS 공식 문항 인증 아님",
              "expressions": [
                "while",
                "unless",
                "previously"
              ]
            },
            {
              "id": "x422",
              "date": "2026-04-19",
              "url": "https://x-gate.jp/2026/04/19/toeic422am_grammar/",
              "title": "X-GATE 2026-04-19",
              "kind": "강사 복습·해설; ETS 공식 문항 인증 아님",
              "expressions": [
                "thus",
                "likewise",
                "therefore"
              ]
            },
            {
              "id": "x430v",
              "date": "2026-06-28",
              "url": "https://x-gate.jp/2026/06/28/toeic430am-2/",
              "title": "X-GATE 2026-06-28",
              "kind": "강사 복습·해설; ETS 공식 문항 인증 아님",
              "expressions": [
                "on account of",
                "because of"
              ]
            },
            {
              "id": "x430g",
              "date": "2026-06-28",
              "url": "https://x-gate.jp/2026/06/28/toeic430am_grammar/",
              "title": "X-GATE 2026-06-28",
              "kind": "강사 복습·해설; ETS 공식 문항 인증 아님",
              "expressions": [
                "during",
                "in accordance with",
                "in keeping with"
              ]
            },
            {
              "id": "x434",
              "date": "2026-08-23",
              "url": "https://x-gate.jp/2026/08/23/toeic434am/",
              "title": "X-GATE 2026-08-23",
              "kind": "강사 복습·해설; ETS 공식 문항 인증 아님",
              "expressions": [
                "irrespective of",
                "regardless of"
              ]
            },
            {
              "id": "x436",
              "date": "2026-09-06",
              "url": "https://x-gate.jp/2026/09/06/toeic436am_grammar/",
              "title": "X-GATE 2026-09-06",
              "kind": "강사 복습·해설; ETS 공식 문항 인증 아님",
              "expressions": [
                "however",
                "nevertheless",
                "provided (that)"
              ]
            }
          ],
          "structureNotes": [
            "절 연결: because S + V / 명사구 연결: because of + 명사구",
            "접속부사: S + V. However, S + V. 또는 S + V; however, S + V.",
            "전치사 to: prior to + 명사구, with a view to + -ing / 부정사: in order to + 동사원형",
            "별도 용법: however + 형용사·부사 + S + V (아무리 ~해도); while working 같은 축약절도 가능"
          ],
          "priorityNote": "먼저 볼 내 자료: by(1회111), despite(2회113), or(2회114), since + 명사구(2회119)는 원오답 표시 확인. in exchange for는 단어장 확인. 보기 출현과 실제 선택한 오답은 구별합니다."
        },
        {
          "id": "cc-parallel",
          "title": "등위접속사와 병렬",
          "concept": "and/or/but/yet은 같은 형태끼리 잇습니다(명사와 명사, -ing와 -ing). both A and B, either A or B, neither A nor B, not only A but (also) B도 짝을 맞춥니다. as well as와 rather than은 부가·대조 요소를 붙이며 동사 수는 앞 주어에 맞춥니다.",
          "examType": "A, B, and ___ 병렬 형태 / 상관접속사 짝",
          "memory": [
            {
              "pattern": "-ing, -ing, and -ing",
              "meaning": "병렬",
              "note": "hiring, setting, and preparing"
            },
            {
              "pattern": "both A and B / either A or B / neither A nor B",
              "meaning": "짝 접속사",
              "note": "짝이 섞이면 오답"
            },
            {
              "pattern": "A as well as B + A에 맞춘 동사",
              "meaning": "B뿐 아니라 A도",
              "note": "The manager as well as the staff is ..."
            },
            {
              "pattern": "A rather than B",
              "meaning": "B보다는 A",
              "note": "A와 B는 같은 형태"
            }
          ]
        },
        {
          "id": "cc-conj-adverb",
          "title": "접속부사와 구두점 · no matter how",
          "concept": "however, therefore, meanwhile, in addition, as a result는 부사라서 두 절을 혼자 연결하지 못합니다. 마침표나 세미콜론으로 문장을 나눈 뒤 씁니다(쉼표만으로 연결하면 comma splice). no matter how 뒤에는 형용사/부사 + 주어 + 동사가 옵니다. also, as well의 위치는 하나로 고정되지 않습니다.",
          "examType": "문장 첫머리 접속부사 / 앞뒤 문장 논리 관계",
          "memory": [
            {
              "pattern": "S + V. However, S + V.",
              "meaning": "그러나",
              "note": "; however, 도 가능"
            },
            {
              "pattern": "therefore · as a result",
              "meaning": "따라서 · 그 결과",
              "note": "원인 → 결과"
            },
            {
              "pattern": "meanwhile · in addition",
              "meaning": "한편 · 게다가",
              "note": "동시 상황 · 추가"
            },
            {
              "pattern": "no matter how + 형/부 + S + V",
              "meaning": "아무리 ~해도",
              "note": "no matter how busy we are"
            }
          ]
        },
        {
          "id": "cc-noun-clause",
          "title": "명사절: that · whether · what · 의문사",
          "concept": "명사절은 주어·목적어·보어 자리에 옵니다. that과 whether 뒤는 완전한 절, what 뒤는 주어나 목적어가 빠진 절입니다. 간접의문문은 '의문사 + 주어 + 동사' 순서입니다(where the office is). be sure/certain/confident that도 자주 쓰입니다.",
          "examType": "명사절 접속사 선택 / 간접의문문 어순",
          "memory": [
            {
              "pattern": "whether (or not) + 완전한 절",
              "meaning": "~인지 아닌지",
              "note": "불확실한 내용"
            },
            {
              "pattern": "that + 완전한 절",
              "meaning": "~라는 것",
              "note": "확정된 내용"
            },
            {
              "pattern": "be sure / confident + that절",
              "meaning": "~을 확신하다",
              "note": "that 생략 가능"
            },
            {
              "pattern": "what + 불완전한 절",
              "meaning": "~하는 것",
              "note": "what = the thing(s) that"
            },
            {
              "pattern": "의문사 + S + V",
              "meaning": "간접의문문",
              "note": "where the room is (where is the room ✗)"
            },
            {
              "pattern": "whoever + V / 의문사 + S + V",
              "meaning": "~하는 누구든 / ~인지",
              "note": "Whoever registers receives a badge. / We wonder who will lead."
            }
          ]
        },
        {
          "id": "cc-relative",
          "title": "관계대명사·관계부사",
          "concept": "관계절은 앞 명사를 설명합니다. 관계대명사는 절 안에서 주어·목적어·소유 역할을 하고, 관계부사는 장소·시간·이유를 잇습니다. 완전한 절은 주어·동사뿐 아니라 필요한 목적어·보어까지 갖춘 절입니다.",
          "examType": "선행사 + 관계절 빠진 성분으로 관계사 선택 / 전치사 + which",
          "reviewFocus": true,
          "boardLabel": "관계사 통합 암기판",
          "summaryTables": [
            {
              "title": "내 자료에서 먼저 구별 · 원오답 표시 확인",
              "headers": [
                "핵심",
                "판단",
                "자료 근거"
              ],
              "rows": [
                [
                  "whose + 명사",
                  "사람·사물의 소유 관계로 앞 명사와 관계절을 잇기",
                  "1회 지면128 · 2회 흰둥이126 원오답 표시"
                ],
                [
                  "its + 명사",
                  "소유 한정사; 관계절을 잇는 관계사는 아님",
                  "2회 흰둥이126의 보기 대조"
                ],
                [
                  "whose + N + V",
                  "소유된 명사가 관계절의 주어",
                  "whose prices were lowest"
                ]
              ]
            },
            {
              "title": "관계대명사 · 절 안 명사 역할",
              "headers": [
                "형태",
                "선행사",
                "뒤 구조·역할",
                "짧은 구별"
              ],
              "rows": [
                [
                  "who",
                  "사람",
                  "주어 자리 + V",
                  "employees who work here"
                ],
                [
                  "that",
                  "사람·사물",
                  "주어 자리 + V",
                  "a device that works"
                ],
                [
                  "whom",
                  "사람",
                  "S + V + 목적어 빈자리",
                  "the client whom we called"
                ],
                [
                  "who",
                  "사람",
                  "S + V + 목적어 빈자리 (비격식)",
                  "the person who we met"
                ],
                [
                  "that",
                  "사람·사물",
                  "S + V + 목적어 빈자리",
                  "the file that we need"
                ],
                [
                  "which",
                  "사물·동물",
                  "주어 자리 + V",
                  "the office which opens at nine"
                ],
                [
                  "which",
                  "사물·동물",
                  "S + V + 목적어 빈자리",
                  "the office which we visited"
                ],
                [
                  "whose + N",
                  "사람·사물",
                  "N + V (N이 주어)",
                  "a supplier whose prices are low"
                ],
                [
                  "whose + N",
                  "사람·사물",
                  "N + S + V (N이 목적어)",
                  "a supplier whose prices we compared"
                ]
              ]
            },
            {
              "title": "장소라고 자동 where가 아님",
              "headers": [
                "선행사·의미",
                "형태",
                "관계절 구조",
                "대표 구"
              ],
              "rows": [
                [
                  "장소 · 주어",
                  "which",
                  "주어 빈자리",
                  "the office which opens at nine"
                ],
                [
                  "장소 · 목적어",
                  "which",
                  "목적어 빈자리",
                  "the office which we visited"
                ],
                [
                  "장소 · 부사",
                  "where",
                  "필수 성분을 갖춘 절",
                  "the office where we met the client"
                ],
                [
                  "장소 · 전치사 목적어",
                  "which ... in",
                  "전치사 목적어 빈자리",
                  "the office which we work in"
                ],
                [
                  "장소 · 전치사 + 관계사",
                  "in which",
                  "뒤 절의 필수 성분 확인",
                  "the office in which we work"
                ],
                [
                  "시간",
                  "when",
                  "완전절; 문맥에 맞는 전치사 + which",
                  "the day when we met"
                ],
                [
                  "이유",
                  "why",
                  "완전절; for which와 대응 가능",
                  "the reason why we left"
                ],
                [
                  "방법",
                  "the way + S + V",
                  "the way that + S + V도 가능",
                  "the way we process orders"
                ],
                [
                  "방법",
                  "the way in which + S + V",
                  "how + S + V는 별도 표현",
                  "the way how는 쓰지 않기"
                ]
              ]
            },
            {
              "title": "전치사 · 수량 · 쉼표",
              "headers": [
                "형태",
                "핵심",
                "유의점"
              ],
              "rows": [
                [
                  "전치사 + whom",
                  "사람 전치사 목적어",
                  "the client with whom we spoke"
                ],
                [
                  "전치사 + which",
                  "사물 전치사 목적어",
                  "the room in which we met"
                ],
                [
                  "전치사 + whose + N",
                  "소유된 명사구 앞 전치사",
                  "the firm with whose staff we work"
                ],
                [
                  "전치사 바로 뒤 that",
                  "사용하지 않음",
                  "관계사로 쓰인 in that은 불가; 접속표현 in that(~라는 점에서)은 별개"
                ],
                [
                  "some of whom\nmany of whom\nboth of whom",
                  "사람 일부·수량",
                  "관계절의 주어·동사 수 확인"
                ],
                [
                  "most of which\nall of which\none of which\nnone of which",
                  "사물 일부·수량",
                  "none의 동사 수는 문맥에 따라 달라짐"
                ],
                [
                  "제한적 관계절",
                  "어느 대상인지 범위 한정",
                  "that 가능"
                ],
                [
                  "쉼표 + who\n쉼표 + which",
                  "부가 설명하는 계속적 용법",
                  "쉼표 뒤 관계사 that은 불가"
                ],
                [
                  "앞 절 전체 + , which",
                  "앞의 상황 전체를 받기",
                  "The system failed, which delayed the work."
                ]
              ]
            },
            {
              "title": "생략 · 축약 · 수일치",
              "headers": [
                "형태",
                "판단",
                "짧은 적용"
              ],
              "rows": [
                [
                  "제한적 목적격 관계사 생략",
                  "목적어 빈자리가 남는지 확인",
                  "the file (that) we need"
                ],
                [
                  "주격 관계사만 단독 생략",
                  "그대로 빼지 않기",
                  "the staff who work here"
                ],
                [
                  "능동 V-ing 후치 수식",
                  "축약 가능한 능동 관계절",
                  "the staff working here"
                ],
                [
                  "수동 p.p. 후치 수식",
                  "축약 가능한 수동 관계절",
                  "the files attached to this email"
                ],
                [
                  "관계절 동사 수",
                  "그 절의 주어에 맞추기",
                  "people who work; anyone who works"
                ]
              ]
            },
            {
              "title": "that · what · 내용절",
              "headers": [
                "형태",
                "절 내부",
                "구별"
              ],
              "rows": [
                [
                  "앞 명사 + 관계사 that",
                  "주어·목적어 빈자리 등",
                  "the news that we received"
                ],
                [
                  "접속사 that + 완전절",
                  "필수 명사 성분 빈자리 없음",
                  "the news that sales increased"
                ],
                [
                  "what + 절",
                  "what이 명사 역할; 자체 선행사 포함",
                  "what we need = 필요한 것"
                ],
                [
                  "what 앞에 같은 선행사",
                  "the thing what처럼 쓰지 않기",
                  "the thing that we need와 구별"
                ]
              ]
            },
            {
              "title": "복합관계사 · 명사절과 양보절",
              "headers": [
                "형태",
                "뜻·역할",
                "구별"
              ],
              "rows": [
                [
                  "whoever",
                  "누구든지 · 절 내부 주어",
                  "whoever meets the requirements"
                ],
                [
                  "whomever",
                  "누구든지 · 절 내부 목적어",
                  "whomever you choose (격식)"
                ],
                [
                  "whatever",
                  "무엇이든지; 무엇이 ~하더라도",
                  "명사절과 양보절을 문장 기능으로 구별"
                ],
                [
                  "whichever",
                  "주어진 범위 중 어느 것이든",
                  "두 개로 한정되지 않음"
                ],
                [
                  "whatever + N",
                  "어떤 N이든",
                  "whatever device you use"
                ],
                [
                  "whichever + N",
                  "주어진 범위의 어느 N이든",
                  "whichever option you prefer"
                ],
                [
                  "whenever",
                  "언제든지; 언제 ~하더라도",
                  "시간"
                ],
                [
                  "wherever",
                  "어디든지; 어디 ~하더라도",
                  "장소"
                ],
                [
                  "however + 형용사 + S + V",
                  "아무리 ~해도",
                  "however difficult the task is"
                ],
                [
                  "however + 부사 + S + V",
                  "아무리 ~하게 해도",
                  "however carefully we plan"
                ],
                [
                  "however + S + V",
                  "어떤 방식으로 ~하든",
                  "however you choose to travel"
                ],
                [
                  "However, S + V",
                  "그러나 (접속부사)",
                  "위의 복합관계 용법과 구별"
                ],
                [
                  "no matter what",
                  "무엇이 ~하더라도 (양보)",
                  "명사절 whatever를 무조건 대체하지 않기"
                ]
              ]
            }
          ]
        },
        {
          "id": "cc-that-test",
          "title": "that 판별: 명사절(완전) vs 관계절(불완전)",
          "concept": "주격·목적격 관계사 that과 명사절 접속사 that을 비교할 때는 뒤 절의 빈자리를 봅니다. the report that he submitted는 submitted의 목적어가 빠지고, shows that costs fell은 완전한 내용 절입니다. 별도 선행사 없이 ~하는 것이라는 명사절을 만들면 what을 검토합니다.",
          "examType": "that vs what / 동격 that",
          "memory": [
            {
              "pattern": "명사 + that + 불완전한 절",
              "meaning": "관계대명사",
              "note": "the report that he submitted __"
            },
            {
              "pattern": "동사 + that + 완전한 절",
              "meaning": "명사절",
              "note": "shows that costs fell"
            },
            {
              "pattern": "선행사 없음 + ___ + 불완전한 절",
              "meaning": "what",
              "note": "What customers want is ..."
            }
          ]
        },
        {
          "id": "pc-time",
          "title": "시간 전치사: by · until · for · during · since · within",
          "concept": "한국어 '까지'는 by(완료 마감)와 until(상태·행동 지속의 끝)로 나뉩니다. for는 기간의 길이, during은 특정 기간·행사 중, since는 시작점, within은 허용 한도입니다. not A until B는 'B가 되어서야 A'로 B라는 시간 경계가 그대로 유지됩니다.",
          "examType": "마감 by vs 지속 until / for vs during / within + 기간",
          "memory": [
            {
              "pattern": "throughout + N",
              "meaning": "기간 내내·전체에 걸쳐",
              "note": "사용자 단어장 throughout",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장 throughout"
            },
            {
              "pattern": "for + 기간 길이 / during + 특정 기간",
              "meaning": "~동안 / ~중에",
              "note": "for a while, during the meeting"
            },
            {
              "pattern": "within + 기간",
              "meaning": "~이내",
              "note": "within two business days"
            },
            {
              "pattern": "until + 시점",
              "meaning": "~까지 계속",
              "note": "remain open until 8"
            },
            {
              "pattern": "not A until B",
              "meaning": "B가 되어서야 A",
              "note": "B 시점이 경계로 남음"
            },
            {
              "pattern": "since + 시작점 / from A to B",
              "meaning": "~이래로 / A부터 B까지",
              "note": "since 2020 / from Monday to Friday: from 자체가 현재완료를 요구하지 않음"
            },
            {
              "pattern": "by + 시점",
              "meaning": "늦어도 ~까지 (완료)",
              "note": "submit by Friday"
            },
            {
              "pattern": "at 9 / on Monday / in May",
              "meaning": "시각 / 요일·날짜 / 월·연도·긴 기간",
              "note": "on Monday morning, in the morning, at night"
            }
          ]
        },
        {
          "id": "pc-phrase",
          "title": "전치사구 큰 표 · 연어와 구별",
          "concept": "복합전치사와 명사구 앞 고정 표현은 큰 분류표의 하늘색 열에서 함께 외워요.\n동사·형용사 + 전치사 연어는 품사와 함께 따로 구별해요.",
          "examType": "명사구 앞 복합전치사 고르기",
          "memory": [
            {
              "pattern": "in exchange for + N",
              "meaning": "~의 대가로; 교환하여",
              "note": "사용자 단어장 in exchange for·redeem",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장 in exchange for·redeem"
            },
            {
              "pattern": "전치사구 암기 위치",
              "meaning": "위 큰 3열 표의 하늘색 열",
              "note": "이유·양보·조건·시간·추가·목적·예시·제외·근거·대체·비교별 목록"
            },
            {
              "pattern": "interested in + 명사구",
              "meaning": "형용사 + 전치사: ~에 관심 있는",
              "note": "be interested in joining"
            },
            {
              "pattern": "responsible for + 명사구",
              "meaning": "형용사 + 전치사: ~을 담당하는",
              "note": "be responsible for training"
            },
            {
              "pattern": "look forward to + 명사구",
              "meaning": "동사구 + 전치사: ~을 기대하다",
              "note": "look forward to meeting you"
            },
            {
              "pattern": "in person",
              "meaning": "고정 부사구: 직접",
              "note": "그 뒤에 목적어를 붙이는 전치사처럼 외우지 않기"
            }
          ]
        }
      ],
      "examples": [
        {
          "en": "While the manager reviews the report, please remain quiet during the meeting.",
          "ko": "관리자가 보고서를 검토하는 동안 회의 중에는 조용히 해 주세요.",
          "focus": [
            "While the manager reviews",
            "during the meeting"
          ],
          "why": "while 뒤는 주어·동사, during 뒤는 명사구입니다. 종속절은 문장 앞에도 올 수 있습니다.",
          "topicId": "cc-conj-prep",
          "exampleKind": "authored_learning"
        },
        {
          "en": "Although delivery was delayed, the equipment arrived safely despite the storm.",
          "ko": "배송은 지연됐지만 폭풍에도 불구하고 장비는 안전하게 도착했습니다.",
          "focus": [
            "Although delivery was delayed",
            "despite the storm"
          ],
          "why": "although는 절, despite는 명사구를 이끕니다.",
          "topicId": "cc-conj-prep",
          "exampleKind": "authored_learning"
        },
        {
          "en": "The supplier whose prices were lowest was awarded the contract.",
          "ko": "가격이 가장 낮았던 공급업체가 계약을 따냈습니다.",
          "focus": [
            "whose prices"
          ],
          "why": "공급업체의 가격이라는 소유 관계이므로 whose + 명사입니다.",
          "topicId": "cc-relative",
          "exampleKind": "authored_learning"
        },
        {
          "en": "The new printer is fast; however, it uses a lot of toner.",
          "ko": "새 프린터는 빠르지만 토너를 많이 사용합니다.",
          "focus": [
            "; however,"
          ],
          "why": "접속부사 however는 접속사처럼 쉼표 하나만으로 독립절 둘을 연결하지 않습니다.",
          "topicId": "cc-conj-adverb",
          "exampleKind": "authored_learning"
        },
        {
          "en": "Please return the signed form by June 3; the office is open until 6 p.m. that day.",
          "ko": "서명한 양식을 6월 3일까지 반납해 주세요. 그날 사무실은 오후 6시까지 엽니다.",
          "focus": [
            "by June 3",
            "until 6 p.m."
          ],
          "why": "완료 기한은 by, 상태 지속의 끝점은 until입니다.",
          "topicId": "pc-time",
          "exampleKind": "authored_learning"
        }
      ],
      "practice": [
        {
          "id": "c2-5",
          "stem": "The inspection was postponed _____ the loading area was temporarily closed.",
          "choices": [
            "because of",
            "despite",
            "because",
            "during"
          ],
          "answer": 2,
          "reason": "뒤에 주어와 동사가 있는 절이므로 접속사 because가 맞습니다.",
          "translation": "하역 구역이 일시 폐쇄되었기 때문에 점검이 연기되었습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "because of",
              "correct": false,
              "explanation": "복합전치사·~때문에. 뒤에 loading area was closed라는 절이 와서 맞지 않습니다."
            },
            {
              "label": "B",
              "text": "despite",
              "correct": false,
              "explanation": "전치사·~에도 불구하고. 뒤의 절을 직접 받지 못하며 폐쇄가 연기의 이유라는 의미에도 맞지 않습니다."
            },
            {
              "label": "C",
              "text": "because",
              "correct": true,
              "explanation": "접속사·~이기 때문에. the loading area + was closed라는 절을 이끌며 원인을 나타냅니다."
            },
            {
              "label": "D",
              "text": "during",
              "correct": false,
              "explanation": "전치사·~기간 중에. 뒤에 주어·동사가 있는 절을 직접 붙일 수 없습니다."
            }
          ],
          "reviewPoint": "because + 절 / because of + 명사구를 구조부터 비교하세요.",
          "topicId": "cc-conj-prep"
        },
        {
          "id": "c3-2",
          "stem": "_____ the late arrival of the order, the warehouse team shipped it on schedule.",
          "choices": [
            "Although",
            "Because",
            "Despite",
            "While"
          ],
          "answer": 2,
          "reason": "뒤가 명사구 the late arrival of the order이고 양보 관계이므로 Despite입니다.",
          "translation": "주문이 늦게 도착했음에도 창고팀은 예정대로 발송했습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "Although",
              "correct": false,
              "explanation": "접속사·비록 ~이지만. 뒤가 명사구 the late arrival of the order라서 이 문장에서는 맞지 않습니다."
            },
            {
              "label": "B",
              "text": "Because",
              "correct": false,
              "explanation": "접속사·~이기 때문에. 뒤에 명사구만 있어 절을 완성하지 못하고 양보 의미도 아닙니다."
            },
            {
              "label": "C",
              "text": "Despite",
              "correct": true,
              "explanation": "전치사·~에도 불구하고. 주문의 늦은 도착이라는 명사구와 예정대로 발송했다는 양보 관계를 연결합니다."
            },
            {
              "label": "D",
              "text": "While",
              "correct": false,
              "explanation": "접속사·~하는 동안/반면에. 여기서는 뒤에 절이 없고 양보의 명사구를 연결해야 합니다."
            }
          ],
          "reviewPoint": "although 뒤 축약절은 가능하지만, 이 문제의 뒤는 단순 명사구입니다. despite + 명사구를 고르세요.",
          "topicId": "cc-conj-prep"
        },
        {
          "id": "c3-3",
          "stem": "Please take notes _____ the trainer explains the new procedure.",
          "choices": [
            "during",
            "while",
            "despite",
            "because of"
          ],
          "answer": 1,
          "reason": "뒤에 주어 the trainer와 동사 explains가 있는 절이므로 while입니다.",
          "translation": "강사가 새 절차를 설명하는 동안 메모해 주세요.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "during",
              "correct": false,
              "explanation": "전치사·특정 기간 중에. 뒤에 the trainer explains라는 절이 오므로 맞지 않습니다."
            },
            {
              "label": "B",
              "text": "while",
              "correct": true,
              "explanation": "접속사·~하는 동안. 강사가 설명하는 절과 동시에 메모하라는 동작을 연결합니다."
            },
            {
              "label": "C",
              "text": "despite",
              "correct": false,
              "explanation": "전치사·~에도 불구하고. 절을 직접 받지 못하고 의미도 동시 진행과 다릅니다."
            },
            {
              "label": "D",
              "text": "because of",
              "correct": false,
              "explanation": "복합전치사·~때문에. 뒤의 절을 직접 받을 수 없고 이 문장은 이유보다 동시 진행을 말합니다."
            }
          ],
          "reviewPoint": "while + 절 / during + 명사구. while waiting 같은 축약절은 별도 구조입니다.",
          "topicId": "cc-conj-prep"
        },
        {
          "id": "c3-4",
          "stem": "Access will be denied _____ your supervisor approves the request; approval is required for entry.",
          "choices": [
            "unless",
            "provided that",
            "if",
            "because of"
          ],
          "answer": 0,
          "reason": "승인하지 않는 한 출입이 거부된다는 예외 조건이므로 unless입니다.",
          "translation": "책임자가 요청을 승인하지 않는 한 출입이 거부될 것입니다. 출입하려면 승인이 필요합니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "unless",
              "correct": true,
              "explanation": "조건 접속사·~하지 않는 한. 승인이 필수라는 뒤 문장과 일치합니다."
            },
            {
              "label": "B",
              "text": "provided that",
              "correct": false,
              "explanation": "조건 접속사·~라는 조건으로. 승인하면 거부한다는 반대 조건이 되어 문맥과 충돌합니다."
            },
            {
              "label": "C",
              "text": "if",
              "correct": false,
              "explanation": "조건 접속사·만약 ~하면. 승인할 때 거부한다는 뜻이 되어 승인 필수라는 규정과 맞지 않습니다."
            },
            {
              "label": "D",
              "text": "because of",
              "correct": false,
              "explanation": "복합전치사·~때문에. 뒤의 주어·동사 절을 직접 받지 못하고 조건 의미도 아닙니다."
            }
          ],
          "reviewPoint": "unless는 이 단순 조건에서 if ... not과 비슷합니다. 뜻이 뒤집히지 않는지 확인하세요.",
          "topicId": "cc-conj-prep"
        },
        {
          "id": "c3-5",
          "stem": "Before _____ the report, please check all totals.",
          "choices": [
            "submit",
            "submitted",
            "submits",
            "submitting"
          ],
          "answer": 3,
          "reason": "전치사 before 뒤에서 the report를 목적어로 취하는 동명사 submitting입니다.",
          "translation": "보고서를 제출하기 전에 모든 합계를 확인해 주세요.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "submit",
              "correct": false,
              "explanation": "동사원형·제출하다. 여기서는 before 뒤 명사적 동작을 나타내야 하므로 원형을 바로 쓰지 않습니다."
            },
            {
              "label": "B",
              "text": "submitted",
              "correct": false,
              "explanation": "과거형/과거분사·제출했다/제출된. 주어 없는 과거 동사로 절을 만들 수 없고, 수동 분사에 목적어 the report를 그대로 붙이는 구조도 아닙니다."
            },
            {
              "label": "C",
              "text": "submits",
              "correct": false,
              "explanation": "3인칭 단수 현재·제출한다. 이 시제 동사를 이끌 주어가 없으므로 맞지 않습니다."
            },
            {
              "label": "D",
              "text": "submitting",
              "correct": true,
              "explanation": "동명사·제출하는 것. before 뒤에서 the report를 목적어로 취하는 submitting이 맞습니다."
            }
          ],
          "reviewPoint": "before submission / before submitting the report / before you submit the report를 비교하세요.",
          "topicId": "cc-conj-prep"
        },
        {
          "id": "cc-06",
          "stem": "Employees _____ wish to attend the leadership seminar should register with Ms. Yoon by Friday.",
          "choices": [
            "whose",
            "what",
            "who",
            "which"
          ],
          "answer": 2,
          "reason": "선행사 Employees가 사람이고 관계절에 주어가 빠져 있으므로(___ wish to attend) 주격 관계대명사 who입니다.",
          "translation": "리더십 세미나에 참석하고자 하는 직원은 금요일까지 윤 씨에게 등록해야 합니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "whose",
              "correct": false,
              "explanation": "소유격 관계대명사. 바로 뒤에 명사가 와야 하는데 동사 wish가 이어집니다."
            },
            {
              "label": "B",
              "text": "what",
              "correct": false,
              "explanation": "선행사를 포함하는 관계대명사. 앞에 선행사 Employees가 이미 있어 쓸 수 없습니다."
            },
            {
              "label": "C",
              "text": "who",
              "correct": true,
              "explanation": "사람 선행사 + 주격 관계대명사. who wish to attend가 Employees를 꾸밉니다."
            },
            {
              "label": "D",
              "text": "which",
              "correct": false,
              "explanation": "사물·동물 선행사에 쓰는 관계대명사입니다. 사람 Employees에는 쓰지 않습니다."
            }
          ],
          "reviewPoint": "선행사(사람/사물) + 관계절에서 빠진 성분(주어/목적어/소유)을 함께 보세요.",
          "topicId": "cc-relative"
        },
        {
          "id": "cc-07",
          "stem": "The building in _____ the training sessions will be held offers free parking for participants.",
          "choices": [
            "that",
            "where",
            "what",
            "which"
          ],
          "answer": 3,
          "reason": "전치사 in 뒤에서 사물 선행사 The building을 받는 관계대명사는 which입니다.",
          "translation": "교육이 열리는 건물은 참가자에게 무료 주차를 제공합니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "that",
              "correct": false,
              "explanation": "관계대명사 that은 전치사 바로 뒤에 쓰지 않습니다. the building that ... held in이라면 가능합니다."
            },
            {
              "label": "B",
              "text": "where",
              "correct": false,
              "explanation": "관계부사 where 자체가 '그곳에서'를 포함하므로 앞에 in을 또 쓰지 않습니다. in을 빼면 the building where ...가 됩니다."
            },
            {
              "label": "C",
              "text": "what",
              "correct": false,
              "explanation": "선행사를 포함하는 관계대명사로, 앞에 선행사 The building이 있고 전치사 뒤 관계절도 이끌지 못합니다."
            },
            {
              "label": "D",
              "text": "which",
              "correct": true,
              "explanation": "전치사 + which. in which = 그 건물 안에서. 뒤 절(the sessions will be held)도 완전합니다."
            }
          ],
          "reviewPoint": "전치사 + which/whom ○, 전치사 + that ✗, 전치사 + where ✗.",
          "topicId": "cc-relative"
        },
        {
          "id": "cc-08",
          "stem": "_____ our customers value most is fast and reliable delivery, according to the latest survey.",
          "choices": [
            "What",
            "That",
            "Which",
            "Whether"
          ],
          "answer": 0,
          "reason": "빈칸 이하가 is의 주어인 명사절이고, value의 목적어가 빠진 불완전한 절이며 앞에 선행사가 없으므로 What입니다.",
          "translation": "최근 설문에 따르면, 고객이 가장 중요하게 여기는 것은 빠르고 믿을 수 있는 배송입니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "What",
              "correct": true,
              "explanation": "선행사를 포함한 관계대명사·~하는 것. value의 목적어 역할을 하면서 절 전체가 주어가 됩니다."
            },
            {
              "label": "B",
              "text": "That",
              "correct": false,
              "explanation": "명사절 접속사 that 뒤에는 완전한 절이 와야 하는데 value의 목적어가 빠져 있습니다."
            },
            {
              "label": "C",
              "text": "Which",
              "correct": false,
              "explanation": "관계대명사 which는 앞 선행사가 필요하고, '어느 것'이라는 의문 의미도 이 평서문과 맞지 않습니다."
            },
            {
              "label": "D",
              "text": "Whether",
              "correct": false,
              "explanation": "명사절 접속사·~인지 아닌지. 뒤에 완전한 절이 필요하고, 조사 결과를 확정적으로 말하는 문맥과도 맞지 않습니다."
            }
          ],
          "reviewPoint": "선행사 없음 + 불완전한 절 → what / 완전한 절 → that·whether.",
          "topicId": "cc-noun-clause"
        },
        {
          "id": "cc-09",
          "stem": "The product training was originally scheduled for Tuesday. _____, it was moved to Thursday because the trainer's flight was canceled.",
          "choices": [
            "Because",
            "However",
            "Although",
            "Despite"
          ],
          "answer": 1,
          "reason": "마침표로 나뉜 두 문장 사이에서 '원래 계획 ↔ 실제 변경'의 대조를 나타내는 접속부사 However가 필요합니다.",
          "translation": "제품 교육은 원래 화요일로 예정되어 있었습니다. 그러나 강사의 항공편이 취소되어 목요일로 옮겨졌습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "Because",
              "correct": false,
              "explanation": "종속 접속사·~때문에. 문장 구조가 맞지 않고, 이유는 뒤의 because 절이 이미 밝히고 있습니다."
            },
            {
              "label": "B",
              "text": "However",
              "correct": true,
              "explanation": "접속부사·그러나. 새 문장 첫머리에서 쉼표와 함께 앞 문장과의 대조를 나타냅니다."
            },
            {
              "label": "C",
              "text": "Although",
              "correct": false,
              "explanation": "종속 접속사. 바로 뒤에 쉼표를 두고 독립된 문장을 이끌 수 없으며, 절을 이끌려면 'Although S + V, S + V' 구조여야 합니다."
            },
            {
              "label": "D",
              "text": "Despite",
              "correct": false,
              "explanation": "전치사. 뒤에 명사구가 필요한데 쉼표 다음 바로 절이 옵니다."
            }
          ],
          "reviewPoint": "문장 첫머리 + 쉼표 → 접속부사(However, Therefore ...) 후보. 앞뒤 문장의 논리(대조/결과/추가)로 고르세요.",
          "topicId": "cc-conj-adverb"
        },
        {
          "id": "cc-10",
          "stem": "The new office manager will be responsible for hiring staff, setting department budgets, and _____ weekly progress reports.",
          "choices": [
            "prepared",
            "preparation",
            "preparing",
            "prepare"
          ],
          "answer": 2,
          "reason": "전치사 for 뒤 hiring, setting과 and로 나란히 연결되므로 같은 동명사 형태 preparing입니다.",
          "translation": "새 사무 관리자는 직원 채용, 부서 예산 설정, 주간 진행 보고서 작성을 담당하게 됩니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "prepared",
              "correct": false,
              "explanation": "과거형/과거분사. 앞의 -ing 형태와 병렬이 맞지 않습니다."
            },
            {
              "label": "B",
              "text": "preparation",
              "correct": false,
              "explanation": "명사·준비. 뒤에 목적어 reports를 바로 받을 수 없어 preparation of가 필요합니다."
            },
            {
              "label": "C",
              "text": "preparing",
              "correct": true,
              "explanation": "동명사. hiring, setting과 같은 형태로 병렬을 이루며 weekly progress reports를 목적어로 받습니다."
            },
            {
              "label": "D",
              "text": "prepare",
              "correct": false,
              "explanation": "동사원형. 전치사 for에 연결된 동명사 나열 속에 원형이 섞여 병렬이 깨집니다."
            }
          ],
          "reviewPoint": "A, B, and ___ 병렬은 앞 요소와 같은 형태. 빈칸 뒤 목적어 유무도 확인하세요.",
          "topicId": "cc-parallel"
        }
      ],
      "sources": [
        "relative",
        "cause",
        "conditions",
        "before",
        "until",
        "during",
        "since",
        "within",
        "comparison",
        "comparison-as",
        "comparison-adverbs",
        "comparison-very",
        "relative-top-2025",
        "relative-flow-2025",
        "relative-x434-2026"
      ],
      "archivedExamples": [
        {
          "en": "The store will stay open late provided that enough staff are available.",
          "ko": "충분한 직원이 근무 가능하다는 조건으로 매장은 늦게까지 문을 엽니다.",
          "focus": [
            "provided that"
          ],
          "why": "provided that은 '~라는 조건으로'라는 접속사로, 뒤에 주어(enough staff) + 동사(are) 절이 옵니다.",
          "topicId": "cc-conj-prep"
        },
        {
          "en": "The new printer is fast; however, it uses a lot of toner.",
          "ko": "새 프린터는 빠릅니다. 하지만 토너를 많이 사용합니다.",
          "focus": [
            "; however,"
          ],
          "why": "however는 접속부사라 두 절을 쉼표만으로 잇지 못합니다. 세미콜론으로 문장을 나눈 뒤 대조를 나타냅니다.",
          "topicId": "cc-conj-adverb"
        },
        {
          "en": "Please let us know whether you will attend the awards dinner.",
          "ko": "시상식 만찬에 참석하실지 알려 주세요.",
          "focus": [
            "whether you will attend"
          ],
          "why": "whether절은 know의 목적어인 명사절이며 '주어 + 동사' 어순입니다. 명사절이므로 미래 일에 will을 씁니다.",
          "topicId": "cc-noun-clause"
        },
        {
          "en": "The supplier whose prices were lowest was awarded the contract.",
          "ko": "가격이 가장 낮았던 공급업체가 계약을 따냈습니다.",
          "focus": [
            "whose prices"
          ],
          "why": "whose는 '그 공급업체의'라는 소유 관계를 나타내며 바로 뒤에 명사 prices가 옵니다. 관계절 뒤 본동사는 단수 supplier에 맞춘 was입니다.",
          "topicId": "cc-relative"
        },
        {
          "en": "The report that Mr. Han submitted shows that costs fell in May.",
          "ko": "한 씨가 제출한 보고서는 5월에 비용이 줄었다는 것을 보여 줍니다.",
          "focus": [
            "that Mr. Han submitted",
            "that costs fell"
          ],
          "why": "첫 that 뒤는 submitted의 목적어가 빠진 불완전한 절이라 report를 꾸미는 관계대명사, 둘째 that 뒤는 완전한 절이라 shows의 목적어인 명사절입니다.",
          "topicId": "cc-that-test"
        }
      ],
      "reviewFocus": [
        "cc-conj-prep",
        "pc-phrase",
        "cc-relative"
      ],
      "priorityPolicy": "사용자 원오답·확인된 채점 오답 → 단어장 → 최근 교육자료·기본문법. 보기 출현을 선택한 오답으로 추정하지 않음.",
      "recentTypeSupport": []
    },
    {
      "id": "prepositions-comparison",
      "title": "Chapter 8 · 비교구문",
      "lead": "비교구문에서도 형용사·부사는 수식 대상에 따라 고릅니다. 원급·비교급·최상급의 형태와 비교급을 강조하는 말을 구별합니다.",
      "topics": [
        {
          "id": "pc-as-as",
          "title": "원급 비교 as ... as",
          "concept": "as와 as 사이 단어의 품사는 as를 지웠을 때의 문장 구조로 정합니다. 동사를 꾸미면 부사(runs as quietly as), 보어나 명사 수식이면 형용사(is as quiet as)입니다.",
          "examType": "as ___ as 사이 형용사 vs 부사",
          "memory": [
            {
              "pattern": "be + as 형용사 as",
              "meaning": "~만큼 …한",
              "note": "is as reliable as"
            },
            {
              "pattern": "V + as 부사 as",
              "meaning": "~만큼 …하게",
              "note": "uses fuel as efficiently as"
            },
            {
              "pattern": "as many/much + 명사 + as",
              "meaning": "~만큼 많은 …",
              "note": "as many seats as"
            },
            {
              "pattern": "as many + 복수명사 + as",
              "meaning": "~만큼 많은 수",
              "note": "as many applicants as",
              "basis": "general_grammar"
            },
            {
              "pattern": "as much + 불가산명사 + as",
              "meaning": "~만큼 많은 양",
              "note": "as much information as",
              "basis": "general_grammar"
            },
            {
              "pattern": "twice as + 형용사 + as",
              "meaning": "두 배만큼 ~한",
              "note": "twice as large as",
              "basis": "general_grammar"
            },
            {
              "pattern": "twice as + 부사 + as",
              "meaning": "두 배만큼 ~하게",
              "note": "twice as quickly as",
              "basis": "general_grammar"
            }
          ]
        },
        {
          "id": "pc-comparative",
          "title": "원급 → 비교급 → 비교급 강조: more 뒤 품사",
          "concept": "원급은 비교급으로 바꾸기 전 형태입니다. 형용사·부사 모두 원급과 비교급이 있습니다. more 뒤 품사는 수식 대상에 따라 정합니다.",
          "examType": "be more efficient vs work more efficiently / 비교급 앞 강조 / more + 명사",
          "memory": [
            {
              "pattern": "higher + 명사",
              "meaning": "더 높은 ~",
              "note": "1회125 원오답·온라인 오답 확인",
              "basis": "general_grammar",
              "priorityBasis": "graded_wrong",
              "priorityEvidence": "1회125 원오답 및 온라인 오답 확인"
            },
            {
              "pattern": "more + 형용사 + than",
              "meaning": "~보다 더 ~한",
              "note": "more reliable than",
              "basis": "general_grammar"
            },
            {
              "pattern": "more + 부사 + than",
              "meaning": "~보다 더 ~하게",
              "note": "more effectively than",
              "basis": "general_grammar"
            },
            {
              "pattern": "less + 형용사 + than",
              "meaning": "~보다 덜 ~한",
              "note": "less expensive than",
              "basis": "general_grammar"
            },
            {
              "pattern": "fewer + 복수명사",
              "meaning": "더 적은 수",
              "note": "fewer errors",
              "basis": "general_grammar"
            },
            {
              "pattern": "less + 불가산명사",
              "meaning": "더 적은 양",
              "note": "less information",
              "basis": "general_grammar"
            },
            {
              "pattern": "good → better → best",
              "meaning": "좋은",
              "note": "형용사 불규칙",
              "basis": "general_grammar"
            },
            {
              "pattern": "well → better → best",
              "meaning": "잘",
              "note": "부사 불규칙",
              "basis": "general_grammar"
            },
            {
              "pattern": "bad → worse → worst",
              "meaning": "나쁜",
              "note": "불규칙",
              "basis": "general_grammar"
            },
            {
              "pattern": "many → more → most",
              "meaning": "많은 수",
              "note": "불규칙",
              "basis": "general_grammar"
            },
            {
              "pattern": "much → more → most",
              "meaning": "많은 양",
              "note": "불규칙",
              "basis": "general_grammar"
            },
            {
              "pattern": "the + 비교급, the + 비교급",
              "meaning": "~할수록 더 ~하다",
              "note": "두 변화의 관계",
              "basis": "general_grammar"
            },
            {
              "pattern": "no later than",
              "meaning": "늦어도 ~까지",
              "note": "마감",
              "basis": "general_grammar"
            },
            {
              "pattern": "no more than",
              "meaning": "많아야·고작",
              "note": "문맥별 제한·강조",
              "basis": "general_grammar"
            },
            {
              "pattern": "at least",
              "meaning": "적어도",
              "note": "최소",
              "basis": "general_grammar"
            },
            {
              "pattern": "at most",
              "meaning": "많아야",
              "note": "최대",
              "basis": "general_grammar"
            },
            {
              "pattern": "be more efficient",
              "meaning": "더 효율적인 상태",
              "note": "형용사 efficient: 주어의 상태 설명"
            },
            {
              "pattern": "work more efficiently",
              "meaning": "더 효율적으로 일하다",
              "note": "부사 efficiently: 동작 수식"
            },
            {
              "pattern": "fast → faster",
              "meaning": "빠르게 → 더 빠르게",
              "note": "much faster O / more faster ✗"
            },
            {
              "pattern": "as + 형용사/부사 원급 + as",
              "meaning": "~만큼 …한 / …하게",
              "note": "as efficient as / as efficiently as"
            },
            {
              "pattern": "much / far / a lot + 비교급",
              "meaning": "훨씬 더",
              "note": "much more efficient"
            },
            {
              "pattern": "even / still + 비교급",
              "meaning": "한층 더",
              "note": "even faster / still better"
            },
            {
              "pattern": "considerably / significantly + 비교급",
              "meaning": "상당히 더",
              "note": "significantly more efficiently"
            },
            {
              "pattern": "slightly / a little + 비교급",
              "meaning": "약간 더",
              "note": "slightly faster"
            },
            {
              "pattern": "very + 원급 / much + 비교급",
              "meaning": "매우 / 훨씬 더",
              "note": "very efficient O, very more efficient ✗. very much better는 가능"
            },
            {
              "pattern": "more time / more employees",
              "meaning": "더 많은 시간 / 직원",
              "note": "more 뒤가 수량을 나타내는 명사일 수도 있음"
            }
          ],
          "reviewFocus": true,
          "reviewBlocks": [
            {
              "title": "more는 비교급 · much는 강조",
              "lines": [
                "effectively → more effectively → much more effectively",
                "효과적으로 → 더 효과적으로 → 훨씬 더 효과적으로"
              ]
            }
          ]
        },
        {
          "id": "pc-superlative",
          "title": "최상급과 ever · yet · possible",
          "concept": "최상급은 비교 범위에서 가장 높은 정도를 나타냅니다. 명사 앞에서는 the largest처럼 쓰지만 our best proposal, works fastest처럼 the가 없는 구조도 있습니다. ever/yet/possible은 경험·현재까지·가능한 범위를 보충합니다.",
          "examType": "the ___ of 범위 / 최상급 + ever",
          "memory": [
            {
              "pattern": "the -est / the most + 형용사 + of 복수명사",
              "meaning": "~ 중 가장",
              "note": "the most detailed of all"
            },
            {
              "pattern": "the -est + 명사 + (that) S have ever p.p.",
              "meaning": "지금까지 ~한 것 중 가장",
              "note": "the largest order we have ever received"
            },
            {
              "pattern": "the -est ... possible / yet",
              "meaning": "가능한 한 가장 / 지금까지 가장",
              "note": "the lowest price possible"
            },
            {
              "pattern": "소유격 + 최상급 + N",
              "meaning": "소유격이 한정",
              "note": "our most recent report",
              "basis": "general_grammar"
            },
            {
              "pattern": "one of the + 최상급 + 복수명사",
              "meaning": "가장 ~한 것들 중 하나",
              "note": "one of the best options",
              "basis": "general_grammar"
            },
            {
              "pattern": "by far the + 최상급",
              "meaning": "단연 가장 ~한",
              "note": "by far the largest",
              "basis": "general_grammar"
            },
            {
              "pattern": "very + 원급",
              "meaning": "매우 ~한",
              "note": "very effective",
              "basis": "general_grammar"
            },
            {
              "pattern": "much + 비교급",
              "meaning": "훨씬 더 ~한",
              "note": "much more effective",
              "basis": "general_grammar"
            }
          ]
        }
      ],
      "examples": [
        {
          "en": "The revised process is much more efficient than the old one.",
          "ko": "개정된 절차는 이전 절차보다 훨씬 더 효율적입니다.",
          "focus": [
            "is much more efficient"
          ],
          "why": "주어 process의 상태를 설명하는 형용사 efficient. more가 비교급, much가 차이를 강조합니다.",
          "topicId": "pc-comparative",
          "exampleKind": "authored_learning"
        },
        {
          "en": "The team now processes orders much more efficiently than before.",
          "ko": "그 팀은 이제 이전보다 주문을 훨씬 더 효율적으로 처리합니다.",
          "focus": [
            "processes orders much more efficiently"
          ],
          "why": "동사 processes를 꾸미므로 부사 efficiently. more 뒤라는 이유로 형용사를 고르지 않습니다.",
          "topicId": "pc-comparative",
          "exampleKind": "authored_learning"
        },
        {
          "en": "This machine is as efficient as the larger model and works as efficiently as expected.",
          "ko": "이 기계는 더 큰 모델만큼 효율적이며 예상한 만큼 효율적으로 작동합니다.",
          "focus": [
            "as efficient as",
            "as efficiently as"
          ],
          "why": "is의 보어는 efficient, works의 수식어는 efficiently. 둘 다 as … as 안에서는 원급입니다.",
          "topicId": "pc-comparative",
          "exampleKind": "authored_learning"
        },
        {
          "en": "The new scanner reads labels slightly faster than the previous model.",
          "ko": "새 스캐너는 이전 모델보다 라벨을 약간 더 빠르게 읽습니다.",
          "focus": [
            "reads labels slightly faster"
          ],
          "why": "동사 reads를 수식하는 부사 fast의 비교급 faster. slightly는 약간의 차이를 나타냅니다.",
          "topicId": "pc-comparative",
          "exampleKind": "authored_learning"
        },
        {
          "en": "We need more employees, but we have considerably more time to recruit them.",
          "ko": "직원이 더 필요하지만, 그들을 채용할 시간은 상당히 더 많습니다.",
          "focus": [
            "more employees"
          ],
          "why": "employees와 time은 수량 비교의 명사입니다. considerably는 more time의 차이를 강조합니다.",
          "topicId": "pc-comparative",
          "exampleKind": "authored_learning"
        }
      ],
      "practice": [
        {
          "id": "c2-1",
          "stem": "To join the afternoon shipment, all orders must be confirmed _____ noon.",
          "choices": [
            "until",
            "during",
            "by",
            "for"
          ],
          "answer": 2,
          "reason": "확인이 완료되어야 하는 마감 시각이므로 by입니다.",
          "translation": "오후 발송에 포함되려면 모든 주문을 정오까지 확정해야 합니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "until",
              "correct": false,
              "explanation": "전치사·~까지 계속. 확정을 끝내야 할 마감이므로 지속 끝점을 나타내는 until은 맞지 않습니다."
            },
            {
              "label": "B",
              "text": "during",
              "correct": false,
              "explanation": "전치사·특정 기간 중. noon은 이 문장에서 한 시점인 마감이며 기간·행사가 아닙니다."
            },
            {
              "label": "C",
              "text": "by",
              "correct": true,
              "explanation": "전치사·늦어도 ~까지. 오후 발송에 넣기 위한 주문 확정 마감이 정오입니다."
            },
            {
              "label": "D",
              "text": "for",
              "correct": false,
              "explanation": "전치사·~동안. noon은 지속 시간의 길이가 아닙니다."
            }
          ],
          "reviewPoint": "완료 마감 by와 지속 끝점 until을 한국어 “까지”만 보고 혼동하지 마세요.",
          "topicId": "pc-time"
        },
        {
          "id": "c2-2",
          "stem": "The service counter will remain open _____ eight this evening.",
          "choices": [
            "until",
            "within",
            "since",
            "for"
          ],
          "answer": 0,
          "reason": "열려 있는 상태가 8시까지 계속되므로 until입니다.",
          "translation": "서비스 창구는 오늘 저녁 8시까지 운영됩니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "until",
              "correct": true,
              "explanation": "전치사·~까지 계속. remain open의 열린 상태가 오늘 저녁 8시까지 이어집니다."
            },
            {
              "label": "B",
              "text": "within",
              "correct": false,
              "explanation": "전치사·~이내. eight this evening은 기간 길이가 아니고, 문장도 완료 한도를 말하지 않습니다."
            },
            {
              "label": "C",
              "text": "since",
              "correct": false,
              "explanation": "전치사·~이래로. 미래의 열린 상태를 말하는 will remain과 오늘 저녁의 끝점에 맞지 않습니다."
            },
            {
              "label": "D",
              "text": "for",
              "correct": false,
              "explanation": "전치사·~동안. eight this evening은 기간 길이가 아닌 시각입니다."
            }
          ],
          "reviewPoint": "remain open until + 시각: 그 시각까지 운영하다.",
          "topicId": "pc-time"
        },
        {
          "id": "c2-3",
          "stem": "The printer has been out of service _____ a while.",
          "choices": [
            "during",
            "since",
            "by",
            "for"
          ],
          "answer": 3,
          "reason": "a while은 지속 시간의 길이를 나타내므로 for입니다.",
          "translation": "프린터는 한동안 고장 난 상태입니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "during",
              "correct": false,
              "explanation": "전치사·특정 기간 중. a while은 여기서 고장이 지속된 길이를 나타내므로 during보다 for가 맞습니다."
            },
            {
              "label": "B",
              "text": "since",
              "correct": false,
              "explanation": "전치사·~이래로. 시작점이 필요하지만 a while은 기간의 길이입니다."
            },
            {
              "label": "C",
              "text": "by",
              "correct": false,
              "explanation": "전치사·완료 기한까지. 고장 상태의 지속 길이를 나타내지 못합니다."
            },
            {
              "label": "D",
              "text": "for",
              "correct": true,
              "explanation": "전치사·~동안. for a while은 한동안 지속됐다는 표현입니다."
            }
          ],
          "reviewPoint": "for a while처럼 숫자가 없는 기간 길이에도 for를 씁니다.",
          "topicId": "pc-time"
        },
        {
          "id": "c2-4",
          "stem": "Several employees raised questions _____ the annual budget meeting, briefly interrupting the presentation.",
          "choices": [
            "while",
            "during",
            "since",
            "within"
          ],
          "answer": 1,
          "reason": "특정 행사인 예산 회의 중에 일어난 일이므로 during입니다.",
          "translation": "여러 직원이 연례 예산 회의 중에 질문하며 발표를 잠깐 중단시켰습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "while",
              "correct": false,
              "explanation": "접속사·~하는 동안. 뒤가 명사구 the annual budget meeting이므로 이 자리에는 while이 맞지 않습니다."
            },
            {
              "label": "B",
              "text": "during",
              "correct": true,
              "explanation": "전치사·~중에. 회의 발표를 중단시키며 질문했다는 특정 행사 중의 상황입니다."
            },
            {
              "label": "C",
              "text": "since",
              "correct": false,
              "explanation": "전치사·~이래로. 회의 이후의 경과가 아니라 발표 도중 질문한 문맥입니다."
            },
            {
              "label": "D",
              "text": "within",
              "correct": false,
              "explanation": "전치사·~이내/범위 안에. 이 문맥은 기한·내부 범위를 설정하지 않고 회의 중 발생한 일을 말합니다."
            }
          ],
          "reviewPoint": "during + 행사명과 while + 주어·동사를 비교하세요.",
          "topicId": "pc-time"
        },
        {
          "id": "c2-6",
          "stem": "Our support team will respond _____ two business days of receiving your request.",
          "choices": [
            "until",
            "since",
            "within",
            "during"
          ],
          "answer": 2,
          "reason": "접수 후 영업일 이틀을 넘기지 않는 기한이므로 within입니다.",
          "translation": "지원팀은 요청을 받은 후 영업일 기준 이틀 이내에 답변할 것입니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "until",
              "correct": false,
              "explanation": "전치사·~까지 계속. 회신을 완료할 허용 기간을 말하므로 until을 쓰지 않습니다."
            },
            {
              "label": "B",
              "text": "since",
              "correct": false,
              "explanation": "전치사·~이래로. two business days는 시작점이 아닌 기간 길이입니다."
            },
            {
              "label": "C",
              "text": "within",
              "correct": true,
              "explanation": "전치사·~이내. 요청 접수 후 영업일 이틀을 넘기지 않고 회신한다는 기한입니다."
            },
            {
              "label": "D",
              "text": "during",
              "correct": false,
              "explanation": "전치사·기간 중. two business days of receiving은 여기서 한도를 나타내므로 within이 자연스럽습니다."
            }
          ],
          "reviewPoint": "within + 기간 + of -ing: 그 일을 한 때부터 해당 기간 이내.",
          "topicId": "pc-time"
        },
        {
          "id": "pc-06",
          "stem": "Please arrive at the venue at least 30 minutes _____ the start of the awards ceremony.",
          "choices": [
            "previously",
            "ago",
            "before that",
            "prior to"
          ],
          "answer": 3,
          "reason": "뒤에 명사구 the start of the awards ceremony가 오므로 '~전에'를 뜻하는 복합전치사 prior to가 필요합니다.",
          "translation": "시상식 시작 최소 30분 전에 행사장에 도착해 주세요.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "previously",
              "correct": false,
              "explanation": "부사·이전에. 부사는 뒤에 명사구 목적어를 받지 못합니다."
            },
            {
              "label": "B",
              "text": "ago",
              "correct": false,
              "explanation": "부사·(지금부터) ~전에. 현재 기준의 과거를 말할 때 기간 뒤에만 쓰며, 뒤에 명사구를 이어 받지 못합니다."
            },
            {
              "label": "C",
              "text": "before that",
              "correct": false,
              "explanation": "'그 전에'라는 부사구. that이 이미 대상을 가리켜 뒤의 명사구 the start ...와 연결되지 않습니다."
            },
            {
              "label": "D",
              "text": "prior to",
              "correct": true,
              "explanation": "복합전치사·~전에. 30 minutes prior to + 명사구로 기준 시점보다 30분 앞섬을 나타냅니다."
            }
          ],
          "reviewPoint": "기간 + prior to/before + 명사구 = 그 시점보다 ~ 전에. ago는 현재 기준 과거에만 씁니다.",
          "topicId": "pc-phrase"
        },
        {
          "id": "pc-07",
          "stem": "The new delivery van uses fuel as _____ as the hybrid model the company tested last year.",
          "choices": [
            "efficiently",
            "efficient",
            "efficiency",
            "more efficient"
          ],
          "answer": 0,
          "reason": "as ... as를 지우면 uses fuel ___가 남으므로 동사 uses를 꾸미는 부사 efficiently입니다.",
          "translation": "새 배송용 밴은 회사가 작년에 시험한 하이브리드 모델만큼 연료를 효율적으로 사용합니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "efficiently",
              "correct": true,
              "explanation": "부사·효율적으로. 연료를 사용하는 방식을 설명하며 as ... as 원급 비교를 완성합니다."
            },
            {
              "label": "B",
              "text": "efficient",
              "correct": false,
              "explanation": "형용사. uses fuel 뒤 완성된 문장에 덧붙는 자리이므로 동사를 꾸미는 부사가 필요합니다."
            },
            {
              "label": "C",
              "text": "efficiency",
              "correct": false,
              "explanation": "명사·효율. as ... as 사이에 명사 단독은 오지 않으며(as much efficiency as는 별도 구조), 동사를 꾸미지도 못합니다."
            },
            {
              "label": "D",
              "text": "more efficient",
              "correct": false,
              "explanation": "비교급 형용사. 원급 비교 as ... as 안에 비교급을 쓰지 않습니다."
            }
          ],
          "reviewPoint": "as ___ as: as를 지우고 남은 문장에서 형용사 자리인지 부사 자리인지 정하세요.",
          "topicId": "pc-as-as"
        },
        {
          "id": "pc-08",
          "stem": "Online sales were _____ higher this quarter than in the same period last year.",
          "choices": [
            "more",
            "much",
            "very",
            "most"
          ],
          "answer": 1,
          "reason": "비교급 higher를 강조하는 부사는 much입니다.",
          "translation": "이번 분기 온라인 매출은 작년 같은 기간보다 훨씬 높았습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "more",
              "correct": false,
              "explanation": "비교급 표지. 이미 -er 비교급인 higher 앞에 more를 겹쳐 쓰지 않습니다."
            },
            {
              "label": "B",
              "text": "much",
              "correct": true,
              "explanation": "비교급 강조 부사·훨씬. much higher than으로 차이를 강조합니다."
            },
            {
              "label": "C",
              "text": "very",
              "correct": false,
              "explanation": "원급을 강조하는 부사로, 비교급 higher 앞에는 쓰지 않습니다."
            },
            {
              "label": "D",
              "text": "most",
              "correct": false,
              "explanation": "최상급 표지. 비교급 higher와 함께 쓸 수 없습니다."
            }
          ],
          "reviewPoint": "비교급 강조: much / even / far / still / a lot. very는 원급용입니다.",
          "topicId": "pc-comparative"
        },
        {
          "id": "pc-09",
          "stem": "Ms. Ahn's proposal was the _____ of all the submissions the committee reviewed this year.",
          "choices": [
            "detailed",
            "detail",
            "most detailed",
            "more detailed"
          ],
          "answer": 2,
          "reason": "the ___ of all the submissions(모든 제출물 중)라는 비교 범위가 있으므로 최상급 most detailed입니다.",
          "translation": "안 씨의 제안서는 위원회가 올해 검토한 모든 제출물 중 가장 상세했습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "detailed",
              "correct": false,
              "explanation": "원급 형용사. the detailed of all은 비교 범위와 맞지 않는 불완전한 표현입니다."
            },
            {
              "label": "B",
              "text": "detail",
              "correct": false,
              "explanation": "명사·세부 사항. 제안서를 모든 제출물 중 '세부 사항'이라고 할 수 없습니다."
            },
            {
              "label": "C",
              "text": "most detailed",
              "correct": true,
              "explanation": "최상급·가장 상세한. the + 최상급 + of all ~로 여러 제출물 중 최고를 나타냅니다."
            },
            {
              "label": "D",
              "text": "more detailed",
              "correct": false,
              "explanation": "more detailed는 더 상세한이라는 비교급입니다. of all the submissions가 정한 전체 범위에서 가장 상세한 것을 말하므로 최상급이 필요합니다. than 생략 자체를 오답 근거로 삼지 않습니다."
            }
          ],
          "reviewPoint": "the + ___ + of/in + 범위 → 최상급. than이 있으면 비교급.",
          "topicId": "pc-superlative"
        },
        {
          "id": "pc-10",
          "stem": "The redesigned app now loads in under two seconds. As a result, customers are placing _____ orders through the app than through the website.",
          "choices": [
            "most",
            "much",
            "many",
            "more"
          ],
          "answer": 3,
          "reason": "than과 짝을 이루어 복수명사 orders의 수량을 비교하므로 more입니다. 앞 문장의 개선이 주문 증가의 원인입니다.",
          "translation": "재설계된 앱은 이제 2초 안에 로딩됩니다. 그 결과 고객들은 웹사이트보다 앱을 통해 더 많이 주문하고 있습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "most",
              "correct": false,
              "explanation": "최상급. than과 짝을 이루지 않습니다."
            },
            {
              "label": "B",
              "text": "much",
              "correct": false,
              "explanation": "불가산명사용 수량어. 복수 가산명사 orders 앞에 쓰지 않으며, 비교급도 아닙니다."
            },
            {
              "label": "C",
              "text": "many",
              "correct": false,
              "explanation": "원급 수량어. 가산 복수명사에는 맞지만 than과 함께 비교를 만들 수 없습니다."
            },
            {
              "label": "D",
              "text": "more",
              "correct": true,
              "explanation": "many의 비교급·더 많은. more orders ... than으로 두 경로의 주문 수를 비교합니다."
            }
          ],
          "reviewPoint": "more는 비교급 표지이자 '더 많은 + 명사'. than이 보이면 비교급을 찾으세요.",
          "topicId": "pc-comparative"
        }
      ],
      "sources": [
        "until",
        "during",
        "since",
        "within",
        "comparison",
        "comparison-as",
        "comparison-adverbs",
        "comparison-very",
        "ybm-basic-2025"
      ],
      "reviewFocus": [
        {
          "topicId": "pc-comparative",
          "label": "원급 · 비교급 · 비교급 강조"
        }
      ],
      "archivedExamples": [
        {
          "en": "Please return the signed form by June 3; the office is open until 6 p.m. that day.",
          "ko": "서명한 양식을 6월 3일까지 반납해 주세요. 그날 사무실은 오후 6시까지 엽니다.",
          "focus": [
            "by June 3",
            "until 6 p.m."
          ],
          "why": "반납을 끝내야 하는 마감은 by, 사무실이 열린 상태가 이어지는 끝점은 until입니다.",
          "topicId": "pc-time"
        },
        {
          "en": "In addition to free parking, hotel guests receive a breakfast voucher.",
          "ko": "무료 주차에 더해 호텔 투숙객은 조식 쿠폰을 받습니다.",
          "focus": [
            "In addition to free parking"
          ],
          "why": "in addition to는 전치사구이므로 뒤에 명사구 free parking이 옵니다. 동사가 오면 -ing(in addition to offering)로 씁니다.",
          "topicId": "pc-phrase"
        },
        {
          "en": "The new model runs as quietly as the old one.",
          "ko": "새 모델은 이전 모델만큼 조용하게 작동합니다.",
          "focus": [
            "runs as quietly as"
          ],
          "why": "as ... as를 지우면 runs quietly가 남습니다. 동사 runs를 꾸미므로 부사 quietly입니다.",
          "topicId": "pc-as-as"
        },
        {
          "en": "This year's trade fair attracted far more exhibitors than last year's.",
          "ko": "올해 무역 박람회는 작년보다 훨씬 많은 출품 업체를 모았습니다.",
          "focus": [
            "far more exhibitors than"
          ],
          "why": "more는 '더 많은'이라는 수량 의미로 명사 exhibitors를 꾸미고, far가 비교급을 강조합니다.",
          "topicId": "pc-comparative"
        },
        {
          "en": "This is the largest order we have ever received from a single client.",
          "ko": "이것은 단일 고객에게서 받은 주문 중 가장 큰 주문입니다.",
          "focus": [
            "the largest order",
            "have ever received"
          ],
          "why": "최상급 the largest 뒤 관계절에서 ever + 현재완료로 '지금까지 받아 본 것 중'이라는 범위를 나타냅니다.",
          "topicId": "pc-superlative"
        }
      ],
      "priorityPolicy": "사용자 원오답·확인된 채점 오답 → 단어장 → 최근 교육자료·기본문법. 보기 출현을 선택한 오답으로 추정하지 않음.",
      "recentTypeSupport": [
        "목적격보어의 비교급 형용사"
      ]
    },
    {
      "id": "conditionals",
      "title": "Chapter 9 · 가정법",
      "lead": "실제로 가능한 조건인지, 현재·과거 사실의 반대인지 먼저 정하고 if절과 주절의 시제 짝을 맞추세요. 도치(Had/Should/Were)는 if를 지운 형태입니다.",
      "topics": [
        {
          "id": "cd-real",
          "title": "실제 조건: if + 현재, will",
          "concept": "실제로 일어날 수 있는 미래 조건은 if절에 현재 시제, 주절에 will/can/명령문을 씁니다. 가정법과 구별하기 위한 출발점입니다.",
          "examType": "if절 현재 vs 가정법 과거 구별",
          "memory": [
            {
              "pattern": "If + S + 현재, S + will/can + 원형",
              "meaning": "~하면 …할 것이다",
              "note": "If it is out of stock, we will ..."
            },
            {
              "pattern": "If + S + 현재, 명령문",
              "meaning": "~하면 …하세요",
              "note": "If you need help, call ..."
            },
            {
              "pattern": "If + 현재, 현재",
              "meaning": "일반 사실·반복 결과",
              "note": "현실 조건",
              "basis": "general_grammar"
            },
            {
              "pattern": "on condition that + 절",
              "meaning": "~라는 조건으로",
              "note": "조건 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "provided (that) + 절",
              "meaning": "~라는 조건으로",
              "note": "조건 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "providing (that) + 절",
              "meaning": "~라는 조건으로",
              "note": "조건 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "as long as + 절",
              "meaning": "~하는 한",
              "note": "조건 연결",
              "basis": "general_grammar"
            },
            {
              "pattern": "unless + 절",
              "meaning": "~하지 않는 한",
              "note": "if ... not과 문맥 비교",
              "basis": "general_grammar"
            },
            {
              "pattern": "even if + 절",
              "meaning": "설령 ~하더라도",
              "note": "가정 양보",
              "basis": "general_grammar"
            },
            {
              "pattern": "in case + 절",
              "meaning": "혹시 ~할 경우에 대비하여",
              "note": "단순 if와 의미가 항상 같지 않음",
              "basis": "general_grammar"
            },
            {
              "pattern": "in case of + 명사구",
              "meaning": "~의 경우에는",
              "note": "전치사구",
              "basis": "general_grammar"
            },
            {
              "pattern": "제안·요구 that절",
              "meaning": "동사원형·be p.p.·not V",
              "note": "Chapter5 요구·제안 표에서 전체 목록 확인",
              "basis": "general_grammar"
            }
          ]
        },
        {
          "id": "cd-past-subj",
          "title": "가정법 과거: 현재 사실의 반대",
          "concept": "지금 사실과 다른 상황을 상상할 때 if절에 과거형(be는 주로 were), 주절에 would/could/might + 원형을 씁니다. 형태는 과거지만 뜻은 현재입니다.",
          "examType": "If + 과거, would + 원형 짝 맞추기",
          "memory": [
            {
              "pattern": "If + S + 과거, S + would/could + 원형",
              "meaning": "(지금) ~라면 …할 텐데",
              "note": "If we had more space, we could ..."
            },
            {
              "pattern": "If S were ...",
              "meaning": "be동사 가정",
              "note": "구어에서는 was도 쓰임"
            },
            {
              "pattern": "if + 과거, might V",
              "meaning": "가능성·가정 결과",
              "note": "현재와 다른 가정",
              "basis": "general_grammar"
            },
            {
              "pattern": "if + 과거, could V",
              "meaning": "능력·가능성 가정",
              "note": "현재와 다른 가정",
              "basis": "general_grammar"
            }
          ]
        },
        {
          "id": "cd-past-perfect",
          "title": "가정법 과거완료 · would/could have p.p.",
          "concept": "과거 사실과 다른 상황은 if절에 had p.p., 주절에 would/could/might have p.p.를 씁니다. if절 없이도 would have p.p.는 '(그랬다면) ~했을 것이다', otherwise 뒤에서도 쓰입니다.",
          "examType": "If + had p.p., would have p.p. / otherwise + would have p.p.",
          "memory": [
            {
              "pattern": "would not have been able to V",
              "meaning": "~할 수 없었을 것이다",
              "note": "사용자 단어장",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장"
            },
            {
              "pattern": "would have been able to V",
              "meaning": "~할 수 있었을 것이다",
              "note": "사용자 단어장",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장"
            },
            {
              "pattern": "If + had p.p., would/could have p.p.",
              "meaning": "(그때) ~했다면 …했을 텐데",
              "note": "과거 사실의 반대"
            },
            {
              "pattern": "would / could have p.p. 단독",
              "meaning": "~했을 것이다 / ~할 수 있었을 것이다",
              "note": "가정 조건이 문맥에 숨어 있음"
            },
            {
              "pattern": "; otherwise, S + would have p.p.",
              "meaning": "그렇지 않았다면",
              "note": "앞 문장이 실제 사실"
            },
            {
              "pattern": "if + had p.p., might have p.p.",
              "meaning": "과거 가능성 가정",
              "note": "결과의 확실성 단정 금지",
              "basis": "general_grammar"
            },
            {
              "pattern": "should have p.p.",
              "meaning": "~했어야 했다",
              "note": "단어장; 후회·비판 등",
              "basis": "general_grammar"
            },
            {
              "pattern": "might have p.p.",
              "meaning": "~했을지도 모른다",
              "note": "단어장; 과거 추측도 가능",
              "basis": "general_grammar"
            },
            {
              "pattern": "could have p.p.",
              "meaning": "~할 수도 있었다",
              "note": "단어장; 능력·가능성 등 문맥 확인",
              "basis": "general_grammar"
            }
          ]
        },
        {
          "id": "cd-mixed",
          "title": "혼합 가정: 과거 조건 → 현재 결과",
          "concept": "과거에 일어나지 않은 일이 지금에 영향을 준다고 가정할 때 if절 had p.p. + 주절 would + 원형(now)을 씁니다. 주절에 진행형(would be -ing)도 가능합니다.",
          "examType": "시간 단서(last year ↔ now)로 if절·주절 시제 결정",
          "memory": [
            {
              "pattern": "If + had p.p. (과거), would + 원형 (now)",
              "meaning": "그때 ~했다면 지금 …할 텐데",
              "note": "시간 단서를 각각 확인"
            },
            {
              "pattern": "would be -ing",
              "meaning": "지금 ~하고 있을 텐데",
              "note": "진행형 결과도 유효"
            }
          ]
        },
        {
          "id": "cd-inversion",
          "title": "if 생략 도치: Had · Should · Were",
          "concept": "if를 생략하면 조동사가 주어 앞으로 옵니다. Had + S + p.p.(과거완료 가정), Were + S ...(과거 가정), Should + S + 원형(혹시 ~하면, 공지문에서 자주 쓰임).",
          "examType": "문두 빈칸 Had / Should / Were",
          "memory": [
            {
              "pattern": "Had it not been for + N",
              "meaning": "~이 없었더라면",
              "note": "위 구문의 도치",
              "basis": "general_grammar",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장"
            },
            {
              "pattern": "Had + S + not p.p.",
              "meaning": "If + S + had not p.p.",
              "note": "not은 주어 뒤",
              "basis": "general_grammar"
            },
            {
              "pattern": "Were + S + 보어",
              "meaning": "If + S + were + 보어",
              "note": "현재 반대 가정",
              "basis": "general_grammar"
            },
            {
              "pattern": "Were + S + to V",
              "meaning": "If + S + were to V",
              "note": "가정 조건",
              "basis": "general_grammar"
            },
            {
              "pattern": "Should + S + V",
              "meaning": "If + S + should V",
              "note": "격식 있는 만일의 조건",
              "basis": "general_grammar"
            },
            {
              "pattern": "If it had not been for + N",
              "meaning": "~이 없었더라면",
              "note": "단어장 확인",
              "basis": "general_grammar"
            },
            {
              "pattern": "Had + S + p.p., S + would have p.p.",
              "meaning": "= If S had p.p.",
              "note": "Had the order been placed ..."
            },
            {
              "pattern": "Should + S + 원형, 명령문/will",
              "meaning": "= If S should ...",
              "note": "Should you have questions, ..."
            },
            {
              "pattern": "Were + S + 보어/to do, would + 원형",
              "meaning": "= If S were ...",
              "note": "Were I in charge, ..."
            }
          ]
        },
        {
          "id": "cd-wish-asif",
          "title": "wish · as if / as though",
          "concept": "wish 뒤에는 현재 사실 반대는 과거형(were), 과거 사실 반대는 had p.p.를 씁니다. as if / as though는 사실이 아닐 때 가정법(과거·과거완료)을 쓰고, 사실일 가능성이 있으면 직설법도 씁니다(It looks as if it is going to rain).",
          "examType": "wish + were / as if + had p.p.",
          "memory": [
            {
              "pattern": "I wish + S + had p.p.",
              "meaning": "먼저 구별할 내 자료",
              "note": "사용자 단어장",
              "priorityBasis": "vocabulary",
              "priorityEvidence": "사용자 단어장"
            },
            {
              "pattern": "S wish + S + 과거(were)",
              "meaning": "지금 ~라면 좋을 텐데",
              "note": "wish it were closer"
            },
            {
              "pattern": "S wish + S + had p.p.",
              "meaning": "그때 ~했다면 좋았을 텐데",
              "note": "과거 후회"
            },
            {
              "pattern": "as if / as though + 과거·had p.p.",
              "meaning": "마치 ~인 것처럼",
              "note": "사실일 수 있으면 직설법도 가능"
            },
            {
              "pattern": "would rather + V",
              "meaning": "차라리 ~하겠다",
              "note": "같은 주어의 선호",
              "basis": "general_grammar"
            },
            {
              "pattern": "would rather + S + 과거",
              "meaning": "S가 ~하면 좋겠다",
              "note": "현재·미래에 대한 바람",
              "basis": "general_grammar"
            },
            {
              "pattern": "as if + 일반 시제",
              "meaning": "실제 가능 상황일 수 있음",
              "note": "항상 비현실 가정은 아님",
              "basis": "general_grammar"
            },
            {
              "pattern": "as though + 일반 시제",
              "meaning": "실제 가능 상황일 수 있음",
              "note": "문맥으로 판단",
              "basis": "general_grammar"
            }
          ]
        },
        {
          "id": "cd-mandative",
          "group": "동사",
          "title": "제안·요구 that절의 원형",
          "concept": "제안·요구 의미의 동사·형용사·명사 뒤 that절에서는 동사원형 또는 should + 원형을 씁니다. 수동은 be + p.p., 부정은 not + 원형이며 사실의 시사·주장 의미는 일반 시제와 구별합니다.",
          "examType": "request that + 원형 / 수동 원형 be p.p.",
          "memory": [
            {
              "pattern": "request/require/recommend that S (should) + 원형",
              "meaning": "~해야 한다고 요청하다",
              "note": "수동은 be + p.p."
            },
            {
              "pattern": "The data suggest that S + 시제동사",
              "meaning": "자료가 ~을 시사하다",
              "note": "요구가 아니면 원형 아님"
            },
            {
              "pattern": "suggest that S + 원형",
              "meaning": "제안·요구·주장(해야 한다)의 의미",
              "note": "사실을 시사·주장하는 용법은 일반 시제",
              "basis": "general_grammar"
            },
            {
              "pattern": "recommend that S + 원형",
              "meaning": "제안·요구·주장(해야 한다)의 의미",
              "note": "사실을 시사·주장하는 용법은 일반 시제",
              "basis": "general_grammar"
            },
            {
              "pattern": "propose that S + 원형",
              "meaning": "제안·요구·주장(해야 한다)의 의미",
              "note": "사실을 시사·주장하는 용법은 일반 시제",
              "basis": "general_grammar"
            },
            {
              "pattern": "request that S + 원형",
              "meaning": "제안·요구·주장(해야 한다)의 의미",
              "note": "사실을 시사·주장하는 용법은 일반 시제",
              "basis": "general_grammar"
            },
            {
              "pattern": "demand that S + 원형",
              "meaning": "제안·요구·주장(해야 한다)의 의미",
              "note": "사실을 시사·주장하는 용법은 일반 시제",
              "basis": "general_grammar"
            },
            {
              "pattern": "require that S + 원형",
              "meaning": "제안·요구·주장(해야 한다)의 의미",
              "note": "사실을 시사·주장하는 용법은 일반 시제",
              "basis": "general_grammar"
            },
            {
              "pattern": "insist that S + 원형",
              "meaning": "제안·요구·주장(해야 한다)의 의미",
              "note": "사실을 시사·주장하는 용법은 일반 시제",
              "basis": "general_grammar"
            },
            {
              "pattern": "order that S + 원형",
              "meaning": "제안·요구·주장(해야 한다)의 의미",
              "note": "사실을 시사·주장하는 용법은 일반 시제",
              "basis": "general_grammar"
            },
            {
              "pattern": "urge that S + 원형",
              "meaning": "제안·요구·주장(해야 한다)의 의미",
              "note": "사실을 시사·주장하는 용법은 일반 시제",
              "basis": "general_grammar"
            },
            {
              "pattern": "advise that S + 원형",
              "meaning": "제안·요구·주장(해야 한다)의 의미",
              "note": "사실을 시사·주장하는 용법은 일반 시제",
              "basis": "general_grammar"
            },
            {
              "pattern": "essential that S + 원형",
              "meaning": "필요·중요 판단",
              "note": "should + V도 가능",
              "basis": "general_grammar"
            },
            {
              "pattern": "necessary that S + 원형",
              "meaning": "필요·중요 판단",
              "note": "should + V도 가능",
              "basis": "general_grammar"
            },
            {
              "pattern": "important that S + 원형",
              "meaning": "필요·중요 판단",
              "note": "should + V도 가능",
              "basis": "general_grammar"
            },
            {
              "pattern": "vital that S + 원형",
              "meaning": "필요·중요 판단",
              "note": "should + V도 가능",
              "basis": "general_grammar"
            },
            {
              "pattern": "imperative that S + 원형",
              "meaning": "필요·중요 판단",
              "note": "should + V도 가능",
              "basis": "general_grammar"
            },
            {
              "pattern": "recommendation that S + 원형",
              "meaning": "제안·요구 내용을 나타내는 명사",
              "note": "that절 내용 확인",
              "basis": "general_grammar"
            },
            {
              "pattern": "suggestion that S + 원형",
              "meaning": "제안·요구 내용을 나타내는 명사",
              "note": "that절 내용 확인",
              "basis": "general_grammar"
            },
            {
              "pattern": "proposal that S + 원형",
              "meaning": "제안·요구 내용을 나타내는 명사",
              "note": "that절 내용 확인",
              "basis": "general_grammar"
            },
            {
              "pattern": "that S + be p.p.",
              "meaning": "요구절의 수동 원형",
              "note": "recommend that the invoice be revised",
              "basis": "general_grammar"
            },
            {
              "pattern": "that S + not V",
              "meaning": "요구절의 부정",
              "note": "recommend that the file not be deleted",
              "basis": "general_grammar"
            },
            {
              "pattern": "suggest that + 일반 시제",
              "meaning": "~임을 시사하다",
              "note": "제안 의미와 구별",
              "basis": "general_grammar"
            },
            {
              "pattern": "insist that + 일반 시제",
              "meaning": "사실이라고 주장하다",
              "note": "해야 한다는 요구 의미와 구별",
              "basis": "general_grammar"
            }
          ]
        }
      ],
      "examples": [
        {
          "en": "If the shipment arrives today, we will start assembly tomorrow.",
          "ko": "배송품이 오늘 도착하면 내일 조립을 시작하겠습니다.",
          "focus": [
            "If the shipment arrives today",
            "we will start"
          ],
          "why": "실제로 일어날 수 있는 조건이므로 if절은 현재(arrives), 주절은 will + 원형입니다.",
          "topicId": "cd-real",
          "exampleKind": "authored_learning"
        },
        {
          "en": "If we had more storage space, we could keep extra stock on site.",
          "ko": "저장 공간이 더 있다면 현장에 여분 재고를 보관할 수 있을 텐데요.",
          "focus": [
            "If we had",
            "we could keep"
          ],
          "why": "지금 공간이 부족한 현실의 반대를 가정하므로 if절 과거(had), 주절 could + 원형입니다.",
          "topicId": "cd-past-subj",
          "exampleKind": "authored_learning"
        },
        {
          "en": "If the team had tested the update, the error would not have occurred.",
          "ko": "팀이 업데이트를 테스트했더라면 그 오류는 발생하지 않았을 것입니다.",
          "focus": [
            "had tested",
            "would not have occurred"
          ],
          "why": "과거에 테스트하지 않았다는 사실의 반대이므로 if절 had p.p., 주절 would have p.p.입니다.",
          "topicId": "cd-past-perfect",
          "exampleKind": "authored_learning"
        },
        {
          "en": "Should you have any questions, please contact Ms. Ruiz.",
          "ko": "혹시 문의 사항이 있으시면 루이스 씨에게 연락해 주세요.",
          "focus": [
            "Should you have"
          ],
          "why": "If you should have에서 if를 생략하고 Should를 주어 앞으로 보낸 도치입니다. 뒤에는 동사원형 have가 옵니다.",
          "topicId": "cd-inversion",
          "exampleKind": "authored_learning"
        },
        {
          "en": "Had I known about the sale, I would be using the new model now.",
          "ko": "할인 행사를 알았더라면 지금 새 모델을 쓰고 있을 텐데요.",
          "focus": [
            "Had I known",
            "would be using the new model now"
          ],
          "why": "과거에 몰랐던 일(Had I known = If I had known)이 지금의 결과(now)에 영향을 주는 혼합 가정입니다. 주절은 진행형 would be using도 가능합니다.",
          "topicId": "cd-mixed",
          "exampleKind": "authored_learning"
        }
      ],
      "practice": [
        {
          "id": "cd-01",
          "stem": "If the item you ordered _____ out of stock, we will notify you by e-mail within one business day.",
          "choices": [
            "will be",
            "were",
            "had been",
            "is"
          ],
          "answer": 3,
          "reason": "주절이 will notify인 실제 조건이므로 if절은 현재 시제 is입니다.",
          "translation": "주문하신 상품이 품절이면 영업일 기준 하루 이내에 이메일로 알려 드리겠습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "will be",
              "correct": false,
              "explanation": "미래. 조건 부사절에서는 미래 일을 현재 시제로 나타냅니다."
            },
            {
              "label": "B",
              "text": "were",
              "correct": false,
              "explanation": "가정법 과거. 주절이 would가 아니라 will이고, 품절은 실제로 일어날 수 있는 상황입니다."
            },
            {
              "label": "C",
              "text": "had been",
              "correct": false,
              "explanation": "과거완료. 과거 사실 반대 가정에 쓰며 주절 will notify와 시간이 맞지 않습니다."
            },
            {
              "label": "D",
              "text": "is",
              "correct": true,
              "explanation": "현재 시제. 실제로 일어날 수 있는 조건을 나타내며 주절 will과 짝이 맞습니다."
            }
          ],
          "reviewPoint": "주절 will → 실제 조건 → if절 현재. 주절 would → 가정법.",
          "topicId": "cd-real"
        },
        {
          "id": "cd-02",
          "stem": "The current budget leaves no room for additional staff. If the company _____ a larger marketing budget, it would hire two more designers.",
          "choices": [
            "had",
            "has",
            "will have",
            "having"
          ],
          "answer": 0,
          "reason": "주절이 would + 원형이고 지금 예산이 부족한 현실의 반대를 가정하므로 가정법 과거 had입니다.",
          "translation": "현재 예산으로는 직원을 추가할 여유가 없습니다. 더 큰 마케팅 예산이 있다면 디자이너 두 명을 더 채용할 텐데요.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "had",
              "correct": true,
              "explanation": "과거형. 현재 사실의 반대를 나타내는 가정법 과거로 주절 would hire와 짝을 이룹니다."
            },
            {
              "label": "B",
              "text": "has",
              "correct": false,
              "explanation": "has는 실제 현재 조건을 말합니다. 예산이 부족하다는 첫 문장의 현실을 반대로 가정하는 이 문맥에는 had가 맞습니다."
            },
            {
              "label": "C",
              "text": "will have",
              "correct": false,
              "explanation": "will have는 앞으로 예산을 갖게 될 일입니다. 현재 예산이 더 크다고 상상하는 가정의 시점·형태와 다릅니다."
            },
            {
              "label": "D",
              "text": "having",
              "correct": false,
              "explanation": "-ing형. if절의 주어 the company 뒤에 시제 동사가 필요합니다."
            }
          ],
          "reviewPoint": "If + 과거, would/could + 원형 = 지금 사실의 반대.",
          "topicId": "cd-past-subj"
        },
        {
          "id": "cd-03",
          "stem": "If Ms. Tan had left the office ten minutes earlier yesterday, she _____ the 6:15 express train.",
          "choices": [
            "had caught",
            "would have caught",
            "would catch",
            "will catch"
          ],
          "answer": 1,
          "reason": "어제 일어나지 않은 일(일찍 떠나지 않음)의 반대를 가정하고 결과도 어제 일이므로 would have caught입니다.",
          "translation": "탄 씨가 어제 사무실을 10분 일찍 나섰더라면 6시 15분 급행열차를 탔을 것입니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "had caught",
              "correct": false,
              "explanation": "과거완료. 주절에는 would/could have p.p.가 필요하며 had p.p.는 if절 형태입니다."
            },
            {
              "label": "B",
              "text": "would have caught",
              "correct": true,
              "explanation": "가정법 과거완료 주절. 어제 열차를 탔을 것이라는 과거 결과를 나타냅니다."
            },
            {
              "label": "C",
              "text": "would catch",
              "correct": false,
              "explanation": "would + 원형은 현재·미래 결과입니다. 어제의 특정 열차를 타는 일은 과거 결과라 맞지 않습니다."
            },
            {
              "label": "D",
              "text": "will catch",
              "correct": false,
              "explanation": "미래. 과거 사실 반대 가정(had left)과 짝이 맞지 않습니다."
            }
          ],
          "reviewPoint": "if절 had p.p. + 결과도 과거 → would have p.p. 결과가 지금이면 혼합 가정(would + 원형).",
          "topicId": "cd-past-perfect"
        },
        {
          "id": "cd-04",
          "stem": "_____ you require further assistance with your booking, please call our customer help line.",
          "choices": [
            "Were",
            "Had",
            "Should",
            "Would"
          ],
          "answer": 2,
          "reason": "If you should require에서 if를 생략한 도치이므로 Should + 주어 + 동사원형입니다.",
          "translation": "예약과 관련해 추가 도움이 필요하시면 고객 지원 전화로 연락해 주세요.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "Were",
              "correct": false,
              "explanation": "Were 도치 뒤에는 보어나 to부정사가 오며(Were you to require), 동사원형 require를 바로 받지 못합니다."
            },
            {
              "label": "B",
              "text": "Had",
              "correct": false,
              "explanation": "Had 도치 뒤에는 과거분사가 필요합니다(Had you required). 원형 require와 맞지 않습니다."
            },
            {
              "label": "C",
              "text": "Should",
              "correct": true,
              "explanation": "if 생략 도치·혹시 ~하면. Should you require + 원형으로 조건을 나타내고 주절은 명령문입니다."
            },
            {
              "label": "D",
              "text": "Would",
              "correct": false,
              "explanation": "Would you require ...는 의문문이 되어 쉼표 뒤 명령문과 조건 관계를 만들지 못합니다."
            }
          ],
          "reviewPoint": "Should + S + 원형 / Had + S + p.p. / Were + S + 보어·to do: 빈칸 뒤 동사 형태로 도치를 고르세요.",
          "topicId": "cd-inversion"
        },
        {
          "id": "cd-05",
          "stem": "_____ the order been placed on time, the materials would have arrived before the construction deadline.",
          "choices": [
            "If",
            "Has",
            "Were",
            "Had"
          ],
          "answer": 3,
          "reason": "주절이 would have arrived(과거 사실 반대)이고 빈칸 뒤가 주어 + been이므로 If the order had been placed의 도치 Had입니다.",
          "translation": "주문이 제때 들어갔더라면 자재가 공사 마감 전에 도착했을 것입니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "If",
              "correct": false,
              "explanation": "If를 쓰면 If the order had been placed로 had가 필요합니다. If the order been ...은 동사가 불완전합니다."
            },
            {
              "label": "B",
              "text": "Has",
              "correct": false,
              "explanation": "현재완료 조동사. 과거 사실 반대 가정을 나타내지 못하고 주절 would have p.p.와 맞지 않습니다."
            },
            {
              "label": "C",
              "text": "Were",
              "correct": false,
              "explanation": "Were 도치는 현재 사실 반대이며, 뒤에 been을 받지 못합니다."
            },
            {
              "label": "D",
              "text": "Had",
              "correct": true,
              "explanation": "if 생략 도치. Had + 주어 + been placed가 과거완료 수동 가정을 만듭니다."
            }
          ],
          "reviewPoint": "문두 빈칸 + 주어 + p.p./been + 주절 would have p.p. → Had 도치.",
          "topicId": "cd-inversion"
        },
        {
          "id": "cd-06",
          "stem": "Mr. Silva did not renew his safety certification last year. If he _____ it then, he would be eligible for the supervisor position now.",
          "choices": [
            "had renewed",
            "renewed",
            "has renewed",
            "would renew"
          ],
          "answer": 0,
          "reason": "조건은 작년(then)의 사실 반대라 had p.p., 결과는 지금(now)이라 would + 원형인 혼합 가정입니다.",
          "translation": "실바 씨는 작년에 안전 자격증을 갱신하지 않았습니다. 그때 갱신했다면 지금 감독직에 지원할 자격이 있을 텐데요.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "had renewed",
              "correct": true,
              "explanation": "과거완료. 앞 문장의 실제 사실(작년에 갱신 안 함)을 뒤집는 과거 가정입니다."
            },
            {
              "label": "B",
              "text": "renewed",
              "correct": false,
              "explanation": "renewed만 쓰면 실제 과거 조건으로도 읽힙니다. 여기서는 갱신하지 않았다는 사실을 반대로 가정하며 완료된 작년 행동을 분명히 하는 had renewed가 필요합니다."
            },
            {
              "label": "C",
              "text": "has renewed",
              "correct": false,
              "explanation": "현재완료. 가정법 짝이 아니며 이미 갱신하지 않았다는 앞 문장과 충돌합니다."
            },
            {
              "label": "D",
              "text": "would renew",
              "correct": false,
              "explanation": "if절에는 보통 would를 쓰지 않으며, 과거 일을 가정하지도 못합니다."
            }
          ],
          "reviewPoint": "if절 시간(then/last year)과 주절 시간(now)을 각각 확인하면 혼합 가정이 보입니다.",
          "topicId": "cd-mixed"
        },
        {
          "id": "cd-07",
          "stem": "The new office is a 25-minute walk from the nearest station. Many employees wish it _____ closer to public transportation.",
          "choices": [
            "being",
            "were",
            "is",
            "will be"
          ],
          "answer": 1,
          "reason": "지금 사무실이 역에서 멀다는 현재 사실의 반대를 바라므로 wish + 가정법 과거 were입니다.",
          "translation": "새 사무실은 가장 가까운 역에서 걸어서 25분 거리입니다. 많은 직원이 사무실이 대중교통에 더 가까우면 좋겠다고 바랍니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "being",
              "correct": false,
              "explanation": "-ing형. wish 뒤 절의 주어 it에 시제 동사가 필요합니다."
            },
            {
              "label": "B",
              "text": "were",
              "correct": true,
              "explanation": "가정법 과거. wish 뒤에서 현재 사실과 다른 소망을 나타냅니다."
            },
            {
              "label": "C",
              "text": "is",
              "correct": false,
              "explanation": "현재 직설법. wish는 이루어지지 않은 소망을 말하므로 현재형을 쓰지 않습니다. 실현 가능한 기대는 hope를 씁니다."
            },
            {
              "label": "D",
              "text": "will be",
              "correct": false,
              "explanation": "미래. wish 뒤에서 현재 사실 반대를 나타내지 못합니다."
            }
          ],
          "reviewPoint": "wish + 과거(were) = 지금 사실의 반대 / wish + had p.p. = 과거 사실의 반대.",
          "topicId": "cd-wish-asif"
        },
        {
          "id": "cd-08",
          "stem": "Mr. Patel had no part in creating the store layout. He now describes it as if he _____ it himself.",
          "choices": [
            "design",
            "designing",
            "had designed",
            "designs"
          ],
          "answer": 2,
          "reason": "실제로 설계하지 않았다는 첫 문장과, 현재 설명보다 앞선 설계를 가정하는 as if had designed가 연결됩니다.",
          "translation": "파텔 씨는 매장 배치를 만드는 데 참여하지 않았습니다. 그는 이제 마치 자신이 직접 설계했던 것처럼 설명합니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "design",
              "correct": false,
              "explanation": "원형. 주어 he와 수가 맞지 않고 가정 의미도 나타내지 못합니다."
            },
            {
              "label": "B",
              "text": "designing",
              "correct": false,
              "explanation": "-ing형. as if절의 주어 he 뒤에 시제 동사가 필요합니다."
            },
            {
              "label": "C",
              "text": "had designed",
              "correct": true,
              "explanation": "had designed는 과거완료로, 실제로 하지 않았던 앞선 설계를 현재 말투와 대비합니다."
            },
            {
              "label": "D",
              "text": "designs",
              "correct": false,
              "explanation": "현재 직설법. as if 뒤 직설법은 사실일 가능성이 있을 때 쓰는데, 매장 배치는 이미 완성된 것이라 '지금 설계한다'는 뜻이 맞지 않습니다."
            }
          ],
          "reviewPoint": "as if 뒤 형태는 상상하는 사건의 시점과 사실성에 맞춥니다. 입사일만으로 이전 설계 참여를 단정하지 않습니다.",
          "topicId": "cd-wish-asif"
        },
        {
          "id": "cd-09",
          "stem": "The previous venue held only 80 people. A larger hall _____ more guests, but none was available that weekend.",
          "choices": [
            "will accommodate",
            "accommodates",
            "has accommodated",
            "would have accommodated"
          ],
          "answer": 3,
          "reason": "'더 큰 홀이었다면'이라는 가정이 주어에 숨어 있고, 그 주말에는 그런 홀이 없었으므로 과거 사실 반대 would have p.p.입니다.",
          "translation": "이전 행사장은 80명만 수용했습니다. 더 큰 홀이었다면 더 많은 손님을 수용했겠지만, 그 주말에 가능한 홀이 없었습니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "will accommodate",
              "correct": false,
              "explanation": "미래. 이미 지난 주말 행사에 관한 이야기라 시간이 맞지 않습니다."
            },
            {
              "label": "B",
              "text": "accommodates",
              "correct": false,
              "explanation": "현재 직설법. 실제로 존재하지 않았던 홀에 대해 사실처럼 말하게 됩니다."
            },
            {
              "label": "C",
              "text": "has accommodated",
              "correct": false,
              "explanation": "현재완료. 실제로 수용한 경험을 말하므로 '가능한 홀이 없었다'는 내용과 충돌합니다."
            },
            {
              "label": "D",
              "text": "would have accommodated",
              "correct": true,
              "explanation": "would have p.p.·~했을 것이다. if절 없이 주어(A larger hall)에 가정이 담긴 과거 사실 반대입니다."
            }
          ],
          "reviewPoint": "if절이 없어도 but none was available처럼 실제 사실이 반대로 제시되면 would have p.p.를 검토하세요.",
          "topicId": "cd-past-perfect"
        },
        {
          "id": "cd-10",
          "stem": "Ms. Cole found and removed several errors before the report was distributed; otherwise, the report _____ those errors.",
          "choices": [
            "would have contained",
            "will contain",
            "contains",
            "had contained"
          ],
          "answer": 0,
          "reason": "실제로 오류를 제거했지만, 그렇게 하지 않았을 과거 결과를 otherwise 뒤 would have contained로 나타냅니다.",
          "translation": "콜 씨는 보고서가 배포되기 전에 오류 몇 개를 찾아 제거했습니다. 그러지 않았다면 보고서에 그 오류들이 남아 있었을 것입니다.",
          "optionAnalysis": [
            {
              "label": "A",
              "text": "would have contained",
              "correct": true,
              "explanation": "would have contained는 그 오류들을 포함했을 것이라는 과거 가정 결과입니다. otherwise는 제거하지 않았더라면이라는 조건입니다."
            },
            {
              "label": "B",
              "text": "will contain",
              "correct": false,
              "explanation": "미래. 이미 끝난 과거 확인 작업에 대한 가정 결과를 나타내지 못합니다."
            },
            {
              "label": "C",
              "text": "contains",
              "correct": false,
              "explanation": "contains는 보고서에 현재 실제로 그 오류들이 있다는 뜻입니다. 제거됐다는 앞 내용과 그 반대를 가정하는 otherwise 흐름에 맞지 않습니다."
            },
            {
              "label": "D",
              "text": "had contained",
              "correct": false,
              "explanation": "과거완료 직설법. 실제로 오류가 있었다는 뜻이 되며, 가정 결과는 would have p.p.로 씁니다."
            }
          ],
          "reviewPoint": "; otherwise, + would have p.p. = 앞 문장의 실제 행동을 하지 않았다면.",
          "topicId": "cd-past-perfect"
        }
      ],
      "sources": [
        "ifcond",
        "wish",
        "conditions",
        "zim-2026",
        "chula-2024"
      ],
      "priorityPolicy": "사용자 원오답·확인된 채점 오답 → 단어장 → 최근 교육자료·기본문법. 보기 출현을 선택한 오답으로 추정하지 않음.",
      "recentTypeSupport": [
        "현실·비현실 조건문",
        "제안·요구 가정법"
      ]
    }
  ],
  "coverage": [
    {
      "no": 1,
      "chapterId": "sentence-patterns",
      "topicId": "sp-noun-phrase",
      "label": "한정사·명사구와 분사 수식"
    },
    {
      "no": 2,
      "chapterId": "sentence-patterns",
      "topicId": "sp-ing-ed",
      "label": "ing/ed의 문장 속 역할"
    },
    {
      "no": 3,
      "chapterId": "verbs-verbals",
      "topicId": "vv-gerund",
      "label": "명사 자리의 동명사 가능성 교정"
    },
    {
      "no": 4,
      "chapterId": "nouns-pronouns",
      "topicId": "np-ing-nouns",
      "label": "ing 명사·가산성·earnings"
    },
    {
      "no": 5,
      "chapterId": "sentence-patterns",
      "topicId": "sp-noun-phrase",
      "label": "명사+명사 수식과 명사구"
    },
    {
      "no": 6,
      "chapterId": "nouns-pronouns",
      "topicId": "np-suffix",
      "label": "명사 접미사 단서"
    },
    {
      "no": 7,
      "chapterId": "nouns-pronouns",
      "topicId": "np-suffix",
      "label": "사람명사·관사 부재 오판 교정"
    },
    {
      "no": 8,
      "chapterId": "nouns-pronouns",
      "topicId": "np-multipos",
      "label": "여러 품사로 쓰는 단어"
    },
    {
      "no": 9,
      "chapterId": "adjectives-adverbs",
      "topicId": "aa-adj-form",
      "label": "형용사 접미사·ly 품사"
    },
    {
      "no": 10,
      "chapterId": "adjectives-adverbs",
      "topicId": "aa-adj-form",
      "label": "수량 수식·복합형용사"
    },
    {
      "no": 11,
      "chapterId": "sentence-patterns",
      "topicId": "sp-subject-complement",
      "label": "주격보어: 형용사와 명사구"
    },
    {
      "no": 12,
      "chapterId": "adjectives-adverbs",
      "topicId": "aa-participial",
      "label": "be 진행·수동 구조 구별"
    },
    {
      "no": 13,
      "chapterId": "adjectives-adverbs",
      "topicId": "aa-position",
      "label": "be+부사+명사구 보어"
    },
    {
      "no": 14,
      "chapterId": "adjectives-adverbs",
      "topicId": "aa-participial",
      "label": "분사형용사의 의미 판단"
    },
    {
      "no": 15,
      "chapterId": "sentence-patterns",
      "topicId": "sp-object-complement",
      "label": "목적격보어와 make 구조"
    },
    {
      "no": 16,
      "chapterId": "nouns-pronouns",
      "topicId": "np-determiners",
      "label": "한정사와 가산·불가산"
    },
    {
      "no": 17,
      "chapterId": "agreement-voice-tense",
      "topicId": "avt-agreement",
      "label": "number/range/variety 및 selection 의미"
    },
    {
      "no": 18,
      "chapterId": "adjectives-adverbs",
      "topicId": "aa-adverb-roles",
      "label": "동사구·분사 앞 부사"
    },
    {
      "no": 19,
      "chapterId": "adjectives-adverbs",
      "topicId": "aa-adverb-roles",
      "label": "수동태 부사와 남은 목적보어"
    },
    {
      "no": 20,
      "chapterId": "adjectives-adverbs",
      "topicId": "aa-adverb-roles",
      "label": "목적어 뒤 부사 수식"
    },
    {
      "no": 21,
      "chapterId": "adjectives-adverbs",
      "topicId": "aa-time-adverbs",
      "label": "시간부사·부정어·도치"
    },
    {
      "no": 22,
      "chapterId": "adjectives-adverbs",
      "topicId": "aa-number-adverbs",
      "label": "even/only와 시점 강조"
    },
    {
      "no": 23,
      "chapterId": "adjectives-adverbs",
      "topicId": "aa-number-adverbs",
      "label": "숫자 범위: 초과·이상·최대"
    },
    {
      "no": 24,
      "chapterId": "verbs-verbals",
      "topicId": "vv-verb-forms",
      "label": "동사 접미사"
    },
    {
      "no": 25,
      "chapterId": "verbs-verbals",
      "topicId": "vv-verb-forms",
      "label": "조동사·명령문·to 뒤 원형"
    },
    {
      "no": 26,
      "chapterId": "verbs-verbals",
      "topicId": "vv-help-mandative",
      "label": "help 원형·to부정사 둘 다"
    },
    {
      "no": 27,
      "chapterId": "verbs-verbals",
      "topicId": "vv-help-mandative",
      "label": "요구·제안 that절"
    },
    {
      "no": 28,
      "chapterId": "verbs-verbals",
      "topicId": "vv-transitivity",
      "label": "자동·타동사와 전치사 결합"
    },
    {
      "no": 29,
      "chapterId": "verbs-verbals",
      "topicId": "vv-transitivity",
      "label": "목적어와 동사·명사 연어"
    },
    {
      "no": 30,
      "chapterId": "agreement-voice-tense",
      "topicId": "avt-tense-basic",
      "label": "would·완료·진행 오답 단정 배제"
    },
    {
      "no": 31,
      "chapterId": "agreement-voice-tense",
      "topicId": "avt-tense-basic",
      "label": "현재 시제와 시간 단서"
    },
    {
      "no": 32,
      "chapterId": "agreement-voice-tense",
      "topicId": "avt-tense-basic",
      "label": "과거 시제와 recently 등 단서"
    },
    {
      "no": 33,
      "chapterId": "agreement-voice-tense",
      "topicId": "avt-tense-basic",
      "label": "미래 계획·일정"
    },
    {
      "no": 34,
      "chapterId": "agreement-voice-tense",
      "topicId": "avt-time-clause",
      "label": "시간·조건 부사절의 미래 표현"
    },
    {
      "no": 35,
      "chapterId": "agreement-voice-tense",
      "topicId": "avt-perfect",
      "label": "과거완료 기준 시점과 과잉 단정 교정"
    },
    {
      "no": 36,
      "chapterId": "agreement-voice-tense",
      "topicId": "avt-perfect",
      "label": "현재완료 since/for/past"
    },
    {
      "no": 37,
      "chapterId": "agreement-voice-tense",
      "topicId": "avt-tense-basic",
      "label": "예정된 미래의 현재진행"
    },
    {
      "no": 38,
      "chapterId": "agreement-voice-tense",
      "topicId": "avt-perfect",
      "label": "미래완료"
    },
    {
      "no": 39,
      "chapterId": "conditionals",
      "topicId": "cd-past-perfect",
      "label": "과거 반대 가정과 조동사 완료"
    },
    {
      "no": 40,
      "chapterId": "agreement-voice-tense",
      "topicId": "avt-voice",
      "label": "수동태·잔여 목적어 예외"
    },
    {
      "no": 41,
      "chapterId": "agreement-voice-tense",
      "topicId": "avt-voice",
      "label": "전치사만으로 수동 판단 금지"
    },
    {
      "no": 42,
      "chapterId": "verbs-verbals",
      "topicId": "vv-participle",
      "label": "대표 분사형 어휘"
    },
    {
      "no": 43,
      "chapterId": "adjectives-adverbs",
      "topicId": "aa-participial",
      "label": "능수동·진행과 뒤 구조"
    },
    {
      "no": 44,
      "chapterId": "verbs-verbals",
      "topicId": "vv-gerund",
      "label": "전치사 ing와 접속사 축약절"
    },
    {
      "no": 45,
      "chapterId": "verbs-verbals",
      "topicId": "vv-participle",
      "label": "접속사+p.p. 축약절"
    },
    {
      "no": 46,
      "chapterId": "verbs-verbals",
      "topicId": "vv-participle",
      "label": "as planned와 as+명사"
    },
    {
      "no": 47,
      "chapterId": "verbs-verbals",
      "topicId": "vv-participle",
      "label": "with O 분사"
    },
    {
      "no": 48,
      "chapterId": "verbs-verbals",
      "topicId": "vv-participle",
      "label": "쉼표만으로 ing 단정 금지"
    },
    {
      "no": 49,
      "chapterId": "verbs-verbals",
      "topicId": "vv-participle",
      "label": "having p.p.와 의미상 주어"
    },
    {
      "no": 50,
      "chapterId": "verbs-verbals",
      "topicId": "vv-infinitive",
      "label": "목적의 to부정사"
    },
    {
      "no": 51,
      "chapterId": "verbs-verbals",
      "topicId": "vv-infinitive",
      "label": "to와 원형 사이 부사"
    },
    {
      "no": 52,
      "chapterId": "verbs-verbals",
      "topicId": "vv-infinitive",
      "label": "to부정사 결합 동사"
    },
    {
      "no": 53,
      "chapterId": "verbs-verbals",
      "topicId": "vv-gerund",
      "label": "전치사 뒤 동명사·목적어"
    },
    {
      "no": 54,
      "chapterId": "verbs-verbals",
      "topicId": "vv-gerund",
      "label": "by/upon ing와 completion"
    },
    {
      "no": 55,
      "chapterId": "verbs-verbals",
      "topicId": "vv-infinitive",
      "label": "목적을 나타내는 to부정사"
    },
    {
      "no": 56,
      "chapterId": "clauses-connectors",
      "topicId": "cc-conj-prep",
      "label": "절 연결·이유·양보·조건·목적"
    },
    {
      "no": 57,
      "chapterId": "clauses-connectors",
      "topicId": "cc-parallel",
      "label": "병렬과 상관접속사"
    },
    {
      "no": 58,
      "chapterId": "clauses-connectors",
      "topicId": "pc-phrase",
      "label": "전치사+명사구·ing"
    },
    {
      "no": 59,
      "chapterId": "clauses-connectors",
      "topicId": "cc-conj-prep",
      "label": "before/after/since/until 역할"
    },
    {
      "no": 60,
      "chapterId": "clauses-connectors",
      "topicId": "cc-conj-adverb",
      "label": "접속부사와 문장 연결"
    },
    {
      "no": 61,
      "chapterId": "clauses-connectors",
      "topicId": "cc-conj-adverb",
      "label": "전치사구 형태의 연결 부사"
    },
    {
      "no": 62,
      "chapterId": "clauses-connectors",
      "topicId": "cc-conj-adverb",
      "label": "no matter how 양보절"
    },
    {
      "no": 63,
      "chapterId": "clauses-connectors",
      "topicId": "cc-noun-clause",
      "label": "명사절 that/what/whether/whoever"
    },
    {
      "no": 64,
      "chapterId": "clauses-connectors",
      "topicId": "cc-that-test",
      "label": "명사절 that과 관계사 that"
    },
    {
      "no": 65,
      "chapterId": "clauses-connectors",
      "topicId": "cc-noun-clause",
      "label": "형용사+that 내용절"
    },
    {
      "no": 66,
      "chapterId": "clauses-connectors",
      "topicId": "cc-conj-prep",
      "label": "so/but/while/whereas 연결"
    },
    {
      "no": 67,
      "chapterId": "clauses-connectors",
      "topicId": "cc-parallel",
      "label": "as well as와 also/as well 구별"
    },
    {
      "no": 68,
      "chapterId": "pronouns",
      "topicId": "np-pronoun-case",
      "label": "인칭대명사의 격"
    },
    {
      "no": 69,
      "chapterId": "pronouns",
      "topicId": "np-pronoun-case",
      "label": "소유대명사의 독립 역할"
    },
    {
      "no": 70,
      "chapterId": "pronouns",
      "topicId": "np-pronoun-case",
      "label": "재귀·강조·by oneself"
    },
    {
      "no": 71,
      "chapterId": "pronouns",
      "topicId": "np-indefinite",
      "label": "those who/with·anyone who"
    },
    {
      "no": 72,
      "chapterId": "pronouns",
      "topicId": "np-indefinite",
      "label": "one/ones·that/those 반복 회피"
    },
    {
      "no": 73,
      "chapterId": "nouns-pronouns",
      "topicId": "np-determiners",
      "label": "few/little의 대명사 역할"
    },
    {
      "no": 74,
      "chapterId": "clauses-connectors",
      "topicId": "cc-noun-clause",
      "label": "의문사절·간접의문문"
    },
    {
      "no": 75,
      "chapterId": "clauses-connectors",
      "topicId": "cc-relative",
      "label": "선행사·관계절 빠진 성분"
    },
    {
      "no": 76,
      "chapterId": "clauses-connectors",
      "topicId": "cc-relative",
      "label": "which 부재로 that 추측 금지"
    },
    {
      "no": 77,
      "chapterId": "clauses-connectors",
      "topicId": "cc-relative",
      "label": "whose+명사 소유 관계"
    },
    {
      "no": 78,
      "chapterId": "clauses-connectors",
      "topicId": "cc-noun-clause",
      "label": "what 포함 선행사와 빈자리"
    },
    {
      "no": 79,
      "chapterId": "clauses-connectors",
      "topicId": "cc-that-test",
      "label": "명사절 that의 완전한 절"
    },
    {
      "no": 80,
      "chapterId": "clauses-connectors",
      "topicId": "cc-relative",
      "label": "where와 which의 역할"
    },
    {
      "no": 81,
      "chapterId": "prepositions-comparison",
      "topicId": "pc-as-as",
      "label": "원급·비교급의 자리 판단"
    },
    {
      "no": 82,
      "chapterId": "prepositions-comparison",
      "topicId": "pc-as-as",
      "label": "as 사이 형용사·부사"
    },
    {
      "no": 83,
      "chapterId": "prepositions-comparison",
      "topicId": "pc-comparative",
      "label": "more+명사 수량 비교"
    },
    {
      "no": 84,
      "chapterId": "prepositions-comparison",
      "topicId": "pc-comparative",
      "label": "비교급 강조와 최상급 범위"
    },
    {
      "no": 85,
      "chapterId": "prepositions-comparison",
      "topicId": "pc-superlative",
      "label": "the·소유격·최상급"
    }
  ],
  "sources": [
    {
      "id": "link",
      "title": "British Council · Link verbs",
      "url": "https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/link-verbs",
      "kind": "발행일 미표시 · 문법·용법 확인용 (2026-10-21 확인)"
    },
    {
      "id": "adj",
      "title": "British Council · Adjectives",
      "url": "https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/adjectives",
      "kind": "발행일 미표시 · 문법·용법 확인용 (2026-10-21 확인)"
    },
    {
      "id": "adverbs",
      "title": "British Council · Adverbials of manner",
      "url": "https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/adverbials-manner",
      "kind": "발행일 미표시 · 문법·용법 확인용 (2026-10-21 확인)"
    },
    {
      "id": "quantifiers",
      "title": "British Council · Quantifiers",
      "url": "https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/quantifiers",
      "kind": "발행일 미표시 · 문법·용법 확인용 (2026-10-21 확인)"
    },
    {
      "id": "infinitives",
      "title": "British Council · Verbs followed by the infinitive",
      "url": "https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/verbs-followed-infinitive",
      "kind": "발행일 미표시 · 문법·용법 확인용 (2026-10-21 확인)"
    },
    {
      "id": "ingverbs",
      "title": "British Council · Verbs followed by ing",
      "url": "https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/verbs-followed-ing-form",
      "kind": "발행일 미표시 · 문법·용법 확인용 (2026-10-21 확인)"
    },
    {
      "id": "passive",
      "title": "British Council · Passives",
      "url": "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/passives",
      "kind": "발행일 미표시 · 문법·용법 확인용 (2026-10-21 확인)"
    },
    {
      "id": "relative",
      "title": "British Council · Relative pronouns and clauses",
      "url": "https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/relative-pronouns-relative-clauses",
      "kind": "발행일 미표시 · 문법·용법 확인용 (2026-10-21 확인)"
    },
    {
      "id": "ifcond",
      "title": "British Council · Third and mixed conditionals",
      "url": "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/conditionals-third-mixed",
      "kind": "발행일 미표시 · 문법·용법 확인용 (2026-10-21 확인)"
    },
    {
      "id": "until",
      "title": "Cambridge · Until",
      "url": "https://dictionary.cambridge.org/us/grammar/british-grammar/until",
      "kind": "발행일 미표시 · 문법·용법 참고 (최근 출제 빈도 근거 아님)",
      "checked": "2026-10-21"
    },
    {
      "id": "during",
      "title": "Cambridge · During or for?",
      "url": "https://dictionary.cambridge.org/grammar/british-grammar/during-or-for",
      "kind": "발행일 미표시 · 문법·용법 참고 (최근 출제 빈도 근거 아님)",
      "checked": "2026-10-21"
    },
    {
      "id": "since",
      "title": "Cambridge · For or since?",
      "url": "https://dictionary.cambridge.org/grammar/british-grammar/for-or-since",
      "kind": "발행일 미표시 · 문법·용법 참고 (최근 출제 빈도 근거 아님)",
      "checked": "2026-10-21"
    },
    {
      "id": "within",
      "title": "Cambridge · Within",
      "url": "https://dictionary.cambridge.org/dictionary/english/within",
      "kind": "발행일 미표시 · 문법·용법 참고 (최근 출제 빈도 근거 아님)",
      "checked": "2026-10-21"
    },
    {
      "id": "cause",
      "title": "Cambridge · Because, because of",
      "url": "https://dictionary.cambridge.org/grammar/british-grammar/because-because-of-and-cos-cos-of",
      "kind": "발행일 미표시 · 문법·용법 참고 (최근 출제 빈도 근거 아님)",
      "checked": "2026-10-21"
    },
    {
      "id": "before",
      "title": "Cambridge · Before",
      "url": "https://dictionary.cambridge.org/grammar/british-grammar/before",
      "kind": "발행일 미표시 · 문법·용법 참고 (최근 출제 빈도 근거 아님)",
      "checked": "2026-10-21"
    },
    {
      "id": "conditions",
      "title": "Cambridge · Conditional expressions",
      "url": "https://dictionary.cambridge.org/grammar/british-grammar/conditionals-other-expressions-unless-should-as-long-as",
      "kind": "발행일 미표시 · 문법·용법 참고 (최근 출제 빈도 근거 아님)",
      "checked": "2026-10-21"
    },
    {
      "id": "comparison",
      "title": "Cambridge · Comparison: adjectives",
      "url": "https://dictionary.cambridge.org/grammar/british-grammar/comparison-adjectives-bigger-biggest-more-interesting",
      "kind": "발행일 미표시 · 문법·용법 참고 (최근 출제 빈도 근거 아님)"
    },
    {
      "id": "make",
      "title": "Cambridge · Make",
      "url": "https://dictionary.cambridge.org/grammar/british-grammar/make",
      "kind": "발행일 미표시 · 문법·용법 참고 (최근 출제 빈도 근거 아님)",
      "checked": "2026-10-21"
    },
    {
      "id": "forward",
      "title": "Cambridge · Look forward to",
      "url": "https://dictionary.cambridge.org/grammar/british-grammar/look-forward-to",
      "kind": "발행일 미표시 · 문법·용법 참고 (최근 출제 빈도 근거 아님)",
      "checked": "2026-10-21"
    },
    {
      "id": "accustomed",
      "title": "Cambridge · Accustomed",
      "url": "https://dictionary.cambridge.org/dictionary/english/accustomed",
      "kind": "발행일 미표시 · 문법·용법 참고 (최근 출제 빈도 근거 아님)",
      "checked": "2026-10-21"
    },
    {
      "id": "wish",
      "title": "Cambridge · Wish",
      "url": "https://dictionary.cambridge.org/grammar/british-grammar/wish",
      "kind": "발행일 미표시 · 문법·용법 참고 (최근 출제 빈도 근거 아님)"
    },
    {
      "id": "presentperfect",
      "title": "British Council · Present perfect",
      "url": "https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/present-perfect",
      "kind": "발행일 미표시 · 문법·용법 확인용 (2026-10-21 확인)"
    },
    {
      "id": "pastperfect",
      "title": "British Council · Past perfect",
      "url": "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/past-perfect",
      "kind": "발행일 미표시 · 문법·용법 확인용 (2026-10-21 확인)"
    },
    {
      "id": "comparison-as",
      "title": "Cambridge · As … as",
      "url": "https://dictionary.cambridge.org/us/grammar/british-grammar/as-as",
      "kind": "용법 검증 · 출제 빈도 근거 아님"
    },
    {
      "id": "comparison-adverbs",
      "title": "Cambridge · Comparative adverbs",
      "url": "https://dictionary.cambridge.org/grammar/british-grammar/adverbs-comparative-and-superlative",
      "kind": "용법 검증 · 출제 빈도 근거 아님"
    },
    {
      "id": "comparison-very",
      "title": "Cambridge · Very",
      "url": "https://dictionary.cambridge.org/grammar/british-grammar/very",
      "kind": "용법 검증 · 출제 빈도 근거 아님"
    },
    {
      "id": "pronoun-personal",
      "title": "British Council · Personal pronouns",
      "url": "https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/personal-pronouns",
      "kind": "공식 문법·사전 용법 확인 (2026-10-22) · 출제 빈도 근거 아님"
    },
    {
      "id": "pronoun-possessive",
      "title": "Cambridge · Possessive pronouns",
      "url": "https://dictionary.cambridge.org/grammar/british-grammar/pronouns-possessive-my-mine-your-yours-etc",
      "kind": "공식 문법·사전 용법 확인 (2026-10-22) · 출제 빈도 근거 아님"
    },
    {
      "id": "pronoun-reflexive",
      "title": "British Council · Reflexive pronouns",
      "url": "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/reflexive-pronouns",
      "kind": "공식 문법·사전 용법 확인 (2026-10-22) · 출제 빈도 근거 아님"
    },
    {
      "id": "pronoun-none",
      "title": "Cambridge · No, none and none of",
      "url": "https://dictionary.cambridge.org/grammar/british-grammar/no-none-and-none-of",
      "kind": "공식 문법·사전 용법 확인 (2026-10-22) · 출제 빈도 근거 아님"
    },
    {
      "id": "pronoun-any",
      "title": "Cambridge · Any",
      "url": "https://dictionary.cambridge.org/grammar/british-grammar/any",
      "kind": "공식 문법·사전 용법 확인 (2026-10-22) · 출제 빈도 근거 아님"
    },
    {
      "id": "pronoun-another",
      "title": "Oxford Learner’s Dictionaries · Another",
      "url": "https://www.oxfordlearnersdictionaries.com/us/definition/english/another",
      "kind": "공식 문법·사전 용법 확인 (2026-10-22) · 출제 빈도 근거 아님"
    },
    {
      "id": "pronoun-one",
      "title": "Cambridge · One",
      "url": "https://dictionary.cambridge.org/grammar/british-grammar/one",
      "kind": "공식 문법·사전 용법 확인 (2026-10-22) · 출제 빈도 근거 아님"
    },
    {
      "id": "pronoun-those",
      "title": "Cambridge · This, that, these, those",
      "url": "https://dictionary.cambridge.org/grammar/british-grammar/this-that-these-those",
      "kind": "공식 문법·사전 용법 확인 (2026-10-22) · 출제 빈도 근거 아님"
    },
    {
      "id": "pronoun-modifiers",
      "title": "Cambridge · Pronouns",
      "url": "https://dictionary.cambridge.org/grammar/british-grammar/pronouns_2",
      "kind": "공식 문법·사전 용법 확인 (2026-10-22) · 출제 빈도 근거 아님"
    },
    {
      "id": "relative-top-2025",
      "title": "Top Students 관계대명사 TOEIC 학습 · 2025-02-17",
      "url": "https://top-students.com/en/blog/grammar/pronouns/relative-pronouns",
      "kind": "교육업체 자체 학습자료; 실기출 인증 아님"
    },
    {
      "id": "relative-flow-2025",
      "title": "Flow Exam 관계사 학습 · 2025-11-12 / 수정2026-04-02",
      "url": "https://flowexam.com/en/blog/relative-pronouns-toeic-guide/",
      "kind": "교육업체 자체 학습자료; 원문 예문 전재 없음"
    },
    {
      "id": "relative-x434-2026",
      "title": "X-GATE 복합관계사 복습 · 2026-08-23",
      "url": "https://x-gate.jp/2026/08/23/toeic434am_grammar/",
      "kind": "강사회차 복습; whatever·whichever의 일반화를 교차 검수"
    },
    {
      "id": "ybm-basic-2025",
      "title": "YBM 토익 기초영문법 · 2025-11-28",
      "url": "https://www.ybmbooks.com/book/book_view.asp?seq=2997&step_1=15",
      "kind": "출판사 학습서·연습문제 유형 참고; 사용자 오답·실기출 인증 아님"
    },
    {
      "id": "zim-2026",
      "title": "ZIM Academy TOEIC 문법 연습 · 2026-08-25",
      "url": "https://zim.vn/bai-tap-ngu-phap-toeic",
      "kind": "교육업체 연습자료 유형 참고; 표 전체의 최근 출제 근거 아님"
    },
    {
      "id": "chula-2024",
      "title": "ChulaTutor 제안·요구 가정법 학습 · 2024-01-29",
      "url": "https://www.chulatutor.com/blog/toeic-present-subjunctive/",
      "kind": "교육업체 학습자료; 예문·분류의 오타는 교차검수하여 복사하지 않음"
    }
  ],
  "curriculumNote": "2023년 이후 공개 교재와 2026년 공개 예상문제에서 다루는 대표 유형을 대조했습니다. 예상문제는 정기시험 기출이 아니며 별도 공식 답안표를 확인한 자료도 아닙니다. 개별 표현의 실제 출제 횟수·빈도·순위는 주장하지 않습니다. 예문과 연습문제는 독립적으로 작성했습니다.",
  "curriculum": [
    {
      "id": "ybm-750",
      "title": "YBM · ETS 750+ RC 교재 소개",
      "url": "https://www.ybmbooks.com/book/book_view.asp?seq=2992",
      "kind": "2025-07-01 · RC 16유닛 문법·어휘, 개념 → 유형 연습 → 실전형 구성"
    },
    {
      "id": "pagoda-basic-rc4",
      "title": "파고다 · 기본 RC 4판 교재 소개",
      "url": "https://www.pagodabook.com/pc/book/view?book_seq=7110",
      "kind": "2025-01-10 · 영역 구성 참고"
    },
    {
      "id": "pagoda-adv-rc4",
      "title": "파고다 · 심화 RC 4판 교재 소개",
      "url": "https://www.pagodabook.com/pc/book/view?book_seq=6849",
      "kind": "2023-11-06 · Part 6 시제·대명사·연결어·어휘·문장 선택 구성 참고"
    },
    {
      "id": "hackers-2026-trend",
      "title": "해커스 · 2026 토익 경향(2025년 분석) PDF",
      "url": "https://cdn.hackers.com/public_content/hackersbook/hackersbook_20260113/2026_toeic_trend.pdf",
      "kind": "검색 색인 발췌만 확인 · 전체 PDF 미검토 · 빈도 근거로 사용하지 않음"
    },
    {
      "id": "hackers-2026-10",
      "title": "해커스 · 2026년 10월 김혜미 공개 예상문제",
      "url": "https://cdn.hackers.co.kr/files/movie/data/8b056ae1d518011a8dd6795a0a0ff942.pdf",
      "kind": "2026-10 월간 자료 · 검수자가 2–5쪽 검토 · 전치사+ing·수동·수량·보어·가정법·Part6 연결 유형 참고 · 정기시험 기출 아님"
    },
    {
      "id": "hackers-2026-09",
      "title": "해커스 · 2026년 9월 장종훈 공개 예상문제",
      "url": "https://cdn.hackers.co.kr/files/movie/data/d592f9794e4d0e792e3e20b96948d917.pdf",
      "kind": "2026-09 월간 자료 · 검수자가 2–5쪽 검토 · 재귀·사역 수동·부사·수일치·Part6 원인 유형 참고 · 별도 공식 답안표 미확인"
    },
    {
      "id": "toeicstory-2026",
      "title": "한국토익위원회 · RC 학습 조언",
      "url": "https://www.toeicstory.co.kr/2592",
      "kind": "2026-07-09 · 구조 판별·덩어리 표현 학습 참고"
    }
  ],
  "notice": "직접 만든 TOEIC 대표 시험형 유형 적용문제입니다. 실제 기출문제가 아니며 출제 빈도·순위를 뜻하지 않습니다.",
  "topicRedirects": {
    "pc-time": "clauses-connectors",
    "pc-phrase": "clauses-connectors",
    "np-pronoun-case": "pronouns",
    "np-pronoun-summary": "pronouns",
    "np-indefinite": "pronouns"
  },
  "topicAliases": {
    "pc-phrase": "cc-conj-prep"
  }
};
