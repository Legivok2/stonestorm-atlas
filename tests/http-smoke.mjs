import assert from 'node:assert/strict';
import fs from 'node:fs';
const base='http://localhost:'+(process.env.PORT??4173);
const db=JSON.parse(fs.readFileSync(new URL('../data/atlas.json',import.meta.url),'utf8'));
const catalog=JSON.parse(fs.readFileSync(new URL('../data/image-catalog.json',import.meta.url),'utf8'));
const representatives=catalog.categories.flatMap(c=>{const im=catalog.entries.find(x=>x.category===c.id);return ['/'+im.originalFile,'/'+im.thumbnail];});
for(const url of ['/', '/css/style.css','/css/atlas.css','/css/atlas-tools.css','/js/content.js','/js/main.js','/js/atlas.js','/js/atlas-data.js','/js/atlas-math.js','/js/image-data.js','/js/image-store.js','/js/planner-model.js','/js/atlas-features.js','/data/atlas.json',...db.images.map(x=>'/'+x.file),...representatives]){
  const r=await fetch(base+url);assert.equal(r.status,200,url);assert((await r.arrayBuffer()).byteLength>0,url);
}
for(const url of ['/Stonestorm.html','/source-data/13_teljes_magyar_forditas.json','/.integration/starter/stonestorm-codex/dist/index.html','/Stonestorm_files/index-CObdYCUQ.js.letoltes','/js/%2e%2e%2fStonestorm.html','/js/%2e%2e%2fsource-data/00_forrasjegyzek.json','/stonestorm_image_tools/results.csv','/stonestorm_image_tools/download_images.py','/stonestorm_image_tools/downloaded/video/boss_m1.webp','/stonestorm_image_tools/downloaded/body/%2e%2e%2f%2e%2e%2fdownload_images.py']){
  const r=await fetch(base+url);assert.equal(r.status,404,url);
}
assert.equal((await fetch(base+'/js/atlas.js',{method:'HEAD'})).status,200);
assert.equal((await fetch(base+'/',{method:'POST'})).status,404);
assert.match((await fetch(base+'/data/atlas.json')).headers.get('content-type'),/application\/json/);
console.log('HTTP smoke: oldal, új CSS/JS modulok, 20 régi kép és mind a 26 kategória eredeti/előnézeti képe elérhető; mentett HTML, nyers adatok, letöltő és könyvtárbejárás tiltva.');
