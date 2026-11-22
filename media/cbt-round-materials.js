/* Read-only, owner-scoped finalized exam materials. Never saves local review answers. */
(function(root){'use strict';
var UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function normalize(data,round){
 if(!data||data.scope!=='exam-starred-or-ever-wrong'||data.round!==round||!Array.isArray(data.items)||data.items.length>50||data.hasMore!==false||!Number.isInteger(data.pendingStarCount)||data.pendingStarCount<0)throw Error('materials_incomplete');
 var seen=new Set(),items=[];
 data.items.forEach(function(q){
  var v=q&&q.review,opts=q&&q.options,base=q&&'/api/v1/cbt/runs/'+q.runId+'/questions/'+q.position;
  if(!q||q.exam!==round||!Number.isInteger(q.number)||q.number<1||q.number>50||q.questionId!=='exam-'+round+'-'+String(q.number).padStart(2,'0')||typeof q.version!=='string'||!q.version||!UUID.test(q.runId)||!Number.isInteger(q.position)||q.position<0||q.position>49||![1,2,3].includes(q.points)||typeof q.starred!=='boolean'||typeof q.everWrong!=='boolean'||!q.starred&&!q.everWrong||!v||!['wrong','correct','unanswered'].includes(v.status)||!Array.isArray(opts)||opts.length!==5||new Set(opts.map(function(o){return o&&o.id;})).size!==5||opts.some(function(o,i){return !o||typeof o.id!=='string'||!o.id||o.number!==i+1;})||!Number.isInteger(v.correctNumber)||v.correctNumber<1||v.correctNumber>5||opts[v.correctNumber-1].id!==v.correctOptionId||q.selectedOptionId!==null&&!opts.some(function(o){return o.id===q.selectedOptionId;})||(q.paperImported===true?(q.selectedOptionId!==null||!(v.correct===true&&v.status==='correct'||v.correct===false&&v.status==='wrong')):v.status!==(q.selectedOptionId===null?'unanswered':q.selectedOptionId===v.correctOptionId?'correct':'wrong'))||q.image!==base+'/image')throw Error('materials_incomplete');
  if(q.common&&(!Array.isArray(q.common.questionNumbers)||!q.common.questionNumbers.includes(q.number)||q.common.questionNumbers.some(function(n){return !Number.isInteger(n)||n<1||n>50;})||q.common&&q.common.image!==base+'/common'))throw Error('materials_incomplete');
  var saved=v.item;if(saved&&(saved.id!==q.questionId||saved.v!==q.version||saved.exam!==q.exam||saved.number!==q.number||saved.points!==q.points||saved.answer!==v.correctNumber||!Array.isArray(saved.options)||saved.options.length!==5||saved.options.some(function(o,i){return !o||o.id!==opts[i].id;})))throw Error('materials_incomplete');
  if(seen.has(q.questionId))throw Error('materials_incomplete');seen.add(q.questionId);items.push(q);
 });
 return {items:items.sort(function(a,b){return a.number-b.number;}),rejected:0,hasMore:false,pendingStarCount:data.pendingStarCount,resetAt:data.resetAt||null};
}
function identity(api){var s=api.state();return s&&s.signedIn&&!s.restoring&&s.ownerId!=null?String(s.ownerId)+':'+String(s.epoch||0):null;}
async function load(options){
 var token=identity(options.api),all=options.round==='all';if(!token)throw Error('session_changed');
 var data=await options.api.cbt('GET',all?'/api/v1/cbt/notebook':'/api/v1/cbt/review-materials/'+options.round);
 if(identity(options.api)!==token||options.isCurrent&&!options.isCurrent())throw Error('session_changed');
 if(!all)return normalize(data,options.round);
 if(!root.HanqCbtWrongNotebook)throw Error('materials_unavailable');
 var n=root.HanqCbtWrongNotebook.normalize(data);
 if(n.hasMore||n.rejected)throw Error('materials_incomplete');
 var owner=options.api.state().ownerId,reset=root.HanqLearningReset&&root.HanqLearningReset.token&&root.HanqLearningReset.token(owner,'history');
 return {items:n.items.slice().sort(function(a,b){return a.exam-b.exam||a.number-b.number;}),resetAt:data.resetAt||reset||null};
}
function sourceLines(q){var saved=null;try{saved=root.HanqCbtExplanations&&root.HanqCbtExplanations.resolve(q,'final');}catch(_){}var o=saved&&root.HanqCbtExplanations.groundedOverview?root.HanqCbtExplanations.groundedOverview(saved):null;saved=saved||q.review.item||{};o=o||saved.overview||{};var lines=Array.isArray(o.reason)?o.reason.slice(0,2):[];lines=lines.concat([o.answer,saved.why,saved.explanation]).filter(function(v){return typeof v==='string'&&v.trim();});return Array.from(new Set(lines));}
// Curated associations from era-full-summary-data.js (samguk/nambuk/goryeo/
// opening/colonial), textbook-notes.js (joseon-late), and lecture-flow-joseon.js.
// These enrich a resolved display subject only, never the official answer.
// Daejonggyo: AKS E0014791; Geumwiyeong: AKS E0007930;
// Choryang Waegwan: NIKH nh_032_0060_0020_0030_0020_0020.
var choiceAssociations=Object.create(null);
[
 ['소수림왕|고구려 소수림왕',['율령','태학','불교 수용']],
 ['광개토왕|고구려 광개토왕',['영락','신라 구원']],
 ['장수왕|고구려 장수왕',['평양 천도','남진','한성 함락']],
 ['근초고왕|백제 근초고왕',['고국원왕 전사','고흥의 서기','칠지도']],
 ['무령왕|백제 무령왕',['22담로','왕족 파견','벽돌무덤']],
 ['성왕|백제 성왕',['사비 천도','남부여','관산성 전사']],
 ['지증왕|신라 지증왕',['국호 신라','동시전','우산국 복속']],
 ['법흥왕|신라 법흥왕',['율령','불교 공인','건원']],
 ['진흥왕|신라 진흥왕',['화랑 정비','한강 차지','대가야 정복']],
 ['문무왕|신라 문무왕',['나당 전쟁','매소성','기벌포']],
 ['신문왕|통일 신라 신문왕',['김흠돌의 난','관료전','녹읍 폐지']],
 ['고려 태조|고려 태조 왕건',['훈요 10조','역분전','흑창']],
 ['고려 광종|광종',['노비안검법','과거제','광덕·준풍']],
 ['고려 성종',['최승로 시무 28조','12목','국자감']],
 ['고려 숙종',['해동통보','별무반','서적포']],
 ['고려 예종',['7재','양현고','동북 9성']],
 ['고려 공민왕|공민왕',['기철 숙청','반원 정책','전민변정도감']],
 ['태종|조선 태종',['6조 직계제','호패법','사간원']],
 ['세종|조선 세종',['훈민정음','집현전','4군 6진']],
 ['조선 성종',['경국대전','홍문관','악학궤범']],
 ['세조|조선 세조',['직전법','간경도감','이시애의 난']],
 ['숙종|조선 숙종',['환국','금위영','초량왜관']],
 ['영조|조선 영조',['탕평비','균역법']],
 ['정조|조선 정조',['규장각','초계문신제','장용영']],
 ['흥선 대원군|흥선대원군',['호포제','사창제','경복궁 중건']],
 ['대종교',['나철','단군 숭배']],
 ['천도교',['손병희','만세보']],
 ['김원봉',['의열단','조선의용대']],
 ['지청천',['한국독립군','한국광복군']],
 ['박상진',['대한광복회','공화정']],
 ['박은식',['한국통사','한국독립운동지혈사']],
 ['신채호',['조선상고사','조선 혁명 선언']],
 ['서재필',['독립신문','독립협회']],
 ['구석기|구석기 시대', ['뗀석기', '이동 생활', '동굴·막집']],
 ['신석기|신석기 시대', ['농경·목축', '빗살무늬토기', '가락바퀴']],
 ['청동기|청동기 시대', ['고인돌', '비파형 동검', '계급 발생']],
 ['철기|철기 시대', ['철제 농기구', '세형 동검', '중국 화폐']],
 ['부여', ['사출도', '영고', '1책 12법']],
 ['옥저', ['민며느리제', '골장제']],
 ['동예', ['무천', '책화', '단궁·과하마·반어피']],
 ['삼한', ['천군·소도', '신지·읍차', '5월·10월 제사']],
 ['고조선', ['단군왕검', '범금 8조', '왕검성']],
 ['원효|통일 신라 원효', ['일심', '화쟁', '무애가']],
 ['의상|통일 신라 의상', ['화엄 사상', '부석사', '화엄일승법계도']],
 ['설총|통일 신라 설총', ['이두 정리', '화왕계']],
 ['장보고|통일 신라 장보고', ['청해진', '완도', '적산 법화원']],
 ['지눌|고려 지눌', ['수선사 결사', '정혜쌍수', '돈오점수']],
 ['의천|고려 의천', ['천태종', '교관겸수', '교장']],
 ['최충헌|최충헌 집권기', ['교정도감', '봉사 10조']],
 ['조선 선조', ['임진왜란', '훈련도감', '동인·서인 분화']],
 ['광해군|조선 광해군', ['중립외교', '기유약조', '경기 대동법']],
 ['인조|조선 인조', ['정묘호란', '병자호란', '영정법']],
 ['효종|조선 효종', ['북벌', '나선 정벌']],
 ['조선 현종', ['예송', '서인·남인']],
 ['조광조|조선 조광조', ['현량과', '위훈 삭제', '기묘사화']],
 ['조선 중종', ['조광조 개혁', '현량과', '기묘사화']],
 ['제1차 갑오개혁', ['군국기무처', '과거제 폐지', '공사 노비제 폐지']],
 ['제2차 갑오개혁', ['홍범 14조', '교육입국조서', '23부']],
 ['광무개혁|대한제국 광무개혁', ['구본신참', '원수부', '지계']],
 ['독립협회', ['서재필', '만민 공동회', '헌의 6조']],
 ['신민회', ['대성학교·오산학교', '태극서관', '105인 사건']],
 ['을미개혁', ['단발령', '건양', '태양력']],
 ['대한민국 임시 정부', ['연통제', '교통국', '독립 공채']],
 ['의열단', ['김원봉', '조선 혁명 선언']],
 ['한국광복군', ['충칭', '지청천', '국내 진공 작전']],
 ['조선 의용대|조선의용대', ['김원봉', '우한', '1938년']],
 ['신간회', ['정우회 선언', '민족 협동 전선', '광주 학생 항일운동 지원']],
 ['한국 독립군|지청천의 한국 독립군', ['지청천', '쌍성보', '대전자령']],
 ['조선 혁명군|양세봉의 조선 혁명군', ['양세봉', '영릉가', '흥경성']],
 ['이승만 정부|이승만 정부 시기', ['농지 개혁', '발췌 개헌', '사사오입 개헌']],
 ['박정희 정부|박정희 정부 시기', ['한일기본조약', '경부고속도로', '유신헌법']],
 ['전두환 정부|전두환 정부 시기', ['야간 통행금지 해제', '4·13 호헌조치', '6월 민주항쟁']],
 ['노태우 정부|노태우 정부 시기', ['북방외교', '남북기본합의서', '유엔 동시 가입']],
 ['김영삼 정부|김영삼 정부 시기', ['금융실명제', '하나회 해체', '지방자치 전면 시행']],
 ['김대중 정부|김대중 정부 시기', ['6·15 남북공동선언', '국민기초생활보장법', '국가인권위원회']],
 ['노무현 정부|노무현 정부 시기', ['호주제 폐지', '10·4 남북정상선언', '개성공단 착공']],
 ['문재인 정부|문재인 정부 시기', ['평창 동계올림픽', '판문점 정상회담']]
].forEach(function(row){row[0].split('|').forEach(function(name){choiceAssociations[name]=row[1];});});
function associatedChoiceNote(facts){
 var parts=facts.split(' — '),subject=parts.length===2?parts[1].trim():null;
 var line=facts.replace(/ — /g,' · ');
 return appendChoiceAssociations(line,subject);
}
function appendChoiceAssociations(line,subject){
 var hints=subject&&choiceAssociations[subject];
 if(!hints)return line;
 // Whitespace-insensitive exclusion avoids repeating a clue already on this line.
 var compact=line.replace(/\s/g,'');
 hints=hints.filter(function(hint){return compact.indexOf(hint.replace(/\s/g,''))<0;}).slice(0,3);
 return line+(hints.length?' · '+hints.join(', '):'');
}
// Verified per-choice Republic of Korea context. No year-to-government inference.
// Sources and deliberate boundary exclusions: docs/cbt-explanations/government-memos.md.
var choiceGovernmentMemos={
 "exam-70-44-option-1":["5379774ee33522fa","이승만 정부 시기","반민족 행위 특별 조사 위원회","1948년·제헌 국회의 친일 청산"],
 "exam-70-44-option-2":["5379774ee33522fa","이승만 정부 시기","평화 통일론·조봉암 처형","1959년·진보당 사건"],
 "exam-70-44-option-3":["5379774ee33522fa","이승만 정부","비상계엄·발췌 개헌","1952년·부산·대통령 직선제"],
 "exam-71-46-option-5":["be6c815461d41cd6","이승만 정부","비상계엄·발췌 개헌","1952년·부산·대통령 직선제"],
 "exam-78-44-option-2":["e79df1c68c39a9a4","이승만 정부","발췌 개헌에 따라 실시","1952년·부산·대통령 직선제"],
 "exam-70-44-option-4":["5379774ee33522fa","이승만 정부 시기","애치슨 라인","1950년 1월·미국 방위선 발표"],
 "exam-71-46-option-1":["be6c815461d41cd6","이승만 정부 시기","애치슨 라인 발표","1950년 1월·미국 방위선 발표"],
 "exam-77-48-option-1":["e2ea247b49470e93","이승만 정부 시기","애치슨 라인","1950년 1월·미국 방위선 발표"],
 "exam-78-45-option-1":["a1ea94e41969b8e2","이승만 정부 시기","애치슨 선언 발표","1950년 1월·미국 방위선 발표"],
 "exam-70-44-option-5":["5379774ee33522fa","이승만 정부","유상 매수·유상 분배 농지 개혁법","1949년·농지 개혁법 제정"],
 "exam-70-46-option-5":["42956e540d2816f8","이승만 정부 시기","삼백 산업","1950년대·미국 원조 경제"],
 "exam-74-45-option-3":["c7af9f139b67ed05","이승만 정부","한미 상호 방위 조약","1953년 10월·정전 이후"],
 "exam-78-45-option-2":["a1ea94e41969b8e2","이승만 정부","한미 상호 방위 조약 체결","1953년 10월·정전 이후"],
 "exam-74-45-option-4":["c7af9f139b67ed05","이승만 정부 시기","여수·순천 10·19 사건","1948년 10월"],
 "exam-78-45-option-3":["a1ea94e41969b8e2","이승만 정부 시기","여수·순천 10·19 사건","1948년 10월"],
 "exam-78-45-option-5":["a1ea94e41969b8e2","이승만 정부 시기","흥남 철수 작전","1950년 12월·중국군 개입 이후"],
 "exam-73-47-option-4":["5ffd6037df59e3e3","이승만 정부","초대 대통령 중임 제한 철폐","1954년·초대 대통령 중임 제한 철폐"],
 "exam-78-48-option-1":["e45622cc73ee3d79","이승만 정부","초대 대통령의 중임 제한 철폐","1954년·초대 대통령 중임 제한 철폐"],
 "exam-73-48-option-3":["74c401873dd09684","이승만 정부 시기","김주열 시신 발견으로 격화","1960년·4·19 혁명"],
 "exam-73-48-option-5":["74c401873dd09684","이승만 정부 시기","이승만 하야의 계기","1960년·4·19 혁명"],
 "exam-74-44-option-1":["bce7154de7cb3384","이승만 정부 시기","대통령 하야","1960년·4·19 혁명"],
 "exam-75-48-option-2":["c6216c7c31279852","이승만 정부 시기","대통령 하야","1960년·4·19 혁명"],
 "exam-71-49-option-3":["2570e3367fa3d03d","이승만 정부 시기","김주열의 최루탄 피격 사망","1960년·3·15 마산 시위"],
 "exam-78-50-option-2":["80aeda8a89b67a36","이승만 정부 시기","2·28 민주 운동","1960년·대구"],
 "exam-75-42-option-3":["2c41adb8f68724d3","이승만 정부 시기","정비석·자유부인","1950년대"],
 "exam-77-40-option-5":["4eb8db161ae55f0f","이승만 정부 시기","이해연·단장의 미아리 고개","1956년 발표"],
 "exam-70-49-option-1":["27910520151feb87","박정희 군정기","중앙정보부 창설","1961년·5·16 군사 정변 이후"],
 "exam-74-47-option-4":["dc02c04e979ab546","박정희 군정기","국가 재건 최고 회의","1961년·5·16 군사 정변 이후"],
 "exam-74-48-option-1":["53badb0c5a8a201e","박정희 군정기","경제기획원 발족","1961년·5·16 군사 정변 이후"],
 "exam-70-45-option-2":["53a9d4e3117e268f","박정희 정부","(가) 국회의원 1/3 추천","1972년·유신 헌법"],
 "exam-70-45-option-1":["53a9d4e3117e268f","이승만 정부","부산에서 공포된 건 발췌 개헌","1952년·(가) 유신 헌법과 구별"],
 "exam-70-45-option-3":["53a9d4e3117e268f","이승만 정부 시기","호헌동지회 결성","1954년·사사오입 개헌에 반대"],
 "exam-70-45-option-4":["53a9d4e3117e268f","박정희 정부 시기","3·1 민주 구국 선언","1976년·(가) 유신 체제에 반대"],
 "exam-70-45-option-5":["53a9d4e3117e268f","전두환 정부 시기","6월 민주 항쟁 이후는 9차 개헌","1987년·1972년 유신과 1980년 8차 개헌은 그 이전"],
 "exam-73-47-option-5":["5ffd6037df59e3e3","박정희 정부","긴급 조치로 기본권 제한","1972년·유신 헌법"],
 "exam-74-44-option-3":["bce7154de7cb3384","박정희 정부","통일 주체 국민 회의","1972년·유신 헌법"],
 "exam-78-44-option-4":["e79df1c68c39a9a4","박정희 정부","통일 주체 국민 회의에서 선출","1972년·유신 헌법"],
 "exam-72-43-option-3":["e2ded27558f53d9c","박정희 정부 시기","3·1 민주 구국 선언","1976년·유신 반대 운동"],
 "exam-78-48-option-3":["e45622cc73ee3d79","박정희 정부 시기","3·1 민주 구국 선언에서 철폐 요구","1976년·유신 반대 운동"],
 "exam-72-43-option-4":["e2ded27558f53d9c","박정희 정부 시기","개헌 청원 100만인 서명 운동","1973년·유신 반대 운동"],
 "exam-72-46-option-1":["58a1f7a610d1194a","박정희 정부 시기","한일 국교 정상화 반대","1964년·6·3 시위"],
 "exam-74-44-option-4":["bce7154de7cb3384","박정희 정부 시기","6·3 시위·비상계엄","1964년·6·3 시위"],
 "exam-75-48-option-5":["c6216c7c31279852","박정희 정부 시기","한일 국교 정상화 반대","1964년·6·3 시위"],
 "exam-78-44-option-1":["e79df1c68c39a9a4","박정희 정부 시기","6·3 시위·한일 회담 반대","1964년·6·3 시위"],
 "exam-72-46-option-4":["58a1f7a610d1194a","박정희 정부 시기","3선 개헌 반대 투쟁 위원회","1969년·장기 집권 반대"],
 "exam-78-48-option-2":["e45622cc73ee3d79","박정희 정부","대통령의 3선 허용","1969년·3선 개헌"],
 "exam-74-46-option-5":["85536e43b235a13f","박정희 정부 시기","야당 총재 의원직 제명","1979년·부마 민주 항쟁"],
 "exam-75-48-option-1":["c6216c7c31279852","박정희 정부 시기","유신 붕괴의 배경","1979년·부마 민주 항쟁"],
 "exam-78-46-option-4":["a4b36ab320897709","박정희 정부 시기","김영삼 의원직 제명에 반발","1979년·부마 민주 항쟁"],
 "exam-74-47-option-3":["dc02c04e979ab546","박정희 정부 시기","YH 무역·야당 당사 농성","1979년·서울 신민당사"],
 "exam-78-50-option-4":["80aeda8a89b67a36","박정희 정부 시기","YH 무역 여성 노동자 농성","1979년·서울 신민당사"],
 "exam-78-46-option-1":["a4b36ab320897709","박정희 정부 시기","긴급 조치 철폐 요구","유신 반대 민주화 운동"],
 "exam-77-40-option-1":["4eb8db161ae55f0f","박정희 정부 시기","김민기·아침 이슬","1970년대"],
 "exam-71-49-option-2":["2570e3367fa3d03d","최규하 정부 시기·신군부","시민군을 조직해 계엄군에 대항","1980년·5·18 민주화 운동"],
 "exam-72-46-option-3":["58a1f7a610d1194a","최규하 정부 시기·신군부","시민군의 자발적 조직","1980년·5·18 민주화 운동"],
 "exam-73-48-option-2":["74c401873dd09684","최규하 정부 시기·신군부","시민군 조직·계엄군 저항","1980년·5·18 민주화 운동"],
 "exam-74-46-option-2":["85536e43b235a13f","최규하 정부 시기·신군부","시민군·계엄군 저항","1980년·5·18 민주화 운동"],
 "exam-75-48-option-4":["c6216c7c31279852","최규하 정부 시기·신군부","시민군 조직","1980년·5·18 민주화 운동"],
 "exam-78-46-option-3":["a4b36ab320897709","최규하 정부 시기·신군부","비상계엄 전국 확대에 저항","1980년·5·18 민주화 운동"],
 "exam-79-48-option-1":["6be7258337b428db","최규하 정부 시기·신군부","시민군 조직","1980년·5·18 민주화 운동"],
 "exam-71-46-option-3":["be6c815461d41cd6","최규하 정부 시기·신군부","국가 보위 비상 대책 위원회","1980년 5월 설치"],
 "exam-72-43-option-2":["e2ded27558f53d9c","최규하 정부 시기·신군부","국가 보위 비상 대책 위원회","1980년 5월 설치"],
 "exam-74-45-option-5":["c7af9f139b67ed05","최규하 정부 시기·신군부","국가 보위 비상 대책 위원회","1980년 5월 설치"],
 "exam-71-48-option-4":["55eb854b4f999082","최규하→전두환 정부 시기·신군부","삼청 교육대","1980년 시작"],
 "exam-74-45-option-2":["c7af9f139b67ed05","최규하→전두환 정부 시기·신군부","삼청 교육대","1980년 시작"],
 "exam-75-46-option-5":["9b7633bdcd1eccd6","최규하→전두환 정부 시기·신군부","사회 정화·삼청 교육대","1980년 시작"],
 "exam-71-42-option-5":["51e1d10ed70b878d","전두환 정부 시기","컬러텔레비전 방송","1980년 12월·컬러 방송 시작"],
 "exam-71-49-option-4":["2570e3367fa3d03d","전두환 정부 시기","6·29 선언 도출","1987년·6월 민주 항쟁"],
 "exam-73-47-option-3":["5ffd6037df59e3e3","전두환 정부 시기","직선제·5년 단임 대통령","1987년·6월 민주 항쟁"],
 "exam-73-48-option-1":["74c401873dd09684","전두환 정부 시기","4·13 호헌 조치에 저항","1987년·6월 민주 항쟁"],
 "exam-73-48-option-4":["74c401873dd09684","전두환 정부 시기","6·29 민주화 선언 발표","1987년·6월 민주 항쟁"],
 "exam-74-44-option-2":["bce7154de7cb3384","전두환 정부 시기","호헌 철폐·독재 타도","1987년·6월 민주 항쟁"],
 "exam-74-46-option-1":["85536e43b235a13f","전두환 정부 시기","이한열 희생","1987년·6월 민주 항쟁"],
 "exam-74-46-option-4":["85536e43b235a13f","전두환 정부 시기","5년 단임·대통령 직선제","1987년·6월 민주 항쟁"],
 "exam-75-48-option-3":["c6216c7c31279852","전두환 정부 시기","5년 단임 대통령 직선제","1987년·6월 민주 항쟁"],
 "exam-78-46-option-5":["a4b36ab320897709","전두환 정부 시기","대통령 직선제 개헌 이끌어 냄","1987년·6월 민주 항쟁"],
 "exam-78-44-option-3":["e79df1c68c39a9a4","전두환 정부 시기","신한 민주당이 제1야당으로 부상","1985년 총선거"],
 "exam-78-48-option-5":["e45622cc73ee3d79","전두환 정부","선거인단 간선제·7년 단임제","1980년·제8차 개헌"],
 "exam-77-40-option-4":["4eb8db161ae55f0f","노태우 정부 시기","코리아나·손에 손 잡고","1988년·서울 올림픽"],
 "exam-74-44-option-5":["bce7154de7cb3384","김대중 정부","진상 규명·명예 회복 특별법","2000년·제주 4·3 특별법"],
 "exam-79-45-option-5":["9c05c66e92eced3a","김대중 정부","진상 규명·희생자 명예 회복 특별법","2000년·제주 4·3 특별법"],
 "exam-72-43-option-5":["e2ded27558f53d9c","노무현 정부","진상 조사 보고서·정부 공식 사과","2003년·제주 4·3 진상 조사 보고서·공식 사과"],
 "exam-80-41-option-1":["facd13c22cbfc6af","박정희 정부","금지곡 지정","1970년대·유신 체제"],
 "exam-80-41-option-2":["facd13c22cbfc6af","전두환 정부 시기","컬러 텔레비전 방송","1980년 12월 시작"],
 "exam-80-41-option-3":["facd13c22cbfc6af","노무현 정부","경부 고속 철도 개통","2004년"],
 "exam-80-41-option-5":["facd13c22cbfc6af","박정희 정부","새마을 운동","1970년 시작"],
 "exam-80-44-option-1":["7c3caf07ee472a4f","이승만 정부 시기","애치슨 라인","1950년 1월·미국 방위선 발표"],
 "exam-80-44-option-2":["7c3caf07ee472a4f","이승만 정부 시기","부산 임시 수도","6·25 전쟁 중"],
 "exam-80-44-option-3":["7c3caf07ee472a4f","이승만 정부 시기","인천 상륙 작전","1950년 9월"],
 "exam-80-44-option-4":["7c3caf07ee472a4f","이승만 정부","국민 방위군 설치법","1950년 12월"],
 "exam-80-44-option-5":["7c3caf07ee472a4f","이승만 정부 시기","다부동 전투","1950년 8월·낙동강 방어선"],
 "exam-80-45-option-1":["a64c713690144a25","노태우 정부 시기","3당 합당·민주 자유당","1990년"],
 "exam-80-45-option-2":["a64c713690144a25","박정희 정부","제2차 경제 개발 5개년 계획","1967~1971년"],
 "exam-80-45-option-3":["a64c713690144a25","최규하 정부 시기·신군부","국가 보위 비상 대책 위원회","1980년 5월 설치"],
 "exam-80-45-option-4":["a64c713690144a25","노무현 정부","호주제 폐지 법 개정","2005년"],
 "exam-80-45-option-5":["a64c713690144a25","이승만 정부","농지 개혁법 제정","1949년"],
 "exam-80-46-option-2":["58f160a7ece02ae4","이승만 정부 시기","김주열 희생","1960년·3·15 의거→4·19 혁명"],
 "exam-80-46-option-3":["58f160a7ece02ae4","최규하 정부 시기·신군부","광주 시민군 조직","1980년·5·18 민주화 운동"],
 "exam-80-46-option-4":["58f160a7ece02ae4","전두환 정부 시기","박종철 고문 치사 진상 규명 요구","1987년·6월 민주 항쟁 배경"],
 "exam-80-46-option-5":["58f160a7ece02ae4","박정희 정부 시기","3·1 민주 구국 선언","1976년·유신 반대"],
 "exam-80-47-option-1":["704b296e46e7c4f9","박정희 정부","국민 교육 헌장","1968년"],
 "exam-80-47-option-2":["704b296e46e7c4f9","전두환 정부 시기","서울 아시안 게임","1986년"],
 "exam-80-47-option-3":["704b296e46e7c4f9","김영삼 정부","국민학교→초등학교 명칭 변경","1996년"],
 "exam-80-47-option-4":["704b296e46e7c4f9","노무현 정부","친일 반민족 행위 진상 규명 위원회","2005년"],
 "exam-80-47-option-5":["704b296e46e7c4f9","최규하→전두환 정부 시기·신군부","삼청 교육대","1980년 시작"],
 "exam-80-48-option-1":["5b89e58ad4a02c66","박정희 정부","남북 조절 위원회","1972년·7·4 남북 공동 성명 이후"],
 "exam-80-48-option-2":["5b89e58ad4a02c66","노태우 정부","남북 기본 합의서","1991년"],
 "exam-80-48-option-3":["5b89e58ad4a02c66","노무현 정부","10·4 남북 정상 선언","2007년"],
 "exam-80-48-option-4":["5b89e58ad4a02c66","전두환 정부 시기","최초 남북 이산가족 고향 방문","1985년"],
 "exam-80-48-option-5":["5b89e58ad4a02c66","문재인 정부 시기","평창 동계 올림픽 남북 단일팀","2018년"],
 "exam-80-49-option-1":["de9c009c7256ffd3","전두환 정부","야간 통행 금지 해제","1982년"],
 "exam-80-49-option-4":["de9c009c7256ffd3","김대중 정부","국민 기초 생활 보장법 시행","2000년"],
 "exam-80-49-option-5":["de9c009c7256ffd3","노무현 정부 시기","부산 APEC 정상 회의","2005년"],
 "exam-76-45-option-3":["e9ee29eaa42bf845","이승만 정부 시기","유엔군 파병","1950년·6·25 전쟁"],
 "exam-72-44-option-1":["50aeffbf8f9c8645","박정희 정부 시기","경부 고속 도로 개통","1970년"],
 "exam-72-44-option-2":["50aeffbf8f9c8645","이승만 정부 시기","한미 상호 방위 조약","1953년"],
 "exam-72-45-option-2":["caa56a02f6a774ac","노무현 정부 시기","개성 공단 착공식","2003년"],
 "exam-72-45-option-4":["caa56a02f6a774ac","노태우 정부 시기","남북 기본 합의서 보도","1991년"],
 "exam-72-49-option-1":["829e3354c70bbbf0","노태우 정부 시기","서울 올림픽 개최","1988년"],
 "exam-72-49-option-3":["829e3354c70bbbf0","김영삼 정부 시기","삼풍 백화점 붕괴","1995년"],
 "exam-74-40-option-5":["f88aea15eaf01236","박정희 정부 시기","근면·자조·협동·새마을 운동","1970년대"],
 "exam-74-45-option-1":["c7af9f139b67ed05","이승만 정부 시기","발췌 개헌","1952년"],
 "exam-74-47-option-1":["dc02c04e979ab546","박정희 정부 시기","국회 별관·3선 개헌","1969년"],
 "exam-74-47-option-2":["dc02c04e979ab546","이승만 정부 시기","경향신문 폐간","1959년"],
 "exam-75-42-option-5":["2c41adb8f68724d3","박정희 정부 시기","아침 이슬 금지곡","1970년대"],
 "exam-75-46-option-1":["9b7633bdcd1eccd6","박정희 정부 시기","경부 고속 도로 개통","1970년"],
 "exam-75-46-option-2":["9b7633bdcd1eccd6","이승만 정부 시기","한미 상호 방위 조약","1953년"],
 "exam-75-46-option-4":["9b7633bdcd1eccd6","김영삼 정부 시기","긴급 명령·금융 실명제","1993년"],
 "exam-75-47-option-1":["f0ae3f07435fd08b","전두환 정부 시기","부천 경찰서 성 고문 사건","1986년"],
 "exam-75-47-option-2":["f0ae3f07435fd08b","이승만 정부 시기","경향신문 폐간","1959년"],
 "exam-75-47-option-3":["f0ae3f07435fd08b","전두환 정부 시기","최저 임금 위원회 설치","1987년"],
 "exam-75-47-option-4":["f0ae3f07435fd08b","김영삼 정부 시기","지방 자치제 전면 시행","1995년"],
 "exam-75-47-option-5":["f0ae3f07435fd08b","박정희 정부 시기","긴급 조치 철폐·3·1 민주 구국 선언","1976년"],
 "exam-75-49-option-3":["9239afe9c13fe372","박정희 정부 시기","7·4 남북 공동 성명","1972년"],
 "exam-76-43-option-4":["9c07e5c6328f9c8a","박정희 정부 시기","새마을 운동","1970년대"],
 "exam-71-47-option-5":["5933bdf7bfa83f89","전두환 정부 시기","신한 민주당의 제1 야당 부상","1985년 총선거"]
};
function governmentChoiceNote(entry,option){
 var memo=entry&&choiceGovernmentMemos[option.id];
 return memo&&memo[0]===entry.v?appendChoiceAssociations(memo[2]+' · '+memo[1]+' · '+memo[3],memo[1]):null;
}
function choiceNotes(q){
 var entry=null;try{entry=root.HanqCbtExplanations&&root.HanqCbtExplanations.resolve(q,'final');}catch(_){}
 var opts=(entry||q.review.item||{}).options||[];
 return q.options.map(function(option,i){
  var ref=opts[i],raw=ref&&ref.id===option.id&&Array.isArray(ref.review)&&ref.review.find(function(x){return typeof x==='string'&&x.trim();});
  if(!raw)return '확인된 해설 없음';
  var governmentNote=governmentChoiceNote(entry,ref);
  if(governmentNote)return governmentNote;
  // Structured memos are authored display metadata, trusted only on the exact
  // version/options entry accepted by resolve. Never infer a subject from prose.
  var memo=entry&&ref.studyMemo;
  if(memo&&typeof memo.clue==='string'&&memo.clue.trim()&&typeof memo.subject==='string'&&choiceAssociations[memo.subject]){
   return associatedChoiceNote(memo.clue.trim()+' — '+memo.subject);
  }
  var authored=entry&&root.HANQ_CBT_ROUND_STUDY_MEMOS&&root.HANQ_CBT_ROUND_STUDY_MEMOS[ref.id];
  var facts=raw.replace(/\*\*/g,'').replace(/\s+/g,' ').trim(),colon=facts.indexOf(': ');
  if(colon>0)facts=facts.slice(0,colon);
  else facts=facts.split(/[.!?](?: |$)/)[0];
  var existing=associatedChoiceNote(facts);
  if(existing!==facts.replace(/ — /g,' · '))return existing;
  return authored&&authored[0]===entry.v&&authored[1]===raw?authored[2]:existing;
 });
}
function progressKey(owner,round){return owner==null?null:'hanq:round-material-rehearsal:v1:'+encodeURIComponent(String(owner))+':'+round;}
var GOAL_PERCENT=80;
function goalReached(right,total){return total>0&&right*100>=total*GOAL_PERCENT;}
function latest(owner,round){
 var key=progressKey(owner,round),r;
 try{r=key&&JSON.parse(root.localStorage.getItem(key+':latest')||'null');}catch(_){return null;}
 if(!r||!Number.isInteger(r.right)||!Number.isInteger(r.total)||r.total<1||r.total>50||r.right<0||r.right>r.total||typeof r.marked!=='boolean'||!Number.isFinite(Date.parse(r.at)))return null;
 var cutoff=root.HanqLearningReset&&root.HanqLearningReset.cutoff&&root.HanqLearningReset.cutoff(String(owner),'history');
 return cutoff&&(Date.parse(r.resetAt)||0)<cutoff?null:r;
}
function mount(host,options){
 var api=options.api,token=identity(api),alive=true,urls=[],off,resetOff,allItems=[],items=[],index=0,selected={},drafts={},data,submitted=false,storageFailed=false,markedOnly=false,marks=new Set(),refreshing=false,historyView=options.history===true,freshRequested=options.restart===true;
 var owner=api.state()&&api.state().ownerId,key=progressKey(owner,options.round);
 var marksKey=key&&progressKey(owner,'all')+':shared-double-stars',all=options.round==='all';
 function questionSet(rows){return JSON.stringify((rows||items).map(function(q){return [q.questionId,q.version,q.options.map(function(o){return o.id;})];}));}
 function save(){
  if(!current()||historyView||!key||!items.length)return;
  try{root.localStorage.setItem(key+(markedOnly?':double-star-practice':''),JSON.stringify({resetAt:data.resetAt,questionSet:questionSet(),index:index,selected:selected,drafts:drafts,submitted:submitted}));storageFailed=false;}catch(_){storageFailed=true;}
 }
 function restore(){
  if(!current()||historyView||!key||!items.length)return;
  try{
   var saved=JSON.parse(root.localStorage.getItem(key+(markedOnly?':double-star-practice':''))||'null');
   if(!saved||saved.resetAt!==data.resetAt||saved.questionSet!==questionSet())return;
   if(Number.isInteger(saved.index)&&saved.index>=0&&saved.index<items.length)index=saved.index;
   if(saved.selected&&typeof saved.selected==='object')items.forEach(function(q){var answer=saved.selected[q.questionId];if(q.options.some(function(o){return o.id===answer;}))selected[q.questionId]=answer;});
   if(saved.drafts&&typeof saved.drafts==='object')items.forEach(function(q){var answer=saved.drafts[q.questionId];if(!selected[q.questionId]&&q.options.some(function(o){return o.id===answer;}))drafts[q.questionId]=answer;});
   submitted=saved.submitted===true&&Object.keys(selected).length>0;
  }catch(_){}
 }
 function readMarks(){
  var saved=marksKey&&JSON.parse(root.localStorage.getItem(marksKey)||'null');
  return saved&&(Date.parse(saved.resetAt)||0)===(Date.parse(data.resetAt)||0)&&Array.isArray(saved.items)?saved.items:[];
 }
 function loadMarks(){
  marks=new Set();markedOnly=false;
  try{
   var saved=readMarks();
   allItems.forEach(function(q){if(saved.some(function(m){return Array.isArray(m)&&m[0]===q.questionId&&m[1]===q.version;}))marks.add(q.questionId);});
   markedOnly=key&&root.localStorage.getItem(key+':double-star-mode')==='1';
  }catch(_){}
 }
 function saveMarks(){
  if(!current()||!marksKey)return;
  try{
   var here=new Set(allItems.map(function(q){return q.questionId;}));
   var outside=readMarks().filter(function(m){return Array.isArray(m)&&typeof m[0]==='string'&&!here.has(m[0]);});
   var present=allItems.filter(function(q){return marks.has(q.questionId);}).map(function(q){return [q.questionId,q.version];});
   root.localStorage.setItem(marksKey,JSON.stringify({resetAt:data.resetAt,items:outside.concat(present)}));
   root.localStorage.setItem(key+':double-star-mode',markedOnly?'1':'0');storageFailed=false;
  }catch(_){storageFailed=true;}
 }
 function showMode(){
  items=markedOnly?allItems.filter(function(q){return marks.has(q.questionId);}):allItems;
  index=0;selected={};drafts={};submitted=false;restore();if(submitted)score();else draw();
 }
 function icon(){
  var pair=section('span','fe-round-double-star');
  pair.setAttribute('aria-hidden','true');pair.append(el('span','★'),el('span','★'));return pair;
 }
 function current(){return alive&&host.isConnected&&identity(api)===token;}
 function el(tag,text){var e=host.ownerDocument.createElement(tag);if(text!=null)e.textContent=text;return e;}
 function clear(keep){if(!keep){urls.forEach(function(u){if(root.HanqLearningReader&&root.HanqLearningReader.releaseImage)root.HanqLearningReader.releaseImage(u);root.URL.revokeObjectURL(u);});urls=[];}host.replaceChildren();}
 function button(label,fn){var b=el('button',label);b.type='button';b.className='tool-btn';b.onclick=function(){if(current())fn();};return b;}
 function stop(){if(!alive)return;alive=false;if(off)off();if(resetOff)resetOff();clear();}
 // Scan every column of small bottom strips. Leave original image/zoom bytes unchanged.
 function bottomContentRow(rgba,width,rows){
  for(var y=rows-1;y>=0;y--)for(var x=0;x<width;x++){
   var i=(y*width+x)*4,alpha=rgba[i+3];
   if(alpha&&Math.min(rgba[i],rgba[i+1],rgba[i+2])<252)return y;
  }
  return -1;
 }
 // Visually verified source boundaries: 47 has a bottom margin over half the
 // bitmap; 48 has a clipped page-number box at the lower right after its choices.
 var reviewedBottomCuts={
  'exam-72-47':['c37aabe163a2bede',657,632,273],
  'exam-72-48':['f2013ab3f0b2b180',657,430,353]
 };
 function showQuestionCrop(img,box,w,height){
  var clip=section('div','fe-round-question-clip');clip.style.aspectRatio=w+' / '+height;
  img.replaceWith(clip);clip.appendChild(img);box.classList.add('has-trimmed-bottom');
 }
 function trimQuestionBottom(q,img,box){
  var w=img.naturalWidth,h=img.naturalHeight,strip=24,revised=reviewedBottomCuts[q.questionId];
  if(revised&&q.version===revised[0]&&w===revised[1]&&h===revised[2]){showQuestionCrop(img,box,w,revised[3]);return;}
  if(w<16||w>4096||h<40||h>4096)return;
  var canvas=host.ownerDocument.createElement('canvas');
  try{
   canvas.width=w;canvas.height=strip;
   var ctx=canvas.getContext('2d',{willReadFrequently:true});
   if(!ctx)return;
   // Scan the entire trailing margin; a completely blank image is left alone.
   for(var end=h;end>0;){
    var start=Math.max(0,end-strip),rows=end-start;
    ctx.clearRect(0,0,w,strip);ctx.drawImage(img,0,start,w,rows,0,0,w,rows);
    var y=bottomContentRow(ctx.getImageData(0,0,w,rows).data,w,rows);
    if(y>=0){var height=start+y+2;if(h-height>=12)showQuestionCrop(img,box,w,height);return;}
    end=start;
   }
  }catch(_){/* Canvas unavailable: keep the original instead of guessing. */}
  finally{canvas.width=1;canvas.height=1;}
 }
 async function image(q,path,box,version,trim){try{var blob=await api.cbtImage(path);if(!current()||index!==version||!box.isConnected)return;if(!blob||!/^image\/(png|jpeg|webp)$/.test(blob.type))throw Error();var u=root.URL.createObjectURL(blob);urls.push(u);var img=el('img');img.className='mock-image';img.setAttribute('data-company-exam-image','');if(trim)img.onload=function(){if(current()&&index===version&&box.isConnected)trimQuestionBottom(q,img,box);};img.src=u;img.alt='제'+q.exam+'회 '+q.number+'번 원본 문제';img.style.maxWidth='100%';img.onerror=function(){if(current()&&box.isConnected)box.appendChild(el('p','제'+q.exam+'회 '+q.number+'번 원본 이미지를 표시하지 못했어요. 회차를 다시 열어 주세요. 계속 실패하면 이 문항의 원본 연결을 복구해 주세요.'));};box.appendChild(img);}catch(_){if(current()&&index===version&&box.isConnected)box.appendChild(el('p','제'+q.exam+'회 '+q.number+'번 원본 이미지를 불러오지 못했어요. 회차를 다시 열어 주세요. 계속 실패하면 이 문항의 원본 연결·접근 상태를 복구해 주세요.'));}}
 function section(tag,cls,text){var e=el(tag,text);e.className=cls;return e;}
 function knownReset(){
  var resets=root.HanqLearningReset,at=resets&&resets.cutoff?resets.cutoff(String(owner),'history'):0;
  return Number.isFinite(at)?at:0;
 }
 function resetChanged(){
  if(current()&&data&&!refreshing&&knownReset()>(Date.parse(data.resetAt)||0))refreshMaterials();
 }
 function reset(fresh){
  if(knownReset()>(Date.parse(fresh.resetAt)||0))throw Error('materials_stale');
  data=fresh;allItems=fresh.items;loadMarks();
  if(historyView){showHistory();return;}
  if(freshRequested){freshRequested=false;markedOnly=false;restartPractice();return;}
  showMode();
 }
 function refreshMaterials(){
  if(!current()||refreshing)return Promise.resolve();
  refreshing=true;clear();var status=el('p','오답·별표 자료를 확인하고 있어요…');status.setAttribute('role','status');host.appendChild(status);
  return load({api:api,round:options.round,isCurrent:current}).then(function(r){if(current())reset(r);return r;}).catch(function(){
   if(!current())return;clear();host.appendChild(el('p','복습 자료를 다시 불러오지 못했어요.'));
   host.appendChild(button('다시 불러오기',refreshMaterials));host.appendChild(button('회차 목록',function(){stop();if(options.onBack)options.onBack();}));
  }).finally(function(){refreshing=false;});
 }
 async function currentMaterials(){
  var fresh=await load({api:api,round:options.round,isCurrent:current});
  if(!current())return false;
  if(knownReset()>(Date.parse(fresh.resetAt)||0)){refreshMaterials();return false;}
  if((Date.parse(fresh.resetAt)||0)!==(Date.parse(data.resetAt)||0)||questionSet(fresh.items)!==questionSet(allItems)){reset(fresh);return false;}
  return true;
 }
 function header(){
  host.appendChild(el('h2',all?'전체 오답 다시 풀기':'제'+options.round+'회 오답 & 별표 문제 복습'));
  if(storageFailed)host.appendChild(el('p','이 기기에 저장하지 못했어요. 화면을 닫기 전까지는 계속 풀 수 있어요.'));
  var tools=section('div','fe-round-review-top-actions');
  tools.appendChild(button('회차 목록',function(){stop();if(options.onBack)options.onBack();}));
  if(allItems.length&&!historyView){
   var filter=button(markedOnly?'전체 다시 보기':'쌍별만 다시 보기 ('+marks.size+')',function(){save();markedOnly=!markedOnly;saveMarks();showMode();});
   filter.dataset.roundStarFilter='';filter.setAttribute('aria-pressed',String(markedOnly));if(!markedOnly)filter.prepend(icon());tools.appendChild(filter);
  }
  host.appendChild(tools);
 }
 function countRight(){return items.reduce(function(n,q){return n+(selected[q.questionId]===q.review.correctOptionId?1:0);},0);}
 function saveLatest(){
  if(!current()||!key||all)return;
  try{root.localStorage.setItem(key+':latest',JSON.stringify({right:countRight(),total:items.length,marked:markedOnly,at:new Date().toISOString(),resetAt:data.resetAt,rows:items.map(function(q){var chosen=selected[q.questionId];return {questionId:q.questionId,version:q.version,exam:q.exam,number:q.number,status:!chosen?'empty':chosen===q.review.correctOptionId?'correct':'wrong'};})}));}catch(_){storageFailed=true;}
 }
 // A replay replaces only editable practice state, never the latest submitted result.
 function restartPractice(){
  if(!current()||!data)return;
  historyView=false;freshRequested=false;selected={};drafts={};submitted=false;index=0;
  var mode=markedOnly;
  markedOnly=false;items=allItems;save();
  markedOnly=true;items=allItems.filter(function(q){return marks.has(q.questionId);});save();
  // An empty marked set must not resurrect an old marked workspace later.
  if(!items.length&&key)try{root.localStorage.setItem(key+':double-star-practice',JSON.stringify({resetAt:data.resetAt,questionSet:questionSet(),index:0,selected:{},drafts:{},submitted:false}));}catch(_){storageFailed=true;}
  markedOnly=mode;items=markedOnly?allItems.filter(function(q){return marks.has(q.questionId);}):allItems;
  saveMarks();save();draw(true);
 }
 function showHistory(){
  if(!current())return;clear();header();
  var record=latest(owner,options.round),panel=section('section','fe-round-review-result');
  panel.appendChild(el('h3','최근 제출한 복습 결과'));
  if(!record){panel.appendChild(el('p','아직 제출한 복습 기록이 없어요.'));}
  else{
   panel.append(el('p','정답률 '+Number((record.right/record.total*100).toFixed(2))+'%'),el('p','정답 '+record.right+' · 전체 '+record.total),el('p','제출일 '+new Date(record.at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})));
   var rows=record.rows,seen=new Set(),valid=Array.isArray(rows)&&rows.length===record.total&&rows.every(function(r){
    if(!r||typeof r.questionId!=='string'||typeof r.version!=='string'||seen.has(r.questionId)||!Number.isInteger(r.exam)||!Number.isInteger(r.number)||r.number<1||r.number>50||!['correct','wrong','empty'].includes(r.status))return false;seen.add(r.questionId);return true;
   })&&rows.filter(function(r){return r.status==='correct';}).length===record.right;
   if(valid){var list=section('ul','fe-round-review-breakdown');rows.forEach(function(r){var row=section('li',r.status==='empty'?'is-empty':r.status==='correct'?'is-correct':'is-wrong');row.append(el('span',(all?'제'+r.exam+'회 ':'')+r.number+'번'),el('strong',r.status==='empty'?'미풀이':r.status==='correct'?'O 정답':'X 오답'));list.appendChild(row);});panel.appendChild(list);}
   else panel.appendChild(el('p','이전 기록은 정답률과 제출일만 남아 있어요. 문항별 결과는 새로 제출한 기록부터 표시돼요.'));
  }
  panel.appendChild(button('다시 풀기',function(){markedOnly=record?record.marked:false;restartPractice();}));host.appendChild(panel);
 }
 function currentAccuracy(){
  var n=items.reduce(function(total,q){return total+(selected[q.questionId]?1:0);},0);
  var rate=n?Number((countRight()/n*100).toFixed(2))+'%':'—';
  var meter=section('p','fe-round-practice-accuracy');meter.title='확인한 문제만 기준';
  meter.append(el('span','정답률 '),el('strong',rate));return meter;
 }
 function score(){
  if(!current()||!items.length)return;clear();header();
  var right=0,wrong=0,empty=0,table=section('section','fe-round-review-result fe-round-review-final');
  var misses=section('ul','fe-round-review-breakdown fe-round-review-misses');
  var list=section('ul','fe-round-review-breakdown fe-round-review-all-results');
  items.forEach(function(q){
   var chosen=selected[q.questionId],ok=chosen===q.review.correctOptionId;
   if(!chosen)empty++;else if(ok)right++;else wrong++;
   var row=section('li',!chosen?'is-empty':ok?'is-correct':'is-wrong');
   row.append(el('span',(all?'제'+q.exam+'회 ':'')+q.number+'번'),el('strong',!chosen?'미풀이':ok?'O 정답':'X 오답'));list.appendChild(row);
   if(chosen&&!ok)misses.appendChild(row.cloneNode(true));
  });
  var reached=goalReached(right,items.length),percent=String(Number((right/items.length*100).toFixed(2)));
  var summary=section('section','fe-round-review-summary '+(reached?'is-reached':'is-retry'));
  var heading=el('h3','복습 결과');heading.tabIndex=-1;summary.appendChild(heading);
  var pct=section('p','fe-round-review-percent');pct.append(el('span','정답률 '),el('strong',percent+'%'));summary.appendChild(pct);
  var goal=section('div','fe-round-review-goal '+(reached?'is-reached':'is-retry'));
  var caption=section('p','fe-round-review-goal-text');
  caption.append(el('strong',reached?'목표 달성!':'다시 풀기'),
   el('small',reached?(all?'목표 '+GOAL_PERCENT+'% 달성 · 전체 오답 복습 완료':'목표 '+GOAL_PERCENT+'% 달성 · 다음 회차로 넘어가도 돼요.'):
    '목표 '+GOAL_PERCENT+'% 미달 · 같은 문제를 다시 풀어요.'));
  goal.appendChild(caption);summary.appendChild(goal);
  summary.appendChild(section('p','fe-round-review-counts','정답 '+right+' · 오답 '+wrong+' · 미풀이 '+empty+' · 전체 '+items.length));
  var actions=section('div','fe-round-review-result-actions');
  if(reached)actions.appendChild(button(all?'회차 목록으로':'다음 회차 선택',function(){stop();if(options.onBack)options.onBack();}));
  actions.appendChild(button('다시 풀기',restartPractice));
  actions.appendChild(button('풀이 돌아보기',function(){submitted=false;index=0;save();draw(true);}));
  summary.appendChild(actions);table.appendChild(summary);
  var errors=section('section','fe-round-review-errors');errors.appendChild(el('h4','오답 목록'));
  if(wrong)errors.appendChild(misses);else errors.appendChild(el('p','틀린 문제가 없어요.'));
  table.appendChild(errors);
  var details=section('details','fe-round-review-all-details');details.append(el('summary','전체 문항 결과'),list);table.appendChild(details);
  host.appendChild(table);heading.focus();
 }
 function drawVerdict(correct,animate){
  var doc=host.ownerDocument,svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('class','fe-round-review-hand-mark'+(animate?' is-drawing':''));
  svg.setAttribute('viewBox','0 0 32 32');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
  svg.setAttribute('data-result',correct?'correct':'wrong');
  [['mark-correct','M 25 8 C 19 2 9 3 5 12 C 1 22 10 29 21 25 C 29 22 30 11 23 6 C 17 2 8 5 5 12 C 2 21 13 29 28 27'],['mark-correct mark-texture','M 23 6 C 16 3 8 7 6 14 M 7 23 C 13 28 23 26 27 20'],['mark-wrong mark-first','M 6 6 C 12 10 18 20 26 26'],['mark-wrong mark-second','M 26 6 C 21 12 12 20 6 26']].forEach(function(spec){var p=doc.createElementNS(svg.namespaceURI,'path');p.setAttribute('class',spec[0]);p.setAttribute('d',spec[1]);p.setAttribute('pathLength','100');svg.appendChild(p);});
  return svg;
 }
 function draw(focus,preservedImage,freshGrade){
  if(!current())return;clear(preservedImage);header();
  if(!items.length){host.appendChild(el('p',markedOnly?'쌍별로 표시한 문제가 없어요.':'이 회차에 이용할 수 있는 오답·별표 문제가 없어요.'));return;}
  var q=items[index],at=index,chosen=selected[q.questionId],box=preservedImage||el('div'),heading=section('h3','fe-round-practice-position',(index+1)+'/'+items.length);
  heading.tabIndex=-1;heading.setAttribute('aria-label',(index+1)+'번째 / '+items.length+'문항 · 제'+q.exam+'회 '+q.number+'번');
  if(chosen)heading.prepend(drawVerdict(chosen===q.review.correctOptionId,freshGrade));
  var mark=button('',function(){
   if(marks.has(q.questionId))marks.delete(q.questionId);else marks.add(q.questionId);
   saveMarks();updateMark();
  });
  mark.classList.add('fe-round-review-mark');mark.appendChild(icon());
  function updateMark(){
   var on=marks.has(q.questionId),label=(all?'제'+q.exam+'회 ':'')+q.number+'번 쌍별 '+(on?'해제':'표시');
   mark.setAttribute('aria-label',label);mark.setAttribute('aria-pressed',String(on));mark.title=label;
   var filter=host.querySelector('[data-round-star-filter]');
   if(filter&&!markedOnly){filter.replaceChildren(icon(),host.ownerDocument.createTextNode('쌍별만 다시 보기 ('+marks.size+')'));}
  }
  var toolbar=section('div','fe-round-practice-toolbar');toolbar.append(heading,currentAccuracy());host.append(toolbar,box);updateMark();
  if(!preservedImage){
   if(q.common){var commonBox=el('div');box.appendChild(commonBox);image(q,q.common.image,commonBox,index);}
   var questionBox=section('div','fe-round-question-image');box.appendChild(questionBox);image(q,q.image,questionBox,index,true);
  }
  var choices=section('div','fe-round-review-choices'),status=section('p','fe-round-review-feedback'),answer=el('div'),controls=[];
  choices.setAttribute('role','group');choices.setAttribute('aria-label','답 선택');status.setAttribute('role','status');status.tabIndex=-1;answer.hidden=!chosen;
  function disable(busy){controls.forEach(function(c){c.button.disabled=busy||c.disabled;});}
  function control(b,disabled){controls.push({button:b,disabled:disabled});b.disabled=disabled;return b;}
  function check(fn){
   disable(true);
   return currentMaterials().then(function(ok){
    if(ok&&current()&&index===at&&heading.isConnected)fn();
   }).catch(function(){
    if(current()&&heading.isConnected){status.textContent='자료 상태를 확인하지 못했어요. 다시 시도해 주세요.';disable(false);}
   });
  }
  var submit=null,nextButton=null,listCells=[];
  function itemName(item){return (all?'제'+item.exam+'회 ':'')+item.number+'번';}
  function updateCell(i){
   var item=items[i],cell=listCells[i],answer=selected[item.questionId],draft=drafts[item.questionId];
   var state=answer?(answer===item.review.correctOptionId?'O':'X'):draft?'선택':'미풀이';
   cell.textContent=itemName(item)+' · '+state;
  }
  var list=section('div','fe-round-practice-list'),grid=section('div','fe-round-practice-grid');
  list.id='feRoundPracticeList';list.hidden=true;
  var listToggle=button('문제 목록',function(){
   list.hidden=!list.hidden;listToggle.setAttribute('aria-expanded',String(!list.hidden));
  });
  listToggle.classList.add('fe-round-practice-list-toggle');listToggle.setAttribute('aria-controls',list.id);listToggle.setAttribute('aria-expanded','false');toolbar.appendChild(listToggle);
  items.forEach(function(item,i){
   var cell=control(button('',function(){if(i!==index){index=i;save();draw(true);}}),i===index);
   cell.setAttribute('aria-current',i===index?'step':'false');listCells.push(cell);updateCell(i);grid.appendChild(cell);
  });
  list.appendChild(grid);host.insertBefore(list,box);
  function pick(id){drafts[q.questionId]=id;save();refreshChoice();updateCell(at);}
  function refreshChoice(){
   var active=chosen||drafts[q.questionId];
   Array.from(choices.querySelectorAll('[data-review-choice]')).forEach(function(b,i){b.setAttribute('aria-pressed',String(active===q.options[i].id));});
   if(submit)toggle(submit,(!chosen&&!!drafts[q.questionId])||!Object.keys(selected).length&&!Object.keys(drafts).length);
   if(nextButton)toggle(nextButton,chosen?index===items.length-1:!active);
  }
  function toggle(button,disabled){
   var c=controls.find(function(v){return v.button===button;});c.disabled=disabled;button.disabled=disabled;
  }
  function grade(){
   var draft=drafts[q.questionId];
   if(!draft||chosen)return '';
   selected[q.questionId]=draft;delete drafts[q.questionId];
   var place=itemName(q);
   return place+' · '+(draft===q.review.correctOptionId?'O 정답':'X 오답 · 정답 '+q.review.correctNumber+'번');
  }
  q.options.forEach(function(o){
   var b=button(String(o.number),function(){pick(o.id);});
   b.dataset.reviewChoice='';
   if(chosen===o.id){
    var ok=o.id===q.review.correctOptionId;
    b.dataset.reviewMark=ok?'correct':'wrong';
    b.setAttribute('aria-label',o.number+'번 · 내 선택 · '+(ok?'정답':'오답'));
    var indicator=section('span','fe-round-choice-indicator',ok?'O':'X');
    indicator.setAttribute('aria-hidden','true');b.appendChild(indicator);
   }
   choices.appendChild(control(b,!!chosen));
  });
  choices.appendChild(mark);host.appendChild(status);
  if(chosen){
   var correct=chosen===q.review.correctOptionId,option=q.options.find(function(o){return o.id===chosen;});
   status.classList.add(correct?'is-correct':'is-wrong');
   status.textContent=(correct?'O 정답':'X 오답')+' · 내 선택 '+option.number+'번 · 정답 '+q.review.correctNumber+'번';
   answer.className='fe-round-review-explanation';
   var explanations=root.HanqCbtExplanations,parts=explanations&&explanations.reviewParts?explanations.reviewParts(q,'final'):null;
   function markedText(tag,text){
    var node=el(tag);
    String(text).split(/(\*\*[^*]+\*\*)/).forEach(function(piece,i){
     if(piece)node.appendChild(i%2?el('strong',piece.slice(2,-2)):host.ownerDocument.createTextNode(piece));
    });
    return node;
   }
   var stem=section('section','fe-round-review-stem');
   stem.appendChild(el('h4','지문 해설'));
   if(parts&&parts.stem.length){
    var lines=el('ul');parts.stem.forEach(function(line){lines.appendChild(markedText('li',line));});stem.appendChild(lines);
   }else stem.appendChild(el('p','이 문항의 지문 해설을 확인하지 못했어요.'));
   answer.appendChild(stem);
   var optionArea=section('section','fe-round-review-options');
   optionArea.appendChild(el('h4','보기별 해설'));
   var notes=section('ol','fe-round-review-option-notes');
   choiceNotes(q).forEach(function(text,i){
    var line=el('li');line.append(el('strong','①②③④⑤'[i]),el(q.options[i].id===q.review.correctOptionId?'strong':'span',text));notes.appendChild(line);
   });
   optionArea.appendChild(notes);answer.appendChild(optionArea);
   var conclusion=section('section','fe-round-review-conclusion');
   conclusion.append(el('h4','결론'),el('strong','정답 '+'①②③④⑤'[q.review.correctNumber-1]));
   if(parts&&(parts.conclusion||parts.answer))conclusion.appendChild(markedText('p',parts.conclusion||parts.answer));
   answer.appendChild(conclusion);
   host.appendChild(answer);
  }
  var dock=section('div','fe-round-review-dock');
  if(index===items.length-1){
   submit=control(button('최종 제출',function(){check(function(){items.forEach(function(item){var draft=drafts[item.questionId];if(!selected[item.questionId]&&draft)selected[item.questionId]=draft;});drafts={};submitted=true;save();saveLatest();score();});}),false);
   dock.appendChild(submit);
  }
  var nav=section('nav','fe-round-review-nav');
  nav.setAttribute('aria-label','복습 답 선택과 문제 이동');
  function rightAction(){
   if(chosen){index++;save();draw(true);return;}
   if(!drafts[q.questionId])return;
   check(function(){grade();save();draw(false,box,true);var result=host.querySelector('.fe-round-review-feedback');if(result)result.focus();});
  }
  nextButton=control(button(chosen?'›':'확인',rightAction),false);
  nextButton.classList.add('fe-round-review-right');nextButton.dataset.roundReviewAction=chosen?'next':'check';
  nextButton.setAttribute('aria-label',chosen?'다음 문제':'선택한 답 확인');
  var previous=control(button('‹',function(){index--;save();draw(true);}),index===0);
  previous.classList.add('fe-round-review-prev');previous.setAttribute('aria-label','이전 문제');
  nav.append(previous,choices,nextButton);
  dock.insertBefore(nav,submit);host.appendChild(dock);refreshChoice();if(focus)heading.focus();
 }
 off=api.onChange?api.onChange(function(){if(!current())stop();}):null;
 resetOff=root.HanqLearningReset&&root.HanqLearningReset.onChange?root.HanqLearningReset.onChange(resetChanged):null;
 var ready=refreshMaterials();
 return {ready:ready,stop:stop,restart:restartPractice};
}
root.HanqCbtRoundMaterials={normalize:normalize,load:load,mount:mount,sourceLines:sourceLines,choiceNotes:choiceNotes,latest:latest,goalReached:goalReached};
})(window);