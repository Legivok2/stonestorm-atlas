# Stonestorm Companion 0.14.0 BETA – belső funkcióaudit

Audit: 2026. november 24. Projekt: `C:\xampp\htdocs\StoneStorm`. Ez fejlesztési dokumentum; nem része a normál felhasználói UI-nak. Nem történt automatikus commit, push vagy publikálás.

## Bizonyíték és minősítés

A minősítés egy konkrét, körülhatárolt viselkedésre vonatkozik. **STABLE:** ellenőrizhető helyi művelet, aktuális forrással egyeztetett számítás vagy ismeretlen adatot elutasító megjelenítés. **PARTIAL:** csak egy ismert rész működik; a hiányos részt nem szabad teljes eredményként állítani. **EXPERIMENTAL:** élő működés nem igazolt, vagy fejlesztői eszköz. **OBSOLETE:** elavult/duplikált/sikertelen felület, amelynek nincs helye az aktuális normál UI-ban.

**A STABLE nem jelent általános élő fiókos elfogadást.** Az audit külön kezeli a publikus forrást, a helyi/szintetikus MV3/React-tesztet és az élő játékot. Játékot módosító funkciót szintetikus teszt alapján nem soroltunk az élőben bizonyított funkciók közé. Kísérleti funkcióknál a láthatósági kapcsoló nem műveleti felhatalmazás, és nem lazítja a korábbi adapterellenőrzéseket.

Friss publikus bizonyíték: `data/companion-0140-evidence.json`. A `GET https://stonestorm.gg/api/content` 200-as JSON-választ adott, verzió: `fbc93606674a`. A vizsgált index, CharacterPage és GameApp modulok szintén 200-as válasszal elérhetők voltak, hashük rögzítve. A gyökér kliensoldal külső lekérését Cloudflare HTTP 403 blokkolta; ezért a legfrissebb belépőoldalt és bejelentkezett karaktert nem állítjuk élőben ellenőrzöttnek. A normál számított kitéréshez és jutalombónuszhoz a támogatott kliensbelépőnek futásidőben is jelen kell lennie.

## Teljes felület- és vezérlőleltár

