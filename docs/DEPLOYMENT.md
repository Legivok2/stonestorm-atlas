# GitHub Pages publikálás

Teljes weboldal: **https://legivok2.github.io/stonestorm-atlas/**

Forrás: **https://github.com/Legivok2/stonestorm-atlas**

A link megnyitásához nincs szükség letöltésre, telepítésre vagy GitHub-fiókra. A webhely statikus HTML/CSS/vanilla JavaScript; nincs futásidejű backend, PHP vagy adatbázis. A `serve.mjs` csak helyi fejlesztésre szolgál. A relatív fájlhivatkozások és a hash-alapú Atlas-útvonalak működnek a `/stonestorm-atlas/` alkönyvtárban.

## A telepített változat

A `build:pages` változtatás nélkül másolja az eredeti `index.html`, CSS és JavaScript fájlokat, valamint az összes hivatkozott grafikát a `dist/` mappába. A kiadás tartalmazza a teljes Atlast, a 2103 képes képtárat, a felszerelés-/kinézet-összehasonlítót, a karaktertervezőt és az eredeti kalauzt. A korábbi, egyszerűsített kalauzbuild nem része az éles workflow-nak.

A `.github/workflows/pages.yml` minden main-push után:

1. megköveteli a teljes adatcsomagot és a közzétételi felhatalmazást;
2. elkészíti az addon jóváhagyott ZIP-jét, verzióadatát és helyi tartalékadatát;
3. ellenőrzi a szintaxist, adatokat, modelleket és hivatkozásokat;
4. lefuttatja a titok-/személyesadat-mintakeresőt;
5. felépíti a teljes `dist/` csomagot, és HTTP-n teszteli minden erőforrását, a ZIP méretét és SHA-256 lenyomatát is;
6. kizárólag a `dist/` tartalmát telepíti GitHub Pages-re.

Addonforrás: `addons/stonestorm-statcap-overlay/`. Állandó publikus letöltés: `downloads/stonestorm-statcap-overlay.zip`; verzióellenőrzés: `downloads/stat-addon.json`. A `.gitignore` és a publikációs fájllista egyetlen pontos ZIP-kivételt enged; az audit megköveteli, hogy a ZIP, a JSON és a generált `js/addon-release.js` egyezzen a jelenlegi, tételes addonforrással. Más ZIP továbbra sem publikálható. Új addonkiadás előtt `npm run build:addon`, majd a generált fájlok commitolása szükséges; részletek: [addon kiadási útmutató](../addons/stonestorm-statcap-overlay/PUBLISH.md).

Hiány esetén a workflow leáll; nem helyettesíti a teljes oldalt egy másik változattal. A GitHub repository **Settings → Pages → Source** beállítása `GitHub Actions` (`build_type: workflow`), HTTPS bekapcsolva.

## Közzétételi felhatalmazás és licencek

A projektgazda 2026. november 7-én kifejezetten feloldotta a korábbi engedélyellenőrzési feltételt, és kérte a teljes helyi változat publikálását az összes játékból származó képpel és feldolgozott adatcsomaggal együtt: „Igen, feloldom a feltételt; a teljes helyi változatot publikáld.”

Ez az `.publication/permissions.json` `publicationAuthorization` mezőjében szerepel, név szerint megadott hatókörökkel. A kiadói licencállapot ettől nem változik `confirmed` értékre: a Creator Kit korábbi igazolt állapota megmarad, a többi csoport licencállapota továbbra is `pending`. Az audit külön jelzi a tisztázatlan licenceket (`rightsPending`) és a közzétételt blokkoló, felhatalmazás nélküli csoportokat (`rightsBlocking`). Új, a megadott hatókörön kívüli anyagra nem vonatkozik ez az utasítás.

## Frissítés

A meglévő projektmappában:

```powershell
npm run check
npm test
npm run audit:publish
npm run build:pages
npm run test:pages
npm run stage:github
git diff --cached --stat
git commit -m "Atlas frissítés"
git push origin main
```

Adatforrás-változáskor előbb `npm run build:data` szükséges; ehhez helyben Python/Pillow is kellhet. Az éles workflow a már generált és verziózott adatokat használja, nincs szüksége npm-csomagtelepítésre, Pythonra vagy játékfiókra. A `stage:github` tételesen auditált fájllistát használ; a teljes munkamappában ne használd ellenőrizetlenül a `git add .` parancsot. A korábbi `stage:github:code` a teljes feltöltés után nem megfelelő frissítési parancs.

## Helyi ellenőrzés

`npm start` után a teljes fejlesztői oldal: **http://localhost:4173**.

```powershell
npm run build:pages:preview
npm run test:pages:preview
npm run preview:pages
```

Az alkönyvtáras helyi előnézet: **http://localhost:4174/stonestorm-atlas/**. A `.integration/pages-preview/` csak helyi ellenőrzésre szolgál. Az opcionális `npm run test:dom` a helyben telepített jsdom segítségével teszteli az interakciókat; ez nem valódi böngészős/vizuális teszt.

A localStorage originhez kötött: a localhoston mentett build nem jelenik meg automatikusan a GitHub Pages-címen. A karaktertervező megosztási hivatkozásával a konfiguráció átvihető.

## Kiszűrt állományok

A mentett `Stonestorm.html`, az eredeti játék-JS/CSS, ZIP/HAR, `.integration`, `.env`, credential-/kulcsfájlok és helyi környezeti mappák nem kerülnek fel. A forrás-repository tartalmazza a feldolgozott JSON-adatokat és saját build-/letöltőeszközöket; ezek nem kerülnek a Pages-artifactba.

A titokkereső GitHub/AWS/Google kulcsmintákat, JWT-t, privát kulcsot, beégetett credentialértékeket, URL-be írt hitelesítési adatot és személyes Windows home-útvonalakat keres. A helyi jelentés csak fájlt, sort és típust közöl, értékeket nem: `.publication/audit.json`. Ez mintákon alapuló ellenőrzés, nem teljes körű személyesadat-felismerési garancia.

Hivatalos háttér: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [Actions-workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [Pages-korlátok](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).
