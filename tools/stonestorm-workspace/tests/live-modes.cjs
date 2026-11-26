'use strict';
// Manual invocation only. Original game, own prior Electron probe session,
// navigation/tab/scroll only; no gameplay action buttons or API replay.
const {app,session,webContents,desktopCapturer,BaseWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const P=require('../src/policy.cjs'),{createWorkspace}=require('../src/workspace.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'reports');
app.setPath('userData',path.join(root,'.probe-profile'));app.enableSandbox();app.on('window-all-closed',()=>{});
let ws;const tests=[],samples=[];const timeout=setTimeout(()=>{console.error('Live mode test timed out');ws?.close();app.exit(1)},90000);
const wait=async(fn,label)=>{const end=Date.now()+25000;while(Date.now()<end){if(await fn())return;await new Promise(r=>setTimeout(r,100));}throw Error('Timeout '+label+' '+JSON.stringify(ws?.snapshot().panels));};
const check=async(name,fn)=>{await fn();tests.push({name,passed:true});console.log('PASS '+name);};
app.whenReady().then(async()=>{
 const gameSession=session.fromPartition(P.SESSION_PARTITION),writes=[];
 gameSession.webRequest.onBeforeRequest((d,cb)=>{const u=new URL(d.url);if(u.origin==='https://stonestorm.gg'&&u.pathname.startsWith('/api/mining/')&&!['GET','HEAD'].includes(d.method))writes.push({method:d.method,path:u.pathname});cb({});});
 ws=createWorkspace({gameSession,width:1600,height:980});
 const primary=ws.panels[0].view.webContents,id=primary.id,read=code=>primary.executeJavaScript(code);
 const count=()=>webContents.getAllWebContents().filter(w=>!w.isDestroyed()&&w.session===gameSession).length;
 const normalReady=()=>wait(async()=>ws.snapshot().workspaceMode==='GAME'&&ws.panels.length===1&&ws.panels[0].state.loaded&&await read('!!document.querySelector(".game-stage>.hud")&&getComputedStyle(document.querySelector(".hud")).display!=="none"'),'original normal game');
 const miningReady=()=>wait(()=>ws.panels.length===4&&ws.panels.every(p=>p.state.compact),'four original mining panels');
 const capture=async name=>{ws.win.focus();await new Promise(r=>setTimeout(r,250));const sources=await desktopCapturer.getSources({types:['window'],thumbnailSize:{width:2000,height:1400}}),own=sources.find(s=>s.id===ws.win.getMediaSourceId());if(!own)throw Error('Own native window capture unavailable');fs.writeFileSync(path.join(out,name+'.png'),own.thumbnail.toPNG());};
 await normalReady();
 await check('Original normal game starts alone with visible HUD/navigation and no compact CSS',async()=>{assert.equal(count(),1);assert.equal(ws.panels[0].cssKey,null);assert.notEqual(await read('getComputedStyle(document.querySelector(".rail")).display'),'none');assert(!primary.getURL().includes('/login'));});
 await capture('mode-normal');
 let priorURL=primary.getURL();
 await check('Original normal navigation remains available before entering the mining workspace',async()=>{const href=await read('(()=>{const a=[...document.querySelectorAll(".rail a[href]")].find(a=>["/char","/character"].includes(new URL(a.href).pathname));return a?new URL(a.href).pathname:null})()');
  if(href){await read('setTimeout(()=>[...document.querySelectorAll(".rail a[href]")].find(a=>new URL(a.href).pathname==='+JSON.stringify(href)+').click(),0);true');await wait(()=>new URL(primary.getURL()).pathname===href,'original character navigation');await normalReady();}priorURL=primary.getURL();assert.equal(primary.id,id);});
 await check('Repeated MINING activation reuses primary and creates exactly three other originals',async()=>{await Promise.all(Array.from({length:8},()=>ws.setWorkspaceMode('MINING')));await miningReady();assert.equal(count(),4);assert.equal(ws.snapshot().primaryId,id);assert.deepEqual(ws.snapshot().panels.map(p=>p.selected),['mine','smelt','craft','master']);assert(ws.panels.every(p=>p.state.httpStatus===200&&!p.state.challenge&&!p.state.error));});
 await capture('mode-mining');
 const retired=ws.panels.slice(1).map(p=>p.view.webContents);
 await check('Returning to GAME closes all three secondaries and restores the original authenticated primary',async()=>{await ws.setWorkspaceMode('GAME');await normalReady();await wait(()=>primary.getURL()===priorURL,'prior game URL');assert(retired.every(w=>w.isDestroyed()));assert.equal(count(),1);assert.equal(primary.id,id);assert.equal(primary.session,gameSession);assert.equal(ws.panels[0].cssKey,null);assert.notEqual(await read('getComputedStyle(document.querySelector(".rail")).display'),'none');assert(!primary.getURL().includes('/login'));});
 await capture('mode-returned');
 await check('Three further live cycles keep one authenticated primary and no hidden extra game',async()=>{for(let cycle=0;cycle<3;cycle++){await ws.setWorkspaceMode('MINING');await miningReady();const extra=ws.panels.slice(1).map(p=>p.view.webContents);await ws.setWorkspaceMode('GAME');await normalReady();assert(extra.every(w=>w.isDestroyed()));assert.equal(count(),1);assert.equal(primary.id,id);assert(!primary.getURL().includes('/login'));await new Promise(r=>setTimeout(r,200));samples.push({cycle,activeGames:count(),resources:ws.snapshot().resources,workingSetKB:app.getAppMetrics().reduce((s,m)=>s+m.memory.workingSetSize,0)});}});
 await check('Settings fit above the original game and do not create a fifth game',async()=>{await ws.action({action:'settings',value:true});assert.equal(count(),1);assert.equal(ws.snapshot().layout.games[0].y,280);await capture('mode-settings');await ws.action({action:'settings',value:false});assert.equal(ws.snapshot().layout.games[0].y,44);});
 assert.equal(writes.length,0);const beforeClose=ws.snapshot(),all=webContents.getAllWebContents();ws.close();await wait(()=>all.every(w=>w.isDestroyed()),'full teardown');
 await check('Closing the Windows app destroys every owned game and control webContents',async()=>{assert.equal(BaseWindow.getAllWindows().length,0);assert.equal(webContents.getAllWebContents().length,0);});
 clearTimeout(timeout);fs.writeFileSync(path.join(out,'modes-live.json'),JSON.stringify({schema:1,version:'0.3.0',at:new Date().toISOString(),realHTTPSGame:true,freshLoginTested:false,authenticatedSessionRetained:true,resourceConsumingActionsTested:false,miningMutations:writes.length,tests,primaryId:id,previousGamePage:P.safeLocation(priorURL),memorySamples:samples,snapshotBeforeClose:beforeClose,resourcesAfterClose:ws.snapshot().resources},null,2)+'\n');app.exit(0);
}).catch(async e=>{console.error(e);clearTimeout(timeout);const before=ws?.snapshot(),all=webContents.getAllWebContents();ws?.close();const end=Date.now()+5000;while(all.some(w=>!w.isDestroyed())&&Date.now()<end)await new Promise(r=>setTimeout(r,40));fs.writeFileSync(path.join(out,'modes-live.json'),JSON.stringify({schema:1,version:'0.3.0',at:new Date().toISOString(),realHTTPSGame:true,result:'partial',tests,completedAdditionalCycles:samples.length,memorySamples:samples,error:e.message,snapshotAtFailure:before,resourcesAfterClose:ws?.snapshot().resources,resourceConsumingActionsTested:false},null,2)+'\n');app.exit(1)});
