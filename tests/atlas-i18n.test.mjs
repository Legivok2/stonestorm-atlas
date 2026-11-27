import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const source=fs.readFileSync(path.resolve(import.meta.dirname,'../js/atlas-i18n.js'),'utf8');

function load(saved,code=source){
  const values=new Map(saved===undefined?[]:[['stonestorm.atlas.locale.v1',saved]]);
  const warnings=[];
  const context={
    localStorage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)},
    console:{warn:(...args)=>warnings.push(args)},
    Intl
  };
  vm.runInNewContext(code,context);
  return {i18n:context.AtlasI18n,values,warnings};
}

test('Atlas dictionaries contain matching translations and parameters',()=>{
  const {i18n}=load(),{hu,en}=i18n.dictionaries;
  assert.deepEqual(Object.keys(hu).sort(),Object.keys(en).sort());
  for(const key of Object.keys(hu)){
    assert(hu[key].trim(),key);
    assert(en[key].trim(),key);
    const params=value=>[...value.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map(match=>match[1]).sort();
    assert.deepEqual(params(hu[key]),params(en[key]),key);
  }
});

test('calculator source labels and explanations match the current bonus data',async()=>{
  await import('../js/bonus-system.js');
  const {i18n}=load('en'),{sources,reward,entries}=globalThis.StonestormBonuses;
  for(const entry of entries)assert(i18n.dictionaries.en['stat.'+entry.id],entry.id);
  for(const source of sources){
    for(const field of ['name','explanation']){
      const key=`bonus.source.${source.id}.${field}`;
      assert.equal(i18n.dictionaries.hu[key],source[field],key);
      assert(i18n.dictionaries.en[key],key);
    }
    const key=['equipment','imperial','potionsNyang','potionsCoins'].includes(source.id)?`bonus.source.${source.id}.source`:'bonus.source.normalSource';
    assert.equal(i18n.dictionaries.hu[key],source.source,key);
  }
  assert.equal(i18n.dictionaries.hu['bonus.formula'],reward.formula);
  assert.equal(i18n.dictionaries.hu['limits.source.reward'],reward.source);
});

test('bundled Sync and Watcher evidence descriptions have English translations',()=>{
  const {i18n}=load('en'),{hu,en}=i18n.dictionaries;
  const sync=JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname,'../data/sync-status.json'),'utf8'));
  const watcher=JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname,'../data/future-content.json'),'utf8'));
  const has=(prefix,text)=>Object.keys(hu).some(key=>key.startsWith(prefix)&&hu[key]===text&&en[key]);
  for(const [id,name] of Object.entries(watcher.categoryNames))assert.equal(hu['future.category.'+id],name,id);
  for(const row of watcher.observations.filter(item=>!item.legacy))assert(has('future.reason.',row.statusReason),row.statusReason);
  for(const group of ['currentGroups','processedGroups','resolvedGroups','manualGroups','historicalGroups','groups'].flatMap(key=>sync[key]??[])){
    assert(has('sync.text.',group.name),group.name);
    for(const item of group.topics.flatMap(topic=>topic.paths))assert(has('sync.reason.',item.reason),item.reason);
  }
});

test('source-defined Sync and Watcher message types have translations',async()=>{
  const {i18n}=load('en'),{hu,en}=i18n.dictionaries;
  const has=(prefix,text)=>Object.keys(hu).some(key=>key.startsWith(prefix)&&hu[key]===text&&en[key]);
  const {classifications,reviewSystem,reviewTitle}=await import('../scripts/sync-review.mjs');
  for(const reason of Object.values(classifications))assert(has('sync.reason.',reason),reason);
  const syncSource=fs.readFileSync(path.resolve(import.meta.dirname,'../scripts/sync-review.mjs'),'utf8');
  for(const [,reason] of syncSource.matchAll(/explanation:'([^']+)'/g))assert(has('sync.reason.',reason),reason);
  const db=JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname,'../data/atlas.json'),'utf8'));
  const paths=['https://stonestorm.gg/game.js','/home-arena/api','/dungeons/new','/families/x','/pets/x','/mounts/new','/items/x','/arena/x','/home/x','/guild/x','/research/x','/achievementSets/x','/harcero/x','/maps/x','/features/x','/stones/x','/lean/skills/x','/lean/fishing/x','/other','/harcero/bossEvadeCaps','/onboarding/x','/spine/gate',...['skills','itemRules','worldBoss','bossAttempts','endgame','sidequests','alchemist','soulShop','fishing','patron','unknown'].map(x=>'/lean/'+x)];
  for(const p of paths){
    for(const text of [reviewSystem(p),...reviewTitle({path:p},db).split(' · ')])assert(has('sync.text.',text),`${p}: ${text}`);
  }
  for(const file of ['future-content-analyzers.mjs','future-content-client.mjs','future-content-watcher.mjs']){
    const source=fs.readFileSync(path.resolve(import.meta.dirname,'../scripts',file),'utf8');
    for(const [,reason] of source.matchAll(/statusReason\s*[:=]\s*'([^']+)'/g))assert(has('future.reason.',reason),`${file}: ${reason}`);
  }
});

