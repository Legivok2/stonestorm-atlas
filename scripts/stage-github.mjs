import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {root,sourceFiles,codeFiles,audit} from './publication-plan.mjs';
const codeOnly=process.argv.includes('--code-only');
const files=codeOnly?codeFiles():sourceFiles(),report=audit(files);
if(report.missing.length||report.secretOrPersonalFindings.length||report.largeFiles.length||report.rightsBlocking.length)throw Error('A GitHub-feltöltés előkészítése leállt: az audit vagy a közzétételi felhatalmazás hiányos.');
const tracked=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
const allowed=new Set(files);
const unexpected=tracked.filter(file=>!allowed.has(file));
if(unexpected.length)throw Error('Nem auditált, már követett fájl van a repositoryban; kézi vizsgálat szükséges: '+unexpected.join(', '));
const gitdir=execFileSync('git',['rev-parse','--absolute-git-dir'],{cwd:root,encoding:'utf8'}).trim();
if(path.resolve(gitdir)!==path.resolve(root,'.git'))throw Error('A staging csak a projekt saját Git-repositoryjában futtatható.');
const list=path.join(gitdir,'atlas-publication-pathspec');
try{
  fs.writeFileSync(list,files.join('\0')+'\0');
  execFileSync('git',['add','--pathspec-from-file='+list,'--pathspec-file-nul'],{cwd:root,stdio:'inherit'});
}finally{if(fs.existsSync(list))fs.unlinkSync(list);}
console.log(`Git staging kész: ${files.length} tételesen auditált fájl${codeOnly?' (saját forráskód + engedélyezett Creator Kit, játékadatok és játékmentési képek nélkül)':''}. Következő lépés: git diff --cached --stat, majd commit/push.`);
