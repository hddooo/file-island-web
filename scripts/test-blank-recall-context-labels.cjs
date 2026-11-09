'use strict';
const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
let cases=0;
for(const era of ['선사','삼국','남북국','고려','조선','개화기','일제강점기','대한민국']){
const w=new JSDOM('<main></main>',{runScripts:'outside-only'}).window,h=w.document.querySelector('main');
h.innerHTML='<h2><strong>'+era+'</strong></h2><table><tr><th><strong>특징</strong></th><td><strong>소수림왕</strong>은 <strong>태학</strong>을 설치했다.</td></tr><tr><td><strong>사</strong><strong>회</strong></td><td><strong>불교</strong>와 <strong>유교</strong></td></tr></table><div><b>문화</b></div><div><b>경제</b></div><div><b>주요 특징</b></div><div><b>기타</b></div><div><b>순서</b></div><p><strong>신라</strong> <strong>사회</strong></p><p>벽돌로 만든 <strong>무덤</strong>의 특징</p><p><strong>서경(평양)</strong> <strong>삼국사기</strong> <strong>황산벌 전투</strong> <strong>사회주의</strong> <strong>금융 실명제</strong> <strong>교육입국조서</strong></p>';
h.insertAdjacentHTML('beforeend','<table><tr><td><b>특징</b><br>81회 중요</td><td><b>사회</b><br>진짜 중요!</td><td><b>주요 특징</b><br>참고만 하자</td><td><b>정치 세력</b></td></tr></table><p><b>〈표 27〉 조선의 문화: 세계기록유산</b></p><p><b>90점 이상이 목표라면 힘내서 외워보자!</b></p><p><b>6조 직계제 도식</b></p><p><b>6조 직계제</b>로 왕권 강화</p>');
const before=h.innerHTML;w.eval(fs.readFileSync('media/blank-recall.js','utf8'));const c=w.HanqBlankRecall.decorate(h);
assert.equal(c.count,14);assert.equal(h.querySelector('th').textContent,'특징');assert.equal(h.querySelectorAll('tr')[1].children[0].textContent,'사회');
assert(h.textContent.includes('문화'));assert(!h.textContent.includes('사회주의'));
c.stop();assert.equal(h.innerHTML,before);w.close();cases++;
}
console.log(JSON.stringify({eras:cases,labelsPreserved:true,historicalBodyBlanked:true,sourceRestored:true}));