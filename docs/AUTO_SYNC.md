# Atlas Auto-Sync V1

Az Auto-Sync a meglévő Atlas adatgenerátorát egészíti ki. Nem használ játékosfiókot, cookie-t, jelszót vagy API-kulcsot. A böngésző és a helyi számítógép kikapcsolt állapotában a GitHub Actions végzi az ellenőrzést.

## Használat

Node.js 20 vagy újabb szükséges. A buildfüggőséget `npm ci` telepíti: az Acorn csak a nyilvános kliens szintaktikus feldolgozására szolgál, játékbeli JavaScriptet nem futtatunk.

```powershell
npm run sync:check    # valódi nyilvános lekérés, snapshot és jelentés; Atlas-adatot nem importál
npm run sync:apply    # ismert rekordok importja, build-data és teljes npm test; hiba esetén visszaállítás
npm run test:sync
npm run build:data
npm test
npm run build:pages
npm run test:pages
```

A `sync:check` tehát az Atlasra nézve csak olvasási művelet, de a helyi snapshotot, jelentést és ellenőrzési állapotot elmenti. A hálózat hibáját a `reports/failed-sync.json` jelzi; a korábbi érvényes snapshotot és adatbázist nem módosítja.

## Források és tárolás

- Elsődleges konfiguráció: <https://stonestorm.gg/api/content>, teljes JSON és SHA-256 a `snapshots/current/content.json` / `snapshots/manifest.json` fájlokban.
- Nyilvános kezdőlap és az onnan elérhető JS-, JSON-, manifest-, CSS-források: URL, hash, ETag, hivatkozásjegyzék. A magyar modulok, grafikai manifestek előnyt kapnak. A klienskódot soha nem futtatjuk vagy importáljuk Node-ba.
- Kérésenként 30 másodperc, fájlonként 4 MiB, kliensfeltérképezésenként legfeljebb 48 hálózati kérés / 12 MiB. A be nem járt források számát a jelentés közli; a következő futás a hash-elt JS-ek gyorsítótárával tovább haladhat. A költségkeret nem jelent teljes kliensauditot.
- A bundler `assets/*.json` fejlesztői hivatkozásait nem tekintjük önmagukban létező végpontnak; a tényleges, hash-elt fordítási modulokat vizsgáljuk. Képeknél hivatkozásjegyzék készül, nem automatikus bináris letöltés vagy újraközlés. Új grafika kapcsolata kézi ellenőrzést igényel.
- ETag / Last-Modified / 304; változatlan hash-elt JS URL esetén a korábbi hash és hivatkozások újrahasználhatók. A teljes kliens nincs minden futáskor letöltve.
- Gitben egy aktuális API-snapshot, egy manifest és ellenőrzési napló van. A `snapshots/history/` és `reports/history/` Gitből kizárt; Actions-artifactként 14 napig maradnak meg. **Nyitott tételt a darabszáma vagy a változatlan API miatt nem vágunk le.** A lezárt események és bizonyítékaik a jelentés `reviewLedger` mezőjében megmaradnak. A Git saját korábbi commitjai is megmaradnak.
- `reports/initial-sync.*`: az első, részleges történeti alaphoz mért valódi összevetés. A nem mentett régi ágakat **első megfigyelésként**, nem bizonyított új játékfunkcióként jelöli.
- `reports/latest-sync.*`: legutóbbi összevetés, teljes előtte/utána értékek, elfogadott rekordok, függő ellenőrzések, hálózati figyelmeztetések. Az ismeretlen változások nem tűnnek el a következő változatlan ellenőrzéskor.

## Automatikusan importálható és védett adatok

| Adatkör | V1 működés |
| --- | --- |
| Tárgyak, ellenfelek, bossok, stackable tárgyak | Ismert sémájú hozzáadás vagy módosítás, stabil ID, numerikus és kapcsolati ellenőrzés |
| Meglévő, képletből számolt szettek | Kizárólag `spine.sets.*.full` és `spine.lines.scaled/percent`; ismert 2/4/6 struktúra |
| Meglévő normál és hősi kazamatatermek | Csak HP, min./max. sebzés, védelem, harcerő, XP és nyang számai; az egész kazamata szerkezete és minden kapcsolat változatlan és valid kell legyen |
| M4 Romőr | Játékban igazolt, védett: 56 támadás; 638 HP + 8,3% bosssebzés; 3,5% életlopás. Eltérés csak jelentés |
| Kísérők, statlimitek, új mechanikák, új szettcsaládok, magyar fordítások | Teljes snapshot / hash és változásjelentés, kézi felülvizsgálat; nincs találgató import |
| Hiányzó rekord vagy korábbi mező | Megtartás és ellenőrzési tétel, nincs automatikus törlés |
| Hiányos / hibás JSON, HTTP-hiba, sikertelen teszt | Nincs import vagy publikálás; az utolsó működő Atlas marad elérhető |

