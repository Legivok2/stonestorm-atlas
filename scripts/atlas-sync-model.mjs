import fs from 'node:fs';
import crypto from 'node:crypto';
import {planDungeons,applyDungeons} from './dungeon-sync.mjs';
import {planHomeArena,applyHomeArena} from './home-arena-model.mjs';

export const API='https://stonestorm.gg/api/content';
export const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b,'en'))):v);
export const sha256=value=>crypto.createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:canonical(value)).digest('hex');
export const equal=(a,b)=>canonical(a)===canonical(b);
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const id=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(v)&&!['__proto__','constructor','prototype'].includes(v);
const numeric=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1e12;
const required=['items','maps','mobs','bosses','pets','spine','harcero','limits'];
export function validateContent(c){
  if(!object(c)||!id(c.version))throw Error('Hiányzó vagy hibás játékverzió');
  for(const key of required)if(!c[key]||typeof c[key]!=='object')throw Error('Hiányos konfiguráció: '+key);
  for(const key of ['items','maps','mobs','bosses']){
    if(!Array.isArray(c[key])||!c[key].length)throw Error('Hiányos rekordlista: '+key);
    const seen=new Set();for(const row of c[key]){if(!object(row)||!id(row.id)||seen.has(row.id))throw Error('Hibás vagy duplikált azonosító: '+key);seen.add(row.id);}
  }
  if(!object(c.pets.v3)||!object(c.spine.sets)||!object(c.spine.lines))throw Error('Hiányos v3 / full szettséma');
  for(const key of ['user','session','account','access_token','refresh_token'])if(key in c)throw Error('Nem publikus konfigurációnak látszó válasz');
  return c;
}

// Minden ágat összehasonlít; az azonosítós tömbök sorrendje nem jelent változást.
export function diffJSON(before,after,path=''){
  if(equal(before,after))return [];
  if(before===undefined)return [{kind:'added',path:path||'/',after}];
  if(after===undefined)return [{kind:'removed',path:path||'/',before}];
  if(Array.isArray(before)&&Array.isArray(after)){
    const keyed=arr=>arr.every(x=>object(x)&&id(x.id))&&new Set(arr.map(x=>x.id)).size===arr.length;
    if(keyed(before)&&keyed(after)){
      const a=new Map(before.map(x=>[x.id,x])),b=new Map(after.map(x=>[x.id,x]));
      return [...new Set([...a.keys(),...b.keys()])].sort().flatMap(k=>diffJSON(a.get(k),b.get(k),path+'/'+k));
    }
    return Array.from({length:Math.max(before.length,after.length)},(_,n)=>diffJSON(before[n],after[n],path+'/'+n)).flat();
  }
  if(object(before)&&object(after))return [...new Set([...Object.keys(before),...Object.keys(after)])].sort().flatMap(k=>diffJSON(before[k],after[k],path+'/'+k.replaceAll('~','~0').replaceAll('/','~1')));
  return [{kind:'changed',path:path||'/',before,after}];
}
const groups=[
  ['Felszerelések',/items|spine\/eq/],['Szettek',/sets|families/],['Kovácsolás és bónuszok',/forge|bonus|polish|stones/],
  ['Statok és fejlődés',/harcero|limits|classes|skillPaths|xpTable/],['Kísérők és hátasok',/pets|mounts/],
  ['Világ és bossok',/maps|mobs|bosses|worldBoss/],['Kazamaták és vadászat',/dungeon|hunt|patrol|expedition|idle|rift|runThemes|runFlavour|play/],
  ['Aréna és szezonok',/arena|pvp|season|league/],['Otthon és épületek',/home|dataHome/],['Céhek',/guild/],
  ['Kutatások',/research/],['Tárgyak és boltok',/stackables|premium|shop|econom|reward/],['Események',/event|features|onboarding|achievement/],
  ['Magyar fordítások',/locale|\.hu|\/hu-/],['Képek és grafikák',/art|images|graphics/]
];
export const category=path=>groups.find(([,pattern])=>pattern.test(path))?.[0]??'Egyéb / ismeretlen rendszer';

