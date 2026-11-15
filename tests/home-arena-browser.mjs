import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {root} from '../scripts/publication-plan.mjs';
import {createPreview} from '../scripts/serve-pages.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH=path.join(root,'.integration/browser-qa/browsers');
const {chromium}=await import(pathToFileURL(path.join(root,'.integration/browser-qa/node_modules/playwright/index.mjs')));
const server=createPreview(path.join(root,'dist'));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+'/stonestorm-atlas/',browser=await chromium.launch({headless:true});
const api=JSON.parse(fs.readFileSync(path.join(root,'data/atlas.json'))).homeArena.api;
try{
  for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844],['small-mobile',320,760]]){
    const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'#atlas/arena',{waitUntil:'networkidle'});assert(await page.locator('#atlas-nav a[href="#atlas/arena"]').count());
    assert.equal(await page.locator('.system-mode').count(),2);assert.match(await page.locator('.system-mode').first().textContent(),new RegExp('Tiszta aréna.*'+api.pureLevel,'s'));assert.match(await page.locator('.system-mode').last().textContent(),new RegExp('Bandita Liga.*'+api.banditLevel,'s'));
    for(const section of await page.locator('.system-section').all())await section.locator(':scope > summary').click();
    assert(!await page.locator('#atlas-screen').textContent().then(t=>t.includes('{{')));
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.locator('#atlas-screen h3').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(root,'.integration/browser-qa/arena-v2-'+name+'.png')});
    await page.evaluate(()=>location.hash='#atlas/home');await page.locator('#system-furniture-query').waitFor({state:'attached'});
    assert.equal(await page.locator('#atlas-screen .atlas-card').count(),14,'A kutatások megmaradnak');
    const section=page.locator('.system-section').filter({has:page.locator('summary',{hasText:'Berendezés, bútorok és szettek'})});await section.locator(':scope > summary').click();
    assert.equal(await page.locator('.system-furniture-grid article').count(),12);
    await page.locator('[data-system-page="1"]').click();assert.equal(await page.locator('.system-furniture-grid article').count(),12);
    await page.locator('#system-furniture-query').fill('Faláda');assert.equal(await page.locator('.system-furniture-grid article').count(),1);
    assert.match(await page.locator('.system-furniture-grid').textContent(),/Faláda/);
    const image=page.locator('.system-furniture-grid img');assert.equal(await image.count(),1);await image.evaluate(im=>im.complete?Promise.resolve():new Promise(resolve=>{im.onload=resolve;im.onerror=resolve;}));assert(await image.evaluate(im=>im.naturalWidth>0));
    for(const details of await page.locator('.system-section').all())if(await details.getAttribute('open')===null)await details.locator(':scope > summary').click();
    assert(!await page.locator('#atlas-screen').textContent().then(t=>t.includes('{{')));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.locator('#atlas-screen h3').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(root,'.integration/browser-qa/home-v2-'+name+'.png')});
    assert.deepEqual(errors,[]);console.log(name+': külön Aréna-módok, Otthon-szekciók, 14 kutatás, lapozható képes bútorkatalógus és tördelés rendben.');await context.close();
  }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
