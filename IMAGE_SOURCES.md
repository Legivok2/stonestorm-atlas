# Stonestorm – beépített képek és engedélyezési nyilvántartás

Creator Kit-nyilvántartás: **2026. október 31.** Atlas-integrációs kiegészítés: **2026. november 6.**

Az alábbi eredeti engedély a korábbi `assets/images/` Creator Kit-képekre vonatkozik. Az új Atlas ezen felül **20** azonosított képet használ a `Stonestorm_files/` mappából, eredeti fájlnévvel. Ezek eredete, SHA-256 lenyomata és **nem igazolt nyilvános újraközlési engedélye** a `data/image-manifest.json` és a `DATA_SOURCES.md` fájlban szerepel. A korábbi engedélyt nem terjesztettük ki automatikusan az új képekre. A ZIP 48 WebP-je mind azonos a helyi mentés megfelelő képével; a kézikönyvben említett 47 darabos szám pontatlan. Az alábbi kihagyási leírás a korábbi, 2026. októberi verzió történeti állapota.

## Engedély és forrás

A teljes katalógusintegráció után a Wiki a `stonestorm_image_tools/downloaded/` **2103** érvényes képét is kezeli (26 kategória, 2077 külön képtartalom). Új központi jegyzék: `data/image-catalog.json`; audit: `data/image-audit.json`; szabályok: `docs/IMAGE_INTEGRATION.md`. Mindegyik új rekordhoz `unverified-public-reuse` engedélyállapot tartozik. A 1587 kis előnézet származtatott optimalizálás, a fájlnév a forráshashből készül. Az eredeti fájlok nem változtak.

A projekt gazdája az `SS` mappát adta át a weboldal képeinek forrásaként. Külön rákérdezésre megerősítette a képek nyilvános GitHub Pages rajongói oldalon történő használatához és méretoptimalizálásához szükséges engedély meglétét:

> Igen, rendelkezem a szükséges engedéllyel

Ez a nyilvántartás a projekt gazdájának megerősítését rögzíti; nem állít önállóan ellenőrzött szabad licencet. A nyilvános letölthetőséget önmagában nem tekintettük engedélynek. Az SS mappában nem volt külön licencdokumentum. Az engedélyezés a felhasználó által átadott csomagra vonatkozik.

