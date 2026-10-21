import test from 'node:test';import assert from 'node:assert/strict';
const handlers={},app={innerHTML:''},status={textContent:''},transcript={textContent:'',hidden:true},button={dataset:{},setAttribute(k,v){this[k]=v}};let stored;
const sessions=[];
class Recognition{constructor(){sessions.push(this)}start(){}abort(){this.onend?.()} }
globalThis.location={hash:'#/elder/setup'};
globalThis.localStorage={getItem(){return stored},setItem(k,v){stored=v}};
globalThis.window={SpeechRecognition:Recognition,speechSynthesis:{cancel(){}},scrollTo(){},addEventListener(k,f){handlers[k]=f}};
globalThis.document={querySelector(q){return q==='#app'?app:null},getElementById(id){return {'voice-task-button':button,'voice-task-status':status,'voice-task-transcript':transcript}[id]},addEventListener(k,f){handlers[k]=f}};
await import('../src/app.js?voice-dock');
const click=()=>handlers.click({target:{closest(q){return q==='[data-action]'?{dataset:{action:'dictate'}}:null}},preventDefault(){}});
test('在当前页面准备、开始与取消语音，无需跳转语音页',()=>{
 click();const r=sessions.at(-1);assert.equal(location.hash,'#/elder/setup');assert.equal(button.dataset.state,'preparing');
 r.onstart();assert.equal(button.dataset.state,'listening');assert.equal(button['aria-pressed'],'true');
 click();assert.equal(button['aria-pressed'],'false');assert.match(status.textContent,/已结束/);r.onstart();assert.notEqual(button.dataset.state,'listening');
});
test('权限拒绝显示可恢复提示，重试可在其他页面使用语音导航',()=>{
 click();sessions.at(-1).onerror({error:'not-allowed'});assert.equal(button.dataset.state,'error');assert.match(status.textContent,/麦克风未获允许/);
 click();sessions.at(-1).onresult({results:[[{transcript:'今天吃什么药'}]]});assert.equal(location.hash,'#/elder/today');assert.match(status.textContent,/已打开/);
});
test('未知指令保留当前页，转录用纯文本展示且不改服药安排',()=>{
 const before=JSON.parse(stored).plan;click();sessions.at(-1).onresult({results:[[{transcript:'<img src=x onerror=alert(1)>'}]]});
 assert.equal(location.hash,'#/elder/today');assert.equal(transcript.textContent,'<img src=x onerror=alert(1)>');assert.match(status.textContent,/没听懂/);assert.deepEqual(JSON.parse(stored).plan,before);
});
test('切换页面中止旧识别，旧结果不会把用户带走',()=>{
 click();const old=sessions.at(-1);location.hash='#/elder/reminders';handlers.hashchange();old.onresult({results:[[{transcript:'今天用药'}]]});assert.equal(location.hash,'#/elder/reminders');
});
test('不支持语音时保留按钮操作并说明原因',()=>{
 delete window.SpeechRecognition;click();assert.match(status.textContent,/不支持语音/);assert.equal(location.hash,'#/elder/reminders');
});
