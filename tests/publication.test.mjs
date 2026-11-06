import test from 'node:test';
import assert from 'node:assert/strict';
import {runtimeFiles,sourceFiles,codeFiles,rightsIssues,scanText,assertSafeRelative,audit} from '../scripts/publication-plan.mjs';
import {pagesReadiness} from '../scripts/check-pages-inputs.mjs';
import {root} from '../scripts/publication-plan.mjs';

test('A külön forráskód-feltöltés nem terjeszti az ismeretlen engedélyű játékfájlokat',()=>{
  const files=codeFiles();
  for(const file of files){
    assert(!file.startsWith('source-data/'));
    assert(!file.startsWith('data/'));
    assert(!file.startsWith('Stonestorm_files/'));
    assert(!file.startsWith('assets/catalog-thumbs/'));
    assert(!file.startsWith('stonestorm_image_tools/downloaded/'));
    assert(!['js/atlas-data.js','js/image-data.js'].includes(file));
  }
  assert(files.includes('js/atlas-features.js'));
  assert(files.includes('js/planner-model.js'));
  assert.equal(audit(files).rightsPending.length,0);
  assert.equal(audit(files).secretOrPersonalFindings.length,0);
});
test('A teljes helyi adatok sem indítanak élesítést tisztázatlan engedély mellett',()=>{
  const readiness=pagesReadiness(root);
  assert.equal(readiness.missing.length,0);
  // Az engedélyek későbbi rendezésekor is használható teszt: a készültség a nyilvántartásnak felel meg.
  assert.equal(readiness.ready,readiness.pending.length===0);
});

test('A publikációs csomag nem tartalmazhat játékmentést vagy helyi titkos állományt',()=>{
  for(const file of sourceFiles()){
    assert(!file.startsWith('.integration/'));
    assert(!file.startsWith('.git/'));
    assert(!file.endsWith('.zip'));
    assert.notEqual(file,'Stonestorm.html');
    if(file.startsWith('Stonestorm_files/'))assert(file.endsWith('.webp'));
  }
  assert(runtimeFiles().includes('js/atlas-features.js'));
  assert(runtimeFiles().includes('js/planner-model.js'));
  assert(!runtimeFiles().some(file=>file.startsWith('source-data/')));
});
test('Az ismeretlen képengedély és az üres bizonyíték nem jelent engedélyt',()=>{
  const files=['stonestorm_image_tools/downloaded/weapons/example.webp','assets/catalog-thumbs/hash.webp'];
  assert.equal(rightsIssues(files,{scopes:{}}).length,1);
  assert.equal(rightsIssues(files,{scopes:{'game-art-catalog':{status:'confirmed',evidence:''}}}).length,1);
  assert.equal(rightsIssues(files,{scopes:{'game-art-catalog':{status:'confirmed',evidence:'A tesztben megadott terjesztési engedély'}}}).length,0);
});
test('Titokkereső felismeri a tesztkulcsot, de a jelentés nem tartalmazza az értékét',()=>{
  const fake='ghp_'+'A'.repeat(40);
  const found=scanText('const value = "'+fake+'";','example.js');
  assert.equal(found.length,1);
  assert.equal(found[0].file,'example.js');
  assert(!JSON.stringify(found).includes(fake));
  const assignment='const '+'password = "'+'testvalue'.repeat(3)+'"';
  assert(scanText(assignment,'fixture.js').length);
});
test('A csomagolás tiltja a könyvtárbejárást és a titkos konfigurációt',()=>{
  for(const file of ['../private','js/../../private','C:/private','.env','assets/.env.local','Stonestorm.html','.git/config','private.key'])assert.throws(()=>assertSafeRelative(file),file);
  assert.doesNotThrow(()=>assertSafeRelative('assets/images/key-art-640.webp'));
});
