/* Presentation preferences only. No character, item or observed gameplay state. */
(() => {
  'use strict';
  const key='stonestormCompanion.ui.v1',tabs=['overview','stats','equipment','raids','research','interfaces','settings'];
  const quick=['overview','raids','equipment','stats','interfaces','research'];
  const finite=(v,f,min,max)=>typeof v==='number'&&Number.isFinite(v)?Math.max(min,Math.min(max,v)):f;
  const visibleTabs=s=>tabs.filter(id=>s?.development===true||!['research','interfaces'].includes(id));
  function clean(s){const development=s?.development===true;return {schema:2,development,theme:['emerald','obsidian','ember'].includes(s?.theme)?s.theme:'emerald',open:s?.open===true,tab:visibleTabs({development}).includes(s?.tab)?s.tab:'overview',mode:['mini','normal','full'].includes(s?.mode)?s.mode:'normal',width:finite(s?.width,700,320,2400),height:finite(s?.height,760,320,1600),miniWidth:finite(s?.miniWidth,340,280,700),miniHeight:finite(s?.miniHeight,300,220,700),x:finite(s?.x,null,8,20000),y:finite(s?.y,null,8,20000),miniX:finite(s?.miniX,null,8,20000),miniY:finite(s?.miniY,null,8,20000),quick:Array.isArray(s?.quick)?[...new Set(s.quick.filter(id=>quick.includes(id)))].slice(0,6):['equipment','raids','stats'],notifications:Object.fromEntries(['caps','preset','improvement','research','data'].map(k=>[k,s?.notifications?.[k]!==false]))};}
  function bounds(s,w,h){const margin=8,full=s.mode==='full',mini=s.mode==='mini',width=Math.max(240,Math.min(w-margin*2,full?1440:mini?s.miniWidth:s.width)),height=Math.max(180,Math.min(h-margin*2,full?h-32:mini?s.miniHeight:s.height));return {width,height,x:Math.max(margin,Math.min(w-width-margin,full?(w-width)/2:(mini?s.miniX:s.x)??w-width-20)),y:Math.max(margin,Math.min(h-height-margin,full?16:(mini?s.miniY:s.y)??Math.max(16,(h-height)/2)))};}
  function create(storage){let value=clean(null),revision=0;const listeners=new Set(),emit=()=>{for(const fn of listeners)fn(clean(value));};
    const start=revision;try{storage.local.get(key,data=>{if(revision!==start)return;value=clean(data?.[key]);emit();});storage.onChanged?.addListener((changes,area)=>{if(area==='local'&&changes[key]){const next=clean(changes[key].newValue);if(JSON.stringify(value)!==JSON.stringify(next)){value=next;revision++;emit();}}});}catch{}
    return {get:()=>clean(value),subscribe(fn){listeners.add(fn);fn(clean(value));return()=>listeners.delete(fn);},set(patch){value=clean({...value,...patch});revision++;emit();try{storage.local.set({[key]:value});}catch{}},resetPosition(){this.set({x:null,y:null,miniX:null,miniY:null,width:700,height:760});},reset(){value=clean(null);revision++;emit();try{storage.local.remove(key);}catch{}}};
  }
  function notices(){const seen=new Map();let sequence=0;return {push(kind,text,signature){const id=String(kind)+':'+String(signature);if(seen.has(id))return null;seen.set(id,true);if(seen.size>128)seen.delete(seen.keys().next().value);return {id:++sequence,kind,text:String(text).slice(0,240)};},clear(){seen.clear();}};}
  // This hub stays in the ISOLATED world. Preset names never enter DOM events.
  const events=new Map();
  globalThis.StonestormCompanionEvents=Object.freeze({on(type,fn){if(!events.has(type))events.set(type,new Set());events.get(type).add(fn);return()=>events.get(type).delete(fn);},emit(type,payload){for(const fn of events.get(type)??[])fn(payload);}});
  let sharedStore;
  const shared=storage=>sharedStore??=(create(storage));
  globalThis.StonestormCompanionState=Object.freeze({key,tabs,quick,visibleTabs,clean,bounds,create,shared,notices});
})();
