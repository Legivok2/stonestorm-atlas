'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../src/policy.cjs');

test('Production main-frame allowlist rejects lookalikes, credentials, unsafe schemes and ports', () => {
  for (const value of ['https://stonestorm.gg/mining', 'https://stonestorm.gg/login', 'https://STONESTORM.GG/']) assert(P.gameURL(value));
  for (const value of ['http://stonestorm.gg/', 'https://stonestorm.gg.evil.example/', 'https://stonestorm.gg@evil.example/', 'https://user:pass@stonestorm.gg/', 'https://stonestorm.gg:9443/', 'https://challenges.cloudflare.com/', 'file:///C:/Windows/win.ini', 'javascript:alert(1)', 'data:text/html,test', 'about:blank', 'not a URL']) assert.equal(P.gameURL(value), false, value);
});
test('Only ordinary game and Cloudflare challenge subframe navigation is allowed', () => {
  assert(P.frameURL('https://challenges.cloudflare.com/turnstile/'));
  assert(P.frameURL('about:blank'));
  assert.equal(P.frameURL('https://challenges.cloudflare.com.evil.example/'), false);
  assert.equal(P.frameURL('https://accounts.google.com/'), false);
});
test('Game webContents have no Node, webview, preload or insecure-content capability', () => {
  const gameSession = {}, value = P.webPreferences(gameSession);
  assert.equal(value.session, gameSession);
  for (const key of ['nodeIntegration', 'nodeIntegrationInWorker', 'nodeIntegrationInSubFrames', 'webviewTag', 'allowRunningInsecureContent', 'navigateOnDragDrop']) assert.equal(value[key], false);
  for (const key of ['contextIsolation', 'sandbox', 'webSecurity']) assert.equal(value[key], true);
  assert.equal(value.preload, undefined);
});
test('A transport success alone cannot be mistaken for a manually accepted live game', () => {
  const ready = {loaded: true, httpStatus: 200, challenge: false, error: null, location: P.GAME_URL};
  assert(P.canConfirmSingle(ready));
  for (const patch of [{loaded: false}, {httpStatus: 403}, {challenge: true}, {error: {code: -105}}, {location: 'https://stonestorm.gg/login'}, {location: 'https://evil.example/mining'}]) assert.equal(P.canConfirmSingle({...ready, ...patch}), false);
});

test('Live probe separates a clean load from a challenge, HTTP failure or incomplete load', () => {
  const ready = {loaded: true, httpStatus: 200, challenge: false, error: null};
  assert.equal(P.probeOutcome(ready), 'manual-game-and-login-verification-required');
  assert.equal(P.probeOutcome({...ready, challenge: true}), 'blocked-challenge');
  assert.equal(P.probeOutcome({...ready, httpStatus: 403}), 'http-error');
  assert.equal(P.probeOutcome({...ready, httpStatus: 503}), 'http-error');
  assert.equal(P.probeOutcome({...ready, error: {code: -105}}), 'navigation-error');
  assert.equal(P.probeOutcome({...ready, loaded: false}), 'load-incomplete');
  assert.equal(P.probeOutcome(null), 'load-incomplete');
});
test('Only one or two real views are laid out and every pixel is assigned once', () => {
  for (const width of [0, 1, 801, 1440, 1919, 3840]) for (const ratio of [.25, .4, .5, .75, NaN, -100, 100]) {
    const [left, right] = P.rectangles(width, 800, 2, ratio);
    assert.equal(left.width + right.width, width);assert.equal(right.x, left.width);
    assert(left.width >= 0 && right.width >= 0);assert.equal(left.height, 800);
  }
  assert.equal(P.rectangles(1920,1080,4).length,4);assert.throws(()=>P.rectangles(1920,1080,3),/Only/);
});
test('Diagnostics never retain query/fragment credentials and preferences retain only geometry', () => {
  assert.equal(P.safeLocation('https://stonestorm.gg/mining?token=PRIVATE#PRIVATE'), P.GAME_URL);
  assert.equal(P.safeLocation('file:///PRIVATE'), '(blocked scheme)');
  const p=P.preferences({ratio:99,width:99999,height:-1,cookie:'PRIVATE',url:'PRIVATE'});assert.equal(p.ratio,.75);assert.equal(p.width,3840);assert.equal(p.height,600);assert(!('cookie' in p));assert(!('url' in p));
});

test('Four columns and grid reserve headers and disjoint visible game rectangles',()=>{
 for(const mode of ['columns','grid'])for(const width of [960,1280,1920,3840])for(const height of [600,1080]){
  const l=P.workspaceLayout(width,height,mode);assert.equal(l.games.length,4);
  l.games.forEach((a,i)=>{assert(a.width>0&&a.height>0);assert(a.x>=0&&a.y>=78&&a.x+a.width<=width&&a.y+a.height<=height);assert.equal(l.headers[i].y+34,a.y);
   l.games.forEach((b,j)=>{if(i!==j)assert(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y);});});
 }
});
test('Split migration clamps malicious values and zoom leaves the other instances loaded',()=>{
 const p=P.preferences({mode:'unknown',cuts:[.95,-1,NaN],row:99,column:-2});assert.equal(p.mode,'columns');assert(p.cuts[0]<p.cuts[1]&&p.cuts[1]<p.cuts[2]);assert.equal(p.row,.8);assert.equal(p.column,.2);
 const l=P.workspaceLayout(1600,900,'grid',{},2);assert.equal(l.games.filter(Boolean).length,1);assert(l.games[2]);
});

test('Normal game is the default even with legacy mining layout preferences',()=>{
 assert.equal(P.startupMode(P.preferences(null)),'GAME');
 assert.equal(P.startupMode(P.preferences({mode:'grid',lastWorkspace:'MINING'})),'GAME');
 assert.equal(P.startupMode(P.preferences({rememberWorkspace:true,lastWorkspace:'MINING'})),'MINING');
 assert.equal(P.startupMode(P.preferences({rememberWorkspace:true,lastWorkspace:'unknown'})),'GAME');
});
test('Normal view uses all content below the toolbar without a mining header',()=>{
 const l=P.workspaceLayout(1440,900,'grid',{},-1,1,44,true);
 assert.deepEqual(l.games,[{x:0,y:44,width:1440,height:856}]);assert.equal(l.headers.length,0);assert.equal(l.separators.length,0);
});
test('Disabling size persistence preserves other settings but resets the next saved splits',()=>{
 const p=P.persistedPreferences({cuts:[.2,.45,.7],row:.7,column:.3,savePanelSizes:false,rememberWorkspace:true,lastWorkspace:'MINING',width:1500});
 assert.deepEqual(p.cuts,[.25,.5,.75]);assert.equal(p.column,.5);assert.equal(p.row,.5);assert.equal(p.width,1500);assert.equal(p.rememberWorkspace,true);assert.equal(p.lastWorkspace,'MINING');
});
test('Return navigation never remembers credentials, sensitive callbacks or another origin',()=>{
 assert.equal(P.safeReturnLocation('https://stonestorm.gg/character'),'https://stonestorm.gg/character');
 for(const url of ['https://stonestorm.gg/login','https://stonestorm.gg/api/auth','https://stonestorm.gg/account','https://stonestorm.gg/checkout','https://stonestorm.gg/?token=x','https://stonestorm.gg/#secret','https://evil.example/','https://user:pass@stonestorm.gg/'])assert.equal(P.safeReturnLocation(url),null,url);
});
