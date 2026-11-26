'use strict';
const {BaseWindow, WebContentsView} = require('electron');
const P = require('./policy.cjs');

// Main-process factory. No IPC or Node/preload bridge is exposed to game pages.
function createWorkspace({gameSession, width = 1440, height = 960, ratio = .5,
  initialURL = P.GAME_URL, allowedMain = P.gameURL, allowedFrame = P.frameURL,
  readyForConfirmation = P.canConfirmSingle, onChange = () => {}}) {
  if (!allowedMain(initialURL)) throw Error('Initial URL is outside the permitted scope.');
  const win = new BaseWindow({title: 'StoneStorm Workspace · 1 játékpéldány', width, height,
    minWidth: 800, minHeight: 600, backgroundColor: '#17130f', show: false});
  const panels = [], events = [];
  let disposed = false, singleConfirmation = null, pairConfirmation = null;
  function notify() { if (!disposed) onChange(); }
  function note(type, url) {
    events.push({type, location: P.safeLocation(url), at: new Date().toISOString()});
    if (events.length > 40) events.shift();notify();
  }
  function layout() {
    if (disposed) return;
    const [w, h] = win.getContentSize();
    const bounds = P.rectangles(w, h, panels.length || 1, ratio);
    panels.forEach((panel, i) => panel.view.setBounds(bounds[i]));
  }
  function add() {
    const view = new WebContentsView({webPreferences: P.webPreferences(gameSession)});
    const wc = view.webContents;
    const panel = {view, state: {id: wc.id, httpStatus: null, challenge: false, error: null,
      location: P.safeLocation(initialURL), titleKind: 'not-loaded', loaded: false}};
    panels.push(panel);win.contentView.addChildView(view);layout();
    wc.setWindowOpenHandler(({url}) => {note('popup-denied', url);return {action: 'deny'};});
    wc.on('will-attach-webview', event => event.preventDefault());
    wc.on('will-navigate', (event, url) => {
      const target = event.url ?? url;
      if (!allowedMain(target)) {event.preventDefault();note('main-navigation-denied', target);}
    });
    wc.on('will-frame-navigate', event => {
      if (!(event.isMainFrame ? allowedMain(event.url) : allowedFrame(event.url))) {
        event.preventDefault();note(event.isMainFrame ? 'main-navigation-denied' : 'frame-navigation-denied', event.url);
      }
    });
    wc.on('will-redirect', (event, url, _inPlace, isMainFrame) => {
      const target = event.url ?? url, main = event.isMainFrame ?? isMainFrame;
      if (!(main ? allowedMain(target) : allowedFrame(target))) {event.preventDefault();note('redirect-denied', target);}
    });
    wc.on('did-start-navigation', event => {
      if (event.isMainFrame && !event.isSameDocument) {
        panel.state.loaded = false;panel.state.error = null;panel.state.httpStatus = null;panel.state.challenge = false;notify();
      }
    });
    wc.on('did-navigate', (_event, url, code) => {
      panel.state.location = P.safeLocation(url);panel.state.httpStatus = code;notify();
    });
    wc.on('did-navigate-in-page', (_event, url, isMainFrame) => {
      if (isMainFrame) {panel.state.location = P.safeLocation(url);notify();}
    });
    wc.on('page-title-updated', (_event, title) => {
      panel.state.titleKind = P.pageKind(title);
      if (panel.state.titleKind === 'challenge') panel.state.challenge = true;
      notify();
    });
    wc.on('did-finish-load', () => {panel.state.loaded = true;notify();});
    wc.on('did-fail-load', (_event, code, description, url, isMainFrame) => {
      if (!isMainFrame || code === -3) return;
      panel.state.error = {code, description};note('main-load-failed', url);
    });
    wc.on('render-process-gone', (_event, details) => {
      panel.state.error = {code: details.exitCode, description: 'Renderer: ' + details.reason};notify();
    });
    wc.loadURL(initialURL).catch(error => {
      if (disposed || wc.isDestroyed() || error.code === 'ERR_ABORTED') return;
      panel.state.error = {code: error.code, description: 'loadURL failed'};notify();
    });
    return panel;
  }
  // Pure observation: never rewrite headers or intercept game API operations.
  gameSession.webRequest.onResponseStarted((details) => {
    if (details.resourceType !== 'mainFrame') return;
    const panel = panels.find(p => p.view.webContents.id === details.webContentsId);
    if (!panel) return;
    const headers = details.responseHeaders || {};
    const mitigated = Object.entries(headers).find(([key]) => key.toLowerCase() === 'cf-mitigated')?.[1];
    panel.state.httpStatus = details.statusCode;
    panel.state.challenge = Array.isArray(mitigated) ? mitigated.includes('challenge') : mitigated === 'challenge';
    panel.state.location = P.safeLocation(details.url);notify();
  });
  win.on('resize', () => {layout();notify();});
  win.on('closed', () => {
    disposed = true;
    gameSession.webRequest.onResponseStarted(null);
    for (const {view} of panels) if (!view.webContents.isDestroyed()) view.webContents.close({waitForBeforeUnload: false});
    panels.length = 0;
  });
  function setCount(count) {
    if (count !== 1 && count !== 2) throw Error('The live gate for four/community views has not passed.');
    if (count === 2 && !singleConfirmation) throw Error('The user must first confirm the live single-view test.');
    if (count === panels.length) return;
    while (panels.length < count) add();
    while (panels.length > count) {
      const {view} = panels.pop();win.contentView.removeChildView(view);view.webContents.close({waitForBeforeUnload: false});
    }
    layout();win.setTitle('StoneStorm Workspace · ' + count + ' játékpéldány');notify();
  }
  function confirmSingle() {
    if (panels.length !== 1 || !readyForConfirmation(panels[0].state)) throw Error('The original /mining page is not ready for manual acceptance.');
    singleConfirmation = {source: 'user-confirmed', at: new Date().toISOString(),
      checks: ['original-game-loaded', 'cloudflare-passed', 'manual-login', 'mining-opened', 'native-controls-usable']};
    setCount(2);
  }
  function confirmPair(success) {
    if (panels.length !== 2 || !panels.every(p => P.canConfirmSingle(p.state))) throw Error('Both original /mining documents must first be available.');
    pairConfirmation = {source: 'user-confirmed', success, at: new Date().toISOString()};notify();
  }
  function snapshot() {
    return {schema: 1, at: new Date().toISOString(), nativeWindow: 'BaseWindow', nativeView: 'WebContentsView',
      panelCount: panels.length, sharedSession: panels.every(p => p.view.webContents.session === gameSession),
      panels: panels.map(p => ({...p.state})), events: [...events],
      acceptance: {electronRuntime: 'see runtime-test.json', singleLive: singleConfirmation,
        twoLive: pairConfirmation, fourLive: 'not implemented; live two-view gate required', communityLive: 'not implemented; live gate required'},
      ratio};
  }
  add();win.show();
  return {win, panels, snapshot, setCount, confirmSingle, confirmPair, layout,
    setRatio(value) {ratio = P.preferences({ratio: value}).ratio;layout();notify();},
    reload(index) {const panel = panels[index];if (panel && !panel.view.webContents.isDestroyed()) panel.view.webContents.reload();},
    openMining(index) {const panel = panels[index];if (panel && !panel.view.webContents.isDestroyed()) void panel.view.webContents.loadURL(initialURL).catch(() => {});},
    focus(index) {panels[index]?.view.webContents.focus();},
    close() {if (!win.isDestroyed()) win.close();}};
}
module.exports = {createWorkspace};
