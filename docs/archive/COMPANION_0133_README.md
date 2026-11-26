# Stonestorm Companion – BÉTA

## 0.13.3 – kétiframe-es megvalósíthatósági próba

**Kísérleti első lépés; az élő játékban még nem igazolt.** A bejelentkezett `/mining` oldalon: **Companion → Játékfelületek → Multi-Instance · két iframe próba → Két iframe kipróbálása**. A workspace a játék oldalában nyílik meg, két eredeti `/mining` dokumentummal. Az addon csak az eredeti Tárna és Olvasztó fülgombokat választja ki, és ártalmatlan fülváltásokkal ellenőrzi a példányok függetlenségét. Az eredeti játékvezérlők és az iframe-ek tartalma változatlanok maradnak. Az **Eredeti nézet / Bezárás** mindkét beágyazott alkalmazást megszünteti, és visszaállítja a szülőoldal használhatóságát.

A próba nem olvas cookie-értékeket, nem másol játékfelületet, nem indít játékműveletet, nem módosít biztonsági fejléceket. Kizárólag indításkor kér le egy azonos eredetű `/mining` dokumentumot a válaszfejlécek vizsgálatához. A keretek az oldal normál MAIN környezetében jönnek létre; a szerver és a böngésző tiltásai érvényben maradnak. Az iframe-ekben nem fut új Companion, és nincs rekurzió. A **Diagnosztika letöltése** műszaki állapotjelzőket tartalmaz; cookie-, karakter- és beviteli értékeket nem.

A 2026. november 23-i külső ellenőrzést HTTP 403-as Cloudflare-ellenőrzés állította meg. Az ott látott `SAMEORIGIN` fejléc az ellenőrző oldalhoz tartozik, nem igazolja a bejelentkezett játék beágyazhatóságát. A négyes Tárnák, a kompakt panel-CSS és a Közösség bővítése a sikeres élő kétiframe-es próba után következhet. Készletszinkron és tartós teljesítmény még nincs igazolva. Részletek: `reports/MULTI_INSTANCE_V1.md` a projektben.

## 0.13.2 – széles, eredeti Tárnák

A korábbi Tárnák-szövegelőnézetek megszűntek. A széles nézet alapértelmezett, ha nincs korábbi választás; a korábban elmentett kikapcsolt állapot megmarad. Az **Eredeti nézet / Széles nézet** gomb és a Játékfelületek beállítás visszaállítja a játék elrendezését; az összes kiterjesztés kikapcsolása ezt is kikapcsolja. A játék eredeti négy füle közül továbbra is csak az aktív látható, az eredeti vezérlőkkel. Az addon nem indít bányászati kérést vagy műveletet.

A megvizsgált nyilvános kliensben a Tárnák főkomponens csak egy fület renderel, a másik három komponens nem külön exportált. A külön főkomponens-példányok saját készlet- és műveleti zárolási állapota nem bizonyítottan szinkronizált; emiatt nincs négy egyidejű, interaktív panel vagy panelközi készletszinkron. A négy eredeti fül működésének és az új elrendezésnek élő játékban történő igazolása még szükséges. A böngészős teszt izolált minta, nem indít játékműveletet.

## 0.13.1 – natív Közösség és aktuális felszerelésadapter

A külön Community Hub előnézet kikerült a navigációból és a futásidejű csomagból. A játék eredeti Közösség ablakának fejlécében váltható a kb. 92%-os elrendezés; ugyanitt maradnak az eredeti fülek, barátlista és chat. A beállítás a Companion Játékfelületek oldalán és az összes bővítést kikapcsoló gombbal is kezelhető. A módosítás nem másol játékadatot, nem hoz létre chatet és nem indít játékműveletet.

A felszerelési adapter és olvasó a 2026-11-23-án nyilvánosan megfigyelt új kliensmodulra frissült. Az exportok és a műveleti szerződés ellenőrzése változatlanul kötelező; ismeretlen kliensnél a gomb tiltva marad. A nyolcslotú csere izolált szerveren tesztelt; éles karakteren nem történt próba, ezért az éles működés nem igazolt. Probléma esetén az előnézet slotonként mutatja a keresendő példányokat: ezeket a karakterlapon a játék saját vezérlőivel lehet kézzel felszerelni.

## 0.13.0 – megerősítéses presetfelöltözés

