const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");

function loadTs(relativeFile, deps = {}) {
  const source = fs.readFileSync(path.join(__dirname, "..", relativeFile), "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const loaded = { exports: {} };
  const shim = (name) => {
    if (Object.prototype.hasOwnProperty.call(deps, name)) return deps[name];
    return require(name);
  };
  new Function("exports", "require", "module", js)(loaded.exports, shim, loaded);
  return loaded.exports;
}

const keys = loadTs("src/lib/cloud/keys.ts");
const boot = loadTs("src/lib/cloud/boot.ts", {
  "./server": { cloudEnabled: () => false, cloudGetRows: async () => [] },
  "./keys": keys,
});

/** تنفيذ سكربت الحقن داخل بيئة متصفح مصغّرة */
function runBoot(script) {
  const store = new Map();
  const localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
  };
  const window = { localStorage };
  new Function("window", script)(window);
  return { store, window };
}

const AT = "2026-11-04T10:00:00.000Z";

test("cloud keys: every key has a label and an access flag", () => {
  const list = Object.keys(keys.CLOUD_KEYS);
  assert.ok(list.length >= 15);
  for (const key of list) {
    const meta = keys.CLOUD_KEYS[key];
    assert.equal(typeof meta.public, "boolean", key);
    assert.ok(meta.label && meta.label.length > 2, key);
  }
});

test("cloud keys: admin credentials are never public", () => {
  for (const key of [
    "aqaar-admin-users-v2",
    "aqaar-admin-permissions",
    "aqaar-admin-logs",
  ]) {
    assert.equal(keys.isCloudKey(key), true);
    assert.equal(keys.isPublicCloudKey(key), false, key);
  }
  assert.equal(keys.isPublicCloudKey("aqaar-site-settings"), true);
  assert.equal(keys.isCloudKey("aqaar-session"), false);
});

test("public list only contains public keys", () => {
  for (const key of keys.PUBLIC_CLOUD_KEYS) {
    assert.equal(keys.CLOUD_KEYS[key].public, true, key);
  }
});

test("boot writes remote values into local storage with their timestamp", () => {
  const script = boot.cloudBootScript({
    payload: { "aqaar-site-settings": { value: { brand: "x" }, updated_at: AT } },
    omitted: [],
    enabled: true,
  });
  const { store, window } = runBoot(script);

  assert.equal(store.get("aqaar-site-settings"), JSON.stringify({ brand: "x" }));
  assert.equal(Number(store.get("aqaar:ts:aqaar-site-settings")), Date.parse(AT));
  assert.deepEqual(window.__AQAAR_CLOUD__, { enabled: true, omitted: [] });
});

test("boot never overwrites a newer local edit", () => {
  const script = boot.cloudBootScript({
    payload: { "aqaar-cities": { value: ["remote"], updated_at: AT } },
    omitted: [],
    enabled: true,
  });

  const store = new Map([
    ["aqaar-cities", JSON.stringify(["local"])],
    ["aqaar:ts:aqaar-cities", String(Date.parse(AT) + 60_000)],
  ]);
  const localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
  };
  new Function("window", script)({ localStorage });

  assert.equal(store.get("aqaar-cities"), JSON.stringify(["local"]));
});

test("boot accepts a newer remote value over an older local one", () => {
  const script = boot.cloudBootScript({
    payload: { "aqaar-cities": { value: ["remote"], updated_at: AT } },
    omitted: [],
    enabled: true,
  });

  const store = new Map([
    ["aqaar-cities", JSON.stringify(["local"])],
    ["aqaar:ts:aqaar-cities", String(Date.parse(AT) - 60_000)],
  ]);
  const localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
  };
  new Function("window", script)({ localStorage });

  assert.equal(store.get("aqaar-cities"), JSON.stringify(["remote"]));
});

test("boot script cannot break out of the script tag", () => {
  const script = boot.cloudBootScript({
    payload: {
      "aqaar-site-settings": {
        value: { note: "</script><script>alert(1)</script>" },
        updated_at: AT,
      },
    },
    omitted: [],
    enabled: true,
  });

  assert.equal(script.includes("</script>"), false);
  assert.equal(script.includes("<script>"), false);
});

test("boot marks the cloud as disabled when Supabase is not configured", () => {
  const script = boot.cloudBootScript({ payload: {}, omitted: ["aqaar-properties"], enabled: false });
  const { window, store } = runBoot(script);

  assert.equal(window.__AQAAR_CLOUD__.enabled, false);
  assert.deepEqual(window.__AQAAR_CLOUD__.omitted, ["aqaar-properties"]);
  assert.equal(store.size, 0);
});
