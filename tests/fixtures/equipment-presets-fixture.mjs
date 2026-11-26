import fs from 'node:fs';
import '../../addons/stonestorm-statcap-overlay/equipment-model.js';
export const api=JSON.parse(fs.readFileSync(new URL('../../snapshots/current/content.json',import.meta.url)));
export const M=globalThis.StonestormEquipment;
export function fixture(){
  const config=M.publicConfig(api);config.inventoryBase=30;
  const raw={id:'mock-character-A',name:'PRIVATE_HERO_NAME',accountId:'PRIVATE_ACCOUNT',level:60,classId:'warrior',extraSlots:0,items:[],derived:{maxHp:1000,def:100,xpBonus:0,nyangBonus:0},mods:{xpMult:1,nyangMult:1,dropMult:1.1,xpPaid:0,nyangPaid:0,dropPaid:0,hpMult:1.2,defMult:1.1},harcero:{full:250}};
  for(const slot of M.slots){const template=api.items.find(t=>t.slot===slot&&(t.classes===null||t.classes.includes(raw.classId)));raw.items.push({id:'worn-'+slot,templateId:template.id,slot,equippedSlot:slot,invIndex:null,level:template.level,classes:template.classes,plus:0,values:{...template.values},lines:[],flags:{setId:null,uniqueId:null,locked:true},polish:0});}
  function add(slot,id,lines=[],extra={}){const template=raw.items.find(x=>x.slot===slot);const row={...structuredClone(template),id,equippedSlot:null,invIndex:raw.items.filter(x=>x.invIndex!==null).length,lines,...extra};raw.items.push(row);return row;}
  function snapshot(){const s=M.captureCharacter(raw);const now=M.contributions(s.items.filter(x=>x.equippedSlot!==null),config);s.derived.xpBonus=now.total.xp;s.derived.nyangBonus=now.total.nyang;return s;}
  return {config,raw,add,snapshot};
}
