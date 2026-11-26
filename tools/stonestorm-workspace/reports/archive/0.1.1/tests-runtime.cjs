'use strict';
// Actual Electron runtime with a labelled LOCAL fixture. Never a live-game test.
const {app, session, BaseWindow} = require('electron');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {createWorkspace} = require('../src/workspace.cjs');
const root = path.resolve(__dirname, '..');
const profile = process.argv.find(a => a.startsWith('--test-profile='))?.slice('--test-profile='.length);
if (!profile || path.relative(path.join(root, '.test-profile'), profile).startsWith('..')) throw Error('An isolated local test profile is required.');
const readback = process.argv.includes('--readback');
app.setPath('userData', profile);app.enableSandbox();
app.on('window-all-closed', () => {}); // Keep the test process alive for teardown assertions/reporting.
const cases = [];
let workspace, server, cookieSeen = false;
const wait = async (fn, label) => {const until = Date.now() + 10000;while (Date.now() < until) {if (await fn()) return;await new Promise(r => setTimeout(r, 40));}throw Error('Timeout: ' + label);};
const check = async (name, task) => {await task();cases.push({name, passed: true});console.log('PASS ' + name);};
app.whenReady().then(async () => {
  server = http.createServer((req, res) => {
    if (req.url === '/redirect') {res.writeHead(302, {location: 'https://invalid.example/'});res.end();return;}
    cookieSeen ||= (req.headers.cookie || '').includes('workspace-fixture=persisted');
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': 'workspace-fixture=persisted; Path=/; HttpOnly; SameSite=Strict; Max-Age=600'});
    res.end(`<!doctype html><meta charset="utf-8"><title>LOCAL ELECTRON RUNTIME FIXTURE — NOT STONESTORM</title><style>body{height:2000px;background:#202f23;color:white;font:22px system-ui}input{font:inherit}</style><h1>LOCAL TEST ONLY</h1><input id="value" aria-label="Local test input"><output id="out"></output><a id="bad" href="https://invalid.example/">Blocked navigation test</a><script>window.ticks=0;setInterval(()=>ticks++,100);document.querySelector('input').oninput=e=>document.querySelector('output').textContent=e.target.value+':'+e.isTrusted;</script>`);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const gameSession = session.fromPartition('persist:runtime-fixture-v1');
  workspace = createWorkspace({gameSession, initialURL: origin + '/mining',
    allowedMain: url => {try {return new URL(url).origin === origin;} catch {return false;}},
    allowedFrame: url => url === 'about:blank' || url.startsWith(origin + '/'),
    // Simulates the user checkpoint solely in this local test process.
    readyForConfirmation: s => s.loaded && s.httpStatus === 200 && !s.error});
  await wait(() => workspace.panels[0].state.loaded, 'first local document');
  if (readback) {
    await check('Own synthetic HttpOnly session cookie persists across a real Electron restart', async () => assert.equal(cookieSeen, true));
  } else {
    await check('One BaseWindow and exactly one WebContentsView at startup; second view is gated', async () => {
      assert.equal(BaseWindow.getAllWindows().length, 1);assert.equal(workspace.panels.length, 1);
      assert.throws(() => workspace.setCount(2), /confirm/);
      assert.throws(() => workspace.setCount(4), /gate/);
    });
    await check('Native sandboxed renderer has no require/process or Node integration', async () => {
      const wc = workspace.panels[0].view.webContents, p = wc.getLastWebPreferences();
      assert.equal(p.sandbox, true);assert.equal(p.contextIsolation, true);assert.equal(p.nodeIntegration, false);assert.equal(p.webSecurity, true);assert(!p.preload);
      assert.deepEqual(await wc.executeJavaScript('[typeof require, typeof process]'), ['undefined', 'undefined']);
    });
    workspace.confirmSingle();await wait(() => workspace.panels[1].state.loaded, 'second local document');
    await check('Two distinct webContents share the same persistent session inside one native window', async () => {
      const [a, b] = workspace.panels.map(p => p.view.webContents);
      assert.notEqual(a.id, b.id);assert.equal(a.session, b.session);assert.equal(a.session, gameSession);
      assert.equal(BaseWindow.getAllWindows().length, 1);assert.equal(workspace.win.contentView.children.length, 2);
      workspace.setCount(2);assert.equal(workspace.panels.length, 2);assert(cookieSeen);
    });
    await check('Both renderers accept browser-level trusted input, retain separate state and run timers concurrently', async () => {
      const [a, b] = workspace.panels.map(p => p.view.webContents);
      for (const [wc, value] of [[a, 'A'], [b, 'B']]) {
        wc.focus();await wc.executeJavaScript("document.querySelector('input').focus()");
        // Local fixture only. This avoids dependence on the foreground Windows
        // desktop in CI. It does NOT prove manual input in the live game.
        wc.debugger.attach('1.3');
        await wc.debugger.sendCommand('Input.insertText', {text: value});wc.debugger.detach();
        try {await wait(async () => (await wc.executeJavaScript("document.querySelector('output').textContent")) === value + ':true', 'trusted browser input');}
        catch (error) {console.log(await wc.executeJavaScript("JSON.stringify({value:document.querySelector('input').value,out:document.querySelector('output').textContent,focus:document.hasFocus(),active:document.activeElement?.tagName})"));throw error;}
      }
      assert.equal(await a.executeJavaScript("document.querySelector('input').value"), 'A');
      assert.equal(await b.executeJavaScript("document.querySelector('input').value"), 'B');
      const before = await Promise.all([a.executeJavaScript('ticks'), b.executeJavaScript('ticks')]);
      await wait(async () => (await a.executeJavaScript('ticks')) > before[0] && (await b.executeJavaScript('ticks')) > before[1], 'both local timers');
      await a.executeJavaScript('scrollTo(0, 100)');assert.equal(await a.executeJavaScript('scrollY'), 100);assert.equal(await b.executeJavaScript('scrollY'), 0);
    });
    await check('Independent native bounds follow resizing and a saved split ratio without gaps', async () => {
      workspace.setRatio(.4);workspace.win.setSize(1500, 900);workspace.layout();
      const [a, b] = workspace.panels.map(p => p.view.getBounds()), [width, height] = workspace.win.getContentSize();
      assert.equal(a.width + b.width, width);assert.equal(b.x, a.width);assert.equal(a.height, height);assert.equal(a.width, Math.round(width * .4));
    });
    await check('Out-of-scope navigation, redirects and popups are denied without opening another window', async () => {
      const wc = workspace.panels[0].view.webContents;
      await wc.executeJavaScript("document.querySelector('#bad').click();window.open('https://invalid.example/')", true);
      try {await wait(() => workspace.snapshot().events.some(e => e.type === 'main-navigation-denied') && workspace.snapshot().events.some(e => e.type === 'popup-denied'), 'navigation guards');}
      catch (error) {console.log(JSON.stringify(workspace.snapshot().events));throw error;}
      await wc.loadURL(origin + '/redirect').catch(() => {});
      await wait(() => workspace.snapshot().events.some(e => e.type === 'redirect-denied'), 'redirect guard');
      assert.equal(BaseWindow.getAllWindows().length, 1);assert(!wc.getURL().startsWith('https://invalid.example'));
    });
    await check('Closing a secondary view destroys it and keeps the first original webContents alive', async () => {
      const [a, b] = workspace.panels.map(p => p.view.webContents);workspace.setCount(1);
      await wait(() => b.isDestroyed(), 'secondary teardown');assert.equal(a.isDestroyed(), false);assert.equal(workspace.panels[0].view.webContents, a);
    });
  }
  await gameSession.cookies.flushStore();
  await check('Closing BaseWindow destroys all owned webContents', async () => {
    const contents = workspace.panels.map(p => p.view.webContents);workspace.close();
    await wait(() => contents.every(wc => wc.isDestroyed()), 'complete teardown');assert.equal(BaseWindow.getAllWindows().length, 0);
  });
  const file = path.join(root, 'reports/runtime-test.json');
  let previous = [];
  if (readback) previous = JSON.parse(fs.readFileSync(file, 'utf8')).cases;
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, JSON.stringify({schema: 1, at: new Date().toISOString(), electron: process.versions.electron,
    nativeElectronRuntime: true, syntheticLocalFixture: true, liveGameVerified: false,
    manualAuthenticationVerified: false, liveTwoPanelInteractivityVerified: false, cases: [...previous, ...cases]}, null, 2) + '\n');
  server.closeAllConnections();server.close();app.exit(0);
}).catch(error => {console.error(error);workspace?.close();server?.closeAllConnections();server?.close();app.exit(1);});