// Az első összevetés részleges történeti bázis: csak a ténylegesen mentett mezők.
export function localBaseline(root){
  const read=name=>JSON.parse(fs.readFileSync(new URL('../source-data/'+name,root),'utf8'));
  const files=fs.readdirSync(new URL('../source-data/',root)).filter(x=>x.endsWith('.json')).sort();
  const rows=files.map(read),out={};
  for(const row of rows)for(const [key,v] of Object.entries(row))if(!['metadata','locale','count','counts','note','caution','createdAt','sourceHashes','coverage','untouchedRawSource'].includes(key)&&!key.startsWith('_'))out[key]=v;
  out.pets={rules:rows[3].rules,traits:rows[3].traits,types:rows[3].types,v3:rows[3].v3,dungeon:rows[3].dungeon,rankBonusShare:rows[3].rankBonusShare};
  out.mounts=rows[4].mounts;
  // A magyar nevek szerkesztett kiegészítések, nem API-változások.
  return JSON.parse(JSON.stringify(out, (k,v)=>['nameHu','descriptionHu'].includes(k)?undefined:v));
}

export function fullSetBonuses(content,familyId){
  const s=content.spine?.sets?.[familyId],lines=content.spine?.lines;
  if(!s||!numeric(s.familyLevel)||!Array.isArray(s.full)||!equal(s.full.map(x=>x.pieces),[2,4,6]))throw Error('Ismeretlen full szettséma: '+familyId);
  const scaled=lines?.scaled,bands=lines?.percent;
  if(Object.keys(s).some(k=>!['familyLevel','full','classic'].includes(k))||!object(scaled)||Object.keys(scaled).some(k=>!['refLevel','offset','linearBelowRef','exponent','minValue','base'].includes(k))||!Array.isArray(bands)||!bands.length||!numeric(scaled.refLevel)||!numeric(scaled.offset)||!numeric(scaled.minValue))throw Error('Ismeretlen szettskálázás');
  const band=[...bands].filter(x=>numeric(x.fromLevel)&&x.fromLevel<=s.familyLevel).sort((a,b)=>b.fromLevel-a.fromLevel)[0];
  return s.full.map(stage=>{
    if(Object.keys(stage).some(k=>!['pieces','stats'].includes(k))||!Array.isArray(stage.stats)||!stage.stats.length)throw Error('Hiányzó vagy ismeretlen szettstat');
    const seen=new Set();
    return {pieces:stage.pieces,stats:stage.stats.map(({stat,tier,...extra})=>{
      if(!id(stat)||!Number.isInteger(tier)||tier<1||tier>5||seen.has(stat)||Object.keys(extra).length)throw Error('Ismeretlen szettfokozat');seen.add(stat);
      let value;
      if(scaled.base?.[stat]){
        const base=scaled.base[stat][tier-1],exp=scaled.exponent?.[stat],ratio=(s.familyLevel+scaled.offset)/(scaled.refLevel+scaled.offset);
        if(!numeric(base)||!numeric(exp)||!Number.isFinite(ratio)||ratio<=0||s.familyLevel<scaled.refLevel)throw Error('Nem támogatott szettskálázás');
        value=Math.max(scaled.minValue,Math.round(base*Math.pow(ratio,exp)));
      }else value=band?.tiers?.[stat]?.[tier-1];
      if(!numeric(value))throw Error('Hiányzó szettérték: '+stat);
      return {stat,value};
    })};
  });
}

