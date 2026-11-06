# GitHub Pages publikálás

Nyilvános kalauz: **https://legivok2.github.io/stonestorm-atlas/**. A GitHub Pages `workflow` forrása beállítva; minden main-push az ellenőrzött kalauzt vagy az összes engedély rendelkezésre állásakor a teljes Atlast telepíti.

## Technológia és alkalmasság

A Stonestorm Atlas statikus HTML/CSS/vanilla JavaScript oldal. A játékadatok generált helyi JavaScriptből töltődnek be; nincs futásidejű API, PHP, adatbázis vagy backend. A `serve.mjs` fejlesztői kiszolgáló, a GitHub Pages-en nem fut. A hash-alapú útvonalakhoz nincs szükség szerveroldali átirányításra.

Az alkalmazás relatív útvonalakat használ, ezért a `https://<GitHub-név>.github.io/stonestorm-atlas/` projekt-útvonalon is kiszolgálható. A localStorage-mentések originhez kötöttek: a localhoston mentett build nem jelenik meg automatikusan a GitHub Pages másik originjén; a megosztási link konfigurációja átvihető.

Hivatalos dokumentáció:

- [GitHub Pages működése és elérhetősége](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Egyéni GitHub Actions Pages-workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Pages-korlátok](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)

GitHub Free esetén nyilvános repository szükséges a Pages-hez. A publikált oldal legfeljebb 1 GB lehet. A jelenlegi tételes csomag ennél lényegesen kisebb; a pontos bájtszámot az audit és a build közli.

## Jelenlegi publikálási feltételek

1. A korábbi Creator Kithez az `assets/images/sources.json` projektgazdai engedélynyilatkozatot rögzít.
2. A 2103 letöltött kép, az ezekből képzett előnézetek és a játékmentési WebP-k újraközlési engedélye nincs igazolva. A hivatalos letölthetőség ténye rögzített; ez nem önálló újraközlési licenc.
3. A forráscsomag teljes játék-lokalizációt is tartalmazhat; ennek terjesztési hatókörét szintén tisztázni kell.
4. A GitHub CLI bejelentkezése 2026. november 7-én sikerült a Legivok2 fiókkal. Repository: https://github.com/Legivok2/stonestorm-atlas . A saját kód és a korábban engedélyezett Creator Kit felkerült. A nyilvános Pages-kiadás ezekből működő kezdőkalauzt épít; a teljes játékadat-/képcsomag továbbra is helyben marad.

## Saját forráskód frissítése az engedélyek rendezése előtt

A `stage:github:code` külön, tételes fájllistát használ. Nem tartalmaz `source-data/`, `data/`, `Stonestorm_files/`, katalóguskép-/előnézetmappát, `js/atlas-data.js` vagy `js/image-data.js` fájlt. Az engedélyezett Creator Kit megmarad. Az eredeti teljes munkamappából:

```powershell
npm run stage:github:code
git diff --cached --stat
git commit -m "Update Atlas source"
git push origin main
```

A repository új klónja még nem teljes Atlas-adatcsomag; a helyi teljes verzióból semmit nem töröltünk. A workflow először a szükséges adatokat, képeket és az engedélynyilvántartást vizsgálja. Hiány esetén a `build:pages:guide` a meglévő kezdőkalauzt építi ki a korábban engedélyezett képekkel; a kiadási HTML egyértelműen jelzi, hogy a teljes Atlas még nem érhető el. A kereső, napi lista, kaszt-összehasonlító és Creator Kit-galéria működik. A teljes helyi `index.html` és funkciói érintetlenek. Az adatok és engedélyek rendezése után a teljes `stage:github` használható, és a következő push a teljes Atlas-workflow-t indítja.

Az önálló kalauz új klónból is ellenőrizhető, csomagtelepítés nélkül:

```powershell
npm run build:pages:guide
npm run test:pages:guide
```

A build csak a `guideFiles()` tételes, engedélyellenőrzött listáját másolja a `dist/` mappába. Ismeretlen vagy teljes Atlas-fájlokat tartalmazó korábbi `dist/` esetén leáll, így nem szivároghat át egy korábbi build játékanyaga. A workflow kizárólag a `dist/` tartalmát telepíti, nem a forrásmappát.

Az engedélynyilvántartás: `.publication/permissions.json`. A `pending` státuszt csak valós, a nyilvános terjesztésre kiterjedő engedély/licenc és annak forráshivatkozása alapján szabad `confirmed` értékre állítani. Nem szükséges a helyi szerkesztéshez vagy a kizárólag helyi előnézethez.

## Kiszűrt állományok

