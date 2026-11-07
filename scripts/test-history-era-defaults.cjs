'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const cat=require('../media/private-textbook.js'),OLD=cat.revisions[0].sha256,NEW=cat.revisions[1].sha256;
const eligible=['prehistory','samguk','nambuk','colonial','modern','people','regions'];
let assertions=0;function eq(a,b){assert.deepEqual(a,b);assertions++;}
function doc(release=cat.reviewedRevisionRelease,reviewed=eligible.join(','),defaults=eligible.join(',')){return {querySelector(s){const key=s.match(/name="([^"]+)"/)[1],v={'hanq-textbook-revisions':release,'hanq-textbook-reviewed-eras':reviewed,'hanq-textbook-default-eras':defaults}[key];return v==null?null:{content:v};}};}
for(const era of eligible){
 let u=cat.defaultSourceUrl(doc(),era,'https://test.invalid/#chapter/'+era+'/webtoon');eq(u.searchParams.get('textbookSource'),NEW);eq(u.searchParams.get('textbookDefault'),'81');
 for(const source of [OLD,NEW,'unknown','']){const url='https://test.invalid/?textbookSource='+source+'#chapter/'+era+'/webtoon';eq(cat.defaultSourceUrl(doc(),era,url).href,url);}
 eq(cat.transportRevision(era,OLD),null);eq(cat.transportRevision(era,NEW),NEW);eq(cat.transportRevision(era,'unknown'),'unknown');
 u=cat.selectedSourceUrl(era,u.href,null);eq(u.searchParams.get('textbookSource'),OLD);eq(u.searchParams.has('textbookDefault'),false);eq(cat.defaultSourceUrl(doc(),era,u.href).href,u.href);
}
for(const era of ['goryeo','joseon','joseon-early','joseon-late','opening','front','credits','unknown']){
 const url='https://test.invalid/#chapter/'+era+'/webtoon';eq(cat.defaultSourceUrl(doc(),era,url).href,url);
 const auto='https://test.invalid/?textbookSource='+NEW+'&textbookDefault=81#chapter/'+era+'/webtoon';eq(cat.defaultSourceUrl(doc(),era,auto).searchParams.has('textbookSource'),false);
 const explicit='https://test.invalid/?textbookSource='+NEW+'#chapter/'+era+'/webtoon';eq(cat.defaultSourceUrl(doc(),era,explicit).href,explicit);
 eq(cat.transportRevision(era,OLD),OLD);
}
for(const d of [doc(null),doc('bad'),doc(undefined,'goryeo'),doc(undefined,'prehistory',null),doc(undefined,'prehistory',''),doc(undefined,'prehistory','prehistory,prehistory'),doc(undefined,'prehistory','prehistory,goryeo'),doc(undefined,'prehistory','unknown')])eq(cat.defaultRevisionReady(d,'prehistory'),false);
eq(cat.defaultRevisionReady(doc(),'ancient'),true);eq(cat.defaultRevisionReady(doc(),'gojoseon'),true);
let calls=[],location={href:'https://test.invalid/#chapter/modern/bookquiz'},state={depth:4,untouched:true};const history={state,replaceState(s,t,url){calls.push([s,url]);location.href=url;}};cat.prepareDefaultRoute(doc(),'modern',location,history);eq(calls.length,1);eq(calls[0][0],state);cat.prepareDefaultRoute(doc(),'modern',location,history);eq(calls.length,1);
// Final activation must match the verified API/data identity and only the seven intended readers.
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');const meta=name=>html.match(new RegExp('<meta name="'+name+'" content="([^"]+)"'))?.[1];eq(meta('hanq-textbook-revisions'),cat.reviewedRevisionRelease);eq(meta('hanq-textbook-reviewed-eras'),eligible.join(','));eq(meta('hanq-textbook-default-eras'),eligible.join(','));
for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/\bsrc=|\btype=/.test(m[1])&&m[2].trim())new vm.Script(m[2]);
assert.match(html,/id,textbookSourceHooks\(\{onEraChange:navigateTextbook\},id\)/);assert.match(html,/sourceRevision:HanqPrivateTextbook\.transportRevision\(sourceEra,/);assert.match(html,/\[\[0,'개념 학습'\],\[7,'시험에는 이렇게 나온다'\],\[6,'빈칸 퀴즈'\]\]/);
// Exercise the actual application hook, not only the source policy helpers.
const hook=html.split('\n').find(l=>l.trim().startsWith('function textbookSourceHooks('));
let href='https://test.invalid/?textbookSource='+NEW+'&textbookDefault=81#chapter/modern/bookquiz';
const context={URL,HanqPrivateTextbook:cat,location:{get href(){return href;}},routeId:()=> 'modern',history:{state:{depth:2},pushState(s,t,u){this.state=s;href=String(u);},replaceState(s,t,u){this.state=s;href=String(u);}}};
vm.createContext(context);vm.runInContext(hook,context);
let hooks=context.textbookSourceHooks({initialMode:'quiz'});eq(hooks.sourceRevision,NEW);hooks.onSourceChange(null);
eq(new URL(href).searchParams.get('textbookSource'),OLD);eq(new URL(href).searchParams.has('textbookDefault'),false);
eq(context.textbookSourceHooks({initialMode:'quiz'}).sourceRevision,null);eq(context.history.state.depth,3);
href='https://test.invalid/?textbookSource='+OLD+'#textbook/people';eq(context.textbookSourceHooks({},'people').sourceRevision,null);
href='https://test.invalid/?textbookSource=unknown#chapter/modern/bookquiz';eq(context.textbookSourceHooks({}).sourceRevision,'unknown');
console.log(JSON.stringify({passed:true,assertions,indexSyntax:true,productionDefaultGateAdded:true}));
