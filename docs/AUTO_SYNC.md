# Atlas Auto-Sync V1

Az Auto-Sync a meglévő Atlas adatgenerátorát egészíti ki. Nem használ játékosfiókot, cookie-t, jelszót vagy API-kulcsot. A böngésző és a helyi számítógép kikapcsolt állapotában a GitHub Actions végzi az ellenőrzést.

## Használat

Node.js 20 vagy újabb szükséges. Nincs új npm-függőség.

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
- Gitben csak egy aktuális API-snapshot, egy manifest és korlátos jelentések vannak. A `snapshots/history/` és `reports/history/` Gitből kizárt; Actions-artifactként 14 napig maradnak meg. Gitben legfeljebb 1000 nyitott ellenőrzési tétel marad, a teljes túlcsorduló lista az artifactba kerül. A Git saját korábbi commitjai természetesen megmaradnak.
- `reports/initial-sync.*`: az első, részleges történeti alaphoz mért valódi összevetés. A nem mentett régi ágakat **első megfigyelésként**, nem bizonyított új játékfunkcióként jelöli.
- `reports/latest-sync.*`: legutóbbi összevetés, teljes előtte/utána értékek, elfogadott rekordok, függő ellenőrzések, hálózati figyelmeztetések. Az ismeretlen változások nem tűnnek el a következő változatlan ellenőrzéskor.

## Automatikusan importálható és védett adatok

| Adatkör | V1 működés |
| --- | --- |
| Tárgyak, ellenfelek, bossok, stackable tárgyak | Ismert sémájú hozzáadás vagy módosítás, stabil ID, numerikus és kapcsolati ellenőrzés |
| Meglévő, képletből számolt szettek | Kizárólag `spine.sets.*.full` és `spine.lines.scaled/percent`; ismert 2/4/6 struktúra |
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

Az ismeretlen mechanikák áttekintése: futás Summary / `atlas-sync-evidence-*` artifact / `reports/latest-sync.md`. Ellenőrzés után a megfelelő importáló sémát és teszteket kell bővíteni; a már megoldott tételek a jelentésből külön, áttekintett commitban távolíthatók el. A függő tételek önmagukban nem blokkolják az egymástól független, ismert rekordok importját.

## Visszaállítás

Sikertelen build vagy teszt előtt nincs commit / deploy. Publikálás után észlelt tartalmi probléma esetén először állítsd `false` értékre az automatikus importot, majd a hibás sync-commitot `git revert <commit>` paranccsal vond vissza és pushold. A szokásos `pages.yml` újratelepíti az előző adatokat. A forráscsomag és az addon statisztikai kódja változatlan marad.
