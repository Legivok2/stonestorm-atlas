# Stonestorm Atlas – projektállapot

Frissítve: **2026. november 6. – teljes képadatbázis, Képtár, összehasonlító, Character Planner.** A játékadatok továbbra is a 2026-11-06-i helyi pillanatképből származnak, az adatverzió `ac0984e054de`.

## A négy fejlesztés eredménye

### GitHub Pages-előkészítés

A teljes projekt statikus publikálásra alkalmas. Elkészült a GitHub Actions-workflow (`.github/workflows/pages.yml`), a `.gitignore`/`.gitattributes`, a tételes forrás- és futásidejű csomagolás, a titok-/személyesadat-mintakereső, az engedélynyilvántartás és az alkönyvtáras Pages-teszt. GitHub repository: https://github.com/Legivok2/stonestorm-atlas . Az első forráskiadás a saját kódot és a korábban engedélyezett Creator Kitet tartalmazza; a játékadatokat és ismeretlen engedélyű képeket nem terjeszti.

A feltöltési jelölt körülbelül 181 MiB, a teljes statikus előnézet körülbelül 177 MiB. 3758 kiszolgálandó fájl HTTP-ellenőrzése sikeres a `/stonestorm-atlas/` prefix alatt. A tételes jelöltben 0 hiányzó fájl és 0 titok-/személyesadat-mintatalálat volt; ez nem teljes körű adatvédelmi garancia. Az új állapothoz 13 adat-/modell-/publikációs tesztcsoport tartozik, és a meglévő DOM-tesztek Pages-prefix alatt is lefutottak.

A hivatalos sajtóoldal közvetlen ellenőrzését HTTP 403 korlátozta. A korábbi Creator Kit-engedély nyilvántartott; az új katalógus, játékmentési képek és teljes lokalizáció újraközlési engedélye nincs igazolva. A felhasználó a hivatalos letölthetőséget megerősítette, ami önmagában nem rögzít újraközlési licencet. Ezeknél a nyilvános build és feltöltési staging egyelőre leáll.

A GitHub CLI bejelentkezése **2026. november 7-én sikerült**, fiók: Legivok2. A forráskód-kiválasztás (`npm run stage:github:code`) engedély- és titokellenőrzéssel működik. A workflow a hiányzó/licenceletlen adatcsomagnál érthető készenléti összesítést ad és kihagyja a build/deploy lépést; ez nem éles weboldal. A teljes Pages élesítése és github.io címen végzett ellenőrzése **még nem történt meg**. A frissített modell-/publikációs tesztek száma 15. Útmutató: `docs/DEPLOYMENT.md`. A `.release/local-review/` és `.integration/pages-preview/` csak helyi átnézésre szolgál.

1. **Teljes képadatbázis-integráció:** a 2124 manifest-bejegyzésből 2103 helyi, érvényes WebP ellenőrizve. A manifest, CSV, képbyte-ok, méretek, SHA-256 és adatkapcsolatok egységes nyilvántartásba kerültek. Mind a 182 tárgy, 22 kísérő, 8 hátas, 64 ellenfél és 6 pálya kapott társított grafikát; a bizonytalan párosítások jelöltek.
2. **Interaktív Képtár:** 26 kategória, élő keresés, kategória-/állapotszűrés, háromféle rendezés, 24 kép/oldal, nagy képnézet, eredeti felbontás és Wiki-kapcsolatok. Az ismeretlen képek külön kereshetők. Minden statisztika a generált katalógusból számolódik.
3. **Felszerelés- és kinézet-összehasonlító:** négy kaszt, két nem, két grafikai változat; fegyver-, páncél-/szett- és teljes karakterképnézet. Valós követelményszint, tier, szett és név szerinti szűrés, két nagy kép, igazolt tárgystatok és különbségek. A teljes karakterképekre nem kerül mesterséges felszerelésréteg.
4. **Character Planner:** A/B build, kaszt/nem/szint/grafika, nyolc valódi felszerelési hely, validált tárgyválasztó, +0–+9 fejlesztés, family-alapú szettbónuszok, kísérő és hátas, teljes karakterelőnézet, helyi névvel mentés/betöltés/szerkesztés/törlés és ellenőrzött megosztási hivatkozás.

