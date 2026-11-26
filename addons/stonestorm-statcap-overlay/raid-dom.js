/* Reads only the public client's individual expedition offer elements. */
(() => {
  'use strict';
  const M=globalThis.StonestormRaids;
  function scan(document){
    const result={},cards=[...document.querySelectorAll('.expo-offer[data-offer]')].filter(c=>!c.hidden&&!c.closest('[hidden],[aria-hidden="true"]')&&c.getClientRects().length&&document.defaultView.getComputedStyle(c).visibility!=='hidden');
    for(const card of cards){
      const kind=M.kinds.find(k=>card.classList.contains('expo-offer--'+k.key));
      if(!kind)continue;
      if(!card.dataset.offer || cards.filter(c=>c.dataset.offer===card.dataset.offer).length!==1){result[kind.key]={reason:'Többszörös vagy hiányzó ajánlatazonosító.'};continue;}
      if(result[kind.key]){result[kind.key]={reason:'Více ajánlat azonos úthosszal; nem választunk találomra.'};continue;}
      const facts=[...card.querySelectorAll('.expo-offer__fact')];
      const energies=facts.filter(f=>f.querySelector('.expo-offer__energy'));
      const energyText=energies.length===1?energies[0].textContent.trim():'';
      const e=/^(\d[\d\u00a0\u202f ]*)\s*energia$/i.exec(energyText);
      const times=card.querySelectorAll('.expo-offer__time');
      const minutes=times.length===1?M.readDuration(times[0].textContent):M.missing('Hiányzó vagy többértelmű időadat.');
      const rewards=[...card.querySelectorAll('.expo-offer__reward > span')];
      const xp=rewards.filter(r=>/\bXP\b/i.test(r.textContent));
      const nyang=rewards.filter(r=>r.querySelector('.expo-offer__coin')||/\bNyang\s*:/i.test(r.textContent));
      function reward(nodes,type){
        if(nodes.length!==1)return M.missing(nodes.length?'Nem egyértelmű jutalom.':'Hiányzó '+type+'-jutalom.');
        const raw=nodes[0].textContent.trim();
        const text=type==='XP'?raw.replace(/\s*XP\s*$/i,''):raw.replace(/^\s*Nyang\s*:\s*/i,'').replace(/\s*Nyang\s*$/i,'');
        return M.readNumber(text);
      }
      result[kind.key]={id:card.dataset.offer,energy:e?M.readNumber(e[1]):M.missing('Hiányzó vagy hibás energia.'),xp:reward(xp,'XP'),nyang:reward(nyang,'Nyang'),minutes,extra:rewards.filter(r=>!xp.includes(r)&&!nyang.includes(r)).map(r=>r.textContent.trim()).join(' · ').slice(0,200)};
    }
    return result;
  }
  globalThis.StonestormRaidDOM=Object.freeze({scan});
})();
