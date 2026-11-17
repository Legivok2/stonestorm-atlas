import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
import {imageFixture} from './image-fixture.mjs';import {createImageManager} from '../scripts/image-manager.mjs';
async function manager(t){const f=await imageFixture(null,{seed:true}),server=createImageManager({root:f.root,fetcher:f.fetcher,sleep:f.noSleep});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));f.dispose();});const base='http://127.0.0.1:'+server.address().port;return {...f,base,server};}
test('Helyi felület: szigorú CSP, nincs CORS, külső Origin és token nélküli írás tiltott',async t=>{
 const f=await manager(t),index=await fetch(f.base+'/');assert.equal(index.status,200);assert(index.headers.get('content-security-policy').includes("frame-ancestors 'none'"));assert.equal(index.headers.get('access-control-allow-origin'),null);assert.match(await index.text(),/Atlas Image Manager/);
 assert.equal((await fetch(f.base+'/api/bootstrap',{headers:{Origin:'https://evil.invalid'}})).status,403);
 assert.equal((await fetch(f.base+'/api/review',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,403);
 assert.equal((await fetch(f.base+'/package.json')).status,404);assert.equal((await fetch(f.base+'/api/image/not-a-key')).status,404);
});
test('API: jóváhagyás mentése, export és visszatöltés; az Atlas nem módosul',async t=>{
 const f=await manager(t),bootstrap=await(await fetch(f.base+'/api/bootstrap')).json(),state=await(await fetch(f.base+'/api/state')).json(),c=state.candidates[0],headers={'Content-Type':'application/json','X-Atlas-Manager-Token':bootstrap.token};
 const bytes=Buffer.from(await(await fetch(f.base+c.preview+'?original=1')).arrayBuffer());assert(bytes.equals(f.fresh));
 const decision={key:c.key,expectedRevision:c.review.revision,status:'approved',target:{kind:'item',id:'new_item'},rights:{status:'unverified'}};
 const saved=await fetch(f.base+'/api/review',{method:'POST',headers,body:JSON.stringify(decision)});assert.equal(saved.status,200);assert.equal((await saved.json()).report.approved,1);
 assert.equal((await fetch(f.base+'/api/review',{method:'POST',headers,body:JSON.stringify(decision)})).status,400,'Elavult párhuzamos döntés nem írhatja felül a másikat');
 const exportResponse=await fetch(f.base+'/api/mappings');assert(exportResponse.headers.get('content-disposition').includes('.json'));const mapping=await exportResponse.json();assert.equal(mapping.entries[0].status,'approved');
 assert.equal((await fetch(f.base+'/api/import-mappings',{method:'POST',headers,body:JSON.stringify(mapping)})).status,200);
 const prepared=await(await fetch(f.base+'/api/prepare-import',{method:'POST',headers,body:'{}'})).json();assert.equal(prepared.eligible,0);assert.equal(prepared.activeAtlasModified,false);assert.equal(JSON.parse(fs.readFileSync(path.join(f.root,'data/image-catalog.json'))).entries.length,1);
});
test('API-import: a credentiales képcím nem kerül fájlba; az engedélyezett lista helyben feldolgozható',async t=>{
 const f=await manager(t),bootstrap=await(await fetch(f.base+'/api/bootstrap')).json(),headers={'Content-Type':'application/json','X-Atlas-Manager-Token':bootstrap.token};
 const r=await fetch(f.base+'/api/import-references',{method:'POST',headers,body:JSON.stringify({images:['https://stonestorm.gg/art/icons/extra.png','https://stonestorm.gg/art/icons/secret.png?token=PRIVATE_TOKEN']})});assert.equal(r.status,202);assert.equal((await r.json()).ignored,1);
 for(let n=0;n<40;n++){const state=await(await fetch(f.base+'/api/state')).json();if(!state.job.busy)break;await new Promise(r=>setTimeout(r,20));}
 const files=fs.readdirSync(path.join(f.root,'stonestorm_image_tools/staging/imports'));assert.equal(files.length,1);assert(!fs.readFileSync(path.join(f.root,'stonestorm_image_tools/staging/imports',files[0]),'utf8').includes('PRIVATE_TOKEN'));
});
