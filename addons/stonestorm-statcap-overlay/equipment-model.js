/* Portable, local-only model. No browser, network, game actions or persistent storage. */
(() => {
  'use strict';
  const slots=Object.freeze(['weapon','armor','helmet','shield','boots','bracelet','necklace','earrings']);
  const stats=Object.freeze(['maxHp','crit','vsAnimal','vsBandit','defence','attack','nyang','xp','evade','vsOrc','vsUndead','vsDesert','vsIce','vsFire','vsBoss','potionHeal','skillDamage','critDamage','lifesteal','damageTaken']);
  const valueKeys=['atkMin','atkMax','def','maxHp','crit','attack'];
  const finite=x=>typeof x==='number'&&Number.isFinite(x);
  const id=x=>typeof x==='string'&&x.length>0&&x.length<=160&&!/[\u0000-\u001f]/.test(x)||Number.isSafeInteger(x)&&x>0;
  const key=x=>{if(!id(x))throw Error('Érvénytelen egyedi azonosító.');return typeof x+':'+x;};
  const slot=x=>x==='earring'?'earrings':x;
  const copy=x=>JSON.parse(JSON.stringify(x));
  const fingerprint=x=>JSON.stringify(x);
  function fail(message){throw Error(message);}
  function lineValue(type,tier,level,spine){
    const scaled=spine.lines.scaled,base=scaled.base[type];let value;
    if(base){const exponent=scaled.exponent[type]??1,L=Math.max(1,level),ref=scaled.refLevel+scaled.offset;value=Math.max(scaled.minValue,Math.round(scaled.linearBelowRef?base[tier-1]*(L+scaled.offset)/ref*((Math.max(L,scaled.refLevel)+scaled.offset)/ref)**(exponent-1):base[tier-1]*((L+scaled.offset)/ref)**exponent));}
    else{let tiers;for(const band of spine.lines.percent)if(level>=band.fromLevel&&band.tiers[type])tiers=band.tiers[type];value=Math.round(tiers?.[tier-1]*1000)/1000;}
    if(!finite(value))fail('Nem igazolt szettbónusz: '+type);
    const scale=spine.lines.capScale?.[type];return scale===undefined?value:Math.round(value*scale*1e12)/1e12;
  }
  function publicConfig(c){
    if(typeof c?.version!=='string'||!Array.isArray(c.items)||!Array.isArray(c.families?.families)||typeof c.features?.fullSets!=='boolean'||!finite(c.reward?.cap)||!Number.isSafeInteger(c.limits?.inventorySize))fail('Hiányos felszereléskonfiguráció.');
    const templates=c.items.map(t=>({id:t.id,slot:slot(t.slot),level:t.level,classes:t.classes}));
    if(templates.some(t=>typeof t.id!=='string'||!slots.includes(t.slot)||!Number.isSafeInteger(t.level)||(t.classes!==null&&!Array.isArray(t.classes))))fail('Nem támogatott tárgysablon.');
    const sets=c.families.families.filter(f=>f.set).map(f=>{
      const rule=c.spine?.sets?.[f.id],bonuses=rule?rule[c.features.fullSets?'full':'classic'].map(b=>({pieces:b.pieces,stats:b.stats.map(s=>({stat:s.stat,value:lineValue(s.stat,s.tier,rule.familyLevel,c.spine)}))})):copy(f.set.bonuses);
      if(bonuses.some(b=>!Number.isSafeInteger(b.pieces)||b.pieces<1||b.stats.some(s=>!stats.includes(s.stat)||!finite(s.value)||s.value<0)))fail('Ismeretlen szettszabály.');
      return {id:f.set.id,slots:f.set.slots.map(slot),bonuses};
    });
    const uniques=c.families.families.filter(f=>f.unique).map(f=>({id:f.unique.id,slot:slot(f.unique.slot),effectKind:f.unique.effect?.kind}));
    if(uniques.some(u=>!['firstStrike','critHeal','stun','shell','cadence','thorns'].includes(u.effectKind)))fail('Nem igazolt egyedi tárgyhatás.');
    return {schema:1,gameVersion:c.version,inventoryBase:c.limits.inventorySize,inventoryStep:8,rewardCap:c.reward.cap-1,paidCap:.5,polish:copy(c.polish),templates,sets,uniques,lean:{version:1,plusMult:copy(c.lean?.itemRules?.plusMult??c.forge?.plusMult??[])},dropEquipmentSupported:false,combatSupported:false};
  }
  // Public client OD/bD/pD/Xv/Kn contract. Defaults apply ONLY to lean:1 and
  // ~:1 items. Missing IDs are never generated. Never mutate the API response.
  function leanValues(template,plus,mult,level=template.level){
    const values=Object.fromEntries(valueKeys.map(k=>[k,0])),round=x=>Math.round(x+1e-9);
    const scaled=(base,precision=1,step=1)=>{const at=p=>round(base*(mult[p]??1)*precision)/precision;let n=at(0);for(let p=1;p<=plus;p++){const next=at(p);n=round(next*step)>round(n*step)?next:(round(n*step)+1)/step;}return n;};
    switch(template.slot){case 'weapon':values.atkMin=scaled(4+2*level);values.atkMax=scaled(7+2.8*level);break;case 'armor':values.def=scaled(6+1.6*level);break;case 'helmet':values.def=scaled(3+.8*level);break;case 'shield':values.def=scaled(4+level);break;case 'boots':values.def=scaled(2+.6*level);break;case 'bracelet':values.maxHp=scaled(30+12*level);break;case 'necklace':values.crit=scaled(.01+.001*level,1e4,1e3);break;case 'earrings':values.attack=scaled(2+.5*level);break;}
    return values;
  }
  function normalizeCharacter(payload,c){
    const source=payload?.state&&typeof payload.state==='object'?payload.state:payload;
    if(!source||typeof source!=='object')return null;
    if(payload?.lean!==1)return source;
    const raw={...source,...source.mods?{mods:{xpPaid:0,nyangPaid:0,dropPaid:0,...source.mods}}:{}};
    if(!Object.hasOwn(source,'extraSlots'))raw.extraSlots=0;
    if(Array.isArray(source.items))raw.items=source.items.map(item=>{
      if(item?.['~']!==1)return item;
      const i={...item};for(const [k,v] of [['plus',0],['equippedSlot',null],['invIndex',null],['locked',false],['lines',[]]])if(!Object.hasOwn(i,k))i[k]=Array.isArray(v)?[]:v;
      if(!Object.hasOwn(i,'bonuses'))i.bonuses=copy(i.lines);
      const t=c?.templates.find(t=>t.id===i.templateId);
      if(t && c.lean?.version===1 && c.lean.plusMult.length>=10 && Number.isInteger(i.plus)&&i.plus>=0&&i.plus<=9){
        for(const k of ['slot','level','classes'])if(!Object.hasOwn(i,k))i[k]=copy(t[k]);
        if(!Object.hasOwn(i,'values'))i.values=leanValues(t,i.plus,c.lean.plusMult,finite(i.itemLevel)?i.itemLevel:t.level);
      }
      return i;
    });
    return raw;
  }
  function captureCharacter(payload,now=Date.now(),config){
    const raw=normalizeCharacter(payload,config);
    // Keep the actual instance ID, never derive one from template, position or name.
    if(!raw)return null;
    const safeText=x=>typeof x==='string'&&x.length<=160?x:null,safeNumber=x=>finite(x)?x:null;
    const items=(Array.isArray(raw.items)?raw.items:[]).slice(0,2000).map(i=>({id:id(i?.id)?i.id:null,templateId:safeText(i?.templateId),slot:slot(safeText(i?.slot)),locationKnown:!!i&&Object.hasOwn(i,'equippedSlot'),invIndexKnown:!!i&&Object.hasOwn(i,'invIndex'),equippedSlot:i?.equippedSlot===null?null:slot(safeText(i?.equippedSlot)),invIndex:i?.invIndex===null?null:safeNumber(i?.invIndex),level:safeNumber(i?.flags&&(i.flags.setId!==null||i.flags.uniqueId!==null)&&i.itemLevel!==undefined?i.itemLevel:i?.level),classes:i?.classes===null?null:Array.isArray(i?.classes)?i.classes.map(safeText):undefined,plus:safeNumber(i?.plus),values:Object.fromEntries(valueKeys.map(k=>[k,finite(i?.values?.[k])?i.values[k]:null])),lines:Array.isArray(i?.lines)?i.lines.map(l=>({type:safeText(l?.type),value:safeNumber(l?.value)})):null,bonuses:Array.isArray(i?.bonuses)?i.bonuses.map(l=>({type:safeText(l?.type),value:safeNumber(l?.value)})):null,polish:i?.polish===undefined?0:safeNumber(i.polish),setId:i?.flags?.setId==null?null:(safeText(i.flags.setId)??"!invalid-set"),uniqueId:i?.flags?.uniqueId==null?null:(safeText(i.flags.uniqueId)??"!invalid-unique"),locked:i?.locked===true||i?.flags?.locked===true,pending:i?.rerollPending!=null&&i.rerollPending!==false,restricted:i?.restrictions!=null&&Object.keys(i.restrictions).length>0}));
    return {schema:1,ownerId:id(raw.id)?raw.id:null,classId:safeText(raw.classId),level:safeNumber(raw.level),extraSlots:safeNumber(raw.extraSlots),observedAt:now,received:true,inventoryReceived:Array.isArray(raw.items),wireFormat:payload?.lean===1?'lean:1':'expanded',complete:Array.isArray(raw.items)&&raw.items.length<=2000,items,derived:Object.fromEntries(['maxHp','def','xpBonus','nyangBonus'].map(k=>[k,finite(raw.derived?.[k])?raw.derived[k]:null])),mods:Object.fromEntries(['xpMult','nyangMult','dropMult','xpPaid','nyangPaid','dropPaid','hpMult','defMult'].map(k=>[k,finite(raw.mods?.[k])?raw.mods[k]:null])),harcero:finite(raw.harcero?.full)?raw.harcero.full:null};
  }
  function validateIdentity(s){
    if(!id(s?.ownerId))fail('Hiányzik a karakterazonosító (state.id).');
    if(!s.complete||!Array.isArray(s.items))fail('Hiányzik vagy részleges az inventory (state.items).');
    const ids=new Set(),worn=new Set();
    for(const i of s.items){
      if(!i||typeof i!=='object')fail('Hibás tárgyrekord az inventoryban.');
      if(i.locationKnown===false)fail('Hiányzik a felszerelési hely (items[].equippedSlot).');
      if(id(i.id)){const k=key(i.id);if(ids.has(k))fail('Ütköző egyedi tárgyazonosító.');ids.add(k);}
      if(i.equippedSlot!==null){
        if(!slots.includes(i.equippedSlot))fail('Hiányzó vagy ismeretlen equippedSlot.');
        if(i.invIndexKnown===false)fail('Nem ismert a felszerelt tárgy inventoryhelye (invIndex).');
        if(!id(i.id))fail('Felszerelt tárgyból hiányzik az egyedi item.id.');
        if(typeof i.templateId!=='string'||!i.templateId)fail('Felszerelt tárgyból hiányzik a templateId.');
        if(i.slot!==i.equippedSlot||worn.has(i.equippedSlot)||i.invIndex!==null)fail('Ellentmondó felszerelési slot.');
        worn.add(i.equippedSlot);
      }
    }
    return {equipped:worn.size,uniqueIds:ids.size};
  }
  function validateSnapshot(s,c,{inventory=true}={}){
    validateIdentity(s);
    if(typeof s.classId!=='string'||!Number.isSafeInteger(s.level)||s.level<1||!finite(s.observedAt))fail('Hiányzó karakterszint vagy kaszt.');
    if(inventory&&(!Number.isSafeInteger(s.extraSlots)||s.extraSlots<0))fail('Nem ismert az inventory kapacitása (extraSlots).');
    const ids=new Set(),worn=new Set(),cells=new Set(),capacity=Number.isSafeInteger(s.extraSlots)&&s.extraSlots>=0?c.inventoryBase+c.inventoryStep*s.extraSlots:null;
    for(const i of s.items){
      const k=key(i.id);if(ids.has(k))fail('Ütköző egyedi tárgyazonosító.');ids.add(k);
      if(!slots.includes(i.slot)||!c.templates.some(t=>t.id===i.templateId&&t.slot===i.slot)||!Number.isSafeInteger(i.level)||i.level<1||!Number.isSafeInteger(i.plus)||i.plus<0||i.plus>9||(i.classes!==null&&(!Array.isArray(i.classes)||i.classes.some(x=>typeof x!=='string'))))fail('Bizonytalan tárgypéldány vagy követelmény.');
      if(i.equippedSlot!==null){if(i.equippedSlot!==i.slot||worn.has(i.slot)||i.invIndex!==null)fail('Ellentmondó felszerelési slot.');worn.add(i.slot);}
      else if(!Number.isSafeInteger(i.invIndex)||i.invIndex<0||(inventory&&i.invIndex>=capacity)||cells.has(i.invIndex))fail('Bizonytalan inventoryhely.');else cells.add(i.invIndex);
      const lines=linesFor(i,c);
      if(!i.values||valueKeys.some(k=>!finite(i.values[k])||i.values[k]<0)||!Array.isArray(lines)||lines.length>32||lines.some(l=>!stats.includes(l.type)||!finite(l.value)||l.value<0))fail('Hiányos vagy ismeretlen bónuszérték. Nem becsülünk tárgysorokat.');
      if(i.setId!==null&&!c.sets.some(x=>x.id===i.setId&&x.slots.includes(i.slot)))fail('Ismeretlen szetttagság.');
      if(i.uniqueId!==null&&!c.uniques.some(x=>x.id===i.uniqueId&&x.slot===i.slot))fail('Ismeretlen egyedi tárgyhatás.');
    }
    return {capacity,used:cells.size,free:capacity===null?null:capacity-cells.size};
  }
  function diagnostics(s,c,now=Date.now()){
    const errors={},missing=[];const items=Array.isArray(s?.items)?s.items.filter(i=>i&&typeof i==='object'):[];
    for(const [name,fn] of [['save',()=>validateIdentity(s)],['optimize',()=>{if(!c)fail('Hiányzó vagy nem igazolt felszerelésmodell.');validateSnapshot(s,c,{inventory:false});}]]){try{fn();if(!finite(s.observedAt)||now-s.observedAt>120000||s.observedAt>now+5000)fail('Elavult pillanatkép; karakteradatok újraolvasása szükséges.');}catch(e){errors[name]=e.message;}}
    if(!id(s?.ownerId))missing.push('state.id');if(!s?.complete)missing.push('state.items (teljes lista)');
    for(const k of ['level','classId'])if(s?.[k]===null||s?.[k]===undefined)missing.push('state.'+k);
    for(const k of ['id','templateId','slot','plus','level','equippedSlot'])if(items.some(i=>k==='equippedSlot'?i[k]!==null&&!slots.includes(i[k]):i[k]===null||i[k]===undefined))missing.push('items[].'+k);
    if(items.some(i=>i.locationKnown===false)&&!missing.includes('items[].equippedSlot'))missing.push('items[].equippedSlot');
    if(items.some(i=>i.invIndexKnown===false))missing.push('items[].invIndex');
    if(items.some(i=>!Array.isArray(i.classes)&&i.classes!==null))missing.push('items[].classes');
    if(c&&items.some(i=>!linesFor(i,c)))missing.push('items[].lines / bonuses');
    if(items.some(i=>valueKeys.some(k=>!finite(i.values?.[k]))))missing.push('items[].values');
    return {characterReceived:!!s,inventoryReceived:s?.inventoryReceived??!!s?.complete,items:items.length,equipped:items.filter(i=>slots.includes(i.equippedSlot)).length,withUniqueId:items.filter(i=>id(i.id)).length,recognizedSlots:new Set(items.filter(i=>slots.includes(i.equippedSlot)).map(i=>i.equippedSlot)).size,missing,canSave:!errors.save,canOptimize:!errors.optimize,saveReason:errors.save||'Minden mentéshez szükséges adat megérkezett.',optimizeReason:errors.optimize||'A tárgypéldányok és számítási mezők igazoltak.',equipReason:'Éles Felöltözés továbbra is tiltott: a kiszolgálóoldali csere és hibakezelés nincs élőben igazolva.',observedAt:finite(s?.observedAt)?s.observedAt:null};
  }
  function presetCurrent(s,label){validateIdentity(s);return {schema:1,owner:key(s.ownerId),name:name(label),savedAt:Date.now(),slots:Object.fromEntries(slots.map(sl=>{const i=s.items.find(i=>i.equippedSlot===sl);return [sl,i?{id:i.id,templateId:i.templateId}:null];}))};}
  function presetIdentity(p,s){
    validateIdentity(s);if(p?.schema!==1||p.owner!==key(s.ownerId)||!p.slots||Object.keys(p.slots).length!==8)fail('Hiányos vagy más karakterhez tartozó preset.');
    return Object.fromEntries(slots.map(sl=>{if(!Object.hasOwn(p.slots,sl))fail('Hiányos preset.');const wanted=p.slots[sl];if(wanted===null)return [sl,null];const i=s.items.find(i=>id(i.id)&&key(i.id)===key(wanted.id));if(!i||i.slot!==sl||i.templateId!==wanted.templateId)fail('A preset egyik saját tárgypéldánya nem azonosítható.');return [sl,i.id];}));
  }
  function current(s){return Object.fromEntries(slots.map(slot=>[slot,s.items.find(i=>i.equippedSlot===slot)?.id??null]));}
  function usable(i,s){return i.level<=s.level&&(i.classes===null||i.classes.includes(s.classId))&&!i.pending&&!i.restricted;}
  function linesFor(i,c){
    if(Array.isArray(i.lines))return i.lines;
    if(!Array.isArray(i.bonuses)||i.bonuses.some(l=>!stats.includes(l.type)||!finite(l.value)||l.value<0)||!Number.isSafeInteger(i.polish)||i.polish<0||!c.polish)return null;
    const steps=Math.max(0,Math.min(c.polish.steps,i.polish));
    return i.bonuses.map(l=>({type:l.type,value:l.value+c.polish.pctPerStep*steps*Math.min(l.value,c.polish.cap[l.type]??l.value)}));
  }
  function resolve(s,gear,c,{requirements=true}={}){
    validateSnapshot(s,c,{inventory:false});const selected=[],seen=new Set();
    for(const sl of slots){if(!Object.hasOwn(gear??{},sl))fail('Hiányos, nem nyolcslotos felszerelés.');const wanted=gear[sl];if(wanted===null)continue;const k=key(wanted),item=s.items.find(x=>key(x.id)===k);if(!item)fail('Egy mentett tárgypéldány már nincs meg.');if(seen.has(k)||item.slot!==sl)fail('Nem megfelelő vagy ismételt tárgyslot.');if(requirements&&!usable(item,s))fail('Szint-, kaszt- vagy tárgyműveleti korlátozás.');seen.add(k);selected.push(item);}
    if(Object.keys(gear).some(x=>!slots.includes(x)))fail('Ismeretlen felszerelési slot.');return selected;
  }
  function contributions(selected,c){
    const total={xp:0,nyang:0,drop:0,maxHp:0,defence:0,attack:0,atkMin:0,atkMax:0,crit:0},active=[];
    const add=(type,value)=>{total[type]=(total[type]??0)+value;};
    for(const i of selected){for(const [type,value] of Object.entries(i.values))add(type==='def'?'defence':type,value);for(const l of linesFor(i,c))add(l.type,l.value);}
    for(const set of c.sets){const count=selected.filter(i=>i.setId===set.id&&set.slots.includes(i.slot)).length;for(const bonus of set.bonuses)if(count>=bonus.pieces){active.push({id:set.id,pieces:bonus.pieces,count});for(const st of bonus.stats)add(st.stat,st.value);}}
    return {total,sets:active};
  }
  function assessment(s,c,candidate,before){
    const metrics={};
    for(const stat of ['xp','nyang','drop']){
      if(stat==='drop'){metrics.drop={raw:0,effective:finite(s.mods.dropMult)?Math.min(c.rewardCap,Math.max(0,s.mods.dropMult-(s.mods.dropPaid??0)-1))+Math.min(c.paidCap,s.mods.dropPaid??0):null,partial:!finite(s.mods.dropMult),equipmentSupported:false};continue;}
      const m=s.mods[stat+'Mult'],paid=s.mods[stat+'Paid'],observed=s.derived[stat+'Bonus'];
      const exact=finite(m)&&finite(paid)&&finite(observed)&&Math.abs(observed-before.total[stat])<.00001;
      metrics[stat]={raw:candidate.total[stat],effective:exact?Math.min(c.rewardCap,Math.max(0,m-paid-1+candidate.total[stat]))+Math.min(c.paidCap,Math.max(0,paid)):null,partial:!exact};
    }
    for(const [stat,mult,derived] of [['maxHp','hpMult','maxHp'],['defence','defMult','def']])metrics[stat]={value:finite(s.derived[derived])&&finite(s.mods[mult])?s.derived[derived]+(candidate.total[stat]-before.total[stat])*s.mods[mult]:null,partial:true,component:candidate.total[stat]};
    metrics.harcero={value:null,current:s.harcero,partial:true,reason:'A teljes, szetteket és minden harci hatást együtt kezelő Harcerő-modell nincs igazolva. Nem helyettesítjük támadáspontokkal.'};
    return {...candidate,metrics};
  }
  function evaluate(s,gear,c){return assessment(s,c,contributions(resolve(s,gear,c),c),contributions(resolve(s,current(s),c,{requirements:false}),c));}
  function name(value){if(typeof value!=='string')fail('Adj nevet a presetnek.');const clean=value.replace(/[\u0000-\u001f]/g,'').trim().slice(0,40);if(!clean)fail('Adj nevet a presetnek.');return clean;}
  function emptyPresets(owner){return {schema:1,owner:key(owner),presets:[null,null,null]};}
  function validateStore(store,owner){
    if(store?.schema!==1||store.owner!==key(owner)||!Array.isArray(store.presets)||store.presets.length!==3)fail('Másik karakterhez tartozó vagy sérült presetadat.');
    for(const p of store.presets)if(p!==null){
      if(p?.schema!==1||p.owner!==store.owner||typeof p.name!=='string'||!p.name.trim()||p.name.length>40||!p.slots||Object.keys(p.slots).length!==8||!finite(p.savedAt))fail('Sérült preset; az eredeti adatot nem írjuk felül.');
      const ids=new Set();for(const sl of slots){if(!Object.hasOwn(p.slots,sl))fail('Hiányos preset.');const i=p.slots[sl];if(i===null)continue;if(!id(i?.id)||typeof i.templateId!=='string'||ids.has(key(i.id)))fail('Bizonytalan mentett tárgypéldány.');ids.add(key(i.id));}
    }
    return store;
  }
  function preset(s,gear,c,label){const items=resolve(s,gear,c);return {schema:1,owner:key(s.ownerId),name:name(label),savedAt:Date.now(),slots:Object.fromEntries(slots.map(sl=>{const i=items.find(x=>x.slot===sl);return [sl,i?{id:i.id,templateId:i.templateId}:null];}))};}
  function presetGear(p,s,c){if(p?.schema!==1||p.owner!==key(s.ownerId))fail('A preset másik karakterhez tartozik.');const gear=Object.fromEntries(slots.map(sl=>[sl,p.slots?.[sl]?.id??null]));if(!p.slots||slots.some(sl=>!Object.hasOwn(p.slots,sl)))fail('Sérült preset.');const items=resolve(s,gear,c);for(const i of items)if(p.slots[i.slot].templateId!==i.templateId)fail('Megváltozott tárgyazonosság.');return gear;}
  function updatePreset(store,owner,index,value){validateStore(store,owner);if(!Number.isInteger(index)||index<0||index>2)fail('Csak három presethely használható.');if(value!==null&&(value?.schema!==1||value.owner!==key(owner)))fail('Idegen preset.');const next=copy(store);next.presets[index]=value===null?null:copy(value);return validateStore(next,owner);}
  function renamePreset(store,owner,index,label){if(!store.presets[index])fail('Előbb ments felszerelést.');return updatePreset(store,owner,index,{...store.presets[index],name:name(label)});}
  async function optimize(s,c,goal,{maxNodes=250000,signal,yieldControl=()=>new Promise(r=>setTimeout(r,0))}={}){
    if(!Number.isSafeInteger(maxNodes)||maxNodes<1||maxNodes>500000)fail('Érvénytelen keresési keret.');
    validateSnapshot(s,c,{inventory:false});s={...s,items:s.items.map(i=>({...i,lines:linesFor(i,c)}))};if(!['xp','nyang','drop','harcero'].includes(goal))fail('Ismeretlen célfüggvény.');if(goal==='harcero')fail('A teljes Harcerő-optimalizálás igazolt kombinációs modell nélkül letiltva.');
    const original=current(s),old=evaluate(s,original,c);if(goal==='drop')return {gear:original,evaluation:old,optimal:true,nodes:0,changed:0,reason:'A jelenlegi igazolt modellben nincs felszerelési zsákmánybónusz; nincs indokolt tárgycsere.'};
    const direct=i=>i?.lines.filter(l=>l.type===goal).reduce((v,l)=>v+l.value,0)??0;
    const lists=slots.map(sl=>{
      // Within a slot and identical set/unique membership, a lower reward value
      // cannot improve this objective. Keep the current instance separately for
      // capped ties; never discard a weaker item from a different set family.
      const groups=new Map();for(const i of s.items.filter(i=>i.slot===sl&&usable(i,s))){const group=JSON.stringify([i.setId,i.uniqueId]),prior=groups.get(group);if(!prior||direct(i)>direct(prior)||direct(i)===direct(prior)&&i.id===original[sl])groups.set(group,i);}
      const candidates=[...groups.values()],worn=s.items.find(i=>i.id===original[sl]);if(worn&&usable(worn,s)&&!candidates.some(i=>i.id===worn.id))candidates.push(worn);
      return [...candidates,null].sort((a,b)=>direct(b)-direct(a));
    });
    const score=v=>v.metrics[goal].effective??v.metrics[goal].raw;
    let best=null,bestScore=-Infinity,bestChanges=Infinity,nodes=0,complete=true;
    try{resolve(s,original,c);best={gear:original,evaluation:old};bestScore=score(old);bestChanges=0;}catch{/* Class change can invalidate the currently worn set. */}
    const gear={},selected=[],before=contributions(resolve(s,original,c,{requirements:false}),c),started=Date.now();
    // Optimistic bound includes every potentially reachable set threshold, not just item lines.
    function bound(depth){let raw=selected.reduce((n,i)=>n+i.lines.filter(l=>l.type===goal).reduce((v,l)=>v+l.value,0),0);for(let d=depth;d<8;d++)raw+=Math.max(...lists[d].map(i=>i?.lines.filter(l=>l.type===goal).reduce((v,l)=>v+l.value,0)??0));for(const set of c.sets){const have=selected.filter(i=>i.setId===set.id).length,possible=lists.slice(depth).filter(list=>list.some(i=>i?.setId===set.id)).length;for(const b of set.bonuses)if(have+possible>=b.pieces)raw+=b.stats.filter(x=>x.stat===goal).reduce((n,x)=>n+x.value,0);}if(old.metrics[goal].partial)return raw;const paid=s.mods[goal+'Paid'];return Math.min(c.rewardCap,Math.max(0,s.mods[goal+'Mult']-paid-1+raw))+Math.min(c.paidCap,Math.max(0,paid));}
    async function visit(depth){if(signal?.aborted){complete=false;return;}if(++nodes>maxNodes||Date.now()-started>5000){complete=false;return;}if(nodes%512===0)await yieldControl();if(signal?.aborted){complete=false;return;}const upper=bound(depth),minimumChanges=slots.slice(0,depth).filter(sl=>gear[sl]!==original[sl]).length;if(upper<bestScore-1e-12||Math.abs(upper-bestScore)<1e-12&&minimumChanges>=bestChanges)return;
      if(depth===8){const ev=assessment(s,c,contributions(selected,c),before),value=score(ev),changes=slots.filter(sl=>gear[sl]!==original[sl]).length;if(value>bestScore+1e-12||Math.abs(value-bestScore)<1e-12&&changes<bestChanges){best={gear:{...gear},evaluation:ev};bestScore=value;bestChanges=changes;}return;}
      for(const i of lists[depth]){gear[slots[depth]]=i?.id??null;if(i)selected.push(i);await visit(depth+1);if(i)selected.pop();if(!complete)return;}
    }
    await visit(0);if(signal?.aborted)fail('A keresés megszakítva.');if(!best)fail('Nem találtunk teljes, érvényes felszerelést.');return {...best,optimal:complete,nodes,changed:bestChanges,partial:best.evaluation.metrics[goal].partial,reason:complete?'Teljes kombinációs keresés.':'A keresési keret elfogyott; a legjobb eddigi jelölt, nem bizonyított maximum.'};
  }
  globalThis.StonestormEquipment=Object.freeze({slots,stats,key,slot,copy,fingerprint,publicConfig,leanValues,normalizeCharacter,captureCharacter,validateIdentity,diagnostics,presetCurrent,presetIdentity,validateSnapshot,current,usable,resolve,contributions,evaluate,preset,presetGear,emptyPresets,validateStore,updatePreset,renamePreset,optimize,lineValue,linesFor});
})();
