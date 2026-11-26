# Tárnák Multi-Panel és Portya – 0.9.10

Helyi fejlesztés; automatikus commit, push és publikálás nélkül. A teszt a nyilvános játék DOM/CSS-szerkezetéből készített, saját mintaadatokat használó helyi felületen futott. Bejelentkezett élő karaktert nem vezéreltünk. A géppel olvasható eredmény a `mining-raids-verification.json` fájlban található.

## A hét kért válasz

1. A korábbi `parseReward` csak egyetlen `k` vagy `m` utótagot fogadott el. A teljes oldalszöveget 350 karakteres szakaszokra vágó keresés a mezőket is összekeverhette. Az `1,9kk` XP ezért hiányzott. Az új közös számolvasó kezeli a `kk` utótagot, a magyar tizedesvesszőt és az igazolt ezreselválasztókat; a DOM-olvasó ajánlatkártyánként külön olvas.
2. A megadott reprodukálható mintán mindhárom út felismerhető: **3/3**. A hiányzó jutalom külön ismeretlen mező, nem egy másik ajánlatból átvett szám. Eltűnt kártya esetén a korábbi adat törlődik.
3. A megadott kijelzett jutalmakkal a **hosszú út** a legjobb: körülbelül **52 777,78 XP/energia**.
4. Szintén a **hosszú út** a legjobb: körülbelül **10 372,22 Nyang/energia**.
5. Nagy képernyőn mind a négy Tárnák panel egyszerre látható. 1500 px alatt két, 850 px alatt egy oszlopra váltanak, saját görgethető tartalommal. A kis ablakban a panelterület is görgethető; a HUD és navigáció területe megmarad.
6. A kliens egyszerre csak az aktív React-tabpanelt rendereli. Ez az egy panel eredeti, interaktív tartalom marad. A másik három panel csak feliratozott, időbélyeges szöveges előnézet, az adott fül utolsó megfigyelésével; első látogatás előtt ezt külön jelzi. A Megnyitás az eredeti fülgombot aktiválja, kizárólag a felhasználó kattintására. Nincs interaktív DOM-klón vagy automatikus fülbejárás.
7. **219/219 egységteszt** sikeres, köztük **47 új** számolási és integrációs teszt. A natív MV3-böngészőpróba **22/22** új tesztesete és az Auto-Sync apply **4/4** ellenőrzése sikeres. A meglévő capture-frissítés külön ellenőrzése is sikeres.

| Út | Energia | XP (kijelzett) | Nyang (kijelzett) | XP/energia | Nyang/energia |
|---|---:|---:|---:|---:|---:|
| Rövid | 9 | 448k | 90k | ≈ 49 777,78 | ≈ 10 000 |
| Közepes | 15 | 746,8k | 150k | ≈ 49 786,67 | ≈ 10 000 |
| Hosszú | 36 | 1,9kk | 373,4k | ≈ 52 777,78 | ≈ 10 372,22 |

A nyilvános magyar formázó lefelé csonkol egy tizedesre, a végén elhagyott nullától függetlenül. Például `448k` a `[448000,448100)` tartományt, `1,9kk` az `[1900000,2000000)` tartományt jelenti. A rövid és közepes XP/energia tartománya átfed; ezek sorrendjét nem állítjuk biztosnak. A hosszú út mindkét energiaarányos mutatóban biztos első a három minta között. A mintákhoz nem adtak meg időt, ezért időarányos győztest nem feltételezünk.

## Megvalósítás és adatforrás

