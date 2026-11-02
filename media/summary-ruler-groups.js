/* Presentation only: keep every original row/fact/source; group only explicit rulers
 * or source-backed single-ruler contexts. Comparisons, systems and broad social /
 * economic themes keep their original groupings. Never infer a ruler from a fact. */
(function(root){'use strict';
var rules={
 joseon:{sections:['rulers','culture','conflicts'],names:['태조','태종','세종','세조','예종','성종','연산군','중종','명종','선조','광해군','인조','효종','현종','숙종','영조','정조','순조','철종'],
  contexts:{'임진왜란 · 선조':'선조','인조':'인조','병자호란 · 인조':'인조','중종 · 조광조의 개혁':'중종','선조 · 붕당의 시작':'선조'},
  rows:{'단종 · 계유정난':'세조','단종 · 이징옥의 난':'세조','무오사화':'연산군','갑자사화':'연산군','기묘사화':'중종','을사사화':'명종','임진왜란':'선조','인조반정':'인조','정묘호란':'인조','병자호란':'인조','왕자의 난 · 이방원':'태종','1455 세조 즉위':'세조','영창대군 · 인목대비':'광해군','대동법 · 이원익':'광해군','강홍립 · 사르후 전투':'광해군','송시열 · 기축봉사':'효종','결작 · 선무군관포':'영조','박규수 · 삼정이정청':'철종'},
  labels:{'단종 · 계유정난':'계유정난 · 단종 때','단종 · 이징옥의 난':'이징옥의 난 · 단종 때','1455 세조 즉위':'1455 즉위'},
  remaining:{'건국과 태종':'고려 말 건국 배경 · 정도전','단종 · 세조 · 예종 · 성종':'왕위 변동과 정치','광해군':'대동법의 확대·운영','세도정치기':'세도정치의 배경','전기 왕들의 문화 사업':'서원·유학자','후기 왕과 예술':'후기 예술·학문'}},
 goryeo:{sections:['flow','culture'],names:['태조','혜종','정종','광종','경종','성종','문종','숙종','예종','인종','고종','원종','충렬왕','충목왕','공민왕','우왕'],
  contexts:{'태조':'태조','성종':'성종'},
  rows:{'최충 · 9재 학당 · 문헌공도':'문종','이자겸 · 척준경':'인종','묘청 · 서경 · 김부식':'인종','공민왕 · 기철':'공민왕','신돈 · 전민변정도감':'공민왕'},
  remaining:{'광종 · 경종':'왕권 정비','원 간섭기와 공민왕':'원 간섭과 개혁의 배경'}},
 samguk:{sections:['flow','culture'],names:['유리왕','고국천왕','동천왕','미천왕','고국원왕','소수림왕','광개토왕','장수왕','영양왕','보장왕','근초고왕','문주왕','무령왕','성왕','무왕','의자왕','지증왕','법흥왕','진흥왕','선덕여왕','무열왕','문무왕'],
  countries:{'유리왕':'고구려','고국천왕':'고구려','동천왕':'고구려','미천왕':'고구려','고국원왕':'고구려','소수림왕':'고구려','광개토왕':'고구려','장수왕':'고구려','영양왕':'고구려','보장왕':'고구려','근초고왕':'백제','문주왕':'백제','무령왕':'백제','성왕':'백제','무왕':'백제','의자왕':'백제','지증왕':'신라','법흥왕':'신라','진흥왕':'신라','선덕여왕':'신라','무열왕':'신라','문무왕':'신라'},
  contexts:{'백제 전성기':'근초고왕'},
  rows:{'진대법':'고국천왕','관구검 · 환도성':'동천왕','서안평 · 낙랑군':'미천왕','호우명 그릇':'광개토왕','을지문덕 · 살수대첩':'영양왕','벽돌무덤':'무령왕','관산성':'성왕','관산성 전투':'진흥왕','김춘추':'무열왕','김춘추 · 나당 동맹':'무열왕','나당 전쟁 · 문무왕':'문무왕','매소성 · 기벌포':'문무왕'},
  labels:{'근초고왕':'전성기','고국원왕':'백제와의 전쟁','문주왕':'웅진 천도','지증왕':'국가 정비','법흥왕':'율령·불교·관제','김춘추':'김춘추 · 즉위 전 나당 동맹','김춘추 · 나당 동맹':'김춘추 · 즉위 전 나당 동맹','나당 전쟁 · 문무왕':'나당 전쟁'},
  remaining:{'고구려 전성기와 전쟁':'고구려의 방어·부흥','백제 웅진 · 사비':'백제 수도의 변화','신라의 팽창과 통일':'신라의 제도·통일 과정'}},
 nambuk:{sections:['flow','culture'],names:['신문왕','성덕왕','경덕왕','원성왕','진성여왕','경순왕','대조영','무왕','문왕','선왕','견훤','궁예'],countries:{'무왕':'발해','문왕':'발해','선왕':'발해'},
  rows:{'698 발해 건국':'대조영'},labels:{'대조영':'발해 건국','698 발해 건국':'698 건국','문왕':'대외 관계·제도','견훤':'후백제 건국','궁예':'수도·국호'},remaining:{'통일 신라 왕별 제도':'통일 신라의 제도','발해 왕별 정리':'발해의 성장'}},
 gojoseon:{sections:['flow'],names:['단군왕검','위만'],rows:{'고조선 · 건국 전승':'단군왕검'},labels:{'단군왕검':'건국 전승','위만':'왕위 교체'}},
 opening:{sections:['flow'],names:[],contexts:{'흥선대원군':'흥선대원군'},remaining:{}},
 prehistory:{sections:[],names:[]},colonial:{sections:[],names:[]},modern:{sections:[],names:[]}
};
function match(rule,key){var direct=(rule.rows||{})[key];if(direct)return direct;
 for(var i=0;i<rule.names.length;i++){var name=rule.names[i],bare=key.replace(/^(고구려|백제|신라|발해) · /,'');if(bare===name||bare.indexOf(name+' · ')===0){
   // A row comparing two rulers belongs to the original comparison/flow topic.
   var rest=bare.slice(name.length);if(rule.names.some(function(n){return n!==name&&rest.indexOf(n)>=0;}))return null;return name;}}
 return null;
}
function label(rule,key,name){if((rule.labels||{})[key])return rule.labels[key];var bare=key.replace(/^(고구려|백제|신라|발해) · /,'');if(bare.indexOf(name+' · ')===0)return bare.slice(name.length+3);if(bare===name)return '주요 업적';return key;}
function groups(era,section){var rule=rules[era];if(!rule||(!section.period&&rule.sections.indexOf(section.id)<0))return section.groups;
 var result=[],byRuler={};section.groups.forEach(function(group){var other=null;group.rows.forEach(function(row){var allowed=!section.period||rule.sections.indexOf(group.originSection)>=0;var name=allowed?(match(rule,row.key)||(rule.contexts||{})[group.originTitle||group.title]):null;if(name){var card=byRuler[name];if(!card){card=byRuler[name]={title:((rule.countries||{})[name]?rule.countries[name]+' ':'')+name,ruler:name,rows:[]};result.push(card);}card.rows.push(Object.assign({},row,{displayKey:label(rule,row.key,name)}));}
 else{if(!other){other=Object.assign({},group,{title:group.displayTitle||(rule.remaining||{})[group.title]||group.title,rows:[]});result.push(other);}other.rows.push(row);}});
 // Only comparison groups currently have notes and they are left unchanged above.
 // Preserve any future source note even if all of its rows belong to rulers.
 if(group.note&&!other)result.push({title:group.title,rows:[],note:group.note});
 });return result;
}
function joseonPeriod(section,group,row,index){
 if(section==='rulers')return group<5?'early':'late';
 if(section==='conflicts')return group===0||group===2||(group===1&&index===0)?'early':'late';
 if(section==='economy')return group===3?'early':'late';
 if(section==='systems')return group<2||(group===3&&index<5)?'early':'late';
 if(section==='culture')return group===0||group===1||(group===4&&(index<3||index===6))?'early':'late';
 if(section==='compare')return group===0&&index>=2&&index<=4||group===1&&index===2?'early':'late';
 return 'late';
}
function view(era,data){if(era!=='joseon'){
 var sections=data.sections.map(function(s){return Object.assign({},s,{groups:groups(era,s)});});
 var primary=sections.find(function(s){return s.id==='flow';});
 if(primary){var royals={};primary.groups.forEach(function(g){if(g.ruler)royals[g.ruler]=g;});
 sections.forEach(function(s){if(s===primary)return;s.groups=s.groups.filter(function(g){if(!g.ruler)return true;var target=royals[g.ruler];if(target)target.rows=target.rows.concat(g.rows);else{primary.groups.push(g);royals[g.ruler]=g;}return false;});});}
 if(primary){var order=(rules[era]||{}).names||[];primary.groups=primary.groups.slice().sort(function(a,b){return (a.ruler?order.indexOf(a.ruler):100)-(b.ruler?order.indexOf(b.ruler):100);});}
 return Object.assign({},data,{sections:sections.filter(function(s){return s.groups.length;})});
 }
 var early={id:'early',period:true,title:'조선 전기',lead:'새 나라의 기틀을 세우고 왕권과 제도를 정비했어요. 사림의 성장과 붕당, 선조 때 임진왜란까지 연결해요.',flow:'건국 → 체제 정비 → 사림·붕당 → 임진왜란 전환',groups:[],photos:[]};
 var late={id:'late',period:true,title:'조선 후기',lead:'양난 뒤의 재건과 붕당의 변화, 탕평·세도정치를 살펴봐요. 달라진 경제·사회·문화는 주제별로 함께 정리해요.',flow:'전후 재건·붕당의 변화 → 탕평 → 세도정치',groups:[],photos:[]};
 data.sections.forEach(function(s){s.groups.forEach(function(g,gi){['early','late'].forEach(function(period){var rows=g.rows.filter(function(r,ri){return joseonPeriod(s.id,gi,r,ri)===period;});if(!rows.length)return;
 var displayTitle=(rules.joseon.remaining||{})[g.title]||g.title;
 if(s.id==='economy'&&gi===0)displayTitle='전·후기 세금 비교';
 if(s.id==='economy'&&gi===3||s.id==='systems'&&gi===0||s.id==='culture'&&gi===1)displayTitle='전·후기 공통 · '+g.title;
 if(s.id==='systems'&&gi===2)displayTitle='임진왜란 전환·이후 군대';
 if(s.id==='systems'&&gi===3)displayTitle='전·후기 공통 · 학교·향촌·화폐';
 (period==='early'?early:late).groups.push(Object.assign({},g,{rows:rows,originSection:s.id,originTitle:g.title,displayTitle:displayTitle,note:period==='early'||!g.rows.some(function(r,ri){return joseonPeriod(s.id,gi,r,ri)==='early';})?g.note:''}));
 });});});
 var order=['태조','태종','세종','세조','예종','성종','연산군','중종','명종','선조','광해군','인조','효종','현종','숙종','영조','정조','순조','철종'];
 [early,late].forEach(function(p){p.groups=groups(era,p);p.groups.sort(function(a,b){return (a.ruler?order.indexOf(a.ruler):100)-(b.ruler?order.indexOf(b.ruler):100);});p.groups.forEach(function(g){if(g.ruler==='선조')g.transition='임진왜란 · 전기와 후기를 잇는 전환점';});});
 data.photos.forEach(function(p){(/청화백자|세한도/.test(p.name)?late:early).photos.push(p);});
 return Object.assign({},data,{scope:'조선 전기·후기 두 흐름으로 읽어요. 선조 때 임진왜란은 전환 지점이며, 관련 제도·사회·문화도 함께 정리해요.',sections:[early,late],photos:[]});
}
root.HanqSummaryRulerGroups={groups:groups,view:view};
})(window);