| Menü / vezérlők | Besorolás | 0.14.0 viselkedés és indok |
|---|---|---|
| Companion indító, bezárás, Escape | STABLE | Normál. A panel helyi láthatósága; eredeti játékot nem vezérel. |
| Mini / normál / teljes panelmód | STABLE | Normál. Méretkorlátozás, útvonalmegőrzés, billentyűzetes és mutatós kezelés tesztelve. |
| Fejléc húzása, méretező, pozíció-visszaállítás | STABLE | Normál. Csak megjelenési adatot ment. |
| Bal navigáció, nyílbillentyűk, gyorsgombok | STABLE | Normál módban öt működő célpont. Rejtett célra API-n keresztül sem vált a shell. |
| Karakternév / szint / kaszt | STABLE | Csak megfigyelt karakteradat. Nem kerül a megjelenési tárhelybe vagy az anonim exportba. |
| HP, SP, harcerő, védelem, min/max sebzés | STABLE | Csak aktuális, véges szerveradat; nincs globális pontplafon vagy becsült teljes harcerő. |
| XP / Nyang / zsákmány főmutató | STABLE | A támogatott kliens és konfiguráció képletével, explicit fizetős összetevővel. Hiányzó bemenetnél nem jelenik meg érvényes számként. |
| Áttekintés: limitkártyák és sávok | STABLE | Csak végérték + igazolt cap mellett, legfeljebb öt. Hátralévő százalékpont; kemény túllépés csak ismert nyers összegből. |
| Kritikus esély nyers DEX-összege | EXPERIMENTAL | Normál módban nincs. Nem vezetjük vissza a végértékből vagy az 50%-ból. |
| Kritikus/képességsebzés felszereléssor-összege | PARTIAL | Fejlesztői bontás. Nem helyettesíti a teljes karakter végértékét. |
| Kritikus/képességsebzés érvényes értéke | STABLE | Csak explicit `derived.harceroStats` végérték. A Bónuszok panel szövege önmagában nem bizonyítja, hogy nyers vagy érvényes érték. Soft-cap és nyers érték külön. Hiányzó explicit végértéknél az érintett kártya eltűnik. |
| Normál kitérés szint szerinti referenciája | STABLE | Ellenőrzött DEX-részarányos kliensképlet, egyértelmű „normál referencia” címkével. Nem az adott ellenfél elleni esély. |
| Adott boss elleni tényleges kitérés | PARTIAL | Nem jelenik meg kész számként. A 12%/14%/16% konfigurációs cap önmagában nem bizonyítja a tényleges bossesélyt. |
| Statok: hat csoport | STABLE | Alapok; támadás; túlélés; kritikus/képesség; jutalmak; limitek. Az üres csoport kimarad. |
| Régi kézi statmezők, felszerelésbónusz-reset, főzetbesorolás, változásnapló és részletes módosítótáblák | EXPERIMENTAL | Fejlesztői diagnosztikában megőrizve; nem etetik a normál végértékeket. |
| Preset 1/2/3: mentés, név, átnevezés, törlés | STABLE | Helyi műveletek, megőrzött karakterenkénti tárhely és tényleges item-ID-k. Nem töröl játékbeli tárgyat. |
| Preset ikonok, slotlista, hiányzó tárgy ellenőrzése | STABLE | Normál. Saját tárgypéldányok és ismert sablonképek; nincs technikai ID-lista a felhasználónak. |
| Preset előnézet | STABLE | Normál. Tárgyankénti összevetés; nem módosít felszerelést. |
| Adatok frissítése | STABLE | Meglévő, szigorúan ellenőrzött olvasóadapter; változott kliensnél nem talál ki adatot. Normál hibája rövid, kezelhető üzenet. |
| XP/Nyang felszerelési összehasonlítás és javaslat helyi mentése | STABLE, szűk értelemben | Csak a saját felszerelés ellenőrzött bónuszait hasonlítja össze. Nem teljes harci előrejelzés, és nem alkalmazza a szettet. |
| Teljes harcerő-optimalizálás | EXPERIMENTAL | Normál módból eltűnt; fejlesztői módban is tiltott, amíg a teljes modell nem igazolt. |
| Felszerelési zsákmánykeresés | OBSOLETE normál célként | A modellben nincs igazolt ilyen felszerelési komponens; normál gomb nincs. |
| Felöltözés / equip/unequip, megerősítés, megszakítás, helyreállítás | EXPERIMENTAL | Normál módban nincs alkalmazásgomb. Fejlesztői módban megőrzött privát worker, megbízható kattintás, friss állapot, item-ID, szabad hely, egyidejűség, napló és visszaellenőrzés. Élő fiókos siker nincs igazolva. |
| Mock csere, API-/inventorydiagnosztika, pontos példány-ID-lista | EXPERIMENTAL | Kizárólag fejlesztői mód. Normál előnézet nem tartalmazza. |
| Portya: energia, jutalom, XP/energia, Nyang/energia | STABLE | Eredeti megfigyelt ajánlatból, külön kártyánként. Nincs indító automatizmus. |
| Portya: rendezés és időegység | STABLE | Normál. Az időarányos mutató csak ismert időből látható. |
| Portya: rövidített HU számok | STABLE | `448k`, `746,8k`, `1,9kk`, `2,7kk`; csonkolási tartomány megmarad. |
| Portya: „legjobb” ajánlás | STABLE, feltételes | Csak a három megfigyelt ajánlat adat-/bizonytalansági tartományával igazolható elsőség; hiányos összevetésnél nincs biztos győztes. |
| Portya: kézi felülírás, automatikus visszaállítás | STABLE | Kézi forrás külön jelölve, helyben mentve. Nem változtat játékajánlatot. Eltűnt ajánlatból nem készül normál üres kártya. |
| Atlas főmenü, indítás/stop/export, kategóriák | EXPERIMENTAL | Központi kapcsoló mögött; külön indítás kell, legfeljebb 60 s. Kikapcsoláskor leáll és az ideiglenes minta törlődik. |
| Normál böngésző-popup | STABLE | Öt Companion-gyorscél. Adatgyűjtő vezérlők csak fejlesztői módban. |
| Közösség, Tárnák, Alkimista, Hármas Pecsét, Bolt, Horgászat kiterjesztés | EXPERIMENTAL | Normál UI-ból és játék-HUD-ból eltűnt. A régi mentett „bekapcsolt” jelző sem aktiválja. |
| Otthon és Istálló kiterjesztés | EXPERIMENTAL | Izolált DOM/CSS-eredmények vannak, megfelelő élő igazolás nincs; ezért a teljes Játékfelületek menü fejlesztői. |
| Régi szöveges/hibrid megfigyelések | PARTIAL | Fejlesztői módban, kifejezetten nem élőként megőrizve; normál UI-ban nincs ilyen panel. |
| Két iframe / Multi-Instance prototípus | OBSOLETE az addonban | A két script nincs a manifestben és a futó ZIP-ben. A forrás megmaradt a projektben. A külön Electron Workspace-hez nem nyúltunk. |
| Régi Community Hub másolat | OBSOLETE | Korábban sem volt aktuális runtime; továbbra sem része a főmenünek vagy a futó csomagnak. |
| Kényelmes / Kompakt térközmód | OBSOLETE | A beállítás és a sűrűségválasztó eltűnt. A régi adatot nem használjuk új témaként. |
| Emerald / Obsidian / Ember | STABLE | Szemantikus változók a háttéren, kártyán, navigáción, gombokon, szövegen és ikonokon. Helyben mentett, valódi három eltérő paletta. |
| Limit-/presethiány-értesítés, bezárás/kikapcsolás | STABLE | Ellenőrzött eseményből, ismétlődésszűréssel. Kikapcsoláskor a hozzá tartozó toast eltűnik. Üres értesítéskártya nincs. |
| Új tárgy / kutatás / játékváltozás értesítés | EXPERIMENTAL | Beállításai és jelzései fejlesztői módba kerültek. |
| Megjelenési beállítások visszaállítása | STABLE | Egyetlen UI-kulcs törlése; presetet és játékadatot nem töröl. |
| Kísérők statkijelzése | STABLE, megtartandó | Normál módban aktív maradt a fajbónusz, tulajdonság és ismert képesség. Hiányzó adat csak az érintett értéket korlátozza. Nem kapcsol át/aktivál kísérőt. |
| Kísérő forrásrészletek | PARTIAL / fejlesztői technikai rész | Normál módban rövid magyarázat maradt a feltételes számításról; a kliensverzió/belépő technikai állapota nem terheli a felhasználót. |

