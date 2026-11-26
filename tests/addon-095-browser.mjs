import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const root=path.resolve('.'),dir=path.join(root,'addons/stonestorm-statcap-overlay'),read=file=>fs.readFileSync(path.join(dir,file),'utf8');
process.env.PLAYWRIGHT_BROWSERS_PATH=path.join(root,'.integration/browser-qa/browsers');
const {chromium}=await import(pathToFileURL(path.join(root,'.integration/browser-qa/node_modules/playwright/index.mjs')));
const manifest=JSON.parse(read('manifest.json')),model=JSON.parse(fs.readFileSync('data/addon-pet-model.json')),config=JSON.parse(fs.readFileSync('snapshots/current/content.json'));
const roster={items:[],stats:{str:5,dex:10,vit:10,int:5},derived:{maxHp:100},pets:[{id:'own_v',petId:'pet_vulture',level:1,form:1,rank:0,active:false,skills:[]},{id:'own_w',petId:'pet_u_wild',level:12,form:2,rank:0,active:true,skills:[{skillId:'idle_xp',level:3}]}]};
const html='<!doctype html><html><head><meta charset="utf-8"><style>body{font:16px system-ui;background:#171a20;color:white;margin:12px}.pet-row{display:flex;gap:10px;align-items:center;margin:20px 0}.pet-row__art{padding:12px}.pet-row__name{margin:0}button{padding:8px}</style></head><body><button id="tabs">Másik fül</button><section id="pets"><ul><li class="pet-row" data-pet="own_v"><span class="pet-row__art">○</span><p class="pet-row__name">Keselyűfióka<span> – Kölyök – 1. szint</span></p><button class="activate">Fő kísérő legyen</button></li><li class="pet-row" data-pet="own_w"><span class="pet-row__art">○</span><p class="pet-row__name">Mohaagancs</p></li></ul></section><script>window.switchCount=0;document.addEventListener("click",e=>{if(e.target.closest(".activate"))window.switchCount++;});document.querySelector("#tabs").onclick=()=>document.querySelector("#pets").hidden=true;</script></body></html>';
const browser=await chromium.launch({headless:true});
try{
 for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  const context=await browser.newContext({viewport:{width,height},acceptDownloads:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await context.route('https://stonestorm.gg/**',async route=>{
   const u=new URL(route.request().url());if(u.pathname.startsWith('/extension/')){const file=u.pathname.split('/').at(-1);return route.fulfill({body:read(file),contentType:file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'application/javascript'});}
   if(u.pathname==='/api/character')return route.fulfill({json:{state:roster}});
   if(u.pathname==='/api/content')return route.fulfill({json:config});
   if(u.pathname==='/api/home/rooms')return route.fulfill({json:{rooms:[{id:'rest',rules:{dailyLimit:3}}],name:'PRIVATE_HERO'}});
   return route.fulfill({body:html,contentType:'text/html'});
  });
  await page.goto('https://stonestorm.gg/');
  await page.evaluate(()=>{const attach=Element.prototype.attachShadow;Element.prototype.attachShadow=function(options){const shadow=attach.call(this,options);if(this.id==='ss-statcap-root')window.testStatShadow=shadow;if(this.id==='ss-atlas-pet-tooltip')window.testPetShadow=shadow;return shadow;};window.chrome={runtime:{id:'fixture-extension',onMessage:{addListener(){}}},storage:{local:{get(keys,callback){if(callback)callback({});return Promise.resolve({});},set(){return Promise.resolve();}},onChanged:{addListener(){}}}};});
  for(const group of manifest.content_scripts)await page.addScriptTag({content:group.js.map(read).join('\n;\n')});
  await page.evaluate(async()=>{await fetch('/api/content');await fetch('/api/character');});
  await page.waitForTimeout(100);
  await page.locator('[data-pet="own_v"] .pet-row__name').hover();
  const tooltip=()=>page.evaluate(()=>window.testPetShadow.textContent);
  assert.match(await tooltip(),/Keselyűfióka/);assert.match(await tooltip(),/Zsákmány \+4%/);assert(!/Előcsapás/.test(await tooltip()));assert.equal(await page.evaluate(()=>window.switchCount),0);
  await page.screenshot({path:path.join(root,'.integration/browser-qa/addon-095-tooltip-'+name+'.png')});
  if(width>700){
    await page.locator('[data-pet="own_v"] .pet-row__name').evaluate(el=>el.style.cssText='position:fixed;right:10px;top:40px;width:160px');
    await page.locator('[data-pet="own_v"] .pet-row__name').hover();
    const anchorRect=await page.locator('[data-pet="own_v"] .pet-row__name').boundingBox(),tipRect=await page.locator('#ss-atlas-pet-tooltip').boundingBox();
    assert(tipRect.x+tipRect.width<anchorRect.x,'Jobb szélnél a tooltip balra jelenik meg');
    await page.locator('[data-pet="own_v"] .pet-row__name').evaluate(el=>el.removeAttribute('style'));
  }
  await page.locator('[data-pet="own_w"] .pet-row__name').focus();assert.match(await tooltip(),/Előcsapás/);assert.match(await tooltip(),/Tanulékony/);
  await page.keyboard.press('Escape');assert.equal(await page.locator('#ss-atlas-pet-tooltip').isVisible(),false);
  await page.locator('[data-pet="own_v"] .pet-row__name').hover();await page.locator('#tabs').click();assert.equal(await page.locator('#ss-atlas-pet-tooltip').isVisible(),false);
  await page.evaluate(()=>{const old=document.querySelector('[data-pet="own_v"]');document.querySelector('#pets').hidden=false;old.outerHTML=old.outerHTML;});
  await page.locator('[data-pet="own_v"] .pet-row__art').hover();assert.match(await tooltip(),/Keselyűfióka/);
  await page.evaluate(()=>window.dispatchEvent(new Event('scroll')));assert.equal(await page.locator('#ss-atlas-pet-tooltip').isVisible(),false);
  await page.evaluate(()=>window.testStatShadow.querySelector('[data-toggle]').click());
  await page.waitForFunction(()=>window.testStatShadow.querySelector('[data-atlas-research]'));
  await page.evaluate(()=>{window.testStatShadow.querySelector('[data-atlas-research]').open=true;window.testStatShadow.querySelector('[data-research="arm"]').click();});
  await page.evaluate(async()=>{await fetch('/api/home/rooms');});await page.waitForFunction(()=>window.StonestormResearchController.status().count===2);
  const popup=await context.newPage();await popup.exposeBinding('sendSharedResearch',(_,type)=>page.evaluate(type=>window.StonestormResearchController.command(type),type));
  await popup.addInitScript(()=>{window.chrome={tabs:{query:async()=>[{id:1,url:'https://stonestorm.gg/'}],sendMessage:async(_,message)=>window.sendSharedResearch(message.type)}};});
  await popup.goto('https://stonestorm.gg/extension/research-popup.html');await popup.locator('[data-research-status]').filter({hasText:'2 anonimizált'}).waitFor();
  assert.match(await popup.locator('[data-research-categories]').textContent(),/Szobák és témák/);
  const [download]=await Promise.all([popup.waitForEvent('download'),popup.locator('[data-research="export"]').click()]);const json=JSON.parse(fs.readFileSync(await download.path()));assert.equal(json.addonVersion,'0.13.2');assert.equal(json.samples.length,2);assert(!JSON.stringify(json).includes('PRIVATE_'));
  assert.equal(await page.evaluate(()=>window.StonestormResearchController.status().count),0);
  await popup.locator('[data-research="arm"]').click();await page.evaluate(async()=>{await fetch('/api/home/rooms');});await page.waitForFunction(()=>window.StonestormResearchController.status().count===2);
  await page.evaluate(()=>{window.testStatShadow.querySelector('[data-close]').click();window.testStatShadow.querySelector('[data-toggle]').click();});await page.waitForFunction(()=>window.testStatShadow.querySelector('[data-research="stop"]'));
  await page.evaluate(()=>window.testStatShadow.querySelector('[data-research="stop"]').click());await popup.locator('[data-research-status]').filter({hasText:'0 anonimizált'}).waitFor();
  assert.equal(await page.evaluate(()=>window.switchCount),0);assert.deepEqual(errors,[]);
  await page.screenshot({path:path.join(root,'.integration/browser-qa/addon-095-'+name+'.png')});
  await page.evaluate(()=>window.testStatShadow.querySelector('[data-close]').click());await page.locator('.activate').click();assert.equal(await page.evaluate(()=>window.switchCount),1,'A játék saját kattintása változatlanul működik');
  console.log(name+': inaktív tooltip, fókusz/Escape, újrarenderelés/fülváltás, közös popup–overlay gyűjtés, anonim letöltés és törlés rendben.');await context.close();
 }
}finally{await browser.close();}
