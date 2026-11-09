const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

async function test() {
  const requests = [];
  const messages = [];
  const tasks = [];
  const game = {
    fetch(url, options = {}) {
      requests.push({ url: String(url), method: options.method || "GET" });
      return Promise.resolve({ ok: true, headers: { get: () => "application/json" }, clone() { return this; }, json: async () => ({ state: { items: [], stats: { str: 5, dex: 61, vit: 93, int: 4 }, derived: { maxHp: 100 } } }) });
    },
    addEventListener() {},
    postMessage(message) { messages.push(message); }
  };
  game.top = game;
  const sandbox = { window: game, location: { origin: "https://stonestorm.gg", href: "https://stonestorm.gg/character" }, URL, Date, Object, Array, String, RegExp, Number, setTimeout(callback) { tasks.push(callback); return tasks.length; }, clearTimeout() {} };
  vm.runInNewContext(fs.readFileSync(require.resolve("../capture.js"), "utf8"), sandbox);
  await game.fetch("/api/items/equip", { method: "POST" });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(tasks.length, 1, "Sikeres felszerelésmódosítás ütemez karakterfrissítést");
  tasks.shift()();
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(requests.some(request => request.url === "/api/character" && request.method === "GET"));
  assert.ok(messages.some(message => message.kind === "character"));
  const count = tasks.length;
  await game.fetch("/api/pulse", { method: "POST" });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(tasks.length, count, "Háttérkérés nem indít felesleges karakterfrissítést");
  console.log("capture-refresh: OK");
}
test().catch(error => { console.error(error); process.exitCode = 1; });
