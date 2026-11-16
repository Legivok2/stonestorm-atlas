# Stonestorm Stat Cap Overlay – BÉTA

Helyi fejlesztési kiadás: **0.9.6 BÉTA**, készítő: **Patrik**. Az eredeti 0.9.3-as import lenyomatai az `import.json` fájlban megmaradtak. A statisztikai számítások változatlanok; csak egy panel-csatlakozási pont és a szükséges kísérőmezők továbbítása került a régi szkriptekbe. Ezt külön regressziós hash-ellenőrzés védi. A nyilvános ZIP a sikeres publikálásig a korábbi kiadást tartalmazza.

## 0.9.6 kipróbálása helyben

Kísérő-tooltip hibajavítás: a helyi `capture.js` valóban továbbítja a teljes megfigyelt `pets` listát külön `pet-roster` csomagban, még a statisztikai mezők ellenőrzése előtt. Ez nem azonos a GitHubon még látható 0.9.4-es forrással. Az azonosítás saját rekordazonosító alapján történik; a numerikus és szöveges azonosítók DOM-nak megfelelő normalizálást kapnak. Ütköző azonosító nem használható egyedi képesség hozzárendelésére.

A fajbónusz elsődleges forrása az adott sor saját, látható `.pet-card__bonus` felirata; más kísérő kártyája, összesített karakterbónusz vagy következő szint ajánlata nem használható. A jelenlegi nyilvános kliens nem igazol külön, numerikus szerveres végértékmezőt: ennek nevét és mértékegységét nem találgatjuk. Ha nincs közvetlen felirat, a megfigyelt saját rekordból és az igazolt V3-képletből számolunk. Az `it()` kliensfüggvény szerint a forma `form ?? bond ?? 1`, a `Kn()` szerint a kihagyott rang 0. Ez nem állandó +4%-os fajérték. Hibás, kifejezetten megadott mező nem kap ilyen alapértéket; puszta fajnévből nem következtetünk saját rangra vagy tanult képességre.

Az **Atlas adatgyűjtés → Kísérő-tooltip helyi diagnosztika** megmutatja a kapott/felismert és sikeresen társított rekordok számát, a játékfeliratból olvasott/számított/nem elérhető bónuszok számát, a hiányzó mezőket és az azonosítási hibák típusát. Nem tartalmaz saját azonosítót, kísérőnevet, szintet vagy konkrét képességlistát; nem része az anonim exportnak. A rész megnyitásakor frissül. Sikertelen társítás esetén a tooltip sem helyettesíti az állatot a fő kísérővel.

A javítást `npm run test:addon:pets:browser` ellenőrzi: aktív és inaktív Keselyűfióka, inaktív Mohaagancs, Hópárduckölyök, hiányos rekord, sor-újrarenderelés és fülváltás. A próbák közben nincs aktiválás és nincs `/api/pets/*` kérés. A natív MV3-próba numerikus saját azonosítóval és kihagyott rang-/formamezővel is fut.

A projekt `addons/stonestorm-statcap-overlay/` mappáját közvetlenül betöltheted a `chrome://extensions` oldalon, vagy kicsomagolhatod a helyi `downloads/stonestorm-statcap-overlay.zip` fájlt. Már telepített példánynál cseréld a fájlokat, nyomj Újratöltést a bővítményen, majd frissítsd a játék lapját. Ellenőrizd a 0.9.6 verziót.

1. Nyisd meg a játék **Stat limitek** paneljét, majd a **📥 Atlas adatgyűjtés** részt. Indítsd el a 60 másodperces gyűjtést, és nyisd meg az Otthont, Szobákat vagy az Arénát. A megtartott válaszminták kategóriánként láthatók; ugyanannak a végpontnak a legutolsó mintája marad meg.
2. A Chrome-ikon popupja ugyanennek a játéklapnak a gyűjtését mutatja. Bármelyik felületről exportálhatsz vagy leállíthatsz; az export és a leállítás törli a helyi mintákat. A 60 másodperc lejárta után új minta nem gyűlik, a korábbi letölthető.
3. Karakterlap → Kísérők: vidd az egeret egy nem fő kísérő portréjára vagy nevére, vagy Tab-bal fókuszáld. Nem kell aktiválni. A tooltip külön mutatja a fajbónuszt, a harci traitet, a signature-t és a saját tanult képességeket. Escape, görgetés és fülváltás bezárja; a játékgombok működnek.

