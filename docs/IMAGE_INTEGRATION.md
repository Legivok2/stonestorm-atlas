# A teljes képadatbázis integrációja

Állapot: 2026-11-06. A négy kért fejlesztési lépés sorrendben készült: adatbázis-integráció, Képtár, felszerelés-/kinézet-összehasonlító, Character Planner. Egyetlen alkalmazás maradt az `index.html` belépési ponttal.

## A fájlvizsgálat eredménye

| Ellenőrzés | Eredmény |
| --- | ---: |
| Manifest kategórialistáinak összes bejegyzése | 2124 |
| Letöltött, Pillow-val ellenőrzött, érvényes WebP | 2103 |
| Hiányzó bejegyzés | 21 |
| Sérült / nem WebP helyi fájl | 0 |
| Tényleges képkategória | 26 |
| Különböző SHA-256 képtartalom | 2077 |
| Ismétlődő tartalmú fájlcsoport | 18 |
| Azonosított kép | 882 |
| Részben azonosított kép | 314 |
| Ismeretlen kapcsolatú kép | 907 |
| Elkészített, hash alapján közös kis előnézet | 1587 |

A `results.csv` 2035 `downloaded`, 68 `already_exists` és 21 `ValueError` sort tartalmaz. A hiányzó 21 elem a `video` kategória; a letöltő ezekből nem kapott érvényes WebP-t. Nem feltételezzük, hogy maguk a videók nem léteznek: kizárólag a helyi WebP-k hiányát állítjuk. Új hálózati letöltés nem történt.

Az eredeti fájlokat nem írtuk át, nem neveztük át és nem töröltük. Az ismétlődő fájlok megőrzött források; a futásidejű feloldás azonos tartalomhoz közös kanonikus útvonalat használ. A kártyák 320 × 240 px befoglaló méreten belüli WebP-előnézetei a `assets/catalog-thumbs/` alatt, forráshash szerinti névvel találhatók. A nagy nézet és az eredeti felbontás hivatkozása az eredeti képre mutat.

## Központi adatréteg

`scripts/build-images.py` a manifestből, CSV-ből, helyi képekből és az Atlas közös játékadataiból állítja elő:

- `data/image-catalog.json` és `js/image-data.js`: ugyanannak a katalógusnak JSON- és fetch nélküli JS-változata.
- `data/image-audit.json`: hiányok, sérült fájlok, duplikátumcsoportok és CSV-statisztikák.
- `assets/catalog-thumbs/`: megjelenítési méretre szánt származtatott előnézetek.

A `js/image-store.js` közös feloldót biztosít. A Wiki, a Képtár, az összehasonlító és a Planner ugyanazokat az `AtlasImages.get`, `related`, `forRecord`, `character` és `render` műveleteket használja. Nincs külön tárgyadatbázis a Plannerben.

Minden képrekordban szerepel a kategória/ID, eredeti fájlnév, kanonikus és eredeti útvonal, előnézet, méret, képméret, SHA-256, letöltési állapot, eredeti forrás-URL, felhasználási engedély állapota és a kapcsolódó játékrekordok bizonyítéka.

## Párosítások és bizonyosság

| Adatkör | Képpel társított rekord | Szabály |
| --- | ---: | --- |
| Tárgy | 182 / 182 | Elsődlegesen explicit `items[].art`; ennek hiányában pontos ID a megfelelő weapons/icons kategóriában. |
| Kísérő | 22 / 22 | Fajazonosító + grafikai utótag, **részben azonosított**. A sorszám fejlődési jelentése nincs bizonyítva. |
| Hátas | 8 / 8 | Pontos mount ID a mounts kategóriában. |
| Ellenfél | 64 / 64 | Pontos mob ID, beleértve a név nélküli toronyellenfeleket is. |
| Pálya | 6 / 6 | Pontos helyszín-ID vagy pályaazonosítós háttér/portál; a névből képzett jelenetkapcsolat részleges jelölést kap. |
| Karakter | Mind a 4 kaszt × 2 nem × 2 grafikai változat | A `portrait` / `portraitTier` mezők és a mentett kliens `MD`, `o1`, `i1` kiválasztási szabályai alapján. |

