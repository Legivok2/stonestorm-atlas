import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../js/atlas-math.js';
import '../js/bonus-system.js';
const data=globalThis.StonestormBonuses,math=globalThis.StonestormMath;
const evidence=JSON.parse(fs.readFileSync(new URL('../data/bonus-system-evidence.json',import.meta.url),'utf8'));
test('A katalógus pontosan a 20 tárgybónuszt tartalmazza; a zsákmány nem új tárgybónusz',()=>{
  assert.equal(data.entries.length,20);assert.equal(new Set(data.entries.map(entry=>entry.id)).size,20);
  assert.deepEqual(data.entries.map(entry=>entry.id).sort(),[...evidence.itemBonusIds].sort());
  assert.deepEqual(data.entries.filter(entry=>entry.unit==='flat').map(entry=>entry.id).sort(),['attack','defence','maxHp']);
  assert.equal(data.byId.critDamage.name,'Kritikus sebzés');assert.equal(data.byId.damageTaken.name,'Sebzéscsökkentés');assert.equal(data.byId.vsUndead.name,'Élőhalottak ellen');assert.equal(data.byId.drop,undefined);
});
test('A típuspoolok külön adatokból származnak; a nem igazolt altípus nem kap minden bónuszt',()=>{
  for(const id of Object.keys(evidence.pools))assert.deepEqual(data.pools[id],evidence.pools[id].map(entry=>entry[0]));
  assert.equal(data.poolForSlot('weapon').length,5);assert.equal(data.poolForSlot('armor').length,5);
  for(const slot of ['helmet','shield','boots','bracelet','necklace','earrings','unknown'])assert.equal(data.poolForSlot(slot),null);
  for(const pool of Object.values(data.pools))for(const id of pool)assert(data.byId[id],id);
});
test('A normál plafon és a megfigyelt menlevélmennyiségek forráshoz kötöttek',()=>{
  assert.equal(data.reward.baseCap,(evidence.reward.cap-1)*100);
  for(const stat of data.reward.stats){assert.equal(data.reward.imperial[stat.id],evidence.observedImperial[stat.id]);assert.equal(Number(evidence.imperialText[stat.id].match(/\d+/)[0]),data.reward.imperial[stat.id]);}
  assert.equal(data.sources.length,10);assert.equal(data.sources.find(source=>source.id==='imperial').reliability,'observed');
  for(const id of ['potions','research','path','pets','guild','stones','sets','temporary'])assert.equal(data.sources.find(source=>source.id===id).mode,'unknown');
  assert.match(evidence.potionText.normal,/plafonba/);assert.match(evidence.potionText.overflow,/plafon fölött/);
});
test('143% teljes XP = 118% normál + 25 menlevél → 125% érvényes és 18 százalékpont veszteség',()=>{
  const result=math.rewardBonus(118,25,0,100);
  assert.equal(result.total,143);assert.equal(result.baseCap,100);assert.equal(result.special,25);assert.equal(result.effective,125);assert.equal(result.lost,18);
  const nyang=math.rewardBonus(116.4,20,0,100);assert.equal(nyang.effective,120);assert(Math.abs(nyang.lost-16.4)<1e-10);
  const drop=math.rewardBonus(120,10,0,100);assert.equal(drop.total,130);assert.equal(drop.effective,110);assert.equal(drop.lost,20);
});
test('A különleges bónusz nem tölt fel a plafonig, és nem kerül kétszer az összegbe',()=>{
  const below=math.rewardBonus(60,25,0,100);assert.equal(below.total,85);assert.equal(below.effective,85);assert.equal(below.lost,0);
  assert.equal(math.rewardBonus(118,0,0,100).effective,100);assert.equal(math.rewardBonus(118,0,0,100).total,118);
  assert.equal(math.rewardBonus(0,25,0,100).effective,25);assert.equal(math.rewardBonus(100,0,0,100).lost,0);assert.equal(math.rewardBonus(0,0,0,100).total,0);
});
test('Ismeretlen forrásnál a modell nem állít hamis pontos érvényesülést',()=>{
  const result=math.rewardBonus(118,25,10,100);
  assert.equal(result.total,153);assert.equal(result.effective,null);assert.equal(result.lost,null);assert.equal(result.minEffective,125);assert.equal(result.maxEffective,135);assert.equal(result.minLost,18);assert.equal(result.maxLost,28);
  const below=math.rewardBonus(60,25,10,100);assert.equal(below.minEffective,95);assert.equal(below.maxEffective,95);
});
test('A jutalombónusz-modell kezeli a tört értékeket és elutasítja a hibás vagy túlcsorduló számokat',()=>{
  const fraction=math.rewardBonus(99.5,25,0,100);assert.equal(fraction.effective,124.5);assert.equal(fraction.lost,0);
  for(const args of [[-1,25,0,100],[100,-1,0,100],[100,0,-1,100],[NaN,25,0,100],[100,Infinity,0,100],[100,0,0,0],[Number.MAX_VALUE,Number.MAX_VALUE,0,100]])assert.equal(math.rewardBonus(...args),null);
});
