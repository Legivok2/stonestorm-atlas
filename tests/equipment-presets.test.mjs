import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import vm from 'node:vm';import {webcrypto} from 'node:crypto';
import {fixture,api,M} from './fixtures/equipment-presets-fixture.mjs';
import '../addons/stonestorm-statcap-overlay/equipment-switcher.js';
const T=globalThis.StonestormEquipmentSwitch;
function target(f){const s=f.snapshot(),gear=M.current(s);gear.weapon='alternative';return {s,gear,p:M.preset(s,gear,f.config,'XP szett')};}
test('All six Atlas families retain their 2/4/6 thresholds and apply the current client capScale',()=>{
  const c=M.publicConfig(api),db=JSON.parse(fs.readFileSync(new URL('../data/atlas.json',import.meta.url)));for(const set of db.sets)assert.deepEqual(c.sets.find(x=>x.id===set.id)?.bonuses,set.bonuses.map(b=>({...b,stats:b.stats.map(s=>({...s,value:Math.round(s.value*(api.spine.lines.capScale[s.stat]??1)*1e12)/1e12}))})));assert.deepEqual(c.sets[0].bonuses.map(x=>x.pieces),[2,4,6]);assert.equal(c.sets[1].bonuses[2].stats[0].value,.04232813);
});
test('Passive projection keeps distinct instance IDs, omits names/account/wallet and fails ambiguous IDs',()=>{
  const f=fixture();f.add('weapon','one',[{type:'xp',value:.1}]);f.add('weapon','two',[{type:'xp',value:.2}],{plus:8});const s=f.snapshot();M.validateSnapshot(s,f.config);assert.equal(s.items.at(-1).templateId,s.items.at(-2).templateId);assert.notEqual(s.items.at(-1).id,s.items.at(-2).id);assert(!/PRIVATE_|wallet|accountId/.test(JSON.stringify(s)));s.items.at(-1).id='one';assert.throws(()=>M.validateSnapshot(s,f.config),/Ütköző/);
});
test('Exactly three named presets save eight concrete slots without game changes; rename/delete preserve other slots',()=>{
  const f=fixture(),s=f.snapshot(),before=JSON.stringify(s);let store=M.emptyPresets(s.ownerId);for(let i=0;i<3;i++)store=M.updatePreset(store,s.ownerId,i,M.preset(s,M.current(s),f.config,'Szett '+i));assert.equal(store.presets.length,3);assert.equal(Object.keys(store.presets[0].slots).length,8);assert.equal(store.presets[0].slots.weapon.id,'worn-weapon');store=M.renamePreset(store,s.ownerId,1,'Boss szett');assert.equal(store.presets[1].name,'Boss szett');store=M.updatePreset(store,s.ownerId,0,null);assert.equal(store.presets[0],null);assert.equal(store.presets[2].name,'Szett 2');assert.throws(()=>M.updatePreset(store,s.ownerId,3,null));assert.equal(JSON.stringify(s),before);
});
test('Missing instance, reused ID/template, wrong slot, class, level and pending modification all stop preset resolution',()=>{
  const f=fixture();f.add('weapon','alternative');const {s,gear,p}=target(f);s.items=s.items.filter(x=>x.id!=='alternative');assert.throws(()=>M.presetGear(p,s,f.config),/már nincs/);
  for(const patch of [{level:61},{classes:['mage_blade']},{pending:true},{restricted:true},{slot:'armor'}]){const s=f.snapshot();Object.assign(s.items.at(-1),patch);assert.throws(()=>M.resolve(s,gear,f.config));}
  const changed=M.copy(p);changed.slots.weapon.templateId='not-the-original';assert.throws(()=>M.presetGear(changed,f.snapshot(),f.config),/tárgyazonosság/);
});
test('Character identity is independent of class/name; another character cannot load or apply its presets',()=>{
  const f=fixture(),s=f.snapshot(),p=M.preset(s,M.current(s),f.config,'Saját');const other=M.copy(s);other.ownerId='mock-character-B';assert.throws(()=>M.presetGear(p,other,f.config),/másik karakter/);assert.throws(()=>M.validateStore(M.emptyPresets(s.ownerId),other.ownerId));assert.notEqual(M.key(1),M.key('1'));
});
test('Inventory capacity and conservative unequip/equip plan reject full bags; only necessary swaps occur',()=>{
  const f=fixture();f.config.inventoryBase=1;f.add('weapon','alternative');const {s,gear}=target(f);assert.throws(()=>T.plan(s,gear,f.config),/szabad inventoryhely/);f.config.inventoryBase=2;const plan=T.plan(s,gear,f.config);assert.deepEqual(plan.operations,[{kind:'unequip',slot:'weapon'},{kind:'equip',slot:'weapon',itemId:'alternative'}]);assert.equal(T.plan(s,M.current(s),f.config).operations.length,0);
});
test('XP optimizer searches whole combinations and selects weaker individual lines for a 4-piece XP set',async()=>{
  const f=fixture(),family=f.config.sets[0];family.bonuses=[{pieces:2,stats:[{stat:'xp',value:.04}]},{pieces:4,stats:[{stat:'xp',value:.6}]}];
  for(const sl of ['weapon','armor','helmet','bracelet']){f.raw.items.find(x=>x.slot===sl).lines=[{type:'xp',value:.08}];f.add(sl,'set-'+sl,[{type:'xp',value:.01}],{flags:{setId:family.id,uniqueId:null}});}
  const s=f.snapshot(),before=JSON.stringify(s),result=await M.optimize(s,f.config,'xp');assert(result.optimal);assert(result.gear.weapon.startsWith('set-'));assert.equal(result.evaluation.sets.at(-1).pieces,4);assert(Math.abs(result.evaluation.metrics.xp.effective-.68)<1e-12);assert.equal(JSON.stringify(s),before);
});
test('Nyang uses effective normal/paid caps and keeps current gear on capped ties',async()=>{
  const f=fixture();f.raw.mods.nyangMult=1.9;f.raw.mods.nyangPaid=.2;f.raw.items[0].lines=[{type:'nyang',value:.3}];f.add('weapon','alternative',[{type:'nyang',value:.9}]);const s=f.snapshot(),result=await M.optimize(s,f.config,'nyang');assert.equal(result.gear.weapon,'worn-weapon');assert.equal(result.evaluation.metrics.nyang.effective,1.2);assert.equal(result.changed,0);
});
test('Known lack of equipment drop gives no pointless swap; unsupported Harcerő and unknown stats are explicit',async()=>{
  const f=fixture(),s=f.snapshot();assert.equal((await M.optimize(s,f.config,'drop')).changed,0);await assert.rejects(M.optimize(s,f.config,'harcero'),/igazolt/);s.items[0].lines=[{type:'inventedDropBonus',value:1}];assert.throws(()=>M.validateSnapshot(s,f.config),/ismeretlen bónusz/);
});
test('Polishing fallback uses observed numerical bonuses; explicit lines are never polished twice',()=>{
  const f=fixture();delete f.raw.items[0].lines;f.raw.items[0].bonuses=[{type:'xp',value:.1}];f.raw.items[0].polish=3;let s=f.snapshot();M.validateSnapshot(s,f.config);assert(Math.abs(M.evaluate(s,M.current(s),f.config).total.xp-(.1+.035*3*.06))<1e-12);f.raw.items[0].lines=[{type:'xp',value:.1}];s=f.snapshot();assert.equal(M.evaluate(s,M.current(s),f.config).total.xp,.1);
});
test('Unknown external totals and HP/defence projections remain partial, not fabricated final stats',()=>{
  const f=fixture();f.add('armor','armor2',[],{values:{...f.raw.items[1].values,def:200}});const s=f.snapshot();s.mods.xpMult=null;const gear=M.current(s);gear.armor='armor2';const ev=M.evaluate(s,gear,f.config);assert.equal(ev.metrics.xp.effective,null);assert(ev.metrics.xp.partial);assert(ev.metrics.defence.partial);assert.equal(ev.metrics.harcero.value,null);
});
test('Budget exhaustion and cancellation never claim a global optimum or change equipment',async()=>{
  const f=fixture();f.add('weapon','alternative',[{type:'xp',value:.5}]);const s=f.snapshot(),before=JSON.stringify(s),result=await M.optimize(s,f.config,'xp',{maxNodes:1});assert.equal(result.optimal,false);const abort=new AbortController();abort.abort();await assert.rejects(M.optimize(s,f.config,'xp',{signal:abort.signal}),/megszakítva/);assert.equal(JSON.stringify(s),before);
});
test('Mock execution rereads, confirms once, verifies every step and preserves actual instance inventory',async()=>{
  const f=fixture();f.add('weapon','alternative');const {s,p}=target(f),adapter=T.createMockAdapter(s,f.config);let confirmations=0;const result=await T.controller().run({adapter,preset:p,config:f.config,confirm:async preview=>{confirmations++;assert.equal(preview.changes[0].before,'worn-weapon');return true;}});assert.equal(result.status,'completed');assert.equal(confirmations,1);assert.equal(result.completed.length,2);assert.equal(M.current(result.state).weapon,'alternative');assert.equal(M.current(s).weapon,'worn-weapon');
});
test('No confirmation or live adapter can initiate a swap; every destructive/unknown operation is denied',async()=>{
  const f=fixture();f.add('weapon','alternative');const {s,p}=target(f),adapter=T.createMockAdapter(s,f.config);assert.equal((await T.controller().run({adapter,preset:p,config:f.config,confirm:async()=>false})).status,'cancelled');assert.equal(adapter.calls.length,0);await assert.rejects(T.controller().run({adapter:{...adapter,mode:'live'},preset:p,config:f.config,confirm:async()=>true}),/Éles/);
  for(const kind of ['sell','discard','destroy','delete','dismantle','forge','upgrade','buy','lock','move','sort','claim','Equip','/api/inventory/sell',null,undefined])assert.throws(()=>T.assertOperations([{kind,slot:'weapon',itemId:'alternative'}]));assert.deepEqual(T.allowed,['equip','unequip']);
});
test('Server rejection and wrong results stop immediately, report partial actual state and never retry',async()=>{
  const f=fixture();f.add('weapon','alternative');const {s,p}=target(f);let attempts=0;const adapter=T.createMockAdapter(s,f.config);adapter.equip=async()=>{attempts++;throw Error('Mock server rejected equip');};const result=await T.controller().run({adapter,preset:p,config:f.config,confirm:async()=>true});assert.equal(result.status,'stopped');assert.equal(attempts,1);assert.equal(result.completed.length,1);assert.equal(M.current(result.state).weapon,null);
  const wrong=T.createMockAdapter(s,f.config);wrong.unequip=async()=>{};const bad=await T.controller().run({adapter:wrong,preset:p,config:f.config,confirm:async()=>true});assert.equal(bad.status,'stopped');assert.equal(wrong.calls.length,0);
});
test('Double click cannot run parallel changes; character change during confirmation cancels all operations',async()=>{
  const f=fixture();f.add('weapon','alternative');const {s,p}=target(f),adapter=T.createMockAdapter(s,f.config),runner=T.controller();let release;const first=runner.run({adapter,preset:p,config:f.config,confirm:()=>new Promise(r=>release=r)});while(!release)await new Promise(r=>setTimeout(r,0));await assert.rejects(runner.run({adapter,preset:p,config:f.config,confirm:async()=>true}),/folyamatban/);release(false);await first;
  let reads=0;const changing={...adapter,async read(){const v=await adapter.read();if(++reads>1)v.ownerId='other-character';return v;}};const result=await runner.run({adapter:changing,preset:p,config:f.config,confirm:async()=>true});assert.equal(result.status,'stopped');assert.equal(adapter.calls.length,0);
});
test('Closing/cancelling during the rehearsal stops subsequent operations and retains the last actual state',async()=>{
  const f=fixture();f.add('weapon','alternative');const {s,p}=target(f),adapter=T.createMockAdapter(s,f.config),abort=new AbortController(),unequip=adapter.unequip;adapter.unequip=async slot=>{await unequip(slot);abort.abort();};const result=await T.controller().run({adapter,preset:p,config:f.config,confirm:async()=>true,signal:abort.signal});assert.equal(result.status,'stopped');assert.equal(result.completed.length,0);assert.equal(result.attempted.length,1);assert.equal(adapter.calls.length,1);assert.equal(M.current(result.state).weapon,null);
});
test('New production modules contain no HTTP writer, general action dispatcher or game button automation',()=>{
  for(const file of ['equipment-model.js','equipment-capture.js','equipment-switcher.js','equipment-storage.js','equipment-ui.js']){const code=fs.readFileSync(new URL('../addons/stonestorm-statcap-overlay/'+file,import.meta.url),'utf8');assert(!/\bfetch\s*\(|XMLHttpRequest|\.click\s*\(|dispatchAction\s*\(|\.execute\s*\(/.test(code),file);}
});
test('A hanging operation is bounded, never retried, and returns the last readable mock state',async()=>{
  const f=fixture();f.add('weapon','alternative');const {s,p}=target(f),adapter=T.createMockAdapter(s,f.config);let calls=0;adapter.unequip=()=>{calls++;return new Promise(()=>{});};const result=await T.controller().run({adapter,preset:p,config:f.config,confirm:async()=>true,timeoutMs:10});assert.equal(result.status,'stopped');assert.match(result.error,/időkorlát/);assert.equal(calls,1);assert.equal(result.attempted.length,1);assert.equal(M.current(result.state).weapon,'worn-weapon');
});
test('Class/level changes after a sent operation stop before any subsequent equip',async()=>{
  const f=fixture();f.add('weapon','alternative');const {s,p}=target(f),adapter=T.createMockAdapter(s,f.config);let reads=0;const read=adapter.read;adapter.read=async()=>{const state=await read();if(++reads>=4)state.classId='mage_blade';return state;};const result=await T.controller().run({adapter,preset:p,config:f.config,confirm:async()=>true});assert.equal(result.status,'stopped');assert.equal(adapter.calls.length,1);assert.equal(result.state.classId,'mage_blade');
});
test('Corrupt stored presets, duplicate instances and control-only names fail without repairing over saved data',()=>{
 const f=fixture(),s=f.snapshot(),store=M.emptyPresets(s.ownerId),p=M.preset(s,M.current(s),f.config,'Valid');assert.throws(()=>M.updatePreset(store,s.ownerId,0,{schema:1,owner:store.owner}));const duplicate=M.copy(p);duplicate.slots.armor=duplicate.slots.weapon;assert.throws(()=>M.updatePreset(store,s.ownerId,0,duplicate));assert.throws(()=>M.preset(s,M.current(s),f.config,'\u0000'));assert.deepEqual(store.presets,[null,null,null]);
});
test('Dominance pruning retains set families and current capped ties while bounding large duplicate inventories',async()=>{
 const f=fixture();f.config.inventoryBase=1000;for(const sl of M.slots)for(let i=0;i<30;i++)f.add(sl,'many-'+sl+'-'+i,[{type:'xp',value:(i%6)/100}]);const result=await M.optimize(f.snapshot(),f.config,'xp');assert(result.optimal);assert(Math.abs(result.evaluation.total.xp-.4)<1e-12);assert(result.nodes<1000);
});
test('Two independent tabs saving different slots from stale reads preserve both presets',async()=>{
 const values={},waiting=[];let block=true;const chrome={runtime:{},storage:{local:{get(keys,callback){const snapshot=Object.fromEntries(keys.filter(k=>Object.hasOwn(values,k)).map(k=>[k,structuredClone(values[k])]));if(block){waiting.push(()=>callback(snapshot));if(waiting.length===2){block=false;for(const done of waiting)queueMicrotask(done);}}else queueMicrotask(()=>callback(snapshot));},set(patch,callback){Object.assign(values,structuredClone(patch));queueMicrotask(callback);}}}};
 const code=fs.readFileSync(new URL('../addons/stonestorm-statcap-overlay/equipment-storage.js',import.meta.url),'utf8'),tabs=[0,1].map(()=>{const context=vm.createContext({StonestormEquipment:M,chrome,crypto:webcrypto,TextEncoder});vm.runInContext(code,context);return context.StonestormEquipmentStorage;});
 const f=fixture(),s=f.snapshot();await Promise.all(tabs.map((tab,index)=>tab.change(s.ownerId,store=>M.updatePreset(store,s.ownerId,index,M.preset(s,M.current(s),f.config,'Tab '+index)))));const result=await tabs[0].load(s.ownerId);assert.equal(result.presets[0].name,'Tab 0');assert.equal(result.presets[1].name,'Tab 1');assert.equal(result.presets[2],null);
});
test('Unknown set/unique flags fail closed and effective item-level requirements follow the current client',()=>{
 const f=fixture();f.raw.items[0].flags={setId:{unexpected:'object'},uniqueId:null};assert.throws(()=>M.validateSnapshot(f.snapshot(),f.config),/Ismeretlen szett/);f.raw.items[0].flags={setId:null,uniqueId:'unreviewed-unique'};assert.throws(()=>M.validateSnapshot(f.snapshot(),f.config),/Ismeretlen egyedi/);f.raw.items[0].flags={};f.raw.items[0].itemLevel=99;const s=f.snapshot();assert.equal(s.items[0].level,99);assert.throws(()=>M.resolve(s,M.current(s),f.config),/Szint/);
});
