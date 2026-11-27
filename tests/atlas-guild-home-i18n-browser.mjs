import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {root} from '../scripts/publication-plan.mjs';
import {createPreview} from '../scripts/serve-pages.mjs';

process.env.PLAYWRIGHT_BROWSERS_PATH??=path.join(root,'.integration/browser-qa/browsers');
const {chromium}=await import(pathToFileURL(path.join(root,'.integration/browser-qa/node_modules/playwright/index.mjs')));
const server=createPreview(process.env.ATLAS_GUILD_HOME_BROWSER_ROOT??root);
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+'/stonestorm-atlas/';
const browser=await chromium.launch({headless:true});
try{
  for(const width of [375,1440]){
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[],missingTranslations=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='warning'&&message.text().startsWith('Missing or outdated home translation:'))missingTranslations.push(message.text());});
    await page.goto(base+'#atlas/guild',{waitUntil:'networkidle'});
    const snapshot=await page.evaluate(()=>{const {guild,home,homeArena,homeObservations,research}=window.STONESTORM_ATLAS;return JSON.stringify({guild,home,homeArena,homeObservations,research});});
    assert.match(await page.locator('#atlas-screen').innerText(),/Céhes fejlesztési kalkulátor/);
    await page.locator('[name=current]').fill('5');
    await page.locator('[name=target]').fill('12');
    await page.locator('[name=remaining]').fill('3.5');
    const values=await page.locator('#atlas-guild-output dd').allTextContents();
    assert.equal(values[0],'7');
    await page.locator('#atlas-language [data-atlas-language=en]').click();
    assert.equal(await page.locator('[name=current]').inputValue(),'5');
    assert.equal(await page.locator('[name=target]').inputValue(),'12');
    assert.equal(await page.locator('[name=remaining]').inputValue(),'3.5');
    assert.match(await page.locator('#atlas-guild-output').innerText(),/Upgrade steps/);
    const resultEn=await page.locator('#atlas-guild-output dd').allTextContents();
    assert.deepEqual(resultEn.slice(0,1),values.slice(0,1));
    assert.match(resultEn[1],/126/);
    assert.match(await page.locator('#atlas-building-cards').innerText(),/Headquarters/);
    await page.locator('#atlas-building-cards a[href="#atlas/guild/building/hq"]').click();
    await page.locator('#atlas-detail-title').getByText('Headquarters').waitFor();
    assert.match(await page.locator('#atlas-detail').innerText(),/Guild member capacity/);
    await page.locator('#atlas-detail [data-atlas-language=hu]').click();
    assert.equal(await page.locator('#atlas-detail-title').textContent(),'Főhadiszállás');
    assert.equal(await page.locator('[name=target]').inputValue(),'12');
    await page.locator('#atlas-detail-close').click();
    await page.locator('#atlas-detail[open]').waitFor({state:'hidden'});
    await page.locator('#atlas-search').fill('Headquarters');
    await page.locator('#atlas-search-category').selectOption('guild');
    assert.equal(await page.locator('.atlas-card h4').first().textContent(),'Főhadiszállás');
    await page.locator('#atlas-language [data-atlas-language=en]').click();
    await page.locator('#atlas-search').fill('Főhadiszállás');
    assert.equal(await page.locator('.atlas-card h4').first().textContent(),'Headquarters');
    await page.goto(base+'#atlas/home',{waitUntil:'networkidle'});
    assert.match(await page.locator('.home-cover').innerText(),/Your first home/);
    const furniture=page.locator('[data-home-section=furnitureSection]');
    await furniture.locator('summary').click();
    await page.locator('#system-furniture-query').fill('Faláda');
    assert.match(await page.locator('#system-furniture-results').innerText(),/Wooden Chest/);
    await page.locator('#atlas-language [data-atlas-language=hu]').click();
    assert.equal(await furniture.getAttribute('open'),'');
    assert.equal(await page.locator('#system-furniture-query').inputValue(),'Faláda');
    assert.match(await page.locator('#system-furniture-results').innerText(),/Faláda/);
    await page.locator('#system-furniture-query').fill('Wooden Chest');
    assert.match(await page.locator('#system-furniture-results').innerText(),/Faláda/);
    await page.locator('#system-furniture-query').fill('');
    await page.locator('[data-system-page="1"]').click();
    assert.match(await page.locator('#system-furniture-results').innerText(),/2 \/ 5/);
    await page.locator('#atlas-language [data-atlas-language=en]').click();
    assert.match(await page.locator('#system-furniture-results').innerText(),/2 \/ 5/);
    await page.locator('[data-home-section=tiersSection] summary').click();
    assert.match(await page.locator('[data-home-section=tiersSection]').innerText(),/45,930,500 Nyang · 32 hours/);
    await page.locator('#atlas-language [data-atlas-language=hu]').click();
    assert.match((await page.locator('[data-home-section=tiersSection]').innerText()).replace(/\s/g,''),/45[ . ]?930[ . ]?500nyang·32óra/);
    assert.equal(await page.locator('.home-tier-card').count(),8);
    assert.equal(await page.locator('.home-room-card').count(),4);
    assert.match(await page.locator('#atlas-screen').innerText(),/Kutatások · 14 lépés/);
    await page.goto(base+'#atlas/home/research/wolf',{waitUntil:'networkidle'});
    assert.equal(await page.locator('#atlas-detail-title').textContent(),'Kőerezet a fogban');
    await page.locator('[data-detail-tab=bonuses]').click();
    assert.match(await page.locator('#folio-panel-bonuses').innerText(),/2%/);
    await page.locator('#atlas-detail [data-atlas-language=en]').click();
    assert.equal(await page.locator('#atlas-detail-title').textContent(),'Stone Veins in the Fang');
    assert.equal(await page.locator('[data-detail-tab=bonuses]').getAttribute('aria-selected'),'true');
    assert.match(await page.locator('#folio-panel-bonuses').innerText(),/Damage bonus/);
    assert.match(await page.locator('#folio-panel-bonuses').innerText(),/2%/);
    await page.locator('[data-detail-tab=acquisition]').click();
    await page.locator('#folio-panel-acquisition a[href="#atlas/world/mob/m1_wolf"]').click();
    await page.locator('#atlas-detail-title').getByText('Wolf').waitFor();
    await page.goto(base+'#atlas/home',{waitUntil:'networkidle'});
    await page.locator('#atlas-search').fill('Kőerezet a fogban');
    await page.locator('#atlas-search-category').selectOption('home');
    assert.equal(await page.locator('.atlas-card h4').first().textContent(),'Stone Veins in the Fang');
    const coverage=await page.evaluate(async()=>{
      const failures=[],db=window.STONESTORM_ATLAS,i18n=window.AtlasI18n;
      const records=[...db.guild.buildings.map(x=>({kind:'building',page:'guild',id:x.kind,name:x.nameHu})),...db.research.map(x=>({kind:'research',page:'home',id:x.id,name:x.name}))];
      for(const record of records){
        const hash=`#atlas/${record.page}/${record.kind}/${record.id}`;
        if(location.hash!==hash){const changed=new Promise(resolve=>window.addEventListener('hashchange',resolve,{once:true}));location.hash=hash;await changed;}
        for(const locale of ['hu','en']){
          i18n.setLocale(locale);
          const key=i18n.gameNameKey(record.kind,record);
          if(!key||document.querySelector('#atlas-detail-title')?.textContent!==i18n.dictionaries[locale][key])failures.push(record.id+' '+locale);
          if(record.kind==='building'){
            const building=db.guild.buildings.find(x=>x.kind===record.id);
            const rows=[...document.querySelectorAll('#folio-panel-overview tbody tr')];
            const number=n=>i18n.formatNumber(n,{maximumFractionDigits:2});
            if(rows.length!==building.levels.length)failures.push(record.id+' row count');
            building.levels.forEach((level,index)=>{
              const cells=[...rows[index].children].map(cell=>cell.textContent.trim());
              const effect=number(level.effect)+(level.effectUnit==='members'?' '+i18n.t('guild.members'):'%');
              const speed=number(window.StonestormMath.speedup(level.upgradeHoursToLevel,level.level,db.economy.limits.guildSpeedup))+' '+i18n.t('guild.coins');
              if(cells[0]!==number(level.level)||cells[1]!==effect||cells[2]!==number(level.upgradeHoursToLevel)+' '+i18n.t('guild.hours')||cells[3]!==speed)failures.push(record.id+' level '+level.level+' '+locale);
            });
          }else{
            const research=db.research.find(x=>x.id===record.id),[stat,value]=Object.entries(research.reward)[0];
            const bonus=document.querySelector('#folio-panel-bonuses').textContent;
            if(!bonus.includes(i18n.t('stat.'+stat))||!bonus.includes(i18n.formatNumber(value*100,{maximumFractionDigits:2})+'%'))failures.push(record.id+' reward '+locale);
          }
        }
      }
      return failures;
    });
    assert.deepEqual(coverage,[]);
    assert.equal(await page.evaluate(()=>{const {guild,home,homeArena,homeObservations,research}=window.STONESTORM_ATLAS;return JSON.stringify({guild,home,homeArena,homeObservations,research});}),snapshot);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'document overflow at '+width);
    assert.deepEqual(errors,[]);
    assert.deepEqual(missingTranslations,[]);
    await context.close();
    console.log(width+' px: guild, home, research, bilingual search, state and values verified');
  }
}finally{
  await browser.close();
  server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
}
