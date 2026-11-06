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
  globalThis.StonestormMath=Object.freeze({speedup,guildPlan,travel,efficiency});
})();
