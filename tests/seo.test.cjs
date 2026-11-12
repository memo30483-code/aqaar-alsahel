const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

function read(relative) {
  return fs.readFileSync(path.join(__dirname, "..", relative), "utf8");
}

test("SEO metadata routes and structured data are present", () => {
  for (const file of [
    "src/app/robots.ts",
    "src/app/sitemap.ts",
    "src/app/manifest.ts",
  ]) {
    assert.equal(fs.existsSync(path.join(__dirname, "..", file)), true, file);
  }
  const layout = read("src/app/layout.tsx");
  assert.match(layout, /metadataBase/);
  assert.match(layout, /openGraph/);
  assert.match(layout, /organizationJsonLd/);
});

test("optional builder fonts do not preload globally", () => {
  const layout = read("src/app/layout.tsx");
  const optionalFonts = ["Tajawal", "Amiri", "Readex_Pro"];
  for (const font of optionalFonts) assert.match(layout, new RegExp(`${font}[\\s\\S]*?preload: false`));
});

test("the app exposes exactly one authored main landmark", () => {
  const files = [];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(target);
      else if (entry.name.endsWith(".tsx")) files.push(target);
    }
  };
  walk(path.join(__dirname, "..", "src"));
  const matches = files.flatMap((file) => {
    const source = fs.readFileSync(file, "utf8");
    return source.includes("<main") ? [path.relative(path.join(__dirname, ".."), file)] : [];
  });
  assert.deepEqual(matches, [path.join("src", "app", "layout.tsx")]);
});

test("assistant dialog uses inert and accessible focus management", () => {
  const assistant = read("src/components/AssistantWidget.tsx");
  assert.match(assistant, /inert=!\{?open|inert=\{!open\}/);
  assert.match(assistant, /aria-modal="true"/);
  assert.match(assistant, /closePanel/);
  assert.match(assistant, /event\.key !== "Tab"/);
});
