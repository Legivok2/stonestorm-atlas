import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
const root=process.cwd(),addon=path.join(root,'addons/stonestorm-statcap-overlay');
process.env.PLAYWRIGHT_BROWSERS_PATH=path.join(root,'.integration/browser-qa/browsers');
const {chromium}=await import(pathToFileURL(path.join(root,'.integration/browser-qa/node_modules/playwright/index.mjs')));
const profile=fs.mkdtempSync(path.join(root,'.integration/browser-qa/addon095-native-'));
const context=await chromium.launchPersistentContext(profile,{channel:"chromium",headless:true,ignoreDefaultArgs:['--disable-extensions'],args:['--disable-extensions-except='+addon,'--load-extension='+addon],viewport:{width:1440,height:1000}});
try{
 const page=await context.newPage(),session=await context.newCDPSession(page),contexts=[];session.on('Runtime.executionContextCreated',e=>contexts.push(e.context));await session.send('Runtime.enable');
 const api=JSON.parse(fs.readFileSync('snapshots/current/content.json'));
 const character={items:[],stats:{str:5,dex:10,int:5,vit:10},derived:{maxHp:100},pets:[{id:77,petId:'pet_vulture',level:1,bond:1,active:false,skills:[]}]};
 await context.route('https://stonestorm.gg/**',async route=>{const p=new URL(route.request().url()).pathname;if(p==='/api/content')return route.fulfill({json:api});if(p==='/api/character')return route.fulfill({json:{state:character}});if(p==='/api/home/rooms')return route.fulfill({json:{rooms:[{id:'rest',rules:{dailyLimit:3}}]}});return route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><body style="background:#182027;color:white;font:16px system-ui"><li class="pet-row" data-pet="77"><span class="pet-row__art">○</span><p class="pet-row__name">Keselyűfióka</p></li><script>fetch("/api/content");fetch("/api/character");</script></body>'});});
 await page.goto('https://stonestorm.gg/',{waitUntil:'networkidle'});
 await page.locator('#ss-statcap-root').waitFor({state:'attached'});
 const extension=contexts.find(c=>c.name==='Stonestorm Stat Cap Overlay'||c.origin.startsWith('chrome-extension://'));
 assert(extension,'Native extension isolated world exists');
 const evaluate=async expression=>(await session.send('Runtime.evaluate',{contextId:extension.id,expression,returnByValue:true})).result.value;
 assert.equal(await evaluate('typeof StonestormResearchController'),'object');
 const find=(node,id)=>{if(node.attributes?.some((a,i)=>a==='id'&&node.attributes[i+1]===id))return node;for(const child of [...node.children??[],...node.shadowRoots??[]]){const found=find(child,id);if(found)return found;}return null;};
 async function shadow(id){const {root:document}=await session.send('DOM.getDocument',{depth:-1,pierce:true});const node=find(document,id);assert(node?.shadowRoots?.[0],id+' closed shadow exists');return (await session.send('DOM.resolveNode',{nodeId:node.shadowRoots[0].nodeId})).object.objectId;}
 const call=async(objectId,functionDeclaration)=>(await session.send('Runtime.callFunctionOn',{objectId,functionDeclaration,returnByValue:true})).result.value;
 const stat=await shadow('ss-statcap-root');await call(stat,'function(){this.querySelector("[data-toggle]").click()}');
 await page.waitForTimeout(100);assert(await call(stat,'function(){return !!this.querySelector("[data-atlas-research]")}'));
 await call(stat,'function(){this.querySelector("[data-atlas-research]").open=true;this.querySelector("[data-research=arm]").click()}');
 await page.evaluate(()=>fetch('/api/home/rooms'));await page.waitForTimeout(150);assert.equal((await evaluate('StonestormResearchController.status()')).count,2);
 await page.locator('.pet-row__name').hover();const petShadow=await shadow('ss-atlas-pet-tooltip');const text=await call(petShadow,'function(){return this.textContent}');assert.match(text,/Zsákmány \+4%/);assert(!text.includes('Előcsapás'));
 await page.screenshot({path:path.join(root,'.integration/browser-qa/addon-095-native.png')});
 const popup=await context.newPage();await page.bringToFront();await popup.goto(extension.origin+'/research-popup.html');
 await popup.locator('[data-research-status]').filter({hasText:'2 anonimizált'}).waitFor();
 const [download]=await Promise.all([popup.waitForEvent('download'),popup.locator('[data-research="export"]').click()]);
 const exported=JSON.parse(fs.readFileSync(await download.path()));assert.equal(exported.addonVersion,'0.9.6');assert.equal(exported.samples.length,2);assert(!JSON.stringify(exported).includes('fixture-vulture'));
 assert.equal((await evaluate('StonestormResearchController.status()')).count,0);
 console.log('Native MV3: isolated controller, closed overlay, API replay, inactive tooltip, real Chrome popup, shared state and anonymous JSON download passed');
}finally{await context.close();assert.equal(path.dirname(profile),path.join(root,'.integration/browser-qa'));assert(path.basename(profile).startsWith('addon095-native-'));fs.rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
