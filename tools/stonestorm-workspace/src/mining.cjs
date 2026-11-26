'use strict';
const fs=require('node:fs');const path=require('node:path');
const keys=['mine','smelt','craft','master'];
// This contract reads the ordinary DOM only; no React internals, game API or
// gameplay button is accessed. Unknown/ambiguous tab contracts fail closed.
function inspect(key,choose=false) {
  const windows=[...document.querySelectorAll('.mine-stage .mine-window')];
  if(windows.length!==1)return {valid:false,reason:'waiting',online:navigator.onLine};
  const win=windows[0],lists=win.querySelectorAll('.mine-tabs[role="tablist"]');
  if(lists.length!==1)return {valid:false,reason:'changed'};
  const tabs=[...lists[0].querySelectorAll('button[data-mine-tab][role="tab"]')],expected=['mine','smelt','craft','master'];
  const bodies=win.querySelectorAll('.mine-window__body[role="tabpanel"]'),body=bodies[0];
  if(bodies.length!==1||tabs.length!==4||!body?.id||new Set(tabs.map(b=>b.id)).size!==4||expected.some(k=>tabs.filter(b=>b.dataset.mineTab===k).length!==1)||tabs.some(b=>b.type!=='button'||!b.id||b.getAttribute('aria-controls')!==body.id)||!expected.includes(key))return {valid:false,reason:'changed'};
  const button=tabs.find(b=>b.dataset.mineTab===key);
  if(button.disabled)return {valid:false,reason:'disabled'};
  if(choose&&button.getAttribute('aria-selected')!=='true')button.click();
  const active=tabs.filter(b=>b.getAttribute('aria-selected')==='true');
  if(active.length!==1||body.getAttribute('aria-labelledby')!==active[0].id)return {valid:false,reason:'changed'};
  return {valid:true,selected:active[0].dataset.mineTab,online:navigator.onLine};
}
const script=(key,choose)=>'('+inspect.toString()+')('+JSON.stringify(key)+','+!!choose+')';
const css=fs.readFileSync(path.join(__dirname,'mining.css'),'utf8');
module.exports={keys,inspect,script,css};
