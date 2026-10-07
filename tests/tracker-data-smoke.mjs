import assert from "node:assert/strict";

const values = new Map();
globalThis.window = {};
globalThis.sessionStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
};

const { displayHeight, displayWeight, estimateTargets, feetAndInches, heightToCm, leanMassWeightRange, nutritionStatus, referenceWeightRange, sumNutrition, weightToKg } = await import("../modules/tracker/nutrition.ts");
const { ageFromBirthDate, isValidDate, localDateKey, saveSetup, saveWeight, saveMeal, removeMeal, clearTrackerData } = await import("../modules/tracker/tracker-data.ts");
assert.equal(isValidDate("2026-02-30"), false);
assert.equal(isValidDate("2026-02-28"), true);
assert.equal(ageFromBirthDate("2000-10-08", "2026-10-07"), 25);
assert.equal(ageFromBirthDate("2000-10-07", "2026-10-07"), 26);
assert.equal(ageFromBirthDate("2999-01-01", "2026-10-07"), null);
assert.equal(displayWeight(70, "imperial"), 154.3);
assert.ok(Math.abs(weightToKg(displayWeight(70, "imperial"), "imperial") - 70) < 0.05);
assert.ok(Math.abs(heightToCm(displayHeight(170, "imperial"), "imperial") - 170) < 0.2);
assert.deepEqual(feetAndInches(heightToCm(5 * 12 + 11, "imperial")), [5, 11]);
assert.deepEqual(referenceWeightRange(170), [53.5, 72]);
assert.deepEqual(leanMassWeightRange(70, 20, "male"), [62.2, 73.7]);
assert.equal(leanMassWeightRange(70, 20, ""), null);
const targets = estimateTargets({ age: 30, heightCm: 170, weightKg: 70, sex: "male", goal: "maintain", build: "muscular", activityMinutes: 60, activityType: "strength" });
assert.equal(targets.calories, 2510);
assert.equal(targets.protein, 119);
assert.equal(targets.carbs, 333);
assert.equal(targets.sodium, 2300);
assert.ok(targets.protein > estimateTargets({ age: 30, heightCm: 170, weightKg: 70, sex: "male", goal: "maintain", build: "lean", activityMinutes: 60, activityType: "strength" }).protein);
assert.equal(estimateTargets({ age: 17, heightCm: 170, weightKg: 70, sex: "male", goal: "maintain", build: "lean", activityMinutes: 30, activityType: "daily" }), null);
assert.equal(saveWeight("2999-01-01", 70), false);
assert.equal(saveWeight(localDateKey(), 70.5), true);
assert.equal(saveWeight(localDateKey(), 71), true);
assert.equal(saveSetup({ name: "Kai", birthDate: "1996-01-15", age: 30, heightCm: 170, unitSystem: "imperial", sex: "male", build: "muscular", bodyFatPercent: null, activityMinutes: 60, activityType: "strength", goal: "maintain", goalWeightKg: 70, targets, avatar: "" }, 71), true);
assert.equal(saveMeal({ date: "2999-01-01", time: "12:30", name: "Future meal", nutrients: { ...targets } }), false);
assert.equal(saveMeal({ date: localDateKey(), time: "25:30", name: "Bad time", nutrients: { ...targets } }), false);
assert.equal(saveMeal({ date: localDateKey(), time: "12:30", name: "Lunch", nutrients: { ...targets } }), true);
const stored = JSON.parse(values.get("nourish_tracker_preview"));
assert.equal(stored.weights.length, 1);
assert.equal(stored.weights[0].kg, 71);
assert.equal(stored.profile.name, "Kai");
assert.equal(stored.profile.unitSystem, "imperial");
assert.equal(stored.meals.length, 1);
assert.equal(stored.meals[0].time, "12:30");
assert.equal(nutritionStatus(stored.meals, targets), "complete");
assert.equal(sumNutrition(stored.meals).totals.calories, 2510);
assert.equal(nutritionStatus([{ nutrients: { ...targets, iron: null } }], targets), "partial");
assert.equal(saveMeal({ date: localDateKey(), time: "13:15", name: "Edited lunch", nutrients: { ...targets } }, stored.meals[0].id), true);
assert.equal(JSON.parse(values.get("nourish_tracker_preview")).meals[0].name, "Edited lunch");
assert.equal(JSON.parse(values.get("nourish_tracker_preview")).meals.length, 1);
removeMeal(stored.meals[0].id);
assert.equal(JSON.parse(values.get("nourish_tracker_preview")).meals.length, 0);
clearTrackerData();
assert.equal(values.has("nourish_tracker_preview"), false);
console.log("Tracker targets, meals, completion, and storage passed");
