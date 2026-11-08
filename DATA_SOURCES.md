# Stonestorm Atlas – adatforrások és megbízhatóság

Integráció dátuma: **2026-11-06**. Kizárólag a felhasználó által helyben átadott fájlok feldolgozása történt. Nem hívtunk élő játék-API-t, nem használtunk fiókadatot, privát végpontot vagy játékbeli módosító műveletet.

## Forrásjegyzék

### Stat limitek és közölt játékosértékek (2026-11-08)

A kritikus rendszer kiegészítése: a `harcero.combat.hero.critMult = 1.5` és a `harcero.rules.supportCaps.critDamage = 0.75` a helyi `05_kasztok_kepessegek_harcertek.json` fájlban ellenőrzött; a harci `hero.supportCaps.critDamage` ugyancsak 0.75. A kalkulátor a megadott hozzáadó képletet használja, nem állít teljes harci sebzésképletet.

A fegyverbónusz-táblázat hat szintsávja és harminc T1–T5 értéke a projektgazda által megadott 2026-11-06-i `spine.lines.percent` klienskivonatból származik. A helyi `02_kovacsolas_bonuses_kovek.json` `stones.items.line.tiers.critDamage` adataival a 6/12/20/28/40%-os alaptier ellenőrizhető. A mentett kliens kódja valóban `fromLevel` alapján választ a `lines.percent` sávokból, de a helyi tematikus JSON nem tartalmazza a teljes magasabb szintű `spine.lines.percent` listát. Ezért a magasabb sávokat nem nevezzük ettől függetlenül ellenőrzött szerveradatnak; a generálási esélyek ismeretlenek.

A `js/stat-limits.js` a központi limitadatbázis. A `harcero.rules.reductionCap = 0.75`, `critCap = 0.5` és `evadeCap = 0.12` értékeket a `source-data/05_kasztok_kepessegek_harcertek.json` mentett szabályaival egyeztettük. Ezekből a 75%-os sebzéscsökkentési, 50%-os kritikus és 12%-os bosskitérési korlát szerepel a kalkulátorban. Nyers védelmi pontból nincs átváltás.

A normál ellenfelekre vonatkozó 35%-ot a projektgazda adta meg játékbeli súgóadatként. A mentett magyar `tipCapped` szöveg valóban megkülönbözteti a boss- és normálkorlátot, de helyettesítési paramétereket tartalmaz; a 35%-os számérték forrása itt a projektgazdai közlés.

A +84,7% teljes XP, +31,1% felszerelés-XP, +130% teljes nyang és +116,4% felszerelés-nyang a projektgazda által közölt játékos-képernyőképek adatai. Nem önállóan megvizsgált képfájlok vagy maximummérések. Az ezek közötti különbségek számított különbségek; a felület nem nevezi őket függetlenül mért egyéb bónusznak. A számtani összeg nem igazolja a tényleges játékbeli érvényesülést.

### Új képadatbázis és Planner-források

- `stonestorm_image_tools/manifest.json`: 2124 kategorizált bejegyzés; a `variants` metaadat nem önálló kategórialista.
- `stonestorm_image_tools/results.csv`: 2035 downloaded, 68 already_exists, 21 ValueError. A video WebP-k hiányoznak, új letöltés nem történt.
- `stonestorm_image_tools/downloaded/`: 2103 érvényes WebP, 26 kategória; 2077 különböző SHA-256 tartalom, 18 duplikátumcsoport.
- `data/image-catalog.json`, `js/image-data.js`, `data/image-audit.json`: 882 azonosított, 314 részben azonosított, 907 ismeretlen kapcsolatú kép; teljes fájl-/hash-/kép- és engedélyjegyzék. A kis előnézetek `assets/catalog-thumbs/` alatt vannak, az eredeti képek változatlanok.
- A mentett kliens kizárólag szövegesen vizsgált `MD/o1/i1` karakterkép-választása és `Kn/Kv/$v` fejlesztésképlete. A statikus bizonyítékkivonat és a forrásfájl lenyomata: `data/client-rule-evidence.json`. A kliens nem fut a Wikiban.
- A tárgyak `art` mezője elsőbbséget kap a puszta fájlnévegyezéssel szemben. 48 tárgynál a tényleges `family` mező igazolja a szettkapcsolatot. A `portrait`/`portraitTier` mező a karakterkinézetet azonosítja, nem követelményszintet.

Az új generálási lánc: `npm run build:data` → játékadat-generátor + `scripts/build-images.py`. Részletes kategória-, párosítási és felületi leírás: `docs/IMAGE_INTEGRATION.md`; a Planner pontos számítási és hiánykezelési szabályai: `docs/CHARACTER_PLANNER.md`.

### Korábbi, változatlan játékadatforrások