test('language changes are saved, notified and restored without touching other preferences',()=>{
  const {i18n,values}=load();
  values.set('build','saved build');
  const changes=[],unsubscribe=i18n.onChange(value=>changes.push(value));
  assert.equal(i18n.t('navigation.pets'),'Kísérők');
  i18n.setLocale('en');
  assert.equal(i18n.t('navigation.pets'),'Companions');
  assert.equal(values.get(i18n.storageKey),'en');
  assert.equal(values.get('build'),'saved build');
  assert.equal(load(values.get(i18n.storageKey)).i18n.getLocale(),'en');
  unsubscribe();
  i18n.setLocale('unknown');
  assert.equal(i18n.getLocale(),'hu');
  assert.deepEqual(changes,['en']);
  assert.equal(load('unknown').i18n.getLocale(),'hu');
});

test('parameters, HTML text and missing translations are handled explicitly',()=>{
  const {i18n,warnings}=load('en');
  assert.equal(i18n.t('search.results',{count:12}),'12 results');
  assert.equal(i18n.tHtml('search.results',{count:'<script>'}),'&lt;script&gt; results');
  assert.throws(()=>i18n.t('search.results'),/Missing Atlas translation parameter/);
  assert.equal(i18n.t('not.present'),'not.present');
  assert.equal(i18n.t('not.present'),'not.present');
  assert.equal(warnings.length,1);
});

test('a missing English translation warns and falls back to Hungarian',()=>{
  const code=source.replace("      'navigation.pets':'Companions',","");
  assert.notEqual(code,source);
  const {i18n,warnings}=load('en',code);
  assert.equal(i18n.t('navigation.pets'),'Kísérők');
  assert.equal(warnings.length,1);
});

test('game names do not override newer or unmatched records',()=>{
  const {i18n}=load('en');
  assert.equal(i18n.gameNameKey('pet',{id:'pet_vulture',name:'Keselyűfióka'}),'game.pet.pet_vulture');
  assert.equal(i18n.gameNameKey('pet',{id:'pet_vulture',name:'Updated name'}),null);
  assert.equal(i18n.gameNameKey('item',{id:'pet_vulture',name:'Keselyűfióka'}),null);
  assert.equal(i18n.gameNameKey('pet',{id:'new_pet',name:'Keselyűfióka'}),null);
});

test('world game names match the captured official locales and do not override changed records',()=>{
  const {i18n}=load('en');
  const db=JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname,'../data/atlas.json'),'utf8'));
  const manifest=JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname,'../snapshots/manifest.json'),'utf8'));
  const resources=Object.values(manifest.resources);
  const get=(locale,key)=>resources.find(resource=>resource.language===locale&&resource.localeEntries?.[key])?.localeEntries[key];
  for(const [kind,collection,prefix] of [['map','maps','maps'],['mob','mobs','mobs'],['boss','bosses','bosses'],['dungeon','dungeons','dungeon/names']]){
    for(const record of db[collection]){
      const path='/'+prefix+'/'+record.id,hu=get('hu',path),en=get('en',path),key=i18n.gameNameKey(kind,record);
      if(hu===record.name&&en){
        assert(key,record.id);
        assert.equal(i18n.dictionaries.hu[key],hu);
        assert.equal(i18n.dictionaries.en[key],en);
        assert.equal(i18n.gameNameKey(kind,{...record,name:'Changed name'}),null);
      }else assert.equal(key,null,record.id);
    }
  }
});

