const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn}=require('child_process'),assert=require('assert/strict');
const root=process.cwd(),wait=ms=>new Promise(r=>setTimeout(r,ms));let server,chrome,ws;
(async()=>{try{server=http.createServer((req,res)=>{if(req.url.startsWith('/qa')){res.setHeader('Content-Type','text/html');return res.end("<!doctype html><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><link rel=\"stylesheet\" href=\"/media/company-mode.css\"><body><main id=\"app\"><div class=\"device-content\"><article><p id=\"before\">Source text before</p><figure class=\"textbook-figure-group\"><div class=\"textbook-figure-group-canvas\" style=\"aspect-ratio:3/2\"><div class=\"textbook-figure-group-part\"><img alt=\"original\" src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='teal'/%3E%3C/svg%3E\"></div></div><div class=\"textbook-figure-group-status\"><p id=\"loading\">Loading p011-figure-2</p></div></figure><figure class=\"textbook-semantic-figure\"><p>Loading p011-figure-3</p></figure><p id=\"after\">Source text after</p><input value=\"answer\"></article></div></main><script src=\"/media/display-mode.js\"></script>")}try{res.setHeader('Content-Type',req.url.endsWith('.js')?'application/javascript':'text/css');res.end(fs.readFileSync(path.join(root,req.url)))}catch{res.statusCode=404;res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));let url='http://127.0.0.1:'+server.address().port+'/qa#chapter/ancient/webtoon';const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hanq-company-'));chrome=spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore',windowsHide:true});let port;for(let i=0;i<100;i++){try{port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];break}catch{await wait(100)}}assert(port);const tab=await(await fetch('http://127.0.0.1:'+port+'/json/new?about:blank',{method:'PUT'})).json();ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0,pending=new Map;ws.addEventListener('message',e=>{const x=JSON.parse(e.data);if(pending.has(x.id)){pending.get(x.id)(x.result);pending.delete(x.id)}});const send=(method,params={})=>new Promise(r=>{let n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}))});const ev=async expression=>{let r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};await send('Runtime.enable');await send('Page.enable');let results=[];

for(const width of [320,390,1440]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<500});
 await send('Page.navigate',{url});await wait(300);
 await ev('HanqDisplayMode.select("default");window.original=document.querySelector("figure");window.img=original.querySelector("img");window.styleBefore=original.querySelector(".textbook-figure-group-canvas").getAttribute("style");window.contentBefore=original.textContent');
 for(let i=0;i<3;i++){
  await ev('HanqDisplayMode.select("company")');await wait(60);
  assert.equal(await ev('document.querySelectorAll(".company-image-note").length'),0);
  assert(await ev('[...document.querySelectorAll("figure")].every(n=>getComputedStyle(n).display==="none"&&n.getBoundingClientRect().height===0)'));
  assert(await ev('document.querySelector("#after").getBoundingClientRect().top-document.querySelector("#before").getBoundingClientRect().bottom<60'));
  assert.equal(await ev('document.querySelector("input").value'),'answer');
  await ev('HanqDisplayMode.select("default")');await wait(60);
  assert(await ev('original===document.querySelector("figure")&&img===original.querySelector("img")&&original.querySelector(".textbook-figure-group-canvas").getAttribute("style")===styleBefore&&original.textContent===contentBefore'));
  assert(await ev('img.naturalWidth===300&&original.getBoundingClientRect().height>0'));
 }
 await ev('HanqDisplayMode.select("company");document.querySelector("#loading").textContent="Failed source image";document.querySelector("article").insertAdjacentHTML("beforeend",\'<figure class="textbook-semantic-figure"><p>Async pending</p></figure>\')');await wait(80);
 assert(await ev('[...document.querySelectorAll("figure")].every(n=>n.getBoundingClientRect().height===0)'));
 assert(await ev('document.documentElement.scrollWidth<=innerWidth'));
 const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(os.tmpdir(),'company-images-'+width+'.png'),Buffer.from(shot.data,'base64'));
 results.push({width,cycles:3,pendingFailedAndAsyncHidden:true,normalImageRestored:true,blankSpaceRemoved:true});
}
console.log(JSON.stringify(results));
}finally{ws?.close();chrome?.kill();server?.close()}})().catch(e=>{console.error(e);process.exitCode=1});
