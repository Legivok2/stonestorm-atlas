# Data Engine V2 – lefedettség és működés

A történeti `source-data` fájlok megmaradtak. A támogatott nyilvános konfiguráció elsődleges forrása a `data/data-engine.json`; sémaszerződése a külön tárolt, felülvizsgált `data/data-engine-contract.json`. A szerződést az Auto-Sync nem generálhatja újra egy beérkező válaszból. Az ismeretlen ág az API-snapshotban és a felülvizsgálati jelentésben megmarad, a korábbi importált ágat nem törli.

## A kijavított adatfolyam

Korábban a kártya a `perLevel` együtthatót, a Planner annak szinttel szorzott értékét, az addon pedig a V3-képletet mutatta. Most az Atlas, a Planner és az addon ugyanazt a `js/pet-detail-model.js` modult használja; az addon példánya csomagoláskor ebből másolódik.

Fajbónusz = együttható × (10 × forma passzív értéke + rangszorzó × érvényes rang).

A jelenlegi passzív értékek: 0,5 / 0,75 / 1 / 1,25 / 1,5; a rangszorzó 0,5. A rangfejlesztés befejezése előtt a kliens az előző rangot veszi figyelembe. A fajbónusz szintfüggetlen. A trait külön szint-, forma-, ritkaság- és rangfüggő; a signature szintje a forma, a tanult képesség szintje az egyed tényleges adata. Azonos signature és tanult képesség esetén az erősebb szint számít, nem összeadás.

Keselyűfióka: 0,008 × (10 × 0,5 + 0,5 × 0) = 0,04, vagyis +4%. A 0,008 nyers paraméter csak a technikai részletekben szerepel. A felhasználó által közölt +4%-os megfigyelés a `data/pet-observations.json` fájlban külön van a számítási tesztektől; a megfigyeléshez nem közöltek pontos játékverziót vagy rangot. A többi faj teszteredménye kliensből levezetett példa, nem további játékmegfigyelés.

## Tényleges lefedettség

- 22 faj nyilvános fajmodellje, 22 számítható fajbónusz, 5 forma, összesen 110 forma–faj bónuszpont rang 0 mellett. Szintfüggő fajbónuszt nem találunk ki.
- 10 képesség, képességenként 5 konfigurált szint. A magyar nevek és leírások a hash-elt nyilvános fordításból, az értékek a `pets.v3.skills` ágból, a hatásalkalmazás a statikusan ellenőrzött kliensfüggvényekből származik. A gépi jelentés minden képesség forrását felsorolja.
- 110 logikai forma–képkulcs kapcsolat: kliens `Ro/cT` választó és explicit `Tl` helyettesítések. A tényleges jelenlegi kép URL-je az index-modul `go` függvénye szerint `/art/pet-art/<state.petArt[kulcs]>.webp`. Ez a külön jegyzék a karakterválaszból érkezik; a nyilvános content API-ban nincs meg. Ezért **0 jelenlegi kísérőképfájl tekinthető teljesen igazoltnak**, a 110 történeti helyi fájl részben azonosított marad. A `data/pet-art-evidence.json` a fogyasztókomponenst, a regisztráló/URL-választó függvényeket és a hiányzó bizonyítékot is rögzíti. A helyi fájl hash-e és a névegyezés együtt sem pótolja a jelenlegi jegyzéket.
- 182 felszerelés, 6 szett, 65 ellenfél, 6 boss, 4 kazamata, 14 kutatás, 9 nyilvános hátasrekord. Az aktuális számok: `reports/data-engine-coverage.json`.
- A kilencedik hátas (`kalmarteve`) szintfüggő ramp-konfigurációt tartalmaz. Ez megjelenik az adatlapján, de ellenőrzött kliensképlet nélkül nem alkalmazzuk a Plannerben. Hivatalos magyar neve és biztos képkapcsolata még hiányzik.

## Automatikus frissítés

Az ismert sémájú numerikus változások 11 konfigurációágban támogatottak: kísérők, kísérő-spine, hátasok, kutatások, kovácsolás, harci szabályok, bónuszparaméterek, limitek, jutalomparaméterek, polírozás és kövek. A bónusz-, jutalom-, polírozás- és kőág nyilvános szabálykonfigurációként őrződik meg; ez nem jelent teljes szerveres jutalomgenerátor-implementációt. A felszerelés-, szett-, mob-, boss-, anyag-, kazamata-, Otthon- és Aréna-import meglévő ellenőrzései változatlanul megmaradnak.

