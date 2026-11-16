import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {API,sha256,diffJSON,validateContent,fullSetBonuses,planImport,applyOverlay,equal} from '../scripts/atlas-sync-model.mjs';
import {runSync,fetchPublic,discover,syncStateFiles} from '../scripts/atlas-sync.mjs';
import {dungeonRecord,dungeonStructure} from '../scripts/dungeon-sync.mjs';
import {reconcileReview,reviewGroups,loadReviewAliases} from '../scripts/sync-review.mjs';

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
  for(const file of ['data/data-engine.json','data/data-engine-contract.json','data/addon-pet-model.json','data/atlas.json','data/sync-import.json','js/atlas-data.js','data/image-manifest.json','snapshots/current/content.json']){
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
  const dir=workspace(t),before=new Map(syncStateFiles.map(file=>[file,fs.existsSync(path.join(dir,file))?fs.readFileSync(path.join(dir,file)):null]));
  const c=source();c.version='rollback_candidate';c.items.push({...c.items[0],id:'test_rollback'});
  const output=path.join(dir,'step-output');
  await assert.rejects(runSync({root:dir,apply:true,inspect:false,outputFile:output,fetcher:async()=>Response.json(c),verify:()=>{
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'snapshots/current/content.json'))).version,c.version);
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'snapshots/manifest.json'))).content.sha256,sha256(JSON.stringify(c)));
    for(const file of syncStateFiles){fs.mkdirSync(path.dirname(path.join(dir,file)),{recursive:true});fs.writeFileSync(path.join(dir,file),'broken test output');}
    throw Error('test failure');
  }}),/test failure/);
  for(const [file,bytes] of before)if(bytes===null)assert(!fs.existsSync(path.join(dir,file)),file);else assert(fs.readFileSync(path.join(dir,file)).equals(bytes),file);
  assert.equal(fs.readFileSync(output,'utf8'),'publish=false\n');
  const failure=JSON.parse(fs.readFileSync(path.join(dir,'reports/failed-sync.json')));assert.equal(failure.applied,false);assert.deepEqual(failure.rollbackErrors,[]);
});

test('Auto-Sync: késői állapotírási hiba az importot, snapshotot és új történeti fájlt is visszavonja',async t=>{
  const dir=workspace(t),before=new Map(syncStateFiles.map(file=>[file,fs.existsSync(path.join(dir,file))?fs.readFileSync(path.join(dir,file)):null]));
  const c=source();c.version='late_failure_candidate';c.items.push({...c.items[0],id:'late_rollback'});
  await assert.rejects(runSync({root:dir,apply:true,inspect:false,outputFile:dir,fetcher:async()=>Response.json(c),verify:()=>{
    const d=JSON.parse(fs.readFileSync(path.join(dir,'data/atlas.json'))),overlay=JSON.parse(fs.readFileSync(path.join(dir,'data/sync-import.json')));
    applyOverlay(d,overlay);fs.writeFileSync(path.join(dir,'data/atlas.json'),JSON.stringify(d));
  }}));
  for(const [file,bytes] of before)if(bytes===null)assert(!fs.existsSync(path.join(dir,file)),file);else assert(fs.readFileSync(path.join(dir,file)).equals(bytes),file);
  assert(!fs.existsSync(path.join(dir,'snapshots/history',sha256(before.get('snapshots/current/content.json'))+'.json')));
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'reports/failed-sync.json'))).applied,false);
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

