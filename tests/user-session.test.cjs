const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "..", "src", "lib", "user-session.ts");
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

const { createUserToken, verifyUserToken, USER_SESSION_MAX_AGE } = loaded.exports;
const SECRET = "user-session-test-".padEnd(64, "u");

test.beforeEach(() => {
  process.env.USER_SESSION_SECRET = SECRET;
  delete process.env.ADMIN_SESSION_SECRET;
});

test("a signed user token preserves its server-side session version", async () => {
  const token = await createUserToken({
    sub: "account-1",
    email: "user@example.com",
    name: "مستخدم",
    ver: 4,
  });
  const payload = await verifyUserToken(token);
  assert.ok(payload);
  assert.equal(payload.sub, "account-1");
  assert.equal(payload.ver, 4);
  assert.ok(payload.exp <= Math.floor(Date.now() / 1000) + USER_SESSION_MAX_AGE + 5);
});

test("an expired or versionless user token is rejected", async () => {
  const expired = await createUserToken({
    sub: "account-1",
    email: "user@example.com",
    name: "مستخدم",
    ver: 1,
    exp: Math.floor(Date.now() / 1000) - 10,
  });
  assert.equal(await verifyUserToken(expired), null);

  const versionless = await createUserToken({
    sub: "account-1",
    email: "user@example.com",
    name: "مستخدم",
    ver: undefined,
  });
  assert.equal(await verifyUserToken(versionless), null);
});

test("tampering and secret rotation invalidate user tokens", async () => {
  const token = await createUserToken({
    sub: "account-1",
    email: "user@example.com",
    name: "مستخدم",
    ver: 2,
  });
  const [body, signature] = token.split(".");
  const replacement = body.endsWith("a") ? "b" : "a";
  assert.equal(
    await verifyUserToken(`${body.slice(0, -1)}${replacement}.${signature}`),
    null
  );

  process.env.USER_SESSION_SECRET = "rotated-user-secret".padEnd(64, "r");
  assert.equal(await verifyUserToken(token), null);
});

test("user sessions fail closed when no secret is configured", async () => {
  delete process.env.USER_SESSION_SECRET;
  delete process.env.ADMIN_SESSION_SECRET;
  assert.equal(await verifyUserToken("a.b"), null);
  await assert.rejects(() =>
    createUserToken({
      sub: "account-1",
      email: "user@example.com",
      name: "مستخدم",
      ver: 1,
    })
  );
});
