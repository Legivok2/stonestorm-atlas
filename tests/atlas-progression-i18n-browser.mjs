import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {root} from '../scripts/publication-plan.mjs';
import {createPreview} from '../scripts/serve-pages.mjs';

process.env.PLAYWRIGHT_BROWSERS_PATH??=path.join(root,'.integration/browser-qa/browsers');
const {chromium}=await import(pathToFileURL(path.join(root,'.integration/browser-qa/node_modules/playwright/index.mjs')));
const server=createPreview(process.env.ATLAS_PROGRESSION_BROWSER_ROOT??root);
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+'/stonestorm-atlas/';
const browser=await chromium.launch({headless:true});
try{
  for(const width of [375,1440]){
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='warning'&&/Missing (Atlas|or outdated)/.test(message.text()))errors.push(message.text());});
    await page.goto(base+'#atlas/mechanics',{waitUntil:'networkidle'});
    const snapshot=await page.evaluate(()=>JSON.stringify({hunting:STONESTORM_ATLAS.hunting,limits:STONESTORM_ATLAS.economy.limits,classes:STONESTORM_ATLAS.classes,kingdoms:STONESTORM_ATLAS.kingdomNames,materials:STONESTORM_ATLAS.economy.stackables}));
    assert.match(await page.locator('#atlas-screen').innerText(),/XP \/ energia összehasonlító/);
    const expectedEnergy=await page.evaluate(()=>STONESTORM_ATLAS.hunting.energy.sizeCost.map((cost,i)=>(i+1)+String(cost)+String(STONESTORM_ATLAS.hunting.energy.sizeMinLevel[i])));
    assert.deepEqual(await page.locator('#atlas-screen .atlas-table').nth(1).locator('tbody tr').allTextContents(),expectedEnergy);
    for(const [field,value] of Object.entries({budget:'20',xp0:'600',energy0:'6',time0:'12'}))await page.locator(`[name=${field}]`).fill(value);
    assert.deepEqual(await page.locator('#atlas-xp-output tbody td').allTextContents(),await page.evaluate(()=>['Rövid út',...([100,3000,3,1800].map(n=>AtlasI18n.formatNumber(n,{maximumFractionDigits:2}))),'36 perc']));
    await page.locator('#atlas-language [data-atlas-language=en]').click();
    assert.match(await page.locator('#atlas-screen').innerText(),/Energy: versioned snapshot/);
    const energyRows=await page.locator('#atlas-screen .atlas-table').nth(1).locator('tbody tr').allTextContents();
    assert.deepEqual(energyRows,expectedEnergy);
    for(const [field,value] of Object.entries({budget:'20',xp0:'600',energy0:'6',time0:'12'}))assert.equal(await page.locator(`[name=${field}]`).inputValue(),value);
    assert.deepEqual(await page.locator('#atlas-xp-output tbody td').allTextContents(),['Short trip','100','3,000','3','1,800','36 minutes']);
    await page.locator('a[href="#cikk-energy"]').click();
    assert.equal(await page.locator('#cikk-energy').getAttribute('open'),'');
    await page.goto(base+'#atlas/mechanics',{waitUntil:'networkidle'});
    assert.equal(await page.locator('[name=xp0]').inputValue(),'600');
    assert.match(await page.locator('#atlas-xp-output').innerText(),/1,800/);
    await page.goto(base+'#atlas/classes',{waitUntil:'networkidle'});
    assert.match(await page.locator('#atlas-screen').innerText(),/Three kingdoms/);
    assert.match(await page.locator('#atlas-screen').innerText(),/We only step back when dancing/);
    await page.locator('#atlas-search').fill('Harcos');
    await page.locator('#atlas-search-category').selectOption('classes');
    assert.equal(await page.locator('.atlas-card h4').first().textContent(),'Warrior');
    await page.locator('.atlas-card').first().click();
    assert.equal(await page.locator('#atlas-detail-title').textContent(),'Warrior');
    await page.locator('[data-detail-tab=bonuses]').click();
    assert.match(await page.locator('#folio-panel-bonuses').innerText(),/Strength/);
    assert.match(await page.locator('#folio-panel-bonuses').innerText(),/Class skill/);
    await page.locator('#atlas-detail [data-atlas-language=hu]').click();
    assert.equal(await page.locator('#atlas-detail-title').textContent(),'Harcos');
    assert.equal(await page.locator('#atlas-search').inputValue(),'Harcos');
    assert.equal(await page.locator('#atlas-search-category').inputValue(),'classes');
    assert.equal(await page.locator('[data-detail-tab=bonuses]').getAttribute('aria-selected'),'true');
    await page.locator('#atlas-detail-close').click();
    await page.locator('#atlas-search').fill('Warrior');
    assert.equal(await page.locator('.atlas-card h4').first().textContent(),'Harcos');
    await page.goto(base+'#atlas/materials',{waitUntil:'networkidle'});
    await page.locator('#atlas-sort').selectOption('levelDesc');
    await page.locator('[data-pagination="1"]').click();
    assert.match(await page.locator('#atlas-screen .atlas-pagination span').textContent(),/2 \/ 6/);
    await page.locator('#atlas-language [data-atlas-language=en]').click();
    assert.equal(await page.locator('#atlas-sort').inputValue(),'levelDesc');
    assert.match(await page.locator('#atlas-screen .atlas-pagination span').textContent(),/2 \/ 6/);
    await page.locator('#atlas-search').fill('Kutyafog');
    await page.locator('#atlas-search-category').selectOption('materials');
    assert.equal(await page.locator('.atlas-card h4').first().textContent(),'Dog Fang');
    await page.locator('.atlas-card').first().click();
    await page.locator('#atlas-detail-title').getByText('Dog Fang').waitFor();
    assert.match(await page.locator('#atlas-detail').innerText(),/The blacksmith asks for these/);
    await page.locator('#atlas-detail [data-atlas-language=hu]').click();
    assert.equal(await page.locator('#atlas-detail-title').textContent(),'Kutyafog');
    assert.equal(await page.locator('#atlas-search').inputValue(),'Kutyafog');
    assert.equal(await page.locator('#atlas-search-category').inputValue(),'materials');
    await page.locator('#atlas-detail-close').click();
    await page.locator('#atlas-search').fill('Dog Fang');
    assert.equal(await page.locator('.atlas-card h4').first().textContent(),'Kutyafog');
    await page.goto(base+'#atlas/materials/material/egg_u_wild',{waitUntil:'networkidle'});
    await page.locator('[data-detail-tab=related]').click();
    assert(await page.locator('#folio-panel-related a[href^="#atlas/pets/pet/"]').count());
    await page.locator('#folio-panel-related a[href^="#atlas/pets/pet/"]').first().click();
    assert(await page.locator('#atlas-detail[open]').count());
    const failures=await page.evaluate(async()=>{
      const failures=[],db=window.STONESTORM_ATLAS,i18n=window.AtlasI18n;
      const records=[...db.classes.map(x=>({kind:'class',page:'classes',record:x})),...db.economy.stackables.map(x=>({kind:'material',page:'materials',record:x}))];
      for(const {kind,page,record} of records){
        const hash=`#atlas/${page}/${kind}/${record.id}`;
        if(location.hash!==hash){const changed=new Promise(resolve=>window.addEventListener('hashchange',resolve,{once:true}));location.hash=hash;await changed;}
        for(const locale of ['hu','en']){
          i18n.setLocale(locale);
          const key=i18n.gameNameKey(kind,record),expected=key?i18n.dictionaries[locale][key]:record.name??record.id;
          if(document.querySelector('#atlas-detail-title')?.textContent!==expected)failures.push(record.id+' name '+locale);
          const properties=[...document.querySelectorAll('#atlas-detail dl.atlas-properties > div')];
          const check=(label,value)=>{const entry=properties.find(row=>row.querySelector('dt')?.textContent===label);if(entry?.querySelector('dd')?.textContent!==value)failures.push(record.id+' '+label+' '+locale);};
          const number=n=>i18n.formatNumber(n,{maximumFractionDigits:2});
          if(kind==='material'){
            check(i18n.t('materials.sellPrice'),record.sellPrice==null?i18n.t('materials.unknown'):number(record.sellPrice)+' Nyang');
            const type='materials.kind.'+record.kind+'.name';
            check(i18n.t('materials.type'),i18n.dictionaries.hu[type]===db.economy.stackKindNames[record.kind]?.name?i18n.t(type):db.economy.stackKindNames[record.kind]?.name??record.kind);
          }else{
            for(const [stat,value] of Object.entries(record.baseStats))check(i18n.t('stat.'+stat),number(value));
            for(const [stat,value] of Object.entries(record.skill).filter(([stat])=>stat!=='id')){
              const percent=window.StonestormBonuses.byId[stat]?.unit==='percent'||/Mult$|Bonus$|^vs[A-Z]|^(crit|potionHeal|skillDamage|lifesteal|ignoreDef)$/.test(stat);
              check(i18n.t('stat.'+stat),number(percent?value*100:value)+(percent?'%':''));
            }
            const rows=[...document.querySelectorAll('#folio-panel-overview tbody tr')];
            if(rows.length!==record.availablePaths.length)failures.push(record.id+' paths '+locale);
            record.availablePaths.forEach((path,index)=>{
              const cells=[...rows[index].children].map(cell=>cell.textContent.trim());
              const exact=n=>i18n.formatNumber(n,{useGrouping:false,maximumFractionDigits:20});
              if(cells[0]!==i18n.t('classes.pathName.'+path.id)+' ('+path.id+')'||cells[1]!==exact(path.bookRate)||cells[3]!==(path.main?exact(path.main.limit):'–'))failures.push(record.id+' path '+index+' '+locale);
            });
          }
        }
      }
      return failures;
    });
    assert.deepEqual(failures,[]);
    assert.equal(await page.evaluate(()=>JSON.stringify({hunting:STONESTORM_ATLAS.hunting,limits:STONESTORM_ATLAS.economy.limits,classes:STONESTORM_ATLAS.classes,kingdoms:STONESTORM_ATLAS.kingdomNames,materials:STONESTORM_ATLAS.economy.stackables})),snapshot);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'document overflow at '+width);
    assert.deepEqual(errors,[]);
    await context.close();
    console.log(width+' px: progression, classes, materials, search, state and values verified');
  }
}finally{
  await browser.close();
  server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
}
