"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion } from "motion/react";
import { useLanguage } from "@/shared/language";
import { useToast } from "@/shared/components/toast/ToastProvider";
import { API_ORIGIN, errorText } from "@/shared/api-client";
import { WeightCheckIn } from "../../components/WeightCheckIn";
import { displayWeight, MACRO_NUTRIENTS, NUTRIENTS, type Nutrient } from "../../nutrition";
import { nutrientLabels, nutrientUnits } from "../../nutrition-ui";
import { isProfileComplete, removeMeal, useTodayKey, useTrackerData, type MealEntry } from "../../tracker-data";
import { formatWeightDate } from "../profile/weight-history";

const copy = {
  en: {
    eyebrow: "TODAY AT A GLANCE", hello: (name: string) => `Hi, ${name}.`, helloNew: "Start your day well.", intro: "Your food, movement, and weight in one calmer view.",
    setup: "Build your nutrition plan", setupBody: "Add your measurements and activity to get editable calorie, macro, and mineral targets.", setupAction: "Set up profile",
    energy: "Energy", protein: "Protein", consumed: "eaten", goal: "goal", noGoal: "Set a daily target", nutrition: "Daily nutrition", nutritionHint: "Values come from meals you logged, not a photo estimate.", left: "left", over: "over", limitLeft: "below limit", unknown: "Some meal values unknown", noTarget: "Add profile target", sodiumLimit: "upper limit",
    todayMeals: "Today's meals", noMeals: "No meals logged today.", addMeal: "Add a meal", scan: "Open camera", editMeal: "Edit", remove: "Remove meal", removeConfirm: "Remove this meal from today's log?", cancel: "Cancel", removed: "Meal removed.", details: "Meal details", nutritionShort: "Nutrition Facts", itemsLabel: "Items", notRecorded: "Not recorded", close: "Close",
    weight: "Weight check-in", current: "Latest weight", noWeight: "No weight yet", checkInDate: "Last check-in", goalWeight: "Goal weight", notSet: "Not set", foodLog: "FOOD LOG", mealHint: "Photograph a dish for a nutrition estimate, or enter it yourself.", manualMeal: "Enter manually", kg: "kg", kcal: "kcal",
    statusTitle: "Today's goal", status: { empty: "No meals yet", noTarget: "Set targets first", partial: "More values needed", progress: "In progress", complete: "All goals met" },
    completionHint: "Complete means all nine logged nutrients meet their target; sodium stays below its limit.", mealTypes: { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" },
  },
  id: {
    eyebrow: "RINGKASAN HARI INI", hello: (name: string) => `Halo, ${name}.`, helloNew: "Mulai harimu dengan baik.", intro: "Makanan, aktivitas, dan berat badan dalam satu tampilan.",
    setup: "Buat rencana gizimu", setupBody: "Isi ukuran tubuh dan aktivitas untuk mendapat target kalori, makro, dan mineral yang bisa diubah.", setupAction: "Isi profil",
    energy: "Energi", protein: "Protein", consumed: "dikonsumsi", goal: "target", noGoal: "Tentukan target harian", nutrition: "Gizi harian", nutritionHint: "Nilai berasal dari makanan yang kamu catat, bukan perkiraan foto.", left: "tersisa", over: "melewati", limitLeft: "di bawah batas", unknown: "Sebagian nilai makanan belum diketahui", noTarget: "Isi target di profil", sodiumLimit: "batas atas",
    todayMeals: "Makanan hari ini", noMeals: "Belum ada makanan tercatat hari ini.", addMeal: "Tambah makanan", scan: "Buka kamera", editMeal: "Ubah", remove: "Hapus makanan", removeConfirm: "Hapus makanan ini dari catatan hari ini?", cancel: "Batal", removed: "Makanan dihapus.", details: "Detail makanan", nutritionShort: "Informasi Nilai Gizi", itemsLabel: "Rincian", notRecorded: "Belum dicatat", close: "Tutup",
    weight: "Catatan berat", current: "Berat terakhir", noWeight: "Belum ada berat", checkInDate: "Terakhir dicatat", goalWeight: "Berat tujuan", notSet: "Belum diatur", foodLog: "CATATAN MAKANAN", mealHint: "Foto hidangan untuk perkiraan gizi, atau isi sendiri.", manualMeal: "Isi manual", kg: "kg", kcal: "kkal",
    statusTitle: "Target hari ini", status: { empty: "Belum ada makanan", noTarget: "Isi target dahulu", partial: "Data belum lengkap", progress: "Sedang berjalan", complete: "Semua target tercapai" },
    completionHint: "Selesai berarti sembilan nutrisi tercatat dan mencapai target; natrium tetap di bawah batas.", mealTypes: { breakfast: "Sarapan", lunch: "Makan siang", dinner: "Makan malam", snack: "Camilan" },
  },
} as const;

function ProgressRing({ calories, calorieGoal, protein, proteinGoal, language }: { calories: number; calorieGoal: number | null; protein: number; proteinGoal: number | null; language: "en" | "id" }) {
  const reducedMotion = useReducedMotion();
  const animatedCalories = useMotionValue(0);
  const [shownCalories, setShownCalories] = useState(0);
  useMotionValueEvent(animatedCalories, "change", (value) => setShownCalories(Math.round(value)));
  useEffect(() => {
    if (reducedMotion) { animatedCalories.set(calories); return; }
    const controls = animate(animatedCalories, calories, { duration: 1, ease: "easeOut" });
    return () => controls.stop();
  }, [animatedCalories, calories, reducedMotion]);
  const outer = 2 * Math.PI * 92;
  const inner = 2 * Math.PI * 72;
  const calorieProgress = calorieGoal ? Math.min(1, calories / calorieGoal) : 0;
  const proteinProgress = proteinGoal ? Math.min(1, protein / proteinGoal) : 0;
  const number = new Intl.NumberFormat(language === "id" ? "id-ID" : "en-US", { maximumFractionDigits: 0 });
  return <div className="relative mx-auto size-[260px] sm:size-[300px]" role="img" aria-label={`${number.format(calories)} ${language === "id" ? "dari" : "of"} ${calorieGoal ? number.format(calorieGoal) : "—"} kcal`}>
    <svg className="size-full -rotate-90" viewBox="0 0 240 240" fill="none" aria-hidden="true">
      <circle cx="120" cy="120" r="92" stroke="var(--line)" strokeWidth="13" />
      <circle cx="120" cy="120" r="72" stroke="var(--line)" strokeWidth="11" />
      <motion.circle cx="120" cy="120" r="92" stroke="var(--brand-sky)" strokeWidth="13" strokeLinecap="round" initial={reducedMotion ? false : { strokeDasharray: `0 ${outer}` }} animate={{ strokeDasharray: `${outer * calorieProgress} ${outer}` }} transition={{ duration: reducedMotion ? 0 : 1, ease: "easeOut" }} />
      <motion.circle cx="120" cy="120" r="72" stroke="var(--brand-sun)" strokeWidth="11" strokeLinecap="round" initial={reducedMotion ? false : { strokeDasharray: `0 ${inner}` }} animate={{ strokeDasharray: `${inner * proteinProgress} ${inner}` }} transition={{ duration: reducedMotion ? 0 : 1, ease: "easeOut" }} />
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center"><span className="text-xs font-extrabold tracking-[.14em] text-muted">{language === "id" ? "KALORI" : "CALORIES"}</span><strong className="mt-2 text-4xl font-extrabold tracking-[-.08em] text-ink sm:text-5xl">{number.format(reducedMotion ? calories : shownCalories)}</strong><span className="text-sm text-muted">/ {calorieGoal ? number.format(calorieGoal) : "—"} kcal</span></div>
  </div>;
}

function NutrientCard({ name, amount, target, known, unit, isLimit, tone, language }: { name: string; amount: number; target: number | null; known: boolean; unit: string; isLimit: boolean; tone: "macro" | "micro"; language: "en" | "id" }) {
  const text = copy[language];
  const number = new Intl.NumberFormat(language === "id" ? "id-ID" : "en-US", { maximumFractionDigits: 1 });
  const progress = target && known ? Math.min(100, amount / target * 100) : 0;
  const difference = target && known ? Math.max(0, Math.round(Math.abs(target - amount) * 10) / 10) : null;
  const over = Boolean(isLimit && target && amount > target);
  return <div className={`rounded-2xl border p-4 sm:p-5 ${isLimit ? (over ? "border-error/35 bg-[var(--tone-over-bg)]" : "border-success/35 bg-[var(--tone-limit-bg)]") : tone === "macro" ? "border-primary/30 bg-[var(--tone-macro-bg)]" : "border-accent/40 bg-[var(--tone-micro-bg)]"}`}><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-extrabold">{name}</h3><span className={`rounded-full px-2.5 py-1 text-[.65rem] font-extrabold ${isLimit ? (over ? "bg-error/15 text-error" : "bg-success/15 text-success") : tone === "macro" ? "bg-primary/15 text-primary" : "bg-accent/20 text-ink"}`}>{isLimit ? text.sodiumLimit : unit}</span></div><p className="mt-3 text-2xl font-extrabold">{known ? number.format(amount) : "—"} <span className="text-xs font-medium text-muted">/ {target ? number.format(target) : "—"} {unit}</span></p><progress className={`progress mt-4 h-2 w-full ${isLimit ? (over ? "progress-error" : "progress-success") : tone === "macro" ? "progress-primary" : "progress-accent"}`} value={progress} max="100" /><p className="mt-2 text-xs text-muted">{!known ? text.unknown : !target ? text.noTarget : `${number.format(difference ?? 0)} ${unit} ${amount > target ? text.over : isLimit ? text.limitLeft : text.left}`}</p></div>;
}

export function HomePage() {
  const language = useLanguage();
  const text = copy[language];
  const showToast = useToast();
  const today = useTodayKey();
  const data = useTrackerData();
  const { profile, weights, meals } = data;
  const todayMeals = meals.filter((meal) => meal.date === today);
  const day = data.days[today];
  const totals = day?.nutrition.totals;
  const known = day?.nutrition.known;
  const targets = day?.target ?? null;
  const status = day?.nutrition.status === "no_target" ? "noTarget" : day?.nutrition.status ?? "empty";
  const latest = weights.at(-1);
  const number = new Intl.NumberFormat(language === "id" ? "id-ID" : "en-US", { maximumFractionDigits: 1 });
  const weightUnit = profile.unitSystem === "imperial" ? "lb" : "kg";
  const checkInDate = latest ? new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${latest.date}T00:00:00Z`)) : "—";
  const dayLabel = today ? new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-US", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${today}T00:00:00Z`)) : "";

  const [pendingMeal, setPendingMeal] = useState<MealEntry | null>(null);
  const [removing, setRemoving] = useState(false);
  const removeDialog = useRef<HTMLDialogElement>(null);

  function askRemove(meal: MealEntry) { setPendingMeal(meal); removeDialog.current?.showModal(); }

  const [detailMeal, setDetailMeal] = useState<MealEntry | null>(null);
  const detailDialog = useRef<HTMLDialogElement>(null);

  function openDetails(meal: MealEntry) { setDetailMeal(meal); detailDialog.current?.showModal(); }

  const detailDescription = detailMeal?.items.find((item) => item.description?.trim())?.description ?? null;

  async function confirmRemove() {
    if (!pendingMeal || removing) return;
    setRemoving(true);
    try { await removeMeal(pendingMeal.id); removeDialog.current?.close(); showToast({ en: copy.en.removed, id: copy.id.removed }, "success"); }
    catch (error) { showToast({ en: errorText(error), id: errorText(error) }, "error"); }
    finally { setRemoving(false); }
  }

  return <div className="space-y-6 sm:space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[.68rem] font-extrabold tracking-[.18em] text-primary">{text.eyebrow} {dayLabel && `· ${dayLabel}`}</p><h1 className="mt-3 text-[clamp(2.4rem,7vw,4.3rem)] leading-tight font-extrabold tracking-[-.07em]">{profile.name ? text.hello(profile.name) : text.helloNew}</h1><p className="mt-2 text-sm text-muted sm:text-base">{text.intro}</p></div><WeightCheckIn /></header>
    {!isProfileComplete(data) && <section className="rounded-[1.5rem] border border-brand-sun/30 bg-brand-lemon/15 p-6 sm:p-8"><h2 className="text-xl font-extrabold">{text.setup}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{text.setupBody}</p><Link href="/profile" className="btn btn-primary mt-5 rounded-xl font-extrabold">{text.setupAction} ↗</Link></section>}

    <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]" aria-labelledby="today-goal"><div className="rounded-[1.8rem] border border-line bg-surface p-5 text-center sm:p-8"><h2 id="today-goal" className="text-left text-xl font-extrabold">{text.statusTitle}</h2><ProgressRing calories={totals?.calories ?? 0} calorieGoal={targets?.calories ?? null} protein={totals?.protein ?? 0} proteinGoal={targets?.protein ?? null} language={language} /><div className="mx-auto flex max-w-sm justify-center gap-5 text-xs font-bold"><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-brand-sky" />{text.energy}</span><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-brand-sun" />{text.protein}</span></div><p className="mt-5 inline-flex rounded-full bg-primary/10 px-4 py-2 text-sm font-extrabold text-primary">{text.status[status]}</p><p className="mx-auto mt-3 max-w-sm text-xs leading-5 text-muted">{text.completionHint}</p></div>
      <div className="grid content-start gap-4">
        <div className="rounded-[1.6rem] bg-brand-blue p-6 text-white sm:p-8">
          <p className="text-xs font-extrabold tracking-[.14em] text-brand-lemon">{text.weight}</p>
          <p className="mt-4 text-sm text-[#dbf3ff]">{text.current}</p>
          <p className="mt-2 text-3xl font-extrabold">{latest ? `${number.format(displayWeight(latest.kg, profile.unitSystem))} ${weightUnit}` : text.noWeight}</p>
          <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-white/20 pt-4 text-sm">
            <div><dt className="text-[#dbf3ff]">{text.checkInDate}</dt><dd className="mt-1 font-extrabold">{checkInDate}</dd></div>
            <div><dt className="text-[#dbf3ff]">{text.goalWeight}</dt><dd className="mt-1 font-extrabold">{profile.goalWeightKg !== null ? `${number.format(displayWeight(profile.goalWeightKg, profile.unitSystem))} ${weightUnit}` : text.notSet}</dd></div>
          </dl>
          <div className="mt-5"><WeightCheckIn className="btn rounded-xl border-0 bg-brand-sun font-extrabold text-[#143345] hover:bg-brand-lemon" /></div>
        </div>
        <div className="rounded-[1.6rem] border border-line bg-surface p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-extrabold tracking-[.14em] text-primary">{text.foodLog}</p><h3 className="mt-2 text-xl font-extrabold">{text.addMeal}</h3></div><span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-lemon text-2xl text-brand-blue" aria-hidden="true">＋</span></div>
          <p className="mt-3 text-sm leading-6 text-muted">{text.mealHint}</p>
          <div className="mt-5 flex flex-wrap gap-2"><Link href="/camera" className="btn btn-primary rounded-xl font-extrabold">{text.scan}</Link><Link href="/camera#manual-meal" className="btn btn-outline rounded-xl border-line font-extrabold text-primary">{text.manualMeal}</Link></div>
        </div>
      </div>
    </section>

    <section aria-labelledby="daily-nutrition"><div className="mb-4"><h2 id="daily-nutrition" className="text-2xl font-extrabold tracking-[-.05em]">{text.nutrition}</h2><p className="mt-1 text-sm text-muted">{text.nutritionHint}</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{NUTRIENTS.map((key: Nutrient) => <NutrientCard key={key} name={nutrientLabels[language][key]} amount={totals?.[key] ?? 0} target={targets?.[key] ?? null} known={known?.[key] ?? true} unit={nutrientUnits[key]} isLimit={key === "sodium"} tone={MACRO_NUTRIENTS.includes(key) ? "macro" : "micro"} language={language} />)}</div></section>

    <section className="rounded-[1.7rem] border border-line bg-surface p-5 sm:p-8" aria-labelledby="today-meals">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="today-meals" className="text-2xl font-extrabold tracking-[-.05em]">{text.todayMeals}</h2><Link className="btn btn-outline btn-sm rounded-xl border-line text-primary" href="/camera#manual-meal">{text.addMeal}</Link></div>
      {todayMeals.length ? <ol className="mt-5 divide-y divide-line">{[...todayMeals].reverse().map((meal) => <li key={meal.id} className="flex flex-wrap items-center gap-2 py-4">
        <button className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left transition-colors duration-150 hover:bg-base-200/60 focus-visible:outline-2" type="button" onClick={() => openDetails(meal)} aria-label={`${meal.name} — ${text.details}`}>
          <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-sky/25 text-xl text-brand-blue"><span aria-hidden="true">✦</span>{meal.thumbnailUrl && <Image src={`${API_ORIGIN}${meal.thumbnailUrl}`} alt="" fill sizes="48px" unoptimized className="object-cover" onError={(event) => { event.currentTarget.hidden = true; }} />}</span>
          <div className="min-w-0 flex-[1_1_8rem]"><strong className="block truncate">{meal.name}</strong><span className="text-xs text-muted">{meal.time}</span></div>
        </button>
        <div className="ml-auto flex items-center gap-1"><span className="mr-2 text-right text-sm font-extrabold">{number.format(meal.nutrients.calories ?? 0)} {text.kcal}{meal.nutrients.protein !== null && <span className="block text-xs font-semibold text-muted">{number.format(meal.nutrients.protein)} {nutrientUnits.protein} {nutrientLabels[language].protein.toLowerCase()}</span>}</span><Link className="btn btn-ghost btn-xs rounded-lg text-primary" href={"/camera?edit=" + encodeURIComponent(meal.id)}>{text.editMeal}</Link><button className="btn btn-ghost btn-xs rounded-full text-error" type="button" aria-label={`${text.remove}: ${meal.name}`} onClick={() => askRemove(meal)}>✕</button></div>
      </li>)}</ol> : <div className="mt-5 rounded-2xl bg-base-200 p-6 text-sm text-muted">{text.noMeals}</div>}
    </section>

    <dialog ref={removeDialog} className="modal z-50" aria-labelledby="remove-meal-title" onClose={() => setPendingMeal(null)}>
      <div className="modal-box max-w-sm rounded-[1.6rem] border border-line bg-surface p-6 text-ink">
        <h2 id="remove-meal-title" className="text-xl font-extrabold text-error">{text.remove}</h2>
        <p className="mt-3 text-sm leading-6 text-muted">{text.removeConfirm}</p>
        {pendingMeal && <p className="mt-2 truncate text-base font-extrabold">{pendingMeal.name}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn btn-ghost rounded-xl" type="button" onClick={() => removeDialog.current?.close()}>{text.cancel}</button>
          <button className="btn btn-error rounded-xl" type="button" disabled={removing} onClick={confirmRemove}>{removing ? "…" : text.remove}</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop"><button type="submit" aria-label={text.cancel}>{text.cancel}</button></form>
    </dialog>

    <dialog ref={detailDialog} className="modal z-50" aria-labelledby="meal-detail-title" onClose={() => setDetailMeal(null)}>
      <div className="modal-box relative max-h-[calc(100dvh-2rem)] max-w-lg overflow-y-auto rounded-[1.6rem] border border-line bg-surface p-0 text-ink shadow-2xl">
        <form method="dialog" className="absolute top-4 right-4 z-10"><button className="btn btn-circle btn-sm border-0 bg-black/50 text-white backdrop-blur hover:bg-black/70" type="submit" aria-label={text.close}>✕</button></form>
        {detailMeal && <>
          {detailMeal.thumbnailUrl && <div className="relative h-52 w-full overflow-hidden bg-brand-sky/15 sm:h-60"><Image src={`${API_ORIGIN}${detailMeal.thumbnailUrl}`} alt="" fill sizes="(min-width: 640px) 32rem, 90vw" unoptimized aria-hidden className="scale-125 object-cover opacity-60 blur-2xl" onError={(event) => { event.currentTarget.hidden = true; }} /><Image src={`${API_ORIGIN}${detailMeal.thumbnailUrl}`} alt="" fill sizes="(min-width: 640px) 32rem, 90vw" unoptimized className="object-contain" onError={(event) => { event.currentTarget.hidden = true; }} /><div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(to_top,var(--surface),transparent)]" /></div>}
          <div className="p-5 sm:p-6">
          <h2 id="meal-detail-title" className="pr-12 text-2xl font-extrabold tracking-[-.03em]">{detailMeal.name}</h2>
          <p className="mt-1 text-sm text-muted">{formatWeightDate(detailMeal.date, language)} · {detailMeal.time}</p>
          {detailDescription && <p className="mt-3 text-sm leading-6 text-muted">{detailDescription}</p>}
          <div className="mt-5 rounded-xl border-2 border-ink/70 px-4 py-3">
            <p className="text-2xl font-black tracking-[-.03em]">{text.nutritionShort}</p>
            <div className="mt-2 border-t-8 border-ink/70" />
            <div className="flex items-end justify-between gap-3 pt-2"><span className="text-base font-extrabold">{nutrientLabels[language].calories}</span><span className="text-3xl font-black tracking-[-.03em]">{detailMeal.nutrients.calories === null ? "—" : number.format(detailMeal.nutrients.calories)} <span className="text-sm font-bold">{nutrientUnits.calories}</span></span></div>
            <div className="mt-2 border-t-4 border-ink/70" />
            <dl className="text-sm">{NUTRIENTS.filter((key) => key !== "calories").map((key) => { const value = detailMeal.nutrients[key]; return <div key={key} className="flex items-center justify-between gap-3 border-b border-ink/15 py-1.5 last:border-b-0"><dt className="font-extrabold">{nutrientLabels[language][key]}</dt><dd className="font-semibold">{value === null ? text.notRecorded : `${number.format(value)} ${nutrientUnits[key]}`}</dd></div>; })}</dl>
          </div>
          {detailMeal.items.length > 1 && <><h3 className="mt-6 text-xs font-extrabold tracking-[.14em] text-primary">{text.itemsLabel}</h3><ul className="mt-3 divide-y divide-line">{detailMeal.items.map((item, index) => <li key={`${item.name}-${index}`} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span className="min-w-0 flex-1"><strong className="block truncate">{item.name}</strong><span className="block text-xs text-muted">{[item.grams !== null ? `${number.format(item.grams)} g` : null, item.description].filter(Boolean).join(" · ")}</span></span><span className="font-extrabold">{item.nutrients.calories === null ? text.notRecorded : `${number.format(item.nutrients.calories)} ${text.kcal}`}</span></li>)}</ul></>}
          </div>
        </>}
      </div>
      <form method="dialog" className="modal-backdrop"><button type="submit" aria-label={text.close}>{text.close}</button></form>
    </dialog>
  </div>;
}
