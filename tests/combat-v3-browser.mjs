import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {root} from '../scripts/publication-plan.mjs';
import {createPreview} from '../scripts/serve-pages.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH=path.join(root,'.integration/browser-qa/browsers');
const {chromium}=await import(pathToFileURL(path.join(root,'.integration/browser-qa/node_modules/playwright/index.mjs')));
const api=JSON.parse(fs.readFileSync(path.join(root,'snapshots/current/content.json')));
const server=createPreview(path.join(root,'dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port+'/stonestorm-atlas/',browser=await chromium.launch({headless:true});
try{
  for(const width of [1440,375]){
    const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'#atlas/upcoming',{waitUntil:'networkidle'});
    await page.locator('#future-content-root').waitFor();assert.equal(await page.locator('#future-content-root').count(),1);
    assert.match(await page.locator('#atlas-screen').textContent(),/Hivatalosan bejelentett/);assert.match(await page.locator('#atlas-screen').textContent(),/Nincs új, igazolt hivatalos bejelentés/);
    let count=0;
    for(const d of api.dungeons){
      await page.evaluate(id=>location.hash='#atlas/world/dungeon/'+id,d.id);await page.locator('#atlas-detail[open]').waitFor();
      for(const [locale,formatLocale] of [['hu','hu-HU'],['en','en-US']]){
        await page.locator(`#atlas-detail [data-atlas-language="${locale}"]`).click();
        const format=value=>new Intl.NumberFormat(formatLocale,{useGrouping:false,maximumFractionDigits:20}).format(value);
        const rows=page.locator('#folio-panel-overview .atlas-related tbody tr');
        const expected=[...d.rooms,...d.heroic.rooms];
        assert.equal(await rows.count(),expected.length,d.id+' room count');
        for(const [index,room] of expected.entries()){
          const display=await rows.nth(index).locator('td').nth(6).textContent();
          assert.equal(display,format(room.def),`${d.id} ${locale} room ${room.room} raw defence`);
          assert.equal(Number(display.replace(',','.')),room.def);
        }
      }
      count+=d.rooms.length+d.heroic.rooms.length;
      assert((await page.locator('#atlas-detail-body').textContent()).includes(String(d.recommendedLevel)));
      await page.locator('#atlas-detail [data-atlas-language="hu"]').click();
    }
    assert.equal(count,80);await page.locator('#atlas-detail-close').click();
    await page.evaluate(()=>location.hash='#atlas/stat-limits');await page.locator('#critical-results').waitFor();assert.match(await page.locator('#critical-results').textContent(),/soft-cap/);assert.equal(await page.locator('[data-critical-result]').count(),0);
    await page.locator('#stat-evade').fill('100');assert.equal(await page.locator('[data-effective="evadeNormal"]').textContent(),'30%');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);
    await page.screenshot({path:path.join(root,'.integration/combat-v3/atlas-'+width+'.png')});await page.close();
  }
  const page=await browser.newPage(),addon='addons/stonestorm-statcap-overlay/';let writes=0;
  const character={items:[{id:'local-item',templateId:api.items[0].id,equippedSlot:'weapon',plus:0,lines:[{type:'critDamage',value:.8},{type:'skillDamage',value:.6}]}],stats:{str:5,dex:100,vit:10,int:5},derived:{maxHp:100,maxSp:20,atkMin:10,atkMax:20,def:88,critChance:.42},harcero:{full:100}};
  await page.route('https://stonestorm.gg/**',route=>{if(route.request().method()!=='GET')writes++;const p=new URL(route.request().url()).pathname;return p==='/api/content'?route.fulfill({json:api}):p==='/api/character'?route.fulfill({json:{state:character}}):route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><main><p>Karakter</p></main>'});});
  await page.goto('https://stonestorm.gg/');await page.evaluate(()=>{const original=Element.prototype.attachShadow;Element.prototype.attachShadow=function(opts){const shadow=original.call(this,opts);if(this.id==='ss-statcap-root')window.statShadow=shadow;return shadow;};window.chrome={runtime:{id:'combat-fixture',onMessage:{addListener(){}}},storage:{local:{get(k,cb){cb?.({});return Promise.resolve({});},set(){return Promise.resolve();}},onChanged:{addListener(){}}}};});
  const manifest=JSON.parse(fs.readFileSync(path.join(root,addon,'manifest.json')));
  for(const group of manifest.content_scripts)for(const file of group.js)await page.addScriptTag({content:fs.readFileSync(path.join(root,addon,file),'utf8')});
  await page.evaluate(()=>StonestormCompanionState.shared(chrome.storage).set({development:true}));
  await page.evaluate(async()=>{await fetch('/api/content');await fetch('/api/character');});
  await page.waitForFunction(()=>window.statShadow.querySelector('[data-sc-cap="crit"]')?.textContent.includes('42%'));
  await page.evaluate(()=>{window.statShadow.querySelector('[data-toggle]').click();window.statShadow.querySelector('[data-sc-nav="stats"]').click();});
  let text=await page.evaluate(()=>window.statShadow.querySelector('[data-sc-stats]').textContent);
  assert.match(text,/Kritikus esély.*42% \/ 50%/s);
  assert.match(text,/Kritikus sebzésbónusz · Nem igazolt · Nem igazolt végérték · ismert felszereléssorok 80%/);
  assert.equal(await page.evaluate(()=>window.statShadow.querySelector('[data-sc-cap="critDamage"]')),null);
  assert.equal(await page.evaluate(()=>window.statShadow.querySelector('[data-sc-cap="skillDamage"]')),null);
  await page.evaluate(()=>document.querySelector('main').innerHTML='<section><h3>Bónuszok</h3><div>Kritikus esély: 42%</div><div>Kritikus sebzésbónusz: 33%</div><div>Képességsebzésbónusz: 27%</div></section>');
  await page.waitForTimeout(1200);
  text=await page.evaluate(()=>window.statShadow.querySelector('[data-sc-stats]').textContent);
  assert.match(text,/ismert felszereléssorok 80%/);
  assert.equal(await page.evaluate(()=>window.statShadow.querySelector('[data-sc-cap="critDamage"]')),null);
  assert.equal(await page.evaluate(()=>window.statShadow.querySelector('[data-sc-cap="skillDamage"]')),null);
  await page.screenshot({path:path.join(root,'.integration/combat-v3/addon-panel.png')});
  await page.evaluate(()=>document.querySelector('main').textContent='Karakter');
  assert.equal(writes,0);await page.close();
  console.log('Combat V3 browser: 80 exact room displays at desktop/mobile, 30% cap, current Companion verified critical and unverified bonus diagnostics, no game writes.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
