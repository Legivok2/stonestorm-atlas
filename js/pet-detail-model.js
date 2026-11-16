/* Shared, pure tooltip model. Public species rules and private roster stay separate. */
(() => {
  'use strict';
  const finite=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1e12;
  const integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
  const id=v=>typeof v==='string'&&/^[a-zA-Z0-9_:-]{1,100}$/.test(v)&&!['__proto__','constructor','prototype'].includes(v);
  const cleanText=v=>typeof v==='string'?v.replace(/[\u0000-\u001f]/g,'').slice(0,100):undefined;
  // Instance IDs are opaque local keys, never file paths, selectors or object properties.
  const instanceId=v=>Number.isSafeInteger(v)&&v>=0?String(v):typeof v==='string'&&v.length<=160&&v.trim().length>0&&!/[\u0000-\u001f\u007f]/u.test(v)?v:null;
  function validateShape(value,contract,prefix=''){
    if(contract.number){if(typeof value!=='number'||!Number.isFinite(value)||value<contract.min||value>contract.max)throw Error(prefix+': invalid number');return;}
    if(contract.array){if(!Array.isArray(value)||value.length!==contract.array.length)throw Error(prefix+': changed array structure');value.forEach((v,i)=>validateShape(v,contract.array[i],prefix+'/'+i));return;}
    if(contract.object){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join('|')!==Object.keys(contract.object).sort().join('|'))throw Error(prefix+': changed object structure');for(const [k,c] of Object.entries(contract.object))validateShape(value[k],c,prefix+'/'+k);return;}
    if(value!==contract.literal)throw Error(prefix+': changed mechanic or identifier');
  }
  function publicConfig(content,contract){
    const p=content?.pets??content;
    if(contract)try{validateShape(p,contract);}catch{return null;}
    if(!p||!Array.isArray(p.types)||!p.v3?.forms||!p.v3.skills||!p.traits)return null;
    const numbers=a=>Array.isArray(a)&&a.length>0&&a.length<=10&&a.every(finite)?a.slice():null;
    const passive=numbers(p.v3.forms.passive),slots=numbers(p.v3.forms.slots),growth=p.v3.rarity?.growth,scale=p.v3.forms.traitLevelScale;
    if(passive?.length!==5||slots?.length!==5||!growth||!finite(scale?.base)||!finite(scale?.perLevel)||!finite(p.rankBonusShare)||!finite(p.rules?.rankTraitBonus))return null;
    if(slots.join(',')!=='0,1,2,3,3'||passive.some(v=>v>100))return null;
    const bonusKeys=new Set(['xpMult','nyangMult','hpMult','dropMult','evadeBonus','atkMult','defMult','critBonus']);
    if(p.types.some(t=>Object.keys(t.perLevel??{}).length!==1||Object.entries(t.perLevel??{}).some(([k,v])=>!bonusKeys.has(k)||!finite(v)||v>1)))return null;
    const types=p.types.slice(0,200).map(t=>({id:t.id,rarity:t.rarity,trait:t.trait,...t.signature?{signature:t.signature}:{},perLevel:{...t.perLevel}}));
    if(types.some(t=>!id(t.id)||!id(t.trait)||!id(t.rarity)||t.signature!==undefined&&!id(t.signature)||!Object.keys(t.perLevel).length)||new Set(types.map(t=>t.id)).size!==types.length)return null;
    const skills={};for(const [key,s] of Object.entries(p.v3.skills)){if(!id(key)||!id(s.kind)||!numbers(s.values))return null;skills[key]={kind:s.kind,values:numbers(s.values),...s.mod?{mod:s.mod}:{},...finite(s.every)?{every:s.every}:{},...finite(s.times)?{times:s.times}:{}};}
    const traits={};for(const key of ['strike','mend','guard']){const t=p.traits[key];if(!t)return null;traits[key]={};for(const [k,v] of Object.entries(t))if(id(k)&&(finite(v)||numbers(v)))traits[key][k]=Array.isArray(v)?numbers(v):v;}
    if(traits.strike.every?.length!==5||traits.strike.mult?.length!==5||traits.mend.pct?.length!==5||traits.guard.pct?.length!==5||!finite(traits.mend.belowHp)||!finite(traits.guard.hits))return null;
    return {types,traits,skills,forms:{passive,slots,traitLevelScale:{base:scale.base,perLevel:scale.perLevel}},growth:Object.fromEntries(Object.entries(growth).filter(([k,v])=>id(k)&&finite(v))),rankBonusShare:p.rankBonusShare,rankTraitBonus:p.rules.rankTraitBonus};
  }
  function roster(character){
    const data=character?.state??character;
    const records=new Map(),duplicates=new Set(),reasons={},available=Array.isArray(data?.pets),raw=available?data.pets:[];
    const reject=reason=>{reasons[reason]=(reasons[reason]??0)+1;};
    for(const p of raw.slice(0,100)){
      const key=instanceId(p?.id);if(key===null){reject('invalid-instance-id');continue;}if(!id(p?.petId)){reject('missing-species-id');continue;}
      if(records.has(key)||duplicates.has(key)){records.delete(key);duplicates.add(key);reject('duplicate-instance-id');continue;}
      const out={id:key,petId:p.petId,fieldSources:{}};
      const invalid=new Set(data.schema===2&&Array.isArray(p.invalidFields)?p.invalidFields.filter(f=>['form','rank'].includes(f)):[]);
      for(const k of ['level','bond'])if(integer(p[k],1,10000))out[k]=p[k];
      // Verified client it(): form ?? bond ?? 1; Kn(): rank ?? 0.
      // Defaults only apply to a recognized API record, never an unrelated DOM name.
      const form=p.form??p.bond??1;
      if(!invalid.has('form')&&finite(form)){out.form=Math.min(5,Math.max(1,Math.round(form)));out.fieldSources.form=p.form!=null?'api':p.bond!=null?'client-bond':'client-default';}else invalid.add('form');
      if(!invalid.has('rank')&&p.rank==null){out.rank=0;out.fieldSources.rank='client-default';}else if(!invalid.has('rank')&&integer(p.rank,0,10000)){out.rank=p.rank;out.fieldSources.rank='api';}else invalid.add('rank');
      if(invalid.size)out.invalidFields=[...invalid];
      if(data.schema===2)for(const field of ['form','rank'])if(['api','client-bond','client-default'].includes(p.fieldSources?.[field]))out.fieldSources[field]=p.fieldSources[field];
      for(const k of ['rarity','trait','signature'])if(id(p[k]))out[k]=p[k];
      if(typeof p.active==='boolean')out.active=p.active;
      if(cleanText(p.name))out.name=cleanText(p.name);
      for(const k of ['rankAt','hatchAt'])if(p[k]===null||typeof p[k]==='string'&&Number.isFinite(Date.parse(p[k])))out[k]=p[k];
      if(Array.isArray(p.skills))out.skills=p.skills.slice(0,10).map(s=>({skillId:id(s?.skillId)?s.skillId:'unknown',...integer(s?.level,1,5)?{level:s.level}:{}}));
      records.set(key,out);
    }
    return {schema:2,available,pets:[...records.values()],diagnostics:{received:raw.length,recognized:records.size,duplicates:duplicates.size,truncated:Math.max(0,raw.length-100),reasons},...typeof data?.now==='string'&&Number.isFinite(Date.parse(data.now))?{now:data.now}:{}};
  }
  const fmt=v=>new Intl.NumberFormat('hu-HU',{maximumFractionDigits:2}).format(v);
  const unknown='Ismeretlen – nem érkezett ellenőrizhető adat.';
  function skillDescription(key,rank,config,locale,format=fmt){
    const s=config?.skills?.[key],l=locale?.skills?.[key];
    if(!s||!l||!integer(rank,1,s.values.length))return null;
    const values={value:format(s.values[rank-1]*100),every:s.every,times:s.times};
    return l.desc.replace(/\{\{(\w+)\}\}/g,(_,k)=>values[k]??'ismeretlen');
  }
  function describe(instance,model,config=model.config,now=Date.now(),observed={}){
    instance={...instance,...Object.fromEntries(['petId','level','form','rarity','active','skills','signature'].filter(k=>observed[k]!==undefined).map(k=>[k,observed[k]]))};
    const locale=model.locale,species=config?.types.find(t=>t.id===instance?.petId),form=integer(instance?.form,1,5)?instance.form:null,level=integer(instance?.level,1,10000)?instance.level:null;
    const rarity=instance?.rarity??species?.rarity;
    const rank=integer(instance?.rank,0,10000)?Math.max(0,instance.rank-(instance.rankAt&&Date.parse(instance.rankAt)>now?1:0)):null;
    const active=instance?.active===true&&!(instance.hatchAt&&Date.parse(instance.hatchAt)>now),activation=instance?.active===undefined?'Aktív állapot: ismeretlen.':active?'Fő kísérő: a feltételek teljesülésekor érvényesülhet.':'Nem fő kísérő: az alábbi hatások csak aktiválás után érvényesülhetnek.';
    const sections=[],section=(title,items)=>sections.push({title,items});
    const bonus=species?Object.entries(species.perLevel)[0]:model.locale.bonus[observed.bonus?.key]?[observed.bonus.key,null]:null;
    const displayed=bonus&&observed.bonus?.key===bonus[0]&&finite(observed.bonus.percent)?observed.bonus:null;
    const calculated=bonus&&bonus[1]!==null&&form&&rank!==null?bonus[1]*(10*config.forms.passive[form-1]+config.rankBonusShare*rank):null;
    const bonusValue=displayed?displayed.percent/100:calculated,bonusSource=displayed?'dom':calculated!==null?'client-formula':'unavailable';
    const fill=(text,values)=>typeof text==='string'?text.replace(/\{\{(\w+)\}\}/g,(_,k)=>values[k]??'ismeretlen'):unknown;
    const bonusLabel=bonus?(locale.bonus[bonus[0]]??'Fajbónusz').split('{{value}}')[0].replace(/[+\s]+$/u,'').trim():'Fajbónusz';
    section('Fajbónusz',[bonusValue===null?bonusLabel+' – pontos érték nem elérhető':fill(locale.bonus[bonus[0]],{value:fmt(bonusValue*100)}),instance?.active===false?'Jelenleg nem érvényesül: nem fő kísérő.':'Az érvényesülés a fő kísérő állapotától és a szerver összegzésétől függ.',displayed?'Forrás: a játék ehhez a kísérősorhoz tartozó bónuszfelirata.':bonusValue===null?'Nincs elég megbízható saját adat a számításhoz.':'Forrás: ellenőrzött V3-kliensképlet, forma és rang alapján.',...(instance.fieldSources?.rank==='client-default'?['A kliens a kihagyott rangmezőt 0-ként kezeli.']:[])]);
    const traitId=instance?.trait??species?.trait,t=config?.traits[traitId];
    let traitText=unknown;
    if(t&&form&&level&&rank!==null&&finite(config.growth[rarity])){
      const factor=(config.forms.traitLevelScale.base+config.forms.traitLevelScale.perLevel*level)*(1+config.rankTraitBonus*rank)*config.growth[rarity];
      const round=v=>Math.round(v*1e4)/1e4;
      traitText=fill(locale.trait[traitId],{every:t.every?.[form-1],hits:t.hits,below:finite(t.belowHp)?fmt(t.belowHp*100):undefined,pct:fmt(round((t.mult??t.pct)?.[form-1]*factor)*100)});
    }
    section('Faji harci adottság (trait)',[locale.trait[traitId]?.split(':')[0]??'Ismeretlen harci adottság',observed.traitText??traitText]);
    const signature=instance?.signature??species?.signature;
    const skillText=(key,rank)=>skillDescription(key,rank,config,locale)??unknown;
    section('Veleszületett képesség (signature)',signature?[locale.skills[signature]?.name??signature,observed.signatureDescription??(form?skillText(signature,form):unknown)]:['Nincs külön, fajhoz tartozó signature; a faji harci adottság ettől még létezhet.']);
    section('Tanult képességek',Array.isArray(instance?.skills)?instance.skills.length?instance.skills.map(s=>(locale.skills[s.skillId]?.name??s.skillId)+' · '+(s.level??'?')+'. szint: '+skillText(s.skillId,s.level)):['A saját kísérőadat szerint nincs tanult képesség.']:[unknown]);
    section('Aktiváláskor érvényes hatások',[activation,'A harci és háttérvadászati képességek saját feltételei külön érvényesek.','Azonos signature és tanult skill: csak az erősebb szint számít.','Gyűjteményi könyvbónusz, harcerő és szerveres végösszeg: ismeretlen.']);
    const missing=['petId','level','form','rank','active','skills'].filter(k=>instance?.[k]===undefined);
    return {name:instance?.name??locale.types[instance?.petId]?.name??instance?.petId??'Ismeretlen kísérő',rarity:locale.rarity[rarity]??'Ismeretlen ritkaság',level,form,formName:locale.forms[form]??'Ismeretlen forma',active,bonusValue,bonusSource,missing,sections};
  }
  const validateConfig=c=>c?publicConfig({types:c.types,traits:c.traits,v3:{forms:c.forms,skills:c.skills,rarity:{growth:c.growth}},rankBonusShare:c.rankBonusShare,rules:{rankTraitBonus:c.rankTraitBonus}}):null;
  globalThis.StonestormPetDetails=Object.freeze({publicConfig,validateConfig,instanceId,roster,describe,skillDescription,validateShape});
})();
