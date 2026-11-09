/* Runs only on stonestorm.gg, in the game's JS world. Never changes a request or response. */
(() => {
  "use strict";
  if (window.top !== window || window.__ssStatCapCapture) return;
  Object.defineProperty(window, "__ssStatCapCapture", { value: true });

  const typeOf = url => {
    try {
      const path = new URL(String(url), location.href).pathname;
      if (/\/character\/?$/i.test(path)) return "character";
      if (/\/content\/?$/i.test(path)) return "content";
    } catch (_) { /* Ignore non-URL requests. */ }
    return null;
  };
  const number = value => typeof value === "number" && Number.isFinite(value) ? value : null;
  // A játék a felszerelésmódosítás után nem feltétlenül kér új /character adatot.
  // Csak sikeres, statokat érintő írások után frissítünk; a kérés kizárólag olvasás.
  const changesStats = (url, method) => {
    if (!/^(POST|PUT|PATCH|DELETE)$/i.test(String(method || "GET"))) return false;
    try {
      const u = new URL(String(url), location.href);
      return u.origin === location.origin && /\/api\//i.test(u.pathname) && /equip|item|inventory|gear|forge|character|stat|skill|pet|research|alchemist|soul/i.test(u.pathname);
    } catch (_) { return false; }
  };
  let refreshTimer = null;
  function refreshCharacterSoon() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      if (typeof originalFetch !== "function") return;
      originalFetch.call(window, "/api/character", { method: "GET", credentials: "same-origin", cache: "no-store" })
        .then(response => response.ok ? response.json() : null)
        .then(json => { if (json) publish("character", json); })
        .catch(() => {});
    }, 650);
  }
  const latest = {};
  const emit = (kind, payload) => {
    latest[kind] = { source: "ss-statcap-api-v2", kind, payload };
    window.postMessage(latest[kind], location.origin);
  };
  window.addEventListener("message", event => {
    if (event.source !== window || event.origin !== location.origin || event.data?.source !== "ss-statcap-ready-v2") return;
    for (const kind of ["content", "character"]) if (latest[kind]) window.postMessage(latest[kind], location.origin);
  });

  function publish(kind, json) {
    if (!json || typeof json !== "object") return;
    const data = json.state && typeof json.state === "object" ? json.state : json;
    if (kind === "character") {
      if (!Array.isArray(data.items) || !data.stats || !data.derived) return;
      const items = data.items.slice(0, 250).filter(item => item && typeof item === "object").map(item => ({
        equippedSlot: typeof item.equippedSlot === "string" ? item.equippedSlot : null,
        templateId: typeof item.templateId === "string" ? item.templateId : null,
        plus: number(item.plus),
        lines: Array.isArray(item.lines) ? item.lines.slice(0, 16).filter(line => line && typeof line.type === "string" && number(line.value) !== null).map(line => ({ type: line.type, value: line.value })) : []
      }));
      const stats = {};
      for (const k of ["str", "dex", "vit", "int"]) stats[k] = number(data.stats[k]);
      const derived = {};
      for (const k of ["maxHp", "maxSp", "atkMin", "atkMax", "def", "critChance", "evadeBonus"]) derived[k] = number(data.derived[k]);
      const harcero = { base: number(data.harcero?.base), full: number(data.harcero?.full) };
      const modSources = Array.isArray(data.modSources) ? data.modSources.slice(0, 100).map(m => ({
        source: typeof m.source === "string" ? m.source : null,
        effect: m.effect && typeof m.effect === "object" ? Object.fromEntries(Object.entries(m.effect).filter(([k, v]) => /^[a-zA-Z][a-zA-Z0-9]{0,40}$/.test(k) && number(v) !== null).slice(0, 35)) : {}
      })) : [];
      const mods = data.mods && typeof data.mods === "object" ? Object.fromEntries(Object.entries(data.mods).filter(([k, v]) => /^[a-zA-Z][a-zA-Z0-9]{0,40}$/.test(k) && number(v) !== null).slice(0, 90)) : {};
      const vipActive = typeof data.vipUntil === "string" && Date.parse(data.vipUntil) > Date.now();
      const buffs = Array.isArray(data.buffs) ? data.buffs.slice(0, 40).filter(b => typeof b.kind === "string").map(b => ({
        kind: b.kind, expiresAt: typeof b.expiresAt === "string" ? b.expiresAt : null,
        payment: typeof (b.payment || b.currency || b.purchasedWith) === "string" ? (b.payment || b.currency || b.purchasedWith) : null
      })) : [];
      emit(kind, { items, stats, derived, harcero, modSources, mods, vipActive, buffs, classId: typeof data.classId === "string" ? data.classId : null });
    } else if (kind === "content") {
      const rules = data.harcero?.rules;
      if (!rules || !rules.supportCaps) return;
      const templates = {};
      for (const item of Array.isArray(data.items) ? data.items : []) {
        if (typeof item.id === "string" && number(item.values?.crit) !== null) templates[item.id] = { crit: item.values.crit };
      }
      const hero = data.harcero?.combat?.hero || {};
      emit(kind, {
        critCap: number(rules.critCap), evadeCap: number(rules.evadeCap), monsterEvadeCap: number(rules.monsterEvadeCap),
        supportCaps: Object.fromEntries(["critDamage", "skillDamage", "vsBoss", "potionHeal", "lifesteal", "damageTaken"].map(key => [key, number(rules.supportCaps[key])])),
        templates, plusMult: Array.isArray(data.forge?.plusMult) ? data.forge.plusMult.slice(0, 25) : [],
        hero: { critBase: number(hero.critBase), critPerDex: number(hero.critPerDex) },
        alchemist: Object.fromEntries(Object.entries(data.lean?.alchemist || {}).filter(([k, v]) => typeof k === "string" && v?.effect && typeof v.effect === "object").map(([k, v]) => [k, { effect: Object.fromEntries(Object.entries(v.effect).filter(([, n]) => number(n) !== null)), coins: number(v.coins) }]))
      });
    }
  }

  const originalFetch = window.fetch;
  if (typeof originalFetch === "function") {
    window.fetch = function (...args) {
      const url = typeof args[0] === "string" || args[0] instanceof URL ? args[0] : args[0]?.url;
      const method = args[1]?.method || args[0]?.method || "GET";
      const kind = typeOf(url);
      const promise = originalFetch.apply(this, args);
      if (changesStats(url, method)) promise.then(response => { if (response.ok) refreshCharacterSoon(); }).catch(() => {});
      if (kind) promise.then(response => {
        if (response.ok && /json/i.test(response.headers.get("content-type") || "")) {
          response.clone().json().then(json => publish(kind, json)).catch(() => {});
        }
      }).catch(() => {});
      return promise;
    };
  }

  const XHR = window.XMLHttpRequest?.prototype;
  if (XHR?.open && XHR?.send) {
    const open = XHR.open, send = XHR.send;
    XHR.open = function (method, url, ...rest) {
      this.__ssStatCapKind = typeOf(url);
      this.__ssStatCapWrite = changesStats(url, method);
      return open.call(this, method, url, ...rest);
    };
    XHR.send = function (...args) {
      if (this.__ssStatCapWrite) this.addEventListener("load", () => {
        if (this.status >= 200 && this.status < 300) refreshCharacterSoon();
      }, { once: true });
      if (this.__ssStatCapKind) this.addEventListener("load", () => {
        try {
          if (this.status < 200 || this.status >= 300) return;
          const json = this.responseType === "json" ? this.response : this.responseType === "" || this.responseType === "text" ? JSON.parse(this.responseText) : null;
          publish(this.__ssStatCapKind, json);
        } catch (_) { /* Ignore non-JSON responses. */ }
      }, { once: true });
      return send.apply(this, args);
    };
  }
})();
