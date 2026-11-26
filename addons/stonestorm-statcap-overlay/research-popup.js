(() => {
  'use strict';
  globalThis.StonestormI18n?.observe(document.documentElement);
  const style=document.createElement('style');style.textContent=globalThis.STONESTORM_COMPANION_CSS.replace(':host{',':root{');document.head.prepend(style);
  document.querySelector('[data-popup-crest]').innerHTML=StonestormCompanionComponents.crest;
  document.querySelector('[data-popup-version]').textContent='v'+chrome.runtime.getManifest().version+' BETA';
  const store=StonestormCompanionState.shared(chrome.storage),main=document.querySelector('main');let view=null;
  async function active(){const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(!tab?.url?.startsWith('https://stonestorm.gg/'))throw Error('Nyisd meg a Stonestorm játékoldalát.');return tab;}
  async function send(type){const tab=await active();return chrome.tabs.sendMessage(tab.id,{type});}
  store.subscribe(state=>{document.documentElement.dataset.theme=state.theme;view?.dispose?.();main.replaceChildren();
    const links=document.createElement('section');links.className='sc-card';links.innerHTML='<h3>Stonestorm Companion</h3><p>A játékhoz tartozó panel megnyitása.</p>'+[['overview','Áttekintés'],['stats','Statok'],['equipment','Felszerelés'],['raids','Portyák'],['settings','Beállítások']].map(([page,label])=>'<button type="button" data-open-page="'+page+'">'+label+'</button>').join('')+'<label class="sc-setting-row">Nyelv / Language<select data-popup-language><option value="hu">Magyar</option><option value="en">English</option></select></label><p role="status" data-popup-status></p>';main.append(links);
    const language=links.querySelector('[data-popup-language]');language.value=globalThis.StonestormI18n?.getLocale()??'hu';language.addEventListener('change',()=>globalThis.StonestormI18n?.setLocale(language.value));globalThis.StonestormI18n?.onChange(value=>{language.value=value;});
    links.addEventListener('click',async event=>{const button=event.target.closest('[data-open-page]');if(!button)return;try{const tab=await active();const result=await chrome.tabs.sendMessage(tab.id,{type:'ssa-companion-open',page:button.dataset.openPage});if(!result?.ok)throw Error('Frissítsd a játékoldalt a Companion betöltéséhez.');window.close();}catch(error){links.querySelector('[data-popup-status]').textContent=error.message;}});
    if(state.development){const development=document.createElement('section');development.innerHTML='<h3>Fejlesztés alatt · Atlas adatgyűjtés</h3>';main.append(development);view=StonestormResearchUI.mount(development,send);}
  });
})();
