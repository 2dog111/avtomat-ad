const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(process.argv[2] || 'public/telegram.js', 'utf8');
function setup({ throwNative = false } = {}) {
  const timers = new Map(), listeners = new Map(), urls = [];
  let click, id = 0;
  const on = (name, fn) => { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn); };
  const off = (name, fn) => listeners.get(name)?.delete(fn);
  const link = { href: 'https://t.me/avtomatad', addEventListener: (_, fn) => { click = fn; } };
  const document = { hidden: false, querySelector: () => link, addEventListener: on, removeEventListener: off };
  vm.runInNewContext(source, {
    document,
    window: { addEventListener: on, removeEventListener: off, location: { assign(url) { if (throwNative && url.startsWith('tg:')) throw Error('Protocol blocked'); urls.push(url); } } },
    setTimeout(fn) { timers.set(++id, fn); return id; }, clearTimeout: id => timers.delete(id),
  });
  return { urls, timers, document, click(extra = {}) { click({ button: 0, preventDefault() {}, ...extra }); },
    fire() { for (const fn of [...timers.values()]) fn(); }, emit(name) { for (const fn of [...(listeners.get(name) || [])]) fn(); },
    count() { return [...listeners.values()].reduce((n, s) => n + s.size, 0); } };
}
test('native attempt followed by one HTTPS fallback', () => {
  const x = setup(); x.click(); x.fire();
  assert.deepEqual(x.urls, ['tg://resolve?domain=avtomatad', 'https://t.me/avtomatad']); assert.equal(x.count(), 0);
});
test('repeated clicks keep one timer and one set of listeners', () => {
  const x = setup(); x.click(); x.click(); x.click(); assert.equal(x.timers.size, 1); assert.equal(x.count(), 3);
  x.fire(); assert.equal(x.urls.filter(u => u.startsWith('https:')).length, 1);
});
for (const event of ['blur', 'pagehide', 'visibilitychange']) test(event + ' cancels navigation and cleans listeners', () => {
  const x = setup(); x.click(); if (event === 'visibilitychange') x.document.hidden = true;
  x.emit(event); x.fire(); assert.equal(x.urls.length, 1); assert.equal(x.count(), 0);
});
test('visible visibilitychange does not cancel fallback', () => {
  const x = setup(); x.click(); x.emit('visibilitychange'); x.fire(); assert.equal(x.urls.length, 2);
});
test('modified and non-primary clicks stay native', () => {
  for (const extra of [{metaKey:true},{ctrlKey:true},{shiftKey:true},{altKey:true},{button:1}]) {
    const x = setup(); x.click(extra); assert.equal(x.urls.length, 0); assert.equal(x.timers.size, 0);
  }
});
test('blocked protocol falls back immediately without duplicate timer', () => {
  const x = setup({throwNative:true}); x.click(); x.fire(); assert.deepEqual(x.urls, ['https://t.me/avtomatad']); assert.equal(x.timers.size, 0);
});
