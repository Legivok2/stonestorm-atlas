import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse} from 'acorn';
import {sha256} from './atlas-sync-model.mjs';
import {staticModule,clientReferences} from './public-client-data.mjs';
import {contractOf} from './data-engine.mjs';
import '../js/pet-detail-model.js';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const supported={uT:'cc2485e5373c40819b024675c98f9ce6c354c1932025180f6824c92d62d4dfa5',Zr:'01902a77d7b6c8590137c428191e0e205bb70a0920f650d80b913b99376ee4ad',fT:'4fe554ec66f9bd4b964e1c05457f52036a17756533589b8910ee41fe01c4303a',Kr:'457e7c1f91df9ef74e5c1aacb2dbc0ec50581d4b71b60e442eaf1fbcf0555551',fy:'17fbe77d80b10a08d8760dfb897b7e312885ad9bf926ceb6955138ef26058796',it:'76286a6bfebdc32f7f48dd019921764f1668474f77560812e464aa15e642d7a7',Kn:'e65615cb28179da5478508d02ae1014284bcd2965b7b4dba15a24fabb20d70c4',Wn:'d1228dd5dd898db6b7ff34f8f352235eb025145ee7ce1cc5263d4c4c30140bfd',Gd:'1c1d1216e753e0b7a69b193254bbeace719eb9aa91ccbdf8007f3899c3e65108',Zt:'0be778511922dc1fe5875f4ebfcc528b3f27b7303826881d801d3c0ae2d90681'};
export function makePetModel(content,locale,client,sources,entrypointConfirmed=false){
  const ast=parse(client,{ecmaVersion:'latest',sourceType:'module'}),hashes={};
  const declarations=ast.body.flatMap(n=>n.type==='FunctionDeclaration'?[{name:n.id.name,node:n}]:n.type==='VariableDeclaration'?n.declarations.map(d=>({name:d.id.name,node:d})):[]);
  for(const name of Object.keys(supported)){const node=declarations.find(n=>n.name===name)?.node;hashes[name]=node?sha256(client.slice(node.start,node.end)):null;if(hashes[name]!==supported[name])throw Error('Megváltozott kísérőképlet: '+name+'; kézi felülvizsgálat szükséges');}
  const config=globalThis.StonestormPetDetails.publicConfig(content);if(!config)throw Error('Nem támogatott kísérőkonfiguráció');
  for(const key of ['types','forms','rarity','trait','skills','bonus'])if(!locale?.[key])throw Error('Hiányos magyar kísérőszótár: '+key);
  return {schema:1,modelVersion:'v3-form-rank-1',gameVersion:content.version,publicContract:contractOf(content.pets),config,locale:Object.fromEntries(['types','forms','rarity','trait','skills','bonus'].map(key=>[key,locale[key]])),evidence:{checkedAt:new Date().toISOString(),entrypointConfirmed,apiSha256:sha256(JSON.stringify(content)),formulaHashes:hashes,sources,scope:'Nyilvános kliensképlet; nem szerver által visszaadott egyedi végérték.'}};
}
export function buildPetAssets(root=ROOT){
  const model=JSON.parse(fs.readFileSync(path.join(root,'data/addon-pet-model.json'),'utf8'));
  if(model.schema!==1||model.modelVersion!=='v3-form-rank-1'||Object.entries(supported).some(([name,hash])=>model.evidence.formulaHashes[name]!==hash))throw Error('Ismeretlen kísérőmodell vagy képlet');
  fs.writeFileSync(path.join(root,'addons/stonestorm-statcap-overlay/pet-data.js'),'/* Generált nyilvános kísérőadat; npm run build:addon:pets. */\nglobalThis.STONESTORM_PET_MODEL = '+JSON.stringify(model).replaceAll('<','\\u003c')+';\n');
  fs.copyFileSync(path.join(root,'js/pet-detail-model.js'),path.join(root,'addons/stonestorm-statcap-overlay/pet-model.js'));
}
export async function refreshPetModel(root=ROOT){
  const fetchText=async url=>{const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('HTTP '+r.status+' '+url);const text=await r.text();if(Buffer.byteLength(text)>4*1024*1024)throw Error('Túl nagy forrás');return text;};
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'snapshots/manifest.json'),'utf8'));
  let references=[...new Set([...Object.keys(manifest.resources),...Object.values(manifest.resources).flatMap(x=>x.references??[])])],entrypointConfirmed=false;
  try{const html=await fetchText('https://stonestorm.gg/');const entry=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(x=>new URL(x[1],'https://stonestorm.gg/').href).find(x=>/^https:\/\/stonestorm\.gg\/assets\/index-[\w-]+\.js$/.test(x));if(entry){references=clientReferences(await fetchText(entry),entry);entrypointConfirmed=true;}}catch{/* 403: a már nyilvánosan hivatkozott modulok, korlátjelöléssel. */}
  const game=references.find(x=>/^https:\/\/stonestorm\.gg\/assets\/GameApp-[\w-]+\.js$/.test(x)),texts=references.find(x=>/^https:\/\/stonestorm\.gg\/assets\/texts\.hu-[\w-]+\.js$/.test(x));
  if(!game||!texts)throw Error('Nincs felismert nyilvános kísérőmodul');
  const api='https://stonestorm.gg/api/content',raw=await fetchText(api),client=await fetchText(game),translation=await fetchText(texts);
  const model=makePetModel(JSON.parse(raw),staticModule(translation).namespaces.pets,client,[{url:api,sha256:sha256(raw)},{url:game,sha256:sha256(client)},{url:texts,sha256:sha256(translation)}],entrypointConfirmed);
  fs.writeFileSync(path.join(root,'data/addon-pet-model.json'),JSON.stringify(model,null,2)+'\n');buildPetAssets(root);
  console.log('Kísérőmodell:',model.gameVersion,model.config.types.length,'faj; belépőmodul igazolt:',entrypointConfirmed);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){if(process.argv.includes('--refresh'))await refreshPetModel();else buildPetAssets();}
