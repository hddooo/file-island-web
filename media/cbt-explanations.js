/* Final CBT results only. Reviewed explanations replace display text, never saved exam data. */
(function (root) {
  'use strict';
  function array(x) { return Array.isArray(x) ? x : []; }
  function optionsValid(xs) { return Array.isArray(xs) && xs.length === 5 && xs.every(function(o) { return o && typeof o === 'object' && !Array.isArray(o); }); }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function md(x) { return esc(x).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>'); }
  function lines(xs) { return array(xs).filter(function(x) { return typeof x === 'string' && x.trim(); }); }
  function list(xs) { return '<ul>' + lines(xs).map(function(x) { return '<li>' + md(x) + '</li>'; }).join('') + '</ul>'; }
  function matching(q, entry) {
    var v = q && q.review, old = v && v.item;
    if (!entry || !optionsValid(entry.options) || !Number.isInteger(entry.answer) || entry.answer < 1 || entry.answer > 5 || !v || !old || !['correct','wrong','unanswered'].includes(v.status)) return false;
    if (q.questionId !== entry.id || old.id !== entry.id || q.version !== entry.v || old.v !== entry.v ||
        q.exam !== entry.exam || q.number !== entry.number || old.exam !== entry.exam || old.number !== entry.number || q.points !== entry.points || old.points !== entry.points ||
        old.answer !== entry.answer || v.correctNumber !== entry.answer || v.correctOptionId !== entry.options[entry.answer - 1].id) return false;
    var opts = array(old.options), pub = array(q.options), graded = array(v.options);
    if (!optionsValid(opts) || !optionsValid(pub) || !optionsValid(graded)) return false;
    return entry.options.every(function(o, i) {
      return pub[i].id === o.id && pub[i].number === i + 1 && opts[i].id === o.id && opts[i].number === i + 1 &&
        opts[i].text === o.text && opts[i].correct === o.correct && graded[i].id === o.id && graded[i].number === i + 1 && graded[i].correct === o.correct;
    });
  }
  function resolve(q, status) {
    if (status !== 'final') return null;
    var data = root.HANQ_CBT_EXPLANATIONS, extra = root.HANQ_CBT_EXPLANATIONS_80;
    var entry = q && ((data && data.items && data.items[q.questionId]) || (extra && extra.items && extra.items[q.questionId]));
    return matching(q, entry) ? entry : null;
  }
  // Official question and answer-sheet archival pages; not third-party explanatory PDFs.
  var examArchive={70:'1000030012',71:'1000030032',72:'1000030043',73:'1000030052',74:'1000030069',75:'1000030080',76:'1000030098',77:'1000030110',78:'1000030119',79:'1000030131',80:'1000030154'};
  // Independently checked against the current 81st-edition learning material and original crops.
  // Textbook PDF SHA-256: d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de
  var currentBookNotes={
    'exam-70-01':{pages:'9–10', printed:'2–3', topic:'선사 · 청동기 시대',
      reason:['그림에 체크된 **비파형 동검**과 지문의 **사유 재산·계급 발생**은 둘 다 청동기 단서예요. 학습자료에서 도구와 생활 모습을 같은 시대에 묶어 기억하면 돼요.',
        '청동기에 생긴 지배층은 많은 사람을 동원해 무덤인 **고인돌**을 만들었어요. 그래서 계급이 생겼다는 단서와 이어지는 ③이 정답이에요.']},
    'exam-70-02':{pages:'12–13', printed:'5–6', topic:'선사 · 철기 시대 여러 나라',
      reason:['표에서 부여의 가축 이름 관직과 삼한의 철 수출은 비교용이에요. **(가) 행의 단궁·과하마·반어피**가 학습자료의 동예 특산물과 일치해요.',
        '동예의 제천 행사는 **10월 무천**이에요. 여러 나라에 가을 제천 행사가 있었으니 달만 보지 말고 행사 이름까지 확인하면 ③을 고를 수 있어요.']},
    'exam-70-03':{pages:'17, 19–20, 22–23', printed:'10, 12–13, 15–16', topic:'삼국 · 백제 개로왕에서 동성왕까지',
      reason:['도림과 문주가 나오는 자료는 **장수왕의 한성 공격과 개로왕 전사**를 가리켜요. 문제는 원인이 아니라 이 사건 **이후의 영향**을 묻고 있어요.',
        '학습자료에서 백제의 흐름을 **한성 함락 → 문주왕의 웅진 천도 → 동성왕의 혼인 동맹**으로 잡으면 돼요. 눌지왕·비유왕 때 이미 맺은 동맹을 동성왕이 신라 소지 마립간과의 혼인으로 강화한 ②가 그 뒤의 일이에요.']},
    'exam-70-04':{pages:'17, 19', printed:'10, 12', topic:'삼국 · 고구려의 소수림왕',
      reason:['학습자료의 고구려 왕 표에서 **율령·태학·전진**이 함께 나오는 왕은 **소수림왕**이에요. 법과 교육으로 통치 체제를 갖추고 전진과 교류했어요.',
        '지문의 외교 칸을 이어 보면 전진에서 온 승려 **순도**가 불교를 전했어요. 소수림왕 때의 일인 ①이 정답이에요.']},
    'exam-70-05':{pages:'18, 21', printed:'11, 14', topic:'삼국 · 도교',
      reason:['그림 속 **사신도와 산수무늬 벽돌**, 강연의 **신선·불로장생**을 함께 보면 **도교**예요. 학습자료에서도 사신도는 도교 유물로 구분해요.',
        '고구려는 연개소문 때 당에 **도사 파견**을 요청했어요. 도교와 연결되는 ②가 정답이고, 불교 경전이나 유교 관련 보기는 종교가 달라요.']},
    'exam-70-06':{pages:'24, 32', printed:'17, 25', topic:'삼국·남북국 · 신라의 승려',
      reason:['학습자료의 신라 승려 표에서 **일심·화쟁**을 함께 내세운 인물은 **원효**예요. 문항에 나온 《금강삼매경론》과 《대승기신론소》도 원효의 저술이에요.',
        '원효는 **무애가**로 백성에게 불교를 쉽게 전했어요. 같은 승려라도 혜초는 인도 순례, 의상은 화엄 사상으로 구별하면 ③을 고를 수 있어요.']},
    'exam-70-07':{pages:'35, 37', printed:'28, 30', topic:'남북국 · 발해의 건국과 지방 제도',
      reason:['자료의 **조영**은 고구려 계승 세력의 **대조영**이에요. 학습자료에서 대조영이 세운 나라가 발해임을 먼저 찾아요.',
        '문제는 대조영 개인의 업적이 아니라 **발해의 제도**를 묻고 있어요. 발해가 지방을 **5경 15부 62주**로 편성했다는 ④가 정답이에요.']},
    'exam-70-08':{pages:'31–32, 34', printed:'24–25, 27', topic:'남북국 · 신라 말의 최치원',
      reason:['당에 유학한 6두품이라는 설명만으로는 인물을 확정할 수 없어요. 학습자료에서 **진성 여왕에게 시무책 10여 조를 올렸다**는 단서를 찾으면 **최치원**이에요.',
        '최치원은 당에서 황소의 난 때 쓴 **격황소서**로 이름을 떨쳤어요. 시무책과 격황소서를 같은 인물의 활동으로 묶으면 ③이 정답이에요.']},
    'exam-70-09':{"pages":"31, 33–34","printed":"24, 26–27","topic":"김경신·김주원, 선덕왕 사후 왕위계승","reason":["김경신은 선덕왕이 죽은 뒤 김주원과의 왕위 계승 경쟁에서 왕위에 오른 원성왕이에요. 즉위한 785년은 연표에서 혜공왕 피살(780) 뒤, 청해진 설치(828) 앞이므로 ④ (라)에 들어가요."]},
    'exam-70-10':{"pages":"31–32, 34, 42","printed":"24–25, 27, 35","topic":"견훤 귀순과 일리천 전투 사이","reason":["빈 장면은 신라가 고려에 항복한 뒤의 일을 담아야 해요. 왕건이 신라의 마지막 왕 경순왕 김부를 경주의 사심관으로 삼은 ③이 이 자리에 맞아요."]},
    'exam-70-11':{"pages":"45–46, 53–54","printed":"38–39, 46–47","topic":"다인철소·명학소, 특수행정구역 소","reason":["다인철소와 공주 명학소처럼 특정 물품을 생산·공급하던 소가 등장하므로 (가)는 고려예요. 고려 경제에 해당하는 보기는 시전의 거래를 감독한 경시서를 설명한 ④예요."]},
    'exam-70-12':{"pages":"55, 57","printed":"48, 50","topic":"지눌과 정혜쌍수","reason":["지눌은 수선사 결사를 이끌며 선정과 지혜를 함께 닦는 정혜쌍수를 강조했어요. 따라서 지눌에게 권수정혜결사문과 정혜쌍수를 연결한 ③이 맞고, 나머지는 다른 승려의 활동을 바꾸어 놓은 짝이에요."]},
    'exam-70-13':{"pages":"43–44","printed":"36–37","topic":"주전도감·해동통보, 남경 궁궐","reason":["주전도감을 두어 해동통보를 발행한 고려 왕은 숙종이에요. 숙종은 윤관의 건의를 받아 여진에 대응할 별무반을 만들었으므로 ①이 맞아요. 별무반 창설은 숙종, 그 군대를 이끌고 동북 9성을 개척한 때는 다음 왕 예종으로 구별해요."]},
    'exam-70-14':{"pages":"45–46","printed":"38–39","topic":"정중부, 의종 폐위, 김보당의 복위 시도","reason":["정중부 등이 의종을 몰아낸 사건은 무신 정변이에요. 조위총은 이 무신 정권에 반발해 서경에서 봉기했으므로, 반란의 이유를 조사하는 ④가 자료와 직접 연결돼요."]},
    'exam-70-15':{"pages":"45–46","printed":"38–39","topic":"강화도 이동과 진도 삼별초 패배 사이","reason":["(가)는 몽골에 맞서 강화도로 옮긴 때이고, (나)는 진도의 삼별초가 패하여 남은 세력이 제주도로 이동한 때예요. 두 사건 사이 몽골 항쟁기에 김윤후가 처인성에서 살리타를 사살했으므로 ④가 맞아요."]},
    'exam-70-16':{"pages":"42, 47","printed":"35, 40","topic":"응방, 공녀 선발","reason":["매를 기르는 응방과 원에 보낼 공녀의 선발은 원의 간섭을 받던 고려의 모습을 가리켜요. 이 시기 지배층에 몽골식 머리 모양과 옷차림인 변발·호복이 유행했으므로 ③이 맞아요."]},
    'exam-70-17':{"pages":"60, 62","printed":"53, 55","topic":"두 차례 왕자의 난으로 즉위","reason":["두 차례 왕자의 난을 거쳐 즉위한 왕은 태종 이방원이에요. 태종은 문하부를 없애고 그 안의 낭사를 사간원으로 독립시켰으므로 ④가 맞아요. 왕자의 난이라는 즉위 단서와 이후의 통치 체제 정비를 연결하는 문제예요."]},
    'exam-70-18':{"pages":"61–62","printed":"54–55","topic":"함길도 병마도절제사, 계유정난 피해","reason":["세종 때 북방에서 활동하고 계유정난 때 제거된 인물은 김종서예요. 김종서는 두만강 일대에 6진을 개척했으므로 ①이 맞아요. 같은 세종 때의 북방 개척이라도 최윤덕의 4군과 김종서의 6진은 인물을 나누어 기억해요."]},
    'exam-70-19':{"pages":"61, 79, 86","printed":"54, 72, 79","topic":"옛 집현전 기능을 이은 홍문관","reason":["집현전의 학문 기능을 잇는 홍문관을 설치한 왕은 성종이에요. 성종 때 국가 의례를 정리한 국조오례의가 완성되었으므로 ③이 맞아요. 홍문관이라는 기관 단서를 왕으로 바꾼 뒤, 같은 왕 때의 문물 정비를 고르면 돼요."]},
    'exam-70-20':{"pages":"61, 63","printed":"54, 56","topic":"조광조, 소격서 혁파, 천거 방식의 현량과","reason":["조광조의 소격서 폐지 주장과 천거로 인재를 뽑는 현량과 건의는 중종 때의 사림 개혁이에요. 따라서 두 자료를 함께 설명하는 탐구 주제는 중종 때 사림파 언관들의 주장을 조사하는 ③이에요."]},
    'exam-70-21':{"pages":"66","printed":"59","topic":"임진왜란과 훈련도감","reason":["의병장 고경명·조헌이 등장하는 전쟁은 임진왜란으로 좁힌다.","교재의 임진왜란 항목에 삼수병으로 구성된 훈련도감 설치가 연결되므로 ①이다."]},
    'exam-70-22':{"pages":"32, 55, 80","printed":"25, 48, 73","topic":"사찰과 문화유산 연결","reason":["법주사 팔상전·부석사 무량수전·봉정사 극락전·해인사 장경판전은 교재의 각 사찰과 연결된다.","무구정광대다라니경의 발견지는 불국사 석가탑이다. 선암사에 연결한 ⑤가 잘못된 설명이다."]},
    'exam-70-23':{"pages":"66–67, 75","printed":"59–60, 68","topic":"대동법과 균역법 구분","reason":["이원익의 건의와 경기도 시행, 방납 부담 개선은 대동법을 가리킨다.","대동법은 선혜청·공인과 연결된다. 결작과 어장세·선박세는 균역법의 부족 재정 보완책이므로 ㄱ·ㄷ인 ②이다."]},
    'exam-70-24':{"pages":"67, 75, 79","printed":"60, 68, 72","topic":"정조의 규장각과 수원 화성","reason":["규장각에 서얼 출신을 기용한 왕은 정조다.","교재는 정조의 사업으로 거중기를 활용한 수원 화성 축조를 제시하므로 ②와 맞는다."]},
    'exam-70-25':{"pages":"53, 75, 78","printed":"46, 68, 71","topic":"조선 후기 상업과 고려 무역 구분","reason":["만상·송상의 대청 무역은 조선 후기 경제 활동에 해당한다.","덕대·상평통보·포구의 중개 상인·상품 작물은 같은 시기에 연결된다. 벽란도의 송 상인은 고려에 속하므로 ②가 시대에 맞지 않는다."]},
    'exam-70-26':{"pages":"80–82","printed":"73–75","topic":"박지원과 양반전","reason":["열하일기의 저자는 박지원이다.","교재의 박지원 행은 양반전을 양반의 허례와 무능에 대한 풍자와 연결한다. 따라서 ④이다."]},
    'exam-70-27':{"pages":"82","printed":"75","topic":"김홍도와 씨름","reason":["단원이라는 호로 김홍도를 식별한다.","교재의 그림 도판에서 씨름은 김홍도, 금강전도는 정선, 파적도는 김득신, 월하정인은 신윤복, 영통동구도는 강세황으로 구분된다. 김홍도의 작품은 ①이다."]},
    'exam-70-28':{"pages":"89","printed":"82","topic":"병인양요와 신미양요 사이의 사건","reason":["양헌수·정족산성은 병인양요, 어재연·광성보는 신미양요의 단서다.","교재 상단 연표는 두 양요 사이에 오페르트 도굴 사건을 놓는다. 남연군 묘 도굴 시도인 ②를 고른다."]},
    'exam-70-29':{"pages":"91","printed":"84","topic":"조미 수호 통상 조약","reason":["민영익·홍영식 등이 참여한 보빙사는 조미 수호 통상 조약 이후의 사절이다.","교재는 이 조약에 최혜국 대우 최초 규정을 연결하므로 ①이다."]},
    'exam-70-30':{"pages":"93","printed":"86","topic":"갑신정변과 한성 조약","reason":["급진 개화파·우정총국·청군 개입·3일은 갑신정변의 단서다.","교재는 정변 뒤 조선과 일본이 한성 조약을 체결한 결과를 연결한다. 따라서 ③이다."]},
    'exam-70-31':{"pages":"105, 107","printed":"98, 100","topic":"덕수궁과 제1차 미소 공동 위원회","reason":["고종의 환궁과 돈덕전이 있는 궁궐이라는 문제 단서로 덕수궁을 식별한다.","교재의 궁궐 항목과 확인 문제는 덕수궁을 제1차 미소 공동 위원회 개최와 연결하므로 ①이다."]},
    'exam-70-32':{"pages":"99","printed":"92","topic":"정미의병과 서울 진공 작전","reason":["고종 강제 퇴위와 군대 해산에 대한 반발은 정미의병의 발생 배경이다.","교재는 정미의병에 13도 창의군 결성과 서울 진공 작전을 연결한다. 따라서 ⑤이다."]},
    'exam-70-33':{"pages":"105","printed":"98","topic":"경인선 개통과 한성 사범 학교","reason":["경인선 개통은 대한제국 초기의 변화라는 단서다.","1895년 설립된 한성 사범 학교는 근대 교육을 담당할 교사를 양성하던 기관이므로 이 시기의 모습으로 고를 수 있다."]},
    'exam-70-34':{"pages":"116","printed":"109","topic":"서간도 독립운동 기지","reason":["신흥 무관 학교가 있던 지역은 서간도다.","서간도에서는 이주 한인의 생활과 독립운동 기반을 마련할 자치 기구 경학사가 조직되었다."]},
    'exam-70-35':{"pages":"109, 111","printed":"102, 104","topic":"3·1운동과 문화 통치","reason":["고종의 인산일과 독립 선언·만세 시위는 3·1 운동을 가리킨다.","전국적인 저항을 겪은 일제가 통치 방식을 이른바 문화 통치로 바꾸었다."]},
    'exam-70-36':{"pages":"109, 111","printed":"102, 104","topic":"1910년대 무단 통치","reason":["토지 조사 사업은 1910년대 무단 통치기의 정책이다.","조선인에게만 태형을 적용한 조선 태형령도 같은 시기에 해당한다."]},
    'exam-70-37':{"pages":"116, 123","printed":"109, 116","topic":"대종교와 중광단","reason":["나철과 단군 신앙이라는 단서로 대종교를 찾는다.","대종교 계열은 중광단을 조직하며 무장 독립운동을 전개했다."]},
    'exam-70-38':{"pages":"117, 120","printed":"110, 113","topic":"1920년대 독립운동의 시련 순서","reason":["간도 참변 뒤 독립군이 이동한 자유시에서 큰 피해를 입었다.","이후 미쓰야 협정으로 일제와 만주 군벌의 독립군 단속이 강화되므로 간도 참변·자유시 참변·미쓰야 협정 순이다."]},
    'exam-70-39':{"pages":"123","printed":"116","topic":"아리랑과 1920년대 문화","reason":["나운규의 영화 아리랑은 1926년에 발표된 작품이다.","따라서 같은 1920년대에 활동한 카프 작가가 당시 모습에 해당한다."]},
    'exam-70-40':{"pages":"110, 123","printed":"103, 116","topic":"전시 체제와 예방 구금령","reason":["중일 전쟁 이후의 전쟁 확대와 국민학교 교육은 전시 통제가 강화된 시기를 가리킨다.","1941년 조선 사상범 예방 구금령은 이 시기의 탄압 정책이다."]},
    'exam-70-41':{"pages":"110, 113, 115","printed":"103, 106, 108","topic":"조소앙의 삼균주의","reason":["건국 강령 초안을 작성한 인물이라는 단서를 조소앙과 연결한다.","조소앙의 삼균주의는 임시 정부 건국 강령의 기초가 되었다."]},
    'exam-70-42':{"pages":"127–128","printed":"120–121","topic":"남북 협상의 시기","reason":["김구·김규식이 유엔 위원단에 남북 지도자 회담을 제안했으므로 남북 협상 추진 단계다.","유엔의 총선거 결정 뒤이며 제헌 국회 구성 전이므로 연표의 마 구간이다."]},
    'exam-70-43':{"pages":"134–135","printed":"127–128","topic":"노태우 정부의 통일 정책","reason":["남북 유엔 동시 가입과 남북 기본 합의서는 노태우 정부를 가리킨다.","같은 정부의 통일 정책은 민족 자존과 통일 번영을 위한 7·7 선언이다."]},
    'exam-70-44':{"pages":"129–130","printed":"122–123","topic":"한미 상호 방위 조약 이후","reason":["한미 상호 방위 조약은 6·25 전쟁의 정전 뒤 체결되었다.","보기 중 그 뒤의 사건은 조봉암 처형이며 나머지 네 사건은 조약 체결보다 앞선다."]},
    'exam-70-45':{"pages":"131, 133","printed":"124, 126","topic":"유신 헌법과 제5공화국 헌법","reason":["통일 주체 국민 회의에서 대통령을 선출하고 임기가6년인 가는 유신 헌법이다.","유신 헌법의 대통령 국회의원3분의1 추천 조항을 고르고 선거인단·7년 단임인 나는 전두환 정부 헌법으로 구별한다."]},
    'exam-70-46':{"pages":"134, 136","printed":"127, 129","topic":"김영삼 정부의 경제","reason":["금융 실명제와 IMF 지원 요청은 모두 김영삼 정부의 사건이다.","OECD 가입도 같은 정부 때 이루어졌으므로 두 자료 사이에 들어간다."]},
    'exam-70-47':{"pages":"135–136","printed":"128–129","topic":"노무현 정부의 사회 정책","reason":["호주제 폐지라는 단서로 노무현 정부를 찾는다.","진실·화해를 위한 과거사 정리 기본법 제정도 같은 정부의 일이다."]},
    'exam-70-48':{"pages":"17, 42, 53, 67, 89","printed":"10, 35, 46, 60, 82","topic":"구휼 제도와 사창제의 오연결","reason":["구제도감은 고려의 구호 기구이므로 조선 사창제의 설명으로 연결할 수 없다.","사창제는 마을 단위 곡물 운영과 연결해야 하므로 구제도감을 두었다는 다섯째 설명이 부적절하다."]},
    'exam-70-49':{"pages":"135","printed":"128","topic":"김대중 정부와 국가 인권 위원회","reason":["한일 월드컵이 열린 정부는 김대중 정부다.","국가 인권 위원회 출범도 같은 정부의 일이다."]},
    'exam-70-50':{"pages":"99, 110, 129, 131, 142–143","printed":"92, 103, 122, 124, 135–136","topic":"대구·광주의 지역사","reason":["달구벌·2·28은 대구이고 빛고을·5·18은 광주다.","대구의 국채 보상 운동과 광주의 학생 항일 운동이 맞고 YH 농성은 서울, 김주열 시신 발견은 마산으로 구별한다."]}
  };
  function groundedOverview(entry) {
    var overview=entry&&entry.overview||{}, note=entry&&currentBookNotes[entry.id];
    return note?Object.assign({},overview,{reason:note.reason.slice()}):overview;
  }
  function reviewedReferences(entry, note) {
    var base=array(entry.references).slice(), archived=examArchive[entry.exam];
    if (!archived) return base;
    var examRef=array(entry.overview&&entry.overview.refs).find(function(r){return r&&r.kind==='exam'&&r.exam===entry.exam&&r.number===entry.number&&Number.isSafeInteger(r.page)&&r.page>0;});
    var first={label:'제'+entry.exam+'회 '+entry.number+'번 · 공식 문제지'+(examRef?' '+examRef.page+'쪽':'')+'·정답표',url:'https://www.historyexam.go.kr/pst/view.do?bbs=dat&pst_sno='+archived};
    base=base.filter(function(r){return r&&!(r.url===first.url||/원문·공식 정답/.test(r.label||'')||note&&/^교재 근거/.test(r.label||''));});
    if(note)base.unshift({label:'81회 대비 시대별 학습자료 · '+note.topic+' · PDF '+note.pages+'쪽 (인쇄 '+note.printed+'쪽)'});
    return [first].concat(base);
  }
  function render(q, legacy, status) {
    if (status !== 'final' || !q || !q.review) return '';
    var entry = resolve(q, status), item = entry || q.review.item || {}, o = entry ? groundedOverview(entry) : item.overview || {}, opts = array(item.options);
    // Unknown/old schemas keep the established renderer; never substitute another question.
    if (!lines(o.reason).length || !optionsValid(opts)) {
      try { return legacy && legacy.render ? legacy.render(item, q.selectedOptionId || null) : ''; } catch (e) { return ''; }
    }
    var key = 'fe-exp-' + String(q.exam) + '-' + String(q.position).replace(/[^a-z0-9_-]/gi, ''), selected = q.selectedOptionId || null;
    var bookNote = entry && currentBookNotes[entry.id], reason = lines(o.reason), extra = reason.slice(3).concat(lines(o.context));
    var html = '<article class="fe-explanation" data-reviewed="' + (entry ? 'true' : 'false') + '">' +
      '<section class="fe-stem-analysis" aria-labelledby="' + key + '-stem"><h4 id="' + key + '-stem">지문 분석</h4>' +
      '<div class="fe-exp-meaning">' + list(reason.slice(0, 1)) + '</div>' +
      (reason.length > 1 ? '<div class="fe-exp-core">' + list(reason.slice(1, 3)) + '</div>' : '') +
      '<p class="fe-exp-answer"><b>정답 연결</b> ' + md(o.answer) + '</p>' +
      (lines(o.contrast).length ? '<div class="fe-exp-contrast"><b>헷갈림 구분</b>' + list(lines(o.contrast).slice(0, 1)) + '</div>' : '') +
      '<details class="fe-exp-context"><summary>핵심어·배경 더 보기</summary>' +
      (lines(o.clue).length ? '<p class="fe-exp-keywords"><b>결정 단서</b> ' + lines(o.clue).map(function(s) { return '<span>' + md(s) + '</span>'; }).join(' ') + '</p>' : '') +
      (lines(o.memory).length ? '<p class="fe-exp-keywords"><b>함께 외울 말</b> ' + lines(o.memory).map(function(s) { return '<span>' + md(s) + '</span>'; }).join(' ') + '</p>' : '') +
      list(extra.concat(lines(o.contrast).slice(1))) + '</details></section>' +
      '<section class="fe-option-analysis" aria-labelledby="' + key + '-options"><h4 id="' + key + '-options">보기 분석</h4><ol>';
    html += opts.map(function(p, i) {
      var good = p.correct === true, chosen = p.id === selected;
      return '<li class="fe-exp-option ' + (good ? 'is-correct' : 'is-incorrect') + (chosen ? ' is-selected' : '') + '" data-option-id="' + esc(p.id) + '">' +
        '<p class="fe-exp-option-heading"><b>' + '①②③④⑤'[i] + '</b><span>' + (good ? '정답' : '오답 보기') + (chosen ? ' · 내가 고른 답' : '') + '</span></p>' + list(lines(p.review).slice(0, 1)) +
        (lines(p.review).length > 1 ? '<details class="fe-exp-context"><summary>설명 더 보기</summary>' + list(lines(p.review).slice(1)) + '</details>' : '') + '</li>';
    }).join('');
    html += '</ol></section>';
    var references=entry?reviewedReferences(entry,bookNote):[];
    if (references.length) html += '<details class="fe-exp-sources"><summary>해설 근거</summary><ul>' + references.map(function(r) {
      return '<li>' + (/^https:\/\/[^\s/]+\//.test(r.url || '') ? '<a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + esc(r.label) + '</a>' : esc(r.label)) + '</li>';
    }).join('') + '</ul></details>';
    return html + '</article>';
  }
  // Wrong-note replay/study APIs reveal this item only after grading. The independently
  // returned correct option is still required; this adapter never grades or saves an answer.
  function renderGraded(saved, selected, correctId, position, displayed) {
    var item = saved && saved.item, options = item && array(item.options), visible = displayed && displayed.item;
    if (!item || !/^exam-(?:7[0-9]|80)-[0-9]{2}$/.test(item.id || '') || !optionsValid(options) || !correctId || !visible || displayed.kind !== 'mock') return '';
    if (displayed.questionId !== item.id || displayed.version !== item.v || visible.id !== item.id || visible.v !== item.v ||
        visible.exam !== item.exam || visible.number !== item.number || visible.points !== item.points ||
        (displayed.points != null && displayed.points !== item.points) || !optionsValid(visible.options)) return '';
    var order = array(displayed.optionOrder);
    if (order.length !== 5 || !options.every(function(o, i) { return order[i] === o.id && visible.options[i].id === o.id && visible.options[i].text === o.text; })) return '';
    var number = options.findIndex(function(o) { return o.id === correctId; }) + 1;
    if (!number) return '';
    var q = { questionId:item.id, version:item.v, exam:item.exam, number:item.number, points:item.points,
      position:position == null ? item.number : position, selectedOptionId:selected || null,
      options:options.map(function(o) { return {id:o.id,number:o.number}; }),
      review:{item:item, status:selected ? (selected === correctId ? 'correct' : 'wrong') : 'unanswered',
        correctNumber:number, correctOptionId:correctId, options:options} };
    return resolve(q, 'final') ? render(q, null, 'final') : '';
  }
  root.HanqCbtExplanations = { resolve: resolve, render: render, renderGraded: renderGraded, groundedOverview: groundedOverview };
})(window);