A három mentett preset **Felöltözés** gombja a friss, teljes és egyértelmű tárgyazonosítás, szint/kaszt/slot, inventoryférőhely és az aktuális játékkliens ellenőrzése után használható. A kattintás előbb újraolvassa a karaktert, majd megmutatja a le-/felkerülő konkrét példányokat és mind a nyolc slotot. A megerősítésben a fontos tárgyak játékbeli lezárására figyelmeztetünk. **Felszerelés alkalmazása** csak külön, kézi jóváhagyás után indul.

A végrehajtás a játék jelenlegi `b3`/`dA` felszerelési exportjait és eredeti állapotfrissítőjét használja. Nem készít saját HTTP-író hívást. Minden lépésnél ellenőrzi a műveleti választ és az újraolvasott szerverállapotot. Nem támaszkodik nem igazolt atomikus cserére telített táskánál. Üres mentett slotot üresre állít; sablon helyett konkrét példányt keres. Hiba/megszakítás esetén leáll, nem próbálkozik újra és nem állít vissza automatikusan. Bizonytalan kimenetelnél új csere csak külön állapotellenőrzés és kézi jóváhagyás után készíthető.

**Új technikai feltétel:** Chrome 106+ és a manifest `scripting` engedélye, kizárólag a már engedélyezett `https://stonestorm.gg/*` eredeten. Az engedély a privát MV3 service workerből elérhető MAIN-világbeli játékfüggvényekhez kell. Oldali `postMessage` vagy programozott gombkattintás nem jogosít fel csereindításra. Ismeretlen vagy megváltozott kliensfüggvényeknél a Felöltözés letiltva marad, pontos indoklással. A korábbi Community Hub és minden megjelenítési funkció megmaradt.

Telepítés: a frissített ZIP-et a meglévő, állandó bővítménymappába bontsd ki, a `chrome://extensions` oldalon töltsd újra a bővítményt, ellenőrizd a **0.13.0** verziót és az új engedélyt, majd frissítsd a játékot. Ne távolítsd el előbb a bővítményt: a régi helyi presetkulcsok változatlanul megmaradtak. A Harcerő-optimalizáló külön modellje továbbra sem igazolt, ezért az tiltott marad.

Helyi ellenőrzés: `npm run test:addon:equipment:live`, `npm run verify:addon:equipment:live`, `npm run test:addon:equipment:live:browser`. A csere automatizált próbái kizárólag izolált mock szerveren futnak, valódi MV3-bővítménnyel és a nyilvános kliens tényleges függvénytörzseivel. Élő karakteren nem indítunk tesztfelszerelést. Részletes átadás: `reports/EQUIPMENT_LIVE.md` a projektben.

## 0.11.0 – Stonestorm Companion

Az új főpanel külön **Áttekintés, Statok, Felszerelés, Portyák, Atlas adatgyűjtés, Játékfelületek és Beállítások** oldalt kapott. Az áttekintő XP/Nyang/Zsákmány-kártyákat, megfigyelt harci statokat, limitösszegzést és preset-gyorselérést mutat. A részletes statforrások, kézi mezők és diagnosztika lenyithatók. A három preset képes szettkártya lett; az optimalizáló külön mutatja a jelenlegi és ajánlott bónuszokat. A portyák rangsorolt útvonalkártyákat kapnak, a pontos értékek és kézi felülírások továbbra is elérhetők.

A fejlécben választható **Mini / Normál / Teljes mód**. A panel a fejlécnél húzva mozgatható, a jobb alsó fogantyúnál méretezhető. Billentyűzettel: a fejlécen Alt + nyilak, a méretezőn nyilak; Shift-tel nagyobb lépések. Escape bezárja, a megnyitógomb visszahozza az előző nézetet. A beállítások helyben megőrzik a módot, méretet, pozíciót, kiválasztott oldalt és testreszabható gyorselérést. A mini panel a bónuszokat és fontos limiteket mutatja.

A **Játékfelületek** oldalon a hét meglévő Enhanced UI kapcsoló közösen kezelhető, az **Összes kiterjesztés kikapcsolása** azonnali visszaállítást ad. A hibrid előnézetek továbbra sem élő, interaktív játékfülek. A kísérő-tooltip portrét, olvasható szekciókat és lenyitható forrásmagyarázatot kapott; inaktív kísérőnél is működik.

