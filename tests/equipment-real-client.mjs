/* Online read-only contract check: actual official JS decoder vs addon adapter.
 * No authenticated character endpoint, browser session, cookie or personal data. */
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {parse} from 'acorn';
import {fetchPublic} from '../scripts/atlas-sync.mjs';import '../addons/stonestorm-statcap-overlay/equipment-model.js';
const M=globalThis.StonestormEquipment,out='.integration/equipment-repair';fs.mkdirSync(out,{recursive:true});
const url='https://stonestorm.gg/assets/index-B-KQL_s0.js',client=await fetchPublic(url),content=await fetchPublic('https://stonestorm.gg/api/content');
assert.equal(client.sha256,'3f6b20fd9aea509a70c831d071ae179e80e9e6daa72d62cd1facfb8e291db493','The game client changed; review its decoder/GET export before enabling the adapter.');
const tree=parse(client.text,{ecmaVersion:'latest',sourceType:'module'}),names=tree.body.flatMap(n=>n.type==='VariableDeclaration'?n.declarations:[n]);
const exportX=tree.body.flatMap(n=>n.specifiers??[]).find(n=>n.exported?.name==='X')?.local.name,fn=names.find(n=>n.id?.name===exportX);
assert.equal(client.text.slice(fn.start,fn.end),'fT=()=>Wt("/api/character")');
const start=client.text.indexOf('const Kv='),end=client.text.indexOf('const S2=',start);assert(start>0&&end>start&&end-start<15000);
const sandbox=vm.createContext({});vm.runInContext(client.text.slice(start,end)+';globalThis.decode=O2;globalThis.baseValues=Xv;',sandbox,{timeout:1000});
const api=JSON.parse(content.text),config=M.publicConfig(api);let cases=0;
for(const slot of M.slots){const template=api.items.find(t=>t.slot===slot);for(let plus=0;plus<=9;plus++)for(const level of [template.level,Math.max(60,template.level)]){
 const official=JSON.parse(JSON.stringify(sandbox.baseValues(template,plus,api.lean.itemRules.plusMult,level)));assert.deepEqual(M.leanValues(template,plus,config.lean.plusMult,level),official);cases++;
}}
const items=M.slots.map((slot,i)=>({'~':1,id:'sanitized-instance-'+i,templateId:api.items.find(t=>t.slot===slot&&(t.classes===null||t.classes.includes('warrior'))).id,equippedSlot:slot}));
items.push({'~':1,id:'sanitized-free-instance',templateId:items[0].templateId,invIndex:0,plus:3,lines:[{type:'xp',value:.123}]});
const raw={lean:1,state:{id:'sanitized-owner',level:60,classId:'warrior',items}},now=Date.now();
const decoded=JSON.parse(JSON.stringify(sandbox.decode(JSON.parse(JSON.stringify(raw)),api))),official=M.captureCharacter(decoded,now,config),actual=M.captureCharacter(raw,now,config);official.wireFormat=actual.wireFormat;
assert.deepEqual(actual,official);assert(M.diagnostics(actual,config).canSave);assert(M.diagnostics(actual,config).canOptimize);
assert(actual.items.every(i=>!i.pending),'nextForge is a preview, not pending equipment');
const preset=M.presetCurrent(actual,'Saját felszerelés');assert.equal(preset.slots.weapon.id,'sanitized-instance-0');cases++;
const evidence={verifiedAt:new Date().toISOString(),actualPublicClient:true,authenticatedCharacterRead:false,cases,items:actual.items.length,equipped:8,freeItems:1,leanVersion:1,characterGET:{path:'/api/character',method:'GET',export:'X',verifiedBody:client.text.slice(fn.start,fn.end)},sources:[{url,sha256:client.sha256},{url:'https://stonestorm.gg/api/content',sha256:content.sha256}],result:'passed'};
fs.writeFileSync(out+'/public-client-results.json',JSON.stringify(evidence,null,2)+'\n');fs.writeFileSync(out+'/content.json',content.text);console.log('Official public client decoder: '+cases+' cross-checks passed; 9 sanitized items, 8 worn, 1 free. No live character access.');
