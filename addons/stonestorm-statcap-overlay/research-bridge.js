(() => {
  'use strict';
  if(window.top!==window)return;
  let until=0,samples={};
  window.addEventListener('message',event=>{
    if(event.source!==window||event.origin!==location.origin||event.data?.source!=='ss-atlas-research-sample-v1'||Date.now()>until)return;
    const sample=event.data.sample;
    const clean=globalThis.StonestormResearch.sanitize(sample?.endpoint,sample?.data);
    if(clean&&JSON.stringify(clean).length<200000)samples[clean.endpoint]=clean;
  });
  chrome.runtime.onMessage.addListener((message,sender,reply)=>{
    if(sender.id!==chrome.runtime.id)return;
    if(message?.type==='atlas-research-arm'){samples={};until=Date.now()+60000;window.dispatchEvent(new Event('ss-atlas-research-arm'));}
    if(message?.type==='atlas-research-stop'){until=0;samples={};window.dispatchEvent(new Event('ss-atlas-research-stop'));}
    if(message?.type==='atlas-research-export'){
      until=0;window.dispatchEvent(new Event('ss-atlas-research-stop'));
      reply({schema:1,addonVersion:'0.9.4',source:'user-initiated-anonymized-observation',samples:Object.values(samples)});samples={};return;
    }
    reply({count:Object.keys(samples).length,active:Date.now()<until});
  });
})();
