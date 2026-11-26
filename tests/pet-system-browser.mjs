/* A teljes Pages-csomag kísérőoldalai valódi Chromiumban, asztali és mobilméreten. */
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
    const context=await browser.newContext({viewport:{width,height},isMobile:width<680,hasTouch:width<680}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(r.status()+' '+r.url());});
    await page.goto(base+'#atlas/pets',{waitUntil:'networkidle'});
    assert.equal(await page.locator('.pet-progression-table tbody tr').count(),5);
    assert.equal(await page.locator('.pet-evolution tbody tr').count(),4);
    assert.equal(await page.locator('.pet-skills tbody tr').count(),10);
    assert.equal(await page.locator('#atlas-screen .atlas-card').count(),22);
    assert.match(await page.locator('.pet-source-conflict').textContent(),/10 \/ 20 \/ 35 \/ 50 \/ 60/);
    assert.match(await page.locator('.pet-progression-table tbody tr').last().textContent(),/Legendás.*50–60.*3/);
    assert(!await page.locator('.pet-skills').textContent().then(s=>/undefined|NaN|\{\{/.test(s)));
    const screenshotDir=path.join(root,'.integration/browser-qa');fs.mkdirSync(screenshotDir,{recursive:true});
    // The guide now follows the catalogue in an explicit disclosure.
    await page.locator('#pet-guide > summary').click();
    await page.locator('.pet-overview-head').screenshot({path:path.join(screenshotDir,'pets-'+name+'.png')});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' overflow');
    for(const id of ['pet_wolf','pet_u_dragon']){
      await page.evaluate(id=>location.hash='#atlas/pets/pet/'+id,id);await page.locator('[data-detail-tab="development"]').click();await page.locator('.pet-development-detail').waitFor();
      assert.match(await page.locator('.pet-development-detail h4').first().textContent(),/60/);assert(!await page.locator('#atlas-detail-body').textContent().then(s=>/Kísérő maximumszint \(rules\)/.test(s)));
      await page.locator('#atlas-detail-close').click();
    }
    const skills=await page.evaluate(()=>Object.keys(window.STONESTORM_ATLAS.petSkills));
    for(const id of skills){
      await page.evaluate(id=>location.hash='#atlas/pets/skill/'+id,id);await page.locator('#atlas-detail[open]').waitFor();
      assert.equal(await page.locator('#atlas-detail-body tbody tr').count(),5,id);
      assert(!await page.locator('#atlas-detail-body').textContent().then(s=>/undefined|NaN|\{\{/.test(s)),id);
      await page.locator('#atlas-detail-close').click();
    }
    await page.evaluate(()=>location.hash='#atlas/planner');await page.locator('#planner-level').waitFor();
    await page.locator('#planner-level').fill('60');await page.locator('#planner-level').dispatchEvent('change');
    await page.locator('#planner-pet').selectOption('pet_wolf');
    await page.locator('#planner-pet-form').selectOption('5');await page.locator('#planner-pet-level').fill('60');await page.locator('#planner-pet-level').dispatchEvent('change');
    assert.equal(await page.locator('#planner-pet-level').inputValue(),'60');assert.equal(await page.locator('#planner-pet-level').getAttribute('max'),'60');
    assert.match(await page.locator('[data-planner-pet-progression]').textContent(),/3 tanulható/);
    await page.locator('#planner-share-button').click();const shared=await page.locator('#planner-share').inputValue();
    await page.goto(shared,{waitUntil:'networkidle'});assert.equal(await page.locator('#planner-pet-level').inputValue(),'60');assert.equal(await page.locator('#planner-pet-form').inputValue(),'5');
    await page.locator('#planner-save').click();await page.reload({waitUntil:'networkidle'});
    await page.locator('#planner-saved').selectOption({index:1});await page.locator('#planner-load').click();assert.equal(await page.locator('#planner-pet-level').inputValue(),'60');assert.equal(await page.locator('#planner-pet-form').inputValue(),'5');
    await page.locator('#planner-pet-form').selectOption('1');assert.equal(await page.locator('#planner-pet-level').inputValue(),'10');
    assert.match(await page.locator('[data-planner-pet-progression]').textContent(),/0 tanulható/);
    await page.locator('#planner-pet-form').selectOption('5');await page.locator('#planner-level').fill('15');await page.locator('#planner-level').dispatchEvent('change');
    assert.equal(await page.locator('#planner-pet-form').inputValue(),'2');assert.equal(await page.locator('#planner-pet-level').inputValue(),'15');
    await page.locator('#planner-level').fill('22');await page.locator('#planner-level').dispatchEvent('change');
    await page.locator('[data-pet-observed-reference="mohaagancs-adult-22"]').click();
    assert.equal(await page.locator('#planner-pet').inputValue(),'pet_u_wild');
    assert.equal(await page.locator('#planner-pet-form').inputValue(),'3');
    assert.equal(await page.locator('#planner-pet-level').inputValue(),'22');
    assert.equal(await page.locator('[data-planner-pet-skill-search]').count(),2);
    assert.equal(await page.locator('[data-planner-pet-skill-search]').nth(2).count(),0);
    assert.equal(await page.locator('.planner-pet-skill-slot.is-locked').count(),1);
    assert.equal(await page.locator('#planner-pet-rank').count(),0);
    const observed=page.locator('[data-pet-observed-details]');
    assert.equal(await observed.count(),1);
    const observedText=await observed.textContent();
    for(const text of ['Mitikus','Felnőtt','Előcsapás','Éles karom','Nyitópajzs','11/15'])assert(observedText.includes(text),`Mohaagancs-megfigyelésből hiányzik: ${text}`);
    assert.match(observedText,/57[,.]2%/);
    assert.match(observedText,/12[,.]6%/);
    assert.match(observedText,/Atlas-modal érték \+12%/);
    assert.doesNotMatch(await page.locator('.planner-pet-skill-options').first().textContent(),/undefined|NaN|\{\{/);
    const previewDir=path.join(root,'.integration','previews');fs.mkdirSync(previewDir,{recursive:true});
    await page.locator('.planner-pet-builder').screenshot({path:path.join(previewDir,`pet-builder-reference-${name}.png`)});
    const signatureExcluded=await page.locator('#pet-skill-options-1 option').evaluateAll(opts=>opts.map(o=>o.dataset.skillId));
    assert(!signatureExcluded.includes('first_strike'));
    await page.locator('[data-planner-pet-skill-search="2"]').fill('');await page.locator('[data-planner-pet-skill-search="2"]').dispatchEvent('change');
    await page.locator('[data-planner-pet-skill-search="1"]').fill('Nyitópajzs');await page.locator('[data-planner-pet-skill-search="1"]').dispatchEvent('change');
    assert.equal(await page.locator('[data-planner-pet-skill-search="1"]').inputValue(),'Nyitópajzs');
    await page.locator('[data-planner-pet-skill-search="2"]').fill('Nyitópajzs');await page.locator('[data-planner-pet-skill-search="2"]').dispatchEvent('change');
    assert.equal(await page.locator('[data-planner-pet-skill-search="2"]').inputValue(),'');
    await page.locator('[data-planner-pet-skill-search="2"]').fill('Éles karom');await page.locator('[data-planner-pet-skill-search="2"]').dispatchEvent('change');
    await page.locator('[data-planner-pet-skill-level="1"]').selectOption('5');
    assert.equal(await page.locator('[data-planner-pet-skill-level="1"]').inputValue(),'5');
    await page.locator('.planner-pet-builder').screenshot({path:path.join(previewDir,`pet-builder-v2-${name}.png`)});
    if(name==='desktop')await page.locator('.planner-pet-builder').screenshot({path:path.join(previewDir,'pet-builder-v2.png')});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' planner overflow');
    assert.equal(errors.length,0,errors.join('\n'));console.log(`Chromium ${name}: 5 forma, 4 átváltozás, 3 tanulható hely, 10 × 5 képesség, mastery 1–5 és 60-as Planner rendben.`);
    await context.close();
  }
}finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
