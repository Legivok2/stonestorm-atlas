# Workspace 0.2.0 – négy valódi Tárnák panel

2026. november 24. · Windows x64 · Electron 45.4.1.

## Eredmény a hat kért pont szerint

| Kérdés | Tényleges eredmény |
|---|---|
| Négy valódi játékpéldány elindul? | Igen. Négy saját webContents, ugyanabban a BaseWindow ablakban, eredeti https://stonestorm.gg/mining dokumentumokkal és közös saját Electron sessionnel. Mind a négy HTTP 200. |
| Mindegyik külön fülön áll? | Igen: mine / smelt / craft / master, az eredeti gombokkal. Eltérő fülazonosító, hibás ARIA-kapcsolat, duplikált panel vagy submit típusú fül esetén nincs kattintás; az eredeti nézet visszaáll. |
| Valóban interaktívak? | Az eredeti fülek ártalmatlan váltása, külön állapotuk, eredeti hosszú listáik görgetése és a nagyítás/frissítés kipróbálva. A helyi teszt a négy renderer valódi bevitelét is ellenőrzi. Erőforrást fogyasztó eredeti gombot nem nyomtunk meg; ezek végső elfogadása a játékos feladata. |
| HUD és háttér eltűnt? | Igen. Az élő DOM-ban a HUD, rail és mine-scene nem látható; a tartalom kitölti a natív nézetet. 960/1280/1920 pixeles alkalmazásnál nincs mért vízszintes tartalomlevágás. Az eredeti inputok, ikonok, készletek, időzítők és műveleti gombok megmaradtak. |
| Hogyan frissül? | Kézi ↻ vagy Panelek frissítése. Az eredeti /mining oldal újratöltődik, a saját kliens GET /api/mining olvasása fut, majd az eredeti fülgomb visszaáll a panel céljára. A próba 8 ilyen olvasást és **0 mining-műveleti kérést** rögzített. |
| Mi maradt ellenőrizetlen? | Olvasztás/gyűjtés/fejlesztés/vásárlás/adomány tényleges végrehajtása; egy ilyen művelet utáni azonnali keresztpaneles készletszinkron; hosszú távú terhelés és többnapos munkamenet. Új kézi bejelentkezési folyamatot nem automatizáltunk vagy teszteltünk. |

## Futtatás

1. Zárd be a korábbi Workspace-verziót. A futó ablakot és munkamenetet nem zártuk be vagy írtuk felül automatikusan.
2. START_WORKSPACE.cmd. Ez a dist/0.2.0/StoneStorm Workspace-win32-x64/StoneStorm Workspace.exe fájlt indítja.
3. Szükség esetén nagyíts ki egy panelt a ⛶ gombbal, jelentkezz be kézzel, kezeld az eredeti sütipárbeszédet, majd kattints a Panelek frissítése gombra.
4. A felső sorban 4×1 / 2×2, Kompakt és alaphelyzet; a panel fejlécében frissítés és nagyítás. Az elválasztók húzhatók, fókuszálva nyílbillentyűvel is mozgathatók.

A teljes EXE-mappa szükséges, nem elég egyedül az EXE. Külön Node.js vagy Companion nem szükséges. Az elrendezés és megjelenési mód mentődik, a tartós session/profil változatlan.

## Bizonyítékok és tesztek

- 9/9 egységteszt: URL-határok, sandbox, biztonsági beállítások, geometria, hibaosztályozás és beállításmigráció.
- 19/19 valódi Electron-runtime ellenőrzés **helyi, egyértelműen jelölt szintetikus dokumentumokon**. Négy renderer, saját állapot és megbízható bevitel, külön görgetés, húzható elválasztó, 4×1/2×2, nagyítás, CSS-visszaállítás, hibás fülazonosító/submit gomb elutasítása, újrarenderelés, navigáció, újratöltés, API-/hálózati hibák és teljes bezárás. Saját tesztcookie megmaradt valódi újraindítás után.
- 7/7 ellenőrzés **eredeti, bejelentkezett HTTPS-játékpéldányokon**, kizárólag erőforrást nem fogyasztó UI-lépésekkel. A teszt az alkalmazás korábbi saját .probe-profile profilját használta; Chrome-cookie-t nem olvasott/nyert ki.
- A csomagolt EXE új, üres ideiglenes profilban négy eredeti HTTP 200-as bejelentkezőoldalt töltött be. Ez az EXE-indítást/betöltést bizonyítja, a kézi belépést és a négyes felület játékosi elfogadását nem.
- Az ASAR pontosan 11 saját runtime-/dokumentumfájlt tartalmaz; a saját forrásfájlok bájtra egyeznek. Nincs teszt-HTML, tesztprofil, cookie vagy játékfájlmásolat a csomagban.
- A Companion 63 forrásfájljának hash-e változatlan maradt. Beállításaihoz a Workspace nem fér hozzá. A projekt teljes 317 egységtesztje és a capture-refresh/native-community forrásteszt is sikeres volt.

