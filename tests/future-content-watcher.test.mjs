import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {watchContent,imageCollectorReferences,packWatcher,unpackWatcher} from '../scripts/future-content-watcher.mjs';
import {analyzeContent} from '../scripts/future-content-analyzers.mjs';
import {staticClientEvidence} from '../scripts/future-content-client.mjs';
import {runFutureSync,futureStateFiles} from '../scripts/future-content-sync.mjs';
import {queueNotifications,deliverNotifications} from '../scripts/notify-future-content.mjs';
import {API,sha256} from '../scripts/atlas-sync-model.mjs';
import {inspectResources} from '../scripts/atlas-sync.mjs';
const content=JSON.parse(fs.readFileSync(new URL('../snapshots/current/content.json',import.meta.url))),now='2026-11-20T20:00:00Z';
const clone=()=>structuredClone(content),run=(c,previous=null,extra={})=>watchContent({content:c,previous,now,sourceHash:sha256(JSON.stringify(c)),...extra});
const find=(s,category,key)=>s.observations.find(x=>x.category===category&&x.key===key);
function workspace(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-future-qa-'));t.after(()=>{assert(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep+'atlas-future-qa-'));fs.rmSync(root,{recursive:true,force:true});});return root;}
test('Watcher baseline is quiet and status does not equate API presence with activation',()=>{
  const c=clone(),a=run(c),b=run(c,a,{now:'2026-11-21T00:00:00Z'});assert.equal(a.schema,2);assert.deepEqual(a.newIds,[]);assert.equal(a.notificationEvents.length,0);assert.equal(b.changed,false);assert.equal(b.events.length,a.events.length);
  assert.equal(find(a,'maps','m1').status,'prepared');assert.equal(find(a,'features','homeRooms').status,'prepared');assert.equal(a.summary.maxLevel,c.limits.maxLevel);assert.equal(a.summary.equipmentMaxLevel,Math.max(...c.items.map(x=>x.level)));
  const active=run(c,b,{activationEvidence:[{category:'maps',key:'m1',kind:'game-observation',verified:true,source:'https://stonestorm.gg/',observedAt:now,explanation:'Documented game observation in fixture'}]});assert.equal(find(active,'maps','m1').status,'active');assert(active.notificationEvents.some(x=>x.category==='maps'));
});
test('Explicit 60→99 limit and XP expansion are found; level-62 enemy is not hero-cap evidence',()=>{
  const c=clone(),base=run(c),enemy=clone();enemy.dungeons[0].heroic.rooms[0].level=62;const wrong=run(enemy,base,{previousContent:c});assert.equal(wrong.summary.maxLevel,c.limits.maxLevel);assert(!wrong.newEventIds.some(id=>wrong.events.find(x=>x.id===id).kind==='limit-raised'));
  const next=clone();next.limits.maxLevel=99;next.spine.xpTable.push(...Array(39).fill(100000));const a=run(next,base,{previousContent:c});assert.equal(a.summary.maxLevel,99);assert(a.notificationEvents.some(x=>x.kind==='limit-raised'&&x.before===60&&x.after===99));assert(a.notificationEvents.some(x=>x.kind==='table-expanded'));assert.equal(run(next,a).newEventIds.length,0);
});
test('M7, new family, 61–99 equipment, dungeon, key, difficulty and room are independently detected',()=>{
  const c=clone(),base=run(c),n=clone();n.maps.push({...structuredClone(c.maps.at(-1)),id:'m7',index:7,minLevel:61,maxLevel:75});n.items.push({...structuredClone(c.items[0]),id:'future_item',level:75,tier:6});n.families.families.push({...structuredClone(c.families.families[0]),id:'m7',itemLevel:70});n.dungeons.push({...structuredClone(c.dungeons[0]),id:'future_dungeon',keyId:'future_key',minLevel:61});n.stackables.push({...c.stackables.find(x=>x.kind==='key'),id:'future_key'});n.dungeons[0].nightmare={minLevel:62,rooms:[{...c.dungeons[0].rooms[0],room:11}]};
  const a=run(n,base,{previousContent:c});for(const [category,key] of [['maps','m7'],['items','future_item'],['families','m7'],['dungeons','future_dungeon'],['keys','future_key'],['difficulties',c.dungeons[0].id+':nightmare'],['rooms',c.dungeons[0].id+':nightmare:11']]){const row=find(a,category,key);assert(row,category);assert.equal(row.status,'prepared');assert(row.potential);assert.equal(row.firstSeenAt,now);assert(row.sourcePath.startsWith('/'));}
  assert.equal(a.summary.maxLevel,c.limits.maxLevel);assert(a.notificationEvents.some(x=>x.key==='m7'));assert.equal(new Set(a.observations.map(x=>x.id)).size,a.observations.length);
});
test('Unknown nested/root branches, new class, skill, mode and unlock are retained on repeated checks',()=>{
  const c=clone(),base=run(c),n=clone();n.astralSystem={enabled:false,unlock:{level:80}};n.forge.newPuzzle={stages:4};n.classes.push({...c.classes[0],id:'future_class'});n.lean.skills.warrior.availablePaths.push({...c.lean.skills.warrior.availablePaths[0],id:'future_skill'});n.onboarding.unlocks['nav.future']={level:75};
  const a=run(n,base,{previousContent:c}),b=run(n,a,{previousContent:n});assert(find(a,'unknown','root:astralSystem'));assert(find(a,'unknown','/forge/newPuzzle'));assert(find(b,'unknown','/forge/newPuzzle').seenThisCheck);assert(find(a,'classes','future_class'));assert(find(a,'skills','future_skill'));assert(find(a,'unlocks','nav.future').potential);assert.equal(b.newEventIds.length,0);assert.equal(b.changed,false);
});
test('Changes preserve old/new values and A→B→A is two events; version/time alone does not build',()=>{
  const c=clone(),base=run(c),n=clone();n.features.bossReact=true;const a=run(n,base,{previousContent:c});assert(a.notificationEvents.some(x=>x.kind==='activated-flag'&&x.before===false&&x.after===true));const b=run(c,a,{previousContent:n});const row=find(b,'features','bossReact');assert.equal(row.firstSeenAt,find(base,'features','bossReact').firstSeenAt);assert(row.history.some(x=>x.kind==='deactivated-flag'));assert.equal(new Set(row.history.map(x=>x.id)).size,row.history.length);
  const version=clone();version.version='watcher_only_new_version';const v=run(version,base,{now:'2026-11-21T00:00:00Z'});assert.equal(v.changed,false);assert.equal(v.newEventIds.length,0);
});
test('Confirmed removals are preserved; incomplete API and unavailable client never remove data',()=>{
  const c=clone(),base=run(c),n=clone();n.maps=n.maps.filter(x=>x.id!=='m6');const a=run(n,base,{previousContent:c});assert.equal(find(a,'maps','m6').status,'removed');assert.equal(find(a,'maps','m6').history.at(-1).before.id,'m6');
  const broken=clone();delete broken.maps;assert.throws(()=>run(broken,base),/Hiányos/);
  const url='https://stonestorm.gg/assets/future.webp',withClient=run(c,base,{resources:{[url]:{kind:'image-reference',sha256:'a'.repeat(64)}}}),missing=run(c,withClient,{resources:{},inspection:{complete:false}});assert.equal(find(missing,'graphics',url).status,'prepared');assert.equal(find(missing,'graphics',url).seenThisCheck,false);
  const removed=run(c,withClient,{resources:{},inspection:{complete:true}});assert.equal(find(removed,'graphics',url).status,'removed');
});
test('Hungarian/English static localization and art tables never execute downloaded code',()=>{
  globalThis.__futureExecuted=false;const module='globalThis.__futureExecuted=true; const locale={"./nav.en.json":{m7:"Seventh land"}}; export {locale};';const parsed=staticClientEvidence(module,'https://stonestorm.gg/assets/texts.en-Fixture.js');assert.equal(globalThis.__futureExecuted,false);assert.equal(parsed.localeEntries['/nav/m7'],'Seventh land');
  const art=staticClientEvidence('const manifest={maps:["m7_background"]};','https://stonestorm.gg/assets/art-manifest-Fixture.js');assert.equal(art.artEntries[0].key,'maps/m7_background');assert.deepEqual(art.staticReferences,[],'No guessed graphics URL');
  const resources={'https://stonestorm.gg/assets/texts.en-Fixture.js':{kind:'en-localization',localeEntries:parsed.localeEntries},'https://stonestorm.gg/assets/texts.hu-Fixture.js':{kind:'hu-localization',localeEntries:{'/nav/m7':'Hetedik táj'}}};const a=run(clone(),null,{resources});assert.equal(a.coverage.locales.en,'checked');assert.equal(a.coverage.locales.hu,'checked');assert(a.observations.some(x=>x.category==='translations'&&x.language==='en'));delete globalThis.__futureExecuted;
});
test('Public graphics link to Image Collector without upgrading to announced or guessing a mapping',()=>{
  const c=clone(),url='https://stonestorm.gg/art/mobs/m7_boss.webp',base=run(c,null,{resources:{'https://stonestorm.gg/assets/known.webp':{kind:'image-reference'}}}),catalog={entries:[{id:'mobs/m7_boss',sourceUrl:url,thumbnail:'assets/catalog-thumbs/fixture.webp',sha256:'a'.repeat(64),relations:[]}]};const a=run(c,base,{resources:{[url]:{kind:'image-reference',discoveredFrom:'https://stonestorm.gg/assets/art-manifest-Fixture.js',referenceSourceHash:'b'.repeat(64)}},catalog});const row=find(a,'graphics',url);assert.equal(row.status,'prepared');assert.equal(row.relatedImages[0].localFile,catalog.entries[0].thumbnail);assert.equal(a.notificationEvents.length,0);assert.equal(imageCollectorReferences(a).images.find(x=>x.url===url).sources[0].sha256,'b'.repeat(64));assert.equal(run(c,a,{resources:{[url]:{kind:'image-reference'}},catalog}).newEventIds.length,0);
});
test('Client inspection follows actual references, analyzes both languages and retains 403 evidence',async()=>{
  const calls=[],root='https://stonestorm.gg/',hu=root+'assets/texts.hu-Test1234.js',en=root+'assets/texts.en-Test1234.js';const fetcher=async url=>{calls.push(url);return url===root?new Response('<script src="/assets/index-Test1234.js"></script>'):url.endsWith('index-Test1234.js')?new Response('import "./texts.hu-Test1234.js"; import "./texts.en-Test1234.js";'):url===hu?new Response('const a={"./menu.hu.json":{new:"Új menü"}};'):url===en?new Response('const a={"./menu.en.json":{new:"New menu"}};'):new Response('denied',{status:403});};const a=await inspectResources({},fetcher);assert(a.entrypointConfirmed);assert(a.resources[hu].localeEntries['/menu/new']);assert(a.resources[en].localeEntries['/menu/new']);assert(!calls.some(x=>x.endsWith('.hu.json')));const b=await inspectResources(a.resources,async()=>new Response('denied',{status:403}));assert.equal(b.complete,false);assert.equal(b.resources[root].observedThisCheck,false);assert(b.resources[hu].sha256);
});
test('Lossless baseline compression preserves all client values and does not invent changes',()=>{
  const resources={'https://stonestorm.gg/assets/texts.hu-ArchiveTest.js':{kind:'hu-localization',localeEntries:{'/nav/one':'Egy','/nav/two':'Kettő'}}};const state=run(clone(),null,{resources}),packed=packWatcher(state),restored=unpackWatcher(packed);assert.equal(packed.baselineArchive.count,3);assert.deepEqual(restored.observations.find(x=>x.category==='translations').value,'Egy');assert.equal(restored.observations.length,state.observations.length);assert.equal(run(clone(),packed,{resources}).changed,false);const bad=structuredClone(packed);bad.baselineArchive.sha256='0'.repeat(64);assert.throws(()=>unpackWatcher(bad),/hash mismatch/);
});

test('A newly reachable locale module has its own quiet baseline; subsequent edits are changes',()=>{
  const c=clone(),first='https://stonestorm.gg/assets/menu.en-ArchiveTest.js',second='https://stonestorm.gg/assets/play.en-ArchiveTest.js';
  const resources={[first]:{kind:'en-localization',localeEntries:{'/menu/home':'Home'}}},base=run(c,null,{resources});
  resources[second]={kind:'en-localization',localeEntries:{'/play/wait':'Just a moment'}};
  const next=run(c,base,{resources});assert.equal(find(next,'translations','en:/play/wait').potential,false);assert.equal(next.changed,false);assert.equal(next.notificationEvents.length,0);
  resources[second].localeEntries['/play/new']='New content';const updated=run(c,next,{resources});assert(find(updated,'translations','en:/play/new').potential);assert.equal(updated.notificationEvents.length,0);assert.equal(updated.changed,true);
  const legacy=structuredClone(updated);legacy.analyzerVersion=1;legacy.baseline.domains=['api','client','locale:en'];const migrated=run(c,legacy,{resources});assert.equal(find(migrated,'translations','en:/play/new').potential,false);assert(find(migrated,'translations','en:/play/new').history.some(x=>x.originalKind==='discovered'&&x.kind==='initial'));
});
test('Independent sync publishes only meaningful updates and rolls back malformed responses',async t=>{
  const root=workspace(t),output=path.join(root,'output');const c=clone(),fetcher=async()=>Response.json(c);let a=await runFutureSync({root,fetcher,inspect:false,now,outputFile:output});assert.equal(a.state.summary.maxLevel,60);const m=fs.statSync(path.join(root,'snapshots/future/content.json')).mtimeMs;
  a=await runFutureSync({root,fetcher:async()=>new Response(null,{status:304}),inspect:false,now:'2026-11-21T00:00:00Z'});assert.equal(a.publish,false);assert.equal(fs.statSync(path.join(root,'snapshots/future/content.json')).mtimeMs,m);
  const n=clone();n.maps.push({...c.maps.at(-1),id:'m7',index:7});a=await runFutureSync({root,fetcher:async()=>Response.json(n),inspect:false,publishEnabled:false});assert.equal(a.publish,false);assert(a.state.pendingPublication);a=await runFutureSync({root,fetcher:async()=>new Response(null,{status:304}),inspect:false});assert.equal(a.publish,true);assert(!fs.existsSync(path.join(root,'data/data-engine.json')),'No engine import required');
  const before=new Map(futureStateFiles.map(p=>[p,fs.readFileSync(path.join(root,p))]));const broken=clone();delete broken.items;await assert.rejects(runFutureSync({root,fetcher:async()=>Response.json(broken),inspect:false,outputFile:output}),/Hiányos/);for(const [p,bytes] of before)assert(fs.readFileSync(path.join(root,p)).equals(bytes),p);
});
test('Optional Discord is deduplicated, acknowledges success and retries failure without revealing the URL',async t=>{
  const root=workspace(t),c=clone(),base=run(c),n=clone();n.features.bossReact=true;const a=run(n,base),queue=queueNotifications(a);assert.equal(queue.pending.length,1);assert.equal(queueNotifications(a,queue).pending.length,1);fs.mkdirSync(path.join(root,'data'));const file=path.join(root,'data/future-notifications.json');fs.writeFileSync(file,JSON.stringify(queue));
  assert.deepEqual(await deliverNotifications({root,webhook:undefined}),{enabled:false,sent:0});let calls=0;const webhook='https://discord.com/api/webhooks/123/fixture_token';await assert.rejects(deliverNotifications({root,webhook,fetcher:async()=>new Response('failed',{status:500})}),/HTTP 500/);assert.equal(JSON.parse(fs.readFileSync(file)).pending.length,1);
  const fetcher=async(url,opts)=>{calls++;assert.equal(url,webhook);assert.deepEqual(JSON.parse(opts.body).allowed_mentions,{parse:[]});return new Response(null,{status:204});};assert.equal((await deliverNotifications({root,webhook,fetcher})).sent,1);assert.equal((await deliverNotifications({root,webhook,fetcher})).sent,0);assert.equal(calls,1);assert(!fs.readFileSync(file,'utf8').includes('fixture_token'));
});
test('Workflow gates Pages on verified change and persists Discord acknowledgements before commit',()=>{
  const yml=fs.readFileSync(new URL('../.github/workflows/atlas-sync.yml',import.meta.url),'utf8');assert.match(yml,/17 \*\/6 \* \* \*/);assert.match(yml,/node scripts\/future-content-sync.mjs/);assert.match(yml,/steps\.future\.outputs\.publish/);assert.match(yml,/steps\.publication\.outputs\.publish == 'true'/);assert.match(yml,/actions\/deploy-pages@/);assert(yml.indexOf('node scripts/notify-future-content.mjs')<yml.indexOf('git add --'));assert.match(yml,/secrets\.ATLAS_FUTURE_DISCORD_WEBHOOK/);
});

test('Discord acknowledges only the events actually included in its bounded message',async t=>{
  const root=workspace(t),event={id:'event',nameHu:'Important content',key:'m7',category:'maps',status:'prepared',gameVersion:'fixture',source:API};
  const queue={schema:1,pending:Array.from({length:20},(_,i)=>({...event,id:'event-'+i})),delivered:[]};fs.mkdirSync(path.join(root,'data'));const file=path.join(root,'data/future-notifications.json');fs.writeFileSync(file,JSON.stringify(queue));
  const result=await deliverNotifications({root,webhook:'https://discord.com/api/webhooks/123/fixture_token',fetcher:async(url,options)=>{const body=JSON.parse(options.body);assert(body.content.length<=1900);assert(body.content.includes('Forrás: '+API));return new Response(null,{status:204});}});
  const saved=JSON.parse(fs.readFileSync(file));assert(result.sent>0&&result.sent<=8);assert.equal(saved.delivered.length,result.sent);assert.equal(saved.pending.length,20-result.sent);
});