- `raid-model.js`: közös `parseGameNumber`, bizonytalansági tartományok, bónuszképlet, kézi felülírás és hatékonyság.
- `raid-dom.js`: `.expo-offer[data-offer]`, `.expo-offer--short/medium/long`, `.expo-offer__fact`, `.expo-offer__energy`, `.expo-offer__reward`, `.expo-offer__time` alapján végzett, látható kártyákra korlátozott olvasás. Áthúzott régi idő, szint, anyagesély vagy más szám nem jutalomforrás. Többszörös azonosító vagy úttípus esetén magyarázott bizonytalanság jelenik meg.
- `raid-ui.js`: külön jutalom- és hatékonyságtáblázat, négy rendezés, perc/óra kapcsoló, mezőnkénti forrás, utanként visszaállítható kézi értékek. A régi helyi kézi beállítások migrálódnak.
- `mining-multipanel.js/css`: útvonalra és egyedi addon-osztályra korlátozott elrendezés, megjelenést és újrarenderelést követő MutationObserver. Az eredeti játékcsomópontokat nem mozgatja és nem cseréli ki.
- A meglévő `capture.js` a játék már beérkezett karakterválaszából egy külön, szűk `raid-offers` memóriabeli üzenetet továbbít. Az új funkció nem indít API-kérést, és nem kerül az anonim exportba.

A pontos API-előnézet csak a jelenlegi kártya azonosítójával, úttípusával, energiájával és valamennyi rendelkezésre álló értéktartományával egyezve használható. Egy ismert jutalommal is alá kell támasztani. Ilyenkor hiányzó mezőt is kiegészíthet. Az öt percnél régebbi pillanatkép lejár. Az API-érték is előnézet, nem garantált tényleges zsákmány.

A nyilvános kliensből ellenőrzött képletek:

```text
jutalom = round(alap * (min(2, mult - paid + itemBonus) + paid))
utazási másodperc = round(travelMin * 60 * travelMult)
úttípus = travelMin / pace <= 15 ? rövid : <= 30 ? közepes : hosszú
```

Elsődleges források: [MiningPage](https://stonestorm.gg/assets/MiningPage-DMAMF98u.js), [HuntPage](https://stonestorm.gg/assets/HuntPage-DslotEk1.js), [magyar számformázó](https://stonestorm.gg/assets/HeroSwitchMenu-BAeuhwSH.js), [jutalomszorzó](https://stonestorm.gg/assets/reward-boost-BJul5okT.js), [bónuszplafon](https://stonestorm.gg/assets/constants-De0gJKRt.js), [időkezelés](https://stonestorm.gg/assets/expedition-time-0gJHKilC.js). Rögzített SHA-256 lenyomatok: `tests/fixtures/mining-raids-sources.json`.

## Ellenőrzés és képernyőképek

A korábbi Otthon-kiterjesztés hat füllel, hat ablakméreten, a felszerelés-presetek és kereső, az aktív/inaktív kísérők tooltipje, a natív popupból és a zárt overlayből működő anonim export is átment a regressziós próbán. Az Atlas statlimit- és addonletöltési felülete 1440, 390 és 320 px szélességen is megfelelt. A statikus helyi build 3783 fájljára HTTP 200-as ellenőrzés készült. Az öt elkülönített korábbi modul forráshashe változatlan; a közös capture és overlay csak a szükséges bekötést, a régi hibás portyaszámoló kiváltását és a kisebb ablakba visszaigazítást kapta.

Reprodukálható adat: `tests/fixtures/mining-raids-fixture.mjs`. Számolási tesztek: `npm run test:addon:mining-raids`. Natív Chrome MV3-próba: `npm run test:addon:mining-raids:browser`. A böngészőpróba minden stonestorm.gg kérést helyi mintára irányít. Két külön, kifejezetten a teszt által indított mock karakter-GET szerepel benne az API-megfigyelés ellenőrzésére; az addon saját kéréseinek és az erőforrás-műveleteknek a száma nulla.

A képek a `.integration/mining-raids/` mappában találhatók:

- Tárnák: `mining-before-1920.png`, `mining-after-1920.png`, `mining-after-2560.png`, `mining-after-1280.png`, `mining-after-900.png`, `mining-after-390.png`.
- Portya: `raids-before-1920.png`, `raids-after-1920.png`, `raids-after-390.png`.

Az előtte-kép a módosítás előtt elmentett `content.js` és manifest natív MV3-futtatásával készült; ugyanazon helyi mintán még **2/3** felismerést mutat. Az utána-kép már **3/3**-at mutat. Ezek helyi tesztképek, nem bejelentkezett élő játékból származó felvételek.
