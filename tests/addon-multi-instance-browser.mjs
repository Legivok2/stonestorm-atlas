/* Synthetic React/CSP regression, not evidence of authenticated live-game success. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {root} from '../scripts/publication-plan.mjs';
import {reactRuntime} from './fixtures/enhanced-ui-page.mjs';

process.env.PLAYWRIGHT_BROWSERS_PATH=path.join(root,'.integration/browser-qa/browsers');
const {chromium}=await import(pathToFileURL(path.join(root,'.integration/browser-qa/node_modules/playwright/index.mjs')));
const out=path.join(root,'.integration/multi-instance'),addon=path.join(root,'addons/stonestorm-statcap-overlay');
fs.mkdirSync(out,{recursive:true});
const profile=fs.mkdtempSync(path.join(out,'qa-profile-'));
const context=await chromium.launchPersistentContext(profile,{channel:'chromium',headless:true,
  ignoreDefaultArgs:['--disable-extensions'],args:['--disable-extensions-except='+addon,'--load-extension='+addon],viewport:{width:1600,height:1000},acceptDownloads:true});
const react=reactRuntime(),cases=[],writes=[],errors=[];
let policy='allow',reads=0,childDocuments=0,cookieChecks=[];
const html=`<!doctype html><html lang="hu"><meta charset="utf-8"><title>HELYI SZINTETIKUS IFRAME TESZT – NEM ÉLŐ JÁTÉK</title>
<style>body{margin:0;background:#18241c;color:#eee;font:16px system-ui}.hud{padding:16px}.mine-window{border:1px solid #9d8656;margin:12px;padding:12px}button,input{font:inherit;margin:5px;padding:8px}.mine-window__body{height:600px;overflow:auto}.sample-note{background:#715422;padding:12px}</style>
<div class="sample-note">SZINTETIKUS REACT TESZT · NEM ÉLŐ JÁTÉK</div><div id="root"></div><script src="/fixture/react.js"></script><script src="/fixture/game.js"></script></html>`;
const script=`
const h=React.createElement;window.fixtureActions=[];window.fixtureTabClicks=[];
function Game(){const [tab,setTab]=React.useState('mine'),[qty,setQty]=React.useState('1'),[tick,setTick]=React.useState(0);
React.useEffect(()=>{const t=setInterval(()=>setTick(n=>n+1),100);return()=>clearInterval(t)},[]);
return h('main',{className:'game-stage'},h('header',{className:'hud'},'SZINTETIKUS HUD'),h('div',{className:'mine-stage'},h('div',{className:'stage-safe mine-safe'},h('section',{className:'stage-window mine-window'},h('h2',null,'Tárnák – teszt'),
h('div',{className:'tabs mine-tabs',role:'tablist'},...['mine','smelt','craft','master'].map(k=>h('button',{key:k,id:'tab-'+k,'data-mine-tab':k,role:'tab','aria-selected':tab===k,'aria-controls':'pane',onClick:()=>{fixtureTabClicks.push(k);setTab(k)}},k))),
h('div',{id:'pane',className:'mine-window__body',role:'tabpanel','aria-labelledby':'tab-'+tab},h('h3',null,tab),h('label',null,'Helyi tesztbevitel',h('input',{'aria-label':'Helyi tesztbevitel',value:qty,onChange:e=>setQty(e.target.value)})),h('output',null,qty),h('p',{className:'timer'},tick),h('button',{'data-resource':'',onClick:()=>fixtureActions.push('forbidden-test-action')},'Nem kattintható tesztművelet'),h('div',{style:{height:'1000px'}},'Saját görgetés'))))));}
ReactDOM.createRoot(document.querySelector('#root')).render(h(Game));`;

const check=async(name,fn)=>{console.log('Checking: '+name);await fn();cases.push({name,passed:true});};
const wait=async(fn,label,timeout=10000)=>{const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await new Promise(r=>setTimeout(r,75));}throw Error('Timeout: '+label);};
async function bind(page,id){
  const session=await context.newCDPSession(page);
  const find=node=>{if(node.attributes?.some((v,i)=>v==='id'&&node.attributes[i+1]===id))return node;for(const child of [...node.children??[],...node.shadowRoots??[]]){const result=find(child);if(result)return result;}return null;};
  const {root:doc}=await session.send('DOM.getDocument',{depth:-1,pierce:true}),host=find(doc);
  assert(host?.shadowRoots?.[0],'Closed shadow root '+id);
  const objectId=(await session.send('DOM.resolveNode',{nodeId:host.shadowRoots[0].nodeId})).object.objectId;
  return async(fn,args=[])=>{
    const result=await session.send('Runtime.callFunctionOn',{objectId,functionDeclaration:fn.toString(),arguments:args.map(value=>({value})),awaitPromise:true,returnByValue:true});
    if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description);
    return result.result.value;
  };
}
async function click(page,call,selector){
  const box=await call(function(selector){const n=this.querySelector(selector);if(!n)throw Error('Missing '+selector);n.scrollIntoView({block:'center'});const r=n.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,width:r.width,height:r.height,disabled:n.disabled};},[selector]);
  assert(box.width>0&&box.height>0&&!box.disabled,selector+' visible and enabled');
  await page.mouse.click(box.x,box.y);
}
let page,companion,probe,evaluate;
async function open(nextPolicy){
  policy=nextPolicy;
  page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  const session=await context.newCDPSession(page),worlds=[];
  session.on('Runtime.executionContextCreated',event=>worlds.push(event.context));await session.send('Runtime.enable');
  await page.goto('https://stonestorm.gg/mining',{waitUntil:'networkidle'});
  await page.locator('#ss-statcap-root').waitFor({state:'attached'});
  await page.locator('[data-mine-tab=mine]').waitFor();
  const world=worlds.findLast(c=>c.origin.startsWith('chrome-extension://'));
  assert(world,'Extension isolated world');
  evaluate=async expression=>{const r=await session.send('Runtime.evaluate',{contextId:world.id,expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value;};
  companion=await bind(page,'ss-statcap-root');
  if(await companion(function(){return !this.querySelector('[data-toggle]').hidden;}))await click(page,companion,'[data-toggle]');
  await click(page,companion,'.sc-nav [data-sc-nav=interfaces]');
}
async function start(){await click(page,companion,'[data-mi-start]');}
async function ready(){try{await wait(async()=>(await evaluate('StonestormMultiInstanceProbe.diagnostics()'))?.phase==='ready','two frames ready');}catch(error){console.log(JSON.stringify(await evaluate('StonestormMultiInstanceProbe.diagnostics()')));console.log(JSON.stringify(errors));throw error;}probe=await bind(page,'ssa-multi-instance-probe');}
try{
  await context.addCookies([{name:'qa-session',value:'synthetic-only',domain:'stonestorm.gg',path:'/',httpOnly:true,secure:true,sameSite:'Strict'}]);
  await context.route('https://stonestorm.gg/**',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(request.method()!=='GET'){writes.push({method:request.method(),path:url.pathname});return route.fulfill({status:405});}
    if(url.pathname==='/fixture/react.js')return route.fulfill({contentType:'text/javascript',body:react});
    if(url.pathname==='/fixture/game.js')return route.fulfill({contentType:'text/javascript',body:script});
    if(url.pathname!=='/mining')return route.fulfill({status:404,body:'Synthetic fixture only; external fallback is disabled.'});
    reads++;const child=!!request.frame().parentFrame();if(child)childDocuments++;
    const cookie=(await request.allHeaders()).cookie??'';cookieChecks.push(cookie.includes('qa-session=synthetic-only'));
    if(!cookieChecks.at(-1))return route.fulfill({status:401,body:'Synthetic session missing'});
    if(policy==='challenge'&&request.resourceType()==='fetch')return route.fulfill({status:403,headers:{'cf-mitigated':'challenge'},body:'Synthetic challenge'});
    let csp="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-src 'self'; frame-ancestors 'self'";
    if(policy==='parent-frame-src'&&!child&&request.resourceType()==='document')csp=csp.replace("frame-src 'self'","frame-src 'none'");
    if(policy==='child-ancestor'&&child)csp=csp.replace("frame-ancestors 'self'","frame-ancestors 'none'");
    const headers={'content-security-policy':csp,'x-frame-options':policy==='xfo-deny'&&request.resourceType()==='fetch'?'DENY':'SAMEORIGIN'};
    return route.fulfill({status:200,contentType:'text/html; charset=utf-8',headers,body:html});
  });
  await open('allow');
  await check('No unsolicited frames or reads; synthetic clicks cannot open the probe',async()=>{
    const before=reads;assert.equal(page.frames().length,1);
    await companion(function(){this.querySelector('[data-mi-start]').click();});
    assert.equal(page.frames().length,1);assert.equal(reads,before);
  });
  await check('Exactly two same-origin native documents, independent React tab handlers, same synthetic HttpOnly session',async()=>{
    await start();await ready();
    const d=await evaluate('StonestormMultiInstanceProbe.diagnostics()');
    assert.equal(page.frames().length,3);assert.equal(d.frames.length,2);assert(d.frames.every(f=>f.sameOriginDocument&&f.originalUI&&f.selected));
    assert.equal(d.independentNativeTabNavigation,true);assert.equal(d.twoFrameGatePassed,false);assert.equal(d.liveGameVerified,false);assert(cookieChecks.every(Boolean));
    for(const frame of page.frames().slice(1)){assert.equal(frame.url(),'https://stonestorm.gg/mining');assert.equal(await frame.locator('#ss-statcap-root,#ssa-multi-instance-probe').count(),0);}
    assert.equal(await page.locator('#root').evaluate(n=>n.inert),true);
  });
  await check('Both frames accept original input without switching the other frame; native timers and scroll remain independent',async()=>{
    const [left,right]=page.frames().slice(1);
    await left.getByLabel('Helyi tesztbevitel').fill('7');await right.getByLabel('Helyi tesztbevitel').fill('19');
    assert.equal(await left.locator('output').textContent(),'7');assert.equal(await right.locator('output').textContent(),'19');
    assert.equal(await left.locator('[data-mine-tab=mine]').getAttribute('aria-selected'),'true');assert.equal(await right.locator('[data-mine-tab=smelt]').getAttribute('aria-selected'),'true');
    const a=await left.locator('.timer').textContent(),b=await right.locator('.timer').textContent();
    await wait(async()=>await left.locator('.timer').textContent()!==a&&await right.locator('.timer').textContent()!==b,'both timers run');
    await left.locator('.mine-window__body').evaluate(n=>n.scrollTop=80);
    assert.equal(await left.locator('.mine-window__body').evaluate(n=>n.scrollTop),80);assert.equal(await right.locator('.mine-window__body').evaluate(n=>n.scrollTop),0);
    await page.screenshot({path:path.join(out,'synthetic-two-frame-test.png')});
  });
  await check('Export contains diagnostic flags, no cookie/form values, and no claim of live acceptance',async()=>{
    const downloadPromise=page.waitForEvent('download');await click(page,probe,'[data-download]');const download=await downloadPromise;
    const text=fs.readFileSync(await download.path(),'utf8'),d=JSON.parse(text);
    assert.equal(d.frames.length,2);assert.equal(d.liveGameVerified,false);assert(!text.includes('synthetic-only'));assert(!text.includes('"19"'));
  });
  await check('Repeated trusted starts never duplicate instances; close destroys child contexts and restores the original UI',async()=>{
    // The companion is under the workspace. Re-dispatching an untrusted click is also ignored.
    await companion(function(){this.querySelector('[data-mi-start]').click();});assert.equal(page.frames().length,3);
    await click(page,probe,'[data-close]');await wait(async()=>page.frames().length===1,'frames destroyed');
    assert.equal(await page.locator('#root').evaluate(n=>n.inert),false);assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
    await page.locator('[data-mine-tab=craft]').click();assert.equal(await page.locator('[data-mine-tab=craft]').getAttribute('aria-selected'),'true');
    assert.equal(await page.evaluate(()=>fixtureActions.length),0);
  });
  await check('Reopen creates exactly two fresh contexts and close during initialization does not leave background frames',async()=>{
    await click(page,companion,'[data-toggle]');await start();
    await wait(async()=>await page.locator('#ssa-multi-instance-probe').count()===1,'workspace appended');probe=await bind(page,'ssa-multi-instance-probe');
    await click(page,probe,'[data-close]');await wait(async()=>page.frames().length===1,'early cleanup');
    assert.equal(await page.locator('#root').evaluate(n=>n.inert),false);
  });await page.close();
  for(const mode of ['xfo-deny','challenge']){
    await open(mode);const before=childDocuments;
    await check('Preflight stops on '+mode+' without changing the parent or creating frames',async()=>{
      await start();await wait(async()=>(await evaluate('StonestormMultiInstanceProbe.diagnostics()'))?.phase==='blocked',mode+' blocked');
      assert.equal(page.frames().length,1);assert.equal(childDocuments,before);assert.equal(await page.locator('#root').evaluate(n=>n.inert),false);
    });await page.close();
  }
  await open('parent-frame-src');
  await check('Actual parent CSP frame-src is enforced by Chromium even when the preflight GET differs',async()=>{
    await start();await wait(async()=>{const d=await evaluate('StonestormMultiInstanceProbe.diagnostics()');if(d?.phase==='ready')throw Error('Unexpected parent CSP success: '+JSON.stringify(d));return d?.phase==='blocked';},'parent CSP blocked',30000);
    const d=await evaluate('StonestormMultiInstanceProbe.diagnostics()');assert(d.frames.every(f=>!f.originalUI));assert.equal(d.independentNativeTabNavigation,false);
    probe=await bind(page,'ssa-multi-instance-probe');await click(page,probe,'[data-close]');
  });await page.close();
  await open('child-ancestor');
  await check('Child frame-ancestors refusal never counts as success; no header removal or alternate preview',async()=>{
    await start();await wait(async()=>(await evaluate('StonestormMultiInstanceProbe.diagnostics()'))?.phase==='blocked','child ancestor blocked',30000);
    const d=await evaluate('StonestormMultiInstanceProbe.diagnostics()');assert.equal(d.independentNativeTabNavigation,false);assert(d.frames.every(f=>!f.originalUI));
    probe=await bind(page,'ssa-multi-instance-probe');assert.equal(await page.locator('#ssa-multi-instance-probe > iframe').count(),2);
    await click(page,probe,'[data-close]');
  });await page.close();
  assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  const report={schema:1,checkedAt:new Date().toISOString(),nativeMV3:true,realReact:true,syntheticFixtures:true,liveGameVerified:false,twoFrameGatePassed:false,cases,writes:writes.length,errors};
  fs.writeFileSync(path.join(root,'reports/multi-instance-verification.json'),JSON.stringify(report,null,2)+'\n');
  console.log('PASS '+cases.length+' synthetic browser checks; live-game gate remains unverified.');
}finally{await context.close();}
