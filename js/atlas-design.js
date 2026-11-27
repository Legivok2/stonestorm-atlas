/* Presentation components only. Game rules and image bindings stay in their models. */
globalThis.AtlasDesign={
  init(ui){
    const {db,media,esc,num,pct,icon,chip,slots,rarities,classNames,route,label,value,notice}=ui;
    const i18n=globalThis.AtlasI18n,t=(key,params)=>i18n.t(key,params);
    const illustration=(category,name,alt,cls='',altKey='')=>{
      const html=media.render(media.get(category,name),{alt,className:cls,eager:true});
      return altKey?html.replace('<img ',`<img data-atlas-i18n-alt="${esc(altKey)}" `):html;
    };
    const smallStat=(name,v)=>`<div><dt>${esc(name)}</dt><dd>${esc(v)}</dd></div>`;
    function navigation(categories){
      const groups=[['group.explore',['overview','world','pets','mounts']],['group.character',['equipment','sets','classes','materials']],['group.community',['home','arena','guild']],['group.planning',['planner','compare','viewer','stat-limits','bonuses','mechanics','gallery','updates','sources']]];
      const seen=new Set();return groups.map(([key,ids])=>{const rows=ids.map(id=>categories.find(c=>c[0]===id)).filter(Boolean);rows.forEach(c=>seen.add(c[0]));return `<div class="atlas-nav-group"><p data-atlas-i18n="${key}">${esc(globalThis.AtlasI18n.t(key))}</p>${rows.map(navLink).join('')}</div>`;}).join('')+categories.filter(c=>!seen.has(c[0])).map(navLink).join('');
      function navLink([id,title,img,svg]){const key='navigation.'+id;return `<a href="${route(id)}" data-atlas-page="${id}">${icon(svg)}<span data-atlas-i18n="${esc(key)}">${esc(globalThis.AtlasI18n.t(key))}</span>${id==='equipment'?`<small>${db.items.length}</small>`:id==='pets'?`<small>${db.pets.length}</small>`:''}</a>`;}
    }
    function overview(){
      return `<section class="atlas-portal" aria-labelledby="portal-title"><div class="portal-art">${illustration('scenes','backdrop_bamboomoon','Bambuszerdő a holdfényben · játékbeli hangulatillusztráció','','overview.heroAlt')}</div><div class="portal-copy"><p class="eyebrow" data-atlas-i18n="overview.eyebrow">A VIHAR VILÁGA · MAGYAR KÓDEX</p><h1 id="portal-title">Stonestorm <em>Atlas</em></h1><p><span data-atlas-i18n="overview.intro1">A következő kalandod itt kezdődik.</span><br><span data-atlas-i18n="overview.intro2">Ismerd meg a világot. Tervezd meg a hősöd.</span></p><form id="atlas-portal-search" role="search"><label class="sr-only" for="portal-query" data-atlas-i18n="overview.searchLabel">Mit keresel az Atlasban?</label>${icon('search')}<input id="portal-query" type="search" placeholder="Tárgy, kísérő, boss…" data-atlas-i18n-placeholder="overview.searchPlaceholder" autocomplete="off"><button type="submit" aria-label="Keresés indítása" data-atlas-i18n-label="overview.searchButton">${icon('compass')}</button></form><div class="portal-links"><a href="#atlas/pets"><span data-atlas-i18n="navigation.pets">Kísérők</span> ↗</a><a href="#atlas/equipment"><span data-atlas-i18n="navigation.equipment">Felszerelések</span> ↗</a><a href="#atlas/planner"><span data-atlas-i18n="navigation.planner">Karaktertervező</span> ↗</a></div></div><span class="portal-caption" data-atlas-i18n="overview.caption">BAMBUSZERDŐ · A STONESTORM VILÁGA</span></section>
      <div class="atlas-section-title"><div><p class="eyebrow" data-atlas-i18n="overview.choose">VÁLASZD KI A KÖVETKEZŐ FEJEZETET</p><h3 data-atlas-i18n="overview.discover">Fedezd fel a világot</h3></div><span>${num(media.catalog.stats.available)} <span data-atlas-i18n="overview.illustrations">helyi illusztráció</span></span></div>
      <div class="discovery-grid">${[
        ['pets','Kísérők','Társak öt fejlődési formában.','pets','pet_vulture_3',db.pets.length,'overview.species','overview.petCopy','creature'],
        ['equipment','Felszerelések','Találd meg a következő fegyvered.','weapons','w_ninja_l10',db.items.length,'overview.items','overview.equipmentCopy','equipment'],
        ['world','Világ és bossok','Pályák, ellenfelek és kazamaták.','scenes','backdrop_stormpeak',db.maps.length,'overview.maps','overview.worldCopy','world']
      ].map(([page,title,copy,category,name,count,badgeKey,copyKey,type])=>`<a class="discovery-card discovery-${type}" href="${route(page)}"><div class="discovery-art">${illustration(category,name,title,'','navigation.'+page)}<span class="atlas-chip" data-atlas-i18n="${badgeKey}" data-count="${count}">${esc(globalThis.AtlasI18n.t(badgeKey,{count}))}</span></div><div><h4 data-atlas-i18n="navigation.${page}">${esc(title)}</h4><p data-atlas-i18n="${copyKey}">${esc(copy)}</p><span><span data-atlas-i18n="overview.explore">Felfedezem</span> <b>↗</b></span></div></a>`).join('')}</div>
      <div class="atlas-journeys">${[
        ['home','Otthon','Építsd fel a saját menedéked.','home_t4','guild','overview.home','overview.homeCopy'],['arena','Aréna','Becsület vagy a Bandita Liga trónja?','arena','scenes','navigation.arena','overview.arenaCopy'],['guild','Céhrendszer','Közös építkezés, közös fejlődés.','guildyard_hq_t2','scenes','navigation.guild','overview.guildCopy']
      ].map(([page,title,copy,name,category,titleKey,copyKey])=>`<a href="${route(page)}">${illustration(category,name,title,'',titleKey)}<span><h4 data-atlas-i18n="${titleKey}">${title}</h4><p data-atlas-i18n="${copyKey}">${copy}</p></span><b>↗</b></a>`).join('')}</div>
      <div class="atlas-editorial"><div><p class="eyebrow" data-atlas-i18n="overview.firstSteps">AZ ELSŐ LÉPÉSEK</p><h4 data-atlas-i18n="overview.newcomer">Most érkezel a világba?</h4><p data-atlas-i18n="overview.guideCopy">A kezdőkalauz a karakteralkotástól a napi rutinig vezet végig.</p><a class="atlas-inline-link" href="#utmutato" data-atlas-i18n="overview.guideLink">Kezdőkalauz →</a></div><div><p class="eyebrow" data-atlas-i18n="overview.verified">ELLENŐRIZHETŐ TUDÁS</p><h4 data-atlas-i18n="overview.known">Amit tudunk. Amit még kutatunk.</h4><p data-atlas-i18n="overview.sourcesCopy">Dátumozott források, jelölt eltérések és külön kezelt megfigyelések.</p><a class="atlas-inline-link" href="#atlas/updates" data-atlas-i18n="overview.sourcesLink">Frissítések és források →</a></div></div>`;
    }
    function card({page,kind,record:x},desc,summary,glyph){
      const type=kind==='pet'?'pet':kind==='item'?'equipment':['boss','mob','map','dungeon'].includes(kind)?'world':'record';
      const nameKey=globalThis.AtlasI18n.gameNameKey(kind,x),nameI18n=!!nameKey;
      const recordName=kind==='set'&&x.nameIsEditorial&&i18n.getLocale()==='en'?t('sets.familyName',{map:t('sets.mapName.'+x.familyId)}):nameI18n?t(nameKey):x.name??x.id;
      const image=media.forRecord(kind==='boss'?'mob':kind,kind==='boss'?x.mobId:x.id);
      const art=image?media.render(image,{alt:recordName,thumbnail:kind!=='pet',className:'card-illustration'}):glyph;
      const rarity=kind==='pet'?rarities[x.rarity]??x.rarity:null;
      const rarityClass=x.rarity?`rarity-${esc(x.rarity)}`:'';
      const badge=kind==='item'?t('equipment.tierBadge',{tier:x.tier}):kind==='set'?t('sets.badge'):kind==='mount'?t('mounts.kicker'):rarity??({boss:'BOSS',mob:t('world.mobBadge'),map:t('world.mapBadge'),dungeon:t('world.dungeonBadge'),set:'SZETT',research:'KUTATÁS'})[kind]??'KÓDEX';
      const level=x.level??x.minLevel??x.itemLevel??x.recommendedLevel;
      const kicker=kind==='item'?t('equipment.slot.'+x.slot):kind==='set'?t('sets.kicker'):kind==='pet'?t('pets.kicker'):kind==='mount'?t('mounts.kicker'):kind==='skill'?t('pets.skill.kicker'):({boss:t('world.bossKicker'),mob:t('world.mobKicker'),map:t('world.mapKicker'),dungeon:t('world.dungeonKicker'),set:'Szettcsalád',research:'Kutatás'})[kind]??'Tudástár';
      const stats=kind==='item'?Object.entries(x.values??{}).filter(([,v])=>v!==0).slice(0,2).map(([k,v])=>smallStat(label(k),value(k,v))).join(''):kind==='boss'?smallStat(t('world.recommendedLevel'),x.recommendedLevel)+smallStat(t('world.map'),x.mapIndex):'';
      const footer=kind==='item'?(x.classes??[]).map(c=>classNames[c]??c).join(' · ')||t('equipment.allClasses'):kind==='set'?t('sets.badgeFoot'):kind==='pet'?t('pets.footer'):t('common.detail');
      const levelText=level===undefined?'':t('common.levelBadge',{level:num(level)});
      return `<a class="atlas-card card--${type} ${rarityClass} ${image?'has-game-art':''}" href="${route(page,kind,x.id)}"><div class="card-visual"><div class="card-labels">${chip(badge,'card-rarity')}${level!==undefined?`<span class="card-level">${esc(levelText)}</span>`:''}</div><div class="card-art">${art}</div>${kind==='pet'?`<span class="card-form-label">${esc(t('pets.card.form',{form:1,stage:t('pets.form.1'),rank:0}))}</span>`:''}</div><div class="card-copy"><p class="card-kicker">${esc(kicker)}</p><h4 ${nameI18n?`data-atlas-i18n="${esc(nameKey)}"`:''}>${esc(recordName)}</h4><p class="atlas-card-meta">${esc(summary)}</p><p class="atlas-card-desc">${esc(kind==='pet'?desc.split(' · ')[0]:desc??'Tulajdonságok és kapcsolódó tartalmak.')}</p>${stats?`<dl class="card-stats">${stats}</dl>`:''}<div class="atlas-card-foot"><span>${esc(footer)}</span><b aria-hidden="true">↗</b></div></div></a>`;
    }
    function detail({kind,x,id,image,body,actions,source,glyph,pictures,english}){
      const template=document.createElement('template');template.innerHTML=body;const sections={overview:[],bonuses:[],development:[],acquisition:[],related:[]};let calculator='';
      for(const node of [...template.content.childNodes]){
        if(node.nodeType!==1){if(node.textContent.trim())sections.overview.push(esc(node.textContent));continue;}
        if(kind==='pet'&&node.matches('.pet-calculator')){calculator=node.outerHTML;continue;}
        const title=node.querySelector(':scope > h4,:scope > h5')?.textContent??'';let tab='overview';
        if(node.matches('.pet-development-detail')||/Fejlesztés|Fejlődés|Upgrading|Development/.test(title))tab='development';
        else if(/Kapcsolódó|Szettkapcsolat|Related|Set membership/.test(title))tab='related';
        else if(/Feloldás|Követelmények|Minta forrása|Requirements/.test(title))tab='acquisition';
        else if(/statisztikák|bónusz|Jutalom|Kasztképesség|stats|bonuses/i.test(title))tab='bonuses';
        sections[tab].push(node.outerHTML);
      }
      if(kind==='pet'&&calculator){const fragment=document.createElement('template');fragment.innerHTML=calculator;const result=fragment.content.querySelector('[data-pet-calc-result]');if(result){for(const node of result.querySelectorAll('[data-pet-bonus]'))node.removeAttribute('data-pet-bonus');sections.bonuses.push(`<section data-pet-bonus-summary>${result.innerHTML}</section>`);}}
      sections.related.push(pictures);sections.overview.push(`<details class="folio-source"><summary>${t('common.sources')}</summary>${english}${source}</details>`);
      const localizeRecord=['item','set','pet','mount','skill','map','mob','boss','dungeon'].includes(kind),tabs=localizeRecord?[['overview',t('common.tab.overview')],['bonuses',t('common.tab.bonuses')],['development',t('common.tab.development')],['acquisition',t('common.tab.acquisition')],['related',t('common.tab.related')]]:[['overview','Áttekintés'],['bonuses','Bónuszok'],['development','Fejlődés'],['acquisition','Megszerzés'],['related','Kapcsolódó tartalmak']];
      const facts=kind==='pet'?[[t('pets.detail.rarity'),rarities[x.rarity]??x.rarity],[t('pets.detail.forms'),db.petSystem.stages.length],[t('pets.detail.finalLevel'),db.petSystem.maxLevel]]:kind==='item'?[[t('equipment.slot'),t('equipment.slot.'+x.slot)],[t('equipment.level'),x.level],[t('equipment.tier'),'T'+x.tier]]:kind==='set'?[[t('sets.level'),x.itemLevel],[t('sets.slots'),x.slots.map(slot=>t('equipment.slot.'+slot)).join(', ')]]:kind==='boss'?[[t('world.recommendedLevel'),x.recommendedLevel],[t('world.map'),x.mapIndex]]:[];
      if(kind==='item')facts.push(...Object.entries(x.values??{}).filter(([,v])=>v!==0).slice(0,2).map(([k,v])=>[label(k),value(k,v)]));
      if(kind==='boss'){const mob=db.mobs.find(m=>m.id===x.mobId);if(mob)facts.push([t('world.hp'),num(mob.maxHp)],[t('world.damage'),num(mob.atkMin)+'–'+num(mob.atkMax)]);}
      const nameKey=globalThis.AtlasI18n.gameNameKey(kind,x),nameI18n=!!nameKey;
      const recordName=kind==='set'&&x.nameIsEditorial&&i18n.getLocale()==='en'?t('sets.familyName',{map:t('sets.mapName.'+x.familyId)}):nameI18n?t(nameKey):x.name??id;
      const eyebrow=localizeRecord?({item:t('equipment.eyebrow'),set:t('sets.eyebrow'),pet:t('pets.eyebrow'),mount:t('mounts.eyebrow'),skill:t('pets.skill.eyebrow'),map:t('world.mapBadge'),mob:t('world.mobBadge'),boss:'BOSS',dungeon:t('world.dungeonBadge')})[kind]:({pet:'KÍSÉRŐ',boss:'BOSS',building:'ÉPÜLET'})[kind]??'ADATLAP';
      const emptySection=localizeRecord?t('common.noSectionData'):'Ehhez a fejezethez nincs további igazolt adat. Az áttekintés és a források megmutatják az ismert tulajdonságokat.';
      const artCaption=localizeRecord?t('common.imageCaption'):'JÁTÉKBELI ILLUSZTRÁCIÓ · HELYI KÉPKATALÓGUS';
      return `<div class="folio" data-folio-kind="${esc(kind)}"><header class="folio-hero"><div class="folio-illustration">${image||`<div class="folio-glyph">${glyph}</div>`}${kind!=='pet'?`<p class="folio-art-caption">${artCaption}</p>`:''}</div><div class="folio-intro"><p class="eyebrow">STONESTORM ATLAS / ${esc(eyebrow)}</p><h2 id="atlas-detail-title" ${nameI18n?`data-atlas-i18n="${esc(nameKey)}"`:''}>${esc(recordName)}</h2><dl class="folio-facts">${facts.map(([k,v])=>smallStat(k,v)).join('')}</dl>${actions}${calculator}<details class="folio-identifier"><summary>${localizeRecord?t('common.identifier'):'Adatbázis-azonosító'}</summary><code>${esc(id)}</code></details></div></header><div class="folio-tabs" role="tablist" aria-label="${localizeRecord?t('common.tabsLabel'):'Adatlap fejezetei'}">${tabs.map(([key,title],i)=>`<button type="button" role="tab" id="folio-tab-${key}" data-detail-tab="${key}" aria-selected="${i===0}" tabindex="${i===0?0:-1}" aria-controls="folio-panel-${key}">${title}</button>`).join('')}</div>${tabs.map(([key],i)=>`<section class="folio-panel" role="tabpanel" id="folio-panel-${key}" aria-labelledby="folio-tab-${key}" ${i?'hidden':''}>${sections[key].filter(Boolean).join('')||notice(emptySection)}</section>`).join('')}</div>`;
    }
    return {navigation,overview,card,detail};
  }
};
