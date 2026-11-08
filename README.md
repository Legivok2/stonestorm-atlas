# Stonestorm Atlas – Magyar Wiki és Kalauz

A korábbi magyar kezdőkalauz és az új Codex-adatcsomag egyetlen statikus alkalmazásban. Vanilla JavaScript, helyi képek és adatcsomag; nincs játékfiókkapcsolat, kötelező csomagtelepítés vagy keretrendszer.

> **Teljes Atlas-kiadás, 2026. november 7.:** a projektgazda kifejezetten kérte a teljes helyi változat publikálását, és feloldotta a korábbi engedélyellenőrzési feltételt. A GitHub Pages az eredeti `index.html`, CSS, JavaScript, játékadatok és képek alapján készül; nincs kalauzra egyszerűsített helyettesítő kiadás. A közzétételi utasítás az `.publication/permissions.json` fájlban szerepel, külön az igazolt licencektől.

## Megnyitás

**Teljes weboldal (GitHub Pages): [legivok2.github.io/stonestorm-atlas](https://legivok2.github.io/stonestorm-atlas/)**. A megosztott linkhez nincs szükség letöltésre, GitHub-fiókra vagy telepítésre.

GitHub repository: [Legivok2/stonestorm-atlas](https://github.com/Legivok2/stonestorm-atlas). A Pages-közzététel és a későbbi frissítés részletei: [DEPLOYMENT.md](docs/DEPLOYMENT.md). A teljes csomag `/stonestorm-atlas/` alkönyvtáras működése ellenőrizve. A `stage:github` az auditált teljes forrás- és képcsomagot választja ki.

A teljes statikus kiadás: `npm run build:pages`, ellenőrzése: `npm run test:pages`. A workflow minden main-push után ezt telepíti. Hiányzó adat vagy közzétételi felhatalmazás esetén leáll, nem cseréli le az oldalt a korábbi kalauzkiadásra.

Node.js 20 vagy újabb verzióval, a projektmappában:

```powershell
npm start
```

**http://localhost:4173** · Leállítás: Ctrl+C. Nem szükséges `npm install`.

Az `index.html` közvetlenül is megnyitható, mert az adatok helyi JavaScript-fájlból töltődnek be. A fájlként megnyitás és a mobilos tördelés új Atlas-verzióját valódi böngészőben még ellenőrizni kell. Futó XAMPP Apache mellett az alternatív cím `http://localhost/StoneStorm/`.

## Mi található benne?

- 182 felszerelés, 6 szettcsalád, 22 kísérő, 10 kísérőkészség és 8 hátas.
- 6 pálya, 64 ellenfél, 6 bosskapcsolat, 4 kazamata és 131 alapanyag/fogyóeszköz.
- 4 kaszt, 3 királyság, 14 kutatási lépés és 5 céhes épület 15 szinttel.
- 462 megnyitható adatlap, keresés, kategóriaszűrés, rendezés, lapozás és kapcsolódó tartalmak.
- Céhes fejlesztési és gyorsítási tervező, utazásiidő-kalkulátor és saját mérésekkel kitölthető XP/energia összehasonlító.
- A megőrzött kezdőkalauz, kaszt-összehasonlító, napi ellenőrzőlista, cikkkereső, GYIK és nagyítható képgaléria.
- **Teljes Képtár:** 2103 ellenőrzött helyi kép 26 kategóriában, állapotszűrővel, kereséssel, rendezéssel, nagy képnézettel és Wiki-kapcsolatokkal: `#atlas/gallery`.
- **Felszerelés-/kinézet-összehasonlító:** négy kaszt, férfi/női, két grafikai változat, két fegyver/páncél/teljes karakterkép összevetése: `#atlas/compare`.
- **Character Planner:** validált nyolc felszerelési hely, +0–+9, valódi szettkapcsolatok, kísérő/hátas, teljes karakterelőnézet, A/B build, helyi mentés és megosztási link: `#atlas/planner`.
- **📊 Stat limitek:** kilenc statisztika, forrás- és megbízhatósági jelölések, azonnali harci limitkalkulátor, kritikus sebzésmodell, fegyverbónusz-táblázat és XP-/nyangösszegző: `#atlas/stat-limits`.

A globális kereső billentyűparancsa **/**. Adatlap közvetlen hivatkozására példa: `#atlas/equipment/item/w_warrior_0`. A modális adatlap Escape-pel és a bezárógombbal zárható.

### Stat limitek adatainak frissítése

A központi adatok a `js/stat-limits.js` fájlban találhatók; a felület a `js/stat-limits-ui.js`, a tiszta százalékszámítások az `atlas-math.js` részei. A 75%-os korlát sebzéscsökkentésre vonatkozik, nem védelmi pontokra. A normál kitérés 35%-a a projektgazda által közölt súgóadat; a többi harci korlát a mentett szabályokkal egyeztetett.

A +84,7% XP és +130% nyang elért, közölt játékosértékek, nem maximumok. A teljes és a felszerelésből származó érték különbsége csak számtani különbség. Az összegző nem igazolja a ténylegesen érvényesülő bónuszt. A támadás, HP, XP- és nyangbónusz felső korlátja továbbra sem igazolt.

A kritikus kalkulátor külön kezeli az esélyt (legfeljebb 50%) és a kritikus sebzésbónuszt (legfeljebb +75%). A szorzó `1,5 + érvényesülő bónusz / 100`, maximum 2,25×. A 10 000 / 50% / +40% példa 19 000 kritikus és 14 500 átlagsebzést ad. Az átlag egyszerűsített modell, nem tartalmazza a védelem, kitérés, képességek vagy más módosítók hatását. A kiegészítő felszerelésbónusz üresen nulla; negatív összesített bónusznál az alapszorzó marad.

A hat fegyverszintsáv harminc T1–T5 bónusza kattintással betölthető; szintváltáskor a kiválasztott fokozat követi a megfelelő sávot. A T-fokozatokat nem nevezzük hivatalos ritkaságnak. Ezek kliensalapértékek, nem igazolt szerveroldali kiosztási vagy generálási esélyek. A helyi kivonatban az alaptier ellenőrizhető; a teljes magasabb szintű sávlistát a projektgazdai klienskivonat alapján tároljuk.

Az új egységtesztek az `npm test` részei. Az opcionális, valódi Chromiumteszt 1440, 390 és 320 px szélességen fut: `npm run test:stats:browser`. A Playwright és böngészője csak a helyi `.integration/browser-qa/` QA-mappába települt, nem az alkalmazás függősége; a felület és a Pages-build csomagtelepítés nélkül működik.

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
