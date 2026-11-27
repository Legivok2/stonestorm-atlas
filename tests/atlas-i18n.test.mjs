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

test('numbers and dates follow the selected language',()=>{
  const {i18n}=load();
  assert.equal(i18n.formatNumber(12345.5),'12 345,5');
  i18n.setLocale('en');
  assert.equal(i18n.formatNumber(12345.5),'12,345.5');
  assert.equal(i18n.formatDate(new Date('2026-11-26T12:00:00Z'),{timeZone:'UTC'}),'11/26/2026');
});
