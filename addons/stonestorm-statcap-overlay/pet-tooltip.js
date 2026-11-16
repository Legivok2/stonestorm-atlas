(() => {
  'use strict';
  if(window.top!==window)return;
  const model=globalThis.STONESTORM_PET_MODEL,logic=globalThis.StonestormPetDetails;
  const sources=globalThis.StonestormPetSources.create(model);
  let config=model.config,liveVersion=null,serverOffset=0,anchor=null,hideTimer=null,originalDescription=null;
  const publishDiagnostics=()=>window.dispatchEvent(new Event('ss-addon-pet-diagnostics'));
  globalThis.StonestormPetTooltip=Object.freeze({diagnostics:()=>sources.diagnostics(config,Date.now()+serverOffset)});
  const host=document.createElement('div');host.id='ss-atlas-pet-tooltip';document.documentElement.append(host);
  const shadow=host.attachShadow({mode:'closed'}),style=document.createElement('style');
  style.textContent=':host{all:initial;position:fixed;z-index:2147483646;display:none;width:min(350px,calc(100vw - 24px));color:#eee2c9;font:13px/1.45 system-ui}article{box-sizing:border-box;max-height:calc(100vh - 24px);overflow:auto;padding:14px;border:1px solid #a88449;border-radius:10px;background:linear-gradient(145deg,#221e18,#101820);box-shadow:0 12px 30px #000b}h3{font-size:17px;color:#efcf89;margin:0 0 6px}h4{font-size:13px;color:#dabc77;margin:12px 0 4px}p{margin:5px 0;overflow-wrap:anywhere}small{color:#b8b8af;font-size:11px}';
  const card=document.createElement('article');card.id='ss-atlas-pet-description';card.role='tooltip';shadow.append(style,card);
  const targets='.pet-row__art,.pet-row__name,.pet-main__art,.pet-main__name';
  function hide(){clearTimeout(hideTimer);if(anchor){if(originalDescription===null)anchor.removeAttribute('aria-description');else anchor.setAttribute('aria-description',originalDescription);}anchor=null;host.style.display='none';}
  function show(target){
    clearTimeout(hideTimer);if(anchor!==target){hide();originalDescription=target.getAttribute('aria-description');}anchor=target;
    const match=sources.identify(target),data=logic.describe(match.instance,model,config,Date.now()+serverOffset,match.observed);
    card.replaceChildren();const heading=document.createElement('h3');heading.textContent=data.name;card.append(heading);
    const meta=document.createElement('p');meta.textContent=data.rarity+' · '+(data.level??'?')+'. szint · '+data.formName;card.append(meta);
    for(const section of data.sections){const h=document.createElement('h4');h.textContent=section.title;card.append(h);for(const text of section.items){const p=document.createElement('p');p.textContent=text;card.append(p);}}
    const provenance=document.createElement('small');provenance.textContent='API: '+(liveVersion??model.gameVersion)+(liveVersion?' · megfigyelt konfiguráció.':' · csomagolt forrás.')+' Kliensképlet, nem szerveres végösszeg.'+(!model.evidence.entrypointConfirmed?' Aktuális kliensbelépő: nem igazolt.':'');card.append(provenance);
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
