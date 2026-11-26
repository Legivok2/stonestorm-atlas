/* A rehearsal engine, never a live API adapter. Only equip/unequip can be planned. */
(() => {
  'use strict';
  const M=globalThis.StonestormEquipment;
  const allowed=Object.freeze(['equip','unequip']);
  function bounded(task,signal,timeout){return new Promise((resolve,reject)=>{
    let settled=false,timer;const finish=(fn,value)=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);fn(value);},abort=()=>finish(reject,Error('A próba megszakítva; folyamatban lévő lépés eredménye ellenőrzést igényel.'));
    if(signal?.aborted){abort();return;}signal?.addEventListener('abort',abort,{once:true});if(timeout)timer=setTimeout(()=>finish(reject,Error('A művelet időkorlátja lejárt; nincs újrapróbálkozás.')),timeout);
    Promise.resolve().then(()=>{if(!settled)return task();}).then(value=>finish(resolve,value),error=>finish(reject,error));
  });}
  function assertOperations(operations){
    if(!Array.isArray(operations)||operations.length>16)throw Error('Érvénytelen műveletsor.');
    for(const op of operations){if(!allowed.includes(op?.kind)||!M.slots.includes(op.slot)||Object.keys(op).some(k=>!['kind','slot','itemId'].includes(k))||(op.kind==='equip'&&!M.key(op.itemId))||(op.kind==='unequip'&&Object.hasOwn(op,'itemId')))throw Error('Tiltott vagy ismeretlen tárgyművelet.');}
    return operations;
  }
  function plan(s,gear,c){
    const inventory=M.validateSnapshot(s,c);M.resolve(s,gear,c);const before=M.current(s),operations=[],changes=[];
    let free=inventory.free;
    const changed=M.slots.filter(slot=>before[slot]!==gear[slot]);
    // Filling an empty slot first may safely free a bag cell; replacements otherwise
    // require an empty cell. Atomic replacement has not been server-verified.
    changed.sort((a,b)=>Number(before[a]!==null)-Number(before[b]!==null));
    for(const slot of changed){changes.push({slot,before:before[slot],after:gear[slot]});if(before[slot]!==null){if(free<1)throw Error('Nincs szabad inventoryhely a biztonságos cseréhez.');operations.push({kind:'unequip',slot});free--;}if(gear[slot]!==null){operations.push({kind:'equip',slot,itemId:gear[slot]});free++;}}
    assertOperations(operations);return {owner:M.key(s.ownerId),fingerprint:M.fingerprint(s),gear:M.copy(gear),operations,changes};
  }
  function createMockAdapter(snapshot,c){
    let state=M.copy(snapshot);const calls=[];
    return {mode:'mock',calls,async read(){return M.copy(state);},async equip(itemId){calls.push({kind:'equip',itemId});const i=state.items.find(x=>M.key(x.id)===M.key(itemId));if(!i||i.equippedSlot!==null||state.items.some(x=>x.equippedSlot===i.slot))throw Error('Mock: felszerelés elutasítva.');i.equippedSlot=i.slot;i.invIndex=null;},async unequip(slot){calls.push({kind:'unequip',slot});const i=state.items.find(x=>x.equippedSlot===slot);if(!i)throw Error('Mock: üres slot.');const {capacity}=M.validateSnapshot(state,c),used=new Set(state.items.map(x=>x.invIndex)),index=Array.from({length:capacity},(_,n)=>n).find(n=>!used.has(n));if(index===undefined)throw Error('Mock: tele az inventory.');i.equippedSlot=null;i.invIndex=index;}};
  }
  function controller(){
    let busy=false;
    return {get busy(){return busy;},async run({adapter,preset,config,confirm,signal,timeoutMs=3000}){
      if(busy)throw Error('Már folyamatban van egy felszereléscsere-próba.');
      if(adapter?.mode!=='mock'||typeof adapter.read!=='function'||typeof adapter.equip!=='function'||typeof adapter.unequip!=='function')throw Error('Éles felszerelésváltás letiltva. Csak mock adapter engedélyezett.');
      if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>10000)throw Error('Érvénytelen műveleti időkorlát.');
      busy=true;let last=null,completed=[],attempted=[],preview=null,stateCertain=true;
      const check=()=>{if(signal?.aborted)throw Error('A próba megszakítva.');};
      try{
        check();last=await bounded(()=>adapter.read(),signal,timeoutMs);const target=M.presetGear(preset,last,config);preview=plan(last,target,config);check();
        if(typeof confirm!=='function'||!await bounded(()=>confirm(M.copy(preview)),signal,0))return {status:'cancelled',completed,attempted,state:last,stateCertain};
        check();const fresh=await bounded(()=>adapter.read(),signal,timeoutMs);if(M.fingerprint(fresh)!==preview.fingerprint)throw Error('Megerősítés közben megváltozott a karakter vagy inventory. Új előnézet szükséges.');
        const expected=M.current(last),immutable=s=>JSON.stringify(s.items.map(({equippedSlot,invIndex,...rest})=>rest).sort((a,b)=>M.key(a.id).localeCompare(M.key(b.id)))),identities=immutable(last),classId=last.classId,level=last.level,extraSlots=last.extraSlots;
        for(const op of assertOperations(preview.operations)){
          check();const now=await bounded(()=>adapter.read(),signal,timeoutMs);if(M.fingerprint(now)!==M.fingerprint(last))throw Error('Külső felszerelésváltozás vagy karakterváltás.');
          attempted.push(op);
          if(op.kind==='equip')await bounded(()=>adapter.equip(op.itemId),signal,timeoutMs);else await bounded(()=>adapter.unequip(op.slot),signal,timeoutMs);
          expected[op.slot]=op.kind==='equip'?op.itemId:null;
          last=await bounded(()=>adapter.read(),signal,timeoutMs);M.validateSnapshot(last,config);
          if(M.key(last.ownerId)!==preview.owner||last.classId!==classId||last.level!==level||last.extraSlots!==extraSlots||M.fingerprint(M.current(last))!==M.fingerprint(expected)||immutable(last)!==identities)throw Error('A tényleges állapot eltér a tervezett cserétől.');
          completed.push(op);check();
        }
        return {status:'completed',completed,attempted,state:last,stateCertain};
      }catch(error){if(attempted.length>completed.length)stateCertain=false;try{last=await bounded(()=>adapter.read(),null,timeoutMs);}catch{stateCertain=false;}return {status:'stopped',error:error.message,completed,attempted,state:last,stateCertain,preview};}
      finally{busy=false;}
    }};
  }
  globalThis.StonestormEquipmentSwitch=Object.freeze({allowed,assertOperations,plan,createMockAdapter,controller});
})();
