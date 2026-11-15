/* Passive, explicitly armed fetch observation. Returns the original Promise and Response. */
(() => {
  'use strict';
  if(window.top!==window||window.__ssAtlasResearch)return;
  Object.defineProperty(window,'__ssAtlasResearch',{value:true});
  let until=0;
  window.addEventListener('ss-atlas-research-arm',()=>{until=Date.now()+60000;});
  window.addEventListener('ss-atlas-research-stop',()=>{until=0;});
  const original=window.fetch;
  if(typeof original!=='function')return;
  window.fetch=function(...args){
    const promise=original.apply(this,args);
    try{
      const request=args[0],url=new URL(typeof request==='string'?request:request.url,location.href),method=String(args[1]?.method??request?.method??'GET').toUpperCase();
      if(until>Date.now()&&url.origin===location.origin&&method==='GET'&&globalThis.StonestormResearch.paths.includes(url.pathname)){
        const deadline=until;
        promise.then(response=>{
          if(!response.ok||until!==deadline||Date.now()>until||Number(response.headers.get('content-length'))>2*1024*1024)return;
          response.clone().text().then(text=>{
            if(text.length>2*1024*1024||until!==deadline||Date.now()>until)return;
            const sample=globalThis.StonestormResearch.sanitize(url.pathname,JSON.parse(text));
            if(sample)window.postMessage({source:'ss-atlas-research-sample-v1',sample},location.origin);
          }).catch(()=>{});
        }).catch(()=>{});
      }
    }catch{}
    return promise;
  };
})();
