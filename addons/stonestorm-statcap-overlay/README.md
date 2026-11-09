# Stonestorm Stat Cap Overlay – BÉTA

Jelenlegi átvett kiadás: **0.9.3**, készítő: **Patrik**. A manifest, a `capture.js`, a `content.js` és az ikonok az átadott bővítmény változatlan fájljai. Az eredeti hét futásidejű fájl SHA-256 lenyomata az `import.json` fájlban található. Az Atlas-integráció nem módosítja a statisztikai számításokat.

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
