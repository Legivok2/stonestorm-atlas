import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {root} from '../scripts/publication-plan.mjs';
import {createPreview} from '../scripts/serve-pages.mjs';

process.env.PLAYWRIGHT_BROWSERS_PATH??=path.join(root,'.integration/browser-qa/browsers');
const {chromium}=await import(pathToFileURL(path.join(root,'.integration/browser-qa/node_modules/playwright/index.mjs')));
const server=createPreview(process.env.ATLAS_I18N_BROWSER_ROOT??root);
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+'/stonestorm-atlas/';
const browser=await chromium.launch({headless:true});
try{
  for(const width of [375,768,1440,1920]){
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base+'#atlas/overview',{waitUntil:'networkidle'});
    assert.equal(await page.locator('html').getAttribute('lang'),'hu');
    assert.equal(await page.locator('.atlas-portal .eyebrow').textContent(),'A VIHAR VILÁGA · MAGYAR KÓDEX');
    await page.locator('#portal-query').fill('keresés');
    await page.locator('#atlas-language [data-atlas-language="en"]').click();
    assert.equal(await page.locator('html').getAttribute('lang'),'en');
    assert.equal(await page.locator('#atlas-language [data-atlas-language="en"]').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('#portal-query').inputValue(),'keresés');
    assert.equal(await page.locator('.atlas-portal .eyebrow').textContent(),'THE WORLD OF THE STORM · CODEX');
    assert.equal(await page.locator('[data-atlas-page="pets"] span').first().textContent(),'Companions');
    assert.equal(await page.locator('#atlas-heading').textContent(),'Overview');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'document overflow at '+width);
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.locator('html').getAttribute('lang'),'en');
    assert.equal(await page.locator('.atlas-portal .eyebrow').textContent(),'THE WORLD OF THE STORM · CODEX');
    await page.locator('#atlas-search').fill('Vulture chick');
    await page.locator('.atlas-card h4').filter({hasText:'Vulture chick'}).waitFor();
    await page.locator('#atlas-language [data-atlas-language="hu"]').click();
    assert.equal(await page.locator('#atlas-search').inputValue(),'Vulture chick');
    assert.equal(await page.locator('.atlas-card h4').first().textContent(),'Keselyűfióka');
    await page.locator('#atlas-search').fill('Keselyűfióka');
    await page.locator('#atlas-language [data-atlas-language="en"]').click();
    assert.equal(await page.locator('.atlas-card h4').first().textContent(),'Vulture chick');
    await page.locator('.atlas-card').first().click();
    await page.locator('#atlas-detail[open]').waitFor();
    assert.equal(await page.locator('#atlas-detail-title').textContent(),'Vulture chick');
    await page.locator('[data-pet-calc-rank]').fill('2');
    await page.locator('#atlas-detail [data-atlas-language="hu"]').click();
    assert.equal(await page.locator('#atlas-detail-title').textContent(),'Keselyűfióka');
    assert.equal(await page.locator('[data-pet-calc-rank]').inputValue(),'2');
    await page.locator('#atlas-detail [data-atlas-language="en"]').click();
    await page.goto(base+'#atlas/stat-limits',{waitUntil:'networkidle'});
    await page.locator('#stat-reduction').fill('65,5');
    const value=await page.locator('[data-effective="reduction"]').textContent();
    await page.locator('#atlas-language [data-atlas-language="hu"]').click();
    assert.equal(await page.locator('#stat-reduction').inputValue(),'65,5');
    assert.equal((await page.locator('[data-effective="reduction"]').textContent()).replace(',','.'),value.replace(',','.'));
    const pages=await page.locator('#atlas-nav [data-atlas-page]').evaluateAll(nodes=>nodes.map(node=>node.dataset.atlasPage));
    for(const id of pages){
      await page.evaluate(async id=>{
        const hash='#atlas/'+id;
        if(location.hash!==hash){
          const changed=new Promise(resolve=>addEventListener('hashchange',resolve,{once:true}));
          location.hash=hash;
          await changed;
        }
      },id);
      for(const locale of ['hu','en','hu']){
        await page.locator(`#atlas-language [data-atlas-language="${locale}"]`).click();
        assert.equal(await page.locator('html').getAttribute('lang'),locale);
        assert.equal(await page.locator('#atlas-heading').textContent(),await page.evaluate(id=>AtlasI18n.t('navigation.'+id),id),id);
        assert.equal(await page.evaluate(()=>location.hash),'#atlas/'+id);
        assert((await page.locator('#atlas-screen').innerText()).trim().length>0,id+' empty');
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id+' overflow at '+width);
        if(locale==='en'){
          const untranslated=await page.locator('#atlas-screen').evaluate(element=>{
            const hungarian=/(?:^|[\s:])(?:Keresés|Szűrés|Rendezés|Előző|Következő|Bezárás|Nincs találat|Ismeretlen|Betöltés)(?=$|[\s:.!?])/iu;
            return [...element.querySelectorAll('button,th,dt,summary,[placeholder],[title]')].flatMap(node=>{
              const values=[node.matches('button,th,dt,summary')?node.textContent:'',node.getAttribute('placeholder')??'',node.getAttribute('title')??''];
              return values.filter(value=>hungarian.test(value)).map(value=>value.trim());
            });
          });
          assert.deepEqual(untranslated,[],id+' untranslated UI at '+width);
        }
      }
    }
    assert.deepEqual(errors,[]);
    await context.close();
    console.log(width+' px: all '+pages.length+' Atlas pages, language switch, UI labels, persistence and calculator input verified');
  }
}finally{
  await browser.close();
  server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
}
