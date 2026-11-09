import path from 'node:path';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {root} from '../scripts/publication-plan.mjs';
import {createPreview} from '../scripts/serve-pages.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH??=path.join(root,'.integration/browser-qa/browsers');
const {chromium}=await import(pathToFileURL(path.join(root,'.integration/browser-qa/node_modules/playwright/index.mjs')));
let server,base=process.env.ATLAS_BROWSER_BASE_URL;
if(!base){server=createPreview(path.join(root,'dist'));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port+'/stonestorm-atlas/';}
const browser=await chromium.launch({headless:true}),key='stonestorm.atlas.addon-version.v1';
try{
  const release=await(await fetch(base+'downloads/stat-addon.json')).json();
  for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844],['small-mobile',320,760]]){
    const context=await browser.newContext({viewport:{width,height},isMobile:width<680,hasTouch:width<680},),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'#atlas/stat-limits',{waitUntil:'networkidle'});
    const button=page.locator('#stat-addon-toggle'),panel=page.locator('#stat-addon-panel');assert(await button.isVisible());assert(!await panel.isVisible());
    await button.click();await panel.waitFor({state:'visible'});assert.equal(await page.locator('#stat-addon-version').textContent(),'v'+release.version);
    assert.equal(await page.locator('#stat-addon-update').isVisible(),false);
    const zipURL=await page.locator('#stat-addon-download').getAttribute('href'),zip=await context.request.get(zipURL);assert.equal(zip.status(),200);
    const bytes=await zip.body();assert.equal(bytes.length,release.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),release.sha256);
    const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#stat-addon-download').click()]);
    assert.equal(download.suggestedFilename(),'stonestorm-statcap-overlay-'+release.version+'.zip');assert.equal(await download.failure(),null);
    const downloaded=fs.readFileSync(await download.path());assert.equal(createHash('sha256').update(downloaded).digest('hex'),release.sha256);
    await panel.locator('details').first().locator('summary').click();
    await page.locator('#stat-addon-installed-input').fill('bad');await page.locator('#stat-addon-version-form button[type=submit]').click();assert.equal(await page.locator('#stat-addon-installed-input').getAttribute('aria-invalid'),'true');
    await page.locator('#stat-addon-installed-input').fill('0.9.2');await page.locator('#stat-addon-version-form button[type=submit]').click();assert(await page.locator('#stat-addon-update').isVisible());assert.match(await page.locator('#stat-addon-update').textContent(),/🔔 Új verzió elérhető!/);
    await page.reload({waitUntil:'networkidle'});assert(await page.locator('#stat-addon-indicator').isVisible());await button.click();
    await panel.locator('details').first().locator('summary').click();await page.locator('#stat-addon-installed').click();assert(!await page.locator('#stat-addon-update').isVisible());
    assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).version,key),release.version);
    await page.locator('#stat-addon-close').click();assert(!await panel.isVisible());assert(await button.evaluate(el=>el===document.activeElement));
    await button.click();await page.keyboard.press('Escape');assert(!await panel.isVisible());
    await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.locator('#back-top').waitFor({state:'visible'});
    const launch=await button.boundingBox(),back=await page.locator('#back-top').boundingBox();assert(launch.y>=back.y+back.height,'A két jobb alsó vezérlő nem fedheti egymást.');
    await button.click();const bounds=await panel.boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=width+1&&bounds.y>=0&&bounds.y+bounds.height<=height+1,name+' panel bounds');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' overflow');
    await panel.evaluate(el=>el.scrollTop=0);const dir=path.join(root,'.integration/browser-qa');fs.mkdirSync(dir,{recursive:true});await page.screenshot({path:path.join(dir,'addon-'+name+'.png')});
    assert.equal(errors.length,0,errors.join('\n'));console.log(`Addon Chromium ${name}: panel, ZIP-letöltés/hash, verziójelzés, kézi visszaigazolás, fókusz és elrendezés rendben.`);await context.close();
  }
  // Az új GitHub-kiadást az azonos eredetű verzióadat megváltozásával modellezzük; nem írunk az éles szerverre.
  const context=await browser.newContext(),page=await context.newPage();let remote=release,fail=false;
  await page.route('**/downloads/stat-addon.json?*',route=>fail?route.abort():route.fulfill({json:remote}));
  await page.goto(base,{waitUntil:'networkidle'});await page.locator('#stat-addon-toggle').click();
  remote={...release,version:'0.9.10'};await page.locator('#stat-addon-check').click();await page.locator('#stat-addon-check').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.getElementById('stat-addon-version').textContent==='v0.9.10');assert(await page.locator('#stat-addon-update').isVisible());
  remote={...release,zip:'https://example.com/wrong.zip'};await page.locator('#stat-addon-check').click();await page.waitForFunction(()=>document.getElementById('stat-addon-check-status').textContent.includes('nem sikerült'));
  assert.match(await page.locator('#stat-addon-download').getAttribute('href'),/stonestorm-statcap-overlay\.zip/);assert.equal(await page.locator('#stat-addon-version').textContent(),'v0.9.10');
  fail=true;await page.locator('#stat-addon-check').click();await page.waitForFunction(()=>!document.getElementById('stat-addon-check').disabled);assert(await page.locator('#stat-addon-download').isVisible());await context.close();
  const blocked=await browser.newContext();await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('Storage blocked');}}));
  const fallback=await blocked.newPage();await fallback.goto(base,{waitUntil:'networkidle'});await fallback.locator('#stat-addon-toggle').click();assert(await fallback.locator('#stat-addon-download').isVisible());await blocked.close();
  console.log('Új kiadás (0.9.10), hibás kiadási adat, hálózati hiba és tiltott helyi tárolás: rendben.');
}finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
