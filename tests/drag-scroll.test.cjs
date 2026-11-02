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

const {
  nextCarouselPosition,
  scrollLeftAfterDrag,
  wrapLoopScrollPosition,
} = loaded.exports;

test("dragging left follows the cursor: content moves left", () => {
  /* سحب الماوس لليسار (dx سالب) يزيد scrollLeft فيتحرك المحتوى لليسار */
  assert.equal(scrollLeftAfterDrag(0, -120), 120);
  assert.equal(scrollLeftAfterDrag(300, -50), 350);
  assert.equal(scrollLeftAfterDrag(-500, -40), -460);
});

test("dragging right follows the cursor: content moves right", () => {
  assert.equal(scrollLeftAfterDrag(300, 80), 220);
  assert.equal(scrollLeftAfterDrag(0, 120), -120);
  assert.equal(scrollLeftAfterDrag(-300, 90), -390);
});

test("a zero movement keeps the current position", () => {
  assert.equal(scrollLeftAfterDrag(0, 0), 0);
  assert.equal(scrollLeftAfterDrag(420, 0), 420);
  assert.equal(scrollLeftAfterDrag(-420, 0), -420);
});

test("the same drag distance always moves the same visual amount", () => {
  /* نفس الإزاحة تعطي نفس النتيجة بغض النظر عن موضع البداية */
  const fromStart = scrollLeftAfterDrag(0, -75) - 0;
  const fromMiddle = scrollLeftAfterDrag(-200, -75) - -200;
  assert.equal(fromStart, fromMiddle);
  assert.equal(fromStart, 75);
});

test("a repeated ad strip wraps to the equivalent cycle instead of stopping", () => {
  assert.equal(wrapLoopScrollPosition(-1195, 1192, true), -3);
  assert.equal(wrapLoopScrollPosition(1195, 1192, false), 3);
  assert.equal(wrapLoopScrollPosition(-800, 1192, true), -800);
});

test("project autoplay advances and loops when it reaches the final position", () => {
  assert.equal(nextCarouselPosition(0, 763, 380), 380);
  assert.equal(nextCarouselPosition(-380, 763, 380), 760);
  /* آخر 5% تُعدّ الحافة لتجنب وقفة إضافية عند فرق بكسلات بسيط */
  assert.equal(nextCarouselPosition(-760, 763, 380), 0);
});
