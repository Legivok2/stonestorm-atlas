/* A frissítések először játékosnyelven, a JSON-útvonalak csak részletekben láthatók. */
globalThis.AtlasSyncUI={
  init({heading,rows,table,esc,notice,chip}){
    let status=globalThis.STONESTORM_SYNC_STATUS;
    const date=value=>value?new Date(value).toLocaleString('hu-HU'):'Még nem történt';
    const labels={automatic:'Validálható adat',unsupported:'Importáló támogatás hiányzik',mechanism:'Játékmechanika felülvizsgálata',observation:'Korábbi forrásleltár',conflict:'Igazolt eltérés tisztázandó'};
    function grouped(groups,section){
      if(!groups?.length)return '<p class="atlas-notice">Ebben a csoportban nincs tétel.</p>';
      return groups.map(group=>`<details class="atlas-conflict sync-system" data-sync-group="${esc(section)}"><summary><strong>${esc(group.name)}</strong><span>${esc(group.count)} tétel</span></summary><div class="sync-topics">${group.topics.map(topic=>`<article class="sync-topic"><h5>${esc(topic.title)}</h5><p>${chip(labels[topic.classification]??'Ellenőrzendő','unknown')} <span>${esc(topic.count)} mező / forrástétel · ${topic.historyState==='historical-superseded'?'történeti eltérés':'aktuális adat'}${topic.firstSeenAt?' · '+esc(date(topic.firstSeenAt)):''}</span></p><details class="sync-technical"><summary>Technikai részletek és bizonyítékok (${esc(topic.paths.length)})</summary>${table(['Adat','Technikai forrás','Magyarázat','Lezárási bizonyíték'],topic.paths.map(item=>[esc(item.title),'<code>'+esc(item.path)+'</code>',esc(item.reason),item.proof?'<code>'+esc(JSON.stringify(item.proof))+'</code>':'Nyitott tétel']))}</details></article>`).join('')}</div></details>`).join('');
    }
    function content(s){
      if(!s)return notice('Még nincs sikeres automatikus adatellenőrzés.');
      const metadata=rows([['Utolsó sikeres adatellenőrzés',date(s.lastSuccessfulCheck)],['Megfigyelt játékverzió',s.gameVersion??'Nem ismert'],['Atlas adatbázisverziója',s.atlasDataVersion??'Nem ismert'],['Utolsó automatikus adatfrissítés',date(s.lastAutomaticUpdate)]]);
      const summary=s.reviewSummary;
      if(!summary)return metadata+notice('A korábbi állapotfájl még nem tartalmaz csoportosított besorolást. Nyitott tételek: '+(s.pending??0))+`<p><a class="atlas-inline-link" href="https://github.com/Legivok2/stonestorm-atlas/actions/workflows/atlas-sync.yml">Futások és jelentések ↗</a></p>`;
      const a=summary.activity;
      const cards=[['Most észlelt újdonságok',a.new,'Az aktuális futásban újonnan felvett ellenőrzési események.'],['Korábbról nyitva maradt',a.carried,'A változatlan API-válasz nem zárja le ezeket.'],['Automatikusan feldolgozva',a.automatic,'Igazoltan átvezetett vagy már egyező adatmezők.'],['Dokumentáltan lezárva',a.documented,'Forrásegyezés vagy ellenőrzött szerkesztői számítás.'],['Kézi szakmai felülvizsgálat',a.manual,'Megváltozott mechanikák és valódi eltérések.']];
      const counters=`<div class="sync-metrics">${cards.map(([title,count,copy])=>`<article><span>${esc(title)}</span><strong>${esc(count)}</strong><small>${esc(copy)}</small></article>`).join('')}</div>`;
      const remaining=notice(`${summary.open} nyitott tétel: ${summary.classified.unsupported} ismert adatnál importáló támogatás hiányzik, ${summary.classified.observation} korábbi forrásleltár. A szakmai felülvizsgálatot ${summary.classified.mechanism} mechanikai változás és ${summary.classified.conflict} valódi eltérés indokolja. A forrásleltár nem jelent több száz bizonyított új játékszabályt.`);
      return metadata+(s.reviewCohorts??[]).map(c=>notice('Átvizsgált előzménylista: '+c.originalOpen+' korábban nyitott tételből '+c.resolved+' lezárt, '+c.open+' nyitott. A lezárásokból '+c.historical+' történeti, igazolt új adattal felülírt esemény.')).join('')+(s.branches?notice(s.freshness==='partial'?'Részleges adatfrissesség: egyes adatágak eltérnek a megfigyelt verziótól.':'Minden Data Engine ág összehasonlítva a megfigyelt API-val.')+table(['Adatág','Importált verzió','Összevetett verzió','Állapot'],Object.entries(s.branches).map(([k,b])=>[esc(k),esc(b.gameVersion),esc(b.checkedVersion),esc(b.status)])):'')+counters+remaining+
        `<p>${chip(s.mode==='apply'?'Legutóbbi futás: tesztelt import':'Legutóbbi futás: csak ellenőrzés','unknown')} <a class="atlas-inline-link" href="https://github.com/Legivok2/stonestorm-atlas/actions/workflows/atlas-sync.yml" target="_blank" rel="noopener">Futások és teljes bizonyítékok ↗</a></p>`+
        `<section class="sync-section"><h4>Az aktuális ellenőrzés új változásai</h4>${grouped(s.currentGroups,'current')}</section>`+
        `<section class="sync-section"><h4>Sikeresen feldolgozott változások</h4>${grouped(s.processedGroups,'processed')}</section>`+
        `<details class="sync-section"><summary>Korábban lezárt tételek és bizonyítékaik (${esc(summary.resolvedTotal)})</summary>${grouped(s.resolvedGroups,'resolved')}</details>`+
        `<section class="sync-section"><h4>Valóban szakmai felülvizsgálatot igénylő változások</h4>${grouped(s.manualGroups,'manual')}</section>`+
        `<section class="sync-section"><h4>Történeti, azóta felülírt eltérések</h4>${grouped(s.historicalGroups,'historical')}</section><section class="sync-section"><h4>Korábbról fennmaradt nyitott tételek</h4>${grouped(s.groups,'open')}</section>`+
        notice('Az ütemezés 6 óránként fut; a GitHub indítása késhet. Csak validált, ismert adatok kerülnek automatikusan az Atlasba. A hiányzó rekordok megmaradnak, a kísérők és az M4 Romőr igazolt szabályai védettek.');
    }
    return {
      page:()=>heading('Atlas frissítések','Játékrendszerenként csoportosított változások, igazolt adatfrissítések és valódi ellenőrzési feladatok.')+'<div id="atlas-sync-state">'+content(status)+'</div>',
      async afterRender(page){
        if(page!=='updates')return;
        try{
          const url=location.hostname==='legivok2.github.io'?'https://raw.githubusercontent.com/Legivok2/stonestorm-atlas/main/data/sync-status.json':new URL('data/sync-status.json',document.baseURI);
          const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('HTTP '+r.status);const s=await r.json();if(s.schema!==1)throw Error('Ismeretlen állapot');status=s;const target=document.querySelector('#atlas-sync-state');if(target)target.innerHTML=content(status);
        }catch{const target=document.querySelector('#atlas-sync-state');if(target)target.insertAdjacentHTML('beforeend',notice('A friss állapot nem érhető el; a csomaghoz mellékelt utolsó sikeres ellenőrzés látható. Az aktuális futásokat a GitHub Actions oldalon ellenőrizheted.'));}
      }
    };
  }
};
