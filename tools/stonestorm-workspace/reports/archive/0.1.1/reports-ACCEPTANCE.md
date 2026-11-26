# Workspace Phase 1 – helyi átadás

2026. november 24. · 0.1.1 · Electron 45.4.1 · Windows x64.

## Futtatható alkalmazás

Indító: tools/stonestorm-workspace/START_WORKSPACE.cmd

EXE: dist/StoneStorm Workspace-win32-x64/StoneStorm Workspace.exe. A teljes mappa szükséges; nem kell Node.js vagy Companion addon. Az ASAR-ban csak a README, a produkciós package.json és a három saját alkalmazásforrás található. A három forrás és a README bájtra egyezik az ellenőrzött forrással; nincs tesztprofil vagy felhasználói session a buildben.

## A valódi oldal tényleges megfigyelése

**A csomagolt 0.1.1 EXE új, üres Electron-profilban az eredeti bejelentkezőoldalt betöltötte:** HTTP 200, https://stonestorm.gg/login, nincs betöltési hiba vagy megfigyelt Cloudflare-blokkolás. A húsz másodperces próba nem kattintott, nem adott meg hitelesítő adatot, és nem nyitott második panelt. A Cloudflare emberi ellenőrzésének sikeres kézi elvégzése nincs igazolva, mert nem jelent meg ilyen akadály.

Bizonyíték: packaged-live-single-view.json és packaged-live-single-view.png. A kép ténylegesen az eredeti oldalról készült, nem helyi helyettesítő HTML.

Az aznapi, módosítás előtti 0.1.0 forráspróba a már meglévő saját Electron-próbaprofilban HTTP 200-zal az eredeti /mining oldalt és a Tárnák felületet mutatta. Ez a live-single-view.json/png megfigyelés. Nem történt kézi belépés vagy játékbeli kattintás, ezért ez sem bizonyít teljes interaktivitást. A 0.1.1 frissprofilos eredménye ettől külön szerepel.

## Külön kezelt tesztek

| Ellenőrzés | Eredmény |
|---|---|
| URL-engedélylista, sandbox, diagnosztika, geometria és hibaosztályozás | 7/7 egységteszt sikeres. |
| BaseWindow + két külön WebContentsView/webContents, közös tartós session, külön állapot/bevitel/görgetés, időzítők, navigációs korlátozás és bezárás | 10/10 Electron-runtime teszt, jelölt helyi tesztdokumentumokon. |
| Session megmaradása | Szintetikus HttpOnly cookie valódi Electron-újraindítás után is megérkezett a helyi tesztszerverhez. |
| Csomagolt EXE és eredeti HTTPS-oldal | Elindult; bejelentkezőoldal HTTP 200. |
| Kézi bejelentkezés, eredeti kattintások, Tárna/Olvasztó fülváltás | Felhasználói ellenőrzésre vár. |
| Két élő játékpéldány független React-/fülállapota és interaktivitása | Felhasználói ellenőrzésre vár; nem minősült sikeresnek a helyi tesztek alapján. |
| Companion megőrzése | Mind a 63 addonfájl SHA-256 értéke változatlan a fázis elejéhez képest. Az alkalmazás nem olvassa vagy írja a Companion/Chrome beállításait. |

A Windows computer-use helper nem volt elérhető (native pipe: os error 2). A vizuális ellenőrzés az alkalmazás saját webContents.capturePage() felvételén történt. Nem helyettesítettük ezt hitelesített kézi kattintási próbának.

## Pontos kézi próba

1. Indítsd a START_WORKSPACE.cmd fájlt. Mindig egyetlen eredeti játékpéldány nyílik.
2. Kézzel jelentkezz be, szükség esetén végezd el az eredeti Cloudflare-ellenőrzést, majd nyisd meg a játék Tárnák oldalát. Próbáld az eredeti kezelőelemeket és füleket.
3. Blokkolás esetén állj meg; Próba → Diagnosztika mentése… A prototípus nem old fel biztonsági korlátozást. Külső OAuth/popup bejelentkezés jelenleg tiltott, ha ilyet igényel a fiókod, ezt konkrét blokkoló okként rögzítsd.
4. Csak siker esetén: Próba → 1. Az egynézetes élő próbát ellenőriztem → Két nézet… A saját visszajelzésed után a bal nézet változatlanul megmarad, és mellé kerül a második példány.
5. A játék eredeti füleivel kézzel válaszd balra a Tárnát, jobbra az Olvasztót. Ellenőrizd a külön fülállapotot, kattintásokat és görgetést.
6. Próba → 2. A kétpaneles élő próba eredménye… → Működik / Nem működik. A jelentés a saját visszajelzést user-confirmed jelöléssel különíti el.

Négyes Tárnák, Közösség és végleges UI nem készült, nem aktiválható. A játékhoz nincs iframe, preload, Node-integráció, IPC-híd, komponensmásolat, CSS-/kódinjektálás vagy automatikus játékművelet.

## 0.1.1 változások és build

A korábbi egy-/kétpaneles prototípus megtartása és újraellenőrzése; rövidített indítási útmutató; minden megfigyelési próba új üres profilt kap. A diagnosztika külön jelzi a challenge-et, HTTP-hibát, navigációs hibát és be nem fejezett betöltést. Ezeket nem nevezi sikeres kézi tesztre kész oldalnak.

A Windows-build Node.js 22.23.5 környezetben készült. A gép alapértelmezett Node.js 20 változatával a packager nem futott; a dokumentált Node.js 22+ követelmény teljesítésével a build sikeres. A csomagolt alkalmazáshoz nincs szükség külön Node.js-re. A rendszer Node-/biztonsági beállításait nem módosítottuk.

EXE SHA-256: e170501dfdebf7d7d78e077138e60c43b582708b1de1c6a204b3f71c1ead46da

ASAR SHA-256: 503e86b8719acfd720e8fdccc7aba6508cd19cf1dfb95472bed3974ddec23c57

Gépi összesítés: phase1-verification.json. Nincs commit, push vagy publikálás. A következő fejlesztési fázis az élő kétpaneles visszaigazolásra vár.
