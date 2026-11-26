/* One in-memory controller, shared by the native popup and the overlay. */
(() => {
  'use strict';
  if(window.top!==window)return;
  let until=0,samples={};
  const preferences=globalThis.StonestormCompanionState?.shared(chrome.storage);
  const subscribers=new Set(),labels={'/api/content':'Nyilvános kísérőszabályok','/api/sinks':'Otthon és berendezés','/api/home/rooms':'Szobák és témák','/api/arena/pure':'Tiszta aréna','/api/arena/pure/season':'Tiszta szezon','/api/arena/bandit':'Bandita Liga','/api/character':'Teaárak és nyilvános képkulcsok'};
  const status=()=>({count:Object.keys(samples).length,active:Date.now()<until,remainingSeconds:Math.max(0,Math.ceil((until-Date.now())/1000)),categories:Object.keys(samples).map(path=>({name:labels[path],count:1}))});
  const notify=()=>{for(const fn of subscribers)fn(status());};
  function command(type){
    if(['atlas-research-arm','atlas-research-export'].includes(type)&&preferences?.get().development!==true)return {error:'Az Atlas eszközei a Haladó beállítások fejlesztői módjában érhetők el.'};
    if(type==='atlas-research-arm'){samples={};until=Date.now()+60000;window.dispatchEvent(new Event('ss-atlas-research-arm'));window.postMessage({source:'ss-statcap-ready-v2'},location.origin);}
    if(type==='atlas-research-stop'){until=0;samples={};window.dispatchEvent(new Event('ss-atlas-research-stop'));}
    if(type==='atlas-research-export'){
      until=0;window.dispatchEvent(new Event('ss-atlas-research-stop'));
      const result={schema:1,addonVersion:chrome.runtime?.getManifest?.().version??'0.14.0',source:'user-initiated-anonymized-observation',samples:Object.values(samples)};samples={};notify();return result;
    }
    notify();return status();
  }
  window.addEventListener('message',event=>{
    if(event.source===window&&event.origin===location.origin&&event.data?.source==='ss-statcap-api-v2'&&event.data.kind==='pet-config'&&Date.now()<until){
      const clean=globalThis.StonestormResearch.sanitize('/api/content',{pets:event.data.payload?.config});
      if(clean&&JSON.stringify(clean).length<200000){samples[clean.endpoint]=clean;notify();}return;
    }
    if(event.source!==window||event.origin!==location.origin||event.data?.source!=='ss-atlas-research-sample-v1'||Date.now()>=until)return;
    const sample=event.data.sample,clean=globalThis.StonestormResearch.sanitize(sample?.endpoint,sample?.data);
    if(clean&&JSON.stringify(clean).length<200000){samples[clean.endpoint]=clean;notify();}
  });
  chrome.runtime.onMessage.addListener((message,sender,reply)=>{
    if(sender.id!==chrome.runtime.id)return;
    if(!['atlas-research-arm','atlas-research-stop','atlas-research-export','atlas-research-status'].includes(message?.type))return;
    reply(command(message.type));
  });
  globalThis.StonestormResearchController=Object.freeze({command,status,subscribe(fn){subscribers.add(fn);return()=>subscribers.delete(fn);}});
  preferences?.subscribe(value=>{if(!value.development&&until){command('atlas-research-stop');}});
})();
