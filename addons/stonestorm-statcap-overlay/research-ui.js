(() => {
  'use strict';
  function mount(container,send){
    const icon=globalThis.StonestormCompanionComponents?.icon??(()=>''),esc=globalThis.StonestormCompanionComponents?.esc??(s=>s);
    container.innerHTML='<section class="sc-research-hero">'+icon('research')+'<div><span class="sc-eyebrow">ATLAS · KÖZÖS TUDÁS</span><h3>Egy perc figyelem.<br>Több felfedezés.</h3><p>A játék már megérkező válaszaiból gyűjtünk ismert, anonimizált mintákat.</p></div></section><div class="sc-research-progress"><div class="sc-research-status"><span data-research-status role="status"></span><span data-research-time></span></div><progress max="60" value="0" aria-label="Mintagyűjtés hátralévő ideje"></progress></div><ul class="sc-research-categories" data-research-categories></ul><div class="sc-research-actions"><button type="button" data-research="arm">Mintagyűjtés indítása</button><button type="button" data-research="export">Anonimizált JSON letöltése</button><button type="button" data-research="stop">Gyűjtés leállítása és adatok törlése</button></div><p class="sc-research-note" data-research-note role="status"></p><div class="sc-research-privacy">'+icon('lock')+' Kézzel indított, legfeljebb 60 másodperces megfigyelés. Nincs automatikus feltöltés. Saját karakter, inventory, preset és személyes kísérőadat nem kerül az exportba.</div>';
    const status=container.querySelector('[data-research-status]'),time=container.querySelector('[data-research-time]'),list=container.querySelector('[data-research-categories]'),note=container.querySelector('[data-research-note]');
    let disposed=false,lastCategories='',wasActive=false,cycle=0;
    const setText=(node,text)=>{if(node.textContent!==text)node.textContent=text;};
    function display(s){if(!s||disposed)return;if(s.active&&!wasActive)cycle++;if(wasActive&&!s.active&&s.count>0&&s.remainingSeconds===0)globalThis.StonestormCompanionEvents?.emit('notice',{kind:'research',text:'A mintagyűjtés elkészült. Az anonim export letölthető.',signature:'research:'+cycle});wasActive=s.active;setText(status,(s.active?'Gyűjtés aktív. ':'Gyűjtés nem aktív. ')+s.count+' anonimizált válaszminta.');setText(time,s.active?'Hátralévő idő: '+s.remainingSeconds+' mp':'60 másodperces megfigyelés');container.querySelector('progress').value=s.active?s.remainingSeconds:0;const key=JSON.stringify(s.categories);if(key!==lastCategories){lastCategories=key;list.replaceChildren(...(s.categories.length?s.categories:[{name:'Még nincs megfigyelt kategória',count:0}]).map(c=>{const li=document.createElement('li');li.textContent=c.name+': '+c.count+' minta';return li;}));}}
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
