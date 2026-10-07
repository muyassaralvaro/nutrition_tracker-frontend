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

for (const path of ["/login", "/register"]) {
  const response = await fetch(new URL(path, origin));
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Phone number/);
  assert.match(html, /Continue with Google/);
}

console.log("Intro redirect and auth routes passed");
