import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import '../js/bonus-system.js';

const source=fs.readFileSync(new URL('../js/atlas-i18n.js',import.meta.url),'utf8');
const db=JSON.parse(fs.readFileSync(new URL('../data/atlas.json',import.meta.url),'utf8'));
const context={localStorage:{getItem:()=>null,setItem(){}},console:{warn(){}},Intl};
vm.runInNewContext(source,context);
const i18n=context.AtlasI18n;

test('equipment and set labels cover every saved slot, class and visible stat in both locales',()=>{
  const {hu,en}=i18n.dictionaries;
  for(const slot of Object.keys(db.labels.slots)){
    assert(hu['equipment.slot.'+slot],slot+' HU slot');
    assert(en['equipment.slot.'+slot],slot+' EN slot');
  }
  for(const character of db.classes){
    assert(hu['equipment.class.'+character.id],character.id+' HU class');
    assert(en['equipment.class.'+character.id],character.id+' EN class');
  }
  const stats=new Set([
    ...db.items.flatMap(item=>Object.keys(item.values??{})),
    ...db.sets.flatMap(set=>set.bonuses.flatMap(bonus=>bonus.stats.map(stat=>stat.stat))),
    ...globalThis.StonestormBonuses.entries.map(entry=>entry.id)
  ]);
  for(const stat of stats){
    assert(hu['stat.'+stat],stat+' HU stat');
    assert(en['stat.'+stat],stat+' EN stat');
  }
});

test('saved item and set names are not replaced with unverified English game names',()=>{
  const item=db.items[0],set=db.sets[0];
  assert.equal(i18n.gameNameKey('item',item),null);
  assert.equal(i18n.gameNameKey('set',set),null);
  assert.equal(item.nameEn,null);
  assert.equal(item.name,item.nameHu);
  assert.equal(set.nameIsEditorial,true);
  assert.equal(set.id,'set_m1');
});
