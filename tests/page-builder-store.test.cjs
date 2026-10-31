const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");

const sourcePath = path.join(
  __dirname,
  "..",
  "src",
  "lib",
  "page-builder-store.ts"
);
const source = fs.readFileSync(sourcePath, "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

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

const loaded = { exports: {} };
const customRequire = (id) => {
  if (id === "react") {
    return {
      useEffect: () => {},
      useMemo: (factory) => factory(),
      useState: (initial) => [
        typeof initial === "function" ? initial() : initial,
        () => {},
      ],
    };
  }
  if (id === "@/lib/admin-system") {
    return {
      blockOrder: () => 1,
      isBlockEnabled: () => true,
    };
  }
  if (id === "@/lib/home-block-style") {
    return {
      sanitizeBlockStyle: (style) => style,
    };
  }
  return require(id);
};
new Function("exports", "require", "module", js)(
  loaded.exports,
  customRequire,
  loaded
);

const {
  PAGE_REGISTRY,
  PAGE_BUILDER_KEY,
  addPageBlock,
  addableTypesFor,
  getPageBlocks,
  getPageStyle,
  movePageBlock,
  removePageBlock,
  resetPageBlocks,
  savePageStyle,
  togglePageBlock,
  updatePageBlock,
} = loaded.exports;

test("registry covers every content page with unique ids and defaults", () => {
  const ids = PAGE_REGISTRY.map((page) => page.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const page of PAGE_REGISTRY) {
    assert.ok(page.path.startsWith("/"), page.id);
    assert.ok(page.labelAr, page.id);
    assert.ok(page.defaults.length > 0, page.id);
    for (const block of page.defaults) {
      assert.ok(block.type, page.id);
      assert.equal(typeof block.order, "number");
    }
  }
  assert.deepEqual(
    [...ids].sort(),
    [
      "brokers",
      "company",
      "developers",
      "engineering-consultational",
      "engineers",
      "home",
      "lawyers",
      "legal-consultational",
      "market-guide",
      "projects",
    ]
  );
});

test("home keeps inline_ad while content pages expose the general library", () => {
  assert.ok(addableTypesFor("home").includes("inline_ad"));
  assert.ok(addableTypesFor("home").includes("hero"));
  assert.ok(addableTypesFor("market-guide").includes("page_header"));
  assert.ok(addableTypesFor("market-guide").includes("steps"));
  assert.equal(addableTypesFor("market-guide").includes("inline_ad"), false);
  assert.equal(addableTypesFor("market-guide").includes("featured_listings"), false);
});

test("CRUD is isolated per page", () => {
  memory.clear();

  const added = addPageBlock("developers", "text");
  assert.ok(added);
  assert.equal(getPageBlocks("developers").some((b) => b.id === added.id), true);
  assert.equal(getPageBlocks("brokers").some((b) => b.id === added.id), false);

  updatePageBlock("developers", added.id, { titleAr: "عنوان محدث" });
  assert.equal(
    getPageBlocks("developers").find((b) => b.id === added.id).titleAr,
    "عنوان محدث"
  );

  togglePageBlock("developers", added.id);
  assert.equal(
    getPageBlocks("developers").find((b) => b.id === added.id).visible,
    false
  );

  movePageBlock("developers", added.id, 0);
  assert.equal(getPageBlocks("developers")[0].id, added.id);

  removePageBlock("developers", added.id);
  assert.equal(getPageBlocks("developers").some((b) => b.id === added.id), false);

  const stored = JSON.parse(memory.get(PAGE_BUILDER_KEY));
  assert.ok(stored.pages.developers);
  assert.ok(stored.pages.developers.items.length > 0);
});

test("legacy home builder data is migrated automatically", () => {
  memory.clear();
  memory.set(
    "aqaar-home-builder",
    JSON.stringify([
      { id: "hero", type: "hero", visible: false, order: 2 },
      { id: "text", type: "text", visible: true, order: 1, titleAr: "قديم" },
    ])
  );

  const blocks = getPageBlocks("home");
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].type, "text");
  assert.equal(blocks[0].titleAr, "قديم");
  assert.equal(blocks[1].visible, false);
});

test("page style is stored and reset independently of blocks", () => {
  memory.clear();
  savePageStyle("lawyers", { fontFamily: "amiri", titleSize: 34 });
  const style = getPageStyle("lawyers");
  assert.equal(style.fontFamily, "amiri");
  assert.equal(style.titleSize, 34);
  assert.equal(getPageStyle("brokers"), undefined);

  const before = getPageBlocks("lawyers").length;
  resetPageBlocks("lawyers");
  assert.equal(getPageStyle("lawyers"), undefined);
  assert.equal(getPageBlocks("lawyers").length, before);
});