A csendes, kikapcsolható helyi értesítések valóban megfigyelt változásokra reagálnak: új igazolt limittúllépés, hiányzó presetpéldány, egy új tárggyal számolt jobb XP/Nyang-bónusz, elkészült mintagyűjtés vagy nem támogatott játékmodell. Nincs hang, böngészőértesítés, ismétlődő jelzés minden rendereléskor vagy automatikus játékművelet. A panelváltás nem indít új adatlekérést; a Felszerelés megnyitása szükség esetén a már ellenőrzött karakter-GET újraolvasását használja. Ez a korábbi olvasó működése, nem új végpont.

**Biztonsági korlátok:** az éles Felöltözés és a teljes Harcerő-optimalizáló továbbra is tiltott. A hiányzó tárgyazonosító nem kap kitalált értéket. A mentés, a számítás és a felszerelésváltás külön adatfeltételei megmaradtak. A redesign nem módosította a játékműveleteket és a számítási modellt.

Telepítés: csomagold ki a helyi ZIP-et állandó mappába, a `chrome://extensions` oldalon töltsd be vagy töltsd újra a kicsomagolt bővítményt, majd frissítsd a játéklapot. A Chrome-ban **Stonestorm Companion 0.11.0** néven látható. A korábbi helyi presetkulcsok megmaradtak. Részletes magyar útmutató: a projekt `docs/COMPANION_TELEPITES.md` fájlja.

Helyi, interaktív mintaelőnézet: a projektből `npm run preview:addon:companion`, majd `http://127.0.0.1:4318/`. Ez külön, megjelölt mintaadatokat használ; nincs játékfiók-kapcsolata. Ellenőrzés: `npm run test:addon:companion`, `npm run test:addon:companion:browser`. Jelentés és képek: `reports/COMPANION_REDESIGN.md`, `.integration/companion/gallery.html`. Az élő játék böngészője nem volt elérhető: a képek helyi React-próbáról készültek.

## 0.10.0 – Enhanced UI V2

Az Otthon, Tárnák, Alkimista, Hármas Pecsét, Istálló, Bolt és Horgászat külön kapcsolható a saját fejlécgombjával. A **Stat limitek → Enhanced UI – felületek** rész hét kapcsolót és egy **Összes módosított felület kikapcsolása** gombot tartalmaz. A visszaállítás oldalfrissítés nélkül történik. Az addon a nézetválasztást a Chrome helyi tárhelyén jegyzi meg, a régi Otthon- és Tárnák-beállítást átveszi.

Az Alkimista és a Hármas Pecsét három, a Bolt nagy képernyőn négy panelt kap. Mivel a játék egyszerre csak az aktív fül eredeti tartalmát rendereli, **csak az aktív panel interaktív**. A többi a kézzel korábban megnyitott fül megfigyelt szövegét, képeit és árait mutatja, forrással és időponttal. Nem élő adatok. A még nem megnyitott fülnél nincs kitalált tartalom; a Megnyitás az eredeti játékfülre vált. Az előnézetek nem tartalmaznak vásárlási, eladási vagy készítési gombot. Kis ablakban a panelek két vagy egy oszlopba rendeződnek, saját görgetéssel.

Az Istálló az eredeti aktív hátast, a bérelhető hátasokat és a saját/eltett hátasokat három területre rendezi. Eredeti React-elemet nem mozgat vagy klónoz. A Horgászat keskeny/széles és összecsukott nézetet kapott; a Bedobás elérhető marad. Bedobás, várakozás, fárasztás, kiemelés vagy automata horgászat közben az új elrendezés felfüggesztődik, az eredeti játékfelület kezeli az interakciókat.

Az új közös modul nem indít API-kérést vagy játékműveletet. A DOM-megfigyelések csak memóriában maradnak és az adott felület bezárásakor törlődnek. Külön tartalmi figyelő csak bekapcsolt, nyitott felülethez tartozik. A korábbi stat- és presetmodul olvasási működése megmarad.

Ellenőrzés: `npm run test:addon:enhanced` és `npm run test:addon:enhanced:browser`. A böngészős próba valódi MV3-bővítményt és React által renderelt, nyilvános kliensstruktúrát követő helyi mintafelületet használ. **Az élő játék DOM-ja nem volt elérhető; a képernyőképek mintafelületről készültek.** A részletes jelentés: `reports/ENHANCED_UI_V2.md`; az öt előtte–utána képpár: `.integration/enhanced-ui/gallery.html` a projektben. A próbák nem kattintanak erőforrást használó játékgombokra.

