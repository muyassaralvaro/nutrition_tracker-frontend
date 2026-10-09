import assert from "node:assert/strict";

const origin = process.argv[2] ?? "http://localhost:3000";
const first = await fetch(origin, { redirect: "manual" });
assert.equal(first.status, 200, "First visit should show introduction");

const returning = await fetch(origin, {
  headers: { Cookie: "nourish_intro_seen=1" },
  redirect: "manual",
});
assert.equal(returning.status, 307, "Returning visit should redirect");
assert.equal(new URL(returning.headers.get("location"), origin).pathname, "/login");

const login = await fetch(new URL("/login", origin));
assert.equal(login.status, 200);
const html = await login.text();
assert.match(html, /Continue with Google/);
assert.match(html, /Terms of Service/);
assert.doesNotMatch(html, /Phone number/);

const register = await fetch(new URL("/register", origin), { redirect: "manual" });
assert.equal(register.status, 307);
assert.equal(new URL(register.headers.get("location"), origin).pathname, "/login");

console.log("Intro redirect and auth routes passed");
