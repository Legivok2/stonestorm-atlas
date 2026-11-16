# Adatkezelési összefoglaló – Stonestorm Stat Cap Overlay 0.9.6 BÉTA

Ez a leírás az átadott forráskód átnézésén alapul; nem Chrome Web Store-jóváhagyás.

A 0.9.6 a teljes megfigyelt kísérőlistát saját azonosítóval, csak a lap memóriájában rendeli a sorokhoz. A DOM-ból kizárólag az adott sor neve, forma-/szint-/ritkaságjelölése, aktuális bónuszfelirata és ott ténylegesen látható képességadata olvasható. Nem kattint aktiválásra, nem nyit kísérőcserét, és nem indít új kísérő-API-kérést. A helyi diagnosztika csak összesített darabszámokat, mezőneveket, adatforrás-kategóriákat és hibakódokat tartalmaz; ez sem kerül automatikusan az anonim exportba vagy az Atlasba.

A 0.9.6 helyi kísérő-tooltipje kizárólag a szükséges saját kísérőmezőket olvassa: sorazonosító, fajazonosító, saját kísérőnév, szint, forma/kötelék, rang és rangidőpont, kikelési időpont, aktív állapot, ritkaság, trait, signature, saját tanult skillazonosítók és szintek. Ezek csak a játék lapjának memóriájában és az ideiglenes tooltipben élnek; nem kerülnek az Atlas adatcsomagjába, tartós tárolóba vagy az anonim kutatási exportba. Nem ment hősnevet, fiókazonosítót, pénztárcát, fejlécet, sütit vagy tokent a tooltiphez.

Az overlay **Atlas adatgyűjtés** része és a Chrome-popup ugyanazon lap közös, memóriabeli gyűjtését használja. Nincs második exportáló, új engedély, új hálózati végpont vagy automatikus feltöltés. A kutatási engedélylista a /api/content válasz nyilvános kísérőparamétereivel bővült; a karakter saját kísérőlistája továbbra sem exportálható. A már megfigyelt konfiguráció az adatgyűjtés indításakor helyi üzenettel újra felhasználható, új hálózati kérés nélkül. A nyilvános fajkonfiguráció és magyar szótár forrás URL-lel és hash-sel szerepel a verziózott modellben; személyes karakteradat nincs benne.

- A manifest `storage` engedélyt és `https://stonestorm.gg/*` hozzáférést kér. Más webhelyhez nem ad hozzá tartalomszkriptet.
- A bővítmény a játékoldalon megjelenő adatokat és a játék `/character`, illetve `/content` válaszainak kiválasztott statisztikai mezőit dolgozza fel. A rögzített mezők között felszerelés, bónuszok, karakterstatisztikák és aktív erősítések szerepelnek.
- Sikeres, statokat érintő játékművelet után külön, olvasási `GET /api/character` frissítést kérhet a meglévő játékoldali munkamenetben. Ez a játék saját címére megy, nem az Atlasra.
- A kézi beállítások, felszerelési értékek és kalkulátoradatok a Chrome `storage.local` tárolójába kerülnek. A bővítmény saját visszaállító vezérlői ezeket törölhetik; eltávolításkor a böngésző is törölheti őket.
- A vizsgált forrásban nincs külön analitikai szolgáltatás vagy az Atlasnak küldött karakteradat. Az Atlas nem kap hozzáférést a játékfiókhoz, és nem kéri annak jelszavát vagy tokenjét.
- Az Atlas külön verziójelzője a saját GitHub Pages-oldal `downloads/stat-addon.json` fájlját olvassa. A legutóbb látott vagy kézzel megadott verziót az Atlas eredetéhez tartozó `localStorage` őrzi. A fájlkérés és a ZIP-letöltés a GitHub Pages szokásos hálózati kiszolgálásával jár.

A BÉTA-felismerés és számítás pontossága nem garantált. A kód és az eredeti fájllenyomatok a repositoryban megvizsgálhatók.
## Kutatási export – 0.9.6

A felhasználó által, a bővítmény popupjából vagy statisztikai paneljéből indított kutatás legfeljebb 60 másodpercig figyel hat, a nyilvános kliensben vagy az eredeti addonban igazolt GET-végpontot: `/api/sinks`, `/api/home/rooms`, `/api/arena/pure`, `/api/arena/pure/season`, `/api/arena/bandit`, `/api/character`. Az utóbbiból kizárólag a `patron.prices.refill` öt engedélyezett alapár-konfigurációs mezője tartható meg; karakteradat és egyéni állapot nem. Kérést nem indít, választ nem módosít.

A nyers válasz kizárólag a sanitizáló függvény bemenete. Nem kerül tárolóba, naplóba vagy a bővítmény üzenethídjára. A kimenet szűk engedélylistából épül, nem utólagos név-/token-tiltólistából. A személyes ágak, nevek, azonosítók, fejlécek, sütik, egyenlegek, aktuális szintek és ismeretlen stringek nem exportálhatók. A tisztított minta csak memóriában marad; külön gombbal tölthető le. Hálózati feltöltés, telemetria és automatikus Atlas-import nincs.

A gyűjtés alatt megfigyelt karakterválasz petArt képszótárából csak a teljes, 110 elemes nyilvános faj/forma-jegyzék és szigorúan hexadecimális publikus assetkulcs exportálható publicPetArt néven. A csak birtokolt fajokat tükröző részhalmaz nem exportálható, mert a játékos gyűjteményét fedhetné fel. Saját kísérőazonosító, tetszőleges szöveg és egyéni képesség továbbra is tiltott. A bővítmény ehhez sem indít kérést.
