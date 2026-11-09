import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {root,guideFiles,audit,walk,scanText} from './publication-plan.mjs';

// Kizárólag a kiadási HTML-t alakítjuk át; a teljes helyi Atlas érintetlen marad.
export function guideHtml(source){
  let html=source;
  function replace(pattern,replacement){
    if(!pattern.test(html))throw Error('Megváltozott a kalauz HTML-szerkezete: '+pattern);
    html=html.replace(pattern,replacement);
  }
  html=html.replace(/^.*<script src="js\/(?!content\.js|main\.js)[^"]+" defer><\/script>.*\r?\n/gm,'');
  html=html.replace(/^.*<link rel="stylesheet" href="css\/atlas-tools\.css" \/>.*\r?\n/gm,'');
  html=html.replace(/^.*<link rel="stylesheet" href="css\/stat-addon\.css" \/>.*\r?\n/gm,'');
  html=html.replace(/    <button id="stat-addon-toggle"[\s\S]*?<\/section>\r?\n/,'');
  replace(/<nav id="main-nav"[\s\S]*?<\/nav>/,`<nav id="main-nav" aria-label="Fő navigáció">
          <a class="active" href="#kezdolap" aria-current="location">Kezdőlap</a>
          <a href="#utmutato">Kezdőkalauz</a>
          <a href="#karakteralkotas">Kasztok</a>
          <a href="#napi-rutin">Napi rutin</a>
          <a href="#tudasbazis">Keresés</a>
          <a href="#atlas">Atlas státusz</a>
        </nav>`);
  replace(/<section id="atlas"[\s\S]*?<\/section>/,`<section id="atlas" class="atlas-section" aria-labelledby="atlas-heading">
        <div class="container">
          <div class="atlas-masthead"><div><p class="eyebrow">A NYILVÁNOS KIADÁSRÓL</p><h2 id="atlas-heading">A kalauz már böngészhető.</h2></div></div>
          <p>A kezdőkalauz, a kereső, a napi ellenőrzőlista, a kaszt-összehasonlító és az engedélyezett képgaléria szabadon megnyitható ezen a linken.</p>
          <p>A teljes Atlas, a játékadatlapok, a katalógusképtár és a karaktertervező még nem érhető el a nyilvános kiadásban: a hozzájuk tartozó játékanyagok újraközlési engedélyének rendezésére várunk.</p>
          <a class="button button-gold" href="#utmutato">Tovább a kezdőkalauzhoz <span aria-hidden="true">→</span></a>
        </div>
      </section>`);
  replace(/<div class="hero-actions">[\s\S]*?<\/div>/,`<div class="hero-actions">
            <a class="button button-gold" href="#utmutato">Olvasd a kezdőkalauzt <span aria-hidden="true">→</span></a>
            <a class="hero-secondary" href="#tudasbazis">Keresés a tudástárban</a>
          </div>`);
  replace(/<p class="hero-description">[\s\S]*?<\/p>/,`<p class="hero-description">Kezdőlépések, kasztválasztás és napi kalandok.<br />Fedezd fel a Stonestorm magyar kalauzát,<br class="desktop-break" /> és vágj neki felkészülten a játéknak.</p>`);
  html=html.replace(/2026\. november 6-i adatpillanatkép/g,'Nyilvános kezdőkalauz');
  replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/>/,`<meta name="description" content="Magyar Stonestorm kezdőkalauz: kasztválasztás, napi rutin, kereshető útmutatók és képgaléria. Megnyitható böngészőben, telepítés nélkül." />`);
  replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,`<meta property="og:description" content="Magyar kezdőkalauz, kaszt-összehasonlító, napi lista és kereshető tudástár. A teljes Atlas kiadása előkészítés alatt." />`);
  html=html.replace(/href="#atlas[^"\s]*"/g,'href="#atlas"');
  return html;
}

export function buildGuide(){
  const files=guideFiles(),report=audit(files);
  if(report.missing.length||report.secretOrPersonalFindings.length||report.rightsPending.length||report.largeFiles.length)throw Error('A kalauz engedély-/titokellenőrzése sikertelen.');
  const html=guideHtml(fs.readFileSync(path.join(root,'index.html'),'utf8'));
  if(scanText(html,'index.html').length)throw Error('Nem publikálható adat van a generált HTML-ben.');
  const destination=path.join(root,'dist');
  // Soha ne maradjon korábbi, a kalauzhoz nem engedélyezett fájl az artifactban.
  const unexpected=walk(destination).map(file=>path.relative(destination,file).split(path.sep).join('/')).filter(file=>!files.includes(file));
  if(unexpected.length)throw Error('A dist idegen vagy teljes Atlas-fájlokat tartalmaz; nem publikáljuk: '+unexpected.join(', '));
  for(const file of files){
    const target=path.join(destination,file);
    fs.mkdirSync(path.dirname(target),{recursive:true});
    if(file==='index.html')fs.writeFileSync(target,html);else fs.copyFileSync(path.join(root,file),target);
  }
  console.log(`Publikálható kezdőkalauz: dist/, ${files.length} ellenőrzött fájl. A teljes helyi Atlas változatlan.`);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))buildGuide();
