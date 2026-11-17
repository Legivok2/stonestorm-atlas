import path from 'node:path';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {root} from '../scripts/publication-plan.mjs';
import {createPreview} from '../scripts/serve-pages.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH??=path.join(root,'.integration/browser-qa/browsers');
const {chromium}=await import(pathToFileURL(path.join(root,'.integration/browser-qa/node_modules/playwright/index.mjs')));
const server=createPreview(path.join(root,'dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port+'/stonestorm-atlas/';
const browser=await chromium.launch({headless:true});
try{
  for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844],['small-mobile',320,760]]){
    const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'#atlas/pets',{waitUntil:'networkidle'});
    const card=page.locator('.atlas-card[href="#atlas/pets/pet/pet_vulture"]');
    assert.match(await card.locator('.atlas-card-desc').textContent(),/Zsákmány \+4%/);
    assert.match(await card.locator('.card-form-label').textContent(),/1\. SZINT.*KÖLYÖK.*0\. RANG/);
    assert(!/0,8%|nyers fajadat|Részben azonosított kép/.test(await card.textContent()));
    const all=await page.evaluate(()=>window.STONESTORM_ATLAS.pets.map(p=>({id:p.id,value:p.bonusByForm[0].value})));
    for(const pet of all){const text=await page.locator(`.atlas-card[href="#atlas/pets/pet/${pet.id}"] .atlas-card-desc`).textContent();assert(text.includes(new Intl.NumberFormat('hu-HU',{maximumFractionDigits:2}).format(pet.value*100)+'%'),pet.id);}
    await card.scrollIntoViewIfNeeded();await card.screenshot({path:path.join(root,'.integration/browser-qa/engine-card-'+name+'.png')});await card.click();
    await page.locator('[data-pet-calculator]').waitFor();assert.equal(await page.locator('[data-pet-bonus]').getAttribute('data-pet-bonus'),'0.04');
    assert.equal(await page.locator('[data-pet-hero-image] img').getAttribute('data-catalog-image'),'pets/pet_vulture_1');
    await page.locator('[data-pet-calc-form]').focus();
    await page.locator('[data-pet-calc-form]').selectOption('2');assert.equal(await page.locator('[data-pet-bonus]').getAttribute('data-pet-bonus'),'0.06');
    assert.equal(await page.locator('[data-pet-hero-image] img').getAttribute('data-catalog-image'),'pets/pet_vulture_2');
    assert.equal(await page.locator('[data-pet-hero-form]').textContent(),'Fiatal');
    assert(await page.locator('[data-pet-calc-form]').evaluate(el=>el===document.activeElement));
    assert.equal(await page.locator('[data-pet-calc-result] img').getAttribute('data-catalog-image'),'pets/pet_vulture_2');
    await page.locator('[data-pet-calc-level]').fill('15');await page.locator('[data-pet-calc-level]').dispatchEvent('input');assert.equal(await page.locator('[data-pet-bonus]').getAttribute('data-pet-bonus'),'0.06');
    await page.locator('[data-pet-calc-rank]').fill('2');assert.equal(await page.locator('[data-pet-bonus]').getAttribute('data-pet-bonus'),'0.068');
    for(const form of [3,4,5,1,2]){await page.locator('[data-pet-calc-form]').selectOption(String(form));assert.equal(await page.locator('[data-pet-hero-image] img').getAttribute('data-catalog-image'),'pets/pet_vulture_'+form);assert.equal(await page.locator('[data-pet-calc-result] img').getAttribute('data-catalog-image'),'pets/pet_vulture_'+form);}
    await page.locator('#atlas-detail').evaluate(el=>el.scrollTop=0);
    await page.locator('#atlas-detail').screenshot({path:path.join(root,'.integration/browser-qa/pet-portrait-theme-'+name+'.png')});
    await page.locator('[data-pet-calculator]').screenshot({path:path.join(root,'.integration/browser-qa/engine-detail-'+name+'.png')});
    assert(await page.evaluate(()=>document.querySelector('#atlas-detail').scrollWidth<=document.querySelector('#atlas-detail').clientWidth+1),name+' detail overflow');
    await page.locator('#atlas-detail-close').click();await page.evaluate(()=>location.hash='#atlas/planner');await page.locator('#planner-level').fill('60');await page.locator('#planner-level').dispatchEvent('change');
    await page.locator('#planner-pet').selectOption('pet_vulture');assert.equal(await page.locator('[data-planner-pet-bonus]').getAttribute('data-planner-pet-bonus'),'0.04');
    await page.locator('#planner-pet-form').selectOption('2');await page.locator('#planner-pet-rank').fill('2');await page.locator('#planner-pet-rank').dispatchEvent('change');assert.equal(await page.locator('[data-planner-pet-bonus]').getAttribute('data-planner-pet-bonus'),'0.068');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' overflow');assert.deepEqual(errors,[]);
    console.log('Data Engine UI '+name+': 22 cards, vulture 4%, form/rank 6.8%, Planner consistency, no overflow.');await page.close();
  }
  const page=await browser.newPage({viewport:{width:1280,height:900}}),api=JSON.parse(fs.readFileSync(path.join(root,'snapshots/current/content.json'))),addon='addons/stonestorm-statcap-overlay/',manifest=JSON.parse(fs.readFileSync(path.join(root,addon,'manifest.json')));
  let writes=0;await page.route('https://stonestorm.gg/**',route=>{if(route.request().method()!=='GET')writes++;const p=new URL(route.request().url()).pathname;if(p==='/api/content')return route.fulfill({json:api});if(p==='/api/character')return route.fulfill({json:{state:{pets:[{id:'local-fixture',petId:'pet_vulture',level:1,form:1,rank:0,active:false}]}}});return route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><div class="pet-row" data-pet="local-fixture"><div class="pet-row__name" tabindex="0">Keselyűfióka <span class="chip">Kölyök</span></div><div class="pet-row__level">1. szint</div><button>Fő kísérő legyen</button></div>'});});
  await page.goto('https://stonestorm.gg/');await page.evaluate(()=>{const orig=Element.prototype.attachShadow;Element.prototype.attachShadow=function(o){const s=orig.call(this,o);if(this.id==='ss-atlas-pet-tooltip')window.petShadow=s;return s;};window.chrome={runtime:{id:'engine-fixture',onMessage:{addListener(){}}},storage:{local:{get(k,cb){cb?.({});return Promise.resolve({});},set(){return Promise.resolve();}},onChanged:{addListener(){}}}};});
  for(const group of manifest.content_scripts)for(const file of group.js)await page.addScriptTag({content:fs.readFileSync(path.join(root,addon,file),'utf8')});
  await page.evaluate(async()=>{await fetch('/api/content');await fetch('/api/character');});await page.locator('.pet-row__name').hover();await page.waitForFunction(()=>window.petShadow?.textContent.includes('Zsákmány +4%'));
  assert.match(await page.evaluate(()=>window.petShadow.textContent),/Nem fő kísérő/);assert.equal(writes,0);
  await page.screenshot({path:path.join(root,'.integration/browser-qa/engine-addon-inactive.png')});
  const sample=await page.evaluate(()=>{StonestormResearchController.command('atlas-research-arm');return fetch('/api/content').then(()=>new Promise(r=>setTimeout(()=>r(StonestormResearchController.command('atlas-research-export')),100)));});
  assert(sample.samples.some(x=>x.endpoint==='/api/content'));assert(!JSON.stringify(sample).includes('local-fixture'));
  console.log('Addon actual tooltip: inactive vulture +4%, no activation calls; public config export without owned identifiers.');await page.close();
}finally{await browser.close();await new Promise(r=>server.close(r));}
