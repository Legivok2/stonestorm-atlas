# Felszerelés-presetek és szettkereső – 0.9.9 helyi átadás

**Állapot:** előnézeti és mock kiadás. Nem történt push, publikálás vagy élő karakteren végzett tárgyművelet.

[Telepíthető ZIP](../downloads/stonestorm-statcap-overlay.zip) · [gépi ellenőrzés](equipment-presets-verification.json) · [forrásbizonyítékok](../data/equipment-presets-evidence.json)

A ZIP 267 558 bájt, SHA-256: `177e28d2073aebd8c4244bb2c17886e483d821cc5969535eea4f2d0fd2ebe382`. A manifest, a csomagverzió, a kiadási metaadat és az anonim export verziója 0.9.9.

## 1. Egyedi tárgypéldány-azonosítók

A jelenlegi nyilvános kliens az inventorypéldány `id` mezőjét használja. A sablon `templateId` mezője nem azonosít példányt. A karakterhez kötés a `state.id` mezőből történik; név és kaszt nem helyettesíti ezt. A szám/szöveg típus is megmarad, ezért például a számszerű és szöveges azonosítók nem mosódnak össze.

A CharacterPage renderlogikájában a `.inv-grid__cell[data-inv]` inventorypozíció a `state.items` megfelelő példányára mutat. A felszerelt tárgyak a `.pdoll__slot--<slot>` elemekhez a `equippedSlot` mező szerint kapcsolódnak. Az aktuális szintkövetelményhez az eredeti kliens `flags`/`itemLevel` ága is figyelembe van véve.

A capture két új, helyi csatornát kapott: `equipment-character` és `equipment-config`. A régi capture- és statpanellogika az új csatlakozási sorok eltávolítása után a feladat elején mentett hash-sel egyezik. A meglévő kísérő-, Otthon- és anonimizáló kód fájljai változatlanok. A klienskódot statikusan vizsgáltuk; valódi, bejelentkezett karakterválaszt vagy élő inventory DOM-ot nem olvastunk.

## 2. Három menthető preset

Három átnevezhető hely működik, nyolc slot konkrét tárgypéldányaival. A mentés és a törlés csak a bővítmény helyi rekordját érinti. Az adatok a Chrome `storage.local` tárában, karakterenként elkülönített hashelt kulcsok alatt, presetenként külön rekordban maradnak. Két külön lap eltérő presethelyre történő mentése nem írja felül egymást.

Előnézetkor az addon újra feloldja az egyedi azonosítókat. Hiányzó példány, eltérő sablon, hibás slot, duplikált azonosító, nem teljesülő kaszt/szint vagy függő tárgyművelet esetén leáll. Karakterváltás törli a javaslatot és a mock eredményét, majd a megfelelő preseteket tölti be. Sérült helyi adatot nem javít felül automatikusan.

## 3. Egygombos felszerelésváltás

Az eredeti kliensben igazolt hívások:

- `POST /api/inventory/equip`, `itemId` mezővel.
- `POST /api/inventory/unequip`, `slot` mezővel.

A hívásforma megléte nem igazolja az addon általi éles használat engedélyét, az összes szerverkorlátozást vagy az atomikus helycserét. **Ezért nincs kiszállított éles adapter, a Felöltözés és Felszerelés alkalmazása gombok letiltva maradnak.**

A külön mock vezérlő friss állapotot olvas, ellenőrzi a presetet, megjeleníti a le-/felkerülő példányokat és egyszeri megerősítést kér. A megerősítés utáni állapoteltérés leállítja. Csak a szükséges equip/unequip lépések futnak, egymás után. Minden lépés után ellenőrzött az összes felszerelési slot, a példányazonosság, a kaszt/szint és az inventory. Telített táskánál a konzervatív unequip→equip csere nem indul.

Hiba, időtúllépés, dupla indítás, megszakítás, panelbezárás vagy karakterváltás esetén nincs további lépés vagy újrapróbálkozás. A megkezdett és az igazolt lépések külön szerepelnek az eredményben. Az utolsó megfigyelt mock felszerelés megtekinthető; bizonytalan lépés nem kap sikeres minősítést. Automatikus visszaállítás nem indul. A valódi karakter mindvégig változatlan marad.

## 4. Az optimalizáló által számított bónuszok

**XP és Nyang:** a konkrét példányok megfigyelt numerikus bónuszsorai, illetve ezek hiányában a megfigyelt numerikus `bonuses` értékek és az igazolt polírképlet. A fejlesztés utáni saját `values` értékeket az addon átveszi, nem szorozza meg újra. A kombináció aktív szettlépcsői összeadódnak; a jelenlegi `fullSets` mód a 2/4/6 darabos szabályokat használja. Az aktuális kliens a szettértékekre is alkalmazza a `capScale` szorzót, ezért az Atlas korábbi nyers szettértékei önmagukban nem az új számítás végeredményei.

