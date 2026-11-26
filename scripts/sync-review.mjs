import fs from 'node:fs';
import path from 'node:path';
import {equal,sha256,fullSetBonuses} from './atlas-sync-model.mjs';
import {roomStats,dungeonRecord} from './dungeon-sync.mjs';
import {systemPaths} from './home-arena-model.mjs';
import {engineBranches} from './data-engine.mjs';

export const classifications={
  automatic:'Ismert, validálható adat',
  unsupported:'Ismert rendszer – importáló támogatás hiányzik',
  mechanism:'Új vagy megváltozott játékmechanika',
  observation:'Korábbi első megfigyelés / forrásleltár',
  conflict:'Kézi ellenőrzést igénylő eltérés'
};
export function atPath(root,pointer){
  if(!pointer?.startsWith('/'))return undefined;
  return pointer.slice(1).split('/').map(x=>x.replaceAll('~1','/').replaceAll('~0','~')).reduce((v,k)=>Array.isArray(v)&&!/^\d+$/.test(k)?v.find(x=>x?.id===k):v?.[k],root);
}
const observed=(content,p,sources)=>p.startsWith('https:')?sources.find(x=>x.url===p)?.sha256:atPath(content,p);
const witness=(v)=>sha256({present:v!==undefined,value:v??null});
const contains=(root,p)=>p===root||p.startsWith(root+'/');
function engineProof(entry,content,db){
  const routes=[['/pets/types','/pets'],['/pets/traits','/petTraits'],['/pets/v3/skills','/petSkills'],['/pets/v3/forms','/petForms'],['/pets/v3','/petSystem/v3'],['/spine/hero/pets','/petSystem/spine'],['/mounts','/mounts'],['/lean/researchSteps','/research'],['/forge','/forge'],...Object.entries(engineBranches).filter(([k])=>['stats','bonus','limits','rewards','polish','stones','skills','playRef','spine','maps','features'].includes(k)).map(([k,p])=>['/'+p.replaceAll('.','/'),k==='limits'?'/economy/limits':'/dataEngine/publicRules/'+k])];
  const match=routes.find(([p])=>contains(p,entry.path));if(!match||!db.dataEngine)return null;
  const key=Object.entries(engineBranches).sort((a,b)=>b[1].length-a[1].length).find(([,p])=>contains('/'+p.replaceAll('.','/'),entry.path))?.[0];
  const branch=db.dataEngine.branches[key],input=atPath(content,'/'+engineBranches[key]?.replaceAll('.','/'));
  const value=atPath(content,entry.path),actual=atPath(db,entry.path.replace(match[0],match[1]));
  // Normalized records add editorial names and provenance. Every API field must
  // still match; extra Atlas metadata is not a missing import or a source field.
  const matches=(source,target)=>Array.isArray(source)?Array.isArray(target)&&source.length===target.length&&source.every((v,i)=>matches(v,target[i])):source&&typeof source==='object'?target&&typeof target==='object'&&!Array.isArray(target)&&Object.keys(source).every(k=>Object.hasOwn(target,k)&&matches(source[k],target[k])):equal(source,target);
  if(branch&&input!==undefined&&branch.sha256===sha256(JSON.stringify(input))&&value!==undefined&&matches(value,actual))return {kind:'automatic-import',rule:'data-engine-v2-value-match',sourceHash:branch.sha256,valueHash:witness(value),explanation:'Az engedélyezett séma teljes forráság-hashe és minden érintett API-mező beépített értéke egyezik. Az Atlas hozzáadott szerkesztői metaadata külön mező; az import nem szerveres végszabály-igazolás.'};
  return null;
}
export function reviewSystem(p){
  if(p.startsWith('https:'))return 'Kliens és fordítások';
  if(p.startsWith('/home-arena/'))return 'Otthon és Aréna';
  // Először a tulajdonos rendszer, csak utána a stat neve: terem-harcerő is Kazamaták.
  if(/^\/dungeons(?:\/|$)|dungeon|Dungeon|portalview/i.test(p))return 'Kazamaták';
  if(/^\/families|^\/spine\/sets/.test(p))return 'Szettek';
  if(/^\/pets|pet|companion/i.test(p))return 'Kísérők';
  if(/^\/mounts|mount|stable/i.test(p))return 'Hátasok';
  if(/^\/items|equipment|inventory|armor|weapon/i.test(p))return 'Felszerelések';
  if(/^\/onboarding\/unlocks\/(?:arena|nav\.arena)|arena|league/i.test(p))return 'Aréna';
  if(/home|house|room|building/i.test(p))return 'Ház';
  if(/guild/i.test(p))return 'Céh';
  if(/research/i.test(p))return 'Kutatások';
  if(/^\/achievementSets|^\/lean\/achievements|achievement|achv/i.test(p))return 'Teljesítmények';
  if(/^\/harcero|^\/limits|^\/spine\/gate|combat|stat-cap/i.test(p))return 'Harci szabályok és fejlődés';
  if(/^\/maps|^\/mobs|^\/bosses|worldBoss|world-boss/i.test(p))return 'Világ és bossok';
  if(/^\/features|^\/onboarding|event/i.test(p))return 'Játékrendszerek és események';
  if(/^\/stones|^\/lean\/(?:alchemist|itemRules|soulShop)|forge|bonus|stone/i.test(p))return 'Kovácsolás és anyagok';
  if(/^\/lean\/(?:skills|endgame|bossAttempts)/.test(p))return 'Képességek és fejlődés';
  if(/^\/lean\/(?:fishing|patron|sidequests)/.test(p))return 'Melléktevékenységek';
  if(p.startsWith('https:'))return 'Kliens és fordítások';
  return 'Egyéb rendszerek';
}
const statNames={maxHp:'életerő',atkMin:'minimumsebzés',atkMax:'maximumsebzés',def:'védelem',harcero:'harcerő',xp:'XP-jutalom',nyang:'nyangjutalom'};
function identity(p,content){
  const m=p.match(/^\/dungeons\/([^/]+)\/(heroic\/)?rooms\/(\d+)\/([^/]+)$/);
  if(!m)return null;
  const dungeon=content.dungeons?.find(x=>x.id===m[1]),mode=m[2]?'heroic':'normal',room=(mode==='heroic'?dungeon?.heroic.rooms:dungeon?.rooms)?.[Number(m[3])];
  return room?{dungeonId:m[1],mode,room:room.room,creatureId:room.creatureId,stat:m[4]}:null;
}
export function reviewTitle(entry,db){
  const p=entry.path,parts=p.split('/');
  if(entry.identity){const x=entry.identity,d=db.dungeons.find(d=>d.id===x.dungeonId);return `${d?.name??'Kazamata'} · ${x.mode==='heroic'?'hősi':'normál'} ${x.room}. terem · ${statNames[x.stat]??'teremadat'}`;}
  if(p.startsWith('https:'))return 'Kliensfájlok és fordítások forrásleltára';
  if(parts[1]==='mounts')return (db.mounts.find(x=>x.id===parts[2])?.name??'Hátas')+' · számított utazási idő';
  if(parts[1]==='dungeons')return (db.dungeons.find(x=>x.id===parts[2])?.name??'Kazamata')+' · szerkezet és teremkapcsolatok';
  if(parts[1]==='families')return 'Régi és teljes szettszabályok eltérése';
  if(p.startsWith('/harcero/bossEvadeCaps'))return 'Kitérési korlát a különböző bossok ellen';
  if(parts[1]==='features')return 'Játékrendszerek elérhetőségi kapcsolói';
  if(parts[1]==='achievementSets'||p==='/lean/achievements')return 'Teljesítmények és jutalomcsoportok';
  if(parts[1]==='maps')return 'Hatodik tájegység · erősségi módosítók';
  if(parts[1]==='onboarding')return 'Aréna feloldása és szintkövetelménye';
  if(parts[1]==='stones')return 'Kövek és alapanyagok beszerzési forrásai';
  if(p==='/spine/gate')return 'Fejlődési és egyensúlyozási szabályok';
  if(parts[1]==='lean')return ({skills:'Kasztképességek',itemRules:'Tárgyfejlesztési szabályok',worldBoss:'Világboss feltételei',bossAttempts:'Bosspróbálkozások',endgame:'Hősi végjáték',sidequests:'Mellékküldetések',alchemist:'Alkimista és főzetek',soulShop:'Lélekbolt',fishing:'Horgászat',patron:'Támogatói bónuszok'})[parts[2]]??'Kiegészítő játékszabályok';
  return reviewSystem(p)+' · ellenőrzendő adat';
}

