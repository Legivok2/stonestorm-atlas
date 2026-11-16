import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {planEngine,applyEngine,validateContract,validateRelations,engineBranches} from '../scripts/data-engine.mjs';
import {classifyReview,reconcileReview} from '../scripts/sync-review.mjs';
import {sha256} from '../scripts/atlas-sync-model.mjs';
import '../js/pet-system.js';
import '../js/planner-model.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const content=read('snapshots/current/content.json'),state=read('data/data-engine.json'),contracts=read('data/data-engine-contract.json'),db=read('data/atlas.json'),model=read('data/addon-pet-model.json');
// A quarantined current API branch may intentionally differ from the imported
// state. Unit candidates start from the exact approved state, not that snapshot.
for(const [key,source] of Object.entries(engineBranches)){const parts=source.split('.'),last=parts.pop();let target=content;for(const part of parts)target=target[part]??={};target[last]=structuredClone(state.branches[key].data);}
test('Data Engine V2: every approved branch has a valid contract and matching hash',()=>{
  for(const [k,b] of Object.entries(state.branches)){validateContract(b.data,contracts.branches[k]);assert.equal(sha256(JSON.stringify(b.data)),b.sha256);}
  validateRelations(Object.fromEntries(Object.entries(state.branches).map(([k,b])=>[k,b.data])),content);
  assert.equal(planEngine(content,state,contracts).accepted.length,0);
});
test('Data Engine V2: known numeric updates preserve all unrelated values',()=>{
  const c=structuredClone(content);c.mounts[0].price++;c.forge.plusMult[1]+=.001;
  const p=planEngine(c,state,contracts);assert.equal(p.accepted.length,2);assert.equal(p.review.length,0);
  assert.equal(p.state.branches.mounts.data[0].price,c.mounts[0].price);
  assert.deepEqual(p.state.branches.pets,state.branches.pets);
  assert.equal(state.branches.mounts.data[0].price,content.mounts[0].price);
});
test('Data Engine V2: unknown mechanics, missing records, duplicate IDs, NaN and changed enums are quarantined',()=>{
  for(const mutate of [c=>c.pets.v3.unknownMechanic={amount:1},c=>c.pets.types.pop(),c=>c.pets.types[1].id=c.pets.types[0].id,c=>c.pets.types[0].perLevel.xpMult=NaN,c=>c.pets.v3.forms.slots[4]=5]){
    const c=structuredClone(content);mutate(c);const p=planEngine(c,state,contracts,{petProof:true});assert(p.review.some(x=>x.path==='/pets'));assert.deepEqual(p.state.branches.pets,state.branches.pets);
  }
  const c=structuredClone(content);delete c.forge;assert(planEngine(c,state,contracts).review.some(x=>x.path==='/forge'));
});
test('Data Engine V2: pet coefficients require a fresh verified client witness',()=>{
  const c=structuredClone(content);c.pets.types[0].perLevel[Object.keys(c.pets.types[0].perLevel)[0]]+=.001;
  assert(planEngine(c,state,contracts).review.some(x=>x.path==='/pets'));
  assert(planEngine(c,state,contracts,{petProof:true}).accepted.some(x=>x.path==='/pets'));
  const invalid=structuredClone(content);invalid.pets.v3.unknownFormula=1;
  assert.equal(globalThis.StonestormPetDetails.publicConfig(invalid,model.publicContract),null);
});
test('Data Engine V2: cards, detail, Planner and addon share the same public species model',()=>{
  assert.deepEqual(db.petModel.config,model.config);
  assert(fs.readFileSync(new URL('../js/pet-detail-model.js',import.meta.url)).equals(fs.readFileSync(new URL('../addons/stonestorm-statcap-overlay/pet-model.js',import.meta.url))));
  for(const pet of db.pets)for(const form of [1,2,3,4,5]){
    const build={...globalThis.StonestormPlanner.empty(db),level:60,petId:pet.id,petLevel:db.petSystem.stages[form-1].minLevel,petForm:form,petRank:0};
    const p=globalThis.StonestormPlanner.calculate(build,db).pet;
    assert.equal(p.details.bonusValue,pet.bonusByForm[form-1].value);
    assert.equal(p.details.bonusValue,globalThis.StonestormPetDetails.describe({petId:pet.id,form,rank:0,level:p.level},model).bonusValue);
  }
});
test('Data Engine V2: real observed vulture reference remains separate from computed tests',()=>{
  const reference=read('tests/fixtures/pet-model-v3-reference.json');
  const pet=reference.config.types.find(x=>x.id==='pet_vulture');assert.equal(pet.perLevel.dropMult,.008);
  assert.equal(globalThis.StonestormPetDetails.describe({petId:pet.id,form:1,level:1,rank:0,active:false},reference).bonusValue,.04);
  const wild=globalThis.StonestormPetDetails.describe({petId:'pet_u_wild',form:2,level:10,rank:0},reference);assert.equal(wild.bonusValue,.09);
  assert.equal(read('data/pet-observations.json').observations.length,1);
});
test('Data Engine V2: logical portrait bindings stay partial until current petArt file registry is available',()=>{
  const art=read('data/pet-art-evidence.json'),catalog=read('data/image-catalog.json');
  assert(art.source.url.includes('/GameApp-'));for(const f of Object.values(art.functions))assert.equal(sha256(f.source),f.sha256);
  const unique=new Set();for(const p of db.pets)for(const binding of p.art.forms){const im=catalog.entries.find(x=>x.id===binding.imageId);assert(im);assert.equal(im.sha256,binding.sha256);assert(im.relations.some(r=>r.kind==='pet'&&r.id===p.id&&r.status==='partial'));assert(!im.relations.some(r=>r.kind==='pet'&&r.status==='identified'));unique.add(im.id);}
  assert.equal(unique.size,110);
});
test('Data Engine V2: public pet research export rejects private state and remains idempotent',()=>{
  const context=vm.createContext({STONESTORM_PET_MODEL:model});
  for(const file of ['js/pet-detail-model.js','addons/stonestorm-statcap-overlay/research-sanitizer.js'])vm.runInContext(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),context);
  const raw=structuredClone(content);raw.state={pets:[{id:'PRIVATE_OWNED_ID',skills:[{skillId:'PRIVATE_SKILL'}]}]};raw.pets.types[0].ownerName='PRIVATE_NAME';
  const sample=context.StonestormResearch.sanitize('/api/content',raw);assert(sample);assert(!/PRIVATE_|privateNumeric|ownerName/.test(JSON.stringify(sample)));
  assert.deepEqual(JSON.parse(JSON.stringify(context.StonestormResearch.sanitize('/api/content',sample.data))),JSON.parse(JSON.stringify(sample)));
  raw.pets.types[0].perLevel.privateNumeric=123;assert.equal(context.StonestormResearch.sanitize('/api/content',raw),null);
  const complete=Object.fromEntries(model.config.types.flatMap(t=>[1,2,3,4,5].map(f=>[t.id+'_'+f,'a'.repeat(64)])));
  complete.PRIVATE_OWNED_ID='PRIVATE_SECRET';
  const registry=context.StonestormResearch.sanitize('/api/character',{state:{id:'PRIVATE_OWNER',petArt:complete}});
  assert(registry);assert(!/PRIVATE_/.test(JSON.stringify(registry)));assert.equal(registry.data.publicPetArt.pet_vulture_1,'a'.repeat(64));assert.equal(Object.keys(registry.data.publicPetArt).length,110);
  assert.equal(context.StonestormResearch.sanitize('/api/character',{state:{petArt:{pet_vulture_1:'a'.repeat(64)}}}),null);
  assert.deepEqual(JSON.parse(JSON.stringify(context.StonestormResearch.sanitize('/api/character',registry.data))),JSON.parse(JSON.stringify(registry)));
});
test('Data Engine V2: only matching imported fields close review; raw client inventory stays open',()=>{
  const path='/pets/types/pet_vulture/perLevel/dropMult',plan={resolved:[],accepted:[],review:[],validatedDungeons:[]};
  assert.equal(classifyReview({path},{plan,content,db}),'automatic');
  const x=reconcileReview({previous:{review:[{path},{path:'https://stonestorm.gg/assets/UnknownClient.js'}]},plan,content,db,now:'2026-11-16T00:00:00Z',sourceHash:sha256(JSON.stringify(content))});
  assert(x.ledger.some(e=>e.path===path&&e.status==='resolved'));assert(x.open.some(e=>e.path.startsWith('https:')));
  const changed=structuredClone(db);changed.pets.find(p=>p.id==='pet_vulture').perLevel.dropMult+=.001;
  assert.notEqual(classifyReview({path},{plan,content,db:changed}),'automatic');
  assert.equal(classifyReview({path:'/mounts'},{plan,content,db}),'automatic');
  const badMounts=structuredClone(db);badMounts.mounts[0].price++;
  assert.notEqual(classifyReview({path:'/mounts'},{plan,content,db:badMounts}),'automatic');
  const missingPetRule=structuredClone(db);delete missingPetRule.petSystem.v3.reference;
  assert.notEqual(classifyReview({path:'/pets/v3'},{plan,content,db:missingPetRule}),'automatic');
});
