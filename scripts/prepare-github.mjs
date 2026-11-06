import fs from 'node:fs';
import path from 'node:path';
import {root,sourceFiles,audit,assertSafeRelative,walk} from './publication-plan.mjs';
const review=process.argv.includes('--local-review');
const files=sourceFiles(),report=audit(files);
if(report.missing.length||report.secretOrPersonalFindings.length||report.largeFiles.length)throw Error('A forráscsomag auditja hibát talált.');
if(!review&&report.rightsPending.length)throw Error('GitHub-feltöltési csomag nem készül: a játékfájlok terjesztési engedélye tisztázandó. Helyi ellenőrzéshez: npm run prepare:github:review.');
const directory=path.join(root,'.release',review?'local-review':'stonestorm-atlas');
const manifestPath=path.join(root,'.publication',review?'source-review-manifest.json':'source-manifest.json');
const previous=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath,'utf8')).files:[];
const known=new Set([...files,...previous]);
if(fs.existsSync(directory)){
  const unexpected=walk(directory).map(file=>path.relative(directory,file).split(path.sep).join('/')).filter(file=>!file.startsWith('.git/')&&!known.has(file));
  if(unexpected.length)throw Error('Ismeretlen állomány a célmappában; nem írjuk felül vagy töltjük fel: '+unexpected.join(', '));
}
for(const file of previous){
  assertSafeRelative(file);
  if(!files.includes(file)){
    const target=path.resolve(directory,file);
    if(!target.startsWith(directory+path.sep))throw Error('Hibás korábbi csomagútvonal');
    if(fs.existsSync(target))fs.unlinkSync(target);
  }
}
for(const file of files){
  assertSafeRelative(file);const target=path.join(directory,file);
  fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target);
}
fs.mkdirSync(path.join(root,'.publication'),{recursive:true});
fs.writeFileSync(manifestPath,JSON.stringify({localOnly:review,files,rightsPending:report.rightsPending},null,2)+'\n');
console.log(`${review?'Csak helyi átnézésre, nem feltölthetőként jóváhagyva':'Auditált GitHub-forráscsomag'}: ${path.relative(root,directory)} (${files.length} fájl).`);
