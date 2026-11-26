import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {sourceFiles,root} from '../scripts/publication-plan.mjs';
import {runSync,syncStateFiles} from '../scripts/atlas-sync.mjs';
import {API,sha256} from '../scripts/atlas-sync-model.mjs';

// Külön tesztbelépő: az éles runSync által indított npm test nem hívhatja önmagát.
// Valódi build + teljes npm test fut, saját projektmásolatban, hálózati API helyett fixture-rel.
test('Auto-Sync apply: teljes build és npm test izolált projektben', {timeout:180000},async t=>{
  const prefix='atlas apply pipeline-',temp=fs.mkdtempSync(path.join(os.tmpdir(),prefix));
  t.after(()=>{
    const resolved=path.resolve(temp);
    assert(resolved.startsWith(path.resolve(os.tmpdir())+path.sep+prefix));
    fs.rmSync(resolved,{recursive:true,force:true});
  });
  for(const file of sourceFiles()){
    const target=path.join(temp,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target);
  }
  fs.cpSync(path.join(root,'node_modules'),path.join(temp,'node_modules'),{recursive:true});
  const read=file=>JSON.parse(fs.readFileSync(path.join(temp,file),'utf8'));
  const save=(file,value)=>fs.writeFileSync(path.join(temp,file),JSON.stringify(value));
  const initial=read('snapshots/current/content.json');
  const candidate=structuredClone(initial);candidate.version='sync_fixture_v2';
  candidate.mobs.push({...candidate.mobs[0],id:'sync_pipeline_new_mob'});
  // A gyermek npm test indulásakor közvetlenül igazoljuk a közös verziót és hash-t.
  fs.writeFileSync(path.join(temp,'tests/sync-state-probe.mjs'),`
    import fs from 'node:fs';import assert from 'node:assert/strict';import {sha256} from '../scripts/atlas-sync-model.mjs';
    const read=p=>JSON.parse(fs.readFileSync(p));const c=read('snapshots/current/content.json'),d=read('data/atlas.json'),m=read('snapshots/manifest.json'),o=read('data/sync-import.json');
    assert.equal(c.version,read('tests/sync-candidate-probe.json').version);
    assert.equal(d.dataVersion,c.version);assert.equal(o.gameVersion,c.version);
    assert.equal(m.content.sha256,sha256(fs.readFileSync('snapshots/current/content.json')));
    assert.equal(o.sourceHash,m.content.sha256);
    assert.equal(process.env.GITHUB_OUTPUT,undefined);assert.equal(process.env.GITHUB_STATE,undefined);
    assert(d.mobs.some(x=>x.id==='sync_pipeline_new_mob'));
  `);
  const pkg=read('package.json'),originalTest=pkg.scripts.test;
  pkg.scripts.test='node tests/sync-state-probe.mjs && '+originalTest;save('package.json',pkg);
  const output=path.join(temp,'step-output');
  const fetcher=async url=>url===API?Response.json(candidate):new Response('denied',{status:403});
  const beforeSet=read('data/atlas.json').sets,beforeAddon=fs.readFileSync(path.join(temp,'downloads/stonestorm-statcap-overlay.zip'));
  await t.test('Új ellenfél: konzisztens tesztverzió, sikeres import és ismételt 304',async()=>{
    save('tests/sync-candidate-probe.json',candidate);
    const result=await runSync({root:temp,apply:true,fetcher,outputFile:output});
    assert.equal(result.applied,true);assert.equal(result.status,'applied');
    assert(result.accepted.some(x=>x.path==='/mobs/sync_pipeline_new_mob'));
    assert.equal(read('data/atlas.json').dataVersion,candidate.version);
    assert.equal(read('snapshots/current/content.json').version,candidate.version);
    assert.equal(read('snapshots/manifest.json').content.sha256,sha256(JSON.stringify(candidate)));
    assert.deepEqual(read('data/atlas.json').sets,beforeSet);
    assert(fs.readFileSync(path.join(temp,'downloads/stonestorm-statcap-overlay.zip')).equals(beforeAddon));
    assert.match(fs.readFileSync(output,'utf8'),/^publish=true$/m);
    const secondOutput=path.join(temp,'repeat-output');
    const repeat=await runSync({root:temp,apply:true,inspect:false,outputFile:secondOutput,fetcher:async()=>new Response(null,{status:304})});
    assert.equal(repeat.applied,false);assert.equal(repeat.status,'unchanged');
    assert.match(fs.readFileSync(secondOutput,'utf8'),/^publish=false$/m);
  });
  await t.test('Data Engine V2: igazolt kísérőimport, közös modell és ZIP teljes apply folyamatban',async()=>{
    candidate.version='sync_pet_fixture_v2';candidate.pets.types.find(p=>p.id==='pet_wolf').perLevel.xpMult+=.001;
    save('tests/sync-candidate-probe.json',candidate);
    const fixture=fs.readFileSync(path.join(root,'tests/fixtures/pet-client-formulas.js'),'utf8');
    const locale=read('data/addon-pet-model.json').locale;
    const publicFetcher=async url=>url===API?Response.json(candidate):url==='https://stonestorm.gg/'?new Response('<script src="/assets/index-TestData.js"></script>'):url.endsWith('/index-TestData.js')?new Response('import "./GameApp-TestData.js"; import "./texts.hu-TestData.js";'):url.endsWith('/GameApp-TestData.js')?new Response(fixture):url.endsWith('/texts.hu-TestData.js')?new Response('const locale={"./pets.hu.json":'+JSON.stringify(locale)+'};'):new Response('denied',{status:403});
    const result=await runSync({root:temp,apply:true,fetcher:publicFetcher});assert.equal(result.applied,true);
    assert(result.accepted.some(x=>x.path==='/pets'&&x.engine===3));
    const built=read('data/atlas.json'),petModel=read('data/addon-pet-model.json');
    assert.deepEqual(built.petModel.config,petModel.config);assert.equal(petModel.gameVersion,candidate.version);
    assert.equal(built.pets.find(p=>p.id==='pet_wolf').perLevel.xpMult,candidate.pets.types.find(p=>p.id==='pet_wolf').perLevel.xpMult);
    assert.equal(read('downloads/stat-addon.json').sha256,sha256(fs.readFileSync(path.join(temp,'downloads/stonestorm-statcap-overlay.zip'))));
    assert.deepEqual(built.sets,beforeSet);
  });
  await t.test('Valódi npm-test hiba: minden állapot visszaáll és nincs publikálás',async()=>{
    const before=new Map(syncStateFiles.map(file=>[file,fs.existsSync(path.join(temp,file))?fs.readFileSync(path.join(temp,file)):null]));
    candidate.version='sync_fixture_v3';candidate.mobs.at(-1).maxHp++;
    save('tests/sync-candidate-probe.json',candidate);
    fs.writeFileSync(path.join(temp,'tests/sync-fail-probe.mjs'),"throw Error('Intentional pipeline regression failure');\n");
    pkg.scripts.test+=' && node tests/sync-fail-probe.mjs';save('package.json',pkg);
    const failedOutput=path.join(temp,'failed-output');
    await assert.rejects(runSync({root:temp,apply:true,fetcher,outputFile:failedOutput}),/Importellenőrzés sikertelen/);
    for(const [file,bytes] of before)if(bytes===null)assert(!fs.existsSync(path.join(temp,file)),file);else assert(fs.readFileSync(path.join(temp,file)).equals(bytes),file);
    assert.equal(fs.readFileSync(failedOutput,'utf8'),'publish=false\n');
    const failed=read('reports/failed-sync.json');assert.equal(failed.applied,false);assert.deepEqual(failed.rollbackErrors,[]);
  });
});
