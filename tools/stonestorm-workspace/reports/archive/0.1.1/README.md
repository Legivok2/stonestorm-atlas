# StoneStorm Workspace – Phase 1 · 0.1.1

Önálló, helyben futtatható Windows x64-prototípus. Egyetlen Electron BaseWindow, egy vagy két eredeti WebContentsView játékpéldánnyal. A Companion addonhoz és beállításaihoz nem nyúl.

## Indítás

Dupla kattintás a START_WORKSPACE.cmd fájlon ebben a mappában. Nem szükséges Node.js, npm vagy Chrome-bővítmény.

Közvetlen EXE: dist\StoneStorm Workspace-win32-x64\StoneStorm Workspace.exe

Másoláskor a teljes StoneStorm Workspace-win32-x64 mappát vidd át a DLL-ekkel és a resources könyvtárral együtt. Az EXE saját, aláírás nélküli helyi próbaverzió.

## 1. Egyetlen játékpéldány – te ellenőrzöd

1. A program mindig egy nézettel indul, a https://stonestorm.gg/mining címen.
2. Kézzel jelentkezz be az eredeti oldalon. Ha Cloudflare-ellenőrzés jelenik meg, azt is kézzel végezd el. Ha a város nyílik meg, a játék saját Tárnák gombjával nyisd meg a bányát. A Próba menü Eredeti Tárnák megnyitása pontja is csak az eredeti HTTPS-oldalra navigál.
3. Próbáld ki az eredeti kezelőelemeket és füleket. Ellenőrizd a játékot, a bejelentkezést, a Tárnák megnyitását, a kattintásokat és fülváltást.
4. Ha tiltás vagy betöltési hiba van, állj meg. Próba → Diagnosztika mentése… rögzíti a HTTP-státuszt, útvonalat és hibát. A program nem kerül meg védelmet.

## 2. Két önálló panel – csak sikeres első próba után

1. Próba → 1. Az egynézetes élő próbát ellenőriztem → Két nézet…
2. Csak a ténylegesen sikeres kézi próba után erősítsd meg az öt feltételt. A bal játék megmarad; mellé kerül egy új, saját webContents-szel futó példány ugyanabban az ablakban.
3. Az eredeti játékfülekkel kézzel válaszd: BAL – Tárna; JOBB – Olvasztó. A program nem választ játékfület és nem módosít React-állapotot.
4. Ellenőrizd, hogy a két fülállapot megmarad, mindkét panel fogad kattintást, és a görgetésük külön működik. A készletek automatikus szinkronját ne feltételezd.
5. Próba → 2. A kétpaneles élő próba eredménye… alatt rögzítheted a Működik / Nem működik eredményt. Ez saját visszajelzés, nem automatikusan megállapított siker.

A Nézet menüben: bal/jobb fókusz (Ctrl+1 / Ctrl+2), külön újratöltés, 40/60–50/50–60/40 arány és teljes képernyő (F11). Az újratöltés elveszítheti a beírt értéket és fülállapotot. Nincs automatikus játékakció vagy panelfrissítés. Új indításkor ismét egy nézet nyílik.

## Adatok és biztonság

Közös, saját tartós Electron session: persist:stonestorm-workspace-v1, profilja %APPDATA%\StoneStorm Workspace. Nincs Chrome-cookie-import. A cookie-k lejáratát a játék szabályozza.

A játékoldalon Node-integráció kikapcsolva; context isolation, sandbox és webSecurity bekapcsolva. Nincs preload, IPC-híd, játékkód-/CSS-injektálás vagy alkalmazás által készített iframe. A fő navigáció csak a https://stonestorm.gg eredetre engedett. A játék saját Cloudflare-alnézete számára a https://challenges.cloudflare.com engedett. Külső belépési szolgáltató és popup nincs engedélyezve; ha ilyen kell a belépéshez, az a próba dokumentálandó korlátja. Nincs TLS-/CSP-kivétel vagy védelemmegkerülés.

A diagnosztika helyi; nincs cookie-, beviteli mező-, karakter- vagy chatszöveg-kiolvasás és feltöltés. Bezáráskor minden saját webContents megszűnik.

## Ellenőrzés és korlát

A HTTP 200 vagy az eredeti bejelentkezőoldal betöltése önmagában nem bizonyítja a kézi belépést vagy a két élő panel használhatóságát. A helyi Electron-teszt és a valódi játék próbaeredménye külön szerepel: reports/ACCEPTANCE.md.

Négyes Tárnák, Közösség és végleges UI nem készült. Ezek a sikeres élő kétpaneles visszaigazolásig nem következnek.

## Fejlesztői parancsok

Node.js 22.12+ esetén ebben a könyvtárban: npm ci; npm run setup:electron; npm test; npm run test:electron; npm start.

npm run package:win készíti a Windows-buildet. npm run probe:live egyetlen eredeti oldalt figyel 20 másodpercig új, üres ideiglenes profilban, majd jelentést/képet ment és bezárul. Nem kattint és nem jelentkezik be; ez nem interaktív elfogadási próba. A normál tartós profilt nem módosítja.

Elsődleges dokumentáció: [BaseWindow](https://www.electronjs.org/docs/latest/api/base-window), [WebContentsView](https://www.electronjs.org/docs/latest/api/web-contents-view), [biztonság](https://www.electronjs.org/docs/latest/tutorial/security).

Nincs automatikus commit, push vagy publikálás. Korábbi részletes leírás: reports/archive/0.1.0-README.md.
