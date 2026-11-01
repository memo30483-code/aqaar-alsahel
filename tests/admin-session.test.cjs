const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");

const sourcePath = path.join(
  __dirname,
  "..",
  "src",
  "lib",
  "admin-session.ts"
);
const source = fs.readFileSync(sourcePath, "utf8");
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

const { createAdminToken, verifyAdminToken, ADMIN_SESSION_MAX_AGE } =
  loaded.exports;

const SECRET = "test-secret-".padEnd(64, "x");

test.beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = SECRET;
});

test("a signed admin token verifies and keeps its identity", async () => {
  const token = await createAdminToken({
    sub: "admin@aqaar.com",
    name: "مدير النظام",
    role: "super_admin",
  });
  assert.equal(typeof token, "string");
  assert.equal(token.split(".").length, 2);

  const payload = await verifyAdminToken(token);
  assert.ok(payload);
  assert.equal(payload.sub, "admin@aqaar.com");
  assert.equal(payload.role, "super_admin");
  assert.ok(payload.exp > Math.floor(Date.now() / 1000));
  assert.ok(
    payload.exp <= Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE + 5
  );
});

test("a tampered payload is rejected", async () => {
  const token = await createAdminToken({
    sub: "user@example.com",
    name: "مستخدم",
    role: "admin",
  });
  const [, signature] = token.split(".");
  const forged = Buffer.from(
    JSON.stringify({
      sub: "admin@aqaar.com",
      name: "منتحل",
      role: "super_admin",
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  )
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  assert.equal(await verifyAdminToken(`${forged}.${signature}`), null);
});

test("a token signed with another secret is rejected", async () => {
  const token = await createAdminToken({
    sub: "admin@aqaar.com",
    name: "مدير النظام",
    role: "super_admin",
  });
  process.env.ADMIN_SESSION_SECRET = "another-secret".padEnd(64, "y");
  assert.equal(await verifyAdminToken(token), null);
});

test("an expired token is rejected", async () => {
  const token = await createAdminToken({
    sub: "admin@aqaar.com",
    name: "مدير النظام",
    role: "admin",
    exp: Math.floor(Date.now() / 1000) - 60,
  });
  assert.equal(await verifyAdminToken(token), null);
});

test("verification fails closed without a server secret", async () => {
  const token = await createAdminToken({
    sub: "admin@aqaar.com",
    name: "مدير النظام",
    role: "admin",
  });
  delete process.env.ADMIN_SESSION_SECRET;
  assert.equal(await verifyAdminToken(token), null);
  await assert.rejects(() =>
    createAdminToken({ sub: "x", name: "x", role: "admin" })
  );
});

test("garbage tokens never verify", async () => {
  for (const value of ["", "abc", "a.b.c", "....", "null.null"]) {
    assert.equal(await verifyAdminToken(value), null, value);
  }
  assert.equal(await verifyAdminToken(null), null);
  assert.equal(await verifyAdminToken(undefined), null);
});
