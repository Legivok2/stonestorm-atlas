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
    probe, authenticationAutomated: false, gameClientFilesModified: false, presentationCSS: true, originalTabUISelection: true, chromeCookiesImported: false,
    metrics: app.getAppMetrics().map(({type, cpu, memory}) => ({type, cpuPercent: cpu.percentCPUUsage, workingSetKB: memory.workingSetSize}))};
}
function persist() {
  if (!workspace || workspace.win.isDestroyed()) return;
  const [width, height] = workspace.win.getSize();
  save(path.join(profile, 'preferences.json'), {...workspace.snapshot().preferences,width,height});
  save(path.join(profile, 'last-run.json'), diagnostic());
}
function changed() {
  if (!workspace || closing) return;
  clearTimeout(writeTimer);writeTimer = setTimeout(() => {persist();}, 120);
}
function menu() {
 Menu.setApplicationMenu(Menu.buildFromTemplate([
  {label:'Workspace',submenu:[
   {label:'Négy oszlop',click:()=>workspace.action({action:'mode',value:'columns'})},
   {label:'2 × 2 elrendezés',click:()=>workspace.action({action:'mode',value:'grid'})},
   {label:'Panelek frissítése · az eredeti oldalak újratöltése',accelerator:'CmdOrCtrl+Shift+R',click:()=>workspace.action({action:'refresh'})},
   {label:'Elrendezés alaphelyzetbe',click:()=>workspace.action({action:'reset'})},
   {type:'separator'},
   {label:'Diagnosztika mentése…',click:async()=>{const {canceled,filePath}=await dialog.showSaveDialog(workspace.win,{defaultPath:'stonestorm-workspace-diagnostic.json',filters:[{name:'JSON',extensions:['json']}]});if(!canceled&&filePath)save(filePath,diagnostic());}},
   {role:'quit',label:'Kilépés'}]},
  {label:'Nézet',submenu:[...P.PANELS.map((p,index)=>({label:p.name+' fókusza',accelerator:'CmdOrCtrl+'+(index+1),click:()=>workspace.focus(index)})),
   {label:'Teljes képernyő',accelerator:'F11',click:()=>workspace.win.setFullScreen(!workspace.win.isFullScreen())}]},
  {label:'Szerkesztés',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]}
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
  workspace = createWorkspace({gameSession, width: Math.min(pref.width, work.width), height: Math.min(pref.height, work.height), ratio: pref.ratio, preferences: probe ? {...pref,compact:false} : pref, initialCount: 4, onChange: changed});
  menu();persist();
  workspace.win.on('close', () => {persist();closing = true;clearTimeout(writeTimer);});
  if (probe) {
    // Observe the unmodified page and its ordinary challenge flow. No clicks,
    // UA changes, retries, credential entry or artificial challenge handling.
    setTimeout(async () => {
      const report = diagnostic();
      report.liveGameVerified = false;
      const outcomes=report.panels.map(P.probeOutcome);report.outcome=['blocked-challenge','navigation-error','http-error','load-incomplete'].find(k=>outcomes.includes(k))||'manual-game-and-login-verification-required';
      report.nextStageStarted = false;
      fs.mkdirSync(reportDirectory, {recursive: true});
      for (const [index,panel] of workspace.panels.entries()) if (!panel.view.webContents.isDestroyed()) {
        const image=await panel.view.webContents.capturePage();
        fs.writeFileSync(path.join(reportDirectory,'startup-panel-'+(index+1)+'.png'),image.toPNG());
      }
      save(path.join(reportDirectory,'startup.json'),report);
      console.log(JSON.stringify(report, null, 2));workspace.close();
    }, 20000);
  }
}
