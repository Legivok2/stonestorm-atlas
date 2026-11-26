# Stonestorm Companion 0.14.0 BETA

Stabilizálási kiadás. Normál használatban Áttekintés, Statok, Felszerelés, Portyák és Beállítások érhető el. A Kísérők statkijelzése a játék kísérőlistáján továbbra is aktív. A kezelőfelület magyarul és angolul használható; a nyelv a Beállítások → Megjelenés részen azonnal váltható, és helyben megmarad.

> A Companion aktív funkciófejlesztését a 0.14.0 BETA verziónál szüneteltetjük. A működő funkciók használhatók maradnak, és szükség esetén hibajavításokat kaphatnak. Az új, többpaneles fejlesztések a különálló Stonestorm Workspace alkalmazásban folytatódnak. Visszajelzés: Discord `pain6089`.

## Telepítés és frissítés

A kiadási ZIP: **stonestorm-companion-0.14.0-beta.zip**. Csomagold ki saját mappába, majd a Chrome Bővítmények oldalán válaszd a Kicsomagolt bővítmény betöltése lehetőséget. Meglévő telepítésnél a korábbi bővítménymappát frissítsd, töltsd újra a bővítményt, majd a játékoldalt is. Ne távolítsd el előbb a bővítményt: az eltávolítás törölheti a Chrome által hozzá rendelt helyi adatokat. Másik mappából külön bővítményként telepítve a korábbi tárhely nem feltétlenül ugyanahhoz az azonosítóhoz tartozik.

A korábbi általános stonestorm-statcap-overlay.zip letöltési cím kompatibilitási másolatként ugyanazt a 0.14.0-s csomagot tartalmazza.

## Normál funkciók

- **Áttekintés:** aktuális név/szint/kaszt, ismert HP, harcerő, védelem és sebzés; igazolt XP-/Nyang-/zsákmányszámítás; presetgyorselérés; legfeljebb öt, valóban rendelkezésre álló limit.
- **Statok:** hat logikus csoport, kizárólag ismert értékekkel. Az üres csoport és a nem igazolt végértékű limitkártya nem jelenik meg. A támadásra, HP-ra és nyers védelemre nem találunk ki globális maximumot.
- **Felszerelés:** három helyi preset, mentés, átnevezés, törlés, tárgyikonok és tárgyankénti előnézet. Az XP/Nyang összehasonlítás a saját felszerelés bónuszaira vonatkozik; nem teljes harci előrejelzés. Az előnézet nem cserél tárgyat.
- **Portyák:** megfigyelt ajánlatok összehasonlítása, XP/energia, Nyang/energia és ismert időadat esetén időarányos mutatók. A rövidített értékek közelítése jelölve van. A 448k, 746,8k, 1,9kk és 2,7kk alak helyesen értelmeződik. Nincs portyaindító automatizmus.
- **Kísérők:** az ismert fajbónuszok, tulajdonságok, feltételes hatások és tanult képességek megmaradnak. Egy hiányzó érték csak az érintett mezőt érinti, nem kapcsolja ki az egész funkciót. A tooltip nem aktivál kísérőt.
- **Megjelenés:** Emerald, Obsidian és Ember téma; mini/normál/teljes panelmód; mozgatható és méretezhető ablak; testreszabható gyorselérés.
- **Értesítések:** csendes, helyi jelzés igazolt limitváltozásról vagy hiányzó presettárgyról, ismétlődésszűréssel és kikapcsolással.

A pontos adatok a játék válaszaival érkeznek. Régi karakteradatból nem mutatunk korlátlan ideig aktuálisnak látszó statot: öt perc után, új adat nélkül a kártyák elrejtődnek. Az Adatok frissítése a meglévő, ellenőrzött olvasómechanizmust használja. A pusztán felszerelésből összeadott kritikus/képességbónusz nem helyettesíti a teljes karakter érvényes értékét.

A kitérés szint szerinti **normál referenciája** nem az adott boss elleni tényleges esély. A csökkenő hozadékú support-bónuszt nem kezeljük egyszerű, kemény levágásként. A normál számított bónuszhoz és kitéréshez a támogatott kliensbelépő és a konfiguráció ellenőrzése is szükséges; eltérő kliensnél az érintett számítás elrejtődik.

## Haladó beállítások

A Beállítások alján egyetlen központi kapcsoló található: **Fejlesztés alatt álló funkciók megjelenítése**. Alapból kikapcsolt; helyben mentődik.

Csak mögötte látható az Atlas adatgyűjtés, a játékfelület-kísérletek, a felszerelési diagnosztika és a fejlesztés alatt álló Felöltözés. Ez a kapcsoló nem kapcsolja ki a műveletek meglévő biztonsági ellenőrzéseit. A játékfelület-kísérletek a kapcsoló megnyitásától és korábbi beállítástól sem aktiválódnak maguktól: az adott lapon külön kézi bekapcsolás szükséges. Az Otthon és Istálló is kísérleti besorolású, mert az élő működés nincs megfelelően igazolva.

Az iframe-próba és a korábbi Community Hub nem része a futó addoncsomagnak. A források a projektben megmaradnak; az összetett többpéldányos megoldások külön Workspace-feladatok.

Az Atlas csak külön indítással gyűjt mintát, legfeljebb 60 másodpercig. A fejlesztői mód kikapcsolása leállítja és törli az ideiglenes mintát. Az export kézi, helyi JSON-letöltés; nincs automatikus feltöltés.

## Adatok, korlátok és ellenőrzések

A presetek és a kompatibilis régi megjelenési beállítások megmaradnak. A régi térközmódok helyett az Emerald az alapértelmezett téma. A Megjelenési beállítások visszaállítása csak a UI-beállításokat törli, nem a preseteket. Részletek: PRIVACY.md.

A Felöltözés kódját izolált tesztek ellenőrzik, de ez nem élő fiókos felszereléscsere-bizonyíték. Ezért normál módban nem kínálunk félrevezető alkalmazásgombot. A teljes harcerő-optimalizálás és a felszerelési zsákmánykeresés nem számít igazolt normál funkciónak.

Az ellenőrzések külön kezelik a publikus adat-/kliensforrást, a szintetikus MV3/React-regressziót és az élő játékot. A 0.14.0-nál az élő fiók műveleteit nem vezéreltük; a gyökér kliensoldal külső lekérését Cloudflare HTTP 403 blokkolta. A publikus tartalom-API és a vizsgált statikus kliensmodulok elérhetők voltak. Nem kerültük meg a védelmet.

A projekt belső auditja: reports/COMPANION_0140_AUDIT.md. Ez a jelentés nem jelenik meg az addon normál felületén. Rövid változásnapló: CHANGELOG.md.

Fejlesztői parancsok a projektből: npm test; npm run test:addon:stabilization:browser; npm run test:addon:pets:browser; npm run build:addon; npm run check:addon. A build nem pushol és nem publikál.
