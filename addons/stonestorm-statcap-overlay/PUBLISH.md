# Új addonkiadás az Atlasban

1. Az új addon ellenőrzött fájljait ebben a mappában frissítsd. A `manifest.json` verzióját emeld meg. A jelenlegi v0.9.3 importjához tartozó `import.json` eredetigazolást őrizd meg.
2. A projekt gyökerében futtasd: `npm run build:addon`, `npm run check`, `npm test`, `npm run build:pages`, `npm run test:pages`.
3. A `build:addon` determinisztikus ZIP-et készít, gyökérszintű manifesttel. Frissíti a `downloads/stat-addon.json` verzióját, fájlméretét és SHA-256 lenyomatát, valamint a `js/addon-release.js` helyi tartalékadatát. A futásidejű fájlok tételes listája a `scripts/addon-package.mjs` fájlban van; új bővítménykomponens esetén ezt is bővíteni és ellenőrizni kell.
4. Commitold az addon forrását, a ZIP-et, a két generált verzióadatot és a dokumentációt, majd pushold a meglévő `main` ágra. A GitHub Actions build ismét elkészíti és ellenőrzi a csomagot; kizárólag a jóváhagyott ZIP-et engedi át a Pages-csomagolás.
5. Várd meg a sikeres Pages-deployt, majd ellenőrizd a letöltést és az Atlas panelen megjelenő verziót. Böngészős QA: `npm run test:addon:browser`.

Állandó letöltési cím: `downloads/stonestorm-statcap-overlay.zip`. A panel verzió- és hash-paraméterrel nyitja meg, hogy az új kiadás külön gyorsítótár-bejegyzést kapjon. Korábbi kiadás a Git történetéből állítható vissza; a publikus ZIP mindig a jelenlegi kiadás.

Az Atlas oldalbetöltéskor, a panel megnyitásakor, visszatéréskor és látható lapon 15 percenként ellenőriz. Hálózati hibánál megőrzi a csomagolt, működő letöltést, és a panelben jelzi az ellenőrzés sikertelenségét. A ZIP-et a játékos manuálisan telepíti; nincs automatikus Chrome-frissítés vagy az addon számításaiba történő beavatkozás.
