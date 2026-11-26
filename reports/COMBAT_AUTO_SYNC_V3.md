# Combat Update + Auto-Sync V3 – helyi ellenőrzési jelentés

Az Atlas a nyilvános `fbc93606674a` API-konfigurációt tartalmazza. Mind a **80 terem** és mind a **16 Data Engine ág** pontosan egyezik a mentett, élő API-ból ellenőrzött adatokkal. Ez konfigurációegyezés: az új harci képletek teljes igazolása még hiányzik.

## Konkrét adateltérések

| Adat | Korábbi | Ellenőrzött aktuális |
| --- | --- | --- |
| Data Engine séma | V2 | V3, explicit additív migráció |
| Megfigyelt API-verzió | c530ea20d7ec | fbc93606674a |
| Normál kitérés felső korlátja | 35% | 30%, mindkét API-kulcs egyezik |
| Pókkazamata ajánlott szintje | 43 | 36 |
| Sárkánykazamata ajánlott szintje | 60 | 48 |
| Vadonodú, hősi 1. terem védelme | Az import nem fogadta el a tört értéket | 353.55793627532057 |
| Addon | 0.9.6 | 0.9.7 |

A Vadonodú hősi első termének további értékei: HP 16398; támadás 1976–2704; harcerő 6972. A teljes frissítésben **381 teremstatisztika változott**, 76 rekord/konfigurációs ág került importálásra. A védelem teljes API-pontossága megmarad; nem állítunk igazolatlan játékon belüli kerekítést.

A változatlan adatágak saját tartalomverziója megmaradt, de mindegyikhez külön szerepel az `fbc93606674a` verzióval végzett összevetés és az egyező forráshash. Az elutasított jövőbeli ág részleges frissességet eredményez.

## A teljes 2396 tételes hátralék

A helyi checkoutban eredetileg csak 393 nyitott tétel volt. A kért teljes lista a GitHub Auto-Sync 2026-11-20-i jelentésében található, az `aa0f984782f76761304b22f0286e67290b442d93` commitban. A teljes távoli napló és a helyi új bizonyítékok egyesítve szerepelnek a jelentésben; korábbi lezárás nem veszett el.

| A 2396 eredetileg nyitott tétel eredménye | Darab |
| --- | ---: |
| Aktuális, tényleges importtal igazolt egyezés | 1436 |
| Igazolt új importtal felülírt történeti esemény | 576 |
| Továbbra is nyitott | 384 |
| Összesen | 2396 |

Az új soft-cap kliensbizonyítékának hiánya külön új tétel, ezért az összes nyitott tétel **385**. Ebből 318 forrásleltár, 63 hiányzó importáló támogatás, három mechanikai felülvizsgálat és egy konfliktus. A teljes napló 3111 eseményt őriz, közülük 2726 lezárt. A történeti események lezárása nem állítja a régi érték újonnan történő importját: külön tartalmazza a ténylegesen importált új érték bizonyítékát.

A 2396 tétel rögzített forrása és azonosítói: [review-backlog-evidence.json](../data/review-backlog-evidence.json). A forrásjelentés SHA-256 lenyomata: `9de4eb827c1938bad8ff0e161c8862bbd434f1218691bef7b7de945677c6f7da`.

## Harci bizonyítékok és megmaradó korlátok

Az új `supportSoft`, `reductionCurve`, `dodge`, növekedési, DEX-arányos, könyv- és capScale paraméterek importált konfigurációk. A jelentés nem vezet le képletet a nevükből. A részletes, mezőnkénti értelmezés és bizonyítékigény a [műszaki leírásban](../docs/COMBAT_AUTO_SYNC_V3.md) szerepel.

A jelenlegi belépőoldal hozzáférés-ellenőrzést ad. A korábban rögzített nyilvános GameApp-modul letölthető, de az új mezők többségéhez nem ad aktuális képletbizonyítékot. Nem történt hozzáférés-megkerülés. A nyers és a soft-cap által módosított értékeket ezért az Atlas és az addon külön kezeli; a régi DEX- és lineáris soft-cap számítás nem ad végleges eredményt.

