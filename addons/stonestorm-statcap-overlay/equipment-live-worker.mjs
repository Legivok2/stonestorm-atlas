/* Private MV3 broker. Own-extension, top-frame messages only; no arbitrary
 * endpoint/operation accepts. Presets are loaded from extension storage here. */
import './equipment-model.js';import './equipment-data.js';import './equipment-storage.js';import './equipment-live-model.js';
import {equipmentLiveMain} from './equipment-live-main.mjs';
export function createEquipmentWorker(api){
  const M=globalThis.StonestormEquipment,L=globalThis.StonestormEquipmentLiveModel,S=globalThis.StonestormEquipmentStorage,c=globalThis.STONESTORM_EQUIPMENT_DATA.config,JOURNAL='ssaEquipmentLive.pending.v1';
  let active=null,recovery=null;
  const validSender=s=>s?.id===api.runtime.id&&s.frameId===0&&Number.isSafeInteger(s.tab?.id)&&(()=>{try{return new URL(s.url).origin==='https://stonestorm.gg';}catch{return false;}})();
  const journal=async()=>((await api.storage.session.get(JOURNAL))[JOURNAL]??null);
  const saveJournal=async tx=>api.storage.session.set({[JOURNAL]:{id:tx.id,tabId:tx.tabId,documentId:tx.documentId,phase:tx.phase,at:Date.now()}});
  const clearJournal=async()=>api.storage.session.remove(JOURNAL);
  // A JSON string preserves explicit null slots through the scripting argument
  // converter. Never reinterpret a missing field as an intentionally empty slot.
  async function main(tabId,documentId,command){const rows=await api.scripting.executeScript({target:documentId?{tabId,documentIds:[documentId]}:{tabId,frameIds:[0]},world:'MAIN',func:equipmentLiveMain,args:[JSON.stringify(command)]});const row=rows?.[0];if(!row?.result?.ok)throw Error(row?.result?.error||'A játékoldali művelet megszakadt. Újraolvasás szükséges.');if(!row.documentId)throw Error('A játékdokumentum nem azonosítható.');return {...row.result,documentId:row.documentId};}
  const sendProgress=async(tx,progress)=>{try{await api.tabs.sendMessage(tx.tabId,{type:'ssa-equipment-live-progress',id:tx.id,...progress},{documentId:tx.documentId});}catch{tx.cancelled=true;}};
  async function command(message,sender){
    if(!validSender(sender)||message?.type!=='ssa-equipment-live')return null;
    if(!['capabilities','prepare','execute','cancel','recover','recover-confirm'].includes(message.action)||Object.keys(message).some(k=>!['type','action','index','id'].includes(k)))return {ok:false,error:'Ismeretlen vagy tiltott felszerelési kérés.'};
    let executing=null,preparedHere=null;
    try{
      if(active?.phase==='prepared'&&Date.now()>active.expires){active=null;await clearJournal();}
      if(message.action==='capabilities'){
        if(active)return {ok:true,available:false,reason:'Felszerelésváltás vagy megerősítés van folyamatban.'};
        const pending=await journal();if(pending&&!active&&pending.phase==='prepared')await clearJournal();
        else if(pending&&!active)return {ok:true,available:false,recoveryRequired:true,reason:'Egy korábbi felszerelési művelet eredménye nem biztos. Előbb ellenőrizd az aktuális állapotot.'};
        const result=await main(sender.tab.id,sender.documentId,{action:'capabilities'});return {ok:true,available:!result.busy,reason:result.busy?'A játékban művelet van folyamatban.':'A játék eredeti fel-/levételi mechanizmusa igazolt.',snapshot:result.snapshot};
      }
      if(message.action==='recover'){
        if(active)throw Error('Még folyamatban van egy felszerelésváltás.');
        const result=await main(sender.tab.id,sender.documentId,{action:'read'});recovery={id:crypto.randomUUID(),tabId:sender.tab.id,documentId:result.documentId,state:result.snapshot,expires:Date.now()+120000};return {ok:true,recoveryId:recovery.id,snapshot:result.snapshot};
      }
      if(message.action==='recover-confirm'){
        if(active||!recovery||recovery.id!==message.id||recovery.tabId!==sender.tab.id||recovery.documentId!==sender.documentId||Date.now()>recovery.expires)throw Error('Az állapotellenőrzés lejárt. Olvasd újra a karaktert.');
        const result=await main(sender.tab.id,recovery.documentId,{action:'read'});if(!L.unchanged(recovery.state,result.snapshot))throw Error('Az ellenőrzés közben megváltozott a felszerelés.');await clearJournal();recovery=null;return {ok:true,snapshot:result.snapshot};
      }
      if(message.action==='prepare'){
        if(!Number.isInteger(message.index)||message.index<0||message.index>2)throw Error('Csak a három mentett preset alkalmazható.');
        if(active)throw Error('Már folyamatban van egy felszerelésváltás vagy megerősítés.');
        const pending=await journal();if(pending)throw Error('A korábbi csere kimenetelét előbb újra kell ellenőrizni.');
        const result=await main(sender.tab.id,sender.documentId,{action:'read'}),s=result.snapshot,store=await S.load(s.ownerId),preset=store.presets[message.index];
        if(!preset)throw Error('Ebben a presethelyben nincs mentett felszerelés.');
        const prepared=L.plan(s,preset,c);if(active)throw Error('Közben másik felszerelésváltás indult.');
        active={id:crypto.randomUUID(),index:message.index,tabId:sender.tab.id,documentId:result.documentId,preset:M.copy(preset),initial:s,prepared,expires:Date.now()+120000,phase:'prepared',cancelled:false};preparedHere=active;await saveJournal(active);
        return {ok:true,id:active.id,plan:prepared,snapshot:s};
      }
      const tx=active;
      if(!tx||message.id!==tx.id||tx.tabId!==sender.tab.id||tx.documentId!==sender.documentId)throw Error('A felszerelésváltás engedélye hiányzik vagy lejárt.');
      if(message.action==='cancel'){
        tx.cancelled=true;if(tx.phase==='prepared'){active=null;await clearJournal();}return {ok:true,cancelRequested:true};
      }
      if(tx.phase!=='prepared'||tx.cancelled)throw Error('A felszerelésváltás már elindult vagy megszakadt.');
      executing=tx;tx.phase='running';await saveJournal(tx);const controller=L.controller();
      const result=await controller.run({initial:tx.initial,prepared:tx.prepared,preset:tx.preset,config:c,cancelled:()=>tx.cancelled,
        read:async()=>{const response=await main(tx.tabId,tx.documentId,{action:'read'});tx.lastRead=response.snapshot;return response.snapshot;},
        perform:async op=>{const response=await main(tx.tabId,tx.documentId,{action:'step',op,expected:tx.lastRead??tx.initial});return response.snapshot;},
        beforeWrite:async()=>{tx.phase='inflight';await saveJournal(tx);},
        afterWrite:async()=>{tx.phase='running';await saveJournal(tx);},
        progress:progress=>sendProgress(tx,{phase:'running',...progress})
      });
      // The final read snapshot is the next step's precondition, never a local simulation.
      if(result.uncertain){tx.phase='uncertain';await saveJournal(tx);}else await clearJournal();
      if(active===tx)active=null;
      return {ok:true,...result,recoveryRequired:result.uncertain};
    }catch(error){
      if(executing){executing.cancelled=true;executing.phase='uncertain';try{await saveJournal(executing);}catch{}if(active===executing)active=null;}
      else if(preparedHere&&active===preparedHere){active=null;try{await clearJournal();}catch{}}
      return {ok:false,error:error.message?.slice(0,240)||'A felszerelésváltás nem folytatható.'};
    }
  }
  return {command,validSender};
}
if(typeof chrome!=='undefined'&&chrome.runtime?.onMessage){
  const worker=createEquipmentWorker(chrome);
  chrome.runtime.onMessage.addListener((message,sender,reply)=>{if(message?.type!=='ssa-equipment-live')return false;if(!worker.validSender(sender))return false;worker.command(message,sender).then(reply,()=>reply({ok:false,error:'A felszerelésváltás leállt; újraolvasás szükséges.'}));return true;});
}
