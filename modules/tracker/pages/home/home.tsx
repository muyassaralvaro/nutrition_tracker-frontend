"use client";

import Link from "next/link";
import { useLanguage } from "@/shared/language";
import { WeightCheckIn } from "../../components/WeightCheckIn";
import { displayWeight, NUTRIENTS, nutritionStatus, sumNutrition, type Nutrient } from "../../nutrition";
import { nutrientLabels, nutrientUnits } from "../../nutrition-ui";
import { isProfileComplete, removeMeal, useTodayKey, useTrackerData } from "../../tracker-data";

const copy = {
  en: {
    eyebrow: "TODAY AT A GLANCE", hello: (name: string) => `Hi, ${name}.`, helloNew: "Start your day well.", intro: "Your food, movement, and weight in one calmer view.",
    setup: "Build your nutrition plan", setupBody: "Add your measurements and activity to get editable calorie, macro, and mineral targets.", setupAction: "Set up profile",
    energy: "Energy", protein: "Protein", consumed: "eaten", goal: "goal", noGoal: "Set a daily target", nutrition: "Daily nutrition", nutritionHint: "Values come from meals you logged, not a photo estimate.", left: "left", over: "over", limitLeft: "below limit", unknown: "Some meal values unknown", noTarget: "Add profile target", sodiumLimit: "upper limit",
    todayMeals: "Today's meals", noMeals: "No meals logged today.", addMeal: "Add a meal", scan: "Open camera", editMeal: "Edit", remove: "Remove meal", removeConfirm: "Remove this meal from today's log?", removed: "Meal removed.",
    weight: "Weight check-in", current: "Latest weight", noWeight: "No weight yet", kg: "kg", kcal: "kcal",
    statusTitle: "Today's goal", status: { empty: "No meals yet", noTarget: "Set targets first", partial: "More values needed", progress: "In progress", complete: "All goals met" },
    completionHint: "Complete means all nine logged nutrients meet their target; sodium stays below its limit.", mealTypes: { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" },
  },
  id: {
    eyebrow: "RINGKASAN HARI INI", hello: (name: string) => `Halo, ${name}.`, helloNew: "Mulai harimu dengan baik.", intro: "Makanan, aktivitas, dan berat badan dalam satu tampilan.",
    setup: "Buat rencana gizimu", setupBody: "Isi ukuran tubuh dan aktivitas untuk mendapat target kalori, makro, dan mineral yang bisa diubah.", setupAction: "Isi profil",
    energy: "Energi", protein: "Protein", consumed: "dikonsumsi", goal: "target", noGoal: "Tentukan target harian", nutrition: "Gizi harian", nutritionHint: "Nilai berasal dari makanan yang kamu catat, bukan perkiraan foto.", left: "tersisa", over: "melewati", limitLeft: "di bawah batas", unknown: "Sebagian nilai makanan belum diketahui", noTarget: "Isi target di profil", sodiumLimit: "batas atas",
    todayMeals: "Makanan hari ini", noMeals: "Belum ada makanan tercatat hari ini.", addMeal: "Tambah makanan", scan: "Buka kamera", editMeal: "Ubah", remove: "Hapus makanan", removeConfirm: "Hapus makanan ini dari catatan hari ini?", removed: "Makanan dihapus.",
    weight: "Catatan berat", current: "Berat terakhir", noWeight: "Belum ada berat", kg: "kg", kcal: "kkal",
    statusTitle: "Target hari ini", status: { empty: "Belum ada makanan", noTarget: "Isi target dahulu", partial: "Data belum lengkap", progress: "Sedang berjalan", complete: "Semua target tercapai" },
    completionHint: "Selesai berarti sembilan nutrisi tercatat dan mencapai target; natrium tetap di bawah batas.", mealTypes: { breakfast: "Sarapan", lunch: "Makan siang", dinner: "Makan malam", snack: "Camilan" },
  },
} as const;

function ProgressRing({ calories, calorieGoal, protein, proteinGoal, language }: { calories: number; calorieGoal: number | null; protein: number; proteinGoal: number | null; language: "en" | "id" }) {
  const outer = 2 * Math.PI * 92;
  const inner = 2 * Math.PI * 72;
  const calorieProgress = calorieGoal ? Math.min(1, calories / calorieGoal) : 0;
  const proteinProgress = proteinGoal ? Math.min(1, protein / proteinGoal) : 0;
  const number = new Intl.NumberFormat(language === "id" ? "id-ID" : "en-US", { maximumFractionDigits: 0 });
  return <div className="relative mx-auto size-[260px] sm:size-[300px]" role="img" aria-label={`${number.format(calories)} ${language === "id" ? "dari" : "of"} ${calorieGoal ? number.format(calorieGoal) : "—"} kcal`}>
    <svg className="size-full -rotate-90" viewBox="0 0 240 240" fill="none" aria-hidden="true">
      <circle cx="120" cy="120" r="92" stroke="var(--line)" strokeWidth="13" />
      <circle cx="120" cy="120" r="72" stroke="var(--line)" strokeWidth="11" />
      <circle cx="120" cy="120" r="92" stroke="var(--brand-sky)" strokeWidth="13" strokeLinecap="round" strokeDasharray={`${outer * calorieProgress} ${outer}`} />
      <circle cx="120" cy="120" r="72" stroke="var(--brand-sun)" strokeWidth="11" strokeLinecap="round" strokeDasharray={`${inner * proteinProgress} ${inner}`} />
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center"><span className="text-xs font-extrabold tracking-[.14em] text-muted">{language === "id" ? "KALORI" : "CALORIES"}</span><strong className="mt-2 text-4xl font-extrabold tracking-[-.08em] text-ink sm:text-5xl">{number.format(calories)}</strong><span className="text-sm text-muted">/ {calorieGoal ? number.format(calorieGoal) : "—"} kcal</span></div>
  </div>;
}

function NutrientCard({ name, amount, target, known, unit, isLimit, language }: { name: string; amount: number; target: number | null; known: boolean; unit: string; isLimit: boolean; language: "en" | "id" }) {
  const text = copy[language];
  const number = new Intl.NumberFormat(language === "id" ? "id-ID" : "en-US", { maximumFractionDigits: 1 });
  const progress = target && known ? Math.min(100, amount / target * 100) : 0;
  const difference = target && known ? Math.max(0, Math.round(Math.abs(target - amount) * 10) / 10) : null;
  return <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-extrabold">{name}</h3><span className="text-xs text-muted">{isLimit ? text.sodiumLimit : unit}</span></div><p className="mt-3 text-xl font-extrabold">{known ? number.format(amount) : "—"} <span className="text-xs font-medium text-muted">/ {target ? number.format(target) : "—"} {unit}</span></p><progress className={`progress mt-4 h-2 w-full ${isLimit ? target && amount > target ? "progress-error" : "progress-success" : "progress-primary"}`} value={progress} max="100" /><p className="mt-2 text-xs text-muted">{!known ? text.unknown : !target ? text.noTarget : `${number.format(difference ?? 0)} ${unit} ${amount > target ? text.over : isLimit ? text.limitLeft : text.left}`}</p></div>;
}

export function HomePage() {
  const language = useLanguage();
  const text = copy[language];
  const today = useTodayKey();
  const data = useTrackerData();
  const { profile, weights, meals } = data;
  const todayMeals = meals.filter((meal) => meal.date === today);
  const { totals, known } = sumNutrition(todayMeals);
  const status = nutritionStatus(todayMeals, profile.targets);
  const latest = weights.at(-1);
  const number = new Intl.NumberFormat(language === "id" ? "id-ID" : "en-US", { maximumFractionDigits: 1 });
  const weightUnit = profile.unitSystem === "imperial" ? "lb" : "kg";
  const dayLabel = today ? new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-US", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${today}T00:00:00Z`)) : "";

  function deleteMeal(id: string) {
    if (window.confirm(text.removeConfirm)) removeMeal(id);
  }

  return <div className="space-y-6 sm:space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[.68rem] font-extrabold tracking-[.18em] text-primary">{text.eyebrow} {dayLabel && `· ${dayLabel}`}</p><h1 className="mt-3 text-[clamp(2.4rem,7vw,4.3rem)] leading-tight font-extrabold tracking-[-.07em]">{profile.name ? text.hello(profile.name) : text.helloNew}</h1><p className="mt-2 text-sm text-muted sm:text-base">{text.intro}</p></div><WeightCheckIn /></header>
    {!isProfileComplete(data) && <section className="rounded-[1.5rem] bg-brand-lemon/45 p-6 text-ink sm:p-8"><h2 className="text-xl font-extrabold">{text.setup}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{text.setupBody}</p><Link href="/profile" className="btn btn-primary mt-5 rounded-xl font-extrabold">{text.setupAction} ↗</Link></section>}

    <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]" aria-labelledby="today-goal"><div className="rounded-[1.8rem] border border-line bg-surface p-5 text-center sm:p-8"><h2 id="today-goal" className="text-left text-xl font-extrabold">{text.statusTitle}</h2><ProgressRing calories={totals.calories} calorieGoal={profile.targets?.calories ?? null} protein={totals.protein} proteinGoal={profile.targets?.protein ?? null} language={language} /><div className="mx-auto flex max-w-sm justify-center gap-5 text-xs font-bold"><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-brand-sky" />{text.energy}</span><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-brand-sun" />{text.protein}</span></div><p className="mt-5 inline-flex rounded-full bg-primary/10 px-4 py-2 text-sm font-extrabold text-primary">{text.status[status]}</p><p className="mx-auto mt-3 max-w-sm text-xs leading-5 text-muted">{text.completionHint}</p></div><div className="grid gap-4"><div className="rounded-[1.6rem] bg-brand-blue p-6 text-white sm:p-8"><p className="text-xs font-extrabold tracking-[.14em] text-brand-lemon">{text.weight}</p><p className="mt-4 text-sm text-[#dbf3ff]">{text.current}</p><p className="mt-2 text-3xl font-extrabold">{latest ? `${number.format(displayWeight(latest.kg, profile.unitSystem))} ${weightUnit}` : text.noWeight}</p><div className="mt-5"><WeightCheckIn className="btn rounded-xl border-0 bg-brand-sun font-extrabold text-[#143345] hover:bg-brand-lemon" /></div></div><Link href="/camera#manual-meal" className="flex items-center justify-between rounded-[1.6rem] border border-line bg-surface p-6 text-xl font-extrabold hover:border-primary">{text.addMeal}<span className="grid size-11 place-items-center rounded-full bg-brand-lemon text-brand-blue" aria-hidden="true">＋</span></Link></div></section>

    <section aria-labelledby="daily-nutrition"><div className="mb-4"><h2 id="daily-nutrition" className="text-2xl font-extrabold tracking-[-.05em]">{text.nutrition}</h2><p className="mt-1 text-sm text-muted">{text.nutritionHint}</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{NUTRIENTS.map((key: Nutrient) => <NutrientCard key={key} name={nutrientLabels[language][key]} amount={totals[key]} target={profile.targets?.[key] ?? null} known={known[key]} unit={nutrientUnits[key]} isLimit={key === "sodium"} language={language} />)}</div></section>

    <section className="rounded-[1.7rem] border border-line bg-surface p-5 sm:p-8" aria-labelledby="today-meals"><div className="flex flex-wrap items-center justify-between gap-3"><h2 id="today-meals" className="text-2xl font-extrabold tracking-[-.05em]">{text.todayMeals}</h2><Link className="btn btn-outline btn-sm rounded-xl border-line text-primary" href="/camera#manual-meal">{text.addMeal}</Link></div>{todayMeals.length ? <ol className="mt-5 divide-y divide-line">{[...todayMeals].reverse().map((meal) => <li key={meal.id} className="flex items-center gap-3 py-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-sky/25 text-xl text-brand-blue" aria-hidden="true">✦</span><div className="min-w-0 flex-1"><strong className="block truncate">{meal.name}</strong><span className="text-xs text-muted">{meal.time}</span></div><span className="text-sm font-extrabold">{number.format(meal.nutrients.calories ?? 0)} {text.kcal}</span><Link className="btn btn-ghost btn-xs rounded-lg text-primary" href={"/camera?edit=" + encodeURIComponent(meal.id)}>{text.editMeal}</Link><button className="btn btn-ghost btn-xs rounded-full text-error" type="button" aria-label={`${text.remove}: ${meal.name}`} onClick={() => deleteMeal(meal.id)}>✕</button></li>)}</ol> : <div className="mt-5 rounded-2xl bg-base-200 p-6 text-sm text-muted">{text.noMeals}</div>}</section>
  </div>;
}
