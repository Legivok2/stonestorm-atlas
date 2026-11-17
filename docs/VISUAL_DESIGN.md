# Stonestorm Atlas · vizuális megújulás

Helyi bemutató: **http://127.0.0.1:4173/#atlas/overview**. Újraindítás: `npm start`. Előtte–utána képgaléria, négy méretválasztóval: **http://127.0.0.1:4175/**. A munka nem indít GitHub-feltöltést vagy publikálást.

## Strukturális változások

- A korábbi különálló, magas marketingfejlécet kompakt, kereshető kódexnyitó váltja. A fejléc után már az első képernyőn elindul a katalógus. Kiemelt játékbeli kép, rendszerlinkek és valódi keresőmező kerültek a nyitópanelbe.
- A menü négy témacsoportot használ: Felfedezés; A karaktered; Közösség és otthon; Tervezés és tudás. Az aktív route jelölése és minden korábbi hivatkozás megmaradt. Mobilon külön nyitható, görgethető menü, háttérre kattintás, Escape és billentyűzetes fókuszkör működik.
- A kísérők portrés, ritkaságot és kiinduló állapotot jelző katalóguskártyát kapnak. A tárgyak külön tárgytalapzatot, szint-/tierjelölést és két legfontosabb alapértéket mutatnak. A világadatok képes kártyák, a céhes épületek külön illusztrációs és hatáspanelt használnak. A bónuszok nem a nyers fajegyütthatókból készülnek; az eddigi modell formázott eredményeit használjuk.
- Az adatlap asztalon széles, kétoszlopos enciklopédia. A nagy illusztráció mellett név, ritkaság/követelmények, fő értékek és a korábbi tervezőműveletek látszanak. Az öt fül: Áttekintés, Bónuszok, Fejlődés, Megszerzés, Kapcsolódó tartalmak. A fülek billentyűzettel is kezelhetők, a tartalom megmarad a DOM-ban, a formaváltás nem állítja vissza a kalkulátort.
- A kísérő formaválasztója ugyanazzal az eseménnyel frissíti a nagy portrét, a kis portrét és a Bónuszok fül összesítőjét. A képváltás az eddigi, hash-ellenőrzött `AtlasImages.pet()` kötéseket használja; nem módosítja a képazonosítás bizonyítékszintjét.
- Az Otthon külön illusztrált nyitópanelt, nyolc képes házfokkártyát, négy szobakártyát és képes, kereshető bútorkatalógust kapott. A teljes szabályleírás, ármegfigyelések és a 14 kutatás megmaradnak a rendezett részletekben.
- A Tiszta aréna és a Bandita Liga külön képi bevezetőt, belépési szintet és a saját szabályfejezetükhöz vezető gombot kapott. A hangulatillusztráció nem bizonyít új játékszabályt; az ismeretlen napi korlátok továbbra is ismeretlenek.
- Mobilon az addon letöltőgombja kompakt, hozzáférhető ikonként és frissítési jelzéssel jelenik meg. Az addon futásidejű kódja, verziója, számításai és kutatási exportja nem változik.

## CSS és komponensek

`css/atlas-theme.css` a közös dizájntokenek forrása: háttér, felületek, szöveg, arany, jade, vonalak, sugarak, térközök és tipográfia. A meglévő kalkulátorok régi változónevei ezek aliasai.

`css/atlas.css` új kompozíciót és komponensszabályokat tartalmaz. A régi általános kártya-, menü- és oldalsó fiókszabályokat eltávolítottuk; a közös táblázat-/űrlapsegédek megmaradnak. `css/atlas-tools.css` redundáns kártya- és menüfelülírásai kikerültek, így az új felületnek egy tulajdonosa van. Az új Otthon/Aréna komponensek a `css/home-arena.css` fájlban vannak, nem utólagos témarétegként.

`js/atlas-design.js` tisztán megjelenítési komponenseket ad a meglévő renderelőnek: csoportosított navigáció, kódexnyitó, típusfüggő kártya és füles adatlap. Nem tárol játékszabályt vagy személyes karakteradatot. A szabályok, számítások és az image-store az eddigi modulokban maradnak.

## Vizuális bizonyítékok