A kézi `source-data/` csomagot a sync nem írja át. Az import külön `data/sync-import.json` felülréteg, rekordhoz tartozó URL-lel, JSON-útvonallal, játékverzióval, SHA-256-tal és időponttal. Nem minősül automatikusan játékban igazoltnak: státusza `derived`. A szettimport a felhasznált képletet is őrzi és buildkor újraszámolja. A `build-data.mjs` ugyanebből építi az Atlas és a Planner közös adatbázisát. A részleges import verziója nem állítja, hogy minden játékmechanika naprakész.

## GitHub Actions és bekapcsolás

Workflow: **Actions → Atlas Auto-Sync V1 → Run workflow**. A `read-only` mód mindig csak ellenőriz, a `main` ágon jelentést és ellenőrzési állapotot commitol. Teljes Pages-build nem indul adatváltozás nélkül. A webes frissítési nézet a nyilvános repository állapotfájlját is lekéri, ezért csak egy új ellenőrzési időpontért nem szükséges nagy build.

A cron `17 */6 * * *`, UTC szerint **00:17, 06:17, 12:17, 18:17**. Magyarországon télen 01:17/07:17/13:17/19:17, nyáron 02:17/08:17/14:17/20:17. A GitHub indítása késhet; ez nem pontos időre vállalt szolgáltatás. Nyilvános repositoryban tartós inaktivitás esetén a GitHub leállíthatja az ütemezést; az Actions felületen újra engedélyezhető.

GitHub-dokumentáció: [schedule működése és korlátai](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule), [GITHUB_TOKEN és workflow-indítás](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).

Az automatikus éles import kapcsolója: **Settings → Secrets and variables → Actions → Variables → `ATLAS_SYNC_AUTO_PUBLISH`**.

- Hiányzó / `false`: az ütemezés csak gyűjt és jelent.
- `true`: az ütemezés és a kézi `apply` futás ismert adatoknál importál, tesztel, Pages-buildet ellenőriz, commitol és **ugyanebben a workflow-ban** telepít. A kézi `read-only` ezt felülbírálja.
- Visszakapcsolás `false` értékre az éles importot állítja le, az ellenőrzést megtartja. Az összes futás az Actions felületen is letiltható.

Bekapcsolás feltétele: sikeres helyi teljes teszt, Pages-build és smoke-teszt, majd sikeres felhőbeli kézi ellenőrzés, ellenőrzött írási jogosultság és közzétételi felhatalmazás. Nem kell új személyes token: a workflow a repository saját `GITHUB_TOKEN` jogosultságával dolgozik. Védett `main` ág, pushütközés vagy Pages-jogosultsági hiba esetén a futás megáll, nem kényszerít push-t. A tokennel készült commit nem indít push-workflow-t, ezért szükséges a közvetlen deploy-job.

Az ismeretlen mechanikák áttekintése: futás Summary / `atlas-sync-evidence-*` artifact / `reports/latest-sync.md`. A jelentés játékrendszerenként csoportosít; az útvonalak csak a technikai részletekben szerepelnek. Ellenőrzés után a megfelelő importáló sémát és teszteket kell bővíteni. A függő tételek önmagukban nem blokkolják az egymástól független, ismert rekordok importját.

## Besorolás és lezárás

Az öt osztály: ismert/validálható adat, támogatás nélküli ismert rendszer, megváltozott mechanika, korábbi első megfigyelés/forrásleltár, valódi kézi eltérés. A felület külön számolja az aktuális új eseményeket, a korábbról nyitott tételeket, az automatikusan feldolgozott mezőket és a dokumentált lezárásokat. A kiinduló tételhalmaz azonosítói megmaradnak, ezért később is visszaszámolható az eredeti 505 tétel sorsa.

A stabil eseményazonosító az útvonalból és a megfigyelt érték lenyomatából képződik. Ugyanazon mező új értéke új esemény, nem törli a korábbi lezárást. A változatlan következő válasz nem zár le ismeretlen ügyet. Import lezárásához az adapter validálása **és az Atlasba ténylegesen bekerült érték egyezése** szükséges; egy importterv nem elegendő. A bizonyíték tartalmazza a szabályt, az időpontot és a forrás-/értékhash-t.

