const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");

const libDir = path.join(__dirname, "..", "src", "lib");

const memory = new Map();
global.window = {
  localStorage: {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, String(value)),
    removeItem: (key) => memory.delete(key),
  },
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

const reactMock = {
  useEffect: () => {},
  useMemo: (factory) => factory(),
  useState: (initial) => [
    typeof initial === "function" ? initial() : initial,
    () => {},
  ],
};

function loadModule(fileName, resolveOverride) {
  const source = fs.readFileSync(path.join(libDir, fileName), "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const loaded = { exports: {} };
  const customRequire = (id) => {
    if (resolveOverride) {
      const override = resolveOverride(id);
      if (override) return override;
    }
    if (id === "react") return reactMock;
    if (id === "@/lib/admin-system") {
      return { blockOrder: () => 1, isBlockEnabled: () => true };
    }
    if (id === "@/lib/home-block-style") {
      return { sanitizeBlockStyle: (style) => style };
    }
    return require(id);
  };
  new Function("exports", "require", "module", js)(
    loaded.exports,
    customRequire,
    loaded
  );
  return loaded.exports;
}

const engine = loadModule("page-builder-store.ts");

const {
  ADDABLE_BLOCK_TYPES,
  BLOCK_TYPE_META,
  CORE_BLOCK_TYPES,
  CUSTOM_BLOCK_TYPES,
  HOME_BLOCKS_KEY,
  PAGE_BUILDER_STORE_KEY,
  addHomeBlock,
  getHomeBlocks,
} = loadModule("home-builder-store.ts", (id) =>
  id === "@/lib/page-builder-store" ? engine : null
);

test("every builder template is enabled in the add-section panel", () => {
  assert.deepEqual(
    new Set(ADDABLE_BLOCK_TYPES),
    new Set(Object.keys(BLOCK_TYPE_META))
  );
  assert.equal(ADDABLE_BLOCK_TYPES.length, Object.keys(BLOCK_TYPE_META).length);
  assert.ok(ADDABLE_BLOCK_TYPES.includes("ad_slider"));
  assert.ok(ADDABLE_BLOCK_TYPES.includes("inline_ad"));
  assert.ok(ADDABLE_BLOCK_TYPES.includes("projects_slider"));
  assert.ok(ADDABLE_BLOCK_TYPES.includes("hero"));
});

test("built-in templates stay separate from flexible custom renderers", () => {
  for (const type of CORE_BLOCK_TYPES) {
    assert.equal(CUSTOM_BLOCK_TYPES.includes(type), false, type);
  }
});

test("admin can add multiple active instances of the same built-in section", () => {
  memory.clear();

  const firstCopy = addHomeBlock("ad_slider");
  const secondCopy = addHomeBlock("ad_slider");
  assert.ok(firstCopy);
  assert.ok(secondCopy);
  assert.equal(firstCopy.visible, true);
  assert.equal(secondCopy.visible, true);
  assert.notEqual(firstCopy.id, secondCopy.id);

  const sliders = getHomeBlocks().filter((block) => block.type === "ad_slider");
  assert.equal(sliders.length, 3); // النسخة الافتراضية + نسختان جديدتان
  assert.ok(sliders.every((block) => block.visible));

  const stored = JSON.parse(memory.get(PAGE_BUILDER_STORE_KEY));
  assert.equal(
    stored.pages.home.items.filter((block) => block.type === "ad_slider").length,
    3
  );
});

test("legacy home key stays readable for migration only", () => {
  assert.equal(HOME_BLOCKS_KEY, "aqaar-home-builder");
  assert.notEqual(HOME_BLOCKS_KEY, PAGE_BUILDER_STORE_KEY);
});
