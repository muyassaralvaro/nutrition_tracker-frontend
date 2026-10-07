"use client";

import { useSyncExternalStore } from "react";
import { NUTRIENTS, NUTRIENT_LIMITS, type ActivityType, type BodyBuild, type FormulaSex, type Goal, type LoggedAmounts, type Nutrient, type NutrientAmounts, type UnitSystem } from "./nutrition.ts";

export interface Profile {
  name: string;
  birthDate: string;
  age: number | null;
  heightCm: number | null;
  unitSystem: UnitSystem;
  sex: FormulaSex;
  build: BodyBuild;
  bodyFatPercent: number | null;
  activityMinutes: number | null;
  activityType: ActivityType;
  goal: Goal;
  goalWeightKg: number | null;
  targets: NutrientAmounts | null;
  avatar: string;
}

export interface WeightEntry {
  date: string;
  kg: number;
}

export interface MealEntry { id: string; date: string; time: string; name: string; nutrients: LoggedAmounts }

export interface TrackerData {
  profile: Profile;
  weights: WeightEntry[];
  meals: MealEntry[];
}

const STORAGE_KEY = "nourish_tracker_preview";
const empty: TrackerData = {
  profile: { name: "", birthDate: "", age: null, heightCm: null, unitSystem: "metric", sex: "", build: "", bodyFatPercent: null, activityMinutes: null, activityType: "", goal: "", goalWeightKg: null, targets: null, avatar: "" },
  weights: [], meals: [],
};
let snapshot: TrackerData = empty;
let loaded = false;
const listeners = new Set<() => void>();

function numberInRange(value: unknown, min: number, max: number): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max ? value : null;
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ageFromBirthDate(value: string, today = localDateKey()): number | null {
  if (!isValidDate(value) || !isValidDate(today) || value > today) return null;
  const age = Number(today.slice(0, 4)) - Number(value.slice(0, 4)) - (today.slice(5) < value.slice(5) ? 1 : 0);
  return age >= 0 && age <= 120 ? age : null;
}

function isValidTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

const legacyMealTimes: Record<string, string> = { breakfast: "08:00", lunch: "12:00", dinner: "19:00", snack: "15:00" };

const subscribeToday = () => () => {};
export function useTodayKey() { return useSyncExternalStore(subscribeToday, () => localDateKey(), () => ""); }

function parseTargets(value: unknown): NutrientAmounts | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<Nutrient, unknown>;
  const result = {} as NutrientAmounts;
  for (const key of NUTRIENTS) {
    const amount = numberInRange(raw[key], key === "calories" ? 800 : 1, NUTRIENT_LIMITS[key]);
    if (amount === null) return null;
    result[key] = amount;
  }
  return result;
}

function parseLogged(value: unknown): LoggedAmounts | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<Nutrient, unknown>;
  const result = {} as LoggedAmounts;
  for (const key of NUTRIENTS) {
    const amount = raw[key];
    if (amount === null && key !== "calories" && key !== "protein" && key !== "carbs" && key !== "fat") { result[key] = null; continue; }
    const parsed = numberInRange(amount, 0, NUTRIENT_LIMITS[key]);
    if (parsed === null) return null;
    result[key] = parsed;
  }
  return result;
}

