import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';
import {sha256,origin,reference,sourceURL,referencesFromModule,importReferences,compareReferences,suggestions,targets,validateReview,mappingExport,report} from './image-collector-model.mjs';
export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const staging='stonestorm_image_tools/staging';
const read=(root,p,fallback)=>fs.existsSync(path.join(root,p))?JSON.parse(fs.readFileSync(path.join(root,p),'utf8')):fallback;
export function safeFile(root,relative){if(typeof relative!=='string'||relative.includes('\\')||relative.split('/').some(p=>p==='..'||p==='')||path.isAbsolute(relative)||path.win32.isAbsolute(relative))throw Error('Nem biztonságos fájlútvonal');const p=path.resolve(root,relative);if(!p.startsWith(path.resolve(root)+path.sep))throw Error('Külső fájlútvonal');let parent=p;while(!fs.existsSync(parent))parent=path.dirname(parent);const resolved=fs.realpathSync(parent),base=fs.realpathSync(root);if(resolved!==base&&!resolved.startsWith(base+path.sep))throw Error('Külső szimbolikus link');return p;}
export function writeJSON(root,relative,value){const p=safeFile(root,relative);fs.mkdirSync(path.dirname(p),{recursive:true});const temp=p+'.'+process.pid+'.tmp';fs.writeFileSync(temp,JSON.stringify(value,null,2)+'\n');fs.renameSync(temp,p);}
function acquireLock(file){
 for(let attempt=0;attempt<2;attempt++)try{const fd=fs.openSync(file,'wx');fs.writeFileSync(fd,String(process.pid));return ()=>{fs.closeSync(fd);fs.unlinkSync(file);};}catch(error){
  if(error.code!=='EEXIST')throw error;const pid=Number(fs.readFileSync(file,'utf8'));let stale=false;if(Number.isInteger(pid)&&pid>0)try{process.kill(pid,0);}catch(e){stale=e.code==='ESRCH';}else stale=Date.now()-fs.statSync(file).mtimeMs>30000;
  if(!stale)throw Error('Már fut egy gyűjtési vagy mentési művelet.');fs.unlinkSync(file);
 }
 throw Error('A helyi zárolás nem állítható helyre.');
}
export function loadState(root=ROOT){
 const prior=read(root,staging+'/state.json');if(prior)return prior;
 const catalog=read(root,'data/image-catalog.json'),audit=read(root,'data/image-audit.json',{missing:[]});if(!catalog)throw Error('Hiányzó eredeti képkatalógus');
 return {schema:2,baseline:{catalogSha256:sha256(fs.readFileSync(path.join(root,'data/image-catalog.json'))),available:catalog.entries.length,uniqueContent:catalog.stats.uniqueContent,missing:audit.missing?.length??0},candidates:[],discovery:{sources:[],warnings:[],entrypointConfirmed:false},downloadBlock:null,revision:0};
}
export function mutate(root,fn){
 const folder=path.join(root,staging);fs.mkdirSync(folder,{recursive:true});const release=acquireLock(path.join(folder,'.state-lock'));
 try{const state=loadState(root);fn(state);state.revision++;writeJSON(root,staging+'/state.json',state);writeJSON(root,staging+'/report.json',report(state));return state;}finally{release();}
}
const log=(root,entry)=>{fs.mkdirSync(path.join(root,staging),{recursive:true});fs.appendFileSync(path.join(root,staging,'events.jsonl'),JSON.stringify({at:new Date().toISOString(),...entry})+'\n');};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
export async function boundedFetch(url,{fetcher=fetch,maxBytes=12*1024*1024}={}){
 const r=await fetcher(url,{redirect:'error',credentials:'omit',headers:{'User-Agent':'Stonestorm-Atlas-Image-Collector/2.0'},signal:AbortSignal.timeout(25000)});
 if(!r.ok){const e=Error('HTTP '+r.status+' – '+url);e.status=r.status;e.retryAfter=r.headers.get('retry-after');throw e;}
 if(Number(r.headers.get('content-length'))>maxBytes)throw Error('A fájl meghaladja a méretkorlátot');const chunks=[];let bytes=0;
 for await(const part of r.body){bytes+=part.length;if(bytes>maxBytes)throw Error('A fájl meghaladja a méretkorlátot');chunks.push(part);}return {bytes:Buffer.concat(chunks),etag:r.headers.get('etag'),lastModified:r.headers.get('last-modified'),contentType:r.headers.get('content-type')};
}
function jobLock(root){const p=path.join(root,staging,'.job-lock');fs.mkdirSync(path.dirname(p),{recursive:true});return acquireLock(p);}
export function catalogInputs(root){return {catalog:read(root,'data/image-catalog.json'),manifest:read(root,'stonestorm_image_tools/manifest.json'),db:read(root,'data/atlas.json')};}
export async function discover({root=ROOT,fetcher=fetch,from=null,sleep=pause,maxRequests=18}={}){
 const release=jobLock(root);try{
 const {catalog,manifest,db}=catalogInputs(root),images=[],sources=[],warnings=[],queue=[],seen=new Set();let entrypointConfirmed=false,requests=0,discoveryBlocked=false;
 const future=read(root,'data/future-image-references.json');
 if(future?.kind==='atlas-future-image-references'){
   for(const image of future.images??[])try{images.push(reference(image.url,'future-content-watcher',{discovery:'future-content-watcher',observationIds:image.observationIds,evidenceSources:image.sources}));}catch{warnings.push('A tartalomfigyelő egyik hivatkozása nem felel meg a Collector képcím-szabályának.');}
   sources.push({kind:'future-content-watcher',gameVersion:future.gameVersion,count:future.images.length});
 }
 if(from){const bytes=fs.readFileSync(from);if(bytes.length>4*1024*1024)throw Error('Az importfájl legfeljebb 4 MiB lehet');const imported=importReferences(JSON.parse(bytes));images.push(...imported.images);warnings.push(...imported.rejected);sources.push({kind:'user-reference-export',sha256:sha256(bytes),count:imported.images.length});}
 else{
   try{const r=await boundedFetch(origin+'/',{fetcher,maxBytes:4*1024*1024});requests++;const html=r.bytes.toString('utf8');sources.push({url:origin+'/',sha256:sha256(r.bytes),status:200});for(const m of html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)){const url=new URL(m[1],origin).href;try{sourceURL(url);if(/\/index-[\w-]+\.js$/.test(url))queue.push(url);}catch{}}entrypointConfirmed=queue.length>0;}catch(e){requests++;warnings.push('Nyilvános kezdőlap: '+e.message+'. Nincs hozzáférés-megkerülés.');if(e.status===429)discoveryBlocked=true;}
   if(!entrypointConfirmed&&!discoveryBlocked){const inventory=read(root,'snapshots/manifest.json',{resources:{}});const known=[...Object.keys(inventory.resources),...Object.values(inventory.resources).flatMap(r=>r.references??[])];queue.push(...[...new Set(known)].filter(u=>/\/(?:index|art-manifest)-[\w-]+\.js$/.test(u)));warnings.push('A jelenlegi belépőmodul nem igazolt. A korábban nyilvánosan hivatkozott modulokból feltárt lista nem garantáltan teljesen friss. Böngészős képlinklista importálható.');}
   let manifestFound=false;while(!discoveryBlocked&&queue.length&&requests<maxRequests){
     queue.sort((a,b)=>(/art-manifest/.test(a)?0:/index-/.test(a)?1:2)-(/art-manifest/.test(b)?0:/index-/.test(b)?1:2));const url=queue.shift();if(seen.has(url))continue;seen.add(url);
     try{sourceURL(url);await sleep(400);const resource=await boundedFetch(url,{fetcher,maxBytes:4*1024*1024});requests++;const text=resource.bytes.toString('utf8');sources.push({url,status:200,sha256:sha256(resource.bytes),etag:resource.etag});const parsed=referencesFromModule(text,url);images.push(...parsed.images);warnings.push(...parsed.warnings);if(/art-manifest/.test(url))manifestFound=true;
       fs.mkdirSync(path.join(root,staging,'sources'),{recursive:true});fs.writeFileSync(path.join(root,staging,'sources',sha256(resource.bytes)+'.js'),resource.bytes);
       for(const ref of parsed.modules)if(!seen.has(ref)&&!queue.includes(ref)&&(/art-manifest|GameApp|Home|Arena|sink-art|PetParts|index-/.test(ref)))queue.push(ref);
     }catch(e){requests++;warnings.push(e.message);if(e.status===429){warnings.push('429: a további felderítési kérések leálltak.');break;}}
   }
   if(!manifestFound)warnings.push('Nyilvános art-manifest nem volt elérhető. Importálj hitelesítőadatoktól megtisztított böngészős képlinklistát.');
 }
 const found=compareReferences(images,catalog,manifest),run={checkedAt:new Date().toISOString(),entrypointConfirmed,sources,warnings:[...new Set(warnings)],requests,discoveredReferences:found.length};
 const state=mutate(root,s=>{const existing=new Map(s.candidates.map(c=>[c.key,c]));for(const c of found){const prior=existing.get(c.key);if(prior){prior.sources=[...new Set([...prior.sources,...c.sources])];if(c.expectedSha256)prior.expectedSha256=c.expectedSha256;if(c.variants)prior.variants=c.variants;prior.suggestions=suggestions(prior,db,catalog);}else{s.candidates.push({...c,suggestions:suggestions(c,db,catalog)});}}s.discovery=run;});
 writeJSON(root,staging+'/discovery-'+Date.now()+'.json',run);writeJSON(root,staging+'/report.json',report(state));log(root,{event:'discover',...run,summary:report(state)});return state;
 }finally{release();}
}
export function validateImage(root,file,thumbnail){
 const result=spawnSync(process.env.ATLAS_IMAGE_PYTHON??'python',[path.join(ROOT,'scripts/image-validate.py'),file,...thumbnail?[thumbnail]:[]],{encoding:'utf8',maxBuffer:1024*1024,timeout:20000});
 let data;try{data=JSON.parse(result.stdout);}catch{throw Error('A képellenőrző nem indult. Python és Pillow szükséges. '+String(result.stderr??'').slice(0,180));}if(result.status!==0||!data.valid)throw Error(data.error??'Sérült kép');return data;
}
export async function downloadNew({root=ROOT,fetcher=fetch,limit=40,delayMs=600,sleep=pause}={}){
 if(!Number.isInteger(limit)||limit<1||limit>200||delayMs<250)throw Error('Letöltési korlát: 1–200 kép, legalább 250 ms késleltetés.');const release=jobLock(root);try{
 const state=loadState(root);if(state.downloadBlock&&(!state.downloadBlock.until||Date.now()<state.downloadBlock.until))throw Error('A szerver korlátozta a letöltést: '+state.downloadBlock.reason);
 if(state.downloadBlock?.until&&Date.now()>=state.downloadBlock.until)mutate(root,s=>{s.downloadBlock=null;});
 const {catalog,db}=catalogInputs(root),known=new Map(catalog.entries.map(e=>[e.sha256,e]));for(const c of state.candidates)if(c.sha256&&c.file)known.set(c.sha256,c);
 const queue=state.candidates.filter(c=>c.status==='queued'&&c.review.status!=='rejected'&&!['known','legacy-missing'].includes(c.change)).slice(0,limit);
 for(const candidate of queue){await sleep(delayMs);const folder=path.join(root,staging,'files',candidate.key);fs.mkdirSync(folder,{recursive:true});const temp=path.join(folder,'download.tmp');
   try{
     const r=await boundedFetch(candidate.url,{fetcher}),hash=sha256(r.bytes);fs.writeFileSync(temp,r.bytes);const validation=validateImage(root,temp);
     if(candidate.expectedSha256&&candidate.expectedSha256!==hash)throw Error('A letöltött SHA-256 eltér a forrás által megadottól.');
     const old=known.get(hash),oldFile=old?.file&&safeFile(root,old.file),duplicate=oldFile&&fs.existsSync(oldFile)&&sha256(fs.readFileSync(oldFile))===hash;
     const extension={WEBP:'webp',PNG:'png',JPEG:'jpg',GIF:'gif',AVIF:'avif'}[validation.format],file=duplicate?old.file:staging+'/files/'+candidate.key+'/'+candidate.filename,thumb=staging+'/thumbs/'+hash+'.webp';
     if(!duplicate){const dest=safeFile(root,file);if(fs.existsSync(dest)){if(sha256(fs.readFileSync(dest))!==hash)throw Error('Korábbi staging-fájl nem írható felül');fs.unlinkSync(temp);}else fs.renameSync(temp,dest);validateImage(root,dest,safeFile(root,thumb));}else fs.unlinkSync(temp);
     const updated=mutate(root,s=>{const c=s.candidates.find(c=>c.key===candidate.key);Object.assign(c,{...validation,sha256:hash,file,thumbnail:duplicate?(old.thumbnail??old.file):thumb,extension,status:duplicate?'duplicate':'downloaded',etag:r.etag,lastModified:r.lastModified,downloadedAt:new Date().toISOString()});if(duplicate){c.duplicateOf=old.key??old.id;c.existingIds=[...new Set([...(c.existingIds??[]),...(old.id?.includes('/')?[old.id]:old.existingIds??[])])];}c.suggestions=suggestions(c,db,catalog);});
     const saved=updated.candidates.find(c=>c.key===candidate.key);known.set(hash,saved);log(root,{event:'download',key:candidate.key,url:candidate.url,status:saved.status,sha256:hash,width:validation.width,height:validation.height});console.log(saved.status+': '+candidate.category+'/'+candidate.filename);
   }catch(e){if(fs.existsSync(temp))fs.unlinkSync(temp);const blocked=[403,429].includes(e.status);mutate(root,s=>{const c=s.candidates.find(c=>c.key===candidate.key);c.status=blocked?'blocked':e.status?'failed':'invalid';c.error=e.message;if(blocked){let until=null;if(e.status===429){const retry=Number(e.retryAfter);until=Number.isFinite(retry)&&retry>0?Date.now()+Math.max(retry,60)*1000:Date.now()+3600000;}s.downloadBlock={reason:e.message,until};}});log(root,{event:'download-error',key:candidate.key,url:candidate.url,error:e.message,status:e.status??null});console.log('Nem tölthető le: '+candidate.filename+' – '+e.message);if(blocked)break;}
 }
 const next=loadState(root);writeJSON(root,staging+'/report.json',report(next));return next;
 }finally{release();}
}
export function saveReview(root,key,input){const {db}=catalogInputs(root);const state=mutate(root,s=>{const c=s.candidates.find(c=>c.key===key);if(!c)throw Error('Ismeretlen képkulcs');if(input.expectedRevision!==undefined&&input.expectedRevision!==(c.review?.revision??0))throw Error('Másik ablakban módosult a jóváhagyás; frissítsd a listát.');const review=validateReview(input,targets(db),c);if(review.status==='approved'&&review.target.usage==='primary'&&s.candidates.some(other=>other.key!==key&&other.review?.status==='approved'&&JSON.stringify(other.review.target)===JSON.stringify(review.target)))throw Error('Ehhez a célhoz már tartozik jóváhagyott elsődleges kép. Válassz galériaképet, vagy tedd későbbre a korábbi döntést.');c.review=review;});log(root,{event:'review',key,status:input.status});return state;}
export function importMappings(root,value){const state=loadState(root);if(value?.schema!==2||value.kind!=='atlas-image-mappings'||value.baselineCatalogSha256!==state.baseline.catalogSha256||!Array.isArray(value.entries)||value.entries.length>10000)throw Error('Nem megfelelő mapping-fájl vagy másik kiinduló katalógus');const records=targets(catalogInputs(root).db);const validated=value.entries.map(e=>{const c=state.candidates.find(c=>c.key===e.key);if(!c||e.url!==c.url||e.sha256!==(c.sha256??null))throw Error('A mapping nem a jelenlegi képfájlra vonatkozik');return {key:c.key,review:validateReview(e,records,c)};});if(new Set(validated.map(e=>e.key)).size!==validated.length)throw Error('Duplikált mappingkulcs');return mutate(root,s=>{for(const e of validated)s.candidates.find(c=>c.key===e.key).review=e.review;});}
export function prepareImport(root=ROOT){
 const state=loadState(root),{catalog,db}=catalogInputs(root);if(sha256(fs.readFileSync(path.join(root,'data/image-catalog.json')))!==state.baseline.catalogSha256)throw Error('A kiinduló katalógus megváltozott; a mappingok felülvizsgálandók.');
 const next=structuredClone(catalog),mappings=[],eligible=state.candidates.filter(c=>c.review?.status==='approved'&&c.review.rights.status==='confirmed');const destination=staging+'/prepared',primaryTargets=new Set(),previous=read(root,destination+'/data/image-catalog.json');
 writeJSON(root,staging+'/import-preview.json',{ready:false,activeAtlasModified:false,output:destination});
 for(const c of eligible){validateReview(c.review,targets(db),c);const slot=JSON.stringify(c.review.target);if(c.review.target.usage!=='gallery'){if(primaryTargets.has(slot))throw Error('Több elsődleges kép ugyanahhoz a célhoz');primaryTargets.add(slot);}const source=safeFile(root,c.file);if(sha256(fs.readFileSync(source))!==c.sha256)throw Error('Megváltozott jóváhagyott fájl');validateImage(root,source);const file='assets/imported-art/'+c.sha256+'.'+c.extension,target=safeFile(root,destination+'/'+file);fs.mkdirSync(path.dirname(target),{recursive:true});if(fs.existsSync(target)&&sha256(fs.readFileSync(target))!==c.sha256)throw Error('Importcsomag-ütközés');if(!fs.existsSync(target))fs.copyFileSync(source,target);
   let id=c.category+'/'+c.id;if(next.entries.some(e=>e.id===id))id+='__'+c.sha256.slice(0,12);if(next.entries.some(e=>e.id===id))throw Error('Duplikált importazonosító');let relation={kind:c.review.target.kind,id:c.review.target.id,status:'partial',evidence:'Felhasználó által jóváhagyott vizuális párosítás; nem automatikus játékadat-igazolás',reviewStatus:'approved',...c.review.target.form?{form:c.review.target.form}:{}};
   if(relation.kind==='boss'){relation.kind='mob';relation.id=db.bosses.find(b=>b.id===relation.id)?.mobId??relation.id;}
   next.entries.push({id,name:id.split('/').at(-1),filename:c.filename,category:c.category,file,thumbnail:file,originalFile:file,width:c.width,height:c.height,bytes:c.bytes,sha256:c.sha256,status:'partial',title:targets(db).find(t=>t.kind===c.review.target.kind&&t.id===c.review.target.id)?.name??c.id,relations:[relation],character:null,isSprite:c.id.endsWith('_sprite'),sourceUrl:c.url,permission:'user-confirmed-evidence',permissionEvidence:c.review.rights.evidence});mappings.push({imageId:id,...c.review.target,runtimeKind:relation.kind,runtimeId:relation.id,sha256:c.sha256});
 }
 const slot=m=>JSON.stringify([m.runtimeKind??m.kind,m.runtimeId??m.id,m.kind==='pet'?m.form:null]);
 const newSlots=new Set();for(const m of mappings)if(m.usage!=='gallery'){if(newSlots.has(slot(m)))throw Error('Több elsődleges kép ugyanahhoz a futásidejű célhoz');newSlots.add(slot(m));}
 next.approvedMappings=[...(catalog.approvedMappings??[]).filter(m=>m.usage==='gallery'||!newSlots.has(slot(m))),...mappings];next.categories=[...new Set(next.entries.map(e=>e.category))].map(id=>({id,name:catalog.categories.find(c=>c.id===id)?.name??id,count:next.entries.filter(e=>e.category===id).length}));next.stats={...next.stats,available:next.entries.length,uniqueContent:new Set(next.entries.map(e=>e.sha256)).size,partial:next.entries.filter(e=>e.status==='partial').length,categories:next.categories.length};
 writeJSON(root,destination+'/data/image-catalog.json',next);writeJSON(root,destination+'/data/image-mappings.json',mappingExport(state));const script=safeFile(root,destination+'/js/image-data.js');fs.mkdirSync(path.dirname(script),{recursive:true});fs.writeFileSync(script,'window.STONESTORM_IMAGES = '+JSON.stringify(next).replaceAll('<','\\u003c')+';\n');
 const originalStore=fs.readFileSync(path.join(ROOT,'js/image-store.js'),'utf8');
 const adapter=`\n  function approvedImage(kind,id,form){const m=(catalog.approvedMappings??[]).find(m=>(m.runtimeKind??m.kind)===kind&&(m.runtimeId??m.id)===id&&m.usage!=='gallery'&&(kind!=='pet'||m.form===form));const im=m&&entries.get(m.imageId);return im&&im.sha256===m.sha256&&im.permission==='user-confirmed-evidence'&&!im.isSprite?im:null;}\n  function approvedLookup(category,name){if(category==='icons'&&name.startsWith('furn_'))return approvedImage('furniture',name.slice(5));if(category==='guild'&&/^home_t[1-8]$/.test(name))return approvedImage('home','tier-'+name.slice(-1));return null;}\n`;
 for(const marker of ['  function pet(id,form=1){','  function forRecord(kind,id){','get:(category,name)=>entries.get(category+\'/\'+name)??null'])if(!originalStore.includes(marker))throw Error('Az image-store adapter megváltozott; az importcsomag felülvizsgálandó.');
 const preparedStore=originalStore.replace('  function pet(id,form=1){',adapter+'  function pet(id,form=1){const approved=approvedImage(\'pet\',id,form);if(approved)return approved;').replace('  function forRecord(kind,id){','  function forRecord(kind,id){const approved=approvedImage(kind,id,kind===\'pet\'?1:undefined);if(approved)return approved;').replace('get:(category,name)=>entries.get(category+\'/\'+name)??null','get:(category,name)=>approvedLookup(category,name)??entries.get(category+\'/\'+name)??null');
 fs.writeFileSync(safeFile(root,destination+'/js/image-store.js'),preparedStore);
 // Remove only our own obsolete prepared copies, never the original collected
 // bytes, decisions or logs. A withdrawn approval must not leave publishable art.
 const keep=new Set(next.entries.map(e=>e.file));for(const e of previous?.entries??[])if(/^assets\/imported-art\/[a-f0-9]{64}\.(?:webp|png|jpg|gif|avif)$/.test(e.file)&&!keep.has(e.file)){
   const obsolete=safeFile(root,destination+'/'+e.file);if(fs.existsSync(obsolete)){if(sha256(fs.readFileSync(obsolete))!==e.sha256)throw Error('Módosított előkészített képet nem törlünk');fs.unlinkSync(obsolete);}
 }
 const result={ready:true,eligible:eligible.length,blockedByRights:state.candidates.filter(c=>c.review?.status==='approved'&&c.review.rights.status!=='confirmed').length,output:destination,activeAtlasModified:false};writeJSON(root,staging+'/import-preview.json',result);return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [command,...args]=process.argv.slice(2),value=key=>{const i=args.indexOf(key);return i<0?null:args[i+1];};
 try{const allowed=command==='discover'?['--from']:command==='download-new'?['--limit','--delay-ms']:[];if(args.length%2||args.some((v,i)=>i%2===0?!allowed.includes(v):v.startsWith('--')))throw Error('Ismeretlen vagy hiányos parancsargumentum');if(command==='discover')console.log(JSON.stringify(report(await discover({from:value('--from')})),null,2));else if(command==='download-new')console.log(JSON.stringify(report(await downloadNew({limit:Number(value('--limit')??40),delayMs:Number(value('--delay-ms')??600)})),null,2));else if(command==='import-approved')console.log(JSON.stringify(prepareImport(),null,2));else if(command==='report')console.log(JSON.stringify(report(loadState()),null,2));else throw Error('Parancs: discover [--from fájl], download-new [--limit 40], import-approved, report');}catch(e){console.error(e.message);process.exitCode=1;}
}
