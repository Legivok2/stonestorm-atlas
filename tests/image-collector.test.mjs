import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';
import {imageFixture} from './image-fixture.mjs';
import {imageURL,referencesFromModule,compareReferences,sha256,report,mappingExport} from '../scripts/image-collector-model.mjs';
import {discover,downloadNew,loadState,saveReview,importMappings,prepareImport,writeJSON,staging,safeFile,mutate} from '../scripts/image-collector.mjs';
import {codeFiles,sourceFiles,runtimeFiles,assertSafeRelative} from '../scripts/publication-plan.mjs';
const read=(root,p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
test('Future Content Watcher bridge enters discovery with evidence and no automatic mapping',async t=>{
 const f=await imageFixture(t),url='https://stonestorm.gg/art/icons/future_bridge.webp',catalog=fs.readFileSync(path.join(f.root,'data/image-catalog.json'));
 writeJSON(f.root,'data/future-image-references.json',{kind:'atlas-future-image-references',gameVersion:'fixture',images:[{url,observationIds:['stable-observation'],sources:[{url:'https://stonestorm.gg/assets/art-manifest-Fixture.js',path:'literal icons',sha256:'a'.repeat(64)}]}]});
 const state=await discover({root:f.root,from:path.join(f.root,'refs.json'),sleep:f.noSleep}),row=state.candidates.find(x=>x.url===url);
 assert(row);assert.equal(row.review.status,'pending');assert(row.sources.includes('future-content-watcher'));assert.deepEqual(row.observationIds,['stable-observation']);assert.equal(row.evidenceSources[0].sha256,'a'.repeat(64));assert(fs.readFileSync(path.join(f.root,'data/image-catalog.json')).equals(catalog));
});
test('Képcímek: külső host, token, API, redirect-paraméter, traversal és SVG kizárva',()=>{
 for(const url of ['http://stonestorm.gg/art/a.png','https://evil.invalid/art/a.png','https://stonestorm.gg/api/character','https://stonestorm.gg/art/a.png?token=PRIVATE','https://stonestorm.gg/art/a.png?url=elsewhere','https://stonestorm.gg/art/../art/a.png','https://stonestorm.gg/art/a%2fb.png','https://stonestorm.gg/art/a.svg','https://'+'user:pass@stonestorm.gg/art/a.png'])assert.throws(()=>imageURL(url));
 assert.equal(imageURL('https://stonestorm.gg/art/icons/item.webp?v=abc123'),'https://stonestorm.gg/art/icons/item.webp?v=abc123');
});
test('Statikus felderítés: új hash-elt manifest, explicit hivatkozás; kísérőkulcsból nincs kitalált URL',()=>{
 const index=referencesFromModule('import "./art-manifest-NEW12345.js"; const image="/art/scenes/home.png"; globalThis.DO_NOT_EXECUTE();','https://stonestorm.gg/assets/index-NEW12345.js');assert(index.modules.some(u=>u.endsWith('art-manifest-NEW12345.js')));assert.equal(index.images.length,1);
 const manifest=referencesFromModule('export default {icons:["new"],pets:["pet_test_1"],video:["clip"]};','https://stonestorm.gg/assets/art-manifest-NEW12345.js');assert.deepEqual(manifest.images.map(x=>x.url),['https://stonestorm.gg/art/icons/new.webp']);
 const sizes=referencesFromModule('export default {icons:["new"],variants:{icons:{new:{new:512,"new-128":128}}}};','https://stonestorm.gg/assets/art-manifest-NEW12345.js');assert.equal(sizes.images.length,1);assert.equal(sizes.images[0].variants.length,2,'A méretváltozatok nem lesznek újra letöltendő, külön képek');
});
test('Felderítés: a jelenlegi belépőmodul hivatkozását követi, nem a régi fájlnevet',async t=>{
 const f=await imageFixture(t),seen=[];const fetcher=async url=>{seen.push(url);if(url.endsWith('/'))return new Response('<script src="/assets/index-FRESH123.js"></script>');if(url.endsWith('index-FRESH123.js'))return new Response('import "./art-manifest-LATEST123.js";');return new Response('export default {icons:["old","fresh"]};');};
 const state=await discover({root:f.root,fetcher,sleep:f.noSleep});assert(state.discovery.entrypointConfirmed);assert(seen.includes('https://stonestorm.gg/assets/art-manifest-LATEST123.js'));assert.equal(report(state).newReferences,1);assert.equal(state.candidates.find(c=>c.id==='old').status,'known');
});
test('403 esetén jelölt fallback, 429 esetén további kérések nélkül leállás',async t=>{
 const f=await imageFixture(t);writeJSON(f.root,'snapshots/manifest.json',{resources:{'https://stonestorm.gg/assets/index-RECORDED1.js':{references:[]}}});
 let calls=0;const blocked=await discover({root:f.root,fetcher:async()=>{calls++;return new Response('',{status:429});},sleep:f.noSleep});assert.equal(calls,1);assert.equal(blocked.discovery.entrypointConfirmed,false);
 const stale=await discover({root:f.root,fetcher:async url=>url.endsWith('/')?new Response('',{status:403}):new Response('const img="/art/icons/referenced.png";'),sleep:f.noSleep});assert(!stale.discovery.entrypointConfirmed);assert(stale.discovery.warnings.some(w=>w.includes('403')));assert.equal(report(stale).newReferences,1);
});
test('Csak új fájlokat kér le; a SHA-duplikátum nem kap új példányt, a régi CSV és katalógus változatlan',async t=>{
 const f=await imageFixture(t,{seed:true}),state=loadState(f.root);assert.equal(report(state).downloaded,2);assert.equal(report(state).uniqueNewFiles,1);assert.equal(report(state).duplicates,1);
 assert(f.calls.every(c=>c.options.redirect==='error'&&c.options.credentials==='omit'));assert.equal(fs.readFileSync(path.join(f.root,'stonestorm_image_tools/results.csv'),'utf8'),'legacy log must survive\n');assert.equal(read(f.root,'data/image-catalog.json').entries.length,1);assert.equal(sha256(fs.readFileSync(path.join(f.root,'legacy/old.png'))),f.oldImage.sha256);
 await downloadNew({root:f.root,fetcher:f.fetcher,sleep:f.noSleep});assert.equal(f.calls.length,2);
});
test('Valódi tartalomváltozás új verzióként tárolódik; a régi párosított fájl nem íródik felül',async t=>{
 const f=await imageFixture(t),catalog=read(f.root,'data/image-catalog.json'),oldManifest=read(f.root,'stonestorm_image_tools/manifest.json');
 const url=f.oldImage.sourceUrl,images=[{key:sha256(url),url,filename:'old.webp',id:'old',category:'icons',sources:['test'],expectedSha256:sha256(f.fresh)}],diff=compareReferences(images,catalog,oldManifest);assert.equal(diff[0].change,'changed');
 writeJSON(f.root,'refs.json',{images:[{url,sha256:sha256(f.fresh)}]});await discover({root:f.root,from:path.join(f.root,'refs.json'),sleep:f.noSleep});await downloadNew({root:f.root,fetcher:async()=>new Response(f.fresh),sleep:f.noSleep});assert.equal(report(loadState(f.root)).changedReferences,1);assert.equal(sha256(fs.readFileSync(path.join(f.root,'legacy/old.png'))),f.oldImage.sha256);
});
test('Sérült kép és hibás checksum karanténban marad; 403/429 megszakítja a letöltési sort',async t=>{
 const f=await imageFixture(t);await discover({root:f.root,from:path.join(f.root,'refs.json'),sleep:f.noSleep});await downloadNew({root:f.root,fetcher:async()=>new Response('<html>not an image</html>'),sleep:f.noSleep});assert.equal(report(loadState(f.root)).unavailable,2);assert.equal(report(loadState(f.root)).downloaded,0);
 for(const status of [403,429]){mutate(f.root,s=>{s.downloadBlock=null;for(const c of s.candidates)c.status='queued';});let calls=0;await downloadNew({root:f.root,fetcher:async()=>{calls++;return new Response('',{status,headers:{'retry-after':'120'}});},sleep:f.noSleep});assert.equal(calls,1);assert(loadState(f.root).downloadBlock);await assert.rejects(downloadNew({root:f.root,fetcher:f.fetcher,sleep:f.noSleep}),/korlátozta/);}
});
test('Mapping: minden döntés megmarad, nincs automatikus jóváhagyás, importellenőrzés hashhez kötött',async t=>{
 const f=await imageFixture(t,{seed:true}),state=loadState(f.root),c=state.candidates[0];assert.equal(report(state).approved,0);
 saveReview(f.root,c.key,{status:'approved',target:{kind:'item',id:'new_item'},rights:{status:'unverified'}});const exported=mappingExport(loadState(f.root));assert.equal(exported.entries.length,1);assert.equal(exported.entries[0].target.usage,'primary');importMappings(f.root,exported);assert.equal(report(loadState(f.root)).approved,1);
 const bad=structuredClone(exported);bad.entries[0].sha256='0'.repeat(64);assert.throws(()=>importMappings(f.root,bad));const wrong=structuredClone(exported);wrong.baselineCatalogSha256='0'.repeat(64);assert.throws(()=>importMappings(f.root,wrong));
 saveReview(f.root,c.key,{status:'later',rights:{status:'unverified'}});assert.equal(loadState(f.root).candidates[0].review.status,'later');saveReview(f.root,c.key,{status:'rejected'});assert.equal(loadState(f.root).candidates[0].review.status,'rejected');
});
test('Jogellenőrzés: párosítás önmagában nem publikálható; csak staging importcsomag készül',async t=>{
 const f=await imageFixture(t,{seed:true}),c=loadState(f.root).candidates[0],before=fs.readFileSync(path.join(f.root,'data/image-catalog.json')),store=fs.readFileSync(path.join(f.root,'js/image-store.js'));
 saveReview(f.root,c.key,{status:'approved',target:{kind:'item',id:'new_item'}});assert.equal(prepareImport(f.root).eligible,0);assert.equal(prepareImport(f.root).blockedByRights,1);
 saveReview(f.root,c.key,{status:'approved',target:{kind:'item',id:'new_item'},rights:{status:'confirmed',evidence:'Fixture-only explicit permission'}});const result=prepareImport(f.root);assert.equal(result.eligible,1);assert.equal(result.activeAtlasModified,false);
 const next=read(f.root,staging+'/prepared/data/image-catalog.json');assert.deepEqual(next.entries[0],f.oldImage);assert.equal(next.entries[1].status,'partial');assert.equal(next.entries[1].permission,'user-confirmed-evidence');assert(before.equals(fs.readFileSync(path.join(f.root,'data/image-catalog.json'))));assert(store.equals(fs.readFileSync(path.join(f.root,'js/image-store.js'))));
});
test('Az előkészített image-store adapter megőrzi a többi kísérőformát és az eredeti katalógushash-eket',async t=>{
 const f=await imageFixture(t,{seed:true}),pet=loadState(f.root).candidates.find(c=>c.category==='pets');saveReview(f.root,pet.key,{status:'approved',target:{kind:'pet',id:'pet_test',form:3},rights:{status:'confirmed',evidence:'Fixture-only explicit permission'}});prepareImport(f.root);
 const catalog=read(f.root,staging+'/prepared/data/image-catalog.json'),context=vm.createContext({STONESTORM_IMAGES:catalog,STONESTORM_ATLAS:f.db,document:{addEventListener(){}}});vm.runInContext(fs.readFileSync(path.join(f.root,staging,'prepared/js/image-store.js'),'utf8'),context);
 assert.equal(context.AtlasImages.pet('pet_test',1).id,f.oldImage.id);assert.notEqual(context.AtlasImages.pet('pet_test',3).id,f.oldImage.id);assert.equal(context.AtlasImages.pet('pet_test',3).sha256,pet.sha256);assert.deepEqual(catalog.entries[0],f.oldImage);
});
test('Biztonságos fájlkezelés: traversal és külső elérési út nem olvasható',async t=>{const f=await imageFixture(t);for(const value of ['../secret','C:/secret','a\\b','/etc/passwd'])assert.throws(()=>safeFile(f.root,value));});

test('Eltérő forrás-checksum esetén a dekódolható kép sem hagyható jóvá',async t=>{
 const f=await imageFixture(t);writeJSON(f.root,'refs.json',{images:[{url:'https://stonestorm.gg/art/icons/checksum.png',sha256:'0'.repeat(64)}]});await discover({root:f.root,from:path.join(f.root,'refs.json'),sleep:f.noSleep});await downloadNew({root:f.root,fetcher:async()=>new Response(f.fresh),sleep:f.noSleep});
 const c=loadState(f.root).candidates.find(c=>c.id==='checksum');assert.equal(c.status,'invalid');assert.match(c.error,/SHA-256/);assert.equal(c.file,undefined);assert.throws(()=>saveReview(f.root,c.key,{status:'approved',target:{kind:'item',id:'new_item'}}));
});

test('A gyűjtő forrása csomagolható, de a staging képek, mappingok és naplók nem',()=>{
 for(const list of [codeFiles(),sourceFiles()]){assert(list.includes('stonestorm_image_tools/image-manager/index.html'));assert(list.includes('stonestorm_image_tools/IMAGE_COLLECTOR_V2.md'));assert(!list.some(p=>p.startsWith(staging+'/')));}
 assert(!runtimeFiles().some(p=>p.startsWith('stonestorm_image_tools/image-manager/')));for(const p of ['state.json','files/example.webp','prepared/data/image-catalog.json','events.jsonl'])assert.throws(()=>assertSafeRelative(staging+'/'+p));
});

test('Visszavont engedély után az előkészített másolat eltűnik, az eredeti kép és döntés megmarad',async t=>{
 const f=await imageFixture(t,{seed:true}),c=loadState(f.root).candidates.find(c=>c.category==='icons');saveReview(f.root,c.key,{status:'approved',target:{kind:'item',id:'new_item'},rights:{status:'confirmed',evidence:'Fixture-only explicit permission'}});assert(prepareImport(f.root).ready);
 const prepared=read(f.root,staging+'/prepared/data/image-catalog.json'),copy=path.join(f.root,staging,'prepared',prepared.entries.at(-1).file);assert(fs.existsSync(copy));
 saveReview(f.root,c.key,{status:'approved',target:{kind:'item',id:'new_item'},rights:{status:'unverified'}});const result=prepareImport(f.root);assert.equal(result.eligible,0);assert.equal(result.blockedByRights,1);assert(!fs.existsSync(copy));assert(fs.existsSync(path.join(f.root,c.file)));assert.equal(loadState(f.root).candidates.find(x=>x.key===c.key).review.status,'approved');assert.equal(read(f.root,staging+'/report.json').publishable,0);
});

test('Az előkészítés megőrzi a korábbi, más rekordhoz tartozó jóváhagyott mappingokat',async t=>{
 const f=await imageFixture(t),catalog=read(f.root,'data/image-catalog.json');catalog.approvedMappings=[{imageId:f.oldImage.id,kind:'item',id:'old_item',usage:'primary',sha256:f.oldImage.sha256}];writeJSON(f.root,'data/image-catalog.json',catalog);
 await discover({root:f.root,from:path.join(f.root,'refs.json'),sleep:f.noSleep});await downloadNew({root:f.root,fetcher:f.fetcher,sleep:f.noSleep});const c=loadState(f.root).candidates.find(c=>c.category==='icons');saveReview(f.root,c.key,{status:'approved',target:{kind:'item',id:'new_item'},rights:{status:'confirmed',evidence:'Fixture-only explicit permission'}});prepareImport(f.root);
 const next=read(f.root,staging+'/prepared/data/image-catalog.json');assert.equal(next.approvedMappings.length,2);assert.deepEqual(next.approvedMappings[0],catalog.approvedMappings[0]);assert.deepEqual(next.entries[0],catalog.entries[0]);
});

test('Ugyanahhoz a rekordhoz több galériakép jóváhagyható, két elsődleges kép továbbra sem',async t=>{
 const f=await imageFixture(t,{seed:true}),[a,b]=loadState(f.root).candidates;saveReview(f.root,a.key,{status:'approved',target:{kind:'item',id:'new_item',usage:'primary'}});
 assert.throws(()=>saveReview(f.root,b.key,{status:'approved',target:{kind:'item',id:'new_item',usage:'primary'}}),/elsődleges/);saveReview(f.root,b.key,{status:'approved',target:{kind:'item',id:'new_item',usage:'gallery'}});assert.equal(report(loadState(f.root)).approved,2);assert.equal(report(loadState(f.root)).publishable,0);
});

test('Képtári jóváhagyás konkrét játékbeli hozzárendelés nélkül menthető és visszaimportálható',async t=>{
 const f=await imageFixture(t,{seed:true});for(const c of loadState(f.root).candidates)saveReview(f.root,c.key,{status:'approved',target:{kind:'collection',id:'reviewed-art',usage:'gallery'}});
 const mapping=mappingExport(loadState(f.root));assert.equal(mapping.entries.length,2);assert(mapping.entries.every(e=>e.target.kind==='collection'&&e.target.usage==='gallery'));importMappings(f.root,mapping);assert.equal(report(loadState(f.root)).approved,2);assert.equal(prepareImport(f.root).eligible,0);
 const c=loadState(f.root).candidates[0];assert.throws(()=>saveReview(f.root,c.key,{status:'approved',target:{kind:'collection',id:'reviewed-art',usage:'primary'}}),/csak galériakép/);
});
