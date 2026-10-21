import test from 'node:test';import assert from 'node:assert/strict';
const appNode={innerHTML:''};const listeners={};let stored={};
globalThis.location={hash:'#/'};
globalThis.localStorage={getItem(k){return stored[k]??null},setItem(k,v){stored[k]=v},removeItem(k){delete stored[k]}};
globalThis.window={addEventListener(k,cb){listeners[k]=cb},scrollTo(){},speechSynthesis:{cancel(){}}};
globalThis.document={querySelector(q){if(q==='#app')return appNode;if(q==='#announcer')return {textContent:''};return null;},addEventListener(k,cb){listeners[`document-${k}`]=cb;},title:''};
await import('../src/app.js');
const pages={
 '/':'今天做什么？', '/elder/home':'今天做什么？','/elder/start':'我可以帮您做什么','/elder/waiting':'请家人帮忙',
 '/elder/overview':'还没有核对结果','/elder/changes/0':'还没有核对结果','/elder/help':'别着急',
 '/elder/summary':'还没有核对结果','/elder/history':'过去的资料核对','/elder/settings':'怎样看着更舒服',
 '/elder/setup':'添加用药安排','/elder/edit-plan':'填写用药安排','/elder/today':'今天用药','/elder/reminders':'用药提醒',
 '/family/dashboard':'帮忙核对药单','/family/sources':'准备药单','/family/extraction-review':'检查文字',
 '/family/compare':'还差一步','/demo/scenarios':'选择一种演示情境'
};
for(const [route,expected] of Object.entries(pages))test(`路由渲染：${route}`,()=>{location.hash='#'+route;listeners.hashchange();assert.match(appNode.innerHTML,new RegExp(expected));assert.match(appNode.innerHTML,/仅供|虚构|演示/);assert.equal((appNode.innerHTML.match(/id="voice-task-button"/g)||[]).length,1);assert.equal((appNode.innerHTML.match(/data-action="dictate"/g)||[]).length,1);});
test('初始网页无需外部AI即可渲染',()=>{location.hash='#/';listeners.hashchange();assert.match(appNode.innerHTML,/landing-minimal/);});
