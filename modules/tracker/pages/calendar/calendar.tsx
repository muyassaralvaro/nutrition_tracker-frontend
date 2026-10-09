"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/shared/language";
import { useToast } from "@/shared/components/toast/ToastProvider";
import { errorText } from "@/shared/api-client";
import { WeightCheckIn } from "../../components/WeightCheckIn";
import { displayWeight, GOAL_LOWER_RATIO, GOAL_UPPER_RATIO, isCalorieWarning } from "../../nutrition";
import { calendarDisplayStatus, loadCalendar, refreshDay, useTodayKey, useTrackerData, type CalendarSummary } from "../../tracker-data";

const copy = {
  en: {
    eyebrow: "YOUR TIMELINE", title: "See your consistency.", intro: "Each day shows whether logged nutrition met your full daily plan.", weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], previous: "Previous month", next: "Next month", completed: "Goals met", logged: "Days with meals", weighIns: "Weigh-ins", change: "Weight change", days: "days", entries: "entries", kg: "kg", kcal: "kcal", targetRange: "Goal range", calorieWarning: "Above target, within range", warningLegend: "Above calorie target", legend: "Complete", progress: "In progress", missed: "Goal not met", over: "Over-ate", weight: "Weight Log", meals: "Meals", noWeight: "No weight recorded", noMeals: "No meals logged", addMeal: "Add a meal", editMeal: "Edit", status: { empty: "No meals", noTarget: "No target", progress: "In progress", missed: "Goal not met", over: "Over-ate", complete: "Goal complete" },
  },
  id: {
    eyebrow: "LINI MASAMU", title: "Lihat konsistensimu.", intro: "Lihatlah apakah kamu memenuhi target harian-mu, setiap hari.", weekdays: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"], previous: "Bulan sebelumnya", next: "Bulan berikutnya", completed: "Target tercapai", logged: "Hari dengan makanan", weighIns: "Catatan berat", change: "Perubahan berat", days: "hari", entries: "catatan", kg: "kg", kcal: "kkal", targetRange: "Rentang target", calorieWarning: "Di atas target, masih dalam rentang", warningLegend: "Kalori di atas target", legend: "Selesai", progress: "Sedang berjalan", missed: "Belum tercapai", over: "Over Target", weight: "Catatan Berat Badan", meals: "Makanan", noWeight: "Belum ada berat", noMeals: "Belum ada makanan", addMeal: "Tambah makanan", editMeal: "Ubah", status: { empty: "Belum ada makanan", noTarget: "Belum ada target", progress: "Sedang berjalan", missed: "Belum tercapai", over: "Makan berlebih", complete: "Target tercapai" },
  },
} as const;

