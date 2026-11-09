/* Tiszta, külön tesztelhető kalkulátorok. Nincs hálózat vagy tárolás. */
(() => {
  const valid = (x,min=0,max=Infinity) => typeof x==='number' && Number.isFinite(x) && x>=min && x<=max;
  function speedup(hours, level, rates) {
    if(!valid(hours) || !Number.isInteger(level) || !valid(level,1,15)) return null;
    const rate=rates.find(r=>level<=r.upTo)?.coinsPerHour;
    return valid(rate) ? Math.ceil(hours)*rate : null;
  }
  function guildPlan(current,target,rates) {
    if(!Number.isInteger(current)||!Number.isInteger(target)||!valid(current,0,15)||!valid(target,current,15)) return null;
    const levels=Array.from({length:target-current},(_,i)=>current+i+1);
    return {hours:levels.reduce((s,l)=>s+l*2,0),coins:levels.reduce((s,l)=>s+speedup(l*2,l,rates),0),steps:levels.length};
  }
  function travel(minutes,mult) {
    return valid(minutes) && valid(mult,0,1) ? {minutes:minutes*mult,saved:minutes*(1-mult)} : null;
  }
  function efficiency(xp,energy,minutes,budget) {
    if(!valid(xp)||!valid(energy,Number.MIN_VALUE)||!valid(minutes,Number.MIN_VALUE)||!valid(budget)) return null;
    const runs=Math.floor(budget/energy);
    return {perEnergy:xp/energy,perHour:xp/minutes*60,runs,totalXp:runs*xp,totalMinutes:runs*minutes};
  }
  function parsePercent(input) {
    if(typeof input==='number')return valid(input)?input:null;
    if(typeof input!=='string'||! /^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(input.trim()))return null;
    const number=Number(input.trim().replace(',','.'));
    return valid(number)?number:null;
  }
  function cappedPercent(amount,cap) {
    if(!valid(amount)||!valid(cap,Number.MIN_VALUE,100))return null;
    const effective=Math.min(amount,cap);
    return {amount,cap,effective,excess:amount-effective,fill:effective/cap};
  }
  function sumBonuses(gear,other) {
    if(!valid(gear)||!valid(other)||!valid(gear+other))return null;
    return {gear,other,total:gear+other,effective:null,cap:null};
  }
  function parseSignedPercent(input) {
    if(typeof input==='number')return valid(input,-Infinity)?input:null;
    if(typeof input==='string'&&/^[+-]/.test(input.trim())){
      const text=input.trim(),amount=parsePercent(text.slice(1));return amount===null?null:(text.startsWith('-')?-amount:amount)||0;
    }
    return parsePercent(input);
  }
  function criticalDamage(normalDamage,chance,bonus,gearBonus,rules) {
    if(!valid(normalDamage)||!valid(chance)||!valid(bonus,-Infinity)||!valid(gearBonus,-Infinity)||!valid(rules?.baseMultiplier,Number.MIN_VALUE))return null;
    const totalBonus=(bonus+gearBonus)||0;
    if(!valid(totalBonus,-Infinity))return null;
    const effectiveChance=cappedPercent(chance,rules.chanceCap),effectiveBonus=cappedPercent(Math.max(0,totalBonus),rules.damageBonusCap);
    if(!effectiveChance||!effectiveBonus)return null;
    const multiplier=rules.baseMultiplier+effectiveBonus.effective/100;
    const criticalHit=normalDamage*multiplier,p=effectiveChance.effective/100;
    const averageDamage=normalDamage*(1-p)+criticalHit*p;
    if(!valid(criticalHit)||!valid(averageDamage))return null;
    return {normalDamage,totalBonus,chance:effectiveChance,bonus:effectiveBonus,multiplier,criticalHit,averageDamage,negativeIgnored:Math.max(0,-totalBonus)};
  }
  function rewardBonus(normal,special,unknown,cap) {
    if(![normal,special,unknown].every(value=>valid(value))||!valid(normal+special+unknown))return null;
    const base=cappedPercent(normal,cap),allNormal=cappedPercent(normal+unknown,cap);
    if(!base||!allNormal)return null;
    const total=normal+special+unknown,minEffective=allNormal.effective+special,maxEffective=base.effective+special+unknown;
    return {normal,special,unknown,total,baseCap:cap,baseEffective:base.effective,minEffective,maxEffective,effective:unknown?null:minEffective,minLost:Math.max(0,total-maxEffective),maxLost:Math.max(0,total-minEffective),lost:unknown?null:Math.max(0,total-minEffective)};
  }
  globalThis.StonestormMath=Object.freeze({speedup,guildPlan,travel,efficiency,parsePercent,parseSignedPercent,cappedPercent,sumBonuses,criticalDamage,rewardBonus});
})();
