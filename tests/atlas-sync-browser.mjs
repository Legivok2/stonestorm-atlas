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
    assert.equal(await page.locator('#atlas-sync-state code:visible').count(),0,'Nyers JSON-útvonal nem lehet alapértelmezésben látható');
    assert.equal(await page.locator('.sync-metrics article').count(),5);
    // A friss, változatlan ellenőrzés nem számíthatja új importnak a régi lezárásokat.
    const snapshot=JSON.parse(fs.readFileSync(path.join(root,'data/sync-status.json')));
    assert.equal(await page.locator('[data-sync-group="processed"]').count(),snapshot.processedGroups.length);
    const archive=page.locator('details.sync-section').filter({has:page.locator('summary',{hasText:'Korábban lezárt tételek és bizonyítékaik'})});
    assert.equal(await archive.count(),1);
    await archive.locator(':scope > summary').click();
    const dungeonGroup=archive.locator('[data-sync-group="resolved"]').filter({has:page.locator('summary strong', {hasText:'Kazamaták'})});
    assert.equal(await dungeonGroup.count(),1);
    await dungeonGroup.locator(':scope > summary').click();
    assert.equal(await dungeonGroup.locator('.sync-topic').count(),snapshot.resolvedGroups.find(g=>g.name==='Kazamaták').topics.length);
    assert.equal(await page.locator('#atlas-sync-state code:visible').count(),0,'A rendszer kinyitása még nem mutathat technikai útvonalat');
    await dungeonGroup.locator('.sync-technical > summary').first().click();
    assert(await dungeonGroup.locator('code:visible').count()>0);
    assert.match(await dungeonGroup.textContent(),/validated-dungeon-stats-v1/);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await dungeonGroup.locator('.sync-technical > summary').first().click();
    await dungeonGroup.locator(':scope > summary').click();
    await archive.locator(':scope > summary').click();
    await page.locator('#atlas-screen h3').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(root,'.integration/browser-qa/auto-sync-'+name+'.png'),fullPage:false});
    for(const route of ['pets','stat-limits','planner','sets','updates']){
      await page.evaluate(hash=>location.hash='#atlas/'+hash,route);
      await page.waitForFunction(expected=>document.querySelector('#atlas-nav a[aria-current="page"]')?.getAttribute('href')==='#atlas/'+expected,route);
    }
    const expected=JSON.parse(fs.readFileSync(path.join(root,'data/atlas.json')));
    const num=v=>new Intl.NumberFormat('hu-HU',{maximumFractionDigits:2}).format(v);
    for(const dungeon of expected.dungeons){
      await page.evaluate(id=>location.hash='#atlas/world/dungeon/'+id,dungeon.id);
      await page.locator('#atlas-detail[open]').waitFor();
      const rows=page.locator('#atlas-detail-body .atlas-related').filter({hasText:'Hősi termek'}).first().locator('tbody tr');
      assert.equal(await rows.count(),10);
      const exact=v=>new Intl.NumberFormat('hu-HU',{useGrouping:false,maximumFractionDigits:20}).format(v);
      for(const [index,room] of dungeon.heroic.rooms.entries()){
        const cells=await rows.nth(index).locator('td').allTextContents();
        assert.deepEqual([cells[0],...cells.slice(3)].map(s=>s.replace(/\s/g,'')),[room.room,room.level,num(room.maxHp),num(room.atkMin)+'–'+num(room.atkMax),exact(room.def),num(room.harcero),num(room.xp),num(room.nyang)].map(x=>String(x).replace(/\s/g,'')));
      }
      await page.locator('#atlas-detail-close').click();
    }
    await page.evaluate(()=>location.hash='#atlas/updates');
    // A dokumentált lezárás nem engedhet HTML-beszúrást a technikai részletekből.
    const state=JSON.parse(fs.readFileSync(path.join(root,'data/sync-status.json')));
    state.groups[0].name='<img src=x onerror="window.syncInjected=true">';
    await page.route('**/sync-status.json',route=>route.fulfill({json:state}));
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.evaluate(()=>window.syncInjected),undefined);
    assert(await page.locator('#atlas-sync-state').textContent().then(t=>t.includes('<img src=x')));
    await page.unroute('**/sync-status.json');
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