| Helyi forrás | Tartalom és felhasználás |
| --- | --- |
| `js/content.js`, `index.html` eredeti kalauza | A 2026-10-31-én feldolgozott Discord-útmutató korábbi magyar feldolgozása. A cikkek, GYIK, kasztösszehasonlító és napi lista megőrizve; a globális kereső is indexeli őket. Részletes lefedettség: `CONTENT_AUDIT.md`. |
| `ATLAS_VSCODE_KEZIKONYV.md` | A prototípus sémája, céhes képletek, ellenőrzési példák, ismert hiányok, képeredet. Teljes egészében átolvasva, eredeti tartalma megőrizve. |
| `Stonestorm_Codex_VSCode_Starter.zip` | `.integration/starter/` alá kicsomagolt referencia; kód- és adatszerkezetének hasznos részei a meglévő alkalmazásba beépítve. Nincs második közzétett alkalmazás. |
| `source-data/00_forrasjegyzek.json` | Eredeti gyűjtési idő, lefedettség és az API-/lokalizációs pillanatképek lenyomatai. A hivatkozott teljes nyers `stonestorm-public-content-2026-11-06.json` nincs a kapott csomagban. |
| `source-data/01_felszerelesek_es_szettek.json` | 182 tárgy és 6 szettcsalád; név, ID, szint, tier, kaszt, stat, ár, szettbónusz, bosskapcsolat. |
| `source-data/02_kovacsolas_bonuses_kovek.json` | Kovácsolási alapesélyek, tier szerinti esélyek és pluszszorzók bekerülnek az Atlasba. A teljes bónusz-/kőanyag a nyers fájlban megmarad. |
| `source-data/03_kiserok.json` | 22 faj; bónuszok, rarity, trait, signature, tojás, kazamata, közös készségek, rules és v3 formák. |
| `source-data/04_hatasok.json` | 8 hátas; magyar név/leírás, szint, ár, bérleti napok, időszorzó. |
| `source-data/05_kasztok_kepessegek_harcertek.json` | 4 kaszt alapértékei és készségei; 3 királyság magyar neve/mottója. |
| `source-data/06_terkepek_szornyek_bossok_kazamatak.json` | 6 pálya, 64 ellenfél, 6 boss, 4 kazamata. Az eredeti részletes termek, pályahelyszínek, statok és jutalmak megmaradnak. |
| `source-data/07_portyak_vadaszat_energia.json` | Energia, portya, őrjárat és háttér-vadászat. A régebbi expedition és újabb spine.energy adatai külön értelmezve. |
| `source-data/08_anyagok_penzugyek_boltok.json` | 131 alapanyag/fogyóeszköz, limitek, céhes gyorsítási ársávok. |
| `source-data/09_otthon_tanulmanyok_egyeb_fejlodes.json` | 14 kutatási lépés, mintaforrások, jutalmak. A technikai dataHome mezőből nem következtetünk házbónuszra. |
| `source-data/10_teljesitmenyek_kuldetesek.json` | 8 teljesítményszett az adatcsomagban; a részletes küldetések/eredmények nyers formában megőrizve, külön UI még nincs. |
| `source-data/11_cehes_epuletek_szintek_es_szabalyok.json` | 5 épület × 15 szint, hatás- és időképletek, rangok, hiányzó nyang-/alapanyagértékek. |
| `source-data/12_rendszerkapcsolok_es_limitek.json` | Kliensverzió (`ac0984e054de`), limitek és funkciókapcsolók. A generátor a verziót felhasználja; a kapcsolókból nem állít aktuális játékhozzáférést. |
| `source-data/13_teljes_magyar_forditas.json` | Az eredeti magyar base és expanded lokalizáció, nem kézzel kitalált fordítások. A releváns kategória-/statcímkéket és a tematikus fájlokban eleve lokalizált rekordokat használjuk. |

A tematikus fájlok metadata mezője az eredeti nyilvános `/api/content` és a magyar kliensmodulok 2026-11-06-i pillanatképét nevezi meg. Ezek **a csomagban közölt eredetadatok**: a mostani munkamenet nem bizonyítja az API jelenlegi tartalmát.

## Generálás, azonosítók és deduplikáció

`npm run build:data` → `scripts/build-data.mjs` → `data/atlas.json`, `js/atlas-data.js`, `data/image-manifest.json`.

- A forrásadat a `source-data/`, a megjelenítés a `js/atlas.js`, a számítás a `js/atlas-math.js` feladata.
- Az API eredeti `id` az állandó kulcs. A magyar név nem egyedi kulcs. Az eltérő régi kalauz- és új API-kasztazonosítókat nem kevertük össze.
- Azonos ID-jú és azonos tartalmú tárgy/kísérő/hátas/szett összevonható; azonos ID-jú, eltérő tartalmú rekordnál a generátor hibával megáll.
- Minden fő rekord `provenance.source`, `checkedAt`, `status` és `scope` mezőt kap. Minden forrásfájl hash-e a `db.sources` jegyzékben van.
- A `nameEn` értéke ismeretlen, ha nincs igazolt angol lokalizáció. A hiányzó magyar név helyett az eredeti ID jelenik meg, a névhiány jelölésével.
- Szettcsaládok címe: szerkesztői pályanévcímke, `nameIsEditorial: true`. A `familyId` az eredeti családazonosító. Szettkapcsolatot kizárólag az item `family` mezője igazol, azonos szint nem.
- A teljes magyar lokalizáció, forrás-JSON és ZIP nem szükséges a futásidejű felületnek; a generált JS-adatcsomag teszi lehetővé a fetch nélküli használatot.

