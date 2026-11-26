import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {root} from '../scripts/publication-plan.mjs';
import {fixtureHTML,gameCSS} from './fixtures/home-expanded-page.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH=path.join(root,'.integration/browser-qa/browsers');
const {chromium}=await import(pathToFileURL(path.join(root,'.integration/browser-qa/node_modules/playwright/index.mjs')));
const addon=path.join(root,'addons/stonestorm-statcap-overlay'),out=path.join(root,'.integration/home-expanded');fs.mkdirSync(out,{recursive:true});
const profile=fs.mkdtempSync(path.join(out,'native-profile-'));
const context=await chromium.launchPersistentContext(profile,{channel:'chromium',headless:true,ignoreDefaultArgs:['--disable-extensions'],args:['--disable-extensions-except='+addon,'--load-extension='+addon],viewport:{width:1920,height:1080}});
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/image-catalog.json'))),art=new Map(catalog.entries.map(x=>[x.id,x.file]));
const results=[],errors=[];let apiRequests=0,writes=0;
try{
  await context.route('https://stonestorm.gg/**',route=>{
    const req=route.request(),p=new URL(req.url()).pathname;if(req.method()!=='GET')writes++;if(p.startsWith('/api/'))apiRequests++;
    if(p==='/')return route.fulfill({contentType:'text/html; charset=utf-8',body:fixtureHTML});
    if(p==='/fixture/game.css')return route.fulfill({contentType:'text/css',body:gameCSS});
    let key;if(p.startsWith('/fixture/art/'))key=p.slice('/fixture/art/'.length).replace(/\.webp$/,'');else if(p.startsWith('/art/'))key=p.slice('/art/'.length).replace(/\.webp$/,'');
    if(key&&art.has(key))return route.fulfill({contentType:'image/webp',body:fs.readFileSync(path.join(root,art.get(key)))});
    return route.fulfill({status:404,body:'No network fallback in local fixture'});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const dialog=page.locator('.home-modal[data-tut-screen="home"]'),toggle=page.locator('.ssa-home-toggle'),panel=page.locator('.home-modal > .npc-modal__body > .sink-panel');
  async function open(){await page.goto('https://stonestorm.gg/',{waitUntil:'networkidle'});await toggle.waitFor();await page.locator('#ss-statcap-root').waitFor({state:'attached'});}
  const bounds=locator=>locator.boundingBox();
  const near=(a,b,message)=>assert(Math.abs(a-b)<1.5,message+': '+a+' / '+b);
  async function anchor(){return page.locator('[data-original="furniture"]').evaluate(el=>{const p=el.getBoundingClientRect(),r=el.closest('.home-room').getBoundingClientRect();return {x:(p.left+p.width/2-r.left)/r.width,y:(p.bottom-r.top)/r.height,style:el.getAttribute('style'),aspect:r.width/r.height};});}
  async function expanded(value){await toggle.click();await page.waitForFunction(v=>document.querySelector('.npc-modal--scene').classList.contains('ssa-home-expanded')===v,value);assert.equal(await toggle.getAttribute('aria-pressed'),String(value));}
  await open();assert.equal(await toggle.getAttribute('aria-pressed'),'false');
  assert.equal(await page.locator('.ssa-home-toggle').count(),1);
  // Keep references to React-owned nodes: the addon may not replace or move them.
  await page.evaluate(()=>window.__originalHomeNodes=[...document.querySelectorAll('.home-modal .tabs__tab,.home-modal .home-room,.home-modal [data-original]')].map(node=>({node,parent:node.parentNode})));
  const original=await bounds(dialog),a=await anchor();
  await page.screenshot({path:path.join(out,'before-1920.png')});
  await page.locator('[data-original="upgrade"]').click();const confirmationBefore=await bounds(page.locator('.fixture-submodal .npc-modal__dialog'));await page.getByRole('button',{name:'Mégse',exact:true}).click();
  await expanded(true);
  const big=await bounds(dialog);near(big.x,16,'left margin');near(big.y,16,'top margin');near(big.width,1920-32,'expanded width');near(big.height,1080-32,'expanded height');
  const b=await anchor();near(a.x,b.x,'furniture horizontal anchor');near(a.y,b.y,'furniture vertical anchor');assert.equal(a.style,b.style);near(b.aspect,2560/1429,'room aspect ratio');
  assert(await page.evaluate(()=>window.__originalHomeNodes.every(({node,parent})=>node.isConnected&&node.parentNode===parent)));
  const room=await bounds(page.locator('.home-room')),house=await bounds(page.locator('.home-house'));assert(house.x>=room.x+room.width,'house info is beside room');near(room.y,house.y,'columns begin together');
  const upgrade=await bounds(page.locator('[data-original="upgrade"]'));assert(upgrade.y+upgrade.height<1080-16,'house upgrade is visible beside the room');
  await page.screenshot({path:path.join(out,'after-1920.png')});
  await page.locator('[data-original="task"]').check();assert(await page.locator('[data-original="task"]').isChecked());
  await page.locator('[data-original="bonus"]').click();assert(await page.locator('.fixture-bonus').isVisible());
  await page.locator('[data-original="upgrade"]').click();const confirmationAfter=await bounds(page.locator('.fixture-submodal .npc-modal__dialog'));near(confirmationBefore.width,confirmationAfter.width,'confirmation width unchanged');near(confirmationBefore.height,confirmationAfter.height,'confirmation height unchanged');assert.equal(await page.locator('.fixture-submodal .ssa-home-toggle').count(),0);await page.keyboard.press('Escape');assert(await dialog.isVisible());
  await page.evaluate(()=>window.__homeFixture.rerender());await toggle.waitFor();assert.equal(await toggle.count(),1);assert.equal(await toggle.getAttribute('aria-pressed'),'true');
  await expanded(false);const restored=await bounds(dialog);near(original.width,restored.width,'restored width');near(original.height,restored.height,'restored height');near((await anchor()).aspect,a.aspect,'restored room');
  // Native chrome.storage.local survives page reload and a fresh React dialog.
  await toggle.focus();await page.keyboard.press('Space');await page.waitForFunction(()=>document.querySelector('.ssa-home-expanded'));await page.reload({waitUntil:'networkidle'});await toggle.waitFor();assert.equal(await toggle.getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'Otthon bezárása',exact:true}).click();await dialog.waitFor({state:'detached'});await page.locator('.fixture-open').click();await toggle.waitFor();assert.equal(await toggle.getAttribute('aria-pressed'),'true');
  for(const [width,height] of [[1920,1080],[2560,1440],[1280,720],[980,680],[390,844],[900,480]]){
    await page.setViewportSize({width,height});await page.evaluate(()=>window.__homeFixture.select('house'));
    for(const tab of ['house','furnish','trophies','rooms','ranking','jar']){
      await page.locator('[data-home-tab="'+tab+'"]').click();const tabBounds=await bounds(page.locator('.sink-tabs')),d=await bounds(dialog),close=await bounds(page.getByRole('button',{name:'Otthon bezárása',exact:true}));
      assert(d.x>=11&&d.y>=11&&d.x+d.width<=width-11&&d.y+d.height<=height-11,width+' '+tab+' dialog in viewport');
      assert(tabBounds.y>=d.y&&tabBounds.y+tabBounds.height<=height,width+' '+tab+' pinned navigation');assert(close.y>=d.y&&close.y+close.height<height,'close is visible');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page horizontal overflow');
      assert(await panel.evaluate(el=>el.scrollWidth<=el.clientWidth+2),width+' '+tab+' content horizontal overflow');
      await panel.evaluate(el=>el.scrollTop=el.scrollHeight);near((await bounds(page.locator('.sink-tabs'))).y,tabBounds.y,'tabs do not scroll');near((await bounds(page.getByRole('button',{name:'Otthon bezárása',exact:true}))).y,close.y,'close does not scroll');
      if(tab==='furnish'&&width>=1100&&height>=600){const columns=await page.locator('.furn-offer').evaluateAll(items=>new Set(items.slice(0,8).map(x=>Math.round(x.getBoundingClientRect().x))).size);assert(columns>=2,'multiple furniture cards per row');}
      if(tab==='house'){const r=await bounds(page.locator('.home-room')),h=await bounds(page.locator('.home-house'));if(width>=1100&&height>=600)assert(h.x>=r.x+r.width);else assert(h.y>=r.y+r.height-1,'narrow layout stacks');}
    }
    results.push({width,height,tabs:6,passed:true});
    if(width===2560){await page.locator('[data-home-tab="house"]').click();await page.screenshot({path:path.join(out,'after-2560.png')});await expanded(false);await page.screenshot({path:path.join(out,'before-2560.png')});await expanded(true);}
    if(width===390){await page.locator('[data-home-tab="house"]').click();await page.screenshot({path:path.join(out,'after-mobile.png')});}
  }
  await page.setViewportSize({width:1920,height:1080});await page.locator('[data-home-tab="house"]').click();await page.locator('[data-original="furniture"]').click();assert(await page.locator('.fixture-submodal').isVisible());await page.getByRole('button',{name:'Mégse',exact:true}).click();
  await page.evaluate(()=>window.__homeFixture.replace());await toggle.waitFor();assert.equal(await toggle.count(),1);assert.equal(await toggle.getAttribute('aria-pressed'),'true');
  // A renamed/reused modal must lose addon markers and controls.
  await page.evaluate(()=>document.querySelector('.home-modal').setAttribute('data-tut-screen','forge'));await toggle.waitFor({state:'detached'});assert.equal(await page.locator('.ssa-home-host,.ssa-home-expanded').count(),0);
  await page.evaluate(()=>document.querySelector('.home-modal').setAttribute('data-tut-screen','home'));await toggle.waitFor();assert.equal(await toggle.count(),1);
  await page.evaluate(()=>{window.__homeMutations=0;window.__homeObserver=new MutationObserver(r=>window.__homeMutations+=r.length);window.__homeObserver.observe(document.documentElement,{subtree:true,childList:true,attributes:true});});await page.waitForTimeout(300);const mutations=await page.evaluate(()=>{window.__homeObserver.disconnect();return window.__homeMutations;});assert(mutations<20,'observer must settle instead of constantly rewriting DOM');
  assert.equal(apiRequests,0,'no addon API requests');assert.equal(writes,0,'no game writes');assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({verifiedAt:new Date().toISOString(),nativeMV3:true,version:JSON.parse(fs.readFileSync(path.join(addon,'manifest.json'))).version,fixture:'Public DOM/CSS reconstruction with sample state; no real account',results,apiRequests,writes,errors,mutations},null,2)+'\n');
  console.log('Home Expanded native MV3: six tabs at six viewport sizes; toggle, keyboard, native storage, close/reopen/rerender, anchored furniture, unchanged confirmation, original controls, scrolling, modal isolation, no API requests or writes.');
}finally{await context.close();assert.equal(path.dirname(profile),out);assert(path.basename(profile).startsWith('native-profile-'));fs.rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
