# Stonestorm – képkatalógus és letöltő

A `manifest.json` a játék nyilvánosan betöltött `art-manifest` JavaScript-fájljából kinyert képfájlnevek kategóriánkénti listája. **Ez nem bizonyítja, hogy minden fájl még létezik vagy nyilvánosan letölthető.**

## Windows / VS Code

1. Csomagold ki a ZIP-et, majd nyisd meg a mappát a VS Code-ban.
2. Legyen telepítve Python 3 (`py --version`).
3. Terminálban: `py download_images.py --category weapons`
4. A képek a `downloaded/weapons/` mappába kerülnek.
5. Ha bevált, `py download_images.py --category icons`, majd `--category pets` stb.
6. A teljes nyilvános katalógushoz: `py download_images.py --all` (több ezer kérés, ezért sokáig tarthat).

A script figyel a szerverre: egymás után, késleltetéssel kér le fájlokat, és megáll, ha tiltásra/korlátozásra utaló 403 vagy 429 választ kap. Nem próbál bejelentkezni, védett tartalmat megkerülni vagy azonosítókat kitalálni. A `results.csv` fájlban jelzi az eredményeket.

A képek szerzői joga a jogosultakat illeti; nyilvános Atlasban történő felhasználásukhoz tisztázd az engedélyt.
