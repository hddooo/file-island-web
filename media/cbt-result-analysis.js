/* Classification only after server grading. Never grades or writes an attempt. */
(function(root){'use strict';
var ORDER=['ancient','goryeo','joseon','opening','colonial','modern'];
var LABEL={ancient:'고대사',goryeo:'고려',joseon:'조선',opening:'개화기',colonial:'일제강점기',modern:'대한민국',unknown:'분류 확인 필요'};
function era(raw){if(['prehistory','gojoseon','samguk','nambuk'].indexOf(raw)>=0)return 'ancient';if(raw==='joseon-early'||raw==='joseon-late')return 'joseon';return ORDER.indexOf(raw)>=0?raw:'unknown';}
function classification(q){
 var data=(root.HANQ_CBT_CLASSIFICATIONS||{})[q.exam]||(q.exam===79?root.HANQ_CBT_CLASSIFICATION79:null),found=data&&data.items.find(function(x){return x.number===q.number&&x.questionId===q.questionId&&x.version===q.version;});
 if(found)return {era:found.era,part:found.part,topic:found.topic,note:found.note,verified:found.verified===true};
 return {era:era(q.review&&q.review.era),part:q.review&&q.review.part||'분류 확인 필요',topic:'',note:'이 문항의 세부 파트는 검수가 필요한 초기 분류입니다.',verified:false};
}
function analyze(items){
 var rows=(items||[]).filter(function(q){return q.review&&['correct','wrong','unanswered'].indexOf(q.review.status)>=0;}).map(function(q){var c=classification(q);return {number:q.number,position:q.position,status:q.review.status,correct:q.review.status==='correct',unanswered:q.review.status==='unanswered',era:c.era,eraLabel:LABEL[c.era],part:c.part,topic:c.topic,note:c.note,verified:c.verified};}).sort(function(a,b){return a.number-b.number;});
 var groups={},byEra={};ORDER.forEach(function(key){byEra[key]={key:key,label:LABEL[key],total:0,wrong:0,unanswered:0,numbers:[]};});
 rows.forEach(function(r){var e=byEra[r.era]||(byEra.unknown={key:'unknown',label:LABEL.unknown,total:0,wrong:0,unanswered:0,numbers:[]}),key=r.era+'|'+r.part,g=groups[key]||(groups[key]={era:r.era,eraLabel:r.eraLabel,part:r.part,total:0,wrong:0,unanswered:0,numbers:[],verified:true});
 e.total++;g.total++;g.verified=g.verified&&r.verified;if(!r.correct){e.wrong++;g.wrong++;e.numbers.push(r.number);g.numbers.push(r.number);}if(r.unanswered){e.unanswered++;g.unanswered++;}});
 var priorities=Object.keys(groups).map(function(k){return groups[k];}).filter(function(g){return g.wrong>0;}).sort(function(a,b){return b.wrong-a.wrong||b.wrong/b.total-a.wrong/a.total||(ORDER.indexOf(a.era)<0?99:ORDER.indexOf(a.era))-(ORDER.indexOf(b.era)<0?99:ORDER.indexOf(b.era))||(a.part<b.part?-1:a.part>b.part?1:0);});
 return {rows:rows,eras:ORDER.map(function(key){return byEra[key];}).concat(byEra.unknown?[byEra.unknown]:[]),priorities:priorities,wrongNumbers:rows.filter(function(r){return !r.correct;}).map(function(r){return r.number;}),unansweredNumbers:rows.filter(function(r){return r.unanswered;}).map(function(r){return r.number;}),verified:rows.length>0&&rows.every(function(r){return r.verified;})};
}
root.HanqCbtResultAnalysis={analyze:analyze,classification:classification};
if(typeof module!=='undefined'&&module.exports)module.exports=root.HanqCbtResultAnalysis;
})(typeof window!=='undefined'?window:globalThis);