A teljes érvényes jutalombónuszhoz a megfigyelt normál/fizetős módosítók és a jelenlegi felszerelési rész egyezése is szükséges. A normál plafon 100, a fizetős plafon 50 százalékpont. Hiányzó vagy ellentmondó külső adatnál a teljes érték ismeretlen marad, és a keresés csak a felszerelési rész maximumát jelzi.

A branch-and-bound keresés megőrzi a különböző szettcsaládokat; csak azonos tagság mellett szűr ki az adott célra gyengébb jelölteket. A jelenlegi felszerelés plafonon kialakuló döntetlennél külön jelölt marad. A keresés legfeljebb 250 000 csomópontot/5 másodpercet használ, közben átadja a vezérlést és megszakítható. Keretelfogyásnál a legjobb eddigi találat látható, bizonyított maximum állítása nélkül.

**Zsákmány:** a vizsgált API bónuszpooljában és egyedi tárgyhatásaiban nincs felszerelési dropbónusz. A célfüggvény ezért megtartja az aktuális felszerelést, nem talál ki tárgyhoz kötött droprátát.

**Harcerő:** a teljes, szetteket, egyedi hatásokat és minden harci komponenst együtt kezelő modell nincs igazolva; a keresés letiltva. Az aktuálisan megfigyelt Harcerő megjelenhet, a javasolt érték és változás ismeretlen. Nem használunk támadáspontot, item-score összeget vagy kitalált súlyokat Harcerőként.

**HP és védelem:** megfigyelt alaphoz és módosítókhoz képest vetített komponenskülönbség, mindig részleges becslésként jelölve.

## 5. Veszélyes tárgyműveletek kizárása

Az új modulokban nincs HTTP-író, általános tárgyművelet-diszpécser vagy a játék gombjaira kattintó kód. A mock engedélylista kizárólag `equip` és `unequip`. Ismeretlen, eladási, eldobási, törlési, bontási, fejlesztési, vásárlási vagy más műveletet a vezérlő elutasít a végrehajtás előtt. A frontend megerősítés nélkül mock lépést sem indít. A natív próba nulla író kérést és nulla játékbeli gombkattintást rögzített.

A fontos tárgyak játékbeli lezárását javasló figyelmeztetés megjelenik. A zár nem helyettesíti a saját ellenőrzéseket. Az anonim kutatási export külön natív tesztje igazolja, hogy az új saját példányazonosítók és a karakteradat nem kerülnek az exportba; a presetek ettől függetlenül megmaradnak.

## 6. Nem igazolt esetek és további korlátok

- Élő karakteren végrehajtott equip/unequip és az összes szerveroldali állapotkorlátozás.
- Atomikus helycsere telített inventorynál; ezért szabad helyet igénylő konzervatív terv készül.
- Teljes Harcerő-változás és az összes különleges harci hatás együttes eredménye.
- Ismeretlen API-verzió, szetttagság, egyedi hatás vagy hiányzó tárgyérték. Ezek nem kapnak kitalált alapértéket.
- Safari-környezetben végrehajtott éles csere. A modell és mock vezérlő hordozható; a Chrome-tároló külön modul, Safari-cserélő nincs.

## 7. Teszteredmények és használat

**172/172 alapteszt sikeres, ebből 24 célzott felszerelésteszt.** Az addon forrásellenőrzése és az izolált teljes import/visszaállítás 4 tesztje is sikeres. Az új nyilvános `equipment-data.js` fájl az import tranzakciós visszaállításában is szerepel.

A natív MV3-böngészőpróba ellenőrizte a három presetet, átnevezést, különböző példányokat, XP/Nyang-javaslatokat, javaslatmentést, mock megerősítést, panelbezárás miatti megszakítást, két karakter elkülönített Chrome-tárolását, az export adatvédelmét és a 1440/390 px széles nézetet. A nagyobb, szintetikus 248 tárgyas próba 25 csomóponttal bizonyított optimumot talált; a rögzített helyi futás kb. 12 ms volt, általános teljesítménygarancia nélkül.

Sikeresek a korábbi natív addon-, tooltip-, export-, Otthon- és harci böngészőtesztek, a szintaxisellenőrzés, a statikus build, a Pages HTTP-tesztje, a ZIP-ellenőrzés és a publikációs audit. A képernyőképek helyi mock adatokkal készültek:

- [Asztali presetnézet](../.integration/equipment-presets/equipment-1440.png).
- [Asztali összehasonlítás](../.integration/equipment-presets/equipment-preview-1440.png).
- [Keskeny nézet](../.integration/equipment-presets/equipment-390.png) · [keskeny összehasonlítás](../.integration/equipment-presets/equipment-preview-390.png).

Frissítés: a ZIP kicsomagolása a meglévő addonmappába, `chrome://extensions` → Újratöltés, majd a játék lapjának frissítése. A statpanel új részét ezután nyisd meg, és a saját karakterlap megfigyelése után ments presetet. A jelen kiadás kizárólag előnézetet és mock cserét enged.