## A kritikus javítások részletei

### 1. Nyers érték és érvényes érték

A korábbi dashboard felszerelési összeget, látható panelt és általános capet kevert össze. A 0.14.0 külön kezeli:

- **Nyers kritikus esély:** a teljes, aktuális DEX-/módosító-képlet nincs bizonyítva; nem számolunk biztos túllépést az 50%-os érvényes értékből.
- **Felszerelésből ismert rész:** csak diagnosztikai komponens, nem teljes karakterérték. Az egyéb módosítók nem kerülnek duplán rá.
- **Érvényes kritikus esély:** `derived.critChance`, a runtime Content API `critCap` kulcsával.
- **Support végérték:** `derived.harceroStats` explicit numerikus értékei. Az eredeti Bónuszok panel megfigyelt szövege fejlesztői tanú marad; önmagában nem bizonyítja a raw/effective jelentést. A `supportRaw` külön mező.
- **Soft cap:** a publikus szabály `supportSoft` listája az irányadó. A csökkenő hozadékot nem nevezzük kemény levágásnak; a nyers mínusz effektív különbséget nem állítjuk automatikusan elveszett cap-túllépésnek.
- **Kitérés:** a szint- és DEX-részarányos normál referencia számítható. A mapBoss, guardian és towerBoss limitek három külön konfigurációs kulcs; a tényleges ellenfél DEX-e nélkül nincs kitalált bossesély.

