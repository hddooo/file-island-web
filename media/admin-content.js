(function(root){'use strict';
function el(tag,text,parent){var node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(parent)parent.appendChild(node);return node;}
async function mountVocabulary(host,api,options){
 var owner=api.state().ownerId,id=root.crypto.randomUUID(),busy=false;
 function valid(){return host.isConnected&&options.isCurrent()&&api.state().signedIn&&api.state().ownerId===owner;}
 try{await api.portal('GET','/api/v1/ops');var initial=await api.toeicNotes();if(!valid())return;if(initial.canManage!==true){el('p','이 관리자 계정에는 단어장 편집 권한이 없습니다.',host);return;}
 el('h2','단어 추가',host);el('p',initial.visibility==='members'?'저장한 단어·뜻·예문은 로그인한 회원 단어장에 공개됩니다.':'기존 단어장에 단어를 추가합니다.',host);
 var form=el('form',undefined,host),inputs={};form.className='admin-word-form';
 [['expression','영어 단어 · 표현',300],['meaning','뜻',6000],['example','영어 예문',6000],['translation','예문 해석',6000],['partOfSpeech','품사',30]].forEach(function(f){var label=el('label',f[1],form),input=el(f[2]>300?'textarea':'input',undefined,label);input.name=f[0];input.maxLength=f[2];input.required=f[0]==='expression'||f[0]==='meaning';if(input.tagName==='TEXTAREA')input.rows=3;inputs[f[0]]=input;});
 var save=el('button','단어장에 저장',form);save.type='submit';var message=el('p','',form);message.setAttribute('role','status');
 form.onsubmit=async function(event){event.preventDefault();if(busy||!valid())return;busy=true;save.disabled=true;var payload={part:'unclassified',revision:0,synonyms:[],structure:'',confusion:'',sourceText:'',sourceReference:''};Object.keys(inputs).forEach(function(k){payload[k]=inputs[k].value.trim();});
 try{await api.portal('GET','/api/v1/ops');if(!valid())return;var latest=await api.toeicNotes();if(!valid())return;var saved=(latest.notes||[]).find(function(n){return n.id===id;});if(saved){message.textContent='앞서 저장된 단어를 확인했습니다.';id=root.crypto.randomUUID();return;}if(latest.canManage!==true){message.textContent='단어장 편집 권한이 없습니다.';return;}
 var response=await api.saveToeicNote(id,payload);if(!valid())return;if(!response||!response.note||response.note.id!==id)throw Error('unconfirmed');id=root.crypto.randomUUID();form.reset();message.textContent='단어장에 저장했습니다.';
 }catch(error){if(valid())message.textContent=error&&error.code==='duplicate_expression'?'같은 표현이 이미 있습니다. 기존 단어는 변경하지 않았습니다.':'저장을 확인하지 못했습니다. 입력은 유지됩니다. 다시 저장하면 먼저 기존 저장 여부를 확인합니다.';}finally{if(valid()){busy=false;save.disabled=false;}}};
 }catch(error){if(valid())options.onError(error);}
}
root.HanqAdminContent={mountVocabulary:mountVocabulary};
})(window);
