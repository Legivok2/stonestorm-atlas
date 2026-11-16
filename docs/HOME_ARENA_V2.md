# Otthon és Aréna V2 – ellenőrzött helyi integráció

Forrásadat-verzió: `5231690b6864`. A nyilvános `/api/content` lekérése sikeres. A kezdőlap közvetlen lekérése 403-at adott; védelmet nem kerültünk meg. A legutóbbi nyilvános manifest hivatkozásaiból és a frissen elért modulok importjaiból választottunk 12 hash-elt modult. A jelenlegi belépőmodul frissessége ezért nem igazolható teljes bizonyossággal. Ezt a felület és a collector is jelzi.

## Mi igazolt?

- Nyilvános API: saját Otthon 10. szint; Tiszta aréna 20.; Bandita Liga 21.; a PvP-navigáció külön kapuja 21. A `city.house` 11-es kapuja a Hármas Pecsét kereskedése, nem a saját ház.
- A magyar kliens pontos nevei: **Tiszta aréna**, **Bandita Liga**, **Pihenő**, **Műhely**, **Trófeaterem**, **Kert**. Nyolc megnevezett házfok, négy otthontéma, bútorkatalógus és szettalbum szerepel a szótárban.
- Tiszta aréna: a klienssúgó szerint valódi hősök elleni párbaj, saját becsület és rangsor, rablás nélkül; a Viharszív és a főzetek nem hatnak. Óránként egyszer ingyen ellenfélcsere, Viharérmés többletcsere és várakozásugrás nélkül. A saját szezon rangsávjaihoz kötött címjutalom tartozik; a pontos minimumharc és szezonidő a privát nézetből jön.
- Bandita Liga: a klienssúgó 21-től öt szintes ligákat, az előtted álló öt ellenfelet, győzelemkor helycserét, azonos ellenfél ellen óránként egy támadást ír. A leírt lopás a be nem gyűjtött farm 10%-a és 1 energia; bosszú 24 óráig, siker esetén az ellopott rész fele is visszajár. HP-visszatöltés 10 percenként 10%; 10% alatt nincs támadás. Ezek kliensleírások, nem külön élő szerveres mérések.
- Trón: a kliens 12/24 órás jutalmakat, nyangdíjat és az egymást követő aznapi díjak másfélszeres növekedését írja. A konkrét alapdíj, kasszaérték, fáradás és szezondíj mennyisége ismeretlen.
- A Bandita-trófea dísz az Otthonban: rézhez 10 szezonbeli harc, ezüsthöz napi top 10, aranyhoz napi top 3, trónőrzőhöz 24 órás tróntartás szerepel a kliensben.
- Otthon: a házfok, Otthon-pont/szint és szobaszint külön rendszer. A négy szoba hatásának jellege ismert; a hatásszámok és fejlesztési táblák szerverről jönnek. A három szobagrafikai változat nem szintmaximum.
- Berendezés: csak a kihelyezett bútor ad kényelmet. A kliens négydarabos bútorszettet, aktív teljes szettnél +10 kényelmet és +20 Otthon-pontot ír; felújításnál öt csillagot és csillagonként +20% kényelmet, az ötödiken dupla kényelmet. A pontos teljes plafon és ártábla nem publikus.
- Dongsu teaháza Viharszél-teát kínál. A kliens az `expedition.refill.amount` mezőt használja: jelenleg +25 energia. A csészeszám és ár a játékos patron-/menlevél-/árszorzóadataiból számolódik, ezért a régi fix feltöltési ársort nem használjuk helyette.

## Mi marad mintára váró?

Házfokonkénti szintkapu, nyangár és építési idő; szobaszintenkénti költség, termelés, maximum és napkorlát; bútorár, minőség, kényelmi és luxusplafon; témaár és pontos minTier; napi láda, rangsor és mérföldkövek teljes jutalomtáblája; teakeret és teljes ársor; mindkét Aréna harci formulája, napi kerete, pontos rangküszöbei, szezonbeosztása és díjmennyiségei.

A kliensben **több belépési/kilépési szabályváltozat maradt**: végleges, szezon végéig tartó és szezonkezdő 24 órás ablak. Az aktív változatot nem lehet csak a fordításból eldönteni. Az Atlas nem állítja valamelyiket automatikusan aktuális szabálynak.

## Adatok és Auto-Sync

