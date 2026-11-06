import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const dir of ['js','scripts','tests'])for(const file of fs.readdirSync(path.join(root,dir)))if(/\.(?:mjs|js)$/.test(file))execFileSync(process.execPath,['--check',path.join(root,dir,file)],{stdio:'inherit'});
execFileSync(process.execPath,['--check',path.join(root,'serve.mjs')],{stdio:'inherit'});
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(ids.length,new Set(ids).size,'Ismétlődő HTML-azonosító');
for(const [,ref] of html.matchAll(/(?:src|href)="([^"#][^"]*)"/g))if(!/^(?:https?:|mailto:|data:)/.test(ref))assert(fs.existsSync(path.join(root,ref)),`Hiányzó hivatkozás: ${ref}`);
const db=JSON.parse(fs.readFileSync(path.join(root,'data/atlas.json'),'utf8'));
for(const image of db.images)assert(fs.existsSync(path.join(root,image.file)),`Hiányzó kép: ${image.file}`);
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/image-catalog.json'),'utf8'));
for(const image of catalog.entries)for(const file of [image.file,image.thumbnail,image.originalFile])assert(fs.existsSync(path.join(root,file)),`Hiányzó katalóguskép: ${file}`);
for(const file of fs.readdirSync(path.join(root,'css')))if(file.endsWith('.css')){const css=fs.readFileSync(path.join(root,'css',file),'utf8');for(const [,ref] of css.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g))if(!ref.startsWith('data:'))assert(fs.existsSync(path.resolve(root,'css',ref)),`Hiányzó CSS-erőforrás: ${ref}`);}
console.log('Szintaxis, HTML-azonosítók, helyi HTML/CSS-hivatkozások és képek: rendben.');
