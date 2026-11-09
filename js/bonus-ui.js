/* Közös katalógus és forrásos jutalomkalkulátor az Atlas és a Stat limitek számára. */
globalThis.AtlasBonusUI={
  init({heading,table,notice,chip,num,esc,slots}){
    const data=globalThis.StonestormBonuses,math=globalThis.StonestormMath,$=selector=>document.querySelector(selector);
    const names={normal:'Alapplafonba számít',overflow:'Plafon után adódik hozzá',unknown:'Még nem tisztázott'};
    const evidence={confirmed:'Játékadatból igazolt',observed:'Megfigyelés alapján',unknown:'Még ellenőrizendő'};
    const badge=(status,text=evidence[status])=>`<span class="stat-reliability ${status}">${({confirmed:'🟢',observed:'🟡',unknown:'🔴'})[status]} ${esc(text)}</span>`;
    const percent=value=>num(value)+'%';
    const draft={stat:'xp',imperial:true,pool:'weapon',contextSlot:null,amounts:{},modes:{}};
    function reset(){for(const stat of data.reward.stats){draft.amounts[stat.id]=Object.fromEntries(data.sources.filter(source=>source.id!=='imperial').map(source=>[source.id,source.id==='equipment'&&stat.id==='xp'?'118':'0']));draft.modes[stat.id]=Object.fromEntries(data.sources.map(source=>[source.id,source.mode]));}draft.stat='xp';draft.imperial=true;}
    reset();
    function sourceTable(){return table(['Forrás','Besorolás','Megbízhatóság és indok'],data.sources.map(source=>[esc(source.name),esc(names[source.mode]),badge(source.reliability)+`<p>${esc(source.explanation)}</p><details><summary>Forrás</summary><p>${esc(source.source)}</p></details>`]));}
    function calculator(){
      return `<section class="planner-panel reward-calculator" aria-labelledby="reward-title"><p class="eyebrow">MI ÉRVÉNYESÜL A GYŰJTÖTT BÓNUSZBÓL?</p><h4 id="reward-title">XP-, nyang- és zsákmányplafon</h4><p>A teljes gyűjtött összeg már tartalmazza a különleges forrásokat is. Nem adjuk hozzá még egyszer a menlevelet. A példa: 118% normál XP + 25 százalékpont menlevél = 143% gyűjtött → 125% érvényes → 18 százalékpont veszteség.</p><div id="reward-tabs" class="atlas-tabs" role="group" aria-label="Jutalombónusz típusa">${data.reward.stats.map(stat=>`<button type="button" data-reward-stat="${stat.id}" aria-pressed="${stat.id===draft.stat}">${esc(stat.name)}</button>`).join('')}</div>
        <label class="reward-pass"><input id="reward-imperial" type="checkbox" ${draft.imperial?'checked':''} /> Császári menlevél aktív <small>XP +25 / nyang +20 / zsákmány +10 százalékpont, megfigyelt plafon feletti forrás.</small></label>
        <div id="reward-inputs"></div><button type="button" class="atlas-action" id="reward-example">143% XP → 125% példa visszaállítása</button><div id="reward-results" aria-live="polite"></div><p class="reward-help">Az ismeretlen forrásoknál választhatsz saját modellbesorolást. Ez nem változik ettől igazolt játékszabállyá. A még be nem sorolt, nem nulla értékeknél feltételes tartományt mutatunk.</p><a class="atlas-inline-link" href="#atlas/bonuses">A 20 tárgybónusz, típuspoolok és a forrásbesorolások →</a></section>`;
    }
    function renderInputs(){
      $('#reward-inputs').innerHTML=`<form id="reward-form" novalidate><div class="reward-source-list">${data.sources.map(source=>source.id==='imperial'?`<article class="reward-source-row"><div><strong>${esc(source.name)}</strong>${badge('observed')}</div><p class="reward-fixed" data-reward-imperial>${draft.imperial?num(data.reward.imperial[draft.stat]):'0'} százalékpont</p><span>${esc(names.overflow)} · ${draft.imperial?'aktív':'inaktív'}</span></article>`:`<article class="reward-source-row"><div><strong>${esc(source.name)}</strong><details><summary>Mit tudunk róla?</summary><p>${esc(source.explanation)}</p><small>${esc(source.source)}</small></details></div><label for="reward-${source.id}"><span class="sr-only">${esc(source.name)} bónusza</span><span class="stat-input-unit"><input id="reward-${source.id}" name="${source.id}" type="text" inputmode="decimal" value="${esc(draft.amounts[draft.stat][source.id])}" aria-describedby="reward-${source.id}-error" />%</span><small id="reward-${source.id}-error" class="stat-input-error"></small></label>${source.mode==='unknown'?`<label for="reward-mode-${source.id}"><span class="sr-only">${esc(source.name)} modellbesorolása</span><select id="reward-mode-${source.id}" data-reward-mode="${source.id}">${Object.entries(names).map(([key,title])=>`<option value="${key}" ${draft.modes[draft.stat][source.id]===key?'selected':''}>${esc(title)}${key!=='unknown'?' (saját feltételezés)':''}</option>`).join('')}</select></label>`:`<div>${badge(source.reliability)}<small>${esc(names[source.mode])}</small></div>`}</article>`).join('')}</div></form>`;
      $('#reward-form').addEventListener('submit',event=>event.preventDefault());
      $('#reward-form').addEventListener('input',event=>{if(Object.hasOwn(draft.amounts[draft.stat],event.target.name)){draft.amounts[draft.stat][event.target.name]=event.target.value;updateResults();}});
      $('#reward-form').addEventListener('change',event=>{const id=event.target.dataset.rewardMode;if(data.sources.some(source=>source.id===id&&source.mode==='unknown')&&Object.hasOwn(names,event.target.value)){draft.modes[draft.stat][id]=event.target.value;updateResults();}});
    }
    function updateResults(){
      let normal=0,special=draft.imperial?data.reward.imperial[draft.stat]:0,unknown=0,invalid=false,manual=false;
      for(const source of data.sources.filter(source=>source.id!=='imperial')){
        const input=$('#reward-'+source.id),amount=math.parsePercent(input.value),mode=draft.modes[draft.stat][source.id];
        input.setAttribute('aria-invalid',String(amount===null));$('#reward-'+source.id+'-error').textContent=amount===null?'Véges, nem negatív százalék szükséges.':'';
        if(amount===null){invalid=true;continue;}if(mode==='normal')normal+=amount;else if(mode==='overflow')special+=amount;else unknown+=amount;
        if(amount>0&&source.mode==='unknown'&&mode!=='unknown')manual=true;
      }
      const result=invalid?null:math.rewardBonus(normal,special,unknown,data.reward.baseCap);
      if(!result){$('#reward-results').innerHTML=notice('Javítsd a bevitt értékeket. Az összegeknek is végesnek kell lenniük.');return;}
      const quality=unknown||manual?'unknown':'observed';
      const range=(min,max,unit)=>min===max?num(min)+unit:num(min)+'–'+num(max)+unit;
      const metric=(name,value,key)=>`<article class="stat-result"><h5>${esc(name)}</h5><strong class="critical-output" data-reward-result="${key}">${esc(value)}</strong></article>`;
      $('#reward-results').innerHTML=`<h4 class="atlas-subheading">${esc(data.reward.stats.find(stat=>stat.id===draft.stat).name)} · eredmény</h4>${badge(quality,quality==='unknown'?'Feltételes modell – még ellenőrizendő':'Megfigyelésen alapuló modell')}<div class="reward-metrics">${metric('Összegyűjtött teljes bónusz',percent(result.total),'total')}${metric('Normál alapplafon',percent(result.baseCap),'cap')}${metric('Besorolt különleges bónusz',num(result.special)+' százalékpont','special')}${metric('Érvényesülő bónusz a modellben',range(result.minEffective,result.maxEffective,'%'),'effective')}${metric('Elvesző rész',range(result.minLost,result.maxLost,' százalékpont'),'lost')}</div>
        <p>Normál források: ${percent(normal)}. Még nem besorolt: <strong data-reward-result="unknown">${percent(unknown)}</strong>. A különleges források már benne vannak a teljes összegben.</p>
        <div class="reward-formula">${badge(quality)}<p>${esc(data.reward.formula)}</p><p>${unknown?'Alsó modellág: minden ismeretlen a normál plafonba számít. Felső modellág: mind plafon utáni. Ez besorolásfüggő tartomány, nem igazolt szerveroldali minimum vagy maximum.':`${num(normal)} → ${num(result.baseEffective)} a normál plafon után; + ${num(special)} különleges = ${num(result.minEffective)}%.`}</p><small>${esc(data.reward.source)}</small>${manual?'<p>Saját forrásbesorolást alkalmaztál; a számérték feltételezésen alapul.</p>':''}</div>`;
    }
    function afterRenderCalculator(){
      renderInputs();updateResults();
      $('#reward-imperial').addEventListener('change',event=>{draft.imperial=event.target.checked;renderInputs();updateResults();});
      $('#reward-tabs').addEventListener('click',event=>{const button=event.target.closest('[data-reward-stat]');if(!button)return;draft.stat=button.dataset.rewardStat;document.querySelectorAll('[data-reward-stat]').forEach(element=>element.setAttribute('aria-pressed',String(element===button)));renderInputs();updateResults();});
      $('#reward-example').addEventListener('click',resetCalculator);
    }
    function resetCalculator(){reset();$('#reward-imperial').checked=true;document.querySelectorAll('[data-reward-stat]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.rewardStat==='xp')));renderInputs();updateResults();}
    function poolContent(){
      const labels={weapon:'Fegyverpool',armor:'Páncélpool',jewel:'Ékszerpool'};
      return `<label for="bonus-pool">Kliensadatbeli felszereléstípus<select id="bonus-pool">${Object.entries(labels).map(([id,name])=>`<option value="${id}" ${draft.pool===id?'selected':''}>${name}</option>`).join('')}</select></label><div id="bonus-pool-content"></div>`;
    }
    function updatePool(){
      $('#bonus-pool-content').innerHTML=`${badge('confirmed','Játékadat: típuspool')}<div class="bonus-pool-chips">${data.pools[draft.pool].map(id=>chip(esc(data.byId[id].name),'verified')).join('')}</div>${notice('Ezek a poolban felsorolt statok, nem garantált kiosztások. A szintfeltételek és súlyok nem válnak ettől igazolt szerveres generálási eséllyé. Nem feltételezzük, hogy mind a 20 bónusz minden felszerelésen elérhető.')}<p class="stat-copy">A sisak, pajzs, csizma, karkötő, nyaklánc és fülbevaló külön pool-hozzárendelését ez a kivonat nem igazolja. Az ékszerpool létezését és az altípusok hozzárendelését külön kezeljük.</p>`;
    }
    function page(){
      return heading('A játék bónuszrendszere','20 egységes tárgybónusz, külön típuspoolok és átlátható jutalombónusz-források.')+
        (draft.contextSlot?`<div data-bonus-slot-context>${notice(`${slots[draft.contextSlot]??draft.contextSlot}: ${data.equipmentPools[draft.contextSlot]?'az alábbi, azonos nevű típuspoolhoz kapcsolódó adat.':'nincs igazolt altípus-hozzárendelés. A lent böngészhető más típuspoolok nem jelentenek ehhez a tárgyhoz igazolt elérhetőséget.'}`)}</div>`:'')+
        `<section aria-labelledby="bonus-catalog-title"><h4 class="atlas-subheading" id="bonus-catalog-title">A 20 tárgybónusz</h4><div class="bonus-catalog">${table(['Azonosító','Magyar megnevezés','Érték típusa'],data.entries.map(entry=>[`<code>${esc(entry.id)}</code>`,esc(entry.name),entry.unit==='percent'?'Százalék':'Pontérték']))}</div>${notice('A defence nyers védelem; a damageTaken külön sebzéscsökkentési tárgybónusz. A zsákmány a jutalombónusz-kalkulátor része, nem 21. tárgybónusz.')}</section>
        <section class="planner-panel"><h4>Felszereléstípusok bónuszpooljai</h4>${poolContent()}<p class="stat-copy">Forrás: <a href="${data.evidence.url}" target="_blank" rel="noopener noreferrer">hivatalos nyilvános kliensadat</a>, ${data.evidence.checkedAt}, verzió: ${data.evidence.version}. A korábbi tárgylistával verzióeltérés lehet.</p></section>
        <section class="bonus-source-documentation" aria-labelledby="bonus-sources-title"><h4 class="atlas-subheading" id="bonus-sources-title">Bónuszforrások és plafonbesorolás</h4>${sourceTable()}</section>${calculator()}`;
    }
    function afterRender(){updatePool();$('#bonus-pool').addEventListener('change',event=>{draft.pool=event.target.value;updatePool();});afterRenderCalculator();}
    function itemInfo(slot){const pool=data.poolForSlot(slot);return `<section class="atlas-related bonus-item-info"><h4>Típushoz tartozó bónuszpool</h4>${pool?`<p>${pool.map(id=>esc(data.byId[id].name)).join(' · ')}</p><p>${data.evidence.checkedAt}-i klienspool; nem garantált, szintfüggetlen vagy teljes szerveres kiosztási lista.</p>`:notice('Ehhez az altípushoz nincs igazolt külön pool-hozzárendelés. Nem tekintjük mind a 20 bónuszt automatikusan elérhetőnek.')}<a class="atlas-inline-link" href="#atlas/bonuses?slot=${encodeURIComponent(slot)}">Bónuszkatalógus és források →</a></section>`;}
    function onRoute(parts,params){if(parts[1]==='bonuses'){const slot=params.get('slot');draft.contextSlot=Object.hasOwn(data.equipmentPools,slot)?slot:null;const pool=draft.contextSlot?data.equipmentPools[draft.contextSlot]:null;if(pool)draft.pool=pool;}}
    return {page,afterRender,calculator,afterRenderCalculator,resetCalculator,itemInfo,onRoute};
  }
};
