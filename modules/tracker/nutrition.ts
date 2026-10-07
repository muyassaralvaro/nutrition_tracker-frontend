export const NUTRIENTS = ["calories", "protein", "carbs", "fat", "fiber", "sodium", "potassium", "calcium", "iron"] as const;
export type Nutrient = (typeof NUTRIENTS)[number];
export const MACRO_NUTRIENTS: readonly Nutrient[] = ["calories", "protein", "carbs", "fat"];
export const NUTRIENT_LIMITS: Record<Nutrient, number> = { calories: 6000, protein: 1000, carbs: 1500, fat: 800, fiber: 200, sodium: 20000, potassium: 20000, calcium: 10000, iron: 500 };
export type NutrientAmounts = Record<Nutrient, number>;
export type LoggedAmounts = Record<Nutrient, number | null>;

export function scalePortion(nutrients: Record<Nutrient, string>, fromGrams: number, toGrams: number): Record<Nutrient, string> {
  if (!Number.isFinite(fromGrams) || fromGrams <= 0 || !Number.isFinite(toGrams) || toGrams <= 0) return nutrients;
  return Object.fromEntries(NUTRIENTS.map((key) => {
    const value = Number(nutrients[key]);
    return [key, nutrients[key] === "" || !Number.isFinite(value) ? nutrients[key] : String(Math.round(value * toGrams / fromGrams * 100) / 100)];
  })) as Record<Nutrient, string>;
}
export type Goal = "" | "lose" | "maintain" | "gain";
export type BodyBuild = "" | "lean" | "soft" | "stocky" | "muscular";
export type ActivityType = "" | "daily" | "cardio" | "strength" | "mixed";
export type FormulaSex = "" | "female" | "male";
export type UnitSystem = "metric" | "imperial";

export function displayWeight(kg: number, unitSystem: UnitSystem) { return Math.round((unitSystem === "imperial" ? kg / 0.45359237 : kg) * 10) / 10; }
export function weightToKg(value: number, unitSystem: UnitSystem) { return unitSystem === "imperial" ? value * 0.45359237 : value; }
export function displayHeight(cm: number, unitSystem: UnitSystem) { return Math.round((unitSystem === "imperial" ? cm / 2.54 : cm) * 10) / 10; }
export function heightToCm(value: number, unitSystem: UnitSystem) { return unitSystem === "imperial" ? value * 2.54 : value; }
export function feetAndInches(cm: number): [number, number] { const inches = Math.round(cm / 2.54); return [Math.floor(inches / 12), inches % 12]; }

export interface PlanInputs {
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  sex: FormulaSex;
  goal: Goal;
  build: BodyBuild;
  activityMinutes: number | null;
  activityType: ActivityType;
}

export const ZERO_NUTRIENTS: NutrientAmounts = {
  calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
  sodium: 0, potassium: 0, calcium: 0, iron: 0,
};

export function referenceWeightRange(heightCm: number): [number, number] {
  const metresSquared = (heightCm / 100) ** 2;
  return [Math.round(18.5 * metresSquared * 10) / 10, Math.round(24.9 * metresSquared * 10) / 10];
}

export function leanMassWeightRange(weightKg: number, bodyFatPercent: number, sex: FormulaSex): [number, number] | null {
  if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 500 || !Number.isFinite(bodyFatPercent) || bodyFatPercent < 3 || bodyFatPercent > 70 || (sex !== "male" && sex !== "female")) return null;
  // ponytail: Broad adult body-fat bands assume stable lean mass; replace with age-aware, clinician-reviewed guidance later.
  const [lowerFat, upperFat] = sex === "male" ? [0.1, 0.24] : [0.2, 0.34];
  const leanMass = weightKg * (1 - bodyFatPercent / 100);
  return [Math.round(leanMass / (1 - lowerFat) * 10) / 10, Math.round(leanMass / (1 - upperFat) * 10) / 10];
}

export function estimateTargets(input: PlanInputs): NutrientAmounts | null {
  const { age, heightCm, weightKg, sex, goal, build, activityMinutes, activityType } = input;
  if (age === null || age < 18 || age > 120 || heightCm === null || heightCm < 80 || heightCm > 250 || weightKg === null || weightKg < 20 || weightKg > 500 || !sex || !goal || !build || activityMinutes === null || activityMinutes < 0 || activityMinutes > 240 || !activityType) return null;

  // ponytail: Activity bands are editable estimates; revise with validated nutrition guidance when needed.
  const intensity = { daily: 0.5, cardio: 1.2, strength: 1, mixed: 1 }[activityType];
  const activeMinutes = activityMinutes * intensity;
  const multiplier = activeMinutes < 20 ? 1.2 : activeMinutes < 45 ? 1.375 : activeMinutes < 90 ? 1.55 : 1.725;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : -161);
  const calories = Math.round(Math.max(1200, Math.min(4500, bmr * multiplier + (goal === "lose" ? -250 : goal === "gain" ? 250 : 0))) / 10) * 10;
  const trainingProtein = activityMinutes === 0 ? 0 : activityType === "strength" || activityType === "mixed" ? 0.3 : activityType === "cardio" ? 0.1 : 0;
  const proteinFactor = Math.min(2, 1.2 + trainingProtein + (build === "muscular" ? 0.2 : 0) + (goal === "lose" ? 0.2 : 0));
  const protein = Math.round(Math.min(weightKg * proteinFactor, calories * 0.35 / 4));
  const fat = Math.round(calories * 0.28 / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  const over50 = age > 50;

  return {
    calories, protein, carbs, fat,
    fiber: sex === "male" ? (over50 ? 30 : 38) : (over50 ? 21 : 25),
    sodium: 2300,
    potassium: sex === "male" ? 3400 : 2600,
    calcium: age > (sex === "female" ? 50 : 70) ? 1200 : 1000,
    iron: sex === "female" && !over50 ? 18 : 8,
  };
}

export interface NutrientLog { nutrients: LoggedAmounts }

export function sumNutrition(meals: NutrientLog[]) {
  const totals = { ...ZERO_NUTRIENTS };
  const known = Object.fromEntries(NUTRIENTS.map((key) => [key, true])) as Record<Nutrient, boolean>;
  for (const meal of meals) {
    for (const key of NUTRIENTS) {
      const amount = meal.nutrients[key];
      if (amount === null) known[key] = false;
      else totals[key] += amount;
    }
  }
  return { totals, known };
}

export function nutritionStatus(meals: NutrientLog[], targets: NutrientAmounts | null): "empty" | "noTarget" | "partial" | "progress" | "complete" {
  if (!meals.length) return "empty";
  if (!targets) return "noTarget";
  const { totals, known } = sumNutrition(meals);
  if (NUTRIENTS.some((key) => !known[key])) return "partial";
  const complete = NUTRIENTS.every((key) => key === "sodium"
    ? totals[key] <= targets[key]
    : key === "calories"
      ? totals[key] >= targets[key] * 0.9 && totals[key] <= targets[key] * 1.1
      : totals[key] >= targets[key] * 0.9);
  return complete ? "complete" : "progress";
}