Hiányzó végérték normál módban nem kap kártyát vagy kötőjelet. A forrás-/nyersbontás fejlesztői nézetben marad. A HP, támadás és nyers védelem pontértékére nincs kitalált globális cap.

### 2. Jutalombónuszok

A korábbi VIP-/főzetfizetési feltételezést a normál főmutatóban kiváltja az explicit `mods.*Paid`, `mods.*Mult` és a megfelelő `derived.*Bonus`. A támogatott kliens jelenléte és játékverziója szükséges. Az XP/Nyang és a külön fizetős rész összeadása nem duplázza a felszerelési bónuszt. Hiányos fizetési adatból nem jelenik meg kész végösszeg.

### 3. Adatfrissesség és terhelés

Az API-ból érkező karaktervetület megfigyelési ideje ismert; öt perc után új tanú nélkül a normál statok eltűnnek. Nincs új hálózati polling. Strukturált API-adat mellett a statolvasó nem olvassa újra a teljes `document.body.innerText` tartalmat minden ütemezett változáskor. A Bónuszok panel keresése célzott. A korábbi, sikeres játékbeli változtatás utáni összevont olvasási folyamat megmaradt. A normál mód nem futtat rejtett Atlas UI-időzítőt.

## Kompatibilitás és adatkezelés

A `stonestormCompanion.ui.v1` kulcs maradt, a normalizált tartalom sémája 2. Ismeretlen téma Emeraldra vált; a fejlesztői kapcsoló hiánya kikapcsolt értéket jelent. Régi, elrejtett főmenücélból Áttekintés lesz. A kompatibilis geometria/gyorselérés megmarad; rejtett gyorscél a tárhelyben megőrizhető, de normál módban nem jelenik meg.

A karakterenkénti három preset formátumát és saját tárgypéldány-azonosítóit nem migráltuk át másik tárhelyre, nem töröltük. A helyi UI-reset csak a UI-kulcsot törli. Az új téma vagy a fejlesztői kapcsoló nem ír presetet. A régi kísérleti nézetbeállítások megmaradnak, de az aktiválás csak az adott oldalon végzett külön fejlesztői művelettel történhet.

Az adatkezelési tájékoztató újraellenőrizve: helyi presetek tartalmaznak saját azonosítókat; a megfigyelt karakteradat memória-vetülete nevet is tartalmazhat; ez nem kerül UI-beállításba vagy anonim exportba. Az Atlas-szanitizáló, a kézi helyi export, a korábbi olvasófrissítés és a privát munkameneti tranzakciónapló külön le van írva. Új jogosultság és automatikus feltöltés nincs.

## Kiadás és ismert korlátok

- Kiadás: **Stonestorm Companion 0.14.0 BETA**. Manifest, csomagverzió, popup, lábléc és generált release-adat egyezik.
- Telepíthető ZIP: `downloads/stonestorm-companion-0.14.0-beta.zip`. A régi általános ZIP-cím bájtra azonos kompatibilitási alias.
- Rövid változásnapló: az addon `CHANGELOG.md` fájlja, a ZIP-ben is.
- A régi README archiválva: `docs/archive/COMPANION_0133_README.md`. Az aktuális README már nem ad utasítást eltávolított iframe-tesztre.
- A nem ismert adatot tartalmazó stat a normál UI-ból szándékosan kimarad; ettől nem válik az egész Companion vagy a Kísérők funkció elérhetetlenné.
- A Felöltözés és a játékfelület-kísérletek élő fiókos elfogadása továbbra is hiányzik. Normál használatban nincs félrevezető alkalmazásgomb.
- Az izolált tesztek nem bizonyítják a játék bármely jövőbeli kliensverziójának változatlan működését. A verzió-/adatellenőrzés ezért hibára zár.
- A képek címkézett helyi React/MV3-próbákból származnak, nem élő játékfiók elfogadási felvételei.

