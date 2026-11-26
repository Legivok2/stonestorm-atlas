/* Compatibility entry: the shared Enhanced UI controller owns home discovery,
 * settings, controls, cleanup and responsive layout. Existing CSS is reused. */
(() => { 'use strict'; if(window.top!==window)return;
  if(!globalThis.StonestormEnhancedUI)return;
  globalThis.__ssaHomeExpandedInstalled=true;
})();
