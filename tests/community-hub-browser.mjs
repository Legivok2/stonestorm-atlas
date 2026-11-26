import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {root} from '../scripts/publication-plan.mjs';
import {reactRuntime, gameCSS} from './fixtures/enhanced-ui-page.mjs';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.join(root,'.integration/browser-qa/browsers');
const {chromium}=await import(pathToFileURL(path.join(root,'.integration/browser-qa/node_modules/playwright/index.mjs')));
const addon=path.join(root,'addons','stonestorm-statcap-overlay'), out=path.join(root,'.integration','previews');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage({viewport:{width:1920,height:1080}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent('<!doctype html><html lang="hu"><head><meta charset="utf-8"></head><body><p>Izolált React-minta, nem élő játék</p><div class="modal__dialog panel" id="other">Más ablak</div><div id="app"></div></body></html>');
  await page.addStyleTag({content:gameCSS+'\n.modal{position:fixed;inset:0;display:grid;place-items:center;background:#0009}.modal__dialog{position:relative;background:#29241c;color:#eee;padding:18px}.modal__close{position:absolute;right:10px;top:10px}.friends__panel{overflow:auto}.community__scroll{overflow:auto}.chat__form input{width:80%}'});
  await page.addStyleTag({path:path.join(addon,'enhanced-ui.css')});
  await page.addScriptTag({content:reactRuntime()});
  await page.addScriptTag({content:`window.saved={};window.chrome={runtime:{},storage:{local:{get(k,cb){cb(window.saved)},set(v,cb){Object.assign(window.saved,v);if(cb)cb()}},onChanged:{addListener(){}}}};window.actions=[];const h=React.createElement;
  function App(){const [open,O]=React.useState(true),[tab,T]=React.useState('friends'),[revision,R]=React.useState(0);window.fixture={reopen:()=>O(true),rerender:()=>R(x=>x+1)};return open?h('div',{className:'modal'},h('div',{className:'modal__dialog panel friends-modal'},h('button',{className:'modal__close',onClick:()=>O(false)},'X'),h('h2',{className:'modal__title'},'Közösség'),h('div',{className:'modal__body'},h('div',{className:'friends'},h('div',{className:'friends__tabs',role:'tablist'},...['friends','requests','pokes','community','settings'].map(x=>h('button',{key:x,role:'tab','aria-selected':x===tab,onClick:()=>T(x)},x))),h('div',{className:'friends__panel'+(tab==='community'?' friends__panel--community':''),role:'tabpanel'},tab==='friends'?h('ul',{className:'friends-list'},...Array.from({length:8},(_,i)=>h('li',{className:'friend-row',key:i},h('button',{className:'friend-row__who',onClick:()=>actions.push('profile')},'Mintabarát '+i),h('div',{className:'friend-row__meta'},'42. szint · harcos · királyság · céh'),h('div',{className:'friend-row__acts'},h('button',{onClick:()=>actions.push('message')},'Üzenet'))))):tab==='community'?h('div',{className:'chat community'},h('div',{className:'community__scroll'},h('ol',{className:'chat__list'},...Array.from({length:100},(_,i)=>h('li',{key:i},'Mintaüzenet '+i)))),h('form',{className:'chat__form community__form',onSubmit:e=>{e.preventDefault();actions.push('send')}},h('div',{className:'community__compose'},h('input',{'aria-label':'Üzenet'}),h('button',null,'Küldés')))):h('button',{onClick:()=>actions.push(tab)},tab+' eredeti művelet'),h('span',null,' '+revision)))))):h('button',{onClick:()=>O(true)},'Újranyitás');}
  ReactDOM.createRoot(document.querySelector('#app')).render(h(App));`});
  for(const file of ['enhanced-ui-config.js','enhanced-ui.js'])await page.addScriptTag({path:path.join(addon,file)});
  const dialog=page.locator('.friends-modal'),toggle=dialog.locator('.ssa-ui-toggle');
  await toggle.waitFor();const before=await dialog.boundingBox(),otherBefore=await page.locator('#other').boundingBox();
  await page.evaluate(()=>{window.originalFriend=document.querySelector('.friend-row__who');});
  await page.screenshot({path:path.join(out,'native-community-before.png')});
  await toggle.click();await page.waitForFunction(()=>document.querySelector('.friends-modal')?.classList.contains('ssa-ui-enabled'));
  const expanded=await dialog.boundingBox();assert(expanded.width>=1920*.9&&expanded.height>=1080*.9);
  assert.equal(await page.locator('.friend-row').count(),8);assert(await page.evaluate(()=>originalFriend===document.querySelector('.friend-row__who')));assert.deepEqual(await page.locator('#other').boundingBox(),otherBefore);assert.deepEqual(await page.evaluate(()=>actions),[]);await page.locator('.friend-row__who').first().click();assert.deepEqual(await page.evaluate(()=>actions),['profile']);
  await page.screenshot({path:path.join(out,'native-community-after.png')});
  for(const tab of ['requests','pokes','settings','community'])await dialog.getByRole('tab',{name:tab,exact:true}).click();
  const input=dialog.getByLabel('Üzenet');await input.fill('teszt');await page.evaluate(()=>fixture.rerender());assert.equal(await input.inputValue(),'teszt');assert(await input.isVisible());
  assert(await dialog.locator('.community__scroll').evaluate(n=>n.scrollHeight>n.clientHeight));await page.screenshot({path:path.join(out,'native-community-chat.png')});
  await dialog.getByRole('button',{name:'Küldés'}).click();assert.deepEqual(await page.evaluate(()=>actions),['profile','send']);
  for(const [width,height] of [[2560,1440],[1440,900],[390,844]]){await page.setViewportSize({width,height});const b=await dialog.boundingBox();assert(b.width<=width-15&&b.height<=height-15);assert(await input.isVisible());}
  await toggle.click();const restored=await dialog.boundingBox();assert(restored.width<expanded.width);
  await toggle.click();await dialog.locator('.modal__close').click();await page.getByText('Újranyitás').click();await page.waitForFunction(()=>document.querySelector('.friends-modal')?.classList.contains('ssa-ui-enabled'));
  assert.equal(await page.evaluate(()=>saved['ssaEnhancedUI.v2'].screens.community),true);
  await page.evaluate(()=>StonestormEnhancedUI.allOff());assert(!await dialog.evaluate(n=>n.classList.contains('ssa-ui-enabled')));
  assert.deepEqual(errors,[]);console.log('Native Community: React fixture, tabs, chat, restore, reopen, persistence and responsive geometry passed.');
} finally {await browser.close();}
