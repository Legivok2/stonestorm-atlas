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
    const showNav=async()=>{const toggle=page.locator('#atlas-nav-toggle');if(await toggle.isVisible()&&await toggle.getAttribute('aria-expanded')!=='true'){await toggle.click();await page.locator('#atlas-sidebar').waitFor({state:'visible'});}};
    page.on('pageerror',error=>errors.push(error.message));
    page.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)errors.push(response.status()+' '+response.url());});
    await page.goto(base+'#atlas/stat-limits',{waitUntil:'networkidle'});
    await showNav();
    assert(await page.locator('#atlas-nav [data-atlas-page="stat-limits"]').isVisible());
    if(await page.locator('#atlas-nav-close').isVisible())await page.locator('#atlas-nav-close').click();
    assert.equal(await page.locator('.stat-limit-table tbody tr').count(),16);
    assert.equal(await page.locator('[data-effective="evadeNormal"]').textContent(),'18,2%');
    assert.equal(await page.locator('[data-effective="evadeBoss"]').textContent(),'12%');
    assert.equal(await page.locator('[data-excess="evadeBoss"]').textContent(),'6,2 százalékpont');
    await page.locator('#stat-crit').fill('65');assert.equal(await page.locator('[data-effective="crit"]').textContent(),'50%');assert.equal(await page.locator('[data-excess="crit"]').textContent(),'15 százalékpont');
    await page.locator('#stat-reduction').fill('100');assert.equal(await page.locator('[data-effective="reduction"]').textContent(),'75%');
    await page.locator('#stat-evade').fill('100');assert.equal(await page.locator('[data-effective="evadeNormal"]').textContent(),'30%');assert.equal(await page.locator('[data-excess="evadeBoss"]').textContent(),'88 százalékpont');
    for(const value of ['', '-5', 'abc']){await page.locator('#stat-crit').fill(value);assert.equal(await page.locator('#stat-crit').getAttribute('aria-invalid'),'true');assert(!await page.locator('[data-stat-result="crit"]').textContent().then(text=>/NaN|Infinity/.test(text)));}
    await page.locator('#stat-reset').click();
    const reward=async key=>(await page.locator(`[data-reward-result="${key}"]`).textContent()).replace(/\s/g,'');
    assert.equal(await page.locator('#reward-details').getAttribute('open'),null);
    assert.equal(await page.locator('[data-reward-result="effective"]').count(),1);
    assert.equal(await page.locator('[data-reward-result]').count(),5);
    assert.equal(await reward('total'),'96,4%');assert.equal(await reward('effective'),'96,4%');assert.equal(await reward('lost'),'0százalékpont');
    await page.locator('#reward-details > summary').click();
    const component=async key=>(await page.locator(`[data-reward-component="${key}"]`).textContent()).replace(/\s/g,'');
    assert.equal(await component('equipment'),'48,5%');assert.equal(await component('other'),'47,9%');assert.equal(await component('normal'),'71,4%');assert.equal(await component('paid'),'25%');
    await page.locator('#reward-imperial').uncheck();assert.equal(await reward('total'),'71,4%');assert.equal(await reward('effective'),'71,4%');
    await page.locator('#reward-imperial').check();
    await page.locator('#reward-nyang-example').click();assert.equal(await reward('total'),'139,6%');assert.equal(await reward('effective'),'120%');assert.equal(await reward('lost'),'19,6százalékpont');
    assert.equal(await component('normal'),'119,6%');assert.equal(await component('normal-effective'),'100%');assert.equal(await component('paid-effective'),'20%');
    await page.locator('#reward-potionsCoins').fill('40');assert.equal(await reward('total'),'179,6%');assert.equal(await reward('effective'),'150%');assert.equal(await reward('lost'),'29,6százalékpont');assert.equal(await reward('special'),'50/50százalékpont');
    await page.locator('#reward-example').click();
    await page.locator('#reward-pets').fill('0');await page.locator('#reward-guild').fill('0');await page.locator('#reward-equipment').fill('95');await page.locator('#reward-potionsNyang').fill('20');
    assert.equal(await reward('effective'),'125%');assert.equal(await reward('lost'),'15százalékpont');
    await page.locator('#reward-potionsNyang').fill('0');await page.locator('#reward-potionsCoins').fill('20');assert.equal(await reward('effective'),'140%');assert.equal(await reward('lost'),'0százalékpont');
    await page.locator('#reward-equipment').fill('100');await page.locator('#reward-potionsCoins').fill('40');assert.equal(await reward('total'),'165%');assert.equal(await reward('effective'),'150%');assert.equal(await reward('lost'),'15százalékpont');
    await page.locator('#reward-equipment').fill('60');assert.equal(await reward('total'),'125%');assert.equal(await reward('effective'),'110%');assert.equal(await reward('lost'),'15százalékpont');
    await page.locator('[data-reward-stat="drop"]').click();await page.locator('#reward-equipment').fill('120');assert.equal(await reward('effective'),'110%');assert.equal(await reward('lost'),'20százalékpont');
    await page.locator('#reward-equipment').fill('-1');assert.equal(await page.locator('#reward-equipment').getAttribute('aria-invalid'),'true');assert.equal(await page.locator('[data-reward-result]').count(),0);
    await page.locator('#reward-example').click();
    assert.match(await page.locator('#critical-results').textContent(),/soft-cap/i);
    assert.equal(await page.locator('[data-critical-result]').count(),0,'Unknown new soft-cap must not display old final damage');
    await page.locator('#critical-example').click();assert.equal(await page.locator('#critical-weapon-table tbody tr').count(),6);
    await page.locator('#critical-weapon-level').fill('54');await page.locator('[data-critical-band="5"][data-critical-tier="4"]').click();assert.equal(await page.locator('#stat-criticalBonus').inputValue(),'44,8');
    await page.locator('#stat-reset').click();await page.locator('#stat-crit').fill('42');
    await showNav();await page.locator('#atlas-nav [data-atlas-page="bonuses"]').click();await page.locator('#bonus-catalog-title').waitFor();assert.equal(await page.locator('.bonus-catalog tbody tr').count(),20);
    for(const [pool,count] of [['weapon',5],['armor',5],['jewel',10]]){await page.locator('#bonus-pool').selectOption(pool);assert.equal(await page.locator('.bonus-pool-chips .atlas-chip').count(),count);}
    assert.equal(await page.locator('.bonus-source-documentation tbody tr').count(),11);assert.equal(await reward('effective'),'96,4%');
    const weaponId=await page.evaluate(()=>window.STONESTORM_ATLAS.items.find(item=>item.slot==='weapon').id);
    await page.evaluate(id=>location.hash='#atlas/equipment/item/'+id,weaponId);await page.locator('[data-detail-tab="bonuses"]').click();await page.locator('.bonus-item-info').waitFor();assert((await page.locator('.bonus-item-info').textContent()).includes('Kritikus sebzés'));
    await page.locator('.bonus-item-info a').click();await page.locator('#bonus-pool').waitFor();assert.equal(await page.locator('#bonus-pool').inputValue(),'weapon');
    const helmetId=await page.evaluate(()=>window.STONESTORM_ATLAS.items.find(item=>item.slot==='helmet').id);
    await page.evaluate(id=>location.hash='#atlas/equipment/item/'+id,helmetId);await page.locator('[data-detail-tab="bonuses"]').click();await page.locator('.bonus-item-info').waitFor();assert((await page.locator('.bonus-item-info').textContent()).includes('nincs igazolt'));
    await page.locator('.bonus-item-info a').click();await page.locator('[data-bonus-slot-context]').waitFor();assert((await page.locator('[data-bonus-slot-context]').textContent()).includes('nincs igazolt altípus'));
    await page.evaluate(()=>location.hash='#atlas/bonuses?slot=__proto__');await page.waitForTimeout(20);assert(await page.locator('#bonus-pool').isVisible());
    await showNav();await page.locator('#atlas-nav [data-atlas-page="gallery"]').click();await page.locator('.catalog-card').first().waitFor();
    await showNav();await page.locator('#atlas-nav [data-atlas-page="stat-limits"]').click();await page.locator('#stat-crit').waitFor();assert.equal(await page.locator('#stat-crit').inputValue(),'42');
    await page.locator('#stat-reset').click();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' vízszintes túlcsordulás');
    assert(await page.locator('.stat-limit-track').evaluateAll(elements=>elements.every(element=>element.firstElementChild.getBoundingClientRect().width<=element.getBoundingClientRect().width+1)));
    await page.locator('.stat-calculator').scrollIntoViewIfNeeded();
    const screenshots=path.join(root,'.integration/browser-qa');fs.mkdirSync(screenshots,{recursive:true});
    await page.locator('.stat-calculator').screenshot({path:path.join(screenshots,'stat-'+name+'.png')});
    await page.locator('.critical-calculator').screenshot({path:path.join(screenshots,'critical-'+name+'.png')});
    if(await page.locator('#reward-details').getAttribute('open')!==null)await page.locator('#reward-details > summary').click();
    await page.locator('.reward-calculator').screenshot({path:path.join(screenshots,'reward-'+name+'.png')});
    assert.equal(errors.length,0,errors.join('\n'));
    console.log(`Chromium ${name} ${width}×${height}: 20 bónusz, külön poolok, 96,4 XP, 139,6 nyang, 100/50 caps, 16 stat, kritikus rendszer és mobil-túlcsordulás rendben.`);
    await context.close();
  }
}finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
