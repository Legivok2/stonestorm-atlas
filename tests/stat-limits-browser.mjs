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
    assert.equal(await page.locator('.stat-limit-table tbody tr').count(),9);
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
    const result=async key=>(await page.locator(`[data-critical-result="${key}"]`).textContent()).replace(/\s/g,'');
    await page.locator('#critical-example').click();assert.equal(await result('multiplier'),'1,90×');assert.equal(await result('hit'),'19000');assert.equal(await result('average'),'14500');
    await page.locator('#stat-criticalBonus').fill('+40');await page.locator('#stat-criticalGear').fill('+0');assert.equal(await result('multiplier'),'1,90×');
    await page.locator('#stat-criticalNormal').fill('10 000');await page.locator('#stat-criticalChance').fill('65');await page.locator('#stat-criticalGear').fill('60');
    assert.equal(await result('total'),'+100%');assert.equal(await result('effective'),'+75%');assert.equal(await result('excess'),'25százalékpont');assert.equal(await result('multiplier'),'2,25×');assert.equal(await result('chance'),'50%');assert.equal(await result('chance-excess'),'15százalékpont');assert.equal(await result('average'),'16250');
    await page.locator('#stat-criticalGear').fill('');await page.locator('#stat-criticalBonus').fill('-10');assert.equal(await result('multiplier'),'1,50×');assert.equal(await result('effective'),'+0%');
    await page.locator('#stat-criticalChance').fill('-1');assert.equal(await page.locator('#stat-criticalChance').getAttribute('aria-invalid'),'true');assert.equal(await page.locator('[data-critical-result]').count(),0);
    await page.locator('#critical-example').click();assert.equal(await page.locator('#critical-weapon-table tbody tr').count(),6);assert.equal(await page.locator('.critical-tier').count(),30);
    await page.locator('#critical-weapon-level').fill('54');await page.locator('[data-critical-band="5"][data-critical-tier="4"]').click();assert.equal(await page.locator('#stat-criticalBonus').inputValue(),'44,8');assert.equal(await result('hit'),'19480');
    for(const [level,bonus] of [[1,'40'],[14,'40'],[15,'40'],[25,'40'],[26,'41,2'],[36,'41,2'],[37,'42,4'],[45,'42,4'],[46,'43,6'],[53,'43,6'],[54,'44,8'],[60,'44,8']]){await page.locator('#critical-weapon-level').fill(String(level));assert.equal(await page.locator('#stat-criticalBonus').inputValue(),bonus,String(level));}
    for(const level of ['0','61','2.5','']){await page.locator('#critical-weapon-level').fill(level);assert.equal(await page.locator('#critical-weapon-level').getAttribute('aria-invalid'),'true');assert.equal(await page.locator('.critical-tier:disabled').count(),30);}
    await page.locator('#critical-example').click();
    await page.locator('#stat-reset').click();await page.locator('#stat-crit').fill('42');
    await page.locator('#atlas-nav [data-atlas-page="gallery"]').click();await page.locator('.catalog-card').first().waitFor();
    await page.locator('#atlas-nav [data-atlas-page="stat-limits"]').click();await page.locator('#stat-crit').waitFor();assert.equal(await page.locator('#stat-crit').inputValue(),'42');
    await page.locator('#stat-reset').click();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' vízszintes túlcsordulás');
    assert(await page.locator('.stat-limit-track').evaluateAll(elements=>elements.every(element=>element.firstElementChild.getBoundingClientRect().width<=element.getBoundingClientRect().width+1)));
    await page.locator('.stat-calculator').scrollIntoViewIfNeeded();
    const screenshots=path.join(root,'.integration/browser-qa');fs.mkdirSync(screenshots,{recursive:true});
    await page.locator('.stat-calculator').screenshot({path:path.join(screenshots,'stat-'+name+'.png')});
    await page.locator('.critical-calculator').screenshot({path:path.join(screenshots,'critical-'+name+'.png')});
    assert.equal(errors.length,0,errors.join('\n'));
    console.log(`Chromium ${name} ${width}×${height}: navigáció, 9 stat, kritikus példa, külön limitek, minden fegyversávhatár, hibás bevitel, állapotmegőrzés és túlcsordulás rendben.`);
    await context.close();
  }
}finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
