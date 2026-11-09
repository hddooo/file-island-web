'use strict';
const assert=require('assert/strict'),fs=require('fs'),{JSDOM}=require('jsdom');
const w=new JSDOM('<main></main>',{runScripts:'outside-only',url:'https://fixture.test'}).window;
w.eval(fs.readFileSync('media/textbook-source-quiz.js','utf8'));
const api=w.HanqTextbookSourceQuiz;let checks=0;
function fixture(parts,kind='fill-in',order=false){return{id:'q',kind,verification:{status:'source-verified',textVerified:true,answerPairVerified:true},answers:parts.map((text,i)=>({id:'a'+i,text})),blanks:[{id:'b',answerIds:parts.map((_,i)=>'a'+i)}],answer:{parts,text:parts.join(kind==='sequence'?'→':', '),orderMatters:order}};}
function grade(q,values,expected){const before=JSON.stringify(q),r=api.gradePractice(q,values);assert.equal(r.correct,expected);assert.equal(JSON.stringify(q),before);checks++;return r;}
const one=fixture(['알파']);grade(one,[' 알 파 '],true);grade(one,['베타'],false);assert.equal(grade(one,[''],false).slots[0].feedback,'답을 입력해 주세요.');
const many=fixture(['알파','베타']);grade(many,['베타,알파'],true);grade(many,['알파,알파'],false);assert(grade(many,['알파'],false).slots[0].feedback.includes('부분 정답'));
const seq=fixture(['②','①','③'],'sequence',true);for(const s of ['2,1,3','②→①→③','213'])grade(seq,[s],true);for(const s of ['2,1','2,1,3,3','2,1,9'])grade(seq,[s],false);
seq.answer.sequenceTokens=[{}];grade(seq,['②→①→③'],true);
const partition=fixture(['알파','베타'], 'fill-in',true);partition.blanks[0].parts=[{id:'p1',answerIds:['a0']},{id:'p2',answerIds:['a1']}];grade(partition,['알파','베타'],true);grade(partition,['베타','알파'],false);
const classification=fixture(['알파','베타']);classification.kind='classification';classification.responseSlots=[{id:'r1',answerIds:['a0'],answer:{orderMatters:false}},{id:'r2',answerIds:['a1'],answer:{orderMatters:false}}];grade(classification,['알파','베타'],true);grade(classification,['알파',''],false);
const invalid=fixture(['알파']);invalid.verification.status='pending';assert.throws(()=>api.gradePractice(invalid,['알파']));assert.throws(()=>api.gradePractice(one,['알파','베타']));
console.log(JSON.stringify({checks,failed:0,scope:'single/multiple/partial/sequence/partition/classification; immutable'}));w.close();
