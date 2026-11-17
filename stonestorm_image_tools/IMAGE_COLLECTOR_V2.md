# Atlas Image Manager · Image Collector V2

Helyi képfelderítés és vizuális párosítás. A gyűjtés, jóváhagyás és importcsomag-készítés sem módosítja az aktív Atlas fájljait. Nem indít Git-műveletet.

## Indítás

Node.js 20+ (helyben Node.js 22-vel ellenőrizve), Python 3 és Pillow szükséges. A JavaScript-függőségekhez `npm ci`, a képellenőrzőhöz szükség esetén `python -m pip install Pillow`. Eltérő Python-parancs az `ATLAS_IMAGE_PYTHON` környezeti változóval választható.

```powershell
npm run images:manager
```

Megnyitás: **http://127.0.0.1:4174/**. A szerver kizárólag a helyi gépen figyel. Leállítás a terminálban: Ctrl+C. Másik helyi port: `npm run images:manager -- --port 4175`.

## Képek kiválasztása

1. Szűrj kategóriára, névre vagy döntési állapotra. A lista oldalanként 24 képet mutat.
2. Kattints a képre: jobb oldalt nagy, aránytartó eredeti előnézet, felbontás, SHA-256 és forrás jelenik meg. Mobilon a részletek a lista alatt nyílnak meg.
3. Válassz célkategóriát, majd keress konkrét Atlas-rekordot. A javaslat csak kitölti a választást; nem hagyja jóvá a képet. A képszerep lehet elsődleges vagy további galériakép. Ha a rekordhoz már van elsődleges kép, a felület jelzi, és az új képnél galériaszerepet ajánl fel: így egy témához, bútorhoz vagy szobához több változat is elfogadható.
4. Kísérőnél válassz fejlődési formát is (1–5). A forma sorszáma külön adat; a fájlnévi sorszámot nem tekintjük automatikusan formának vagy fejlesztési szintnek.
5. **Jóváhagyom**, **Később**, **Nem megfelelő**. A döntések azonnal helyben mentődnek. A jóváhagyás nem jelent felhasználási engedélyt.
6. **Mapping JSON mentése**: hordozható mentés az összes meghozott döntésről. A **Mapping visszatöltése** ellenőrzi a kiinduló katalógust, kép-URL-t, SHA-t, célrekordot és formát; eltérő képre nem alkalmaz döntést.

**Ha még nem tudod, hová tartozik:** válaszd a **Képtárba – hozzárendelés később** gombot, majd kattints a **Jóváhagyom** gombra. Javaslat nélküli képnél ez az alapértelmezett cél. Ez csak a kép vizuális elfogadása a képtárban; nem állít bizonyított tárgy-, szoba- vagy kísérőkapcsolatot. A képtári kép kizárólag galériaszerepet kaphat, nem cserél le elsődleges képet, és később módosítható a célja. A jogosultsági ellenőrzés itt is külön feltétel marad.

A jogosultságot külön, lenyitható mező kezeli. Alapállapot: nem igazolt. Csak tényleges licenc vagy jogosulti engedély forrását add meg; a nyilvános letölthetőség és a vizuális párosítás önmagukban nem engedélyek. A korábbi publikálási utasítás nem igazolja az új képek licencét.

## Felderítés és letöltés

```powershell
npm run images:discover
npm run images:download-new -- --limit 40
npm run images:report
```

A felület ugyanezeket a gyűjtési és mentési állapotokat használja. Egy időben csak egy felderítés/letöltés futhat. A letöltés alapból soros, képenként legalább 600 ms szünettel, 40 fájlos adagban; a parancs legfeljebb 200 fájlt enged egy adagban. A maximális kép 12 MiB / 40 millió pixel. A Pillow a valódi formátumot és dekódolhatóságot is ellenőrzi; nincs SVG-letöltés vagy távoli kódfuttatás.

A felderítés a nyilvános kezdőlap aktuális hash-elt belépőmodulját, majd annak statikus importjait követi. Kérésenkénti idő- és méretkorlát, legfeljebb 18 forráskérés van. A manifest felbontásváltozatai egy alapgrafikához tartozó metaadatként jelennek meg, nem több száz újabb, ismételten letöltendő kártyaként.

403/429 esetén nincs hitelesítés, proxy, címváltoztatás vagy automatikus hozzáférés-megkerülés. 429 leállítja a felderítést; képletöltésnél mindkét kód leállítja a sort és naplózott blokkolást állít be. A 429 várakozást tiszteletben tartja, a 403 letöltési blokkolás nem oldódik fel magától. Sikertelen sorok nem kerülnek automatikusan újrapróbálásra. Kezdőlap-403 mellett kizárólag korábban nyilvánosan hivatkozott, külön hozzáférhető modulok ellenőrizhetők, a lista frissességének jól látható korlátozásával.

