"use client";

import { useSyncExternalStore } from "react";
import { api, API_ORIGIN, ApiError } from "../../shared/api-client.ts";
import { type ActivityType, type BodyBuild, type FormulaSex, type Goal, type LoggedAmounts, type Nutrient, type NutrientAmounts, type UnitSystem } from "./nutrition.ts";

export interface Profile {
  name: string; birthDate: string; age: number | null; heightCm: number | null; unitSystem: UnitSystem;
  sex: FormulaSex; build: BodyBuild; bodyFatPercent: number | null; activityMinutes: number | null;
  activityType: ActivityType; goal: Goal; goalWeightKg: number | null; targets: NutrientAmounts | null; targetSource: "estimated" | "edited" | null; avatar: string;
}
export interface WeightEntry { id: number; date: string; kg: number }
export interface MealItem { food_id: number | null; name: string; description?: string | null; grams: number | null; nutrients: LoggedAmounts }
export interface MealEntry { id: string; date: string; time: string; name: string; thumbnailUrl: string | null; nutrients: LoggedAmounts; items: MealItem[] }
export interface NutritionSummary { totals: LoggedAmounts; known: Record<Nutrient, boolean>; remaining: LoggedAmounts; status: "empty" | "no_target" | "partial" | "progress" | "complete" | "over" }
export interface DaySummary { date: string; target: NutrientAmounts | null; nutrition: NutritionSummary; weight: WeightEntry | null; meals: MealEntry[] }
export interface CalendarSummary { month: string; days: { date: string; status: NutritionSummary["status"]; has_target: boolean; meal_count: number; calories: number | null; calorie_warning: boolean; weight_kg: number | null }[]; completed_days: number; logged_days: number; weigh_ins: number; weight_change_kg: number | null }
export interface ApiUser { id: number; name: string; email: string | null; avatar_url: string | null }
export interface AnalysisQuota { date: string; unlimited: boolean; daily_limit: number | null; daily_used: number; daily_remaining: number | null; resets_at: string | null; regeneration_limit: number | null; regenerations_used: number | null; regenerations_remaining: number | null }
export interface TrackerData { profile: Profile; weights: WeightEntry[]; meals: MealEntry[]; days: Record<string, DaySummary>; user: ApiUser | null; status: "idle" | "loading" | "ready" | "error" | "unauthorized" }

