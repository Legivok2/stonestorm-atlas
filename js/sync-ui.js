/* Auto-Sync: kizárólag a saját, statikus állapotfájl olvasása. */
globalThis.AtlasSyncUI={
  init({heading,rows,table,esc,notice,chip}){
    let status=globalThis.STONESTORM_SYNC_STATUS;
    const date=value=>value?new Date(value).toLocaleString('hu-HU'):'Még nem történt';
    function content(s){
      if(!s)return notice('Még nincs sikeres automatikus adatellenőrzés.');
      const c=s.changeCounts??{};
      return rows([['Utolsó sikeres adatellenőrzés',date(s.lastSuccessfulCheck)],['Megfigyelt játékverzió',s.gameVersion??'Nem ismert'],['Atlas adatbázisverziója',s.atlasDataVersion??'Nem ismert'],['Utolsó automatikus adatfrissítés',date(s.lastAutomaticUpdate)],['Legutóbb importált új / módosult rekordok',`${s.lastImportCounts?.added??0} / ${s.lastImportCounts?.changed??0}`],['Legutóbbi API-összevetés: új / módosult / hiányzó mezők',`${c.added??0} / ${c.changed??0} / ${c.removed??0}`],['Ellenőrzésre váró tételek',s.pending??0]])+
        notice('A GitHub Actions 6 óránként ellenőriz; az indítás késhet. A játékverzió megfigyelése nem jelenti minden rendszer importálását. A hiányzó rekordokat megtartjuk, az ismeretlen mechanikák ellenőrzésre várnak.')+
        `<p>${chip(s.mode==='apply'?'Legutóbbi futás: tesztelt import':'Legutóbbi futás: csak ellenőrzés','unknown')} <a class="atlas-inline-link" href="https://github.com/Legivok2/stonestorm-atlas/actions/workflows/atlas-sync.yml" target="_blank" rel="noopener">Futások és friss jelentések ↗</a></p><details class="atlas-conflict"><summary>Ellenőrzésre váró újdonságok (${esc(s.pending??0)})</summary>${table(['Forrásmező','Állapot'],(s.pendingItems??[]).map(x=>[esc(x.path),esc(x.reason)]))}<p>Legfeljebb 60 tétel látható. A teljes jelentés a repositoryban és a futás artifactjában található.</p></details>`;
    }
    return {
      page:()=>heading('Atlas frissítések','Nyilvános játékadatok ellenőrzése, követhető változások és védett adatimport.')+'<div id="atlas-sync-state">'+content(status)+'</div>',
      async afterRender(page){
        if(page!=='updates')return;
        try{
          // Állapotjelentés miatt nem kell a 177 MiB-os Pages-csomagot újraépíteni.
          const url=location.hostname==='legivok2.github.io'?'https://raw.githubusercontent.com/Legivok2/stonestorm-atlas/main/data/sync-status.json':new URL('data/sync-status.json',document.baseURI);
          const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('HTTP '+r.status);const s=await r.json();if(s.schema!==1)throw Error('Ismeretlen állapot');status=s;const target=document.querySelector('#atlas-sync-state');if(target)target.innerHTML=content(status);
        }catch{const target=document.querySelector('#atlas-sync-state');if(target)target.insertAdjacentHTML('beforeend',notice('A friss állapot nem érhető el; a csomaghoz mellékelt utolsó sikeres ellenőrzés látható. Az aktuális futásokat a GitHub Actions oldalon ellenőrizheted.'));}
      }
    };
  }
};
