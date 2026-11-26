# Felszerelés-preset adatkiolvasási javítás – 0.9.11

**Helyi javítás és ellenőrzés elkészült. Az élő fiókban történő presetmentés elfogadása még függőben van. A teljes feladatot nem jelöljük késznek az élő mentés bizonyítása nélkül.** GitHub-push és publikálás nem történt.

## Pontos hiba

A korábbi 0.9.10-es csomaggal reprodukálható a „Hiányos karakter/inventory” hiba úgy is, hogy a karakterlap és a táska megjelenítéséhez a játék összes szükséges adata rendelkezésre áll.

1. A jelenlegi játék `lean: 1` wire-választ küld. Az `OD` dekóder visszaállítja a kihagyott alapértékeket, például a `state.extraSlots: 0` mezőt. A régi addon a JSON.parse utáni nyers állapotban ezt nem egészítette ki, a közös ellenőrzés viszont kötelezővé tette.
2. A `~: 1` tárgyaknál a kliens `bD` dekódere a hiányzó slotot, szintet és kasztkövetelményt a nyilvános tartalom tárgysablonjaiból állítja helyre. Az alapértékeket a kliens `Xv`/`Kn` képlete számolja; a `plus: 0`, `equippedSlot: null`, `invIndex: null`, `lines: []` is deklarált wire-alapérték. A régi addon ezeket is hiánynak látta.
3. A `nextForge` egy lehetséges következő fejlesztés előnézete, nem folyamatban lévő művelet. A korábbi `pending` feltétel emiatt érvényes, fejleszthető tárgyakat is kizárt az optimalizálásból. A tényleges `rerollPending` korlátozás megmaradt.
4. A felszerelt példányok helyi mentését ugyanaz az összetett kapu tiltotta, mint az inventoryműveletek tervezését. A mentéshez nem szükséges a táska szabad kapacitása, az összes tárgy bónuszértéke vagy a statlimit-kalkulátor teljes adatkészlete.

Az egyedi ID a jelenlegi helyi addonban már a külön `equipment-character` csatornán érkezett. Ez a csatorna a régi `stats`/`derived` guard előtt futott, tehát a régi, négy tárgymezős statlimit-projekció nem volt az egyetlen adatforrás. A javítás most a teljes wire-burkolatot adja át ennek a külön projekciónak; a két világ betöltési sorrendje is ellenőrzött.

## Igazolt adatforrások

| Adat | A játékban használt hely |
|---|---|
| Karakterazonosító | `GET /api/character` → `state.id` |
| Szint és kaszt | `state.level`, `state.classId` |
| Inventory és felszerelt tárgyak | `state.items` |
| Egyedi példányazonosító | `state.items[].id`; soha nem sablonból vagy DOM-pozícióból képzett ID |
| Tárgysablon | `state.items[].templateId` |
| Felszerelési hely | `equippedSlot`, a táska helye `invIndex` |
| Fejlesztés | `plus`, wire-alapértéke `0` kizárólag a jelölt lean tárgyaknál |
| Bónuszok | `lines`, illetve a meglévő, ellenőrzött `bonuses`/polír ág |
| Slot, szint- és kasztkövetelmény | A dekódolt tárgy `slot`, `level`, `classes` mezői, lean esetén a `GET /api/content` tárgysablonjából |
| Effektív szint a speciális tárgyaknál | A kliens `HL`/`z6` szerinti `flags` + `itemLevel` ág |
| Inventorykapacitás | `content.limits.inventorySize + 8 * state.extraSlots`; csak a művelettervezéshez kötelező |

Nincs kitalált inventoryvégpont. A jelenlegi kliens ellenőrzött `X` exportja pontosan `fT = () => Wt("/api/character")`. A frissítő kizárólag ezt a már használt GET-függvényt hívja. A játék saját hitelesítése és dekódere marad használatban; tokent az addon nem olvas ki, nem naplóz és nem küld át.