const emptyProfile: Profile = { name: "", birthDate: "", age: null, heightCm: null, unitSystem: "metric", sex: "", build: "", bodyFatPercent: null, activityMinutes: null, activityType: "", goal: "", goalWeightKg: null, targets: null, targetSource: null, avatar: "" };
const empty: TrackerData = { profile: emptyProfile, weights: [], meals: [], days: {}, user: null, status: "idle" };
let snapshot: TrackerData = empty;
let loading: Promise<void> | null = null;
let generation = 0;
const listeners = new Set<() => void>();
const subscribeToday = () => () => {};

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function analysisResetCountdown(resetsAt: string | null, language: "en" | "id", nowMs = Date.now()): string {
  if (!resetsAt) return "";
  const resetMs = Date.parse(resetsAt);
  if (!Number.isFinite(resetMs)) return "";
  const minutes = Math.max(0, Math.ceil((resetMs - nowMs) / 60_000));
  if (minutes === 0) return language === "id" ? "Memperbarui jatah…" : "Updating allowance…";
  const hours = Math.floor(minutes / 60);
  if (hours === 0) return language === "id" ? `Diperbarui dalam ${minutes} menit` : `Resets in ${minutes}m`;
  return language === "id" ? `Diperbarui dalam ${hours} jam ${minutes % 60} menit` : `Resets in ${hours}h ${minutes % 60}m`;
}
export function ageFromBirthDate(value: string, today = localDateKey()): number | null {
  if (!isValidDate(value) || !isValidDate(today) || value > today) return null;
  const age = Number(today.slice(0, 4)) - Number(value.slice(0, 4)) - (today.slice(5) < value.slice(5) ? 1 : 0);
  return age >= 0 && age <= 120 ? age : null;
}
export function useTodayKey() { return useSyncExternalStore(subscribeToday, () => localDateKey(), () => ""); }
export function calendarDisplayStatus(raw: NutritionSummary["status"], date: string, today: string, hasTarget: boolean): "empty" | "noTarget" | "progress" | "missed" | "complete" | "over" {
  if (raw === "no_target") return "noTarget";
  if (date < today && (raw === "progress" || raw === "partial" || (raw === "empty" && hasTarget))) return "missed";
  return raw === "partial" ? "progress" : raw;
}
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function publish(next: TrackerData) { snapshot = next; listeners.forEach((listener) => listener()); }
export function useTrackerData() { return useSyncExternalStore(subscribe, () => snapshot, () => empty); }
export function clearTrackerData() { generation += 1; loading = null; publish(empty); }
export async function loadAnalysisQuota(analysisId?: string): Promise<AnalysisQuota> {
  const path = `/api/v1/me/analysis-quota${analysisId ? `?analysis_id=${encodeURIComponent(analysisId)}` : ""}`;
  return (await api<{ data: AnalysisQuota }>(path)).data;
}
export async function saveAvatar(image: Blob): Promise<void> {
  const requestGeneration = generation;
  const body = new FormData();
  body.append("image", image, "avatar.jpg");
  const { data: user } = await api<{ data: ApiUser }>("/api/v1/me/avatar", { method: "PUT", body });
  if (requestGeneration === generation) publish({ ...snapshot, user, profile: { ...snapshot.profile, avatar: user.avatar_url ? `${API_ORIGIN}${user.avatar_url}` : "" } });
}

interface ApiProfile { name: string; birth_date: string; height_cm: number; unit_system: UnitSystem; sex: FormulaSex; body_build: BodyBuild; body_fat_percent: number | null; activity_minutes: number; activity_type: ActivityType; goal: Goal; goal_weight_kg: number | null }
interface ApiWeight { id: number; entry_date: string; kg: number }
interface ApiMeal { id: number; meal_date: string; meal_time: string; title: string; thumbnail_url: string | null; items: MealItem[]; nutrition: NutritionSummary }
interface ApiDay { date: string; target: (NutrientAmounts & { source?: "estimated" | "edited" }) | null; nutrition: NutritionSummary; weight: ApiWeight | null; meals: ApiMeal[] }

function mealFromApi(meal: ApiMeal): MealEntry {
  return { id: String(meal.id), date: meal.meal_date, time: meal.meal_time, name: meal.title, thumbnailUrl: meal.thumbnail_url, nutrients: meal.nutrition.totals, items: meal.items };
}
function dayFromApi(day: ApiDay): DaySummary {
  return { ...day, weight: day.weight ? { id: day.weight.id, date: day.weight.entry_date, kg: day.weight.kg } : null, meals: day.meals.map(mealFromApi) };
}
function profileFromApi(user: ApiUser, profile: ApiProfile | null, target: ApiDay["target"]): Profile {
  const avatar = user.avatar_url ? `${API_ORIGIN}${user.avatar_url}` : "";
  return profile ? {
    name: profile.name, birthDate: profile.birth_date, age: ageFromBirthDate(profile.birth_date), heightCm: profile.height_cm,
    unitSystem: profile.unit_system, sex: profile.sex, build: profile.body_build, bodyFatPercent: profile.body_fat_percent,
    activityMinutes: profile.activity_minutes, activityType: profile.activity_type, goal: profile.goal,
    goalWeightKg: profile.goal_weight_kg, targets: target, targetSource: target?.source ?? null, avatar,
  } : { ...emptyProfile, name: user.name, avatar };
}

