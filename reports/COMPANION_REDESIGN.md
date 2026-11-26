# Stonestorm Companion – helyi UI/UX átadás

Kiadás: **0.11.0 BÉTA**, 2026. november 21. Előző helyi kiadás: 0.10.0. Push és publikálás nem történt.

Ez új alkalmazásfelület: állandó navigáció, külön moduloldalak, három panelmód, képes presetek, útvonalkártyák, adatgyűjtő munkafelület, közös játékfelület-kezelő és új tooltip. A statszámítás, a capture, a szerverkommunikáció és a biztonsági felszerelési korlátozások megmaradtak.

**Az élő játék böngészője és bejelentkezett DOM-ja nem volt elérhető.** A képek és a felületi próbák valódi MV3-bővítményt, valódi React-renderelést, nyilvános kliensstruktúrát követő DOM-ot és jelölt mintaadatokat használtak. A presetjavítás próbája külön a nyilvános kliens tényleges lean-dekóderét is futtatja, saját karakteradat nélkül. Ezek nem élő fiókos elfogadási eredmények.

## Kipróbálható előnézet

**http://127.0.0.1:4318/** – `npm run preview:addon:companion`. A helyi szerver a valódi addon megjelenítési moduljait szolgálja ki elkülönített mintaadatokkal. A demó saját böngészőtárat használ, nincs játékfiók-kapcsolata. A próba ellenőrizte a hét oldalt, a mintaadatok betöltését, a külső kérések hiányát, és az ismeretlen útvonalak/írási HTTP-kérések elutasítását. A demo nem kerül a telepíthető bővítmény futásidejébe.

[Magyar telepítési és használati útmutató](../docs/COMPANION_TELEPITES.md) · [ZIP](../downloads/stonestorm-statcap-overlay.zip)

## Végső helyi eredmény

**271/271 egységteszt** (15 új Companion eset), capture-refresh sikeres; **22/22 Companion**, **68/68 Enhanced UI**, **22/22 Tárnák/Portya**, **13/13 presetjavítás**. A további preset-, Otthon-, kísérő-, export/popup-, statlimit- és Combat V3-regressziók sikeresek. A Companion saját próbája 0 játékmeneti írást és 0 erőforrás-műveletet igazolt.

A helyi előnézet 7 oldala, a csomagellenőrzés, a projektellenőrzés, a Pages-build, a 3783 HTTP-ellenőrzés és a ZIP tényleges letöltése/hash-ellenőrzése sikeres. A publikációs audit 0 hiányzó fájlt és 0 titok-/személyesadat-mintatalálatot jelzett.

ZIP: **463675 bájt**. SHA-256: `beab6392b2d9e30ae2caa57f272850880ce35e0a8a3a49bafc3fa564dd5eb616`. Az új ZIP bájtra azonos a helyi dist csomagjával.

## Tényleges dizájnváltozások

| Felület | Új megoldás | Megőrzött működés | Állapot |
|---|---|---|---|
| Áttekintés | Külön kezdőoldal, saját címer, három bónuszkártya, harci statok, limitjelzők, szett-gyorselérés, csendes változáslista | Megfigyelt HP, Harcerő, védelem, sebzés; meglévő XP/Nyang/Zsákmány-számítás | Helyben ellenőrizve |
| Statok | Kártyás összesítés, lenyitható eredetek, elkülönített részletes/kézi adatok | Kritikus/képesség/kitérés/egyéb limitek, nyers/érvényes érték, kézi stat és felszerelésmezők, főzeteredet megadása | Helyben ellenőrizve; nem igazolt soft-cap érték jelölve |
| Felszerelés | Három képes szettkártya, mentési és példányállapot, saját név, képek, felszerelésbónuszok, külön optimalizáló és összehasonlító kártyák | Három helyi preset, átnevezés, előnézet, törlés, XP/Nyang/Zsákmány-cél, javaslatmentés és külön helyi cserepróba | Helyben ellenőrizve; éles Felöltözés és Harcerő-keresés tiltott |
| Portyák | Rangsorolt útvonalkártyák, megbízható első hely, négy hatékonysági mutató, lenyitható pontos táblák és kézi mezők | DOM/API/kézi források, intervallumok, stale-adat elleni védelem, per-út visszaállítás, óra/perc | Helyben ellenőrizve |
| Atlas adatgyűjtés | Külön gyűjtőoldal, időjelző, kategóriakártyák, egyértelmű export/törlés, egységes Chrome-popup | Ugyanaz a közös, memóriabeli, 60 másodperces gyűjtő és szigorú anonim export | Helyben ellenőrizve, tényleges helyi JSON-letöltéssel |
| Játékfelületek | Hét önálló kártya, közös kapcsolóoldal és globális visszaállítás | Meglévő Otthon/Tárnák és öt új Enhanced UI profil, hibrid nézet, horgászati felfüggesztés | Helyben ellenőrizve |
| Kísérő-tooltip | Portrés fejléc, meleg arany tipográfia, külön fajbónusz/képesség/hatás szekciók, lenyitható forrás | Inaktív kísérő saját adatai, DOM-elsőbbség, fókusz/Escape, feltételes és hiányzó adatok | Helyben ellenőrizve |
| Beállítások | Megjelenés, gyorselérés, értesítések, geometria-visszaállítás, adatvédelmi és diagnosztikai rész | Helyi tárhely, meglévő adatgyűjtési és presetkezelési szabályok | Helyben ellenőrizve |