Mindez az eredeti `index.html` alkalmazásba épült. Megmaradt a korábbi kalauz, 462 játékadatlap, kaszt-összehasonlító, napi lista/mentés, cikkkereső, GYIK, Creator Kit-galéria és a céhes/utazási/XP-kalkulátorok. Az Atlas 12 korábbi menüpontjához 3 új menüpont került. Az új Képtár 2103 további kép-adatlapot kínál.

## Képállomány és párosítás

| Mutató | Darab |
| --- | ---: |
| Katalógusbejegyzés | 2124 |
| Érvényes, helyi kép | 2103 |
| Hiányzó WebP (video kategória) | 21 |
| Sérült helyi kép | 0 |
| Képkategória | 26 |
| Különböző képtartalom | 2077 |
| Duplikált tartalmú csoport | 18 |
| Azonosított kép | 882 |
| Részben azonosított | 314 |
| Ismeretlen kapcsolattal rendelkező | 907 |
| Hash alapján közös kis előnézet | 1587 |

A CSV-ben 2035 downloaded, 68 already_exists és 21 ValueError sor szerepel. A hiányzó videókra nem indítottunk új hálózati kérést. A 21 hiányzó elem nem kerül a képrácsba. Az előnézetek összmérete körülbelül 15,1 MiB; egyszerre legfeljebb 24 katalóguskártya, a Planner tárgyválasztójában 12 elem jelenik meg, lazy loadinggal. A hash-nevű előnézetek hosszú, a többi kép rövidebb böngésző-gyorsítótárat kap.

A 182 tárgy explicit art vagy pontos, megfelelő kategóriájú ID alapján társítható. A 22 kísérő grafikai sorszáma és a fejlődési forma kapcsolata nem bizonyított: ezek részleges jelölést kapnak. A 240 body és 240 portraits fájl teljes alakot / portrét jelent; a kiválasztást a páncél portrait/portraitTier mezője és a mentett kliens MD/o1/i1 szabálya támasztja alá.

**Javított korábbi hiányjelölés:** 48 tárgynál az eredeti forrásban valóban van family mező. Ezt most feldolgozzuk; az azonos szint vagy fájlnév önmagában továbbra sem bizonyít szetttagságot. Példa: a w_ninja_l10 szükséges szintje 8, nem 10.

## Fájlok és reprodukálás

- Eredeti képek: `stonestorm_image_tools/downloaded/<kategória>/<név>.webp`, változatlanul.
- Források: `stonestorm_image_tools/manifest.json`, `results.csv`, az eredeti 14 `source-data/*.json`, illetve a mentett kliens kizárólag szöveges elemzése.
- Generátor: `scripts/build-images.py`. Újraépítés: `npm run build:data` (játékadatok + képkatalógus) vagy `npm run build:images` (csak képek). Ehhez Python 3 és Pillow szükséges.
- Katalógus: `data/image-catalog.json`, `js/image-data.js`; fájlvizsgálat: `data/image-audit.json`.
- Központi feloldó: `js/image-store.js`. Előnézetek: `assets/catalog-thumbs/`.
- Új nézetek: `js/atlas-features.js`; tiszta Planner-modell: `js/planner-model.js`; stílus: `css/atlas-tools.css`.
- A kliensszabályok bizonyítékkivonata: `data/client-rule-evidence.json`.
- A korábbi 20 játékmentési kép, 32 Creator Kit-WebP és forrásnyilvántartás megmaradt. Nem számoljuk ezeket ismét a 2103 új katalógusrekordhoz, ha tartalmuk ismétlődik.

## Planner: mit számol és mit nem?

A fejlesztett tárgyértékek a mentett kliens Kn/Kv/$v szabályát követik. A +0 eredmény mind a 182 tárgy values objektumával egyezik; a +fokozatok saját kerekítést és kötelező növekedést tartalmaznak. A felszereléskomponensek számtani összege, a kaszt alapértékei, az aktív 2/4/6 szettküszöbök és a feltételes kísérő-/hátashatások külön láthatók.

