/* Public, reviewed Community DOM contracts. Read-only and no server mutations. */
(() => {
  'use strict';
  globalThis.StonestormCommunityHubConfig = Object.freeze({
    key: 'ssaCommunityHub.v2',
    selectors: Object.freeze({
      friends: '[data-testid="hud-friends"],.hud-friends',
      friendsWindow: '.friends-modal,.friends',
      chat: '.chat.community'
    }),
    tabs: Object.freeze([
      Object.freeze({key: 'friends', name: 'Barátok'}),
      Object.freeze({key: 'panels', name: 'Közösségi panelek'}),
      Object.freeze({key: 'chat', name: 'Chat'})
    ])
  });
})();
