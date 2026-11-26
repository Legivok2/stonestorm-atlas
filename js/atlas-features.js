/* A Képtár, összehasonlító és karaktertervező ugyanannak az Atlasnak a moduljai. */
globalThis.AtlasExtensions={
  categories:[['arena','Aréna',null,'swords'],['gallery','Képtár',null,'book'],['compare','Felszerelés-összehasonlító',null,'swords'],['planner','Karaktertervező',null,'shield'],['stat-limits','📊 Stat limitek',null,'shield'],['bonuses','Bónuszrendszer',null,'spark'],['updates','Atlas frissítések',null,'book'],['upcoming','Közelgő tartalmak',null,'book']],
  init(ui){
    const bonusSystem=globalThis.AtlasBonusUI.init(ui);
    const statLimits=globalThis.AtlasStatLimitsUI.init({...ui,bonusSystem});
    const syncUI=globalThis.AtlasSyncUI.init(ui);
    const futureUI=globalThis.AtlasFutureContentUI.init(ui);
    const homeArena=globalThis.AtlasHomeArenaUI.init(ui);
    const {db,media,esc,norm,num,pct,slots,rarities,classNames,label,value,icon,chip,notice,rows,statRows,table,route,link,heading,state,render}=ui;
    const $=s=>document.querySelector(s);
    const catalog=media.catalog;
    const categoryNames=Object.fromEntries(catalog.categories.map(c=>[c.id,c.name]));
    const statuses={identified:'Azonosított',partial:'Részben azonosított',unknown:'Ismeretlen'};
    const kinds={item:['equipment',db.items],pet:['pets',db.pets],mount:['mounts',db.mounts],mob:['world',db.mobs],map:['world',db.maps],set:['sets',db.sets],dungeon:['world',db.dungeons],class:['classes',db.classes],material:['materials',db.economy.stackables],research:['home',db.research],building:['guild',db.guild.buildings.map(x=>({...x,id:x.kind,name:x.nameHu}))]};
    const entity=r=>kinds[r.kind]?.[1].find(x=>x.id===r.id);
    const wikiLink=r=>{const x=entity(r);return x?link(kinds[r.kind][0],r.kind,x):'';};
    const imageLink=im=>route('gallery','image',im.id);
    const select=(id,title,opts,selected,all=false)=>`<label>${esc(title)}<select id="${id}">${all?'<option value="all">Mindegyik</option>':''}${Object.entries(opts).map(([k,v])=>`<option value="${esc(k)}" ${String(k)===String(selected)?'selected':''}>${esc(v)}</option>`).join('')}</select></label>`;
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
      const levels=Object.fromEntries([...new Set(db.items.filter(x=>(x.classes??[]).includes(viewer.classId)).map(x=>x.level))].sort((a,b)=>a-b).map(l=>[l,l+'. szint']));
      return heading('Felszerelés és karakterkinézet','Nézd meg előre a magas szintű grafikákat, és válassz két képet az összehasonlításhoz. A követelményszint a tárgyadatból származik.')+
        `<div class="atlas-filters tool-settings">${select('viewer-class','Kaszt',classNames,viewer.classId)}${select('viewer-gender','Karakterváltozat',{male:'Férfi',female:'Nő'},viewer.gender)}${select('viewer-look','Grafikai változat',{1:'Eredeti',2:'Második'},viewer.look)}${select('viewer-mode','Nézet',{weapon:'Fegyverek',armor:'Páncélok és szettek',appearance:'Teljes karakterképek'},viewer.mode)}${select('viewer-level','Igazolt követelményszint',levels,viewer.level,true)}${select('viewer-family','Szettcsalád',Object.fromEntries(db.sets.map(s=>[s.familyId,s.name])),viewer.family,true)}${select('viewer-tier','Tárgy tier',Object.fromEntries([0,1,2,3,4,5].map(t=>[t,'T'+t])),viewer.tier,true)}<label>Keresés<input id="viewer-query" type="search" value="${esc(viewer.query)}" placeholder="Tárgy vagy képfájl neve" /></label></div>
        <p class="atlas-notice">A karaktergrafikák teljes képek. A fegyver és a páncél külön jelenik meg; nincs mesterséges ráillesztés. A fájlnév l/t kódja nem követelményszint. A tier nem igazolt ritkasági besorolás.</p><div id="viewer-comparison" aria-live="polite"></div><p id="viewer-status" role="status"></p><div id="viewer-images"></div>`;
    }
    function compareStats(images){
      const items=images.map(selectedRecord);
      const statKeys=[...new Set(items.flatMap(x=>Object.keys(x?.values??{})))];
      return table(['Tulajdonság','A','B','B − A'],[
        ['Igazolt szint',...items.map(x=>x?num(x.level):'Nem ismert'),'—'],
        ...statKeys.map(k=>{const a=items[0]?.values[k],b=items[1]?.values[k],delta=Number.isFinite(a)&&Number.isFinite(b)?b-a:null;return [esc(label(k)),a==null?'Nem ismert':value(k,a),b==null?'Nem ismert':value(k,b),delta==null?'Nem számítható':`<span class="${delta>0?'stat-better':delta<0?'stat-worse':''}">${delta>0?'+':''}${value(k,delta)}</span>`];})
      ]);
    }
    function updateViewer(){
      const list=viewerImages(),pages=Math.ceil(list.length/24)||1;viewer.page=Math.max(1,Math.min(viewer.page,pages));
      $('#viewer-status').textContent=`${num(list.length)} grafika · ${viewer.selected.length} / 2 kiválasztva · ${viewer.page} / ${pages}. oldal`;
      $('#viewer-images').innerHTML=`<div class="catalog-grid viewer-grid">${list.slice((viewer.page-1)*24,viewer.page*24).map(im=>{const x=imageRecord(im);return `<article class="catalog-card ${viewer.selected.includes(im.id)?'selected':''}"><div class="catalog-preview">${media.render(im,{thumbnail:true})}</div><div class="catalog-copy"><h4>${esc(x?.name??im.title??im.name)}</h4><small>${esc(im.filename)}</small><p>${x?x.level+'. szint · T'+x.tier:'Követelményszint: nem ismert'}</p>${chip(statuses[im.status],im.status==='identified'?'verified':'unknown')}<button class="atlas-action" type="button" data-viewer-pick="${im.id}" aria-pressed="${viewer.selected.includes(im.id)}">${viewer.selected.includes(im.id)?'Kiveszem':'Összehasonlítom'}</button><a class="atlas-inline-link" href="${imageLink(im)}">Kép adatlapja ↗</a></div></article>`;}).join('')}</div>${list.length?'':'<div class="atlas-empty">Ezekkel a szűrőkkel nincs elérhető grafika.</div>'}<div class="atlas-pagination"><button type="button" data-viewer-page="-1" ${viewer.page===1?'disabled':''}>← Előző</button><span>${viewer.page} / ${pages}</span><button type="button" data-viewer-page="1" ${viewer.page===pages?'disabled':''}>Következő →</button></div>`;
      const selected=viewer.selected.map(id=>media.entries.get(id)).filter(Boolean);
      $('#viewer-comparison').innerHTML=selected.length?`<div class="viewer-panels">${selected.map((im,i)=>{const x=selectedRecord(im);return `<article><p class="eyebrow">${i?'B':'A'} ÖSSZEÁLLÍTÁS</p><div class="viewer-large-image">${media.render(im,{eager:true})}</div><h4>${esc(x?.name??im.title??im.name)}</h4><p>${esc(im.filename)}${x?' · '+x.level+'. követelményszint':''}</p>${x?statRows(x.values)+link('equipment','item',x):notice('A képből nem vezetünk le harci statisztikát.')}<button type="button" class="atlas-action" data-viewer-pick="${im.id}">Eltávolítás</button></article>`;}).join('')}</div>${selected.length===2?compareStats(selected):notice('Válassz még egy grafikát az összehasonlításhoz.')}`:notice('Válassz két fegyvert, páncélt vagy teljes karaktergrafikát a lenti kártyákon.');
    }
    function detailActions(kind,x){
      if(['item','pet','mount'].includes(kind))return `<div class="atlas-actions">${kind==='item'?`<a class="atlas-action" href="#atlas/compare?item=${encodeURIComponent(x.id)}">Összehasonlítás</a>`:''}<a class="atlas-action" href="#atlas/planner?kind=${kind}&add=${encodeURIComponent(x.id)}">Hozzáadás a tervezőhöz</a></div>`;
      return '';
    }
    const model=globalThis.StonestormPlanner;
    const storageKey='stonestorm-atlas-builds-v1';
    const planner={active:'A',drafts:{A:model.empty(db),B:model.empty(db)},editing:{A:null,B:null},saved:[],savedId:'',slot:'weapon',query:'',pickerPage:1,comparing:false,message:'',share:''};
    try{
      const stored=JSON.parse(localStorage.getItem(storageKey));
      if([1,2,3].includes(stored?.version)&&Array.isArray(stored.builds))planner.saved=stored.builds.slice(0,20).filter(r=>typeof r.id==='string'&&r.id.length<=100&&[1,2,3,undefined].includes(r.build?.version)).map(r=>({id:r.id,build:model.normalize(r.build,db).build}));
    }catch{planner.message='A korábbi buildmentés nem olvasható. A tervező memóriában és megosztási hivatkozással használható.';}
    const activeBuild=()=>planner.drafts[planner.active];
    function setDraft(input){const result=model.normalize(input,db);planner.drafts[planner.active]=result.build;planner.message=result.errors.join(' ');planner.share='';return result.build;}
    function traitSummary(pet){return pet.details.sections[1].items.join(' · ');}
    function plannerStats(calc){
      const nonzero=Object.fromEntries(Object.entries(calc.equipment).filter(([,v])=>v!==0));
      return `<h4>Biztosan ismert komponensek</h4><p class="planner-stat-label">Kaszt alaptulajdonságai</p>${statRows(calc.baseStats)}<p class="planner-stat-label">Felszerelésértékek számtani összege · +fejlesztéssel</p>${Object.keys(nonzero).length?statRows(nonzero):'<p>Még nincs felszerelés kiválasztva.</p>'}${chip('NEM VÉGSŐ KARAKTERSTAT','unknown')}<p>A szerveroldali harcerő, végső HP, sebzés és százalékos hatások együttes számítása nem igazolt. A szintből kapott statpontok elosztását nem találjuk ki.</p><details><summary>Mit és hogyan számolunk?</summary><p>A felszerelések +értékeit a mentett kliens Kn/Kv képlete adja, a forrás plusMult sorával és kerekítési/lépésköz-szabályával. Az egymástól különálló nyers statmezőket összegezzük. A szett és kísérő százalékos hatásait külön listázzuk.</p></details>`;
    }
    function setSummary(calc){
      return `<div class="planner-bonus-panel"><h4>Szettcélok és aktív bónuszok</h4>${calc.sets.length?calc.sets.map(s=>`<article><h4>${esc(s.set.name)}</h4>${chip(s.count+' / '+s.set.slots.length+' ismert, felszerelt darab')}<ul>${s.set.bonuses.map(b=>`<li class="${s.count>=b.pieces?'stat-better':''}">${s.count>=b.pieces?'Aktív':'Még nem aktív'} · ${b.pieces} db: ${b.stats.map(v=>esc(label(v.stat))+' +'+value(v.stat,v.value)).join(' · ')}</li>`).join('')}</ul><p>Hiányzik: ${s.missingSlots.map(s=>slots[s]).join(', ')||'nincs'}.</p><p>A kapott adatbázis csak a család fegyverét és páncélját adja tárgysablonként. A 4/6 darabos célhoz hiányzó sablonokat nem pótoljuk kitalált statokkal.</p>${link('sets','set',s.set)}</article>`).join(''):'<p>Válassz szettcélt, vagy szerelj fel family mezővel igazolt szetttárgyat.</p>'}</div>`;
    }
    function companions(calc){
      const b=calc.build;
      const pets=Object.fromEntries(db.pets.filter(p=>b.level>=db.petRules.minHeroLevel).map(p=>[p.id,p.name]));
      const mounts=Object.fromEntries(db.mounts.filter(m=>m.level<=b.level&&!m.ramp).map(m=>[m.id,m.name]));
      const stage=db.petSystem.stages[b.petForm-1];
      const forms=Object.fromEntries(db.petSystem.stages.map(s=>[s.form,s.form+'. '+s.name+' · plafon '+s.maxLevel+(s.minLevel>b.level?' · hős '+s.minLevel+' szükséges':'' )]));
      const petRecord=calc.pet?.record,signature=petRecord?.signature;
      const observedReference=globalThis.StonestormPets.observedReferencePreset();
      const observed=b.petObservedPreset===observedReference.presetId&&b.petId===observedReference.petId&&b.petLevel===observedReference.level&&b.petForm===observedReference.form;
      const skillEntries=Object.entries(db.petSkills).filter(([id])=>id!==signature);
      const skillDescription=(id,level)=>esc(globalThis.StonestormPets.skillDescription(id,level,db.petSystem,num));
      const skillSlots=Array.from({length:3},(_,i)=>{
        const slot=i+1;
        if(slot>stage.slots)return `<article class="planner-pet-skill-slot is-locked" aria-disabled="true"><span class="planner-pet-slot-lock" aria-hidden="true">ZÁR</span><div><strong>${slot}. képességhely · lezárva</strong><p>A ${esc(stage.name)} formában ${stage.slots} tanulható hely érhető el.</p></div></article>`;
        const selected=b.petSkills.find(s=>s.slot===slot);
        const selectedName=selected?db.petSkillNames[selected.skillId]?.name??selected.skillId:'';
        const datalistId='pet-skill-options-'+slot;
        const candidates=skillEntries.filter(([id])=>!b.petSkills.some(s=>s.skillId===id&&s.slot!==slot));
        const icon=selected?media.render(media.get('icons','pet_book_'+selected.skillId),{thumbnail:true,className:'pet-rule-icon',alt:selectedName}):'';
        const options=candidates.map(([id])=>{
          const name=db.petSkillNames[id]?.name??id;
          const optionIcon=media.render(media.get('icons','pet_book_'+id),{thumbnail:true,className:'pet-rule-icon',alt:name});
          return `<button type="button" class="planner-pet-skill-option" data-pet-skill-pick="${slot}" data-pet-skill-id="${esc(id)}">${optionIcon}<span><strong>${esc(name)}</strong><small>${skillDescription(id,1)}</small></span></button>`;
        }).join('');
        return `<div class="planner-pet-skill-slot">${icon}<label>${slot}. aktív képességhely<input type="search" list="${datalistId}" data-planner-pet-skill-search="${slot}" value="${esc(selectedName)}" placeholder="Keresés név vagy azonosító szerint" /></label><datalist id="${datalistId}">${candidates.map(([id])=>`<option value="${esc(db.petSkillNames[id]?.name??id)}" data-skill-id="${esc(id)}"></option>`).join('')}</datalist><details class="planner-pet-skill-picker"><summary>Képességválasztó · ikonokkal és leírással</summary><div class="planner-pet-skill-options" data-pet-skill-options="${slot}">${options||'<p>Nincs választható, duplikációmentes képesség.</p>'}</div></details>${selected?`<label>Képességszint<select data-planner-pet-skill-level="${slot}">${[1,2,3,4,5].map(level=>`<option value="${level}" ${selected.level===level?'selected':''}>${level}. szint</option>`).join('')}</select></label><p class="pet-skill-description">${skillDescription(selected.skillId,selected.level)}</p>`:'<p class="pet-skill-description">Válassz képességet a keresőből vagy a részletes listából. A veleszületett képesség nem választható tanult helyre.</p>'}</div>`;
      }).join('');
      const referenceMarkup=observed?`<section class="pet-observed-reference" data-pet-observed-details><h5>Mohaagancs · megadott játékmegfigyelés</h5><p>Mitikus · ${observedReference.formName}, ${observedReference.level}/${observedReference.formCap}. Ezek az értékek a feladatban megadott megfigyelést rögzítik, nem élő kliensből felfedezett állapotot.</p><ul><li>Faji XP-bónusz: +${num(observedReference.promptReferenceXpBonusPct)}% (megfigyelt promptérték); a megfigyelt Atlas-modal érték +${num(observedReference.atlasModalDisplayedXpBonusPct)}%. A V3 modell 0 nyers API-ranggal külön +${num(observedReference.verifiedCalculationXpBonusPct)}%-ot számol; a három értéket nem vonjuk össze.</li><li>Faji harci adottság: ${esc(observedReference.trait.name)}, minden ${observedReference.trait.every}. ütés után ${num(observedReference.trait.percent)}%.</li><li>Veleszületett képesség: ${esc(observedReference.signature.name)}, ${num(observedReference.signature.percent)}%.</li><li>Tanult képességek: ${observedReference.skills.map(skill=>`${esc(skill.name)} ${skill.level}. szint${skill.percent?` · ${num(skill.percent)}%`:''}`).join('; ')}.</li><li>Mesterfok: ${observedReference.mastery.rank}/${observedReference.mastery.max} (megfigyelt). A nyers API-ranghoz való megfeleltetés és bónuszhatás nem igazolt, ezért nincs a számításba bevonva.</li></ul></section>`:'';
      const petPortrait=calc.pet?media.render(media.pet(calc.pet.record.id,b.petForm),{thumbnail:true,alt:calc.pet.record.name}):'';
      const rarity=observed?observedReference.rarity:calc.pet?.record.rarity??'Ritkaság nincs igazolva';
      const petSummary=calc.pet?`<div class="planner-pet-summary"><h5>${observed?'Megfigyelt XP-bónusz: +'+num(observedReference.promptReferenceXpBonusPct)+'%':esc(calc.pet.details.sections[0]?.items?.[0]??'Faji passzív bónusz: nincs igazolt adat')}</h5><p>${observed?'V3-kliensképlet, 0 nyers API-ranggal: +'+num(observedReference.verifiedCalculationXpBonusPct)+'% (külön számított érték).':'V3-kliensmodell · választott forma és nyers API-rang. Nem végső karakterösszeg.'}</p>${observed?'':calc.pet.details.sections.map(section=>`<div><strong>${esc(section.title)}</strong><ul>${section.items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul></div>`).join('')}${referenceMarkup}</div>${link('pets','pet',calc.pet.record)}`:`<p>A kísérők a ${db.petRules.minHeroLevel}. hősszinttől választhatók.</p>`;
      return `<div class="planner-companions"><section class="planner-panel planner-pet-builder"><h4>Pet Builder V2 · Kísérő</h4><div class="planner-pet-builder-grid"><section class="planner-pet-area planner-pet-identity"><div class="planner-pet-portrait">${petPortrait||'<span>Nincs kiválasztott kísérő</span>'}</div><strong class="planner-pet-rarity">${esc(rarity)}</strong>${select('planner-pet','Kísérőfaj',{'': 'Nincs kiválasztva',...pets},b.petId??'')}${select('planner-pet-form','Fejlődési forma',forms,b.petForm)}${field('planner-pet-level','Kísérőszint · forma- és hősszintkorláttal',b.petLevel,stage.minLevel,Math.min(stage.maxLevel,b.level))}<p data-planner-pet-progression>Végső szintmaximum: ${db.petSystem.maxLevel}. ${esc(stage.name)} forma · ${b.petLevel}/${stage.maxLevel}. szint · ${stage.slots} tanulható képességhely.</p>${chip('Kliensformaplafonok: 10 / 20 / 35 / 50 / 60 · régi megfigyelés külön kezelve','unknown')}<button type="button" class="atlas-action" data-pet-observed-reference="${esc(observedReference.presetId)}">${esc(observedReference.label)} betöltése</button><p data-pet-observed-reference-label>${esc(observedReference.caveat)}<br />A Mesterfok és a nyers API-rang külön adat; megfeleltetésük ismeretlen.</p><p class="pet-mastery-note"><strong>Mesterfok:</strong> ${observed?`${observedReference.mastery.rank}/${observedReference.mastery.max} · csak a megadott Mohaagancs-megfigyelésből`:'nincs igazolt érték ennél az összeállításnál'}. <strong>Nyers API-rang:</strong> ${b.petRankVerified?`${b.petRank} · importált adat, képlet szerint`:'nem állítható itt, nincs igazolt adat'}. Nem azonosítjuk a két mezőt.</p>${petRecord?.signature?`<p class="pet-signature"><strong>Veleszületett képesség:</strong> ${esc(db.petSkillNames[petRecord.signature]?.name??petRecord.signature)} · külön kezelve, a tanult helyekről kizárva.</p>`:''}</section><section class="planner-pet-area planner-pet-effects"><h5>Faji bónuszok, adottság és képességek</h5>${petSummary}</section><section class="planner-pet-area planner-pet-skills-area"><h5>Tanulható képességek · ${stage.slots}/3 aktív hely</h5><div class="planner-pet-skills">${skillSlots}</div></section></div><a class="atlas-inline-link" href="#atlas/pets">Formák, etetés, XP és képességkönyvek →</a></section><section class="planner-panel"><h4>Hátas</h4>${select('planner-mount','Aktív hátas',{'':'Nincs kiválasztva',...mounts},b.mountId??'')}${calc.mount?`<div class="planner-companion-image">${media.render(media.forRecord('mount',calc.mount.record.id),{thumbnail:true})}</div>${rows([['Utazási időszorzó',num(calc.mount.travelMult)],['Időcsökkenés',pct(1-calc.mount.travelMult)]])}<p>Nincs igazolt támadás-, HP- vagy energiabónusz; ilyen hatást nem számolunk hozzá.</p>${link('mounts','mount',calc.mount.record)}`:'<p>A listában a kiválasztott szinten használható hátasok jelennek meg.</p>'}</section></div>`;
    }
    function buildComparison(){
      if(!planner.comparing)return '';
      const a=model.calculate(planner.drafts.A,db),b=model.calculate(planner.drafts.B,db);
      const keys=[...new Set([...Object.keys(a.equipment),...Object.keys(b.equipment)])];
      const observedMastery=build=>model.normalize(build,db).build.petObservedPreset==='mohaagancs-adult-22'?'11/15 · megadott megfigyelés':'Nincs igazolt adat';
      return `<section class="planner-panel"><h4>Build A és B összehasonlítása</h4>${table(['Felszerelési hely','A','B'],Object.keys(slots).map(slot=>[slots[slot],esc(a.equipped.find(x=>x.slot===slot)?.item.name??'Üres'),esc(b.equipped.find(x=>x.slot===slot)?.item.name??'Üres')]))}${table(['Nyers felszereléskomponens','A','B','B − A'],keys.map(k=>{const av=a.equipment[k]??0,bv=b.equipment[k]??0,delta=bv-av;return [esc(label(k)),value(k,av),value(k,bv),`<span class="${delta>0?'stat-better':delta<0?'stat-worse':''}">${delta>0?'+':''}${value(k,delta)}</span>`];}))}${table(['Külön kezelt hatás','A','B'],[['Kaszt',esc(classNames[a.build.classId]),esc(classNames[b.build.classId])],['Szint',a.build.level,b.build.level],['Kísérő',esc(a.pet?.record.name??'Nincs'),esc(b.pet?.record.name??'Nincs')],['Kísérőforma',a.pet?esc(a.pet.details.formName):'—',b.pet?esc(b.pet.details.formName):'—'],['Kísérőszint',a.pet?a.pet.level:'—',b.pet?b.pet.level:'—'],['Nyers API-rang · nem Mesterfok',a.build.petRank,b.build.petRank],['Mesterfok',observedMastery(a.build),observedMastery(b.build)],['Tanulható hely',a.pet?a.pet.slots:'—',b.pet?b.pet.slots:'—'],['Kísérő-fajbónusz · V3',a.pet?esc(a.pet.details.sections[0].items[0]):'—',b.pet?esc(b.pet.details.sections[0].items[0]):'—'],['Hátas időszorzó',a.mount?num(a.mount.travelMult):'—',b.mount?num(b.mount.travelMult):'—'],['Aktív szettküszöbök',esc(a.sets.flatMap(s=>s.active.map(x=>s.set.familyId+': '+x.pieces+' db')).join(', ')||'Nincs'),esc(b.sets.flatMap(s=>s.active.map(x=>s.set.familyId+': '+x.pieces+' db')).join(', ')||'Nincs')]])}${notice('A zöld/piros a felszereléskomponens növekedését/csökkenését jelzi, nem bizonyítja, hogy az egész build jobb vagy rosszabb a harcban.')}</section>`;
    }
    function plannerPage(){
      const calc=model.calculate(activeBuild(),db),b=calc.build,armor=calc.equipped.find(x=>x.slot==='armor')?.item;
      const character=media.character(b.classId,b.gender,armor,b.look);
      const availableGenders=Object.fromEntries([...new Set(catalog.entries.filter(im=>im.category==='body'&&im.character?.classId===b.classId).map(im=>im.character.gender))].map(g=>[g,g==='male'?'Férfi':'Nő']));
      return heading('Tervezd meg a következő legendád','Pet Builder V2: öt kliensforma, képességhelyek, 1–5. képességszintek, helyi buildmentés és megosztás. A Mohaagancs 22-es állapota külön megadott megfigyelés, nem fejlődési küszöb.')+
        `<div class="planner-topbar"><div class="atlas-tabs"><button type="button" data-planner-tab="A" aria-pressed="${planner.active==='A'}">Build A</button><button type="button" data-planner-tab="B" aria-pressed="${planner.active==='B'}">Build B</button></div><button type="button" id="planner-copy" class="atlas-action">Másolat a másik buildbe</button><button type="button" id="planner-compare" class="atlas-action" aria-pressed="${planner.comparing}">${planner.comparing?'Összehasonlítás bezárása':'A / B összehasonlítás'}</button><button type="button" id="planner-new" class="atlas-action">Új build</button></div>
        <div id="planner-message" class="planner-message" role="status" aria-live="polite">${esc(planner.message)}</div><div class="atlas-filters tool-settings">${select('planner-class','Kaszt',classNames,b.classId)}${select('planner-gender','Karakterváltozat',availableGenders,b.gender)}${select('planner-look','Grafikai változat',{1:'Eredeti',2:'Második'},b.look)}${field('planner-level','Célszint',b.level,1,db.economy.limits.maxLevel)}</div>
        <div class="planner-layout"><section class="planner-panel planner-equipment"><p class="eyebrow">BUILD ${planner.active}</p><h4>Felszerelési helyek</h4>${Object.entries(slots).map(([slot,title])=>{const equipped=calc.equipped.find(x=>x.slot===slot);return `<div class="planner-slot ${slot===planner.slot?'active':''}"><button type="button" data-planner-slot="${slot}" aria-pressed="${slot===planner.slot}">${equipped?media.render(media.forRecord('item',equipped.item.id),{thumbnail:true}):icon(({weapon:'swords',armor:'shield',helmet:'shield',shield:'shield',boots:'compass',bracelet:'sun',necklace:'spark',earrings:'moon'})[slot])}<span>${esc(title)}<small>${esc(equipped?.item.name??'Nincs kiválasztva')}</small></span></button>${equipped?`<label>+<select data-planner-plus="${slot}" aria-label="${esc(title)} fejlesztése">${db.forge.plusMult.map((_,i)=>`<option value="${i}" ${i===equipped.plus?'selected':''}>${i}</option>`).join('')}</select></label><button type="button" class="planner-remove" data-planner-remove="${slot}" aria-label="${esc(title)} eltávolítása">×</button>`:''}</div>`;}).join('')}</section>
        <section class="planner-character"><div class="planner-character-image">${media.render(character,{eager:true})}</div><h4>${esc(classNames[b.classId])}</h4><p>${b.level}. szint · ${b.gender==='male'?'Férfi':'Nő'} · ${esc(character?.character?.appearance??'Nincs grafika')}</p><p>A páncélhoz tartozó teljes karaktergrafika. A kiválasztott fegyver külön képként látható, nem illesztjük rá a karakterre.</p><div class="planner-weapon-preview">${calc.equipped.find(x=>x.slot==='weapon')?media.render(media.forRecord('item',calc.equipped.find(x=>x.slot==='weapon').item.id),{thumbnail:true}):''}</div>${character?`<a class="atlas-inline-link" href="${imageLink(character)}">Karaktergrafika adatlapja ↗</a>`:''}</section>
        <section class="planner-panel planner-statistics">${plannerStats(calc)}</section></div>
        <section class="planner-panel planner-picker"><h4>Tárgyválasztó · ${esc(slots[planner.slot])}</h4><p>Csak a kasztod és a célszinted által használható tárgyak választhatók.</p><label>Keresés<input id="planner-item-query" type="search" value="${esc(planner.query)}" placeholder="Magyar tárgynév vagy azonosító" /></label><p id="planner-picker-status" role="status"></p><div id="planner-item-results"></div></section>
        <section class="planner-panel"><h4>Szettcsalád tervezése</h4>${select('planner-family','Kiválasztott szettcél',{'':'Nincs cél',...Object.fromEntries(db.sets.map(s=>[s.familyId,s.name]))},b.targetFamily??'')}<button type="button" id="planner-apply-set" class="atlas-action">A használható, ismert szettdarabok felszerelése</button>${setSummary(calc)}</section>${companions(calc)}${buildComparison()}
        <section class="planner-panel planner-saving"><h4>Buildjeid, a böngésződben</h4><label>Build neve<input id="planner-name" type="text" maxlength="80" value="${esc(b.name)}" /></label><div class="atlas-actions"><button type="button" class="atlas-action" id="planner-save">Build mentése</button><button type="button" class="atlas-action" id="planner-share-button">Megosztható hivatkozás</button></div>${select('planner-saved','Mentett build',{'':'Válassz mentést',...Object.fromEntries(planner.saved.map(r=>[r.id,r.build.name]))},planner.savedId)}<div class="atlas-actions"><button type="button" class="atlas-action" id="planner-load" ${planner.savedId?'':'disabled'}>Betöltés a ${planner.active} buildbe</button><button type="button" class="atlas-action" id="planner-delete" ${planner.savedId?'':'disabled'}>Kijelölt mentés törlése</button></div><label ${planner.share?'':'hidden'} id="planner-share-label">Megosztható buildhivatkozás<input id="planner-share" type="text" readonly value="${esc(planner.share)}" /></label><p>Legfeljebb 20 build helyben, a ${storageKey} kulcs alatt. Nincs játékfiók vagy adatküldés. A hivatkozás a konfigurációt az URL # részében tárolja.</p></section>`;
    }
    function updatePicker(){
      const b=activeBuild(),tokens=norm(planner.query).split(/\s+/).filter(Boolean);
      const list=db.items.filter(x=>x.slot===planner.slot&&model.canEquip(x,b)&&tokens.every(t=>norm(x.name+' '+x.id).includes(t))).sort((a,b)=>a.level-b.level);
      const pages=Math.ceil(list.length/12)||1;planner.pickerPage=Math.max(1,Math.min(planner.pickerPage,pages));
      $('#planner-picker-status').textContent=`${list.length} használható tárgy · ${planner.pickerPage} / ${pages}. oldal`;
      $('#planner-item-results').innerHTML=`<div class="planner-item-grid">${list.slice((planner.pickerPage-1)*12,planner.pickerPage*12).map(x=>`<article>${media.render(media.forRecord('item',x.id),{thumbnail:true})}<div><h4>${esc(x.name)}</h4><p>${x.level}. szint · T${x.tier}${x.family?' · '+esc(x.family):''}</p>${statRows(Object.fromEntries(Object.entries(x.values).filter(([,v])=>v!==0)))}<button type="button" class="atlas-action" data-planner-equip="${x.id}">Felszerelem</button>${link('equipment','item',x)}</div></article>`).join('')}</div>${list.length?'':notice('Ezen a szinten nincs használható tárgy ebben a kategóriában.')}<div class="atlas-pagination"><button type="button" data-planner-page="-1" ${planner.pickerPage===1?'disabled':''}>← Előző</button><span>${planner.pickerPage} / ${pages}</span><button type="button" data-planner-page="1" ${planner.pickerPage===pages?'disabled':''}>Következő →</button></div>`;
    }
    function persistBuilds(){try{localStorage.setItem(storageKey,JSON.stringify({version:3,builds:planner.saved}));return true;}catch{planner.message='A böngésző tárhelye nem írható. A build most csak memóriában él; használd a megosztható hivatkozást.';return false;}}
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
      if(page==='home'&&!state.query)$('#atlas-screen').insertAdjacentHTML('beforeend',`<section class="planner-panel"><h4>Otthon és bútorok képtára</h4><p>A képkatalógus ${catalog.categories.find(x=>x.id==='furniture')?.count??0} bútorgrafikát és home_t1–home_t8 épületváltozatokat is tartalmaz. A képek megléte nem bizonyít fejlesztési költséget vagy XP-bónuszt.</p><div class="atlas-actions"><a class="atlas-action" href="#atlas/gallery?category=furniture">Bútorgrafikák</a><a class="atlas-action" href="#atlas/gallery?category=guild">Céhes és otthongrafikák</a></div></section>`);
    }
    document.addEventListener('click',e=>{const b=e.target.closest('[data-gallery-page]');if(b){gallery.page+=Number(b.dataset.galleryPage);updateGallery();$('#catalog-status-line').scrollIntoView({block:'start'});}});
    document.addEventListener('click',e=>{
      const pick=e.target.closest('[data-viewer-pick]');if(pick){const id=pick.dataset.viewerPick;if(viewer.selected.includes(id)){viewer.selected=viewer.selected.filter(x=>x!==id);delete viewer.itemOverrides[id];}else if(viewer.selected.length<2)viewer.selected.push(id);else{$('#viewer-status').textContent='Egyszerre két grafika hasonlítható össze. Előbb vedd ki az egyik kijelölt képet.';return;}updateViewer();}
      const page=e.target.closest('[data-viewer-page]');if(page){viewer.page+=Number(page.dataset.viewerPage);updateViewer();}
    });
    document.addEventListener('change',e=>{
      if(e.target.matches('[data-planner-plus]')){const slot=e.target.dataset.plannerPlus;const b=activeBuild();if(b.gear[slot]){b.gear[slot].plus=Number(e.target.value);setDraft(b);render();}}
      if(e.target.matches('[data-planner-pet-skill-search]')){
        const slot=Number(e.target.dataset.plannerPetSkillSearch),query=e.target.value.trim(),b=activeBuild();
        const signature=db.pets.find(p=>p.id===b.petId)?.signature;
        const match=Object.entries(db.petSkills).find(([id])=>id!==signature&&!b.petSkills?.some(s=>s.skillId===id&&s.slot!==slot)&&((db.petSkillNames[id]?.name===query)||id===query));
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
      for(const option of picker?.querySelectorAll('[data-pet-skill-pick]')??[])option.hidden=!!query&&!norm(option.textContent).includes(query);
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
        setDraft(b);planner.message=preset.label+' betöltve megfigyelt referenciaként; a megfigyelt Mesterfok külön adat, a nyers ranghatás kizárva.';render();return;
      }
      const page=e.target.closest('[data-planner-page]');if(page){planner.pickerPage+=Number(page.dataset.plannerPage);updatePicker();return;}
      if(e.target.closest('#planner-copy')){const other=planner.active==='A'?'B':'A';planner.drafts[other]=model.normalize(activeBuild(),db).build;planner.editing[other]=null;planner.message='Az összeállítás másolata a '+other+' buildbe került.';render();}
      if(e.target.closest('#planner-compare')){planner.comparing=!planner.comparing;render();}
      if(e.target.closest('#planner-new')){planner.drafts[planner.active]=model.empty(db);planner.editing[planner.active]=null;planner.message='Új, üres build készült.';planner.share='';render();}
      if(e.target.closest('#planner-apply-set')){
        const b=activeBuild();let count=0;
        for(const item of db.items.filter(x=>x.family===b.targetFamily&&model.canEquip(x,b))){b.gear[item.slot]={id:item.id,plus:0};count++;}
        setDraft(b);planner.message=count?count+' ismert, használható szettdarab felszerelve.':'Nincs választott szettcél, vagy a szintkövetelmény még nem teljesül.';render();
      }
      if(e.target.closest('#planner-save')){
        const b=model.normalize(activeBuild(),db).build,id=planner.editing[planner.active]??'build-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),index=planner.saved.findIndex(r=>r.id===id);
        if(index<0&&planner.saved.length>=20){planner.message='A 20 helyi buildhely megtelt. Törölj egy korábbi mentést, vagy szerkessz meglévőt.';render();return;}
        const record={id,build:b};if(index>=0)planner.saved[index]=record;else planner.saved.push(record);
        planner.editing[planner.active]=id;planner.savedId=id;if(persistBuilds())planner.message='A build elmentve ebben a böngészőben.';render();
      }
      if(e.target.closest('#planner-load')){const r=planner.saved.find(r=>r.id===planner.savedId);if(r){setDraft(r.build);planner.editing[planner.active]=r.id;planner.message='Mentett build betöltve a '+planner.active+' összeállításba.';render();}}
      if(e.target.closest('#planner-delete')){planner.saved=planner.saved.filter(r=>r.id!==planner.savedId);for(const side of ['A','B'])if(planner.editing[side]===planner.savedId)planner.editing[side]=null;planner.savedId='';if(persistBuilds())planner.message='A kijelölt helyi mentés törölve.';render();}
      if(e.target.closest('#planner-share-button')){planner.share=location.href.split('#')[0]+'#atlas/planner?build='+encodeURIComponent(JSON.stringify(model.normalize(activeBuild(),db).build));planner.message='A hivatkozás elkészült. Másold ki a mezőből.';render();$('#planner-share').focus();$('#planner-share').select();}
    });
    function onRoute(parts,params){
      bonusSystem.onRoute(parts,params);
      if(parts[1]==='gallery'&&params.has('category')&&categoryNames[params.get('category')]){gallery.category=params.get('category');gallery.page=1;}
      if(parts[1]==='compare'&&params.has('item')){const x=db.items.find(x=>x.id===params.get('item'));if(x){viewer.classId=x.classes?.[0]??'warrior';viewer.mode=x.slot==='armor'?'armor':'weapon';viewer.level='all';viewer.family='all';viewer.tier='all';const im=media.forRecord('item',x.id);viewer.selected=im?[im.id]:[];viewer.itemOverrides=im?{[im.id]:x.id}:{};}}
      if(parts[1]==='planner'&&params.has('build')){const parsed=model.parse(params.get('build'),db);planner.drafts[planner.active]=parsed.build;planner.editing[planner.active]=null;planner.message=parsed.errors.join(' ')||'Megosztott build betöltve; nincs automatikusan elmentve.';}
      if(parts[1]==='planner'&&params.has('add')){
        const kind=params.get('kind'),id=params.get('add'),b=activeBuild();
        if(kind==='item'){const x=db.items.find(x=>x.id===id);if(x){if(x.classes?.length&&!x.classes.includes(b.classId))b.classId=x.classes[0];b.level=Math.max(b.level,x.level);b.gear[x.slot]={id:x.id,plus:0};planner.slot=x.slot;}}
        if(kind==='pet'&&db.pets.some(x=>x.id===id)){b.level=Math.max(b.level,db.petRules.minHeroLevel);b.petId=id;}
        if(kind==='mount'){const x=db.mounts.find(x=>x.id===id);if(x){b.level=Math.max(b.level,x.level);b.mountId=x.id;}}
        setDraft(b);planner.message='A kiválasztás követelményeihez igazított kaszt/szint ellenőrizve. '+planner.message;
      }
    }
    function home(){return `<div class="feature-links"><a href="#atlas/gallery">${media.render(media.get('uikit','btn_help'),{thumbnail:true})}<span>Képtár<small>${num(catalog.stats.available)} eredeti grafika</small></span></a><a href="#atlas/compare">${media.render(media.get('uikit','btn_character'),{thumbnail:true})}<span>Felszerelés-összehasonlító<small>Két megjelenés egymás mellett</small></span></a><a href="#atlas/planner">${media.render(media.get('uikit','btn_arena'),{thumbnail:true})}<span>Karaktertervező<small>Építs, hasonlíts össze, ments</small></span></a></div>`;}
    return {screens:{arena:homeArena.arena,gallery:galleryPage,compare:comparePage,planner:plannerPage,'stat-limits':statLimits.page,bonuses:bonusSystem.page,updates:syncUI.page,upcoming:futureUI.page},detail:(kind,id)=>kind==='image'?imageDetail(id):null,actions:detailActions,afterRender,onRoute,home,bonusInfo:bonusSystem.itemInfo};
  }
};
