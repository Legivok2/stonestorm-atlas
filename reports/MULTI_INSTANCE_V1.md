# Multi-Instance V1 – első, kétiframe-es kapu

2026. november 23. · Companion 0.13.3 · helyi fejlesztés · nincs commit, push vagy publikálás.

**Az élő megvalósíthatósági próba BLOKKOLT / NEM IGAZOLT.** A bejelentkezett játékhoz tartozó munkamenet nem érhető el az automatizálási környezetből. A külön, üres Chromium-profilban megnyitott `https://stonestorm.gg/mining` HTTP 403-as Cloudflare-ellenőrzést ad. Nem léptünk át az ellenőrzésen, nem másoltunk át felhasználói cookie-kat. Ez környezeti akadály; nem bizonyítja, hogy a játék tiltja vagy engedi az iframe-et.

## Elkészült, szűken korlátozott próba

- A játék **saját DOM-jában**, a `stonestorm.gg/mining` szülőoldalon nyílik meg. Nincs `chrome-extension://` workspace.
- Kizárólag két valódi iframe: eredeti `/mining` és `/mining`. A termékben nincs teszt-HTML, másolt játékpanel, saját műveleti gomb vagy helyettesítő előnézet.
- Az eredeti `.mine-tabs button[role=tab][data-mine-tab]` vezérlőket használja, ellenőrzött `aria-controls` és `aria-labelledby` kapcsolattal. Induláskor a kijelölt Tárna és Olvasztó fület állítja be. Rövid, eredeti navigációs fülváltásokkal vizsgálja, hogy a másik dokumentum állapota megmarad-e. Erőforrást használó gombot nem aktivál.
- A felhasználó beviteli tevékenysége megszakítja a további automatikus ellenőrző fülváltásokat. Az oldalbetöltés és a fülkiválasztás határideje korlátozott; iframe `load` esemény önmagában nem jelent sikert.
- Az eredeti szülőalkalmazás DOM-ja megmarad. A próba idejére a `#root` inert; bezáráskor korábbi inert és overflow értékei visszaállnak. A két iframe és a próba eseménykezelői megszűnnek.
- A tartalomscriptek továbbra is csak főkeretben indulnak. Ezenfelül az új modulok `window.top !== window` esetén visszatérnek. Nincs iframe-rekurzió vagy négy automatikusan induló Companion.
- Nincs automatikus újratöltés vagy készletfrissítést utánzó lokális adatátírás. Nincs automatikus olvasztás, gyűjtés, vásárlás, fejlesztés vagy chatküldés.
- A négyes Tárnák és a Közösség még nincs megvalósítva/engedélyezve. A kompakt CSS, az oszlopméretezés és a végleges kezelő csak az élő kapu után következhet.

## Biztonsági ellenőrzés

A friss `GET /mining` fejléceit a próba elkülöníti a már betöltött dokumentum szabályaitól. A `DENY` és az egyértelmű `frame-ancestors 'none'` válasz már a létrehozás előtt leállítja a próbát. A böngésző tényleges szabályérvényesítése marad a döntő.

A Chromium-tesztnél az ISOLATED környezetből létrehozott iframe és az oldal normál CSP-je eltérően viselkedett. Emiatt a kereteket az oldal **MAIN környezetében** működő, rögzített kétcímes gyár hozza létre. Nincs `webRequestBlocking`, DNR-szabály, proxizás, `srcdoc`, fejléceltávolítás, `web_security` kikapcsolás vagy jogosultságbővítés. Az aktív szülőoldal eltérő `frame-src 'none'` szabálya és a gyermek `frame-ancestors 'none'` szabálya a böngészős regresszióban is megakadályozza a játékfelület megjelenését. A hibaüzenet és a diagnosztika nem helyettesítő játékpanel.

