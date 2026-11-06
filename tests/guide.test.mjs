import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {root,guideFiles,codeFiles,audit} from '../scripts/publication-plan.mjs';
import {guideHtml} from '../scripts/build-guide-pages.mjs';

test('A nyilvános kalauz minden fájlja az engedélyezett forráskiadásból származik',()=>{
  const files=guideFiles(),source=new Set(codeFiles());
  assert(files.length>30);
  for(const file of files)assert(source.has(file),file);
  const result=audit(files);
  for(const field of ['missing','rightsPending','secretOrPersonalFindings','largeFiles'])assert.equal(result[field].length,0,field);
});
test('A publikus HTML működő kalauzt kínál, és jelzi a teljes Atlas hiányát',()=>{
  const html=guideHtml(fs.readFileSync(path.join(root,'index.html'),'utf8'));
  assert.deepEqual([...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]),['js/content.js','js/main.js']);
  assert(!html.includes('Az Atlas betöltése'));
  assert(!html.includes('href="#atlas/'));
  assert(html.includes('még nem érhető el a nyilvános kiadásban'));
  for(const id of ['class-cards','comparison-content','daily-checklist','knowledge-search','faq-list','image-lightbox'])assert(html.includes(`id="${id}"`),id);
  assert.throws(()=>guideHtml('<html>Megváltozott sablon</html>'));
});
