import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {API,sha256,equal,diffJSON,category,validateContent,localBaseline,planImport} from './atlas-sync-model.mjs';
import {reconcileReview,loadReviewAliases,reviewGroups,classifications} from './sync-review.mjs';
import {collectPublicSystems} from './collect-home-arena.mjs';
import {compatibleClientData} from './home-arena-model.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(root,file,fallback=null)=>fs.existsSync(path.join(root,file))?JSON.parse(fs.readFileSync(path.join(root,file),'utf8')):fallback;
function write(root,file,value){const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});const temp=target+'.tmp';fs.writeFileSync(temp,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');fs.renameSync(temp,target);}
export async function fetchPublic(url,previous,fetcher=fetch){
  const u=new URL(url);
  if(u.origin!=='https://stonestorm.gg'||u.username||u.password)throw Error('Nem engedélyezett adatforrás');
  const headers={'User-Agent':'Stonestorm-Atlas-Sync/1.0 (+https://github.com/Legivok2/stonestorm-atlas)'};
  if(previous?.etag)headers['If-None-Match']=previous.etag;
  if(previous?.lastModified)headers['If-Modified-Since']=previous.lastModified;
  const response=await fetcher(url,{headers,redirect:'error',signal:AbortSignal.timeout(30000)});
  if(response.status===304){if(!previous?.sha256)throw Error('304 előzmény nélkül');return {...previous,status:304,unchanged:true};}
  if(!response.ok)throw Error('HTTP '+response.status+' – '+url);
  if(Number(response.headers.get('content-length'))>4*1024*1024)throw Error('Túl nagy publikus fájl');
  const chunks=[];let size=0;
  for await(const chunk of response.body){size+=chunk.length;if(size>4*1024*1024)throw Error('Túl nagy publikus fájl');chunks.push(chunk);}
  const text=Buffer.concat(chunks).toString('utf8');
  return {url,status:200,etag:response.headers.get('etag'),lastModified:response.headers.get('last-modified'),sha256:sha256(text),bytes:size,text};
}

export function discover(text,base){
  const urls=new Set();
  for(const m of text.matchAll(/["'`](\/?(?:\.?\.?\/)?(?:assets\/)?[a-zA-Z0-9_./-]+\.(?:js|json|webmanifest|webp|png|svg|css)(?:\?[^"'`<>\s]*)?)["'`]/g)){
    if(/\.json$/.test(m[1])&&!/^(?:\/|\.\/|assets\/)/.test(m[1]))continue;
    const u=new URL(m[1],m[1].startsWith('assets/')?'https://stonestorm.gg/':base);if(u.origin==='https://stonestorm.gg')urls.add(u.href);
  }
  return [...urls].sort();
}
async function inspectResources(previous={},fetcher=fetch){
  // Egy 403, átmeneti hiba vagy a kérési költségkeret nem törölheti a korábbi leltárt.
  const resources=structuredClone(previous),queue=['https://stonestorm.gg/'],seen=new Set(),warnings=[];
  const priority=url=>/index-.*\.js/.test(url)?0:/art-manifest|texts\.hu|\/hu-|\.hu-/.test(url)?1:/\.json|webmanifest/.test(url)?2:3;
  let bytes=0,requests=0;
  while(queue.length&&requests<48&&bytes<12*1024*1024){
    queue.sort((a,b)=>priority(a)-priority(b)||a.localeCompare(b));
    const url=queue.shift();if(seen.has(url))continue;seen.add(url);
    // Képekből csak hivatkozásjegyzék készül, nem töltjük le újra a teljes képkészletet.
    if(/\.(?:webp|png|svg)(?:\?|$)/.test(url)){resources[url]={url,kind:'image-reference',downloaded:false};continue;}
    try{
      const cached=previous[url];
      // Vite hash-elt, változatlan URL: a korábbi hash és hivatkozáslista újrahasználható.
      const hashed=cached&&/\/[\w.-]+-[\w-]{8,}\.js$/.test(url);
      if(!hashed)requests++;
      const resource=hashed?{...cached,status:'cached',unchanged:true}:await fetchPublic(url,cached,fetcher);
      const refs=resource.text?discover(resource.text,url):resource.references??[];
      const {text,...metadata}=resource;
      resources[url]={...metadata,references:refs,kind:/\.hu-|\/hu-/.test(url)?'hu-localization':/art-manifest/.test(url)?'graphics-manifest':'public-client'};
      bytes+=resource.status===200?resource.bytes:0;
      for(const ref of refs){
        if(/\.(?:webp|png|svg)(?:\?|$)/.test(ref)){resources[ref]={url:ref,kind:'image-reference',downloaded:false};continue;}
        // A bundler által hivatkozott *.hu.json fejlesztői nevek nem publikus végpontok;
        // a tényleges, hash-elt magyar JS-modulokat vizsgáljuk.
        if(/\/assets\/.*\.json$/.test(ref))continue;
        if(!seen.has(ref)&&!queue.includes(ref))queue.push(ref);
      }
    }catch(e){warnings.push({url,reason:e.message});if(previous[url])resources[url]={...previous[url],status:'stale'};}
  }
  const discovered=[...new Set([...Object.keys(resources),...queue,...Object.values(resources).flatMap(r=>r.references??[])])].sort();
  return {resources,discovered,warnings,budget:{requests,downloadedBytes:bytes,unfetched:queue.length,maxRequests:48,maxBytes:12*1024*1024}};
}
function markdown(r){
  if(r.reviewSummary){
    const s=r.reviewSummary,a=s.activity;
    return `# Atlas frissítési jelentés\n\nÁllapot: ${r.status}\n\nEllenőrzés: ${r.checkedAt}\n\nJátékverzió: ${r.gameVersion}\n\n## Áttekintés\n\n- Most észlelt új tételek: ${a.new}\n- Korábbról nyitva maradt: ${a.carried}\n- Automatikusan feldolgozott mezők: ${a.automatic}\n- Dokumentált felülvizsgálattal lezárt: ${a.documented}\n- Mechanikai / kézi ellenőrzés: ${a.manual}\n- Nyitott összesen: ${s.open}\n\n## A kiinduló ${s.baseline.total} tétel besorolása\n\n${Object.entries(classifications).map(([k,label])=>'- '+label+': '+s.baseline.classified[k]).join('\n')}\n\nLezárt: ${s.baseline.resolved}; nyitott: ${s.baseline.open}. A változatlan API-válasz önmagában nem lezárási ok.\n\n## Nyitott rendszerek\n\n${reviewGroups(r.review).map(g=>'### '+g.name+' ('+g.count+')\n\n'+g.topics.map(t=>'- '+t.title+': '+t.count+' tétel – '+classifications[t.classification]).join('\n')).join('\n\n')}\n\n## Források és részletek\n\nA teljes URL-ek, technikai útvonalak, besorolások és lezárási bizonyítékok a latest-sync.json reviewLedger mezőjében szerepelnek. A teljes API-konfiguráció SHA-256 lenyomata: ${r.sourceHash}.\n\nKliensfeltérképezés ebben a futásban: ${r.clientInspected?'igen':'nem; a meglévő forrásleltár megmaradt'}.\n`;
  }
  return `# Atlas Auto-Sync V1\n\nÁllapot: ${r.status}\n\nEllenőrzés: ${r.checkedAt}\n\nJátékverzió: ${r.gameVersion??'nem elérhető'}\n\nÖsszevetés: ${r.baseline??'nem történt'}\n\nÚj / módosult / hiányzó mezők: ${r.counts?.added??0} / ${r.counts?.changed??0} / ${r.counts?.removed??0}\n\nImportálható rekordok: ${r.accepted?.length??0}; ellenőrzésre váró tételek: ${r.review?.length??0}.\n\n${r.error??''}\n\n## Elért források\n\n${(r.sources??[]).map(s=>'- '+s.url+' ('+s.status+', SHA-256: '+s.sha256+')').join('\n')}\n\n## Ellenőrzésre vár\n\n${(r.review??[]).map(x=>'- `'+x.path+'`: '+x.reason).join('\n')}\n\n## Változások\n\n${(r.changes??[]).map(x=>'- '+x.kind+' `'+x.path+'` ['+x.category+']').join('\n')}\n\nA teljes előtte/utána értékeket a latest-sync.json tartalmazza. A jelentésben szereplő hiány nem törlési utasítás. A klienskódot nem futtatjuk, a magyar modulokat és grafikai hivatkozásokat csak feltérképezzük.\n`;
}

export async function runSync({root=ROOT,apply=false,fetcher=fetch,now=new Date().toISOString(),inspect=true,verify,outputFile}={}){
  const previous=read(root,'snapshots/manifest.json',{schema:1,resources:{}}),old=read(root,'snapshots/current/content.json');
  let report={schema:1,checkedAt:now,status:'failed',applied:false};
  try{
    const fetched=await fetchPublic(API,old?previous.content:null,fetcher);
    if(old&&previous.content?.sha256!==sha256(fs.readFileSync(path.join(root,'snapshots/current/content.json'))))throw Error('A korábbi snapshot hash-ellenőrzése sikertelen');
    const content=fetched.text?validateContent(JSON.parse(fetched.text)):validateContent(old);
    const contentBytes=JSON.stringify(content),contentMeta={url:API,sha256:sha256(contentBytes),etag:fetched.etag,lastModified:fetched.lastModified,bytes:Buffer.byteLength(contentBytes),status:fetched.status};
    const unchanged=old&&equal(old,content);
    const local=old?null:localBaseline(new URL('./scripts/', 'file:///'+root.replaceAll('\\','/')+'/'));
    const baseline=old??Object.fromEntries(Object.entries(local).filter(([key])=>key in content));
    // Az első bázisban nem mentett API-ágak első megfigyelések, nem bizonyított új játékfunkciók.
    const changes=diffJSON(baseline,content).map(x=>({...x,category:category(x.path)}));
    const db=read(root,'data/atlas.json');
    const priorImport=read(root,'data/sync-import.json',{schema:1,records:{},sets:{}});
    const plan=planImport(content,db,priorImport,now);
    let publicSystems=null,publicSystemsCache=null,clientCandidate=null;
    if(inspect&&db.homeArena){
      try{
        const result=await collectPublicSystems({root,content,fetcher});
        publicSystemsCache=result.cache;
        const compatibility=compatibleClientData(db.homeArena,result.candidate);
        publicSystems={entrypointConfirmed:result.candidate.entrypointConfirmed,warnings:result.warnings,compatibility};
        if(!compatibility.safe)plan.review.push({path:'/home-arena/client',reason:compatibility.reason});
        else if(compatibility.changed&&result.candidate.entrypointConfirmed){clientCandidate=result.candidate;plan.accepted.push({path:'/home-arena/furniture-names',kind:'changed'});}
        else if(compatibility.changed)plan.review.push({path:'/home-arena/client',reason:'Új katalógusszöveg, de a jelenlegi belépőmodul nem volt igazolható'});
      }catch(e){publicSystems={error:e.message};plan.review.push({path:'/home-arena/client',reason:e.message});}
    }
    const priorReport=read(root,'reports/latest-sync.json',{});
    const inventory=inspect?await inspectResources(previous.resources,fetcher):{resources:previous.resources??{},discovered:previous.discovered??[],warnings:[],budget:{inspected:false}};
    const resourceChanges=Object.entries(inventory.resources).filter(([url,r])=>r.sha256&&previous.resources?.[url]?.sha256!==r.sha256).map(([url,r])=>({url,sha256:r.sha256,beforeHash:previous.resources?.[url]?.sha256??null,category:category(url)}));
    report={...report,status:unchanged?'unchanged':'checked',baseline:old?'Teljes korábbi publikus snapshot':'Részleges helyi forrásadatok; első megfigyelés',gameVersion:content.version,atlasDataVersion:db.dataVersion,sourceHash:contentMeta.sha256,sources:[contentMeta,...Object.values(inventory.resources).filter(x=>x.sha256)],counts:Object.fromEntries(['added','changed','removed'].map(k=>[k,changes.filter(x=>x.kind===k).length])),changes,accepted:plan.accepted,resourceChanges,publicSystems,clientInspected:inspect,discovery:inventory.budget,warnings:inventory.warnings};
    const statusBefore=read(root,'data/sync-status.json',{});
    const newStatus={schema:1,lastSuccessfulCheck:now,gameVersion:content.version,atlasDataVersion:plan.accepted.length&&apply?content.version:db.dataVersion,lastAutomaticUpdate:statusBefore.lastAutomaticUpdate??null,lastImportCounts:statusBefore.lastImportCounts??{added:0,changed:0},mode:apply?'apply':'read-only',changeCounts:report.counts,importable:plan.accepted.length,reportUrl:'https://github.com/Legivok2/stonestorm-atlas/blob/main/reports/latest-sync.md'};
    if(apply&&plan.accepted.length){
      const targets=['data/sync-import.json','data/atlas.json','js/atlas-data.js','data/image-manifest.json','data/home-arena.json'];
      const backup=new Map(targets.map(f=>[f,fs.existsSync(path.join(root,f))?fs.readFileSync(path.join(root,f)):null]));
      try{
        write(root,'data/sync-import.json',plan.overlay);
        if(clientCandidate){const previousSystem=read(root,'data/home-arena.json');write(root,'reports/history/home-arena/'+sha256(previousSystem)+'.json',previousSystem);write(root,'data/home-arena.json',clientCandidate);}
        if(verify)await verify();else{
          for(const [program,args] of [[process.execPath,['scripts/build-data.mjs']],...(process.platform==='win32'?[['cmd.exe',['/d','/s','/c','npm test']]]:[['npm',['test']]])]){
            const result=spawnSync(program,args,{cwd:root,stdio:'inherit'});if(result.status!==0)throw Error('Importellenőrzés sikertelen: '+args.join(' '));
          }
        }
      }catch(e){for(const [file,bytes] of backup){if(bytes===null){if(fs.existsSync(path.join(root,file)))fs.unlinkSync(path.join(root,file));}else fs.writeFileSync(path.join(root,file),bytes);}throw e;}
      report.applied=true;report.status='applied';newStatus.lastAutomaticUpdate=now;newStatus.lastImportCounts={added:plan.accepted.filter(x=>x.kind==='added').length,changed:plan.accepted.filter(x=>x.kind==='changed').length};
    }
    // Csak a ténylegesen újraépített, tesztelt Atlas-adat adhat importlezárási bizonyítékot.
    const reconciled=reconcileReview({previous:priorReport,changes,resourceChanges,plan,content,db:report.applied?read(root,'data/atlas.json'):db,aliases:loadReviewAliases(root),initialReport:read(root,'reports/initial-sync.json',{}),sources:report.sources,sourceHash:contentMeta.sha256,now});
    report.review=reconciled.open;report.reviewLedger=reconciled.ledger;report.reviewSummary=reconciled.summary;report.reviewBaseline=reconciled.baseline;
    const closed=new Set(reconciled.closedNow);
    Object.assign(newStatus,{reviewVersion:2,pending:report.review.length,pendingItems:report.review.slice(0,60),reviewSummary:reconciled.summary,groups:reviewGroups(report.review.filter(x=>x.carried)),manualGroups:reviewGroups(report.review.filter(x=>['mechanism','conflict'].includes(x.classification))),processedGroups:reviewGroups(reconciled.ledger.filter(x=>closed.has(x.id))),resolvedGroups:reviewGroups(reconciled.ledger.filter(x=>x.status==='resolved')),currentGroups:reviewGroups(reconciled.ledger.filter(x=>!x.carried))});
    // Csak teljes, érvényes válasz és sikeres tranzakció után váltható az aktuális snapshot.
    if(!unchanged){
      if(old)write(root,'snapshots/history/'+previous.content.sha256+'.json',old);
      write(root,'snapshots/current/content.json',contentBytes);
    }
    write(root,'snapshots/manifest.json',{schema:1,checkedAt:now,gameVersion:content.version,content:contentMeta,resources:inventory.resources,discovered:inventory.discovered});
    if(publicSystemsCache){const previousClient=read(root,'snapshots/current/home-arena-client.json',null);if(previousClient&&sha256(previousClient.modules)!==sha256(publicSystemsCache.modules))write(root,'reports/history/home-arena-client/'+sha256(previousClient)+'.json',previousClient);write(root,'snapshots/current/home-arena-client.json',publicSystemsCache);}
    write(root,'data/sync-status.json',newStatus);
    write(root,'js/sync-status.js','/* Generált Auto-Sync állapot. */\nwindow.STONESTORM_SYNC_STATUS = '+JSON.stringify(newStatus).replaceAll('<','\\u003c')+';\n');
    write(root,'reports/latest-sync.json',report);write(root,'reports/latest-sync.md',markdown(report));
    if(outputFile)fs.appendFileSync(outputFile,`publish=${report.applied}\nreview=${report.review.length>0}\n`);
    return report;
  }catch(e){
    report={...report,status:'failed',error:e.message};
    write(root,'reports/failed-sync.json',report);write(root,'reports/failed-sync.md',markdown(report));
    if(outputFile)fs.appendFileSync(outputFile,'publish=false\n');
    throw e;
  }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.slice(2).some(x=>!['--apply','--read-only','--content-only'].includes(x)))throw Error('Használat: node scripts/atlas-sync.mjs [--read-only | --apply] [--content-only]');
  const report=await runSync({apply:process.argv.includes('--apply'),inspect:!process.argv.includes('--content-only'),outputFile:process.env.GITHUB_OUTPUT});
  console.log(JSON.stringify({status:report.status,gameVersion:report.gameVersion,counts:report.counts,accepted:report.accepted.length,pending:report.review.length,applied:report.applied}));
}
