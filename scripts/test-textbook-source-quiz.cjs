'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.JSDOM_PATH||path.join(__dirname,'../.test-tools/node_modules/jsdom'));
const file=path.join(__dirname,'../media/textbook-source-quiz.js');
let checks=0;function ok(v,m){assert(v,m);checks++;}function eq(a,b,m){assert.deepEqual(a,b,m);checks++;}
const clone=x=>JSON.parse(JSON.stringify(x));
function fixture(){
 const spec=[['one',1,11,'fill-in',['알파'],false],['one',2,11,'fill-in',['베타','감마'],false],['two',1,12,'sequence',['②','①','③'],true],['two',2,12,'fill-in',['델타(보충)'],false]];
 return {schemaVersion:'hanq-source-quiz/1',title:'합성 검증 자료',source:{pdfPages:[11,12],printedPages:[4,5]},subtopics:[{id:'one',title:'첫 구간'},{id:'two',title:'다음 구간'}],items:spec.map(([topic,num,page,kind,parts,ordered],i)=>{
  const id=`p${page}:${topic}:${num}`,aid=parts.map((_,j)=>`${id}:answer:${j}`),bid=id+':blank';
  return {id,order:i+1,subtopicId:topic,originalNumber:num,pdfPage:page,printedPage:page-7,kind,text:'합성 문제의 빈칸입니다',sourceText:`(${num}) 합성 문제의 빈칸입니다 (   )`,segments:[{type:'text',text:'합성 문제의 빈칸입니다 '},{type:'blank',id:bid,placeholder:'(   )',answerIds:aid}],blanks:[{id:bid,placeholder:'(   )',answerIds:aid}],answer:{text:parts.join(kind==='sequence'?'':', '),parts,orderMatters:ordered},answers:parts.map((s,j)=>({id:aid[j],text:s})),...(kind==='sequence'?{events:['①','②','③'].map((label,j)=>({label,text:'합성 사건 '+(j+1),sourceText:label+' 합성 사건 '+(j+1)}))}:{}),verification:{status:'source-verified',textVerified:true,answerPairVerified:true}};
 })};
}
function classificationFixture(){
 const d=fixture(),item=d.items[0],id=item.id,groups=[['②','③'],['⑤'],['④'],['①']];
 item.kind='classification';item.originalNumberLabel='(1)';item.text='합성 보기에서 해당 번호를 찾아 적으세요';
 item.segments=[{type:'text',text:item.text}];item.blanks=[];
 item.answers=groups.flat().map((text,i)=>({id:id+':answer:'+i,text}));
 item.subitems=groups.map((_,i)=>({id:id+':sub:'+i,originalNumberLabel:'(1)-'+(i+1),order:i+1,text:'합성 분류 '+(i+1)+':',sourceText:'(1)-'+(i+1)+' 합성 분류 '+(i+1)+': ',responseSlotId:id+':response:'+i}));
 let offset=0;
 item.responseSlots=groups.map((parts,i)=>{const answerIds=item.answers.slice(offset,offset+parts.length).map(a=>a.id);offset+=parts.length;return {id:item.subitems[i].responseSlotId,order:i+1,kind:'colon-response',sourcePrintedBlank:false,sourceAnchor:':',answerIds,answer:{text:parts.join(', '),parts,orderMatters:false}};});
 item.answer={text:'②, ③/ ⑤/ ④/ ①',sourceText:'(1) ②, ③/ ⑤/ ④/ ①',parts:groups.flat(),orderMatters:true,groupSeparator:'/',groups:item.responseSlots.map((s,i)=>({subitemId:item.subitems[i].id,responseSlotId:s.id,order:i+1,text:s.answer.text,parts:s.answer.parts,answerIds:s.answerIds}))};
 item.choices=['①','②','③','④','⑤'].map((label,i)=>({label,text:'합성 항목 '+(i+1),sourceText:label+' 합성 항목 '+(i+1)}));
 item.choicesLabel='<보기>';item.choicesLabelSourceText='  <보기> ';
 item.sourceText=classificationSource(item);
 return d;
}
function classificationSource(i){return i.originalNumberLabel+' '+i.text+'\n'+i.subitems.map(s=>s.sourceText).join('\n')+'\n'+i.choicesLabelSourceText+i.choices.map(c=>c.sourceText).join(' ');}
function extendedSource(i){return (i.originalNumberLabel||'')+i.segments.map(s=>s.type==='text'?s.text:s.placeholder).join('')+(i.events||[]).map(e=>e.sourceText).join('');}
function extendedFixture(){
 const d=fixture(),i=d.items[0],b=i.blanks[0],ids=[i.id+':part-answer:1',i.id+':part-answer:2'];
 i.originalNumberLabel='(1)';i.requiredRendererFeatures=['partitioned-source-blank'];
 i.answer={text:'알파, 베타',sourceText:'(1) 알파, 베타',parts:['알파','베타'],orderMatters:true};i.answers=ids.map((id,n)=>({id,text:i.answer.parts[n]}));
 b.placeholder='(   ,    )';b.answerIds=ids;b.partSeparator=',';b.parts=ids.map((id,n)=>({id:b.id+':part:'+n,order:n+1,placeholder:n?'    ':'   ',answerIds:[id]}));
 Object.assign(i.segments[1],{placeholder:b.placeholder,answerIds:ids});i.sourceText=extendedSource(i);
 const s=d.items[2];s.originalNumberLabel='(1)';s.requiredRendererFeatures=['annotated-source-sequence'];s.answer.sequenceSeparator='→';
 s.answer.sequenceTokens=s.answer.parts.map((label,n)=>({label,annotation:'('+(1200+n)+')',text:label+'('+(1200+n)+')',order:n+1}));
 s.answer.text=s.answer.sequenceTokens.map(t=>t.text).join('→ ');s.answer.sourceText='(1) '+s.answer.text;s.answer.responseText=s.answer.parts.join('→');s.sourceText=extendedSource(s);
 const u=d.items[3];u.originalNumber=null;u.originalNumberLabel='';u.originalNumberPresent=false;u.sourceOrdinal=1;u.requiredRendererFeatures=['unnumbered-source-item'];u.sourceText=extendedSource(u);u.answer.sourceText=u.answer.text;
 d.requiredRendererFeatures=['answer-table-notes'];d.answerTableNotes=[{id:'synthetic-note',subtopicId:'one',text:'※ 합성 표의 원문 주석',sourceText:'※ 합성 표의 원문 주석',source:{pdfPage:11,printedPage:4},verification:{status:'source-verified',textVerified:true}}];
 return d;
}
(async()=>{
 const w=new JSDOM('<main></main>',{runScripts:'outside-only',url:'https://synthetic.invalid'}).window;w.HTMLElement.prototype.scrollIntoView=function(){};
 w.eval(fs.readFileSync(file,'utf8'));const api=w.HanqTextbookSourceQuiz,host=w.document.querySelector('main');
 const tick=async()=>{for(let i=0;i<8;i++)await new Promise(r=>setTimeout(r,0));};const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const base=()=>({version:'fixture',revision:0,workspace:{cursor:0,status:'active',responses:{}}});let stored=base(),calls=[],fail=false,hold=null;
 const opts={loadProgress:async()=>clone(stored),saveProgress:async m=>{calls.push(clone(m));if(hold)await hold;if(fail)throw Error('offline');let ws=clone(stored.workspace);for(const u of m.updates)ws.responses[u.itemId]={values:clone(u.values),submitted:u.submitted,correct:u.submitted};ws.cursor=m.cursor;ws.status=m.status;stored={version:'fixture',revision:stored.revision+1,workspace:ws};return clone(stored);}};
 let c=api.render(host,fixture(),opts);await c.ready;await wait(850);eq(calls.length,0,'read-only mounting does not save cursor or answers');eq(host.querySelectorAll('[data-source-item-id]').length,4,'whole era at once');eq(host.querySelectorAll('.textbook-source-quiz-check,.textbook-source-quiz-reveal').length,0,'no per-item submit/reveal');ok(!host.textContent.includes('10문제'),'no grouping');
 const inputs=()=>[...host.querySelectorAll('.textbook-source-quiz-input')];const write=(i,v)=>{inputs()[i].value=v;inputs()[i].dispatchEvent(new w.Event('input',{bubbles:true}));};const blur=i=>inputs()[i].dispatchEvent(new w.Event('blur'));const enter=(i,extra={})=>inputs()[i].dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,...extra}));
 write(0,'알파');enter(0,{isComposing:true});enter(0,{repeat:true});eq(host.querySelector('.textbook-source-inline-feedback').textContent,'','IME/repeat does not grade');blur(0);ok(host.querySelector('.textbook-source-inline-feedback').textContent.includes('✓ 정답'),'local result before network');eq(calls.length,0,'no per-answer request');write(1,'오답');blur(1);ok(host.querySelectorAll('.textbook-source-inline-feedback')[1].textContent.includes('정답: 베타, 감마'),'wrong answer inline exact canonical');eq(inputs()[1].value,'오답','wrong input preserved');write(1,'감마,베타');ok(host.querySelectorAll('.textbook-source-inline-feedback')[1].textContent.includes('✓'),'edited answer regrades immediately');enter(1);eq(w.document.activeElement,inputs()[2],'Enter focuses next input synchronously');await wait(850);eq(calls.length,1,'multiple answers in one batch');eq(calls[0].updates.length,2,'both latest answers batched');
 let release;hold=new Promise(r=>release=r);write(2,'①②③');blur(2);await wait(850);eq(calls.length,2,'second batch in flight');write(2,'②①③');ok(host.querySelectorAll('.textbook-source-inline-feedback')[2].textContent.includes('✓'),'typing/grade continues during network');eq(inputs()[2].disabled,false,'network never locks input');release();hold=null;await tick();eq(inputs()[2].value,'②①③','older ack never overwrites newer response');await wait(850);eq(calls.length,3,'new edit saved after old ack');
 write(3,'오답');blur(3);host.querySelector('.textbook-source-quiz-stop').click();await tick();ok(host.querySelector('.textbook-source-list').hidden,'stop shows review only after save');ok(host.textContent.includes('내 답: 오답'),'review exact response');const filter=host.querySelector('.textbook-source-review-filter input');filter.checked=true;filter.dispatchEvent(new w.Event('change'));eq(host.querySelectorAll('[data-source-review-item-id]').length,1,'wrong-only filter uses local exact grade');
 c.cleanup();c=api.render(host,fixture(),opts);await c.ready;host.querySelector('.textbook-source-quiz-resume').click();eq(inputs()[3].value,'오답','reload preserves latest response');ok(host.querySelectorAll('.textbook-source-inline-feedback')[3].textContent.includes('정답: 델타(보충)'),'wrong feedback restored');
 fail=true;write(0,'변경');blur(0);host.querySelector('.textbook-source-quiz-stop').click();await tick();eq(host.querySelector('.textbook-source-list').hidden,false,'failed save does not quit');eq(inputs()[0].value,'변경','failed save retains input');ok(host.textContent.includes('저장하지 못했습니다'),'honest save failure');fail=false;host.querySelector('.textbook-source-save-retry').click();await tick();ok(host.textContent.includes('계정에 저장했습니다'),'manual retry succeeds');
 for(const [label,mutate] of [
 ['schema',d=>d.schemaVersion='bad'],['duplicate id',d=>d.items[1].id=d.items[0].id],['reorder',d=>d.items.reverse()],['unknown blank answer',d=>d.items[0].blanks[0].answerIds=['missing']],['answer part mismatch',d=>d.items[0].answer.parts=['changed']],['invented event',d=>d.items[2].events[0].sourceText='different'],['missing blank',d=>d.items[0].segments.pop()],['uncovered answer',d=>d.items[1].blanks[0].answerIds.pop()],['unordered sequence',d=>d.items[2].answer.orderMatters=false]]){
  let bad=fixture();mutate(bad);assert.throws(()=>api.render(host,bad),/Invalid source quiz/,label);checks++;ok(host.contains(c.element),'invalid replacement retains current view '+label);
 }
 for(const [name,mutate] of [
 ['unmarked null number',d=>d.items[3].requiredRendererFeatures=[]],['invented unnumbered label',d=>d.items[3].originalNumberLabel='(1)'],['invalid source ordinal',d=>d.items[3].sourceOrdinal=0],['contradictory printed number',d=>d.items[3].originalNumber=1],['unnumbered source mismatch',d=>d.items[3].sourceText='(1) '+d.items[3].sourceText],
 ['missing partition part',d=>d.items[0].blanks[0].parts.pop()],['extra partition part',d=>d.items[0].blanks[0].parts.push(clone(d.items[0].blanks[0].parts[0]))],['swapped partition parts',d=>d.items[0].blanks[0].parts.reverse()],['duplicate partition part ID',d=>d.items[0].blanks[0].parts[1].id=d.items[0].blanks[0].parts[0].id],['duplicate partition answer',d=>d.items[0].blanks[0].parts[1].answerIds=d.items[0].blanks[0].parts[0].answerIds],['partition comma changed',d=>d.items[0].blanks[0].partSeparator='/'],['partition source changed',d=>d.items[0].sourceText=d.items[0].sourceText.replace(',','/')],['unordered partition',d=>d.items[0].answer.orderMatters=false],['partition part contains invented text',d=>d.items[0].blanks[0].parts[0].placeholder='invented'],
 ['missing annotation token',d=>d.items[2].answer.sequenceTokens.pop()],['extra annotation token',d=>d.items[2].answer.sequenceTokens.push(clone(d.items[2].answer.sequenceTokens[0]))],['reordered annotation tokens',d=>d.items[2].answer.sequenceTokens.reverse()],['altered annotation year',d=>{d.items[2].answer.sequenceTokens[0].annotation='(9999)';d.items[2].answer.sequenceTokens[0].text='②(9999)';}],['mismatched annotation label',d=>d.items[2].answer.sequenceTokens[0].label='①'],['altered annotation original answer',d=>d.items[2].answer.sourceText='(1) changed'],['mismatched response order',d=>d.items[2].answer.responseText='①→②→③'],['unverified annotation',d=>d.items[2].verification.textVerified=false],
 ['note feature absent',d=>d.requiredRendererFeatures=[]],['missing source notes',d=>delete d.answerTableNotes],['unverified source note',d=>d.answerTableNotes[0].verification.textVerified=false],['duplicated source note',d=>d.answerTableNotes.push(clone(d.answerTableNotes[0]))],['note text differs from source',d=>d.answerTableNotes[0].text='changed'],['unknown note source page',d=>d.answerTableNotes[0].source.pdfPage=999],['unknown note subtopic',d=>d.answerTableNotes[0].subtopicId='missing']
 ,['fabricated item printed page',d=>d.items[0].printedPage=999],['contradictory numbered source label',d=>d.items[0].originalNumber=7],
 ['partition original answer mismatch',d=>d.items[0].answer.sourceText='changed'],['unnumbered original answer mismatch',d=>d.items[3].answer.sourceText='changed'],
 ['annotated answer split across blanks',d=>{const i=d.items[2],a=clone(i.blanks[0]),b=clone(a);a.answerIds=a.answerIds.slice(0,1);b.id+=':second';b.answerIds=b.answerIds.slice(1);i.blanks=[a,b];i.segments=[i.segments[0],{type:'blank',...a},{type:'blank',...b}];i.sourceText=extendedSource(i);}]
 ]){const bad=extendedFixture();mutate(bad);assert.throws(()=>api.render(host,bad),/Invalid source quiz/,name);checks++;ok(host.contains(c.element),'invalid extended replacement retains view '+name);}
 for(const [name,mutate] of [
 ['missing group',i=>i.answer.groups.pop()],['extra group',i=>i.answer.groups.push(clone(i.answer.groups[0]))],
 ['duplicate group',i=>i.answer.groups[1]=clone(i.answer.groups[0])],['permuted groups',i=>i.answer.groups.reverse()],
 ['missing response',i=>i.responseSlots.pop()],['extra response',i=>i.responseSlots.push(clone(i.responseSlots[0]))],
 ['duplicate response',i=>i.responseSlots[1]=clone(i.responseSlots[0])],['permuted responses',i=>i.responseSlots.reverse()],
 ['missing subitem',i=>i.subitems.pop()],['duplicate subitem',i=>i.subitems[1]=clone(i.subitems[0])],
 ['permuted subitems',i=>i.subitems.reverse()],['unknown answer',i=>i.responseSlots[0].answerIds[0]='unknown'],
 ['mismatched group answer',i=>i.answer.groups[0].parts=['①','③']],['missing choice',i=>i.choices.pop()],
 ['duplicate choice',i=>i.choices[1]=clone(i.choices[0])],['invented choice text',i=>i.choices[0].sourceText='invented'],
 ['wrong source anchor',i=>i.responseSlots[0].sourceAnchor='('],['invented printed blank',i=>i.responseSlots[0].sourcePrintedBlank=true],
 ['invented source label',i=>i.subitems[0].sourceText='invented'],['unknown slot link',i=>i.subitems[0].responseSlotId='unknown'],
 ['unordered groups',i=>i.answer.orderMatters=false],['wrong grouping separator',i=>i.answer.groupSeparator=','],
 ['ungrouped answer',i=>i.answer.text=i.answer.parts.join(', ')],['wrong slot answer text',i=>i.responseSlots[0].answer.text='②'],
 ['wrong slot ordering type',i=>i.responseSlots[0].answer.orderMatters='false'],['unverified classification',i=>i.verification.answerPairVerified=false],
 ['reordered original choices',i=>i.choices.reverse()],['coherent but invented choice',i=>{i.choices[0].text='추가';i.choices[0].sourceText='① 추가';}],
 ['extra invented choice',i=>i.choices.push({label:'⑥',text:'추가',sourceText:'⑥ 추가'})],
 ['coherent but invented subitem',i=>{i.subitems[0].text='추가:';i.subitems[0].sourceText='(1)-1 추가:';}],
 ['original answer mismatch',i=>i.answer.sourceText='(1) ①/②/③/④'],['unknown renderer requirement',i=>i.requiredRendererFeatures=['unimplemented-feature']],
 ['null response',i=>i.responseSlots[0]=null],['null group',i=>i.answer.groups[0]=null],['null subitem',i=>i.subitems[0]=null],['null choice',i=>i.choices[0]=null]
 ]){const bad=classificationFixture();mutate(bad.items[0]);assert.throws(()=>api.render(host,bad),/Invalid source quiz/,name);checks++;ok(host.contains(c.element),'classification invalid replacement preserves view: '+name);}


 c.cleanup();stored=base();const partial=classificationFixture(),partialItem=partial.items[0];stored.workspace.responses[partialItem.id]={values:['없는 답','','',''],submitted:false,correct:null,checkedSlots:[true,false,false,false]};c=api.render(host,partial,opts);await c.ready;ok(host.querySelector('.textbook-source-inline-feedback').textContent.includes('정답:'),'partly checked wrong slot feedback restored');eq(host.querySelectorAll('.textbook-source-inline-feedback')[1].textContent,'','unchecked blank remains ungraded');inputs()[0].value='②,③';inputs()[0].dispatchEvent(new w.Event('input'));ok(c.hasUnsaved(),'typed change pending');await c.prepareLeave();eq(stored.workspace.status,'paused','navigation flushes current state');eq(stored.workspace.responses[partialItem.id].values[0],'②,③','navigation preserves latest input');
 c.cleanup();let total=0;
 const dataRoot=path.resolve(process.argv[2]||'../api/private-textbook-semantic-data');
 for(const era of ['prehistory','ancient','nambuk','goryeo','joseon','opening','colonial','modern']){
  const d=JSON.parse(fs.readFileSync(path.join(dataRoot,'quizzes',era+'.json'))),before=JSON.stringify(d);stored=base();c=api.render(host,d,opts);await c.ready;eq(host.querySelectorAll('[data-source-item-id]').length,d.items.length,'all era questions rendered');
  for(const item of d.items){const row=host.querySelector('[data-source-item-id="'+item.id+'"]'),slots=item.kind==='classification'?item.responseSlots:item.blanks.flatMap(b=>b.parts||[b]),nodes=[...row.querySelectorAll('.textbook-source-quiz-input')];eq(nodes.length,slots.length,'original input positions');nodes.forEach((n,i)=>{n.value=slots[i].answerIds.map(id=>item.answers.find(a=>a.id===id).text).join(item.kind==='sequence'?(item.answer.sequenceSeparator||''):', ');n.dispatchEvent(new w.Event('input'));n.dispatchEvent(new w.Event('blur'));});ok([...row.querySelectorAll('.textbook-source-inline-feedback')].every(n=>n.dataset.result==='match'),'source exact answers grade instantly');total++;}
  eq(JSON.stringify(d),before,'source immutable');c.cleanup();
 }
 eq(total,642,'all source questions');console.log(JSON.stringify({checks,failures:0,total,scope:'whole-era inline list; local grading; IME; edit/regrade; batched writes; slow ack races; stop/resume/fail/retry; exact source validation'}));w.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
