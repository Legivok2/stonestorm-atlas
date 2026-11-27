/* Közös katalógus és forrásos jutalomkalkulátor az Atlas és a Stat limitek számára. */
globalThis.AtlasBonusUI={
  init({heading,table,notice,chip,num,esc,slots}){
    const data=globalThis.StonestormBonuses,math=globalThis.StonestormMath,$=selector=>document.querySelector(selector);
    const i18n=globalThis.AtlasI18n,t=(key,params)=>i18n.t(key,params);
    const localized=(key,original)=>{if(i18n.dictionaries.hu[key]===original)return t(key);if(i18n.getLocale()==='en')console.warn('Missing or outdated bonus translation:',key);return original;};
    const sourceText=(source,field)=>localized('bonus.source.'+(field==='source'&&!['equipment','imperial','potionsNyang','potionsCoins'].includes(source.id)?'normalSource':source.id+'.'+field),source[field]);
    const mode=id=>t('bonus.mode.'+id);
    const statName=id=>id==='drop'?t('bonus.drop'):(i18n.dictionaries[i18n.getLocale()]['stat.'+id]??data.byId[id]?.name??id);
    const badge=(status,text=t('bonus.evidence.'+status))=>`<span class="stat-reliability ${status}">${({confirmed:'🟢',observed:'🟡',unknown:'🔴'})[status]} ${esc(text)}</span>`;
    const percent=value=>num(value)+'%';
    const draft={stat:'xp',imperial:true,pool:'weapon',contextSlot:null,amounts:{},detailsOpen:false};
    function reset(){for(const stat of data.reward.stats)draft.amounts[stat.id]=Object.fromEntries(data.sources.filter(source=>source.id!=='imperial').map(source=>[source.id,String(data.reward.examples[stat.id][source.id]??0).replace('.',',')]));draft.stat='xp';draft.imperial=true;}
    reset();
    function sourceTable(){return table([t('bonus.sources'),t('bonus.classification'),t('bonus.reliability')],data.sources.map(source=>[esc(sourceText(source,'name')),esc(mode(source.mode)),badge(source.reliability)+`<p>${esc(sourceText(source,'explanation'))}</p><details><summary>${t('bonus.sources')}</summary><p>${esc(sourceText(source,'source'))}</p></details>`]));}
    function calculator(){
      return `<section class="planner-panel reward-calculator" aria-labelledby="reward-title"><p class="eyebrow">${t('bonus.eyebrow')}</p><h4 id="reward-title">${t('bonus.calculator')}</h4><p>${esc(t('bonus.calcCopy',{base:percent(data.reward.baseCap),paid:num(data.reward.paidCap)}))}</p><div id="reward-tabs" class="atlas-tabs" role="group" aria-label="${esc(t('bonus.rewardType'))}">${data.reward.stats.map(stat=>`<button type="button" data-reward-stat="${stat.id}" aria-pressed="${stat.id===draft.stat}">${esc(statName(stat.id))}</button>`).join('')}</div>
        <div class="atlas-actions"><button type="button" class="atlas-action" id="reward-example">${t('bonus.xpExample')}</button><button type="button" class="atlas-action" id="reward-nyang-example">${t('bonus.nyangExample')}</button></div><div id="reward-results" aria-live="polite"></div>
        <details id="reward-details" class="reward-details" ${draft.detailsOpen?'open':''}><summary>${t('bonus.details')}</summary><label class="reward-pass"><input id="reward-imperial" type="checkbox" ${draft.imperial?'checked':''} /> ${t('bonus.passActive')} <small>${t('bonus.passCopy')}</small></label><div id="reward-inputs"></div><div id="reward-components"></div></details>
        <p class="reward-help">${t('bonus.help')}</p><a class="atlas-inline-link" href="#atlas/bonuses">${t('bonus.catalogLink')}</a></section>`;
    }
    function renderInputs(){
      $('#reward-inputs').innerHTML=`<form id="reward-form" novalidate><div class="reward-source-list">${data.sources.map(source=>source.id==='imperial'?`<article class="reward-source-row"><div><strong>${esc(sourceText(source,'name'))}</strong>${badge('observed')}</div><p class="reward-fixed" data-reward-imperial>${esc(t('limits.points',{value:draft.imperial?num(data.reward.imperial[draft.stat]):'0'}))}</p><span>${esc(mode('paid'))} · ${t(draft.imperial?'bonus.active':'bonus.inactive')}</span></article>`:`<article class="reward-source-row"><div><strong>${esc(sourceText(source,'name'))}</strong><details><summary>${t('bonus.about')}</summary><p>${esc(sourceText(source,'explanation'))}</p><small>${esc(sourceText(source,'source'))}</small></details></div><label for="reward-${source.id}"><span class="sr-only">${esc(t('bonus.sourceBonus',{source:sourceText(source,'name')}))}</span><span class="stat-input-unit"><input id="reward-${source.id}" name="${source.id}" type="text" inputmode="decimal" value="${esc(draft.amounts[draft.stat][source.id])}" aria-describedby="reward-${source.id}-error" />%</span><small id="reward-${source.id}-error" class="stat-input-error"></small></label><div>${badge(source.reliability)}<small>${esc(mode(source.mode))}</small></div></article>`).join('')}</div></form>`;
      $('#reward-form').addEventListener('submit',event=>event.preventDefault());
      $('#reward-form').addEventListener('input',event=>{if(Object.hasOwn(draft.amounts[draft.stat],event.target.name)){draft.amounts[draft.stat][event.target.name]=event.target.value;updateResults();}});
    }
    function updateResults(){
      let normal=0,paid=draft.imperial?data.reward.imperial[draft.stat]:0,invalid=false,equipment=0;
      for(const source of data.sources.filter(source=>source.id!=='imperial')){
        const input=$('#reward-'+source.id),amount=math.parsePercent(input.value);
        input.setAttribute('aria-invalid',String(amount===null));$('#reward-'+source.id+'-error').textContent=amount===null?t('bonus.invalidInput'):'';
        if(amount===null){invalid=true;continue;}if(source.mode==='paid')paid+=amount;else normal+=amount;
        if(source.id==='equipment')equipment=amount;
      }
      const result=invalid?null:math.rewardBonus(normal,paid,0,data.reward.baseCap,data.reward.paidCap);
      if(!result){$('#reward-results').innerHTML=notice(t('bonus.invalidTotal'));$('#reward-components').innerHTML='';return;}
      const metric=(name,value,key)=>`<article class="stat-result ${key==='effective'?'reward-final':''}"><h5>${esc(name)}</h5><strong class="critical-output" data-reward-result="${key}">${esc(value)}</strong></article>`;
      $('#reward-results').innerHTML=`<h4 class="atlas-subheading">${esc(statName(draft.stat))} · ${t('bonus.single')}</h4><div class="reward-metrics">${metric(t('bonus.collected'),percent(result.total),'total')}${metric(t('bonus.effective'),percent(result.effective),'effective')}${metric(t('bonus.normalCap'),percent(result.baseCap),'cap')}${metric(t('bonus.paidCap'),t('limits.points',{value:num(result.paidEffective)+' / '+num(result.paidCap)}),'special')}${metric(t('bonus.lost'),t('limits.points',{value:num(result.lost)}),'lost')}</div><div class="reward-formula">${badge('confirmed',t('bonus.formulaEvidence'))}<p>${esc(localized('bonus.formula',data.reward.formula))}</p><small>${esc(localized('limits.source.reward',data.reward.source))}</small>${draft.imperial?badge('observed',t('bonus.passEvidence')):''}</div>`;
      $('#reward-components').innerHTML=table([t('bonus.subtotal'),t('bonus.value')],[
        [t('bonus.equipmentTotal'),`<span data-reward-component="equipment">${percent(equipment)}</span>`],[t('bonus.otherTotal'),`<span data-reward-component="other">${percent(result.total-equipment)}</span>`],
        [t('bonus.normalTotal'),`<span data-reward-component="normal">${percent(result.normal)}</span>`],[t('bonus.normalEffective'),`<span data-reward-component="normal-effective">${percent(result.baseEffective)}</span>`],[t('bonus.paidTotal'),`<span data-reward-component="paid">${percent(result.paid)}</span>`],[t('bonus.paidEffective'),`<span data-reward-component="paid-effective">${percent(result.paidEffective)}</span>`],[t('bonus.normalLost'),t('limits.points',{value:num(result.normalLost)})],[t('bonus.paidLost'),t('limits.points',{value:num(result.paidLost)})]
      ]);
    }
    function afterRenderCalculator(){
      renderInputs();updateResults();
      $('#reward-imperial').addEventListener('change',event=>{draft.imperial=event.target.checked;renderInputs();updateResults();});
      $('#reward-tabs').addEventListener('click',event=>{const button=event.target.closest('[data-reward-stat]');if(!button)return;draft.stat=button.dataset.rewardStat;document.querySelectorAll('[data-reward-stat]').forEach(element=>element.setAttribute('aria-pressed',String(element===button)));renderInputs();updateResults();});
      $('#reward-example').addEventListener('click',resetCalculator);
      $('#reward-nyang-example').addEventListener('click',()=>resetCalculator('nyang'));
      $('#reward-details').addEventListener('toggle',event=>{draft.detailsOpen=event.target.open;});
    }
    function resetCalculator(stat='xp'){reset();draft.stat=typeof stat==='string'?stat:'xp';$('#reward-imperial').checked=true;document.querySelectorAll('[data-reward-stat]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.rewardStat===draft.stat)));renderInputs();updateResults();}
    function poolContent(){
      return `<label for="bonus-pool">${t('bonus.poolSelect')}<select id="bonus-pool">${['weapon','armor','jewel'].map(id=>`<option value="${id}" ${draft.pool===id?'selected':''}>${t('bonus.pool.'+id)}</option>`).join('')}</select></label><div id="bonus-pool-content"></div>`;
    }
    function updatePool(){
      $('#bonus-pool-content').innerHTML=`${badge('confirmed',t('bonus.poolEvidence'))}<div class="bonus-pool-chips">${data.pools[draft.pool].map(id=>chip(esc(statName(id)),'verified')).join('')}</div>${notice(t('bonus.poolWarning'))}<p class="stat-copy">${t('bonus.poolCopy')}</p>`;
    }
    function page(){
      return heading(t('bonus.title'),t('bonus.copy'))+
        (draft.contextSlot?`<div data-bonus-slot-context>${notice(t(data.equipmentPools[draft.contextSlot]?'bonus.slotKnown':'bonus.slotUnknown',{slot:t('equipment.slot.'+draft.contextSlot)}))}</div>`:'')+
        `<section aria-labelledby="bonus-catalog-title"><h4 class="atlas-subheading" id="bonus-catalog-title">${t('bonus.catalogTitle')}</h4><div class="bonus-catalog">${table([t('bonus.identifier'),t('bonus.name'),t('bonus.valueType')],data.entries.map(entry=>[`<code>${esc(entry.id)}</code>`,esc(statName(entry.id)),t(entry.unit==='percent'?'bonus.percent':'bonus.flat')]))}</div>${notice(t('bonus.catalogWarning'))}</section>
        <section class="planner-panel"><h4>${t('bonus.poolTitle')}</h4>${poolContent()}<p class="stat-copy">${t('bonus.sources')}: <a href="${data.evidence.url}" target="_blank" rel="noopener noreferrer">${t('bonus.officialSource')}</a>, ${data.evidence.checkedAt}, ${t('bonus.version')}: ${data.evidence.version}. ${t('bonus.versionCopy')}</p></section>
        <section class="bonus-source-documentation" aria-labelledby="bonus-sources-title"><h4 class="atlas-subheading" id="bonus-sources-title">${t('bonus.sourceTitle')}</h4>${sourceTable()}</section>${calculator()}`;
    }
    function afterRender(){updatePool();$('#bonus-pool').addEventListener('change',event=>{draft.pool=event.target.value;updatePool();});afterRenderCalculator();}
    function itemInfo(slot){
      const pool=data.poolForSlot(slot),i18n=globalThis.AtlasI18n,t=(key,params)=>i18n.t(key,params);
      const statName=id=>i18n.dictionaries[i18n.getLocale()]['stat.'+id]??data.byId[id].name;
      return `<section class="atlas-related bonus-item-info"><h4>${t('equipment.bonusPool')}</h4>${pool?`<p>${pool.map(id=>esc(statName(id))).join(' · ')}</p><p>${t('equipment.bonusPoolSource',{date:data.evidence.checkedAt})}</p>`:notice(t('equipment.bonusPoolUnavailable'))}<a class="atlas-inline-link" href="#atlas/bonuses?slot=${encodeURIComponent(slot)}">${t('equipment.bonusCatalog')}</a></section>`;
    }
    function onRoute(parts,params){if(parts[1]==='bonuses'){const slot=params.get('slot');draft.contextSlot=Object.hasOwn(data.equipmentPools,slot)?slot:null;const pool=draft.contextSlot?data.equipmentPools[draft.contextSlot]:null;if(pool)draft.pool=pool;}}
    return {page,afterRender,calculator,afterRenderCalculator,resetCalculator,itemInfo,onRoute};
  }
};
