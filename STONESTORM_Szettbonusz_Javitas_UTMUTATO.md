# Stonestorm Atlas – teljes szettbónuszok javítása

## Mit javít?

A 2026-11-06-i játékadatból a `spine.sets.full`, `spine.lines.scaled` és `spine.lines.percent` alapján helyreállítja az M1–M6 szettcsaládok 2/4/6 darabos bónuszait. Az M4 (Romőr) teljes sora a játékban megosztott képernyőképekkel egyezik. A többi öt szett értéke ugyanezen mentett játékadatból számított, nem külön játékbeli képpel igazolt.

| Szett | 2 darab | 4 darab | 6 darab |
|---|---|---|---|
| M1 | HP +100 | Támadás +10, Boss +8% | Gyógyital-hatás +8% |
| M2 | Támadás +27 | HP +288, Boss +8,2% | Képesség-sebzés +17,9% |
| M3 | HP +467 | Támadás +42, Boss +8,2% | Kritikus sebzés +29,7% |
| M4 – Romőr | Támadás +56 | HP +638, Boss +8,3% | Életlopás +3,5% |
| M5 | HP +805 | Támadás +70, Boss +8,4% | Sebzéscsökkentés +8,4% |
| M6 | Támadás +81 | HP +940, Boss +8,4% | Kritikus sebzés +44,8% |

## Telepítés / futtatás

1. A `fix_stonestorm_set_bonuses.mjs` fájlt másold a GitHub-projekt (`Legivok2/stonestorm-atlas`) főmappájába, a `package.json` mellé.
2. Nyisd meg ezt a mappát VS Code-ban.
3. A VS Code termináljában futtasd:

   ```powershell
   node fix_stonestorm_set_bonuses.mjs
   ```

4. A script ellenőrzi a 6 szettet, szükség esetén újragenerálja az Atlas adatfájljait, majd három automatikus tesztet futtat. Végül indítsd:

   ```powershell
   npm test
   git diff --stat
   git add source-data/01_felszerelesek_es_szettek.json scripts/build-data.mjs data/atlas.json js/atlas-data.js data/set-bonus-evidence.json tests/set-bonuses.test.mjs
   git commit -m "Fix Stonestorm full set bonuses M1-M6"
   git push
   ```

   Ha nincs változás, mert már korábban lefuttattad, a commit kihagyható.

## Pontosan mit módosít?

- `source-data/01_felszerelesek_es_szettek.json`: mind a hat szett aktív bónuszai.
- `scripts/build-data.mjs`: eltérő, pontos eredetjelzés a screenshot alapján bizonyított M4 és a számított többi szett esetén; ez későbbi újragenerálásnál is fennmarad.
- `data/atlas.json`, `js/atlas-data.js`: az oldal és a karaktertervező által használt adatok.
- `data/set-bonus-evidence.json`: ellenőrizhető javítási összefoglaló.
- `tests/set-bonuses.test.mjs`: 3 ellenőrző teszt.

A felszerelési statokat, bónuszsapkát, egyéb szettadatokat, addon működését nem módosítja. Nem kapcsolódik a Chrome Web Store-hoz. A képernyőképen látható „Szett-bónusz +2%” külön mechanika, nem keverendő a szett alapsoraival.

## Korlát

A GitHub App integráció az automatikus közvetlen írást 403 hibával blokkolta, ezért ezzel a lokálisan futtatandó szkripttel végezhető el a javítás. A `git push` a saját GitHub-hitelesítéseddel történik. A GitHub Pages telepítés esetleg külön akcióhibát jelezhet, de nem maga a szettjavítás oka.