const aliasMappings={
  '/lean/skills':['05_kasztok_kepessegek_harcertek.json','leanSkills'],
  '/lean/itemRules':['02_kovacsolas_bonuses_kovek.json','itemRulesExtended'],
  '/lean/worldBoss':['06_terkepek_szornyek_bossok_kazamatak.json','worldBossRules'],
  '/lean/bossAttempts':['06_terkepek_szornyek_bossok_kazamatak.json','bossAttempts'],
  '/lean/endgame':['06_terkepek_szornyek_bossok_kazamatak.json','endgame'],
  '/lean/sidequests':['10_teljesitmenyek_kuldetesek.json','sidequests'],
  '/lean/alchemist':['08_anyagok_penzugyek_boltok.json','leanEconomy/alchemist'],
  '/lean/soulShop':['08_anyagok_penzugyek_boltok.json','leanEconomy/soulShop'],
  '/lean/fishing':['08_anyagok_penzugyek_boltok.json','leanEconomy/fishing']
};
export function loadReviewAliases(root){
  return Object.fromEntries(Object.entries(aliasMappings).filter(([, [file]])=>fs.existsSync(path.join(root,'source-data',file))).map(([p,[file,key]])=>{
    const bytes=fs.readFileSync(path.join(root,'source-data',file));
    return [p,{value:atPath(JSON.parse(bytes),'/'+key),file,sourcePath:'/'+key,sha256:sha256(bytes)}];
  }));
}
function editorialProof(entry,content,db,aliases){
  const alias=aliases[entry.path];
  if(alias&&equal(alias.value,atPath(content,entry.path)))return {rule:'saved-source-alias-v1',sourceFile:alias.file,sourcePath:alias.sourcePath,sourceHash:alias.sha256,explanation:'A teljes API-ág pontosan egyezik a már mentett, más néven tárolt forrásadattal; nem új mechanika.'};
  const m=entry.path.match(/^\/mounts\/([^/]+)\/timeReductionPctFromTravelMult$/);
  if(m){
    const api=content.mounts?.find(x=>x.id===m[1]),mount=db.mounts.find(x=>x.id===m[1]);
    if(api&&mount&&typeof api.travelMult==='number'&&api.travelMult>0&&api.travelMult<=1&&api.travelMult===mount.travelMult&&Math.abs(mount.timeReductionPctFromTravelMult-(1-api.travelMult)*100)<1e-8){
      return {rule:'editorial-travel-percentage-v1',input:api.travelMult,result:mount.timeReductionPctFromTravelMult,explanation:'Szerkesztett, számított Atlas-mező: (1 − utazási szorzó) × 100. A nyers API-ból való hiánya nem adattörlés.'};
    }
  }
  return null;
}
export function classifyReview(entry,{plan,content,db,aliases={}}){
  if(engineProof(entry,content,db))return 'automatic';
  if(entry.path.startsWith('https:'))return entry.beforeHash?'mechanism':'observation';
  if(editorialProof(entry,content,db,aliases))return entry.path.startsWith('/mounts/')?'automatic':'observation';
  if(db.homeArena&&Object.values(systemPaths).some(p=>entry.path===p||p.endsWith('/level')&&entry.path===p.slice(0,-6)&&Object.keys(atPath(content,entry.path)??{}).length===1))return 'automatic';
  if(/^\/families(?:\/|$)|^\/harcero\/bossEvadeCaps/.test(entry.path)||/védett|Játékban igazolt/.test(entry.reason??''))return 'conflict';
  if(entry.identity&&roomStats.includes(entry.identity.stat)&&plan.validatedDungeons.includes(entry.identity.dungeonId))return 'automatic';
  if(/^\/dungeons\/[^/]+$/.test(entry.path)&&plan.validatedDungeons.includes(entry.path.split('/')[2]))return 'automatic';
  if(/^\/spine\/sets\/[^/]+\/full(?:\/|$)/.test(entry.path)&&(plan.resolved.some(p=>contains(p,entry.path))||plan.accepted.some(p=>contains(p.path,entry.path))))return 'automatic';
  if(plan.resolved.some(p=>contains(p,entry.path))&&/^(?:\/(items|mobs|bosses|stackables)\/)/.test(entry.path))return 'automatic';
  if(/^\/dungeons\/[^/]+\/recommendedLevel$/.test(entry.path)&&plan.validatedDungeons.includes(entry.path.split('/')[2]))return 'automatic';
  if(/^\/dungeons/.test(entry.path))return 'mechanism';
  if(/^\/features\//.test(entry.path))return entry.changeKind==='added'?'mechanism':'unsupported';
  if(/^\/achievementSets\//.test(entry.path))return entry.changeKind==='added'?'mechanism':'unsupported';
  if(/^\/lean\/|^\/stones\/|^\/mounts\//.test(entry.path))return 'unsupported';
  if(/^\/maps\/|^\/onboarding\/|^\/spine\/gate/.test(entry.path))return 'mechanism';
  if(entry.origin==='first-observation')return 'observation';
  return 'mechanism';
}
function processingProof(entry,{plan,content,db,aliases,sourceHash}){
  const engine=engineProof(entry,content,db);if(engine)return engine;
  const doc=editorialProof(entry,content,db,aliases);if(doc)return {kind:'documented-review',...doc};
  if(entry.classification!=='automatic')return null;
  const dungeon=entry.path.match(/^\/dungeons\/([^/]+)$/);
  if(dungeon&&plan.validatedDungeons.includes(dungeon[1])){
    const api=content.dungeons.find(x=>x.id===dungeon[1]),atlas=db.dungeons.find(x=>x.id===dungeon[1]);
    if(api&&atlas&&equal(api,dungeonRecord(atlas)))return {kind:'automatic-import',rule:'validated-whole-dungeon-v3',sourceHash,valueHash:witness(api),explanation:'A korábban elutasított kazamata teljes rekordja, minden terem és az ajánlott szint validált és pontosan egyezik az Atlasban.'};
  }
  if(db.homeArena){
    for(const [key,p] of Object.entries(systemPaths)){
      const parent=entry.path===p.slice(0,-6)&&p.endsWith('/level')&&Object.keys(atPath(content,entry.path)??{}).length===1;
      const expected=atPath(content,p);
      if((entry.path===p||parent)&&plan.resolved.includes(p)&&expected!==undefined&&expected===db.homeArena.api[key])return {kind:'automatic-import',rule:'validated-home-arena-api-v1',sourceHash,valueHash:witness(atPath(content,entry.path)),explanation:'Az Otthon/Aréna ismert API-mezője egyezik a forrással; a kapcsoló nem bizonyít további játékszabályt.'};
    }
  }
  const setMatch=entry.path.match(/^\/spine\/sets\/([^/]+)\/full(?:\/|$)/);
  if(setMatch){try{if(equal(fullSetBonuses(content,setMatch[1]),db.sets.find(x=>x.familyId===setMatch[1])?.bonuses))return {kind:'automatic-import',rule:'validated-full-set-match-v1',sourceHash,explanation:'A teljes, validált szettképlet egyezik az Atlas közös szettadatával.'};}catch{}return null;}
  const x=entry.identity;
  if(x&&roomStats.includes(x.stat)&&plan.validatedDungeons.includes(x.dungeonId)){
    const current=content.dungeons.find(d=>d.id===x.dungeonId),atlas=db.dungeons.find(d=>d.id===x.dungeonId);
    const room=d=>(x.mode==='heroic'?d?.heroic.rooms:d?.rooms)?.find(r=>r.room===x.room&&r.creatureId===x.creatureId);
    const actual=room(atlas)?.[x.stat],expected=room(current)?.[x.stat];
    if(expected!==undefined&&actual===expected)return {kind:'automatic-import',rule:'validated-dungeon-stats-v1',sourceHash,valueHash:witness(expected),identity:x,explanation:'A teljes kazamataséma és minden kapcsolat valid; az Atlas a megfelelő terem API-értékét tartalmazza.'};
  }
  const recommendation=entry.path.match(/^\/dungeons\/([^/]+)\/recommendedLevel$/);
  if(recommendation&&plan.validatedDungeons.includes(recommendation[1])){const a=content.dungeons.find(d=>d.id===recommendation[1])?.recommendedLevel,b=db.dungeons.find(d=>d.id===recommendation[1])?.recommendedLevel;if(a===b)return {kind:'automatic-import',rule:'validated-dungeon-recommendation-v3',sourceHash,valueHash:witness(a),explanation:'Az eg?sz aj?nlott szint egyezik a valid?lt kazamata aktu?lis API-?rt?k?vel.'};}
  const api=atPath(content,entry.path),atlasPath=entry.path.replace(/^\/stackables\//,'/economy/stackables/');
  let atlas=atPath(db,atlasPath);
  if(api!==undefined&&plan.resolved.some(p=>contains(p,entry.path))){
    if(api&&typeof api==='object'&&!Array.isArray(api)&&atlas)atlas=Object.fromEntries(Object.keys(api).map(k=>[k,atlas[k]]));
    if(equal(api,atlas))return {kind:'automatic-import',rule:'validated-record-match-v1',sourceHash,valueHash:witness(api),explanation:'Az ismert séma valid és az Atlas értéke igazoltan megegyezik a nyilvános API-val.'};
  }
  return null;
}

export function reconcileReview({previous={},changes=[],resourceChanges=[],plan,content,db,aliases={},initialReport={},sources=[],sourceHash,now}){
  const legacy=!previous.reviewLedger;
  const historic=new Map((initialReport.changes??[]).map(x=>[x.path,x]));
  const make=(raw,carried=false)=>{
    const initial=historic.get(raw.path),value=observed(content,raw.path,sources);
    const targetHash=raw.targetHash??witness(value);
    return {...raw,id:raw.id??sha256(raw.path+'\n'+targetHash),targetHash,identity:raw.identity??identity(raw.path,content),changeKind:raw.changeKind??initial?.kind,origin:raw.origin??(raw.path.startsWith('https:')?'legacy-inventory':raw.reason?.startsWith('Első megfigyelés')?'first-observation':'legacy-change'),firstSeenAt:raw.firstSeenAt??(initial?initialReport.checkedAt:null),lastSeenAt:raw.lastSeenAt??previous.checkedAt??now,status:raw.status??'open',carried};
  };
  const ledger=new Map((previous.reviewLedger??previous.review??[]).map(raw=>{const x=make(raw,true);return [x.id,x];}));
  const baselineIds=previous.reviewBaseline?.ids??[...ledger.keys()];
  const currentIds=new Set();
  function observe(raw){
    const value=observed(content,raw.path,sources),targetHash=witness(value);
    let id=sha256(raw.path+'\n'+targetHash);
    // A → B → A is valódi új változás; egy régi A-lezárás nem fedheti el a visszaváltást.
    if(ledger.get(id)?.status==='resolved'&&raw.origin==='current-change')id=sha256(raw.path+'\n'+targetHash+'\n'+now);
    // A tényleges új érték új esemény, a korábbi lezárás megmarad a történetben.
    if(!ledger.has(id))ledger.set(id,make({...raw,id,targetHash,firstSeenAt:now,origin:raw.origin??'current-change'},false));
    const item=ledger.get(id);item.lastSeenAt=now;
    if(raw.beforeHash)item.beforeHash=raw.beforeHash;
    currentIds.add(id);
  }
  for(const change of changes)if(!['/version','/tag'].includes(change.path))observe({path:change.path,changeKind:change.kind,reason:'Az aktuális API-összevetés változása',origin:change.kind==='added'&&previous.baseline?.startsWith('Részleges')?'first-observation':'current-change'});
  for(const issue of plan.review)observe(issue);
  for(const change of resourceChanges)observe({...change,path:change.url,reason:change.beforeHash?'Megváltozott kliensfájl hash':'Első forrásleltár; tartalmi változás nem bizonyított',origin:change.beforeHash?'current-change':'first-observation'});
  const closedNow=[];
  for(const item of ledger.values()){
    item.historyState=item.targetHash!==witness(observed(content,item.path,sources))?'historical-superseded':'current';
    if(item.status==='resolved'&&item.resolution&&item.classification)continue;
    item.system=reviewSystem(item.path);item.classification=classifyReview(item,{plan,content,db,aliases});item.title=reviewTitle(item,db);
    item.updateGroup=item.system+'@'+(item.firstSeenAt??'legacy');
    if(item.status==='resolved')continue;
    const proof=processingProof(item,{plan,content,db,aliases,sourceHash});
    if(proof){const historical=item.historyState==='historical-superseded';item.status='resolved';item.resolution={...proof,...historical?{kind:'documented-review',rule:'superseded-by-verified-current-import',supersedingProof:proof,explanation:'Történeti érték: az újabb érték tényleges, hash-sel és mezőegyezéssel igazolt importja felülírta. A korábbi értéket nem állítjuk újonnan importáltnak.'}:{},resolvedAt:now,gameVersion:content.version,targetHash:item.targetHash,currentValueHash:witness(observed(content,item.path,sources)),historicalSuperseded:historical};closedNow.push(item.id);}
  }
  const entries=[...ledger.values()],open=entries.filter(x=>x.status==='open'),resolved=entries.filter(x=>x.status==='resolved');
  const count=rows=>Object.fromEntries(Object.keys(classifications).map(k=>[k,rows.filter(x=>x.classification===k).length]));
  const baseline=entries.filter(x=>baselineIds.includes(x.id));
  const summary={
    baseline:{total:baselineIds.length,classified:count(baseline),resolved:baseline.filter(x=>x.status==='resolved').length,open:baseline.filter(x=>x.status==='open').length},
    open:open.length,classified:count(open),resolvedTotal:resolved.length,
    activity:{new:entries.filter(x=>!x.carried&&currentIds.has(x.id)).length,carried:open.filter(x=>x.carried).length,automatic:closedNow.filter(id=>ledger.get(id).resolution.kind==='automatic-import').length,documented:closedNow.filter(id=>ledger.get(id).resolution.kind==='documented-review').length,manual:open.filter(x=>['conflict','mechanism'].includes(x.classification)).length}
  };
  return {ledger:entries,open,summary,baseline:{ids:baselineIds,migratedAt:previous.reviewBaseline?.migratedAt??now},closedNow,legacy};
}

export function reviewGroups(entries){
  const systems=new Map();
  for(const item of entries){
    if(!systems.has(item.system))systems.set(item.system,new Map());
    const topics=systems.get(item.system),x=item.identity;
    const key=(x?`dungeon:${x.dungeonId}:${x.mode}`:item.path.startsWith('https:')?'client':item.title)+':'+item.classification+':'+(item.firstSeenAt??'legacy')+':'+(item.historyState??'current');
    if(!topics.has(key))topics.set(key,{title:x?item.title.split(' · ')[0]+' · '+(x.mode==='heroic'?'hősi':'normál')+' termek':item.title,classification:item.classification,firstSeenAt:item.firstSeenAt??null,historyState:item.historyState??'current',count:0,paths:[]});
    const topic=topics.get(key);topic.count++;topic.paths.push({path:item.path,title:item.title,status:item.status,reason:item.resolution?.explanation??classifications[item.classification],proof:item.resolution??null});
  }
  return [...systems].sort(([a],[b])=>a.localeCompare(b,'hu')).map(([name,topics])=>({name,count:[...topics.values()].reduce((n,t)=>n+t.count,0),topics:[...topics.values()]}));
}
