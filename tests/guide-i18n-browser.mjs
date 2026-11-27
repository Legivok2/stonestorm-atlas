import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {root} from '../scripts/publication-plan.mjs';
import {createPreview} from '../scripts/serve-pages.mjs';

process.env.PLAYWRIGHT_BROWSERS_PATH??=path.join(root,'.integration/browser-qa/browsers');
const {chromium}=await import(pathToFileURL(path.join(root,'.integration/browser-qa/node_modules/playwright/index.mjs')));
const server=createPreview(root);
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+'/stonestorm-atlas/';
const browser=await chromium.launch({headless:true});
try{
  for(const width of [375,1440]){
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base+'#cikk-forge',{waitUntil:'networkidle'});
    const article=page.locator('#cikk-forge');
    assert.equal(await article.getAttribute('open'),'');
    assert.match(await article.locator('summary').innerText(),/Kovácsolás/);
    await page.locator('#knowledge-search').fill('forging');
    assert(await page.locator('.search-result[href="#cikk-forge"]').count());
    await page.locator('[data-filter="gear"]').click();
    await page.locator('#atlas-language [data-atlas-language="en"]').click();
    assert.equal(await article.getAttribute('open'),'');
    assert.equal(new URL(page.url()).hash,'#cikk-forge');
    assert.match(await article.locator('summary').innerText(),/Forging/);
    assert.match(await article.locator('.article-body').innerText(),/failed upgrade burns the item/);
    const coverage=await page.evaluate(()=>{
      const source=window.STONESTORM_CONTENT,translations=window.STONESTORM_GUIDE_EN;
      const errors=[];
      for(const entry of source.articles){
        const target=document.getElementById('cikk-'+entry.id);
        const en=translations.articles[entry.id];
        if(!target.querySelector('summary').textContent.includes(en.title))errors.push(entry.id+' title');
        if(target.querySelector('.article-body > p').textContent!==en.intro)errors.push(entry.id+' intro');
        const items=[...target.querySelectorAll('.article-body > ul > li')].map(el=>el.textContent);
        if(JSON.stringify(items)!==JSON.stringify(en.sections.flatMap(section=>section.items)))errors.push(entry.id+' items');
      }
      translations.faq.forEach((faq,index)=>{
        const target=document.getElementById('gyik-'+index);
        if(target.querySelector('summary').textContent!==faq.question||target.querySelector('p').textContent!==faq.answer)errors.push('faq '+index);
      });
      return errors;
    });
    assert.deepEqual(coverage,[]);
    assert.equal(await page.locator('#knowledge-search').inputValue(),'forging');
    assert.equal(await page.locator('[data-filter="gear"]').getAttribute('aria-pressed'),'true');
    await page.locator('#knowledge-search').fill('kovácsolás');
    assert.match(await page.locator('.search-result[href="#cikk-forge"] h3').innerText(),/Forging/);
    await page.locator('[data-filter="all"]').click();
    await page.locator('#knowledge-search').fill('elfogyott az energiám');
    assert.match(await page.locator('.search-result[href="#gyik-3"] h3').innerText(),/energy/);
    await page.locator('#knowledge-search').fill('run out of energy');
    assert.match(await page.locator('.search-result[href="#gyik-3"] h3').innerText(),/energy/);
    await page.locator('#gyik-3 summary').click();
    assert.match(await page.locator('#gyik-3').innerText(),/What can I do when I run out of energy/);
    assert.match(await page.locator('#gyik-3 p').innerText(),/next refill/);
    await page.locator('#atlas-language [data-atlas-language="hu"]').click();
    assert.equal(await page.locator('#gyik-3').getAttribute('open'),'');
    assert.match(await page.locator('#gyik-3 summary').innerText(),/elfogyott az energiám/);
    await page.locator('#atlas-language [data-atlas-language="en"]').click();
    assert.equal(await page.locator('#gyik-3').getAttribute('open'),'');
    await page.locator('#cikk-maps summary').click();
    assert.match(await page.locator('#cikk-maps .article-body').innerText(),/Defeating Old Stripes opens Highwayman Country/);
    await page.locator('#atlas-search').fill('forging');
    assert.match(await page.locator('.atlas-guide-results a[href="#cikk-forge"] h4').innerText(),/Forging/);
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.locator('html').getAttribute('lang'),'en');
    assert.match(await page.locator('#cikk-forge summary').innerText(),/Forging/);
    assert.deepEqual(errors,[]);
    await context.close();
    console.log(width+' px: guide articles, FAQ, bilingual search and in-place switching verified');
  }
}finally{
  await browser.close();
  server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
}
