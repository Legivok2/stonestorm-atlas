/* Az Atlas meglévő megjelenítőit és tiszta matematikai függvényeit használja. */
globalThis.AtlasStatLimitsUI={
  init({heading,table,notice,icon,chip,num,esc,media}){
    const data=globalThis.StonestormStats,math=globalThis.StonestormMath;
    const $=selector=>document.querySelector(selector);
    const format=value=>num(value)+'%';
    const status=(kind,text)=>`<span class="stat-reliability ${kind}"><span aria-hidden="true">${({confirmed:'🟢',observed:'🟡',unknown:'🔴'})[kind]}</span> ${esc(text)}</span>`;
    const defaults={reduction:'80',crit:'65',evade:'18,2'};
    for(const record of data.observations){defaults[record.id+'Gear']=String(record.gear).replace('.',',');defaults[record.id+'Other']=num(record.total-record.gear);}
    const values={...defaults};
    const field=(id,label,hint)=>`<label for="stat-${id}">${esc(label)}<span class="stat-input-unit"><input id="stat-${id}" name="${id}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" value="${esc(values[id])}" aria-describedby="stat-${id}-hint stat-${id}-error" /><span aria-hidden="true">%</span></span><small id="stat-${id}-hint">${esc(hint)}</small><small class="stat-input-error" id="stat-${id}-error"></small></label>`;
    function page(){
      const image=media.get('uikit','btn_character');
      return heading('Stat limitek','Ismerd a plafont, és lásd, mennyi érvényesül a megadott értékedből. A nem ismert maximumot nem helyettesítjük feltételezéssel.')+
        `<div class="stat-limit-intro">${image?media.render(image,{thumbnail:true,alt:'Karakterstatisztikák'}):icon('shield')}<p><strong>A nyers érték és a tényleges hatás két külön adat.</strong> A 75%-os védelemkorlát a sebzéscsökkentésre vonatkozik. Védelmi pontértékből ellenőrzött átváltási képlet nélkül nem számolunk százalékot.</p></div>
        <div class="stat-limit-legend" aria-label="Megbízhatósági jelölések">${status('confirmed','Megerősített')}${status('observed','Játékosok által megfigyelt')}${status('unknown','Ismeretlen / kutatás alatt')}</div>
        <section aria-labelledby="stat-database-title"><h4 class="atlas-subheading" id="stat-database-title">Statisztikai limitek</h4><div class="stat-limit-table">${table(['Statisztika','Maximum','Megbízhatóság / forrás','Mit jelent?'],data.limits.map(stat=>[
          `<span class="stat-name">${icon(stat.icon)}${esc(stat.name)}</span>`,stat.cap===null?esc(stat.maximum):`<strong class="stat-cap">${format(stat.cap)}</strong>`,status(stat.reliability,stat.status)+`<details><summary>Forrás</summary><p>${esc(stat.source)}</p></details>`,esc(stat.explanation)
        ]))}</div></section>
        <section class="planner-panel stat-calculator" aria-labelledby="stat-calculator-title"><p class="eyebrow">A TE KARAKTERED</p><h4 id="stat-calculator-title">Interaktív statkalkulátor</h4><p>Százalékos karakterértékeket adj meg. Tizedesvessző és tizedespont is használható. A kitérést egyszer adod meg, de normál ellenfélre és bossra külön számítjuk ki.</p>
          <form id="stat-combat-form" novalidate><div class="stat-input-grid">${field('reduction','Sebzéscsökkentés','Százalék, nem nyers védelmi pont.')}${field('crit','Kritikus esély','A karakteren megjelenő esély.')}${field('evade','Kitérés','Ugyanaz az érték, két ellenféltípus.')}</div><button class="atlas-action" type="button" id="stat-reset">Példaértékek visszaállítása</button></form>
          <div id="stat-combat-results" class="stat-result-grid" aria-live="polite"></div>
        </section>
        <section aria-labelledby="stat-observed-title"><h4 class="atlas-subheading" id="stat-observed-title">Elért bónuszok – nem maximumok</h4><p class="stat-copy">A projektgazda által közölt játékos-képernyőképeken szereplő értékek. A teljes és a felszerelésből származó bónusz külön adat; egyik sem felső korlát.</p><div class="stat-observed-grid">${data.observations.map(record=>`<article class="planner-panel"><h4>${esc(record.name)}</h4>${status('observed','Játékosok által megfigyelt')}<dl class="atlas-properties"><div><dt>Felszerelésből</dt><dd>+${format(record.gear)}</dd></div><div><dt>Teljes, kijelzett bónusz</dt><dd>+${format(record.total)}</dd></div><div><dt>A két érték különbsége</dt><dd>${num(record.total-record.gear)} százalékpont</dd></div></dl><p>A különbség számított adat, nem az egyéb források önálló mérése. Az összeadási szabály és a tényleges érvényesülés ebből nem igazolható.</p><small>${esc(record.source)}</small></article>`).join('')}</div></section>
        <section class="planner-panel" aria-labelledby="stat-bonus-title"><h4 id="stat-bonus-title">XP- és nyangbónusz összegző</h4><p>A felszerelésből és az egyéb forrásokból megadott százalékokat egyszerűen összeadjuk. Ez számtani összeg, nem a játék tényleges jutalomképletének modellje. Az előtöltött „egyéb” érték a fenti megfigyelések különbsége.</p><form id="stat-bonus-form" novalidate><div class="stat-bonus-inputs">${data.observations.map(record=>`<fieldset><legend>${esc(record.name)}</legend>${field(record.id+'Gear','Felszerelésből származó bónusz','A felszerelés összesített százaléka.')}${field(record.id+'Other','Egyéb forrásokból megadott bónusz','Például ideiglenes hatás; ne számold kétszer.')}</fieldset>`).join('')}</div></form><div id="stat-bonus-results" aria-live="polite"></div>${notice('Az XP- és nyangbónusz maximuma ismeretlen. Az összegző nem alkalmaz kitalált korlátot, és nem állítja, hogy a teljes összeg biztosan érvényesül.')}</section>`;
    }
    function read(id){
      const input=$('#stat-'+id),value=math.parsePercent(input.value),error=$('#stat-'+id+'-error');
      input.setAttribute('aria-invalid',String(value===null));
      error.textContent=value===null?'Adj meg egy véges, nem negatív százalékot.':'';
      return value;
    }
    function combatResult(id,amount){
      const stat=data.byId[id],result=math.cappedPercent(amount,stat.cap);
      return `<article class="stat-result" data-stat-result="${id}"><h5>${icon(stat.icon)}${esc(stat.name)}</h5>${result?`<p class="stat-effective"><strong data-effective="${id}">${format(result.effective)}</strong><span>érvényesül a megadott ${format(result.amount)} értékből</span></p><div class="stat-limit-track" role="meter" aria-label="${esc(stat.name)}: érvényesülő érték" aria-valuemin="0" aria-valuemax="${stat.cap}" aria-valuenow="${result.effective}" aria-valuetext="${format(result.effective)} a ${format(stat.cap)} limitből"><span style="width:${result.fill*100}%"></span></div><p class="stat-result-limit">Limit: ${format(stat.cap)}</p><p class="stat-excess ${result.excess>0?'over':''}">${id.startsWith('evade')?'Elvesző kitérés':'A limit feletti rész'}: <strong data-excess="${id}">${num(result.excess)} százalékpont</strong></p>`:`<p class="stat-invalid">A számításhoz javítsd a megadott értéket.</p>`}</article>`;
    }
    function updateCombat(){
      const reduction=read('reduction'),crit=read('crit'),evade=read('evade');
      $('#stat-combat-results').innerHTML=combatResult('reduction',reduction)+combatResult('crit',crit)+combatResult('evadeNormal',evade)+combatResult('evadeBoss',evade);
    }
    function updateBonuses(){
      const rows=data.observations.map(record=>{
        const sum=math.sumBonuses(read(record.id+'Gear'),read(record.id+'Other'));
        return [esc(record.name),sum?format(sum.gear):'—',sum?format(sum.other):'—',sum?`<strong data-bonus-total="${record.id}">+${format(sum.total)}</strong>`:'Javítsd a megadott értékeket',status('unknown','Nem állapítható meg')];
      });
      $('#stat-bonus-results').innerHTML=table(['Bónusz','Felszerelésből','Egyéb forrásokból','Teljes számtani összeg','Ténylegesen érvényesül'],rows);
    }
    function afterRender(){
      for(const id of ['stat-combat-form','stat-bonus-form']){
        const form=$('#'+id);form.addEventListener('submit',event=>event.preventDefault());
        form.addEventListener('input',event=>{if(event.target.name in values)values[event.target.name]=event.target.value;id==='stat-combat-form'?updateCombat():updateBonuses();});
      }
      $('#stat-reset').addEventListener('click',()=>{Object.assign(values,defaults);for(const [name,value] of Object.entries(values))$('#stat-'+name).value=value;updateCombat();updateBonuses();});
      updateCombat();updateBonuses();
    }
    return {page,afterRender};
  }
};
