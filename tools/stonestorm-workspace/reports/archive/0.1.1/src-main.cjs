'use strict';
const {app, session, Menu, dialog, screen} = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const P = require('./policy.cjs');
const {createWorkspace} = require('./workspace.cjs');

app.setName('StoneStorm Workspace');
app.enableSandbox();
const probe = process.argv.includes('--workspace-probe');
// A probe always starts without a prior login. Normal launches keep their own
// persistent session; neither mode reads or imports another browser's profile.
const probeProfile = probe ? fs.mkdtempSync(path.join(app.getPath('temp'), 'StoneStorm Workspace Probe-')) : null;
app.setPath('userData', probe ? probeProfile : path.join(app.getPath('appData'), 'StoneStorm Workspace'));
const profile = app.getPath('userData');
const reportDirectory = probe ? (app.isPackaged ? path.join(profile, 'reports') : path.resolve(__dirname, '../reports')) : null;
let workspace, writeTimer, closing = false;
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => {if (workspace && !workspace.win.isDestroyed()) {workspace.win.restore();workspace.win.focus();}});
  app.on('window-all-closed', () => app.quit());
  app.whenReady().then(start).catch(error => {console.error(error);app.exit(1);});
}
function save(file, value) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  const temp = file + '.tmp';fs.writeFileSync(temp, JSON.stringify(value, null, 2) + '\n');fs.renameSync(temp, file);
}
function readPreferences() {
  try {return P.preferences(JSON.parse(fs.readFileSync(path.join(profile, 'preferences.json'), 'utf8')));}
  catch {return P.preferences(null);}
}
function diagnostic() {
  return {...workspace.snapshot(), appVersion: app.getVersion(),
    versions: {electron: process.versions.electron, chromium: process.versions.chrome},
    probe, authenticationAutomated: false, gameCodeInjected: false, chromeCookiesImported: false,
    metrics: app.getAppMetrics().map(({type, cpu, memory}) => ({type, cpuPercent: cpu.percentCPUUsage, workingSetKB: memory.workingSetSize}))};
}
function persist() {
  if (!workspace || workspace.win.isDestroyed()) return;
  const [width, height] = workspace.win.getSize();
  save(path.join(profile, 'preferences.json'), {width, height, ratio: workspace.snapshot().ratio});
  save(path.join(profile, 'last-run.json'), diagnostic());
}
function changed() {
  if (!workspace || closing) return;
  clearTimeout(writeTimer);writeTimer = setTimeout(() => {persist();menu();}, 120);
}
function menu() {
  const s = workspace.snapshot(), first = s.panels[0];
  const status = first?.error ? first.error.description : first?.challenge ? 'Cloudflare-ellenőrzés' : 'HTTP ' + (first?.httpStatus ?? 'betöltés');
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {label: 'Próba', submenu: [
      {label: 'Állapot: ' + s.panelCount + ' nézet · ' + status, enabled: false},
      {label: 'Eredeti Tárnák megnyitása a bal / egyetlen nézetben', click: () => workspace.openMining(0)},
      {label: 'Eredeti Tárnák megnyitása a jobb nézetben', enabled: s.panelCount === 2, click: () => workspace.openMining(1)},
      {label: '1. Az egynézetes élő próbát ellenőriztem → Két nézet…', enabled: !probe && s.panelCount === 1 && P.canConfirmSingle(first), click: async () => {
        const {response} = await dialog.showMessageBox(workspace.win, {type: 'question', title: 'Első élő kapu',
          message: 'Mind az öt pontot kézzel ellenőrizted ebben az Electron-ablakban?',
          detail: '1. Az eredeti játék betöltött.\n2. A Cloudflare-ellenőrzés rendben lezárult.\n3. Kézzel bejelentkeztél.\n4. Megnyílt a Tárnák felület.\n5. Az eredeti kezelőelemek használhatók.\n\nA második nézet csak a saját visszajelzésed alapján nyílik meg. A program nem tekinti a HTTP 200-at bejelentkezési vagy játékbizonyítéknak.',
          buttons: ['Mind az öt teljesült — Két nézet', 'Még nem / blokkolva'], defaultId: 1, cancelId: 1});
        if (response === 0) try {workspace.confirmSingle();changed();} catch (error) {showError(error);}
      }},
      {label: '2. A kétpaneles élő próba eredménye…', enabled: !probe && s.panelCount === 2 && s.panels.every(P.canConfirmSingle), click: async () => {
        const {response} = await dialog.showMessageBox(workspace.win, {type: 'question', title: 'Kétpaneles élő próba',
          message: 'Az eredeti Tárna és Olvasztó egyszerre, egymástól függetlenül használható?',
          detail: 'A füleket kézzel válaszd ki: bal Tárna, jobb Olvasztó. Mindkét nézet tartsa meg a saját fülállapotát, fogadjon bevitelt és külön görgessen. Másik panel aktiválása nélkül is működjön. A program nem kattint játékbeli gombokra.\n\nA visszajelzés külön „user-confirmed” jelölést kap; a négyes és Közösség mód ebben a prototípusban még nem szerepel.',
          buttons: ['Működik', 'Nem működik', 'Még nem teszteltem'], defaultId: 2, cancelId: 2});
        if (response < 2) try {workspace.confirmPair(response === 0);changed();} catch (error) {showError(error);}
      }},
      {label: 'Vissza egy játékpéldányra (a jobb nézet bezárul)', enabled: s.panelCount === 2, click: () => workspace.setCount(1)},
      {type: 'separator'},
      {label: 'Diagnosztika mentése…', click: async () => {
        const {canceled, filePath} = await dialog.showSaveDialog(workspace.win, {defaultPath: 'stonestorm-workspace-diagnostic.json', filters: [{name: 'JSON', extensions: ['json']}]});
        if (!canceled && filePath) save(filePath, diagnostic());
      }},
      {role: 'quit', label: 'Kilépés'}]},
    {label: 'Nézet', submenu: [
      {label: 'Bal / egyetlen nézet fókusza', accelerator: 'CmdOrCtrl+1', click: () => workspace.focus(0)},
      {label: 'Jobb nézet fókusza', accelerator: 'CmdOrCtrl+2', enabled: s.panelCount === 2, click: () => workspace.focus(1)},
      {label: 'Bal nézet újratöltése', accelerator: 'CmdOrCtrl+R', click: () => workspace.reload(0)},
      {label: 'Jobb nézet újratöltése', enabled: s.panelCount === 2, click: () => workspace.reload(1)},
      {label: 'Mindkét nézet újratöltése (beírt értékek elvesznek)', enabled: s.panelCount === 2, click: () => {workspace.reload(0);workspace.reload(1);}},
      {type: 'separator'},
      ...[.4, .5, .6].map(ratio => ({label: 'Bal / jobb: ' + Math.round(ratio * 100) + ' / ' + Math.round((1 - ratio) * 100) + '%', enabled: s.panelCount === 2, click: () => workspace.setRatio(ratio)})),
      {label: 'Teljes képernyő', accelerator: 'F11', click: () => workspace.win.setFullScreen(!workspace.win.isFullScreen())}]},
    {label: 'Szerkesztés', submenu: [{role: 'undo'}, {role: 'redo'}, {type: 'separator'}, {role: 'cut'}, {role: 'copy'}, {role: 'paste'}, {role: 'selectAll'}]}
  ]));
}
function showError(error) {if (!workspace.win.isDestroyed()) void dialog.showMessageBox(workspace.win, {type: 'error', message: error.message});}
async function start() {
  const gameSession = session.fromPartition(P.SESSION_PARTITION);
  const allowedPermissions = new Set(['fullscreen', 'clipboard-sanitized-write']);
  gameSession.setPermissionRequestHandler((wc, permission, callback, details) => callback(!!wc && P.gameURL(wc.getURL()) && P.gameURL(details.requestingUrl || wc.getURL()) && allowedPermissions.has(permission)));
  gameSession.setPermissionCheckHandler((wc, permission, origin) => !!wc && P.gameURL(wc.getURL()) && P.gameURL(origin) && allowedPermissions.has(permission));
  gameSession.on('will-download', event => event.preventDefault());
  const pref = readPreferences(), work = screen.getPrimaryDisplay().workAreaSize;
  workspace = createWorkspace({gameSession, width: Math.min(pref.width, work.width), height: Math.min(pref.height, work.height), ratio: pref.ratio, onChange: changed});
  menu();persist();
  workspace.win.on('close', () => {persist();closing = true;clearTimeout(writeTimer);});
  if (probe) {
    // Observe the unmodified page and its ordinary challenge flow. No clicks,
    // UA changes, retries, credential entry or artificial challenge handling.
    setTimeout(async () => {
      const report = diagnostic();
      report.liveGameVerified = false;
      report.outcome = P.probeOutcome(report.panels[0]);
      report.nextStageStarted = false;
      fs.mkdirSync(reportDirectory, {recursive: true});
      if (workspace.panels[0] && !workspace.panels[0].view.webContents.isDestroyed()) {
        const image = await workspace.panels[0].view.webContents.capturePage();
        fs.writeFileSync(path.join(reportDirectory, 'live-single-view.png'), image.toPNG());
      }
      save(path.join(reportDirectory, 'live-single-view.json'), report);
      console.log(JSON.stringify(report, null, 2));workspace.close();
    }, 20000);
  }
}
