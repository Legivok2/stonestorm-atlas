/* MAIN world. Invoke only the verified public client's existing character GET.
 * Its own auth/lean decoder remains responsible for the request. No token is
 * inspected, copied, logged or posted to the extension world. No gameplay writer. */
(() => {
  'use strict';
  if(window.top!==window)return;
  let inFlight=null,lastStart=0;
  const waiting=new Set(),seen=new Set();
  const emit=(kind,payload)=>window.postMessage({source:'ss-statcap-api-v2',kind,payload},location.origin);
  const status=(requestId,state,code='')=>emit('equipment-refresh',{requestId,state,code});
  async function read(){
    const path='/assets/index-B-KQL_s0.js';
    const script=[...document.querySelectorAll('script[type="module"][src]')].find(node=>{
      try{const url=new URL(node.src,location.href);return url.origin===location.origin&&url.pathname===path&&!url.search;}catch{return false;}
    });
    if(!script)throw Error('source-unavailable');
    const client=await import(script.src);
    if(typeof client.X!=='function'||!/^\(\)=>[\w$]+\("\/api\/character"\)$/.test(Function.prototype.toString.call(client.X)))throw Error('source-changed');
    const payload=await client.X();
    const snapshot=globalThis.StonestormEquipmentCapture.character(payload);
    if(!snapshot)throw Error('no-character');
    emit('equipment-character',snapshot);
  }
  window.addEventListener('message',event=>{
    if(event.source!==window||event.origin!==location.origin||event.data?.source!=='ss-equipment-read-v1'||event.data.action!=='character')return;
    const id=event.data.requestId;
    if(typeof id!=='string'||!/^[\da-f-]{36}$/i.test(id)||seen.has(id))return;
    seen.add(id);if(seen.size>64)seen.delete(seen.values().next().value);
    if(waiting.size>=8){status(id,'error','busy');return;}
    if(!inFlight&&Date.now()-lastStart<3000){status(id,'error','cooldown');return;}
    waiting.add(id);status(id,'loading');
    if(inFlight)return;
    lastStart=Date.now();
    // No retry loop. The UI can retry explicitly after the current read finishes.
    inFlight=read().then(()=>{for(const id of waiting)status(id,'done');}).catch(error=>{
      const code=['source-unavailable','source-changed','no-character'].includes(error?.message)?error.message:'read-failed';
      for(const id of waiting)status(id,'error',code);
    }).finally(()=>{inFlight=null;waiting.clear();});
  });
})();
