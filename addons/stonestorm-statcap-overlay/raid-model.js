/* Pure, shared number / expedition model. No network, storage or game actions. */
(() => {
  'use strict';
  const kinds = Object.freeze([{key:'short',name:'Rövid'},{key:'medium',name:'Közepes'},{key:'long',name:'Hosszú'}]);
  const fields = ['energy','xp','nyang','minutes'];
  const valid = n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= Number.MAX_SAFE_INTEGER;
  function readNumber(input, source='DOM') {
    if (typeof input === 'number') return valid(input) ? exact(input,source) : missing('Érvénytelen szám.');
    if (typeof input !== 'string' || input.length > 100) return missing('Nincs kiolvasható érték.');
    const raw=input.trim().replace(/[\u00a0\u202f]/g,' ');
    const match=/^\+?([\d][\d., ]*?)\s*(kk|k|m)?$/i.exec(raw);
    if(!match)return missing('Nem egyértelmű számformátum.',raw);
    let digits=match[1].trim(),suffix=(match[2]||'').toLowerCase();
    // Hungarian full numbers: grouped thousands, decimal comma. A decimal dot is
    // accepted only in compact notation (e.g. 1.9m), never guessed in full numbers.
    if(suffix && /^\d+\.\d{1,2}$/.test(digits))digits=digits.replace('.',',');
    const parts=digits.split(',');
    if(parts.length>2 || (parts.length===2&&!/^\d+$/.test(parts[1])))return missing('Hibás tizedesjel.',raw);
    const whole=parts[0];
    if(!(/^\d+$/.test(whole)||/^\d{1,3}(?: \d{3})+$/.test(whole)||/^\d{1,3}(?:\.\d{3})+$/.test(whole)))return missing('Hibás ezreselválasztás.',raw);
    const multiplier=suffix==='k'?1000:suffix?1000000:1;
    const value=Number(whole.replace(/[ .]/g,'')+(parts.length===2?'.'+parts[1]:''))*multiplier;
    if(!valid(value))return missing('Érvénytelen vagy túl nagy szám.',raw);
    if(!suffix)return {...exact(value,source),raw};
    // Verified public HU formatter truncates to one decimal, including omitted .0.
    // Thus 448k means [448000,448100), NOT an exact 448000 or ±500.
    const quantum=multiplier/10;
    return {value,min:value,max:value+quantum,source,approx:true,raw,reason:'Rövidített, lefelé csonkolt érték.'};
  }
  function exact(value,source='API') { return {value,min:value,max:value,source,approx:false,raw:String(value),reason:''}; }
  function missing(reason='Hiányzó adat.',raw='') { return {value:null,min:null,max:null,source:'hiányzik',approx:false,raw,reason}; }
  const parseGameNumber=input=>readNumber(input).value;
  function parseDuration(text) {
    if(typeof text!=='string')return null;
    text=text.trim().replace(/[\u00a0\u202f]/g,' ');
    // The offer uses localized minutes / hours, not an unlabelled clock/countdown.
    let m=/^(\d+(?:,\d+)?)\s*(?:perc|min)(?:\.)?$/.exec(text);
    if(m){const n=parseGameNumber(m[1]);return n>0?n:null;}
    m=/^(\d+)\s*(?:óra|h)(?:\s+(\d+)\s*(?:perc|min))?$/.exec(text);
    return m && (!m[2]||Number(m[2])<60) && Number(m[1])*60+Number(m[2]||0)>0?Number(m[1])*60+Number(m[2]||0):null;
  }
  const kindFor = n => n<=15?'short':n<=30?'medium':'long';
  function readDuration(text) {
    const minutes=parseDuration(text);
    if(minutes===null)return missing('Nincs megbízható, feliratozott időadat.');
    const half=/óra|\bh\b/.test(text)?0.5:0.05;
    return {value:minutes,min:Math.max(0,minutes-half),max:minutes+half,source:'DOM',approx:true,raw:text,reason:'Kerekített idő; a pontos másodperc csak megfigyelt API-ból ismert.'};
  }
  function projectAPI(data) {
    const offers=data?.expedition?.offers,mods=data?.mods,derived=data?.derived;
    const result={observedAt:Date.now(),offers:[]};
    if(!Array.isArray(offers)||offers.length>30||!mods||!derived)return result;
    for(const offer of offers){
      if(typeof offer?.id!=='string'||!offer.id||offer.id.length>160||!valid(offer.travelMin)||offer.travelMin<=0||!valid(offer.pace)||offer.pace<=0||!valid(offer.energyCost)||offer.energyCost<=0)continue;
      const row={id:offer.id,kind:kindFor(offer.travelMin/offer.pace),energy:offer.energyCost};
      // Public reward-boost + constants contract: min(2, mult-paid+item)+paid.
      for(const key of ['xp','nyang']){
        const base=offer.preview?.[key],mult=mods[key+'Mult'],paid=mods[key+'Paid'],item=derived[key+'Bonus'];
        const value=[base,mult,paid,item].every(valid)?Math.round(base*(Math.min(2,mult-paid+item)+paid)):null;
        row[key]=valid(value)?value:null;
      }
      row.minutes=valid(mods.travelMult)&&mods.travelMult>0?Math.round(offer.travelMin*60*mods.travelMult)/60:null;
      result.offers.push(row);
    }
    return result;
  }
  function merge(dom,api,manual={}) {
    const rows=kinds.map(kind=>{
      const auto=dom[kind.key],candidates=(api?.offers||[]).filter(o=>auto?.id && o.id===auto.id && o.kind===kind.key);
      const precise=candidates.length===1?candidates[0]:null;
      const agrees=(field)=>{const v=auto?.[field],n=precise?.[field];return v?.value!==null&&valid(n)&&v&&n>=v.min-1e-8&&(v.approx?n<v.max:Math.abs(n-v.value)<1e-8);};
      const apiTrusted=precise&&auto.energy?.value===precise.energy&&['xp','nyang'].some(agrees)&&fields.every(f=>auto[f]?.value===null||!valid(precise[f])||agrees(f));
      const row={...kind,id:auto?.id||null,detected:!!auto,extra:auto?.extra||'',fields:{}};
      for(const field of fields){
        let value=auto?.[field]||missing(auto?.reason||'Nyisd meg a Portyák ajánlatait.');
        if(precise && valid(precise[field])){
          const n=precise[field];
          // Exact API values only supersede the matching, current DOM offer and
          // its truncation interval. A stale/incompatible snapshot never wins.
          if(apiTrusted)value=exact(n,'API');
          else if(value.value!==null)value={...value,reason:'Az API-pillanatkép eltér; a jelenlegi kártya adata látható.'};
        }
        const override=manual[kind.key]?.[field];
        let selected=override!==undefined && override!=='' ? {...readNumber(override,'kézi'),source:'kézi',automatic:value} : value;
        if(selected.value!==null && ((field==='energy'&&(!Number.isInteger(selected.value)||selected.value<=0))||(field==='minutes'&&selected.value<=0)))selected={...missing(field==='energy'?'Az energia pozitív egész szám legyen.':'Az idő pozitív szám legyen.'),source:selected.source,automatic:selected.automatic,raw:selected.raw};
        row.fields[field]=selected;
      }
      row.metrics={};
      for(const reward of ['xp','nyang'])for(const [unit,divisor,mult] of [['Energy','energy',1],['Minute','minutes',1],['Hour','minutes',60]]){
        const r=row.fields[reward],d=row.fields[divisor],key=reward+'Per'+unit;
        row.metrics[key]=r.value!==null&&d.value>0&&d.min>0?{value:r.value/d.value*mult,min:r.min/d.max*mult,max:r.max/d.min*mult,approx:r.approx||d.approx}:missing(divisor==='energy'?'Hiányzó jutalom vagy pozitív energia.':'Hiányzó jutalom vagy megbízható időadat.');
      }
      return row;
    });
    const winners={};
    for(const metric of Object.keys(rows[0].metrics)){
      const complete=rows.every(r=>r.metrics[metric].value!==null);
      winners[metric]=complete?rows.find(r=>rows.every(o=>o===r||r.metrics[metric].min>o.metrics[metric].max))?.key||null:null;
    }
    return {rows,winners,detected:rows.filter(r=>r.detected).length};
  }
  const format=n=>valid(n)?new Intl.NumberFormat('hu-HU',{maximumFractionDigits:2}).format(n):'–';
  globalThis.StonestormRaids=Object.freeze({kinds,fields,valid,exact,missing,readNumber,parseGameNumber,parseDuration,readDuration,projectAPI,merge,format});
})();
