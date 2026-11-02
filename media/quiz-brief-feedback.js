/* Compact, source-derived option attribution. Does not modify questions or save answers. */
(function(root){'use strict';var known={
'강동 6주':['강동 6주 확보','고려','성종'],'동북 9성':['동북 9성 축조','고려','예종'],'귀주대첩':['귀주대첩','고려','현종'],'우산국':['우산국 복속','신라','지증왕'],
'태학':['태학 설치','고구려','소수림왕'],'국자감':['국자감 정비','고려','성종'],'국학':['국학 설치','통일 신라','신문왕'],'7재':['7재 설치','고려','예종'],'양현고':['관학 지원','고려','예종'],'서적포':['서적포 설치','고려','숙종'],
'별무반':['별무반 편성','고려','숙종'],'규장각':['규장각 설치','조선','정조'],'장용영':['장용영 설치','조선','정조'],'균역법':['군포 1필','조선','영조'],'노비안검법':['노비안검법','고려','광종'],
'대성전':['성균관 교육','조선','성균관'],'교수·훈도':['지방 교육','조선','향교']};
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}function norm(s){return String(s||'').replace(/[^가-힣A-Za-z0-9]/g,'');}function plain(s){return String(s||'').replace(/\*\*/g,'');}
var realm={prehistory:'선사',gojoseon:'고조선·여러 나라',samguk:'삼국',nambuk:'남북국',goryeo:'고려','joseon-early':'조선','joseon-late':'조선',joseon:'조선',opening:'개항기',colonial:'일제 강점기',modern:'현대',islands:'독도·간도',iron:'철기'};
function corpus(){var q=root.HANQ_QUIZ_CATALOG&&root.HANQ_QUIZ_CATALOG.questions||{},out={};Object.values(q).forEach(function(x){var c=x.options.find(function(o){return o.correct;});if(c){var k=norm(c.text);(out[k]||(out[k]=[])).push(x);}});return out;}var indexed=null;
function ownSource(o){if(!indexed)indexed=corpus();var candidates=(indexed[norm(o.text)]||[]).filter(function(q){return q.origin==='legacy'||q.origin==='source';});var realms=Array.from(new Set(candidates.map(function(q){return realm[q.chapter];})));if(realms.length!==1)return null;candidates=candidates.filter(function(q){return q.shape==='single'&&q.q&&q.q.length<=65&&!/→|____/.test(q.q);}).sort(function(a,b){return a.q.length-b.q.length;});return candidates.length?o.text+' — '+candidates[0].q:null;}
// These compact lines restate the same question's overview.reason/contrast, not the false pairing printed in a negative option.
var sourceLines={
"exam-72-23-option-1":"매화초옥도 — 조선 후기, 전기",
"exam-73-06-option-3":"판갑옷 — 가야, 철판을 이어 만든 갑옷",
"exam-73-06-option-4":"농경문 청동기 — 초기 철기, 농경·제사 의식",
"exam-75-03-option-3":"판갑옷 — 가야, 철판을 이어 만든 갑옷",
"exam-76-04-option-4":"판갑옷 — 가야, 철판을 이어 만든 갑옷",
"exam-76-17-option-4":"도기 바퀴장식 뿔잔 — 가야, 수레바퀴·뿔잔",
"exam-76-17-option-5":"분청사기 상준 — 조선, 코끼리 모양 제기",
"exam-76-27-option-4":"대장간 — 조선 후기, 김홍도",
"exam-77-04-option-3":"농경문 청동기 — 초기 철기, 농경·제사 의식",
"exam-78-26-option-2":"매화초옥도 — 조선 후기, 전기",
'exam-70-42-option-4':'좌우 합작 7원칙 → 유엔 총회 남북한 총선거 결의',
'exam-70-50-option-4':'YH 무역 농성 — 서울 / 김주열 시신 발견 — 마산',
'exam-72-29-option-3':'독립신문 — 서재필 / 일장기 말소 — 동아일보',
'exam-72-29-option-5':'일장기 말소 — 동아일보 / 최초 상업 광고 — 한성주보',
'exam-72-42-option-1':'광주 학생 항일 운동 진상 조사 — 신간회',
'exam-72-48-option-2':'병부 설치 — 신라 법흥왕 / 6조 직계제 — 조선 세조',
'exam-72-48-option-5':'6조 직계제 — 조선 세조 / 초계문신제 — 조선 정조',
'exam-74-18-option-2':'좌·우사정 — 발해 정당성 / 서경권 — 고려 대간',
'exam-74-18-option-5':'서경권 — 고려 대간 / 도병마사 — 고려 국방 논의',
'exam-74-29-option-3':'김홍집 — 수신사',
'exam-74-41-option-3':'에네켄 농장 — 멕시코 이민',
'exam-74-50-option-5':'선거조례 — 제1차 갑오개혁',
'exam-76-03-option-4':'한성 함락 → 관산성 전투 — 삼국 시대'
};
function brief(q,o){if(q.origin==='reviewed-source'&&o.verifiedBrief)return o.verifiedBrief;if(sourceLines[o.id])return sourceLines[o.id];

if(q.id==='check-02-01'&&q.q.includes('진개의 공격')&&q.q.includes('한 무제가 왕검성')){var names={'④':'진개 공격','①':'위만 왕위 찬탈','③':'진번·임둔 복속','②':'한 무제 왕검성 공격'},right=q.answer.split('→'),picked=o.text.split('→');if(o.correct)return right.map(function(n){return names[n];}).join(' → ')+' — 고조선';var ix=right.findIndex(function(n,i){return n!==picked[i];});if(ix>=0&&names[right[ix]]&&names[picked[ix]])return names[right[ix]]+' → '+names[picked[ix]]+' — 고조선';}

var reviews=o.review||[],source=String(reviews[0]||'');
var pair=String(o.text||'').match(/^(.+?)\(([^()]+)\)$/);
if(pair){var actual=reviews.join(' ').match(/교재 정답은\s*\*\*([^*]+)\(([^()]+)\)\*\*/);if(actual&&norm(actual[1])===norm(pair[1]))return actual[1]+' — '+actual[2];}

if(!q.exam&&/결정 단서|묻는.*정답|답이 아니|맞지만/.test(source)){
 var own=reviews.find(function(line){return norm(line.split('의 단서:')[0])===norm(pair?pair[1]:o.text)&&line.includes('의 단서:');});
 if(own){var quoted=own.match(/‘([^’]+)’/);if(quoted)source=(pair?pair[1]:o.text)+' — '+quoted[1];}
 else if(o.correct&&q.q)source=o.text+' — '+q.q;
 else return ownSource(o);
}
if(/확인되지|확인할 수 없|근거가 없/.test(source))return null;
var split=plain(source).split(/\s+[—–]\s+/),target=split.length>1?split.shift():String(o.text||''),tail=split.join(' — ');
if(!tail){var bold=source.match(/\*\*([^*]+)\*\*/);if(bold&&/^[①②③④⑤]$/.test(target))target=bold[1];tail=plain(source).replace(target,'').replace(/^[\s—–:]+/,'');}
// Attribute only the option's own source; the correct-answer overview may describe a different subject.
for(var key of Object.keys(known))if((norm(target)===norm(key)||norm(target)===norm(known[key][0]))&&norm(source).includes(norm(known[key][1]))&&norm(source).includes(norm(known[key][2]))){var tuple=known[key];return tuple[0]+' — '+tuple[1]+(tuple[2]?', '+tuple[2]:'');}
tail=tail.split(/(?<=[.!?。])\s+/)[0].replace(/\s*(정답|오답)(이에요|입니다)?[.!]?$/,'');
tail=tail.replace(/(?:이에요|예요|입니다|했어요|해요|였어요|이었어요)[.!]?$/,'').replace(/(?:가|이)?\s*아니(?:에요|고)[.!]?.*$/,'');
tail=tail.replace(/,?\s*(?:이 사건|이 문항|이 문제|이 시기|한성 함락|이 단서|훨씬|문항의 시기)[^,]*?(?:보다|와는|가 아니라|와 다)[\s\S]*$/,'');
tail=tail.replace(/,\s*(?:그보다|훨씬|앞선|나중|뒤의|앞의|이보다)[\s\S]*$/,'');
tail=tail.replace(/\s*(?:정답이에요|정답입니다)[.!]?$/,'').replace(/[.!]+$/,'').trim();
tail=tail.replace(/\s*\((?:왕|인물|제도|국가|나라|왕\(또는 인물\))\)\s*$/,'').replace(/[을를] (추진|파견|설치|제작|실시|보급|체결|간행|재개|거두었다|주장)하였다$/,' $1').replace(/(?:이|가) (?:발생하였다|일어났다)$/,'').replace(/\s*한 일로$/,'').replace(/\s*때로$/,'').trim();
tail=tail.replace(/(?:으로|이라|로) 맞아요$/,'').replace(/이 맞아요$/,'').replace(/^맞는 설명(?:이에요)?[.!]?$/,'');
if(!tail||/정답 순서|번째 칸: 정답|결정 단서|이 문제의 답|묻는.*정답|정답 아님|답으로 고를|맞지만|틀렸|순서는 상관없/.test(tail))return ownSource(o);
if(tail.length>65)return ownSource(o);
return target+' — '+tail;
}
function core(q){var saved=root.HANQ_EXAM_BRIEF_CORE&&root.HANQ_EXAM_BRIEF_CORE.questions[q.id];if(q.exam&&saved&&saved.v===String(q.v)&&saved.rv===String(q.rv))return saved.core.slice();if(q.origin==='reviewed-source'&&Array.isArray(q.verifiedCore))return q.verifiedCore.slice(0,5);if(q.id==='check-02-01'&&q.q.includes('진개의 공격')&&q.q.includes('한 무제가 왕검성'))return ['연의 장수 진개 공격','위만 왕위 찬탈','진번·임둔 복속 → 영토 확대','우거왕 때 한 무제 왕검성 공격'];var o=q.overview||{},R=root.HanqQuizReview,correct=q.options.find(function(x){return x.correct;}),hay=[q.q].concat(o.reason||[]).join(' ');if(/거란/.test(hay)&&(/서희|강감찬|양규|현종|성종/.test(hay)))return ['거란은 고려 성종·현종 때 세 차례 침입','1차(성종): 서희 담판 → 강동 6주','2차(현종): 양규 활약 → 현종 나주 피난','3차(현종): 강감찬 → 귀주대첩'];
var rows=[],term=correct&&correct.text,era=q.chapter||q.era;
[root.HANQ_LECTURE&&root.HANQ_LECTURE[era],root.HANQ_TEXTBOOK&&root.HANQ_TEXTBOOK[era],root.HANQ_STUDY&&root.HANQ_STUDY[era]].forEach(function(d){(d&&(d.groups||d.core)||[]).forEach(function(g){(g.rows||[]).forEach(function(row){if(Array.isArray(row)&&term&&norm(term).length>=2&&(norm(row[0])===norm(term)||String(row[0]).split(' · ')[0]===term)){var line=row[0]+' — '+row[1];if(line.length<=110&&!rows.includes(line))rows.push(line);}});});});
if(!rows.length)(o.reason||[]).forEach(function(line){line=plain(line).replace(/^교재(?: 핵심 개념)?:\s*/,'').replace(/[‘’]/g,'').trim();if(line&&line.length<=110&&!/정답은|정답이에요|결정 단서|핵심 단서는/.test(line))rows.push(line);});
if(!rows.length&&q.q&&correct&&!q.exam)rows.push(q.q+' — '+correct.text);
return rows.slice(0,5);}
function render(q,selected){var lines=q.options.map(function(o){var line=brief(q,o),mark=o.correct?'✓ 정답':o.id===selected?'× 고른 답':'';return '<li class="qb-option'+(o.correct?' is-correct':o.id===selected?' is-selected':'')+'" data-option="'+esc(o.id)+'">'+(mark?'<b>'+mark+'</b> ':'')+(line?esc(line):'<span class="qb-unavailable" data-unresolved="true">'+esc(((String((o.review||[])[0]||'').match(/\*\*([^*]+)\*\*/)||[])[1])||o.text)+' — 작품 식별 근거 미확인</span>')+'</li>';}).join('');return '<section class="quiz-brief-feedback" aria-label="보기별 핵심"><ul>'+lines+'</ul><div class="qb-core"><h4>관련 내용 정리</h4><ul>'+core(q).map(function(l){return '<li>'+esc(plain(l))+'</li>';}).join('')+'</ul></div></section>';}
root.HanqQuizBriefFeedback={brief:brief,core:core,render:render};})(window);
