import test from 'node:test';import assert from 'node:assert/strict';
import {PACKAGE_EXAMPLES} from '../src/package-examples.js';
const app={innerHTML:''},handlers={};let stored;
globalThis.location={hash:'#/elder/examples'};
globalThis.localStorage={getItem(){return stored},setItem(k,v){stored=v}};
globalThis.window={addEventListener(k,f){handlers[k]=f},scrollTo(){},speechSynthesis:{cancel(){}}};
globalThis.document={querySelector(q){return q==='#app'?app:null},addEventListener(k,f){handlers[k]=f}};
await import('../src/app.js?package-examples');
const route=path=>{location.hash='#'+path;handlers.hashchange()};
const choose=id=>handlers.click({target:{closest(q){return q==='[data-action]'?{dataset:{action:'use-package-example',exampleId:id}}:null}},preventDefault(){}});
test('五张用户提供的图片均有独立示例身份且无自动服用安排',()=>{
 assert.equal(PACKAGE_EXAMPLES.length,5);assert.equal(new Set(PACKAGE_EXAMPLES.map(x=>x.id)).size,5);
 for(const x of PACKAGE_EXAMPLES){assert.ok(x.imageData.startsWith('data:image/jpeg;base64,'));assert.equal(x.dose,'');assert.equal(x.time,'');assert.equal(x.recognitionMode,'curated_example');}
});
test('示例列表和结果明确为演示，不写入今日用药',()=>{
 assert.match(app.innerHTML,/识别演示/);assert.equal((app.innerHTML.match(/class="package-example"/g)||[]).length,5);
 route('/elder/package/amoxicillin');assert.match(app.innerHTML,/示例识别结果/);assert.match(app.innerHTML,/规格不是每次用量/);assert.equal(JSON.parse(stored).plan.length,0);
});
test('确认名称只带入照片和药名，规格不转成剂量或时间',()=>{
 choose('amoxicillin');const data=JSON.parse(stored);assert.equal(data.draftPlan.name,'阿莫西林胶囊');assert.equal(data.draftPlan.dose,'');assert.equal(data.draftPlan.time,'');assert.equal(data.plan.length,0);assert.match(app.innerHTML,/name="dose" placeholder="按药单填写" value=""/);
});
test('同名维C的不同包装不静默合并',()=>{
 choose('vitamin-c-red');const first=JSON.parse(stored).draftPlan;choose('vitamin-c-orange');const second=JSON.parse(stored).draftPlan;
 assert.equal(first.name,second.name);assert.notEqual(first.demoCaseId,second.demoCaseId);assert.notEqual(first.boxPhoto,second.boxPhoto);assert.equal(JSON.parse(stored).plan.length,0);
});
test('儿童包装提示使用人和完整名称核对，不推算儿童用量',()=>{
 route('/elder/package/vitamin-c-child');assert.match(app.innerHTML,/核对完整名称和使用人/);choose('vitamin-c-child');assert.equal(JSON.parse(stored).draftPlan.dose,'');
});
test('未知示例不返回上一个包装结果',()=>{
 route('/elder/package/missing');assert.match(app.innerHTML,/没有找到这个示例/);assert.doesNotMatch(app.innerHTML,/阿莫西林胶囊/);
});
