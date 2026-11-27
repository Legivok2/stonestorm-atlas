import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {sourceFiles,root} from '../scripts/publication-plan.mjs';
import {runSync,syncStateFiles} from '../scripts/atlas-sync.mjs';
import {API,sha256} from '../scripts/atlas-sync-model.mjs';
import {addonArtifacts,addonZip,addonVersionedZip,addonMetadata,assertAddonPackage} from '../scripts/addon-package.mjs';

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
  for(const file of ['tools/stonestorm-workspace/src/i18n/hu.json','tools/stonestorm-workspace/src/i18n/en.json','tools/stonestorm-workspace/src/policy.cjs','tools/stonestorm-workspace/src/chrome.html','tools/stonestorm-workspace/src/main.cjs']){
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
  const fixture=fs.readFileSync(path.join(root,'tests/fixtures/pet-client-formulas.js'),'utf8');
  const locale=read('data/addon-pet-model.json').locale;
  const publicFetcher=async url=>url===API?Response.json(candidate):url==='https://stonestorm.gg/'?new Response('<script src="/assets/index-TestData.js"></script>'):url.endsWith('/index-TestData.js')?new Response('import "./GameApp-TestData.js"; import "./texts.hu-TestData.js";'):url.endsWith('/GameApp-TestData.js')?new Response(fixture):url.endsWith('/texts.hu-TestData.js')?new Response('const locale={"./pets.hu.json":'+JSON.stringify(locale)+'};'):new Response('denied',{status:403});
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
    const oldZips=[addonZip,addonVersionedZip].map(file=>fs.readFileSync(path.join(temp,file)));
    const petOutput=path.join(temp,'pet-output');
    const result=await runSync({root:temp,apply:true,fetcher:publicFetcher,outputFile:petOutput});assert.equal(result.applied,true);
    assert(result.accepted.some(x=>x.path==='/pets'&&x.engine===3));
    const built=read('data/atlas.json'),petModel=read('data/addon-pet-model.json');
    assert.deepEqual(built.petModel.config,petModel.config);assert.equal(petModel.gameVersion,candidate.version);
    assert.equal(built.pets.find(p=>p.id==='pet_wolf').perLevel.xpMult,candidate.pets.types.find(p=>p.id==='pet_wolf').perLevel.xpMult);
    const zips=[addonZip,addonVersionedZip].map(file=>fs.readFileSync(path.join(temp,file)));
    assert(zips[0].equals(zips[1]));zips.forEach((zip,index)=>assert(!zip.equals(oldZips[index]),'ZIP not regenerated'));
    assert.equal(read(addonMetadata).sha256,sha256(zips[0]));
    assertAddonPackage(temp);
    assert.match(fs.readFileSync(petOutput,'utf8'),/^publish=true$/m);
    assert.deepEqual(built.sets,beforeSet);
  });
  await t.test('Sikertelen kísérőimport: mindkét újragenerált ZIP és minden állomány visszaáll',async()=>{
    const design='addons/stonestorm-statcap-overlay/companion-design.js',designPath=path.join(temp,design);
    const designBefore=fs.readFileSync(designPath);
    fs.unlinkSync(designPath);
    const history='reports/history/data-engine/'+sha256(read('data/data-engine.json'))+'.json';
    const paths=[...new Set([...syncStateFiles,...addonArtifacts,design,history])];
    const before=new Map(paths.map(file=>[file,fs.existsSync(path.join(temp,file))?fs.readFileSync(path.join(temp,file)):null]));
    assert.equal(before.get(history),null,'Expected a new transaction history file');
    const zipHashes=Object.fromEntries([addonZip,addonVersionedZip].map(file=>[file,sha256(before.get(file))]));
    const priorCandidate=structuredClone(candidate);
    try{
      candidate.version='sync_failed_pet_fixture';candidate.pets.types.find(p=>p.id==='pet_wolf').perLevel.xpMult+=.001;
      save('tests/sync-candidate-probe.json',candidate);
      save('tests/sync-original-zip-hashes.json',zipHashes);
      fs.writeFileSync(path.join(temp,'tests/sync-fail-pet-probe.mjs'),`
        import fs from 'node:fs';import assert from 'node:assert/strict';import {sha256} from '../scripts/atlas-sync-model.mjs';
        const old=JSON.parse(fs.readFileSync('tests/sync-original-zip-hashes.json'));
        const normal=fs.readFileSync(${JSON.stringify(addonZip)}),versioned=fs.readFileSync(${JSON.stringify(addonVersionedZip)});
        assert(normal.equals(versioned));assert.notEqual(sha256(normal),old[${JSON.stringify(addonZip)}]);assert.notEqual(sha256(versioned),old[${JSON.stringify(addonVersionedZip)}]);
        assert.equal(JSON.parse(fs.readFileSync(${JSON.stringify(addonMetadata)})).sha256,sha256(normal));
        assert(fs.existsSync(${JSON.stringify(design)}));
        fs.writeFileSync('tests/sync-pet-probe-ran.json',JSON.stringify({normal:sha256(normal),versioned:sha256(versioned)}));
        throw Error('Intentional failure after ZIP generation');
      `);
      pkg.scripts.test='node tests/sync-state-probe.mjs && node tests/sync-fail-pet-probe.mjs';save('package.json',pkg);
      const failedOutput=path.join(temp,'failed-pet-output');
      await assert.rejects(runSync({root:temp,apply:true,fetcher:publicFetcher,outputFile:failedOutput}),/Importellenőrzés sikertelen/);
      const generated=read('tests/sync-pet-probe-ran.json');
      assert.notEqual(generated.normal,zipHashes[addonZip]);assert.notEqual(generated.versioned,zipHashes[addonVersionedZip]);
      for(const [file,bytes] of before)if(bytes===null)assert(!fs.existsSync(path.join(temp,file)),file);else assert(fs.readFileSync(path.join(temp,file)).equals(bytes),file);
      for(const file of [addonZip,addonVersionedZip])assert.equal(sha256(fs.readFileSync(path.join(temp,file))),zipHashes[file],file);
      assert.equal(fs.readFileSync(failedOutput,'utf8'),'publish=false\n');
      const failed=read('reports/failed-sync.json');assert.equal(failed.status,'failed');assert.equal(failed.applied,false);assert.equal(failed.gameVersion,candidate.version);assert(failed.accepted.some(x=>x.path==='/pets'&&x.engine===3));assert.match(failed.error,/Importellenőrzés sikertelen/);assert.deepEqual(failed.rollbackErrors,[]);
      assert.match(fs.readFileSync(path.join(temp,'reports/failed-sync.md'),'utf8'),/Importellenőrzés sikertelen/);
      fs.unlinkSync(path.join(temp,addonVersionedZip));
      fs.unlinkSync(path.join(temp,'tests/sync-pet-probe-ran.json'));
      const missingBefore=new Map(before);missingBefore.set(addonVersionedZip,null);
      const missingOutput=path.join(temp,'failed-missing-zip-output');
      await assert.rejects(runSync({root:temp,apply:true,fetcher:publicFetcher,outputFile:missingOutput}),/Importellenőrzés sikertelen/);
      assert.notEqual(read('tests/sync-pet-probe-ran.json').versioned,zipHashes[addonVersionedZip]);
      for(const [file,bytes] of missingBefore)if(bytes===null)assert(!fs.existsSync(path.join(temp,file)),file);else assert(fs.readFileSync(path.join(temp,file)).equals(bytes),file);
      assert.equal(fs.readFileSync(missingOutput,'utf8'),'publish=false\n');
    }finally{
      fs.writeFileSync(designPath,designBefore);
      fs.writeFileSync(path.join(temp,addonVersionedZip),before.get(addonVersionedZip));
      Object.assign(candidate,priorCandidate);
      pkg.scripts.test='node tests/sync-state-probe.mjs && '+originalTest;save('package.json',pkg);
    }
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
