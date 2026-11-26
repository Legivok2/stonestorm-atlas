# Stonestorm Companion 0.13.0 BÉTA – helyi telepítés

## Képernyőképes és interaktív előnézet

A projekt gyökerében indítsd el: `npm run preview:addon:companion`.

Nyisd meg: **http://127.0.0.1:4318/**. Ez megjelölt, helyi React-minta, nem a bejelentkezett játék. Az addon valódi megjelenítési moduljait használja helyi mintaadatokkal. A demóban végzett presetmentés külön előnézeti tárhelyre kerül; nem érinti a telepített bővítmény saját presetjeit. A képek kiszolgálása is helyi, nincs külső kérés.

A `.integration/companion/gallery.html` fájl hét 1920×1080-as előtte–utána képpárt, valamint mini/normál és optimalizáló képeket mutat. A képeken külön felirat jelzi a mintakörnyezetet.

## Telepítés Chrome-ba

1. A helyi `downloads/stonestorm-statcap-overlay.zip` csomagot bontsd ki egy állandó mappába. A mappában közvetlenül legyen `manifest.json`.
2. Nyisd meg a `chrome://extensions` oldalt, és kapcsold be a Fejlesztői módot.
3. Válaszd a **Kicsomagolt bővítmény betöltése** lehetőséget, és jelöld ki ezt a mappát. Közvetlenül a projekt `addons/stonestorm-statcap-overlay/` mappája is betölthető.
4. Ellenőrizd: **Stonestorm Companion**, **0.13.0**. A korábbi ZIP- és forrásmappanév a folytonosság miatt megmaradt.
5. Frissítsd a Stonestorm játék lapját. A jobb alsó Companion gomb nyitja meg a panelt.

Meglévő telepítés frissítésekor ugyanabban a kibontott mappában cseréld le a fájlokat, majd a bővítmény **Újratöltés** gombját használd. Ne távolítsd el előbb a bővítményt: az eltávolítás törölheti a Chrome helyi tárhelyét. A frissítés nem változtatja meg a meglévő presetkulcsokat, kézi értékeket és Enhanced UI beállításokat.

## Használat

- **Áttekintés:** megfigyelt harci statok, XP/Nyang/Zsákmány, limitek és szett-gyorselérés. Az ismeretlen érték helyén „–” jelenik meg.
- **Statok:** részletes összesítés, nyers és érvényes értékek, bónuszforrások. A részletes/kézi adatok lenyithatók. A nem igazolt soft-cap értékhez nincs kitalált eredmény.
- **Felszerelés:** három képes preset. A név és a helyi törlés a „Név és helyi szett kezelése” részben van. A Mentés csak helyi tárhelyet ír. A szettkereső külön előnézetet ad, amelyet presetként menthetsz.
- **Portyák:** az aktuális ajánlatkártyák alapján összehasonlítás, rendezés és forrásjelölés. A pontos adatok és kézi felülírások továbbra is elérhetők. Nincs portyaindítás.
- **Atlas adatgyűjtés:** külön indított, legfeljebb 60 másodperces megfigyelés, anonimizált JSON-letöltés és mintatörlés. Nincs feltöltés.
- **Játékfelületek:** hét kiterjesztő és azonnali közös kikapcsolás. Az inaktív előnézet nem élő készlet vagy műveleti panel.
- **Beállítások:** térköz, gyorselérés, csendes értesítések, geometria-visszaállítás, adatvédelmi tájékoztatás és diagnosztika.

A három fejlécikon Mini, Normál és Teljes módot választ. A fejlécnél húzva mozgathatod, a jobb alsó fogantyúnál átméretezheted. A kiválasztott oldal és geometria megmarad. Teljes módban a panel a böngészőhöz igazodik; kézi méretezéshez válts normálra. A mini panel saját méretet és pozíciót jegyez meg.

Billentyűzettel Tab-bal járhatók be a vezérlők. A menüben a nyilak és Home/End lapot váltanak. A fejlécen Alt + nyilak mozgatnak; a méretezőn a nyilak méreteznek, Shift-tel nagyobb lépésben. Escape bezár és a megnyitógombra helyezi a fókuszt. A rendszer csökkentett mozgás beállítását tiszteletben tartja.

## Ha hiányos az adat

A karakterstatisztika és a felszerelés külön adatfolyam. A Felszerelés oldalon pontos állapotjelzés látható. A **Karakteradatok újraolvasása** a korábban ellenőrzött, játékbeli karakter-GET olvasót használja. Ha a kliensmodul megváltozott vagy nem érhető el, ezt külön jelzi. Hiányzó egyedi tárgyazonosítóval a mentés nem válik engedélyezetté. A részletes darabszámok a lenyitható diagnosztikában vannak, saját azonosítók nélkül.

**Felöltözés:** a 0.13.0 az igazolt natív fel-/levételi kliensműveletekkel, friss adatokkal és külön kézi megerősítéssel működhet. Frissítéskor a `scripting` engedély és a privát service worker betöltése is szükséges, Chrome 106+ alatt. Hiányzó/megújult kliensnél a gomb tiltva marad. A fontos tárgyakat a játékban zárd le; a megerősítésben mind a nyolc slotot ellenőrizd. Hiba után nincs automatikus folytatás. Részletek: `reports/EQUIPMENT_LIVE.md`. **Harcerő-optimalizálás:** tiltott, a teljes kombinációs modell igazolására vár. A Harcerő megfigyelt jelenlegi értéke ettől függetlenül megjelenhet.

Az élő játék böngészője a fejlesztéskor nem volt elérhető. A helyi MV3/React-próbák nem helyettesítik az élő fiókos elfogadást. Ez a kiadás nem lett automatikusan pusholva vagy publikálva.
