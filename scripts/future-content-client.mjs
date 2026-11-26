import {staticModule} from './public-client-data.mjs';
const allowed=url=>{try{const u=new URL(url);return u.origin==='https://stonestorm.gg'&&!u.username&&!u.password;}catch{return false;}};
export const imageURL=url=>{if(!allowed(url))return false;const u=new URL(url);return !u.hash&&/^\/(?:art|assets|landing|icons)\/[a-z0-9_./-]+\.(?:webp|png|jpe?g|gif|avif|svg)$/i.test(u.pathname)&&[...u.searchParams].every(([k,v])=>k==='v'&&/^[\w.-]+$/.test(v));};
export function localeLanguage(url){return /(?:texts\.|[./_-])hu(?:[.-]|$)/i.test(url)?'hu':/(?:texts\.|[./_-])en(?:[.-]|$)/i.test(url)?'en':null;}
export function staticClientEvidence(text,url){
  const result={localeEntries:null,staticReferences:[],artEntries:[],warnings:[]},language=localeLanguage(url);
  try{
    const parsed=staticModule(text),entries={};
    const namespaces=Object.keys(parsed.namespaces).length?parsed.namespaces:parsed.exports;
    const walk=(value,p)=>{if(typeof value==='string'){if(language)entries[p]=value;try{const resolved=new URL(value,value.startsWith('assets/')?'https://stonestorm.gg/':url).href;if(imageURL(resolved))result.staticReferences.push(resolved);}catch{}}else if(value&&typeof value==='object')for(const [k,v] of Object.entries(value))walk(v,p+'/'+k);};
    if(language)walk(namespaces,'');
    // Static literal tables include JSON.parse literals; executable expressions
    // and dynamic import/URL builders are deliberately never evaluated.
    if(/art-manifest/.test(url))for(const [variable,value] of Object.entries(parsed.values)){walk(value,'');if(value&&typeof value==='object'&&!Array.isArray(value))for(const [category,names] of Object.entries(value))if(Array.isArray(names))for(const name of names)if(typeof name==='string'&&/^[\w-]+$/.test(name))result.artEntries.push({key:category+'/'+name,category,name,sourcePath:'literal '+variable+'.'+category});}
    if(language)result.localeEntries=entries;
  }catch{result.warnings.push('A modul nem elemezhető teljesen statikus literálként.');}
  result.language=language;result.staticReferences=[...new Set(result.staticReferences)].sort();return result;
}
export function clientCandidates(resources={}){
  const candidates=[],modules=new Map(),fresh=Object.entries(resources).filter(([,r])=>r.status!=='stale'&&r.observedThisCheck!==false),locales=new Set();
  for(const [url,r] of fresh){
    if(!allowed(url))continue;
    const base={source:url,sourceHash:r.sha256??null,scope:'client',status:'prepared',potential:false,importance:'low'};
    if(imageURL(url)&&r.kind==='image-reference')candidates.push({...base,category:'graphics',key:url,value:url,nameHu:'Nyilvános grafikai hivatkozás',source:r.discoveredFrom??url,sourceHash:r.referenceSourceHash??r.sha256??null,sourcePath:'reference: '+url,statusReason:'Képhivatkozás; önmagában nem igazol új játékfunkciót vagy aktiválást.',potential:/(?:^|[/_])m(?:[7-9]|[1-9]\d)(?:[_/.]|$)/i.test(url),importance:'low',imageReference:url});
    for(const entry of r.artEntries??[])candidates.push({...base,category:'graphics',key:'art:'+entry.key,value:entry.name,nameHu:'Grafikai katalógusbejegyzés',sourcePath:entry.sourcePath,artLogicalKey:entry.key,statusReason:'Az art-manifest nyilvános képkulcsa. Nem találgatunk hozzá fájlcímet és nem állítunk aktiválást.',potential:/(?:^|[_/])m(?:[7-9]|[1-9]\d)(?:[_/]|$)/i.test(entry.key)});
    const language=r.language??localeLanguage(url);
    if(r.localeEntries&&language){locales.add(language);const owner=new URL(url).pathname.split('/').at(-1).replace(/-[\w-]{6,}\.js$/,'.js');for(const [key,value] of Object.entries(r.localeEntries))candidates.push({...base,category:'translations',key:language==='hu'?key:'en:'+key,value,nameHu:(language==='hu'?'Magyar':'Angol')+' fordítás: '+String(value).slice(0,90),language,scope:'locale:'+language+':'+owner,sourcePath:key,statusReason:'Nyilvános szöveg; a fordítás létezése nem igazolja a funkció aktiválását.'});}
    if(/\.js(?:\?|$)/.test(url)&&r.kind!=='image-reference'){
      const filename=new URL(url).pathname.split('/').at(-1),logical=filename.replace(/-[\w-]{6,}\.js$/,'.js');
      if(!modules.has(logical))modules.set(logical,[]);modules.get(logical).push({url,sha256:r.sha256??null});
    }
    for(const entry of r.official??[])candidates.push({...base,category:'official',key:entry.id,value:{title:entry.title,quote:entry.quote,publishedAt:entry.publishedAt},nameHu:entry.title,source:entry.source,sourcePath:entry.sourcePath??'hivatalos közlemény',status:'announced',potential:true,importance:'high',officialAnnouncement:entry,statusReason:'Dátumozott, strukturált hivatalos közlemény. A tényleges játékbeli elérhetőség ettől külön bizonyíték.'});
  }
  for(const [key,urls] of modules)candidates.push({category:'modules',key,value:urls.sort((a,b)=>a.url.localeCompare(b.url)),nameHu:'Nyilvános kliensmodul',source:urls[0].url,sourcePath:'public module',sourceHash:urls[0].sha256,scope:'client',status:'uncertain',potential:false,importance:'low',statusReason:'Kliensmodul; a fájlnév nem igazol új játékmódot.'});
  return {candidates,locales:[...locales],freshSources:fresh.length};
}
export function officialArticles(text,url){
  const entries=[];
  for(const match of text.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
    try{const root=JSON.parse(match[1]),nodes=Array.isArray(root)?root:root['@graph']??[root];for(const row of nodes){
      if(row['@type']!=='NewsArticle'||typeof row.headline!=='string'||typeof row.articleBody!=='string'||!Number.isFinite(Date.parse(row.datePublished)))continue;
      const source=new URL(row.url??url,url);if(!allowed(source.href))continue;
      entries.push({id:source.href+'#'+row.datePublished,source:source.href,sourcePath:'application/ld+json',title:row.headline,quote:row.articleBody.split(/\s+/).slice(0,25).join(' '),publishedAt:row.datePublished});
    }}catch{/* Unknown markup is not a verified announcement. */}
  }
  return entries;
}
