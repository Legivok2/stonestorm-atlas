/* Opcionális, ideiglenesen telepített jsdom. Nem valódi böngészős/vizuális teszt. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {JSDOM,VirtualConsole}=await import(pathToFileURL(path.join(root,'.integration/qa/node_modules/jsdom/lib/api.js')));
const errors=[];
const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
const testBase=process.env.ATLAS_TEST_BASE_URL??'http://localhost:4173/';
const prefix=new URL(testBase).pathname;
const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:testBase,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
const w=dom.window,d=w.document;
w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
w.HTMLElement.prototype.scrollIntoView=function(){};
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
const errorsCheck=()=>{if(errors.length)throw errors[0];};
let validate=()=>{};
const go=async hash=>{w.location.hash=hash;await new Promise(r=>setTimeout(r,0));errorsCheck();validate();};
const input=(selector,v,type='input')=>{const el=d.querySelector(selector);assert(el,selector);el.value=String(v);el.dispatchEvent(new w.Event(type,{bubbles:true}));errorsCheck();};
try{
  for(const file of ['content','main','atlas-data','atlas-math','image-data','image-store','planner-model','atlas-features','atlas'])w.eval(fs.readFileSync(path.join(root,'js',file+'.js'),'utf8'));
  errorsCheck();
  const db=w.STONESTORM_ATLAS;
  const allowedPages=new Set([...d.querySelectorAll('[data-atlas-page]')].map(a=>a.dataset.atlasPage));
  const kinds={image:w.STONESTORM_IMAGES.entries,item:db.items,set:db.sets,pet:db.pets,mount:db.mounts,map:db.maps,mob:db.mobs,boss:db.bosses,dungeon:db.dungeons,class:db.classes,material:db.economy.stackables,research:db.research,building:db.guild.buildings.map(x=>({id:x.kind})),skill:Object.keys(db.petSkills).map(id=>({id}))};
  const inspected=new Set();
  validate=()=>{
    for(const a of d.querySelectorAll('a[href^="#"]')){
      if(inspected.has(a.hash))continue;
      const parts=a.hash.slice(1).split('?')[0].split('/').map(decodeURIComponent);
      if(parts[0]==='atlas'){assert(!parts[1]||allowedPages.has(parts[1]),a.hash);if(parts[2])assert(kinds[parts[2]]?.some(x=>x.id===parts[3]),a.hash);}
      else assert(d.getElementById(parts[0]),'Hibás belső cél: '+a.hash);
      inspected.add(a.hash);
    }
    for(const img of d.querySelectorAll('img[src]')){const pathname=new URL(img.src).pathname;assert(pathname.startsWith(prefix),img.src);assert(fs.existsSync(path.join(root,pathname.slice(prefix.length))),img.src);}
  };
  validate();
  for(const page of ['overview','equipment','sets','pets','mounts','world','guild','home','mechanics','classes','materials','sources']){await go('#atlas/'+page);assert(d.querySelector('#atlas-screen').textContent.trim().length>100,page);}
  await go('#atlas/equipment');
  assert.equal(d.querySelectorAll('.atlas-card').length,24);
  d.querySelector('[data-pagination="1"]').click();assert.match(d.querySelector('#atlas-result-status').textContent,/2\. oldal/);
  input('#atlas-class','mage_blade','change');input('#atlas-slot','weapon','change');input('#atlas-max-level',15,'change');
  assert([...d.querySelectorAll('.atlas-card-meta')].every(x=>x.textContent.includes('Fegyver')));
  input('#atlas-sort','levelDesc','change');
  const itemLevels=[...d.querySelectorAll('.atlas-card')].map(a=>db.items.find(x=>x.id===decodeURIComponent(a.hash.split('/').at(-1))).level);assert.deepEqual(itemLevels,[...itemLevels].sort((a,b)=>b-a));
  input('#atlas-search','rozsdas');assert.match(d.querySelector('#atlas-screen').textContent,/Rozsdás/);
  input('#atlas-search-category','equipment','change');assert(d.querySelectorAll('.atlas-card').length>0);
  input('#atlas-search','zzzznincstalalat');assert(d.querySelector('#atlas-reset'));d.querySelector('#atlas-reset').click();
  await go('#atlas/pets');input('#atlas-rarity','unique','change');assert.equal(d.querySelectorAll('.atlas-card').length,4);
  await go('#atlas/world');for(const tab of ['maps','bosses','mobs','dungeons']){d.querySelector(`[data-world="${tab}"]`).click();assert(d.querySelectorAll('.atlas-card').length>0);}
  await go('#atlas/guild');
  assert.match(d.querySelector('#atlas-guild-output').textContent,/2.?200 VÉ/);
  input('#atlas-guild-form [name="remaining"]',3.7);assert.match(d.querySelector('#atlas-guild-output').textContent,/400 VÉ/);
  input('#atlas-guild-form [name="current"]',12);assert.match(d.querySelector('#atlas-guild-output').textContent,/Adj meg/);
  input('#atlas-guild-form [name="current"]',4);input('#atlas-guild-form [name="target"]',6);assert.match(d.querySelector('#atlas-guild-output').textContent,/800 VÉ/);
  await go('#atlas/mounts');assert.match(d.querySelector('#atlas-travel-output').textContent,/90 perc/);
  await go('#atlas/mechanics');input('[name="budget"]',20);input('[name="xp0"]',600);input('[name="energy0"]',6);input('[name="time0"]',12);assert.match(d.querySelector('#atlas-xp-output').textContent,/1.?800/);
  const recordGroups=[['equipment','item',db.items],['sets','set',db.sets],['pets','pet',db.pets],['mounts','mount',db.mounts],['world','map',db.maps],['world','mob',db.mobs],['world','boss',db.bosses],['world','dungeon',db.dungeons],['classes','class',db.classes],['materials','material',db.economy.stackables],['home','research',db.research],['guild','building',db.guild.buildings.map(x=>({...x,id:x.kind}))],['pets','skill',Object.keys(db.petSkills).map(id=>({id}))]];
  let details=0;
  for(const [page,kind,list] of recordGroups)for(const x of list){await go(`#atlas/${page}/${kind}/${encodeURIComponent(x.id)}`);assert(d.querySelector('#atlas-detail').open,kind+' '+x.id);const text=d.querySelector('#atlas-detail-body').textContent;assert(!text.includes('Nem található adatlap'),kind+' '+x.id);assert(!/undefined|NaN/.test(text),kind+' '+x.id+' hibás érték');details++;}
  d.querySelector('#atlas-detail-close').click();await new Promise(r=>setTimeout(r,0));assert(!d.querySelector('#atlas-detail').open);
  // A régi interaktív funkciók is ugyanabban a dokumentumban működnek.
  const compare=d.querySelectorAll('.compare-button');compare[0].click();compare[1].click();assert(d.querySelector('#comparison-content table'));
  const daily=d.querySelector('#daily-checklist input');daily.click();assert.match(d.querySelector('#daily-counter').textContent,/1\s*\//);
  assert(w.localStorage.getItem('stonestorm-hu-guide-v1').includes(daily.value));
  d.querySelector('#menu-toggle').click();assert.equal(d.querySelector('#menu-toggle').getAttribute('aria-expanded'),'true');d.querySelector('#main-nav a').click();assert.equal(d.querySelector('#menu-toggle').getAttribute('aria-expanded'),'false');
  const image=d.querySelector('a[data-media-id]');image.click();assert(d.querySelector('#image-lightbox').open);d.querySelector('#lightbox-close').click();
  // Minden, az összes adatlap során megjelenített kép és hivatkozás helyi.
  for(const img of d.querySelectorAll('img[src]'))assert(fs.existsSync(path.join(root,new URL(img.src).pathname.slice(prefix.length))),img.src);
  assert.equal(d.querySelectorAll('script[src^="http"]').length,0);
  errorsCheck();console.log(`DOM smoke: 12 kategória, ${details} adatlap, keresés/szűrés/rendezés, lapozás, kalkulátorok és a régi kalauz funkciói rendben.`);
}finally{w.close();}
