/* One controller for all supported surfaces. Native nodes stay under React's
 * original parents. Only explicit preview navigation clicks a native tab. */
(() => {
  'use strict';
  if(window.top!==window||globalThis.StonestormEnhancedUI)return;
  const C=globalThis.StonestormEnhancedConfig,profiles=C.profiles,selector=profiles.map(p=>p.selector).join(','),records=new Map(),subscribers=new Set();
  const preferences=globalThis.StonestormCompanionState.shared(chrome.storage),explicit=new Set();
  let development=false;
  const enabled=id=>development&&explicit.has(id)&&settings.screens[id]===true;
  let settings=C.clean(null),revision=0,discoveryQueued=false,settingsShadow=null;
  const pendingDiscovery=new Set(),pendingRecords=new Set(),stats={discoveryScans:0,refreshes:0,snapshotReads:0,scopedObservers:0};
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const owned='[data-ssa-enhanced-owned]';
  const isOwned=n=>(n.nodeType===1?n:n.parentElement)?.closest?.(owned);
  const visible=n=>!!n&&!n.hidden&&!n.closest('[hidden],[aria-hidden="true"]');
  const eligible=p=>!p.path||location.pathname.replace(/\/$/,'')===p.path;
  function flag(node,name,value){if(node&&node.classList.contains(name)!==value)node.classList.toggle(name,value);}
  function text(node,limit=6000){
    if(!node)return '';
    const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT),lines=[];let size=0;
    while(walker.nextNode()){
      const el=walker.currentNode.parentElement;
      if(el?.closest('button,select,textarea,svg,script,style,[hidden],[aria-hidden="true"],'+owned))continue;
      const line=walker.currentNode.textContent.replace(/\s+/g,' ').trim();
      if(line){lines.push(line.slice(0,300));size+=line.length;}
      if(size>=limit||lines.length>=100)break;
    }
    return lines.join('\n');
  }
  function imageURL(node){
    const img=node.querySelector('img');if(!img)return null;
    try{const u=new URL(img.currentSrc||img.src,location.href);return u.origin===location.origin&&u.protocol==='https:'&&u.pathname.startsWith('/art/')&&!u.search&&!u.hash?u.href:null;}catch{return null;}
  }
  function snapshot(panel,p){
    stats.snapshotReads++;
    const allCards=p.cards?[...panel.querySelectorAll(p.cards)].filter(n=>!n.parentElement?.closest(p.cards)):[],cards=allCards.slice(0,40);
    const blocks=cards.map(card=>{
      const title=card.querySelector('h3,h4,.shop-row__name,.alch-bottle__name,.auc-card__name,.mkt-block__title')?.textContent.trim()||'';
      const prices=[...card.querySelectorAll('.alch-price,.price,.mkt-price,.shop-row__buy')].map(n=>n.textContent.replace(/\s+/g,' ').trim()).filter(s=>/\d/.test(s)).slice(0,2);
      return {title:title.slice(0,160),text:text(card,1800),prices,image:imageURL(card)};
    });
    return {text:text(panel),blocks,limited:allCards.length>40};
  }
  function notify(){for(const fn of subscribers)fn();}
  function persist(){
    const patch={[C.key]:settings,ssaHomeExpanded:settings.screens.home,ssaMiningMultiPanel:settings.screens.mining};
    try{chrome.storage.local.set(patch,()=>void chrome.runtime?.lastError);}catch{/* Visual state remains usable without storage. */}
  }
  function set(id,on){if(!development||!profiles.some(p=>p.id===id))return;on?explicit.add(id):explicit.delete(id);settings=C.clean(settings);settings.screens[id]=on===true;revision++;for(const r of records.values())if(r.p.id===id)refresh(r);notify();persist();}
  function allOff(){settings=C.clean({screens:Object.fromEntries(profiles.map(p=>[p.id,false]))});revision++;for(const r of records.values())refresh(r);notify();persist();}
  function button(label,action){const n=document.createElement('button');n.type='button';n.textContent=label;n.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();action();});return n;}
  function svg(){const n=document.createElementNS('http://www.w3.org/2000/svg','svg');n.setAttribute('viewBox','0 0 24 24');n.setAttribute('aria-hidden','true');for(const [name,d] of [['expand','M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5'],['restore','M8 3v5H3M16 3v5h5M21 16h-5v5M8 21v-5H3']]){const path=document.createElementNS(n.namespaceURI,'path');path.setAttribute('d',d);path.setAttribute('class','ssa-home-icon-'+name);n.append(path);}return n;}
  function style(r,node,key,value){
    let keys=r.styles.get(node);if(!keys){keys=new Map();r.styles.set(node,keys);r.styleAttributes.set(node,node.hasAttribute('style'));}if(!keys.has(key))keys.set(key,{value:node.style.getPropertyValue(key),priority:node.style.getPropertyPriority(key)});
    if(node.style.getPropertyValue(key)!==value)node.style.setProperty(key,value);
  }
  function restoreStyleNode(r,node){const keys=r.styles.get(node);if(!keys)return;for(const [key,prior] of keys)prior.value?node.style.setProperty(key,prior.value,prior.priority):node.style.removeProperty(key);if(!r.styleAttributes.get(node)&&!node.style.length)node.removeAttribute('style');r.styles.delete(node);}
  function restoreStyles(r){for(const node of r.styles.keys())restoreStyleNode(r,node);}
  function observe(r,on){
    if(on&&!r.observer){r.observer=new MutationObserver(m=>{if(m.some(x=>!isOwned(x.target)))schedule(r);});r.observer.observe(r.root,{subtree:true,childList:true,characterData:r.p.kind==='hybrid',attributes:true,attributeFilter:['aria-selected','aria-labelledby','disabled','class','hidden','data-tut-screen','data-fish-action','aria-checked']});r.root.addEventListener('change',r.onChange);stats.scopedObservers++;}
    if(!on&&r.observer){r.observer.disconnect();r.observer=null;r.root.removeEventListener('change',r.onChange);stats.scopedObservers--;}
  }
  function create(root,p){
    if(!visible(root))return null;
    const modal=p.kind==='home'||p.kind==='hybrid'||p.kind==='stable'?root.parentElement:null;
    if(modal&&!modal.matches('.modal.npc-modal.npc-modal--scene'))return null;
    const win=p.window?root.querySelector(p.window):root;if(!win)return null;
    const r={root,p,modal,win,observer:null,styles:new Map(),styleAttributes:new WeakMap(),previews:new Map(),cache:new Map(),nativePanel:null,snapshotDirty:true};
    const control=button('',()=>set(p.id,!enabled(p.id)));control.className='ssa-ui-toggle'+(p.kind==='home'?' ssa-home-toggle':'');control.dataset.ssaEnhancedOwned='toggle';
    const label=document.createElement('span');label.className=p.kind==='home'?'ssa-home-toggle-label':'ssa-ui-toggle-label';control.append(svg(),label);r.control=control;r.label=label;
    if(p.kind==='mining'||p.kind==='fishing'){
      const toolbar=document.createElement('div');toolbar.className=p.kind==='mining'?'ssa-mining-toolbar':'ssa-ui-fishing-tools';toolbar.dataset.ssaEnhancedOwned='toolbar';toolbar.append(control);r.toolbar=toolbar;
      if(p.kind==='mining'){control.classList.add('ssa-mining-toggle');toolbar.dataset.ssaMiningOwned='toolbar';}
      else{
        const wide=button('Széles mód',()=>{settings.fishing.wide=!settings.fishing.wide;revision++;refresh(r);notify();persist();});wide.dataset.ssaFishingWidth='';
        const collapse=button('Összecsukás',()=>{settings.fishing.collapsed=!settings.fishing.collapsed;revision++;refresh(r);notify();persist();});collapse.dataset.ssaFishingCollapse='';toolbar.append(wide,collapse);r.wide=wide;r.collapse=collapse;
      }
    }
    r.onChange=()=>schedule(r);
    records.set(root,r);refresh(r);return r;
  }
  function attachControl(r){
    const {p,root,win}=r;
    if(p.kind==='mining'){if(r.toolbar.parentElement!==root)root.append(r.toolbar);}
    else if(p.kind==='fishing'){if(r.toolbar.parentElement!==win)win.append(r.toolbar);}
    else if(r.control.parentElement!==root){const close=[...root.children].find(n=>n.matches('.modal__close'));root.insertBefore(r.control,close??root.firstChild);}
  }
  function activeTab(r){
    const {p,win}=r,list=win.querySelector(p.tablist);if(!list)return null;
    const buttons=[...list.querySelectorAll('button[role="tab"],button[data-mine-tab]')],active=buttons.find(b=>b.getAttribute('aria-selected')==='true');if(!active)return null;
    const tab=p.tabs.find(t=>p.tabAttribute?active.getAttribute(p.tabAttribute)===t.key:active.id.endsWith('-tab-'+t.key));return tab?{tab,button:active}:null;
  }
  function nativeTab(r,key){const list=r.win.querySelector(r.p.tablist);return [...list?.querySelectorAll('button[role="tab"],button[data-mine-tab]')??[]].find(b=>r.p.tabAttribute?b.getAttribute(r.p.tabAttribute)===key:b.id.endsWith('-tab-'+key));}
  function preview(r,t){
    let v=r.previews.get(t.key);if(v)return v;
    const panel=document.createElement('section');panel.className='ssa-ui-preview';panel.dataset.ssaEnhancedOwned='preview';panel.dataset.ssaPreview=t.key;
    panel.setAttribute('aria-label',t.name+' – megfigyelt előnézet');
    const head=document.createElement('header'),title=document.createElement('h3'),status=document.createElement('p'),body=document.createElement('div');title.textContent=t.name;
    const open=button('Megnyitás',()=>{const b=nativeTab(r,t.key);if(b&&!b.disabled)b.click();});open.title=t.name+' – eredeti interaktív fül';
    status.className='ssa-ui-preview-status';body.className='ssa-ui-preview-body';head.append(title,open);panel.append(head,status,body);
    v={panel,head,status,body,open,fingerprint:''};r.previews.set(t.key,v);return v;
  }
  function renderPreview(v,seen){
    const status=seen?'Előnézet · Forrás: korábban megnyitott eredeti fül · Utolsó megfigyelés: '+new Date(seen.at).toLocaleTimeString('hu-HU')+' · Nem élő állapot':'Előnézet · Még nincs megfigyelés. A Megnyitás az eredeti fülre vált.';
    if(v.status.textContent!==status)v.status.textContent=status;
    const fingerprint=JSON.stringify(seen?.data??null);if(fingerprint===v.fingerprint)return;v.fingerprint=fingerprint;
    const fragment=document.createDocumentFragment(),data=seen?.data;
    if(!data){const p=document.createElement('p');p.textContent='Ehhez a fülhöz még nincs megfigyelt adat.';fragment.append(p);}
    else{
      if(data.limited){const note=document.createElement('p');note.textContent='Az előnézet az első 40 megfigyelt kártyát mutatja. A teljes lista az eredeti fülön érhető el.';fragment.append(note);}
      const blocks=data.blocks.length?data.blocks:[{title:'',text:data.text,prices:[]}];
      for(const b of blocks){const article=document.createElement('article');article.className='ssa-ui-readonly-card';if(b.image){const img=document.createElement('img');img.src=b.image;img.alt='';img.loading='lazy';article.append(img);}if(b.title){const h=document.createElement('h4');h.textContent=b.title;article.append(h);}for(const [index,line] of b.text.split('\n').entries()){if(index===0&&b.title===line||b.prices.includes(line))continue;const p=document.createElement('p');p.textContent=line;article.append(p);}for(const price of b.prices){const p=document.createElement('p');p.className='ssa-ui-observed-price';p.textContent='Megfigyelt ár: '+price;article.append(p);}fragment.append(article);}
      if(data.blocks.length){const details=document.createElement('details'),summary=document.createElement('summary'),p=document.createElement('p');summary.textContent='A fül további megfigyelt szövege';p.className='ssa-ui-observed-text';p.textContent=data.text;details.append(summary,p);fragment.append(details);}
    }
    v.body.replaceChildren(fragment);
  }
  function hybrid(r,on){
    const {p,root,win}=r;
    const box=[...root.children].find(n=>n.matches('.npc-modal__body'));
    const native=box?.querySelector(p.panel),active=activeTab(r);
    if(r.nativePanel&&r.nativePanel!==native)flag(r.nativePanel,'ssa-ui-active-panel',false);
    r.nativePanel=native;
    if(!on||!box||!native||!active){clearLayout(r);return;}
    const source=native;
    if(source?.getAttribute('aria-labelledby')&&active.button.id&&source.getAttribute('aria-labelledby')!==active.button.id)return;
    if(source&&r.snapshotDirty){const data=snapshot(source,p);if(data.text)r.cache.set(active.tab.key,{data,at:Date.now()});r.snapshotDirty=false;}
    const width=box.clientWidth,cols=C.columns(width,p.tabs.length),rows=Math.ceil(p.tabs.length/cols);
    flag(box,'ssa-ui-hybrid-grid',true);flag(native,'ssa-ui-active-panel',true);
    style(r,native,'--ssa-ui-active-name',JSON.stringify(active.tab.name+' · Interaktív'));
    const shared=[...box.children].filter(n=>n!==native&&!n.matches(owned));shared.forEach((n,i)=>{style(r,n,'--ssa-ui-shared-row',String(i+1));flag(n,'ssa-ui-shared-row',true);});
    style(r,box,'--ssa-ui-columns',String(cols));style(r,box,'--ssa-ui-rows','repeat('+shared.length+',auto) repeat('+rows+',minmax('+(cols===1?'280px':'0')+',1fr))');
    r.sharedRows=shared.length;
    for(const [index,t] of p.tabs.entries()){
      const isActive=t.key===active.tab.key,v=isActive?null:preview(r,t),node=isActive?native:v.panel,col=index%cols+1,row=Math.floor(index/cols)+(r.sharedRows||0)+1;
      style(r,node,'--ssa-ui-column',String(col));style(r,node,'--ssa-ui-row',String(row));
      if(v){if(node.parentElement!==box)box.append(node);const original=nativeTab(r,t.key);v.open.disabled=!original||original.disabled;v.open.title=original?t.name+' – eredeti interaktív fül':'Az eredeti fül jelenleg nem érhető el.';renderPreview(v,r.cache.get(t.key));}
    }
    const wasActive=r.previews.get(active.tab.key);if(wasActive){wasActive.panel.remove();r.styles.delete(wasActive.panel);r.previews.delete(active.tab.key);}
  }
  function fishing(r,on){
    const busy=!!r.root.querySelector('.fish-fight-zone')||r.root.classList.contains('is-fishing')||[...r.root.querySelectorAll('[data-fish-action]')].some(n=>n.dataset.fishAction!=='idle');
    flag(r.root,'ssa-ui-fishing',on&&!busy);flag(r.root,'ssa-ui-fishing-wide',on&&!busy&&settings.fishing.wide);flag(r.root,'ssa-ui-fishing-folded',on&&!busy&&settings.fishing.collapsed);flag(r.root,'ssa-ui-fishing-busy',on&&busy);
    r.wide.hidden=!on||busy;r.collapse.hidden=!on||busy;
    const wideLabel=settings.fishing.wide?'Keskeny mód':'Széles mód',foldLabel=settings.fishing.collapsed?'Visszanyitás':'Összecsukás';
    if(r.wide.textContent!==wideLabel)r.wide.textContent=wideLabel;if(r.collapse.textContent!==foldLabel)r.collapse.textContent=foldLabel;
    r.wide.setAttribute('aria-pressed',String(settings.fishing.wide));r.collapse.setAttribute('aria-pressed',String(settings.fishing.collapsed));
    if(on&&!busy&&settings.fishing.collapsed){
      const body=r.win.querySelector(r.p.panel),selected=r.root.querySelector('[data-fish-spot][aria-checked="true"]'),bait=r.root.querySelector('.fish-action__bait-text'),daily=r.root.querySelector('.fish-catches');
      const summary=[selected&&'Vízterület: '+selected.textContent.trim(),bait&&'Csali: '+bait.textContent.trim(),daily?.textContent.trim()].filter(Boolean).join(' · ');
      if(body&&summary){if(!r.summary){r.summary=document.createElement('p');r.summary.dataset.ssaEnhancedOwned='fishing-summary';r.summary.className='ssa-ui-fishing-summary';}if(r.summary.textContent!==summary)r.summary.textContent=summary;if(r.summary.parentElement!==body)body.prepend(r.summary);}
      if(!r.wasFolded&&body)body.scrollTop=0;
    }else r.summary?.remove();
    r.wasFolded=on&&!busy&&settings.fishing.collapsed;
    if(on&&!busy&&(!r.fishingWasOn||r.fishingWasBusy)){const body=r.win.querySelector(r.p.panel);if(body)body.scrollTop=0;}
    r.fishingWasOn=on;r.fishingWasBusy=busy;
    r.control.title=busy&&on?'Aktív horgászat – az eredeti elrendezés működik. Eredeti nézet visszaállítása.':r.control.title;
  }
  function clearLayout(r){
    for(const v of r.previews.values())v.panel.remove();r.previews.clear();restoreStyles(r);
    for(const n of r.root.querySelectorAll('.ssa-ui-hybrid-grid,.ssa-ui-active-panel,.ssa-ui-shared-row'))n.classList.remove('ssa-ui-hybrid-grid','ssa-ui-active-panel','ssa-ui-shared-row');
    if(r.empty){r.empty.remove();r.empty=null;}
  }
  function refresh(r){
    if(!r.root.isConnected||!visible(r.root)||!r.root.matches(r.p.selector)||!eligible(r.p)){const root=r.root;dispose(r);if(root.isConnected&&visible(root))discover(root);return;}
    if(r.p.window&&r.win!==r.root.querySelector(r.p.window)){const root=r.root,p=r.p;dispose(r);create(root,p);return;}
    for(const node of r.styles.keys())if(!node.isConnected)restoreStyleNode(r,node);
    stats.refreshes++;attachControl(r);const on=enabled(r.p.id);
    const label=on?'Eredeti nézet':r.p.kind==='mining'?'Széles nézet':'Kiterjesztett nézet';if(r.label.textContent!==label)r.label.textContent=label;
    if(r.control.getAttribute('aria-pressed')!==String(on))r.control.setAttribute('aria-pressed',String(on));r.control.title=label+' – '+r.p.name;r.control.setAttribute('aria-label',r.control.title);
    flag(r.win,'ssa-ui-window',true);flag(r.win,'ssa-ui-enabled',on);flag(r.modal,'ssa-ui-modal',on);
    if(r.p.kind==='home'){flag(r.modal,'ssa-home-host',true);flag(r.modal,'ssa-home-expanded',on);}
    if(r.p.kind==='mining'){flag(r.root,'ssa-mining-host',true);flag(r.root,'ssa-mining-wide',on);}
    if(!on&&r.p.kind!=='hybrid')clearLayout(r);
    if(r.p.kind==='hybrid')hybrid(r,on);
    if(r.p.kind==='stable'){
      flag(r.root,'ssa-ui-stable',on);
      if(on&&!r.root.querySelector('.stable-stored,.own-mounts')&&!r.empty){r.empty=document.createElement('section');r.empty.dataset.ssaEnhancedOwned='stable-empty';r.empty.className='ssa-ui-stable-empty';r.empty.textContent='Saját hátasok · A jelenlegi játékfelületen nem látható saját hátaslista.';r.root.querySelector('.npc-modal__body')?.append(r.empty);}
      if(r.empty&&r.root.querySelector('.stable-stored,.own-mounts')){r.empty.remove();r.empty=null;}
    }
    if(r.p.kind==='fishing')fishing(r,on);
    observe(r,on);
  }
  function schedule(r){if(pendingRecords.has(r))return;r.snapshotDirty=true;pendingRecords.add(r);requestAnimationFrame(()=>{pendingRecords.delete(r);if(records.get(r.root)===r)refresh(r);});}
  function dispose(r){
    observe(r,false);r.root.removeEventListener('change',r.onChange);clearLayout(r);r.control.remove();r.toolbar?.remove();
    r.summary?.remove();r.win.classList.remove('ssa-ui-window','ssa-ui-enabled');r.modal?.classList.remove('ssa-ui-modal','ssa-home-host','ssa-home-expanded');r.root.classList.remove('ssa-mining-host','ssa-mining-wide','ssa-ui-stable','ssa-ui-fishing','ssa-ui-fishing-wide','ssa-ui-fishing-folded','ssa-ui-fishing-busy');r.cache.clear();records.delete(r.root);
  }
  function discover(node=document){
    if(!development)return;
    stats.discoveryScans++;const found=[];if(node.nodeType===1&&node.matches(selector))found.push(node);if(node.querySelectorAll)found.push(...node.querySelectorAll(selector));
    for(const root of found){if(records.has(root))continue;const p=profiles.find(p=>eligible(p)&&root.matches(p.selector));if(p)create(root,p);}
    for(const r of records.values())if(!r.root.isConnected||!r.root.matches(r.p.selector)||!eligible(r.p))dispose(r);
  }
  new MutationObserver(mutations=>{
    if(!development)return;
    for(const m of mutations){if(isOwned(m.target))continue;
      if(m.type==='attributes'){
        const r=records.get(m.target);if(r)schedule(r);
        else if(m.attributeName!=='class')pendingDiscovery.add(m.target);
        else if(m.target.matches('.npc-modal__dialog,.friends-modal,.mine-safe,.fish-safe'))pendingDiscovery.add(m.target);
        if(m.attributeName==='hidden'||m.attributeName==='aria-hidden')for(const r of records.values())if(m.target.contains(r.root))schedule(r);
      }
      else{for(const n of m.addedNodes)if(n.nodeType===1&&!isOwned(n))pendingDiscovery.add(n);for(const r of records.values())if(!r.root.isConnected||r.root.contains(m.target)&&!(r.toolbar??r.control).isConnected)schedule(r);}
    }
    if(!discoveryQueued&&pendingDiscovery.size){discoveryQueued=true;requestAnimationFrame(()=>{discoveryQueued=false;const nodes=[...pendingDiscovery];pendingDiscovery.clear();for(const n of nodes)if(n.isConnected&&!isOwned(n))discover(n);});}
  }).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['data-tut-screen','class','hidden','aria-hidden']});
  const resize=()=>{for(const r of records.values())if(settings.screens[r.p.id])schedule(r);};window.addEventListener('resize',resize);window.addEventListener('popstate',()=>discover());window.addEventListener('hashchange',()=>discover());
  function attach(shadow){
    if(settingsShadow)return;settingsShadow=shadow;let panel=null,details=null,open=false;
    function render(){if(!details?.isConnected)return;for(const input of details.querySelectorAll('[data-enhanced-setting]'))input.checked=enabled(input.dataset.enhancedSetting);}
    function mount(){const next=shadow.querySelector('.panel');if(next===panel)return;panel=next;if(!panel)return;details=document.createElement('details');details.dataset.enhancedSettings='';details.open=open;const summary=document.createElement('summary');summary.textContent='Fejlesztés alatt · játékfelületek';const body=document.createElement('div');body.className='ssa-ui-settings';const grid=document.createElement('div');grid.className='sc-game-grid';body.append(grid);
      const descriptions={community:'A játék eredeti közösségi ablaka nagyobb méretben.',home:'A ház és a fejlődésed, egymás mellett.',mining:'Széles, eredeti aktív fül; négy egyidejű panel nem igazolt.',alchemist:'Főzetek, receptek és Viharszív.',seal:'Vásárlás, eladás és előjegyzés.',stable:'Aktív, elérhető és saját hátasok.',shop:'Négy kereskedői fül, áttekinthetően.',fishing:'Kompakt panel. Zavartalan horgászat.'};
      for(const p of profiles){const card=document.createElement('article');card.className='sc-game-card';card.append(StonestormCompanionComponents.iconNode(p.id==='home'?'overview':p.id==='fishing'?'raids':'interfaces'));const heading=document.createElement('h3'),text=document.createElement('p'),label=document.createElement('label'),input=document.createElement('input');heading.textContent=p.name;text.textContent=descriptions[p.id];input.type='checkbox';input.dataset.enhancedSetting=p.id;input.setAttribute('aria-label',p.name+' kiterjesztett nézet');label.append(document.createTextNode('Kiterjesztett nézet'),input);card.append(heading,text,label);grid.append(card);input.addEventListener('change',e=>{e.stopPropagation();set(p.id,input.checked);});}
      const off=button('Összes kiterjesztés kikapcsolása',allOff);off.dataset.enhancedOff='';const note=document.createElement('p');note.className='sc-safety';note.textContent='A hibrid nézetben csak az aktív fül interaktív. A többi korábbi, időbélyeges megfigyelés; nem élő állapot. A kapcsolók nem indítanak játékműveletet.';body.append(note,off);details.append(summary,body);const destination=shadow.querySelector('[data-companion-slot="interfaces"]');if(destination)destination.append(details);else panel.insertBefore(details,panel.querySelector('.panel-content'));details.addEventListener('toggle',()=>{open=details.open;});render();
    }
    subscribers.add(render);new MutationObserver(mount).observe(shadow,{childList:true,subtree:true});mount();
  }
  const startRevision=revision;
  try{
    chrome.storage.local.get([C.key,'ssaHomeExpanded','ssaMiningMultiPanel'],values=>{if(chrome.runtime?.lastError||revision!==startRevision)return;const legacy={home:values.ssaHomeExpanded===true};if(typeof values.ssaMiningMultiPanel==='boolean')legacy.mining=values.ssaMiningMultiPanel;settings=C.clean(values[C.key]??{screens:legacy});for(const r of records.values())refresh(r);notify();});
    chrome.storage.onChanged.addListener((changes,area)=>{if(area!=='local')return;let next;if(changes[C.key])next=C.clean(changes[C.key].newValue);else if(changes.ssaHomeExpanded||changes.ssaMiningMultiPanel){next=C.clean(settings);if(changes.ssaHomeExpanded)next.screens.home=changes.ssaHomeExpanded.newValue===true;if(changes.ssaMiningMultiPanel)next.screens.mining=changes.ssaMiningMultiPanel.newValue===true;}if(next&&!same(next,settings)){settings=next;revision++;for(const r of records.values())refresh(r);notify();}});
  }catch{/* No page-local or game-state fallback. */}
  globalThis.StonestormEnhancedUI=Object.freeze({attach,set,allOff,getSettings:()=>C.clean(settings),diagnostics:()=>({...stats,records:records.size,active:[...records.values()].map(r=>({id:r.p.id,enabled:enabled(r.p.id),previews:r.previews.size,observedTabs:r.cache.size}))})});
  preferences.subscribe(value=>{const next=value.development;if(next===development)return;development=next;explicit.clear();if(!development){for(const r of [...records.values()])dispose(r);pendingDiscovery.clear();pendingRecords.clear();}else discover();notify();});
  discover();
})();
