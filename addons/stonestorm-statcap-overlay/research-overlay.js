(() => {
  'use strict';
  globalThis.StonestormAddonPanels={attach(shadow){
    let current=null,open=false,view=null,unsubscribe=null;
    function diagnosticText(){
      const s=globalThis.StonestormPetTooltip?.diagnostics();if(!s)return 'A kísérőfelismerés még nem áll rendelkezésre.';
      const summarize=(values,labels={})=>Object.entries(values).map(([key,count])=>(labels[key]??key)+': '+count).join(', ')||'nincs';
      const fields={petId:'faj',level:'szint',form:'forma',rank:'rang',active:'aktív állapot',skills:'tanult képességek'},failures={'roster-unavailable':'nem érkezett kísérőlista','instance-not-in-roster':'sorazonosító nincs a listában','row-without-instance-id':'nincs sorazonosító','species-conflict':'eltérő faj a sorban és a rekordban','conflicting-dom-bonuses':'több eltérő bónuszfelirat','invalid-instance-id':'hibás saját azonosító','missing-species-id':'hiányzó fajazonosító','duplicate-instance-id':'ütköző saját azonosító'};
      return ['Felismert kísérők: '+s.recognizedPets+' / '+s.receivedPets,'Látható sorokhoz hozzárendelve: '+s.matchedPets,'Fajbónusz forrása: '+summarize(s.bonusSources,{dom:'játékfelirat','client-formula':'kliensképlet',unavailable:'nem elérhető'}),'Hiányzó mezők: '+summarize(s.missingFields,fields),'Kliensben igazolt alapértékek: '+summarize(s.clientDefaults,fields),'Azonosítási hibák: '+summarize(s.identificationFailures,failures),'Elutasított rekordok: '+summarize(s.rejectedRecords,failures)].join('\n');
    }
    const refreshDiagnostics=()=>{const target=shadow.querySelector('[data-pet-diagnostics]');if(target){const text=diagnosticText();if(target.textContent!==text)target.textContent=text;}};
    window.addEventListener('ss-addon-pet-diagnostics',refreshDiagnostics);
    const style=document.createElement('style');style.textContent='details[data-atlas-research]{border-block:1px solid #796344;background:#181b20}details[data-atlas-research]>summary{padding:11px 16px;color:#e8c585;cursor:pointer;font-weight:650}details[data-atlas-research] button{display:block;box-sizing:border-box;width:100%;margin:8px 0;padding:9px;border:1px solid #987242;border-radius:7px;background:#29241d;color:#f0d49a;font:inherit;cursor:pointer}details[data-atlas-research] button:focus-visible{outline:2px solid #f0cd7b;outline-offset:2px}details[data-atlas-research] p{font-size:12px;margin:6px 0}';shadow.append(style);
    function mount(){
      const panel=shadow.querySelector('.panel');if(panel===current)return;
      view?.dispose();unsubscribe?.();current=panel;if(!panel)return;
      const details=document.createElement('details');details.className='summary-fold';details.dataset.atlasResearch='';details.open=open;
      const summary=document.createElement('summary');summary.textContent='📥 Atlas adatgyűjtés';details.append(summary);
      const body=document.createElement('div');body.style.cssText='padding:12px;line-height:1.55';details.append(body);
      details.addEventListener('toggle',()=>{open=details.open;});panel.insertBefore(details,panel.querySelector('.panel-content'));
      view=globalThis.StonestormResearchUI.mount(body,type=>globalThis.StonestormResearchController.command(type));
      unsubscribe=globalThis.StonestormResearchController.subscribe(view.display);
      const diagnostic=document.createElement('details'),label=document.createElement('summary'),text=document.createElement('pre');label.textContent='Kísérő-tooltip helyi diagnosztika';text.dataset.petDiagnostics='';text.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font:11px/1.6 system-ui';diagnostic.append(label,text);body.append(diagnostic);refreshDiagnostics();
      diagnostic.addEventListener('toggle',()=>{if(diagnostic.open)refreshDiagnostics();});
    }
    new MutationObserver(mount).observe(shadow,{childList:true,subtree:true});mount();
  }};
})();
