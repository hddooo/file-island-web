'use strict';
const assert=require('assert/strict'),{JSDOM}=require('jsdom');
const {safeReturnTo,protectedRoute}=require('../media/auth-session.js');
for(const era of ['goryeo','joseon','joseon-early','joseon-late']){const route='#chapter/'+era+'/source-quiz';assert.equal(safeReturnTo(route),route);assert(protectedRoute(route));}
for(const route of ['#chapter/opening/source-quiz','#chapter/joseon/source-quiz/extra','#chapter/joseon/source-quiz?x=1','https://other.invalid/#chapter/joseon/source-quiz','#chapter/%6aoseon/source-quiz'])assert.equal(safeReturnTo(route),null);
(async()=>{for(const era of ['joseon','goryeo']){const dom=new JSDOM('<main/>',{url:'https://synthetic.invalid/#chapter/'+era+'/webtoon'}),w=dom.window,host=w.document.querySelector('main');let account={signedIn:true,ownerId:'synthetic-a',epoch:1},change,options,stops=0,pops=0;
 const api={state:()=>account,onChange:fn=>{change=fn;return()=>{change=null;};}},source='a'.repeat(64),transport={ready:true,sourceSha256:source,loadBundle:async()=>({source:{sha256:source}}),loadFigure:async()=>null};
 const session=require('../media/'+era+'-script-session.js').create({document:w.document,api,modeRouting:true,renderer:{prepare:async b=>b,mount:(h,b,o)=>{options=o;return{stop(){stops++;},handlePopState(){pops++;return true;}};}}});
 assert(await session.mount(host,transport));for(const [mode,slug] of [['exam','exam-lines'],['practice','source-quiz'],['answers','source-quiz'],['study','webtoon']]){w.history.pushState(null,'',options.routeForMode(mode));assert(w.location.hash.endsWith('/'+slug));assert(session.handlePopState());}
 assert.equal(pops,4);w.history.pushState(null,'','#chapter/'+era+'/exam-lines');assert(session.handlePopState());assert.equal(options.modeFromLocation(),'exam');
 w.history.pushState(null,'','#chapter/'+era+'/exam-lines/extra');assert(!session.handlePopState());assert.equal(stops,1);
 w.history.replaceState(null,'','#chapter/'+era+'/webtoon');assert(await session.mount(host,transport));account={signedIn:true,ownerId:'synthetic-b',epoch:2};change();assert.equal(stops,2);assert(!session.handlePopState());session.stop();dom.window.close();console.log('PASS '+era+' mode routes / strict boundary / account teardown');}})().catch(e=>{console.error(e);process.exitCode=1;});