Az egyedi kísérőadat a már megfigyelt `/api/character` válasz `pets` tömbjéből jön. A forma/rang csak az előbb leírt, kliensben igazolt alapértékekkel egészíthető ki. Hiányzó tanult készséglista **ismeretlen**, nem üres lista és nem egy másik állat képessége. A faj azonosításához elsődlegesen a kliens `data-pet` sorazonosítója kell. Csak név alapján legfeljebb nyilvános fajleírás és a sorban valóban megjelenített adat használható.

A V3 fajbónusz a megvizsgált kliensben `fajérték × (10 × formaszorzó + rangrészesedés × érvényes rang)`, nem egyszerű szintszorzó. A trait külön kap szint-, forma-, ritkaság- és rangskálázást; a signature szintje a forma. Azonos signature és tanult skill nem adódik össze. A tooltip kliensképletből számít feltételes hatásokat; a szerver által ténylegesen összesített, plafonok utáni értéket nem állítja ismertnek. A gyűjteményi könyvbónusz és harcerő teljes összegzése nincs kikövetkeztetve.

A közös modell `js/pet-detail-model.js`, a verziózott nyilvános adat `data/addon-pet-model.json`. Frissítés: `npm run refresh:addon:pets`, majd `npm run build:addon`. A generátor hash-elt importokból keres, ellenőrzi a használt kliensképleteket, megváltozott logikánál leáll. 403-as kezdőlapnál jelzi, hogy a jelenlegi belépőmodul nem volt igazolható. A `pet-model.js` és `pet-data.js` generált másolat, nem külön kézi adatbázis.

Ellenőrzés: `npm test`, `npm run test:addon:095:browser`, `npm run test:addon:095:native`, `npm run test:sync`, `npm run build:pages`, `npm run test:pages`. A böngészős próbák modellezett játéklappal futnak, valódi játékfiók nélkül. A natív próba külön Chromium-profilt és valódi MV3-betöltést használ, a MAIN és ISOLATED világ, a zárt panel és az igazi Chrome-popup közötti működést is ellenőrzi; a saját tesztprofilját törli. Ehhez a teljes Playwright Chromium szükséges, a headless shell önmagában nem támogatja a bővítményt.

A bővítmény a Stonestorm karakteradatait, felszerelésbónuszait és statlimitjeit jeleníti meg a játék fölött. **BÉTA: felismerési hibák, hiányos vagy elavult játékadatok előfordulhatnak.**

## Ingyenes telepítés asztali Chrome-ban

1. Töltsd le a ZIP-et: https://legivok2.github.io/stonestorm-atlas/downloads/stonestorm-statcap-overlay.zip
2. Csomagold ki egy állandó mappába. A kiválasztandó mappa közvetlenül tartalmazza a `manifest.json` fájlt.
3. Írd a címsorba: `chrome://extensions`, majd kapcsold be a **Fejlesztői módot**.
4. Válaszd a **Kicsomagolt bővítmény betöltése / Load unpacked** lehetőséget, és jelöld ki ezt a mappát.
5. Frissítsd a `https://stonestorm.gg/` játékoldalt. A ZIP telepítése nem Chrome Web Store-telepítés.

A telepítési és újratöltési lépések alapja a [Chrome hivatalos útmutatója](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).

## Kézi frissítés

