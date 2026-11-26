'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {WorkspaceModeManager}=require('../src/mode-manager.cjs');
function fixture(overrides={}) {
 const primary={id:1,session:{}},panels=[primary],closed=[];let peak=1,created=1;
 const m=new WorkspaceModeManager({panels,captureReturn:async()=>({url:'https://stonestorm.gg/character',index:0}),enterMining:async()=>{},leaveMining:async()=>{},
  createPanel:()=>{panels.push({id:++created,session:primary.session});peak=Math.max(peak,panels.length);},destroyPanel:async p=>{await Promise.resolve();closed.push(p.id);},onChange:()=>{},...overrides});
 return {m,panels,primary,closed,peak:()=>peak};
}
test('Repeated identical mode requests reuse the primary and never create a fifth game',async()=>{
 const f=fixture();await Promise.all(Array.from({length:20},()=>f.m.setMode('MINING')));
 assert.equal(f.panels.length,4);assert.equal(f.peak(),4);assert.equal(f.m.primary,f.primary);
 await Promise.all(Array.from({length:20},()=>f.m.setMode('GAME')));
 assert.equal(f.panels.length,1);assert.equal(f.closed.length,3);assert.equal(f.m.primary,f.primary);assert.equal(f.m.retiring.size,0);
});
test('The most recent request during an asynchronous transition wins without duplicates',async()=>{
 let enter,release;const started=new Promise(r=>enter=r),gate=new Promise(r=>release=r);
 const f=fixture({enterMining:async()=>{enter();await gate;}});
 const pending=f.m.setMode('MINING');await started;
 const more=[f.m.setMode('GAME'),f.m.setMode('MINING'),f.m.setMode('GAME')];release();await Promise.all([pending,...more]);
 assert.equal(f.m.mode,'GAME');assert.equal(f.panels.length,1);assert.equal(f.peak(),4);assert.equal(f.closed.length,3);
});
test('An allocation failure closes partially created games and restores a usable primary',async()=>{
 let restored=0;const f=fixture({leaveMining:async()=>restored++});const original=f.m.hooks.createPanel;
 f.m.hooks.createPanel=()=>{if(f.panels.length===2)throw Error('allocation failed');original();};
 await assert.rejects(f.m.setMode('MINING'),/allocation/);assert.equal(f.m.mode,'GAME');assert.equal(f.panels.length,1);assert.equal(f.closed.length,1);assert.equal(restored,1);
 f.m.hooks.createPanel=original;await f.m.setMode('MINING');assert.equal(f.panels.length,4);
});
test('Disposal during a transition prevents late secondary creation',async()=>{
 let captured,release;const started=new Promise(r=>captured=r),gate=new Promise(r=>release=r);
 const f=fixture({captureReturn:async()=>{captured();await gate;return null;}}),pending=f.m.setMode('MINING');await started;f.m.dispose();release();await pending;
 assert.equal(f.panels.length,1);assert.equal(f.m.transitioning,false);assert.equal(await f.m.setMode('MINING'),false);
});
