(() => {
  'use strict';
  let tabId;
  const status=document.querySelector('#status');
  async function send(type){
    try{if(!tabId){const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(!tab?.url?.startsWith('https://stonestorm.gg/'))throw Error('Nyisd meg a Stonestorm játékoldalát.');tabId=tab.id;}return await chrome.tabs.sendMessage(tabId,{type});}
    catch{status.textContent='Nyisd meg vagy frissítsd a Stonestorm játékoldalát a bővítmény telepítése után.';return null;}
  }
  async function update(){const result=await send('atlas-research-status');if(result)status.textContent=`${result.count} anonimizált válaszminta. ${result.active?'A gyűjtés aktív.':'A gyűjtés nem aktív.'}`;}
  document.querySelector('#start').addEventListener('click',async()=>{await send('atlas-research-arm');await update();});
  document.querySelector('#stop').addEventListener('click',async()=>{await send('atlas-research-stop');await update();});
  document.querySelector('#download').addEventListener('click',async()=>{
    const result=await send('atlas-research-export');if(!result?.samples?.length){status.textContent='Nincs exportálható, ismert sémájú minta. Indíts gyűjtést, majd nyisd meg a megfelelő játékfelületet.';return;}
    const blob=new Blob([JSON.stringify(result,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='stonestorm-atlas-anonim-minta.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);await update();
  });
  update();setInterval(update,1500);
})();
