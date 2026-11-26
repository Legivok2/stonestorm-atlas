/* Isolated-world overlay UI. Automatic data stays in memory; only explicit
 * manual overrides and display preferences are persisted on this device. */
(() => {
  'use strict';
  if(window.top!==window)return;
  const M=globalThis.StonestormRaids,KEY='stonestormRaidCalc.v2',OLD='stonestormRaidCalc.v1';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let manual={},sort='xpPerEnergy',unit='Hour',api=null,dom={},shadow=null,ready=false,scheduled=false,last='';
  const labels={energy:'Energia',xp:'XP',nyang:'Nyang',minutes:'Idő (perc)'};
  function clean(saved){
    const result={};
    for(const k of M.kinds)for(const f of M.fields){const v=saved?.[k.key]?.[f];if((typeof v==='string'&&v.length<=100)||(typeof v==='number'&&M.valid(v))){result[k.key]??={};result[k.key][f]=String(v);}}
    return result;
  }
  const save=()=>chrome.storage.local.set({[KEY]:{manual,sort,unit}});
  chrome.storage.local.get([KEY,OLD],data=>{
    if(!chrome.runtime.lastError){const s=data[KEY];manual=clean(s?.manual||data[OLD]);if(['xpPerEnergy','nyangPerEnergy','xpPerHour','nyangPerHour'].includes(s?.sort))sort=s.sort;if(['Hour','Minute'].includes(s?.unit))unit=s.unit;}
    ready=true;render(true);
  });
  function number(v){return v.value===null?'–':(v.approx?'≈ ':'')+M.format(v.value);}
  const source=value=>({DOM:"Eredeti ajánlat",API:"Játékadat",kézi:"Kézi adat",hiányzik:"Nincs adat"}[value]??value);
  function cell(v){return `<td title="${esc([v.source,v.reason,v.raw&&'Kijelzés: '+v.raw].filter(Boolean).join(' · '))}">${number(v)}<small>${esc(source(v.source))}</small></td>`;}
  function render(force=false){
    if(!shadow)return;
    const host=shadow.querySelector('[data-ssa-raid-panel]');if(!host)return;
    const view=M.merge(dom,api,manual),fingerprint=JSON.stringify([view,manual,sort,unit,ready]);
    if(!force&&host.dataset.mounted&&last===fingerprint)return;
    // Do not replace an input while the user is typing; change commits it.
    if(host.contains(shadow.activeElement)&&shadow.activeElement?.matches('input'))return;
    const open=new Set([...host.querySelectorAll('details[open]')].map(n=>n.dataset.ssaManual));
    last=fingerprint;host.dataset.mounted='true';
    const sorted=view.rows.filter(r=>r.detected).sort((a,b)=>(b.metrics[sort].value??-1)-(a.metrics[sort].value??-1));
    const metrics=['xpPerEnergy','nyangPerEnergy','xpPer'+unit,'nyangPer'+unit];
    host.innerHTML=`<p class="ssa-raid-status" role="status">Felismert portyák: <b>${view.detected}/3</b>. ${view.detected?'Az aktuális ajánlatkártyák alapján.':'Nyisd meg a Vadászat → Portyák ajánlatait.'}</p>
      <div class="ssa-raid-options"><label>Rendezés <select data-ssa-sort>${[['xpPerEnergy','XP / energia'],['nyangPerEnergy','Nyang / energia'],['xpPerHour','XP / óra'],['nyangPerHour','Nyang / óra']].map(([v,l])=>`<option value="${v}" ${v===sort?'selected':''}>${l}</option>`).join('')}</select></label><label>Időegység <select data-ssa-unit><option value="Hour" ${unit==='Hour'?'selected':''}>Óra</option><option value="Minute" ${unit==='Minute'?'selected':''}>Perc</option></select></label></div>
      ${StonestormCompanionRaidView.cards(view,sorted,sort,unit,number)}<details class="summary-fold" data-ssa-manual="tables" ${open.has("tables")?"open":""}><summary>Pontos jutalmak, költségek és számítások</summary><h4>Jutalmak és költség</h4><div class="ssa-raid-scroll"><table><thead><tr><th>Út</th><th>Energia</th><th>XP</th><th>Nyang</th><th>Perc</th></tr></thead><tbody>${sorted.map(r=>`<tr data-ssa-raid-row="${r.key}"><th>${r.name}</th>${M.fields.map(f=>cell(r.fields[f])).join('')}</tr>`).join('')}</tbody></table></div>
      <h4>Hatékonyság</h4><div class="ssa-raid-scroll"><table><thead><tr><th>Út</th><th>XP / e.</th><th>Nyang / e.</th><th>XP / ${unit==='Hour'?'óra':'perc'}</th><th>Nyang / ${unit==='Hour'?'óra':'perc'}</th></tr></thead><tbody>${sorted.map(r=>`<tr><th>${r.name}</th>${metrics.map(key=>`<td data-ssa-metric="${r.key}:${key}" class="${view.winners[key]===r.key?'ssa-raid-best':''}" title="${esc(r.metrics[key].reason||'A rövidített adatok bizonytalanságát is figyelembe vesszük.')}" >${number(r.metrics[key])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      </details><p class="ssa-raid-note">≈ = rövidített vagy kerekített adat. Zöld = a megadott adatok tartományai alapján biztos első hely mindhárom út között. A játékadat is jutalom-előnézet.</p>
      ${view.rows.filter(r=>r.detected).map(r=>{
        const missing=M.fields.filter(f=>r.fields[f].value===null).map(f=>labels[f]+': '+r.fields[f].reason);
        const overridden=M.fields.filter(f=>manual[r.key]?.[f]!==undefined&&manual[r.key][f]!=='');
        return `<div class="ssa-raid-notes">${missing.length?`<p><b>${r.name}:</b> ${esc(missing.join(' · '))}</p>`:''}${r.extra?`<p>${r.name} · ${esc(r.extra)}</p>`:''}<details data-ssa-manual="${r.key}" ${open.has(r.key)?'open':''}><summary>${r.name} · Kézi adatok ${overridden.length?'— kézi felülírás aktív':''}</summary><div class="ssa-raid-inputs">${M.fields.map(f=>`<label>${labels[f]}<input ${ready?'':'disabled'} data-ssa-override="${r.key}:${f}" inputmode="decimal" value="${esc(manual[r.key]?.[f]??'')}" placeholder="${esc(r.fields[f].automatic?number(r.fields[f].automatic):number(r.fields[f]))}" aria-label="${r.name} ${labels[f]} kézi felülírás"><small>Automatikus: ${number(r.fields[f].automatic||r.fields[f])} (${esc(source((r.fields[f].automatic||r.fields[f]).source))})</small></label>`).join('')}</div><button type="button" data-ssa-raid-reset="${r.key}">Automatikus adatok visszaállítása</button></details></div>`;
      }).join('')}`;
  }
  function attach(root){
    if(shadow)return;shadow=root;
    root.addEventListener('change',e=>{
      const input=e.target.closest('[data-ssa-override]');
      if(input){const [key,field]=input.dataset.ssaOverride.split(':');manual[key]??={};if(input.value.trim())manual[key][field]=input.value.trim().slice(0,100);else delete manual[key][field];input.blur();}
      else if(e.target.matches('[data-ssa-sort]'))sort=e.target.value;
      else if(e.target.matches('[data-ssa-unit]'))unit=e.target.value;
      else return;
      e.stopPropagation();save();render(true);
    });
    root.addEventListener('click',e=>{const b=e.target.closest('[data-ssa-raid-reset]');if(b){delete manual[b.dataset.ssaRaidReset];e.stopPropagation();save();render(true);}});
    new MutationObserver(()=>{if(root.querySelector('[data-ssa-raid-panel]:not([data-mounted])'))render(true);}).observe(root,{childList:true,subtree:true});
    render(true);
  }
  function scan(){scheduled=false;const next=globalThis.StonestormRaidDOM.scan(document);if(JSON.stringify(next)!==JSON.stringify(dom)){dom=next;render();}}
  const schedule=()=>{if(!scheduled){scheduled=true;setTimeout(scan,60);}};
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','hidden','aria-hidden','data-offer']});
  window.addEventListener('message',e=>{
    if(e.source!==window||e.origin!==location.origin||e.data?.source!=='ss-statcap-api-v2'||e.data.kind!=='raid-offers')return;
    const p=e.data.payload;
    if(!Array.isArray(p?.offers)||p.offers.length>30||!Number.isFinite(p.observedAt)||Date.now()-p.observedAt>300000||p.observedAt>Date.now()+5000){api=null;render();return;}
    api={observedAt:p.observedAt,offers:p.offers.filter(o=>typeof o?.id==='string'&&o.id.length<=160&&M.kinds.some(k=>k.key===o.kind)).map(o=>Object.fromEntries(['id','kind',...M.fields].map(k=>[k,k==='id'||k==='kind'?o[k]:M.valid(o[k])?o[k]:null])))};scan();render();
  });
  setInterval(()=>{if(api&&Date.now()-api.observedAt>300000){api=null;render();}},30000);
  globalThis.StonestormRaidUI=Object.freeze({attach});
  scan();window.postMessage({source:'ss-statcap-ready-v2'},location.origin);
})();
