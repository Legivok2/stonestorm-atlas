/* Read-only feasibility check in a disposable browser profile. No authentication,
 * header overrides, challenge handling or game writes. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'.integration/multi-instance');
fs.mkdirSync(out,{recursive:true});
process.env.PLAYWRIGHT_BROWSERS_PATH=path.join(root,'.integration/browser-qa/browsers');
const {chromium}=await import(pathToFileURL(path.join(root,'.integration/browser-qa/node_modules/playwright/index.mjs')));
const browser=await chromium.launch({channel:'chromium',headless:true});
const context=await browser.newContext();
const page=await context.newPage();
const report={schema:1,checkedAt:new Date().toISOString(),url:'https://stonestorm.gg/mining',
  profile:'disposable; no user cookies or credentials',liveGameVerified:false,twoFrameGatePassed:false,
  framesCreated:0,headers:{},blockers:[]};
try{
  const response=await page.goto(report.url,{waitUntil:'domcontentloaded',timeout:30000});
  report.status=response?.status()??null;
  const headers=await response?.allHeaders()??{};
  for(const name of ['x-frame-options','content-security-policy','content-security-policy-report-only','cf-mitigated','server'])report.headers[name]=headers[name]??null;
  report.title=await page.title();
  await page.screenshot({path:path.join(out,'live-entry.png')});
  const original=await page.locator('.mine-stage .mine-tabs [data-mine-tab="mine"]').count();
  if(report.status!==200||headers['cf-mitigated']==='challenge'||!original){
    report.blockers.push(headers['cf-mitigated']==='challenge'||/just a moment/i.test(report.title)
      ?'Cloudflare challenge before the original game loads; no challenge interaction attempted.'
      :'The original authenticated mining UI is unavailable in the disposable profile.');
    report.framePolicyConclusion='Unknown for the authenticated game. Challenge/login headers do not establish game framing policy.';
  }else{
    // A load event alone is never evidence of a working game instance.
    await page.evaluate(()=>{
      const host=document.createElement('section');host.id='ssa-live-two-frame-check';
      host.style.cssText='position:fixed;inset:0;z-index:2147483647;display:flex;background:#181512';
      for(const role of ['mine','smelt']){const frame=document.createElement('iframe');frame.src='/mining';frame.name='ssa-live-check-'+role;frame.style.cssText='width:50%;height:100%;border:0';host.append(frame);}
      document.body.append(host);
    });
    report.framesCreated=2;
    report.frames=[];
    for(const role of ['mine','smelt']){
      const frame=page.frame({name:'ssa-live-check-'+role});
      try{
        const tab=frame.locator('.mine-stage .mine-tabs button[role="tab"][data-mine-tab="'+role+'"]');
        await tab.waitFor({timeout:20000});await tab.click();
        const selected=await tab.getAttribute('aria-selected');
        report.frames.push({role,originalTabSelected:selected==='true',url:frame.url()});
      }catch(error){report.frames.push({role,originalTabSelected:false,error:error.message.slice(0,240)});}
    }
    report.blockers.push('Authenticated simultaneous input, inventory synchronization and sustained resource use still require a live-session test.');
    await page.screenshot({path:path.join(out,'live-two-frame-check.png')});
  }
}catch(error){report.blockers.push(error.message.slice(0,300));}
finally{await browser.close();}
fs.writeFileSync(path.join(root,'reports/multi-instance-live-probe.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
