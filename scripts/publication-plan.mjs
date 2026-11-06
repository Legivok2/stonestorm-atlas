import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function walk(directory){
  if(!fs.existsSync(directory))return [];
  return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
    const target=path.join(directory,entry.name);
    if(entry.isSymbolicLink())throw Error('Szimbolikus link nem kerülhet a csomagba: '+path.relative(root,target));
    return entry.isDirectory()?walk(target):[target];
  });
}
const relative=file=>path.relative(root,file).split(path.sep).join('/');
export function codeFiles(){
  const creator=JSON.parse(fs.readFileSync(path.join(root,'assets/images/sources.json'),'utf8'));
  const creatorFiles=creator.items.flatMap(item=>item.outputs.map(output=>{
    if(output.file!==path.posix.basename(output.file)||!output.file.endsWith('.webp'))throw Error('Hibás Creator Kit-útvonal');
    return 'assets/images/'+output.file;
  }));
  return [...new Set([
    'index.html','.nojekyll','package.json','serve.mjs','README.md','PROJECT_STATUS.md','DATA_SOURCES.md','IMAGE_SOURCES.md','.gitignore','.gitattributes','.publication/permissions.json','assets/images/sources.json',
    ...creatorFiles,
    ...walk(path.join(root,'assets')).filter(p=>path.dirname(p)===path.join(root,'assets')&&p.endsWith('.svg')).map(relative),
    ...walk(path.join(root,'css')).filter(p=>p.endsWith('.css')).map(relative),
    ...walk(path.join(root,'js')).filter(p=>p.endsWith('.js')&&!['atlas-data.js','image-data.js'].includes(path.basename(p))).map(relative),
    ...['scripts','tests','.github'].flatMap(dir=>walk(path.join(root,dir)).filter(p=>/\.(?:mjs|js|py|ya?ml)$/.test(p)).map(relative)),
    'stonestorm_image_tools/download_images.py','stonestorm_image_tools/README.md',
    ...['DEPLOYMENT.md','IMAGE_INTEGRATION.md','CHARACTER_PLANNER.md'].map(file=>'docs/'+file)
  ])].sort();
}
export function runtimeFiles(){
  const db=JSON.parse(fs.readFileSync(path.join(root,'data/atlas.json'),'utf8'));
  const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/image-catalog.json'),'utf8'));
  return [...new Set([
    'index.html','.nojekyll',
    ...walk(path.join(root,'css')).filter(p=>p.endsWith('.css')).map(relative),
    ...walk(path.join(root,'js')).filter(p=>p.endsWith('.js')).map(relative),
    ...walk(path.join(root,'assets')).filter(p=>/\.(?:webp|png|jpe?g|gif|svg|woff2?)$/.test(p)).map(relative),
    ...db.images.map(im=>im.file),
    ...catalog.entries.flatMap(im=>[im.file,im.originalFile,im.thumbnail])
  ])].sort();
}
export function sourceFiles(){
  const files=[...runtimeFiles(),'package.json','serve.mjs','README.md','PROJECT_STATUS.md','DATA_SOURCES.md','IMAGE_SOURCES.md','.gitignore','.gitattributes','.publication/permissions.json',
    'stonestorm_image_tools/manifest.json','stonestorm_image_tools/results.csv','stonestorm_image_tools/download_images.py','stonestorm_image_tools/README.md','assets/images/sources.json',
    ...['scripts','tests','source-data','data','.github'].flatMap(dir=>walk(path.join(root,dir)).filter(p=>/\.(?:mjs|js|py|json|ya?ml)$/.test(p)).map(relative)),
    ...['DEPLOYMENT.md','IMAGE_INTEGRATION.md','CHARACTER_PLANNER.md'].map(file=>'docs/'+file)
  ];
  return [...new Set(files)].sort();
}
export function assertSafeRelative(file){
  if(path.isAbsolute(file)||file.includes('\\')||file.split('/').some(p=>p==='..'||p===''))throw Error('Nem biztonságos csomagútvonal: '+file);
  if(file.split('/').some(p=>p==='.env'||p.startsWith('.env.')||['.aws','.ssh','.codex'].includes(p)))throw Error('Titkos konfiguráció nem kerülhet a csomagba.');
  if(file==='Stonestorm.html'||file.startsWith('.integration/')||file.startsWith('.git/')||/\.(?:har|pem|pfx|zip|key)$/.test(file))throw Error('Tiltott publikációs fájl: '+file);
}
export function scopeFor(file){
  if(file.startsWith('stonestorm_image_tools/downloaded/')||file.startsWith('assets/catalog-thumbs/'))return 'game-art-catalog';
  if(file.startsWith('Stonestorm_files/'))return 'saved-game-art';
  if(file.startsWith('assets/images/'))return 'creator-kit';
  if(file.startsWith('source-data/')||file==='js/atlas-data.js')return 'game-data-and-localization';
  return null;
}
export function rightsIssues(files,policy){
  const groups=new Map();
  for(const file of files){const scope=scopeFor(file);if(!scope)continue;const rule=policy.scopes?.[scope];
    if(rule?.status==='confirmed'&&typeof rule.evidence==='string'&&rule.evidence.trim())continue;
    groups.set(scope,(groups.get(scope)??0)+1);
  }
  return [...groups].map(([scope,files])=>({scope,files,status:policy.scopes?.[scope]?.status??'missing'}));
}
export function scanText(text,file){
  const patterns=[
    ['GitHub credential',/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/g],
    ['AWS access key',/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
    ['Google API key',/\bAIza[A-Za-z0-9_-]{30,}\b/g],
    ['Private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
    ['JWT credential',/\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\b/g],
    ['Credentials in URL',/https?:\/\/[^\s/"':]+:[^\s/"'@]+@/g],
    ['Literal bearer token',/Bearer\s+[A-Za-z0-9_.-]{30,}/g],
    ['Literal credential assignment',/["']?(?:password|passwd|api_key|client_secret|access_token|refresh_token|session_token)["']?\s*[:=]\s*["'][^\s"'{}<>]{12,}["']/gi],
    ['Personal Windows home path',/[A-Z]:[\\/]+Users[\\/]+[^\s"'<>\\/]+/g]
  ];
  return patterns.flatMap(([kind,pattern])=>[...text.matchAll(pattern)].map(match=>({file,kind,line:text.slice(0,match.index).split('\n').length})));
}
export function audit(files){
  const policy=JSON.parse(fs.readFileSync(path.join(root,'.publication/permissions.json'),'utf8'));
  const missing=[],findings=[],large=[];let bytes=0;
  for(const file of files){
    assertSafeRelative(file);
    const target=path.join(root,file);
    if(!fs.existsSync(target)){missing.push(file);continue;}
    const size=fs.statSync(target).size;bytes+=size;
    if(size>=100*1024*1024)large.push({file,bytes:size});
    if(/\.(?:html|css|js|mjs|json|md|py|csv|ya?ml)$/.test(file))findings.push(...scanText(fs.readFileSync(target,'utf8'),file));
  }
  return {version:1,files:files.length,bytes,missing,secretOrPersonalFindings:findings,largeFiles:large,rightsPending:rightsIssues(files,policy),excluded:['Stonestorm.html','Stonestorm_files mentett JS/CSS','eredeti ZIP','munkameneti/HAR/credential fájlok','.integration/','helyi IDE- és titkos konfigurációk'],limitations:'Mintákon alapuló ellenőrzés; nem minden lehetséges személyes adat automatikus felismerése.'};
}
