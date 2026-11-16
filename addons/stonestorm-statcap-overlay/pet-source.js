/* Read-only DOM evidence and an instance-keyed, page-local roster. No requests or storage. */
(() => {
  'use strict';
  const normalize=value=>String(value??'').normalize('NFC').replace(/\s+/gu,' ').trim();
  const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  function create(model){
    const logic=globalThis.StonestormPetDetails;
    let records=new Map(),last={available:false,diagnostics:{received:0,recognized:0,reasons:{}}};
    const visible=el=>el.getClientRects().length>0;
    function readRow(row){
      const out={};if(!row)return out;
      const own=el=>el.closest('.pet-main,.pet-row')===row;
      const all=selector=>[...row.querySelectorAll(selector)].filter(el=>own(el)&&visible(el));
      const nameElement=all('.pet-main__title,.pet-row__name')[0];
      const name=nameElement?normalize([...nameElement.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('')):'';
      const species=Object.entries(model.locale.types).filter(([,t])=>normalize(t.name)===name);
      if(species.length===1)out.petId=species[0][0];
      if(name)out.visibleName=name;
      const level=all('.pet-row__level,[data-testid="pet-level"]')[0];
      if(level){const text=normalize(level.textContent),match=text.match(/^Szint\s+(\d+)\s*\/\s*\d+$/iu)??text.match(/^(\d+)\s*\.\s*szint$/iu)??text.match(/^(\d+)\s*\/\s*\d+$/u);if(match)out.level=Number(match[1]);}
      const forms=all('.pet-main__form-name,.pet-row__name .chip');
      const form=Object.entries(model.locale.forms).filter(([,name])=>forms.some(el=>normalize(el.textContent)===normalize(name)));
      if(form.length===1)out.form=Number(form[0][0]);
      if(model.locale.rarity[row.dataset.rarity])out.rarity=row.dataset.rarity;
      if(row.classList.contains('pet-row'))out.active=false;
      else if(row.classList.contains('pet-main'))out.active=true;
      const bonuses=[];
      for(const el of all('.pet-card__bonus'))for(const [key,template] of Object.entries(model.locale.bonus)){
        const pattern='^'+normalize(template).split('{{value}}').map(escape).join('([0-9]+(?:[.,][0-9]+)?)')+'$';
        const match=normalize(el.textContent).match(new RegExp(pattern,'u'));
        if(match){const percent=Number(match[1].replace(',','.'));if(Number.isFinite(percent)&&percent>=0&&percent<=1e12)bonuses.push({key,percent});}
      }
      const distinct=[...new Map(bonuses.map(b=>[b.key+':'+b.percent,b])).values()];
      if(distinct.length===1)out.bonus=distinct[0];else if(distinct.length>1)out.bonusConflict=true;
      const trait=all('[data-testid="pet-trait"]')[0];if(trait)out.traitText=normalize(trait.textContent);
      const skillId=name=>{const matches=Object.entries(model.locale.skills).filter(([,s])=>normalize(s.name)===normalize(name));return matches.length===1?matches[0][0]:null;};
      const innate=all('[data-testid="pet-innate"]')[0];
      if(innate){const id=skillId(innate.querySelector('.pet-slot__name')?.textContent);if(id){out.signature=id;const description=normalize(innate.querySelector('.pet-slot__desc')?.textContent);if(description)out.signatureDescription=description;}}
      const slots=all('.pet-slots')[0];
      if(slots){out.skills=[...slots.querySelectorAll('[data-slot="skill"]')].map(el=>{const id=skillId(el.querySelector('.pet-slot__name')?.textContent),match=normalize(el.querySelector('.pet-slot__note')?.textContent).match(/^(\d+)\s*\.\s*szint$/iu);return {skillId:id??'unknown',...match?{level:Number(match[1])}:{}};});}
      return out;
    }
    function identify(target){
      const row=target.closest('.pet-row,.pet-main'),observed=readRow(row),key=logic.instanceId(row?.getAttribute('data-pet'));
      let instance=key===null?null:records.get(key),reason=instance?'matched':!last.available?'roster-unavailable':key===null?'row-without-instance-id':'instance-not-in-roster';
      if(instance&&observed.petId&&observed.petId!==instance.petId&&normalize(instance.name)!==observed.visibleName){instance=null;reason='species-conflict';}
      if(!instance)return {instance:{...observed.visibleName?{name:observed.visibleName}:{},...observed.petId?{petId:observed.petId}:{}},observed,matched:false,reason};
      // A custom name can equal another species name; a proven instance ID stays authoritative.
      if(observed.petId!==instance.petId)delete observed.petId;
      return {instance,observed,matched:true,reason};
    }
    function diagnostics(config=model.config,now=Date.now()){
      const rows=[...document.querySelectorAll('.pet-row[data-pet],.pet-main[data-pet],.pet-main--sheet')].filter(visible),matched=new Set(),sources={},missing={},failures={},defaults={};
      for(const row of rows){const match=identify(row),view=logic.describe(match.instance,model,config,now,match.observed);if(match.matched)matched.add(match.instance.id);else failures[match.reason]=(failures[match.reason]??0)+1;for(const field of view.missing)missing[field]=(missing[field]??0)+1;for(const field of ['form','rank'])if(match.instance.fieldSources?.[field]==='client-default')defaults[field]=(defaults[field]??0)+1;sources[view.bonusSource]=(sources[view.bonusSource]??0)+1;if(match.observed.bonusConflict)failures['conflicting-dom-bonuses']=(failures['conflicting-dom-bonuses']??0)+1;}
      return {schema:1,rosterAvailable:last.available,receivedPets:last.diagnostics.received,recognizedPets:records.size,visibleRows:rows.length,matchedPets:matched.size,bonusSources:sources,missingFields:missing,clientDefaults:defaults,identificationFailures:failures,rejectedRecords:last.diagnostics.reasons};
    }
    return Object.freeze({update(payload){const normalized=logic.roster(payload),received=payload?.schema===2?payload.diagnostics:null;const reasons=received?Object.fromEntries(['invalid-instance-id','missing-species-id','duplicate-instance-id'].filter(k=>Number.isSafeInteger(received.reasons?.[k])&&received.reasons[k]>0&&received.reasons[k]<=100).map(k=>[k,received.reasons[k]])):normalized.diagnostics.reasons;last={...normalized,available:payload?.available===false?false:normalized.available,diagnostics:{...normalized.diagnostics,received:Number.isSafeInteger(received?.received)?received.received:normalized.diagnostics.received,reasons}};records=new Map(normalized.pets.map(p=>[p.id,p]));},identify,readRow,diagnostics});
  }
  globalThis.StonestormPetSources=Object.freeze({create});
})();
