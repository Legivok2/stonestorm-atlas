import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
import {ROOT,staging,loadState,catalogInputs,safeFile,discover,downloadNew,saveReview,importMappings,prepareImport,writeJSON} from './image-collector.mjs';
import {targets,report,mappingExport,importReferences,sha256,categoryNames} from './image-collector-model.mjs';
const UI=path.join(ROOT,'stonestorm_image_tools/image-manager');
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
export function createImageManager({root=ROOT,fetcher=fetch,sleep}={}){
 const token=crypto.randomBytes(24).toString('hex');let job={busy:false,message:'Még nem indult művelet.'};
 const stateView=()=>{const state=loadState(root),catalog=catalogInputs(root).catalog;return {schema:2,revision:state.revision,report:report(state),discovery:state.discovery,downloadBlock:state.downloadBlock,job,candidates:state.candidates.filter(c=>!['known','legacy-missing'].includes(c.change)).map(c=>({...c,preview:c.file?'/api/image/'+c.key:null,existing:(c.existingIds??[]).map(id=>catalog.entries.find(e=>e.id===id)).filter(Boolean).map(e=>({id:e.id,title:e.title,relations:e.relations}))}))};};
 const start=(label,fn)=>{if(job.busy)throw Error('Már fut egy művelet.');job={busy:true,message:label};Promise.resolve().then(fn).then(result=>{job={busy:false,message:label+' kész.',result:result?.schema?report(result):result};}).catch(e=>{job={busy:false,message:e.message,error:true};});};
 async function body(req){const chunks=[];let n=0;for await(const chunk of req){n+=chunk.length;if(n>4*1024*1024)throw Error('Legfeljebb 4 MiB importálható');chunks.push(chunk);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
 return http.createServer(async(req,res)=>{
   res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data: blob:; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");res.setHeader('Referrer-Policy','no-referrer');
   try{
     const address=req.socket.remoteAddress;if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(address))return json(res,403,{error:'Csak helyi hozzáférés.'});
     const port=req.socket.localPort,hosts=new Set(['127.0.0.1:'+port,'localhost:'+port]);if(!hosts.has(req.headers.host))return json(res,403,{error:'Nem engedélyezett Host.'});
     if(req.headers.origin&&!['http://127.0.0.1:'+port,'http://localhost:'+port].includes(req.headers.origin))return json(res,403,{error:'Külső webhelyről nem elérhető.'});
     const url=new URL(req.url,'http://127.0.0.1:'+port),p=url.pathname;
     if(req.method==='GET'&&p==='/api/bootstrap')return json(res,200,{token,records:targets(catalogInputs(root).db),categoryNames});
     if(req.method==='GET'&&p==='/api/state')return json(res,200,stateView());
     if(req.method==='GET'&&p==='/api/mappings'){res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="atlas-image-mappings.json"','Cache-Control':'no-store'});return res.end(JSON.stringify(mappingExport(loadState(root)),null,2)+'\n');}
     if(req.method==='GET'&&p.startsWith('/api/image/')){
       const key=p.slice('/api/image/'.length);if(!/^[a-f0-9]{64}$/.test(key))return json(res,404,{error:'Ismeretlen kép'});const candidate=loadState(root).candidates.find(c=>c.key===key),relative=url.searchParams.get('original')==='1'?candidate?.file:candidate?.thumbnail??candidate?.file;
       const allowed=catalogInputs(root).catalog.entries.some(e=>[e.file,e.originalFile,e.thumbnail].includes(relative))||relative?.startsWith(staging+'/files/')||relative?.startsWith(staging+'/thumbs/');if(!candidate||!relative||!allowed)return json(res,404,{error:'A kép még nincs letöltve.'});const file=safeFile(root,relative);res.writeHead(200,{'Content-Type':relative.endsWith('.webp')?'image/webp':candidate.format==='JPEG'?'image/jpeg':'image/'+candidate.format?.toLowerCase(),'Cache-Control':'private, max-age=60'});return fs.createReadStream(file).pipe(res);
     }
     if(req.method==='POST'){
       if(req.headers['x-atlas-manager-token']!==token||!req.headers['content-type']?.startsWith('application/json'))return json(res,403,{error:'Hiányzó helyi munkamenet-azonosító.'});const data=await body(req);
       if(p==='/api/review'){saveReview(root,data.key,data);return json(res,200,stateView());}
       if(p==='/api/import-mappings'){importMappings(root,data);return json(res,200,stateView());}
       if(p==='/api/discover'){start('Nyilvános hivatkozások felderítése',()=>discover({root,fetcher,sleep}));return json(res,202,{job});}
       if(p==='/api/download-new'){start('Legfeljebb 40 új kép letöltése',()=>downloadNew({root,fetcher,sleep,limit:40}));return json(res,202,{job});}
       if(p==='/api/import-references'){
         const clean=importReferences(data);if(!clean.images.length)throw Error('Nem található engedélyezett, nyilvános képhivatkozás.');const safe={schema:1,images:clean.images.map(r=>({url:r.url,...r.expectedSha256?{sha256:r.expectedSha256}:{}}))},file=staging+'/imports/'+sha256(JSON.stringify(safe))+'.json';writeJSON(root,file,safe);
         start('Böngészős hivatkozáslista feldolgozása',()=>discover({root,fetcher,sleep,from:safeFile(root,file)}));return json(res,202,{job,ignored:clean.rejected.length});
       }
       if(p==='/api/prepare-import'){if(job.busy)throw Error('Várd meg a letöltés végét.');return json(res,200,prepareImport(root));}
       return json(res,404,{error:'Ismeretlen művelet.'});
     }
     const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css','/browser-export.js':'browser-export.js'};
     if(req.method==='GET'&&files[p]){const file=path.join(UI,files[p]);res.writeHead(200,{'Content-Type':p.endsWith('.js')?'application/javascript; charset=utf-8':p.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(fs.readFileSync(file));}
     json(res,404,{error:'Nincs ilyen oldal.'});
   }catch(e){json(res,400,{error:e.message});}
 });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const i=process.argv.indexOf('--port'),port=i<0?4174:Number(process.argv[i+1]);if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Érvénytelen port');const server=createImageManager();server.on('error',e=>{console.error(e.message);process.exitCode=1;});server.listen(port,'127.0.0.1',()=>console.log('Atlas Image Manager: http://127.0.0.1:'+port+'/ — csak helyi használat, az Atlas változatlan.'));
}
