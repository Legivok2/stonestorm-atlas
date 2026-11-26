'use strict';

const GAME_URL = 'https://stonestorm.gg/mining';
const SESSION_PARTITION = 'persist:stonestorm-workspace-v1';
const PANELS = Object.freeze([{key:'mine',name:'Tárna'},{key:'smelt',name:'Olvasztó'},{key:'craft',name:'Műhely'},{key:'master',name:'Gwangsu'}]);
function parseURL(value) {
  try {
    const url = new URL(value);
    return url.username || url.password ? null : url;
  } catch { return null; }
}
function gameURL(value) {
  const url = parseURL(value);
  return !!url && url.origin === 'https://stonestorm.gg';
}
function frameURL(value) {
  const url = parseURL(value);
  return gameURL(value) || value === 'about:blank' || (!!url && url.origin === 'https://challenges.cloudflare.com');
}
function safeLocation(value) {
  const url = parseURL(value);
  return url && ['https:', 'http:'].includes(url.protocol) ? url.origin + url.pathname : '(blocked scheme)';
}
function pageKind(title) {
  if (/just a moment|checking your browser|attention required|verify you are human/i.test(title)) return 'challenge';
  if (/stonestorm/i.test(title)) return 'stonestorm-title';
  return 'other-title';
}
function canConfirmSingle(state) {
  return state.loaded === true && state.httpStatus === 200 && !state.challenge && !state.error && gameURL(state.location) && parseURL(state.location).pathname.replace(/\/$/, '') === '/mining';
}
function probeOutcome(state) {
  if (state?.challenge) return 'blocked-challenge';
  if (state?.error) return 'navigation-error';
  if (!state?.loaded) return 'load-incomplete';
  if (state.httpStatus !== 200) return 'http-error';
  return 'manual-game-and-login-verification-required';
}
function rectangles(width, height, count, ratio = .5) {
  width = Math.max(0, Math.floor(width));height = Math.max(0, Math.floor(height));
  if (count === 1) return [{x: 0, y: 0, width, height}];
  if (count === 4) return workspaceLayout(width,height,'columns').games;
  if (count !== 2) throw Error('Only one, two or four mining views are implemented.');
  const split = Math.round(width * Math.max(.25, Math.min(.75, Number.isFinite(ratio) ? ratio : .5)));
  return [{x: 0, y: 0, width: split, height}, {x: split, y: 0, width: width - split, height}];
}
function preferences(value) {
  return {ratio: Number.isFinite(value?.ratio) ? Math.max(.25, Math.min(.75, value.ratio)) : .5,
    width: Number.isInteger(value?.width) ? Math.max(800, Math.min(3840, value.width)) : 1440,
    height: Number.isInteger(value?.height) ? Math.max(600, Math.min(2160, value.height)) : 960,
    mode: value?.mode === 'grid' ? 'grid' : 'columns', compact: value?.compact !== false,
    cuts: cuts(value?.cuts), column: clamp(value?.column,.2,.8,.5), row: clamp(value?.row,.2,.8,.5)};
}
const clamp=(v,min,max,fallback)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:fallback));
function cuts(value) {
  const a=Array.isArray(value)?value:[];
  const x=clamp(a[0],.12,.64,.25),y=clamp(a[1],x+.12,.76,.5),z=clamp(a[2],y+.12,.88,.75);
  return [x,y,z];
}
function workspaceLayout(width,height,mode='columns',settings={},zoom=-1,count=4) {
  width=Math.max(0,Math.floor(width));height=Math.max(0,Math.floor(height));
  const top=Math.min(44,height),head=34,gap=8,area=Math.max(0,height-top),pref=preferences(settings);
  let cells=[],separators=[];
  if(count===1||zoom>=0) cells=Array.from({length:count},(_,i)=>i===(zoom>=0?zoom:0)?{x:0,y:top,width,height:area}:null);
  else if(count===2){const x=Math.round(width*pref.ratio);cells=[{x:0,y:top,width:Math.max(0,x-gap/2),height:area},{x:x+gap/2,y:top,width:Math.max(0,width-x-gap/2),height:area}];}
  else if(mode==='grid') {
    const x=Math.round(width*pref.column),y=Math.round(area*pref.row);
    cells=[{x:0,y:top,width:Math.max(0,x-4),height:Math.max(0,y-4)},{x:x+4,y:top,width:Math.max(0,width-x-4),height:Math.max(0,y-4)},
      {x:0,y:top+y+4,width:Math.max(0,x-4),height:Math.max(0,area-y-4)},{x:x+4,y:top+y+4,width:Math.max(0,width-x-4),height:Math.max(0,area-y-4)}];
    separators=[{axis:'x',index:0,x:x-4,y:top,width:gap,height:area},{axis:'y',index:0,x:0,y:top+y-4,width,height:gap}];
  } else {
    const points=[0,...pref.cuts.map(v=>Math.round(v*width)),width];
    cells=PANELS.map((_,i)=>({x:points[i]+(i?4:0),y:top,width:Math.max(0,points[i+1]-points[i]-(i?4:0)-(i<3?4:0)),height:area}));
    separators=points.slice(1,-1).map((x,index)=>({axis:'x',index,x:x-4,y:top,width:gap,height:area}));
  }
  const headers=cells.map(c=>c&&({...c,height:Math.min(head,c.height)}));
  const games=cells.map(c=>c&&({...c,y:c.y+Math.min(head,c.height),height:Math.max(0,c.height-head)}));
  return {width,height,headers,games,separators};
}
function webPreferences(gameSession) {
  return {session: gameSession, nodeIntegration: false, nodeIntegrationInWorker: false,
    nodeIntegrationInSubFrames: false, contextIsolation: true, sandbox: true,
    webSecurity: true, allowRunningInsecureContent: false, webviewTag: false,
    navigateOnDragDrop: false, safeDialogs: true, backgroundThrottling: false, autoplayPolicy: 'user-gesture-required'};
}
module.exports = {GAME_URL, SESSION_PARTITION, gameURL, frameURL, safeLocation, pageKind,
  canConfirmSingle, probeOutcome, rectangles, preferences, webPreferences, PANELS, workspaceLayout};
