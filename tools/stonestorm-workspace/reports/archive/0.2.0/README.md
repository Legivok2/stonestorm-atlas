# StoneStorm Workspace 0.2.0 – Négy aktív Tárnák panel

Egy Windows-ablak: **TÁRNA | OLVASZTÓ | MŰHELY | GWANGSU**. Négy külön WebContentsView és eredeti Stonestorm-példány, közös saját tartós Electron sessionnel. Az eredeti játék adatai, ikonjai, inputjai és műveleti gombjai láthatók.

## Indítás

1. Zárd be a korábbi Workspace-verziót. A már futó régi alkalmazást nem cseréljük ki vagy állítjuk le automatikusan.
2. Dupla kattintás: **START_WORKSPACE.cmd**.
3. Ha szükséges, nagyítsd ki az egyik panelt a ⛶ gombbal, és jelentkezz be az eredeti oldalon. Ugyanez a saját Electron session maradt; a Chrome-ból nincs cookie-átvétel.
4. Nyomd meg a **Panelek frissítése** gombot. A négy eredeti /mining dokumentum betölt, a program az ellenőrzött eredeti fülgombokkal kiválasztja a négy megfelelő fület, majd alkalmazza a kompakt CSS-t.

EXE: dist\0.2.0\StoneStorm Workspace-win32-x64\StoneStorm Workspace.exe. A teljes mappa szükséges a DLL-ekkel és a resources könyvtárral. A futtatáshoz nem kell Node.js vagy Companion. A korábbi 0.1.1 build megmaradt.

## Kezelés

- **4 × 1 / 2 × 2:** a felső választóban. Az alapértelmezés négy oszlop; a később kiválasztott elrendezés mentődik.
- **Elválasztók:** húzd a panelek közötti sávokat. Billentyűzettel fókuszálva nyilakkal is méretezhetők.
- **↻:** az adott eredeti /mining oldal újratöltése. **Panelek frissítése:** mind a négyé. A beírt értékek elveszhetnek; ez nem szakítja meg és nem vonja vissza a szerveren már elindított műveletet.
- **⛶:** egy panel nagyítása / mind a négy visszaállítása. A többi példány végig betöltve marad; nem záródik be és nem indul újra.
- **Kompakt kikapcsolása:** a beszúrt CSS eltávolításával visszaadja az eredeti teljes játékoldalakat. Az eredeti fülek ilyenkor kézzel válthatók. Visszakapcsolva a Workspace ismét a kiosztott füleket választja.
- **F11:** teljes képernyő. **Ctrl+1…4:** panel fókusza. Az elrendezés alaphelyzetbe állítható a felső gombbal.

A négy hosszú tartalom külön görgethető. A készletek az eredeti játékból származnak. A sütibeállítások és a szükséges eredeti párbeszédek megmaradnak; ezeket kézzel kezeld.

## Adatfrissítés

A négy React-példány állapota külön él. Egyik ablak sikeres művelete után a többinek azonnali készletfrissítése **nincs igazolva**. Nincs saját állapotszinkron vagy háttérben küldött játék-API-kérés.

A kézi frissítés az eredeti HTTPS-oldal újratöltését használja. A játék saját inicializációja GET /api/mining olvasást végez, majd a Workspace az eredeti UI-val visszaállítja a kiosztott fület. A program passzívan figyeli ennek az eredeti olvasásnak az idejét/HTTP-hibáját; a panel állapotjelzőjének súgójában látható. A HTTP-válasz önmagában nem jelent panelek közötti szinkrongaranciát.

A Workspace nem indít gyűjtést, vásárlást, fejlesztést, olvasztást vagy adományozást. A játék eredeti gombjai a saját kattintásaidra továbbra is végrehajtják ezeket.

## Biztonság és megjelenítési engedély

A session/profil változatlan: %APPDATA%\StoneStorm Workspace; persist:stonestorm-workspace-v1. Nincs új bejelentkezési rendszer. A játékoldalakon nincs Node vagy preload; sandbox, context isolation és webSecurity bekapcsolva maradt. A saját vezérlősáv külön helyi nézet, szűk IPC-híddal; a játékoldalak nem kapnak hozzáférést.

Csak az eredeti stonestorm.gg főoldali navigáció és a játék saját Cloudflare-alnézete engedett. Nincs iframe-architektúra, komponensmásolat, CSP-/TLS-kivétel, Cloudflare-bypass vagy saját szerverkommunikáció. Külső OAuth/popup belépés továbbra is korlát.

A közzétett szabályzat általános kliensmódosítási tilalmát jeleztük. A felhasználó megerősítette, hogy van üzemeltetői engedélye a Workspace-megjelenítésre. A CSS erre a használatra készült; ez nem állítás arról, hogy általánosan engedélyezett addon lenne. Az eredeti kliensfájlokat nem módosítjuk. Hibás/megváltozott DOM-szerkezetnél nincs találgatott fülválasztás, és az érintett panel az eredeti megjelenítést kapja vissza.

## Ellenőrzés

Részletek: reports/ACCEPTANCE.md. A helyi szintetikus Electron-teszt és az eredeti HTTPS-játékban végzett, erőforrást nem fogyasztó próba külön szerepel. A tényleges olvasztás/gyűjtés/fejlesztés és a műveletek utáni keresztpaneles készletszinkron a játékos elfogadási tesztjére vár.

Fejlesztői futtatás Node.js 22.12+ mellett: npm ci; npm run setup:electron; npm test; npm run test:electron; npm start. Windows-build: npm run package:win. A build a saját dist/0.2.0 mappába kerül; a futó korábbi verziót nem írja felül.

npm run probe:live: négy nézetes, húsz másodperces, új üres profilú betöltési megfigyelés. Nem jelentkezik be, nem old meg ellenőrzést és nem végez játékműveletet.

Nincs Companion-módosítás, Közösség-fejlesztés, automatikus commit, push vagy publikálás.
