(function(root){'use strict';
 // 수동 검토한 Part 5·6 문항 → 보완 학습 연결. 원문 문제는 싣지 않고 SHA-256 지문만 둔다.
 // fingerprint = SHA-256(JSON.stringify([stem, choices.map(o=>[o.id,o.text])])). topicId는 문법 앵커가 준비되면 채운다.
 var map=[
  {
    "fingerprint": "37f13f1af8d2034388e463fcb9338769b8e16a4c5cb2482b07406f2dc5d8a45f",
    "kind": "vocabulary",
    "target": "ambitious target",
    "terms": [
      "ambitious",
      "eligible"
    ],
    "point": "목표를 수식하는 네 형용사의 뜻과 결합을 비교합니다."
  },
  {
    "fingerprint": "88712d1e220351916f1c84afe67fea1dd635460d72a445ee22af090ea0ade3e8",
    "kind": "grammar",
    "target": "clauses-connectors",
    "terms": [],
    "point": "by는 완료 기한, until은 지속 종료점입니다.",
    "topicId": "pc-time"
  },
  {
    "fingerprint": "969eadffb696c5263f0df8ad4303433d1d970c67009bb2167940b2e2863d3105",
    "kind": "grammar",
    "target": "nouns-pronouns",
    "terms": [],
    "point": "give의 내용 목적어에는 제안 내용을 뜻하는 명사가 필요합니다.",
    "topicId": "np-suffix"
  },
  {
    "fingerprint": "bdbee6033360ade50b4ff9e6111df92e60153bd40c1662fbd9cf32756ea57642",
    "kind": "vocabulary",
    "target": "approach",
    "terms": [
      "approach",
      "hold",
      "admit",
      "happen"
    ],
    "point": "행사 날짜가 임박한다는 의미와 동사의 주어 관계를 구별합니다."
  },
  {
    "fingerprint": "2a8c51699bb1fddc63761011528417e9fb215f2060af0114fe79f873b637c1f0",
    "kind": "vocabulary",
    "target": "transition",
    "terms": [
      "transition",
      "exchange"
    ],
    "point": "from A to B는 상태의 이행을 나타냅니다."
  },
  {
    "fingerprint": "0c073ed875ae606d7daa327360f065bf2e5ad7b35fe5ea66f307f15a2b73aee1",
    "kind": "grammar",
    "target": "adjectives-adverbs",
    "terms": [],
    "point": "importance를 수식하는 형용사와 비교 의미를 함께 확인합니다.",
    "topicId": "aa-position"
  },
  {
    "fingerprint": "87ec5dc36d051a7ff568a1990ef578bcd78246680d8df17e1b047b894be3b4de",
    "kind": "grammar",
    "target": "clauses-connectors",
    "terms": [],
    "point": "직원의 업무라는 소유 관계로 whose가 명사를 이끕니다.",
    "topicId": "cc-relative"
  },
  {
    "fingerprint": "1a77617277ade23a398be27aa8117347378f585cc23ad16a11648b36a863142b",
    "kind": "grammar",
    "target": "verbs-verbals",
    "terms": [],
    "point": "have의 목적어가 훈련을 수행하므로 동사원형이 옵니다.",
    "topicId": "vv-causative"
  },
  {
    "fingerprint": "d10b1e8ad671dc34d21d1de3b4cfabb1b95558040d5ad3a6d335e68541990c23",
    "kind": "vocabulary",
    "target": "guidelines",
    "terms": [
      "guidelines"
    ],
    "point": "신청 절차를 정한 지침이라는 뜻을 문맥에서 고릅니다."
  },
  {
    "fingerprint": "8609b33ea0a496bcc1ab1efb1d9e08c0ba259ff708c06a4d953f5c2676937a31",
    "kind": "vocabulary",
    "target": "submit",
    "terms": [
      "submit"
    ],
    "point": "양식을 인사부에 제출한다는 결합 submit a form을 확인합니다."
  },
  {
    "fingerprint": "f65aa8b47ec2781bfad8798ca64724e13ce1e9e92e3f470a9efd12c6810800a8",
    "kind": "context",
    "target": "문맥·독해",
    "terms": [],
    "point": "신청서 제출 뒤 승인 결과를 통보하는 순서를 연결합니다."
  },
  {
    "fingerprint": "be4a636bfb11d9d7a84ebafa81b6fa6697d7545272d1c60e148bcb3f41e71b9b",
    "kind": "context",
    "target": "문맥·독해",
    "terms": [],
    "point": "인사부가 바빠 직접 받을 사람이 없다는 뒤 문장과 연결합니다."
  },
  {
    "fingerprint": "91ca39a7b046ecb59bcd315835a399f1b9dbdf25c3b5b473b61585ee5ee5d79b",
    "kind": "vocabulary",
    "target": "recommend",
    "terms": [
      "recommend"
    ],
    "point": "추천서에서 입학을 추천한다는 동사를 고릅니다."
  },
  {
    "fingerprint": "2f3750b3e2993aa3cf3f67c495b64c775e0cb3160fdc33826b35469402a7d5c5",
    "kind": "vocabulary",
    "target": "independently",
    "terms": [
      "independently"
    ],
    "point": "다음 문장의 on her own과 같은 의미를 대조합니다."
  },
  {
    "fingerprint": "15d468b3ddb0a0902e3b4b53c83feb31b07810682fe705a7fdbe02176ca5e80f",
    "kind": "vocabulary",
    "target": "convince",
    "terms": [
      "convince"
    ],
    "point": "사람에게 that절 내용을 납득시키는 결합을 비교합니다."
  },
  {
    "fingerprint": "b9d5d12d0cb028a5c4ac97d2c353dd5719e501239f8037d4ad33ae7aa9f2ade1",
    "kind": "context",
    "target": "문맥·독해",
    "terms": [],
    "point": "지원자를 높이 평가한 앞 내용과 추천 결론의 일관성을 봅니다."
  },
  {
    "fingerprint": "0fa850f51502b5033fe64c304113885b95f0bf896999bfe6cb5a18b4caac42f8",
    "kind": "grammar",
    "target": "agreement-voice-tense",
    "terms": [],
    "point": "미래 시간절과 주절의 시제 있는 동사를 구분합니다.",
    "topicId": "avt-time-clause"
  },
  {
    "fingerprint": "995905aa7682989092e9ed371ffb0828cee1b34ef50bcff73df8f1772b1377c0",
    "kind": "grammar",
    "target": "nouns-pronouns",
    "terms": [],
    "point": "requesting의 목적어로 승인이라는 명사가 필요합니다.",
    "topicId": "np-multipos"
  },
  {
    "fingerprint": "bea2b40cab6a1e611dfd50f6b81ea88f4b401d32d7f12b70a3ce065847d13e73",
    "kind": "grammar",
    "target": "nouns-pronouns",
    "terms": [],
    "point": "전치사 upon 뒤에서 배송이라는 사건 명사를 고릅니다.",
    "topicId": "np-suffix"
  },
  {
    "fingerprint": "eed1783f129cba37e3ad1a4aaede6bab2667e2c1453327ff1e9a65834bb7e9c8",
    "kind": "grammar",
    "target": "sentence-patterns",
    "terms": [],
    "point": "find 뒤의 목적어 car를 설명하는 보어 자리입니다.",
    "topicId": "sp-object-complement"
  },
  {
    "fingerprint": "606c1a050c7416a715241385bd84319ff345de6655d1c5644299e385744969fc",
    "kind": "grammar",
    "target": "sentence-patterns",
    "terms": [],
    "point": "remain 뒤에서 demand의 상태를 설명하는 보어를 고릅니다.",
    "topicId": "sp-subject-complement"
  },
  {
    "fingerprint": "47c61c63487f5dfaff90970102857a0cea8c5963576f56aa130530a52e65033b",
    "kind": "grammar",
    "target": "sentence-patterns",
    "terms": [],
    "point": "주어 뒤에서 목적어 certificates를 이끄는 본동사가 필요합니다.",
    "topicId": "sp-elements"
  },
  {
    "fingerprint": "4c47ee638f4b51b2faf6a21ad138708083647f5571bc657beb8e1af638f7e55b",
    "kind": "grammar",
    "target": "nouns-pronouns",
    "terms": [],
    "point": "the 뒤에서 문장 주어를 이루는 명사를 찾습니다.",
    "topicId": "np-suffix"
  },
  {
    "fingerprint": "db301ff21db5d7735cc59076e22b728365042a30d9a1e4457fe23ca39407c3f6",
    "kind": "grammar",
    "target": "nouns-pronouns",
    "terms": [],
    "point": "announced의 목적어로 계획들을 뜻하는 명사가 필요합니다.",
    "topicId": "np-suffix"
  },
  {
    "fingerprint": "10b9415400943092ed35e3bb2d10204546a2aea21c05aef6a7db2598d1c2b81d",
    "kind": "grammar",
    "target": "nouns-pronouns",
    "terms": [],
    "point": "고유명사와 동격인 금융 전문가를 뜻하는 사람 명사를 고릅니다.",
    "topicId": "np-suffix"
  },
  {
    "fingerprint": "6f0b0853abe0a34d62d0875a3cfb79862635bca40803059201dca1ce73371495",
    "kind": "grammar",
    "target": "nouns-pronouns",
    "terms": [],
    "point": "the 뒤에서 재활용 활동을 뜻하는 명사를 고릅니다.",
    "topicId": "np-ing-nouns"
  },
  {
    "fingerprint": "261df9c0ccab06df1ad7879d8f10313dd1cdded1d42ad32881782ceeb5dd697a",
    "kind": "grammar",
    "target": "nouns-pronouns",
    "terms": [],
    "point": "서류 복사 행위를 뜻하는 명사구가 단수 주어를 이룹니다.",
    "topicId": "np-ing-nouns"
  },
  {
    "fingerprint": "4df9e6c6ca7ea633bda00b945baf9ee16ec871d8146e5a55b58a53760b003602",
    "kind": "grammar",
    "target": "nouns-pronouns",
    "terms": [],
    "point": "한정사 없이 연구 활동을 나타내는 불가산명사입니다.",
    "topicId": "np-determiners"
  },
  {
    "fingerprint": "69fd2d2cb7b6f1e184183e227ea7bcd8d84da1f4952463db3765c81be7946142",
    "kind": "grammar",
    "target": "nouns-pronouns",
    "terms": [],
    "point": "one of 뒤에는 제조업체들을 뜻하는 복수 명사가 필요합니다.",
    "topicId": "np-determiners"
  },
  {
    "fingerprint": "20c9895c3f431751c521cf402f251c9b3d6ebcbfdcfed1aea6da291940b09959",
    "kind": "grammar",
    "target": "nouns-pronouns",
    "terms": [],
    "point": "advisory는 주의보라는 가산명사이고 advice와 다릅니다.",
    "topicId": "np-multipos"
  },
{
  "fingerprint": "e8ed1764ba2e296a77d59710a822d333bf938f2cbe6ed06bd2deb3979fff584e",
  "kind": "grammar",
  "target": "adjectives-adverbs",
  "terms": [],
  "point": "동사 수식은 부사, 명사 수식은 형용사를 검토합니다.",
  "topicId": "aa-adverb-roles"
},
{
  "fingerprint": "aed1af3db697b84c8478f0b5f43f0755ee8a866fb522db82a894a60af307d4bf",
  "kind": "vocabulary",
  "target": "selection",
  "terms": [
    "selection"
  ],
  "point": "selection of + 복수명사/불가산명사를 덩어리로 기억합니다."
},
{
  "fingerprint": "f1e5201161b092ed27a2681904fca09d4634ef904ee28b052f265646a0378bd3",
  "kind": "grammar",
  "target": "adjectives-adverbs",
  "terms": [],
  "point": "느끼는 상태와 감정을 일으키는 대상을 구분합니다.",
  "topicId": "aa-participial"
},
{
  "fingerprint": "70212004c8aa8b2dc77c9a49672dfe58449413ca11a6d7ba5c6029a11d29b961",
  "kind": "grammar",
  "target": "clauses-connectors",
  "terms": [],
  "point": "뜻이 양보인지 확인한 뒤 명사구와 절을 구별합니다.",
  "topicId": "pc-phrase"
},
{
  "fingerprint": "712cfc053321a3f9fd05dbe9de80c7620b1f4e2102e015f4b45cc833359dcf72",
  "kind": "grammar",
  "target": "clauses-connectors",
  "terms": [],
  "point": "요구·명령 뒤 or는 그렇지 않으면의 결과를 연결할 수 있습니다.",
  "topicId": "cc-parallel"
},
{
  "fingerprint": "0c51b25d37a1f97e421d2c9d16abea6eb5b7527303a0304b24fb5d7197fea228",
  "kind": "grammar",
  "target": "clauses-connectors",
  "terms": [],
  "point": "since는 시작점, for는 지속 길이, until은 끝점입니다.",
  "topicId": "pc-time"
},
{
  "fingerprint": "7d1eeb4f3bd46f520a9c959e49a0e7f1635a6db8df7618fc2da673f2a169b9c3",
  "kind": "grammar",
  "target": "adjectives-adverbs",
  "terms": [],
  "point": "목적어 뒤에서도 부사가 앞 동작 전체를 수식할 수 있습니다.",
  "topicId": "aa-adverb-roles"
},
{
  "fingerprint": "59941606eaed6d6826056243ae13363fa2e149a058327eea46d08b3f67fd7bbc",
  "kind": "vocabulary",
  "target": "commence",
  "terms": [
    "commence"
  ],
  "point": "commence는 시작하다·시작되다이며 이 문장에서는 자동사입니다."
},
{
  "fingerprint": "e34700b528569f29a3be6199a98926113302ba72a4c9e289f54a53cf1fcb2902",
  "kind": "grammar",
  "target": "clauses-connectors",
  "terms": [],
  "point": "whose + 명사는 사람뿐 아니라 사물과의 소유·관련 관계에도 씁니다.",
  "topicId": "cc-relative"
},
{
  "fingerprint": "910783e15dc9ace8c0338a8f301f8fa9c0850707f9071d5500d572396c3d4db7",
  "kind": "vocabulary",
  "target": "impartial",
  "terms": [
    "impartial"
  ],
  "point": "impartial advice와 an impartial assessment를 함께 기억합니다."
},
{
  "fingerprint": "f67eaff5e7c3c2562014f2cba03ea3f4c46238b784f417c31c59aa27fab37cd2",
  "kind": "grammar",
  "target": "clauses-connectors",
  "terms": [],
  "point": "관계절 안에서 빠진 성분을 먼저 찾습니다.",
  "topicId": "cc-relative"
},
{
  "fingerprint": "9a2576ce272e075eb7d0e6763b700f4aa6935180ed7ec5831e403e5afbbaaa82",
  "kind": "grammar",
  "target": "verbs-verbals",
  "terms": [],
  "point": "be known for의 be가 생략된 분사 수식으로 읽습니다.",
  "topicId": "vv-participle"
},
{
  "fingerprint": "2f47e9cceb4c5ab239b297b5be8829f57ad23e51e28d248fb72cb8be02408332",
  "kind": "context",
  "target": "context",
  "terms": [],
  "point": "앞 문장의 주제를 다음 문장이 구체화하는지 확인합니다."
},
{
  "fingerprint": "447abb16fc853dc5e8c8f14abe0c18fe3ae05c748b3c1a9cfdffc640f70492b7",
  "kind": "vocabulary",
  "target": "atmosphere",
  "terms": [
    "atmosphere"
  ],
  "point": "뒤 문장의 구체 예시가 가리키는 포괄 명사를 고릅니다."
}
];
 var safeId=/^[a-z0-9][a-z0-9-]{0,63}$/;
 function find(hex){return typeof hex==='string'&&map.find(function(m){return m.fingerprint===hex;})||null;}
 // 지문 원문: context.stem + review.choices(없으면 context.options). 선택지 형식이 맞지 않으면 null로 두어 분류하지 않는다.
 function fingerprintText(review,context){var stem=context.stem!==undefined?context.stem:review&&review.stem,choices=review&&Array.isArray(review.choices)&&review.choices.length?review.choices:context.options;if(!Array.isArray(choices)||!choices.length||!choices.every(function(o){return o&&typeof o.id==='string'&&typeof o.text==='string';}))return null;return JSON.stringify([stem,choices.map(function(o){return[o.id,o.text];})]);}
 function digest(text){try{var subtle=root.crypto&&root.crypto.subtle;if(!subtle||typeof TextEncoder!=='function'||typeof text!=='string')return Promise.resolve(null);return subtle.digest('SHA-256',new TextEncoder().encode(text)).then(function(buf){return Array.prototype.map.call(new Uint8Array(buf),function(b){return ('0'+b.toString(16)).slice(-2);}).join('');},function(){return null;});}catch(e){return Promise.resolve(null);}}
 // HANQ_TOEIC_GRAMMAR_DATA.chapters는 배열 또는 id 키 객체 모두 받는다. 제목·하위 주제 이름만 읽는다.
 function chapters(){var c=root.HANQ_TOEIC_GRAMMAR_DATA&&root.HANQ_TOEIC_GRAMMAR_DATA.chapters;if(Array.isArray(c))return c;if(c&&typeof c==='object')return Object.keys(c).map(function(k){return c[k]&&typeof c[k]==='object'?Object.assign({id:k},c[k]):null;}).filter(Boolean);return [];}
 function title(x){var t=x&&(x.title||x.name||x.label);return typeof t==='string'?t:'';}
 function topics(chapter){var t=chapter&&(chapter.topics||chapter.subtopics||chapter.sections);return Array.isArray(t)?t:[];}
 function grammarLink(m){var resolved=root.HanqToeicGrammar?root.HanqToeicGrammar.resolve(m.target):m.target,chapter=chapters().find(function(c){return c&&c.id===resolved;}),topicId=m.topicId&&safeId.test(m.topicId)?m.topicId:'',data=root.HANQ_TOEIC_GRAMMAR_DATA;if(data&&data.topicRedirects&&data.topicRedirects[topicId]){resolved=data.topicRedirects[topicId];chapter=chapters().find(function(c){return c&&c.id===resolved;});}var topic=topics(chapter).find(function(t){return t&&t.id===topicId;});if(!topic)topicId='';return{href:'#toeic/grammar'+(chapter?'/'+chapter.id:'')+(topicId?'/'+topicId:''),label:(title(chapter)||'집중 문법 목차')+(title(topic)?' > '+title(topic):'')};}

 function text(parent,value,cls){var n=document.createElement('span');n.textContent=value;if(cls)n.className=cls;parent.appendChild(n);return n;}
 function link(parent,href,value){var a=document.createElement('a');a.href=href;a.textContent=value;a.className='tc-study-link-target';parent.appendChild(a);return a;}
 function fill(row,m){
  text(row,'보완하기 · ','tc-study-link-label');
  if(!m){text(row,'이 문항은 아직 검토된 학습 분류가 없어요.','tc-study-link-point');return;}
  if(m.kind==='grammar'&&safeId.test(m.target)){var g=grammarLink(m);link(row,g.href,g.label);}
  else if(m.kind==='vocabulary'){m.terms.forEach(function(term,i){if(i)text(row,' · ');link(row,'#toeic/notebook/word/'+encodeURIComponent(term),term);});}
  else text(row,'문맥·독해');
  text(row,' · '+m.point,'tc-study-link-point');
 }
 // 채점 뒤 Part 5·6 해설에서만 호출. 해시 계산 뒤 parent가 화면에서 빠졌으면 붙이지 않는다.
 async function render(parent,review,context){
  if(!parent||!context||(context.part!==5&&context.part!==6))return null;
  var source=fingerprintText(review,context),hex=source?await digest(source):null;
  if(!parent.isConnected)return null;
  var row=document.createElement('p');row.className='tc-study-link';fill(row,find(hex));parent.appendChild(row);return row;
 }
 root.HanqToeicStudyLinks={render:render,fingerprintText:fingerprintText};
})(typeof window!=='undefined'?window:globalThis);
