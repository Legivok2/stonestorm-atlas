# Stonestorm Companion 0.13.0 – valódi presetfelszerelési adapter

Helyi átadás. Korábbi munkamappaverzió: 0.12.0; a Community Hub V2 és a többi helyi fejlesztés megmaradt. Nem történt push vagy publikálás.

**A felhasználó visszajelzése szerint a konkrét példányokat tartalmazó presetmentés már működik.** Ez a kiadás a megerősítéses fel-/levételt valósítja meg. A bejelentkezett böngésző és a felhasználó „Test” presetje nem volt elérhető, ezért annak tényleges nyolc slotját nem olvastuk ki. A futó felület minden presetnél a tárolt nyolc slotot és a friss szerverállapotot mutatja, a hiányzó és üres slotokat is beleértve.

## Igazolt játékmechanizmus

A jelenlegi kezdőlap az `/assets/index-C8sNneJf.js` modult tölti be. A megvizsgált fájl SHA-256 értéke `32f9df0ddb2cb589e0f1d0462bdb7753ce6ea52ea44ad37689496e7806958901`.

| Művelet | Eredeti export | Kérés |
|---|---|---|
| Friss karakter/inventory | `X` | `GET /api/character` |
| Felvétel | `b3` | `POST /api/inventory/equip`, kizárólag `{itemId}` |
| Levétel | `dA` | `POST /api/inventory/unequip`, kizárólag `{slot}` |
| Játékfelület frissítése | `a.getState().setState(response.state)` | Az eredeti állapottár frissítése |
| Másik játékírás érzékelése | `by` | Az eredeti folyamatban lévő műveletszámláló |

A tényleges `ItemSheet-DzKiAIRw.js` fel-/levételi kezelője ugyanezeket az exportokat használja, majd a válasz `state` mezőjét a fenti eredeti setternek adja át. A karakterlap `.inv-grid__cell[data-inv]` és `.inv-grid__item` elemei az `invIndex` alapján keresik a saját példányt. A `.pdoll__slot--<slot>` az `equippedSlot` alapján mutatja a felszerelt tárgyat. A konkrét példány `id`, a sablon `templateId`.

A jelenlegi inventoryszabály: `content.limits.inventorySize + 8 * state.extraSlots`. A natív felszerelési kezelő a tárgykasztot és a szükséges szintet ellenőrzi; szett/egyedi tárgynál az `itemLevel` külön szabálya is érvényesül. A meglévő normalizáló ezt megőrzi. A tárgy lezárása nem tiltja a natív fel-/levételt, de nem is helyettesíti a saját ellenőrzéseket.

A natív equip felület foglalt slotra is engedhet felvételt, de az adapter **nem feltételez atomikus cserét vagy telített táskánál külön szerverviselkedést**. Előbb a hiányzó slotok feltöltésével felszabadíthat helyet, egyébként levételhez szabad inventorycellát követel, majd külön veszi fel az új tárgyat. Mindkét POST a kliens nem-idempotens útját használja, nincs `requestId` vagy idempotent jelző, ezért a vizsgált natív transport nem próbálja automatikusan újra ezeket a POST-okat.

[Dátumozott, hash-elt forrásbizonyítékok](../data/equipment-live-evidence.json). Megismétlés: `npm run verify:addon:equipment:live`. Ez csak nyilvános kliensfájlokat és a publikus content konfigurációt olvassa, nem játékfiókot.

## Végrehajtás és biztonság

1. A Felöltözés csak ismert natív kliens, friss és teljes tárgyazonosítás, érvényes preset, szint/kaszt/slot és elegendő inventoryhely mellett aktív. A mentéshez és az optimalizáláshoz tartozó adatkapuk külön maradtak; a fel-/levétel nem igényel teljes statlimit-számítást.
2. A kézi kattintás előbb a workerben újraolvastatja az aktuális karaktert. A worker az adott karakter helyi presetjét saját maga tölti be, nem a lapról kapott tetszőleges tárgylistát hajtja végre.
3. Megjelenik a név, a levett/felvett példányok, a mentett és jelenlegi tárgyszám, mind a nyolc slot és a számítható statváltozás. A fontos tárgyak játékbeli lezárására figyelmeztető jelölőnégyzet és külön **Mégse / Felszerelés alkalmazása** gombok vannak.
4. A megerősítés ismét friss állapothoz kötött. A worker privát, egyszer használható tranzakciót és dokumentumazonosítót kezel; dupla indítás, másik lap vagy lejárt terv nem indíthat párhuzamos cserét.
5. Minden lépés előtt új szerverolvasás és az előző, ellenőrzött állapot összehasonlítása történik. Ezután kizárólag az adott natív `equip` vagy `unequip` export hívható. Az addon nem készít saját HTTP-író hívást, és nem kattint a játék gombjaira.
6. A műveleti válasz után újabb GET következik. A konkrét példány helyének, az összes slotnak, a birtokolt tárgylistának és a változatlan tárgyak helyének egyeznie kell. Az eredeti állapottár is frissül, tehát a játék React-felülete is az új felszerelést kapja.
7. Csak mind a nyolc slot végső szerveres ellenőrzése után jelenik meg: **Preset sikeresen felszerelve**. Üres mentett slotnál az üresség a cél, nem egy kitalált tárgy.

Az objektumkulcsok sorrendjét kanonizáljuk; a megfigyelési idő és a jogosan változó összesített statok nem számítanak tárgyváltozásnak. Kifejezett `null` helyett hiányzó adatot nem fogadunk el. A `chrome.scripting` átadás JSON-sztringet használ, hogy az üres slotok nulljai a világok között is megmaradjanak.

