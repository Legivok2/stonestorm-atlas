# Character Planner – működés és számítások

Útvonal: `#atlas/planner`. Ugyanaz az `index.html`, `STONESTORM_ATLAS` és `AtlasImages` adatréteg szolgálja ki, mint a Wikit és a Képtárat.

## Felépítés

- `js/planner-model.js`: tiszta, DOM-tól független validálás, fejlesztési értékek, komponensösszeg, szettküszöbök és megosztott build beolvasása.
- `js/atlas-features.js`: kaszt, nem, grafikai változat, szint, 8 felszerelési hely, tárgyválasztó, Pet Builder V2, kísérő/hátas, A/B összehasonlítás, mentés és megosztás.
- `js/image-store.js`: valódi teljes karakterkép választása a páncél `portrait` / `portraitTier` adatai szerint; fegyvert külön jelenítünk meg.
- `css/atlas-tools.css`: széles képernyőn három panel (helyek, karakter, ismert komponensek), kisebb nézetben tördelődő panelek.

## Érvényes konfiguráció

A szinttartomány az adatbázis `limits.maxLevel` értékéből ered: **1–60** a pillanatképben. Az eredeti 8 slot: `weapon`, `armor`, `helmet`, `shield`, `boots`, `bracelet`, `necklace`, `earrings`.

A tárgyválasztó csak a választott kaszttal és szinten használható tárgyakat engedi. Szint- vagy kasztváltás után a korábban használható, most érvénytelen felszerelések eltávolításáról üzenet jelenik meg. A kísérő a mentett `rules.minHeroLevel = 10` fölött választható; a hátas saját minimumszintje is érvényesül. A +fokozat tartományát a `forge.plusMult` tömb hossza adja: **+0–+9**.

A Data Engine kliensmodellje szerinti öt forma plafonja **10/20/35/50/60**, tanulható helyei **0/1/2/3/3**. A korábbi 10/20/30/40/50-es projektmegfigyelés külön evidencia, nem írja felül az aktív kliensmodellt. A `petForm` és a szint külön választható: a szinthez ajánlott forma mellett a hős- és formaplafon által engedett alternatív állapot is megadható. A formaváltás nem automatikus fejlődés. A Planner a formával együtt frissíti a portrét, a slotokat és a számítható bónuszokat. A régi `rules.maxLevel = 10` történeti adat, nem végső maximum.

A Pet Builder V2 asztali nézete portré/forma, számítható hatások és aktív/lezárt képességhelyek területekre oszlik; mobilon egymás alá rendeződik. A választó csak az adott fajhoz elérhető, nem veleszületett és még nem kiválasztott képességeket kínálja; a szint 1–5 között állítható. A Mesterfok és a nyers API `rank` külön mező. A nyers ranghoz tartozó igazolt API-képlet nem bizonyít Mesterfok-megfeleltetést, ezért a felületen nincs szabad, 0–10000-es rangállító.

A Mohaagancs 22-es preset kizárólag a megadott megfigyelés: Mitikus, Felnőtt 22/35, XP +12,6%, Rárontás 57,2% minden 3. ütés után, Előcsapás 140%, Éles karom 5., Nyitópajzs 5. szint / 18%, Mesterfok 11/15. A V3 modell 0 nyers API-ranggal külön +12%-ot számol; az értékek nem egyesülnek és a prompt-megfigyelés nem válik általános képletté. A Mesterfok nyers ranghoz való megfeleltetése és bónuszhatása nem igazolt.

A régi version:1 build link formamező nélkül is betölthető; migrációkor a szinthez illő első formát választjuk, majd az érvénytelen vagy duplikált slotokat elhagyjuk. Az új mentések a formát, szintet és képességszinteket együtt őrzik.

A Wiki-adatlap „Hozzáadás a tervezőhöz” művelete a célbuild kasztját/szintjét a kiválasztás követelményéhez igazítja, majd ismét validál. Ez eltér az aktuális, változatlan szinthez szűrt tárgyválasztótól; a korábbi inkompatibilis tárgyak eltávolításáról tájékoztat.

## Fejlesztett felszerelésértékek

Forrás: a helyben mentett kliens `Kn`, `Kv` és `$v` függvényei, a `forge.plusMult` és a nyers tárgysablonok. Bizonyítékkivonat: `data/client-rule-evidence.json`. Az eredeti játékklienst nem futtatjuk.

Az alapképletek a tárgy **valódi követelményszintjét** (`L`) használják:

| Slot | Fejlesztés előtti képlet |
| --- | --- |
| Fegyver | Min. sebzés: `4 + 2L`; max.: `7 + 2.8L` |
| Páncél | Védelem: `6 + 1.6L` |
| Sisak | Védelem: `3 + 0.8L` |
| Pajzs | Védelem: `4 + L` |
| Csizma | Védelem: `2 + 0.6L` |
| Karkötő | HP: `30 + 12L` |
| Nyaklánc | Kritikus esély: `0.01 + 0.001L` |
| Fülbevaló | Támadás: `2 + 0.5L` |

Minden fokozat a forrás `plusMult` szorzójával számol. A kliens `round(x + 1e-9)` szabályát és a fokozatonként kötelező növekedést is megtartjuk. Normál mezőknél egész kerekítés/lépés, a nyaklánc kritikus esélyénél 1e-4 kerekítési pontosság és legalább 1e-3 növekedés szerepel. Ez nem helyettesíthető egyszerű „mentett +0 érték × szorzó” képlettel.

