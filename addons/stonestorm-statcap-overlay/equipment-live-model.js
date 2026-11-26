/* Safety and planning only. No DOM, HTTP, storage or game operation dispatcher. */
(() => {
  'use strict';
  const M=globalThis.StonestormEquipment,slots=M.slots;
  const fail=text=>{throw Error(text);};
  const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().filter(key=>value[key]!==undefined).map(key=>[key,canonical(value[key])])):value;
  const same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
  function validate(s,c,{fresh=true}={}){
    M.validateIdentity(s);
    if(!c||!Number.isSafeInteger(c.inventoryBase)||c.inventoryBase<1||c.inventoryStep!==8)fail('Nem igazolt inventorykapacitás.');
    if(!Number.isSafeInteger(s.level)||s.level<1||typeof s.classId!=='string'||!s.classId)fail('Hiányzik a karakterszint vagy kaszt.');
    if(fresh&&(!Number.isFinite(s.observedAt)||Date.now()-s.observedAt>120000||s.observedAt>Date.now()+5000))fail('Friss karakter- és inventoryolvasás szükséges.');
    if(!Number.isSafeInteger(s.extraSlots)||s.extraSlots<0)fail('Az inventory férőhelye nem ismert.');
    const capacity=c.inventoryBase+c.inventoryStep*s.extraSlots,cells=new Set(),ids=new Set();
    if(!Number.isSafeInteger(capacity)||capacity>10000)fail('Érvénytelen inventorykapacitás.');
    for(const item of s.items){
      let id;try{id=M.key(item.id);}catch{fail('Egy inventorytárgy egyedi azonosítója hiányzik vagy bizonytalan.');}
      if(ids.has(id))fail('Ütköző egyedi tárgypéldány-azonosító.');ids.add(id);
      if(!slots.includes(item.slot)||!c.templates.some(t=>t.id===item.templateId&&t.slot===item.slot))fail('Ismeretlen sablon vagy felszerelési slot.');
      if(!Number.isSafeInteger(item.level)||item.level<1||item.classes!==null&&(!Array.isArray(item.classes)||item.classes.some(x=>typeof x!=='string')))fail('Nem ismert tárgyszint- vagy kasztkövetelmény.');
      if(item.locationKnown===false||item.invIndexKnown===false)fail('A tárgy inventory-/felszerelési helye nem igazolt.');
      if(item.equippedSlot===null){if(!Number.isSafeInteger(item.invIndex)||item.invIndex<0||item.invIndex>=capacity||cells.has(item.invIndex))fail('Hibás vagy ismételt inventoryhely.');cells.add(item.invIndex);}
      else if(item.slot!==item.equippedSlot||item.invIndex!==null)fail('Ellentmondó felszerelési hely.');
    }
    return {capacity,used:cells.size,free:capacity-cells.size};
  }
  function inspect(preset,s,c){
    const rows=slots.map(slot=>{const saved=preset?.slots?.[slot],current=s?.items?.find(i=>i.equippedSlot===slot)??null;let wanted=null,error='';
      if(saved===undefined)error='A slot hiányzik a mentésből.';
      else if(saved!==null){try{const id=M.key(saved.id);wanted=s?.items?.find(i=>{try{return M.key(i.id)===id;}catch{return false;}})??null;if(!wanted)error='A mentett tárgypéldány hiányzik.';else if(wanted.templateId!==saved.templateId)error='A tárgypéldány sablonja megváltozott.';else if(wanted.slot!==slot)error='A tárgy más felszerelési slothoz tartozik.';else if(!M.usable(wanted,s))error='Szint-, kaszt- vagy függő tárgyműveleti korlátozás.';}catch{error='Bizonytalan mentett egyedi azonosító.';}}
      return {slot,saved:saved??null,current:current?.id??null,target:wanted?.id??null,error,changed:current?.id!==(wanted?.id??undefined)};
    });
    return {rows,savedCount:rows.filter(r=>r.saved!==null).length,wornCount:s?.items?.filter(i=>slots.includes(i.equippedSlot)).length??0,errors:rows.filter(r=>r.error).map(r=>({slot:r.slot,error:r.error}))};
  }
  function plan(s,preset,c){
    const inventory=validate(s,c);M.validateStore({schema:1,owner:M.key(s.ownerId),presets:[preset,null,null]},s.ownerId);
    const detail=inspect(preset,s,c);if(detail.errors.length)fail(detail.errors[0].slot+': '+detail.errors[0].error);
    const target=M.presetIdentity(preset,s),before=M.current(s),changes=slots.filter(slot=>before[slot]!==target[slot]).map(slot=>({slot,before:before[slot],after:target[slot]})),operations=[];
    let free=inventory.free;
    for(const change of [...changes].sort((a,b)=>Number(a.before!==null)-Number(b.before!==null))){
      if(change.before!==null){if(free<1)fail('Nincs elegendő szabad inventoryhely a biztonságos fel-/levételhez.');operations.push({kind:'unequip',slot:change.slot,itemId:change.before});free--;}
      if(change.after!==null){operations.push({kind:'equip',slot:change.slot,itemId:change.after});free++;}
    }
    if(operations.length>16)fail('Túl hosszú felszerelési műveletsor.');
    return {name:preset.name,owner:M.key(s.ownerId),target,changes,operations,inventory,detail,fingerprint:fingerprint(s)};
  }
  function fingerprint(s){return stable(s);}
  // Numerical derived totals and observation timestamps change legitimately after equip.
  function stable(s){return JSON.stringify(canonical({owner:M.key(s.ownerId),level:s.level,classId:s.classId,extraSlots:s.extraSlots,items:[...s.items].sort((a,b)=>M.key(a.id).localeCompare(M.key(b.id)))}));}
  function unchanged(a,b){return stable(a)===stable(b);}
  function difference(a,b){const left=JSON.parse(stable(a)),right=JSON.parse(stable(b)),paths=[];function visit(x,y,path){if(paths.length>=4||same(x,y))return;if(x&&y&&typeof x==='object'&&typeof y==='object'){for(const k of new Set([...Object.keys(x),...Object.keys(y)]))visit(x[k],y[k],path+'.'+k);}else paths.push(path+' ('+(x===null?'null':typeof x)+' / '+(y===null?'null':typeof y)+')');}visit(left,right,'state');return paths;}
  function verify(before,after,op,c){
    validate(after,c);if(!['equip','unequip'].includes(op?.kind)||!slots.includes(op.slot))fail('Tiltott művelet.');
    if(M.key(before.ownerId)!==M.key(after.ownerId)||before.level!==after.level||before.classId!==after.classId||before.extraSlots!==after.extraSlots)fail('Karakterváltás vagy megváltozott követelmények.');
    const expected=M.current(before);expected[op.slot]=op.kind==='equip'?op.itemId:null;if(!same(M.current(after),expected))fail('A szerver által visszaigazolt felszerelés eltér a tervtől.');
    if(before.items.length!==after.items.length)fail('A birtokolt tárgylista megváltozott.');
    for(const original of before.items){const next=after.items.find(i=>M.key(i.id)===M.key(original.id));if(!next)fail('Egy tárgypéldány eltűnt a szerverválaszból.');const moving=M.key(original.id)===M.key(op.itemId),strip=i=>Object.fromEntries(Object.entries(i).filter(([k])=>!['equippedSlot','invIndex'].includes(k)));if(!same(strip(original),strip(next)))fail('Megváltozott tárgyazonosság vagy tárgyadat.');if(!moving&&(next.equippedSlot!==original.equippedSlot||next.invIndex!==original.invIndex))fail('Másik tárgy helye is megváltozott.');}
    const moved=after.items.find(i=>M.key(i.id)===M.key(op.itemId));if(!moved||(op.kind==='equip'?(moved.equippedSlot!==op.slot||moved.invIndex!==null):(moved.equippedSlot!==null||!Number.isSafeInteger(moved.invIndex))))fail('A kért tárgypéldány helye nincs visszaigazolva.');
    return after;
  }
  function controller(){let busy=false;return {get busy(){return busy;},async run({initial,prepared,preset,config,read,perform,cancelled=()=>false,progress=()=>{},beforeWrite=async()=>{},afterWrite=async()=>{}}){
    if(busy)fail('Már folyamatban van egy felszerelésváltás.');busy=true;const completed=[],attempted=[];let last=initial,uncertain=false;
    const check=()=>{if(cancelled())fail('A felszerelésváltás megszakítva.');};
    try{
      check();const fresh=await read();check();if(!unchanged(initial,fresh))fail('Megerősítés közben megváltozott a karakter vagy inventory. Készíts új tervet.');last=fresh;
      const verified=plan(last,preset,config);if(!same(verified.operations,prepared.operations)||!same(verified.target,prepared.target))fail('Megváltozott a felszereléscsere terve.');
      for(const op of prepared.operations){
        check();const now=await read();check();if(!unchanged(last,now))fail('Külső tárgy- vagy felszerelésváltozás. A csere leállt.');last=now;
        if(!['equip','unequip'].includes(op.kind))fail('Tiltott művelet.');
        await beforeWrite(op);check();attempted.push(op);uncertain=true;
        const acknowledged=await perform(op);verify(last,acknowledged,op,config);
        const server=await read();verify(last,server,op,config);if(!unchanged(acknowledged,server))fail('A műveleti válasz és az újraolvasott szerverállapot eltér.');
        last=server;completed.push(op);uncertain=false;await afterWrite(op);await progress({completed:completed.length,total:prepared.operations.length,verifiedSlots:slots.filter(s=>M.current(last)[s]===prepared.target[s]).length});check();
      }
      if(!same(M.current(last),prepared.target))fail('A teljes mentett felszerelés nincs visszaigazolva.');
      return {status:'completed',completed,attempted,state:last,uncertain:false};
    }catch(error){return {status:'stopped',error:error.message,completed,attempted,state:last,uncertain};}
    finally{busy=false;}
  }};}
  globalThis.StonestormEquipmentLiveModel=Object.freeze({validate,inspect,plan,verify,unchanged,difference,controller,fingerprint});
})();
