/* A meglévő Atlas táblázataira és kártyáira épülő v3 kísérőfejezet. */
globalThis.AtlasPetUI={
  init({db,media,esc,num,pct,chip,notice,rows,table,link}){
    const system=db.petSystem,model=globalThis.StonestormPets,i18n=globalThis.AtlasI18n,t=(key,params)=>i18n.t(key,params);
    const petLocale=()=>{
      if(i18n.getLocale()!=='en')return db.petModel;
      const en=i18n.dictionaries.en;
      return {...db.petModel,locale:{...db.petModel.locale,
        types:Object.fromEntries(db.pets.map(p=>[p.id,{name:t('game.pet.'+p.id)}])),
        forms:Object.fromEntries(system.stages.map(s=>[s.form,t('pets.form.'+s.form)])),
        rarity:Object.fromEntries(Object.keys(db.petModel.locale.rarity).map(id=>[id,t('pets.rarity.'+id)])),
        trait:Object.fromEntries(['strike','mend','guard'].map(id=>[id,en['pets.trait.'+id]])),
        skills:Object.fromEntries(Object.keys(db.petSkills).map(id=>[id,{name:t('game.petSkill.'+id),desc:en['pets.skillDesc.'+id]}])),
        bonus:Object.fromEntries(Object.keys(db.petModel.locale.bonus).map(id=>[id,en['pets.bonus.'+id]]))
      }};
    };
    const describe=(pet,level=1,form=1,rank=0)=>globalThis.StonestormPetDetails.describe({petId:pet.id,level,form,rank,active:true},petLocale());
    const formName=form=>t('pets.form.'+form),skillName=id=>t('game.petSkill.'+id),petName=pet=>{const key=i18n.gameNameKey('pet',pet);return key?t(key):pet.name??pet.id;};
    const skillDescription=(id,level)=>globalThis.StonestormPetDetails.skillDescription(id,level,db.petModel.config,petLocale().locale,num);
    const cardSummary=pet=>`${describe(pet).sections[0].items[0]} · ${t('pets.card.summary',{level:1,form:formName(1),rank:0})}`;
    const portraitImage=(pet,form)=>media.render(media.pet(pet.id,form),{className:'atlas-detail-art pet-hero-art',alt:petName(pet)+' · '+formName(form),eager:true});
    function portrait(pet,form=1){return `<figure class="pet-portrait-stage" data-pet-portrait-stage="${esc(pet.id)}" data-pet-selected-form="${form}"><div class="pet-portrait-image" data-pet-hero-image>${portraitImage(pet,form)}</div><figcaption><span>${esc(t('pets.portrait.caption'))}</span><strong data-pet-hero-form>${esc(formName(form))}</strong><span data-pet-hero-index>${form} / ${system.stages.length}</span></figcaption></figure>`;}
    function engineOverview(){
      return `<section class="planner-panel"><h4>${esc(t('pets.engine.title'))}</h4><p>${esc(t('pets.engine.copy',{species:num(db.pets.length),skills:num(Object.keys(db.petSkills).length)}))}</p>${table([t('pets.engine.category'),t('pets.engine.version')],Object.entries(db.dataEngine.branches).map(([id,b])=>[esc(t('pets.engine.group.'+id)),esc(b.gameVersion)]))}<p>${esc(t('pets.engine.refresh'))}</p><details><summary>${esc(t('pets.engine.technical'))}</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(JSON.stringify({branches:db.dataEngine.branches,publicRules:db.dataEngine.publicRules},null,2))}</pre></details></section>`;
    }
    function calculation(pet,level,form,rank){
      const d=describe(pet,level,form,rank);
      const details=['pets.section.trait','pets.section.signature','pets.section.learned'];
      return `<div class="planner-bonus-panel" data-pet-bonus="${d.bonusValue}">${media.render(media.pet(pet.id,form),{thumbnail:true,className:"pet-rule-icon",alt:petName(pet)+' · '+d.formName})}<h4>${esc(d.sections[0].items[0])}</h4><p>${esc(t('pets.calculator.level',{level:num(level)}))} · ${esc(d.formName)} · ${esc(t('pets.calculator.rank',{rank:num(rank)}))} · ${esc(t('pets.calculator.active'))}</p><p class="pet-calculation-note">${esc(t('pets.calculator.formulaNote'))}</p>${d.sections.slice(1,4).map((s,index)=>`<details class="pet-effect-details"><summary>${esc(t(details[index]))}</summary>${s.items.map(i=>`<p>${esc(i)}</p>`).join('')}</details>`).join('')}</div>`;
    }
    function calculator(pet){return `<section class="planner-panel pet-calculator" data-pet-calculator="${esc(pet.id)}"><h4>${esc(t('pets.calculator.title'))}</h4><div class="planner-fields"><label>${esc(t('pets.calculator.form'))}<select data-pet-calc-form>${system.stages.map(s=>`<option value="${s.form}">${esc(formName(s.form))}</option>`).join('')}</select></label><label>${esc(t('pets.calculator.levelLabel'))}<input type="number" data-pet-calc-level min="1" max="10" value="1"></label><label>${esc(t('pets.calculator.rankLabel'))}<input type="number" data-pet-calc-rank min="0" max="10000" value="0"></label></div><div data-pet-calc-result aria-live="polite">${calculation(pet,1,1,0)}</div><details><summary>${esc(t('pets.calculator.sources'))}</summary><p>${esc(t('pets.calculator.imageSource'))}</p>${rows(Object.entries(pet.perLevel).map(([k,v])=>[esc(t('stat.'+k)),String(v)]))}<p>${esc(t('pets.calculator.formula',{passive:db.petModel.config.forms.passive.join(' / '),rankShare:db.petModel.config.rankBonusShare}))}</p><p>${esc(t('pets.calculator.provenance',{version:db.petModel.gameVersion}))} <code>data/addon-pet-model.json</code>. ${esc(t('pets.calculator.finalFormula'))}</p></details></section>`;}
    document.addEventListener('input',event=>{
      const box=event.target.closest('[data-pet-calculator]');if(!box)return;
      const pet=db.pets.find(p=>p.id===box.dataset.petCalculator),form=Number(box.querySelector('[data-pet-calc-form]').value),stage=system.stages[form-1];if(!pet||!stage)return;
      const input=box.querySelector('[data-pet-calc-level]');input.min=stage.minLevel;input.max=stage.maxLevel;
      const level=Math.min(stage.maxLevel,Math.max(stage.minLevel,Math.round(Number(input.value)||stage.minLevel))),rank=Math.min(10000,Math.max(0,Math.round(Number(box.querySelector('[data-pet-calc-rank]').value)||0)));
      if(event.target.matches('[data-pet-calc-form]'))input.value=level;
      box.querySelector('[data-pet-calc-result]').innerHTML=calculation(pet,level,form,rank);
      const bonusSummary=box.closest('#atlas-detail-body')?.querySelector('[data-pet-bonus-summary]');
      if(bonusSummary){const clone=box.querySelector('[data-pet-calc-result]').cloneNode(true);for(const node of clone.querySelectorAll('[data-pet-bonus]'))node.removeAttribute('data-pet-bonus');bonusSummary.innerHTML=clone.innerHTML;}
      const hero=box.closest('#atlas-detail-body')?.querySelector('[data-pet-portrait-stage]');
      if(hero?.dataset.petPortraitStage===pet.id&&hero.dataset.petSelectedForm!==String(form)){
        hero.querySelector('[data-pet-hero-image]').innerHTML=portraitImage(pet,form);
        hero.querySelector('[data-pet-hero-form]').textContent=formName(form);
        hero.querySelector('[data-pet-hero-index]').textContent=form+' / '+system.stages.length;
        hero.dataset.petSelectedForm=String(form);
      }
    });
    const asset=(category,name,alt)=>media.render(media.get(category,name),{alt,thumbnail:true,className:'pet-rule-icon'});
    const material=id=>{
      const item=db.economy.stackables.find(x=>x.id===id);if(!item)return `<code>${esc(id)}</code>`;
      const direct='pets.material.'+id;
      const name=Object.hasOwn(i18n.dictionaries[i18n.getLocale()],direct)?t(direct):id.startsWith('pet_book_')?t('pets.material.book',{skill:skillName(id.slice('pet_book_'.length))}):item.name;
      return link('materials','material',item,name);
    };
    const conflict=()=>`<div class="pet-source-conflict">${chip(t('pets.conflict.badge'),'unknown')}<p>${esc(t('pets.conflict.copy',{caps:system.formCaps.join(' / '),maxLevel:system.maxLevel,observedCaps:system.observedFormCaps.join(' / ')}))} <code>pets.rules.maxLevel = 10</code></p></div>`;
    function progression(){
      const changes=system.stages.map((s,index)=>index?`${s.slots-system.stages[index-1].slots?t('pets.progression.newSlot'):t('pets.progression.noNewSlot')} · ${t('pets.progression.evolutionAt',{level:num(s.minLevel)})}`:t('pets.progression.initial'));
      return `<div class="pet-progression-table">${table([t('pets.progression.form'),t('pets.progression.cap'),t('pets.progression.slots'),t('pets.progression.change')],system.stages.map((s,index)=>[
        `<strong>${num(s.form)}. ${esc(formName(s.form))}</strong>`,t('pets.progression.range',{min:num(s.minLevel),max:num(s.maxLevel),cap:num(s.maxLevel)}),String(s.slots),esc(changes[index])
      ]))}</div><p>${esc(t('pets.progression.overlap'))} <code>data/pet-system-evidence.json → clientRules.formCaps</code> / <code>observedFormCaps</code>.</p>${notice(t('pets.progression.slotsNote')+' '+t('pets.progression.observationNote'))}`;
    }
    function evolution(){
      return `<section class="planner-panel pet-evolution"><h4>${esc(t('pets.evolution.title'))}</h4>${table([t('pets.evolution.fromTo'),t('pets.evolution.required'),t('pets.evolution.core'),t('pets.evolution.thread'),t('pets.evolution.nyang'),t('pets.evolution.slots')],system.stages.slice(0,-1).map(s=>{
        const e=model.evolution(s.form,system);return [`${esc(formName(s.form))} → ${esc(formName(e.to.form))}`,num(e.requiredLevel),material(e.base.core),num(e.base.thread),num(e.base.nyang),`${s.slots} → ${e.to.slots}`];
      }))}<p>${esc(t('pets.evolution.requirement'))} <code>v3.forms.cost[currentForm]</code>.</p>${notice(t('pets.evolution.warning'))}</section>`;
    }
    function skills(){
      return `<section class="pet-skills"><h4 class="atlas-subheading">${esc(t('pets.skills.title'))}</h4>${table([t('pets.skills.description'),t('pets.skills.level1'),t('pets.skills.level2'),t('pets.skills.level3'),t('pets.skills.level4'),t('pets.skills.level5')],Object.entries(system.v3.skills).map(([id,s])=>[
        `<div class="pet-skill-heading">${asset('icons','pet_book_'+id,skillName(id))}${link('pets','skill',{id,name:db.petSkillNames[id]?.name??id})}</div><p>${esc(skillDescription(id,1))}</p>`,...s.values.map(pct)
      ]))}<p>${esc(t('pets.skills.note'))} <code>slots[form - 1]</code> = ${system.v3.forms.slots.join(' / ')}.</p></section>`;
    }
    function books(){
      const pools=system.spine.book.pools;
      return `<section class="planner-panel pet-books"><h4>${esc(t('pets.books.title'))}</h4><p>${esc(t('pets.books.copy'))}</p>${table([t('pets.books.dungeonPool'),t('pets.books.catalog')],Object.entries(pools).map(([id,pool])=>[esc(db.dungeons.find(d=>d.id===id)?.name??id),Object.keys(pool).map(skill=>material('pet_book_'+skill)).join(' · ')]))}<p>${chip(t('pets.books.contentApi'),'verified')} ${esc(t('pets.books.chance',{chance:pct(system.spine.book.chancePerBossChest),pity:num(system.spine.book.pityBooklessClears)}))}</p><details><summary>${esc(t('pets.books.collectionTitle'))}</summary><p>${esc(t('pets.books.collection',{perSpecies:pct(system.v3.book.perSpecies),cap:pct(system.v3.book.capPerKey)}))} <code>pet_book_&lt;skill&gt;</code>.</p></details></section>`;
    }
    function feeding(){
      const v3=system.v3,spine=system.spine,example=model.feedPreview(1,10,1,system,db.petRules);
      return `<section class="planner-panel pet-feeding"><h4>${esc(t('pets.feeding.title'))}</h4>${table([t('pets.feeding.rule'),t('pets.feeding.data')],[
        [t('pets.feeding.nextXp'),t('pets.feeding.nextXpValue',{base:num(v3.xp.toNextBase),perLevel:num(v3.xp.toNextPerLevel)})],
        [t('pets.feeding.feedXp'),t('pets.feeding.feedXpValue',{share:num(v3.xp.feedLevelShare)})],
        [t('pets.feeding.material'),t('pets.feeding.materialValue',{base:num(v3.xp.feedMaterials.base),perLevel:num(v3.xp.feedMaterials.perLevel)})],
        [t('pets.feeding.nyang'),t('pets.feeding.nyangValue',{perLevel:num(db.petRules.feedNyangPerLevel)})],
        [t('pets.feeding.threadHero'),t('pets.feeding.threadHeroValue')],
        [t('pets.feeding.daily'),t('pets.feeding.dailyValue',{free:num(v3.costs.feed.freePerDay)})],
        [t('pets.feeding.levelCap'),t('pets.feeding.capValue',{maxLevel:num(system.maxLevel)})]
      ])}<p>${esc(t('pets.feeding.example',{materials:num(example.materials),nyang:num(example.nyang),xp:num(example.xp)}))}</p><h5>${esc(t('pets.feeding.shareTitle'))}</h5>${table([t('pets.feeding.activity'),t('pets.feeding.v3'),t('pets.feeding.spine')],[[t('pets.feeding.general'),pct(v3.xp.share.default),pct(spine.xpShare.default)],[t('pets.feeding.dungeon'),pct(v3.xp.share.dungeon),pct(spine.xpShare.dungeon)],[t('pets.feeding.petRoom'),pct(v3.xp.share.pet_room),pct(spine.xpShare.pet_room)]])}${notice(t('pets.feeding.warning'))}</section>`;
    }
    function sources(){return `<details class="pet-references"><summary>${esc(t('pets.sources.summary'))}</summary><p>${esc(t('pets.sources.checked',{date:i18n.formatDate(new Date(system.checkedAt)),version:system.version}))} <code>pets.locale.forms</code> / <code>stages</code>.</p><p>${esc(t('pets.sources.caps'))} <code>data/pet-system-evidence.json → clientRules.formCaps</code> · <code>snapshots/current/content.json</code>.</p><p>${esc(t('pets.sources.references'))} <code>pets.v3.reference.bands</code> · <code>spine.hero.pets.reference.bands</code>.</p><p>${esc(t('pets.sources.legacy'))} <code>rules</code> / <code>stages</code> / <code>v3</code>.</p><a class="atlas-inline-link" href="https://stonestorm.gg/api/content" target="_blank" rel="noopener noreferrer">${esc(t('pets.sources.api'))}</a></details>`;}
    function overview(){return `<section class="pet-system" aria-labelledby="pet-development-title"><div class="pet-overview-head"><h4 class="atlas-subheading" id="pet-development-title">${esc(t('pets.overview.title',{maxLevel:num(system.maxLevel)}))}</h4>${conflict()}${progression()}</div>${evolution()}${feeding()}${skills()}${books()}${sources()}</section>`;}
    function detail(){return `<section class="pet-development-detail"><h4>${esc(t('pets.detail.development',{maxLevel:num(system.maxLevel)}))}</h4>${conflict()}${progression()}${evolution()}<p>${esc(t('pets.detail.guide'))}</p><a class="atlas-inline-link" href="#atlas/pets">${esc(t('pets.detail.guideLink'))}</a></section>`;}
    function skillDetail(id){
      const s=system.v3.skills[id],kind=t('pets.detail.skillKind.'+s.kind);
      return `<div class="pet-skill-heading">${asset('icons','pet_book_'+id,skillName(id))}<p>${esc(kind)} · ${esc(t('pets.detail.skillLevel'))} 1–${s.values.length}</p></div>${table([t('pets.detail.skillLevel'),t('pets.detail.value'),t('pets.detail.effect')],s.values.map((v,index)=>[num(index+1),pct(v),esc(skillDescription(id,index+1))]))}<p>${esc(t('pets.detail.book'))}: ${material('pet_book_'+id)}. ${esc(t('pets.detail.skillBookNote'))}</p><a class="atlas-inline-link" href="#atlas/pets">${esc(t('pets.detail.formsAndBooks'))}</a>`;
    }
    return {overview,detail,skillDetail,cardSummary,calculator,engineOverview,portrait,describe,petName,skillName,skillDescription,formName};
  }
};