**Változásfelismerés:** új URL, verziózott URL vagy az importált listában megadott eltérő SHA-256 jelöl változást. A régi, változatlan URL mögötti észrevétlen tartalomcserét a rendszer nem tudja bizonyítani a régi fájl újbóli letöltése nélkül. Ezért nem állítja, hogy a teljes korábbi állomány biztosan változatlan. Régi képeket nem kér le pusztán ellenőrzés céljából. Letöltés után a SHA alapján a már meglévő vagy újonnan gyűjtött azonos bájtokat nem tárolja még egyszer.

### Böngészős lista, ha a publikus manifest nem érhető el

A **Források, korlátozások és böngészős export** részben másolható vagy letölthető a `browser-export.js`. A játék lapjának fejlesztői konzoljában, saját indítással futtasd, miután meglátogattad a kívánt felületeket. Kizárólag a már betöltött, engedélyezett statikus Stonestorm-képcímeket exportálja; nem kér le új adatot, nem olvas sütit, tokent, helyi tárat vagy karakterállapotot. Nem teljes játékadat-export.

A JSON beolvasható a **Képlinklista importálása** gombbal vagy:

```powershell
npm run images:discover -- --from "D:/exports/atlas-image-references.json"
npm run images:download-new
```

Elfogadott alakok: URL-tömb, `{ "urls": [...] }`, illetve `{ "images": [{ "url": "https://stonestorm.gg/art/icons/example.webp", "sha256": "opcionális 64 hex karakter" }] }`. Csak azonos eredetű HTTPS rasterképek fogadhatók el, hitelesítőadat és ismeretlen query-paraméter nélkül. Ne exportálj HAR-t vagy hálózati fejléceket.

A kísérők logikai `pet_*` kulcsából nem találunk ki fájlcímet. A jelenlegi `petArt` hozzárendeléshez vagy ténylegesen betöltött portré-URL-hez külön bizonyíték kell. A meglévő kísérőforma-összerendelések és hash-ek változatlanok maradnak.

## Helyi állományok és későbbi import

Minden gyűjtési eredmény a Gitből kizárt `stonestorm_image_tools/staging/` mappában van:

- `state.json`: verziózott képrekordok és döntések; `report.json`: az utolsó művelet és a döntések összesítője.
- `files/<kulcs>/<eredeti-fájlnév>`: eredeti bájtok; `thumbs/<sha>.webp`: kizárólag előnézet.
- `sources/`, `discovery-*.json`: forrásbizonyítékok és felderítési futások.
- `events.jsonl`: hozzáfűzött eseménynapló. A régi `results.csv` nem módosul.

A mapping letöltése külön biztonsági mentésként ajánlott; a staging mappát ne töröld a kiválasztások után.

```powershell
npm run images:import-approved
```

Ez csak a dokumentált jogosultságú és jóváhagyott képekből készít **helyi előkészítést** a `staging/prepared/` alatt: képfájlok, bővített `data/image-catalog.json`, `data/image-mappings.json`, `js/image-data.js` és a meglévő `image-store.js`-hoz illeszkedő adapter. A régi katalógusbejegyzések, bájtok és hash-ek megmaradnak, a kísérőformák külön kezeltek. A kézi párosítás státusza nem lesz hamisan `verified`. Az előkészítés sem másol semmit az aktív Atlasba, és nem publikál. Az éles import külön felülvizsgálatot és engedélyezett fejlesztési lépést igényel.

Az előkészítés megőrzi a korábbi, más rekordokhoz tartozó jóváhagyott mappingokat is. Visszavont jogosultság vagy döntés után az újra előkészített csomagból eltávolítja a saját, már nem szükséges képmásolatait, az eredeti gyűjtést és naplót megtartja. Az `import-preview.json` csak sikeresen befejezett előkészítés után kap `ready: true` állapotot.

A staging Git-ignore mellett a publikációs fájllista is kifejezetten tiltja a gyűjtési mappa becsomagolását. Csak a gyűjtő forrása vehető majd fel a repositoryba.

## Ellenőrzés

```powershell
npm run test:images
npm run test:images:browser
npm test
npm run check
```

A böngészős teszthez a projekt meglévő helyi Playwright-környezete szükséges: `.integration/browser-qa/node_modules/playwright` és `.integration/browser-qa/browsers`. A tesztek elkülönített ideiglenes fixture-ökön dolgoznak, nem a felhasználó valódi képdöntésein. Asztali, 390 és 320 pixel széles mobilnézetben ellenőrzik a célkeresést, formaválasztást, döntéseket, mapping letöltés/importot és a jogosultsági kaput.

Az aktuális futás összesítője: `staging/report.json`; a helyi, olvasható induló jelentés: `staging/report.md`.
