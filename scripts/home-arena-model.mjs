import {equal,sha256} from './atlas-sync-model.mjs';

export const systemPaths={
  homeLevel:'/onboarding/unlocks/city.home/level',pureLevel:'/onboarding/unlocks/arena.pure/level',banditLevel:'/onboarding/unlocks/arena.bandit/level',pvpNavLevel:'/onboarding/unlocks/nav.arena/level',
  homeRooms:'/features/homeRooms',homeThemes:'/features/homeThemes',teahouse:'/features/teahouse',banditArena:'/features/banditArena',banditTrophy:'/features/banditTrophy',teaEnergy:'/expedition/refill/amount'
};
const read=(root,p)=>p.slice(1).split('/').reduce((v,k)=>v?.[k],root);
export function apiSystemValues(content){
  const out={};
  for(const [key,p] of Object.entries(systemPaths)){
    const value=read(content,p);
    if(['homeLevel','pureLevel','banditLevel','pvpNavLevel','teaEnergy'].includes(key)){
      if(!Number.isInteger(value)||value<1||value>10000)throw Error('Hiányzó vagy hibás Otthon/Aréna API-érték: '+p);
    }else if(typeof value!=='boolean')throw Error('Hiányzó vagy hibás rendszerkapcsoló: '+p);
    out[key]=value;
  }
  return out;
}
export function validateHomeArena(data){
  if(data?.schema!==1||!data.api||!data.locale||!Array.isArray(data.sources)||!data.sources.length)throw Error('Hiányos Otthon/Aréna adatcsomag');
  if(!equal(Object.keys(data.api).sort(),Object.keys(systemPaths).sort()))throw Error('Hiányos rendszerértéklista');
  for(const source of data.sources)if(!source.url.startsWith('https://stonestorm.gg/')||!/^[a-f0-9]{64}$/.test(source.sha256))throw Error('Hiányos kliensforrás');
  const expected={home:['title','tiers','gives'],furniture:['names','shopLead'],rooms:['rooms','themes','rest','workshop','hall','garden'],arena:['pure','bandit','hub'],home2:['sets','album','level'],tea:['title','lead']};
  for(const [section,keys] of Object.entries(expected))for(const key of keys)if(!data.locale[section]?.[key])throw Error('Hiányos magyar szótár: '+section+'.'+key);
  if(!equal(Object.keys(data.locale.rooms.rooms).sort(),['garden','hall','rest','workshop'])||!equal(Object.keys(data.locale.home.tiers),['1','2','3','4','5','6','7','8']))throw Error('Új szoba- vagy házfokséma; kézi ellenőrzés szükséges');
  if(!equal(Object.keys(data.locale.rooms.themes.names).sort(),['blossom','dragongold','moonnight','winter']))throw Error('Új témaazonosító');
  if(!Object.entries(data.locale.furniture.names).every(([id,name])=>/^[a-z0-9_-]+$/.test(id)&&typeof name==='string'&&name.length>0&&name.length<=160&&!/[\u0000-\u001f]/.test(name)))throw Error('Érvénytelen bútor-névkatalógus');
  for(const value of Object.values(data.api))if(!['number','boolean'].includes(typeof value)||typeof value==='number'&&(!Number.isInteger(value)||value<1||value>10000))throw Error('Hibás központi rendszerérték');
  return data;
}
export function planHomeArena(content,db,overlay,provenance){
  if(!db.homeArena)return {accepted:[],review:[],resolved:[]};
  try{
    const values=apiSystemValues(content),previous=db.homeArena.api,changed=Object.keys(values).filter(k=>values[k]!==previous[k]);
    if(changed.length){overlay.homeArena={values,provenance:provenance('/onboarding/unlocks'),fieldPaths:changed.map(k=>systemPaths[k])};}
    return {accepted:changed.length?[{path:'/home-arena/api',kind:'changed',fieldChanges:changed.map(k=>({path:systemPaths[k],before:previous[k],after:values[k]}))}]:[],review:[],resolved:Object.values(systemPaths)};
  }catch(e){return {accepted:[],resolved:[],review:[{path:'/home-arena/api',reason:e.message}]};}
}
export function applyHomeArena(db,overlay,validateProvenance){
  if(!overlay.homeArena)return;
  if(!db.homeArena)throw Error('Hiányzik az Otthon/Aréna alapséma');
  const entry=overlay.homeArena;validateProvenance(entry.provenance);
  if(!equal(Object.keys(entry.values).sort(),Object.keys(systemPaths).sort()))throw Error('Ismeretlen rendszerérték-séma');
  const candidate=structuredClone(db.homeArena);candidate.api=entry.values;validateHomeArena(candidate);
  db.homeArena=candidate;db.homeArena.apiProvenance=entry.provenance;
}
export function compatibleClientData(previous,candidate){
  validateHomeArena(candidate);
  for(const role of ['game','home','homeParts','arenaPage','arenaNet','tea','sinkArt'])if(previous.sources.find(x=>x.role===role)?.sha256!==candidate.sources.find(x=>x.role===role)?.sha256)return {safe:false,reason:'Megváltozott '+role+' klienslogika; a működés felülvizsgálata szükséges'};
  // Új mechanikai szöveg nem válhat pusztán azonos JSON-séma miatt igazolt szabállyá.
  const a=structuredClone(previous.locale),b=structuredClone(candidate.locale);
  delete a.furniture.names;delete b.furniture.names;
  if(!equal(a,b))return {safe:false,reason:'Megváltozott magyar szabályszöveg vagy szótárszerkezet; szakmai ellenőrzés szükséges'};
  if(Object.keys(candidate.locale.furniture.names).some(id=>!/^[-a-z0-9_]+$/.test(id)))return {safe:false,reason:'Hibás bútorazonosító'};
  if(Object.keys(previous.locale.furniture.names).some(id=>!(id in candidate.locale.furniture.names)))return {safe:false,reason:'Hiányzó bútor; nem töröljük automatikusan'};
  return {safe:true,changed:!equal(previous.locale.furniture.names,candidate.locale.furniture.names)};
}
