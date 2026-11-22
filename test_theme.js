const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const themeSource = fs.readFileSync('theme.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');

function boot(initialValue, options = {}) {
  const attributes = {};
  const listeners = {};
  const storage = new Map();
  if (initialValue !== undefined) storage.set('dealflow-theme', initialValue);
  const button = {
    innerHTML: '',
    setAttribute(name, value) { attributes[name] = value; },
    addEventListener(name, callback) { listeners[name] = callback; }
  };
  const root = {
    setAttribute(name, value) { attributes['root:' + name] = value; },
    getAttribute(name) { return attributes['root:' + name] ?? null; }
  };
  const localStorage = {
    getItem(key) {
      if (options.readThrows) throw new Error('storage unavailable');
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      if (options.writeThrows) throw new Error('storage unavailable');
      storage.set(key, value);
    }
  };
  vm.runInNewContext(themeSource, {
    document: { documentElement: root, getElementById: () => button },
    localStorage
  });
  return { attributes, button, listeners, storage, root };
}

{
  const app = boot();
  assert.equal(app.attributes['root:data-theme'], 'dark', 'fresh install defaults to dark');
  assert.equal(app.attributes['aria-pressed'], 'true');
  assert.match(app.button.innerHTML, /Light mode/);
  assert.equal(app.storage.has('dealflow-theme'), false, 'initial default need not write storage');
}
{
  const app = boot('light');
  assert.equal(app.attributes['root:data-theme'], 'light', 'saved light theme is restored');
  assert.equal(app.attributes['aria-pressed'], 'false');
  assert.match(app.button.innerHTML, /Dark mode/);
  app.listeners.click();
  assert.equal(app.attributes['root:data-theme'], 'dark', 'toggle changes light to dark');
  assert.equal(app.storage.get('dealflow-theme'), 'dark', 'toggle persists dark preference');
  app.listeners.click();
  assert.equal(app.attributes['root:data-theme'], 'light', 'toggle changes dark to light');
  assert.equal(app.storage.get('dealflow-theme'), 'light', 'toggle persists light preference');
}
{
  const app = boot('unexpected');
  assert.equal(app.attributes['root:data-theme'], 'dark', 'invalid stored value safely falls back to dark');
}
{
  const app = boot(undefined, { readThrows: true, writeThrows: true });
  assert.equal(app.attributes['root:data-theme'], 'dark', 'storage read failure keeps dark default');
  app.listeners.click();
  assert.equal(app.attributes['root:data-theme'], 'light', 'theme remains usable when persistence fails');
}
{
  assert.match(html, /id="themeToggle"/, 'theme control is present in the app shell');
  assert.match(html, /<script src="theme\.js"><\/script>/, 'theme module loads before the application modules');
  assert.match(css, /:root\[data-theme="dark"\]\s*\{/, 'dark design tokens are defined');
  assert.match(css, /:root\[data-theme="dark"\] body/, 'dark body colors are applied');
}
console.log('Theme default, restore, toggle, persistence, fallback and integration tests passed.');