Frissítés: cseréld le a kibontott addon fájljait, töltsd újra a bővítményt a `chrome://extensions` oldalon, majd frissítsd a játék lapját. Ellenőrizd a **0.11.0** verziót.

## 0.9.11 – preset-adatfolyam javítása

A játék `lean: 1` válaszában a kliens által meghatározott alapértékek kimaradhatnak. Például az `extraSlots: 0`, valamint a `~: 1` jelölésű tárgy slotja, szintje, kasztkövetelménye, alapértékei, `plus: 0`, üres bónuszsorai és null inventory/felszerelési helyei a játék saját dekóderében állnak helyre. Az addon most megőrzi a wire-burkolatot, és ugyanezt a jelenlegi klienssel összevetett normalizálást végzi. Sima, részleges válaszra nem alkalmaz tömörítési alapértékeket. Egyedi itemazonosítót soha nem talál ki.

A `nextForge` fejlesztési előnézet, ezért nem jelent folyamatban lévő tárgyműveletet. A tényleges `rerollPending` korlátozás megmarad. A mentéshez külön, a felszerelt konkrét példányokat ellenőrző kapu tartozik; a statlimit-kalkulátor `stats`/`derived` mezői és a táska kapacitása nem feltételei a mentésnek. A számítás, a helyi presetkezelés és a továbbra is tiltott éles Felöltözés külön diagnosztikát kapott.

A presetpanel megnyitásakor a hiányzó vagy elavult adatokhoz automatikus olvasás indul. A **Karakteradatok újraolvasása** gomb külön is használható. A MAIN-modul kizárólag a játék ellenőrzött, már használt `GET /api/character` kliensfüggvényét hívja; a hitelesítést és a dekódolást a játék saját olvasója végzi. Az addon nem olvas vagy továbbít belépési tokent. Ismeretlen kliensmodult nem hív meg; nincs általános művelet-végrehajtó vagy írási végpont.

A lenyitható diagnosztika csak állapotokat, darabszámokat, hiányzó mezőneveket és időpontot mutat. Nem tartalmaz karakter-, tárgy- vagy fiókazonosítókat. A mentett presetek továbbra is karakterenként a helyi Chrome-tárhelyen maradnak; a régi presetkulcsok változatlanok.

XP-, Nyang- és zsákmány-előnézet a szükséges tárgyadatokkal működik. A teljes Harcerő-kombinációs modell továbbra sem igazolt, ezért ezt a gombot nem kapcsoltuk be látszólagos számítással. Éles felszerelésváltás nincs engedélyezve.

Ellenőrzések: `npm run test:addon:equipment:repair`, `npm run test:addon:equipment:client`, `npm run test:addon:equipment:repair:browser`. Az utóbbi natív MV3-bővítményként a játék tényleges, nyilvános dekóderét használja, anonimizált mintaadatokkal és valódi Chrome helyi tárolással. Az élő fiókban történő mentés külön elfogadási feltétel; ennek hiányában a teljes feladat nem tekinthető lezártnak.

## 0.9.10 – Tárnák Multi-Panel és Portya (korábbi kiadás)

A korábbi, három szöveges előnézetet tartalmazó Tárnák-nézetet a 0.13.2 eltávolította; helyette a fenti széles, eredeti egyfüles nézet működik.

A Portya-összehasonlító az egyes `.expo-offer[data-offer]` kártyák külön jelölt energia-, XP-, Nyang- és időelemeit olvassa. Kezeli a magyar tizedesvesszőt, ezreselválasztókat, `k`, `kk` és `m` számokat. A rövidített jutalmak a kliens igazolt, lefelé csonkoló formátuma szerint közelítőek. Átfedő tartományok nem kapnak biztos győztesjelölést. Hiányzó jutalom vagy hibás idő helyén magyarázat jelenik meg. Eltűnt és újrasorsolt ajánlat nem őrzi meg a régi értékeket.

A játék már beérkezett karakterválaszából, a kliens igazolt bónuszképletével számolt pontos **jutalom-előnézet** előnyt élvez, ha az azonosító, úttípus, energia és a jelenlegi kártya értéktartománya is egyezik. Eltérő, hiányos vagy öt percnél régebbi API-pillanatkép helyett a DOM-adat látható. Saját API-kérést egyik új modul sem indít. Az API-érték sem garantált tényleges jutalom.

