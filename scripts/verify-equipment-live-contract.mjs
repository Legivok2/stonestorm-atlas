/* Public, read-only evidence check. Never accesses an authenticated character. */
import fs from 'node:fs';import assert from 'node:assert/strict';import {parse} from 'acorn';import {fetchPublic} from './atlas-sync.mjs';
const dir='.integration/equipment-live';fs.mkdirSync(dir,{recursive:true});const sources=[];
const entry=await fetchPublic('https://stonestorm.gg/');
assert(entry.text.includes('/assets/index-B-KQL_s0.js'),'Entry module unavailable or changed; do not enable an unreviewed adapter.');
sources.push({url:'https://stonestorm.gg/',sha256:entry.sha256});
for(const file of ['index-B-KQL_s0.js','ItemSheet-BWXvXj86.js','CharacterPage-B704UG3d.js','PaperDoll-9vgjPIDj.js','GameApp-C3ojBE57.js']){const url='https://stonestorm.gg/assets/'+file,r=await fetchPublic(url);fs.writeFileSync(dir+'/'+(file.startsWith('index-')?'current-index.js':file),r.text);sources.push({url,sha256:r.sha256});}
assert.equal(sources[1].sha256,'3f6b20fd9aea509a70c831d071ae179e80e9e6daa72d62cd1facfb8e291db493');
const src=fs.readFileSync(dir+'/current-index.js','utf8'),tree=parse(src,{ecmaVersion:'latest',sourceType:'module'}),nodes=tree.body.flatMap(n=>n.type==='VariableDeclaration'?n.declarations:[n]),exports=tree.body.flatMap(n=>n.specifiers??[]),code=key=>{const exp=exports.find(e=>e.exported?.name===key),node=nodes.find(n=>n.id?.name===exp?.local?.name);assert(node,key);return src.slice(node.start,node.end);};
assert.equal(code('b3'),'MC=e=>yt("/api/inventory/equip",{itemId:e})');assert.equal(code('dA'),'IC=e=>yt("/api/inventory/unequip",{slot:e})');assert.equal(code('X'),'fT=()=>Wt("/api/character")');assert.equal(code('by'),'Ux=()=>S_');
assert(src.includes('function wE(e,l){return e==="GET"||l.idempotent===!0||oT(l.body)}'));assert(src.includes('function oT(e){return typeof e=="object"&&e!==null&&"requestId"in e}'));
assert(src.includes('yt=(e,l)=>J1(Wt(e,{method:"POST",body:l}))'));
assert(code('a').includes('setState(r,c=Date.now()){eE(r==null?void 0:r.petArt),e({state:UE(r,l().launch),phase:"ready",syncedAt:c})}'));
const sheet=fs.readFileSync(dir+'/ItemSheet-BWXvXj86.js','utf8');assert(sheet.includes('const l=_?await Me(s.slot):await Re(s.id);d(l.state),i()'));assert(sheet.includes('L=s.classes===null||s.classes.includes(n.classId)'));
const page=fs.readFileSync(dir+'/CharacterPage-B704UG3d.js','utf8');for(const selector of ['data-inv','inv-grid__item','pdoll__slot'])assert(page.includes(selector));
const game=fs.readFileSync(dir+'/GameApp-C3ojBE57.js','utf8');assert(game.includes('function dy(e,t,n=8){const s=t+n*e.extraSlots,o=e.items.filter(r=>r.invIndex!==null).length;return{size:s,used:o,free:Math.max(0,s-o)}}'));
const content=await fetchPublic('https://stonestorm.gg/api/content'),api=JSON.parse(content.text);sources.push({url:'https://stonestorm.gg/api/content',sha256:content.sha256});assert.equal(api.version,'fbc93606674a');
fs.writeFileSync(dir+'/sources-current.json',JSON.stringify(sources,null,2)+'\n');console.log('Verified current public client: equip/unequip exports, original store update, inventory/requirements, no POST retries; no live character action.');
