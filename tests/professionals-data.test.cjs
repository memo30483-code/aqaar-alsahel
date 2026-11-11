const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");

const source = fs.readFileSync(
  path.join(__dirname, "..", "src/lib/professionals-data.ts"),
  "utf8"
);
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
const loaded = { exports: {} };
new Function("exports", "require", "module", js)(loaded.exports, require, loaded);

const { canonicalProfessionalsValue, professionalItems, professionalVersion } =
  loaded.exports;

test("professional values accept arrays and legacy items envelopes", () => {
  const records = [{ id: "dev-1", kind: "developer", nameAr: "شركة" }];
  assert.deepEqual(professionalItems(records), records);
  assert.deepEqual(professionalItems({ items: records, updatedAt: "x" }), records);
});

test("canonical professional values drop malformed records and add versions", () => {
  const result = canonicalProfessionalsValue({
    items: [
      { id: "dev-1", kind: "developer", nameAr: "شركة" },
      { id: "", kind: "lawyer" },
      { id: "bad", kind: "unknown" },
    ],
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "dev-1");
  assert.equal(result[0].version, 1);
  assert.equal(professionalVersion({ version: 7 }), 7);
});
