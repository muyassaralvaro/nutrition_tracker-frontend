import assert from "node:assert/strict";

const { displayHeight, displayWeight, estimateTargets, feetAndInches, heightToCm, isCalorieWarning, leanMassWeightRange, nutritionStatus, referenceWeightRange, scalePortion, weightToKg } = await import("../modules/tracker/nutrition.ts");
const { ageFromBirthDate, analysisResetCountdown, calendarDisplayStatus, clearTrackerData, fetchTargetEstimate, initializeTracker, isValidDate, loadCalendar, loadWeightMonth, localDateKey, removeMeal, saveAvatar, saveMeal, saveSetup, saveWeight } = await import("../modules/tracker/tracker-data.ts");
const { formatWeightDate, shiftWeightMonth, weightMonthSeries } = await import("../modules/tracker/pages/profile/weight-history.ts");

assert.equal(isValidDate("2026-02-30"), false);
assert.equal(isValidDate("2026-02-28"), true);
assert.equal(analysisResetCountdown("2026-10-10T00:00:00+07:00", "en", Date.parse("2026-10-09T16:00:00Z")), "Resets in 1h 0m");
assert.equal(analysisResetCountdown("2026-10-10T00:00:00+07:00", "id", Date.parse("2026-10-09T16:59:30Z")), "Diperbarui dalam 1 menit");
assert.equal(analysisResetCountdown("2026-10-10T00:00:00+07:00", "en", Date.parse("2026-10-09T17:00:00Z")), "Updating allowance…");
assert.equal(ageFromBirthDate("2000-10-08", "2026-10-07"), 25);
assert.equal(ageFromBirthDate("2000-10-07", "2026-10-07"), 26);
assert.equal(formatWeightDate("2026-10-07", "en"), "07-Oct-2026");
assert.equal(formatWeightDate("2026-10-07", "id"), "07-Okt-2026");
assert.equal(shiftWeightMonth("2026-01", -1), "2025-12");
assert.equal(shiftWeightMonth("2026-12", 1), "2027-01");
const weightDays = weightMonthSeries("2026-10", [{ date: "2026-10-07", kg: 86 }, { date: "2026-10-08", kg: 86.6 }], null, "2026-10-09");
assert.equal(weightDays.length, 9);
assert.deepEqual(weightDays[0], { date: "2026-10-01", kg: null, recorded: false });
assert.deepEqual(weightDays[6], { date: "2026-10-07", kg: 86, recorded: true });
assert.deepEqual(weightDays[8], { date: "2026-10-09", kg: 86.6, recorded: false });
assert.equal(weightDays.at(-1).date, "2026-10-09");
const carriedDays = weightMonthSeries("2024-02", [], { kg: 70 }, "2026-10-09");
assert.equal(carriedDays.length, 29);
assert.deepEqual(carriedDays.at(-1), { date: "2024-02-29", kg: 70, recorded: false });
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
const rangeTargets = { ...targets, calories: 2000, protein: 80 };
const logged = (changes) => [{ nutrients: { ...rangeTargets, ...changes } }];
assert.equal(nutritionStatus(logged({ calories: 1799 }), rangeTargets), "progress");
assert.equal(nutritionStatus(logged({ calories: 1800 }), rangeTargets), "complete");
assert.equal(nutritionStatus(logged({ calories: 2100 }), rangeTargets), "complete");
assert.equal(nutritionStatus(logged({ calories: 2101 }), rangeTargets), "over");
assert.equal(nutritionStatus(logged({ protein: 84 }), rangeTargets), "complete");
assert.equal(nutritionStatus(logged({ protein: 85 }), rangeTargets), "over");
assert.equal(nutritionStatus(logged({ sodium: 2301 }), rangeTargets), "over");
assert.equal(nutritionStatus(logged({ fiber: null }), rangeTargets), "partial");
assert.equal(nutritionStatus(logged({ calories: 2101, fiber: null }), rangeTargets), "over");
assert.equal(isCalorieWarning(2000, 2000), false);
assert.equal(isCalorieWarning(2001, 2000), true);
assert.equal(isCalorieWarning(2100, 2000), true);
assert.equal(isCalorieWarning(2101, 2000), false);
assert.equal(calendarDisplayStatus("empty", "2026-10-08", "2026-10-09", true), "missed");
assert.equal(calendarDisplayStatus("empty", "2026-10-08", "2026-10-09", false), "empty");
assert.equal(calendarDisplayStatus("empty", "2026-10-09", "2026-10-09", true), "empty");
assert.equal(calendarDisplayStatus("empty", "2026-10-10", "2026-10-09", true), "empty");
assert.equal(calendarDisplayStatus("progress", "2026-10-08", "2026-10-09", true), "missed");
assert.equal(calendarDisplayStatus("no_target", "2026-10-08", "2026-10-09", false), "noTarget");

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
  if (path === "/api/v1/me" && method === "GET") return json({ id: 1, name: profile?.name ?? "Kai", email: null, avatar_url: avatarUrl });
  if (path === "/api/v1/me/avatar" && method === "PUT") { assert.ok(options.body instanceof FormData); assert.equal(options.body.get("image")?.type, "image/jpeg"); avatarUrl = "/api/v1/me/avatar?v=uploaded.jpg"; return json({ id: 1, name: "Kai", email: null, avatar_url: avatarUrl }); }
  if (path === "/api/v1/me/profile" && method === "GET") return json(profile);
  if (path === "/api/v1/me/weights" && method === "GET" && new URL(url).searchParams.get("from") === "2026-10-01") {
    const page = new URL(url).searchParams.get("page");
    return Response.json({ data: page === "2" ? [{ id: 1, entry_date: "2026-10-01", kg: 86 }] : Array.from({ length: 30 }, (_, index) => ({ id: 31 - index, entry_date: `2026-10-${String(31 - index).padStart(2, "0")}`, kg: 86 })), meta: { last_page: 2 } });
  }
  if (path === "/api/v1/me/weights" && method === "GET" && new URL(url).searchParams.get("to") === "2026-09-30") return json([{ id: 99, entry_date: "2026-09-30", kg: 85 }]);
  if (path === "/api/v1/me/weights" && method === "GET") return json(weight ? [weight] : []);
  if (path === `/api/v1/days/${today}`) return json({ date: today, target: profile ? { ...targets, source: targetSource } : null, weight, meals: meal ? [meal] : [], nutrition: { status: meal ? "progress" : "empty", totals: meal?.nutrition.totals ?? Object.fromEntries(Object.keys(targets).map((key) => [key, 0])), known: Object.fromEntries(Object.keys(targets).map((key) => [key, true])), remaining: targets } });
  if (path === "/api/v1/target-estimates" && method === "POST") { assert.equal(body.weight_kg, 70); return json({ targets }); }
  if (path === "/api/v1/me/setup" && method === "PUT") { assert.equal(body.target_source, "estimated"); assert.equal(body.targets.calories, 2510); targetSource = body.target_source; profile = { name: body.name, birth_date: body.birth_date, height_cm: body.height_cm, unit_system: body.unit_system, sex: body.sex, body_build: body.body_build, body_fat_percent: body.body_fat_percent, activity_minutes: body.activity_minutes, activity_type: body.activity_type, goal: body.goal, goal_weight_kg: body.goal_weight_kg }; weight = { id: 1, entry_date: today, kg: body.weight_kg }; return json(profile); }
  if (path === "/api/v1/me/weights/1" && method === "PUT") { weight.kg = body.kg; return json(weight); }
  if (path === "/api/v1/meals" && method === "POST") { assert.match(body.client_request_id, /^[0-9a-f-]{36}$/); assert.equal(body.items.length, 2); meal = { id: 7, meal_date: body.meal_date, meal_time: body.meal_time, title: body.title, items: body.items, nutrition: { totals: body.items[0].nutrients } }; return json(meal); }
  if (path === "/api/v1/meals/7" && method === "DELETE") { meal = null; return new Response(null, { status: 204 }); }
  if (path === "/api/v1/calendar" && method === "GET") return json({ month: today.slice(0, 7), days: [{ date: today, status: meal ? "progress" : "empty", has_target: Boolean(profile), meal_count: meal ? 1 : 0, calories: meal ? 300 : 0, calorie_warning: false, weight_kg: weight?.kg ?? null }], completed_days: 0, logged_days: meal ? 1 : 0, weigh_ins: weight ? 1 : 0, weight_change_kg: null });
  throw new Error(`Unexpected ${method} ${path}`);
};

await initializeTracker();
const monthWeights = await loadWeightMonth("2026-10");
assert.equal(monthWeights.entries.length, 31);
assert.equal(monthWeights.entries[0].date, "2026-10-01");
assert.equal(monthWeights.entries.at(-1).date, "2026-10-31");
assert.equal(monthWeights.previous.date, "2026-09-30");
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