- `data/home-arena.json`: központi magyar adatcsomag, API-értékek, forrás URL-ek, SHA-256 és bizonytalanságok.
- `snapshots/current/home-arena-client.json`: a felismert modulok hash-e, hivatkozásai és biztonságosan, AST-ből kinyert szótárai. Letöltött klienskódot nem futtatunk.
- `scripts/collect-home-arena.mjs`: aktuális HTML-ből és importokból keres hash-elt neveket. 403-nál megőrzi a korábbi nyilvános leltárt és jelzi a korlátot. A már ismert hash-elt modulokat nem tölti újra.
- Ismert API-kapuk, feature-állapotok és tea-energiamennyiség automatikusan átvezethetők a külön importfelülrétegen keresztül. Hiányos válasz nem töröl régi rekordot.
- Azonos logika mellett új/módosított bútornév biztonságosan bővíthető, ha a friss belépő igazolt. Bútortörlés, új szoba/témaséma, megváltozott klienslogika vagy mechanikai szöveg felülvizsgálatot kap.
- A korábbi verziók Gitben és a Gitből kizárt, 14 napig megőrzött Actions-artifactban maradnak. A közös generátor építi az Atlas adatait; a szetteket, Plannert, kísérőket és kutatásokat nem írjuk át.

Az eredeti 505 tételhez tartozó újonnan támogatott konkrét feloldások és kapcsolók egyezés esetén lezárhatók. Egy egész kliensfájl leltártétele nem zárul le csak azért, mert annak néhány szövegét feldolgoztuk.

## Anonim játékbeli minta

A helyi addon **0.9.4 BÉTA**, eredeti statisztikai számításai változatlanok. Chrome-bővítményikon → Mintagyűjtés indítása → 60 másodpercen belül Otthon/Szobák/Aréna megnyitása → ugyanott Anonimizált JSON letöltése. Újratöltés szükséges a bővítmény frissítése után.

Csak a kliensben és az eredeti addonban megtalált hat GET-végpont figyelhető; új kérés és automatikus feltöltés nincs. A karakterválaszból csak a tea `patron.prices.refill` alapár-konfigurációja olvasható ki, karakteradat nem. A szűrés engedélylistás: név, karakter-/fiókazonosító, ellenféllista, egyenleg, készlet, fejléc, cookie és token kimarad. A következő szint ajánlata csak feltételes megfigyelés; személyes szintkörnyezetet nem exportálunk és nem számítunk belőle globális árképletet. Ismeretlen válaszséma kimarad. Minta nélkül a mező ellenőrzésre váró marad.

## Helyi ellenőrzés

```powershell
npm ci
npm run build:data
npm run build:addon
npm test
npm run build:pages
npm run test:pages
```

A GitHub-workflow-k a zárolt buildfüggőséget `npm ci` paranccsal telepítik. A hatórás ütemezés, a közvetlen Pages-deploy és a tesztkapuk megmaradnak. A felülvizsgált integráció main-push után a meglévő Pages-workflow-val adható ki; az éles állapotot a sikeres deploy és az élő fájlok ellenőrzése igazolja.
## Új anonim Otthon-minta – 2026. november 16-i feldolgozás

A kapott export az addon **0.9.5** verziójából származik, két mintával: `/api/home/rooms` és `/api/sinks`. Az export nem adja meg a megfigyelés időpontját vagy a játékverziót. A nyilvános, szigorúan validált adatok a `data/home-observations.json` fájlban vannak, az eredeti fájl SHA-256 lenyomatával. Helyi fájlútvonal, fiókadat és saját kísérőadat nem került bele.

- 8 házfok ár-, építési idő-, AFK-óra- és napi energiamezője.
- 8 normál és 6 luxusbútor ára/kényelme. A normál bolt külön nyangos és VÉ-s vételi útját a rögzített HomeModal kliensmodul mutatja; az árakat nem adjuk össze.
- 4 téma: a mintában egyenként 250 VÉ, 3. házfoktól.
- 4 szoba: a mintában 10-es fejlesztési maximum; ez nem a kísérők szintkorlátja.
- 3 feltételes szobafejlesztési ajánlat:

| Szobaazonosító | Célszint | Megfigyelt nyangár | Építési idő |
| --- | ---: | ---: | ---: |
| rest | 5 | 2 259 600 | 15 óra |
| workshop | 3 | 1 232 500 | 9 óra |
| hall | 2 | 821 700 | 6 óra |

A `garden` szobához nincs árajánlat az exportban. A `days: 0` mezőt nem értelmeztük korlátlan felhalmozásként. Egyetlen nézetből nem vezettünk le általános árképletet vagy minden játékosra érvényes bónuszt. Az adatok külön megfigyelési csatornán maradnak; az Auto-Sync nyilvános szabályadatait nem írják felül.

Ebben az exportban nincs kísérőkonfiguráció vagy `petArt` képjegyzék, így a jelenlegi kísérőképek forrásbizonyítottsága változatlan.
