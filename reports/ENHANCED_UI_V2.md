# Enhanced UI V2 – helyi átadás, 0.10.0 BÉTA

Ellenőrzés: 2026. november 21. Közös ablakkezelő hét felülettel, helyi beállításokkal és azonnali központi visszaállítással. GitHub-push és publikálás nem történt.

**A valódi, bejelentkezett játék DOM-ja nem volt elérhető.** A kliens nyilvános JavaScript- és CSS-fájljait megvizsgáltuk, a böngészős teszt pedig valódi MV3-bővítménnyel, valódi React-rendereléssel, ebből rekonstruált DOM-mal és megjelölt mintaadatokkal futott. Az alábbi eredmények helyi ellenőrzések; nem igazolják az élő fiók minden műveletét. Erőforrást használó játékműveletet nem indítottunk. A megnyitási, fülváltási és információs vezérlőket teszteltük, a vásárlás/eladás/készítés/bérlés/bedobás gomboknál az eredeti node és szülő megőrzését, elérhetőségét vizsgáltuk, végrehajtás nélkül.

| Felület | Egyszerre látható panelek nagy képernyőn | Interaktív rész | Csak előnézet | Visszaállítás | Helyi teszt |
|---|---|---|---|---|---|
| Otthon | Ház: 2 terület; a többi fül széles tartalom | Az eredeti, kiválasztott fül összes vezérlője | Nincs új fülmásolat | Azonnal | Sikeres, 6 fül / 6 méret |
| Tárnák | 4, kisebb ablakban egymás alá rendezve | 1 eredeti aktív fül | 3 megfigyelt fül | Azonnal | Sikeres, 22 Tárnák/Portya eset |
| Alkimista | 3: Főzetek, Receptek, Viharszív | 1 eredeti aktív fül | 2 időbélyeges megfigyelés | Azonnal | Sikeres, 5 ablakméret |
| Hármas Pecsét | 3: Vásárlás, Eladás, Előjegyzés | 1 eredeti aktív fül | 2 időbélyeges megfigyelés | Azonnal | Sikeres, 5 ablakméret |
| Istálló | 3 terület; jobb oldalon saját és eltett hátasok | Az összes jelen lévő eredeti rész | Nincs klónozott vagy kitalált hátaslista | Azonnal | Sikeres, 5 ablakméret |
| Bolt | 4; közepes szélességnél 2, kicsinél 1 oszlop | 1 eredeti aktív fül | 3 időbélyeges megfigyelés | Azonnal | Sikeres, 5 ablakméret |
| Horgászat | 1 keskeny/széles, összecsukható eredeti panel | Az eredeti kiválasztott fül és műveletei | Összecsukva csak helyi szöveges összegzés | Azonnal; aktív eseménynél automatikusan eredeti geometria | Sikeres, 5 fül és az összes ismert aktív állapot |

## Végső helyi eredmények

- Enhanced UI: **68/68** natív MV3/React böngészős eset, **0 API-kérés, 0 írás, 0 erőforrás-művelet**, 0 JavaScript-hiba.
- Egységtesztek: **256/256**, ebből 20 új Enhanced UI eset; capture-refresh: sikeres.
- Otthon: 6 fül / 6 méret; Tárnák/Portya: 22 eset; presetjavítás: 13 eset. Presetkezelő, kísérő-tooltip, statlimit és natív kutatási export: sikeres.
- Projektellenőrzés, addonkonzisztencia, helyi Pages-build és 3783 HTTP-ellenőrzés: sikeres. A letöltési próba 3 méreten ellenőrizte a tényleges ZIP-letöltést és hash-t, valamint a verziójelzést és hibaállapotokat. Az első futás még a dist újraépítésével párhuzamosan indult; a kész builden sorrendben újrafuttatva sikeres.
- ZIP: **346360 bájt**, SHA-256: `f148bbf877ba407a4e02ff533d5d7251fcfb87194c71c2f6a5920e9bd0c7c8a9`.

