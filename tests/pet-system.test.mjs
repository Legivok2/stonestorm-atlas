import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../js/pet-detail-model.js';
import '../js/pet-system.js';
import '../js/planner-model.js';
const db=JSON.parse(fs.readFileSync(new URL('../data/atlas.json',import.meta.url),'utf8'));
const evidence=JSON.parse(fs.readFileSync(new URL('../data/pet-system-evidence.json',import.meta.url),'utf8'));
const pets=globalThis.StonestormPets,planner=globalThis.StonestormPlanner,system=db.petSystem;
const format=value=>value.toLocaleString('hu-HU',{maximumFractionDigits:2});

test('A régi 10-es maximum történeti; a kliens 10/20/35/50/60, az 50-es megfigyelés külön marad',()=>{
  assert.equal(db.petRules.maxLevel,10);assert.equal(system.maxLevel,60);assert.equal(system.status,'conflicted');
  assert.deepEqual(system.formCaps,[10,20,35,50,60]);assert.deepEqual(system.observedFormCaps,[10,20,30,40,50]);assert.deepEqual(system.conflicts.clientFormCaps,[10,20,35,50,60]);
  assert.equal(system.source,'current-client-form-caps; project-owner-observation retained separately');assert.equal(system.stages.length,5);
  assert.equal(system.source,evidence.progression.source);assert.equal(system.status,evidence.progression.status);
  assert.deepEqual(system.formCaps,evidence.conflicts.reconciledActiveFormCaps);assert.deepEqual(system.observedFormCaps,evidence.progression.observedFormCaps);
  assert.equal(evidence.conflicts.adultLevel22Reference,'not evidenced as a form/unlock level');
  assert.deepEqual(system.stages.map(s=>s.name),['Kölyök','Fiatal','Felnőtt','Hős','Legendás']);
  assert.deepEqual(system.stages.map(s=>s.slots),[0,1,2,3,3]);
  for(let level=1;level<=60;level++)assert(system.stages.some(s=>s.minLevel<=level&&s.maxLevel>=level),level);
  assert.deepEqual(system.v3,evidence.api.v3);assert.deepEqual(system.spine,evidence.api.spine);
  assert(system.v3.reference.bands.some(b=>b.from===53));assert(system.spine.reference.bands.some(b=>b.from===57)); // Nem kísérőszintmaximumok.
  assert.equal(pets.verifiedReference('pet_wolf',22,system,'v3').band.from,16);
  assert.equal(pets.verifiedReference('pet_u_wild',22,system,'v3'),null);
});

test('Négy átváltozás: a költség a jelenlegi forma indexén van; az ötödik forma nem nyit negyedik tanulható helyet',()=>{
  for(const [form,level,core,thread,nyang] of [[1,10,'wild',10,20000],[2,20,'monkey',25,60000],[3,35,'spider',50,150000],[4,50,'dragon',90,350000]]){
    const e=pets.evolution(form,system);assert.equal(e.requiredLevel,level);assert.equal(e.to.form,form+1);assert.equal(e.base.core,'pet_core_'+core);assert.equal(e.base.thread,thread);assert.equal(e.base.nyang,nyang);
    assert.equal(e.to.slots-e.from.slots,form===4?0:1);
  }
  assert.equal(pets.evolution(5,system),null);assert.equal(pets.evolution(0,system),null);
  assert.deepEqual(evidence.clientRules.evolutionOverrides,['evolveCores','evolveThread','evolveNyang']);
});

test('A Planner 10/20/35/50/60 kliensformaplafonja és a hősszint külön érvényesül; a megfigyelés külön marad',()=>{
  for(const stage of system.stages){
    const b=planner.normalize({level:60,petId:'pet_wolf',petForm:stage.form,petLevel:999},db).build;
    assert.equal(b.petLevel,stage.maxLevel);assert.equal(b.petForm,stage.form);
    const lower=planner.normalize({...b,petLevel:-1},db).build;assert.equal(lower.petLevel,stage.minLevel);
    const calc=planner.calculate(b,db);assert.equal(calc.pet.slots,stage.slots);
  }
  assert.deepEqual(pets.normalize(10,1,60,system),{form:1,level:10});assert.deepEqual(pets.normalize(10,2,60,system),{form:2,level:10});
  assert.deepEqual(pets.normalize(50,5,45,system),{form:4,level:45});
  assert.deepEqual(pets.normalize(50,5,15,system),{form:2,level:15});
  assert.deepEqual(pets.normalize(22,3,60,system),{form:3,level:22});
  assert.deepEqual(pets.normalize(35,3,60,system),{form:3,level:35});
  const zeroHero=planner.normalize({level:1,petId:'pet_wolf',petLevel:50,petForm:5},db).build;assert.equal(zeroHero.petId,null);assert.equal(zeroHero.petLevel,1);assert.equal(zeroHero.petForm,1);
});

