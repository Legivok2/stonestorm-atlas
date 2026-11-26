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
  assert.throws(() => P.rectangles(1920, 1080, 4), /Only/);
});
test('Diagnostics never retain query/fragment credentials and preferences retain only geometry', () => {
  assert.equal(P.safeLocation('https://stonestorm.gg/mining?token=PRIVATE#PRIVATE'), P.GAME_URL);
  assert.equal(P.safeLocation('file:///PRIVATE'), '(blocked scheme)');
  assert.deepEqual(P.preferences({ratio: 99, width: 99999, height: -1, cookie: 'PRIVATE', url: 'PRIVATE'}), {ratio: .75, width: 3840, height: 600});
});
