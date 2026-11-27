import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {root} from '../scripts/publication-plan.mjs';
import {createPreview} from '../scripts/serve-pages.mjs';

process.env.PLAYWRIGHT_BROWSERS_PATH??=path.join(root,'.integration/browser-qa/browsers');
const {chromium}=await import(pathToFileURL(path.join(root,'.integration/browser-qa/node_modules/playwright/index.mjs')));
const server=createPreview(path.join(root,'dist'));
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+'/stonestorm-atlas/';
const browser=await chromium.launch({headless:true});

try{
  for(const [name,width,height] of [['desktop',1440,1000],['mobile',375,812]]){
    const context=await browser.newContext({viewport:{width,height},isMobile:width<680,hasTouch:width<680});
    await context.addInitScript(()=>{if(!sessionStorage.getItem('atlas-i18n-test-initialized')){localStorage.removeItem('stonestorm.atlas.locale.v1');sessionStorage.setItem('atlas-i18n-test-initialized','yes');}});
    const page=await context.newPage(),errors=[],warnings=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='warning')warnings.push(message.text());});
    await page.goto(base+'#atlas/pets',{waitUntil:'networkidle'});
    assert.equal(await page.locator('.atlas-card').count(),22);
    const huPet=await page.evaluate(()=>AtlasI18n.dictionaries.hu['game.pet.pet_vulture']);
    const enPet=await page.evaluate(()=>AtlasI18n.dictionaries.en['game.pet.pet_vulture']);
    assert((await page.locator('.atlas-card[href="#atlas/pets/pet/pet_vulture"] h4').textContent()).includes(huPet));

    await page.locator('#atlas-search').fill(enPet);
    assert.equal(await page.locator('.atlas-card[href="#atlas/pets/pet/pet_vulture"]').count(),1,'English companion search');
    await page.locator('#atlas-search').fill(huPet);
    assert.equal(await page.locator('.atlas-card[href="#atlas/pets/pet/pet_vulture"]').count(),1,'Hungarian companion search');
    await page.locator('#atlas-search').fill('');
    await page.evaluate(()=>location.hash='#atlas/pets/pet/pet_vulture');
    await page.locator('#atlas-detail[open]').waitFor();
    assert.equal(await page.locator('#atlas-detail-title').textContent(),huPet);
    await page.locator('[data-pet-calc-form]').selectOption('2');
    await page.locator('[data-pet-calc-level]').fill('15');
    await page.locator('[data-pet-calc-rank]').fill('2');
    const calculatorBonus=await page.locator('[data-pet-bonus]').getAttribute('data-pet-bonus');
    await page.locator('#atlas-detail [data-atlas-language="en"]').click();
    assert.equal(new URL(page.url()).hash,'#atlas/pets/pet/pet_vulture');
    assert.equal(await page.locator('#atlas-detail-title').textContent(),enPet);
    assert.equal(await page.locator('[data-pet-calc-form]').inputValue(),'2');
    assert.equal(await page.locator('[data-pet-calc-level]').inputValue(),'15');
    assert.equal(await page.locator('[data-pet-calc-rank]').inputValue(),'2');
    assert.equal(await page.locator('[data-pet-bonus]').getAttribute('data-pet-bonus'),calculatorBonus);
    await page.locator('[data-detail-tab="development"]').click();
    assert.match(await page.locator('#folio-panel-development').textContent(),/Progression|form cap|learnable slot/i);
    assert.doesNotMatch(await page.locator('#atlas-detail-body').textContent(),/Kísérőfejlődés|Képességszint|Könyv:/);
    assert(await page.evaluate(()=>{const dialog=document.querySelector('#atlas-detail');return dialog.scrollWidth<=dialog.clientWidth+1;}),name+' detail overflow');
    await page.locator('#atlas-detail-close').click();

    await page.evaluate(()=>location.hash='#atlas/pets/skill/crit_dmg');
    await page.locator('#atlas-detail[open]').waitFor();
    assert.match(await page.locator('#atlas-detail-body').textContent(),/Critical|damage|skill level/i);
    assert.doesNotMatch(await page.locator('#atlas-detail-body').textContent(),/Képességszint|Kritikus sebzés/);
    await page.locator('#atlas-detail-close').click();
    const skillIds=await page.evaluate(()=>Object.keys(window.STONESTORM_ATLAS.petSkills));
    for(const id of skillIds){
      await page.evaluate(id=>location.hash='#atlas/pets/skill/'+id,id);
      await page.locator('#atlas-detail[open]').waitFor();
      const expectedName=await page.evaluate(id=>AtlasI18n.t('game.petSkill.'+id),id);
      const skillDetail=await page.locator('#atlas-detail-body').textContent();
      assert.equal(await page.locator('#atlas-detail-title').textContent(),expectedName,id);
      assert.match(skillDetail,/Skill level|Learned|Book:/i,id);
      assert.doesNotMatch(skillDetail,/Képességszint|Könyv:|tanulható hely/i,id);
      await page.locator('#atlas-detail-close').click();
    }

    await page.evaluate(()=>location.hash='#atlas/pets');
    assert.equal(await page.locator('.atlas-card[href="#atlas/pets/pet/pet_vulture"] h4').textContent(),enPet);
    assert.doesNotMatch(await page.locator('.atlas-card[href="#atlas/pets/pet/pet_vulture"]').textContent(),/Kölyök|Kísérőfaj/);
    await page.locator('.pet-guide-fold > summary').waitFor();
    assert.match(await page.locator('.pet-guide-fold > summary').textContent(),/Progression guide/);
    await page.locator('.pet-guide-fold > summary').click();
    const petGuide=await page.locator('.pet-system').textContent();
    assert.match(petGuide,/Companion progression|Evolution|Feeding|Skill books/i);
    assert.doesNotMatch(petGuide,/Fejlődési útmutató|Kísérőfejlődés|Etetés|Képességhely|Átváltozások/);

    await page.evaluate(()=>location.hash='#atlas/mounts/mount/pony');
    await page.locator('#atlas-detail[open]').waitFor();
    assert.match(await page.locator('#atlas-detail-body').textContent(),/hardy steppe breed/i);
    assert.match(await page.locator('#atlas-detail-body').textContent(),/Travel-time multiplier/);
    await page.locator('#atlas-detail-close').click();
    await page.evaluate(()=>location.hash='#atlas/mounts');
    const mountList=await page.locator('#atlas-screen').textContent();
    assert.match(mountList,/Mounts|Travel time planner|Travel-time/i);
    assert.doesNotMatch(mountList,/KÓDEX|Hátasok|Bérleti ár/);
    for(const [query,result] of [['steppe','#atlas/mounts/mount/pony'],['pusztai','#atlas/mounts/mount/pony']]){
      await page.locator('#atlas-search').fill(query);
      assert.equal(await page.locator(`a[href="${result}"]`).count(),1,`mount search: ${query}`);
    }

    await page.evaluate(()=>location.hash='#atlas/planner');
    await page.locator('#planner-level').fill('60');
    await page.locator('#planner-level').dispatchEvent('change');
    await page.locator('#planner-pet').selectOption('pet_vulture');
    await page.locator('#planner-pet-form').selectOption('2');
    await page.locator('#planner-pet-level').fill('15');
    await page.locator('#planner-pet-level').dispatchEvent('change');
    await page.locator('#planner-mount').selectOption('pony');
    assert.equal(await page.locator('#planner-pet-rank').count(),0);
    const englishSkill=await page.evaluate(()=>AtlasI18n.dictionaries.en['game.petSkill.crit_dmg']);
    const hungarianSkill=await page.evaluate(()=>AtlasI18n.dictionaries.hu['game.petSkill.crit_dmg']);
    await page.locator('#atlas-language [data-atlas-language="hu"]').click();
    await page.locator('[data-planner-pet-skill-search="1"]').fill(englishSkill);
    await page.locator('[data-planner-pet-skill-search="1"]').dispatchEvent('change');
    assert.equal(await page.locator('[data-planner-pet-skill-search="1"]').inputValue(),hungarianSkill);
    await page.locator('#planner-item-query').fill('w_ninja');
    const before=await page.evaluate(()=>{
      const db=window.STONESTORM_ATLAS,build={...StonestormPlanner.empty(db),level:60,classId:'ninja',petId:'pet_vulture',petLevel:15,petForm:2,petSkills:[{slot:1,skillId:'crit_dmg',level:3}],mountId:'pony'};
      const result=StonestormPlanner.calculate(build,db);
      return {bonus:result.pet.details.bonusValue,rawBonus:result.pet.rawSpeciesBonus,skillIds:result.pet.skills.map(skill=>skill.skillId),mount:result.mount.travelMult};
    });
    await page.locator('#atlas-language [data-atlas-language="en"]').click();
    assert.equal(await page.locator('#planner-pet').inputValue(),'pet_vulture');
    assert.equal(await page.locator('#planner-pet-form').inputValue(),'2');
    assert.equal(await page.locator('#planner-pet-level').inputValue(),'15');
    assert.equal(await page.locator('#planner-mount').inputValue(),'pony');
    assert.equal(await page.locator('[data-planner-pet-skill-search="1"]').inputValue(),englishSkill);
    assert.equal(await page.locator('#planner-item-query').inputValue(),'w_ninja');
    const plannerCopy=await page.locator('.planner-layout, .planner-companions, .planner-saving, .planner-picker').allTextContents();
    assert.doesNotMatch(plannerCopy.join(' '),/Karakterváltozat|Kísérőfaj|Kísérőszint|Fejlődési forma|Hátas|Képességszint|Nincs kiválasztva/);
    const after=await page.evaluate(()=>{
      const db=window.STONESTORM_ATLAS,build={...StonestormPlanner.empty(db),level:60,classId:'ninja',petId:'pet_vulture',petLevel:15,petForm:2,petSkills:[{slot:1,skillId:'crit_dmg',level:3}],mountId:'pony'};
      const result=StonestormPlanner.calculate(build,db);
      return {bonus:result.pet.details.bonusValue,rawBonus:result.pet.rawSpeciesBonus,skillIds:result.pet.skills.map(skill=>skill.skillId),mount:result.mount.travelMult};
    });
    assert.deepEqual(after,before,'locale changes must not affect Pet Builder calculations');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' planner overflow');
    assert.deepEqual(errors,[],errors.join('\n'));
    assert.deepEqual(warnings,[],warnings.join('\n'));

    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.evaluate(()=>AtlasI18n.getLocale()),'en','language persists after reload');
    assert.equal(await page.locator('#atlas-heading').textContent(),'Character planner');
    console.log(`Chromium ${name}: pet list/detail/skill, mount detail/search, bilingual skill selection, locale-persistent Planner state and numeric results verified.`);
    await context.close();
  }
}finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