Hivatalos forrásoldal: [Stonestorm Creator Kit / Press](https://stonestorm.gg/press). Az átadott tíz JPG SHA-256 lenyomata megegyezik a korábbi kutatás során a hivatalos képcsomagból letöltött fájlokéval. A képcsomag hivatalos címe: [stonestorm-images.zip](https://stonestorm.gg/creator-kit/media/stonestorm-images.zip).

## Beépített állományok

- Tíz promóciós kép, mindegyikből 640, 1280 és 1920 px széles helyi WebP.
- A színes vízszintes logó és a kőikon optimalizált WebP-változata. Az átadott további öt logóváltozatot nem használjuk.
- Összesen 32 WebP-fájl az `assets/images/` mappában, körülbelül 4,4 MiB összmérettel. A változatok nem töltődnek le egyszerre.
- A képfájlonkénti eredeti SHA-256, hivatalos forráscím, méret és generált változat a [sources.json](assets/images/sources.json) jegyzékben található.

| Forrásfájl az SS mappában                               | Helyi fájl(ok)                                                                             | Felhasználás                                                    | Hivatalos forrás                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `stonestorm-images/01_key-art.jpg`                      | `key-art-640.webp`, `key-art-1280.webp`, `key-art-1920.webp`                               | Hero, sötétített reszponzív háttér                              | [Creator Kit fájl](https://stonestorm.gg/creator-kit/media/images/01_key-art.jpg)                      |
| `stonestorm-images/02_village.jpg`                      | `village-640.webp`, `village-1280.webp`, `village-1920.webp`                               | Első lépések, falusi NPC-k és fiók kézikönyvcikkei              | [Creator Kit fájl](https://stonestorm.gg/creator-kit/media/images/02_village.jpg)                      |
| `stonestorm-images/03_paper-doll-warrior.jpg`           | `character-warrior-640.webp`, `character-warrior-1280.webp`, `character-warrior-1920.webp` | Karakterlap-bemutató; gear, stats és skills cikkek              | [Creator Kit fájl](https://stonestorm.gg/creator-kit/media/images/03_paper-doll-warrior.jpg)           |
| `stonestorm-images/04_boss-flamebeard.jpg`              | `boss-flamebeard-640.webp`, `boss-flamebeard-1280.webp`, `boss-flamebeard-1920.webp`       | Flamebeard harci bemutató, bosskalauz                           | [Creator Kit fájl](https://stonestorm.gg/creator-kit/media/images/04_boss-flamebeard.jpg)              |
| `stonestorm-images/05_stone-rain.jpg`                   | `stone-rain-640.webp`, `stone-rain-1280.webp`, `stone-rain-1920.webp`                      | Képgaléria, feloldásokról szóló cikk                            | [Creator Kit fájl](https://stonestorm.gg/creator-kit/media/images/05_stone-rain.jpg)                   |
| `stonestorm-images/06_stormcatcher-tower.jpg`           | `stormcatcher-640.webp`, `stormcatcher-1280.webp`, `stormcatcher-1920.webp`                | Képgaléria és tower cikk                                        | [Creator Kit fájl](https://stonestorm.gg/creator-kit/media/images/06_stormcatcher-tower.jpg)           |
| `stonestorm-images/07_fishing.jpg`                      | `fishing-640.webp`, `fishing-1280.webp`, `fishing-1920.webp`                               | Képgaléria és energia nélküli tevékenységek cikke               | [Creator Kit fájl](https://stonestorm.gg/creator-kit/media/images/07_fishing.jpg)                      |
| `stonestorm-images/08_kingdom-war.jpg`                  | `kingdom-war-640.webp`, `kingdom-war-1280.webp`, `kingdom-war-1920.webp`                   | Promóciós előnézet a galériában, pvp és kingdoms cikkek         | [Creator Kit fájl](https://stonestorm.gg/creator-kit/media/images/08_kingdom-war.jpg)                  |
| `stonestorm-images/09_rune-row.jpg`                     | `rune-row-640.webp`, `rune-row-1280.webp`, `rune-row-1920.webp`                            | Képgaléria                                                      | [Creator Kit fájl](https://stonestorm.gg/creator-kit/media/images/09_rune-row.jpg)                     |
| `stonestorm-images/10_fair-wheel.jpg`                   | `fair-wheel-640.webp`, `fair-wheel-1280.webp`, `fair-wheel-1920.webp`                      | Napi rutin, galéria, napi feladatok és falusi rendszerek cikkei | [Creator Kit fájl](https://stonestorm.gg/creator-kit/media/images/10_fair-wheel.jpg)                   |
| `stonestorm-logos/stonestorm-logo-horizontal-color.png` | `logo-horizontal.webp`                                                                     | Fejléc és lábléc, magyar rajongói jelöléssel                    | [Creator Kit fájl](https://stonestorm.gg/creator-kit/media/logos/stonestorm-logo-horizontal-color.png) |
| `stonestorm-logos/stonestorm-icon-stone-color.png`      | `icon-stone.webp`                                                                          | Favicon                                                         | [Creator Kit fájl](https://stonestorm.gg/creator-kit/media/logos/stonestorm-icon-stone-color.png)      |

## Megjelenítés és forrásmegjelölés

A forrásdoboz és a galéria megnevezi a Stonestorm hivatalos Creator Kitjét. Az oldal egyértelműen jelzi, hogy nem hivatalos, rajongók által készített magyar útmutató. A képek és a logó jogosultja nem változott.

Nincs külső képhotlink, más játékból származó kép vagy generált, hivatalosnak tűnő grafika. A feldolgozás átméretezésből és WebP-konverzióból állt; a reszponzív hero képkivágását és sötétítését CSS kezeli. Az eredeti képtartalomhoz nem rajzoltunk hozzá és nem generáltunk új karaktert.

A hero prioritással töltődik, a többi kép lazy loadinggal. A `srcset`, `sizes`, szélesség/magasság, magyar alt szöveg és a dekoratív hero üres alt attribútuma segíti a gyors és akadálymentes használatot. A nagyítónézet Escape-pel, gombbal és háttérkattintással zárható; a billentyűzetfókusz a képnézőben marad és bezáráskor visszatér. A teljes méret külön lapon is megnyitható, ahol a mobil böngésző képnézője használható.

## Tudatosan kihagyott képjelöltek

A korábbi kutatás 17 további, különálló játékbeli grafikát is talált. Ezek nem voltak az átadott SS csomagban, ezért nem kerültek a weboldalba. A megerősített engedélyt nem terjesztettük ki automatikusan rájuk.

Az átadott csomagban nincs külön Warrior/Ninja/Mage/Shaman portrésorozat, királyságzászló, Old Stripes-/Goldtooth-portré, önálló tárgyikon, Forays-/dungeon-/Upgrade-képernyőkép, companion- vagy mount-grafika. A kasztoknál ezért a korábbi ikonok maradtak; a Character-bemutató egyértelműen Warrior képernyőképként szerepel. A Flamebeard-képet saját nevén mutatjuk be, nem az első boss illusztrációjaként.

A Kingdom War kép promóciós előnézetként, a dokumentum szerinti 2026. november 9-i indulás jelölésével jelenik meg. A képeken látható példaszintet, CP-t, tárgyakat vagy bónuszokat nem kezeljük általános követelményként és nem vezetünk le belőlük új játékmechanikát.
