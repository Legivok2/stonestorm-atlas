import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT??4173);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{
  let name;
  try {name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';} catch {res.writeHead(400).end();return;}
  const clean=!name.split('/').some(part=>part==='.'||part==='..'||part.startsWith('.'));
  const allowed=clean&&(name==='index.html'||/^(?:css|js|assets|data)\/[a-zA-Z0-9_./-]+$/.test(name)||/^Stonestorm_files\/[a-zA-Z0-9_-]+\.webp$/.test(name)||/^stonestorm_image_tools\/downloaded\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.webp$/.test(name));
  const file=path.resolve(root,name);
  if(!['GET','HEAD'].includes(req.method)||!allowed||!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()) {res.writeHead(404).end('Nem található');return;}
  const image=/\.(?:webp|png|svg)$/.test(name);
  const cache=name.startsWith('assets/catalog-thumbs/')?'public, max-age=31536000, immutable':image?'public, max-age=3600':'no-cache';
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]??'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':cache});
  if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);
});
server.on('error',e=>{console.error(e.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`Stonestorm Atlas: http://localhost:${port}`));
