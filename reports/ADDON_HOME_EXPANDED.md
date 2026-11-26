# Otthon Extended View – 0.9.8 helyi átadás

Az addon korábbi verziója 0.9.7, az elkészült helyi kiadás **0.9.8 BÉTA**. Automatikus publikálás és játékművelet nem történt.

## Telepíthető csomag

- [stonestorm-statcap-overlay.zip](../downloads/stonestorm-statcap-overlay.zip), 198 067 bájt.
- A ZIP gyökerében található a frissített manifest; a `home-expanded.js` és `home-expanded.css` is benne van.
- SHA-256: `768ad9fe0de15a0588c6de6aff9a57b7ea242a776469232694bdcabca73a5bd5`.
- Frissítés: a kibontott addon mappájának fájljait cseréld le, a `chrome://extensions` oldalon töltsd újra a bővítményt, majd frissítsd a játék lapját. A verzió 0.9.8 legyen.

## Működés

A Kiterjesztés / Visszaállítás gomb az eredeti X mellett jelenik meg, magyar tooltippel, akadálymentes névvel és billentyűzetes használattal. A nézetet egyetlen logikai érték tárolja az addon saját `chrome.storage.local` tárában, `ssaHomeExpanded` néven. Újranyitás és lapfrissítés után is megmarad.

A méretezés csak a `.modal.npc-modal.npc-modal--scene` alatti `.npc-modal__dialog.home-modal[data-tut-screen="home"]` azonosítása után lép működésbe. A modul az `ssa-home-host` és `ssa-home-expanded` osztályokat használja. Nem mozgatja, másolja vagy cseréli le a React elemeit, és nem hozza újra létre a játék gombjait. A szobakép képaránya, valamint a bútorok és trófeák eredeti stílusa és relatív koordinátája megmarad.

Nagy ablakban a szoba balra, a házinformációk jobbra kerülnek. Széles képernyőn a napi teendők és mérföldkövek egymás mellett is elférnek. A Berendezés fül szélességhez igazodó kártyarácsot kap. Keskeny vagy alacsony ablakban az eredeti tartalmak egymás alá rendeződnek. A külső margó 16 px, kis ablakban 12 px; a fejléc, a bezárógomb és a hat fül a görgethető tartalom fölött marad. Nincs CSS zoom vagy a modal nagyítására használt transform.

A MutationObserver felismeri a megnyitást, a teljes dialog cseréjét és a tartalom újrarenderelését. Ha az elem már nem Otthon, az addon eltávolítja a saját jelöléseit és gombját. A kiterjesztés kikapcsolásával az eredeti méretek visszaállnak. A modul nem indít API-kérést, nem módosít játékmeneti adatot, és nem automatizál fejlesztést vagy vásárlást.

## Tesztelés

148 alapteszt és az addon forrásellenőrzése sikeres. A külön natív Chrome MV3-próba az alábbi méreteken mind a hat fület ellenőrizte:

| Ablakméret | Ház, Berendezés, Trófeák, Szobák, Rangsor, Persely |
| --- | --- |
| 1920 × 1080 | Sikeres |
| 2560 × 1440 | Sikeres |
| 1280 × 720 | Sikeres |
| 980 × 680 | Sikeres |
| 390 × 844 | Sikeres |
| 900 × 480 | Sikeres |

Ellenőrizve: kattintásos és billentyűzetes váltás, natív beállításmentés, újranyitás és frissítés, újrarenderelés, eredeti DOM-elemek azonossága és szülője, bútorpozíció és képarány, eredeti vezérlők, görgetés, rögzített navigáció/bezárógomb, megerősítő modal változatlan mérete, más képernyőként újrahasznált modal takarítása és az observer nyugalomba állása. Az új modul próbája alatt **0 API-kérés, 0 írás és 0 JavaScript-hiba** történt.

Sikeresek a meglévő natív addon-, export- és kísérő-tooltip tesztek is. A harci böngészőpróba a 80 kazamatatermet, a statlimiteket és az addon játékpanel-összevetését ellenőrizte. A statikus build, a Pages HTTP-tesztje, a valódi ZIP-letöltés/hash ellenőrzése és a publikációs audit is sikeres.

Új próba: `npm run test:addon:home`. Gépi eredmények és forráslenyomatok: [addon-home-expanded.json](addon-home-expanded.json).

## Előtte és utána

A képek külön, valódi MV3-bővítményt futtató Chromium-profilban készültek. A felület a nyilvános kliensből ellenőrzött DOM-szerkezetet, CSS-t és a meglévő helyi játékképeket használja, mintadatokkal. Nem bejelentkezett karakter képernyőképei. A próba nem futtatott letöltött játékkódot és nem használta a játék API-ját.

- [Összehasonlító kép](../.integration/home-expanded/before-after.png) · [helyi összehasonlító HTML](../.integration/home-expanded/review.html).
- 1920 × 1080: [eredeti](../.integration/home-expanded/before-1920.png) · [kiterjesztett](../.integration/home-expanded/after-1920.png).
- 2560 × 1440: [eredeti](../.integration/home-expanded/before-2560.png) · [kiterjesztett](../.integration/home-expanded/after-2560.png).
- [Keskeny ablak](../.integration/home-expanded/after-mobile.png).

A képek és a részletes helyi tesztnaplók az ignorált `.integration/home-expanded/` mappában vannak, nem a telepíthető ZIP-ben. A játék későbbi DOM-változása a felismerő szelektorok frissítését igényelheti.
