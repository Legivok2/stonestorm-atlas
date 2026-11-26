'use strict';
const {BaseWindow,WebContentsView,ipcMain}=require('electron');
const path=require('node:path');const {pathToFileURL}=require('node:url');
const P=require('./policy.cjs'),M=require('./mining.cjs');
function createWorkspace({gameSession,width=1600,height=960,ratio=.5,preferences={},initialCount=4,
 initialURL=P.GAME_URL,allowedMain=P.gameURL,allowedFrame=P.frameURL,onChange=()=>{}}) {
 if(![1,2,4].includes(initialCount)||!allowedMain(initialURL))throw Error('Invalid initial workspace.');
 const win=new BaseWindow({title:'StoneStorm Workspace · Tárnák',width,height,minWidth:960,minHeight:600,backgroundColor:'#171a17',show:false});
 let pref=P.preferences({...preferences,ratio}),zoom=-1,disposed=false,layoutState,message='',scanning=false;
 const panels=[],events=[];
 const chromeURL=pathToFileURL(path.join(__dirname,'chrome.html')).href;
 const chromeView=new WebContentsView({webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,backgroundThrottling:false,preload:path.join(__dirname,'chrome-preload.cjs')}});
 chromeView.setBackgroundColor('#171a17');win.contentView.addChildView(chromeView);
 const ui=chromeView.webContents;
 ui.setWindowOpenHandler(()=>({action:'deny'}));
 ui.on('will-navigate',(event,url)=>{if((event.url??url)!==chromeURL)event.preventDefault();});
 ui.on('will-attach-webview',e=>e.preventDefault());
 function snapshot(){return {schema:2,at:new Date().toISOString(),nativeWindow:'BaseWindow',nativeView:'WebContentsView',panelCount:panels.length,
  sharedSession:panels.every(p=>p.view.webContents.session===gameSession),panels:panels.map(p=>({...p.state})),events:[...events],
  preferences:{...pref,cuts:[...pref.cuts]},ratio:pref.ratio,zoom,layout:layoutState,message,
  acceptance:{twoLive:{source:'user-confirmed-in-task',success:true},fourLive:'manual acceptance pending',communityLive:'not implemented'}};}
 function push(){if(!disposed&&!ui.isDestroyed())ui.send('workspace:state',snapshot());}
 function notify(){if(!disposed){push();onChange();}}
 function note(type,url){events.push({type,location:P.safeLocation(url),at:new Date().toISOString()});if(events.length>40)events.shift();notify();}
 function layout(){if(disposed)return;const [w,h]=win.getContentSize();chromeView.setBounds({x:0,y:0,width:w,height:h});layoutState=P.workspaceLayout(w,h,pref.mode,pref,zoom,panels.length||initialCount);
  panels.forEach((p,i)=>{const r=layoutState.games[i];p.view.setVisible(!!r);if(r)p.view.setBounds(r);});push();}
 async function restore(panel){const generation=panel.generation;if(panel.cssKey){const key=panel.cssKey;panel.cssKey=null;try{if(!panel.view.webContents.isDestroyed())await panel.view.webContents.removeInsertedCSS(key);}catch{}}if(generation===panel.generation)panel.state.compact=false;}
 async function scan(){if(disposed||scanning)return;scanning=true;
  try{await Promise.all(panels.map(async p=>{const wc=p.view.webContents;if(wc.isDestroyed())return;const before=JSON.stringify(p.state),generation=p.generation;const current=()=>!disposed&&!wc.isDestroyed()&&generation===p.generation;
   if(p.state.error){p.state.status='Hiba · '+p.state.error.description;await restore(p);}
   else if(p.state.challenge){p.state.status='Cloudflare · kézi ellenőrzés';await restore(p);}
   else if(!p.state.loaded){p.state.status='Betöltés…';}
   else if(!new URL(wc.getURL()).pathname.startsWith('/mining')){p.state.status=wc.getURL().includes('/login')?'Jelentkezz be kézzel':'Nyisd meg a Tárnákat';await restore(p);}
   else if(p.state.httpStatus!==200){p.state.status='HTTP '+p.state.httpStatus;await restore(p);}
   else {try{let result=await wc.executeJavaScript(M.script(p.state.key,false));if(!current())return;
     p.state.contract=result.valid?'verified':result.reason;
     if(!result.valid){p.state.status=result.reason==='changed'?'Megváltozott fülazonosítók':result.online===false?'Nincs kapcsolat':'Tárnák betöltése…';if(result.reason==='changed')p.prepare=false;await restore(p);}
     else {if(p.prepare||(pref.compact&&result.selected!==p.state.key)){await restore(p);if(!current())return;await wc.executeJavaScript(M.script(p.state.key,true));if(!current())return;result=await wc.executeJavaScript(M.script(p.state.key,false));if(!current())return;}
      p.state.selected=result.selected??null;p.state.online=result.online!==false;
      if(result.valid&&result.selected===p.state.key){p.prepare=false;if(pref.compact&&!p.cssKey){const key=await wc.insertCSS(M.css,{cssOrigin:'user'});if(!current())return;p.cssKey=key;p.state.compact=true;}
       if(!pref.compact)await restore(p);p.state.status=!p.state.online?'Kapcsolat nélkül':p.state.readError?'Adatfrissítési hiba':(p.state.compact?'Aktív · kompakt':'Aktív · eredeti');}
      else {await restore(p);p.state.status='Másik eredeti fül';}
     }
    }catch{if(!current())return;p.state.status='Oldalváltás / újratöltés';await restore(p);}}
   if(current()&&before!==JSON.stringify(p.state))notify();
  }));}finally{scanning=false;}}
 function add(){const index=panels.length,definition=P.PANELS[index];const view=new WebContentsView({webPreferences:P.webPreferences(gameSession)}),wc=view.webContents;
  const p={view,generation:0,cssKey:null,prepare:pref.compact,state:{id:wc.id,index,key:definition.key,name:definition.name,httpStatus:null,challenge:false,error:null,location:P.safeLocation(initialURL),titleKind:'not-loaded',loaded:false,selected:null,compact:false,contract:'waiting',lastMiningReadAt:null,readError:null,status:'Betöltés…'}};
  panels.push(p);win.contentView.addChildView(view);layout();
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
  wc.loadURL(initialURL).catch(e=>{if(disposed||wc.isDestroyed()||e.code==='ERR_ABORTED')return;p.state.error={code:e.code,description:'loadURL failed'};notify();});return p;}
 gameSession.webRequest.onResponseStarted(d=>{const p=panels.find(p=>p.view.webContents.id===d.webContentsId);if(!p)return;const url=new URL(d.url);if(d.method==='GET'&&url.origin===new URL(initialURL).origin&&url.pathname==='/api/mining'){p.state.lastMiningReadAt=new Date().toISOString();p.state.readError=d.statusCode===200?null:'HTTP '+d.statusCode;notify();}if(d.resourceType!=='mainFrame')return;
  const h=Object.entries(d.responseHeaders||{}).find(([k])=>k.toLowerCase()==='cf-mitigated')?.[1];Object.assign(p.state,{httpStatus:d.statusCode,challenge:Array.isArray(h)?h.includes('challenge'):h==='challenge',location:P.safeLocation(d.url)});notify();});
 gameSession.webRequest.onErrorOccurred(d=>{const url=new URL(d.url),p=panels.find(p=>p.view.webContents.id===d.webContentsId);if(p&&d.method==='GET'&&url.origin===new URL(initialURL).origin&&url.pathname==='/api/mining'){p.state.readError=d.error;notify();}});
 function validIndex(i){return Number.isInteger(i)&&i>=0&&i<panels.length;}
 async function reload(index){if(!validIndex(index))return;const p=panels[index];if(p.reloadPromise)return p.reloadPromise;p.reloadPromise=(async()=>{await restore(p);p.prepare=pref.compact;await p.view.webContents.loadURL(initialURL).catch(()=>{});})().finally(()=>{p.reloadPromise=null;});return p.reloadPromise;}
 async function action({action,index,value}={}){
  if(disposed)return;
  if(action==='reload'&&validIndex(index))await reload(index);
  else if(action==='refresh'){message='Eredeti oldalak újratöltése · a beírt értékek elveszhetnek';notify();await Promise.all(panels.map((_,i)=>reload(i)));message='Oldalak újratöltve · az adatokat az eredeti kliens tölti be';}
  else if(action==='zoom'&&validIndex(index)){zoom=zoom===index?-1:index;layout();}
  else if(action==='mode'&&['columns','grid'].includes(value)){pref.mode=value;zoom=-1;layout();}
  else if(action==='compact'&&typeof value==='boolean'){pref.compact=value;for(const p of panels){await restore(p);p.prepare=value;}await scan();}
  else if(action==='split'&&value&&['x','y'].includes(value.axis)&&Number.isFinite(value.value)){
   if(pref.mode==='columns'&&value.axis==='x'&&Number.isInteger(index)&&index>=0&&index<3){const a=[...pref.cuts],lo=index?a[index-1]+.12:.12,hi=index<2?a[index+1]-.12:.88;a[index]=Math.max(lo,Math.min(hi,value.value));pref.cuts=a;}
   else if(pref.mode==='grid'){pref[value.axis==='x'?'column':'row']=Math.max(.2,Math.min(.8,value.value));}layout();}
  else if(action==='reset'){pref={...pref,cuts:[.25,.5,.75],column:.5,row:.5};zoom=-1;layout();}
  else return;notify();return true;
 }
 function trusted(event){return event.sender===ui&&event.senderFrame===ui.mainFrame&&event.senderFrame.url===chromeURL;}
 const handle=(e,data)=>{if(!trusted(e))throw Error('Untrusted workspace sender');return action(data);};
 const ready=e=>{if(trusted(e))push();};ipcMain.handle('workspace:action',handle);ipcMain.on('workspace:ready',ready);
 ui.on('did-finish-load',push);void ui.loadURL(chromeURL);
 for(let i=0;i<initialCount;i++)add();layout();
 const timer=setInterval(()=>void scan(),1000);
 win.on('resize',()=>{layout();notify();});
 win.on('closed',()=>{disposed=true;clearInterval(timer);ipcMain.removeHandler('workspace:action');ipcMain.removeListener('workspace:ready',ready);gameSession.webRequest.onResponseStarted(null);gameSession.webRequest.onErrorOccurred(null);
  for(const {view} of panels)if(!view.webContents.isDestroyed())view.webContents.close({waitForBeforeUnload:false});if(!ui.isDestroyed())ui.close({waitForBeforeUnload:false});panels.length=0;});
 win.show();
 return {win,panels,chromeView,snapshot,layout,action,reload,scan,restore,
  openMining:reload,focus:i=>{if(validIndex(i))panels[i].view.webContents.focus();},close:()=>{if(!win.isDestroyed())win.close();}};
}
module.exports={createWorkspace};