Hibánál, karakter-/külső inventoryváltozásnál, lapváltásnál vagy megszakításnál nincs következő lépés, automatikus visszaállítás vagy újrapróbálkozás. A már elküldött kérés eredményét még meg kell várni. Bizonytalan kimenetelnél munkameneti napló zárja le a folytatást; külön újraolvasás és kézi állapotjóváhagyás kell egy új tervhez. Workerújraindulás nem folytathat régi műveletet.

Nincs eladás, eldobás, törlés, bontás, fejlesztés, vásárlás vagy ezekhez általános végpont-diszpécser. Az új bridge kizárólag a bővítmény saját, felső keretű játéklapjának belső runtime-üzenetét fogadja. A lap `postMessage` üzenete és a szintetikus gombkattintás nem ad írási felhatalmazást. Token nem kerül a workerbe, üzenetbe, naplóba vagy exportba.

## Ellenőrzések

Az automatizált cserepróbák **kizárólag izolált mock szerveren** futottak. A natív MV3-bővítményt, valódi Chrome helyi/munkameneti tárhelyet, tényleges `chrome.scripting` MAIN-világot, a jelenlegi nyilvános kliens eredeti függvénytörzseit és valódi React-renderelést használtuk. Élő karakteren nem indítottunk tesztfelszerelést.

| Eset | Ellenőrzés |
|---|---|
| 8 tárgyas preset | Pontos saját példányok, lépésenkénti és végső slotellenőrzés |
| 7 felszerelt → 8 mentett | Előbb üres slot feltöltése, 15 szerveresen ellenőrzött lépés, eredeti React-karakterlap változása |
| XP ↔ Boss | Azonos sablonok mellett is eltérő saját példányok |
| Szám/szöveg ID | Különböző példány marad, nem mosódik össze |
| Üres mentett slot | Levétel és végső üres slot |
| Hiányzó / duplikált / rossz slot / szint / kaszt | Csere előtt elutasítva, pontos indoklás |
| Telített táska | Nem indul nem igazolt atomikus csere |
| Hibás / sikertelen szerverválasz | Leállás, nincs következő művelet |
| Megszakítás és workerújraindulás | Nincs automatikus folytatás vagy vak retry |
| Dupla kattintás / ismételt execute | Egyetlen privát tranzakció |
| Oldali postMessage / programozott kattintás | Nem indít írást |
| Megváltozott kliensfüggvény | Felöltözés tiltva marad |
| Veszélyes művelet | Engedélylista és tényleges hálózati napló szerint kizárt |
| Anonim export | Tranzakció és saját tárgypéldány nem kerül bele |

Parancsok: `npm run test:addon:equipment:live`, `npm run test:addon:equipment:live:browser`, valamint a teljes `npm test` és a megőrzött addonregressziók. A végső eredményeket és ZIP-hash-t a [gépi jelentés](equipment-live-verification.json) rögzíti.

Képek: [7/8-as megerősítés](../.integration/equipment-live/confirm-7-to-8.png), [szerveresen ellenőrzött siker](../.integration/equipment-live/success-8-slots.png), [kisebb ablak](../.integration/equipment-live/confirm-mobile.png). A képeken egyértelmű az izolált próba jelölése.

## Telepítés és fennmaradó korlátok

[Új ZIP](../downloads/stonestorm-statcap-overlay.zip), **0.13.0 BÉTA**. A kibontott fájlok cseréje után a bővítményt a `chrome://extensions` oldalon újra kell tölteni, majd a játékoldalt is frissíteni. Az új `scripting` engedély a privát workerből történő natív játékfüggvény-híváshoz kell; új webhely-hozzáférés nincs. Chrome 106 vagy újabb szükséges. A helyi presetkulcsok változatlanok; ne távolítsd el előbb a bővítményt.

A Harcerő-optimalizáló továbbra is tiltott, amíg teljes kombinációs modellje nem igazolt. A Felöltözés ettől független, szigorúan felszerelés-/inventoryellenőrzésen alapuló művelet. Új kliens vagy hiányzó natív export esetén a Felöltözés biztonságosan tiltott marad, a mentés/előnézet tovább működhet.

Az éles adapter elkészült, de a saját fiókban végzett, kézzel jóváhagyott első váltás eredményét nem állítjuk teszteltnek. A végső élő elfogadás a felhasználó saját, tudatos megerősítésével történhet; automatizált éles teszt nem készült.

## Végső helyi eredmény

- `npm test`: **303/303**, ezen belül 31 új felszerelésbiztonsági teszt; a capture-refresh és Community Hub forrástesztek is sikeresek.
- Új natív MV3/React felszerelésváltó: **16/16**, kizárólag izolált szerveren.
- Megőrzött böngészős ellenőrzések: adatkiolvasás 13, Companion 22, Enhanced UI 68, Tárnák/Portya 22; Otthon mind a hat fülön és hat ablakméreten. A kísérő-tooltip, statlimit és anonim export/popup ellenőrzései is sikeresek.
- Szintaxis, helyi hivatkozások, csomagtartalom és SHA-256: rendben. A helyi Pages-előnézet 3783 fájlja HTTP 200 választ adott.
- ZIP: **522787 bájt**. SHA-256: `6fbfb899d5a2fa0132d896486a4e7421975aa90e94efb7846f220bc3319882c2`.
- Éles karakteren végzett automatikus felszerelés: **0**. Push és publikálás: **nem történt**.
- A letöltési felület három ablakméreten ugyanazt a 0.13.0-s ZIP-et adta, helyes mérettel és SHA-256-tal; az újabb verzió és a hálózati hibák kezelése is megfelelt. Az ellenőrzött kiadási fájllistában nincs hiányzó fájl vagy titok-/személyesadat-mintatalálat.