Mind a **182 tárgy +0 értéke** egyezik a mentett `values` objektummal; a tesztek a +1–+9 szigorú növekedését is ellenőrzik. Ha egy jövőbeli tárgy alapértékei eltérnek a képlettől, a modell nem gyárt hozzá fejlesztett statot.

## Komponensek és nem ismert végeredmény

1. Kaszt: a mentett `baseStats` külön látható.
2. Szintből származó tulajdonságok: az elosztás/komplett képlet nem igazolt, `levelStats: null`.
3. Felszerelések: a konkrét +értékkel számolt azonos statmezők számtani összege.
4. Szettek: kizárólag a tárgy explicit `family` mezője alapján, külön slotonként számolva. A forrás küszöbei **2/4/6 darab**, nem 2/3/teljes találgatás. Az aktív/inaktív küszöbök és a hiányzó helyek megjelennek.
5. Kísérő: kizárólag a V3 Data Engine-modell számítható bónuszai jelennek meg. A faj passzív bónusza, harci trait, signature, tanulható képességek és háttérhatások külön szakaszok. Az ismeretlen harcerő/DPS nem kerül kitalálásra. A nyers API `rank` csak importált, igazolt adatként használható; a prompt szerinti Mesterfok külön, megfigyelésként jelenik meg.
6. Hátas: csak az ismert `travelMult` és az abból következő időcsökkenés. Nincs hozzáadott energia-, HP- vagy támadásbónusz.
7. Egyéb véletlen bónuszok / buffok: nincs bizonyítatlan összegzés vagy szabadon kitalált roll.

**Végső harcerő, HP és sebzés nem számítható pontosan**, ezért `finalCombatStats: null`. A felület ezt feltűnően jelöli; a komponensösszeg nem jelenik meg végső karakterstatisztikaként. A két build zöld/piros jelölése a komponens növekedését/csökkenését mutatja, nem általános harci erősorrendet.

A szettsablonok között jelenleg csak fegyver és páncél ismert kasztonként. A többi négy szetthelyhez vannak ikonok, de nincs tárgysablon/statisztika. A „szett felszerelése” ezért csak a két ismert, használható darabot teszi be; nem gyárt további tárgyakat.

## A/B, mentés és megosztás

Két egymástól független munkapéldány él memóriában (A/B); egy build átmásolható a másikba. Az összehasonlítás felszerelési helyenként és ismert statkomponensenként működik, külön kísérő-, hátas- és szettküszöb-összesítéssel.

Tárolási kulcs: `stonestorm-atlas-builds-v1`. Szerkezet:

```json
{"version":3,"builds":[{"id":"helyi-egyedi-id","build":{"version":3,"name":"Saját build","classId":"ninja","gender":"male","look":1,"level":50,"gear":{"weapon":{"id":"w_ninja_l50","plus":4}},"petId":"pet_u_wild","petLevel":22,"petForm":3,"petRank":0,"petRankVerified":false,"petObservedPreset":"mohaagancs-adult-22","petSkills":[{"slot":1,"skillId":"crit_dmg","level":5},{"slot":2,"skillId":"shield_open","level":5}],"mountId":null,"targetFamily":null}}]}
```

Legfeljebb 20 névvel ellátott build menthető, betölthető, szerkeszthető és törölhető. A már betöltött mentés újramentése ugyanazt az elemet frissíti. Az A/B munkapéldány nem módosítja automatikusan a mentést. Tiltott/megtelt localStorage esetén a felület jelzi a hibát; a memória és megosztási link tovább használható. Az eredeti kalauz tárolási kulcsa változatlan.

Megosztási forma: `#atlas/planner?build=<URL-kódolt JSON>`. Az URL fragmentuma nem kerül HTTP-kérésként a szerverhez. A kész link másolható mezőben jelenik meg, nem küldi el harmadik félnek. A mentés és a megosztás a normalizált konfigurációt használja.

Beolvasáskor verzióellenőrzés, 12000 karakteres felső korlát, engedélyezett mezők/azonosítók/slotok, szint- és kasztfeltételek, névhossz és számtartomány-ellenőrzés történik. Nincs `eval`, HTML-beszúrás a buildnevekből, tetszőleges képfájlút vagy JavaScript-betöltés. Az ismeretlen mezők kiesnek, a hibás tárgyak eltávolításáról üzenet érkezik.

## Ellenőrzés és fennmaradó feladatok

Automatikus tesztek: mind a 182 +0 képlet, +fokozatok, kaszt/szint/slot megkötések, ismeretlen azonosítók, sérült/verzióhibás/túl hosszú link, szettküszöbök, A/B, mentés/betöltés/törlés, régi build migrációja, mind az öt forma, slotkorlátok, duplikációtiltás, a Mohaagancs referencia és a Pet Builder desktop/mobil elrendezése.

A helyi böngészőpróba kizárólag szintetikus mintaadatot használ (`npm run test:pets:browser`); a desktop referenciakép `.integration/previews/pet-builder-reference-desktop.png`. Élő játékbeli teszt nem történt. Fennmaradó bizonytalanság: a Mesterfok és API `rank` kapcsolata, az aktív kliensből függetlenül felfedezett Mohaagancs-pillanatkép, valamint a teljes szerveroldali harcerő/DPS képlete.