const fields={
  items:['id','slot','level','tier','classes','values','sellPrice','buyPrice','family','rarity','icon','portraitTier','portrait','art'],
  mobs:['id','level','tags','materialId','mapIndex','statLevel','harcero','maxHp','atkMin','atkMax','def','xp','nyangMin','nyangMax'],
  bosses:['id','mobId','mapIndex','recommendedLevel'],
  stackables:['id','kind','sellPrice','buyPrice','chosen']
};
export function validateRecord(kind,row,db){
  if(!object(row)||!id(row.id)||Object.keys(row).some(k=>!fields[kind]?.includes(k)))throw Error('Ismeretlen rekordséma: '+kind);
  for(const [k,v] of Object.entries(row)){
    if(['level','tier','portraitTier','sellPrice','buyPrice','mapIndex','statLevel','harcero','maxHp','atkMin','atkMax','def','xp','nyangMin','nyangMax','recommendedLevel'].includes(k)&&!numeric(v))throw Error('Hibás számérték: '+k);
    if(['classes','tags'].includes(k)&&!(k==='classes'&&v===null)&&(!Array.isArray(v)||!v.every(id)))throw Error('Hibás lista: '+k);
    if(['slot','family','rarity','icon','portrait','art','materialId','mobId','kind'].includes(k)&&!(k==='materialId'&&v===null)&&!id(v))throw Error('Hibás mező: '+k);
    if(k==='chosen'&&typeof v!=='boolean')throw Error('Hibás logikai mező');
  }
  if(kind==='items'){
    if(!db.labels.slots[row.slot]||!Number.isInteger(row.level)||row.level<1||row.level>db.economy.limits.maxLevel||!Number.isInteger(row.tier)||row.tier>5||!(row.classes===null||Array.isArray(row.classes))||(row.classes??[]).some(c=>!db.classes.some(x=>x.id===c))||!object(row.values)||!Object.keys(row.values).length)throw Error('Hibás tárgyséma');
    const stats=new Set(db.items.flatMap(x=>Object.keys(x.values)));
    if(Object.entries(row.values).some(([k,v])=>!stats.has(k)||!numeric(v)))throw Error('Ismeretlen tárgystat');
    if(row.family&&!db.sets.some(x=>x.familyId===row.family))throw Error('Ismeretlen szettcsalád');
  }
  if(kind==='mobs'&&(!numeric(row.level)||('mapIndex' in row&&!numeric(row.mapIndex))||!numeric(row.maxHp)))throw Error('Hiányos ellenfél');
  if(kind==='bosses'&&(!id(row.mobId)||!numeric(row.mapIndex)||!numeric(row.recommendedLevel)))throw Error('Hiányos boss');
  if(kind==='stackables'&&!id(row.kind))throw Error('Hiányos tárgytípus');
  return row;
}

export function planImport(content,db,previous={schema:1,records:{},sets:{}},checkedAt=new Date().toISOString()){
  validateContent(content);
  const overlay=structuredClone(previous),review=[],accepted=[],resolved=[],sourceHash=sha256(JSON.stringify(content));
  overlay.schema=1;overlay.records??={};overlay.sets??={};
  const provenance=apiPath=>({source:API,apiPath,sha256:sourceHash,gameVersion:content.version,checkedAt,status:'derived',scope:'Nyilvános API-ból sémával ellenőrzött adat; nem játékbeli megfigyelés'});
  for(const kind of Object.keys(fields)){
    const existing=kind==='stackables'?db.economy.stackables:db[kind],incoming=content[kind];
    if(!Array.isArray(incoming)){review.push({path:'/'+kind,reason:'Hiányzó lista; a korábbi rekordok megmaradnak'});continue;}
    const ids=new Set();
    for(const raw of incoming){
      if(!id(raw.id)||ids.has(raw.id))throw Error('Duplikált importazonosító: '+kind);ids.add(raw.id);
      const old=existing.find(x=>x.id===raw.id),clean=old?Object.fromEntries(Object.entries(old).filter(([k])=>fields[kind].includes(k))):{};
      try{
        const merged={...clean,...raw,values:kind==='items'?{...clean.values,...raw.values}:undefined};if(kind!=='items')delete merged.values;
        const missing=Object.keys(clean).filter(k=>!(k in raw));
        if(kind==='items'&&(!object(raw.values)||Object.keys(clean.values??{}).some(k=>!(k in raw.values))))missing.push('values');
        if(missing.length){review.push({path:`/${kind}/${raw.id}`,reason:'Hiányzó mezők; a rekord változatlan marad: '+missing.join(', ')});continue;}
        validateRecord(kind,merged,db);
        if(kind==='bosses'&&(!content.mobs.some(x=>x.id===merged.mobId)||!content.maps.some(x=>x.index===merged.mapIndex)))throw Error('Hiányzó bosskapcsolat');
        if(kind==='mobs'&&merged.mapIndex!==undefined&&!content.maps.some(x=>x.index===merged.mapIndex))throw Error('Hiányzó pályakapcsolat');
        resolved.push('/'+kind+'/'+raw.id);
        if(equal(clean,merged))continue;
        overlay.records[kind]??={};overlay.records[kind][raw.id]={record:merged,provenance:provenance('/'+kind+'/'+raw.id)};
        accepted.push({path:`/${kind}/${raw.id}`,kind:old?'changed':'added'});
      }catch(e){review.push({path:`/${kind}/${raw.id}`,reason:e.message});}
    }
    for(const old of existing)if(!ids.has(old.id))review.push({path:`/${kind}/${old.id}`,reason:'Eltávolított vagy átmenetileg hiányzó rekord; megtartva'});
  }
  for(const set of db.sets){
    try{
      const bonuses=fullSetBonuses(content,set.familyId);
      if(equal(bonuses,set.bonuses)){resolved.push('/spine/sets/'+set.familyId);continue;}
      if(set.familyId==='m4'||set.provenance?.status==='verified')throw Error('Játékban igazolt szett védett; kézi ellenőrzés szükséges');
      if(!equal(bonuses.map(x=>[x.pieces,x.stats.map(y=>y.stat)]),set.bonuses.map(x=>[x.pieces,x.stats.map(y=>y.stat)])))throw Error('Új szettmechanika');
      if(content.spine.sets[set.familyId].familyLevel!==set.itemLevel)throw Error('Új szettkövetelményszint');
      overlay.sets[set.familyId]={bonuses,provenance:provenance('/spine/sets/'+set.familyId+'/full'),evidence:{set:content.spine.sets[set.familyId],lines:content.spine.lines}};
      accepted.push({path:'/spine/sets/'+set.familyId+'/full',kind:'changed'});
    }catch(e){review.push({path:'/spine/sets/'+set.familyId,reason:e.message});}
  }
  for(const key of Object.keys(content.spine.sets))if(!db.sets.some(x=>x.familyId===key))review.push({path:'/spine/sets/'+key,reason:'Új szettcsalád; szerkezeti ellenőrzés szükséges'});
  const dungeonPlan=planDungeons(content,db,overlay,provenance);
  accepted.push(...dungeonPlan.accepted);review.push(...dungeonPlan.review);
  const systems=planHomeArena(content,db,overlay,provenance);
  accepted.push(...systems.accepted);review.push(...systems.review);resolved.push(...systems.resolved);
  if(accepted.length){overlay.gameVersion=content.version;overlay.checkedAt=checkedAt;overlay.sourceHash=sourceHash;}
  return {overlay,accepted,review,resolved,validatedDungeons:dungeonPlan.validated};
}

