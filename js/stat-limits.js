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
  const limits=[
    {id:'reduction',name:'Védelem (sebzéscsökkentés)',cap:75,reliability:'confirmed',status:'Megerősített',icon:'shield',source:saved+' · harcero.rules.reductionCap = 0.75',explanation:'A tényleges sebzéscsökkentés maximuma. Nem a nyers védelmi pontérték korlátja; pontból százalékot nem számolunk.'},
    {id:'crit',name:'Kritikus esély',cap:critical.chanceCap,reliability:'confirmed',status:'Megerősített',icon:'swords',source:saved+' · harcero.rules.critCap = 0.5',explanation:'Annak valószínűsége, hogy egy találat kritikus. Külön érték a kritikus találat sebzésszorzójától.'},
    {id:'critDamage',name:'Kritikus sebzésbónusz',cap:critical.damageBonusCap,reliability:'confirmed',status:'Megerősített kliensadat',icon:'swords',source:saved+' · harcero.rules.supportCaps.critDamage = 0.75',explanation:'Az 1,5× alapszorzóhoz hozzáadódó bónusz legfeljebb +75%: a kritikus szorzó így legfeljebb 2,25×. Nem a kritikus esély korlátja.'},
    {id:'evadeBoss',name:'Kitérés bossok ellen',cap:12,reliability:'confirmed',status:'Megerősített',icon:'claw',source:saved+' · harcero.rules.evadeCap = 0.12',explanation:'Bossok ellen külön, alacsonyabb plafon érvényesül. Ugyanazt a karakter-kitérést ezzel a limittel is ellenőrizzük.'},
    {id:'evadeNormal',name:'Kitérés normál ellenfelek ellen',cap:35,reliability:'confirmed',status:'Játékbeli súgó alapján',icon:'compass',source:'Játékbeli súgó; a projektgazda által megadott 35%. A mentett magyar tipCapped súgószöveg külön boss- és normálkorlátot említ.',explanation:'A normál ellenfelekre megadott súgóadat. Nem helyettesítjük a bossokra vonatkozó 12%-os értékkel.'},
    {id:'attack',name:'Támadás / sebzés',cap:null,maximum:'Nincs ismert maximum',reliability:'unknown',status:'Nem igazolt',icon:'swords',source:'Nem áll rendelkezésre igazolt felső korlát.',explanation:'Nincs igazolt plafon. Ez nem bizonyítja, hogy a támadás vagy a sebzés matematikailag végtelenül növelhető.'},
    {id:'hp',name:'Életerő (HP)',cap:null,maximum:'Nincs ismert maximum',reliability:'unknown',status:'Nem igazolt',icon:'shield',source:'Nem áll rendelkezésre igazolt felső korlát.',explanation:'Nincs igazolt plafon. A korlát hiányára vonatkozó bizonyíték nélkül nem állítunk korlátlan növelhetőséget.'},
    ...globalThis.StonestormBonuses.reward.stats.map(stat=>({id:stat.id,name:stat.name,cap:globalThis.StonestormBonuses.reward.baseCap,capLabel:'100% alapplafon',reliability:'observed',status:'Normál plafon; különleges kivételek',icon:stat.id==='nyang'?'sun':'spark',source:globalThis.StonestormBonuses.reward.source,explanation:'A normál bónuszok alapplafonja. A megfigyelt Császári menlevél és egyes különleges források ezen felül is hathatnak; a forrásokat külön kell besorolni.'}))
  ].map(Object.freeze);
  const observations=[
    {id:'xp',name:'XP-bónusz',gear:31.1,total:84.7},
    {id:'nyang',name:'Nyangbónusz',gear:116.4,total:130}
  ].map(record=>Object.freeze({...record,reliability:'observed',source:'A projektgazda által közölt játékos-képernyőképek adatai, 2026-11-08.'}));
  globalThis.StonestormStats=Object.freeze({limits:Object.freeze(limits),byId:Object.freeze(Object.fromEntries(limits.map(stat=>[stat.id,stat]))),observations:Object.freeze(observations),critical});
})();