Külön jutalom- és hatékonyságtáblázat, XP/energia, Nyang/energia, XP/perc, Nyang/perc, XP/óra és Nyang/óra számítás, négy rendezés és perc/óra kapcsoló érhető el. A kézi felülírás külön jelölt, utanként visszaállítható, helyben mentett; a régi kézi adatok átkerülnek az új helyi sémába. A megadott három mintában nincs időadat, ezért azokhoz nem feltételezünk utazási időt.

Helyi ellenőrzés: `npm run test:addon:mining-raids`, `npm run test:addon:mining-raids:browser`. Részletes eredmény: `reports/MINING_RAIDS.md`. A böngészős próba nyilvános DOM/CSS alapján felépített helyi mintán fut; élő, bejelentkezett játékot nem vezérel.

## 0.9.9 – felszerelés-presetek és szettkereső

A statpanel **Felszerelés-presetek és szettkereső** részében három preset menthető, átnevezhető, előnézhető és törölhető. Mentésük a nyolc slot konkrét `item.id` példányait rögzíti. Az azonos `templateId`-jú példányok megmaradnak külön tárgyként. A saját adat kizárólag a Chrome helyi tárhelyére kerül, a karakter `state.id` azonosítója szerint elkülönítve. Más karakterre váltva az előnézet törlődik, és a megfelelő három preset töltődik be.

A játék megfigyelt karakterválaszából dolgozunk. Ha nincs teljes vagy két percnél frissebb pillanatkép, a funkció új megfigyelésig letilt. A 0.9.11 a presetpanel megnyitásakor és az Újraolvasás gombbal ellenőrzött karakter-GET-et is használ; felszerelésmódosító kérést nem indít.

Az XP/Nyang-keresés teljes kombinációkat vizsgál az aktuális bónuszsorokkal, polírértékekkel, szetttagságokkal és a 2/4/6 darabos lépcsőkkel. Az aktuális kliens `capScale` értékei is érvényesülnek. Az eredmény külön mutatja az érvényes teljes bónuszt és a felszerelések saját részét. Hiányos külső bónuszadatnál a teljes érték ismeretlen marad. A keresés korlátozott idejű és megszakítható; ha nem fejeződik be, nem állít bizonyított maximumot.

A jelenlegi igazolt modellben nincs felszerelési zsákmánybónusz, ezért a Zsákmány cél nem javasol felesleges cserét. A teljes Harcerő-keresés az összes harci hatást együttesen igazoló modell hiányában **letiltva**. A HP/védelem előrevetítése **részleges becslés**, a Harcerő javasolt értéke ismeretlen.

**Az éles Felöltözés és Felszerelés alkalmazása gomb letiltva marad.** A **Biztonságos mock próba** külön, memóriabeli másolaton ellenőrzi a műveletsort. Előtte látható a le-/felkerülő tárgyak listája és a pontos saját példányazonosító; a próba egyszeri megerősítést kér. Csak `equip` és `unequip` lépés létezhet. Nincs éles adapter, általános tárgyművelet-végrehajtó vagy játékbeli gombokra kattintás. A próba hibánál, időtúllépésnél, megszakításnál és állapoteltérésnél megáll; nincs automatikus visszaállítás vagy ismétlés. Az utolsó megfigyelt mock felszerelés megtekinthető.

Ajánlott a fontos tárgyakat a játékban lezárni, mielőtt presetet váltasz. Az addon kizárólag felszereléscserére szolgál.

Tesztek: `npm run test:addon:equipment`, `npm run test:addon:equipment:browser`. A számító/presetmodell és a mock cserevezérlő Chrome-tól független. Safarihoz külön tárolóadapter szükséges; éles felszerelésváltást ez a kiadás ott sem biztosít.

Frissítés: a ZIP kibontott fájljaival cseréld a meglévő addonmappát, majd `chrome://extensions` → Újratöltés és a játék lapjának frissítése. A verzió **0.9.11**.

## 0.9.8 – kiterjesztett Otthon

Az Otthon ablak jobb felső sarkában, a játék eredeti bezárógombja mellett a **Kiterjesztés / Visszaállítás** gomb váltja a nézetet. Keskeny ablakban az ikon látható, magyar tooltip és akadálymentes név tartozik hozzá. Enterrel vagy Szóközzel is használható.

