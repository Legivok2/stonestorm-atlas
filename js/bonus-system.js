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
    {id:'equipment',name:'Felszerelések',mode:'normal',reliability:'confirmed',explanation:'Csak a felszerelések saját jutalombónusza. A menlevelet és a többi külső forrást ne írd ide.',source:'A játék közölt leírása: a normál bónuszok a 100%-os plafonba számítanak.'},
    {id:'imperial',name:'Császári menlevél',mode:'paid',reliability:'observed',explanation:'XP +25, nyang +20, zsákmány +10 százalékpont. A VÉ-s főzetekkel közös 50 százalékpontos fizetős keretbe számít.',source:'Közölt játékbeli leírás és menlevélmegfigyelés; vip.bonuses magyar szöveg.'},
    {id:'potionsNyang',name:'Főzetek – nyangért',mode:'normal',reliability:'confirmed',explanation:'A normál 100%-os plafonba számítanak. A Viharérméért vásárolt főzetet a másik sorba írd.',source:'Helyi magyar súgó: capNyang – a szokásos szorzóplafonba számít.'},
    {id:'potionsCoins',name:'Főzetek – Viharérméért',mode:'paid',reliability:'confirmed',explanation:'A normál plafon után, a menlevéllel közös +50 százalékpontos fizetős keretben hatnak.',source:'Közölt játékleírás; capCoins – plafon fölött, legfeljebb +50%-ig.'},
    ...[
      ['research','Kutatások','A kutatásból származó, ténylegesen kijelzett jutalombónusz.'],
      ['path','Fejlődési út','A fejlődési út jutalombónusza.'],
      ['pets','Kísérők','A kísérő saját jutalombónusza; nem a felszerelés része. A pets.v3.book.capPerKey = 0.012 (1,2%) kizárólag a kísérőkönyv komponensének korlátja, nem az összes kísérőhatásé.'],
      ['guild','Céh','A céhes jutalombónusz; nem a felszerelés része.'],
      ['stones','Szellemkövek','Csak igazolt jutalombónuszt adj meg. A mentett spirit-típusokból nem találunk ki XP-, nyang- vagy zsákmányértéket.'],
      ['sets','Szettek','Csak a külön szettbónusz; a felszerelésben már szereplő értéket ne számold kétszer.'],
      ['temporary','Egyéb normál ideiglenes hatások','Nem VÉ-s, nem különleges erősítések. A fizetős főzetet külön sorban kezeld.']
    ].map(([id,name,explanation])=>({id,name,mode:'normal',reliability:'confirmed',explanation,source:'A játék közölt összeadási szabálya: a nem különleges, nem VÉ-s bónusz a normál keretbe számít. Az összeget a karaktered adatai alapján add meg.'}))
  ].map(Object.freeze);
  const reward=Object.freeze({baseCap:100,paidCap:50,imperial:Object.freeze({xp:25,nyang:20,drop:10}),examples:Object.freeze({xp:Object.freeze({equipment:48.5,pets:9.9,guild:13}),nyang:Object.freeze({equipment:106.3,pets:0.3,guild:13}),drop:Object.freeze({})}),stats:Object.freeze([{id:'xp',name:'XP-bónusz'},{id:'nyang',name:'Nyangbónusz'},{id:'drop',name:'Zsákmánybónusz'}].map(Object.freeze)),reliability:'confirmed',formula:'Érvényes = min(normál összeg, 100) + min(fizetős összeg, 50). Elvesző = gyűjtött összeg − érvényes összeg. Minden érték százalékpont.',source:'A játék közölt leírása; a nyangos és VÉ-s főzetek capNyang/capCoins súgója. A reward.cap = 2 a normál 100%-os alaprésszel áll összhangban. Az elméleti 150% csak elegendő normál és fizetős forrás mellett érhető el.'});
  globalThis.StonestormBonuses=Object.freeze({entries:Object.freeze(entries),byId:Object.freeze(Object.fromEntries(entries.map(entry=>[entry.id,entry]))),pools,equipmentPools,sources:Object.freeze(sources),reward,evidence:Object.freeze({file:'data/bonus-system-evidence.json',checkedAt:'2026-11-09',version:'658dc911d321',url:'https://stonestorm.gg/api/content'}),poolForSlot:slot=>pools[equipmentPools[slot]]??null});
})();
