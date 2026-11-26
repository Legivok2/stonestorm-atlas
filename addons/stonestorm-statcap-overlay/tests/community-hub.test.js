const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = {globalThis:{}};
vm.runInNewContext(fs.readFileSync(require.resolve('../enhanced-ui-config.js'), 'utf8'), context);
const config = context.globalThis.StonestormEnhancedConfig;
const profile = config.profiles.find(p => p.id === 'community');
assert.equal(profile.selector, '.modal__dialog.panel.friends-modal');
assert.equal(profile.kind, 'community');
assert.equal(config.clean({screens:{community:true}}).screens.community, true);
assert.equal(config.clean(null).screens.community, false);
const manifest = JSON.parse(fs.readFileSync(require.resolve('../manifest.json'), 'utf8'));
assert(!manifest.content_scripts.some(s => s.js.includes('community-hub.js')));
console.log('native-community: OK');
