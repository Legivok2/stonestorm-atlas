# Adatkezelés – Stonestorm Companion 0.14.0 BETA

A bővítmény a Stonestorm oldalán működik. Nem küld adatot az Atlasnak, a készítőnek vagy analitikai szolgáltatásnak. A hálózati kérések a játékhoz tartoznak; nincs automatikus feltöltés.

## Helyben mentett adatok

- Megjelenés: téma, a központi fejlesztői kapcsoló, panelmód, méret/pozíció, nyitottság, kiválasztott oldal, gyorselérés és értesítési beállítások a `stonestormCompanion.ui.v1` kulcsban.
- Három felszereléspreset karakterenként, a korábbi tárhelyformátumban: a saját karakter azonosítója szerinti csoportosítás, presetnév, mentési idő, slotok és saját tárgypéldány-azonosítók. Ezek a mentés és az előnézet helyes működéséhez szükségesek.
- A régi kézi stat-, felszerelés-, főzet- és kalkulátoradatok, a portyasorrend/időegység és a kísérleti nézetek korábbi beállításai megmaradnak saját helyi kulcsaikban. Kísérleti nézetet nem aktiválunk automatikusan.

A Beállítások megjelenési visszaállítása csak a Companion UI-kulcsát törli, a preseteket megőrzi. A presetek külön, a Felszerelés oldalon törölhetők. A portyák kézi értékei az adott út Automatikus adatok visszaállítása gombjával törölhetők. A régi technikai mezők a fejlesztői nézetben kezelhetők.

## Megfigyelt játékadatok és adatfrissítés

A már beérkezett játékadatok szűk vetülete memóriában jut a Companionhoz: név, szint, kaszt, statok, ismert módosítók, saját felszerelés- és kísérőadatok, illetve portyaajánlatok. A karakter neve nem kerül a UI-beállítások vagy az anonim export közé. Nem olvasunk tokent vagy cookie-értéket. Nem állítjuk, hogy a bővítmény minden adata névtelen: a helyi presetek saját karakter-/tárgyazonosítókat tartalmaznak.

A játék megfelelő, sikeres módosító művelete után a már meglévő capture folyamat egy összevont olvasó karakterfrissítést kérhet. Az Adatok frissítése és a hiányos felszerelésadatok megnyitás utáni, korlátozott újraolvasása a játék ellenőrzött GET-mechanizmusát használja. A hitelesítés a játék saját kliensének feladata. A Companion megnyitása nem indít Atlas-mintagyűjtést.

A normál mód nem indít automatikus felszereléscserét. A fejlesztői Felöltözés csak a korábbi privát service worker, eredeti equip/unequip exportok, friss állapotellenőrzés és külön megerősítés útján működhet. A megjelenítési kapcsoló nem kapcsolja ki ezeket a korlátozásokat. Az esetleges bizonytalan csere munkameneti naplója a `ssaEquipmentLive.pending.v1` kulcsban tranzakció-/lap-/dokumentumazonosítót, fázist és időpontot tartalmaz; nem tartalmaz tárgylistát, presetnevet vagy tokent. Bizonytalan eredmény után nincs automatikus folytatás.

## Atlas – kizárólag fejlesztői, kézi használat

A mintagyűjtés csak a központi fejlesztői beállítás mellett, külön indításra aktív, legfeljebb 60 másodpercig. Az engedélyezett kategóriák adatait a meglévő allowlist-szanitizáló tisztítja. A minta memóriában él, és a kézi export helyi JSON-letöltést készít. A fejlesztői mód kikapcsolása leállítja a gyűjtést, és törli az ideiglenes mintát. Nincs automatikus adatküldés.

A bővítmény továbbra is csak `storage` és `scripting` engedélyt, valamint a `https://stonestorm.gg/*` hozzáférést kéri. A scripting engedély a korábbi privát, ellenőrzött felszerelési adapterhez tartozik. Új webhely-hozzáférés, analitika vagy általános, játékoldalról hívható írási híd nincs.
