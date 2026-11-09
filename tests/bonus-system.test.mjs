import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../js/atlas-math.js';
import '../js/bonus-system.js';
const data=globalThis.StonestormBonuses,math=globalThis.StonestormMath;
const evidence=JSON.parse(fs.readFileSync(new URL('../data/bonus-system-evidence.json',import.meta.url),'utf8'));
const reward=(normal,paid,unknown=0)=>math.rewardBonus(normal,paid,unknown,data.reward.baseCap,data.reward.paidCap);
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
  assert.equal(data.reward.paidCap,evidence.paidRewardRule.paidCap);
  assert.equal(data.sources.length,11);assert.equal(data.sources.find(source=>source.id==='imperial').reliability,'observed');
  for(const id of ['equipment','potionsNyang','research','path','pets','guild','stones','sets','temporary'])assert.equal(data.sources.find(source=>source.id===id).mode,'normal');
  for(const id of ['imperial','potionsCoins'])assert.equal(data.sources.find(source=>source.id===id).mode,'paid');
  assert.match(evidence.potionText.normal,/plafonba/);assert.match(evidence.potionText.overflow,/plafon fölött/);
});
test('143% teljes XP = 118% normál + 25 menlevél → 125% érvényes és 18 százalékpont veszteség',()=>{
  const result=reward(118,25);
  assert.equal(result.total,143);assert.equal(result.baseCap,100);assert.equal(result.paidEffective,25);assert.equal(result.effective,125);assert.equal(result.lost,18);
  const nyang=reward(116.4,20);assert.equal(nyang.effective,120);assert.equal(nyang.lost,16.4);
  const drop=reward(120,10);assert.equal(drop.total,130);assert.equal(drop.effective,110);assert.equal(drop.lost,20);
});
test('A különleges bónusz nem tölt fel a plafonig, és nem kerül kétszer az összegbe',()=>{
  const below=reward(60,25);assert.equal(below.total,85);assert.equal(below.effective,85);assert.equal(below.lost,0);
  assert.equal(reward(118,0).effective,100);assert.equal(reward(118,0).total,118);
  assert.equal(reward(0,25).effective,25);assert.equal(reward(100,0).lost,0);assert.equal(reward(0,0).total,0);
});
test('XP ellenőrző példa: 48,5 felszerelés + 9,9 kísérő + 13 céh + 25 menlevél = 96,4, veszteség nélkül',()=>{
  const result=reward(48.5+9.9+13,25);
  assert.equal(result.normal,71.4);assert.equal(result.paid,25);assert.equal(result.total,96.4);assert.equal(result.effective,96.4);assert.equal(result.lost,0);
  assert.equal(Number((result.total-48.5).toFixed(10)),47.9);
});
test('Nyang ellenőrző példa: 106,3 felszerelés + 0,3 kísérő + 13 céh + 20 menlevél → 120%, 19,6 százalékpont veszteség',()=>{
  const result=reward(106.3+0.3+13,20);
  assert.equal(result.normal,119.6);assert.equal(result.total,139.6);assert.equal(result.baseEffective,100);assert.equal(result.paidEffective,20);assert.equal(result.effective,120);assert.equal(result.lost,19.6);
});
test('A fizetős +50 külön plafon: a menlevél és a VÉ-főzet közös keretet használ, nincs átcsoportosítás',()=>{
  const saturated=reward(140,90);assert.equal(saturated.effective,150);assert.equal(saturated.lost,80);assert.equal(saturated.normalLost,40);assert.equal(saturated.paidLost,40);
  const notFull=reward(60,80);assert.equal(notFull.effective,110);assert.equal(notFull.paidEffective,50);assert.equal(notFull.lost,30);
  assert.equal(reward(100,25+30).effective,150);assert.equal(reward(100,25+30).paidLost,5);
  assert.equal(reward(95+20,20).effective,120);assert.equal(reward(95,20+35).effective,145);
  assert.equal(reward(100,50).lost,0);assert.equal(reward(0,80).effective,50);
});
test('Ismeretlen forrásnál a modell nem állít hamis pontos érvényesülést',()=>{
  const result=reward(118,25,10);
  assert.equal(result.total,153);assert.equal(result.effective,null);assert.equal(result.lost,null);assert.equal(result.minEffective,125);assert.equal(result.maxEffective,135);assert.equal(result.minLost,18);assert.equal(result.maxLost,28);
  const below=reward(60,25,10);assert.equal(below.minEffective,95);assert.equal(below.maxEffective,95);
  const split=reward(90,40,20);assert.equal(split.minEffective,140);assert.equal(split.maxEffective,150);
  assert.equal(reward(100,50,100).maxEffective,150);
});
test('A jutalombónusz-modell kezeli a tört értékeket és elutasítja a hibás vagy túlcsorduló számokat',()=>{
  const fraction=reward(99.5,25);assert.equal(fraction.effective,124.5);assert.equal(fraction.lost,0);
  assert.equal(reward(0.1+0.2,0).total,0.3);
  for(const args of [[-1,25,0,100,50],[100,-1,0,100,50],[100,0,-1,100,50],[NaN,25,0,100,50],[100,Infinity,0,100,50],[100,0,0,0,50],[100,0,0,100,0],[Number.MAX_VALUE,Number.MAX_VALUE,0,100,50]])assert.equal(math.rewardBonus(...args),null);
});