A feltöltési jelölt tételes engedélylistával készül. A mentett `Stonestorm.html`, az eredeti játék-JS/CSS, ZIP/HAR, `.integration`, `.env`, helyi credential-/kulcsfájlok, belső környezeti mappák és történeti, személyes fejlesztői leírások kimaradnak. A `.gitignore` további védelmet ad, de önmagában nem helyettesíti az auditot.

A titokkereső többek között GitHub/AWS/Google kulcsmintát, JWT-t, privát kulcsot, beégetett credentialértékeket, URL-be írt hitelesítési adatot és személyes Windows home-útvonalat keres. Értéket nem ír a jelentésbe, csak fájlt, sort és típust. Ez mintákon alapuló ellenőrzés, nem minden lehetséges személyes adat felismerésének garanciája. A jelentés helyben marad: `.publication/audit.json`.

## Helyi ellenőrzés, publikálás nélkül

```powershell
npm run audit:inspect
npm run prepare:github:review
npm run build:pages:preview
npm run test:pages:preview
npm run preview:pages
```

Megnyitás: `http://localhost:4174/stonestorm-atlas/`. Az előnézet `.integration/pages-preview/` alatt készül, nincs GitHub-kapcsolata és nem válik publikációs csomaggá. A teszt az összes tételes erőforrásra HTTP-kérést küld a projekt-alkönyvtáron keresztül, ellenőrzi a relatív HTML/CSS-utakat és a kizárt fájlokat.

Az engedélyvizsgálatot is érvényesítő, nyilvános kiadás:

```powershell
npm run audit:publish
npm run build:pages
npm run test:pages
```

A `build:pages` nem állít elő `dist/` publikációs csomagot, amíg tisztázatlan jog vagy potenciális titok marad. A helyi teljes alkalmazást nem módosítja és nem távolít el működő funkciót.

## Repository létrehozása és első publikálás

Csak az engedélyaudit sikeres lezárása után, a megfelelő GitHub-fiókkal:

```powershell
gh auth login --hostname github.com --git-protocol https --web
gh auth status
```

A böngészős GitHub-jóváhagyást a fiók tulajdonosa végzi el. Jelszót/PAT-ot nem kell a chatbe írni. A GitHub-bővítmény újracsatlakoztatása és a helyi CLI bejelentkezése külön munkamenet lehet.

Ezután az auditált forráscsomagból, ellenőrzött Git-identitással:

```powershell
git init -b main
npm run stage:github
git diff --cached --stat
git commit -m "Publish Stonestorm Atlas"
gh repo create stonestorm-atlas --public --source . --remote origin --push
```

A `stage:github` csak a tételesen auditált fájlokat adja a Git indexéhez, és engedélyhiánynál leáll. A teljes eredeti munkamappán ne használj ellenőrizetlen `git add .` parancsot. Meglévő repository esetén a létrehozás helyett előbb az origin tulajdonosát és a meglévő történetet kell ellenőrizni. Az első commit előtt beállított Git-név és e-mail szükséges; személyes e-mail helyett használható a GitHub-fiók noreply címe.

A GitHub repositoryban: **Settings → Pages → Build and deployment → Source: GitHub Actions**. A `.github/workflows/pages.yml` main ágra érkező pushkor, illetve kézzel indítva:

1. ellenőrzi a forrásokat és az adat-/modellteszteket;
2. lefuttatja a titok- és engedélyauditot;
3. elkészíti és alkönyvtáron teszteli a `dist/` tartalmát;
4. csak a `dist/` mappát adja át a Pages-artifactnak;
5. a build sikeressége után telepít a `github-pages` környezetbe.

A build nem igényel npm-csomagtelepítést, Python/Pillow-t vagy játékfiókot: a repositoryban ellenőrzött, már generált adatokat használja. A teljes nyers adat-/képkatalógus újragenerálásához helyben Python/Pillow kellhet.

A GitHub Pages API-beállításhoz repository-admin/Pages-jog, a Git feltöltéshez tartalomírás, a workflow feltöltéséhez Actions/workflow-jog is szükséges lehet. A workflow saját futási jogosultságai külön korlátozottak: a deploy job `pages: write` és `id-token: write` engedélyt kap, általános repositoryírást nem.

## Frissítés később

```powershell
# Szerkesztés, és adatforrásváltozás esetén npm run build:data
npm run check
npm test
npm run audit:publish
npm run build:pages
npm run test:pages
npm run stage:github
git diff --cached --stat
git commit -m "Update Atlas content"
git push origin main
```

A workflow automatikusan újratelepít. A `dist/`, tesztjelentések és helyi előnézetek nem kerülnek a forrás-repositoryba. Minden új képnél az engedély hatókörét is ellenőrizni kell. A kész publikus URL-t mindig a sikeres GitHub-deployment eredményéből kell átvenni, nem feltételezett fióknévből összeállítani.
