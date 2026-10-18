import test from 'node:test';import assert from 'node:assert/strict';
const container={innerHTML:''};const handlers={};let cache={};
globalThis.location={hash:'#/'};
globalThis.localStorage={getItem(k){return cache[k]??null},setItem(k,v){cache[k]=v},removeItem(k){delete cache[k]}};
globalThis.window={addEventListener(k,f){handlers[k]=f},scrollTo(){},speechSynthesis:{cancel(){}}};
globalThis.document={querySelector(q){if(q==='#app')return container;if(q==='#announcer')return {textContent:''};return null},addEventListener(k,f){handlers['document-'+k]=f;},title:''};
await import('../src/app.js?flow');
const route=(x)=>{location.hash='#'+x;handlers.hashchange();};
const click=(action,dataset={})=>{handlers['document-click']({target:{closest:(s)=>s==='[data-action]'?{dataset:{action,...dataset}}:null},preventDefault(){}})};
const caseData=()=>JSON.parse(cache.anxin_case_web_v1).case;
test('模拟完整闭环：家属校对→比较→老人逐项→小结→历史',()=>{
 route('/family/extraction-review');assert.match(container.innerHTML,/检查文字/);
 click('check-demo-all');assert.equal(caseData().medications.filter(m=>m.transcriptionStatus==='transcription_checked').length,5);
 route('/family/compare');assert.match(container.innerHTML,/准备生成差异卡片/);
 click('run-compare');assert.equal(caseData().differences.length,3);
 route('/elder/overview');assert.match(container.innerHTML,/药单有变化/);
 route('/elder/changes/0');assert.match(container.innerHTML,/模拟药A/);
 route('/elder/summary');assert.match(container.innerHTML,/资料变化小结/);
 click('archive');assert.equal(JSON.parse(cache.anxin_case_web_v1).history.length,1);
 route('/elder/history');assert.match(container.innerHTML,/已保存的演示记录/);
 assert.equal(caseData().clinicalStatus,'not_verified_by_professional');
});
test('选择不完整演示时旧药不被当作停药',()=>{
 click('choose-scenario',{scenario:'missing'});
 route('/family/extraction-review');click('check-demo-all');route('/family/compare');click('run-compare');
 assert.equal(caseData().differences.find(d=>d.displayName==='模拟药B').kind,'missing_in_new');
});
test('语音关闭不影响主流程显示',()=>{click('choose-scenario',{scenario:'speechOff'});route('/elder/home');assert.match(container.innerHTML,/添加用药安排/);route('/elder/today');assert.match(container.innerHTML,/今天用药/);assert.equal(JSON.parse(cache.anxin_case_web_v1).settings.speech,false);});

test('老人无需家属可加载示例并独立完成查看与提醒',()=>{
 route('/elder/setup');assert.match(container.innerHTML,/自己填写/);
 click('sample-plan');assert.equal(location.hash,'#/elder/today');
 let data=JSON.parse(cache.anxin_case_web_v1);
 assert.equal(data.plan.length,2);
 assert.match(container.innerHTML,/模拟药A/);
 click('toggle-taken',{id:'sample-a'});
 data=JSON.parse(cache.anxin_case_web_v1);
 assert.ok(Object.keys(data.taken).some(k=>k.endsWith(':sample-a')));
 route('/elder/reminders');assert.match(container.innerHTML,/试听提醒/);
 click('edit-plan',{id:'sample-c'});assert.match(container.innerHTML,/修改用药安排/);
});
test('录入表单独立路径不依赖家属角色和模型密钥',()=>{
 route('/elder/edit-plan');assert.match(container.innerHTML,/药品名称/);assert.match(container.innerHTML,/每次数量/);assert.match(container.innerHTML,/服用时间/);
});
