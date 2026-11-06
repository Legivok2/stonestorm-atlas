import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
export function createPreview(directory,prefix='/stonestorm-atlas/'){
  const base=path.resolve(directory);
  const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml'};
  return http.createServer((req,res)=>{
    let name;try{const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith(prefix)){res.writeHead(404).end();return;}name=decodeURIComponent(url.pathname.slice(prefix.length))||'index.html';}catch{res.writeHead(400).end();return;}
    if(!['GET','HEAD'].includes(req.method)||name.includes('\\')||name.split('/').some(p=>p==='..'||p==='.'||p.startsWith('.'))){res.writeHead(404).end();return;}
    const target=path.resolve(base,name);
    if(!target.startsWith(base+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404).end();return;}
    res.writeHead(200,{'Content-Type':types[path.extname(target)]??'application/octet-stream','Content-Length':fs.statSync(target).size,'Cache-Control':'no-cache'});
    if(req.method==='HEAD')res.end();else fs.createReadStream(target).pipe(res);
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  createPreview(path.join(root,'.integration/pages-preview')).listen(4174,'127.0.0.1',()=>console.log('Csak helyi GitHub Pages-előnézet: http://localhost:4174/stonestorm-atlas/'));
}
