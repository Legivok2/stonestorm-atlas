/**
 * Stonestorm Atlas – full-set bonus reconciliation (2026-11-12)
 * Run at repository root: node fix_stonestorm_set_bonuses.mjs
 * No network or dependencies required. Does not alter unrelated gameplay data.
 * Source: 2026-11-06 /api/content snapshot, version 658dc911d321:
 *   spine.sets.*.full, spine.lines.scaled, spine.lines.percent.
 * Independently visually checked in game: M4 Romőr, 6/6 (46-level set).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root = process.cwd();
const at = name => path.join(root, name);
const read = name => fs.readFileSync(at(name), 'utf8');
const write = (name, content) => {fs.mkdirSync(path.dirname(at(name)),{recursive:true});fs.writeFileSync(at(name),content,'utf8');};
const sourcePath = 'source-data/01_felszerelesek_es_szettek.json';
const generatorPath = 'scripts/build-data.mjs';
const dbPath = 'data/atlas.json';
const runtimePath = 'js/atlas-data.js';
const testPath = 'tests/set-bonuses.test.mjs';
for (const p of [sourcePath,generatorPath,dbPath,runtimePath]) if(!fs.existsSync(at(p))) {
  console.error(`Hiányzó projektfájl: ${p}\nA teljes Legivok2/stonestorm-atlas projekt gyökérmappájában futtasd!`);
  process.exit(1);
}

// Full six-piece rules, not the legacy collectionFamilies fixed-value rules.
const configurations = [
  {family:'m1',level:11, stages:[[2,['maxHp',3]],[4,['attack',3],['vsBoss',3]],[6,['potionHeal',4]]], fraction:{vsBoss:.08,potionHeal:.08}},
  {family:'m2',level:26, stages:[[2,['attack',3]],[4,['maxHp',3],['vsBoss',3]],[6,['skillDamage',4]]], fraction:{vsBoss:.082,skillDamage:.179}},
  {family:'m3',level:37, stages:[[2,['maxHp',3]],[4,['attack',3],['vsBoss',3]],[6,['critDamage',4]]], fraction:{vsBoss:.082,critDamage:.297}},
  {family:'m4',level:46, stages:[[2,['attack',3]],[4,['maxHp',3],['vsBoss',3]],[6,['lifesteal',4]]], fraction:{vsBoss:.083,lifesteal:.035}},
  {family:'m5',level:54, stages:[[2,['maxHp',3]],[4,['attack',3],['vsBoss',3]],[6,['damageTaken',4]]], fraction:{vsBoss:.084,damageTaken:.084}},
  {family:'m6',level:60, stages:[[2,['attack',3]],[4,['maxHp',3],['vsBoss',3]],[6,['critDamage',5]]], fraction:{vsBoss:.084,critDamage:.448}}
];
const scaledBase={attack:[3,6,9,13.2,18],maxHp:[24,48,90,150,240]};
const scaledExponent={attack:1.5,maxHp:1.6};
function setValue(c,stat,tier){
  if(scaledBase[stat])return Math.max(1,Math.round(scaledBase[stat][tier-1]*Math.pow((c.level+5)/15,scaledExponent[stat])));
  if(!Object.hasOwn(c.fraction,stat))throw Error(`Nincs ellenőrzött százalékos érték: ${c.family}/${stat}`);
  return c.fraction[stat];
}
const corrections = new Map(configurations.map(c=>[c.family,c.stages.map(([pieces,...stats])=>({pieces,stats:stats.map(([stat,tier])=>({stat,value:setValue(c,stat,tier)}))}))]));
const m4=corrections.get('m4');
const expectedM4 = [
  {pieces:2,stats:[{stat:'attack',value:56}]},
  {pieces:4,stats:[{stat:'maxHp',value:638},{stat:'vsBoss',value:.083}]},
  {pieces:6,stats:[{stat:'lifesteal',value:.035}]}
];
if(JSON.stringify(m4)!==JSON.stringify(expectedM4))throw Error('Romőr játékbeli egyezés nem teljesül; írás megszakítva.');

// Surgical JSON text replacement: preserves original indentation and all other source records.
// JSON is also parsed before and after, to reject accidental structural damage.
function matchingClose(text,start,open='[',close=']'){
  let depth=0,quoted=false,escape=false;
  for(let i=start;i<text.length;i++){
    const c=text[i];
    if(quoted){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quoted=false;continue;}
    if(c==='"'){quoted=true;continue;}
    if(c===open)depth++;else if(c===close&&!--depth)return i+1;
  }
  throw Error('JSON bracket matching failed');
}
let sourceText=read(sourcePath);
const oldData=JSON.parse(sourceText);
const families=oldData.collectionFamilies?.families;
if(!Array.isArray(families)||families.length!==6||families.some(f=>!corrections.has(f.id))) throw Error('Ismeretlen szettcsalád-séma, nem módosítottam.');
for(const c of configurations){
  const family= families.find(x=>x.id===c.family);
  if(family.itemLevel!==c.level)throw Error(`Szinteltérés: ${c.family} (${family.itemLevel} != ${c.level})`);
  // Exact family ID is unique in the family list, find its corresponding set block.
  const familyMarker=`"id": "${c.family}"`;
  const familiesOffset=sourceText.indexOf('"families": [',sourceText.indexOf('"collectionFamilies"'));
  const familyAt=sourceText.indexOf(familyMarker,familiesOffset);
  if(familyAt===-1)throw Error(`Hiányzik: ${c.family}`);
  const setAt=sourceText.indexOf('"set": {',familyAt);
  const nextFamily=sourceText.indexOf('"id": "m'+(Number(c.family.slice(1))+1)+'"',familyAt+familyMarker.length);
  if(nextFamily!==-1&&setAt>nextFamily)throw Error(`Szettblokk nem található: ${c.family}`);
  const bonusAt=sourceText.indexOf('"bonuses": [',setAt);
  if(bonusAt===-1)throw Error(`Bónuszlista nem található: ${c.family}`);
  const open=sourceText.indexOf('[',bonusAt);
  const end=matchingClose(sourceText,open);
  const baseIndent=sourceText.slice(sourceText.lastIndexOf('\n',bonusAt)+1,bonusAt).match(/^\s*/)[0];
  const replacement=JSON.stringify(corrections.get(c.family),null,2).replaceAll('\n','\n'+baseIndent);
  sourceText=sourceText.slice(0,open)+replacement+sourceText.slice(end);
}
const newSource=JSON.parse(sourceText);
for(const f of newSource.collectionFamilies.families){
  if(JSON.stringify(f.set.bonuses)!==JSON.stringify(corrections.get(f.id)))throw Error(`Source mismatch: ${f.id}`);
}

