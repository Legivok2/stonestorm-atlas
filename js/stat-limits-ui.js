/* Az Atlas meglévő megjelenítőit és tiszta matematikai függvényeit használja. */
globalThis.AtlasStatLimitsUI={
  init({heading,table,notice,icon,chip,num,esc,media,bonusSystem}){
    const data=globalThis.StonestormStats,math=globalThis.StonestormMath;
    const $=selector=>document.querySelector(selector);
    const format=value=>num(value)+'%';
    const status=(kind,text)=>`<span class="stat-reliability ${kind}"><span aria-hidden="true">${({confirmed:'🟢',observed:'🟡',unknown:'🔴'})[kind]}</span> ${esc(text)}</span>`;
    const defaults={reduction:'80',crit:'65',evade:'18,2',criticalNormal:'10000',criticalChance:'50',criticalBonus:'40',criticalGear:''};
    const values={...defaults};
    const weapon={level:'1',tier:null};
    const field=(id,label,hint,unit='%')=>`<label for="stat-${id}">${esc(label)}<span class="stat-input-unit"><input id="stat-${id}" name="${id}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" value="${esc(values[id])}" aria-describedby="stat-${id}-hint stat-${id}-error" />${unit?`<span aria-hidden="true">${esc(unit)}</span>`:''}</span><small id="stat-${id}-hint">${esc(hint)}</small><small class="stat-input-error" id="stat-${id}-error"></small></label>`;
    const meter=(name,cap,effective)=>`<div class="stat-limit-track" role="meter" aria-label="${esc(name)}: érvényesülő érték" aria-valuemin="0" aria-valuemax="${cap}" aria-valuenow="${effective}" aria-valuetext="${format(effective)} a ${format(cap)} limitből"><span style="width:${effective/cap*100}%"></span></div>`;
    function page(){
      const image=media.get('uikit','btn_character');
      return heading('Stat limitek','Ismerd a plafont, és lásd, mennyi érvényesül a megadott értékedből. A nem ismert maximumot nem helyettesítjük feltételezéssel.')+
        `<div class="stat-limit-intro">${image?media.render(image,{thumbnail:true,alt:'Karakterstatisztikák'}):icon('shield')}<p><strong>A nyers érték és a tényleges hatás két külön adat.</strong> A 75%-os védelemkorlát a sebzéscsökkentésre vonatkozik. Védelmi pontértékből ellenőrzött átváltási képlet nélkül nem számolunk százalékot.</p></div>
        <div class="stat-limit-legend" aria-label="Megbízhatósági jelölések">${status('confirmed','Megerősített')}${status('observed','Játékosok által megfigyelt')}${status('unknown','Ismeretlen / kutatás alatt')}</div>
        <section aria-labelledby="stat-database-title"><h4 class="atlas-subheading" id="stat-database-title">Statisztikai limitek</h4><div class="stat-limit-table">${table(['Statisztika','Maximum','Megbízhatóság / forrás','Mit jelent?'],data.limits.map(stat=>[
          `<span class="stat-name">${icon(stat.icon)}${esc(stat.name)}</span>`,stat.cap===null?esc(stat.maximum):`<strong class="stat-cap">${esc(stat.capLabel??format(stat.cap))}</strong>`,status(stat.reliability,stat.status)+`<details><summary>Forrás</summary><p>${esc(stat.source)}</p></details>`,esc(stat.explanation)
        ]))}</div></section>
        <section class="planner-panel stat-calculator" aria-labelledby="stat-calculator-title"><p class="eyebrow">A TE KARAKTERED</p><h4 id="stat-calculator-title">Interaktív statkalkulátor</h4><p>Százalékos karakterértékeket adj meg. Tizedesvessző és tizedespont is használható. A kitérést egyszer adod meg, de normál ellenfélre és bossra külön számítjuk ki.</p>
          <form id="stat-combat-form" novalidate><div class="stat-input-grid">${field('reduction','Sebzéscsökkentés','Százalék, nem nyers védelmi pont.')}${field('crit','Kritikus esély','A karakteren megjelenő esély.')}${field('evade','Kitérés','Ugyanaz az érték, két ellenféltípus.')}</div><button class="atlas-action" type="button" id="stat-reset">Példaértékek visszaállítása</button></form>
          <div id="stat-combat-results" class="stat-result-grid" aria-live="polite"></div>
        </section>
        ${criticalSection()}
        <section aria-labelledby="stat-observed-title"><h4 class="atlas-subheading" id="stat-observed-title">Elért bónuszok – nem maximumok</h4><p class="stat-copy">A projektgazda által közölt játékos-képernyőképeken szereplő értékek. A teljes és a felszerelésből származó bónusz külön adat; egyik sem felső korlát.</p><div class="stat-observed-grid">${data.observations.map(record=>`<article class="planner-panel"><h4>${esc(record.name)}</h4>${status('observed','Játékosok által megfigyelt')}<dl class="atlas-properties"><div><dt>Felszerelésből</dt><dd>+${format(record.gear)}</dd></div><div><dt>Teljes, kijelzett bónusz</dt><dd>+${format(record.total)}</dd></div><div><dt>A két érték különbsége</dt><dd>${num(record.total-record.gear)} százalékpont</dd></div></dl><p>A különbség számított adat, nem az egyéb források önálló mérése. Az összeadási szabály és a tényleges érvényesülés ebből nem igazolható.</p><small>${esc(record.source)}</small></article>`).join('')}</div></section>
        ${bonusSystem.calculator()}`;
    }
    function read(id,{signed=false,optional=false,grouped=false}={}){
      const input=$('#stat-'+id),text=grouped?input.value.replace(/[ \u00a0\u202f]/g,''):input.value;
      const value=optional&&!text.trim()?0:(signed?math.parseSignedPercent(text):math.parsePercent(text)),error=$('#stat-'+id+'-error');
      input.setAttribute('aria-invalid',String(value===null));
      error.textContent=value===null?(signed?'Adj meg egy véges számot.':'Adj meg egy véges, nem negatív számot.') :'';
      return value;
    }
    function combatResult(id,amount){
      const stat=data.byId[id],result=math.cappedPercent(amount,stat.cap);
      return `<article class="stat-result" data-stat-result="${id}"><h5>${icon(stat.icon)}${esc(stat.name)}</h5>${result?`<p class="stat-effective"><strong data-effective="${id}">${format(result.effective)}</strong><span>érvényesül a megadott ${format(result.amount)} értékből</span></p>${meter(stat.name,stat.cap,result.effective)}<p class="stat-result-limit">Limit: ${format(stat.cap)}</p><p class="stat-excess ${result.excess>0?'over':''}">${id.startsWith('evade')?'Elvesző kitérés':'A limit feletti rész'}: <strong data-excess="${id}">${num(result.excess)} százalékpont</strong></p>`:`<p class="stat-invalid">A számításhoz javítsd a megadott értéket.</p>`}</article>`;
    }
    function criticalSection(){
      const rules=data.critical;
      return `<section class="planner-panel critical-calculator" aria-labelledby="critical-title"><p class="eyebrow">ESÉLY ÉS SEBZÉS – KÉT KÜLÖN STAT</p><h4 id="critical-title">Kritikus sebzés kalkulátor</h4>
        <div class="critical-definitions"><p><strong>Kritikus esély</strong>A kritikus találat valószínűsége. Maximum ${format(rules.chanceCap)}.</p><p><strong>Kritikus sebzés</strong>A kritikus ütés sebzésszorzója. Alapértéke ${num(rules.baseMultiplier)}×.</p><p><strong>Kritikus sebzésbónusz</strong>A szorzóhoz hozzáadódó extra érték. Legfeljebb +${format(rules.damageBonusCap)} érvényesül, így a szorzó maximum ${num(rules.baseMultiplier+rules.damageBonusCap/100)}×.</p></div>
        <form id="critical-damage-form" novalidate><div class="stat-input-grid critical-input-grid">${field('criticalNormal','Normál sebzés','Sebzésérték; például 10 000.','')}${field('criticalChance','Kritikus esély ehhez a számításhoz','A kalkulátor az 50% feletti részt nem alkalmazza.')}${field('criticalBonus','Kritikus sebzésbónusz','A fegyvertáblázat választása ezt a mezőt tölti ki.')}${field('criticalGear','További felszerelésbónusz (opcionális)','Üresen 0%. A fenti fegyverbónuszt ne számold kétszer.')}</div><button type="button" class="atlas-action" id="critical-example">10 000 / 50% / +40% példa</button></form>
        <div id="critical-results" aria-live="polite"></div>
        ${notice('Egyszerűsített modell: a normál sebzést az 1,5 + min(max(0, összesített bónusz), 0,75) szorzóval számítjuk át. Ez nem a teljes harci sebzésképlet: védelem, kitérés, képességek és egyéb harci módosítók nélkül számol. A kijelzett eredményeket kerekítjük.')}
        <details class="critical-source"><summary>Az alapértékek forrása</summary><p>${esc(rules.source)} · 2026-11-06-i mentés.</p></details>
        <h4 class="atlas-subheading" id="critical-weapon-title">Fegyverek kritikus sebzésbónuszai</h4><p>Kliensadatokban szereplő alapértékek. Nem bizonyított, hogy a szerver minden esetben módosítás nélkül ezeket osztja ki. A T1–T5 adatbázisbeli fokozat, nem igazolt hivatalos ritkasági kategória.</p>
        <form id="critical-weapon-form" novalidate><label for="critical-weapon-level">Fegyver szintje (1–60)<input id="critical-weapon-level" type="number" min="1" max="60" step="1" value="${esc(weapon.level)}" aria-describedby="critical-weapon-hint critical-weapon-error" /></label><small id="critical-weapon-hint">Válassz szintet, majd kattints egy T1–T5 értékre. Szintváltáskor a kiválasztott fokozat bónusza automatikusan frissül. Mobilon a táblázat oldalra görgethető.</small><p id="critical-weapon-error" class="stat-input-error"></p></form><div id="critical-weapon-table"></div><p id="critical-weapon-selection" role="status"></p>
        <details class="critical-source"><summary>A fegyvertáblázat forrása és korlátai</summary><p>${esc(rules.weaponSource)}</p><p>A magasabb szintsávok számai a projektgazdai klienskivonatból származnak; a szerveroldali generálási esélyeket nem ismerjük.</p></details>
      </section>`;
    }
    function updateCritical(){
      const result=math.criticalDamage(read('criticalNormal',{grouped:true}),read('criticalChance'),read('criticalBonus',{signed:true}),read('criticalGear',{signed:true,optional:true}),data.critical);
      if(!result){$('#critical-results').innerHTML=notice('Javítsd a bevitt adatokat. A számoknak és a számított sebzésnek is végesnek kell lenniük.');return;}
      const bonus=value=>(value>=0?'+':'')+format(value);
      const metric=(name,value,key,copy)=>`<article class="stat-result"><h5>${esc(name)}</h5><strong class="critical-output" data-critical-result="${key}">${esc(value)}</strong><small>${esc(copy)}</small></article>`;
      $('#critical-results').innerHTML=`<div class="critical-metric-grid">${metric('Összesített bónusz',bonus(result.totalBonus),'total','A megadott bónusz és a további felszerelésbónusz összege.')}${metric('Érvényesülő bónusz',bonus(result.bonus.effective),'effective','A kritikus szorzóhoz hozzáadódó rész.')}${metric('Limit feletti veszteség',num(result.bonus.excess)+' százalékpont','excess','A +75% feletti rész ebben a modellben nem érvényesül.')}${metric('Kritikus sebzésszorzó',result.multiplier.toLocaleString('hu-HU',{minimumFractionDigits:2,maximumFractionDigits:2})+'×','multiplier','Alapszorzó + érvényesülő bónusz; nem szorzással halmozzuk.')}${metric('Egy kritikus ütés sebzése',num(result.criticalHit),'hit','A megadott normál sebzésből számítva.')}${metric('Átlagos sebzés ütésenként',num(result.averageDamage),'average','Sok találat egyszerűsített várható értéke, nem garantált ütéssebzés.')}</div>
        ${meter('Kritikus sebzésbónusz',data.critical.damageBonusCap,result.bonus.effective)}<p>Érvényesülő kritikus esély: <strong data-critical-result="chance">${format(result.chance.effective)}</strong>. Az esély limit feletti része: <strong data-critical-result="chance-excess">${num(result.chance.excess)} százalékpont</strong>.</p><p class="critical-formula">${num(result.normalDamage)} × (1 − ${format(result.chance.effective)}) + ${num(result.criticalHit)} × ${format(result.chance.effective)} = <strong>${num(result.averageDamage)}</strong></p>${result.negativeIgnored?notice('A negatív összesített bónuszt a képlet szerint 0%-ra korlátoztuk; az alapszorzó megmarad.'):''}`;
    }
    function weaponBand(){const level=math.parsePercent(weapon.level);return Number.isInteger(level)?data.critical.weaponBands.findIndex(band=>level>=band.min&&level<=band.max):-1;}
    function applyWeaponBonus(){
      const index=weaponBand();if(index<0||weapon.tier===null)return;
      const amount=data.critical.weaponBands[index].bonuses[weapon.tier];values.criticalBonus=String(amount).replace('.',',');$('#stat-criticalBonus').value=values.criticalBonus;
    }
    function updateWeaponTable(){
      const active=weaponBand();$('#critical-weapon-level').setAttribute('aria-invalid',String(active<0));$('#critical-weapon-error').textContent=active<0?'Adj meg egy egész szintet 1 és 60 között. Más szintekre nincs megadott klienssáv.':'';
      $('#critical-weapon-table').innerHTML=table(['Fegyverszint',...data.critical.tiers],data.critical.weaponBands.map((band,index)=>[
        `<span class="${index===active?'critical-active-band':''}">${band.min}–${band.max}</span>`,...band.bonuses.map((value,tier)=>`<button type="button" class="critical-tier tier-${tier+1} ${index===active?'current-band':''}" data-critical-band="${index}" data-critical-tier="${tier}" aria-label="${band.min}–${band.max}. szint, ${data.critical.tiers[tier]}, +${format(value)} betöltése" aria-pressed="${index===active&&weapon.tier===tier}" ${active<0?'disabled':''}>+${format(value)}</button>`)
      ]));
      $('#critical-weapon-selection').textContent=active<0?'Nincs érvényes szintkiválasztás.':weapon.tier===null?'Kattints egy fokozatra a bónusz betöltéséhez.':`${weapon.level}. szint · ${data.critical.tiers[weapon.tier]} · +${format(data.critical.weaponBands[active].bonuses[weapon.tier])} betöltve a kritikus sebzésbónusz mezőbe.`;
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