export async function initializeTracker(force = false): Promise<void> {
  if (!force && snapshot.status === "ready") return;
  if (loading) return loading;
  publish({ ...snapshot, status: "loading" });
  const requestGeneration = generation;
  loading = (async () => {
    try {
      const { data: user } = await api<{ data: ApiUser }>("/api/v1/me");
      const today = localDateKey();
      const [{ data: profile }, { data: weightPage }, { data: day }] = await Promise.all([
        api<{ data: ApiProfile | null }>("/api/v1/me/profile"),
        api<{ data: ApiWeight[] }>("/api/v1/me/weights?from=1900-01-01"),
        api<{ data: ApiDay }>(`/api/v1/days/${today}`),
      ]);
      const parsedDay = dayFromApi(day);
      if (requestGeneration === generation) publish({ user, profile: profileFromApi(user, profile, day.target), weights: weightPage.map((weight) => ({ id: weight.id, date: weight.entry_date, kg: weight.kg })).sort((a, b) => a.date.localeCompare(b.date)), meals: parsedDay.meals, days: { [today]: parsedDay }, status: "ready" });
    } catch (error) {
      if (requestGeneration === generation) publish({ ...empty, status: error instanceof ApiError && error.status === 401 ? "unauthorized" : "error" });
      throw error;
    } finally { if (requestGeneration === generation) loading = null; }
  })();
  return loading;
}

export async function refreshDay(date: string): Promise<DaySummary> {
  const requestGeneration = generation;
  const { data } = await api<{ data: ApiDay }>(`/api/v1/days/${date}`);
  const day = dayFromApi(data);
  if (requestGeneration === generation) publish({ ...snapshot, meals: [...snapshot.meals.filter((meal) => meal.date !== date), ...day.meals], days: { ...snapshot.days, [date]: day }, profile: date === localDateKey() ? { ...snapshot.profile, targets: day.target, targetSource: data.target?.source ?? null } : snapshot.profile });
  return day;
}
export async function refreshWeights(): Promise<void> {
  const requestGeneration = generation;
  const { data } = await api<{ data: ApiWeight[] }>("/api/v1/me/weights?from=1900-01-01");
  if (requestGeneration === generation) publish({ ...snapshot, weights: data.map((weight) => ({ id: weight.id, date: weight.entry_date, kg: weight.kg })).sort((a, b) => a.date.localeCompare(b.date)) });
}
export async function loadWeightMonth(month: string): Promise<{ entries: WeightEntry[]; previous: WeightEntry | null }> {
  const [year, monthNumber] = month.split("-").map(Number);
  const first = `${month}-01`;
  const last = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
  const before = new Date(Date.UTC(year, monthNumber - 1, 0)).toISOString().slice(0, 10);
  const [page, prior] = await Promise.all([
    api<{ data: ApiWeight[]; meta: { last_page: number } }>(`/api/v1/me/weights?from=${first}&to=${last}`),
    api<{ data: ApiWeight[] }>(`/api/v1/me/weights?to=${before}`),
  ]);
  // ponytail: One check-in per day means two 30-entry pages cover any month; paginate further if that rule changes.
  const next = page.meta.last_page > 1 ? await api<{ data: ApiWeight[] }>(`/api/v1/me/weights?from=${first}&to=${last}&page=2`) : null;
  const entries = [...page.data, ...(next?.data ?? [])].map((weight) => ({ id: weight.id, date: weight.entry_date, kg: weight.kg })).sort((a, b) => a.date.localeCompare(b.date));
  const previous = prior.data[0];
  return { entries, previous: previous ? { id: previous.id, date: previous.entry_date, kg: previous.kg } : null };
}
export async function loadCalendar(month: string): Promise<CalendarSummary> {
  const { data } = await api<{ data: CalendarSummary }>(`/api/v1/calendar?month=${encodeURIComponent(month)}`);
  return data;
}
export async function loadMeal(id: string): Promise<MealEntry> {
  const cached = snapshot.meals.find((meal) => meal.id === id);
  if (cached) return cached;
  const requestGeneration = generation;
  const { data } = await api<{ data: ApiMeal }>(`/api/v1/meals/${encodeURIComponent(id)}`);
  const meal = mealFromApi(data);
  if (requestGeneration === generation) publish({ ...snapshot, meals: [...snapshot.meals, meal] });
  return meal;
}
export function isProfileComplete(data: TrackerData) {
  const { profile, weights } = data;
  return Boolean(profile.name && profile.age && profile.age >= 18 && profile.heightCm && profile.sex && profile.build && profile.goal && profile.activityType && profile.activityMinutes !== null && profile.targets && weights.length);
}