Dokumentált lezárási szabályok:

- `saved-source-alias-v1`: kilenc konkrét API-ág teljes, pontos tartalmi egyezése a már mentett, más néven tárolt forráságakkal. A forrásfájl SHA-256-a és a pontos ág is szerepel a bizonyítékban. Eltérő érték nem zárható le ezzel.
- `editorial-travel-percentage-v1`: a hátas `timeReductionPctFromTravelMult` mezője szerkesztői számítás, nem nyers API-mező. Csak az API-val egyező utazási szorzó és az `(1 − szorzó) × 100` képlet pontos eredménye igazolja a lezárást. Nem törlünk játékadatot.
- A korábbi kliensfájlok első hash-leltára megmarad külön, alacsonyabb prioritású megfigyelésként. Ez nem igazolja a fájlokban rejlő játékmechanikák helyességét, és nem jelent több száz bizonyított játékfrissítést. Tényleges előző/új klienshash-eltérés mechanikai felülvizsgálatot kap.

## Szigorú kazamataimport

A teremazonosító: **kazamata ID + normál/hősi mód + teremszám + lény ID**. A tömbpozíció csak technikai forrásútvonal. Más sorrend ugyanazokat a termeket jelenti, duplikált teremszám viszont hibás. A kulcsnak a kézi és az API tárgykatalógusban is léteznie kell; a hősi lénykapcsolatnak a kazamata ismert normál lénykészletébe kell tartoznia.

A numerikus mezők nemnegatív, véges, biztonságos egész számok; HP és harcerő pozitív, minimumsebzés nem lehet nagyobb a maximumnál. A teljes kulcskészletet és a nem importálható szerkezetet is ellenőrizzük. Új/hiányzó terem, más lény, más szerep, új mező, megváltozott belépési, jutalmi vagy mélyítési szabály az egész érintett kazamata importját blokkolja. Más, független, validált kazamaták frissülhetnek. Hiba vagy duplikált kazamata esetén a korábbi jó import megmarad. A build az ellenőrzést megismétli.

Csak az API újraellenőrzése és a meglévő tételhalmaz újrafeldolgozása:

```powershell
node scripts/atlas-sync.mjs --apply --content-only
```

Ez valódi API-lekérés, megtartja a korábbi kliensleltárt, de nem indít új kliensfeltérképezést. A hatórás workflow változatlanul a teljes vizsgálatot futtatja.

## Visszaállítás

Az import során a jelölt API-snapshot és a hozzá tartozó SHA-256-manifest még a build és az `npm test` előtt, visszavonható tranzakcióban válik elérhetővé. Így a gyermek tesztek és a generált Atlas ugyanazt a verziót olvassák. Az eredeti snapshot a diffhez és a történeti archiváláshoz memóriában megmarad. Ez helyi előkészítés, nem commit vagy Pages-publikálás.

A `syncStateFiles` tételesen megőrzi a felülréteg, Atlas JSON/JS, képmanifest, Otthon-adatcsomag, API- és klienssnapshot, manifest, ellenőrzési állapot és jelentés eredeti bájtjait. Az új történeti fájlok is a tranzakció részei. Build-, teszt- vagy későbbi állapotmentési hiba esetén a korábbi tartalom visszaáll, az új fájlok eltűnnek, és `publish=false` lesz a kimenet. Csak a `failed-sync` diagnosztika marad újként; esetleges visszaállítási hibáit külön felsorolja.

`npm run test:sync` az adaptertesztek mellett a valódi `runSync → build-data → npm test` folyamatot is lefuttatja izolált projektmásolatban; külön indítható: `npm run test:sync:apply`. Új ellenféllel, ismételt 304-gyel és szándékosan hibára futtatott gyermek teszttel ellenőrzi a verzióegyezést, a visszaállítást és a publikálási kimenetet. Nem az éles adatokat módosítja. A másolat szóközös útvonala Windows alatt is tesztelt; a Windows `cmd.exe /c npm test`, a Linux közvetlen `npm test` indítást használ. A gyermek folyamat nem örökli a szülő Node-tesztprotokollját és Actions-kimeneti fájljait. A hatórás workflow ezt a regressziós próbát is futtatja.

Sikertelen build vagy teszt előtt nincs commit / deploy. Publikálás után észlelt tartalmi probléma esetén először állítsd `false` értékre az automatikus importot, majd a hibás sync-commitot `git revert <commit>` paranccsal vond vissza és pushold. A szokásos `pages.yml` újratelepíti az előző adatokat. A forráscsomag és az addon statisztikai kódja változatlan marad.
