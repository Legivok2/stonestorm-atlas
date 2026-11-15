# Adatkezelési összefoglaló – Stonestorm Stat Cap Overlay 0.9.3 BÉTA

Ez a leírás az átadott forráskód átnézésén alapul; nem Chrome Web Store-jóváhagyás.

- A manifest `storage` engedélyt és `https://stonestorm.gg/*` hozzáférést kér. Más webhelyhez nem ad hozzá tartalomszkriptet.
- A bővítmény a játékoldalon megjelenő adatokat és a játék `/character`, illetve `/content` válaszainak kiválasztott statisztikai mezőit dolgozza fel. A rögzített mezők között felszerelés, bónuszok, karakterstatisztikák és aktív erősítések szerepelnek.
- Sikeres, statokat érintő játékművelet után külön, olvasási `GET /api/character` frissítést kérhet a meglévő játékoldali munkamenetben. Ez a játék saját címére megy, nem az Atlasra.
- A kézi beállítások, felszerelési értékek és kalkulátoradatok a Chrome `storage.local` tárolójába kerülnek. A bővítmény saját visszaállító vezérlői ezeket törölhetik; eltávolításkor a böngésző is törölheti őket.
- A vizsgált forrásban nincs külön analitikai szolgáltatás vagy az Atlasnak küldött karakteradat. Az Atlas nem kap hozzáférést a játékfiókhoz, és nem kéri annak jelszavát vagy tokenjét.
- Az Atlas külön verziójelzője a saját GitHub Pages-oldal `downloads/stat-addon.json` fájlját olvassa. A legutóbb látott vagy kézzel megadott verziót az Atlas eredetéhez tartozó `localStorage` őrzi. A fájlkérés és a ZIP-letöltés a GitHub Pages szokásos hálózati kiszolgálásával jár.

A BÉTA-felismerés és számítás pontossága nem garantált. A kód és az eredeti fájllenyomatok a repositoryban megvizsgálhatók.
# Kutatási export kiegészítés – 0.9.4

A felhasználó által, a bővítmény popupjában indított kutatás legfeljebb 60 másodpercig figyel hat, a nyilvános kliensben vagy az eredeti addonban igazolt GET-végpontot: `/api/sinks`, `/api/home/rooms`, `/api/arena/pure`, `/api/arena/pure/season`, `/api/arena/bandit`, `/api/character`. Az utóbbiból kizárólag a `patron.prices.refill` öt engedélyezett alapár-konfigurációs mezője tartható meg; karakteradat és egyéni állapot nem. Kérést nem indít, választ nem módosít.

A nyers válasz kizárólag a sanitizáló függvény bemenete. Nem kerül tárolóba, naplóba vagy a bővítmény üzenethídjára. A kimenet szűk engedélylistából épül, nem utólagos név-/token-tiltólistából. A személyes ágak, nevek, azonosítók, fejlécek, sütik, egyenlegek, aktuális szintek és ismeretlen stringek nem exportálhatók. A tisztított minta csak memóriában marad; külön gombbal tölthető le. Hálózati feltöltés, telemetria és automatikus Atlas-import nincs.
