import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {staticModule,clientReferences} from './public-client-data.mjs';
import {sha256,API} from './atlas-sync-model.mjs';
import {apiSystemValues,validateHomeArena} from './home-arena-model.mjs';
const rootPath=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const role=url=>[['entry',/\/index-[\w-]+\.js$/],['game',/\/GameApp-[\w-]+\.js$/],['texts',/\/texts\.hu-[\w-]+\.js$/],['baseLocale',/\/hu-[\w-]+\.js$/],['teaLocale',/\/monetsf\.hu-[\w-]+\.js$/],['home',/\/HomeModal-[\w-]+\.js$/],['homeParts',/\/Home2Parts-[\w-]+\.js$/],['sinkArt',/\/sink-art-[\w-]+\.js$/],['arenaPage',/\/ArenaPage-[\w-]+\.js$/],['arenaNet',/\/arena-[\w-]+\.js$/],['tea',/\/TeahouseModal-[\w-]+\.js$/]].find(([,re])=>re.test(url))?.[0];
function load(root,file,fallback){return fs.existsSync(path.join(root,file))?JSON.parse(fs.readFileSync(path.join(root,file),'utf8')):fallback;}
async function boundedText(response){
  if(Number(response.headers.get('content-length'))>4*1024*1024)throw Error('Túl nagy nyilvános forrás');
  const chunks=[];let bytes=0;for await(const part of response.body){bytes+=part.length;if(bytes>4*1024*1024)throw Error('Túl nagy nyilvános forrás');chunks.push(part);}
  return Buffer.concat(chunks).toString('utf8');
}
export async function collectPublicSystems({root=rootPath,content,fetcher=fetch}={}){
  const cache=load(root,'snapshots/current/home-arena-client.json',{schema:1,modules:{}}),manifest=load(root,'snapshots/manifest.json',{resources:{}});
  const queue=[],modules={},warnings=[];let entrypointConfirmed=false;
  try{
    const r=await fetcher('https://stonestorm.gg/',{redirect:'error',signal:AbortSignal.timeout(30000)});
    if(!r.ok)throw Error('HTTP '+r.status);
    const html=await boundedText(r);
    for(const match of html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)){const u=new URL(match[1],'https://stonestorm.gg/');if(u.origin==='https://stonestorm.gg'&&role(u.href)==='entry')queue.push(u.href);}
    entrypointConfirmed=queue.length>0;
    if(!entrypointConfirmed)throw Error('A nyilvános kezdőlapon nem található támogatott belépőmodul');
  }catch(e){warnings.push({url:'https://stonestorm.gg/',reason:e.message+'; nincs hozzáférés-megkerülés, a korábbi nyilvános hivatkozásjegyzéket használjuk'});}
  if(!entrypointConfirmed){
    for(const url of [...Object.keys(cache.modules),...Object.keys(manifest.resources),...Object.values(manifest.resources).flatMap(x=>x.references??[])])if(role(url)&&!queue.includes(url))queue.push(url);
  }
  const seen=new Set();
  while(queue.length&&seen.size<16){
    const url=queue.shift();if(seen.has(url))continue;seen.add(url);
    if(!url.startsWith('https://stonestorm.gg/assets/')||!role(url))continue;
    const old=cache.modules[url];
    try{
      if(old){modules[url]=old;for(const ref of old.references)if(role(ref)&&!seen.has(ref))queue.push(ref);continue;}
      const response=await fetcher(url,{redirect:'error',signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('HTTP '+response.status);
      const text=await boundedText(response),bytes=Buffer.byteLength(text),kind=role(url),refs=clientReferences(text,url);
      // Az eredeti forrás akkor is megmarad az artifactban, ha az AST/séma nem értelmezhető.
      const sourceHash=sha256(Buffer.from(text)),target=path.join(root,'reports/history/public-client',sourceHash+'.js');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,text);
      const parsed=['texts','teaLocale','baseLocale'].includes(kind)?staticModule(text):null;
      let locale=null;
      if(kind==='texts')locale={arena:parsed.namespaces.arena,home:parsed.namespaces.nyelo?.home,furniture:parsed.namespaces.nyelo?.furniture,room:parsed.namespaces.nyelo?.room,trophy:parsed.namespaces.nyelo?.trophy,jar:parsed.namespaces.nyelo?.jar,banditTrophy:parsed.namespaces.nyelo?.banditTrophy,home2:parsed.namespaces.home2,rooms:parsed.namespaces.homerooms};
      if(kind==='teaLocale')locale={tea:Object.values(parsed.values).find(v=>v?.tea?.title)?.tea};
      if(kind==='baseLocale')locale={cityNames:parsed.exports.city?.places};
      const endpoints=[...text.matchAll(/["'](\/api\/[a-z0-9_/-]+)["']/gi)].map(x=>x[1]);
      modules[url]={url,role:kind,sha256:sha256(Buffer.from(text)),bytes,references:refs,locale,endpoints:[...new Set(endpoints)]};
      // A teljes eredeti modul csak a Gitből kizárt, 14 napos Actions-artifactba kerül.
      for(const ref of refs)if(role(ref)&&!seen.has(ref))queue.push(ref);
    }catch(e){warnings.push({url,reason:e.message});}
  }
  const byRole={};for(const m of Object.values(modules)){if(byRole[m.role]&&m.role!=='entry'&&byRole[m.role].url!==m.url)throw Error('Több eltérő kliensmodul ugyanahhoz a szerephez: '+m.role);byRole[m.role]=m;}
  for(const required of ['texts','baseLocale','teaLocale','home','homeParts','sinkArt','arenaPage','arenaNet','tea'])if(!byRole[required])throw Error('Hiányzó, nyilvánosan hivatkozott kliensmodul: '+required);
  const candidate={schema:1,gameVersion:content.version,checkedAt:new Date().toISOString(),entrypointConfirmed,api:apiSystemValues(content),locale:{...byRole.texts.locale,...byRole.teaLocale.locale},sources:Object.values(modules).map(({url,role,sha256})=>({url,role,sha256})),endpoints:[...new Set(Object.values(modules).flatMap(x=>x.endpoints))].filter(p=>['/api/sinks','/api/home/rooms','/api/arena/pure','/api/arena/pure/season','/api/arena/bandit'].includes(p)),limitations:['A magyar klienssúgó nem helyettesít élő szerveres igazolást.','Az árak, szobaszintek, szezonhatárok és több limit bejelentkezett nézetből érkezik.','A belépés/kilépés több szabályváltozatát tartalmazza a kliens; az aktív változat külön mintát igényel.'],warnings};
  candidate.locale.cityNames=byRole.baseLocale.locale.cityNames;
  validateHomeArena(candidate);
  candidate.apiProvenance={source:API,sha256:sha256(JSON.stringify(content)),gameVersion:content.version,checkedAt:candidate.checkedAt,status:'derived'};
  return {candidate,cache:{schema:1,checkedAt:candidate.checkedAt,entrypointConfirmed,modules},warnings};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const content=load(rootPath,'snapshots/current/content.json',null),result=await collectPublicSystems({content});
  fs.writeFileSync(path.join(rootPath,'snapshots/current/home-arena-client.json'),JSON.stringify(result.cache,null,2)+'\n');
  if(process.argv.includes('--initialize')){
    if(fs.existsSync(path.join(rootPath,'data/home-arena.json')))throw Error('A meglévő rendszeradatot nem írjuk felül inicializálással');
    fs.writeFileSync(path.join(rootPath,'data/home-arena.json'),JSON.stringify(result.candidate,null,2)+'\n');
  }
  console.log(JSON.stringify({modules:Object.keys(result.cache.modules).length,entrypointConfirmed:result.candidate.entrypointConfirmed,version:content.version,warnings:result.warnings}));
}
