const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "..", "src", "lib", "home-block-style.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
const loaded = { exports: {} };
new Function("exports", "require", "module", js)(loaded.exports, require, loaded);
const {
  FONT_OPTIONS,
  cleanColor,
  sanitizeBlockStyle,
  blockFontClass,
  blockScopeClasses,
  blockCssVars,
  toEmbedUrl,
  resolveMedia,
} = loaded.exports;

test("admin style input is sanitized instead of trusted", () => {
  const style = sanitizeBlockStyle({
    fontFamily: "tajawal",
    titleSize: 999,
    bodySize: 2,
    titleColor: "#123",
    bodyColor: "red",
    align: "center",
    paddingY: -20,
    background: "#ffffff",
    mediaHeight: 900,
    mediaFit: "stretch",
    mediaRadius: 12,
    cardWidth: 100,
  });

  /* الأحجام تُقيَّد بالحدود الآمنة */
  assert.equal(style.titleSize, 72);
  assert.equal(style.bodySize, 10);
  assert.equal(style.paddingY, 0);
  assert.equal(style.mediaHeight, 720);
  assert.equal(style.cardWidth, 200);
  /* الألوان غير الصالحة تُهمَل */
  assert.equal(style.titleColor, "#123");
  assert.equal(style.bodyColor, undefined);
  assert.equal(style.background, "#ffffff");
  /* طريقة العرض غير المعروفة تُهمَل */
  assert.equal(style.mediaFit, undefined);
  assert.equal(style.mediaRadius, 12);
  assert.equal(style.align, "center");
  assert.equal(style.fontFamily, "tajawal");
});

test("invalid or empty styles never reach the page", () => {
  assert.equal(sanitizeBlockStyle(null), undefined);
  assert.equal(sanitizeBlockStyle("style"), undefined);
  assert.equal(sanitizeBlockStyle({}), undefined);
  assert.equal(sanitizeBlockStyle({ fontFamily: "comic-sans" }), undefined);
  assert.equal(sanitizeBlockStyle({ titleColor: "#12" }), undefined);
});

test("colors accept only hex values", () => {
  assert.equal(cleanColor("#abc"), "#abc");
  assert.equal(cleanColor(" #A1B2C3 "), "#A1B2C3");
  assert.equal(cleanColor("rgb(0,0,0)"), undefined);
  assert.equal(cleanColor(""), undefined);
  assert.equal(cleanColor(undefined), undefined);
});

test("scope classes activate only the properties the admin set", () => {
  /* لا تنسيق = لا كلاسات تغيير */
  assert.deepEqual(blockScopeClasses(undefined), ["hb-scope"]);
  assert.equal(blockFontClass(undefined), "");

  /* خط وحده: كلاس الخط فقط */
  const fontOnly = blockScopeClasses({ fontFamily: "amiri" });
  assert.deepEqual(fontOnly, ["hb-scope", "hb-font-amiri"]);

  /* الحجم واللون يضيفان مفاتيح التفعيل */
  const styled = blockScopeClasses({
    titleSize: 40,
    bodySize: 16,
    titleColor: "#ffffff",
    bodyColor: "#111111",
    mediaHeight: 320,
    mediaFit: "contain",
    mediaRadius: 8,
  });
  for (const cls of [
    "hb-has-title-size",
    "hb-has-body-size",
    "hb-has-title-color",
    "hb-has-body-color",
    "hb-has-media-height",
    "hb-has-media-fit",
    "hb-has-media-radius",
  ]) {
    assert.ok(styled.includes(cls), cls);
  }
  /* نصف قطر صفر قيمة مقصودة — لا تُهمَل */
  assert.ok(blockScopeClasses({ mediaRadius: 0 }).includes("hb-has-media-radius"));
  assert.ok(!blockScopeClasses({ mediaRadius: 0 }).includes("hb-has-media-height"));
});