A választás az addon saját Chrome `storage.local` tárába kerül, `ssaHomeExpanded` néven, egyetlen logikai értékként. Újranyitás és lapfrissítés után is megmarad; a játék adatait nem módosítja.

A kiterjesztett nézet 16 px, kis ablakban 12 px szegélyt hagy. A fejléc, a bezárógomb és a hat fül a görgethető tartalom fölött marad. Nagy ablakban a Ház szobája balra, az eredeti házinformációk jobbra kerülnek; a Berendezés több kártyát jelenít meg soronként. Keskeny vagy alacsony ablakban a tartalom egymás alá rendeződik.

A `home-expanded.js` MutationObserverrel felismeri a megnyitást és újrarenderelést. A `home-expanded.css` csak a pontosan azonosított Otthon modal addon-osztályai alatt hat. Nem mozgatja vagy másolja a React által kezelt elemeket, nem alakítja át a bútorok koordinátáit, és nem emeli az Otthont a kisebb megerősítő ablakok fölé. A kiterjesztés kikapcsolása eltávolítja a méretező osztályt. Az új modul nem indít API-kérést vagy játékműveletet.

Helyi teszt: `npm run test:addon:home`. A próba valódi MV3-bővítményt tölt be külön Chromium-profilban, a nyilvános kliens DOM/CSS-struktúrájából készült mintafelülettel. Nem használ valódi karaktert. Hat fül, hat ablakméret, tárolás, újranyitás, újrarenderelés, eredeti vezérlők, bútorpozíciók, megerősítés és más modalok érintetlensége szerepel benne.

Frissítéshez cseréld le a kibontott addon fájljait, töltsd újra a bővítményt a `chrome://extensions` oldalon, majd frissítsd a játék lapját. Az aktuális verzió **0.11.0**.

## 0.9.7 kipróbálása helyben

Kísérő-tooltip hibajavítás: a helyi `capture.js` valóban továbbítja a teljes megfigyelt `pets` listát külön `pet-roster` csomagban, még a statisztikai mezők ellenőrzése előtt. Ez nem azonos a GitHubon még látható 0.9.4-es forrással. Az azonosítás saját rekordazonosító alapján történik; a numerikus és szöveges azonosítók DOM-nak megfelelő normalizálást kapnak. Ütköző azonosító nem használható egyedi képesség hozzárendelésére.

A fajbónusz elsődleges forrása az adott sor saját, látható `.pet-card__bonus` felirata; más kísérő kártyája, összesített karakterbónusz vagy következő szint ajánlata nem használható. A jelenlegi nyilvános kliens nem igazol külön, numerikus szerveres végértékmezőt: ennek nevét és mértékegységét nem találgatjuk. Ha nincs közvetlen felirat, a megfigyelt saját rekordból és az igazolt V3-képletből számolunk. Az `it()` kliensfüggvény szerint a forma `form ?? bond ?? 1`, a `Kn()` szerint a kihagyott rang 0. Ez nem állandó +4%-os fajérték. Hibás, kifejezetten megadott mező nem kap ilyen alapértéket; puszta fajnévből nem következtetünk saját rangra vagy tanult képességre.

Az **Atlas adatgyűjtés → Kísérő-tooltip helyi diagnosztika** megmutatja a kapott/felismert és sikeresen társított rekordok számát, a játékfeliratból olvasott/számított/nem elérhető bónuszok számát, a hiányzó mezőket és az azonosítási hibák típusát. Nem tartalmaz saját azonosítót, kísérőnevet, szintet vagy konkrét képességlistát; nem része az anonim exportnak. A rész megnyitásakor frissül. Sikertelen társítás esetén a tooltip sem helyettesíti az állatot a fő kísérővel.

A javítást `npm run test:addon:pets:browser` ellenőrzi: aktív és inaktív Keselyűfióka, inaktív Mohaagancs, Hópárduckölyök, hiányos rekord, sor-újrarenderelés és fülváltás. A próbák közben nincs aktiválás és nincs `/api/pets/*` kérés. A natív MV3-próba numerikus saját azonosítóval és kihagyott rang-/formamezővel is fut.

