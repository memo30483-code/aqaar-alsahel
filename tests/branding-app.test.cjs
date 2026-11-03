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

const theme = loadTs("src/lib/theme-season.ts");
const branding = loadTs("src/lib/branding.ts", { "@/lib/theme-season": theme });
const appSettings = loadTs("src/lib/app-settings.ts");

const {
  DEFAULT_BRANDING,
  resolveBranding,
  logoSrc,
} = branding;

const {
  DEFAULT_APP_SETTINGS,
  resolveAppSettings,
  qrImageSrc,
} = appSettings;

test("branding defaults keep the Cairo identity and brand colors", () => {
  const brand = resolveBranding(undefined);
  assert.equal(brand.headingFont, "cairo");
  assert.equal(brand.bodyFont, "cairo");
  assert.equal(brand.baseFontSize, 16);
  assert.equal(brand.colors.gold, DEFAULT_BRANDING.colors.gold);
  assert.match(brand.bodyStack, /font-cairo/);
});

test("branding resolves partial colors and clamps the base font size", () => {
  const brand = resolveBranding({
    headingFont: "amiri",
    bodyFont: "readex",
    baseFontSize: 99,
    colors: { gold: "#112233" },
  });
  assert.equal(brand.headingFont, "amiri");
  assert.equal(brand.bodyFont, "readex");
  assert.equal(brand.baseFontSize, 19);
  assert.equal(brand.colors.gold, "#112233");
  /* الألوان غير المحددة تبقى افتراضية */
  assert.equal(brand.colors.ocean, DEFAULT_BRANDING.colors.ocean);
});

test("invalid fonts and colors fall back safely", () => {
  const brand = resolveBranding({
    headingFont: "comic",
    bodyFont: "unknown",
    baseFontSize: 2,
    colors: { ocean: "not-a-color" },
  });
  assert.equal(brand.headingFont, "cairo");
  assert.equal(brand.bodyFont, "cairo");
  assert.equal(brand.baseFontSize, 14);
  assert.equal(brand.colors.ocean, DEFAULT_BRANDING.colors.ocean);
});

test("logo tone fallback: dark uses logoDark then logoMain", () => {
  assert.equal(logoSrc({ ...DEFAULT_BRANDING, logoMain: "main.png" }, "light"), "main.png");
  assert.equal(logoSrc({ ...DEFAULT_BRANDING, logoMain: "main.png" }, "dark"), "main.png");
  assert.equal(
    logoSrc({ ...DEFAULT_BRANDING, logoMain: "main.png", logoDark: "dark.png" }, "dark"),
    "dark.png"
  );
  assert.equal(
    logoSrc({ ...DEFAULT_BRANDING, logoLight: "light.png", logoMain: "main.png" }, "light"),
    "light.png"
  );
});

test("app settings merge features by id and clamp banner delay", () => {
  const partial = resolveAppSettings({
    titleAr: "عنوان مخصص",
    bannerDelaySec: 999,
    features: [{ id: "map", titleAr: "خريطة جديدة", descAr: "وصف" }],
  });
  assert.equal(partial.titleAr, "عنوان مخصص");
  assert.equal(partial.bannerDelaySec, 30);
  assert.equal(partial.features.length, DEFAULT_APP_SETTINGS.features.length);
  const mapFeature = partial.features.find((feature) => feature.id === "map");
  assert.equal(mapFeature.titleAr, "خريطة جديدة");
  assert.equal(mapFeature.descAr, "وصف");
  /* بقية الميزات لم تُفقد */
  assert.ok(partial.features.some((feature) => feature.id === "alerts"));
});

test("app settings default to soon and enabled, live only when explicit", () => {
  const defaults = resolveAppSettings(undefined);
  assert.equal(defaults.status, "soon");
  assert.equal(defaults.enabled, true);
  /* التطبيق لا يستبدل الهيرو العقاري ولا يعرض بانراً مزعجاً افتراضياً. */
  assert.equal(defaults.heroMode, false);
  assert.equal(defaults.showMobileBanner, false);
  assert.equal(resolveAppSettings({ status: "live" }).status, "live");
  assert.equal(resolveAppSettings({ status: "weird" }).status, "soon");
  assert.equal(resolveAppSettings({ enabled: false }).enabled, false);
  assert.equal(resolveAppSettings({ heroMode: true }).heroMode, false);
  assert.equal(resolveAppSettings({ showMobileBanner: true }).showMobileBanner, true);
});

test("QR source encodes the target URL", () => {
  const src = qrImageSrc("https://example.com/app?a=1&b=2");
  assert.match(src, /^https:\/\/api\.qrserver\.com\//);
  assert.ok(src.includes(encodeURIComponent("https://example.com/app?a=1&b=2")));
});
