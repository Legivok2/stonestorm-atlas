/* Egységes tárgybónuszok, külön poolok és forrásbesorolások. Minden jutalombónusz százalékpontban. */
(() => {
  const entries=[
    ['vsAnimal','Állatok ellen'],['vsBandit','Banditák ellen'],['vsBoss','Bossok ellen'],['lifesteal','Életlopás'],['vsUndead','Élőhalottak ellen'],['potionHeal','Gyógyital-hatás'],['vsIce','Jeges lények ellen'],['skillDamage','Képesség-sebzés'],['evade','Kitérés'],['crit','Kritikus esély'],['critDamage','Kritikus sebzés'],['maxHp','Max. HP'],['nyang','Nyangbónusz'],['vsOrc','Orkok ellen'],['attack','Sebzés'],['damageTaken','Sebzéscsökkentés'],['vsDesert','Sivatagi lények ellen'],['vsFire','Tüzes lények ellen'],['defence','Védelem'],['xp','XP-bónusz']
  ].map(([id,name])=>Object.freeze({id,name,unit:['maxHp','attack','defence'].includes(id)?'flat':'percent'}));
  const pools=Object.freeze({
    weapon:Object.freeze(['attack','crit','vsBoss','skillDamage','critDamage']),
    armor:Object.freeze(['maxHp','defence','evade','potionHeal','damageTaken']),
    jewel:Object.freeze(['attack','maxHp','crit','defence','vsBoss','potionHeal','skillDamage','critDamage','damageTaken','evade'])
  });
  // Csak az azonos nevű slotkapcsolatot használjuk; a további altípusokat nem találjuk ki.
  const equipmentPools=Object.freeze({weapon:'weapon',armor:'armor',helmet:null,shield:null,boots:null,bracelet:null,necklace:null,earrings:null});
  const sources=[
    {id:'equipment',name:'Felszerelések',mode:'normal',reliability:'observed',explanation:'A normál plafonba számoljuk a megadott modellben. A típuspool nem azt jelenti, hogy minden bónusz minden tárgyon elérhető.',source:'Projektgazdai alapplafon-szabály; a poolok külön nyilvános kliensadatok.'},
    {id:'imperial',name:'Császári menlevél',mode:'overflow',reliability:'observed',explanation:'Megfigyelt kivétel: XP +25, nyang +20, zsákmány +10 százalékpont. A teljes összegben egyszer szerepel.',source:'Projektgazdai megfigyelés (2026-11-09); a mennyiségeket a mentett magyar vip.bonuses szöveg is alátámasztja.'},
    {id:'potions',name:'Főzetek',mode:'unknown',reliability:'unknown',explanation:'A nyangért vett változat a súgó szerint a normál plafonba számít. A VÉ-s változat átlépheti azt, a szöveg legfeljebb +50%-ot említ. Az összevont forrás és a +50% pontos hatóköre még ellenőrizendő.',source:'08_anyagok_penzugyek_boltok.json · capNyang / capCoins: nyangos = normál, VÉ-s = plafon fölött. Nem vonjuk össze igazolás nélkül.'},
    {id:'research',name:'Kutatások',mode:'unknown',reliability:'unknown',explanation:'A kutatásbónusz létezése nem igazolja, hogy a plafon előtt vagy után alkalmazza a szerver.',source:'09_otthon_tanulmanyok_egyeb_fejlodes.json; a plafonbeli besorolás nincs igazolva.'},
    {id:'path',name:'Fejlődési út',mode:'unknown',reliability:'unknown',explanation:'Az alapplafonhoz való viszony még ellenőrizendő.',source:'A forrásonkénti szerveres jutalomsorrend nem áll rendelkezésre.'},
    {id:'pets',name:'Kísérők',mode:'unknown',reliability:'unknown',explanation:'A faj-, trait- és könyvhatásokat nem minősítjük automatikusan plafon feletti jutalombónusznak.',source:'03_kiserok.json; plafonbeli besorolás nem igazolt.'},
    {id:'guild',name:'Céh',mode:'unknown',reliability:'unknown',explanation:'A céhes XP-/nyanghatás pontos jutalomszámítási helye ellenőrizendő.',source:'11_cehes_epuletek_szintek_es_szabalyok.json; a hatások ismertek, a plafonhoz való viszony nem.'},
    {id:'stones',name:'Szellemkövek',mode:'unknown',reliability:'unknown',explanation:'A mentett spirit-típusokban nincs közvetlen XP-/nyang-/zsákmánykulcs. Egyéb kőhatásokra és jutalomkapcsolatra nem általánosítunk.',source:'02_kovacsolas_bonuses_kovek.json · stones.types; a jutalomplafon-besorolás nem igazolt.'},
    {id:'sets',name:'Szettek',mode:'unknown',reliability:'unknown',explanation:'Csak a konkrétan látott bónuszt add meg; a szettdarab alapértékeit ne számold ismét hozzá.',source:'01_felszerelesek_es_szettek.json · collectionFamilies; plafonsorrend nem igazolt.'},
    {id:'temporary',name:'Egyéb ideiglenes hatások',mode:'unknown',reliability:'unknown',explanation:'A hatás eredetétől függhet. Ismeretlen besorolás mellett csak feltételes eredményt mutatunk.',source:'Egyedi hatásonként ellenőrizendő.'}
  ].map(Object.freeze);
  const reward=Object.freeze({baseCap:100,imperial:Object.freeze({xp:25,nyang:20,drop:10}),stats:Object.freeze([{id:'xp',name:'XP-bónusz'},{id:'nyang',name:'Nyangbónusz'},{id:'drop',name:'Zsákmánybónusz'}].map(Object.freeze)),reliability:'observed',formula:'Érvényes = min(normál források összege, 100%) + különleges források összege.',source:'A projektgazda megfigyelt szabálya; a nyilvános reward.cap = 2 összhangban van a +100%-os alapplafonnal, de nem igazolja minden forrás szerveroldali besorolását.'});
  globalThis.StonestormBonuses=Object.freeze({entries:Object.freeze(entries),byId:Object.freeze(Object.fromEntries(entries.map(entry=>[entry.id,entry]))),pools,equipmentPools,sources:Object.freeze(sources),reward,evidence:Object.freeze({file:'data/bonus-system-evidence.json',checkedAt:'2026-11-09',version:'658dc911d321',url:'https://stonestorm.gg/api/content'}),poolForSlot:slot=>pools[equipmentPools[slot]]??null});
})();
