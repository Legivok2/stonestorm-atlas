/* Chrome-specific adapter; the model and rehearsal engine do not depend on it. */
(() => {
  'use strict';
  const M=globalThis.StonestormEquipment,queues=new Map();
  const read=keys=>new Promise((resolve,reject)=>{try{chrome.storage.local.get(keys,r=>chrome.runtime?.lastError?reject(Error('A helyi preset nem olvasható.')):resolve(r));}catch{reject(Error('A helyi tárhely nem érhető el.'));}});
  const write=values=>new Promise((resolve,reject)=>{try{chrome.storage.local.set(values,()=>chrome.runtime?.lastError?reject(Error('A preset mentése sikertelen.')):resolve());}catch{reject(Error('A helyi tárhely nem érhető el.'));}});
  async function storageKey(owner){const data=new TextEncoder().encode('stonestorm-equipment-v1\n'+M.key(owner));return 'ssaEquipmentPresets.v1.'+[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(x=>x.toString(16).padStart(2,'0')).join('');}
  async function readStore(key,owner){const values=await read([key,key+'.0',key+'.1',key+'.2']),store=values[key]===undefined?M.emptyPresets(owner):M.copy(M.validateStore(values[key],owner));for(let i=0;i<3;i++)if(Object.hasOwn(values,key+'.'+i))store.presets[i]=values[key+'.'+i];return M.validateStore(store,owner);}
  async function load(owner){return readStore(await storageKey(owner),owner);}
  async function change(owner,mutate){
    const key=await storageKey(owner),prior=queues.get(key)??Promise.resolve();
    const next=prior.catch(()=>{}).then(async()=>{const store=await readStore(key,owner),result=mutate(M.copy(store));M.validateStore(result,owner);const changed={};for(let i=0;i<3;i++)if(JSON.stringify(store.presets[i])!==JSON.stringify(result.presets[i]))changed[key+'.'+i]=result.presets[i];if(Object.keys(changed).length)await write(changed);return result;});
    queues.set(key,next);try{return await next;}finally{if(queues.get(key)===next)queues.delete(key);}
  }
  globalThis.StonestormEquipmentStorage=Object.freeze({storageKey,load,change});
})();
