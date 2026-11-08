import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../js/atlas-math.js';
import '../js/stat-limits.js';
const math=globalThis.StonestormMath,data=globalThis.StonestormStats;
const rules=JSON.parse(fs.readFileSync(new URL('../source-data/05_kasztok_kepessegek_harcertek.json',import.meta.url),'utf8')).harcero.rules;
test('A központi harci limitek egyeznek a mentett forrással; a normál kitérés külön súgóadat',()=>{
  for(const [id,key] of [['reduction','reductionCap'],['crit','critCap'],['evadeBoss','evadeCap']])assert.equal(data.byId[id].cap,rules[key]*100);
  assert.equal(data.byId.evadeNormal.cap,35);
  assert.match(data.byId.evadeNormal.source,/súgó/);
});
test('18,2% kitérés: normál 18,2%, boss 12%, veszteség 6,2 százalékpont',()=>{
  const amount=math.parsePercent('18,2');
  assert.equal(math.cappedPercent(amount,data.byId.evadeNormal.cap).effective,18.2);
  const boss=math.cappedPercent(amount,data.byId.evadeBoss.cap);
  assert.equal(boss.effective,12);assert(Math.abs(boss.excess-6.2)<1e-10);
});
test('65% kritikus és 80% csökkentés: helyes plafon és a plafon feletti rész',()=>{
  assert.deepEqual(math.cappedPercent(65,50),{amount:65,cap:50,effective:50,excess:15,fill:1});
  assert.equal(math.cappedPercent(80,75).excess,5);
  assert.equal(math.cappedPercent(0,35).fill,0);
  assert.equal(math.cappedPercent(35,35).excess,0);
  assert.equal(math.cappedPercent(10,50).fill,0.2);
});
test('A százalékbevitel vesszőt és pontot fogad, de üreset, negatívat és nem véges értéket nem',()=>{
  for(const value of ['18,2',' 18.2 ',18.2])assert.equal(math.parsePercent(value),18.2);
  assert.equal(math.parsePercent('0'),0);
  for(const value of ['', ' ', '-1', 'Infinity','NaN','1e999','18,2.3','1 000',Infinity,NaN,-1,null,undefined])assert.equal(math.parsePercent(value),null,String(value));
  for(const value of [null,NaN,Infinity,-1]){assert.equal(math.cappedPercent(value,50),null);assert.equal(math.sumBonuses(value,10),null);}
});
test('A megfigyelt XP-/nyangértékek nem limitek, az összegző nem feltételez tényleges érvényesülést',()=>{
  assert.deepEqual(data.observations.map(x=>[x.id,x.gear,x.total]),[['xp',31.1,84.7],['nyang',116.4,130]]);
  const sum=math.sumBonuses(31.1,53.6);assert.equal(sum.total,84.7);assert.equal(sum.effective,null);assert.equal(sum.cap,null);
  assert.equal(math.sumBonuses(116.4,13.6).total,130);
  assert.equal(math.sumBonuses(1000,2000).total,3000);
  for(const id of ['attack','hp','xp','nyang'])assert.equal(data.byId[id].cap,null);
});
