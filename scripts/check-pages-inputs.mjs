import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {publicationOverrideApplies} from './publication-plan.mjs';
export function pagesReadiness(root){
  const required=['data/atlas.json','data/image-catalog.json','js/atlas-data.js','js/image-data.js'];
  const prefixes=['00_','01_','02_','03_','04_','05_','06_','07_','08_','09_','10_','11_','12_','13_'];
  const raw=fs.existsSync(path.join(root,'source-data'))?fs.readdirSync(path.join(root,'source-data')):[];
  const missing=required.filter(file=>!fs.existsSync(path.join(root,file)));
  for(const prefix of prefixes)if(!raw.some(file=>file.startsWith(prefix)&&file.endsWith('.json')))missing.push('source-data/'+prefix+'*.json');
  if(fs.existsSync(path.join(root,'data/image-catalog.json'))){
    const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/image-catalog.json'),'utf8'));
    for(const im of catalog.entries)for(const file of [im.file,im.originalFile,im.thumbnail])if(!fs.existsSync(path.join(root,file)))missing.push(file);
  }
  if(fs.existsSync(path.join(root,'data/atlas.json'))){
    const data=JSON.parse(fs.readFileSync(path.join(root,'data/atlas.json'),'utf8'));
    for(const image of data.images)if(!fs.existsSync(path.join(root,image.file)))missing.push(image.file);
  }
  const policy=JSON.parse(fs.readFileSync(path.join(root,'.publication/permissions.json'),'utf8'));
  const pending=Object.entries(policy.scopes).filter(([,scope])=>scope.status!=='confirmed'||!scope.evidence?.trim()).map(([name])=>name);
  const blockers=pending.filter(scope=>!publicationOverrideApplies(policy,scope));
  return {ready:!missing.length&&!blockers.length,missing:[...new Set(missing)],pending,blockers};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  const result=pagesReadiness(root);
  const output=`ready=${result.ready}\n`;
  if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,output);
  const message=result.ready?`A teljes Atlas adatcsomagja és közzétételi felhatalmazása rendelkezésre áll. Külön projektgazdai utasítással publikált, nem igazolt licencű csoportok: ${result.pending.join(', ')||'nincs'}.`:`A teljes Atlas nem publikálható. Hiányzó adat/asset: ${result.missing.length}; hiányzó felhatalmazás: ${result.blockers.join(', ')}. Nem helyettesítjük másik oldallal.`;
  console.log(message);
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'## Pages-készenlét\n\n'+message+'\n');
  if(!result.ready&&process.argv.includes('--require-full'))process.exitCode=1;
}
