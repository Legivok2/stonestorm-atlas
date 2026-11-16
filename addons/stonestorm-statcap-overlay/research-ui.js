(() => {
  'use strict';
  function mount(container,send){
    container.innerHTML='<p>Csak kézzel indított, 60 másodperces megfigyelés. Nincs automatikus feltöltés vagy személyes kísérőadat az exportban.</p><button type="button" data-research="arm">Mintagyűjtés indítása</button><p data-research-status role="status"></p><p data-research-time></p><ul data-research-categories></ul><button type="button" data-research="export">Anonimizált JSON letöltése</button><button type="button" data-research="stop">Gyűjtés leállítása és adatok törlése</button><p data-research-note></p>';
    const status=container.querySelector('[data-research-status]'),time=container.querySelector('[data-research-time]'),list=container.querySelector('[data-research-categories]'),note=container.querySelector('[data-research-note]');
    let disposed=false;
    function display(s){if(!s||disposed)return;status.textContent=(s.active?'Gyűjtés aktív. ':'Gyűjtés nem aktív. ')+s.count+' anonimizált válaszminta.';time.textContent='Hátralévő idő: '+s.remainingSeconds+' mp';list.replaceChildren(...s.categories.map(c=>{const li=document.createElement('li');li.textContent=c.name+': '+c.count+' minta';return li;}));}
    async function update(){try{display(await send('atlas-research-status'));}catch{status.textContent='A gyűjtés nem érhető el. Frissítsd a játék lapját a bővítmény telepítése után.';}}
    container.addEventListener('click',async event=>{
      const button=event.target.closest('[data-research]');if(!button)return;
      try{
        note.textContent='';const result=await send('atlas-research-'+button.dataset.research);
        if(button.dataset.research==='export'){
          if(!result?.samples?.length){note.textContent='Nincs exportálható ismert minta. Indíts gyűjtést, majd nyisd meg a megfelelő játékfelületet.';}
          else{const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='stonestorm-atlas-anonim-minta.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);note.textContent='Az export elkészült; a helyi gyűjtés adatai törölve.';}
        }
        await update();
      }catch{note.textContent='A művelet nem sikerült. Frissítsd a játék lapját.';}
    });
    const timer=setInterval(update,1000);update();
    return {display,dispose(){disposed=true;clearInterval(timer);}};
  }
  globalThis.StonestormResearchUI=Object.freeze({mount});
})();