Hivatkozás: [Chrome tartalomscriptek és CSP](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#content_security_policy). A helyi szabályérvényesítési eredmény a saját Chromium-próbából származik.

## Mi igazolt, és mi nem?

| Követelmény | Élő eredmény |
|---|---|
| X-Frame-Options | A 403-as ellenőrző válasz `SAMEORIGIN`; a bejelentkezett játék válasza nem elérhető. |
| CSP frame-ancestors | Az ellenőrző válaszban nincs ilyen direktíva. A játék szabálya ismeretlen. |
| CSP frame-src | Az ellenőrző válaszban `'self' https://challenges.cloudflare.com blob:`; ez nem a játék engedélye. |
| Bejelentkezés, cookie-hozzáférés | Valódi fiókkal nem vizsgálható. A helyi teszt külön HttpOnly + Secure + SameSite=Strict mintacookie-val igazolja a szokásos azonos eredetű továbbítást; nem olvas cookie-értékeket. |
| React inicializáció | Két külön, valódi React-alkalmazás inicializációja a szintetikus tesztben sikeres. Az eredeti játéké még nem igazolt. |
| Független felületi interakció | Helyi React-teszten mindkét dokumentum külön fogad bevitelt, tart fülállapotot, futtat időzítőt és görget. Ez nem élő játékelfogadás. |
| Több szerverkapcsolat, azonos fiók | Élő játékban nem vizsgált. Az iframe-ek és a háttérben megmaradó szülőoldal összesen három teljes alkalmazást jelenthetnek. |
| Készletek, elavulás, párhuzamos műveletek | Nem igazolt. A megvizsgált MiningPage saját lokális állapotot és saját olvasást használ; automatikus panelközi frissítést nem feltételezünk. |
| Chatfrissítés, küldés, szobák | Nem vizsgált; a Közösség a kétiframe-es kapu után következhet. |
| Memória és CPU | Nincs hiteles élő mérés. A diagnosztika közös Chromium-heap jelzése nem panelenkénti memória és nem CPU-mérés. Tartós teljesítményteszt szükséges. |

Az élő kapu **nem** válik sikeressé attól, hogy a helyi tesztek lefutottak vagy két iframe `load` eseményt küldött. A diagnosztikában `liveGameVerified: false` és `twoFrameGatePassed: false` marad; a fülfüggetlenség külön jelző.

## Kliens- és HTML-források

A projekt `Stonestorm.html` fájlja egy korábban mentett `/guild` oldal; nem tartalmazza a Közösség felsorolt paneljeit, ezért aktuális közösségi szelektorokat nem igazol. A benne hivatkozott `GameApp-DcYn7Zv3.js` és `friends-UoIo3vtU.js` a mostani publikus lekérésben 404-et adott.

A [MiningPage-DMAMF98u.js](https://stonestorm.gg/assets/MiningPage-DMAMF98u.js) nyilvánosan most is 200-as választ adott. SHA-256: `15f2c7fcafb3358fa5cf23d37c581cd506d1d64865463ee0df94fd497e59fcba`. Ebben a négy fül kulcsa `mine/smelt/craft/master`; az eredeti gomb `onClick` eseménye a helyi fülállapotot módosítja. A `GET /api/mining` olvasás a komponens inicializációjánál és a helyi műveletek után fut. A gyökér HTML Cloudflare-blokkolása miatt nem állítjuk, hogy ez a legfrissebb kiadási belépőponthoz tartozik; a futásidejű DOM-ellenőrzés ezért kötelező.

## Futtatás a bejelentkezett játékban

1. A meglévő Companion bővítményt töltsd újra a helyi `addons/stonestorm-statcap-overlay` mappából; frissítsd a Stonestorm lapját.
2. Nyisd meg az eredeti **Tárnák** oldalt (`https://stonestorm.gg/mining`).
3. **Companion → Játékfelületek → Multi-Instance · két iframe próba → Két iframe kipróbálása**.
4. Ha mindkét eredeti felület megjelenik, ellenőrizd a két dokumentumban a fókuszt, a külön fülállapotot, a mennyiségbevitelt és a külön görgetést. A kétpaneles próba alapból a teljes eredeti oldalakat mutatja; a négyes módra kért HUD-eltüntetés még nem része ennek a kapunak.
5. A **Diagnosztika letöltése** helyi JSON-t készít. Nem tartalmaz cookie-t, karakteradatot vagy mezőértéket, és nem küldi el sehova.
6. **Eredeti nézet / Bezárás** után a normál játékot használd tovább. Biztonsági tiltás vagy bejelentkezési probléma esetén nincs helyettesítő nézet és nincs megkerülés.

A készletfrissítést és a több kapcsolat viselkedését egy későbbi, külön engedélyezett élő művelettel kell megfigyelni. Ilyen műveletet ez a fejlesztés nem indított.

## Megismételhető ellenőrzések

- `npm run probe:addon:multi-instance:live`: külön, üres Chromium-profilban ellenőrzi az eredeti belépőoldalt. Eredmény: `multi-instance-live-probe.json`; jelenleg Cloudflare-blokkolás, nulla létrehozott játék-iframe.
- `npm run test:addon:multi-instance:browser`: natív MV3 + valódi React + megjelölt szintetikus DOM/CSP/munkamenet. Nem kapcsolódik éles játék-API-hoz. Eredmény: `multi-instance-verification.json`.
- Helyi diagnosztikai képek: `.integration/multi-instance/live-entry.png` és `synthetic-two-frame-test.png`. Az utóbbi tesztkép, nem a játék működésének bemutatása.

Az új próbát az addonkód és a csomag tételes fájllistája tartalmazza. A korábbi Enhanced UI, Community Hub és Multi-Panel viselkedését nem írtuk át.

## Lefutott ellenőrzések

- Kétiframe-es szintetikus MV3/React/CSP böngészős próba: **10/10**, nulla írási kérés, nulla JavaScript-hiba.
- Teljes `npm test`: **304/304**, továbbá capture-refresh és native-community forrásellenőrzés sikeres.
- Companion MV3/React böngészős regresszió: **22/22**.
- Tárnák/Portya MV3 böngészős regresszió: **24/24**, kizárólag szintetikus állapot, nulla játékművelet.
- `npm run check`: szintaxis, HTML/CSS-hivatkozások és képek ellenőrzése sikeres.
- Addon build és csomagkonzisztencia: sikeres; helyi ZIP **530087 bájt**, SHA-256 `3925cf5d268e2c64b8fc5726cf55befbc52b4e7631c7c2cfad70e807e1a9a33c`.
- Élő játék: **nem igazolt**, HTTP 403-as Cloudflare-belépő miatt. A helyi tesztek ezt nem írják felül.
