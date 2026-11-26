/* A v3 formák és a jelenlegi játékmegfigyelés közös, tiszta modellje. */
(() => {
  function stage(form,system){return Number.isInteger(form)?system.stages.find(s=>s.form===form)??null:null;}
  function formForLevel(level,system){return system.stages.find(s=>level<=s.maxLevel)?.form??system.stages.at(-1).form;}
  function normalize(level,form,heroLevel,system){
    const lastAllowed=system.stages.filter(s=>s.minLevel<=heroLevel).at(-1)??system.stages[0];
    const requested=Number.isInteger(level)?level:1;
    const selected=Number.isInteger(form)?Math.max(1,Math.min(lastAllowed.form,form)):Math.min(lastAllowed.form,formForLevel(requested,system));
    const current=stage(selected,system);
    return {form:selected,level:Math.max(current.minLevel,Math.min(current.maxLevel,heroLevel,Math.max(1,requested)))};
  }
  function skillDescription(id,rank,system,format){
    return globalThis.StonestormPetDetails.skillDescription(id,rank,system.v3,system.locale,format);
  }
  // Kliensbeli tartalékérték, nem szerveres árajánlat. A karakterből érkező mezők elsőbbségét külön jelöljük.
  function feedPreview(level,heroLevel,form,system,legacy){
    const current=stage(form,system);
    if(!current||!Number.isInteger(level)||!Number.isInteger(heroLevel)||level<current.minLevel||level>Math.min(heroLevel,current.maxLevel))return null;
    if(level>=Math.min(heroLevel,current.maxLevel))return {blocked:true,reason:heroLevel<current.maxLevel?'hero':'form'};
    const xp=system.v3.xp,next=xp.toNextBase+xp.toNextPerLevel*level;
    return {blocked:false,xpToNext:next,xp:Math.round(next*xp.feedLevelShare),materials:xp.feedMaterials.base+xp.feedMaterials.perLevel*level,nyang:legacy.feedNyangPerLevel*level};
  }
  function evolution(form,system){
    const current=stage(form,system),cost=system.v3.forms.cost[form];
    return current&&cost?{from:current,to:stage(form+1,system),requiredLevel:current.maxLevel,base:{...cost},fallbackCores:1}:null;
  }
  function verifiedReference(petId,level,system,channel='v3'){
    if(petId!=='pet_wolf'||!Number.isInteger(level)||level<1)return null;
    const reference=channel==='spine'?system.spine.reference:system.v3.reference;
    if(reference?.species!==petId||!Array.isArray(reference.bands))return null;
    const band=[...reference.bands].reverse().find(b=>level>=b.from);
    return band?{channel,level,band:{...band,skills:(band.skills??[]).map(skill=>({...skill}))}}:null;
  }
  function observedReferencePreset(){
    return Object.freeze({
      presetId:'mohaagancs-adult-22',
      source:'prompt-supplied-observation',
      liveClientDiscovery:false,
      petId:'pet_u_wild',
      petName:'Mohaagancs',
      rarity:'Mitikus',
      level:22,
      form:3,
      formName:'Felnőtt',
      formCap:35,
      label:'Mohaagancs 22 · Adult 22/35',
      suppliedValues:Object.freeze({
        level:22,
        form:3,
        formCap:35,
        rarity:'Mitikus',
        xpBonusPct:12.6,
        trait:Object.freeze({name:'Rárontás',every:3,percent:57.2}),
        signature:Object.freeze({skillId:'first_strike',name:'Előcsapás',percent:140}),
        skills:Object.freeze([
          Object.freeze({skillId:'crit_dmg',name:'Éles karom',level:5}),
          Object.freeze({skillId:'shield_open',name:'Nyitópajzs',level:5,percent:18})
        ]),
        mastery:Object.freeze({rank:11,max:15})
      }),
      trait:Object.freeze({name:'Rárontás',every:3,percent:57.2}),
      signature:Object.freeze({skillId:'first_strike',name:'Előcsapás',percent:140}),
      skills:Object.freeze([
        Object.freeze({skillId:'crit_dmg',name:'Éles karom',level:5}),
        Object.freeze({skillId:'shield_open',name:'Nyitópajzs',level:5,percent:18})
      ]),
      mastery:Object.freeze({rank:11,max:15,rawApiRank:null}),
      promptReferenceXpBonusPct:12.6,
      atlasModalDisplayedXpBonusPct:12,
      verifiedCalculationXpBonusPct:12,
      notSupplied:['gameVersion','rawApiRankMapping'],
      caveat:'A részletes értékek a feladatban megadott megfigyelésből származnak; nem élő kliensből függetlenül felfedezett referencia. A Mesterfok és a nyers API-rang közötti kapcsolat nem igazolt.'
    });
  }
  globalThis.StonestormPets=Object.freeze({stage,formForLevel,normalize,skillDescription,feedPreview,evolution,verifiedReference,observedReferencePreset});
})();
