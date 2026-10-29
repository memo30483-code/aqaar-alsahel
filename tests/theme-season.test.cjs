const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "..", "src", "lib", "theme-season.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
const loaded = { exports: {} };
new Function("exports", "require", "module", js)(loaded.exports, require, loaded);
const { DEFAULT_THEME, RAMADAN_CAMPAIGN_TEXT, PRESET_MAP, resolveSeasonTheme } =
  loaded.exports;

const MOTIFS = [
  "crescent",
  "lanterns",
  "mashrabiya",
  "iftarCannon",
  "coastalReflections",
  "assistantLantern",
];

test("active Ramadan theme resolves to the campaign copy and Egyptian motifs", () => {
  const theme = resolveSeasonTheme({ preset: "ramadan", active: true });

  assert.equal(theme.active, true);
  assert.equal(theme.preset, "ramadan");
  assert.equal(theme.campaignText, "رمضان احلى مع عقار FAMILY");
  for (const motif of MOTIFS) assert.equal(theme.motifs[motif], true, motif);
  /* هوية رمضان: زمردي مصري + ذهب فانوس */
  assert.equal(theme.gold, "#e7c05e");
  assert.equal(theme.ocean, "#0d3b2e");
  assert.equal(theme.palette["ocean-950"].split(" ").length, 3);
  assert.equal(Object.keys(theme.palette).length, 33);
});

test("admin motif choices override Ramadan defaults independently", () => {
  const theme = resolveSeasonTheme({
    preset: "ramadan",
    active: true,
    campaignText: "ليالي رمضان مع عقار FAMILY",
    motifs: { iftarCannon: false, assistantLantern: false },
  });

  assert.equal(theme.campaignText, "ليالي رمضان مع عقار FAMILY");
  assert.equal(theme.motifs.iftarCannon, false);
  assert.equal(theme.motifs.assistantLantern, false);
  assert.equal(theme.motifs.crescent, true);
});

test("disabled theme restores the brand palette and hides Ramadan motifs", () => {
  const theme = resolveSeasonTheme({
    preset: "ramadan",
    active: false,
    gold: "#cfa13a",
    motifs: { crescent: true, lanterns: true },
  });

  assert.equal(theme.active, false);
  assert.equal(theme.gold, DEFAULT_THEME.gold);
  assert.equal(theme.sand, DEFAULT_THEME.sand);
  for (const motif of MOTIFS) assert.equal(theme.motifs[motif], false, motif);
});

test("non-Ramadan presets never inherit Ramadan decorations", () => {
  const theme = resolveSeasonTheme({ preset: "winter", active: true });

  assert.equal(theme.preset, "winter");
  for (const motif of MOTIFS) assert.equal(theme.motifs[motif], false, motif);
  /* النص الرمضاني لا يتسرّب لبقية المواسم */
  assert.equal(theme.campaignText, "");
  assert.equal(typeof RAMADAN_CAMPAIGN_TEXT, "string");
});

test("Ramadan keeps its emerald identity unless the admin overrides it", () => {
  const preset = resolveSeasonTheme({ preset: "ramadan", active: true });
  const overridden = resolveSeasonTheme({
    preset: "ramadan",
    active: true,
    gold: "#ffd700",
  });

  assert.equal(preset.ocean, PRESET_MAP.ramadan.ocean);
  assert.equal(overridden.gold, "#ffd700");
  /* تغيير اللون وحده لا يلغي بقية هوية الموسم */
  assert.equal(overridden.ocean, PRESET_MAP.ramadan.ocean);
});
