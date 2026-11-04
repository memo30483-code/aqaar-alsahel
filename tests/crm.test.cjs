const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");

function loadTs(relativeFile, deps = {}) {
  const source = fs.readFileSync(
    path.join(__dirname, "..", relativeFile),
    "utf8"
  );
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

const crm = loadTs("src/lib/crm-types.ts");
const keys = loadTs("src/lib/cloud/keys.ts");

const AT = "2026-11-04T10:00:00.000Z";

test("crm store key is private and registered in cloud sync", () => {
  assert.equal(keys.CLOUD_KEYS[crm.CRM_KEY].public, false);
});

test("crm normalization accepts legacy { items } and drops invalid rows", () => {
  const leads = crm.normalizeCrmLeads({
    items: [
      {
        id: "lead-1",
        name: "عميل تجريبي",
        phone: "201000000000",
        stage: "unknown-stage",
        createdAt: AT,
        tags: ["شقة", "", 5],
        activities: [{ id: "a1", kind: "call", text: "اتصال", at: AT, by: "هبة" }],
        tasks: [{ id: "t1", title: "متابعة", dueAt: AT }],
      },
      { name: "بدون معرّف" },
      null,
    ],
  });

  assert.equal(leads.length, 1);
  assert.equal(leads[0].stage, "new");
  assert.deepEqual(leads[0].tags, ["شقة"]);
  assert.equal(leads[0].activities[0].kind, "call");
  assert.equal(leads[0].tasks[0].done, false);
});

test("a property submission becomes a new lead with its private contact data", () => {
  const lead = crm.propertyLead({
    id: "user-1",
    title: "شقة على البحر",
    city: "دمياط الجديدة",
    district: "الحي الأول",
    type: "شقة",
    area: 120,
    rooms: 3,
    bathrooms: 2,
    price: 2000000,
    sellerType: "فرد",
    whatsapp: "201000000000",
    ownerName: "أحمد محمود",
    description: "وصف",
    image: "https://example.com/x.jpg",
    images: [],
    lat: 31.4,
    lng: 31.8,
    purpose: "بيع",
    status: "pending",
    submittedAt: AT,
    reference: "AQF-2026-1",
  });

  assert.equal(lead.name, "أحمد محمود");
  assert.equal(lead.phone, "201000000000");
  assert.equal(lead.source, "property");
  assert.equal(lead.sourceRef, "user-1");
  assert.equal(lead.stage, "new");
  assert.equal(lead.budget, 2000000);
  assert.equal(lead.reference, "AQF-2026-1");
  assert.deepEqual(lead.tags, ["عقار", "بيع"]);
  assert.equal(lead.activities.length, 1);
});

test("a rejected property starts as a lost opportunity", () => {
  const lead = crm.propertyLead({
    id: "user-2",
    title: "فيلا",
    city: "رأس البر",
    district: "",
    type: "فيلا",
    area: 300,
    rooms: 5,
    bathrooms: 3,
    price: 0,
    priceByAdmin: true,
    sellerType: "فرد",
    whatsapp: "",
    description: "",
    image: "",
    images: [],
    lat: 31.5,
    lng: 31.8,
    status: "rejected",
  });

  assert.equal(lead.stage, "lost");
  assert.equal(lead.budget, undefined);
  assert.equal(lead.name, "فيلا");
});

test("professional contact requests are imported once with their message", () => {
  const lead = crm.professionalLead({
    id: "req-1",
    professionalId: "law-1",
    professionalName: "أ. محمود",
    kind: "lawyer",
    name: "سارة",
    phone: "201111111111",
    email: "sara@example.com",
    message: "محتاجة مراجعة عقد",
    status: "new",
    createdAt: AT,
  });

  assert.equal(lead.source, "professional");
  assert.equal(lead.sourceRef, "req-1");
  assert.equal(lead.interest, "استشارة محامي — أ. محمود");
  assert.equal(lead.notes, "محتاجة مراجعة عقد");
  assert.equal(lead.email, "sara@example.com");
});

test("public inquiries import while property inquiries are skipped as duplicates", () => {
  const skipped = crm.inquiryLead({
    id: "inq-1",
    kind: "property_submission",
    name: "طلب عقار",
    created_at: AT,
  });
  assert.equal(skipped, null);

  const lead = crm.inquiryLead({
    id: "inq-2",
    kind: "general",
    name: "محمد",
    phone: "201222222222",
    message: "عايز أعرف أسعار دمياط",
    created_at: AT,
  });

  assert.equal(lead.source, "inquiry");
  assert.equal(lead.sourceRef, "inquiry:inq-2");
  assert.equal(lead.interest, "عايز أعرف أسعار دمياط");
  assert.equal(lead.stage, "new");
});

test("every crm stage has an Arabic label and a visual style", () => {
  for (const stage of crm.CRM_STAGES) {
    assert.ok(crm.CRM_STAGE_LABEL[stage.key]);
    assert.ok(crm.CRM_STAGE_STYLE[stage.key]);
    assert.ok(stage.dot);
  }
  for (const source of Object.keys(crm.CRM_SOURCE_LABEL)) {
    assert.ok(crm.CRM_SOURCE_LABEL[source]);
  }
});