A projekt `addons/stonestorm-statcap-overlay/` mappáját közvetlenül betöltheted a `chrome://extensions` oldalon, vagy kicsomagolhatod a helyi `downloads/stonestorm-statcap-overlay.zip` fájlt. Már telepített példánynál cseréld a fájlokat, nyomj Újratöltést a bővítményen, majd frissítsd a játék lapját. Ellenőrizd a 0.11.0 verziót.

1. Nyisd meg a játék **Stat limitek** paneljét, majd a **📥 Atlas adatgyűjtés** részt. Indítsd el a 60 másodperces gyűjtést, és nyisd meg az Otthont, Szobákat vagy az Arénát. A megtartott válaszminták kategóriánként láthatók; ugyanannak a végpontnak a legutolsó mintája marad meg.
2. A Chrome-ikon popupja ugyanennek a játéklapnak a gyűjtését mutatja. Bármelyik felületről exportálhatsz vagy leállíthatsz; az export és a leállítás törli a helyi mintákat. A 60 másodperc lejárta után új minta nem gyűlik, a korábbi letölthető.
3. Karakterlap → Kísérők: vidd az egeret egy nem fő kísérő portréjára vagy nevére, vagy Tab-bal fókuszáld. Nem kell aktiválni. A tooltip külön mutatja a fajbónuszt, a harci traitet, a signature-t és a saját tanult képességeket. Escape, görgetés és fülváltás bezárja; a játékgombok működnek.

Az egyedi kísérőadat a már megfigyelt `/api/character` válasz `pets` tömbjéből jön. A forma/rang csak az előbb leírt, kliensben igazolt alapértékekkel egészíthető ki. Hiányzó tanult készséglista **ismeretlen**, nem üres lista és nem egy másik állat képessége. A faj azonosításához elsődlegesen a kliens `data-pet` sorazonosítója kell. Csak név alapján legfeljebb nyilvános fajleírás és a sorban valóban megjelenített adat használható.

A V3 fajbónusz a megvizsgált kliensben `fajérték × (10 × formaszorzó + rangrészesedés × érvényes rang)`, nem egyszerű szintszorzó. A trait külön kap szint-, forma-, ritkaság- és rangskálázást; a signature szintje a forma. Azonos signature és tanult skill nem adódik össze. A tooltip kliensképletből számít feltételes hatásokat; a szerver által ténylegesen összesített, plafonok utáni értéket nem állítja ismertnek. A gyűjteményi könyvbónusz és harcerő teljes összegzése nincs kikövetkeztetve.

A közös modell `js/pet-detail-model.js`, a verziózott nyilvános adat `data/addon-pet-model.json`. Frissítés: `npm run refresh:addon:pets`, majd `npm run build:addon`. A generátor hash-elt importokból keres, ellenőrzi a használt kliensképleteket, megváltozott logikánál leáll. 403-as kezdőlapnál jelzi, hogy a jelenlegi belépőmodul nem volt igazolható. A `pet-model.js` és `pet-data.js` generált másolat, nem külön kézi adatbázis.

Ellenőrzés: `npm test`, `npm run test:addon:095:browser`, `npm run test:addon:095:native`, `npm run test:sync`, `npm run build:pages`, `npm run test:pages`. A böngészős próbák modellezett játéklappal futnak, valódi játékfiók nélkül. A natív próba külön Chromium-profilt és valódi MV3-betöltést használ, a MAIN és ISOLATED világ, a zárt panel és az igazi Chrome-popup közötti működést is ellenőrzi; a saját tesztprofilját törli. Ehhez a teljes Playwright Chromium szükséges, a headless shell önmagában nem támogatja a bővítményt.

A bővítmény a Stonestorm karakteradatait, felszerelésbónuszait és statlimitjeit jeleníti meg a játék fölött. **BÉTA: felismerési hibák, hiányos vagy elavult játékadatok előfordulhatnak.**

## Ingyenes telepítés asztali Chrome-ban

1. Töltsd le a ZIP-et: https://legivok2.github.io/stonestorm-atlas/downloads/stonestorm-statcap-overlay.zip
2. Csomagold ki egy állandó mappába. A kiválasztandó mappa közvetlenül tartalmazza a `manifest.json` fájlt.
3. Írd a címsorba: `chrome://extensions`, majd kapcsold be a **Fejlesztői módot**.
4. Válaszd a **Kicsomagolt bővítmény betöltése / Load unpacked** lehetőséget, és jelöld ki ezt a mappát.
5. Frissítsd a `https://stonestorm.gg/` játékoldalt. A ZIP telepítése nem Chrome Web Store-telepítés.

