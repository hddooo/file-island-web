'use strict';
// Synthetic account only. iPhone viewport emulation is not a physical Safari test.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.HANQ_PLAYWRIGHT||'playwright');
const {setup}=require('./qa-vocabulary-video-bar.cjs');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.ARTIFACT_DIR||path.join(root,'../evidence/iphone-header-compact'));
fs.mkdirSync(out,{recursive:true});
async function settle(p){
 await p.evaluate(()=>document.fonts.ready);
 await p.evaluate(()=>{delete window.__headerQaGeometry;window.__headerQaStable=0;});
 await p.waitForFunction(()=>{const bar=document.querySelector('#app>.device-crown'),profile=bar?.querySelector('#headerAccount');if(!profile)return false;const b=bar.getBoundingClientRect(),r=profile.getBoundingClientRect(),key=JSON.stringify([bar.className,b.x,b.y,b.width,b.height,r.x,r.y,r.width,r.height]);window.__headerQaStable=key===window.__headerQaGeometry?window.__headerQaStable+1:0;window.__headerQaGeometry=key;return window.__headerQaStable>=4;});
}
async function fixture(p,name,partner,total,scale){
 await p.evaluate(({name,partner,total,scale})=>{
  const selectors=['.device-model','#homeBrand','.hm-name','.hm-pts','.device-version'];
  document.documentElement.style.setProperty('-webkit-text-size-adjust','100%','important');
  document.documentElement.style.setProperty('text-size-adjust','100%','important');
  for(const selector of selectors)document.querySelector('#app>.device-crown '+selector)?.style.removeProperty('font-size');
  const base=selectors.map(selector=>parseFloat(getComputedStyle(document.querySelector('#app>.device-crown '+selector)).fontSize));
  document.documentElement.style.setProperty('-webkit-text-size-adjust',scale+'%','important');
  document.documentElement.style.setProperty('text-size-adjust',scale+'%','important');
  const st=HanqApi.state(),first=st.partners.items[0],other=st.partners.items[1];
  st.user.displayName=name;st.growth.points=total;st.partners.totalPoints=total;
  Object.assign(first,{family:'patamon',character:'poyomon',stage:0,points:partner,nextCharacter:'tokomon',nextThreshold:500,eligible:partner>=500});
  other.points=total-partner;other.eligible=other.points>=other.nextThreshold;
  if(!HanqCollection.ready(st))throw Error('Invalid synthetic collection');
  document.querySelector('.header-menu').outerHTML='<nav class="header-menu" aria-label="회원 메뉴">'+HanqCharacters.member(st)+'</nav>';
  window.__headerQaScaleMode='native-text-size-adjust';
  // Desktop WebKit does not implement iOS text-size-adjust. Still exercise
  // enlarged type in that port, recording the explicit geometry stress fallback.
  if(scale>100&&parseFloat(getComputedStyle(document.querySelector('#headerAccount .hm-name')).fontSize)<base[2]*1.3){for(let i=0;i<selectors.length;i++)document.querySelector('#app>.device-crown '+selectors[i]).style.setProperty('font-size',base[i]*scale/100+'px','important');window.__headerQaScaleMode='explicit-font-size-stress';}
 },{name,partner,total,scale});
 await settle(p);
}
async function metrics(p){return p.evaluate(()=>{
 const bar=document.querySelector('#app>.device-crown'),brand=bar.querySelector('.device-model'),back=bar.querySelector('#homeBrand'),profile=bar.querySelector('#headerAccount');
 const rect=n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom,cx:r.x+r.width/2,cy:r.y+r.height/2};};
 const hit=n=>{const r=n.getBoundingClientRect();return[r.top+.5,r.bottom-.5,r.y+r.height/2-21.5,r.y+r.height/2+21.5].every(y=>n.contains(document.elementFromPoint(r.x+r.width/2,y)));};
 const fields=[...profile.querySelectorAll('.hm-name,.hm-pts,.hm-partner,.hm-total')],p=rect(profile),style=getComputedStyle(bar);
 const textFits=fields.every(n=>{const r=rect(n),range=document.createRange();range.selectNodeContents(n);return n.scrollWidth<=n.clientWidth+1&&[...range.getClientRects()].every(t=>t.left>=p.x-1&&t.right<=p.right+1&&t.top>=p.y-1&&t.bottom<=p.bottom+1)&&r.x>=p.x-1&&r.right<=p.right+1;});
 return{bar:rect(bar),brand:rect(brand),back:{...rect(back),hit:hit(back)},profile:{...p,hit:hit(profile)},picture:rect(profile.querySelector('.hm-pic')),nicknameRect:rect(profile.querySelector('.hm-name')),stacked:bar.classList.contains('device-crown-stacked'),name:profile.querySelector('.hm-name').textContent,partner:profile.querySelector('.hm-partner').textContent,total:profile.querySelector('.hm-total').textContent,character:profile.dataset.stage,accessibleName:profile.getAttribute('aria-label'),fonts:{brand:parseFloat(getComputedStyle(brand).fontSize),back:parseFloat(getComputedStyle(back).fontSize),name:parseFloat(getComputedStyle(profile.querySelector('.hm-name')).fontSize),xp:parseFloat(getComputedStyle(profile.querySelector('.hm-pts')).fontSize)},textAdjust:getComputedStyle(document.documentElement).getPropertyValue('-webkit-text-size-adjust')||getComputedStyle(document.documentElement).getPropertyValue('text-size-adjust'),scaleMode:window.__headerQaScaleMode,padding:[parseFloat(style.paddingTop),parseFloat(style.paddingBottom)],textFits,overflow:document.documentElement.scrollWidth>innerWidth+1};
 });}