## A játék jelenlegi szerkezetéhez igazított működés

Az Alkimista `AlchemistPanel`, a Hármas Pecsét `HouseModal`, a Bolt `ShopModal` komponense csak az aktív fül tartalmát rendereli. A Hármas Pecsét `.auction.market-dialog[data-tut-screen="house"]`, és nem az általános `MerchantModal`, illetve nem az Otthon. A profilok ezt különböztetik meg.

A közös modul nem mozgat React-elemet másik szülő alá, nem klónoz interaktív HTML-t, és nem kényszerít több React-fület aktívra. Az eredeti tabpanel a megfelelő oszlopba kerül CSS-ráccsal. A többi oszlopban saját, szöveges/képes, csak olvasható megfigyelés jelenik meg. Az adatforrás és megfigyelési idő látható, a felirat egyértelműen jelzi: **Nem élő állapot**. Nem megnyitott fülre nincs adat kitalálva. Az előnézet legfeljebb 40 kártyát mutat, a korlátot külön jelzi; a teljes tartalom az eredeti fülön érhető el. A Megnyitás kizárólag felhasználói kattintásra aktivál egy ellenőrzött eredeti fület.

Az Istálló eredeti `.stable-now`, `.stable-list`, `.stable-stored` és `.own-mounts` elemei saját szülőjük alatt maradnak. Kis ablakban a három terület egymás alá kerül. A Horgászat aktív állapotai (`casting`, `waiting`, `fighting`, `landing`, `auto`), az `is-fishing` osztály és a `.fish-fight-zone` megszüntetik az addon horgász-elrendezését. A kapás/fárasztás eredeti célpontjait nem fedi el az új panel; a teszt a célpontokra mutató hit-testet és az eredeti geometria azonosságát ellenőrzi.

Az ablakonkénti kapcsolók mellett a Stat limitek panel **Enhanced UI – felületek** része hét jelölőnégyzetet és egy központi kikapcsolót tartalmaz. A beállítás `ssaEnhancedUI.v2`, kizárólag helyi Chrome-tárolással; a korábbi Otthon/Tárnák értékek átkerülnek. A pillanatképek csak az adott megnyitott felület memóriájában élnek, bezáráskor törlődnek. Új jogosultság és új API-kérés nincs.

Egy közös szerkezeti megfigyelő csak hozzáadott részfákat és releváns attribútumváltozásokat fedez fel. Bekapcsolt, nyitott felülethez egy külön tartalmi figyelő tartozik, kikapcsoláskor/bezáráskor ez leáll. Az egymást követő változások egy animációs képkockára összevonódnak, a változatlan előnézeti tartalom nem épül újra. Az eredeti stílusértékek visszaállnak; a leválasztott React-panelek hivatkozásai felszabadulnak. Nincs DOM-polling vagy folyamatos teljes oldallekérdezés.

## Ellenőrzések és megismétlés

- `npm test`: egységtesztek és capture-forrás regresszió.
- `npm run check` és `npm run check:addon`: projekt- és csomagkonzisztencia.
- `npm run test:addon:enhanced:browser`: öt új felület, natív MV3, React-renderelés, 1920×1080, 2560×1440, 1440×900, 1000×700 és 390×844. Kapcsolás, eredeti node-azonosság, eredeti fülek, scroll, fejléc/bezárás, megerősítő ablak, újranyitás, navigáció, gyökérelem-csere, tartalomfrissülés, HUD, központi visszaállítás, tárolás és megfigyelőterhelés.
- `npm run test:addon:home` és `npm run test:addon:mining-raids:browser`: a közös vezérlővel futó korábbi felületek regressziója.
- `npm run test:addon:equipment:browser` és `npm run test:addon:equipment:repair:browser`: presetmentés és visszaolvasás valódi Chrome helyi tárhelyen; nyilvános kliensdekóder, hiányos adatok, 9 mintatárgy, 3 preset. Éles felszerelésváltás továbbra is tiltott. A korábbi presetjavítás élő fiókos elfogadása továbbra is visszajelzésre vár.
- `npm run test:addon:095:native`, `npm run test:addon:pets:browser`, `npm run test:stats:browser`: eredeti statpanel, MAIN/ISOLATED, zárt Shadow DOM, Chrome-popup, anonim export és aktív/inaktív kísérő-tooltip.
- `npm run build:pages` és `npm run test:pages`: kizárólag helyi, friss addoncsomagot tartalmazó build.