Az Atlas jobb alsó sarkában a **⚔ Stat Addon – BÉTA** panel jelzi az új kiadást. Az Atlas nem olvassa ki automatikusan a telepített Chrome-bővítmény verzióját: opcionálisan megadhatod a saját verziódat, vagy az „Ezt a verziót telepítettem” gombbal rögzítheted. Enélkül az előzőleg látott kiadáshoz hasonlít. Ez a jelzés nem telepít semmit automatikusan.

Töltsd le az új ZIP-et, és a kibontott új fájlokkal cseréld le a korábbi bővítményfájlokat **ugyanabban az állandó mappában**. A `chrome://extensions` oldalon a meglévő bővítmény **Újratöltés** gombját használd, majd frissítsd a játék lapját is. Ne a bővítmény eltávolításával frissíts, mert az törölheti a helyi beállításokat. Az új ZIP-et ne a régi mappán belüli új almappába bontsd.

Az Atlas panel mobilon is használható; ez a telepítési útmutató asztali Chrome-ra vonatkozik.

## Ellenőrzés és adatkezelés

A projekt gyökerében: `npm run test:addon:source`. A teszt az átadott `capture-refresh.test.js` fájlt futtatja változatlanul. Csomagkészítés: `npm run build:addon`. Kiadási leírás: [PUBLISH.md](PUBLISH.md), adatkezelési összefoglaló: [PRIVACY.md](PRIVACY.md).
## Anonim kutatási export – 0.9.6 BÉTA

A 0.9.4-ben bevezetett kutatási exportot a 0.9.6 Chrome-popupja és statisztikai panelje közösen használja. A statisztikai számítások változatlanok; a régi szkriptek minimális csatlakozásait a fent leírt regressziós teszt ellenőrzi.

1. A frissített bővítményt kicsomagolva töltsd be a `chrome://extensions` oldalon. Meglévő telepítésnél használd az Újratöltés gombot, majd frissítsd a játék lapját.
2. A játék statisztikai paneljének **📥 Atlas adatgyűjtés** részében vagy a bővítmény ikonjánál válaszd a **Mintagyűjtés indítása** gombot.
3. A következő 60 másodpercben nyisd meg az Otthont, a Szobákat és az Aréna megfelelő módjait. A bővítmény nem indít kérést, csak a játék által indított, előre engedélyezett GET-válaszokat figyeli.
4. Bármelyik felületen válaszd az **Anonimizált JSON letöltése** gombot. Ismeretlen válaszséma vagy csak személyes állapot esetén nem készül minta.
5. A letöltött fájlt helyben átnézheted. Megosztása külön, kézi döntés; automatikus feltöltés nincs.

Csak engedélyezett katalógusazonosítók és numerikus szabály-/ármezők exportálhatók. Fiókazonosító, játékosnév, ellenféllista, egyenleg, aktuális karakter-/szobaszint, készlet, cookie, token, kérésfejléc és időbélyeg nem kerül a mintába. Egy következő szint ajánlata feltételes megfigyelés: nem bizonyít általános árképletet. Ismeretlen mező alapértelmezésben kimarad. A Leállítás és törlés gomb a memóriában tartott mintákat is törli; letöltés után szintén törlődnek.
# Data Engine V2 kiegészítés

A tooltip számítási modulja az Atlas és a Planner közös modelljének másolata. Új, nem támogatott nyilvános kísérőséma esetén nem alkalmazza észrevétlenül a korábbi képletet. A játék saját sorában megjelenő pontos bónuszfelirat továbbra is elsőbbséget kap.

Az **Atlas adatgyűjtés** indításakor a játék által már elküldött, engedélyezett nyilvános faj- és képességkonfiguráció is felhasználható. Ez nem saját kísérőlista: egyedi azonosító, tanult képesség vagy személyes állapot nem exportálódik. Az indítás helyi újraközlést kér; nem indít új API-kérést. A gyűjtés alatt érkező `/api/content` válasz ugyanezen szigorú engedélylistán halad át. A ZIP újratöltése után a játék lapját is frissítsd.