A teljes szerveroldali harci képlet és a szintből származó statpontelosztás nincs megfelelően igazolva. **Végső harcerőt/HP-t/sebzést nem állítunk elő találgatással.** A nyers fajbónusz nem azonos a teljes v3 kísérőbuffal; a hátas csak ismert utazásiidő-hatást ad.

Mentés: `stonestorm-atlas-builds-v1`, legfeljebb 20 build. A régi kalauz mentési kulcsa változatlan. Megosztás: `#atlas/planner?build=<URL-kódolt JSON>`, verzió-, hossz-, ID-, slot-, kaszt- és szintellenőrzéssel. Nincs adatküldés vagy játékfiókkapcsolat.

## Ellenőrzések

- Mind a 2103 eredeti kép Pillow-val ellenőrizve, sérült fájl: 0; kanonikus és előnézeti fájlok megléte ellenőrizve.
- `npm run check`: szintaxis, HTML-azonosítók, helyi hivatkozások, régi és új katalógusképek sikeres ellenőrzése.
- `npm test`: 9 sikeres tesztcsoport, a korábbi kalkulátorokon túl képforrások, relációk, 182 tárgyképlet, +fokozatok, hibás buildbemenetek és szettküszöbök.
- `npm run test:dom`: megőrzött 462 adatlap és interakciók; továbbá 26 képkategória, keresés, képnézet, 4 kaszt × 2 nem, összehasonlító, Planner-követelmények, mentés/betöltés/törlés, A/B és megosztott link.
- `npm run test:http`: az új modulok és mind a 26 kategória eredeti/előnézeti erőforrásai HTTP 200 választ adnak; a mentett játék-HTML, letöltő, nyers adatok és könyvtárbejárási útvonalak kizárva.
- **Valódi asztali/mobilos böngészős és vizuális QA nem történt:** a browser access host és natív Computer Use kapcsolat nem érhető el. A jsdom nem ellenőriz valódi tördelést, képdekódolást vagy natív dialog-fókuszt. A reszponzív CSS elkészült, de valódi böngészős vizsgálata hátravan.

## Hiányzó adatok és következő feladatok

1. Végső karakter-/harcerőképlet és szintből adódó tulajdonságok/statpontok.
2. A szett sisak-/ékszersablonjai; a forrás jelenleg csak fegyver/páncél sablonokat ad családonként.
3. A kísérőgrafikák fázisának, a régi/v3 skálázásnak és a képességfejlődés alkalmazási körének bizonyítása.
4. Teljes céhes nyang-, alapanyag- és követelménytáblázat; a jelenlegi ismeretlen árak továbbra is jelöltek.
5. Bútorokhoz/házhoz valódi költség és bónuszadatok. Az 50 bútorgrafika önmagában nem igazol ilyen adatot.
6. A 907 ismeretlen képkapcsolat ellenőrzése, további lokalizált nevek, 21 hiányzó video-WebP kezelése valódi videóformátumra vonatkozó új igény esetén.
7. Valódi mobil/asztali, billentyűzetes és képernyőolvasós ellenőrzés.
8. Nyilvános felhasználási engedélyek: a letöltött katalógus és játékmentési grafikák engedélye nincs igazolva. A korábbi Creator Kit-engedély külön maradt. Nem történt nyilvános publikálás.

## Indítás

```powershell
cd C:\xampp\htdocs\StoneStorm
npm start
```

Megnyitás: **http://localhost:4173**. Nincs szükség alkalmazásfüggőség telepítésére. Az opcionális DOM-tesztekhez a korábban telepített jsdom kell a `.integration/qa/` alatt. A saját Node-szerver csak a Wiki futásidejű fájljait és az ellenőrzött képkönyvtárak WebP-it szolgálja ki; az Apache konfigurációját nem változtattuk meg.

Részletek: [képintegráció és Képtár](docs/IMAGE_INTEGRATION.md), [Character Planner és képletek](docs/CHARACTER_PLANNER.md), [adatforrások](DATA_SOURCES.md). A korábbi állapot történeti példánya: `docs/PROJECT_STATUS_V2.md`.