test('A régi version:1 megosztás formamező nélkül betölthető; képességhelyek és V3 migration külön ellenőrzött',()=>{
  const original={version:1,classId:'ninja',level:60,petId:'pet_wolf',petLevel:50,gear:{}};
  const parsed=planner.parse(JSON.stringify(original),db);assert.equal(parsed.build.petLevel,50);assert.equal(parsed.build.petForm,4);
  const again=planner.parse(JSON.stringify(parsed.build),db);assert.deepEqual(again.build,parsed.build);
  assert.equal(parsed.build.version,3);
  assert.equal(planner.parse(JSON.stringify({classId:'ninja',level:60,petId:'pet_wolf',petLevel:22,petBond:3,petRank:4,gear:{}}),db).build.petForm,3);
  assert.equal(planner.parse(JSON.stringify({version:1,classId:'ninja',level:60,petId:'pet_wolf',petLevel:22,bond:2,rank:7,gear:{}}),db).build.petRank,7);
  assert.equal(planner.parse(JSON.stringify({...original,petLevel:10}),db).build.petForm,1);
  for(const level of [1,10,11,20,21,30,31,35,40,41,50,51,60,61,100])assert(planner.normalize({...original,petLevel:level},db).build.petLevel<=60);
  const skillBuild=planner.normalize({...original,petLevel:35,petForm:3,petSkills:[{slot:1,skillId:'first_strike',level:5},{slot:1,skillId:'crit_dmg',level:3},{slot:2,skillId:'first_strike',level:2},{slot:3,skillId:'shield_open',level:2},{slot:4,skillId:'regen',level:1}]},db).build;
  assert.deepEqual(skillBuild.petSkills,[{slot:1,skillId:'first_strike',level:5}]);
});

test('Etetési tartalékmodell: XP, anyag és nyang külön; hős- és formaplafonnál nincs további szintlépési ajánlat',()=>{
  assert.deepEqual(pets.feedPreview(1,60,1,system,db.petRules),{blocked:false,xpToNext:75,xp:75,materials:26,nyang:200});
  assert.deepEqual(pets.feedPreview(10,60,2,system,db.petRules),{blocked:false,xpToNext:300,xp:300,materials:80,nyang:2000});
  assert.deepEqual(pets.feedPreview(10,60,1,system,db.petRules),{blocked:true,reason:'form'});
  assert.deepEqual(pets.feedPreview(45,45,4,system,db.petRules),{blocked:true,reason:'hero'});
  assert.deepEqual(pets.feedPreview(50,60,4,system,db.petRules),{blocked:true,reason:'form'});
  assert.deepEqual(pets.feedPreview(60,60,5,system,db.petRules),{blocked:true,reason:'form'});
  assert.equal(pets.feedPreview(61,60,5,system,db.petRules),null);assert.equal(pets.feedPreview(-1,60,1,system,db.petRules),null);
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

test('Mohaagancs prompt-referencia pontos, megfigyelt presetként marad a V3 számítástól külön',()=>{
  const preset=pets.observedReferencePreset();
  assert.equal(preset.presetId,'mohaagancs-adult-22');
  assert.equal(preset.petId,'pet_u_wild');
  assert.equal(preset.level,22);
  assert.equal(preset.form,3);
  assert.equal(preset.formName,'Felnőtt');
  assert.equal(preset.formCap,35);
  assert.equal(preset.rarity,'Mitikus');
  assert.equal(preset.promptReferenceXpBonusPct,12.6);
  assert.deepEqual(preset.trait,{name:'Rárontás',every:3,percent:57.2});
  assert.deepEqual(preset.signature,{skillId:'first_strike',name:'Előcsapás',percent:140});
  assert.deepEqual(preset.skills,[
    {skillId:'crit_dmg',name:'Éles karom',level:5},
    {skillId:'shield_open',name:'Nyitópajzs',level:5,percent:18}
  ]);
  assert.deepEqual(preset.mastery,{rank:11,max:15,rawApiRank:null});
  assert.equal(preset.atlasModalDisplayedXpBonusPct,12);
  assert.equal(preset.verifiedCalculationXpBonusPct,12);
  assert.equal(preset.liveClientDiscovery,false);
  assert.equal(preset.source,'prompt-supplied-observation');
  assert.deepEqual(preset.notSupplied,['gameVersion','rawApiRankMapping']);
  const build=planner.normalize({
    level:22,
    petId:preset.petId,
    petLevel:preset.level,
    petForm:preset.form,
    petRank:0,
    petRankVerified:false,
    petObservedPreset:preset.presetId,
    petSkills:preset.skills.map((skill,index)=>({slot:index+1,skillId:skill.skillId,level:skill.level}))
  },db).build;
  assert.equal(build.petForm,3);
  assert.equal(build.petLevel,22);
  assert.deepEqual(build.petSkills,[
    {slot:1,skillId:'crit_dmg',level:5},
    {slot:2,skillId:'shield_open',level:5}
  ]);
  assert.equal(planner.calculate(build,db).pet.slots,2);
  assert.equal(build.petRank,0);
  assert.equal(build.petRankVerified,false);
  assert.equal(build.petObservedPreset,preset.presetId);
  const edited=planner.normalize({...build,petSkills:[{slot:1,skillId:'shield_open',level:5}]},db).build;
  assert.equal(edited.petObservedPreset,null);
});