Elsődleges források: [aktuális entry és wire-dekóder](https://stonestorm.gg/assets/index-C8sNneJf.js), [karakterlap és táska](https://stonestorm.gg/assets/CharacterPage-1iyHKFOC.js), [tárgy-előnézet és nextForge](https://stonestorm.gg/assets/ItemTipBody-DPCDOQV-.js), [nyilvános tartalom](https://stonestorm.gg/api/content). A helyi QA a letöltött entry teljes SHA-256 lenyomatát is ellenőrzi; eltérő kliens esetén felülvizsgálatot kér, nem találgat exportnevet.

## Javított működés

- A MAIN világban a publikus felszerelésadat a capture előtt elérhető. A `lean: 1` és `~: 1` jelölések megmaradnak a normalizálásig.
- Sima, részleges válaszra nem alkalmazunk lean-alapértékeket. A hiányzó helyet nem alakítjuk bizonyított üres slottá. Hiányzó felszerelt item-ID és ütköző ID továbbra is tiltja a mentést.
- A preset helyi mentése csak a karaktert és a felszerelt konkrét példányok azonosságát ellenőrzi. Az optimalizálás a szükséges számszerű és követelményadatokat külön vizsgálja. A csere tervezése továbbra is szigorúan ellenőrzi a kapacitást.
- Panelnyitáskor hiányzó vagy elavult adat esetén automatikus újraolvasás indul. Külön **Karakteradatok újraolvasása** gomb, várakozási állapot, időkorlát és kérésegyesítés készült. Nincs automatikus újrapróbálkozási ciklus.
- A diagnosztika megjeleníti az összes kért állapotot, darabszámot, hiányzó mezőnevet, utolsó sikeres időpontot és a Mentés/Optimalizálás/Felöltözés okait. Azonosítót és hitelesítési adatot nem jelenít meg.
- A presetek neve, helyi kulcsa és három tárolóhelye megmarad. A helyi átnevezés/törlés részleges hálózati adat mellett is használható a már azonosított karakter mentésein.

## Bizonyított ellenőrzések

`npm run test:addon:equipment:client` a tényleges, aktuális nyilvános kliens dekóderét futtatja elszigetelt környezetben. A nyolc slot alapértékeit 0–9 fejlesztésen és két tárgyszinten hasonlítja össze az addon kimenetével, majd egy teljes wire-válasz projekcióját is összeveti: **161/161 egyezés**.

`npm run test:addon:equipment:repair:browser` natív Chrome MV3-bővítményt tölt be, az eredeti kliens dekóderét használó helyi oldallal. A karakterlap és inventory látható, **8 felszerelt + 1 szabad tárgy** szerepel, az eredeti 0.9.10-es ellenőrzés ugyanarra a nyers állapotra az általad jelzett hibát adja. Az új panel automatikus GET után ténylegesen menti a 3 presetet a Chrome saját helyi tárhelyére, visszaolvassa a példányazonosítókat, majd oldalletöltés után is újra olvassa és menti őket: **13/13 teszteset sikeres**. A hiányzó egyedi ID és részleges válasz külön tesztelt. Játékmeneti írások és eredeti tárgygomb-kattintások száma: **0**.

A teljes egységteszt-futás **236/236 sikeres**, köztük **17 új** hibajavítási eset. A korábbi preset- és keresőpróba szintén sikeres. A további regressziók végleges eredménye a mellékelt `equipment-preset-repair.json` fájlban található.

Ezek tényleges klienskódra épülő ellenőrzések, valódi Chrome-tárolással, de **nem az élő fiókod inventoryadatai**. A te tárgyaid darabszámát nem állítjuk a 9 tárgyas mintával azonosnak. A saját számod a javított diagnosztikában látható.

## Nyitott elfogadási pontok

Az élő böngésző eszközkapcsolata nem érhető el: a natív helper „failed to connect native pipe”, a böngészőszolgáltató „browser access host is unavailable” hibát ad. Nem történt bejelentkezett élő karakterolvasás vagy élő presetmentés. Ennek igazolásáig az átadás státusza **élő ellenőrzésre vár**.

Az XP- és Nyang-kereső működik; a zsákmány-előnézet az igazolt modell szerint jelzi, hogy nincs felszerelési zsákmánybónusz, és megőrzi az aktuális szettet. A **Harcerő-optimalizálás továbbra is tiltott**: a jelenlegi teljes kombinációs modell nincs igazolva, és a javítás nem kapcsolja ki ezt a feltételt. Az **éles Felöltözés is tiltott**, mert az eredeti műveletek kérésszerkezete önmagában nem igazolja a biztonságos kiszolgálóoldali végrehajtást és hibakezelést. Ezt nem állítjuk kész funkciónak.

## Telepítés és élő elfogadás

1. A `downloads/stonestorm-statcap-overlay.zip` fájlt bontsd ki a meglévő, betöltött bővítmény fájljainak helyére.
2. A `chrome://extensions` oldalon töltsd újra az addont; a verzió legyen **0.9.11**. Frissítsd a játék lapját is.
3. Nyisd meg az addon presetpaneljét. Szükség esetén kattints a **Karakteradatok újraolvasása** gombra.
4. Ments egy presetet. Zárd be, majd nyisd meg újra a panelt, és ellenőrizd a mentett nevet és tárgyszámot. Ez kizárólag helyi tárolást végez.
5. Hibánál a lenyitható diagnosztika darabszámait és a Mentés sorát add meg; tokent vagy személyes azonosítót ne küldj.
