import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import '../js/atlas-math.js';
import '../js/pet-system.js';
import '../js/planner-model.js';
const db=JSON.parse(fs.readFileSync(new URL('../data/atlas.json',import.meta.url),'utf8'));
const setEvidence=JSON.parse(fs.readFileSync(new URL('../data/set-bonus-evidence.json',import.meta.url),'utf8'));
const sync=JSON.parse(fs.readFileSync(new URL('../data/sync-import.json',import.meta.url),'utf8'));
const synced=(kind,id)=>kind==='dungeons'?sync.dungeons?.[id]:sync.records?.[kind]?.[id];
const checkSync=entry=>{assert.equal(entry.provenance.source,'https://stonestorm.gg/api/content');assert.match(entry.provenance.sha256,/^[a-f0-9]{64}$/);assert(entry.provenance.apiPath);assert.equal(entry.provenance.status,'derived');};
const math=globalThis.StonestormMath,rates=db.economy.limits.guildSpeedup;
test('Céhes gyorsítás: megkezdett órák és ársávhatárok',()=>{
  assert.equal(math.speedup(22,11,rates),2200);
  assert.equal(math.speedup(3.7,11,rates),400);
  assert.equal(math.speedup(4+11/60,11,rates),500);
  assert.equal(math.speedup(1,5,rates),20);
  assert.equal(math.speedup(1,6,rates),50);
  assert.equal(math.speedup(1,10,rates),50);
  assert.equal(math.speedup(1,11,rates),100);
  assert.equal(math.speedup(0,15,rates),0);
  for(const args of [[-1,11],[NaN,11],[Infinity,11],[1,0],[1,16],[1,2.5]])assert.equal(math.speedup(...args,rates),null);
});
test('Képkatalógus: létező fájlok, források, állapotok és teljes adatkapcsolatok',()=>{
  const catalog=JSON.parse(fs.readFileSync(new URL('../data/image-catalog.json',import.meta.url),'utf8'));
  assert.equal(catalog.entries.length,2103);assert.equal(catalog.stats.missing,21);
  assert.equal(catalog.categories.length,26);
  assert.equal(new Set(catalog.entries.map(x=>x.id)).size,catalog.entries.length);
  assert.equal(new Set(catalog.entries.map(x=>x.sha256)).size,catalog.stats.uniqueContent);
  assert.equal(catalog.entries.filter(x=>x.status==='identified').length,catalog.stats.identified);
  for(const image of catalog.entries){
    for(const file of [image.file,image.originalFile,image.thumbnail]){assert(!file.includes('..'));assert(fs.existsSync(new URL('../'+file,import.meta.url)),file);}
    assert.equal(image.permission,'unverified-public-reuse');
    assert(image.sourceUrl.startsWith('https://stonestorm.gg/art/'));
    if(image.status==='identified')assert(image.relations.some(r=>r.status==='identified'));
  }
  for(const [kind,key] of [['item','items'],['pet','pets'],['mount','mounts'],['mob','mobs'],['map','maps']])for(const record of db[key]){
    if(synced(key,record.id)&&!catalog.entries.some(im=>im.relations.some(r=>r.kind===kind&&r.id===record.id))){checkSync(synced(key,record.id));continue;}
    assert(catalog.entries.some(im=>im.relations.some(r=>r.kind===kind&&r.id===record.id)),record.id);
  }
  const image=catalog.entries.find(x=>x.id==='weapons/w_ninja_l10');
  assert(image.relations.some(r=>r.id==='w_ninja_l10'&&r.status==='identified'));
  assert(image.relations.some(r=>r.id==='w_ninja_set_m1'&&r.status==='identified'));
  assert.equal(db.items.find(x=>x.id==='w_ninja_l10').level,8);
  assert.equal(db.items.find(x=>x.id==='w_ninja_set_m1').level,11);
});
test('Planner: a kliens +fejlesztési képlete minden mentett alaptárggyal egyezik',()=>{
  const model=globalThis.StonestormPlanner;
  for(const item of db.items){
    assert.deepEqual(model.equipmentValues(item,0,db),item.values,item.id);
    let previous=item.values;
    for(let plus=1;plus<db.forge.plusMult.length;plus++){
      const next=model.equipmentValues(item,plus,db);assert(next,item.id);
      for(const [key,v] of Object.entries(previous))if(v>0)assert(next[key]>v,item.id+' '+key+' +'+plus);
      previous=next;
    }
  }
});
test('Planner: kaszt, szint, slot, verzió, azonosítók és megosztott bemenet ellenőrzése',()=>{
  const model=globalThis.StonestormPlanner,b=model.empty(db,'ninja');
  b.gear={weapon:{id:'w_warrior_5',plus:100},armor:{id:'w_ninja_0',plus:0},boots:{id:'not-an-item'}};b.petId='pet_wolf';b.mountId='mule';
  const parsed=model.normalize(b,db);assert.deepEqual(parsed.build.gear,{});assert.equal(parsed.build.petId,null);assert.equal(parsed.build.mountId,null);assert(parsed.errors.length>=5);
  assert(model.parse('{broken',db).errors.length);
  assert(model.parse(JSON.stringify({version:999}),db).errors.length);
  assert(model.parse('x'.repeat(12001),db).errors.length);
  const imported=model.parse('{"version":1,"classId":"ninja","level":9999,"look":999,"gear":{"__proto__":{"polluted":true},"weapon":{"id":"w_ninja_l50","plus":999}}}',db);
  assert.equal(imported.build.level,db.economy.limits.maxLevel);assert.equal(imported.build.look,2);assert.equal(imported.build.gear.weapon.plus,9);assert.equal({}.polluted,undefined);
});
test('Planner: family alapján aktív szettküszöbök, külön kezelt százalékok és ismeretlen végső harci értékek',()=>{
  const model=globalThis.StonestormPlanner,b=model.empty(db,'ninja');b.level=60;b.targetFamily='m1';b.petId='pet_wolf';b.petLevel=10;b.mountId='pony';
  b.gear={weapon:{id:'w_ninja_set_m1',plus:0},armor:{id:'a_ninja_set_m1',plus:0}};
  const result=model.calculate(b,db);assert.equal(result.sets[0].count,2);assert.equal(result.sets[0].active.length,1);assert.equal(result.sets[0].inactive.length,2);
  assert.equal(result.equipment.maxHp,0);assert.deepEqual(result.sets[0].active[0],db.sets.find(set=>set.familyId==='m1').bonuses[0]);
  assert.deepEqual(result.sets[0].inactive.map(bonus=>bonus.pieces),[4,6]);
  assert.deepEqual([...result.sets[0].active,...result.sets[0].inactive],db.sets.find(set=>set.familyId==='m1').bonuses);
  assert.equal(result.pet.rawSpeciesBonus.xpMult,.1);assert.equal(result.mount.travelMult,.9);
  assert.equal(result.levelStats,null);assert.equal(result.finalCombatStats,null);
  const roundtrip=model.parse(JSON.stringify(result.build),db);assert.deepEqual(roundtrip.build,result.build);
});
test('A több lépéses tervező minden lépés saját ársávját használja',()=>{
  assert.deepEqual(math.guildPlan(4,6,rates),{steps:2,hours:22,coins:800});
  assert.deepEqual(math.guildPlan(10,11,rates),{steps:1,hours:22,coins:2200});
  assert.deepEqual(math.guildPlan(15,15,rates),{steps:0,hours:0,coins:0});
  assert.equal(math.guildPlan(12,11,rates),null);
  assert.equal(math.guildPlan(1.5,3,rates),null);
});
test('A hátas időszorzója és a mért XP-hatékonyság külön számítás',()=>{
  const t=math.travel(100,0.9);assert.equal(t.minutes,90);assert.ok(Math.abs(t.saved-10)<1e-10);
  assert.deepEqual(math.efficiency(600,6,12,20),{perEnergy:100,perHour:3000,runs:3,totalXp:1800,totalMinutes:36});
  assert.equal(math.efficiency(600,0,12,20),null);
  assert.equal(math.efficiency(NaN,6,12,20),null);
  assert.equal(math.efficiency(600,6,0,20),null);
  assert.equal(math.travel(-1,.9),null);
});
test('Forráslefedettség, egyedi azonosítók és visszakövethető rekordok',()=>{
  for(const [key,count] of Object.entries({items:182,sets:6,pets:22,mounts:8,maps:6,mobs:64,bosses:6,dungeons:4,research:14})){
    const added=Object.values(sync.records?.[key]??{}).filter(entry=>!JSON.parse(fs.readFileSync(new URL('../source-data/'+({items:'01_felszerelesek_es_szettek.json',mobs:'06_terkepek_szornyek_bossok_kazamatak.json',bosses:'06_terkepek_szornyek_bossok_kazamatak.json'}[key]),import.meta.url),'utf8'))[key].some(x=>x.id===entry.record.id)).length;
    assert.equal(db[key].length,count+added,key);
    assert.equal(new Set(db[key].map(x=>x.id)).size,db[key].length,key+' duplikátum');
    if(key==='sets'){
      assert.match(setEvidence.source,/spine\.sets\.full/);
      assert.match(setEvidence.source,/spine\.lines\.scaled\/percent/);
      assert.equal(setEvidence.results.length,count);
      for(const set of db.sets){
        if(sync.sets?.[set.familyId]){checkSync(sync.sets[set.familyId]);assert.deepEqual(set.bonuses,sync.sets[set.familyId].bonuses);continue;}
        const evidence=setEvidence.results.find(record=>record.familyId===set.familyId);
        assert(evidence,set.familyId+' visszakövethető bizonyíték');
        assert.match(set.provenance?.source??'',/spine\.sets\.full/);
        assert.match(set.provenance.source,/spine\.lines\.scaled\/percent/);
        assert(set.provenance.source.includes(setEvidence.gameContentVersion),set.familyId+' forrásverzió');
        assert.equal(set.provenance.checkedAt,setEvidence.verifiedAt,set.familyId+' ellenőrzési dátum');
        assert.equal(set.provenance.status,setEvidence.directlyConfirmedInGame.includes(set.familyId)?'verified':'derived',set.familyId+' megbízhatóság');
        assert(set.provenance.scope?.trim(),set.familyId+' forráshatókör');
        assert.equal(set.itemLevel,evidence.level);
        assert.deepEqual(set.bonuses,evidence.bonuses,set.familyId+' bizonyítékhoz kapcsolt bónuszok');
      }
    }else{
      for(const row of db[key]){if(synced(key,row.id)){checkSync(synced(key,row.id));assert.deepEqual(row.provenance,synced(key,row.id).provenance);}else assert(row.provenance?.source&&row.provenance.checkedAt==='2026-11-06',key+' forrás');}
    }
  }
  const originalStackables=JSON.parse(fs.readFileSync(new URL('../source-data/08_anyagok_penzugyek_boltok.json',import.meta.url),'utf8')).stackables;
  const addedStackables=Object.keys(sync.records?.stackables??{}).filter(id=>!originalStackables.some(x=>x.id===id));
  assert.equal(db.economy.stackables.length,131+addedStackables.length);
  for(const id of addedStackables){checkSync(synced('stackables',id));assert(db.economy.stackables.some(x=>x.id===id));}
  assert.equal(db.sources.length,14);
  for(const src of db.sources){const bytes=fs.readFileSync(new URL('../source-data/'+src.file,import.meta.url));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),src.sha256);}
});
test('Valódi relációk, ismeretlen árak és forráseltérések megőrzése',()=>{
  for(const s of db.sets)assert(db.bosses.some(b=>b.id===s.bossId));
  for(const b of db.bosses)assert(db.mobs.some(m=>m.id===b.mobId));
  for(const r of db.research)assert(db.mobs.some(m=>m.id===r.sampleMobId));
  for(const p of db.pets){assert(db.petTraits[p.trait]);if(p.signature)assert(db.petSkills[p.signature]);}
  for(const b of db.guild.buildings){assert.equal(b.levels.length,15);assert(b.levels.every(l=>l.priceNyang===null&&l.materialBars===null));}
  assert.equal(db.guild.buildings.find(b=>b.kind==='hq').levels.at(-1).effect,70);
  assert.equal(db.hunting.expedition.refill.coins,3);
  assert.equal(db.hunting.energy.refill.baseVe[0],10);
  assert.equal(db.conflicts.length,4);
});