### Panel és navigáció

- Mini: XP/Nyang/Zsákmány, két fontos limit, részletes nézet gombja és testreszabható gyorselérés.
- Normál: egy kiválasztott modul, kompakt menüvel; nincs minden modult tartalmazó hosszú panel.
- Teljes: széles oldalsó menü, két-/háromoszlopos kártyák. A böngészőhöz igazodik.
- Mozgatás: fejléc húzása vagy fókuszált fejléc + Alt/nyilak. Méretezés: jobb alsó fogantyú vagy fókuszált méretező + nyilak. Shift: nagyobb lépés. Teljes módban automatikus méret.
- A mini és normál geometria, a mód, a nyitottság, az oldal, a térköz és a gyorselérés mentve marad. A viewportból kicsúszó korábbi pozíció visszakerül a látható területre.
- A menü tab/tabpanel szemantikát, nyilas és Home/End navigációt kapott; Escape bezár, a fókusz a megnyitógombra kerül. Látható fókusz és csökkentett mozgás támogatott.

### Állapotok és értesítések

A karakter, inventory, mentés, optimalizálás és felszerelés külön adatkövetelményeket használ. Az új felület nem támaszt a mentéshez statlimit-feltételt. A hiányzó felszerelt példányazonosító darabszáma közvetlenül a megfigyelt adatokból származik; nem általános hiba vagy találgatás. Betöltés, olvasási hiba, részleges adat és biztonsági tiltás külön látható. Az eredeti, ellenőrzött karakter-GET újraolvasó megmaradt.

Az értesítések helyben, hang nélkül jelennek meg, deduplikált és korlátozott listával. Új tárgy jelzése csak teljes, igazolt számítási állapotnál, egy ténylegesen megfigyelt új tárggyal újraszámolt jobb XP/Nyang-értékre készül; nem ígér általános Harcerő-javulást. Presethiány csak teljesen azonosítható aktuális felszerelés mellett jelezhető. Nem támogatott modell külön figyelmeztetést kap. Saját presetnevek és értesítési adatok a belső ISOLATED üzenetkezelőben maradnak; nem kerülnek DOM-eseményen a játékoldalhoz.

## Architektúra és teljesítmény

- `companion.css`: közös jáde/arany/bronze tokenek, tipográfia, kártyák, vezérlők, töréspontok és reduced-motion. `companion-design.js` ebből generált csomagolt stílus és nyilvános képkatalógus.
- `companion-state.js`: megjelenési preferenciák szűk engedélylistája, tárolás, viewport-geometria, értesítési deduplikáció, kizárólag ISOLATED belső eseménykezelő.
- `companion-components.js`: következetes SVG-ikonok, szöveges értékek escapelése, közös stat-/bónuszkártyák és dashboard.
- `companion-shell.js`: egyszer létrehozott főpanel, navigáció, módok, pointer/billentyűzetes geometria, beállítások és értesítési nézetek.
- `companion-equipment-view.js`, `companion-raid-view.js`: a meglévő számításokból kapott eredmények megjelenítése. Az eredeti modell és műveleti kapuk külön modulban maradtak.
- `content.js`: meglévő capture-adatok és statszámítás átadása az új megjelenítésnek. Nem építi újra a főpanelt vagy a többi modul DOM-ját.
- A preset-, portya-, adatgyűjtő- és Enhanced UI modulok külön, állandó fogadóhelyet kapnak. Navigálás és React-gyökércsere után ugyanaz a panel és modulpéldány marad. A szövegmezőben szerkesztett presetnév és kijelölés megmarad.

A stílusok zárt Shadow DOM-ban élnek. A játékfelületek eredeti, külön scoped CSS-e megmaradt. A főpanel nem telepít új globális MutationObservert vagy pollingot; a régi adatfigyelés működik tovább. A kutatási időjelző csak helyi státuszt olvas, nem hálózati API-t. A három bónuszkép csomagolt adat, a presetek képei kizárólag ismert, publikus tárgysablon-képek.

