# Future Content Watcher V1 – helyi átadás

Ellenőrzés: 2026-11-21T13:23:41.371Z. Éles publikálás és valódi Discord-küldés nem történt.

## Eredmény

A Közelgő tartalmak oldal működik: http://localhost:4173/#atlas/upcoming

Az élő API-verzió fbc93606674a; a szintplafon 60, a legmagasabb felszerelési szint 60, az XP-tábla 60 bejegyzésből áll. Hat pálya, négy kazamata és legfeljebb ötös tier szerepel a konfigurációban. Nincs igazolt 99-es szintemelés vagy M7 pálya a feldolgozott API-ban.

A teljes leltár 33844 bejegyzést őriz. A 15 jelzés 13 kikapcsolt funkciókapcsoló és két újonnan megfigyelt képhivatkozás. Ezek nem frissítési ígéretek. A tételes források, azonosítók és dátumok a [vizsgálati jelentésben](future-content.md) szerepelnek. A magyar és angol lokalizáció feldolgozása sikeres; a kliens teljes hivatkozásgráfja a futási keret miatt részlegesen ellenőrzött.

## Megvalósított működés

- Moduláris elemzők, stabil azonosítók, öt bizonyítottsági státusz, teljes régi/új értékek és megőrzött változástörténet.
- Sötét-arany felület, dinamikus szintpanel, szűrők, idővonal, képek és lenyitható bizonyítékok; ellenőrzött asztali és mobilnézet.
- Önálló forráspillanatkép és tranzakciós visszaállítás, a jóváhagyott Data Engine-adatok felülírása nélkül.
- Image Collector V2 hivatkozásátadás forrásbizonyítékokkal, automatikus párosítás nélkül.
- Hatórás GitHub Actions-fázis és csak érdemi változásra kért Pages-build. Az ismételt élő vizsgálat nulla új eseményt, nulla értesítést és változatlan megjelenített tartalmat eredményezett.
- Opcionális, secretből olvasott Discord-webhook, tartós deduplikálás, sikertelen kézbesítés utáni újrapróbálás és méretkorlátos üzenetek.

## Ellenőrzések

147 alapteszt sikeres, továbbá az addon forrásellenőrzése. Az import visszaállítását és a képrendszert vizsgáló integrációs csomag 24 tesztje sikeres. Az utólag hozzáadott valódi Collector-híd tesztjével a külön képfelderítési csomag 18/18 tesztje sikeres.

Sikeres a szintaxis- és hivatkozásellenőrzés, a DOM-teszt, a statikus build, a Pages alkönyvtárának HTTP-tesztje, a publikációs audit, az új oldal böngészős tesztje és a meglévő dizájn regressziós tesztje. A harci böngészőteszt mind a 80 kazamataterem pontos adatait, a statlimiteket és az addon játékpanel-összevetését is ellenőrizte.

A 60→99 változás, az M7, az új kazamata, szettcsalád, grafika és aktiválódó kapcsoló szimulált tesztadat; ezek nem kerültek az élő leltárba. A böngészős teszt mind az öt státuszt, az idővonal régi/új értékeit, az üres találatot és a sikertelen friss lekérés melletti működést is vizsgálta.

Gépi ellenőrzési eredmények: [future-content-verification.json](future-content-verification.json). Használat és korlátok: [dokumentáció](../docs/FUTURE_CONTENT_WATCHER.md).

## Átadási állapot

A helyi szerver HTTP 200 választ ad. Az alkalmazás beépített böngészőjének elérési szolgáltatása nem volt elérhető; a helyi URL és a valódi Chromium-ellenőrzés működött. Az éles GitHub- és Discord-beállítások nem változtak. A hatórás automatikus működés az itt elkészített változások közzététele után indulhat el.