export async function saveSetup(profile: Profile, weightKg: number, source: "estimated" | "edited"): Promise<void> {
  await api("/api/v1/me/setup", { method: "PUT", body: JSON.stringify({
    name: profile.name.trim(), birth_date: profile.birthDate, height_cm: profile.heightCm, sex: profile.sex,
    body_build: profile.build, body_fat_percent: profile.bodyFatPercent, goal: profile.goal,
    goal_weight_kg: profile.goalWeightKg, activity_minutes: profile.activityMinutes, activity_type: profile.activityType,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", unit_system: profile.unitSystem,
    weight_kg: weightKg, target_source: source, targets: profile.targets,
  }) });
  await initializeTracker(true);
}
export async function fetchTargetEstimate(profile: Profile, weightKg: number): Promise<NutrientAmounts> {
  const { data } = await api<{ data: { targets: NutrientAmounts } }>("/api/v1/target-estimates", { method: "POST", body: JSON.stringify({
    birth_date: profile.birthDate, height_cm: profile.heightCm, sex: profile.sex, body_build: profile.build,
    body_fat_percent: profile.bodyFatPercent, goal: profile.goal, goal_weight_kg: profile.goalWeightKg,
    activity_minutes: profile.activityMinutes, activity_type: profile.activityType,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", weight_kg: weightKg,
  }) });
  return data.targets;
}
export async function saveWeight(date: string, kg: number): Promise<void> {
  if (!isValidDate(date) || date > localDateKey() || !Number.isFinite(kg) || kg < 20 || kg > 500) throw new ApiError(422, "Check date and weight.");
  let existing = snapshot.weights.find((weight) => weight.date === date) ?? snapshot.days[date]?.weight;
  if (!existing) {
    const { data } = await api<{ data: ApiWeight[] }>(`/api/v1/me/weights?from=${date}&to=${date}`);
    const found = data[0];
    if (found) existing = { id: found.id, date: found.entry_date, kg: found.kg };
  }
  await api(existing ? `/api/v1/me/weights/${existing.id}` : "/api/v1/me/weights", { method: existing ? "PUT" : "POST", body: JSON.stringify({ entry_date: date, kg }) });
  await Promise.all([refreshWeights(), refreshDay(date)]);
}
export async function saveMeal(input: { date: string; time: string; name: string; items: MealItem[]; analysisId?: string | null }, id?: string, requestId = crypto.randomUUID()): Promise<void> {
  const oldDate = id ? snapshot.meals.find((meal) => meal.id === id)?.date : null;
  const body = { meal_date: input.date, meal_time: input.time, title: input.name.trim(), items: input.items, ...(!id ? { client_request_id: requestId, analysis_id: input.analysisId ?? null } : {}) };
  await api(id ? `/api/v1/meals/${encodeURIComponent(id)}` : "/api/v1/meals", { method: id ? "PUT" : "POST", body: JSON.stringify(body) });
  await refreshDay(input.date);
  if (oldDate && oldDate !== input.date) await refreshDay(oldDate);
}
export async function removeMeal(id: string): Promise<void> {
  const date = snapshot.meals.find((meal) => meal.id === id)?.date ?? localDateKey();
  await api(`/api/v1/meals/${encodeURIComponent(id)}`, { method: "DELETE" });
  await refreshDay(date);
}
