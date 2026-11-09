(() => {
  "use strict";
  if (window.top !== window || document.getElementById("ss-statcap-root")) return;

  const STORAGE_KEY = "stonestormStatCap.v1";
  const RAID_KEY = "stonestormRaidCalc.v1";
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
  const raidKinds = [{ key: "short", name: "Rövid", marker: /rövid út/i }, { key: "medium", name: "Közepes", marker: /közepes út/i }, { key: "long", name: "Hosszú", marker: /hosszú út/i }];
  const stats = [
    { key: "defense", name: "Védelem", cap: 1380, unit: "pont", patterns: [/(?:^|\n)\s*(?:védelem|defense)\s*:?\s*(\d+(?:[,.]\d+)?)(?=\s|$)/im] },
    { key: "crit", name: "Kritikus esély (érvényes)", cap: 50, source: "Karakter · max. 50%", patterns: [/(?:kritikus esély|critical chance)\s*[:+]?\s*(\d+(?:[,.]\d+)?)\s*%/i] },
    { key: "evadeBoss", name: "Kitérés · boss ellen", cap: 12, source: "Összes kitérésből számolva", patterns: [/(?:összes kitérés|total evasion|total evade)\s*[:+]?\s*(\d+(?:[,.]\d+)?)\s*%/i] },
    { key: "evadeMob", name: "Kitérés · normál szörny", cap: 35, source: "Összes kitérésből számolva", patterns: [/(?:összes kitérés|total evasion|total evade)\s*[:+]?\s*(\d+(?:[,.]\d+)?)\s*%/i] },
    { key: "critDamage", name: "Kritikus sebzésbónusz", cap: 75, source: "Felszerelt itemek összegzője", patterns: [] },
    { key: "skillDamage", name: "Képességsebzés-bónusz", cap: 50, source: "Felszerelt itemek összegzője", patterns: [] },
    { key: "vsBoss", name: "Bossok elleni sebzésbónusz", cap: 35, source: "Content API", patterns: [] },
    { key: "potionHeal", name: "Gyógyító hatás bónusza", cap: 25, source: "Content API", patterns: [] },
    { key: "lifesteal", name: "Életlopás", cap: 8, source: "Content API", patterns: [] },
    { key: "damageTaken", name: "Kapott sebzés módosító", cap: 20, source: "Content API", patterns: [] },
    { key: "xp", name: "Összes XP-bónusz", cap: null, source: "Tapasztalat (összesen)", patterns: [/(?:összes xp.bónusz|xp.bónusz|xp bonus)\s*[:+]?\s*(\d+(?:[,.]\d+)?)\s*%/i] },
    { key: "nyang", name: "Összes nyangbónusz", cap: null, source: "Nyang (összesen)", patterns: [/(?:összes nyangbónusz|nyangbónusz|nyang bonus)\s*[:+]?\s*(\d+(?:[,.]\d+)?)\s*%/i] }
  ];
  const state = { visible: false, manual: {}, detected: {}, updated: null, defenseReduction: null, raids: {}, raidManual: {}, itemCrit: null, itemCritSeenAt: 0, critFromItem: false, aggregateXp: false, aggregateNyang: false, equipped: {}, skillEquipped: {}, critChanceEquipped: {}, itemLineTotals: {}, totals: {}, baseStats: {}, changes: [], apiReady: false, apiEquipmentComplete: false, apiItemCount: 0, apiCharacter: null, apiContent: null, panelWidth: 430, panelHeight: 590, maximized: false, panelLeft: null, panelTop: null, resizing: false, openSections: {}, debugVisible: false, potionPayments: {} };
  const root = document.createElement("div");
  root.id = "ss-statcap-root";
  root.style.cssText = "position:fixed;bottom:16px;right:16px;z-index:2147483647;pointer-events:none";
  const shadow = root.attachShadow({ mode: "closed" });
  document.documentElement.append(root);

  const style = document.createElement("style");
  style.textContent = `
    :host{all:initial} *{box-sizing:border-box}
    .wrap{font:13px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;color:#f6ead4;pointer-events:auto}
    button,input{font:inherit} button{cursor:pointer}
    .toggle{float:right;background:#21170f;color:#f6d996;border:1px solid #bd9248;border-radius:14px;padding:10px 14px;box-shadow:0 4px 22px #0009;font-weight:750}
    .toggle:focus-visible,.head button:focus-visible,input:focus-visible{outline:2px solid #f5d37a;outline-offset:2px}
    .panel{clear:both;min-width:min(330px,calc(100vw - 32px));min-height:230px;max-width:calc(100vw - 32px);max-height:calc(100vh - 110px);overflow:auto;resize:none;container-type:inline-size;background:linear-gradient(155deg,#231b18,#111723);border:1px solid #987242;border-radius:16px;box-shadow:0 12px 38px #000c;margin-bottom:8px;touch-action:auto}
    .panel{scrollbar-width:thin;scrollbar-color:#b38a4d #19181d;scrollbar-gutter:stable}
    .panel::-webkit-scrollbar{width:10px;height:10px}.panel::-webkit-scrollbar-track{background:#19181d;border-radius:10px}.panel::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#c49a58,#7b572f);border:2px solid #19181d;border-radius:10px}.panel::-webkit-scrollbar-thumb:hover{background:#e0b56a}
    .panel.maximized{resize:none}.panel-content{display:block}.left-col,.right-col{min-width:0}
    @container (min-width:720px){.panel-content{display:grid;grid-template-columns:minmax(290px,1fr) minmax(340px,1.1fr)}.right-col{border-left:1px solid #796344}.left-col .list{padding:10px 16px}}
    @container (min-width:1200px){.unified-results{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:11px}.unified-row{padding:12px;border:1px solid #574832;border-radius:10px;background:#19191e;min-height:90px}.unified-row:last-child{border-bottom:1px solid #574832}.unified>.tracking-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
    .head{padding:15px;border-bottom:1px solid #5b4734;display:flex;justify-content:space-between;gap:12px;align-items:start}
    h2{font-size:16px;margin:0;color:#f5ce7e} .subtitle{color:#c7bba6;font-size:11px;margin:3px 0 0}
    .head button{color:#e9d6b5;background:transparent;border:1px solid #826743;border-radius:8px;padding:4px 8px}.head-actions{display:flex;gap:6px;white-space:nowrap}
    .list{padding:9px 12px 4px} .stat{padding:10px 0;border-bottom:1px solid #493c38}
    .stat-top{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
    .name{font-size:12px;font-weight:700} .badge{color:#111;border-radius:5px;background:#dfc07d;padding:2px 5px;font-size:10px;white-space:nowrap}
    .badge.unknown{background:#67717d;color:#fff}
    .stat-mid{display:flex;gap:10px;align-items:center;margin-top:6px}
    input{width:78px;background:#121721;color:#fff3d7;border:1px solid #6f5a43;border-radius:7px;padding:5px 7px;min-width:0}
    .meter{flex:1;height:9px;background:#11131b;border:1px solid #625546;border-radius:9px;overflow:hidden}
    .fill{height:100%;background:linear-gradient(90deg,#4d9e79,#ebc36a);border-radius:9px}
    .fill.over{background:linear-gradient(90deg,#c59c54,#dd685d)}
    .meta{color:#c4bba9;font-size:11px;margin-top:5px;display:flex;justify-content:space-between;gap:8px}
    .warning{color:#ffa395} .footer{padding:11px 13px;font-size:11px;color:#c7bca9}
    .reset{background:#332c28;border:1px solid #836e4b;color:#f7dfa4;border-radius:8px;padding:6px 9px;margin-top:8px}
    .hidden{display:none} .small{opacity:.8} .legend{padding:8px 13px;background:#151a22;color:#bfb6a9;font-size:11px}
    .raid-section{border-top:1px solid #97764d;padding:13px}.raid-title{color:#f5ce7e;font-weight:800;font-size:15px;margin-bottom:5px}
    .raid-table{width:100%;border-collapse:collapse;font-size:11px}.raid-table th,.raid-table td{padding:5px 3px;text-align:right;border-bottom:1px solid #514337}.raid-table th:first-child,.raid-table td:first-child{text-align:left}
    .raid-table input{width:55px;padding:4px 2px;text-align:right}.raid-best{color:#79e0a9;font-weight:bold}.raid-note{font-size:11px;color:#c7bca9;margin-top:8px}
    .equip-section{border-top:1px solid #97764d;padding:13px}.equip-row{display:grid;grid-template-columns:minmax(70px,1fr) repeat(3,minmax(48px,90px));align-items:center;gap:6px;padding:6px 0;border-bottom:1px solid #514337;max-width:680px}
    .equip-label{font-size:11px;min-width:0}.equip-row input{width:100%}.equip-row button{background:#31291f;color:#f4db9f;border:1px solid #8a7049;border-radius:7px;padding:5px;font-size:10px}
    .equip-summary{color:#82e6ad;font-weight:750;margin:8px 0}.equip-hint{font-size:11px;color:#c9bda9}
    .tracking{padding:12px 14px;border-bottom:1px solid #796344}.tracking-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
    .tracking-cell{background:#151922;border:1px solid #423b34;border-radius:7px;padding:7px;font-size:11px}.tracking-cell b{display:block;color:#f8d995;font-size:14px}
    .delta-up{color:#79e0a9}.delta-down{color:#ff8883}.delta-list{display:grid;gap:4px;font-size:11px;margin-top:7px}
    .summary-note{color:#cbbfae;font-size:11px;margin:7px 0}
    .source-chip{color:#8de3b3;font-weight:750}.known-stat{color:#f0cf7b;font-weight:750}
    .source-table{width:100%;border-collapse:collapse;font-size:11px}.source-table th,.source-table td{border-bottom:1px solid #4b4038;padding:4px;text-align:left;vertical-align:top}.source-table td:last-child{text-align:right;font-variant-numeric:tabular-nums}.source-note{font-size:11px;color:#beae96}
    .unified{padding:12px 14px}.unified-row{padding:9px 0;border-bottom:1px solid #4f4238}.unified-row:last-child{border-bottom:0}.unified-top{display:flex;align-items:center;justify-content:space-between;gap:10px;font-weight:700}.unified-top b{color:#f5d17d;font-size:16px;white-space:nowrap}.unified-info{font-size:11px;color:#cdbfa7;margin-top:3px}.unified-warn{color:#ff9d8e}.unified-good{color:#82e6ad}.summary-fold{margin:8px 12px;border:1px solid #756144;border-radius:9px;overflow:hidden}.summary-fold>summary{cursor:pointer;background:#272017;color:#f0cc85;font-weight:750;padding:9px 12px}.summary-fold[open]>summary{border-bottom:1px solid #756144}
    .stat-detail{margin-top:6px}.stat-detail>summary{cursor:pointer;color:#ecc985;font-size:11px;list-style-position:inside}.stat-detail[open]{border-top:1px dashed #66543a;padding-top:6px}.stat-sources{padding:5px 0 3px 12px;font-size:11px;color:#cdbfa7}.stat-sources>div{padding:2px 0}.debug-tools{padding:8px 12px;border-top:1px solid #5b4734}.debug-tools>button{background:transparent;border:0;color:#bbaa8a;font-size:11px;text-decoration:underline}.debug-content{padding:2px 0 10px}.debug-content .summary-fold{margin:8px 0}.raid-section{border-top:0}
    .potion-choice{margin-top:7px;padding:8px;background:#29221b;border:1px solid #8a7049;border-radius:8px;font-size:11px}.potion-choice select{max-width:100%;margin-top:4px;background:#121721;color:#f8d995;border:1px solid #8a7049;padding:5px;border-radius:6px}
    @media(max-width:480px){.panel{max-height:75vh}.toggle{padding:9px 11px}}
  `;
  shadow.append(style);
  const wrap = document.createElement("div");
  wrap.className = "wrap";
  shadow.append(wrap);
  const sizeObserver = new ResizeObserver(entries => {
    if (state.maximized || state.resizing || !state.visible || !entries.length) return;
    const rect = entries[0].target.getBoundingClientRect();
    if (rect.width >= 330) state.panelWidth = Math.round(rect.width);
    if (rect.height >= 230) state.panelHeight = Math.round(rect.height);
  });
  function edgeAt(event, rect) {
    const margin = 12;
    const horizontal = event.clientX - rect.left < margin ? "w" : rect.right - event.clientX < margin ? "e" : "";
    const vertical = event.clientY - rect.top < margin ? "n" : rect.bottom - event.clientY < margin ? "s" : "";
    return vertical + horizontal;
  }
  const resizeCursors = { n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize", nw: "nwse-resize", se: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize" };
  let resizeStart = null;
  wrap.addEventListener("pointermove", event => {
    if (resizeStart || state.maximized || !state.visible) return;
    const panel = wrap.querySelector(".panel");
    if (!panel || !panel.contains(event.target)) return;
    panel.style.cursor = resizeCursors[edgeAt(event, panel.getBoundingClientRect())] || "";
  }, true);
  wrap.addEventListener("pointerdown", event => {
    if (state.maximized || !state.visible || event.button !== 0) return;
    const panel = wrap.querySelector(".panel");
    if (!panel || !panel.contains(event.target)) return;
    const rect = panel.getBoundingClientRect();
    const edge = edgeAt(event, rect);
    if (!edge) return;
    event.preventDefault(); event.stopPropagation();
    resizeStart = { edge, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    state.resizing = true;
  }, true);
  window.addEventListener("pointermove", event => {
    if (!resizeStart) return;
    const a = resizeStart, dx = event.clientX - a.x, dy = event.clientY - a.y;
    const minW = Math.min(330, window.innerWidth - 32), minH = 230;
    const maxW = window.innerWidth - 32, maxH = window.innerHeight - 110;
    const w = Math.min(maxW, Math.max(minW, a.width + (a.edge.includes("e") ? dx : a.edge.includes("w") ? -dx : 0)));
    const h = Math.min(maxH, Math.max(minH, a.height + (a.edge.includes("s") ? dy : a.edge.includes("n") ? -dy : 0)));
    const left = Math.min(window.innerWidth - w - 16, Math.max(16, a.left + (a.edge.includes("w") ? a.width - w : 0)));
    const top = Math.min(window.innerHeight - h - 58, Math.max(16, a.top + (a.edge.includes("n") ? a.height - h : 0)));
    const panel = wrap.querySelector(".panel");
    if (panel) { panel.style.width = `${w}px`; panel.style.height = `${h}px`; }
    state.panelWidth = w; state.panelHeight = h; state.panelLeft = left; state.panelTop = top;
    root.style.left = `${left}px`; root.style.top = `${top}px`;
    root.style.right = "auto"; root.style.bottom = "auto";
  }, true);
  window.addEventListener("pointerup", () => { resizeStart = null; state.resizing = false; });

  const format = n => Number(n).toLocaleString("hu-HU", { maximumFractionDigits: 2 });
  const parseReward = value => {
    if (!value) return null;
    const m = String(value).trim().replace(/\s/g, "").match(/^(\d+(?:[,.]\d+)?)([kKmM])?$/);
    if (!m) return null;
    return Number(m[1].replace(",", ".")) * (m[2]?.toLowerCase() === "k" ? 1000 : m[2]?.toLowerCase() === "m" ? 1000000 : 1);
  };
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
    const itemCritChance = Object.values(state.critChanceEquipped).reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0);
    const hero = state.apiContent?.hero;
    const exactRule = isNumber(hero?.critPerDex) && isNumber(hero?.critBase);
    const dexCrit = isNumber(state.baseStats.dex) && exactRule ? state.baseStats.dex * hero.critPerDex * 100 : null;
    const baseCrit = exactRule ? hero.critBase * 100 : null;
    const critModSources = (state.apiCharacter?.modSources || []).map(source => {
      if (/(?:equipment|gear|item|felszerel)/i.test(source.source || "")) return null; // Already summed from equipped items.
      const effect = source.effect || {};
      const v = effect.critBonus ?? effect.critChanceBonus ?? effect.criticalChanceBonus;
      return isNumber(v) && Math.abs(v) <= 1 ? { source: source.source || "Egyéb", pct: v * 100 } : null;
    }).filter(Boolean);
    const bonusCrit = critModSources.reduce((sum, source) => sum + source.pct, 0);
    const knownRawCrit = itemCritChance + (dexCrit || 0) + (baseCrit || 0) + bonusCrit;
    const observedCrit = state.apiCharacter?.derived?.critChance;
    const capped = isNumber(observedCrit) && observedCrit >= (state.apiContent?.critCap ?? 0.5) - 0.00001;
    const minimum = capped ? Math.max(50, knownRawCrit) : knownRawCrit;
    const critLabel = state.apiReady && exactRule ? `${capped ? "legalább " : "ismert források: "}${format(minimum)}%` : "–";
    const over = minimum > 50 ? `Legalább ${format(minimum - 50)} százalékpont a cap felett.` : capped ? "A kijelzett 50% capelt; a tényleges túllépés még nem ismert." : "A teljes nyers értékhez minden egyéb bónuszforrást is ellenőrizni kell.";
    const origin = state.apiReady ? `<span class="source-chip">● Character API: ${state.apiItemCount}/8 felszerelt tárgy</span>` : `<span class="warning">A Character API még nem érkezett meg. Frissítsd a játékot (F5).</span>`;
    const extra = critModSources.length ? ` · azonosított egyéb források: ${critModSources.map(x=>`${escapeHtml(x.source)} ${x.pct >= 0 ? "+" : ""}${format(x.pct)}%`).join(", ")}` : "";
    const summary = state.apiReady && exactRule ? `Kiolvasott itemek: +${format(itemCritChance)}% · alap: +${format(baseCrit)}% · ${format(state.baseStats.dex)} DEX × ${format(hero.critPerDex * 100)}% = +${format(dexCrit)}%${extra}. Az ismert források összege: <b>${format(knownRawCrit)}%</b>. Nem feltétlenül a teljes nyers stat. ${over}` : "A teljes számításhoz a Character és Content API-válasz szükséges; a kijelzett 50% már limitált érték.";
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
    if (key === "crit" && isNumber(state.baseStats.dex) && isNumber(state.apiContent?.hero?.critPerDex)) rows.push(`Ügyesség: ${format(state.baseStats.dex)} DEX × ${format(state.apiContent.hero.critPerDex * 100)}%`);
    if (key === "critDamage" || key === "skillDamage") rows.push("A felszerelésből ismert érték részleges lehet.");
    return `<details class="stat-detail" data-section="stat-${key}" ${state.openSections[`stat-${key}`] ? "open" : ""}><summary>Honnan jön ez az érték?</summary><div class="stat-sources">${rows.length ? rows.map(text => `<div>${text}</div>`).join("") : "Még nincs részletes forrásadat."}</div></details>`;
  }
  function mainDashboard() {
    const api = state.apiCharacter;
    const limited = (label, raw, cap, info = "") => {
      const has = isNumber(raw);
      const excess = has && isNumber(cap) ? Math.max(0, raw - cap) : 0;
      const effectiveValue = has ? Math.min(raw, cap ?? raw) : null;
      const key = label === "Kritikus esély" ? "crit" : label === "Kritikus sebzésbónusz" ? "critDamage" : "skillDamage";
      return `<div class="unified-row"><div class="unified-top"><span>${label}</span><b>${has ? `${format(effectiveValue)}%` : "–"}</b></div><div class="unified-info">${has ? `Ismert összeg: +${format(raw)}%` : "Nincs még teljes adat"}${isNumber(cap) ? ` · cap: ${format(cap)}%` : ""}${excess ? ` · <span class="unified-warn">legalább ${format(excess)} százalékpont túllépés</span>` : ""}${info ? ` · ${info}` : ""}</div>${statSources(key)}</div>`;
    };
    const reward = (key, label) => {
      const r = rewardBreakdown(key);
      if (!r) return `<div class="unified-row"><div class="unified-top">${label}<b>–</b></div><div class="unified-info">Várjuk az API-adatokat.</div></div>`;
      const capText = r.above > 0 ? `<span class="unified-warn">${format(r.above)} százalékpont nem érvényesül.</span>` : `<span class="unified-good">Nincs túllépés.</span>`;
      const caveat = r.ambiguousPotions.map(p => `<div class="potion-choice">Aktív ${escapeHtml(p.kind)} (+${format(p.percent)}%) – mivel vetted?<select data-potion="${escapeHtml(p.id)}"><option value="">Válaszd ki…</option><option value="nyang">Nyangért (100%-on belül)</option><option value="coin">Storm Coinért (plafon fölött)</option></select></div>`).join("");
      return `<div class="unified-row"><div class="unified-top"><span>${label}</span><b>+${format(r.effective)}%${caveat ? "*" : ""}</b></div><div class="unified-info">Ingyenes: +${format(r.free)}% / 100% · fizetős: +${format(r.paid)}% · nyers: +${format(r.raw)}% · jelenlegi plafon: +${format(r.knownCap)}% (abszolút max. 150%). ${capText}${caveat ? " A * jelű érték a főzet eredetének megadásáig nem végleges." : ""}</div>${caveat}${statSources(key)}</div>`;
    };
    const critSources = (api?.modSources || []).filter(x => !/(?:equipment|gear|item|felszerel)/i.test(x.source || "")).reduce((sum, source) => {
      const value = source.effect?.critBonus ?? source.effect?.critChanceBonus ?? source.effect?.criticalChanceBonus;
      return sum + (isNumber(value) && Math.abs(value) <= 1 ? value * 100 : 0);
    }, 0);
    const gearCrit = Object.values(state.critChanceEquipped).reduce((sum, n) => sum + (isNumber(n) ? n : 0), 0);
    const hero = state.apiContent?.hero;
    const hasCritFormula = isNumber(hero?.critBase) && isNumber(hero?.critPerDex) && isNumber(state.baseStats.dex);
    const critRaw = hasCritFormula ? hero.critBase * 100 + hero.critPerDex * state.baseStats.dex * 100 + gearCrit + critSources : null;
    const cappedCrit = api?.derived?.critChance === 0.5;
    const critMin = isNumber(critRaw) ? Math.max(cappedCrit ? 50 : 0, critRaw) : null;
    const critNote = isNumber(critRaw) ? `Azonosított nyers források: ${format(critRaw)}%. ${cappedCrit && critRaw < 50 ? "A játék 50%-ot ad vissza, tehát további forrás hiányzik." : ""}` : "A nyers számítás még hiányos.";
    const character = api ? `<div class="tracking-grid">${[["HP",api.derived.maxHp],["SP",api.derived.maxSp],["Sebzés",`${format(api.derived.atkMin)}–${format(api.derived.atkMax)}`],["Védelem",api.derived.def],["Harcerő",api.harcero.full],["Kaszt",api.classId || "–"]].map(([label,value])=>`<div class="tracking-cell">${label}<b>${typeof value === "number" ? format(value) : escapeHtml(value ?? "–")}</b></div>`).join("")}</div>` : '<div class="source-note">Játékadatokra várunk; frissítsd az oldalt (F5).</div>';
    return `<section class="unified"><div class="raid-title">📊 Összesített statok</div>${character}<div class="source-note">Minden stat egy helyen. A részletes eredetek és szerkeszthető mezők lent külön lenyithatók.</div><div class="unified-results">${reward("xp","Tapasztalat")}${reward("nyang","Nyang")}${reward("drop","Zsákmány")}${limited("Kritikus esély",critMin,50,critNote)}${limited("Kritikus sebzésbónusz",state.apiReady ? equippedTotal() : null,75,"Felszerelésből ismert rész")}${limited("Képesség-sebzésbónusz",state.apiReady ? skillTotal() : null,50,"Felszerelésből ismert rész")}</div></section>`;
  }
  const equippedEntries = () => Object.values(state.equipped).filter(n => typeof n === "number" && Number.isFinite(n) && n >= 0);
  const equippedTotal = () => equippedEntries().reduce((a, b) => a + b, 0);
  const skillTotal = () => Object.values(state.skillEquipped).reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0);
  const effective = stat => Object.prototype.hasOwnProperty.call(state.manual, stat.key) ? state.manual[stat.key] : stat.key === "critDamage" && equippedEntries().length ? equippedTotal() : stat.key === "skillDamage" && Object.keys(state.skillEquipped).length ? skillTotal() : state.apiReady && isNumber(state.itemLineTotals[stat.key]) ? state.itemLineTotals[stat.key] * 100 : (state.detected[stat.key] ?? null);
  const badge = s => s.cap === null ? '<span class="badge unknown">Ismeretlen</span>' : `<span class="badge">max. ${s.cap}${s.unit === "pont" ? " pont*" : "%"}</span>`;
  const row = s => {
    const value = effective(s);
    const known = value !== null;
    const applied = !known ? null : s.cap === null ? value : Math.min(s.cap, value);
    const excess = !known || s.cap === null ? 0 : Math.max(0, value - s.cap);
    const manual = Object.prototype.hasOwnProperty.call(state.manual, s.key);
    const unit = s.unit === "pont" ? " pont" : "%";
    const partial = state.apiReady && ["critDamage","skillDamage","vsBoss","potionHeal","lifesteal","damageTaken"].includes(s.key) && !manual;
    return `<div class="stat"><div class="stat-top"><span class="name">${s.name}</span>${badge(s)}</div>
      <div class="stat-mid"><input aria-label="${s.name} értéke" data-stat="${s.key}" inputmode="decimal" placeholder="–" value="${known ? String(value) : ""}" />
      <div class="meter"><div class="fill ${excess > 0 ? "over" : ""}" style="width:${known ? Math.min(100, 100 * applied / (s.cap ?? Math.max(value, 1))) : 0}%"></div></div></div>
      <div class="meta"><span>${known ? `${partial ? "Felszerelésből ismert rész" : "Érvényes / kiolvasott"}: ${format(applied)}${unit}` : "Nincs kiolvasott érték"}${manual ? " · kézi" : known ? " · kiolvasott" : ""}</span><span class="${excess ? "warning" : ""}">${excess ? `Biztos túllépés: ${format(excess)}${unit}` : s.cap === null ? "Nincs ismert cap" : ""}</span></div>${s.key === "critDamage" && state.critFromItem && !manual && !equippedEntries().length ? '<div class="meta warning">Csak egy megfigyelt tárgy, nem a teljes felszerelés.</div>' : ""}${s.key === "defense" ? `<div class="meta">${state.defenseReduction !== null ? `Súgó szerinti csökkentés: ${format(state.defenseReduction)}% / 75%` : "A pontos csökkentéshez nyisd meg a Védelem súgóját."}</div>` : ""}</div>`;
  };
  const raidValue = (key, field) => state.raidManual[key]?.[field] ?? state.raids[key]?.[field] ?? null;
  function raidPanel() {
    const available = raidKinds.map(k => ({ ...k, energy: raidValue(k.key, "energy"), xp: raidValue(k.key, "xp"), nyang: raidValue(k.key, "nyang") }));
    const topXp = Math.max(0, ...available.filter(r => r.energy > 0 && r.xp !== null).map(r => r.xp / r.energy));
    const topNyang = Math.max(0, ...available.filter(r => r.energy > 0 && r.nyang !== null).map(r => r.nyang / r.energy));
    const body = available.map(r => {
      const xpPer = r.energy > 0 && r.xp !== null ? r.xp / r.energy : null;
      const nyangPer = r.energy > 0 && r.nyang !== null ? r.nyang / r.energy : null;
      const inputs = ["energy", "xp", "nyang"].map(f => `<td><input data-raid="${r.key}" data-field="${f}" title="${f}: az XP/nyang teljes érték legyen, pl. 87500" value="${state.raidManual[r.key]?.[f] ?? state.raids[r.key]?.[f] ?? ""}" placeholder="–"></td>`).join("");
      return `<tr><td>${r.name}</td>${inputs}</tr><tr><td>1 energiára</td><td>—</td><td class="${xpPer !== null && xpPer === topXp ? "raid-best" : ""}">${xpPer !== null ? format(xpPer) : "–"}</td><td class="${nyangPer !== null && nyangPer === topNyang ? "raid-best" : ""}">${nyangPer !== null ? format(nyangPer) : "–"}</td></tr>`;
    }).join("");
    const detected = Object.keys(state.raids).length;
    return `<section class="raid-section"><div class="raid-title">🏹 Portya összehasonlító</div><div class="raid-note">${detected ? `Automatikusan felismert utak: ${detected}/3.` : "Nyisd meg a Vadászat → Portyák oldalt az automatikus kiolvasáshoz."} A zöld szám a legjobb hozam/energia.</div><table class="raid-table"><thead><tr><th>Út</th><th>Energia</th><th>XP</th><th>Nyang</th></tr></thead><tbody>${body}</tbody></table><div class="raid-note">A mezők kézzel felülírhatók. Az XP és nyang értékét teljes számmal add meg (pl. 87500). A portya időtartamát nem veszi figyelembe a rangsor.</div><button class="reset" data-raid-reset>Kézi portyaadatok törlése</button></section>`;
  }
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
  function render() {
    sizeObserver.disconnect();
    const width = state.maximized ? "calc(100vw - 32px)" : `${state.panelWidth}px`;
    const height = state.maximized ? "calc(100vh - 110px)" : `${state.panelHeight}px`;
    wrap.innerHTML = `<div class="${state.visible ? "" : "hidden"} panel ${state.maximized ? "maximized" : ""}" style="width:${width};height:${height}"><div class="head"><div><h2>⚔️ Stonestorm stat limitek</h2><p class="subtitle">Statok és portyák – minden egy helyen</p></div><div class="head-actions"><button type="button" data-maximize title="Teljes méret / vissza">${state.maximized ? "❐" : "□"}</button><button type="button" data-close title="Bezárás">×</button></div></div><div class="panel-content"><div class="left-col">${mainDashboard()}</div><div class="right-col">${raidPanel()}</div></div><div class="debug-tools"><button type="button" data-debug>${state.debugVisible ? "▲ Hibakeresés elrejtése" : "⚙ Hibakeresés / kézi adatok"}</button>${state.debugVisible ? `<div class="debug-content"><details class="summary-fold" data-section="advanced" ${state.openSections.advanced ? "open" : ""}><summary>Részletes statok és kézi értékek</summary>${trackingPanel()}<div class="list">${stats.map(row).join("")}</div><button class="reset" type="button" data-reset>Kézi statadatok törlése</button></details><details class="summary-fold" data-section="equipment" ${state.openSections.equipment ? "open" : ""}><summary>API-források és felszerelések ellenőrzése</summary>${sourcePanel()}${equipmentPanel()}</details></div>` : ""}</div></div><button class="toggle" type="button" data-toggle aria-expanded="${state.visible}">📊 ${state.visible ? "Stat panel elrejtése" : "Stat limitek"}</button>`;
    if (state.visible) {
      if (state.panelLeft === null || state.panelTop === null) {
        const rect = wrap.querySelector(".panel").getBoundingClientRect();
        state.panelLeft = rect.left; state.panelTop = rect.top;
      }
      root.style.left = `${state.maximized ? 16 : state.panelLeft}px`;
      root.style.top = `${state.maximized ? 16 : state.panelTop}px`;
      root.style.right = "auto"; root.style.bottom = "auto";
      sizeObserver.observe(wrap.querySelector(".panel"));
    }
  }
  function dockClosedPanel() {
    state.visible = false;
    state.maximized = false;
    state.panelWidth = 430;
    state.panelHeight = 590;
    state.panelLeft = null;
    state.panelTop = null;
    root.style.left = "auto";
    root.style.top = "auto";
    root.style.right = "16px";
    root.style.bottom = "16px";
  }
  wrap.addEventListener("click", e => {
    if (e.target.closest("[data-toggle]")) { if (state.visible) dockClosedPanel(); else state.visible = true; }
    else if (e.target.closest("[data-maximize]")) state.maximized = !state.maximized;
    else if (e.target.closest("[data-close]")) dockClosedPanel();
    else if (e.target.closest("[data-debug]")) state.debugVisible = !state.debugVisible;
    else if (e.target.closest("[data-reset]")) { state.manual = {}; chrome.storage.local.remove(STORAGE_KEY); }
    else if (e.target.closest("[data-raid-reset]")) { state.raidManual = {}; chrome.storage.local.remove(RAID_KEY); }
    else if (e.target.closest("[data-equip-reset]")) { state.equipped = {}; state.skillEquipped = {}; state.critChanceEquipped = {}; chrome.storage.local.remove([ITEM_KEY, SKILL_KEY, CRIT_CHANCE_KEY]); }
    else return;
    render();
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
    const raid = e.target?.dataset?.raid;
    const field = e.target?.dataset?.field;
    if (raid && field && raidKinds.some(k => k.key === raid) && ["energy", "xp", "nyang"].includes(field)) {
      const raw = e.target.value.trim();
      const value = raw ? parseReward(raw) : null;
      if (raw && (value === null || (field === "energy" && (!Number.isInteger(value) || value < 1)))) { e.target.setCustomValidity("Pozitív számot adj meg; az energia egész szám legyen."); e.target.reportValidity(); return; }
      if (!state.raidManual[raid]) state.raidManual[raid] = {};
      if (!raw) delete state.raidManual[raid][field]; else state.raidManual[raid][field] = value;
      chrome.storage.local.set({ [RAID_KEY]: state.raidManual }); render(); return;
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
  function scanRaids(text) {
    const found = {};
    for (const r of raidKinds) {
      const match = r.marker.exec(text);
      if (!match) continue;
      const next = raidKinds.map(other => other.marker.exec(text.slice(match.index + match[0].length))).filter(Boolean).map(x => x.index);
      const section = text.slice(match.index, match.index + match[0].length + (next.length ? Math.min(...next) : 350)).slice(0, 350);
      const energy = section.match(/(\d+)\s*energia\b/i);
      const xp = section.match(/\+?\s*(\d+(?:[,.]\d+)?\s*[kKmM]?)\s*XP\b/i);
      const nyang = xp && section.slice(section.indexOf(xp[0]) + xp[0].length).match(/(\d+(?:[,.]\d+)?\s*[kKmM]?)(?=\s|$)/);
      if (energy && xp && nyang) found[r.key] = { energy: Number(energy[1]), xp: parseReward(xp[1]), nyang: parseReward(nyang[1]) };
    }
    return found;
  }
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
    const text = document.body.innerText || "";
    const characterChanged = scanCharacterValues(text);
    const equipmentChanged = scanEquippedItems();
    const raidData = scanRaids(text);
    const raidChanged = JSON.stringify(raidData) !== JSON.stringify(state.raids);
    if (raidChanged && Object.keys(raidData).length) state.raids = raidData;
    const reduction = text.match(/(?:ellen|against)\s*:\s*(\d+(?:[,.]\d+)?)\s*%\s*\.\s*(?:plafon|cap)/i);
    const oldReduction = state.defenseReduction;
    if (reduction) state.defenseReduction = parse(reduction[1]);
    const defenseThreshold = text.match(/(?:plafon|cap)\s*:\s*75\s*%\s*,?\s*(\d+)\s*(?:védelemnél|defen[cs]e)/i);
    const oldDefenseCap = stats[0].cap;
    if (defenseThreshold) stats[0].cap = parse(defenseThreshold[1]);
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
    if (JSON.stringify(found) !== JSON.stringify(state.detected) || oldReduction !== state.defenseReduction || oldDefenseCap !== stats[0].cap || equipmentChanged || characterChanged || (raidChanged && Object.keys(raidData).length)) {
      state.detected = found;
      if (state.visible && !shadow.activeElement?.matches("input")) render();
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
  chrome.storage.local.get(RAID_KEY, data => {
    const saved = data[RAID_KEY];
    if (saved && typeof saved === "object") state.raidManual = saved;
    render();
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
  new MutationObserver(schedule).observe(document.body || document.documentElement, { subtree: true, childList: true, characterData: true });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) schedule(); });
})();
