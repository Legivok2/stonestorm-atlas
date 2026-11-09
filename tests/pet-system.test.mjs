import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../js/pet-system.js';
import '../js/planner-model.js';
const db=JSON.parse(fs.readFileSync(new URL('../data/atlas.json',import.meta.url),'utf8'));
const evidence=JSON.parse(fs.readFileSync(new URL('../data/pet-system-evidence.json',import.meta.url),'utf8'));
const pets=globalThis.StonestormPets,planner=globalThis.StonestormPlanner,system=db.petSystem;
const format=value=>value.toLocaleString('hu-HU',{maximumFractionDigits:2});

test('A régi 10-es maximum megmarad történeti adatnak; a megfigyelt v3 modell 50-es és jelöli a klienseltérést',()=>{
  assert.equal(db.petRules.maxLevel,10);assert.equal(system.maxLevel,50);assert.equal(system.status,'observed');
  assert.deepEqual(system.formCaps,[10,20,30,40,50]);assert.deepEqual(system.conflicts.clientFormCaps,[10,20,35,50,60]);
  assert.equal(system.source,'project-owner-current-game-observation');assert.equal(system.stages.length,5);
  assert.deepEqual(system.stages.map(s=>s.name),['Kölyök','Fiatal','Felnőtt','Hős','Legendás']);
  assert.deepEqual(system.stages.map(s=>s.slots),[0,1,2,3,3]);
  for(let level=1;level<=50;level++)assert(system.stages.some(s=>s.minLevel<=level&&s.maxLevel>=level),level);
  assert.deepEqual(system.v3,evidence.api.v3);assert.deepEqual(system.spine,evidence.api.spine);
  assert(system.v3.reference.bands.some(b=>b.from===53));assert(system.spine.reference.bands.some(b=>b.from===57)); // Nem kísérőszintmaximumok.
});

test('Négy átváltozás: a költség a jelenlegi forma indexén van; az ötödik forma nem nyit negyedik tanulható helyet',()=>{
  for(const [form,level,core,thread,nyang] of [[1,10,'wild',10,20000],[2,20,'monkey',25,60000],[3,30,'spider',50,150000],[4,40,'dragon',90,350000]]){
    const e=pets.evolution(form,system);assert.equal(e.requiredLevel,level);assert.equal(e.to.form,form+1);assert.equal(e.base.core,'pet_core_'+core);assert.equal(e.base.thread,thread);assert.equal(e.base.nyang,nyang);
    assert.equal(e.to.slots-e.from.slots,form===4?0:1);
  }
  assert.equal(pets.evolution(5,system),null);assert.equal(pets.evolution(0,system),null);
  assert.deepEqual(evidence.clientRules.evolutionOverrides,['evolveCores','evolveThread','evolveNyang']);
});

test('A Planner 10/20/30/40/50 formaplafonja és a hősszint külön érvényesül; a határon két forma lehetséges',()=>{
  for(const stage of system.stages){
    const b=planner.normalize({level:60,petId:'pet_wolf',petForm:stage.form,petLevel:999},db).build;
    assert.equal(b.petLevel,stage.maxLevel);assert.equal(b.petForm,stage.form);
    const lower=planner.normalize({...b,petLevel:-1},db).build;assert.equal(lower.petLevel,stage.minLevel);
    const calc=planner.calculate(b,db);assert.equal(calc.pet.slots,stage.slots);
  }
  assert.deepEqual(pets.normalize(10,1,60,system),{form:1,level:10});assert.deepEqual(pets.normalize(10,2,60,system),{form:2,level:10});
  assert.deepEqual(pets.normalize(50,5,45,system),{form:5,level:45});
  assert.deepEqual(pets.normalize(50,5,15,system),{form:2,level:15});
  const zeroHero=planner.normalize({level:1,petId:'pet_wolf',petLevel:50,petForm:5},db).build;assert.equal(zeroHero.petId,null);assert.equal(zeroHero.petLevel,1);assert.equal(zeroHero.petForm,1);
});

test('A régi version:1 megosztás formamező nélkül is betölthető; az 50-es szint mentése és visszaolvasása nem vágódik 10-re',()=>{
  const original={version:1,classId:'ninja',level:60,petId:'pet_wolf',petLevel:50,gear:{}};
  const parsed=planner.parse(JSON.stringify(original),db);assert.equal(parsed.build.petLevel,50);assert.equal(parsed.build.petForm,5);
  const again=planner.parse(JSON.stringify(parsed.build),db);assert.deepEqual(again.build,parsed.build);
  assert.equal(planner.parse(JSON.stringify({...original,petLevel:10}),db).build.petForm,1);
  for(const level of [1,10,11,20,21,30,31,40,41,50,51,100])assert(planner.normalize({...original,petLevel:level},db).build.petLevel<=50);
});

test('Etetési tartalékmodell: XP, anyag és nyang külön; hős- és formaplafonnál nincs további szintlépési ajánlat',()=>{
  assert.deepEqual(pets.feedPreview(1,60,1,system,db.petRules),{blocked:false,xpToNext:75,xp:75,materials:26,nyang:200});
  assert.deepEqual(pets.feedPreview(10,60,2,system,db.petRules),{blocked:false,xpToNext:300,xp:300,materials:80,nyang:2000});
  assert.deepEqual(pets.feedPreview(10,60,1,system,db.petRules),{blocked:true,reason:'form'});
  assert.deepEqual(pets.feedPreview(45,45,5,system,db.petRules),{blocked:true,reason:'hero'});
  assert.deepEqual(pets.feedPreview(50,60,5,system,db.petRules),{blocked:true,reason:'form'});
  assert.equal(pets.feedPreview(51,60,5,system,db.petRules),null);assert.equal(pets.feedPreview(-1,60,1,system,db.petRules),null);
  assert.notDeepEqual(system.v3.xp.share,system.spine.xpShare); // Nem összeadandó konfigurációk.
});

test('Mind a tíz képesség öt teljes hatásleírást kap; nincs helykitöltő vagy kitalált hatodik szint',()=>{
  assert.equal(Object.keys(system.v3.skills).length,10);
  for(const id of Object.keys(system.v3.skills)){
    assert.equal(system.v3.skills[id].values.length,5);
    for(let rank=1;rank<=5;rank++){const desc=pets.skillDescription(id,rank,system,format);assert(desc);assert(!/\{\{|undefined|NaN/.test(desc),id);}
    assert.equal(pets.skillDescription(id,6,system,String),null);
  }
  assert.match(pets.skillDescription('first_strike',5,system,format),/220%/);
  assert.match(pets.skillDescription('regen',3,system,format),/3/);assert.match(pets.skillDescription('regen',3,system,format),/4%/);
});
