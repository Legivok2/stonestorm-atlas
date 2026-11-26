/* 0.14.0 release regression. Real MV3/React; labelled synthetic game state.
 * No authenticated account, gameplay mutation or live acceptance claim. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
import {root} from '../scripts/publication-plan.mjs';
import {character,api,html,gameScript,reactRuntime} from './fixtures/companion-page.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH=path.join(root,'.integration/browser-qa/browsers');
const {chromium}=await import(pathToFileURL(path.join(root,'.integration/browser-qa/node_modules/playwright/index.mjs')));
const out=path.join(root,'.integration/stabilization-0140'),addon=path.join(root,'addons/stonestorm-statcap-overlay');fs.mkdirSync(out,{recursive:true});
const profile=fs.mkdtempSync(path.join(out,'mv3-profile-'));
const context=await chromium.launchPersistentContext(profile,{channel:'chromium',headless:true,ignoreDefaultArgs:['--disable-extensions'],args:['--disable-extensions-except='+addon,'--load-extension='+addon],viewport:{width:1600,height:1100},acceptDownloads:true});
let raw=character();raw.level=40;raw.name='Tesztkarakter';Object.assign(raw.mods,{xpPaid:0,nyangPaid:0,dropPaid:0});
Object.assign(raw.derived,{critChance:.463,evadeBonus:.03,harceroStats:{critDamage:.42,skillDamage:.26,supportRaw:{critDamage:.6,skillDamage:.3}}});
const runtime=reactRuntime(),art=new Map(JSON.parse(fs.readFileSync(path.join(root,'data/image-catalog.json'))).entries.map(e=>[e.id,e.file]));
const cases=[],errors=[],writes=[];let reads=0;
const check=async(name,fn)=>{console.log('Checking: '+name);await fn();cases.push({name,passed:true});};
const wait=async(fn,label)=>{const until=Date.now()+10000;while(Date.now()<until){if(await fn())return;await new Promise(r=>setTimeout(r,50));}throw Error('Timeout '+label+' '+JSON.stringify(errors));};
let page,session,worlds=[],objectId;
const find=(n,id)=>{if(n.attributes?.some((a,i)=>a==='id'&&n.attributes[i+1]===id))return n;for(const child of [...n.children??[],...n.shadowRoots??[]]){const result=find(child,id);if(result)return result;}return null;};
async function call(fn,args=[]){if(!objectId){const {root:doc}=await session.send('DOM.getDocument',{depth:-1,pierce:true});const host=find(doc,'ss-statcap-root');assert(host?.shadowRoots?.length);objectId=(await session.send('DOM.resolveNode',{nodeId:host.shadowRoots[0].nodeId})).object.objectId;}
  const result=await session.send('Runtime.callFunctionOn',{objectId,functionDeclaration:fn.toString(),arguments:args.map(value=>({value})),returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description);return result.result.value;}
async function evaluate(expression){const world=worlds.findLast(c=>c.origin.startsWith('chrome-extension://'));assert(world);const result=await session.send('Runtime.evaluate',{contextId:world.id,expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description);return result.result.value;}
async function click(selector){const box=await call(function(s){const n=this.querySelector(s);if(!n)throw Error('Missing '+s);n.scrollIntoView({block:'center'});const r=n.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height,disabled:n.disabled};},[selector]);assert(box.w>0&&box.h>0&&!box.disabled,'Visible enabled '+selector);await page.mouse.click(box.x,box.y);await page.waitForTimeout(75);}
async function nav(id){await click('.sc-nav [data-sc-nav='+id+']');assert.equal(await call(function(){return this.querySelector('.sc-nav [aria-selected=true]').dataset.scNav;}),id);}
async function refresh(){await page.evaluate(async()=>{await fetch('/api/content');await fetch('/api/character');});await page.waitForTimeout(170);}
async function load(){objectId=null;worlds=[];page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));session=await context.newCDPSession(page);session.on('Runtime.executionContextCreated',e=>worlds.push(e.context));await session.send('Runtime.enable');await page.goto('https://stonestorm.gg/city',{waitUntil:'networkidle'});await page.locator('#ss-statcap-root').waitFor({state:'attached'});await refresh();}
try{
 await context.route('https://stonestorm.gg/**',route=>{const request=route.request(),p=new URL(request.url()).pathname;
  if(request.method()!=='GET'){writes.push({method:request.method(),path:p});return route.fulfill({status:405,body:'No gameplay writes in release QA'});}
  if(p==='/api/content')return route.fulfill({json:api});if(p==='/api/character'){reads++;return route.fulfill({json:{state:raw}});}
  if(p==='/api/home/rooms')return route.fulfill({json:{rooms:[{id:'rest',rules:{dailyLimit:3}}]}});
  if(p==='/fixture/react.js')return route.fulfill({contentType:'text/javascript',body:runtime});if(p==='/fixture/companion-game.js')return route.fulfill({contentType:'text/javascript',body:gameScript});
  if(p.startsWith('/art/')){const key=p.slice(5).replace(/\.webp$/,'');if(art.has(key))return route.fulfill({contentType:'image/webp',body:fs.readFileSync(path.join(root,art.get(key)))});}
  if(p==='/assets/index-B-KQL_s0.js')return route.fulfill({contentType:'text/javascript',body:'export {}; /* Local fixture entrypoint marker; not original game execution. */'});
  if(p==='/city'||p==='/mining')return route.fulfill({contentType:'text/html; charset=utf-8',body:html+'<script type="module" src="/assets/index-B-KQL_s0.js"></script>'});
  return route.fulfill({status:404,body:'Local synthetic QA; no external fallback'});
 });
 const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');
 await worker.evaluate(async()=>chrome.storage.local.set({'stonestormCompanion.ui.v1':{schema:1,tab:'research',quick:['research','equipment','interfaces','raids'],density:'compact'},'ssaEnhancedUI.v2':{screens:{home:true,mining:true,stable:true,community:true,shop:true}},ssaHomeExpanded:true,ssaMiningMultiPanel:true}));
 await load();await click('[data-toggle]');await click('[data-maximize]');
 await check('Legacy preferences migrate to normal Overview; only five normal routes and valid quick targets are visible',async()=>{
  assert.equal(await evaluate('StonestormCompanionApp.preferences().development'),false);assert.equal(await evaluate('StonestormCompanionApp.preferences().theme'),'emerald');
  assert.deepEqual(await call(function(){return [...this.querySelectorAll('.sc-nav [data-sc-nav]')].filter(n=>!n.hidden).map(n=>n.dataset.scNav);}),['overview','stats','equipment','raids','settings']);
  assert.equal(await call(function(){return this.querySelector('.sc-nav [aria-selected=true]').dataset.scNav;}),'overview');
  assert.equal(await call(function(){return this.querySelectorAll('.sc-quick [data-sc-nav=research],.sc-quick [data-sc-nav=interfaces]').length;}),0);
  assert.equal(await page.locator('iframe,.ssa-ui-toggle,.ssa-mining-toolbar,.ssa-home-toggle').count(),0);
  assert.equal((await evaluate('StonestormEnhancedUI.diagnostics()')).records,0);
 });
 await check('Overview shows exact verified crit/support and contextual evasion; no unknown limit card or invented overflow',async()=>{
  for(const key of ['crit','critDamage','skillDamage','evadeNormal'])assert(await call(function(k){return !!this.querySelector('[data-sc-overview] [data-sc-cap="'+k+'"]');},[key]));
  assert(await call(function(){return this.querySelector('[data-sc-cap=crit]').textContent.includes('46,3% / 50%')&&this.querySelector('[data-sc-cap=critDamage]').textContent.includes('42% / 75%');}));
  assert.equal(await call(function(){return this.querySelectorAll('[data-sc-overview] .sc-cap').length;}),4);
  await page.screenshot({path:path.join(out,'overview-emerald-desktop.png')});
 });
 await check('Stats use nonempty groups; unknown final damage support disappears while known basic stats remain',async()=>{
  await nav('stats');assert.equal(await call(function(){return this.querySelectorAll('[data-sc-stat-group]').length;}),6);
  const saved=raw.derived.harceroStats;delete raw.derived.harceroStats;await refresh();
  assert.equal(await call(function(){return this.querySelectorAll('[data-sc-page=stats] [data-sc-cap=critDamage]').length;}),0);
  assert(await call(function(){return this.querySelector('[data-sc-stat-group=basic]').textContent.includes('Erő');}));
  raw.derived.harceroStats=saved;await refresh();await page.screenshot({path:path.join(out,'stats-normal-desktop.png')});
 });
 await check('Three presets save actual item identities; normal preview has no apply, mock, JSON, ID list or read diagnostics',async()=>{
  await nav('equipment');await wait(()=>call(function(){return !this.querySelector('[data-preset-action=save]').disabled;}),'save ready');
  for(const index of [0,1,2]){await click('[data-preset-action=save][data-index="'+index+'"]');await wait(()=>evaluate('StonestormEquipmentStorage.load("mock-character-A").then(s=>!!s.presets['+index+'])'),'save '+index);}
  const store=await evaluate('StonestormEquipmentStorage.load("mock-character-A")');assert.equal(store.presets.filter(Boolean).length,3);
  assert(store.presets.every(p=>Object.values(p.slots).filter(Boolean).every(ref=>ref.id&&ref.templateId)));
  assert.equal(await call(function(){return this.querySelectorAll('[data-live-apply],[data-equipment-diagnostics],[data-mock-run]').length;}),0);
  await click('[data-preset-action=preview][data-index="0"]');assert(await call(function(){return this.querySelector('.ssa-equipment-preview').textContent.includes('Előnézet. A felszerelésed változatlan.');}));
  assert(!await call(function(){return this.querySelector('.ssa-equipment-preview').textContent.includes('worn-');}));await page.screenshot({path:path.join(out,'equipment-normal-desktop.png')});
 });
 await check('Rename and delete modify only the selected local preset; names and draft input remain usable',async()=>{
  await click('[data-preset-more="1"] > summary');await click('[data-preset-name="1"]');await page.keyboard.press('Control+A');await page.keyboard.type('Nyang szett');await click('[data-preset-action=rename][data-index="1"]');
  await wait(()=>evaluate('StonestormEquipmentStorage.load("mock-character-A").then(s=>s.presets[1].name==="Nyang szett")'),'rename');
  await click('[data-preset-more="2"] > summary');await click('[data-preset-action=delete][data-index="2"]');
  await wait(()=>evaluate('StonestormEquipmentStorage.load("mock-character-A").then(s=>s.presets[2]===null&&s.presets[0]!==null&&s.presets[1]!==null)'),'selected delete');
 });
 await check('Normal XP comparison shows gear contributions only and saves a proposal without applying items',async()=>{
  assert.equal(await call(function(){return this.querySelectorAll('[data-equipment-goal=drop],[data-equipment-goal=harcero]').length;}),0);
  await click('[data-equipment-goal=xp]');await wait(()=>call(function(){return !!this.querySelector('[data-save-proposal]');}),'XP comparison');
  assert(await call(function(){return this.querySelector('.sc-compare-metrics').textContent.includes('Felszerelés XP-bónusza');}));
  await call(function(){this.querySelector('[data-save-target]').value='2';});await click('[data-save-proposal]');
  await wait(()=>evaluate('StonestormEquipmentStorage.load("mock-character-A").then(s=>!!s.presets[2])'),'local proposal saved');assert.equal(writes.length,0);
 });
 await check('Raid comparison retains HU abbreviated XP, original offer data and only known time metrics',async()=>{
  await nav('raids');const data=await evaluate('StonestormRaidDOM.scan(document)');assert.equal(data.long.xp.value,6500);
  assert.equal(await call(function(){return this.querySelectorAll('.sc-raid-card').length;}),3);
  assert(await call(function(){return [...this.querySelectorAll('.sc-raid-card .sc-caption')].every(n=>n.textContent==='Eredeti ajánlat');}));
  assert.equal(await call(function(){return this.querySelectorAll('[data-start-raid]').length;}),0);await page.screenshot({path:path.join(out,'raids-normal-desktop.png')});
 });
 const themeValues=[];
 await check('All three themes change panel, navigation, cards, controls and text; density controls are removed',async()=>{
  await nav('settings');assert.equal(await call(function(){return this.querySelectorAll('[data-sc-density]').length;}),0);
  for(const theme of ['emerald','obsidian','ember']){
   await call(function(t){const s=this.querySelector('[data-sc-theme]');s.value=t;s.dispatchEvent(new Event('change',{bubbles:true}));},[theme]);await page.waitForTimeout(50);
   themeValues.push(await call(function(){return ['.panel','.sc-nav','.sc-card','[data-sc-reset-position]'].map(s=>getComputedStyle(this.querySelector(s)).backgroundColor).concat(getComputedStyle(this.querySelector('.wrap')).color);}));
   await page.screenshot({path:path.join(out,'settings-'+theme+'-desktop.png')});
  }
  for(let i=0;i<5;i++)assert.equal(new Set(themeValues.map(v=>v[i])).size,3,'Theme surface '+i);
  const luminance=rgb=>{const c=rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return .2126*c[0]+.7152*c[1]+.0722*c[2];};
  for(const v of themeValues){const a=luminance(v[4]),b=luminance(v[2]);assert((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,'Theme body contrast');}
 });
 await check('Theme and geometry save locally; presets survive a real reload and no character data enters UI settings',async()=>{
  const prefs=await evaluate('new Promise(r=>chrome.storage.local.get("stonestormCompanion.ui.v1",r))');assert(!/mock-character|worn-|Tesztkarakter/.test(JSON.stringify(prefs)));
  const before=await evaluate('StonestormEquipmentStorage.load("mock-character-A")');
  await page.close();await load();assert.equal(await evaluate('StonestormCompanionApp.preferences().theme'),'ember');assert.deepEqual(await evaluate('StonestormEquipmentStorage.load("mock-character-A")'),before);
  if(await call(function(){return this.querySelector('.panel').hidden;}))await click('[data-toggle]');
 });
 await check('One central developer toggle reveals labelled research/interfaces and guarded Apply; obsolete iframe tests remain absent',async()=>{
  await nav('settings');assert.equal(await call(function(){return this.querySelectorAll('[data-sc-development]').length;}),1);await click('[data-sc-development]');
  await nav('interfaces');assert.equal(await call(function(){return this.querySelectorAll('[data-enhanced-setting]').length;}),8);
  assert.equal(await page.locator('iframe').count(),0);assert.equal((await evaluate('StonestormEnhancedUI.diagnostics()')).records,0);
  await nav('equipment');assert.equal(await call(function(){return this.querySelectorAll('[data-live-apply]').length;}),3);assert(await call(function(){return [...this.querySelectorAll('[data-live-apply]')].every(n=>n.disabled);}));
  assert(await call(function(){return !!this.querySelector('[data-equipment-diagnostics]');}));
 });
 await check('Atlas requires explicit arm, exports only anonymized sample data and stops immediately when developer mode is disabled',async()=>{
  assert.equal((await evaluate('StonestormResearchController.status()')).active,false);await nav('research');await click('[data-research=arm]');await page.evaluate(()=>fetch('/api/home/rooms'));
  await wait(async()=>(await evaluate('StonestormResearchController.status()')).count>0,'sample');const pending=page.waitForEvent('download');await click('[data-research=export]');const download=await pending;const json=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(json.addonVersion,'0.14.0');assert(!/Tesztkarakter|worn-|mock-character/.test(JSON.stringify(json)));
  await click('[data-research=arm]');await nav('settings');await click('[data-sc-development]');assert.equal((await evaluate('StonestormResearchController.status()')).active,false);
  assert.equal(await call(function(){return this.querySelectorAll('[data-live-apply],[data-equipment-diagnostics],[data-atlas-research]').length;}),0);
  assert((await evaluate('StonestormResearchController.command("atlas-research-arm")')).error);
  assert.equal(await call(function(){return this.querySelectorAll('.sc-quick [data-sc-nav=research],.sc-quick [data-sc-nav=interfaces]').length;}),0);
 });
 await check('Quiet normal notifications deduplicate and disabling a notification immediately removes its toast',async()=>{
  await nav('overview');await evaluate('StonestormCompanionApp.notice("caps","Ellenőrzött tesztértesítés","same");StonestormCompanionApp.notice("caps","Ellenőrzött tesztértesítés","same")');
  assert.equal(await call(function(){return this.querySelectorAll('.sc-toast').length;}),1);
  await nav('settings');await click('[data-sc-notification=caps]');assert.equal(await call(function(){return this.querySelectorAll('.sc-toast').length;}),0);
  await evaluate('StonestormCompanionApp.notice("caps","Nem jelenhet meg","off")');assert.equal(await call(function(){return this.querySelectorAll('.sc-toast').length;}),0);
 });
 await check('Pet statistics remain active in normal mode, with original portrait and no activation click',async()=>{
  await click('[data-close]');await page.locator('.pet-row__name').hover();await page.locator('#ss-atlas-pet-tooltip').waitFor({state:'visible'});
  assert((await page.locator('.pet-row__name').getAttribute('aria-description')).includes('Zsákmány'));assert.equal(await page.evaluate(()=>gameActions.length),0);
  await page.screenshot({path:path.join(out,'pet-normal-desktop.png')});await click('[data-toggle]');
 });
 for(const [width,height] of [[1440,900],[900,800],[390,844],[320,760]])await check('All normal routes and themes fit '+width+'×'+height,async()=>{
  await page.setViewportSize({width,height});
  for(const id of ['overview','stats','equipment','raids','settings']){await nav(id);assert(await call(function(){const n=this.querySelector('.panel'),r=n.getBoundingClientRect(),c=this.querySelector('.sc-content');return r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&c.scrollWidth<=c.clientWidth+2;}),id+' overflow');}
  await page.screenshot({path:path.join(out,'settings-ember-'+width+'.png')});
 });
 await check('Appearance reset preserves presets and restores Emerald with developer mode off',async()=>{
  const before=await evaluate('StonestormEquipmentStorage.load("mock-character-A")');await nav('settings');await click('[data-sc-reset-ui]');
  assert.equal(await evaluate('StonestormCompanionApp.preferences().theme'),'emerald');assert.equal(await evaluate('StonestormCompanionApp.preferences().development'),false);assert.deepEqual(await evaluate('StonestormEquipmentStorage.load("mock-character-A")'),before);
 });
 await check('Normal Chrome extension popup has useful navigation and no collection controls or automatic reads',async()=>{
  const before=reads,u=new URL(worker.url()),popup=await context.newPage();popup.on('pageerror',e=>errors.push(e.message));await page.bringToFront();
  await popup.goto(u.protocol+'//'+u.host+'/research-popup.html',{waitUntil:'networkidle'});
  assert.equal(await popup.locator('[data-research=arm],[data-research=export]').count(),0);assert.equal(await popup.locator('[data-open-page]').count(),5);
  await popup.locator('[data-open-page=stats]').click();await wait(()=>evaluate('StonestormCompanionApp.preferences().tab==="stats"'),'popup navigation');assert.equal(reads,before);if(!popup.isClosed())await popup.close();
 });
 await check('Stale character data hides normal cards without a network poll',async()=>{
  const before=reads;await evaluate('globalThis.qaNow=Date.now;Date.now=()=>qaNow()+300001;StonestormCompanionApp.select("overview")');
  assert.equal(await call(function(){return this.querySelectorAll('[data-sc-overview] [data-sc-cap]').length;}),0);
  await evaluate('Date.now=qaNow;delete globalThis.qaNow');await refresh();assert.equal(reads,before+1);
 });
 await check('Legacy-on Mining stays original until an explicit developer action and is restored on developer opt-out',async()=>{
  await page.setViewportSize({width:1600,height:1100});
  await page.evaluate(()=>{history.pushState({},'','/mining');const n=document.createElement('div');n.id='qa-native-mining';n.innerHTML='<div class="mine-stage"><div class="stage-safe mine-safe"><section class="stage-window mine-window"><h2 class="stage-window__title">Original local fixture</h2><div class="mine-tabs" role="tablist"><button data-mine-tab="mine" role="tab" aria-selected="true" aria-controls="qa-mine-pane" id="qa-mine-tab">Tárna</button></div><div id="qa-mine-pane" class="mine-window__body" role="tabpanel" aria-labelledby="qa-mine-tab">Original fixture content</div></section></div></div>';document.body.append(n);window.qaNativeButton=n.querySelector('button');});
  await page.waitForTimeout(180);assert.equal(await page.locator('.ssa-mining-toolbar,.ssa-ui-toggle').count(),0);
  await nav('settings');await click('[data-sc-development]');await nav('interfaces');
  await wait(async()=>await page.locator('.ssa-ui-toggle').count()>0,'developer controls');assert.equal(await page.locator('.ssa-mining-wide').count(),0);
  await click('[data-enhanced-setting=mining]');await wait(async()=>await page.locator('.ssa-mining-wide').count()===1,'explicit expansion');
  await nav('settings');await click('[data-sc-development]');await wait(async()=>await page.locator('.ssa-mining-wide,.ssa-ui-toggle,.ssa-mining-toolbar').count()===0,'original restored');
  assert(await page.evaluate(()=>document.querySelector('#qa-native-mining button')===qaNativeButton));
 });
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);assert.equal(await page.evaluate(()=>gameActions.length),0);
 fs.writeFileSync(path.join(root,'reports/companion-0140-verification.json'),JSON.stringify({schema:1,version:'0.14.0',at:new Date().toISOString(),nativeMV3:true,realReact:true,syntheticState:true,liveGameVerified:false,cases,errors,writes:writes.length,fixtureReads:reads},null,2)+'\n');
 console.log('PASS '+cases.length+' stabilization browser checks; no gameplay writes.');
}finally{await context.close();}
