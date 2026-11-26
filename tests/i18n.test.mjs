import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const addon=path.join(root,'addons/stonestorm-statcap-overlay');
const readJson=file=>JSON.parse(fs.readFileSync(path.join(addon,file),'utf8'));

test('Hungarian and English dictionaries have exactly the same non-empty keys',()=>{
  const hu=readJson('i18n/hu.json'),en=readJson('i18n/en.json');
  assert.deepEqual(Object.keys(en).sort(),Object.keys(hu).sort());
  for(const [key,value] of Object.entries(hu)){assert.equal(typeof value,'string',key);assert(value.trim(),key);assert.equal(typeof en[key],'string',key);assert(en[key].trim(),key);}
});

test('all placeholders match between locale files',()=>{
  const hu=readJson('i18n/hu.json'),en=readJson('i18n/en.json'),placeholders=value=>[...value.matchAll(/\{\d+\}/g)].map(match=>match[0]).sort();
  for(const key of Object.keys(hu))assert.deepEqual(placeholders(en[key]),placeholders(hu[key]),key);
});

test('Companion loads localization before its UI and ships both dictionaries',()=>{
  const manifest=readJson('manifest.json'),isolated=manifest.content_scripts.find(script=>script.world!=='MAIN'),resources=manifest.web_accessible_resources.flatMap(item=>item.resources);
  assert.equal(isolated.js[0],'i18n.js');
  assert(resources.includes('i18n/hu.json'));assert(resources.includes('i18n/en.json'));
  const shell=fs.readFileSync(path.join(addon,'companion-shell.js'),'utf8');
  assert(shell.includes('data-sc-language'));assert(shell.includes("setLocale(n.value)"));assert(shell.includes('0.14.0 BETA'));
});

test('unknown locale values explicitly fall back to Hungarian',()=>{
  const source=fs.readFileSync(path.join(addon,'i18n.js'),'utf8');
  assert(source.includes("supported.has(value)?value:'hu'"));
  assert(source.includes("locale='hu'"));
});

test('Workspace locale files match and use an independent saved language preference',()=>{
  const base=path.join(root,'tools/stonestorm-workspace/src'),hu=JSON.parse(fs.readFileSync(path.join(base,'i18n/hu.json'),'utf8')),en=JSON.parse(fs.readFileSync(path.join(base,'i18n/en.json'),'utf8'));
  assert.deepEqual(Object.keys(en).sort(),Object.keys(hu).sort());
  const policy=fs.readFileSync(path.join(base,'policy.cjs'),'utf8'),html=fs.readFileSync(path.join(base,'chrome.html'),'utf8'),main=fs.readFileSync(path.join(base,'main.cjs'),'utf8');
  assert(policy.includes("value?.language==='en'?'en':'hu'"));
  assert(html.includes('id="language"'));assert(html.includes('src="i18n.js"'));
  assert(main.includes("require('./i18n/en.json')"));
});
