/* Tiszta modell: csak a helyi pillanatképben bizonyított komponenseket számolja. */
(() => {
  const own=(object,key)=>Object.prototype.hasOwnProperty.call(object??{},key);
  const integer=(x,min,max,fallback)=>typeof x==='number'&&Number.isInteger(x)?Math.max(min,Math.min(max,x)):fallback;
  function empty(db,classId=db.classes[0].id){return {version:1,name:'Új karakterbuild',classId,gender:'male',look:1,level:1,gear:{},petId:null,petLevel:1,traitRank:1,skillRank:1,mountId:null,targetFamily:null};}
  const canEquip=(item,build)=>item.level<=build.level&&(!item.classes?.length||item.classes.includes(build.classId));
  function normalize(input,db){
    const errors=[];input=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
    const result=empty(db,db.classes.some(c=>c.id===input.classId)?input.classId:db.classes[0].id);
    result.name=typeof input.name==='string'?input.name.replace(/[\u0000-\u001f]/g,'').slice(0,80):result.name;
    result.gender=['male','female'].includes(input.gender)?input.gender:'male';
    result.look=integer(input.look,1,2,1);
    result.level=integer(input.level,1,db.economy.limits.maxLevel,1);
    result.petLevel=integer(input.petLevel,1,db.petRules.maxLevel,1);
    result.traitRank=integer(input.traitRank,1,5,1);
    result.skillRank=integer(input.skillRank,1,5,1);
    result.targetFamily=db.sets.some(s=>s.familyId===input.targetFamily)?input.targetFamily:null;
    for(const slot of Object.keys(db.labels.slots)){
      if(!own(input.gear,slot))continue;
      const selection=input.gear[slot],item=db.items.find(x=>x.id===selection?.id);
      if(!item||item.slot!==slot||!canEquip(item,result)){errors.push(`${db.labels.slots[slot]}: nem használható vagy ismeretlen tárgy eltávolítva.`);continue;}
      result.gear[slot]={id:item.id,plus:integer(selection.plus,0,db.forge.plusMult.length-1,0)};
    }
    const pet=db.pets.find(p=>p.id===input.petId);
    if(pet&&result.level>=db.petRules.minHeroLevel)result.petId=pet.id;
    else if(input.petId)errors.push('A kísérő minimumszintje nem teljesül, vagy azonosítója ismeretlen.');
    const mount=db.mounts.find(m=>m.id===input.mountId);
    if(mount&&mount.level<=result.level)result.mountId=mount.id;
    else if(input.mountId)errors.push('A hátas minimumszintje nem teljesül, vagy azonosítója ismeretlen.');
    return {build:result,errors};
  }
  // A mentett kliens Kn/Kv/$v függvényeinek külön átírt, ellenőrizhető számítása.
  // A +0 eredményt minden template.values mezővel teszteljük. Nem futtatunk játékkódot.
  const round=x=>Math.round(x+1e-9);
  function growth(base,plus,multipliers,precision=1,tick=1){
    let result=round(base*multipliers[0]*precision)/precision;
    for(let p=1;p<=plus;p++){
      const next=round(base*multipliers[p]*precision)/precision;
      result=round(next*tick)>round(result*tick)?next:(round(result*tick)+1)/tick;
    }
    return result;
  }
  function equipmentValues(item,plus,db){
    plus=integer(plus,0,db.forge.plusMult.length-1,0);
    const l=item.level,m=db.forge.plusMult,v={atkMin:0,atkMax:0,def:0,maxHp:0,crit:0,attack:0};
    switch(item.slot){
      case 'weapon':v.atkMin=growth(4+2*l,plus,m);v.atkMax=growth(7+2.8*l,plus,m);break;
      case 'armor':v.def=growth(6+1.6*l,plus,m);break;
      case 'helmet':v.def=growth(3+.8*l,plus,m);break;
      case 'shield':v.def=growth(4+l,plus,m);break;
      case 'boots':v.def=growth(2+.6*l,plus,m);break;
      case 'bracelet':v.maxHp=growth(30+12*l,plus,m);break;
      case 'necklace':v.crit=growth(.01+.001*l,plus,m,1e4,1e3);break;
      case 'earrings':v.attack=growth(2+.5*l,plus,m);break;
      default:return null;
    }
    const base=plus?equipmentValues(item,0,db):v;
    if(Object.entries(item.values).some(([key,value])=>!Number.isFinite(base?.[key])||Math.abs(base[key]-value)>1e-8))return null;
    return v;
  }
  function calculate(input,db){
    const normalized=normalize(input,db),build=normalized.build;
    const equipment={},equipped=[],families={};
    for(const [slot,selection] of Object.entries(build.gear)){
      const item=db.items.find(x=>x.id===selection.id),values=equipmentValues(item,selection.plus,db);
      equipped.push({slot,item,plus:selection.plus,values});
      if(values)for(const [stat,v] of Object.entries(values))equipment[stat]=(equipment[stat]??0)+v;
      if(item.family){families[item.family]??=new Set();families[item.family].add(slot);}
    }
    const sets=db.sets.map(set=>{
      const worn=families[set.familyId]??new Set();
      const count=set.slots.filter(slot=>worn.has(slot)).length;
      return {set,count,active:set.bonuses.filter(b=>count>=b.pieces),inactive:set.bonuses.filter(b=>count<b.pieces),missingSlots:set.slots.filter(slot=>!worn.has(slot))};
    }).filter(x=>x.count||x.set.familyId===build.targetFamily);
    const pet=db.pets.find(p=>p.id===build.petId)??null,mount=db.mounts.find(m=>m.id===build.mountId)??null;
    return {build,errors:normalized.errors,baseStats:db.classes.find(c=>c.id===build.classId).baseStats,equipment,equipped,sets,
      pet:pet?{record:pet,level:build.petLevel,traitRank:build.traitRank,skillRank:build.skillRank,rawSpeciesBonus:Object.fromEntries(Object.entries(pet.perLevel).map(([k,v])=>[k,v*build.petLevel]))}:null,
      mount:mount?{record:mount,travelMult:mount.travelMult}:null,
      levelStats:null,finalCombatStats:null,
      limitations:['A karakter szintből származó tulajdonságainak elosztása és a teljes szerveroldali harci képlet nem igazolt.','A felszerelésösszeg számtani komponensösszeg, nem végső támadás, védelem vagy harcerő.','A százalékos szett- és kísérőhatások nem kerülnek bizonyítatlan módon az alapértékekre.','Véletlen tárgybónuszok és egyéb buffok nincsnek általánosítva.']};
  }
  function parse(text,db){
    if(typeof text!=='string'||text.length>12000)return {build:empty(db),errors:['A megosztott build túl hosszú vagy érvénytelen.']};
    try{const input=JSON.parse(text);if(input?.version!==1)return {build:empty(db),errors:['Nem támogatott buildverzió.']};return normalize(input,db);}catch{return {build:empty(db),errors:['A buildhivatkozás nem érvényes JSON.']};}
  }
  globalThis.StonestormPlanner=Object.freeze({empty,normalize,calculate,parse,equipmentValues,canEquip});
})();
