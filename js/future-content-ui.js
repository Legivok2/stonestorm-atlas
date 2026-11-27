globalThis.AtlasFutureContentUI={
  init({heading,notice,esc,db,num}){
    let data=globalThis.STONESTORM_FUTURE_CONTENT;
    const filters={category:'all',status:'all',query:'',view:'signals'};
    const i18n=globalThis.AtlasI18n,t=(key,params)=>i18n.t(key,params);
    const textKeys=new Map(Object.entries(i18n.dictionaries.hu).filter(([key])=>key.startsWith('future.name.')||key.startsWith('future.reason.')).map(([key,value])=>[key.slice(0,key.lastIndexOf('.')+1)+value,key]));
    const statuses=['prepared','announced','active','uncertain','removed'];
    const date=value=>value?i18n.formatDate(new Date(value),{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Budapest'}):t('common.unknown');
    const safeURL=value=>{try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:null;}catch{return null;}};
    const lookup=(text,prefix,locale=i18n.getLocale())=>{
      const key=textKeys.get(prefix+text);
      return key?i18n.dictionaries[locale][key]:null;
    };
    const category=(row,locale=i18n.getLocale())=>i18n.dictionaries[locale]['future.category.'+row.category]??data?.categoryNames?.[row.category]??row.category;
    const name=(row,locale=i18n.getLocale())=>{
      const original=row.nameHu??i18n.t('future.observation',{},locale);
      if(locale==='hu')return original;
      const direct=lookup(original,'future.name.',locale);if(direct)return direct;
      if(i18n.dictionaries.hu['future.category.'+row.category]===original)return category(row,locale);
      const types={maps:'map',mobs:'mob',bosses:'boss',dungeons:'dungeon',pets:'pet',classes:'class'};
      const kind=types[row.category],record=kind?{id:row.entityId??row.key,name:original}:null,key=record&&i18n.gameNameKey(kind,record);
      if(key)return i18n.dictionaries[locale][key];
      if(row.category==='locations'||row.category==='rooms'||row.category==='difficulties'){
        const id=row.parentId??row.key.split(':')[0],parent=db[row.category==='locations'?'maps':'dungeons'].find(x=>x.id===id);
        const parentKey=parent&&i18n.gameNameKey(row.category==='locations'?'map':'dungeon',parent);
        const parentName=parentKey?i18n.dictionaries[locale][parentKey]:parent?.name;
        if(parentName&&original.startsWith(parent.name+' · ')){
          if(row.category==='locations')return i18n.t('future.name.location',{name:parentName},locale);
          const suffix=original.slice(parent.name.length+3);
          if(row.category==='rooms'&&/^\d+\. terem$/.test(suffix))return i18n.t('future.name.room',{name:parentName,room:num(Number.parseInt(suffix,10))},locale);
          const mode={'normál':'normal','hősi':'heroic','új nehézségi fokozat':'other'}[suffix];
          if(mode)return i18n.t('future.name.difficulty',{name:parentName,mode:i18n.t('future.mode.'+mode,{},locale)},locale);
        }
      }
      if(original.startsWith('Angol fordítás: '))return i18n.t('future.name.translation',{name:original.slice('Angol fordítás: '.length)},locale);
      if(original.startsWith('Magyar fordítás: '))return i18n.t('future.name.hungarianTranslation',{name:original.slice('Magyar fordítás: '.length)},locale);
      return original;
    };
    const reason=row=>lookup(row.statusReason,'future.reason.')??row.statusReason??t('future.awaitingEvidence');
    const textValue=(value,row)=>value===null||value===undefined?t('future.noPrevious'):typeof value==='boolean'?t(value?'future.enabled':'future.disabled'):typeof value==='number'?num(value):Array.isArray(value)?t('future.entries',{count:num(value.length)}):typeof value==='object'?(['items','families'].includes(row.category)&&Number.isFinite(value.level??value.itemLevel)?t('future.equipmentLevel',{level:num(value.level??value.itemLevel)}):Number.isFinite(value.minLevel)?t('future.entryLevel',{level:num(value.minLevel)}):t('future.complex')):t('future.textReference');
    const json=value=>esc(JSON.stringify(value,null,2)?.slice(0,6000)??t('future.none'));
    const signal=row=>!row.legacy&&(row.potential||row.upcoming||['announced','active','removed'].includes(row.status));
    const status=id=>t('future.status.'+(statuses.includes(id)?id:'uncertain'));
    const kind=id=>i18n.dictionaries[i18n.getLocale()]['future.kind.'+id]??id;
    const pill=row=>'<span class="future-status status-'+esc(row.status)+'">'+esc(status(row.status))+'</span>';
    function source(row,event){
      const url=safeURL(event?.source??row.source),history=row.history??[];
      return '<details class="future-source"><summary>'+t('future.source')+'</summary><dl><dt>'+t('future.identifier')+'</dt><dd>'+esc(row.key)+'</dd><dt>'+t('future.sourceUrl')+'</dt><dd>'+(url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(url)+'</a>':t('future.invalidUrl'))+'</dd><dt>'+t('future.sourceField')+'</dt><dd><code>'+esc(event?.sourcePath??row.sourcePath)+'</code></dd><dt>SHA-256</dt><dd><code>'+esc(event?.sourceHash??row.sourceHash??t('future.noHash'))+'</code></dd><dt>'+t('future.firstSeen')+'</dt><dd>'+esc(date(row.firstSeenAt))+'</dd><dt>'+t('future.lastCheck')+'</dt><dd>'+esc(date(row.lastCheckedAt??row.lastSeenAt))+'</dd><dt>'+t('future.gameVersion')+'</dt><dd>'+esc(event?.gameVersion??row.gameVersion)+'</dd></dl>'+(row.activationEvidence?'<p>'+t('future.gameObservation')+': '+esc(row.activationEvidence.explanation)+'</p>':'')+(row.officialAnnouncement?'<p>'+t('future.official')+': '+esc(row.officialAnnouncement.title)+' · '+esc(date(row.officialAnnouncement.publishedAt))+'</p>':'')+'<details><summary>'+t('future.oldNew')+'</summary><div class="future-json"><div><strong>'+t('future.before')+'</strong><pre>'+json(event?event.before:row.previousValue??null)+'</pre></div><div><strong>'+t('future.after')+'</strong><pre>'+json(event?event.after:row.value)+'</pre></div></div></details>'+(history.length?'<ol class="future-small-history">'+[...history].reverse().slice(0,20).map(x=>'<li>'+esc(date(x.at))+' · '+esc(kind(x.kind))+' · '+esc(status(x.status))+'</li>').join('')+'</ol>':'')+'</details>';
    }
    function card(row,event){
      const image=row.relatedImages?.find(x=>x.localFile)||row.relatedImages?.find(x=>safeURL(x.url)),src=image?.localFile??image?.url;
      const safeLocal=typeof src==='string'&&!src.startsWith('/')&&!src.includes('..')&&!src.includes('\\')&&/^(?:assets|stonestorm_image_tools\/downloaded|Stonestorm_files)\//.test(src);
      const picture=src&&(safeLocal||safeURL(src))?'<div class="future-picture"><img src="'+esc(src)+'" alt="'+esc(image.label??name(row))+'" loading="lazy" referrerpolicy="no-referrer"/><span>'+t(image.status==='catalog'?'future.catalogImage':'future.publicImage')+'</span></div>':'';
      const value=event?'<div class="future-change"><span>'+esc(textValue(event.before,row))+'</span><b aria-hidden="true">→</b><strong>'+esc(textValue(event.after,row))+'</strong></div>':'';
      return '<article class="future-card" data-future-observation="'+esc(row.id)+'">'+picture+'<div class="future-card-body"><div class="future-card-top"><span>'+esc(category(row))+'</span>'+pill(event?{...row,status:event.status}:row)+'</div><h4>'+esc(name(row))+'</h4><p>'+esc(reason(row))+'</p>'+value+(event?'<div class="future-event-kind">'+esc(i18n.dictionaries[i18n.getLocale()]['future.kind.'+event.kind]?kind(event.kind):t('future.sourceChange'))+'</div>':'')+'<footer><time datetime="'+esc(event?.at??row.firstSeenAt)+'">'+esc(date(event?.at??row.firstSeenAt))+'</time>'+(row.seenThisCheck?'':'<span>'+t('future.notRechecked')+'</span>')+'</footer>'+source(row,event)+'</div></article>';
    }
    function records(){
      const rows=(data?.observations??[]).filter(x=>!x.legacy),byId=new Map(rows.map(x=>[x.id,x]));
      let list=filters.view==='history'?(data?.events??[]).map(event=>({row:byId.get(event.observationId),event})).filter(x=>x.row):rows.filter(x=>filters.view==='all'||signal(x)).map(row=>({row,event:null}));
      const q=filters.query.trim().toLocaleLowerCase('hu');list=list.filter(({row,event})=>(filters.category==='all'||row.category===filters.category)&&(filters.status==='all'||(event?.status??row.status)===filters.status)&&(!q||[row.nameHu,name(row,'en'),category(row,'hu'),category(row,'en'),row.key,row.statusReason].join(' ').toLocaleLowerCase('hu').includes(q)));
      list.sort((a,b)=>(b.event?.at??b.row.firstSeenAt).localeCompare(a.event?.at??a.row.firstSeenAt)||a.row.id.localeCompare(b.row.id));return list;
    }
    function results(){
      const list=records(),limited=list.slice(0,80);
      return '<p class="future-result-count" role="status">'+esc(t('future.count',{count:num(list.length)}))+(data.baselineSummary?.count?' · '+esc(t('future.baseline',{count:num(data.baselineSummary.count)})):'')+(list.length>80?' · '+t('future.limit'):'')+'</p>'+(list.length?'<div class="'+(filters.view==='history'?'future-timeline':'future-grid')+'">'+limited.map(x=>card(x.row,x.event)).join('')+'</div>':'<div class="future-empty"><span aria-hidden="true">◇</span><h4>'+t('future.empty')+'</h4><p>'+t('future.emptyCopy')+'</p></div>');
    }
    function page(){
      if(data?.schema!==2)return heading(t('future.title'),t('future.shortCopy'))+notice(t('future.notLoaded'));
      const summary=data.summary,signals=data.observations.filter(signal),announced=signals.filter(x=>x.status==='announced'),prepared=signals.filter(x=>x.status==='prepared'),recent=(data.events??[]).filter(x=>data.newEventIds.includes(x.id)&&x.kind!=='initial');
      const options=Object.keys(data.categoryNames??{}).filter(k=>data.observations.some(x=>x.category===k&&!x.legacy)).map(k=>[k,category({category:k})]);
      const select=(id,label,entries,value)=>'<label>'+esc(label)+'<select id="'+id+'" data-future-filter="'+id.replace('future-','')+'"><option value="all">'+esc(t('common.all'))+'</option>'+entries.map(([k,v])=>'<option value="'+esc(k)+'" '+(value===k?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select></label>';
      const coverage=data.coverage,client=coverage.client==='complete'?'future.coverageComplete':coverage.client==='unavailable'?'future.unavailable':'future.coveragePartial';
      return '<div id="future-content-root">'+heading(t('future.title'),t('future.copy'))+'<section class="future-hero"><div><p class="eyebrow">FUTURE CONTENT WATCHER</p><h4>'+t('future.hero')+'</h4><p>'+t('future.heroCopy')+'</p><div class="future-check"><span class="future-dot"></span>'+t('future.lastCheck')+': '+esc(date(data.checkedAt))+'<br>'+t('future.gameVersion')+': <strong>'+esc(data.gameVersion)+'</strong></div></div><div class="future-level"><span>'+t('future.cap')+'</span><strong data-future-metric="maxLevel">'+esc(num(summary.maxLevel))+'</strong><small>'+t('future.apiSetting')+'</small></div></section><section class="future-metrics" aria-label="'+esc(t('future.metrics'))+'">'+[['equipmentMaxLevel',summary.equipmentMaxLevel],['xpEntries',summary.xpEntries],['mapCount',summary.mapCount],['dungeonCount',summary.dungeonCount],['maxTier',summary.maxTier],['recent',recent.length]].map(([key,value])=>'<article><span>'+esc(t('future.'+key))+'</span><strong data-future-metric="'+key+'">'+esc(num(value))+'</strong></article>').join('')+'</section><div class="future-evidence-note"><strong>'+t('future.levelEvidence')+'</strong><p>'+t(data.events.some(x=>x.kind==='limit-raised')?'future.levelRaised':'future.levelNotRaised')+'</p></div><div class="future-section-summary"><article><span>'+status('announced')+'</span><strong>'+esc(num(announced.length))+'</strong><p>'+t(announced.length?'future.announcedCopy':'future.noAnnouncement')+'</p></article><article><span>'+t('future.preparedPublic')+'</span><strong>'+esc(num(prepared.length))+'</strong><p>'+t('future.preparedCopy')+'</p></article></div><details class="future-coverage"><summary>'+t('future.coverage')+'</summary><p>'+esc(t('future.coverageLine',{client:t(client),hu:t(coverage.locales.hu==='checked'?'future.checked':'future.unavailable'),en:t(coverage.locales.en==='checked'?'future.checked':'future.unavailable')}))+'</p><p>'+t('future.coverageWarning')+'</p><a href="data/future-content.json" target="_blank" rel="noopener">'+t('future.log')+'</a></details><section class="future-controls"><div class="future-view-tabs" aria-label="'+esc(t('future.views'))+'">'+['signals','history','all'].map(key=>'<button type="button" data-future-view="'+key+'" aria-pressed="'+(filters.view===key)+'">'+t('future.'+key)+'</button>').join('')+'</div><div class="future-filter-row">'+select('future-category',t('future.category'),options,filters.category)+select('future-status',t('future.confidence'),statuses.map(id=>[id,status(id)]),filters.status)+'<label>'+t('future.search')+'<input type="search" id="future-query" data-future-filter="query" value="'+esc(filters.query)+'" placeholder="'+esc(t('future.searchPlaceholder'))+'"></label></div></section><div id="future-results">'+results()+'</div></div>';
    }
    function update(){const target=document.querySelector('#future-results');if(target){target.innerHTML=results();bindImages();}}
    function bindImages(){for(const image of document.querySelectorAll('#future-results img'))image.addEventListener('error',()=>{image.hidden=true;image.parentElement.classList.add('image-unavailable');},{once:true});}
    function bind(){const root=document.querySelector('#future-content-root');if(!root||root.dataset.bound)return;root.dataset.bound='true';root.addEventListener('input',event=>{const key=event.target.dataset.futureFilter;if(key){filters[key]=event.target.value;update();}});root.addEventListener('click',event=>{const button=event.target.closest('[data-future-view]');if(button){filters.view=button.dataset.futureView;root.querySelectorAll('[data-future-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===button)));update();}});bindImages();}
    return {page,async afterRender(currentPage){if(currentPage!=='upcoming')return;bind();try{const url=location.hostname==='legivok2.github.io'?'https://raw.githubusercontent.com/Legivok2/stonestorm-atlas/main/data/future-content.json':new URL('data/future-content.json',document.baseURI);const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('HTTP '+r.status);const next=await r.json();if(next.baselineArchive){next.baselineSummary={count:next.baselineArchive.count};delete next.baselineArchive;}if(next.schema!==2)throw Error('Unknown watcher schema');const changed=next.checkedAt!==data?.checkedAt;data=next;if(changed&&document.querySelector('#future-content-root')){const old=document.querySelector('#future-content-root'),open=[...old.querySelectorAll('details')].map(x=>x.open);old.outerHTML=page();bind();document.querySelectorAll('#future-content-root details').forEach((x,i)=>{x.open=!!open[i];});}}catch(error){console.warn('Future Content status fetch failed:',error);const root=document.querySelector('#future-content-root');if(root&&!root.querySelector('.future-fetch-note'))root.insertAdjacentHTML('beforeend','<p class="future-fetch-note atlas-notice">'+esc(t('future.fetchError'))+'</p>');}}};
  }
};