Az aktuális darabszámokat, eredményeket és a kiadás SHA-256 lenyomatát az [ellenőrzési JSON](enhanced-ui-verification.json) rögzíti. A böngészős esetek tételes eredménye: [browser-results.json](../.integration/enhanced-ui/browser-results.json). A QA külön ideiglenes Chromium-profilt használ, valós játékfiókot és belépési adatot nem olvas.

A próba meglévő Playwright-környezete: `.integration/browser-qa/node_modules/playwright`; teljes Chromium: `.integration/browser-qa/browsers`. A React csak QA-függőség, nem kerül az addonba: `.integration/enhanced-ui/qa/node_modules` alatt `react@19.2.0` és `react-dom@19.2.0`. Új tesztkörnyezetben e két csomagot külön QA-mappába kell telepíteni. A mintafelület nem a teljes játékkomponensek futtatása, hanem a vizsgált szerkezet React által renderelt reprodukciója.

Forrásjegyzék: [URL-ek és SHA-256 értékek](../tests/fixtures/enhanced-ui-sources.json). A `HouseModal`, `AlchemistPanel`, `StableModal`, `OwnMounts`, `ShopModal`, `FishingPage`, `NpcModal` és a hozzájuk tartozó nyilvános CSS határozta meg a szelektorokat. Az addon CSS-e csak saját jelölőosztályokkal azonosított felületekre hat.

## Előtte–utána képernyőképek

Mind az öt pár ugyanazon **1920×1080** felbontáson készült. A képeken külön felirat jelzi a helyi mintaadatokat. **Nem élő játékfelvételek.**

[Összehasonlító képgaléria](../.integration/enhanced-ui/gallery.html)

| Felület | Előtte | Utána |
|---|---|---|
| Alkimista | [Kép](../.integration/enhanced-ui/alchemist-before-1920.png) | [Kép](../.integration/enhanced-ui/alchemist-after-1920.png) |
| Hármas Pecsét | [Kép](../.integration/enhanced-ui/seal-before-1920.png) | [Kép](../.integration/enhanced-ui/seal-after-1920.png) |
| Istálló | [Kép](../.integration/enhanced-ui/stable-before-1920.png) | [Kép](../.integration/enhanced-ui/stable-after-1920.png) |
| Bolt | [Kép](../.integration/enhanced-ui/shop-before-1920.png) | [Kép](../.integration/enhanced-ui/shop-after-1920.png) |
| Horgászat | [Kép](../.integration/enhanced-ui/fishing-before-1920.png) | [Kép](../.integration/enhanced-ui/fishing-after-1920.png) |

Külön képek: az öt új nézet 2560×1440 és 390×844 méreten, továbbá [aktív horgászat](../.integration/enhanced-ui/fishing-active-1440.png) 1440×900 méreten ugyanebben a mappában.

## Telepíthető kiadás

[Helyi ZIP](../downloads/stonestorm-statcap-overlay.zip), verzió **0.10.0 BÉTA**. A manifest és a csomaglista tartalmazza az új közös modulokat. Meglévő telepítésnél a kibontott fájlok cseréje után bővítmény-újratöltés és játéklap-frissítés szükséges. A nézetek későbbi kapcsolásához már nem kell frissítés.
