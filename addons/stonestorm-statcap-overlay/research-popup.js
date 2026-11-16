(() => {
  'use strict';
  async function send(type){
    const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
    if(!tab?.url?.startsWith('https://stonestorm.gg/'))throw Error('Nyisd meg a Stonestorm játékoldalát.');
    return chrome.tabs.sendMessage(tab.id,{type});
  }
  globalThis.StonestormResearchUI.mount(document.querySelector('main'),send);
})();
