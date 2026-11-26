import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import os from 'node:os';
import path from 'node:path';
import {runSync,syncStateFiles} from '../scripts/atlas-sync.mjs';
import {validateDungeon,dungeonRecord} from '../scripts/dungeon-sync.mjs';
import {migrateEngineV3,planEngine,validateContract,engineBranches} from '../scripts/data-engine.mjs';
import {statsAdditions,newBranchContracts} from '../scripts/data-engine-v3-contract.mjs';
import {watchContent,officialArticles} from '../scripts/future-content-watcher.mjs';
import {sha256} from '../scripts/atlas-sync-model.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const c=read('snapshots/current/content.json'),db=read('data/atlas.json'),state=read('data/data-engine.json'),contracts=read('data/data-engine-contract.json');
test('V3: all 80 normal/heroic rooms and recommendations exactly match the saved API',()=>{
  let n=0;for(const d of c.dungeons){const atlas=db.dungeons.find(x=>x.id===d.id);validateDungeon(d,atlas,db);assert.deepEqual(dungeonRecord(atlas),d);n+=d.rooms.length+d.heroic.rooms.length;}assert.equal(n,80);
  assert.equal(db.dungeons.find(x=>x.id==='spider').recommendedLevel,36);assert.equal(db.dungeons.find(x=>x.id==='dragon').recommendedLevel,48);
  assert.equal(db.dungeons.find(x=>x.id==='wild').heroic.rooms[0].def,353.55793627532057);
});
test('V3: fractional defence only; integer IDs, levels, counts and invalid numbers stay blocked',()=>{
  const d=c.dungeons[0],old=db.dungeons.find(x=>x.id===d.id);
  const valid=structuredClone(d);valid.heroic.rooms[0].def=.5;validateDungeon(valid,old,db);
  for(const mutate of [d=>d.heroic.rooms[0].def=NaN,d=>d.heroic.rooms[0].def=Infinity,d=>d.heroic.rooms[0].def=-1,d=>d.heroic.rooms[0].level=1.5,d=>d.heroic.rooms[0].room=1.5,d=>d.heroic.rooms[0].maxHp=1.5,d=>d.recommendedLevel=36.5,d=>d.keysPerDay=.5]){const bad=structuredClone(d);mutate(bad);assert.throws(()=>validateDungeon(bad,old,db));}
});
test('V3: additive migration preserves old contracts and rejects an unreviewed field',()=>{
  const s=structuredClone(state),k=structuredClone(contracts);s.schema=2;k.schema=2;
  for(const key of Object.keys(newBranchContracts)){delete s.branches[key];delete k.branches[key];}
  for(const p of Object.keys(statsAdditions)){const parts=p.split('.'),last=parts.pop();let data=s.branches.stats.data,node=k.branches.stats;for(const part of parts){data=data[part];node=node.object[part];}delete data[last];delete node.object[last];}
  delete s.branches.bonus.data.tierLevel.lowT5;delete k.branches.bonus.object.tierLevel.object.lowT5;
  for(const b of Object.values(s.branches))b.sha256=sha256(JSON.stringify(b.data));
  const result=migrateEngineV3(s,k,c);assert.equal(result.state.schema,3);assert.deepEqual(result.contracts.branches.pets,k.branches.pets);assert.equal(s.schema,2);
  for(const [key,b] of Object.entries(result.state.branches))validateContract(b.data,result.contracts.branches[key]);
  const invalid=structuredClone(c);invalid.harcero.rules.supportSoft.push('unreviewed');assert.throws(()=>migrateEngineV3(s,k,invalid));
});
test('V3: unchanged branches have comparison evidence and rejected branches are stale',()=>{
  const approved=structuredClone(c);for(const [key,source] of Object.entries(engineBranches)){const parts=source.split('.'),last=parts.pop();let node=approved;for(const part of parts)node=node[part];node[last]=structuredClone(state.branches[key].data);}
  const p=planEngine(approved,state,contracts,{now:'2026-11-20T12:00:00Z'});
  for(const b of Object.values(p.state.branches)){assert.equal(b.checkedVersion,c.version);assert.equal(b.checkedSourceHash,b.sha256);}
  const bad=structuredClone(approved);bad.harcero.newMechanic=1;const q=planEngine(bad,state,contracts);assert.equal(q.state.branches.stats.comparison,'stale');assert.deepEqual(q.state.branches.stats.data,state.branches.stats.data);
});
test('V3: a failed import rolls back the actual schema migration and every generated file',async t=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-v3-migration-'));
  t.after(()=>{assert(path.resolve(temp).startsWith(path.resolve(os.tmpdir())+path.sep+'atlas-v3-migration-'));fs.rmSync(temp,{recursive:true,force:true});});
  const save=(p,v)=>{fs.mkdirSync(path.dirname(path.join(temp,p)),{recursive:true});fs.writeFileSync(path.join(temp,p),JSON.stringify(v));};
  const s=structuredClone(state),k=structuredClone(contracts);s.schema=2;k.schema=2;
  for(const key of Object.keys(newBranchContracts)){delete s.branches[key];delete k.branches[key];}
  for(const p of Object.keys(statsAdditions)){const parts=p.split('.'),last=parts.pop();let data=s.branches.stats.data,node=k.branches.stats;for(const part of parts){data=data[part];node=node.object[part];}delete data[last];delete node.object[last];}
  delete s.branches.bonus.data.tierLevel.lowT5;delete k.branches.bonus.object.tierLevel.object.lowT5;
  for(const b of Object.values(s.branches))b.sha256=sha256(JSON.stringify(b.data));
  for(const [file,value] of Object.entries({'data/data-engine.json':s,'data/data-engine-contract.json':k,'data/atlas.json':db,'data/addon-pet-model.json':read('data/addon-pet-model.json'),'data/sync-import.json':read('data/sync-import.json'),'snapshots/current/content.json':c,'snapshots/manifest.json':{schema:1,resources:{},content:{url:'https://stonestorm.gg/api/content',sha256:sha256(JSON.stringify(c))}}}))save(file,value);
  const before=new Map(syncStateFiles.map(f=>[f,fs.existsSync(path.join(temp,f))?fs.readFileSync(path.join(temp,f)):null]));
  await assert.rejects(runSync({root:temp,apply:true,inspect:false,fetcher:async()=>Response.json(c),verify:()=>{
    assert.equal(JSON.parse(fs.readFileSync(path.join(temp,'data/data-engine-contract.json'))).schema,3);
    assert.equal(JSON.parse(fs.readFileSync(path.join(temp,'data/data-engine.json'))).schema,3);
    throw Error('Intentional migration rollback');
  }}),/Intentional migration rollback/);
  for(const [file,bytes] of before)if(bytes===null)assert(!fs.existsSync(path.join(temp,file)),file);else assert(fs.readFileSync(path.join(temp,file)).equals(bytes),file);
});
test('V3: Atlas limits match both API keys; no raw defence cap or unproved soft result',()=>{
  const context=vm.createContext({STONESTORM_ATLAS:db});for(const p of ['js/atlas-math.js','js/bonus-system.js','js/stat-limits.js'])vm.runInContext(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'),context);
  assert.equal(context.StonestormStats.byId.evadeNormal.cap,30);assert.equal(c.harcero.rules.monsterEvadeCap,c.harcero.combat.rules.evadeMax);
  assert.equal(context.StonestormStats.byId.defenceRaw.cap,null);assert.equal(context.StonestormStats.critical.softCapUnverified,true);assert.equal(context.StonestormMath.criticalDamage(10000,50,40,0,context.StonestormStats.critical),null);
  for(const [id,cap] of Object.entries(c.harcero.rules.supportCaps))assert.equal(context.StonestormStats.byId[id].cap,cap*100);
});
test('Watcher: baseline and repeated observations do not generate alerts; assets never become announcements',()=>{
  const opts={content:c,now:'2026-11-20T12:00:00Z',sourceHash:sha256(c)},first=watchContent(opts);assert.deepEqual(first.newIds,[]);
  const repeat=watchContent({...opts,previous:first,now:'2026-11-20T18:00:00Z'});assert.deepEqual(repeat.newIds,[]);assert.equal(repeat.changed,false);
  const clientBase=watchContent({...opts,previous:first,resources:{'https://stonestorm.gg/':{kind:'public-client',status:200},'https://stonestorm.gg/assets/known.webp':{kind:'image-reference'}}});assert.deepEqual(clientBase.newIds,[]);
  const url='https://stonestorm.gg/assets/m7_new.webp',next=watchContent({...opts,previous:clientBase,resources:{[url]:{kind:'image-reference'}}});assert.equal(next.newIds.length,1);assert.equal(next.observations.find(x=>x.key===url).status,'prepared');assert(!next.observations.some(x=>x.status==='announced'));
  const again=watchContent({...opts,previous:next,resources:{[url]:{kind:'image-reference'}}});assert.deepEqual(again.newIds,[]);assert.equal(again.observations.find(x=>x.key===url).firstSeenAt,next.observations.find(x=>x.key===url).firstSeenAt);
  const missing=watchContent({...opts,previous:next});assert.equal(missing.observations.find(x=>x.key===url).seenThisCheck,false);
  const stale=watchContent({...opts,previous:first,resources:{'https://stonestorm.gg/':{kind:'public-client',status:'stale'}}});assert.equal(stale.coverage.client,'unavailable');assert.equal(stale.clientInitialized,false);
  assert.throws(()=>watchContent({...opts,official:[{id:'fake',source:'https://example.com',quote:'fake',publishedAt:opts.now}]}));
  const extended=structuredClone(c);extended.spine.xpTable.push(123);const xp=watchContent({...opts,content:extended,previous:first});assert.equal(xp.observations.find(x=>x.category==='xp').status,'prepared');assert.equal(extended.limits.maxLevel,60);
  const raised=structuredClone(c);raised.limits.maxLevel=99;const level=watchContent({...opts,content:raised,previous:first});assert.equal(level.newIds.length,1);assert.equal(level.observations.find(x=>x.category==='maxLevel').value,99);
  assert.equal(officialArticles('<p>m7_new.webp</p>','https://stonestorm.gg/').length,0);
  assert.equal(officialArticles('<script type="application/ld+json">'+JSON.stringify({'@type':'NewsArticle',headline:'Release',articleBody:'Official dated release evidence',datePublished:opts.now})+'</script>','https://stonestorm.gg/news/update').length,1);
});