export function CalendarPage() {
  const language = useLanguage();
  const showToast = useToast();
  const text = copy[language];
  const { weights, meals, profile, days } = useTrackerData();
  const today = useTodayKey();
  const [monthOffset, setMonthOffset] = useState(0);
  const [chosenDate, setSelected] = useState<string | null>(null);
  const [calendar, setCalendar] = useState<CalendarSummary | null>(null);
  const monthDate = today ? new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1 + monthOffset, 1) : null;
  const monthKey = monthDate ? `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}` : "";
  useEffect(() => {
    if (!monthKey) return;
    let active = true;
    loadCalendar(monthKey).then((result) => { if (active) setCalendar(result); }).catch((error) => showToast({ en: errorText(error), id: errorText(error) }, "error"));
    return () => { active = false; };
  }, [monthKey, weights, meals, showToast]);
  const selectedDate = chosenDate ?? (monthOffset === 0 ? today : "");
  useEffect(() => {
    if (selectedDate && !days[selectedDate]) void refreshDay(selectedDate).catch((error) => showToast({ en: errorText(error), id: errorText(error) }, "error"));
  }, [selectedDate, days, showToast]);
  if (!today) return <div className="h-96 animate-pulse rounded-[1.7rem] bg-base-200" aria-hidden="true" />;

  const shownMonth = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1 + monthOffset, 1);
  const year = shownMonth.getFullYear();
  const month = shownMonth.getMonth();
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  const selected = chosenDate ?? (monthOffset === 0 ? today : "");
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const dayCount = new Date(year, month + 1, 0).getDate();
  const currentCalendar = calendar?.month === monthKey ? calendar : null;
  const calendarDays = new Map(currentCalendar?.days.map((day) => [day.date, day]) ?? []);
  const selectedDay = days[selected];
  const selectedMeals = selectedDay?.meals ?? [];
  const selectedWeight = selectedDay?.weight;
  const selectedStatus = calendarDisplayStatus(selectedDay?.nutrition.status ?? "empty", selected, today, Boolean(selectedDay?.target));
  const selectedCalories = selectedDay?.nutrition.totals.calories;
  const weightChange = currentCalendar?.weight_change_kg ?? null;
  const locale = language === "id" ? "id-ID" : "en-US";
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const calorieRange = selectedDay?.target ? `${number.format(selectedDay.target.calories * GOAL_LOWER_RATIO)}–${number.format(selectedDay.target.calories * GOAL_UPPER_RATIO)} ${text.kcal}` : null;
  const calorieWarning = Boolean(selectedDay?.nutrition.known.calories && isCalorieWarning(selectedCalories, selectedDay.target?.calories));
  const weightUnit = profile.unitSystem === "imperial" ? "lb" : "kg";
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(shownMonth);
  const dateLabel = selected ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${selected}T00:00:00Z`)) : monthLabel;

  function moveMonth(change: number) { setMonthOffset((current) => current + change); setSelected(""); }

  return <div className="mx-auto max-w-5xl space-y-6">
    <div><p className="text-[.68rem] font-extrabold tracking-[.18em] text-primary">{text.eyebrow}</p><h1 className="mt-3 text-[clamp(2.4rem,7vw,4rem)] leading-tight font-extrabold tracking-[-.07em]">{text.title}</h1><p className="mt-2 text-sm text-muted sm:text-base">{text.intro}</p></div>
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label={monthLabel}><div className="rounded-2xl border border-line bg-surface p-4"><p className="text-xs text-muted">{text.completed}</p><p className="mt-2 text-2xl font-extrabold">{currentCalendar?.completed_days ?? "—"} <span className="text-xs font-normal">{text.days}</span></p></div><div className="rounded-2xl border border-line bg-surface p-4"><p className="text-xs text-muted">{text.logged}</p><p className="mt-2 text-2xl font-extrabold">{currentCalendar?.logged_days ?? "—"} <span className="text-xs font-normal">{text.days}</span></p></div><div className="rounded-2xl border border-line bg-surface p-4"><p className="text-xs text-muted">{text.weighIns}</p><p className="mt-2 text-2xl font-extrabold">{currentCalendar?.weigh_ins ?? "—"} <span className="text-xs font-normal">{text.entries}</span></p></div><div className="rounded-2xl border border-line bg-surface p-4"><p className="text-xs text-muted">{text.change}</p><p className="mt-2 text-2xl font-extrabold">{weightChange === null ? "—" : `${weightChange > 0 ? "+" : ""}${number.format(displayWeight(weightChange, profile.unitSystem))}`} <span className="text-xs font-normal">{weightChange === null ? "" : weightUnit}</span></p></div></section>

    <section className="rounded-[1.7rem] border border-line bg-surface p-4 shadow-sm sm:p-8" aria-label={monthLabel}>
      <div className="mb-6 flex items-center justify-between gap-3"><button className="btn btn-ghost btn-square rounded-xl text-xl" type="button" onClick={() => moveMonth(-1)} aria-label={text.previous}>‹</button><h2 className="text-lg font-extrabold capitalize sm:text-2xl">{monthLabel}</h2><button className="btn btn-ghost btn-square rounded-xl text-xl" type="button" onClick={() => moveMonth(1)} aria-label={text.next}>›</button></div>
      <div className="grid grid-cols-7 gap-1 text-center sm:gap-2">{text.weekdays.map((day, index) => <span key={index} className="pb-2 text-[.7rem] font-extrabold text-muted sm:text-sm">{day}</span>)}{Array.from({ length: firstWeekday }, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}{Array.from({ length: dayCount }, (_, index) => {
        const day = index + 1;
        const key = `${prefix}${String(day).padStart(2, "0")}`;
        const calendarDay = calendarDays.get(key);
        const hasWeight = calendarDay?.weight_kg !== null && calendarDay?.weight_kg !== undefined;
        const status = calendarDisplayStatus(calendarDay?.status ?? "empty", key, today, calendarDay?.has_target ?? false);
        const warning = status === "complete" && calendarDay?.calorie_warning;
        const active = selected === key;
        return <button key={key} type="button" onClick={() => setSelected(key)} aria-pressed={active} aria-label={`${day} ${monthLabel}, ${text.status[status]}${warning ? `, ${text.calorieWarning}` : ""}${hasWeight ? `, ${text.weight}` : ""}`} className={`relative grid aspect-square w-full max-w-14 justify-self-center place-items-center rounded-full text-sm font-bold transition-colors duration-150 sm:text-base ${active ? `bg-brand-blue text-white ${status === "complete" ? warning ? "ring-2 ring-warning" : "ring-2 ring-success" : status === "over" ? "ring-2 ring-error" : ""}` : status === "complete" ? warning ? "bg-success/20 text-success ring-2 ring-warning" : "bg-success/20 text-success ring-2 ring-success" : status === "over" ? "bg-error/15 text-error ring-2 ring-error" : status === "progress" ? "bg-brand-lemon/50 text-ink ring-2 ring-brand-sun" : status === "missed" ? "bg-brand-sun/15 text-ink/80 ring-2 ring-brand-sun/70" : "hover:bg-base-200"}`}><span>{day}</span>{hasWeight && <span className={`absolute bottom-1 size-1.5 rounded-full ${active ? "bg-brand-sun" : "bg-brand-blue"}`} aria-hidden="true" />}</button>;
      })}</div>
      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-5 text-xs text-muted"><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-success" />{text.legend}</span><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-success ring-2 ring-warning" />{text.warningLegend}</span><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-brand-sun/60" />{text.missed}</span><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-error" />{text.over}</span><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-brand-sun" />{text.progress}</span><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-brand-blue" />{text.weight}</span></div>
    </section>

    <section className="rounded-[1.5rem] border border-line bg-surface p-6 sm:p-8" aria-live="polite"><p className="text-xs font-extrabold tracking-[.14em] text-primary">{dateLabel}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-extrabold">{text.status[selectedStatus]}</h2>{selected && selected <= today && <WeightCheckIn date={selected} className="btn btn-outline btn-sm rounded-xl border-line text-primary" />}</div><div className="mt-5 grid grid-cols-3 gap-3"><div className="rounded-xl bg-base-200 p-4"><p className="text-xs text-muted">{text.meals}</p><p className="mt-2 text-lg font-extrabold">{selectedMeals.length}</p></div><div className="rounded-xl bg-base-200 p-4"><p className="text-xs text-muted">{text.weight}</p><p className="mt-2 text-lg font-extrabold">{selectedWeight ? `${number.format(displayWeight(selectedWeight.kg, profile.unitSystem))} ${weightUnit}` : "—"}</p></div><div className={`rounded-xl p-4 ${calorieWarning ? "border border-warning/40 bg-warning/10" : "bg-base-200"}`}><p className="text-xs text-muted">{language === "id" ? "Kalori" : "Calories"}</p><p className="mt-2 text-lg font-extrabold">{selectedCalories === null || selectedCalories === undefined ? "—" : number.format(selectedCalories)} <span className="text-xs">{text.kcal}</span></p>{calorieRange && <p className="mt-1 text-[.65rem] leading-4 text-muted">{text.targetRange}: {calorieRange}</p>}{calorieWarning && <p className="mt-1 text-[.65rem] font-bold leading-4 text-ink">{text.calorieWarning}</p>}</div></div>{selectedMeals.length > 0 && <ol className="mt-5 divide-y divide-line">{selectedMeals.map((meal) => <li key={meal.id} className="flex items-center justify-between gap-3 py-3 text-sm"><span className="min-w-0 truncate"><strong>{meal.name}</strong> · {meal.time}</span><Link className="btn btn-ghost btn-xs rounded-lg text-primary" href={"/camera?edit=" + encodeURIComponent(meal.id)}>{text.editMeal}</Link></li>)}</ol>}<div className="mt-5 flex flex-wrap items-center gap-3"><Link className="btn btn-primary btn-sm rounded-xl font-extrabold" href={selected && selected <= today ? `/camera?date=${selected}#manual-meal` : "/camera#manual-meal"}>{text.addMeal}</Link>{!selectedMeals.length && <span className="text-sm text-muted">{text.noMeals}</span>}</div></section>
  </div>;
}
