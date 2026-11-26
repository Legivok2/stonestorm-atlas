/* Audited presentation model, 0.14.0. Unknown inputs stay unknown. No requests.
 * Formula evidence: data/companion-0140-evidence.json. Fractions in; percent out. */
(() => {
  'use strict';
  const version='fbc93606674a',finite=v=>typeof v==='number'&&Number.isFinite(v),pct=v=>finite(v)?v*100:null;
  const soft=(raw,cap)=>raw<=cap/2?raw:cap/2+(cap/2)*(raw-cap/2)/(raw-cap/2+cap/2);
  function limit(key,name,value,cap,{raw=null,gear=null,kind='hard',source='',context='',overflowKnown=false}={}){
    const verified=finite(value)&&finite(cap)&&cap>0&&value>=0&&value<=cap+1e-7;
    return {key,name,short:name,value:verified?value:null,cap:finite(cap)?cap:null,verified,raw,gear,kind,source,context,
      ratio:verified?100*value/cap:0,remaining:verified?Math.max(0,cap-value):null,
      excess:verified&&kind==='hard'&&overflowKnown&&finite(raw)?Math.max(0,raw-cap):0,
      caption:verified?(context?context+' · ':'')+(kind==='soft'?'Csökkenő hozadékú bónusz':'Igazolt felső korlát'):'Nem igazolt'};
  }
  function evade(c,r){
    if(!finite(c?.level)||!finite(c?.derived?.evadeBonus)||!r?.dodge||!Array.isArray(r.ref?.dexShare)||!Array.isArray(r.ref?.heroDex)||!Array.isArray(r.ref?.dex))return null;
    const stats=c.stats,values=['str','dex','vit','int'].map(k=>stats?.[k]);if(!values.every(finite))return null;
    const d=r.dodge,n=r.monsterEvadeCap;if(![d.floor,d.base,d.weight,n].every(finite))return null;
    const i=Math.max(0,Math.min(Math.floor(c.level),r.ref.dexShare.length-1)),v=r.ref.dexShare[i],hero=r.ref.heroDex[i],foe=r.ref.dex[i];
    if(![v,hero,foe].every(finite)||hero<=0)return null;
    const own=stats.dex/Math.max(1,values.reduce((a,b)=>a+b,0)),enemy=v*foe/hero;
    const raw=Math.min(n,Math.max(d.floor,d.base+d.weight*(own-enemy)))+c.derived.evadeBonus;
    return {value:Math.min(n,raw)*100,raw:raw*100};
  }
  function model(character,content,bonusPanel={},gear={}){
    const c=character,d=c?.derived??{},known=content?.version===version,hs=d.harceroStats??{},caps=[];
    const crit=finite(d.critChance)&&d.critChance>=0?d.critChance*100:null;
    caps.push(limit('crit','Kritikus esély',crit,known?pct(content.critCap):null,{gear:finite(gear.crit)?gear.crit:null,source:'derived.critChance',context:'Alap kritikus esély'}));
    for(const [key,name] of [['critDamage','Kritikus sebzésbónusz'],['skillDamage','Képességsebzés-bónusz'],['lifesteal','Életlopás'],['damageTaken','Sebzéscsökkentő bónusz'],['vsBoss','Bossok elleni bónusz'],['potionHeal','Gyógyital-hatás']]){
      const raw=pct(hs.supportRaw?.[key]),cap=known?pct(content.supportCaps?.[key]):null,kind=content?.supportSoft?.includes(key)?'soft':'hard';
      // Server-projected combat values are explicit. Native panel text may be
      // raw or effective; without a proven contract it stays diagnostic only.
      // Equipment line sums are NEVER final character values.
      const value=finite(hs[key])?pct(hs[key]):null;
      caps.push(limit(key,name,value,cap,{raw,gear:finite(gear[key])?gear[key]:null,kind,source:finite(hs[key])?'derived.harceroStats.'+key:'Nem igazolt végérték',context:'Harci referencia',overflowKnown:raw!==null}));
    }
    const dodge=known&&content.clientVerified===true?evade(c,content.evadeRules):null;
    caps.push(limit('evadeNormal','Kitérés · normál referencia',dodge?.value??null,known?pct(content.monsterEvadeCap):null,{raw:dodge?.raw??null,source:'derived.evadeBonus + DEX-részarány + szintreferencia',context:'Szint szerinti referenciaellenfél',overflowKnown:true}));
    const rewards={};
    for(const key of ['xp','nyang','drop']){
      const multiplier=c?.mods?.[key+'Mult'],paid=c?.mods?.[key+'Paid'],equipment=d[key+'Bonus'];
      // Drop has no equipment term in the audited client. XP/Nyang must provide it.
      const item=key==='drop'&&known?0:equipment;
      if(known&&content.clientVerified===true&&[multiplier,paid,item].every(finite)&&multiplier>=1&&paid>=0&&paid<=.5&&item>=0){
        const effective=(Math.min(2,multiplier-paid+item)+paid-1)*100,raw=(multiplier+item-1)*100;
        rewards[key]={effective,raw,gear:item*100,other:(multiplier-1)*100,paid:paid*100,above:Math.max(0,raw-effective),source:'Játékkliens: külön normál és fizetős bónusz'};
      }else rewards[key]=null;
    }
    const basic=[['str','Erő'],['dex','Ügyesség'],['vit','Életerő'],['int','Intelligencia']].filter(([k])=>finite(c?.stats?.[k])).map(([key,name])=>({key,name,value:c.stats[key],source:'Karakteradat'}));
    const derived=(pairs)=>pairs.filter(([key])=>finite(d[key])).map(([key,name])=>({key,name,value:d[key],source:'Karakteradat'}));
    const groups=[{id:'basic',name:'Alap harci statok',rows:basic},
      {id:'attack',name:'Támadás és sebzés',rows:derived([['atkMin','Sebzés · minimum'],['atkMax','Sebzés · maximum']])},
      {id:'defense',name:'Védelem és túlélés',rows:derived([['maxHp','HP'],['maxSp','SP'],['def','Védelem']])},
      {id:'critical',name:'Kritikus és képességbónuszok',rows:caps.filter(x=>['crit','critDamage','skillDamage'].includes(x.key)&&x.verified)},
      {id:'rewards',name:'XP, Nyang és zsákmány',rows:Object.entries(rewards).filter(([,v])=>v).map(([key,r])=>({key,name:{xp:'Tapasztalat',nyang:'Nyang',drop:'Zsákmány'}[key],value:r.effective,unit:'%',source:r.source}))},
      {id:'limits',name:'Limitek és hatékonyság',rows:caps.filter(x=>!['crit','critDamage','skillDamage'].includes(x.key)&&x.verified)}].filter(g=>g.rows.length);
    const primary=['crit','critDamage','skillDamage','evadeNormal','vsBoss'];
    return {ready:!!c,identity:{name:typeof c?.name==='string'?c.name:'',level:c?.level,classId:c?.classId},
      hp:finite(d.maxHp)?d.maxHp:null,power:finite(c?.harcero?.full)?c.harcero.full:null,defense:finite(d.def)?d.def:null,
      damage:finite(d.atkMin)&&finite(d.atkMax)?[d.atkMin,d.atkMax]:null,rewards,allCaps:caps,
      caps:primary.map(k=>caps.find(x=>x.key===k)).filter(x=>x?.verified).slice(0,5),groups,
      // Boss caps are configuration, never claimed as actual enemy-specific evade.
      bossCaps:known?content.bossEvadeCaps??{}:{}};
  }
  globalThis.StonestormCompanionStats=Object.freeze({model,limit,evade,soft,version});
})();
