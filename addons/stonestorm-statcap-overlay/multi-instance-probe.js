/* Phase 1 only: two original /mining documents in the game's own DOM.
 * No copied game UI, private React access, API writes or framing-policy overrides. */
(() => {
  'use strict';
  if (window.top !== window || globalThis.StonestormMultiInstanceProbe) return;
  const roles = ['mine', 'smelt'];
  const names = {mine: 'Tárna', smelt: 'Olvasztó'};
  const attached = new WeakSet();
  let active = null, starting = false, last = null;
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const tabSelector = role => '.mine-stage .mine-tabs button[role="tab"][data-mine-tab="' + role + '"]';
  const errorText = error => error?.message?.slice(0, 240) || 'A próba megszakadt.';

  function original(doc, role) {
    const tabs = doc.querySelectorAll(tabSelector(role));
    if (tabs.length !== 1) return null;
    const tab = tabs[0], panel = doc.getElementById(tab.getAttribute('aria-controls'));
    if (!tab.id || !panel?.matches('.mine-window__body[role="tabpanel"]') || tab.disabled) return null;
    return {tab, panel};
  }
  function selected(doc, role) {
    const ui = original(doc, role);
    return !!ui && ui.tab.getAttribute('aria-selected') === 'true' && ui.panel.getAttribute('aria-labelledby') === ui.tab.id;
  }
  function stateOf(frame, role) {
    const value = {role, sameOriginDocument: false, originalUI: false, selected: false};
    try {
      const doc = frame.contentDocument, win = frame.contentWindow;
      if (!doc || win.location.origin !== location.origin || win.location.pathname !== '/mining') return value;
      value.sameOriginDocument = true;
      value.originalUI = !!original(doc, role);
      value.selected = selected(doc, role);
      value.cookieEnabled = win.navigator.cookieEnabled;
      // Cookie values, storage, character data and form values are never read.
      value.enabledOriginalControls = doc.querySelectorAll('.mine-window__body button:not(:disabled),.mine-window__body input:not(:disabled),.mine-window__body select:not(:disabled)').length;
      value.resources = win.performance.getEntriesByType('resource').length;
    } catch { /* Browser framing/origin restrictions remain in force. */ }
    return value;
  }
  function diagnostics() {
    if (!active) return last;
    return {...active.report, frames: active.frames.map((frame, i) => stateOf(frame, roles[i])),
      elapsedMs: Math.round(performance.now() - active.began),
      // Chromium's heap number can cover a shared isolate; it is not per-frame memory.
      chromiumSharedHeapBytes: performance.memory?.usedJSHeapSize ?? null};
  }
  function close() {
    const run = active;
    if (!run) return;
    last = diagnostics();active = null;
    run.controller.abort();
    run.host.remove(); // Destroys both embedded applications and their connections.
    if (run.root) run.root.inert = run.previousInert;
    if (run.previousOverflow) document.body.style.setProperty('overflow', run.previousOverflow, run.previousOverflowPriority);
    else document.body.style.removeProperty('overflow');
    run.returnFocus?.focus();
  }
  async function choose(run, frame, role) {
    const deadline = performance.now() + 25000;
    while (active === run && performance.now() < deadline) {
      if (run.report.phase === 'blocked') throw Error(run.report.error);
      if (run.touched) throw Error('A felhasználó már használja a paneleket; további automatikus fülváltás leállt.');
      const ui = frame.contentDocument && original(frame.contentDocument, role);
      if (ui) {
        watchDocument(run, frame);
        // The only automated clicks in this module target verified native tab buttons.
        if (!selected(frame.contentDocument, role)) ui.tab.click();
        for (let i = 0; i < 30 && active === run; i++) {
          if (selected(frame.contentDocument, role)) return;
          await wait(50);
        }
        throw Error(names[role] + ': az eredeti fülváltás nem igazolható.');
      }
      await wait(150);
    }
    throw Error(names[role] + ': nem érhető el az eredeti, bejelentkezett /mining felület. Ellenőrizd a böngésző frame/CSP hibáját és a munkamenetet.');
  }
  async function checkIndependence(run) {
    // Safe UI navigation only. No resource/action buttons are ever clicked.
    await choose(run, run.frames[0], 'smelt');
    if (!selected(run.frames[1].contentDocument, 'smelt')) throw Error('A második példány fülállapota váratlanul megváltozott.');
    await choose(run, run.frames[0], 'mine');
    await choose(run, run.frames[1], 'mine');
    if (!selected(run.frames[0].contentDocument, 'mine')) throw Error('Az első példány fülállapota váratlanul megváltozott.');
    await choose(run, run.frames[1], 'smelt');
    run.report.independentNativeTabNavigation = true;
  }
  function watchDocument(run, frame) {
    const doc = frame.contentDocument;
    if (!doc || doc.location.origin !== location.origin || !doc.querySelector('.mine-stage .mine-window')) return;
    if (run.watched.has(doc)) return;
    run.watched.add(doc);
    const touched = event => { if (event.isTrusted) run.touched = true; };
    doc.addEventListener('pointerdown', touched, {capture: true, signal: run.controller.signal});
    doc.addEventListener('keydown', touched, {capture: true, signal: run.controller.signal});
    doc.addEventListener('securitypolicyviolation', event => {
      run.report.policyViolations.push({directive: event.effectiveDirective, disposition: event.disposition});
    }, {signal: run.controller.signal});
  }
  async function start(returnFocus, status) {
    if (starting || active) return;
    starting = true;status.textContent = 'Az eredeti oldal és a dokumentumfejlécek ellenőrzése…';
    let run;
    try {
      if (location.origin !== 'https://stonestorm.gg' || location.pathname !== '/mining' || !roles.every(role => original(document, role))) {
        throw Error('A próba a bejelentkezett játék eredeti Tárnák (/mining) oldaláról indítható.');
      }
      // Read the same-origin document with the browser's current session. These are
      // a fresh GET's headers, not a claim about the already-loaded response.
      const response = await fetch('/mining', {credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000)});
      const headers = Object.fromEntries(['x-frame-options', 'content-security-policy', 'content-security-policy-report-only'].map(key => [key, response.headers.get(key)]));
      last = {schema: 1, checkedAt: new Date().toISOString(), phase: 'preflight', documentReadStatus: response.status,
        documentReadHeaders: headers, headerScope: 'Fresh GET /mining; browser enforcement is authoritative.', liveGameVerified: false, twoFrameGatePassed: false};
      if (!response.ok || response.headers.get('cf-mitigated') === 'challenge') throw Error('A /mining olvasása bejelentkezési vagy szerveres ellenőrzésbe ütközött (HTTP ' + response.status + ').');
      if (headers['x-frame-options']?.trim().toUpperCase() === 'DENY') throw Error('A /mining válasz X-Frame-Options: DENY fejléce tiltja a beágyazást.');
      const csp = headers['content-security-policy'] || '';
      if (/(?:^|;)\s*frame-ancestors\s+'none'\s*(?:;|$)/i.test(csp)) throw Error('A /mining válasz CSP frame-ancestors szabálya tiltja a beágyazást.');
      const host = document.createElement('section');host.id = 'ssa-multi-instance-probe';
      host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#17130f;color:#f0e4ca;pointer-events:auto';
      const shadow = host.attachShadow({mode: 'closed'});
      shadow.innerHTML = `<style>
        :host{font:14px system-ui;color:#f0e4ca}*{box-sizing:border-box}section{height:100%;display:flex;flex-direction:column}
        header{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px;background:#242018}button{font:inherit;background:#3a3124;color:inherit;border:1px solid #8d7347;border-radius:4px;padding:6px;cursor:pointer}button:disabled{opacity:.5;cursor:default}
        p{margin:0;width:100%}.grid{flex:1;min-height:0;display:grid;grid-template-columns:minmax(340px,1fr) minmax(340px,1fr);gap:6px;overflow:auto;padding:6px}
        article{display:flex;flex-direction:column;min-height:0;overflow:hidden;border:1px solid #8d7347}h2{margin:0;padding:4px 8px;font-size:15px}::slotted(iframe){flex:1;min-height:0;width:100%;border:0;background:#17130f}
      </style><section aria-label="Két eredeti játékpéldány megvalósíthatósági próbája"><header><strong>Két iframe próba · Tárna + Olvasztó</strong><button type="button" data-close>Eredeti nézet / Bezárás</button><button type="button" data-download>Diagnosztika letöltése</button><p role="status">Két eredeti /mining dokumentum betöltése…</p></header><div class="grid"></div></section>`;
      run = {host, shadow, controller: new AbortController(), watched: new WeakSet(), frames: [], began: performance.now(), touched: false,
        root: document.getElementById('root'), returnFocus, report: {...last, phase: 'loading', liveGameVerified: false,
          independentNativeTabNavigation: false, policyViolations: [],
          inventorySynchronization: 'not verified', gameplayActions: 'not executed', chat: 'not tested',
          sessionAndCookies: 'Default same-origin browser credentials. Cookie contents are not inspected.',
          performanceScope: 'Two child apps plus the existing parent app. Shared heap is not per-instance memory.'},
        previousOverflow: document.body.style.getPropertyValue('overflow'), previousOverflowPriority: document.body.style.getPropertyPriority('overflow')};
      active = run;run.previousInert = run.root?.inert ?? false;
      if (run.root) run.root.inert = true;
      document.body.style.setProperty('overflow', 'hidden');
      document.body.append(host);
      globalThis.StonestormCompanionApp?.close();
      shadow.querySelector('[data-close]').addEventListener('click', event => { if (event.isTrusted) close(); });
      shadow.addEventListener('keydown', event => { if (event.key === 'Escape' && event.target?.matches('button')) close(); });
      shadow.querySelector('[data-download]').addEventListener('click', event => {
        if (!event.isTrusted) return;
        const url = URL.createObjectURL(new Blob([JSON.stringify(diagnostics(), null, 2)], {type: 'application/json'}));
        const link = document.createElement('a');link.href = url;link.download = 'stonestorm-two-frame-probe.json';link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
      document.addEventListener('securitypolicyviolation', event => {
        if (event.effectiveDirective === 'frame-src' || event.effectiveDirective === 'child-src') {
          run.report.policyViolations.push({directive: event.effectiveDirective, disposition: event.disposition});
          if (event.disposition === 'enforce') {
            run.report.phase = 'blocked';run.report.error = 'A főoldal CSP ' + event.effectiveDirective + ' szabálya megakadályozta a beágyazást.';
          }
        }
      }, {signal: run.controller.signal});
      for (const role of roles) {
        const panel = document.createElement('article'), title = document.createElement('h2'), slot = document.createElement('slot');
        title.textContent = names[role];slot.name = role;
        panel.append(title, slot);shadow.querySelector('.grid').append(panel);
      }
      // No cross-world object references: the MAIN-world factory creates two
      // light-DOM frames, displayed through named slots in the workspace.
      host.dispatchEvent(new Event('ssa-mi-create-frames', {bubbles: true}));
      for (const role of roles) {
        const frame = host.querySelector('iframe[slot="' + role + '"]');
        if (!frame) throw Error('Az oldali iframe-létrehozás nem érhető el. Nincs bővítményi megkerülő megoldás.');
        // No srcdoc, sandbox relaxation, proxy or rewritten response. Default same-origin cookies apply.
        frame.addEventListener('load', () => {
          if (active !== run) return;
          try { watchDocument(run, frame); } catch { /* Report via the bounded UI check. */ }
          if (run.report.phase === 'ready') {
            run.report.phase = 'changed';run.report.liveGameVerified = false;
            shadow.querySelector('[role="status"]').textContent = 'Egy példány újratöltődött vagy elnavigált. A korábbi ellenőrzés már nem érvényes; indíts új próbát.';
          }
        }, {signal: run.controller.signal});
        run.frames.push(frame);
      }
      await Promise.all(run.frames.map((frame, i) => choose(run, frame, roles[i])));
      if (active !== run) return;
      await checkIndependence(run);
      if (active !== run) return;
      run.report.phase = 'ready';
      // Verified navigation is deliberately weaker than full live gameplay acceptance.
      shadow.querySelector('[role="status"]').textContent = 'Két eredeti felület betöltve; a fülváltások egymástól függetlenek. Készletszinkron, játékműveletek és tartós teljesítmény még nincs igazolva.';
      status.textContent = 'A kétiframe-es próba nyitva. A teljes élő elfogadás még szükséges.';
    } catch (error) {
      if (run && active !== run) return;
      const message = errorText(error);status.textContent = message;
      if (run && active === run) {run.report.phase = 'blocked';run.report.error = message;run.shadow.querySelector('[role="status"]').textContent = 'A próba nem igazolt: ' + message;}
      else last = {...last, phase: 'blocked', error: message};
    } finally {starting = false;}
  }
  function attach(shadow) {
    if (attached.has(shadow)) return;
    const slot = shadow.querySelector('[data-companion-slot="interfaces"]');
    if (!slot) return;
    attached.add(shadow);
    const section = document.createElement('section');section.className = 'sc-card';section.dataset.multiInstanceProbe = '';
    section.innerHTML = '<h3>Multi-Instance · két iframe próba</h3><p>Két eredeti /mining példány: Tárna és Olvasztó. Csak a bejelentkezett Tárnák oldalról indítható. A böngésző biztonsági szabályai érvényben maradnak.</p><button type="button" data-mi-start>Két iframe kipróbálása</button><p role="status">Kísérleti megvalósíthatósági próba. A négyes Tárnák és a Közösség még nincs engedélyezve.</p>';
    const button = section.querySelector('button'), status = section.querySelector('[role="status"]');
    button.addEventListener('click', event => { if (event.isTrusted) void start(button, status); });
    slot.prepend(section);
  }
  globalThis.StonestormMultiInstanceProbe = Object.freeze({attach, diagnostics});
})();
