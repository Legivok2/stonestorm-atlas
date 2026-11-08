/* Opcionális valódi Chromium-teszt: a Playwright külön, az ignorált QA-mappába települ. */
import path from 'node:path';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {root} from '../scripts/publication-plan.mjs';
import {createPreview} from '../scripts/serve-pages.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH??=path.join(root,'.integration/browser-qa/browsers');
const {chromium}=await import(pathToFileURL(path.join(root,'.integration/browser-qa/node_modules/playwright/index.mjs')));
let server,base=process.env.ATLAS_BROWSER_BASE_URL;
if(!base){server=createPreview(path.join(root,'dist'));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port+'/stonestorm-atlas/';}
const browser=await chromium.launch({headless:true});
try{
  for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844],['small-mobile',320,760]]){
    const context=await browser.newContext({viewport:{width,height},isMobile:width<680,hasTouch:width<680});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)errors.push(response.status()+' '+response.url());});
    await page.goto(base+'#atlas/stat-limits',{waitUntil:'networkidle'});
    assert(await page.locator('#atlas-nav [data-atlas-page="stat-limits"]').isVisible());
    assert.equal(await page.locator('.stat-limit-table tbody tr').count(),8);
    assert.equal(await page.locator('[data-effective="evadeNormal"]').textContent(),'18,2%');
    assert.equal(await page.locator('[data-effective="evadeBoss"]').textContent(),'12%');
    assert.equal(await page.locator('[data-excess="evadeBoss"]').textContent(),'6,2 százalékpont');
    await page.locator('#stat-crit').fill('65');assert.equal(await page.locator('[data-effective="crit"]').textContent(),'50%');assert.equal(await page.locator('[data-excess="crit"]').textContent(),'15 százalékpont');
    await page.locator('#stat-reduction').fill('100');assert.equal(await page.locator('[data-effective="reduction"]').textContent(),'75%');
    await page.locator('#stat-evade').fill('100');assert.equal(await page.locator('[data-effective="evadeNormal"]').textContent(),'35%');assert.equal(await page.locator('[data-excess="evadeBoss"]').textContent(),'88 százalékpont');
    for(const value of ['', '-5', 'abc']){await page.locator('#stat-crit').fill(value);assert.equal(await page.locator('#stat-crit').getAttribute('aria-invalid'),'true');assert(!await page.locator('[data-stat-result="crit"]').textContent().then(text=>/NaN|Infinity/.test(text)));}
    await page.locator('#stat-reset').click();
    assert.equal(await page.locator('[data-bonus-total="xp"]').textContent(),'+84,7%');
    assert.equal(await page.locator('[data-bonus-total="nyang"]').textContent(),'+130%');
    await page.locator('#stat-xpOther').fill('1000');assert.equal((await page.locator('[data-bonus-total="xp"]').textContent()).replace(/\s/g,''),'+1031,1%');
    assert((await page.locator('#stat-bonus-results').textContent()).includes('Nem állapítható meg'));
    await page.locator('#stat-reset').click();await page.locator('#stat-crit').fill('42');
    await page.locator('#atlas-nav [data-atlas-page="gallery"]').click();await page.locator('.catalog-card').first().waitFor();
    await page.locator('#atlas-nav [data-atlas-page="stat-limits"]').click();await page.locator('#stat-crit').waitFor();assert.equal(await page.locator('#stat-crit').inputValue(),'42');
    await page.locator('#stat-reset').click();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' vízszintes túlcsordulás');
    assert(await page.locator('.stat-limit-track').evaluateAll(elements=>elements.every(element=>element.firstElementChild.getBoundingClientRect().width<=element.getBoundingClientRect().width+1)));
    await page.locator('.stat-calculator').scrollIntoViewIfNeeded();
    const screenshots=path.join(root,'.integration/browser-qa');fs.mkdirSync(screenshots,{recursive:true});
    await page.locator('.stat-calculator').screenshot({path:path.join(screenshots,'stat-'+name+'.png')});
    assert.equal(errors.length,0,errors.join('\n'));
    console.log(`Chromium ${name} ${width}×${height}: navigáció, 8 stat, limitek, bónuszok, hibás bevitel, állapotmegőrzés és túlcsordulás rendben.`);
    await context.close();
  }
}finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
