(() => {
  'use strict';
  if(window.top!==window)return;
  const model=globalThis.STONESTORM_PET_MODEL,logic=globalThis.StonestormPetDetails;
  const sources=globalThis.StonestormPetSources.create(model);
  let config=model.config,liveVersion=null,serverOffset=0,anchor=null,hideTimer=null,originalDescription=null;
  const publishDiagnostics=()=>window.dispatchEvent(new Event('ss-addon-pet-diagnostics'));
  globalThis.StonestormPetTooltip=Object.freeze({diagnostics:()=>sources.diagnostics(config,Date.now()+serverOffset)});
  const host=document.createElement('div');host.id='ss-atlas-pet-tooltip';document.documentElement.append(host);
  const shadow=host.attachShadow({mode:'closed'}),style=document.createElement('style');globalThis.StonestormI18n?.observe(shadow);
  style.textContent=(globalThis.STONESTORM_COMPANION_TOKENS??'')+':host{position:fixed;z-index:2147483647;display:none;width:min(370px,calc(100vw - 24px));color:#ece8d7;font:13px/1.5 system-ui}*{box-sizing:border-box}article{max-height:calc(100vh - 24px);overflow:auto;padding:0;border:1px solid #a28a55;border-radius:14px;background:linear-gradient(145deg,#263a2d,#122622);box-shadow:0 14px 45px #000b}header{display:flex;gap:12px;align-items:center;padding:17px;background:#80915712;border-bottom:1px solid #bdab652d}.sc-pet-portrait{display:grid;place-items:center;width:66px;height:66px;flex:none;border:1px solid #9c8956;border-radius:12px;background:radial-gradient(#6d794052,#183025);overflow:hidden}.sc-pet-portrait img{width:100%;height:100%;object-fit:contain}.sc-crest{width:48px;height:50px;fill:#2c4230;stroke:#d4b77a}.sc-crest-stone{fill:#d4b77a}h3{font:500 23px/1.15 Georgia,serif;color:#efdcae;margin:0 0 5px}header p{color:#bdcdb0;font-size:11px;margin:4px 0}.sc-pet-section{padding:12px 17px;border-bottom:1px solid #61704744}.sc-pet-section:first-of-type{background:#6b7f3d17}h4{font:500 17px Georgia,serif;color:#d9c38c;margin:0 0 7px}p{margin:6px 0;overflow-wrap:anywhere;font-size:12px;line-height:1.55}.sc-pet-section:first-of-type p{color:#dce6bf}details{padding:9px 17px;color:#b6c8ab;font-size:10px}summary{cursor:pointer;padding:5px 0}small{font-size:10px;color:#aebfa4}summary:focus-visible{outline:2px solid #e7ce8d;outline-offset:2px}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}';
  const card=document.createElement('article');card.id='ss-atlas-pet-description';card.role='tooltip';shadow.append(style,card);
  const targets='.pet-row__art,.pet-row__name,.pet-main__art,.pet-main__name';
  function hide(){clearTimeout(hideTimer);if(anchor){if(originalDescription===null)anchor.removeAttribute('aria-description');else anchor.setAttribute('aria-description',originalDescription);}anchor=null;host.style.display='none';}
  function show(target){
    clearTimeout(hideTimer);if(anchor!==target){hide();originalDescription=target.getAttribute('aria-description');}anchor=target;
    const match=sources.identify(target),data=logic.describe(match.instance,model,config,Date.now()+serverOffset,match.observed);
    card.replaceChildren();const header=document.createElement('header'),portrait=document.createElement('div'),copy=document.createElement('div');portrait.className='sc-pet-portrait';const sourceImage=target.closest('.pet-row,.pet-main')?.querySelector('img');let source=null;try{const u=new URL(sourceImage?.currentSrc||sourceImage?.src||'',location.href);if(u.origin===location.origin&&u.protocol==='https:'&&u.pathname.startsWith('/art/')&&!u.search&&!u.hash)source=u.href;}catch{}
    if(source){const img=document.createElement('img');img.src=source;img.alt='';portrait.append(img);}else portrait.innerHTML=globalThis.StonestormCompanionComponents?.crest??'';
    const heading=document.createElement('h3');heading.textContent=data.name;const meta=document.createElement('p');meta.textContent=data.rarity+' · '+(data.level===null||data.level===undefined?'Szint még nem ismert':data.level+'. szint')+' · '+data.formName;copy.append(heading,meta);header.append(portrait,copy);card.append(header);
    for(const section of data.sections){const box=document.createElement('section');box.className='sc-pet-section';const h=document.createElement('h4');h.textContent=section.title;box.append(h);for(const text of section.items){const p=document.createElement('p');p.textContent=text;box.append(p);}card.append(box);}
    const details=document.createElement('details'),summary=document.createElement('summary'),provenance=document.createElement('small');summary.textContent='Forrás és értelmezés';provenance.textContent='Játékadat: '+(liveVersion??model.gameVersion)+(liveVersion?' · megfigyelt konfiguráció.':' · csomagolt forrás.')+' A feltételes hatások kliensképletből származnak; nem szerveres végösszeg.'+(!model.evidence.entrypointConfirmed?' Az aktuális kliensbelépő még ellenőrzésre vár.':'');if(globalThis.StonestormCompanionState?.shared(chrome.storage).get().development!==true)provenance.textContent='A feltételes hatások kliensképletből számított értékek; nem szerveres végösszegek.';details.append(summary,provenance);card.append(details);
    // A hozzáférhető szöveg az anchor aria-description mezőjében is szerepel: zárt shadow-n át is olvasható.
    target.setAttribute('aria-description',[meta.textContent,...data.sections.map(s=>s.title+': '+s.items.join(' '))].join('\n'));
    host.style.display='block';const rect=target.getBoundingClientRect(),width=host.getBoundingClientRect().width;
    const right=rect.right+10,left=rect.left-width-10,sideFits=right+width<=innerWidth-8||left>=8,x=right+width<=innerWidth-8?right:left>=8?left:Math.max(8,Math.min(innerWidth-width-8,right));
    host.style.left=x+'px';
    if(sideFits){card.style.maxHeight='min(650px,calc(100vh - 24px))';host.style.top=Math.max(8,Math.min(rect.top,innerHeight-host.getBoundingClientRect().height-8))+'px';}
    else{
      // Keskeny nézetben a kártya a név fölé/alá kerül: a név és portré kattintható marad.
      const below=innerHeight-rect.bottom-16,above=rect.top-16,useBelow=below>=above;
      card.style.maxHeight=Math.max(60,Math.min(600,useBelow?below:above))+'px';
      host.style.top=(useBelow?rect.bottom+8:Math.max(8,rect.top-host.getBoundingClientRect().height-8))+'px';
    }
  }
  const lookup=event=>event.target instanceof Element?event.target.closest(targets):null;
  document.addEventListener('pointerover',e=>{const target=lookup(e);if(target)show(target);});
  document.addEventListener('pointerout',e=>{if(lookup(e))hideTimer=setTimeout(hide,150);});
  document.addEventListener('focusin',e=>{const target=lookup(e);if(target)show(target);});
  document.addEventListener('focusout',e=>{if(lookup(e))hide();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});
  document.addEventListener('click',e=>{if(!host.contains(e.target))hide();});
  window.addEventListener('scroll',e=>{if(!(e.target instanceof Node)||!host.contains(e.target))hide();},true);window.addEventListener('resize',hide);window.addEventListener('popstate',hide);window.addEventListener('hashchange',hide);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hide();});
  host.addEventListener('pointerenter',()=>clearTimeout(hideTimer));host.addEventListener('pointerleave',hide);
  function prepare(){for(const element of document.querySelectorAll(targets))if(!element.hasAttribute('tabindex')&&!element.matches('a,button,input'))element.tabIndex=0;if(anchor&&(!anchor.isConnected||anchor.getClientRects().length===0))hide();}
  new MutationObserver(records=>{prepare();if(anchor&&records.some(r=>r.target===anchor||anchor.contains(r.target)||r.target===anchor.closest('[data-pet]')))hide();}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','class','style','data-pet']});prepare();
  window.addEventListener('message',event=>{
    if(event.source!==window||event.origin!==location.origin||event.data?.source!=='ss-statcap-api-v2')return;
    if(event.data.kind==='pet-roster'){sources.update(event.data.payload);const data=logic.roster(event.data.payload);serverOffset=data.now?Date.parse(data.now)-Date.now():0;hide();publishDiagnostics();}
    if(event.data.kind==='pet-config'){const candidate=logic.validateConfig(event.data.payload?.config);if(candidate){config=candidate;liveVersion=String(event.data.payload.version??'ismeretlen').slice(0,60);}else{config=null;liveVersion=String(event.data.payload?.version??"ismeretlen")+" · nem támogatott konfiguráció";}hide();}
  });
  window.postMessage({source:'ss-statcap-ready-v2'},location.origin);
})();