A telepítési és újratöltési lépések alapja a [Chrome hivatalos útmutatója](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).

## Kézi frissítés

Az Atlas jobb alsó sarkában a **⚔ Stat Addon – BÉTA** panel jelzi az új kiadást. Az Atlas nem olvassa ki automatikusan a telepített Chrome-bővítmény verzióját: opcionálisan megadhatod a saját verziódat, vagy az „Ezt a verziót telepítettem” gombbal rögzítheted. Enélkül az előzőleg látott kiadáshoz hasonlít. Ez a jelzés nem telepít semmit automatikusan.

Töltsd le az új ZIP-et, és a kibontott új fájlokkal cseréld le a korábbi bővítményfájlokat **ugyanabban az állandó mappában**. A `chrome://extensions` oldalon a meglévő bővítmény **Újratöltés** gombját használd, majd frissítsd a játék lapját is. Ne a bővítmény eltávolításával frissíts, mert az törölheti a helyi beállításokat. Az új ZIP-et ne a régi mappán belüli új almappába bontsd.

Az Atlas panel mobilon is használható; ez a telepítési útmutató asztali Chrome-ra vonatkozik.

## Ellenőrzés és adatkezelés

A projekt gyökerében: `npm run test:addon:source`. A teszt az átadott `capture-refresh.test.js` fájlt futtatja változatlanul. Csomagkészítés: `npm run build:addon`. Kiadási leírás: [PUBLISH.md](PUBLISH.md), adatkezelési összefoglaló: [PRIVACY.md](PRIVACY.md).
## Anonim kutatási export – 0.9.7 BÉTA

A 0.9.4-ben bevezetett kutatási exportot a 0.9.7 Chrome-popupja és statisztikai panelje közösen használja. A statisztikai számítások változatlanok; a régi szkriptek minimális csatlakozásait a fent leírt regressziós teszt ellenőrzi.

1. A frissített bővítményt kicsomagolva töltsd be a `chrome://extensions` oldalon. Meglévő telepítésnél használd az Újratöltés gombot, majd frissítsd a játék lapját.
2. A játék statisztikai paneljének **📥 Atlas adatgyűjtés** részében vagy a bővítmény ikonjánál válaszd a **Mintagyűjtés indítása** gombot.
3. A következő 60 másodpercben nyisd meg az Otthont, a Szobákat és az Aréna megfelelő módjait. A bővítmény nem indít kérést, csak a játék által indított, előre engedélyezett GET-válaszokat figyeli.
4. Bármelyik felületen válaszd az **Anonimizált JSON letöltése** gombot. Ismeretlen válaszséma vagy csak személyes állapot esetén nem készül minta.
5. A letöltött fájlt helyben átnézheted. Megosztása külön, kézi döntés; automatikus feltöltés nincs.

Csak engedélyezett katalógusazonosítók és numerikus szabály-/ármezők exportálhatók. Fiókazonosító, játékosnév, ellenféllista, egyenleg, aktuális karakter-/szobaszint, készlet, cookie, token, kérésfejléc és időbélyeg nem kerül a mintába. Egy következő szint ajánlata feltételes megfigyelés: nem bizonyít általános árképletet. Ismeretlen mező alapértelmezésben kimarad. A Leállítás és törlés gomb a memóriában tartott mintákat is törli; letöltés után szintén törlődnek.
# Data Engine V2 kiegészítés

A tooltip számítási modulja az Atlas és a Planner közös modelljének másolata. Új, nem támogatott nyilvános kísérőséma esetén nem alkalmazza észrevétlenül a korábbi képletet. A játék saját sorában megjelenő pontos bónuszfelirat továbbra is elsőbbséget kap.

Az **Atlas adatgyűjtés** indításakor a játék által már elküldött, engedélyezett nyilvános faj- és képességkonfiguráció is felhasználható. Ez nem saját kísérőlista: egyedi azonosító, tanult képesség vagy személyes állapot nem exportálódik. Az indítás helyi újraközlést kér; nem indít új API-kérést. A gyűjtés alatt érkező `/api/content` válasz ugyanezen szigorú engedélylistán halad át. A ZIP újratöltése után a játék lapját is frissítsd.
