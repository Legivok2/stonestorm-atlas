import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import '../addons/stonestorm-statcap-overlay/equipment-model.js';
export function buildEquipmentAssets(root){
  const snapshot=fs.readFileSync(path.join(root,'snapshots/current/content.json')),content=JSON.parse(snapshot),atlas=JSON.parse(fs.readFileSync(path.join(root,'data/atlas.json')));
  const config=globalThis.StonestormEquipment.publicConfig(content);
  const publicIds=new Set(config.templates.map(t=>t.id));
  const data={schema:1,config,labels:Object.fromEntries(atlas.items.filter(i=>publicIds.has(i.id)).map(i=>[i.id,i.name])),source:{url:'https://stonestorm.gg/api/content',sha256:crypto.createHash('sha256').update(snapshot).digest('hex'),gameVersion:content.version,clientReader:{path:'/assets/index-C8sNneJf.js',characterExport:'X',sha256:'32f9df0ddb2cb589e0f1d0462bdb7753ce6ea52ea44ad37689496e7806958901'}}};
  fs.writeFileSync(path.join(root,'addons/stonestorm-statcap-overlay/equipment-data.js'),'/* Generated public templates and rules only. No character or inventory data. */\nglobalThis.STONESTORM_EQUIPMENT_DATA = '+JSON.stringify(data).replaceAll('<','\\u003c')+';\n');
  return data;
}