// Provenance is separate for the M4 in-game confirmation and the other computed families.
// Keep this transformation in build:data, so future builds don't erase it.
let generator=read(generatorPath);
const originalLine="sets:unique(records(gear.collectionFamilies.families,1,x=>({...x.set,familyId:x.id,mapIndex:x.mapIndex,itemLevel:x.itemLevel,bossId:x.bossId,unique:x.unique,loot:x.loot,name:`${world.maps.find(m=>m.index===x.mapIndex)?.nameHu ?? x.id} · szettcsalád`,nameIsEditorial:true}))),";
const replacementLine="sets:unique(records(gear.collectionFamilies.families,1,x=>({...x.set,familyId:x.id,mapIndex:x.mapIndex,itemLevel:x.itemLevel,bossId:x.bossId,unique:x.unique,loot:x.loot,name:`${world.maps.find(m=>m.index===x.mapIndex)?.nameHu ?? x.id} · szettcsalád`,nameIsEditorial:true})).map(set=>({...set,provenance:{source:'spine.sets.full + spine.lines.scaled/percent (api/content 658dc911d321)',checkedAt:'2026-11-12',status:set.familyId==='m4'?'verified':'derived',scope:set.familyId==='m4'?'A Romőr szett 2/4/6 bónusza játékbeli képernyőképpel igazolt':'A mentett játékadat képletéből számolva; élő játékbeli ellenőrzés nem történt'}}))),";
if(generator.includes(originalLine))generator=generator.replace(originalLine,replacementLine);
else if(!generator.includes(replacementLine))throw Error('A build-data.mjs szettgenerálása megváltozott; biztonságból nem módosítottam.');

const evidence={
  verifiedAt:'2026-11-12',
  gameContentVersion:'658dc911d321',
  source:'Saved Stonestorm /api/content; spine.sets.full and spine.lines.scaled/percent',
  rules:'2 / 4 / 6 items, FULL set scheme; T3 for 2 and 4 pieces, T4 for 6 pieces (M6 T5)',
  directlyConfirmedInGame:['m4'],
  otherFamilies:'Calculated from saved game rules, NOT independently checked against the live game',
  specialNote:'The in-game Szett-bónusz +2% modifier is separate from these displayed base values.',
  results:configurations.map(c=>({familyId:c.family,level:c.level,bonuses:corrections.get(c.family)}))
};