Kísérőfrissítésnél a friss HTML-ből igazolt, hash-elt belépőmodul importjai alapján kell megtalálni a GameApp és a magyar fordítás modulját. A tíz jóváhagyott számítófüggvény AST-ből kinyert szöveghashének egyeznie kell. Új kód, fordításváltozás, sémaeltérés vagy 403 esetén nincs automatikus kísérőimport. A jelenlegi külső ellenőrzésben a kezdőlap 403-at adott; az elérhető, korábban nyilvánosan hivatkozott modulokból rögzített modell ezt `entrypointConfirmed: false` jelöléssel közli. Hozzáférési korlát megkerülése nincs.

A teljes import közös tranzakcióban módosítja az engine-állapotot, a kísérőmodellt, a snapshotot, az Atlas-adatokat, szükség esetén az addon adatfájljait és ZIP/metaadatait, valamint a jelentéseket. Az import előtt régi verzió mentődik a history alá. Sikertelen build/teszt/állapotírás mindent visszaállít; `publish=false`. A workflow megtartja a hatórás ütemezést, és explicit fájllistát használ.

Ellenőrzési tételt csak egyező teljes forráság-hash ÉS egyező, ténylegesen beépített mező zárhat le. A teljes kliensfájl vagy egy ismeretlen ág nem minősül feldolgozottnak egyetlen ismert részmező miatt.

## Adatvédelem és korlátok

Az addon a felhasználó által indított 60 másodperces gyűjtés alatt az egyébként is beérkező `/api/content` válasz engedélyezett, nyilvános kísérőmodelljét is exportálhatja. Nincs új lekérdezés, automatikus feltöltés vagy aktiválási művelet. A popup és az overlay közös állapotot használ. Saját kísérőazonosító, saját tanult képesség, aktív állapot és személyes karakteradat nem kerül az exportba vagy a nyilvános adatbázisba. Ismeretlen mező kimarad vagy az ismeretlen séma teljes mintája elutasításra kerül.

Nem igazolt: szerveres végösszegek, egyedi etetési/átváltozási ár-felülírások, pontos szerveres jutalomdobások. A saját tanult képességek kizárólag a böngésző memóriájában, tényleges karakterválasz alapján jelennek meg. A megfigyelt 50-es végső szint és a hozzáférhető kliens eltérő formaplafonjai továbbra is jelölt konfliktusok. A régi `rules.maxLevel=10` nem globális maximum.

## Helyi ellenőrzés

`npm test`, `npm run test:sync`, `npm run check`, `npm run build:pages`, `npm run test:pages`, `npm run test:engine:browser`, `npm run test:pets:browser`, `npm run test:addon:pets:browser`, `npm run test:addon:095:browser`, `npm run test:addon:095:native`, `npm run check:addon`.

A Chromium-tesztek a tényleges Atlas- és addon-kódot kontrollált, személyes adat nélküli válaszokkal futtatják, asztali, 390 és 320 px szélességen. Bejelentkezett játékfiókon nem történik automatikus próbaművelet. A képernyőképek helyben, az ignorált `.integration/browser-qa` mappában vannak.

Hiányzó képjegyzék gyűjtése: a felhasználó által indított kutatási gyűjtés alatt egy, a játék által egyébként is indított karakter-GET válaszból a `petArt` ismert faj/forma kulcsai és 32–64 hexadecimális karakterből álló publikus assetkulcsai anonimizálhatók, **kizárólag ha mind a 110 nyilvános faj/forma kulcs jelen van**. Egy csak birtokolt fajokat tartalmazó részhalmaz a játékos gyűjteményét árulhatná el, ezért az teljes egészében kimarad. Más kulcs, saját kísérőazonosító vagy tetszőleges szöveg szintén kimarad. Az export `publicPetArt` mezője csak a későbbi képfájl-ellenőrzés bemenete; önmagában nem emel képet igazolt státuszba. A jelenlegi 0 igazolt fájlt nem helyettesíti tesztben létrehozott mintával.

A fejlesztés jelenleg helyi; automatikus push vagy éles publikálás nem történt.
