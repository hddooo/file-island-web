/* Generic owner review renderer. Personal question lists arrive only through the authenticated API. */
(function(root){'use strict';
function text(x){return typeof x==='string'?x.slice(0,400):'';}
function visual(x,recall){if(!x||!/^media\/(?:exam(?:-expanded|-book)?|review-focus)\/[A-Za-z0-9_-]+\.(?:webp|png)$/.test(x.src||''))return null;return {src:x.src,alt:'공식 원본 자료의 유물 사진',recall:!!recall,boxes:recall?[]:(x.boxes||[]).filter(function(b){return Array.isArray(b)&&b.length===4&&b.every(function(n){return Number.isFinite(n)&&n>=0&&n<=100;})&&b[0]+b[2]<=100&&b[1]+b[3]<=100;})};}
function row(head,t,ask,hide){return {kind:ask?'ask':'fact',head:text(head),hb:[],items:[{t:text(t),b:hide?[[0,text(t).length]]:[]}]};}
function build(data){
 if(data&&data.source==='shared-core'&&Array.isArray(data.topics)){data={era:data.era,notes:data.topics.map(function(f,i){return {questionId:'exam-00-'+String(i+1).padStart(2,'0'),review:{focus:f}};})};}
 if(!data||!Array.isArray(data.notes)||!data.notes.length||data.notes.length>100)return null;
 var notes=data.notes.filter(function(n){return n&&/^exam-\d{2}-\d{2}$/.test(n.questionId||'')&&n.review&&n.review.focus;});
 if(!notes.length)return null;
 notes=notes.slice().sort(function(a,b){return (a.review.focus.priority||0)-(b.review.focus.priority||0);});
 var era=data.era==='goryeo'?'goryeo':'ancient';var pages=[],seen=Object.create(null),covered=Object.create(null),lessons=[];
 notes.forEach(function(n){(n.review.focus.visualLessons||[]).forEach(function(v){if(v&&typeof v.id==='string'&&visual(v.image)){if(v.covers===true)covered[n.questionId]=1;if(!seen[v.id]){seen[v.id]=1;lessons.push(v);}}});});
 lessons.sort(function(a,b){return (a.order||0)-(b.order||0);});
 for(var i=0;i<lessons.length;i+=3){var scenes=[];lessons.slice(i,i+3).forEach(function(v){
   scenes.push({title:'사진의 특징 한 곳',visual:visual(v.image),rows:[row('눈으로 볼 단서',v.feature),row('이름 · 나라',v.answer,false,true),row('비슷한 대상과 구분',v.contrast)]});
   scenes.push({title:'사진만 보고 다시 떠올리기',visual:visual(v.image,true),rows:[row(v.question||'이름과 나라를 떠올려 보세요.',v.answer,true)]});
 });pages.push({kind:'topic',title:'문화재 · 작은 묶음 '+(Math.floor(i/3)+1),period:'특징 → 이름·나라 → 그림 회상',scenes:scenes});}
 var groups=Object.create(null),order=[];
 notes.forEach(function(n){if(covered[n.questionId])return;var f=n.review.focus,g=text(f.group)||'핵심 연결';if(!groups[g]){groups[g]=[];order.push(g);}groups[g].push(f);});
 order.forEach(function(g){for(var j=0;j<groups[g].length;j+=3){var scenes=[];groups[g].slice(j,j+3).forEach(function(f){
  var sc={title:text(f.title)||'정답 단서',rows:[row('단서 → 정답',f.cue),row('헷갈리는 짝',f.contrast)]};var img=visual(f.image);if(img)sc.visual=img;scenes.push(sc);
  scenes.push({title:'짧게 떠올리기',rows:[row(f.question||'단서의 주인공을 떠올려 보세요.',f.answer,true)]});
 });pages.push({kind:'topic',title:g,period:'핵심 개념 연결',scenes:scenes});}});
 pages.push({kind:'recap',title:'마지막 세 줄',period:'',scenes:[{title:'핵심만 남기기',rows:[row('발해의 교육 기관은?','주자감',true),row('돌을 벽돌처럼 다듬어 쌓은 신라 탑은?','분황사 모전석탑',true),row('발해에서 당의 등주를 공격한 왕은?','무왕',true)]}]});
 if(era==='goryeo'){pages.forEach(function(c){if(c.title.indexOf('문화재')===0)c.scenes.sort(function(a,b){return Number(!!a.visual.recall)-Number(!!b.visual.recall);});});pages=pages.slice(0,-1).sort(function(a,b){function rank(x){return x.title==='무신정권'?0:x.title.indexOf('문화재')===0?1:x.title==='문화'?2:x.title==='사회경제'?3:4;}return rank(a)-rank(b);});pages.unshift({kind:'topic',title:'고려의 흐름 · 기준점 다섯',period:'핵심 개념을 잇는 흐름',scenes:[{title:'시대의 자리 잡기',rows:[row('초기 → 문벌','918 건국 → 거란·초조대장경 → 숙종·예종 → 1135 묘청.'),row('무신 → 원 → 말기','1170 무신정변 → 1232 강화 천도 → 1270 환도·삼별초 → 원 간섭 → 공민왕 개혁.'),row('집중할 곳','무신 인물·기구·반란과 문화·사회경제를 연결해 떠올린다.')]}]});pages.push({kind:'recap',title:'마지막 세 줄',period:'',scenes:[{title:'이 세 줄만 남기기',rows:[row('최충헌·최우의 권력·인사 기구는?','교정도감 · 정방',true),row('지눌의 수행론과 이제현이 교유한 원의 학술 기관은?','돈오점수 · 만권당',true),row('고려의 관영 책·차 상점은?','서적점 · 다점',true)]}]});}return {format:'period',era:era,title:era==='goryeo'?'고려 핵심 복습':'고대사 핵심 복습',finishScene:'last',pace:{msPerChar:75,rowBase:900,recallMs:1500,revealBase:1000,revealPerChar:80,sceneMs:1500},cards:pages,questionCount:notes.length};
}
root.HanqFocusedReview={build:build};if(typeof module!=='undefined'&&module.exports)module.exports={build:build};
})(typeof window!=='undefined'?window:globalThis);
