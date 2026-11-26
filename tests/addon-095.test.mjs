import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import '../js/pet-detail-model.js';
import '../addons/stonestorm-statcap-overlay/research-sanitizer.js';
import {makePetModel} from '../scripts/build-addon-pets.mjs';
const logic=globalThis.StonestormPetDetails,model=JSON.parse(fs.readFileSync(new URL('fixtures/pet-model-v3-reference.json',import.meta.url)));
const pet=(patch={})=>({id:'owned_vulture',petId:'pet_vulture',level:1,form:1,rank:0,active:false,skills:[],...patch});
test('Kísérőmodell: közös verziózott adat, az addon modellje a közös forrással egyezik',()=>{
  assert.equal(model.schema,1);assert.equal(model.config.types.length,22);
  assert(fs.readFileSync(new URL('../js/pet-detail-model.js',import.meta.url)).equals(fs.readFileSync(new URL('../addons/stonestorm-statcap-overlay/pet-model.js',import.meta.url))));
  assert.deepEqual(logic.validateConfig(model.config),model.config);
  assert.throws(()=>makePetModel({},{},'const changed=1;',[]),/Megváltozott kísérőképlet/);
  const manifest=JSON.parse(fs.readFileSync(new URL('../addons/stonestorm-statcap-overlay/manifest.json',import.meta.url)));
  assert.equal(manifest.version,'0.14.0');assert.deepEqual(manifest.permissions,['storage','scripting']);assert.deepEqual(manifest.host_permissions,['https://stonestorm.gg/*']);
});
test('V3 fajbónusz: formaszorzó és rang, nem a régi szintszorzó; XP és zsákmány külön',()=>{
  assert.equal(logic.describe(pet(),model).bonusValue,.04);
  assert.equal(logic.describe(pet({level:50}),model).bonusValue,.04);
  assert.equal(logic.describe(pet({petId:'pet_u_wild'}),model).bonusValue,.06);
  assert(Math.abs(logic.describe(pet({petId:'pet_u_wild',form:2,rank:2}),model).bonusValue-.102)<1e-12);
  const future=logic.describe(pet({rank:2,rankAt:'2030-01-01T00:00:00Z'}),model,model.config,Date.parse('2026-11-16T00:00:00Z'));
  assert.equal(future.bonusValue,.008*5.5);
});
test('Trait, signature és tanult képesség: külön szakasz, nincs másik kísérőtől kölcsönzött skill',()=>{
  const v=logic.describe(pet(),model),wild=logic.describe(pet({petId:'pet_u_wild',form:2,skills:[{skillId:'idle_xp',level:3}]}),model);
  assert.equal(v.sections[1].title,'Faji harci adottság (trait)');assert.match(v.sections[1].items[1],/23,78/);
  assert(!JSON.stringify(v.sections).includes('Előcsapás'));
  assert.match(wild.sections[2].items.join(' '),/Előcsapás.*100%/);
  assert.match(wild.sections[3].items.join(' '),/Tanulékony.*4%/);
  assert.match(v.sections[4].items[0],/Nem fő kísérő/);
  assert.match(logic.describe(pet({active:true}),model).sections[4].items[0],/Fő kísérő/);
});
test('Hiányzó saját rang, forma és tanult képesség ismeretlen marad; üres lista külön állapot',()=>{
  const partial=logic.describe({petId:'pet_vulture',level:1},model);
  assert.equal(partial.bonusValue,null);assert.equal(partial.form,null);assert.match(partial.sections[3].items[0],/Ismeretlen/);
  assert.match(logic.describe(pet(),model).sections[3].items[0],/nincs tanult/);
  const unknown=logic.describe(pet({petId:'pet_unknown',signature:'unknown_skill',skills:[{skillId:'unknown_skill',level:1}]}),model);
  assert.equal(unknown.bonusValue,null);assert.match(unknown.sections[3].items[0],/Ismeretlen/);
});
test('Rossz konfiguráció és határértékek nem válnak hamis százalékokká',()=>{
  const bad=structuredClone(model.config);bad.forms.passive[0]=NaN;assert.equal(logic.validateConfig(bad),null);
  delete bad.traits.strike.mult;assert.equal(logic.validateConfig(bad),null);
  for(const form of [0,6,-1,Infinity])assert.equal(logic.describe(pet({form}),model).bonusValue,null);
});
test('Saját kísérő-felismerés csak szükséges helyi mezőket őriz; az anonim export nem tartalmazza őket',()=>{
  const raw={state:{name:'PRIVATE_HERO',accountId:'PRIVATE_ACCOUNT',pets:[{...pet(),name:'PRIVATE_PET',owner:'PRIVATE_OWNER',wallet:12345678,skills:[{skillId:'regen',level:2,token:'PRIVATE_SECRET'}]}],patron:{prices:{refill:{baseCoins:[1,2]}}}}};
  const roster=logic.roster(raw);assert.equal(roster.pets[0].id,'owned_vulture');assert.equal(roster.pets[0].name,'PRIVATE_PET');assert(!/PRIVATE_HERO|PRIVATE_ACCOUNT|PRIVATE_OWNER|PRIVATE_SECRET|12345678/.test(JSON.stringify(roster)));
  const exported=globalThis.StonestormResearch.sanitize('/api/character',raw);assert(exported);assert(!/pets|PRIVATE_|owned_vulture|regen/.test(JSON.stringify(exported)));
  assert.deepEqual(logic.roster({items:[]}).pets,[]);
});
function controller(clock=Date){
  const listeners={},window={};window.top=window;window.addEventListener=(name,fn)=>listeners[name]=fn;window.dispatchEvent=()=>{};window.postMessage=()=>{};
  let runtime;const context={window,location:{origin:'https://stonestorm.gg'},Event:class{},Date:clock,StonestormResearch:globalThis.StonestormResearch,StonestormCompanionState:{shared:()=>({get:()=>({development:true}),subscribe(){}})},chrome:{runtime:{id:'fixture-extension',onMessage:{addListener(fn){runtime=fn;}}}}};
  vm.runInNewContext(fs.readFileSync(new URL('../addons/stonestorm-statcap-overlay/research-bridge.js',import.meta.url),'utf8'),context);
  return {api:context.StonestormResearchController,runtime,sample(raw){listeners.message({source:window,origin:'https://stonestorm.gg',data:{source:'ss-atlas-research-sample-v1',sample:raw}});}};
}
test('Popup és overlay ugyanaz a gyűjtés: kategóriák, visszaszámlálás, export és törlés',()=>{
  const c=controller();assert.equal(c.api.command('atlas-research-arm').remainingSeconds,60);
  c.sample(globalThis.StonestormResearch.sanitize('/api/home/rooms',{rooms:[{id:'rest',rules:{dailyLimit:3}}],name:'PRIVATE_NAME'}));
  let popup;c.runtime({type:'atlas-research-status'},{id:'fixture-extension'},r=>popup=r);assert.equal(popup.count,1);assert.equal(popup.categories[0].name,'Szobák és témák');assert.equal(c.api.status().count,1);
  let denied=false;c.runtime({type:'atlas-research-export'},{id:'wrong-extension'},()=>denied=true);assert.equal(denied,false);assert.equal(c.api.status().count,1);
  let exported;c.runtime({type:'atlas-research-export'},{id:'fixture-extension'},r=>exported=r);assert.equal(exported.addonVersion,'0.14.0');assert.equal(exported.samples.length,1);assert(!JSON.stringify(exported).includes('PRIVATE_'));assert.equal(c.api.status().count,0);assert.equal(c.api.status().active,false);
  c.api.command('atlas-research-arm');c.sample(globalThis.StonestormResearch.sanitize('/api/arena/pure',{rules:{minFights:10}}));c.api.command('atlas-research-stop');assert.equal(c.api.status().count,0);
});
test('Gyűjtési időkorlát: 60 másodperc után nincs új minta, a korábbi exportálható marad',()=>{
  let time=1000;const c=controller({now:()=>time}),sample=globalThis.StonestormResearch.sanitize('/api/arena/pure',{rules:{minFights:10}});
  c.api.command('atlas-research-arm');c.sample(sample);time+=1500;assert.equal(c.api.status().remainingSeconds,59);
  time=61000;assert.equal(c.api.status().active,false);assert.equal(c.api.status().remainingSeconds,0);
  c.sample(globalThis.StonestormResearch.sanitize('/api/home/rooms',{rooms:[{id:'rest',rules:{dailyLimit:1}}]}));
  assert.equal(c.api.status().count,1);assert.equal(c.api.command('atlas-research-export').samples.length,1);assert.equal(c.api.status().count,0);
});
