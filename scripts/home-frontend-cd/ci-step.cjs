'use strict';
const fs=require('node:fs'),path=require('node:path');
const MAIN='https://api.github.com/repos/hddooo/file-island-web/git/ref/heads/main';
async function run(mode,env=process.env,deps={}){
  if(!['gate','deploy'].includes(mode))throw Error('Expected gate or deploy');
  const sha=env.FE_EXPECTED_SHA,runId=env.FE_SOURCE_RUN;
  if(!/^[a-f0-9]{40}$/.test(sha||'')||!/^\d{1,15}$/.test(runId||''))throw Error('Invalid CI identity');
  if(!env.GH_TOKEN)throw Error('Missing GitHub job token');
  const request=deps.fetch||fetch,append=deps.append||fs.appendFileSync;
  const response=await request(MAIN,{headers:{Authorization:'Bearer '+env.GH_TOKEN,Accept:'application/vnd.github+json','User-Agent':'file-island-web-cd'},redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('GitHub main lookup failed: HTTP '+response.status);
  const ref=await response.json();
  if(!/^[a-f0-9]{40}$/.test(ref?.object?.sha||''))throw Error('Invalid GitHub main response');
  const ready=ref.object.sha===sha;
  if(mode==='gate'){
    if(!env.GITHUB_OUTPUT)throw Error('Missing GitHub output file');
    append(env.GITHUB_OUTPUT,'ready='+ready+'\n','utf8');
    if(!ready&&env.GITHUB_STEP_SUMMARY)append(env.GITHUB_STEP_SUMMARY,'Skipped stale frontend CI commit.\n','utf8');
    return ready;
  }
  if(!ready)throw Error('Main advanced during artifact download; deployment skipped');
  if(!env.FE_ARTIFACT)throw Error('Missing artifact path');
  // Always invoke the installed controller; downloaded artifacts are data only.
  const deploy=deps.deploy||require('./deploy.cjs').deploy;
  await deploy(env.FE_ARTIFACT,sha,runId,path.join(__dirname,'config.json'));
  return true;
}
if(require.main===module)run(process.argv[2]).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={run,MAIN};
