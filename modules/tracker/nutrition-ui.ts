import type { Nutrient } from "./nutrition";

export const nutrientLabels: Record<"en" | "id", Record<Nutrient, string>> = {
  en: { calories: "Calories", protein: "Protein", carbs: "Carbs", fat: "Fat", fiber: "Fiber", sodium: "Sodium", potassium: "Potassium", calcium: "Calcium", iron: "Iron" },
  id: { calories: "Kalori", protein: "Protein", carbs: "Karbohidrat", fat: "Lemak", fiber: "Serat", sodium: "Natrium", potassium: "Kalium", calcium: "Kalsium", iron: "Zat besi" },
};

export const nutrientUnits: Record<Nutrient, string> = {
  calories: "kcal", protein: "g", carbs: "g", fat: "g", fiber: "g",
  sodium: "mg", potassium: "mg", calcium: "mg", iron: "mg",
};
