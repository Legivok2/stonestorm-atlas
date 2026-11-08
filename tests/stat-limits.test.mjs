import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../js/atlas-math.js';
import '../js/stat-limits.js';
const math=globalThis.StonestormMath,data=globalThis.StonestormStats;
const rules=JSON.parse(fs.readFileSync(new URL('../source-data/05_kasztok_kepessegek_harcertek.json',import.meta.url),'utf8')).harcero.rules;
const hero=JSON.parse(fs.readFileSync(new URL('../source-data/05_kasztok_kepessegek_harcertek.json',import.meta.url),'utf8')).harcero.combat.hero;
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
test('Kritikus alapszorzó és bónuszplafon: a helyi szabályok és a harci adatok is egyeznek',()=>{
  assert.equal(data.critical.baseMultiplier,hero.critMult);
  assert.equal(data.critical.damageBonusCap,rules.supportCaps.critDamage*100);
  assert.equal(data.critical.damageBonusCap,hero.supportCaps.critDamage*100);
  assert.equal(data.critical.chanceCap,rules.critCap*100);
  assert.equal(data.byId.critDamage.cap,data.critical.damageBonusCap);
});
test('A fegyverbónusz alapfokozatai helyi forrással egyeznek; minden 1–60. szintet pontosan egy sáv fed le',()=>{
  const raw=JSON.parse(fs.readFileSync(new URL('../source-data/02_kovacsolas_bonuses_kovek.json',import.meta.url),'utf8')).stones.items.line;
  for(const band of data.critical.weaponBands.slice(0,2))for(const [index,value] of band.bonuses.entries())assert(Math.abs(value/100-raw.tiers.critDamage[index])<1e-12);
  for(let level=1;level<=60;level++)assert.equal(data.critical.weaponBands.filter(band=>level>=band.min&&level<=band.max).length,1,level);
  assert.deepEqual(data.critical.weaponBands.map(band=>band.bonuses),[[6,12,20,28,40],[6,12,20,28,40],[6.2,12.4,20.6,28.8,41.2],[6.4,12.7,21.2,29.7,42.4],[6.5,13.1,21.8,30.5,43.6],[6.7,13.4,22.4,31.4,44.8]]);
});
test('A 10 000 / 50% / +40% kritikus példa 19 000 kritikus és 14 500 átlagsebzést ad',()=>{
  const result=math.criticalDamage(10000,50,40,0,data.critical);
  assert.equal(result.multiplier,1.9);assert.equal(result.criticalHit,19000);assert.equal(result.averageDamage,14500);
});
test('Az 50%-os esély- és 75%-os bónuszkorlát külön érvényesül, a bónusz hozzáadódik az alapszorzóhoz',()=>{
  const result=math.criticalDamage(10000,65,40,60,data.critical);
  assert.equal(result.totalBonus,100);assert.equal(result.chance.effective,50);assert.equal(result.chance.excess,15);
  assert.equal(result.bonus.effective,75);assert.equal(result.bonus.excess,25);assert.equal(result.multiplier,2.25);assert.equal(result.criticalHit,22500);assert.equal(result.averageDamage,16250);
  for(const chance of [0,49.999,50,50.001,100])for(const bonus of [0,74.999,75,75.001,100]){
    const value=math.criticalDamage(10000,chance,bonus,0,data.critical);
    assert.equal(value.chance.effective,Math.min(chance,50));assert.equal(value.bonus.effective,Math.min(bonus,75));assert(value.multiplier<=2.25);
  }
});
test('Nulla sebzés, nulla esély és negatív összesített bónusz nem okoz hibás eredményt',()=>{
  assert.equal(math.criticalDamage(0,50,75,0,data.critical).averageDamage,0);
  assert.equal(math.criticalDamage(10000,0,75,0,data.critical).averageDamage,10000);
  const negative=math.criticalDamage(10000,50,-20,10,data.critical);
  assert.equal(negative.totalBonus,-10);assert.equal(negative.bonus.effective,0);assert.equal(negative.bonus.excess,0);assert.equal(negative.multiplier,1.5);assert.equal(negative.averageDamage,12500);
  assert.equal(math.parseSignedPercent('-6,2'),-6.2);assert.equal(math.parseSignedPercent('+6,2'),6.2);assert.equal(math.parseSignedPercent('--1'),null);assert.equal(math.parseSignedPercent('++1'),null);assert.equal(math.parseSignedPercent('-0'),0);
});
test('A kritikus kalkuláció elutasítja az érvénytelen adatokat és a véges számokat túlcsordító eredményeket',()=>{
  for(const args of [[-1,50,40,0],[10000,-1,40,0],[NaN,50,40,0],[10000,Infinity,40,0],[10000,50,Infinity,0],[10000,50,40,null],[Number.MAX_VALUE,50,75,0],[10000,50,Number.MAX_VALUE,Number.MAX_VALUE]])assert.equal(math.criticalDamage(...args,data.critical),null);
});
