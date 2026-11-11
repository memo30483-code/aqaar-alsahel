const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

function read(relative) {
  return fs.readFileSync(path.join(__dirname, "..", relative), "utf8");
}

test("professional owner API requires a server user session and handles conflicts", () => {
  const route = read("src/app/api/professional/me/route.ts");
  assert.match(route, /getUserApiSession\(\)/);
  assert.match(route, /sameOrigin\(request\)/);
  assert.match(route, /ProfessionalConflictError/);
  assert.match(route, /status: 409/);
});

test("professional updates are atomic, owner-scoped, and version checked", () => {
  const sql = read("supabase/migrations/20261111_professional_ownership.sql");
  assert.match(sql, /create or replace function public\.update_owned_professional/);
  assert.match(sql, /for update/);
  assert.match(sql, /item->>'accountId' = p_account_id/);
  assert.match(sql, /v_version <> p_expected_version/);
  assert.match(sql, /'result', 'conflict'/);
  assert.match(sql, /revoke all on function/);
  assert.match(sql, /grant execute[\s\S]*service_role/);
  assert.match(sql, /create or replace function public\.update_professionals_admin/);
  assert.match(sql, /incoming_item - 'version'/);
});

test("all professional writes are canonicalized before app_state persistence", () => {
  const stateRoute = read("src/app/api/state/route.ts");
  const registration = read("src/app/api/auth/register/route.ts");
  const privacy = read("src/lib/cloud/privacy.ts");
  assert.match(stateRoute, /canonicalProfessionalsValue\(entry\.value\)/);
  assert.match(registration, /canonicalProfessionalsValue\(stored\)/);
  assert.match(privacy, /professionalItems\(value\)/);
});

test("professional dashboard sync exposes retry and unload protection", () => {
  const hook = read("src/lib/use-professional-sync.ts");
  assert.match(hook, /\/api\/professional\/me/);
  assert.match(hook, /expectedVersion/);
  assert.match(hook, /beforeunload/);
  assert.match(hook, /conflict/);
});
