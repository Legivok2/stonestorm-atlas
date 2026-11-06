/* A szerkeszthető tudásbázis. Nincs fetch, modul vagy külső függőség: file:// alatt is betöltődik.
   Elsődleges forrás: a felhasználó által átadott hivatalos Discord-útmutató (2026. 10. 31.).
   Új bejegyzés: egyedi id, category, title, intro, sections[{heading?,items[]}], tip?. */
window.STONESTORM_CONTENT = {
  version: 1,
  // Csak az SS mappából átadott, a projekt gazdája által engedélyezett képek.
  // A srcset és a nagyítónézet a megadott stem alapján helyi WebP-fájlokat használ.
  media: [
    {
      id: "village",
      title: "Itt kezdődik a kaland",
      stem: "village",
      alt: "A Stonestorm falusi főtere az NPC-kkel, a felső HUD-dal és az oldalsó menükkel.",
      caption: "Village · a falu és a játék eredeti kezelőfelülete",
      articles: ["village", "account"],
    },
    {
      id: "character",
      title: "A hősöd, minden részletében",
      stem: "character-warrior",
      alt: "Egy Warrior karakterlapja a viselt felszereléssel, a statokkal és a Skills fül hivatkozásával.",
      caption: "Character · Warrior felszerelés és statok",
      articles: ["gear", "stats", "skills"],
    },
    {
      id: "flamebeard",
      title: "Szemtől szemben Flamebearddel",
      stem: "boss-flamebeard",
      alt: "A Flamebeard elleni harc eredeti képernyője, a hős és a boss HP-jelzőjével.",
      caption: "Flamebeard · hivatalos boss-harci képernyőkép",
      articles: ["bosses"],
    },
    {
      id: "stone-rain",
      title: "Amikor megérkezik a vihar",
      stem: "stone-rain",
      alt: "Stone Rain a falu főterén: a lehullott kövek körül a játék érintési célpontjai láthatók.",
      caption: "Stone Rain · közös kőtörés a faluban",
      articles: ["unlocks"],
      gallery: true,
      tag: "A VIHAR NYOMÁBAN",
    },
    {
      id: "tower",
      title: "Egy emelettel közelebb",
      stem: "stormcatcher",
      alt: "A Stormcatcher villámló pagodája és a torony eredeti kezelőpanelje.",
      caption: "Stormcatcher · a torony játékfelülete",
      articles: ["tower"],
      gallery: true,
      tag: "STORMCATCHER",
    },
    {
      id: "fishing",
      title: "Egy csendesebb pillanat",
      stem: "fishing",
      alt: "Horgász a vízparton, mellette a Fishing felület csaliválasztó és fogási panelje.",
      caption: "Fishing · horgászat és a hozzá tartozó játékfelület",
      articles: ["energy"],
      gallery: true,
      tag: "A KALANDOK KÖZÖTT",
    },
    {
      id: "kingdom-war",
      title: "Három királyság, közös világ",
      stem: "kingdom-war",
      alt: "A Kingdom War promóciós képernyője a három királyság zászlajával és ponttáblájával.",
      caption:
        "Kingdom War · promóciós előnézet, a forrás szerint november 9-i indulással",
      articles: ["pvp", "kingdoms"],
      gallery: true,
      tag: "KÉSŐBB INDULÓ RENDSZER",
    },
    {
      id: "rune-row",
      title: "Egy újabb játszma",
      stem: "rune-row",
      alt: "A Rune Row rúnalapjai a teaház asztalán, az eredeti pontozófelülettel.",
      caption: "Rune Row · egy pillantás a teaházba",
      articles: [],
      gallery: true,
      tag: "RUNE ROW",
    },
    {
      id: "fair-wheel",
      title: "Forduljon a szerencséd",
      stem: "fair-wheel",
      alt: "Bingbing a színes Fair Wheel mellett, az ingyenes pörgetés játékbeli gombjával.",
      caption: "Fair Wheel · Bingbing és a napi pörgetés",
      articles: ["village-systems", "daily-tasks"],
      gallery: true,
      tag: "MINDEN NAP EGY ESÉLY",
    },
  ],
  classes: [
    {
      id: "warrior",
      name: "Warrior",
      icon: "swords",
      tags: "Melee · Tough · Good for beginners",
      stat: "Strength",
      description:
        "Kétkezes karddal harcoló, szívós közelharcos. A hivatalos útmutató kezdőbarát kasztként jelöli.",
      weapon: "Kétkezes kard",
      focus: "Közelharc, szívósság",
      tip: "Ha most ismerkedsz a játékkal, jó kiindulópont.",
    },
    {
      id: "ninja",
      name: "Ninja",
      icon: "bow",
      tags: "Melee · Ranged",
      stat: "Dexterity",
      description:
        "Közelről ikertőrökkel, távolról íjjal harcol. Elsődleges tulajdonsága a Dexterity.",
      weapon: "Ikertőrök és íj",
      focus: "Közeli és távoli harc",
      tip: "A kétféle harci hangulat kedvelőinek.",
    },
    {
      id: "mage",
      name: "Mage",
      icon: "wand",
      tags: "Melee · Magic",
      stat: "Strength + némi Intelligence",
      description:
        "Lángoló kardot forgató mágikus közelharcos. Fő tulajdonsága a Strength, némi Intelligence mellett.",
      weapon: "Lángoló kard",
      focus: "Közelharc és mágia",
      tip: "A kardforgatás és a mágia ötvözetéhez.",
    },
    {
      id: "shaman",
      name: "Shaman",
      icon: "spark",
      tags: "Ranged · Magic · Support",
      stat: "Intelligence",
      description:
        "Legyezővel és talizmánokkal idéz villámokat. Távolsági, mágikus és támogató kaszt.",
      weapon: "Legyező és talizmánok",
      focus: "Távolsági mágia, támogatás",
      tip: "Ha a mágikus, támogató szerepkör vonz.",
    },
  ],
  daily: [
    {
      id: "login",
      title: "Login calendar jutalom",
      description:
        "Vedd át a napi ajándékot; kihagyáskor a sorozat csak szünetel.",
    },
    {
      id: "wheel",
      title: "Fair Wheel ingyenes pörgetés",
      description:
        "Bingbingnél, ha már elérhető. A napi visszaállításkor újul meg.",
    },
    {
      id: "tasks",
      title: "Daily Tasks és Daily chest",
      description:
        "Dongsu tábláján: teljesítés után a jutalmakat és a ládát is vedd át.",
    },
    {
      id: "weekly",
      title: "Weekly Challenges ellenőrzése",
      description: "Haladj a heti célokkal; az új kihívások hétfőn érkeznek.",
    },
    {
      id: "energy",
      title: "Energia felhasználása Forays expedíciókra",
      description: "Nézd meg a következő feltöltést, és ne maradj tele előtte.",
    },
    {
      id: "hunt",
      title: "Background Hunt zsákmányának begyűjtése",
      description:
        "Ha megtelik a zsák, a vadászat megáll. Ellenőrizd a vadászhelyet is.",
    },
    {
      id: "boss",
      title: "Ingyenes napi bosspróbálkozások",
      description:
        "Hunt → Boss: a kártya mutatja a készletet és a győzelmi esélyt.",
    },
    {
      id: "departure",
      title: "Kilépés előtti ellenőrzés",
      description:
        "Tipp: háttérvadászat, hosszabb Foray; a Travel Chest naponta egyszer indul.",
    },
  ],
  articles: [
    {
      id: "account",
      category: "start",
      title: "Fiók, vendégjáték és mobilos indítás",
      intro:
        "Egy fiók minden eszközön; a vendéghőst eszközváltás előtt mentsd el.",
      sections: [
        {
          items: [
            "A játék PC-n, tableten és telefonon, böngészőben fut a stonestorm.gg címen. A forrás szerint az App Store, Google Play és Steam változatok fejlesztés alatt állnak.",
            "Vendégként egy érintéssel kezdhetsz. A hős e-mail-címes fiókhoz mentése ingyenes, és néhány Storm Coins jutalmat ad. Vendégként nem válthatsz be kódot és nem írhatsz a chatbe.",
            "iPhone/iPad: Safari → Share → Add to Home Screen. Android: Chrome → ⋮ → Install and create shortcut → Install. A kezdőképernyőről indított játék külön böngészőnek számít, ezért előbb mentsd a vendéghőst.",
            "A nyelvet az első indításkor választod ki; később a zászlós nyelvgombbal módosíthatod. Világból az ajánlottat vagy a barátaid világát válaszd.",
            "Nagy terheléskor várakozási sor lehet; aki aznap már játszott, előrébb kerül. A barátok és a céhek azonos világhoz kötődnek.",
          ],
        },
      ],
      tip: "A kezdőképernyős ikon létrehozása előtt mentsd a vendégkarakteredet.",
    },
    {
      id: "kingdoms",
      category: "character",
      title: "Királyság, újrakezdés és Pioneer pack",
      intro: "Bonghwa piros, Horang sárga, Miru kék. A királyság végleges.",
      sections: [
        {
          items: [
            "A céhek minden királyság hőseit fogadják az adott világon belül; az eltérő királyság nem akadálya a közös céhnek.",
            "A Few members, extra reward feliratú királyság a saját kártyáján megjelölt szinten Pioneer pack jutalmat ad.",
            "Amíg a hős még új, egyszer ingyen újrakezdhetsz. Ez újrakezdés, nem szabad királyságváltás; a forrás nem ad pontos szinthatárt.",
          ],
        },
      ],
      tip: "A barátokkal elsősorban a világ kiválasztását egyeztessétek.",
    },
    {
      id: "stats",
      category: "character",
      title: "Kasztok, statpontok és automatikus harc",
      intro:
        "Warrior: Strength. Ninja: Dexterity. Mage: Strength és némi Intelligence. Shaman: Intelligence.",
      sections: [
        {
          items: [
            "Strength: a Warrior és a Mage sebzését növeli. Dexterity: a Ninja sebzését, továbbá mindenkinél a kritikus találatot és a kitérést támogatja.",
            "Vitality: minden kasztnál HP és védelem. Intelligence: Shaman-sebzés, továbbá a képességhez szükséges SP.",
            "Minden szintlépéssel statpontokat kapsz. A Suggested split a kasztod szerint elosztja őket. A Reset stats visszaadja a pontokat; az első visszaállítás ingyenes.",
            "A harc automatikus: a hős támad, elegendő SP mellett használja a kasztképességét, alacsony HP-nál pedig iszik a rendelkezésre álló potionből.",
          ],
        },
      ],
      tip: "Kezdőként használd a Suggested split lehetőséget; a forrás nem ír elő százalékos statarányokat.",
    },
    {
      id: "skills",
      category: "character",
      title: "Skill paths és Skill Books",
      intro: "A játék elején kasztonként két fejlődési út közül választhatsz.",
      sections: [
        {
          items: [
            "A választott path új képességet és állandó bónuszt ad. A pontos értékek a Character → Skills fülön láthatók.",
            "A Skill Books emelik a képesség szintjét. A Stormcatcher boss-szintjein biztosan kapsz Skill Book jutalmat.",
            "Gilhwa jelzi az új rendszer megnyílását. Pontos feloldási szintet a forrás nem közöl.",
          ],
        },
      ],
      tip: "Path választása előtt olvasd el mindkét lehetőséget a Skills fülön.",
    },
    {
      id: "village",
      category: "start",
      title: "A falu NPC-i és a kezelőfelület",
      intro:
        "Gilhwa tanít, Captain Mugang a történetet, Dongsu a napi feladatokat adja.",
      sections: [
        {
          items: [
            "Gilhwa leckéi a Book of tips gyűjteményben, a ? gomb mögött újraolvashatók. Egy elemet hosszan nyomva Gilhwa elmagyarázza, mi az.",
            "Captain Mugang történeti parancsait a felső tekercs mutatja. A fejezetek jutalmat adnak és a következő térképbosshoz vezetnek. Ha nincs új történeti feladat, napi Captain’s contracts érkeznek.",
            "Dongsu: notice board és Daily Tasks. Gangdo: Blacksmith. Minah: potions; Kalbin: weapons; Taesan: armour; Jamul: materials.",
            "Malgu az istállót, Bingbing a Fair Wheel funkciót, Yakdo az alkímiát, Hakmun a kutatásokat kezeli. A felkiáltójel azt jelzi, hogy valaki vár rád.",
            "A Today’s to-do HUD-gomb a Now, Later és Anytime lehetőségeket mutatja. Go there: odaugrás. Claim all: több kész jutalom együttes átvétele, például Daily Tasks, Login calendar és Travel Chest.",
          ],
        },
      ],
    },
    {
      id: "unlocks",
      category: "start",
      title: "Mi mikor nyílik meg?",
      intro:
        "Gilhwa fokozatosan bemutatja a rendszereket; a lista nem helyettesíti a játék feloldási feltételeit.",
      sections: [
        {
          items: [
            "Azonnal: Forays, Background Hunt, Blacksmith, shops, notice board, történet és map bossok.",
            "Első szintek: Fair Wheel, Leads, Portals, alchemist, Stone Rain, skill paths, Stormcatcher és stable.",
            "Korai játék: companions, első dungeon, Guild, fishing, home, mines, Rune Row, Arena; a második térkép az első boss legyőzése után.",
            "Később: Storm Rift, Monkey Trap és a harmadik térkép. További térképek, dungeonek és heti boss is követik; a forrás szerinti maximális szint 60.",
            "A Kingdom War és a Banner League indulása a forrás szerint 2026. november 9. A különálló alkalmazások fejlesztés alatt állnak. Ezeket nem kezeljük azonnal elérhető funkcióként.",
          ],
        },
      ],
    },
    {
      id: "forays",
      category: "start",
      title: "Az első Forays expedíció",
      intro:
        "Hunt → Forays: rövid, közepes vagy hosszú út egy lehullott kőhöz, energiáért.",
      sections: [
        {
          items: [
            "Minden ajánlat mutatja az időt, az energiaköltséget és a jutalmat. Az első szinteken az utak rövidebbek és olcsóbbak.",
            "Easy: biztonságosabb választás; Even: kétesélyes; Tough: kockázatos. A kártya tooltipje mutatja a győzelem esélyét.",
            "Az állomásokon kártyát választasz: harc, láda, wanderer, peddler és más lehetőségek jöhetnek.",
            "A végén a stone guardians ellen harcolsz, majd érintésekkel vagy a hősre hagyva széttöröd a követ. Győzelem után ládát választhatsz.",
            "Visszatéréskor a Rested XP bónusz segíti a következő expedíciókat. A világ ajánlott szintje alatt catch-up XP bónusz segíthet felzárkózni.",
          ],
        },
      ],
      tip: "Ha hosszabb időre elmész és maradt energiád, indíts hosszabb Foray expedíciót.",
    },
    {
      id: "background",
      category: "daily",
      title: "Background Hunt, Patrol és offline zsákmány",
      intro:
        "Hunt → Hunting spots: válassz vadászhelyet, és rendszeresen gyűjtsd be a zsákmányt.",
      sections: [
        {
          items: [
            "A hős órákig vadászik, offline is. Amikor a zsák megtelik, megáll a gyűjtés. A forrás nem ad egységes órakorlátot.",
            "A vadászhely kártyája mutatja az óránkénti XP és nyang értéket. A Go here jobb vadászhelyhez irányít.",
            "A Background Hunt ölési eredményei a megfelelő Daily Tasks feladatokba is beleszámítanak, és Hakmun kutatásaihoz mintákat adnak.",
            "Energia nélkül a Forays fülön a Patrol néhány percenként ingyenes harcot kínál.",
          ],
        },
      ],
      tip: "Minden belépéskor ellenőrizd, megtelt-e a zsák, és van-e jobb Hunting spot.",
    },
    {
      id: "energy",
      category: "daily",
      title: "Energia: feltöltés és ingyenes alternatívák",
      intro:
        "A HUD villámjelére kattintva látható a napi ütemezés és a következő feltöltés.",
      sections: [
        {
          items: [
            "A nagyobb energiarész a napi visszaállításkor érkezik, napközben több kisebb feltöltéssel. Ezek csak a napi keretig töltenek; tele állapotban a feltöltés szünetel.",
            "Az el nem használt energia egy része átvihető a következő napra. A forrás nem ad pontos mennyiséget.",
            "A Forays fül Energy refill gombja mutatja a Storm Coins költséget és a még elérhető napi feltöltéseket.",
            "Patrol, Leads, Portals, Arena, Stormcatcher és a fishing napi ingyenes fogásai nem kérnek energiát. A Background Hunt is folytatódhat.",
            "Barátoktól naponta kaphatsz kevés energiát; skill games is adhatnak, hosszabb kihagyás utáni visszatéréskor pedig ajándék várhat.",
          ],
        },
      ],
      tip: "Nézd meg a notice board feladatait, mielőtt elköltenéd az energiát, és ne maradj tele a következő feltöltés előtt.",
    },
    {
      id: "daily-tasks",
      category: "daily",
      title: "Daily Tasks, Weekly Challenges és jutalmak",
      intro:
        "Dongsu notice board tábláján és a Today’s to-do felületen követheted a teendőket.",
      sections: [
        {
          items: [
            "A szintedhez igazított Daily Tasks Forays, szörnyölés, kovácsolás vagy Arena feladatot is adhatnak. Minden feladatnál látható a Reward. Vedd át mindet, majd a Daily chest jutalmát is.",
            "Új napi feladatok a táblán kijelzett daily reset időpontjában érkeznek. Új Weekly Challenges minden hétfőn; a végükön Weekly chest jár.",
            "A Login calendar naponta egy jutalmat ad. Kihagyáskor a sorozat szünetel, nem nullázódik.",
            "A Travel Chest naponta egyszer, kilépéskor indul, és visszatéréskor vár. Captain Mugang napi contracts feladatokat ad, ha nincs új történeti parancs.",
            "A kalauz pipái a készülék helyi naptári napján újulnak meg. A játék daily reset idejét továbbra is a notice board mutatja.",
          ],
        },
      ],
    },
    {
      id: "bosses",
      category: "gear",
      title: "Old Stripes, map bossok és Momentum",
      intro:
        "Hunt → Boss: Old Stripes az első térképboss, a Village Outskirts területén.",
      sections: [
        {
          items: [
            "A bosskártya előre mutatja a győzelem esélyét, a várható értékelést és a jutalmat. Minden harc egy próbálkozást fogyaszt.",
            "Naponta ingyenes próbálkozásokat kapsz; a fel nem használt készlet korlátozottan felhalmozódik. A kártya mutatja az aktuális mennyiséget.",
            "További próbálkozás Storm Coins vagy Boss Pass felhasználásával kérhető. Ezeknél a vereség nem ad extra előnyt; ingyenes próbálkozás elvesztése után a Momentum erősíti a következő kísérletet ugyanannál a bossnál.",
            "Minél több HP marad a végén, annál jobb az S, A vagy B értékelés és a zsákmány.",
            "Az első győzelem biztosan ad boss set-darabot, Heroic tárgyat és Spirit Stone jutalmat. A Spirit Stone a Blacksmith → Sockets fülre kerül, nem a táskádba.",
            "Minden győzelemből további set-darab eshet, és haladsz a boss Mythic tárgya felé. A Today’s purple mutatja a ma megszerezhető Heroic tárgy slotját. Később hard mode és világméretű weekly bossok is jönnek.",
          ],
        },
      ],
      tip: "Alacsony győzelmi esélynél fejlessz felszerelést vagy lépj szintet; az ingyenes próbálkozásokat ne hagyd korlátlanul gyűlni.",
    },
    {
      id: "maps",
      category: "start",
      title: "Térképek: Village Outskirts → Highwayman Country",
      intro: "A térképboss legyőzése a továbblépés kulcsa.",
      sections: [
        {
          items: [
            "A kezdőterület a Village Outskirts. Old Stripes legyőzése megnyitja a Highwayman Country térképet.",
            "Ott Goldtooth legyőzése és a következő térkép szintfeltételének teljesítése nyitja a Tusker Gorge területet. A forrás nem ad meg konkrét szintkövetelményt.",
            "A későbbi térképek hasonló módon nyílnak meg. Kövesd Captain Mugang történeti parancsait.",
          ],
        },
      ],
    },
    {
      id: "gear",
      category: "gear",
      title: "Felszerelés, Combat Power és ritkaságok",
      intro:
        "Common → Rare → Heroic (lila) → Mythic (arany). A magasabb ritkaság több bónuszsort és foglalatot ad.",
      sections: [
        {
          items: [
            "A fegyver és armour kaszthoz kötött; helmet, shield, boots és jewellery minden kasztnak megfelelő lehet. A viselési szintet a tárgykártya mutatja.",
            "A ▲ jel a viseltnél jobb tárgyat mutatja. A CP-változás többet mondhat, mint önmagában a ritkaság színe.",
            "A HUD Combat Power értékére kattintva megnézheted az összetevőit. A Hunt oldal sávja a térkép átlagos hőséhez hasonlít.",
            "Foray guardians, Leader kártyák és map bossok a szintednek megfelelő tárgyakat adhatnak. A dungeon miniboss és boss biztosan ad tárgyat.",
            "A map bossoknak saját set és Mythic tárgyuk van; több azonos set-darab nagyobb bónuszt ad. A készlet a bosskártyán látszik.",
            "Magasabb szintű, azonos slotú tárggyal az Awaken with it a meglévő Rare vagy Heroic tárgyadat emeli tovább, megtartva a fejlesztéseit.",
          ],
        },
      ],
      tip: "A magasabb ritkaság helyett mindig a konkrét CP-változást és tulajdonságokat is nézd.",
    },
    {
      id: "forge",
      category: "gear",
      title: "Kovácsolás: Safe steps és a sikertelenség ára",
      intro:
        "Blacksmith → Upgrade: Gangdo minden ütés előtt megmutatja a Chance és Cost értékeket.",
      sections: [
        {
          items: [
            "A fejlesztés +1, +2 és további fokozatokat ad. A Safe steps mindig sikerülnek; a forrás nem jelöl meg hozzájuk számszerű határt.",
            "Később a fejlesztés kockázatos. A Cost dobozban nyang, magasabb lépéseknél materials és Stormstone Shards szerepelhetnek. A Where from? segít megkeresni a hiányzó anyagot.",
            "Védelem nélkül a sikertelen fejlesztés elégeti a tárgyat, a belehelyezett Spirit Stone-okkal együtt. Ashward Scroll mellett a tárgy megmarad, de egy fokozatot visszaesik. Stormstone Dust mellett a tárgy és a fokozata is megmarad.",
            "Luck Ore egy ütés sikerességi esélyét növeli. Egyes legnehezebb lépéseken a Smith’s Luck a sikertelen kísérletekkel emeli az adott lépés esélyét.",
            "Bonuses: új bónuszsorok. Sockets: Spirit Stone-ok. Polishing: a bónuszok kockázatmentes erősítése.",
          ],
        },
      ],
      tip: "A viselt tárgyak Safe steps fejlesztéseit érdemes elvégezni; később védd azt, aminek az elvesztése fájna.",
    },
    {
      id: "stones",
      category: "gear",
      title: "Spirit Stone-ok: hol találod és hová kerülnek?",
      intro:
        "A bossoktól kapott Spirit Stone-ok a Blacksmith → Sockets fülön várnak.",
      sections: [
        {
          items: [
            "A kövek kihagyják a táskát: a boss eredményképernyője is jelzi, hová kerültek.",
            "Rare vagy jobb tárgy foglalatába ingyen illeszthetők.",
            "Védelem nélküli sikertelen, kockázatos kovácsoláskor a tárgyban lévő Spirit Stone-ok is elvesznek. A forrás nem részletezi az eltávolítás szabályait.",
          ],
        },
      ],
    },
    {
      id: "leads",
      category: "adventure",
      title: "Leads és Portals: rövid ügyességi játékok",
      intro:
        "A Leads menüpontban és a Hunt oldal Portal kártyáján találod őket; nem kérnek energiát.",
      sections: [
        {
          items: [
            "Az első Lead a második Foray stone guardians harcából érkezik. Később Forays, bossok, Patrol, dungeon és tower is adhat Lead jutalmat. Csak néhányat tarthatsz egyszerre.",
            "Lockpicking: a világító sávban üss. Stone Splitting: a világító pontokat találd el, a sötéteket kerüld. Fishing: tartsd a sávot a halon. Tracking: ismételd a lábnyomokat, majd az arany X-nél ásd ki a ládát.",
            "Bronze kevesebbet fizet; Silver a teljes, Gold emelt jutalmat ad. Első alkalommal Gilhwa időkorlát és bukás nélkül tanít.",
            "Minden térkép Portalját Foray-állomások, map bossok és Gold eredmények darabjaival töltheted. Megteléskor Enter: Golden Rain Field, Tanaka Hunt vagy Stormfall sorsolódik.",
            "Golden Rain Field: kincselkapás. Tanaka Hunt: szökevény Tanakák bekerítése, mounttal szélesebb háló. Stormfall: zuhanó kövek ütése, magasabb CP mellett gyorsabb törés.",
          ],
        },
      ],
      tip: "Játssz a Lead jutalmakkal, mielőtt megtelne a készlet; legalább Silver eredményre törekedj.",
    },
    {
      id: "dungeons",
      category: "adventure",
      title: "Dungeons: Wildwood Den és a napi kulcsok",
      intro:
        "Hunt → Dungeons → To the dungeons. Az első dungeon a companions rendszerével együtt nyílik.",
      sections: [
        {
          items: [
            "Először Wildwood Den, később Monkey Trap. Belépéskor egy kulcs fogy; dungeonönként naponta egy ingyenes kulcs jár, a fel nem vett ingyenes kulcsok néhány napig gyűlnek.",
            "Teremről teremre harcolsz, a HP megmarad a szobák között, és futamonként csak néhány potiont ihatsz. Középen miniboss, a végén saját támadásokkal rendelkező boss vár.",
            "Ajtóválasztásoknál harc, kincs, csapda vagy gyógyító shrine jöhet. Vereségnél vége a futamnak, de a már megszerzett jutalmak megmaradnak.",
            "Minden terem XP-t és nyangot ad. A miniboss és a boss biztosan a szintednek megfelelő tárgyat dob.",
            "Companion-jutalmak: evolution cores, eggs, skill books és bond thread. Az első fejlődéshez Wildwood Den core kell. Minden dungeon első teljesítése Storm Coins jutalmat ad.",
            "Később két további dungeon és heroic mód vár; ezeket ne keresd azonnal a kezdőkarakteren.",
          ],
        },
      ],
      tip: "Vigyél potionöket, hagyj helyet a táskában, és vedd fel az ingyenes kulcsokat.",
    },
    {
      id: "tower",
      category: "adventure",
      title: "Stormcatcher és Storm Rift",
      intro:
        "A Stormcatcher az első szinteken, a Storm Rift később nyílik meg.",
      sections: [
        {
          heading: "Stormcatcher · Tower menü",
          items: [
            "Mindig a következő, még nem teljesített szinten harcolsz. A szint végleg teljesített marad; győzelem és vereség után is pihenő következik. A Today’s to-do jelzi, mikor kész.",
            "Szintenként XP, nyang és tárgy jár; hagyj szabad táskahelyet. A boss-szintek biztosan Skill Book jutalmat adnak. A legyőzött bossok hetente Echoes formájában visszatérnek.",
          ],
        },
        {
          heading: "Storm Rift · Hunt → Dungeons",
          items: [
            "Minden hétfőn új térkép, azonos a szintsávodon belül. Szintenként három kártyából választasz: harc, blessing, pihenés vagy láda; a HP továbbvihető.",
            "Napi Rewarded runs: Rift Seals, amelyek a Shelf kínálatára válthatók. Energy run: energiáért a Seals mellé XP is jár. Practice runs: ingyenesek és korlátlanok.",
            "A heti legjobb eredmény a szintsáv ranglistájára kerül.",
          ],
        },
      ],
      tip: "A Storm Rift jutalmazott futama előtt gyakorold be az útvonalat egy Practice run során.",
    },
    {
      id: "companions",
      category: "adventure",
      title: "Companions és Mounts",
      intro:
        "A társ harcol és bónuszt ad; a hátas a Forays menetidejét rövidíti.",
      sections: [
        {
          heading: "Character → Companions",
          items: [
            "A rendszer megnyílásának napján ingyenes Speckled Egg (your choice) jár: te választod a kikelő társat. Egyszerre egy main companion aktív.",
            "A társ bónusza lehet XP, nyang, loot vagy attack. Feed naponta egyszer: nagy XP-adag. A társ a vele vívott harcokban, különösen dungeonökben is fejlődik.",
            "Öt forma, Cubtól Legendaryig. A forma szintkorlátjánál dungeon core kell az evolve művelethez; először a Wildwood Den core szükséges.",
            "Dungeon skill books tanítják a képességeit; további eggs dungeonökből és bossoktól jöhetnek. Minden kikelt faj állandó kis bónuszt ad a companion book részeként.",
          ],
        },
        {
          heading: "Malgu stable",
          items: [
            "Az első szinteken Steppe pony próbálható ki. Mount nyangért bérelhető; a gyorsabbak szintlépéssel nyílnak, a kártyák mutatják az időnyereséget.",
            "Egyes mountok végleg megvehetők, mások kódból vagy eseményből érkeznek. A Tanaka Hunt hálóját is szélesítik.",
          ],
        },
      ],
      tip: "Válassz egy fő társat, etesd naponta, és időben gyűjtsd be az első evolution core-t.",
    },
    {
      id: "village-systems",
      category: "daily",
      title: "Fair Wheel, Alchemist és Research",
      intro:
        "Bingbing és Yakdo az első szinteken, Hakmun a korai játékban válik elérhetővé.",
      sections: [
        {
          heading: "Bingbing · Fair Wheel",
          items: [
            "Naponta egy ingyenes pörgetés; daily resetkor újul. Nyeremény lehet nyang, XP, potions, materials, energy, companion egg, forge helpers vagy Storm Coins. Az esélyeket a Prizes and odds mutatja.",
          ],
        },
        {
          heading: "Yakdo · Alchemist",
          items: [
            "Öt ideiglenes brew: több XP, loot, nyang, attack vagy defence. Nyang vagy Storm Coins fizethető; az árak a polcon, az aktív hatások a HUD-on látszanak.",
            "Később a Recipes halat és anyagokat alakít hasznos extrákká, például csalivá vagy rövidebb Forays utakhoz használható segítséggé.",
          ],
        },
        {
          heading: "Hakmun · Research",
          items: [
            "Egy tanulmány egy adott szörny mintáit kéri; ezeket a Background Hunt adja. Deliver után minden minta sikerülhet vagy elbukhat, a tanulmány mutatja az esélyt.",
            "A befejezett kutatás állandó bónuszt ad, például attack vagy HP növekedést. A minták vizsgálata órákat igényelhet.",
          ],
        },
      ],
      tip: "Kilépés előtt add le Hakmun mintáit, és ne hagyd ki az ingyenes pörgetést.",
    },
    {
      id: "community",
      category: "community",
      title: "Guilds, barátok és biztonságos chat",
      intro:
        "Azonos világban, bármely királyságból csatlakozhatsz egy Guildhöz.",
      sections: [
        {
          items: [
            "A korai játékban nyíló Guild csatlakozáshoz megerősített e-mail kell. A guild finder keresőt használhatod, jelentkezhetsz, vagy nyangért saját céhet alapíthatsz.",
            "A tagok nyangot adományozhatnak a treasury számára. A közös épületek XP, nyang és forging luck bónuszt adnak a céhnek.",
            "Minden tagnak naponta egy Raid boss támadása van. A jutalom a sebzés szerint oszlik; a Guild Week közös heti cél és jutalom a résztvevőknek.",
            "Community HUD-gomb vagy a hős profilja: barát hozzáadása hero name alapján, azonos világban. A napi energiaküldéshez előbb némi barátsági idő kell.",
            "A Community chat nyelvi szobákat és General (English) csatornát ad. Íráshoz megerősített e-mail szükséges. Zaklatás vagy csalás esetén a message menüben Report, majd igény szerint Block.",
          ],
        },
      ],
      tip: "A napi Raid támadást akkor is használd el, ha még kevés sebzést okozol.",
    },
    {
      id: "pvp",
      category: "community",
      title: "Arena, Kingdom War és Banner League",
      intro:
        "Az Arena korán nyílik; a két háborús rendszer a forrás szerint csak 2026. november 9-én indul.",
      sections: [
        {
          heading: "Arena",
          items: [
            "Szintedhez és honour értékedhez közeli ellenfelekből választhatsz, előre látható győzelmi eséllyel. Automatikus harc után rövid pihenő következik.",
            "Győzelem: honour és nyang; vereség: honour csökkenés. Erősebb ellenfél legyőzése többet ér. A szezonvégi rang címeket és kereteket ad.",
            "Az első szezon a forrás szerint 2026. november 30. kezdetén zárul; az aktuális időt a Season fül visszaszámlálója mutatja. A Pure Arena és a heti Golden Cup később nyílik.",
          ],
        },
        {
          heading: "Később indul · Kingdom War és Banner League",
          items: [
            "Kingdom War: a szokásos játék pontokat szerez a királyságnak, a győztes tagjai jutalmat kapnak. Forrás szerinti indulás: 2026. november 9., hétfő.",
            "Banner League: Guild → War Camp. Heti céhháború divíziókban, Elo jellegű háttérértékeléssel. A napi aktivitás táplálja a céh támadásait. A War Camp mutatja a részvételi feltételeket.",
            "Az aktív tagok heti war chest jutalmat, a céh nyangot kap; magasabb banner több jutalmat ér. Az első hét itt is 2026. november 9-én indul.",
          ],
        },
      ],
      tip: "A háborús rendszerek tényleges indulását a játékban ellenőrizd; a dátum a kapott dokumentum állapota.",
    },
    {
      id: "coins",
      category: "shop",
      title: "Storm Coins, Shop és Storm Road",
      intro:
        "A Storm Coins prémium pénznem, de játék közben ingyen is szerezhető.",
      sections: [
        {
          items: [
            "Ingyenes források: welcome gift, vendéghős mentése, Login calendar, Weekly chest, achievements, ingyenes Storm Road sáv, dungeonök első teljesítése és barátmeghívás.",
            "Imperial Pass: havi pass több XP, nyang, loot és napi energia előnnyel. Vásárolhatók Energy refills, időspórolás, forge helpers, boss attempts és dungeon keys is.",
            "A kozmetikai titles és frames nem adnak statot. Name change a Shopban; a vendéghős első átnevezése ingyenes.",
            "Coin pack első megvásárlásakor az alap coinmennyiség egyszer újra jár. A több hétig napi Storm Coins jutalmat adó passes nem újulnak meg automatikusan.",
            "Storm Road: játék által feltöltött szezonális jutalomsáv, ingyenes és premium ággal. Az aktuális árat és tartalmat mindig a Shop kártyáin ellenőrizd.",
            "A játék ingyenesen játszható, a vásárlás opcionális. A böngészős fizetés SimplePayen történik. Kiskorú játékos csak szülői vagy gondviselői beleegyezéssel vásároljon. Fizetési kérdésben a hivatalos Shop szabályzata és az info@stonestorm.gg az irányadó.",
          ],
        },
      ],
    },
    {
      id: "codes",
      category: "shop",
      title: "Founder, creator és meghívókódok",
      intro:
        "Account → Redeem a code. A founder és creator kódot az első napokban, korai szinten váltsd be.",
      sections: [
        {
          items: [
            "Vendégként előbb mentsd a hőst; a már beírt kód a mentés után váltódik be. A forrás nem ad pontos szintkorlátot.",
            "Founder code (STRM-XXXX-XXXX): az előregisztrációs e-mailből, kizárólag azzal az e-maillel létrehozott, megerősített fiókban működik. Nyang, Ashward Scrolls, Healing Potions, Founder cím, Founder’s Seal keret és néhány napos Wisp Steed jár.",
            "A forrás szerint november 15-ig váltható be; lejárat: 2026. november 16. 00:00 CET. Ez időszakos indulási ajánlat, nem örök érvényű kód.",
            "Creator code: nyang, Healing Potions és egy Ashward Scroll. Megerősített e-mail kell, fiókonként egy creator kód használható. Egy welcome gift jár; founder és creator kóddal együtt a teljes founder ajándékot kapod.",
            "Invite a friend: saját kód a Storm Coins → Invite a friend felületen. A barát röviddel kezdés után ott adja meg. A The rules szerinti szint elérésekor mindketten Storm Coins jutalmat kaptok.",
            "Érvénytelen kódnál ellenőrizd a betűket, az e-mailt és a fiókot. Az ingyenes Founder code és a fizetős Stormfounder pack külön dolog.",
          ],
        },
      ],
    },
    {
      id: "launch-packs",
      category: "shop",
      title: "Időszakos indulási csomagok · forrásállapot",
      intro:
        "A dokumentum induláskori Shop-ajánlatai; tartalmuk és határidejük a játékban ellenőrizendő.",
      sections: [
        {
          items: [
            "A Stormfounder, Stormfounder Captain és Legend of the First Storm csomagok külön-külön, hősönként egyszer vehetők meg; a forrás szerinti határidő 2026. november 16. vége.",
            "Stormfounder: Storm Founder cím, Storm Coins, pass, Ashward Scrolls és Stormstone Dust. Captain: cím és keret, több coin, pass, ideiglenes Nine-Tailed Fox, scrolls és dust.",
            "Legend of the First Storm: saját cím, keret, backdrop és showcase decor; Storm Coins, Dragon Moon, pass, scrolls, dust, Luck Ore és Dragon Eyes. A forrás a founder külsőségeket és a Nine-Tailed Fox hátast csomaghoz kötöttként írja le.",
            "Launch Storm Chest: Storm Coins, scrolls, dust, Luck Ore, Boss Passes és pass. A forrás szerint csak 2026. november 8. végéig.",
            "A csomagok megvásárlása opcionális. Nem tartunk fenn élő árlistát; a jelenlegi ajánlatokat a hivatalos Shop mutatja.",
          ],
        },
      ],
    },
    {
      id: "help",
      category: "community",
      title: "Segítség, hibajelentés és kereskedés",
      intro:
        "A játék gyakran frissül; eltérésnél a játék felülete és az újabb hivatalos közlemény az irányadó.",
      sections: [
        {
          items: [
            "Nincs játékospiac és játékosok közötti kereskedés. Az NPC shopok rögzített árakon vásárolnak és eladnak.",
            "A hibajelentések, kérdések és ötletek számára a hivatalos Discordon külön csatornák szolgálnak. A dokumentum csatornaazonosítóiból nem készítünk kitalált szerverlinkeket.",
            "Fiók- és fizetési problémák: info@stonestorm.gg. Fizetési ügyhöz a hivatalos útmutató a rendelésszám megadását kéri. Ne küldj jelszót vagy bankkártyaadatot.",
            "Zaklatás vagy csalás esetén Report a játékbeli üzenet menüjéből; Block elrejti a további üzeneteket.",
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: "Melyik kasztot válasszam kezdőként?",
      answer:
        "Mind a négy kaszt erős. A hivatalos útmutató a Warrior kasztot Good for beginners jelöléssel látja el. Fontos különbség: a Mage itt Strength alapú mágikus közelharcos, némi Intelligence mellett; a Shaman elsődleges statja az Intelligence.",
    },
    {
      question: "Megváltoztathatom a királyságomat?",
      answer:
        "A királyság végleges. Amíg a hős még új, egyszer ingyen újrakezdhetsz. A céhek az adott világon belül minden királyságból fogadnak tagokat, ezért eltérő királyságból is lehetsz közös céhben a barátaiddal.",
    },
    {
      question: "Elveszhet a vendégkarakterem mobilos váltáskor?",
      answer:
        "A kezdőképernyőről indított játék külön böngészőnek számít. Előbb mentsd a vendéghőst e-mailes fiókhoz, és csak utána válts böngészőt, eszközt vagy kezdőképernyős indításra. A mentés ingyenes, és néhány Storm Coins jutalmat is ad.",
    },
    {
      question: "Mit csináljak, ha elfogyott az energiám?",
      answer:
        "Patrol, Leads, Portals, Arena, Stormcatcher és a fishing napi ingyenes fogásai nem kérnek energiát. A Background Hunt közben is gyűjt. A HUD energiagombján látod a következő feltöltést.",
    },
    {
      question: "Vadászik a hősöm offline is?",
      answer:
        "Igen, a Background Hunt órákig működik offline is. Amint megtelik a zsák, megáll, ezért rendszeresen gyűjtsd be. A pontos kapacitást és a vadászhely hozamát a játékban ellenőrizd.",
    },
    {
      question: "Mi a különbség az Ashward Scroll és a Stormstone Dust között?",
      answer:
        "Sikertelen kockázatos kovácsolásnál védelem nélkül a tárgy és a benne lévő Spirit Stone-ok elégnek. Ashward Scroll mellett a tárgy megmarad, de egy fokozatot veszít. Stormstone Dust mellett a tárgy a fokozatát is megtartja. A Safe steps mindig sikerülnek.",
    },
    {
      question: "Hol van a bossból kapott Spirit Stone?",
      answer:
        "Nem a táskádban: a Blacksmith → Sockets fülön. Rare vagy jobb tárgy foglalatába ingyen beillesztheted.",
    },
    {
      question: "Újraindítja ez a lista a játékbeli napi feladatokat?",
      answer:
        "Nem. A pipák kizárólag a kalauzban, az adott böngészőben tárolódnak, a készülék helyi naptári napjához kötve. A játék napi visszaállítását a notice board mutatja. A Weekly Challenges hétfőn újulnak.",
    },
    {
      question: "Kell fizetnem, és lehet másokkal kereskedni?",
      answer:
        "A játék ingyenesen játszható, opcionális vásárlásokkal; Storm Coins játék közben is szerezhető. Játékosok közötti kereskedés és piac nincs.",
    },
    {
      question: "Hová írhatok, ha segítségre van szükségem?",
      answer:
        "A hivatalos Discord hibajelentő és kérdéscsatornáihoz, fiók- vagy fizetési ügyben pedig az info@stonestorm.gg címre. Zaklatásnál a játékbeli Report és Block lehetőségeket használd.",
    },
  ],
};
