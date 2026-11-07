
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),Api=require('../media/api-client.js'),{allowed}=require('./build-static-site.cjs');
(async()=>{const map=new Map(),calls=[],storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
const api=Api.create({base:'https://membership.example.test',storage,locks:null,fetch:async(url,init)=>{calls.push({url,init});return {ok:true,status:201,text:async()=>JSON.stringify({status:'pending'})};}});
const result=await api.signup('synthetic@example.test','synthetic-password','Synthetic');
assert.equal(result.status,'pending');assert.equal(api.state().signedIn,false);assert.equal(calls.length,1);assert.equal(calls[0].init.headers['X-HanQ-CSRF'],'1');assert.equal(map.size,0);
assert.equal(allowed('auth/login.html'),true);assert.equal(allowed('auth/login.js'),true);assert.equal(allowed('auth/private.json'),false);assert.equal(allowed('auth/login.html/private'),false);
const publicPath=require('./home-frontend-cd/verify-artifact.cjs').publicPath;assert.equal(publicPath('auth/login.html'),true);assert.equal(publicPath('auth/login.js'),true);assert.equal(publicPath('auth/private.json'),false);
const conf=fs.readFileSync(require('node:path').join(__dirname,'../deployment/member-access-nginx.conf'),'utf8');
assert.match(conf,/auth_request \/__member_check/);assert.match(conf,/proxy_ssl_verify on/);assert.match(conf,/private, no-store/);assert.doesNotMatch(conf,/public, max-age/);
assert.match(conf,/location = \/__member_check \{\s*internal/);assert.match(conf,/location \^~ \/media\/ \{ root \/srv\/releases\/\$asset_release;/);
console.log('PASS pending signup no session/profile/token-storage, auth asset allowlist and static gate contract');
})().catch(e=>{console.error(e);process.exitCode=1;});