function parseData(value: unknown): TrackerData {
  if (!value || typeof value !== "object") return empty;
  const raw = value as { profile?: Record<string, unknown>; weights?: unknown; meals?: unknown };
  const profile = raw.profile && typeof raw.profile === "object" ? raw.profile : {};
  const goal = profile.goal;
  const weights = Array.isArray(raw.weights) ? raw.weights : [];
  const meals = Array.isArray(raw.meals) ? raw.meals : [];
  return {
    profile: {
      name: typeof profile.name === "string" ? profile.name.trim().slice(0, 80) : "",
      birthDate: typeof profile.birthDate === "string" && ageFromBirthDate(profile.birthDate) !== null ? profile.birthDate : "",
      age: typeof profile.birthDate === "string" && ageFromBirthDate(profile.birthDate) !== null ? ageFromBirthDate(profile.birthDate) : numberInRange(profile.age, 1, 120),
      heightCm: numberInRange(profile.heightCm, 80, 250),
      unitSystem: profile.unitSystem === "imperial" ? "imperial" : "metric",
      sex: profile.sex === "female" || profile.sex === "male" ? profile.sex : "",
      build: profile.build === "lean" || profile.build === "soft" || profile.build === "stocky" || profile.build === "muscular" ? profile.build : "",
      bodyFatPercent: numberInRange(profile.bodyFatPercent, 3, 70),
      activityMinutes: numberInRange(profile.activityMinutes, 0, 240),
      activityType: profile.activityType === "daily" || profile.activityType === "cardio" || profile.activityType === "strength" || profile.activityType === "mixed" ? profile.activityType : "",
      goal: goal === "lose" || goal === "maintain" || goal === "gain" ? goal : "",
      goalWeightKg: numberInRange(profile.goalWeightKg, 20, 500),
      targets: parseTargets(profile.targets),
      avatar: typeof profile.avatar === "string" && profile.avatar.length < 140000 && /^data:image\/(jpeg|png|webp);base64,/.test(profile.avatar) ? profile.avatar : "",
    },
    weights: weights
      .filter((entry): entry is WeightEntry => Boolean(entry && typeof entry === "object" && typeof entry.date === "string" && isValidDate(entry.date) && numberInRange(entry.kg, 20, 500) !== null))
      .slice(-365)
      .sort((a, b) => a.date.localeCompare(b.date)),
    meals: meals.filter((entry): entry is MealEntry & { type?: string } => Boolean(entry && typeof entry === "object" && typeof entry.id === "string" && entry.id.length < 100 && typeof entry.date === "string" && isValidDate(entry.date) && typeof entry.name === "string" && entry.name.trim().length > 0 && entry.name.length <= 80 && (isValidTime(entry.time) || typeof entry.type === "string" && Object.hasOwn(legacyMealTimes, entry.type)) && parseLogged(entry.nutrients))).slice(-500).map((entry) => ({ id: entry.id, date: entry.date, time: isValidTime(entry.time) ? entry.time : legacyMealTimes[entry.type!], name: entry.name.trim(), nutrients: parseLogged(entry.nutrients)! })).sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)),
  };
}

function getSnapshot(): TrackerData {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) snapshot = parseData(JSON.parse(saved));
    } catch {
      // ponytail: Storage can be blocked; keep preview data in memory until tab closes.
    }
  }
  return snapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function publish(next: TrackerData) {
  snapshot = next;
  loaded = true;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Current tab still works when storage is unavailable.
  }
  listeners.forEach((listener) => listener());
}

export function useTrackerData() {
  return useSyncExternalStore(subscribe, getSnapshot, () => empty);
}

export function isProfileComplete(data: TrackerData) {
  const { profile, weights } = data;
  return Boolean(profile.name && profile.age && profile.age >= 18 && profile.heightCm && profile.sex && profile.build && profile.goal && profile.activityType && profile.activityMinutes !== null && profile.targets && weights.length);
}

export function saveSetup(profile: Profile, weightKg: number): boolean {
  const next = parseData({ profile }).profile;
  if (!next.name || !next.birthDate || next.age === null || next.age < 18 || next.heightCm === null || !next.sex || !next.build || !next.goal || !next.activityType || next.activityMinutes === null || !next.targets || numberInRange(weightKg, 20, 500) === null) return false;
  const current = getSnapshot();
  const date = localDateKey();
  const weights = current.weights.at(-1)?.kg === weightKg ? current.weights : [...current.weights.filter((entry) => entry.date !== date), { date, kg: weightKg }].sort((a, b) => a.date.localeCompare(b.date));
  publish({ ...current, profile: next, weights });
  return true;
}

export function saveAvatar(avatar: string) {
  const current = getSnapshot();
  publish({ ...current, profile: parseData({ profile: { ...current.profile, avatar } }).profile });
}

export function saveWeight(date: string, kg: number): boolean {
  if (!isValidDate(date) || date > localDateKey() || numberInRange(kg, 20, 500) === null) return false;
  const current = getSnapshot();
  const weights = [...current.weights.filter((entry) => entry.date !== date), { date, kg }]
    .sort((a, b) => a.date.localeCompare(b.date));
  publish({ ...current, weights });
  return true;
}

export function saveMeal(input: Omit<MealEntry, "id">, id?: string): boolean {
  if (!isValidDate(input.date) || input.date > localDateKey() || !isValidTime(input.time) || !input.name.trim() || input.name.length > 80) return false;
  const nutrients = parseLogged(input.nutrients);
  if (!nutrients) return false;
  const current = getSnapshot();
  if (id && !current.meals.some((meal) => meal.id === id)) return false;
  const mealId = id ?? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
  const updated = { ...input, id: mealId, name: input.name.trim(), nutrients };
  const meals = id ? current.meals.map((meal) => meal.id === id ? updated : meal) : [...current.meals, updated].slice(-500);
  publish({ ...current, meals: meals.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)) });
  return true;
}

export function removeMeal(id: string) {
  const current = getSnapshot();
  publish({ ...current, meals: current.meals.filter((meal) => meal.id !== id) });
}

export function clearTrackerData() {
  snapshot = empty;
  loaded = true;
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* Memory state still clears. */ }
  listeners.forEach((listener) => listener());
}
