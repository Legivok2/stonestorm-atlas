/* A Képtár, összehasonlító és karaktertervező ugyanannak az Atlasnak a moduljai. */
globalThis.AtlasExtensions={
  categories:[['arena','Aréna',null,'swords'],['gallery','Képtár',null,'book'],['compare','Felszerelés-összehasonlító',null,'swords'],['planner','Karaktertervező',null,'shield'],['stat-limits','📊 Stat limitek',null,'shield'],['bonuses','Bónuszrendszer',null,'spark'],['updates','Atlas frissítések',null,'book'],['upcoming','Közelgő tartalmak',null,'book']],
  init(ui){
    const bonusSystem=globalThis.AtlasBonusUI.init(ui);
    const statLimits=globalThis.AtlasStatLimitsUI.init({...ui,bonusSystem});
    const syncUI=globalThis.AtlasSyncUI.init(ui);
    const futureUI=globalThis.AtlasFutureContentUI.init(ui);
    const homeArena=globalThis.AtlasHomeArenaUI.init(ui);
    const {db,media,esc,norm,num,pct,slots,rarities,label,value,icon,chip,notice,rows,statRows,table,route,link,heading,state,render,petUI}=ui;
    const i18n=globalThis.AtlasI18n,t=(key,params)=>i18n.t(key,params),english=()=>i18n.getLocale()==='en';
    const className=id=>t('game.class.'+id);
    const localizedClasses=()=>Object.fromEntries(db.classes.map(c=>[c.id,className(c.id)]));
    const $=s=>document.querySelector(s);
    const catalog=media.catalog;
    const categoryNames=Object.fromEntries(catalog.categories.map(c=>[c.id,c.name]));
    const statuses={identified:'Azonosított',partial:'Részben azonosított',unknown:'Ismeretlen'};
    const kinds={item:['equipment',db.items],pet:['pets',db.pets],mount:['mounts',db.mounts],mob:['world',db.mobs],map:['world',db.maps],set:['sets',db.sets],dungeon:['world',db.dungeons],class:['classes',db.classes],material:['materials',db.economy.stackables],research:['home',db.research],building:['guild',db.guild.buildings.map(x=>({...x,id:x.kind,name:x.nameHu}))]};
    const entity=r=>kinds[r.kind]?.[1].find(x=>x.id===r.id);
    const wikiLink=r=>{const x=entity(r);return x?link(kinds[r.kind][0],r.kind,x):'';};
    const imageLink=im=>route('gallery','image',im.id);
    const select=(id,title,opts,selected,all=false)=>`<label>${esc(title)}<select id="${id}">${all?`<option value="all">${esc(t('common.all'))}</option>`:''}${Object.entries(opts).map(([k,v])=>`<option value="${esc(k)}" ${String(k)===String(selected)?'selected':''}>${esc(v)}</option>`).join('')}</select></label>`;
    const field=(id,title,value,min,max,step='1')=>`<label>${esc(title)}<input id="${id}" type="number" min="${min}" max="${max}" step="${step}" value="${value}" /></label>`;
    const gallery={query:'',category:'all',status:'all',sort:'name',page:1};
    const searchText=new Map(catalog.entries.map(im=>[im.id,norm([im.name,im.id,categoryNames[im.category],im.title,...im.relations.map(r=>entity(r)?.name??r.id)].join(' '))]));
    function galleryPage(){
      return heading('A vihar képtára','Az eredeti grafikák teljes helyi gyűjteménye. A fájlváltozat neve nem követelményszint; a bizonytalan kapcsolatokat külön jelöljük.')+
        `<div class="catalog-stats">${[[catalog.stats.available,'elérhető kép'],[catalog.stats.categories,'kategória'],[catalog.stats.identified,'azonosított'],[catalog.stats.partial,'részben azonosított'],[catalog.stats.unknown,'ismeretlen']].map(([n,t])=>`<div><strong>${num(n)}</strong><span>${t}</span></div>`).join('')}</div><div class="atlas-filters catalog-toolbar"><label class="catalog-query">Keresés a teljes képtárban<input id="catalog-query" type="search" value="${esc(gallery.query)}" placeholder="Fájlnév, magyar név, azonosító…" /></label>${select('catalog-category','Kategória',categoryNames,gallery.category,true)}${select('catalog-status','Azonosítás',statuses,gallery.status,true)}${select('catalog-sort','Rendezés',{name:'Név',category:'Kategória',filename:'Fájlnév'},gallery.sort)}</div><p id="catalog-status-line" role="status" aria-live="polite"></p><div id="catalog-results"></div>`;
    }
    function updateGallery(){
      const tokens=norm(gallery.query).split(/\s+/).filter(Boolean);
      const list=catalog.entries.filter(im=>(gallery.category==='all'||im.category===gallery.category)&&(gallery.status==='all'||im.status===gallery.status)&&tokens.every(t=>searchText.get(im.id).includes(t)));
      list.sort((a,b)=>(gallery.sort==='category'?categoryNames[a.category].localeCompare(categoryNames[b.category],'hu'):0)||(gallery.sort==='name'?(a.title??a.name).localeCompare(b.title??b.name,'hu'):a.filename.localeCompare(b.filename,'hu'))||a.id.localeCompare(b.id));
      const pages=Math.ceil(list.length/24)||1;gallery.page=Math.max(1,Math.min(gallery.page,pages));
      $('#catalog-status-line').textContent=`${num(list.length)} találat · ${gallery.page} / ${pages}. oldal · ${num(catalog.stats.uniqueContent)} különböző képtartalom a teljes gyűjteményben`;
      $('#catalog-results').innerHTML=list.length?`<div class="catalog-grid">${list.slice((gallery.page-1)*24,gallery.page*24).map(im=>`<a class="catalog-card category-${im.category}" href="${imageLink(im)}"><div class="catalog-preview">${media.render(im,{thumbnail:true})}</div><div class="catalog-copy"><span>${esc(categoryNames[im.category])}</span><h4>${esc(im.title??im.name)}</h4><small>${esc(im.filename)}</small>${chip(statuses[im.status],im.status==='identified'?'verified':'unknown')}</div></a>`).join('')}</div><div class="atlas-pagination"><button type="button" data-gallery-page="-1" ${gallery.page===1?'disabled':''}>← Előző</button><span>${gallery.page} / ${pages}</span><button type="button" data-gallery-page="1" ${gallery.page===pages?'disabled':''}>Következő →</button></div>`:'<div class="atlas-empty"><h4>Nincs ilyen kép.</h4><p>Válassz más kategóriát vagy keresőkifejezést.</p></div>';
    }
    function imageDetail(id){
      const im=media.entries.get(id);if(!im)return null;
      return `<p class="eyebrow">STONESTORM / KÉPTÁR</p><h2 id="atlas-detail-title">${esc(im.title??im.name)}</h2><div class="catalog-full-image">${media.render(im,{eager:true})}</div>${chip(statuses[im.status],im.status==='identified'?'verified':'unknown')}${rows([['Fájlnév',im.filename],['Katalógusazonosító',im.id],['Kategória',categoryNames[im.category]],['Felbontás',im.width+' × '+im.height],['Fájlméret',num(im.bytes/1024)+' KiB'],['Eredeti helyi fájl',im.originalFile],['Magyar név',im.title??'Nem ismert']])}<a class="atlas-action" href="${esc(im.originalFile)}" target="_blank" rel="noopener">Eredeti felbontás megnyitása ↗</a><section class="atlas-related"><h4>Kapcsolódó Wiki-adatlapok</h4>${im.relations.length?im.relations.map(r=>`<div class="catalog-relation">${wikiLink(r)}${chip(statuses[r.status],r.status==='identified'?'verified':'unknown')}<p>${esc(r.evidence)}</p></div>`).join(''):notice('Ehhez a grafikához nincs igazolt játékadat. A fájlnév nem hivatalos tárgynév vagy statisztika.')}</section>${im.character?notice('Teljes karakterkép vagy portré. A megjelenés nem változik ráillesztett fegyverréteggel. Az l/t jelzés grafikai változatkód.'):''}<p class="atlas-source-note">Eredet: ${esc(im.sourceUrl)}<br />SHA-256: ${esc(im.sha256)}<br />Nyilvános újraközlési engedély: nem igazolt.</p>`;
    }
    const viewer={classId:'ninja',gender:'male',look:1,mode:'weapon',query:'',level:'all',family:'all',tier:'all',page:1,selected:[],itemOverrides:{}};
    const imageRecord=im=>{
      const exact=db.items.find(x=>x.id===im.name);
      if(exact)return exact;
      return im.relations.filter(r=>r.kind==='item'&&r.status==='identified').map(entity)[0]??null;
    };
    const selectedRecord=im=>db.items.find(x=>x.id===viewer.itemOverrides[im.id])??imageRecord(im);
    function viewerImages(){
      return catalog.entries.filter(im=>viewer.mode==='appearance'?im.category==='body'&&im.character?.classId===viewer.classId&&im.character.gender===viewer.gender&&im.character.look===Number(viewer.look):(viewer.mode==='weapon'?im.category==='weapons'&&im.name.startsWith('w_'+viewer.classId+'_'):im.category==='icons'&&im.name.startsWith('a_'+viewer.classId+'_'))).filter(im=>{
        const item=imageRecord(im),family=item?.family??im.character?.appearance.match(/^set_(m\d+)$/)?.[1];
        return (viewer.level==='all'||item?.level===Number(viewer.level))&&(viewer.family==='all'||family===viewer.family)&&(viewer.tier==='all'||item?.tier===Number(viewer.tier))&&norm([im.name,im.title,item?.name].join(' ')).includes(norm(viewer.query));
      }).sort((a,b)=>(imageRecord(a)?.level??0)-(imageRecord(b)?.level??0)||a.name.localeCompare(b.name));
    }
    function comparePage(){
      const levels=Object.fromEntries([...new Set(db.items.filter(x=>(x.classes??[]).includes(viewer.classId)).map(x=>x.level))].sort((a,b)=>a-b).map(l=>[l,t('compare.levelOption',{level:num(l)})]));
      return heading(t('compare.title'),t('compare.copy'))+
        `<div class="atlas-filters tool-settings">${select('viewer-class',t('compare.class'),localizedClasses(),viewer.classId)}${select('viewer-gender',t('compare.gender'),{male:t('compare.male'),female:t('compare.female')},viewer.gender)}${select('viewer-look',t('compare.look'),{1:t('compare.original'),2:t('compare.second')},viewer.look)}${select('viewer-mode',t('compare.view'),{weapon:t('compare.weapons'),armor:t('compare.armor'),appearance:t('compare.appearance')},viewer.mode)}${select('viewer-level',t('compare.level'),levels,viewer.level,true)}${select('viewer-family',t('compare.family'),Object.fromEntries(db.sets.map(s=>[s.familyId,english()?t('sets.familyName',{map:t('sets.mapName.'+s.familyId)}):s.name])),viewer.family,true)}${select('viewer-tier',t('compare.tier'),Object.fromEntries([0,1,2,3,4,5].map(tier=>[tier,'T'+tier])),viewer.tier,true)}<label>${t('compare.search')}<input id="viewer-query" type="search" value="${esc(viewer.query)}" placeholder="${esc(t('compare.placeholder'))}" /></label></div>
        <p class="atlas-notice">${t('compare.warning')}</p><div id="viewer-comparison" aria-live="polite"></div><p id="viewer-status" role="status"></p><div id="viewer-images"></div>`;
    }
    function compareStats(images){
      const items=images.map(selectedRecord);
      const statKeys=[...new Set(items.flatMap(x=>Object.keys(x?.values??{})))];
      return table([t('compare.stat'),'A','B','B − A'],[
        [t('compare.verifiedLevel'),...items.map(x=>x?num(x.level):t('compare.unknown')),'—'],
        ...statKeys.map(k=>{const a=items[0]?.values[k],b=items[1]?.values[k],delta=Number.isFinite(a)&&Number.isFinite(b)?b-a:null;return [esc(label(k)),a==null?t('compare.unknown'):value(k,a),b==null?t('compare.unknown'):value(k,b),delta==null?t('compare.notCalculable'):`<span class="${delta>0?'stat-better':delta<0?'stat-worse':''}">${delta>0?'+':''}${value(k,delta)}</span>`];})
      ]);
    }
    function updateViewer(){
      const list=viewerImages(),pages=Math.ceil(list.length/24)||1;viewer.page=Math.max(1,Math.min(viewer.page,pages));
      $('#viewer-status').textContent=t('compare.status',{count:num(list.length),selected:num(viewer.selected.length),page:num(viewer.page),pages:num(pages)});
      $('#viewer-images').innerHTML=`<div class="catalog-grid viewer-grid">${list.slice((viewer.page-1)*24,viewer.page*24).map(im=>{const x=imageRecord(im);return `<article class="catalog-card ${viewer.selected.includes(im.id)?'selected':''}"><div class="catalog-preview">${media.render(im,{thumbnail:true})}</div><div class="catalog-copy"><h4>${esc(x?.name??im.title??im.name)}</h4><small>${esc(im.filename)}</small><p>${x?esc(t('compare.itemLevel',{level:num(x.level),tier:x.tier})):t('compare.levelUnknown')}</p>${chip(t('compare.'+({identified:'identified',partial:'partial',unknown:'unidentified'})[im.status]),im.status==='identified'?'verified':'unknown')}<button class="atlas-action" type="button" data-viewer-pick="${im.id}" aria-pressed="${viewer.selected.includes(im.id)}">${t(viewer.selected.includes(im.id)?'compare.remove':'compare.pick')}</button><a class="atlas-inline-link" href="${imageLink(im)}">${t('compare.imageDetail')}</a></div></article>`;}).join('')}</div>${list.length?'':`<div class="atlas-empty">${t('compare.empty')}</div>`}<div class="atlas-pagination"><button type="button" data-viewer-page="-1" ${viewer.page===1?'disabled':''}>${t('compare.previous')}</button><span>${viewer.page} / ${pages}</span><button type="button" data-viewer-page="1" ${viewer.page===pages?'disabled':''}>${t('compare.next')}</button></div>`;
      const selected=viewer.selected.map(id=>media.entries.get(id)).filter(Boolean);
      $('#viewer-comparison').innerHTML=selected.length?`<div class="viewer-panels">${selected.map((im,i)=>{const x=selectedRecord(im);return `<article><p class="eyebrow">${esc(t('compare.build',{side:i?'B':'A'}))}</p><div class="viewer-large-image">${media.render(im,{eager:true})}</div><h4>${esc(x?.name??im.title??im.name)}</h4><p>${esc(im.filename)}${x?' · '+esc(t('compare.requiredLevel',{level:num(x.level)})):''}</p>${x?statRows(x.values)+link('equipment','item',x):notice(t('compare.noStats'))}<button type="button" class="atlas-action" data-viewer-pick="${im.id}">${t('compare.removeButton')}</button></article>`;}).join('')}</div>${selected.length===2?compareStats(selected):notice(t('compare.selectOne'))}`:notice(t('compare.selectTwo'));
    }
    function detailActions(kind,x){
      if(['item','pet','mount'].includes(kind))return `<div class="atlas-actions">${kind==='item'?`<a class="atlas-action" href="#atlas/compare?item=${encodeURIComponent(x.id)}">${t('compare.action')}</a>`:''}<a class="atlas-action" href="#atlas/planner?kind=${kind}&add=${encodeURIComponent(x.id)}">${t('compare.addPlanner')}</a></div>`;
      return '';
    }
    const model=globalThis.StonestormPlanner;
    const storageKey='stonestorm-atlas-builds-v1';
    const planner={active:'A',drafts:{A:model.empty(db),B:model.empty(db)},editing:{A:null,B:null},saved:[],savedId:'',slot:'weapon',query:'',pickerPage:1,comparing:false,message:{parts:[]},share:''};
    try{
      const stored=JSON.parse(localStorage.getItem(storageKey));
      if([1,2,3].includes(stored?.version)&&Array.isArray(stored.builds))planner.saved=stored.builds.slice(0,20).filter(r=>typeof r.id==='string'&&r.id.length<=100&&[1,2,3,undefined].includes(r.build?.version)).map(r=>({id:r.id,build:model.normalize(r.build,db).build}));
    }catch{planner.message={parts:[{key:'planner.message.storageError'}]};}
    const activeBuild=()=>planner.drafts[planner.active];
    const setMessage=(key,params={})=>{planner.message={parts:[{key,params}]};};
    const plannerMessage=()=>planner.message.parts.map(part=>part.key?t(part.key,part.params):part.text).join(' ');
    function setModelErrors(errors){
      const parts=errors.map(message=>{
        const itemError=': nem használható vagy ismeretlen tárgy eltávolítva.';
        if(message.endsWith(itemError)){
          const slot=Object.keys(slots).find(id=>message.startsWith(slots[id]+':'));
          return slot?{key:'planner.error.itemRemoved',params:{slot:t('equipment.slot.'+slot)}}:{text:message};
        }
        const exact={
          'A kísérő minimumszintje nem teljesül, vagy azonosítója ismeretlen.':'planner.error.petUnlock',
          'A hátas minimumszintje nem teljesül, vagy azonosítója ismeretlen.':'planner.error.mountUnlock',
          'A megosztott build túl hosszú vagy érvénytelen.':'planner.error.invalidShare',
          'Nem támogatott buildverzió.':'planner.error.version',
          'A buildhivatkozás nem érvényes JSON.':'planner.error.json',
          'Régi buildformátumot V3 Pet Builder sémára migráltunk; a kísérőforma, rang és képességhelyek ellenőrizve lettek.':'planner.error.migrated'
        };
        return exact[message]?{key:exact[message]}:{text:message};
      });
      if(english())for(const part of parts)if(part.text)part.key='planner.error.generic';
      planner.message={parts};
    }
    function setDraft(input){const result=model.normalize(input,db);planner.drafts[planner.active]=result.build;setModelErrors(result.errors);planner.share='';return result.build;}
    function plannerStats(calc){
      const nonzero=Object.fromEntries(Object.entries(calc.equipment).filter(([,v])=>v!==0));
      return `<h4>${esc(t('planner.knownComponents'))}</h4><p class="planner-stat-label">${esc(t('planner.baseStats'))}</p>${statRows(calc.baseStats)}<p class="planner-stat-label">${esc(t('planner.equipmentSum'))}</p>${Object.keys(nonzero).length?statRows(nonzero):`<p>${esc(t('planner.noEquipment'))}</p>`}${chip(t('planner.notFinal'),'unknown')}<p>${esc(t('planner.statLimit'))}</p><details><summary>${esc(t('planner.howCalculate'))}</summary><p>${esc(t('planner.calculation'))}</p></details>`;
    }
    function setSummary(calc){
      const setName=s=>english()?t('sets.familyName',{map:t('sets.mapName.'+s.familyId)}):s.name;
      return `<div class="planner-bonus-panel"><h4>${esc(t('planner.setTargets'))}</h4>${calc.sets.length?calc.sets.map(s=>`<article><h4>${esc(setName(s.set))}</h4>${chip(t('planner.setCount',{count:s.count,total:s.set.slots.length}))}<ul>${s.set.bonuses.map(b=>`<li class="${s.count>=b.pieces?'stat-better':''}">${s.count>=b.pieces?esc(t('planner.active')):esc(t('planner.inactive'))} · ${esc(t('planner.pieces',{count:b.pieces}))}: ${b.stats.map(v=>esc(label(v.stat))+' +'+value(v.stat,v.value)).join(' · ')}</li>`).join('')}</ul><p>${esc(t('planner.missing'))}: ${s.missingSlots.map(slot=>t('equipment.slot.'+slot)).join(', ')||t('planner.none')}.</p><p>${esc(t('planner.setLimits'))}</p>${link('sets','set',s.set)}</article>`).join(''):`<p>${esc(t('planner.setNoItems'))}</p>`}</div>`;
    }
    function companions(calc){
      const b=calc.build;
      const pets=Object.fromEntries(db.pets.filter(p=>b.level>=db.petRules.minHeroLevel).map(p=>[p.id,petUI.petName(p)]));
      const mounts=Object.fromEntries(db.mounts.filter(m=>m.level<=b.level&&!m.ramp).map(m=>[m.id,m.name]));
      const stage=db.petSystem.stages[b.petForm-1];
      const forms=Object.fromEntries(db.petSystem.stages.map(s=>[s.form,`${s.form}. ${petUI.formName(s.form)} · ${t('pets.progression.capLabel',{level:num(s.maxLevel)})}${s.minLevel>b.level?' · '+t('pets.progression.minHero',{level:num(s.minLevel)}):''}`]));
      const petRecord=calc.pet?.record,signature=petRecord?.signature;
      const observedReference=globalThis.StonestormPets.observedReferencePreset();
      const observed=b.petObservedPreset===observedReference.presetId&&b.petId===observedReference.petId&&b.petLevel===observedReference.level&&b.petForm===observedReference.form;
      const skillEntries=Object.entries(db.petSkills).filter(([id])=>id!==signature);
      const skillDescription=(id,level)=>esc(petUI.skillDescription(id,level));
      const skillName=id=>petUI.skillName(id);
      const petDetails=calc.pet?petUI.describe(calc.pet.record,calc.pet.level,calc.pet.form,b.petRank):null;
      const searchableSkillText=id=>norm([id,i18n.dictionaries.hu['game.petSkill.'+id],i18n.dictionaries.en['game.petSkill.'+id]].join(' '));
      const skillSlots=Array.from({length:3},(_,i)=>{
        const slot=i+1;
        if(slot>stage.slots)return `<article class="planner-pet-skill-slot is-locked" aria-disabled="true"><span class="planner-pet-slot-lock" aria-hidden="true">${esc(t('planner.pet.locked'))}</span><div><strong>${esc(t('planner.pet.lockedSlot',{slot}))}</strong><p>${esc(t('planner.pet.lockedCopy',{form:petUI.formName(stage.form),slots:stage.slots}))}</p></div></article>`;
        const selected=b.petSkills.find(s=>s.slot===slot);
        const selectedName=selected?skillName(selected.skillId):'';
        const datalistId='pet-skill-options-'+slot;
        const candidates=skillEntries.filter(([id])=>!b.petSkills.some(s=>s.skillId===id&&s.slot!==slot));
        const icon=selected?media.render(media.get('icons','pet_book_'+selected.skillId),{thumbnail:true,className:'pet-rule-icon',alt:selectedName}):'';
        const options=candidates.map(([id])=>{
          const name=skillName(id);
          const optionIcon=media.render(media.get('icons','pet_book_'+id),{thumbnail:true,className:'pet-rule-icon',alt:name});
          return `<button type="button" class="planner-pet-skill-option" data-pet-skill-pick="${slot}" data-pet-skill-id="${esc(id)}" data-pet-skill-search-text="${esc(searchableSkillText(id))}">${optionIcon}<span><strong>${esc(name)}</strong><small>${skillDescription(id,1)}</small></span></button>`;
        }).join('');
        return `<div class="planner-pet-skill-slot">${icon}<label>${esc(t('planner.pet.skillSearch',{slot}))}<input type="search" list="${datalistId}" data-planner-pet-skill-search="${slot}" value="${esc(selectedName)}" placeholder="${esc(t('planner.pet.skillPlaceholder'))}" /></label><datalist id="${datalistId}">${candidates.map(([id])=>`<option value="${esc(skillName(id))}" data-skill-id="${esc(id)}"></option>`).join('')}</datalist><details class="planner-pet-skill-picker"><summary>${esc(t('planner.pet.skillPicker'))}</summary><div class="planner-pet-skill-options" data-pet-skill-options="${slot}">${options||`<p>${esc(t('planner.pet.skillNone'))}</p>`}</div></details>${selected?`<label>${esc(t('planner.pet.skillLevel'))}<select data-planner-pet-skill-level="${slot}">${[1,2,3,4,5].map(level=>`<option value="${level}" ${selected.level===level?'selected':''}>${esc(t('planner.pet.skillLevelOption',{level}))}</option>`).join('')}</select></label><p class="pet-skill-description">${skillDescription(selected.skillId,selected.level)}</p>`:`<p class="pet-skill-description">${esc(t('planner.pet.skillPrompt'))}</p>`}</div>`;
      }).join('');
      const referenceMarkup=observed?`<section class="pet-observed-reference" data-pet-observed-details><h5>${esc(t('planner.pet.observedLabel'))}</h5><p>${esc(t('planner.pet.observedRarity'))} · ${esc(petUI.formName(observedReference.form))}, ${num(observedReference.level)}/${num(observedReference.formCap)}. ${esc(t('planner.pet.observedCaveat'))}</p><ul><li>${esc(t('planner.pet.refXp',{prompt:num(observedReference.promptReferenceXpBonusPct),modal:num(observedReference.atlasModalDisplayedXpBonusPct),verified:num(observedReference.verifiedCalculationXpBonusPct)}))}</li><li>${esc(t('planner.pet.refTrait',{name:t('planner.pet.observedTraitName'),every:num(observedReference.trait.every),percent:num(observedReference.trait.percent)}))}</li><li>${esc(t('planner.pet.refSignature',{name:skillName(observedReference.signature.skillId),percent:num(observedReference.signature.percent)}))}</li><li>${esc(t('planner.pet.refSkills',{skills:observedReference.skills.map(skill=>`${skillName(skill.skillId)} ${t('planner.pet.skillLevelOption',{level:skill.level})}${skill.percent?` · ${num(skill.percent)}%`:''}`).join('; ')}))}</li><li>${esc(t('planner.pet.refMastery',{rank:num(observedReference.mastery.rank),max:num(observedReference.mastery.max)}))} ${esc(t('planner.pet.masteryWarning'))}</li></ul></section>`:'';
      const petPortrait=calc.pet?media.render(media.pet(calc.pet.record.id,b.petForm),{thumbnail:true,alt:petUI.petName(calc.pet.record)+' · '+petUI.formName(b.petForm)}):'';
      const rarity=observed?t('pets.rarity.unique'):calc.pet?.record.rarity?t('pets.rarity.'+calc.pet.record.rarity):t('planner.pet.rarityUnknown');
      const petSummary=calc.pet?`<div class="planner-pet-summary"><h5>${observed?esc(t('planner.pet.observedXp',{value:num(observedReference.promptReferenceXpBonusPct)})):esc(petDetails.sections[0]?.items[0]??t('planner.pet.noSummary'))}</h5><p>${observed?esc(t('planner.pet.formula',{value:num(observedReference.verifiedCalculationXpBonusPct)})):esc(t('planner.pet.model'))}</p>${observed?'':petDetails.sections.map(section=>`<div><strong>${esc(section.title)}</strong><ul>${section.items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul></div>`).join('')}${referenceMarkup}</div>${link('pets','pet',calc.pet.record)}`:`<p>${esc(t('planner.pet.unlock',{level:num(db.petRules.minHeroLevel)}))}</p>`;
      const progressionCopy=t('planner.pet.progression',{max:num(db.petSystem.maxLevel),form:petUI.formName(stage.form),level:num(b.petLevel),cap:num(stage.maxLevel),slots:stage.slots});
      const mastery=observed?t('planner.pet.masteryObserved',{rank:num(observedReference.mastery.rank),max:num(observedReference.mastery.max)}):t('planner.pet.masteryUnknown');
      const rawRank=b.petRankVerified?t('planner.pet.importedRank',{rank:num(b.petRank)}):t('planner.pet.rankUnavailable');
      return `<div class="planner-companions"><section class="planner-panel planner-pet-builder"><h4>${esc(t('planner.pet.title'))}</h4><div class="planner-pet-builder-grid"><section class="planner-pet-area planner-pet-identity"><div class="planner-pet-portrait">${petPortrait||`<span>${esc(t('planner.pet.noneSelected'))}</span>`}</div><strong class="planner-pet-rarity">${esc(rarity)}</strong>${select('planner-pet',t('planner.pet.species'),{'':t('planner.pet.none'),...pets},b.petId??'')}${select('planner-pet-form',t('planner.pet.form'),forms,b.petForm)}${field('planner-pet-level',t('planner.pet.level'),b.petLevel,stage.minLevel,Math.min(stage.maxLevel,b.level))}<p data-planner-pet-progression>${esc(progressionCopy)}</p>${chip(t('planner.pet.caps'),'unknown')}<button type="button" class="atlas-action" data-pet-observed-reference="${esc(observedReference.presetId)}">${esc(t('planner.pet.observedButton',{name:petUI.petName(petRecord??{id:observedReference.petId,name:observedReference.petName})}))}</button><p data-pet-observed-reference-label>${esc(t('planner.pet.observedCaveat'))}<br />${esc(t('planner.pet.masteryWarning'))}</p><p class="pet-mastery-note"><strong>${esc(t('planner.pet.mastery'))}:</strong> ${esc(mastery)}. <strong>${esc(t('planner.pet.rawRank'))}:</strong> ${esc(rawRank)}. ${esc(t('planner.pet.masteryWarning'))}</p>${petRecord?.signature?`<p class="pet-signature"><strong>${esc(t('planner.pet.signature'))}:</strong> ${esc(skillName(petRecord.signature))} · ${esc(t('planner.pet.signatureNote'))}.</p>`:''}</section><section class="planner-pet-area planner-pet-effects"><h5>${esc(t('planner.pet.effects'))}</h5>${petSummary}</section><section class="planner-pet-area planner-pet-skills-area"><h5>${esc(t('planner.pet.learnedSlots',{active:stage.slots}))}</h5><div class="planner-pet-skills">${skillSlots}</div></section></div><a class="atlas-inline-link" href="#atlas/pets">${esc(t('planner.pet.guide'))}</a></section><section class="planner-panel"><h4>${esc(t('planner.mount.title'))}</h4>${select('planner-mount',t('planner.mount.active'),{'':t('planner.mount.none'),...mounts},b.mountId??'')}${calc.mount?`<div class="planner-companion-image">${media.render(media.forRecord('mount',calc.mount.record.id),{thumbnail:true})}</div>${rows([[t('planner.mount.travelMultiplier'),num(calc.mount.travelMult)],[t('planner.mount.reduction'),pct(1-calc.mount.travelMult)]])}<p>${esc(t('planner.mount.noVerifiedCombat'))}</p>${link('mounts','mount',calc.mount.record)}`:`<p>${esc(t('planner.mount.levelRequired'))}</p>`}</section></div>`;
    }
    function buildComparison(){
      if(!planner.comparing)return '';
      const classNames=localizedClasses();
      const a=model.calculate(planner.drafts.A,db),b=model.calculate(planner.drafts.B,db);
      const keys=[...new Set([...Object.keys(a.equipment),...Object.keys(b.equipment)])];
      const observedMastery=build=>model.normalize(build,db).build.petObservedPreset==='mohaagancs-adult-22'?t('planner.compare.masteryObservation',{rank:11,max:15}):t('planner.compare.noVerified');
      const petDetails=calc=>calc.pet?petUI.describe(calc.pet.record,calc.pet.level,calc.pet.form,calc.build.petRank):null;
      const setName=set=>english()?t('sets.familyName',{map:t('sets.mapName.'+set.familyId)}):set.name;
      const setThresholds=calc=>calc.sets.flatMap(s=>s.active.map(x=>setName(s.set)+': '+t('planner.pieces',{count:x.pieces}))).join(', ')||t('planner.compare.noActiveSet');
      return `<section class="planner-panel"><h4>${esc(t('planner.compare.title'))}</h4>${table([t('planner.compare.slot'),t('planner.compare.a'),t('planner.compare.b')],Object.keys(slots).map(slot=>[esc(t('equipment.slot.'+slot)),esc(a.equipped.find(x=>x.slot===slot)?.item.name??t('planner.compare.empty')),esc(b.equipped.find(x=>x.slot===slot)?.item.name??t('planner.compare.empty'))]))}${table([t('planner.compare.equipment'),t('planner.compare.a'),t('planner.compare.b'),t('planner.compare.delta')],keys.map(k=>{const av=a.equipment[k]??0,bv=b.equipment[k]??0,delta=bv-av;return [esc(label(k)),value(k,av),value(k,bv),`<span class="${delta>0?'stat-better':delta<0?'stat-worse':''}">${delta>0?'+':''}${value(k,delta)}</span>`];}))}${table([t('planner.compare.effect'),t('planner.compare.a'),t('planner.compare.b')],[[t('planner.class'),esc(classNames[a.build.classId]),esc(classNames[b.build.classId])],[t('common.level'),a.build.level,b.build.level],[t('navigation.pets'),esc(a.pet?petUI.petName(a.pet.record):t('planner.pet.none')),esc(b.pet?petUI.petName(b.pet.record):t('planner.pet.none'))],[t('planner.pet.form'),a.pet?esc(petUI.formName(a.pet.form)):'—',b.pet?esc(petUI.formName(b.pet.form)):'—'],[t('planner.pet.level'),a.pet?a.pet.level:'—',b.pet?b.pet.level:'—'],[t('planner.compare.rawRank'),a.build.petRank,b.build.petRank],[t('planner.compare.mastery'),observedMastery(a.build),observedMastery(b.build)],[t('planner.compare.learnedSlot'),a.pet?a.pet.slots:'—',b.pet?b.pet.slots:'—'],[t('planner.compare.petBonus'),petDetails(a)?.sections[0]?.items[0]??'—',petDetails(b)?.sections[0]?.items[0]??'—'],[t('planner.compare.mountMultiplier'),a.mount?num(a.mount.travelMult):'—',b.mount?num(b.mount.travelMult):'—'],[t('planner.compare.setThresholds'),esc(setThresholds(a)),esc(setThresholds(b))]])}${notice(t('planner.compare.warning'))}</section>`;
    }
    function plannerPage(){
      const calc=model.calculate(activeBuild(),db),b=calc.build,armor=calc.equipped.find(x=>x.slot==='armor')?.item;
      const character=media.character(b.classId,b.gender,armor,b.look);
      const availableGenders=Object.fromEntries([...new Set(catalog.entries.filter(im=>im.category==='body'&&im.character?.classId===b.classId).map(im=>im.character.gender))].map(g=>[g,t('planner.gender.'+g)]));
      const setOptions=Object.fromEntries(db.sets.map(s=>[s.familyId,english()?t('sets.familyName',{map:t('sets.mapName.'+s.familyId)}):s.name]));
      const buildName=name=>name==='Új karakterbuild'?t('planner.builds.defaultName'):name;
      return heading(t('planner.heading'),t('planner.copy'))+
        `<div class="planner-topbar"><div class="atlas-tabs"><button type="button" data-planner-tab="A" aria-pressed="${planner.active==='A'}">Build A</button><button type="button" data-planner-tab="B" aria-pressed="${planner.active==='B'}">Build B</button></div><button type="button" id="planner-copy" class="atlas-action">${esc(t('planner.copyBuild'))}</button><button type="button" id="planner-compare" class="atlas-action" aria-pressed="${planner.comparing}">${esc(t(planner.comparing?'planner.closeCompare':'planner.compare'))}</button><button type="button" id="planner-new" class="atlas-action">${esc(t('planner.newBuild'))}</button></div>
        <div id="planner-message" class="planner-message" role="status" aria-live="polite">${esc(plannerMessage())}</div><div class="atlas-filters tool-settings">${select('planner-class',t('planner.class'),localizedClasses(),b.classId)}${select('planner-gender',t('planner.gender'),availableGenders,b.gender)}${select('planner-look',t('planner.look'),{1:t('planner.look.original'),2:t('planner.look.second')},b.look)}${field('planner-level',t('planner.level'),b.level,1,db.economy.limits.maxLevel)}</div>
        <div class="planner-layout"><section class="planner-panel planner-equipment"><p class="eyebrow">BUILD ${planner.active}</p><h4>${esc(t('planner.equipmentSlots'))}</h4>${Object.entries(slots).map(([slot])=>{const title=t('equipment.slot.'+slot),equipped=calc.equipped.find(x=>x.slot===slot);return `<div class="planner-slot ${slot===planner.slot?'active':''}"><button type="button" data-planner-slot="${slot}" aria-pressed="${slot===planner.slot}">${equipped?media.render(media.forRecord('item',equipped.item.id),{thumbnail:true}):icon(({weapon:'swords',armor:'shield',helmet:'shield',shield:'shield',boots:'compass',bracelet:'sun',necklace:'spark',earrings:'moon'})[slot])}<span>${esc(title)}<small>${esc(equipped?.item.name??t('planner.notSelected'))}</small></span></button>${equipped?`<label>+<select data-planner-plus="${slot}" aria-label="${esc(title)} ${esc(t('equipment.upgrade'))}">${db.forge.plusMult.map((_,i)=>`<option value="${i}" ${i===equipped.plus?'selected':''}>${i}</option>`).join('')}</select></label><button type="button" class="planner-remove" data-planner-remove="${slot}" aria-label="${esc(t('planner.remove',{slot:title}))}">×</button>`:''}</div>`;}).join('')}</section>
        <section class="planner-character"><div class="planner-character-image">${media.render(character,{eager:true})}</div><h4>${esc(className(b.classId))}</h4><p>${esc(t('common.levelBadge',{level:num(b.level)}))} · ${esc(availableGenders[b.gender]??t('planner.gender.'+b.gender))} · ${esc(character?.character?.appearance??'')}</p><p>${esc(t('planner.characterArt'))}</p><div class="planner-weapon-preview">${calc.equipped.find(x=>x.slot==='weapon')?media.render(media.forRecord('item',calc.equipped.find(x=>x.slot==='weapon').item.id),{thumbnail:true}):''}</div>${character?`<a class="atlas-inline-link" href="${imageLink(character)}">${esc(t('planner.characterImage'))}</a>`:''}</section>
        <section class="planner-panel planner-statistics">${plannerStats(calc)}</section></div>
        <section class="planner-panel planner-picker"><h4>${esc(t('planner.itemPicker',{slot:t('equipment.slot.'+planner.slot)}))}</h4><p>${esc(t('planner.itemPickerCopy'))}</p><label>${esc(t('planner.search'))}<input id="planner-item-query" type="search" value="${esc(planner.query)}" placeholder="${esc(t('planner.searchItemPlaceholder'))}" /></label><p id="planner-picker-status" role="status"></p><div id="planner-item-results"></div></section>
        <section class="planner-panel"><h4>${esc(t('planner.setTitle'))}</h4>${select('planner-family',t('planner.setTitle'),{'':t('planner.setTargetNone'),...setOptions},b.targetFamily??'')}<button type="button" id="planner-apply-set" class="atlas-action">${esc(t('planner.setApply'))}</button>${setSummary(calc)}</section>${companions(calc)}${buildComparison()}
        <section class="planner-panel planner-saving"><h4>${esc(t('planner.builds.title'))}</h4><label>${esc(t('planner.builds.name'))}<input id="planner-name" type="text" maxlength="80" value="${esc(buildName(b.name))}" /></label><div class="atlas-actions"><button type="button" class="atlas-action" id="planner-save">${esc(t('planner.builds.save'))}</button><button type="button" class="atlas-action" id="planner-share-button">${esc(t('planner.builds.share'))}</button></div>${select('planner-saved',t('planner.builds.saved'),{'':t('planner.builds.choose'),...Object.fromEntries(planner.saved.map(r=>[r.id,buildName(r.build.name)]))},planner.savedId)}<div class="atlas-actions"><button type="button" class="atlas-action" id="planner-load" ${planner.savedId?'':'disabled'}>${esc(t('planner.builds.load',{build:planner.active}))}</button><button type="button" class="atlas-action" id="planner-delete" ${planner.savedId?'':'disabled'}>${esc(t('planner.builds.delete'))}</button></div><label ${planner.share?'':'hidden'} id="planner-share-label">${esc(t('planner.builds.shareLabel'))}<input id="planner-share" type="text" readonly value="${esc(planner.share)}" /></label><p>${esc(t('planner.builds.privacy'))}</p></section>`;
    }
    function updatePicker(){
      const b=activeBuild(),tokens=norm(planner.query).split(/\s+/).filter(Boolean);
      const list=db.items.filter(x=>x.slot===planner.slot&&model.canEquip(x,b)&&tokens.every(t=>norm([x.name,x.nameEn,x.id].join(' ')).includes(t))).sort((a,b)=>a.level-b.level);
      const pages=Math.ceil(list.length/12)||1;planner.pickerPage=Math.max(1,Math.min(planner.pickerPage,pages));
      $('#planner-picker-status').textContent=t('planner.availableItems',{count:num(list.length),page:num(planner.pickerPage),pages:num(pages)});
      $('#planner-item-results').innerHTML=`<div class="planner-item-grid">${list.slice((planner.pickerPage-1)*12,planner.pickerPage*12).map(x=>`<article>${media.render(media.forRecord('item',x.id),{thumbnail:true})}<div><h4>${esc(x.name)}</h4><p>${esc(t('common.levelBadge',{level:num(x.level)}))} · T${x.tier}${x.family?' · '+esc(x.family):''}</p>${statRows(Object.fromEntries(Object.entries(x.values).filter(([,v])=>v!==0)))}<button type="button" class="atlas-action" data-planner-equip="${esc(x.id)}">${esc(t('planner.equip'))}</button>${link('equipment','item',x)}</div></article>`).join('')}</div>${list.length?'':notice(t('planner.noItems'))}<div class="atlas-pagination"><button type="button" data-planner-page="-1" ${planner.pickerPage===1?'disabled':''}>${t('common.previous')}</button><span>${num(planner.pickerPage)} / ${num(pages)}</span><button type="button" data-planner-page="1" ${planner.pickerPage===pages?'disabled':''}>${t('common.next')}</button></div>`;
    }
    function persistBuilds(){try{localStorage.setItem(storageKey,JSON.stringify({version:3,builds:planner.saved}));return true;}catch{setMessage('planner.message.storageError');return false;}}
    function plannerAfterRender(){
      updatePicker();
      const bindings=[['planner-class','classId'],['planner-gender','gender'],['planner-look','look'],['planner-level','level'],['planner-pet','petId'],['planner-pet-form','petForm'],['planner-pet-level','petLevel'],['planner-mount','mountId'],['planner-family','targetFamily']];
      for(const [id,key] of bindings)$('#'+id).addEventListener('change',e=>{const b=activeBuild(),previous=b[key];b[key]=e.target.type==='number'||key==='look'||key==='petForm'?Number(e.target.value):e.target.value||null;if(previous!==b[key]&&['level','petId','petForm','petLevel'].includes(key))b.petObservedPreset=null;setDraft(b);planner.pickerPage=1;render();$('#'+id)?.focus({preventScroll:true});});
      $('#planner-item-query').addEventListener('input',e=>{planner.query=e.target.value;planner.pickerPage=1;updatePicker();});
      $('#planner-name').addEventListener('input',e=>{activeBuild().name=e.target.value;planner.share='';});
      $('#planner-saved').addEventListener('change',e=>{planner.savedId=e.target.value;render();$('#planner-saved').focus({preventScroll:true});});
    }
    function afterRender(page){
      syncUI.afterRender(page);
      futureUI.afterRender(page);
      if(page==='bonuses'&&!state.query)bonusSystem.afterRender();
      if(page==='stat-limits'&&!state.query)statLimits.afterRender();
      if(page==='gallery'&&!state.query){
        updateGallery();
        for(const [id,key,event] of [['catalog-query','query','input'],['catalog-category','category','change'],['catalog-status','status','change'],['catalog-sort','sort','change']])$('#'+id).addEventListener(event,e=>{gallery[key]=e.target.value;gallery.page=1;updateGallery();});
      }
      if(page==='compare'&&!state.query){
        updateViewer();
        for(const [id,key,event] of [['viewer-class','classId','change'],['viewer-gender','gender','change'],['viewer-look','look','change'],['viewer-mode','mode','change'],['viewer-level','level','change'],['viewer-family','family','change'],['viewer-tier','tier','change'],['viewer-query','query','input']])$('#'+id).addEventListener(event,e=>{viewer[key]=e.target.value;viewer.page=1;if(['classId','gender','look','mode'].includes(key)){viewer.selected=[];viewer.itemOverrides={};viewer.level='all';viewer.family='all';viewer.tier='all';render();$('#'+id)?.focus({preventScroll:true});}else updateViewer();});
      }
      if(page==='planner'&&!state.query)plannerAfterRender();
      if(page==='home'&&!state.query)$('#atlas-screen').insertAdjacentHTML('beforeend',`<section class="planner-panel"><h4>${esc(t('home.galleryTitle'))}</h4><p>${esc(t('home.galleryCopy',{count:num(catalog.categories.find(x=>x.id==='furniture')?.count??0)}))}</p><div class="atlas-actions"><a class="atlas-action" href="#atlas/gallery?category=furniture">${esc(t('home.galleryFurniture'))}</a><a class="atlas-action" href="#atlas/gallery?category=guild">${esc(t('home.galleryGuild'))}</a></div></section>`);
    }
    document.addEventListener('click',e=>{const b=e.target.closest('[data-gallery-page]');if(b){gallery.page+=Number(b.dataset.galleryPage);updateGallery();$('#catalog-status-line').scrollIntoView({block:'start'});}});
    document.addEventListener('click',e=>{
      const pick=e.target.closest('[data-viewer-pick]');      if(pick){const id=pick.dataset.viewerPick;if(viewer.selected.includes(id)){viewer.selected=viewer.selected.filter(x=>x!==id);delete viewer.itemOverrides[id];}else if(viewer.selected.length<2)viewer.selected.push(id);else{$('#viewer-status').textContent=t('planner.compare.maxTwo');return;}updateViewer();}
      const page=e.target.closest('[data-viewer-page]');if(page){viewer.page+=Number(page.dataset.viewerPage);updateViewer();}
    });
    document.addEventListener('change',e=>{
      if(e.target.matches('[data-planner-plus]')){const slot=e.target.dataset.plannerPlus;const b=activeBuild();if(b.gear[slot]){b.gear[slot].plus=Number(e.target.value);setDraft(b);render();}}
      if(e.target.matches('[data-planner-pet-skill-search]')){
        const slot=Number(e.target.dataset.plannerPetSkillSearch),query=e.target.value.trim(),b=activeBuild();
        const signature=db.pets.find(p=>p.id===b.petId)?.signature;
        const normalizedQuery=norm(query);
        const match=Object.entries(db.petSkills).find(([id])=>id!==signature&&!b.petSkills?.some(s=>s.skillId===id&&s.slot!==slot)&&[id,i18n.dictionaries.hu['game.petSkill.'+id],i18n.dictionaries.en['game.petSkill.'+id]].some(name=>norm(name)===normalizedQuery));
        const skillId=match?.[0]??null;
        const prior=b.petSkills.find(s=>s.slot===slot);
        b.petSkills=b.petSkills.filter(s=>s.slot!==slot);
        if(skillId)b.petSkills.push({slot,skillId,level:prior?.level??1});
        b.petObservedPreset=null;
        setDraft(b);render();
      }
      if(e.target.matches('[data-planner-pet-skill-level]')){
        const slot=Number(e.target.dataset.plannerPetSkillLevel),level=Number(e.target.value),b=activeBuild();
        const selected=b.petSkills.find(s=>s.slot===slot);if(selected){selected.level=level;b.petObservedPreset=null;setDraft(b);render();}
      }
    });
    document.addEventListener('input',e=>{
      if(!e.target.matches('[data-planner-pet-skill-search]'))return;
      const slot=e.target.dataset.plannerPetSkillSearch,query=norm(e.target.value);
      const picker=e.target.closest('.planner-pet-skill-slot')?.querySelector('.planner-pet-skill-picker');
      if(query&&picker)picker.open=true;
      for(const option of picker?.querySelectorAll('[data-pet-skill-pick]')??[])option.hidden=!!query&&!option.dataset.petSkillSearchText.includes(query);
    });
    document.addEventListener('click',e=>{
      if(state.page!=='planner')return;
      const tab=e.target.closest('[data-planner-tab]');if(tab){planner.active=tab.dataset.plannerTab;planner.query='';planner.share='';render();return;}
      const skill=e.target.closest('[data-pet-skill-pick]');
      if(skill){
        const slot=Number(skill.dataset.petSkillPick),skillId=skill.dataset.petSkillId,b=activeBuild();
        const signature=db.pets.find(p=>p.id===b.petId)?.signature;
        if(skillId!==signature&&!b.petSkills.some(item=>item.skillId===skillId&&item.slot!==slot)){
          const previous=b.petSkills.find(item=>item.slot===slot);
          b.petSkills=b.petSkills.filter(item=>item.slot!==slot);
          b.petSkills.push({slot,skillId,level:previous?.skillId===skillId?previous.level:1});
          b.petObservedPreset=null;setDraft(b);render();
        }
        return;
      }
      const slot=e.target.closest('[data-planner-slot]');if(slot){planner.slot=slot.dataset.plannerSlot;planner.query='';planner.pickerPage=1;render();return;}
      const remove=e.target.closest('[data-planner-remove]');if(remove){delete activeBuild().gear[remove.dataset.plannerRemove];render();return;}
      const equip=e.target.closest('[data-planner-equip]');if(equip){const item=db.items.find(x=>x.id===equip.dataset.plannerEquip);if(item&&model.canEquip(item,activeBuild())){activeBuild().gear[item.slot]={id:item.id,plus:0};setDraft(activeBuild());render();}return;}
      const observed=e.target.closest('[data-pet-observed-reference]');
      if(observed){
        const preset=globalThis.StonestormPets.observedReferencePreset(),b=activeBuild();
        b.level=Math.max(b.level,preset.level);
        b.petId=preset.petId;b.petLevel=preset.level;b.petForm=preset.form;b.petRank=0;
        b.petRankVerified=false;b.petObservedPreset=preset.presetId;
        b.petSkills=preset.skills.map((skill,index)=>({slot:index+1,skillId:skill.skillId,level:skill.level}));
        setDraft(b);setMessage('planner.message.observedLoaded');render();return;
      }
      const page=e.target.closest('[data-planner-page]');if(page){planner.pickerPage+=Number(page.dataset.plannerPage);updatePicker();return;}
      if(e.target.closest('#planner-copy')){const other=planner.active==='A'?'B':'A';planner.drafts[other]=model.normalize(activeBuild(),db).build;planner.editing[other]=null;setMessage('planner.message.otherBuild',{build:other});render();}
      if(e.target.closest('#planner-compare')){planner.comparing=!planner.comparing;render();}
      if(e.target.closest('#planner-new')){planner.drafts[planner.active]=model.empty(db);planner.editing[planner.active]=null;setMessage('planner.message.newBuild');planner.share='';render();}
      if(e.target.closest('#planner-apply-set')){
        const b=activeBuild();let count=0;
        for(const item of db.items.filter(x=>x.family===b.targetFamily&&model.canEquip(x,b))){b.gear[item.slot]={id:item.id,plus:0};count++;}
        setDraft(b);setMessage(count?'planner.message.setApplied':'planner.message.setNotApplied',count?{count}:{});render();
      }
      if(e.target.closest('#planner-save')){
        const b=model.normalize(activeBuild(),db).build,id=planner.editing[planner.active]??'build-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),index=planner.saved.findIndex(r=>r.id===id);
        if(index<0&&planner.saved.length>=20){setMessage('planner.message.limit');render();return;}
        const record={id,build:b};if(index>=0)planner.saved[index]=record;else planner.saved.push(record);
        planner.editing[planner.active]=id;planner.savedId=id;if(persistBuilds())setMessage('planner.message.saved');render();
      }
      if(e.target.closest('#planner-load')){const r=planner.saved.find(r=>r.id===planner.savedId);if(r){setDraft(r.build);planner.editing[planner.active]=r.id;setMessage('planner.message.loaded',{build:planner.active});render();}}
      if(e.target.closest('#planner-delete')){planner.saved=planner.saved.filter(r=>r.id!==planner.savedId);for(const side of ['A','B'])if(planner.editing[side]===planner.savedId)planner.editing[side]=null;planner.savedId='';if(persistBuilds())setMessage('planner.message.deleted');render();}
      if(e.target.closest('#planner-share-button')){planner.share=location.href.split('#')[0]+'#atlas/planner?build='+encodeURIComponent(JSON.stringify(model.normalize(activeBuild(),db).build));setMessage('planner.message.shareReady');render();$('#planner-share').focus();$('#planner-share').select();}
    });
    function onRoute(parts,params){
      bonusSystem.onRoute(parts,params);
      if(parts[1]==='gallery'&&params.has('category')&&categoryNames[params.get('category')]){gallery.category=params.get('category');gallery.page=1;}
      if(parts[1]==='compare'&&params.has('item')){const x=db.items.find(x=>x.id===params.get('item'));if(x){viewer.classId=x.classes?.[0]??'warrior';viewer.mode=x.slot==='armor'?'armor':'weapon';viewer.level='all';viewer.family='all';viewer.tier='all';const im=media.forRecord('item',x.id);viewer.selected=im?[im.id]:[];viewer.itemOverrides=im?{[im.id]:x.id}:{};}}
      if(parts[1]==='planner'&&params.has('build')){const parsed=model.parse(params.get('build'),db);planner.drafts[planner.active]=parsed.build;planner.editing[planner.active]=null;setModelErrors(parsed.errors);if(!parsed.errors.length)setMessage('planner.message.legacyLoaded');}
      if(parts[1]==='planner'&&params.has('add')){
        const kind=params.get('kind'),id=params.get('add'),b=activeBuild();
        if(kind==='item'){const x=db.items.find(x=>x.id===id);if(x){if(x.classes?.length&&!x.classes.includes(b.classId))b.classId=x.classes[0];b.level=Math.max(b.level,x.level);b.gear[x.slot]={id:x.id,plus:0};planner.slot=x.slot;}}
        if(kind==='pet'&&db.pets.some(x=>x.id===id)){b.level=Math.max(b.level,db.petRules.minHeroLevel);b.petId=id;}
        if(kind==='mount'){const x=db.mounts.find(x=>x.id===id);if(x){b.level=Math.max(b.level,x.level);b.mountId=x.id;}}
        setDraft(b);setMessage('planner.message.addVerified');
      }
    }
    function home(){return `<div class="feature-links"><a href="#atlas/gallery">${media.render(media.get('uikit','btn_help'),{thumbnail:true})}<span><span data-atlas-i18n="navigation.gallery">Képtár</span><small>${num(catalog.stats.available)} <span data-atlas-i18n="overview.galleryDetail">eredeti grafika</span></small></span></a><a href="#atlas/compare">${media.render(media.get('uikit','btn_character'),{thumbnail:true})}<span><span data-atlas-i18n="navigation.compare">Felszerelés-összehasonlító</span><small data-atlas-i18n="overview.galleryCopy">Két megjelenés egymás mellett</small></span></a><a href="#atlas/planner">${media.render(media.get('uikit','btn_arena'),{thumbnail:true})}<span><span data-atlas-i18n="navigation.planner">Karaktertervező</span><small data-atlas-i18n="overview.plannerCopy">Építs, hasonlíts össze, ments</small></span></a></div>`;}
    return {screens:{arena:homeArena.arena,gallery:galleryPage,compare:comparePage,planner:plannerPage,'stat-limits':statLimits.page,bonuses:bonusSystem.page,updates:syncUI.page,upcoming:futureUI.page},detail:(kind,id)=>kind==='image'?imageDetail(id):null,actions:detailActions,afterRender,onRoute,home,bonusInfo:bonusSystem.itemInfo};
  }
};
