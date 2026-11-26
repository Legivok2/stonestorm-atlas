/* Minimal projections for the existing passive capture bridge. No requests. */
(() => {
  'use strict';
  const M=globalThis.StonestormEquipment;
  let config=globalThis.STONESTORM_EQUIPMENT_DATA?.config;
  globalThis.StonestormEquipmentCapture=Object.freeze({
    character:raw=>{try{return M.captureCharacter(raw,Date.now(),config);}catch{return null;}},
    content:raw=>{try{config=M.publicConfig(raw);return {ok:true,config};}catch{return {ok:false,error:'Nem igazolt felszereléskonfiguráció.'};}}
  });
})();
