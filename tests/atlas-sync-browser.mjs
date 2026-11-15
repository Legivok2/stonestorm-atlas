import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createPreview} from '../scripts/serve-pages.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
process.env.PLAYWRIGHT_BROWSERS_PATH=path.join(root,'.integration/browser-qa/browsers');
const {chromium}=await import(pathToFileURL(path.join(root,'.integration/browser-qa/node_modules/playwright/index.mjs')));
let server,base=process.env.ATLAS_BROWSER_BASE_URL;
if(!base){server=createPreview(path.join(root,'dist'));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port+'/stonestorm-atlas/';}
const browser=await chromium.launch({headless:true});
try{
  for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
    const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'#atlas/updates',{waitUntil:'networkidle'});
    assert(await page.locator('#atlas-nav a[href="#atlas/updates"]').count());
    assert.match(await page.locator('#atlas-screen h3').textContent(),/Atlas frissítések/);
    assert.match(await page.locator('#atlas-sync-state').textContent(),/Utolsó sikeres adatellenőrzés/);
    assert.match(await page.locator('#atlas-sync-state').textContent(),/[a-f0-9]{12}/);
    await page.locator('#atlas-sync-state summary').click();
    assert(await page.locator('#atlas-sync-state tbody tr').count()>0);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.screenshot({path:path.join(root,'.integration/browser-qa/auto-sync-'+name+'.png'),fullPage:false});
    for(const route of ['pets','stat-limits','planner','sets','updates']){
      await page.evaluate(hash=>location.hash='#atlas/'+hash,route);
      await page.waitForFunction(expected=>document.querySelector('#atlas-nav a[aria-current="page"]')?.getAttribute('href')==='#atlas/'+expected,route);
    }
    // Sikertelen állapotlekéréskor a csomaghoz tartozó sikeres ellenőrzés marad látható.
    await page.route('**/sync-status.json',route=>route.abort());
    await page.reload({waitUntil:'networkidle'});
    await page.waitForFunction(()=>document.querySelector('#atlas-sync-state')?.textContent.includes('A friss állapot nem érhető el'));
    assert.match(await page.locator('#atlas-sync-state').textContent(),/Utolsó sikeres adatellenőrzés/);
    assert.deepEqual(errors,[]);
    console.log(name+': frissítési nézet, részletek, navigáció, túlcsordulás és hálózati fallback rendben.');
    await context.close();
  }
}finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
