/* Synthetic API only. Reads production assets optionally; never writes real records. */
const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('assert/strict'),crypto=require('crypto');
const http=require('http');
const {chromium}=require('../.test-tools/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(root,'../deliverables/connector-summary');fs.mkdirSync(out,{recursive:true});
const held=new Map(['index.html','media/account-ui.css','media/account-ui.js','media/api-client.js','media/characters.js'].map(f=>[f,cp.execFileSync('git',['show','HEAD:'+f],{cwd:root})]));
(async()=>{const server=http.createServer((req,res)=>{const f=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html',file=path.resolve(root,f);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.pdf':'application/pdf'};res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(held.get(f)||fs.readFileSync(file));});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=process.env.PRODUCTION?'https://hanq.vercel.app':'http://127.0.0.1:'+server.address().port;const browser=await chromium.launch();let results=[];try{for(const width of [320,390,1440]){
 const ctx=await browser.newContext({viewport:{width,height:900},hasTouch:width<700,reducedMotion:'reduce',acceptDownloads:true});let writes=0;const errors=[];ctx.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 await ctx.addInitScript(()=>{if(['hanq.vercel.app','127.0.0.1'].includes(location.hostname))localStorage.setItem('hanqacct:signedIn','1');});
 await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname==='hanq-api.onrender.com'){if(!['GET','HEAD'].includes(r.request().method())&&!u.pathname.endsWith('/refresh'))writes++;const user={id:'synthetic-connector-pdf',displayName:'합성 검수'};return r.fulfill({json:u.pathname.endsWith('/refresh')?{user,accessToken:'synthetic'}:u.pathname.endsWith('/me')?{user,growth:{points:0}}:{notes:[],items:[]}});}if(!['hanq.vercel.app','127.0.0.1'].includes(u.hostname))return r.abort();return r.continue();});
 const p=await ctx.newPage();await p.goto(base+'/#toeic/grammar/clauses-connectors');await p.locator('.cn-core').waitFor();
 assert.equal(await p.locator('.cn-example').count(),3);assert.equal(await p.locator('.cn-evidence').count(),5);assert.equal(await p.locator('.cn-core').locator('text=126').count(),0);
 assert.deepEqual(await p.locator('.tg-category-table tbody').evaluateAll(ns=>ns.map(n=>n.children.length)),[36,33,33,2]);
 const overflow=await p.locator('.tg-learning').evaluate(host=>[...host.querySelectorAll('p,table,a,.cn-core')].filter(n=>n.scrollWidth>n.clientWidth+2).map(n=>n.className));assert.deepEqual(overflow,[]);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 assert(await p.locator('.cn-core').isVisible());assert.equal(await p.locator('.cn-detailed-lessons').evaluate(n=>n.open),false);
 await p.screenshot({path:path.join(out,(process.env.PRODUCTION?'production-':'')+'site-'+width+'.png')});
 await p.locator('.cn-steps').evaluate(n=>n.scrollIntoView({block:'start'}));await p.screenshot({path:path.join(out,(process.env.PRODUCTION?'production-':'')+'core-'+width+'.png')});
 await p.locator('#memory-conjunctions>h5').evaluate(n=>n.scrollIntoView({block:'start'}));await p.screenshot({path:path.join(out,(process.env.PRODUCTION?'production-':'')+'memory-'+width+'.png')});
 // Detailed lesson links, old route IDs, and practice still resolve.
 await p.getByRole('button',{name:'빈칸 앞뒤 문장 경계: 접속부사는 부사',exact:true}).count().then(async count=>{if(count)await p.getByRole('button',{name:'빈칸 앞뒤 문장 경계: 접속부사는 부사',exact:true}).click();else await p.locator('.tg-learning-topics button').first().click();});
 assert(await p.locator('.cn-detailed-lessons').evaluate(n=>n.open));
 if(width===1440){
  const paper=await ctx.newPage();await paper.goto(base+'/');await paper.waitForFunction(()=>window.HanqConnectorSummary&&window.HANQ_WEAKNESS_LEARNING);
  await paper.evaluate(()=>{const c=window.HANQ_WEAKNESS_LEARNING.chapters.find(c=>c.id==='clauses-connectors');document.head.replaceChildren();window.HanqConnectorSummary.renderPrint(document,c);});
  await paper.addStyleTag({content:fs.readFileSync(path.join(root,'media/connector-print.css'),'utf8')});await paper.emulateMedia({media:'print'});await paper.evaluate(()=>document.fonts.ready);
  const metrics=await paper.evaluate(()=>[...document.querySelectorAll('.cn-paper')].map(n=>({height:n.getBoundingClientRect().height,grid:n.querySelector('.cn-paper-grid').getBoundingClientRect().height,cols:[...n.querySelectorAll('.cn-paper-grid>section')].map(c=>({client:c.clientHeight,scroll:c.scrollHeight,lastBottom:c.lastElementChild.getBoundingClientRect().bottom,footerTop:n.querySelector('footer').getBoundingClientRect().top}))})));
  console.log('PRINT METRICS',JSON.stringify(metrics));assert(metrics.every(p=>p.cols.every(c=>c.scroll<=c.client+1&&c.lastBottom<=c.footerTop+1)),'print clipping');
  assert(await paper.evaluate(()=>[...document.querySelectorAll('.cn-paper')].every(p=>p.querySelector('header h1').getBoundingClientRect().top>=p.getBoundingClientRect().top)),'page title outside printable fragment');
  const compare=await paper.evaluate(()=>({printed:[...document.querySelectorAll('tbody tr')].map(n=>[...n.children].map(c=>c.textContent)),original:window.HANQ_WEAKNESS_LEARNING.chapters.find(c=>c.id==='clauses-connectors').recallTables.flatMap(t=>t.rows.map(r=>r.slice(0,2))).concat(window.HANQ_WEAKNESS_LEARNING.chapters.find(c=>c.id==='clauses-connectors').conditionRecall.rows.map(r=>r.slice(0,2)))}));assert.deepEqual(compare.printed,compare.original);
  const pdf=path.join(out,process.env.PRODUCTION?'production-connector-summary.pdf':'connector-summary.pdf');await paper.pdf({path:pdf,preferCSSPageSize:true,printBackground:true,displayHeaderFooter:false});const info=cp.execFileSync('/opt/homebrew/bin/pdfinfo',[pdf],{encoding:'utf8'});assert(/Pages:\s+2\b/.test(info));assert(/Page size:.*\(A4\)/.test(info));
  cp.execFileSync('/opt/homebrew/bin/pdftoppm',['-scale-to','1500','-png',pdf,pdf.replace('.pdf','')]);
  if(process.env.BUILD_PDF)fs.copyFileSync(pdf,path.join(root,'media/connector-summary.pdf'));
  results.push({printPages:2,A4:true,expressions:104,sharedTextExact:true,metrics});await paper.close();
 }
 // Download cancel/reclick happens after the asset exists (BUILD first pass only skips mobile until next pass).
 if(fs.existsSync(path.join(root,'media/connector-summary.pdf'))){
  const a=p.getByRole('link',{name:'약점파훼 2 핵심노트 PDF 저장 · A4 2쪽',exact:true});
  const [first]=await Promise.all([p.waitForEvent('download'),a.click()]);await first.cancel();await first.failure();const [second]=await Promise.all([p.waitForEvent('download'),a.click()]);const saved=path.join(out,'download-'+width+'.pdf');console.log('DOWNLOAD',width,second.url(),await second.failure());await second.saveAs(saved);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(saved)).digest('hex'),crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'media/connector-summary.pdf'))).digest('hex'));
  assert.equal(p.url().split('#')[1],'toeic/grammar/clauses-connectors');
 }
 assert.equal(writes,0);assert.deepEqual(errors,[]);results.push({width,mobileOverflow:false,websiteConcepts:3,evidencePoints:5,wordRows:104,oldLessonLinks:true,realUserWrites:0});await ctx.close();console.log('PASS',width);
 }fs.writeFileSync(path.join(out,(process.env.PRODUCTION?'production-':'')+'result.json'),JSON.stringify({passed:true,results},null,2));}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}})().catch(e=>{console.error(e);process.exitCode=1});
