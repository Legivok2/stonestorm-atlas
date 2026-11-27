/* Az Atlas meglévő megjelenítőit és tiszta matematikai függvényeit használja. */
globalThis.AtlasStatLimitsUI={
  init({heading,table,notice,icon,chip,num,esc,media,bonusSystem}){
    const data=globalThis.StonestormStats,math=globalThis.StonestormMath;
    const i18n=globalThis.AtlasI18n,t=(key,params)=>i18n.t(key,params);
    const $=selector=>document.querySelector(selector);
    const format=value=>num(value)+'%';
    const translate=(text,keys)=>{if(i18n.getLocale()==='hu')return text;const key=keys.find(k=>i18n.dictionaries.hu[k]===text);if(key)return t(key);console.warn('Missing or outdated stat translation:',text);return text;};
    const statusKeys=['confirmed','clientConfirmed','apiChecked','unverified','characterUnverified','twoCaps'].map(k=>'limits.'+k);
    const explainKeys=['reduction','crit','soft','evade','evadeBossLegacy','evadeNormalLegacy','damageTakenLegacy','critDamageLegacy','support','damageTaken','attack','hp','defenceRaw','reward'].map(k=>'limits.explain.'+k);
    const sourceKeys=['attack','hp','defenceRaw','reward','evadeNormalLegacy'].map(k=>'limits.source.'+k);
    const statName=stat=>i18n.dictionaries.hu['limits.name.'+stat.id]===stat.name?t('limits.name.'+stat.id):stat.name;
    const statSource=stat=>sourceKeys.some(k=>i18n.dictionaries.hu[k]===stat.source)?translate(stat.source,sourceKeys):stat.source;
    const statExplanation=stat=>{
      if(stat.id==='critDamage'&&!data.critical.softCapUnverified){
        const base=data.critical.baseMultiplier.toLocaleString('hu-HU'),cap=data.critical.damageBonusCap.toLocaleString('hu-HU');
        if(stat.explanation===i18n.dictionaries.hu['limits.explain.critDamageConfigured'].replace('{base}',base).replace('{cap}',cap))return t('limits.explain.critDamageConfigured',{base:num(data.critical.baseMultiplier),cap:num(data.critical.damageBonusCap)});
      }
      return translate(stat.explanation,explainKeys);
    };
    const status=(kind,text)=>`<span class="stat-reliability ${kind}"><span aria-hidden="true">${({confirmed:'🟢',observed:'🟡',unknown:'🔴'})[kind]}</span> ${esc(text)}</span>`;
    const defaults={reduction:'80',crit:'65',evade:'18,2',criticalNormal:'10000',criticalChance:'50',criticalBonus:'40',criticalGear:''};
    const values={...defaults};
    const weapon={level:'1',tier:null};
    const field=(id,label,hint,unit='%')=>`<label for="stat-${id}">${esc(label)}<span class="stat-input-unit"><input id="stat-${id}" name="${id}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" value="${esc(values[id])}" aria-describedby="stat-${id}-hint stat-${id}-error" />${unit?`<span aria-hidden="true">${esc(unit)}</span>`:''}</span><small id="stat-${id}-hint">${esc(hint)}</small><small class="stat-input-error" id="stat-${id}-error"></small></label>`;
    const meter=(name,cap,effective)=>`<div class="stat-limit-track" role="meter" aria-label="${esc(t('limits.meter',{name}))}" aria-valuemin="0" aria-valuemax="${cap}" aria-valuenow="${effective}" aria-valuetext="${esc(t('limits.meterValue',{effective:format(effective),cap:format(cap)}))}"><span style="width:${effective/cap*100}%"></span></div>`;
    function page(){
      const image=media.get('uikit','btn_character');
      return heading(t('limits.title'),t('limits.copy'))+
        `<div class="stat-limit-intro">${image?media.render(image,{thumbnail:true,alt:t('limits.tableTitle')}):icon('shield')}<p>${esc(t('limits.intro'))}</p></div>
        <div class="stat-limit-legend" aria-label="${esc(t('limits.legend'))}">${status('confirmed',t('limits.confirmed'))}${status('observed',t('limits.observed'))}${status('unknown',t('limits.unknown'))}</div>
        <section aria-labelledby="stat-database-title"><h4 class="atlas-subheading" id="stat-database-title">${t('limits.tableTitle')}</h4><div class="stat-limit-table">${table([t('limits.stat'),t('limits.maximum'),t('limits.reliability'),t('limits.meaning')],data.limits.map(stat=>[
          `<span class="stat-name">${icon(stat.icon)}${esc(statName(stat))}</span>`,stat.cap===null?esc(translate(stat.maximum,['limits.noMaximum','limits.noGlobalMaximum'])):`<strong class="stat-cap">${esc(stat.capLabel?translate(stat.capLabel,['limits.rewardCap']):format(stat.cap))}</strong>`,status(stat.reliability,translate(stat.status,statusKeys))+`<details><summary>${t('limits.source')}</summary><p>${esc(statSource(stat))}</p></details>`,esc(statExplanation(stat))
        ]))}</div></section>
        <section class="planner-panel stat-calculator" aria-labelledby="stat-calculator-title"><p class="eyebrow">${t('limits.yourCharacter')}</p><h4 id="stat-calculator-title">${t('limits.calculator')}</h4><p>${t('limits.calcCopy')}</p>
          <form id="stat-combat-form" novalidate><div class="stat-input-grid">${field('reduction',t('limits.reduction'),t('limits.reductionHint'))}${field('crit',t('limits.name.crit'),t('limits.critHint'))}${field('evade',t('stat.evade'),t('limits.evadeHint'))}</div><button class="atlas-action" type="button" id="stat-reset">${t('limits.reset')}</button></form>
          <div id="stat-combat-results" class="stat-result-grid" aria-live="polite"></div>
        </section>
        ${criticalSection()}
        ${bonusSystem.calculator()}`;
    }
    function read(id,{signed=false,optional=false,grouped=false}={}){
      const input=$('#stat-'+id),text=grouped?input.value.replace(/[ \u00a0\u202f]/g,''):input.value;
      const value=optional&&!text.trim()?0:(signed?math.parseSignedPercent(text):math.parsePercent(text)),error=$('#stat-'+id+'-error');
      input.setAttribute('aria-invalid',String(value===null));
      error.textContent=value===null?t(signed?'limits.invalidSigned':'limits.invalidPositive'):'';
      return value;
    }
    function combatResult(id,amount){
      const stat=data.byId[id],result=math.cappedPercent(amount,stat.cap);
      return `<article class="stat-result" data-stat-result="${id}"><h5>${icon(stat.icon)}${esc(statName(stat))}</h5>${result?`<p class="stat-effective"><strong data-effective="${id}">${format(result.effective)}</strong><span>${esc(t('limits.effective',{amount:format(result.amount)}))}</span></p>${meter(statName(stat),stat.cap,result.effective)}<p class="stat-result-limit">${t('limits.limit')}: ${format(stat.cap)}</p><p class="stat-excess ${result.excess>0?'over':''}">${t(id.startsWith('evade')?'limits.lostEvade':'limits.excess')}: <strong data-excess="${id}">${esc(t('limits.points',{value:num(result.excess)}))}</strong></p>`:`<p class="stat-invalid">${t('limits.correct')}</p>`}</article>`;
    }
    function criticalSection(){
      const rules=data.critical;
      return `<section class="planner-panel critical-calculator" aria-labelledby="critical-title"><p class="eyebrow">${t('critical.eyebrow')}</p><h4 id="critical-title">${t('critical.title')}</h4>
        <div class="critical-definitions"><p><strong>${t('limits.name.crit')}</strong>${esc(t('critical.chanceDefinition',{cap:format(rules.chanceCap)}))}</p><p><strong>${t('critical.damage')}</strong>${esc(t('critical.damageDefinition',{base:num(rules.baseMultiplier)}))}</p><p><strong>${t('limits.name.critDamage')}</strong>${esc(t('critical.bonusDefinition',{cap:format(rules.damageBonusCap)}))}</p></div>
        <form id="critical-damage-form" novalidate><div class="stat-input-grid critical-input-grid">${field('criticalNormal',t('critical.normal'),t('critical.normalHint'),'')}${field('criticalChance',t('critical.chanceInput'),t('critical.chanceHint'))}${field('criticalBonus',t('limits.name.critDamage'),t('critical.bonusHint'))}${field('criticalGear',t('critical.gear'),t('critical.gearHint'))}</div><button type="button" class="atlas-action" id="critical-example">${t('critical.example')}</button></form>
        <div id="critical-results" aria-live="polite"></div>
        ${notice(t('critical.model'))}
        <details class="critical-source"><summary>${t('critical.baseSource')}</summary><p>${esc(rules.source)} · ${t('critical.snapshot')}</p></details>
        <h4 class="atlas-subheading" id="critical-weapon-title">${t('critical.weapons')}</h4><p>${t('critical.weaponsCopy')}</p>
        <form id="critical-weapon-form" novalidate><label for="critical-weapon-level">${t('critical.weaponLevel')}<input id="critical-weapon-level" type="number" min="1" max="60" step="1" value="${esc(weapon.level)}" aria-describedby="critical-weapon-hint critical-weapon-error" /></label><small id="critical-weapon-hint">${t('critical.weaponHint')}</small><p id="critical-weapon-error" class="stat-input-error"></p></form><div id="critical-weapon-table"></div><p id="critical-weapon-selection" role="status"></p>
        <details class="critical-source"><summary>${t('critical.weaponSourceTitle')}</summary><p>${esc(translate(rules.weaponSource,['critical.weaponSource']))}</p><p>${t('critical.weaponCaveat')}</p></details>
      </section>`;
    }
    function updateCritical(){
      const inputs=[read('criticalNormal',{grouped:true}),read('criticalChance'),read('criticalBonus',{signed:true}),read('criticalGear',{signed:true,optional:true})];
      if(data.critical.softCapUnverified){$('#critical-results').innerHTML=notice(t(inputs.includes(null)?'critical.invalid':'critical.softUnknown'));return;}
      const result=math.criticalDamage(...inputs,data.critical);
      if(!result){$('#critical-results').innerHTML=notice(t('critical.invalid'));return;}
      const bonus=value=>(value>=0?'+':'')+format(value);
      const metric=(name,value,key,copy)=>`<article class="stat-result"><h5>${esc(name)}</h5><strong class="critical-output" data-critical-result="${key}">${esc(value)}</strong><small>${esc(copy)}</small></article>`;
      $('#critical-results').innerHTML=`<div class="critical-metric-grid">${metric(t('critical.total'),bonus(result.totalBonus),'total',t('critical.totalCopy'))}${metric(t('critical.effective'),bonus(result.bonus.effective),'effective',t('critical.effectiveCopy'))}${metric(t('critical.lost'),t('limits.points',{value:num(result.bonus.excess)}),'excess',t('critical.lostCopy'))}${metric(t('critical.multiplier'),i18n.formatNumber(result.multiplier,{minimumFractionDigits:2,maximumFractionDigits:2})+'×','multiplier',t('critical.multiplierCopy'))}${metric(t('critical.hit'),num(result.criticalHit),'hit',t('critical.hitCopy'))}${metric(t('critical.average'),num(result.averageDamage),'average',t('critical.averageCopy'))}</div>
        ${meter(t('limits.name.critDamage'),data.critical.damageBonusCap,result.bonus.effective)}<p>${t('critical.effectiveChance')}: <strong data-critical-result="chance">${format(result.chance.effective)}</strong>. ${t('critical.chanceExcess')}: <strong data-critical-result="chance-excess">${esc(t('limits.points',{value:num(result.chance.excess)}))}</strong>.</p><p class="critical-formula">${num(result.normalDamage)} × (1 − ${format(result.chance.effective)}) + ${num(result.criticalHit)} × ${format(result.chance.effective)} = <strong>${num(result.averageDamage)}</strong></p>${result.negativeIgnored?notice(t('critical.negative')):''}`;
    }
    function weaponBand(){const level=math.parsePercent(weapon.level);return Number.isInteger(level)?data.critical.weaponBands.findIndex(band=>level>=band.min&&level<=band.max):-1;}
    function applyWeaponBonus(){
      const index=weaponBand();if(index<0||weapon.tier===null)return;
      const amount=data.critical.weaponBands[index].bonuses[weapon.tier];values.criticalBonus=String(amount).replace('.',',');$('#stat-criticalBonus').value=values.criticalBonus;
    }
    function updateWeaponTable(){
      const active=weaponBand();$('#critical-weapon-level').setAttribute('aria-invalid',String(active<0));$('#critical-weapon-error').textContent=active<0?t('critical.invalidLevel'):'';
      $('#critical-weapon-table').innerHTML=table([t('critical.weaponTable'),...data.critical.tiers],data.critical.weaponBands.map((band,index)=>[
        `<span class="${index===active?'critical-active-band':''}">${band.min}–${band.max}</span>`,...band.bonuses.map((value,tier)=>`<button type="button" class="critical-tier tier-${tier+1} ${index===active?'current-band':''}" data-critical-band="${index}" data-critical-tier="${tier}" aria-label="${esc(t('critical.loadTier',{min:band.min,max:band.max,tier:data.critical.tiers[tier],value:format(value)}))}" aria-pressed="${index===active&&weapon.tier===tier}" ${active<0?'disabled':''}>+${format(value)}</button>`)
      ]));
      $('#critical-weapon-selection').textContent=active<0?t('critical.noLevel'):weapon.tier===null?t('critical.selectTier'):t('critical.loaded',{level:weapon.level,tier:data.critical.tiers[weapon.tier],value:format(data.critical.weaponBands[active].bonuses[weapon.tier])});
    }
    function updateCombat(){
      const reduction=read('reduction'),crit=read('crit'),evade=read('evade');
      $('#stat-combat-results').innerHTML=combatResult('reduction',reduction)+combatResult('crit',crit)+combatResult('evadeNormal',evade)+combatResult('evadeBoss',evade);
    }
    function afterRender(){
      const updates={'stat-combat-form':updateCombat,'critical-damage-form':updateCritical};
      for(const [id,update] of Object.entries(updates)){
        const form=$('#'+id);form.addEventListener('submit',event=>event.preventDefault());
        form.addEventListener('input',event=>{if(event.target.name in values)values[event.target.name]=event.target.value;if(event.target.name==='criticalBonus'){weapon.tier=null;updateWeaponTable();}update();});
      }
      const resetCritical=()=>{weapon.level='1';weapon.tier=null;$('#critical-weapon-level').value='1';updateWeaponTable();updateCritical();};
      $('#stat-reset').addEventListener('click',()=>{Object.assign(values,defaults);for(const [name,value] of Object.entries(values))$('#stat-'+name).value=value;updateCombat();bonusSystem.resetCalculator();resetCritical();});
      $('#critical-example').addEventListener('click',()=>{for(const name of ['criticalNormal','criticalChance','criticalBonus','criticalGear']){$('#stat-'+name).value=values[name]=defaults[name];}resetCritical();});
      $('#critical-weapon-form').addEventListener('submit',event=>event.preventDefault());
      $('#critical-weapon-level').addEventListener('input',event=>{weapon.level=event.target.value;applyWeaponBonus();updateWeaponTable();updateCritical();});
      $('#critical-weapon-table').addEventListener('click',event=>{
        const button=event.target.closest('[data-critical-tier]');if(!button)return;
        const band=data.critical.weaponBands[Number(button.dataset.criticalBand)];if(!band)return;
        if(weaponBand()!==Number(button.dataset.criticalBand)){$('#critical-weapon-level').value=weapon.level=String(band.min);}
        weapon.tier=Number(button.dataset.criticalTier);applyWeaponBonus();updateWeaponTable();updateCritical();
      });
      updateCombat();updateWeaponTable();updateCritical();bonusSystem.afterRenderCalculator();
    }
    return {page,afterRender};
  }
};
