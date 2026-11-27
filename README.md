# Stonestorm Atlas – Magyar Wiki és Kalauz

## A repository projektjei

- **Stonestorm Atlas:** játékadatok, magyar és angol wiki és információs felületek, a meglévő automatikus adatfrissítési rendszerrel.
- **Stonestorm Companion:** Chrome-bővítmény, aktuális verziója **0.14.0 BETA**. Statokat és limiteket, kísérőstatisztikákat, felszereléspreseteket, portyákat és kalkulátorokat kínál magyar és angol kezelőfelülettel. Az aktív funkciófejlesztés ennél a verziónál szünetel; hibajavítások és kompatibilitási frissítések továbbra is készülhetnek.
- **Stonestorm Workspace:** különálló, Electron-alapú Windows-alkalmazás normál játék móddal, több eredeti játékpéldánnyal és négyes Tárnák munkaterülettel. A Workspace **fejlesztői előzetes**, nem végleges kiadás.

Kapcsolat és visszajelzés: **Discord: `pain6089`**

### English overview

- **Stonestorm Atlas:** game data, Hungarian and English wiki and reference interfaces, plus the existing automated data update system.
- **Stonestorm Companion:** a Chrome extension, currently **0.14.0 BETA**, with stats and caps, companion statistics, equipment presets, raids, calculators, and Hungarian/English UI. Active feature development is paused at this version; maintenance fixes may still be released.
- **Stonestorm Workspace:** a separate Electron-based Windows application with normal game mode, multiple original game instances, and a four-panel Mines workspace. It is a **development preview**, not a final release.

Contact and feedback: **Discord: `pain6089`**

---

A korábbi magyar kezdőkalauz és az új Codex-adatcsomag egyetlen statikus alkalmazásban. Vanilla JavaScript, helyi képek és adatcsomag; nincs játékfiókkapcsolat, kötelező csomagtelepítés vagy keretrendszer.

> **Teljes Atlas-kiadás, 2026. november 7.:** a projektgazda kifejezetten kérte a teljes helyi változat publikálását, és feloldotta a korábbi engedélyellenőrzési feltételt. A GitHub Pages az eredeti `index.html`, CSS, JavaScript, játékadatok és képek alapján készül; nincs kalauzra egyszerűsített helyettesítő kiadás. A közzétételi utasítás az `.publication/permissions.json` fájlban szerepel, külön az igazolt licencektől.

## Megnyitás

