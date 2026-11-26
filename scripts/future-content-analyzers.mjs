import {diffJSON} from './atlas-sync-model.mjs';

export const categoryNames={maxLevel:'Szintplafon',xp:'XP és fejlődés',progression:'Fejlődési referenciák',unlocks:'Szintkövetelmények és feloldások',maps:'Pályák',locations:'Helyszínek és teleportok',mobs:'Ellenfelek',bosses:'Bossok',items:'Felszerelések',families:'Szettcsaládok',sets:'Szettszabályok',tiers:'Tierek',dungeons:'Kazamaták',difficulties:'Nehézségi fokozatok',rooms:'Kazamatatermek',keys:'Kazamatakulcsok',pets:'Kísérők',mounts:'Hátasok',classes:'Kasztok',skills:'Képességek',forge:'Fejlesztés és kovácsolás',events:'Események',modes:'Játékmódok',features:'Funkciókapcsolók',modules:'Kliensmodulok',translations:'Fordítások és menüpontok',graphics:'Grafikák',official:'Hivatalos hírek',unknown:'Ismeretlen rendszerek'};
export const API='https://stonestorm.gg/api/content';
const get=(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o);
const pointer=p=>'/'+p.replaceAll('.','/');
const escKey=k=>String(k).replaceAll('~','~0').replaceAll('/','~1');
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const entries=v=>Array.isArray(v)?v.map((x,i)=>[String(x?.id??x?.map??i),x]):Object.entries(v??{});
const tableLength=v=>Array.isArray(v)?v.length:object(v)?Math.max(0,...Object.values(v).filter(Array.isArray).map(x=>x.length)):0;
export function validateWatcherContent(c){
  if(!object(c)||typeof c.version!=='string'||!c.version||!Number.isSafeInteger(c.limits?.maxLevel)||c.limits.maxLevel<1||!object(c.spine)||!Array.isArray(c.spine.xpTable)||!c.spine.xpTable.length||!c.spine.xpTable.every(x=>typeof x==='number'&&Number.isFinite(x)&&x>=0))throw Error('Hiányos Future Content Watcher API-válasz');
  for(const key of ['maps','items','mobs','bosses','dungeons','mounts','classes','stackables']){
    if(!Array.isArray(c[key])||c[key].some(x=>!object(x)||typeof x.id!=='string')||new Set(c[key].map(x=>x.id)).size!==c[key].length)throw Error('Hiányos vagy duplikált tartalomlista: '+key);
  }
  if(!c.maps.length||!c.items.length||!object(c.features)||Object.values(c.features).some(v=>typeof v!=='boolean')||!Array.isArray(c.pets?.types)||!object(c.families)||!object(c.lean?.skills))throw Error('Hiányos tartalomág; az előzmények megmaradnak');
  if(c.items.some(x=>!Number.isSafeInteger(x.level)||x.level<1||!Number.isSafeInteger(x.tier)||x.tier<0)||c.maps.some(x=>!Number.isSafeInteger(x.index)||x.index<1||!Number.isSafeInteger(x.minLevel)||!Number.isSafeInteger(x.maxLevel)))throw Error('Hiányos szintkövetelmény-adatok');
  for(const d of c.dungeons){if(!Array.isArray(d.rooms)||!d.rooms.length)throw Error('Hiányos kazamataterem-lista');for(const [k,v] of Object.entries(d))if(k==='heroic'&&(!object(v)||!Array.isArray(v.rooms)||!v.rooms.length))throw Error('Hiányos hősi teremlista');}
  return c;
}
function context(content,{labels={},baselineMax=content.limits.maxLevel}={}){
  const candidates=[],handled=new Set();
  const add=(category,key,value,path,extra={})=>{if(value===undefined)return;handled.add(path);if(extra.selectorPath)handled.add(extra.selectorPath);candidates.push({category,key:String(key),value,source:API,sourcePath:path,scope:'api',nameHu:extra.nameHu??categoryNames[category],status:'prepared',statusReason:'Nyilvános konfiguráció; a játékbeli elérhetőség külön bizonyítékot igényel.',potential:false,importance:'low',...extra});};
  const name=(category,row)=>row?.nameHu??labels[category+':'+row?.id]??row?.name??(category==='maps'&&/^m\d+$/.test(row?.id)?row.id.toUpperCase()+' pálya':categoryNames[category]);
  const entity=(category,rows,path)=>{for(const [id,row] of entries(rows))add(category,id,row,path+'/'+(Array.isArray(rows)?rows.indexOf(row):escKey(id)),{selectorPath:path+'/'+escKey(id),nameHu:name(category,row),entityId:id,potential:['items','families'].includes(category)&&Number(row.level??row.itemLevel)>content.limits.maxLevel,importance:['maps','bosses','dungeons','families','pets','mounts','classes'].includes(category)?'high':'medium'});};
  return {content,candidates,handled,add,name,entity,baselineMax};
}
export function analyzeProgression(ctx){
  const {content:c,add,baselineMax}=ctx;
  add('maxLevel','limits.maxLevel',c.limits.maxLevel,'/limits/maxLevel',{nameHu:'A konfiguráció maximális játékosszintje',importance:'high',statusReason:'Kifejezett limits.maxLevel beállítás. Szörny- vagy tárgyszintből nem következtetünk rá.'});
  add('xp','spine.xpTable',c.spine.xpTable,'/spine/xpTable',{nameHu:'XP-táblázat',potential:c.spine.xpTable.length>baselineMax,importance:'high',statusReason:'Az XP-tábla létezése és hossza igazolt; a pontos szintindexelést nem találjuk ki.'});
  for(const p of ['spine.refHarcero','playRef','harcero.rules.ref.dexShare','spine.pace','spine.eq.xpShareOfU','spine.harcero.refHeroDex']){const v=get(c,p);add('progression',p,v,pointer(p),{nameHu:p==='playRef'?'Kasztok fejlődési referenciái':'Fejlődési referenciatábla',status:'uncertain',potential:tableLength(v)>baselineMax+(p.endsWith('dexShare')?1:0),importance:'medium',statusReason:'Referenciadat; hosszabb táblázat sem igazolja önmagában a szintplafon emelését.'});}
  for(const [key,value] of entries(c.onboarding?.unlocks))add('unlocks',key,value,'/onboarding/unlocks/'+escKey(key),{nameHu:'Szintalapú funkciófeloldás',potential:Number(value.level)>c.limits.maxLevel,importance:'medium'});
}
export function analyzeWorld(ctx){
  const {content:c,entity,add,name}=ctx;entity('maps',c.maps,'/maps');entity('mobs',c.mobs,'/mobs');entity('bosses',c.bosses,'/bosses');
  for(const [id,row] of entries(c.spine.mapBands))add('maps','band:'+id,row,'/spine/mapBands/'+c.spine.mapBands.indexOf(row),{nameHu:'Pályák szinttartománya',importance:'medium',potential:Number(row.from)>c.limits.maxLevel});
  for(const m of c.maps)for(const key of ['spots','locations','teleports','portals'])for(const [id,row] of entries(m[key]))add('locations',m.id+':'+key+':'+id,row,'/maps/'+c.maps.indexOf(m)+'/'+key+'/'+(Array.isArray(m[key])?m[key].indexOf(row):escKey(id)),{nameHu:name('maps',m)+' · helyszín',entityId:id,parentId:m.id,importance:'medium'});
}
export function analyzeEquipment(ctx){
  const {content:c,entity,add}=ctx;entity('items',c.items,'/items');entity('families',c.families.families??[], '/families/families');
  if(!Array.isArray(c.families.families))entity('families',Object.fromEntries(Object.entries(c.families).filter(([k])=>k!=='rules')),'/families');
  for(const [id,row] of entries(c.spine.sets))add('sets',id,row,'/spine/sets/'+escKey(id),{nameHu:'Szettcsalád bónuszszabályai',entityId:id,importance:'high',potential:Number(row.familyLevel)>c.limits.maxLevel});
  add('progression','spine.familyLevels',c.spine.familyLevels,'/spine/familyLevels',{nameHu:'Szettcsaládok szintkövetelményei',potential:c.spine.familyLevels?.some(x=>x>c.limits.maxLevel),importance:'medium'});
  add('tiers','spine.tiers',c.spine.tiers,'/spine/tiers',{nameHu:'Felszerelési tierek',importance:'high'});
}
export function analyzeDungeons(ctx){
  const {content:c,entity,add,name}=ctx;entity('dungeons',c.dungeons,'/dungeons');for(const [index,row] of c.stackables.entries())if(row.kind==='key')add('keys',row.id,row,'/stackables/'+index,{entityId:row.id,nameHu:row.nameHu??'Kazamatakulcs',importance:'medium',selectorPath:'/stackables/'+row.id});
  for(const d of c.dungeons){
    const modes=[['normal',{rooms:d.rooms,minLevel:d.minLevel,keyId:d.keyId} ],...Object.entries(d).filter(([,v])=>object(v)&&Array.isArray(v.rooms))];
    for(const [mode,data] of modes){const base='/dungeons/'+c.dungeons.indexOf(d)+(mode==='normal'?'':'/'+escKey(mode));add('difficulties',d.id+':'+mode,{...data,rooms:data.rooms.map(x=>({room:x.room,creatureId:x.creatureId}))},base,{nameHu:name('dungeons',d)+' · '+({normal:'normál',heroic:'hősi'}[mode]??'új nehézségi fokozat'),parentId:d.id,importance:'medium',potential:mode!=='normal'&&mode!=='heroic'});
      for(const room of data.rooms)add('rooms',d.id+':'+mode+':'+room.room,room,base+'/rooms/'+data.rooms.indexOf(room),{nameHu:name('dungeons',d)+' · '+room.room+'. terem',parentId:d.id,importance:'low',statusReason:'Kazamataellenfél adata. A lény szintje nem a játékos szintplafonja.'});
    }
  }
}
export function analyzeSystems(ctx){
  const {content:c,entity,add}=ctx;entity('pets',c.pets.types,'/pets/types');entity('mounts',c.mounts,'/mounts');entity('classes',c.classes,'/classes');
  for(const [id,row] of Object.entries(c.lean.skills))for(const path of row.availablePaths??[])add('skills',path.id,path,'/lean/skills/'+escKey(id)+'/availablePaths/'+row.availablePaths.indexOf(path),{nameHu:'Kasztképesség és fejlődési út',entityId:path.id,parentId:id,importance:'high'});
  for(const key of ['forge','bonus','polish','stones','skillPaths'])add('forge',key,c[key],'/'+key,{nameHu:{forge:'Kovácsolás',bonus:'Tárgybónuszok',polish:'Polírozás',stones:'Kőfejlesztés',skillPaths:'Képességfejlesztés'}[key],importance:'medium'});
  for(const [key,value] of Object.entries(c.features))add('features',key,value,'/features/'+escKey(key),{nameHu:({runasorV2:'Runasor V2',fishCoinRewards:'Horgászati érmejutalmak',premiumShop:'Prémiumbolt',webSubscription:'Webes előfizetés',musicStream:'Zenei közvetítés',stormRank:'Viharrang',partyCode:'Csapatkód',patron:'Támogatói rendszer',moonCard:'Holdkártya',rainSack:'Esőzsák',winbackMail:'Visszatérési levél',exitCard:'Kilépési kártya',coinMoney:'Érmés pénzrendszer',bossReact:'Bossreakciók',storeRestore:'Bolti vásárlás visszaállítása'})[key]??'Funkciókapcsoló',importance:'medium',potential:!value,statusReason:value?'Bekapcsolt nyilvános kapcsoló; ez még nem igazolja a teljes funkció játékbeli elérhetőségét.':'Kikapcsolt nyilvános kapcsoló. Nincs bizonyíték a tervezett aktiválására.'});
  for(const [id,row] of entries(c.lean.events??c.events))add('events',id,row,'/'+(c.events?'events':'lean/events')+'/'+escKey(id),{nameHu:'Eseménybeállítás',importance:'high'});
  for(const key of ['playScenes','runThemes','expedition','patrol','idle'])add('modes',key,c[key],'/'+key,{nameHu:{playScenes:'Kalandjelenetek',runThemes:'Portyatémák',expedition:'Expedíciók',patrol:'Őrjárat',idle:'Háttérvadászat'}[key],importance:'medium'});
}
export function analyzeUnknown(ctx,previousContent){
  const {content:c,add,handled}=ctx;
  const coveredRoots=new Set([...handled].map(p=>p.split('/')[1]));
  for(const [key,value] of Object.entries(c))if(!['version','tag'].includes(key)&&!coveredRoots.has(key))add('unknown','root:'+key,value,'/'+escKey(key),{nameHu:'További nyilvános rendszerbeállítás',status:'uncertain',importance:'medium'});
  if(previousContent)for(const change of diffJSON(previousContent,c)){
    if(change.kind!=='added'||handled.has(change.path)||/\/(?:\d+)$/.test(change.path)||change.path==='/version'||change.path==='/tag')continue;
    // Known entities report their own new IDs; new nested mechanics remain visible.
    if(ctx.candidates.some(x=>x.sourcePath===change.path))continue;
    add('unknown',change.path,change.after,change.path,{nameHu:'Új nyilvános adatmező vagy szabály',status:'uncertain',potential:true,importance:object(change.after)||Array.isArray(change.after)?'medium':'low'});
  }
}
export function analyzeContent(content,options={}){
  validateWatcherContent(content);const ctx=context(content,options);
  for(const analyze of [analyzeProgression,analyzeWorld,analyzeEquipment,analyzeDungeons,analyzeSystems])analyze(ctx);
  analyzeUnknown(ctx,options.previousContent);
  const itemLevels=content.items.map(x=>x.level).filter(Number.isFinite),tiers=[...(content.spine.tiers??[]).map(x=>x.max),...content.items.map(x=>x.tier)].filter(Number.isFinite);
  return {candidates:ctx.candidates,summary:{maxLevel:content.limits.maxLevel,equipmentMaxLevel:Math.max(0,...itemLevels),xpEntries:content.spine.xpTable.length,mapCount:content.maps.length,dungeonCount:content.dungeons.length,maxMapIndex:Math.max(0,...content.maps.map(x=>x.index).filter(Number.isFinite)),maxTier:Math.max(0,...tiers),referenceEntries:tableLength(content.spine.refHarcero),baselineMaxLevel:ctx.baselineMax}};
}
