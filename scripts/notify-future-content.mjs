import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {categoryNames} from './future-content-analyzers.mjs';
export function queueNotifications(state,prior={schema:1,pending:[],delivered:[]}){
  const next=structuredClone(prior),known=new Set([...next.pending.map(x=>x.id),...next.delivered.map(x=>x.id)]);
  for(const event of state.notificationEvents??[])if(!known.has(event.id)){next.pending.push(event);known.add(event.id);}
  return next;
}
export async function deliverNotifications({root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),webhook=process.env.DISCORD_WEBHOOK_URL,fetcher=fetch,now=new Date().toISOString()}={}){
  if(!webhook)return {enabled:false,sent:0};
  let url;try{url=new URL(webhook);}catch{throw Error('Invalid Discord webhook configuration');}
  if(url.protocol!=='https:'||!['discord.com','discordapp.com'].includes(url.hostname)||url.username||url.password||url.search||url.hash||!/^\/api\/webhooks\/\d+\/[\w-]+$/.test(url.pathname))throw Error('Invalid Discord webhook configuration');
  const file=path.join(root,'data/future-notifications.json');if(!fs.existsSync(file))return {enabled:true,sent:0};
  const state=JSON.parse(fs.readFileSync(file,'utf8')),delivered=new Set(state.delivered.map(x=>x.id)),events=state.pending.filter(x=>!delivered.has(x.id));
  if(!events.length)return {enabled:true,sent:0};
  const statuses={prepared:'előkészített',announced:'hivatalosan bejelentett',active:'aktív',uncertain:'bizonytalan',removed:'eltávolított'},batch=[];
  const footer='\nhttps://legivok2.github.io/stonestorm-atlas/#atlas/upcoming';
  let content='Stonestorm Atlas – fontos nyilvános megfigyelések\n';
  for(const event of events.slice(0,8)){
    const line='• '+String(event.nameHu).slice(0,70)+' · '+(categoryNames[event.category]??event.category)+' · '+String(event.key).slice(0,48)+' · '+(statuses[event.status]??event.status)+' · '+String(event.gameVersion).slice(0,40)+'\nForrás: '+String(event.source).slice(0,160)+'\n';
    if(content.length+line.length+footer.length>1900)break;
    content+=line;batch.push(event);
  }
  content+=footer;
  let response;try{response=await fetcher(url.href,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({allowed_mentions:{parse:[]},content}),redirect:'error',signal:AbortSignal.timeout(10000)});}catch{throw Error('Discord delivery unavailable; events remain pending');}
  if(!response.ok)throw Error('Discord notification failed: HTTP '+response.status);
  state.delivered.push(...batch.map(x=>({id:x.id,deliveredAt:now})));const sent=new Set(batch.map(x=>x.id));state.pending=state.pending.filter(x=>!sent.has(x.id));
  fs.writeFileSync(file+'.tmp',JSON.stringify(state,null,2)+'\n');fs.renameSync(file+'.tmp',file);return {enabled:true,sent:batch.length};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const result=await deliverNotifications();console.log(JSON.stringify(result));}
