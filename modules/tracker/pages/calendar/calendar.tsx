"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/shared/language";
import { WeightCheckIn } from "../../components/WeightCheckIn";
import { displayWeight, nutritionStatus, sumNutrition } from "../../nutrition";
import { useTodayKey, useTrackerData } from "../../tracker-data";

const copy = {
  en: {
    eyebrow: "YOUR TIMELINE", title: "See your consistency.", intro: "Each day shows whether logged nutrition met your full daily plan.", weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], previous: "Previous month", next: "Next month", completed: "Goals met", logged: "Days with meals", weighIns: "Weigh-ins", change: "Weight change", days: "days", entries: "entries", kg: "kg", kcal: "kcal", legend: "Complete", partial: "More nutrition data needed", progress: "In progress", weight: "Weight", meals: "Meals", noWeight: "No weight recorded", noMeals: "No meals logged", addMeal: "Add a meal", editMeal: "Edit", status: { empty: "No meals", noTarget: "No target", partial: "Values missing", progress: "In progress", complete: "Goal complete" },
  },
  id: {
    eyebrow: "LINI MASAMU", title: "Lihat konsistensimu.", intro: "Setiap hari menunjukkan apakah gizi tercatat memenuhi seluruh rencana harian.", weekdays: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"], previous: "Bulan sebelumnya", next: "Bulan berikutnya", completed: "Target tercapai", logged: "Hari dengan makanan", weighIns: "Catatan berat", change: "Perubahan berat", days: "hari", entries: "catatan", kg: "kg", kcal: "kkal", legend: "Selesai", partial: "Nilai gizi belum lengkap", progress: "Sedang berjalan", weight: "Berat", meals: "Makanan", noWeight: "Belum ada berat", noMeals: "Belum ada makanan", addMeal: "Tambah makanan", editMeal: "Ubah", status: { empty: "Belum ada makanan", noTarget: "Belum ada target", partial: "Nilai belum lengkap", progress: "Sedang berjalan", complete: "Target tercapai" },
  },
} as const;

