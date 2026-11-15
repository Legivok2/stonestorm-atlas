import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {API,sha256,diffJSON,validateContent,fullSetBonuses,planImport,applyOverlay,equal} from '../scripts/atlas-sync-model.mjs';
import {runSync,fetchPublic,discover} from '../scripts/atlas-sync.mjs';

const root=new URL('../',import.meta.url);
const load=file=>JSON.parse(fs.readFileSync(new URL(file,root),'utf8'));
const source=()=>load('snapshots/current/content.json');
const base=()=>{
  const db=load('data/atlas.json');
  // A tesztek a kézi alapból indulnak, nem a gépen már élesített felülrétegből.
  const gear=load('source-data/01_felszerelesek_es_szettek.json');
  const world=load('source-data/06_terkepek_szornyek_bossok_kazamatak.json');
  db.items=gear.items.map(x=>({...x,name:x.nameHu}));db.mobs=world.mobs;db.bosses=world.bosses;
  db.economy.stackables=load('source-data/08_anyagok_penzugyek_boltok.json').stackables;
  for(const set of db.sets){set.bonuses=gear.collectionFamilies.families.find(x=>x.id===set.familyId).set.bonuses;set.provenance= {status:set.familyId==='m4'?'verified':'derived'};}
  return db;
};
function current(){const c=source(),db=base();applyOverlay(db,planImport(c,db).overlay);return {c,db};}
test('Auto-Sync: változatlan JSON, eltérő kulcs- vagy rekordsorrend nem adatfrissítés',()=>{
  assert.deepEqual(diffJSON({a:1,b:[{id:'a',v:1},{id:'b',v:2}]},{b:[{v:2,id:'b'},{v:1,id:'a'}],a:1}),[]);
  const {c,db}=current();assert.equal(planImport(c,db).accepted.length,0);
});
test('Auto-Sync: új tárgy stabil azonosítóval, külön felülrétegben és eredettel kerül be',()=>{
  const {c,db}=current(),before=structuredClone(db);
  c.items.push({...c.items[0],id:'sync_test_sword'});
  const plan=planImport(c,db);assert(plan.accepted.some(x=>x.path==='/items/sync_test_sword'));
  assert.deepEqual(db,before);applyOverlay(db,plan.overlay);
  const row=db.items.find(x=>x.id==='sync_test_sword');assert.equal(row.name,'sync_test_sword');assert.equal(row.provenance.source,API);assert.equal(row.provenance.sha256,sha256(JSON.stringify(c)));
  assert.equal(row.provenance.status,'derived');
});
test('Auto-Sync: ismert full szettérték változása frissül; classic nem írhatja felül',()=>{
  const {c,db}=current();const updated=c.spine.lines.percent.find(x=>x.fromLevel===26).tiers.skillDamage[3]+.001;c.spine.lines.percent.find(x=>x.fromLevel===26).tiers.skillDamage[3]=updated;
  c.spine.sets.m2.classic=[];
  const plan=planImport(c,db);assert(plan.accepted.some(x=>x.path==='/spine/sets/m2/full'));
  applyOverlay(db,plan.overlay);assert.equal(db.sets.find(x=>x.familyId==='m2').bonuses[2].stats[0].value,updated);
});
test('Auto-Sync: minden full szett egyezik a javított mentett alappal',()=>{
  const c={spine:load('source-data/07_portyak_vadaszat_energia.json').spine},db=base();for(const set of db.sets)assert.deepEqual(fullSetBonuses(c,set.familyId),set.bonuses);
});
test('Auto-Sync: M4 képernyőképpel igazolt szett változását karanténba teszi',()=>{
  const {c,db}=current(),before=structuredClone(db.sets.find(x=>x.familyId==='m4'));
  c.spine.lines.percent.find(x=>x.fromLevel===46).tiers.lifesteal[3]=.04;
  const plan=planImport(c,db);assert(plan.review.some(x=>x.path.includes('m4')&&x.reason.includes('védett')));
  assert(!plan.overlay.sets.m4);applyOverlay(db,plan.overlay);assert.deepEqual(db.sets.find(x=>x.familyId==='m4'),before);
  assert.throws(()=>applyOverlay(db,{schema:1,sets:{m4:{bonuses:[]}}}),/Védett/);
});
test('Auto-Sync: hiányzó rekord, mező és részleges values nem töröl adatot',()=>{
  const {c,db}=current(),original=structuredClone(db.items[0]),count=db.items.length;c.items.shift();delete c.items[0].buyPrice;delete c.items[1].values.atkMin;
  const plan=planImport(c,db);assert(plan.review.some(x=>x.path==='/items/'+original.id));applyOverlay(db,plan.overlay);
  assert.deepEqual(db.items[0],original);assert.equal(db.items.length,count);
});
test('Auto-Sync: ismeretlen rendszer, új mély mező és törlés is látható',()=>{
  const changes=diffJSON({a:{v:1,removed:2}},{a:{v:3,unknown:true},astralFishing:{new:true}});
  assert(changes.some(x=>x.path==='/astralFishing'&&x.kind==='added'));
  assert(changes.some(x=>x.path==='/a/removed'&&x.kind==='removed'));
  assert(changes.some(x=>x.path==='/a/v'&&x.before===1&&x.after===3));
});
test('Auto-Sync: duplikátumok, új tárgystat és szerkezeti eltérés nem importálhatók',()=>{
  const {c,db}=current();c.items.push(c.items[0]);assert.throws(()=>validateContent(c),/duplikált/);
  c.items.pop();c.items[0].values.mystery=7;assert(planImport(c,db).review.some(x=>x.path.includes(c.items[0].id)));
  c.spine.sets.m2.full[2].pieces=7;assert(planImport(c,db).review.some(x=>x.path.includes('m2')));
});
test('Auto-Sync: feltérképezés magyar fordítást, adatot és grafikát talál; külső hostot kizár',()=>{
  const urls=discover('import("./hu-ABCDEFGH.js"); const a="assets/art-manifest-12345678.js"; const b="/art/wolf.webp"; const c="https://evil.invalid/a.js";','https://stonestorm.gg/assets/index-ABCD1234.js');
  assert(urls.includes('https://stonestorm.gg/assets/hu-ABCDEFGH.js'));assert(urls.includes('https://stonestorm.gg/assets/art-manifest-12345678.js'));assert(urls.includes('https://stonestorm.gg/art/wolf.webp'));assert(!urls.some(x=>x.includes('evil')));
});
test('Auto-Sync: feltételes HTTP-kérés és 304 újraletöltés nélkül',async()=>{
  let headers;const r=await fetchPublic(API,{etag:'test-etag',sha256:'a'.repeat(64)},async(_,opts)=>{headers=opts.headers;return new Response(null,{status:304});});
  assert.equal(headers['If-None-Match'],'test-etag');assert.equal(r.unchanged,true);assert.equal(r.text,undefined);
  await assert.rejects(fetchPublic('https://example.com/api',null),/Nem engedélyezett/);
});
function workspace(t){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-sync-test-'));
  // Csak az általunk létrehozott, ellenőrzött temp mappát takarítjuk.
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  for(const file of ['data/atlas.json','data/sync-import.json','js/atlas-data.js','data/image-manifest.json','snapshots/current/content.json']){
    const target=path.join(dir,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(new URL(file,root),target);
  }
  const c=source(),db=base(),plan=planImport(c,db);applyOverlay(db,plan.overlay);
  fs.writeFileSync(path.join(dir,'data/atlas.json'),JSON.stringify(db));fs.writeFileSync(path.join(dir,'data/sync-import.json'),JSON.stringify(plan.overlay));
  fs.writeFileSync(path.join(dir,'snapshots/manifest.json'),JSON.stringify({schema:1,content:{url:API,sha256:sha256(JSON.stringify(c)),etag:'test'},resources:{}}));
  return dir;
}
test('Auto-Sync: változatlan 304 nem módosít Atlas-adatot és nem kér publikálást',async t=>{
  const dir=workspace(t),file=path.join(dir,'data/atlas.json'),before=fs.readFileSync(file),mtime=fs.statSync(path.join(dir,'snapshots/current/content.json')).mtimeMs;
  const priorOutput=process.env.GITHUB_OUTPUT,output=path.join(dir,'step-output');
  fs.writeFileSync(output,'publish=sentinel\n');process.env.GITHUB_OUTPUT=output;
  t.after(()=>{if(priorOutput===undefined)delete process.env.GITHUB_OUTPUT;else process.env.GITHUB_OUTPUT=priorOutput;});
  const r=await runSync({root:dir,apply:true,inspect:false,fetcher:async()=>new Response(null,{status:304}),verify:()=>{}});
  assert.equal(r.accepted.length,0);assert.equal(r.applied,false);
  assert.equal(fs.readFileSync(output,'utf8'),'publish=sentinel\n','A belső tesztek nem írhatják felül az éles workflow publikálási kimenetét');
  assert(fs.readFileSync(file).equals(before));assert.equal(fs.statSync(path.join(dir,'snapshots/current/content.json')).mtimeMs,mtime);
});
test('Auto-Sync: hibás JSON, hiányos válasz és HTTP-hiba megőrzi az utolsó snapshotot',async t=>{
  const dir=workspace(t),file=path.join(dir,'snapshots/current/content.json'),before=fs.readFileSync(file),manifest=fs.readFileSync(path.join(dir,'snapshots/manifest.json'));
  for(const response of [()=>new Response('{bad'),()=>Response.json({version:'new'}),()=>new Response('unavailable',{status:503})]){
    await assert.rejects(runSync({root:dir,apply:true,inspect:false,fetcher:async()=>response()}));
    assert(fs.readFileSync(file).equals(before));assert(fs.readFileSync(path.join(dir,'snapshots/manifest.json')).equals(manifest));
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'reports/failed-sync.json'))).applied,false);
  }
});
test('Auto-Sync: sikertelen importteszt minden generált adatot visszaállít',async t=>{
  const dir=workspace(t),before=fs.readFileSync(path.join(dir,'data/sync-import.json')),atlas=fs.readFileSync(path.join(dir,'data/atlas.json'));
  const c=source();c.items.push({...c.items[0],id:'test_rollback'});
  await assert.rejects(runSync({root:dir,apply:true,inspect:false,fetcher:async()=>Response.json(c),verify:()=>{fs.writeFileSync(path.join(dir,'data/atlas.json'),'broken');throw Error('test failure');}}),/test failure/);
  assert(fs.readFileSync(path.join(dir,'data/sync-import.json')).equals(before));assert(fs.readFileSync(path.join(dir,'data/atlas.json')).equals(atlas));
});
test('Auto-Sync: snapshot-hash eltérése blokkolja az importot',async t=>{
  const dir=workspace(t),file=path.join(dir,'snapshots/current/content.json'),before=fs.readFileSync(file);
  const c=JSON.parse(before);c.version='corrupted';fs.writeFileSync(file,JSON.stringify(c));
  await assert.rejects(runSync({root:dir,apply:true,inspect:false,fetcher:async()=>new Response(null,{status:304})}),/hash/);
  assert(!JSON.parse(fs.readFileSync(path.join(dir,'reports/failed-sync.json'))).applied);
});
test('Auto-Sync: ismeretlen mechanika ellenőrzési tétele változatlan következő futáskor is megmarad',async t=>{
  const dir=workspace(t),c=source();c.unknownAstralSystem={level:9};
  let r=await runSync({root:dir,apply:true,inspect:false,fetcher:async()=>Response.json(c)});
  assert.equal(r.applied,false);assert(r.review.some(x=>x.path==='/unknownAstralSystem'));
  r=await runSync({root:dir,apply:true,inspect:false,fetcher:async()=>new Response(null,{status:304})});
  assert.equal(r.applied,false);assert(r.review.some(x=>x.path==='/unknownAstralSystem'));
});