A Bónuszok panel ellenőrzését szintetikus böngészős játéknézettel teszteltem: a 80%-os nyers felszerelésrész és a panel 33%-os értéke külön jelenik meg; a panel bezárásakor a megfigyelés megszűnik. Ez nem bejelentkezett, élő karakterrel végzett mérés. A valódi Chrome-bővítményteszt igazolja a kísérő-tooltip, a passzív API-megfigyelés és az anonim export fennmaradását.

## Tartalomfigyelő

A hatórás Auto-Sync része lett a tartalomfigyelő és az Atlas **Közelgő tartalmak** nézete. A bejelentés, az előkészített nyilvános adat és a bizonytalan észlelés külön státusz. Az első API- és kliensleltár nem generál tömeges újdonságértesítést. Kép, fordítás, hosszabb referenciatábla vagy oldalhash nem válik hivatalos bejelentéssé.

A jelenleg ellenőrizhető API-ban a maximális szint **60**, az XP-tábla **60 elemű**, és **hat pálya** szerepel. Nincs igazolt új M7-es tartalom, 60 feletti XP-adat vagy feldolgozott hivatalos bejelentés. A kliens/hírek vizsgálata a hozzáférési hiba miatt hiányos; ez nem bizonyítja, hogy más hivatalos csatornán sincs hír.

Az opcionális Discord-lépés a `ATLAS_FUTURE_DISCORD_WEBHOOK` GitHub Secret értékét használja. Helyben nem történt üzenetküldés, és webhookcím nem került a weboldalba.

## Tesztjelentés

- **158/158** Node-teszt sikeres, nulla kihagyással. Tartalmazza az összes korábbi modellt, a teljes importfolyamatot, a migrációt, a valódi sikertelen teszt utáni visszaállítást, valamint a tartalomfigyelő téves riasztás elleni eseteit.
- **12 Chromium/bővítmény tesztprogram** sikeres: asztali és mobil Atlas, statlimitek, teljes teremadatok, Data Engine, Otthon, Aréna, dizájn, Image Collector, kísérők és natív MV3-bővítmény.
- DOM-ellenőrzés: **469 adatlap**, keresés, szűrés, kalkulátorok, Planner, képtár és kalauz.
- Teljes Pages-csomag: **3781 HTTP-erőforrás-ellenőrzés**, megfelelő kizárásokkal. A külön kalauz buildje és HTTP-tesztje izolált másolatban is sikeres.
- Szintaxis-, forráshivatkozás-, addon ZIP/hash-, helyi HTTP- és publikációs ellenőrzések lefutottak. A közzétételi audit a repository korábban rögzített tulajdonosi felhatalmazását használja.

A géppel ellenőrizhető, 80 soros teremlista, ágankénti hashek, hátralékeredmények és tesztösszesítés: [combat-v3-verification.json](combat-v3-verification.json). Kliensforrás-bizonyítékok: [combat-v3-evidence.json](../data/combat-v3-evidence.json).

## Konkrét publikálási terv

1. A helyi változások felülvizsgálata és commitja külön munkabranchre. A main jelenlegi távoli bázisa már újabb a helyi HEAD-nél; a friss Auto-Sync naplót az aktuális ellenőrzés már feldolgozta.
2. A legfrissebb main egyesítése a munkabranchbe, a 11 generált adat-/jelentésfájl ütközéseinek feloldása az ellenőrzött új adatokkal és a teljes megőrzött naplóval. Ha közben új API-verzió érkezik, ismételt szinkron szükséges.
3. A szükséges tesztek, `npm run build:pages`, `npm run test:pages` és a publikációs audit megismétlése az egyesített állapoton.
4. Push/PR és mainre egyesítés után a meglévő Pages-workflow publikál. Az ütemezett importhoz `ATLAS_SYNC_AUTO_PUBLISH=true` szükséges; az Auto-Sync saját deploy jobja kezeli a GITHUB_TOKEN commit utáni közvetlen Pages-kiadást.
5. Az éles oldalon ellenőrizni kell a 30%-os kitérési limitet, a 36/48-as ajánlott szinteket, a teljes tört védelmet, a 2396-os előzménylista eredményét, a Közelgő tartalmak nézetét és a 0.9.7-es addon ZIP hashét.

**Távoli commit, push és éles Pages-telepítés nem történt.** A helyi `dist` csomag elkészült; az éles telepítés eredménye még nincs igazolva.