## Ellenőrzési források

`tests/companion-stabilization.test.mjs`, `tests/addon-stabilization-browser.mjs`, a teljes `npm test`, a Kísérők asztali/mobil forrásregressziója, a megőrzött fejlesztői shell-kompatibilitás és a privát felszerelési adapter külön, szintetikus regressziója. Gépi eredmény: `reports/companion-0140-verification.json`; publikus forráslista: `data/companion-0140-evidence.json`.

Elsődleges források: [Content API](https://stonestorm.gg/api/content), [vizsgált GameApp](https://stonestorm.gg/assets/GameApp-C3ojBE57.js), [vizsgált CharacterPage](https://stonestorm.gg/assets/CharacterPage-B704UG3d.js), [vizsgált index](https://stonestorm.gg/assets/index-B-KQL_s0.js).

## Végső teszteredmények

| Ellenőrzés | Eredmény | Bizonyíték hatóköre |
|---|---|---|
| `npm test` | 317/317; capture-refresh és native-community is OK | Egység-, modell-, tárolási, csomagolási és forrásregresszió. |
| `npm run test:addon:stabilization:browser` | 21/21; 0 JavaScript-hiba; 0 játékmeneti írás | Valódi MV3-bővítmény és React, jelölt szintetikus játékadat. Normál öt menü, statlimitek, presetmentés/előnézet/javaslat, portyák, popup, témák, értesítések, fejlesztői mód, régi kapcsolók és elavult adat elrejtése. |
| `npm run test:addon:pets:browser` | Asztali és mobil: sikeres; 0 aktiválás | Aktív/inaktív Keselyűfióka +4%, Mohaagancs +9%, Hópárduckölyök +5,5%, DOM-elsőbbség és saját azonosítás. Helyi forrásminta. |
| Fejlesztői Companion-kompatibilitás | 22/22 | Külön jelölt szintetikus regresszió; nem élő játékelfogadás. |
| Privát felszerelési adapter | 16/16 | Mock szerver, tranzakciós és visszaellenőrzési korlátok; nem élő fiókos equip-bizonyíték. |
| `npm run check:addon` | Sikeres | Mindkét ZIP bájtra egyezik az engedélyezett runtime-/dokumentumlistával. |
| `npm run check`, `git diff --check` | Sikeres | Szintaxis, HTML-azonosítók, helyi hivatkozások/képek és változtatott sorok. |
| Képek kézi átnézése | Áttekintés, Statok, Felszerelés, Portyák, három téma, 320 px-es Ember és normál Pet tooltip | Helyi MV3/React-képek; nem élő játékfelvétel. |
| Élő bejelentkezett játékfiók | **Nem tesztelt** | Az élő felöltözés és a kísérleti játékfelületek továbbra sem igazoltak. |

A teljes tesztfutás először a publikációs teszt régi, kizárólag általános ZIP-nevet elfogadó ellenőrzésén bukott el. Az ellenőrzés most a két konkrét kiadási nevet engedi; tetszőleges ZIP-et továbbra is elutasít. Az újrafuttatás 317/317 sikeres.

A végső ZIP mérete **502 260 bájt**. SHA-256: `62f29fdc6afe0b911162663563c3ef0b9db8f7611f19efc612baa170740e863d`. Az általános és a verziózott ZIP hash-e azonos. Képek: `.integration/stabilization-0140/`; a gépi böngészős eredmény: `reports/companion-0140-verification.json`. Commit, push és publikálás nem történt.
