(() => {
  'use strict';
  globalThis.StonestormAddonPanels={attach(shadow){
    const preferences=StonestormCompanionState.shared(chrome.storage);let development=false;
    let current=null,open=false,view=null,unsubscribe=null;
    function diagnosticText(){
      const s=globalThis.StonestormPetTooltip?.diagnostics();if(!s)return 'A kísérőfelismerés még nem áll rendelkezésre.';
      const summarize=(values,labels={})=>Object.entries(values).map(([key,count])=>(labels[key]??key)+': '+count).join(', ')||'nincs';
      const fields={petId:'faj',level:'szint',form:'forma',rank:'rang',active:'aktív állapot',skills:'tanult képességek'},failures={'roster-unavailable':'nem érkezett kísérőlista','instance-not-in-roster':'sorazonosító nincs a listában','row-without-instance-id':'nincs sorazonosító','species-conflict':'eltérő faj a sorban és a rekordban','conflicting-dom-bonuses':'több eltérő bónuszfelirat','invalid-instance-id':'hibás saját azonosító','missing-species-id':'hiányzó fajazonosító','duplicate-instance-id':'ütköző saját azonosító'};
      return ['Felismert kísérők: '+s.recognizedPets+' / '+s.receivedPets,'Látható sorokhoz hozzárendelve: '+s.matchedPets,'Fajbónusz forrása: '+summarize(s.bonusSources,{dom:'játékfelirat','client-formula':'kliensképlet',unavailable:'nem elérhető'}),'Hiányzó mezők: '+summarize(s.missingFields,fields),'Kliensben igazolt alapértékek: '+summarize(s.clientDefaults,fields),'Azonosítási hibák: '+summarize(s.identificationFailures,failures),'Elutasított rekordok: '+summarize(s.rejectedRecords,failures)].join('\n');
    }
    const refreshDiagnostics=()=>{const target=shadow.querySelector('[data-pet-diagnostics]');if(target){const text=diagnosticText();if(target.textContent!==text)target.textContent=text;}};
    window.addEventListener('ss-addon-pet-diagnostics',refreshDiagnostics);
    function mount(){
      if(!development){view?.dispose();unsubscribe?.();view=null;unsubscribe=null;current=null;shadow.querySelector('[data-atlas-research]')?.remove();shadow.querySelector('[data-pet-diagnostics]')?.closest('details')?.remove();return;}
      const panel=shadow.querySelector('.panel');if(panel===current)return;
      view?.dispose();unsubscribe?.();current=panel;if(!panel)return;
      const details=document.createElement('details');details.className='summary-fold';details.dataset.atlasResearch='';details.open=open;
      const summary=document.createElement('summary');summary.textContent='📥 Atlas adatgyűjtés';details.append(summary);
      const body=document.createElement('div');body.style.cssText='padding:12px;line-height:1.55';details.append(body);
      details.addEventListener('toggle',()=>{open=details.open;});const destination=shadow.querySelector('[data-companion-slot="research"]');if(destination)destination.append(details);else panel.insertBefore(details,panel.querySelector('.panel-content'));
      view=globalThis.StonestormResearchUI.mount(body,type=>globalThis.StonestormResearchController.command(type));
      unsubscribe=globalThis.StonestormResearchController.subscribe(view.display);
      const diagnostic=document.createElement('details'),label=document.createElement('summary'),text=document.createElement('pre');label.textContent='Kísérő-tooltip helyi diagnosztika';text.dataset.petDiagnostics='';text.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font:11px/1.6 system-ui';diagnostic.append(label,text);(shadow.querySelector('[data-companion-slot=diagnostics]')??body).append(diagnostic);refreshDiagnostics();
      diagnostic.addEventListener('toggle',()=>{if(diagnostic.open)refreshDiagnostics();});
    }
    new MutationObserver(mount).observe(shadow,{childList:true,subtree:true});preferences.subscribe(value=>{development=value.development;mount();});
  }};
})();
