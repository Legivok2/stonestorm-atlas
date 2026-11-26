(() => {
  "use strict";
  if (window.top !== window || document.getElementById("ss-statcap-root")) return;

  const STORAGE_KEY = "stonestormStatCap.v1";
  const POTION_KEY = "stonestormPotionPayments.v1";
  // v3 starts fresh: earlier captures could include unequipped items or false positives.
  const ITEM_KEY = "stonestormEquippedCritDamage.v3";
  const SKILL_KEY = "stonestormEquippedSkillDamage.v1";
  const CRIT_CHANCE_KEY = "stonestormEquippedCritChance.v1";
  const equipSlots = [
    { key: "weapon", name: "Fegyver" }, { key: "armor", name: "Páncél" },
    { key: "helmet", name: "Sisak" }, { key: "shield", name: "Pajzs" },
    { key: "boots", name: "Csizma" }, { key: "bracelet", name: "Karkötő" },
    { key: "necklace", name: "Nyaklánc" }, { key: "earring", name: "Fülbevaló" }
  ];
  const stats = [
    { key: "defense", name: "Védelem", cap: null, unit: "pont", patterns: [/(?:^|\n)\s*(?:védelem|defense)\s*:?\s*(\d+(?:[,.]\d+)?)(?=\s|$)/im] },
    { key: "crit", name: "Kritikus esély (érvényes)", cap: 50, source: "Karakter · max. 50%", patterns: [/(?:kritikus esély|critical chance)\s*[:+]?\s*(\d+(?:[,.]\d+)?)\s*%/i] },
    { key: "evadeBoss", name: "Kitérés · harci referencia", cap: 12, source: "Összes kitérésből számolva", patterns: [/(?:összes kitérés|total evasion|total evade)\s*[:+]?\s*(\d+(?:[,.]\d+)?)\s*%/i] },
    { key: "evadeMob", name: "Kitérés · normál szörny", cap: 30, source: "Összes kitérésből számolva", patterns: [/(?:összes kitérés|total evasion|total evade)\s*[:+]?\s*(\d+(?:[,.]\d+)?)\s*%/i] },
    { key: "critDamage", name: "Kritikus sebzésbónusz", cap: 75, source: "Felszerelt itemek összegzője", patterns: [] },
    { key: "skillDamage", name: "Képességsebzés-bónusz", cap: 50, source: "Felszerelt itemek összegzője", patterns: [] },
    { key: "vsBoss", name: "Bossok elleni sebzésbónusz", cap: 35, source: "Content API", patterns: [] },
    { key: "potionHeal", name: "Gyógyító hatás bónusza", cap: 25, source: "Content API", patterns: [] },
    { key: "lifesteal", name: "Életlopás", cap: 8, source: "Content API", patterns: [] },
    { key: "damageTaken", name: "Kapott sebzés módosító", cap: 20, source: "Content API", patterns: [] },
    { key: "xp", name: "Összes XP-bónusz", cap: null, source: "Tapasztalat (összesen)", patterns: [/(?:összes xp.bónusz|xp.bónusz|xp bonus)\s*[:+]?\s*(\d+(?:[,.]\d+)?)\s*%/i] },
    { key: "nyang", name: "Összes nyangbónusz", cap: null, source: "Nyang (összesen)", patterns: [/(?:összes nyangbónusz|nyangbónusz|nyang bonus)\s*[:+]?\s*(\d+(?:[,.]\d+)?)\s*%/i] }
  ];
  const state = { visible: false, manual: {}, detected: {}, updated: null, defenseReduction: null, itemCrit: null, itemCritSeenAt: 0, critFromItem: false, aggregateXp: false, aggregateNyang: false, equipped: {}, skillEquipped: {}, critChanceEquipped: {}, itemLineTotals: {}, totals: {}, baseStats: {}, changes: [], apiReady: false, apiEquipmentComplete: false, apiItemCount: 0, apiCharacter: null, apiContent: null, panelWidth: 430, panelHeight: 590, maximized: false, panelLeft: null, panelTop: null, resizing: false, openSections: {}, debugVisible: false, potionPayments: {} };
  const root = document.createElement("div");root.id="ss-statcap-root";
  const shadow=root.attachShadow({mode:"closed"}),wrap=document.createElement("div");wrap.className="wrap";shadow.append(wrap);document.documentElement.append(root);
  const companion=globalThis.StonestormCompanion.mount({root,shadow,wrap,onVisibility(visible,mode){state.visible=visible;state.maximized=mode==='full';}});
  globalThis.StonestormCompanionApp=companion;
  chrome.runtime.onMessage.addListener((message,sender,reply)=>{if(message?.type!=='ssa-companion-open'||sender.id!==chrome.runtime.id)return false;const pages=StonestormCompanionState.visibleTabs(companion.preferences());if(!pages.includes(message.page))return false;companion.select(message.page);reply({ok:true});return false;});
  globalThis.StonestormAddonPanels?.attach(shadow);
  globalThis.StonestormEquipmentUI?.attach(shadow);
  globalThis.StonestormRaidUI?.attach(shadow);
  globalThis.StonestormEnhancedUI?.attach(shadow);

  const format = n => Number(n).toLocaleString("hu-HU", { maximumFractionDigits: 2 });
  const parse = input => {
    const n = Number(String(input).trim().replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  const isNumber = n => typeof n === "number" && Number.isFinite(n);
  const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slotName = key => equipSlots.find(s => s.key === key)?.name || key;
  const apiEquippedSlots = new Set(equipSlots.map(s => s.key));
  const pctLine = (item, type) => (item.lines || []).filter(line => line.type === type && isNumber(line.value)).reduce((sum, line) => sum + line.value * 100, 0);
  function readApiEquipment() {
    if (!state.apiCharacter) return;
    const critDmg = {}, skillDmg = {}, critChance = {}, lineTotals = {};
    let found = 0;
    for (const item of state.apiCharacter.items || []) {
      const slot = item.equippedSlot === "earrings" ? "earring" : item.equippedSlot;
      if (!apiEquippedSlots.has(slot)) continue;
      found++;
      for (const line of item.lines || []) if (isNumber(line.value) && /^[a-zA-Z]{1,30}$/.test(line.type)) lineTotals[line.type] = (lineTotals[line.type] || 0) + line.value;
      const baseCrit = state.apiContent?.templates?.[item.templateId]?.crit;
      const mult = state.apiContent?.plusMult?.[item.plus];
      const base = isNumber(baseCrit) && isNumber(mult) ? baseCrit * mult * 100 : 0;
      critDmg[slot] = pctLine(item, "critDamage");
      skillDmg[slot] = pctLine(item, "skillDamage");
      critChance[slot] = pctLine(item, "crit") + base;
    }
    if (!found) return;
    if (state.apiEquipmentComplete) {
      for (const [target, next, label] of [[state.equipped, critDmg, "krit. sebzés"], [state.skillEquipped, skillDmg, "képesség"], [state.critChanceEquipped, critChance, "krit. esély"]]) {
        for (const slot of apiEquippedSlots) {
          if (isNumber(next[slot])) noteChange(`${slotName(slot)} · ${label}`, target[slot], next[slot]);
        }
      }
    }
    state.equipped = critDmg;
    state.skillEquipped = skillDmg;
    state.critChanceEquipped = critChance;
    state.itemLineTotals = lineTotals;
    state.apiItemCount = found;
    if (state.apiContent) state.apiEquipmentComplete = true;
  }
  function acceptApiMessage(event) {
    if (event.source !== window || event.origin !== location.origin || event.data?.source !== "ss-statcap-api-v2") return;
    const payload = event.data.payload;
    if (!payload || typeof payload !== "object") return;
    if (event.data.kind === "content" && payload.supportCaps) {
      state.apiContent = payload;
      if (isNumber(payload.critCap)) stats.find(s => s.key === "crit").cap = payload.critCap * 100;
      if (isNumber(payload.supportCaps.critDamage)) stats.find(s => s.key === "critDamage").cap = payload.supportCaps.critDamage * 100;
      if (isNumber(payload.supportCaps.skillDamage)) stats.find(s => s.key === "skillDamage").cap = payload.supportCaps.skillDamage * 100;
      if (isNumber(payload.monsterEvadeCap)) stats.find(s => s.key === "evadeMob").cap = payload.monsterEvadeCap * 100;
      if (isNumber(payload.evadeCap)) stats.find(s => s.key === "evadeBoss").cap = payload.evadeCap * 100;
      for (const key of ["vsBoss", "potionHeal", "lifesteal", "damageTaken"]) if (isNumber(payload.supportCaps[key])) stats.find(s => s.key === key).cap = payload.supportCaps[key] * 100;
      readApiEquipment();
    } else if (event.data.kind === "character" && Array.isArray(payload.items) && payload.stats && payload.derived) {
      state.apiSeenAt=Date.now();state.bonusPanel={values:{},at:0};
      clearTimeout(state.expiryTimer);state.expiryTimer=setTimeout(()=>render(),300010);
      state.apiReady = true;
      state.apiCharacter = payload;
      for (const [key, v] of Object.entries(payload.stats)) if (isNumber(v)) {
        noteChange({ str: "Erő", dex: "Ügyesség", vit: "Életerő", int: "Intelligencia" }[key] || key, state.baseStats[key], v);
        state.baseStats[key] = v;
      }
      for (const [source, target] of Object.entries({ maxHp: "hp", maxSp: "sp", atkMin: "damageMin", atkMax: "damageMax", def: "defense" })) {
        const v = payload.derived[source];
        if (!isNumber(v)) continue;
        noteChange({ hp: "HP", sp: "SP", damageMin: "Sebzés (min)", damageMax: "Sebzés (max)", defense: "Védelem" }[target], state.totals[target], v);
        state.totals[target] = v;
      }
      if (isNumber(payload.harcero?.full)) {
        noteChange("Harcerő", state.totals.power, payload.harcero.full);
        state.totals.power = payload.harcero.full;
      }
      if (isNumber(payload.derived.critChance)) state.detected.crit = payload.derived.critChance * 100;
      readApiEquipment();
    } else return;
    if (!shadow.activeElement?.matches("input")) render();
  }
  window.addEventListener("message", acceptApiMessage);
  window.postMessage({ source: "ss-statcap-ready-v2" }, location.origin);
  function noteChange(label, before, after) {
    if (before === null || before === undefined || !Number.isFinite(before) || !Number.isFinite(after)) return;
    const delta = after - before;
    if (Math.abs(delta) < 0.005) return;
    state.changes.unshift({ label, delta, time: Date.now() });
    state.changes = state.changes.slice(0, 12);
  }
  function scanCharacterValues(text) {
    // Once the official API answered, its structured values are authoritative.
    if (state.apiReady) return false;
    const totals = {};
    const basic = {};
    const anchor = text.match(/(?:^|\n)\s*Értékek\s*(?:\n|$)/im);
    const section = anchor ? text.slice(anchor.index, anchor.index + 900).split(/XP\s*[-–]?\s*és\s*nyangbónuszok/i)[0] : "";
    const read = (source, regex) => {
      const match = source.match(regex);
      return match ? parse(match[1].replace(/\s/g, "")) : null;
    };
    const values = {
      hp: read(section, /(?:^|\n)\s*HP\s*(\d[\d\s]*)(?:\n|$)/im),
      sp: read(section, /(?:^|\n)\s*SP\s*képességre\s*(\d[\d\s]*)(?:\n|$)/im),
      defense: read(section, /(?:^|\n)\s*Védelem\s*(\d[\d\s]*)(?=\s*[−–-]\s*\d|\n|$)/im)
    };
    const dmg = section.match(/(?:^|\n)\s*Sebzés\s*(\d[\d\s]*)\s*[–-]\s*(\d[\d\s]*)(?:\n|$)/im);
    if (dmg) { totals.damageMin = parse(dmg[1].replace(/\s/g, "")); totals.damageMax = parse(dmg[2].replace(/\s/g, "")); }
    for (const [key, value] of Object.entries(values)) if (value !== null) totals[key] = value;
    const combat = document.querySelector('[data-testid="harcero-chip"] .hc-chip__num');
    const power = (combat?.textContent || document.querySelector('[data-testid="harcero-chip"]')?.getAttribute("aria-label") || "").match(/(?:Harcerő\s*:\s*)?([\d\s\u00a0]+)/i);
    if (power) {
      const value = parse(power[1].replace(/\s/g, ""));
      if (value !== null) totals.power = value;
    }
    const statsSection = text.match(/(?:^|\n)\s*Statok\s*(?:\n|$)/im);
    const left = statsSection ? text.slice(statsSection.index, statsSection.index + 1050) : "";
    for (const [key, label] of [["str", "Erő"], ["dex", "Ügyesség"], ["vit", "Életerő"], ["int", "Intelligencia"]]) {
      const n = read(left, new RegExp(`(?:^|\\n)\\s*${label}\\s*(?:FŐ STAT\\s*)?(\\d+)(?=\\s|$)`, "im"));
      if (n !== null) basic[key] = n;
    }
    let changed = false;
    for (const [key, value] of Object.entries(totals)) {
      if (state.totals[key] !== value) { noteChange({ hp: "HP", sp: "SP", damageMin: "Sebzés (min)", damageMax: "Sebzés (max)", defense: "Védelem", power: "Harcerő" }[key] || key, state.totals[key], value); changed = true; }
    }
    for (const [key, value] of Object.entries(basic)) {
      if (state.baseStats[key] !== value) { noteChange({ str: "Erő", dex: "Ügyesség", vit: "Életerő", int: "Intelligencia" }[key], state.baseStats[key], value); changed = true; }
    }
    if (Object.keys(totals).length) state.totals = { ...state.totals, ...totals };
    if (Object.keys(basic).length) state.baseStats = { ...state.baseStats, ...basic };
    return changed;
  }
  function trackingPanel() {
    const fields = [["HP", state.totals.hp], ["SP", state.totals.sp], ["Sebzés", state.totals.damageMin !== undefined && state.totals.damageMax !== undefined ? `${format(state.totals.damageMin)}–${format(state.totals.damageMax)}` : null], ["Védelem", state.totals.defense], ["Harcerő", state.totals.power], ["Erő", state.baseStats.str], ["Ügyesség", state.baseStats.dex], ["Életerő", state.baseStats.vit], ["Intelligencia", state.baseStats.int]];
    const cells = fields.map(([label, value]) => `<div class="tracking-cell">${label}<b>${value !== null && value !== undefined ? typeof value === "number" ? format(value) : value : "–"}</b></div>`).join("");
    const changes = state.changes.slice(0, 8).map(c => `<div class="${c.delta > 0 ? "delta-up" : "delta-down"}">${c.delta > 0 ? "▲" : "▼"} ${c.label}: ${c.delta > 0 ? "+" : ""}${format(c.delta)}</div>`).join("");
    const observedCrit = state.apiCharacter?.derived?.critChance;
    const origin = state.apiReady ? `<span class="source-chip">● Character API: ${state.apiItemCount}/8 felszerelt tárgy</span>` : `<span class="warning">A Character API még nem érkezett meg. Frissítsd a játékot (F5).</span>`;
    const critLabel = "Nem igazolt";
    const summary = "A megváltozott DEX-arányos képlet nincs aktuális klienssel igazolva. A végső kritikus esélyt a Character API-ból olvassuk ki; a nyers összegből és a plafonból nem következtetünk biztos túllépésre.";
    return `<section class="tracking"><div class="raid-title">📊 Karakteráttekintés</div><div class="summary-note">${origin}</div><div class="tracking-grid">${cells}<div class="tracking-cell">Kritikus esély (nyers)<b class="known-stat">${critLabel}</b></div><div class="tracking-cell">Kritikus esély (érvényes)<b>${isNumber(observedCrit) ? `${format(observedCrit * 100)}%` : "–"}</b></div></div><div class="summary-note">${summary}</div><div class="raid-title">🔄 Legutóbbi változások</div><div class="delta-list">${changes || "Még nem észleltünk statváltozást ezen az oldalon."}</div></section>`;
  }
  function rewardBreakdown(key) {
    const gearFraction = state.itemLineTotals[key] ?? 0;
    const multKey = `${key}Mult`;
    const otherMult = state.apiCharacter?.mods?.[multKey];
    if (!state.apiReady || !isNumber(gearFraction) || !isNumber(otherMult)) return null;
    const equipment = gearFraction * 100;
    const external = (otherMult - 1) * 100;
    const raw = equipment + external;
    const character = state.apiCharacter;
    const currentTime = Date.parse(character.now || "") || Date.now();
    const vip = character.vipActive === true || (character.vipUntil && Date.parse(character.vipUntil) > currentTime);
    const vipAllowance = vip ? { xp: 25, nyang: 20, drop: 10 }[key] || 0 : 0;
    let coinPotion = 0;
    const ambiguousPotions = [];
    for (const buff of character.buffs || []) {
      if (buff.expiresAt && Date.parse(buff.expiresAt) <= currentTime) continue;
      const effect = state.apiContent?.alchemist?.[buff.kind]?.effect?.[multKey];
      if (!isNumber(effect) || effect <= 0) continue;
      const id = `${buff.kind}|${buff.expiresAt || ""}`;
      const payment = String(buff.payment || state.potionPayments[id] || "").toLowerCase();
      if (/storm.?coin|vihar.?érme|\bcoin\b/.test(payment)) coinPotion += effect * 100;
      else if (!/nyang/.test(payment)) ambiguousPotions.push({ id, kind: buff.kind, percent: effect * 100 });
    }
    const paid = Math.min(50, vipAllowance + coinPotion);
    const free = Math.max(0, raw - vipAllowance - coinPotion);
    const knownCap = 100 + paid;
    const effective = Math.min(150, Math.min(100, free) + paid);
    return { equipment, external, raw, free, paid, knownCap, effective, above: Math.max(0, raw - effective), ambiguousPotions };
  }
  function statSources(key) {
    const effectKeys = { xp: ["xpMult"], nyang: ["nyangMult"], drop: ["dropMult"], crit: ["critBonus", "critChanceBonus", "criticalChanceBonus"], critDamage: ["critDamage", "critDamageBonus"], skillDamage: ["skillDamage", "skillDamageBonus"] }[key] || [];
    const rows = [];
    const gear = state.itemLineTotals[key];
    if (isNumber(gear)) rows.push(`Felszerelésből azonosított: +${format(gear * 100)}%`);
    for (const item of state.apiCharacter?.modSources || []) {
      const effects = Object.entries(item.effect || {}).filter(([name, value]) => effectKeys.includes(name) && isNumber(value));
      if (!effects.length) continue;
      const description = effects.map(([name, value]) => `${name.endsWith("Mult") ? "+" + format(value * 100) : "+" + format(value * 100)}%`).join(" · ");
      rows.push(`${escapeHtml(item.source || "Egyéb forrás")}: ${description}`);
    }

    if (key === "critDamage" || key === "skillDamage") rows.push("A felszerelésből ismert érték részleges lehet.");
    return `<details class="stat-detail" data-section="stat-${key}" ${state.openSections[`stat-${key}`] ? "open" : ""}><summary>Honnan jön ez az érték?</summary><div class="stat-sources">${rows.length ? rows.map(text => `<div>${text}</div>`).join("") : "Még nincs részletes forrásadat."}</div></details>`;
  }
  const softLimited = key => (state.apiContent?.supportSoft ?? ["skillDamage", "critDamage", "lifesteal", "damageTaken"]).includes(key);
  function panelValue(key) {
    return state.bonusPanel && Date.now() - state.bonusPanel.at < 15000 ? state.bonusPanel.values[key] : null;
  }
  function statSummary() {
    const api = state.apiCharacter;
    const limited = (label, raw, cap, info = "") => {
      const has = isNumber(raw);
      const excess = has && isNumber(cap) ? Math.max(0, raw - cap) : 0;
      const effectiveValue = has ? Math.min(raw, cap ?? raw) : null;
      const key = label === "Kritikus esély" ? "crit" : label === "Kritikus sebzésbónusz" ? "critDamage" : "skillDamage";
      if (softLimited(key)) {
        const observed = panelValue(key);
        return `<div class="unified-row"><div class="unified-top"><span>${label}</span><b>${isNumber(observed) ? format(observed) + "% · játékpanel" : "Soft-cap: nem igazolt"}</b></div><div class="unified-info">Nyers, ismert rész: ${has ? format(raw) + "%" : "–"} · felső korlát: ${format(cap)}%. A módosított értékhez friss kliensbizonyíték vagy a Bónuszok panel adata szükséges.</div>${statSources(key)}</div>`;
      }
      return `<div class="unified-row"><div class="unified-top"><span>${label}</span><b>${has ? `${format(effectiveValue)}%` : "–"}</b></div><div class="unified-info">${has ? `Ismert összeg: +${format(raw)}%` : "Nincs még teljes adat"}${isNumber(cap) ? ` · cap: ${format(cap)}%` : ""}${excess ? ` · <span class="unified-warn">legalább ${format(excess)} százalékpont túllépés</span>` : ""}${info ? ` · ${info}` : ""}</div>${statSources(key)}</div>`;
    };
    const reward = (key, label) => {
      const r = rewardBreakdown(key);
      if (!r) return `<div class="unified-row"><div class="unified-top">${label}<b>–</b></div><div class="unified-info">Várjuk az API-adatokat.</div></div>`;
      const capText = r.above > 0 ? `<span class="unified-warn">${format(r.above)} százalékpont nem érvényesül.</span>` : `<span class="unified-good">Nincs túllépés.</span>`;
      const caveat = r.ambiguousPotions.map(p => `<div class="potion-choice">Aktív ${escapeHtml(p.kind)} (+${format(p.percent)}%) – mivel vetted?<select data-potion="${escapeHtml(p.id)}"><option value="">Válaszd ki…</option><option value="nyang">Nyangért (100%-on belül)</option><option value="coin">Storm Coinért (plafon fölött)</option></select></div>`).join("");
      return `<div class="unified-row"><div class="unified-top"><span>${label}</span><b>+${format(r.effective)}%${caveat ? "*" : ""}</b></div><div class="unified-info">Ingyenes: +${format(r.free)}% / 100% · fizetős: +${format(r.paid)}% · nyers: +${format(r.raw)}% · jelenlegi plafon: +${format(r.knownCap)}% (abszolút max. 150%). ${capText}${caveat ? " A * jelű érték a főzet eredetének megadásáig nem végleges." : ""}</div>${caveat}${statSources(key)}</div>`;
    };
    const critMin = isNumber(api?.derived?.critChance) ? api.derived.critChance * 100 : panelValue("crit");
    const critNote = "A Character API vagy a Bónuszok panel értéke. A nyers DEX-átváltás új képlete még nem igazolt." + (isNumber(panelValue("crit")) ? " Bónuszok panel ellenőrzés: " + format(panelValue("crit")) + "%" + (Math.abs(panelValue("crit") - critMin) > .01 ? " · eltérés a Character API-hoz képest" : "") : "");
    const character = api ? `<div class="tracking-grid">${[["HP",api.derived.maxHp],["SP",api.derived.maxSp],["Sebzés",`${format(api.derived.atkMin)}–${format(api.derived.atkMax)}`],["Védelem",api.derived.def],["Harcerő",api.harcero?.full],["Kaszt",api.classId || "–"]].map(([label,value])=>`<div class="tracking-cell">${label}<b>${typeof value === "number" ? format(value) : escapeHtml(value ?? "–")}</b></div>`).join("")}</div>` : '<div class="source-note">Játékadatokra várunk; frissítsd az oldalt (F5).</div>';
    return `<section class="unified"><div class="raid-title">📊 Összesített statok</div>${character}<div class="source-note">Minden stat egy helyen. A részletes eredetek és szerkeszthető mezők lent külön lenyithatók.</div><div class="unified-results">${reward("xp","Tapasztalat")}${reward("nyang","Nyang")}${reward("drop","Zsákmány")}${limited("Kritikus esély",critMin,stats.find(s => s.key === "crit").cap,critNote)}${limited("Kritikus sebzésbónusz",state.apiReady ? equippedTotal() : null,stats.find(s => s.key === "critDamage").cap,"Felszerelésből ismert rész")}${limited("Képesség-sebzésbónusz",state.apiReady ? skillTotal() : null,stats.find(s => s.key === "skillDamage").cap,"Felszerelésből ismert rész")}</div></section>`;
  }
  const equippedEntries = () => Object.values(state.equipped).filter(n => typeof n === "number" && Number.isFinite(n) && n >= 0);
  const equippedTotal = () => equippedEntries().reduce((a, b) => a + b, 0);
  const skillTotal = () => Object.values(state.skillEquipped).reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0);
  const effective = stat => Object.prototype.hasOwnProperty.call(state.manual, stat.key) ? state.manual[stat.key] : stat.key === "critDamage" && equippedEntries().length ? equippedTotal() : stat.key === "skillDamage" && Object.keys(state.skillEquipped).length ? skillTotal() : state.apiReady && isNumber(state.itemLineTotals[stat.key]) ? state.itemLineTotals[stat.key] * 100 : (state.detected[stat.key] ?? null);
  const badge = s => s.cap === null ? '<span class="badge unknown">Ismeretlen</span>' : `<span class="badge">max. ${s.cap}${s.unit === "pont" ? " pont*" : "%"}</span>`;
  const row = s => {
    const value = effective(s);
    const known = value !== null;
    const soft = softLimited(s.key), observed = panelValue(s.key);
    const applied = !known ? null : s.cap === null ? value : Math.min(s.cap, value);
    const excess = !known || s.cap === null ? 0 : Math.max(0, value - s.cap);
    const manual = Object.prototype.hasOwnProperty.call(state.manual, s.key);
    const unit = s.unit === "pont" ? " pont" : "%";
    const partial = state.apiReady && ["critDamage","skillDamage","vsBoss","potionHeal","lifesteal","damageTaken"].includes(s.key) && !manual;
    if (soft) return `<div class="stat"><div class="stat-top"><span class="name">${s.name}</span>${badge(s)}</div><div class="meta">Nyers ismert rész: ${known ? format(value) + unit : "–"} · ${isNumber(observed) ? "Bónuszok panel: " + format(observed) + unit : "Módosított érték: még nem igazolt"}</div></div>`;
    return `<div class="stat"><div class="stat-top"><span class="name">${s.name}</span>${badge(s)}</div>
      <div class="stat-mid"><input aria-label="${s.name} értéke" data-stat="${s.key}" inputmode="decimal" placeholder="–" value="${known ? String(value) : ""}" />
      <div class="meter"><div class="fill ${excess > 0 ? "over" : ""}" style="width:${known ? Math.min(100, 100 * applied / (s.cap ?? Math.max(value, 1))) : 0}%"></div></div></div>
      <div class="meta"><span>${known ? `${partial ? "Felszerelésből ismert rész" : "Érvényes / kiolvasott"}: ${format(applied)}${unit}` : "Nincs kiolvasott érték"}${manual ? " · kézi" : known ? " · kiolvasott" : ""}</span><span class="${excess ? "warning" : ""}">${excess ? `Biztos túllépés: ${format(excess)}${unit}` : s.cap === null ? "Nincs ismert cap" : ""}</span></div>${s.key === "critDamage" && state.critFromItem && !manual && !equippedEntries().length ? '<div class="meta warning">Csak egy megfigyelt tárgy, nem a teljes felszerelés.</div>' : ""}${s.key === "defense" ? `<div class="meta">${state.defenseReduction !== null ? `Súgó szerinti csökkentés: ${format(state.defenseReduction)}% / 75%` : "A pontos csökkentéshez nyisd meg a Védelem súgóját."}</div>` : ""}</div>`;
  };
  function raidPanel() { return '<section data-ssa-raid-panel></section>'; }
  function equipmentPanel() {
    const count = state.apiReady ? state.apiItemCount : equippedEntries().length;
    const total = equippedTotal();
    const rows = equipSlots.map(s => `<div class="equip-row"><span class="equip-label">${s.name}</span><input data-equip="${s.key}" title="Kritikus sebzésbónusz százalékban" placeholder="–" value="${state.equipped[s.key] ?? ""}"><input data-skill-equip="${s.key}" title="Képességsebzés-bónusz százalékban" placeholder="–" value="${state.skillEquipped[s.key] ?? ""}"><input data-crit-equip="${s.key}" title="Kritikus esély százalékban" placeholder="–" value="${state.critChanceEquipped[s.key] ?? ""}"></div>`).join("");
    return `<section class="equip-section"><div class="raid-title">🛡️ Felszerelt itemek</div><div class="equip-hint">${state.apiReady ? "Automatikus kiolvasás: Character API → items → equippedSlot + lines; a tárgy alapbónuszait a Content API sablonjai és a fejlesztési szorzók adják. A hátizsák tárgyait kizárjuk." : "A játék frissítése után az API automatikusan feltölti a felszerelt tárgyakat. Addig a viselt tárgy adatlapja vagy a kézi mezők használhatók."}</div><div class="equip-summary">${count ? `${format(total)}% kritikus sebzés / ${stats.find(s=>s.key==="critDamage").cap}% · ${count} hely ellenőrizve` : "Még nincs ellenőrzött felszerelés."}<div>${Object.keys(state.skillEquipped).length ? `${format(skillTotal())}% képességsebzés / ${stats.find(s=>s.key==="skillDamage").cap}%` : "Képességsebzés: nincs kiolvasott adat"}</div></div><div class="equip-row"><span class="equip-label">Hely</span><span class="equip-hint">Krit. dmg</span><span class="equip-hint">Képesség</span><span class="equip-hint">Krit. esély</span></div>${rows}<button class="reset" data-equip-reset>Felszerelés-adatok törlése</button></section>`;
  }
  function sourcePanel() {
    const sources = state.apiCharacter?.modSources || [];
    const mods = state.apiCharacter?.mods || {};
    const display = { xpMult: "XP", nyangMult: "Nyang", dropMult: "Zsákmány", atkMult: "Támadás", defMult: "Védelem", hpMult: "Életerő", critBonus: "Kritikus esély", evadeBonus: "Kitérés", skillDamage: "Képesség-sebzés", critDamage: "Kritikus sebzés" };
    const formatEffect = (key, value) => /Mult$/.test(key) ? `×${format(value)} (${value >= 1 ? "+" : ""}${format((value - 1) * 100)}%)` : /(?:Bonus|Chance|Damage|Heal|Evade|Crit)$/.test(key) && Math.abs(value) <= 2 ? `${value >= 0 ? "+" : ""}${format(value * 100)}%` : format(value);
    const totalRows = Object.entries(mods).filter(([key, value]) => isNumber(value) && /(?:xp|nyang|drop|atk|def|hp|crit|evade|skill|damage|boss|heal)/i.test(key)).slice(0, 25).map(([key,value]) => `<tr><td>${escapeHtml(display[key] || key)}</td><td>${escapeHtml(formatEffect(key, value))}</td></tr>`).join("");
    const sourceRows = sources.filter(item => Object.keys(item.effect || {}).length).slice(0, 30).map(item => `<tr><td>${escapeHtml(item.source || "Egyéb forrás")}</td><td>${Object.entries(item.effect).map(([key, val]) => `${escapeHtml(display[key] || key)} ${escapeHtml(formatEffect(key, val))}`).join(" · ")}</td></tr>`).join("");
    return `<section class="equip-section"><div class="raid-title">✨ Bónuszok és források</div><div class="source-note">${state.apiReady ? `Character API: ${sources.length} bónuszforrás. A játék szerinti módosítókat mutatjuk, nem egy második, esetleg duplán számolt összegzést.` : "Az adatok a játék első Character API-kérésével érkeznek. Ha itt nincs adat, frissítsd az oldalt."}</div><details><summary>Összesített API-módosítók (${Object.keys(mods).length})</summary><table class="source-table"><tbody>${totalRows || '<tr><td>Még nincs adat</td></tr>'}</tbody></table></details><details><summary>Részletes források (${sources.length})</summary><table class="source-table"><tbody>${sourceRows || '<tr><td>Még nincs adat</td></tr>'}</tbody></table></details><div class="source-note">A bónuszlap képei szerint az XP/nyang/zsákmány alap plafonja +100%, külön vásárolt rész viheti tovább; a támadás, védelem és életerő bónuszplafonja +50%. Ezeket még ellenőrizni kell az API képletével, ezért a hiányzó nyers értékre nem írunk kitalált túllépést.</div></section>`;
  }
  function dashboardModel(){
    const fresh=state.apiSeenAt&&Date.now()-state.apiSeenAt<=300000;
    return StonestormCompanionStats.model(fresh?state.apiCharacter:null,state.apiContent,Date.now()-(state.bonusPanel?.at||0)<=300000?state.bonusPanel?.values:{},{crit:Object.keys(state.critChanceEquipped).length?Object.values(state.critChanceEquipped).reduce((a,b)=>a+b,0):null,critDamage:equippedEntries().length?equippedTotal():null,skillDamage:Object.keys(state.skillEquipped).length?skillTotal():null});
  }
  function render(){
    const development=companion.preferences().development,model=dashboardModel(),overview=StonestormCompanionComponents.overview(model,{development});
    const detail='<details class="summary-fold" data-section="advanced"><summary>Részletes statok és kézi értékek</summary>'+trackingPanel()+'<div class="list">'+stats.map(row).join('')+'</div><button class="reset" type="button" data-reset>Kézi statadatok törlése</button></details><details class="summary-fold" data-section="equipment"><summary>Bónuszforrások és felszerelésértékek</summary>'+sourcePanel()+equipmentPanel()+'</details>';
    companion.update(overview,StonestormCompanionComponents.stats(model,{development})+(development?'<section data-development-only><h3>Fejlesztés alatt · részletes diagnosztika</h3>'+detail+'</section>':''),model);
  }
  wrap.addEventListener('click',e=>{
    if(e.target.closest('[data-reset]')){state.manual={};chrome.storage.local.remove(STORAGE_KEY);render();}
    if(e.target.closest('[data-equip-reset]')){state.equipped={};state.skillEquipped={};state.critChanceEquipped={};chrome.storage.local.remove([ITEM_KEY,SKILL_KEY,CRIT_CHANCE_KEY]);render();}
    if(e.target.closest('[data-debug]'))companion.select('stats');
  });
  wrap.addEventListener("click", e => {
    const section = e.target.closest("details[data-section] > summary")?.parentElement;
    if (section) state.openSections[section.dataset.section] = !section.open;
  });
  wrap.addEventListener("change", e => {
    if (e.target?.dataset?.potion) {
      const id = e.target.dataset.potion;
      const active = (state.apiCharacter?.buffs || []).some(buff => `${buff.kind}|${buff.expiresAt || ""}` === id);
      if (!active || !["nyang", "coin", ""].includes(e.target.value)) return;
      if (e.target.value) state.potionPayments[id] = e.target.value;
      else delete state.potionPayments[id];
      chrome.storage.local.set({ [POTION_KEY]: state.potionPayments });
      render(); return;
    }
    const equip = e.target?.dataset?.equip ?? e.target?.dataset?.skillEquip ?? e.target?.dataset?.critEquip;
    if (equip && equipSlots.some(s => s.key === equip)) {
      const raw = e.target.value.trim();
      const value = raw ? parse(raw) : null;
      if (raw && value === null) { e.target.setCustomValidity("Nemnegatív számot adj meg."); e.target.reportValidity(); return; }
      const isSkill = Boolean(e.target.dataset.skillEquip);
      const isCrit = Boolean(e.target.dataset.critEquip);
      const target = isCrit ? state.critChanceEquipped : isSkill ? state.skillEquipped : state.equipped;
      if (!raw) delete target[equip]; else target[equip] = value;
      chrome.storage.local.set({ [isCrit ? CRIT_CHANCE_KEY : isSkill ? SKILL_KEY : ITEM_KEY]: target }); render(); return;
    }
    const key = e.target?.dataset?.stat;
    if (!key) return;
    const raw = e.target.value.trim();
    if (!raw) delete state.manual[key];
    else {
      const v = parse(raw);
      if (v === null) { e.target.setCustomValidity("Csak pozitív szám adható meg."); e.target.reportValidity(); return; }
      state.manual[key] = v;
    }
    chrome.storage.local.set({ [STORAGE_KEY]: state.manual });
    render();
  });
  function scanEquippedItems() {
    if (state.apiReady) return false;
    const slotByName = {
      "fegyver": "weapon", "páncél": "armor", "sisak": "helmet", "pajzs": "shield",
      "csizma": "boots", "cipő": "boots", "karkötő": "bracelet", "nyaklánc": "necklace",
      "fülbevaló": "earring"
    };
    let changed = false;
    for (const card of document.querySelectorAll(".itip.icard")) {
      const sheet = card.closest(".sheet");
      if (sheet && getComputedStyle(sheet).display === "none") continue;
      const worn = Array.from(card.querySelectorAll(".itip__chip")).some(el => /\bviselve\b/i.test(el.textContent || "")) ||
        Array.from(sheet?.querySelectorAll(".sheet__actions button") || []).some(el => /\bleveszem\b/i.test(el.textContent || ""));
      if (!worn) continue;
      const slotName = (card.querySelector(".icard__slot")?.textContent || "").trim().toLowerCase();
      const slot = slotByName[slotName];
      if (!slot) continue;
      const readBonus = key => {
        const row = card.querySelector(`.icard__row[data-stat="bonus-${key}"]`);
        if (!row) return 0;
        const value = row.querySelector(".icard__val")?.textContent || "";
        const match = value.match(/([+-]?\d+(?:[,.]\d+)?)\s*%/);
        return match ? parse(match[1]) : null;
      };
      const crit = readBonus("critDamage");
      const skill = readBonus("skillDamage");
      const critRow = card.querySelector('.icard__row[data-stat="crit"]');
      const critValue = critRow?.querySelector("dd.num")?.textContent || critRow?.querySelector("dd")?.textContent || "";
      const critChanceMatch = critValue.match(/([+-]?\d+(?:[,.]\d+)?)\s*%/);
      const critChance = critChanceMatch ? parse(critChanceMatch[1]) : 0;
      if (crit !== null && state.equipped[slot] !== crit) { noteChange(`${slotName} · krit. sebzés`, state.equipped[slot], crit); state.equipped[slot] = crit; changed = true; }
      if (skill !== null && state.skillEquipped[slot] !== skill) { noteChange(`${slotName} · képesség`, state.skillEquipped[slot], skill); state.skillEquipped[slot] = skill; changed = true; }
      if (critChance !== null && state.critChanceEquipped[slot] !== critChance) { noteChange(`${slotName} · krit. esély`, state.critChanceEquipped[slot], critChance); state.critChanceEquipped[slot] = critChance; changed = true; }
    }
    if (changed) chrome.storage.local.set({ [ITEM_KEY]: state.equipped, [SKILL_KEY]: state.skillEquipped, [CRIT_CHANCE_KEY]: state.critChanceEquipped });
    return changed;
  }
  function scan() {
    if (!document.body) return;
    const text = companion.preferences().development&&!state.apiReady?(document.body.innerText||''):'';
    const characterChanged = scanCharacterValues(text);
    const panelLabels = { crit: "Kritikus es?ly", critDamage: "Kritikus sebzés(?:bónusz)?", skillDamage: "Képesség[- ]?sebzés(?:bónusz)?", lifesteal: "Életlopás", damageTaken: "Sebzéscsökkentés", vsBoss: "Bossok ellen", potionHeal: "Gyógyital-hatás" };
    const oldPanel = JSON.stringify(state.bonusPanel?.values ?? {}), panelValues = {};
    // Only an explicitly titled, currently visible Bonuses panel is a witness.
    const headings = [...document.querySelectorAll("h1,h2,h3,h4,[role=heading]")].filter(el => /^Bónuszok$/i.test(el.textContent.trim()) && el.getClientRects().length);
    for (const title of headings) {
      const container = title.closest("[role=dialog],section,article") ?? title.parentElement;
      const panelText = container?.innerText ?? "";
      if (panelText.length > 12000) continue;
      for (const [key, label] of Object.entries(panelLabels)) {
        const match = panelText.match(new RegExp("(?:^|\\n)\\s*" + label + "\\s*[:+]?\\s*(\\d+(?:[,.]\\d+)?)\\s*%", "im"));
        if (match) panelValues[key] = parse(match[1]);
      }
    }
    if(Object.keys(panelValues).length)state.bonusPanel = { values: panelValues, at: Date.now() };
    const panelChanged = oldPanel !== JSON.stringify(panelValues);
    const equipmentChanged = state.apiReady?false:scanEquippedItems();
    const reduction = text.match(/(?:ellen|against)\s*:\s*(\d+(?:[,.]\d+)?)\s*%\s*\.\s*(?:plafon|cap)/i);
    const oldReduction = state.defenseReduction;
    if (reduction) state.defenseReduction = parse(reduction[1]);
    const defenseThreshold = text.match(/(?:plafon|cap)\s*:\s*75\s*%\s*,?\s*(\d+)\s*(?:védelemnél|defen[cs]e)/i);
    const oldDefenseCap = stats[0].cap;
    // A raw defence threshold reaching 75% is not a maximum defence value.
    const found = {};
    for (const s of stats) {
      for (const regex of s.patterns) {
        const match = text.match(regex);
        if (match) { found[s.key] = parse(match[1]); break; }
      }
    }
    // The separate XP/nyang breakdown reports the actual total, including items,
    // scrolls, pass, companion and guild. It takes precedence over equipment-only lines.
    const bonusHeading = text.match(/XP\s*[-–]?\s*és\s*nyangbónuszok/i);
    if (bonusHeading) {
      const section = text.slice(bonusHeading.index + bonusHeading[0].length, bonusHeading.index + bonusHeading[0].length + 950).split(/(?:^|\n)\s*Fiók\s*:/i)[0];
      const xpTotal = section.match(/(?:^|\n)\s*Tapasztalat\s*\+?\s*(\d+(?:[,.]\d+)?)\s*%/im);
      const nyangTotal = section.match(/(?:^|\n)\s*Nyang\s*\+?\s*(\d+(?:[,.]\d+)?)\s*%/im);
      if (xpTotal) found.xp = parse(xpTotal[1]);
      if (nyangTotal) found.nyang = parse(nyangTotal[1]);
      state.aggregateXp = Boolean(xpTotal);
      state.aggregateNyang = Boolean(nyangTotal);
    }
    if (state.apiReady && isNumber(state.apiCharacter?.derived?.critChance)) found.crit = state.apiCharacter.derived.critChance * 100;
    if (panelChanged || JSON.stringify(found) !== JSON.stringify(state.detected) || oldReduction !== state.defenseReduction || oldDefenseCap !== stats[0].cap || equipmentChanged || characterChanged) {
      state.detected = found;
      if (!shadow.activeElement?.matches("input,select")) render();
    }
  }
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => { scheduled = false; scan(); }, 900);
  };
  chrome.storage.local.get(STORAGE_KEY, data => {
    if (chrome.runtime.lastError) return;
    const saved = data[STORAGE_KEY];
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      for (const s of stats) if (typeof saved[s.key] === "number" && saved[s.key] >= 0) state.manual[s.key] = saved[s.key];
    }
    scan(); render();
  });
  chrome.storage.local.get(POTION_KEY, data => {
    const saved = data[POTION_KEY];
    if (saved && typeof saved === "object" && !Array.isArray(saved)) state.potionPayments = saved;
    render();
  });
  chrome.storage.local.get(ITEM_KEY, data => {
    if (state.apiReady) return;
    const saved = data[ITEM_KEY];
    if (saved && typeof saved === "object") {
      for (const s of equipSlots) if (typeof saved[s.key] === "number" && Number.isFinite(saved[s.key]) && saved[s.key] >= 0) state.equipped[s.key] = saved[s.key];
    }
    render();
  });
  chrome.storage.local.get(SKILL_KEY, data => {
    if (state.apiReady) return;
    const saved = data[SKILL_KEY];
    if (saved && typeof saved === "object") {
      for (const s of equipSlots) if (typeof saved[s.key] === "number" && Number.isFinite(saved[s.key]) && saved[s.key] >= 0) state.skillEquipped[s.key] = saved[s.key];
    }
    render();
  });
  chrome.storage.local.get(CRIT_CHANCE_KEY, data => {
    if (state.apiReady) return;
    const saved = data[CRIT_CHANCE_KEY];
    if (saved && typeof saved === "object") {
      for (const s of equipSlots) if (typeof saved[s.key] === "number" && Number.isFinite(saved[s.key]) && saved[s.key] >= 0) state.critChanceEquipped[s.key] = saved[s.key];
    }
    render();
  });
  render();
  StonestormCompanionState.shared(chrome.storage).subscribe(()=>render());
  new MutationObserver(schedule).observe(document.body || document.documentElement, { subtree: true, childList: true, characterData: true });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) schedule(); });
})();