export function CalendarPage() {
  const language = useLanguage();
  const text = copy[language];
  const { weights, meals, profile } = useTrackerData();
  const today = useTodayKey();
  const [monthOffset, setMonthOffset] = useState(0);
  const [chosenDate, setSelected] = useState<string | null>(null);
  if (!today) return <div className="h-96 animate-pulse rounded-[1.7rem] bg-base-200" aria-hidden="true" />;

  const shownMonth = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1 + monthOffset, 1);
  const year = shownMonth.getFullYear();
  const month = shownMonth.getMonth();
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  const selected = chosenDate ?? (monthOffset === 0 ? today : "");
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const dayCount = new Date(year, month + 1, 0).getDate();
  const monthMeals = meals.filter((meal) => meal.date.startsWith(prefix));
  const monthWeights = weights.filter((entry) => entry.date.startsWith(prefix));
  const daysLogged = new Set(monthMeals.map((meal) => meal.date));
  const completedDays = [...daysLogged].filter((date) => nutritionStatus(monthMeals.filter((meal) => meal.date === date), profile.targets) === "complete").length;
  const selectedMeals = meals.filter((meal) => meal.date === selected);
  const selectedWeight = weights.find((entry) => entry.date === selected);
  const selectedStatus = nutritionStatus(selectedMeals, profile.targets);
  const selectedTotals = sumNutrition(selectedMeals).totals;
  const weightChange = monthWeights.length > 1 ? monthWeights.at(-1)!.kg - monthWeights[0].kg : null;
  const locale = language === "id" ? "id-ID" : "en-US";
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const weightUnit = profile.unitSystem === "imperial" ? "lb" : "kg";
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(shownMonth);
  const dateLabel = selected ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${selected}T00:00:00Z`)) : monthLabel;

  function moveMonth(change: number) { setMonthOffset((current) => current + change); setSelected(""); }

  return <div className="mx-auto max-w-5xl space-y-6">
    <div><p className="text-[.68rem] font-extrabold tracking-[.18em] text-primary">{text.eyebrow}</p><h1 className="mt-3 text-[clamp(2.4rem,7vw,4rem)] leading-tight font-extrabold tracking-[-.07em]">{text.title}</h1><p className="mt-2 text-sm text-muted sm:text-base">{text.intro}</p></div>
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label={monthLabel}><div className="rounded-2xl border border-line bg-surface p-4"><p className="text-xs text-muted">{text.completed}</p><p className="mt-2 text-2xl font-extrabold">{completedDays} <span className="text-xs font-normal">{text.days}</span></p></div><div className="rounded-2xl border border-line bg-surface p-4"><p className="text-xs text-muted">{text.logged}</p><p className="mt-2 text-2xl font-extrabold">{daysLogged.size} <span className="text-xs font-normal">{text.days}</span></p></div><div className="rounded-2xl border border-line bg-surface p-4"><p className="text-xs text-muted">{text.weighIns}</p><p className="mt-2 text-2xl font-extrabold">{monthWeights.length} <span className="text-xs font-normal">{text.entries}</span></p></div><div className="rounded-2xl border border-line bg-surface p-4"><p className="text-xs text-muted">{text.change}</p><p className="mt-2 text-2xl font-extrabold">{weightChange === null ? "—" : `${weightChange > 0 ? "+" : ""}${number.format(displayWeight(weightChange, profile.unitSystem))}`} <span className="text-xs font-normal">{weightChange === null ? "" : weightUnit}</span></p></div></section>

    <section className="rounded-[1.7rem] border border-line bg-surface p-4 shadow-sm sm:p-8" aria-label={monthLabel}>
      <div className="mb-6 flex items-center justify-between gap-3"><button className="btn btn-ghost btn-square rounded-xl text-xl" type="button" onClick={() => moveMonth(-1)} aria-label={text.previous}>‹</button><h2 className="text-lg font-extrabold capitalize sm:text-2xl">{monthLabel}</h2><button className="btn btn-ghost btn-square rounded-xl text-xl" type="button" onClick={() => moveMonth(1)} aria-label={text.next}>›</button></div>
      <div className="grid grid-cols-7 gap-1 text-center sm:gap-2">{text.weekdays.map((day, index) => <span key={index} className="pb-2 text-[.7rem] font-extrabold text-muted sm:text-sm">{day}</span>)}{Array.from({ length: firstWeekday }, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}{Array.from({ length: dayCount }, (_, index) => {
        const day = index + 1;
        const key = `${prefix}${String(day).padStart(2, "0")}`;
        const hasWeight = weights.some((entry) => entry.date === key);
        const status = nutritionStatus(monthMeals.filter((meal) => meal.date === key), profile.targets);
        const active = selected === key;
        return <button key={key} type="button" onClick={() => setSelected(key)} aria-pressed={active} aria-label={`${day} ${monthLabel}, ${text.status[status]}${hasWeight ? `, ${text.weight}` : ""}`} className={`relative grid aspect-square w-full max-w-14 justify-self-center place-items-center rounded-full text-sm font-bold transition-colors duration-150 sm:text-base ${active ? `bg-brand-blue text-white ${status === "complete" ? "ring-2 ring-success" : ""}` : status === "complete" ? "bg-success/20 text-success ring-2 ring-success" : status === "progress" ? "bg-brand-lemon/50 text-ink ring-2 ring-brand-sun" : status === "partial" ? "bg-brand-sky/20 text-ink ring-2 ring-brand-sky" : "hover:bg-base-200"}`}><span>{day}</span>{hasWeight && <span className={`absolute bottom-1 size-1.5 rounded-full ${active ? "bg-brand-sun" : "bg-brand-blue"}`} aria-hidden="true" />}</button>;
      })}</div>
      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-5 text-xs text-muted"><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-success" />{text.legend}</span><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-brand-sun" />{text.progress}</span><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-brand-sky" />{text.partial}</span><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-brand-blue" />{text.weight}</span></div>
    </section>

    <section className="rounded-[1.5rem] border border-line bg-surface p-6 sm:p-8" aria-live="polite"><p className="text-xs font-extrabold tracking-[.14em] text-primary">{dateLabel}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-extrabold">{text.status[selectedStatus]}</h2>{selected && selected <= today && <WeightCheckIn date={selected} className="btn btn-outline btn-sm rounded-xl border-line text-primary" />}</div><div className="mt-5 grid grid-cols-3 gap-3"><div className="rounded-xl bg-base-200 p-4"><p className="text-xs text-muted">{text.meals}</p><p className="mt-2 text-lg font-extrabold">{selectedMeals.length}</p></div><div className="rounded-xl bg-base-200 p-4"><p className="text-xs text-muted">{text.weight}</p><p className="mt-2 text-lg font-extrabold">{selectedWeight ? `${number.format(displayWeight(selectedWeight.kg, profile.unitSystem))} ${weightUnit}` : "—"}</p></div><div className="rounded-xl bg-base-200 p-4"><p className="text-xs text-muted">{language === "id" ? "Kalori" : "Calories"}</p><p className="mt-2 text-lg font-extrabold">{number.format(selectedTotals.calories)} <span className="text-xs">{text.kcal}</span></p></div></div>{selectedMeals.length > 0 && <ol className="mt-5 divide-y divide-line">{selectedMeals.map((meal) => <li key={meal.id} className="flex items-center justify-between gap-3 py-3 text-sm"><span className="min-w-0 truncate"><strong>{meal.name}</strong> · {meal.time}</span><Link className="btn btn-ghost btn-xs rounded-lg text-primary" href={"/camera?edit=" + encodeURIComponent(meal.id)}>{text.editMeal}</Link></li>)}</ol>}<div className="mt-5 flex flex-wrap items-center gap-3"><Link className="btn btn-primary btn-sm rounded-xl font-extrabold" href={selected && selected <= today ? `/camera?date=${selected}#manual-meal` : "/camera#manual-meal"}>{text.addMeal}</Link>{!selectedMeals.length && <span className="text-sm text-muted">{text.noMeals}</span>}</div></section>
  </div>;
}
