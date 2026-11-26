# Combat és Auto-Sync V3

A migráció ellenőrzött célja az `fbc93606674a` nyilvános konfiguráció. A `scripts/data-engine-v3-contract.mjs` rögzített, felülvizsgált bemenet: az Auto-Sync nem generál új szerződést a következő API-válaszból. A meglévő szerződések csak a felsorolt harci mezőkkel és a `bonus.tierLevel.lowT5` mezővel bővülnek. Új konfigurációs ágak: képességek, playRef, spine, pályák és funkciókapcsolók. Az ismeretlen kulcs, tömbméret vagy szöveges szabály továbbra is felülvizsgálatra kerül.

## A konfiguráció és a képlet külön bizonyíték

| Mező | Igazolt jelentés / kezelés | Képlethez szükséges bizonyíték |
| --- | --- | --- |
| harcero.rules.ref.dexShare | 61 számból álló referenciatábla, nyers adatként importálva | Aktuális klienshivatkozás és indexelés |
| harcero.rules.pve | refN, guardWeight, guardCap, healWeight, healSat numerikus konfiguráció | A súlyozás, telítődés és műveleti sorrend |
| rules.reductionCurve és combat.rules.reductionCurve | Azonos objektum: mult, coef, exp és a `linear` enum | A görbe és a lineáris alsó korlát alkalmazása |
| rules.dodge és combat.rules.dodge | Azonos objektum: `share` mód, base, weight, floor | A share nevezője és az alkalmazás sorrendje |
| rules.guardMult | 0,5; a korábban rögzített kliensben található ilyen paraméterhasználat | Jelenlegi belépőmodullal igazolt változat |
| rules.supportSoft és hero.supportSoft | Négy stat neve, illetve bekapcsolt logikai érték | A soft-cap függvény és a hard cap sorrendje |
| hero.vitGrowth, strPierce, spShare, critDexShare | Nyers növekedési és arányparaméterek; teljes karakterképletben nem alkalmazzuk | Aktuális klienskód, bemeneti statok és normalizálás |
| hero.ignoreCap, pveGuardLimit | 0,75 és 0,65 konfigurációs korlát | Pontos hatáskör és műveleti sorrend |
| hero.bookGrowth | book = 15, share = 0,6 | Könyvszint és megoszlás felhasználása |
| combat.rules.evadeMax, rules.monsterEvadeCap | Mindkettő 0,30; normál kitérés felső korlátja | A nyers DEX-ből számított kitérés külön vizsgálat |
| harcero.arena | maxTurns = 300, healDecay = 0,9, openingHitMult = 0,6, initiative = coin | Nem tekintjük ellenőrzött arénaszimulátornak |
| spine.lines.capScale | Hat külön numerikus bónuszparaméter | A skálázás és a kerekítés helye |
| bonus.tierLevel.lowT5 | 0,1; tier-generálási konfiguráció | A tier-sorsolás tényleges elágazása |
| lean.skills | Nyolc út bookRate és main paraméterei | A könyvek és fő hatások teljes képlete |
| playRef és spine.refHarcero | Kasztonkénti, illetve közös referenciatáblák | Nem garantált játékos-harcerőértékek |
| maps.strength, stones.strength | Nyers pálya-, boss- és kőerősségi értékek | Nem győzelmi esélyek |
| features.runasorV2, fishCoinRewards | Igazoltan `true` a konfigurációban | Nem bizonyítják önmagukban a szerveres jutalom részleteit |

A korábban rögzített GameApp-modul elérhető, de az új mezők többségét nem tartalmazza. A jelenlegi belépőoldal hozzáférés-ellenőrzése miatt ebből nem lehet aktuális képletigazolást készíteni. A rendszer ezt nyitott szakmai feladatként őrzi. A soft-cap érintett statjainál nincs régi lineáris képletből képzett végleges eredmény.

## Kazamaták és addon

A terem védelme lehet véges, nem negatív tört. Az azonosítók, szintek, darabszámok és a többi teremstatisztika egészszám-ellenőrzése megmarad. Az ajánlott szint változhat a szerkezet megváltoztatása nélkül. Mind a 80 terem megjelenik teljes statkészlettel. A védelem teljes API-pontossága megmarad; nem feltételezzük a játék kijelzési kerekítését.