**Teljes weboldal (GitHub Pages): [legivok2.github.io/stonestorm-atlas](https://legivok2.github.io/stonestorm-atlas/)**. A megosztott linkhez nincs szükség letöltésre, GitHub-fiókra vagy telepítésre.

GitHub repository: [Legivok2/stonestorm-atlas](https://github.com/Legivok2/stonestorm-atlas). A Pages-közzététel és a későbbi frissítés részletei: [DEPLOYMENT.md](docs/DEPLOYMENT.md). A teljes csomag `/stonestorm-atlas/` alkönyvtáras működése ellenőrizve. A `stage:github` az auditált teljes forrás- és képcsomagot választja ki.

A teljes statikus kiadás: `npm run build:pages`, ellenőrzése: `npm run test:pages`. A workflow minden main-push után ezt telepíti. Hiányzó adat vagy közzétételi felhatalmazás esetén leáll, nem cseréli le az oldalt a korábbi kalauzkiadásra.

**Atlas HU/EN támogatás:** a fejléc Magyar / English kapcsolója a kezdőkalauzt (26 cikk és 10 GYIK-bejegyzés) és az Atlas jelenlegi fő funkcióit magyarul és angolul is elérhetővé teszi; a nyelv a böngészőben mentődik. Az igazolatlan angol játéknevek helyett az eredeti nevek, az ismeretlen külső forrású szabad szövegek pedig eredeti alakban maradnak. A felszerelésadatokban nincs ritkaságmező, ezért a meglévő tier látható.

**Atlas HU/EN support:** the Magyar / English selector in the header makes the beginner guide (26 articles and 10 FAQ entries) and all current main Atlas features available in Hungarian and English; the preference is stored in the browser. Original game names are retained where English names are unverified, as is unknown free text from external sources. Equipment data has no rarity field, so the existing tier is shown instead.

Node.js 20 vagy újabb verzióval, a projektmappában:

```powershell
npm start
```

**http://localhost:4173** · Leállítás: Ctrl+C. Nem szükséges `npm install`.

Az `index.html` közvetlenül is megnyitható, mert az adatok helyi JavaScript-fájlból töltődnek be. A megújult felület HTTP-s előnézete és Pages-kiadása 375, 768, 1440 és 1920 pixelen valódi böngészővel ellenőrzött. Futó XAMPP Apache mellett az alternatív cím `http://localhost/StoneStorm/`.

## Helyi képpárosító

A vizuálisan megújult Atlas a [GitHub Pages oldalon](https://legivok2.github.io/stonestorm-atlas/#atlas/overview) érhető el. Helyi előnézet: **http://127.0.0.1:4173/#atlas/overview** (`npm start`). A szerkezeti változások, komponensek és vizuális ellenőrzés leírása: [Vizuális megújulás](docs/VISUAL_DESIGN.md).

Helyi képgyűjtés és vizuális jóváhagyás: [Atlas Image Manager / Image Collector V2](stonestorm_image_tools/IMAGE_COLLECTOR_V2.md). Indítás: `npm run images:manager`, cím: **http://127.0.0.1:4174/**. A gyűjtő az aktív Atlast nem módosítja; az új képek és döntések Gitből kizárt staging mappába kerülnek.

## Stonestorm Companion · Chrome-bővítmény · BÉTA

Az aktuális kiadás **0.14.0 BETA**. Magyar és angol felületen kínál áttekintést, statokat és limiteket, kísérőstatisztikákat, felszereléspreseteket, portya-összehasonlítást és helyi kalkulátorokat. Telepítés, adatkorlátok és ellenőrzések: [Companion útmutató](addons/stonestorm-statcap-overlay/README.md).

**[Stonestorm Companion 0.14.0 BETA – ZIP](https://legivok2.github.io/stonestorm-atlas/downloads/stonestorm-companion-0.14.0-beta.zip)** · Készítő: Patrik. A kompatibilitási `stonestorm-statcap-overlay.zip` ugyanazt a csomagot tartalmazza. A telepített böngészőbővítmény frissítése kézi.

Asztali Chrome: csomagold ki a ZIP-et állandó mappába, nyisd meg a `chrome://extensions` oldalt, kapcsold be a Fejlesztői módot, és a **Kicsomagolt bővítmény betöltése** gombbal válaszd a manifestet tartalmazó mappát. Frissítéskor ugyanott cseréld le a fájlokat, majd töltsd újra a meglévő bővítményt és a játék lapját. Részletes [telepítési útmutató](addons/stonestorm-statcap-overlay/README.md) és [adatkezelési összefoglaló](addons/stonestorm-statcap-overlay/PRIVACY.md).

Az Atlas oldalbetöltéskor, panelnyitáskor, visszatéréskor és látható lapon 15 percenként lekéri a saját Pages-kiadási JSON-ját. Új verziónál **„🔔 Új verzió elérhető!”** jelzés jelenik meg. A letöltés és telepítés kézi. Az addon telepített verziója nem olvasható ki automatikusan: a panelen megadhatod, vagy a korábban látott kiadáshoz történik a hasonlítás. Hálózati hiba esetén a legutóbb ismert letöltés megmarad.

Forrás: `addons/stonestorm-statcap-overlay/`. Csomag és verzióadat: `downloads/stonestorm-statcap-overlay.zip`, `downloads/stat-addon.json`; generálás: `npm run build:addon`. A Pages-build ezt automatikusan elkészíti, és kizárólag ezt a tételesen ellenőrzött ZIP-kivételt publikálja. Új kiadás előtt a manifest verzióját emeld, készítsd újra és commitold a csomagot is: [PUBLISH.md](addons/stonestorm-statcap-overlay/PUBLISH.md). Ellenőrzések: `npm run check:addon`, `npm run test:addon:source`, `npm run test:addon:browser`.

## Mi található benne?

- **Stonestorm Companion 0.14.0 BETA:** kétnyelvű Chrome-bővítmény kézi telepítési/frissítési útmutatóval és helyben mentett beállításokkal.

- 182 felszerelés, 6 szettcsalád, 22 kísérő, 10 kísérőkészség és 8 hátas.
- **Kísérőfejlődés:** öt kliensforma, 10/20/35/50/60 plafon, négy átváltozás és 0/1/2/3/3 tanulható hely, teljes képességtáblák, etetés/XP/könyvek: `#atlas/pets`. A Pet Builder V2 külön formát és szintet, képességválasztást, 1–5. képességszinteket, helyi mentést és URL-megosztást kezel.
- 6 pálya, 64 ellenfél, 6 bosskapcsolat, 4 kazamata és 131 alapanyag/fogyóeszköz.
- 4 kaszt, 3 királyság, 14 kutatási lépés és 5 céhes épület 15 szinttel.
- 462 megnyitható adatlap, keresés, kategóriaszűrés, rendezés, lapozás és kapcsolódó tartalmak.
- Céhes fejlesztési és gyorsítási tervező, utazásiidő-kalkulátor és saját mérésekkel kitölthető XP/energia összehasonlító.
- A megőrzött kezdőkalauz, kaszt-összehasonlító, napi ellenőrzőlista, cikkkereső, GYIK és nagyítható képgaléria.
- **Teljes Képtár:** 2103 ellenőrzött helyi kép 26 kategóriában, állapotszűrővel, kereséssel, rendezéssel, nagy képnézettel és Wiki-kapcsolatokkal: `#atlas/gallery`.
- **Felszerelés-/kinézet-összehasonlító:** négy kaszt, férfi/női, két grafikai változat, két fegyver/páncél/teljes karakterkép összevetése: `#atlas/compare`.
- **Character Planner:** validált nyolc felszerelési hely, +0–+9, valódi szettkapcsolatok, kísérő/hátas, teljes karakterelőnézet, A/B build, helyi mentés és megosztási link: `#atlas/planner`.
- **📊 Stat limitek:** tizenhat statisztika, forrás- és megbízhatósági jelölések, azonnali harci limitkalkulátor, kritikus sebzésmodell, fegyverbónusz-táblázat és forrásos XP-/nyang-/zsákmánykalkulátor: `#atlas/stat-limits`.
- A Character Planner, a felszerelés-összehasonlító, a Stat limitek és a Bónuszrendszer HU/EN felületet használ. A százalékos kalkulátorok tizedesvesszőt és tizedespontot is elfogadnak; az igazolatlan kritikus soft-cap mellett nem jelenítünk meg végső sebzésértéket.
- **Bónuszrendszer:** egységes 20-as tárgybónusz-katalógus, külön fegyver-/páncél-/ékszerpoolok, tizenegy bónuszforrás dokumentációja, tárgyadatlap-kapcsolatok és a megosztott jutalomkalkulátor: `#atlas/bonuses`.

A globális kereső billentyűparancsa **/**. Adatlap közvetlen hivatkozására példa: `#atlas/equipment/item/w_warrior_0`. A modális adatlap Escape-pel és a bezárógombbal zárható.

### Stat limitek adatainak frissítése

A központi adatok a `js/stat-limits.js` fájlban találhatók; a felület a `js/stat-limits-ui.js`, a tiszta százalékszámítások az `atlas-math.js` részei. A 75%-os korlát sebzéscsökkentésre vonatkozik, nem védelmi pontokra. A content API-val egyeztetett korlátok: kritikus esély 50%, kritikus sebzésbónusz 75%, képesség-sebzés 50%, bossbónusz 35%, gyógyital-hatás 25%, életlopás 8%, damageTaken tárgybónusz 20%. A normál kitérés 35%-os kulcsa és az összesített harci kitérés 12%-os kulcsa külön szabálykör.

A +84,7% XP és +130% nyang történeti, közölt játékosértékek, nem maximumok; adatként megmaradnak. Az XP, nyang és zsákmány két külön keretet használ: normál 100 százalékpont, fizetős 50 százalékpont. A menlevél +25/+20/+10 és a VÉ-főzetek a közös fizetős keretbe számítanak; a nyangos főzet normál. A támadás, nyers védelem és HP globális plafonja továbbra sem igazolt; a polírkomponens korlátja nem karakterplafon.

A központi `js/bonus-system.js` tárolja a húsz megnevezést, az értéktípusokat, a külön típuspoolokat és forrásbesorolásokat. Ezt használják a felszerelésadatlapok és a Planner statcímkéi is. A `js/bonus-ui.js` ugyanazt a jutalomkalkulátort jeleníti meg a Stat limitek és a Bónuszrendszer oldalon. Képlet: `min(normál összeg, 100) + min(fizetős összeg, 50)`. Egy összesítő mutatja a gyűjtött és érvényes értéket, a két keretet és a veszteséget; a részletes források lenyithatók. XP: `48,5 + 9,9 + 13 + 25 = 96,4`, veszteség nélkül. Nyang: `106,3 + 0,3 + 13 + 20 = 139,6 → 120`, veszteség 19,6 százalékpont. A +150% elméleti maximumhoz mindkét keretet ki kell tölteni; a fizetős túllépés nem használhatja fel a normál keret szabad részét.

A pooladatok és harci korlátok a 2026-11-09-én olvasott nyilvános kliensadatból származnak (`658dc911d321`); a kivonat a `data/bonus-system-evidence.json` fájlban található. A forrásbesorolás a közölt játékleírást követi. A nem igazolt altípus-hozzárendeléseket és szerveres generálási esélyeket nem találjuk ki. A régebbi teljes játékpillanatkép változatlan marad.

A kritikus kalkulátor külön kezeli az esélyt (legfeljebb 50%) és a kritikus sebzésbónuszt (legfeljebb +75%). A szorzó `1,5 + érvényesülő bónusz / 100`, maximum 2,25×. A 10 000 / 50% / +40% példa 19 000 kritikus és 14 500 átlagsebzést ad. Az átlag egyszerűsített modell, nem tartalmazza a védelem, kitérés, képességek vagy más módosítók hatását. A kiegészítő felszerelésbónusz üresen nulla; negatív összesített bónusznál az alapszorzó marad.

A hat fegyverszintsáv harminc T1–T5 bónusza kattintással betölthető; szintváltáskor a kiválasztott fokozat követi a megfelelő sávot. A T-fokozatokat nem nevezzük hivatalos ritkaságnak. Ezek kliensalapértékek, nem igazolt szerveroldali kiosztási vagy generálási esélyek. A helyi kivonatban az alaptier ellenőrizhető; a teljes magasabb szintű sávlistát a projektgazdai klienskivonat alapján tároljuk.

Az új egységtesztek az `npm test` részei. Az opcionális, valódi Chromiumteszt 1440, 390 és 320 px szélességen fut: `npm run test:stats:browser`. A Playwright és böngészője csak a helyi `.integration/browser-qa/` QA-mappába települt, nem az alkalmazás függősége; a felület és a Pages-build csomagtelepítés nélkül működik.

### Kísérőrendszer és forráseltérések

A `data/pet-system-evidence.json` őrzi a `pets.v3`, `spine.hero.pets`, magyar fordítás és a nyilvános kliens szabályainak elkülönített bizonyítékait. A Planner a kliensmodell 10/20/35/50/60 formaplátóit használja; a régi 10/20/30/40/50-es megfigyelés történeti konfliktusként marad. A Mohaagancs 22/35, +12,6% XP, trait/signature/képesség és 11/15 Mesterfok csak a megadott referenciaállapot, nem általánosított képlet. Mesterfok és nyers API-rang nem azonosított.

A `js/pet-system.js` közös modellje kezeli a formákat, határszinteket, hősszintkorlátot és a képességleírásokat. A `js/pet-ui.js` ugyanazt a fejlődési táblát használja a főoldalon és a 22 faj adatlapján. A 10 készség mind az öt képességszintje látható. Az átváltozási és etetési API-alapköltségek felülírhatóak karakterenként; végleges szerveres árat nem találgatunk. A két XP-megosztási konfiguráció külön látható. A reference minták nem feloldási szintek. A képességkönyv és a fajgyűjtemény Kísérő-könyve külön rendszer.

Ellenőrzés: `npm test`, `npm run test:pets:browser` (1440/390/320 px). Régi `version:1` build link formamező nélkül is betölthető; az új formamező és az 50-es szint menthető/megosztható.

## Szerkesztési helyek

```text
index.html                  Egyetlen belépési pont; Atlas és eredeti kalauz
css/style.css               Megőrzött kalauzstílusok
css/atlas.css               Az Atlas reszponzív fantasy megjelenése
js/content.js               Kalauzcikkek, GYIK, napi teendők, médiatartalom
js/main.js                  Kalauzinterakciók és mobilos főmenü
js/atlas.js                 Atlas-nézetek, keresés, szűrés, útvonalak, adatlapok
js/atlas-math.js            Külön tesztelhető tiszta kalkulátorfüggvények
js/atlas-features.js        Képtár, összehasonlító, Planner és mentés felülete
js/planner-model.js         Tiszta Planner-validálás és ismert statkomponensek
js/image-store.js           Központi képfeloldó és karakterkép-választó
js/image-data.js            Generált, 2103 képes katalógus
css/atlas-tools.css         Az új nézetek és a Planner megjelenése
js/atlas-data.js            Generált, fetch nélkül használható adatcsomag
source-data/*.json          A ZIP 14 eredeti, tematikus adatforrása
scripts/build-data.mjs      Leképezés, deduplikáció, forrás- és képlenyomatok
scripts/build-images.py     Fájlvalidálás, képpárosítás és előnézet-generálás
scripts/check.mjs           Szintaxis- és helyi hivatkozásellenőrző
data/atlas.json             Generált adatcsomag JSON-változata
data/image-manifest.json    A 20 új grafika eredete és engedélyállapota
data/image-catalog.json     A teljes katalógus és a kapcsolatok bizonyítékai
data/image-audit.json       Hiányzó/sérült képek és duplikátumcsoportok
data/client-rule-evidence.json  Statikus kliensszabály-kivonat és forráshash
data/integration-audit.json A helyi és ZIP-fájlok összehasonlítása
assets/images/              A korábbi Creator Kit 32 WebP-változata
Stonestorm_files/*.webp     Változatlan nevű játékmentési grafikák
stonestorm_image_tools/     Eredeti manifest, results.csv és downloaded képek
assets/catalog-thumbs/     Hash-alapú, optimalizált kis előnézetek
serve.mjs                   A Wiki fájljait kiszolgáló helyi szerver
tests/                      Számítás-, adat-, opcionális DOM- és HTTP-tesztek
PROJECT_STATUS.md           Részletes állapot, eredmények, hiányok, QA-korlátok
DATA_SOURCES.md             Források, eltérések és képeredet
docs/GUIDE_LEGACY.md        Az eredeti README történeti példánya
```

Adatfrissítéskor a `source-data/` megfelelő fájlját és szükség esetén a generátor leképezését szerkeszd, majd:

```powershell
npm run build:data
npm run check
npm test
```

A generált fájlok kézi változtatásait az újragenerálás felülírja. Új kalauzcikk a `js/content.js` `articles` tömbjébe kerül; stabil hivatkozása `#cikk-azonosito`. A meglévő kalauz bővítési részletei a történeti README-ben is megtalálhatók.

A teljes adat-/képkatalógus újraépítéséhez Python 3 és Pillow is szükséges; a már generált oldal futtatásához csak Node.js kell. Csak a képkatalógus újraépítése: `npm run build:images`. A generátor nem indít letöltést, és az eredeti képeket nem módosítja.

## Ellenőrzések

- `npm run check`: szintaxis, helyi fájlhivatkozások, képek és HTML-azonosítók.
- `npm test`: 9 tesztcsoport a számítások, adatok, képkapcsolatok, 182 fejlesztési képlet, Planner-korlátok, szettküszöbök és hibás buildlinkek ellenőrzésére.
- `npm run test:http`: működő `npm start` mellett a fájlkiszolgálás és a kizárt útvonalak ellenőrzése.
- `npm run test:dom`: opcionális jsdom-regresszió mind a 462 játékadatlappal és régi interakciókkal; továbbá 26 képkategória, összehasonlító, 4 kaszt × 2 nem, Planner, mentés/betöltés/törlés és megosztott build. A kizárólag fejlesztői eszköz telepítése:

```powershell
npm install --prefix .integration/qa --no-save --package-lock=false jsdom@24.1.3
npm run test:dom
```

- `npm run test:atlas:calculators:i18n:browser`: a Pages build után a karaktertervező, statlimitek, kritikus és jutalomkalkulátor, valamint az összehasonlító HU/EN Chromium-ellenőrzése 375 és 1440 px szélességen.
- `npm run test:atlas:system:i18n:browser`: a Pages build után a Sync, Watcher, forrásjelzések és Atlas addonpanel HU/EN Chromium-ellenőrzése 375 és 1440 px szélességen.
- `npm run test:atlas:gallery:i18n:browser`: a Pages build után a Képtár generált címkéinek, keresésének és adatlapjainak HU/EN Chromium-ellenőrzése 375 és 1440 px szélességen.

A fenti automatikus ellenőrzések sikeresek. **Valódi böngészős/vizuális ellenőrzés az új verzión nem történt**, mert ebben a munkamenetben a böngésző- és natív vezérlés nem elérhető. A jsdom nem helyettesíti a tényleges mobilos tördelés és a natív dialógus ellenőrzését. Az eredeti README 2026. októberi böngészőeredményei a régi kalauzra vonatkoznak.

## Adatok és korlátok

A játékadatok **2026-11-06-i helyi pillanatképből** származnak. Az aktuális szerver eltérhet. A hiányzó céhes költséget, angol neveket, ház-/bútorbónuszokat és végső harci képletet jelöljük. A képkatalógus a tárgyakat, kísérőket, hátasokat és karaktereket már lefedi, de például a kísérők grafikai fejlődési fázisa ellenőrzendő. Az eltérő energia-/kísérőverziókat nem egyesítjük találgatva. A szetttagságot az explicit family mező adja, nem a szint vagy fájlnév.

A korábbi kalauz a napi lista helyi dátumát/pipáit, a két kasztot és témaszűrőt tárolja (`stonestorm-hu-guide-v1`). A Planner külön kulcson legfeljebb 20, névvel ellátott buildet ment (`stonestorm-atlas-builds-v1`). A megosztási link az URL fragmentumában tartalmazza a validált konfigurációt; nincs adatküldés vagy játékfiókkapcsolat. A napi lista a készülék naptári napját követi.

## Képek és későbbi publikálás

Megmaradt a 12 eredeti Creator Kit-grafika 32 WebP-változata. Az Atlas további 20 eredeti nevű játékmentési grafikát használ. A ZIP-ben ténylegesen **48** WebP van (a kézikönyv 47-et ír); mindnek azonos párja van a meglévő mentésben, ezért nincs újabb futásidejű másolat.

Az új katalógus **2103** helyi WebP-t tartalmaz (2077 különböző tartalom): 882 azonosított, 314 részben azonosított, 907 ismeretlen kapcsolatú kép. Az 1587 kis előnézet a listákhoz készült, az eredetik változatlanok. A katalógus- és játékmentési képek nyilvános újraközlési engedélye nincs igazolva; a korábbi Creator Kit-engedély nem terjed ki rájuk automatikusan.

A Creator Kit korábbi engedélye az `assets/images/sources.json` és `IMAGE_SOURCES.md` fájlban szerepel. A további játékanyagok igazolt licencállapota nem változott; a teljes kiadás a projektgazda külön, 2026-11-07-i közzétételi utasítására készül. A licencállapot és a közzétételi felhatalmazás külön mezőben marad.

A Pages-artifact csak a szükséges futásidejű fájlokat tartalmazza: `index.html`, `css/`, `js/`, `assets/`, a használt régi WebP-k és a `stonestorm_image_tools/downloaded/` képei. **A mentett `Stonestorm.html`, játék-JS/CSS, letöltőscript, CSV, ZIP, `source-data/` és `.integration/` nem része a közzétett webhelynek.** A feldolgozott forrásadatok és saját buildeszközök a forrás-repositoryban szerepelnek. Az alkalmazáshivatkozások relatívak.

Részletes eredmények: [PROJECT_STATUS.md](PROJECT_STATUS.md). Források és hiányok: [DATA_SOURCES.md](DATA_SOURCES.md).

Új modulok: [Képintegráció és Képtár](docs/IMAGE_INTEGRATION.md), [Character Planner és képletek](docs/CHARACTER_PLANNER.md).

## Auto-Sync V1

Az **Atlas frissítések** nézet megmutatja az utolsó sikeres nyilvános adatellenőrzést, a megfigyelt játék- és Atlas-verziót, az importált rekordokat és az ellenőrzésre váró újdonságokat. A kézi forráscsomagot megőrző import a `data/sync-import.json` fájlban különül el; a kísérők, statlimitek és a játékban igazolt M4 szett védettek. Az addon számításai változatlanok.

`npm run sync:check`: valódi lekérés és jelentés, Atlas-import nélkül. `npm run sync:apply`: ismert adatok importja automatikus tesztekkel és hibánál visszaállítással. `npm run test:sync`: az Auto-Sync regressziós tesztjei. A teljes `npm test` ezeket és a szettbónusz-teszteket is futtatja.

A GitHub Actions 6 órás ellenőrzését, az éles import `ATLAS_SYNC_AUTO_PUBLISH` kapcsolóját, az adatforrásokat, korlátokat és a visszaállítást a [részletes használati útmutató](docs/AUTO_SYNC.md) írja le. A történeti alap 2026-11-06-i; az új API-adatok csak az ellenőrzött importkörökben frissülnek, nem minden rendszerben egyszerre.

Az ismert kazamaták normál és hősi termeinek numerikus statjai is importálhatók, kizárólag változatlan, teljesen validált szerkezet mellett. A frissítési nézet rendszerenként és témánként csoportosít, külön kezeli a régi nyitott ügyeket, az új eseményeket, az importokat és a dokumentált lezárásokat. A `reviewLedger` megőrzi a lezárási bizonyítékokat; a változatlan API önmagában nem old meg régi tételt.

## Otthon és Aréna V2

`#atlas/arena`: a Tiszta aréna és a Bandita Liga külön adatlaprészekben. `#atlas/home`: házfokok, szobák, lapozható képes bútornév-katalógus, témák, trófeák, persely és Dongsu teaháza; a kutatások külön megmaradnak. A pontos árak és nem publikus limitek mintára váróként szerepelnek. [Részletes forrás- és hiányjelentés](docs/HOME_ARENA_V2.md).

A Companion 0.14.0 BETA a Chrome bővítményikonjáról indítható; az opcionális fejlesztői mód anonim kutatási exportot is tartalmaz. A ZIP újragenerálható: `npm run build:addon`; a main-push után a Pages-workflow csomagolja és ellenőrzi a letöltést.

A weboldal futtatása továbbra is build nélkül lehetséges. A buildhez, tesztekhez és Auto-Synchez egyszer `npm ci` szükséges az AST-alapú, kódot nem futtató kliensfeldolgozó miatt. `npm run test:home-arena` és `npm run test:home-arena:browser` ellenőrzi az új rendszereket.
# Data Engine V2

A kísérőkártyák, az adatlap, a Planner és az addon közös V3-modellt használ. A nyilvános kísérőparaméterek az anonim exportba is bekerülhetnek, saját kísérőadatok nélkül. Részletes lefedettség, képletek, frissítési feltételek és helyi tesztek: [DATA_ENGINE_V2.md](docs/DATA_ENGINE_V2.md).
