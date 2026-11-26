'use strict';
const {BaseWindow,WebContentsView,ipcMain}=require('electron');
const path=require('node:path');const {pathToFileURL}=require('node:url');
const P=require('./policy.cjs'),M=require('./mining.cjs');
const {WorkspaceModeManager}=require('./mode-manager.cjs');
const LOCALES={hu:require('./i18n/hu.json'),en:require('./i18n/en.json')};
function createWorkspace({gameSession,width=1600,height=960,ratio=.5,preferences={},initialCount,
 initialURL=P.GAME_URL,gameURL=P.DEFAULT_GAME_URL,allowedMain=P.gameURL,allowedFrame=P.frameURL,onChange=()=>{}}) {
 if((initialCount!==undefined&&![1,4].includes(initialCount))||!allowedMain(initialURL)||!allowedMain(gameURL))throw Error('Invalid initial workspace.');
 const win=new BaseWindow({title:'StoneStorm Workspace · Tárnák',width,height,minWidth:960,minHeight:600,backgroundColor:'#171a17',show:false});
 let pref=P.preferences({...preferences,ratio}),zoom=-1,disposed=false,layoutState,message='',scanning=false,scanPending=Promise.resolve(),settingsOpen=false,manager;
 const startup=initialCount===4?'MINING':initialCount===1?'GAME':P.startupMode(pref);
 const resources={created:0,closed:0};
 const panels=[],events=[];
 const chromeURL=pathToFileURL(path.join(__dirname,'chrome.html')).href;
 const chromeView=new WebContentsView({webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,backgroundThrottling:false,preload:path.join(__dirname,'chrome-preload.cjs')}});
 chromeView.setBackgroundColor('#171a17');win.contentView.addChildView(chromeView);
 const ui=chromeView.webContents;
 ui.setWindowOpenHandler(()=>({action:'deny'}));
 ui.on('will-navigate',(event,url)=>{if((event.url??url)!==chromeURL)event.preventDefault();});
 ui.on('will-attach-webview',e=>e.preventDefault());
 function snapshot(){return {schema:3,at:new Date().toISOString(),nativeWindow:'BaseWindow',nativeView:'WebContentsView',panelCount:panels.length,locales:LOCALES,
  workspaceMode:manager?.mode??startup,transitioning:manager?.transitioning??false,primaryId:panels[0]?.state.id??null,previousGamePage:manager?.previousGamePage?.url??null,settingsOpen,fullscreen:!win.isDestroyed()&&win.isFullScreen(),canGoBack:canGoBack(),resources:{...resources,activeGames:panels.length,retiring:manager?.retiring.size??0,scanTimers:disposed?0:1},
  sharedSession:panels.every(p=>p.view.webContents.session===gameSession),panels:panels.map(p=>({...p.state})),events:[...events],
  preferences:{...pref,lastWorkspace:manager?.mode??startup,cuts:[...pref.cuts]},ratio:pref.ratio,zoom,layout:layoutState,message,
  acceptance:{twoLive:{source:'user-confirmed-in-task',success:true},fourLive:{source:'user-confirmed-in-task',success:true},modeSwitching:'manual acceptance pending',communityLive:'not implemented'}};}
 function push(){if(!disposed&&!ui.isDestroyed())ui.send('workspace:state',snapshot());}
 function notify(){if(!disposed){if((manager?.mode??startup)==='GAME'&&panels[0]){const p=panels[0];p.state.name='Játék';p.state.status=p.state.error?'Hiba · '+p.state.error.description:p.state.challenge?'Cloudflare · kézi ellenőrzés':p.state.loaded?'Eredeti játék':'Betöltés…';}push();onChange();}}
 function note(type,url){events.push({type,location:P.safeLocation(url),at:new Date().toISOString()});if(events.length>40)events.shift();notify();}
 function layout(){if(disposed)return;const [w,h]=win.getContentSize();chromeView.setBounds({x:0,y:0,width:w,height:h});const gameMode=(manager?.mode??startup)==='GAME';win.setTitle('StoneStorm Workspace · '+(gameMode?'Játék':'Tárnák'));layoutState=P.workspaceLayout(w,h,pref.mode,pref,zoom,panels.length||1,44+(settingsOpen?236:0),gameMode);
  panels.forEach((p,i)=>{const r=layoutState.games[i];p.view.setVisible(!!r);if(r)p.view.setBounds(r);});push();}
 async function restore(panel){const generation=panel.generation;if(panel.cssKey){const key=panel.cssKey;panel.cssKey=null;try{if(!panel.view.webContents.isDestroyed())await panel.view.webContents.removeInsertedCSS(key);}catch{}}if(generation===panel.generation)panel.state.compact=false;}
 function scan(){if(disposed||scanning||!manager||manager.mode!=='MINING'||manager.transitioning)return scanPending;scanning=true;const epoch=manager.epoch;
  scanPending=(async()=>{try{await Promise.all(panels.map(async p=>{const wc=p.view.webContents;if(wc.isDestroyed())return;const before=JSON.stringify(p.state),generation=p.generation;const current=()=>!disposed&&!wc.isDestroyed()&&generation===p.generation&&manager.mode==='MINING'&&!manager.transitioning&&manager.epoch===epoch;
   if(p.state.error){p.state.status='Hiba · '+p.state.error.description;await restore(p);}
   else if(p.state.challenge){p.state.status='Cloudflare · kézi ellenőrzés';await restore(p);}
   else if(!p.state.loaded){p.state.status='Betöltés…';}
   else if(!new URL(wc.getURL()).pathname.startsWith('/mining')){p.state.status=wc.getURL().includes('/login')?'Jelentkezz be kézzel':'Nyisd meg a Tárnákat';await restore(p);}
   else if(p.state.httpStatus!==200){p.state.status='HTTP '+p.state.httpStatus;await restore(p);}
   else if(p.state.readError){p.state.contract='read-error';p.state.status=p.state.readError==='HTTP 429'?'HTTP 429 · Próbáld később kézzel':'Adatfrissítési hiba';await restore(p);}
   else {try{let result=await wc.executeJavaScript(M.script(p.state.key,false));if(!current())return;
     p.state.contract=result.valid?'verified':result.reason;
     if(!result.valid){p.state.status=result.reason==='changed'?'Megváltozott fülazonosítók':result.online===false?'Nincs kapcsolat':'Tárnák betöltése…';if(result.reason==='changed')p.prepare=false;await restore(p);}
     else {if(p.prepare||(pref.compact&&result.selected!==p.state.key)){await restore(p);if(!current())return;await wc.executeJavaScript(M.script(p.state.key,true));if(!current())return;result=await wc.executeJavaScript(M.script(p.state.key,false));if(!current())return;}
      p.state.selected=result.selected??null;p.state.online=result.online!==false;
      if(result.valid&&result.selected===p.state.key){p.prepare=false;if(pref.compact&&!p.cssKey){const key=await wc.insertCSS(M.css,{cssOrigin:'user'});if(!current()){try{await wc.removeInsertedCSS(key);}catch{}return;}p.cssKey=key;p.state.compact=true;}
       if(!pref.compact)await restore(p);p.state.status=!p.state.online?'Kapcsolat nélkül':p.state.readError?'Adatfrissítési hiba':(p.state.compact?'Aktív · kompakt':'Aktív · eredeti');}
      else {await restore(p);p.state.status='Másik eredeti fül';}
     }
    }catch{if(!current())return;p.state.status='Oldalváltás / újratöltés';await restore(p);}}
   if(current()&&before!==JSON.stringify(p.state))notify();
  }));}finally{scanning=false;}})();return scanPending;}
 function add(url=initialURL){const index=panels.length,definition=P.PANELS[index];const view=new WebContentsView({webPreferences:P.webPreferences(gameSession)}),wc=view.webContents;
  const p={view,generation:0,cssKey:null,prepare:pref.compact,state:{id:wc.id,index,key:definition.key,name:definition.name,httpStatus:null,challenge:false,error:null,location:P.safeLocation(url),titleKind:'not-loaded',loaded:false,selected:null,compact:false,contract:'waiting',lastMiningReadAt:null,readError:null,status:'Betöltés…'}};
  resources.created++;panels.push(p);win.contentView.addChildView(view);layout();wc.once('destroyed',()=>{resources.closed++;notify();});
  wc.setWindowOpenHandler(({url})=>{note('popup-denied',url);return {action:'deny'};});wc.on('will-attach-webview',e=>e.preventDefault());
  wc.on('will-navigate',(e,url)=>{const target=e.url??url;if(!allowedMain(target)){e.preventDefault();note('main-navigation-denied',target);}});
  wc.on('will-frame-navigate',e=>{if(!(e.isMainFrame?allowedMain(e.url):allowedFrame(e.url))){e.preventDefault();note(e.isMainFrame?'main-navigation-denied':'frame-navigation-denied',e.url);}});
  wc.on('will-redirect',(e,url,_inPlace,isMain)=>{const target=e.url??url;if(!((e.isMainFrame??isMain)?allowedMain(target):allowedFrame(target))){e.preventDefault();note('redirect-denied',target);}});
  wc.on('did-start-navigation',e=>{if(e.isMainFrame&&!e.isSameDocument){p.generation++;p.cssKey=null;p.prepare=true;Object.assign(p.state,{loaded:false,error:null,httpStatus:null,challenge:false,compact:false,selected:null,contract:'waiting',lastMiningReadAt:null,readError:null,status:'Betöltés…'});notify();}});
  wc.on('did-navigate',(_e,url,code)=>{p.state.location=P.safeLocation(url);p.state.httpStatus=code;notify();});
  wc.on('did-navigate-in-page',(_e,url,isMain)=>{if(isMain){p.state.location=P.safeLocation(url);p.prepare=true;void scan();notify();}});
  wc.on('page-title-updated',(_e,title)=>{p.state.titleKind=P.pageKind(title);if(p.state.titleKind==='challenge')p.state.challenge=true;notify();});
  wc.on('did-finish-load',()=>{p.state.loaded=true;void scan();notify();});
  wc.on('did-fail-load',(_e,code,description,url,isMain)=>{if(!isMain||code===-3)return;p.state.error={code,description};note('main-load-failed',url);void scan();});
  wc.on('render-process-gone',(_e,d)=>{p.state.error={code:d.exitCode,description:'Renderer: '+d.reason};notify();});
  wc.loadURL(url).catch(e=>{if(disposed||wc.isDestroyed()||e.code==='ERR_ABORTED')return;p.state.error={code:e.code,description:'loadURL failed'};notify();});return p;}
 gameSession.webRequest.onResponseStarted(d=>{const p=panels.find(p=>p.view.webContents.id===d.webContentsId);if(!p)return;const url=new URL(d.url);if(d.method==='GET'&&url.origin===new URL(initialURL).origin&&url.pathname==='/api/mining'){p.state.lastMiningReadAt=new Date().toISOString();p.state.readError=d.statusCode===200?null:'HTTP '+d.statusCode;notify();}if(d.resourceType!=='mainFrame')return;
  const h=Object.entries(d.responseHeaders||{}).find(([k])=>k.toLowerCase()==='cf-mitigated')?.[1];Object.assign(p.state,{httpStatus:d.statusCode,challenge:Array.isArray(h)?h.includes('challenge'):h==='challenge',location:P.safeLocation(d.url)});notify();});
 gameSession.webRequest.onErrorOccurred(d=>{const url=new URL(d.url),p=panels.find(p=>p.view.webContents.id===d.webContentsId);if(p&&d.method==='GET'&&url.origin===new URL(initialURL).origin&&url.pathname==='/api/mining'){p.state.readError=d.error;notify();}});
 function validIndex(i){return Number.isInteger(i)&&i>=0&&i<panels.length;}
 async function reload(index){if(!validIndex(index))return;const p=panels[index];if(p.reloadPromise)return p.reloadPromise;p.reloadPromise=(async()=>{await restore(p);p.prepare=pref.compact;if(manager.mode==='GAME')p.view.webContents.reload();else await p.view.webContents.loadURL(initialURL).catch(()=>{});})().finally(()=>{p.reloadPromise=null;});return p.reloadPromise;}
 async function action({action,index,value}={}){
  if(disposed)return;
  if(action==='workspace')return manager.setMode(value);
  if(manager.transitioning)await manager.pending;
  if(disposed)return;
  if(action==='back'){if(manager.mode==='MINING')return manager.setMode('GAME');const wc=manager.primary.view.webContents;if(canGoBack())wc.navigationHistory.goBack();}
  else if(action==='settings'&&typeof value==='boolean'){settingsOpen=value;layout();}
  else if(action==='fullscreen'){pref.fullscreen=typeof value==='boolean'?value:!win.isFullScreen();win.setFullScreen(pref.fullscreen);}
  else if(action==='setting'&&['rememberWorkspace','savePanelSizes'].includes(index)&&typeof value==='boolean'){pref[index]=value;}
  else if(action==='setting'&&index==='language'&&['hu','en'].includes(value)){pref.language=value;}
  else if(action==='reload'&&validIndex(index))await reload(index);
  else if(action==='refresh'){message='Eredeti oldalak újratöltése · a beírt értékek elveszhetnek';notify();await Promise.all(panels.map((_,i)=>reload(i)));message='Oldalak újratöltve · az adatokat az eredeti kliens tölti be';}
  else if(action==='zoom'&&manager.mode==='MINING'&&validIndex(index)){zoom=zoom===index?-1:index;layout();}
  else if(action==='mode'&&['columns','grid'].includes(value)){pref.mode=value;zoom=-1;layout();}
  else if(action==='compact'&&manager.mode==='MINING'&&typeof value==='boolean'){pref.compact=value;for(const p of panels){await restore(p);p.prepare=value;}await scan();}
  else if(action==='split'&&manager.mode==='MINING'&&value&&['x','y'].includes(value.axis)&&Number.isFinite(value.value)){
   if(pref.mode==='columns'&&value.axis==='x'&&Number.isInteger(index)&&index>=0&&index<3){const a=[...pref.cuts],lo=index?a[index-1]+.12:.12,hi=index<2?a[index+1]-.12:.88;a[index]=Math.max(lo,Math.min(hi,value.value));pref.cuts=a;}
   else if(pref.mode==='grid'){pref[value.axis==='x'?'column':'row']=Math.max(.2,Math.min(.8,value.value));}layout();}
  else if(action==='reset'){pref={...pref,cuts:[.25,.5,.75],column:.5,row:.5};zoom=-1;layout();}
  else return;notify();return true;
 }
 function trusted(event){return event.sender===ui&&event.senderFrame===ui.mainFrame&&event.senderFrame.url===chromeURL;}
 const handle=(e,data)=>{if(!trusted(e))throw Error('Untrusted workspace sender');return action(data);};
 const ready=e=>{if(trusted(e))push();};ipcMain.handle('workspace:action',handle);ipcMain.on('workspace:ready',ready);
 ui.on('did-finish-load',push);void ui.loadURL(chromeURL);
 function canGoBack(){const wc=panels[0]?.view.webContents;if(!wc||wc.isDestroyed())return false;if((manager?.mode??startup)==='MINING')return true;const h=wc.navigationHistory;return h.canGoBack()&&allowedMain(h.getEntryAtIndex(h.getActiveIndex()-1)?.url);}
 async function destroyPanel(panel){panel.generation++;panel.prepare=false;win.contentView.removeChildView(panel.view);const wc=panel.view.webContents;if(wc.isDestroyed())return;await new Promise(resolve=>{wc.once('destroyed',resolve);wc.close({waitForBeforeUnload:false});});}
 function navigate(panel,url){if(!allowedMain(url)||panel.view.webContents.isDestroyed())return;void panel.view.webContents.loadURL(url).catch(e=>{if(!disposed&&!panel.view.webContents.isDestroyed()&&e.code!=='ERR_ABORTED'){panel.state.error={code:e.code,description:'loadURL failed'};notify();}});}
 add(startup==='MINING'?initialURL:gameURL);
 manager=new WorkspaceModeManager({panels,initialMode:startup,
  captureReturn:async p=>{await scanPending;if(!p.state.loaded||p.state.error||p.state.challenge||p.state.httpStatus!==200)return null;const wc=p.view.webContents,url=P.safeReturnLocation(wc.getURL(),gameURL);return url&&allowedMain(url)?{url,index:wc.navigationHistory.getActiveIndex()}:null;},
  enterMining:async p=>{await scanPending;await restore(p);p.prepare=pref.compact;if(p.view.webContents.getURL()!==initialURL)navigate(p,initialURL);},
  leaveMining:async(p,previous)=>{await scanPending;await restore(p);p.prepare=false;p.state.selected=null;p.state.contract='not-applicable';zoom=-1;
   const wc=p.view.webContents,url=previous?.url;
   if(url&&allowedMain(url)&&P.safeReturnLocation(url,gameURL)&&wc.getURL()!==url){const h=wc.navigationHistory,entry=h.getEntryAtIndex(previous.index);if(entry?.url===url&&h.getActiveIndex()!==previous.index)h.goToIndex(previous.index);else navigate(p,url);}},
  createPanel:()=>add(),destroyPanel,
  onChange:()=>{if(disposed)return;if(manager?.mode==='MINING'&&panels[0])panels[0].state.name=P.PANELS[0].name;pref.lastWorkspace=manager?.mode??startup;layout();notify();if(manager&&!manager.transitioning)void scan();}
 });
 if(startup==='MINING')while(panels.length<4)add();layout();
 win.on('enter-full-screen',()=>{pref.fullscreen=true;layout();notify();});win.on('leave-full-screen',()=>{pref.fullscreen=false;layout();notify();});
 if(pref.fullscreen)win.setFullScreen(true);

 const timer=setInterval(()=>void scan(),1000);
 win.on('resize',()=>{layout();notify();});
 win.on('closed',()=>{disposed=true;manager.dispose();clearInterval(timer);ipcMain.removeHandler('workspace:action');ipcMain.removeListener('workspace:ready',ready);gameSession.webRequest.onResponseStarted(null);gameSession.webRequest.onErrorOccurred(null);
  for(const {view} of new Set([...panels,...manager.retiring]))if(!view.webContents.isDestroyed())view.webContents.close({waitForBeforeUnload:false});if(!ui.isDestroyed())ui.close({waitForBeforeUnload:false});panels.length=0;});
 win.show();
 return {win,panels,chromeView,snapshot,layout,action,reload,scan,restore,modeManager:manager,setWorkspaceMode:mode=>manager.setMode(mode),
  openMining:reload,focus:i=>{if(validIndex(i))panels[i].view.webContents.focus();},close:()=>{if(!win.isDestroyed())win.close();}};
}
module.exports={createWorkspace};
