'use strict';
// Full-app styles/router with synthetic API/source data only. No production writes.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const {chromium, webkit} = require('../.test-tools/node_modules/playwright');
const {setup} = require('./qa-vocabulary-video-bar.cjs');
const {makeFixture} = require('./history-reader-fixtures.cjs');
const root = path.resolve(process.env.FRONTEND_ROOT || path.join(__dirname, '..'));
const out = path.resolve(process.env.ARTIFACT_DIR || path.join(root, '../evidence/keywords'));
fs.mkdirSync(out, {recursive:true});
const settle = p => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const pop = '#hanq-keyword-popover';
async function bounds(p) {
  return p.locator(pop).evaluate(n => {
    const r=n.getBoundingClientRect(), v=visualViewport;
    return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height,vw:v.width,vh:v.height,overflow:document.documentElement.scrollWidth>innerWidth+1,briefLines:document.querySelector('#hanq-keyword-popover-brief').getBoundingClientRect().height/parseFloat(getComputedStyle(document.querySelector('#hanq-keyword-popover-brief')).lineHeight)};
  });
}
function fits(r) { assert(r.left>=7 && r.top>=7 && r.right<=r.vw-7 && r.bottom<=r.vh-7, JSON.stringify(r)); assert(!r.overflow); }
async function mount(p) {
  return p.evaluate(() => {
    const host=document.createElement('div');host.id='keyword-fixture';
    document.querySelector('.textbook-semantic-library').replaceChildren(host);
    const outside=document.createElement('button');outside.id='kw-outside';outside.type='button';outside.textContent='합성 바깥 버튼';host.before(outside);
    const line=(text,bold=false)=>({spans:[{text,bold}]});
    const page={schemaVersion:'hanq-semantic/1',pdfPage:9,reviewStatus:'verified',blocks:[
      {id:'split',type:'text',lines:[{spans:[{text:'합성 문장: 의정부 '},{text:'서사',bold:true},{text:'제와 6조 '},{text:'직계제',bold:true},{text:'를 비교해요.'}]}]},
      {id:'repeated',type:'text',lines:[line('대동법 · 대동법 · 골품제도 · 골품제 · 의정부서사제 · 육조 직계제')]},
      {id:'avoid',type:'text',lines:[line('영고탑 · 소도시 · 향약집성방 · 불교 공인 · 동학농민운동')]},
      {id:'table',type:'table',columnCount:2,rows:[{cells:[{rowIndex:0,columnIndex:0,lines:[line('균역법')]},{rowIndex:0,columnIndex:1,lines:[line('서옥제')]}]}]},
      ...HANQ_GLOSSARY.map(e=>({id:'all-'+e.id,type:'text',lines:[line(e.term)]}))
    ],sourceBlanks:[],generatedPractice:[]};
    window.kwSource=JSON.stringify(page);window.kwPage=page;
    window.kwController=HanqTextbookSemantic.render(host,page);
    window.kwBefore=[...host.querySelectorAll('.textbook-semantic-content .textbook-semantic-line')].map(n=>n.textContent);
    window.kwBold=[...host.querySelectorAll('strong')].map(n=>({node:n,text:n.textContent,attributes:n.outerHTML.match(/^<[^>]+>/)[0]}));
    const manual=document.createElement('p');manual.className='textbook-semantic-line';manual.id='manual-exclusions';
    manual.innerHTML='<a href="#ignore">소도</a><button>군포</button><span contenteditable="true">공납</span><span data-no-gloss>붕당</span><span hidden>사림</span><span>의정부 </span><a href="#ignore">서사</a><span>제</span>';
    host.querySelector('.textbook-semantic-content').append(manual);
    const prompt=document.createElement('p');prompt.className='textbook-semantic-prompt';prompt.innerHTML='<span class="textbook-semantic-line">대동법</span><input value="정답과 진도 보존" data-answer-id="synthetic-answer">';host.querySelector('.textbook-semantic-content').append(prompt);
    const empty=document.createElement('table');empty.setAttribute('data-source-empty-response','');empty.innerHTML='<tr><td><span class="textbook-semantic-line">군포 (   )</span></td></tr>';host.querySelector('.textbook-semantic-content').append(empty);
    return HANQ_GLOSSARY.length;
  });
}
(async()=>{
  const results=[],failures=[];
  for(const engine of [chromium,webkit].filter(e=>!process.env.KEYWORD_ENGINE||e.name()===process.env.KEYWORD_ENGINE)) {
    const browser=await engine.launch();
    try { for(const [width,height] of [[320,640],[390,844],[1440,900],[844,360]].filter(c=>!process.env.KEYWORD_WIDTH||c[0]===Number(process.env.KEYWORD_WIDTH))) {
      const s=await setup(browser,width,root,{viewport:{width,height},hasTouch:width<500,reducedMotion:width===390?'no-preference':'reduce'});
      const {p,context,errors,writes}=s, f=makeFixture(null);
      // Cocoa WebKit's native all-control traversal includes links with Option-Tab.
      const tab=engine.name()==='webkit'&&process.platform==='darwin'?'Alt+Tab':'Tab';
      p.setDefaultTimeout(7000);
      await context.route('**/api/v1/textbook/**',r=>f.handler(r));
      try {
        await p.goto('https://hanq.vercel.app/#chapter/prehistory/webtoon');
        await p.locator('.textbook-semantic-content').first().waitFor();
        const count=await mount(p);await settle(p);
        const integrity=await p.evaluate(()=>({
          sourceUnchanged:kwSource===JSON.stringify(kwPage),
          linesUnchanged:JSON.stringify(kwBefore)===JSON.stringify([...document.querySelectorAll('#keyword-fixture .textbook-semantic-content .textbook-semantic-line')].slice(0,kwBefore.length).map(n=>n.textContent)),
          boldUnchanged:kwBold.every(x=>x.node.isConnected&&x.node.textContent===x.text&&x.node.outerHTML.match(/^<[^>]+>/)[0]===x.attributes),
          all:HANQ_GLOSSARY.every(e=>document.querySelector('[data-source-block="all-'+e.id+'"] [data-textbook-keyword="'+e.id+'"][role=button]')),
          avoided:document.querySelectorAll('[data-source-block=avoid] [data-textbook-keyword]').length,
          skipped:document.querySelectorAll('#manual-exclusions [data-textbook-keyword],.textbook-semantic-prompt [data-textbook-keyword],[data-source-empty-response] [data-textbook-keyword]').length,
          splits:document.querySelectorAll('[data-source-block=split] [data-textbook-keyword="uijeongbu-seosa"]').length,
          splitTabs:document.querySelectorAll('[data-source-block=split] [data-textbook-keyword="uijeongbu-seosa"][tabindex]').length,
          repeated:document.querySelectorAll('[data-source-block=repeated] [data-textbook-keyword="daedong"]').length,
          table:document.querySelector('[data-source-block=table] td').textContent,
          answer:document.querySelector('[data-answer-id]').value,
          noDoubleWrap:HanqTextbookKeywords.decorate(document)===0,
          legacy:HanqGlossary.find('의정부 서사제').some(e=>e.id==='uijeongbu-seosa')
        }));
        assert(integrity.sourceUnchanged&&integrity.linesUnchanged&&integrity.boldUnchanged&&integrity.all&&integrity.noDoubleWrap&&integrity.legacy,JSON.stringify(integrity));
        assert.equal(integrity.avoided,0);assert.equal(integrity.skipped,0);assert.equal(integrity.splits,3);assert.equal(integrity.splitTabs,1);assert.equal(integrity.repeated,2);assert.equal(integrity.table,'균역법');assert.equal(integrity.answer,'정답과 진도 보존');
        const trigger=p.locator('[data-source-block=split] [data-textbook-keyword="uijeongbu-seosa"][role=button]');
        await trigger.scrollIntoViewIfNeeded();await settle(p);await trigger.focus();await p.locator(pop).waitFor({state:'visible'});const briefBounds=await bounds(p);fits(briefBounds);assert(briefBounds.briefLines<=3.1,'compact explanation stays within three lines');
        assert.equal(await trigger.getAttribute('aria-expanded'),'true');
        await p.keyboard.press('Enter');assert.equal(await p.locator(pop+' button').evaluate(n=>n===document.activeElement),true,JSON.stringify(await p.evaluate(()=>({focus:document.activeElement.outerHTML,hidden:document.querySelector('#hanq-keyword-popover').hidden}))));
        await p.keyboard.press(tab);assert.equal(await p.locator(pop+' summary').evaluate(n=>n===document.activeElement),true);
        await p.keyboard.press('Enter');await settle(p);fits(await bounds(p));assert.equal(await p.locator(pop+' a').count(),2);
        await p.keyboard.press(tab);assert.equal(await p.locator(pop+' a').first().evaluate(n=>n===document.activeElement),true);
        await p.keyboard.press('Escape');await p.locator(pop).waitFor({state:'hidden'});assert.equal(await trigger.evaluate(n=>n===document.activeElement),true);assert.equal(await trigger.getAttribute('aria-expanded'),'false');
        // Native mouse hover works across emphasis fragments and into the panel.
        await p.locator('#homeBrand').focus();
        const lastPart=p.locator('[data-source-block=split] [data-textbook-keyword="uijeongbu-seosa"]').last();
        await lastPart.hover();await p.locator(pop).waitFor({state:'visible'});fits(await bounds(p));
        await p.locator(pop+' summary').hover();await p.waitForTimeout(220);assert(await p.locator(pop).isVisible());
        await p.screenshot({path:path.join(out,engine.name()+'-'+width+'x'+height+'-keyword.png')});
        await p.mouse.move(0,0);await p.locator(pop).waitFor({state:'hidden'});
        await lastPart.hover();await p.locator(pop).waitFor({state:'visible'});
        await p.locator(pop+' button').click();await p.locator(pop).waitFor({state:'hidden'});
        // Touch opens on first tap, toggles closed on second; no synthetic hover needed.
        if(width<500) {
          await lastPart.tap();await p.locator(pop).waitFor({state:'visible'});fits(await bounds(p));
          await lastPart.tap();await p.locator(pop).waitFor({state:'hidden'});
          await trigger.tap();await p.locator(pop).waitFor({state:'visible'});
          await p.locator('#kw-outside').tap();await p.locator(pop).waitFor({state:'hidden'});
        }
        // Boundary checks anchor to each corner, including the low landscape viewport.
        await p.evaluate(()=>{const host=document.createElement('article');host.id='kw-edge';host.className='textbook-semantic';host.innerHTML='<div class="textbook-semantic-content"><span class="textbook-semantic-line">대동법</span></div>';document.body.append(host);});await settle(p);
        const edge=p.locator('#kw-edge [role=button]');
        for(const [x,y] of [[8,8],[width-80,8],[width-80,height-36],[8,height-36]]) {
          await p.mouse.move(width/2,height/2);await settle(p);
          await edge.evaluate((n,pos)=>{n.style.cssText='position:fixed;z-index:999999;left:'+pos[0]+'px;top:'+pos[1]+'px';},[x,y]);
          await edge.hover();await p.locator(pop).waitFor({state:'visible'});fits(await bounds(p));await p.keyboard.press('Escape');
        }
        await p.evaluate(()=>document.querySelector('#kw-edge').remove());
        const removeTrigger=p.locator('[data-source-block="all-daedong"] [role=button]');
        await removeTrigger.scrollIntoViewIfNeeded();await settle(p);await removeTrigger.focus();await p.locator(pop).waitFor({state:'visible'});
        await p.evaluate(()=>document.querySelector('#keyword-fixture').remove());await p.locator(pop).waitFor({state:'hidden'});
        // A newly mounted page is annotated; route changes close without stealing focus.
        await mount(p);await settle(p);const next=p.locator('[data-source-block="all-daedong"] [role=button]');
        await next.focus();await p.locator(pop).waitFor({state:'visible'});
        await p.evaluate(()=>location.hash='#history');await p.locator(pop).waitFor({state:'hidden'});
        assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
        results.push({engine:engine.name(),width,height,entries:count,integrity,keyboardAndSources:true,splitHover:true,touch:width<500,cornerBounds:true,removeAndRemount:true,routeCleanup:true,productionWrites:0});
        console.log('KEYWORD_PASS',engine.name(),width,height);
      } catch(e) {failures.push({engine:engine.name(),width,height,error:e.stack});console.error('KEYWORD_FAIL',engine.name(),width,height,e.stack);await p.screenshot({path:path.join(out,engine.name()+'-'+width+'-failure.png')}).catch(()=>{});}
      finally {await context.close();}
    }} finally {await browser.close();}
  }
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:!failures.length,syntheticOnly:true,physicalDevice:false,results,failures},null,2));
  assert.deepEqual(failures,[]);console.log('PASS',results.length,'keyword browser cases');
})().catch(e=>{console.error(e.stack);process.exitCode=1});