test("background controls and full-bleed media get their activation classes", () => {
  /* لون الخلفية يحتاج كلاس تفعيل حتى يتجاوز خلفية القسم الداخلية */
  assert.ok(blockScopeClasses({ background: "#ffffff" }).includes("hb-has-bg"));
  assert.ok(!blockScopeClasses({}).includes("hb-has-bg"));

  /* وسائط الخلفية (هيرو/بانر) تُوسم حتى يحكم ارتفاعها القسم نفسه */
  const hero = blockScopeClasses({ mediaHeight: 420 }, { backgroundMedia: true });
  assert.ok(hero.includes("hb-bg-media"));
  assert.ok(hero.includes("hb-has-media-height"));
  /* القسم النصي: الارتفاع يخص الصورة وحدها */
  assert.ok(!blockScopeClasses({ mediaHeight: 420 }).includes("hb-bg-media"));
});

test("css variables are emitted only for configured properties", () => {
  assert.deepEqual(blockCssVars(undefined), {});

  const vars = blockCssVars({
    titleSize: 48,
    bodySize: 18,
    titleColor: "#f5d996",
    bodyColor: "#c2c9dd",
    align: "center",
    paddingY: 24,
    background: "#0d3b2e",
    mediaHeight: 360,
    mediaFit: "cover",
    mediaRadius: 18,
  });

  /* الحجم محصور بـ clamp حتى لا يتكسّر على الموبايل */
  assert.match(vars["--hb-title-size"], /^clamp\(30px, 4\.2vw, 48px\)$/);
  assert.match(vars["--hb-body-size"], /^clamp\(15px, 3\.2vw, 18px\)$/);
  assert.equal(vars["--hb-title-color"], "#f5d996");
  assert.equal(vars["--hb-body-color"], "#c2c9dd");
  assert.equal(vars["--hb-align"], "center");
  assert.equal(vars["--hb-py"], "24px");
  assert.equal(vars["--hb-bg"], "#0d3b2e");
  assert.equal(vars["--hb-media-height"], "360px");
  assert.equal(vars["--hb-media-fit"], "cover");
  assert.equal(vars["--hb-radius"], "18px");

  /* التنسيق الفارغ لا يحقن أي متغيّر */
  assert.deepEqual(blockCssVars({}), {});
});

test("font options cover the four supported families", () => {
  assert.deepEqual(
    FONT_OPTIONS.map((font) => font.value),
    ["cairo", "tajawal", "amiri", "readex"]
  );
  for (const font of FONT_OPTIONS) {
    assert.equal(blockFontClass({ fontFamily: font.value }), `hb-font-${font.value}`);
  }
});

test("video links are normalized to embeddable players", () => {
  assert.equal(
    toEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    "https://www.youtube.com/embed/dQw4w9WgXcQ"
  );
  assert.equal(
    toEmbedUrl("https://youtu.be/dQw4w9WgXcQ"),
    "https://www.youtube.com/embed/dQw4w9WgXcQ"
  );
  assert.equal(
    toEmbedUrl("https://vimeo.com/123456789"),
    "https://player.vimeo.com/video/123456789"
  );
  /* أي رابط آخر يبقى كما هو */
  assert.equal(toEmbedUrl("https://example.com/video"), "https://example.com/video");
});

test("media resolver distinguishes images, direct videos and embeds", () => {
  assert.deepEqual(resolveMedia("https://cdn.test/a.jpg"), {
    kind: "image",
    src: "https://cdn.test/a.jpg",
  });
  assert.deepEqual(resolveMedia("https://cdn.test/clip.mp4"), {
    kind: "video",
    src: "https://cdn.test/clip.mp4",
  });
  assert.deepEqual(resolveMedia("https://youtu.be/dQw4w9WgXcQ"), {
    kind: "embed",
    src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  });
  assert.deepEqual(resolveMedia("https://vimeo.com/123456789"), {
    kind: "embed",
    src: "https://player.vimeo.com/video/123456789",
  });
  /* الروابط الفارغة تعني «لا وسائط» */
  assert.equal(resolveMedia(""), null);
  assert.equal(resolveMedia("   "), null);
  assert.equal(resolveMedia(undefined), null);
});