A helyi `.integration/visual-redesign/` mappában:

- `before/` és `after/`: hét képernyő (kezdőlap, Atlas-áttekintés, kísérők, Keselyűfióka adatlap, felszerelések, Otthon, Aréna), mindegyik 375×900, 768×1024, 1440×1000 és 1920×1080 méretben.
- `baseline/`: a megújulás előtti HTML/CSS/JS állományok másolata. A kiinduló képek ebből, azonos adatokkal és azonos méretben reprodukálhatók.
- `comparison.html`: a helyi előtte–utána bemutató.
- `functional-results.json`: a négy méreten futó böngészős elfogadási ellenőrzés eredménye.

A képek és helyi QA-kimenetek nem kerülnek a GitHub Pages csomagjába.

## Ellenőrzés

```powershell
npm test
npm run check
npm run test:dom
npm run test:sync
npm run build:pages
npm run test:pages
npm run test:design:browser
npm run test:pets:browser
npm run test:engine:browser
npm run test:home-arena:browser
npm run test:stats:browser
```

A valódi böngészős vizsgálatok a meglévő, ignorált Playwright-környezetet használják. A `test:design:browser` alapból a kész Pages-csomagot ellenőrzi a `/stonestorm-atlas/` alkönyvtárban; fejlesztői szerverhez megadható az `ATLAS_BROWSER_BASE_URL`.

A helyi build nem telepítés. A játékadatokhoz, az Auto-Sync szabályaihoz, az addon forrásához és a szettbónuszokhoz ez a fejlesztés nem nyúl. Az új staging képeket és a válogatás döntéseit nem másolja a működő Atlasba.

## Ellenőrzött eredmény

- `npm test`: **123/123 sikeres**, az addon forrásellenőrzése is sikeres.
- `npm run check`: sikeres.
- `npm run test:dom`: a katalógusok, 469 adatlap, keresés/szűrés/rendezés, kalkulátorok, összehasonlító, Planner és a megőrzött kalauz működik.
- `npm run test:sync`: **34/34 sikeres**.
- `npm run build:pages` és `npm run test:pages`: sikeres; **3779 kiszolgált fájl HTTP 200**, az alkönyvtáras linkek rendben.
- `npm run test:design:browser`: 375, 768, 1440 és 1920 pixelen sikeres; keresés, szűrés, öt forma, képfrissítés, adatlapfülek, billentyűzet és mobilmenü, Otthon/Aréna és a kalkulátoroldalak ellenőrizve.
- `test:pets:browser`, `test:engine:browser`, `test:home-arena:browser`, `test:stats:browser`, `test:sync:browser`: sikeres. A meglévő próbák a mobilnézetet 320/390 pixelen is lefedik.
- Az addon tényleges tooltip-próbájában az inaktív Keselyűfióka **Zsákmány +4%**, aktiválási kérés nélkül; az anonim export saját kísérőazonosítót nem tartalmaz.
- **28 előtte + 28 utána képernyőkép**, azonos méretekben, továbbá hat, feliratozott képpár. A 28 utána-képen nincs dokumentumszintű vízszintes túlcsordulás.

Az ismételt `change` eseményből származó szűrő-újrarajzolási hibát az azonos értékű esemény figyelmen kívül hagyása javítja. A böngészős tesztek a képernyő új elrendezését követik: szükség esetén megnyitják a mobilmenüt, a fejlődési útmutatót vagy az adatlap megfelelő fülét. A számításokkal kapcsolatos állítások és a szélsőérték-ellenőrzések megmaradnak.

Módosított megjelenítési fájlok: `index.html`; `css/style.css`, `css/atlas-theme.css`, `css/atlas.css`, `css/atlas-tools.css`, `css/home-arena.css`, `css/stat-addon.css`; `js/atlas.js`, `js/home-arena-ui.js`, `js/pet-ui.js`, valamint az új `js/atlas-design.js`. Emellett a böngészős tesztek, az npm tesztparancs, a dokumentáció és a forráscsomag dokumentumlistája frissült. A `js/image-store.js`, az `atlas-features.js`, az addon forrása, a játékadatok és az Auto-Sync workflow változatlan.