Az addon 0.9.7 a megfigyelt Content API plafonjait használja, a normál kitérés tartaléka 30%. Nyers védelmipont-plafont nem állít. A 12%-os harci referenciakorlát nem az összes bosstípus egységes korlátja; az API mapBoss/guardian/towerBoss értékei külön adatok.

A kritikus esély végső értékét a Character API szolgáltatja. A változott DEX-képletet az addon nem próbálja a régi képletből rekonstruálni. A soft-cap statok nyers felszerelésösszege és a frissen megnyitott, kifejezetten „Bónuszok” című játékpanel megfigyelése külön szerepel. Az utóbbi megfigyelés, nem a soft-cap függvény visszafejtése. A kísérő-tooltip és az anonim, felhasználó által indított export megmarad.

## Ágankénti frissesség és visszaállítás

Minden ág őrzi a tartalomverzióját és SHA-256 lenyomatát. A `checkedVersion`, `checkedSourceHash`, `checkedAt` mezők a változatlan ág újraellenőrzését is rögzítik. Az elutasított ág `stale` állapotú. Az összállapot csak minden ág egyezésekor `compared-current`; ez konfigurációegyezés, nem minden képlet igazolása.

A szerződés, engine, felülréteg, generált adat, addoncsomag, snapshot, manifest, watcher és állapotjelentés ugyanazon visszaállítható tranzakció része. A hibás build vagy teszt visszaállítja a korábbi fájlokat és `publish=false` eredményt ad.

## Tartalomfigyelő

A hatórás Auto-Sync figyeli a szintplafont, a 60 elemnél hosszabb XP-táblát, fejlődési referenciákat, pályákat, szetteket, bossokat, kazamatákat, kísérőket, hátasokat, tárgyszinteket, tiereket és kapcsolókat. A magyar fordítások és képhivatkozások kizárólag elért nyilvános modulokból származhatnak. A kliens és az API első alapállapota külön kezelendő; az első sikeres kliensleltár nem új tartalmak tömeges bejelentése.

Hivatalos híroldalt csak a nyilvános oldal tényleges news/updates/changelog hivatkozásán követünk. Hivatalos bejelentéshez dátumozott, strukturált NewsArticle bizonyíték kell. Ismeretlen HTML, oldalhash, fordítás vagy kép nem kap bejelentett státuszt. Ha nincs ilyen bizonyíték, az Atlas ezt jelzi; a hozzáférési hibát nem tünteti fel teljes hírellenőrzésként.

Minden megfigyelés pontos forrást, forrásútvonalat, első és utolsó észlelést, játékverziót, státuszt és elérhető forráshasht tartalmaz. Az eltűnés nem törlés: a korábbi megfigyelés megmarad, de nem jelenik meg jelenleg igazoltként. A megváltozott értékek korábbi hash-ei megmaradnak.

Opcionális Discord: a repository `ATLAS_FUTURE_DISCORD_WEBHOOK` Actions Secret mezőjébe kell felvenni a webhookot. A titok nem kerül a statikus oldalba vagy naplóba. A küldés külön CI-lépés, új eseményekre, említések nélkül; az első alapállapot nem küld értesítést. A helyi ellenőrzés nem küld Discord-üzenetet.

## Publikálás

1. Helyi `npm test`, `npm run check`, a teljes apply/visszaállítás teszt és az érintett böngészőtesztek.
2. `npm run build:pages`, `npm run test:pages`, publikációs audit és a megjelenő API-adatok ellenőrzése.
3. A felülvizsgált változások commit/push a main ágra; a Pages-workflow publikálja a tesztelt dist csomagot.
4. Az ütemezett automatikus importhoz a meglévő `ATLAS_SYNC_AUTO_PUBLISH=true` repository változó szükséges. A GITHUB_TOKEN commit nem indít új push-workflow-t, ezért az Auto-Sync saját deploy jobja közvetlenül publikál.

A helyi feladat nem jelent távoli commitot vagy éles telepítést. Az éles közzététel eredményét külön kell ellenőrizni.
