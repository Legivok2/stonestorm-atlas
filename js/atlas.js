/* Az eredeti kalauzt bővítő Atlas. A mentett játékoldal kódját nem futtatjuk. */
(() => {
  'use strict';
  const db=window.STONESTORM_ATLAS, math=globalThis.StonestormMath;
  const media=globalThis.AtlasImages;
  let extension={};
  const $=s=>document.querySelector(s);
  if(!db||!math){$('#atlas-screen').textContent='Az Atlas adatai nem töltődtek be. Ellenőrizd a js/atlas-data.js fájlt.';return;}
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('hu');
  const num=v=>v===null||v===undefined||!Number.isFinite(Number(v))?'Nem ismert':Number(v).toLocaleString('hu-HU',{maximumFractionDigits:2});
  const pct=v=>v===null||v===undefined?'Nem ismert':num(v*100)+'%';
  const slots=db.labels.slots, rarities={common:'Gyakori',rare:'Ritka',heroic:'Hősi',unique:'Egyedi'};
  const classNames=Object.fromEntries(db.classes.map(x=>[x.id,x.name]));
  const buildingEffects={hq:'Céhtagok férőhelye',forge:'Kovácsolási bónusz',dojo:'XP-bónusz',warehouse:'Nyangbónusz',banner:'Céhes portyatámadás'};
  const statNames={atkMin:'Min. sebzés',atkMax:'Max. sebzés',def:'Védelem',defence:'Védelem',maxHp:'Max. életerő',maxSp:'Max. mana',attack:'Támadás',crit:'Kritikus esély',str:'Erő',dex:'Ügyesség',vit:'Vitalitás',int:'Intelligencia',xpMult:'XP-bónusz',nyangMult:'Nyangbónusz',atkMult:'Sebzésbónusz',hpMult:'Életerőbónusz',defMult:'Védelembónusz',critBonus:'Kritikus esély',evadeBonus:'Kitérés',vsBoss:'Bossok ellen',vsBandit:'Banditák ellen',vsOrc:'Orkok ellen',vsAnimal:'Állatok ellen',vsUndead:'Élőholtak ellen',vsHuman:'Emberek ellen',potionHeal:'Gyógyital hatása',skillDamage:'Képességsebzés',dropMult:'Zsákmánybónusz',lifesteal:'Életlopás',ignoreDef:'Védelemáttörés',spCost:'Manaköltség',every:'Ütések közötti gyakoriság',hits:'Találatok száma',mult:'Sebzésszorzó'};
  const label=k=>statNames[k]??k;
  // Százalékos statisztikák kulcs szerint, nem az érték nagysága alapján.
  const fraction=k=>/Mult$|Bonus$|^vs[A-Z]|^(crit|potionHeal|skillDamage|lifesteal|ignoreDef)$/.test(k);
  const value=(k,v)=>fraction(k)?pct(v):num(v);
  const icon=(name,cls='')=>`<svg class="atlas-icon ${esc(cls)}" aria-hidden="true"><use href="#${esc(name)}" /></svg>`;
  const images=Object.fromEntries(db.images.map(x=>[x.id,x.file]));
  const art=(id,alt='',cls='')=>{const picture=['guild','uikit','ui','mobs','scenes','icons'].map(category=>media?.get(category,id)).find(Boolean);return picture?media.render(picture,{className:cls,alt,thumbnail:!cls.includes('detail')}):`<img class="${esc(cls)}" src="${esc(images[id])}" alt="${esc(alt)}" loading="lazy" width="160" height="160" />`;};
  const categories=[
    ['overview','Áttekintés','btn_help','book'],['equipment','Felszerelések','btn_character','swords'],['sets','Szettcsaládok','emblem_storm','shield'],['pets','Kísérők',null,'claw'],['mounts','Hátasok',null,'compass'],['world','Világ és bossok','btn_hunt','compass'],['guild','Céhrendszer','btn_guild','shield'],['home','Otthon és kutatás','btn_city','book'],['mechanics','Energia és fejlődés','energy','spark'],['classes','Kasztok és királyságok','btn_arena','swords'],['materials','Anyagok és tárgyak','btn_premium','anvil'],...(globalThis.AtlasExtensions?.categories??[]),['sources','Források és státusz','btn_help','book']
  ];
  const pageTitle=id=>categories.find(x=>x[0]===id)?.[1]??'Atlas';
  const glyph=(type)=>icon(({weapon:'swords',armor:'shield',helmet:'shield',shield:'shield',boots:'compass',bracelet:'sun',necklace:'spark',earrings:'moon',pet:'claw',mount:'compass',set:'shield',map:'compass',mob:'claw',boss:'claw',dungeon:'book',material:'anvil',research:'book',class:'swords',skill:'spark'})[type]??'book');
  const chip=(s,cls='')=>`<span class="atlas-chip ${esc(cls)}">${esc(s)}</span>`;
  const notice=s=>`<p class="atlas-notice">${esc(s)}</p>`;
  const rows=entries=>`<dl class="atlas-properties">${entries.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
  const statRows=obj=>rows(Object.entries(obj??{}).map(([k,v])=>[label(k),value(k,v)]));
  const table=(heads,body)=>`<div class="atlas-table-wrap"><table class="atlas-table"><thead><tr>${heads.map(x=>`<th scope="col">${esc(x)}</th>`).join('')}</tr></thead><tbody>${body.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const route=(page,kind,id)=>`#atlas/${page}${kind?'/'+kind+'/'+encodeURIComponent(id):''}`;
  const link=(page,kind,x,text)=>x?`<a class="atlas-inline-link" href="${route(page,kind,x.id)}">${esc(text??x.name??x.id)} ↗</a>`:notice('Nincs kapcsolt adat a forrásban.');
  const heading=(title,copy)=>`<div class="atlas-page-heading"><p class="eyebrow">STONESTORM / KÓDEX</p><h3>${esc(title)}</h3><p>${esc(copy)}</p></div>`;
  const sourceNote=x=>`<div class="atlas-source-note">${chip(!x.name?'Részben ellenőrzött adat · névhiány':x.provenance?.status==='derived'?'Képletből számolt adat':'Ellenőrzött adat · mentett forrás',!x.name?'unknown':'verified')}<p>${esc(x.provenance?.source??'ATLAS_VSCODE_KEZIKONYV.md')}<br />${esc(x.provenance?.checkedAt??db.updated)} · A pillanatképben ellenőrzött, az élő szerveren eltérhet.</p></div>`;
  const state={page:'overview',query:'',searchCategory:'all',slot:'all',character:'all',rarity:'all',maxLevel:'',sort:'name',pageNumber:1,world:'maps'};
  const collections={equipment:['item',db.items],sets:['set',db.sets],pets:['pet',db.pets],mounts:['mount',db.mounts],materials:['material',db.economy.stackables],classes:['class',db.classes]};
  const allEntries=[];
  const add=(page,kind,list)=>list.forEach(x=>allEntries.push({page,kind,record:x,title:x.name??x.id,text:norm([x.name,x.id,x.descriptionHu,x.description,x.level,x.rarity,rarities[x.rarity],slots[x.slot],...(x.classes??[]).map(c=>classNames[c]),JSON.stringify(x.values??{}),JSON.stringify(x.perLevel??{})].join(' '))}));
  Object.entries(collections).forEach(([p,[k,list]])=>add(p,k,list));
  [['map','maps'],['mob','mobs'],['boss','bosses'],['dungeon','dungeons']].forEach(([k,p])=>add('world',k,db[p]));
  add('home','research',db.research);
  Object.entries(db.petSkills).forEach(([id,x])=>add('pets','skill',[{...x,id,name:db.petSkillNames[id]?.name??id,description:db.petSkillNames[id]?.desc}]));
  db.guild.buildings.forEach(x=>add('guild','building',[{...x,id:x.kind,name:x.nameHu}]));
  for(const a of window.STONESTORM_CONTENT.articles)allEntries.push({page:'guide',title:a.title,href:'#cikk-'+a.id,text:norm([a.title,a.intro,...a.sections.flatMap(s=>[s.heading,...s.items])].join(' ')),excerpt:a.intro});
  for(const [i,a] of window.STONESTORM_CONTENT.faq.entries())allEntries.push({page:'guide',title:a.question,href:'#gyik-'+i,text:norm(a.question+' '+a.answer),excerpt:a.answer});
  const matches=x=>norm(state.query).split(/\s+/).filter(Boolean).every(t=>x.text.includes(t));

  $('#atlas-stats').innerHTML=[[db.items.length,'felszerelés'],[db.pets.length,'kísérő'],[db.mounts.length,'hátas'],[db.mobs.length,'ellenfél'],[db.guild.buildings.length,'céhes épület']].map(([n,t])=>`<div><strong>${num(n)}</strong><span>${t}</span></div>`).join('');
  $('#atlas-nav').innerHTML=categories.map(([id,title,img,svg])=>`<a href="${route(id)}" data-atlas-page="${id}">${img?art(img):icon(svg)}<span>${title}</span>${id==='equipment'?'<small>'+db.items.length+'</small>':''}</a>`).join('');
  function overview(){
    const tiles=[['equipment','Felszerelések','A fegyvertártól a relikviákig.',`${db.items.length} TÁRGY`,'assets/images/character-warrior-640.webp','Karakterlap · illusztráció'],['world','Világ és ellenfelek','A falu határától a vihar szívéig.',`${db.maps.length} PÁLYA`,'assets/images/boss-flamebeard-640.webp','Flamebeard · harci képernyőkép'],['guild','Építsd fel a céhed','Öt épület, tizenöt szint. Tervezd meg.', 'KALKULÁTOR',images.guildyard_base,'A céhes udvar eredeti grafikája']];
    return heading('Minden kaland tudással kezdődik.','Böngészd a játék adatait, nézd meg az összefüggéseket, és tervezz a kalkulátorokkal.')+
      `<div class="atlas-feature-grid">${tiles.map(([p,t,d,b,img,alt])=>`<a class="atlas-feature" href="${route(p)}"><div class="atlas-feature-art"><img src="${img}" alt="${alt}" loading="lazy" width="640" height="360" />${chip(b)}</div><div class="atlas-feature-copy"><h4>${t}</h4><p>${d}</p><span>Felfedezés <b>↗</b></span></div></a>`).join('')}</div>
      <div class="atlas-section-title"><h4>Válaszd a következő fejezetet</h4><span>FELFEDEZÉSRE VÁR</span></div><div class="atlas-quick-grid">${categories.filter(x=>['sets','pets','mounts','home','mechanics','classes'].includes(x[0])).map(([id,t,img,svg])=>`<a href="${route(id)}">${img?art(img):icon(svg)}<span>${t}<small>${({sets:'2 / 4 / 6 darabos bónuszok',pets:'Fajbónuszok és képességek',mounts:'Utazási idő és bérleti árak',home:'Ismert kutatások, jelölt hiányok',mechanics:'XP / energia összehasonlítás',classes:'Négy kaszt, három királyság'})[id]}</small></span><b>↗</b></a>`).join('')}</div>
      <div class="atlas-editorial"><div>${art('btn_tower')}<h4>Most lépsz be a világba?</h4><p>A megőrzött kezdőkalauz végigvezet az első karaktertől a napi rutinig.</p><a class="atlas-inline-link" href="#utmutato">Olvasd el a kezdőkalauzt →</a></div><div>${chip('ÁTLÁTHATÓ ADATOK','verified')}<h4>Amit tudunk. Amit még keresünk.</h4><p>Az Atlas a 2026. november 6-i helyi adatcsomagot dolgozza fel. A hiányzó költségeket és a verzióeltéréseket külön jelöljük.</p><a class="atlas-inline-link" href="${route('sources')}">Források és ismert hiányok →</a></div></div>`;
  }
  function optionSelect(id,title,options,selected){return `<label>${title}<select id="${id}">${id==='atlas-sort'?'':'<option value="all">Mindegyik</option>'}${Object.entries(options).map(([k,v])=>`<option value="${esc(k)}" ${k===selected?'selected':''}>${esc(v)}</option>`).join('')}</select></label>`;}
  function controls(){
    if(!collections[state.page] && state.page!=='world')return '';
    return `<div class="atlas-filters">${state.page==='equipment'?optionSelect('atlas-slot','Felszerelési hely',slots,state.slot)+optionSelect('atlas-class','Kaszt',classNames,state.character):''}${state.page==='pets'?optionSelect('atlas-rarity','Ritkaság',rarities,state.rarity):''}${state.page==='equipment'?`<label>Legfeljebb ennyi szint<input id="atlas-max-level" type="number" min="1" max="999" placeholder="Bármelyik" value="${esc(state.maxLevel)}" /></label>`:''}${optionSelect('atlas-sort','Rendezés',{name:'Név: A → Z',level:'Szint: növekvő',levelDesc:'Szint: csökkenő'},state.sort)}</div>`;
  }
  const summary=(kind,x)=>{
    if(kind==='item')return `${slots[x.slot]} · ${x.level}. szint`;
    if(kind==='pet')return `${rarities[x.rarity]??x.rarity} · ${x.map}. pálya`;
    if(kind==='mount')return `${x.level}. szint · −${num((1-x.travelMult)*100)}% utazási idő`;
    if(kind==='set')return `${x.itemLevel}. szint · ${x.slots.length} felszerelési hely`;
    if(kind==='map')return `${x.minLevel}–${x.maxLevel}. szint · ${x.spots.length} helyszín`;
    if(kind==='boss')return `${x.recommendedLevel}. ajánlott szint · ${x.mapIndex}. pálya`;
    if(kind==='mob')return `${num(x.level)} szint · ${num(x.maxHp)} HP`;
    if(kind==='dungeon')return `${x.minLevel}–${x.maxLevel}. szint · ${x.rooms.length} terem`;
    if(kind==='research')return `${x.minLevel}. szint · ${x.samplesNeeded} minta`;
    if(kind==='material')return db.economy.stackKindNames[x.kind]?.name??x.kind;
    if(kind==='class')return 'Alapstatisztikák és képesség';
    return 'Részletes játékadat';
  };
  const itemSummary=x=>Object.entries(x.values??{}).filter(([,v])=>v!==0).slice(0,2).map(([k,v])=>label(k)+' '+value(k,v)).join(' · ');
  function card(entry){
    const {page,kind,record:x}=entry;
    const desc=kind==='item'?itemSummary(x):kind==='pet'?Object.entries(x.perLevel).map(([k,v])=>label(k)+' +'+pct(v)+' / szint').join(' · '):kind==='mount'?num(x.price)+' nyang / '+x.days+' nap':kind==='mob'?num(x.xp)+' XP · '+num(x.nyangMin)+'–'+num(x.nyangMax)+' nyang':kind==='research'?Object.entries(x.reward).map(([k,v])=>label(k)+' +'+value(k,v)).join(' · '):kind==='map'?db.bosses.find(b=>b.mapIndex===x.index)?.name:kind==='dungeon'?x.description:kind==='material'?db.economy.stackKindNames[x.kind]?.hint:kind==='set'?x.bonuses.map(b=>b.pieces+' db: '+b.stats.map(s=>label(s.stat)+' +'+value(s.stat,s.value)).join(', ')).join(' · '):'';
    const catalogImage=media?.forRecord(kind==='boss'?'mob':kind,kind==='boss'?x.mobId:x.id);
    const image=catalogImage?null:((kind==='boss'&&x.mobId==='m4_boss')||(kind==='mob'&&x.id==='m4_boss')?'m4_boss':null);
    return `<a class="atlas-card ${catalogImage?'has-game-art':''} rarity-${esc(x.rarity??'')}" href="${route(page,kind,x.id)}"><div class="atlas-card-top"><span class="atlas-medallion" ${catalogImage||image?'':'title="Kategóriaikon; egyedi portré nem áll rendelkezésre"'}>${catalogImage?media.render(catalogImage,{alt:x.name}):image?art(image,x.name):glyph(kind==='item'?x.slot:kind)}</span>${chip(kind==='item'?'T'+x.tier:kind==='pet'?rarities[x.rarity]??x.rarity:kind==='set'?'2 / 4 / 6 DB':'ADATLAP')}</div><h4>${esc(x.name??x.id)}</h4><p class="atlas-card-meta">${esc(summary(kind,x))}</p>${catalogImage?.status==='partial'?chip('Részben azonosított kép','unknown'):''}<p class="atlas-card-desc">${esc(desc??'A forrásban rögzített tulajdonságok és kapcsolódó adatok.')}</p><div class="atlas-card-foot"><span>${kind==='item'?esc((x.classes??[]).map(c=>classNames[c]??c).join(', ')||'Minden kaszt'):'Mentett kliensadat'}</span><b>↗</b></div></a>`;
  }
  function sorted(list){return [...list].sort((a,b)=>state.sort==='name'?(a.title??a.record.name??a.record.id).localeCompare(b.title??b.record.name??b.record.id,'hu'):(state.sort==='levelDesc'?-1:1)*((a.record.level??a.record.minLevel??a.record.itemLevel??a.record.recommendedLevel??0)-(b.record.level??b.record.minLevel??b.record.itemLevel??b.record.recommendedLevel??0)));}
  function paginated(entries){
    const list=sorted(entries),count=Math.ceil(list.length/24);
    state.pageNumber=Math.max(1,Math.min(state.pageNumber,count||1));
    $('#atlas-result-status').textContent=`${list.length} találat${list.length?` · ${state.pageNumber}. oldal / ${count}`:''}`;
    if(!list.length)return `<div class="atlas-empty">${icon('search')}<h4>Nincs ilyen találat.</h4><p>Próbálj más nevet vagy azonosítót, vagy állítsd vissza a szűrőket.</p><button type="button" id="atlas-reset">Szűrők törlése</button></div>`;
    return `<div class="atlas-card-grid">${list.slice((state.pageNumber-1)*24,state.pageNumber*24).map(card).join('')}</div>${count>1?`<div class="atlas-pagination"><button type="button" data-pagination="-1" ${state.pageNumber===1?'disabled':''}>← Előző</button><span>${state.pageNumber} / ${count}</span><button type="button" data-pagination="1" ${state.pageNumber===count?'disabled':''}>Következő →</button></div>`:''}`;
  }
  function collection(){
    const [kind,list]=collections[state.page];
    let entries=allEntries.filter(e=>e.page===state.page&&e.kind===kind);
    if(state.page==='equipment')entries=entries.filter(({record:x})=>(state.slot==='all'||x.slot===state.slot)&&(state.character==='all'||!x.classes?.length||x.classes.includes(state.character))&&(!state.maxLevel||x.level<=Number(state.maxLevel)));
    if(state.page==='pets')entries=entries.filter(({record:x})=>state.rarity==='all'||x.rarity===state.rarity);
    let extra='';
    if(state.page==='pets')extra=`<h4 class="atlas-subheading">Közös kísérőkészségek · 1–5. fokozat</h4>${table(['Képesség','1. fokozat','5. fokozat'],Object.entries(db.petSkills).map(([id,s])=>[link('pets','skill',{id,name:db.petSkillNames[id]?.name??id}),pct(s.values[0]),pct(s.values.at(-1))]))}${notice('A signature a forrásban fajhoz rendelt képesség. A közös készséglista többi eleme nem automatikusan jár minden fajnak. A v3 formák és a régebbi skálázás külön rendszerek.')}`;
    if(state.page==='classes')extra=`<h4 class="atlas-subheading">Három királyság</h4><div class="atlas-kingdoms">${db.kingdoms.map(k=>`<article class="kingdom-${k}"><h4>${esc(db.kingdomNames[k].name)}</h4><p>${esc(db.kingdomNames[k].motto)}</p></article>`).join('')}</div><a class="atlas-inline-link" href="#karakteralkotas">Kaszt-összehasonlítás a kalauzban →</a>`;
    if(state.page==='mounts')extra=travelTool();
    if(state.page==='materials')extra=`<div class="atlas-resource-ribbon"><div>${art('nyang_small','Nyang')}<span>Nyang</span></div><div>${art('coin_dragon','Viharérme')}<span>Viharérme</span></div><div>${art('luck_ore','Szerencseérc')}<span>Szerencseérc · kovácsolási segédanyag</span></div></div>`;
    const copies={equipment:'Valós tárgynevek és alapértékek. A T0–T5 a forrás tier mezője; nem kitalált ritkasági név.',sets:'A szettcsalád címkéje szerkesztői pályanév. Az adatlap az eredeti azonosítót, bónuszokat és bosst is megmutatja.',pets:'Fajbónuszok, ritkaságok, alaptulajdonságok és fejlődési adatok.',mounts:'A hátas az utazási időt módosítja. Energiacsökkentő hatása nem igazolt.',classes:'Magyar kasztnevek a kliensfordításból, az eredeti kalauz megőrzött összehasonlítójával.',materials:'A teljes, 131 elemes alapanyag- és fogyóeszközlista magyar nevekkel.'};
    return heading(pageTitle(state.page),copies[state.page])+paginated(entries)+extra;
  }
  function globalSearch(){
    const entries=allEntries.filter(matches).filter(e=>state.searchCategory==='all'||e.page===state.searchCategory);
    const entity=entries.filter(e=>e.record),guides=entries.filter(e=>e.href);
    const html=entity.length?paginated(entity):'';
    $('#atlas-result-status').textContent=`${entries.length} találat az egész tudástárban · ${entity.length} adatlap, ${guides.length} kalauzcikk / kérdés`;
    return heading('A keresés eredménye','A kereső minden Atlas-kategóriában és a megőrzött kalauz teljes szövegében keres. Ékezet nélkül is használható.')+html+(!entries.length?'<div class="atlas-empty"><h4>Nincs ilyen találat.</h4><p>Próbálj más keresőkifejezést vagy kategóriát.</p><button type="button" id="atlas-reset">Szűrők törlése</button></div>':'')+(guides.length?`<h4 class="atlas-subheading">A kalauzban</h4><div class="atlas-guide-results">${guides.map(e=>`<a href="${e.href}"><h4>${esc(e.title)}</h4><p>${esc(e.excerpt)}</p><span>Útmutató megnyitása ↗</span></a>`).join('')}</div>`:'');
  }
  function world(){
    const tabs=[['maps','Pályák','map'],['bosses','Bossok','boss'],['mobs','Ellenfelek','mob'],['dungeons','Kazamaták','dungeon']];
    const tab=tabs.find(x=>x[0]===state.world);
    return heading('A falu határától a viharig','Pályák, ellenfelek, bossok és kazamaták. Az adatlapok egymásra hivatkoznak.')+`<div class="atlas-tabs" role="group" aria-label="Világ alkategóriák">${tabs.map(([id,t])=>`<button type="button" data-world="${id}" aria-pressed="${id===state.world}">${t} <small>${db[id].length}</small></button>`).join('')}</div>`+paginated(allEntries.filter(e=>e.page==='world'&&e.kind===tab[2]));
  }
  function guild(){
    return heading('Építsd fel a céhed','Fejlesztési tervező, szintenkénti hatások és a dokumentált céhes gyorsítás képlete.')+
      `<div class="atlas-guild-hero"><img src="${images.guildyard_base}" alt="A játék céhes udvara" width="700" height="400" loading="lazy"/><div><p class="eyebrow">ÖT ÉPÜLET. EGY KÖZÖS CÉL.</p><h4>A céhed következő fejezete.</h4><p>Rangok: ${Object.values(db.guildRoles).map(esc).join(' · ')}. A fejlesztés célzott szintenként két órát igényel a mentett szabály szerint.</p><p>A taglétszám- és jogosultsági követelmények szerverfüggők; nincs igazolt globális követelménytáblázat.</p></div></div>
      <details class="atlas-conflict"><summary>Megfigyelt céhes feltételek · részben ellenőrzött</summary><p>A kézikönyv egyetlen vizsgált céhnél minMembers = 3, soloMaxLevel = 3, beszámítható tagsághoz legalább 10. hősszint és 24 óra tagság értékeket rögzít. Ezek nem bizonyított globális szabályok. A céherőd össz-épületszintküszöbei a dokumentumban: 5 / 15 / 30.</p></details>
      <form id="atlas-guild-form" class="atlas-tool"><div class="atlas-tool-title">${icon('anvil')}<h4>Céhes fejlesztési kalkulátor</h4>${chip('KÉPLETBŐL SZÁMOLT','verified')}</div><div class="atlas-tool-fields"><label>Jelenlegi szint<input name="current" type="number" value="10" min="0" max="15" step="1" required /></label><label>Célszint<input name="target" type="number" value="11" min="1" max="15" step="1" required /></label><label>Hátralévő idő az utolsó lépésből (óra)<input name="remaining" type="number" placeholder="Teljes fejlesztési idő" min="0" step="any" /></label></div><p>Az összesítés egy épület egymást követő fejlesztéseire vonatkozik. Minden lépés gyorsítása a saját célszintje szerint számolódik.</p><div id="atlas-guild-output" class="atlas-tool-output" aria-live="polite"></div></form>
      <div id="atlas-building-cards" class="atlas-building-grid"></div><div id="atlas-building-table"></div>
      ${notice('A teljes 1–15. szintű nyang- és alapanyagtáblázat nem ismert. A kalkulátor ezeket nem tekinti nullának. A gyorsítás 1–5. célszinten 20, 6–10. célszinten 50, 11–15. célszinten 100 VÉ minden megkezdett órára. A skip.guild_building konfiguráció ettől eltér; lásd a forráseltéréseket.')}`;
  }
  function updateGuild(){
    const form=$('#atlas-guild-form');if(!form)return;
    const current=form.elements.current.valueAsNumber,target=form.elements.target.valueAsNumber;
    const plan=math.guildPlan(current,target,db.economy.limits.guildSpeedup);
    const remaining=form.elements.remaining.value===''?target*2:form.elements.remaining.valueAsNumber;
    const valid=plan&&Number.isInteger(target)&&target>=1&&remaining>=0&&remaining<=target*2&&Number.isFinite(remaining);
    if(!valid){$('#atlas-guild-output').textContent='Adj meg egész szinteket (0–15), a jelenleginél nem kisebb, legalább 1-es célszintet és érvényes hátralévő időt (0–célszint × 2 óra).';$('#atlas-building-cards').replaceChildren();$('#atlas-building-table').replaceChildren();return;}
    const price=plan.steps?math.speedup(remaining,target,db.economy.limits.guildSpeedup):0;
    $('#atlas-guild-output').innerHTML=rows([['Fejlesztési lépések',plan.steps],['Összes fejlesztési idő',num(plan.hours)+' óra'],['Minden lépés teljes gyorsítása',num(plan.coins)+' VÉ'],['Utolsó lépés hátralévő gyorsítása',num(price)+' VÉ'],['Nyang / alapanyag','Nem ismert']]);
    $('#atlas-building-cards').innerHTML=db.guild.buildings.map(x=>{const l=x.levels.find(l=>l.level===target);return `<a href="${route('guild','building',x.kind)}" class="atlas-building-card">${art('bld_'+x.kind,x.nameHu)}<h4>${esc(x.nameHu)}</h4><strong>${num(l.effect)} ${l.effectUnit==='members'?'fő':'%'}</strong><p>${esc(buildingEffects[x.kind])}<br />${target}. szinten</p></a>`;}).join('');
    $('#atlas-building-table').innerHTML=table(['Épület','Célszint','Hatás','Utolsó lépés ideje','Nyang','Alapanyag'],db.guild.buildings.map(x=>{const l=x.levels.find(l=>l.level===target);return [esc(x.nameHu),target,num(l.effect)+(l.effectUnit==='members'?' fő':'%'),num(l.upgradeHoursToLevel)+' óra','Nem ismert','Nem ismert'];}));
  }
  function home(){
    return heading('Otthon és kutatás','A forrásban lévő kutatások elérhetők. A házrendszer igazolatlan részleteit külön jelöljük.')+`<div class="atlas-home-banner">${art('btn_city')}<div><h4>Házépítés és bútorok</h4><p>Az átadott adatokból nem igazolható a házépítés, a bútorlista, a házfejlesztés ára vagy a ház XP-bónusza és annak korlátja.</p></div>${chip('TOVÁBBI VIZSGÁLAT SZÜKSÉGES','unknown')}</div>`+notice('A dataHome elnevezés technikai adatkulcs: feloldási szinteket és kovácsbeállításokat tárol. Nem bizonyít házrendszert vagy annak jutalmait.')+`<h4 class="atlas-subheading">Kutatások · ${db.research.length} lépés</h4>`+paginated(allEntries.filter(x=>x.page==='home'));
  }
  function travelTool(){return `<form id="atlas-travel-form" class="atlas-tool"><div class="atlas-tool-title">${icon('compass')}<h4>Utazási idő tervező</h4></div><div class="atlas-tool-fields"><label>Alap utazási idő (perc)<input name="minutes" type="number" value="100" min="0" step="any" required /></label><label>Hátas<select name="mount">${db.mounts.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label></div><div id="atlas-travel-output" class="atlas-tool-output" aria-live="polite"></div><p>A 100 perc szemléltető bemenet. A számítás csak időre vonatkozik; az energiafelhasználást nem módosítja.</p></form>`;}
  function updateTravel(){const f=$('#atlas-travel-form');if(!f)return;const x=db.mounts.find(x=>x.id===f.elements.mount.value),r=math.travel(f.elements.minutes.valueAsNumber,x.travelMult);$('#atlas-travel-output').innerHTML=r?rows([['Utazási idő',num(r.minutes)+' perc'],['Megtakarítás',num(r.saved)+' perc'],['Időcsökkenés',pct(1-x.travelMult)]]):'Adj meg érvényes, nem negatív utazási időt.';}
  function mechanics(){
    const energy=db.hunting.energy;
    return heading('Hozd ki a legtöbbet a kalandból','Energiakonfigurációk és saját mérésekkel kitölthető XP / energia összehasonlítás.')+
      `<div class="atlas-mechanic-banner">${art('energy','Energia')}<div><h4>Energia: pillanatkép, verziókkal</h4><p>A limits.energyMax: ${db.economy.limits.energyMax}. A spine.energy napi kiosztása: ${energy.dayGrant}, VIP esetén ${energy.vipDayGrant}. A keret és a napi kiosztás külön fogalom.</p></div></div>`+
      notice(db.conflicts.find(x=>x.id==='energy-refill').description)+table(['Útméret sorszáma','Energiaköltség','Minimumszint'],energy.sizeCost.map((x,i)=>[i+1,x,energy.sizeMinLevel[i]]))+
      `<form id="atlas-xp-form" class="atlas-tool"><div class="atlas-tool-title">${icon('spark')}<h4>XP / energia összehasonlító</h4>${chip('SAJÁT MÉRÉSEK','unknown')}</div><p>Írd be a játékban látott adatokat. A rövid / közepes / hosszú címke itt a saját összehasonlításod; nincs hozzájuk kitalált XP vagy időérték.</p><label>Rendelkezésre álló energia<input type="number" name="budget" min="0" step="any" placeholder="Saját energiakeret" required /></label><div class="atlas-xp-rows">${['Rövid','Közepes','Hosszú'].map((t,i)=>`<fieldset><legend>${t} út</legend><label>Kapott XP<input name="xp${i}" type="number" min="0" step="any" /></label><label>Energiaköltség<input name="energy${i}" type="number" min="0.01" step="any" /></label><label>Idő (perc)<input name="time${i}" type="number" min="0.01" step="any" /></label></fieldset>`).join('')}</div><div id="atlas-xp-output" aria-live="polite"><p>Tölts ki legalább egy utat és az energiakeretet.</p></div></form>
      <h4 class="atlas-subheading">Őrjárat · hatékonysági szakaszok</h4>${table(['Eltelt idő','Hatékonyság'],db.hunting.patrol.curve.map((x,i,a)=>[`${i?a[i-1].untilMin:0}–${x.untilMin??'∞'} perc`,num(x.pct)+'%']))}
      ${notice(`Háttér-vadászat: ${db.hunting.idle.rules.cap.baseHours} óra alaptárolás a mentett konfigurációban. Az XP-hozam függ a szinttől és a harctól; nincs bizonyított univerzális XP/energia érték.`)}<a class="atlas-inline-link" href="#cikk-energy">Energia és energianélküli tevékenységek a kalauzban →</a>`;
  }
  function updateXp(){
    const f=$('#atlas-xp-form');if(!f)return;
    const out=['Rövid','Közepes','Hosszú'].flatMap((name,i)=>{const r=math.efficiency(f.elements['xp'+i].valueAsNumber,f.elements['energy'+i].valueAsNumber,f.elements['time'+i].valueAsNumber,f.elements.budget.valueAsNumber);return r?[[name,num(r.perEnergy),num(r.perHour),num(r.runs),num(r.totalXp),num(r.totalMinutes)+' perc']]:[];});
    $('#atlas-xp-output').innerHTML=out.length?table(['Út','XP / energia','XP / óra','Teljes utak','Összes XP','Összes idő'],out):'<p>Tölts ki legalább egy utat és egy érvényes energiakeretet. Az energia és az idő legyen nagyobb nullánál.</p>';
  }
  function sources(){
    return heading('A kódex mögött: visszakövethető források','A helyben átadott forrásokat dolgoztuk fel. Az oldal nem kapcsolódik a játékhoz, és nem ellenőrzi élőben a szerveradatait.')+`<div class="atlas-source-legend">${chip('Ellenőrzött adat · mentett forrás','verified')}${chip('Részben ellenőrzött / megfigyelt','unknown')}${chip('Képletből számolt','verified')}${chip('Ismeretlen adat','unknown')}</div><h4 class="atlas-subheading">Eltérések és tisztázatlan adatok</h4>${db.conflicts.map(c=>`<article class="atlas-conflict"><h4>${esc(c.title)}</h4><p>${esc(c.description)}</p><small>${c.sources.map(esc).join(' · ')}</small></article>`).join('')}
      <h4 class="atlas-subheading">Adatlefedettség és ismert hiányok</h4>${table(['Adatkör','Állapot'],[['Céhes nyang- és alapanyagköltségek','Nem ismert; a next mezők null értékűek voltak.'],['Képkatalógus',num(media?.catalog.stats.available)+' helyi kép; a kísérőváltozatok fejlődési fázisa ellenőrzendő.'],['Angol játéknevek','Nem áll rendelkezésre angol lokalizáció; nem fordítjuk vissza találgatva.'],['Tárgy → szett tagság','48 tárgynál igazolt family mező. Azonos szint vagy képfájlnév önmagában nem bizonyít tagságot.'],['Ház és bútorok','Bútorgrafikák már vannak; költség és XP-bónusz továbbra sem ismert.'],['Végső karakterstatisztika','A fejlesztett felszereléskomponensek kiszámíthatók; a teljes szerveroldali harci képlet nem igazolt.'],['Események és élő játékszabályok','Csak a dátumozott helyi források állnak rendelkezésre.']])}
      <h4 class="atlas-subheading">A beépített 14 forrásfájl</h4>${table(['Fájl','Állapot'],db.sources.map(x=>[esc(x.file),'Helyi pillanatkép · SHA-256 nyilvántartva']))}
      <h4 class="atlas-subheading">A teljes képkatalógus</h4>${rows([['Katalógusbejegyzések',num(media.catalog.stats.manifestEntries)],['Érvényes helyi képek',num(media.catalog.stats.available)],['Azonosított',num(media.catalog.stats.identified)],['Részben azonosított',num(media.catalog.stats.partial)],['Ismeretlen',num(media.catalog.stats.unknown)]])}${notice('Források: stonestorm_image_tools/manifest.json és results.csv. A képpárosításokat a forrás art, family, portrait, portraitTier és azonosítómezői, illetve a mentett kliens képkiválasztási szabályai támasztják alá. A kísérőgrafikák sorszámát nem azonosítjuk automatikusan fejlődési szintként. A bútorokhoz nincs igazolt bónuszadat.')}
      <div class="atlas-conflict"><h4>Képek eredete és engedélyei</h4><p>A korábbi Creator Kit 12 eredeti grafikája (32 WebP-változat) megmaradt. A projekt korábbi nyilvántartása ezekhez felhasználási engedélyt rögzít. Az Atlas további ${db.images.length} eredeti nevű játékmentési grafikára hivatkozik; ezek nyilvános újraközlési engedélye nincs igazolva.</p><p>A ZIP-ben a kézikönyvben írt 47 helyett ténylegesen 48 WebP-kép található; mind azonos a meglévő mentési képekkel. Nem készítettünk újabb futásidejű másolatot. A képek pontos útvonala és hash-e a data/image-manifest.json jegyzékben szerepel.</p></div>`;
  }
  function render(){
    $('#atlas-clear').hidden=!state.query;
    document.querySelectorAll('[data-atlas-page]').forEach(a=>{const active=a.dataset.atlasPage===state.page;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    $('#atlas-controls').innerHTML=state.query?`<div class="atlas-filters">${optionSelect('atlas-search-category','Keresés ebben a kategóriában',Object.fromEntries([...categories.filter(x=>x[0]!=='overview').map(x=>[x[0],x[1]]),['guide','Kezdőkalauz és GYIK']]),state.searchCategory)}${optionSelect('atlas-sort','Rendezés',{name:'Név: A → Z',level:'Szint: növekvő',levelDesc:'Szint: csökkenő'},state.sort)}</div>`:controls();
    $('#atlas-result-status').textContent='';
    const screens={overview,guild,home,mechanics,sources,world,...extension.screens};
    $('#atlas-screen').innerHTML=state.query?globalSearch():collections[state.page]?collection():(screens[state.page]??overview)();
    if(state.page==='overview'&&!state.query&&extension.home)$('#atlas-screen').insertAdjacentHTML('beforeend',extension.home());
    for(const [id,key] of [['atlas-slot','slot'],['atlas-class','character'],['atlas-rarity','rarity'],['atlas-sort','sort'],['atlas-max-level','maxLevel'],['atlas-search-category','searchCategory']]){const el=$('#'+id);if(el)el.addEventListener('change',()=>{state[key]=el.value;state.pageNumber=1;render();$('#'+id)?.focus({preventScroll:true});});}
    for(const [selector,update] of [['#atlas-guild-form',updateGuild],['#atlas-travel-form',updateTravel],['#atlas-xp-form',updateXp]]){const f=$(selector);if(f){f.addEventListener('submit',e=>e.preventDefault());f.addEventListener('input',update);f.addEventListener('change',update);update();}}
    extension.afterRender?.(state.page);
  }
  const related=(title,content)=>`<section class="atlas-related"><h4>${title}</h4>${content}</section>`;
  const mapFor=index=>db.maps.find(m=>m.index===index);
  function detail(kind,id){
    const extra=extension.detail?.(kind,id);if(extra)return extra;
    let x=allEntries.find(e=>e.kind===kind&&e.record?.id===id)?.record,body='',image='';
    if(!x)return null;
    if(kind==='item'){
      body=related('Alapstatisztikák',statRows(x.values))+related('Követelmények és árak',rows([['Felszerelési hely',slots[x.slot]],['Szint',num(x.level)],['Kaszt',(x.classes??[]).map(c=>classNames[c]??c).join(', ')||'Minden kaszt'],['Fokozat (tier)','T'+x.tier],['Vételár',num(x.buyPrice)+' nyang'],['Eladási ár',num(x.sellPrice)+' nyang']]))+
        related('Fejlesztés',table(['Következő +fokozat','Alapesély a tárgy tierje szerint'],(db.forge.chancesByTier[x.tier]??db.forge.chances).map((v,i)=>[i+1,pct(v)]))+notice('Mentett alapkonfiguráció; segédanyagok, események és további szabályok módosíthatják az esélyt. A teljes fejlesztési költséget ez nem igazolja.'))+
        related('Szettkapcsolat',x.family?db.sets.filter(s=>s.familyId===x.family).map(s=>link('sets','set',s)).join(' '):notice('Ehhez a tárgyhoz nincs family mezőben igazolt szettkapcsolat.'));
    }else if(kind==='set'){
      body=notice('A cím pályanévből képzett szerkesztői címke, nem igazolt hivatalos szettnév.')+related('Szettbónuszok',x.bonuses.map(b=>`<h4>${b.pieces} felszerelt darab</h4>${statRows(Object.fromEntries(b.stats.map(s=>[s.stat,s.value])))}`).join(''))+rows([['Szint',x.itemLevel],['Helyek',x.slots.map(s=>slots[s]).join(', ')],['Egyedi tárgyazonosító',x.unique.id]])+related('Kapcsolódó boss és pálya',link('world','boss',db.bosses.find(b=>b.id===x.bossId))+link('world','map',mapFor(x.mapIndex)));
    }else if(kind==='pet'){
      body=related('Fajbónusz szintenként',statRows(x.perLevel))+related('Alaptulajdonság · '+({strike:'Rárontás',mend:'Ápolás',guard:'Oltalom'})[x.trait],trait(x.trait))+
        related('Fejlődés',rows([['Kísérő maximumszint (rules)',db.petRules.maxLevel],['Hős minimumszint',db.petRules.minHeroLevel],['Kelési idő',db.petRules.hatchHours+' óra'],['Etetési anyag / szint',db.petRules.feedMaterialsPerLevel],['Etetési nyang / szint',db.petRules.feedNyangPerLevel]])+notice('A rules és a v3 skálázás eltér. Az alábbi formaköltségek a v3.forms.cost adatai; nem számítunk belőlük összesített harci bónuszt.'))+
        table(['v3 forma indexe','Mag azonosító','Szál','Nyang','Képességhely'],db.petForms.cost.map((c,i)=>[i,c?.core??'—',c?num(c.thread):'—',c?num(c.nyang):'—',db.petForms.slots[i]]))+
        related('Kapcsolódó adatok',(x.signature?link('pets','skill',{id:x.signature,name:db.petSkillNames[x.signature]?.name??x.signature},'Faji signature: '+(db.petSkillNames[x.signature]?.name??x.signature)):notice('A forrás nem rendel signature képességet ehhez a fajhoz.'))+link('world','map',mapFor(x.map))+(x.dungeon?link('world','dungeon',db.dungeons.find(d=>d.id===x.dungeon)):''));
    }else if(kind==='skill'){
      body=`<p>${esc((db.petSkillNames[id]?.desc??'').replaceAll('{{value}}',num(x.values[0]*100)).replaceAll('{{every}}',num(x.every)).replaceAll('{{times}}',num(x.times)))}</p>`+table(['Fokozat','Érték'],x.values.map((v,i)=>[i+1,pct(v)]))+notice('A leírás az 1. fokozat értékét használja. A képesség a közös készségkészlet része; csak a signature mező bizonyít fajhoz rendelt kapcsolatot.');
    }else if(kind==='mount'){
      body=`<p>${esc(x.descriptionHu)}</p>`+rows([['Minimumszint',x.level],['Utazási időszorzó',num(x.travelMult)],['Időcsökkenés',pct(1-x.travelMult)],['Bérleti ár',num(x.price)+' '+x.currency],['Időtartam',x.days+' nap'],['Megszerezhetőség / fejlődés','További vizsgálat szükséges']])+notice('Az időszorzó nem bizonyít energiamegtakarítást. A bérleti ár nem fejlesztési költség.');
    }else if(kind==='map'){
      body=rows([['Szinttartomány',x.minLevel+'–'+x.maxLevel],['Helyszínek száma',x.spots.length],['Viharkövek száma',x.stones.length]])+related('A terület bossai',db.bosses.filter(b=>b.mapIndex===x.index).map(b=>link('world','boss',b)).join(' '))+related('Ellenfelek',db.mobs.filter(m=>m.mapIndex===x.index).map(m=>link('world','mob',m)).join(' '))+related('Helyszínek',table(['Azonosító','Feloldási szint','Anyag'],x.spots.map(s=>[esc(s.id),num(s.opensAt),esc(db.economy.stackables.find(a=>a.id===s.materialId)?.name??s.materialId)])));
    }else if(kind==='boss'||kind==='mob'){
      const m=kind==='boss'?db.mobs.find(m=>m.id===x.mobId):x;
      if(m.id==='m4_boss')image=art('m4_boss',x.name,'atlas-detail-art');
      body=rows([['Magyar név',m.name??'Nem ismert'],['Szint',num(m.level)],['Harcerő',num(m.harcero)],['HP',num(m.maxHp)],['Sebzés',num(m.atkMin)+'–'+num(m.atkMax)],['Védelem',num(m.def)],['XP',num(m.xp)],['Nyang',num(m.nyangMin)+'–'+num(m.nyangMax)]])+related('Kapcsolódó pálya',link('world','map',mapFor(m.mapIndex)))+related('Kapcsolódó szettcsalád',db.sets.filter(s=>s.bossId===(kind==='boss'?x.id:db.bosses.find(b=>b.mobId===m.id)?.id)).map(s=>link('sets','set',s)).join(' ')||notice('Nincs kapcsolt szettcsalád a forrásban.'));
    }else if(kind==='dungeon'){
      body=`<p>${esc(x.description)}</p>`+rows([['Minimumszint',x.minLevel],['Maximumszint',x.maxLevel],['Ajánlott szint',x.recommendedLevel],['Kulcs ára',num(x.keyCoins)+' VÉ'],['Kulcs / nap',x.keysPerDay],['Hősi minimumszint',x.heroic.minLevel]])+related('Normál termek',table(['Terem','Lény azonosítója','Szint','HP','XP'],x.rooms.map(r=>[r.room,esc(r.creatureId),r.level,num(r.maxHp),num(r.xp)])));
    }else if(kind==='class'){
      body=related('Alapstatisztikák',statRows(x.baseStats))+related('Kasztképesség: '+x.skill.id,statRows(Object.fromEntries(Object.entries(x.skill).filter(([k])=>k!=='id'))))+`<a class="atlas-inline-link" href="#karakteralkotas">Kasztválasztó és összehasonlítás →</a>`;
    }else if(kind==='research'){
      body=`<p>${esc(x.description)}</p>`+rows([['Minimumszint',x.minLevel],['Kért minták',x.samplesNeeded],['Minta azonosító',x.sampleId]])+related('Jutalom',statRows(x.reward))+related('Minta forrása',link('world','mob',db.mobs.find(m=>m.id===x.sampleMobId)));
    }else if(kind==='material'){
      body=`<p>${esc(db.economy.stackKindNames[x.kind]?.hint??'A pontos felhasználás további ellenőrzést igényel.')}</p>`+rows([['Típus',summary(kind,x)],['Eladási ár',x.sellPrice==null?'Nem ismert':num(x.sellPrice)+' nyang']]);
      const p=db.pets.find(p=>p.egg===x.id);if(p)body+=related('Kapcsolódó kísérő',link('pets','pet',p));
    }else if(kind==='building'){
      image=art('bld_'+id,x.name,'atlas-detail-art');
      body=`<p>${esc(buildingEffects[id])} · a célzott épületszint szerint.</p>`+table(['Szint','Hatás','Fejlesztési idő','Teljes gyorsítás','Nyang','Alapanyag'],x.levels.map(l=>[l.level,num(l.effect)+(l.effectUnit==='members'?' fő':'%'),l.upgradeHoursToLevel+' óra',num(math.speedup(l.upgradeHoursToLevel,l.level,db.economy.limits.guildSpeedup))+' VÉ','Nem ismert','Nem ismert']))+notice(db.guild.rules.missingCostsReason);
    }
    const chosen=media?.forRecord(kind==='boss'?'mob':kind,kind==='boss'?x.mobId:id);
    if(chosen)image=media.render(chosen,{className:'atlas-detail-art',alt:x.name});
    const pictures=media?.related(kind==='boss'?'mob':kind,kind==='boss'?x.mobId:id)??[];
    return `<p class="eyebrow">STONESTORM ATLAS / ADATLAP</p>${image}<div class="atlas-detail-glyph">${glyph(kind==='item'?x.slot:kind)}</div><h2 id="atlas-detail-title">${esc(x.name??x.id)}</h2><p class="atlas-detail-id">${esc(id)}</p>${extension.actions?.(kind,x)??''}${body}${pictures.length?related('Kapcsolódó grafikák',`<div class="atlas-media-strip">${pictures.slice(0,10).map(im=>`<a href="${route('gallery','image',im.id)}">${media.render(im)}<span>${esc(im.name)}</span></a>`).join('')}</div><a class="atlas-inline-link" href="#atlas/gallery">Teljes Képtár →</a>`):''}${rows([['Angol megnevezés',x.nameEn??'Nem áll rendelkezésre']])}${sourceNote({...x,provenance:x.provenance??(kind==='building'?db.guild.provenance:{source:'03_kiserok.json',status:'verified'})})}`;
  }
  function trait(kind){
    const t=db.petTraits[kind];
    const body=kind==='strike'?table(['Fokozat','Minden ennyi ütés után','Sebzés'],t.every.map((e,i)=>[i+1,e,pct(t.mult[i])])):table(['Fokozat',kind==='mend'?'Gyógyítás':'Sebzéscsökkentés'],t.pct.map((p,i)=>[i+1,pct(p)]));
    return body+(kind==='mend'?notice('Harc közben egyszer, '+pct(t.belowHp)+' életerő alatt.'):kind==='guard'?notice('Az első '+t.hits+' ellenséges találatra vonatkozik.'):'');
  }
  let lastOpener=null;
  function syncRoute(scroll=true){
    let parts;const [hashPath,hashQuery='']=location.hash.slice(1).split('?');try{parts=hashPath.split('/').map(decodeURIComponent);}catch{parts=[];}
    const dialog=$('#atlas-detail');
    if(parts[0]!=='atlas'){if(dialog.open)dialog.close();return;}
    const requested=categories.some(x=>x[0]===parts[1])?parts[1]:'overview';
    if(state.page!==requested||state.query){state.page=requested;state.query='';$('#atlas-search').value='';state.pageNumber=1;}
    extension.onRoute?.(parts,new URLSearchParams(hashQuery));
    render();
    if(parts[2]&&parts[3]){
      const body=detail(parts[2],parts[3]);
      if(!body){$('#atlas-detail-body').innerHTML='<h2 id="atlas-detail-title">Nem található adatlap</h2><p>Ez az azonosító nem szerepel a mentett adatcsomagban.</p>';}
      else $('#atlas-detail-body').innerHTML=body;
      if(!dialog.open){lastOpener=document.activeElement;dialog.showModal();document.body.classList.add('atlas-dialog-open');}
      dialog.scrollTop=0;$('#atlas-detail-close').focus({preventScroll:true});
    }else if(dialog.open)dialog.close();
    if(scroll&&!parts[2])$('#atlas').scrollIntoView({block:'start'});
  }
  function closeDetail(){location.hash=route(state.page);}
  $('#atlas-detail-close').addEventListener('click',closeDetail);
  $('#atlas-detail').addEventListener('cancel',e=>{e.preventDefault();closeDetail();});
  $('#atlas-detail').addEventListener('click',e=>{if(e.target===$('#atlas-detail')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDetail();}});
  $('#atlas-detail').addEventListener('close',()=>{document.body.classList.remove('atlas-dialog-open');if(lastOpener?.isConnected)lastOpener.focus({preventScroll:true});else $(`[data-atlas-page="${state.page}"]`)?.focus({preventScroll:true});});
  $('#atlas-search').addEventListener('input',e=>{state.query=e.target.value.trim();state.pageNumber=1;render();});
  $('#atlas-clear').addEventListener('click',()=>{state.query='';$('#atlas-search').value='';state.pageNumber=1;render();$('#atlas-search').focus();});
  document.addEventListener('click',e=>{
    const nav=e.target.closest('[data-atlas-page]');if(nav&&nav.hash===location.hash)syncRoute();
    const page=e.target.closest('[data-pagination]');if(page){state.pageNumber+=Number(page.dataset.pagination);render();$('#atlas-controls').scrollIntoView({block:'start'});$('#atlas-result-status').setAttribute('tabindex','-1');$('#atlas-result-status').focus({preventScroll:true});}
    const tab=e.target.closest('[data-world]');if(tab){state.world=tab.dataset.world;state.pageNumber=1;render();$(`[data-world="${state.world}"]`).focus({preventScroll:true});}
    if(e.target.closest('#atlas-reset')){Object.assign(state,{query:'',searchCategory:'all',slot:'all',character:'all',rarity:'all',maxLevel:'',pageNumber:1});$('#atlas-search').value='';render();$('#atlas-search').focus();}
    const anchor=e.target.closest('a[href^="#cikk-"],a[href^="#gyik-"]');if(anchor){const target=document.getElementById(anchor.hash.slice(1));if(target)target.open=true;}
  });
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&!e.target.closest('input,select,textarea,[contenteditable="true"]')&&!$('#atlas-detail').open&&!$('#image-lightbox').open){e.preventDefault();e.stopImmediatePropagation();$('#atlas-search').focus();$('#atlas').scrollIntoView({block:'start'});}},true);
  window.addEventListener('hashchange',()=>syncRoute());
  extension=globalThis.AtlasExtensions?.init({db,media,esc,norm,num,pct,slots,rarities,classNames,label,value,icon,chip,notice,rows,statRows,table,route,link,heading,state,render})??{};
  render();syncRoute(false);
})();
