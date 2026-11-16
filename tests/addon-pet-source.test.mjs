import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../js/pet-detail-model.js';
import '../addons/stonestorm-statcap-overlay/research-sanitizer.js';
const logic=globalThis.StonestormPetDetails,model=JSON.parse(fs.readFileSync(new URL('fixtures/pet-model-v3-reference.json',import.meta.url)));
test('Kísérőforrás: numerikus és szöveges egyedi azonosító, teljes inaktív lista',()=>{
  const result=logic.roster({state:{pets:[{id:101,petId:'pet_vulture',level:1,form:1,active:false},{id:'wild-owned',petId:'pet_u_wild',level:12,bond:2,active:false,skills:[{skillId:'idle_xp',level:2}]}]}});
  assert.equal(result.pets.length,2);assert.equal(result.pets[0].id,'101');assert.equal(result.pets[0].rank,0);assert.equal(result.pets[0].fieldSources.rank,'client-default');
  assert.equal(result.pets[1].form,2);assert.equal(result.pets[1].fieldSources.form,'client-bond');
  assert.equal(logic.describe(result.pets[0],model).bonusValue,.04);
  assert.equal(logic.describe(result.pets[1],model).bonusValue,.09);
  assert.equal(result.pets[1].skills[0].skillId,'idle_xp');assert.equal(result.pets[0].skills,undefined);
  assert.deepEqual(logic.roster(result).pets,result.pets,'A két üzenetvilág közötti újraszűrés nem veszíti el a forrást');
  const opaque=logic.roster({pets:[{id:'pet/local.key#opaque',petId:'pet_vulture',level:1,form:1}]});assert.equal(opaque.pets[0].id,'pet/local.key#opaque');
});
test('Kísérőforrás: megjelenített bónusz elsőbbsége és hibamentes hiányjelzés',()=>{
  const pet={id:'owned',petId:'pet_vulture',level:1,form:1,rank:2,active:true};
  const direct=logic.describe(pet,model,model.config,Date.now(),{bonus:{key:'dropMult',percent:4}});
  assert.equal(direct.bonusValue,.04);assert.equal(direct.bonusSource,'dom');assert.equal(direct.sections[0].items[0],'Zsákmány +4%');
  assert.equal(logic.describe(pet,model).bonusValue,.048,'A DOM-érték nincs más fajra vagy minden rekordra beégetve');
  const missing=logic.describe({petId:'pet_vulture'},model);assert.equal(missing.bonusSource,'unavailable');assert.equal(missing.sections[0].items[0],'Zsákmány – pontos érték nem elérhető');assert(!/ismeretlen%/.test(JSON.stringify(missing)));
});
test('Kísérőforrás: név alapján nincs rang-, forma- vagy képességkölcsönzés',()=>{
  const unknown=logic.describe({petId:'pet_u_wild'},model);
  assert.equal(unknown.bonusValue,null);assert.match(unknown.sections[3].items[0],/Ismeretlen/);
  const observed=logic.describe({name:'Egyedi név'},model,model.config,Date.now(),{bonus:{key:'dropMult',percent:4}});
  assert.equal(observed.sections[0].items[0],'Zsákmány +4%','Saját sorkörnyezetben közölt érték fajazonosítás nélkül is olvasható');
});
test('Kísérőforrás: ütköző azonosító és hibás explicit mező nem kap kitalált alapértéket',()=>{
  const duplicate=logic.roster({pets:[{id:2,petId:'pet_vulture'},{id:'2',petId:'pet_u_wild'}]});assert.equal(duplicate.pets.length,0);assert.equal(duplicate.diagnostics.reasons['duplicate-instance-id'],1);
  const bad=logic.roster({pets:[{id:1,petId:'pet_vulture',form:'invalid',rank:'invalid',level:1}]});
  assert.equal(bad.pets[0].form,undefined);assert.equal(bad.pets[0].rank,undefined);assert.deepEqual(logic.roster(bad).pets[0].invalidFields,['form','rank']);assert.equal(logic.describe(logic.roster(bad).pets[0],model).bonusValue,null);
});
test('Kísérőforrás: nagyobb forma és más ritkaság saját értékkel számol',()=>{
  const r=logic.roster({pets:[{id:99,petId:'pet_snow_leopard',level:33,form:3,rank:2,active:false,skills:[{skillId:'shield_open',level:3}]}]});
  const detail=logic.describe(r.pets[0],model);assert(Math.abs(detail.bonusValue-.055)<1e-12);assert.equal(detail.sections[0].items[0],'Támadás +5,5%');assert.match(detail.sections[3].items.join(' '),/Nyitópajzs.*11%/);
});
test('Kísérőforrás: saját lista és meződiagnosztika nem kerül anonim exportba',()=>{
  const raw={state:{
    pets:[{id:'PRIVATE_PET_ID',petId:'pet_vulture',level:1,form:1,rank:0,active:false,name:'PRIVATE_NAME'}],
    patron:{prices:{refill:{baseCoins:[1,2]}}}
  }};
  const privateData=logic.roster(raw);assert.equal(privateData.pets[0].id,'PRIVATE_PET_ID');
  const exported=globalThis.StonestormResearch.sanitize('/api/character',raw);assert(exported);assert(!/PRIVATE_|pets|fieldSources|rank|diagnostics/.test(JSON.stringify(exported)));
});
