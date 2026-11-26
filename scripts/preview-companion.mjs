/* Local, labelled UI demo. Explicit route allowlist; synthetic data only. */
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {character,api,html,gameScript,reactRuntime} from '../tests/fixtures/companion-page.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),addon=path.join(root,'addons/stonestorm-statcap-overlay'),manifest=JSON.parse(fs.readFileSync(path.join(addon,'manifest.json'))),art=new Map(JSON.parse(fs.readFileSync(path.join(root,'data/image-catalog.json'))).entries.map(e=>[e.id,e.file])),runtime=reactRuntime();
const setup=String.raw`(()=>{const key='stonestorm-companion-demo.v1',listeners=[];let data={};try{data=JSON.parse(localStorage.getItem(key)||'{}');}catch{}window.demoFirstOpen=!data['stonestormCompanion.ui.v1'];const read=keys=>Object.fromEntries((typeof keys==='string'?[keys]:keys??Object.keys(data)).filter(k=>Object.hasOwn(data,k)).map(k=>[k,data[k]]));window.chrome={runtime:{id:'companion-local-demo',getManifest:()=>({version:'0.11.0'}),getURL:p=>'/addon/'+p,onMessage:{addListener(){}}},storage:{local:{get(keys,cb){const result=read(keys);queueMicrotask(()=>cb?.(result));return Promise.resolve(result);},set(patch,cb){const changes={};for(const [k,v]of Object.entries(patch)){changes[k]={oldValue:data[k],newValue:v};data[k]=v;}try{localStorage.setItem(key,JSON.stringify(data));}catch{}queueMicrotask(()=>{cb?.();listeners.forEach(fn=>fn(changes,'local'));});return Promise.resolve();},remove(keys,cb){for(const k of Array.isArray(keys)?keys:[keys])delete data[k];try{localStorage.setItem(key,JSON.stringify(data));}catch{}queueMicrotask(()=>cb?.());return Promise.resolve();}},onChanged:{addListener(fn){listeners.push(fn);}}}};})();`;
const seed='(async()=>{const raw='+JSON.stringify(character())+';const s=StonestormEquipment.captureCharacter(raw);const names=["Fejlődés","Nyangvadász","Alapfelszerelés"];const prior=await StonestormEquipmentStorage.load(raw.id);if(!prior.presets.some(Boolean))for(let i=0;i<3;i++)await StonestormEquipmentStorage.change(raw.id,p=>StonestormEquipment.updatePreset(p,raw.id,i,StonestormEquipment.presetCurrent(s,names[i])));await fetch("/api/content");await fetch("/api/character");if(window.demoFirstOpen)chrome.storage.local.set({"stonestormCompanion.ui.v1":{...StonestormCompanionApp.preferences(),open:true,tab:"overview",mode:innerWidth>1000?"full":"normal"}});})();';
const scripts=[...new Set(manifest.content_scripts.flatMap(g=>g.js))],page=html.replace('<script src="/fixture/react.js">','<script src="/preview/setup.js"></script><script src="/fixture/react.js">').replace('</html>',scripts.map(file=>'<script src="/addon/'+file+'"></script>').join('')+'<script src="/preview/seed.js"></script></html>');
const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.webp':'image/webp','.png':'image/png'};
const server=http.createServer((request,response)=>{let p;try{p=new URL(request.url,'http://localhost').pathname;}catch{response.writeHead(400).end();return;}
 const send=(type,body)=>{response.writeHead(200,{'Content-Type':type+(type.startsWith('text/')?'; charset=utf-8':''),'Cache-Control':'no-store'});response.end(body);};
 if(request.method!=='GET'){response.writeHead(405).end('Read-only local demo');return;}
 if(p==='/'||p==='/city')return send('text/html',page);
 if(p==='/preview/setup.js')return send('text/javascript',setup);
 if(p==='/preview/seed.js')return send('text/javascript',seed);
 if(p==='/fixture/react.js')return send('text/javascript',runtime);
 if(p==='/fixture/companion-game.js')return send('text/javascript',gameScript);
 if(p==='/api/content')return send('application/json',JSON.stringify(api));
 if(p==='/api/character')return send('application/json',JSON.stringify({state:character()}));
 if(p==='/api/home/rooms')return send('application/json',JSON.stringify({rooms:[{id:'rest',rules:{dailyLimit:3}}]}));
 if(p.startsWith('/addon/')&&scripts.includes(p.slice(7)))return send('text/javascript',fs.readFileSync(path.join(addon,p.slice(7)),'utf8').replaceAll('https://stonestorm.gg/art/','/art/'));
 if(p.startsWith('/art/')){const id=p.slice(5).replace(/\.webp$/,'');if(art.has(id))return send('image/webp',fs.readFileSync(path.join(root,art.get(id))));}
 response.writeHead(404).end('Local sample preview: no game service or account connection.');
});
const port=Number(process.env.COMPANION_PREVIEW_PORT||4318);server.listen(port,'127.0.0.1',()=>console.log('Stonestorm Companion helyi előnézet: http://127.0.0.1:'+server.address().port+'/ · mintaadatok, nincs játékfiók-kapcsolat.'));
