import test from 'node:test';
import assert from 'node:assert/strict';
import {createCase} from '../src/domain.js';
// Tiny synthetic pixel fixtures test data binding, never represent drug packaging.
const photoA='data:image/png;base64,aW1hZ2UtYQ==',photoB='data:image/png;base64,aW1hZ2UtYg==';
let stored=JSON.stringify({case:createCase('normal'),plan:[{id:'a',name:'测试A',dose:'1份',time:'08:00',boxPhoto:photoA},{id:'b',name:'测试B',dose:'2份',time:'20:00',boxPhoto:photoB}]});
const node={innerHTML:''},handlers={},spoken=[];let failWrites=false;
globalThis.location={hash:'#/elder/today'};
globalThis.localStorage={getItem(){return stored},setItem(k,v){if(failWrites)throw new Error('quota');stored=v}};
globalThis.window={addEventListener(k,f){handlers[k]=f},scrollTo(){},speechSynthesis:{cancel(){},speak(u){spoken.push(u.text)}}};
globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
globalThis.document={querySelector(s){return s==='#app'?node:null},addEventListener(k,f){handlers[k]=f}};
globalThis.FormData=class{constructor(form){this.form=form}get(k){return this.form.values[k]}};
await import('../src/app.js?photo-flow');
const click=(action,id)=>handlers.click({target:{closest(s){return s==='[data-action]'?{dataset:{action,id}}:null}},preventDefault(){}});
const route=path=>{location.hash='#'+path;handlers.hashchange()};
const submit=values=>handlers.submit({target:{id:'solo-plan-form',values,matches(){return false}},preventDefault(){}});
test('药盒照片和逐项朗读绑定到选中的药物',()=>{
 assert.ok(node.innerHTML.includes(`src="${photoA}"`));assert.ok(node.innerHTML.includes(`src="${photoB}"`));
 click('read-plan','b');assert.match(spoken.at(-1),/20:00，测试B，每次2份/);assert.doesNotMatch(spoken.at(-1),/测试A/);
});
test('修改核对返回时保留照片和修改内容，确认前不改变安排',()=>{
 click('edit-plan','b');submit({name:'测试B',dose:'3份',time:'19:00'});
 assert.equal(location.hash,'#/elder/confirm-plan');assert.equal(JSON.parse(stored).plan[1].dose,'2份');
 route('/elder/edit-plan');assert.match(node.innerHTML,/value="3份"/);assert.ok(node.innerHTML.includes(photoB));
 submit({name:'测试B',dose:'3份',time:'19:00'});click('confirm-plan');
 const plan=JSON.parse(stored).plan;assert.equal(plan.find(x=>x.id==='b').boxPhoto,photoB);assert.equal(plan.find(x=>x.id==='b').dose,'3份');assert.equal(plan.find(x=>x.id==='a').boxPhoto,photoA);
});
test('新安排不继承上一药盒，缺照片不能进入保存核对',()=>{
 click('new-plan');assert.doesNotMatch(node.innerHTML,/src="data:image/);assert.match(node.innerHTML,/type="time" name="time" value=""/);
 submit({name:'测试C',dose:'1份',time:'12:00'});assert.equal(location.hash,'#/elder/edit-plan');assert.equal(JSON.parse(stored).plan.length,2);
});
test('存储失败时不声称保存成功，允许保留草稿重试',()=>{
 click('edit-plan','b');submit({name:'测试B',dose:'4份',time:'19:00'});failWrites=true;click('confirm-plan');
 assert.equal(location.hash,'#/elder/confirm-plan');assert.equal(JSON.parse(stored).plan.find(x=>x.id==='b').dose,'3份');
 failWrites=false;click('confirm-plan');assert.equal(location.hash,'#/elder/today');assert.equal(JSON.parse(stored).plan.find(x=>x.id==='b').dose,'4份');
});