function dungeonFixture(){
  const db=base(),c=source(),raw=load('source-data/06_terkepek_szornyek_bossok_kazamatak.json').dungeons;
  db.dungeons=raw.map(x=>({...structuredClone(x),name:x.id,provenance:{source:'06_terkepek_szornyek_bossok_kazamatak.json',status:'verified'}}));
  c.dungeons=structuredClone(raw);
  for(const d of c.dungeons)for(const room of d.heroic.rooms)for(const stat of ['maxHp','atkMin','atkMax','harcero'])room[stat]+=100;
  return {c,db};
}
const dungeonPath='/dungeons/wild/heroic/rooms/0/maxHp';
function reviewState({c,db,previous={},changes=[],aliases={},plan=planImport(c,db),now='2026-11-15T12:00:00Z'}){
  return reconcileReview({previous,changes,plan,content:c,db,aliases,now,sourceHash:sha256(JSON.stringify(c)),sources:[]});
}
test('Kazamataimport: 40 hősi terem 160 statja frissül, a szabályok és a védett rendszerek nem',()=>{
  const {c,db}=dungeonFixture(),before=structuredClone(db),plan=planImport(c,db);
  assert.equal(plan.accepted.filter(x=>x.path.startsWith('/dungeons/')).length,4);
  assert.equal(plan.accepted.flatMap(x=>x.fieldChanges??[]).length,160);
  applyOverlay(db,plan.overlay);
  for(const d of db.dungeons){assert.deepEqual(dungeonRecord(d),c.dungeons.find(x=>x.id===d.id));assert.deepEqual(dungeonStructure(d),dungeonStructure(before.dungeons.find(x=>x.id===d.id)));assert.equal(d.provenance.status,'derived');}
  assert.deepEqual(db.sets,before.sets);assert.deepEqual(db.petSystem,before.petSystem);
});
test('Kazamataimport: hiányos, duplikált, új mechanikájú vagy hibás statú terem blokkolva',()=>{
  const mutations=[
    d=>delete d.heroic.rooms[0].maxHp,
    d=>d.heroic.rooms[0].maxHp=-1,
    d=>d.heroic.rooms[0].harcero=Infinity,
    d=>d.heroic.rooms[0].maxHp=1.5,
    d=>d.heroic.rooms[0].atkMin=d.heroic.rooms[0].atkMax+1,
    d=>d.heroic.rooms[0].newMechanism=1,
    d=>d.heroic.rooms[0].creatureId='unknown_creature',
    d=>d.heroic.rooms[0].role='boss',
    d=>d.heroic.minLevel++,
    d=>d.heroic.rooms.push({...d.heroic.rooms[0]}),
    d=>d.heroic.rooms.pop(),
    d=>d.keyId='unknown_key',
    d=>d.deeper.hp=99,
    d=>delete d.runPay,
  ];
  for(const mutate of mutations){const {c,db}=dungeonFixture();mutate(c.dungeons[0]);const p=planImport(c,db);assert(!p.overlay.dungeons?.wild);assert(p.review.some(x=>x.path==='/dungeons/wild'));}
});
test('Kazamataimport: teremszám a stabil azonosító, nem a tömbsorrend',()=>{
  const {c,db}=dungeonFixture();c.dungeons[0].heroic.rooms.reverse();
  const p=planImport(c,db);applyOverlay(db,p.overlay);
  assert.equal(db.dungeons[0].heroic.rooms.find(x=>x.room===1).maxHp,c.dungeons[0].heroic.rooms.find(x=>x.room===1).maxHp);
  assert.equal(new Set(db.dungeons[0].heroic.rooms.map(x=>x.room)).size,10);
});
test('Kazamataimport: hiányzó/duplikált kazamata nem törli a korábbi importot; új család nem importálódik',()=>{
  const {c,db}=dungeonFixture(),first=planImport(c,db);applyOverlay(db,first.overlay);
  c.dungeons.push(structuredClone(c.dungeons[0]));c.dungeons.at(-1).heroic.rooms[0].maxHp++;
  let p=planImport(c,db,first.overlay);assert.deepEqual(p.overlay.dungeons.wild,first.overlay.dungeons.wild);assert(!p.validatedDungeons.includes('wild'));
  c.dungeons=undefined;p=planImport(c,db,first.overlay);assert.deepEqual(p.overlay.dungeons,first.overlay.dungeons);
  const next=source();next.dungeons.push({...next.dungeons[0],id:'new_unknown_dungeon'});p=planImport(next,db,first.overlay);assert(!p.overlay.dungeons.new_unknown_dungeon);assert(p.review.some(x=>x.path==='/dungeons/new_unknown_dungeon'));
});
test('Kazamataimport: a build újraellenőrzi az import szerkezetét és kapcsolatait',()=>{
  const {c,db}=dungeonFixture(),p=planImport(c,db);p.overlay.dungeons.wild.record.heroic.rooms[0].level++;
  assert.throws(()=>applyOverlay(db,p.overlay),/kazamatamechanika|teremkapcsolat/);
});
test('Besorolás: öt külön osztály és rendszer szerinti név, nem a harcerő szó alapján',()=>{
  const {c,db}=dungeonFixture(),aliases=loadReviewAliases(fileURLToPath(root));
  const previous={review:[{path:dungeonPath},{path:'/features/oldFlag',changeKind:'removed'},{path:'/features/newFlag',changeKind:'added'},{path:'https://stonestorm.gg/assets/hu-capture.js'},{path:'/harcero/bossEvadeCaps'}]};
  const r=reviewState({c,db,previous,aliases});
  assert.deepEqual(r.ledger.map(x=>x.classification),['automatic','unsupported','mechanism','observation','conflict']);
  assert.equal(r.ledger[0].system,'Kazamaták');assert.match(r.ledger[0].title,/hősi 1. terem.*életerő/);
  assert.equal(r.summary.open,5);assert.equal(r.summary.activity.new,0);
});
test('Régi tételek: csak az Atlasba igazoltan átvezetett stat zárul le, a puszta terv nem',()=>{
  const {c,db}=dungeonFixture(),previous={review:[{path:dungeonPath},{path:'/unknownSystem/rule'}]},plan=planImport(c,db);
  let r=reviewState({c,db,previous,plan});assert.equal(r.open.length,2);assert.equal(r.closedNow.length,0);
  applyOverlay(db,plan.overlay);r=reviewState({c,db,previous,plan});assert.equal(r.open.length,1);
  const closed=r.ledger.find(x=>x.path===dungeonPath);assert.equal(closed.resolution.rule,'validated-dungeon-stats-v1');assert.equal(closed.resolution.identity.room,1);assert.equal(r.summary.activity.automatic,1);
});
test('Régi tételek: változatlan következő válasz megtartja a nyitottakat és a lezárási bizonyítékot',()=>{
  const {c,db}=dungeonFixture(),plan=planImport(c,db);applyOverlay(db,plan.overlay);
  const previous={review:[{path:dungeonPath},{path:'/unknownSystem/rule'}]},first=reviewState({c,db,previous,plan});
  const next=reviewState({c,db,previous:{reviewLedger:first.ledger,reviewBaseline:first.baseline},now:'2026-11-16T12:00:00Z'});
  assert.equal(next.open.length,1);assert.equal(next.summary.activity.automatic,0);assert.equal(next.summary.resolvedTotal,1);
  assert.deepEqual(next.ledger.find(x=>x.status==='resolved').resolution,first.ledger.find(x=>x.status==='resolved').resolution);
});
test('Régi tételek: ugyanazon útvonal új értéke új esemény, a régi lezárás megmarad',()=>{
  const {c,db}=dungeonFixture(),plan=planImport(c,db);applyOverlay(db,plan.overlay);
  const first=reviewState({c,db,previous:{review:[{path:dungeonPath}]},plan});
  c.dungeons[0].heroic.rooms[0].maxHp++;
  const next=reviewState({c,db,previous:{reviewLedger:first.ledger,reviewBaseline:first.baseline},changes:[{path:dungeonPath,kind:'changed'}]});
  assert.equal(next.ledger.length,2);assert.equal(next.summary.resolvedTotal,1);assert.equal(next.open.length,1);assert.equal(next.summary.activity.new,1);
});
test('Dokumentált felülvizsgálat: pontos forrásalias és számított hátasadat zárható, eltérés nem',()=>{
  const {c,db}=dungeonFixture(),aliases=loadReviewAliases(fileURLToPath(root));c.lean.skills=structuredClone(aliases['/lean/skills'].value);
  const previous={review:[{path:'/lean/skills'},{path:'/mounts/pony/timeReductionPctFromTravelMult'}]};
  let r=reviewState({c,db,previous,aliases});assert.equal(r.summary.activity.documented,2);assert.equal(r.open.length,0);
  c.lean.skills={unexpected:1};db.mounts.find(x=>x.id==='pony').timeReductionPctFromTravelMult=99;
  r=reviewState({c,db,previous,aliases});assert.equal(r.open.length,2);
});
test('Nyitott tételek: az ezres darabszám sem törlési vagy lezárási ok',()=>{
  const {c,db}=dungeonFixture(),previous={review:Array.from({length:1005},(_,i)=>({path:'/unknownSystem/rule'+i}))};
  const r=reviewState({c,db,previous});assert.equal(r.open.length,1005);assert.equal(r.ledger.length,1005);
});
test('Csoportok: a témán belüli eltérő besorolások nem keverednek, a részletes útvonal megmarad',()=>{
  const {c,db}=dungeonFixture(),r=reviewState({c,db,previous:{review:[{path:'/features/a',changeKind:'removed'},{path:'/features/b',changeKind:'added'}]}});
  const groups=reviewGroups(r.open);assert.equal(groups.length,1);assert.equal(groups[0].topics.length,2);assert.equal(groups[0].count,2);
  assert(groups[0].topics.every(x=>x.paths[0].path.startsWith('/features/')));
});
test('Régi lezárás: egy korábbi értékre visszaváltás új esemény marad',()=>{
  const {c,db}=dungeonFixture(),plan=planImport(c,db);applyOverlay(db,plan.overlay);
  const first=reviewState({c,db,previous:{review:[{path:dungeonPath}]},plan});
  const original=c.dungeons[0].heroic.rooms[0].maxHp;
  c.dungeons[0].heroic.rooms[0].maxHp++;
  const secondPlan=planImport(c,db);applyOverlay(db,secondPlan.overlay);
  const second=reviewState({c,db,previous:{reviewLedger:first.ledger,reviewBaseline:first.baseline},changes:[{path:dungeonPath,kind:'changed'}],now:'2026-11-16T12:00:00Z'});
  c.dungeons[0].heroic.rooms[0].maxHp=original;
  const third=reviewState({c,db,previous:{reviewLedger:second.ledger,reviewBaseline:second.baseline},changes:[{path:dungeonPath,kind:'changed'}],now:'2026-11-17T12:00:00Z'});
  assert.equal(third.summary.activity.new,1);assert.equal(third.summary.resolvedTotal,2);assert.equal(third.open.length,1);
});
test('Nyilvános kliens: 403-as kezdőlapnál a már ismert modulhash és hivatkozások megmaradnak',async t=>{
  const dir=workspace(t),file=path.join(dir,'snapshots/manifest.json'),manifest=JSON.parse(fs.readFileSync(file));
  const url='https://stonestorm.gg/assets/known-module.js';manifest.resources={[url]:{url,sha256:'a'.repeat(64),references:[]}};fs.writeFileSync(file,JSON.stringify(manifest));
  const r=await runSync({root:dir,apply:false,inspect:true,fetcher:async url=>url.endsWith('/api/content')?new Response(null,{status:304}):new Response('denied',{status:403})});
  assert.equal(r.applied,false);assert.equal(JSON.parse(fs.readFileSync(file)).resources[url].sha256,'a'.repeat(64));assert(r.warnings.some(x=>x.reason.includes('403')));
});
