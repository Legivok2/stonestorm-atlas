import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../addons/stonestorm-statcap-overlay/companion-state.js';
import '../addons/stonestorm-statcap-overlay/companion-stats.js';
import '../addons/stonestorm-statcap-overlay/companion-components.js';
import '../addons/stonestorm-statcap-overlay/raid-model.js';
const S=globalThis.StonestormCompanionState,M=globalThis.StonestormCompanionStats,C=globalThis.StonestormCompanionComponents;
const publicData=JSON.parse(fs.readFileSync(new URL('../snapshots/current/content.json',import.meta.url)));
const rules=publicData.harcero.rules;
const content={version:M.version,clientVerified:true,critCap:rules.critCap,supportCaps:rules.supportCaps,supportSoft:rules.supportSoft,monsterEvadeCap:rules.monsterEvadeCap,bossEvadeCaps:publicData.harcero.bossEvadeCaps,
  evadeRules:{monsterEvadeCap:rules.monsterEvadeCap,dodge:rules.dodge,ref:rules.ref}};
const character=()=>({name:'Karakter',level:40,stats:{str:20,dex:90,vit:50,int:30},harcero:{full:42000},mods:{xpMult:1.6,xpPaid:.25,nyangMult:1.2,nyangPaid:0,dropMult:1.1,dropPaid:0},
  derived:{maxHp:18000,maxSp:300,atkMin:450,atkMax:600,def:900,critChance:.463,evadeBonus:.03,xpBonus:.35,nyangBonus:.2,
    harceroStats:{critDamage:.42,skillDamage:.26,supportRaw:{critDamage:.6,skillDamage:.3}}}});
test('Default developer visibility is off; old research route migrates safely and hidden quick preferences survive',()=>{
  const p=S.clean({tab:'research',density:'compact',quick:['research','equipment'],width:920});
  assert.equal(p.development,false);assert.equal(p.tab,'overview');assert.equal(p.theme,'emerald');assert.equal(p.width,920);assert.equal(p.density,undefined);
  assert.deepEqual(p.quick,['research','equipment']);assert(!S.visibleTabs(p).includes('research'));assert(S.visibleTabs({...p,development:true}).includes('research'));
});
test('Three themes are an allowlist and the single central developer flag cannot be enabled by truthy strings',()=>{
  for(const theme of ['emerald','obsidian','ember'])assert.equal(S.clean({theme}).theme,theme);
  assert.equal(S.clean({theme:'hacked',development:'true'}).development,false);assert.equal(S.clean({theme:'hacked'}).theme,'emerald');
});
test('UI reset removes only its own key and never accesses preset storage',()=>{
  const removed=[],store=S.create({local:{get(_k,callback){callback({});},set(){},remove(key){removed.push(key);}}});
  store.set({theme:'ember',development:true});store.reset();assert.deepEqual(removed,[S.key]);assert.equal(store.get().theme,'emerald');assert.equal(store.get().development,false);
});
test('Current final crit is preserved exactly; its unknown raw value cannot produce fabricated overflow',()=>{
  const c=M.model(character(),content),crit=c.caps.find(c=>c.key==='crit');
  assert.equal(crit.value,46.300000000000004);assert.equal(crit.cap,50);assert.equal(crit.raw,null);assert.equal(crit.excess,0);assert(Math.abs(crit.remaining-3.7)<1e-8);
});
test('Final combat support values are separate from raw equipment and soft-cap loss is never hard overflow',()=>{
  const m=M.model(character(),content,{}, {critDamage:95}),c=m.caps.find(c=>c.key==='critDamage');
  assert.equal(c.value,42);assert.equal(c.raw,60);assert.equal(c.gear,95);assert.equal(c.kind,'soft');assert.equal(c.excess,0);
  assert.equal(m.caps.find(c=>c.key==='skillDamage').value,26);
});
test('Equipment sums alone cannot become full character damage/skill values',()=>{
  const c=character();delete c.derived.harceroStats;
  const m=M.model(c,content,{}, {critDamage:95,skillDamage:80});
  assert(!m.caps.some(c=>['critDamage','skillDamage'].includes(c.key)));
  assert.equal(m.allCaps.find(c=>c.key==='critDamage').value,null);
  assert(!C.stats(m).includes('Kritikus sebzésbónusz'));
  assert(C.stats(m,{development:true}).includes('Nem igazolt'));
});
test('Panel text alone cannot establish whether a soft-cap number is raw or effective',()=>{
  const c=character();delete c.derived.harceroStats;
  const m=M.model(c,content,{critDamage:43.275,skillDamage:0});
  assert(!m.caps.some(c=>['critDamage','skillDamage'].includes(c.key)));
});
test('Evasion uses DEX share plus level reference and preserves the independent boss caps',()=>{
  const c=character(),e=M.evade(c,content.evadeRules),m=M.model(c,content);
  const i=c.level,ref=rules.ref.dexShare[i]*rules.ref.dex[i]/rules.ref.heroDex[i],own=90/(20+90+50+30);
  const raw=Math.min(.3,Math.max(rules.dodge.floor,rules.dodge.base+rules.dodge.weight*(own-ref)))+.03;
  assert(Math.abs(e.value-Math.min(.3,raw)*100)<1e-9);assert.equal(m.caps.find(c=>c.key==='evadeNormal').cap,30);
  assert.deepEqual(m.bossCaps,{mapBoss:.12,guardian:.14,towerBoss:.16});assert(!m.caps.some(c=>c.key==='evadeBoss'));
});
test('Missing evasion inputs or a changed rules version never receive a guessed final stat',()=>{
  const c=character();delete c.derived.evadeBonus;assert.equal(M.evade(c,content.evadeRules),null);
  assert.equal(M.model(c,{...content,version:'changed'}).caps.length,0);
});
test('Rewards use current gear, multiplier and explicit paid values, without inferring a potion payment',()=>{
  const r=M.model(character(),content).rewards;assert(Math.abs(r.xp.effective-95)<1e-8);assert(Math.abs(r.nyang.effective-40)<1e-8);assert(Math.abs(r.drop.effective-10)<1e-8);
  const c=character();delete c.mods.xpPaid;assert.equal(M.model(c,content).rewards.xp,null);
});
test('No global HP, attack or raw-defence cap is invented; empty groups and cards are absent',()=>{
  const m=M.model(null,null);assert.equal(m.groups.length,0);assert.equal(m.caps.length,0);
  assert(!C.overview(m).includes('data-sc-cap='));assert(!C.stats(m).includes('data-sc-stat-group='));
  const h=C.stats(M.model(character(),content));assert(!h.includes('max. 900'));assert(!h.includes('NaN'));
});
test('HU raid parsing retains k, decimal comma and kk precision',()=>{
  for(const [s,v] of [['448k',448000],['746,8k',746800],['1,9kk',1900000],['2,7kk',2700000]])assert.equal(globalThis.StonestormRaids.parseGameNumber(s),v);
});
test('Release excludes obsolete iframe factories, retains pet runtime and private equip safety',()=>{
  const m=JSON.parse(fs.readFileSync(new URL('../addons/stonestorm-statcap-overlay/manifest.json',import.meta.url)));
  const scripts=m.content_scripts.flatMap(s=>s.js);
  for(const file of ['pet-tooltip.js','pet-source.js','pet-model.js','pet-data.js','equipment-live-model.js','equipment-live-client.js'])assert(scripts.includes(file));
  assert(!scripts.some(f=>f.startsWith('multi-instance')));assert.equal(m.version,'0.14.0');assert.deepEqual(m.permissions,['storage','scripting']);
});
