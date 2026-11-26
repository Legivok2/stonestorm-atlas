/* Community Hub V2: read-only, memory-only views of the game's existing DOM. */
(() => {
  'use strict';
  if (window.top !== window || globalThis.StonestormCommunityHub) return;
  const C = globalThis.StonestormCommunityHubConfig;
  const owned = '[data-ssa-community-owned]';
  const gameSurface = `${C.selectors.friendsWindow},${C.selectors.friends},${C.selectors.chat}`;
  const panels = [
    {key:'requests', name:'Barátkérelmek', match:/kérelem|kérés|request/i},
    {key:'greetings', name:'Köszöntések', match:/köszönt|üdvöz|greet/i},
    {key:'settings', name:'Beállítások', match:/beállít|adatvédelem|tilt|setting|privacy|block/i}
  ];
  let enabled = true, active = false, container = null, gridContainer = null, observer = null;
  let refreshFrame = 0, friendQuery = '', friendSort = 'name', compactFriends = false, enabledControl = null, resizeListener = null;
  let columnWidths=[28,22,50], columnDrag=null;
  const previews = new Map();
  const stats = {snapshots:0,scopedObservers:0,privateChatTextStored:0};
  const cleanText = node => (node?.textContent || '').replace(/\s+/g,' ').trim().slice(0,600);
  const normalizeWidths = widths => Array.isArray(widths)&&widths.length===3&&widths.every(value=>Number.isFinite(value)&&value>=10&&value<=80)
    ? widths.map(value=>Math.round(value*10)/10) : [28,22,50];
  function persistPreferences() {
    chrome.storage.local.set({[C.key]:{enabled,columns:columnWidths}});
  }
  const visible = node => !!node && !node.hidden && node.getAttribute('aria-hidden') !== 'true' &&
    getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden';
  function friendsWindow() {
    return [...document.querySelectorAll(C.selectors.friendsWindow)].find(visible) || null;
  }
  function snapshotFriends() {
    const hud = document.querySelector(C.selectors.friends);
    const windowNode = friendsWindow();
    const badge = hud?.querySelector('.hud-friends__badge');
    const friends = windowNode ? [...windowNode.querySelectorAll('.friends-list > .friend-row')].slice(0,100).map(row => {
      const profile = row.querySelector('.friend-row__who');
      if (!profile) return null;
      const name=cleanText(profile),status=cleanText(row.querySelector('.friend-row__status,[data-status]'));
      const details=cleanText(row).replace(name,'').replace(status,'').trim();
      return {
        profile:name,
        details,
        status
      };
    }).filter(Boolean) : [];
    return {
      available:!!(hud || windowNode),
      count:badge ? Number(String(badge.textContent).replace(/\D/g,'')) || null : friends.length || null,
      open:!!windowNode,
      friends
    };
  }
  function snapshotPanels() {
    const windowNode = friendsWindow();
    if (!windowNode) return {available:false,tabs:[],activeName:'',activeText:''};
    const tabs = [...windowNode.querySelectorAll('.friends__tabs button,.friends__tabs [role="tab"]')]
      .slice(0,20).map(node => ({
        name:cleanText(node),
        selected:node.getAttribute('aria-selected') === 'true' || node.classList.contains('active')
      })).filter(tab => tab.name);
    const activeTab = tabs.find(tab => tab.selected);
    const content = [...windowNode.querySelectorAll('.friends__panel')].find(visible);
    return {available:true,tabs,activeName:activeTab?.name || '',activeText:cleanText(content)};
  }
  function snapshotChat() {
    const node = document.querySelector(C.selectors.chat);
    if (!node || !visible(node)) return {available:!!node,open:false,messages:[],room:''};
    const list = node.querySelector('.community__scroll .chat__list,.chat__list');
    const roomControl = node.querySelector('.chat__room-select,select[name*="room" i]');
    const room = roomControl?.selectedOptions?.[0]?.textContent?.trim() || '';
    const messages = list ? [...list.querySelectorAll('li.chat-line[data-message]')].slice(-50).map(row => {
      if (row.hidden || row.getAttribute('aria-hidden') === 'true') return null;
      const author = row.querySelector('.chat-line__author');
      const content = row.querySelector('.chat-line__text:not(.chat-line__hidden)');
      const time = row.querySelector('time.chat-line__time');
      if (!author || !content || !time) return null;
      return {
        profile:cleanText(author),
        world:cleanText(row.querySelector('.community__world')),
        text:cleanText(content),
        timestamp:time.getAttribute('datetime') || null,
        timeLabel:cleanText(time)
      };
    }).filter(Boolean) : [];
    stats.privateChatTextStored = 0;
    return {available:true,open:true,messages,room};
  }
  function snapshot(key) {
    stats.snapshots++;
    return key === 'friends' ? snapshotFriends() : key === 'panels' ? snapshotPanels() : snapshotChat();
  }
  function refreshSnapshots() {
    if (!enabled || !active) return;
    let changed=false;
    for (const tab of C.tabs) {
      const data=snapshot(tab.key);
      if(JSON.stringify(previews.get(tab.key))!==JSON.stringify(data)){previews.set(tab.key,data);changed=true;}
    }
    if(changed)render();
  }
  function affectsGameSurface(record) {
    const target=record.target.nodeType===1?record.target:record.target.parentElement;
    if(target?.closest(gameSurface))return true;
    return [...record.addedNodes,...record.removedNodes].some(node=>node.nodeType===1&&(node.matches(gameSurface)||node.querySelector(gameSurface)));
  }
  function observe() {
    if (!enabled || !active || observer) return;
    observer = new MutationObserver(records=>{
      if(!records.some(affectsGameSurface)||refreshFrame)return;
      refreshFrame=requestAnimationFrame(()=>{refreshFrame=0;refreshSnapshots();});
    });
    observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','aria-hidden','class','aria-selected']});
    stats.scopedObservers++;
  }
  function stop() {
    observer?.disconnect();
    if (observer) stats.scopedObservers--;
    observer = null;
    if (refreshFrame) cancelAnimationFrame(refreshFrame);
    refreshFrame = 0;
  }
  function status(text) {
    const node = document.createElement('p');
    node.className = 'sc-community-status';
    node.textContent = text;
    return node;
  }
  function renderFriends(card,data) {
    if (!data?.open) {
      card.append(status(data?.available ? 'Barátjelző megfigyelhető; a játék barátlistája nincs megnyitva.' : 'Nincs megfigyelhető barátablak.'));
      return;
    }
    card.append(status(`${data.friends.length} megfigyelt barátkártya · csak olvasható előnézet.`));
    const controls = document.createElement('div');
    controls.className = 'sc-community-friend-controls';
    const search = document.createElement('input');
    search.type = 'search';search.className = 'sc-community-search';search.placeholder = 'Barát keresése';
    search.setAttribute('aria-label','Barát keresése a megfigyelt listában');search.value = friendQuery;
    search.addEventListener('input',() => {
      friendQuery = search.value;
      const selection = [search.selectionStart,search.selectionEnd];
      render();
      const next = container.querySelector('.sc-community-search');
      next?.focus();
      if (next && selection.every(Number.isInteger)) next.setSelectionRange(selection[0],selection[1]);
    });
    const sort = document.createElement('select');
    sort.setAttribute('aria-label','Barátlista rendezése');
    for (const [value,label] of [['name','Név szerint'],['original','Játék szerinti sorrend']]) {
      const option=document.createElement('option');option.value=value;option.textContent=label;sort.append(option);
    }
    sort.value=friendSort;
    sort.addEventListener('change',() => {friendSort=sort.value;render();});
    const density = document.createElement('button');
    density.type='button';density.textContent=compactFriends?'Normál kártyák':'Kompakt kártyák';
    density.setAttribute('aria-pressed',String(compactFriends));
    density.addEventListener('click',() => {compactFriends=!compactFriends;render();});
    controls.append(search,sort,density);card.append(controls);
    const list=document.createElement('ul');
    list.className='sc-community-observations sc-community-friends';
    list.dataset.communityScroll='friends';
    if(compactFriends)list.classList.add('is-compact');
    const query=friendQuery.trim().toLocaleLowerCase();
    const matches=data.friends.filter(friend => `${friend.profile} ${friend.details}`.toLocaleLowerCase().includes(query));
    if(friendSort==='name')matches.sort((a,b)=>a.profile.localeCompare(b.profile,'hu'));
    for(const friend of matches){
      const item=document.createElement('li');item.className='sc-community-friend';
      const name=document.createElement('strong');name.textContent=friend.profile;
      const details=document.createElement('span');details.textContent=friend.details===friend.profile?'A játékban látható további adatok nem érhetők el.':friend.details;
      item.append(name,details);
      if(friend.status){const state=document.createElement('small');state.textContent=friend.status;item.append(state);}
      list.append(item);
    }
    if(!matches.length){const empty=document.createElement('li');empty.textContent='Nincs találat a jelenleg megfigyelt barátlistában.';list.append(empty);}
    card.append(list);
  }
  function renderPanels(card,data) {
    if(!data?.available)card.append(status('A játék Közösség ablaka nincs megnyitva; a nem aktív React-panelek nem klónozhatók biztonságosan.'));
    else card.append(status(data.tabs.length?'A fülek neve és kijelölt állapota megfigyelhető; csak az eredeti játékfül interaktív.':'A Közösség ablak látható, de a fülek nem azonosíthatók.'));
    for(const section of panels){
      const detail=document.createElement('details');
      detail.className='sc-community-fold';
      const summary=document.createElement('summary');summary.textContent=section.name;
      const tab=data?.tabs?.find(item=>section.match.test(item.name));
      const body=document.createElement('div');body.className='sc-community-fold-body';
      if(!tab)body.append(status('Ehhez a funkcióhoz nincs felismerhető, aktív játékfül.'));
      else if(tab.selected&&data.activeText){body.append(status('A valódi játékfül tartalma megfigyelhető; a Companion nem hajt végre benne műveletet.'));const text=document.createElement('p');text.className='sc-community-observed-text';text.textContent=data.activeText;body.append(text);}
      else body.append(status('A fül nem aktív; annak tartalmát a React nem rendereli. Nyisd meg az eredeti játékablakban a tényleges műveletekhez.'));
      detail.append(summary,body);card.append(detail);
    }
  }
  function renderChat(card,data) {
    if(!data?.available||!data.open){card.append(status('A közösségi chat nincs megnyitva a játékban.'));return;}
    card.append(status(data.messages.length?'Élő, megfigyelt üzenetek · csak olvasható előnézet.':'A közösségi chat nyitva van, de jelenleg nincs látható üzenet.'));
    if(data.room){const room=document.createElement('p');room.className='sc-community-room';room.textContent='Játékszoba: '+data.room;card.append(room);}
    const list=document.createElement('div');
    list.className='sc-community-messages';list.setAttribute('aria-label','Megfigyelt közösségi chatüzenetek');list.dataset.communityScroll='chat';
    for(const message of data.messages){
      const row=document.createElement('article');row.className='sc-community-message';
      const byline=document.createElement('div');byline.className='sc-community-byline';
      const profile=document.createElement('span');profile.className='sc-community-profile';profile.textContent=message.profile;
      const time=document.createElement('time');time.textContent=message.timeLabel;if(message.timestamp)time.dateTime=message.timestamp;
      byline.append(profile,time);
      if(message.world){const world=document.createElement('small');world.textContent=message.world;byline.append(world);}
      const text=document.createElement('p');text.textContent=message.text;row.append(byline,text);list.append(row);
    }
    card.append(list);
    const note=status('Az üzenetküldés, jelentés, tiltás és profilnavigáció az eredeti játékvezérlőben marad.');
    note.classList.add('sc-community-privacy');card.append(note);
  }
  function renderCard(key,data) {
    const card=document.createElement('article');card.className=`sc-community-card sc-community-${key}`;
    card.dataset.ssaCommunityOwned='card';
    const title=document.createElement('h3');title.textContent=C.tabs.find(tab=>tab.key===key)?.name||key;card.append(title);
    if(!enabled){card.append(status('A Community Hub V2 megfigyelése kikapcsolva.'));return card;}
    if(key==='friends')renderFriends(card,data);
    else if(key==='panels')renderPanels(card,data);
    else renderChat(card,data);
    return card;
  }
  function resizeHandle(index) {
    const handle=document.createElement('button');
    handle.type='button';handle.className='sc-community-resizer';handle.dataset.communityResize=String(index);
    handle.setAttribute('role','separator');handle.setAttribute('aria-orientation','vertical');
    handle.setAttribute('aria-label',`Közösségi oszlopok ${index+1} és ${index+2} közötti méretezése`);
    handle.setAttribute('aria-valuenow',String(Math.round(columnWidths[index]/(columnWidths[index]+columnWidths[index+1])*100)));
    handle.title='Húzd az oszlopok méretezéséhez; billentyűzettel nyilak';
    handle.addEventListener('pointerdown',event=>{
      if(event.button!==0)return;
      columnDrag={index,startX:event.clientX,widths:[...columnWidths],gridWidth:gridContainer.clientWidth};
      handle.setPointerCapture(event.pointerId);event.preventDefault();
    });
    handle.addEventListener('pointermove',event=>{
      if(!columnDrag)return;
      const {index:which,startX,widths,gridWidth}=columnDrag;
      if(which!==index||!gridWidth)return;
      const left=index,right=index+1,sum=widths[left]+widths[right];
      const minLeft=left===0?18:16,minRight=right===2?24:16;
      const next=Math.max(minLeft,Math.min(sum-minRight,widths[left]+(event.clientX-startX)/gridWidth*100));
      columnWidths[left]=Math.round(next*10)/10;columnWidths[right]=Math.round((sum-next)*10)/10;
      applyColumnWidths();
    });
    const finish=()=>{if(!columnDrag)return;columnDrag=null;persistPreferences();};
    handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
    handle.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
      event.preventDefault();
      const left=index,right=index+1,pair=columnWidths[left]+columnWidths[right],step=event.shiftKey?2:1;
      const next=Math.max(left===0?18:16,Math.min(pair-(right===2?24:16),columnWidths[left]+(event.key==='ArrowRight'?step:-step)));
      columnWidths[left]=next;columnWidths[right]=pair-next;applyColumnWidths();persistPreferences();
    });
    return handle;
  }
  function applyColumnWidths() {
    if(!gridContainer)return;
    const narrow=gridContainer.clientWidth<=850;
    gridContainer.style.gridTemplateColumns=narrow?'minmax(0,1fr)':`minmax(0,${columnWidths[0]}fr) 8px minmax(0,${columnWidths[1]}fr) 8px minmax(0,${columnWidths[2]}fr)`;
    for(const handle of gridContainer.querySelectorAll('[data-community-resize]'))handle.hidden=narrow;
    for(const handle of gridContainer.querySelectorAll('[data-community-resize]')){
      const index=Number(handle.dataset.communityResize);
      handle.setAttribute('aria-valuenow',String(Math.round(columnWidths[index]/(columnWidths[index]+columnWidths[index+1])*100)));
    }
  }
  function render() {
    if(!container)return;
    const oldSearch=container.querySelector('.sc-community-search');
    const restoreSearchFocus=oldSearch===document.activeElement;
    const selection=restoreSearchFocus?[oldSearch.selectionStart,oldSearch.selectionEnd]:null;
    const scrolls=new Map([...container.querySelectorAll('[data-community-scroll]')].map(node=>[
      node.dataset.communityScroll,
      {top:node.scrollTop,bottom:node.scrollHeight-node.clientHeight-node.scrollTop<=24}
    ]));
    gridContainer?.remove();
    const grid=document.createElement('div');grid.className='sc-community-grid';grid.dataset.ssaCommunityOwned='grid';
    for(const [index,tab] of C.tabs.entries()){
      const data=previews.has(tab.key)?previews.get(tab.key):enabled&&active?snapshot(tab.key):null;
      if(enabled&&active&&!previews.has(tab.key))previews.set(tab.key,data);
      grid.append(renderCard(tab.key,data));
      if(index<2)grid.append(resizeHandle(index));
    }
    gridContainer=grid;container.append(gridContainer);applyColumnWidths();
    for(const node of grid.querySelectorAll('[data-community-scroll]')){
      const previous=scrolls.get(node.dataset.communityScroll);
      if(previous){node.scrollTop=previous.bottom?node.scrollHeight:previous.top;}
      else if(node.dataset.communityScroll==='chat')node.scrollTop=node.scrollHeight;
    }
    if(restoreSearchFocus){
      const search=container.querySelector('.sc-community-search');search?.focus();
      if(search&&selection?.every(Number.isInteger))search.setSelectionRange(selection[0],selection[1]);
    }
  }
  function setEnabled(value) {
    enabled=value===true;
    persistPreferences();
    if(enabledControl)enabledControl.checked=enabled;
    if(!enabled){stop();previews.clear();}else observe();
    render();
  }
  function attach(shadow) {
    container=shadow.querySelector('[data-companion-slot="community"]');
    if(!container)return;
    container.querySelectorAll(owned).forEach(node=>node.remove());
    const heading=document.createElement('section');heading.className='sc-community-panel';heading.dataset.ssaCommunityOwned='panel';
    const safety=document.createElement('p');safety.className='sc-safety';
    safety.textContent='Csak olvasható, helyi előnézet. Nincs automatikus üzenetküldés, barátművelet vagy játékállapot-módosítás; a React-elemeket nem klónozzuk.';
    const controls=document.createElement('label');controls.className='sc-community-toggle';
    enabledControl=document.createElement('input');enabledControl.type='checkbox';enabledControl.checked=enabled;
    enabledControl.setAttribute('aria-label','Community Hub megfigyelése');
    enabledControl.addEventListener('change',()=>setEnabled(enabledControl.checked));
    controls.append(enabledControl,document.createTextNode(' Community Hub V2 megfigyelése'));
    heading.append(safety,controls);container.append(heading);gridContainer=null;
    if(resizeListener)window.removeEventListener('resize',resizeListener);
    resizeListener=()=>applyColumnWidths();
    window.addEventListener('resize',resizeListener,{passive:true});
    chrome.storage.local.get(C.key,values=>{
      enabled=values?.[C.key]?.enabled!==false;
      columnWidths=normalizeWidths(values?.[C.key]?.columns);
      if(enabledControl)enabledControl.checked=enabled;
      if(!enabled){stop();previews.clear();}else observe();
      render();
    });
    active=false;render();
  }
  globalThis.StonestormCompanionEvents?.on('tab',id=>{
    active=id==='community';
    if(active){observe();refreshSnapshots();}else stop();
    if(!active)previews.clear();
    if(active)render();
  });
  globalThis.StonestormCompanionEvents?.on('community-layout',()=>requestAnimationFrame(applyColumnWidths));
  globalThis.StonestormCompanionEvents?.on('close',()=>{stop();active=false;previews.clear();render();});
  globalThis.StonestormCommunityHub=Object.freeze({
    attach,setEnabled,
    setActive(value){active=value===true;value?(observe(),refreshSnapshots()):(stop(),previews.clear());},
    diagnostics:()=>({...stats,enabled,active,cachedTabs:previews.size}),
    dispose(){stop();active=false;previews.clear();if(resizeListener)window.removeEventListener('resize',resizeListener);resizeListener=null;container=null;gridContainer=null;enabledControl=null;}
  });
})();
