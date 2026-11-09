/* Az Atlas letöltőpanelje. Nem tölti be és nem módosítja az addon játékoldali kódját. */
(() => {
  'use strict';
  const versions=globalThis.StonestormAddonVersion,bundled=versions?.release(globalThis.STONESTORM_ADDON_RELEASE);
  const button=document.getElementById('stat-addon-toggle'),panel=document.getElementById('stat-addon-panel');
  if(!bundled||!button||!panel)return;
  const $=id=>document.getElementById(id),key='stonestorm.atlas.addon-version.v1';
  let current=bundled,baseline=null,busy=false,lastCheck=0;
  try{const saved=JSON.parse(localStorage.getItem(key));if(saved&&versions.version(saved.version)&&['seen','installed'].includes(saved.kind))baseline={version:saved.version,kind:saved.kind};}catch{}
  const save=record=>{baseline=record;try{localStorage.setItem(key,JSON.stringify(record));}catch{}};
  if(!baseline)save({version:bundled.version,kind:'seen'});
  function render(){
    const newer=versions.compare(current.version,baseline.version)>0;
    $('stat-addon-version').textContent='v'+current.version;
    $('stat-addon-update').hidden=!newer;button.classList.toggle('has-update',newer);
    button.setAttribute('aria-label',newer?'Stat Addon – BÉTA. Új verzió elérhető!':'Stat Addon – BÉTA');
    $('stat-addon-indicator').hidden=!newer;
    $('stat-addon-baseline').textContent=(baseline.kind==='installed'?'Általad megadott telepített verzió: ':'Az Atlasban előzőleg látott kiadás: ')+baseline.version+'.';
    const download=new URL(current.zip,document.baseURI);download.searchParams.set('v',current.version);download.searchParams.set('sha',current.sha256.slice(0,16));
    const link=$('stat-addon-download');link.href=download.href;link.download='stonestorm-statcap-overlay-'+current.version+'.zip';link.textContent='ZIP letöltése · v'+current.version;
    $('stat-addon-size').textContent=Math.ceil(current.bytes/1024)+' KB · ingyenes BÉTA';
    $('stat-addon-sha').textContent=current.sha256;
    $('stat-addon-installed-input').placeholder=current.version;
  }
  async function check(force=false){
    if(busy||(!force&&Date.now()-lastCheck<60000))return;
    busy=true;lastCheck=Date.now();$('stat-addon-check').disabled=true;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    try{
      const url=new URL('downloads/stat-addon.json',document.baseURI);url.searchParams.set('check',String(Date.now()));
      const response=await fetch(url,{cache:'no-store',credentials:'omit',signal:controller.signal});
      if(!response.ok)throw Error('HTTP '+response.status);
      const next=versions.release(await response.json());if(!next)throw Error('Érvénytelen kiadási adat');
      // Régi CDN-válasz nem írhatja felül az újabb csomagolt kiadást.
      if(versions.compare(next.version,current.version)>=0)current=next;
      render();$('stat-addon-check-status').textContent='Kiadás ellenőrizve: '+new Date().toLocaleTimeString('hu-HU',{hour:'2-digit',minute:'2-digit'})+'.';
    }catch{
      $('stat-addon-check-status').textContent='A frissítést most nem sikerült ellenőrizni. A legutóbb ismert ZIP továbbra is letölthető; később próbáld újra.';
    }finally{clearTimeout(timer);busy=false;$('stat-addon-check').disabled=false;}
  }
  function close(restoreFocus=true){panel.hidden=true;button.setAttribute('aria-expanded','false');if(restoreFocus)button.focus({preventScroll:true});}
  button.addEventListener('click',()=>{if(!panel.hidden){close();return;}panel.hidden=false;button.setAttribute('aria-expanded','true');$('stat-addon-close').focus({preventScroll:true});check(true);});
  $('stat-addon-close').addEventListener('click',()=>close());
  $('stat-addon-check').addEventListener('click',()=>check(true));
  $('stat-addon-installed').addEventListener('click',()=>{save({version:current.version,kind:'installed'});$('stat-addon-installed-input').value=current.version;$('stat-addon-installed-input').setAttribute('aria-invalid','false');$('stat-addon-installed-error').textContent='Verzió rögzítve ezen a böngészőn.';render();});
  $('stat-addon-version-form').addEventListener('submit',event=>{
    event.preventDefault();const input=$('stat-addon-installed-input'),value=input.value.trim(),valid=versions.version(value);
    input.setAttribute('aria-invalid',String(!valid));$('stat-addon-installed-error').textContent=valid?'Verzió rögzítve ezen a böngészőn.':'Érvényes verziószámot adj meg, például 0.9.3.';
    if(valid){save({version:value,kind:'installed'});render();}
  });
  document.addEventListener('click',event=>{if(!panel.hidden&&!panel.contains(event.target)&&!button.contains(event.target))close(false);});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){close();event.stopPropagation();}});
  window.addEventListener('storage',event=>{if(event.key!==key)return;try{const record=JSON.parse(event.newValue);if(record&&versions.version(record.version)&&['seen','installed'].includes(record.kind)){baseline=record;render();}}catch{}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
  setInterval(()=>{if(!document.hidden)check();},15*60*1000);
  document.documentElement.classList.add('has-stat-addon');button.hidden=false;render();check();
})();
