/* Központi statlimit-adatok. A cap százalékban szerepel, nem 0–1 arányként. */
(() => {
  const saved='05_kasztok_kepessegek_harcertek.json';
  const critical=Object.freeze({
    baseMultiplier:1.5,damageBonusCap:75,chanceCap:50,
    source:saved+' · harcero.combat.hero.critMult; harcero.rules.supportCaps.critDamage; harcero.rules.critCap',
    tiers:Object.freeze(['T1','T2','T3','T4','T5']),
    weaponBands:Object.freeze([
      {min:1,max:14,bonuses:[6,12,20,28,40]},
      {min:15,max:25,bonuses:[6,12,20,28,40]},
      {min:26,max:36,bonuses:[6.2,12.4,20.6,28.8,41.2]},
      {min:37,max:45,bonuses:[6.4,12.7,21.2,29.7,42.4]},
      {min:46,max:53,bonuses:[6.5,13.1,21.8,30.5,43.6]},
      {min:54,max:60,bonuses:[6.7,13.4,22.4,31.4,44.8]}
    ].map(band=>Object.freeze({...band,bonuses:Object.freeze(band.bonuses)}))),
    weaponSource:'2026-11-06-i klienskivonat: spine.lines.percent (a projektgazda által megadott szintsávok). Helyben egyeztetett alaptier: 02_kovacsolas_bonuses_kovek.json · stones.items.line.tiers.critDamage. A helyi tematikus kivonat nem tartalmazza a teljes magasabb szintű spine.lines.percent sávlistát.'
  });
  const supportCaps=Object.freeze({skillDamage:50,vsBoss:35,potionHeal:25,lifesteal:8,damageTaken:20});
  const limits=[
    {id:'reduction',name:'Védelem (sebzéscsökkentés)',cap:75,reliability:'confirmed',status:'Megerősített',icon:'shield',source:saved+' · harcero.rules.reductionCap = 0.75',explanation:'A tényleges sebzéscsökkentés maximuma. Nem a nyers védelmi pontérték korlátja; pontból százalékot nem számolunk.'},
    {id:'crit',name:'Kritikus esély',cap:critical.chanceCap,reliability:'confirmed',status:'Megerősített',icon:'swords',source:saved+' · harcero.rules.critCap = 0.5',explanation:'Annak valószínűsége, hogy egy találat kritikus. Külön érték a kritikus találat sebzésszorzójától.'},
    {id:'critDamage',name:'Kritikus sebzésbónusz',cap:critical.damageBonusCap,reliability:'confirmed',status:'Megerősített kliensadat',icon:'swords',source:saved+' · harcero.rules.supportCaps.critDamage = 0.75',explanation:'Az 1,5× alapszorzóhoz hozzáadódó bónusz legfeljebb +75%: a kritikus szorzó így legfeljebb 2,25×. Nem a kritikus esély korlátja.'},
    {id:'evadeBoss',name:'Összes kitérés – harci limit',cap:12,reliability:'confirmed',status:'Content API-val egyeztetve',icon:'claw',source:'harcero.rules.evadeCap = 0.12 · data/bonus-system-evidence.json',explanation:'Az összesített harci/Harcerő szabály kulcsa. A normál kitérés 35%-a külön klienskulcsban szerepel; nem vonjuk össze a két korlátot.'},
    {id:'evadeNormal',name:'Kitérés normál ellenfelek ellen',cap:35,reliability:'confirmed',status:'Content API-val egyeztetve',icon:'compass',source:'harcero.rules.monsterEvadeCap és harcero.combat.rules.evadeMax = 0.35; a játék súgója is külön normálkorlátot említ.',explanation:'Normál ellenfelekhez tartozó klienskorlát. Az összesített harci szabály külön 12%-os értéke másik kulcs.'},
    ...Object.entries(supportCaps).map(([id,cap])=>({id,name:{skillDamage:'Képesség-sebzésbónusz',vsBoss:'Bossok elleni bónusz',potionHeal:'Gyógyital-hatás bónusza',lifesteal:'Életlopás',damageTaken:'Sebzéscsökkentési tárgybónusz'}[id],cap,reliability:'confirmed',status:'Content API-val egyeztetve',icon:'spark',source:'harcero.rules.supportCaps.'+id+'; harcero.combat.hero.supportCaps.'+id+' · data/bonus-system-evidence.json',explanation:id==='damageTaken'?'Külön támogató tárgybónuszkorlát, nem a védelemből származó 75%-os teljes sebzéscsökkentés.':'A kliens támogatóbónusz-korlátja. Nem az XP-/nyang-/zsákmányforrások közös plafonja.'})),
    {id:'attack',name:'Támadás / sebzés',cap:null,maximum:'Nincs ismert maximum',reliability:'unknown',status:'Nem igazolt',icon:'swords',source:'A content API nem ad igazolt globális plafont. polish.cap.attack = 15 csak polírkomponens.',explanation:'Nincs igazolt plafon. Ez nem bizonyítja, hogy a támadás vagy a sebzés matematikailag végtelenül növelhető.'},
    {id:'hp',name:'Életerő (HP)',cap:null,maximum:'Nincs ismert maximum',reliability:'unknown',status:'Nem igazolt',icon:'shield',source:'A content API nem ad igazolt globális plafont. polish.cap.maxHp = 150 csak polírkomponens.',explanation:'Nincs igazolt plafon. A korlát hiányára vonatkozó bizonyíték nélkül nem állítunk korlátlan növelhetőséget.'},
    {id:'defenceRaw',name:'Nyers védelem (pontérték)',cap:null,maximum:'Nincs igazolt globális plafon',reliability:'unknown',status:'A teljes karakterre nem igazolt',icon:'shield',source:'A content API nem ad igazolt teljes védelem-pontplafont. polish.cap.defence = 18 csak polírkomponens.',explanation:'A nyers védelmi pont, a sebzéscsökkentés és a damageTaken tárgybónusz három külön fogalom. A 75% nem védelmipont-maximum.'},
    ...globalThis.StonestormBonuses.reward.stats.map(stat=>({id:stat.id,name:stat.name,cap:globalThis.StonestormBonuses.reward.baseCap,capLabel:'100% normál + legfeljebb 50 százalékpont fizetős',reliability:'confirmed',status:'Két külön plafon',icon:stat.id==='nyang'?'sun':'spark',source:globalThis.StonestormBonuses.reward.source,explanation:'A normál és a fizetős rész külön korlátozott. A +150% elméleti maximum, nem minden játékos automatikus bónusza.'}))
  ].map(Object.freeze);
  const observations=[
    {id:'xp',name:'XP-bónusz',gear:31.1,total:84.7},
    {id:'nyang',name:'Nyangbónusz',gear:116.4,total:130}
  ].map(record=>Object.freeze({...record,reliability:'observed',source:'A projektgazda által közölt játékos-képernyőképek adatai, 2026-11-08.'}));
  globalThis.StonestormStats=Object.freeze({limits:Object.freeze(limits),byId:Object.freeze(Object.fromEntries(limits.map(stat=>[stat.id,stat]))),observations:Object.freeze(observations),critical});
})();
