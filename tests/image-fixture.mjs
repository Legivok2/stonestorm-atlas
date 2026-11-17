import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';
import {ROOT,staging,writeJSON,discover,downloadNew} from '../scripts/image-collector.mjs';import {sha256} from '../scripts/image-collector-model.mjs';
export async function imageFixture(t,{seed=false}={}){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-images-v2-'));t?.after(()=>dispose());
 const old=fs.readFileSync(path.join(ROOT,'addons/stonestorm-statcap-overlay/icons/icon-16.png')),fresh=fs.readFileSync(path.join(ROOT,'addons/stonestorm-statcap-overlay/icons/icon-32.png'));
 fs.mkdirSync(path.join(root,'legacy'),{recursive:true});fs.writeFileSync(path.join(root,'legacy/old.png'),old);
 const oldImage={id:'icons/old',name:'old',filename:'old.png',category:'icons',file:'legacy/old.png',originalFile:'legacy/old.png',thumbnail:'legacy/old.png',sha256:sha256(old),width:16,height:16,bytes:old.length,status:'identified',relations:[{kind:'item',id:'old_item',status:'identified',evidence:'fixture'}],permission:'unverified-public-reuse',sourceUrl:'https://stonestorm.gg/art/icons/old.webp'};
 const db={items:[{id:'old_item',name:'Régi kard',art:'old'},{id:'new_item',name:'Új kard',art:'new_item'}],sets:[],pets:[{id:'pet_test',name:'Tesztkísérő',art:{forms:[{form:1,imageId:oldImage.id,sha256:oldImage.sha256}]}}],bosses:[],mobs:[],mounts:[],maps:[],dungeons:[],research:[],guild:{buildings:[]},economy:{stackables:[]},homeArena:{locale:{furniture:{names:{furrug:'Szőnyeg'}},rooms:{rooms:{rest:{name:'Pihenő'}},themes:{names:{blossom:'Virágzó'}}},home:{tiers:{1:{name:'Kunyhó'}}},banditTrophy:{names:{copper:'Réztrófea'}}}}};
 writeJSON(root,'data/atlas.json',db);writeJSON(root,'data/image-catalog.json',{version:1,entries:[oldImage],categories:[{id:'icons',name:'Ikonok',count:1}],stats:{available:1,uniqueContent:1,partial:0,identified:1,unknown:0,categories:1}});writeJSON(root,'data/image-audit.json',{missing:[]});writeJSON(root,'stonestorm_image_tools/manifest.json',{icons:['old']});writeJSON(root,'snapshots/manifest.json',{resources:{}});fs.writeFileSync(path.join(root,'stonestorm_image_tools/results.csv'),'legacy log must survive\n');
 fs.mkdirSync(path.join(root,'js'),{recursive:true});fs.copyFileSync(path.join(ROOT,'js/image-store.js'),path.join(root,'js/image-store.js'));
 const refs={schema:1,images:[{url:'https://stonestorm.gg/art/icons/new_item.png'},{url:'https://stonestorm.gg/art/pets/pet_test_3.png'}]};writeJSON(root,'refs.json',refs);
 const calls=[],fetcher=async(url,options)=>{calls.push({url,options});return new Response(url.includes('pet_test_3')?old:fresh,{headers:{'Content-Type':'image/png'}});};
 const noSleep=async()=>{};
 if(seed){await discover({root,from:path.join(root,'refs.json'),sleep:noSleep});await downloadNew({root,fetcher,sleep:noSleep});}
 function dispose(){assert.equal(path.dirname(root),path.resolve(os.tmpdir()));assert(path.basename(root).startsWith('atlas-images-v2-'));fs.rmSync(root,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
 return {root,old,fresh,oldImage,db,fetcher,calls,noSleep,dispose,staging};
}
