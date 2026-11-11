const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

function source(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8");
}

test("user login is limited by both IP and normalized email", () => {
  const login = source("src/app/api/auth/login/route.ts");
  assert.match(login, /hashRateKey\("user-login", clientIp\(request\)\)/);
  assert.match(login, /hashRateKey\("user-login-email", normalizeEmail\(email\)\)/);
  assert.match(login, /EMAIL_RATE/);
});

test("legacy property requests are never authorized by email alone", () => {
  const mine = source("src/app/api/property-requests/mine/route.ts");
  const ownedBy = mine.match(/function ownedBy[\s\S]*?\n}/)?.[0] ?? "";
  assert.match(ownedBy, /item\.accountId === session\.sub/);
  assert.doesNotMatch(ownedBy, /session\.email|item\.email/);
});

test("registration requires a verified email proof and versioned session", () => {
  const registration = source("src/app/api/auth/register/route.ts");
  const otp = source("src/lib/otp-server.ts");
  const accounts = source("src/lib/auth/accounts.ts");
  assert.match(registration, /otp_provider_unavailable/);
  assert.match(registration, /emailVerifiedAt: verifiedAt/);
  assert.match(registration, /sessionVersion: 1/);
  assert.match(otp, /proof\.channel !== "email"/);
  assert.match(accounts, /sessionVersion/);
});

test("session versions are checked and revoked on logout or member status change", () => {
  const apiSession = source("src/lib/user-api.ts");
  const logout = source("src/app/api/auth/logout/route.ts");
  const members = source("src/app/api/admin/members/route.ts");
  assert.match(apiSession, /account\.sessionVersion !== payload\.ver/);
  assert.match(logout, /revokeAccountSessions\(session\.sub\)/);
  assert.match(members, /sessionVersion: current\.sessionVersion \+ 1/);
});
