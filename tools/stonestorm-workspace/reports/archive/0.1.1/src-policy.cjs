'use strict';

const GAME_URL = 'https://stonestorm.gg/mining';
const SESSION_PARTITION = 'persist:stonestorm-workspace-v1';
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
  if (count !== 2) throw Error('Only the one-view and gated two-view prototypes are implemented.');
  const split = Math.round(width * Math.max(.25, Math.min(.75, Number.isFinite(ratio) ? ratio : .5)));
  return [{x: 0, y: 0, width: split, height}, {x: split, y: 0, width: width - split, height}];
}
function preferences(value) {
  return {ratio: Number.isFinite(value?.ratio) ? Math.max(.25, Math.min(.75, value.ratio)) : .5,
    width: Number.isInteger(value?.width) ? Math.max(800, Math.min(3840, value.width)) : 1440,
    height: Number.isInteger(value?.height) ? Math.max(600, Math.min(2160, value.height)) : 960};
}
function webPreferences(gameSession) {
  return {session: gameSession, nodeIntegration: false, nodeIntegrationInWorker: false,
    nodeIntegrationInSubFrames: false, contextIsolation: true, sandbox: true,
    webSecurity: true, allowRunningInsecureContent: false, webviewTag: false,
    navigateOnDragDrop: false, safeDialogs: true, autoplayPolicy: 'user-gesture-required'};
}
module.exports = {GAME_URL, SESSION_PARTITION, gameURL, frameURL, safeLocation, pageKind,
  canConfirmSingle, probeOutcome, rectangles, preferences, webPreferences};