## Ellenőrzések

A tételes, végső eredményeket, darabszámokat és SHA-256 értéket a [Companion ellenőrzési JSON](companion-verification.json) tartalmazza.

- `npm run test:addon:companion`: engedélylistás preferenciák, tárolási versenyhelyzet, geometria öt méreten, értesítések, privát belső üzenetek, XSS-escapelés, stílusbuild, manifest és műveleti korlátozások.
- `npm run test:addon:companion:browser`: natív MV3, valódi React-minta, hét útvonal, három mód, drag/resize, billentyűzet, újranyitás, újratöltés, helyi mentés/optimalizálás/export, adatállapotok, értesítések, privát beállítások, 2560/1920/1440/1000/390/320 szélesség.
- `node tests/companion-preview-browser.mjs`: a futó helyi előnézet hét oldala, mintaadatok, külső kérés és futási hiba nélkül; írási/idegen útvonalak elutasítása.
- `npm run test:addon:equipment:browser` és `npm run test:addon:equipment:repair:browser`: valódi Chrome helyi presetmentés és visszaolvasás, tényleges nyilvános lean-dekóder, részleges és hiányzó ID-esetek, kizárólag olvasási újraolvasó.
- `npm run test:addon:mining-raids:browser`: 22 eset, köztük tényleges billentyűzetes kézi bevitel és forrásjelölés. A történeti előtte-felülethez az átadás előtti felszerelés-UI külön fixture maradt; nem keverjük az új megjelenítési függőségekkel.
- `npm run test:addon:home` és `npm run test:addon:enhanced:browser`: 6 Otthon-fül / 6 méret és 68 Enhanced UI eset.
- `npm run test:addon:095:native`, `npm run test:addon:095:browser`, `npm run test:addon:pets:browser`, `npm run test:stats:browser`: MAIN/ISOLATED, tényleges Chrome-popup, export/törlés, inaktív kísérők és statlimit-regresszió.
- `npm test`, `npm run check`, `npm run check:addon`, `npm run build:pages`, `npm run test:pages`: teljes helyi ellenőrzés és csomagkonzisztencia. A Pages-build helyi fájlkészítés, nem publikálás.

## Vizuális bizonyíték

[Hét előtte–utána pár, mini/normál mód és optimalizáló](../.integration/companion/gallery.html). Minden összehasonlító pár azonos, **1920×1080** felbontáson készült, az átadás előtti 0.10.0 addon és az új 0.11.0 addon külön natív profiljában. A helyi minta felirata mindkét képen szerepel.

| Képernyő | Előtte | Utána |
|---|---|---|
| Áttekintés | [Kép](../.integration/companion/overview-before-1920.png) | [Kép](../.integration/companion/overview-after-1920.png) |
| Statok | [Kép](../.integration/companion/stats-before-1920.png) | [Kép](../.integration/companion/stats-after-1920.png) |
| Felszerelés | [Kép](../.integration/companion/equipment-before-1920.png) | [Kép](../.integration/companion/equipment-after-1920.png) |
| Portyák | [Kép](../.integration/companion/raids-before-1920.png) | [Kép](../.integration/companion/raids-after-1920.png) |
| Atlas | [Kép](../.integration/companion/research-before-1920.png) | [Kép](../.integration/companion/research-after-1920.png) |
| Játékfelületek | [Kép](../.integration/companion/interfaces-before-1920.png) | [Kép](../.integration/companion/interfaces-after-1920.png) |
| Kísérő-tooltip | [Kép](../.integration/companion/pet-before-1920.png) | [Kép](../.integration/companion/pet-after-1920.png) |

## Részleges és további igazolásra váró részek

- Az éles felszerelésváltás továbbra is tiltott: a saját szerveres equip/unequip folyamat és hibakezelés nincs élő fiókon igazolva.
- A teljes kombinációs Harcerő-optimalizáló tiltott. A megfigyelt jelenlegi Harcerő nem ajánlott felszerelésre becsült érték.
- A jelenlegi játékmodell nem igazol felszerelési zsákmánybónuszt; a kereső ezt egyértelműen közli.
- A soft-cap által módosított ismeretlen statot nem számoljuk ki feltételezett képlettel. A játéktól megfigyelt érték jelenhet meg.
- Az inaktív Enhanced UI panelek időbélyeges megfigyelések, nem élő készletek vagy klónozott műveleti gombok.
- Az élő fiókos presetmentés korábbi elfogadási feltétele továbbra is felhasználói visszajelzésre vár. A helyi mentés és visszaolvasás igazolt.
