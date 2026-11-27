/* Player-facing Sync status; technical paths remain in expandable evidence. */
globalThis.AtlasSyncUI={
  init({heading,rows,table,esc,notice,chip,num,db}){
    let status=globalThis.STONESTORM_SYNC_STATUS;
    const i18n=globalThis.AtlasI18n,t=(key,params)=>i18n.t(key,params);
    const textKeys=new Map(Object.entries(i18n.dictionaries.hu).filter(([key])=>key.startsWith('sync.text.')||key.startsWith('sync.reason.')).map(([key,value])=>[key.slice(0,key.lastIndexOf('.')+1)+value,key]));
    const date=value=>value?i18n.formatDate(new Date(value),{dateStyle:'medium',timeStyle:'short'}):t('sync.never');
    const translated=(text,prefix)=>{
      if(i18n.getLocale()==='hu')return text;
      const key=textKeys.get(prefix+text);
      if(key)return t(key);
      console.warn('Missing Sync translation:',text);
      return text;
    };
    const title=text=>text.split(' · ').map(part=>{
      const room=part.match(/^(hősi|normál) (\d+)\. terem$/);
      if(room)return t('sync.room',{mode:t(room[1]==='hősi'?'sync.heroic':'sync.normal'),room:num(Number(room[2]))});
      const dungeon=db.dungeons.find(x=>x.name===part);
      if(dungeon){const key=i18n.gameNameKey('dungeon',dungeon);return key?t(key):part;}
      if(db.mounts.some(x=>x.name===part))return part;
      return translated(part,'sync.text.');
    }).join(' · ');
    const reason=text=>translated(text,'sync.reason.');
    function grouped(groups,section){
      if(!groups?.length)return notice(t('sync.empty'));
      return groups.map(group=>`<details class="atlas-conflict sync-system" data-sync-group="${esc(section)}"><summary><strong>${esc(title(group.name))}</strong><span>${esc(t('sync.items',{count:num(group.count)}))}</span></summary><div class="sync-topics">${group.topics.map(topic=>`<article class="sync-topic"><h5>${esc(title(topic.title))}</h5><p>${chip(t('sync.class.'+(['automatic','unsupported','mechanism','observation','conflict'].includes(topic.classification)?topic.classification:'unknown')),'unknown')} <span>${esc(t('sync.fields',{count:num(topic.count)}))} · ${esc(t(topic.historyState==='historical-superseded'?'sync.historical':'sync.current'))}${topic.firstSeenAt?' · '+esc(date(topic.firstSeenAt)):''}</span></p><details class="sync-technical"><summary>${esc(t('sync.technical',{count:num(topic.paths.length)}))}</summary>${table([t('sync.data'),t('sync.technicalSource'),t('sync.explanation'),t('sync.proof')],topic.paths.map(item=>[esc(title(item.title)),'<code>'+esc(item.path)+'</code>',esc(reason(item.reason)),item.proof?'<code>'+esc(JSON.stringify(item.proof))+'</code>':esc(t('sync.openItem'))]))}</details></article>`).join('')}</div></details>`).join('');
    }
    function content(s){
      if(!s)return notice(t('sync.noCheck'));
      const metadata=rows([[t('sync.lastCheck'),date(s.lastSuccessfulCheck)],[t('sync.gameVersion'),s.gameVersion??t('common.unknown')],[t('sync.atlasVersion'),s.atlasDataVersion??t('common.unknown')],[t('sync.lastUpdate'),date(s.lastAutomaticUpdate)]]);
      const summary=s.reviewSummary;
      if(!summary)return metadata+notice(t('sync.oldStatus',{count:num(s.pending??0)}))+`<p><a class="atlas-inline-link" href="https://github.com/Legivok2/stonestorm-atlas/actions/workflows/atlas-sync.yml">${t('sync.runs')}</a></p>`;
      const a=summary.activity,cards=[['new',a.new],['carried',a.carried],['automatic',a.automatic],['documented',a.documented],['manual',a.manual]];
      const counters=`<div class="sync-metrics">${cards.map(([key,count])=>`<article><span>${esc(t('sync.'+key))}</span><strong>${esc(num(count))}</strong><small>${esc(t('sync.'+key+'Copy'))}</small></article>`).join('')}</div>`;
      const remaining=notice(t('sync.remaining',{open:num(summary.open),unsupported:num(summary.classified.unsupported),observation:num(summary.classified.observation),mechanism:num(summary.classified.mechanism),conflict:num(summary.classified.conflict)}));
      return metadata+(s.reviewCohorts??[]).map(c=>notice(t('sync.cohort',{original:num(c.originalOpen),resolved:num(c.resolved),open:num(c.open),historical:num(c.historical)}))).join('')+(s.branches?notice(t(s.freshness==='partial'?'sync.partial':'sync.compared'))+table([t('sync.branch'),t('sync.importedVersion'),t('sync.checkedVersion'),t('sync.status')],Object.entries(s.branches).map(([k,b])=>[esc(k),esc(b.gameVersion),esc(b.checkedVersion),esc(b.status)])):'')+counters+remaining+
        `<p>${chip(t(s.mode==='apply'?'sync.modeApply':'sync.modeCheck'),'unknown')} <a class="atlas-inline-link" href="https://github.com/Legivok2/stonestorm-atlas/actions/workflows/atlas-sync.yml" target="_blank" rel="noopener">${t('sync.runsEvidence')}</a></p>`+
        `<section class="sync-section"><h4>${t('sync.currentTitle')}</h4>${grouped(s.currentGroups,'current')}</section>`+
        `<section class="sync-section"><h4>${t('sync.processedTitle')}</h4>${grouped(s.processedGroups,'processed')}</section>`+
        `<details class="sync-section"><summary>${esc(t('sync.resolvedTitle',{count:num(summary.resolvedTotal)}))}</summary>${grouped(s.resolvedGroups,'resolved')}</details>`+
        `<section class="sync-section"><h4>${t('sync.manualTitle')}</h4>${grouped(s.manualGroups,'manual')}</section>`+
        `<section class="sync-section"><h4>${t('sync.historicalTitle')}</h4>${grouped(s.historicalGroups,'historical')}</section><section class="sync-section"><h4>${t('sync.openTitle')}</h4>${grouped(s.groups,'open')}</section>`+
        notice(t('sync.schedule'));
    }
    return {
      page:()=>heading(t('sync.title'),t('sync.copy'))+'<div id="atlas-sync-state">'+content(status)+'</div>',
      async afterRender(page){
        if(page!=='updates')return;
        try{
          const url=location.hostname==='legivok2.github.io'?'https://raw.githubusercontent.com/Legivok2/stonestorm-atlas/main/data/sync-status.json':new URL('data/sync-status.json',document.baseURI);
          const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('HTTP '+r.status);const s=await r.json();if(s.schema!==1)throw Error('Unknown status schema');status=s;const target=document.querySelector('#atlas-sync-state');if(target){const open=[...target.querySelectorAll('details')].map(x=>x.open);target.innerHTML=content(status);target.querySelectorAll('details').forEach((x,i)=>{x.open=!!open[i];});}
        }catch(error){console.warn('Atlas Sync status fetch failed:',error);const target=document.querySelector('#atlas-sync-state');if(target&&!target.querySelector('.sync-fetch-note'))target.insertAdjacentHTML('beforeend',`<div class="sync-fetch-note">${notice(t('sync.fetchError'))}</div>`);}
      }
    };
  }
};
