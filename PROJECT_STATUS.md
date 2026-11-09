# Stonestorm Atlas – projektállapot

Frissítve: **2026. november 9. – v3 kísérőfejlődés javítása.** A teljes tárgy-/kép-/Planner-pillanatkép továbbra is 2026-11-06-i (`ac0984e054de`). A külön bónuszpool-, statlimit- és kísérőkiegészítés 2026-11-09-i nyilvános kliensadatból származik (`658dc911d321`).

## Kísérőrendszer

A `#atlas/pets` főoldal, mind a 22 kísérőadatlap, a 10 képességadatlap és a Character Planner javítva. A régi rules.maxLevel = 10 nem aktív végső maximum. A projektgazda jelenlegi játékmegfigyelése szerinti 10/20/30/40/50 plafonokat használjuk, hivatalos magyar v3 formanevekkel és 0/1/2/3/3 tanulható hellyel. Az elérhető klienscsomag 10/20/35/50/60 eltérése látható, nyitott konfliktus. A reference minták nem feloldási küszöbök.

Négy átváltozás feltételei és API-alapköltségei, külön jelölt szerveres felülírások, tíz képesség mind az öt szintje magyar hatásleírással és könyvikonnal. Etetés, XP, két eltérő XP-megosztási konfiguráció, könyvpoolok és a fajgyűjtemény külön kezelve. A Planner külön formát választ, figyeli a hősszintet és a forma plafonját; az 50-es szint menthető/megosztható, a régi version:1 link is betölthető. A nem kapcsolódó rendszerek változatlanok.

Ellenőrzés: 44 egység-/adat-/publikációs teszt, `test:pets:browser` és `test:stats:browser` 1440/390/320 px nézetben. A kísérőteszt az 50-es mentés/megosztás és a szakaszhatárok működését is vizsgálja; a 3764 futásidejű erőforrás Pages-alkönyvtáras tesztje sikeres.

## Bónuszrendszer

Új Atlas-oldal: `#atlas/bonuses`. Húsz egységes tárgybónusznév és értéktípus, három külön típuspool, a nem igazolt altípusok külön jelölése. A felszerelésadatlapok a saját pooljukhoz kapcsolódnak; ismeretlen hozzárendelésnél nem mutatunk hamis elérhetőséget. A statcímkék és a százalékos formázás a közös katalógust használják.

A Stat limitek és a Bónuszrendszer ugyanazt a forrásos XP-/nyang-/zsákmánykalkulátort használja. Két külön plafon: normál 100 és fizetős 50 százalékpont. A menlevél +25/+20/+10 és a VÉ-főzet közös fizetős keretet használ, a nyangos főzet normál. Egyetlen összesítő, lenyitható tizenegy forrás és magyarázó részösszegek. A két megadott példa: XP 96,4→96,4, veszteség 0; nyang 139,6→120, veszteség 19,6 százalékpont. A fizetős túllépés nem kerülhet a normál keret szabad részébe. A 150% elméleti maximum, nem automatikus játékosbónusz.

38 egység-/adat-/modell-/publikációs teszt és 3762 erőforrás helyi HTTP-tesztje sikeres. A Chromiumteszt 1440×1000, 390×844 és 320×760 nézetben ellenőrizte a két konkrét példát, a külön 100/50 plafont, a főzettípusokat, a lenyitható részleteket, a katalógust, a poolokat és a korábbi kritikus kalkulátort. A 462 adatlap, a régi kalkulátorok, a Képtár, az összehasonlító és a Planner regressziós DOM-tesztje is sikeres.

## Stat limitek

Navigációs oldal: `#atlas/stat-limits`. Tizenhat statisztika központi adatmodellből, megbízhatósági jelölésekkel és forrásokkal. A négy alap harci eredményt három százalékos karakteradatból számítjuk: sebzéscsökkentés, kritikus esély, normál kitérés és külön összesített harci kitérési szabály. A sávok a plafonig számított értéket, a szövegek az elvesző százalékpontokat mutatják. A nyers védelemből nincs átváltás. Az API-val ellenőrzött támogató limitek: képesség-sebzés 50%, bossbónusz 35%, gyógyital-hatás 25%, életlopás 8%, damageTaken 20%.

A külön kritikus kalkulátor a normál sebzésből, az esélyből, a bónuszból és opcionális kiegészítő felszerelésbónuszból számol. 1,5× alap, +75%-os hozzáadó bónuszplafon, maximum 2,25×; az esély külön legfeljebb 50%. Kijelzi az összesített, érvényesülő és elvesző bónuszt, a kritikus és egyszerűsített átlagsebzést. Hat fegyverszintsáv, harminc színkódolt T-fokozat, automatikus mezőkitöltés és szintváltás. Nincs ismeretlen szerveres esély vagy hivatalos ritkasági besorolás kitalálva.

