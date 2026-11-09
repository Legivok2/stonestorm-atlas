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
    const skill=system.v3.skills[id],text=system.locale.skills[id]?.desc;
    if(!skill||!text||!Number.isInteger(rank)||rank<1||rank>skill.values.length)return null;
    return text.replaceAll('{{value}}',format(skill.values[rank-1]*100)).replaceAll('{{every}}',String(skill.every??'')).replaceAll('{{times}}',String(skill.times??''));
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
  globalThis.StonestormPets=Object.freeze({stage,formForLevel,normalize,skillDescription,feedPreview,evolution});
})();
