import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {root} from '../scripts/publication-plan.mjs';
import {createPreview} from '../scripts/serve-pages.mjs';
import {watchContent,watcherBootstrap,packWatcher} from '../scripts/future-content-watcher.mjs';

process.env.PLAYWRIGHT_BROWSERS_PATH=path.join(root,'.integration/browser-qa/browsers');
const {chromium}=await import(pathToFileURL(path.join(root,'.integration/browser-qa/node_modules/playwright/index.mjs')));
const output=path.join(root,'.integration/future-watcher-v1');fs.mkdirSync(output,{recursive:true});
const live=JSON.parse(fs.readFileSync(path.join(root,'data/future-content.json'))),api=JSON.parse(fs.readFileSync(path.join(root,'snapshots/future/content.json')));
const server=createPreview(path.join(root,'dist'));await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port+'/stonestorm-atlas/',browser=await chromium.launch({headless:true});
try{
  for(const width of [1440,390]){
    const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'#atlas/upcoming',{waitUntil:'networkidle'});await page.locator('#future-content-root').waitFor();
    assert.equal(await page.locator('[data-future-metric="maxLevel"]').textContent(),String(live.summary.maxLevel));
    for(const key of ['equipmentMaxLevel','xpEntries','mapCount','dungeonCount','maxTier'])assert.equal(await page.locator('[data-future-metric="'+key+'"]').textContent(),String(live.summary[key]));
    assert.match(await page.locator('#future-content-root').textContent(),/Nincs új, igazolt hivatalos bejelentés/);
    assert.equal(await page.locator('.future-card').count(),live.observations.filter(x=>x.potential&&!x.legacy).length);
    await page.locator('#future-category').selectOption('features');await page.locator('#future-query').fill('bossReact');assert.equal(await page.locator('.future-card').count(),1);
    await page.locator('.future-source > summary').click();assert.match(await page.locator('.future-source').textContent(),/\/features\/bossReact/);
    await page.locator('#future-query').fill('nincs-ilyen-megfigyeles');assert.equal(await page.locator('.future-empty').count(),1);
    await page.locator('#future-query').fill('');await page.locator('#future-category').selectOption('all');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);
    await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(output,'upcoming-'+width+'.png')});await page.close();
  }
  // Synthetic evidence is isolated to intercepted browser responses, never saved as live data.
  const first=watchContent({content:api,now:'2026-11-20T20:00:00Z'}),next=structuredClone(api);
  next.version='browser-fixture';next.limits.maxLevel=99;next.spine.xpTable.push(...Array(39).fill(100000));next.maps.push({...next.maps.at(-1),id:'m7',index:7,minLevel:61});next.maps=next.maps.filter(x=>x.id!=='m6');next.futureSystem={enabled:false};
  const url='https://stonestorm.gg/art/maps/fixture.webp',resources={[url]:{kind:'image-reference',observedThisCheck:true,discoveredFrom:'https://stonestorm.gg/assets/art-manifest-Fixture.js'}};
  const fixture=watchContent({content:next,previous:first,previousContent:api,resources,now:'2026-11-21T08:00:00Z',official:[{id:'fixture-news',title:'Hivatalos tesztközlemény',quote:'Browser fixture only',source:'https://stonestorm.gg/news/fixture',publishedAt:'2026-11-21T07:00:00Z'}],activationEvidence:[{category:'maps',key:'m7',kind:'game-observation',verified:true,source:'https://stonestorm.gg/',observedAt:'2026-11-21T07:00:00Z',explanation:'Tesztelt játékmegfigyelés'}]});
  const page=await browser.newPage({viewport:{width:390,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/js/future-content.js',r=>r.fulfill({contentType:'text/javascript',body:watcherBootstrap(fixture)}));
  await page.route('**/data/future-content.json',r=>r.fulfill({json:packWatcher(fixture)}));
  await page.route(url,r=>r.fulfill({status:404,body:'Unavailable fixture image'}));
  await page.goto(base+'#atlas/upcoming',{waitUntil:'networkidle'});assert.equal(await page.locator('[data-future-metric="maxLevel"]').textContent(),'99');assert.equal(await page.locator('[data-future-metric="xpEntries"]').textContent(),'99');
  for(const status of ['prepared','announced','active','uncertain','removed']){await page.locator('#future-status').selectOption(status);assert(await page.locator('.future-card').count()>0,status);for(const item of await page.locator('.future-status').all())assert((await item.getAttribute('class')).includes('status-'+status));}
  await page.locator('#future-status').selectOption('all');await page.locator('[data-future-view="history"]').click();assert.equal(await page.locator('.future-timeline').count(),1);await page.locator('#future-category').selectOption('maxLevel');assert.match(await page.locator('.future-change').textContent(),/60.*99/);
  await page.locator('.future-source > summary').click();await page.locator('.future-source details > summary').click();assert.equal(await page.locator('.future-json pre').first().textContent(),'60');assert.equal(await page.locator('.future-json pre').last().textContent(),'99');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);await page.close();
  const fallback=await browser.newPage();await fallback.route('**/data/future-content.json',r=>r.fulfill({status:503,body:'Unavailable fixture'}));await fallback.goto(base+'#atlas/upcoming',{waitUntil:'networkidle'});await fallback.locator('.future-fetch-note').waitFor();assert.equal(await fallback.locator('[data-future-metric="maxLevel"]').textContent(),String(live.summary.maxLevel));await fallback.close();
  console.log('Future Content Watcher browser: live desktop/mobile metrics and filters, source details, isolated 60→99 fixture, all five statuses, timeline old/new evidence, failed-fetch fallback, no overflow or script errors.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