Az XP-/nyangmegfigyelések történeti adatként megmaradtak; az összesítő mellett nem szerepelnek versengő végösszegekként. A támadás, nyers védelem és HP globális felső korlátja továbbra sem igazolt. A polír saját 15/18/150 korlátját külön kezeljük. A normál kitérés 35%-át és a harci összesített 12%-ot a content API is alátámasztja, külön kulcsokban.

27 egység-/adat-/publikációs teszt sikeres. A valódi Chromiumteszt 1440×1000, 390×844 és 320×760 nézetben ellenőrizte a navigációt, a kritikus példát, a külön 50%/75% korlátot, minden fegyversávhatárt, a hibás bevitelt, az állapotmegőrzést és a túlcsordulás hiányát. A statikus csomag 3760 kiszolgált erőforrásának HTTP-tesztje sikeres. A korábbi `Pages-retry.txt` projektgazdai commit beemelve, megőrizve.

## A négy fejlesztés eredménye

### GitHub Pages-előkészítés

A teljes projekt statikus publikálásra alkalmas. Elkészült a GitHub Actions-workflow (`.github/workflows/pages.yml`), a `.gitignore`/`.gitattributes`, a tételes forrás- és futásidejű csomagolás, a titok-/személyesadat-mintakereső, az engedélynyilvántartás és az alkönyvtáras Pages-teszt. GitHub repository: https://github.com/Legivok2/stonestorm-atlas . Az első forráskiadás a saját kódot és a korábban engedélyezett Creator Kitet tartalmazza; a játékadatokat és ismeretlen engedélyű képeket nem terjeszti.

A feltöltési jelölt körülbelül 181 MiB, a teljes statikus előnézet körülbelül 177 MiB. 3758 kiszolgálandó fájl HTTP-ellenőrzése sikeres a `/stonestorm-atlas/` prefix alatt. A tételes jelöltben 0 hiányzó fájl és 0 titok-/személyesadat-mintatalálat volt; ez nem teljes körű adatvédelmi garancia. Az új állapothoz 13 adat-/modell-/publikációs tesztcsoport tartozik, és a meglévő DOM-tesztek Pages-prefix alatt is lefutottak.

A hivatalos sajtóoldal közvetlen ellenőrzését HTTP 403 korlátozta. A korábbi Creator Kit-engedély nyilvántartott; az új katalógus, játékmentési képek és teljes lokalizáció újraközlési engedélye nincs igazolva. A felhasználó a hivatalos letölthetőséget megerősítette, ami önmagában nem rögzít újraközlési licencet. Ezeknél a nyilvános build és feltöltési staging egyelőre leáll.

A GitHub CLI bejelentkezése **2026. november 7-én sikerült**, fiók: Legivok2. A projektgazda ezt követően kifejezetten feloldotta a korábbi engedélyellenőrzési feltételt, és a teljes helyi változat publikálását kérte. Az utasítást külön `publicationAuthorization` mező rögzíti; a kiadói licenceket nem jelöltük ettől igazoltnak. A teljes `build:pages` és `stage:github` az összes eredeti futásidejű fájlt tartalmazza. A workflow-ból kikerült a kalauzra váltó ág; hiány esetén leáll. 16 adat-/modell-/publikációs teszt sikeres, és a teljes kiadás mind a 3758 erőforrása HTTP 200 a Pages-alkönyvtár alatt. Webcím: https://legivok2.github.io/stonestorm-atlas/ . Útmutató: `docs/DEPLOYMENT.md`.

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
8. Nyilvános felhasználási engedélyek: a letöltött katalógus és játékmentési grafikák kiadói licence nincs igazolva. A korábbi Creator Kit-engedély külön maradt. A teljes kiadás a projektgazda 2026-11-07-i, rögzített közzétételi utasítására készül.

## Indítás

```powershell
cd C:\xampp\htdocs\StoneStorm
npm start
```

Megnyitás: **http://localhost:4173**. Nincs szükség alkalmazásfüggőség telepítésére. Az opcionális DOM-tesztekhez a korábban telepített jsdom kell a `.integration/qa/` alatt. A saját Node-szerver csak a Wiki futásidejű fájljait és az ellenőrzött képkönyvtárak WebP-it szolgálja ki; az Apache konfigurációját nem változtattuk meg.

Részletek: [képintegráció és Képtár](docs/IMAGE_INTEGRATION.md), [Character Planner és képletek](docs/CHARACTER_PLANNER.md), [adatforrások](DATA_SOURCES.md). A korábbi állapot történeti példánya: `docs/PROJECT_STATUS_V2.md`.
