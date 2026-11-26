/* Compatibility entry: the shared Enhanced UI controller owns mining discovery,
 * settings, controls, cleanup and responsive layout. Existing CSS is reused. */
(() => { 'use strict'; if(window.top!==window)return;
  if(!globalThis.StonestormEnhancedUI)return;
  globalThis.__ssaMiningInstalled=true;
})();
