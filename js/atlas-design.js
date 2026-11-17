/* Presentation components only. Game rules and image bindings stay in their models. */
globalThis.AtlasDesign={
  init(ui){
    const {db,media,esc,num,pct,icon,chip,slots,rarities,classNames,route,label,value,notice}=ui;
    const illustration=(category,name,alt,cls='')=>media.render(media.get(category,name),{alt,className:cls,eager:true});
    const smallStat=(name,v)=>`<div><dt>${esc(name)}</dt><dd>${esc(v)}</dd></div>`;
    function navigation(categories){
      const groups=[['Felfedezés',['overview','world','pets','mounts']],['A karaktered',['equipment','sets','classes','materials']],['Közösség és otthon',['home','arena','guild']],['Tervezés és tudás',['planner','compare','viewer','stat-limits','bonuses','mechanics','gallery','updates','sources']]];
      const seen=new Set();return groups.map(([title,ids])=>{const rows=ids.map(id=>categories.find(c=>c[0]===id)).filter(Boolean);rows.forEach(c=>seen.add(c[0]));return `<div class="atlas-nav-group"><p>${esc(title)}</p>${rows.map(navLink).join('')}</div>`;}).join('')+categories.filter(c=>!seen.has(c[0])).map(navLink).join('');
      function navLink([id,title,img,svg]){return `<a href="${route(id)}" data-atlas-page="${id}">${icon(svg)}<span>${esc(title.replace(/^📊\s*/,''))}</span>${id==='equipment'?`<small>${db.items.length}</small>`:id==='pets'?`<small>${db.pets.length}</small>`:''}</a>`;}
    }
    function overview(){
      return `<section class="atlas-portal" aria-labelledby="portal-title"><div class="portal-art">${illustration('scenes','backdrop_bamboomoon','Bambuszerdő a holdfényben · játékbeli hangulatillusztráció')}</div><div class="portal-copy"><p class="eyebrow">A VIHAR VILÁGA · MAGYAR KÓDEX</p><h1 id="portal-title">Stonestorm <em>Atlas</em></h1><p>A következő kalandod itt kezdődik.<br>Ismerd meg a világot. Tervezd meg a hősöd.</p><form id="atlas-portal-search" role="search"><label class="sr-only" for="portal-query">Mit keresel az Atlasban?</label>${icon('search')}<input id="portal-query" type="search" placeholder="Tárgy, kísérő, boss…" autocomplete="off"><button type="submit" aria-label="Keresés indítása">${icon('compass')}</button></form><div class="portal-links"><a href="#atlas/pets">Kísérők ↗</a><a href="#atlas/equipment">Felszerelések ↗</a><a href="#atlas/planner">Karaktertervező ↗</a></div></div><span class="portal-caption">BAMBUSZERDŐ · A STONESTORM VILÁGA</span></section>
      <div class="atlas-section-title"><div><p class="eyebrow">VÁLASZD KI A KÖVETKEZŐ FEJEZETET</p><h3>Fedezd fel a világot</h3></div><span>${num(media.catalog.stats.available)} helyi illusztráció</span></div>
      <div class="discovery-grid">${[
        ['pets','Kísérők','Társak öt fejlődési formában.','pets','pet_vulture_3',db.pets.length+' FAJ','creature'],
        ['equipment','Felszerelések','Találd meg a következő fegyvered.','weapons','w_ninja_l10',db.items.length+' TÁRGY','equipment'],
        ['world','Világ és bossok','Pályák, ellenfelek és kazamaták.','scenes','backdrop_stormpeak',db.maps.length+' PÁLYA','world']
      ].map(([page,title,copy,category,name,badge,type])=>`<a class="discovery-card discovery-${type}" href="${route(page)}"><div class="discovery-art">${illustration(category,name,title)}${chip(badge)}</div><div><h4>${esc(title)}</h4><p>${esc(copy)}</p><span>Felfedezem <b>↗</b></span></div></a>`).join('')}</div>
      <div class="atlas-journeys">${[
        ['home','Otthon','Építsd fel a saját menedéked.','home_t4','guild'],['arena','Aréna','Becsület vagy a Bandita Liga trónja?','arena','scenes'],['guild','Céhrendszer','Közös építkezés, közös fejlődés.','guildyard_hq_t2','scenes']
      ].map(([page,title,copy,name,category])=>`<a href="${route(page)}">${illustration(category,name,title)}<span><h4>${title}</h4><p>${copy}</p></span><b>↗</b></a>`).join('')}</div>
      <div class="atlas-editorial"><div><p class="eyebrow">AZ ELSŐ LÉPÉSEK</p><h4>Most érkezel a világba?</h4><p>A kezdőkalauz a karakteralkotástól a napi rutinig vezet végig.</p><a class="atlas-inline-link" href="#utmutato">Kezdőkalauz →</a></div><div><p class="eyebrow">ELLENŐRIZHETŐ TUDÁS</p><h4>Amit tudunk. Amit még kutatunk.</h4><p>Dátumozott források, jelölt eltérések és külön kezelt megfigyelések.</p><a class="atlas-inline-link" href="#atlas/updates">Frissítések és források →</a></div></div>`;
    }
    function card({page,kind,record:x},desc,summary,glyph){
      const type=kind==='pet'?'pet':kind==='item'?'equipment':['boss','mob','map','dungeon'].includes(kind)?'world':'record';
      const image=media.forRecord(kind==='boss'?'mob':kind,kind==='boss'?x.mobId:x.id);
      const art=image?media.render(image,{alt:x.name,thumbnail:kind!=='pet',className:'card-illustration'}):glyph;
      const rarity=kind==='pet'?rarities[x.rarity]??x.rarity:null;
      const badge=kind==='item'?'T'+x.tier:rarity??({boss:'BOSS',mob:'ELLENFÉL',map:'PÁLYA',dungeon:'KAZAMATA',set:'SZETT',research:'KUTATÁS'})[kind]??'KÓDEX';
      const level=x.level??x.minLevel??x.itemLevel??x.recommendedLevel;
      const kicker=kind==='item'?slots[x.slot]:({pet:'Kísérő',boss:'Világ boss',mob:'Ellenfél',map:'Felfedezés',dungeon:'Kihívás',set:'Szettcsalád',research:'Kutatás',mount:'Hátas'})[kind]??'Tudástár';
      const stats=kind==='item'?Object.entries(x.values??{}).filter(([,v])=>v!==0).slice(0,2).map(([k,v])=>smallStat(label(k),value(k,v))).join(''):kind==='boss'?smallStat('Ajánlott szint',x.recommendedLevel)+smallStat('Pálya',x.mapIndex):'';
      return `<a class="atlas-card card--${type} rarity-${esc(x.rarity??'common')} ${image?'has-game-art':''}" href="${route(page,kind,x.id)}"><div class="card-visual"><div class="card-labels">${chip(badge,'card-rarity')}${level!==undefined?`<span class="card-level">${esc(level)}. szint</span>`:''}</div><div class="card-art">${art}</div>${kind==='pet'?'<span class="card-form-label">1. SZINT · KÖLYÖK · 0. RANG</span>':''}</div><div class="card-copy"><p class="card-kicker">${esc(kicker)}</p><h4>${esc(x.name??x.id)}</h4><p class="atlas-card-meta">${esc(summary)}</p><p class="atlas-card-desc">${esc(kind==='pet'?desc.split(' · ')[0]:desc??'Tulajdonságok és kapcsolódó tartalmak.')}</p>${stats?`<dl class="card-stats">${stats}</dl>`:''}<div class="atlas-card-foot"><span>${kind==='item'?esc((x.classes??[]).map(c=>classNames[c]??c).join(' · ')||'Minden kaszt'):kind==='pet'?'Fajbónusz és fejlődés':'Részletes adatlap'}</span><b aria-hidden="true">↗</b></div></div></a>`;
    }
    function detail({kind,x,id,image,body,actions,source,glyph,pictures,english}){
      const template=document.createElement('template');template.innerHTML=body;const sections={overview:[],bonuses:[],development:[],acquisition:[],related:[]};let calculator='';
      for(const node of [...template.content.childNodes]){
        if(node.nodeType!==1){if(node.textContent.trim())sections.overview.push(esc(node.textContent));continue;}
        if(kind==='pet'&&node.matches('.pet-calculator')){calculator=node.outerHTML;continue;}
        const title=node.querySelector(':scope > h4,:scope > h5')?.textContent??'';let tab='overview';
        if(node.matches('.pet-development-detail')||/Fejlesztés|Fejlődés/.test(title))tab='development';
        else if(/Kapcsolódó|Szettkapcsolat/.test(title))tab='related';
        else if(/Feloldás|Követelmények|Minta forrása/.test(title))tab='acquisition';
        else if(/statisztikák|bónusz|Jutalom|Kasztképesség/i.test(title))tab='bonuses';
        sections[tab].push(node.outerHTML);
      }
      if(kind==='pet'&&calculator){const fragment=document.createElement('template');fragment.innerHTML=calculator;const result=fragment.content.querySelector('[data-pet-calc-result]');if(result){for(const node of result.querySelectorAll('[data-pet-bonus]'))node.removeAttribute('data-pet-bonus');sections.bonuses.push(`<section data-pet-bonus-summary>${result.innerHTML}</section>`);}}
      sections.related.push(pictures);sections.overview.push(`<details class="folio-source"><summary>Források és adatbiztonság</summary>${english}${source}</details>`);
      const tabs=[['overview','Áttekintés'],['bonuses','Bónuszok'],['development','Fejlődés'],['acquisition','Megszerzés'],['related','Kapcsolódó tartalmak']];
      const facts=kind==='pet'?[['Ritkaság',rarities[x.rarity]??x.rarity],['Fejlődési formák',db.petSystem.stages.length],['Végső szint',db.petSystem.maxLevel]]:kind==='item'?[['Hely',slots[x.slot]],['Követelményszint',x.level],['Fokozat','T'+x.tier]]:kind==='boss'?[['Ajánlott szint',x.recommendedLevel],['Pálya',x.mapIndex]]:[];
      if(kind==='item')facts.push(...Object.entries(x.values??{}).filter(([,v])=>v!==0).slice(0,2).map(([k,v])=>[label(k),value(k,v)]));
      if(kind==='boss'){const mob=db.mobs.find(m=>m.id===x.mobId);if(mob)facts.push(['Életerő',num(mob.maxHp)],['Sebzés',num(mob.atkMin)+'–'+num(mob.atkMax)]);}
      return `<div class="folio" data-folio-kind="${esc(kind)}"><header class="folio-hero"><div class="folio-illustration">${image||`<div class="folio-glyph">${glyph}</div>`}${kind!=='pet'?'<p class="folio-art-caption">JÁTÉKBELI ILLUSZTRÁCIÓ · HELYI KÉPKATALÓGUS</p>':''}</div><div class="folio-intro"><p class="eyebrow">STONESTORM ATLAS / ${esc(({pet:'KÍSÉRŐ',item:'FELSZERELÉS',boss:'BOSS',building:'ÉPÜLET'})[kind]??'ADATLAP')}</p><h2 id="atlas-detail-title">${esc(x.name??id)}</h2><dl class="folio-facts">${facts.map(([k,v])=>smallStat(k,v)).join('')}</dl>${actions}${calculator}<details class="folio-identifier"><summary>Adatbázis-azonosító</summary><code>${esc(id)}</code></details></div></header><div class="folio-tabs" role="tablist" aria-label="Adatlap fejezetei">${tabs.map(([key,title],i)=>`<button type="button" role="tab" id="folio-tab-${key}" data-detail-tab="${key}" aria-selected="${i===0}" tabindex="${i===0?0:-1}" aria-controls="folio-panel-${key}">${title}</button>`).join('')}</div>${tabs.map(([key,title],i)=>`<section class="folio-panel" role="tabpanel" id="folio-panel-${key}" aria-labelledby="folio-tab-${key}" ${i?'hidden':''}>${sections[key].filter(Boolean).join('')||notice('Ehhez a fejezethez nincs további igazolt adat. Az áttekintés és a források megmutatják az ismert tulajdonságokat.')}</section>`).join('')}</div>`;
    }
    return {navigation,overview,card,detail};
  }
};
