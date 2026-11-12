const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

function read(relative) {
  return fs.readFileSync(path.join(__dirname, "..", relative), "utf8");
}

const migration = read("supabase/migrations/20261112_reliability.sql");

test("account and professional creation use atomic PostgreSQL functions", () => {
  assert.match(migration, /function public\.register_user_account/);
  assert.match(migration, /where key = 'aqaar-accounts'[\s\S]*for update/);
  assert.match(migration, /function public\.create_professional_record/);
  assert.match(migration, /where key = 'aqaar-professionals'[\s\S]*for update/);
  assert.match(migration, /email_exists/);
});

test("property submission is transactional and idempotent", () => {
  assert.match(migration, /request_idempotency/);
  assert.match(migration, /primary key \(scope, actor_id, idempotency_key\)/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /function public\.create_property_submission/);
  assert.match(migration, /'result', 'duplicate'/);
  assert.match(migration, /insert into public\.inquiries/);
  assert.match(migration, /where key = 'aqaar-properties'[\s\S]*for update/);
});

test("temporary uploads are tracked, claimed, and private from browser roles", () => {
  assert.match(migration, /create table if not exists public\.upload_staging/);
  assert.match(migration, /claimed_at/);
  assert.match(migration, /alter table public\.upload_staging enable row level security/);
  assert.match(migration, /revoke all on table public\.request_idempotency, public\.upload_staging/);

  const uploadRoute = read("src/app/api/uploads/property/route.ts");
  assert.match(uploadRoute, /cloudTrackStagedUpload\(/);
  assert.match(uploadRoute, /cloudDeleteStorageObject\(/);
});

test("public write routes use the shared Supabase rate limiter", () => {
  for (const file of [
    "src/app/api/requests/route.ts",
    "src/app/api/reviews/route.ts",
    "src/app/api/property-submissions/route.ts",
    "src/app/api/reviews/[id]/report/route.ts",
  ]) {
    const source = read(file);
    assert.match(source, /checkRateLimit\(/, file);
    assert.doesNotMatch(source, /new Map<string, \{ count:/, file);
  }
});

test("health and authenticated cleanup endpoints are wired", () => {
  const health = read("src/app/api/health/route.ts");
  const cleanup = read("src/app/api/cron/cleanup-uploads/route.ts");
  const vercel = JSON.parse(read("vercel.json"));
  assert.match(health, /upload_staging/);
  assert.match(health, /rate_limits/);
  assert.match(cleanup, /CRON_SECRET/);
  assert.equal(vercel.crons[0].path, "/api/cron/cleanup-uploads");
});
