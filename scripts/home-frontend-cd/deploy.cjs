'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const {writeControls}=require('./verify-artifact.cjs');
const IMAGE='nginx/nginx-unprivileged@sha256:74804a97de25921ce78f9e87f10ba5961eced57e2a74fd5294dfb94958436057';
function deploy(artifact,sha,run,configFile){
  if(!/^[a-f0-9]{40}$/.test(sha)||!/^\d{1,15}$/.test(run))throw Error('Invalid CI identity');
  const config=JSON.parse(fs.readFileSync(configFile,'utf8'));
  if(config.volume!=='fileisland-web-releases'||config.network!=='fileisland-npm-review'||config.healthOrigin!=='http://fileisland-web-candidate:8080')throw Error('Unexpected deployment target');
  artifact=fs.realpathSync(artifact);const controlRoot=path.resolve(config.controlRoot);fs.mkdirSync(controlRoot,{recursive:true});
  const control=fs.mkdtempSync(path.join(controlRoot,'verify-')),verified=writeControls(artifact,sha,control),script=path.join(__dirname,'release.sh');
  if([artifact,control,script].some(p=>p.includes(',')))throw Error('Comma in Docker mount path rejected');
  const args=['run','--rm','--pull=never','--name','fileisland-web-deploy-'+run,'--user','0:0','--network',config.network,'--read-only','--tmpfs','/tmp:rw,size=16m',
    '--mount','type=volume,source='+config.volume+',target=/releases',
    '--mount','type=bind,source='+artifact+',target=/incoming,readonly',
    '--mount','type=bind,source='+control+',target=/control,readonly',
    '--mount','type=bind,source='+script+',target=/controller/release.sh,readonly',
    '--env','HEALTH_ORIGIN='+config.healthOrigin,'--entrypoint','/bin/sh',IMAGE,'/controller/release.sh',sha,run];
  // Fail closed if installation has not explicitly seeded the Linux release volume.
  const inspected=spawnSync('docker',['volume','inspect',config.volume],{encoding:'utf8'});if(inspected.status!==0)throw Error('Approved release volume is not installed');
  const result=spawnSync('docker',args,{encoding:'utf8',timeout:10*60*1000});
  fs.writeFileSync(path.join(control,'result.json'),JSON.stringify({sha,run,manifestSha256:verified.manifestSha256,status:result.status,stdout:result.stdout,stderr:result.stderr},null,2));
  if(result.error||result.status!==0)throw Error('Deployment failed; inspect controller result and release journal');
  if(!result.stdout.includes('DEPLOYED '+sha))throw Error('Missing deployment confirmation');
  console.log(JSON.stringify({deployed:sha,run,files:verified.entries.length,manifestSha256:verified.manifestSha256}));
}
if(require.main===module){try{const[a,sha,run,config]=process.argv.slice(2);if(!a||!config)throw Error('Expected artifact SHA run config');deploy(a,sha,run,config);}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={deploy};
