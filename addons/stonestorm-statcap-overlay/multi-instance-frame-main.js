/* Create frames in the ordinary page realm so the GAME's frame-src CSP applies.
 * Isolated extension worlds can have different CSP behavior. No policy override. */
(() => {
  'use strict';
  if (window.top !== window) return;
  document.addEventListener('ssa-mi-create-frames', event => {
    const host = event.target;
    if (!(host instanceof HTMLElement) || !host.isConnected || host !== document.getElementById('ssa-multi-instance-probe') || host.querySelector('iframe')) return;
    for (const role of ['mine', 'smelt']) {
      const frame = document.createElement('iframe');
      frame.title = 'Eredeti Stonestorm – ' + (role === 'mine' ? 'Tárna' : 'Olvasztó');
      frame.slot = role;
      frame.src = 'https://stonestorm.gg/mining';
      host.append(frame);
    }
  });
})();
