import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import os from 'node:os';
import path from 'node:path';
import {collectPublicSystems} from '../scripts/collect-home-arena.mjs';
import {staticModule,clientReferences} from '../scripts/public-client-data.mjs';
import {apiSystemValues,validateHomeArena,compatibleClientData,systemPaths,planHomeArena} from '../scripts/home-arena-model.mjs';
import {planImport,applyOverlay,sha256} from '../scripts/atlas-sync-model.mjs';
import {reconcileReview} from '../scripts/sync-review.mjs';
import '../addons/stonestorm-statcap-overlay/research-sanitizer.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const content=()=>read('snapshots/current/content.json'),db=()=>read('data/atlas.json'),system=()=>read('data/home-arena.json');
test('Otthon/Aréna: valós API-kapuk és hivatalos magyar módnevek, külön játékmódok',()=>{
  const s=validateHomeArena(system()),a=apiSystemValues(content());
  assert.equal(s.locale.arena.pure.title,'Tiszta aréna');assert.equal(s.locale.arena.bandit.title,'Bandita Liga');
  assert.deepEqual(db().homeArena.api,read('data/sync-import.json').homeArena?.values??s.api);
  for(const key of Object.keys(systemPaths))assert(['boolean','number'].includes(typeof a[key]));
  assert.equal(Object.keys(s.locale.home.tiers).length,8);assert.equal(Object.keys(s.locale.rooms.rooms).length,4);
  assert.match(s.locale.rooms.themes.lead,/látvány/);assert.match(s.locale.tea.title,/teaháza/);
});
test('Otthon/Aréna: ismert API-szám frissül, M4/kísérő/kutatás változatlan',()=>{
  const c=content(),d=db(),before=structuredClone(d);c.onboarding.unlocks['arena.pure'].level=19;
  const p=planImport(c,d);assert(p.accepted.some(x=>x.path==='/home-arena/api'));applyOverlay(d,p.overlay);
  assert.equal(d.homeArena.api.pureLevel,19);assert.deepEqual(d.sets,before.sets);assert.deepEqual(d.petSystem,before.petSystem);assert.deepEqual(d.research,before.research);
});
test('Otthon/Aréna: hiányos API nem törli az előző adatokat, új szabályszöveg felülvizsgálatot kap',()=>{
  const c=content(),d=db();delete c.features.homeRooms;
  const p=planImport(c,d);assert(p.review.some(x=>x.path==='/home-arena/api'));assert(!p.overlay.homeArena);
  const s=system(),next=structuredClone(s);next.locale.arena.bandit.info.theft.text='Megváltozott mechanika';assert.equal(compatibleClientData(s,next).safe,false);
  const code=structuredClone(s);code.sources.find(x=>x.role==='home').sha256='a'.repeat(64);assert.equal(compatibleClientData(s,code).safe,false);
});
test('Otthon: biztonságos katalógusnév bővíthető, törlés és ismeretlen szobaséma blokkolt',()=>{
  const s=system(),next=structuredClone(s);next.locale.furniture.names.test_furniture='Tesztbútor';assert.equal(compatibleClientData(s,next).safe,true);
  delete next.locale.furniture.names.furrug;assert.equal(compatibleClientData(s,next).safe,false);
  const bad=structuredClone(s);bad.locale.rooms.rooms.new_room={name:'Új'};assert.throws(()=>validateHomeArena(bad),/szoba/);
});
test('Kliensfeldolgozás: literálok és magyar névterek, kódvégrehajtás nélkül',()=>{
  const result=staticModule('const n=3,x={v:n*2,flag:!0},a=JSON.parse(\'{"title":"Otthon"}\'); const evil=globalThis.exfiltrate(); const all=wrap(Object.assign({"./home2.hu.json":a})); export {x};');
  assert.deepEqual(result.exports.x,{v:6,flag:true});assert.equal(result.values.evil,undefined);assert.equal(result.namespaces.home2.title,'Otthon');
  assert.equal(staticModule('const a=JSON.parse(\'{"__proto__":{"polluted":true}}\');').values.a,undefined);assert.equal({}.polluted,undefined);
});
test('Kliensfelderítés: hash-elt importokból dolgozik, nem fix fájlnevekből vagy kitalált hostokról',()=>{
  const refs=clientReferences('import("./HomeModal-NEW12345.js"); const deps=["assets/ArenaPage-OTHER456.js"];','https://stonestorm.gg/assets/GameApp-ABC12345.js');
  assert.deepEqual(refs,['https://stonestorm.gg/assets/HomeModal-NEW12345.js','https://stonestorm.gg/assets/ArenaPage-OTHER456.js']);
});
test('Régi ellenőrzési tétel: csak a ténylegesen beépített API-mező zárul le, nem a teljes kliensfájl',()=>{
  // Rögzített, egyetlen verziójú adapteradatok; a változó éles snapshot nem tesztfixture.
  const c={version:'review_fixture_v1',features:{homeRooms:true,homeThemes:true,teahouse:true,banditArena:true,banditTrophy:true},onboarding:{unlocks:{'city.home':{level:10},'arena.pure':{level:20},'arena.bandit':{level:21},'nav.arena':{level:21}}},expedition:{refill:{amount:25}}};
  const d={homeArena:{api:apiSystemValues(c)}},plan={resolved:[],validatedDungeons:[],...planHomeArena(c,d,{},()=>{})};
  const previous={review:[{path:'/features/homeRooms',changeKind:'added'},{path:'/onboarding/unlocks/arena.bandit',changeKind:'added'},{path:'https://stonestorm.gg/assets/ArenaPage-old.js'}]};
  const review=(content,db,plan)=>reconcileReview({previous,plan,content,db,sources:[],sourceHash:sha256(JSON.stringify(content)),now:'2026-11-15T12:00:00Z'});
  const r=review(c,d,plan);
  assert.equal(r.closedNow.length,2);assert.equal(r.open.length,1);assert.equal(r.open[0].classification,'observation');
  const pending=structuredClone(d);pending.homeArena.api.banditLevel=20;
  assert.equal(review(c,pending,plan).closedNow.length,1,'A puszta importterv nem bizonyít tényleges beépítést');
  const missing=structuredClone(c);delete missing.features.homeRooms;
  const invalid={resolved:[],validatedDungeons:[],...planHomeArena(missing,d,{},()=>{})};
  assert.equal(review(missing,d,invalid).closedNow.length,0,'Hiányos rendszerkonfigurációból nincs lezárási bizonyíték');
});
test('Anonim export: fiókadat, ellenféllista, egyenleg, név és token soha nem kerül ki',()=>{
  const raw={name:'PRIVATE_NAME',characterId:'PRIVATE_ID',access_token:'PRIVATE_'+'TOKEN',wallet:123456789,opponents:[{name:'PRIVATE_ENEMY',id:'PRIVATE_OTHER'}],home:{owned:['PRIVATE_OWNERSHIP'],tier:5,rules:{maxTier:8,playerName:'PRIVATE_NAME'},tiers:[{tier:1,minLevel:10,price:0,owner:'PRIVATE_ID'}],offers:[{id:'furrug',price:42,name:'PRIVATE_NAME',owned:true},{id:'PRIVATE_ID',price:999}]}};
  const sample=globalThis.StonestormResearch.sanitize('/api/sinks',raw),text=JSON.stringify(sample);
  assert(sample.observedOnly);assert(!/PRIVATE_|123456789|owned|access_token|characterId/.test(text));assert.equal(sample.data.home.offers.length,1);assert.equal(sample.data.home.offers[0].price,42);
  assert.equal(globalThis.StonestormResearch.sanitize('/api/character',raw),null);
});
test('Anonim export: ismeretlen azonosítók kimaradnak, célzott ajánlatok nem globális szabályok',()=>{
  const sample=globalThis.StonestormResearch.sanitize('/api/home/rooms',{rooms:[{id:'rest',level:9,next:{level:10,price:55,hours:2},owner:'private'},{id:'PRIVATE_CHARACTER',next:{level:1,price:99}}]});
  assert.equal(sample.data.rooms.length,1);assert.equal(sample.data.rooms[0].level,undefined);assert.equal(sample.data.rooms[0].observedNextQuote.targetLevel,10);
  assert.deepEqual(globalThis.StonestormResearch.sanitize(sample.endpoint,sample.data),sample);
  assert.throws(()=>validateHomeArena(sample));
});
test('Teaalapár-export: a karakterválaszból kizárólag a megengedett konfiguráció jut át',()=>{
  const raw={state:{name:'PRIVATE_NAME',level:60,coins:987654,vipUntil:'PRIVATE_DATE',patron:{perks:{refillsMax:99},prices:{refill:{baseCoins:[1,2],extraCoins:[3],vipExtra:1,energyCapBase:100,energyCapPerRefill:25,accountId:'PRIVATE_ID',coins:987654}}}}};
  const sample=globalThis.StonestormResearch.sanitize('/api/character',raw);
  assert.deepEqual(Object.keys(sample.data),['refill']);assert.deepEqual(Object.keys(sample.data.refill).sort(),['baseCoins','energyCapBase','energyCapPerRefill','extraCoins','vipExtra'].sort());
  assert(!/PRIVATE|987654|refillsMax|level/.test(JSON.stringify(sample)));
  assert.deepEqual(globalThis.StonestormResearch.sanitize(sample.endpoint,sample.data),sample);
});
test('Kutatási megfigyelő: csak élesítés után figyel, nem indít kérést, nem módosít Promise-t/választ',async()=>{
  const listeners=new Map(),posted=[],body={view:{rules:{minFights:10},name:'PRIVATE'}};
  const response={ok:true,headers:{get:()=>null},clone:()=>({text:async()=>JSON.stringify(body)})};
  let originalPromise,calls=0;
  const window={};window.top=window;window.addEventListener=(name,fn)=>listeners.set(name,fn);window.postMessage=value=>posted.push(value);
  window.fetch=(...args)=>{calls++;originalPromise=Promise.resolve(response);return originalPromise;};
  const context={window,location:{href:'https://stonestorm.gg/',origin:'https://stonestorm.gg'},URL,Date,StonestormResearch:globalThis.StonestormResearch};
  vm.runInNewContext(fs.readFileSync(new URL('../addons/stonestorm-statcap-overlay/research-capture.js',import.meta.url),'utf8'),context);
  const first=window.fetch('/api/arena/pure');assert.equal(first,originalPromise);await first;assert.equal(posted.length,0);
  listeners.get('ss-atlas-research-arm')();const second=window.fetch('/api/arena/pure');assert.equal(second,originalPromise);assert.equal(await second,response);
  await new Promise(resolve=>setTimeout(resolve,0));assert.equal(posted.length,1);assert.equal(calls,2);assert(!JSON.stringify(posted).includes('PRIVATE'));
  await window.fetch('/api/arena/pure',{method:'POST',body:'unchanged'});await new Promise(resolve=>setTimeout(resolve,0));assert.equal(posted.length,1);
});
test('Rendszergyűjtő: friss belépőből fedez fel modulokat; 403-nál jelzi a korlátot és megtartja a cache-t',async t=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-system-test-'));
  t.after(()=>{const resolved=path.resolve(temp);assert(resolved.startsWith(path.resolve(os.tmpdir())+path.sep+'atlas-system-test-'));fs.rmSync(resolved,{recursive:true,force:true});});
  const cache=read('snapshots/current/home-arena-client.json');fs.mkdirSync(path.join(temp,'snapshots/current'),{recursive:true});fs.writeFileSync(path.join(temp,'snapshots/current/home-arena-client.json'),JSON.stringify(cache));
  const urls=Object.values(cache.modules).filter(m=>m.role!=='entry').map(m=>m.url);
  const fetcher=async url=>url==='https://stonestorm.gg/'?new Response('<script type="module" src="/assets/index-CURRENT1.js"></script>'):new Response('const deps='+JSON.stringify(urls.map(url=>url.replace('https://stonestorm.gg/','')))+';');
  const fresh=await collectPublicSystems({root:temp,content:content(),fetcher});assert.equal(fresh.candidate.entrypointConfirmed,true);assert.equal(fresh.candidate.locale.arena.pure.title,'Tiszta aréna');
  const old=fs.readFileSync(path.join(temp,'snapshots/current/home-arena-client.json'));
  const limited=await collectPublicSystems({root:temp,content:content(),fetcher:async()=>new Response('denied',{status:403})});assert.equal(limited.candidate.entrypointConfirmed,false);assert(limited.warnings.some(w=>w.reason.includes('403')));assert(fs.readFileSync(path.join(temp,'snapshots/current/home-arena-client.json')).equals(old));
});
