const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");

function loadTs(relativeFile) {
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
  new Function("exports", "require", "module", js)(
    loaded.exports,
    require,
    loaded
  );
  return loaded.exports;
}

const reviews = loadTs("src/lib/reviews.ts");

const AT = "2026-11-05T10:00:00.000Z";

function buildReview(overrides = {}) {
  return {
    id: "r1",
    entityType: "property",
    entityId: "dm-1",
    name: "زائر",
    rating: 5,
    subRatings: {},
    status: "approved",
    verified: false,
    reportedCount: 0,
    createdAt: AT,
    updatedAt: AT,
    ...overrides,
  };
}

test("default review settings enable moderation and sub-ratings", () => {
  const settings = reviews.normalizeReviewSettings(null);
  assert.equal(settings.policy, "open_verified");
  assert.equal(settings.moderation, true);
  for (const entity of reviews.REVIEW_ENTITIES) {
    assert.equal(settings.subRatings[entity].enabled, true);
    assert.ok(settings.subRatings[entity].items.length >= 3);
  }
});

test("review policy is validated and moderation can be disabled", () => {
  const settings = reviews.normalizeReviewSettings({
    policy: "anything",
    moderation: false,
    subRatings: { property: { enabled: false, items: [] } },
  });
  assert.equal(settings.policy, "open_verified");
  assert.equal(settings.moderation, false);
  assert.equal(settings.subRatings.property.enabled, false);
  assert.ok(settings.subRatings.property.items.length > 0);
});

test("public settings never expose admin-only fields", () => {
  const settings = reviews.normalizeReviewSettings({
    policy: "verified_only",
    moderation: true,
    updatedBy: "secret-admin",
  });
  const shared = reviews.publicReviewSettings(settings, "developer");
  assert.deepEqual(Object.keys(shared).sort(), ["moderation", "policy", "subRatings"]);
  assert.equal(shared.policy, "verified_only");
});

test("summary computes average, distribution and sub-rating averages", () => {
  const summary = reviews.summarizeReviews([
    buildReview({ id: "r1", rating: 5, subRatings: { accuracy: 5, value: 4 } }),
    buildReview({ id: "r2", rating: 3, subRatings: { accuracy: 3 } }),
    buildReview({ id: "r3", rating: 4, subRatings: {} }),
  ]);
  assert.equal(summary.count, 3);
  assert.equal(summary.average, 4);
  assert.equal(summary.distribution[5], 1);
  assert.equal(summary.distribution[3], 1);
  assert.equal(summary.subAverages.accuracy, 4);
  assert.equal(summary.subAverages.value, 4);
});

test("comment guard blocks links and phone numbers but allows reviews", () => {
  assert.equal(reviews.reviewCommentIssue("عقار ممتاز والموقع جميل"), null);
  assert.match(reviews.reviewCommentIssue("شوف https://spam.example"), /روابط/);
  assert.match(reviews.reviewCommentIssue("كلمني على 01012345678"), /هواتف/);
  assert.match(reviews.reviewCommentIssue("x".repeat(1300)), /أطول/);
});

test("reviews schema enables RLS and revokes browser access", () => {
  const sql = fs.readFileSync(
    path.join(__dirname, "..", "supabase/migrations/20261105_reviews.sql"),
    "utf8"
  );
  for (const table of ["reviews", "review_settings"]) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`));
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
    assert.match(sql, new RegExp(`revoke all on table public\\.${table} from anon, authenticated`));
  }
  assert.match(sql, /review_report/);
});

test("public review api applies policy, moderation and rate limits", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "src/app/api/reviews/route.ts"),
    "utf8"
  );
  assert.match(source, /sameOrigin\(request\)/);
  assert.match(source, /MAX_POSTS/);
  assert.match(source, /verified_only/);
  assert.match(source, /moderation: settings\.moderation/);
  assert.match(source, /publicReviewSettings/);
});

test("admin review api requires a signed admin session", () => {
  const collection = fs.readFileSync(
    path.join(__dirname, "..", "src/app/api/admin/reviews/route.ts"),
    "utf8"
  );
  const single = fs.readFileSync(
    path.join(__dirname, "..", "src/app/api/admin/reviews/[id]/route.ts"),
    "utf8"
  );
  assert.match(collection, /getAdminApiSession\(\)/);
  assert.match(single, /getAdminApiSession\(\)/);
  assert.match(collection, /cloudSaveReviewSettings/);
  assert.match(single, /cloudUpdateReview/);
  assert.match(single, /cloudDeleteReview/);
});

test("reviews are wired into property, developer and professional pages", () => {
  const property = fs.readFileSync(
    path.join(__dirname, "..", "src/components/PropertyDetail.tsx"),
    "utf8"
  );
  const professional = fs.readFileSync(
    path.join(__dirname, "..", "src/components/professionals/ProfessionalProfile.tsx"),
    "utf8"
  );
  assert.match(property, /<ReviewsSection[\s\S]*entityType="property"/);
  assert.match(professional, /kind === "developer" \? "developer" : "professional"/);
});

test("admin dashboard exposes the reviews tab with its permission", () => {
  const dashboard = fs.readFileSync(
    path.join(__dirname, "..", "src/components/AdminDashboard.tsx"),
    "utf8"
  );
  const system = fs.readFileSync(
    path.join(__dirname, "..", "src/lib/admin-system.ts"),
    "utf8"
  );
  assert.match(dashboard, /key: "reviews"/);
  assert.match(dashboard, /permission: "reviews\.view"/);
  assert.match(system, /"reviews\.view", "reviews\.manage"/);
});

test("summary api validates the entity and caps the number of ids", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "src/app/api/reviews/summary/route.ts"),
    "utf8"
  );
  assert.match(source, /ENTITIES/);
  assert.match(source, /ID_PATTERN/);
  assert.match(source, /ids\.length > 60/);
  assert.match(source, /cloudGetRatingSummaries/);
  assert.match(source, /s-maxage=30/);
});

test("summary aggregation counts only approved ratings and rounds averages", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "src/lib/reviews-server.ts"),
    "utf8"
  );
  assert.match(source, /cloudGetRatingSummaries/);
  assert.match(source, /status: "eq\.approved"/);
  assert.match(source, /entity_id: `in\.\(/);
  assert.match(source, /Math\.round\(\(entry\.total \/ entry\.count\) \* 10\) \/ 10/);
});

test("property and professional cards show a rating badge linking to reviews", () => {
  const card = fs.readFileSync(
    path.join(__dirname, "..", "src/components/PropertyCard.tsx"),
    "utf8"
  );
  const directory = fs.readFileSync(
    path.join(__dirname, "..", "src/components/professionals/ProfessionalDirectory.tsx"),
    "utf8"
  );
  const section = fs.readFileSync(
    path.join(__dirname, "..", "src/components/reviews/ReviewsSection.tsx"),
    "utf8"
  );
  assert.match(card, /<RatingBadge[\s\S]*entityType="property"/);
  assert.match(card, /#reviews/);
  assert.match(directory, /<RatingBadge[\s\S]*kind === "developer" \? "developer" : "professional"/);
  assert.match(section, /id="reviews"/);
});

