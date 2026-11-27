import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {root} from '../scripts/publication-plan.mjs';
import {createPreview} from '../scripts/serve-pages.mjs';

process.env.PLAYWRIGHT_BROWSERS_PATH??=path.join(root,'.integration/browser-qa/browsers');
const {chromium}=await import(pathToFileURL(path.join(root,'.integration/browser-qa/node_modules/playwright/index.mjs')));
const server=createPreview(process.env.ATLAS_WORLD_I18N_BROWSER_ROOT??root);
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+'/stonestorm-atlas/';
const browser=await chromium.launch({headless:true});
try{
  for(const width of [375,1440]){
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base+'#atlas/world',{waitUntil:'networkidle'});
    const snapshot=await page.evaluate(()=>{const {maps,mobs,bosses,dungeons}=window.STONESTORM_ATLAS;return JSON.stringify({maps,mobs,bosses,dungeons});});
    assert.match(await page.locator('#atlas-screen').innerText(),/A falu határa/);
    await page.locator('#atlas-sort').selectOption('levelDesc');
    await page.locator('#atlas-language [data-atlas-language="en"]').click();
    assert.equal(await page.locator('#atlas-sort').inputValue(),'levelDesc');
    assert.match(await page.locator('#atlas-screen').innerText(),/Village Outskirts/);
    await page.locator('[data-world="mobs"]').click();
    assert.match(await page.locator('#atlas-screen').innerText(),/ENEMY/);
    await page.locator('[data-pagination="1"]').click();
    await page.locator('#atlas-language [data-atlas-language="hu"]').click();
    assert.equal(await page.locator('[data-world="mobs"]').getAttribute('aria-pressed'),'true');
    assert.match(await page.locator('.atlas-pagination').innerText(),/2 \/ 3/);
    await page.locator('#atlas-search').fill('Wild Dog');
    await page.locator('#atlas-search-category').selectOption('world');
    assert.equal(await page.locator('.atlas-card h4').first().textContent(),'Vadkutya');
    await page.locator('.atlas-card').first().click();
    await page.locator('#atlas-detail[open]').waitFor();
    await page.locator('#atlas-detail [data-atlas-language="en"]').click();
    assert.equal(await page.locator('#atlas-detail-title').textContent(),'Wild Dog');
    assert.equal(await page.locator('#atlas-search').inputValue(),'Wild Dog');
    assert.equal(await page.locator('#atlas-search-category').inputValue(),'world');
    assert.match(await page.locator('#folio-panel-overview').innerText(),/Combat power/);
    await page.locator('#atlas-detail [data-atlas-language="hu"]').click();
    assert.equal(await page.locator('#atlas-detail-title').textContent(),'Vadkutya');
    await page.locator('#atlas-detail-close').click();
    assert.equal(await page.locator('#atlas-search').inputValue(),'Wild Dog');
    await page.locator('#atlas-language [data-atlas-language="en"]').click();
    await page.locator('#atlas-search').fill('Vadkutya');
    assert.equal(await page.locator('.atlas-card h4').first().textContent(),'Wild Dog');
    await page.locator('#atlas-search').fill('Wild Dogs');
    assert.equal(await page.locator('.atlas-card h4').first().textContent(),'Village Outskirts');
    await page.locator('#atlas-search').fill('Vadkutyák');
    assert.equal(await page.locator('.atlas-card h4').first().textContent(),'Village Outskirts');
    await page.locator('#atlas-language [data-atlas-language="hu"]').click();
    await page.goto(base+'#atlas/world/boss/boss_m1',{waitUntil:'networkidle'});
    assert.equal(await page.locator('#atlas-detail-title').textContent(),'Öreg Csíkos');
    const hp=await page.evaluate(()=>window.STONESTORM_ATLAS.mobs.find(m=>m.id==='m1_boss').maxHp);
    assert.equal(await page.locator('.folio-facts dd').nth(2).innerText(),new Intl.NumberFormat('hu-HU').format(hp));
    await page.locator('#atlas-detail [data-atlas-language="en"]').click();
    assert.equal(await page.locator('#atlas-detail-title').textContent(),'Old Stripes');
    assert.equal(await page.locator('.folio-facts dd').nth(2).innerText(),new Intl.NumberFormat('en-US').format(hp));
    assert.match(await page.locator('.folio-facts').innerText(),/Health/);
    await page.locator('[data-detail-tab="related"]').click();
    await page.locator('#folio-panel-related a[href="#atlas/world/map/m1"]').click();
    await page.locator('#atlas-detail-title').getByText('Village Outskirts').waitFor();
    assert.match(await page.locator('#atlas-detail').innerText(),/Wild Dogs \(m1_dogs\)/);
    await page.locator('#atlas-detail a[href="#atlas/materials/material/mat_m1_dogs"]').click();
    await page.locator('#atlas-detail-title').getByText('Dog Fang').waitFor();
    assert.equal(await page.locator('#atlas-detail-title').textContent(),'Dog Fang');
    await page.goto(base+'#atlas/world/dungeon/wild',{waitUntil:'networkidle'});
    assert.equal(await page.locator('#atlas-detail-title').textContent(),'Wildwood Den');
    assert.match(await page.locator('#folio-panel-overview').innerText(),/Normal rooms/);
    assert.match(await page.locator('#folio-panel-overview').innerText(),/Wild Cub/);
    assert.match(await page.locator('#folio-panel-overview').innerText(),/First normal clear reward\s+5 Storm Coins/);
    await page.locator('#atlas-detail [data-atlas-language="hu"]').click();
    assert.equal(await page.locator('#atlas-detail-title').textContent(),'Vadonodú');
    assert.match(await page.locator('#folio-panel-overview').innerText(),/Normál termek/);
    const records=await page.evaluate(async()=>{
      const failures=[],db=window.STONESTORM_ATLAS,i18n=window.AtlasI18n;
      for(const [kind,collection] of [['map','maps'],['mob','mobs'],['boss','bosses'],['dungeon','dungeons']]){
        for(const record of db[collection]){
          const hash='#atlas/world/'+kind+'/'+record.id;
          if(location.hash!==hash){
            const changed=new Promise(resolve=>window.addEventListener('hashchange',resolve,{once:true}));
            location.hash=hash;
            await changed;
          }
          for(const locale of ['hu','en']){
            i18n.setLocale(locale);
            const key=i18n.gameNameKey(kind,record),expected=key?i18n.dictionaries[locale][key]:record.name??record.id;
            if(!document.querySelector('#atlas-detail[open]')||document.querySelector('#atlas-detail-title')?.textContent!==expected)failures.push(kind+'/'+record.id+' '+locale);
          }
        }
      }
      return failures;
    });
    assert.deepEqual(records,[]);
    assert.equal(await page.evaluate(()=>{const {maps,mobs,bosses,dungeons}=window.STONESTORM_ATLAS;return JSON.stringify({maps,mobs,bosses,dungeons});}),snapshot);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'document overflow at '+width);
    assert.deepEqual(errors,[]);
    await context.close();
    console.log(width+' px: world lists, search, details, links, state and data verified');
  }
}finally{
  await browser.close();
  server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
}
