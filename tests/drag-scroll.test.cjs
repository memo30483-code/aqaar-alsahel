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
  "use-drag-scroll.ts"
);
const source = fs.readFileSync(sourcePath, "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    jsx: ts.JsxEmit.ReactJSX,
  },
}).outputText;

const loaded = { exports: {} };
const customRequire = (id) => {
  if (id === "react") {
    return {
      useCallback: (fn) => fn,
      useEffect: () => {},
      useRef: (value) => ({ current: value }),
      useState: (initial) => [initial, () => {}],
    };
  }
  return require(id);
};

new Function("exports", "require", "module", js)(
  loaded.exports,
  customRequire,
  loaded
);

const { scrollLeftAfterDrag } = loaded.exports;

test("LTR: dragging content left moves to the next cards", () => {
  /* سحب الماوس لليسار (dx سالب) يزيد scrollLeft */
  assert.equal(scrollLeftAfterDrag(0, -120, false), 120);
  assert.equal(scrollLeftAfterDrag(300, -50, false), 350);
});

test("LTR: dragging content right moves back", () => {
  assert.equal(scrollLeftAfterDrag(300, 80, false), 220);
});

test("RTL: dragging left keeps scrolling forward with negative scrollLeft", () => {
  assert.equal(scrollLeftAfterDrag(0, -120, true), -120);
  assert.equal(scrollLeftAfterDrag(-300, -40, true), -340);
});

test("RTL: dragging right moves back toward the start", () => {
  assert.equal(scrollLeftAfterDrag(-300, 90, true), -210);
  assert.equal(scrollLeftAfterDrag(-120, 120, true), 0);
});

test("a zero movement keeps the current position in both directions", () => {
  assert.equal(scrollLeftAfterDrag(0, 0, false), 0);
  assert.equal(scrollLeftAfterDrag(0, 0, true), 0);
  assert.equal(scrollLeftAfterDrag(420, 0, false), 420);
  assert.equal(scrollLeftAfterDrag(-420, 0, true), -420);
});
