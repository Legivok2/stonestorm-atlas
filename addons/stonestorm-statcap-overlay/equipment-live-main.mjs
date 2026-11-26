/* Executed only by this extension's service worker through chrome.scripting.
 * Stateless: no page-callable write bridge, DOM event or postMessage command. */
export async function equipmentLiveMain(encoded){
  try{
    if(typeof encoded!=='string'||encoded.length>4000000)throw Error('Érvénytelen felszerelési kérés.');
    const command=JSON.parse(encoded);
    if(window.top!==window||location.origin!=='https://stonestorm.gg')throw Error('Nem támogatott játékoldal.');
    if(!['capabilities','read','step'].includes(command?.action)||Object.keys(command).some(k=>!['action','op','expected'].includes(k)))throw Error('Ismeretlen felszerelési kérés.');
    const path='/assets/index-B-KQL_s0.js';
    if(![...document.querySelectorAll('script[type="module"][src]')].some(n=>{const u=new URL(n.src,location.href);return u.origin===location.origin&&u.pathname===path&&!u.search&&!u.hash;}))throw Error('A játék ellenőrzött kliensmodulja nincs betöltve.');
    const client=await import(location.origin+path),source=fn=>typeof fn==='function'?Function.prototype.toString.call(fn):'';
    if(source(client.X)!=='()=>Wt("/api/character")'||source(client.b3)!=='e=>yt("/api/inventory/equip",{itemId:e})'||source(client.dA)!=='e=>yt("/api/inventory/unequip",{slot:e})'||source(client.by)!=='()=>S_')throw Error('A játék felszerelési kliensszerződése megváltozott.');
    const M=globalThis.StonestormEquipment,L=globalThis.StonestormEquipmentLiveModel,c=globalThis.STONESTORM_EQUIPMENT_DATA?.config;
    const store=client.a?.getState?.();
    if(!M||!L||!c||store?.phase!=='ready'||!store.state||store.content?.version!==c.gameVersion)throw Error('A karakter vagy a játékmodell még nem áll készen.');
    const setter='setState(r,c=Date.now()){eE(r==null?void 0:r.petArt),e({state:UE(r,l().launch),phase:"ready",syncedAt:c})}';
    if(source(store.setState)!==setter)throw Error('A játék állapotfrissítője nem igazolt.');
    const project=state=>M.captureCharacter(state,Date.now(),c);
    if(command.action==='capabilities')return {ok:true,available:true,busy:client.by()!==0,gameVersion:c.gameVersion,snapshot:project(store.state)};
    const ensureIdle=()=>{if(client.by()!==0)throw Error('A játékban másik művelet van folyamatban. Várd meg a befejezését.');};
    async function read(){ensureIdle();const response=await client.X(),state=response?.state,snapshot=project(state);L.validate(snapshot,c);if(M.key(snapshot.ownerId)!==M.key(client.a.getState().state?.id))throw Error('Karakterváltás történt.');client.a.getState().setState(state);return snapshot;}
    const before=await read();if(command.action==='read')return {ok:true,snapshot:before};
    const op=command.op;
    if(!op||Object.keys(op).some(k=>!['kind','slot','itemId'].includes(k))||!['equip','unequip'].includes(op.kind)||!M.slots.includes(op.slot))throw Error('Tiltott tárgyművelet.');
    if(!command.expected||!L.unchanged(before,command.expected))throw Error('A szerverállapot megváltozott a következő lépés előtt.'+(command.expected?' Eltérő mezők: '+L.difference(before,command.expected).join(', '):''));
    const item=before.items.find(i=>M.key(i.id)===M.key(op.itemId));
    if(!item||item.slot!==op.slot)throw Error('A konkrét tárgypéldány vagy slot nem azonosítható.');
    if(op.kind==='equip'&&(item.equippedSlot!==null||before.items.some(i=>i.equippedSlot===op.slot)||!M.usable(item,before)))throw Error('A felszerelési feltételek nem teljesülnek.');
    if(op.kind==='unequip'&&(item.equippedSlot!==op.slot||L.validate(before,c).free<1))throw Error('Nincs megfelelő levételi állapot vagy szabad inventoryhely.');
    ensureIdle();
    // These are the exact exports used by the original ItemSheet, not custom HTTP calls.
    const response=op.kind==='equip'?await client.b3(op.itemId):await client.dA(op.slot);
    const snapshot=project(response?.state);L.verify(before,snapshot,op,c);client.a.getState().setState(response.state);
    return {ok:true,snapshot};
  }catch(error){return {ok:false,error:typeof error?.message==='string'&&/^(Nem |Ismeretlen |A játék|A karakter|A szerver|A konkrét|A felszerelési|A tárgy|Nincs |Karakterváltás|Tiltott |Hiány|Friss |Hibás |Ellentmondó |Ütköző |Egy |Megváltozott |Másik |Érvénytelen )/.test(error.message)?error.message.slice(0,220):'A játék nem igazolta vissza a felszerelési műveletet. A csere leállt.'};}
}