test('guild and research names and research descriptions match captured client translations',()=>{
  const {i18n}=load('en');
  const db=JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname,'../data/atlas.json'),'utf8'));
  const manifest=JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname,'../snapshots/manifest.json'),'utf8'));
  const resources=Object.values(manifest.resources);
  const get=(locale,key)=>resources.find(resource=>resource.language===locale&&resource.localeEntries?.[key])?.localeEntries[key];
  for(const [kind,records] of [['building',db.guild.buildings.map(x=>({id:x.kind,name:x.nameHu}))],['research',db.research]]){
    for(const record of records){
      const path=kind==='building'?'/guild/buildings/'+record.id+'/name':'/research/steps/'+record.id+'/title';
      const key=i18n.gameNameKey(kind,record);
      assert(key,record.id);
      assert.equal(i18n.dictionaries.hu[key],get('hu',path));
      assert.equal(i18n.dictionaries.en[key],get('en',path));
      assert.equal(i18n.gameNameKey(kind,{...record,name:'Changed name'}),null);
      if(kind==='research'){
        const story='/research/steps/'+record.id+'/story',desc='game.researchDescription.'+record.id;
        assert.equal(i18n.dictionaries.hu[desc],record.description);
        assert.equal(i18n.dictionaries.en[desc],get('en',story));
      }
    }
  }
});

test('class, kingdom and material translations match captured client locales',()=>{
  const {i18n}=load('en');
  const db=JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname,'../data/atlas.json'),'utf8'));
  const manifest=JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname,'../snapshots/manifest.json'),'utf8'));
  const resources=Object.values(manifest.resources);
  const get=(locale,key)=>resources.find(resource=>resource.language===locale&&resource.localeEntries?.[key])?.localeEntries[key];
  for(const record of db.classes){
    const key=i18n.gameNameKey('class',record);
    assert.equal(i18n.dictionaries.hu[key],get('hu','/classes/'+record.id+'/name'));
    assert.equal(i18n.dictionaries.en[key],get('en','/classes/'+record.id+'/name'));
    for(const locale of ['hu','en'])assert.equal(i18n.dictionaries[locale]['classes.description.'+record.id],get(locale,'/classes/'+record.id+'/desc'));
    for(const locale of ['hu','en']){
      assert.equal(i18n.dictionaries[locale]['classes.skillName.'+record.skill.id],get(locale,'/skills/'+record.skill.id));
      for(const path of record.availablePaths)assert.equal(i18n.dictionaries[locale]['classes.pathName.'+path.id],get(locale,'/paths/'+path.id+'/name'));
    }
    assert.equal(i18n.gameNameKey('class',{...record,name:'Changed name'}),null);
  }
  for(const id of db.kingdoms)for(const locale of ['hu','en'])assert.equal(i18n.dictionaries[locale]['classes.kingdomMotto.'+id],get(locale,'/kingdoms/'+id+'/motto'));
  for(const [id,kind] of Object.entries(db.economy.stackKindNames))for(const field of ['name','hint'])for(const locale of ['hu','en']){
    assert.equal(i18n.dictionaries[locale]['materials.kind.'+id+'.'+field],get(locale,'/stackKinds/'+id+'/'+field));
    if(locale==='hu')assert.equal(kind[field],get(locale,'/stackKinds/'+id+'/'+field));
  }
  for(const record of db.economy.stackables){
    const path='/stackables/'+record.id,hu=get('hu',path),en=get('en',path),key=i18n.gameNameKey('material',record);
    if(hu&&en&&(record.name==null||hu===record.name)){
      assert.equal(i18n.dictionaries.hu[key],hu);
      assert.equal(i18n.dictionaries.en[key],en);
      assert.equal(i18n.gameNameKey('material',{...record,name:'Changed name'}),null);
    }else assert.equal(key,null,record.id);
  }
});

test('numbers and dates follow the selected language',()=>{
  const {i18n}=load();
  assert.equal(i18n.formatNumber(12345.5),'12 345,5');
  i18n.setLocale('en');
  assert.equal(i18n.formatNumber(12345.5),'12,345.5');
  assert.equal(i18n.formatDate(new Date('2026-11-26T12:00:00Z'),{timeZone:'UTC'}),'11/26/2026');
});
