'use strict';
const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<main></main>',{url:'https://synthetic.invalid',runScripts:'outside-only'}),w=dom.window,d=w.document;for(const p of ['history81-term-data','history81-terms','joseon-script-reader','goryeo-script-reader'])w.eval(fs.readFileSync('media/'+p+'.js','utf8'));
const data=w.HanqHistory81TermData,h=d.querySelector('main');assert.equal(data.entries.length,447);assert.equal(new Set(data.entries.map(e=>e.id)).size,392);
const previous={};require('vm').runInNewContext(require('child_process').execFileSync('git',['show','87a889f:media/history81-term-data.js'],{encoding:'utf8'}),previous);
assert.deepEqual(JSON.parse(JSON.stringify(data.entries.slice(0,186))),JSON.parse(JSON.stringify(previous.HanqHistory81TermData.entries.map(e=>({...e,...(e.id==='yukjo'?{summary:'의정부를 거치지 않고 왕이 6조에 직접 명령하고, 6조의 판서가 왕에게 직접 보고하여 업무를 처리한 제도. 태종과 세조가 왕권 강화를 위해 시행했다.'}:{}),sources:e.sources.map(s=>s.includes('treeId=0100amp')?'https://contents.history.go.kr/front/tg/view.do?levelId=tg_002_0450':s.replaceAll('&amp;','&'))})))),'existing 186 entries are immutable except URL entity correction and the explicitly requested yukjo explanation');
const keys=new Map();for(const entry of data.entries){const key=entry.era+entry.phrase.replace(/\s+/gu,'');if(keys.has(key)){assert.equal(entry.id,keys.get(key).id);assert.equal(entry.summary,keys.get(key).summary);}keys.set(key,entry);}assert.equal(keys.size,443);
const contexts={'금오':' (의금부)','과전':' 경기','회계':' 삼사','회계를 담당':' 삼사','전지':' 전시과','시지':' 전시과','제위보':' 빈민 구제','강조':' 정변','병마사':' 양계','교장':' 의천 경전'};
const qualified={
'이조 전랑 임명':['68','선조 김효원 심의겸'],'이조전랑 임명으로 다툼':['66–67','선조 김효원 심의겸'],
'경성':['62','여진 무역소'],'경원':['62','여진 무역소'],'풍흉에 따라 9등급':['62','세종'],'9등급으로 전세':['77','세종 풍흉'],
'쓰시마섬(대마도)을 정벌':['62','세종 이종무'],'삼포':['62','부산포 염포 제포'],'이징옥':['62','단종 함길도'],
'수신전과 휼양전이 폐지':['62','세조'],'수신전 & 휼양전 폐지':['73–74–75','직전법'],
'영조·정조':['65','탕평'],'순조·헌종·철종':['65','세도정치'],'청계천':['69','영조 준천'],
'외척 세력':['66–67','안동 김씨 순조'],'권력(비변사 중심) 장악':['66–67','풍양 조씨 철종'],
'박규수':['70','철종 안핵사'],'공주(공산성)':['68','인조 이괄의 난'],'용골산성':['68','정묘호란 정봉수'],
'김준룡이 광교산 전투':['68','병자호란'],'허적과 윤휴':['69','숙종 남인 축출'],'백서':['70','황사영'],'진주':['70','임술농민봉기 유계춘'],
'비서 기관':['73–74–75','승정원'],'왕의 비서 기관':['76','승정원'],'동서활인서':['73–74–75','환자 진료'],
'2필에서 1필':['73–74–75','영조 균역법'],'토지 1결당 쌀 2두':['73–74–75','균역법 결작'],
'실록을 편찬':['76','춘추관'],'경연을 주관':['76','홍문관'],'상대':['76','사헌부'],'과전':['77','과전법 경기'],
'전세 부담액을 고정':['77','인조'],'향전':['78','구향 신향'],'남북국 용어':['81','유득공 발해고']};
const signature=n=>({text:n.textContent,styles:[...n.querySelectorAll('strong,u,[data-source-color]')].map(e=>[e.tagName,e.textContent,e.getAttribute('style')])});
for(const e of data.entries){assert(Array.from(e.summary).length<=150);h.replaceChildren();const p=d.createElement('p');h.append(p);const q=e.contextRequired?qualified[e.phrase]:null;p.dataset.page=q?q[0]:'48';w.HanqJoseonScriptReader.inline(d,p,'**'+e.phrase+'**'+(q?' '+q[1]:(contexts[e.phrase]||'')));const before=signature(h),v=w.HanqHistory81Terms.mount(h,e.era,data.sources[e.era]);assert.equal(v.count,1,e.phrase);assert.deepEqual(signature(h),before);const t=h.querySelector('.history81-term');t.focus();assert.equal(d.querySelector('[role=tooltip]').textContent,e.summary);t.click();t.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert(d.querySelector('[role=tooltip]').hidden);v.stop();assert.deepEqual(signature(h),before);assert.equal(d.querySelectorAll('[role=tooltip]').length,0);}
function fixture(md,era='joseon',expected=0,revision=data.sources[era]){h.replaceChildren();w.HanqJoseonScriptReader.inline(d,h,md);const before=signature(h),v=w.HanqHistory81Terms.mount(h,era,revision);assert.equal(v.count,expected,md);assert.deepEqual(signature(h),before);v.stop();}
fixture('**금오신화** **알수없는말**');fixture('**승정원일기**','joseon',1);fixture('**기묘사화**','joseon',1);fixture('**승정원****일기**','joseon',1);fixture('**승정원**일기');fixture('**기묘**사화');fixture('**향약**집성방');fixture('**노비안검법**','joseon');fixture('**사간원**','goryeo');fixture('**금오**');fixture('**향약집성방**','joseon',1);fixture('**전시**<u>과</u>','goryeo',1);fixture('<span style="color:#ff0000"><strong>대동법</strong></span>','joseon',1);fixture('**훈요** **10조**','goryeo',1);fixture('**대동법**','joseon',0,'wrong');
h.innerHTML='<strong>대동법</strong><button><strong data-history-source-emphasis="true">대동법</strong></button>';assert.equal(w.HanqHistory81Terms.mount(h,'joseon',data.sources.joseon).count,0);
for(const phrase of ['과전','회계','회계를 담당','전지','시지','제위보','강조','병마사','교장'])fixture('**'+phrase+'**','goryeo');
fixture('신편제종**교장**총록','goryeo');fixture('**강조** 표시','goryeo');fixture('**병마사** 시험용','goryeo');fixture('**3경**','goryeo');
fixture('**과전법**','goryeo',1);fixture('**녹과전**','goryeo',1);fixture('**삼사**','goryeo',1);fixture('**삼사**','joseon',1);
fixture('**강조** 정변','goryeo',1);fixture('**병마사** 양계','goryeo',1);fixture('**제위보** 구휼','goryeo',1);fixture('**회계** 삼사','goryeo',1);fixture('**전지** 전시과','goryeo',1);fixture('**시지** 전시과','goryeo',1);
fixture('**회계** 회계기준','goryeo');fixture('**전지** 배터리','goryeo');fixture('**교장** 학교','goryeo');
for(const e of data.entries){for(const url of e.sources){assert(!/&amp;/.test(url),'URL entity leaked');assert.equal(new URL(url).protocol,'https:');}if(e.contextRequired)fixture('**'+e.phrase+'**','joseon');}
fixture('**삼사**','joseon',1);fixture('**진주** 임진왜란','joseon');fixture('**백서** 정책','joseon');fixture('**상대** 비교','joseon');
console.log('PASS 447 forms / 392 definition IDs / exact era / split emphasis / partial hazards / immutable text+styles / lifecycle');

for(const e of data.entries.filter(e=>e.contextRequired)){const q=qualified[e.phrase];for(const [page,context] of [[q[0],'무관한 문맥'],['999',q[1]]]){h.replaceChildren();const p=d.createElement('p');p.dataset.page=page;h.append(p);w.HanqJoseonScriptReader.inline(d,p,'**'+e.phrase+'** '+context);const v=w.HanqHistory81Terms.mount(h,'joseon',data.sources.joseon);assert.equal(v.count,0,e.phrase+' wrong context/page');v.stop();}}