## Megbízhatósági kategóriák

| Jelölés | Értelmezés |
| --- | --- |
| Ellenőrzött adat / `verified` | Közvetlenül szerepel a mentett forrásban. Nem jelenti az élő szerver jelenlegi állapotának ellenőrzését. |
| Képletből számolt / `derived` | Dokumentált képletből számolt érték, például céhes idő és érmés gyorsítás. |
| Részben ellenőrzött / `observed` | Megfigyelés vagy tisztázatlan verzió/hálózati hatókör; nem globális szabály. |
| Ismeretlen / `unknown` | Nincs megbízható adat; nem nullával helyettesítjük. |

A felhasználó által kitöltött XP/energia sorok **saját mérések**, nem a játékból importált állítások. Nem mentjük vagy küldjük el őket.

## Eltérő források kezelése

| Eltérés | Döntés és indok |
| --- | --- |
| `guildSpeedup` és `skip.guild_building` | A kézikönyv a tényleges céhes gombhoz 20/50/100 VÉ/megkezdett óra szabályt és két megfigyelést ír le. Ezt használja a kalkulátor; a másik konfiguráció eltérését feltüntetjük. |
| `expedition.refill` 3 VÉ és `spine.energy.refill` 10-től növekvő árak | Mindkét adatot megtartjuk. Nem választunk belőlük általános aktuális árat. |
| `petRules.traitLevelScale` és `petForms.traitLevelScale` | Verziófüggőként elkülönítve. Nincs bizonyítatlan összbónusz-számítás. |
| `dataHome` elnevezés és házrendszer | A mező tartalma feloldási/kovácsbeállítás, nem ház-/bútoradat. A ház XP-bónusza és korlátja ismeretlen. |
| Kézikönyv 47 kép, ZIP ténylegesen 48 WebP | A fájlok megszámolása és SHA-256 összevetése alapján **48**. A kézikönyvet történeti forrásként nem írtuk át; a javítás itt és a felületen szerepel. |
| 2026-10-31-i kalauz és 2026-11-06-i kliensadat | A dátumokat elkülönítjük. A régi narratív útmutató megmarad, az új táblázatok a mentett kliensadatot tükrözik. Nem állítunk általános időbeli elsőbbséget minden eltérő szabályra. |

## Képeredet és felhasználás

### Korábbi Creator Kit

`assets/images/`: 10 eredeti promóciós/játékkép három-három WebP méretben, logó és favicon. Ez **12 eredeti grafika / 32 fájl**. Eredet, korábbi jognyilatkozat, eredeti hash és képméretek: `assets/images/sources.json`; részletes leírás: `IMAGE_SOURCES.md`.

### Játékmentési grafikák

`Stonestorm_files/`: a ZIP-ben szereplő mind a 48 WebP-nek bájtra azonos párja van itt. Az Atlas az alábbi **20** meglévő fájlt használja, átnevezés vagy képmódosítás nélkül:

- Navigáció/rendszerikon: `btn_character.webp`, `btn_hunt.webp`, `btn_guild.webp`, `btn_city.webp`, `btn_tower.webp`, `btn_help.webp`, `btn_arena.webp`, `btn_premium.webp`, `emblem_storm.webp`.
- Épület: `bld_hq.webp`, `bld_forge.webp`, `bld_dojo.webp`, `bld_warehouse.webp`, `bld_banner.webp`.
- Céhes udvar: `guildyard_base.webp`.
- Azonosított boss: `m4_boss.webp`, kizárólag a 4. pálya bossának adatlapján/kártyáján.
- Erőforrás: `energy.webp`, `nyang_small.webp`, `coin_dragon.webp`, `luck_ore.webp`.

Pontos útvonalak, SHA-256, ZIP-beli eredeti útvonal, felhasználási kör és engedélyállapot: `data/image-manifest.json`. Ezekhez `permission: unverified-public-reuse` tartozik. A korábbi Creator Kit-engedélyt nem terjesztettük ki automatikusan a játékmentési képekre.

A további, újonnan átadott katalógusból mind a 182 tárgyhoz, 22 kísérőhöz és 8 hátashoz elérhető kép. A kísérők fajkapcsolata részleges státuszú, a grafikai sorszám fejlődési jelentése nincs igazolva. Egy fájlnév nem hoz létre új tárgystatisztikát. A képkatalógus egészéhez `permission: unverified-public-reuse` tartozik, a korábbi Creator Kit-engedély erre sem terjed ki automatikusan.

## Futásidejű kizárások

`Stonestorm.html`, a mentett játék JS/CSS-fájljai, `.integration/`, a ZIP és a nyers JSON-ok nem kerülnek be az alkalmazás futási útvonalába. A saját `serve.mjs` csak a szükséges alkalmazáskönyvtárakat és a mentési mappa WebP-it szolgálja ki, és tiltja a könyvtárbejárást. A forrásokban leírt jogosultságfüggő céh-/játékosvégpontokat az Atlas nem hívja meg.
