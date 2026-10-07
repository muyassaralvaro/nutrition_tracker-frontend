import assert from "node:assert/strict";

const { displayHeight, displayWeight, estimateTargets, feetAndInches, heightToCm, leanMassWeightRange, referenceWeightRange, scalePortion, weightToKg } = await import("../modules/tracker/nutrition.ts");
const { ageFromBirthDate, clearTrackerData, fetchTargetEstimate, initializeTracker, isValidDate, loadCalendar, localDateKey, removeMeal, saveAvatar, saveMeal, saveSetup, saveWeight } = await import("../modules/tracker/tracker-data.ts");
const { formatWeightDate } = await import("../modules/tracker/pages/profile/weight-history.ts");

assert.equal(isValidDate("2026-02-30"), false);
assert.equal(isValidDate("2026-02-28"), true);
assert.equal(ageFromBirthDate("2000-10-08", "2026-10-07"), 25);
assert.equal(ageFromBirthDate("2000-10-07", "2026-10-07"), 26);
assert.equal(formatWeightDate("2026-10-07", "en"), "07-Oct-2026");
assert.equal(formatWeightDate("2026-10-07", "id"), "07-Okt-2026");
assert.equal(displayWeight(70, "imperial"), 154.3);
assert.ok(Math.abs(weightToKg(displayWeight(70, "imperial"), "imperial") - 70) < 0.05);
assert.ok(Math.abs(heightToCm(displayHeight(170, "imperial"), "imperial") - 170) < 0.2);
assert.deepEqual(feetAndInches(heightToCm(5 * 12 + 11, "imperial")), [5, 11]);
assert.deepEqual(referenceWeightRange(170), [53.5, 72]);
assert.deepEqual(leanMassWeightRange(70, 20, "male"), [62.2, 73.7]);
const serving = { calories: "230", protein: "0.3", carbs: "43", fat: "5", fiber: "", sodium: "60", potassium: "", calcium: "35", iron: "1" };
assert.equal(scalePortion(serving, 90, 91).protein, "0.3");
assert.deepEqual(scalePortion(serving, 90, 180), { calories: "460", protein: "0.6", carbs: "86", fat: "10", fiber: "", sodium: "120", potassium: "", calcium: "70", iron: "2" });
assert.equal(scalePortion(serving, 90, 90).protein, "0.3");

const today = localDateKey();
const targets = estimateTargets({ age: 30, heightCm: 170, weightKg: 70, sex: "male", goal: "maintain", build: "muscular", activityMinutes: 60, activityType: "strength" });
assert.equal(targets.calories, 2510);
assert.ok(estimateTargets({ age: 30, heightCm: 170, weightKg: 70, sex: "male", goal: "maintain", build: "muscular", activityMinutes: 90, activityType: "strength" }).calories > targets.calories);
assert.equal(targets.sodium, 2300);

