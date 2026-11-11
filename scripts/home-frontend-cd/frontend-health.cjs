'use strict';
// Installed controller code only. Never execute an artifact or alter another service.
const fs = require('node:fs'), path = require('node:path');
const {spawnSync} = require('node:child_process');
const TARGET = 'fileisland-web-candidate';
const DOCKER = 'C:/Program Files/Docker/Docker/resources/bin/docker.exe';
const LIMIT = 3, COOLDOWN = 15 * 60 * 1000, GRACE = 120000;
const PROBE = 'wget -q -T 5 -O /dev/null http://127.0.0.1:8080/app-version.json && wget -q -T 5 -O /dev/null http://127.0.0.1:8080/auth/login.html';
function command(args) {
  const r = spawnSync(DOCKER, args, {encoding:'utf8', timeout:30000, windowsHide:true, maxBuffer:32768});
  return {ok: !r.error && r.status === 0, output: r.stdout || ''};
}
function inspect() {
  const r = command(['inspect','--format','{"id":{{json .Id}},"state":{{json .State.Status}},"started":{{json .State.StartedAt}},"restart":{{json .HostConfig.RestartPolicy.Name}},"project":{{json (index .Config.Labels "com.docker.compose.project")}}}',TARGET]);
  if (!r.ok) return null;
  try { return JSON.parse(r.output); } catch { return null; }
}
function probe() { return command(['exec',TARGET,'sh','-c',PROBE]).ok; }
function deploying() {
  const r=command(['exec',TARGET,'sh','-c','if [ -d /srv/releases/.deploy-lock ]; then printf locked; else printf clear; fi']);
  return !r.ok?null:r.output==='clear'?false:r.output==='locked'?true:null;
}
function freshState() { return {schema:1,id:null,failures:0,lastCheck:0,lastRecovery:0}; }
function validState(s) {
  return s && s.schema===1 && (s.id===null || typeof s.id==='string') && Number.isInteger(s.failures) && s.failures>=0 && s.failures<=LIMIT && ['lastCheck','lastRecovery'].every(k=>Number.isFinite(s[k]) && s[k]>=0);
}
async function cycle(state, d) {
  if (!validState(state)) throw Error('Invalid recovery state; inspect retained state before resetting');
  const now=d.now(), s={...state}, result={time:new Date(now).toISOString(),target:TARGET,action:'observe',status:'unknown'};
  const finish = status => {result.status=status;s.lastCheck=now;d.save(s);return {...result,failures:s.failures};};
  if(d.maintenance()) {s.failures=0;return finish('maintenance');}
  const c=d.inspect();
  if(!c) {s.failures=0;return finish('docker-or-container-unavailable');}
  result.containerState=c.state; result.restartPolicy=c.restart;
  if(c.project!==TARGET) {s.failures=0;return finish('target-identity-mismatch');}
  if(s.id!==c.id || now-s.lastCheck>120000 || now<s.lastCheck) s.failures=0;
  s.id=c.id;
  // Respect explicit docker stop and maintenance. Engine restart policy handles crashes.
  if(c.state!=='running') {s.failures=0;return finish('not-running-no-forced-start');}
  if(c.restart!=='unless-stopped') result.warning='restart-policy-drift';
  const started=Date.parse(c.started);
  if(!Number.isFinite(started)||now-started<GRACE) {s.failures=0;return finish('startup-grace');}
  const deployment=d.deploying();
  if(deployment!==false) {s.failures=0;return finish(deployment===true?'deployment-in-progress':'deployment-check-unavailable');}
  if(d.probe()) {s.failures=0;return finish('healthy');}
  s.failures=Math.min(LIMIT,s.failures+1);
  if(s.failures<LIMIT) return finish('http-failure');
  if(now-s.lastRecovery<COOLDOWN) return finish('recovery-cooldown');
  // Recheck immediately before the only permitted mutation.
  if(d.probe()) {s.failures=0;return finish('recovered-without-restart');}
  const current=d.inspect();
  if(d.maintenance()||!current||current.id!==c.id||current.state!=='running'||d.deploying()!==false) {s.failures=0;return finish('recovery-recheck-skipped');}
  s.lastRecovery=d.now();s.failures=0;s.lastCheck=now;d.save(s); // Reserve cooldown even if outcome is uncertain.
  const ok=d.restart(c.id);result.action='restart-frontend';
  return finish(ok?'restart-requested':'restart-failed-or-uncertain');
}
async function httpStatus(url) {
  try {const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(8000)});await r.body?.cancel();return r.status;} catch {return 'unreachable';}
}
function proxyStatus(resource) {
  return new Promise(resolve=>{
    const req=require('node:https').get({hostname:'127.0.0.1',port:18443,path:resource,servername:'study.fileisland.co.kr',headers:{Host:'study.fileisland.co.kr'},timeout:8000},res=>{res.resume();resolve(res.statusCode);});
    req.on('error',()=>resolve('unreachable'));req.on('timeout',()=>{req.destroy();resolve('timeout');});
  });
}
function writeJson(file,value) {const tmp=file+'.tmp-'+process.pid;fs.writeFileSync(tmp,JSON.stringify(value,null,2)+'\n');fs.renameSync(tmp,file);}
async function main() {
  const dir=path.join(__dirname,'frontend-health');fs.mkdirSync(dir,{recursive:true});
  const lock=path.join(dir,'run.lock');
  try {fs.mkdirSync(lock);} catch(e) {
    if(e.code!=='EEXIST') throw e;
    if(Date.now()-fs.statSync(lock).mtimeMs<5*60*1000) {console.log('Frontend monitor already running');return;}
    // Preserve the stale lock as evidence, and allow a future scheduled run to recover.
    try {fs.renameSync(lock,lock+'.stale-'+Date.now());fs.mkdirSync(lock);} catch {console.log('Frontend monitor lock busy');return;}
  }
  try {
    const stateFile=path.join(dir,'state.json');
    const state=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile,'utf8')):freshState();
    const result=await cycle(state,{now:Date.now,maintenance:()=>fs.existsSync(path.join(dir,'maintenance')),inspect,probe,deploying,save:s=>writeJson(stateFile,s),restart:id=>/^[a-f0-9]{64}$/.test(id)&&command(['restart','--timeout','10',id]).ok});
    [result.publicLogin,result.publicVersion,result.publicApi]=await Promise.all(['/auth/login.html','/app-version.json','/api/v1/health'].map(p=>httpStatus('https://study.fileisland.co.kr'+p)));
    result.publicHealthy=[result.publicLogin,result.publicVersion,result.publicApi].every(s=>s===200);
    result.publicObservation=result.publicHealthy?'verified-from-host':([result.publicLogin,result.publicVersion,result.publicApi].every(s=>s==='unreachable')?'unreachable-from-host-not-a-service-diagnosis':'http-error-or-partial-reachability');
    [result.proxyLogin,result.proxyVersion,result.proxyApi]=await Promise.all(['/auth/login.html','/app-version.json','/api/v1/health'].map(proxyStatus));
    result.proxyHealthy=[result.proxyLogin,result.proxyVersion,result.proxyApi].every(s=>s===200);
    writeJson(path.join(dir,'latest.json'),result);
    // One file per day, bounded by the 1-minute task; retain evidence, never delete old logs.
    fs.appendFileSync(path.join(dir,result.time.slice(0,10)+'.jsonl'),JSON.stringify(result)+'\n');
    console.log(JSON.stringify(result));
    if(!result.proxyHealthy||!['healthy','startup-grace','deployment-in-progress','maintenance'].includes(result.status)) process.exitCode=1;
  } finally {fs.rmdirSync(lock);}
}
module.exports={cycle,freshState,validState,PROBE,TARGET,LIMIT,COOLDOWN};
if(require.main===module) main().catch(()=>{console.error('Frontend monitor failed; inspect local state and Docker availability. No broad recovery attempted.');process.exitCode=1;});
