import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {root,runtimeFiles,sourceFiles,audit,assertSafeRelative} from './publication-plan.mjs';
import {buildAddon} from './addon-package.mjs';
buildAddon(root);
const local=process.argv.includes('--local-preview');
const result=audit(sourceFiles());
if(result.missing.length||result.secretOrPersonalFindings.length||result.largeFiles.length)throw Error('A publikációs audit hibát talált. Részletek: npm run audit:publish.');
if(!local&&result.rightsBlocking.length)throw Error('Publikálás leállítva: nincs közzétételi felhatalmazás minden játékfájlra. A .publication/permissions.json nyilvántartását ellenőrizd.');
const destination=path.join(root,local?'.integration/pages-preview':'dist');
const files=runtimeFiles(),previousFile=path.join(root,'.publication/pages-manifest.json');
const previous=fs.existsSync(previousFile)?JSON.parse(fs.readFileSync(previousFile,'utf8')).files:[];
if(fs.existsSync(destination)){
  const {walk}=await import('./publication-plan.mjs');
  const known=new Set([...files,...previous.map(x=>x.file)]);
  const unexpected=walk(destination).map(p=>path.relative(destination,p).split(path.sep).join('/')).filter(p=>!known.has(p));
  if(unexpected.length)throw Error('Ismeretlen fájl van a kimeneti mappában; nem töröljük és nem publikáljuk: '+unexpected.join(', '));
}
// Csak az előző publikus build saját, tételesen ismert fájljait töröljük.
if(!local&&fs.existsSync(previousFile)){
  for(const entry of previous){
    assertSafeRelative(entry.file);const target=path.resolve(destination,entry.file);
    if(!target.startsWith(destination+path.sep))throw Error('Hibás előző buildútvonal');
    if(fs.existsSync(target))fs.unlinkSync(target);
  }
}
const inventory=[];
for(const file of files){
  assertSafeRelative(file);const from=path.join(root,file),to=path.join(destination,file);
  fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);
  inventory.push({file,bytes:fs.statSync(from).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(from)).digest('hex')});
}
const report={localOnly:local,files:inventory,bytes:inventory.reduce((n,f)=>n+f.bytes,0),rightsPending:result.rightsPending};
fs.mkdirSync(path.join(root,'.publication'),{recursive:true});
fs.writeFileSync(path.join(root,'.publication',local?'local-preview-manifest.json':'pages-manifest.json'),JSON.stringify(report,null,2)+'\n');
console.log(`${local?'Csak helyi előnézet':'Publikálható statikus csomag'}: ${path.relative(root,destination)}, ${files.length} fájl, ${(report.bytes/1024/1024).toFixed(1)} MiB.`);
if(local)console.log('Ez az előnézet nem publikálási engedély; a GitHub-workflow kizárólag az engedélyellenőrzött dist/ mappát használja.');