let profile = null;
let weight = null;
let meal = null;
let avatarUrl = null;
let targetSource = null;
let csrfCalls = 0;
let writes = 0;
globalThis.document = { cookie: "XSRF-TOKEN=abc%3D" };
globalThis.fetch = async (url, options = {}) => {
  const path = new URL(url).pathname;
  const method = options.method ?? "GET";
  if (path === "/sanctum/csrf-cookie") { csrfCalls++; return new Response(null, { status: 204 }); }
  assert.equal(options.credentials, "include");
  if (method !== "GET") { writes++; assert.equal(options.headers.get("X-XSRF-TOKEN"), "abc="); }
  const body = options.body && !(options.body instanceof FormData) ? JSON.parse(options.body) : null;
  const json = (data) => Response.json({ data });
  if (path === "/api/v1/me" && method === "GET") return json({ id: 1, name: profile?.name ?? "Kai", phone_e164: "+6281234567890", email: null, avatar_url: avatarUrl, has_password: true });
  if (path === "/api/v1/me/avatar" && method === "PUT") { assert.ok(options.body instanceof FormData); assert.equal(options.body.get("image")?.type, "image/jpeg"); avatarUrl = "/api/v1/me/avatar?v=uploaded.jpg"; return json({ id: 1, name: "Kai", phone_e164: "+6281234567890", email: null, avatar_url: avatarUrl, has_password: true }); }
  if (path === "/api/v1/me/profile" && method === "GET") return json(profile);
  if (path === "/api/v1/me/weights" && method === "GET") return json(weight ? [weight] : []);
  if (path === `/api/v1/days/${today}`) return json({ date: today, target: profile ? { ...targets, source: targetSource } : null, weight, meals: meal ? [meal] : [], nutrition: { status: meal ? "progress" : "empty", totals: meal?.nutrition.totals ?? Object.fromEntries(Object.keys(targets).map((key) => [key, 0])), known: Object.fromEntries(Object.keys(targets).map((key) => [key, true])), remaining: targets } });
  if (path === "/api/v1/target-estimates" && method === "POST") { assert.equal(body.weight_kg, 70); return json({ targets }); }
  if (path === "/api/v1/me/setup" && method === "PUT") { assert.equal(body.target_source, "estimated"); assert.equal(body.targets.calories, 2510); targetSource = body.target_source; profile = { name: body.name, birth_date: body.birth_date, height_cm: body.height_cm, unit_system: body.unit_system, sex: body.sex, body_build: body.body_build, body_fat_percent: body.body_fat_percent, activity_minutes: body.activity_minutes, activity_type: body.activity_type, goal: body.goal, goal_weight_kg: body.goal_weight_kg }; weight = { id: 1, entry_date: today, kg: body.weight_kg }; return json(profile); }
  if (path === "/api/v1/me/weights/1" && method === "PUT") { weight.kg = body.kg; return json(weight); }
  if (path === "/api/v1/meals" && method === "POST") { assert.match(body.client_request_id, /^[0-9a-f-]{36}$/); assert.equal(body.items.length, 2); meal = { id: 7, meal_date: body.meal_date, meal_time: body.meal_time, title: body.title, items: body.items, nutrition: { totals: body.items[0].nutrients } }; return json(meal); }
  if (path === "/api/v1/meals/7" && method === "DELETE") { meal = null; return new Response(null, { status: 204 }); }
  if (path === "/api/v1/calendar" && method === "GET") return json({ month: today.slice(0, 7), days: [{ date: today, status: meal ? "progress" : "empty", meal_count: meal ? 1 : 0, calories: meal ? 300 : 0, weight_kg: weight?.kg ?? null }], completed_days: 0, logged_days: meal ? 1 : 0, weigh_ins: weight ? 1 : 0, weight_change_kg: null });
  throw new Error(`Unexpected ${method} ${path}`);
};

await initializeTracker();
await saveAvatar(new Blob(["jpeg"], { type: "image/jpeg" }));
await initializeTracker(true);
assert.equal(avatarUrl, "/api/v1/me/avatar?v=uploaded.jpg");
const plan = { name: "Kai", birthDate: "1996-01-15", age: 30, heightCm: 170, unitSystem: "metric", sex: "male", build: "muscular", bodyFatPercent: null, activityMinutes: 60, activityType: "strength", goal: "maintain", goalWeightKg: 70, targets, avatar: "" };
assert.deepEqual(await fetchTargetEstimate(plan, 70), targets);
await saveSetup(plan, 70, "estimated");
await saveWeight(today, 71);
assert.equal(weight.kg, 71);
const nutrients = Object.fromEntries(Object.keys(targets).map((key) => [key, key === "calories" ? 300 : 10]));
await saveMeal({ date: today, time: "12:30", name: "Lunch", items: [{ food_id: null, name: "Rice", grams: 100, nutrients }, { food_id: null, name: "Egg", grams: 50, nutrients }] }, undefined, crypto.randomUUID());
assert.equal(meal.items.length, 2);
assert.equal((await loadCalendar(today.slice(0, 7))).logged_days, 1);
await removeMeal("7");
assert.equal(meal, null);
assert.equal(csrfCalls, writes);
clearTrackerData();
console.log("Tracker API session, avatar, profile, weight, meal items, calendar, and CSRF passed");
