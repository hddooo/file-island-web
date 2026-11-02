window.setup=function(n){
 if(window.HanqFormalExams)window.HanqFormalExams.stop();localStorage.clear();
 window.fixture=createCbtStarsFixture(window);window.runIds=[];
 for(let i=0;i<n;i++){let id=fixture.create(79,true);runIds.push(id);let d=fixture.runs[id].data;d.run.startedAt=new Date(Date.UTC(2030,0,1,0,i)).toISOString();
 if(i%2===0){d.run.status='final';d.run.result={score:80,maxScore:100,total:50,correct:40,unanswered:0,grade:1};d.items.forEach(q=>{q.selectedOptionId=q.options[0].id;q.review={status:'wrong',earned:0,correctNumber:2,item:{},options:[]};});}}
 window.beforeRuns=JSON.stringify(fixture.runs);window.routed=[];const opts=fixture.opts();opts.onRoute=id=>routed.push(id);opts.review={render:()=>'<section class="fe-stem-analysis">지문 분석</section><section class="fe-option-analysis">보기 해설</section>'};
 window.qaOpts=opts;HanqFormalExams.mount(document.querySelector('main'),opts);
};
