import {equal,sha256} from './atlas-sync-model.mjs';

export const roomStats=['maxHp','atkMin','atkMax','def','harcero','xp','nyang'];
const finite=v=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=1e12;
const dungeonKeys=['id','keyId','minLevel','maxLevel','keyCoins','keysPerDay','firstClearCoins','minFreeSlots','heroic','trophies','potionCap','runPay','deeper','recommendedLevel','rooms'];
const roomKeys=['room','creatureId','role','level','maxHp','atkMin','atkMax','def','harcero','xp','nyang','item','tags','share'];
export function dungeonRecord(row){return Object.fromEntries(Object.entries(row).filter(([k])=>!['name','description','provenance'].includes(k)));}
export function dungeonStructure(row){
  const copy=structuredClone(dungeonRecord(row));
  for(const container of [copy,copy.heroic])if(Array.isArray(container?.rooms))container.rooms=container.rooms.map(room=>Object.fromEntries(Object.entries(room).filter(([k])=>!roomStats.includes(k)))).sort((a,b)=>a.room-b.room);
  return copy;
}
export function validateDungeon(candidate,previous,db){
  if(!previous||candidate.id!==previous.id)throw Error('Új vagy ismeretlen kazamata');
  if(Object.keys(candidate).some(k=>!dungeonKeys.includes(k))||!equal(Object.keys(candidate).sort(),Object.keys(dungeonRecord(previous)).sort()))throw Error('Ismeretlen vagy hiányos kazamataszerkezet');
  if(!candidate.heroic||!equal(Object.keys(candidate.heroic).sort(),['minLevel','keyCost','firstClearCoins','rooms'].sort()))throw Error('Ismeretlen hősi szabály');
  if(!db.economy.stackables.some(x=>x.id===candidate.keyId&&x.kind==='key'))throw Error('Hiányzó kazamatakulcs-kapcsolat');
  if(!equal(dungeonStructure(candidate),dungeonStructure(previous)))throw Error('Megváltozott kazamatamechanika vagy teremkapcsolat');
  if(!['minLevel','maxLevel','keyCoins','keysPerDay','firstClearCoins','minFreeSlots','potionCap','recommendedLevel'].every(k=>finite(candidate[k]))||candidate.minLevel<1||candidate.maxLevel<candidate.minLevel||!['minLevel','keyCost','firstClearCoins'].every(k=>finite(candidate.heroic[k])))throw Error('Érvénytelen kazamataszabály');
  const normalCreatures=new Set(previous.rooms.map(x=>x.creatureId));
  for(const mode of ['normal','heroic']){
    const rooms=mode==='normal'?candidate.rooms:candidate.heroic.rooms;
    const oldRooms=mode==='normal'?previous.rooms:previous.heroic.rooms;
    if(!Array.isArray(rooms)||rooms.length!==oldRooms.length||!rooms.length)throw Error('Hiányzó vagy új terem');
    const seen=new Set();
    for(const room of rooms){
      const old=oldRooms.find(x=>x.room===room.room);
      if(!old||!Number.isSafeInteger(room.room)||room.room<1||seen.has(room.room)||room.creatureId!==old.creatureId||!normalCreatures.has(room.creatureId))throw Error('Hibás vagy duplikált teremazonosító / lénykapcsolat');
      seen.add(room.room);
      if(Object.keys(room).some(k=>!roomKeys.includes(k))||!equal(Object.keys(room).sort(),Object.keys(old).sort()))throw Error('Ismeretlen vagy hiányos teremmező');
      if(!['regular','miniboss','boss'].includes(room.role)||!finite(room.level)||room.level<1||typeof room.item!=='boolean'||typeof room.creatureId!=='string'||!/^d_[a-z0-9_]+$/.test(room.creatureId)||('tags' in room&&(!Array.isArray(room.tags)||!room.tags.every(t=>typeof t==='string')))||('share' in room&&(typeof room.share!=='number'||!Number.isFinite(room.share)||room.share<0||room.share>1)))throw Error('Érvénytelen teremszerep vagy metaadat');
      if(!roomStats.every(k=>finite(room[k]))||room.maxHp===0||room.harcero===0||room.atkMin>room.atkMax)throw Error('Érvénytelen teremstatisztika');
    }
  }
  return candidate;
}
export function dungeonStatChanges(candidate,previous){
  return ['normal','heroic'].flatMap(mode=>{
    const rows=mode==='normal'?candidate.rooms:candidate.heroic.rooms,old=mode==='normal'?previous.rooms:previous.heroic.rooms;
    return rows.flatMap((room,index)=>roomStats.filter(key=>room[key]!==old.find(x=>x.room===room.room)[key]).map(key=>({
      path:`/dungeons/${candidate.id}/${mode==='heroic'?'heroic/':''}rooms/${index}/${key}`,
      room:room.room,creatureId:room.creatureId,mode,stat:key,before:old.find(x=>x.room===room.room)[key],after:room[key]
    })));
  });
}
export function planDungeons(content,db,overlay,provenance){
  const accepted=[],review=[],validated=[];
  const savedEntries=structuredClone(overlay.dungeons??{});
  if(!Array.isArray(content.dungeons)){return {accepted,validated,review:[{path:'/dungeons',reason:'Hiányzó kazamatalista; a korábbi adatok megmaradnak'}]};}
  const seen=new Set();
  for(const raw of content.dungeons){
    const previous=db.dungeons.find(x=>x.id===raw.id);
    try{
      if(seen.has(raw.id))throw Error('Duplikált kazamataazonosító');seen.add(raw.id);
      validateDungeon(raw,previous,db);
      if(!content.stackables?.some(x=>x.id===raw.keyId&&x.kind==='key'))throw Error('A nyilvános konfigurációból hiányzik a kazamatakulcs');
      validated.push(raw.id);
      const fields=dungeonStatChanges(raw,previous);if(!fields.length)continue;
      overlay.dungeons??={};overlay.dungeons[raw.id]={record:raw,structureHash:sha256(dungeonStructure(previous)),provenance:{...provenance('/dungeons/'+raw.id),baseSource:previous.provenance?.baseSource??previous.provenance?.source,scope:'Ismert normál/hősi teremstatisztikák nyilvános API-ból; a szerkezet és a kapcsolatok a kézi alappal egyeznek'}};
      accepted.push({path:'/dungeons/'+raw.id,kind:'changed',fieldChanges:fields});
    }catch(e){review.push({path:'/dungeons/'+raw.id,reason:e.message});}
  }
  for(const previous of db.dungeons)if(!seen.has(previous.id))review.push({path:'/dungeons/'+previous.id,reason:'Hiányzó kazamata; a korábbi termek megmaradnak'});
  // Egy duplikált rekord az egész kazamata importját kizárja, sorrendtől függetlenül.
  for(const item of review){const key=item.path.split('/')[2];const at=accepted.findIndex(x=>x.path===item.path);if(at>=0){accepted.splice(at,1);if(savedEntries[key])overlay.dungeons[key]=savedEntries[key];else delete overlay.dungeons[key];}const v=validated.indexOf(key);if(v>=0)validated.splice(v,1);}
  return {accepted,review,validated};
}
export function applyDungeons(db,overlay,validateProvenance){
  for(const [key,entry] of Object.entries(overlay.dungeons??{})){
    const previous=db.dungeons.find(x=>x.id===key);
    if(key!==entry.record.id||entry.structureHash!==sha256(dungeonStructure(previous??{})))throw Error('Eltérő kazamata-importazonosító vagy alapstruktúra');
    validateProvenance(entry.provenance);validateDungeon(entry.record,previous,db);
    // A szövegek és nevek a kézi, magyar forrásból származnak.
    Object.assign(previous,structuredClone(entry.record),{provenance:structuredClone(entry.provenance)});
  }
}
