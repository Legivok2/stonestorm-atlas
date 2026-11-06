/* Opcionális jsdom-ellenőrzés; nem valódi böngészős/vizuális teszt. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {root} from '../scripts/publication-plan.mjs';
const {JSDOM,VirtualConsole}=await import(pathToFileURL(path.join(root,'.integration/qa/node_modules/jsdom/lib/api.js')));
const base=process.env.GUIDE_TEST_BASE_URL??'https://example.test/stonestorm-atlas/';
const live=!!process.env.GUIDE_TEST_BASE_URL;
const read=async file=>{
  if(!live)return fs.readFileSync(path.join(root,'dist',file),'utf8');
  const response=await fetch(new URL(file,base));assert.equal(response.status,200,file);return response.text();
};
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
const dom=new JSDOM(await read('index.html'),{url:base,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
const w=dom.window,d=w.document;
w.matchMedia=()=>({matches:false,addEventListener(){}});
w.HTMLElement.prototype.scrollIntoView=function(){};
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
try{
  for(const script of d.querySelectorAll('script[src]'))w.eval(await read(script.getAttribute('src')));
  const compare=d.querySelectorAll('.compare-button');compare[0].click();compare[1].click();assert(d.querySelector('#comparison-content table'));
  const daily=d.querySelector('#daily-checklist input');daily.click();assert.match(d.querySelector('#daily-counter').textContent,/1\s*\//);
  assert(w.localStorage.getItem('stonestorm-hu-guide-v1').includes(daily.value));
  const search=d.querySelector('#knowledge-search');search.value='energia';search.dispatchEvent(new w.Event('input',{bubbles:true}));assert(d.querySelectorAll('.search-result').length>0);
  search.value='zzzznincstalalat';search.dispatchEvent(new w.Event('input',{bubbles:true}));assert(d.querySelector('.empty-state'));d.querySelector('#clear-search').click();assert.equal(search.value,'');
  d.querySelector('#menu-toggle').click();assert.equal(d.querySelector('#menu-toggle').getAttribute('aria-expanded'),'true');d.querySelector('#main-nav a').click();assert.equal(d.querySelector('#menu-toggle').getAttribute('aria-expanded'),'false');
  d.querySelector('a[data-media-id]').click();assert(d.querySelector('#image-lightbox').open);d.querySelector('#lightbox-close').click();assert(!d.querySelector('#image-lightbox').open);
  const refs=new Set();
  for(const element of d.querySelectorAll('img[src],script[src],link[href],a[data-media-id]')){
    const ref=element.getAttribute('src')??element.getAttribute('href');if(!ref||ref.startsWith('#'))continue;
    const url=new URL(ref,base);assert(url.href.startsWith(base),ref);refs.add(url.href);
  }
  for(const a of d.querySelectorAll('a[href^="#"]'))assert(d.getElementById(decodeURIComponent(a.hash.slice(1))),a.hash);
  for(const url of refs){
    if(live)assert.equal((await fetch(url,{method:'HEAD'})).status,200,url);
    else assert(fs.existsSync(path.join(root,'dist',url.slice(base.length))),url);
  }
  assert.equal(errors.length,0,errors.map(e=>e.message).join('\n'));
  console.log(`Kalauz DOM: keresés, üres találat, napi lista/mentés, kaszt-összehasonlítás, mobilmenü, lightbox és ${refs.size} erőforrás rendben${live?' az éles oldalon':''}.`);
}finally{w.close();}
