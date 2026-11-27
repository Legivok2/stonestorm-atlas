/* Az eredeti kalauzt bővítő Atlas. A mentett játékoldal kódját nem futtatjuk. */
(() => {
  'use strict';
  const db=window.STONESTORM_ATLAS, math=globalThis.StonestormMath;
  const media=globalThis.AtlasImages;
  let extension={};
  const $=s=>document.querySelector(s);
  if(!db||!math){$('#atlas-screen').textContent='Az Atlas adatai nem töltődtek be. Ellenőrizd a js/atlas-data.js fájlt.';return;}
  const i18n=globalThis.AtlasI18n;
  const t=(key,params)=>i18n.t(key,params);
  $('#atlas-data-version').dataset.atlasI18n='workspace.dataVersion';
  $('#atlas-data-version').dataset.version=db.dataVersion;
  $('#atlas-data-version').textContent=i18n.t('workspace.dataVersion',{version:db.dataVersion});
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('hu');
  const num=v=>v===null||v===undefined||!Number.isFinite(Number(v))?t('common.unknown'):i18n.formatNumber(Number(v),{maximumFractionDigits:2});
  const exact=v=>Number.isFinite(v)?esc(i18n.formatNumber(v,{useGrouping:false,maximumFractionDigits:20})):t('common.unknown');
  const pct=v=>v===null||v===undefined?t('common.unknown'):num(v*100)+'%';
  const slots=db.labels.slots, rarities={};
  for(const rarity of ['common','rare','heroic','unique'])Object.defineProperty(rarities,rarity,{enumerable:true,configurable:true,get:()=>t('pets.rarity.'+rarity)});
  const slotName=id=>t('equipment.slot.'+id);
  const classNames=Object.fromEntries(db.classes.map(x=>[x.id,x.name]));
  for(const entry of db.classes)Object.defineProperty(classNames,entry.id,{enumerable:true,configurable:true,get:()=>t('equipment.class.'+entry.id)});
  const buildingEffect=id=>t('guild.effect.'+id);
  const statNames={atkMin:'Min. sebzés',atkMax:'Max. sebzés',def:globalThis.StonestormBonuses.byId.defence.name,maxSp:'Max. mana',str:'Erő',dex:'Ügyesség',vit:'Vitalitás',int:'Intelligencia',xpMult:'XP-bónusz',nyangMult:'Nyangbónusz',atkMult:'Sebzésbónusz',hpMult:'Életerőbónusz',defMult:'Védelembónusz',critBonus:'Kritikus esély',evadeBonus:'Kitérés',vsHuman:'Emberek ellen',dropMult:'Zsákmánybónusz',ignoreDef:'Védelemáttörés',spCost:'Manaköltség',every:'Ütések közötti gyakoriság',hits:'Találatok száma',mult:'Sebzésszorzó'};
  Object.assign(statNames,Object.fromEntries(globalThis.StonestormBonuses.entries.map(entry=>[entry.id,entry.name])));
  const label=k=>i18n.dictionaries[i18n.getLocale()]['stat.'+k]??statNames[k]??k;
  // Százalékos statisztikák kulcs szerint, nem az érték nagysága alapján.
  const fraction=k=>globalThis.StonestormBonuses.byId[k]?.unit==='percent'||/Mult$|Bonus$|^vs[A-Z]|^(crit|potionHeal|skillDamage|lifesteal|ignoreDef)$/.test(k);
  const value=(k,v)=>fraction(k)?pct(v):num(v);
  const icon=(name,cls='')=>`<svg class="atlas-icon ${esc(cls)}" aria-hidden="true"><use href="#${esc(name)}" /></svg>`;
  const images=Object.fromEntries(db.images.map(x=>[x.id,x.file]));
  const art=(id,alt='',cls='')=>{const picture=['guild','uikit','ui','mobs','scenes','icons'].map(category=>media?.get(category,id)).find(Boolean);return picture?media.render(picture,{className:cls,alt,thumbnail:!cls.includes('detail')}):`<img class="${esc(cls)}" src="${esc(images[id])}" alt="${esc(alt)}" loading="lazy" width="160" height="160" />`;};
  const categories=[
    ['overview','Áttekintés','btn_help','book'],['equipment','Felszerelések','btn_character','swords'],['sets','Szettcsaládok','emblem_storm','shield'],['pets','Kísérők',null,'claw'],['mounts','Hátasok',null,'compass'],['world','Világ és bossok','btn_hunt','compass'],['guild','Céhrendszer','btn_guild','shield'],['home','Otthon és kutatás','btn_city','book'],['mechanics','Energia és fejlődés','energy','spark'],['classes','Kasztok és királyságok','btn_arena','swords'],['materials','Anyagok és tárgyak','btn_premium','anvil'],...(globalThis.AtlasExtensions?.categories??[]),['sources','Források és státusz','btn_help','book']
  ];
  const pageTitle=id=>i18n.dictionaries[i18n.getLocale()]['navigation.'+id]?t('navigation.'+id):categories.find(x=>x[0]===id)?.[1]??'Atlas';
  const glyph=(type)=>icon(({weapon:'swords',armor:'shield',helmet:'shield',shield:'shield',boots:'compass',bracelet:'sun',necklace:'spark',earrings:'moon',pet:'claw',mount:'compass',set:'shield',map:'compass',mob:'claw',boss:'claw',dungeon:'book',material:'anvil',research:'book',class:'swords',skill:'spark'})[type]??'book');
  const chip=(s,cls='')=>`<span class="atlas-chip ${esc(cls)}">${esc(s)}</span>`;
  const notice=s=>`<p class="atlas-notice">${esc(s)}</p>`;
  const rows=entries=>`<dl class="atlas-properties">${entries.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
  const statRows=obj=>rows(Object.entries(obj??{}).map(([k,v])=>[label(k),value(k,v)]));
  const table=(heads,body)=>`<div class="atlas-table-wrap"><table class="atlas-table"><thead><tr>${heads.map(x=>`<th scope="col">${esc(x)}</th>`).join('')}</tr></thead><tbody>${body.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const route=(page,kind,id)=>`#atlas/${page}${kind?'/'+kind+'/'+encodeURIComponent(id):''}`;
  const link=(page,kind,x,text)=>{if(!x)return notice(t('world.emptyLink'));const key=text==null?i18n.gameNameKey(kind,x):null;const display=kind==='set'&&x.nameIsEditorial&&i18n.getLocale()==='en'?t('sets.familyName',{map:t('sets.mapName.'+x.familyId)}):key?i18n.t(key):text??x.name??x.id;return `<a class="atlas-inline-link" href="${route(page,kind,x.id)}"><span ${key?`data-atlas-i18n="${esc(key)}"`:''}>${esc(display)}</span> ↗</a>`;};
  const heading=(title,copy)=>`<div class="atlas-page-heading"><p class="eyebrow">${t('common.codex')}</p><h3>${esc(title)}</h3><p>${esc(copy)}</p></div>`;
  const petUI=globalThis.AtlasPetUI.init({db,media,esc,num,pct,chip,notice,rows,table,link});
  const sourceNote=x=>`<div class="atlas-source-note">${chip(t(!x.name?'common.sourcePartial':x.provenance?.status==='derived'?'common.sourceDerived':'common.sourceVerified'),!x.name?'unknown':'verified')}<p>${esc(x.provenance?.source??'ATLAS_VSCODE_KEZIKONYV.md')}<br />${esc(x.provenance?.checkedAt??db.updated)} · ${esc(t('common.sourceSnapshot'))}</p></div>`;
  const design=globalThis.AtlasDesign.init({db,media,esc,num,pct,icon,chip,slots,rarities,classNames,route,label,value,notice});
  const state={page:'overview',query:'',searchCategory:'all',slot:'all',character:'all',rarity:'all',maxLevel:'',sort:'name',pageNumber:1,world:'maps'};
  const guildState={current:'10',target:'11',remaining:''};
  const travelState={minutes:'100',mount:db.mounts.find(x=>!x.ramp)?.id??''};
  const collections={equipment:['item',db.items],sets:['set',db.sets],pets:['pet',db.pets],mounts:['mount',db.mounts],materials:['material',db.economy.stackables],classes:['class',db.classes]};
  const allEntries=[];
  const dictionaryValues=key=>[i18n.dictionaries.hu[key],i18n.dictionaries.en[key]].filter(Boolean);
  const setTitle=x=>i18n.getLocale()==='en'?t('sets.familyName',{map:t('sets.mapName.'+x.familyId)}):x.name;
  const searchText=(kind,x)=>{
    const values=[x.name,x.nameHu,x.nameEn,x.id,x.descriptionHu,x.description,x.level,x.rarity,JSON.stringify(x.values??{}),JSON.stringify(x.perLevel??{})];
    if(kind==='item'){
      values.push(...dictionaryValues('navigation.equipment'),'felszerelés','felszerelések','gear','item',slots[x.slot],...dictionaryValues('equipment.slot.'+x.slot));
      for(const classId of x.classes??[])values.push(...dictionaryValues('equipment.class.'+classId));
      for(const [key,value] of Object.entries(x.values??{}))if(value!==0)values.push(...dictionaryValues('stat.'+key));
      if(x.tier!==undefined)values.push('tier','fokozat','t'+x.tier,String(x.tier));
      if(x.family)values.push('set','sets','equipment set','szett','szettek','szettcsalád',...db.items.filter(item=>item.family===x.family).map(item=>item.name));
    }
    if(kind==='set'){
      values.push(setTitle(x),...dictionaryValues('sets.copy'),'set','sets','equipment set','szett','szettek','szettcsalád');
      values.push(...dictionaryValues('sets.mapName.'+x.familyId));
      for(const slot of x.slots)values.push(slots[slot],...dictionaryValues('equipment.slot.'+slot));
      for(const stat of x.bonuses.flatMap(b=>b.stats))values.push(...dictionaryValues('stat.'+stat.stat));
      values.push(...db.items.filter(item=>item.family===x.familyId).map(item=>item.name));
    }
    if(kind==='pet'){
      const nameKey=i18n.gameNameKey(kind,x);
      values.push('pet','pets','companion','companions','kísérő','kísérők',...dictionaryValues('navigation.pets'),...dictionaryValues('pets.rarity.'+x.rarity));
      if(nameKey)values.push(...dictionaryValues(nameKey));
      values.push(...db.petSystem.stages.flatMap(stage=>dictionaryValues('pets.form.'+stage.form)));
      for(const skillId of x.learnableSkills??[]){const key='game.petSkill.'+skillId,desc='pets.skillDesc.'+skillId;values.push(...dictionaryValues(key),...dictionaryValues(desc));}
      values.push(...dictionaryValues('pets.trait.'+x.trait));
    }
    if(kind==='mount'){
      values.push('mount','mounts','ride','rides','travel','travel time','speed','duration','rental','hátas','hátasok','utazás','utazási idő',...dictionaryValues('navigation.mounts'),...dictionaryValues('mounts.copy'),...dictionaryValues('mount.desc.'+x.id));
      if(x.ramp)values.push(...dictionaryValues('mounts.levelConfig'));
    }
    if(['map','mob','boss','dungeon'].includes(kind)){
      const key=i18n.gameNameKey(kind,x);
      if(key)values.push(...dictionaryValues(key));
      values.push(...dictionaryValues('world.'+({map:'maps',mob:'mobs',boss:'bosses',dungeon:'dungeons'})[kind]));
      if(kind==='mob'||kind==='boss')values.push(...['level','power','hp','damage','defence','combatUnknown'].flatMap(field=>dictionaryValues('world.'+field)),'XP','Nyang');
      if(kind==='dungeon'){
        values.push(...dictionaryValues('game.dungeonLore.'+x.id));
        for(const room of x.rooms)values.push(...dictionaryValues('game.creature.'+room.creatureId));
      }
      if(kind==='research'||kind==='building'){
        const key=i18n.gameNameKey(kind,x);
        if(key)values.push(...dictionaryValues(key));
        if(kind==='research'){
          values.push(...dictionaryValues('research.kicker'),...dictionaryValues('game.researchDescription.'+x.id));
          for(const stat of Object.keys(x.reward??{}))values.push(...dictionaryValues('stat.'+stat));
        }else values.push(...dictionaryValues('guild.building'),...dictionaryValues('guild.effect.'+x.id));
      }
      if(kind==='map'){
        for(const spot of x.spots)values.push(...dictionaryValues('game.spot.'+spot.id),...dictionaryValues('game.material.'+spot.materialId));
        for(const boss of db.bosses.filter(b=>b.mapIndex===x.index)){const name=i18n.gameNameKey('boss',boss);if(name)values.push(...dictionaryValues(name));}
      }
    }
    return norm(values.join(' '));
  };
  const add=(page,kind,list)=>list.forEach(x=>{const key=i18n.gameNameKey(kind,x);allEntries.push({page,kind,record:x,title:kind==='set'?setTitle(x):x.name??x.id,text:norm([searchText(kind,x),key?i18n.dictionaries.en[key]:''].join(' '))});});
  Object.entries(collections).forEach(([p,[k,list]])=>add(p,k,list));
  [['map','maps'],['mob','mobs'],['boss','bosses'],['dungeon','dungeons']].forEach(([k,p])=>add('world',k,db[p]));
  add('home','research',db.research);
  Object.entries(db.petSkills).forEach(([id,x])=>add('pets','skill',[{...x,id,name:db.petSkillNames[id]?.name??id,description:db.petSkillNames[id]?.desc}]));
  db.guild.buildings.forEach(x=>add('guild','building',[{...x,id:x.kind,name:x.nameHu}]));
  const guideEnglish=window.STONESTORM_GUIDE_EN;
  const guideText=a=>a?[a.title,a.intro,...a.sections.flatMap(s=>[s.heading,...s.items]),a.tip].join(' '):'';
  for(const a of window.STONESTORM_CONTENT.articles){const en=guideEnglish?.articles[a.id];allEntries.push({page:'guide',title:a.title,href:'#cikk-'+a.id,text:norm(guideText(a)+' '+guideText(en)),excerpt:a.intro,english:en&&{title:en.title,excerpt:en.intro}});}
  for(const [i,a] of window.STONESTORM_CONTENT.faq.entries()){const en=guideEnglish?.faq[i];allEntries.push({page:'guide',title:a.question,href:'#gyik-'+i,text:norm(a.question+' '+a.answer+' '+(en?.question??'')+' '+(en?.answer??'')),excerpt:a.answer,english:en&&{title:en.question,excerpt:en.answer}});}
  const matches=x=>norm(state.query).split(/\s+/).filter(Boolean).every(t=>x.text.includes(t));

  $('#atlas-stats').innerHTML=[[db.items.length,'sidebar.items'],[db.pets.length,'sidebar.pets'],[db.mounts.length,'sidebar.mounts'],[db.mobs.length,'sidebar.enemies'],[db.guild.buildings.length,'sidebar.buildings']].map(([n,key])=>`<div><strong>${num(n)}</strong><span data-atlas-i18n="${key}">${esc(i18n.t(key))}</span></div>`).join('');
  $('#atlas-nav').innerHTML=design.navigation(categories);
  function overview(){return design.overview();}
  function optionSelect(id,title,options,selected){return `<label>${esc(title)}<select id="${id}">${id==='atlas-sort'?'':`<option value="all">${esc(t('common.all'))}</option>`}${Object.entries(options).map(([k,v])=>`<option value="${esc(k)}" ${k===selected?'selected':''}>${esc(v)}</option>`).join('')}</select></label>`;}
  function controls(){
    if(!collections[state.page] && state.page!=='world')return '';
    const sortOptions={name:t('common.sort.name'),level:t('common.sort.level'),levelDesc:t('common.sort.levelDesc')};
    return `<div class="atlas-filters">${state.page==='equipment'?optionSelect('atlas-slot',t('equipment.filter.slot'),Object.fromEntries(Object.keys(slots).map(id=>[id,slotName(id)])),state.slot)+optionSelect('atlas-class',t('equipment.filter.class'),classNames,state.character):''}${state.page==='pets'?optionSelect('atlas-rarity',t('pets.filter.rarity'),rarities,state.rarity):''}${state.page==='equipment'?`<label>${t('equipment.filter.maxLevel')}<input id="atlas-max-level" type="number" min="1" max="999" placeholder="${esc(t('equipment.anyLevel'))}" value="${esc(state.maxLevel)}" /></label>`:''}${optionSelect('atlas-sort',t('common.sort'),sortOptions,state.sort)}</div>`;
  }
  const summary=(kind,x)=>{
    if(kind==='item')return `${slotName(x.slot)} · ${t('equipment.itemSummary',{level:num(x.level)})}`;
    if(kind==='pet')return `${rarities[x.rarity]??x.rarity} · ${t('pets.map',{level:num(x.map)})}`;
    if(kind==='mount'&&x.ramp)return t('mounts.levelConfig');
    if(kind==='mount')return t('mounts.summary',{level:num(x.level),reduction:num((1-x.travelMult)*100)});
    if(kind==='set')return t('sets.summary',{level:num(x.itemLevel),count:num(x.slots.length)});
    if(kind==='map')return t('world.mapSummary',{min:num(x.minLevel),max:num(x.maxLevel),count:num(x.spots.length)});
    if(kind==='boss')return t('world.bossSummary',{level:num(x.recommendedLevel),map:num(x.mapIndex)});
    if(kind==='mob')return t('world.mobSummary',{level:num(x.level),hp:num(x.maxHp)});
    if(kind==='dungeon')return t('world.dungeonSummary',{min:num(x.minLevel),max:num(x.maxLevel),count:num(x.rooms.length)});
    if(kind==='research')return t('research.summary',{level:num(x.minLevel),count:num(x.samplesNeeded)});
    if(kind==='building')return t('guild.summary');
    if(kind==='material')return db.economy.stackKindNames[x.kind]?.name??x.kind;
    if(kind==='class')return 'Alapstatisztikák és képesség';
    return 'Részletes játékadat';
  };
  const itemSummary=x=>Object.entries(x.values??{}).filter(([,v])=>v!==0).slice(0,2).map(([k,v])=>label(k)+' '+value(k,v)).join(' · ');
  const gameName=(kind,x)=>{const key=i18n.gameNameKey(kind,x);return key?t(key):x?.name??x?.id??'';};
  const worldMaterial=id=>{const material=db.economy.stackables.find(a=>a.id===id),key='game.material.'+id;return material?link('materials','material',material,i18n.dictionaries.hu[key]===material.name?t(key):material.name):esc(id);};
  const dungeonDescription=x=>i18n.dictionaries.hu['game.dungeonLore.'+x.id]===x.description?t('game.dungeonLore.'+x.id):x.description;
  function card(entry){
    const {page,kind,record:x}=entry;
    const desc=kind==='item'?itemSummary(x):kind==='pet'?petUI.cardSummary(x):kind==='mount'?t('mounts.card.price',{price:num(x.price),currency:t('mounts.currency.'+x.currency),days:num(x.days)}):kind==='mob'?num(x.xp)+' XP · '+num(x.nyangMin)+'–'+num(x.nyangMax)+' Nyang':kind==='research'?Object.entries(x.reward).map(([k,v])=>label(k)+' +'+value(k,v)).join(' · '):kind==='map'?gameName('boss',db.bosses.find(b=>b.mapIndex===x.index)):kind==='dungeon'?dungeonDescription(x):kind==='material'?db.economy.stackKindNames[x.kind]?.hint:kind==='set'?x.bonuses.map(b=>t('sets.pieces',{count:num(b.pieces)})+': '+b.stats.map(s=>label(s.stat)+' +'+value(s.stat,s.value)).join(', ')).join(' · '):'';
    const catalogImage=media?.forRecord(kind==='boss'?'mob':kind,kind==='boss'?x.mobId:x.id);
    const image=catalogImage?null:((kind==='boss'&&x.mobId==='m4_boss')||(kind==='mob'&&x.id==='m4_boss')?'m4_boss':null);
    return design.card(entry,desc,summary(kind,x),glyph(kind==='item'?x.slot:kind));
  }

  function sorted(list){const name=entry=>entry.kind==='set'?setTitle(entry.record):i18n.gameNameKey(entry.kind,entry.record)?t(i18n.gameNameKey(entry.kind,entry.record)):entry.record.name??entry.record.id;return [...list].sort((a,b)=>state.sort==='name'?name(a).localeCompare(name(b),i18n.getLocale()):(state.sort==='levelDesc'?-1:1)*((a.record.level??a.record.minLevel??a.record.itemLevel??a.record.recommendedLevel??0)-(b.record.level??b.record.minLevel??b.record.itemLevel??b.record.recommendedLevel??0)));}
  function paginated(entries){
    const list=sorted(entries),count=Math.ceil(list.length/24);
    state.pageNumber=Math.max(1,Math.min(state.pageNumber,count||1));
    $('#atlas-result-status').textContent=`${t('common.results',{count:num(list.length)})}${list.length?` · ${t('common.page',{page:num(state.pageNumber),pages:num(count)})}`:''}`;
    if(!list.length)return `<div class="atlas-empty">${icon('search')}<h4>${t('common.noResults')}</h4><p>${t('common.tryOtherSearch')}</p><button type="button" id="atlas-reset">${t('common.resetFilters')}</button></div>`;
    return `<div class="atlas-card-grid">${list.slice((state.pageNumber-1)*24,state.pageNumber*24).map(card).join('')}</div>${count>1?`<div class="atlas-pagination"><button type="button" data-pagination="-1" ${state.pageNumber===1?'disabled':''}>${t('common.previous')}</button><span>${num(state.pageNumber)} / ${num(count)}</span><button type="button" data-pagination="1" ${state.pageNumber===count?'disabled':''}>${t('common.next')}</button></div>`:''}`;
  }
  function collection(){
    const [kind,list]=collections[state.page];
    let entries=allEntries.filter(e=>e.page===state.page&&e.kind===kind);
    if(state.page==='equipment')entries=entries.filter(({record:x})=>(state.slot==='all'||x.slot===state.slot)&&(state.character==='all'||!x.classes?.length||x.classes.includes(state.character))&&(!state.maxLevel||x.level<=Number(state.maxLevel)));
    if(state.page==='pets')entries=entries.filter(({record:x})=>state.rarity==='all'||x.rarity===state.rarity);
    let extra='';
    if(state.page==='pets')extra=petUI.overview();
    if(state.page==='classes')extra=`<h4 class="atlas-subheading">Három királyság</h4><div class="atlas-kingdoms">${db.kingdoms.map(k=>`<article class="kingdom-${k}"><h4>${esc(db.kingdomNames[k].name)}</h4><p>${esc(db.kingdomNames[k].motto)}</p></article>`).join('')}</div><a class="atlas-inline-link" href="#karakteralkotas">Kaszt-összehasonlítás a kalauzban →</a>`;
    if(state.page==='mounts')extra=travelTool();
    if(state.page==='materials')extra=`<div class="atlas-resource-ribbon"><div>${art('nyang_small','Nyang')}<span>Nyang</span></div><div>${art('coin_dragon','Viharérme')}<span>Viharérme</span></div><div>${art('luck_ore','Szerencseérc')}<span>Szerencseérc · kovácsolási segédanyag</span></div></div>`;
    const copies={equipment:t('equipment.copy'),sets:t('sets.copy'),pets:t('pets.copy'),mounts:t('mounts.copy'),classes:'Magyar kasztnevek a kliensfordításból, az eredeti kalauz megőrzött összehasonlítójával.',materials:'A teljes, 131 elemes alapanyag- és fogyóeszközlista magyar nevekkel.'};
    return heading(pageTitle(state.page),copies[state.page])+(state.page==='pets'?paginated(entries)+`<details class="pet-guide-fold" id="pet-guide"><summary>${t('pets.guideFold')}</summary>${extra}</details>`:paginated(entries)+extra);
  }
  function globalSearch(){
    const entries=allEntries.filter(matches).filter(e=>state.searchCategory==='all'||e.page===state.searchCategory);
    const entity=entries.filter(e=>e.record),guides=entries.filter(e=>e.href);
    const html=entity.length?paginated(entity):'';
    $('#atlas-result-status').textContent=t('common.globalSearchStatus',{count:num(entries.length),records:num(entity.length),guide:num(guides.length)});
    return heading(t('common.globalSearchTitle'),t('common.globalSearchCopy'))+html+(!entries.length?`<div class="atlas-empty"><h4>${t('common.noResults')}</h4><p>${t('common.tryOtherSearch')}</p><button type="button" id="atlas-reset">${t('common.resetFilters')}</button></div>`:'')+(guides.length?`<h4 class="atlas-subheading">${t('common.inGuide')}</h4><div class="atlas-guide-results">${guides.map(e=>{const display=i18n.getLocale()==='en'&&e.english?e.english:e;return `<a href="${e.href}"><h4>${esc(display.title)}</h4><p>${esc(display.excerpt)}</p><span>${t('common.openGuide')} ↗</span></a>`;}).join('')}</div>`:'');
  }
  function world(){
    const tabs=[['maps','map'],['bosses','boss'],['mobs','mob'],['dungeons','dungeon']];
    const tab=tabs.find(x=>x[0]===state.world);
    return heading(t('world.title'),t('world.copy'))+`<div class="atlas-tabs" role="group" aria-label="${esc(t('world.tabs'))}">${tabs.map(([id])=>`<button type="button" data-world="${id}" aria-pressed="${id===state.world}">${esc(t('world.'+id))} <small>${db[id].length}</small></button>`).join('')}</div>`+paginated(allEntries.filter(e=>e.page==='world'&&e.kind===tab[1]));
  }
  function guild(){
    return heading(t('guild.title'),t('guild.copy'))+
      `<div class="atlas-guild-hero"><img src="${images.guildyard_base}" alt="${esc(t('guild.heroAlt'))}" width="700" height="400" loading="lazy"/><div><p class="eyebrow">${t('guild.eyebrow')}</p><h4>${t('guild.heroTitle')}</h4><p>${esc(t('guild.roles',{roles:Object.keys(db.guildRoles).map(id=>t('guild.role.'+id)).join(' · ')}))}</p><p>${t('guild.requirements')}</p></div></div>
      <details class="atlas-conflict"><summary>${t('guild.observedTitle')}</summary><p>${t('guild.observed')}</p></details>
      <form id="atlas-guild-form" class="atlas-tool"><div class="atlas-tool-title">${icon('anvil')}<h4>${t('guild.calculator')}</h4>${chip(t('guild.calculated'),'verified')}</div><div class="atlas-tool-fields"><label>${t('guild.current')}<input name="current" type="number" value="${esc(guildState.current)}" min="0" max="15" step="1" required /></label><label>${t('guild.target')}<input name="target" type="number" value="${esc(guildState.target)}" min="1" max="15" step="1" required /></label><label>${t('guild.remaining')}<input name="remaining" type="number" value="${esc(guildState.remaining)}" placeholder="${esc(t('guild.fullTime'))}" min="0" step="any" /></label></div><p>${t('guild.calcCopy')}</p><div id="atlas-guild-output" class="atlas-tool-output" aria-live="polite"></div></form>
      <div id="atlas-building-cards" class="atlas-building-grid"></div><div id="atlas-building-table"></div>
      ${notice(t('guild.warning'))}`;
  }
  function updateGuild(){
    const form=$('#atlas-guild-form');if(!form)return;
    for(const key of Object.keys(guildState))guildState[key]=form.elements[key].value;
    const current=form.elements.current.valueAsNumber,target=form.elements.target.valueAsNumber;
    const plan=math.guildPlan(current,target,db.economy.limits.guildSpeedup);
    const remaining=form.elements.remaining.value===''?target*2:form.elements.remaining.valueAsNumber;
    const valid=plan&&Number.isInteger(target)&&target>=1&&remaining>=0&&remaining<=target*2&&Number.isFinite(remaining);
    if(!valid){$('#atlas-guild-output').textContent=t('guild.invalid');$('#atlas-building-cards').replaceChildren();$('#atlas-building-table').replaceChildren();return;}
    const price=plan.steps?math.speedup(remaining,target,db.economy.limits.guildSpeedup):0;
    $('#atlas-guild-output').innerHTML=rows([[t('guild.steps'),num(plan.steps)],[t('guild.totalTime'),num(plan.hours)+' '+t('guild.hours')],[t('guild.allSpeedup'),num(plan.coins)+' '+t('guild.coins')],[t('guild.lastSpeedup'),num(price)+' '+t('guild.coins')],[t('guild.cost'),t('guild.unknown')]]);
    $('#atlas-building-cards').innerHTML=db.guild.buildings.map(x=>{const l=x.levels.find(l=>l.level===target),name=gameName('building',{id:x.kind,name:x.nameHu});return `<a href="${route('guild','building',x.kind)}" class="atlas-building-card"><div class="building-card-art">${art('bld_'+x.kind,name)}<span>${t('guild.building')}</span></div><div class="building-card-copy"><h4>${esc(name)}</h4><div class="building-card-effect"><strong>${num(l.effect)} ${l.effectUnit==='members'?t('guild.members'):'%'}</strong><span>${esc(t('guild.atLevel',{level:num(target)}))}</span></div><p>${esc(buildingEffect(x.kind))}</p></div></a>`;}).join('');
    $('#atlas-building-table').innerHTML=table([t('guild.columnBuilding'),t('guild.target'),t('guild.effect'),t('guild.lastTime'),'Nyang',t('guild.material')],db.guild.buildings.map(x=>{const l=x.levels.find(l=>l.level===target);return [esc(gameName('building',{id:x.kind,name:x.nameHu})),num(target),num(l.effect)+(l.effectUnit==='members'?' '+t('guild.members'):'%'),num(l.upgradeHoursToLevel)+' '+t('guild.hours'),t('guild.unknown'),t('guild.unknown')];}));
  }
  function home(){
    return globalThis.AtlasHomeArenaUI.current.home()+`<h4 class="atlas-subheading">${esc(t('research.heading',{count:num(db.research.length)}))}</h4>`+notice(t('research.separate'))+paginated(allEntries.filter(x=>x.page==='home'));
  }
  function travelTool(){return `<form id="atlas-travel-form" class="atlas-tool"><div class="atlas-tool-title">${icon('compass')}<h4>${esc(t('mounts.travel.title'))}</h4></div><div class="atlas-tool-fields"><label>${esc(t('mounts.travel.baseMinutes'))}<input name="minutes" type="number" value="${esc(travelState.minutes)}" min="0" step="any" required /></label><label>${esc(t('mounts.travel.mount'))}<select name="mount">${db.mounts.filter(x=>!x.ramp).map(x=>`<option value="${x.id}" ${x.id===travelState.mount?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label></div><div id="atlas-travel-output" class="atlas-tool-output" aria-live="polite"></div><p>${esc(t('mounts.travel.example'))}</p></form>`;}
  function updateTravel(){const f=$('#atlas-travel-form');if(!f)return;const x=db.mounts.find(x=>x.id===f.elements.mount.value),r=x&&math.travel(f.elements.minutes.valueAsNumber,x.travelMult);$('#atlas-travel-output').innerHTML=r?rows([[t('mounts.travel.outputTime'),num(r.minutes)+' '+t('mounts.travel.minutes')],[t('mounts.travel.saved'),num(r.saved)+' '+t('mounts.travel.minutes')],[t('mounts.travel.reduction'),pct(1-x.travelMult)]]):esc(t('mounts.travel.invalid'));}
  function mechanics(){
    const energy=db.hunting.energy,features=db.dataEngine?.publicRules?.features??{};
    return heading('Hozd ki a legtöbbet a kalandból','Energiakonfigurációk és saját mérésekkel kitölthető XP / energia összehasonlítás.')+
      `<div class="atlas-mechanic-banner">${art('energy','Energia')}<div><h4>Energia: pillanatkép, verziókkal</h4><p>A limits.energyMax: ${db.economy.limits.energyMax}. A spine.energy napi kiosztása: ${energy.dayGrant}, VIP esetén ${energy.vipDayGrant}. A keret és a napi kiosztás külön fogalom.</p></div></div>`+
      table(['Aktuális funkció','Nyilvános konfiguráció'],[['Runasor V2',features.runasorV2===true?'Bekapcsolva':'Nincs igazolt bekapcsolás'],['Horgászati érmejutalmak',features.fishCoinRewards===true?'Bekapcsolva':'Nincs igazolt bekapcsolás']])+notice('A kapcsoló a funkció beállítását igazolja; a jutalom mennyiségét és szerveroldali feltételeit nem.')+
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
    return petUI.engineOverview()+heading('A kódex mögött: visszakövethető források','A támogatott adatok elsődleges forrása a verziózott nyilvános konfiguráció. A történeti csomag megmarad, az Auto-Sync tesztelt importként vezeti át a friss adatokat; az oldal nem kapcsolódik játékosfiókhoz.')+`<p><a class="atlas-inline-link" href="#atlas/updates">Atlas frissítések és ellenőrzési állapot →</a></p><div class="atlas-source-legend">${chip('Ellenőrzött adat · mentett forrás','verified')}${chip('Részben ellenőrzött / megfigyelt','unknown')}${chip('Képletből számolt','verified')}${chip('Ismeretlen adat','unknown')}</div><h4 class="atlas-subheading">Eltérések és tisztázatlan adatok</h4>${db.conflicts.map(c=>`<article class="atlas-conflict"><h4>${esc(c.title)}</h4><p>${esc(c.description)}</p><small>${c.sources.map(esc).join(' · ')}</small></article>`).join('')}
      <h4 class="atlas-subheading">Adatlefedettség és ismert hiányok</h4>${table(['Adatkör','Állapot'],[['Céhes nyang- és alapanyagköltségek','Nem ismert; a next mezők null értékűek voltak.'],['Képkatalógus',num(media?.catalog.stats.available)+' helyi kép; 110 logikai forma–képkulcs kapcsolat ismert; a jelenlegi kísérőfájlokhoz szükséges petArt jegyzék hiányzik.'],['Angol játéknevek','Nem áll rendelkezésre angol lokalizáció; nem fordítjuk vissza találgatva.'],['Tárgy → szett tagság','48 tárgynál igazolt family mező. Azonos szint vagy képfájlnév önmagában nem bizonyít tagságot.'],['Ház és bútorok','Bútorgrafikák már vannak; költség és XP-bónusz továbbra sem ismert.'],['Végső karakterstatisztika','A fejlesztett felszereléskomponensek kiszámíthatók; a teljes szerveroldali harci képlet nem igazolt.'],['Események és élő játékszabályok','Csak a dátumozott helyi források állnak rendelkezésre.']])}
      <h4 class="atlas-subheading">A beépített 14 forrásfájl</h4>${table(['Fájl','Állapot'],db.sources.map(x=>[esc(x.file),'Helyi pillanatkép · SHA-256 nyilvántartva']))}
      <h4 class="atlas-subheading">A teljes képkatalógus</h4>${rows([['Katalógusbejegyzések',num(media.catalog.stats.manifestEntries)],['Érvényes helyi képek',num(media.catalog.stats.available)],['Azonosított',num(media.catalog.stats.identified)],['Részben azonosított',num(media.catalog.stats.partial)],['Ismeretlen',num(media.catalog.stats.unknown)]])}${notice('Források: stonestorm_image_tools/manifest.json és results.csv. A képpárosításokat a forrás art, family, portrait, portraitTier és azonosítómezői, illetve a mentett kliens képkiválasztási szabályai támasztják alá. A Ro/cT választó a formák logikai kulcsát igazolja. A tényleges fájlt a karakterválasz petArt jegyzéke választja ki; enélkül a történeti helyi kísérőképek részben azonosítottak. A bútorokhoz nincs igazolt bónuszadat.')}
      <div class="atlas-conflict"><h4>Képek eredete és engedélyei</h4><p>A korábbi Creator Kit 12 eredeti grafikája (32 WebP-változat) megmaradt. A projekt korábbi nyilvántartása ezekhez felhasználási engedélyt rögzít. Az Atlas további ${db.images.length} eredeti nevű játékmentési grafikára hivatkozik; ezek nyilvános újraközlési engedélye nincs igazolva.</p><p>A ZIP-ben a kézikönyvben írt 47 helyett ténylegesen 48 WebP-kép található; mind azonos a meglévő mentési képekkel. Nem készítettünk újabb futásidejű másolatot. A képek pontos útvonala és hash-e a data/image-manifest.json jegyzékben szerepel.</p></div>`;
  }
  function render(){
    const headingKey=state.query?'workspace.searchResults':'navigation.'+state.page;
    $('#atlas-heading').dataset.atlasI18n=headingKey;
    $('#atlas-heading').textContent=i18n.t(headingKey);
    $('#atlas-screen').dataset.page=state.page;
    $('#atlas-clear').hidden=!state.query;
    document.querySelectorAll('[data-atlas-page]').forEach(a=>{const active=a.dataset.atlasPage===state.page;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    $('#atlas-controls').innerHTML=state.query?`<div class="atlas-filters">${optionSelect('atlas-search-category',t('common.searchInCategory'),Object.fromEntries([...categories.filter(x=>x[0]!=='overview').map(([id])=>[id,t('navigation.'+id)]),['guide',t('common.guideCategory')]]),state.searchCategory)}${optionSelect('atlas-sort',t('common.sort'),{name:t('common.sort.name'),level:t('common.sort.level'),levelDesc:t('common.sort.levelDesc')},state.sort)}</div>`:controls();
    $('#atlas-result-status').textContent='';
    const screens={overview,guild,home,mechanics,sources,world,...extension.screens};
    $('#atlas-screen').innerHTML=state.query?globalSearch():collections[state.page]?collection():(screens[state.page]??overview)();
    if(state.page==='overview'&&!state.query&&extension.home)$('#atlas-screen').insertAdjacentHTML('beforeend',extension.home());
    for(const [id,key] of [['atlas-slot','slot'],['atlas-class','character'],['atlas-rarity','rarity'],['atlas-sort','sort'],['atlas-max-level','maxLevel'],['atlas-search-category','searchCategory']]){const el=$('#'+id);if(el)el.addEventListener('change',()=>{if(state[key]===el.value)return;state[key]=el.value;state.pageNumber=1;render();$('#'+id)?.focus({preventScroll:true});});}
    for(const [selector,update] of [['#atlas-guild-form',updateGuild],['#atlas-xp-form',updateXp]]){const f=$(selector);if(f){f.addEventListener('submit',e=>e.preventDefault());f.addEventListener('input',update);f.addEventListener('change',update);update();}}
    const travelForm=$('#atlas-travel-form');
    if(travelForm){
      travelForm.addEventListener('submit',e=>e.preventDefault());
      const update=()=>{travelState.minutes=travelForm.elements.minutes.value;travelState.mount=travelForm.elements.mount.value;updateTravel();};
      travelForm.addEventListener('input',update);travelForm.addEventListener('change',update);updateTravel();
    }
    extension.afterRender?.(state.page);
  }
  const related=(title,content)=>`<section class="atlas-related"><h4>${title}</h4>${content}</section>`;
  const mapFor=index=>db.maps.find(m=>m.index===index);
  function detail(kind,id){
    const extra=extension.detail?.(kind,id);if(extra)return extra;
    let x=allEntries.find(e=>e.kind===kind&&e.record?.id===id)?.record,body='',image='';
    if(!x)return null;
    if(kind==='item'){
      body=related(t('equipment.baseStats'),statRows(x.values))+related(t('equipment.requirementsPrices'),rows([[t('equipment.slot'),slotName(x.slot)],[t('equipment.level'),num(x.level)],[t('equipment.class'),(x.classes??[]).map(c=>classNames[c]??c).join(', ')||t('equipment.anyClass')],[t('equipment.tier'),'T'+x.tier],[t('equipment.buyPrice'),num(x.buyPrice)+' '+t('equipment.currency')],[t('equipment.sellPrice'),num(x.sellPrice)+' '+t('equipment.currency')]]))+
        related(t('equipment.upgrade'),table([t('equipment.nextTier'),t('equipment.baseChance')],(db.forge.chancesByTier[x.tier]??db.forge.chances).map((v,i)=>[num(i+1),pct(v)]))+notice(t('equipment.forgeNotice'))) +
        related(t('equipment.setRelationship'),x.family?db.sets.filter(s=>s.familyId===x.family).map(s=>link('sets','set',s)).join(' '):notice(t('equipment.noVerifiedSet')));
    }else if(kind==='set'){
      const familyItems=db.items.filter(item=>item.family===x.familyId);
      body=notice(t('sets.editorialDisclaimer'))+related(t('sets.bonuses'),x.bonuses.map(b=>`<h4>${t('sets.pieces',{count:num(b.pieces)})}</h4>${statRows(Object.fromEntries(b.stats.map(s=>[s.stat,s.value])))}`).join(''))+rows([[t('sets.level'),num(x.itemLevel)],[t('sets.slots'),x.slots.map(s=>slotName(s)).join(', ')],[t('sets.uniqueId'),x.unique.id]])+related(t('sets.relatedEquipment'),familyItems.length?familyItems.map(item=>link('equipment','item',item)).join(' '):notice(t('sets.itemsMissing')))+related(t('sets.relatedBossMap'),link('world','boss',db.bosses.find(b=>b.id===x.bossId))+link('world','map',mapFor(x.mapIndex)));
    }else if(kind==='pet'){
      body=petUI.calculator(x)+
        related(t('pets.detail.requirements'),rows([[t('pets.detail.minimumHeroLevel'),db.petRules.minHeroLevel],[t('pets.detail.hatchTime'),num(db.petRules.hatchHours)+' '+t('mounts.travel.hours')]]))+petUI.detail()+
        related(t('pets.detail.related'),(x.signature?`<p>${esc(t('pets.detail.speciesSignature'))}: ${link('pets','skill',{id:x.signature,name:db.petSkillNames[x.signature]?.name??x.signature})}</p>`:notice(t('pets.detail.noSignature')))+link('world','map',mapFor(x.map))+(x.dungeon?link('world','dungeon',db.dungeons.find(d=>d.id===x.dungeon)):''));
    }else if(kind==='skill'){
      body=petUI.skillDetail(id);
    }else if(kind==='mount'){
      const descriptionKey='mount.desc.'+x.id;
      const description=Object.hasOwn(i18n.dictionaries.en,descriptionKey)?t(descriptionKey):t('mounts.detail.descriptionUnavailable');
      body=`<p>${esc(description)}</p>`+rows([[t('mounts.detail.level'),num(x.level)],[t('mounts.detail.travelMultiplier'),num(x.travelMult)],[t('mounts.detail.timeReduction'),pct(1-x.travelMult)],[t('mounts.detail.rentalPrice'),num(x.price)+' '+t('mounts.currency.'+x.currency)],[t('mounts.detail.duration'),num(x.days)+' '+t('mounts.travel.days')],[t('mounts.detail.availability'),t('mounts.detail.unknown')]])+notice(t('mounts.detail.energyWarning'));
      if(x.ramp)body=notice(t('mounts.detail.rampWarning'))+table([t('mounts.detail.rampLevel'),t('mounts.detail.rawMultiplier')],x.ramp.map(r=>[num(r.level),num(r.travelMult)]))+body;
    }else if(kind==='map'){
      body=(x.strength?rows([[t('world.runStrength'),exact(x.strength.run)],[t('world.bossStrength'),exact(x.strength.boss)]]):'')+table([t('world.stone'),t('world.strength')],x.stones.map(s=>[esc(s.id),s.strength===undefined?t('world.noValue'):exact(s.strength)]))+notice(t('world.strengthNotice'))+rows([[t('world.levelRange'),x.minLevel+'–'+x.maxLevel],[t('world.spotCount'),x.spots.length],[t('world.stoneCount'),x.stones.length]])+related(t('world.areaBosses'),db.bosses.filter(b=>b.mapIndex===x.index).map(b=>link('world','boss',b)).join(' '))+related(t('world.enemies'),db.mobs.filter(m=>m.mapIndex===x.index).map(m=>link('world','mob',m)).join(' '))+related(t('world.spots'),table([t('world.id'),t('world.unlockLevel'),t('world.material')],x.spots.map(s=>[esc(i18n.dictionaries.hu['game.spot.'+s.id]?t('game.spot.'+s.id)+' ('+s.id+')':s.id),num(s.opensAt),worldMaterial(s.materialId)])));
    }else if(kind==='boss'||kind==='mob'){
      const m=kind==='boss'?db.mobs.find(m=>m.id===x.mobId):x;
      if(m.id==='m4_boss')image=art('m4_boss',x.name,'atlas-detail-art');
      body=rows([[t('world.name'),gameName('mob',m)],[t('world.level'),num(m.level)],[t('world.power'),num(m.harcero)],[t('world.hp'),num(m.maxHp)],[t('world.damage'),num(m.atkMin)+'–'+num(m.atkMax)],[t('world.defence'),num(m.def)],['XP',num(m.xp)],['Nyang',num(m.nyangMin)+'–'+num(m.nyangMax)]])+notice(t('world.combatUnknown'))+related(t('world.relatedMap'),link('world','map',mapFor(m.mapIndex)))+(m.materialId?related(t('world.relatedMaterial'),worldMaterial(m.materialId)):'')+related(t('world.relatedSets'),db.sets.filter(s=>s.bossId===(kind==='boss'?x.id:db.bosses.find(b=>b.mobId===m.id)?.id)).map(s=>link('sets','set',s)).join(' ')||notice(t('world.noSets')));
    }else if(kind==='dungeon'){
      const roomHeaders=[t('world.room'),t('world.creature'),t('world.role'),t('world.level'),'HP',t('world.damage'),t('world.defence'),t('world.power'),'XP','Nyang'];
      const roomRows=rooms=>rooms.map(r=>[r.room,esc(i18n.dictionaries.hu['game.creature.'+r.creatureId]?t('game.creature.'+r.creatureId)+' ('+r.creatureId+')':r.creatureId),esc(t(({regular:'world.roleRegular',miniboss:'world.roleMiniboss',boss:'world.roleBoss'})[r.role]??'world.roleUnknown')),r.level,num(r.maxHp),num(r.atkMin)+'–'+num(r.atkMax),exact(r.def),num(r.harcero),num(r.xp),num(r.nyang)]);
      body=`<p>${esc(dungeonDescription(x))}</p>`+rows([[t('world.minimumLevel'),x.minLevel],[t('world.maximumLevel'),x.maxLevel],[t('world.recommendedLevel'),x.recommendedLevel],[t('world.keyPrice'),num(x.keyCoins)+' '+t('world.currency')],[t('world.keysPerDay'),x.keysPerDay],[t('world.heroicLevel'),x.heroic.minLevel],[t('world.heroicKeyCost'),x.heroic.keyCost],[t('world.freeSlots'),x.minFreeSlots],[t('world.potionCap'),x.potionCap],[t('world.firstClear'),num(x.firstClearCoins)+' '+t('world.currency')],[t('world.heroicFirstClear'),num(x.heroic.firstClearCoins)+' '+t('world.currency')]])+notice(t('world.defenceNotice'))+notice(t('world.lootUnknown'))+related(t('world.normalRooms'),table(roomHeaders,roomRows(x.rooms)))+related(t('world.heroicRooms'),table(roomHeaders,roomRows(x.heroic.rooms)));
    }else if(kind==='class'){
      body=(x.availablePaths?.length?related('Képességutak · aktuális API',table(['Út','Könyvparaméter','Fő hatás','Hatáskorlát'],x.availablePaths.map(p=>[esc(p.id),exact(p.bookRate),esc(p.main?.kind??'Nincs külön fő hatás'),p.main?exact(p.main.limit):'–']))+notice('Nyers képességparaméterek; a teljes könyv- és soft-cap képlet még nem igazolt.')):'')+related('Alapstatisztikák',statRows(x.baseStats))+related('Kasztképesség: '+x.skill.id,statRows(Object.fromEntries(Object.entries(x.skill).filter(([k])=>k!=='id'))))+`<a class="atlas-inline-link" href="#karakteralkotas">Kasztválasztó és összehasonlítás →</a>`;
    }else if(kind==='research'){
      const descKey='game.researchDescription.'+id;
      body=`<p>${esc(i18n.dictionaries.hu[descKey]===x.description?t(descKey):x.description)}</p>`+rows([[t('world.minimumLevel'),num(x.minLevel)],[t('research.samples'),num(x.samplesNeeded)],[t('research.sampleId'),x.sampleId]])+related(t('research.reward'),statRows(x.reward))+related(t('research.sampleSource'),link('world','mob',db.mobs.find(m=>m.id===x.sampleMobId)));
    }else if(kind==='material'){
      body=`<p>${esc(db.economy.stackKindNames[x.kind]?.hint??'A pontos felhasználás további ellenőrzést igényel.')}</p>`+rows([['Típus',summary(kind,x)],['Eladási ár',x.sellPrice==null?'Nem ismert':num(x.sellPrice)+' nyang']]);
      const p=db.pets.find(p=>p.egg===x.id);if(p)body+=related('Kapcsolódó kísérő',link('pets','pet',p));
    }else if(kind==='building'){
      image=art('bld_'+id,x.name,'atlas-detail-art');
      body=`<p>${esc(t('guild.effectDescription',{effect:buildingEffect(id)}))}</p>`+table([t('world.level'),t('guild.effect'),t('guild.upgradeTime'),t('guild.speedup'),'Nyang',t('guild.material')],x.levels.map(l=>[num(l.level),num(l.effect)+(l.effectUnit==='members'?' '+t('guild.members'):'%'),num(l.upgradeHoursToLevel)+' '+t('guild.hours'),num(math.speedup(l.upgradeHoursToLevel,l.level,db.economy.limits.guildSpeedup))+' '+t('guild.coins'),t('guild.unknown'),t('guild.unknown')]))+notice(t('guild.missingCosts'));
    }
    const chosen=media?.forRecord(kind==='boss'?'mob':kind,kind==='boss'?x.mobId:id);
    if(kind==='item')body+=extension.bonusInfo?.(x.slot)??'';
    if(chosen)image=media.render(chosen,{className:'atlas-detail-art',alt:kind==='set'?setTitle(x):x.name});
    if(kind==='pet')image=petUI.portrait(x);
    const pictures=media?.related(kind==='boss'?'mob':kind,kind==='boss'?x.mobId:id)??[];
    const englishNameKey=i18n.gameNameKey(kind,x);
    return design.detail({kind,x,id,image,body,actions:extension.actions?.(kind,x)??'',glyph:glyph(kind==='item'?x.slot:kind),pictures:pictures.length?related(t('common.relatedArt'),`<div class="atlas-media-strip">${pictures.slice(0,10).map(im=>`<a href="${route('gallery','image',im.id)}">${media.render(im)}<span>${esc(im.name)}</span></a>`).join('')}</div><a class="atlas-inline-link" href="#atlas/gallery">${t('common.openGallery')}</a>`):'',english:rows([[t('common.englishName'),englishNameKey?(['map','mob','boss','dungeon','building','research'].includes(kind)?i18n.dictionaries.en[englishNameKey]:t(englishNameKey)):x.nameEn??t('equipment.englishNameUnavailable')]]),source:sourceNote({...x,provenance:x.provenance??(kind==='building'?db.guild.provenance:{source:'03_kiserok.json',status:'verified'})})});
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
    if(state.page!==requested||(state.query&&!(['world','guild','home'].includes(requested)&&((parts[2]&&parts[3])||dialog.open)))){state.page=requested;state.query='';$('#atlas-search').value='';state.pageNumber=1;}
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
  const navToggle=$('#atlas-nav-toggle'),navBackdrop=$('#atlas-nav-backdrop');
  function toggleNav(open){document.body.classList.toggle('atlas-nav-open',open);navToggle.setAttribute('aria-expanded',String(open));navBackdrop.hidden=!open;if(open)$('#atlas-nav-close').focus();else navToggle.focus({preventScroll:true});}
  navToggle.addEventListener('click',()=>toggleNav(navToggle.getAttribute('aria-expanded')!=='true'));
  $('#atlas-nav-close').addEventListener('click',()=>toggleNav(false));navBackdrop.addEventListener('click',()=>toggleNav(false));
  function selectDetailTab(button){const key=button.dataset.detailTab,folio=button.closest('.folio');for(const tab of folio.querySelectorAll('[data-detail-tab]')){const active=tab===button;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;}for(const panel of folio.querySelectorAll('.folio-panel'))panel.hidden=panel.id!=='folio-panel-'+key;}
  function refreshLocalizedDetail(){
    const dialog=$('#atlas-detail');
    if(!dialog.open)return;
    const tab=dialog.querySelector('[data-detail-tab][aria-selected="true"]')?.dataset.detailTab;
    const scrollTop=dialog.scrollTop,[hashPath]=location.hash.slice(1).split('?');
    const formState=[...dialog.querySelectorAll('input,select,textarea')].map(control=>({tag:control.tagName,value:control.value,checked:control.checked}));
    let parts;
    try{parts=hashPath.split('/').map(decodeURIComponent);}catch{return;}
    if(parts[0]!=='atlas'||!parts[2]||!parts[3])return;
    const body=detail(parts[2],parts[3]);
    if(!body)return;
    $('#atlas-detail-body').innerHTML=body;
    [...dialog.querySelectorAll('input,select,textarea')].forEach((control,index)=>{
      const saved=formState[index];
      if(!saved||saved.tag!==control.tagName)return;
      control.value=saved.value;
      control.checked=saved.checked;
      control.dispatchEvent(new Event('input',{bubbles:true}));
    });
    const activeTab=tab&&dialog.querySelector(`[data-detail-tab="${tab}"]`);
    if(activeTab)selectDetailTab(activeTab);
    dialog.scrollTop=scrollTop;
  }
  document.addEventListener('submit',e=>{if(e.target.id==='atlas-portal-search'){e.preventDefault();state.query=$('#portal-query').value.trim();$('#atlas-search').value=state.query;state.pageNumber=1;render();$('#atlas-search').focus({preventScroll:true});}});
  document.addEventListener('keydown',e=>{const tab=e.target.closest('[data-detail-tab]');if(tab&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const tabs=[...tab.closest('.folio-tabs').querySelectorAll('[data-detail-tab]')],i=tabs.indexOf(tab),next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;selectDetailTab(tabs[next]);tabs[next].focus();}if(document.body.classList.contains('atlas-nav-open')){if(e.key==='Escape')toggleNav(false);if(e.key==='Tab'){const focusable=[...$('#atlas-sidebar').querySelectorAll('a,button')].filter(el=>el.getClientRects().length),first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}});
  window.matchMedia?.('(min-width:1025px)').addEventListener?.('change',event=>{if(event.matches&&document.body.classList.contains('atlas-nav-open'))toggleNav(false);});
  $('#atlas-detail-close').addEventListener('click',closeDetail);
  $('#atlas-detail').addEventListener('cancel',e=>{e.preventDefault();closeDetail();});
  $('#atlas-detail').addEventListener('click',e=>{if(e.target===$('#atlas-detail')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDetail();}});
  $('#atlas-detail').addEventListener('close',()=>{document.body.classList.remove('atlas-dialog-open');if(lastOpener?.isConnected)lastOpener.focus({preventScroll:true});else $(`[data-atlas-page="${state.page}"]`)?.focus({preventScroll:true});});
  $('#atlas-search').addEventListener('input',e=>{state.query=e.target.value.trim();state.pageNumber=1;render();});
  $('#atlas-clear').addEventListener('click',()=>{state.query='';$('#atlas-search').value='';state.pageNumber=1;render();$('#atlas-search').focus();});
  document.addEventListener('click',e=>{
    const nav=e.target.closest('[data-atlas-page]');if(nav){if(document.body.classList.contains('atlas-nav-open'))toggleNav(false);if(nav.hash===location.hash)syncRoute();}
    const detailTab=e.target.closest('[data-detail-tab]');if(detailTab)selectDetailTab(detailTab);
    const page=e.target.closest('[data-pagination]');if(page){state.pageNumber+=Number(page.dataset.pagination);render();$('#atlas-controls').scrollIntoView({block:'start'});$('#atlas-result-status').setAttribute('tabindex','-1');$('#atlas-result-status').focus({preventScroll:true});}
    const tab=e.target.closest('[data-world]');if(tab){state.world=tab.dataset.world;state.pageNumber=1;render();$(`[data-world="${state.world}"]`).focus({preventScroll:true});}
    if(e.target.closest('#atlas-reset')){Object.assign(state,{query:'',searchCategory:'all',slot:'all',character:'all',rarity:'all',maxLevel:'',pageNumber:1});$('#atlas-search').value='';render();$('#atlas-search').focus();}
    const anchor=e.target.closest('a[href^="#cikk-"],a[href^="#gyik-"]');if(anchor){const target=document.getElementById(anchor.hash.slice(1));if(target)target.open=true;}
  });
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&!e.target.closest('input,select,textarea,[contenteditable="true"]')&&!$('#atlas-detail').open&&!$('#image-lightbox').open){e.preventDefault();e.stopImmediatePropagation();$('#atlas-search').focus();$('#atlas').scrollIntoView({block:'start'});}},true);
  window.addEventListener('hashchange',()=>syncRoute());
  extension=globalThis.AtlasExtensions?.init({db,media,esc,norm,num,pct,slots,rarities,classNames,label,value,icon,chip,notice,rows,statRows,table,route,link,heading,state,render,petUI})??{};
  i18n.onChange(()=>{
    const portalQuery=$('#portal-query')?.value;
    render();
    if(portalQuery!==undefined&&$('#portal-query'))$('#portal-query').value=portalQuery;
    refreshLocalizedDetail();
  });
  render();syncRoute(false);
})();
