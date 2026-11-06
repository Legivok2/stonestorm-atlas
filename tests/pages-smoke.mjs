import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {root,runtimeFiles,walk} from '../scripts/publication-plan.mjs';
import {createPreview} from '../scripts/serve-pages.mjs';
const local=process.argv.includes('--local-preview');
const output=path.join(root,local?'.integration/pages-preview':'dist');
const expected=runtimeFiles();
const actual=walk(output).map(file=>path.relative(output,file).split(path.sep).join('/'));
assert.deepEqual([...actual].sort(),[...expected].sort(),'A kimenet csak a tételes futásidejű fájlokat tartalmazhatja.');
const server=createPreview(output);
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const base=origin+'/stonestorm-atlas/';
try{
  let count=0;
  const queue=expected.filter(file=>file!=='.nojekyll');
  await Promise.all(Array.from({length:8},async()=>{while(queue.length){const file=queue.pop(),response=await fetch(new URL(file,base),{method:'HEAD'});assert.equal(response.status,200,file);assert.equal(Number(response.headers.get('content-length')),fs.statSync(path.join(output,file)).size,file);count++;}}));
  const html=await(await fetch(base)).text();
  for(const [,ref] of html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)){
    if(/^(?:https?:|mailto:|data:)/.test(ref))continue;
    assert(!ref.startsWith('/'),'Gyökérhez kötött hivatkozás: '+ref);
    assert.equal((await fetch(new URL(ref,base),{method:'HEAD'})).status,200,ref);
  }
  for(const file of expected.filter(x=>x.endsWith('.css'))){
    const css=fs.readFileSync(path.join(output,file),'utf8');
    for(const [,ref] of css.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g)){
      if(ref.startsWith('data:'))continue;
      assert(!ref.startsWith('/'),'Gyökérhez kötött CSS-hivatkozás: '+ref);
      assert.equal((await fetch(new URL(ref,new URL(file,base)),{method:'HEAD'})).status,200,ref);
    }
  }
  for(const suffix of ['Stonestorm.html','.env','.git/config','source-data/13_teljes_magyar_forditas.json','stonestorm_image_tools/download_images.py'])assert.equal((await fetch(base+suffix)).status,404,suffix);
  assert.equal((await fetch(origin+'/js/atlas.js')).status,404,'A prefixet nem megkerülő relatív utak szükségesek.');
  console.log(`GitHub Pages-alkönyvtár teszt: ${count} fájl HTTP 200, HTML/CSS-hivatkozások és kizárások rendben.`);
}finally{await new Promise(resolve=>server.close(resolve));}