function validate(m,width,kind){
 assert(!m.overflow&&m.textFits,'all text fits without page overflow '+JSON.stringify(m));
 assert.equal(m.name,kind==='large'?'정말 길고 긴 닉네임을 모두 표시하는 사용자':'검수');
 assert.equal(m.character,'poyomon');assert(m.accessibleName.includes(m.name)&&m.accessibleName.includes('포요몬'));
 assert(m.fonts.brand>=12&&m.fonts.back>=14&&m.fonts.name>=13&&m.fonts.xp>=12,'readable font sizes retained');
 assert(m.picture.w>=26&&m.picture.h>=26,'registered portrait remains at least26px');assert(m.picture.right<=m.nicknameRect.x+1,'portrait stays clear of nickname');assert(m.picture.x>=m.profile.x-1&&m.picture.right<=m.profile.right+1&&m.picture.y>=m.profile.y-1&&m.picture.bottom<=m.profile.bottom+1,'portrait stays inside the native profile control');
 if(kind==='text160')assert(m.fonts.name>=20&&m.fonts.xp>=19,'text-scale case actually enlarges rendered typography');
 assert(Math.abs(m.brand.cx-m.bar.cx)<1,'brand stays at hardware centre');
 assert(Math.abs(m.back.cy-m.profile.cy)<1,'back and identity share the action row');
 for(const control of [m.back,m.profile]){assert(control.h>=44&&control.hit,'native44px target and edge hits');assert(control.x>=m.bar.x&&control.right<=m.bar.right&&control.y>=m.bar.y&&control.bottom<=m.bar.bottom);}
 assert(m.back.right+3<=m.profile.x,'action controls do not overlap');
 if(m.stacked){assert(m.brand.bottom<=Math.min(m.back.y,m.profile.y)+1,'brand title row is above both actions');assert(m.bar.h-(Math.max(m.back.bottom,m.profile.bottom)-m.brand.y)<=13,'two-row chrome has no empty action row');}
 else{assert(Math.abs(m.brand.cy-m.back.cy)<1);assert(m.back.right+3<=m.brand.x&&m.brand.right+3<=m.profile.x,'brand has clear equal-side tracks');}
 if(kind==='actual'||kind==='recovered'){assert(m.bar.h<=(m.stacked?86:62),'compact normal header budget');if(width>=390)assert(!m.stacked,'actual390px account fits one row');}
}
(async()=>{const results=[],failures=[];for(const engine of [chromium,webkit]){const browser=await engine.launch();try{for(const width of [320,360,390,430,1440]){
 const {p,context,errors,writes}=await setup(browser,width,root,{viewport:{width,height:width<500?844:1000},isMobile:width<500,hasTouch:width<500,deviceScaleFactor:width<500?3:1});
 try{await p.emulateMedia({reducedMotion:'reduce'});await p.goto('https://hanq.vercel.app/#history');await p.locator('.island-harbors').waitFor();await p.waitForFunction(()=>HanqApi.state().profileStatus==='ready'&&!HanqApi.state().restoring);
  let normal;for(const [kind,name,partner,total,scale]of [['actual','검수',103,1988,100],['large','정말 길고 긴 닉네임을 모두 표시하는 사용자',123456789,Number.MAX_SAFE_INTEGER,100],['text160','검수',103,1988,160],['recovered','검수',103,1988,100]]){
   await fixture(p,name,partner,total,scale);const m=await metrics(p),entry={engine:engine.name(),width,kind,metrics:m};results.push(entry);await p.locator('#app>.device-crown').screenshot({path:path.join(out,engine.name()+'-'+width+'-'+kind+'.png')});validate(m,width,kind);assert.equal(m.partner,partner.toLocaleString('ko-KR'));assert.equal(m.total,'('+total.toLocaleString('ko-KR')+')');
   if(kind==='actual')normal=m;if(kind==='recovered'){assert.equal(m.stacked,normal.stacked);assert(Math.abs(m.bar.h-normal.bar.h)<.1,'outerHTML replacement recovers original compact fit');}
   console.log('IPHONE_HEADER_CASE_PASS',engine.name(),width,kind,JSON.stringify({height:m.bar.h,stacked:m.stacked,fonts:m.fonts,textAdjust:m.textAdjust}));
  }
  await p.locator('#homeBrand').focus();await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'headerAccount');assert(await p.locator('#headerAccount').evaluate(n=>n.matches(':focus-visible')));await p.keyboard.press('Enter');await p.locator('#acRoot').waitFor();await p.locator('#homeBrand').click();await p.waitForFunction(()=>location.hash==='#history');await p.locator('.island-harbors').waitFor();await p.locator('#homeBrand').focus();await p.keyboard.press('Enter');await p.waitForFunction(()=>location.hash==='#subjects');await p.locator('.world-map').waitFor();assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
 }catch(error){failures.push({engine:engine.name(),width,error:error.stack});console.error('IPHONE_HEADER_CASE_FAIL',engine.name(),width,error.stack);}finally{await context.close();}
 }}finally{await browser.close();}}
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({passed:!failures.length,syntheticOnly:true,physicalIphone:false,results,failures},null,2));assert.deepEqual(failures,[]);console.log('PASS',results.length,'compact iPhone header typography cases and10 native keyboard/navigation flows');
})().catch(error=>{console.error(error);process.exitCode=1;});
