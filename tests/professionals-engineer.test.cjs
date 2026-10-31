const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "..", "src", "lib", "professionals-store.ts");
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
      useState: (initial) => [typeof initial === "function" ? initial() : initial, () => {}],
    };
  }
  if (id === "@/lib/embed") {
    return {
      detectReelPlatform: () => "youtube",
      toEmbedUrl: (url) => url,
    };
  }
  if (id === "@/lib/projects-taxonomy") {
    return {
      projectTypeLabel: (id) => id,
      resolveProjectTypeId: () => undefined,
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
  PROFESSIONAL_KINDS,
  PROFESSIONAL_KIND_META,
  addProfessionalProject,
  getPublicProfessionals,
  hasPortfolio,
  setProfessionalProjectStatus,
} = loaded.exports;

test("engineer is a first-class professional kind with its own route", () => {
  assert.ok(PROFESSIONAL_KINDS.includes("engineer"));
  assert.equal(PROFESSIONAL_KIND_META.engineer.path, "/engineers");
  assert.equal(PROFESSIONAL_KIND_META.engineer.labelAr, "المكاتب الهندسية");
  assert.equal(PROFESSIONAL_KIND_META.engineer.singularAr, "مكتب هندسي");
});

test("only the lawyer is excluded from the portfolio section", () => {
  assert.equal(hasPortfolio("engineer"), true);
  assert.equal(hasPortfolio("developer"), true);
  assert.equal(hasPortfolio("marketer"), true);
  assert.equal(hasPortfolio("lawyer"), false);
});

test("approved engineering offices are published with their portfolio", () => {
  memory.clear();
  const offices = getPublicProfessionals("engineer");
  assert.equal(offices.length, 3);
  assert.ok(offices.every((office) => office.kind === "engineer"));
  assert.ok(offices.every((office) => office.status === "approved"));
  const works = offices.flatMap((office) => office.projects);
  assert.ok(works.length >= 6);
  assert.ok(works.every((work) => work.status === "approved"));
  assert.ok(works.some((work) => work.roleAr && work.year));
});

test("admin can add a portfolio work and publish it immediately", () => {
  memory.clear();
  const [office] = getPublicProfessionals("engineer");

  const result = addProfessionalProject(office.id, {
    titleAr: "فحص إنشائي — عمارة سكنية",
    descriptionAr: "تقرير حالة إنشائية قبل الشراء.",
    cityAr: "دمياط",
    roleAr: "فحص فني",
    year: "2026",
  });
  assert.equal(result.ok, true);

  setProfessionalProjectStatus(office.id, result.project.id, "approved");

  const updated = getPublicProfessionals("engineer").find(
    (record) => record.id === office.id
  );
  const work = updated.projects.find((project) => project.id === result.project.id);
  assert.ok(work);
  assert.equal(work.status, "approved");
  assert.equal(work.roleAr, "فحص فني");
  assert.equal(work.year, "2026");
});

test("unknown professional kinds are dropped instead of leaking into the directory", () => {
  memory.clear();
  memory.set(
    "aqaar-professionals",
    JSON.stringify({
      items: [
        { id: "bad-1", kind: "impostor", nameAr: "سجل غير معروف", status: "approved" },
      ],
    })
  );
  assert.deepEqual(getPublicProfessionals(), []);
});