Fontos példa: `w_ninja_l10` követelményszintje **8**, a szettcsalád `w_ninja_set_m1` tárgyáé **11**. Utóbbi explicit `art` mezője az előbbi grafikára hivatkozik. A fájlnevükből nem következtetünk 10-es szintre, és nem keverjük össze a két tárgy statisztikáját. A külön set-m1 nevű alternatív grafika részleges kapcsolati státuszt kap, ha a forrás más elsődleges art hivatkozást ad.

A `family` mező **48 tárgynál** ténylegesen szerepel az eredeti forrásban. A korábbi változat általános szetttagsági hiányjelölését kijavítottuk. A 6 családban kasztonként fegyver- és páncélsablon ismert; a szett sisak-/ékszersablonjai hiányoznak. Az ikonfájl megléte nem hoz létre ilyen tárgyat statisztikákkal.

Statikus kliensszöveg alapján ellenőrzött szabályok kivonata és a forrásfájl hash-e: `data/client-rule-evidence.json`. A mentett játék-HTML-t vagy JS-t az alkalmazás nem futtatja és nem szolgálja ki.

## Képtár

Útvonal: `#atlas/gallery`.

- Valós adatokból számolt statisztikák, 26 kategória.
- Gépelésre frissülő, ékezetfüggetlen név-/ID-/kategória-/kapcsolt magyar névkeresés.
- Kategória, azonosítási státusz és név/kategória/fájlnév szerinti rendezés.
- 24 kép/oldal, lazy loading, kis előnézetek; nem jön létre 2103 képelemből álló DOM.
- Az ismeretlen képek önállóan szűrhetők.
- Képnézet: nagy kép, fájlnév, útvonal, kategória, méret, hash, bizonyosság és Wiki-kapcsolatok; eredeti kép külön megnyitható.
- A nem létező fájlok nincsenek a megjeleníthető katalógusban; későbbi képbetöltési hibánál olvasható helyettesítő jelenik meg.
- Példa közvetlen képcím: `#atlas/gallery/image/weapons%2Fw_ninja_l50`.
- Kategóriába ugrás: `#atlas/gallery?category=furniture`.

## Felszerelés- és kinézet-összehasonlító

Útvonal: `#atlas/compare`.

- Harcos, Nindzsa, Sámán, Mágus (Warrior, Ninja, Shaman, Mage Blade); férfi/női és eredeti/második grafika.
- Fegyver, páncél/szett és teljes karakterkép nézet.
- Valódi követelményszint, kaszt, tier és `family` szűrés; a tier nem kap kitalált ritkasági nevet.
- Egyszerre két kép nagy nézete, igazolt tárgyhoz kapcsolható alapértékek összevetése és B−A eltérések.
- A karaktergrafikák teljes alakos képek, a portraits kategória pedig eleve képkivágásokat tartalmaz. Nem készült mesterséges fegyver-/páncélrétegezés. A képek `object-fit: contain` megjelenítésűek.
- Adatlapról indítás: `#atlas/compare?item=w_ninja_l50`.

A teljes Character Planner részleteit a `docs/CHARACTER_PLANNER.md` írja le.

## Jogosultság és QA

A 2103 katalóguskép nyilvános újraközlési engedélye **nem igazolt**, a rekordokban `unverified-public-reuse` szerepel. Ez független a korábbi Creator Kit engedélyétől. Most kizárólag helyi fejlesztés történt, nincs nyilvános publikálás.

A fájlok Pillow-ellenőrzése, Node-adat-/számítási tesztek, jsdom-interakciós regresszió és HTTP-erőforráspróbák sikeresek. A munkamenetben a browser access host és a natív Computer Use kapcsolat nem elérhető: **valódi asztali/mobilos böngészős, vizuális és natív fókuszteszt még hátravan**. A reszponzív szabályokat megírtuk, de a jsdom nem végez tényleges tördelést vagy képernyőképes ellenőrzést.
