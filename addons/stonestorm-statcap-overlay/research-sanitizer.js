/* Allowlist-only research export. No names, account IDs, headers, cookies or arbitrary strings. */
(() => {
  'use strict';
  const paths=['/api/sinks','/api/home/rooms','/api/arena/pure','/api/arena/pure/season','/api/arena/bandit','/api/character','/api/content'];
  const roomIds=new Set(['rest','workshop','hall','garden']);
  const publicIds=new Set(['blossom','moonnight','winter','dragongold','champion','elite','top100','fighter','podium','top10','top25','copper','silver','gold','throne']);
  const furnitureIds=new Set(['furrug','ropecoil','paperlamp','porridgepot','baittin','woodchest','calligraphy','potionshelf','hornhook','floursack','cranescreen','fanwall','lotusbowl','mountainscroll','tigerrug','jadecloth','wallaxe','totemmask','shrimpjar','anvilstand','phoenixpanel','wavescreen','stormpanel','crystalheart','icecluster','goldegg','ashmask','redbanner','lootchest','goldcup','dragoncrest','tigercrest','wolfcrest','swordcrest','embercore','dragoneye','diamond','dragonkey','jadelion','pagoda','moonlantern','goatteapot','goatportrait','incensedragon','stormpine','goatthrone','dragonrug','dragontapestry','dragonpearl','dragonpillar','homehearth']);
  const numericKeys=['minLevel','maxLevel','minTier','maxTier','maxRoomLevel','slots','price','coins','nyang','hours','days','maxDays','maxFights','fightsPerDay','attemptsPerDay','minFights','seasonDays','cooldownSeconds','rerollCooldownSeconds','maxRerolls','minHpPct','regenPct','regenMinutes','potionCoinsMax','potionNyangMax','minRank','maxRank','percent','petPoints','ore','comfort','xpPct','nyangPct','afkHours','energyPerDay','maxComfort','luxuryCap','comfortCap','maxStars','dailyLimit','minHeroLevel','keyCost','amount','targetLevel'];
  const number=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1e12;
  function fields(value){
    const out={};if(!value||typeof value!=='object'||Array.isArray(value))return out;
    for(const key of numericKeys)if(number(value[key]))out[key]=value[key];
    for(const key of ['baseCoins','extraCoins'])if(Array.isArray(value[key])&&value[key].length<=40&&value[key].every(number))out[key]=value[key].slice();
    return out;
  }
  function records(list,ids,identity='id'){
    if(!Array.isArray(list))return [];
    return list.slice(0,128).flatMap(row=>{
      if(!row||!ids.has(row[identity]))return [];
      const out={id:row[identity],...fields(row)};
      const next=row.next??row.observedNextQuote;
      if(next){const quote=fields(next);if(number(next.level))quote.targetLevel=next.level;if(Object.keys(quote).length)out.observedNextQuote=quote;}
      if(row.rules)out.rules=fields(row.rules);
      return [out];
    });
  }
  function sanitize(endpoint,json){
    if(!paths.includes(endpoint)||!json||typeof json!=='object')return null;
    let input=endpoint==='/api/character'?(json.state??json):json.view??json.data??json;
    if(!input||typeof input!=='object'||Array.isArray(input))return null;
    const out={};
    if(endpoint==='/api/content'){
      // Only the versioned public species/rule schema. Never copy roster, IDs,
      // learned skills, arbitrary text or additional character fields.
      const known=globalThis.STONESTORM_PET_MODEL?.config;
      const candidate=globalThis.StonestormPetDetails?.publicConfig(input)??globalThis.StonestormPetDetails?.validateConfig(input.pets);
      if(!known||!candidate)return null;
      const copy=(template,value)=>{
        if(typeof template==='number'){if(!number(value))throw Error('Invalid rule');return value;}
        if(Array.isArray(template)){if(!Array.isArray(value)||value.length!==template.length)throw Error('Unknown structure');return template.map((v,i)=>copy(v,value[i]));}
        if(template&&typeof template==='object'){if(!value||typeof value!=='object')throw Error('Missing rules');return Object.fromEntries(Object.entries(template).map(([k,v])=>[k,copy(v,value[k])]));}
        if(value!==template)throw Error('Unknown identifier');return template;
      };
      try{out.pets=copy(known,candidate);}catch{return null;}
    }else if(endpoint==='/api/character'){
      // A TeahouseModal által használt alapár-konfiguráció; a karakter többi része kimarad.
      const refill=input.patron?.prices?.refill??input.refill,allowed=['baseCoins','extraCoins','vipExtra','energyCapBase','energyCapPerRefill'];
      const clean=fields(refill);for(const key of ['vipExtra','energyCapBase','energyCapPerRefill'])if(number(refill?.[key]))clean[key]=refill[key];
      out.refill=Object.fromEntries(Object.entries(clean).filter(([key])=>allowed.includes(key)));
      // The client uses state.petArt as a public, hash-addressed image registry.
      // Only known species/form keys and hexadecimal asset keys are exportable.
      const art=input.petArt??input.publicPetArt,types=globalThis.STONESTORM_PET_MODEL?.config?.types??[];
      if(art&&typeof art==='object'&&!Array.isArray(art)){
        const names=new Set(types.flatMap(t=>[1,2,3,4,5].map(form=>t.id+'_'+form)));
        // An owned-only subset could reveal which species a player possesses.
        // Export only a complete fixed public catalog, never that subset.
        if(names.size&&[...names].every(key=>typeof art[key]==='string'&&/^[a-f0-9]{32,64}$/i.test(art[key])))out.publicPetArt=Object.fromEntries([...names].map(key=>[key,art[key]]));
      }
    }else if(endpoint==='/api/sinks'){
      const home=input.home;if(home&&typeof home==='object'){
        out.home={};if(home.rules)out.home.rules=fields(home.rules);
        if(Array.isArray(home.tiers))out.home.tiers=home.tiers.slice(0,20).flatMap(row=>number(row?.tier)&&row.tier>=1&&row.tier<=8?[{tier:row.tier,...fields(row)}]:[]);
        const offers=home.offers??input.furniture?.offers;if(offers)out.home.offers=records(offers,furnitureIds);
        if(home.luxury)out.home.luxury=records(home.luxury,furnitureIds);
      }
    }else if(endpoint==='/api/home/rooms'){
      out.rooms=records(input.rooms,roomIds);
      if(input.themes)out.themes={...fields(input.themes),list:records(input.themes.list,publicIds)};
      if(input.rules)out.rules=fields(input.rules);
    }else{
      if(input.rules)out.rules=fields(input.rules);
      if(input.limits)out.limits=fields(input.limits);
      if(input.season?.rules)out.season={rules:fields(input.season.rules)};
      if(input.rewards)out.rewards=records(input.rewards,publicIds);
      if(input.prize?.tiers)out.prize={tiers:records(input.prize.tiers,publicIds)};
    }
    const useful=value=>value&&typeof value==='object'?Object.values(value).some(useful):typeof value==='number'||typeof value==='string';
    if(!useful(out))return null;
    return {schema:1,endpoint,observedOnly:true,scope:'Anonymous catalog/rule fields and conditional quotes; not global server rules',data:out};
  }
  globalThis.StonestormResearch={paths,sanitize};
})();
