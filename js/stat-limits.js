/* Központi statlimit-adatok. A cap százalékban szerepel, nem 0–1 arányként. */
(() => {
  const saved='05_kasztok_kepessegek_harcertek.json';
  const limits=[
    {id:'reduction',name:'Védelem (sebzéscsökkentés)',cap:75,reliability:'confirmed',status:'Megerősített',icon:'shield',source:saved+' · harcero.rules.reductionCap = 0.75',explanation:'A tényleges sebzéscsökkentés maximuma. Nem a nyers védelmi pontérték korlátja; pontból százalékot nem számolunk.'},
    {id:'crit',name:'Kritikus esély',cap:50,reliability:'confirmed',status:'Megerősített',icon:'swords',source:saved+' · harcero.rules.critCap = 0.5',explanation:'A limit feletti kritikus esély nem növeli az itt számított, érvényesülő esélyt.'},
    {id:'evadeBoss',name:'Kitérés bossok ellen',cap:12,reliability:'confirmed',status:'Megerősített',icon:'claw',source:saved+' · harcero.rules.evadeCap = 0.12',explanation:'Bossok ellen külön, alacsonyabb plafon érvényesül. Ugyanazt a karakter-kitérést ezzel a limittel is ellenőrizzük.'},
    {id:'evadeNormal',name:'Kitérés normál ellenfelek ellen',cap:35,reliability:'confirmed',status:'Játékbeli súgó alapján',icon:'compass',source:'Játékbeli súgó; a projektgazda által megadott 35%. A mentett magyar tipCapped súgószöveg külön boss- és normálkorlátot említ.',explanation:'A normál ellenfelekre megadott súgóadat. Nem helyettesítjük a bossokra vonatkozó 12%-os értékkel.'},
    {id:'attack',name:'Támadás / sebzés',cap:null,maximum:'Nincs ismert maximum',reliability:'unknown',status:'Nem igazolt',icon:'swords',source:'Nem áll rendelkezésre igazolt felső korlát.',explanation:'Nincs igazolt plafon. Ez nem bizonyítja, hogy a támadás vagy a sebzés matematikailag végtelenül növelhető.'},
    {id:'hp',name:'Életerő (HP)',cap:null,maximum:'Nincs ismert maximum',reliability:'unknown',status:'Nem igazolt',icon:'shield',source:'Nem áll rendelkezésre igazolt felső korlát.',explanation:'Nincs igazolt plafon. A korlát hiányára vonatkozó bizonyíték nélkül nem állítunk korlátlan növelhetőséget.'},
    {id:'xp',name:'XP-bónusz',cap:null,maximum:'Ismeretlen',reliability:'unknown',status:'Kutatás alatt',icon:'spark',source:'A közölt játékosértékek elért értékek, nem maximummérések.',explanation:'A kalkulátor csak a megadott bónuszokat összegzi. A ténylegesen érvényesülő bónusz és az esetleges maximum nem ismert.'},
    {id:'nyang',name:'Nyangbónusz',cap:null,maximum:'Ismeretlen',reliability:'unknown',status:'Kutatás alatt',icon:'sun',source:'A közölt játékosértékek elért értékek, nem maximummérések.',explanation:'A kalkulátor csak összegzést végez; az elért nyangbónuszból nem következtetünk felső korlátra.'}
  ].map(Object.freeze);
  const observations=[
    {id:'xp',name:'XP-bónusz',gear:31.1,total:84.7},
    {id:'nyang',name:'Nyangbónusz',gear:116.4,total:130}
  ].map(record=>Object.freeze({...record,reliability:'observed',source:'A projektgazda által közölt játékos-képernyőképek adatai, 2026-11-08.'}));
  globalThis.StonestormStats=Object.freeze({limits:Object.freeze(limits),byId:Object.freeze(Object.fromEntries(limits.map(stat=>[stat.id,stat]))),observations:Object.freeze(observations)});
})();
