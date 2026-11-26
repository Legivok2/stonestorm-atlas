# Future Content Watcher V1

A figyelő önálló, verziózott nyilvánosforrás-leltárt vezet. A futás nem hajtja végre a letöltött klienskódot, nem találgat végpontokat, és nem kerüli meg a hozzáférési korlátokat. Az API, a magyar/angol literális lokalizáció, a kliensmodulok és az explicit grafikai hivatkozások külön bizonyítékok.

## Helyi futtatás

- `npm run watch:future`: élő API és ismert nyilvános kliensforrások ellenőrzése.
- `node scripts/future-content-sync.mjs --content-only`: csak az API vizsgálata.
- `npm run test:future`: regressziós és integrációs tesztek.
- `npm run test:future:browser`: valódi böngészős ellenőrzés.
- `npm start`: helyi előnézet, `http://localhost:4173/#atlas/upcoming`.

A teljes gépi leltár: `data/future-content.json`. A játékosoknak szóló jelentés: `reports/future-content.md`; részletes adatai: `reports/future-content.json`.

## Bizonyítottság

- **Előkészített:** nyilvános konfiguráció vagy kliensadat. Nem jelent ígéretet vagy igazolt aktiválást.
- **Hivatalosan bejelentett:** dátumozott hivatalos közlemény. Az elérhetőség ettől külön tény.
- **Aktív:** külön, ellenőrzött játékmegfigyelés támasztja alá. Egy `true` kapcsoló önmagában nem elegendő.
- **Bizonytalan:** például referenciatábla, ismeretlen adatág vagy új modul, amelynek szerepe nem igazolt.
- **Eltávolított:** egy teljesen, sikeresen ellenőrzött saját forráság már nem tartalmazza. HTTP-hiba, hiányos válasz és csonka kliensgráf nem töröl megfigyelést.

A korábbi figyelő 1-es sémája az „aktív” szót konfigurációs jelenlétre is használta. A 2-es adatbázisséma ezt átminősíti, megőrzi az első észlelést és a korábbi hash-történetet, és nem küld emiatt új tartalomértesítést.

Egy magasabb szintű kazamataellenfél nem bizonyít játékosszint-emelést. A panel külön mutatja a közvetlen `limits.maxLevel` értéket, a felszerelések legmagasabb szintjét és az XP-tábla elemszámát. Az indexek szinthez rendeléséhez nem találunk ki képletet.

## Elemzők és történet

A modulok figyelik a fejlődést, feloldásokat, pályákat/helyszíneket, ellenfeleket, felszereléseket/szetteket/tiereket, kazamatakulcsokat/termeket/fokozatokat, kasztokat/képességeket, kovácsolást, játékmódokat, eseményeket és az új, eddig ismeretlen adatágakat.

Minden megfigyelés stabil kategória+azonosító kulcsot kap. A változások külön, monoton revíziójú események, régi/új értékkel, státusszal, időponttal, verzióval és pontos forrással. Az A→B→A változás új esemény; egy változatlan következő futás nem az. A korábbi események megmaradnak.

A változatlan fordítások, grafikai kulcsok és kliensmodulok veszteségmentesen tömörített alapleltárban maradnak a gépi napló `baselineArchive` mezőjében. Ez gzip + base64 JSON, SHA-256 ellenőrzéssel és bejegyzésszámmal. A `scripts/future-content-watcher.mjs` exportált `unpackWatcher(state)` függvénye visszaadja a teljes leltárt. A böngésző csak a részletes alapadatokat és a tartalomjelzéseket tölti be; nem bont ki több tízezer változatlan fordítást.

Egy újonnan elérhető lokalizációs modul első leltára nem új játéktartalom. A figyelő modulonként és nyelvenként hoz létre kiinduló leltárt; az azon belüli későbbi változásokat követi. A részleges hivatkozásgráf miatt később elért segédmodul sem kap automatikusan új tartalomriasztást. A statikus kliensvizsgálat futásonként legfeljebb 48 hálózati kérést és 12 MiB letöltést használ; a hivatkozott, hash-elt fájlok ellenőrzött helyi elemzése újrahasznosul.

A „bekapcsolt” kapcsoló és az „aktív játéktartalom” elkülönül. Játékmegfigyelés csak ellenőrzött bizonyítékból adható, a rendszer automatikusan nem emel konfigurációt aktív státuszra.

## Image Collector V2

A `data/future-image-references.json` kizárólag nyilvános képhivatkozásokat és forrásbizonyítékokat ad át a Collectornak. A meglévő katalógus pontos URL- és azonosított relációegyezései szolgáltatnak helyi előnézetet. A figyelő nem hagy jóvá képpárosítást és nem importál automatikusan új képfájlt. A Collector letöltési, ellenőrzési és mapping szabályai megmaradnak.

## GitHub Actions és publikálás

A hatórás workflow önálló figyelőfázist használ, saját `snapshots/future/` forráspillanatképpel. Így egy jövőbeli, még nem támogatott Data Engine-séma nem akadályozza a tartalom észlelését, és a figyelő nem írja felül az Atlas jóváhagyott adatbázisát.

Csak érdemi, megjelenített tartalomváltozás kér Pages-buildet. A puszta ellenőrzési időpont és egy változatlan, újra lekért API nem indít új buildet. A felület a friss ellenőrzési adatokat külön is le tudja kérni. Hibás válasznál a teljes korábbi figyelőállapot megmarad.

A helyi feladat nem publikál. Az új workflow csak az ellenőrzött változások repositoryba történő egyesítése után fut a GitHubon, a számítógép bekapcsolt állapotától függetlenül.

## Discord

Az opcionális secret neve `ATLAS_FUTURE_DISCORD_WEBHOOK`; értéke csak a kézbesítési lépés környezetében szerepel. Hiányzó secret esetén nincs hiba és nincs kérés. A nyilvántartás a `data/future-notifications.json` fájlban eseményazonosítókat őriz, webhookot nem.

Új szintplafon, fontos új entitás, XP-bővülés, kapcsolóaktiválás és igazolt státuszváltás lehet értesítendő. Pusztán új kép, segédmodul vagy átnevezett fordítás nem küld fontos tartalomriasztást. Sikeres küldés után az esemény kézbesített lesz; HTTP-hibánál függőben marad. Az első leltár és a sémamigráció nem küld tömeges értesítést.

A szokásos ismételt futások deduplikáltak. Egy külső webhook elfogadása és a helyi kézbesítési nyilvántartás mentése közötti folyamatleállásnál a szolgáltató idempotencia-támogatása nélkül nem ígérhető matematikai egyszeri kézbesítés.

Egy üzenet legfeljebb nyolc, a Discord méretkorlátján belül elférő eseményt tartalmaz. Csak a valóban beleírt és sikeresen elküldött események lesznek kézbesítettnek jelölve; a fennmaradó sor a következő futásra megmarad.
