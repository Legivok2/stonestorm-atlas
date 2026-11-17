import crypto from 'node:crypto';
import {staticModule,clientReferences} from './public-client-data.mjs';
export const sha256=v=>crypto.createHash('sha256').update(v).digest('hex');
export const origin='https://stonestorm.gg';
export const categoryNames={pets:'Kísérők',furniture:'Bútorok',home:'Otthon',rooms:'Szobák',themes:'Témák',arena:'Aréna',bandit:'Bandita Liga',trophies:'Trófeák',weapons:'Fegyverek',armor:'Páncélok',icons:'Tárgyikonok',mobs:'Ellenfelek',bosses:'Bossok',scenes:'Hátterek',portals:'Portálok',maps:'Térképek',research:'Kutatások',guild:'Épületek, szobák és céh',events:'Események',ui:'Jelvények és kezelőelemek',uikit:'Keretek és kezelőfelület',twitch:'Twitch-jutalmak'};
export function imageURL(value){
  if(typeof value!=='string'||value.length>1000||value.split(/[/?#]/).includes('..'))throw Error('Érvénytelen képcím');
  const u=new URL(value);if(u.origin!==origin||u.username||u.password||u.hash||!/^\/(?:art|assets)\/[A-Za-z0-9_./-]+\.(?:webp|png|jpe?g|gif|avif)$/i.test(u.pathname)||u.pathname.split('/').some(p=>p==='.'||p==='..')||value.includes('%'))throw Error('Csak nyilvános Stonestorm-képcím fogadható el');
  for(const [key,v] of u.searchParams)if(key!=='v'||!/^[a-zA-Z0-9_.-]{1,80}$/.test(v))throw Error('Hitelesítőadatot vagy ismeretlen paramétert tartalmazó cím');
  return u.href;
}
export function sourceURL(value){const u=new URL(value);if(u.origin!==origin||u.username||u.password||u.search||u.hash||!(u.pathname==='/'||/^\/assets\/[\w.-]+\.(?:js|json)$/.test(u.pathname)))throw Error('Nem engedélyezett nyilvános kliensforrás');return u.href;}
export function reference(url,source,extra={}){
  url=imageURL(url);const u=new URL(url),parts=u.pathname.split('/'),filename=parts.at(-1),category=/^\/art\//.test(u.pathname)?parts[2]:'assets';
  return {key:sha256(url),url,filename,category:category==='pet-art'?'pets':category,id:filename.replace(/\.[^.]+$/,''),sources:[source],...extra};
}
export function referencesFromModule(text,url){
  const result=[],sources=clientReferences(text,url);for(const m of text.matchAll(/["']((?:\.\/|assets\/)art-manifest-[\w-]+\.json)["']/g))sources.push(new URL(m[1],m[1].startsWith('assets/')?origin+'/':url).href);let parsed;
  try{parsed=url.endsWith('.json')?{exports:{default:JSON.parse(text)},values:{}}:staticModule(text);}catch{return {images:[],modules:sources,warnings:['A modul nem értelmezhető statikus literálokként: '+url]};}
  const objects=[parsed.exports.default,...Object.values(parsed.values)].filter(v=>v&&typeof v==='object'&&!Array.isArray(v));
  for(const object of objects){
    // Art-manifest category arrays. Pet URLs use the separate state.petArt map;
    // a logical pet name alone never proves a current public file URL.
    if(!/art-manifest-[\w-]+\.(?:js|json)$/.test(url))continue;
    for(const [category,names] of Object.entries(object))if(/^[a-zA-Z0-9_-]+$/.test(category)&&Array.isArray(names)&&!['video','pets'].includes(category))for(const name of names)if(typeof name==='string'&&/^[a-zA-Z0-9_-]+$/.test(name)){
      const variants=Object.entries(object.variants?.[category]?.[name]??{}).filter(([key,width])=>/^[a-zA-Z0-9_-]+$/.test(key)&&Number.isFinite(width)&&width>0&&width<=32000).map(([key,widthHint])=>({url:imageURL(`${origin}/art/${category}/${key}.webp`),widthHint}));
      result.push(reference(`${origin}/art/${category}/${name}.webp`,url,{discovery:'art-manifest',variants}));
    }
  }
  for(const m of text.matchAll(/["'`]((?:https:\/\/stonestorm\.gg)?\/(?:art|assets)\/[A-Za-z0-9_./-]+\.(?:webp|png|jpe?g|gif|avif)(?:\?v=[a-zA-Z0-9_.-]+)?)["'`]/g))try{result.push(reference(new URL(m[1],origin).href,url,{discovery:'explicit-client-reference'}));}catch{}
  return {images:result,modules:sources,warnings:[]};
}
export function importReferences(value){
  const raw=Array.isArray(value)?value:value?.images??value?.urls;
  if(!Array.isArray(raw)||raw.length>10000)throw Error('A fájl images/urls képcímlistát vagy címtömböt tartalmazzon, legfeljebb 10 000 elemmel.');
  const images=[],rejected=[];for(const r of raw)try{const record=reference(typeof r==='string'?r:r.url,'user-supplied-sanitized-reference-list',{discovery:'browser-export'});if(typeof r==='object'&&/^[a-f0-9]{64}$/.test(r.sha256??''))record.expectedSha256=r.sha256;images.push(record);}catch{rejected.push('Tiltott vagy nem képfájlra mutató cím kimaradt');}
  return {images,rejected};
}
export function targets(db){
  const out=[],add=(kind,rows,id='id',name='name')=>(rows??[]).forEach(x=>out.push({kind,id:String(x[id]),name:x[name]??x.nameHu??String(x[id])}));
  for(const [kind,key] of Object.entries({item:'items',set:'sets',pet:'pets',boss:'bosses',mob:'mobs',mount:'mounts',map:'maps',dungeon:'dungeons',research:'research'}))add(kind,db[key]);
  add('material',db.economy?.stackables);add('building',db.guild?.buildings,'kind','nameHu');
  const l=db.homeArena?.locale;
  for(const [kind,object] of [['furniture',l?.furniture?.names],['theme',l?.rooms?.themes?.names],['trophy',l?.banditTrophy?.names]])for(const [id,name] of Object.entries(object??{}))out.push({kind,id,name});
  for(const [id,row] of Object.entries(l?.rooms?.rooms??{}))out.push({kind:'room',id,name:row.name});
  for(const [id,row] of Object.entries(l?.home?.tiers??{}))out.push({kind:'home',id:'tier-'+id,name:row.name});
  out.push({kind:'arena',id:'pure',name:'Tiszta aréna'},{kind:'arena',id:'bandit',name:'Bandita Liga'},{kind:'background',id:'atlas-hero',name:'Atlas fejléc / háttér'},{kind:'background',id:'atlas-overview',name:'Atlas áttekintő háttér'},{kind:'collection',id:'reviewed-art',name:'Jóváhagyott képek · hozzárendelés később'});return out;
}
export function suggestions(candidate,db,catalog){
  const rows=[],name=candidate.id;
  const suggest=(target,reason,form)=>{if(target&&!rows.some(x=>x.kind===target.kind&&x.id===target.id&&x.form===form))rows.push({...target,...form?{form}:{},reason,status:'suggestion'});};
  const all=targets(db);
  for(const item of db.items??[])if((item.art??item.id)===name&&['icons','weapons','armor'].includes(candidate.category))suggest(all.find(t=>t.kind==='item'&&t.id===item.id),'Pontos art mező / tárgyazonosító; vizuális jóváhagyás szükséges');
  for(const t of all)if(t.id===name||t.kind==='furniture'&&'furn_'+t.id===name)suggest(t,'Pontos nyilvános azonosító-egyezés; nem bizonyított képkapcsolat');
  const pet=name.match(/^(pet_[a-z0-9_]+)_([1-5])(?:_sprite)?$/);if(pet)suggest(all.find(t=>t.kind==='pet'&&t.id===pet[1]),'Logikai faj-/formakulcs; a jelenlegi petArt fájljegyzék külön bizonyíték',Number(pet[2]));
  const room=name.match(/^(?:room|home)_(rest|workshop|hall|garden)(?:_\d+)?$/);if(room)suggest(all.find(t=>t.kind==='room'&&t.id===room[1]),'Fájlnévi szobakulcs-javaslat. A grafikai sorszám nem fejlesztési szint.');
  const theme=name.match(/^theme_([a-z0-9]+)_(?:house|manor)$/);if(theme)suggest(all.find(t=>t.kind==='theme'&&t.id===theme[1]),'Fájlnévi témaazonosító-javaslat; vizuálisan ellenőrizendő.');
  const trophy=name.match(/^bandit_trophy_([a-z0-9]+)$/);if(trophy)suggest(all.find(t=>t.kind==='trophy'&&t.id===trophy[1]),'A Bandita-trófea nyilvános névkulcsa; nem automatikus igazolás.');
  if(name==='backdrop_bandithideout')suggest(all.find(t=>t.kind==='arena'&&t.id==='bandit'),'Fájlnév alapján felmerülő háttérjavaslat; kézzel ellenőrizendő.');
  for(const old of catalog.entries??[])if(candidate.sha256&&old.sha256===candidate.sha256)for(const r of old.relations??[])suggest(all.find(t=>t.kind===r.kind&&t.id===r.id),'Egyező SHA-256 a meglévő katalógussal; a korábbi kapcsolat megmarad');
  return rows.slice(0,12);
}
export function compareReferences(images,catalog,oldManifest){
  const byURL=new Map((catalog.entries??[]).map(e=>[e.sourceUrl,e])),byPath=new Map((catalog.entries??[]).filter(e=>e.sourceUrl).map(e=>[new URL(e.sourceUrl).pathname,e])),oldIds=new Set(Object.entries(oldManifest).flatMap(([c,v])=>Array.isArray(v)?v.map(n=>c+'/'+n):[]));
  for(const [category,groups] of Object.entries(oldManifest.variants??{}))for(const values of Object.values(groups??{}))for(const name of Object.keys(values??{}))oldIds.add(category+'/'+name);
  const refs=new Map();for(const image of images){const key=image.expectedSha256?sha256(image.url+'\n'+image.expectedSha256):image.key,found=refs.get(key);if(found)found.sources=[...new Set([...found.sources,...image.sources])];else refs.set(key,{...image,key});}
  return [...refs.values()].map(r=>{const old=byURL.get(r.url),samePath=byPath.get(new URL(r.url).pathname);
    const changed=old&&r.expectedSha256&&r.expectedSha256!==old.sha256;
    return {...r,change:changed?'changed':old?'known':samePath?'changed-reference':oldIds.has(r.category+'/'+r.id)?'legacy-missing':'new',existingIds:old?[old.id]:samePath?[samePath.id]:[],status:old&&!changed?'known':'queued',review:{status:'pending',revision:0,rights:{status:'unverified',evidence:''}}};});
}
export function validateReview(input,records,candidate){
  if(!['approved','later','rejected','pending'].includes(input.status))throw Error('Ismeretlen jóváhagyási állapot');
  const rights=input.rights?.status==='confirmed'?{status:'confirmed',evidence:String(input.rights.evidence??'').trim().slice(0,1000)}:{status:'unverified',evidence:''};if(rights.status==='confirmed'&&rights.evidence.length<8)throw Error('Az igazolt felhasználási joghoz add meg az engedély vagy licenc forrását.');
  let target=null;if(input.target){const t=records.find(t=>t.kind===input.target.kind&&t.id===input.target.id);if(!t)throw Error('Ismeretlen Atlas-rekord');if(!['primary','gallery'].includes(input.target.usage??'primary'))throw Error('Ismeretlen képszerep');target={kind:t.kind,id:t.id,usage:input.target.usage??'primary'};if(t.kind==='pet'){if(!Number.isInteger(input.target.form)||input.target.form<1||input.target.form>5)throw Error('Válaszd ki a kísérőformát (1–5).');target.form=input.target.form;}}
  if(target?.kind==='collection'&&target.usage!=='gallery')throw Error('A hozzárendelésre váró képtári kép csak galériakép lehet; nem írhat felül elsődleges rekordképet.');
  if(input.status==='approved'&&(!target||!candidate.sha256||!['downloaded','duplicate'].includes(candidate.status)))throw Error('Válassz konkrét célrekordot, vagy a „Képtár – hozzárendelés később” lehetőséget. Csak ellenőrzött, letöltött kép hagyható jóvá.');
  return {status:input.status,target,rights,note:String(input.note??'').slice(0,1000),reviewedAt:new Date().toISOString(),revision:(candidate.review?.revision??0)+1};
}
export function mappingExport(state){return {schema:2,kind:'atlas-image-mappings',baselineCatalogSha256:state.baseline.catalogSha256,entries:state.candidates.filter(c=>c.review?.status!=='pending').map(c=>({key:c.key,url:c.url,sha256:c.sha256??null,...c.review}))};}
export function report(state){const candidates=state.candidates.filter(c=>!['known','legacy-missing'].includes(c.change)),downloaded=candidates.filter(c=>['downloaded','duplicate'].includes(c.status));return {previousImages:state.baseline.available,previousUniqueContent:state.baseline.uniqueContent,previousMissing:state.baseline.missing,newReferences:candidates.filter(c=>c.change==='new').length,changedReferences:candidates.filter(c=>c.change!=='new').length,downloaded:downloaded.length,uniqueNewFiles:candidates.filter(c=>c.status==='downloaded').length,duplicates:candidates.filter(c=>c.status==='duplicate').length,unavailable:candidates.filter(c=>['failed','invalid','blocked'].includes(c.status)).length,queued:candidates.filter(c=>c.status==='queued').length,automaticSuggestions:candidates.filter(c=>c.suggestions?.length).length,automaticallyApproved:0,pendingApproval:candidates.filter(c=>!['approved','rejected'].includes(c.review?.status)).length,approved:candidates.filter(c=>c.review?.status==='approved').length,publishable:candidates.filter(c=>c.review?.status==='approved'&&c.review.rights.status==='confirmed'&&['downloaded','duplicate'].includes(c.status)).length};}