Gépi eredmények: runtime-test.json, four-live-verification.json, packaged-startup.json, windows-build.json. Képek: live-columns-window.png és live-grid-window.png; tényleges saját Windows-ablakról készült felvételek. A külön panelképek webContents.capturePage() felvételek; nem kerülnek helyettesítő panelként a programba.

A Windows computer-use helper korábban nem volt elérhető. A valódi ablak képe az Electron desktopCapturer saját ablakforrásából származik; a külön rendererek képei a saját capturePage felvételeik. Kézi Windows-bevitelt vagy erőforrást fogyasztó játékakciót nem állítunk ettől igazoltnak.

## Frissítés és szinkron korlátai

A vizsgált MiningPage a saját inicializációjakor GET /api/mining kérést használ; külön React-állapotot tart. A Workspace nem továbbít nyers játékállapotot a panelek között, nem küld közvetlen API-kérést, nem játszik vissza műveletet, és nem alkalmaz periódikus dokumentum-újratöltést. A DOM-ellenőrzés csak a fül-/felületszerkezetet figyeli, nem olvas karakter- vagy készletadatot.

Az eredeti GET olvasások ideje és HTTP-/hálózati hibája passzívan látszik a panel állapotjelzésén. Ettől a többi panel készlete nem lesz automatikusan frissnek nyilvánítva. A frissítés elveszítheti a beírt mennyiséget; szerveren már megkezdett műveletet nem von vissza. Ismételt frissítéskattintás nem hoz létre új nézeteket; a folyamatban levő panel-újratöltést összevonjuk.

## Terhelési minta

A négy eredeti játék + a saját helyi vezérlőnézet folyamatainak munkakészlet-összege: **1363 MiB**. Két másodperces mintavételi ablakban az Electron által közölt CPU-százalékok összege: **0.89%**. Ez rövid pillanatfelvétel, nem tartós benchmark vagy memóriafelső korlát; a megosztott memórialapok az összegben többször is szerepelhetnek. A részletes folyamatminta a four-live-verification.json fájlban van.

A négy játékpéldány külön memória- és CPU-költséggel jár. Nagyításkor a többi példány nem semmisül meg; a háttérben működésük nem kapcsolódik ki. A helyi vezérlőnézet képkockái is aktívak maradnak, hogy kitakart ablaknál se maradjon üres fejléc.

## Szabályzat és engedély

A Játékszabályzat 2. pontja és az ÁSZF 17. pontja általános kliensmódosítási tilalmat tartalmaz; nyilvános CSS-kivételt nem találtunk. Ezt jeleztük. A felhasználó erre megerősítette: „Igen van, csináld meg.” Az implementáció a felhasználó által jelzett üzemeltetői engedélyre támaszkodik; az írásos dokumentumot nem kaptuk meg és nem ellenőriztük önállóan. Ez nem általános engedély más felhasználóknak.

Források: [Játékszabályzat](https://stonestorm.gg/legal/game-rules), [ÁSZF](https://stonestorm.gg/legal/terms); a kliens által használt, 200-as válasszal lekért hivatalos dokumentummodulok hash-e: four-evidence.json. Az eredeti kliensfájlok változatlanok. A megjelenítési réteg eltávolítható Electron user CSS; az egyetlen automatikus kattintás a teljes szerkezetellenőrzés után kiválasztott eredeti fülgomb lehet.

## Javított hibák és fennmaradó korlátok

A későn visszaérő DOM-olvasás nem írhatja felül az új dokumentumot; dokumentumgenerációval védett. A játék újrarenderelésekor visszaálló fül kompakt módban az eredeti UI-val korrigálódik; eredeti módban a kézi fülválasztást tiszteletben tartjuk. A gyors elválasztóhúzás utolsó pozíciója nem vész el. A hosszú időzítőfelirat kis szélességen tördelődik, nem kerül levágásra.

Az eredeti cookie-/engedélypárbeszédek megmaradnak. Külső OAuth/popup belépés továbbra sem engedélyezett. Jövőbeli DOM-változásnál az érintett panel eredeti nézetre áll vissza és hibát jelez; nem készül statikus pótlás. A négyes használat végső játékosi elfogadása még hátravan.

EXE SHA-256: 22c47740cef668c1ff70889d6ec088bbb5ac0a64713ba813138d3703c50b84a7

ASAR SHA-256: 580081552948582223f490d4e426ba7732aede82ca2849ea7e5773d1c1ee85f5

A Közösség nem készült el. Nem történt automatikus commit, push vagy publikálás.
