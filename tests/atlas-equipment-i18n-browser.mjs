import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {root} from '../scripts/publication-plan.mjs';
import {createPreview} from '../scripts/serve-pages.mjs';

process.env.PLAYWRIGHT_BROWSERS_PATH??=path.join(root,'.integration/browser-qa/browsers');
const {chromium}=await import(pathToFileURL(path.join(root,'.integration/browser-qa/node_modules/playwright/index.mjs')));
const output=path.resolve(process.env.ATLAS_EQUIPMENT_I18N_BROWSER_ROOT??path.join(root,'dist'));
const server=createPreview(output);
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+'/stonestorm-atlas/';
const browser=await chromium.launch({headless:true});

try{
  for(const width of [375,1440]){
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base+'#atlas/equipment',{waitUntil:'networkidle'});
    assert.equal(await page.locator('html').getAttribute('lang'),'hu');
    assert.equal(await page.locator('#atlas-heading').textContent(),'Felszerelések');
    assert.equal(await page.locator('#atlas-slot').locator('..').textContent().then(text=>text.trim().startsWith('Felszerelési hely')),true);
    assert.equal(await page.locator('#atlas-class').locator('option[value="warrior"]').textContent(),'Harcos');
    assert.equal(await page.locator('#atlas-screen .atlas-card').first().evaluate(element=>element.classList.contains('rarity-common')),false);

    await page.locator('[data-pagination="1"]').click();
    assert((await page.locator('.atlas-pagination').innerText()).includes('2 / 8'));
    await page.locator('#atlas-language [data-atlas-language="en"]').click();
    assert.equal(await page.locator('#atlas-heading').textContent(),'Equipment');
    assert((await page.locator('.atlas-pagination').innerText()).includes('2 / 8'));
    assert.equal(await page.locator('#atlas-slot').locator('..').textContent().then(text=>text.trim().startsWith('Equipment slot')),true);
    assert.equal(await page.locator('#atlas-class').locator('option[value="warrior"]').textContent(),'Warrior');

    await page.locator('#atlas-slot').selectOption('weapon');
    await page.locator('#atlas-class').selectOption('warrior');
    await page.locator('#atlas-max-level').fill('60');
    await page.locator('#atlas-max-level').dispatchEvent('change');
    await page.locator('#atlas-sort').selectOption('levelDesc');
    await page.locator('#atlas-language [data-atlas-language="hu"]').click();
    assert.equal(await page.locator('#atlas-slot').inputValue(),'weapon');
    assert.equal(await page.locator('#atlas-class').inputValue(),'warrior');
    assert.equal(await page.locator('#atlas-max-level').inputValue(),'60');
    assert.equal(await page.locator('#atlas-sort').inputValue(),'levelDesc');

    await page.locator('#atlas-search').fill('critical chance');
    await page.locator('#atlas-search-category').selectOption('equipment');
    assert((await page.locator('#atlas-screen .atlas-card').count())>0,'English stat terms should find equipment');
    const englishQuery=await page.locator('#atlas-search').inputValue();
    await page.locator('#atlas-language [data-atlas-language="en"]').click();
    assert.equal(await page.locator('#atlas-search').inputValue(),englishQuery);
    assert((await page.locator('#atlas-screen .atlas-card').count())>0);
    await page.locator('#atlas-search').fill('Kritikus esély');
    assert((await page.locator('#atlas-screen .atlas-card').count())>0,'Hungarian stat terms should find equipment');
    await page.locator('#atlas-search').fill('');
    await page.locator('#atlas-language [data-atlas-language="hu"]').click();

    const modelSnapshot=await page.evaluate(()=>{
      const item=window.STONESTORM_ATLAS.items.find(record=>record.id==='w_warrior_0');
      const set=window.STONESTORM_ATLAS.sets.find(record=>record.id==='set_m1');
      return {itemValues:item.values,setBonuses:set.bonuses};
    });
    await page.goto(base+'#atlas/equipment/item/w_warrior_0',{waitUntil:'networkidle'});
    assert.equal(await page.locator('#atlas-detail-title').textContent(),'Rozsdás pallos');
    await page.locator('[data-detail-tab="bonuses"]').click();
    const itemStatsHu=await page.locator('#folio-panel-bonuses').innerText();
    assert.match(itemStatsHu,/Min\. sebzés/);
    assert.match(itemStatsHu,/\b6\b/);
    await page.locator('#atlas-detail [data-atlas-language="en"]').click();
    assert.equal(await page.locator('#atlas-detail[open]').count(),1);
    assert.equal(await page.locator('#atlas-detail-title').textContent(),'Rozsdás pallos');
    assert.equal(await page.locator('[data-detail-tab="bonuses"]').getAttribute('aria-selected'),'true');
    const itemStatsEn=await page.locator('#folio-panel-bonuses').innerText();
    assert.match(itemStatsEn,/Minimum damage/);
    assert.match(itemStatsEn,/\b6\b/);
    assert.doesNotMatch(await page.locator('#atlas-detail').innerText(),/Felszerelési hely|Vételár|Eladási ár|Bónuszok|Adatbázis-azonosító/);
    assert.deepEqual(await page.evaluate(()=>{
      const item=window.STONESTORM_ATLAS.items.find(record=>record.id==='w_warrior_0');
      const set=window.STONESTORM_ATLAS.sets.find(record=>record.id==='set_m1');
      return {itemValues:item.values,setBonuses:set.bonuses};
    }),modelSnapshot);

    await page.goto(base+'#atlas/sets/set/set_m1',{waitUntil:'networkidle'});
    assert.equal(await page.locator('#atlas-detail-title').textContent(),'The Village Outskirts · set family');
    await page.locator('[data-detail-tab="bonuses"]').click();
    let setBonusText=await page.locator('#folio-panel-bonuses').innerText();
    assert.match(setBonusText,/2 equipped pieces/);
    assert.match(setBonusText,/Max HP/);
    assert.match(setBonusText,/\b100\b/);
    await page.locator('#atlas-detail [data-atlas-language="hu"]').click();
    assert.equal(await page.locator('#atlas-detail-title').textContent(),'A falu határa · szettcsalád');
    assert.equal(await page.locator('[data-detail-tab="bonuses"]').getAttribute('aria-selected'),'true');
    setBonusText=await page.locator('#folio-panel-bonuses').innerText();
    assert.match(setBonusText,/2 felszerelt darab/);
    assert.match(setBonusText,/Max\. HP/);
    assert.match(setBonusText,/\b100\b/);
    await page.locator('#atlas-detail [data-atlas-language="en"]').click();
    await page.locator('[data-detail-tab="related"]').click();
    assert.equal(await page.locator('#folio-panel-related a[href*="#atlas/equipment/item/"]').count(),8);
    assert.doesNotMatch(await page.locator('#atlas-detail').innerText(),/Szettbónuszok|Helyek|Egyedi tárgyazonosító|Kapcsolódó felszerelések|Kapcsolódó boss és pálya/);
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.locator('html').getAttribute('lang'),'en');
    assert.equal(await page.locator('#atlas-detail-title').textContent(),'The Village Outskirts · set family');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'document overflow at '+width);
    assert.deepEqual(errors,[]);
    await context.close();
    console.log(width+' px: equipment/set HU↔EN, filters, bilingual search, detail state, values and persistence verified');
  }
}finally{
  await browser.close();
  server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
}