const testCode=`import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const src=JSON.parse(fs.readFileSync(new URL('source-data/01_felszerelesek_es_szettek.json',root),'utf8'));
const atlas=JSON.parse(fs.readFileSync(new URL('data/atlas.json',root),'utf8'));
const evidence=JSON.parse(fs.readFileSync(new URL('data/set-bonus-evidence.json',root),'utf8'));
const expected=${JSON.stringify(Object.fromEntries(configurations.map(c=>[c.family,corrections.get(c.family)])),null,2)};
test('Mind a hat szett teljes 2/4/6 bónuszsora egyezik a visszafejtett FULL szabállyal',()=>{
  assert.equal(atlas.sets.length,6);
  for(const [family,bonuses] of Object.entries(expected)){
    assert.deepEqual(src.collectionFamilies.families.find(x=>x.id===family).set.bonuses,bonuses);
    const s=atlas.sets.find(x=>x.familyId===family);
    assert(s,'missing '+family);
    assert.deepEqual(s.bonuses,bonuses,family);
    assert.equal(s.provenance.status,family==='m4'?'verified':'derived');
  }
});
test('Romőr M4 teljesen egyezik a játék képernyőképével',()=>{
  assert.deepEqual(atlas.sets.find(x=>x.familyId==='m4').bonuses,${JSON.stringify(expectedM4)});
  assert.deepEqual(evidence.directlyConfirmedInGame,['m4']);
});
test('A böngészős atlas-data.js is ugyanazokat a szettbónuszokat tartalmazza',()=>{
  const code=fs.readFileSync(new URL('js/atlas-data.js',root),'utf8');
  const prefix='window.STONESTORM_ATLAS = ';
  const start=code.indexOf(prefix);
  assert(start>=0);
  const end=code.lastIndexOf(';');
  const data=JSON.parse(code.slice(start+prefix.length,end));
  for(const s of data.sets)assert.deepEqual(s.bonuses,expected[s.familyId]);
});
`;

// All validation has completed. Begin modifications now.
write(sourcePath,sourceText);
write(generatorPath,generator);
write('data/set-bonus-evidence.json',JSON.stringify(evidence,null,2)+'\n');
write(testPath,testCode);

let regenerated=false;
try{
  execFileSync(process.execPath,['scripts/build-data.mjs'],{cwd:root,stdio:'inherit',timeout:30000});
  regenerated=true;
}catch(err){
  console.warn('A teljes Atlas-generátor nem futott le. A meglévő runtime-adatokat biztonságos helyettesítő módszerrel frissítem.');
  const db=JSON.parse(read(dbPath));
  for(const s of db.sets){
    if(!corrections.has(s.familyId))throw Error('Unknown set family: '+s.familyId);
    s.bonuses=corrections.get(s.familyId);
    s.provenance={source:'spine.sets.full + spine.lines.scaled/percent (api/content 658dc911d321)',checkedAt:'2026-11-12',status:s.familyId==='m4'?'verified':'derived',scope:s.familyId==='m4'?'A Romőr szett 2/4/6 bónusza játékbeli képernyőképpel igazolt':'A mentett játékadat képletéből számolva; élő játékbeli ellenőrzés nem történt'};
  }
  const srcRec=db.sources?.find(x=>x.file===sourcePath.split('/').pop());
  if(srcRec)srcRec.sha256=crypto.createHash('sha256').update(fs.readFileSync(at(sourcePath))).digest('hex');
  write(dbPath,JSON.stringify(db));
  write(runtimePath,`/* Generált fájl; npm run build:data. */\nwindow.STONESTORM_ATLAS = ${JSON.stringify(db).replaceAll('<','\\u003c')};\n`);
}

execFileSync(process.execPath,['--test',testPath],{cwd:root,stdio:'inherit',timeout:30000});
console.log('\n✅ Mind a 6 szett javítva. Romőr M4 = +56 Támadás / +638 HP / +8,3% boss / +3,5% Életlopás.');
console.log('✅ Módosítva: '+[sourcePath,generatorPath,dbPath,runtimePath,'data/set-bonus-evidence.json',testPath].join(', '));
console.log('✅ Generálás: '+(regenerated?'eredeti build-data.mjs sikeres':'fallback, adatállományok frissítve'));
console.log('Következő lépés: npm test, git diff, commit és push.');
