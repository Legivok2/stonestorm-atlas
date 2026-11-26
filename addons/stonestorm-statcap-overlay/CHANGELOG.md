# Változásnapló

## 0.14.0 BETA – 2026. november 24.

- Központi magyar/angol nyelvkezelés külön fordítási fájlokkal, azonnali és helyben megmaradó nyelvváltással.
- A 0.14.0 BETA karbantartási státusza megjelenik az Áttekintés és a Beállítások felületén; a Workspace fejlesztési iránya és a Discord-kapcsolat dokumentált.
- Normál módban öt főmenü: Áttekintés, Statok, Felszerelés, Portyák, Beállítások.
- Egy központi, helyben mentett fejlesztői kapcsoló, alapból kikapcsolva. Atlas és kísérleti játékfelületek csak mögötte érhetők el; az iframe-próba kikerült a futó csomagból.
- Az ismeretlen végértékű statok, üres limitkártyák és üres statcsoportok eltűntek a normál nézetből. A kritikus végérték, a harci support-érték és a felszereléssorok külön adatként kezelődnek. A kitérés normál referenciája nem keveredik a különböző bosskorlátokkal.
- A statok a friss megfigyelt karakteradatokat használják; öt perc után új adat nélkül elrejtődnek. Nincs új automatikus adatlekérdezési ciklus.
- Megmaradt a három preset helyi mentése, átnevezése, törlése, ikonja és előnézete. A felöltözés és a technikai eszközök fejlesztői módba kerültek; biztonsági ellenőrzéseik megmaradtak.
- Megmaradt a portya-összehasonlítás, beleértve a magyar `k`, tizedesvessző és `kk` alakokat. Nem észlelt ajánlatból nem készül üres útvonalkártya.
- Megmaradt a Kísérők statkijelzése normál módban, a fajbónuszokkal, tulajdonságokkal és ismert képességadatokkal.
- A térközmódok helyett Emerald, Obsidian és Ember témák; javított keskeny nézet és kontrasztos vezérlők.
- A régi kiterjesztések alapból inaktívak. Korábbi bekapcsolt beállításból sem aktiválódnak maguktól; fejlesztői módban külön kézi bekapcsolás szükséges.
- A bővítmény popupja alapból Companion-gyorselérés, nem adatgyűjtő vezérlőpult.
- A presetek és a kompatibilis beállítások megmaradnak. A megjelenés visszaállítása nem törli a felszerelésszetteket.

A böngészős regressziók izolált mintával futnak. Élő fiókban a felöltözés és a kísérleti felületek továbbra sem tekinthetők igazoltnak. Nincs automatikus feltöltés, commit vagy push.
