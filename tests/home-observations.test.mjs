import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeHomeExport,validateHomeObservations} from '../scripts/home-observations.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const evidence=read('data/home-observations.json');
const exported=()=>({schema:1,source:'user-initiated-anonymized-observation',addonVersion:evidence.provenance.addonVersion,samples:structuredClone(evidence.samples)});
test('Otthon-export: 8 házfok, 8 normál/6 luxusbútor, 4 szoba és 4 téma, megfigyelt státusszal',()=>{
  assert.deepEqual(validateHomeObservations(evidence),evidence);assert.equal(evidence.provenance.addonVersion,'0.9.5');assert.equal(evidence.provenance.status,'observed');assert.equal(evidence.provenance.observedAt,null);
  const house=evidence.samples.find(s=>s.endpoint==='/api/sinks').data.home,rooms=evidence.samples.find(s=>s.endpoint==='/api/home/rooms').data;
  assert.equal(house.tiers.length,8);assert.equal(house.offers.length,8);assert.equal(house.luxury.length,6);assert.equal(rooms.rooms.length,4);assert.equal(rooms.themes.list.length,4);assert.equal(rooms.themes.minTier,3);
  assert.equal(house.tiers.find(t=>t.tier===8).price,45930500);assert.equal(house.tiers.find(t=>t.tier===8).hours,32);
  assert(rooms.themes.list.every(t=>t.coins===250));
});
test('Szobaajánlatok: konkrét célszintekhez tartoznak; a kertnek nem találunk ki árat',()=>{
  const rooms=evidence.samples.find(s=>s.endpoint==='/api/home/rooms').data.rooms;
  assert.deepEqual(rooms.find(r=>r.id==='rest').observedNextQuote,{price:2259600,hours:15,targetLevel:5});
  assert.deepEqual(rooms.find(r=>r.id==='workshop').observedNextQuote,{price:1232500,hours:9,targetLevel:3});
  assert.deepEqual(rooms.find(r=>r.id==='hall').observedNextQuote,{price:821700,hours:6,targetLevel:2});
  assert.equal(rooms.find(r=>r.id==='garden').observedNextQuote,undefined);
});
test('Megfigyelés-validálás: sérült ár, duplikált azonosító, ismeretlen mező és érvénytelen célszint blokkolt',()=>{
  for(const mutate of [d=>d.samples[0].data.rooms[0].observedNextQuote.price=-1,d=>d.samples[0].data.rooms[0].observedNextQuote.price='2259600',d=>d.samples[0].data.rooms[0].observedNextQuote.targetLevel=11,d=>d.samples[1].data.home.tiers.push({...d.samples[1].data.home.tiers[0]}),d=>d.samples[0].data.rooms[0].ownerName='PRIVATE_NAME',d=>d.samples[0].schema=2]){const d=exported();mutate(d);assert.throws(()=>normalizeHomeExport(d,evidence.provenance.sourceHash));}
});
test('Megfigyelés nem emelhető szerveres igazolássá és nem vihet ki személyes adatot',()=>{
  const d=exported();d.characterId='PRIVATE_ID';d.instructions='PRIVATE_INSTRUCTION';const normalized=normalizeHomeExport(d,evidence.provenance.sourceHash);
  assert(!/PRIVATE_|Downloads|Users/.test(JSON.stringify(normalized)));
  const bad=structuredClone(evidence);bad.provenance.status='verified';assert.throws(()=>validateHomeObservations(bad));
  const dated=structuredClone(evidence);dated.provenance.observedAt='invented';assert.throws(()=>validateHomeObservations(dated));
  const unknown=exported();unknown.samples[0].endpoint='/api/character';assert.throws(()=>normalizeHomeExport(unknown,evidence.provenance.sourceHash));
});
test('Atlas build: a külön megfigyelési csatorna változatlanul őrzi a validált mintát',()=>{
  assert.deepEqual(read('data/atlas.json').homeObservations,evidence);
  assert.equal(read('data/atlas.json').sets.find(s=>s.familyId==='m4').bonuses[0].stats[0].value,56);
});