// A kézi forrásfájlok érintetlenek; kizárólag ellenőrzött, eredettel ellátott felülréteg.
export function applyOverlay(db,overlay){
  if(!overlay)return db;
  if(overlay.schema!==1)throw Error('Ismeretlen sync-import séma');
  for(const [kind,records] of Object.entries(overlay.records??{})){
    if(!fields[kind])throw Error('Tiltott importág: '+kind);
    const list=kind==='stackables'?db.economy.stackables:db[kind];
    for(const [key,entry] of Object.entries(records)){
      validateRecord(kind,entry.record,db);if(key!==entry.record.id)throw Error('Importazonosító eltér');validateProvenance(entry.provenance);
      const index=list.findIndex(x=>x.id===key),old=index<0?{}:list[index],row={...old,...entry.record,provenance:entry.provenance};
      if(kind==='items')row.name=old.name??key;
      if(kind==='mobs'||kind==='bosses')row.name=old.name??key;
      if(index<0)list.push(row);else list[index]=row;
    }
  }
  for(const [family,entry] of Object.entries(overlay.sets??{})){
    const set=db.sets.find(x=>x.familyId===family);
    if(!set||family==='m4'||set.provenance.status==='verified')throw Error('Védett vagy ismeretlen szett');
    validateProvenance(entry.provenance);
    if(!equal(fullSetBonuses({spine:{sets:{[family]:entry.evidence?.set},lines:entry.evidence?.lines}},family),entry.bonuses))throw Error('A szettimport eltér a saját forrásképletétől');
    if(!equal(entry.bonuses.map(x=>[x.pieces,x.stats.map(y=>y.stat)]),set.bonuses.map(x=>[x.pieces,x.stats.map(y=>y.stat)]))||entry.bonuses.some(x=>x.stats.some(y=>!numeric(y.value))))throw Error('Ismeretlen szettimport');
    set.bonuses=entry.bonuses;set.provenance=entry.provenance;
  }
  applyDungeons(db,overlay,validateProvenance);
  applyHomeArena(db,overlay,validateProvenance);
  return db;
}
function validateProvenance(p){if(p?.source!==API||!/^\/[a-zA-Z0-9/_-]+$/.test(p.apiPath??'')||!/[a-f0-9]{64}/.test(p.sha256??'')||!id(p.gameVersion)||!Number.isFinite(Date.parse(p.checkedAt))||p.status!=='derived')throw Error('Hiányos importforrás');}
