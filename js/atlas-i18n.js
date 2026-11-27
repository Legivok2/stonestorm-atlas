/* Atlas translations are independent of the Companion and Workspace settings. */
(() => {
  'use strict';

  const storageKey='stonestorm.atlas.locale.v1';
  const dictionaries={
    hu:{
      'navigation.overview':'Áttekintés',
      'navigation.equipment':'Felszerelések',
      'navigation.sets':'Szettcsaládok',
      'navigation.pets':'Kísérők',
      'navigation.mounts':'Hátasok',
      'navigation.world':'Világ és bossok',
      'navigation.guild':'Céhrendszer',
      'navigation.home':'Otthon és kutatás',
      'navigation.mechanics':'Energia és fejlődés',
      'navigation.classes':'Kasztok és királyságok',
      'navigation.materials':'Anyagok és tárgyak',
      'navigation.arena':'Aréna',
      'navigation.gallery':'Képtár',
      'navigation.compare':'Felszerelés-összehasonlító',
      'navigation.planner':'Karaktertervező',
      'navigation.stat-limits':'Stat limitek',
      'navigation.bonuses':'Bónuszrendszer',
      'navigation.updates':'Atlas frissítések',
      'navigation.upcoming':'Közelgő tartalmak',
      'navigation.sources':'Források és státusz',
      'header.title':'Stonestorm Atlas – Magyar Wiki és Kalauz',
      'header.description':'Magyar Stonestorm Wiki és Atlas: felszerelések, szettek, kísérők, hátasok, bossok, céhes kalkulátorok és kereshető kezdőkalauz.',
      'header.ogDescription':'Egyetlen magyar kódex: játékadatok, összekapcsolt adatlapok, kalkulátorok és részletes kezdőkalauz.',
      'header.skip':'Ugrás a tartalomra',
      'header.homeLabel':'Stonestorm Atlas – kezdőlap',
      'header.openNavigation':'Navigáció megnyitása',
      'header.closeNavigation':'Navigáció bezárása',
      'header.navigation':'Fő navigáció',
      'header.home':'Kezdőlap',
      'header.compare':'Összehasonlító',
      'header.guide':'Kezdőkalauz',
      'header.official':'Hivatalos játék',
      'header.newTab':' (új lapon)',
      'sidebar.close':'Kategóriamenü bezárása',
      'sidebar.subtitle':'A VIHAR KÓDEXE',
      'sidebar.categories':'Atlas kategóriák',
      'sidebar.stats':'A KÓDEX SZÁMOKBAN',
      'sidebar.sources':'Források és ismert hiányok ↗',
      'sidebar.items':'felszerelés',
      'sidebar.pets':'kísérő',
      'sidebar.mounts':'hátas',
      'sidebar.enemies':'ellenfél',
      'sidebar.buildings':'céhes épület',
      'workspace.openCategories':'Atlas kategóriák megnyitása',
      'workspace.chapters':'Fejezetek',
      'workspace.knowledge':'STONESTORM / TUDÁSTÁR',
      'workspace.searchLabel':'Globális keresés az Atlasban és a kalauzban',
      'workspace.searchPlaceholder':'Keresés az Atlasban…',
      'workspace.clearSearch':'Atlas keresés törlése',
      'workspace.independent':'Független rajongói enciklopédia',
      'workspace.dataVersion':'ADATVERZIÓ · {version}',
      'workspace.searchResults':'Keresési eredmények',
      'group.explore':'Felfedezés',
      'group.character':'A karaktered',
      'group.community':'Közösség és otthon',
      'group.planning':'Tervezés és tudás',
      'overview.eyebrow':'A VIHAR VILÁGA · MAGYAR KÓDEX',
      'overview.heroAlt':'Bambuszerdő a holdfényben · játékbeli hangulatillusztráció',
      'overview.intro1':'A következő kalandod itt kezdődik.',
      'overview.intro2':'Ismerd meg a világot. Tervezd meg a hősöd.',
      'overview.searchLabel':'Mit keresel az Atlasban?',
      'overview.searchPlaceholder':'Tárgy, kísérő, boss…',
      'overview.searchButton':'Keresés indítása',
      'overview.caption':'BAMBUSZERDŐ · A STONESTORM VILÁGA',
      'overview.choose':'VÁLASZD KI A KÖVETKEZŐ FEJEZETET',
      'overview.discover':'Fedezd fel a világot',
      'overview.illustrations':'helyi illusztráció',
      'overview.petCopy':'Társak öt fejlődési formában.',
      'overview.equipmentCopy':'Találd meg a következő fegyvered.',
      'overview.worldCopy':'Pályák, ellenfelek és kazamaták.',
      'overview.species':'{count} FAJ',
      'overview.items':'{count} TÁRGY',
      'overview.maps':'{count} PÁLYA',
      'overview.explore':'Felfedezem',
      'overview.home':'Otthon',
      'overview.homeCopy':'Építsd fel a saját menedéked.',
      'overview.arenaCopy':'Becsület vagy a Bandita Liga trónja?',
      'overview.guildCopy':'Közös építkezés, közös fejlődés.',
      'overview.firstSteps':'AZ ELSŐ LÉPÉSEK',
      'overview.newcomer':'Most érkezel a világba?',
      'overview.guideCopy':'A kezdőkalauz a karakteralkotástól a napi rutinig vezet végig.',
      'overview.guideLink':'Kezdőkalauz →',
      'overview.verified':'ELLENŐRIZHETŐ TUDÁS',
      'overview.known':'Amit tudunk. Amit még kutatunk.',
      'overview.sourcesCopy':'Dátumozott források, jelölt eltérések és külön kezelt megfigyelések.',
      'overview.sourcesLink':'Frissítések és források →',
      'overview.galleryCopy':'Két megjelenés egymás mellett',
      'overview.plannerCopy':'Építs, hasonlíts össze, ments',
      'overview.galleryDetail':'eredeti grafika',
      'guide.libraryEyebrow':'MINDIG VAN EGY KÖVETKEZŐ KALAND',
      'guide.libraryTitle':'A részletek, amikor szükséged van rájuk.',
      'guide.libraryTag':'Bővíthető kézikönyv',
      'guide.libraryIntro':'A teljes Discord-útmutató kezdőknek fontos témái, rövid fejezetekben. Nyisd ki, ami éppen érdekel, vagy keress a lenti tudásbázisban.',
      'guide.searchEyebrow':'JÓ, HA KÉZNÉL VAN',
      'guide.searchTitle':'Kérdezz. Keress. Indulj tovább.',
      'guide.searchTag':'Tudásbázis és GYIK',
      'guide.searchLabel':'Keresés az útmutató tudásbázisában',
      'guide.searchPlaceholder':'Miben segíthetünk? Például: kovácsolás, kaszt, napi rutin…',
      'guide.clear':'Törlés',
      'guide.filtersLabel':'Tudásbázis témaszűrő',
      'guide.all':'Minden téma',
      'guide.character':'Karakter',
      'guide.start':'Első lépések',
      'guide.daily':'Napi rutin',
      'guide.gear':'Felszerelés',
      'guide.adventure':'Kalandok',
      'guide.community':'Közösség',
      'guide.shop':'Kódok és Shop',
      'search.results':'{count} találat'
    },
    en:{
      'navigation.overview':'Overview',
      'navigation.equipment':'Equipment',
      'navigation.sets':'Equipment sets',
      'navigation.pets':'Companions',
      'navigation.mounts':'Mounts',
      'navigation.world':'World and bosses',
      'navigation.guild':'Guild',
      'navigation.home':'Home and research',
      'navigation.mechanics':'Energy and progression',
      'navigation.classes':'Classes and kingdoms',
      'navigation.materials':'Materials and items',
      'navigation.arena':'Arena',
      'navigation.gallery':'Gallery',
      'navigation.compare':'Equipment comparison',
      'navigation.planner':'Character planner',
      'navigation.stat-limits':'Stat limits',
      'navigation.bonuses':'Bonus system',
      'navigation.updates':'Atlas updates',
      'navigation.upcoming':'Upcoming content',
      'navigation.sources':'Sources and status',
      'header.title':'Stonestorm Atlas – Wiki and Guide',
      'header.description':'Stonestorm Wiki and Atlas: equipment, sets, companions, mounts, bosses, guild calculators and a searchable beginner guide.',
      'header.ogDescription':'A codex of game data, connected records, calculators and a detailed beginner guide.',
      'header.skip':'Skip to content',
      'header.homeLabel':'Stonestorm Atlas – home',
      'header.openNavigation':'Open navigation',
      'header.closeNavigation':'Close navigation',
      'header.navigation':'Main navigation',
      'header.home':'Home',
      'header.compare':'Comparison',
      'header.guide':'Beginner guide',
      'header.official':'Official game',
      'header.newTab':' (opens in a new tab)',
      'sidebar.close':'Close category menu',
      'sidebar.subtitle':'THE STORM CODEX',
      'sidebar.categories':'Atlas categories',
      'sidebar.stats':'THE CODEX IN NUMBERS',
      'sidebar.sources':'Sources and known gaps ↗',
      'sidebar.items':'equipment items',
      'sidebar.pets':'companions',
      'sidebar.mounts':'mounts',
      'sidebar.enemies':'enemies',
      'sidebar.buildings':'guild buildings',
      'workspace.openCategories':'Open Atlas categories',
      'workspace.chapters':'Chapters',
      'workspace.knowledge':'STONESTORM / KNOWLEDGE BASE',
      'workspace.searchLabel':'Search the Atlas and guide',
      'workspace.searchPlaceholder':'Search the Atlas…',
      'workspace.clearSearch':'Clear Atlas search',
      'workspace.independent':'Independent fan encyclopedia',
      'workspace.dataVersion':'DATA VERSION · {version}',
      'workspace.searchResults':'Search results',
      'group.explore':'Explore',
      'group.character':'Your character',
      'group.community':'Community and home',
      'group.planning':'Planning and knowledge',
      'overview.eyebrow':'THE WORLD OF THE STORM · CODEX',
      'overview.heroAlt':'Bamboo forest in the moonlight · in-game illustration',
      'overview.intro1':'Your next adventure starts here.',
      'overview.intro2':'Discover the world. Plan your hero.',
      'overview.searchLabel':'What are you looking for in the Atlas?',
      'overview.searchPlaceholder':'Item, companion, boss…',
      'overview.searchButton':'Start search',
      'overview.caption':'BAMBOO FOREST · THE WORLD OF STONESTORM',
      'overview.choose':'CHOOSE YOUR NEXT CHAPTER',
      'overview.discover':'Explore the world',
      'overview.illustrations':'local illustrations',
      'overview.petCopy':'Companions with five evolution forms.',
      'overview.equipmentCopy':'Find your next weapon.',
      'overview.worldCopy':'Maps, enemies and dungeons.',
      'overview.species':'{count} SPECIES',
      'overview.items':'{count} ITEMS',
      'overview.maps':'{count} MAPS',
      'overview.explore':'Explore',
      'overview.home':'Home',
      'overview.homeCopy':'Build your own sanctuary.',
      'overview.arenaCopy':'Honour or the Bandit League throne?',
      'overview.guildCopy':'Build and progress together.',
      'overview.firstSteps':'FIRST STEPS',
      'overview.newcomer':'New to this world?',
      'overview.guideCopy':'The beginner guide takes you from creating a character to your daily routine.',
      'overview.guideLink':'Beginner guide →',
      'overview.verified':'VERIFIABLE KNOWLEDGE',
      'overview.known':'What we know. What we are still researching.',
      'overview.sourcesCopy':'Dated sources, flagged discrepancies and separately documented observations.',
      'overview.sourcesLink':'Updates and sources →',
      'overview.galleryCopy':'Two appearances side by side',
      'overview.plannerCopy':'Build, compare and save',
      'overview.galleryDetail':'original illustrations',
      'guide.libraryEyebrow':'THERE IS ALWAYS ANOTHER ADVENTURE',
      'guide.libraryTitle':'The details, when you need them.',
      'guide.libraryTag':'Expandable handbook',
      'guide.libraryIntro':'The full Discord guide’s essential beginner topics, in short chapters. Open what interests you, or search the knowledge base below.',
      'guide.searchEyebrow':'GOOD TO HAVE AT HAND',
      'guide.searchTitle':'Ask. Search. Continue your journey.',
      'guide.searchTag':'Knowledge base and FAQ',
      'guide.searchLabel':'Search the guide knowledge base',
      'guide.searchPlaceholder':'How can we help? Try: forging, class, daily routine…',
      'guide.clear':'Clear',
      'guide.filtersLabel':'Knowledge base topic filter',
      'guide.all':'All topics',
      'guide.character':'Character',
      'guide.start':'First steps',
      'guide.daily':'Daily routine',
      'guide.gear':'Equipment',
      'guide.adventure':'Adventures',
      'guide.community':'Community',
      'guide.shop':'Codes and Shop',
      'search.results':'{count} results'
    }
  };
  // Names are paired by their stable IDs in the saved official client locales.
  const gameNames=[
    ['pet.pet_wolf','Farkaskölyök','Wolf pup'],
    ['pet.pet_boar','Kismalac','Piglet'],
    ['pet.pet_bear','Medvebocs','Bear cub'],
    ['pet.pet_monkey','Kis majom','Little monkey'],
    ['pet.pet_falcon','Sólyom','Falcon'],
    ['pet.pet_dog','Kutya','Dog'],
    ['pet.pet_goblin_pup','Koboldkölyök','Goblin pup'],
    ['pet.pet_ram','Kiskos','Little ram'],
    ['pet.pet_vulture','Keselyűfióka','Vulture chick'],
    ['pet.pet_camel','Tevecsikó','Camel calf'],
    ['pet.pet_fennec','Fennek','Fennec fox'],
    ['pet.pet_scarab','Szkarabeusz','Scarab'],
    ['pet.pet_penguin','Pingvin','Penguin'],
    ['pet.pet_snow_leopard','Hópárduckölyök','Snow leopard cub'],
    ['pet.pet_yeti_cub','Jetibocs','Yeti cub'],
    ['pet.pet_ember_imp','Parázsmanó','Ember imp'],
    ['pet.pet_lava_turtle','Lávateknős','Lava turtle'],
    ['pet.pet_salamander','Szalamandra','Salamander'],
    ['pet.pet_u_wild','Mohaagancs','Mossantler'],
    ['pet.pet_u_monkey','Aranymajom','Golden Monkey'],
    ['pet.pet_u_spider','Holdfonó','Moonspinner'],
    ['pet.pet_u_dragon','Viharfióka','Stormling'],
    ['petSkill.first_strike','Előcsapás','First Strike'],
    ['petSkill.shield_open','Nyitópajzs','Opening Shield'],
    ['petSkill.crit_dmg','Éles karom','Keen Claws'],
    ['petSkill.regen','Gyógyító nyalás','Soothing Lick'],
    ['petSkill.thorns','Tüskés bunda','Thorned Coat'],
    ['petSkill.potion_boost','Gyógyfűszimat','Herb Sense'],
    ['petSkill.idle_xp','Tanulékony','Quick Learner'],
    ['petSkill.idle_nyang','Kincsszimat','Coin Sniffer'],
    ['petSkill.loot_luck','Szerencsemancs','Lucky Paw'],
    ['petSkill.keen_nose','Jó szimat','Keen Nose']
  ];
  for(const [id,hu,en] of gameNames){
    dictionaries.hu['game.'+id]=hu;
    dictionaries.en['game.'+id]=en;
  }
  Object.freeze(dictionaries.hu);
  Object.freeze(dictionaries.en);
  Object.freeze(dictionaries);
  const normalize=value=>value==='en'?'en':'hu';
  let locale='hu';
  try{
    locale=normalize(localStorage.getItem(storageKey));
  }catch(error){
    console.warn('Atlas language preference could not be read:',error);
  }
  const listeners=new Set();
  const reported=new Set();
  const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[char]);
  function t(key,params={}){
    const has=(dict,name)=>Object.prototype.hasOwnProperty.call(dict,name);
    if(!has(dictionaries[locale],key)){
      const missing=locale+':'+key;
      if(!reported.has(missing)){
        console.warn('Missing Atlas translation:',missing);
        reported.add(missing);
      }
    }
    const value=has(dictionaries[locale],key)?dictionaries[locale][key]:has(dictionaries.hu,key)?dictionaries.hu[key]:undefined;
    if(value===undefined)return key;
    return value.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g,(_,name)=>{
      if(!Object.prototype.hasOwnProperty.call(params,name))throw Error(`Missing Atlas translation parameter: ${key}.${name}`);
      return String(params[name]);
    });
  }
  function setLocale(value){
    const next=normalize(value);
    try{
      localStorage.setItem(storageKey,next);
    }catch(error){
      console.warn('Atlas language preference could not be saved:',error);
    }
    if(next!==locale){
      locale=next;
      for(const listener of listeners)listener(locale);
    }
    return locale;
  }
  const formatLocale=()=>locale==='en'?'en-US':'hu-HU';
  function gameNameKey(kind,record){
    if(!record||!['pet','skill'].includes(kind))return null;
    const key='game.'+(kind==='skill'?'petSkill':kind)+'.'+record.id;
    return Object.hasOwn(dictionaries.hu,key)&&dictionaries.hu[key]===record.name?key:null;
  }
  globalThis.AtlasI18n=Object.freeze({
    t,
    tHtml:(key,params)=>escapeHtml(t(key,params)),
    escapeHtml,
    getLocale:()=>locale,
    setLocale,
    formatNumber:(value,options)=>new Intl.NumberFormat(formatLocale(),options).format(value),
    formatDate:(value,options)=>new Intl.DateTimeFormat(formatLocale(),options).format(value),
    gameNameKey,
    onChange(listener){listeners.add(listener);return ()=>listeners.delete(listener);},
    dictionaries,
    storageKey
  });
})();
