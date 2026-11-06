import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {JSDOM,VirtualConsole}=await import(pathToFileURL(path.join(root,'.integration/qa/node_modules/jsdom/lib/api.js')));
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
const testBase=process.env.ATLAS_TEST_BASE_URL??'http://localhost:4173/';
const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:testBase,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
const w=dom.window,d=w.document;
w.matchMedia=()=>({matches:false,addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(){};
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
const check=()=>{if(errors.length)throw errors[0];};
const go=async hash=>{w.location.hash=hash;await new Promise(r=>setTimeout(r,0));check();};
const input=(id,value,event='change')=>{const el=d.querySelector(id);assert(el,id);el.value=String(value);el.dispatchEvent(new w.Event(event,{bubbles:true}));check();};
function sibling(saved,blocked=false){
  const instance=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:testBase+'#atlas/planner',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
  const win=instance.window;
  win.matchMedia=()=>({matches:false,addEventListener(){}});win.HTMLElement.prototype.scrollIntoView=function(){};
  win.HTMLDialogElement.prototype.showModal=function(){this.open=true;};win.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new win.Event('close'));};
  if(blocked)Object.defineProperty(win,'localStorage',{get(){throw new Error('Storage blocked for test');}});
  else if(saved)win.localStorage.setItem('stonestorm-atlas-builds-v1',saved);
  for(const name of ['content','main','atlas-data','atlas-math','image-data','image-store','planner-model','atlas-features','atlas'])win.eval(fs.readFileSync(path.join(root,'js',name+'.js'),'utf8'));
  return win;
}
try{
  for(const name of ['content','main','atlas-data','atlas-math','image-data','image-store','planner-model','atlas-features','atlas'])w.eval(fs.readFileSync(path.join(root,'js',name+'.js'),'utf8'));
  check();
  await go('#atlas/gallery');assert.equal(d.querySelectorAll('.catalog-card').length,24);
  for(const category of w.STONESTORM_IMAGES.categories){input('#catalog-category',category.id);assert(d.querySelectorAll('.catalog-card').length>0,category.id);}
  input('#catalog-category','weapons');input('#catalog-query','w_ninja_l50','input');assert.equal(d.querySelectorAll('.catalog-card').length,1);
  d.querySelector('.catalog-card').click();await new Promise(r=>setTimeout(r,20));check();assert(d.querySelector('#atlas-detail').open);assert.match(d.querySelector('#atlas-detail-body').textContent,/Jégagyar|w_ninja_l50/);
  d.querySelector('#atlas-detail-close').click();await new Promise(r=>setTimeout(r,20));
  input('#catalog-query','','input');input('#catalog-category','all');input('#catalog-status','unknown');assert([...d.querySelectorAll('.catalog-copy .atlas-chip')].every(x=>x.textContent==='Ismeretlen'));
  await go('#atlas/compare');assert.equal(d.querySelectorAll('[data-viewer-pick]').length,17);
  d.querySelectorAll('[data-viewer-pick]')[0].click();d.querySelectorAll('#viewer-images [data-viewer-pick]')[1].click();assert.equal(d.querySelectorAll('.viewer-panels article').length,2);assert(d.querySelector('#viewer-comparison table'));
  input('#viewer-mode','appearance');assert.equal(d.querySelectorAll('.viewer-panels article').length,0);
  for(const cls of ['warrior','ninja','shaman','mage_blade'])for(const gender of ['male','female']){input('#viewer-class',cls);input('#viewer-gender',gender);assert(d.querySelectorAll('#viewer-images .catalog-card').length>0,cls+gender);}
  await go('#atlas/compare?item=w_ninja_l50');assert.equal(d.querySelectorAll('.viewer-panels article').length,1);
  await go('#atlas/compare?item=w_ninja_set_m1');assert.match(d.querySelector('.viewer-panels').textContent,/Határcsősz fegyver/);assert.match(d.querySelector('.viewer-panels').textContent,/11\. követelményszint/);
  await go('#atlas/planner');
  assert(d.querySelector('#planner-level'));
  input('#planner-class','ninja');input('#planner-level',60);
  input('#planner-family','m1');d.querySelector('#planner-apply-set').click();check();
  assert.match(d.querySelector('.planner-bonus-panel').textContent,/Aktív · 2 db/);
  input('#planner-pet','pet_wolf');input('#planner-pet-level',10);input('#planner-trait-rank',5);input('#planner-mount','pony');
  input('[data-planner-plus="weapon"]',9);
  assert(d.querySelector('.planner-character-image img').src.includes('downloaded/body')||d.querySelector('.planner-character-image img').src.includes('Stonestorm_files'));
  input('#planner-name','Nindzsa teszt <b>','input');d.querySelector('#planner-save').click();check();
  const saved=JSON.parse(w.localStorage.getItem('stonestorm-atlas-builds-v1'));assert.equal(saved.builds.length,1);assert.equal(saved.builds[0].build.gear.weapon.plus,9);
  const fresh=sibling(JSON.stringify(saved));try{const doc=fresh.document;assert.equal(doc.querySelector('#planner-saved').options.length,2);const chooser=doc.querySelector('#planner-saved');chooser.value=saved.builds[0].id;chooser.dispatchEvent(new fresh.Event('change',{bubbles:true}));doc.querySelector('#planner-load').click();assert.equal(doc.querySelector('#planner-pet').value,'pet_wolf');assert.equal(doc.querySelector('#planner-name').value,'Nindzsa teszt <b>');}finally{fresh.close();}
  const blocked=sibling(null,true);try{blocked.document.querySelector('#planner-save').click();assert.match(blocked.document.querySelector('#planner-message').textContent,/tárhelye nem írható/);}finally{blocked.close();}
  d.querySelector('#planner-copy').click();d.querySelector('#planner-compare').click();check();assert.match(d.querySelector('#atlas-screen').textContent,/Build A és B/);
  d.querySelector('#planner-share-button').click();const shared=d.querySelector('#planner-share').value;assert(shared.includes('#atlas/planner?build='));
  d.querySelector('#planner-new').click();assert.equal(d.querySelector('#planner-level').value,'1');
  d.querySelector('#planner-load').click();assert.equal(d.querySelector('#planner-level').value,'60');
  await go(new URL(shared).hash);assert.equal(d.querySelector('#planner-pet').value,'pet_wolf');
  input('#planner-level',1);assert.equal(d.querySelector('#planner-pet').value,'');assert.equal(d.querySelectorAll('[data-planner-plus]').length,0);assert.match(d.querySelector('#planner-message').textContent,/eltávolítva/);
  await go('#atlas/planner?kind=item&add=w_ninja_l50');assert.equal(d.querySelector('#planner-level').value,'50');assert.equal(d.querySelector('#planner-class').value,'ninja');
  await go('#atlas/planner?build=%7Bnot-json');assert.match(d.querySelector('#planner-message').textContent,/nem érvényes JSON/);
  d.querySelector('#planner-delete').click();assert.equal(JSON.parse(w.localStorage.getItem('stonestorm-atlas-builds-v1')).builds.length,0);
  check();console.log('Új funkciók DOM-tesztje: 26 képkategória, keresés, képnézet, 4 kaszt × 2 nem, kétképes összehasonlító, Planner-korlátok, szettek, +fejlesztés, A/B, mentés/betöltés/törlés és megosztott build rendben.');
}finally{w.close();}
